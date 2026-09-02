import type { Session, TextPartInput } from "@opencode-ai/sdk/v2";
import type { SessionDeliveryContextResult } from "../../plugin/session-delivery-context/index.ts";
import type { WorkFrontier } from "./frontier.ts";
import type { TerminalCertificateState } from "./terminal-certificate.ts";

export type AuditWindowOptions = {
  closePassedAfterMs: number;
  enabled: boolean;
  mode: "read-only-monitor";
  scope: "per-root";
  terminal: "powershell-shell";
  validationError: string | null;
};

export type GuardOptions = {
  arbiterActiveLimit: number;
  arbiterPromptTimeoutMs: number;
  arbiterQueueLimit: number;
  auditWindow: AuditWindowOptions;
  arbiterAgent: string;
  certificateIssuers: string[];
  certificateWaitMs: number;
  enabled: boolean;
  initialDelayMs: number;
  maxCycles: number;
  maxDelayMs: number;
  maxRequestBytes: number;
  maxRetryAttempts: number;
  maxWaitRechecks: number;
  retainAuditSessions: number;
  retryMultiplier: number;
  settleMs: number;
  statusToasts: boolean;
  strategyFallback: string;
  waitRecheckMs: number;
};

export type AuditDiagnostics = {
  allowedRequestBytes: number;
  attempt: number;
  attemptLimit: number;
  endedAt: number | null;
  errorClass: string | null;
  requestBytes: number | null;
  retainedChildCount: number | null;
  startedAt: number | null;
};

export type RecoveryAudit = {
  attempt: number;
  auditID: string;
  childSessionID: string;
  inspectedRevision: string;
  kind: AuditKind;
};

export type GuardStateName =
  | "audit-retrying"
  | "auditing"
  | "continuation-pending"
  | "disabled"
  | "error"
  | "frontier-reconciling"
  | "owner-required"
  | "passed"
  | "paused"
  | "product-decision-required"
  | "question-auditing"
  | "question-answering"
  | "question-deferring"
  | "question-pending"
  | "running"
  | "settling-idle"
  | "stale"
  | "waiting"
  | "waiting-async";

export type RootPromptContext = {
  agent: string | null;
  model: { providerID: string; modelID: string } | null;
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

export type NormalizedQuestionOption = {
  description: string;
  label: string;
};

export type NormalizedQuestion = {
  custom: boolean;
  header: string;
  multiple: boolean;
  options: NormalizedQuestionOption[];
  question: string;
};

export type NormalizedQuestionRequest = {
  questions: NormalizedQuestion[];
  requestID: string;
  toolCallID: string | null;
};

export type AuditEpoch = {
  auditID: string;
  attempt: number;
  childSessionID: string | null;
  completionEvidence: SessionDeliveryContextResult | null;
  inspected: Revision;
  kind: AuditKind;
  questionRequest: NormalizedQuestionRequest | null;
  rootRef: string;
  rootSessionID: string;
};

export type RequirementVerdict = {
  evidenceRefs: string[];
  requirementRef: string;
  status: "complete" | "deferred" | "product_decision_required" | "unresolved";
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
  affectedItemRefs: string[];
  consequences: string[];
  decision: string;
  evidenceRefs: string[];
  resumeCondition: string;
};

export type CompletionVerdict = {
  auditID: string;
  confidence: "high" | "low" | "medium";
  deferredGateRefs: string[];
  evidenceGaps: string[];
  evidenceRefs: string[];
  frontierGeneration: number;
  goalSummary: string;
  inspectedRevision: string;
  ownerBoundary: OwnerBoundaryVerdict | null;
  parkedDecisionRefs: string[];
  questionAction: "answer" | "defer" | "present-product-decision" | null;
  questionAnswers: string[][] | null;
  requirementMatrix: RequirementVerdict[];
  resumeCondition: string | null;
  rootSessionRef: string;
  runnableItemRefs: string[];
  schemaVersion: 2;
  selectedItemRef: string | null;
  strategyAssessment: StrategyAssessment;
  unresolved: UnresolvedVerdict[];
  verdict: "allow_stop" | "continue" | "product_decision_required" | "user_paused" | "waiting";
  waitKind: "budget" | "capability" | "external" | "live-attempt" | "process" | "safety" | "technical" | "writer-liveness" | null;
};

export type QuestionDeferralProvenance = {
  blockerKind: "gate" | "parked-decision";
  blockerRef: string;
  callRef: string | null;
  disposition: "continue" | "waiting";
  requestRef: string;
  selectedItemRef: string | null;
};

export type QuestionState = {
  auditID: string | null;
  deferredVerdict: CompletionVerdict | null;
  replyObserved: boolean;
  request: NormalizedQuestionRequest;
  state: "guard-answered" | "guard-answering" | "guard-deferred" | "guard-deferring" | "human-replied" | "open" | "owner-required" | "product-decision-required" | "resolution-unknown";
};

export type RootState = {
  activeAudit: AuditEpoch | null;
  auditDiagnostics: AuditDiagnostics;
  auditChildSessionID: string | null;
  auditAbort: AbortController | null;
  autonomousQuestionCalls: Map<string, string>;
  autonomousQuestionRefs: Set<string>;
  compacting: boolean;
  continuationCycles: number;
  controlTurnPending: boolean;
  deferredQuestionProvenance: Map<string, QuestionDeferralProvenance>;
  grindEnabled: boolean;
  guardTurnPending: boolean;
  frontierError: string | null;
  frontierReconciliationAttempts?: number;
  frontierReconciliationRef: string | null;
  frontierStatus: "absent" | "current" | "invalid" | "stale" | "unverified";
  lastAssistantID: string | null;
  lastAuditedRevision: string | null;
  lastHumanID: string | null;
  lastProgressFingerprint: string | null;
  lastStatusKey: string | null;
  lastStrategyFingerprint: string | null;
  paused: boolean;
  pendingAutonomousQuestionCalls: Map<string, string>;
  pendingAutonomousQuestionRefs: Set<string>;
  pendingQuestionDeferralProvenance: Map<string, QuestionDeferralProvenance>;
  promptContext: RootPromptContext;
  questions: Map<string, QuestionState>;
  recoveryAudit: RecoveryAudit | null;
  restartRecoveryAction: string | null;
  retryTimer: ReturnType<typeof setTimeout> | null;
  root: Session;
  settleTimer: ReturnType<typeof setTimeout> | null;
  state: GuardStateName;
  statusMessage: string | null;
  terminalCertificate: TerminalCertificateState;
  terminalDiagnosticStages: Set<string>;
  waitReason: string | null;
  waitRecheckCount: number;
  waitRecheckTimer: ReturnType<typeof setTimeout> | null;
  workFrontier: WorkFrontier | null;
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
  fallbackSent: boolean;
  resultConsumed: boolean;
  rootSessionID: string;
  status: "completed" | "error" | "running" | "unknown";
};
