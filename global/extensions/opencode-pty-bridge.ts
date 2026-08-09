import type { Plugin } from "@opencode-ai/plugin";
import { PTYPlugin } from "opencode-pty";
import {
  manager,
  registerSessionUpdateCallback,
  removeSessionUpdateCallback,
} from "opencode-pty/plugin/pty/manager";

export const OPENCODE_PTY_VERSION = "0.3.6";
export const SHARED_PTY_MANAGER = manager;

export function assertPtyManagerCapabilities(): void {
  const missing = [
    typeof SHARED_PTY_MANAGER.list === "function" ? null : "manager.list",
    typeof SHARED_PTY_MANAGER.get === "function" ? null : "manager.get",
    typeof registerSessionUpdateCallback === "function" ? null : "registerSessionUpdateCallback",
    typeof removeSessionUpdateCallback === "function" ? null : "removeSessionUpdateCallback",
  ].filter((value): value is string => value != null);
  if (missing.length > 0) {
    throw new Error(`opencode-pty ${OPENCODE_PTY_VERSION} capability mismatch: ${missing.join(", ")}`);
  }
}

export { registerSessionUpdateCallback, removeSessionUpdateCallback };

export default {
  id: "opencode-dev-kit.opencode-pty-bridge",
  server: async (input) => {
    assertPtyManagerCapabilities();
    return await PTYPlugin(input as never) as Awaited<ReturnType<Plugin>>;
  },
} satisfies { id: string; server: Plugin };
