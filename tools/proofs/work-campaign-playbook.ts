#!/usr/bin/env node

import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { runPortableCommand } from "../../global/bin/portable-process.ts";
import { stableJson } from "../../global/bin/roadmap-mission/contracts.ts";
import {
  campaignDigest,
  loadWorkCampaignDefinition,
  type CampaignClosureMatrix,
  type CampaignInventoryBlock,
  type CampaignReportSeed,
  type CampaignWorkItem,
} from "../../global/bin/work-campaign/contracts.ts";
import { buildCampaignMissionDefinition } from "../../global/bin/work-campaign/mission-handoff.ts";
import type { SemanticAssignmentResult } from "../../global/bin/work-campaign/semantic-executor.ts";
import {
  runSemanticPlaybook,
  type SemanticPlaybookContext,
  type SemanticPlaybookFactory,
  type SemanticPlaybookJob,
} from "../../global/bin/work-campaign/semantic-playbook.ts";
import { loadModelProfile } from "../model-profile.ts";
import {
  assertProofRouteAvailable,
  configuredProofServerEnvironment,
  installedOpenCodeIdentity,
  proofClient,
  proofRuntimeSurface,
  proofServerLogs,
  proofServerStartupFacts,
  seedProofModelsCatalog,
  startProofServer,
  stopProofServer,
  waitForProofRoute,
  writeIsolatedProofConfig,
  type ProofServerHandle,
  type ProofRuntimeSurface,
} from "./lib/opencode-proof-client.ts";
import { removeProofFixture } from "./lib/proof-process-cleanup.ts";

type JsonRecord = Record<string, unknown>;
type Mode = "capture" | "preflight" | "replay";
export type ConfiguredPlaybookCaptureOptions = {
  candidateId: string;
  environmentId: string;
  evidenceRoot: string;
  inputRoot: string | null;
  mode: Mode;
  opencode: string | null;
  profile: string;
};
type Options = ConfiguredPlaybookCaptureOptions;
type PlaybookResult = Awaited<ReturnType<typeof runSemanticPlaybook>>;
type Fixture = ReturnType<typeof createFixture>;

export type ConfiguredPlaybookRuntime = {
  environment: NodeJS.ProcessEnv;
  expectedModel: string;
  installedOpenCode: JsonRecord;
  runtimeSurface: ProofRuntimeSurface;
  serverUrl: string;
};

export type ConfiguredPlaybookCaptureHooks = {
  firstMissionResume?: ConfiguredFirstMissionResume;
  fixtureRoot?: string;
  hostResume?: boolean;
  runtime?: ConfiguredPlaybookRuntime;
  writeEvidence?: boolean;
};

export type ConfiguredFirstMissionResume = (context: {
  definitionDigest: string;
  environment: NodeJS.ProcessEnv;
  fixtureRoot: string;
  runtimeEndpoint: string;
  runtimeVersion: string;
}) => JsonRecord | Promise<JsonRecord>;

const sourceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");

function usage(): string {
  return `Usage:
  node tools/proofs/work-campaign-playbook.ts --mode preflight --candidate-id <id> --environment-id <id> --evidence-root <absolute-new-path> [--opencode <absolute-file>] [--input-root <configured-capture>]
  node tools/proofs/work-campaign-playbook.ts --mode capture --candidate-id <id> --environment-id <id> --evidence-root <absolute-new-path> --opencode <absolute-file> [--profile quality-independent]
  node tools/proofs/work-campaign-playbook.ts --mode replay --candidate-id <id> --environment-id <id> --input-root <capture> --evidence-root <absolute-new-path>

  Capture starts one explicit disposable loopback OpenCode server and runs nine bounded
read-only roots through configured discovery, reconciliation, synthesis, changed-block
re-review, and final challenge. The existing mission controller owns two disposable
source corrections between those roots. Preflight and replay perform zero configured model calls.`;
}

function required(args: string[], index: number, option: string): string {
  const value = args[index + 1];
  if (value == null || value.trim() === "" || value.startsWith("--")) throw new Error(`Missing value for ${option}`);
  return value;
}

function parseArgs(args: string[]): Options {
  let candidateId = "";
  let environmentId = "";
  let evidenceRoot = "";
  let inputRoot: string | null = null;
  let mode: Mode | null = null;
  let opencode: string | null = null;
  let profile = "quality-independent";
  for (let index = 0; index < args.length; index++) {
    const arg = args[index];
    if (arg === "--candidate-id") candidateId = required(args, index++, arg);
    else if (arg === "--environment-id") environmentId = required(args, index++, arg);
    else if (arg === "--evidence-root") evidenceRoot = required(args, index++, arg);
    else if (arg === "--input-root") inputRoot = path.resolve(required(args, index++, arg));
    else if (arg === "--opencode") opencode = path.resolve(required(args, index++, arg));
    else if (arg === "--profile") profile = required(args, index++, arg);
    else if (arg === "--mode") {
      const value = required(args, index++, arg);
      if (value !== "capture" && value !== "preflight" && value !== "replay") throw new Error("--mode must be capture, preflight, or replay");
      mode = value;
    } else throw new Error(`Unknown option: ${arg}`);
  }
  if (mode == null) throw new Error("--mode is required");
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]{0,99}$/u.test(candidateId)) throw new Error("--candidate-id must be a safe identifier");
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]{0,199}$/u.test(environmentId)) throw new Error("--environment-id must be a safe identifier");
  if (!path.isAbsolute(evidenceRoot)) throw new Error("--evidence-root must be absolute");
  if (opencode != null && !fs.statSync(opencode, { throwIfNoEntry: false })?.isFile()) throw new Error("--opencode must be an absolute existing file");
  if (mode === "capture" && opencode == null) throw new Error("capture requires --opencode as an absolute existing file");
  if (mode === "replay" && inputRoot == null) throw new Error("replay requires --input-root");
  return { candidateId, environmentId, evidenceRoot: path.resolve(evidenceRoot), inputRoot, mode, opencode, profile };
}

function sha256(value: string | Buffer): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function writeNew(file: string, value: unknown): void {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, stableJson(value), { encoding: "utf8", flag: "wx" });
}

function command(root: string, argv: string[], timeoutMs = 60_000): JsonRecord {
  const result = runPortableCommand(root, argv, { capture: true, timeoutMs });
  if (result.status !== 0) throw new Error(`${argv[0]} failed (${String(result.status)}): ${result.stderr.slice(0, 1_000)}`);
  return { argv, exitCode: result.status, stderr: result.stderr.slice(0, 1_000), stdout: result.stdout.slice(0, 1_000) };
}

function worktreeStatus(root: string, id: string): JsonRecord {
  const result = runPortableCommand(root, ["git", "status", "--porcelain=v1", "--untracked-files=all"], { capture: true, timeoutMs: 30_000 });
  return { exitCode: result.status, id, paths: result.stdout.split(/\r?\n/u).filter(Boolean).sort(), stderr: result.stderr.slice(0, 1_000) };
}

function safeError(error: unknown): string {
  return (error instanceof Error ? error.message : String(error))
    .replaceAll("\r", " ")
    .replaceAll("\n", " ")
    .slice(0, 1_000);
}

function sourceDigest(root: string, relative = "src/main.mjs"): string {
  return sha256(fs.readFileSync(path.join(root, relative)));
}

function installMissionBoundary(root: string): string {
  const bin = path.join(path.dirname(root), "bin");
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
  writeNew(path.join(root, "mission-adapter.json"), {
    executorArgv: ["node", "mission-executor.mjs", "{operation}", "{changeId}", "{sliceId}", "{attempt}", "{resultPath}", "{definitionDigest}", "{missionId}"],
    maxAttemptsPerSlice: 1,
    maxWallClockMsPerSlice: 60_000,
    schemaVersion: 1,
  });
  fs.writeFileSync(path.join(root, "AGENTS.md"), "# Disposable Configured Campaign Proof\n\n## Runtime Authority\n", "utf8");
  fs.mkdirSync(path.join(root, "opencode-dev-kit"), { recursive: true });
  writeNew(path.join(root, "opencode-dev-kit", "adapter.json"), {
    schemaVersion: 1,
    validation: {
      build: "node validate.mjs",
      focusedTest: "node validate.mjs",
      lint: "node validate.mjs",
      test: "node validate.mjs",
      typecheck: "node validate.mjs",
    },
  });
  const proposal = [
    "# Proposal", "", "### Outcome Capsule", "",
    ...["Outcome", "Operating Envelope", "Non-Goals", "Non-Deferrable Invariants", "Observable Proof", "Material Residual Risks", "Stop Line"]
      .map((field) => `- **${field}**: Disposable configured campaign proof.`),
    "", "- **Bounded Falsification Review**: exempt - Disposable fixture change is Ordinary Small.", "",
  ].join("\n");
  fs.writeFileSync(path.join(root, "mission-executor.mjs"), [
    "import fs from 'node:fs';",
    "import path from 'node:path';",
    "const [operation, change, slice, attempt, resultPath, definitionDigest, missionId] = process.argv.slice(2);",
    "const campaignLease = path.join('.opencode-dev-kit', 'runtime', 'work-campaigns', 'configured-playbook-proof', 'writer.lock');",
    "if (fs.existsSync(campaignLease)) { console.error('campaign lease held during mission execution'); process.exit(97); }",
    "const changeRoot = path.join('openspec', 'changes', change);",
    "fs.mkdirSync(path.join(changeRoot, 'specs', 'safe-divide'), { recursive: true });",
    `fs.writeFileSync(path.join(changeRoot, 'proposal.md'), ${JSON.stringify(proposal)});`,
    "fs.writeFileSync(path.join(changeRoot, 'history.md'), '# Strategy History\\n');",
    "fs.writeFileSync(path.join(changeRoot, 'tasks.md'), '# Tasks\\n\\n- [x] Return null for zero divisor.\\n');",
    "fs.writeFileSync(path.join(changeRoot, 'specs', 'safe-divide', 'spec.md'), '# Safe Divide\\n');",
    "const corrected = change === 'fix-negative-divisor' ? 'export function safeDivide(dividend, divisor) {\\n  if (divisor <= 0) return null;\\n  return dividend / divisor;\\n}\\n' : 'export function safeDivide(dividend, divisor) {\\n  if (divisor === 0) return null;\\n  return dividend / divisor;\\n}\\n';",
    "fs.writeFileSync(path.join('src', 'main.mjs'), corrected);",
    "const evidenceRoot = path.dirname(resultPath);",
    "fs.mkdirSync(evidenceRoot, { recursive: true });",
    "const commands = operation === 'propose' ? ['opsx-propose', 'opsx-apply'] : ['opsx-apply'];",
    "const evidenceRefs = commands.map((command) => { const file = path.join(evidenceRoot, command + '.json').replaceAll('\\\\', '/'); fs.writeFileSync(file, JSON.stringify({ command, schemaVersion: 1, status: 'completed' }) + '\\n'); return file; });",
    "fs.writeFileSync(resultPath, JSON.stringify({ attempt: Number(attempt), changeId: change, cleanup: 'complete', definitionDigest, disposition: 'completed', errorClass: 'none', errorMessage: null, evidenceRefs, guardState: 'passed', missionId, phases: commands.map((command, index) => ({ command, evidenceRef: evidenceRefs[index], status: 'completed' })), questionDisposition: 'none', rootSessionRef: 'session-configured-campaign-mission', runtimeRef: '0'.repeat(64), schemaVersion: 1, sliceId: slice, tool: 'roadmap-mission-session-executor', writerClosure: 'terminal' }, null, 2) + '\\n');",
    "process.exit(0);",
    "",
  ].join("\n"), "utf8");
  return bin;
}

function createFixture(root: string, hostResume = false): {
  blocks: CampaignInventoryBlock[];
  context: SemanticPlaybookContext;
  definitionDigest: string;
  missionBin: string;
  missionDefinitionDigest: string;
  setupCommands: JsonRecord[];
} {
  fs.mkdirSync(root, { recursive: true });
  const gitDirectory = path.join(root, ".git");
  const gitStat = fs.lstatSync(gitDirectory, { throwIfNoEntry: false });
  if (gitStat != null && (!gitStat.isDirectory() || gitStat.isSymbolicLink())) throw new Error("Configured playbook Git metadata is unsafe");
  const setupCommands = [
    gitStat == null
      ? command(root, ["git", "init", "-b", "main"])
      : command(root, ["git", "rev-parse", "--show-toplevel"]),
    command(root, ["openspec", "init", "--tools", "none", "--no-animation", "."]),
  ];
  fs.mkdirSync(path.join(root, "src"), { recursive: true });
  fs.mkdirSync(path.join(root, ".work-campaign", "evidence", "assignments"), { recursive: true });
  fs.mkdirSync(path.join(root, ".work-campaign", "evidence", "results"), { recursive: true });
  fs.mkdirSync(path.join(root, ".work-campaign", "evidence", "records"), { recursive: true });
  fs.writeFileSync(path.join(root, "src", "main.mjs"), [
    "export function safeDivide(dividend, divisor) {",
    "  return dividend / divisor;",
    "}",
    "",
  ].join("\n"), "utf8");
  fs.writeFileSync(path.join(root, "src", "format.mjs"), "export const formatRatio = (value) => String(value);\n", "utf8");
  fs.writeFileSync(path.join(root, "validate.mjs"), [
    "import { safeDivide } from './src/main.mjs';",
    "if (safeDivide(1, 0) !== null || safeDivide(6, 3) !== 2) process.exit(1);",
    "process.exit(0);",
    "",
  ].join("\n"), "utf8");
  fs.writeFileSync(path.join(root, ".gitignore"), [
    ".opencode-dev-kit/",
    ".work-campaign/evidence/",
    ".work-campaign/report.md",
    "",
  ].join("\n"), "utf8");
  writeNew(path.join(root, "adapter.json"), {
    adapterId: "configured-playbook-proof-adapter",
    inventoryArgv: ["node", "inventory.mjs"],
    realBoundaryProofArgv: ["node", "validate.mjs"],
    schemaVersion: 1,
  });
  writeNew(path.join(root, "definition.json"), {
    adapterPath: "adapter.json",
    allowedEffects: ["local-read", "local-write", "provider-inference"],
    authorizationRefs: { "provider-inference": "authorization:configured-synthetic-proof" },
    budgets: { evidenceBytes: 2_097_152, modelCalls: 10, processAttempts: 8, wallClockSeconds: 900, waves: 2 },
    campaignId: "configured-playbook-proof",
    checkpoint: { localCommitAuthorized: false, mode: "evidence-only", workspace: "disposable" },
    evidencePath: ".work-campaign/evidence",
    exclusions: [],
    hostResume: { enabled: hostResume, supervisorRequired: hostResume },
    outcome: "safeDivide returns null rather than a non-finite number when divisor is zero.",
    playbook: "audit-remediate",
    protectedDecisionPolicy: "owner-required",
    reportPath: ".work-campaign/report.md",
    schemaVersion: 1,
    scopeRoots: ["src"],
    statePath: ".opencode-dev-kit/runtime/work-campaigns/configured-playbook-proof",
    stopPolicy: { onBudgetExhausted: true, onExplicitStop: true, onOwnerRequired: true, onProtected: true, onUnknown: true },
    validationArgv: ["node", "validate.mjs"],
  });
  const missionBin = installMissionBoundary(root);
  setupCommands.push(command(root, ["git", "add", "--all"]));
  setupCommands.push(command(root, [
    "git", "-c", "user.name=Campaign Proof", "-c", "user.email=campaign-proof@example.invalid",
    "-c", "commit.gpgsign=false", "commit", "-m", "configured playbook fixture",
  ]));
  const loaded = loadWorkCampaignDefinition(root, "definition.json");
  const mainSha = sourceDigest(root);
  const formatSha = sourceDigest(root, "src/format.mjs");
  const candidateDigest = campaignDigest([
    { path: "src/format.mjs", sha256: formatSha },
    { path: "src/main.mjs", sha256: mainSha },
  ]);
  const blockMain: CampaignInventoryBlock = {
    classification: "maintained",
    digest: mainSha,
    exclusionReason: null,
    id: "block-main",
    kind: "file",
    path: "src/main.mjs",
    recordType: "inventory-block",
    reviewStatus: "reviewed-with-finding",
    schemaVersion: 1,
  };
  const blockFormat: CampaignInventoryBlock = {
    classification: "maintained",
    digest: formatSha,
    exclusionReason: null,
    id: "block-format",
    kind: "file",
    path: "src/format.mjs",
    recordType: "inventory-block",
    reviewStatus: "reviewed-with-finding",
    schemaVersion: 1,
  };
  const blocks = [blockFormat, blockMain].sort((left, right) => left.id.localeCompare(right.id));
  const context: SemanticPlaybookContext = {
    allowedEffects: loaded.definition.allowedEffects,
    blocks,
    campaignId: loaded.definition.campaignId,
    candidateDigest,
    definitionDigest: loaded.definitionDigest,
    inventoryDigest: campaignDigest(blocks),
    modelCallBudget: loaded.definition.budgets.modelCalls,
  };
  const expectedWave = {
    campaignId: context.campaignId,
    candidateDigest,
    definitionDigest: context.definitionDigest,
    id: "wave-zero-divisor",
    missionDefinitionDigest: "0".repeat(64),
    recordType: "wave-manifest" as const,
    schemaVersion: 1 as const,
    slices: [{
      changeId: "fix-zero-divisor",
      dependsOn: [],
      effectClasses: ["local-write" as const],
      expectedProof: "Run the disposable safeDivide proof.",
      id: "slice-zero-divisor",
      outcome: "Return null for a zero divisor.",
      ownedPaths: ["src/main.mjs"],
      validationArgv: ["node", "validate.mjs"],
      workItemIds: ["item-zero-divisor"],
    }],
    status: "frozen" as const,
    workItemIds: ["item-zero-divisor"],
  };
  const missionDefinitionDigest = buildCampaignMissionDefinition(loaded.definition, loaded.definitionDigest, expectedWave).definitionDigest;
  return {
    blocks,
    context,
    definitionDigest: loaded.definitionDigest,
    missionBin,
    missionDefinitionDigest,
    setupCommands,
  };
}

function assignmentJob(
  context: SemanticPlaybookContext,
  id: string,
  type: "discovery" | "final-challenge" | "reconciliation" | "synthesis",
  sourceBlockIds: string[],
  request: string,
): SemanticPlaybookJob {
  return {
    assignment: {
      assignmentId: id,
      assignmentType: type,
      budgets: { modelCalls: 1, outputBytes: 16_384, wallClockSeconds: 240 },
      campaignId: context.campaignId,
      candidateDigest: context.candidateDigest,
      definitionDigest: context.definitionDigest,
      evidenceRefs: sourceBlockIds.map((blockId) => {
        const block = context.blocks.find((candidate) => candidate.id === blockId);
        if (block == null) throw new Error(`assignment ${id} references unknown block ${blockId}`);
        return `file:${block.path}`;
      }).sort(),
      phase: type === "discovery" ? "discover" : type === "synthesis" ? "synthesize" : type === "final-challenge" ? "verify" : "reconcile",
      request,
      schemaVersion: 1,
      sourceBlockIds,
    },
    resultPath: `.work-campaign/evidence/results/${id}.json`,
  };
}

function configuredFactory(
  context: SemanticPlaybookContext,
  sourceDigests: Record<string, string>,
  missionDefinitionDigest: string,
): SemanticPlaybookFactory {
  return {
    discovery: () => [assignmentJob(context, "discover-source", "discovery", ["block-format", "block-main"], [
      "Read src/main.mjs and src/format.mjs and compare them with the accepted outcome in definition.json.",
      "The absent zero-divisor branch is one current P1 candidate. The formatRatio name is an optional P2 naming candidate that must remain report-only.",
      `Return partition id partition-source, inventoryDigest ${context.inventoryDigest}, status complete, blockIds [block-format,block-main], workItemIds [item-format-name,item-zero-divisor], and the required producerSessionRef.`,
      "Return candidate item item-zero-divisor with sourceBlockIds [block-main], principleRef principle:first-do-no-harm, scenario 'Calling safeDivide with divisor zero returns a non-finite number instead of null.', evidenceRefs [file:src/main.mjs], impact 'The accepted bounded result contract is violated.', likelyCause 'The zero-divisor guard is absent.', proposedOutcome 'Return null before division when divisor is zero.', affectedPaths and ownedPaths [src/main.mjs], effectClasses [local-write], confidence high, initialSeverity P1, required producerSessionRef, and status candidate.",
      "Return candidate item item-format-name with sourceBlockIds [block-format], principleRef principle:yagni, scenario 'The formatter function name could be more explicit but current behavior remains correct.', evidenceRefs [file:src/format.mjs], impact 'The accepted bounded result remains correct.', likelyCause 'The concise name predates the current wording.', proposedOutcome 'Retain the observation as optional report-only polish.', affectedPaths and ownedPaths [src/format.mjs], effectClasses [local-read], confidence high, initialSeverity P2, required producerSessionRef, and status candidate.",
    ].join(" "))],
    reconciliation: (_playbook, item: CampaignWorkItem) => assignmentJob(context, `reconcile-${item.id}`, "reconciliation", item.sourceBlockIds, [
      `Read ${item.id === "item-zero-divisor" ? "src/main.mjs" : "src/format.mjs"} and freshly verify ${item.id} against the accepted definition outcome.`,
      "Inside the outer model envelope's payload object, return exactly one property named reconciliation.",
      `Its value must have id reconcile-${item.id}, workItemId ${item.id}, candidateDigest ${context.candidateDigest}, sourceDigest ${sourceDigests[item.id]}, required producerSessionRef, evidenceRefs [file:${item.id === "item-zero-divisor" ? "src/main.mjs" : "src/format.mjs"}], disposition confirmed, severity ${item.id === "item-zero-divisor" ? "P1" : "P2"}, recordType reconciliation-result, and schemaVersion 1.`,
      "Return no prose and no additional fields.",
    ].join(" ")),
    investigation: () => {
      throw new Error("configured fixture must not require investigation");
    },
    synthesis: (_playbook, items) => assignmentJob(context, "synthesize-wave", "synthesis", ["block-main"], [
      `Group only the confirmed item ${items[0]?.id ?? "item-zero-divisor"} into one frozen wave.`,
      "Inside the outer model envelope's payload object, return exactly one property named wave.",
      `Its value must have id wave-zero-divisor, campaignId ${context.campaignId}, definitionDigest ${context.definitionDigest}, candidateDigest ${context.candidateDigest}, missionDefinitionDigest ${missionDefinitionDigest}, recordType wave-manifest, schemaVersion 1, status frozen, and workItemIds [item-zero-divisor].`,
      "The wave must contain one slice with id slice-zero-divisor, changeId fix-zero-divisor, no dependencies, outcome 'Return null for a zero divisor.', workItemIds [item-zero-divisor], ownedPaths [src/main.mjs], effectClasses [local-write], expectedProof 'Run the disposable safeDivide proof.', and validationArgv [node,validate.mjs].",
      "Exclude item-format-name from the wave because it is P2 report-only. Return no prose.",
    ].join(" ")),
  };
}

function reportSeed(context: SemanticPlaybookContext): CampaignReportSeed {
  return {
    blockers: [{ evidenceRefs: ["blocker:mission-integration-not-enabled"], id: "mission-integration", status: "blocked", summary: "Configured semantic admission stops before mutation mission launch." }],
    candidateDigest: context.candidateDigest,
    challengeStatus: "unknown",
    definitionDigest: context.definitionDigest,
    limitations: [{ evidenceRefs: ["evidence:configured-semantic-only"], id: "configured-semantic-only", summary: "The configured path proves discovery, reconciliation, synthesis, and admission only." }],
    matrixRows: [
      { blockIds: ["block-main"], evidenceRefs: ["file:src/main.mjs"], id: "zero-divisor-failure", kind: "failure-mode", status: "open", summary: "The admitted mutation wave has not run.", workItemIds: ["item-zero-divisor"] },
      { blockIds: ["block-format"], evidenceRefs: ["file:src/format.mjs"], id: "redundancy", kind: "redundancy", status: "report-only", summary: "The optional naming observation remains report-only.", workItemIds: ["item-format-name"] },
      { blockIds: ["block-main"], evidenceRefs: ["file:src/main.mjs"], id: "proof-gap", kind: "test-gap", status: "open", summary: "Mission proof remains outside this rung.", workItemIds: ["item-zero-divisor"] },
    ],
    maximumClaim: "One configured disposable semantic path reaches deterministic frozen-wave admission without source mutation.",
    ownershipStatus: "terminal",
    proofStatus: "unknown",
    recordType: "report-seed",
    schemaVersion: 1,
    terminalState: "unknown",
    validationRows: [
      { argv: ["node", "validate.mjs"], evidenceRefs: [], id: "validation", kind: "validation", status: "unknown", summary: "Wave validation has not run." },
      { argv: ["node", "validate.mjs"], evidenceRefs: [], id: "proof", kind: "proof", status: "unknown", summary: "Mutation proof has not run." },
    ],
    validationStatus: "unknown",
    waveRows: [{ archiveRefs: [], checkpointRef: null, evidenceRefs: ["wave:wave-zero-divisor"], id: "wave-current", status: "unknown", summary: "The frozen wave is admitted but not executed.", waveId: "wave-zero-divisor" }],
  };
}

function materializePhaseInput(
  root: string,
  fixture: Fixture,
  playbook: PlaybookResult,
  evidenceRefs: string[],
): string {
  if (playbook.status !== "complete" || playbook.wave == null) throw new Error("semantic playbook has no complete wave to admit");
  const records: Array<[string, unknown]> = [];
  for (const block of fixture.blocks) records.push([`01-${block.id}.json`, block]);
  for (const partition of playbook.partitions) records.push([`10-${partition.id}.json`, partition]);
  for (const item of playbook.workItems) records.push([`20-${item.id}.json`, item]);
  for (const reconciliation of playbook.reconciliations) records.push([`30-${reconciliation.id}.json`, reconciliation]);
  for (const investigation of playbook.investigations) records.push([`40-${investigation.id}.json`, investigation]);
  records.push([`50-${playbook.wave.id}.json`, playbook.wave]);
  records.push(["60-report-seed.json", reportSeed(fixture.context)]);
  const recordPaths = records.map(([name, value]) => {
    const relative = `.work-campaign/evidence/records/${name}`;
    writeNew(path.join(root, relative), value);
    return relative;
  }).sort();
  const phaseInput = ".work-campaign/evidence/phase-input.json";
  writeNew(path.join(root, phaseInput), {
    campaignId: fixture.context.campaignId,
    candidateDigest: fixture.context.candidateDigest,
    definitionDigest: fixture.context.definitionDigest,
    evidenceRefs: [...new Set(evidenceRefs.length === 0 ? ["evidence:offline-replay"] : evidenceRefs)].sort(),
    inputType: "fake-semantic-phase-input",
    inventoryDigest: fixture.context.inventoryDigest,
    modelCalls: playbook.assignments.length,
    recordPaths,
    schemaVersion: 1,
    waveId: playbook.wave.id,
  });
  return phaseInput;
}

function materializeVerificationInput(
  root: string,
  name: string,
  job: SemanticPlaybookJob,
  inputType: "semantic-final-challenge-input" | "semantic-reconciliation-input" | "semantic-rereview-input" | "semantic-wave-input",
  records: Array<[string, unknown]>,
): string {
  const recordPaths = records.map(([recordName, value]) => {
    const relative = `.work-campaign/evidence/verification-inputs/${recordName}`;
    writeNew(path.join(root, relative), value);
    return relative;
  }).sort();
  const relative = `.work-campaign/evidence/verification-inputs/${name}.json`;
  writeNew(path.join(root, relative), {
    assignmentPath: `.work-campaign/evidence/assignments/${job.assignment.assignmentId}.json`,
    evidenceRefs: [...new Set(job.assignment.evidenceRefs)].sort(),
    inputType,
    recordPaths,
    resultPath: job.resultPath,
    schemaVersion: 1,
  });
  return relative;
}

function redact(value: unknown): unknown {
  if (typeof value === "string" && value.startsWith("session:")) return `session:${sha256(value)}`;
  if (Array.isArray(value)) return value.map(redact);
  if (value != null && typeof value === "object") return Object.fromEntries(Object.entries(value as JsonRecord).map(([key, item]) => [key, redact(item)]));
  return value;
}

export async function consumeConfiguredFirstMissionHandoff(
  fixtureRoot: string,
  definitionDigest: string,
  environment: NodeJS.ProcessEnv,
  resume?: ConfiguredFirstMissionResume,
  runtime?: { endpoint: string; version: string },
): Promise<JsonRecord> {
  const result = resume == null
    ? (() => {
      const commandResult = runPortableCommand(fixtureRoot, [
        process.execPath, path.join(sourceRoot, "global", "bin", "work-campaign.ts"), "resume",
        "--root", fixtureRoot, "--definition", "definition.json",
      ], { capture: true, env: environment, timeoutMs: 120_000 });
      return { ...(JSON.parse(commandResult.stdout || commandResult.stderr) as JsonRecord), exitCode: commandResult.status };
    })()
    : await resume({
      definitionDigest,
      environment,
      fixtureRoot,
      runtimeEndpoint: runtime?.endpoint ?? "provider-free-test",
      runtimeVersion: runtime?.version ?? "provider-free-test",
    });
  if (result.exitCode !== 3 || result.phase !== "verify" || result.disposition !== "paused-external") {
    throw new Error("Campaign mission handoff did not reach verification");
  }
  return result;
}

export function configuredMissionEnvironment(environment: NodeJS.ProcessEnv, missionBin: string): NodeJS.ProcessEnv {
  const inheritedPath = Object.entries(environment).find(([key]) => key.toLocaleUpperCase() === "PATH")?.[1] ?? "";
  const normalized = { ...environment, PATH: `${missionBin}${path.delimiter}${inheritedPath}` };
  for (const key of Object.keys(normalized)) {
    if (key !== "PATH" && key.toLocaleUpperCase() === "PATH") delete normalized[key];
  }
  return normalized;
}

export function evaluateConfiguredPlaybookScenario(raw: JsonRecord, candidateId: string, environmentId: string): JsonRecord {
  const results = Array.isArray(raw.assignmentResults) ? raw.assignmentResults as JsonRecord[] : [];
  const playbook = raw.playbook as JsonRecord | undefined;
  const controller = raw.controller as JsonRecord | undefined;
  const admission = controller?.admission as JsonRecord | undefined;
  const resume = controller?.resume as JsonRecord | undefined;
  const rereview = controller?.rereview as JsonRecord | undefined;
  const firstRereview = controller?.firstRereview as JsonRecord | undefined;
  const reconciliation = controller?.reconciliation as JsonRecord | undefined;
  const secondLaunch = controller?.secondLaunch as JsonRecord | undefined;
  const secondResume = controller?.secondResume as JsonRecord | undefined;
  const complete = controller?.complete as JsonRecord | undefined;
  const readback = controller?.readback as JsonRecord | undefined;
  const closure = readback?.closure as JsonRecord | undefined;
  const statuses = Array.isArray(raw.worktreeStatuses) ? raw.worktreeStatuses as JsonRecord[] : [];
  const items = Array.isArray(playbook?.workItems) ? playbook.workItems as JsonRecord[] : [];
  const wave = playbook?.wave as JsonRecord | undefined;
  const missionDirty = raw.missionDirtyStatus as JsonRecord | undefined;
  const missionDirtyPaths = Array.isArray(missionDirty?.paths) ? missionDirty.paths : [];
  const currentBlockPaths = new Map([
    ["block-format", "src/format.mjs"],
    ["block-main", "src/main.mjs"],
  ]);
  const assignmentBlocks: Record<string, string[]> = {
    "discover-source": ["block-format", "block-main"],
    "final-challenge-wave-negative-divisor": ["block-format", "block-main"],
    "reconcile-item-negative-divisor": ["block-main"],
    "reconcile-item-format-name": ["block-format"],
    "reconcile-item-zero-divisor": ["block-main"],
    "rereview-wave-zero-divisor": ["block-main"],
    "rereview-wave-negative-divisor": ["block-main"],
    "synthesize-negative-divisor-wave": ["block-main"],
    "synthesize-wave": ["block-main"],
  };
  const correctedSource = [
    "export function safeDivide(dividend, divisor) {",
      "  if (divisor <= 0) return null;",
    "  return dividend / divisor;",
    "}",
    "",
  ].join("\n");
  const checks: Record<string, boolean> = {
    admissionReached: admission?.exitCode === 3 && admission.disposition === "paused-external" && admission.phase === "mission",
    candidateMatched: raw.candidateId === candidateId,
    campaignCompleted: complete?.exitCode === 0 && complete.disposition === "complete" && complete.phase === "complete",
    environmentMatched: raw.environmentId === environmentId,
    exactConfiguredSequence: JSON.stringify(results.map((result) => result.assignmentType)) === JSON.stringify(["discovery", "reconciliation", "reconciliation", "synthesis", "discovery", "reconciliation", "synthesis", "discovery", "final-challenge"]),
    exactCurrentAssignmentEvidence: results.every((result) => {
      const sourceBlockIds = assignmentBlocks[String(result.assignmentId)] ?? [];
      const expected = sourceBlockIds.map((id) => `file:${String(currentBlockPaths.get(id))}`).sort();
      return stableJson(result.evidenceRefs) === stableJson(expected);
    }),
    exactlyNineModelCalls: results.reduce((total, result) => total + Number(result.modelCalls ?? 0), 0) === 9,
    finalClosureCurrent: closure?.terminalState === "complete" && closure.challengeStatus === "complete"
      && closure.validationStatus === "complete" && closure.proofStatus === "complete"
      && (closure.inventory as JsonRecord | undefined)?.needsRereview === 0
      && (closure.workItems as JsonRecord | undefined)?.unresolvedP0P1 === 0
      && (closure.waves as JsonRecord | undefined)?.archived === 2
      && (closure.waves as JsonRecord | undefined)?.checkpointed === 2,
    missionOwnedCorrectionObserved: raw.sourceBefore !== raw.sourceAfter && raw.sourceAfter === sha256(correctedSource)
      && missionDirtyPaths.includes(" M src/main.mjs") && !missionDirtyPaths.some((value) => String(value).includes("src/format.mjs")),
    optionalP2SourceUnchanged: raw.optionalSourceBefore === raw.optionalSourceAfter,
    playbookComplete: playbook?.status === "complete" && (playbook.wave as JsonRecord | undefined)?.id === "wave-zero-divisor",
    p2ExcludedFromWave: items.some((item) => item.id === "item-format-name" && item.status === "report-only")
      && Array.isArray(wave?.workItemIds) && !wave.workItemIds.includes("item-format-name"),
    readOnlyRootsTerminal: results.length === 9 && results.every((result) => {
      const verification = result.verification as JsonRecord | undefined;
      return result.status === "complete" && result.cleanup === "complete" && result.errorClass === "none"
        && verification?.parentless === true && verification.children === 0 && verification.fileDiffs === 0
        && verification.permissionRequests === 0 && verification.questions === 0;
    }),
    routeMatched: typeof raw.expectedModel === "string" && results.every((result) => {
      const model = result.model as JsonRecord | undefined;
      return `${String(model?.providerID)}/${String(model?.modelID)}` === raw.expectedModel;
    }),
    serverExplicit: raw.hiddenServer === false && raw.loopback === true,
    missionHandoffConsumed: resume?.exitCode === 3 && resume.phase === "verify" && resume.disposition === "paused-external",
    secondWaveMissionConsumed: firstRereview?.exitCode === 3 && firstRereview.phase === "synthesize"
      && reconciliation?.exitCode === 3 && reconciliation.phase === "synthesize"
      && secondLaunch?.exitCode === 3 && secondLaunch.phase === "mission"
      && secondResume?.exitCode === 3 && secondResume.phase === "verify",
    rereviewVerified: rereview?.exitCode === 3 && rereview.phase === "verify" && rereview.disposition === "paused-external",
    transitionOrder: JSON.stringify(raw.transitionKinds) === JSON.stringify(["preflight", "phase-start", "phase-complete", "phase-start", "findings-freeze", "phase-start", "report-materialized", "wave-admitted", "mission-launch", "mission-terminal", "verification", "rereview", "findings-freeze", "wave-admitted", "mission-launch", "mission-terminal", "verification", "rereview", "report-materialized", "terminal-complete"]),
    wholeWorktreeCleanAtSemanticRoots: statuses.length >= 21 && statuses.every((status) => Array.isArray(status.paths) && status.paths.length === 0),
  };
  return {
    candidateId,
    checks,
    environmentId,
    liveCalls: raw.captureMode === "replay"
      ? 0
      : results.reduce((total, result) => total + Number(result.modelCalls ?? 0), 0),
    proofKind: "campaign-configured-scenario",
    schemaVersion: 1,
    status: Object.values(checks).every(Boolean) ? "complete" : "blocked",
  };
}

function evaluate(raw: JsonRecord, candidateId: string, environmentId: string): JsonRecord {
  const scenario = evaluateConfiguredPlaybookScenario(raw, candidateId, environmentId);
  const scenarioChecks = scenario.checks as Record<string, boolean>;
  const surface = raw.runtimeSurface as JsonRecord | undefined;
  const checks: Record<string, boolean> = {
    ...scenarioChecks,
    fixtureCleanup: raw.fixtureRemoved === true && raw.serverTerminal === true,
    surfaceExtensionFree: typeof surface?.configDigest === "string"
      && Array.isArray(surface.mcpIds) && surface.mcpIds.length === 0
      && Array.isArray(surface.pluginIds) && surface.pluginIds.length === 0,
  };
  return {
    candidateId,
    checks,
    environmentId,
    liveCalls: scenario.liveCalls,
    proofKind: "campaign-configured-complete",
    schemaVersion: 1,
    status: Object.values(checks).every(Boolean) ? "complete" : "blocked",
  };
}

async function preflight(options: Options): Promise<void> {
  const proofRoot = fs.mkdtempSync(path.join(os.tmpdir(), "work-campaign-playbook-preflight-"));
  let server: ProofServerHandle | null = null;
  try {
    const fixtureRoot = path.join(proofRoot, "fixture");
    const fixture = createFixture(fixtureRoot);
    const worktreeStatuses = [worktreeStatus(fixtureRoot, "fixture-created")];
    let runtimeSurface: ProofRuntimeSurface | null = null;
    writeNew(path.join(fixtureRoot, ".work-campaign", "evidence", "diagnostic.json"), { schemaVersion: 1, status: "diagnostic" });
    worktreeStatuses.push(worktreeStatus(fixtureRoot, "ignored-evidence-created"));
    if (options.opencode != null) {
      const runtimeRoot = path.join(proofRoot, "runtime");
      for (const relative of ["cache", "config-home", "data/opencode", "state"]) fs.mkdirSync(path.join(runtimeRoot, relative), { recursive: true });
      const profile = loadModelProfile(sourceRoot, options.profile).profile;
      const configured = profile.agent?.general as { model?: string } | undefined;
      if (typeof configured?.model !== "string") throw new Error("Configured general model route is unavailable");
      seedProofModelsCatalog(runtimeRoot, [configured.model]);
      const configDir = path.join(runtimeRoot, "config-source");
      writeIsolatedProofConfig(configDir, profile);
      const environment = configuredProofServerEnvironment(process.env, configDir, runtimeRoot, profile);
      server = await startProofServer(options.opencode, fixtureRoot, environment);
      const client = proofClient(server.url, fixtureRoot);
      const route = await waitForProofRoute(client, fixtureRoot, "general", 15_000);
      await assertProofRouteAvailable(client, fixtureRoot, route);
      runtimeSurface = await proofRuntimeSurface(client, fixtureRoot);
      if (runtimeSurface.mcpIds.length !== 0 || runtimeSurface.pluginIds.length !== 0) throw new Error("zero-call playbook proof surface is not extension-free");
      const created = await client.session.create({ directory: fixtureRoot, title: "work campaign zero-call preflight" }) as { data?: { id?: string }; error?: unknown };
      if (created.error != null || typeof created.data?.id !== "string") throw new Error("zero-call preflight session creation failed");
      const deleted = await client.session.delete({ directory: fixtureRoot, sessionID: created.data.id }) as { error?: unknown };
      if (deleted.error != null) throw new Error("zero-call preflight session cleanup failed");
      worktreeStatuses.push(worktreeStatus(fixtureRoot, "server-session-cleaned"));
    }
    let offlineController: JsonRecord | null = null;
    if (options.inputRoot != null) {
      const captured = JSON.parse(fs.readFileSync(path.join(options.inputRoot, "raw.json"), "utf8")) as JsonRecord;
      const capturedResults = Array.isArray(captured.assignmentResults) ? captured.assignmentResults as JsonRecord[] : [];
      const phaseInput = materializePhaseInput(
        fixtureRoot,
        fixture,
        captured.playbook as PlaybookResult,
        capturedResults.flatMap((result) => Array.isArray(result.evidenceRefs) ? result.evidenceRefs as string[] : []),
      );
      worktreeStatuses.push(worktreeStatus(fixtureRoot, "captured-records-materialized"));
      const admitted = runPortableCommand(fixtureRoot, [
        process.execPath, path.join(sourceRoot, "global", "bin", "work-campaign.ts"), "run",
        "--root", fixtureRoot, "--definition", "definition.json", "--phase-input", phaseInput,
      ], { capture: true, timeoutMs: 120_000 });
      offlineController = { ...(JSON.parse(admitted.stdout || admitted.stderr) as JsonRecord), exitCode: admitted.status };
      worktreeStatuses.push(worktreeStatus(fixtureRoot, "offline-admission-finished"));
    }
    const raw = {
      candidateId: options.candidateId,
      context: fixture.context,
      environmentId: options.environmentId,
      liveCalls: 0,
      mode: "preflight",
      offlineController,
      runtimeSurface,
      schemaVersion: 1,
      setupCommands: fixture.setupCommands,
      worktreeStatuses,
    };
    writeNew(path.join(options.evidenceRoot, "raw.json"), raw);
    writeNew(path.join(options.evidenceRoot, "evaluation.json"), { candidateId: options.candidateId, environmentId: options.environmentId, liveCalls: 0, schemaVersion: 1, status: "complete" });
  } finally {
    if (server != null) await stopProofServer(server);
    removeProofFixture(proofRoot);
  }
  console.log(JSON.stringify({ candidateId: options.candidateId, liveCalls: 0, mode: "preflight", status: "complete" }));
}

export async function captureConfiguredPlaybook(
  options: ConfiguredPlaybookCaptureOptions,
  hooks: ConfiguredPlaybookCaptureHooks = {},
): Promise<JsonRecord> {
  const ownsFixture = hooks.fixtureRoot == null;
  const proofRoot = ownsFixture
    ? fs.mkdtempSync(path.join(os.tmpdir(), "work-campaign-playbook-capture-"))
    : path.dirname(path.resolve(hooks.fixtureRoot!));
  const fixtureRoot = hooks.fixtureRoot == null ? path.join(proofRoot, "fixture") : path.resolve(hooks.fixtureRoot);
  const runtimeRoot = path.join(proofRoot, "runtime");
  const profile = loadModelProfile(sourceRoot, options.profile).profile;
  const configured = profile.agent?.general as { model?: string } | undefined;
  if (typeof configured?.model !== "string") throw new Error("Configured general model route is unavailable");
  if (hooks.runtime != null && hooks.runtime.expectedModel !== configured.model) {
    throw new Error("Injected configured playbook route differs from selected profile");
  }
  if (ownsFixture) {
    for (const relative of ["cache", "config-home", "data/opencode", "state"]) fs.mkdirSync(path.join(runtimeRoot, relative), { recursive: true });
    seedProofModelsCatalog(runtimeRoot, [configured.model]);
  }
  let server: ProofServerHandle | null = null;
  let serverUrl = hooks.runtime?.serverUrl ?? null;
  let serverTerminal = false;
  let executionEnvironment = hooks.runtime?.environment ?? process.env;
  let installedOpenCode: JsonRecord | null = hooks.runtime?.installedOpenCode ?? null;
  let captureError: unknown = null;
  let fixture: ReturnType<typeof createFixture> | null = null;
  let playbook: Awaited<ReturnType<typeof runSemanticPlaybook>> | null = null;
  const controller: JsonRecord = {};
  let sourceBefore: string | null = null;
  let sourceAfter: string | null = null;
  let optionalSourceBefore: string | null = null;
  let optionalSourceAfter: string | null = null;
  let finalClosure: CampaignClosureMatrix | null = null;
  let missionDirtyStatus: JsonRecord | null = null;
  let startup: JsonRecord = {};
  let runtimeSurface: ProofRuntimeSurface | null = null;
  const assignmentResults: SemanticAssignmentResult[] = [];
  const assignmentCommands: JsonRecord[] = [];
  const worktreeStatuses: JsonRecord[] = [];
  let transitionKinds: string[] = [];
  try {
    fixture = createFixture(fixtureRoot, hooks.hostResume === true);
    sourceBefore = sourceDigest(fixtureRoot);
    optionalSourceBefore = sourceDigest(fixtureRoot, "src/format.mjs");
    worktreeStatuses.push(worktreeStatus(fixtureRoot, "fixture-created"));
    if (hooks.runtime == null) {
      const isolatedConfigDir = path.join(runtimeRoot, "config-source");
      writeIsolatedProofConfig(isolatedConfigDir, profile);
      executionEnvironment = configuredProofServerEnvironment(process.env, isolatedConfigDir, runtimeRoot, profile);
      server = await startProofServer(options.opencode!, fixtureRoot, executionEnvironment);
      serverUrl = server.url;
      const client = proofClient(server.url, fixtureRoot);
      const route = await waitForProofRoute(client, fixtureRoot, "general", 15_000);
      await assertProofRouteAvailable(client, fixtureRoot, route);
      if (`${route.model.providerID}/${route.model.modelID}` !== configured.model) throw new Error("Configured playbook route differs from selected profile");
      runtimeSurface = await proofRuntimeSurface(client, fixtureRoot);
      if (runtimeSurface.mcpIds.length !== 0 || runtimeSurface.pluginIds.length !== 0) throw new Error("configured playbook proof surface is not extension-free");
      installedOpenCode = installedOpenCodeIdentity(options.opencode!);
    } else {
      runtimeSurface = hooks.runtime.runtimeSurface;
    }
    if (serverUrl == null) throw new Error("Configured playbook runtime URL is unavailable");

    const execute = async (job: SemanticPlaybookJob): Promise<SemanticAssignmentResult> => {
      worktreeStatuses.push(worktreeStatus(fixtureRoot, `assignment-${job.assignment.assignmentId}-before`));
      const assignmentPath = `.work-campaign/evidence/assignments/${job.assignment.assignmentId}.json`;
      writeNew(path.join(fixtureRoot, assignmentPath), job.assignment);
      const execution = runPortableCommand(fixtureRoot, [
        process.execPath,
        path.join(sourceRoot, "global", "bin", "work-campaign-semantic-executor.ts"),
        "execute", "--root", fixtureRoot, "--definition", "definition.json", "--assignment", assignmentPath,
        "--result", job.resultPath, "--server-url", serverUrl, "--agent", "general",
      ], { capture: true, env: executionEnvironment, timeoutMs: 300_000 });
      assignmentCommands.push({ assignmentId: job.assignment.assignmentId, exitCode: execution.status, stderr: execution.stderr.slice(0, 1_000), stdout: execution.stdout.slice(0, 1_000) });
      const result = JSON.parse(fs.readFileSync(path.join(fixtureRoot, job.resultPath), "utf8")) as SemanticAssignmentResult;
      assignmentResults.push(result);
      worktreeStatuses.push(worktreeStatus(fixtureRoot, `assignment-${job.assignment.assignmentId}-finished`));
      return result;
    };
    playbook = await runSemanticPlaybook(fixture.context, configuredFactory(fixture.context, {
      "item-format-name": fixture.blocks.find((block) => block.id === "block-format")!.digest,
      "item-zero-divisor": fixture.blocks.find((block) => block.id === "block-main")!.digest,
    }, fixture.missionDefinitionDigest), execute);
    if (playbook.status !== "complete" || playbook.wave == null) throw new Error("configured semantic playbook did not produce a wave candidate");
    worktreeStatuses.push(worktreeStatus(fixtureRoot, "playbook-finished"));

    const phaseInput = materializePhaseInput(
      fixtureRoot,
      fixture,
      playbook,
      assignmentResults.flatMap((result) => result.evidenceRefs),
    );
    worktreeStatuses.push(worktreeStatus(fixtureRoot, "phase-input-materialized"));
    const missionEnvironment = configuredMissionEnvironment(executionEnvironment, fixture.missionBin);
    const admitted = runPortableCommand(fixtureRoot, [
      process.execPath, path.join(sourceRoot, "global", "bin", "work-campaign.ts"), "run",
      "--root", fixtureRoot, "--definition", "definition.json", "--phase-input", phaseInput,
      "--global-source", path.join(sourceRoot, "global"), "--mission-adapter", "mission-adapter.json",
    ], { capture: true, env: missionEnvironment, timeoutMs: 300_000 });
    controller.admission = {
      ...(JSON.parse(admitted.stdout || admitted.stderr) as JsonRecord),
      exitCode: admitted.status,
    };
    if (admitted.status !== 3) throw new Error(`campaign mission launch failed: ${admitted.stderr || admitted.stdout}`);
    missionDirtyStatus = worktreeStatus(fixtureRoot, "mission-source-written");
    command(fixtureRoot, ["git", "add", "--all"]);
    command(fixtureRoot, [
      "git", "-c", "user.name=Campaign Proof", "-c", "user.email=campaign-proof@example.invalid",
      "-c", "commit.gpgsign=false", "commit", "-m", "checkpoint mission-owned configured correction",
    ]);
    worktreeStatuses.push(worktreeStatus(fixtureRoot, "mission-source-checkpointed"));
    controller.resume = await consumeConfiguredFirstMissionHandoff(
      fixtureRoot,
      fixture.definitionDigest,
      missionEnvironment,
      hooks.firstMissionResume,
      {
        endpoint: serverUrl,
        version: typeof installedOpenCode?.version === "string" ? installedOpenCode.version : "unknown",
      },
    );

    const currentMainDigest = sourceDigest(fixtureRoot);
    const currentFormatDigest = sourceDigest(fixtureRoot, "src/format.mjs");
    const currentCandidateDigest = campaignDigest([
      { path: "src/format.mjs", sha256: currentFormatDigest },
      { path: "src/main.mjs", sha256: currentMainDigest },
    ]);
    const currentBlockMain: CampaignInventoryBlock = {
      ...fixture.blocks.find((block) => block.id === "block-main")!,
      digest: currentMainDigest,
      reviewStatus: "reviewed-with-finding",
    };
    const currentBlocks = [fixture.blocks.find((block) => block.id === "block-format")!, currentBlockMain]
      .sort((left, right) => left.id.localeCompare(right.id));
    const currentContext: SemanticPlaybookContext = {
      ...fixture.context,
      blocks: currentBlocks,
      candidateDigest: currentCandidateDigest,
      inventoryDigest: campaignDigest(currentBlocks),
    };
    const rereviewJob = assignmentJob(currentContext, "rereview-wave-zero-divisor", "discovery", ["block-main"], [
      "Read current src/main.mjs after the completed zero-divisor mission. The zero guard is fixed, but the original bounded safeDivide scope still allows a negative divisor and that is one new material P1 candidate.",
      `Inside the outer envelope payload return partition id partition-rereview-main, assignmentId rereview-wave-zero-divisor, blockIds [block-main], candidateDigest ${currentCandidateDigest}, inventoryDigest ${currentContext.inventoryDigest}, required producerSessionRef, evidenceRefs [file:src/main.mjs], recordType partition-result, schemaVersion 1, status complete, workItemIds [item-negative-divisor].`,
      "Return workItems with exactly one candidate: id item-negative-divisor, sourceBlockIds [block-main], principleRef principle:first-do-no-harm, scenario 'Calling safeDivide with a negative divisor returns an out-of-envelope value instead of null.', evidenceRefs [file:src/main.mjs], impact 'The accepted bounded invalid-divisor contract is violated.', likelyCause 'The guard handles zero but not negative divisors.', proposedOutcome 'Return null when divisor is negative.', affectedPaths and ownedPaths [src/main.mjs], effectClasses [local-write], confidence high, initialSeverity P1, required producerSessionRef, recordType work-item, schemaVersion 1, status candidate.",
      "Return no prose and no additional field.",
    ].join(" "));
    const rereviewResult = await execute(rereviewJob);
    if (rereviewResult.status !== "complete") throw new Error("configured first changed-block rereview did not complete");
    const rereviewInput = materializeVerificationInput(fixtureRoot, "rereview-input", rereviewJob, "semantic-rereview-input", [["rereview-block-main.json", currentBlockMain]]);
    const rereview = runPortableCommand(fixtureRoot, [
      process.execPath, path.join(sourceRoot, "global", "bin", "work-campaign.ts"), "verify",
      "--root", fixtureRoot, "--definition", "definition.json", "--verification-input", rereviewInput,
    ], { capture: true, env: missionEnvironment, timeoutMs: 120_000 });
    controller.firstRereview = { ...(JSON.parse(rereview.stdout || rereview.stderr) as JsonRecord), exitCode: rereview.status };
    if (rereview.status !== 3) throw new Error(`campaign first rereview failed: ${rereview.stderr || rereview.stdout}`);

    const reconcileJob = assignmentJob(currentContext, "reconcile-item-negative-divisor", "reconciliation", ["block-main"], [
      "Read current src/main.mjs and independently reconcile item-negative-divisor without relying on the discovery verdict.",
      `Inside the outer payload return exactly reconciliation with id reconcile-item-negative-divisor, workItemId item-negative-divisor, candidateDigest ${currentCandidateDigest}, sourceDigest ${currentMainDigest}, required producerSessionRef, evidenceRefs [file:src/main.mjs], disposition confirmed, severity P1, recordType reconciliation-result, schemaVersion 1.`,
      "Return no prose and no additional field.",
    ].join(" "));
    const reconcileResult = await execute(reconcileJob);
    if (reconcileResult.status !== "complete") throw new Error("configured next-wave reconciliation did not complete");
    const reconcileInput = materializeVerificationInput(fixtureRoot, "reconcile-input", reconcileJob, "semantic-reconciliation-input", []);
    const reconciled = runPortableCommand(fixtureRoot, [
      process.execPath, path.join(sourceRoot, "global", "bin", "work-campaign.ts"), "verify",
      "--root", fixtureRoot, "--definition", "definition.json", "--verification-input", reconcileInput,
    ], { capture: true, env: missionEnvironment, timeoutMs: 120_000 });
    controller.reconciliation = { ...(JSON.parse(reconciled.stdout || reconciled.stderr) as JsonRecord), exitCode: reconciled.status };
    if (reconciled.status !== 3) throw new Error(`campaign reconciliation failed: ${reconciled.stderr || reconciled.stdout}`);

    const secondWave = {
      campaignId: currentContext.campaignId, candidateDigest: currentCandidateDigest, definitionDigest: currentContext.definitionDigest,
      id: "wave-negative-divisor", missionDefinitionDigest: "0".repeat(64), recordType: "wave-manifest" as const, schemaVersion: 1 as const,
      slices: [{ changeId: "fix-negative-divisor", dependsOn: [], effectClasses: ["local-write" as const], expectedProof: "Run the disposable negative-divisor proof.", id: "slice-negative-divisor", outcome: "Return null for a negative divisor.", ownedPaths: ["src/main.mjs"], validationArgv: ["node", "validate.mjs"], workItemIds: ["item-negative-divisor"] }],
      status: "frozen" as const, workItemIds: ["item-negative-divisor"],
    };
    const currentDefinition = loadWorkCampaignDefinition(fixtureRoot, "definition.json");
    secondWave.missionDefinitionDigest = buildCampaignMissionDefinition(currentDefinition.definition, currentDefinition.definitionDigest, secondWave).definitionDigest;
    const synthesisJob = assignmentJob(currentContext, "synthesize-negative-divisor-wave", "synthesis", ["block-main"], [
      "Freeze exactly the separately confirmed item-negative-divisor into the next remediation wave.",
      "The outer model result must contain exactly assignmentId synthesize-negative-divisor-wave, payload, and schemaVersion 1; do not omit the outer schemaVersion.",
      `Inside the outer payload return exactly wave with this exact JSON value: ${stableJson(secondWave).trim()}`,
      "Return no prose and no additional field.",
    ].join(" "));
    const synthesisResult = await execute(synthesisJob);
    if (synthesisResult.status !== "complete") throw new Error("configured next-wave synthesis did not complete");
    const synthesisInput = materializeVerificationInput(fixtureRoot, "synthesis-input", synthesisJob, "semantic-wave-input", []);
    const secondLaunch = runPortableCommand(fixtureRoot, [
      process.execPath, path.join(sourceRoot, "global", "bin", "work-campaign.ts"), "verify",
      "--root", fixtureRoot, "--definition", "definition.json", "--verification-input", synthesisInput,
      "--global-source", path.join(sourceRoot, "global"), "--mission-adapter", "mission-adapter.json",
    ], { capture: true, env: missionEnvironment, timeoutMs: 300_000 });
    controller.secondLaunch = { ...(JSON.parse(secondLaunch.stdout || secondLaunch.stderr) as JsonRecord), exitCode: secondLaunch.status };
    if (secondLaunch.status !== 3) throw new Error(`campaign second mission launch failed: ${secondLaunch.stderr || secondLaunch.stdout}`);
    const secondResume = runPortableCommand(fixtureRoot, [
      process.execPath, path.join(sourceRoot, "global", "bin", "work-campaign.ts"), "resume",
      "--root", fixtureRoot, "--definition", "definition.json",
    ], { capture: true, env: missionEnvironment, timeoutMs: 120_000 });
    controller.secondResume = { ...(JSON.parse(secondResume.stdout || secondResume.stderr) as JsonRecord), exitCode: secondResume.status };
    if (secondResume.status !== 3) throw new Error(`campaign second mission handoff failed: ${secondResume.stderr || secondResume.stdout}`);
    missionDirtyStatus = worktreeStatus(fixtureRoot, "second-mission-source-written");
    command(fixtureRoot, ["git", "add", "--all"]);
    command(fixtureRoot, ["git", "-c", "user.name=Campaign Proof", "-c", "user.email=campaign-proof@example.invalid", "-c", "commit.gpgsign=false", "commit", "-m", "checkpoint second configured correction"]);
    worktreeStatuses.push(worktreeStatus(fixtureRoot, "second-mission-source-checkpointed"));

    const terminalMainDigest = sourceDigest(fixtureRoot);
    const terminalCandidateDigest = campaignDigest([{ path: "src/format.mjs", sha256: currentFormatDigest }, { path: "src/main.mjs", sha256: terminalMainDigest }]);
    const terminalBlockMain: CampaignInventoryBlock = { ...currentBlockMain, digest: terminalMainDigest };
    const terminalBlocks = [fixture.blocks.find((block) => block.id === "block-format")!, terminalBlockMain].sort((left, right) => left.id.localeCompare(right.id));
    const terminalContext: SemanticPlaybookContext = { ...currentContext, blocks: terminalBlocks, candidateDigest: terminalCandidateDigest, inventoryDigest: campaignDigest(terminalBlocks) };
    const terminalRereviewJob = assignmentJob(terminalContext, "rereview-wave-negative-divisor", "discovery", ["block-main"], [
      "Read current src/main.mjs after the second mission. Both invalid-divisor branches are present and there is no new material work.",
      `Inside the outer payload return partition id partition-rereview-negative, assignmentId rereview-wave-negative-divisor, blockIds [block-main], candidateDigest ${terminalCandidateDigest}, inventoryDigest ${terminalContext.inventoryDigest}, required producerSessionRef, evidenceRefs [file:src/main.mjs], recordType partition-result, schemaVersion 1, status complete, workItemIds [], plus workItems [].`,
      "Return no prose and no additional field.",
    ].join(" "));
    const terminalRereviewResult = await execute(terminalRereviewJob);
    if (terminalRereviewResult.status !== "complete") throw new Error("configured terminal changed-block rereview did not complete");
    const terminalRereviewInput = materializeVerificationInput(fixtureRoot, "terminal-rereview-input", terminalRereviewJob, "semantic-rereview-input", [["terminal-rereview-block-main.json", terminalBlockMain]]);
    const terminalRereview = runPortableCommand(fixtureRoot, [
      process.execPath, path.join(sourceRoot, "global", "bin", "work-campaign.ts"), "verify",
      "--root", fixtureRoot, "--definition", "definition.json", "--verification-input", terminalRereviewInput,
    ], { capture: true, env: missionEnvironment, timeoutMs: 120_000 });
    controller.rereview = { ...(JSON.parse(terminalRereview.stdout || terminalRereview.stderr) as JsonRecord), exitCode: terminalRereview.status };
    if (terminalRereview.status !== 3) throw new Error(`campaign terminal rereview failed: ${terminalRereview.stderr || terminalRereview.stdout}`);
    const preChallengeReadback = runPortableCommand(fixtureRoot, [
      process.execPath, path.join(sourceRoot, "global", "bin", "work-campaign.ts"), "report-readback",
      "--root", fixtureRoot, "--definition", "definition.json",
    ], { capture: true, env: missionEnvironment, timeoutMs: 120_000 });
    if (preChallengeReadback.status !== 0) throw new Error(`campaign pre-challenge readback failed: ${preChallengeReadback.stderr}`);
    const preChallenge = JSON.parse(preChallengeReadback.stdout) as { closure: CampaignClosureMatrix };
    const challengedClosure: CampaignClosureMatrix = { ...preChallenge.closure, challengeStatus: "complete", terminalState: "unknown" };
    const challengeJob = assignmentJob(terminalContext, "final-challenge-wave-negative-divisor", "final-challenge", ["block-format", "block-main"], [
      "Read the current campaign report and the assigned source blocks without mutation.",
      "Challenge whether the two-wave disposable campaign has any unresolved current fact. The retained facts are fully resolved and the challenge is complete, but only the controller may set terminal completion.",
      `Inside the outer envelope payload, return exactly one closure property with this exact closure matrix: ${stableJson(challengedClosure).trim()}`,
      "Return no prose and no additional field.",
    ].join(" "));
    const challengeResult = await execute(challengeJob);
    if (challengeResult.status !== "complete") throw new Error("configured final challenge did not complete");
    const challengeInput = materializeVerificationInput(fixtureRoot, "challenge-input", challengeJob, "semantic-final-challenge-input", []);
    const completed = runPortableCommand(fixtureRoot, [
      process.execPath, path.join(sourceRoot, "global", "bin", "work-campaign.ts"), "verify",
      "--root", fixtureRoot, "--definition", "definition.json", "--verification-input", challengeInput,
    ], { capture: true, env: missionEnvironment, timeoutMs: 120_000 });
    controller.complete = { ...(JSON.parse(completed.stdout || completed.stderr) as JsonRecord), exitCode: completed.status };
    if (completed.status !== 0) throw new Error(`campaign final challenge failed: ${completed.stderr || completed.stdout}`);
    const finalReadback = runPortableCommand(fixtureRoot, [
      process.execPath, path.join(sourceRoot, "global", "bin", "work-campaign.ts"), "report-readback",
      "--root", fixtureRoot, "--definition", "definition.json",
    ], { capture: true, env: missionEnvironment, timeoutMs: 120_000 });
    controller.readback = { ...(JSON.parse(finalReadback.stdout || finalReadback.stderr) as JsonRecord), exitCode: finalReadback.status };
    if (finalReadback.status !== 0) throw new Error(`campaign terminal readback failed: ${finalReadback.stderr}`);
    finalClosure = (controller.readback as JsonRecord).closure as CampaignClosureMatrix;
    const transitionRoot = path.join(fixtureRoot, ".opencode-dev-kit", "runtime", "work-campaigns", "configured-playbook-proof", "transitions");
    transitionKinds = fs.existsSync(transitionRoot)
      ? fs.readdirSync(transitionRoot).sort().map((name) => (JSON.parse(fs.readFileSync(path.join(transitionRoot, name), "utf8")) as JsonRecord).kind as string)
      : [];
    sourceAfter = sourceDigest(fixtureRoot);
    optionalSourceAfter = sourceDigest(fixtureRoot, "src/format.mjs");
  } catch (error) {
    captureError = error;
    if (fs.existsSync(path.join(fixtureRoot, "src", "main.mjs"))) sourceAfter = sourceDigest(fixtureRoot);
  } finally {
    if (server != null) {
      const logs = proofServerLogs(server);
      startup = proofServerStartupFacts(logs.stdout, logs.stderr, path.join(runtimeRoot, "config-source"), [runtimeRoot]);
      try {
        await stopProofServer(server);
        serverTerminal = true;
      } catch (error) {
        captureError ??= error;
      }
    }
    if (ownsFixture) {
      try {
        removeProofFixture(proofRoot);
      } catch (error) {
        captureError ??= error;
      }
    }
  }
  const raw: JsonRecord = {
    assignmentCommands,
    assignmentResults: redact(assignmentResults),
    candidateId: options.candidateId,
    captureError: captureError == null ? null : safeError(captureError),
    captureMode: hooks.runtime == null ? "configured" : "configured-managed",
    controller,
    environmentId: options.environmentId,
    expectedModel: configured.model,
    fixtureRemoved: ownsFixture ? !fs.existsSync(proofRoot) : false,
    hiddenServer: false,
    installedOpenCode,
    loopback: true,
    missionDirtyStatus,
    optionalSourceAfter,
    optionalSourceBefore,
    playbook: redact(playbook),
    profile: options.profile,
    runtimeSurface,
    schemaVersion: 1,
    serverStartup: startup,
    serverTerminal: ownsFixture ? serverTerminal : null,
    sourceAfter,
    sourceBefore,
    finalClosure,
    transitionKinds,
    worktreeStatuses,
  };
  if (hooks.writeEvidence !== false) {
    const evaluation = evaluate(raw, options.candidateId, options.environmentId);
    writeNew(path.join(options.evidenceRoot, "raw.json"), raw);
    writeNew(path.join(options.evidenceRoot, "evaluation.json"), evaluation);
    console.log(JSON.stringify({ candidateId: options.candidateId, liveCalls: assignmentResults.reduce((total, result) => total + result.modelCalls, 0), mode: "capture", status: evaluation.status }));
    if (evaluation.status !== "complete") process.exitCode = 1;
  }
  return raw;
}

function replay(options: Options): void {
  const raw = JSON.parse(fs.readFileSync(path.join(options.inputRoot!, "raw.json"), "utf8")) as JsonRecord;
  const evaluation = evaluate({ ...raw, captureMode: "replay" }, options.candidateId, options.environmentId);
  evaluation.liveCalls = 0;
  writeNew(path.join(options.evidenceRoot, "evaluation.json"), evaluation);
  console.log(JSON.stringify({ candidateId: options.candidateId, liveCalls: 0, mode: "replay", status: evaluation.status }));
  if (evaluation.status !== "complete") process.exitCode = 1;
}

async function main(): Promise<void> {
  if (process.argv.includes("--help") || process.argv.includes("-h")) {
    console.log(usage());
    return;
  }
  const options = parseArgs(process.argv.slice(2));
  if (fs.existsSync(options.evidenceRoot)) throw new Error("--evidence-root must be create-new");
  if (options.mode === "preflight") await preflight(options);
  else if (options.mode === "capture") await captureConfiguredPlaybook(options);
  else replay(options);
}

function isMainModule(): boolean {
  const entrypoint = process.argv[1];
  return Boolean(entrypoint && import.meta.url === pathToFileURL(path.resolve(entrypoint)).href);
}

if (isMainModule()) {
  main().catch((error) => {
    console.error(safeError(error));
    process.exitCode = 1;
  });
}
