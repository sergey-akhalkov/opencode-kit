import type { OpencodeClient, Session } from "@opencode-ai/sdk/v2";
import { hashRef } from "../../plugin/session-delivery-context/redaction.ts";
import { dataOf, ensureNoError, safeError } from "./runtime-support.ts";
import type { RootState } from "./types.ts";

type StatusDependencies = {
  client: OpencodeClient;
  monitor?: { observe(state: RootState): Promise<void> };
  statusToasts: boolean;
  log(level: "warn", message: string, extra: Record<string, unknown>): Promise<void>;
};

export class GuardStatusReporter {
  private readonly dependencies: StatusDependencies;
  private readonly writes = new Map<string, Promise<void>>();

  constructor(dependencies: StatusDependencies) {
    this.dependencies = dependencies;
  }

  async persist(state: RootState): Promise<void> {
    const previous = this.writes.get(state.root.id) ?? Promise.resolve();
    const write = previous.catch(() => undefined).then(() => this.persistConverged(state));
    this.writes.set(state.root.id, write);
    await write;
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
  }

  private async persistConverged(state: RootState): Promise<void> {
    while (true) {
      const guard = {
        schemaVersion: 1,
        state: state.state,
        grindEnabled: state.grindEnabled,
        paused: state.paused,
        continuationCycles: state.continuationCycles,
        lastAuditedRevision: state.lastAuditedRevision,
        lastStrategyFingerprint: state.lastStrategyFingerprint,
        rootRef: hashRef("session", state.root.id),
        ...(state.statusMessage == null ? {} : { message: state.statusMessage.slice(0, 500) }),
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
        return;
      }
      if (
        guard.state === state.state &&
        guard.grindEnabled === state.grindEnabled &&
        guard.paused === state.paused &&
        guard.continuationCycles === state.continuationCycles &&
        guard.lastAuditedRevision === state.lastAuditedRevision &&
        guard.lastStrategyFingerprint === state.lastStrategyFingerprint &&
        (guard.message ?? null) === (state.statusMessage?.slice(0, 500) ?? null)
      ) return;
    }
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
