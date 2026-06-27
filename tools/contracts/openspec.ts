export const OPENSPEC_KNOWN_OPERATIONS: readonly string[] = [
  "propose",
  "apply",
  "task-update",
  "review",
  "acceptance",
  "archive",
  "post-archive",
  "prepush",
];

export const OPENSPEC_PREPUSH_OPERATIONS: ReadonlySet<string> = new Set(["prepush"]);

export const OPENSPEC_PROPOSAL_OPERATIONS: readonly string[] = [
  "propose",
  "apply",
  "review",
  "acceptance",
  "archive",
];

export const OPENSPEC_TASKS_OPERATIONS: readonly string[] = [
  "apply",
  "task-update",
  "review",
  "acceptance",
  "archive",
];

export const OPENSPEC_SPEC_DELTA_OPERATIONS: readonly string[] = [
  "propose",
  "apply",
];