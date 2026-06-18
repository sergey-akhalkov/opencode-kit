import type { Plugin } from "@opencode-ai/plugin";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

export const LOCAL_LLAMA_BASE_URL = "http://127.0.0.1:8080/v1";
export const LOCAL_LLAMA_PROVIDER_ID = "llama-local";
export const SESSION_DELIVERY_CONTEXT_TOOL = "session_delivery_context";
export const SESSION_DELIVERY_REVIEWER_AGENT = "session-delivery-reviewer";

type MutableConfig = {
  agent?: Record<string, Record<string, unknown>>;
  provider?: Record<string, Record<string, unknown>>;
};

type ModelsResponse = {
  data?: Array<{ id?: unknown }>;
};

type SessionDeliveryContextResult = {
  missingSessions: unknown[];
  session: {
    counts: {
      openTodos: number;
      questionReplies: number;
      userMessages: number;
    };
    sessionRef: string;
  } | null;
  warnings: unknown[];
};

type SessionDeliveryContextModule = {
  readSessionDeliveryContext: (options: { sessionId: string }) => SessionDeliveryContextResult;
};

async function loadSessionDeliveryContextModule(): Promise<SessionDeliveryContextModule> {
  const pluginDir = path.dirname(fileURLToPath(import.meta.url));
  const candidates = [
    path.resolve(pluginDir, "..", "..", "tools", "opencode-project-session-retro-ledger.ts"),
    path.resolve(pluginDir, "..", "opencode-dev-kit", "tools", "opencode-project-session-retro-ledger.ts"),
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return await import(pathToFileURL(candidate).href) as SessionDeliveryContextModule;
    }
  }
  throw new Error(`Unable to locate opencode-project-session-retro-ledger.ts from ${pluginDir}`);
}

export function applyLocalLlamaSessionReviewerConfig(config: MutableConfig, modelID: string): boolean {
  const trimmedModelID = modelID.trim();
  if (trimmedModelID === "") {
    return false;
  }

  const existingProvider = config.provider?.[LOCAL_LLAMA_PROVIDER_ID] ?? {};
  const existingProviderOptions = typeof existingProvider.options === "object" && existingProvider.options != null && !Array.isArray(existingProvider.options) ? existingProvider.options as Record<string, unknown> : {};
  const existingProviderModels = typeof existingProvider.models === "object" && existingProvider.models != null && !Array.isArray(existingProvider.models) ? existingProvider.models as Record<string, unknown> : {};
  config.provider = {
    ...(config.provider ?? {}),
    [LOCAL_LLAMA_PROVIDER_ID]: {
      ...existingProvider,
      models: {
        ...existingProviderModels,
        [trimmedModelID]: {
          name: trimmedModelID,
        },
      },
      name: "Local llama.cpp",
      npm: "@ai-sdk/openai-compatible",
      options: {
        ...existingProviderOptions,
        baseURL: LOCAL_LLAMA_BASE_URL,
      },
    },
  };

  const existingAgent = config.agent?.[SESSION_DELIVERY_REVIEWER_AGENT] ?? {};
  config.agent = {
    ...(config.agent ?? {}),
    [SESSION_DELIVERY_REVIEWER_AGENT]: {
      ...existingAgent,
      model: `${LOCAL_LLAMA_PROVIDER_ID}/${trimmedModelID}`,
      temperature: 0.1,
    },
  };
  return true;
}

export async function discoverLocalLlamaModel(fetchImpl: typeof fetch = fetch, timeoutMs = 500): Promise<string | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetchImpl(`${LOCAL_LLAMA_BASE_URL}/models`, { signal: controller.signal });
    if (!response.ok) {
      return null;
    }
    const body = await response.json() as ModelsResponse;
    const firstID = body.data?.map((model) => typeof model.id === "string" ? model.id : null).find((id): id is string => id != null && id.trim() !== "");
    return firstID ?? null;
  } catch (_error) {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

export default {
  id: "opencode-dev-kit.session-env",
  server: async () => ({
    config: async (config) => {
      const modelID = await discoverLocalLlamaModel();
      if (modelID != null) {
        applyLocalLlamaSessionReviewerConfig(config as MutableConfig, modelID);
      }
    },
    "shell.env": async (input, output) => {
      if (typeof input.sessionID === "string" && input.sessionID !== "") {
        output.env.OPENCODE_SESSION_ID = input.sessionID;
      }
    },
    tool: {
      [SESSION_DELIVERY_CONTEXT_TOOL]: {
        args: {},
        description: "Return redacted delivery-review context for the current OpenCode session: user prompts, question replies, permission replies, and todos.",
        async execute(_args, context) {
          const { readSessionDeliveryContext } = await loadSessionDeliveryContextModule();
          const result = readSessionDeliveryContext({ sessionId: context.sessionID });
          context.metadata({
            metadata: {
              missingSessions: result.missingSessions.length,
              openTodos: result.session?.counts.openTodos ?? 0,
              questionReplies: result.session?.counts.questionReplies ?? 0,
              sessionRef: result.session?.sessionRef ?? null,
              userMessages: result.session?.counts.userMessages ?? 0,
              warnings: result.warnings.length,
            },
            title: "Session delivery context",
          });
          return {
            metadata: {
              missingSessions: result.missingSessions.length,
              openTodos: result.session?.counts.openTodos ?? 0,
              sessionRef: result.session?.sessionRef ?? null,
              warnings: result.warnings.length,
            },
            output: `${JSON.stringify(result, null, 2)}\n`,
            title: "Session delivery context",
          };
        },
      },
    },
  }),
} satisfies { id: string; server: Plugin };
