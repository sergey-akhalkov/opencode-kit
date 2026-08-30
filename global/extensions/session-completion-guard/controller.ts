import type { Hooks, PluginInput, ToolContext } from "@opencode-ai/plugin";
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
import {
  GRIND_FRONTIER_INPUT_SCHEMA,
  GRIND_FRONTIER_TOOL,
  materializeWorkFrontier,
  projectPersistedWorkFrontier,
  workFrontierBasisStatus,
} from "./frontier.ts";
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
  stableDigest,
  stringValue,
} from "./runtime-support.ts";
import { GuardStatusReporter } from "./status.ts";
import { sendTaskFallback } from "./task-fallback.ts";
import {
  executionEpochDisposition,
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
  QuestionDeferralProvenance,
  QuestionState,
  RootState,
} from "./types.ts";
import { buildContinuation, parseCompletionVerdictText } from "./verdict.ts";
type LogLevel = "debug" | "error" | "info" | "warn";
const MAX_AUTONOMOUS_QUESTION_REFS = 1_024;
class ArbiterPromptTimeoutError extends Error {
  readonly timeoutMs: number;

  constructor(timeoutMs: number) {
    super(`Completion arbiter prompt timed out after ${timeoutMs}ms`);
    this.name = "ArbiterPromptTimeoutError";
    this.timeoutMs = timeoutMs;
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
  private readonly frontierWrites = new Set<string>();
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
      tool: {
        [GRIND_FRONTIER_TOOL]: {
          args: { input: GRIND_FRONTIER_INPUT_SCHEMA as never },
          description: "Atomically replace the current root's bounded task-scoped work frontier under an expected server generation. Root, latest-human, task-state, and runnable identities are controller-derived.",
          execute: async (args: unknown, context: ToolContext) => this.updateWorkFrontier(args, context),
        },
      },
      event: async ({ event }) => this.onEvent(event as unknown as Record<string, unknown>),
      dispose: async () => this.dispose(),
    };
  }

  private async updateWorkFrontier(args: unknown, context: ToolContext) {
    const state = await this.tryRoot(context.sessionID);
    if (state == null || !state.grindEnabled) throw new Error("grind_frontier requires an enabled grind root");
    if (state.root.id !== context.sessionID) throw new Error("grind_frontier may only be called from its parentless main root");
    if (state.paused) throw new Error("grind_frontier cannot update a paused root");
    if (state.frontierStatus === "invalid") throw new Error(`grind_frontier cannot replace invalid persisted state: ${state.frontierError ?? "unknown"}`);
    if (this.frontierWrites.has(state.root.id)) throw new Error("grind_frontier update already in progress for this root");
    this.frontierWrites.add(state.root.id);
    try {
      const inspection = await this.inspectRoot(state);
      const persisted = projectPersistedWorkFrontier(state.root.metadata);
      if (persisted.status === "invalid") {
        throw new Error(`grind_frontier cannot replace invalid persisted state: ${persisted.errorCode ?? "unknown"}`);
      }
      state.workFrontier = persisted.assessment?.frontier ?? null;
      const input = record(args)?.input;
      const assessment = materializeWorkFrontier(input, {
        basisHumanRef: inspection.revision.humanRef,
        currentGeneration: persisted.assessment?.frontier.frontierGeneration ?? 0,
        taskStateDigest: inspection.revision.todoDigest,
      });
      const previous = {
        continuationCycles: state.continuationCycles,
        frontierError: state.frontierError,
        frontierReconciliationRef: state.frontierReconciliationRef,
        frontierStatus: state.frontierStatus,
        lastAuditedRevision: state.lastAuditedRevision,
        lastProgressFingerprint: state.lastProgressFingerprint,
        restartRecoveryAction: state.restartRecoveryAction,
        waitReason: state.waitReason,
        workFrontier: state.workFrontier,
      };
      if (state.lastProgressFingerprint !== assessment.frontier.progressFingerprint) {
        state.continuationCycles = 0;
      }
      state.workFrontier = assessment.frontier;
      state.frontierStatus = "current";
      state.frontierError = null;
      state.frontierReconciliationRef = null;
      state.lastAuditedRevision = null;
      state.lastProgressFingerprint = assessment.frontier.progressFingerprint;
      state.restartRecoveryAction = "frontier-updated";
      state.waitReason = null;
      this.cancelAudit(state, "running");
      if (!await this.status.persist(state)) {
        Object.assign(state, previous);
        await this.status.persist(state);
        throw new Error("grind_frontier persistence did not converge");
      }
      const metadata = {
        frontierState: assessment.frontierState,
        openGateRefs: assessment.openGateRefs,
        parkedDecisionRefs: assessment.parkedDecisionRefs,
        rootRef: hashRef("session", state.root.id),
        runnableItemRefs: assessment.runnableItemRefs,
        serverGeneration: assessment.frontier.frontierGeneration,
      };
      context.metadata({ title: "Grind work frontier", metadata });
      return { title: "Grind work frontier", metadata, output: `${JSON.stringify(metadata, null, 2)}\n` };
    } finally {
      this.frontierWrites.delete(state.root.id);
    }
  }

  private async reconcileRoots(): Promise<void> {
    const roots = sessionRows(await dataOf<unknown>(
      this.client.v2.session.list({ directory: this.input.directory, roots: true, limit: 500 } as never) as Promise<unknown>,
      "session.list grind recovery",
    ));
    for (const candidate of roots.filter((row) => row.parentID == null)) {
      const root = await this.session(candidate.id);
      if (record(root.metadata?.completionGuard)?.grindEnabled !== true) continue;
      const state = this.stateFor(root);
      if (state.frontierStatus === "invalid") {
        await this.status.set(state, "error", `Persisted work frontier is invalid: ${state.frontierError ?? "unknown"}`, "error");
        continue;
      }
      if (state.frontierStatus === "absent") {
        state.recoveryAudit = null;
        state.lastAuditedRevision = null;
        state.restartRecoveryAction = "frontier-missing";
        await this.status.persist(state);
        this.scheduleIdle(state);
        continue;
      }
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
        if (metadata.schemaVersion !== 2) {
          await dataOf<Session>(this.client.session.update({
            sessionID: child.id,
            directory: this.input.directory,
            metadata: {
              ...(child.metadata ?? {}),
              completionGuard: {
                ...metadata,
                staleReason: "unsupported-verdict-schema-after-restart",
                status: "stale",
              },
            },
          }) as Promise<unknown>, "session.update legacy audit stale");
          state.recoveryAudit = null;
          state.lastAuditedRevision = null;
          state.restartRecoveryAction = "reconcile-legacy-verdict";
          await this.status.persist(state);
          this.scheduleIdle(state);
          continue;
        }
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
    if (state.frontierStatus !== "invalid") {
      state.frontierStatus = state.workFrontier == null ? "absent" : "stale";
      state.frontierError = null;
      state.lastAuditedRevision = null;
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
      if (state.frontierStatus === "invalid") {
        await this.status.set(state, "error", `Persisted work frontier is invalid: ${state.frontierError ?? "unknown"}`, "error");
        return;
      }
      state.frontierError = null;
      state.frontierStatus = state.workFrontier == null ? "absent" : "unverified";
      state.frontierReconciliationRef = null;
      await this.status.set(state, "frontier-reconciling", "Grind enabled; work frontier reconciliation required", "success");
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
    if (type === "question.rejected" || type === "question.v2.rejected") {
      await this.onQuestionRejected(sessionID, stringValue(properties.requestID));
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
      if (state != null && state.root.id === sessionID) {
        const deferred = [...state.questions.entries()].find(([, question]) => question.state === "guard-deferred");
        if (deferred != null) await this.finishQuestionDeferral(state, deferred[0]);
        else this.scheduleIdle(state);
      }
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

  private async reconcileWorkFrontier(state: RootState, inspection: RootInspection, reason: "missing" | "stale"): Promise<void> {
    const reconciliationRef = stableDigest({
      humanRef: inspection.revision.humanRef,
      taskStateDigest: inspection.revision.todoDigest,
    });
    state.frontierStatus = reason === "missing" ? "absent" : "stale";
    state.frontierError = null;
    state.lastAuditedRevision = null;
    if (state.frontierReconciliationRef === reconciliationRef) {
      await this.status.set(state, "frontier-reconciling", `Work frontier ${reason}; awaiting the bounded reconciliation turn`, "warning");
      return;
    }
    state.frontierReconciliationRef = reconciliationRef;
    state.restartRecoveryAction = `frontier-${reason}`;
    await this.status.set(state, "frontier-reconciling", `Work frontier ${reason}; starting one bounded reconciliation turn`, "warning");
    const context = restoredPromptContext(state.root, state.promptContext);
    const payload = {
      schemaVersion: 1,
      provenance: "completion-guard",
      reason,
      basisHumanRef: inspection.revision.humanRef,
      taskStateDigest: inspection.revision.todoDigest,
      expectedGeneration: state.workFrontier?.frontierGeneration ?? 0,
      instruction: "Reconcile the current accepted work into one complete bounded grind_frontier input. Use only explicit current requirements, task state, decisions, and evidence. Call grind_frontier exactly once; do not ask a question, dispatch work, infer protected authority, or claim completion.",
    };
    state.guardTurnPending = true;
    await ensureNoError(this.client.session.promptAsync({
      sessionID: state.root.id,
      directory: state.root.directory,
      ...(context.agent == null ? {} : { agent: context.agent }),
      ...(context.model == null ? {} : { model: context.model }),
      ...(context.variant == null ? {} : { variant: context.variant }),
      parts: [{
        type: "text",
        synthetic: true,
        text: `<grind_frontier_reconciliation>\n${JSON.stringify(payload, null, 2)}\n</grind_frontier_reconciliation>`,
        metadata: { provenance: "completion-guard", reconciliationRef },
      }],
    }) as Promise<unknown>, "session.promptAsync frontier reconciliation");
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
    if (state.frontierStatus === "invalid") {
      await this.status.set(state, "error", `Persisted work frontier is invalid: ${state.frontierError ?? "unknown"}`, "error");
      return;
    }
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
    const frontierBasis = workFrontierBasisStatus(state.workFrontier, {
      humanRef: inspection.revision.humanRef,
      taskStateDigest: inspection.revision.todoDigest,
    });
    if (frontierBasis !== "current") {
      await this.reconcileWorkFrontier(state, inspection, frontierBasis === "absent" ? "missing" : "stale");
      return;
    }
    if (state.frontierStatus !== "current") {
      state.frontierStatus = "current";
      state.frontierError = null;
      state.frontierReconciliationRef = null;
      state.restartRecoveryAction = "frontier-verified";
      await this.status.persist(state);
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
        requestContributions: error instanceof AuditRequestOverflowError ? error.contributions : [],
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
      state.waitReason = null;
      state.lastAuditedRevision = epoch.inspected.revisionDigest;
      await this.updateAuditMetadata(epoch, "passed", undefined, verdict);
      if (!this.isCurrentAudit(state, epoch)) return;
      await this.status.set(state, "passed", "Completion guard passed", "success");
      if (!this.isCurrentAudit(state, epoch)) return;
      this.cancelAudit(state, "passed");
      return;
    }
    if (verdict.verdict === "product_decision_required") {
      await this.updateAuditMetadata(epoch, "product-decision-required", undefined, verdict);
      if (!this.isCurrentAudit(state, epoch)) return;
      await this.injectProductDecision(state, epoch, verdict);
      return;
    }
    if (verdict.verdict === "waiting") {
      await this.enterWaiting(state, epoch, verdict);
      return;
    }
    await this.continueFromVerdict(state, epoch, verdict, current);
  }

  private async continueFromVerdict(
    state: RootState,
    epoch: AuditEpoch,
    verdict: CompletionVerdict,
    current: RootInspection,
  ): Promise<void> {
    const fingerprint = strategyFingerprint(verdict);
    const repeated = verdict.strategyAssessment.repeated || state.lastStrategyFingerprint === fingerprint;
    const requireTroubleshooter = repeated && !hasVerifiedTroubleshooter(current.context, fingerprint);
    const epochDisposition = executionEpochDisposition({
      continuationCycles: state.continuationCycles,
      maxCycles: this.options.maxCycles,
      repeated,
    });
    if (epochDisposition === "wait-budget") {
      await this.enterBudgetWaiting(state, epoch, verdict);
      return;
    }
    if (epochDisposition === "rollover") {
      state.continuationCycles = 0;
      state.restartRecoveryAction = "execution-epoch-rolled-over";
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

  private async enterWaiting(state: RootState, epoch: AuditEpoch, verdict: CompletionVerdict): Promise<void> {
    state.waitReason = `${verdict.waitKind ?? "unknown"}: ${verdict.resumeCondition ?? "resume condition unavailable"}`;
    state.restartRecoveryAction = `waiting:${verdict.waitKind ?? "unknown"}`;
    await this.updateAuditMetadata(epoch, "waiting", undefined, verdict);
    if (!this.isCurrentAudit(state, epoch)) return;
    this.cancelAudit(state, "waiting");
    await this.status.set(state, "waiting", `Mission incomplete; waiting for ${state.waitReason}`, "warning");
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
    if (verdict.verdict === "product_decision_required" && verdict.questionAction === "present-product-decision") {
      question.state = "product-decision-required";
      await this.updateAuditMetadata(epoch, "product-decision-required", undefined, verdict);
      if (!this.isCurrentAudit(state, epoch)) return;
      await this.status.set(state, "product-decision-required", "Product decision required", "warning");
      if (!this.isCurrentAudit(state, epoch)) return;
      this.cancelAudit(state, "product-decision-required");
      return;
    }
    if (verdict.questionAction === "defer") {
      await this.deferQuestion(state, epoch, verdict, requestID, question);
      return;
    }
    if (verdict.verdict !== "continue" && verdict.verdict !== "allow_stop") {
      throw new Error("Pending question audit requires answer, deferral, product decision, or user pause");
    }
    if (verdict.questionAction !== "answer" || verdict.questionAnswers == null) {
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

  private async deferQuestion(
    state: RootState,
    epoch: AuditEpoch,
    verdict: CompletionVerdict,
    requestID: string,
    question: QuestionState,
  ): Promise<void> {
    if (verdict.verdict !== "continue" && verdict.verdict !== "waiting") {
      throw new Error("Deferred question verdict must continue or wait");
    }
    const requestRef = hashRef("question", requestID);
    const callRef = question.request.toolCallID == null ? null : hashRef("call", question.request.toolCallID);
    const parkedDecisionRef = verdict.parkedDecisionRefs[0] ?? null;
    const deferredGateRef = verdict.deferredGateRefs[0] ?? null;
    if ((parkedDecisionRef == null) === (deferredGateRef == null)) {
      throw new Error("Deferred question requires exactly one blocker provenance ref");
    }
    if (
      !state.deferredQuestionProvenance.has(requestRef) &&
      !state.pendingQuestionDeferralProvenance.has(requestRef) &&
      state.deferredQuestionProvenance.size + state.pendingQuestionDeferralProvenance.size >= MAX_AUTONOMOUS_QUESTION_REFS
    ) {
      throw new Error("Deferred question provenance capacity is exhausted");
    }
    const provenance: QuestionDeferralProvenance = {
      blockerKind: parkedDecisionRef == null ? "gate" : "parked-decision",
      blockerRef: parkedDecisionRef ?? deferredGateRef!,
      callRef,
      disposition: verdict.verdict,
      requestRef,
      selectedItemRef: verdict.selectedItemRef,
    };
    question.state = "guard-deferring";
    question.deferredVerdict = verdict;
    state.pendingQuestionDeferralProvenance.set(requestRef, provenance);
    state.restartRecoveryAction = "question-deferral-pending";
    await this.status.set(state, "question-deferring", "Persisting question deferral before rejection", "info");
    if (!this.isCurrentAudit(state, epoch)) return;
    if (!await this.status.persist(state)) {
      state.pendingQuestionDeferralProvenance.delete(requestRef);
      question.state = "open";
      question.deferredVerdict = null;
      state.restartRecoveryAction = null;
      throw new Error("Question deferral provenance persistence failed");
    }
    if (!this.isCurrentAudit(state, epoch) || question.state !== "guard-deferring" || question.replyObserved) {
      state.pendingQuestionDeferralProvenance.delete(requestRef);
      if (question.replyObserved) {
        this.markDeferredQuestionHumanResolved(state, requestID, question);
      }
      await this.status.persist(state);
      return;
    }
    try {
      await ensureNoError(this.client.question.reject({
        requestID,
        directory: state.root.directory,
      }, { signal: state.auditAbort?.signal }) as Promise<unknown>, "question.reject");
    } catch (error) {
      if (!this.isCurrentAudit(state, epoch)) return;
      if (question.replyObserved) {
        this.markDeferredQuestionHumanResolved(state, requestID, question);
        await this.status.persist(state);
        return;
      }
      question.state = "resolution-unknown";
      state.restartRecoveryAction = "question-deferral-resolution-unknown";
      this.cancelAudit(state, "error");
      await this.status.persist(state);
      await this.log("error", "question rejection resolution is unknown", {
        error: safeError(error, state.root.id),
        requestRef,
        rootRef: hashRef("session", state.root.id),
      });
      return;
    }
    if (!this.isCurrentAudit(state, epoch)) return;
    if (question.replyObserved) {
      this.markDeferredQuestionHumanResolved(state, requestID, question);
      await this.status.persist(state);
      return;
    }
    state.pendingQuestionDeferralProvenance.delete(requestRef);
    state.deferredQuestionProvenance.set(requestRef, provenance);
    question.state = "guard-deferred";
    question.deferredVerdict = verdict;
    state.restartRecoveryAction = "question-deferral-confirmed-awaiting-idle";
    await this.updateAuditMetadata(epoch, "question-deferred", undefined, verdict);
    if (!this.isCurrentAudit(state, epoch)) return;
    await this.status.set(state, "question-deferring", "Question rejected; awaiting post-rejection idle", "info");
    if (!this.isCurrentAudit(state, epoch)) return;
    if (!await this.status.persist(state)) {
      state.deferredQuestionProvenance.delete(requestRef);
      state.pendingQuestionDeferralProvenance.set(requestRef, provenance);
      question.state = "resolution-unknown";
      question.deferredVerdict = null;
      state.restartRecoveryAction = "question-deferral-resolution-unknown";
      this.cancelAudit(state, "error");
      await this.status.persist(state);
      return;
    }
    const statuses = await this.sessionStatuses();
    if (statuses[state.root.id]?.type === "idle" || statuses[state.root.id] == null) {
      await this.finishQuestionDeferral(state, requestID);
    }
  }

  private async finishQuestionDeferral(state: RootState, requestID: string): Promise<void> {
    const question = state.questions.get(requestID);
    const epoch = state.activeAudit;
    const verdict = question?.deferredVerdict;
    if (
      question == null || question.state !== "guard-deferred" || question.replyObserved ||
      epoch == null || epoch.questionRequest?.requestID !== requestID || verdict == null ||
      !this.isCurrentAudit(state, epoch)
    ) return;
    const current = await this.currentInspection(state, epoch);
    if (current == null || !this.isCurrentAudit(state, epoch)) return;
    question.deferredVerdict = null;
    state.restartRecoveryAction = "question-deferral-confirmed";
    if (verdict.verdict === "waiting") {
      await this.enterWaiting(state, epoch, verdict);
      return;
    }
    if (verdict.verdict !== "continue") {
      throw new Error("Confirmed question deferral has an invalid disposition");
    }
    await this.continueFromVerdict(state, epoch, verdict, current);
  }

  private markDeferredQuestionHumanResolved(state: RootState, requestID: string, question: QuestionState): void {
    const requestRef = hashRef("question", requestID);
    state.pendingQuestionDeferralProvenance.delete(requestRef);
    state.deferredQuestionProvenance.delete(requestRef);
    question.deferredVerdict = null;
    question.state = "human-replied";
    state.paused = false;
    state.restartRecoveryAction = null;
    state.waitReason = null;
    if (state.frontierStatus !== "invalid") {
      state.frontierStatus = state.workFrontier == null ? "absent" : "stale";
      state.lastAuditedRevision = null;
    }
    this.cancelAudit(state, "running");
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
      deferredVerdict: null,
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
    if (question.state === "open" || question.state === "product-decision-required") {
      question.state = "human-replied";
      state.paused = false;
      state.waitReason = null;
      if (state.frontierStatus !== "invalid") {
        state.frontierStatus = state.workFrontier == null ? "absent" : "stale";
        state.lastAuditedRevision = null;
      }
      if (state.activeAudit?.questionRequest?.requestID === requestID) this.cancelAudit(state, "running");
      await this.status.persist(state);
      return;
    }
    if (question.state === "guard-answering" || question.state === "guard-deferring") question.replyObserved = true;
    if (question.state === "guard-deferred") {
      question.replyObserved = true;
      this.markDeferredQuestionHumanResolved(state, requestID, question);
      await this.status.persist(state);
    }
  }

  private async onQuestionRejected(sessionID: string, requestID: string | null): Promise<void> {
    if (requestID == null) return;
    const state = await this.tryRoot(sessionID);
    const question = state?.questions.get(requestID);
    if (state == null || !state.grindEnabled || question == null) return;
    if (question.state === "guard-deferring" || question.state === "guard-deferred") {
      return;
    }
    if (question.state === "open" || question.state === "product-decision-required") {
      question.state = "human-replied";
      state.paused = false;
      state.waitReason = null;
      if (state.frontierStatus !== "invalid") {
        state.frontierStatus = state.workFrontier == null ? "absent" : "stale";
        state.lastAuditedRevision = null;
      }
      if (state.activeAudit?.questionRequest?.requestID === requestID) this.cancelAudit(state, "running");
      await this.status.persist(state);
    }
  }

  private async injectProductDecision(state: RootState, epoch: AuditEpoch, verdict: CompletionVerdict): Promise<void> {
    const context = restoredPromptContext(state.root, state.promptContext);
    const payload = {
      schemaVersion: 2,
      provenance: "completion-guard",
      verdict: "product_decision_required",
      auditID: epoch.auditID,
      ownerBoundary: verdict.ownerBoundary,
      parkedDecisionRefs: verdict.parkedDecisionRefs,
      unresolved: verdict.unresolved,
      evidenceRefs: verdict.evidenceRefs,
      evidenceGaps: verdict.evidenceGaps,
      instruction: "Present only this exact material product decision. Do not answer it, weaken its consequences, or request a non-product action.",
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
      parts: [{
        type: "text",
        synthetic: true,
        text: `<completion_guard_product_decision>\n${JSON.stringify(payload, null, 2).slice(0, 8_000)}\n</completion_guard_product_decision>`,
        metadata: { provenance: "completion-guard", auditID: epoch.auditID },
      }],
    }, { signal: state.auditAbort?.signal }) as Promise<unknown>, "session.promptAsync product decision");
    if (!this.isCurrentAudit(state, epoch)) return;
    state.paused = true;
    state.guardTurnPending = true;
    state.waitReason = null;
    this.cancelAudit(state, "product-decision-required");
    await this.status.set(state, "product-decision-required", "Product decision required", "warning");
  }

  private async enterBudgetWaiting(state: RootState, epoch: AuditEpoch, verdict: CompletionVerdict): Promise<void> {
    state.waitReason = "budget: execution epoch exhausted without a causally distinct strategy";
    state.restartRecoveryAction = "execution-epoch-budget-wait";
    await this.updateAuditMetadata(epoch, "waiting", undefined, verdict);
    if (!this.isCurrentAudit(state, epoch)) return;
    this.cancelAudit(state, "waiting");
    await this.status.set(state, "waiting", `Mission incomplete; waiting for ${state.waitReason}`, "warning");
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
