import type { OpencodeClient, Session } from "@opencode-ai/sdk/v2";
import { hashRef } from "../../plugin/session-delivery-context/redaction.ts";
import { dataOf, ensureNoError, safeError, stableDigest } from "./runtime-support.ts";
import type { RootState } from "./types.ts";

export const STATUS_CONVERGENCE_PASSES = 8;
export const STATUS_CONVERGENCE_MS = 2_000;

type StatusDependencies = {
  client: OpencodeClient;
  monitor?: { observe(state: RootState): Promise<void> };
  statusToasts: boolean;
  log(level: "warn", message: string, extra: Record<string, unknown>): Promise<void>;
};

function provenanceSnapshot(state: RootState) {
  return {
    autonomousQuestionCalls: [...state.autonomousQuestionCalls].sort(([left], [right]) => left.localeCompare(right)).map(
      ([requestRef, callRef]) => ({ requestRef, callRef }),
    ),
    autonomousQuestionRefs: [...state.autonomousQuestionRefs].sort(),
    pendingAutonomousQuestionCalls: [...state.pendingAutonomousQuestionCalls].sort(
      ([left], [right]) => left.localeCompare(right),
    ).map(([requestRef, callRef]) => ({ requestRef, callRef })),
    pendingAutonomousQuestionRefs: [...state.pendingAutonomousQuestionRefs].sort(),
  };
}

export class GuardStatusReporter {
  private readonly dependencies: StatusDependencies;
  private readonly writes = new Map<string, Promise<boolean>>();

  constructor(dependencies: StatusDependencies) {
    this.dependencies = dependencies;
  }

  async persist(state: RootState): Promise<boolean> {
    const previous = this.writes.get(state.root.id) ?? Promise.resolve(true);
    const write = previous.catch(() => false).then(() => this.persistConverged(state));
    this.writes.set(state.root.id, write);
    const persisted = await write;
    if (this.writes.get(state.root.id) === write) this.writes.delete(state.root.id);
    if (state.grindEnabled) {
      try {
        await this.dependencies.monitor?.observe(state);
      } catch (error) {
        await this.dependencies.log("warn", "guard monitor observation failed", {
          error: safeError(error, state.root.id),
          rootRef: hashRef("session", state.root.id),
        });
      }
    }
    return persisted;
  }

  private async persistConverged(state: RootState): Promise<boolean> {
    const startedAt = Date.now();
    let passes = 0;
    let lastDigest = "";
    while (passes < STATUS_CONVERGENCE_PASSES && Date.now() - startedAt < STATUS_CONVERGENCE_MS) {
      passes += 1;
      const terminalCertificate = state.terminalCertificate ?? {
        challenge: null,
        deadlineAt: null,
        evidenceRefs: [],
        issuer: null,
        reason: null,
        status: "not-configured" as const,
      };
      const guard = {
        schemaVersion: 1,
        state: state.state,
        grindEnabled: state.grindEnabled,
        paused: state.paused,
        continuationCycles: state.continuationCycles,
        auditDiagnostics: { ...state.auditDiagnostics },
        restartRecoveryAction: state.restartRecoveryAction,
        waitReason: state.waitReason,
        waitRecheckCount: state.waitRecheckCount,
        lastAuditedRevision: state.lastAuditedRevision,
        lastStrategyFingerprint: state.lastStrategyFingerprint,
        ...provenanceSnapshot(state),
        rootRef: hashRef("session", state.root.id),
        ...(state.statusMessage == null ? {} : { message: state.statusMessage.slice(0, 500) }),
        terminalCertificate: { ...terminalCertificate },
        updatedAt: Date.now(),
      };
      const metadata = {
        ...(state.root.metadata ?? {}),
        completionGuard: guard,
      };
      try {
        state.root = await dataOf<Session>(this.dependencies.client.session.update({
          sessionID: state.root.id,
          directory: state.root.directory,
          metadata,
        }) as Promise<unknown>, "session.update guard status");
      } catch (error) {
        await this.dependencies.log("warn", "guard status persistence failed", {
          error: safeError(error, state.root.id),
          rootRef: hashRef("session", state.root.id),
        });
        return false;
      }
      const currentProvenance = provenanceSnapshot(state);
      if (
        guard.state === state.state &&
        guard.grindEnabled === state.grindEnabled &&
        guard.paused === state.paused &&
        guard.continuationCycles === state.continuationCycles &&
        guard.lastAuditedRevision === state.lastAuditedRevision &&
        guard.lastStrategyFingerprint === state.lastStrategyFingerprint &&
        JSON.stringify(guard.auditDiagnostics) === JSON.stringify(state.auditDiagnostics) &&
        guard.restartRecoveryAction === state.restartRecoveryAction &&
        guard.waitReason === state.waitReason &&
        guard.waitRecheckCount === state.waitRecheckCount &&
        JSON.stringify(guard.terminalCertificate) === JSON.stringify(state.terminalCertificate ?? terminalCertificate) &&
        JSON.stringify(guard.autonomousQuestionCalls) === JSON.stringify(currentProvenance.autonomousQuestionCalls) &&
        JSON.stringify(guard.autonomousQuestionRefs) === JSON.stringify(currentProvenance.autonomousQuestionRefs) &&
        JSON.stringify(guard.pendingAutonomousQuestionCalls) === JSON.stringify(currentProvenance.pendingAutonomousQuestionCalls) &&
        JSON.stringify(guard.pendingAutonomousQuestionRefs) === JSON.stringify(currentProvenance.pendingAutonomousQuestionRefs) &&
        (guard.message ?? null) === (state.statusMessage?.slice(0, 500) ?? null)
      ) return true;
      lastDigest = stableDigest({
        state: state.state,
        grindEnabled: state.grindEnabled,
        paused: state.paused,
        lastAuditedRevision: state.lastAuditedRevision,
        waitReason: state.waitReason,
        waitRecheckCount: state.waitRecheckCount,
      });
    }
    await this.dependencies.log("warn", "guard status persistence exhausted", {
      elapsedMs: Date.now() - startedAt,
      lastStateDigest: lastDigest,
      passes,
      rootRef: hashRef("session", state.root.id),
    });
    return false;
  }

  async set(
    state: RootState,
    next: RootState["state"],
    message: string,
    variant: "error" | "info" | "success" | "warning",
  ): Promise<void> {
    state.state = next;
    state.statusMessage = message;
    const key = `${next}:${message}`;
    if (state.lastStatusKey === key) return;
    state.lastStatusKey = key;
    await this.persist(state);
    if (!this.dependencies.statusToasts) return;
    try {
      await ensureNoError(this.dependencies.client.tui.showToast({
        directory: state.root.directory,
        title: "Session completion guard",
        message,
        variant,
        duration: variant === "success" ? 3_000 : 5_000,
      }) as Promise<unknown>, "tui.showToast");
    } catch (error) {
      await this.dependencies.log("warn", "guard toast failed", {
        error: safeError(error, state.root.id),
        rootRef: hashRef("session", state.root.id),
      });
    }
  }
}
