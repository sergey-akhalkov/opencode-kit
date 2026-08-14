#!/usr/bin/env node
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { runPortableCommand } from "../../global/bin/portable-process.ts";

type Options = { candidateId: string; evidenceRoot: string };

const sourceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const productionEntrypoint = path.join(sourceRoot, "global", "bin", "roadmap-mission.ts");

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
  let candidateId = "";
  let evidenceRoot = "";
  for (let index = 0; index < args.length; index++) {
    const arg = args[index];
    if (arg === "--candidate-id") {
      candidateId = requiredValue(args, index, arg);
      index++;
    } else if (arg === "--evidence-root") {
      evidenceRoot = requiredValue(args, index, arg);
      index++;
    } else throw new Error(`Unknown option: ${arg}`);
  }
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]{0,99}$/.test(candidateId)) throw new Error("--candidate-id must be a safe identifier");
  if (!path.isAbsolute(evidenceRoot)) throw new Error("--evidence-root must be absolute");
  return { candidateId, evidenceRoot: path.resolve(evidenceRoot) };
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
    "const [operation, change, slice] = process.argv.slice(2);",
    "const countFile = path.join('evidence', 'mission', 'executor-counts.json');",
    "fs.mkdirSync(path.dirname(countFile), { recursive: true });",
    "const counts = fs.existsSync(countFile) ? JSON.parse(fs.readFileSync(countFile, 'utf8')) : {};",
    "counts[slice] = (counts[slice] ?? 0) + 1;",
    "fs.writeFileSync(countFile, JSON.stringify(counts, null, 2) + '\\n');",
    "const changeRoot = path.join('openspec', 'changes', change);",
    "if (slice === 'slice-a' && counts[slice] === 1) process.exit(0);",
    "if (operation === 'propose') {",
    "  fs.mkdirSync(path.join(changeRoot, 'specs', 'demo'), { recursive: true });",
    `  fs.writeFileSync(path.join(changeRoot, 'proposal.md'), ${JSON.stringify(proposal())});`,
    "  fs.writeFileSync(path.join(changeRoot, 'history.md'), '# Strategy History\\n');",
    "  fs.writeFileSync(path.join(changeRoot, 'specs', 'demo', 'spec.md'), '# Demo\\n');",
    "}",
    "fs.writeFileSync(path.join(changeRoot, 'tasks.md'), '# Tasks\\n\\n- [x] Complete ' + change + '.\\n');",
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
    "bin/portable-process.ts",
    "bin/roadmap-mission.ts",
    "bin/roadmap-mission/contracts.ts",
    "bin/roadmap-mission/controller.ts",
    "bin/roadmap-mission/preflight.ts",
    "bin/roadmap-mission/state.ts",
  ]) {
    const destination = path.join(globalSource, relative);
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.copyFileSync(path.join(sourceRoot, "global", relative), destination);
  }
  fs.copyFileSync(path.join(sourceRoot, "global", "AGENTS.md"), path.join(globalSource, "AGENTS.md"));
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
  writeNew(path.join(globalSource, "opencode.json"), json({ $schema: "https://opencode.ai/config.json", permission: "ask" }));
  writeNew(path.join(globalSource, "package.json"), json({ private: true, type: "module" }));
}

function createProject(root: string): void {
  fs.mkdirSync(root, { recursive: true });
  writeNew(path.join(root, "AGENTS.md"), "# Project Instructions\n\n## Runtime Authority\n");
  writeNew(path.join(root, "docs", "roadmap.md"), "# Disposable Controller Roadmap\n");
  writeNew(path.join(root, "mission.json"), mission());
  writeNew(path.join(root, "controller-adapter.json"), json({
    executorArgv: ["node", "tools/executor.mjs", "{operation}", "{changeId}", "{sliceId}"],
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

function createCheckpointProject(root: string, mode: "external" | "local-commit", missionId: string): void {
  createProject(root);
  fs.writeFileSync(path.join(root, "mission.json"), checkpointMission(mode, missionId), "utf8");
  fs.writeFileSync(path.join(root, "openspec", "changes", "change-a", "tasks.md"), "# Tasks\n\n- [ ] Complete change-a.\n", "utf8");
  git(root, ["add", "--", "."]);
  git(root, ["commit", "-m", `configure ${mode} checkpoint fixture`]);
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

function transitionKinds(root: string): string[] {
  const directory = path.join(root, ".opencode-dev-kit", "runtime", "roadmap-missions", "controller-proof", "transitions");
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
    if (report.status !== "blocked" || report.cursor !== 2) throw new Error(`Controller terminal result differed: ${result.stdout}`);
    const counts = JSON.parse(fs.readFileSync(path.join(project, "evidence", "mission", "executor-counts.json"), "utf8")) as Record<string, number>;
    if (counts["slice-a"] !== 2 || counts["slice-b"] !== 1 || counts["slice-c"] != null) {
      throw new Error(`Executor counts differed: ${json(counts)}`);
    }
    const archives = fs.readFileSync(path.join(project, "evidence", "mission", "archive-calls.txt"), "utf8").trim().split(/\r?\n/);
    if (archives.join(",") !== "change-a,change-b") throw new Error(`Archive calls differed: ${archives.join(",")}`);
    const kinds = transitionKinds(project);
    if (kinds.filter((kind) => kind === "archive").length !== 2 || kinds.at(-1) !== "terminal-stop") {
      throw new Error(`Controller transition chain differed: ${kinds.join(",")}`);
    }
    const replay = runPortableCommand(project, [process.execPath, productionEntrypoint, "state-replay", "--root", project, "--mission", "mission.json"], { capture: true });
    if (replay.status !== 0 || (JSON.parse(replay.stdout) as { status: string }).status !== "valid") {
      throw new Error(`Controller replay failed: ${replay.stderr || replay.stdout}`);
    }

    const retryProject = path.join(fixture, "retry-project");
    createProject(retryProject);
    fs.writeFileSync(path.join(retryProject, "controller-adapter.json"), json({
      executorArgv: ["node", "tools/executor.mjs", "{operation}", "{changeId}", "{sliceId}"],
      maxAttemptsPerSlice: 2,
      maxWallClockMsPerSlice: 60_000,
      schemaVersion: 1,
    }), "utf8");
    fs.writeFileSync(path.join(retryProject, "tools", "executor.mjs"), [
      "import fs from 'node:fs';",
      "import path from 'node:path';",
      "const slice = process.argv.at(-1);",
      "const countFile = path.join('evidence', 'mission', 'executor-counts.json');",
      "fs.mkdirSync(path.dirname(countFile), { recursive: true });",
      "const counts = fs.existsSync(countFile) ? JSON.parse(fs.readFileSync(countFile, 'utf8')) : {};",
      "counts[slice] = (counts[slice] ?? 0) + 1;",
      "fs.writeFileSync(countFile, JSON.stringify(counts, null, 2) + '\\n');",
      "process.exit(7);",
      "",
    ].join("\n"), "utf8");
    git(retryProject, ["add", "--", "."]);
    git(retryProject, ["commit", "-m", "configure bounded retry fixture"]);
    const retryFirst = invokeController(retryProject, globalSource, bin, "run");
    const retryFirstReport = controllerReport(retryFirst, "bounded retry controller") as { attempts: number; status: string };
    if (retryFirst.status !== 1 || retryFirstReport.status !== "paused" || retryFirstReport.attempts !== 2) {
      throw new Error(`Bounded retry controller result differed: ${retryFirst.stderr || retryFirst.stdout}`);
    }
    const retryTransitionsRoot = path.join(retryProject, ".opencode-dev-kit", "runtime", "roadmap-missions", "controller-proof", "transitions");
    const retryTransitionCount = fs.readdirSync(retryTransitionsRoot).length;
    const retryResume = invokeController(retryProject, globalSource, bin, "resume");
    const retryResumeReport = controllerReport(retryResume, "bounded retry resume") as { attempts: number; status: string };
    const retryCounts = JSON.parse(fs.readFileSync(path.join(retryProject, "evidence", "mission", "executor-counts.json"), "utf8")) as Record<string, number>;
    if (
      retryResume.status !== 1 ||
      retryResumeReport.status !== "paused" ||
      retryResumeReport.attempts !== 2 ||
      retryCounts["slice-a"] !== 2 ||
      fs.readdirSync(retryTransitionsRoot).length !== retryTransitionCount
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
    if (localResult.status !== 1 || localReport.status !== "blocked") {
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
    if (externalSecondResume.status !== 1 || externalSecondResumeReport.status !== "blocked" || externalSecondResumeReport.cursor !== 2) {
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
      replay: JSON.parse(replay.stdout),
      persistedRetry: {
        attemptsAfterResume: retryResumeReport.attempts,
        executorCalls: retryCounts["slice-a"],
        transitionsAfterResume: fs.readdirSync(retryTransitionsRoot).length,
        transitionsBeforeResume: retryTransitionCount,
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
        "global/bin/openspec-archive.ts",
        "global/bin/portable-process.ts",
        "global/bin/roadmap-mission.ts",
        "global/bin/roadmap-mission/contracts.ts",
        "global/bin/roadmap-mission/controller.ts",
        "global/bin/roadmap-mission/preflight.ts",
        "global/bin/roadmap-mission/state.ts",
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
      terminalProtectedSlice: "blocked-before-executor",
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

try {
  run(parseArgs(process.argv.slice(2)));
} catch (error) {
  console.error(json({ error: error instanceof Error ? error.message : String(error), status: "blocked" }).trimEnd());
  process.exitCode = 1;
}
