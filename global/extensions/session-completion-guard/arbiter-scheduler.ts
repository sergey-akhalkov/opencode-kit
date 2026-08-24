export const DEFAULT_ARBITER_ACTIVE_LIMIT = 2;
export const DEFAULT_ARBITER_QUEUE_LIMIT = 32;

export type ArbiterSchedulerSlot = "acquired" | "cancelled" | "duplicate" | "overload";

type QueuedAudit = {
  epochId: string;
  resolve: (slot: ArbiterSchedulerSlot) => void;
  rootId: string;
};

const SHARED_KEY = Symbol.for("opencode-kit.arbiter-scheduler");

export class ArbiterScheduler {
  private readonly active = new Map<string, string>();
  private readonly queue: QueuedAudit[] = [];

  readonly activeLimit: number;
  readonly queueLimit: number;

  constructor(
    activeLimit = DEFAULT_ARBITER_ACTIVE_LIMIT,
    queueLimit = DEFAULT_ARBITER_QUEUE_LIMIT,
  ) {
    this.activeLimit = activeLimit;
    this.queueLimit = queueLimit;
  }

  get activeCount(): number {
    return this.active.size;
  }

  get queuedCount(): number {
    return this.queue.length;
  }

  acquire(rootId: string, epochId: string, signal?: AbortSignal): Promise<ArbiterSchedulerSlot> {
    if (signal?.aborted === true) return Promise.resolve("cancelled");
    const queuedIndex = this.queue.findIndex((entry) => entry.rootId === rootId);
    if (queuedIndex >= 0) {
      const existing = this.queue[queuedIndex];
      if (existing.epochId === epochId) return Promise.resolve("duplicate");
      this.queue.splice(queuedIndex, 1);
      existing.resolve("cancelled");
    }
    if (this.active.get(rootId) === epochId) return Promise.resolve("duplicate");
    if (this.active.has(rootId)) return Promise.resolve("duplicate");
    if (this.active.size < this.activeLimit) {
      this.active.set(rootId, epochId);
      return Promise.resolve("acquired");
    }
    if (this.queue.length >= this.queueLimit) return Promise.resolve("overload");
    return new Promise((resolve) => {
      const entry: QueuedAudit = { epochId, resolve, rootId };
      this.queue.push(entry);
      signal?.addEventListener("abort", () => {
        const index = this.queue.indexOf(entry);
        if (index < 0) return;
        this.queue.splice(index, 1);
        resolve("cancelled");
      }, { once: true });
    });
  }

  release(rootId: string, epochId: string): void {
    if (this.active.get(rootId) !== epochId) return;
    this.active.delete(rootId);
    const next = this.queue.shift();
    if (next == null) return;
    this.active.set(next.rootId, next.epochId);
    next.resolve("acquired");
  }
}

export function sharedArbiterScheduler(
  activeLimit = DEFAULT_ARBITER_ACTIVE_LIMIT,
  queueLimit = DEFAULT_ARBITER_QUEUE_LIMIT,
): ArbiterScheduler {
  const bag = globalThis as Record<symbol, ArbiterScheduler | undefined>;
  bag[SHARED_KEY] ??= new ArbiterScheduler(activeLimit, queueLimit);
  return bag[SHARED_KEY];
}

export function resetSharedArbiterSchedulerForTests(): void {
  delete (globalThis as Record<symbol, unknown>)[SHARED_KEY];
}
