import type { PTYSessionInfo } from "opencode-pty/plugin/pty/types";
import type { PreflightResult, PtyLease, TaskLease } from "./types.ts";

type PendingSpawn = {
  args: Record<string, unknown>;
  callID: string;
  rootSessionID: string;
};

type ChildStatus = {
  id: string;
  status: "idle" | "running" | "unknown";
};

type LeaseCallbacks = {
  onGeneration(rootSessionID: string): void;
  onTerminalPty(rootSessionID: string, lease: PtyLease, info: PTYSessionInfo): void;
};

function stringValue(value: unknown): string | null {
  return typeof value === "string" && value !== "" ? value : null;
}

function terminalStatus(status: string): status is "exited" | "killed" {
  return status === "exited" || status === "killed";
}

export class AsyncLeaseRegistry {
  private readonly callbacks: LeaseCallbacks;
  private readonly generationByRoot = new Map<string, number>();
  private readonly pendingSpawns = new Map<string, PendingSpawn>();
  private readonly ptyByID = new Map<string, PtyLease>();
  private readonly tasksByCall = new Map<string, TaskLease>();
  private readonly terminalTombstones = new Map<string, PTYSessionInfo>();

  constructor(callbacks: LeaseCallbacks) {
    this.callbacks = callbacks;
  }

  generation(rootSessionID: string): number {
    return this.generationByRoot.get(rootSessionID) ?? 0;
  }

  getPtyLease(ptyID: string): PtyLease | null {
    return this.ptyByID.get(ptyID) ?? null;
  }

  private changed(rootSessionID: string): void {
    this.generationByRoot.set(rootSessionID, this.generation(rootSessionID) + 1);
    this.callbacks.onGeneration(rootSessionID);
  }

  beforeTool(
    tool: string,
    rootSessionID: string,
    callID: string,
    args: Record<string, unknown>,
  ): void {
    if (tool === "pty_spawn" && args.notifyOnExit === true) {
      this.pendingSpawns.set(callID, { args, callID, rootSessionID });
      this.changed(rootSessionID);
      return;
    }
    if (tool === "task") {
      this.tasksByCall.set(callID, {
        callID,
        childSessionID: null,
        resultConsumed: false,
        rootSessionID,
        status: "running",
      });
      this.changed(rootSessionID);
    }
  }

  afterTool(
    tool: string,
    rootSessionID: string,
    callID: string,
    output: string,
    metadata: Record<string, unknown> | null,
    managerGet: (id: string) => PTYSessionInfo | null,
  ): void {
    if (tool === "pty_spawn") {
      const pending = this.pendingSpawns.get(callID);
      this.pendingSpawns.delete(callID);
      if (pending == null) return;
      const ptyID = output.match(/\bID:\s*(pty_[A-Za-z0-9_-]+)/)?.[1] ?? stringValue(metadata?.id);
      if (ptyID == null) {
        this.tasksByCall.delete(callID);
        this.changed(rootSessionID);
        return;
      }
      const tombstone = this.terminalTombstones.get(ptyID);
      const live = managerGet(ptyID);
      const observed = tombstone ?? live;
      const status = observed?.status ?? "unknown";
      const lease: PtyLease = {
        awaited: true,
        fallbackSent: false,
        notificationConsumed: false,
        ptyID,
        rootSessionID: pending.rootSessionID,
        runtimeGeneration: this.generation(rootSessionID),
        spawnCallID: callID,
        status,
        terminalAt: terminalStatus(status) ? Date.now() : null,
      };
      this.ptyByID.set(ptyID, lease);
      this.changed(rootSessionID);
      if (observed != null && terminalStatus(observed.status)) {
        this.callbacks.onTerminalPty(rootSessionID, lease, observed);
      }
      return;
    }
    if (tool === "pty_kill") {
      const ptyID = output.match(/\b(pty_[A-Za-z0-9_-]+)\b/)?.[1];
      if (ptyID != null) {
        const lease = this.ptyByID.get(ptyID);
        if (lease != null) {
          const live = managerGet(ptyID);
          lease.status = live?.status ?? "killed";
          lease.terminalAt = Date.now();
          this.changed(lease.rootSessionID);
        }
      }
      return;
    }
    if (tool !== "task") return;
    const lease = this.tasksByCall.get(callID);
    if (lease == null) return;
    const child = stringValue(metadata?.sessionID) ??
      stringValue(metadata?.sessionId) ??
      stringValue(metadata?.childSessionID) ??
      output.match(/\b(?:session|child|task)(?:ID|_id| id)?[:=]\s*(session_[A-Za-z0-9_-]+)/i)?.[1] ??
      null;
    lease.childSessionID = child;
    const background = /\b(?:background|running|started|task_id|notifyOnExit)\b/i.test(output);
    lease.status = background ? "running" : "completed";
    lease.resultConsumed = !background;
    this.changed(rootSessionID);
  }

  onManagerUpdate(info: PTYSessionInfo): void {
    const lease = this.ptyByID.get(info.id);
    if (lease == null) {
      if (terminalStatus(info.status)) this.terminalTombstones.set(info.id, info);
      return;
    }
    if (terminalStatus(lease.status)) return;
    lease.status = info.status;
    if (terminalStatus(info.status)) {
      lease.terminalAt = Date.now();
      this.terminalTombstones.set(info.id, info);
      this.callbacks.onTerminalPty(lease.rootSessionID, lease, info);
    }
    this.changed(lease.rootSessionID);
  }

  markFallbackSent(ptyID: string): void {
    const lease = this.ptyByID.get(ptyID);
    if (lease == null || lease.fallbackSent) return;
    lease.fallbackSent = true;
    this.changed(lease.rootSessionID);
  }

  consumeSynthetic(rootSessionID: string, text: string): void {
    if (/<pty_exited\b/i.test(text)) {
      const ptyID = text.match(/(?:^|\n)ID:\s*(pty_[A-Za-z0-9_-]+)(?:\s|$)/i)?.[1];
      const lease = ptyID == null ? null : this.ptyByID.get(ptyID);
      if (lease != null && lease.rootSessionID === rootSessionID) {
        lease.notificationConsumed = true;
        this.changed(rootSessionID);
      }
    }
    if (/<task_(?:result|error)\b/i.test(text)) {
      const explicit = [...this.tasksByCall.values()].find((lease) =>
        lease.rootSessionID === rootSessionID &&
        (text.includes(lease.callID) || (lease.childSessionID != null && text.includes(lease.childSessionID)))
      );
      const open = [...this.tasksByCall.values()].filter(
        (lease) => lease.rootSessionID === rootSessionID && !lease.resultConsumed,
      );
      const lease = explicit ?? (open.length === 1 ? open[0] : null);
      if (lease != null) {
        lease.status = /<task_error\b/i.test(text) ? "error" : "completed";
        lease.resultConsumed = true;
        this.changed(rootSessionID);
      }
    }
  }

  preflight(
    rootSessionID: string,
    managerSessions: PTYSessionInfo[],
    children: ChildStatus[],
  ): PreflightResult {
    const generation = this.generation(rootSessionID);
    for (const info of managerSessions) {
      if (info.notifyOnExit && info.status === "running" && !this.ptyByID.has(info.id)) {
        return { kind: "unknown", reason: "unattributed awaited PTY is running", generation };
      }
    }
    for (const lease of this.ptyByID.values()) {
      if (lease.rootSessionID !== rootSessionID || !lease.awaited) continue;
      if (lease.status === "unknown") {
        return { kind: "unknown", reason: "awaited PTY status is unknown", generation };
      }
      if (!terminalStatus(lease.status)) {
        return { kind: "waiting", reason: "awaited PTY is active", generation };
      }
      if (!lease.notificationConsumed) {
        return { kind: "waiting", reason: "awaited PTY exit notification is pending", generation };
      }
    }
    const childByID = new Map(children.map((child) => [child.id, child.status]));
    for (const lease of this.tasksByCall.values()) {
      if (lease.rootSessionID !== rootSessionID || lease.resultConsumed) continue;
      if (lease.childSessionID == null) {
        return { kind: "unknown", reason: "background task child attribution is unknown", generation };
      }
      const status = childByID.get(lease.childSessionID) ?? "unknown";
      if (status === "unknown") {
        return { kind: "unknown", reason: "background child status is unknown", generation };
      }
      if (status === "running" || lease.status === "running") {
        return { kind: "waiting", reason: "background child is running", generation };
      }
      return { kind: "waiting", reason: "background result has not reached the root", generation };
    }
    return { kind: "clear", generation };
  }

  clearRoot(rootSessionID: string): void {
    for (const [callID, pending] of this.pendingSpawns) {
      if (pending.rootSessionID === rootSessionID) this.pendingSpawns.delete(callID);
    }
    for (const [ptyID, lease] of this.ptyByID) {
      if (lease.rootSessionID === rootSessionID) this.ptyByID.delete(ptyID);
    }
    for (const [callID, lease] of this.tasksByCall) {
      if (lease.rootSessionID === rootSessionID) this.tasksByCall.delete(callID);
    }
    this.generationByRoot.delete(rootSessionID);
  }

  clear(): void {
    this.pendingSpawns.clear();
    this.ptyByID.clear();
    this.tasksByCall.clear();
    this.terminalTombstones.clear();
    this.generationByRoot.clear();
  }
}
