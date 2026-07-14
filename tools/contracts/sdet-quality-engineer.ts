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
 * Covers fresh context, test-only/co-located safety, risk/oracle matrix,
 * real boundaries/mock exceptions, action enum, provisional/final same-context
 * handshake with input/current identity fields and Identity Recipe,
 * pending recapture rules, no production fix, no self-approval, no
 * commands/external actions, and report-only SDET_QUALITY_REPORT fields.
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
  "provisional",
  "final",
  "same SDET context",
  "Never fix production",
  "Never self-approve",
  "run shell",
  "SDET_QUALITY_REPORT",
  "Phase: provisional | final",
  "Action: authored-tests | assessed-existing-tests | blocked",
  "Input Semantic Candidate Identity",
  "Input Package Identity",
  "Semantic Candidate Identity",
  "Package Identity",
  "Identity Recipe",
  "pending orchestrator recapture after test edits",
  "Qualification gates bind to Semantic Candidate Identity",
  "distinct effective model",
  "same-model correlation risk",
  "Effective Model:",
  "Model Independence:",
  "Risk And Oracle Matrix",
  "Test Changes Or Existing Evidence",
  "Requested Validation Procedures",
  "Validation Outcomes Received",
  "Blockers",
  "Residual Risks",
  "Actionable Continuation Items",
];
