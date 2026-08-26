import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export type PortableCommandResult = {
  status: number | null;
  signal: NodeJS.Signals | null;
  cleanupState?: "not-needed" | "terminal" | "unknown";
  error?: Error;
  stdout: string;
  stderr: string;
  timedOut?: boolean;
};

export type PortableCommandOptions = {
  capture?: boolean;
  env?: NodeJS.ProcessEnv;
  input?: string;
  timeoutMs?: number;
};

export type PortableStreamingCommandOptions = {
  captureBytes?: number;
  env?: NodeJS.ProcessEnv;
  onStderr?: (chunk: string) => void;
  onStdout?: (chunk: string) => void;
  shouldStop?: () => boolean;
  stopGraceMs?: number;
  timeoutMs?: number;
};

export type PortableStreamingCommandResult = PortableCommandResult & {
  forced: boolean;
  stopError?: Error;
  stopped: boolean;
  timedOut: boolean;
};

export type PortableCommandResolution =
  | {
      ok: true;
      executable: string;
      args: readonly string[];
      selected: string;
      kind: "native" | "cmd";
    }
  | {
      ok: false;
      command: string;
      candidates: readonly string[];
      reason: string;
    };

const WINDOWS_SHIM_NAMES = new Set(["npm", "npx", "openspec"]);
const WINDOWS_NATIVE_EXTENSIONS = [".exe", ".com", ".EXE", ".COM"] as const;
const WINDOWS_CMD_EXTENSIONS = [".cmd", ".bat", ".CMD", ".BAT"] as const;

function pathEnvironmentValue(environment: NodeJS.ProcessEnv): string {
  return environment.PATH
    ?? Object.entries(environment).find(([name]) => name.toUpperCase() === "PATH")?.[1]
    ?? "";
}

function isExistingFile(candidate: string): boolean {
  try {
    const stat = fs.lstatSync(candidate);
    return stat.isFile() && !stat.isSymbolicLink();
  } catch {
    return false;
  }
}

function hasPathSeparator(value: string): boolean {
  return value.includes("/") || value.includes("\\") || path.win32.isAbsolute(value);
}

function isWindowsCmdExtension(extension: string): boolean {
  return WINDOWS_CMD_EXTENSIONS.some((candidate) => candidate === extension);
}

function isWindowsNativeExtension(extension: string): boolean {
  return WINDOWS_NATIVE_EXTENSIONS.some((candidate) => candidate === extension);
}

function windowsCandidateExtensions(baseName: string): readonly string[] {
  if (WINDOWS_SHIM_NAMES.has(baseName.toLowerCase())) {
    return [...WINDOWS_CMD_EXTENSIONS, ...WINDOWS_NATIVE_EXTENSIONS];
  }
  return [...WINDOWS_NATIVE_EXTENSIONS, ...WINDOWS_CMD_EXTENSIONS];
}

function quoteWindowsCmdArg(value: string): string {
  return `"${value.replaceAll('"', '""')}"`;
}

function resolveWindowsComSpec(environment: NodeJS.ProcessEnv): string {
  const fromEnv = environment.ComSpec ?? environment.COMSPEC;
  if (fromEnv && hasPathSeparator(fromEnv) && isExistingFile(fromEnv)) {
    return fromEnv;
  }
  const fromProcess = process.env.ComSpec ?? process.env.COMSPEC;
  if (fromProcess && isExistingFile(fromProcess)) {
    return fromProcess;
  }
  const systemRoot = environment.SystemRoot ?? process.env.SystemRoot ?? "C:\\Windows";
  return path.join(systemRoot, "System32", "cmd.exe");
}

function resolvedCmdInvocation(selected: string, args: readonly string[], environment: NodeJS.ProcessEnv): PortableCommandResolution {
  return {
    ok: true,
    executable: resolveWindowsComSpec(environment),
    args: ["/d", "/c", "call", quoteWindowsCmdArg(selected), ...args.map(quoteWindowsCmdArg)],
    selected,
    kind: "cmd",
  };
}

function resolvedNativeInvocation(selected: string, args: readonly string[]): PortableCommandResolution {
  return {
    ok: true,
    executable: selected,
    args,
    selected,
    kind: "native",
  };
}

function unresolvedCommand(command: string, candidates: readonly string[], pathEntries: number): PortableCommandResolution {
  const tried = candidates.length > 0 ? candidates.join(", ") : command;
  return {
    ok: false,
    command,
    candidates,
    reason: `Unable to resolve command ${JSON.stringify(command)}. Tried: ${tried}. Searched ${pathEntries} PATH entries.`,
  };
}

export function resolvePortableCommand(
  argv: readonly string[],
  environment: NodeJS.ProcessEnv = process.env,
  platform: NodeJS.Platform = process.platform,
): PortableCommandResolution {
  if (argv.length === 0 || argv[0].trim() === "") {
    throw new Error("Command argv must contain a non-empty executable.");
  }
  const command = argv[0];
  const args = argv.slice(1);
  if (platform !== "win32") {
    return resolvedNativeInvocation(command, args);
  }
  const extension = path.win32.extname(command);
  if (extension.toLowerCase() === ".ps1") {
    return unresolvedCommand(command, [path.win32.basename(command)], 0);
  }
  if (isWindowsNativeExtension(extension)) {
    return resolvedNativeInvocation(command, args);
  }
  if (isWindowsCmdExtension(extension)) {
    if (hasPathSeparator(command) && !isExistingFile(command)) {
      return unresolvedCommand(command, [path.win32.basename(command)], 0);
    }
    if (!hasPathSeparator(command)) {
      const searchPath = pathEnvironmentValue(environment);
      const directories = searchPath.split(path.delimiter).filter(Boolean);
      for (const directory of directories) {
        const candidate = path.join(directory, command);
        if (isExistingFile(candidate)) {
          return resolvedCmdInvocation(candidate, args, environment);
        }
      }
      return unresolvedCommand(command, [path.win32.basename(command)], directories.length);
    }
    return resolvedCmdInvocation(command, args, environment);
  }
  const searchPath = pathEnvironmentValue(environment);
  const directories = hasPathSeparator(command) ? [path.win32.dirname(command)] : searchPath.split(path.delimiter).filter(Boolean);
  const baseName = path.win32.basename(command);
  const extensions = windowsCandidateExtensions(baseName);
  const candidates = extensions.map((item) => `${baseName}${item}`);
  if (hasPathSeparator(command) && isExistingFile(command)) {
    return resolvedNativeInvocation(command, args);
  }
  for (const directory of directories) {
    for (const item of extensions) {
      const candidate = path.join(directory, `${hasPathSeparator(command) ? baseName : command}${item}`);
      if (!isExistingFile(candidate)) {
        continue;
      }
      if (isWindowsCmdExtension(item)) {
        return resolvedCmdInvocation(candidate, args, environment);
      }
      return resolvedNativeInvocation(candidate, args);
    }
  }
  return unresolvedCommand(command, candidates, directories.length);
}

export function formatArgv(argv: readonly string[]): string {
  return argv.map((value) => (/^[A-Za-z0-9._/:\\=@+-]+$/.test(value) ? value : JSON.stringify(value))).join(" ");
}

function supervisedCommand(
  root: string,
  resolution: Extract<PortableCommandResolution, { ok: true }>,
  options: PortableCommandOptions,
): PortableCommandResult {
  const timeoutMs = options.timeoutMs!;
  const supervisor = fileURLToPath(new URL("./portable-process-supervisor.ts", import.meta.url));
  const result = spawnSync(process.execPath, [supervisor], {
    cwd: root,
    encoding: "utf8",
    env: process.env,
    input: JSON.stringify({
      args: [...resolution.args],
      cwd: root,
      env: options.env ?? process.env,
      executable: resolution.executable,
      ...(options.input == null ? {} : { input: options.input }),
      timeoutMs,
      windowsVerbatimArguments: resolution.kind === "cmd",
    }),
    maxBuffer: 12 * 1024 * 1024,
    shell: false,
    timeout: timeoutMs + 20_000,
  });
  if (result.error != null || result.status !== 0) {
    const cause = result.error ?? new Error(`Portable process supervisor exited ${String(result.status)}`);
    return {
      cleanupState: "unknown",
      error: cause,
      signal: result.signal,
      status: result.status,
      stderr: typeof result.stderr === "string" ? result.stderr : "",
      stdout: "",
      timedOut: (cause as NodeJS.ErrnoException).code === "ETIMEDOUT",
    };
  }
  try {
    const parsed = JSON.parse(result.stdout) as {
      cleanupState: PortableCommandResult["cleanupState"];
      error: { code: string | null; message: string; name: string } | null;
      signal: NodeJS.Signals | null;
      status: number | null;
      stderr: string;
      stdout: string;
      timedOut: boolean;
    };
    const error = parsed.error == null
      ? undefined
      : Object.assign(new Error(parsed.error.message), { code: parsed.error.code, name: parsed.error.name });
    return {
      cleanupState: parsed.cleanupState,
      ...(error == null ? {} : { error }),
      signal: parsed.signal,
      status: parsed.status,
      stderr: parsed.stderr,
      stdout: parsed.stdout,
      timedOut: parsed.timedOut,
    };
  } catch (error) {
    return {
      cleanupState: "unknown",
      error: new Error("Portable process supervisor returned invalid JSON", { cause: error }),
      signal: result.signal,
      status: result.status,
      stderr: typeof result.stderr === "string" ? result.stderr : "",
      stdout: "",
      timedOut: false,
    };
  }
}

export function runPortableCommand(root: string, argv: readonly string[], options: PortableCommandOptions = {}): PortableCommandResult {
  if (argv.length === 0 || argv[0].trim() === "") {
    throw new Error("Command argv must contain a non-empty executable.");
  }

  const stdio = options.capture === true ? "pipe" : "inherit";
  const environment = options.env ?? process.env;
  const common = {
    cwd: root,
    encoding: "utf8" as const,
    env: environment,
    ...(options.input == null ? {} : { input: options.input }),
    ...(options.timeoutMs == null ? {} : { timeout: options.timeoutMs }),
    shell: false,
    stdio,
  };
  const resolution = resolvePortableCommand(argv, environment);
  if (!resolution.ok) {
    return {
      status: 1,
      signal: null,
      error: new Error(resolution.reason),
      stdout: "",
      stderr: resolution.reason,
    };
  }
  if (options.capture === true && options.timeoutMs != null) {
    return supervisedCommand(root, resolution, options);
  }
  const result = spawnSync(resolution.executable, [...resolution.args], {
    ...common,
    ...(resolution.kind === "cmd" ? { windowsVerbatimArguments: true } : {}),
  });

  return {
    status: result.status,
    signal: result.signal,
    ...(result.error == null ? {} : { error: result.error }),
    stdout: typeof result.stdout === "string" ? result.stdout : "",
    stderr: typeof result.stderr === "string" ? result.stderr : "",
  };
}

export function commandExitCode(result: Pick<PortableCommandResult, "status" | "signal" | "error">): number {
  return result.status ?? 1;
}

export async function runPortableCommandStreaming(
  root: string,
  argv: readonly string[],
  options: PortableStreamingCommandOptions = {},
): Promise<PortableStreamingCommandResult> {
  if (argv.length === 0 || argv[0].trim() === "") {
    throw new Error("Command argv must contain a non-empty executable.");
  }
  const environment = options.env ?? process.env;
  const resolution = resolvePortableCommand(argv, environment);
  if (!resolution.ok) {
    return {
      status: 1,
      signal: null,
      error: new Error(resolution.reason),
      forced: false,
      stderr: resolution.reason,
      stdout: "",
      stopped: false,
      timedOut: false,
    };
  }
  const command = resolution.executable;
  const args = [...resolution.args];
  const captureBytes = options.captureBytes ?? 200_000;
  const append = (current: string, chunk: string): string => {
    if (current.length >= captureBytes) return current;
    const remaining = captureBytes - current.length;
    return `${current}${chunk.slice(0, remaining)}${chunk.length > remaining ? "\n<truncated>" : ""}`;
  };

  return await new Promise((resolve) => {
    let error: Error | undefined;
    let forced = false;
    let settled = false;
    let stderr = "";
    let stdout = "";
    let stopError: Error | undefined;
    let stopped = false;
    let timedOut = false;
    const child = spawn(command, args, {
      cwd: root,
      env: environment,
      shell: false,
      stdio: "pipe",
      ...(resolution.kind === "cmd" ? { windowsVerbatimArguments: true } : {}),
    });
    const timers: Array<ReturnType<typeof setTimeout> | ReturnType<typeof setInterval>> = [];
    const terminate = (): void => {
      if (child.exitCode != null || child.signalCode != null) return;
      try {
        child.kill("SIGINT");
      } catch (cause) {
        stopError ??= cause instanceof Error ? cause : new Error(String(cause));
      }
      timers.push(setTimeout(() => {
        if (child.exitCode != null || child.signalCode != null) return;
        forced = true;
        try {
          child.kill("SIGKILL");
        } catch (cause) {
          stopError ??= cause instanceof Error ? cause : new Error(String(cause));
        }
      }, options.stopGraceMs ?? 5_000));
    };
    child.stdout.on("data", (value) => {
      const chunk = String(value);
      stdout = append(stdout, chunk);
      options.onStdout?.(chunk);
    });
    child.stderr.on("data", (value) => {
      const chunk = String(value);
      stderr = append(stderr, chunk);
      options.onStderr?.(chunk);
    });
    child.on("error", (cause) => {
      error = cause;
    });
    child.on("close", (status, signal) => {
      if (settled) return;
      settled = true;
      for (const timer of timers) clearTimeout(timer as ReturnType<typeof setTimeout>);
      resolve({ status, signal, ...(error == null ? {} : { error }), forced, stderr, stdout, ...(stopError == null ? {} : { stopError }), stopped, timedOut });
    });
    if (options.shouldStop != null) {
      timers.push(setInterval(() => {
        if (stopped || settled) return;
        try {
          if (!options.shouldStop!()) return;
          stopped = true;
          terminate();
        } catch (cause) {
          stopped = true;
          stopError = cause instanceof Error ? cause : new Error(String(cause));
          terminate();
        }
      }, 100));
    }
    if (options.timeoutMs != null) {
      timers.push(setTimeout(() => {
        if (settled) return;
        timedOut = true;
        terminate();
      }, options.timeoutMs));
    }
  });
}
