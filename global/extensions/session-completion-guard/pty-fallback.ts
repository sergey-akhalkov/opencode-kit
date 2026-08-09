import type { OpencodeClient } from "@opencode-ai/sdk/v2";
import type { PTYSessionInfo } from "opencode-pty/plugin/pty/types";
import { hashRef } from "../../plugin/session-delivery-context/redaction.ts";
import type { AsyncLeaseRegistry } from "./leases.ts";
import { ensureNoError, restoredPromptContext } from "./runtime-support.ts";
import type { RootState } from "./types.ts";

type FallbackDependencies = {
  client: OpencodeClient;
  leases: AsyncLeaseRegistry;
  resolveRoot(rootSessionID: string): Promise<RootState | null>;
  settleMs: number;
  onFailure(state: RootState, boundary: string, error: unknown): Promise<void>;
};

export class PtyFallbackScheduler {
  private readonly dependencies: FallbackDependencies;
  private readonly timers = new Map<string, {
    rootSessionID: string;
    timer: ReturnType<typeof setTimeout>;
  }>();

  constructor(dependencies: FallbackDependencies) {
    this.dependencies = dependencies;
  }

  schedule(rootSessionID: string, ptyID: string, info: PTYSessionInfo): void {
    if (this.timers.has(ptyID)) return;
    const timer = setTimeout(() => {
      this.timers.delete(ptyID);
      void this.send(rootSessionID, ptyID, info).catch(async (error) => {
        const state = await this.dependencies.resolveRoot(rootSessionID);
        if (state != null) await this.dependencies.onFailure(state, "PTY fallback notification", error);
      });
    }, this.dependencies.settleMs);
    this.timers.set(ptyID, { rootSessionID, timer });
  }

  private async send(rootSessionID: string, ptyID: string, info: PTYSessionInfo): Promise<void> {
    const lease = this.dependencies.leases.getPtyLease(ptyID);
    if (lease == null || lease.notificationConsumed || lease.fallbackSent) return;
    const state = await this.dependencies.resolveRoot(rootSessionID);
    const currentLease = this.dependencies.leases.getPtyLease(ptyID);
    if (
      state == null ||
      !state.grindEnabled ||
      state.paused ||
      currentLease !== lease ||
      currentLease.notificationConsumed ||
      currentLease.fallbackSent
    ) return;
    const context = restoredPromptContext(state.root, state.promptContext);
    await ensureNoError(this.dependencies.client.session.promptAsync({
      sessionID: rootSessionID,
      directory: state.root.directory,
      ...(context.agent == null ? {} : { agent: context.agent }),
      ...(context.model == null ? {} : { model: context.model }),
      ...(context.variant == null ? {} : { variant: context.variant }),
      ...(context.tools == null ? {} : { tools: context.tools }),
      parts: [{
        type: "text",
        synthetic: true,
        text: [
          "<pty_exited>",
          `ID: ${ptyID}`,
          `Status: ${info.status}`,
          `Exit Code: ${info.exitCode ?? "unknown"}`,
          `Timed Out: ${info.timedOut ? "yes" : "no"}`,
          "Notification Source: completion-guard-fallback",
          "</pty_exited>",
        ].join("\n"),
        metadata: { provenance: "completion-guard-pty-fallback", ptyRef: hashRef("pty", ptyID) },
      }],
    }) as Promise<unknown>, "session.promptAsync PTY fallback");
    this.dependencies.leases.markFallbackSent(ptyID);
    state.guardTurnPending = true;
  }

  clearRoot(rootSessionID: string): void {
    for (const [ptyID, pending] of this.timers) {
      if (pending.rootSessionID !== rootSessionID) continue;
      clearTimeout(pending.timer);
      this.timers.delete(ptyID);
    }
  }

  dispose(): void {
    for (const pending of this.timers.values()) clearTimeout(pending.timer);
    this.timers.clear();
  }
}
