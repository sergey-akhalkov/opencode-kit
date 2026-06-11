import fs from "node:fs";
import path from "node:path";
import {
  autopilotActionabilityValues,
  autopilotMrWaitStatuses,
  autopilotReasonCodes,
  autopilotToolNames,
  type AutopilotActionability,
  type AutopilotReasonCode as ContractAutopilotReasonCode,
  type AutopilotToolName,
} from "./autopilot-contract.ts";
import { validateTaskLedger } from "./autopilot-ledger.ts";

export type AutopilotOutcome = "advanced" | "blocked_for_user" | "waiting_for_mr" | "idle" | "failed";
export type NextRecommendedCall = "autopilot_status" | "autopilot_collect" | "autopilot_answer_blocker" | null;
export type AutopilotReasonCode = ContractAutopilotReasonCode;
// `advanced`, `actionable`, and `not_selected` are reserved for future runtime dispatch.
// The MVP output builder keeps them in the public union for forward-compatible consumers but does not emit them yet.
export type TaskActionability = AutopilotActionability;
export type AutopilotNextActionKind = "tool" | "validation" | "report" | "wait" | "ask_user" | "manual_review";
export type AutopilotNextActionSafety = "safe" | "requires_user" | "requires_credentials" | "not_available";

export type AutopilotOptions = {
  ledgerRoot?: string;
  prototypeLedgerRoot?: string;
};

export type LedgerFilter = {
  changeId?: string;
  taskId?: string;
};

export type LedgerSummary = {
  path: string;
  id: string;
  taskType: string;
  status: string;
  valid: boolean;
  errors: string[];
  blockers: Array<Record<string, unknown>>;
  mr?: {
    status?: string;
    url?: string;
  };
};

export type MrWaitSummary = { taskId: string; url?: string; status?: string };
export type BlockerSummary = { taskId?: string; reason: string; path?: string; errors?: string[] };
export type TaskActionabilitySummary = {
  taskId: string;
  path: string;
  taskType: string;
  status: string;
  valid: boolean;
  mrStatus?: string;
  actionability: TaskActionability;
  reasonCode: AutopilotReasonCode;
};
export type AutopilotNextAction = {
  label: string;
  kind: AutopilotNextActionKind;
  tool?: AutopilotToolName;
  args?: Record<string, unknown>;
  reason: string;
  safety: AutopilotNextActionSafety;
  expectedResult: string;
};
export type AutopilotLoopGuard = {
  repeatedNoProgress: boolean;
  equivalentCall?: string;
  suppressRepeatRecommendation: boolean;
};
export type AutopilotOutput = {
  outcome: AutopilotOutcome;
  tasksStarted: unknown[];
  tasksAdvanced: unknown[];
  mrsWaiting: MrWaitSummary[];
  questions: unknown[];
  blockers: BlockerSummary[];
  nextRecommendedCall: NextRecommendedCall;
  summary: string;
  reasonCode: AutopilotReasonCode;
  taskSummaries: TaskActionabilitySummary[];
  nextActions: AutopilotNextAction[];
  loopGuard: AutopilotLoopGuard;
};

const defaultLedgerRoot = "openspec/changes";
const defaultPrototypeLedgerRoot = ".autopilot/prototype/tasks";
const terminalStatuses = new Set(["Done", "Failed", "Cancelled"]);
const mrWaitingStatuses = new Set<string>(autopilotMrWaitStatuses);

export const autopilotOutputContract = {
  reasonCodes: autopilotReasonCodes,
  actionabilityValues: autopilotActionabilityValues,
  mrWaitStatuses: autopilotMrWaitStatuses,
  toolNames: autopilotToolNames,
} as const;

type LedgerClassification = {
  actionability: TaskActionability;
  reasonCode: AutopilotReasonCode;
  hasUserBlocker: boolean;
  isReadyRuntimeDeferred: boolean;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value != null && !Array.isArray(value);
}

function asString(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim().length > 0 ? value : fallback;
}

function asRecordArray(value: unknown): Array<Record<string, unknown>> {
  return Array.isArray(value) ? value.filter(isRecord) : [];
}

export function toRelative(root: string, filePath: string): string {
  return path.relative(root, filePath).split(path.sep).join("/");
}

export function listTaskLedgerFiles(root: string, options: AutopilotOptions = {}): string[] {
  const files: string[] = [];
  const ledgerRoot = path.join(root, options.ledgerRoot ?? defaultLedgerRoot);
  const prototypeRoot = path.join(root, options.prototypeLedgerRoot ?? defaultPrototypeLedgerRoot);

  if (fs.existsSync(ledgerRoot) && fs.statSync(ledgerRoot).isDirectory()) {
    for (const change of fs.readdirSync(ledgerRoot, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      if (!change.isDirectory()) {
        continue;
      }
      const taskPath = path.join(ledgerRoot, change.name, "automation", "task.json");
      if (fs.existsSync(taskPath) && fs.statSync(taskPath).isFile()) {
        files.push(taskPath);
      }
    }
  }

  if (fs.existsSync(prototypeRoot) && fs.statSync(prototypeRoot).isDirectory()) {
    for (const entry of fs.readdirSync(prototypeRoot, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      if (entry.isFile() && entry.name.endsWith(".json")) {
        files.push(path.join(prototypeRoot, entry.name));
      }
    }
  }

  return files;
}

function ledgerMatchesFilter(ledger: LedgerSummary, filter: LedgerFilter): boolean {
  if (filter.changeId && !ledger.path.startsWith(`openspec/changes/${filter.changeId}/`)) {
    return false;
  }
  if (filter.taskId && ledger.id !== filter.taskId) {
    return false;
  }
  return true;
}

export function readLedgerSummaries(root: string, options: AutopilotOptions = {}, filter: LedgerFilter = {}): LedgerSummary[] {
  return listTaskLedgerFiles(root, options).map((filePath) => {
    try {
      const parsed = JSON.parse(fs.readFileSync(filePath, "utf8")) as unknown;
      const result = validateTaskLedger(parsed, { sourcePath: toRelative(root, filePath) });
      const record = isRecord(parsed) ? parsed : {};
      const mr = isRecord(record.mr) ? record.mr : {};
      return {
        path: toRelative(root, filePath),
        id: asString(record.id, path.basename(filePath, ".json")),
        taskType: asString(record.taskType, "unknown"),
        status: asString(record.status, "unknown"),
        valid: result.valid,
        errors: result.errors,
        blockers: asRecordArray(record.blockers),
        mr: {
          status: typeof mr.status === "string" ? mr.status : undefined,
          url: typeof mr.url === "string" ? mr.url : undefined,
        },
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return {
        path: toRelative(root, filePath),
        id: path.basename(filePath, ".json"),
        taskType: "unknown",
        status: "unknown",
        valid: false,
        errors: [`Failed to read task ledger: ${message}`],
        blockers: [],
      };
    }
  }).filter((ledger) => ledgerMatchesFilter(ledger, filter));
}

export function summarizeLedgers(ledgers: LedgerSummary[]): Record<string, unknown> {
  const byStatus: Record<string, number> = {};
  const byTaskType: Record<string, number> = {};
  for (const ledger of ledgers) {
    byStatus[ledger.status] = (byStatus[ledger.status] ?? 0) + 1;
    byTaskType[ledger.taskType] = (byTaskType[ledger.taskType] ?? 0) + 1;
  }
  return {
    total: ledgers.length,
    valid: ledgers.filter((ledger) => ledger.valid).length,
    invalid: ledgers.filter((ledger) => !ledger.valid).length,
    byStatus,
    byTaskType,
  };
}

export function mrsWaiting(ledgers: LedgerSummary[]): MrWaitSummary[] {
  return ledgers
    .filter((ledger) => mrWaitingStatuses.has(ledger.mr?.status ?? ""))
    .map((ledger) => ({ taskId: ledger.id, status: ledger.mr?.status, url: ledger.mr?.url }));
}

export function invalidBlockers(ledgers: LedgerSummary[]): BlockerSummary[] {
  return ledgers
    .filter((ledger) => !ledger.valid)
    .map((ledger) => ({ taskId: ledger.id, path: ledger.path, reason: "invalid task ledger", errors: ledger.errors }));
}

function classifyLedger(ledger: LedgerSummary): LedgerClassification {
  if (!ledger.valid) {
    return {
      actionability: "invalid",
      reasonCode: "invalid_ledgers",
      hasUserBlocker: false,
      isReadyRuntimeDeferred: false,
    };
  }

  if (ledger.status === "Blocked" || ledger.blockers.length > 0) {
    return {
      actionability: "blocked_for_user",
      reasonCode: "blocked_for_user",
      hasUserBlocker: true,
      isReadyRuntimeDeferred: false,
    };
  }

  if (mrWaitingStatuses.has(ledger.mr?.status ?? "")) {
    return {
      actionability: "waiting_for_mr",
      reasonCode: "waiting_for_mr",
      hasUserBlocker: false,
      isReadyRuntimeDeferred: false,
    };
  }

  if (terminalStatuses.has(ledger.status)) {
    return {
      actionability: "terminal",
      reasonCode: "no_actionable_tasks",
      hasUserBlocker: false,
      isReadyRuntimeDeferred: false,
    };
  }

  const isReadyRuntimeDeferred = ledger.status === "Ready";
  return {
    actionability: "runtime_deferred",
    reasonCode: isReadyRuntimeDeferred ? "ready_runtime_deferred" : "no_actionable_tasks",
    hasUserBlocker: false,
    isReadyRuntimeDeferred,
  };
}

function userBlockers(ledgers: LedgerSummary[]): BlockerSummary[] {
  return ledgers
    .filter((ledger) => classifyLedger(ledger).hasUserBlocker)
    .map((ledger) => ({ taskId: ledger.id, path: ledger.path, reason: "task is blocked for user action" }));
}

function hasReadyRuntimeDeferred(ledgers: LedgerSummary[]): boolean {
  return ledgers.some((ledger) => classifyLedger(ledger).isReadyRuntimeDeferred);
}

function taskSummaries(ledgers: LedgerSummary[]): TaskActionabilitySummary[] {
  return ledgers.map((ledger) => {
    const classification = classifyLedger(ledger);
    return {
      taskId: ledger.id,
      path: ledger.path,
      taskType: ledger.taskType,
      status: ledger.status,
      valid: ledger.valid,
      mrStatus: ledger.mr?.status,
      actionability: classification.actionability,
      reasonCode: classification.reasonCode,
    };
  });
}

function runNextReasonCode(ledgers: LedgerSummary[]): AutopilotReasonCode {
  if (ledgers.length === 0) {
    return "no_ledgers";
  }
  if (invalidBlockers(ledgers).length > 0) {
    return "invalid_ledgers";
  }
  if (userBlockers(ledgers).length > 0) {
    return "blocked_for_user";
  }
  if (mrsWaiting(ledgers).length > 0) {
    return "waiting_for_mr";
  }
  if (hasReadyRuntimeDeferred(ledgers)) {
    return "ready_runtime_deferred";
  }
  return "no_actionable_tasks";
}

function outcomeForReason(reasonCode: AutopilotReasonCode): AutopilotOutcome {
  if (reasonCode === "invalid_ledgers") {
    return "failed";
  }
  if (reasonCode === "blocked_for_user") {
    return "blocked_for_user";
  }
  if (reasonCode === "waiting_for_mr") {
    return "waiting_for_mr";
  }
  if (reasonCode === "advanced") {
    return "advanced";
  }
  return "idle";
}

function nextActionsFor(reasonCode: AutopilotReasonCode): AutopilotNextAction[] {
  if (reasonCode === "invalid_ledgers") {
    return [
      {
        label: "Review invalid task ledgers",
        kind: "validation",
        reason: "At least one task ledger failed deterministic validation.",
        safety: "safe",
        expectedResult: "Fix or regenerate invalid ledger state before Autopilot continues.",
      },
    ];
  }
  if (reasonCode === "waiting_for_mr") {
    return [
      {
        label: "Wait for MR review or merge",
        kind: "wait",
        reason: "Autopilot must not merge or bypass MR review gates automatically.",
        safety: "requires_user",
        expectedResult: "Reviewer or user merges, updates, or rejects the MR outside Autopilot.",
      },
    ];
  }
  if (reasonCode === "blocked_for_user") {
    return [
      {
        label: "Review blocker before answering",
        kind: "manual_review",
        reason: "A task is blocked, but MVP output does not include a question envelope for autopilot_answer_blocker yet.",
        safety: "requires_user",
        expectedResult: "Wait for a returned questionId/options envelope before calling autopilot_answer_blocker.",
      },
    ];
  }
  if (reasonCode === "ready_runtime_deferred") {
    return [
      {
        label: "Continue selected OpenSpec change manually",
        kind: "manual_review",
        reason: "Valid Ready work exists, but MVP runtime claim/dispatch and ledger mutation are deferred.",
        safety: "safe",
        expectedResult: "Use the task summary to choose a bounded manual implementation slice without repeating autopilot_run_next.",
      },
    ];
  }
  if (reasonCode === "collect_deferred") {
    return [
      {
        label: "Inspect Autopilot status",
        kind: "tool",
        tool: "autopilot_status",
        reason: "Worker report collection is not implemented, so repeating collect would not advance state.",
        safety: "safe",
        expectedResult: "Status summarizes current ledgers without claiming progress.",
      },
    ];
  }
  if (reasonCode === "stop_no_active_state") {
    return [
      {
        label: "Inspect Autopilot status",
        kind: "tool",
        tool: "autopilot_status",
        reason: "Stop did not change runtime state; status is the safe follow-up if confirmation is needed.",
        safety: "safe",
        expectedResult: "Status confirms current ledgers, blockers, and MR waits.",
      },
    ];
  }
  if (reasonCode === "no_ledgers") {
    return [
      {
        label: "Create or select an OpenSpec task ledger",
        kind: "manual_review",
        reason: "No plugin-owned task ledger was discovered.",
        safety: "safe",
        expectedResult: "A valid task ledger exists before Autopilot runtime tools are retried.",
      },
    ];
  }
  return [
    {
      label: "Review OpenSpec task state",
      kind: "manual_review",
      reason: "Ledgers exist, but no task can safely advance through the MVP runtime.",
      safety: "safe",
      expectedResult: "A human or future runtime identifies the next bounded safe action.",
    },
  ];
}

function nextActionsAfterAnswerBlocker(): AutopilotNextAction[] {
  return [
    {
      label: "Inspect Autopilot status after blocker answer",
      kind: "tool",
      tool: "autopilot_status",
      reason: "MVP accepted the blocker answer envelope but did not mutate plugin-owned state.",
      safety: "safe",
      expectedResult: "Status confirms whether a real blocker remains before any further action.",
    },
  ];
}

function loopGuardFor(reasonCode: AutopilotReasonCode, equivalentCall?: string): AutopilotLoopGuard {
  const suppressRepeatRecommendation = ["ready_runtime_deferred", "collect_deferred", "stop_no_active_state", "no_actionable_tasks", "no_ledgers"].includes(reasonCode);
  return {
    repeatedNoProgress: suppressRepeatRecommendation,
    equivalentCall,
    suppressRepeatRecommendation,
  };
}

function outputFor(ledgers: LedgerSummary[], summary: string, reasonCode: AutopilotReasonCode, equivalentCall?: string, nextRecommendedCall: NextRecommendedCall = null): AutopilotOutput {
  return {
    outcome: outcomeForReason(reasonCode),
    tasksStarted: [],
    tasksAdvanced: [],
    mrsWaiting: mrsWaiting(ledgers),
    questions: [],
    blockers: [...invalidBlockers(ledgers), ...userBlockers(ledgers)],
    nextRecommendedCall,
    summary,
    reasonCode,
    taskSummaries: taskSummaries(ledgers),
    nextActions: nextActionsFor(reasonCode),
    loopGuard: loopGuardFor(reasonCode, equivalentCall),
  };
}

export function createRunNextOutput(ledgers: LedgerSummary[]): AutopilotOutput {
  const reasonCode = runNextReasonCode(ledgers);
  if (reasonCode === "no_ledgers") {
    return outputFor(ledgers, "No OpenSpec autopilot task ledgers were found. MVP prototype does not create ledgers automatically yet.", reasonCode, "autopilot_run_next");
  }
  if (reasonCode === "ready_runtime_deferred") {
    return outputFor(
      ledgers,
      `MVP autopilot inspected ${ledgers.length} task ledger(s). Valid Ready work exists, but worker dispatch, MR sync, and ledger mutation are intentionally deferred.`,
      reasonCode,
      "autopilot_run_next",
    );
  }
  return outputFor(ledgers, `Autopilot inspected ${ledgers.length} task ledger(s).`, reasonCode, "autopilot_run_next");
}

export function createStatusOutput(ledgers: LedgerSummary[]): AutopilotOutput & { status: Record<string, unknown> } {
  const reasonCode = runNextReasonCode(ledgers);
  return {
    ...outputFor(ledgers, `Autopilot status inspected ${ledgers.length} task ledger(s).`, reasonCode, "autopilot_status"),
    status: summarizeLedgers(ledgers),
  };
}

export function createCollectOutput(ledgers: LedgerSummary[]): AutopilotOutput {
  const reasonCode = invalidBlockers(ledgers).length > 0 ? "invalid_ledgers" : "collect_deferred";
  return outputFor(
    ledgers,
    `MVP collect inspected ${ledgers.length} task ledger(s). Runtime worker report collection and legal state mutation are deferred.`,
    reasonCode,
    "autopilot_collect",
  );
}

export function createAnswerBlockerOutput(questionId: string): AutopilotOutput {
  // MVP accepts the answer envelope but does not mutate blocker state, so the acknowledgement is idle while retaining blocker context.
  return {
    outcome: "idle",
    tasksStarted: [],
    tasksAdvanced: [],
    mrsWaiting: [],
    questions: [],
    blockers: [],
    nextRecommendedCall: "autopilot_status",
    summary: `Accepted blocker answer envelope for ${questionId}. MVP state mutation is deferred.`,
    reasonCode: "blocked_for_user",
    taskSummaries: [],
    nextActions: nextActionsAfterAnswerBlocker(),
    loopGuard: { repeatedNoProgress: true, equivalentCall: "autopilot_answer_blocker", suppressRepeatRecommendation: true },
  };
}

export function createStopOutput(target?: string): AutopilotOutput {
  return {
    outcome: "idle",
    tasksStarted: [],
    tasksAdvanced: [],
    mrsWaiting: [],
    questions: [],
    blockers: [],
    nextRecommendedCall: "autopilot_status",
    summary: `No active MVP runtime state was changed for stop target ${target ?? "run"}.`,
    reasonCode: "stop_no_active_state",
    taskSummaries: [],
    nextActions: nextActionsFor("stop_no_active_state"),
    loopGuard: loopGuardFor("stop_no_active_state", "autopilot_stop"),
  };
}
