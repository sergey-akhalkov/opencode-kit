import type { Hooks, PluginInput } from "@opencode-ai/plugin";
import {
  type OpencodeClient,
  type Session,
} from "@opencode-ai/sdk/v2";
import type { PTYSessionInfo } from "opencode-pty/plugin/pty/types";
import { hashRef } from "../../plugin/session-delivery-context/redaction.ts";
import {
  registerSessionUpdateCallback,
  removeSessionUpdateCallback,
  SHARED_PTY_MANAGER,
} from "../opencode-pty-bridge.ts";
import {
  AuditRequestOverflowError,
  buildArbiterAuditRequest,
  buildArbiterRetryRequest,
  captureArbiterEvidence,
  requireBoundedRequest,
} from "./arbiter-evidence.ts";
import { sharedArbiterScheduler } from "./arbiter-scheduler.ts";
import { ensureArbiterChild } from "./arbiter-child.ts";
import { GuardAuditMonitorLauncher } from "./audit-monitor.ts";
import { isExplicitHumanStop, isGuardSyntheticPart, syntheticAsyncMarker } from "./control.ts";
import {
  configureGrindCommands,
  grindControlAction,
  grindControlPart,
} from "./grind-control.ts";
import { inspectRootEvidence, type RootInspection } from "./inspection.ts";
import { AsyncLeaseRegistry } from "./leases.ts";
import { PtyFallbackScheduler } from "./pty-fallback.ts";
import { normalizeQuestionRequest } from "./question.ts";
import {
  configuredPermissionClass,
  createAuditID,
  dataOf,
  ensureNoError,
  hasErrorName,
  initialRootState,
  messagePartsText,
  parseGuardOptions,
  record,
  resolveRootSession,
  restoredPromptContext,
  safeError,
  stringValue,
} from "./runtime-support.ts";
import { GuardStatusReporter } from "./status.ts";
import { sendTaskFallback } from "./task-fallback.ts";
import {
  hasVerifiedTroubleshooter,
  strategyFingerprint,
} from "./strategy.ts";
import {
  createTerminalCertificateChallenge,
  evaluateTerminalCertificate,
} from "./terminal-certificate.ts";
import { terminalClaimBindings } from "./claim-evidence.ts";
import type {
  AuditEpoch,
  CompletionVerdict,
  GuardOptions,
  NormalizedQuestionRequest,
  RootState,
} from "./types.ts";
import { buildContinuation, parseCompletionVerdictText } from "./verdict.ts";
type LogLevel = "debug" | "error" | "info" | "warn";
const MAX_AUTONOMOUS_QUESTION_REFS = 1_024;
class ArbiterPromptTimeoutError extends Error {
  constructor(readonly timeoutMs: number) {
    super(`Completion arbiter prompt timed out after ${timeoutMs}ms`);
    this.name = "ArbiterPromptTimeoutError";
  }
}

async function withTimeout<T>(
  run: (signal: AbortSignal) => Promise<T>,
  timeoutMs: number,
  parentSignal?: AbortSignal,
): Promise<T> {
  const controller = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);
  const abort = () => controller.abort();
  parentSignal?.addEventListener("abort", abort, { once: true });
  try {
    return await Promise.race([
      run(controller.signal),
      new Promise<never>((_resolve, reject) => controller.signal.addEventListener("abort", () => {
        reject(timedOut ? new ArbiterPromptTimeoutError(timeoutMs) : new Error("Completion arbiter prompt cancelled"));
      }, { once: true })),
    ]);
  } finally {
    clearTimeout(timer);
    parentSignal?.removeEventListener("abort", abort);
  }
}

function auditErrorClass(error: unknown): "capability" | "cancelled" | "input-state" | "transient" {
  if (error instanceof AuditRequestOverflowError) return "input-state";
  if (error instanceof ArbiterPromptTimeoutError) return "transient";
  const details = safeError(error, "unknown");
  const material = `${details.name} ${details.message ?? ""} ${details.cause?.name ?? ""} ${details.cause?.message ?? ""}`;
  if (/abort|cancel|stale/i.test(material)) return "cancelled";
  if (/configured hidden completion arbiter route|capability|unsupported|permission|forbidden|unauthori[sz]ed|access denied|not allowed/i.test(material)) return "capability";
  if (/not found|ownership|multiple retained|limit reached|schema|correlation|evidence|invalid completion|exact json/i.test(material)) return "input-state";
  if (/provider|network|temporar|rate|timeout|unavailable|connection|fetch/i.test(material)) return "transient";
  return "transient";
}

function certificateRequirementIds(value: unknown): string[] | null {
  if (!Array.isArray(value) || value.length === 0 || value.length > 100) return null;
  const ids = value.filter((item): item is string =>
    typeof item === "string" && item !== "" && item.length <= 200 && !/[\r\n\0]/.test(item)
  ).sort();
  return ids.length === value.length && new Set(ids).size === ids.length ? ids : null;
}

function sessionRows(payload: unknown): Session[] {
  if (Array.isArray(payload)) return payload as Session[];
  const nested = record(payload)?.data;
  if (Array.isArray(nested)) return nested as Session[];
  throw new Error("session.list grind recovery returned an unsupported payload shape");
}
export class SessionCompletionController {
  readonly client: OpencodeClient;
  readonly leases: AsyncLeaseRegistry;
  readonly options: GuardOptions;
  private readonly input: PluginInput;
  private readonly roots = new Map<string, RootState>();
  private readonly ptyFallback: PtyFallbackScheduler;
  private readonly status: GuardStatusReporter;
  private configuredPermission: ReturnType<typeof configuredPermissionClass> = "unspecified";
  private disposed = false;
  private permissionDiagnosticLogged = false;
  private readonly ptyUpdate = (info: PTYSessionInfo): void => this.leases.onManagerUpdate(info);

  constructor(input: PluginInput, rawOptions: Record<string, unknown>, client: OpencodeClient) {
    this.input = input;
    this.options = parseGuardOptions(rawOptions);
    this.client = client;
    const monitor = new GuardAuditMonitorLauncher(this.options.auditWindow, {
      directory: input.directory,
      log: (level, message, extra) => this.log(level, message, extra),
    });
    this.status = new GuardStatusReporter({ client: this.client, statusToasts: this.options.statusToasts,
      monitor,
      log: (level, message, extra) => this.log(level, message, extra) });
    this.leases = new AsyncLeaseRegistry({
      onGeneration: (rootSessionID) => this.invalidateAudit(rootSessionID, "async lease changed"),
      onTerminalPty: (rootSessionID, lease, info) => this.ptyFallback.schedule(rootSessionID, lease.ptyID, info),
    });
    this.ptyFallback = new PtyFallbackScheduler({
      client: this.client, leases: this.leases, settleMs: this.options.settleMs,
      resolveRoot: (rootSessionID) => this.tryRoot(rootSessionID),
      onFailure: (state, boundary, error) => this.owningFailure(state, boundary, error),
    });
  }

  async start(): Promise<Hooks> {
    registerSessionUpdateCallback(this.ptyUpdate);
    setTimeout(() => {
      if (this.disposed) return;
      void this.reconcileRoots().catch((error) => this.log("error", "startup grind recovery failed", {
        error: safeError(error, "startup"),
      }));
    }, 0);
    return {
      config: async (config) => {
        this.configuredPermission = configuredPermissionClass(config.permission);
        configureGrindCommands(config);
      },
      "command.execute.before": async (input, output) => this.onCommand(input, output),
      "chat.message": async (input, output) => this.onChatMessage(input, output),
      "experimental.session.compacting": async (input) => {
        const root = await this.tryRoot(input.sessionID);
        if (root != null) root.compacting = true;
      },
      "experimental.compaction.autocontinue": async (input) => {
        const root = await this.tryRoot(input.sessionID);
        if (root != null) root.guardTurnPending = true;
      },
      "tool.execute.before": async (input, output) => {
        const root = await this.tryRoot(input.sessionID);
        if (root == null || !root.grindEnabled) return;
        this.leases.beforeTool(input.tool, root.root.id, input.callID, record(output.args) ?? {});
      },
      "tool.execute.after": async (input, output) => {
        const root = await this.tryRoot(input.sessionID);
        if (root == null || !root.grindEnabled) return;
        this.leases.afterTool(
          input.tool,
          root.root.id,
          input.callID,
          output.output,
          record(output.metadata),
          (id) => SHARED_PTY_MANAGER.get(id),
        );
        if (input.tool === "pty_spawn") {
          const id = output.output.match(/\bID:\s*(pty_[A-Za-z0-9_-]+)/)?.[1];
          if (id != null && SHARED_PTY_MANAGER.get(id) != null) {
            await this.log("info", "shared PTY manager observed correlated spawn", {
              ptyRef: hashRef("pty", id),
              rootRef: hashRef("session", root.root.id),
              sharedManager: true,
            });
          }
        }
      },
      event: async ({ event }) => this.onEvent(event as unknown as Record<string, unknown>),
      dispose: async () => this.dispose(),
    };
  }

  private async reconcileRoots(): Promise<void> {
    const roots = sessionRows(await dataOf<unknown>(
      this.client.v2.session.list({ directory: this.input.directory, roots: true, limit: 500 }) as Promise<unknown>,
      "session.list grind recovery",
    ));
    for (const candidate of roots.filter((row) => row.parentID == null)) {
      const root = await this.session(candidate.id);
      if (record(root.metadata?.completionGuard)?.grindEnabled !== true) continue;
      const state = this.stateFor(root);
      const listedChildren = await dataOf<Session[]>(
        this.client.session.children({ sessionID: root.id, directory: this.input.directory }) as Promise<unknown>,
        "session.children grind recovery",
      );
      const children = await Promise.all(listedChildren.map((child) => this.session(child.id)));
      const guardChildren = children.filter((child) =>
        record(child.metadata?.completionGuard)?.rootSessionRef === hashRef("session", root.id)
      );
      const retrying = guardChildren.filter((child) => record(child.metadata?.completionGuard)?.status === "retrying");
      if (retrying.length > 1) {
        state.restartRecoveryAction = "blocked-multiple-retrying-children";
        await this.status.set(state, "error", "Restart recovery found multiple retrying arbiter children", "error");
        continue;
      }
      if (retrying.length === 1) {
        const child = retrying[0];
        const metadata = record(child.metadata?.completionGuard) ?? {};
        const attempt = typeof metadata.attempt === "number" && Number.isInteger(metadata.attempt) ? metadata.attempt : -1;
        const kind = metadata.kind === "completion" || metadata.kind === "question" ? metadata.kind : null;
        const auditID = stringValue(metadata.auditID);
        const inspectedRevision = stringValue(metadata.inspectedRevision);
        if (attempt < 0 || attempt >= this.options.maxRetryAttempts || kind == null || auditID == null || inspectedRevision == null) {
          state.restartRecoveryAction = "blocked-invalid-retry-metadata";
          await this.status.set(state, "error", "Restart recovery found invalid bounded retry metadata", "error");
          continue;
        }
        if (kind === "question") {
          state.restartRecoveryAction = "blocked-question-reply-unknown";
          await this.status.set(state, "error", "Restart recovery cannot prove pending question reply ownership", "error");
          continue;
        }
        state.recoveryAudit = { attempt, auditID, childSessionID: child.id, inspectedRevision, kind };
        state.restartRecoveryAction = "resume-bounded-retry-after-settle";
      } else {
        state.restartRecoveryAction = "schedule-one-settle-pass";
      }
      await this.status.persist(state);
      this.scheduleIdle(state);
    }
  }

  private async log(level: LogLevel, message: string, extra: Record<string, unknown> = {}): Promise<void> {
    try {
      await this.input.client.app.log({
        body: { service: "session-completion-guard", level, message, extra },
      });
    } catch {
      // Logging must not change guard behavior.
    }
  }

  private traceTerminalStage(state: RootState, stage: string, extra: Record<string, unknown> = {}): void {
    const challengeRef = state.terminalCertificate.challenge?.challengeRef ?? "none";
    const key = `${challengeRef}:${stage}`;
    if (state.terminalDiagnosticStages.has(key) || state.terminalDiagnosticStages.size >= 64) return;
    state.terminalDiagnosticStages.add(key);
    const diagnostic = {
      challengeRef: challengeRef === "none" ? null : hashRef("challenge", challengeRef),
      rootRef: hashRef("session", state.root.id),
      stage,
      ...extra,
    };
    void this.log("info", "terminal certificate settle stage", diagnostic);
    const runtime = globalThis as typeof globalThis & {
      process?: { env?: Record<string, string | undefined>; stderr?: { write(value: string): unknown } };
    };
    if (runtime.process?.env?.OPENCODE_PROOF_TERMINAL_STAGE_STDERR === "1") {
      try {
        runtime.process.stderr?.write(`[session-completion-guard:terminal-stage] ${JSON.stringify(diagnostic)}\n`);
      } catch {
        // Diagnostics must not change guard behavior.
      }
    }
  }

  private async session(sessionID: string): Promise<Session> {
    return dataOf<Session>(
      this.client.session.get({ sessionID, directory: this.input.directory }) as Promise<unknown>,
      "session.get",
    );
  }

  private stateFor(root: Session): RootState {
    const existing = this.roots.get(root.id);
    if (existing != null) {
      existing.root = root;
      return existing;
    }
    const state = initialRootState(root);
    this.roots.set(root.id, state);
    return state;
  }

  private async tryRoot(sessionID: string): Promise<RootState | null> {
    try {
      return this.stateFor(await resolveRootSession(sessionID, (id) => this.session(id)));
    } catch (error) {
      if (hasErrorName(error, "NotFoundError")) {
        this.clearRoot(sessionID);
        return null;
      }
      await this.log("error", "root identity resolution failed", {
        error: safeError(error, sessionID),
        sessionRef: hashRef("session", sessionID),
      });
      return null;
    }
  }

  private cancelAudit(state: RootState, nextState: RootState["state"] = "running"): void {
    if (state.retryTimer != null) clearTimeout(state.retryTimer);
    state.retryTimer = null;
    state.auditAbort?.abort();
    state.auditAbort = null;
    state.activeAudit = null;
    state.state = nextState;
    state.statusMessage = null;
  }

  private invalidateAudit(rootSessionID: string, reason: string): void {
    const state = this.roots.get(rootSessionID);
    if (state?.activeAudit == null) return;
    this.cancelAudit(state, "stale");
    void this.log("info", "audit invalidated", {
      reason,
      rootRef: hashRef("session", rootSessionID),
    });
  }

  private async onChatMessage(
    input: { sessionID: string; agent?: string; model?: { providerID: string; modelID: string }; variant?: string },
    output: { message: unknown; parts: unknown[] },
  ): Promise<void> {
    const state = await this.tryRoot(input.sessionID);
    if (state == null || state.root.id !== input.sessionID) return;
    const message = record(output.message) ?? {};
    const parts = output.parts.map((part) => record(part) ?? {});
    const texts = messagePartsText(parts);
    for (const text of texts) this.leases.consumeSynthetic(state.root.id, text);
    if (parts.some(isGuardSyntheticPart)) {
      state.guardTurnPending = true;
      return;
    }
    if (texts.some((text) => syntheticAsyncMarker(text) != null)) return;
    const humanParts = parts.filter((part) => part.synthetic !== true);
    if (humanParts.length === 0) return;
    const text = messagePartsText(humanParts).join("\n");
    state.lastHumanID = stringValue(message.id);
    state.promptContext = {
      agent: input.agent ?? stringValue(message.agent),
      model: input.model ?? (record(message.model) == null ? null : {
        providerID: String(record(message.model)?.providerID ?? ""),
        modelID: String(record(message.model)?.modelID ?? ""),
      }),
      tools: record(message.tools) as Record<string, boolean> | null,
      variant: input.variant ?? stringValue(record(message.model)?.variant),
    };
    state.controlTurnPending = false;
    this.cancelAudit(state);
    state.guardTurnPending = false;
    state.compacting = false;
    if (!state.grindEnabled) {
      state.paused = false;
      state.state = "disabled";
      return;
    }
    if (isExplicitHumanStop(text)) {
      state.paused = true;
      await this.status.set(state, "paused", "Guard paused by user instruction", "warning");
    } else {
      state.paused = false;
      await this.status.persist(state);
    }
  }

  private async onCommand(
    input: { command: string; sessionID: string; arguments: string },
    output: { parts: unknown[] },
  ): Promise<void> {
    const action = grindControlAction(input.command);
    if (action == null) return;
    const state = await this.tryRoot(input.sessionID);
    if (state == null || state.root.id !== input.sessionID) return;
    output.parts.splice(0, output.parts.length, grindControlPart(action));
    state.controlTurnPending = true;
    state.guardTurnPending = true;
    state.paused = false;
    this.cancelAudit(state, action === "enable" ? "running" : "disabled");
    if (action === "enable") {
      state.grindEnabled = true;
      await this.status.set(state, "running", "Grind enabled for this session", "success");
      return;
    }
    state.grindEnabled = false;
    this.clearWaitRecheck(state);
    state.questions.clear();
    this.leases.clearRoot(state.root.id);
    this.ptyFallback.clearRoot(state.root.id);
    await this.status.set(state, "disabled", "Grind disabled for this session", "info");
  }

  private async onEvent(event: Record<string, unknown>): Promise<void> {
    if (!this.permissionDiagnosticLogged) {
      this.permissionDiagnosticLogged = true;
      void this.log("info", "completion guard permission capability state", {
        configuredPermission: this.configuredPermission,
        guardCapability: "checked-at-operation",
      });
    }
    const type = stringValue(event.type);
    const properties = record(event.properties) ?? {};
    const sessionID = stringValue(properties.sessionID) ?? stringValue(record(properties.info)?.id);
    if (type === "session.deleted" && sessionID != null) {
      this.clearRoot(sessionID);
      return;
    }
    if (sessionID == null) return;
    if ((type === "question.replied" || type === "question.v2.replied")) {
      await this.onQuestionReplied(sessionID, stringValue(properties.requestID));
      return;
    }
    if (type === "question.asked" || type === "question.v2.asked") {
      await this.onQuestionAsked(sessionID, properties);
      return;
    }
    if (type === "session.error") {
      const error = record(properties.error);
      if (error?.name === "MessageAbortedError") await this.pause(sessionID, "user interrupt");
      return;
    }
    if (type === "session.compacted") {
      const state = await this.tryRoot(sessionID);
      if (state != null) {
        state.compacting = false;
        state.guardTurnPending = true;
      }
      return;
    }
    if (type === "session.updated") {
      const state = this.roots.get(sessionID);
      if (state != null) {
        const latest = record(properties.info);
        if (latest?.id === sessionID) state.root = latest as Session;
        const mission = record(record(state.root.metadata)?.roadmapMission);
        if (mission?.certificateStatus === "issued") {
          this.invalidateAudit(state.root.id, "terminal certificate arrived");
          this.scheduleIdle(state);
        }
      }
      return;
    }
    if (type === "message.updated") {
      const info = record(properties.info);
      if (info?.role === "assistant") {
        const state = await this.tryRoot(sessionID);
        if (state != null && state.root.id === sessionID) {
          const messageID = stringValue(info.id);
          if (messageID != null && messageID !== state.lastAssistantID) {
            const guardTurn = state.guardTurnPending;
            state.lastAssistantID = messageID;
            if (!state.controlTurnPending) state.guardTurnPending = false;
            state.compacting = false;
            if (!guardTurn) this.invalidateAudit(state.root.id, "assistant revision changed");
          }
        }
      }
      return;
    }
    if (type === "session.idle" || (type === "session.status" && record(properties.status)?.type === "idle")) {
      const state = await this.tryRoot(sessionID);
      if (state != null && state.root.id === sessionID) this.scheduleIdle(state);
    }
  }

  private async pause(sessionID: string, reason: string): Promise<void> {
    const state = await this.tryRoot(sessionID);
    if (state == null || !state.grindEnabled) return;
    state.paused = true;
    state.guardTurnPending = false;
    this.clearWaitRecheck(state);
    this.cancelAudit(state, "paused");
    await this.status.set(state, "paused", `Guard paused: ${reason}`, "warning");
  }

  private scheduleIdle(state: RootState, blockedRetry = false): void {
    if (
      this.disposed ||
      !state.grindEnabled ||
      state.paused ||
      state.state === "passed" ||
      state.settleTimer != null ||
      (!blockedRetry && (state.compacting || state.guardTurnPending || state.activeAudit != null))
    ) return;
    if (state.terminalCertificate.status === "waiting") {
      this.traceTerminalStage(state, "settle-scheduled", { blockedRetry });
    }
    state.state = "settling-idle";
    const generation = this.leases.generation(state.root.id);
    state.settleTimer = setTimeout(() => {
      state.settleTimer = null;
      if (state.terminalCertificate.status === "waiting") {
        this.traceTerminalStage(state, "settle-fired", { expectedGeneration: generation });
      }
      void this.handleSettledIdle(state, generation).catch((error) => this.owningFailure(state, "idle preflight", error));
    }, this.options.settleMs);
  }

  private clearWaitRecheck(state: RootState): void {
    if (state.waitRecheckTimer != null) clearTimeout(state.waitRecheckTimer);
    state.waitRecheckTimer = null;
    state.waitReason = null;
    state.waitRecheckCount = 0;
  }

  private scheduleWaitRecheck(state: RootState, reason: string): void {
    if (state.waitRecheckTimer != null) return;
    if (state.waitRecheckCount >= this.options.maxWaitRechecks) {
      state.waitReason = reason;
      void this.status.set(
        state,
        "error",
        `Async wait recheck limit exhausted (${state.waitRecheckCount}/${this.options.maxWaitRechecks}): ${reason}`,
        "error",
      );
      return;
    }
    state.waitReason = reason;
    state.waitRecheckCount += 1;
    state.waitRecheckTimer = setTimeout(() => {
      state.waitRecheckTimer = null;
      if (!state.grindEnabled || state.paused || this.disposed) return;
      void this.handleSettledIdle(state, this.leases.generation(state.root.id)).catch((error) =>
        this.owningFailure(state, "async wait recheck", error)
      );
    }, this.options.waitRecheckMs);
    void this.status.persist(state);
  }

  private async sessionStatuses(): Promise<Record<string, { type: string }>> {
    return dataOf<Record<string, { type: string }>>(
      this.client.session.status({ directory: this.input.directory }) as Promise<unknown>,
      "session.status",
    );
  }

  private async childStatuses(state: RootState, statuses: Record<string, { type: string }>): Promise<Array<{
    id: string;
    status: "idle" | "running" | "unknown";
  }>> {
    const children = await dataOf<Session[]>(
      this.client.session.children({ sessionID: state.root.id, directory: this.input.directory }) as Promise<unknown>,
      "session.children",
    );
    return children.map((child) => ({
      id: child.id,
      status: statuses[child.id]?.type === "busy" || statuses[child.id]?.type === "retry"
        ? "running"
        : statuses[child.id]?.type === "idle"
          ? "idle"
          : "unknown",
    }));
  }

  private async handleSettledIdle(state: RootState, expectedGeneration: number): Promise<void> {
    if (
      this.disposed ||
      !state.grindEnabled ||
      state.paused
    ) return;
    if (state.terminalCertificate.status === "waiting") {
      this.traceTerminalStage(state, "settle-entered", { expectedGeneration });
    }
    const transientBlocked = state.compacting || state.guardTurnPending || state.activeAudit != null;
    if (transientBlocked && state.terminalCertificate.status === "waiting") {
      state.root = await this.session(state.root.id);
      this.traceTerminalStage(state, "transient-refresh", {
        activeAudit: state.activeAudit != null,
        compacting: state.compacting,
        guardTurnPending: state.guardTurnPending,
      });
    }
    const mission = record(state.root.metadata?.roadmapMission);
    const issuedCertificate = state.terminalCertificate.status === "waiting" &&
      mission?.certificateStatus === "issued" && mission.terminalCertificate != null;
    if (transientBlocked) {
      if (!issuedCertificate) {
        if (state.terminalCertificate.status === "waiting") this.scheduleIdle(state, true);
        return;
      }
    }
    const statuses = await this.sessionStatuses();
    if (state.terminalCertificate.status === "waiting") {
      this.traceTerminalStage(state, `root-status-${statuses[state.root.id]?.type ?? "absent"}`);
    }
    if (statuses[state.root.id] != null && statuses[state.root.id]?.type !== "idle") {
      state.state = "running";
      if (state.terminalCertificate.status === "waiting") this.scheduleIdle(state, issuedCertificate);
      return;
    }
    const children = await this.childStatuses(state, statuses);
    const preflight = this.leases.preflight(state.root.id, SHARED_PTY_MANAGER.list(), children);
    if (state.terminalCertificate.status === "waiting") {
      this.traceTerminalStage(state, `preflight-${preflight.kind}`, {
        expectedGeneration,
        observedGeneration: preflight.generation,
      });
    }
    if (preflight.generation !== expectedGeneration) {
      state.state = "stale";
      if (issuedCertificate) this.scheduleIdle(state, true);
      return;
    }
    if (preflight.kind !== "clear") {
      await this.status.set(
        state,
        preflight.kind === "unknown" ? "error" : "waiting-async",
        preflight.reason,
        preflight.kind === "unknown" ? "error" : "info",
      );
      if (preflight.kind === "waiting") {
        const fallback = this.leases.terminalTaskAwaitingResult(state.root.id, children);
        if (fallback?.childSessionID != null) {
          await sendTaskFallback(this.client, this.leases, state, fallback.callID, fallback.childSessionID);
        } else {
          this.scheduleWaitRecheck(state, preflight.reason);
        }
      }
      return;
    }
    this.clearWaitRecheck(state);
    const inspection = await this.inspectRoot(state);
    if (state.terminalCertificate.status === "waiting") {
      this.traceTerminalStage(state, "inspection-complete", {
        expectedGeneration,
        observedGeneration: inspection.revision.leaseGeneration,
      });
    }
    if (inspection.revision.leaseGeneration !== expectedGeneration) {
      if (issuedCertificate) this.scheduleIdle(state, true);
      return;
    }
    if (state.lastAuditedRevision === inspection.revision.revisionDigest && state.state === "passed") return;
    const certificate = await this.tryTerminalCertificate(state, inspection);
    this.traceTerminalStage(state, `validator-${certificate}`);
    if (certificate !== "fallback") return;
    const recovery = state.recoveryAudit;
    if (recovery != null) {
      if (recovery.inspectedRevision !== inspection.revision.revisionDigest) {
        state.recoveryAudit = null;
        state.restartRecoveryAction = "discarded-stale-retry";
      } else {
        const epoch: AuditEpoch = {
          auditID: recovery.auditID,
          attempt: recovery.attempt,
          childSessionID: recovery.childSessionID,
          completionEvidence: null,
          inspected: inspection.revision,
          kind: recovery.kind,
          questionRequest: null,
          rootRef: hashRef("session", state.root.id),
          rootSessionID: state.root.id,
        };
        state.recoveryAudit = null;
        state.activeAudit = epoch;
        state.auditAbort = new AbortController();
        state.state = "audit-retrying";
        state.auditDiagnostics.attempt = recovery.attempt;
        await this.status.persist(state);
        void this.runAudit(state, inspection, epoch, "Runtime restarted during a bounded transient retry").catch((error) =>
          this.owningFailure(state, "recovered completion audit", error)
        );
        return;
      }
    }
    await this.beginAudit(state, inspection, "completion", null);
  }

  private async tryTerminalCertificate(
    state: RootState,
    inspection: RootInspection,
  ): Promise<"accepted" | "fallback" | "waiting"> {
    this.traceTerminalStage(state, "validator-entered");
    this.traceTerminalStage(state, "validator-refresh-start");
    state.root = await this.session(state.root.id);
    this.traceTerminalStage(state, "validator-refresh-complete");
    const mission = record(state.root.metadata?.roadmapMission);
    const issuer = stringValue(mission?.certificateIssuer);
    if (issuer == null) {
      state.terminalCertificate = {
        challenge: null,
        deadlineAt: null,
        evidenceRefs: [],
        issuer: null,
        reason: null,
        status: "not-configured",
      };
      return "fallback";
    }
    const requirementIds = certificateRequirementIds(mission?.acceptedRequirementIds);
    if (!this.options.certificateIssuers.includes(issuer) || requirementIds == null) {
      state.terminalCertificate = {
        challenge: null,
        deadlineAt: null,
        evidenceRefs: [],
        issuer,
        reason: requirementIds == null ? "missing-requirement" : "unknown-issuer",
        status: "rejected",
      };
      return "fallback";
    }
    this.traceTerminalStage(state, "validator-bindings-start");
    const completionEvidence = captureArbiterEvidence(
      state.root.id,
      hashRef("session", state.root.id),
      this.input.directory,
      state.root.metadata,
    );
    const claimEvidence = completionEvidence.claimEvidence;
    const claimBindings = terminalClaimBindings(claimEvidence);
    if (claimBindings.reason != null) {
      state.terminalCertificate = {
        challenge: null,
        deadlineAt: null,
        evidenceRefs: [],
        issuer,
        reason: claimBindings.reason,
        status: "rejected",
      };
      return "fallback";
    }
    const { acceptedClaimIds, claimEvidenceRefs } = claimBindings;
    const challenge = createTerminalCertificateChallenge({
      acceptedClaimIds,
      claimEvidenceRefs,
      issuer,
      leaseGeneration: inspection.revision.leaseGeneration,
      requirementIds,
      revisionDigest: inspection.revision.revisionDigest,
      rootRef: hashRef("session", state.root.id),
    });
    this.traceTerminalStage(state, "validator-bindings-complete");
    const pendingQuestion = [...state.questions.values()].some((question) =>
      question.state !== "guard-answered" && question.state !== "human-replied"
    );
    const certificateStatus = stringValue(mission?.certificateStatus);
    if (certificateStatus === "declined") {
      state.terminalCertificate = {
        challenge: null,
        deadlineAt: null,
        evidenceRefs: [],
        issuer,
        reason: stringValue(mission?.certificateReason) ?? "issuer-declined",
        status: "declined",
      };
      return "fallback";
    }
    if (mission?.terminalCertificate != null) {
      this.traceTerminalStage(state, "validator-issued-evaluation-start");
      const evaluated = evaluateTerminalCertificate({
        certificate: mission.terminalCertificate,
        challenge,
        configuredIssuers: this.options.certificateIssuers,
        pendingQuestion,
      });
      this.traceTerminalStage(state, `validator-issued-evaluation-${evaluated.status}`);
      if (evaluated.status === "accepted") {
        this.traceTerminalStage(state, "validator-passed-persist-start");
        state.lastAuditedRevision = inspection.revision.revisionDigest;
        state.recoveryAudit = null;
        state.terminalCertificate = {
          acceptedClaimIds: evaluated.certificate.acceptedClaimIds,
          challenge: null,
          claimEvidenceRefs: evaluated.certificate.claimEvidenceRefs,
          deadlineAt: null,
          evidenceRefs: evaluated.certificate.evidenceRefs,
          issuer: evaluated.certificate.issuer,
          reason: null,
          status: "accepted",
        };
        await this.status.set(state, "passed", "Completion guard passed (certified)", "success");
        this.traceTerminalStage(state, "validator-passed-persist-complete");
        return "accepted";
      }
      state.terminalCertificate = {
        challenge: null,
        deadlineAt: null,
        evidenceRefs: [],
        issuer,
        reason: evaluated.reason,
        status: "rejected",
      };
      return "fallback";
    }
    if (pendingQuestion) {
      state.terminalCertificate = {
        challenge: null,
        deadlineAt: null,
        evidenceRefs: [],
        issuer,
        reason: "pending-question",
        status: "rejected",
      };
      return "fallback";
    }
    const sameChallenge = state.terminalCertificate.challenge?.challengeRef === challenge.challengeRef;
    const deadlineAt = sameChallenge && state.terminalCertificate.deadlineAt != null
      ? state.terminalCertificate.deadlineAt
      : Date.now() + this.options.certificateWaitMs;
    if (Date.now() >= deadlineAt) {
      state.terminalCertificate = {
        challenge: null,
        deadlineAt: null,
        evidenceRefs: [],
        issuer,
        reason: "issuer-timeout",
        status: "expired",
      };
      return "fallback";
    }
    state.terminalCertificate = {
      acceptedClaimIds,
      challenge,
      claimEvidenceRefs,
      deadlineAt,
      evidenceRefs: [],
      issuer,
      reason: null,
      status: "waiting",
    };
    await this.status.persist(state);
    this.scheduleIdle(state);
    return "waiting";
  }

  private async inspectRoot(state: RootState): Promise<RootInspection> {
    return inspectRootEvidence({
      client: this.client,
      configDirectory: this.input.directory,
      leases: this.leases,
      options: this.options,
      root: state.root,
    });
  }

  private async beginAudit(
    state: RootState,
    inspection: RootInspection,
    kind: AuditEpoch["kind"],
    questionRequest: NormalizedQuestionRequest | null,
  ): Promise<void> {
    if (!state.grindEnabled || state.activeAudit != null) return;
    const auditID = createAuditID(
      state.root.id,
      inspection.revision.revisionDigest,
      `${kind}:${questionRequest?.requestID ?? ""}`,
    );
    const epoch: AuditEpoch = {
      auditID,
      attempt: 0,
      childSessionID: null,
      completionEvidence: null,
      inspected: inspection.revision,
      kind,
      questionRequest,
      rootRef: hashRef("session", state.root.id),
      rootSessionID: state.root.id,
    };
    state.activeAudit = epoch;
    state.auditDiagnostics = {
      allowedRequestBytes: this.options.maxRequestBytes,
      attempt: 0,
      attemptLimit: this.options.maxRetryAttempts,
      endedAt: null,
      errorClass: null,
      requestBytes: null,
      retainedChildCount: null,
      startedAt: Date.now(),
    };
    state.auditAbort = new AbortController();
    state.state = kind === "question" ? "question-auditing" : "auditing";
    await this.status.set(state, state.state, kind === "question" ? "Auditing pending question" : "Auditing completion", "info");
    void this.runAudit(state, inspection, epoch).catch((error) =>
      this.owningFailure(state, `${kind} audit`, error)
    );
  }

  private async runAudit(
    state: RootState,
    inspection: RootInspection,
    epoch: AuditEpoch,
    retryReason: string | null = null,
  ): Promise<void> {
    if (this.disposed || !this.isCurrentAudit(state, epoch)) return;
    try {
      const auditSignal = state.auditAbort?.signal;
      epoch.attempt += 1;
      state.auditDiagnostics.attempt = epoch.attempt;
      const completionEvidence = epoch.completionEvidence ?? captureArbiterEvidence(
        epoch.rootSessionID,
        epoch.rootRef,
        this.input.directory,
        state.root.metadata,
      );
      epoch.completionEvidence = completionEvidence;
      const promptText = retryReason == null
        ? buildArbiterAuditRequest(epoch, inspection, completionEvidence)
        : buildArbiterRetryRequest(epoch, retryReason);
      const slot = await sharedArbiterScheduler(
        this.options.arbiterActiveLimit,
        this.options.arbiterQueueLimit,
      ).acquire(state.root.id, epoch.auditID, auditSignal);
      if (slot === "overload") throw new Error("Arbiter scheduler queue limit reached");
      if (slot !== "acquired") return;
      if (!this.isCurrentAudit(state, epoch)) {
        sharedArbiterScheduler().release(state.root.id, epoch.auditID);
        return;
      }
      try {
      state.auditDiagnostics.requestBytes = requireBoundedRequest(promptText, this.options.maxRequestBytes);
      const { child, retainedChildCount, route } = await ensureArbiterChild(
        this.client,
        this.input.directory,
        this.options.arbiterAgent,
        state,
        epoch,
        this.options.retainAuditSessions,
        Math.min(
          Number.MAX_SAFE_INTEGER,
          this.options.arbiterPromptTimeoutMs + Math.max(this.options.settleMs, 1_000),
        ),
      );
      if (retainedChildCount != null) state.auditDiagnostics.retainedChildCount = retainedChildCount;
      if (!this.isCurrentAudit(state, epoch)) return;
      await this.status.persist(state);
      if (!this.isCurrentAudit(state, epoch)) return;
      const result = await dataOf<{ info: Record<string, unknown>; parts: unknown[] }>(
        withTimeout((signal) => this.client.session.prompt({
          sessionID: child.id,
          directory: this.input.directory,
          agent: this.options.arbiterAgent,
          model: route.model,
          ...(route.variant == null ? {} : { variant: route.variant }),
          tools: route.tools,
          parts: [{
            type: "text",
            text: promptText,
            synthetic: true,
            metadata: { provenance: "completion-guard", auditID: epoch.auditID },
          }],
        }, { signal }) as Promise<unknown>, this.options.arbiterPromptTimeoutMs, auditSignal),
        "session.prompt completion arbiter",
      );
      if (!this.isCurrentAudit(state, epoch)) return;
      const assistantError = record(result.info.error);
      if (assistantError != null) {
        const error = new Error("Completion arbiter returned an assistant error") as Error & { cause?: unknown };
        error.cause = assistantError;
        throw error;
      }
      const verdict = parseCompletionVerdictText(result.parts, epoch);
      state.auditDiagnostics.endedAt = Date.now();
      await this.applyVerdict(state, epoch, verdict);
      } finally {
        sharedArbiterScheduler().release(state.root.id, epoch.auditID);
      }
    } catch (error) {
      if (state.auditAbort?.signal.aborted || state.activeAudit?.auditID !== epoch.auditID || state.paused) return;
      await this.retryAudit(state, inspection, epoch, error);
    }
  }

  private async retryAudit(state: RootState, inspection: RootInspection, epoch: AuditEpoch, error: unknown): Promise<void> {
    if (!this.isCurrentAudit(state, epoch)) return;
    const errorClass = auditErrorClass(error);
    state.auditDiagnostics.errorClass = errorClass;
    if (error instanceof AuditRequestOverflowError) {
      state.auditDiagnostics.allowedRequestBytes = error.allowedBytes;
      state.auditDiagnostics.requestBytes = error.observedBytes;
    }
    if (errorClass !== "transient" || epoch.attempt >= this.options.maxRetryAttempts) {
      state.auditDiagnostics.endedAt = Date.now();
      const details = safeError(error, epoch.rootSessionID);
      await this.log("error", "completion audit stopped", {
        attempt: epoch.attempt,
        attemptLimit: this.options.maxRetryAttempts,
        auditRef: hashRef("audit", epoch.auditID),
        elapsedMs: Math.max(0, state.auditDiagnostics.endedAt - (state.auditDiagnostics.startedAt ?? state.auditDiagnostics.endedAt)),
        error: details,
        errorClass,
        requestBytes: state.auditDiagnostics.requestBytes,
        rootRef: epoch.rootRef,
      });
      await this.updateAuditMetadata(epoch, "error", undefined, undefined, errorClass);
      if (!this.isCurrentAudit(state, epoch)) return;
      await this.status.set(
        state,
        "error",
        error instanceof AuditRequestOverflowError
          ? `Completion evidence overflow: ${error.observedBytes} bytes exceeds ${error.allowedBytes}`
          : `Completion audit stopped (${errorClass}) after ${epoch.attempt}/${this.options.maxRetryAttempts} attempts`,
        "error",
      );
      if (!this.isCurrentAudit(state, epoch)) return;
      this.cancelAudit(state, "error");
      return;
    }
    state.state = "audit-retrying";
    const delay = Math.min(
      this.options.maxDelayMs,
      Math.round(this.options.initialDelayMs * this.options.retryMultiplier ** Math.max(0, epoch.attempt - 1)),
    );
    await this.log("warn", "completion audit retry scheduled", {
      attempt: epoch.attempt,
      attemptLimit: this.options.maxRetryAttempts,
      auditRef: hashRef("audit", epoch.auditID),
      error: safeError(error, epoch.rootSessionID),
      nextDelayMs: delay,
      rootRef: epoch.rootRef,
    });
    if (!this.isCurrentAudit(state, epoch)) return;
    await this.status.set(state, "audit-retrying", `Completion audit retrying in ${delay}ms`, "warning");
    if (!this.isCurrentAudit(state, epoch)) return;
    await this.updateAuditMetadata(epoch, "retrying", delay);
    if (!this.isCurrentAudit(state, epoch)) return;
    const details = safeError(error, epoch.rootSessionID);
    const retryReason = details.message ?? "Previous arbiter response was unavailable or invalid";
    state.retryTimer = setTimeout(() => {
      state.retryTimer = null;
      void this.runAudit(state, inspection, epoch, retryReason);
    }, delay);
  }

  private async updateAuditMetadata(
    epoch: AuditEpoch,
    status: string,
    nextDelayMs?: number,
    verdict?: CompletionVerdict,
    errorClass?: string,
  ): Promise<void> {
    if (epoch.childSessionID == null) return;
    const state = this.roots.get(epoch.rootSessionID);
    try {
      const child = await this.session(epoch.childSessionID);
      await ensureNoError(this.client.session.update({
        sessionID: child.id,
        directory: this.input.directory,
        metadata: {
          ...(child.metadata ?? {}),
          completionGuard: {
            ...(record(child.metadata?.completionGuard) ?? {}),
            status,
            attempt: epoch.attempt,
            attemptLimit: this.options.maxRetryAttempts,
            allowedRequestBytes: this.options.maxRequestBytes,
            ...(state?.auditDiagnostics.startedAt == null ? {} : { startedAt: state.auditDiagnostics.startedAt }),
            ...(state?.auditDiagnostics.endedAt == null ? {} : {
              elapsedMs: Math.max(0, state.auditDiagnostics.endedAt - (state.auditDiagnostics.startedAt ?? state.auditDiagnostics.endedAt)),
              endedAt: state.auditDiagnostics.endedAt,
            }),
            ...(state?.auditDiagnostics.requestBytes == null ? {} : { requestBytes: state.auditDiagnostics.requestBytes }),
            ...(state?.auditDiagnostics.retainedChildCount == null ? {} : {
              retainedChildCount: state.auditDiagnostics.retainedChildCount,
            }),
            ...(errorClass == null ? {} : { errorClass }),
            ...(nextDelayMs == null ? {} : { nextDelayMs }),
            ...(verdict == null ? {} : {
              confidence: verdict.confidence,
              requirementCount: verdict.requirementMatrix.length,
              unresolvedCount: verdict.unresolved.length,
              verdict: verdict.verdict,
            }),
          },
        },
      }) as Promise<unknown>, "session.update audit metadata");
    } catch (error) {
      await this.log("warn", "audit metadata update failed", {
        auditRef: hashRef("audit", epoch.auditID),
        error: safeError(error, epoch.rootSessionID),
      });
    }
  }

  private async currentInspection(state: RootState, epoch: AuditEpoch): Promise<RootInspection | null> {
    if (!this.isCurrentAudit(state, epoch)) return null;
    const current = await this.inspectRoot(state);
    if (!this.isCurrentAudit(state, epoch)) return null;
    if (current.revision.revisionDigest !== epoch.inspected.revisionDigest) {
      await this.updateAuditMetadata(epoch, "stale");
      this.cancelAudit(state, "stale");
      return null;
    }
    return current;
  }

  private isCurrentAudit(state: RootState, epoch: AuditEpoch): boolean {
    return (
      state.grindEnabled &&
      !state.paused &&
      state.activeAudit?.auditID === epoch.auditID &&
      state.auditAbort?.signal.aborted !== true
    );
  }

  private async applyVerdict(
    state: RootState,
    epoch: AuditEpoch,
    verdict: CompletionVerdict,
  ): Promise<void> {
    const current = await this.currentInspection(state, epoch);
    if (current == null) return;
    if (epoch.kind === "question") {
      await this.applyQuestionVerdict(state, epoch, verdict);
      return;
    }
    if (verdict.verdict === "user_paused") {
      await this.pause(state.root.id, "current arbiter interruption evidence");
      await this.updateAuditMetadata(epoch, "user-paused");
      return;
    }
    if (verdict.verdict === "allow_stop") {
      state.lastAuditedRevision = epoch.inspected.revisionDigest;
      await this.updateAuditMetadata(epoch, "passed", undefined, verdict);
      if (!this.isCurrentAudit(state, epoch)) return;
      await this.status.set(state, "passed", "Completion guard passed", "success");
      if (!this.isCurrentAudit(state, epoch)) return;
      this.cancelAudit(state, "passed");
      return;
    }
    if (verdict.verdict === "owner_required") {
      await this.updateAuditMetadata(epoch, "owner-required", undefined, verdict);
      if (!this.isCurrentAudit(state, epoch)) return;
      await this.injectOwnerRequired(state, epoch, verdict);
      return;
    }
    const fingerprint = strategyFingerprint(verdict);
    const repeated = verdict.strategyAssessment.repeated || state.lastStrategyFingerprint === fingerprint;
    const requireTroubleshooter = repeated && !hasVerifiedTroubleshooter(current.context, fingerprint);
    if (this.options.maxCycles >= 0 && state.continuationCycles >= this.options.maxCycles) {
      await this.injectCycleBudgetHandoff(state, epoch);
      return;
    }
    const continuation = buildContinuation(
      verdict,
      restoredPromptContext(state.root, state.promptContext),
      current.journal.relativePath,
      requireTroubleshooter,
      fingerprint,
    );
    const final = await this.currentInspection(state, epoch);
    if (final == null) return;
    await this.status.set(state, "continuation-pending", "Continuing root session", "info");
    if (!this.isCurrentAudit(state, epoch)) return;
    await ensureNoError(this.client.session.promptAsync({
      sessionID: state.root.id,
      directory: state.root.directory,
      ...(continuation.context.agent == null ? {} : { agent: continuation.context.agent }),
      ...(continuation.context.model == null ? {} : { model: continuation.context.model }),
      ...(continuation.context.variant == null ? {} : { variant: continuation.context.variant }),
      ...(continuation.context.tools == null ? {} : { tools: continuation.context.tools }),
      parts: [continuation.part],
    }, { signal: state.auditAbort?.signal }) as Promise<unknown>, "session.promptAsync root continuation");
    if (!this.isCurrentAudit(state, epoch)) return;
    state.continuationCycles += 1;
    state.lastStrategyFingerprint = fingerprint;
    state.guardTurnPending = true;
    await this.updateAuditMetadata(epoch, "continued", undefined, verdict);
    this.cancelAudit(state, "running");
    await this.status.persist(state);
  }

  private async applyQuestionVerdict(
    state: RootState,
    epoch: AuditEpoch,
    verdict: CompletionVerdict,
  ): Promise<void> {
    const requestID = epoch.questionRequest?.requestID;
    if (requestID == null) {
      this.cancelAudit(state, "stale");
      return;
    }
    const question = state.questions.get(requestID);
    if (question == null || question.state !== "open") {
      this.cancelAudit(state, "stale");
      return;
    }
    if (verdict.verdict === "user_paused") {
      await this.pause(state.root.id, "question audit found current pause evidence");
      return;
    }
    if (verdict.verdict === "owner_required") {
      question.state = "owner-required";
      await this.updateAuditMetadata(epoch, "owner-required", undefined, verdict);
      if (!this.isCurrentAudit(state, epoch)) return;
      await this.status.set(state, "owner-required", "Owner response required", "warning");
      if (!this.isCurrentAudit(state, epoch)) return;
      this.cancelAudit(state, "owner-required");
      return;
    }
    if (verdict.verdict !== "continue" && verdict.verdict !== "allow_stop") {
      throw new Error("Pending question audit requires autonomous, owner_required, or user_paused verdict");
    }
    if (verdict.questionAnswers == null) {
      throw new Error("Autonomous pending question verdict requires validated questionAnswers");
    }
    const requestRef = hashRef("question", requestID);
    const callRef = question.request.toolCallID == null ? null : hashRef("call", question.request.toolCallID);
    if (
      !state.autonomousQuestionRefs.has(requestRef) &&
      !state.pendingAutonomousQuestionRefs.has(requestRef) &&
      state.autonomousQuestionRefs.size + state.pendingAutonomousQuestionRefs.size >= MAX_AUTONOMOUS_QUESTION_REFS
    ) {
      throw new Error("Autonomous question provenance capacity is exhausted");
    }
    question.state = "guard-answering";
    state.pendingAutonomousQuestionRefs.add(requestRef);
    if (callRef != null) state.pendingAutonomousQuestionCalls.set(requestRef, callRef);
    await this.status.set(state, "question-answering", "Answering autonomous question", "info");
    if (!this.isCurrentAudit(state, epoch)) return;
    if (!await this.status.persist(state)) {
      state.pendingAutonomousQuestionRefs.delete(requestRef);
      state.pendingAutonomousQuestionCalls.delete(requestRef);
      question.state = "open";
      throw new Error("Autonomous question provenance persistence failed");
    }
    if (!this.isCurrentAudit(state, epoch) || question.state !== "guard-answering" || question.replyObserved) {
      state.pendingAutonomousQuestionRefs.delete(requestRef);
      state.pendingAutonomousQuestionCalls.delete(requestRef);
      if (question.replyObserved) {
        question.state = "human-replied";
        this.cancelAudit(state, "running");
      }
      await this.status.persist(state);
      return;
    }
    try {
      await ensureNoError(this.client.question.reply({
        requestID,
        directory: this.input.directory,
        answers: verdict.questionAnswers,
      }, { signal: state.auditAbort?.signal }) as Promise<unknown>, "question.reply");
    } catch (error) {
      if (!this.isCurrentAudit(state, epoch)) return;
      if (hasErrorName(error, "QuestionNotFoundError") && !question.replyObserved) {
        state.pendingAutonomousQuestionRefs.delete(requestRef);
        state.pendingAutonomousQuestionCalls.delete(requestRef);
        question.state = "human-replied";
        await this.status.persist(state);
        this.cancelAudit(state, "running");
        return;
      }
      if (question.replyObserved) {
        question.state = "resolution-unknown";
        await this.status.persist(state);
        this.cancelAudit(state, "running");
        return;
      }
      state.pendingAutonomousQuestionRefs.delete(requestRef);
      state.pendingAutonomousQuestionCalls.delete(requestRef);
      question.state = "open";
      await this.status.persist(state);
      throw error;
    }
    if (!this.isCurrentAudit(state, epoch)) return;
    if (question.replyObserved) {
      question.state = "resolution-unknown";
      this.cancelAudit(state, "running");
      await this.status.persist(state);
      return;
    }
    state.pendingAutonomousQuestionRefs.delete(requestRef);
    state.pendingAutonomousQuestionCalls.delete(requestRef);
    state.autonomousQuestionRefs.add(requestRef);
    if (callRef != null) state.autonomousQuestionCalls.set(requestRef, callRef);
    question.state = "guard-answered";
    await this.updateAuditMetadata(epoch, "question-answered", undefined, verdict);
    if (!this.isCurrentAudit(state, epoch)) return;
    if (!await this.status.persist(state)) {
      question.state = "resolution-unknown";
      throw new Error("Autonomous question confirmation persistence failed");
    }
    this.cancelAudit(state, "running");
    await this.status.persist(state);
  }

  private async onQuestionAsked(sessionID: string, properties: Record<string, unknown>): Promise<void> {
    const state = await this.tryRoot(sessionID);
    if (state == null || state.root.id !== sessionID || !state.grindEnabled || state.paused) return;
    let request: NormalizedQuestionRequest;
    try {
      request = normalizeQuestionRequest(properties);
    } catch (error) {
      await this.owningFailure(state, "pending question normalization", error);
      return;
    }
    const requestID = request.requestID;
    this.cancelAudit(state, "question-pending");
    state.questions.set(requestID, {
      auditID: null,
      replyObserved: false,
      request,
      state: "open",
    });
    const inspection = await this.inspectRoot(state);
    await this.beginAudit(state, inspection, "question", request);
    const question = state.questions.get(requestID);
    if (question != null) question.auditID = state.activeAudit?.auditID ?? null;
  }

  private async onQuestionReplied(sessionID: string, requestID: string | null): Promise<void> {
    if (requestID == null) return;
    const state = await this.tryRoot(sessionID);
    const question = state?.questions.get(requestID);
    if (state == null || !state.grindEnabled || question == null) return;
    if (question.state === "open") {
      question.state = "human-replied";
      if (state.activeAudit?.questionRequest?.requestID === requestID) this.cancelAudit(state, "running");
      return;
    }
    if (question.state === "guard-answering") question.replyObserved = true;
  }

  private async injectOwnerRequired(state: RootState, epoch: AuditEpoch, verdict: CompletionVerdict): Promise<void> {
    const context = restoredPromptContext(state.root, state.promptContext);
    const payload = {
      schemaVersion: 1,
      provenance: "completion-guard",
      verdict: "owner_required",
      auditID: epoch.auditID,
      ownerBoundary: verdict.ownerBoundary,
      unresolved: verdict.unresolved,
      evidenceRefs: verdict.evidenceRefs,
      evidenceGaps: verdict.evidenceGaps,
      instruction: "Render the repository self-contained owner handoff. Do not answer or weaken the protected boundary.",
    };
    const current = await this.currentInspection(state, epoch);
    if (current == null) return;
    state.guardTurnPending = true;
    await ensureNoError(this.client.session.promptAsync({
      sessionID: state.root.id,
      directory: state.root.directory,
      ...(context.agent == null ? {} : { agent: context.agent }),
      ...(context.model == null ? {} : { model: context.model }),
      ...(context.variant == null ? {} : { variant: context.variant }),
      ...(context.tools == null ? {} : { tools: context.tools }),
      parts: [{
        type: "text",
        synthetic: true,
        text: `<completion_guard_owner_required>\n${JSON.stringify(payload, null, 2).slice(0, 8_000)}\n</completion_guard_owner_required>`,
        metadata: { provenance: "completion-guard", auditID: epoch.auditID },
      }],
    }, { signal: state.auditAbort?.signal }) as Promise<unknown>, "session.promptAsync owner handoff");
    if (!this.isCurrentAudit(state, epoch)) return;
    state.paused = true;
    state.guardTurnPending = true;
    this.cancelAudit(state, "owner-required");
    await this.status.set(state, "owner-required", "Owner response required", "warning");
  }

  private async injectCycleBudgetHandoff(state: RootState, epoch: AuditEpoch): Promise<void> {
    const context = restoredPromptContext(state.root, state.promptContext);
    state.guardTurnPending = true;
    await ensureNoError(this.client.session.promptAsync({
      sessionID: state.root.id,
      directory: state.root.directory,
      ...(context.agent == null ? {} : { agent: context.agent }),
      ...(context.model == null ? {} : { model: context.model }),
      ...(context.variant == null ? {} : { variant: context.variant }),
      ...(context.tools == null ? {} : { tools: context.tools }),
      parts: [{
        type: "text",
        synthetic: true,
        text: `<completion_guard_owner_required audit_id="${epoch.auditID}">The configured finite continuation-cycle budget is exhausted. Render an exact owner handoff without claiming completion.</completion_guard_owner_required>`,
        metadata: { provenance: "completion-guard", auditID: epoch.auditID },
      }],
    }, { signal: state.auditAbort?.signal }) as Promise<unknown>, "session.promptAsync cycle budget handoff");
    if (!this.isCurrentAudit(state, epoch)) return;
    state.paused = true;
    state.guardTurnPending = true;
    this.cancelAudit(state, "owner-required");
    await this.status.set(state, "owner-required", "Owner response required", "warning");
  }

  private async owningFailure(state: RootState, boundary: string, error: unknown): Promise<void> {
    if (hasErrorName(error, "NotFoundError")) {
      this.clearRoot(state.root.id);
      return;
    }
    if (!state.grindEnabled) return;
    this.cancelAudit(state, "error");
    const errorClass = auditErrorClass(error);
    await this.log("error", `${boundary} failed`, {
      error: safeError(error, state.root.id),
      errorClass,
      guardCapability: boundary,
      rootRef: hashRef("session", state.root.id),
    });
    await this.status.set(
      state,
      "error",
      errorClass === "capability"
        ? `${boundary} unavailable under configured permissions; guard is fail-closed`
        : `${boundary} failed; guard is fail-closed`,
      "error",
    );
  }

  private clearRoot(sessionID: string): void {
    const direct = this.roots.get(sessionID);
    const affected = direct == null
      ? [...this.roots.values()].filter((state) => state.root.id === sessionID)
      : [direct];
    for (const state of affected) {
      if (state.settleTimer != null) clearTimeout(state.settleTimer);
      this.clearWaitRecheck(state);
      this.cancelAudit(state);
      this.leases.clearRoot(state.root.id);
      this.ptyFallback.clearRoot(state.root.id);
      this.roots.delete(state.root.id);
    }
  }

  async dispose(): Promise<void> {
    if (this.disposed) return;
    this.disposed = true;
    removeSessionUpdateCallback(this.ptyUpdate);
    this.ptyFallback.dispose();
    for (const state of this.roots.values()) {
      if (state.settleTimer != null) clearTimeout(state.settleTimer);
      this.clearWaitRecheck(state);
      this.cancelAudit(state);
    }
    this.roots.clear();
    this.leases.clear();
  }
}

export async function createSessionCompletionGuard(
  input: PluginInput,
  rawOptions: Record<string, unknown>,
  client: OpencodeClient,
): Promise<Hooks> {
  const controller = new SessionCompletionController(input, rawOptions, client);
  if (!controller.options.enabled) return {};
  return controller.start();
}
