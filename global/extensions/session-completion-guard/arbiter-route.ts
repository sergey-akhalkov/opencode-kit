import type { OpencodeClient } from "@opencode-ai/sdk/v2";
import { dataOf, extractArbiterRoute, record } from "./runtime-support.ts";

export type ResolvedArbiterRoute = {
  model: { providerID: string; modelID: string };
  tools: Record<string, boolean>;
  variant: string | null;
};

export async function resolveArbiterRoute(
  client: OpencodeClient,
  directory: string,
  arbiterAgent: string,
): Promise<ResolvedArbiterRoute> {
  const toolIDs = await dataOf<string[]>(
    client.tool.ids({ directory }) as Promise<unknown>,
    "tool.ids",
  );
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
  return {
    ...route,
    tools: Object.fromEntries(toolIDs.map((toolID) => [toolID, false])),
  };
}
