import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { Config, Hooks, Plugin, PluginInput, PluginOptions } from "@opencode-ai/plugin";
import type { OpencodeClient } from "@opencode-ai/sdk/v2";
import { loadMissionDefinition, safeId, stableJson } from "../bin/roadmap-mission/contracts.ts";
import { runtimeRef, runtimeUrl } from "../bin/roadmap-mission/session-executor.ts";
import {
  clearMissionStopIntent,
  readMissionStateProjection,
  readMissionStopIntent,
  recordMissionStopIntent,
  recordMissionUnknownPause,
} from "../bin/roadmap-mission/state.ts";
import {
  assertPtyManagerCapabilities,
  registerSessionUpdateCallback,
  removeSessionUpdateCallback,
  SHARED_PTY_MANAGER,
} from "./opencode-pty-bridge.ts";
import { createPluginV2Client } from "./session-completion-guard/plugin-client.ts";

export const ROADMAP_MISSION_LAUNCHER_ID = "opencode-dev-kit.roadmap-mission-launcher";

const COMMANDS = {
  "mission-resume": "resume",
  "mission-run": "run",
  "mission-status": "status",
  "mission-stop": "stop",
} as const;
const COCKPIT_COMMAND = "pty-open-background-spy";
const HANDLED = "Command handled by roadmap mission launcher";
const MISSION_ADAPTER_PATH = "opencode-dev-kit/controller-adapter.json";

type CommandAction = (typeof COMMANDS)[keyof typeof COMMANDS];
type PtyInfo = ReturnType<typeof SHARED_PTY_MANAGER.list>[number];
type LaunchRecord = {
  action: "resume" | "run";
  cockpit: "opened";
  missionId: string;
  ptyId: string;
  reconciliation: "blocked" | "not-required" | "paused-unknown";
  rootSessionRef: string;
  runtimeRef: string;
  terminalNotified: boolean;
  terminalToast: "not-sent" | "pending" | "sent" | "failed";
};

function hashRef(kind: string, value: string): string {
  return `${kind}:${crypto.createHash("sha256").update(value).digest("hex").slice(0, 16)}`;
}

async function dataOf<T>(request: Promise<unknown>, label: string): Promise<T> {
  const response = await request as { data?: T; error?: unknown };
  if (response.error != null) {
    const failure = new Error(`${label} failed`) as Error & { cause?: unknown };
    failure.cause = response.error;
    throw failure;
  }
  if (!("data" in response)) throw new Error(`${label} returned no data`);
  return response.data as T;
}

function errorMessage(error: unknown): string {
  const messages: string[] = [];
  let current: unknown = error;
  for (let depth = 0; depth < 3 && current != null; depth++) {
    const message = current instanceof Error ? current.message : typeof current === "object" ? null : String(current);
    if (message != null && message.trim() !== "") messages.push(message.replace(/[\r\n\0]+/g, " "));
    current = typeof current === "object" ? (current as { cause?: unknown }).cause : null;
  }
  return (messages.length === 0 ? "unknown error" : messages.join(" <- ")).slice(0, 500);
}

function missionPath(missionId: string): string {
  return `opencode-dev-kit/missions/${missionId}.json`;
}

export function scriptRuntimeExecutable(value: unknown): string {
  if (typeof value !== "string" || !path.isAbsolute(value)) {
    throw new Error("Roadmap mission launcher scriptRuntime must be an absolute Node/Bun executable path");
  }
  const executable = path.resolve(value);
  const name = path.basename(executable).toLocaleLowerCase();
  if (!["bun", "bun.exe", "node", "node.exe"].includes(name)) {
    throw new Error("Roadmap mission launcher scriptRuntime must name Node or Bun");
  }
  try {
    if (fs.statSync(executable).isFile()) return executable;
  } catch {
    // Emit one stable configuration error below.
  }
  throw new Error("Roadmap mission launcher scriptRuntime is not a readable regular file");
}

function configureCommands(config: Config): void {
  config.command = {
    ...(config.command ?? {}),
    "mission-run": {
      description: "Run one accepted roadmap mission",
      template: "Launch the exact project-contained roadmap mission named by $ARGUMENTS.",
    },
    "mission-resume": {
      description: "Resume one paused roadmap mission",
      template: "Resume the exact project-contained roadmap mission named by $ARGUMENTS.",
    },
    "mission-status": {
      description: "Show roadmap mission state",
      template: "Show the state of the project-contained roadmap mission named by $ARGUMENTS.",
    },
    "mission-stop": {
      description: "Gracefully stop one roadmap mission",
      template: "Request a graceful stop for the project-contained roadmap mission named by $ARGUMENTS.",
    },
  };
}

function assertCapabilities(client: OpencodeClient): void {
  assertPtyManagerCapabilities();
  const required: Array<[string, unknown]> = [
    ["manager.spawn", SHARED_PTY_MANAGER.spawn],
    ["manager.kill", SHARED_PTY_MANAGER.kill],
    ["manager.search", SHARED_PTY_MANAGER.search],
    ["manager.write", SHARED_PTY_MANAGER.write],
    ["tui.executeCommand", client.tui.executeCommand],
    ["tui.showToast", client.tui.showToast],
    ["session.prompt", client.session.prompt],
    ["app.log", client.app.log],
  ];
  const missing = required.filter(([, value]) => typeof value !== "function").map(([name]) => name);
  if (missing.length > 0) throw new Error(`Roadmap mission launcher capability mismatch: ${missing.join(", ")}`);
}

async function log(client: OpencodeClient, level: "error" | "info" | "warn", message: string, extra: Record<string, unknown>): Promise<void> {
  try {
    await client.app.log({ service: "roadmap-mission-launcher", level, message, extra });
  } catch {
    // Diagnostics must not change command ownership.
  }
}

async function toast(
  client: OpencodeClient,
  directory: string,
  message: string,
  variant: "error" | "info" | "success" | "warning",
): Promise<boolean> {
  try {
    await dataOf(client.tui.showToast({
      directory,
      duration: variant === "success" ? 3_000 : 5_000,
      message,
      title: "Roadmap mission",
      variant,
    }) as Promise<unknown>, "tui.showToast");
    return true;
  } catch (error) {
    await log(client, "warn", "mission toast failed", { error: errorMessage(error) });
    return false;
  }
}

async function deliver(client: OpencodeClient, directory: string, sessionID: string, text: string): Promise<void> {
  await dataOf(client.session.prompt({
    directory,
    noReply: true,
    parts: [{ type: "text", text }],
    sessionID,
  }) as Promise<unknown>, "session.prompt mission result");
}

export async function createRoadmapMissionLauncher(input: PluginInput, options: PluginOptions = {}): Promise<Hooks> {
  const client = createPluginV2Client(input.client);
  assertCapabilities(client);
  const globalSource = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  const server = runtimeUrl(input.serverUrl.href);
  const correlation = runtimeRef(server, input.directory);
  const scriptRuntime = scriptRuntimeExecutable(options.scriptRuntime);
  const byMission = new Map<string, LaunchRecord>();
  const byPty = new Map<string, LaunchRecord>();
  const pending = new Set<string>();

  const onPtyUpdate = (pty: PtyInfo): void => {
    const launch = byPty.get(pty.id);
    if (launch == null || (pty.status !== "exited" && pty.status !== "killed")) return;
    if (pty.status === "killed") {
      try {
        const definition = loadMissionDefinition(input.directory, missionPath(launch.missionId));
        recordMissionUnknownPause(input.directory, definition);
        launch.reconciliation = "paused-unknown";
      } catch (error) {
        launch.reconciliation = "blocked";
        void log(client, "error", "hard-killed mission reconciliation blocked", {
          error: errorMessage(error),
          missionId: launch.missionId,
          rootSessionRef: launch.rootSessionRef,
        });
      }
    }
    launch.terminalNotified = true;
    launch.terminalToast = "pending";
    void toast(
      client,
      input.directory,
      `Mission ${launch.missionId} controller ${pty.status}${pty.exitCode == null ? "" : ` (exit ${pty.exitCode})`}.`,
      pty.exitCode === 0 ? "success" : "warning",
    ).then((sent) => {
      launch.terminalToast = sent ? "sent" : "failed";
    });
  };
  registerSessionUpdateCallback(onPtyUpdate);

  const status = (missionId: string): string => {
    const relativeMissionPath = missionPath(missionId);
    const definition = loadMissionDefinition(input.directory, relativeMissionPath);
    let current = readMissionStateProjection(input.directory, definition);
    const launch = byMission.get(missionId) ?? null;
    const pty = launch == null ? null : SHARED_PTY_MANAGER.get(launch.ptyId);
    const stdoutPrefixCount = launch == null ? 0 : SHARED_PTY_MANAGER.search(launch.ptyId, /\/session\/stdout\]/)?.totalMatches ?? 0;
    const stderrPrefixCount = launch == null ? 0 : SHARED_PTY_MANAGER.search(launch.ptyId, /\/session\/stderr\]/)?.totalMatches ?? 0;
    let reconciliation = launch?.reconciliation ?? "not-required";
    if (launch == null && current?.activeOperation != null) {
      try {
        recordMissionUnknownPause(input.directory, definition);
        current = readMissionStateProjection(input.directory, definition);
        reconciliation = "paused-unknown";
      } catch {
        reconciliation = "blocked";
      }
    }
    const stopIntent = readMissionStopIntent(input.directory, definition);
    return stableJson({
      activeOperation: current?.activeOperation?.kind ?? null,
      cursor: current?.cursor ?? 0,
      disposition: reconciliation === "blocked" ? "paused-unknown" : current?.disposition ?? "not-started",
      durableDisposition: current?.disposition ?? "not-started",
      missionId,
      operation: "status",
      pendingLaunch: pending.has(missionId),
      runtimeExecutable: path.basename(scriptRuntime),
      pty: pty == null ? null : {
        exitCode: pty.exitCode ?? null,
        notifyOnExit: pty.notifyOnExit,
        ref: hashRef("pty", pty.id),
        status: pty.status,
      },
      rootSessionRef: launch?.rootSessionRef ?? null,
      reconciliation,
      runtimeRef: launch?.runtimeRef ?? correlation,
      schemaVersion: 1,
      streamPrefixCounts: { stderr: stderrPrefixCount, stdout: stdoutPrefixCount },
      terminalNotified: launch?.terminalNotified ?? false,
      terminalToast: launch?.terminalToast ?? "not-sent",
      visibility: launch?.cockpit ?? "not-opened",
      stopRequested: stopIntent != null,
    }).trimEnd();
  };

  const launch = async (action: "resume" | "run", missionId: string, rootSessionID: string): Promise<string> => {
    if (pending.has(missionId)) throw new Error(`Mission ${missionId} launch is already pending`);
    const existing = byMission.get(missionId);
    const existingPty = existing == null ? null : SHARED_PTY_MANAGER.get(existing.ptyId);
    if (existingPty?.status === "running" || existingPty?.status === "killing") {
      throw new Error(`Mission ${missionId} controller is already ${existingPty.status}`);
    }
    const relativeMissionPath = missionPath(missionId);
    const definition = loadMissionDefinition(input.directory, relativeMissionPath);
    if (definition.missionId !== missionId) throw new Error("Mission definition identity mismatch");
    if (action === "resume") {
      const current = readMissionStateProjection(input.directory, definition);
      const intent = readMissionStopIntent(input.directory, definition);
      if (intent != null) {
        if (current?.disposition !== "paused" || current.activeOperation != null) {
          throw new Error("Mission resume requires terminal graceful-stop reconciliation");
        }
        clearMissionStopIntent(input.directory, definition);
      }
    }
    pending.add(missionId);
    try {
      const cockpit = await dataOf<boolean>(client.tui.executeCommand({
        command: COCKPIT_COMMAND,
        directory: input.directory,
      }) as Promise<unknown>, "PTY cockpit command");
      if (cockpit !== true) throw new Error("PTY cockpit command did not confirm visibility");
      const pty = SHARED_PTY_MANAGER.spawn({
        args: [
          path.join(globalSource, "bin", "roadmap-mission.ts"),
          action,
          "--root",
          input.directory,
          "--global-source",
          globalSource,
          "--mission",
          relativeMissionPath,
          "--adapter",
          MISSION_ADAPTER_PATH,
        ],
        command: scriptRuntime,
        description: "Visible autonomous roadmap mission controller",
        env: {
          OPENCODE_ROADMAP_PARENT_SESSION: rootSessionID,
          OPENCODE_ROADMAP_RUNTIME_REF: correlation,
          OPENCODE_ROADMAP_SERVER_URL: server.origin,
          OPENSPEC_TELEMETRY: "0",
        },
        notifyOnExit: false,
        parentAgent: "roadmap-mission-launcher",
        parentSessionId: rootSessionID,
        title: `Roadmap mission: ${missionId}`,
        workdir: input.directory,
      });
      const record: LaunchRecord = {
        action,
        cockpit: "opened",
        missionId,
        ptyId: pty.id,
        reconciliation: "not-required",
        rootSessionRef: hashRef("session", rootSessionID),
        runtimeRef: correlation,
        terminalNotified: false,
        terminalToast: "not-sent",
      };
      byMission.set(missionId, record);
      byPty.set(pty.id, record);
      await toast(client, input.directory, `Mission ${missionId} ${action} controller is visible in the PTY cockpit.`, "success");
      return status(missionId);
    } finally {
      pending.delete(missionId);
    }
  };

  const stop = async (missionId: string, rootSessionID: string): Promise<string> => {
    const definition = loadMissionDefinition(input.directory, missionPath(missionId));
    const launch = byMission.get(missionId);
    if (launch == null) throw new Error(`Mission ${missionId} has no controller in the current runtime`);
    const pty = SHARED_PTY_MANAGER.get(launch.ptyId);
    if (pty == null || (pty.status !== "running" && pty.status !== "killing")) {
      throw new Error(`Mission ${missionId} controller is not running`);
    }
    recordMissionStopIntent(input.directory, definition, {
      controllerPtyRef: hashRef("pty", launch.ptyId),
      rootSessionRef: hashRef("session", rootSessionID),
      source: "slash",
    });
    await new Promise((resolve) => setTimeout(resolve, 750));
    const afterIntent = SHARED_PTY_MANAGER.get(launch.ptyId);
    if (afterIntent?.status === "running" && !SHARED_PTY_MANAGER.write(launch.ptyId, "\x03")) {
      throw new Error("Mission controller rejected the graceful stop fallback signal");
    }
    await toast(client, input.directory, `Graceful stop requested for mission ${missionId}.`, "info");
    return status(missionId);
  };

  return {
    config: async (config) => configureCommands(config),
    dispose: async () => removeSessionUpdateCallback(onPtyUpdate),
    "command.execute.before": async (commandInput) => {
      const action = COMMANDS[commandInput.command as keyof typeof COMMANDS] as CommandAction | undefined;
      if (action == null) return;
      let message: string;
      let variant: "error" | "info" = "info";
      try {
        const missionId = safeId(commandInput.arguments.trim(), "mission id");
        message = action === "stop"
          ? await stop(missionId, commandInput.sessionID)
          : action === "status"
          ? status(missionId)
          : await launch(action, missionId, commandInput.sessionID);
      } catch (error) {
        variant = "error";
        message = `Mission command blocked: ${errorMessage(error)}`;
        await log(client, "error", "mission command blocked", {
          action,
          error: errorMessage(error),
          rootSessionRef: hashRef("session", commandInput.sessionID),
          runtimeRef: correlation,
        });
      }
      await toast(client, input.directory, message.slice(0, 500), variant);
      try {
        await deliver(client, input.directory, commandInput.sessionID, message);
      } catch (error) {
        await log(client, "warn", "mission command result delivery failed", {
          action,
          error: errorMessage(error),
          rootSessionRef: hashRef("session", commandInput.sessionID),
        });
      }
      throw new Error(HANDLED);
    },
  };
}

export default {
  id: ROADMAP_MISSION_LAUNCHER_ID,
  server: async (input, options) => createRoadmapMissionLauncher(input, options),
} satisfies { id: string; server: Plugin };
