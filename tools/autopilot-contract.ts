export const autopilotTaskTypes = [
  "feature",
  "bugfix",
  "refactor",
  "docs",
  "typo",
  "research",
  "planning",
  "tooling",
  "config",
  "performance",
  "protocol",
] as const;

export const autopilotTaskStatuses = ["Ready", "Analyze", "Implementation", "Review", "Acceptance", "Done", "Blocked", "Failed", "Cancelled"] as const;

export const autopilotMrStatuses = ["none", "created", "updated", "waiting-review", "merged", "not-required"] as const;

export const autopilotMrWaitStatuses = ["created", "updated", "waiting-review"] as const;

export const autopilotReasonCodes = [
  "no_ledgers",
  "invalid_ledgers",
  "ready_runtime_deferred",
  "waiting_for_mr",
  "blocked_for_user",
  "collect_deferred",
  "stop_no_active_state",
  "no_actionable_tasks",
  "advanced",
] as const;

export const autopilotActionabilityValues = ["actionable", "invalid", "waiting_for_mr", "blocked_for_user", "runtime_deferred", "terminal", "not_selected"] as const;

export const autopilotToolNames = ["autopilot_run_next", "autopilot_status", "autopilot_collect", "autopilot_answer_blocker", "autopilot_stop"] as const;

export const autopilotProtectedPathPatterns = [
  "openspec/changes/*/automation/task.json",
  "openspec/changes/*/automation/feedback/**",
  "openspec/changes/*/automation/artifacts/**",
  ".autopilot/**",
] as const;

export type AutopilotTaskType = (typeof autopilotTaskTypes)[number];
export type AutopilotTaskStatus = (typeof autopilotTaskStatuses)[number];
export type AutopilotMrStatus = (typeof autopilotMrStatuses)[number];
export type AutopilotMrWaitStatus = (typeof autopilotMrWaitStatuses)[number];
export type AutopilotReasonCode = (typeof autopilotReasonCodes)[number];
export type AutopilotActionability = (typeof autopilotActionabilityValues)[number];
export type AutopilotToolName = (typeof autopilotToolNames)[number];
