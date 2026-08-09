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

export type DeliveryContextSyntheticMessage = DeliveryContextUserMessage & {
  provenance: "compaction" | "guard" | "opencode" | "pty" | "task";
  truncated: boolean;
};

export type DeliveryContextAssistantEvidence = {
  agent: string | null;
  error: string | null;
  eventRef: string;
  finish: string | null;
  modelRef: string;
  text: string;
  time: string | null;
  truncated: boolean;
};

export type DeliveryContextToolEvidence = {
  callRef: string;
  eventRef: string;
  output: string | null;
  status: string;
  time: string | null;
  title: string | null;
  tool: string;
  truncated: boolean;
};

export type DeliveryContextDiffEvidence = {
  eventRef: string;
  files: string[];
  patchRef: string;
  time: string | null;
};

export type DeliveryContextValidationEvidence = {
  callRef: string;
  command: string | null;
  eventRef: string;
  status: string;
  summary: string | null;
  time: string | null;
  truncated: boolean;
};

export type DeliveryContextDescendantEvidence = {
  agent: string | null;
  parentRef: string;
  resultConsumed: boolean | "unknown";
  sessionRef: string;
  status: "idle" | "running" | "unknown";
  updated: string | null;
};

export type DeliveryContextBackgroundEvidence = {
  agent: string | null;
  callRef: string;
  childRef: string | null;
  resultConsumed: boolean | "unknown";
  status: string;
};

export type DeliveryContextStrategyRef = {
  ref: string;
  source: "docs_fallback" | "openspec_history" | "session_metadata";
};

export type DeliveryContextAuditRef = {
  auditRef: string;
  childRef: string;
  status: string;
};

export type DeliveryContextTruncation = {
  limit: number;
  omitted: number;
  surface: string;
};

export type DeliveryContextQuestionReply = {
  answers: string[][];
  eventRef: string;
  questions: string[];
  requestRef: string | null;
  status: DeliveryContextQuestionStatus;
  time: string | null;
};

export type DeliveryContextQuestionIntervention = {
  actor: "guard" | "unknown";
  eventRef: string;
  questions: string[];
  requestRef: string | null;
  status: "rejected";
  time: string | null;
};

export type DeliveryContextPermissionReply = {
  eventRef: string;
  reply: string | null;
  requestRef: string | null;
  time: string | null;
};

export type SessionDeliveryContextResult = {
  assistantEvidence: DeliveryContextAssistantEvidence[];
  auditRefs: DeliveryContextAuditRef[];
  background: DeliveryContextBackgroundEvidence[];
  descendants: DeliveryContextDescendantEvidence[];
  diffEvidence: DeliveryContextDiffEvidence[];
  generatedAt: string;
  humanMessages: DeliveryContextUserMessage[];
  missingSessions: string[];
  permissionReplies: DeliveryContextPermissionReply[];
  questionInterventions: DeliveryContextQuestionIntervention[];
  questionReplies: DeliveryContextQuestionReply[];
  requirementSignals: Array<{
    eventRef: string;
    kind: string;
    messageRef: string;
    text: string;
    time: string | null;
  }>;
  schemaVersion: 2;
  session: {
    counts: {
      assistantEvidence: number;
      auditRefs: number;
      background: number;
      currentTodos: number;
      descendants: number;
      diffEvidence: number;
      everTodos: number;
      humanMessages: number;
      openTodos: number;
      permissionReplies: number;
      questionInterventions: number;
      questionReplies: number;
      requirementSignals: number;
      strategyRefs: number;
      syntheticMessages: number;
      todoToolCalls: number;
      todos: number;
      toolEvidence: number;
      truncationWarnings: number;
      unresolvedTodos: number;
      userMessages: number;
      validationEvidence: number;
    };
    dateRange: DateRange;
    sessionRef: string;
    sourceRef: string;
  } | null;
  resolvedFromSessionRef: string | null;
  strategyRefs: DeliveryContextStrategyRef[];
  syntheticMessages: DeliveryContextSyntheticMessage[];
  todos: {
    current: DeliveryContextTodo[];
    ever: DeliveryContextTodo[];
    history: DeliveryContextTodoHistory;
    open: DeliveryContextTodo[];
    unresolved: DeliveryContextTodo[];
  };
  tool: "opencode-session-delivery-context";
  toolEvidence: DeliveryContextToolEvidence[];
  truncationWarnings: DeliveryContextTruncation[];
  /** @deprecated Use humanMessages. Compatibility alias; never feeds requirement signals. */
  userMessages: DeliveryContextUserMessage[];
  validationEvidence: DeliveryContextValidationEvidence[];
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
    assistantEvidence: [],
    auditRefs: [],
    background: [],
    descendants: [],
    diffEvidence: [],
    generatedAt: options.generatedAt ?? new Date().toISOString(),
    humanMessages: [],
    missingSessions: [missingRef],
    permissionReplies: [],
    questionInterventions: [],
    questionReplies: [],
    requirementSignals: [],
    resolvedFromSessionRef: null,
    schemaVersion: 2,
    session: null,
    strategyRefs: [],
    syntheticMessages: [],
    todos: {
      current: [],
      ever: [],
      history: { available: false, source: "current_snapshot_only", toolCalls: 0 },
      open: [],
      unresolved: [],
    },
    tool: "opencode-session-delivery-context",
    toolEvidence: [],
    truncationWarnings: [],
    userMessages: [],
    validationEvidence: [],
    warnings,
  };
}
