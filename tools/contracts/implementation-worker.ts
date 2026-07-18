export const IMPLEMENTATION_WORKER_FILE = "implementation-worker.md";

/** Scalar only: permission.bash = deny. Every nested bash rule is rejected. */
export const ALLOWED_IMPLEMENTATION_WORKER_BASH_RULES: ReadonlyMap<string, "deny" | "allow"> = new Map([
  ["permission.bash", "deny"],
]);

export const IMPLEMENTATION_WORKER_DENIED_PERMISSION_KEYS: readonly string[] = [
  "task",
  "question",
  "dream_team_*",
  "webfetch",
  "websearch",
  "todowrite",
  "external_directory",
  "lsp",
  "doom_loop",
];

export const IMPLEMENTATION_WORKER_REQUIRED_TEXT: readonly string[] = [
  "## Worker Contract",
  "one bounded production work slice",
  "Universal Task Briefing Contract",
  "Write scope",
  "Do not edit outside the exact production write scope",
  "Do not ask the user questions",
  "No commits",
  "smallest complete happy path",
  "Never create or modify automated tests",
  "proof procedure",
  "Blockers",
  "Residual Risks",
  "## Feedback Ledger",
  "docs/feedbacks",
  "`complain`",
  "IMPLEMENTATION_WORKER_REPORT",
];

/**
 * Same-slice continuation tokens for the implementation-worker prompt.
 * Bounded correction needs candidate reference/diff and reproducer, not dual identities.
 */
export const IMPLEMENTATION_WORKER_CONTINUATION_REQUIRED_TEXT: readonly string[] = [
  "## Same-Slice Continuation",
  "Only the main-session orchestrator may resume",
  "Never self-resume",
  "never nest agents",
  "create or resume specialist sessions",
  "complete continuation brief",
  "Candidate Reference",
  "reproducer",
  "explicit objective text",
  "explicit brief delta",
  "unchanged forbidden actions",
  "original exact production ownership/write scope",
  "role, objective, and original exact production ownership/write scope",
  "role, objective, ownership, or material scope",
  "prior Applicable Proof",
];

/** Tokens required in maintenance-route handoff wording. */
export const IMPLEMENTATION_WORKER_HANDOFF_FIELDS: readonly string[] = [
  "Universal Task Briefing Contract",
  "Acceptance Criteria",
  "Verification",
];

export const IMPLEMENTATION_WORKER_ROUTING_REQUIRED_TEXT: readonly string[] = [
  "implementation-worker",
  "production-only",
  "non-overlapping write scope",
  "Universal Task Briefing Contract",
  "sdet-quality-engineer",
];
