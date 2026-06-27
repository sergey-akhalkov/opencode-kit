type DateRange = { from: string | null; to: string | null };
type DeliveryContextEventKind = "message" | "session_input";
type DeliveryContextQuestionStatus = "replied" | "rejected";
type DeliveryContextTodoSource = "current" | "todowrite";

export type DeliveryContextTodo = {
  content?: string;
  eventRef: string;
  firstSeen: string | null;
  lastSeen: string | null;
  priority: string | null;
  seenCount: number;
  source: DeliveryContextTodoSource;
  status: string | null;
  time: string | null;
};

export type DeliveryContextTodoHistory = {
  available: boolean;
  source: "current_snapshot_only" | "todowrite_parts";
  toolCalls: number;
};

export type DeliveryContextUserMessage = {
  eventRef: string;
  kind: DeliveryContextEventKind;
  text: string;
  time: string | null;
};

export type DeliveryContextQuestionReply = {
  answers: string[][];
  eventRef: string;
  questions: string[];
  requestRef: string | null;
  status: DeliveryContextQuestionStatus;
  time: string | null;
};

export type DeliveryContextPermissionReply = {
  eventRef: string;
  reply: string | null;
  requestRef: string | null;
  time: string | null;
};

export type SessionDeliveryContextResult = {
  generatedAt: string;
  missingSessions: string[];
  permissionReplies: DeliveryContextPermissionReply[];
  questionReplies: DeliveryContextQuestionReply[];
  requirementSignals: Array<{
    eventRef: string;
    kind: string;
    messageRef: string;
    text: string;
    time: string | null;
  }>;
  session: {
    counts: {
      currentTodos: number;
      everTodos: number;
      openTodos: number;
      permissionReplies: number;
      questionReplies: number;
      requirementSignals: number;
      todoToolCalls: number;
      todos: number;
      unresolvedTodos: number;
      userMessages: number;
    };
    dateRange: DateRange;
    sessionRef: string;
    sourceRef: string;
  } | null;
  resolvedFromSessionRef: string | null;
  todos: {
    current: DeliveryContextTodo[];
    ever: DeliveryContextTodo[];
    history: DeliveryContextTodoHistory;
    open: DeliveryContextTodo[];
    unresolved: DeliveryContextTodo[];
  };
  tool: "opencode-session-delivery-context";
  userMessages: DeliveryContextUserMessage[];
  warnings: string[];
};

export type ReadSessionDeliveryContextOptions = {
  dataDirs?: string[];
  dbPaths?: string[];
  generatedAt?: string;
  resolveRoot?: boolean;
  sessionId: string;
  useDefaultPaths?: boolean;
};

export function isoTime(value: number | null): string | null {
  if (value == null) {
    return null;
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export function makeDateRange(values: Array<number | null>): DateRange {
  const concrete = values.filter(
    (value): value is number => value != null && Number.isFinite(value),
  );
  if (concrete.length === 0) {
    return { from: null, to: null };
  }
  return { from: isoTime(Math.min(...concrete)), to: isoTime(Math.max(...concrete)) };
}

export function emptyResult(
  options: ReadSessionDeliveryContextOptions,
  missingRef: string,
  warnings: string[],
): SessionDeliveryContextResult {
  return {
    generatedAt: options.generatedAt ?? new Date().toISOString(),
    missingSessions: [missingRef],
    permissionReplies: [],
    questionReplies: [],
    requirementSignals: [],
    resolvedFromSessionRef: null,
    session: null,
    todos: {
      current: [],
      ever: [],
      history: { available: false, source: "current_snapshot_only", toolCalls: 0 },
      open: [],
      unresolved: [],
    },
    tool: "opencode-session-delivery-context",
    userMessages: [],
    warnings,
  };
}
