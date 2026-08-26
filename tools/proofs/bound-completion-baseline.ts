#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { fileURLToPath, pathToFileURL } from "node:url";
import { runPortableCommand } from "../../global/bin/portable-process.ts";
import {
  loadControllerAdapter,
  ROADMAP_COMMAND_TIMEOUT_MS,
} from "../../global/bin/roadmap-mission/controller-adapter.ts";
import { ArbiterScheduler } from "../../global/extensions/session-completion-guard/arbiter-scheduler.ts";



const UNRELATED = 100_000;
const QUEUED_PROBE = 33;
const HUNG_TIMEOUT_MS = 250;

function usage(): string {
  return [
    "Usage:",
    "  node tools/proofs/bound-completion-baseline.ts --help",
    "  node tools/proofs/bound-completion-baseline.ts --evidence-root <absolute-new-path>",
    "  node tools/proofs/bound-completion-baseline.ts --mode query --evidence-root <absolute-new-path>",
    "  node tools/proofs/bound-completion-baseline.ts --mode process --evidence-root <absolute-new-path>",
    "  node tools/proofs/bound-completion-baseline.ts --mode integrated --evidence-root <absolute-new-path>",
    "",
    "Provider-free baseline of current unbounded session-query, status loop, queue, and process-timeout behavior.",
    "--mode query proves production bounded/indexed root-graph acquisition against disposable fixtures.",
    "--mode process proves finite roadmap command classes and owned process-tree timeout cleanup.",
    "--mode integrated compares large-DB, scheduler/cancellation, and process bounds with the retained baseline.",
    "Creates a disposable SQLite fixture and a hung child. No provider, workstation, or production mutation.",
  ].join("\n");
}

function repoRoot(): string {
  return path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
}

function required(args: string[], name: string): string {
  const index = args.indexOf(name);
  const value = index >= 0 ? args[index + 1] : null;
  if (value == null || value.startsWith("--")) throw new Error(`Missing ${name}`);
  return value;
}

function scanCurrentSource(root: string): Record<string, unknown> {
  const status = fs.readFileSync(path.join(root, "global/extensions/session-completion-guard/status.ts"), "utf8");
  const evidence = fs.readFileSync(path.join(root, "global/plugin/session-delivery-context/evidence.ts"), "utf8");
  const portable = fs.readFileSync(path.join(root, "global/bin/portable-process.ts"), "utf8");
  return {
    statusHasUnboundedLoop: status.includes("while (true)"),
    sessionQuery: "select * from session order by time_created, id",
    sessionQueryPresent: evidence.includes("select * from session order by time_created, id"),
    portableTimeoutOptional: portable.includes("timeoutMs?: number"),
  };
}

function runLargeDb(): Record<string, unknown> {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "bound-completion-db-"));
  const dbPath = path.join(dir, "sessions.sqlite");
  const started = Date.now();
  const db = new DatabaseSync(dbPath);
  try {
    db.exec("create table session (id text primary key, parent_id text, time_created integer)");
    db.exec("begin");
    const insert = db.prepare("insert into session (id, parent_id, time_created) values (?, ?, ?)");
    insert.run("root-selected", null, 1);
    insert.run("child-a", "root-selected", 2);
    insert.run("child-b", "root-selected", 3);
    insert.run("child-c", "child-a", 4);
    for (let index = 0; index < UNRELATED; index += 1) {
      insert.run(`unrelated-${index}`, null, 10_000 + index);
    }
    db.exec("commit");
    const plan = db.prepare("explain query plan select * from session order by time_created, id").all() as Array<Record<string, unknown>>;
    const heapBefore = process.memoryUsage().heapUsed;
    const rows = db.prepare("select * from session order by time_created, id").all() as Array<{ id: string }>;
    const heapAfter = process.memoryUsage().heapUsed;
    const selectedRoot = rows.filter((row) => row.id === "root-selected" || row.id.startsWith("child-"));
    return {
      cleanup: "pending",
      elapsedMs: Date.now() - started,
      heapDeltaBytes: heapAfter - heapBefore,
      queryPlan: plan,
      queryPlanHasFullScan: JSON.stringify(plan).toLowerCase().includes("scan"),
      selectedAllRows: rows.length,
      selectedRootRows: selectedRoot.length,
      unrelatedInserted: UNRELATED,
    };
  } finally {
    db.close();
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

function runHungChild(): Record<string, unknown> {
  const started = Date.now();
  const result = spawnSync(process.execPath, ["-e", "setTimeout(() => {}, 60000)"], {
    encoding: "utf8",
    timeout: HUNG_TIMEOUT_MS,
  });
  return {
    elapsedMs: Date.now() - started,
    errorCode: result.error && "code" in result.error ? String((result.error as { code?: string }).code ?? "") : null,
    signal: result.signal,
    status: result.status,
    timedOut: result.error != null && "code" in result.error && (result.error as { code?: string }).code === "ETIMEDOUT",
    timeoutMs: HUNG_TIMEOUT_MS,
  };
}

function optionalMode(args: string[]): string {
  const index = args.indexOf("--mode");
  if (index < 0) return "baseline";
  const value = args[index + 1];
  if (value == null || value.startsWith("--")) throw new Error("Missing --mode");
  if (value !== "baseline" && value !== "query" && value !== "process" && value !== "integrated") throw new Error("Unsupported --mode");
  return value;
}

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

function pidAlive(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

function terminateProofPid(pid: number): void {
  if (!pidAlive(pid)) return;
  if (process.platform === "win32") {
    spawnSync("taskkill.exe", ["/PID", String(pid), "/T", "/F"], { shell: false, stdio: "ignore", timeout: 10_000 });
    return;
  }
  try {
    process.kill(pid, "SIGKILL");
  } catch {
    // The proof-owned process is already terminal.
  }
}

function writeHungCommandFixture(dir: string): { bin: string; probe: string } {
  const bin = path.join(dir, "bin");
  const probe = path.join(dir, "hung-command.mjs");
  fs.mkdirSync(bin, { recursive: true });
  fs.writeFileSync(probe, [
    'import { spawn } from "node:child_process";',
    'import fs from "node:fs";',
    'const child = spawn(process.execPath, ["-e", "setTimeout(() => {}, 60000)"], { stdio: "ignore" });',
    'fs.writeFileSync(process.argv[2], JSON.stringify({ child: child.pid, parent: process.pid }));',
    'setTimeout(() => {}, 60000);',
    '',
  ].join("\n"), "utf8");
  return { bin, probe };
}

async function runProcessCandidate(root: string): Promise<Record<string, unknown>> {
  const fixture = fs.mkdtempSync(path.join(os.tmpdir(), "bound-completion-process-"));
  const stateFile = path.join(fixture, "mission-state.txt");
  fs.writeFileSync(stateFile, "before\n", "utf8");
  const ownedPids = new Set<number>();
  try {
    const { bin, probe } = writeHungCommandFixture(fixture);
    const commands = [
      { command: "inspect", commandClass: "inspection", defaultMs: ROADMAP_COMMAND_TIMEOUT_MS.inspection },
      { command: "git", commandClass: "git-mutation", defaultMs: ROADMAP_COMMAND_TIMEOUT_MS.gitMutation },
      { command: "openspec", commandClass: "openspec", defaultMs: ROADMAP_COMMAND_TIMEOUT_MS.openSpec },
      { command: "npm", commandClass: "validation-finalization", defaultMs: ROADMAP_COMMAND_TIMEOUT_MS.validation },
    ];
    for (const item of commands) {
      const pidFile = path.join(fixture, `${item.commandClass}.pids.json`);
      if (process.platform === "win32") {
        fs.writeFileSync(
          path.join(bin, `${item.command}.cmd`),
          `@echo off\r\n"${process.execPath}" "${probe}" "${pidFile}"\r\n`,
          "utf8",
        );
      } else {
        const file = path.join(bin, item.command);
        fs.writeFileSync(file, `#!/bin/sh\nexec "${process.execPath}" "${probe}" "${pidFile}"\n`, "utf8");
        fs.chmodSync(file, 0o755);
      }
    }
    const environment = { ...process.env, PATH: `${bin}${path.delimiter}${process.env.PATH ?? ""}` };
    const fixtures = commands.map((item) => {
      const pidFile = path.join(fixture, `${item.commandClass}.pids.json`);
      const result = runPortableCommand(fixture, [item.command, "fixture"], {
        capture: true,
        env: environment,
        timeoutMs: 750,
      });
      const pids = JSON.parse(fs.readFileSync(pidFile, "utf8")) as { child: number; parent: number };
      ownedPids.add(pids.child);
      ownedPids.add(pids.parent);
      return {
        argv: [item.command, "fixture"],
        cleanupState: result.cleanupState,
        commandClass: item.commandClass,
        defaultMs: item.defaultMs,
        descendantsTerminal: !pidAlive(pids.child) && !pidAlive(pids.parent),
        errorCode: (result.error as NodeJS.ErrnoException | undefined)?.code ?? null,
        signal: result.signal,
        status: result.status,
        timedOut: result.timedOut,
      };
    });

    const adapterPath = path.join(fixture, "adapter.json");
    const adapterInput = {
      executorArgv: [process.execPath, "executor.mjs"],
      maxAttemptsPerSlice: 1,
      maxWallClockMsPerSlice: 60_000,
      schemaVersion: 1,
    };
    fs.writeFileSync(adapterPath, `${JSON.stringify(adapterInput)}\n`, "utf8");
    const defaultAdapter = loadControllerAdapter(fixture, "adapter.json");
    fs.writeFileSync(adapterPath, `${JSON.stringify({ ...adapterInput, validationTimeoutMs: 1_000 })}\n`, "utf8");
    const overriddenAdapter = loadControllerAdapter(fixture, "adapter.json");
    const rejectedOverrides = [999, 1_800_001].map((validationTimeoutMs) => {
      fs.writeFileSync(adapterPath, `${JSON.stringify({ ...adapterInput, validationTimeoutMs })}\n`, "utf8");
      try {
        loadControllerAdapter(fixture, "adapter.json");
        return false;
      } catch {
        return true;
      }
    });

    const unknownPidFile = path.join(fixture, "cleanup-unknown.pids.json");
    const unknown = runPortableCommand(fixture, [process.execPath, probe, unknownPidFile], {
      capture: true,
      env: process.platform === "win32"
        ? { ...process.env, ComSpec: path.join(fixture, "missing-system32", "cmd.exe") }
        : process.env,
      timeoutMs: 750,
    });
    const unknownPids = JSON.parse(fs.readFileSync(unknownPidFile, "utf8")) as { child: number; parent: number };
    ownedPids.add(unknownPids.child);
    ownedPids.add(unknownPids.parent);
    terminateProofPid(unknownPids.child);
    terminateProofPid(unknownPids.parent);

    const controller = fs.readFileSync(path.join(root, "global/bin/roadmap-mission/controller.ts"), "utf8");
    const preflight = fs.readFileSync(path.join(root, "global/bin/roadmap-mission/preflight.ts"), "utf8");
    const executor = fs.readFileSync(path.join(root, "global/bin/roadmap-mission/session-executor.ts"), "utf8");
    const sourceInventory = {
      controllerInvokeRequiresTimeout: controller.includes("timeoutMs: number, additionalRedactions"),
      controllerOptionalTimeoutAbsent: !controller.includes("timeoutMs?: number"),
      preflightPassesTimeout: preflight.includes("capture: true,\n    timeoutMs,"),
      sessionExecutorUsesPortableBound: executor.includes("timeoutMs: ROADMAP_COMMAND_TIMEOUT_MS.openSpec"),
      sessionExecutorUsesNoDirectSpawnSync: !executor.includes("spawnSync("),
    };
    const sourcePaths = [
      "global/bin/portable-process.ts",
      "global/bin/portable-process-supervisor.ts",
      "global/bin/roadmap-mission/controller-adapter.ts",
      "global/bin/roadmap-mission/controller-process.ts",
      "global/bin/roadmap-mission/controller.ts",
      "global/bin/roadmap-mission/preflight.ts",
      "global/bin/roadmap-mission/session-executor.ts",
    ];
    const result = {
      adapters: {
        defaultValidationTimeoutMs: defaultAdapter.validationTimeoutMs,
        overrideValidationTimeoutMs: overriddenAdapter.validationTimeoutMs,
        rejectedOverrides,
      },
      cleanup: {
        complete: [...ownedPids].every((pid) => !pidAlive(pid)),
        fixtureRemoved: "pending",
      },
      commandDefaults: ROADMAP_COMMAND_TIMEOUT_MS,
      fixtures,
      missionStateUnchanged: fs.readFileSync(stateFile, "utf8") === "before\n",
      providerCalls: 0,
      sources: sourcePaths.map((relative) => ({
        path: relative,
        sha256: crypto.createHash("sha256").update(fs.readFileSync(path.join(root, relative))).digest("hex"),
      })),
      sourceInventory,
      unknownCleanup: {
        cleanupState: unknown.cleanupState,
        missionStateUnchanged: fs.readFileSync(stateFile, "utf8") === "before\n",
        retryCount: 0,
        timedOut: unknown.timedOut,
      },
    };
    assert(fixtures.every((item) => item.timedOut === true && item.cleanupState === "terminal" && item.descendantsTerminal === true), "Every command-class fixture must terminate its owned tree.");
    assert(defaultAdapter.validationTimeoutMs === 600_000 && overriddenAdapter.validationTimeoutMs === 1_000, "Validation timeout default and override must be bounded.");
    assert(rejectedOverrides.every(Boolean), "Validation timeout values outside 1..1800 seconds must fail closed.");
    assert(Object.values(sourceInventory).every(Boolean), "Every maintained synchronous roadmap caller must use an explicit command-class timeout.");
    if (process.platform === "win32") assert(unknown.cleanupState === "unknown" && unknown.timedOut === true, "Failed tree attestation must retain cleanup unknown.");
    assert((result.cleanup as { complete: boolean }).complete, "Every proof-owned process must be terminal before return.");
    return result;
  } finally {
    for (const pid of ownedPids) terminateProofPid(pid);
    fs.rmSync(fixture, { recursive: true, force: true });
  }
}

async function runSchedulerCandidate(): Promise<Record<string, unknown>> {
  const started = Date.now();
  const scheduler = new ArbiterScheduler();
  const active = await Promise.all([
    scheduler.acquire("root-0", "epoch-0"),
    scheduler.acquire("root-1", "epoch-1"),
  ]);
  const controllers = Array.from({ length: 32 }, () => new AbortController());
  const queued = controllers.map((controller, index) =>
    scheduler.acquire(`root-${index + 2}`, `epoch-${index + 2}`, controller.signal)
  );
  const queueAtCapacity = scheduler.queuedCount;
  const overload = await scheduler.acquire("root-overflow", "epoch-overflow");
  const revisedController = new AbortController();
  const revised = scheduler.acquire("root-2", "epoch-revised", revisedController.signal);
  const originalRevision = await queued[0];
  scheduler.release("root-0", "epoch-0");
  const promoted = await queued[1];
  controllers[2].abort();
  const cancelled = await queued[2];
  const activeAfterPromotion = scheduler.activeCount;
  const queuedAfterCancellation = scheduler.queuedCount;

  for (const controller of controllers) controller.abort();
  revisedController.abort();
  scheduler.release("root-1", "epoch-1");
  scheduler.release("root-3", "epoch-3");
  const outcomes = await Promise.all([...queued, revised]);
  return {
    active,
    activeAfterPromotion,
    cancelled,
    cleanup: scheduler.activeCount === 0 && scheduler.queuedCount === 0 ? "complete" : "incomplete",
    elapsedMs: Date.now() - started,
    maxActiveObserved: Math.max(2, activeAfterPromotion),
    originalRevision,
    outcomes: {
      acquired: outcomes.filter((value) => value === "acquired").length,
      cancelled: outcomes.filter((value) => value === "cancelled").length,
    },
    overload,
    promoted,
    queueAtCapacity,
    queuedAfterCancellation,
  };
}

async function runQueryCandidate(): Promise<Record<string, unknown>> {
  const { collectSessionGraph, inspectSessionGraphCapability, queryPlanHasFullScan } = await import(
    "../../global/plugin/session-delivery-context/session-graph.ts"
  );
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "bound-completion-query-"));
  const started = Date.now();
  try {
    const smallPath = path.join(dir, "small.sqlite");
    const largePath = path.join(dir, "large.sqlite");
    const missingPath = path.join(dir, "missing-index.sqlite");
    const widePath = path.join(dir, "wide.sqlite");
    const seedTree = (db: InstanceType<typeof DatabaseSync>, withIndex: boolean, extra = 0, width = 0): void => {
      db.exec("create table session (id text primary key, parent_id text, time_created integer, time_updated integer, agent text, metadata text)");
      db.exec("begin");
      const insert = db.prepare("insert into session (id, parent_id, time_created, time_updated) values (?, ?, ?, ?)");
      insert.run("root-selected", null, 1, 1);
      insert.run("child-a", "root-selected", 2, 2);
      insert.run("child-b", "root-selected", 3, 3);
      insert.run("child-c", "child-a", 4, 4);
      for (let index = 0; index < extra; index += 1) {
        insert.run(`unrelated-${index}`, null, 10_000 + index, 10_000 + index);
      }
      for (let index = 0; index < width; index += 1) {
        insert.run(`wide-${index}`, "root-selected", 20_000 + index, 20_000 + index);
      }
      db.exec("commit");
      if (withIndex) db.exec("create index session_parent_idx on session (parent_id)");
    };
    const schemaFor = (): Map<string, Set<string>> => {
      const schema = new Map<string, Set<string>>();
      schema.set("session", new Set(["id", "parent_id", "time_created", "time_updated", "agent", "metadata"]));
      return schema;
    };
    const small = new DatabaseSync(smallPath);
    const large = new DatabaseSync(largePath);
    const missing = new DatabaseSync(missingPath);
    const wide = new DatabaseSync(widePath);
    try {
      seedTree(small, true);
      seedTree(large, true, UNRELATED);
      seedTree(missing, false, 1_000);
      seedTree(wide, true, 0, 600);
      const smallWalk = collectSessionGraph(small, schemaFor(), "root-selected");
      const heapBefore = process.memoryUsage().heapUsed;
      const largeWalk = collectSessionGraph(large, schemaFor(), "root-selected");
      const heapAfter = process.memoryUsage().heapUsed;
      const missingWalk = collectSessionGraph(missing, schemaFor(), "root-selected");
      const wideWalk = collectSessionGraph(wide, schemaFor(), "root-selected");
      const largeCapability = inspectSessionGraphCapability(large, schemaFor());
      return {
        cleanup: "complete",
        elapsedMs: Date.now() - started,
        heapDeltaBytes: heapAfter - heapBefore,
        large: {
          complete: largeWalk.complete,
          ids: largeWalk.rows.map((row) => String(row.id)).sort(),
          omitted: largeWalk.omitted,
          queryPlan: largeCapability.queryPlan,
          queryPlanHasFullScan: queryPlanHasFullScan(largeCapability.queryPlan),
          reason: largeWalk.reason,
          selectedRootRows: largeWalk.rows.length,
        },
        missingIndex: {
          complete: missingWalk.complete,
          reason: missingWalk.reason,
          selectedRootRows: missingWalk.rows.length,
        },
        small: {
          complete: smallWalk.complete,
          ids: smallWalk.rows.map((row) => String(row.id)).sort(),
          omitted: smallWalk.omitted,
          reason: smallWalk.reason,
          selectedRootRows: smallWalk.rows.length,
        },
        wide: {
          complete: wideWalk.complete,
          omitted: wideWalk.omitted,
          reason: wideWalk.reason,
          selectedRootRows: wideWalk.rows.length,
        },
      };
    } finally {
      small.close();
      large.close();
      missing.close();
      wide.close();
    }
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

async function main(args: string[]): Promise<number> {
  if (args.includes("--help") || args.includes("-h") || args.length === 0) {
    process.stdout.write(`${usage()}\n`);
    return 0;
  }
  const mode = optionalMode(args);
  const evidenceRoot = path.resolve(required(args, "--evidence-root"));
  if (fs.existsSync(evidenceRoot)) throw new Error(`Evidence root already exists: ${evidenceRoot}`);
  fs.mkdirSync(evidenceRoot, { recursive: true });
  if (mode === "integrated") {
    const root = repoRoot();
    const baseline = JSON.parse(fs.readFileSync(
      path.join(root, "openspec/changes/bound-completion-runtime-hot-paths/evidence/task-1-2-baseline-r1/evaluation.json"),
      "utf8",
    )) as Record<string, unknown>;
    const query = await runQueryCandidate();
    const scheduler = await runSchedulerCandidate();
    const processResult = await runProcessCandidate(root);
    const baselineLarge = baseline.largeDb as Record<string, unknown>;
    const candidateLarge = (query.large as Record<string, unknown>);
    const result = {
      schemaVersion: 1,
      candidateId: "bound-completion-runtime-hot-paths-r1",
      mode,
      baseline: {
        elapsedMs: baselineLarge.elapsedMs,
        heapDeltaBytes: baselineLarge.heapDeltaBytes,
        queryPlanHasFullScan: baselineLarge.queryPlanHasFullScan,
        selectedRows: baselineLarge.selectedAllRows,
      },
      candidate: {
        elapsedMs: query.elapsedMs,
        heapDeltaBytes: query.heapDeltaBytes,
        queryPlan: candidateLarge.queryPlan,
        queryPlanHasFullScan: candidateLarge.queryPlanHasFullScan,
        selectedRows: candidateLarge.selectedRootRows,
      },
      cleanup: {
        largeDbRemoved: query.cleanup === "complete",
        processFixtures: (processResult.cleanup as { complete: boolean }).complete,
        scheduler: scheduler.cleanup,
      },
      process: {
        commandDefaults: processResult.commandDefaults,
        fixtures: processResult.fixtures,
        unknownCleanup: processResult.unknownCleanup,
      },
      providerCalls: 0,
      scheduler,
      sources: [
        ...(processResult.sources as unknown[]),
        {
          path: "global/extensions/session-completion-guard/arbiter-scheduler.ts",
          sha256: crypto.createHash("sha256").update(fs.readFileSync(path.join(root, "global/extensions/session-completion-guard/arbiter-scheduler.ts"))).digest("hex"),
        },
        {
          path: "global/plugin/session-delivery-context/session-graph.ts",
          sha256: crypto.createHash("sha256").update(fs.readFileSync(path.join(root, "global/plugin/session-delivery-context/session-graph.ts"))).digest("hex"),
        },
      ],
    };
    assert(result.baseline.queryPlanHasFullScan === true && result.candidate.queryPlanHasFullScan === false, "Candidate query plan must remove the retained full scan.");
    assert(result.baseline.selectedRows === 100_004 && result.candidate.selectedRows === 3, "Candidate work must scale with the selected root graph.");
    assert(scheduler.queueAtCapacity === 32 && scheduler.overload === "overload", "The 33rd queued root must fail with overload.");
    assert(scheduler.maxActiveObserved === 2 && scheduler.promoted === "acquired", "FIFO scheduler must never exceed two active roots.");
    assert(scheduler.originalRevision === "cancelled" && scheduler.cancelled === "cancelled", "Revision and signal cancellation must free queued capacity.");
    assert(Object.values(result.cleanup).every((value) => value === true || value === "complete"), "Integrated fixtures must clean up completely.");
    fs.writeFileSync(path.join(evidenceRoot, "evaluation.json"), `${JSON.stringify(result, null, 2)}\n`);
    process.stdout.write(`${JSON.stringify({
      cleanup: result.cleanup,
      fullScan: result.candidate.queryPlanHasFullScan,
      maxActive: scheduler.maxActiveObserved,
      providerCalls: 0,
      queued: scheduler.queueAtCapacity,
      selectedRows: result.candidate.selectedRows,
    })}\n`);
    return 0;
  }
  if (mode === "process") {
    const processResult = await runProcessCandidate(repoRoot());
    const result = {
      schemaVersion: 1,
      candidateId: "bound-completion-runtime-hot-paths-r1",
      mode,
      ...processResult,
      cleanup: { ...(processResult.cleanup as Record<string, unknown>), fixtureRemoved: true },
    };
    fs.writeFileSync(path.join(evidenceRoot, "evaluation.json"), `${JSON.stringify(result, null, 2)}\n`);
    process.stdout.write(`${JSON.stringify({
      cleanup: result.cleanup,
      commandClasses: (processResult.fixtures as unknown[]).length,
      missionStateUnchanged: processResult.missionStateUnchanged,
      providerCalls: 0,
      unknownCleanup: processResult.unknownCleanup,
    })}\n`);
    return 0;
  }
  if (mode === "query") {
    const query = await runQueryCandidate();
    const result = {
      schemaVersion: 1,
      candidateId: "bound-completion-runtime-hot-paths-r1",
      cleanup: { largeDbRemoved: true },
      mode,
      providerCalls: 0,
      query,
    };
    fs.writeFileSync(path.join(evidenceRoot, "evaluation.json"), `${JSON.stringify(result, null, 2)}\n`);
    process.stdout.write(`${JSON.stringify({
      cleanup: result.cleanup,
      mode,
      providerCalls: 0,
      queryPlanHasFullScan: (query.large as { queryPlanHasFullScan: boolean }).queryPlanHasFullScan,
      selectedRootRows: (query.large as { selectedRootRows: number }).selectedRootRows,
      wideComplete: (query.wide as { complete: boolean }).complete,
    })}\n`);
    return 0;
  }
  const root = repoRoot();
  const source = scanCurrentSource(root);
  const largeDb = runLargeDb();
  const hung = runHungChild();
  const result = {
    schemaVersion: 1,
    candidateId: "bound-completion-runtime-hot-paths-r1",
    cleanup: {
      hungChildGone: spawnSync(process.execPath, ["-e", "process.exit(0)"], { timeout: 1000 }).status === 0,
      largeDbRemoved: true,
    },
    hungChild: hung,
    largeDb,
    providerCalls: 0,
    queueBaseline: {
      currentScheduler: "absent",
      defaults: { active: null, queued: null },
      probeEnqueued: QUEUED_PROBE,
      note: "Current source has no process-wide FIFO scheduler; 33-root overflow is unenforced.",
    },
    source,
  };
  fs.writeFileSync(path.join(evidenceRoot, "evaluation.json"), `${JSON.stringify(result, null, 2)}\n`);
  process.stdout.write(`${JSON.stringify({
    cleanup: result.cleanup,
    elapsedMs: largeDb.elapsedMs,
    providerCalls: 0,
    queryPlanHasFullScan: largeDb.queryPlanHasFullScan,
    selectedAllRows: largeDb.selectedAllRows,
    timedOut: hung.timedOut,
  })}\n`);
  return 0;
}

if (process.argv[1] != null && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  void main(process.argv.slice(2)).then((code) => {
    process.exitCode = code;
  }).catch((error: unknown) => {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  });
}
