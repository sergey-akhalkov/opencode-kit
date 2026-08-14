#!/usr/bin/env node
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { runPortableCommand } from "../../global/bin/portable-process.ts";
import { loadModelProfile } from "../model-profile.ts";

type Mode = "capture" | "evaluate" | "preflight" | "simulate";
type Options = {
  candidateId: string;
  evidenceRoot: string;
  mode: Mode;
  profile: string;
};

type ProcessFact = {
  argv: string[];
  exitCode: number | null;
  name: string;
  stderr: string;
  stdout: string;
};

type ProviderCall = {
  command: string;
  index: number;
  kind: "configured-provider" | "local-failure" | "simulation";
  operation: string;
  sessionIds: string[];
  sliceId: string;
  status: number | null;
  stderrFile: string | null;
  stdoutFile: string | null;
};

const sourceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const runnerRelative = "tools/proofs/roadmap-mission-provider.ts";
const permission = {
  "*": "deny",
  bash: {
    "*": "deny",
    "git diff*": "allow",
    "git status*": "allow",
    "node *openspec-operation-gate.ts*": "allow",
    "node tools/validate.mjs*": "allow",
    "openspec *": "allow",
    "*;*": "deny",
    "*&&*": "deny",
    "*|*": "deny",
    "*>*": "deny",
    "*<*": "deny",
  },
  edit: "allow",
  external_directory: "deny",
  glob: "allow",
  grep: "allow",
  question: "deny",
  read: "allow",
  skill: "allow",
  task: "deny",
  todowrite: "allow",
  webfetch: "deny",
} as const;

function stableValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stableValue);
  if (value == null || typeof value !== "object") return value;
  const input = value as Record<string, unknown>;
  return Object.fromEntries(Object.keys(input).sort().map((key) => [key, stableValue(input[key])]));
}

function json(value: unknown): string {
  return `${JSON.stringify(stableValue(value), null, 2)}\n`;
}

function sha256(value: string | Buffer): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function writeNew(file: string, content: string): void {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content, { encoding: "utf8", flag: "wx" });
}

function writeJson(file: string, value: unknown): void {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const temporary = `${file}.${process.pid}.tmp`;
  fs.writeFileSync(temporary, json(value), "utf8");
  fs.renameSync(temporary, file);
}

function requiredValue(args: string[], index: number, option: string): string {
  const value = args[index + 1];
  if (value == null || value.trim() === "" || value.startsWith("--")) throw new Error(`Missing value for ${option}`);
  return value;
}

function parseArgs(args: string[]): Options {
  let candidateId = "";
  let evidenceRoot = "";
  let mode: Mode | null = null;
  let profile = "quality-independent";
  for (let index = 0; index < args.length; index++) {
    const arg = args[index];
    if (arg === "--candidate-id") {
      candidateId = requiredValue(args, index, arg);
      index++;
    } else if (arg === "--evidence-root") {
      evidenceRoot = requiredValue(args, index, arg);
      index++;
    } else if (arg === "--mode") {
      const value = requiredValue(args, index, arg);
      if (value !== "capture" && value !== "evaluate" && value !== "preflight" && value !== "simulate") throw new Error("--mode must be preflight, simulate, capture, or evaluate");
      mode = value;
      index++;
    } else if (arg === "--profile") {
      profile = requiredValue(args, index, arg);
      index++;
    } else throw new Error(`Unknown option: ${arg}`);
  }
  if (mode == null) throw new Error("--mode is required");
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]{0,99}$/.test(candidateId)) throw new Error("--candidate-id must be a safe identifier");
  if (!path.isAbsolute(evidenceRoot)) throw new Error("--evidence-root must be absolute");
  return { candidateId, evidenceRoot: path.resolve(evidenceRoot), mode, profile };
}

function safeError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function replaceLiteral(text: string, value: string, replacement: string): string {
  if (value === "") return text;
  const escaped = value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return text.replace(new RegExp(escaped, process.platform === "win32" ? "gi" : "g"), replacement);
}

function redact(text: string, fixture: string): string {
  let result = text;
  for (const [value, replacement] of [
    [fixture, "<fixture>"],
    [sourceRoot, "<kit-root>"],
    [os.homedir(), "<home>"],
  ] as const) {
    for (const variant of [value, value.replaceAll("\\", "\\\\"), value.replaceAll("\\", "/")]) {
      result = replaceLiteral(result, variant, replacement);
    }
  }
  return result;
}

function redactValue(value: unknown, fixture: string): unknown {
  if (typeof value === "string") return redact(value, fixture);
  if (Array.isArray(value)) return value.map((item) => redactValue(item, fixture));
  if (value != null && typeof value === "object") {
    return Object.fromEntries(Object.entries(value as Record<string, unknown>).map(([key, item]) => [key, redactValue(item, fixture)]));
  }
  return value;
}

function run(root: string, argv: string[], environment: NodeJS.ProcessEnv, name: string, timeoutMs = 120_000): ProcessFact {
  const result = runPortableCommand(root, argv, { capture: true, env: environment, timeoutMs });
  if (result.error != null) throw result.error;
  return {
    argv,
    exitCode: result.status,
    name,
    stderr: result.stderr,
    stdout: result.stdout,
  };
}

function git(root: string, args: string[], environment: NodeJS.ProcessEnv): string {
  const result = run(root, ["git", ...args], environment, `git ${args[0]}`);
  if (result.exitCode !== 0) throw new Error(`git ${args.join(" ")} failed: ${result.stderr || result.stdout}`);
  return result.stdout.trim();
}

function proposal(changeId: string, marker: string): string {
  return [
    "## Why",
    "",
    `The disposable mission needs one observable ${marker} marker.`,
    "",
    "## What Changes",
    "",
    `- Create \`src/${marker}.txt\` with exact synthetic content.`,
    "",
    "### Outcome Capsule",
    "",
    `- **Outcome:** ${changeId} creates one deterministic local marker.`,
    "- **Operating Envelope:** Disposable local project with no external effects.",
    "- **Non-Goals:** Network, credentials, commits, deployment, release, or unrelated files.",
    "- **Non-Deferrable Invariants:** Exact content and project containment.",
    `- **Observable Proof:** \`node tools/validate.mjs\` accepts \`src/${marker}.txt\`.`,
    "- **Material Residual Risks:** None; this is an Ordinary Small synthetic fixture.",
    "- **Stop Line:** Stop after the marker and validation evidence exist.",
    "",
    "## Capabilities",
    "",
    "### New Capabilities",
    "",
    `- \`synthetic-${marker}\`: One deterministic disposable marker.`,
    "",
    "## Impact",
    "",
    `- \`src/${marker}.txt\` only.`,
    "",
  ].join("\n");
}

function createInitialChange(project: string): void {
  const root = path.join(project, "openspec", "changes", "change-a");
  fs.mkdirSync(path.join(root, "specs", "synthetic-alpha"), { recursive: true });
  writeNew(path.join(root, ".openspec.yaml"), "schema: spec-driven\ncreated: 2026-08-13\n");
  writeNew(path.join(root, "proposal.md"), proposal("change-a", "alpha"));
  writeNew(path.join(root, "design.md"), "## Context\n\nCreate one local marker.\n\n## Goals / Non-Goals\n\nCreate only `src/alpha.txt`; no external effects.\n\n## Decisions\n\nUse exact UTF-8 text `alpha\\n`.\n\n## Risks / Trade-offs\n\nNone in the disposable fixture.\n");
  writeNew(path.join(root, "history.md"), "# Strategy History\n\nNo attempts are recorded yet.\n");
  writeNew(path.join(root, "tasks.md"), "## 1. Alpha Marker\n\n- [ ] 1.1 Create `src/alpha.txt` containing exactly `alpha` plus one newline, run `node tools/validate.mjs`, and mark this task complete only after the command exits zero.\n");
  writeNew(path.join(root, "specs", "synthetic-alpha", "spec.md"), "## ADDED Requirements\n\n### Requirement: Alpha marker is deterministic\nThe disposable project SHALL contain `src/alpha.txt` with exact text `alpha` and one trailing newline.\n\n#### Scenario: Alpha marker is validated\n- **WHEN** project validation runs after implementation\n- **THEN** it exits zero only for the exact marker content\n");
}

function mission(): string {
  return json({
    allowedEffects: ["hardware", "local-read", "local-write", "provider-inference"],
    authorizationRefs: {
      hardware: "unavailable-protected-proof-boundary",
      "provider-inference": "configured-provider-proof-standing-authorization",
    },
    checkpoint: { localCommitAuthorized: false, mode: "external", workspace: "persistent" },
    evidencePath: "evidence/mission",
    missionId: "configured-provider-proof",
    roadmapPath: "docs/roadmap.md",
    schemaVersion: 1,
    slices: [
      {
        changeId: "change-a",
        dependsOn: [],
        effectClasses: ["local-read", "local-write", "provider-inference"],
        id: "slice-a",
        operation: "continue",
        outcome: "Create and validate the alpha marker after one recoverable local executor failure.",
        ownedPaths: ["openspec/changes/change-a", "openspec/specs/synthetic-alpha", "src/alpha.txt"],
      },
      {
        changeId: "change-b",
        dependsOn: ["slice-a"],
        effectClasses: ["local-read", "local-write", "provider-inference"],
        id: "slice-b",
        operation: "propose",
        outcome: "Propose, implement, and validate the beta marker through the canonical global workflow.",
        ownedPaths: ["openspec/changes/change-b", "openspec/specs/synthetic-beta", "src/beta.txt"],
      },
      {
        changeId: "change-c",
        dependsOn: ["slice-b"],
        effectClasses: ["hardware"],
        id: "slice-c",
        operation: "propose",
        outcome: "Stop before an unavailable protected effect.",
        ownedPaths: ["openspec/changes/change-c"],
      },
    ],
    stopPolicy: { onExternalBlocked: true, onOwnerRequired: true, onUnknown: true },
    validationArgv: ["node", "tools/validate.mjs"],
    workflowOwner: { mode: "global-canonical" },
  });
}

function copyFile(source: string, destination: string): void {
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.copyFileSync(source, destination);
}

function installGlobalSource(globalSource: string, model: string, variant: string): void {
  const files = [
    "AGENTS.md",
    "bin/openspec-archive.ts",
    "bin/openspec-operation-gate.ts",
    "bin/portable-process.ts",
    "bin/roadmap-mission.ts",
    "bin/roadmap-mission/contracts.ts",
    "bin/roadmap-mission/controller.ts",
    "bin/roadmap-mission/preflight.ts",
    "bin/roadmap-mission/state.ts",
    "commands/opsx-apply.md",
    "commands/opsx-archive.md",
    "commands/opsx-propose.md",
    "skills/change-ready-sdlc/SKILL.md",
    "skills/openspec-apply-change/SKILL.md",
    "skills/openspec-archive-change/SKILL.md",
    "skills/openspec-propose/SKILL.md",
  ];
  for (const relative of files) copyFile(path.join(sourceRoot, "global", relative), path.join(globalSource, relative));
  writeNew(path.join(globalSource, "package.json"), json({ private: true, type: "module" }));
  writeNew(path.join(globalSource, "opencode.json"), json({
    $schema: "https://opencode.ai/config.json",
    agent: { build: { model, steps: 100, variant } },
    model,
    permission,
    tool_output: { max_bytes: 30_000, max_lines: 800 },
  }));
}

function executorSource(globalSource: string, model: string, variant: string): string {
  const portableUrl = pathToFileURL(path.join(globalSource, "bin", "portable-process.ts")).href;
  const simulatedBetaFiles = {
    ".openspec.yaml": "schema: spec-driven\ncreated: 2026-08-14\n",
    "design.md": "## Context\n\nCreate one local beta marker.\n\n## Goals / Non-Goals\n\nCreate only `src/beta.txt`; no external effects.\n\n## Decisions\n\nUse exact UTF-8 text `beta\\n`.\n\n## Risks / Trade-offs\n\nNone in the disposable fixture.\n",
    "history.md": "# Strategy History\n\nNo attempts are recorded.\n\n## Final History Retrospective\n\nQuality / Working Repository: none.\nQuality / opencode-kit: none.\nCycle Speed / Working Repository: none.\nCycle Speed / opencode-kit: none.\nToken Economy / Working Repository: none.\nToken Economy / opencode-kit: none.\n",
    "proposal.md": proposal("change-b", "beta"),
    "specs/synthetic-beta/spec.md": "## ADDED Requirements\n\n### Requirement: Beta marker is deterministic\nThe disposable project SHALL contain `src/beta.txt` with exact text `beta` and one trailing newline.\n\n#### Scenario: Beta marker is validated\n- **WHEN** project validation runs after implementation\n- **THEN** it exits zero only for the exact marker content\n",
    "tasks.md": "## 1. Beta Marker\n\n- [x] 1.1 Create and validate `src/beta.txt`.\n\n## 2. Final History Retrospective\n\n- [x] 2.1 Record the final history retrospective once.\n",
  };
  return [
    "import fs from 'node:fs';",
    "import path from 'node:path';",
    `import { runPortableCommand } from ${JSON.stringify(portableUrl)};`,
    `const route = ${JSON.stringify({ model, variant })};`,
    "const [operation, changeId, sliceId] = process.argv.slice(2);",
    "const evidenceRoot = path.join('evidence', 'mission');",
    "const callsFile = path.join(evidenceRoot, 'provider-calls.json');",
    "fs.mkdirSync(evidenceRoot, { recursive: true });",
    "const calls = fs.existsSync(callsFile) ? JSON.parse(fs.readFileSync(callsFile, 'utf8')) : [];",
    "const save = () => fs.writeFileSync(callsFile, JSON.stringify(calls, null, 2) + '\\n');",
    "const sessionIds = (text) => {",
    "  const ids = new Set();",
    "  const visit = (value) => {",
    "    if (Array.isArray(value)) for (const item of value) visit(item);",
    "    else if (value && typeof value === 'object') {",
    "      if (typeof value.sessionID === 'string') ids.add(value.sessionID);",
    "      for (const item of Object.values(value)) visit(item);",
    "    }",
    "  };",
    "  for (const line of text.split(/\\r?\\n/)) { try { visit(JSON.parse(line)); } catch {} }",
    "  return [...ids];",
    "};",
    "const invoke = (command, commandArgs, sessionId = null) => {",
    "  const index = calls.length + 1;",
    "  const argv = ['opencode', 'run', '--pure', '--agent', 'build', '--model', route.model, '--variant', route.variant, '--format', 'json', '--dir', process.cwd(), ...(sessionId == null ? ['--title', `roadmap-provider-${sliceId}-${index}`] : ['--session', sessionId]), '--command', command, ...commandArgs];",
    "  const result = runPortableCommand(process.cwd(), argv, { capture: true, env: process.env, timeoutMs: 900000 });",
    "  const stdoutFile = path.join(evidenceRoot, `provider-${String(index).padStart(2, '0')}.stdout.jsonl`);",
    "  const stderrFile = path.join(evidenceRoot, `provider-${String(index).padStart(2, '0')}.stderr.log`);",
    "  fs.writeFileSync(stdoutFile, result.stdout, 'utf8');",
    "  fs.writeFileSync(stderrFile, result.stderr, 'utf8');",
    "  const ids = sessionIds(result.stdout);",
    "  calls.push({ command, index, kind: 'configured-provider', operation, sessionIds: ids, sliceId, status: result.status, stderrFile: stderrFile.replaceAll('\\\\', '/'), stdoutFile: stdoutFile.replaceAll('\\\\', '/') });",
    "  save();",
    "  return { ...result, sessionIds: ids };",
    "};",
    "const priorSliceCalls = calls.filter((call) => call.sliceId === sliceId);",
    "if (sliceId === 'slice-a' && priorSliceCalls.length === 0) {",
    "  calls.push({ command: 'local-preflight', index: calls.length + 1, kind: 'local-failure', operation, sessionIds: [], sliceId, status: 75, stderrFile: null, stdoutFile: null });",
    "  save();",
    "  console.error('Synthetic local executor preflight failed before provider invocation.');",
    "  process.exit(75);",
    "}",
    "if (process.env.ROADMAP_PROVIDER_SIMULATE === '1') {",
    "  if (sliceId === 'slice-a') {",
    "    fs.mkdirSync('src', { recursive: true });",
    "    fs.writeFileSync(path.join('src', 'alpha.txt'), 'alpha\\n', 'utf8');",
    "    const tasks = path.join('openspec', 'changes', changeId, 'tasks.md');",
    "    fs.writeFileSync(tasks, fs.readFileSync(tasks, 'utf8').replace('- [ ] 1.1', '- [x] 1.1'), 'utf8');",
    "  } else {",
    `    const files = ${JSON.stringify(simulatedBetaFiles)};`,
    "    for (const [relative, content] of Object.entries(files)) {",
    "      const target = path.join('openspec', 'changes', changeId, relative);",
    "      fs.mkdirSync(path.dirname(target), { recursive: true });",
    "      fs.writeFileSync(target, content, 'utf8');",
    "    }",
    "    fs.mkdirSync('src', { recursive: true });",
    "    fs.writeFileSync(path.join('src', 'beta.txt'), 'beta\\n', 'utf8');",
    "  }",
    "  calls.push({ command: 'deterministic-executor', index: calls.length + 1, kind: 'simulation', operation, sessionIds: [], sliceId, status: 0, stderrFile: null, stdoutFile: null });",
    "  save();",
    "  process.exit(0);",
    "}",
    "if (operation === 'propose' && !fs.existsSync(path.join('openspec', 'changes', changeId))) {",
    "  const request = `${changeId} Create a minimal Ordinary Small disposable change that writes src/beta.txt with exact text beta plus one newline. Use capability synthetic-beta, validate with node tools/validate.mjs, make no external or remote change, and keep every artifact and task concise.`;",
    "  const proposed = invoke('opsx-propose', [request]);",
    "  if (proposed.status !== 0) process.exit(proposed.status ?? 1);",
    "  const rootSession = proposed.sessionIds[0];",
    "  if (rootSession == null) { console.error('Propose command returned no session identity.'); process.exit(1); }",
    "  const applied = invoke('opsx-apply', [changeId], rootSession);",
    "  process.exit(applied.status ?? 1);",
    "}",
    "const applied = invoke('opsx-apply', [changeId]);",
    "process.exit(applied.status ?? 1);",
    "",
  ].join("\n");
}

function createProject(project: string, globalSource: string, model: string, variant: string): void {
  fs.mkdirSync(project, { recursive: true });
  writeNew(path.join(project, "AGENTS.md"), [
    "# Disposable Mission Instructions",
    "",
    "## Runtime Authority",
    "",
    "This project is an effect-contained synthetic proof. Follow the selected canonical OpenSpec command exactly.",
    "Only edit repository-contained `src/`, `openspec/`, `docs/`, and `evidence/` files required by the selected change.",
    "Use `node tools/validate.mjs` as the only project validation command. Do not use network, remote, credential, install, commit, release, deployment, task, or question capabilities.",
    "The alpha and beta changes are Ordinary Small. Runtime proof is the real validator invocation in this disposable project.",
    "",
  ].join("\n"));
  writeNew(path.join(project, "docs", "roadmap.md"), "# Disposable Configured-Provider Roadmap\n");
  writeNew(path.join(project, "mission.json"), mission());
  writeNew(path.join(project, "controller-adapter.json"), json({
    executorArgv: ["node", "tools/provider-executor.mjs", "{operation}", "{changeId}", "{sliceId}"],
    maxAttemptsPerSlice: 3,
    maxWallClockMsPerSlice: 1_800_000,
    schemaVersion: 1,
  }));
  writeNew(path.join(project, "opencode-dev-kit", "adapter.json"), json({
    schemaVersion: 1,
    validation: {
      build: "node tools/validate.mjs",
      focusedTest: "node tools/validate.mjs",
      lint: "node tools/validate.mjs",
      test: "node tools/validate.mjs",
      typecheck: "node tools/validate.mjs",
    },
  }));
  writeNew(path.join(project, "openspec", "config.yaml"), [
    "schema: spec-driven",
    "",
    "context: |",
    "  This is an Ordinary Small disposable marker project. Keep artifacts concise, use exact local validation, and perform no external effect.",
    "",
  ].join("\n"));
  writeNew(path.join(project, "tools", "validate.mjs"), [
    "import fs from 'node:fs';",
    "import path from 'node:path';",
    "const exact = (file, content) => fs.existsSync(file) && fs.readFileSync(file, 'utf8') === content;",
    "if (!exact(path.join('src', 'alpha.txt'), 'alpha\\n')) process.exit(1);",
    "const changes = path.join('openspec', 'changes');",
    "const names = fs.existsSync(changes) ? fs.readdirSync(changes, { recursive: true }).map(String) : [];",
    "if (names.some((name) => name.includes('change-b')) && !exact(path.join('src', 'beta.txt'), 'beta\\n')) process.exit(1);",
    "if (names.some((name) => name.includes('change-c')) || fs.existsSync(path.join('src', 'gamma.txt'))) process.exit(1);",
    "process.exit(0);",
    "",
  ].join("\n"));
  writeNew(path.join(project, "tools", "provider-executor.mjs"), executorSource(globalSource, model, variant));
  createInitialChange(project);
}

function environment(globalSource: string, fixture: string): NodeJS.ProcessEnv {
  return {
    ...process.env,
    OPENCODE_CONFIG_DIR: globalSource,
    OPENCODE_PURE: "1",
    XDG_CACHE_HOME: path.join(fixture, "xdg-cache"),
    XDG_STATE_HOME: path.join(fixture, "xdg-state"),
  };
}

function controller(
  project: string,
  globalSource: string,
  environmentValue: NodeJS.ProcessEnv,
  operation: "resume" | "run",
  checkpointIdentity?: string,
): ProcessFact {
  return run(project, [
    process.execPath,
    path.join(globalSource, "bin", "roadmap-mission.ts"),
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
  ], environmentValue, `controller-${operation}`, 2_000_000);
}

function report(processFact: ProcessFact): Record<string, unknown> {
  try {
    return JSON.parse(processFact.stdout) as Record<string, unknown>;
  } catch {
    throw new Error(`${processFact.name} returned invalid JSON (exit ${String(processFact.exitCode)}): ${processFact.stderr || processFact.stdout}`);
  }
}

function commitCheckpoint(project: string, environmentValue: NodeJS.ProcessEnv, label: string, paths: string[]): string {
  git(project, ["add", "-A", "--", ...paths], environmentValue);
  git(project, ["commit", "-m", `external checkpoint ${label}`], environmentValue);
  return git(project, ["rev-parse", "HEAD"], environmentValue);
}

function transitionFacts(project: string): Array<Record<string, unknown>> {
  const directory = path.join(project, ".opencode-dev-kit", "runtime", "roadmap-missions", "configured-provider-proof", "transitions");
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory).sort().map((file) => JSON.parse(fs.readFileSync(path.join(directory, file), "utf8")) as Record<string, unknown>);
}

function providerCalls(project: string): ProviderCall[] {
  const file = path.join(project, "evidence", "mission", "provider-calls.json");
  return fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, "utf8")) as ProviderCall[] : [];
}

function preserveLogs(project: string, evidenceRoot: string, calls: ProviderCall[], fixture: string): void {
  const output = path.join(evidenceRoot, "provider");
  fs.mkdirSync(output, { recursive: true });
  for (const call of calls) {
    for (const key of ["stdoutFile", "stderrFile"] as const) {
      const relative = call[key];
      if (relative == null) continue;
      const source = path.join(project, relative);
      if (!fs.existsSync(source)) continue;
      writeNew(path.join(output, path.basename(relative)), redact(fs.readFileSync(source, "utf8"), fixture));
    }
  }
}

function deleteSessions(project: string, environmentValue: NodeJS.ProcessEnv, calls: ProviderCall[]): Array<{ sessionId: string; status: number | null }> {
  const ids = [...new Set(calls.flatMap((call) => call.sessionIds))];
  return ids.map((sessionId) => {
    const result = run(project, ["opencode", "session", "delete", sessionId, "--pure"], environmentValue, "session-delete");
    return { sessionId, status: result.exitCode };
  });
}

function sourceHashes(): Record<string, string> {
  return Object.fromEntries([
    "global/bin/openspec-archive.ts",
    "global/bin/openspec-operation-gate.ts",
    "global/bin/portable-process.ts",
    "global/bin/roadmap-mission.ts",
    "global/bin/roadmap-mission/contracts.ts",
    "global/bin/roadmap-mission/controller.ts",
    "global/bin/roadmap-mission/preflight.ts",
    "global/bin/roadmap-mission/state.ts",
    "global/commands/opsx-apply.md",
    "global/commands/opsx-propose.md",
    "global/skills/openspec-apply-change/SKILL.md",
    "global/skills/openspec-propose/SKILL.md",
    runnerRelative,
  ].map((relative) => [relative, sha256(fs.readFileSync(path.join(sourceRoot, relative)))]));
}

function credentialCount(text: string): number | null {
  const match = text.match(/(\d+)\s+credentials?/i);
  return match == null ? null : Number.parseInt(match[1], 10);
}

function preflight(options: Options): void {
  if (fs.existsSync(options.evidenceRoot)) throw new Error("Evidence root already exists");
  fs.mkdirSync(options.evidenceRoot, { recursive: false });
  const fixture = fs.mkdtempSync(path.join(os.tmpdir(), "roadmap-provider-preflight-"));
  let cleanup = "pending";
  let failure: string | null = null;
  const loaded = loadModelProfile(sourceRoot, options.profile);
  const route = loaded.profile.agent.build;
  const facts: Record<string, unknown> = {
    candidateId: options.candidateId,
    cleanup,
    credentialCount: null,
    failure,
    modelCalls: 0,
    route: `${route.model}/${route.variant}`,
    sourceHashes: sourceHashes(),
    status: "blocked",
  };
  try {
    const project = path.join(fixture, "project");
    const globalSource = path.join(fixture, "global-source");
    installGlobalSource(globalSource, route.model, route.variant);
    createProject(project, globalSource, route.model, route.variant);
    const env = environment(globalSource, fixture);
    git(project, ["init"], env);
    git(project, ["add", "--", "."], env);
    git(project, ["commit", "-m", "configured provider proof fixture"], env);
    const auth = run(project, ["opencode", "auth", "list", "--pure"], env, "credential-inventory");
    const credentials = credentialCount(auth.stdout);
    if (auth.exitCode !== 0 || credentials == null || credentials < 1) throw new Error("Configured provider credential inventory is unavailable");
    const missionPreflight = run(project, [
      process.execPath,
      path.join(globalSource, "bin", "roadmap-mission.ts"),
      "preflight",
      "--root",
      project,
      "--global-source",
      globalSource,
      "--mission",
      "mission.json",
    ], env, "mission-preflight");
    const parsed = report(missionPreflight);
    if (missionPreflight.exitCode !== 0 || parsed.status !== "eligible") throw new Error(`Mission preflight blocked: ${missionPreflight.stderr || missionPreflight.stdout}`);
    facts.credentialCount = credentials;
    facts.mission = redactValue(parsed, fixture);
    facts.status = "complete";
  } catch (error) {
    failure = safeError(error);
    facts.failure = failure;
    throw error;
  } finally {
    try {
      fs.rmSync(fixture, { recursive: true, force: true });
      cleanup = "complete";
    } catch (error) {
      cleanup = `failed: ${safeError(error)}`;
      if (failure == null) throw error;
    } finally {
      facts.cleanup = cleanup;
      writeJson(path.join(options.evidenceRoot, "preflight.json"), facts);
    }
  }
  console.log(json({ candidateId: options.candidateId, cleanup, mode: "preflight", modelCalls: 0, status: "complete" }).trimEnd());
}

function evaluate(options: Options, print = true): Record<string, unknown> {
  const rawPath = path.join(options.evidenceRoot, "raw.json");
  if (!fs.existsSync(rawPath)) throw new Error("raw.json is missing");
  const raw = JSON.parse(fs.readFileSync(rawPath, "utf8")) as Record<string, unknown>;
  const calls = raw.providerCalls as ProviderCall[] | undefined;
  const controllerRuns = raw.controllerRuns as Array<Record<string, unknown>> | undefined;
  const transitions = raw.transitions as Array<Record<string, unknown>> | undefined;
  const archives = raw.archives as string[] | undefined;
  const checkpoints = raw.checkpoints as string[] | undefined;
  const sessionCleanup = raw.sessionCleanup as Array<{ status: number | null }> | undefined;
  const marker = raw.markers as Record<string, unknown> | undefined;
  const configuredCalls = calls?.filter((call) => call.kind === "configured-provider") ?? [];
  const simulationCalls = calls?.filter((call) => call.kind === "simulation") ?? [];
  const localFailures = calls?.filter((call) => call.kind === "local-failure") ?? [];
  const executionMode = (raw.environment as Record<string, unknown> | undefined)?.executionMode;
  const executionComplete = executionMode === "simulation"
    ? simulationCalls.length === 2 && simulationCalls.every((call) => call.status === 0)
    : configuredCalls.length >= 3 && configuredCalls.every((call) => call.status === 0 && call.sessionIds.length >= 1);
  const cleanupComplete = executionMode === "simulation"
    ? sessionCleanup?.length === 0
    : sessionCleanup?.length != null && sessionCleanup.length >= 2 && sessionCleanup.every((item) => item.status === 0);
  const archiveCount = transitions?.filter((transition) => transition.kind === "archive").length ?? 0;
  const complete =
    raw.failure == null &&
    raw.cleanup === "complete" &&
    localFailures.length === 1 &&
    executionComplete &&
    controllerRuns?.length === 3 &&
    controllerRuns[0]?.status === "paused" && controllerRuns[0]?.cursor === 0 &&
    controllerRuns[1]?.status === "paused" && controllerRuns[1]?.cursor === 1 &&
    controllerRuns[2]?.status === "blocked" && controllerRuns[2]?.cursor === 2 &&
    archiveCount === 2 &&
    archives?.length === 2 &&
    checkpoints?.length === 2 &&
    marker?.alpha === "alpha\n" && marker?.beta === "beta\n" && marker?.changeCExists === false &&
    cleanupComplete;
  const result = {
    archiveCount,
    candidateId: options.candidateId,
    cleanup: raw.cleanup,
    configuredProviderCalls: configuredCalls.length,
    controllerProcesses: controllerRuns?.length ?? 0,
    localRecoverableFailures: localFailures.length,
    processRestart: controllerRuns?.length === 3 ? "run-then-two-resume-processes" : "not-proven",
    protectedSlice: controllerRuns?.[2]?.cursor === 2 && controllerRuns[2]?.status === "blocked" ? "blocked-before-executor" : "not-proven",
    schemaVersion: 1,
    sessionCleanup: cleanupComplete ? "complete" : "blocked",
    simulationCalls: simulationCalls.length,
    status: complete ? "complete" : "blocked",
  };
  writeJson(path.join(options.evidenceRoot, "evaluation.json"), result);
  if (!complete) throw new Error(`Configured-provider evidence evaluation blocked: ${json(result).trim()}`);
  if (print) console.log(json(result).trimEnd());
  return result;
}

function capture(options: Options): void {
  if (fs.existsSync(options.evidenceRoot)) throw new Error("Evidence root already exists");
  fs.mkdirSync(options.evidenceRoot, { recursive: false });
  const fixture = fs.mkdtempSync(path.join(os.tmpdir(), "roadmap-provider-capture-"));
  const loaded = loadModelProfile(sourceRoot, options.profile);
  const route = loaded.profile.agent.build;
  const simulation = options.mode === "simulate";
  const project = path.join(fixture, "project");
  const globalSource = path.join(fixture, "global-source");
  const controllerProcesses: ProcessFact[] = [];
  const checkpoints: string[] = [];
  let calls: ProviderCall[] = [];
  let cleanup = "pending";
  let failure: string | null = null;
  let sessionCleanup: Array<{ sessionId: string; status: number | null }> = [];
  const raw: Record<string, unknown> = {
    archives: [],
    candidateId: options.candidateId,
    checkpoints,
    cleanup,
    controllerRuns: [],
    environment: { executionMode: simulation ? "simulation" : "configured-provider", model: route.model, node: process.version, platform: process.platform, profile: options.profile, variant: route.variant },
    failure,
    markers: {},
    providerCalls: calls,
    schemaVersion: 1,
    sessionCleanup,
    sourceHashes: sourceHashes(),
    transitions: [],
  };
  writeJson(path.join(options.evidenceRoot, "raw.json"), raw);
  try {
    installGlobalSource(globalSource, route.model, route.variant);
    createProject(project, globalSource, route.model, route.variant);
    const env = {
      ...environment(globalSource, fixture),
      ...(simulation ? { ROADMAP_PROVIDER_SIMULATE: "1" } : {}),
    };
    git(project, ["init"], env);
    git(project, ["add", "--", "."], env);
    git(project, ["commit", "-m", "configured provider proof fixture"], env);

    const first = controller(project, globalSource, env, "run");
    controllerProcesses.push(first);
    const firstReport = report(first);
    if (first.exitCode !== 1 || firstReport.status !== "paused" || firstReport.cursor !== 0) {
      throw new Error(`First controller process did not reach the alpha checkpoint: ${first.stderr || first.stdout}`);
    }
    checkpoints.push(commitCheckpoint(project, env, "slice-a", ["evidence/mission", "openspec/changes", "openspec/specs", "src/alpha.txt"]));

    const second = controller(project, globalSource, env, "resume", checkpoints[0]);
    controllerProcesses.push(second);
    const secondReport = report(second);
    if (second.exitCode !== 1 || secondReport.status !== "paused" || secondReport.cursor !== 1) {
      throw new Error(`Second controller process did not reach the beta checkpoint: ${second.stderr || second.stdout}`);
    }
    checkpoints.push(commitCheckpoint(project, env, "slice-b", ["evidence/mission", "openspec/changes", "openspec/specs", "src/beta.txt"]));

    const third = controller(project, globalSource, env, "resume", checkpoints[1]);
    controllerProcesses.push(third);
    const thirdReport = report(third);
    if (third.exitCode !== 1 || thirdReport.status !== "blocked" || thirdReport.cursor !== 2) {
      throw new Error(`Third controller process did not stop before the protected slice: ${third.stderr || third.stdout}`);
    }

    calls = providerCalls(project);
    preserveLogs(project, options.evidenceRoot, calls, fixture);
    const archivesRoot = path.join(project, "openspec", "changes", "archive");
    const archives = fs.existsSync(archivesRoot) ? fs.readdirSync(archivesRoot).sort() : [];
    const transitions = transitionFacts(project);
    const replay = run(project, [
      process.execPath,
      path.join(globalSource, "bin", "roadmap-mission.ts"),
      "state-replay",
      "--root",
      project,
      "--mission",
      "mission.json",
    ], env, "state-replay");
    if (replay.exitCode !== 0 || report(replay).status !== "valid") throw new Error(`Final state replay failed: ${replay.stderr || replay.stdout}`);
    raw.archives = archives;
    raw.checkpoints = checkpoints;
    raw.controllerRuns = controllerProcesses.map((processFact) => {
      const parsed = report(processFact);
      return { attempts: parsed.attempts, cursor: parsed.cursor, operation: parsed.operation, status: parsed.status };
    });
    raw.markers = {
      alpha: fs.readFileSync(path.join(project, "src", "alpha.txt"), "utf8"),
      beta: fs.readFileSync(path.join(project, "src", "beta.txt"), "utf8"),
      changeCExists: fs.existsSync(path.join(project, "openspec", "changes", "change-c")),
    };
    raw.providerCalls = calls;
    raw.replay = JSON.parse(replay.stdout);
    raw.transitions = transitions.map((transition) => ({
      cursor: transition.cursor,
      kind: transition.kind,
      recovery: transition.recovery,
      sequence: transition.sequence,
      sliceId: transition.sliceId,
    }));
  } catch (error) {
    failure = safeError(error);
    raw.failure = redact(failure, fixture);
    calls = providerCalls(project);
    raw.providerCalls = calls;
    try {
      preserveLogs(project, options.evidenceRoot, calls, fixture);
    } catch (preserveError) {
      raw.preserveFailure = redact(safeError(preserveError), fixture);
    }
  } finally {
    const env = {
      ...environment(globalSource, fixture),
      ...(simulation ? { ROADMAP_PROVIDER_SIMULATE: "1" } : {}),
    };
    try {
      sessionCleanup = deleteSessions(project, env, calls);
    } catch (error) {
      raw.sessionCleanupFailure = redact(safeError(error), fixture);
    }
    raw.sessionCleanup = sessionCleanup;
    for (const [index, processFact] of controllerProcesses.entries()) {
      writeNew(path.join(options.evidenceRoot, "controller", `${String(index + 1).padStart(2, "0")}.stdout.json`), redact(processFact.stdout, fixture));
      writeNew(path.join(options.evidenceRoot, "controller", `${String(index + 1).padStart(2, "0")}.stderr.log`), redact(processFact.stderr, fixture));
    }
    try {
      fs.rmSync(fixture, { recursive: true, force: true });
      cleanup = "complete";
    } catch (error) {
      cleanup = `failed: ${safeError(error)}`;
    }
    raw.cleanup = cleanup;
    writeJson(path.join(options.evidenceRoot, "raw.json"), redactValue(raw, fixture));
  }
  if (failure != null) {
    try {
      evaluate(options, false);
    } catch {
      // The preserved blocked evaluation is the terminal offline replay input.
    }
    throw new Error(`Configured-provider capture failed; preserved bundle: ${failure}`);
  }
  evaluate(options);
}

const options = parseArgs(process.argv.slice(2));
try {
  if (options.mode === "preflight") preflight(options);
  else if (options.mode === "capture" || options.mode === "simulate") capture(options);
  else evaluate(options);
} catch (error) {
  console.error(json({ error: safeError(error), mode: options.mode, status: "blocked" }).trimEnd());
  process.exitCode = 1;
}
