export const REVIEWER_ALLOWED_PERMISSION_KEYS = [
  "read",
  "glob",
  "grep",
] as const;

export const REVIEWER_DENIED_PERMISSION_KEYS = [
  "task",
  "question",
  "webfetch",
  "websearch",
  "todowrite",
  "external_directory",
  "lsp",
  "doom_loop",
] as const;

export const REVIEWER_OBSOLETE_PERMISSION_KEYS = ["list"] as const;

export const ALLOWED_REVIEWER_BASH_RULES: ReadonlyMap<string, "deny" | "allow"> = new Map([
  ["permission.bash", "deny"],
]);

export const ALLOWED_REVIEWER_EDIT_RULES: ReadonlyMap<string, "deny" | "allow"> = new Map([
  ["permission.edit.*", "deny"],
  ["permission.edit.docs/feedbacks/**", "allow"],
]);

export const ALLOWED_COMPLAIN_SKILL_RULES: ReadonlyMap<string, "deny" | "allow"> = new Map([
  ["permission.skill.*", "deny"],
  ["permission.skill.complain", "allow"],
]);

export const REUSABLE_REVIEWER_LEAF_CONTRACT_TEXT: readonly string[] = [
  "## Contract Reference",
  "`instructions/leaf-reviewer-agent-contract.md`",
  "`Candidate Reference / RC`",
  "`Effective Model`",
  "`Evidence Gaps And Residual Risks`",
];

export const CODE_QUALITY_REVIEWER_FILE = "code-quality-reviewer.md";

export const CODE_QUALITY_REVIEWER_REQUIRED_TEXT: readonly string[] = [
  "`Reduction Matrix`",
  "deletion/reuse target",
  "net line/concept delta",
  "behavior and compatibility obligations",
  "retained unique critical/compatibility test oracles",
  "proof needed after implementation",
  "Do not return a verdict, lifecycle blocker",
];

/** Canonical shared leaf-reviewer contract path under repository root. */
export const LEAF_REVIEWER_AGENT_CONTRACT_RELATIVE_PATH =
  "instructions/leaf-reviewer-agent-contract.md";

/**
 * Exact markers required in the shared leaf-reviewer Output Schema / evidence rules.
 * Registered generic reviewers inherit this via ## Contract Reference (no per-agent copy).
 */
export const LEAF_REVIEWER_SHARED_EFFECTIVE_MODEL_REQUIRED_TEXT: readonly string[] = [
  "Effective Model: <effective model id when known, or unknown>",
  "An unknown effective model is an evidence-gap row",
];

/** Exact field names forbidden on registered reviewer/SDET output contracts (closed-world firewall). */
export const REVIEWER_SDET_FORBIDDEN_ACTION_FIELDS: readonly string[] = [
  "Missing Tests",
  "Missing Golden Tests",
  "Missing Golden/Integration Tests",
  "Missing Decisions",
  "Required Evidence",
  "Benchmark Suggestions",
  "Validation Gaps",
  "Manual Gates",
  "Suggested Next Options",
  "Required Next Actions",
  "Actionable Continuation Items",
  "changes_requested",
  "Blocking Evidence",
  "Blocking for Acceptance",
  "Blocking for acceptance",
  "Blocking for implementation",
  "Blocking for deployment",
  "Blocking for compatibility",
  "Blocking for production/readiness",
  "Lifecycle Blocker:",
  "P0 blocker",
  "clean verdict",
  "Verdict:",
];

/** Exact standalone path line required under ## Contract Reference for registered reviewers. */
export const STANDALONE_CONTRACT_REFERENCE_PATH = "`instructions/leaf-reviewer-agent-contract.md`";

export const REUSABLE_REVIEWER_FORBIDDEN_BOILERPLATE: readonly RegExp[] = [
  /## Orchestration/,
  /Do not modify files\./,
];

export const REUSABLE_REVIEWER_FORBIDDEN_INLINE_BLOCKS: readonly RegExp[] = [
  /^## Leaf Contract(\r?\n|$)/m,
  /^## Feedback Ledger(\r?\n|$)/m,
  /^## Prevention Feedback(\r?\n|$)/m,
];

export const FINAL_CANDIDATE_REVIEWER_FILE = "final-candidate-reviewer.md";

export const EVIDENCE_SUFFICIENCY_REVIEWER_FILE = "evidence-sufficiency-reviewer.md";

export const IMPLEMENTATION_READINESS_REVIEWER_FILE = "implementation-readiness-reviewer.md";

export const IMPLEMENTATION_READINESS_REVIEWER_REQUIRED_TEXT: readonly string[] = [
  "original accepted request",
  "candidate consistency is not task-fit evidence",
  "newly authored decision-material",
  "coherent-wrong-outcome",
  "silent-owner-decision",
  "missing-observable-oracle",
  "late-implementation-invalidation",
  "internal-contradiction",
  "unnecessary-scope",
  "no-material-finding",
  "Finding count, novelty, severity, and review length are not success measures",
  "Practice Observation",
  "Falsification Matrix",
  "Do not decide the product result",
];

export const EVIDENCE_SUFFICIENCY_REVIEWER_REQUIRED_TEXT: readonly string[] = [
  "fresh read-only evidence-sufficiency reviewer",
  "Original Outcome Comparison",
  "Claim-Evidence Matrix",
  "Claim ID",
  "Population/Environment",
  "Paths/Observation Boundary",
  "Real Oracle",
  "Unresolved Observations",
  "exact evidence references",
  "Maximum Supported Claim",
  "Current Disposition: supported | narrowed | blocked | unknown",
  "Ordinary Small exact-case work does not require this role",
  "Never infer semantic equivalence",
  "Do not return an acceptance/rejection verdict",
  "Effective Model",
  "Candidate Reference / RC",
];

/**
 * Deterministic required substrings for final-candidate-reviewer.md.
 * Optional post-MVP risk review of the current runtime-proven candidate.
 */
export const FINAL_CANDIDATE_REVIEWER_REQUIRED_TEXT: readonly string[] = [
  "## Contract Reference",
  "`instructions/leaf-reviewer-agent-contract.md`",
  "fresh read-only",
  "After current proof",
  "complete readable current candidate",
  "Candidate Reference",
  "optional review remains attributed to the exact candidate",
  "Risk Matrix",
  "Risk ID",
  "Requirement/Invariant",
  "Reachable Scenario And Enforced Envelope",
  "Business Consequence",
  "Likelihood",
  "Recommendation",
  "Confidence",
  "Reproduction Procedure",
  "Smallest Mitigation Note",
  "Evidence Gaps And Residual Risks",
  "Do not return an acceptance/rejection verdict",
  "Main alone reproduces, classifies, fixes, parks",
  "directly readable",
  "FINAL_CANDIDATE_REVIEW_REPORT",
  "Runtime Proof",
  "exact candidate assessed",
  "Effective Model",
  "remove, narrow, reuse, local guard",
];

/**
 * Read-only review/delivery agents that use the shared leaf-reviewer contract.
 */
export const REVIEW_DELIVERY_AGENT_FILES: readonly string[] = [
  "code-quality-reviewer.md",
  "deployment-config-reviewer.md",
  "evidence-sufficiency-reviewer.md",
  "execution-safety-reviewer.md",
  "final-candidate-reviewer.md",
  "foundation-integrity-reviewer.md",
  "implementation-readiness-reviewer.md",
  "instruction-artifact-reviewer.md",
  "legacy-client-compatibility-reviewer.md",
  "legacy-evidence-reviewer.md",
  "openspec-architecture-reviewer.md",
  "performance-reliability-reviewer.md",
  "protocol-api-reviewer.md",
  "rust-concurrency-reviewer.md",
  "test-coverage-reviewer.md",
  "wire-protocol-reviewer.md",
];
