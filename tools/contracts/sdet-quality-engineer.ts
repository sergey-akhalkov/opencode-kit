export const SDET_QUALITY_ENGINEER_FILE = "sdet-quality-engineer.md";

/** Scalar only: permission.bash = deny. Nested bash rules are rejected. */
export const ALLOWED_SDET_QUALITY_ENGINEER_BASH_RULES: ReadonlyMap<string, "deny" | "allow"> = new Map([
  ["permission.bash", "deny"],
]);

/** Scalar only: permission.edit = allow. Nested edit rules are rejected. */
export const ALLOWED_SDET_QUALITY_ENGINEER_EDIT_RULES: ReadonlyMap<string, "deny" | "allow"> = new Map([
  ["permission.edit", "allow"],
]);

export const SDET_QUALITY_ENGINEER_DENIED_PERMISSION_KEYS: readonly string[] = [
  "task",
  "question",
  "dream_team_*",
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
 * Single report action; optional project-native Candidate Reference; no dual-identity handshake.
 */
export const SDET_QUALITY_ENGINEER_REQUIRED_TEXT: readonly string[] = [
  "fresh context",
  "test-only write scope",
  "co-located",
  "risk/oracle matrix",
  "Prefer real boundaries",
  "mock",
  "authored-tests",
  "assessed-existing-tests",
  "blocked",
  "Never fix production",
  "Never self-approve",
  "run shell",
  "SDET_QUALITY_REPORT",
  "Action: authored-tests | assessed-existing-tests | blocked",
  "Candidate Reference",
  "distinct effective model",
  "same-model correlation risk",
  "Effective Model:",
  "Model Independence:",
  "Risk And Oracle Matrix",
  "Test Changes Or Existing Evidence",
  "Requested Validation Procedures",
  "Blockers",
  "Residual Risks",
  "Actionable Continuation Items",
];
