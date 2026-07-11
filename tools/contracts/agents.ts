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
  "instructions/leaf-reviewer-agent-contract.md",
  "`Findings`: ordered by severity",
  "`Residual Risks`",
  "Actionable Continuation Items",
];

export const REUSABLE_REVIEWER_FORBIDDEN_BOILERPLATE: readonly RegExp[] = [
  /## Orchestration/,
  /Do not modify files\./,
];

export const REUSABLE_REVIEWER_FORBIDDEN_INLINE_BLOCKS: readonly RegExp[] = [
  /^## Leaf Contract(\r?\n|$)/m,
  /^## Prevention Feedback(\r?\n|$)/m,
];
