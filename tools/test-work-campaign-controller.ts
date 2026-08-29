#!/usr/bin/env node
import { spawn, spawnSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  campaignDigest,
  loadWorkCampaignDefinition,
} from "../global/bin/work-campaign/contracts.ts";
import {
  acquireCampaignWriterLease,
} from "../global/bin/work-campaign/state.ts";
import { loadMissionDefinition, stableJson } from "../global/bin/roadmap-mission/contracts.ts";
import { readMissionStopIntent } from "../global/bin/roadmap-mission/state.ts";
import { runPortableCommand, runPortableCommandStreaming } from "../global/bin/portable-process.ts";
import { buildCampaignMissionDefinition } from "../global/bin/work-campaign/mission-handoff.ts";
import { readCurrentCampaignSeedRecords } from "../global/bin/work-campaign/materializer.ts";
import { runCampaignSupervisor } from "../global/bin/work-campaign/supervisor.ts";
import type { SemanticAssignment, SemanticAssignmentResult } from "../global/bin/work-campaign/semantic-executor.ts";
import { WORK_CAMPAIGN_CONTROLLER_SOURCE_PATHS } from "./proofs/work-campaign-source-paths.ts";

type JsonRecord = Record<string, unknown>;
type CommandResult = {
  status: number | null;
  stderr: string;
  stdout: string;
};

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const fixtureRoot = fs.mkdtempSync(path.join(os.tmpdir(), "work-campaign-controller-test-"));
const rawPath = process.env.WORK_CAMPAIGN_CONTROLLER_RAW_PATH;
const candidateId = process.env.WORK_CAMPAIGN_CONTROLLER_CANDIDATE_ID ?? "work-campaign-controller-focused";
const environmentId = process.env.WORK_CAMPAIGN_CONTROLLER_ENVIRONMENT_ID ?? null;
let processStarts = 0;
let fixtureGitMutationCalls = 0;
let fixtureOpenSpecMutationCalls = 0;
let capturedRaw: JsonRecord | null = null;

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function sha256(value: string | Buffer): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function digestFile(file: string): string {
  return sha256(fs.readFileSync(file));
}

function invoke(executable: string, args: string[], cwd: string, env?: NodeJS.ProcessEnv): CommandResult {
  processStarts++;
  const result = spawnSync(executable, args, {
    cwd,
    encoding: "utf8",
    env: env == null ? process.env : { ...process.env, ...env },
    shell: false,
    timeout: 120_000,
  });
  return {
    status: result.status,
    stderr: typeof result.stderr === "string" ? result.stderr : "",
    stdout: typeof result.stdout === "string" ? result.stdout : "",
  };
}

function requireSuccess(result: CommandResult, label: string): void {
  if (result.status !== 0) throw new Error(`${label} failed (${String(result.status)}): ${result.stderr}`);
}

function git(project: string, args: string[]): CommandResult {
  if (["add", "commit", "init"].includes(args[0] ?? "")) fixtureGitMutationCalls++;
  return invoke("git", args, project);
}

function openspec(project: string, args: string[]): CommandResult {
  if (["init", "new"].includes(args[0] ?? "")) fixtureOpenSpecMutationCalls++;
  processStarts++;
  const result = runPortableCommand(project, ["openspec", ...args], { capture: true, timeoutMs: 30_000 });
  return { status: result.status, stderr: result.stderr, stdout: result.stdout };
}

function production(project: string, operation: string, extra: string[] = [], env?: NodeJS.ProcessEnv): CommandResult {
  return invoke(process.execPath, [
    path.join(root, "global", "bin", "work-campaign.ts"),
    operation,
    "--root", project,
    "--definition", "campaign.json",
    ...extra,
  ], root, env);
}

function output(result: CommandResult): JsonRecord {
  return JSON.parse(result.stdout || result.stderr) as JsonRecord;
}

function writeJson(file: string, value: unknown): void {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, stableJson(value), { encoding: "utf8", flag: "wx" });
}

function stopOwnedProcess(pid: number): void {
  if (process.platform === "win32") {
    spawnSync("taskkill", ["/PID", String(pid), "/T", "/F"], { encoding: "utf8", shell: false, timeout: 10_000 });
    return;
  }
  try {
    process.kill(pid, "SIGTERM");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ESRCH") throw error;
  }
}

function startHealthServer(directory: string, password: string): { endpoint: string; pid: number } {
  const script = path.join(directory, "health-server.mjs");
  const endpointFile = path.join(directory, "health-endpoint.txt");
  fs.writeFileSync(script, [
    'import fs from "node:fs";',
    'import http from "node:http";',
    `const expected = ${JSON.stringify(`Basic ${Buffer.from(`opencode:${password}`, "utf8").toString("base64")}`)};`,
    `const endpointFile = ${JSON.stringify(endpointFile)};`,
    'const server = http.createServer((request, response) => {',
    '  if (request.url !== "/global/health" || request.headers.authorization !== expected) { response.writeHead(401); response.end(); return; }',
    '  response.setHeader("content-type", "application/json");',
    '  response.end(JSON.stringify({ healthy: true, version: "1.18.23" }));',
    '});',
    'server.listen(0, "127.0.0.1", () => fs.writeFileSync(endpointFile, `http://127.0.0.1:${server.address().port}`, "utf8"));',
    'process.on("SIGTERM", () => server.close(() => process.exit(0)));',
  ].join("\n"), "utf8");
  processStarts++;
  const child = spawn(process.execPath, [script], { cwd: directory, shell: false, stdio: "ignore" });
  if (child.pid == null) throw new Error("health server did not start");
  for (let attempt = 0; attempt < 100 && !fs.existsSync(endpointFile); attempt++) {
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 25);
  }
  if (!fs.existsSync(endpointFile)) {
    stopOwnedProcess(child.pid);
    throw new Error("health server did not publish its endpoint");
  }
  return { endpoint: fs.readFileSync(endpointFile, "utf8"), pid: child.pid };
}

function writeSupervisorRegistry(file: string, project: string, definitionDigest: string, endpoint: string): void {
  writeJson(file, {
    policy: {
      backoffMs: [10],
      commandTimeoutMs: 30_000,
      healthPollMs: 10,
      healthTimeoutMs: 2_000,
      logBytes: 65_536,
      logGenerations: 2,
      maxRestarts: 1,
    },
    registrations: [{
      definitionDigest,
      definitionPath: "campaign.json",
      enabled: true,
      id: "fixture-campaign",
      root: project,
    }],
    runtime: { endpoint, expectedVersion: "1.18.23" },
    schemaVersion: 1,
    workCampaignDigest: digestFile(path.join(root, "global", "bin", "work-campaign.ts")),
  });
}

function semanticAssignment(
  assignmentId: string,
  assignmentType: SemanticAssignment["assignmentType"],
  candidateDigest: string,
  definitionDigest: string,
  sourceBlockIds: string[],
): SemanticAssignment {
  return {
    assignmentId,
    assignmentType,
    budgets: { modelCalls: 1, outputBytes: 16_384, wallClockSeconds: 60 },
    campaignId: "fixture-campaign",
    candidateDigest,
    definitionDigest,
    evidenceRefs: [`assignment:${assignmentId}`],
    phase: "verify",
    request: `Perform the bounded read-only ${assignmentType} assignment for ${assignmentId}.`,
    schemaVersion: 1,
    sourceBlockIds,
  };
}

function semanticResult(
  assignment: SemanticAssignment,
  sessionRef: string,
  payload: SemanticAssignmentResult["payload"],
): SemanticAssignmentResult {
  const output = stableJson({ assignmentId: assignment.assignmentId, payload, schemaVersion: 1 });
  return {
    assignmentDigest: campaignDigest(assignment),
    assignmentId: assignment.assignmentId,
    assignmentType: assignment.assignmentType,
    campaignId: assignment.campaignId,
    candidateDigest: assignment.candidateDigest,
    cleanup: "complete",
    definitionDigest: assignment.definitionDigest,
    environment: { node: process.version, platform: process.platform },
    errorClass: "none",
    errorMessage: null,
    evidenceRefs: assignment.evidenceRefs,
    model: { agent: "fixture", modelID: "fixture-model", providerID: "fixture-provider", variant: null },
    modelCalls: 1,
    outputBytes: Buffer.byteLength(output),
    outputDigest: sha256(output),
    payload,
    phase: assignment.phase,
    resultType: "semantic-assignment-result",
    runtimeRef: `loopback:${"1".repeat(64)}`,
    schemaVersion: 1,
    sessionRef,
    status: "complete",
    toolCalls: [],
    verification: { children: 0, fileDiffs: 0, parentless: true, permissionRequests: 0, questions: 0 },
  };
}

function commitAll(project: string, message: string): void {
  requireSuccess(git(project, ["add", "--all"]), `${message} stage`);
  requireSuccess(git(project, [
    "-c", "user.name=Work Campaign Proof",
    "-c", "user.email=work-campaign@example.invalid",
    "-c", "commit.gpgsign=false",
    "commit", "-m", message,
  ]), `${message} commit`);
}

function installMissionBoundary(project: string, bin: string): void {
  const proposal = [
    "# Proposal",
    "",
    "### Outcome Capsule",
    "",
    ...["Outcome", "Operating Envelope", "Non-Goals", "Non-Deferrable Invariants", "Observable Proof", "Material Residual Risks", "Stop Line"]
      .map((field) => `- **${field}**: Disposable fixture value.`),
    "",
    "- **Bounded Falsification Review**: exempt - Disposable fixture change is Ordinary Small.",
    "",
  ].join("\n");
  fs.mkdirSync(bin, { recursive: true });
  const fakeOpenSpec = path.join(bin, "fake-openspec.mjs");
  fs.writeFileSync(fakeOpenSpec, [
    "import fs from 'node:fs';",
    "import path from 'node:path';",
    "const args = process.argv.slice(2);",
    "const changesRoot = path.resolve('openspec/changes');",
    "const active = () => fs.existsSync(changesRoot) ? fs.readdirSync(changesRoot, { withFileTypes: true }).filter((entry) => entry.isDirectory() && entry.name !== 'archive').map((entry) => entry.name).sort() : [];",
    "if (args[0] === '--version') { console.log('1.6.0'); process.exit(0); }",
    "if (args[0] === 'list' && args.includes('--json')) { console.log(JSON.stringify({ changes: active().map((name) => ({ name })) })); process.exit(0); }",
    "if (args[0] === 'status' && args.includes('--json')) { const change = args[args.indexOf('--change') + 1]; const changeRoot = path.join(changesRoot, change); console.log(JSON.stringify({ changeRoot, isComplete: true, artifacts: [{ id: 'tasks', status: 'done' }], artifactPaths: { tasks: { existingOutputPaths: [path.join(changeRoot, 'tasks.md')] } } })); process.exit(0); }",
    "if (args[0] === 'validate') { console.log(JSON.stringify({ valid: true })); process.exit(0); }",
    "if (args[0] === 'archive' && args.includes('--json')) { const change = args[1]; const source = path.join(changesRoot, change); const archiveRoot = path.join(changesRoot, 'archive'); fs.mkdirSync(archiveRoot, { recursive: true }); const destination = path.join(archiveRoot, change); fs.renameSync(source, destination); console.log(JSON.stringify({ archive: { change, archivedAs: change, path: destination, specsUpdated: false, totals: {} }, status: [] })); process.exit(0); }",
    "console.error('unexpected openspec invocation: ' + args.join(' '));",
    "process.exit(99);",
    "",
  ].join("\n"), "utf8");
  if (process.platform === "win32") {
    fs.writeFileSync(path.join(bin, "openspec.cmd"), "@echo off\r\nnode \"%~dp0fake-openspec.mjs\" %*\r\n", "utf8");
  } else {
    const wrapper = path.join(bin, "openspec");
    fs.writeFileSync(wrapper, "#!/usr/bin/env sh\nexec node \"$(dirname \"$0\")/fake-openspec.mjs\" \"$@\"\n", "utf8");
    fs.chmodSync(wrapper, 0o755);
  }
  writeJson(path.join(project, "mission-adapter.json"), {
    executorArgv: ["node", "mission-executor.mjs", "{operation}", "{changeId}", "{sliceId}", "{attempt}", "{resultPath}", "{definitionDigest}", "{missionId}"],
    maxAttemptsPerSlice: 1,
    maxWallClockMsPerSlice: 60_000,
    schemaVersion: 1,
  });
  fs.writeFileSync(path.join(project, "AGENTS.md"), "# Project Instructions\n\n## Runtime Authority\n", "utf8");
  writeJson(path.join(project, "opencode-dev-kit", "adapter.json"), {
    schemaVersion: 1,
    validation: {
      build: "node validate.mjs",
      focusedTest: "node validate.mjs",
      lint: "node validate.mjs",
      test: "node validate.mjs",
      typecheck: "node validate.mjs",
    },
  });
  fs.writeFileSync(path.join(project, "validate.mjs"), "process.exit(0);\n", "utf8");
  fs.writeFileSync(path.join(project, "proof.mjs"), "process.exit(0);\n", "utf8");
  fs.writeFileSync(path.join(project, "mission-executor.mjs"), [
    "import fs from 'node:fs';",
    "import path from 'node:path';",
    "const [operation, change, slice, attempt, resultPath, definitionDigest, missionId] = process.argv.slice(2);",
    "const campaignLease = path.join('.opencode-dev-kit', 'runtime', 'work-campaigns', 'fixture-campaign', 'writer.lock');",
    "if (fs.existsSync(campaignLease)) { console.error('campaign lease held during mission execution'); process.exit(97); }",
    "const changeRoot = path.join('openspec', 'changes', change);",
    "fs.mkdirSync(path.join(changeRoot, 'specs', 'demo'), { recursive: true });",
    `fs.writeFileSync(path.join(changeRoot, 'proposal.md'), ${JSON.stringify(proposal)});`,
    "fs.writeFileSync(path.join(changeRoot, 'history.md'), '# Strategy History\\n');",
    "fs.writeFileSync(path.join(changeRoot, 'tasks.md'), '# Tasks\\n\\n- [x] Complete disposable task.\\n');",
    "fs.writeFileSync(path.join(changeRoot, 'specs', 'demo', 'spec.md'), '# Demo\\n');",
    "fs.appendFileSync(path.join('src', 'a.ts'), '// fixed by mission\\n');",
    "const evidenceRoot = path.dirname(resultPath);",
    "fs.mkdirSync(evidenceRoot, { recursive: true });",
    "const commands = operation === 'propose' ? ['opsx-propose', 'opsx-apply'] : ['opsx-apply'];",
    "const evidenceRefs = commands.map((command) => { const file = path.join(evidenceRoot, command + '.json').replaceAll('\\\\', '/'); fs.writeFileSync(file, JSON.stringify({ command, schemaVersion: 1, status: 'completed' }) + '\\n'); return file; });",
    "fs.writeFileSync(resultPath, JSON.stringify({ attempt: Number(attempt), changeId: change, cleanup: 'complete', definitionDigest, disposition: 'completed', errorClass: 'none', errorMessage: null, evidenceRefs, guardState: 'passed', missionId, phases: commands.map((command, index) => ({ command, evidenceRef: evidenceRefs[index], status: 'completed' })), questionDisposition: 'none', rootSessionRef: 'session-campaign-mission-proof', runtimeRef: '0'.repeat(64), schemaVersion: 1, sliceId: slice, tool: 'roadmap-mission-session-executor', writerClosure: 'terminal' }, null, 2) + '\\n');",
    "process.exit(0);",
    "",
  ].join("\n"), "utf8");
  commitAll(project, "configure disposable campaign mission boundary");
}

function initializeProject(project: string): {
  candidateDigest: string;
  definitionDigest: string;
  sourceFiles: string[];
} {
  fs.mkdirSync(project);
  requireSuccess(git(project, ["init", "-b", "main"]), "git init");
  requireSuccess(git(project, ["config", "user.name", "Work Campaign Proof"]), "git fixture user.name");
  requireSuccess(git(project, ["config", "user.email", "work-campaign@example.invalid"]), "git fixture user.email");
  requireSuccess(git(project, ["config", "commit.gpgsign", "false"]), "git fixture signing policy");
  requireSuccess(openspec(project, ["init", "--tools", "none", "--no-animation", "."]), "OpenSpec init");
  const sourceFiles = ["src/a.ts", "src/b.ts"];
  fs.mkdirSync(path.join(project, "src"));
  fs.writeFileSync(path.join(project, sourceFiles[0]), "export const a = 1;\n", "utf8");
  fs.writeFileSync(path.join(project, sourceFiles[1]), "export const b = 2;\n", "utf8");
  fs.writeFileSync(path.join(project, ".gitignore"), [
    ".opencode-dev-kit/",
    ".work-campaign/evidence/",
    ".work-campaign/report.md",
    "",
  ].join("\n"), "utf8");
  const definition = {
    adapterPath: "adapter.json",
    allowedEffects: ["local-commit", "local-read", "local-write"],
    authorizationRefs: { "local-commit": "authorization:disposable-local-commit" },
    budgets: {
      evidenceBytes: 1_048_576,
      modelCalls: 6,
      processAttempts: 8,
      wallClockSeconds: 300,
      waves: 2,
    },
    campaignId: "fixture-campaign",
    checkpoint: { localCommitAuthorized: true, mode: "local-commit", workspace: "disposable" },
    evidencePath: ".work-campaign/evidence",
    exclusions: [".work-campaign/evidence"],
    hostResume: { enabled: false, supervisorRequired: false },
    outcome: "Review the declared local scope and remediate only confirmed P0/P1 work.",
    playbook: "audit-remediate",
    protectedDecisionPolicy: "owner-required",
    reportPath: ".work-campaign/report.md",
    schemaVersion: 1,
    scopeRoots: ["src"],
    statePath: ".opencode-dev-kit/runtime/work-campaigns/fixture-campaign",
    stopPolicy: {
      onBudgetExhausted: true,
      onExplicitStop: true,
      onOwnerRequired: true,
      onProtected: true,
      onUnknown: true,
    },
    validationArgv: ["node", "validate.mjs"],
  };
  const adapter = {
    adapterId: "fixture-adapter",
    inventoryArgv: ["node", "inventory.mjs"],
    realBoundaryProofArgv: ["node", "proof.mjs"],
    schemaVersion: 1,
  };
  writeJson(path.join(project, "campaign.json"), definition);
  writeJson(path.join(project, "adapter.json"), adapter);
  const definitionDigest = loadWorkCampaignDefinition(project, "campaign.json").definitionDigest;
  const sourceRows = sourceFiles.map((relative) => ({ path: relative, sha256: digestFile(path.join(project, relative)) }));
  const candidateDigest = campaignDigest(sourceRows);
  const blockA = {
    classification: "maintained",
    digest: sourceRows[0].sha256,
    exclusionReason: null,
    id: "block-a",
    kind: "file",
    path: sourceFiles[0],
    recordType: "inventory-block",
    reviewStatus: "reviewed-with-finding",
    schemaVersion: 1,
  };
  const blockB = {
    classification: "maintained",
    digest: sourceRows[1].sha256,
    exclusionReason: null,
    id: "block-b",
    kind: "file",
    path: sourceFiles[1],
    recordType: "inventory-block",
    reviewStatus: "reviewed-with-finding",
    schemaVersion: 1,
  };
  const inventoryDigest = campaignDigest([blockA, blockB]);
  const partition = {
    assignmentId: "assignment-discovery",
    blockIds: ["block-a", "block-b"],
    candidateDigest,
    evidenceRefs: ["result:partition-1"],
    id: "partition-1",
    inventoryDigest,
    producerSessionRef: "session:fake-discovery",
    recordType: "partition-result",
    schemaVersion: 1,
    status: "complete",
    workItemIds: ["item-p1", "item-p2"],
  };
  const itemP1 = {
    affectedPaths: ["src/a.ts"],
    candidateDigest,
    confidence: "high",
    effectClasses: ["local-write"],
    evidenceRefs: ["evidence:item-p1"],
    id: "item-p1",
    impact: "The accepted material outcome is blocked.",
    initialSeverity: "P1",
    likelyCause: "The current reviewed implementation omits one required branch.",
    ownedPaths: ["src/a.ts"],
    principleRef: "principle:fast-feedback",
    producerSessionRef: "session:fake-discovery",
    proposedOutcome: "Restore the bounded required branch.",
    recordType: "work-item",
    scenario: "The current local behavior fails at the reviewed boundary.",
    schemaVersion: 1,
    sourceBlockIds: ["block-a"],
    status: "confirmed",
  };
  const itemP2 = {
    affectedPaths: ["src/b.ts"],
    candidateDigest,
    confidence: "high",
    effectClasses: ["local-read"],
    evidenceRefs: ["evidence:item-p2"],
    id: "item-p2",
    impact: "The current accepted outcome remains correct.",
    initialSeverity: "P2",
    likelyCause: "The name predates the current convention.",
    ownedPaths: ["src/b.ts"],
    principleRef: "principle:yagni",
    producerSessionRef: "session:fake-discovery",
    proposedOutcome: "Retain the observation as report-only.",
    recordType: "work-item",
    scenario: "A naming improvement is useful but does not block current behavior.",
    schemaVersion: 1,
    sourceBlockIds: ["block-b"],
    status: "report-only",
  };
  const reconciliationP1 = {
    candidateDigest,
    disposition: "confirmed",
    evidenceRefs: ["result:reconcile-p1"],
    id: "reconcile-p1",
    producerSessionRef: "session:fake-reconcile-p1",
    recordType: "reconciliation-result",
    schemaVersion: 1,
    severity: "P1",
    sourceDigest: blockA.digest,
    workItemId: "item-p1",
  };
  const reconciliationP2 = {
    candidateDigest,
    disposition: "confirmed",
    evidenceRefs: ["result:reconcile-p2"],
    id: "reconcile-p2",
    producerSessionRef: "session:fake-reconcile-p2",
    recordType: "reconciliation-result",
    schemaVersion: 1,
    severity: "P2",
    sourceDigest: blockB.digest,
    workItemId: "item-p2",
  };
  const wave = {
    campaignId: definition.campaignId,
    candidateDigest,
    definitionDigest,
    id: "wave-1",
    missionDefinitionDigest: "c".repeat(64),
    recordType: "wave-manifest",
    schemaVersion: 1,
    slices: [{
      changeId: "change-p1",
      dependsOn: [],
      effectClasses: ["local-commit", "local-write"],
      expectedProof: "Run the disposable local proof.",
      id: "slice-p1",
      outcome: "Fix the confirmed P1.",
      ownedPaths: ["src/a.ts"],
      validationArgv: ["node", "validate.mjs"],
      workItemIds: ["item-p1"],
    }],
    status: "frozen",
    workItemIds: ["item-p1"],
  };
  wave.missionDefinitionDigest = buildCampaignMissionDefinition(
    loadWorkCampaignDefinition(project, "campaign.json").definition,
    definitionDigest,
    wave,
  ).definitionDigest;
  const reportSeed = {
    blockers: [{ evidenceRefs: ["blocker:mission-integration-not-enabled"], id: "mission-integration", status: "blocked", summary: "Mission integration is intentionally outside this provider-free rung." }],
    candidateDigest,
    challengeStatus: "unknown",
    definitionDigest,
    limitations: [{ evidenceRefs: ["evidence:provider-free"], id: "provider-free", summary: "Configured inference, mission execution, and host recovery are not exercised." }],
    matrixRows: [
      { blockIds: ["block-a"], evidenceRefs: ["evidence:failure-mode"], id: "failure-mode", kind: "failure-mode", status: "open", summary: "Mission execution remains the next proof boundary.", workItemIds: ["item-p1"] },
      { blockIds: ["block-b"], evidenceRefs: ["evidence:redundancy"], id: "redundancy", kind: "redundancy", status: "report-only", summary: "The non-material naming observation remains report-only.", workItemIds: ["item-p2"] },
      { blockIds: ["block-a"], evidenceRefs: ["evidence:test-gap"], id: "test-gap", kind: "test-gap", status: "open", summary: "Mission integration proof has not run.", workItemIds: ["item-p1"] },
    ],
    maximumClaim: "The reviewed provider-free fixture reaches one frozen wave and pauses before mission execution.",
    ownershipStatus: "terminal",
    proofStatus: "unknown",
    recordType: "report-seed",
    schemaVersion: 1,
    terminalState: "unknown",
    validationRows: [
      { argv: ["node", "validate.mjs"], evidenceRefs: [], id: "aggregate-validation", kind: "validation", status: "unknown", summary: "Aggregate validation has not run." },
      { argv: ["node", "proof.mjs"], evidenceRefs: [], id: "real-boundary-proof", kind: "proof", status: "unknown", summary: "The mission real boundary has not run." },
    ],
    validationStatus: "unknown",
    waveRows: [{ archiveRefs: [], checkpointRef: null, evidenceRefs: ["wave:wave-1"], id: "wave-1-current", status: "unknown", summary: "The wave is frozen but not executed.", waveId: "wave-1" }],
  };
  const records: Array<[string, unknown]> = [
    ["inputs/01-block-a.json", blockA],
    ["inputs/02-block-b.json", blockB],
    ["inputs/03-item-p1.json", itemP1],
    ["inputs/04-item-p2.json", itemP2],
    ["inputs/05-partition.json", partition],
    ["inputs/06-reconcile-p1.json", reconciliationP1],
    ["inputs/07-reconcile-p2.json", reconciliationP2],
    ["inputs/08-report.json", reportSeed],
    ["inputs/09-wave.json", wave],
  ];
  for (const [relative, record] of records) writeJson(path.join(project, relative), record);
  writeJson(path.join(project, "inputs", "phase.json"), {
    campaignId: definition.campaignId,
    candidateDigest,
    definitionDigest,
    evidenceRefs: ["result:partition-1", "result:reconcile-p1", "result:reconcile-p2"],
    inputType: "fake-semantic-phase-input",
    inventoryDigest,
    modelCalls: 0,
    recordPaths: records.map(([relative]) => relative).sort(),
    schemaVersion: 1,
    waveId: "wave-1",
  });
  commitAll(project, "fixture baseline");
  return { candidateDigest, definitionDigest, sourceFiles };
}

function cloneProject(source: string, name: string): string {
  const target = path.join(fixtureRoot, name);
  fs.cpSync(source, target, { recursive: true });
  return target;
}

function configureNoWaveScenario(project: string, ownerRequired: boolean): void {
  const blockPath = path.join(project, "inputs", "01-block-a.json");
  const block = JSON.parse(fs.readFileSync(blockPath, "utf8")) as JsonRecord;
  block.reviewStatus = "reviewed-no-finding";
  fs.writeFileSync(blockPath, stableJson(block), "utf8");
  const blockB = JSON.parse(fs.readFileSync(path.join(project, "inputs", "02-block-b.json"), "utf8")) as JsonRecord;
  const inventoryDigest = campaignDigest([block, blockB]);

  const partitionPath = path.join(project, "inputs", "05-partition.json");
  const partition = JSON.parse(fs.readFileSync(partitionPath, "utf8")) as JsonRecord;
  partition.inventoryDigest = inventoryDigest;
  partition.workItemIds = ["item-p2"];
  fs.writeFileSync(partitionPath, stableJson(partition), "utf8");

  const itemPath = path.join(project, "inputs", "04-item-p2.json");
  const item = JSON.parse(fs.readFileSync(itemPath, "utf8")) as JsonRecord;
  if (ownerRequired) {
    item.effectClasses = ["external"];
    item.initialSeverity = "P1";
    item.status = "owner-required";
  }
  fs.writeFileSync(itemPath, stableJson(item), "utf8");

  const reconciliationPath = path.join(project, "inputs", "07-reconcile-p2.json");
  const reconciliation = JSON.parse(fs.readFileSync(reconciliationPath, "utf8")) as JsonRecord;
  if (ownerRequired) reconciliation.severity = "P1";
  fs.writeFileSync(reconciliationPath, stableJson(reconciliation), "utf8");

  const reportPath = path.join(project, "inputs", "08-report.json");
  const report = JSON.parse(fs.readFileSync(reportPath, "utf8")) as JsonRecord;
  report.blockers = ownerRequired
    ? [{ evidenceRefs: ["blocker:owner-required"], id: "owner-required", status: "owner-required", summary: "The protected item requires owner authority." }]
    : [{ evidenceRefs: ["blocker:final-challenge-not-enabled"], id: "final-challenge", status: "blocked", summary: "The no-wave report requires a final challenge." }];
  report.ownershipStatus = ownerRequired ? "blocked" : "terminal";
  report.terminalState = ownerRequired ? "owner-required" : "unknown";
  report.matrixRows = (report.matrixRows as JsonRecord[])
    .filter((row) => Array.isArray(row.workItemIds) && !(row.workItemIds as string[]).includes("item-p1"));
  report.waveRows = [];
  fs.writeFileSync(reportPath, stableJson(report), "utf8");

  const phasePath = path.join(project, "inputs", "phase.json");
  const phase = JSON.parse(fs.readFileSync(phasePath, "utf8")) as JsonRecord;
  phase.recordPaths = (phase.recordPaths as string[])
    .filter((relative) => !["inputs/03-item-p1.json", "inputs/06-reconcile-p1.json", "inputs/09-wave.json"].includes(relative));
  phase.inventoryDigest = inventoryDigest;
  phase.waveId = null;
  fs.writeFileSync(phasePath, stableJson(phase), "utf8");
  commitAll(project, ownerRequired ? "owner-required no-wave fixture" : "report-only no-wave fixture");
}

function configureOwnerRequiredSibling(project: string): void {
  const itemPath = path.join(project, "inputs", "04-item-p2.json");
  const item = JSON.parse(fs.readFileSync(itemPath, "utf8")) as JsonRecord;
  item.effectClasses = ["external"];
  item.initialSeverity = "P1";
  item.status = "owner-required";
  fs.writeFileSync(itemPath, stableJson(item), "utf8");
  const reconciliationPath = path.join(project, "inputs", "07-reconcile-p2.json");
  const reconciliation = JSON.parse(fs.readFileSync(reconciliationPath, "utf8")) as JsonRecord;
  reconciliation.severity = "P1";
  fs.writeFileSync(reconciliationPath, stableJson(reconciliation), "utf8");
  const reportPath = path.join(project, "inputs", "08-report.json");
  const report = JSON.parse(fs.readFileSync(reportPath, "utf8")) as JsonRecord;
  report.blockers = [
    ...(report.blockers as JsonRecord[]),
    { evidenceRefs: ["blocker:owner-required"], id: "owner-required", status: "owner-required", summary: "The protected sibling remains owner-required." },
  ];
  report.ownershipStatus = "blocked";
  report.terminalState = "owner-required";
  fs.writeFileSync(reportPath, stableJson(report), "utf8");
  commitAll(project, "owner-required authorized-sibling fixture");
}

try {
  const project = path.join(fixtureRoot, "current");
  const baseline = initializeProject(project);
  const integrated = cloneProject(project, "mission-integration");
  const missionBin = path.join(fixtureRoot, "mission-bin");
  installMissionBoundary(integrated, missionBin);
  const missionEnv = { PATH: `${missionBin}${path.delimiter}${process.env.PATH ?? ""}` };
  const invalid = cloneProject(project, "invalid-definition");
  const dirty = cloneProject(project, "dirty-worktree");
  const active = cloneProject(project, "active-change");
  const unknownWriter = cloneProject(project, "unknown-writer");
  const investigated = cloneProject(project, "investigated-unknown");
  const stillUnknown = cloneProject(project, "still-unknown");
  const selfReconciled = cloneProject(project, "self-reconciled");
  const reportOnly = cloneProject(project, "report-only-no-wave");
  const ownerOnly = cloneProject(project, "owner-required-no-wave");
  const ownerSibling = cloneProject(project, "owner-required-sibling");

  configureNoWaveScenario(reportOnly, false);
  configureNoWaveScenario(ownerOnly, true);
  configureOwnerRequiredSibling(ownerSibling);

  const invalidDefinition = JSON.parse(fs.readFileSync(path.join(invalid, "campaign.json"), "utf8")) as JsonRecord;
  invalidDefinition.playbook = "unsupported";
  fs.writeFileSync(path.join(invalid, "campaign.json"), stableJson(invalidDefinition), "utf8");
  commitAll(invalid, "invalid definition control");

  fs.appendFileSync(path.join(dirty, "src", "a.ts"), "// dirty\n", "utf8");

  requireSuccess(openspec(active, ["new", "change", "unrelated-change", "--json"]), "active change creation");
  commitAll(active, "active change control");

  const unknownDefinition = loadWorkCampaignDefinition(unknownWriter, "campaign.json").definition;
  acquireCampaignWriterLease(unknownWriter, unknownDefinition, {
    createdAt: "2026-08-27T17:00:00.000Z",
    executableDigest: digestFile(process.execPath),
    pid: process.pid,
    processRef: `process:unknown-writer-${process.pid}`,
  });

  for (const [target, result, status] of [
    [investigated, "confirmed", "confirmed"],
    [stillUnknown, "still-unknown", "unknown-material"],
  ] as const) {
    const reconciliationPath = path.join(target, "inputs", "06-reconcile-p1.json");
    const reconciliation = JSON.parse(fs.readFileSync(reconciliationPath, "utf8")) as JsonRecord;
    reconciliation.disposition = "unknown";
    fs.writeFileSync(reconciliationPath, stableJson(reconciliation), "utf8");
    const itemPath = path.join(target, "inputs", "03-item-p1.json");
    const item = JSON.parse(fs.readFileSync(itemPath, "utf8")) as JsonRecord;
    item.status = status;
    fs.writeFileSync(itemPath, stableJson(item), "utf8");
    writeJson(path.join(target, "inputs", "08-investigate-p1.json"), {
      allowedObservations: ["read current source"],
      budgets: { modelCalls: 1, wallClockSeconds: 60 },
      evidenceRefs: [`result:investigate-p1-${result}`],
      id: `investigate-p1-${result}`,
      producerSessionRef: `session:fake-investigate-p1-${result}`,
      question: "Is the current material branch omission still present?",
      recordType: "investigation-result",
      result,
      schemaVersion: 1,
      sourceBlockIds: ["block-a"],
      workItemId: "item-p1",
    });
    const phasePath = path.join(target, "inputs", "phase.json");
    const phase = JSON.parse(fs.readFileSync(phasePath, "utf8")) as JsonRecord;
    phase.recordPaths = [...(phase.recordPaths as string[]), "inputs/08-investigate-p1.json"].sort();
    fs.writeFileSync(phasePath, stableJson(phase), "utf8");
    commitAll(target, `${result} investigation fixture`);
  }
  const selfReconciliationPath = path.join(selfReconciled, "inputs", "06-reconcile-p1.json");
  const selfReconciliation = JSON.parse(fs.readFileSync(selfReconciliationPath, "utf8")) as JsonRecord;
  selfReconciliation.producerSessionRef = "session:fake-discovery";
  fs.writeFileSync(selfReconciliationPath, stableJson(selfReconciliation), "utf8");
  commitAll(selfReconciled, "self reconciliation fixture");

  const sourceBefore = baseline.sourceFiles.map((relative) => digestFile(path.join(project, relative)));
  const statusBefore = production(project, "status");
  assert(statusBefore.status === 1 && output(statusBefore).disposition === "blocked"
    && (output(statusBefore).supervision as JsonRecord)?.action === "suppress"
    && (output(statusBefore).supervision as JsonRecord)?.reason === "not-started", "status must suppress a not-started campaign without writing state");
  const preflight = production(project, "preflight");
  assert(preflight.status === 0 && output(preflight).status === "eligible", `clean controller preflight must pass: ${preflight.stderr}`);
  assert(output(preflight).candidateDigest === baseline.candidateDigest, "preflight candidate digest must match tracked source bytes");

  const investigatedRun = production(investigated, "run", ["--phase-input", "inputs/phase.json"]);
  assert(investigatedRun.status === 3 && output(investigatedRun).disposition === "paused-external", "a fresh source-correlated confirmed investigation must clear findings freeze");
  const stillUnknownRun = production(stillUnknown, "run", ["--phase-input", "inputs/phase.json"]);
  assert(stillUnknownRun.status === 1 && String(output(stillUnknownRun).error).includes("still-unknown"), "a credible unresolved material unknown must block findings freeze");
  const selfReconciledRun = production(selfReconciled, "run", ["--phase-input", "inputs/phase.json"]);
  assert(selfReconciledRun.status === 2 && String(output(selfReconciledRun).error).includes("cannot reconcile its own candidate"), "a discovery producer must not reconcile its own candidate");

  const reportOnlyRun = production(reportOnly, "run", ["--phase-input", "inputs/phase.json"]);
  assert(reportOnlyRun.status === 3 && output(reportOnlyRun).disposition === "paused-external", `report-only input must materialize without inventing a wave or mission: status=${String(reportOnlyRun.status)} stdout=${reportOnlyRun.stdout} stderr=${reportOnlyRun.stderr}`);
  const reportOnlyTransitions = fs.readdirSync(path.join(reportOnly, ".opencode-dev-kit", "runtime", "work-campaigns", "fixture-campaign", "transitions")).sort();
  assert(reportOnlyTransitions.length === 8, "report-only no-wave input must omit wave admission and mission transitions");

  const ownerOnlyRun = production(ownerOnly, "run", ["--phase-input", "inputs/phase.json"]);
  assert(ownerOnlyRun.status === 0 && output(ownerOnlyRun).disposition === "owner-required" && output(ownerOnlyRun).errorClass === "owner-protected", "owner-only input must preserve the protected blocker without a wave");
  const ownerOnlyStatus = production(ownerOnly, "status");
  assert((output(ownerOnlyStatus).supervision as JsonRecord)?.action === "suppress"
    && (output(ownerOnlyStatus).supervision as JsonRecord)?.reason === "owner-protected", "status must suppress owner/protected work");
  const ownerOnlyTransitions = fs.readdirSync(path.join(ownerOnly, ".opencode-dev-kit", "runtime", "work-campaigns", "fixture-campaign", "transitions")).sort();
  assert(ownerOnlyTransitions.length === 8, "owner-only input must omit wave admission and mission transitions");

  const ownerSiblingRun = production(ownerSibling, "run", ["--phase-input", "inputs/phase.json"]);
  assert(ownerSiblingRun.status === 3 && output(ownerSiblingRun).disposition === "paused-external", "an authorized sibling wave may freeze while the protected item remains owner-required");

  const run = production(project, "run", ["--phase-input", "inputs/phase.json"]);
  assert(run.status === 3, `provider-free run must pause at mission boundary: ${run.stderr}`);
  const runResult = output(run);
  assert(runResult.disposition === "paused-external" && runResult.phase === "paused" && runResult.writerClosure === "terminal", "run must return the intended terminal-writer mission pause");
  const transitions = path.join(project, ".opencode-dev-kit", "runtime", "work-campaigns", "fixture-campaign", "transitions");
  const transitionFiles = fs.readdirSync(transitions).sort();
  assert(transitionFiles.length === 9, "provider-free run must append the exact nine-transition controller chain");
  const transitionRecords = transitionFiles.map((name) => JSON.parse(fs.readFileSync(path.join(transitions, name), "utf8")) as JsonRecord);
  assert(stableJson(transitionRecords.map((record) => record.kind)) === stableJson([
    "preflight", "phase-start", "phase-complete", "phase-start", "findings-freeze", "phase-start", "report-materialized", "wave-admitted", "pause",
  ]), "controller transition kinds must preserve the exact provider-free phase order");
  assert((transitionRecords[7].evidenceRefs as string[]).includes("result:reconcile-p1")
    && (transitionRecords[7].evidenceRefs as string[]).includes("result:reconcile-p2")
    && transitionRecords[7].waveId === "wave-1", "wave admission must retain exact fake result refs and wave identity");
  assert(transitionRecords[8].missionRef === null && transitionRecords[8].disposition === "paused-external", "mission integration must remain unstarted and explicit");

  const reportFile = path.join(project, ".work-campaign", "report.md");
  assert(fs.existsSync(reportFile), "provider-free run must materialize the derived report");
  const report = fs.readFileSync(reportFile, "utf8");
  assert(report.includes("| `item-p1` | P1 | confirmed |") && report.includes("| `item-p2` | P2 | report-only |"), "report must preserve P1 admission and P2 exclusion");
  const readback = production(project, "report-readback");
  assert(readback.status === 0 && output(readback).status === "report-current", `current report readback must pass: ${readback.stderr}`);
  const reportDigest = output(readback).reportDigest;

  const statusAfter = production(project, "status");
  const replay = production(project, "replay");
  assert(statusAfter.status === 0 && output(statusAfter).disposition === "paused-external", "status must report the durable mission-boundary pause");
  assert(replay.status === 0 && output(replay).disposition === "paused-external", "replay must reconstruct the same mission-boundary pause");
  const idempotentRun = production(project, "run", ["--phase-input", "inputs/phase.json"]);
  assert(idempotentRun.status === 3 && fs.readdirSync(transitions).length === 9, "rerun at the frozen boundary must not duplicate transitions or seeds");

  const budgetPaused = cloneProject(project, "budget-paused");
  const budgetStatePath = path.join(budgetPaused, ".opencode-dev-kit", "runtime", "work-campaigns", "fixture-campaign", "state.json");
  const budgetState = JSON.parse(fs.readFileSync(budgetStatePath, "utf8")) as JsonRecord;
  writeJson(path.join(budgetPaused, ".work-campaign", "evidence", "budget-pause-event.json"), {
    activeOperation: null,
    budget: budgetState.budget,
    createdAt: new Date(Date.parse(String(budgetState.createdAt)) + 1).toISOString(),
    disposition: "paused-budget",
    eventId: "provider-free-budget-pause",
    evidenceRefs: [...new Set([...(budgetState.evidenceRefs as string[]), "budget:provider-free-exhausted"])].sort(),
    identities: budgetState.identities,
    kind: "pause",
    missionRef: budgetState.missionRef,
    phase: "paused",
    schemaVersion: 1,
    stopRequested: budgetState.stopRequested,
    waveId: budgetState.waveId,
  });
  const budgetRecord = production(budgetPaused, "state-record", ["--event", ".work-campaign/evidence/budget-pause-event.json"]);
  const budgetStatus = production(budgetPaused, "status");
  assert(budgetRecord.status === 0
    && (output(budgetStatus).supervision as JsonRecord)?.action === "suppress"
    && (output(budgetStatus).supervision as JsonRecord)?.reason === "budget", "status must suppress a durable budget pause");

  const missionRun = production(integrated, "run", [
    "--phase-input", "inputs/phase.json",
    "--global-source", path.join(root, "global"),
    "--mission-adapter", "mission-adapter.json",
  ], missionEnv);
  const missionRunOutput = output(missionRun);
  const missionPreflight = invoke(process.execPath, [
    path.join(root, "global", "bin", "roadmap-mission.ts"),
    "preflight",
    "--root", integrated,
    "--global-source", path.join(root, "global"),
    "--mission", ".work-campaign/evidence/missions/wave-1/definition.json",
  ], root, missionEnv);
  assert(missionRun.status === 3
    && missionRunOutput.disposition === "paused-external"
    && missionRunOutput.phase === "mission"
    && missionRunOutput.writerClosure === "terminal", `mission-enabled run must stop before parent consumption: ${missionRun.stderr || missionRun.stdout}; preflight=${missionPreflight.stderr || missionPreflight.stdout}`);
  const integratedTransitions = path.join(integrated, ".opencode-dev-kit", "runtime", "work-campaigns", "fixture-campaign", "transitions");
  const launchTransitionFiles = fs.readdirSync(integratedTransitions).sort();
  const launchTransitions = launchTransitionFiles.map((name) => JSON.parse(fs.readFileSync(path.join(integratedTransitions, name), "utf8")) as JsonRecord);
  assert(launchTransitions.length === 9
    && launchTransitions[7].kind === "wave-admitted"
    && launchTransitions[8].kind === "mission-launch"
    && launchTransitions[8].missionRef === "mission:fixture-campaign-wave-1", "campaign must durably admit the wave before mission launch");
  assert(!fs.existsSync(path.join(integrated, ".opencode-dev-kit", "runtime", "work-campaigns", "fixture-campaign", "writer.lock")), "campaign lease must be released after mission launch");
  const missionRuntimeRoot = path.join(integrated, ".opencode-dev-kit", "runtime", "roadmap-missions");
  const missionRuntimeIds = fs.existsSync(missionRuntimeRoot) ? fs.readdirSync(missionRuntimeRoot).sort() : [];
  assert(missionRuntimeIds.includes("fixture-campaign-wave-1"), `mission runtime identity differed: ${missionRuntimeIds.join(",") || "<missing>"}; ${missionRun.stderr || missionRun.stdout}`);
  const missionStatePath = path.join(missionRuntimeRoot, "fixture-campaign-wave-1", "state.json");
  const missionState = JSON.parse(fs.readFileSync(missionStatePath, "utf8")) as JsonRecord;
  const missionTransitionRoot = path.join(missionRuntimeRoot, "fixture-campaign-wave-1", "transitions");
  const missionTransitions = fs.readdirSync(missionTransitionRoot).sort().map((name) => JSON.parse(fs.readFileSync(path.join(missionTransitionRoot, name), "utf8")) as JsonRecord);
  assert(missionState.disposition === "complete" && missionState.activeOperation == null, `mission must reach a terminal-clear completed projection: state=${stableJson(missionState)} transitions=${stableJson(missionTransitions)} run=${missionRun.stderr || missionRun.stdout}`);
  const missionStatus = production(integrated, "status");
  assert(missionStatus.status === 0
    && output(missionStatus).phase === "mission"
    && String(output(missionStatus).errorMessage).includes("resume the campaign")
    && (output(missionStatus).supervision as JsonRecord)?.action === "resume"
    && (output(missionStatus).supervision as JsonRecord)?.reason === "runtime-interruption-ready", `campaign status must advise resuming a terminal mission without consuming it: ${missionStatus.stderr || missionStatus.stdout}`);

  const installedWindowsFixtureRoot = process.env.WORK_CAMPAIGN_WINDOWS_INSTALLED_FIXTURE_ROOT;
  if (installedWindowsFixtureRoot != null) {
    assert(path.isAbsolute(installedWindowsFixtureRoot), "installed Windows fixture root must be absolute");
    assert(!fs.existsSync(installedWindowsFixtureRoot), "installed Windows fixture root must not exist");
    fs.cpSync(integrated, installedWindowsFixtureRoot, { recursive: true, errorOnExist: true });
  }

  const stoppedMission = cloneProject(integrated, "mission-stop");
  const missionStopRoot = path.join(fixtureRoot, "supervisor-stop-runtime");
  fs.mkdirSync(missionStopRoot, { recursive: true });
  const missionStopRegistry = path.join(missionStopRoot, "registry.json");
  writeSupervisorRegistry(missionStopRegistry, stoppedMission, baseline.definitionDigest, "http://127.0.0.1:9");
  const missionStop = invoke(process.execPath, [
    path.join(root, "global", "bin", "work-campaign-supervisor.ts"),
    "stop",
    "--registry", missionStopRegistry,
    "--registration", "fixture-campaign",
  ], root);
  const stoppedMissionDefinition = loadMissionDefinition(stoppedMission, ".work-campaign/evidence/missions/wave-1/definition.json");
  const missionStopIntent = readMissionStopIntent(stoppedMission, stoppedMissionDefinition);
  const missionStopRow = (output(missionStop).rows as JsonRecord[])[0];
  assert(missionStop.status === 0
    && missionStopRow.state === "stopped"
    && (missionStopRow.campaign as JsonRecord).disposition === "paused-stop"
    && missionStopIntent?.source === "campaign", `terminal mission stop must close both stop intents at paused-stop: ${missionStop.stderr || missionStop.stdout}`);

  const mismatchedParent = cloneProject(integrated, "mission-parent-mismatch");
  const mismatchedWavePath = path.join(mismatchedParent, ".work-campaign", "evidence", "waves", "wave-1.json");
  const mismatchedWave = JSON.parse(fs.readFileSync(mismatchedWavePath, "utf8")) as JsonRecord;
  mismatchedWave.candidateDigest = "f".repeat(64);
  fs.writeFileSync(mismatchedWavePath, stableJson(mismatchedWave), "utf8");
  const mismatchResume = production(mismatchedParent, "resume");
  assert(mismatchResume.status === 2
    && String(output(mismatchResume).cause).includes("parent wave"), `parent wave mismatch must block before campaign handoff consumption: ${mismatchResume.stderr || mismatchResume.stdout}`);
  assert(fs.readdirSync(path.join(mismatchedParent, ".opencode-dev-kit", "runtime", "work-campaigns", "fixture-campaign", "transitions")).length === 9, "mismatched parent resume must not append campaign transitions");

  const supervisorRoot = path.join(fixtureRoot, "supervisor-runtime");
  fs.mkdirSync(supervisorRoot, { recursive: true });
  const supervisorPassword = "provider-free-supervisor-password";
  const health = startHealthServer(supervisorRoot, supervisorPassword);
  const supervisorRegistry = path.join(supervisorRoot, "registry.json");
  writeSupervisorRegistry(supervisorRegistry, integrated, baseline.definitionDigest, health.endpoint);
  let missionResume: CommandResult;
  let supervisorDuplicateSuppressed = false;
  let supervisorRetryBackoffObserved = false;
  let supervisorSignalStopped = false;
  try {
    const signalProject = cloneProject(integrated, "supervisor-signal");
    const signalRoot = path.join(fixtureRoot, "supervisor-signal-runtime");
    fs.mkdirSync(signalRoot, { recursive: true });
    const signalRegistry = path.join(signalRoot, "registry.json");
    writeSupervisorRegistry(signalRegistry, signalProject, baseline.definitionDigest, health.endpoint);
    const signal = new AbortController();
    const signalReport = await runCampaignSupervisor({
      environment: { ...process.env, OPENCODE_SERVER_PASSWORD: supervisorPassword },
      operation: "run",
      registrationId: "fixture-campaign",
      registryPath: signalRegistry,
      signal: signal.signal,
    }, {
      runStreaming: async (_cwd, _argv, options) => {
        signal.abort();
        const stopped = options.shouldStop?.() === true;
        return {
          cleanupState: "terminal",
          forced: false,
          pid: 41_000,
          signal: "SIGINT",
          startedAt: "2026-08-28T00:00:00.000Z",
          status: null,
          stderr: "",
          stdout: "",
          stopped,
          timedOut: false,
        };
      },
      wait: async () => {},
    });
    const signalStatus = production(signalProject, "status");
    assert(signalReport.rows[0].state === "stopped"
      && signalReport.rows[0].reason === "stop-requested"
      && (output(signalStatus).supervision as JsonRecord)?.reason === "explicit-stop", "supervisor signal must record campaign stop before ending its owned child");
    supervisorSignalStopped = true;

    const duplicateProject = cloneProject(project, "supervisor-duplicate");
    const duplicateRoot = path.join(fixtureRoot, "supervisor-duplicate-runtime");
    fs.mkdirSync(duplicateRoot, { recursive: true });
    const duplicateRegistry = path.join(duplicateRoot, "registry.json");
    writeSupervisorRegistry(duplicateRegistry, duplicateProject, baseline.definitionDigest, health.endpoint);
    const duplicateLeaseRoot = path.join(duplicateRoot, "runtime", "fixture-campaign");
    fs.mkdirSync(duplicateLeaseRoot, { recursive: true });
    writeJson(path.join(duplicateLeaseRoot, "supervisor.lock"), {
      executableDigest: digestFile(process.execPath),
      owner: "campaign-supervisor",
      pid: process.pid,
      processRef: "process:existing-provider-free-supervisor",
      registrationId: "fixture-campaign",
      registryDigest: sha256(fs.readFileSync(duplicateRegistry)),
      schemaVersion: 1,
      startedAt: "2026-08-28T00:00:00.000Z",
    });
    const duplicateReport = await runCampaignSupervisor({
      environment: { ...process.env, OPENCODE_SERVER_PASSWORD: supervisorPassword },
      operation: "run",
      registrationId: "fixture-campaign",
      registryPath: duplicateRegistry,
    });
    assert(duplicateReport.rows[0].state === "unknown"
      && duplicateReport.rows[0].reason === "duplicate-supervisor"
      && fs.existsSync(path.join(duplicateLeaseRoot, "supervisor.lock")), "a live supervisor lease must suppress a duplicate without clearing ownership");
    supervisorDuplicateSuppressed = true;

    const retryProject = cloneProject(integrated, "supervisor-retry");
    const retryRoot = path.join(fixtureRoot, "supervisor-retry-runtime");
    fs.mkdirSync(retryRoot, { recursive: true });
    const retryRegistry = path.join(retryRoot, "registry.json");
    writeSupervisorRegistry(retryRegistry, retryProject, baseline.definitionDigest, health.endpoint);
    let streamingCalls = 0;
    const backoffs: number[] = [];
    const retryReport = await runCampaignSupervisor({
      environment: { ...process.env, OPENCODE_SERVER_PASSWORD: supervisorPassword },
      operation: "run",
      registrationId: "fixture-campaign",
      registryPath: retryRegistry,
    }, {
      runStreaming: async (cwd, argv, options) => {
        streamingCalls++;
        if (streamingCalls === 1) {
          return {
            cleanupState: "not-needed",
            forced: false,
            pid: 41_001,
            signal: null,
            startedAt: "2026-08-28T00:00:00.000Z",
            status: 1,
            stderr: "synthetic transient runtime failure",
            stdout: "not-json",
            stopped: false,
            timedOut: false,
          };
        }
        return await runPortableCommandStreaming(cwd, argv, options);
      },
      wait: async (milliseconds) => { backoffs.push(milliseconds); },
    });
    assert(retryReport.rows[0].state === "resumed"
      && retryReport.rows[0].attempts === 2
      && streamingCalls === 2
      && stableJson(backoffs) === stableJson([10]), "unexpected child failure must back off once and re-reconcile before a bounded successor");
    const retryTransitions = path.join(retryProject, ".opencode-dev-kit", "runtime", "work-campaigns", "fixture-campaign", "transitions");
    assert(fs.readdirSync(retryTransitions).length === 11, "bounded supervisor retry must consume the handoff exactly once");
    supervisorRetryBackoffObserved = true;

    const oldLogRoot = path.join(supervisorRoot, "runtime", "fixture-campaign", "logs");
    fs.mkdirSync(oldLogRoot, { recursive: true });
    for (const generation of ["000001", "000002"]) {
      fs.writeFileSync(path.join(oldLogRoot, `${generation}.stdout.log`), "old stdout", "utf8");
      fs.writeFileSync(path.join(oldLogRoot, `${generation}.stderr.log`), "old stderr", "utf8");
      fs.writeFileSync(path.join(oldLogRoot, `${generation}.meta.json`), "{}", "utf8");
    }
    missionResume = invoke(process.execPath, [
      path.join(root, "global", "bin", "work-campaign-supervisor.ts"),
      "run",
      "--registry", supervisorRegistry,
      "--registration", "fixture-campaign",
    ], root, { OPENCODE_SERVER_PASSWORD: supervisorPassword });
  } finally {
    stopOwnedProcess(health.pid);
  }
  const supervisorOutput = output(missionResume);
  const supervisorRows = supervisorOutput.rows as JsonRecord[];
  const supervisedCampaign = supervisorRows?.[0]?.campaign as JsonRecord;
  assert(missionResume.status === 0
    && supervisorRows?.[0]?.state === "resumed"
    && supervisorRows?.[0]?.reason === "runtime-interruption-ready"
    && supervisedCampaign?.phase === "verify"
    && supervisedCampaign?.disposition === "paused-external", `supervisor resume must consume the terminal handoff and pause for re-review: ${missionResume.stderr || missionResume.stdout}`);
  const supervisorLogs = supervisorRows[0].logs as string[];
  const supervisorPrivacyText = [
    missionResume.stdout,
    fs.readFileSync(supervisorRegistry, "utf8"),
    ...supervisorLogs.map((relative) => fs.readFileSync(path.join(supervisorRoot, relative), "utf8")),
  ].join("\n");
  assert(supervisorLogs.length === 3
    && supervisorLogs.every((relative) => fs.lstatSync(path.join(supervisorRoot, relative)).isFile())
    && !fs.existsSync(path.join(supervisorRoot, "runtime", "fixture-campaign", "logs", "000001.meta.json"))
    && fs.existsSync(path.join(supervisorRoot, "runtime", "fixture-campaign", "logs", "000002.meta.json"))
    && !supervisorPrivacyText.includes(supervisorPassword), "supervisor must preserve bounded external logs without printing or persisting its password");
  const postResumeStatus = production(integrated, "status");
  assert(postResumeStatus.status === 0
    && (output(postResumeStatus).supervision as JsonRecord)?.action === "suppress"
    && (output(postResumeStatus).supervision as JsonRecord)?.reason === "external-input-required", "consumed mission handoff must not advise another resume");
  const consumedTransitionFiles = fs.readdirSync(integratedTransitions).sort();
  const consumedTransitions = consumedTransitionFiles.map((name) => JSON.parse(fs.readFileSync(path.join(integratedTransitions, name), "utf8")) as JsonRecord);
  assert(consumedTransitions.length === 11
    && consumedTransitions[9].kind === "mission-terminal"
    && consumedTransitions[10].kind === "verification", "terminal handoff consumption must append exactly mission-terminal and verification transitions");
  const integratedReport = fs.readFileSync(path.join(integrated, ".work-campaign", "report.md"), "utf8");
  assert(integratedReport.includes("| `item-p1` | P1 | fixed-and-verified |")
    && integratedReport.includes("| `block-a` | `src/a.ts` | file | maintained | needs-rereview |")
    && integratedReport.includes("| `wave-1` | complete |"), "regenerated report must project fixed work, source re-review, and completed wave evidence");
  const duplicateResume = production(integrated, "resume");
  assert(duplicateResume.status === 3
    && fs.readdirSync(integratedTransitions).length === 11, "duplicate resume must not duplicate handoff consumption or ledger facts");

  const currentSourceRows = baseline.sourceFiles.map((relative) => ({ path: relative, sha256: digestFile(path.join(integrated, relative)) }));
  const currentCandidateDigest = campaignDigest(currentSourceRows);
  const currentBlockA = {
    classification: "maintained",
    digest: currentSourceRows[0].sha256,
    exclusionReason: null,
    id: "block-a",
    kind: "file",
    path: "src/a.ts",
    recordType: "inventory-block",
    reviewStatus: "reviewed-with-finding",
    schemaVersion: 1,
  };
  const currentBlockB = JSON.parse(fs.readFileSync(path.join(integrated, "inputs", "02-block-b.json"), "utf8")) as JsonRecord;
  const currentInventoryDigest = campaignDigest([currentBlockA, currentBlockB]);

  const multiWave = cloneProject(integrated, "two-wave");
  const multiTransitions = path.join(multiWave, ".opencode-dev-kit", "runtime", "work-campaigns", "fixture-campaign", "transitions");
  const secondItem = {
    affectedPaths: ["src/a.ts"], candidateDigest: currentCandidateDigest, confidence: "high", effectClasses: ["local-write"],
    evidenceRefs: ["result:rereview-wave-1-second"], id: "item-p1-second", impact: "A second current material branch remains incomplete.",
    initialSeverity: "P1", likelyCause: "The first correction exposed one further bounded branch.", ownedPaths: ["src/a.ts"],
    principleRef: "principle:fast-feedback", producerSessionRef: "session:rereview-wave-1-second",
    proposedOutcome: "Complete the second bounded branch.", recordType: "work-item", scenario: "The current post-wave behavior still misses one accepted case.",
    schemaVersion: 1, sourceBlockIds: ["block-a"], status: "candidate",
  };
  const secondReviewAssignment = semanticAssignment("rereview-wave-1-second", "discovery", currentCandidateDigest, baseline.definitionDigest, ["block-a"]);
  const secondReviewPartition = {
    assignmentId: secondReviewAssignment.assignmentId, blockIds: ["block-a"], candidateDigest: currentCandidateDigest,
    evidenceRefs: ["result:rereview-wave-1-second"], id: "partition-rereview-wave-1-second", inventoryDigest: currentInventoryDigest,
    producerSessionRef: "session:rereview-wave-1-second", recordType: "partition-result", schemaVersion: 1, status: "complete",
    workItemIds: ["item-p1-second"],
  };
  writeJson(path.join(multiWave, ".work-campaign", "evidence", "verification", "second-rereview-assignment.json"), secondReviewAssignment);
  writeJson(path.join(multiWave, ".work-campaign", "evidence", "verification", "second-rereview-result.json"), semanticResult(secondReviewAssignment, "session:rereview-wave-1-second", { partition: secondReviewPartition, workItems: [secondItem] } as never));
  writeJson(path.join(multiWave, ".work-campaign", "evidence", "verification", "second-rereview-block.json"), currentBlockA);
  writeJson(path.join(multiWave, ".work-campaign", "evidence", "verification", "second-rereview-input.json"), {
    assignmentPath: ".work-campaign/evidence/verification/second-rereview-assignment.json", evidenceRefs: ["evidence:rereview-wave-1-second"],
    inputType: "semantic-rereview-input", recordPaths: [".work-campaign/evidence/verification/second-rereview-block.json"],
    resultPath: ".work-campaign/evidence/verification/second-rereview-result.json", schemaVersion: 1,
  });
  const secondReview = production(multiWave, "verify", ["--verification-input", ".work-campaign/evidence/verification/second-rereview-input.json"], missionEnv);
  assert(secondReview.status === 3 && output(secondReview).phase === "synthesize"
    && String(output(secondReview).errorMessage).includes("reconciliation"), `new rereview candidate must pause for non-self reconciliation: ${secondReview.stderr || secondReview.stdout}`);

  const secondReconcileAssignment = semanticAssignment("reconcile-item-p1-second", "reconciliation", currentCandidateDigest, baseline.definitionDigest, ["block-a"]);
  const secondReconciliation = {
    candidateDigest: currentCandidateDigest, disposition: "confirmed", evidenceRefs: ["result:reconcile-item-p1-second"],
    id: "reconcile-item-p1-second", producerSessionRef: "session:reconcile-item-p1-second", recordType: "reconciliation-result",
    schemaVersion: 1, severity: "P1", sourceDigest: currentBlockA.digest, workItemId: "item-p1-second",
  };
  writeJson(path.join(multiWave, ".work-campaign", "evidence", "verification", "second-reconcile-assignment.json"), secondReconcileAssignment);
  writeJson(path.join(multiWave, ".work-campaign", "evidence", "verification", "second-reconcile-result.json"), semanticResult(secondReconcileAssignment, "session:reconcile-item-p1-second", { reconciliation: secondReconciliation } as never));
  writeJson(path.join(multiWave, ".work-campaign", "evidence", "verification", "second-reconcile-input.json"), {
    assignmentPath: ".work-campaign/evidence/verification/second-reconcile-assignment.json", evidenceRefs: ["evidence:reconcile-item-p1-second"],
    inputType: "semantic-reconciliation-input", recordPaths: [], resultPath: ".work-campaign/evidence/verification/second-reconcile-result.json", schemaVersion: 1,
  });
  const selfReconciledWave = cloneProject(multiWave, "two-wave-self-reconciliation");
  const selfReconcileResultPath = path.join(selfReconciledWave, ".work-campaign", "evidence", "verification", "second-reconcile-result.json");
  const selfReconcileResult = JSON.parse(fs.readFileSync(selfReconcileResultPath, "utf8")) as JsonRecord;
  selfReconcileResult.sessionRef = secondItem.producerSessionRef;
  ((selfReconcileResult.payload as JsonRecord).reconciliation as JsonRecord).producerSessionRef = secondItem.producerSessionRef;
  fs.writeFileSync(selfReconcileResultPath, stableJson(selfReconcileResult), "utf8");
  const rejectedSelfReconcile = production(selfReconciledWave, "verify", ["--verification-input", ".work-campaign/evidence/verification/second-reconcile-input.json"], missionEnv);
  assert(rejectedSelfReconcile.status === 2 && String(output(rejectedSelfReconcile).error).includes("non-self")
    && fs.readdirSync(path.join(selfReconciledWave, ".opencode-dev-kit", "runtime", "work-campaigns", "fixture-campaign", "transitions")).length === 12,
  "a discovery producer must not confirm its own next-wave item or advance campaign state");
  const secondReconcile = production(multiWave, "verify", ["--verification-input", ".work-campaign/evidence/verification/second-reconcile-input.json"], missionEnv);
  assert(secondReconcile.status === 3 && output(secondReconcile).phase === "synthesize"
    && String(output(secondReconcile).errorMessage).includes("synthesis"), `confirmed rereview item must pause for synthesis: ${secondReconcile.stderr || secondReconcile.stdout}`);

  const secondDefinition = loadWorkCampaignDefinition(multiWave, "campaign.json").definition;
  const secondWave = {
    campaignId: secondDefinition.campaignId, candidateDigest: currentCandidateDigest, definitionDigest: baseline.definitionDigest,
    id: "wave-0-second", missionDefinitionDigest: "d".repeat(64), recordType: "wave-manifest", schemaVersion: 1,
    slices: [{
      changeId: "change-p1-second", dependsOn: [], effectClasses: ["local-commit", "local-write"], expectedProof: "Run the second disposable local proof.",
      id: "slice-p1-second", outcome: "Fix the second confirmed P1.", ownedPaths: ["src/a.ts"],
      validationArgv: ["node", "validate.mjs"], workItemIds: ["item-p1-second"],
    }],
    status: "frozen", workItemIds: ["item-p1-second"],
  };
  secondWave.missionDefinitionDigest = buildCampaignMissionDefinition(secondDefinition, baseline.definitionDigest, secondWave as never).definitionDigest;
  const secondWaveAssignment = semanticAssignment("synthesize-wave-2", "synthesis", currentCandidateDigest, baseline.definitionDigest, ["block-a"]);
  writeJson(path.join(multiWave, ".work-campaign", "evidence", "verification", "second-wave-assignment.json"), secondWaveAssignment);
  writeJson(path.join(multiWave, ".work-campaign", "evidence", "verification", "second-wave-result.json"), semanticResult(secondWaveAssignment, "session:synthesize-wave-2", { wave: secondWave } as never));
  writeJson(path.join(multiWave, ".work-campaign", "evidence", "verification", "second-wave-input.json"), {
    assignmentPath: ".work-campaign/evidence/verification/second-wave-assignment.json", evidenceRefs: ["evidence:synthesize-wave-2"],
    inputType: "semantic-wave-input", recordPaths: [], resultPath: ".work-campaign/evidence/verification/second-wave-result.json", schemaVersion: 1,
  });
  const missingMissionOptions = cloneProject(multiWave, "two-wave-missing-mission-options");
  const rejectedMissingMission = production(missingMissionOptions, "verify", ["--verification-input", ".work-campaign/evidence/verification/second-wave-input.json"], missionEnv);
  assert(rejectedMissingMission.status === 2 && String(output(rejectedMissingMission).error).includes("mission options")
    && fs.readdirSync(path.join(missingMissionOptions, ".opencode-dev-kit", "runtime", "work-campaigns", "fixture-campaign", "transitions")).length === 13,
  "next-wave synthesis without explicit mission authority must fail before wave admission");
  const secondLaunch = production(multiWave, "verify", [
    "--verification-input", ".work-campaign/evidence/verification/second-wave-input.json", "--global-source", path.join(root, "global"),
    "--mission-adapter", "mission-adapter.json",
  ], missionEnv);
  const secondMissionPreflight = invoke(process.execPath, [
    path.join(root, "global", "bin", "roadmap-mission.ts"), "preflight", "--root", multiWave,
    "--global-source", path.join(root, "global"), "--mission", ".work-campaign/evidence/missions/wave-0-second/definition.json",
  ], root, missionEnv);
  assert(secondLaunch.status === 3 && output(secondLaunch).phase === "mission", `second frozen wave must launch through the mission owner: ${secondLaunch.stderr || secondLaunch.stdout}; preflight=${secondMissionPreflight.stderr || secondMissionPreflight.stdout}`);
  const secondLaunchKinds = fs.readdirSync(multiTransitions).sort().map((name) => (JSON.parse(fs.readFileSync(path.join(multiTransitions, name), "utf8")) as JsonRecord).kind);
  assert(stableJson(secondLaunchKinds.slice(-2)) === stableJson(["wave-admitted", "mission-launch"])
    && !fs.existsSync(path.join(path.dirname(multiTransitions), "writer.lock")), "second wave admission must precede mission launch and release the campaign lease");
  const secondResume = production(multiWave, "resume", [], missionEnv);
  assert(secondResume.status === 3 && output(secondResume).phase === "verify", `second mission must return to changed-block verification: ${secondResume.stderr || secondResume.stdout}`);

  const secondSourceRows = baseline.sourceFiles.map((relative) => ({ path: relative, sha256: digestFile(path.join(multiWave, relative)) }));
  const secondCandidateDigest = campaignDigest(secondSourceRows);
  const secondCurrentBlock = { ...currentBlockA, digest: secondSourceRows[0].sha256 };
  const secondInventoryDigest = campaignDigest([secondCurrentBlock, currentBlockB]);
  const terminalRereviewAssignment = semanticAssignment("rereview-wave-2", "discovery", secondCandidateDigest, baseline.definitionDigest, ["block-a"]);
  const terminalRereviewPartition = {
    assignmentId: terminalRereviewAssignment.assignmentId, blockIds: ["block-a"], candidateDigest: secondCandidateDigest,
    evidenceRefs: ["result:rereview-wave-2"], id: "partition-rereview-wave-2", inventoryDigest: secondInventoryDigest,
    producerSessionRef: "session:rereview-wave-2", recordType: "partition-result", schemaVersion: 1, status: "complete", workItemIds: [],
  };
  writeJson(path.join(multiWave, "inputs", "verification", "terminal-rereview-assignment.json"), terminalRereviewAssignment);
  writeJson(path.join(multiWave, "inputs", "verification", "terminal-rereview-result.json"), semanticResult(terminalRereviewAssignment, "session:rereview-wave-2", { partition: terminalRereviewPartition, workItems: [] } as never));
  writeJson(path.join(multiWave, "inputs", "verification", "terminal-rereview-block.json"), secondCurrentBlock);
  writeJson(path.join(multiWave, "inputs", "verification", "terminal-rereview-input.json"), {
    assignmentPath: "inputs/verification/terminal-rereview-assignment.json", evidenceRefs: ["evidence:rereview-wave-2"],
    inputType: "semantic-rereview-input", recordPaths: ["inputs/verification/terminal-rereview-block.json"],
    resultPath: "inputs/verification/terminal-rereview-result.json", schemaVersion: 1,
  });
  const terminalRereview = production(multiWave, "verify", ["--verification-input", "inputs/verification/terminal-rereview-input.json"], missionEnv);
  const twoWaveReadback = production(multiWave, "report-readback");
  const twoWaveClosure = output(twoWaveReadback).closure as JsonRecord;
  assert(terminalRereview.status === 3 && twoWaveClosure.validationStatus === "complete"
    && (twoWaveClosure.waves as JsonRecord).archived === 2 && (twoWaveClosure.waves as JsonRecord).checkpointed === 2,
  "two completed waves must each retain current aggregate verification, archive, and checkpoint facts");
  const twoWaveChallengeAssignment = semanticAssignment("final-challenge-wave-2", "final-challenge", secondCandidateDigest, baseline.definitionDigest, ["block-a", "block-b"]);
  writeJson(path.join(multiWave, "inputs", "verification", "two-wave-challenge-assignment.json"), twoWaveChallengeAssignment);
  writeJson(path.join(multiWave, "inputs", "verification", "two-wave-challenge-result.json"), semanticResult(twoWaveChallengeAssignment, "session:final-challenge-wave-2", { closure: { ...twoWaveClosure, challengeStatus: "complete", terminalState: "unknown" } } as never));
  writeJson(path.join(multiWave, "inputs", "verification", "two-wave-challenge-input.json"), {
    assignmentPath: "inputs/verification/two-wave-challenge-assignment.json", evidenceRefs: ["evidence:final-challenge-wave-2"],
    inputType: "semantic-final-challenge-input", recordPaths: [], resultPath: "inputs/verification/two-wave-challenge-result.json", schemaVersion: 1,
  });
  const twoWaveComplete = production(multiWave, "verify", ["--verification-input", "inputs/verification/two-wave-challenge-input.json"], missionEnv);
  const twoWaveReport = fs.readFileSync(path.join(multiWave, ".work-campaign", "report.md"), "utf8");
  assert(twoWaveComplete.status === 0 && output(twoWaveComplete).disposition === "complete"
    && twoWaveReport.includes("| `wave-1` | complete |") && twoWaveReport.includes("| `wave-0-second` | complete |")
    && twoWaveReport.includes("| `item-p2` | P2 | report-only |"), `two-wave campaign must complete without mutating the P2 control: complete=${twoWaveComplete.stderr || twoWaveComplete.stdout}; waves=${String(twoWaveReport.includes("| `wave-1` | complete |"))}/${String(twoWaveReport.includes("| `wave-2` | complete |"))}; p2=${String(twoWaveReport.includes("| `item-p2` | P2 | report-only |"))}`);

  const rereviewAssignment = semanticAssignment("rereview-wave-1", "discovery", currentCandidateDigest, baseline.definitionDigest, ["block-a"]);
  const rereviewPartition = {
    assignmentId: rereviewAssignment.assignmentId,
    blockIds: ["block-a"],
    candidateDigest: currentCandidateDigest,
    evidenceRefs: ["result:rereview-wave-1"],
    id: "partition-rereview-wave-1",
    inventoryDigest: currentInventoryDigest,
    producerSessionRef: "session:rereview-wave-1",
    recordType: "partition-result",
    schemaVersion: 1,
    status: "complete",
    workItemIds: [],
  };
  const rereviewResult = semanticResult(rereviewAssignment, "session:rereview-wave-1", { partition: rereviewPartition, workItems: [] });
  writeJson(path.join(integrated, "inputs", "verification", "rereview-assignment.json"), rereviewAssignment);
  writeJson(path.join(integrated, "inputs", "verification", "rereview-result.json"), rereviewResult);
  writeJson(path.join(integrated, "inputs", "verification", "rereview-block-a.json"), currentBlockA);
  writeJson(path.join(integrated, "inputs", "verification", "rereview-input.json"), {
    assignmentPath: "inputs/verification/rereview-assignment.json",
    evidenceRefs: ["evidence:rereview-wave-1"],
    inputType: "semantic-rereview-input",
    recordPaths: ["inputs/verification/rereview-block-a.json"],
    resultPath: "inputs/verification/rereview-result.json",
    schemaVersion: 1,
  });
  const failedVerification = cloneProject(integrated, "verification-command-failure");
  fs.writeFileSync(path.join(failedVerification, "validate.mjs"), "process.exit(7);\n", "utf8");
  const failedVerify = production(failedVerification, "verify", ["--verification-input", "inputs/verification/rereview-input.json"], missionEnv);
  assert(failedVerify.status === 1
    && String(output(failedVerify).cause).includes("exited 7")
    && fs.readdirSync(path.join(failedVerification, ".opencode-dev-kit", "runtime", "work-campaigns", "fixture-campaign", "transitions")).length === 11,
  "failed aggregate verification must preserve the pre-rereview ledger cursor and original command exit");
  const mismatchedProducer = cloneProject(integrated, "verification-producer-mismatch");
  const mismatchedResultPath = path.join(mismatchedProducer, "inputs", "verification", "rereview-result.json");
  const mismatchedResult = JSON.parse(fs.readFileSync(mismatchedResultPath, "utf8")) as JsonRecord;
  ((mismatchedResult.payload as JsonRecord).partition as JsonRecord).producerSessionRef = "session:different-producer";
  fs.writeFileSync(mismatchedResultPath, stableJson(mismatchedResult), "utf8");
  const mismatchedProducerVerify = production(mismatchedProducer, "verify", ["--verification-input", "inputs/verification/rereview-input.json"], missionEnv);
  assert(mismatchedProducerVerify.status === 2
    && String(output(mismatchedProducerVerify).error).includes("producer session"), "semantic result producer identity must be correlated before campaign mutation");

  const criticalSdet = cloneProject(integrated, "critical-sdet-pending");
  writeJson(path.join(criticalSdet, ".work-campaign", "evidence", "verification", "critical-p0-reconciliation.json"), {
    candidateDigest: currentCandidateDigest,
    disposition: "confirmed",
    evidenceRefs: ["evidence:critical-p0-reconciliation"],
    id: "critical-p0-reconciliation",
    producerSessionRef: "session:critical-p0-reconciliation",
    recordType: "reconciliation-result",
    schemaVersion: 1,
    severity: "P0",
    sourceDigest: currentBlockA.digest,
    workItemId: "item-p1",
  });
  const criticalAppend = production(criticalSdet, "ledger-append", ["--record", ".work-campaign/evidence/verification/critical-p0-reconciliation.json"], missionEnv);
  assert(criticalAppend.status === 0, `P0 reconciliation evidence must append before closure routing: ${criticalAppend.stderr || criticalAppend.stdout}`);
  const criticalRereview = production(criticalSdet, "verify", ["--verification-input", "inputs/verification/rereview-input.json"], missionEnv);
  const criticalReadback = production(criticalSdet, "report-readback");
  const criticalClosure = output(criticalReadback).closure as JsonRecord;
  const criticalReport = fs.readFileSync(path.join(criticalSdet, ".work-campaign", "report.md"), "utf8");
  assert(criticalRereview.status === 3
    && String(output(criticalRereview).errorMessage).includes("critical SDET evidence")
    && criticalClosure.terminalState === "unknown"
    && criticalReport.includes("critical-sdet-pending"), `confirmed P0 closure must record mandatory fresh test-only SDET pending without self-issuing evidence: status=${String(criticalRereview.status)} result=${criticalRereview.stdout || criticalRereview.stderr} closure=${stableJson(criticalClosure)} reportHasBlocker=${String(criticalReport.includes("critical-sdet-pending"))}`);
  const criticalChallengeAssignment = semanticAssignment("critical-final-challenge", "final-challenge", currentCandidateDigest, baseline.definitionDigest, ["block-a", "block-b"]);
  writeJson(path.join(criticalSdet, "inputs", "verification", "critical-challenge-assignment.json"), criticalChallengeAssignment);
  writeJson(path.join(criticalSdet, "inputs", "verification", "critical-challenge-result.json"), semanticResult(criticalChallengeAssignment, "session:critical-final-challenge", {
    closure: { ...criticalClosure, challengeStatus: "complete", terminalState: "unknown" },
  } as never));
  writeJson(path.join(criticalSdet, "inputs", "verification", "critical-challenge-input.json"), {
    assignmentPath: "inputs/verification/critical-challenge-assignment.json", evidenceRefs: ["evidence:critical-final-challenge"],
    inputType: "semantic-final-challenge-input", recordPaths: [], resultPath: "inputs/verification/critical-challenge-result.json", schemaVersion: 1,
  });
  const blockedCriticalComplete = production(criticalSdet, "verify", ["--verification-input", "inputs/verification/critical-challenge-input.json"], missionEnv);
  assert(blockedCriticalComplete.status === 3 && output(blockedCriticalComplete).disposition === "paused-external"
    && output(blockedCriticalComplete).terminalHandoff == null, "a final challenge must not clear mandatory critical SDET pending");

  const rereviewVerify = production(integrated, "verify", ["--verification-input", "inputs/verification/rereview-input.json"], missionEnv);
  assert(rereviewVerify.status === 3
    && output(rereviewVerify).phase === "verify"
    && output(rereviewVerify).disposition === "paused-external"
    && String(output(rereviewVerify).errorMessage).includes("final challenge"), `re-review verify must pause only for final challenge: ${rereviewVerify.stderr || rereviewVerify.stdout}`);
  const rereviewTransitionCount = fs.readdirSync(integratedTransitions).length;
  assert(rereviewTransitionCount === 12, "re-review must append exactly one campaign transition after mission consumption");
  const rereviewReadback = production(integrated, "report-readback");
  const rereviewClosure = output(rereviewReadback).closure as JsonRecord;
  assert(rereviewReadback.status === 0
    && rereviewClosure.candidateDigest === currentCandidateDigest
    && rereviewClosure.validationStatus === "complete"
    && rereviewClosure.proofStatus === "complete"
    && rereviewClosure.challengeStatus === "unknown"
    && rereviewClosure.terminalState === "unknown", "re-review report must be current, command-verified, and not yet terminal");

  const interruptedFinalization = cloneProject(integrated, "interrupted-finalization");
  const interruptedDefinition = loadWorkCampaignDefinition(interruptedFinalization, "campaign.json").definition;
  const interruptedReportSeed = readCurrentCampaignSeedRecords(interruptedFinalization, interruptedDefinition)
    .find((record) => record.recordType === "report-seed");
  assert(interruptedReportSeed?.recordType === "report-seed", "interrupted finalization fixture requires one current report seed");
  writeJson(path.join(interruptedFinalization, ".work-campaign", "evidence", "verification", "terminal-report-seed.json"), {
    ...interruptedReportSeed,
    challengeStatus: "complete",
    maximumClaim: "One disposable configured local campaign completed 1 fixed-and-verified P0/P1 item(s) across 1 archived and checkpointed wave(s) through current re-review, aggregate validation, real-boundary proof, and final challenge; population and host claims remain outside this result.",
    terminalState: "complete",
  });
  const interruptedSeedAppend = production(interruptedFinalization, "ledger-append", ["--record", ".work-campaign/evidence/verification/terminal-report-seed.json"], missionEnv);
  const interruptedMaterialize = production(interruptedFinalization, "report-materialize", [], missionEnv);
  assert(interruptedSeedAppend.status === 0 && interruptedMaterialize.status === 0, "interrupted finalization fixture must materialize a complete report seed");
  const interruptedStatePath = path.join(interruptedFinalization, ".opencode-dev-kit", "runtime", "work-campaigns", "fixture-campaign", "state.json");
  const interruptedState = JSON.parse(fs.readFileSync(interruptedStatePath, "utf8")) as JsonRecord;
  writeJson(path.join(interruptedFinalization, ".work-campaign", "evidence", "verification", "report-materialized-event.json"), {
    activeOperation: null,
    budget: interruptedState.budget,
    createdAt: new Date(Date.parse(String(interruptedState.createdAt)) + 1).toISOString(),
    disposition: "ready",
    eventId: "report-materialized-interrupted-finalization",
    evidenceRefs: [...new Set([...(interruptedState.evidenceRefs as string[]), `report:${String(output(interruptedMaterialize).reportDigest)}`])].sort(),
    identities: interruptedState.identities,
    kind: "report-materialized",
    missionRef: interruptedState.missionRef,
    phase: "verify",
    schemaVersion: 1,
    stopRequested: interruptedState.stopRequested,
    waveId: interruptedState.waveId,
  });
  const interruptedStateRecord = production(interruptedFinalization, "state-record", ["--event", ".work-campaign/evidence/verification/report-materialized-event.json"], missionEnv);
  assert(interruptedStateRecord.status === 0, `interrupted finalization report transition must append: ${interruptedStateRecord.stderr || interruptedStateRecord.stdout}`);
  const interruptedVerificationRoot = path.join(interruptedFinalization, ".work-campaign", "evidence", "verification", currentCandidateDigest);
  const interruptedArtifact = fs.readdirSync(interruptedVerificationRoot).find((name) => name.startsWith("aggregate-validation-"));
  assert(interruptedArtifact != null, "interrupted finalization requires one current validation artifact");
  const interruptedArtifactPath = path.join(interruptedVerificationRoot, interruptedArtifact);
  const interruptedArtifactSource = fs.readFileSync(interruptedArtifactPath, "utf8");
  fs.appendFileSync(interruptedArtifactPath, " ", "utf8");
  const interruptedTransitionRoot = path.join(interruptedFinalization, ".opencode-dev-kit", "runtime", "work-campaigns", "fixture-campaign", "transitions");
  const interruptedTransitionCount = fs.readdirSync(interruptedTransitionRoot).length;
  const interruptedResume = production(interruptedFinalization, "resume", [], missionEnv);
  const interruptedPausedTransitionCount = fs.readdirSync(interruptedTransitionRoot).length;
  assert(interruptedResume.status === 3 && output(interruptedResume).disposition === "paused-external"
    && output(interruptedResume).operation === "resume"
    && output(interruptedResume).terminalHandoff == null
    && interruptedPausedTransitionCount === interruptedTransitionCount + 1,
  `report-materialized recovery must persist a current-evidence pause before terminal completion: status=${String(interruptedResume.status)} result=${interruptedResume.stdout || interruptedResume.stderr} transitions=${String(interruptedTransitionCount)}->${String(interruptedPausedTransitionCount)}`);
  const interruptedStatus = production(interruptedFinalization, "status", [], missionEnv);
  const interruptedReplay = production(interruptedFinalization, "replay", [], missionEnv);
  assert(interruptedStatus.status === 0 && interruptedReplay.status === 0
    && output(interruptedStatus).operation === "status" && output(interruptedReplay).operation === "replay"
    && output(interruptedStatus).disposition === "paused-external" && output(interruptedReplay).disposition === "paused-external"
    && (output(interruptedStatus).supervision as JsonRecord)?.reason === "definition-or-project-drift",
  "status and replay must reconstruct the same durable terminal-evidence pause");
  fs.writeFileSync(interruptedArtifactPath, interruptedArtifactSource, "utf8");
  const interruptedRestoredStatus = production(interruptedFinalization, "status", [], missionEnv);
  const interruptedRecovered = production(interruptedFinalization, "resume", [], missionEnv);
  assert((output(interruptedRestoredStatus).supervision as JsonRecord)?.action === "resume"
    && (output(interruptedRestoredStatus).supervision as JsonRecord)?.reason === "terminal-evidence-restored"
    && interruptedRecovered.status === 0 && output(interruptedRecovered).operation === "resume"
    && output(interruptedRecovered).disposition === "complete" && output(interruptedRecovered).terminalHandoff != null,
  "restored current evidence must resume the durable pause through terminal completion");
  const duplicateRereviewVerify = production(integrated, "verify", ["--verification-input", "inputs/verification/rereview-input.json"], missionEnv);
  const postRereviewResume = production(integrated, "resume");
  assert(duplicateRereviewVerify.status === 3 && postRereviewResume.status === 3
    && fs.readdirSync(integratedTransitions).length === rereviewTransitionCount,
  "duplicate verify and resume after re-review must not re-consume the mission or duplicate records");

  const challengeAssignment = semanticAssignment("final-challenge-wave-1", "final-challenge", currentCandidateDigest, baseline.definitionDigest, ["block-a", "block-b"]);
  const challengedClosure = { ...rereviewClosure, challengeStatus: "complete", terminalState: "unknown" };
  const challengeResult = semanticResult(challengeAssignment, "session:final-challenge-wave-1", { closure: challengedClosure as never });
  writeJson(path.join(integrated, "inputs", "verification", "challenge-assignment.json"), challengeAssignment);
  writeJson(path.join(integrated, "inputs", "verification", "challenge-result.json"), challengeResult);
  writeJson(path.join(integrated, "inputs", "verification", "challenge-input.json"), {
    assignmentPath: "inputs/verification/challenge-assignment.json",
    evidenceRefs: ["evidence:final-challenge-wave-1"],
    inputType: "semantic-final-challenge-input",
    recordPaths: [],
    resultPath: "inputs/verification/challenge-result.json",
    schemaVersion: 1,
  });
  const staleCandidate = cloneProject(integrated, "stale-terminal-candidate");
  fs.appendFileSync(path.join(staleCandidate, "src", "a.ts"), "// drift after aggregate proof\n", "utf8");
  const staleCandidateVerify = production(staleCandidate, "verify", ["--verification-input", "inputs/verification/challenge-input.json"], missionEnv);
  assert(staleCandidateVerify.status === 3 && String(output(staleCandidateVerify).errorMessage).includes("tracked source differs")
    && output(staleCandidateVerify).terminalHandoff == null, "source drift after aggregate proof must prevent terminal completion");
  const staleArtifact = cloneProject(integrated, "stale-terminal-artifact");
  const currentVerificationRoot = path.join(staleArtifact, ".work-campaign", "evidence", "verification", currentCandidateDigest);
  const validationArtifact = fs.readdirSync(currentVerificationRoot).find((name) => name.startsWith("aggregate-validation-"));
  assert(validationArtifact != null, "current aggregate validation artifact must exist before drift control");
  fs.appendFileSync(path.join(currentVerificationRoot, validationArtifact), " ", "utf8");
  const staleArtifactVerify = production(staleArtifact, "verify", ["--verification-input", "inputs/verification/challenge-input.json"], missionEnv);
  assert(staleArtifactVerify.status === 3 && String(output(staleArtifactVerify).errorMessage).includes("evidence is missing, stale, or unreadable")
    && output(staleArtifactVerify).terminalHandoff == null, "current validation artifact drift must prevent terminal completion while historical wave artifacts remain admissible");
  const unauthorizedChallenge = cloneProject(integrated, "unauthorized-terminal-challenge");
  const unauthorizedResultPath = path.join(unauthorizedChallenge, "inputs", "verification", "challenge-result.json");
  const unauthorizedResult = JSON.parse(fs.readFileSync(unauthorizedResultPath, "utf8")) as JsonRecord;
  ((unauthorizedResult.payload as JsonRecord).closure as JsonRecord).terminalState = "complete";
  fs.writeFileSync(unauthorizedResultPath, stableJson(unauthorizedResult), "utf8");
  const unauthorizedVerify = production(unauthorizedChallenge, "verify", ["--verification-input", "inputs/verification/challenge-input.json"], missionEnv);
  assert(unauthorizedVerify.status === 2
    && String(output(unauthorizedVerify).error).includes("pre-challenge closure"), "model-supplied terminal completion must fail before campaign mutation");

  const finalVerify = production(integrated, "verify", ["--verification-input", "inputs/verification/challenge-input.json"], missionEnv);
  const finalOutput = output(finalVerify);
  const terminalHandoff = finalOutput.terminalHandoff as JsonRecord;
  assert(finalVerify.status === 0
    && finalOutput.phase === "complete"
    && finalOutput.disposition === "complete"
    && finalOutput.writerClosure === "terminal"
    && terminalHandoff.candidateDigest === currentCandidateDigest
    && terminalHandoff.definitionDigest === baseline.definitionDigest
    && terminalHandoff.maximumClaim === "One disposable configured local campaign completed 1 fixed-and-verified P0/P1 item(s) across 1 archived and checkpointed wave(s) through current re-review, aggregate validation, real-boundary proof, and final challenge; population and host claims remain outside this result."
    && (terminalHandoff.closure as JsonRecord).terminalState === "complete", `final challenge must emit one exact current terminal handoff: ${finalVerify.stderr || finalVerify.stdout}`);
  const terminalTransitionFiles = fs.readdirSync(integratedTransitions).sort();
  const terminalTransitions = terminalTransitionFiles.map((name) => JSON.parse(fs.readFileSync(path.join(integratedTransitions, name), "utf8")) as JsonRecord);
  assert(terminalTransitions.length === 14
    && terminalTransitions[12].kind === "report-materialized"
    && terminalTransitions[13].kind === "terminal-complete", "final challenge must append report-materialized then terminal-complete exactly once");
  const finalReadback = production(integrated, "report-readback");
  const finalStatus = production(integrated, "status");
  const finalClosure = output(finalReadback).closure as JsonRecord;
  const finalReport = fs.readFileSync(path.join(integrated, ".work-campaign", "report.md"), "utf8");
  assert(finalReadback.status === 0
    && finalClosure.terminalState === "complete"
    && finalClosure.challengeStatus === "complete"
    && finalClosure.candidateDigest === currentCandidateDigest
    && finalReport.includes("| `item-p2` | P2 | report-only |")
    && (output(finalStatus).supervision as JsonRecord)?.action === "suppress"
    && (output(finalStatus).supervision as JsonRecord)?.reason === "complete", "terminal report must retain current identity, complete challenge, and suppress an already complete campaign");
  const duplicateFinalVerify = production(integrated, "verify", ["--verification-input", "inputs/verification/challenge-input.json"], missionEnv);
  const terminalResume = production(integrated, "resume");
  const terminalReplay = production(integrated, "replay");
  assert(duplicateFinalVerify.status === 0 && terminalResume.status === 0 && terminalReplay.status === 0
    && output(terminalResume).disposition === "complete" && output(terminalReplay).disposition === "complete"
    && output(terminalResume).terminalHandoff != null && output(terminalReplay).terminalHandoff != null
    && fs.readdirSync(integratedTransitions).length === terminalTransitionFiles.length,
  "terminal verify, resume, and replay must be idempotent and reconstruction-safe");
  const staleCompletedEvidence = cloneProject(integrated, "stale-completed-evidence");
  const completedVerificationRoot = path.join(staleCompletedEvidence, ".work-campaign", "evidence", "verification", currentCandidateDigest);
  const completedArtifact = fs.readdirSync(completedVerificationRoot).find((name) => name.startsWith("aggregate-validation-"));
  assert(completedArtifact != null, "completed campaign requires one current validation artifact");
  fs.appendFileSync(path.join(completedVerificationRoot, completedArtifact), " ", "utf8");
  const staleCompletedReplay = production(staleCompletedEvidence, "replay", [], missionEnv);
  assert(staleCompletedReplay.status === 1 && output(staleCompletedReplay).disposition === "blocked"
    && output(staleCompletedReplay).terminalHandoff == null, "terminal replay must suppress completion when retained current evidence later drifts");
  assert(digestFile(path.join(integrated, "src", "b.ts")) === currentSourceRows[1].sha256, "P2 source must remain unchanged through terminal campaign completion");

  const invalidRun = production(invalid, "run", ["--phase-input", "inputs/phase.json"]);
  const dirtyRun = production(dirty, "run", ["--phase-input", "inputs/phase.json"]);
  const activeRun = production(active, "run", ["--phase-input", "inputs/phase.json"]);
  const unknownWriterRun = production(unknownWriter, "run", ["--phase-input", "inputs/phase.json"]);
  assert(invalidRun.status === 2 && output(invalidRun).field === "playbook", "invalid campaign definition must fail before controller effects");
  assert(dirtyRun.status === 1 && String(output(dirtyRun).errorMessage).includes("project:worktree"), "dirty worktree must fail before phase input consumption");
  assert(activeRun.status === 1 && String(output(activeRun).errorMessage).includes("project:active-changes"), "unowned active change must fail before phase input consumption");
  assert(unknownWriterRun.status === 1 && output(unknownWriterRun).disposition === "paused-unknown", "unknown campaign writer must fail closed before phase input consumption");
  const unknownWriterStatus = production(unknownWriter, "status");
  assert((output(unknownWriterStatus).supervision as JsonRecord)?.action === "unknown"
    && (output(unknownWriterStatus).supervision as JsonRecord)?.reason === "writer-or-cleanup-unknown", "status must not clear unknown writer ownership");
  for (const blockedProject of [invalid, dirty, active]) {
    assert(!fs.existsSync(path.join(blockedProject, ".work-campaign", "evidence")), "blocked controller fixtures must not create campaign evidence");
    assert(!fs.existsSync(path.join(blockedProject, ".opencode-dev-kit", "runtime", "work-campaigns", "fixture-campaign", "transitions")), "blocked controller fixtures must not append transitions");
  }
  assert(!fs.existsSync(path.join(unknownWriter, ".opencode-dev-kit", "runtime", "work-campaigns", "fixture-campaign", "transitions")), "unknown writer fixture must not append transitions");

  const stop = production(project, "stop", ["--source", "operator", "--evidence-ref", "evidence:operator-stop"]);
  assert(stop.status === 0 && output(stop).disposition === "paused-stop", `explicit stop must close at a durable pause: ${stop.stderr}`);
  const stoppedStatus = production(project, "status");
  assert(stoppedStatus.status === 0 && output(stoppedStatus).disposition === "paused-stop"
    && (output(stoppedStatus).supervision as JsonRecord)?.action === "suppress"
    && (output(stoppedStatus).supervision as JsonRecord)?.reason === "explicit-stop", "status must preserve and suppress the durable explicit stop");
  assert(fs.readdirSync(transitions).length === 11, "explicit stop must append exactly stop-requested and pause transitions");

  const sourceAfter = baseline.sourceFiles.map((relative) => digestFile(path.join(project, relative)));
  assert(stableJson(sourceAfter) === stableJson(sourceBefore), "controller operations must not mutate tracked source bytes");
  const gitStatus = git(project, ["status", "--porcelain=v1", "-z", "--untracked-files=all"]);
  assert(gitStatus.status === 0 && gitStatus.stdout === "", "controller-owned outputs must not dirty the fixture worktree");

  capturedRaw = {
    candidateId,
    cleanup: "pending",
    ...(environmentId == null ? {} : { environmentId }),
    commands: [
      ["status-before", statusBefore],
      ["preflight", preflight],
      ["run", run],
      ["report-readback", readback],
      ["status-after", statusAfter],
      ["replay", replay],
      ["idempotent-run", idempotentRun],
      ["invalid-definition", invalidRun],
      ["dirty-worktree", dirtyRun],
      ["active-change", activeRun],
      ["unknown-writer", unknownWriterRun],
      ["stop", stop],
      ["stopped-status", stoppedStatus],
    ].map(([name, result]) => ({
      disposition: output(result as CommandResult).disposition ?? null,
      exitCode: (result as CommandResult).status,
      field: output(result as CommandResult).field ?? null,
      name,
      phase: output(result as CommandResult).phase ?? null,
      status: output(result as CommandResult).status ?? null,
      writerClosure: output(result as CommandResult).writerClosure ?? null,
    })),
    controlPartitions: {
      investigations: {
        confirmed: { disposition: output(investigatedRun).disposition, exitCode: investigatedRun.status },
        stillUnknown: { error: output(stillUnknownRun).error, exitCode: stillUnknownRun.status },
      },
      ownerOnly: {
        disposition: output(ownerOnlyRun).disposition,
        errorClass: output(ownerOnlyRun).errorClass,
        exitCode: ownerOnlyRun.status,
        sourceWriterCount: 0,
        transitionCount: ownerOnlyTransitions.length,
      },
      ownerSibling: {
        disposition: output(ownerSiblingRun).disposition,
        exitCode: ownerSiblingRun.status,
        sourceWriterCount: 0,
      },
      reportOnly: {
        disposition: output(reportOnlyRun).disposition,
        exitCode: reportOnlyRun.status,
        sourceWriterCount: 0,
        transitionCount: reportOnlyTransitions.length,
      },
    },
    effects: {
      controllerGitMutationCalls: 0,
      controllerOpenSpecMutationCalls: 0,
      fixtureGitMutationCalls,
      fixtureOpenSpecMutationCalls,
      hostEffects: 0,
      missionCalls: 2,
      openCodeCalls: 0,
      processStarts,
      providerCalls: 0,
      sourceWrites: 0,
    },
    environment: { node: process.version, openSpec: output(preflight).identities == null ? "unknown" : (output(preflight).identities as JsonRecord).openSpec, platform: process.platform },
    negativeControls: {
      activeChange: activeRun.status,
      dirtyWorktree: dirtyRun.status,
      invalidDefinition: invalidRun.status,
      unknownWriter: unknownWriterRun.status,
    },
    proofKind: "campaign-provider-free-controller",
    missionIntegration: {
      duplicateTransitionCount: consumedTransitionFiles.length,
      launchKinds: launchTransitions.map((record) => record.kind),
      missionDisposition: missionState.disposition,
      mismatchExitCode: mismatchResume.status,
      reportFixed: integratedReport.includes("| `item-p1` | P1 | fixed-and-verified |"),
      reportNeedsRereview: integratedReport.includes("| `block-a` | `src/a.ts` | file | maintained | needs-rereview |"),
      resumeDisposition: supervisedCampaign.disposition,
      resumePhase: supervisedCampaign.phase,
      terminalKinds: consumedTransitions.slice(9).map((record) => record.kind),
      stopDisposition: (missionStopRow.campaign as JsonRecord).disposition,
      stopSource: missionStopIntent?.source ?? null,
      writerLeaseAbsent: !fs.existsSync(path.join(integrated, ".opencode-dev-kit", "runtime", "work-campaigns", "fixture-campaign", "writer.lock")),
    },
    supervisor: {
      advice: {
        budget: (output(budgetStatus).supervision as JsonRecord)?.reason,
        complete: (output(finalStatus).supervision as JsonRecord)?.reason,
        drift: (output(interruptedStatus).supervision as JsonRecord)?.reason,
        externalInput: (output(postResumeStatus).supervision as JsonRecord)?.reason,
        notStarted: (output(statusBefore).supervision as JsonRecord)?.reason,
        ownerProtected: (output(ownerOnlyStatus).supervision as JsonRecord)?.reason,
        restored: (output(interruptedRestoredStatus).supervision as JsonRecord)?.reason,
        stop: (output(stoppedStatus).supervision as JsonRecord)?.reason,
        terminalMission: (output(missionStatus).supervision as JsonRecord)?.reason,
        unknownWriter: (output(unknownWriterStatus).supervision as JsonRecord)?.reason,
      },
      duplicateSuppressed: supervisorDuplicateSuppressed,
      logCount: supervisorLogs.length,
      oldGenerationRemoved: !fs.existsSync(path.join(supervisorRoot, "runtime", "fixture-campaign", "logs", "000001.meta.json")),
      passwordAbsent: !supervisorPrivacyText.includes(supervisorPassword),
      resumeDisposition: supervisedCampaign.disposition,
      resumeReason: supervisorRows[0].reason,
      resumeState: supervisorRows[0].state,
      retryBackoffObserved: supervisorRetryBackoffObserved,
      signalStopped: supervisorSignalStopped,
      stopDisposition: (missionStopRow.campaign as JsonRecord).disposition,
      stopSource: missionStopIntent?.source ?? null,
    },
    verification: {
      commandFailureExitCode: failedVerify.status,
      commandFailureTransitionCount: fs.readdirSync(path.join(failedVerification, ".opencode-dev-kit", "runtime", "work-campaigns", "fixture-campaign", "transitions")).length,
      criticalFinalDisposition: output(blockedCriticalComplete).disposition,
      criticalRereviewDisposition: output(criticalRereview).disposition,
      criticalSdetPending: criticalReport.includes("critical-sdet-pending"),
      finalChallengeStatus: finalClosure.challengeStatus,
      finalClosureReportDigest: finalClosure.reportDigest,
      finalDisposition: output(finalVerify).disposition,
      finalHandoffCandidateDigest: terminalHandoff.candidateDigest,
      finalHandoffMaximumClaim: terminalHandoff.maximumClaim,
      finalHandoffReportDigest: terminalHandoff.reportDigest,
      finalTerminalState: finalClosure.terminalState,
      finalTransitionKinds: terminalTransitions.slice(-2).map((record) => record.kind),
      interruptedRecoveryDisposition: output(interruptedResume).disposition,
      interruptedRecoveryHandoffAbsent: output(interruptedResume).terminalHandoff == null,
      interruptedRecoveryOperation: output(interruptedResume).operation,
      interruptedRecoveryPausePersisted: interruptedPausedTransitionCount === interruptedTransitionCount + 1,
      interruptedRecoveredDisposition: output(interruptedRecovered).disposition,
      interruptedRecoveredOperation: output(interruptedRecovered).operation,
      interruptedReplayDisposition: output(interruptedReplay).disposition,
      interruptedReplayOperation: output(interruptedReplay).operation,
      interruptedStatusDisposition: output(interruptedStatus).disposition,
      interruptedStatusOperation: output(interruptedStatus).operation,
      p2ReportOnly: finalReport.includes("| `item-p2` | P2 | report-only |"),
      producerMismatchExitCode: mismatchedProducerVerify.status,
      rereviewCandidateDigest: rereviewClosure.candidateDigest,
      rereviewDisposition: output(rereviewVerify).disposition,
      rereviewProofStatus: rereviewClosure.proofStatus,
      rereviewValidationStatus: rereviewClosure.validationStatus,
      staleArtifactDisposition: output(staleArtifactVerify).disposition,
      staleArtifactHandoffAbsent: output(staleArtifactVerify).terminalHandoff == null,
      staleCandidateDisposition: output(staleCandidateVerify).disposition,
      staleCandidateHandoffAbsent: output(staleCandidateVerify).terminalHandoff == null,
      staleCompletedDisposition: output(staleCompletedReplay).disposition,
      staleCompletedHandoffAbsent: output(staleCompletedReplay).terminalHandoff == null,
      terminalIdempotentCount: fs.readdirSync(integratedTransitions).length,
      twoWaveArchived: (twoWaveClosure.waves as JsonRecord).archived,
      twoWaveCheckpointed: (twoWaveClosure.waves as JsonRecord).checkpointed,
      twoWaveDisposition: output(twoWaveComplete).disposition,
      twoWaveMissingMissionExitCode: rejectedMissingMission.status,
      twoWaveSelfReconciliationExitCode: rejectedSelfReconcile.status,
      twoWaveTransitionKinds: fs.readdirSync(multiTransitions).sort().map((name) => (JSON.parse(fs.readFileSync(path.join(multiTransitions, name), "utf8")) as JsonRecord).kind),
      unauthorizedTerminalExitCode: unauthorizedVerify.status,
    },
    report: {
      digest: reportDigest,
      p1Present: report.includes("| `item-p1` | P1 | confirmed |"),
      p2ReportOnly: report.includes("| `item-p2` | P2 | report-only |"),
    },
    schemaVersion: 1,
    sourceCandidate: WORK_CAMPAIGN_CONTROLLER_SOURCE_PATHS.map((relative) => ({ path: relative, sha256: digestFile(path.join(root, relative)) })),
    sourceManifest: { afterDigests: sourceAfter, beforeDigests: sourceBefore, sourceWrites: 0 },
    transitions: {
      admittedEvidenceRefs: transitionRecords[7].evidenceRefs,
      admittedWaveId: transitionRecords[7].waveId,
      beforeStopCount: transitionFiles.length,
      finalCount: fs.readdirSync(transitions).length,
      kinds: transitionRecords.map((record) => record.kind),
      missionRef: transitionRecords[8].missionRef,
      pauseDisposition: transitionRecords[8].disposition,
    },
  };
} finally {
  fs.rmSync(fixtureRoot, { recursive: true, force: true });
}

if (rawPath != null) {
  if (capturedRaw == null) throw new Error("campaign controller raw evidence was not captured");
  capturedRaw.cleanup = fs.existsSync(fixtureRoot) ? "unknown" : "complete";
  fs.writeFileSync(rawPath, stableJson(capturedRaw), { encoding: "utf8", flag: "wx" });
}

process.stdout.write("OK: work-campaign provider-free controller suite\n");
