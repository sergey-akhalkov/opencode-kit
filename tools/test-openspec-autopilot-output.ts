#!/usr/bin/env node
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  createAnswerBlockerOutput,
  createCollectOutput,
  createRunNextOutput,
  createStatusOutput,
  createStopOutput,
  readLedgerSummaries,
  type AutopilotNextAction,
  type AutopilotOutput,
  type TaskActionabilitySummary,
} from "./openspec-autopilot-output.ts";

type TestCase = {
  name: string;
  run: () => void;
};

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const fixtureRoot = path.join(root, "fixtures", "autopilot-ledger");

function readFixture(name: string): Record<string, unknown> {
  return JSON.parse(fs.readFileSync(path.join(fixtureRoot, name), "utf8")) as Record<string, unknown>;
}

function withTempRepo(name: string, run: (repo: string) => void): void {
  const repo = fs.mkdtempSync(path.join(os.tmpdir(), `openspec-autopilot-${name}-`));
  try {
    run(repo);
  } finally {
    fs.rmSync(repo, { recursive: true, force: true });
  }
}

function writeLedger(repo: string, changeId: string, ledger: Record<string, unknown>): void {
  const filePath = path.join(repo, "openspec", "changes", changeId, "automation", "task.json");
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(ledger, null, 2)}\n`, "utf8");
}

function historyOf(ledger: Record<string, unknown>): Array<Record<string, unknown>> {
  if (!Array.isArray(ledger.history)) {
    throw new Error("Fixture history must be an array.");
  }
  return ledger.history as Array<Record<string, unknown>>;
}

function revisionOf(ledger: Record<string, unknown>): Record<string, unknown> {
  if (typeof ledger.revision !== "object" || ledger.revision == null || Array.isArray(ledger.revision)) {
    throw new Error("Fixture revision must be an object.");
  }
  return ledger.revision as Record<string, unknown>;
}

function readyResearchLedger(): Record<string, unknown> {
  const ledger = readFixture("valid-research.json");
  ledger.id = "ready-research";
  ledger.status = "Ready";
  ledger.history = [];
  ledger.mr = { required: true, status: "none" };
  return ledger;
}

function invalidReadyLedger(): Record<string, unknown> {
  const ledger = readyResearchLedger();
  ledger.id = "invalid-ready";
  delete ledger.testDecision;
  return ledger;
}

function doneResearchLedger(): Record<string, unknown> {
  const ledger = readFixture("valid-research.json");
  ledger.id = "done-research";
  ledger.status = "Done";
  ledger.mr = {
    required: false,
    status: "not-required",
    noMrAcceptancePolicy: "Research-only artifact accepted without file-changing MR.",
  };
  historyOf(ledger).push({
    from: "Acceptance",
    to: "Done",
    at: "2026-06-10T00:03:00.000Z",
    by: "plugin",
    source: "autopilot_collect",
    evidence: { noMrAcceptancePolicy: "Research-only artifact accepted without file-changing MR." },
  });
  revisionOf(ledger).number = 4;
  return ledger;
}

function blockedResearchLedger(): Record<string, unknown> {
  const ledger = readFixture("valid-research.json");
  ledger.id = "blocked-research";
  ledger.status = "Blocked";
  ledger.mr = { required: true, status: "none" };
  ledger.blockers = [{ reason: "User must choose provider credentials." }];
  historyOf(ledger).push({
    from: "Acceptance",
    to: "Blocked",
    at: "2026-06-10T00:03:00.000Z",
    by: "plugin",
    source: "autopilot_collect",
    evidence: {
      blockerReason: "User must choose provider credentials.",
      userActionRequired: true,
      recommendedOptions: ["Use existing credentials", "Stop task"],
    },
  });
  revisionOf(ledger).number = 4;
  return ledger;
}

function readSingleLedgerOutput(repo: string): AutopilotOutput {
  return createRunNextOutput(readLedgerSummaries(repo));
}

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

function assertNoRepeatedTool(output: AutopilotOutput, toolName: string): void {
  assert(output.nextRecommendedCall !== toolName, `Output must not recommend repeated ${toolName}.`);
  assert(!output.nextActions.some((action) => action.tool === toolName), `nextActions must not recommend repeated ${toolName}.`);
}

function assertNextAction(action: AutopilotNextAction | undefined, expected: { kind: string; safety: string; tool?: string }): void {
  assert(action != null, "Expected a next action.");
  assert(action.kind === expected.kind, `Expected next action kind ${expected.kind}, got ${action.kind}.`);
  assert(action.safety === expected.safety, `Expected next action safety ${expected.safety}, got ${action.safety}.`);
  if (expected.tool) {
    assert(action.tool === expected.tool, `Expected next action tool ${expected.tool}, got ${action.tool}.`);
  }
  for (const key of ["label", "reason", "expectedResult"] as const) {
    assert(typeof action[key] === "string" && action[key].trim().length > 0, `Next action must include non-empty ${key}.`);
  }
}

function summariesByTaskId(output: AutopilotOutput): Map<string, TaskActionabilitySummary> {
  return new Map(output.taskSummaries.map((summary) => [summary.taskId, summary]));
}

function assertSummary(summary: TaskActionabilitySummary | undefined, expected: Partial<TaskActionabilitySummary>): void {
  assert(summary != null, `Missing task summary for ${expected.taskId ?? "unknown task"}.`);
  for (const [key, value] of Object.entries(expected)) {
    assert(summary[key as keyof TaskActionabilitySummary] === value, `Expected summary ${key}=${String(value)}, got ${String(summary[key as keyof TaskActionabilitySummary])}.`);
  }
  assert(typeof summary.path === "string" && summary.path.endsWith("automation/task.json"), "Summary must include compact ledger path.");
}

const tests: TestCase[] = [
  {
    name: "no ledgers return reason code and compact next action",
    run: () => withTempRepo("no-ledgers", (repo) => {
      const output = readSingleLedgerOutput(repo);
      assert(output.outcome === "idle", `Expected idle, got ${output.outcome}.`);
      assert(output.reasonCode === "no_ledgers", `Expected no_ledgers, got ${output.reasonCode}.`);
      assert(output.taskSummaries.length === 0, "No-ledger output must not include task summaries.");
      assertNextAction(output.nextActions[0], { kind: "manual_review", safety: "safe" });
      assertNoRepeatedTool(output, "autopilot_run_next");
    }),
  },
  {
    name: "Ready ledger returns runtime-deferred actionability without repeat recommendation",
    run: () => withTempRepo("ready", (repo) => {
      writeLedger(repo, "ready-research", readyResearchLedger());
      const output = readSingleLedgerOutput(repo);
      assert(output.outcome === "idle", `Expected idle, got ${output.outcome}.`);
      assert(output.reasonCode === "ready_runtime_deferred", `Expected ready_runtime_deferred, got ${output.reasonCode}.`);
      assert(output.loopGuard.repeatedNoProgress, "Ready runtime-deferred output must set no-progress loop guard.");
      assert(output.loopGuard.suppressRepeatRecommendation, "Ready runtime-deferred output must suppress repeat recommendation.");
      assertSummary(output.taskSummaries[0], {
        taskId: "ready-research",
        taskType: "research",
        status: "Ready",
        valid: true,
        mrStatus: "none",
        actionability: "runtime_deferred",
        reasonCode: "ready_runtime_deferred",
      });
      assertNextAction(output.nextActions[0], { kind: "manual_review", safety: "safe" });
      assertNoRepeatedTool(output, "autopilot_run_next");
    }),
  },
  {
    name: "status mirrors runtime-deferred reason without autopilot_run_next loop",
    run: () => withTempRepo("status-ready", (repo) => {
      writeLedger(repo, "ready-research", readyResearchLedger());
      const output = createStatusOutput(readLedgerSummaries(repo));
      assert(output.reasonCode === "ready_runtime_deferred", `Expected ready_runtime_deferred, got ${output.reasonCode}.`);
      assert(output.nextRecommendedCall !== "autopilot_run_next", "Status must not recommend autopilot_run_next when runtime is deferred.");
      assertNoRepeatedTool(output, "autopilot_run_next");
    }),
  },
  {
    name: "invalid ledger returns invalid reason and validation actionability",
    run: () => withTempRepo("invalid", (repo) => {
      writeLedger(repo, "invalid-ready", invalidReadyLedger());
      const output = readSingleLedgerOutput(repo);
      assert(output.outcome === "failed", `Expected failed, got ${output.outcome}.`);
      assert(output.reasonCode === "invalid_ledgers", `Expected invalid_ledgers, got ${output.reasonCode}.`);
      assert(output.blockers[0]?.reason === "invalid task ledger", "Invalid ledger should produce an invalid task blocker.");
      assertSummary(output.taskSummaries[0], {
        taskId: "invalid-ready",
        taskType: "research",
        status: "Ready",
        valid: false,
        actionability: "invalid",
        reasonCode: "invalid_ledgers",
      });
      assertNextAction(output.nextActions[0], { kind: "validation", safety: "safe" });
    }),
  },
  {
    name: "MR wait returns wait reason and actionability",
    run: () => withTempRepo("mr-wait", (repo) => {
      writeLedger(repo, "research-provider-options", readFixture("valid-research.json"));
      const output = readSingleLedgerOutput(repo);
      assert(output.outcome === "waiting_for_mr", `Expected waiting_for_mr, got ${output.outcome}.`);
      assert(output.reasonCode === "waiting_for_mr", `Expected waiting_for_mr, got ${output.reasonCode}.`);
      assert(output.mrsWaiting[0]?.taskId === "research-provider-options", "MR wait output should include MR task id.");
      assertSummary(output.taskSummaries[0], {
        taskId: "research-provider-options",
        taskType: "research",
        status: "Acceptance",
        valid: true,
        mrStatus: "waiting-review",
        actionability: "waiting_for_mr",
        reasonCode: "waiting_for_mr",
      });
      assertNextAction(output.nextActions[0], { kind: "wait", safety: "requires_user" });
    }),
  },
  {
    name: "mixed ledger status reports every task actionability shape",
    run: () => withTempRepo("mixed", (repo) => {
      writeLedger(repo, "blocked-research", blockedResearchLedger());
      writeLedger(repo, "done-research", doneResearchLedger());
      writeLedger(repo, "invalid-ready", invalidReadyLedger());
      writeLedger(repo, "mr-wait", readFixture("valid-research.json"));
      writeLedger(repo, "ready-research", readyResearchLedger());
      const output = createStatusOutput(readLedgerSummaries(repo));
      const summaries = summariesByTaskId(output);
      assert(output.taskSummaries.length === 5, `Expected five task summaries, got ${output.taskSummaries.length}.`);
      assertSummary(summaries.get("blocked-research"), { taskId: "blocked-research", status: "Blocked", taskType: "research", valid: true, mrStatus: "none", actionability: "blocked_for_user", reasonCode: "blocked_for_user" });
      assertSummary(summaries.get("done-research"), { taskId: "done-research", status: "Done", taskType: "research", valid: true, mrStatus: "not-required", actionability: "terminal", reasonCode: "no_actionable_tasks" });
      assertSummary(summaries.get("invalid-ready"), { taskId: "invalid-ready", status: "Ready", taskType: "research", valid: false, mrStatus: "none", actionability: "invalid", reasonCode: "invalid_ledgers" });
      assertSummary(summaries.get("research-provider-options"), { taskId: "research-provider-options", status: "Acceptance", taskType: "research", valid: true, mrStatus: "waiting-review", actionability: "waiting_for_mr", reasonCode: "waiting_for_mr" });
      assertSummary(summaries.get("ready-research"), { taskId: "ready-research", status: "Ready", taskType: "research", valid: true, mrStatus: "none", actionability: "runtime_deferred", reasonCode: "ready_runtime_deferred" });
    }),
  },
  {
    name: "blocked-only output does not recommend uncallable answer-blocker tool",
    run: () => withTempRepo("blocked-only", (repo) => {
      writeLedger(repo, "blocked-research", blockedResearchLedger());
      const output = readSingleLedgerOutput(repo);
      assert(output.outcome === "blocked_for_user", `Expected blocked_for_user, got ${output.outcome}.`);
      assert(output.reasonCode === "blocked_for_user", `Expected blocked_for_user, got ${output.reasonCode}.`);
      assert(output.questions.length === 0, "MVP blocked output must not imply a returned question envelope exists.");
      assert(output.blockers[0]?.taskId === "blocked-research", "Blocked output should identify the blocked task.");
      assertSummary(output.taskSummaries[0], { taskId: "blocked-research", status: "Blocked", taskType: "research", valid: true, mrStatus: "none", actionability: "blocked_for_user", reasonCode: "blocked_for_user" });
      assertNextAction(output.nextActions[0], { kind: "manual_review", safety: "requires_user" });
      assert(!output.nextActions.some((action) => action.tool === "autopilot_answer_blocker"), "Blocked output without questions must not recommend autopilot_answer_blocker.");
    }),
  },
  {
    name: "terminal-only output returns no-actionable reason and loop guard",
    run: () => withTempRepo("terminal-only", (repo) => {
      writeLedger(repo, "done-research", doneResearchLedger());
      const output = readSingleLedgerOutput(repo);
      assert(output.outcome === "idle", `Expected idle, got ${output.outcome}.`);
      assert(output.reasonCode === "no_actionable_tasks", `Expected no_actionable_tasks, got ${output.reasonCode}.`);
      assert(output.loopGuard.suppressRepeatRecommendation, "Terminal-only output must suppress repeated run-next recommendation.");
      assertSummary(output.taskSummaries[0], { taskId: "done-research", status: "Done", taskType: "research", valid: true, mrStatus: "not-required", actionability: "terminal", reasonCode: "no_actionable_tasks" });
      assertNextAction(output.nextActions[0], { kind: "manual_review", safety: "safe" });
      assertNoRepeatedTool(output, "autopilot_run_next");
    }),
  },
  {
    name: "collect returns collect-deferred reason without repeating collect",
    run: () => withTempRepo("collect", (repo) => {
      writeLedger(repo, "ready-research", readyResearchLedger());
      const output = createCollectOutput(readLedgerSummaries(repo));
      assert(output.reasonCode === "collect_deferred", `Expected collect_deferred, got ${output.reasonCode}.`);
      assert(output.loopGuard.equivalentCall === "autopilot_collect", `Expected collect loop guard, got ${output.loopGuard.equivalentCall}.`);
      assert(output.loopGuard.suppressRepeatRecommendation, "Collect output must suppress repeated collect recommendation.");
      assertNoRepeatedTool(output, "autopilot_collect");
      assertNextAction(output.nextActions[0], { kind: "tool", safety: "safe", tool: "autopilot_status" });
    }),
  },
  {
    name: "answer blocker output recommends status without collect wording",
    run: () => {
      const output = createAnswerBlockerOutput("question-1");
      assert(output.outcome === "idle", `Expected idle acknowledgement, got ${output.outcome}.`);
      assert(output.reasonCode === "blocked_for_user", `Expected blocked_for_user, got ${output.reasonCode}.`);
      assert(output.loopGuard.equivalentCall === "autopilot_answer_blocker", `Expected answer-blocker loop guard, got ${output.loopGuard.equivalentCall}.`);
      assert(output.loopGuard.suppressRepeatRecommendation, "Answer-blocker output must suppress repeated answer recommendation.");
      assertNextAction(output.nextActions[0], { kind: "tool", safety: "safe", tool: "autopilot_status" });
      assert(!output.nextActions[0]?.reason.includes("Worker report collection"), "Answer-blocker output must not reuse collect-deferred wording.");
    },
  },
  {
    name: "stop returns no-active-state reason code",
    run: () => {
      const output = createStopOutput("task");
      assert(output.outcome === "idle", `Expected idle, got ${output.outcome}.`);
      assert(output.reasonCode === "stop_no_active_state", `Expected stop_no_active_state, got ${output.reasonCode}.`);
      assert(output.loopGuard.equivalentCall === "autopilot_stop", `Expected stop loop guard, got ${output.loopGuard.equivalentCall}.`);
      assert(output.loopGuard.suppressRepeatRecommendation, "Stop output must suppress repeated stop recommendation.");
      assertNoRepeatedTool(output, "autopilot_stop");
      assertNextAction(output.nextActions[0], { kind: "tool", safety: "safe", tool: "autopilot_status" });
    },
  },
  {
    name: "compact status output excludes raw ledger bodies",
    run: () => withTempRepo("compact", (repo) => {
      const sentinel = "__raw_ledger_sentinel_DO_NOT_EMIT__";
      const ledger = readyResearchLedger();
      ledger.rawOnlySentinel = sentinel;
      writeLedger(repo, "ready-research", ledger);
      const output = createStatusOutput(readLedgerSummaries(repo));
      const serialized = JSON.stringify(output);
      assert((output.status.total as number) === 1, `Expected status total=1, got ${String(output.status.total)}.`);
      assert(output.reasonCode === "ready_runtime_deferred", `Expected ready_runtime_deferred, got ${output.reasonCode}.`);
      assert(output.taskSummaries.length === 1, "Compact status output should include task summaries.");
      assert(output.nextActions.length > 0, "Compact status output should include next actions.");
      assert(!serialized.includes(sentinel), "Compact status output must not include raw-only sentinel data.");
      for (const rawKey of ["scope", "phaseProfile", "phaseEvidence", "testDecision", "reviewPolicy", "history", "revision", "rawOnlySentinel"]) {
        assert(!serialized.includes(`\"${rawKey}\"`), `Compact output must not include raw ledger key ${rawKey}.`);
      }
    }),
  },
];

let failed = 0;
for (const test of tests) {
  try {
    test.run();
    console.log(`PASS ${test.name}`);
  } catch (error) {
    failed++;
    const message = error instanceof Error ? error.message : String(error);
    console.error(`FAIL ${test.name}`);
    console.error(message);
  }
}

if (failed > 0) {
  process.exitCode = 1;
}
