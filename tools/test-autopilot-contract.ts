#!/usr/bin/env node
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import autopilotPlugin from "../.opencode/plugins/openspec-autopilot.ts";
import {
  autopilotActionabilityValues,
  autopilotMrStatuses,
  autopilotMrWaitStatuses,
  autopilotProtectedPathPatterns,
  autopilotReasonCodes,
  autopilotTaskStatuses,
  autopilotTaskTypes,
  autopilotToolNames,
} from "./autopilot-contract.ts";
import { autopilotLedgerPolicy, taskStatuses, taskTypes } from "./autopilot-ledger.ts";
import { autopilotOutputContract } from "./openspec-autopilot-output.ts";

type TestCase = {
  name: string;
  run: () => void | Promise<void>;
};

type PluginToolResult = {
  output: string;
  metadata?: Record<string, unknown>;
};

type PluginToolDefinition = {
  description: string;
  args: Record<string, unknown>;
  execute: (args: Record<string, unknown>, context?: unknown) => Promise<string | PluginToolResult>;
};

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const fixtureRoot = path.join(root, "fixtures", "autopilot-ledger");

function assertArrayEqual(actual: unknown, expected: readonly string[], label: string): void {
  if (!Array.isArray(actual)) {
    throw new Error(`${label} must be an exported array.`);
  }
  const actualStrings = actual.map((value) => String(value));
  if (actualStrings.length !== expected.length || actualStrings.some((value, index) => value !== expected[index])) {
    throw new Error(`${label} drifted from shared contract.\nExpected: ${expected.join(", ")}\nActual: ${actualStrings.join(", ")}`);
  }
}

function readPluginToolNames(): string[] {
  const pluginPath = path.join(root, ".opencode", "plugins", "openspec-autopilot.ts");
  const text = fs.readFileSync(pluginPath, "utf8");
  return Array.from(text.matchAll(/^\s*(autopilot_[a-z_]+):\s*tool\(/gm), (match) => match[1]);
}

function readPackageScripts(): Record<string, string> {
  const packagePath = path.join(root, "package.json");
  const parsed = JSON.parse(fs.readFileSync(packagePath, "utf8")) as { scripts?: Record<string, unknown> };
  const scripts: Record<string, string> = {};
  for (const [name, value] of Object.entries(parsed.scripts ?? {})) {
    if (typeof value === "string") {
      scripts[name] = value;
    }
  }
  return scripts;
}

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

function readFixture(name: string): Record<string, unknown> {
  return JSON.parse(fs.readFileSync(path.join(fixtureRoot, name), "utf8")) as Record<string, unknown>;
}

function historyOf(ledger: Record<string, unknown>): Array<Record<string, unknown>> {
  assert(Array.isArray(ledger.history), "Fixture history must be an array.");
  return ledger.history as Array<Record<string, unknown>>;
}

function revisionOf(ledger: Record<string, unknown>): Record<string, unknown> {
  assert(typeof ledger.revision === "object" && ledger.revision != null && !Array.isArray(ledger.revision), "Fixture revision must be an object.");
  return ledger.revision as Record<string, unknown>;
}

function readyResearchLedger(id: string): Record<string, unknown> {
  const ledger = readFixture("valid-research.json");
  ledger.id = id;
  ledger.status = "Ready";
  ledger.history = [];
  ledger.mr = { required: true, status: "none" };
  revisionOf(ledger).number = 1;
  return ledger;
}

function waitingResearchLedger(id: string): Record<string, unknown> {
  const ledger = readFixture("valid-research.json");
  ledger.id = id;
  historyOf(ledger);
  return ledger;
}

function withTempRepo(name: string, run: (repo: string) => void | Promise<void>): Promise<void> {
  const repo = fs.mkdtempSync(path.join(os.tmpdir(), `openspec-autopilot-plugin-${name}-`));
  return Promise.resolve(run(repo)).finally(() => {
    fs.rmSync(repo, { recursive: true, force: true });
  });
}

function writeLedger(repo: string, changeId: string, ledger: Record<string, unknown>): void {
  const filePath = path.join(repo, "openspec", "changes", changeId, "automation", "task.json");
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(ledger, null, 2)}\n`, "utf8");
}

function snapshotFiles(rootPath: string, relativePath = ""): string[] {
  const current = path.join(rootPath, relativePath);
  return fs.readdirSync(current, { withFileTypes: true })
    .sort((a, b) => a.name.localeCompare(b.name))
    .flatMap((entry) => {
      const entryRelativePath = path.join(relativePath, entry.name);
      const normalized = entryRelativePath.split(path.sep).join("/");
      const entryPath = path.join(rootPath, entryRelativePath);
      if (entry.isDirectory()) {
        return snapshotFiles(rootPath, entryRelativePath);
      }
      return [`${normalized}\n${fs.readFileSync(entryPath, "utf8")}`];
    });
}

function assertLoopGuard(output: Record<string, unknown>, expectedEquivalentCall: string): void {
  assert(typeof output.loopGuard === "object" && output.loopGuard != null && !Array.isArray(output.loopGuard), "loopGuard must be an object.");
  const loopGuard = output.loopGuard as Record<string, unknown>;
  assert(loopGuard.equivalentCall === expectedEquivalentCall, `Expected loopGuard equivalentCall=${expectedEquivalentCall}, got ${String(loopGuard.equivalentCall)}.`);
  assert(loopGuard.repeatedNoProgress === true, "loopGuard must mark repeated no-progress semantics.");
  assert(loopGuard.suppressRepeatRecommendation === true, "loopGuard must suppress repeat recommendation.");
}

function assertAutopilotOutputShape(output: Record<string, unknown>, label: string): void {
  assert(typeof output.reasonCode === "string", `${label} must include reasonCode.`);
  assert(Array.isArray(output.taskSummaries), `${label} must include taskSummaries array.`);
  assert(Array.isArray(output.nextActions), `${label} must include nextActions array.`);
  assert(typeof output.loopGuard === "object" && output.loopGuard != null && !Array.isArray(output.loopGuard), `${label} must include loopGuard object.`);
  for (const action of output.nextActions) {
    assert(typeof action === "object" && action != null && !Array.isArray(action), `${label} nextActions entries must be objects.`);
    const nextAction = action as Record<string, unknown>;
    for (const key of ["label", "kind", "reason", "safety", "expectedResult"]) {
      assert(typeof nextAction[key] === "string" && String(nextAction[key]).trim().length > 0, `${label} nextActions entries must include non-empty ${key}.`);
    }
  }
}

async function pluginTools(repo: string): Promise<Record<string, PluginToolDefinition>> {
  const hooks = await autopilotPlugin.server({ directory: repo, worktree: repo } as never);
  assert(typeof hooks.tool === "object" && hooks.tool != null && !Array.isArray(hooks.tool), "Autopilot plugin server must return a tool map.");
  return hooks.tool as Record<string, PluginToolDefinition>;
}

async function executePluginTool(tools: Record<string, PluginToolDefinition>, name: string, args: Record<string, unknown>): Promise<{ payload: Record<string, unknown>; metadata: Record<string, unknown> }> {
  const definition = tools[name];
  assert(definition != null, `Missing plugin tool ${name}.`);
  const result = await definition.execute(args, undefined);
  assert(typeof result === "object" && result != null && !Array.isArray(result), `${name} must return structured tool output.`);
  assert(typeof result.output === "string", `${name} must return a JSON output string.`);
  const payload = JSON.parse(result.output) as Record<string, unknown>;
  assertAutopilotOutputShape(payload, name);
  return { payload, metadata: result.metadata ?? {} };
}

function taskIds(output: Record<string, unknown>): string[] {
  assert(Array.isArray(output.taskSummaries), "taskSummaries must be an array.");
  return output.taskSummaries.map((summary) => {
    assert(typeof summary === "object" && summary != null && !Array.isArray(summary), "Each task summary must be an object.");
    return String((summary as Record<string, unknown>).taskId);
  });
}

const tests: TestCase[] = [
  {
    name: "ledger task types and statuses match shared contract",
    run: () => {
      assertArrayEqual(taskTypes, autopilotTaskTypes, "tools/autopilot-ledger.ts taskTypes");
      assertArrayEqual(taskStatuses, autopilotTaskStatuses, "tools/autopilot-ledger.ts taskStatuses");
    },
  },
  {
    name: "ledger protected paths and MR statuses match shared contract",
    run: () => {
      assertArrayEqual(autopilotLedgerPolicy.protectedLedgerPathPatterns, autopilotProtectedPathPatterns, "ledger protected path patterns");
      assertArrayEqual(autopilotLedgerPolicy.mrStatuses, autopilotMrStatuses, "ledger MR lifecycle statuses");
    },
  },
  {
    name: "plugin tool names match shared contract",
    run: () => {
      assertArrayEqual(readPluginToolNames(), autopilotToolNames, "plugin autopilot_* tool names");
    },
  },
  {
    name: "output public values match shared contract",
    run: () => {
      assertArrayEqual(autopilotOutputContract.reasonCodes, autopilotReasonCodes, "output reason codes");
      assertArrayEqual(autopilotOutputContract.actionabilityValues, autopilotActionabilityValues, "output actionability values");
      assertArrayEqual(autopilotOutputContract.mrWaitStatuses, autopilotMrWaitStatuses, "output MR wait statuses");
    },
  },
  {
    name: "package exposes documented Autopilot validation script",
    run: () => {
      const scripts = readPackageScripts();
      if (scripts["autopilot:validate"] !== "node tools/autopilot-ledger.ts") {
        throw new Error("package.json must expose autopilot:validate as node tools/autopilot-ledger.ts.");
      }
    },
  },
  {
    name: "plugin server exposes and executes every public Autopilot tool",
    run: () => withTempRepo("all-tools", async (repo) => {
      const tools = await pluginTools(repo);
      assertArrayEqual(Object.keys(tools), autopilotToolNames, "plugin server tool map");
      for (const name of autopilotToolNames) {
        const args = name === "autopilot_answer_blocker" ? { questionId: "question-1" } : {};
        const { payload, metadata } = await executePluginTool(tools, name, args);
        assert(metadata.service === "openspec-autopilot", `${name} metadata must identify openspec-autopilot service.`);
        assert(metadata.outcome === payload.outcome, `${name} metadata outcome must mirror payload outcome.`);
      }
    }),
  },
  {
    name: "plugin tools honor scoped args and prove MVP no-op semantics",
    run: () => withTempRepo("scoped-and-noop", async (repo) => {
      writeLedger(repo, "change-a", readyResearchLedger("task-a"));
      writeLedger(repo, "change-b", waitingResearchLedger("task-b"));
      const before = snapshotFiles(repo);
      const tools = await pluginTools(repo);

      const runNextByChange = await executePluginTool(tools, "autopilot_run_next", { changeId: "change-a" });
      assert(taskIds(runNextByChange.payload).join(",") === "task-a", `run_next changeId scope must select only task-a, got ${taskIds(runNextByChange.payload).join(",")}.`);

      const runNextByTask = await executePluginTool(tools, "autopilot_run_next", { taskId: "task-b" });
      assert(taskIds(runNextByTask.payload).join(",") === "task-b", `run_next taskId scope must select only task-b, got ${taskIds(runNextByTask.payload).join(",")}.`);

      const runNextMismatch = await executePluginTool(tools, "autopilot_run_next", { changeId: "change-a", taskId: "task-b" });
      assert(runNextMismatch.payload.reasonCode === "no_ledgers", `Expected mismatched run_next filters to return no_ledgers, got ${String(runNextMismatch.payload.reasonCode)}.`);
      assert(taskIds(runNextMismatch.payload).length === 0, `Mismatched run_next filters must select no task, got ${taskIds(runNextMismatch.payload).join(",")}.`);

      const runNext = await executePluginTool(tools, "autopilot_run_next", { changeId: "change-a", taskId: "task-a" });
      assert(runNext.payload.reasonCode === "ready_runtime_deferred", `Expected scoped run_next ready_runtime_deferred, got ${String(runNext.payload.reasonCode)}.`);
      assertLoopGuard(runNext.payload, "autopilot_run_next");
      assert(taskIds(runNext.payload).join(",") === "task-a", `run_next scope must select only task-a, got ${taskIds(runNext.payload).join(",")}.`);

      const status = await executePluginTool(tools, "autopilot_status", { changeId: "change-b" });
      assert(status.payload.reasonCode === "waiting_for_mr", `Expected scoped status waiting_for_mr, got ${String(status.payload.reasonCode)}.`);
      assert(taskIds(status.payload).join(",") === "task-b", `status scope must select only task-b, got ${taskIds(status.payload).join(",")}.`);

      const collect = await executePluginTool(tools, "autopilot_collect", { taskId: "task-b" });
      assert(collect.payload.reasonCode === "collect_deferred", `Expected collect_deferred, got ${String(collect.payload.reasonCode)}.`);
      assert(taskIds(collect.payload).join(",") === "task-b", `collect taskId scope must select only task-b, got ${taskIds(collect.payload).join(",")}.`);
      assertLoopGuard(collect.payload, "autopilot_collect");

      const answer = await executePluginTool(tools, "autopilot_answer_blocker", {
        questionId: "question-1",
        taskId: "task-a",
        selectedLabel: "Proceed",
        action: "continue",
      });
      assert(answer.payload.reasonCode === "blocked_for_user", `Expected answer blocker blocked_for_user acknowledgement, got ${String(answer.payload.reasonCode)}.`);
      assert(String(answer.payload.summary).includes("question-1"), "answer_blocker must acknowledge the required questionId argument.");
      assert(!JSON.stringify(answer).includes("Proceed"), "answer_blocker MVP no-op output must not leak ignored selectedLabel.");
      assert(!JSON.stringify(answer).includes("continue"), "answer_blocker MVP no-op output must not leak ignored action.");
      assert(!JSON.stringify(answer).includes("task-a"), "answer_blocker MVP no-op output must not imply ignored taskId mutation.");
      assert(answer.payload.nextRecommendedCall === "autopilot_status", "answer_blocker no-op acknowledgement must recommend status.");
      assert(taskIds(answer.payload).length === 0, "answer_blocker MVP no-op must not claim task summaries were changed.");
      assertLoopGuard(answer.payload, "autopilot_answer_blocker");

      const stop = await executePluginTool(tools, "autopilot_stop", { target: "task", id: "task-a", reason: "user requested pause" });
      assert(stop.payload.reasonCode === "stop_no_active_state", `Expected stop_no_active_state, got ${String(stop.payload.reasonCode)}.`);
      assert(String(stop.payload.summary).includes("stop target task"), "stop must acknowledge the target argument.");
      assert(!JSON.stringify(stop).includes("task-a"), "stop MVP no-op output must not leak ignored id or imply task mutation.");
      assert(!JSON.stringify(stop).includes("user requested pause"), "stop MVP no-op output must not leak ignored reason.");
      assert(stop.payload.nextRecommendedCall === "autopilot_status", "stop no-op acknowledgement must recommend status.");
      assert(taskIds(stop.payload).length === 0, "stop MVP no-op must not claim task summaries were changed.");
      assertLoopGuard(stop.payload, "autopilot_stop");

      const after = snapshotFiles(repo);
      assert(JSON.stringify(after) === JSON.stringify(before), "MVP plugin tools must not create, delete, or mutate temp repo files in this runtime-deferred/no-op slice.");
    }),
  },
];

let failed = 0;
for (const test of tests) {
  try {
    await test.run();
    console.log(`PASS ${test.name}`);
  } catch (error) {
    failed++;
    const message = error instanceof Error ? error.message : String(error);
    console.error(`FAIL ${test.name}\n${message}`);
  }
}

if (failed > 0) {
  console.error(`${failed} autopilot contract test(s) failed.`);
  process.exit(1);
}

console.log(`OK: autopilot contract tests=${tests.length}`);
