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

export const REVIEWER_CONTRACT_REFERENCE_TEXT: readonly string[] = [
  "## Contract Reference",
  "`instructions/leaf-reviewer-agent-contract.md`",
];

export const REVIEWER_CONTRACT_REFERENCE_CONTRACTS: readonly TextContract[] = PREVENTION_FEEDBACK_REVIEWER_FILES.map((fileName) => ({
  fileName,
  label: `${fileName} must reference the shared reviewer contract via ## Contract Reference`,
  requiredText: [...REVIEWER_CONTRACT_REFERENCE_TEXT],
}));

export const SESSION_DELIVERY_BINDING_REQUIRED_TEXT: readonly string[] = [
  "For Portable profile Material sessions, always run this delivery review regardless of diagnostic scale",
  "For Portable profile Small sessions, run when project policy, risk, owner, or an explicit delivery-review request requires it",
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
  "observable happy-path proof",
  "fresh-context testing subagent",
  "Keep matrices terse",
  "Required Next Actions",
  "Actionable Continuation Items",
  "Record the optional-tool gap in `Evidence Reviewed` and `Residual Risks`",
  "Add the gap to `Required Next Actions` only when required session evidence is unavailable from all allowed sources",
  "Optional-tool absence alone is not a required action when substitute evidence is sufficient",
  "Delivery self-gate for the current Material closing task",
  "every prerequisite applicable task is checked with current literal evidence",
  "Any other unchecked applicable task remains a P0",
  "exact marker-only metadata transition and recapture package identity",
  "Semantic Candidate Identity",
  "Package Identity",
  "Identity Recipe",
  "Qualification gates bind to Semantic Candidate Identity",
  "marker-only metadata transition with unchanged Semantic Candidate Identity",
  "same recorded Identity Recipe",
  "unexplained recipe change",
  "post-test Applicable Proof",
  "missing post-test Applicable Proof continuity after",
  "pending forbidden in final",
  "Rollback plan and evidence",
  "entire authoritative scoped candidate manifest",
  "unjournaled sequential in-place rollback",
  "isolated workspace or project-native snapshot",
  "failure-atomic or explicitly journaled",
  "never substitutes for",
  "Runtime activation rollback",
  "must not be treated as full change rollback",
  "never required to claim Change-Ready",
  "explicitly accepted conforming delivery result",
  "Verdict: material deviations",
  "Verdict: not enough evidence",
  "must not coexist with `Blocking for Acceptance: no`",
];

export const SESSION_DELIVERY_BINDING_CONTRACT: TextContract = {
  fileName: "session-delivery-reviewer.md",
  label: "session-delivery-reviewer must require delivery-control safeguards",
  requiredText: [...SESSION_DELIVERY_BINDING_REQUIRED_TEXT],
};

/**
 * Exact Material-always / Small-conditional / missing-capability-blocks tokens required on
 * all five project-facing delivery binding surfaces. Static evidence only; never decides readiness.
 */
export const MATERIAL_DELIVERY_ROUTING_TOKENS: readonly string[] = [
  "For Material work, always run the discovered conforming delivery/readiness gate",
  "missing conforming capability blocks",
  "Small uses proportional evidence and invokes that gate only when project policy, risk, or the owner requires it",
  "explicitly accepted conforming delivery result",
];

/** Five surfaces that must retain Material delivery routing semantics. */
export const MATERIAL_DELIVERY_ROUTING_SURFACES: readonly string[] = [
  "REPO_AGENTS.md",
  "global/AGENTS.md",
  "instructions/reusable-project-agent-instructions.md",
  "instructions/universal-development-loop.md",
  "templates/project/AGENTS.md",
];

export const TEST_COVERAGE_REVIEWER_CONTRACT: TextContract = {
  fileName: "test-coverage-reviewer.md",
  label: "test-coverage-reviewer must require task/repro/runtime-envelope coverage",
  requiredText: [
    "## Review Inputs And Baseline Scenario",
    "user task, acceptance criteria, logs, and reproduction",
    "actual runtime envelope",
    "fresh-session behavior",
    "Task/Repro Coverage Matrix",
    "After Applicable Proof",
    "do not demand systematic tests before the production happy path and Applicable Proof",
  ],
};

export const SESSION_DELIVERY_BINDING_HANDOFF_TOKENS: readonly string[] = [
  "Change-Ready: no",
  "Verdict: material deviations",
  "Verdict: not enough evidence",
  "Blocking for Acceptance: yes",
  "Verdict: blocked",
  "qualifying P0/P1 serious blocker",
  "Required Next Actions",
  "do not present the session as complete",
  "Blocking for Acceptance: no",
  "Required Next Actions: none",
  "partial slice handoff must not end an unfinished root goal",
];

/** Surfaces that must retain session-delivery binding handoff tokens. */
export const SESSION_DELIVERY_BINDING_SURFACES: readonly string[] = [
  "REPO_AGENTS.md",
  "global/AGENTS.md",
  "instructions/reusable-project-agent-instructions.md",
  "instructions/universal-development-loop.md",
  "templates/project/AGENTS.md",
];

export const AGENT_TEXT_CONTRACTS: readonly TextContract[] = [
  ...REVIEWER_CONTRACT_REFERENCE_CONTRACTS,
  SESSION_DELIVERY_BINDING_CONTRACT,
  TEST_COVERAGE_REVIEWER_CONTRACT,
];
