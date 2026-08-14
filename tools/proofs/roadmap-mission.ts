#!/usr/bin/env node
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { runPortableCommand } from "../../global/bin/portable-process.ts";
import { MISSION_SOURCE_PATHS } from "../../global/bin/roadmap-mission/preflight.ts";

type Options = {
  candidateId: string;
  evidenceRoot: string;
  mode: "preflight";
};

type CommandEvidence = {
  argv: string[];
  exitCode: number | null;
  name: string;
  stderr: string;
  stdout: string;
};

type ScenarioEvidence = CommandEvidence & {
  afterDigest: string;
  beforeDigest: string;
  fileCount: number;
  mutation: { added: string[]; changed: string[]; removed: string[] };
};

const sourceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const productionEntrypoint = path.join(sourceRoot, "global", "bin", "roadmap-mission.ts");
const productionSourcePaths = [
  "global/bin/openspec-operation-gate.ts",
  ...MISSION_SOURCE_PATHS.map((relative) => `global/${relative}`),
] as const;

function stableValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stableValue);
  if (value == null || typeof value !== "object") return value;
  const input = value as Record<string, unknown>;
  return Object.fromEntries(Object.keys(input).sort().map((key) => [key, stableValue(input[key])]));
}

function stableJson(value: unknown): string {
  return `${JSON.stringify(stableValue(value), null, 2)}\n`;
}

function digestBytes(value: string | Buffer): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function requiredValue(args: string[], index: number, option: string): string {
  const value = args[index + 1];
  if (value == null || value.trim() === "" || value.startsWith("--")) {
    throw new Error(`Missing value for ${option}`);
  }
  return value;
}

function parseArgs(args: string[]): Options {
  let mode = "";
  let evidenceRoot = "";
  let candidateId = "";
  for (let index = 0; index < args.length; index++) {
    const arg = args[index];
    if (arg === "--mode") {
      mode = requiredValue(args, index, arg);
      index++;
    } else if (arg === "--evidence-root") {
      evidenceRoot = requiredValue(args, index, arg);
      index++;
    } else if (arg === "--candidate-id") {
      candidateId = requiredValue(args, index, arg);
      index++;
    } else {
      throw new Error(`Unknown option: ${arg}`);
    }
  }
  if (mode !== "preflight") throw new Error("--mode must be preflight");
  if (!path.isAbsolute(evidenceRoot)) throw new Error("--evidence-root must be absolute");
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]{0,99}$/.test(candidateId)) throw new Error("--candidate-id must be a safe identifier");
  return { candidateId, evidenceRoot: path.resolve(evidenceRoot), mode };
}

function writeNew(file: string, content: string): void {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content, { encoding: "utf8", flag: "wx" });
}

type FixtureKind = "ambiguous" | "dirty" | "invalid" | "invalid-checkpoint" | "missing-adapter" | "overlay" | "protected" | "valid";

function fixtureManifest(kind: FixtureKind): Record<string, unknown> {
  const protectedEffect = kind === "protected";
  return {
    schemaVersion: 1,
    missionId: kind === "invalid" ? "invalid-forward-dependency" : `generic-${kind}`,
    roadmapPath: "docs/roadmap.md",
    evidencePath: "evidence/mission",
    validationArgv: ["node", "tools/validate.mjs"],
    workflowOwner: { mode: "global-canonical" },
    checkpoint: {
      mode: "evidence-only",
      workspace: kind === "invalid-checkpoint" ? "persistent" : "disposable",
      localCommitAuthorized: false,
    },
    allowedEffects: protectedEffect ? ["hardware", "local-read", "local-write"] : ["local-read", "local-write"],
    authorizationRefs: protectedEffect ? { hardware: "owner-reference-fixture" } : {},
    stopPolicy: {
      onExternalBlocked: true,
      onOwnerRequired: true,
      onUnknown: true,
    },
    slices: [
      {
        id: "slice-a",
        changeId: "change-a",
        operation: "continue",
        dependsOn: kind === "invalid" ? ["slice-b"] : [],
        outcome: "Complete the first bounded local change.",
        effectClasses: protectedEffect ? ["hardware", "local-read"] : ["local-read", "local-write"],
        ownedPaths: ["src/a.ts", "openspec/changes/change-a"],
      },
      {
        id: "slice-b",
        changeId: "change-b",
        operation: "propose",
        dependsOn: ["slice-a"],
        outcome: "Create and complete the dependent bounded local change.",
        effectClasses: ["local-read", "local-write"],
        ownedPaths: ["src/b.ts", "openspec/changes/change-b"],
      },
    ],
  };
}

function copyFile(source: string, destination: string): void {
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.copyFileSync(source, destination);
}

function installGlobalSource(globalSource: string): void {
  for (const relative of productionSourcePaths) {
    copyFile(path.join(sourceRoot, relative), path.join(globalSource, relative.slice("global/".length)));
  }
  for (const name of ["openspec-archive.ts", "portable-process.ts"]) {
    copyFile(path.join(sourceRoot, "global", "bin", name), path.join(globalSource, "bin", name));
  }
  copyFile(path.join(sourceRoot, "global", "AGENTS.md"), path.join(globalSource, "AGENTS.md"));
  copyFile(
    path.join(sourceRoot, "global", "skills", "change-ready-sdlc", "SKILL.md"),
    path.join(globalSource, "skills", "change-ready-sdlc", "SKILL.md"),
  );
  for (const name of ["openspec-apply-change", "openspec-archive-change", "openspec-propose"]) {
    copyFile(
      path.join(sourceRoot, "global", "skills", name, "SKILL.md"),
      path.join(globalSource, "skills", name, "SKILL.md"),
    );
  }
  for (const name of ["opsx-apply", "opsx-archive", "opsx-propose"]) {
    copyFile(
      path.join(sourceRoot, "global", "commands", `${name}.md`),
      path.join(globalSource, "commands", `${name}.md`),
    );
  }
  writeNew(path.join(globalSource, "opencode.json"), stableJson({
    $schema: "https://opencode.ai/config.json",
    permission: "ask",
  }));
  writeNew(path.join(globalSource, "package.json"), stableJson({ private: true, type: "module" }));
}

function installFakeOpenSpec(bin: string): void {
  const script = path.join(bin, "fake-openspec.mjs");
  writeNew(script, [
    "import fs from 'node:fs';",
    "const args = process.argv.slice(2);",
    "if (args[0] === '--version') { console.log('1.6.0'); process.exit(0); }",
    "if (args[0] === 'list' && args.includes('--json')) {",
    "  const state = JSON.parse(fs.readFileSync('.fixture-openspec-state.json', 'utf8'));",
    "  console.log(JSON.stringify({ changes: state.changes }));",
    "  process.exit(0);",
    "}",
    "if (args[0] === 'status' && args.includes('--json')) { console.log(JSON.stringify({ changeName: 'change-a', isComplete: true, artifacts: [{ id: 'tasks', status: 'done' }] })); process.exit(0); }",
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

function git(root: string, args: string[]): void {
  const result = runPortableCommand(root, ["git", ...args], {
    capture: true,
    env: {
      ...process.env,
      GIT_AUTHOR_NAME: "Roadmap Mission Proof",
      GIT_AUTHOR_EMAIL: "roadmap-mission@example.invalid",
      GIT_COMMITTER_NAME: "Roadmap Mission Proof",
      GIT_COMMITTER_EMAIL: "roadmap-mission@example.invalid",
    },
  });
  if (result.error != null || result.status !== 0) {
    throw new Error(`git ${args.join(" ")} failed: ${result.stderr || result.stdout || result.error?.message}`);
  }
}

function createProject(root: string, kind: FixtureKind): void {
  fs.mkdirSync(root, { recursive: true });
  writeNew(path.join(root, "AGENTS.md"), "# Project Instructions\n\n## Runtime Authority\n\nGlobal lifecycle authority is required.\n");
  writeNew(path.join(root, "docs", "roadmap.md"), "# Generic Roadmap\n");
  writeNew(path.join(root, "tools", "validate.mjs"), "process.exit(0);\n");
  if (kind !== "missing-adapter") {
    writeNew(path.join(root, "opencode-dev-kit", "adapter.json"), stableJson({
      schemaVersion: 1,
      validation: {
        build: "node tools/validate.mjs",
        focusedTest: "node tools/validate.mjs",
        lint: "node tools/validate.mjs",
        test: "node tools/validate.mjs",
        typecheck: "node tools/validate.mjs",
      },
    }));
  }
  writeNew(path.join(root, "mission.json"), stableJson(fixtureManifest(kind)));
  writeNew(path.join(root, ".fixture-openspec-state.json"), stableJson({
    changes: kind === "ambiguous"
      ? [{ name: "change-a" }, { name: "other-change" }]
      : [{ name: "change-a" }],
  }));
  if (kind === "overlay") {
    writeNew(
      path.join(root, ".opencode", "skills", "openspec-apply-change", "SKILL.md"),
      "---\nname: openspec-apply-change\ndescription: Stale fixture overlay.\n---\n\n# Stale Overlay\n",
    );
  }
  git(root, ["init"]);
  git(root, ["add", "--", "."]);
  git(root, ["commit", "-m", "fixture"]);
  if (kind === "dirty") {
    writeNew(path.join(root, "src", "a.ts"), "export const dirty = true;\n");
  }
}

function fileManifest(root: string): Array<{ path: string; sha256: string }> {
  const rows: Array<{ path: string; sha256: string }> = [];
  const visit = (directory: string): void => {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true }).sort((left, right) => left.name.localeCompare(right.name))) {
      const absolute = path.join(directory, entry.name);
      if (entry.isDirectory()) visit(absolute);
      else if (entry.isFile()) rows.push({
        path: path.relative(root, absolute).replaceAll("\\", "/"),
        sha256: digestBytes(fs.readFileSync(absolute)),
      });
    }
  };
  visit(root);
  return rows;
}

function manifestDifference(
  before: Array<{ path: string; sha256: string }>,
  after: Array<{ path: string; sha256: string }>,
): { added: string[]; changed: string[]; removed: string[] } {
  const beforeMap = new Map(before.map((entry) => [entry.path, entry.sha256]));
  const afterMap = new Map(after.map((entry) => [entry.path, entry.sha256]));
  return {
    added: [...afterMap.keys()].filter((file) => !beforeMap.has(file)).sort(),
    changed: [...afterMap.keys()].filter((file) => beforeMap.has(file) && beforeMap.get(file) !== afterMap.get(file)).sort(),
    removed: [...beforeMap.keys()].filter((file) => !afterMap.has(file)).sort(),
  };
}

function invoke(fixture: string, globalSource: string, bin: string, name: string, mission: string): ScenarioEvidence {
  const argv = [
    process.execPath,
    productionEntrypoint,
    "preflight",
    "--root",
    fixture,
    "--global-source",
    globalSource,
    "--mission",
    mission,
  ];
  const before = fileManifest(fixture);
  const result = runPortableCommand(fixture, argv, {
    capture: true,
    env: {
      ...process.env,
      OPENCODE_CONFIG_DIR: globalSource,
      PATH: `${bin}${path.delimiter}${process.env.PATH ?? ""}`,
    },
  });
  if (result.error != null) throw result.error;
  const after = fileManifest(fixture);
  const mutation = manifestDifference(before, after);
  return {
    afterDigest: digestBytes(stableJson(after)),
    argv: [
      "node",
      "<production-entrypoint>",
      "preflight",
      "--root",
      "<fixture>",
      "--global-source",
      "<global-source>",
      "--mission",
      mission,
    ],
    beforeDigest: digestBytes(stableJson(before)),
    exitCode: result.status,
    fileCount: after.length,
    mutation,
    name,
    stderr: result.stderr,
    stdout: result.stdout,
  };
}

function scenarioCheck(scenario: ScenarioEvidence, id: string, status: string): boolean {
  if (scenario.stdout === "") return false;
  const report = JSON.parse(scenario.stdout) as { checks?: Array<{ id?: string; status?: string }> };
  return report.checks?.some((check) => check.id === id && check.status === status) ?? false;
}

function assertEvidence(scenarios: Record<FixtureKind, ScenarioEvidence>): void {
  const { valid, invalid, overlay } = scenarios;
  if (valid.exitCode !== 0) throw new Error(`Valid preflight failed: ${valid.stderr || valid.stdout}`);
  const parsed = JSON.parse(valid.stdout) as Record<string, unknown>;
  const eligible = parsed.eligibleSlice as Record<string, unknown> | null;
  if (parsed.status !== "eligible" || eligible?.id !== "slice-a") {
    throw new Error(`Valid preflight returned unexpected result: ${valid.stdout}`);
  }
  if (invalid.exitCode === 0) throw new Error("Invalid forward dependency unexpectedly passed");
  const blocked = JSON.parse(invalid.stderr) as Record<string, unknown>;
  if (blocked.status !== "blocked" || !String(blocked.error).includes("must appear earlier")) {
    throw new Error(`Invalid preflight returned unexpected diagnostic: ${invalid.stderr}`);
  }
  if (overlay.exitCode === 0) throw new Error("Project workflow overlay unexpectedly passed");
  if (!scenarioCheck(overlay, "workflow:project-overlays", "blocked")) {
    throw new Error(`Overlay preflight returned unexpected diagnostic: ${overlay.stdout || overlay.stderr}`);
  }
  const expected: Array<[FixtureKind, string, string]> = [
    ["ambiguous", "project:openspec-state", "blocked"],
    ["dirty", "project:git-state", "blocked"],
    ["missing-adapter", "project:validation-adapter", "blocked"],
    ["overlay", "workflow:project-overlays", "blocked"],
    ["protected", "mission:next-effects", "blocked"],
  ];
  for (const [kind, id, status] of expected) {
    if (scenarios[kind].exitCode === 0 || !scenarioCheck(scenarios[kind], id, status)) {
      throw new Error(`${kind} preflight did not produce ${id}=${status}: ${scenarios[kind].stdout || scenarios[kind].stderr}`);
    }
  }
  if (scenarios["invalid-checkpoint"].exitCode === 0 || !scenarios["invalid-checkpoint"].stderr.includes("multi-slice evidence-only")) {
    throw new Error(`Invalid checkpoint unexpectedly passed: ${scenarios["invalid-checkpoint"].stderr}`);
  }
  for (const scenario of Object.values(scenarios)) {
    if (scenario.beforeDigest !== scenario.afterDigest) {
      throw new Error(`Production preflight mutated scenario ${scenario.name}: ${JSON.stringify(scenario.mutation)}`);
    }
  }
}

function boundedScenarioEvidence(scenario: ScenarioEvidence): Record<string, unknown> {
  let report: Record<string, unknown> = {};
  const output = scenario.stdout !== "" ? scenario.stdout : scenario.stderr;
  try {
    report = JSON.parse(output) as Record<string, unknown>;
  } catch {
    report = { parseError: true };
  }
  const checks = Array.isArray(report.checks)
    ? report.checks
      .filter((check): check is Record<string, unknown> => check != null && typeof check === "object" && !Array.isArray(check))
      .map((check) => ({ id: check.id, status: check.status }))
    : [];
  return {
    afterDigest: scenario.afterDigest,
    argv: scenario.argv,
    beforeDigest: scenario.beforeDigest,
    checks,
    error: typeof report.error === "string" ? report.error.slice(0, 1_000) : null,
    exitCode: scenario.exitCode,
    fileCount: scenario.fileCount,
    mutation: scenario.mutation,
    name: scenario.name,
    status: report.status ?? "unknown",
  };
}

function run(options: Options): void {
  if (fs.existsSync(options.evidenceRoot)) throw new Error("Evidence root already exists");
  const fixture = fs.mkdtempSync(path.join(os.tmpdir(), "roadmap-mission-proof-"));
  let cleanupError: string | null = null;
  try {
    const globalSource = path.join(fixture, "global-source");
    const bin = path.join(fixture, "bin");
    installGlobalSource(globalSource);
    installFakeOpenSpec(bin);
    const kinds: FixtureKind[] = [
      "ambiguous",
      "dirty",
      "invalid",
      "invalid-checkpoint",
      "missing-adapter",
      "overlay",
      "protected",
      "valid",
    ];
    const scenarios = Object.fromEntries(kinds.map((kind) => {
      const project = path.join(fixture, `${kind}-project`);
      createProject(project, kind);
      return [kind, invoke(project, globalSource, bin, kind, "mission.json")];
    })) as Record<FixtureKind, ScenarioEvidence>;
    assertEvidence(scenarios);

    fs.mkdirSync(options.evidenceRoot, { recursive: false });
    writeNew(path.join(options.evidenceRoot, "raw.json"), stableJson({
      candidateId: options.candidateId,
      environment: {
        node: process.version,
        platform: process.platform,
      },
      productionSources: productionSourcePaths.map((relative) => ({
        path: relative,
        sha256: digestBytes(fs.readFileSync(path.join(sourceRoot, relative))),
      })),
      scenarios: kinds.map((kind) => boundedScenarioEvidence(scenarios[kind])),
      schemaVersion: 1,
    }));
    writeNew(path.join(options.evidenceRoot, "evaluation.json"), stableJson({
      candidateId: options.candidateId,
      cleanup: "pending",
      projectMutationCount: 0,
      schemaVersion: 1,
      scenarios: {
        ambiguousActiveChange: "blocked",
        dirtyOwnedPath: "blocked",
        invalidForwardDependency: "blocked",
        invalidCheckpoint: "blocked",
        missingAdapter: "blocked",
        protectedEffect: "blocked",
        staleProjectOverlay: "blocked",
        valid: "eligible",
      },
      status: "complete",
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
  fs.writeFileSync(evaluationPath, stableJson(evaluation), "utf8");
  console.log(stableJson({
    candidateId: options.candidateId,
    evidenceRoot: "<evidence-root>",
    mode: options.mode,
    status: "complete",
  }).trimEnd());
}

try {
  run(parseArgs(process.argv.slice(2)));
} catch (error) {
  console.error(stableJson({
    error: error instanceof Error ? error.message : String(error),
    mode: "preflight",
    status: "blocked",
  }).trimEnd());
  process.exitCode = 1;
}
