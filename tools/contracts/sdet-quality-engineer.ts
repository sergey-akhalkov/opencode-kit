export const SDET_QUALITY_ENGINEER_FILE = "sdet-quality-engineer.md";

/** Scalar only: permission.bash = deny. Nested bash rules are rejected. */
export const ALLOWED_SDET_QUALITY_ENGINEER_BASH_RULES: ReadonlyMap<string, "deny" | "allow"> = new Map([
  ["permission.bash", "deny"],
]);

/** Scalar only: every SDET edit requires runtime approval for the supplied test-only scope. */
export const ALLOWED_SDET_QUALITY_ENGINEER_EDIT_RULES: ReadonlyMap<string, "deny" | "ask" | "allow"> = new Map([
  ["permission.edit", "ask"],
]);

export const SDET_QUALITY_ENGINEER_DENIED_PERMISSION_KEYS: readonly string[] = [
  "task",
  "question",
  "skill",
  "webfetch",
  "websearch",
  "todowrite",
  "external_directory",
  "lsp",
  "doom_loop",
];

/**
 * Deterministic required substrings for the SDET agent body.
 * Critical-only report action; exact model; smallest critical test-only scope.
 */
export const SDET_QUALITY_ENGINEER_REQUIRED_TEXT: readonly string[] = [
  "fresh-context",
  "test-only write scope",
  "co-located",
  "critical business-logic incidents",
  "Critical Risk Matrix",
  "Prefer the real candidate boundary",
  "black-box",
  "mock confidence gap",
  "blocked",
  "Never edit or repair production",
  "Every edit requires runtime approval",
  "smallest test artifact",
  "Execution Request",
  "raw output",
  "SDET_QUALITY_REPORT",
  "Action: critical-risks-reported | no-critical-risk | blocked",
  "Candidate Reference",
  "Effective Model:",
  "Risk ID",
  "Incident Consequence",
  "Reachability And Envelope",
  "Raw Evidence",
  "Reproduction Procedure",
  "Test Evidence",
  "Test Changes",
  "Evidence Gaps And Residual Risks",
  "never authorizes production work",
];
