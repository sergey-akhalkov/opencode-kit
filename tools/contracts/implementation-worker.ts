export const IMPLEMENTATION_WORKER_FILE = "implementation-worker.md";

export const ALLOWED_IMPLEMENTATION_WORKER_BASH_RULES: ReadonlyMap<string, "deny" | "allow"> = new Map([
  ["permission.bash.*", "deny"],
  ["permission.bash.git status*", "allow"],
  ["permission.bash.git diff*", "allow"],
  ["permission.bash.npm test*", "allow"],
  ["permission.bash.npm run test*", "allow"],
  ["permission.bash.npm run validate*", "allow"],
  ["permission.bash.npm run lint*", "allow"],
  ["permission.bash.npm run typecheck*", "allow"],
  ["permission.bash.node tools/test-*.ts", "allow"],
  ["permission.bash.cargo test*", "allow"],
  ["permission.bash.cargo check*", "allow"],
  ["permission.bash.cargo clippy*", "allow"],
  ["permission.bash.go test*", "allow"],
  ["permission.bash.dotnet test*", "allow"],
]);

export const IMPLEMENTATION_WORKER_DENIED_PERMISSION_KEYS: readonly string[] = [
  "task",
  "question",
  "webfetch",
  "websearch",
  "todowrite",
  "external_directory",
  "lsp",
  "doom_loop",
];

export const IMPLEMENTATION_WORKER_REQUIRED_TEXT: readonly string[] = [
  "## Worker Contract",
  "one bounded work slice",
  "Write scope",
  "Do not edit outside write scope",
  "Do not ask the user questions",
  "No commits",
  "TDD/test-first",
  "main-session validation gate",
  "## Feedback Ledger",
  "docs/feedbacks",
  "`complain`",
  "IMPLEMENTATION_WORKER_REPORT",
  "Run:",
  "Worker:",
];

export const IMPLEMENTATION_WORKER_HANDOFF_FIELDS: readonly string[] = [
  "Mission",
  "Read scope",
  "Write scope",
  "Forbidden",
  "Verification",
  "acceptance criteria",
];

export const IMPLEMENTATION_WORKER_ROUTING_REQUIRED_TEXT: readonly string[] = [
  "implementation-worker",
  "non-overlapping write scope",
  "clear acceptance criteria",
  "focused validation gate",
];