#!/usr/bin/env node
import { spawn } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadMissionDefinition, stableJson } from "../../global/bin/roadmap-mission/contracts.ts";
import { acquireWriterLease } from "../../global/bin/roadmap-mission/state.ts";
import { runPortableCommand } from "../../global/bin/portable-process.ts";

type Options = {
  candidateId: string;
  evidenceRoot: string;
};

type CommandEvidence = {
  argv: string[];
  exitCode: number | null;
  name: string;
  stderr: string;
  stdout: string;
};

const sourceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const productionEntrypoint = path.join(sourceRoot, "global", "bin", "roadmap-mission.ts");
const internalLeaseMode = "--internal-hold-lease";

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
    } else {
      throw new Error(`Unknown option: ${arg}`);
    }
  }
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]{0,99}$/.test(candidateId)) throw new Error("--candidate-id must be a safe identifier");
  if (!path.isAbsolute(evidenceRoot)) throw new Error("--evidence-root must be absolute");
  return { candidateId, evidenceRoot: path.resolve(evidenceRoot) };
}

function mission(): string {
  return json({
    allowedEffects: ["local-read", "local-write"],
    authorizationRefs: {},
    checkpoint: { localCommitAuthorized: false, mode: "evidence-only", workspace: "disposable" },
    evidencePath: "evidence/mission",
    missionId: "restart-proof",
    roadmapPath: "docs/roadmap.md",
    schemaVersion: 1,
    slices: [
      {
        changeId: "change-a",
        dependsOn: [],
        effectClasses: ["local-read", "local-write"],
        id: "slice-a",
        operation: "continue",
        outcome: "Complete the first bounded disposable change.",
        ownedPaths: ["src/a.txt", "openspec/changes/change-a"],
      },
      {
        changeId: "change-b",
        dependsOn: ["slice-a"],
        effectClasses: ["local-read", "local-write"],
        id: "slice-b",
        operation: "propose",
        outcome: "Activate the second bounded disposable change.",
        ownedPaths: ["src/b.txt", "openspec/changes/change-b"],
      },
    ],
    stopPolicy: { onExternalBlocked: true, onOwnerRequired: true, onUnknown: true },
    validationArgv: ["git", "status", "--short"],
    workflowOwner: { mode: "global-canonical" },
  });
}

function createProject(root: string): void {
  fs.mkdirSync(path.join(root, "docs"), { recursive: true });
  writeNew(path.join(root, "docs", "roadmap.md"), "# Disposable Restart Roadmap\n");
  writeNew(path.join(root, "mission.json"), mission());
}

function event(
  root: string,
  name: string,
  input: {
    activeOperation?: { kind: string; processRef: string | null; sessionRef: string | null } | null;
    checkpointIdentity?: string | null;
    createdAt: string;
    cursor: number;
    disposition: string;
    kind: string;
    sliceId: string;
  },
): string {
  const relative = `events/${name}.json`;
  writeNew(path.join(root, relative), json({
    activeOperation: input.activeOperation ?? null,
    checkpoint: { identity: input.checkpointIdentity ?? null, mode: "evidence-only" },
    createdAt: input.createdAt,
    cursor: input.cursor,
    disposition: input.disposition,
    evidenceRefs: [`evidence/${name}.json`],
    identities: {
      kit: "candidate-fixture",
      node: process.version,
      openCode: "not-used-provider-free",
      openSpec: "not-used-provider-free",
      repository: "disposable-repository",
    },
    kind: input.kind,
    recovery: { attempts: 0, sliceStartedAt: null },
    schemaVersion: 1,
    sliceId: input.sliceId,
  }));
  return relative;
}

function invoke(root: string, name: string, operation: string, eventPath?: string): CommandEvidence {
  const argv = [
    process.execPath,
    productionEntrypoint,
    operation,
    "--root",
    root,
    "--mission",
    "mission.json",
    ...(eventPath == null ? [] : ["--event", eventPath]),
  ];
  const result = runPortableCommand(root, argv, { capture: true });
  if (result.error != null) throw result.error;
  return {
    argv: [
      "node",
      "<production-entrypoint>",
      operation,
      "--root",
      "<fixture>",
      "--mission",
      "mission.json",
      ...(eventPath == null ? [] : ["--event", eventPath]),
    ],
    exitCode: result.status,
    name,
    stderr: result.stderr.slice(0, 5_000),
    stdout: result.stdout.slice(0, 20_000),
  };
}

function parsed(command: CommandEvidence): Record<string, unknown> {
  const output = command.stdout || command.stderr;
  return JSON.parse(output) as Record<string, unknown>;
}

async function waitFor(predicate: () => boolean, timeoutMs: number, message: string): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (predicate()) return;
    await new Promise((resolve) => setTimeout(resolve, 25));
  }
  throw new Error(message);
}

async function staleLease(root: string): Promise<{ exitCode: number | null; lockSha256: string }> {
  const child = spawn(process.execPath, [fileURLToPath(import.meta.url), internalLeaseMode, root, "mission.json"], {
    cwd: root,
    stdio: ["ignore", "ignore", "pipe"],
    shell: false,
  });
  const lock = path.join(root, ".opencode-dev-kit", "runtime", "roadmap-missions", "restart-proof", "writer.lock");
  try {
    await waitFor(() => fs.existsSync(lock), 5_000, "Proof-owned writer lease was not created");
    const lockSha256 = digest(fs.readFileSync(lock));
    if (!child.kill()) throw new Error("Proof-owned lease process did not accept termination");
    await waitFor(() => child.exitCode != null || child.signalCode != null, 5_000, "Proof-owned lease process did not terminate");
    return { exitCode: child.exitCode, lockSha256 };
  } finally {
    if (child.exitCode == null && child.signalCode == null) child.kill();
  }
}

function transitionKinds(root: string): string[] {
  const directory = path.join(root, ".opencode-dev-kit", "runtime", "roadmap-missions", "restart-proof", "transitions");
  return fs.readdirSync(directory).sort().map((file) => {
    const transition = JSON.parse(fs.readFileSync(path.join(directory, file), "utf8")) as { kind: string };
    return transition.kind;
  });
}

function assertSucceeded(command: CommandEvidence): void {
  if (command.exitCode !== 0) throw new Error(`${command.name} failed: ${command.stderr || command.stdout}`);
}

async function run(options: Options): Promise<void> {
  if (fs.existsSync(options.evidenceRoot)) throw new Error("Evidence root already exists");
  const fixture = fs.mkdtempSync(path.join(os.tmpdir(), "roadmap-mission-state-proof-"));
  let cleanupError: string | null = null;
  try {
    const restart = path.join(fixture, "restart");
    createProject(restart);
    const preflight = invoke(restart, "preflight", "state-record", event(restart, "preflight", {
      createdAt: "2026-08-13T13:30:00.000Z",
      cursor: 0,
      disposition: "ready",
      kind: "preflight",
      sliceId: "slice-a",
    }));
    const archiveEvent = event(restart, "archive", {
      createdAt: "2026-08-13T13:30:01.000Z",
      cursor: 0,
      disposition: "awaiting-checkpoint",
      kind: "archive",
      sliceId: "slice-a",
    });
    const archive = invoke(restart, "archive", "state-record", archiveEvent);
    const duplicateArchive = invoke(restart, "duplicate-archive", "state-record", archiveEvent);
    assertSucceeded(preflight);
    assertSucceeded(archive);
    if (duplicateArchive.exitCode === 0 || !duplicateArchive.stderr.includes("already has an archive")) {
      throw new Error(`Duplicate archive did not fail closed: ${duplicateArchive.stdout || duplicateArchive.stderr}`);
    }

    const lease = await staleLease(restart);
    const reconcile = invoke(restart, "restart-reconciliation", "state-reconcile", event(restart, "reconcile", {
      createdAt: "2026-08-13T13:30:02.000Z",
      cursor: 0,
      disposition: "awaiting-checkpoint",
      kind: "restart-reconciliation",
      sliceId: "slice-a",
    }));
    const checkpoint = invoke(restart, "checkpoint", "state-record", event(restart, "checkpoint", {
      checkpointIdentity: "evidence-checkpoint-a",
      createdAt: "2026-08-13T13:30:03.000Z",
      cursor: 0,
      disposition: "ready",
      kind: "checkpoint",
      sliceId: "slice-a",
    }));
    const successor = invoke(restart, "successor", "state-record", event(restart, "successor", {
      checkpointIdentity: "evidence-checkpoint-a",
      createdAt: "2026-08-13T13:30:04.000Z",
      cursor: 1,
      disposition: "ready",
      kind: "successor-activation",
      sliceId: "slice-b",
    }));
    const replay = invoke(restart, "replay", "state-replay");
    for (const command of [reconcile, checkpoint, successor, replay]) assertSucceeded(command);
    const kinds = transitionKinds(restart);
    if (kinds.join(",") !== "preflight,archive,restart-reconciliation,checkpoint,successor-activation") {
      throw new Error(`Restart chain differed: ${kinds.join(",")}`);
    }
    const replayReport = parsed(replay);
    if (replayReport.status !== "valid" || replayReport.sequence !== 5 || replayReport.writerStatus !== "clear") {
      throw new Error(`Restart replay differed: ${replay.stdout}`);
    }
    const leaseArchive = path.join(restart, ".opencode-dev-kit", "runtime", "roadmap-missions", "restart-proof", "leases");
    const staleLeases = fs.readdirSync(leaseArchive);
    if (staleLeases.length !== 1) throw new Error("Stale proof-owned lease was not quarantined exactly once");

    const missing = path.join(fixture, "missing-transition");
    createProject(missing);
    assertSucceeded(invoke(missing, "missing-preflight", "state-record", event(missing, "preflight", {
      createdAt: "2026-08-13T13:31:00.000Z",
      cursor: 0,
      disposition: "ready",
      kind: "preflight",
      sliceId: "slice-a",
    })));
    assertSucceeded(invoke(missing, "missing-archive", "state-record", event(missing, "archive", {
      createdAt: "2026-08-13T13:31:01.000Z",
      cursor: 0,
      disposition: "awaiting-checkpoint",
      kind: "archive",
      sliceId: "slice-a",
    })));
    const missingTransitions = path.join(missing, ".opencode-dev-kit", "runtime", "roadmap-missions", "restart-proof", "transitions");
    fs.rmSync(path.join(missingTransitions, fs.readdirSync(missingTransitions).sort()[0]));
    const missingReplay = invoke(missing, "missing-transition-replay", "state-replay");
    if (missingReplay.exitCode === 0 || !missingReplay.stderr.includes("not contiguous")) {
      throw new Error(`Missing transition did not fail closed: ${missingReplay.stdout || missingReplay.stderr}`);
    }

    const unknown = path.join(fixture, "unknown-writer");
    createProject(unknown);
    assertSucceeded(invoke(unknown, "unknown-preflight", "state-record", event(unknown, "preflight", {
      createdAt: "2026-08-13T13:32:00.000Z",
      cursor: 0,
      disposition: "ready",
      kind: "preflight",
      sliceId: "slice-a",
    })));
    assertSucceeded(invoke(unknown, "unknown-session", "state-record", event(unknown, "session", {
      activeOperation: { kind: "session", processRef: "proof-process", sessionRef: "proof-session" },
      createdAt: "2026-08-13T13:32:01.000Z",
      cursor: 0,
      disposition: "running",
      kind: "session-launch",
      sliceId: "slice-a",
    })));
    const unknownReplay = invoke(unknown, "unknown-writer-replay", "state-replay");
    if (unknownReplay.exitCode === 0 || parsed(unknownReplay).writerStatus !== "unknown") {
      throw new Error(`Unknown writer did not fail closed: ${unknownReplay.stdout || unknownReplay.stderr}`);
    }

    fs.mkdirSync(options.evidenceRoot, { recursive: false });
    writeNew(path.join(options.evidenceRoot, "raw.json"), json({
      candidateId: options.candidateId,
      commands: [preflight, archive, duplicateArchive, reconcile, checkpoint, successor, replay, missingReplay, unknownReplay].map((command) => ({
        argv: command.argv,
        exitCode: command.exitCode,
        name: command.name,
        status: parsed(command).status,
      })),
      environment: { node: process.version, platform: process.platform },
      restart: {
        kinds,
        leaseProcessExitCode: lease.exitCode,
        leaseSha256: lease.lockSha256,
        replay: replayReport,
        staleLeaseArchiveCount: staleLeases.length,
      },
      schemaVersion: 1,
      sources: [
        "global/bin/roadmap-mission.ts",
        "global/bin/roadmap-mission/contracts.ts",
        "global/bin/roadmap-mission/preflight.ts",
        "global/bin/roadmap-mission/state.ts",
      ].map((relative) => ({ path: relative, sha256: digest(fs.readFileSync(path.join(sourceRoot, relative))) })),
    }));
    writeNew(path.join(options.evidenceRoot, "evaluation.json"), json({
      archiveCount: kinds.filter((kind) => kind === "archive").length,
      candidateId: options.candidateId,
      cleanup: "pending",
      duplicateArchive: "blocked",
      missingTransition: "blocked",
      restartReconciliation: "complete",
      schemaVersion: 1,
      status: "complete",
      unknownWriter: "blocked",
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

async function main(): Promise<void> {
  if (process.argv[2] === internalLeaseMode) {
    const root = path.resolve(requiredValue(process.argv, 2, internalLeaseMode));
    const missionPath = requiredValue(process.argv, 3, internalLeaseMode);
    acquireWriterLease(root, loadMissionDefinition(root, missionPath), "2026-08-13T13:30:02.000Z");
    await new Promise<void>(() => {
      setInterval(() => undefined, 60_000);
    });
    return;
  }
  await run(parseArgs(process.argv.slice(2)));
}

try {
  await main();
} catch (error) {
  console.error(json({ error: error instanceof Error ? error.message : String(error), status: "blocked" }).trimEnd());
  process.exitCode = 1;
}
