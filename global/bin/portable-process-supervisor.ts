#!/usr/bin/env node
import { spawn, spawnSync } from "node:child_process";
import path from "node:path";

type CleanupState = "not-needed" | "terminal" | "unknown";

type SupervisorRequest = {
  args: string[];
  cwd: string;
  env: NodeJS.ProcessEnv;
  executable: string;
  input?: string;
  timeoutMs: number;
  windowsVerbatimArguments: boolean;
};

type SupervisorResult = {
  cleanupState: CleanupState;
  error: { code: string | null; message: string; name: string } | null;
  signal: NodeJS.Signals | null;
  status: number | null;
  stderr: string;
  stdout: string;
  timedOut: boolean;
};

const CAPTURE_BYTES = 5_000_000;
const STOP_WAIT_MS = 5_000;

function append(current: string, chunk: string): string {
  if (current.length >= CAPTURE_BYTES) return current;
  const remaining = CAPTURE_BYTES - current.length;
  return `${current}${chunk.slice(0, remaining)}${chunk.length > remaining ? "\n<truncated>" : ""}`;
}

function errorRecord(error: Error & { code?: unknown }): SupervisorResult["error"] {
  return {
    code: typeof error.code === "string" ? error.code : null,
    message: error.message,
    name: error.name,
  };
}

function delay(timeoutMs: number): Promise<false> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve(false), timeoutMs);
    timer.unref();
  });
}

async function terminateOwnedTree(
  child: ReturnType<typeof spawn>,
  request: SupervisorRequest,
  closed: Promise<true>,
): Promise<CleanupState> {
  if (child.pid == null) return "unknown";
  if (process.platform === "win32") {
    const systemRoot = request.env.SystemRoot ?? request.env.SYSTEMROOT ?? process.env.SystemRoot ?? "C:\\Windows";
    const comSpec = request.env.ComSpec ?? request.env.COMSPEC ?? `${systemRoot}\\System32\\cmd.exe`;
    const taskkillPath = path.join(path.dirname(comSpec), "taskkill.exe");
    const taskkill = spawnSync(taskkillPath, ["/PID", String(child.pid), "/T", "/F"], {
      encoding: "utf8",
      shell: false,
      timeout: 10_000,
    });
    if (taskkill.error != null || taskkill.status !== 0) {
      try {
        child.kill("SIGKILL");
      } catch {
        // The cleanup state remains unknown when the owned tree command fails.
      }
      await Promise.race([closed, delay(STOP_WAIT_MS)]);
      return "unknown";
    }
    return await Promise.race([closed, delay(STOP_WAIT_MS)]) ? "terminal" : "unknown";
  }

  try {
    process.kill(-child.pid, "SIGTERM");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ESRCH") return "unknown";
  }
  if (await Promise.race([closed, delay(500)])) return "terminal";
  try {
    process.kill(-child.pid, "SIGKILL");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ESRCH") return "unknown";
  }
  return await Promise.race([closed, delay(STOP_WAIT_MS)]) ? "terminal" : "unknown";
}

async function run(request: SupervisorRequest): Promise<SupervisorResult> {
  let spawnError: (Error & { code?: unknown }) | null = null;
  let status: number | null = null;
  let signal: NodeJS.Signals | null = null;
  let stdout = "";
  let stderr = "";
  const child = spawn(request.executable, request.args, {
    cwd: request.cwd,
    detached: process.platform !== "win32",
    env: request.env,
    shell: false,
    stdio: "pipe",
    ...(request.windowsVerbatimArguments ? { windowsVerbatimArguments: true } : {}),
  });
  child.stdout.on("data", (value) => {
    stdout = append(stdout, String(value));
  });
  child.stderr.on("data", (value) => {
    stderr = append(stderr, String(value));
  });
  child.on("error", (error) => {
    spawnError = error;
  });
  if (request.input == null) child.stdin.end();
  else child.stdin.end(request.input);

  const closed = new Promise<true>((resolve) => {
    child.once("close", (exitStatus, exitSignal) => {
      status = exitStatus;
      signal = exitSignal;
      resolve(true);
    });
  });
  const completed = await Promise.race([closed, delay(request.timeoutMs)]);
  if (completed) {
    return {
      cleanupState: "not-needed",
      error: spawnError == null ? null : errorRecord(spawnError),
      signal,
      status,
      stderr,
      stdout,
      timedOut: false,
    };
  }

  const cleanupState = await terminateOwnedTree(child, request, closed);
  const timeout = Object.assign(new Error(`Command timed out after ${request.timeoutMs}ms`), { code: "ETIMEDOUT" });
  return {
    cleanupState,
    error: errorRecord(timeout),
    signal,
    status,
    stderr,
    stdout,
    timedOut: true,
  };
}

async function main(): Promise<void> {
  let source = "";
  process.stdin.setEncoding("utf8");
  for await (const chunk of process.stdin) source += chunk;
  const request = JSON.parse(source) as SupervisorRequest;
  process.stdout.write(`${JSON.stringify(await run(request))}\n`);
}

void main().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.stack ?? error.message : String(error)}\n`);
  process.exitCode = 1;
});
