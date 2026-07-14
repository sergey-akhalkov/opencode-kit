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
  "Actionable Continuation Items",
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
 * Covers no-model policy text is validated separately via frontmatter;
 * body covers fresh/read-only/post-SDET/post-validation, complete candidate inputs,
 * exact verdict enum, dual candidate identity fields, findings, artifact owner, blockers,
 * residual risks, continuation items, and provenance-only external reference.
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
  "approved | approved_with_notes | changes_requested | blocked",
  "Semantic Candidate Identity",
  "Package Identity",
  "Identity Recipe",
  "Qualification gates bind to Semantic Candidate Identity",
  "Missing, incomplete, or unreproducible Identity Recipe blocks",
  "post-test Applicable Proof",
  "missing post-test Applicable Proof replay",
  "Findings",
  "Evidence Type",
  "Likely Root Cause",
  "Artifact Owner",
  "Recommendation",
  "Confidence",
  "Needs external reviewer",
  "Blockers",
  "Residual Risks",
  "Actionable Continuation Items",
  "validation provenance only",
  "directly readable",
  "FINAL_CANDIDATE_REVIEW_REPORT",
];
