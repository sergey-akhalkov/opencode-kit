import crypto from "node:crypto";
import type { Config } from "@opencode-ai/plugin";
import type { Session } from "@opencode-ai/sdk/v2";
import { hashRef, sanitizeText } from "../../plugin/session-delivery-context/redaction.ts";
import type { AuditWindowOptions, GuardOptions, RootPromptContext, RootState } from "./types.ts";

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
  auditWindow: {
    closePassedAfterMs: 15_000,
    enabled: false,
    mode: "read-only-monitor",
    scope: "per-root",
    terminal: "powershell-shell",
    validationError: null,
  },
  arbiterAgent: "session-completion-arbiter",
  enabled: true,
  initialDelayMs: 2_000,
  maxCycles: -1,
  maxDelayMs: 60_000,
  retainAuditSessions: -1,
  retryMultiplier: 2,
  settleMs: 750,
  statusToasts: true,
  strategyFallback: "docs/session-strategy-history",
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

export function applyMainPermissionAllow(config: Config): void {
  config.permission = {
    ...(config.permission ?? {}),
    bash: "allow",
    doom_loop: "allow",
    edit: "allow",
    external_directory: "allow",
    webfetch: "allow",
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
    auditWindow: parseAuditWindowOptions(value.auditWindow),
    arbiterAgent: stringValue(value.arbiterAgent) ?? DEFAULT_OPTIONS.arbiterAgent,
    enabled: value.enabled !== false,
    initialDelayMs: boundedInteger(value.initialDelayMs, DEFAULT_OPTIONS.initialDelayMs, 1),
    maxCycles,
    maxDelayMs: boundedInteger(value.maxDelayMs, DEFAULT_OPTIONS.maxDelayMs, 1),
    retainAuditSessions,
    retryMultiplier,
    settleMs: boundedInteger(value.settleMs, DEFAULT_OPTIONS.settleMs, 0),
    statusToasts: value.statusToasts !== false,
    strategyFallback: stringValue(value.strategyFallback) ?? DEFAULT_OPTIONS.strategyFallback,
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
    tools: null,
    variant: root.model?.variant ?? null,
  };
}

export function initialRootState(root: Session): RootState {
  const metadata = record(root.metadata?.completionGuard);
  const grindEnabled = metadata?.grindEnabled === true;
  const paused = metadata?.paused === true;
  return {
    activeAudit: null,
    auditChildSessionID: null,
    auditAbort: null,
    compacting: false,
    continuationCycles: typeof metadata?.continuationCycles === "number" ? metadata.continuationCycles : 0,
    controlTurnPending: false,
    grindEnabled,
    guardTurnPending: false,
    lastAssistantID: null,
    lastAuditedRevision: stringValue(metadata?.lastAuditedRevision),
    lastHumanID: null,
    lastStatusKey: null,
    lastStrategyFingerprint: stringValue(metadata?.lastStrategyFingerprint),
    paused,
    pendingQuestionCorrection: null,
    promptContext: restoredPromptContext(root, { agent: null, model: null, tools: null, variant: null }),
    questionCorrectionAbort: null,
    questions: new Map(),
    retryTimer: null,
    root,
    settleTimer: null,
    state: grindEnabled ? (paused ? "paused" : "running") : "disabled",
    statusMessage: null,
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
