type DateRange = { from: string | null; to: string | null };
type DeliveryContextEventKind = "message" | "session_input";
type DeliveryContextQuestionStatus = "replied" | "rejected";
type DeliveryContextTodoSource = "current" | "todowrite";

export type DeliveryContextWorkFrontierProjection = {
  assessment: {
    frontier: {
      acceptedOutcomeRef: string;
      basisHumanRef: string;
      frontierGeneration: number;
      gates: unknown[];
      items: unknown[];
      parkedDecisions: unknown[];
      progressFingerprint: string;
      schemaVersion: 1;
      taskStateDigest: string;
    };
    frontierState: "complete" | "product-decision" | "runnable" | "waiting";
    openGateRefs: string[];
    parkedDecisionRefs: string[];
    runnableItemRefs: string[];
  } | null;
  errorCode: string | null;
  status: "absent" | "invalid" | "present";
};

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

export type DeliveryContextClaimEvidence = {
  candidateId: string;
  changeRef: string;
  claimClass: "exact-case" | "finite-population" | "partitioned-domain" | "real-system-equivalence" | "compatibility-interchangeability" | "safety" | "phase-milestone";
  claimId: string;
  closureState: "supported" | "narrowed" | "blocked" | "unknown" | "stale";
  coverageBasis: "exact-case" | "finite-population" | "partitioned-domain";
  disposition: "supported" | "narrowed" | "blocked" | "unknown";
  environmentId: string;
  evidenceRefs: string[];
  independentChallenge: {
    evidenceRefs: string[];
    required: boolean;
    status: "complete" | "missing" | "unusable" | "not-required";
  };
  materialExclusions: string[];
  maximumSupportedClaim: string;
  observationBoundary: string;
  outcomeRef: string;
  paths: { baseline: string | null; candidate: string | null; production: string };
  population: {
    id: string;
    members: string[];
    requiredMembers: number;
    supportedMembers: number;
  };
  realOracle: {
    evidenceRefs: string[];
    required: boolean;
    status: "observed" | "unavailable" | "unknown" | "not-required";
  };
  statement: string;
  unresolvedObservations: Array<{ code: string; detail: string; path: string }>;
};

export type DeliveryContextClaimOmission = {
  changeRef: string | null;
  code:
    | "change-limit"
    | "claim-limit"
    | "evidence-index-invalid"
    | "evidence-index-malformed"
    | "evidence-index-missing"
    | "evidence-index-oversized";
  detail: string;
  omitted: number;
};

export type DeliveryContextClaimEvidenceProjection = {
  claims: DeliveryContextClaimEvidence[];
  complete: boolean;
  omissions: DeliveryContextClaimOmission[];
  selection: "all-active" | "explicit" | "none";
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
  answers: string[][];
  eventRef: string;
  questions: string[];
  requestRef: string | null;
  status: "answered" | "rejected" | "resolution-unknown";
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
  claimEvidence: DeliveryContextClaimEvidenceProjection;
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
      claimEvidence: number;
      claimOmissions: number;
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
  workFrontier: DeliveryContextWorkFrontierProjection;
};

export type ReadSessionDeliveryContextOptions = {
  claimEvidence?: DeliveryContextClaimEvidenceProjection;
  dataDirs?: string[];
  dbPaths?: string[];
  generatedAt?: string;
  projectRoot?: string;
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
    claimEvidence: options.claimEvidence ?? { claims: [], complete: true, omissions: [], selection: "none" },
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
    workFrontier: { assessment: null, errorCode: "missing-frontier", status: "absent" },
  };
}
