import type { Session, TextPartInput } from "@opencode-ai/sdk/v2";
import type { SessionDeliveryContextResult } from "../../plugin/session-delivery-context/index.ts";

export type AuditWindowOptions = {
  closePassedAfterMs: number;
  enabled: boolean;
  mode: "read-only-monitor";
  scope: "per-root";
  terminal: "powershell-shell";
  validationError: string | null;
};

export type GuardOptions = {
  auditWindow: AuditWindowOptions;
  arbiterAgent: string;
  enabled: boolean;
  initialDelayMs: number;
  maxCycles: number;
  maxDelayMs: number;
  retainAuditSessions: number;
  retryMultiplier: number;
  settleMs: number;
  statusToasts: boolean;
  strategyFallback: string;
};

export type GuardStateName =
  | "audit-retrying"
  | "auditing"
  | "continuation-pending"
  | "disabled"
  | "error"
  | "owner-required"
  | "passed"
  | "paused"
  | "question-auditing"
  | "question-pending"
  | "running"
  | "settling-idle"
  | "stale"
  | "waiting-async";

export type RootPromptContext = {
  agent: string | null;
  model: { providerID: string; modelID: string } | null;
  tools: Record<string, boolean> | null;
  variant: string | null;
};

export type Revision = {
  assistantRef: string;
  diffDigest: string;
  humanRef: string;
  journalDigest: string;
  leaseGeneration: number;
  revisionDigest: string;
  todoDigest: string;
};

export type AuditKind = "completion" | "question";

export type AuditEpoch = {
  auditID: string;
  attempt: number;
  childSessionID: string | null;
  completionEvidence: SessionDeliveryContextResult | null;
  inspected: Revision;
  kind: AuditKind;
  questionRequestID: string | null;
  rootRef: string;
  rootSessionID: string;
};

export type RequirementVerdict = {
  evidenceRefs: string[];
  requirementRef: string;
  status: "complete" | "deferred" | "owner_required" | "unresolved";
};

export type UnresolvedVerdict = {
  evidenceGap: string;
  nextAction: string;
  nextEvidence: string;
  requirementRef: string;
  stopCondition: string;
};

export type StrategyAssessment = {
  fingerprint: string;
  prohibitedStrategies: string[];
  repeated: boolean;
  requiredRetryEvidence: string[];
};

export type OwnerBoundaryVerdict = {
  decision: string;
  evidenceRefs: string[];
  reason: string;
};

export type CompletionVerdict = {
  auditID: string;
  confidence: "high" | "low" | "medium";
  evidenceGaps: string[];
  evidenceRefs: string[];
  goalSummary: string;
  inspectedRevision: string;
  ownerBoundary: OwnerBoundaryVerdict | null;
  requirementMatrix: RequirementVerdict[];
  rootSessionRef: string;
  schemaVersion: 1;
  strategyAssessment: StrategyAssessment;
  unresolved: UnresolvedVerdict[];
  verdict: "allow_stop" | "continue" | "owner_required" | "user_paused";
};

export type QuestionState = {
  auditID: string | null;
  requestID: string;
  state: "guard-rejected" | "guard-rejecting" | "human-replied" | "open" | "owner-required";
};

export type RootState = {
  activeAudit: AuditEpoch | null;
  auditChildSessionID: string | null;
  auditAbort: AbortController | null;
  compacting: boolean;
  continuationCycles: number;
  controlTurnPending: boolean;
  grindEnabled: boolean;
  guardTurnPending: boolean;
  lastAssistantID: string | null;
  lastAuditedRevision: string | null;
  lastHumanID: string | null;
  lastStatusKey: string | null;
  lastStrategyFingerprint: string | null;
  paused: boolean;
  pendingQuestionCorrection: string | null;
  promptContext: RootPromptContext;
  questionCorrectionAbort: AbortController | null;
  questions: Map<string, QuestionState>;
  retryTimer: ReturnType<typeof setTimeout> | null;
  root: Session;
  settleTimer: ReturnType<typeof setTimeout> | null;
  state: GuardStateName;
  statusMessage: string | null;
};

export type GuardContinuation = {
  context: RootPromptContext;
  part: TextPartInput;
};

export type PreflightResult =
  | { kind: "clear"; generation: number }
  | { kind: "waiting"; reason: string; generation: number }
  | { kind: "unknown"; reason: string; generation: number };

export type PtyLease = {
  awaited: boolean;
  fallbackSent: boolean;
  notificationConsumed: boolean;
  ptyID: string;
  rootSessionID: string;
  runtimeGeneration: number;
  spawnCallID: string;
  status: "exited" | "killed" | "killing" | "running" | "unknown";
  terminalAt: number | null;
};

export type TaskLease = {
  callID: string;
  childSessionID: string | null;
  resultConsumed: boolean;
  rootSessionID: string;
  status: "completed" | "error" | "running" | "unknown";
};
