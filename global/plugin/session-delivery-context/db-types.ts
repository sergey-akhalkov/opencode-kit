export type SessionRow = Record<string, unknown> & { id: unknown };
export type EventRow = Record<string, unknown> & { id: unknown };
export type DbSchema = Map<string, Set<string>>;
export type RequestedSessionSelection = {
  candidateRefs: Set<string>;
  missingRef: string;
  rawIds: Set<string>;
};
export type TodoEvidence = {
  content?: string;
  eventRef: string;
  millis: number | null;
  priority: string | null;
  source: "current" | "todowrite";
  status: string | null;
};
export type TodoAccumulator = {
  content?: string;
  eventRefs: string[];
  firstSeenMillis: number | null;
  identity: string;
  lastSeenMillis: number | null;
  priority: string | null;
  seenCount: number;
  source: "current" | "todowrite";
  status: string | null;
};
export type TodoHistoryEvidence = {
  history: { available: boolean; source: "current_snapshot_only" | "todowrite_parts"; toolCalls: number };
  todos: TodoEvidence[];
};
