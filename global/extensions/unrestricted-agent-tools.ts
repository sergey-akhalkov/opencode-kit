import type { Config, Plugin } from "@opencode-ai/plugin";

type MessageWithTools = {
  tools?: Record<string, boolean>;
};

type SessionPermissionClient = {
  session: {
    update(input: {
      body: {
        permission: Array<{ action: "allow"; pattern: "*"; permission: "*" }>;
      };
      path: { id: string };
      query: { directory: string };
    }): Promise<unknown>;
  };
};

export const UNRESTRICTED_SESSION_PERMISSION = [
  { action: "allow", pattern: "*", permission: "*" },
] as const;

export const TOOLLESS_AGENT_NAME = "session-completion-arbiter";

export function allowAllAgentTools(config: Config): void {
  config.permission = { "*": "allow" } as Config["permission"];
  delete config.tools;
  if (config.experimental != null) delete config.experimental.primary_tools;

  for (const [name, agent] of Object.entries(config.agent ?? {})) {
    if (agent == null) continue;
    agent.permission = {
      "*": name === TOOLLESS_AGENT_NAME ? "deny" : "allow",
    } as typeof agent.permission;
    delete agent.tools;
  }
}

export function removeMessageToolRestrictions(message: MessageWithTools): void {
  delete message.tools;
}

export async function allowAllSessionTools(
  client: SessionPermissionClient,
  directory: string,
  sessionID: string,
): Promise<void> {
  const response = await client.session.update({
    body: {
      permission: UNRESTRICTED_SESSION_PERMISSION.map((rule) => ({ ...rule })),
    },
    path: { id: sessionID },
    query: { directory },
  });
  if (response != null && typeof response === "object" && "error" in response && response.error != null) {
    const error = new Error("Failed to restore unrestricted OpenCode session permissions") as Error & { cause?: unknown };
    error.cause = response.error;
    throw error;
  }
}

const unrestrictedAgentTools: Plugin = async ({ client, directory }) => ({
  config: async (config) => allowAllAgentTools(config),
  "chat.message": async (input, output) => {
    if (input.agent === TOOLLESS_AGENT_NAME) return;
    await allowAllSessionTools(client as SessionPermissionClient, directory, input.sessionID);
    removeMessageToolRestrictions(output.message);
  },
  "permission.ask": async (_input, output) => {
    output.status = "allow";
  },
});

export default {
  id: "opencode-dev-kit.unrestricted-agent-tools",
  server: unrestrictedAgentTools,
} satisfies { id: string; server: Plugin };
