import type { Plugin, PluginOptions } from "@opencode-ai/plugin";
import type { OpencodeClient } from "@opencode-ai/sdk/v2";
import { manager as DIRECT_PTY_MANAGER } from "opencode-pty/plugin/pty/manager";
import {
  assertPtyManagerCapabilities,
  OPENCODE_PTY_VERSION,
  SHARED_PTY_MANAGER,
} from "./opencode-pty-bridge.ts";
import { createSessionCompletionGuard } from "./session-completion-guard/controller.ts";
import { createPluginV2Client } from "./session-completion-guard/plugin-client.ts";

export const SESSION_COMPLETION_GUARD_ID = "opencode-dev-kit.session-completion-guard";

function assertClientCapabilities(client: OpencodeClient): void {
  const required: Array<[string, unknown]> = [
    ["session.create", client.session.create],
    ["session.get", client.session.get],
    ["v2.session.list", client.v2.session.list],
    ["session.status", client.session.status],
    ["session.children", client.session.children],
    ["session.delete", client.session.delete],
    ["session.messages", client.session.messages],
    ["session.promptAsync", client.session.promptAsync],
    ["question.list", client.question.list],
    ["question.reply", client.question.reply],
    ["question.reject", client.question.reject],
    ["provider.list", client.provider.list],
    ["tool.ids", client.tool.ids],
    ["tui.showToast", client.tui.showToast],
    ["v2.agent.list", client.v2.agent.list],
  ];
  const missing = required.filter(([, capability]) => typeof capability !== "function").map(([name]) => name);
  if (missing.length > 0) {
    throw new Error(`OpenCode v2 capability mismatch: ${missing.join(", ")}`);
  }
}

export default {
  id: SESSION_COMPLETION_GUARD_ID,
  server: async (input, options: PluginOptions = {}) => {
    if (options.enabled === false) return {};
    assertPtyManagerCapabilities();
    const client = createPluginV2Client(input.client);
    assertClientCapabilities(client);
    if (DIRECT_PTY_MANAGER !== SHARED_PTY_MANAGER) {
      throw new Error("opencode-pty shared manager identity mismatch");
    }
    return createSessionCompletionGuard(input, options, client);
  },
} satisfies { id: string; server: Plugin };

export const completionGuardRuntimeInfo = {
  guard: SESSION_COMPLETION_GUARD_ID,
  manager: SHARED_PTY_MANAGER,
  ptyVersion: OPENCODE_PTY_VERSION,
};
