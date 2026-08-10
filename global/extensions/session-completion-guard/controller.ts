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
  buildArbiterAuditRequest,
  buildArbiterRetryRequest,
  captureArbiterEvidence,
} from "./arbiter-evidence.ts";
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
import {
  applyMainPermissionAllow,
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
import {
  hasVerifiedTroubleshooter,
  strategyFingerprint,
} from "./strategy.ts";
import type {
  AuditEpoch,
  CompletionVerdict,
  GuardOptions,
  RootState,
} from "./types.ts";
import { buildContinuation, parseCompletionVerdictText } from "./verdict.ts";
type LogLevel = "debug" | "error" | "info" | "warn";
export class SessionCompletionController {
  readonly client: OpencodeClient;
  readonly leases: AsyncLeaseRegistry;
  readonly options: GuardOptions;
  private readonly input: PluginInput;
  private readonly roots = new Map<string, RootState>();
  private readonly ptyFallback: PtyFallbackScheduler;
  private readonly status: GuardStatusReporter;
  private disposed = false;
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
    return {
      config: async (config) => {
        applyMainPermissionAllow(config);
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

  private async log(level: LogLevel, message: string, extra: Record<string, unknown> = {}): Promise<void> {
    try {
      await this.input.client.app.log({
        body: { service: "session-completion-guard", level, message, extra },
      });
    } catch {
      // Logging must not change guard behavior.
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
    this.cancelQuestionCorrection(state);
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
    this.cancelQuestionCorrection(state);
    this.cancelAudit(state, action === "enable" ? "running" : "disabled");
    if (action === "enable") {
      state.grindEnabled = true;
      await this.status.set(state, "running", "Grind enabled for this session", "success");
      return;
    }
    state.grindEnabled = false;
    state.questions.clear();
    this.leases.clearRoot(state.root.id);
    this.ptyFallback.clearRoot(state.root.id);
    await this.status.set(state, "disabled", "Grind disabled for this session", "info");
  }

  private async onEvent(event: Record<string, unknown>): Promise<void> {
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
    if (type === "message.updated") {
      const info = record(properties.info);
      if (info?.role === "assistant") {
        const state = await this.tryRoot(sessionID);
        if (state != null && state.root.id === sessionID) {
          const messageID = stringValue(info.id);
          if (messageID != null && messageID !== state.lastAssistantID) {
            state.lastAssistantID = messageID;
            if (!state.controlTurnPending) state.guardTurnPending = false;
            state.compacting = false;
            this.invalidateAudit(state.root.id, "assistant revision changed");
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
    this.cancelQuestionCorrection(state);
    this.cancelAudit(state, "paused");
    await this.status.set(state, "paused", `Guard paused: ${reason}`, "warning");
  }

  private scheduleIdle(state: RootState): void {
    if (
      this.disposed ||
      !state.grindEnabled ||
      state.paused ||
      state.compacting ||
      state.guardTurnPending ||
      state.activeAudit != null ||
      state.settleTimer != null
    ) return;
    state.state = "settling-idle";
    const generation = this.leases.generation(state.root.id);
    state.settleTimer = setTimeout(() => {
      state.settleTimer = null;
      void this.handleSettledIdle(state, generation).catch((error) => this.owningFailure(state, "idle preflight", error));
    }, this.options.settleMs);
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
      state.paused ||
      state.compacting ||
      state.guardTurnPending ||
      state.activeAudit != null
    ) return;
    if (state.pendingQuestionCorrection != null) {
      await this.deliverQuestionCorrection(state);
      return;
    }
    const statuses = await this.sessionStatuses();
    if (statuses[state.root.id] != null && statuses[state.root.id]?.type !== "idle") {
      state.state = "running";
      return;
    }
    const children = await this.childStatuses(state, statuses);
    const preflight = this.leases.preflight(state.root.id, SHARED_PTY_MANAGER.list(), children);
    if (preflight.generation !== expectedGeneration) {
      state.state = "stale";
      return;
    }
    if (preflight.kind !== "clear") {
      await this.status.set(
        state,
        preflight.kind === "unknown" ? "error" : "waiting-async",
        preflight.reason,
        preflight.kind === "unknown" ? "error" : "info",
      );
      return;
    }
    const inspection = await this.inspectRoot(state);
    if (inspection.revision.leaseGeneration !== expectedGeneration) return;
    if (state.lastAuditedRevision === inspection.revision.revisionDigest && state.state === "passed") return;
    await this.beginAudit(state, inspection, "completion", null);
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
    questionRequestID: string | null,
  ): Promise<void> {
    if (!state.grindEnabled || state.activeAudit != null) return;
    const auditID = createAuditID(state.root.id, inspection.revision.revisionDigest, `${kind}:${questionRequestID ?? ""}`);
    const epoch: AuditEpoch = {
      auditID,
      attempt: 0,
      childSessionID: null,
      completionEvidence: null,
      inspected: inspection.revision,
      kind,
      questionRequestID,
      rootRef: hashRef("session", state.root.id),
      rootSessionID: state.root.id,
    };
    state.activeAudit = epoch;
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
      const completionEvidence = epoch.completionEvidence ?? captureArbiterEvidence(epoch.rootSessionID, epoch.rootRef);
      epoch.completionEvidence = completionEvidence;
      const { child, route } = await ensureArbiterChild(
        this.client,
        this.input.directory,
        this.options.arbiterAgent,
        state,
        epoch,
      );
      if (!this.isCurrentAudit(state, epoch)) return;
      await this.status.persist(state);
      if (!this.isCurrentAudit(state, epoch)) return;
      const result = await dataOf<{ info: Record<string, unknown>; parts: unknown[] }>(
        this.client.session.prompt({
          sessionID: child.id,
          directory: this.input.directory,
          agent: this.options.arbiterAgent,
          model: route.model,
          ...(route.variant == null ? {} : { variant: route.variant }),
          tools: route.tools,
          parts: [{
            type: "text",
            text: retryReason == null
              ? buildArbiterAuditRequest(epoch, inspection, completionEvidence)
              : buildArbiterRetryRequest(epoch, retryReason),
            synthetic: true,
            metadata: { provenance: "completion-guard", auditID: epoch.auditID },
          }],
        }, { signal: auditSignal }) as Promise<unknown>,
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
      await this.applyVerdict(state, epoch, verdict);
    } catch (error) {
      if (state.auditAbort?.signal.aborted || state.activeAudit?.auditID !== epoch.auditID || state.paused) return;
      await this.retryAudit(state, inspection, epoch, error);
    }
  }

  private async retryAudit(state: RootState, inspection: RootInspection, epoch: AuditEpoch, error: unknown): Promise<void> {
    if (!this.isCurrentAudit(state, epoch)) return;
    state.state = "audit-retrying";
    const delay = Math.min(
      this.options.maxDelayMs,
      Math.round(this.options.initialDelayMs * this.options.retryMultiplier ** Math.max(0, epoch.attempt - 1)),
    );
    await this.log("warn", "completion audit retry scheduled", {
      attempt: epoch.attempt,
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
  ): Promise<void> {
    if (epoch.childSessionID == null) return;
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
    const requireTroubleshooter = repeated && !hasVerifiedTroubleshooter(current.context);
    if (this.options.maxCycles >= 0 && state.continuationCycles >= this.options.maxCycles) {
      await this.injectCycleBudgetHandoff(state, epoch);
      return;
    }
    const continuation = buildContinuation(
      verdict,
      restoredPromptContext(state.root, state.promptContext),
      current.journal.relativePath,
      requireTroubleshooter,
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
    const requestID = epoch.questionRequestID;
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
    question.state = "guard-rejecting";
    await ensureNoError(
      this.client.question.reject(
        { requestID, directory: this.input.directory },
        { signal: state.auditAbort?.signal },
      ) as Promise<unknown>,
      "question.reject",
    );
    if (!this.isCurrentAudit(state, epoch)) return;
    if (state.questions.get(requestID)?.state === "human-replied") {
      this.cancelAudit(state, "stale");
      return;
    }
    question.state = "guard-rejected";
    state.pendingQuestionCorrection = hashRef("question", requestID);
    await this.updateAuditMetadata(epoch, "question-rejected", undefined, verdict);
    this.cancelAudit(state, "question-pending");
  }

  private async onQuestionAsked(sessionID: string, properties: Record<string, unknown>): Promise<void> {
    const state = await this.tryRoot(sessionID);
    if (state == null || state.root.id !== sessionID || !state.grindEnabled || state.paused) return;
    const requestID = stringValue(properties.id) ?? stringValue(properties.requestID);
    if (requestID == null) return;
    this.cancelAudit(state, "question-pending");
    state.questions.set(requestID, { auditID: null, requestID, state: "open" });
    const inspection = await this.inspectRoot(state);
    await this.beginAudit(state, inspection, "question", requestID);
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
      if (state.activeAudit?.questionRequestID === requestID) this.cancelAudit(state, "running");
    }
  }

  private async deliverQuestionCorrection(state: RootState): Promise<void> {
    const requestRef = state.pendingQuestionCorrection;
    if (requestRef == null || !state.grindEnabled || state.paused) return;
    state.pendingQuestionCorrection = null;
    const correctionAbort = new AbortController();
    state.questionCorrectionAbort = correctionAbort;
    const context = restoredPromptContext(state.root, state.promptContext);
    try {
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
          text: `<completion_guard_question_correction request_ref="${requestRef}">The completion guard, not the human user, rejected this autonomous question. Continue the safe bounded work and preserve the unanswered owner boundary.</completion_guard_question_correction>`,
          metadata: { provenance: "completion-guard", requestRef, intervention: "guard-rejected" },
        }],
      }, { signal: correctionAbort.signal }) as Promise<unknown>, "session.promptAsync question correction");
    } catch (error) {
      if (correctionAbort.signal.aborted) return;
      throw error;
    } finally {
      if (state.questionCorrectionAbort === correctionAbort) state.questionCorrectionAbort = null;
    }
    if (correctionAbort.signal.aborted || !state.grindEnabled) return;
    state.guardTurnPending = true;
    state.state = "running";
  }

  private cancelQuestionCorrection(state: RootState): void {
    state.questionCorrectionAbort?.abort();
    state.questionCorrectionAbort = null;
    state.pendingQuestionCorrection = null;
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
    state.guardTurnPending = true;
    this.cancelAudit(state, "owner-required");
    await this.status.set(state, "owner-required", "Owner response required", "warning");
  }

  private async injectCycleBudgetHandoff(state: RootState, epoch: AuditEpoch): Promise<void> {
    const context = restoredPromptContext(state.root, state.promptContext);
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
    state.guardTurnPending = true;
    this.cancelAudit(state, "owner-required");
  }

  private async owningFailure(state: RootState, boundary: string, error: unknown): Promise<void> {
    if (hasErrorName(error, "NotFoundError")) {
      this.clearRoot(state.root.id);
      return;
    }
    if (!state.grindEnabled) return;
    this.cancelAudit(state, "error");
    await this.log("error", `${boundary} failed`, {
      error: safeError(error, state.root.id),
      rootRef: hashRef("session", state.root.id),
    });
    await this.status.set(state, "error", `${boundary} failed; guard is fail-closed`, "error");
  }

  private clearRoot(sessionID: string): void {
    const direct = this.roots.get(sessionID);
    const affected = direct == null
      ? [...this.roots.values()].filter((state) => state.root.id === sessionID)
      : [direct];
    for (const state of affected) {
      if (state.settleTimer != null) clearTimeout(state.settleTimer);
      this.cancelQuestionCorrection(state);
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
      this.cancelQuestionCorrection(state);
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
