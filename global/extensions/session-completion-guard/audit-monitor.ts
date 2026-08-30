import { spawn, type ChildProcess } from "node:child_process";
import { fileURLToPath } from "node:url";
import { hashRef } from "../../plugin/session-delivery-context/redaction.ts";
import {
  openMonitorHandoff,
  type MonitorConnection,
  type MonitorHandoff,
} from "./audit-monitor-handoff.ts";
import { findMonitorDatabasePath } from "./audit-monitor-storage.ts";
import type { AuditWindowOptions, GuardStateName, RootState } from "./types.ts";

type LogLevel = "debug" | "error" | "info" | "warn";

type SpawnProcess = (
  command: string,
  args: string[],
  options: {
    cwd: string;
    detached: boolean;
    env: NodeJS.ProcessEnv;
    stdio: "ignore" | ["ignore", "pipe", "pipe"];
    windowsHide: boolean;
  },
) => ChildProcess;

type MonitorDependencies = {
  directory: string;
  environment?: NodeJS.ProcessEnv;
  log(level: LogLevel, message: string, extra: Record<string, unknown>): Promise<void>;
  monitorScript?: string;
  openHandoff?: (
    connection: MonitorConnection,
    callbacks: {
      onDelivered(): void;
      onError(error: Error): void;
      onTimeout(): void;
    },
  ) => Promise<MonitorHandoff>;
  platform?: NodeJS.Platform;
  spawnProcess?: SpawnProcess;
};

export type MonitorLaunch = {
  args: string[];
  command: string;
  cwd: string;
  env: NodeJS.ProcessEnv;
  shell: {
    args: string[];
    command: string;
    env: NodeJS.ProcessEnv;
  };
  title: string;
};

const START_STATES = new Set<GuardStateName>([
  "audit-retrying",
  "auditing",
  "error",
  "owner-required",
  "passed",
  "product-decision-required",
  "question-auditing",
  "waiting",
  "waiting-async",
]);

const INHERITED_ENV_KEYS = [
  "APPDATA",
  "COLORTERM",
  "COMSPEC",
  "HOME",
  "LOCALAPPDATA",
  "PATH",
  "PATHEXT",
  "SYSTEMROOT",
  "TEMP",
  "TERM",
  "TMP",
  "USERPROFILE",
  "WINDIR",
] as const;

const WINDOWS_MONITOR_WINDOW_CONTROL_SCRIPT = `
$native = @'
using System;
using System.Text;
using System.Runtime.InteropServices;
public static class GuardMonitorNative {
  public delegate bool EnumWindowsProc(IntPtr hWnd, IntPtr lParam);
  [DllImport("user32.dll")] public static extern bool EnumWindows(EnumWindowsProc callback, IntPtr lParam);
  [DllImport("user32.dll")] public static extern IntPtr GetForegroundWindow();
  [DllImport("user32.dll", CharSet = CharSet.Unicode)] public static extern int GetWindowText(IntPtr hWnd, StringBuilder text, int count);
  [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr hWnd);
  [DllImport("user32.dll")] public static extern bool SetWindowPos(IntPtr hWnd, IntPtr insertAfter, int x, int y, int cx, int cy, uint flags);
  [DllImport("user32.dll")] public static extern bool ShowWindowAsync(IntPtr hWnd, int command);
}
'@
Add-Type -TypeDefinition $native
$originalForeground = [GuardMonitorNative]::GetForegroundWindow()
[Console]::Out.WriteLine('READY')
[Console]::Out.Flush()
$deadline = [DateTime]::UtcNow.AddSeconds(8)
$script:monitorWindow = [IntPtr]::Zero
while ([DateTime]::UtcNow -lt $deadline -and $script:monitorWindow -eq [IntPtr]::Zero) {
  [GuardMonitorNative]::EnumWindows({
    param($window, $state)
    $buffer = New-Object System.Text.StringBuilder 512
    [void][GuardMonitorNative]::GetWindowText($window, $buffer, $buffer.Capacity)
    if ($buffer.ToString().Contains($env:OPENCODE_GUARD_MONITOR_TITLE)) {
      $script:monitorWindow = $window
      return $false
    }
    return $true
  }, [IntPtr]::Zero) | Out-Null
  if ($script:monitorWindow -eq [IntPtr]::Zero) { Start-Sleep -Milliseconds 25 }
}
if ($script:monitorWindow -eq [IntPtr]::Zero) { exit 3 }
[void][GuardMonitorNative]::ShowWindowAsync($script:monitorWindow, 7)
[void][GuardMonitorNative]::SetWindowPos($script:monitorWindow, [IntPtr]::Zero, 0, 0, 0, 0, 0x0017)
if ([GuardMonitorNative]::GetForegroundWindow() -eq $script:monitorWindow -and $originalForeground -ne [IntPtr]::Zero) {
  [void][GuardMonitorNative]::SetForegroundWindow($originalForeground)
}
exit 0
`;

function inheritedValue(environment: NodeJS.ProcessEnv, expected: string): string | undefined {
  const match = Object.entries(environment).find(([key]) => key.toUpperCase() === expected);
  return match?.[1];
}

export function buildMonitorEnvironment(
  source: NodeJS.ProcessEnv,
  input: {
    encodedBootstrap: string;
    title: string;
  },
): NodeJS.ProcessEnv {
  const environment: NodeJS.ProcessEnv = {};
  for (const key of INHERITED_ENV_KEYS) {
    const value = inheritedValue(source, key);
    if (value != null) environment[key] = value;
  }
  environment.OPENCODE_GUARD_MONITOR_BOOTSTRAP = input.encodedBootstrap;
  environment.OPENCODE_GUARD_MONITOR_TITLE = input.title;
  return environment;
}

export function buildMonitorLaunch(
  state: RootState,
  options: AuditWindowOptions,
  dependencies: Pick<MonitorDependencies, "directory" | "environment" | "monitorScript"> & {
    handoffPipe: string;
  },
): MonitorLaunch {
  const rootRef = hashRef("session", state.root.id);
  const title = `OpenCode Guard | ${rootRef}`;
  const monitorScript = dependencies.monitorScript ?? fileURLToPath(new URL("./audit-monitor-console.ts", import.meta.url));
  const powershellLiteral = (value: string): string => `'${value.replaceAll("'", "''")}'`;
  const bootstrap = [
    `try { $Host.UI.RawUI.WindowTitle = ${powershellLiteral(title)} } catch {}`,
    `& node ${powershellLiteral(monitorScript)} --handoff ${powershellLiteral(dependencies.handoffPipe)}`,
    "exit $LASTEXITCODE",
  ].join("\n");
  const encodedBootstrap = Buffer.from(bootstrap, "utf16le").toString("base64");
  if (!/^[A-Za-z0-9+/=]+$/.test(encodedBootstrap)) throw new Error("Guard monitor bootstrap encoding was invalid");
  const shellCommand = [
    "start",
    '""',
    "/min",
    "powershell.exe",
    "-NoLogo",
    "-NoProfile",
    "-NonInteractive",
    "-EncodedCommand",
    encodedBootstrap,
  ].join(" ");
  const environment = buildMonitorEnvironment(dependencies.environment ?? process.env, {
    encodedBootstrap,
    title,
  });
  return {
    args: [
      "-NoLogo",
      "-NoProfile",
      "-NonInteractive",
      "-WindowStyle",
      "Hidden",
      "-Command",
      WINDOWS_MONITOR_WINDOW_CONTROL_SCRIPT,
    ],
    command: "powershell.exe",
    cwd: dependencies.directory,
    env: environment,
    shell: {
      args: ["/d", "/c", shellCommand],
      command: "cmd.exe",
      env: environment,
    },
    title,
  };
}

export class GuardAuditMonitorLauncher {
  private readonly launchedRoots = new Set<string>();
  private readonly options: AuditWindowOptions;
  private readonly dependencies: MonitorDependencies;

  constructor(options: AuditWindowOptions, dependencies: MonitorDependencies) {
    this.options = options;
    this.dependencies = dependencies;
  }

  async observe(state: RootState): Promise<void> {
    if (!state.grindEnabled || !START_STATES.has(state.state) || this.launchedRoots.has(state.root.id)) return;
    if (!this.options.enabled && this.options.validationError == null) return;
    this.launchedRoots.add(state.root.id);
    const rootRef = hashRef("session", state.root.id);
    if (this.options.validationError != null) {
      await this.dependencies.log("warn", "guard monitor disabled by invalid options", {
        error: this.options.validationError,
        rootRef,
      });
      return;
    }
    if ((this.dependencies.platform ?? process.platform) !== "win32") return;
    let handoff: MonitorHandoff | null = null;
    try {
      const sourceEnvironment = this.dependencies.environment ?? process.env;
      const connection: MonitorConnection = {
        closePassedAfterMs: this.options.closePassedAfterMs,
        databasePath: findMonitorDatabasePath(state.root.id, sourceEnvironment),
        rootSessionID: state.root.id,
      };
      handoff = await (this.dependencies.openHandoff ?? openMonitorHandoff)(connection, {
        onDelivered: () => {
          void this.dependencies.log("info", "guard monitor handoff delivered", { rootRef });
        },
        onError: (error) => {
          void this.dependencies.log("warn", "guard monitor handoff failed", { error: error.message, rootRef });
        },
        onTimeout: () => {
          void this.dependencies.log("warn", "guard monitor handoff timed out", { rootRef });
        },
      });
      if (!state.grindEnabled) {
        handoff.close();
        this.launchedRoots.delete(state.root.id);
        return;
      }
      const launch = buildMonitorLaunch(state, this.options, { ...this.dependencies, handoffPipe: handoff.pipeName });
      const spawnProcess = this.dependencies.spawnProcess ?? spawn;
      const windowControl = spawnProcess(launch.command, launch.args, {
        cwd: launch.cwd,
        detached: true,
        env: launch.env,
        stdio: ["ignore", "pipe", "pipe"],
        windowsHide: true,
      });
      let controlReady = false;
      let shellStarted = false;
      let controlStderr = "";
      const launchShell = (): void => {
        if (shellStarted) return;
        if (!state.grindEnabled) {
          handoff?.close();
          windowControl.kill();
          this.launchedRoots.delete(state.root.id);
          return;
        }
        shellStarted = true;
        const shell = spawnProcess(launch.shell.command, launch.shell.args, {
          cwd: launch.cwd,
          detached: true,
          env: launch.shell.env,
          stdio: "ignore",
          windowsHide: false,
        });
        shell.once("error", (error) => {
          handoff?.close();
          void this.dependencies.log("warn", "guard monitor shell launch failed", { error: error.message, rootRef });
        });
        shell.once("exit", (code) => {
          if (code != null && code !== 0) {
            handoff?.close();
            void this.dependencies.log("warn", "guard monitor shell launcher exited non-zero", { exitCode: code, rootRef });
          }
        });
        shell.unref();
      };
      const controlReadyTimer = setTimeout(() => {
        if (controlReady) return;
        handoff?.close();
        windowControl.kill();
        void this.dependencies.log("warn", "guard monitor window control readiness timed out", { rootRef });
      }, 3_000);
      controlReadyTimer.unref();
      let controlStdout = "";
      windowControl.stdout?.on("data", (chunk) => {
        if (controlReady) return;
        controlStdout = `${controlStdout}${String(chunk)}`.slice(-4_000);
        if (!controlStdout.includes("READY")) return;
        controlReady = true;
        clearTimeout(controlReadyTimer);
        launchShell();
      });
      windowControl.stderr?.on("data", (chunk) => {
        controlStderr = `${controlStderr}${String(chunk)}`.slice(-1_000);
      });
      windowControl.once("error", (error) => {
        clearTimeout(controlReadyTimer);
        handoff?.close();
        void this.dependencies.log("warn", "guard monitor window control failed", { error: error.message, rootRef });
      });
      windowControl.once("exit", (code) => {
        clearTimeout(controlReadyTimer);
        if (!controlReady) handoff?.close();
        if (code != null && code !== 0) {
          void this.dependencies.log("warn", "guard monitor window control exited non-zero", {
            ...(controlStderr === "" ? {} : { error: controlStderr }),
            exitCode: code,
            rootRef,
          });
        }
      });
      windowControl.unref();
      await this.dependencies.log("info", "guard monitor launch requested", {
        environmentKeys: Object.keys(launch.env).sort(),
        rootRef,
        title: launch.title,
      });
    } catch (error) {
      handoff?.close();
      await this.dependencies.log("warn", "guard monitor launch failed", {
        error: error instanceof Error ? error.message : String(error),
        rootRef,
      });
    }
  }
}
