import crypto from "node:crypto";
import type { Session } from "@opencode-ai/sdk/v2";
import { hashRef, sanitizeText } from "../../plugin/session-delivery-context/redaction.ts";
import { projectPersistedWorkFrontier } from "./frontier.ts";
import type { AuditWindowOptions, GuardOptions, QuestionDeferralProvenance, RootPromptContext, RootState } from "./types.ts";

export type ArbiterRoute = {
  model: { providerID: string; modelID: string };
  variant: string | null;
};

export type SafeErrorDetails = {
  cause?: Omit<SafeErrorDetails, "cause">;
  message?: string;
  name: string;
  stack?: string;
};

const DEFAULT_OPTIONS: GuardOptions = {
  arbiterActiveLimit: 2,
  arbiterPromptTimeoutMs: 120_000,
  arbiterQueueLimit: 32,
  auditWindow: {
    closePassedAfterMs: 15_000,
    enabled: false,
    mode: "read-only-monitor",
    scope: "per-root",
    terminal: "powershell-shell",
    validationError: null,
  },
  arbiterAgent: "session-completion-arbiter",
  certificateIssuers: [],
  certificateWaitMs: 5_000,
  enabled: true,
  initialDelayMs: 2_000,
  maxCycles: 100,
  maxDelayMs: 60_000,
  maxRequestBytes: 200_000,
  maxRetryAttempts: 3,
  maxWaitRechecks: 30,
  retainAuditSessions: 2,
  retryMultiplier: 2,
  settleMs: 750,
  statusToasts: true,
  strategyFallback: "docs/session-strategy-history",
  waitRecheckMs: 2_000,
};

function parseAuditWindowOptions(value: unknown): AuditWindowOptions {
  const input = record(value);
  if (input == null) return DEFAULT_OPTIONS.auditWindow;
  const mode = input.mode ?? DEFAULT_OPTIONS.auditWindow.mode;
  const scope = input.scope ?? DEFAULT_OPTIONS.auditWindow.scope;
  const terminal = input.terminal ?? DEFAULT_OPTIONS.auditWindow.terminal;
  const closePassedAfterMs = boundedInteger(
    input.closePassedAfterMs,
    DEFAULT_OPTIONS.auditWindow.closePassedAfterMs,
    0,
  );
  const invalid = [
    mode === "read-only-monitor" ? null : "mode",
    scope === "per-root" ? null : "scope",
    terminal === "powershell-shell" ? null : "terminal",
    input.closePassedAfterMs == null || closePassedAfterMs === input.closePassedAfterMs ? null : "closePassedAfterMs",
  ].filter((field): field is string => field != null);
  return {
    closePassedAfterMs,
    enabled: input.enabled === true && invalid.length === 0,
    mode: "read-only-monitor",
    scope: "per-root",
    terminal: "powershell-shell",
    validationError: invalid.length === 0 ? null : `unsupported auditWindow option(s): ${invalid.join(", ")}`,
  };
}

export function record(value: unknown): Record<string, unknown> | null {
  return value != null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

export function stringValue(value: unknown): string | null {
  return typeof value === "string" && value !== "" ? value : null;
}

export function configuredPermissionClass(value: unknown): "allow" | "ask" | "deny" | "mixed" | "unspecified" {
  if (value === "allow" || value === "ask" || value === "deny") return value;
  const rules = record(value);
  if (rules == null) return "unspecified";
  const actions = new Set<"allow" | "ask" | "deny">();
  const add = (candidate: unknown): void => {
    if (candidate === "allow" || candidate === "ask" || candidate === "deny") actions.add(candidate);
  };
  for (const rule of Object.values(rules)) {
    add(rule);
    const patterns = record(rule);
    if (patterns != null) Object.values(patterns).forEach(add);
  }
  return actions.size === 0 ? "unspecified" : actions.size === 1 ? [...actions][0] : "mixed";
}

export function stableDigest(value: unknown): string {
  return crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

function boundedInteger(value: unknown, fallback: number, minimum: number): number {
  return typeof value === "number" && Number.isInteger(value) && value >= minimum ? value : fallback;
}

export function parseGuardOptions(value: Record<string, unknown>): GuardOptions {
  const maxCycles = value.maxCycles === -1 ? -1 : boundedInteger(value.maxCycles, DEFAULT_OPTIONS.maxCycles, 1);
  const retainAuditSessions = value.retainAuditSessions === -1
    ? -1
    : boundedInteger(value.retainAuditSessions, DEFAULT_OPTIONS.retainAuditSessions, 1);
  const retryMultiplier = typeof value.retryMultiplier === "number" && value.retryMultiplier >= 1
    ? value.retryMultiplier
    : DEFAULT_OPTIONS.retryMultiplier;
  return {
    arbiterActiveLimit: boundedInteger(value.arbiterActiveLimit, DEFAULT_OPTIONS.arbiterActiveLimit, 1),
    arbiterPromptTimeoutMs: boundedInteger(value.arbiterPromptTimeoutMs, DEFAULT_OPTIONS.arbiterPromptTimeoutMs, 1),
    arbiterQueueLimit: boundedInteger(value.arbiterQueueLimit, DEFAULT_OPTIONS.arbiterQueueLimit, 1),
    auditWindow: parseAuditWindowOptions(value.auditWindow),
    arbiterAgent: stringValue(value.arbiterAgent) ?? DEFAULT_OPTIONS.arbiterAgent,
    certificateIssuers: Array.isArray(value.certificateIssuers)
      ? [...new Set(value.certificateIssuers.filter((item): item is string => typeof item === "string" && item !== ""))].sort().slice(0, 16)
      : DEFAULT_OPTIONS.certificateIssuers,
    certificateWaitMs: boundedInteger(value.certificateWaitMs, DEFAULT_OPTIONS.certificateWaitMs, 0),
    enabled: value.enabled !== false,
    initialDelayMs: boundedInteger(value.initialDelayMs, DEFAULT_OPTIONS.initialDelayMs, 1),
    maxCycles,
    maxDelayMs: boundedInteger(value.maxDelayMs, DEFAULT_OPTIONS.maxDelayMs, 1),
    maxRequestBytes: boundedInteger(value.maxRequestBytes, DEFAULT_OPTIONS.maxRequestBytes, 1),
    maxRetryAttempts: boundedInteger(value.maxRetryAttempts, DEFAULT_OPTIONS.maxRetryAttempts, 1),
    maxWaitRechecks: boundedInteger(value.maxWaitRechecks, DEFAULT_OPTIONS.maxWaitRechecks, 1),
    retainAuditSessions,
    retryMultiplier,
    settleMs: boundedInteger(value.settleMs, DEFAULT_OPTIONS.settleMs, 0),
    statusToasts: value.statusToasts !== false,
    strategyFallback: stringValue(value.strategyFallback) ?? DEFAULT_OPTIONS.strategyFallback,
    waitRecheckMs: boundedInteger(value.waitRecheckMs, DEFAULT_OPTIONS.waitRecheckMs, 1),
  };
}

export async function dataOf<T>(request: Promise<unknown>, label: string): Promise<T> {
  const response = await request as { data?: T; error?: unknown };
  if (response.error != null) {
    const error = new Error(`${label} failed`) as Error & { cause?: unknown };
    error.cause = response.error;
    throw error;
  }
  if (!("data" in response)) throw new Error(`${label} returned no data`);
  return response.data as T;
}

export async function ensureNoError(request: Promise<unknown>, label: string): Promise<void> {
  const response = await request as { error?: unknown };
  if (response.error != null) {
    const error = new Error(`${label} failed`) as Error & { cause?: unknown };
    error.cause = response.error;
    throw error;
  }
}

function errorDetails(error: unknown, includeStack: boolean): SafeErrorDetails {
  const input = record(error);
  const cause = error instanceof Error ? (error as Error & { cause?: unknown }).cause : input?.cause;
  return {
    name: error instanceof Error
      ? error.name
      : stringValue(input?._tag) ?? stringValue(input?.name) ?? "UnknownError",
    ...(stringValue(error instanceof Error ? error.message : input?.message) == null
      ? {}
      : { message: stringValue(error instanceof Error ? error.message : input?.message)!.slice(0, 2_000) }),
    ...(!includeStack || stringValue(error instanceof Error ? error.stack : input?.stack) == null
      ? {}
      : { stack: stringValue(error instanceof Error ? error.stack : input?.stack)!.slice(0, 4_000) }),
    ...(cause == null ? {} : { cause: errorDetails(cause, false) }),
  };
}

export function safeError(error: unknown, rawSessionID = ""): SafeErrorDetails {
  const sanitize = (value: string | undefined): string | undefined =>
    value == null ? undefined : sanitizeText(value, rawSessionID);
  const details = errorDetails(error, true);
  return {
    name: details.name,
    ...(details.message == null ? {} : { message: sanitize(details.message) }),
    ...(details.stack == null ? {} : { stack: sanitize(details.stack) }),
    ...(details.cause == null ? {} : {
      cause: {
        name: details.cause.name,
        ...(details.cause.message == null ? {} : { message: sanitize(details.cause.message) }),
        ...(details.cause.stack == null ? {} : { stack: sanitize(details.cause.stack) }),
      },
    }),
  };
}

export function hasErrorName(error: unknown, expected: string): boolean {
  const input = record(error);
  const name = error instanceof Error
    ? error.name
    : stringValue(input?._tag) ?? stringValue(input?.name);
  if (name === expected) return true;
  const cause = error instanceof Error ? (error as Error & { cause?: unknown }).cause : input?.cause;
  return cause != null && hasErrorName(cause, expected);
}

export function extractArbiterRoute(
  response: { data: Array<Record<string, unknown>> },
  arbiterAgent: string,
): ArbiterRoute {
  const arbiter = response.data.find((agent) => agent.id === arbiterAgent);
  const model = record(arbiter?.model);
  const providerID = stringValue(model?.providerID);
  const modelID = stringValue(model?.id);
  if (arbiter == null || arbiter.hidden !== true || providerID == null || modelID == null) {
    throw new Error("Configured hidden completion arbiter route is unavailable");
  }
  return { model: { providerID, modelID }, variant: stringValue(model?.variant) };
}

export function messagePartsText(parts: unknown[]): string[] {
  return parts.flatMap((value) => {
    const part = record(value);
    return part?.type === "text" && typeof part.text === "string" ? [part.text] : [];
  });
}

export function createAuditID(rootSessionID: string, revision: string, kind: string): string {
  return hashRef("audit", `${rootSessionID}:${revision}:${kind}:${Date.now()}`);
}

export function restoredPromptContext(root: Session, context: RootPromptContext): RootPromptContext {
  if (context.agent != null || context.model != null) return context;
  return {
    agent: root.agent ?? null,
    model: root.model == null ? null : { providerID: root.model.providerID, modelID: root.model.id },
    variant: root.model?.variant ?? null,
  };
}

export function initialRootState(root: Session): RootState {
  const metadata = record(root.metadata?.completionGuard);
  const auditDiagnostics = record(metadata?.auditDiagnostics);
  const grindEnabled = metadata?.grindEnabled === true;
  const paused = metadata?.paused === true;
  const persistedFrontier = projectPersistedWorkFrontier(root.metadata);
  const workFrontier = persistedFrontier.assessment?.frontier ?? null;
  const frontierStatus = persistedFrontier.status === "invalid"
    ? "invalid" as const
    : persistedFrontier.status === "present"
      ? "unverified" as const
      : "absent" as const;
  const questionRefs = (value: unknown): Set<string> => new Set(
    Array.isArray(value)
      ? value.filter((item): item is string => typeof item === "string" && /^question_[A-Za-z0-9_-]+$/.test(item)).slice(0, 1_024)
      : [],
  );
  const questionCalls = (value: unknown): Map<string, string> => new Map(
    Array.isArray(value)
      ? value.flatMap((item) => {
          const entry = record(item);
          return typeof entry?.requestRef === "string" && /^question_[A-Za-z0-9_-]+$/.test(entry.requestRef) &&
              typeof entry.callRef === "string" && /^call_[A-Za-z0-9_-]+$/.test(entry.callRef)
            ? [[entry.requestRef, entry.callRef] as const]
            : [];
        }).slice(0, 1_024)
      : [],
  );
  const questionDeferrals = (value: unknown): Map<string, QuestionDeferralProvenance> => new Map(
    Array.isArray(value)
      ? value.flatMap((item) => {
          const entry = record(item);
          const requestRef = stringValue(entry?.requestRef);
          const blockerRef = stringValue(entry?.blockerRef);
          const blockerKind = entry?.blockerKind === "gate" || entry?.blockerKind === "parked-decision"
            ? entry.blockerKind
            : null;
          const disposition = entry?.disposition === "continue" || entry?.disposition === "waiting"
            ? entry.disposition
            : null;
          const callRef = entry?.callRef === null ? null : stringValue(entry?.callRef);
          const selectedItemRef = entry?.selectedItemRef === null ? null : stringValue(entry?.selectedItemRef);
          return requestRef != null && /^question_[A-Za-z0-9_-]+$/.test(requestRef) &&
              blockerRef != null && blockerRef.length <= 128 && blockerKind != null && disposition != null &&
              (callRef == null || /^call_[A-Za-z0-9_-]+$/.test(callRef)) &&
              (selectedItemRef == null || selectedItemRef.length <= 128)
            ? [[requestRef, { blockerKind, blockerRef, callRef, disposition, requestRef, selectedItemRef }] as const]
            : [];
        }).slice(0, 1_024)
      : [],
  );
  const deferredQuestionProvenance = questionDeferrals(metadata?.deferredQuestionProvenance);
  const pendingQuestionDeferralProvenance = questionDeferrals(metadata?.pendingQuestionDeferralProvenance);
  return {
    activeAudit: null,
    auditDiagnostics: {
      allowedRequestBytes: boundedInteger(auditDiagnostics?.allowedRequestBytes, DEFAULT_OPTIONS.maxRequestBytes, 1),
      attempt: boundedInteger(auditDiagnostics?.attempt, 0, 0),
      attemptLimit: boundedInteger(auditDiagnostics?.attemptLimit, DEFAULT_OPTIONS.maxRetryAttempts, 1),
      endedAt: typeof auditDiagnostics?.endedAt === "number" ? auditDiagnostics.endedAt : null,
      errorClass: stringValue(auditDiagnostics?.errorClass),
      requestBytes: typeof auditDiagnostics?.requestBytes === "number" ? auditDiagnostics.requestBytes : null,
      retainedChildCount: typeof auditDiagnostics?.retainedChildCount === "number"
        ? auditDiagnostics.retainedChildCount
        : null,
      startedAt: typeof auditDiagnostics?.startedAt === "number" ? auditDiagnostics.startedAt : null,
    },
    auditChildSessionID: null,
    auditAbort: null,
    autonomousQuestionCalls: questionCalls(metadata?.autonomousQuestionCalls),
    autonomousQuestionRefs: questionRefs(metadata?.autonomousQuestionRefs),
    compacting: false,
    continuationCycles: typeof metadata?.continuationCycles === "number" ? metadata.continuationCycles : 0,
    controlTurnPending: false,
    deferredQuestionProvenance,
    grindEnabled,
    guardTurnPending: false,
    frontierError: persistedFrontier.errorCode,
    frontierReconciliationRef: stringValue(metadata?.frontierReconciliationRef),
    frontierStatus,
    lastAssistantID: null,
    lastAuditedRevision: stringValue(metadata?.lastAuditedRevision),
    lastHumanID: null,
    lastProgressFingerprint: stringValue(metadata?.lastProgressFingerprint) ?? workFrontier?.progressFingerprint ?? null,
    lastStatusKey: null,
    lastStrategyFingerprint: stringValue(metadata?.lastStrategyFingerprint),
    paused,
    pendingAutonomousQuestionCalls: questionCalls(metadata?.pendingAutonomousQuestionCalls),
    pendingAutonomousQuestionRefs: questionRefs(metadata?.pendingAutonomousQuestionRefs),
    pendingQuestionDeferralProvenance,
    promptContext: restoredPromptContext(root, { agent: null, model: null, variant: null }),
    questions: new Map(),
    recoveryAudit: null,
    restartRecoveryAction: pendingQuestionDeferralProvenance.size > 0
      ? "question-deferral-resolution-unknown"
      : frontierStatus === "invalid"
      ? `frontier-invalid:${persistedFrontier.errorCode ?? "unknown"}`
      : grindEnabled && frontierStatus === "absent"
        ? "frontier-missing"
        : stringValue(metadata?.restartRecoveryAction),
    retryTimer: null,
    root,
    settleTimer: null,
    state: grindEnabled
      ? paused
        ? "paused"
        : pendingQuestionDeferralProvenance.size > 0 || frontierStatus === "invalid"
          ? "error"
          : "frontier-reconciling"
      : "disabled",
    statusMessage: null,
    terminalCertificate: {
      challenge: null,
      deadlineAt: null,
      evidenceRefs: [],
      issuer: null,
      reason: null,
      status: "not-configured",
    },
    terminalDiagnosticStages: new Set(),
    waitReason: stringValue(metadata?.waitReason),
    waitRecheckCount: boundedInteger(metadata?.waitRecheckCount, 0, 0),
    waitRecheckTimer: null,
    workFrontier,
  };
}

export async function resolveRootSession(
  sessionID: string,
  fetchSession: (sessionID: string) => Promise<Session>,
): Promise<Session> {
  let current = await fetchSession(sessionID);
  const visited = new Set<string>();
  for (let depth = 0; depth < 64; depth += 1) {
    if (visited.has(current.id)) throw new Error("Session parent cycle detected");
    visited.add(current.id);
    if (current.parentID == null) return current;
    current = await fetchSession(current.parentID);
  }
  throw new Error("Session parent depth exceeded");
}
