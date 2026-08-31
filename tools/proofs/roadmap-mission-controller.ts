#!/usr/bin/env node
import { spawn, spawnSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { runPortableCommand } from "../../global/bin/portable-process.ts";
import {
  loadMissionDefinition,
  missionDefinitionDigest,
  parseMissionDefinition,
} from "../../global/bin/roadmap-mission/contracts.ts";
import { missionParentWaveDigest } from "../../global/bin/roadmap-mission/parent-correlation.ts";
import { MISSION_SOURCE_PATHS } from "../../global/bin/roadmap-mission/preflight.ts";
import { clearMissionStopIntent, readMissionSchedulingFacts, readMissionStateProjection, readMissionStopIntent, recordMissionStopIntent, recordMissionUnknownPause } from "../../global/bin/roadmap-mission/state.ts";

type Options = { candidateId: string; evidenceRoot: string; help: boolean; inputRoot: string | null; mode: "campaign" | "diagnose" | "hard-kill" | "replay" | "stop" };

const sourceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const productionEntrypoint = path.join(sourceRoot, "global", "bin", "roadmap-mission.ts");

function record(value: unknown): Record<string, unknown> | null {
  return value != null && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null;
}

function usage(): string {
  return "Usage: node tools/proofs/roadmap-mission-controller.ts [--mode campaign|diagnose|hard-kill|stop] --candidate-id <id> --evidence-root <absolute-new-path> | --mode replay --candidate-id <id> --input-root <capture-path> --evidence-root <absolute-new-path>";
}

function stableValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stableValue);
  if (value == null || typeof value !== "object") return value;
  const input = value as Record<string, unknown>;
  return Object.fromEntries(Object.keys(input).sort().map((key) => [key, stableValue(input[key])]));
}

function json(value: unknown): string {
  return `${JSON.stringify(stableValue(value), null, 2)}\n`;
}

function digest(value: string | Buffer): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function writeNew(file: string, content: string): void {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content, { encoding: "utf8", flag: "wx" });
}

function requiredValue(args: string[], index: number, option: string): string {
  const value = args[index + 1];
  if (value == null || value.trim() === "" || value.startsWith("--")) throw new Error(`Missing value for ${option}`);
  return value;
}

function parseArgs(args: string[]): Options {
  if (args.length === 1 && (args[0] === "--help" || args[0] === "-h")) {
    return { candidateId: "help", evidenceRoot: sourceRoot, help: true, inputRoot: null, mode: "campaign" };
  }
  let candidateId = "";
  let evidenceRoot = "";
  let inputRoot = "";
  let mode = "campaign";
  for (let index = 0; index < args.length; index++) {
    const arg = args[index];
    if (arg === "--candidate-id") {
      candidateId = requiredValue(args, index, arg);
      index++;
    } else if (arg === "--evidence-root") {
      evidenceRoot = requiredValue(args, index, arg);
      index++;
    } else if (arg === "--mode") {
      mode = requiredValue(args, index, arg);
      index++;
    } else if (arg === "--input-root") {
      inputRoot = requiredValue(args, index, arg);
      index++;
    } else throw new Error(`Unknown option: ${arg}`);
  }
  if (mode !== "campaign" && mode !== "diagnose" && mode !== "hard-kill" && mode !== "replay" && mode !== "stop") throw new Error("--mode must be campaign, diagnose, hard-kill, replay, or stop");
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]{0,99}$/.test(candidateId)) throw new Error("--candidate-id must be a safe identifier");
  if (!path.isAbsolute(evidenceRoot)) throw new Error("--evidence-root must be absolute");
  if (mode === "replay" && !path.isAbsolute(inputRoot)) throw new Error("replay requires absolute --input-root");
  if (mode !== "replay" && inputRoot !== "") throw new Error("--input-root is only valid for replay");
  return { candidateId, evidenceRoot: path.resolve(evidenceRoot), help: false, inputRoot: inputRoot === "" ? null : path.resolve(inputRoot), mode };
}

function proposal(): string {
  return [
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
}

function createChange(root: string, changeId: string, checked: boolean): void {
  const change = path.join(root, "openspec", "changes", changeId);
  fs.mkdirSync(path.join(change, "specs", "demo"), { recursive: true });
  fs.writeFileSync(path.join(change, "proposal.md"), proposal(), "utf8");
  fs.writeFileSync(path.join(change, "history.md"), "# Strategy History\n", "utf8");
  fs.writeFileSync(path.join(change, "tasks.md"), `# Tasks\n\n- [${checked ? "x" : " "}] Complete ${changeId}.\n`, "utf8");
  fs.writeFileSync(path.join(change, "specs", "demo", "spec.md"), "# Demo\n", "utf8");
}

function mission(): string {
  return json({
    allowedEffects: ["hardware", "local-read", "local-write"],
    authorizationRefs: { hardware: "owner-reference-fixture" },
    checkpoint: { localCommitAuthorized: false, mode: "evidence-only", workspace: "disposable" },
    evidencePath: "evidence/mission",
    missionId: "controller-proof",
    roadmapPath: "docs/roadmap.md",
    schemaVersion: 1,
    slices: [
      {
        changeId: "change-a",
        dependsOn: [],
        effectClasses: ["local-read", "local-write"],
        id: "slice-a",
        operation: "continue",
        outcome: "Complete the existing disposable change after one recoverable local miss.",
        ownedPaths: ["openspec/changes/change-a"],
      },
      {
        changeId: "change-b",
        dependsOn: ["slice-a"],
        effectClasses: ["local-read", "local-write"],
        id: "slice-b",
        operation: "propose",
        outcome: "Create and complete the second disposable change.",
        ownedPaths: ["openspec/changes/change-b"],
      },
      {
        changeId: "change-c",
        dependsOn: ["slice-b"],
        effectClasses: ["hardware"],
        id: "slice-c",
        operation: "propose",
        outcome: "Stop before the unavailable protected effect.",
        ownedPaths: ["openspec/changes/change-c"],
      },
    ],
    stopPolicy: { onExternalBlocked: true, onOwnerRequired: true, onUnknown: true },
    validationArgv: ["node", "tools/validate.mjs"],
    workflowOwner: { mode: "global-canonical" },
  });
}

function scopedSchedulingMission(
  missionId: string,
  firstSliceProductDecision: boolean,
  checkpointMode: "evidence-only" | "external" | "local-commit" = "evidence-only",
): string {
  const localCommit = checkpointMode === "local-commit";
  return json({
    allowedEffects: ["hardware", ...(localCommit ? ["local-commit"] : []), "local-read", "local-write"],
    authorizationRefs: { hardware: "owner-reference-fixture", ...(localCommit ? { "local-commit": "disposable-proof-authorization" } : {}) },
    checkpoint: { localCommitAuthorized: localCommit, mode: checkpointMode, workspace: checkpointMode === "evidence-only" ? "disposable" : "persistent" },
    evidencePath: "evidence/mission",
    missionId,
    roadmapPath: "docs/roadmap.md",
    schemaVersion: 1,
    slices: [
      {
        changeId: "change-a",
        dependsOn: [],
        effectClasses: firstSliceProductDecision ? ["local-read", "local-write"] : ["hardware"],
        id: "slice-a",
        operation: "continue",
        outcome: firstSliceProductDecision ? "Park one material product decision." : "Wait for one unavailable protected effect.",
        ownedPaths: ["openspec/changes/change-a"],
      },
      {
        changeId: "change-b",
        dependsOn: [],
        effectClasses: ["local-read", "local-write"],
        id: "slice-b",
        operation: "propose",
        outcome: "Complete the independent sibling.",
        ownedPaths: ["openspec/changes/change-b"],
      },
      {
        changeId: "change-c",
        dependsOn: ["slice-a"],
        effectClasses: ["local-read", "local-write"],
        id: "slice-c",
        operation: "propose",
        outcome: "Remain blocked by the first slice.",
        ownedPaths: ["openspec/changes/change-c"],
      },
      {
        changeId: "change-d",
        dependsOn: [],
        effectClasses: ["local-read", "local-write"],
        id: "slice-d",
        operation: "propose",
        outcome: "Remain blocked by overlapping ownership.",
        ownedPaths: ["openspec/changes/change-a/overlap"],
      },
    ],
    stopPolicy: { onExternalBlocked: true, onOwnerRequired: true, onUnknown: true },
    validationArgv: ["node", "tools/validate.mjs"],
    workflowOwner: { mode: "global-canonical" },
  });
}

function checkpointMission(mode: "external" | "local-commit", missionId: string): string {
  const localCommit = mode === "local-commit";
  return json({
    allowedEffects: [
      "hardware",
      ...(localCommit ? ["local-commit"] : []),
      "local-read",
      "local-write",
    ],
    authorizationRefs: {
      hardware: "owner-reference-fixture",
      ...(localCommit ? { "local-commit": "disposable-proof-authorization" } : {}),
    },
    checkpoint: {
      localCommitAuthorized: localCommit,
      mode,
      workspace: "persistent",
    },
    evidencePath: "evidence/mission",
    missionId,
    roadmapPath: "docs/roadmap.md",
    schemaVersion: 1,
    slices: [
      {
        changeId: "change-a",
        dependsOn: [],
        effectClasses: ["local-read", "local-write"],
        id: "slice-a",
        operation: "continue",
        outcome: "Complete and checkpoint the first disposable change.",
        ownedPaths: ["openspec/changes/change-a"],
      },
      {
        changeId: "change-b",
        dependsOn: ["slice-a"],
        effectClasses: localCommit ? ["hardware"] : ["local-read", "local-write"],
        id: "slice-b",
        operation: "propose",
        outcome: localCommit ? "Stop before the protected successor." : "Complete and checkpoint the second disposable change.",
        ownedPaths: ["openspec/changes/change-b"],
      },
      ...(!localCommit ? [{
        changeId: "change-c",
        dependsOn: ["slice-b"],
        effectClasses: ["hardware"],
        id: "slice-c",
        operation: "propose",
        outcome: "Stop before the protected successor.",
        ownedPaths: ["openspec/changes/change-c"],
      }] : []),
    ],
    stopPolicy: { onExternalBlocked: true, onOwnerRequired: true, onUnknown: true },
    validationArgv: ["node", "tools/validate.mjs"],
    workflowOwner: { mode: "global-canonical" },
  });
}

function installFakeOpenSpec(bin: string): void {
  const script = path.join(bin, "fake-openspec.mjs");
  writeNew(script, [
    "import fs from 'node:fs';",
    "import path from 'node:path';",
    "const args = process.argv.slice(2);",
    "const changesRoot = path.resolve('openspec/changes');",
    "const active = () => fs.existsSync(changesRoot) ? fs.readdirSync(changesRoot, { withFileTypes: true }).filter((entry) => entry.isDirectory() && entry.name !== 'archive').map((entry) => entry.name).sort() : [];",
    "if (args[0] === '--version') { console.log('1.6.0'); process.exit(0); }",
    "if (args[0] === 'list' && args.includes('--json')) { console.log(JSON.stringify({ changes: active().map((name) => ({ name })) })); process.exit(0); }",
    "if (args[0] === 'status' && args.includes('--json')) {",
    "  const change = args[args.indexOf('--change') + 1];",
    "  const changeRoot = path.join(changesRoot, change);",
    "  console.log(JSON.stringify({ changeRoot, isComplete: true, artifacts: [{ id: 'tasks', status: 'done' }], artifactPaths: { tasks: { existingOutputPaths: [path.join(changeRoot, 'tasks.md')] } } }));",
    "  process.exit(0);",
    "}",
    "if (args[0] === 'validate') { console.log(JSON.stringify({ valid: true })); process.exit(0); }",
    "if (args[0] === 'archive' && args.includes('--json')) {",
    "  const change = args[1];",
    "  const source = path.join(changesRoot, change);",
    "  const archiveRoot = path.join(changesRoot, 'archive');",
    "  fs.mkdirSync(archiveRoot, { recursive: true });",
    "  const destination = path.join(archiveRoot, change);",
    "  fs.renameSync(source, destination);",
    "  fs.mkdirSync(path.join('evidence', 'mission'), { recursive: true });",
    "  fs.appendFileSync(path.join('evidence', 'mission', 'archive-calls.txt'), change + '\\n');",
    "  console.log(JSON.stringify({ archive: { change, archivedAs: change, path: destination, specsUpdated: false, totals: {} }, status: [] }));",
    "  process.exit(0);",
    "}",
    "console.error('unexpected openspec invocation: ' + args.join(' '));",
    "process.exit(99);",
    "",
  ].join("\n"));
  if (process.platform === "win32") {
    writeNew(path.join(bin, "openspec.cmd"), `@echo off\r\nnode "%~dp0fake-openspec.mjs" %*\r\n`);
  } else {
    const wrapper = path.join(bin, "openspec");
    writeNew(wrapper, `#!/usr/bin/env sh\nexec node "$(dirname "$0")/fake-openspec.mjs" "$@"\n`);
    fs.chmodSync(wrapper, 0o755);
  }
}

function installExecutor(root: string): void {
  writeNew(path.join(root, "tools", "executor.mjs"), [
    "import fs from 'node:fs';",
    "import path from 'node:path';",
    "const [operation, change, slice, attempt, resultPath, definitionDigest, missionId] = process.argv.slice(2);",
    "const countFile = path.join('evidence', 'mission', 'executor-counts.json');",
    "fs.mkdirSync(path.dirname(countFile), { recursive: true });",
    "const counts = fs.existsSync(countFile) ? JSON.parse(fs.readFileSync(countFile, 'utf8')) : {};",
    "counts[slice] = (counts[slice] ?? 0) + 1;",
    "fs.writeFileSync(countFile, JSON.stringify(counts, null, 2) + '\\n');",
    "const evidenceRoot = path.dirname(resultPath);",
    "fs.mkdirSync(evidenceRoot, { recursive: true });",
    "const commands = operation === 'propose' ? ['opsx-propose', 'opsx-apply'] : ['opsx-apply'];",
    "const changeRoot = path.join('openspec', 'changes', change);",
    "if (fs.existsSync(path.join('tools', 'block-' + slice + '-product'))) {",
    "  fs.mkdirSync(changeRoot, { recursive: true });",
    "  fs.writeFileSync(path.join(changeRoot, 'partial.txt'), 'parked partial\\n');",
    "  const phaseCommand = operation === 'propose' ? 'opsx-propose' : 'opsx-apply';",
    "  const evidenceRef = path.join(evidenceRoot, phaseCommand + '.json').replaceAll('\\\\', '/');",
    "  fs.writeFileSync(evidenceRef, JSON.stringify({ command: phaseCommand, schemaVersion: 1, status: 'failed' }) + '\\n');",
    "  const blocker = {",
    "    affectedItemRefs: [slice],",
    "    decisions: [{ affectedItemRefs: [slice], decisionPoint: 'Select the accepted product behavior.', evidenceRefs: [evidenceRef], id: 'decision-' + slice, optionInvariantItemRefs: slice === 'slice-a' ? ['slice-b'] : [], questionRef: 'question-' + slice }],",
    "    disposition: 'product-decision-required', evidenceRefs: [evidenceRef], frontier: null,",
    "    gates: [{ affectedItemRefs: [slice], evidenceRefs: [evidenceRef], id: 'product-decision-' + slice, kind: 'product-decision', resumeCondition: 'Owner selects the accepted product behavior.' }],",
    "    resumeCondition: 'Owner selects the accepted product behavior.', rootSessionRef: 'proof-session-a', source: 'completion-guard', waitKind: null,",
    "  };",
    "  fs.writeFileSync(resultPath, JSON.stringify({",
    "    attempt: Number(attempt), blocker, changeId: change, cleanup: 'complete', definitionDigest, disposition: 'product-decision-required',",
    "    errorClass: 'product-decision-required', errorMessage: blocker.resumeCondition, evidenceRefs: [evidenceRef], guardState: 'product-decision-required', missionId,",
    "    phases: [{ command: phaseCommand, evidenceRef, status: 'failed' }], questionDisposition: 'product-decision-required', rootSessionRef: 'proof-session-a',",
    "    runtimeRef: '0'.repeat(64), schemaVersion: 1, sliceId: slice, tool: 'roadmap-mission-session-executor', writerClosure: 'terminal',",
    "  }, null, 2) + '\\n');",
    "  process.exit(1);",
    "}",
    "const skipMutation = slice === 'slice-a' && counts[slice] === 1;",
    "if (!skipMutation && operation === 'propose') {",
    "  fs.mkdirSync(path.join(changeRoot, 'specs', 'demo'), { recursive: true });",
    `  fs.writeFileSync(path.join(changeRoot, 'proposal.md'), ${JSON.stringify(proposal())});`,
    "  fs.writeFileSync(path.join(changeRoot, 'history.md'), '# Strategy History\\n');",
    "  fs.writeFileSync(path.join(changeRoot, 'specs', 'demo', 'spec.md'), '# Demo\\n');",
    "}",
    "if (!skipMutation) fs.writeFileSync(path.join(changeRoot, 'tasks.md'), '# Tasks\\n\\n- [x] Complete ' + change + '.\\n');",
    "const evidenceRefs = commands.map((command) => {",
    "  const file = path.join(evidenceRoot, command + '.json').replaceAll('\\\\', '/');",
    "  fs.writeFileSync(file, JSON.stringify({ command, schemaVersion: 1, status: 'completed' }) + '\\n');",
    "  return file;",
    "});",
    "fs.writeFileSync(resultPath, JSON.stringify({",
    "  attempt: Number(attempt), changeId: change, cleanup: 'complete', definitionDigest, disposition: 'completed',",
    "  errorClass: 'none', errorMessage: null, evidenceRefs, guardState: 'passed', missionId,",
    "  phases: commands.map((command, index) => ({ command, evidenceRef: evidenceRefs[index], status: 'completed' })),",
    "  questionDisposition: 'none', rootSessionRef: 'proof-session', runtimeRef: '0'.repeat(64), schemaVersion: 1,",
    "  sliceId: slice, tool: 'roadmap-mission-session-executor', writerClosure: 'terminal',",
    "}, null, 2) + '\\n');",
    "process.exit(0);",
    "",
  ].join("\n"));
}

function git(root: string, args: string[]): void {
  const result = runPortableCommand(root, ["git", ...args], {
    capture: true,
    env: {
      ...process.env,
      GIT_AUTHOR_NAME: "Mission Controller Proof",
      GIT_AUTHOR_EMAIL: "mission-controller@example.invalid",
      GIT_COMMITTER_NAME: "Mission Controller Proof",
      GIT_COMMITTER_EMAIL: "mission-controller@example.invalid",
    },
  });
  if (result.error != null || result.status !== 0) {
    throw new Error(`git ${args.join(" ")} failed: ${result.stderr || result.stdout || result.error?.message}`);
  }
}

function installGlobalSource(globalSource: string): void {
  for (const relative of [
    "bin/openspec-operation-gate.ts",
    "bin/openspec-archive.ts",
    "bin/openspec-change/automation-dividend.ts",
    "bin/openspec-change/bounded-falsification.ts",
    "bin/openspec-change/claims.ts",
    "bin/openspec-change/delivery-horizon.ts",
    "bin/openspec-change/gate.ts",
    "bin/openspec-change/inventory.ts",
    "bin/openspec-change/manifest.ts",
    "bin/openspec-change/ownership.ts",
    "bin/openspec-change/state.ts",
    "bin/portable-process.ts",
    ...MISSION_SOURCE_PATHS,
    "bin/roadmap-mission/controller-adapter.ts",
    "bin/roadmap-mission/controller-process.ts",
    "bin/roadmap-mission/controller-result.ts",
  ]) {
    const destination = path.join(globalSource, relative);
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.copyFileSync(path.join(sourceRoot, "global", relative), destination);
  }
  fs.copyFileSync(path.join(sourceRoot, "global", "AGENTS.md"), path.join(globalSource, "AGENTS.md"));
  fs.copyFileSync(path.join(sourceRoot, "global", "principles-of-work.md"), path.join(globalSource, "principles-of-work.md"));
  for (const name of ["change-ready-sdlc", "openspec-apply-change", "openspec-archive-change", "openspec-propose"]) {
    const destination = path.join(globalSource, "skills", name, "SKILL.md");
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.copyFileSync(path.join(sourceRoot, "global", "skills", name, "SKILL.md"), destination);
  }
  for (const name of ["opsx-apply", "opsx-archive", "opsx-propose"]) {
    const destination = path.join(globalSource, "commands", `${name}.md`);
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.copyFileSync(path.join(sourceRoot, "global", "commands", `${name}.md`), destination);
  }
  writeNew(path.join(globalSource, "opencode.json"), json({
    $schema: "https://opencode.ai/config.json",
    instructions: [path.join(globalSource, "principles-of-work.md").replaceAll("\\", "/")],
    permission: "ask",
  }));
  writeNew(path.join(globalSource, "package.json"), json({ private: true, type: "module" }));
}

function createProject(root: string): void {
  fs.mkdirSync(root, { recursive: true });
  writeNew(path.join(root, "AGENTS.md"), "# Project Instructions\n\n## Runtime Authority\n");
  writeNew(path.join(root, "docs", "roadmap.md"), "# Disposable Controller Roadmap\n");
  writeNew(path.join(root, "mission.json"), mission());
  writeNew(path.join(root, "controller-adapter.json"), json({
    executorArgv: ["node", "tools/executor.mjs", "{operation}", "{changeId}", "{sliceId}", "{attempt}", "{resultPath}", "{definitionDigest}", "{missionId}"],
    maxAttemptsPerSlice: 3,
    maxWallClockMsPerSlice: 60_000,
    schemaVersion: 1,
  }));
  writeNew(path.join(root, "opencode-dev-kit", "adapter.json"), json({
    schemaVersion: 1,
    validation: {
      build: "node tools/validate.mjs",
      focusedTest: "node tools/validate.mjs",
      lint: "node tools/validate.mjs",
      test: "node tools/validate.mjs",
      typecheck: "node tools/validate.mjs",
    },
  }));
  writeNew(path.join(root, "tools", "validate.mjs"), "process.exit(0);\n");
  installExecutor(root);
  createChange(root, "change-a", false);
  git(root, ["init"]);
  git(root, ["add", "--", "."]);
  git(root, ["commit", "-m", "fixture"]);
}

function createParentProject(root: string): void {
  createProject(root);
  const fixture = parentMission();
  fs.rmSync(path.join(root, "openspec", "changes", "change-a"), { recursive: true });
  git(root, ["add", "-u", "--", "openspec/changes/change-a"]);
  git(root, ["commit", "-m", "remove pre-existing change before parent mission"]);
  fs.writeFileSync(path.join(root, "mission.json"), fixture.mission, "utf8");
  writeNew(path.join(root, "evidence", "campaign", "wave.json"), fixture.wave);
}

function createCheckpointProject(root: string, mode: "external" | "local-commit", missionId: string): void {
  createProject(root);
  fs.writeFileSync(path.join(root, "mission.json"), checkpointMission(mode, missionId), "utf8");
  fs.writeFileSync(path.join(root, "openspec", "changes", "change-a", "tasks.md"), "# Tasks\n\n- [ ] Complete change-a.\n", "utf8");
  git(root, ["add", "--", "."]);
  git(root, ["commit", "-m", `configure ${mode} checkpoint fixture`]);
}

function createScopedSchedulingProject(
  root: string,
  productSlice: "slice-a" | "slice-b" | null,
  checkpointMode: "evidence-only" | "external" | "local-commit" = "evidence-only",
): void {
  createProject(root);
  const missionId = `${productSlice ?? "protected"}-${checkpointMode}-sibling-proof`;
  fs.writeFileSync(
    path.join(root, "mission.json"),
    scopedSchedulingMission(missionId, productSlice === "slice-a", checkpointMode),
    "utf8",
  );
  if (productSlice != null) {
    fs.writeFileSync(path.join(root, "tools", `block-${productSlice}-product`), "fixture\n", "utf8");
  }
  git(root, ["add", "--", "."]);
  git(root, ["commit", "-m", `configure ${productSlice == null ? "protected" : productSlice} sibling fixture`]);
}

function invokeController(
  project: string,
  globalSource: string,
  bin: string,
  operation: "resume" | "run",
  checkpointIdentity?: string,
) {
  const result = runPortableCommand(project, [
    process.execPath,
    productionEntrypoint,
    operation,
    "--root",
    project,
    "--global-source",
    globalSource,
    "--mission",
    "mission.json",
    "--adapter",
    "controller-adapter.json",
    ...(checkpointIdentity == null ? [] : ["--checkpoint-identity", checkpointIdentity]),
  ], {
    capture: true,
    env: {
      ...process.env,
      GIT_AUTHOR_EMAIL: "mission-controller@example.invalid",
      GIT_AUTHOR_NAME: "Mission Controller Proof",
      GIT_COMMITTER_EMAIL: "mission-controller@example.invalid",
      GIT_COMMITTER_NAME: "Mission Controller Proof",
      OPENCODE_CONFIG_DIR: globalSource,
      PATH: `${bin}${path.delimiter}${process.env.PATH ?? ""}`,
    },
  });
  if (result.error != null) throw result.error;
  if (result.stdout.includes(project) || result.stdout.includes(globalSource)) {
    throw new Error("Controller output exposed an absolute disposable path");
  }
  return result;
}

function gitText(root: string, args: string[]): string {
  const result = runPortableCommand(root, ["git", ...args], { capture: true });
  if (result.error != null || result.status !== 0) {
    throw new Error(`git ${args.join(" ")} failed: ${result.stderr || result.stdout || result.error?.message}`);
  }
  return result.stdout.trim();
}

function controllerReport(result: { status: number | null; stdout: string; stderr: string }, stage: string): Record<string, unknown> {
  try {
    return JSON.parse(result.stdout) as Record<string, unknown>;
  } catch {
    throw new Error(`${stage} did not return JSON (exit ${String(result.status)}): ${result.stderr.trim() || "<empty stderr>"}`);
  }
}

function transitionKinds(root: string, missionId = "controller-proof"): string[] {
  const directory = path.join(root, ".opencode-dev-kit", "runtime", "roadmap-missions", missionId, "transitions");
  return fs.readdirSync(directory).sort().map((file) =>
    (JSON.parse(fs.readFileSync(path.join(directory, file), "utf8")) as { kind: string }).kind
  );
}

function run(options: Options): void {
  if (fs.existsSync(options.evidenceRoot)) throw new Error("Evidence root already exists");
  const fixture = fs.mkdtempSync(path.join(os.tmpdir(), "roadmap-mission-controller-proof-"));
  let cleanupError: string | null = null;
  try {
    const project = path.join(fixture, "project");
    const globalSource = path.join(fixture, "global-source");
    const bin = path.join(fixture, "bin");
    installGlobalSource(globalSource);
    installFakeOpenSpec(bin);
    createProject(project);
    const result = invokeController(project, globalSource, bin, "run");
    if (result.status !== 1) throw new Error(`Expected terminal protected blocker exit 1, got ${String(result.status)}: ${result.stderr || result.stdout}`);
    const report = controllerReport(result, "serial controller") as { cursor: number; status: string };
    if (report.status !== "waiting" || report.cursor !== 2) throw new Error(`Controller terminal result differed: ${result.stdout}`);
    const counts = JSON.parse(fs.readFileSync(path.join(project, "evidence", "mission", "executor-counts.json"), "utf8")) as Record<string, number>;
    if (counts["slice-a"] !== 2 || counts["slice-b"] !== 1 || counts["slice-c"] != null) {
      throw new Error(`Executor counts differed: ${json(counts)}`);
    }
    const archives = fs.readFileSync(path.join(project, "evidence", "mission", "archive-calls.txt"), "utf8").trim().split(/\r?\n/);
    if (archives.join(",") !== "change-a,change-b") throw new Error(`Archive calls differed: ${archives.join(",")}`);
    const kinds = transitionKinds(project);
    if (
      kinds.filter((kind) => kind === "archive").length !== 2 ||
      !kinds.includes("slice-blocked") ||
      kinds.at(-1) !== "frontier-stop"
    ) {
      throw new Error(`Controller transition chain differed: ${kinds.join(",")}`);
    }
    const replay = runPortableCommand(project, [process.execPath, productionEntrypoint, "state-replay", "--root", project, "--mission", "mission.json"], { capture: true });
    if (replay.status !== 0 || (JSON.parse(replay.stdout) as { status: string }).status !== "valid") {
      throw new Error(`Controller replay failed: ${replay.stderr || replay.stdout}`);
    }

    const productSiblingProject = path.join(fixture, "product-sibling-project");
    createScopedSchedulingProject(productSiblingProject, "slice-a");
    const productSiblingFirst = invokeController(productSiblingProject, globalSource, bin, "run");
    const productSiblingFirstReport = controllerReport(productSiblingFirst, "product sibling controller") as {
      blocker?: { disposition: string };
      cursor: number;
      status: string;
    };
    const productSiblingCountsPath = path.join(productSiblingProject, "evidence", "mission", "executor-counts.json");
    const productSiblingArchivesPath = path.join(productSiblingProject, "evidence", "mission", "archive-calls.txt");
    const productSiblingCountsFirst = JSON.parse(fs.readFileSync(productSiblingCountsPath, "utf8")) as Record<string, number>;
    const productSiblingArchivesFirst = fs.readFileSync(productSiblingArchivesPath, "utf8").trim().split(/\r?\n/);
    const productSiblingKindsFirst = transitionKinds(productSiblingProject, "slice-a-evidence-only-sibling-proof");
    if (
      productSiblingFirst.status !== 1 ||
      productSiblingFirstReport.status !== "product-decision-required" ||
      productSiblingFirstReport.blocker?.disposition !== "product-decision-required" ||
      productSiblingFirstReport.cursor !== 0 ||
      productSiblingCountsFirst["slice-a"] !== 1 ||
      productSiblingCountsFirst["slice-b"] !== 1 ||
      productSiblingCountsFirst["slice-c"] != null ||
      productSiblingCountsFirst["slice-d"] != null ||
      productSiblingArchivesFirst.join(",") !== "change-b" ||
      productSiblingKindsFirst.includes("slice-blocked") ||
      productSiblingKindsFirst.indexOf("session-completion") >= productSiblingKindsFirst.indexOf("archive") ||
      productSiblingKindsFirst.at(-1) !== "frontier-stop"
    ) {
      throw new Error(`Product-blocked mission did not drain only its independent sibling: ${productSiblingFirst.stderr || productSiblingFirst.stdout}`);
    }
    const productSiblingResume = invokeController(productSiblingProject, globalSource, bin, "resume");
    const productSiblingResumeReport = controllerReport(productSiblingResume, "product sibling resume") as { cursor: number; status: string };
    const productSiblingCountsAfter = JSON.parse(fs.readFileSync(productSiblingCountsPath, "utf8")) as Record<string, number>;
    const productSiblingArchivesAfter = fs.readFileSync(productSiblingArchivesPath, "utf8").trim().split(/\r?\n/);
    const productSiblingKindsAfter = transitionKinds(productSiblingProject, "slice-a-evidence-only-sibling-proof");
    if (
      productSiblingResume.status !== 1 ||
      productSiblingResumeReport.status !== "product-decision-required" ||
      productSiblingResumeReport.cursor !== 0 ||
      productSiblingCountsAfter["slice-a"] !== 2 ||
      productSiblingCountsAfter["slice-b"] !== 1 ||
      productSiblingCountsAfter["slice-c"] != null ||
      productSiblingCountsAfter["slice-d"] != null ||
      productSiblingArchivesAfter.join(",") !== "change-b" ||
      productSiblingKindsAfter.slice(productSiblingKindsFirst.length).some((kind) => kind === "checkpoint" || kind === "slice-blocked")
    ) {
      throw new Error(`Product-blocked resume repeated a completed sibling checkpoint: ${productSiblingResume.stderr || productSiblingResume.stdout}`);
    }

    const protectedSiblingProject = path.join(fixture, "protected-sibling-project");
    createScopedSchedulingProject(protectedSiblingProject, null);
    const protectedSiblingFirst = invokeController(protectedSiblingProject, globalSource, bin, "run");
    const protectedSiblingFirstReport = controllerReport(protectedSiblingFirst, "protected sibling controller") as {
      blocker?: { disposition: string; waitKind: string | null };
      cursor: number;
      status: string;
    };
    const protectedSiblingCountsPath = path.join(protectedSiblingProject, "evidence", "mission", "executor-counts.json");
    const protectedSiblingArchivesPath = path.join(protectedSiblingProject, "evidence", "mission", "archive-calls.txt");
    const protectedSiblingCountsFirst = JSON.parse(fs.readFileSync(protectedSiblingCountsPath, "utf8")) as Record<string, number>;
    const protectedSiblingArchivesFirst = fs.readFileSync(protectedSiblingArchivesPath, "utf8").trim().split(/\r?\n/);
    const protectedSiblingKindsFirst = transitionKinds(protectedSiblingProject, "protected-evidence-only-sibling-proof");
    if (
      protectedSiblingFirst.status !== 1 ||
      protectedSiblingFirstReport.status !== "waiting" ||
      protectedSiblingFirstReport.blocker?.disposition !== "waiting" ||
      protectedSiblingFirstReport.blocker.waitKind == null ||
      protectedSiblingFirstReport.cursor !== 0 ||
      protectedSiblingCountsFirst["slice-a"] != null ||
      protectedSiblingCountsFirst["slice-b"] !== 1 ||
      protectedSiblingCountsFirst["slice-c"] != null ||
      protectedSiblingCountsFirst["slice-d"] != null ||
      protectedSiblingArchivesFirst.join(",") !== "change-b" ||
      protectedSiblingKindsFirst.indexOf("slice-blocked") >= protectedSiblingKindsFirst.indexOf("archive") ||
      protectedSiblingKindsFirst.at(-1) !== "frontier-stop"
    ) {
      throw new Error(`Protected mission did not drain only its independent sibling: ${protectedSiblingFirst.stderr || protectedSiblingFirst.stdout}`);
    }
    const protectedSiblingResume = invokeController(protectedSiblingProject, globalSource, bin, "resume");
    const protectedSiblingResumeReport = controllerReport(protectedSiblingResume, "protected sibling resume") as { cursor: number; status: string };
    const protectedSiblingCountsAfter = JSON.parse(fs.readFileSync(protectedSiblingCountsPath, "utf8")) as Record<string, number>;
    const protectedSiblingArchivesAfter = fs.readFileSync(protectedSiblingArchivesPath, "utf8").trim().split(/\r?\n/);
    const protectedSiblingKindsAfter = transitionKinds(protectedSiblingProject, "protected-evidence-only-sibling-proof");
    if (
      protectedSiblingResume.status !== 1 ||
      protectedSiblingResumeReport.status !== "waiting" ||
      protectedSiblingResumeReport.cursor !== 0 ||
      protectedSiblingCountsAfter["slice-a"] != null ||
      protectedSiblingCountsAfter["slice-b"] !== 1 ||
      protectedSiblingCountsAfter["slice-c"] != null ||
      protectedSiblingCountsAfter["slice-d"] != null ||
      protectedSiblingArchivesAfter.join(",") !== "change-b" ||
      protectedSiblingKindsAfter.slice(protectedSiblingKindsFirst.length).filter((kind) => kind === "checkpoint").length !== 0
    ) {
      throw new Error(`Protected resume repeated a completed sibling checkpoint: ${protectedSiblingResume.stderr || protectedSiblingResume.stdout}`);
    }

    const mixedBlockerProject = path.join(fixture, "mixed-blocker-project");
    createScopedSchedulingProject(mixedBlockerProject, "slice-b");
    const mixedBlockerResult = invokeController(mixedBlockerProject, globalSource, bin, "run");
    const mixedBlockerReport = controllerReport(mixedBlockerResult, "mixed blocker controller") as {
      blocker?: { disposition: string };
      cursor: number;
      status: string;
    };
    const mixedBlockerDefinition = loadMissionDefinition(mixedBlockerProject, "mission.json");
    const mixedBlockerFacts = readMissionSchedulingFacts(mixedBlockerProject, mixedBlockerDefinition);
    const mixedBlockerCounts = JSON.parse(fs.readFileSync(path.join(mixedBlockerProject, "evidence", "mission", "executor-counts.json"), "utf8")) as Record<string, number>;
    const mixedBlockerKinds = transitionKinds(mixedBlockerProject, "slice-b-evidence-only-sibling-proof");
    if (
      mixedBlockerResult.status !== 1 ||
      mixedBlockerReport.status !== "product-decision-required" ||
      mixedBlockerReport.blocker?.disposition !== "product-decision-required" ||
      mixedBlockerReport.cursor !== 1 ||
      mixedBlockerCounts["slice-a"] != null ||
      mixedBlockerCounts["slice-b"] !== 1 ||
      mixedBlockerCounts["slice-c"] != null ||
      mixedBlockerCounts["slice-d"] != null ||
      mixedBlockerFacts.parkedSlices.map((entry) => entry.blocker.disposition).sort().join(",") !== "product-decision-required,waiting" ||
      mixedBlockerKinds.at(-1) !== "frontier-stop"
    ) {
      throw new Error(`Mixed parked blockers did not prioritize the product decision after frontier drain: ${mixedBlockerResult.stderr || mixedBlockerResult.stdout}`);
    }

    const localSiblingProject = path.join(fixture, "local-sibling-project");
    createScopedSchedulingProject(localSiblingProject, "slice-a", "local-commit");
    const localSiblingResult = invokeController(localSiblingProject, globalSource, bin, "run");
    const localSiblingReport = controllerReport(localSiblingResult, "local checkpoint sibling controller") as { cursor: number; status: string };
    const localSiblingHead = gitText(localSiblingProject, ["rev-parse", "HEAD"]);
    const localSiblingCommittedPaths = gitText(localSiblingProject, ["diff-tree", "--no-commit-id", "--name-only", "-r", localSiblingHead])
      .split(/\r?\n/).filter(Boolean).sort();
    const localSiblingDirty = gitText(localSiblingProject, ["status", "--short"]);
    const localSiblingCounts = JSON.parse(fs.readFileSync(path.join(localSiblingProject, "evidence", "mission", "executor-counts.json"), "utf8")) as Record<string, number>;
    if (
      localSiblingResult.status !== 1 ||
      localSiblingReport.status !== "product-decision-required" ||
      localSiblingReport.cursor !== 0 ||
      localSiblingCounts["slice-a"] !== 1 ||
      localSiblingCounts["slice-b"] !== 1 ||
      localSiblingCommittedPaths.some((file) => file === "openspec/changes/change-a" || file.startsWith("openspec/changes/change-a/")) ||
      !localSiblingDirty.includes("openspec/changes/change-a/partial.txt")
    ) {
      throw new Error(`Local checkpoint absorbed or lost parked slice paths: ${localSiblingResult.stderr || localSiblingResult.stdout}`);
    }

    const externalSiblingProject = path.join(fixture, "external-sibling-project");
    createScopedSchedulingProject(externalSiblingProject, "slice-a", "external");
    const externalSiblingFirst = invokeController(externalSiblingProject, globalSource, bin, "run");
    const externalSiblingFirstReport = controllerReport(externalSiblingFirst, "external checkpoint sibling controller") as { cursor: number; status: string };
    if (externalSiblingFirst.status !== 1 || externalSiblingFirstReport.status !== "paused" || externalSiblingFirstReport.cursor !== 1) {
      throw new Error(`External sibling checkpoint did not pause for identity: ${externalSiblingFirst.stderr || externalSiblingFirst.stdout}`);
    }
    git(externalSiblingProject, ["add", "-A", "--", "evidence/mission", "openspec/changes/archive/change-b"]);
    git(externalSiblingProject, ["commit", "-m", "external sibling checkpoint"]);
    const externalSiblingIdentity = gitText(externalSiblingProject, ["rev-parse", "HEAD"]);
    const externalSiblingResume = invokeController(externalSiblingProject, globalSource, bin, "resume", externalSiblingIdentity);
    const externalSiblingResumeReport = controllerReport(externalSiblingResume, "external checkpoint sibling resume") as { cursor: number; status: string };
    const externalSiblingCounts = JSON.parse(fs.readFileSync(path.join(externalSiblingProject, "evidence", "mission", "executor-counts.json"), "utf8")) as Record<string, number>;
    const externalSiblingArchives = fs.readFileSync(path.join(externalSiblingProject, "evidence", "mission", "archive-calls.txt"), "utf8").trim().split(/\r?\n/);
    const externalSiblingKinds = transitionKinds(externalSiblingProject, "slice-a-external-sibling-proof");
    if (
      externalSiblingResume.status !== 1 ||
      externalSiblingResumeReport.status !== "product-decision-required" ||
      externalSiblingResumeReport.cursor !== 0 ||
      externalSiblingCounts["slice-a"] !== 2 ||
      externalSiblingCounts["slice-b"] !== 1 ||
      externalSiblingArchives.join(",") !== "change-b" ||
      externalSiblingKinds.filter((kind) => kind === "checkpoint").length !== 1
    ) {
      throw new Error(`External checkpoint did not resume around parked slice paths exactly once: ${externalSiblingResume.stderr || externalSiblingResume.stdout}`);
    }

    const parentProject = path.join(fixture, "parent-project");
    createParentProject(parentProject);
    const parentResult = invokeController(parentProject, globalSource, bin, "run");
    const parentReport = controllerReport(parentResult, "parent-correlated controller") as {
      parentHandoff?: {
        archiveRefs: string[];
        checkpoint: { identity: string | null };
        cleanupClosure: string;
        disposition: string;
        ownerCondition: string | null;
        retryCondition: string | null;
        sessionRefs: string[];
        writerClosure: string;
      };
      status: string;
    };
    const parentHandoff = parentReport.parentHandoff;
    if (
      parentResult.status !== 0 ||
      parentReport.status !== "complete" ||
      parentHandoff?.disposition !== "complete" ||
      parentHandoff.writerClosure !== "terminal" ||
      parentHandoff.cleanupClosure !== "terminal" ||
      parentHandoff.checkpoint.identity !== "evidence:parent-controller-proof:slice-a" ||
      parentHandoff.archiveRefs.length !== 1 ||
      parentHandoff.sessionRefs.length !== 1 ||
      parentHandoff.retryCondition != null ||
      parentHandoff.ownerCondition != null ||
      fs.existsSync(path.join(parentProject, ".opencode-dev-kit", "runtime", "roadmap-missions", "parent-controller-proof", "writer.lock"))
    ) {
      throw new Error(`Parent-correlated controller did not emit a terminal-clear handoff: ${parentResult.stderr || parentResult.stdout}`);
    }

    const unknownResumeProject = path.join(fixture, "paused-unknown-resume-project");
    createProject(unknownResumeProject);
    fs.writeFileSync(path.join(unknownResumeProject, "controller-adapter.json"), json({
      executorArgv: ["node", "tools/executor.mjs", "{operation}", "{changeId}", "{sliceId}", "{attempt}", "{resultPath}", "{definitionDigest}", "{missionId}"],
      maxAttemptsPerSlice: 1,
      maxWallClockMsPerSlice: 60_000,
      schemaVersion: 1,
    }), "utf8");
    git(unknownResumeProject, ["add", "--", "."]);
    git(unknownResumeProject, ["commit", "-m", "configure paused-unknown resume fixture"]);
    const unknownDefinition = loadMissionDefinition(unknownResumeProject, "mission.json");
    recordMissionStopIntent(unknownResumeProject, unknownDefinition, {
      controllerPtyRef: "pty-proof-controller",
      requestedAt: new Date().toISOString(),
      rootSessionRef: "session-proof-root",
      source: "slash",
    });
    const stoppedResult = invokeController(unknownResumeProject, globalSource, bin, "run");
    const stoppedReport = controllerReport(stoppedResult, "paused-unknown setup controller") as { status: string };
    const stoppedState = readMissionStateProjection(unknownResumeProject, unknownDefinition);
    if (stoppedResult.status !== 1 || stoppedReport.status !== "paused" || stoppedState?.activeOperation != null) {
      throw new Error(`Paused-unknown setup did not reach a terminal clear pause: ${stoppedResult.stderr || stoppedResult.stdout}`);
    }
    clearMissionStopIntent(unknownResumeProject, unknownDefinition);
    recordMissionUnknownPause(unknownResumeProject, unknownDefinition);
    const unknownBefore = readMissionStateProjection(unknownResumeProject, unknownDefinition);
    const unknownResume = invokeController(unknownResumeProject, globalSource, bin, "resume");
    const unknownAfter = readMissionStateProjection(unknownResumeProject, unknownDefinition);
    const unknownExecutorCounts = path.join(unknownResumeProject, "evidence", "mission", "executor-counts.json");
    if (
      unknownBefore?.disposition !== "paused-unknown" ||
      unknownBefore.activeOperation != null ||
      unknownResume.status !== 1 ||
      !unknownResume.stderr.includes("reconcile writer liveness before resume") ||
      fs.existsSync(unknownExecutorCounts) ||
      unknownAfter?.lastTransitionDigest !== unknownBefore.lastTransitionDigest
    ) {
      throw new Error(`Paused-unknown resume did not fail closed before executor launch: ${unknownResume.stderr || unknownResume.stdout}`);
    }

    const oneAttemptProject = path.join(fixture, "one-attempt-successor-project");
    createProject(oneAttemptProject);
    fs.writeFileSync(path.join(oneAttemptProject, "controller-adapter.json"), json({
      executorArgv: ["node", "tools/executor.mjs", "{operation}", "{changeId}", "{sliceId}", "{attempt}", "{resultPath}", "{definitionDigest}", "{missionId}"],
      maxAttemptsPerSlice: 1,
      maxWallClockMsPerSlice: 60_000,
      schemaVersion: 1,
    }), "utf8");
    fs.mkdirSync(path.join(oneAttemptProject, "evidence", "mission"), { recursive: true });
    fs.writeFileSync(path.join(oneAttemptProject, "evidence", "mission", "executor-counts.json"), json({ "slice-a": 1 }), "utf8");
    git(oneAttemptProject, ["add", "--", "."]);
    git(oneAttemptProject, ["commit", "-m", "configure one-attempt successor fixture"]);
    const oneAttemptResult = invokeController(oneAttemptProject, globalSource, bin, "run");
    const oneAttemptReport = controllerReport(oneAttemptResult, "one-attempt successor controller") as { cursor: number; status: string };
    const oneAttemptCounts = JSON.parse(fs.readFileSync(path.join(oneAttemptProject, "evidence", "mission", "executor-counts.json"), "utf8")) as Record<string, number>;
    const oneAttemptKinds = transitionKinds(oneAttemptProject);
    const successorIndex = oneAttemptKinds.indexOf("successor-activation");
    if (
      oneAttemptResult.status !== 1 ||
      oneAttemptReport.status !== "waiting" ||
      oneAttemptReport.cursor !== 2 ||
      oneAttemptCounts["slice-a"] !== 2 ||
      oneAttemptCounts["slice-b"] !== 1 ||
      oneAttemptCounts["slice-c"] != null ||
      successorIndex < 0 ||
      oneAttemptKinds[successorIndex + 1] !== "session-launch"
    ) {
      throw new Error(`One-attempt successor inherited the prior slice budget: ${oneAttemptResult.stderr || oneAttemptResult.stdout}`);
    }

    const archiveFailureProject = path.join(fixture, "archive-failure-project");
    createProject(archiveFailureProject);
    fs.writeFileSync(path.join(archiveFailureProject, "tools", "validate.mjs"), [
      "import fs from 'node:fs';",
      "process.exit(fs.existsSync('openspec/changes/change-a/tasks.md') ? 0 : 1);",
      "",
    ].join("\n"), "utf8");
    git(archiveFailureProject, ["add", "--", "."]);
    git(archiveFailureProject, ["commit", "-m", "configure after-archive validation failure"]);
    const archiveFailureResult = invokeController(archiveFailureProject, globalSource, bin, "run");
    const archiveFailureDefinition = loadMissionDefinition(archiveFailureProject, "mission.json");
    const archiveFailureState = readMissionStateProjection(archiveFailureProject, archiveFailureDefinition);
    if (
      archiveFailureResult.status !== 1 ||
      archiveFailureState?.disposition !== "blocked" ||
      archiveFailureState.activeOperation != null ||
      archiveFailureState.lastTransitionKind !== "terminal-stop" ||
      !archiveFailureResult.stderr.includes("post-archive validation failed")
    ) {
      throw new Error(`Archive failure did not persist terminal blocked state with cause: ${archiveFailureResult.stderr || archiveFailureResult.stdout}`);
    }

    const retryProject = path.join(fixture, "retry-project");
    createProject(retryProject);
    fs.writeFileSync(path.join(retryProject, "controller-adapter.json"), json({
      executorArgv: ["node", "tools/executor.mjs", "{operation}", "{changeId}", "{sliceId}", "{attempt}", "{resultPath}", "{definitionDigest}", "{missionId}"],
      maxAttemptsPerSlice: 2,
      maxWallClockMsPerSlice: 60_000,
      schemaVersion: 1,
    }), "utf8");
    fs.writeFileSync(path.join(retryProject, "tools", "executor.mjs"), [
      "import fs from 'node:fs';",
      "import path from 'node:path';",
      "const [operation, change, slice, attempt, resultPath, definitionDigest, missionId] = process.argv.slice(2);",
      "const countFile = path.join('evidence', 'mission', 'executor-counts.json');",
      "fs.mkdirSync(path.dirname(countFile), { recursive: true });",
      "const counts = fs.existsSync(countFile) ? JSON.parse(fs.readFileSync(countFile, 'utf8')) : {};",
      "counts[slice] = (counts[slice] ?? 0) + 1;",
      "fs.writeFileSync(countFile, JSON.stringify(counts, null, 2) + '\\n');",
      "const evidenceRoot = path.dirname(resultPath);",
      "fs.mkdirSync(evidenceRoot, { recursive: true });",
      "const evidenceRef = path.join(evidenceRoot, 'opsx-apply.json').replaceAll('\\\\', '/');",
      "fs.writeFileSync(evidenceRef, JSON.stringify({ command: 'opsx-apply', schemaVersion: 1, status: 'failed' }) + '\\n');",
      "fs.writeFileSync(resultPath, JSON.stringify({",
      "  attempt: Number(attempt), changeId: change, cleanup: 'complete', definitionDigest, disposition: 'transient',",
      "  errorClass: 'transient', errorMessage: 'Synthetic transient executor failure', evidenceRefs: [evidenceRef],",
      "  guardState: 'unknown', missionId, phases: [{ command: 'opsx-apply', evidenceRef, status: 'failed' }],",
      "  questionDisposition: 'none', rootSessionRef: null, runtimeRef: '0'.repeat(64), schemaVersion: 1,",
      "  sliceId: slice, tool: 'roadmap-mission-session-executor', writerClosure: 'terminal',",
      "}, null, 2) + '\\n');",
      "process.exit(1);",
      "",
    ].join("\n"), "utf8");
    git(retryProject, ["add", "--", "."]);
    git(retryProject, ["commit", "-m", "configure bounded retry fixture"]);
    const retryFirst = invokeController(retryProject, globalSource, bin, "run");
    const retryFirstReport = controllerReport(retryFirst, "bounded retry controller") as { attempts: number; status: string };
    if (retryFirst.status !== 1 || retryFirstReport.status !== "waiting" || retryFirstReport.attempts !== 2) {
      throw new Error(`Bounded retry controller result differed: ${retryFirst.stderr || retryFirst.stdout}`);
    }
    const retryTransitionsRoot = path.join(retryProject, ".opencode-dev-kit", "runtime", "roadmap-missions", "controller-proof", "transitions");
    const retryTransitionKindsBefore = transitionKinds(retryProject);
    const retryResume = invokeController(retryProject, globalSource, bin, "resume");
    const retryResumeReport = controllerReport(retryResume, "bounded retry resume") as { attempts: number; status: string };
    const retryCounts = JSON.parse(fs.readFileSync(path.join(retryProject, "evidence", "mission", "executor-counts.json"), "utf8")) as Record<string, number>;
    const retryTransitionKindsAfter = transitionKinds(retryProject);
    if (
      retryResume.status !== 1 ||
      retryResumeReport.status !== "waiting" ||
      retryResumeReport.attempts !== 2 ||
      retryCounts["slice-a"] !== 2 ||
      retryTransitionKindsAfter.length !== retryTransitionKindsBefore.length + 3 ||
      retryTransitionKindsAfter.slice(-3).join(",") !== "slice-resume,slice-blocked,frontier-stop"
    ) {
      throw new Error(`Persisted retry limit was not enforced across resume: ${retryResume.stderr || retryResume.stdout}`);
    }

    const localCommitProject = path.join(fixture, "local-commit-project");
    createCheckpointProject(localCommitProject, "local-commit", "local-commit-proof");
    const remote = path.join(fixture, "remote.git");
    fs.mkdirSync(remote);
    git(remote, ["init", "--bare"]);
    git(localCommitProject, ["remote", "add", "origin", remote]);
    const remoteBefore = gitText(remote, ["for-each-ref"]);
    const hook = path.join(localCommitProject, ".git", "hooks", "pre-commit");
    fs.writeFileSync(hook, process.platform === "win32"
      ? "#!/bin/sh\nprintf 'hook-ran\\n' > .git/checkpoint-hook-ran\n"
      : "#!/bin/sh\nprintf 'hook-ran\\n' > .git/checkpoint-hook-ran\n", "utf8");
    fs.chmodSync(hook, 0o755);
    const localHeadBefore = gitText(localCommitProject, ["rev-parse", "HEAD"]);
    const localResult = invokeController(localCommitProject, globalSource, bin, "run");
    const localReport = controllerReport(localResult, "local-commit controller") as { status: string };
    if (localResult.status !== 1 || localReport.status !== "waiting") {
      throw new Error(`Local-commit controller result differed: ${localResult.stderr || localResult.stdout}`);
    }
    const localHeadAfter = gitText(localCommitProject, ["rev-parse", "HEAD"]);
    if (localHeadAfter === localHeadBefore) throw new Error("Local-commit checkpoint did not create a commit");
    const localCommittedPaths = gitText(localCommitProject, ["diff-tree", "--no-commit-id", "--name-only", "-r", localHeadAfter])
      .split(/\r?\n/).filter(Boolean).sort();
    if (localCommittedPaths.some((file) => ![
      ".opencode-dev-kit/runtime/roadmap-missions/local-commit-proof",
      "evidence/mission",
      "openspec/changes/archive/change-a",
      "openspec/changes/change-a",
    ].some((allowed) => file === allowed || file.startsWith(`${allowed}/`)))) {
      throw new Error(`Local-commit checkpoint included an unattributed path: ${localCommittedPaths.join(",")}`);
    }
    if (!fs.existsSync(path.join(localCommitProject, ".git", "checkpoint-hook-ran"))) {
      throw new Error("Local-commit checkpoint did not run the configured pre-commit hook");
    }
    const remoteAfter = gitText(remote, ["for-each-ref"]);
    if (remoteAfter !== remoteBefore) throw new Error("Local-commit checkpoint changed a remote ref");

    const externalProject = path.join(fixture, "external-project");
    createCheckpointProject(externalProject, "external", "external-proof");
    const externalFirst = invokeController(externalProject, globalSource, bin, "run");
    const externalFirstReport = controllerReport(externalFirst, "external checkpoint controller") as { status: string };
    if (externalFirst.status !== 1 || externalFirstReport.status !== "paused") {
      throw new Error(`External checkpoint did not pause: ${externalFirst.stderr || externalFirst.stdout}`);
    }
    const externalCountsPath = path.join(externalProject, "evidence", "mission", "executor-counts.json");
    const externalCountsBefore = fs.readFileSync(externalCountsPath, "utf8");
    const externalArchivesPath = path.join(externalProject, "evidence", "mission", "archive-calls.txt");
    const externalArchivesBefore = fs.readFileSync(externalArchivesPath, "utf8");
    const staleIdentity = gitText(externalProject, ["rev-parse", "HEAD"]);
    const staleExternal = invokeController(externalProject, globalSource, bin, "resume", staleIdentity);
    if (staleExternal.status === 0 || !staleExternal.stderr.includes("does not contain current mission paths")) {
      throw new Error(`Stale external checkpoint unexpectedly passed: ${staleExternal.stderr || staleExternal.stdout}`);
    }
    git(externalProject, ["add", "-A", "--", "openspec/changes/change-a", "openspec/changes/archive/change-a", "evidence/mission"]);
    git(externalProject, ["commit", "-m", "external checkpoint slice-a"]);
    const externalIdentity = gitText(externalProject, ["rev-parse", "HEAD"]);
    const externalResume = invokeController(externalProject, globalSource, bin, "resume", externalIdentity);
    const externalResumeReport = controllerReport(externalResume, "external checkpoint resume") as { cursor: number; status: string };
    if (externalResume.status !== 1 || externalResumeReport.status !== "paused" || externalResumeReport.cursor !== 1) {
      throw new Error(`Verified external checkpoint did not pause at the next checkpoint: ${externalResume.stderr || externalResume.stdout}`);
    }
    const externalCountsAfterSecondSlice = fs.readFileSync(externalCountsPath, "utf8");
    const externalArchivesAfterSecondSlice = fs.readFileSync(externalArchivesPath, "utf8");
    if (externalCountsAfterSecondSlice === externalCountsBefore || externalArchivesAfterSecondSlice === externalArchivesBefore) {
      throw new Error("External checkpoint resume did not execute and archive the second slice");
    }
    git(externalProject, ["add", "-A", "--", "openspec/changes/archive/change-b", "evidence/mission"]);
    git(externalProject, ["commit", "-m", "external checkpoint slice-b"]);
    const secondExternalIdentity = gitText(externalProject, ["rev-parse", "HEAD"]);
    const externalSecondResume = invokeController(externalProject, globalSource, bin, "resume", secondExternalIdentity);
    const externalSecondResumeReport = controllerReport(externalSecondResume, "second external checkpoint resume") as { cursor: number; status: string };
    if (externalSecondResume.status !== 1 || externalSecondResumeReport.status !== "waiting" || externalSecondResumeReport.cursor !== 2) {
      throw new Error(`Second verified external checkpoint did not reach protected successor: ${externalSecondResume.stderr || externalSecondResume.stdout}`);
    }
    if (
      fs.readFileSync(externalCountsPath, "utf8") !== externalCountsAfterSecondSlice ||
      fs.readFileSync(externalArchivesPath, "utf8") !== externalArchivesAfterSecondSlice
    ) {
      throw new Error("Second external checkpoint resume repeated executor or archive work");
    }

    fs.mkdirSync(options.evidenceRoot, { recursive: false });
    writeNew(path.join(options.evidenceRoot, "raw.json"), json({
      archiveCalls: archives,
      candidateId: options.candidateId,
      controller: { cursor: report.cursor, exitCode: result.status, status: report.status },
      environment: { node: process.version, platform: process.platform },
      executorCounts: counts,
      mode: "campaign",
      parentHandoff: {
        archiveCount: parentHandoff.archiveRefs.length,
        checkpoint: parentHandoff.checkpoint.identity,
        cleanupClosure: parentHandoff.cleanupClosure,
        disposition: parentHandoff.disposition,
        ownerCondition: parentHandoff.ownerCondition,
        retryCondition: parentHandoff.retryCondition,
        sessionCount: parentHandoff.sessionRefs.length,
        writerClosure: parentHandoff.writerClosure,
      },
      pausedUnknownResume: {
        activeOperation: unknownAfter.activeOperation,
        disposition: unknownAfter.disposition,
        executorStarted: fs.existsSync(unknownExecutorCounts),
        exitCode: unknownResume.status,
        stateUnchanged: unknownAfter.lastTransitionDigest === unknownBefore.lastTransitionDigest,
      },
      oneAttemptSuccessor: {
        cursor: oneAttemptReport.cursor,
        executorCounts: oneAttemptCounts,
        status: oneAttemptReport.status,
        transitionAfterActivation: oneAttemptKinds[successorIndex + 1],
      },
      archiveFailure: {
        activeOperationCleared: archiveFailureState.activeOperation == null,
        causePreserved: archiveFailureResult.stderr.includes("post-archive validation failed"),
        disposition: archiveFailureState.disposition,
        transition: archiveFailureState.lastTransitionKind,
      },
      replay: JSON.parse(replay.stdout),
      persistedRetry: {
        attemptsAfterResume: retryResumeReport.attempts,
        executorCalls: retryCounts["slice-a"],
        resumeTransitions: retryTransitionKindsAfter.slice(retryTransitionKindsBefore.length),
        transitionsAfterResume: retryTransitionKindsAfter.length,
        transitionsBeforeResume: retryTransitionKindsBefore.length,
      },
      scopedScheduling: {
        checkpointIsolation: {
          external: {
            archiveCalls: externalSiblingArchives,
            cursor: externalSiblingResumeReport.cursor,
            executorCounts: externalSiblingCounts,
            checkpointTransitions: externalSiblingKinds.filter((kind) => kind === "checkpoint").length,
            status: externalSiblingResumeReport.status,
          },
          localCommit: {
            committedPaths: localSiblingCommittedPaths,
            cursor: localSiblingReport.cursor,
            parkedPathRemainsDirty: localSiblingDirty.includes("openspec/changes/change-a/partial.txt"),
            status: localSiblingReport.status,
          },
        },
        mixedBlockers: {
          cursor: mixedBlockerReport.cursor,
          executorCounts: mixedBlockerCounts,
          parkedDispositions: mixedBlockerFacts.parkedSlices.map((entry) => entry.blocker.disposition).sort(),
          status: mixedBlockerReport.status,
          transitionKinds: mixedBlockerKinds,
        },
        productDecision: {
          archiveCalls: productSiblingArchivesAfter,
          cursor: productSiblingResumeReport.cursor,
          executorCounts: productSiblingCountsAfter,
          firstTransitionKinds: productSiblingKindsFirst,
          resumeTransitionKinds: productSiblingKindsAfter.slice(productSiblingKindsFirst.length),
          status: productSiblingResumeReport.status,
        },
        protectedWait: {
          archiveCalls: protectedSiblingArchivesAfter,
          cursor: protectedSiblingResumeReport.cursor,
          executorCounts: protectedSiblingCountsAfter,
          firstTransitionKinds: protectedSiblingKindsFirst,
          resumeTransitionKinds: protectedSiblingKindsAfter.slice(protectedSiblingKindsFirst.length),
          status: protectedSiblingResumeReport.status,
        },
      },
      checkpoints: {
        external: {
          archiveCallsUnchanged: true,
          cursor: externalSecondResumeReport.cursor,
          identity: secondExternalIdentity,
          staleIdentityBlocked: true,
          status: externalSecondResumeReport.status,
        },
        localCommit: {
          committedPaths: localCommittedPaths,
          headAfter: localHeadAfter,
          headBefore: localHeadBefore,
          hook: "ran",
          remoteRefsChanged: false,
        },
      },
      schemaVersion: 1,
      sources: [
        "global/bin/openspec-operation-gate.ts",
        "global/bin/openspec-change/bounded-falsification.ts",
        "global/bin/openspec-change/delivery-horizon.ts",
        "global/bin/openspec-archive.ts",
        "global/bin/portable-process.ts",
        "global/bin/portable-process-supervisor.ts",
        "global/bin/roadmap-mission.ts",
        "global/bin/roadmap-mission/contracts.ts",
        "global/bin/roadmap-mission/controller-adapter.ts",
        "global/bin/roadmap-mission/controller-process.ts",
        "global/bin/roadmap-mission/controller-result.ts",
        "global/bin/roadmap-mission/controller.ts",
        "global/bin/roadmap-mission/parent-correlation.ts",
        "global/bin/roadmap-mission/preflight.ts",
        "global/bin/roadmap-mission/session-executor.ts",
        "global/bin/roadmap-mission/state.ts",
        "global/extensions/session-completion-guard/terminal-certificate.ts",
      ].map((relative) => ({ path: relative, sha256: digest(fs.readFileSync(path.join(sourceRoot, relative))) })),
      transitionKinds: kinds,
    }));
    writeNew(path.join(options.evidenceRoot, "evaluation.json"), json({
      archiveCount: archives.length,
      candidateId: options.candidateId,
      cleanup: "pending",
      executorCalls: { sliceA: counts["slice-a"], sliceB: counts["slice-b"], sliceC: counts["slice-c"] ?? 0 },
      schemaVersion: 1,
      status: "complete",
      archiveFailure: "terminal-blocked-with-cause",
      oneAttemptSuccessor: "launched-with-fresh-budget",
      pausedUnknownResume: "blocked-before-executor",
      parentHandoff: "complete-terminal-clear",
      scopedScheduling: "atomic-park-independent-drain-product-priority-and-checkpoint-isolation",
      terminalProtectedSlice: "waiting-before-executor",
      persistedRetry: "exhausted-resume-launched-no-executor",
      uncheckedCompletion: "rejected-and-retried",
      checkpointModes: {
        external: "paused-then-verified-without-repeat",
        localCommit: "scoped-hooked-no-push",
      },
    }));
  } finally {
    try {
      fs.rmSync(fixture, { recursive: true, force: true });
    } catch (error) {
      cleanupError = error instanceof Error ? error.message : String(error);
    }
  }
  if (cleanupError != null) throw new Error(`Fixture cleanup failed: ${cleanupError}`);
  const evaluationPath = path.join(options.evidenceRoot, "evaluation.json");
  const evaluation = JSON.parse(fs.readFileSync(evaluationPath, "utf8")) as Record<string, unknown>;
  evaluation.cleanup = "complete";
  fs.writeFileSync(evaluationPath, json(evaluation), "utf8");
  console.log(json({ candidateId: options.candidateId, evidenceRoot: "<evidence-root>", status: "complete" }).trimEnd());
}

function parentMission(): { mission: string; wave: string } {
  const wave = {
    campaignId: "campaign-controller-proof",
    candidateDigest: "b".repeat(64),
    definitionDigest: "a".repeat(64),
    id: "wave-controller-proof",
    missionDefinitionDigest: "0".repeat(64),
    recordType: "wave-manifest",
    schemaVersion: 1,
    slices: [{
      changeId: "change-a",
      dependsOn: [],
      effectClasses: ["local-read", "local-write"],
      expectedProof: "Prove the completed disposable change.",
      id: "slice-a",
      outcome: "Complete the parent-correlated disposable change.",
      ownedPaths: ["openspec/changes/change-a"],
      validationArgv: ["node", "tools/validate.mjs"],
      workItemIds: ["item-a"],
    }],
    status: "frozen",
    workItemIds: ["item-a"],
  };
  const definition = {
    allowedEffects: ["local-read", "local-write"],
    authorizationRefs: {},
    checkpoint: { localCommitAuthorized: false, mode: "evidence-only", workspace: "disposable" },
    evidencePath: "evidence/mission",
    missionId: "parent-controller-proof",
    parent: {
      campaignDefinitionDigest: wave.definitionDigest,
      campaignId: wave.campaignId,
      campaignTransitionDigest: "d".repeat(64),
      parentEvidencePath: "evidence/campaign/wave.json",
      schemaVersion: 1,
      waveDigest: missionParentWaveDigest(wave),
      waveId: wave.id,
      workItemRefs: ["item-a"],
    },
    roadmapPath: "docs/roadmap.md",
    schemaVersion: 1,
    slices: [{
      changeId: "change-a",
      dependsOn: [],
      effectClasses: ["local-read", "local-write"],
      id: "slice-a",
      operation: "propose",
      outcome: "Complete the parent-correlated disposable change.",
      ownedPaths: ["openspec/changes/change-a"],
      workItemRefs: ["item-a"],
    }],
    stopPolicy: { onExternalBlocked: true, onOwnerRequired: true, onUnknown: true },
    validationArgv: ["node", "tools/validate.mjs"],
    workflowOwner: { mode: "global-canonical" },
  };
  wave.missionDefinitionDigest = missionDefinitionDigest(parseMissionDefinition(definition));
  return { mission: json(definition), wave: json(wave) };
}

async function waitUntil(predicate: () => boolean, timeoutMs: number, label: string): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  do {
    if (predicate()) return;
    await new Promise((resolve) => setTimeout(resolve, 100));
  } while (Date.now() < deadline);
  throw new Error(`${label} did not become observable within ${timeoutMs}ms`);
}

function descendantProcesses(pid: number, redactions: string[]): unknown[] {
  if (process.platform !== "win32") return [];
  const script = [
    `$rootPid = ${pid}`,
    "$all = @(Get-CimInstance Win32_Process)",
    "$ids = [System.Collections.Generic.HashSet[int]]::new()",
    "$null = $ids.Add($rootPid)",
    "do {",
    "  $before = $ids.Count",
    "  foreach ($row in $all) { if ($ids.Contains([int]$row.ParentProcessId)) { $null = $ids.Add([int]$row.ProcessId) } }",
    "} while ($ids.Count -ne $before)",
    "$all | Where-Object { $ids.Contains([int]$_.ProcessId) } | Select-Object ProcessId,ParentProcessId,Name,CommandLine | ConvertTo-Json -Compress",
  ].join("; ");
  const result = spawnSync("pwsh", ["-NoLogo", "-NoProfile", "-NonInteractive", "-Command", script], { encoding: "utf8", shell: false });
  if (result.status !== 0) return [{ error: String(result.stderr || result.stdout).slice(0, 1_000) }];
  try {
    const parsed = JSON.parse(result.stdout || "[]");
    const rows = Array.isArray(parsed) ? parsed : [parsed];
    return rows.map((row) => {
      const input = record(row) ?? {};
      const commandLine = redactions.reduce((value, root, index) => value.replaceAll(root, index === 0 ? "<project>" : "<global-source>"), String(input.CommandLine ?? ""));
      return { commandLine, name: input.Name ?? null, parentPid: input.ParentProcessId ?? null, pid: input.ProcessId ?? null };
    });
  } catch {
    return [{ error: "process inventory returned invalid JSON" }];
  }
}

function killProofProcessTree(child: ReturnType<typeof spawn>): void {
  if (child.exitCode != null || child.signalCode != null || child.pid == null) return;
  if (process.platform === "win32") {
    spawnSync("taskkill", ["/PID", String(child.pid), "/T", "/F"], { shell: false, stdio: "ignore" });
  } else {
    child.kill("SIGKILL");
  }
}

async function runLaunchDiagnostic(options: Options): Promise<void> {
  if (fs.existsSync(options.evidenceRoot)) throw new Error("Evidence root already exists");
  const fixture = fs.mkdtempSync(path.join(os.tmpdir(), "roadmap-controller-launch-diagnostic-"));
  const globalSource = path.join(fixture, "global-source");
  const bin = path.join(fixture, "bin");
  const project = path.join(fixture, "project");
  let child: ReturnType<typeof spawn> | null = null;
  let raw: Record<string, unknown> | null = null;
  let cleanup = "pending";
  let failure: unknown = null;
  try {
    installFakeOpenSpec(bin);
    installGlobalSource(globalSource);
    createProject(project);
    fs.writeFileSync(path.join(project, "tools", "executor.mjs"), [
      "console.log('controller diagnostic stdout');",
      "console.error('controller diagnostic stderr');",
      "await new Promise((resolve) => setTimeout(resolve, 30000));",
      "process.exit(1);",
      "",
    ].join("\n"), "utf8");
    git(project, ["add", "--", "tools/executor.mjs"]);
    git(project, ["commit", "-m", "configure launch diagnostic"]);
    const environment = {
      ...process.env,
      OPENCODE_CONFIG_DIR: globalSource,
      PATH: `${bin}${path.delimiter}${process.env.PATH ?? ""}`,
    };
    const argv = [
      productionEntrypoint,
      "run",
      "--root",
      project,
      "--global-source",
      globalSource,
      "--mission",
      "mission.json",
      "--adapter",
      "controller-adapter.json",
    ];
    const lifecycle: Array<Record<string, unknown>> = [];
    let stdout = "";
    let stderr = "";
    child = spawn(process.execPath, argv, { cwd: project, env: environment, shell: false, stdio: "pipe" });
    lifecycle.push({ atMs: 0, kind: "spawn-called", pid: child.pid ?? null });
    const startedAt = Date.now();
    child.on("spawn", () => lifecycle.push({ atMs: Date.now() - startedAt, kind: "spawn", pid: child?.pid ?? null }));
    child.on("error", (error) => lifecycle.push({ atMs: Date.now() - startedAt, error: error.message, kind: "error" }));
    child.on("exit", (code, signal) => lifecycle.push({ atMs: Date.now() - startedAt, code, kind: "exit", signal }));
    child.stdout?.on("data", (chunk) => stdout += String(chunk));
    child.stderr?.on("data", (chunk) => stderr += String(chunk));
    const closePromise = new Promise<{ code: number | null; signal: NodeJS.Signals | null }>((resolve) => child!.once("close", (code, signal) => {
      lifecycle.push({ atMs: Date.now() - startedAt, code, kind: "close", signal });
      resolve({ code, signal });
    }));
    const stateFile = path.join(project, ".opencode-dev-kit", "runtime", "roadmap-missions", "controller-proof", "state.json");
    const stateObservation = new Promise<{ kind: "active-streams" }>((resolve) => {
      const interval = setInterval(() => {
        if (!fs.existsSync(stateFile)) return;
        try {
          const state = JSON.parse(fs.readFileSync(stateFile, "utf8")) as Record<string, unknown>;
          if (record(state.activeOperation)?.kind === "session" && stderr.includes("/session/stdout]") && stderr.includes("/session/stderr]")) {
            clearInterval(interval);
            resolve({ kind: "active-streams" });
          }
        } catch {
          // Keep observing until the checkpoint.
        }
      }, 100);
      setTimeout(() => clearInterval(interval), 20_000);
    });
    const observation = await Promise.race([
      stateObservation,
      closePromise.then((close) => ({ kind: "close" as const, close })),
      new Promise<{ kind: "checkpoint" }>((resolve) => setTimeout(() => resolve({ kind: "checkpoint" }), 20_000)),
    ]);
    const processes = descendantProcesses(child.pid ?? -1, [project, globalSource]);
    let state: unknown = null;
    try {
      state = fs.existsSync(stateFile) ? JSON.parse(fs.readFileSync(stateFile, "utf8")) : null;
    } catch {
      state = "unreadable";
    }
    killProofProcessTree(child);
    const closure = await Promise.race([
      closePromise,
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 10_000)),
    ]);
    let reconciledState: unknown = null;
    if (options.mode === "hard-kill" && closure != null) {
      const definition = loadMissionDefinition(project, "mission.json");
      recordMissionUnknownPause(project, definition);
      reconciledState = readMissionStateProjection(project, definition);
    }
    raw = {
      argv: argv.map((value) => value.replaceAll(project, "<project>").replaceAll(globalSource, "<global-source>").replaceAll(sourceRoot, "<source-root>")),
      candidateId: options.candidateId,
      cleanup: "pending",
      closure,
      lifecycle,
      mode: options.mode,
      observation,
      processes,
      reconciledState,
      schemaVersion: 1,
      state,
      stderr: stderr.slice(-20_000).replaceAll(project, "<project>").replaceAll(globalSource, "<global-source>"),
      stdout: stdout.slice(-20_000).replaceAll(project, "<project>").replaceAll(globalSource, "<global-source>"),
    };
  } catch (error) {
    failure = error;
  } finally {
    if (child != null) killProofProcessTree(child);
    try {
      fs.rmSync(fixture, { recursive: true, force: true, maxRetries: 20, retryDelay: 100 });
      cleanup = "complete";
    } catch (error) {
      cleanup = "failed";
      failure ??= error;
    }
  }
  fs.mkdirSync(options.evidenceRoot, { recursive: false });
  if (raw != null) {
    raw.cleanup = cleanup;
    writeNew(path.join(options.evidenceRoot, "raw.json"), json(raw));
    const reconciled = record(raw.reconciledState);
    const checks = options.mode === "hard-kill"
      ? {
          activeOperationPreserved: record(reconciled?.activeOperation)?.kind === "session",
          cleanupComplete: cleanup === "complete",
          closureObserved: raw.closure != null,
          pausedUnknown: reconciled?.disposition === "paused-unknown",
          processStageCaptured: Array.isArray(raw.processes),
        }
      : {
          cleanupComplete: cleanup === "complete",
          closureObserved: raw.closure != null,
          lifecycleCaptured: Array.isArray(raw.lifecycle) && raw.lifecycle.length >= 2,
          observationCaptured: record(raw.observation)?.kind != null,
          processStageCaptured: Array.isArray(raw.processes),
        };
    const evaluation = {
      candidateId: options.candidateId,
      checks,
      proof: false,
      schemaVersion: 1,
      status: Object.values(checks).every(Boolean) ? "complete" : "blocked",
    };
    writeNew(path.join(options.evidenceRoot, "evaluation.json"), json(evaluation));
    console.log(json({ candidateId: options.candidateId, evidenceRoot: "<evidence-root>", mode: options.mode, status: evaluation.status }).trimEnd());
    if (evaluation.status !== "complete") process.exitCode = 1;
  }
  if (failure != null || raw == null) throw failure instanceof Error ? failure : new Error(String(failure));
}

async function runStop(options: Options): Promise<void> {
  if (fs.existsSync(options.evidenceRoot)) throw new Error("Evidence root already exists");
  const fixture = fs.mkdtempSync(path.join(os.tmpdir(), "roadmap-controller-stop-proof-"));
  const globalSource = path.join(fixture, "global-source");
  const bin = path.join(fixture, "bin");
  const project = path.join(fixture, "project");
  let child: ReturnType<typeof spawn> | null = null;
  let raw: Record<string, unknown> | null = null;
  let cleanup = "pending";
  let failure: unknown = null;
  let stdout = "";
  let stderr = "";
  let stateFile = "";
  let closePromise: Promise<{ code: number | null; signal: NodeJS.Signals | null }> | null = null;
  try {
    installFakeOpenSpec(bin);
    installGlobalSource(globalSource);
    createProject(project);
    fs.writeFileSync(path.join(project, "tools", "executor.mjs"), [
      "console.log('controller stop proof stdout');",
      "console.error('controller stop proof stderr');",
      "await new Promise((resolve) => setTimeout(resolve, 30000));",
      "process.exit(1);",
      "",
    ].join("\n"), "utf8");
    git(project, ["add", "--", "tools/executor.mjs"]);
    git(project, ["commit", "-m", "configure stop fixture"]);
    const environment = {
      ...process.env,
      OPENCODE_CONFIG_DIR: globalSource,
      PATH: `${bin}${path.delimiter}${process.env.PATH ?? ""}`,
    };
    const argv = [
      productionEntrypoint,
      "run",
      "--root",
      project,
      "--global-source",
      globalSource,
      "--mission",
      "mission.json",
      "--adapter",
      "controller-adapter.json",
    ];
    child = spawn(process.execPath, argv, { cwd: project, env: environment, shell: false, stdio: "pipe" });
    child.stdout?.on("data", (chunk) => stdout += String(chunk));
    child.stderr?.on("data", (chunk) => stderr += String(chunk));
    child.on("error", (error) => stderr += `controller spawn error: ${error.message}\n`);
    closePromise = new Promise((resolve) => child!.once("close", (code, signal) => resolve({ code, signal })));
    stateFile = path.join(project, ".opencode-dev-kit", "runtime", "roadmap-missions", "controller-proof", "state.json");
    await waitUntil(() => {
      if (child?.exitCode != null || child?.signalCode != null) {
        throw new Error(`Controller exited before active stream observation: code=${String(child.exitCode)} signal=${String(child.signalCode)}`);
      }
      if (!fs.existsSync(stateFile)) return false;
      try {
        const state = JSON.parse(fs.readFileSync(stateFile, "utf8")) as Record<string, unknown>;
        return record(state.activeOperation)?.kind === "session" && stderr.includes("/session/stdout]") && stderr.includes("/session/stderr]");
      } catch {
        return false;
      }
    }, 30_000, "active streamed controller session");
    const definition = loadMissionDefinition(project, "mission.json");
    recordMissionStopIntent(project, definition, {
      controllerPtyRef: "pty:controller-stop-proof",
      rootSessionRef: "session:controller-stop-proof",
      source: "slash",
    });
    const exit = await Promise.race([
      closePromise,
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 15_000)),
    ]);
    if (exit == null) throw new Error("Controller did not stop within 15000ms");
    const projection = readMissionStateProjection(project, definition);
    const intent = readMissionStopIntent(project, definition);
    let report: unknown = null;
    try {
      report = JSON.parse(stdout);
    } catch {
      report = null;
    }
    raw = {
      candidateId: options.candidateId,
      cleanup: "pending",
      controllerExit: exit,
      intent: intent == null ? null : { source: intent.source },
      mode: "stop",
      prefixedStderr: stderr.includes("/session/stderr]"),
      prefixedStdout: stderr.includes("/session/stdout]"),
      projection: projection == null ? null : {
        activeOperation: projection.activeOperation,
        disposition: projection.disposition,
        lastTransitionKind: projection.lastTransitionKind,
      },
      report,
      schemaVersion: 1,
      stderr: stderr.slice(-20_000).replaceAll(project, "<project>").replaceAll(globalSource, "<global-source>"),
    };
  } catch (error) {
    failure = error;
    if (raw == null) {
      let state: unknown = null;
      try {
        state = stateFile !== "" && fs.existsSync(stateFile) ? JSON.parse(fs.readFileSync(stateFile, "utf8")) : null;
      } catch {
        state = "unreadable";
      }
      raw = {
        candidateId: options.candidateId,
        cleanup: "pending",
        error: error instanceof Error ? error.message : String(error),
        mode: "stop-failed",
        schemaVersion: 1,
        state,
        stderr: stderr.slice(-20_000).replaceAll(project, "<project>").replaceAll(globalSource, "<global-source>"),
        stdout: stdout.slice(-20_000).replaceAll(project, "<project>").replaceAll(globalSource, "<global-source>"),
      };
    }
  } finally {
    if (child != null && child.exitCode == null && child.signalCode == null) child.kill("SIGKILL");
    if (closePromise != null) {
      await Promise.race([closePromise, new Promise((resolve) => setTimeout(resolve, 10_000))]);
    }
    try {
      fs.rmSync(fixture, { recursive: true, force: true });
      cleanup = "complete";
    } catch (error) {
      cleanup = "failed";
      failure ??= error;
    }
  }
  fs.mkdirSync(options.evidenceRoot, { recursive: false });
  if (raw != null) {
    raw.cleanup = cleanup;
    writeNew(path.join(options.evidenceRoot, "raw.json"), json(raw));
    const projection = record(raw.projection);
    const report = record(raw.report);
    const checks = {
      activeOperationCleared: projection?.activeOperation == null,
      cleanupComplete: cleanup === "complete",
      controllerPaused: projection?.disposition === "paused" && report?.status === "paused",
      prefixedStderr: raw.prefixedStderr === true,
      prefixedStdout: raw.prefixedStdout === true,
      slashIntent: record(raw.intent)?.source === "slash",
    };
    const evaluation = {
      candidateId: options.candidateId,
      checks,
      schemaVersion: 1,
      status: Object.values(checks).every(Boolean) ? "complete" : "blocked",
    };
    writeNew(path.join(options.evidenceRoot, "evaluation.json"), json(evaluation));
    console.log(json({ candidateId: options.candidateId, evidenceRoot: "<evidence-root>", mode: "stop", status: evaluation.status }).trimEnd());
    if (evaluation.status !== "complete") process.exitCode = 1;
  }
  if (failure != null || raw == null) throw failure instanceof Error ? failure : new Error(String(failure));
}

function replay(options: Options): void {
  if (options.inputRoot == null) throw new Error("Replay input root is missing");
  if (fs.existsSync(options.evidenceRoot)) throw new Error("Evidence root already exists");
  const raw = JSON.parse(fs.readFileSync(path.join(options.inputRoot, "raw.json"), "utf8")) as Record<string, unknown>;
  const mode = raw.mode ?? (Array.isArray(raw.archiveCalls) ? "campaign" : null);
  const checks = mode === "diagnose"
    ? {
        candidateMatched: raw.candidateId === options.candidateId,
        cleanupComplete: raw.cleanup === "complete",
        closureObserved: raw.closure != null,
        lifecycleCaptured: Array.isArray(raw.lifecycle) && raw.lifecycle.length >= 2,
        observationCaptured: record(raw.observation)?.kind != null,
        processStageCaptured: Array.isArray(raw.processes),
      }
    : mode === "campaign"
      ? {
          archivesCompleted: Array.isArray(raw.archiveCalls) && raw.archiveCalls.length === 2,
          candidateMatched: raw.candidateId === options.candidateId,
          checkpointModesCompleted: record(record(raw.checkpoints)?.external)?.status === "waiting"
            && record(record(raw.checkpoints)?.localCommit)?.remoteRefsChanged === false,
          controllerCompleted: record(raw.controller)?.cursor === 2 && record(raw.controller)?.status === "waiting",
          executorSequence: record(raw.executorCounts)?.["slice-a"] === 2
            && record(raw.executorCounts)?.["slice-b"] === 1
            && record(raw.executorCounts)?.["slice-c"] == null,
          oneAttemptSuccessor: record(raw.oneAttemptSuccessor)?.cursor === 2
            && record(raw.oneAttemptSuccessor)?.status === "waiting"
            && record(raw.oneAttemptSuccessor)?.transitionAfterActivation === "session-launch"
            && record(record(raw.oneAttemptSuccessor)?.executorCounts)?.["slice-b"] === 1,
          parentHandoffComplete: record(raw.parentHandoff)?.disposition === "complete"
            && record(raw.parentHandoff)?.writerClosure === "terminal"
            && record(raw.parentHandoff)?.cleanupClosure === "terminal"
            && record(raw.parentHandoff)?.archiveCount === 1
            && record(raw.parentHandoff)?.sessionCount === 1
            && record(raw.parentHandoff)?.retryCondition == null
            && record(raw.parentHandoff)?.ownerCondition == null,
          pausedUnknownResume: record(raw.pausedUnknownResume)?.disposition === "paused-unknown"
            && record(raw.pausedUnknownResume)?.activeOperation == null
            && record(raw.pausedUnknownResume)?.executorStarted === false
            && record(raw.pausedUnknownResume)?.stateUnchanged === true,
          persistedRetryFinite: record(raw.persistedRetry)?.executorCalls === 2,
          replayValid: record(raw.replay)?.status === "valid",
          scopedScheduling: record(record(raw.scopedScheduling)?.productDecision)?.status === "product-decision-required"
            && record(record(raw.scopedScheduling)?.protectedWait)?.status === "waiting"
            && record(record(record(raw.scopedScheduling)?.productDecision)?.executorCounts)?.["slice-b"] === 1
            && record(record(record(raw.scopedScheduling)?.protectedWait)?.executorCounts)?.["slice-b"] === 1
            && record(record(record(raw.scopedScheduling)?.productDecision)?.executorCounts)?.["slice-c"] == null
            && record(record(record(raw.scopedScheduling)?.protectedWait)?.executorCounts)?.["slice-d"] == null
            && Array.isArray(record(record(raw.scopedScheduling)?.productDecision)?.firstTransitionKinds)
            && !(record(record(raw.scopedScheduling)?.productDecision)?.firstTransitionKinds as unknown[]).includes("slice-blocked")
            && record(record(raw.scopedScheduling)?.mixedBlockers)?.status === "product-decision-required"
            && Array.isArray(record(record(raw.scopedScheduling)?.mixedBlockers)?.parkedDispositions)
            && (record(record(raw.scopedScheduling)?.mixedBlockers)?.parkedDispositions as unknown[]).join(",") === "product-decision-required,waiting"
            && record(record(record(raw.scopedScheduling)?.checkpointIsolation)?.localCommit)?.parkedPathRemainsDirty === true
            && Array.isArray(record(record(record(raw.scopedScheduling)?.checkpointIsolation)?.localCommit)?.committedPaths)
            && !(record(record(record(raw.scopedScheduling)?.checkpointIsolation)?.localCommit)?.committedPaths as unknown[])
              .some((file) => typeof file === "string" && (file === "openspec/changes/change-a" || file.startsWith("openspec/changes/change-a/")))
            && record(record(record(raw.scopedScheduling)?.checkpointIsolation)?.external)?.status === "product-decision-required"
            && record(record(record(raw.scopedScheduling)?.checkpointIsolation)?.external)?.checkpointTransitions === 1
            && record(record(record(record(raw.scopedScheduling)?.checkpointIsolation)?.external)?.executorCounts)?.["slice-b"] === 1,
          transitionChainCompleted: Array.isArray(raw.transitionKinds)
            && raw.transitionKinds.filter((kind) => kind === "archive").length === 2
            && raw.transitionKinds.includes("slice-blocked")
            && raw.transitionKinds.at(-1) === "frontier-stop",
        }
      : mode === "hard-kill"
      ? {
          activeOperationPreserved: record(record(raw.reconciledState)?.activeOperation)?.kind === "session",
          candidateMatched: raw.candidateId === options.candidateId,
          cleanupComplete: raw.cleanup === "complete",
          closureObserved: raw.closure != null,
          pausedUnknown: record(raw.reconciledState)?.disposition === "paused-unknown",
          processStageCaptured: Array.isArray(raw.processes),
        }
      : mode === "stop"
      ? {
          activeOperationCleared: record(raw.projection)?.activeOperation == null,
          candidateMatched: raw.candidateId === options.candidateId,
          cleanupComplete: raw.cleanup === "complete",
          controllerPaused: record(raw.projection)?.disposition === "paused" && record(raw.report)?.status === "paused",
          prefixedStderr: raw.prefixedStderr === true,
          prefixedStdout: raw.prefixedStdout === true,
          slashIntent: record(raw.intent)?.source === "slash",
        }
      : null;
  if (checks == null) throw new Error("Replay input mode is unsupported");
  const evaluation = {
    candidateId: options.candidateId,
    checks,
    liveCalls: 0,
    schemaVersion: 1,
    status: Object.values(checks).every(Boolean) ? "complete" : "blocked",
  };
  fs.mkdirSync(options.evidenceRoot, { recursive: false });
  writeNew(path.join(options.evidenceRoot, "evaluation.json"), json(evaluation));
  console.log(json({ candidateId: options.candidateId, evidenceRoot: "<evidence-root>", liveCalls: 0, mode: "replay", status: evaluation.status }).trimEnd());
  if (evaluation.status !== "complete") process.exitCode = 1;
}

try {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) console.log(usage());
  else if (options.mode === "diagnose" || options.mode === "hard-kill") await runLaunchDiagnostic(options);
  else if (options.mode === "replay") replay(options);
  else if (options.mode === "stop") await runStop(options);
  else run(options);
} catch (error) {
  console.error(json({ error: error instanceof Error ? error.message : String(error), status: "blocked" }).trimEnd());
  process.exitCode = 1;
}
