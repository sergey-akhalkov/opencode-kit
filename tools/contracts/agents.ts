export const REVIEWER_ALLOWED_PERMISSION_KEYS = [
  "read",
  "glob",
  "grep",
] as const;

export const REVIEWER_DENIED_PERMISSION_KEYS = [
  "task",
  "question",
  "dream_team_*",
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
  "`Findings`: ordered by severity",
  "`Residual Risks`",
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

/**
 * Deterministic required substrings for final-candidate-reviewer.md.
 * Qualification gate: complete candidate, proof, SDET when required, validation,
 * optional project-native Candidate Reference. Missing dual identity must not block.
 */
export const FINAL_CANDIDATE_REVIEWER_REQUIRED_TEXT: readonly string[] = [
  "## Contract Reference",
  "`instructions/leaf-reviewer-agent-contract.md`",
  "fresh read-only",
  "post-SDET",
  "post-validation",
  "complete current candidate",
  "final SDET",
  "evidence-backed SDET `N/A`",
  "proven non-behavioral",
  "behavior-changing or test-content",
  "project-native validation",
  "approved | approved_with_notes | rejected | blocked",
  "Candidate Reference",
  "qualification gate",
  "Findings",
  "Evidence Type",
  "Likely Root Cause",
  "Artifact Owner",
  "Recommendation",
  "Confidence",
  "Needs external reviewer",
  "Blockers",
  "Residual Risks",
  "Blocking Evidence",
  "Follow-up Candidates",
  "never authorize",
  "validation provenance only",
  "directly readable",
  "FINAL_CANDIDATE_REVIEW_REPORT",
];
