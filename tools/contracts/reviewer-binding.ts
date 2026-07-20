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

/** Closed-world output fields required on exact registered read-only reviewers only. */
export const REGISTERED_REVIEWER_OUTPUT_FIELD_TEXT: readonly string[] = [
  "Blocking Evidence",
  "Follow-up Candidates",
];

export const REVIEWER_CONTRACT_REFERENCE_CONTRACTS: readonly TextContract[] = PREVENTION_FEEDBACK_REVIEWER_FILES.map((fileName) => ({
  fileName,
  label: `${fileName} must reference the shared reviewer contract via ## Contract Reference`,
  requiredText: [...REVIEWER_CONTRACT_REFERENCE_TEXT, ...REGISTERED_REVIEWER_OUTPUT_FIELD_TEXT],
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
  "Blocking Evidence",
  "Follow-up Candidates",
  "never authorize",
  "Record the optional-tool gap in `Evidence Reviewed` and `Residual Risks`",
  "Record missing required session evidence in `Blocking Evidence` when unavailable from all allowed sources",
  "Optional-tool absence alone is not blocking when substitute evidence is sufficient",
  "Delivery self-gate for the current Material closing task",
  "every prerequisite applicable task is checked with current literal evidence",
  "Any other unchecked applicable task remains a P0",
  "Candidate Reference",
  "readable scoped candidate",
  "Rollback plan",
  "proportional",
  "never required to claim Change-Ready",
  "explicitly accepted conforming delivery result",
  "Verdict: material deviations",
  "Verdict: not enough evidence",
  "must not coexist with `Blocking for Acceptance: no`",
  "terminal for the current attempt",
  "Pilot-Ready: yes|no|not requested",
  "not a third profile",
  "does not authorize external operations",
];

export const SESSION_DELIVERY_BINDING_CONTRACT: TextContract = {
  fileName: "session-delivery-reviewer.md",
  label: "session-delivery-reviewer must require delivery-control safeguards",
  requiredText: [...SESSION_DELIVERY_BINDING_REQUIRED_TEXT],
};

/**
 * Exact Material-always / Ordinary-conditional / missing-capability-blocks tokens required on
 * project-facing delivery binding surfaces.
 */
export const MATERIAL_DELIVERY_ROUTING_TOKENS: readonly string[] = [
  "For Material work, always run the discovered conforming delivery/readiness gate",
  "missing conforming capability blocks",
  "Ordinary Small uses proportional evidence and invokes that gate only when project policy, risk, or the owner requires it",
  "explicitly accepted conforming delivery result",
];

/** Surfaces that must retain Material delivery routing semantics. */
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
    "do not invent acceptance scope",
  ],
};

export const SESSION_DELIVERY_BINDING_HANDOFF_TOKENS: readonly string[] = [
  "Change-Ready: no",
  "Verdict: material deviations",
  "Verdict: not enough evidence",
  "Blocking for Acceptance: yes",
  "Verdict: blocked",
  "Blocking Evidence",
  "Follow-up Candidates",
  "never authorize",
  "do not present the session as complete",
  "Blocking for Acceptance: no",
  "partial slice handoff must not end an unfinished root goal",
];

/**
 * Exact closed-world scope-firewall markers required on loaded authority surfaces.
 * Deterministic substring checks only — no fuzzy severity/scope classification.
 */
export const CLOSED_WORLD_SCOPE_MARKERS: readonly string[] = [
  "post-freeze scope may only shrink",
  "new revision or separate change",
  "never authorize scope expansion",
  "Blocking Evidence",
  "Follow-up Candidates",
  "one correction wave",
  "frozen acceptance criterion",
];

/** Surfaces that must retain closed-world scope-firewall markers. */
export const CLOSED_WORLD_SCOPE_SURFACES: readonly string[] = [
  "REPO_AGENTS.md",
  "global/AGENTS.md",
  "global/skills/change-ready-sdlc/SKILL.md",
  "instructions/reusable-project-agent-instructions.md",
  "instructions/universal-development-loop.md",
  "templates/project/AGENTS.md",
];

/**
 * Exact superseded authority phrases that must not appear on loaded closed-world surfaces.
 * Match whole unsafe sentences/phrases only.
 */
export const CLOSED_WORLD_FORBIDDEN_AUTHORITY_PATTERNS = [
  {
    needle: "Actionable Continuation Items",
    diagnostic: "superseded reviewer/SDET action-list field Actionable Continuation Items",
  },
  {
    needle: "Required Next Actions",
    diagnostic: "superseded delivery/reviewer action-list field Required Next Actions",
  },
  {
    needle: "changes_requested",
    diagnostic: "superseded final-review verdict changes_requested",
  },
  {
    needle: "Suggested Next Options",
    diagnostic: "superseded reviewer/subagent action-list field Suggested Next Options",
  },
  {
    needle: "actionable continuation items",
    diagnostic: "superseded generic actionable continuation items on loaded closed-world surface",
  },
  {
    needle:
      "new blocking corrections or acceptance criteria require explicit owner approval or a reproducible P0/P1 defect",
    diagnostic: "superseded P0/P1 post-mutation scope-expansion exception",
  },
  {
    needle: "a new blocking candidate correction or new acceptance criterion requires either:",
    diagnostic: "superseded P0/P1 post-mutation scope-expansion exception in skill",
  },
  {
    needle: "Keep `Required Next Actions` and final-review `changes_requested`",
    diagnostic: "superseded action-list binding authority",
  },
  {
    needle: "Replay only gates invalidated by a qualifying P0/P1 correction or a failed mandatory gate",
    diagnostic: "superseded unbounded P0/P1 correction-replay authority",
  },
  {
    needle: "replay only gates invalidated by a qualifying P0/P1 correction or a failed mandatory gate",
    diagnostic: "superseded unbounded P0/P1 correction-replay authority",
  },
  {
    needle:
      "Evidence tooling must not become a second product; it MAY be added only when a mandatory gate cannot be reproduced without it",
    diagnostic: "superseded persistent evidence-tool exception",
  },
] as const;

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
