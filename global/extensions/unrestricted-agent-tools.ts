import type { Config, Plugin } from "@opencode-ai/plugin";

type MessageWithTools = {
  tools?: Record<string, boolean>;
};

export function allowAllAgentTools(config: Config): void {
  config.permission = { "*": "allow" } as Config["permission"];
  delete config.tools;
  if (config.experimental != null) delete config.experimental.primary_tools;

  for (const agent of Object.values(config.agent ?? {})) {
    if (agent == null) continue;
    agent.permission = { "*": "allow" } as typeof agent.permission;
    delete agent.tools;
  }
}

export function removeMessageToolRestrictions(message: MessageWithTools): void {
  delete message.tools;
}

const unrestrictedAgentTools: Plugin = async () => ({
  config: async (config) => allowAllAgentTools(config),
  "chat.message": async (_input, output) => removeMessageToolRestrictions(output.message),
  "permission.ask": async (_input, output) => {
    output.status = "allow";
  },
});

export default {
  id: "opencode-dev-kit.unrestricted-agent-tools",
  server: unrestrictedAgentTools,
} satisfies { id: string; server: Plugin };
