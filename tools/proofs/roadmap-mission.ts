#!/usr/bin/env node
import crypto from "node:crypto";
import fs from "node:fs";
import { createServer } from "node:net";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { runPortableCommand } from "../../global/bin/portable-process.ts";
import {
  missionDefinitionDigest,
  parseMissionDefinition,
  parseMissionExecutorResult,
} from "../../global/bin/roadmap-mission/contracts.ts";
import { missionParentWaveDigest } from "../../global/bin/roadmap-mission/parent-correlation.ts";
import { MISSION_SOURCE_PATHS } from "../../global/bin/roadmap-mission/preflight.ts";
import { executeMissionSession, inspectRuntime, runtimeUrl } from "../../global/bin/roadmap-mission/session-executor.ts";

type Options = {
  candidateId: string;
  evidenceRoot: string;
  help: boolean;
  inputRoot: string | null;
  mode: "preflight" | "replay";
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
  "global/bin/openspec-change/automation-dividend.ts",
  "global/bin/openspec-change/claims.ts",
  "global/bin/openspec-change/gate.ts",
  "global/bin/openspec-change/inventory.ts",
  "global/bin/openspec-change/manifest.ts",
  "global/bin/openspec-change/ownership.ts",
  "global/bin/openspec-change/state.ts",
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

function usage(): string {
  return [
    "Usage:",
    "  node tools/proofs/roadmap-mission.ts --mode preflight --candidate-id <id> --evidence-root <absolute-new-path>",
    "  node tools/proofs/roadmap-mission.ts --mode replay --candidate-id <id> --input-root <capture-path> --evidence-root <absolute-new-path>",
  ].join("\n");
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
  if (args.length === 1 && (args[0] === "--help" || args[0] === "-h")) {
    return { candidateId: "help", evidenceRoot: sourceRoot, help: true, inputRoot: null, mode: "preflight" };
  }
  let mode = "";
  let evidenceRoot = "";
  let candidateId = "";
  let inputRoot: string | null = null;
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
    } else if (arg === "--input-root") {
      inputRoot = path.resolve(requiredValue(args, index, arg));
      index++;
    } else {
      throw new Error(`Unknown option: ${arg}`);
    }
  }
  if (mode !== "preflight" && mode !== "replay") throw new Error("--mode must be preflight or replay");
  if (!path.isAbsolute(evidenceRoot)) throw new Error("--evidence-root must be absolute");
  if (mode === "replay" && inputRoot == null) throw new Error("--input-root is required for replay");
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]{0,99}$/.test(candidateId)) throw new Error("--candidate-id must be a safe identifier");
  return { candidateId, evidenceRoot: path.resolve(evidenceRoot), help: false, inputRoot, mode };
}

function writeNew(file: string, content: string): void {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content, { encoding: "utf8", flag: "wx" });
}

type ParentFixtureKind = "parent-digest" | "parent-effect" | "parent-order" | "parent-outcome" | "parent-path" | "parent-ref" | "parent-valid";
type FixtureKind = "ambiguous" | "dirty" | "invalid" | "invalid-checkpoint" | "live-lease" | "missing-active" | "missing-adapter" | "overlay" | ParentFixtureKind | "protected" | "queued" | "queued-dirty" | "roadmap-prose" | "too-many" | "unlisted-active" | "unreadable-lease" | "valid";

function isParentFixture(kind: FixtureKind): kind is ParentFixtureKind {
  return kind.startsWith("parent-");
}

function parentFixture(kind: ParentFixtureKind): { manifest: Record<string, unknown>; wave: Record<string, unknown> } {
  const wave = {
    campaignId: "campaign-proof",
    candidateDigest: "b".repeat(64),
    definitionDigest: "a".repeat(64),
    id: "wave-proof",
    missionDefinitionDigest: "0".repeat(64),
    recordType: "wave-manifest",
    schemaVersion: 1,
    slices: [
      {
        changeId: "change-a",
        dependsOn: [],
        effectClasses: ["local-read", "local-write"],
        expectedProof: "Prove the first bounded change.",
        id: "slice-a",
        outcome: "Complete the first bounded local change.",
        ownedPaths: ["openspec/changes/change-a", "src/a.ts"],
        validationArgv: ["node", "tools/validate.mjs"],
        workItemIds: ["item-a"],
      },
      {
        changeId: "change-b",
        dependsOn: [],
        effectClasses: ["local-read", "local-write"],
        expectedProof: "Prove the second bounded change.",
        id: "slice-b",
        outcome: "Create and complete the dependent bounded local change.",
        ownedPaths: ["openspec/changes/change-b", "src/b.ts"],
        validationArgv: ["node", "tools/validate.mjs"],
        workItemIds: ["item-b"],
      },
    ],
    status: "frozen",
    workItemIds: ["item-a", "item-b"],
  };
  const manifest: Record<string, unknown> = {
    allowedEffects: ["local-read", "local-write"],
    authorizationRefs: {},
    checkpoint: { localCommitAuthorized: false, mode: "evidence-only", workspace: "disposable" },
    evidencePath: "evidence/mission",
    missionId: `generic-${kind}`,
    parent: {
      campaignDefinitionDigest: wave.definitionDigest,
      campaignId: wave.campaignId,
      campaignTransitionDigest: "d".repeat(64),
      parentEvidencePath: "evidence/campaign/wave.json",
      schemaVersion: 1,
      waveDigest: missionParentWaveDigest(wave),
      waveId: wave.id,
      workItemRefs: [...wave.workItemIds],
    },
    roadmapPath: "docs/roadmap.md",
    schemaVersion: 1,
    slices: wave.slices.map((slice) => ({
      changeId: slice.changeId,
      dependsOn: [...slice.dependsOn],
      effectClasses: [...slice.effectClasses],
      id: slice.id,
      operation: "propose",
      outcome: slice.outcome,
      ownedPaths: [...slice.ownedPaths],
      workItemRefs: [...slice.workItemIds],
    })),
    stopPolicy: { onExternalBlocked: true, onOwnerRequired: true, onUnknown: true },
    validationArgv: ["node", "tools/validate.mjs"],
    workflowOwner: { mode: "global-canonical" },
  };
  const parent = manifest.parent as Record<string, unknown>;
  const slices = manifest.slices as Array<Record<string, unknown>>;
  if (kind === "parent-ref") {
    slices[0].workItemRefs = ["item-z"];
    parent.workItemRefs = ["item-z", "item-b"];
  } else if (kind === "parent-order") {
    manifest.slices = [slices[1], slices[0]];
    parent.workItemRefs = ["item-b", "item-a"];
  } else if (kind === "parent-path") {
    slices[0].ownedPaths = ["openspec/changes/change-a", "src/other.ts"];
  } else if (kind === "parent-outcome") {
    slices[0].outcome = "Complete a different bounded local change.";
  } else if (kind === "parent-effect") {
    slices[0].effectClasses = ["local-read"];
  } else if (kind === "parent-digest") {
    parent.waveDigest = "e".repeat(64);
  }
  wave.missionDefinitionDigest = missionDefinitionDigest(parseMissionDefinition(manifest));
  return { manifest, wave };
}

function fixtureManifest(kind: FixtureKind): Record<string, unknown> {
  if (isParentFixture(kind)) return parentFixture(kind).manifest;
  const protectedEffect = kind === "protected";
  const queued = kind === "queued" || kind === "queued-dirty" || kind === "missing-active";
  const slices = kind === "too-many"
    ? Array.from({ length: 101 }, (_, index) => ({
        id: `slice-${index}`,
        changeId: `change-${index}`,
        operation: "continue",
        dependsOn: index === 0 ? [] : [`slice-${index - 1}`],
        outcome: `Complete bounded local change ${index}.`,
        effectClasses: ["local-read", "local-write"],
        ownedPaths: [`src/${index}.ts`, `openspec/changes/change-${index}`],
      }))
    : [
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
          operation: queued ? "continue" : "propose",
          dependsOn: ["slice-a"],
          outcome: "Create and complete the dependent bounded local change.",
          effectClasses: ["local-read", "local-write"],
          ownedPaths: ["src/b.ts", "openspec/changes/change-b"],
        },
      ];
  return {
    schemaVersion: 1,
    missionId: kind === "invalid"
      ? "invalid-forward-dependency"
      : kind === "roadmap-prose"
        ? "generic-valid"
        : `generic-${kind}`,
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
    slices,
  };
}

function executorContractEvidence(): Record<string, unknown> {
  const definition = parseMissionDefinition(fixtureManifest("valid"));
  const expected = {
    attempt: 1,
    definitionDigest: missionDefinitionDigest(definition),
    missionId: definition.missionId,
    slice: definition.slices[0],
  };
  const valid = {
    attempt: 1,
    changeId: "change-a",
    cleanup: "complete",
    definitionDigest: expected.definitionDigest,
    disposition: "completed",
    errorClass: "none",
    errorMessage: null,
    evidenceRefs: ["evidence/executor/apply.json"],
    guardState: "passed",
    missionId: definition.missionId,
    phases: [{ command: "opsx-apply", evidenceRef: "evidence/executor/apply.json", status: "completed" }],
    questionDisposition: "none",
    rootSessionRef: "session-proof-a",
    runtimeRef: digestBytes("runtime-proof"),
    schemaVersion: 1,
    sliceId: "slice-a",
    tool: "roadmap-mission-session-executor",
    writerClosure: "terminal",
  };
  const parsed = parseMissionExecutorResult(valid, expected);
  const failures: Record<string, string> = {};
  for (const [name, value] of [
    ["malformed", { ...valid, schemaVersion: 2 }],
    ["correlation", { ...valid, missionId: "other-mission" }],
  ] as const) {
    try {
      parseMissionExecutorResult(value, expected);
      throw new Error(`${name} executor result unexpectedly passed`);
    } catch (error) {
      failures[name] = error instanceof Error ? error.message : String(error);
    }
  }
  for (const [name, value] of [
    ["missing", ""],
    ["nonLoopback", "https://example.invalid"],
    ["credentialed", "http://proof@127.0.0.1:4096"],
  ] as const) {
    try {
      runtimeUrl(value);
      throw new Error(`${name} executor runtime URL unexpectedly passed`);
    } catch (error) {
      failures[`runtime-${name}`] = error instanceof Error ? error.message : String(error);
    }
  }
  if (
    !failures["runtime-missing"].includes("invalid")
    || !failures["runtime-nonLoopback"].includes("uncredentialed loopback origin")
    || !failures["runtime-credentialed"].includes("uncredentialed loopback origin")
  ) {
    throw new Error(`Unsafe runtime URL checks did not fail closed: ${stableJson(failures)}`);
  }
  return {
    correlationFailure: failures.correlation,
    malformedFailure: failures.malformed,
    parsedDisposition: parsed.disposition,
    parsedRuntimeRef: parsed.runtimeRef,
    runtimeUrl: {
      credentialed: failures["runtime-credentialed"],
      loopbackOrigin: runtimeUrl("http://127.0.0.1:4096").origin,
      missing: failures["runtime-missing"],
      nonLoopback: failures["runtime-nonLoopback"],
    },
  };
}

async function runtimeOwnershipEvidence(): Promise<Record<string, unknown>> {
  const root = sourceRoot;
  const base = {
    command: { list: async () => ({ data: [{ name: "opsx-apply" }, { name: "opsx-propose" }] }) },
    path: { get: async () => ({ data: { directory: root } }) },
  };
  const execute = async (input: {
    commands?: string[];
    details?: Record<string, Record<string, unknown>>;
    detailError?: boolean;
    directory?: string;
    questions?: Array<Record<string, unknown>>;
    sessions?: Array<Record<string, unknown>>;
    statuses?: Record<string, Record<string, unknown>>;
  }): Promise<string> => {
    const client = {
      ...base,
      command: { list: async () => ({ data: (input.commands ?? ["opsx-apply", "opsx-propose"]).map((name) => ({ name })) }) },
      path: { get: async () => ({ data: { directory: input.directory ?? root } }) },
      question: { list: async () => ({ data: input.questions ?? [] }) },
      session: {
        get: async ({ sessionID }: { sessionID: string }) => input.detailError
          ? { error: { name: "UnreadableSessionFixture" } }
          : { data: input.details?.[sessionID] ?? { id: sessionID } },
        status: async () => ({ data: input.statuses ?? {} }),
      },
      v2: { session: { list: async () => ({ data: input.sessions ?? [] }) } },
    };
    try {
      await inspectRuntime(client as unknown as Parameters<typeof inspectRuntime>[0], root, ["change-a"], null);
      return "clear";
    } catch (error) {
      return error instanceof Error ? error.message : String(error);
    }
  };
  const busy = await execute({
    details: { "session-busy": { id: "session-busy", metadata: {} } },
    sessions: [{ id: "session-busy" }],
    statuses: { "session-busy": { type: "busy" } },
  });
  const pendingQuestion = await execute({ questions: [{ id: "question-pending", sessionID: "session-question" }] });
  const unreadable = await execute({ detailError: true, sessions: [{ id: "session-unreadable" }] });
  const directoryMismatch = await execute({ directory: path.dirname(root) });
  const missingCapability = await execute({ commands: ["opsx-apply"] });
  if (
    !busy.includes("activeSessions=1")
    || !pendingQuestion.includes("pendingQuestions=1")
    || !unreadable.includes("root session detail failed")
    || !directoryMismatch.includes("directory")
    || !missingCapability.includes("missing canonical command")
  ) {
    throw new Error(`Runtime ownership preflight did not fail closed: ${stableJson({ busy, directoryMismatch, missingCapability, pendingQuestion, unreadable })}`);
  }
  return { busy, directoryMismatch, missingCapability, pendingQuestion, unreadable };
}

async function staleRuntimeEvidence(root: string): Promise<Record<string, unknown>> {
  const server = createServer();
  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  const address = server.address();
  if (address == null || typeof address === "string") throw new Error("Stale runtime probe did not acquire a loopback port");
  await new Promise<void>((resolve, reject) => server.close((error) => error == null ? resolve() : reject(error)));
  const resultPath = "evidence/mission/stale-runtime-result.json";
  const result = await executeMissionSession({
    attempt: 1,
    missionPath: "mission.json",
    parentSessionRef: null,
    resultPath,
    root,
    serverUrl: `http://127.0.0.1:${address.port}`,
    sliceId: "slice-a",
    timeoutMs: 1_000,
  });
  if (
    result.disposition !== "transient"
    || result.errorClass !== "transient"
    || result.rootSessionRef !== null
    || result.writerClosure !== "terminal"
    || result.cleanup !== "not-required"
    || !fs.existsSync(path.join(root, resultPath))
  ) {
    throw new Error(`Unavailable runtime URL did not remain retryable before session creation: ${stableJson(result)}`);
  }
  return {
    cleanup: result.cleanup,
    disposition: result.disposition,
    errorClass: result.errorClass,
    resultPath,
    rootSessionRef: result.rootSessionRef,
    writerClosure: result.writerClosure,
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
  copyFile(path.join(sourceRoot, "global", "principles-of-work.md"), path.join(globalSource, "principles-of-work.md"));
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
    instructions: [path.join(globalSource, "principles-of-work.md").replaceAll("\\", "/")],
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
  writeNew(
    path.join(root, "docs", "roadmap.md"),
    kind === "roadmap-prose"
      ? "# Generic Roadmap\n\n- [ ] Unaccepted prose-only outcome that must not become executable scope.\n"
      : "# Generic Roadmap\n",
  );
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
  if (isParentFixture(kind)) {
    writeNew(path.join(root, "evidence", "campaign", "wave.json"), stableJson(parentFixture(kind).wave));
  }
  writeNew(path.join(root, ".fixture-openspec-state.json"), stableJson({
    changes: isParentFixture(kind)
      ? []
      : kind === "ambiguous" || kind === "unlisted-active"
      ? [{ name: "change-a" }, { name: "other-change" }]
      : kind === "queued" || kind === "queued-dirty"
        ? [{ name: "change-a" }, { name: "change-b" }]
        : [{ name: "change-a" }],
  }));
  if (kind === "overlay") {
    writeNew(
      path.join(root, ".opencode", "skills", "openspec-apply-change", "SKILL.md"),
      "---\nname: openspec-apply-change\ndescription: Stale fixture overlay.\n---\n\n# Stale Overlay\n",
    );
  }
  git(root, ["init"]);
  git(root, isParentFixture(kind)
    ? ["add", "--", ".fixture-openspec-state.json", "AGENTS.md", "docs", "opencode-dev-kit", "tools"]
    : ["add", "--", "."]);
  git(root, ["commit", "-m", "fixture"]);
  if (kind === "dirty" || kind === "queued-dirty") {
    writeNew(path.join(root, "src", kind === "dirty" ? "a.ts" : "b.ts"), "export const dirty = true;\n");
  }
  if (kind === "live-lease" || kind === "unreadable-lease") {
    const lock = path.join(root, ".opencode-dev-kit", "runtime", "roadmap-missions", `generic-${kind}`, "writer.lock");
    fs.mkdirSync(path.dirname(lock), { recursive: true });
    if (kind === "live-lease") writeNew(lock, stableJson({ pid: process.pid, proof: "live-owner" }));
    else fs.mkdirSync(lock);
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
  const { valid, invalid, overlay, queued } = scenarios;
  if (valid.exitCode !== 0) throw new Error(`Valid preflight failed: ${valid.stderr || valid.stdout}`);
  const parsed = JSON.parse(valid.stdout) as Record<string, unknown>;
  const eligible = parsed.eligibleSlice as Record<string, unknown> | null;
  if (parsed.status !== "eligible" || eligible?.id !== "slice-a") {
    throw new Error(`Valid preflight returned unexpected result: ${valid.stdout}`);
  }
  const legacyDigest = missionDefinitionDigest(parseMissionDefinition(fixtureManifest("valid")));
  if (
    legacyDigest !== "51b2356dd6014779ffa7344f70b837c69fbaeec9ff6c8f128442ad53b5b46804" ||
    valid.stdout.includes("definition:parent-correlation")
  ) {
    throw new Error(`Legacy mission contract changed: digest=${legacyDigest}`);
  }
  if (queued.exitCode !== 0 || (JSON.parse(queued.stdout) as Record<string, unknown>).status !== "eligible") {
    throw new Error(`Queued active changes were not accepted: ${queued.stdout || queued.stderr}`);
  }
  const roadmapProse = JSON.parse(scenarios["roadmap-prose"].stdout) as Record<string, unknown>;
  const roadmapEligible = roadmapProse.eligibleSlice as Record<string, unknown> | null;
  if (
    scenarios["roadmap-prose"].exitCode !== 0
    || roadmapProse.status !== "eligible"
    || roadmapEligible?.id !== "slice-a"
    || roadmapProse.definitionDigest !== parsed.definitionDigest
  ) {
    throw new Error(`Roadmap prose changed executable mission scope: ${scenarios["roadmap-prose"].stdout || scenarios["roadmap-prose"].stderr}`);
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
    ["live-lease", "mission:writer-lease", "unknown"],
    ["missing-active", "project:openspec-state", "blocked"],
    ["missing-adapter", "project:validation-adapter", "blocked"],
    ["overlay", "workflow:project-overlays", "blocked"],
    ["protected", "mission:next-effects", "blocked"],
    ["queued-dirty", "project:git-state", "blocked"],
    ["unlisted-active", "project:openspec-state", "blocked"],
    ["unreadable-lease", "mission:writer-lease", "unknown"],
  ];
  for (const [kind, id, status] of expected) {
    if (scenarios[kind].exitCode === 0 || !scenarioCheck(scenarios[kind], id, status)) {
      throw new Error(`${kind} preflight did not produce ${id}=${status}: ${scenarios[kind].stdout || scenarios[kind].stderr}`);
    }
  }
  if (scenarios["invalid-checkpoint"].exitCode === 0 || !scenarios["invalid-checkpoint"].stderr.includes("multi-slice evidence-only")) {
    throw new Error(`Invalid checkpoint unexpectedly passed: ${scenarios["invalid-checkpoint"].stderr}`);
  }
  const parentValid = scenarios["parent-valid"];
  if (
    parentValid.exitCode !== 0 ||
    !scenarioCheck(parentValid, "definition:parent-correlation", "passed") ||
    (JSON.parse(parentValid.stdout) as Record<string, unknown>).status !== "eligible"
  ) {
    throw new Error(`Exact parent mission did not pass: ${parentValid.stdout || parentValid.stderr}`);
  }
  for (const kind of ["parent-ref", "parent-order", "parent-path", "parent-outcome", "parent-effect", "parent-digest"] as const) {
    if (scenarios[kind].exitCode === 0 || !scenarioCheck(scenarios[kind], "definition:parent-correlation", "blocked")) {
      throw new Error(`${kind} did not fail parent correlation before execution: ${scenarios[kind].stdout || scenarios[kind].stderr}`);
    }
  }
  if (scenarios["too-many"].exitCode === 0 || !scenarios["too-many"].stderr.includes("between 1 and 100")) {
    throw new Error(`Over-bound mission unexpectedly passed: ${scenarios["too-many"].stderr}`);
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
    definitionDigest: typeof report.definitionDigest === "string" ? report.definitionDigest : null,
    eligibleSlice: typeof (report.eligibleSlice as Record<string, unknown> | undefined)?.id === "string"
      ? {
          changeId: (report.eligibleSlice as Record<string, unknown>).changeId,
          id: (report.eligibleSlice as Record<string, unknown>).id,
          operation: (report.eligibleSlice as Record<string, unknown>).operation,
        }
      : null,
    exitCode: scenario.exitCode,
    fileCount: scenario.fileCount,
    mutation: scenario.mutation,
    name: scenario.name,
    status: report.status ?? "unknown",
  };
}

async function run(options: Options): Promise<void> {
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
      "live-lease",
      "missing-active",
      "missing-adapter",
      "overlay",
      "parent-digest",
      "parent-effect",
      "parent-order",
      "parent-outcome",
      "parent-path",
      "parent-ref",
      "parent-valid",
      "protected",
      "queued",
      "queued-dirty",
      "roadmap-prose",
      "too-many",
      "unlisted-active",
      "unreadable-lease",
      "valid",
    ];
    const scenarios = Object.fromEntries(kinds.map((kind) => {
      const project = path.join(fixture, `${kind}-project`);
      createProject(project, kind);
      return [kind, invoke(project, globalSource, bin, kind, "mission.json")];
    })) as Record<FixtureKind, ScenarioEvidence>;
    assertEvidence(scenarios);
    const staleRuntime = await staleRuntimeEvidence(path.join(fixture, "valid-project"));

    fs.mkdirSync(options.evidenceRoot, { recursive: false });
    writeNew(path.join(options.evidenceRoot, "raw.json"), stableJson({
      candidateId: options.candidateId,
      environment: {
        bun: (globalThis as typeof globalThis & { Bun?: { version?: string } }).Bun?.version ?? null,
        node: process.version,
        platform: process.platform,
        runtimeExecutable: path.basename(process.execPath),
      },
      productionSources: productionSourcePaths.map((relative) => ({
        path: relative,
        sha256: digestBytes(fs.readFileSync(path.join(sourceRoot, relative))),
      })),
      executorContracts: executorContractEvidence(),
      runtimeOwnership: await runtimeOwnershipEvidence(),
      scenarios: kinds.map((kind) => boundedScenarioEvidence(scenarios[kind])),
      schemaVersion: 1,
      staleRuntime,
    }));
    writeNew(path.join(options.evidenceRoot, "evaluation.json"), stableJson({
      candidateId: options.candidateId,
      cleanup: "pending",
      projectMutationCount: 0,
      schemaVersion: 1,
      scenarios: {
        ambiguousActiveChange: "blocked",
        busySession: "unknown-blocked",
        dirtyOwnedPath: "blocked",
        invalidForwardDependency: "blocked",
        invalidCheckpoint: "blocked",
        liveWriterLease: "unknown-blocked",
        missingDeclaredActiveChange: "blocked",
        missingAdapter: "blocked",
        parentDigestMismatch: "blocked",
        parentEffectMismatch: "blocked",
        parentOrderMismatch: "blocked",
        parentOutcomeMismatch: "blocked",
        parentPathMismatch: "blocked",
        parentRefMismatch: "blocked",
        parentValid: "eligible",
        protectedEffect: "blocked",
        pendingQuestion: "unknown-blocked",
        queuedActiveChanges: "eligible",
        queuedDirtyChange: "blocked",
        roadmapProseIgnored: "eligible-definition-owned",
        staleProjectOverlay: "blocked",
        staleRuntimeUrl: "transient-before-session",
        tooManySlices: "blocked",
        unlistedActiveChange: "blocked",
        unreadableWriterLease: "unknown-blocked",
        unreadableSession: "unknown-blocked",
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

function replay(options: Options): void {
  if (options.inputRoot == null) throw new Error("Replay input root is missing");
  if (fs.existsSync(options.evidenceRoot)) throw new Error("Evidence root already exists");
  const raw = JSON.parse(fs.readFileSync(path.join(options.inputRoot, "raw.json"), "utf8")) as Record<string, unknown>;
  const sourceEvaluation = JSON.parse(fs.readFileSync(path.join(options.inputRoot, "evaluation.json"), "utf8")) as Record<string, unknown>;
  const expectedScenarios: Record<string, string> = {
    ambiguous: "blocked",
    dirty: "blocked",
    invalid: "blocked",
    "invalid-checkpoint": "blocked",
    "live-lease": "blocked",
    "missing-active": "blocked",
    "missing-adapter": "blocked",
    overlay: "blocked",
    "parent-digest": "blocked",
    "parent-effect": "blocked",
    "parent-order": "blocked",
    "parent-outcome": "blocked",
    "parent-path": "blocked",
    "parent-ref": "blocked",
    "parent-valid": "eligible",
    protected: "blocked",
    queued: "eligible",
    "queued-dirty": "blocked",
    "roadmap-prose": "eligible",
    "too-many": "blocked",
    "unlisted-active": "blocked",
    "unreadable-lease": "blocked",
    valid: "eligible",
  };
  const observed = new Map(
    (Array.isArray(raw.scenarios) ? raw.scenarios : []).flatMap((value) => {
      const row = value != null && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null;
      return typeof row?.name === "string" && typeof row.status === "string" ? [[row.name, row.status] as const] : [];
    }),
  );
  const staleRuntime = raw.staleRuntime != null && typeof raw.staleRuntime === "object" && !Array.isArray(raw.staleRuntime)
    ? raw.staleRuntime as Record<string, unknown>
    : null;
  const checks = {
    candidateMatched: raw.candidateId === options.candidateId && sourceEvaluation.candidateId === options.candidateId,
    cleanupComplete: sourceEvaluation.cleanup === "complete",
    scenariosMatched: Object.entries(expectedScenarios).every(([name, status]) => observed.get(name) === status),
    sourceEvaluationComplete: sourceEvaluation.status === "complete",
    unavailableRuntimeRetryable: staleRuntime?.disposition === "transient"
      && staleRuntime.errorClass === "transient"
      && staleRuntime.rootSessionRef === null
      && staleRuntime.writerClosure === "terminal",
  };
  const evaluation = {
    candidateId: options.candidateId,
    checks,
    liveCalls: 0,
    replaySource: path.basename(options.inputRoot),
    schemaVersion: 1,
    status: Object.values(checks).every(Boolean) ? "complete" : "blocked",
  };
  fs.mkdirSync(options.evidenceRoot, { recursive: false });
  writeNew(path.join(options.evidenceRoot, "evaluation.json"), stableJson(evaluation));
  console.log(stableJson({
    candidateId: options.candidateId,
    evidenceRoot: "<evidence-root>",
    liveCalls: 0,
    mode: "replay",
    status: evaluation.status,
  }).trimEnd());
  if (evaluation.status !== "complete") process.exitCode = 1;
}

try {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) console.log(usage());
  else if (options.mode === "replay") replay(options);
  else await run(options);
} catch (error) {
  console.error(stableJson({
    error: error instanceof Error ? error.message : String(error),
    mode: "preflight",
    status: "blocked",
  }).trimEnd());
  process.exitCode = 1;
}
