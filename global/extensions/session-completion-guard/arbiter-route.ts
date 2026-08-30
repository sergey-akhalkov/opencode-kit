import type { OpencodeClient } from "@opencode-ai/sdk/v2";
import { dataOf, extractArbiterRoute, record } from "./runtime-support.ts";

export type ResolvedArbiterRoute = {
  model: { providerID: string; modelID: string };
  variant: string | null;
};

const ROUTE_SETTLE_INTERVAL_MS = 100;
const ROUTE_SETTLE_TIMEOUT_MS = 5_000;

function routeSettleCancelled(): Error {
  const error = new Error("Completion arbiter route settle cancelled");
  error.name = "AbortError";
  return error;
}

function waitForRouteSettle(delayMs: number, signal?: AbortSignal): Promise<void> {
  if (signal?.aborted) throw routeSettleCancelled();
  return new Promise((resolve, reject) => {
    const onAbort = () => {
      clearTimeout(timer);
      signal?.removeEventListener("abort", onAbort);
      reject(routeSettleCancelled());
    };
    const timer = setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, delayMs);
    signal?.addEventListener("abort", onAbort, { once: true });
    if (signal?.aborted) onAbort();
  });
}

async function resolveArbiterRouteOnce(
  client: OpencodeClient,
  directory: string,
  arbiterAgent: string,
): Promise<ResolvedArbiterRoute> {
  const response = await dataOf<{ data: Array<Record<string, unknown>> }>(
    client.v2.agent.list({ location: { directory } }) as Promise<unknown>,
    "agent.list",
  );
  const route = extractArbiterRoute(response, arbiterAgent);
  const providers = await dataOf<{ all: Array<Record<string, unknown>>; connected: string[] }>(
    client.provider.list({ directory }) as Promise<unknown>,
    "provider.list",
  );
  const provider = providers.all.find((candidate) => candidate.id === route.model.providerID);
  if (
    !providers.connected.includes(route.model.providerID) ||
    record(provider?.models)?.[route.model.modelID] == null
  ) {
    throw new Error("Configured completion arbiter provider or model is unavailable");
  }
  return route;
}

async function resolveArbiterRouteAttempt(
  client: OpencodeClient,
  directory: string,
  arbiterAgent: string,
  timeoutMs: number,
  signal?: AbortSignal,
): Promise<ResolvedArbiterRoute> {
  if (signal?.aborted) throw routeSettleCancelled();
  let timer: ReturnType<typeof setTimeout> | null = null;
  let onAbort: (() => void) | null = null;
  const stop = new Promise<never>((_resolve, reject) => {
    onAbort = () => reject(routeSettleCancelled());
    signal?.addEventListener("abort", onAbort, { once: true });
    timer = setTimeout(
      () => reject(new Error("Completion arbiter route lookup timed out")),
      Math.max(1, timeoutMs),
    );
    if (signal?.aborted) onAbort();
  });
  try {
    const route = await Promise.race([
      resolveArbiterRouteOnce(client, directory, arbiterAgent),
      stop,
    ]);
    if (signal?.aborted) throw routeSettleCancelled();
    return route;
  } finally {
    if (timer != null) clearTimeout(timer);
    if (onAbort != null) signal?.removeEventListener("abort", onAbort);
  }
}

export async function resolveArbiterRoute(
  client: OpencodeClient,
  directory: string,
  arbiterAgent: string,
  signal?: AbortSignal,
): Promise<ResolvedArbiterRoute> {
  const deadline = Date.now() + ROUTE_SETTLE_TIMEOUT_MS;
  let lastError: unknown = null;
  do {
    if (signal?.aborted) throw routeSettleCancelled();
    try {
      return await resolveArbiterRouteAttempt(
        client,
        directory,
        arbiterAgent,
        deadline - Date.now(),
        signal,
      );
    } catch (error) {
      if (signal?.aborted) throw routeSettleCancelled();
      lastError = error;
      const remainingMs = deadline - Date.now();
      if (remainingMs <= 0) break;
      await waitForRouteSettle(Math.min(ROUTE_SETTLE_INTERVAL_MS, remainingMs), signal);
    }
  } while (true);
  const error = new Error("Configured hidden completion arbiter route is unavailable after bounded readiness settle") as Error & { cause?: unknown };
  error.cause = lastError;
  throw error;
}
