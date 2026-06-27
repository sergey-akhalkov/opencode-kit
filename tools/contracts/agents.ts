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
  "## Leaf Contract",
  "No source/config/instruction edits",
  "Needs external reviewer",
  "## Feedback Ledger",
  "docs/feedbacks",
  "`complain`",
  "`Findings`: ordered by severity",
  "`Residual Risks`",
  "Actionable Continuation Items",
];

export const REUSABLE_REVIEWER_FORBIDDEN_BOILERPLATE: readonly RegExp[] = [
  /## Orchestration/,
  /Do not modify files\./,
];