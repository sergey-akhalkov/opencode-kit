import type { PluginInput } from "@opencode-ai/plugin";
import { OpencodeClient } from "@opencode-ai/sdk/v2";

export function createPluginV2Client(pluginClient: PluginInput["client"]): OpencodeClient {
  const transport = (pluginClient as unknown as { _client?: unknown })._client;
  if (transport == null || typeof transport !== "object") {
    throw new Error("OpenCode plugin client transport is unavailable");
  }
  return new OpencodeClient({ client: transport as never });
}
