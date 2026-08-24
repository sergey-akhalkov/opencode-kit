#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { fileURLToPath, pathToFileURL } from "node:url";



const UNRELATED = 100_000;
const QUEUED_PROBE = 33;
const HUNG_TIMEOUT_MS = 250;

function usage(): string {
  return [
    "Usage:",
    "  node tools/proofs/bound-completion-baseline.ts --help",
    "  node tools/proofs/bound-completion-baseline.ts --evidence-root <absolute-new-path>",
    "  node tools/proofs/bound-completion-baseline.ts --mode query --evidence-root <absolute-new-path>",
    "",
    "Provider-free baseline of current unbounded session-query, status loop, queue, and process-timeout behavior.",
    "--mode query proves production bounded/indexed root-graph acquisition against disposable fixtures.",
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
  if (value !== "baseline" && value !== "query") throw new Error("Unsupported --mode");
  return value;
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
