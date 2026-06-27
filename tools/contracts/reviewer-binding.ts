import type { TextContract } from "./types.ts";

export const PREVENTION_FEEDBACK_REVIEWER_FILES: readonly string[] = [
  "code-quality-reviewer.md",
  "deployment-config-reviewer.md",
  "implementation-readiness-reviewer.md",
  "instruction-artifact-reviewer.md",
  "legacy-client-compatibility-reviewer.md",
  "legacy-evidence-reviewer.md",
  "openspec-architecture-reviewer.md",
  "performance-reliability-reviewer.md",
  "protocol-api-reviewer.md",
  "rust-concurrency-reviewer.md",
  "session-delivery-reviewer.md",
  "test-coverage-reviewer.md",
  "wire-protocol-reviewer.md",
];

export const PREVENTION_FEEDBACK_REQUIRED_TEXT: readonly string[] = [
  "## Prevention Feedback",
  "Recurrence Path",
  "Prevention Target",
  "Prevention Cost",
  "Draft Rule",
  "Replay Evidence",
];

export const PREVENTION_FEEDBACK_CONTRACTS: readonly TextContract[] = PREVENTION_FEEDBACK_REVIEWER_FILES.map((fileName) => ({
  fileName,
  label: `${fileName} must define Prevention Feedback output contract`,
  requiredText: [...PREVENTION_FEEDBACK_REQUIRED_TEXT],
}));

export const SESSION_DELIVERY_BINDING_REQUIRED_TEXT: readonly string[] = [
  "Use after material or complex sessions",
  "## Minimal Evidence Bundle",
  "changed files or diffstat",
  "reviewer findings/fixes",
  "## Compaction Evidence Boundary",
  "every explicit delivery-review request",
  "Root causes must cite evidence; use `unknown`",
  "requirementSignals[]",
  "Root-session user messages, confirmed `requirementSignals[]`, and explicit `questionReplies[]` override supplied continuation summaries",
  "openspec_all_changes",
  "archive_when_complete",
  "push_after_archive",
  "blocker_escalation_gate",
  "new_change_approval_required",
  "push_all",
  "Missing evidence for a confirmed signaled requirement is a P0 blocker",
  "todos.ever[]",
  "todos.unresolved[]",
  "Changed-file scope",
  "Current-slice framing",
  "P0 blocker",
  "test-first evidence for behavior-changing work",
  "Keep matrices terse",
  "Required Next Actions",
  "Actionable Continuation Items",
];

export const SESSION_DELIVERY_BINDING_CONTRACT: TextContract = {
  fileName: "session-delivery-reviewer.md",
  label: "session-delivery-reviewer must require delivery-control safeguards",
  requiredText: [...SESSION_DELIVERY_BINDING_REQUIRED_TEXT],
};

export const TEST_COVERAGE_REVIEWER_CONTRACT: TextContract = {
  fileName: "test-coverage-reviewer.md",
  label: "test-coverage-reviewer must require task/repro/runtime-envelope coverage",
  requiredText: [
    "## Review Inputs And Baseline Scenario",
    "user task, acceptance criteria, logs, and reproduction",
    "actual runtime envelope",
    "fresh-session behavior",
    "Task/Repro Coverage Matrix",
  ],
};

export const SESSION_DELIVERY_BINDING_HANDOFF_TOKENS: readonly string[] = [
  "Blocking for Acceptance: yes",
  "Verdict: blocked",
  "P0 blocker",
  "Required Next Actions",
  "do not present the session as complete",
  "partial slice handoff must not end an unfinished root goal",
];

export const AGENT_TEXT_CONTRACTS: readonly TextContract[] = [
  ...PREVENTION_FEEDBACK_CONTRACTS,
  SESSION_DELIVERY_BINDING_CONTRACT,
  TEST_COVERAGE_REVIEWER_CONTRACT,
];