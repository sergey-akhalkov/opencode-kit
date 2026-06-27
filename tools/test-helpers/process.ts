import { spawnSync } from "node:child_process";
import type { SpawnSyncOptions } from "node:child_process";

export type ProcessResult = {
  status: number | null;
  stdout: string;
  stderr: string;
};

export function invokeProcessCapture(
  command: string,
  args: string[],
  options: SpawnSyncOptions = {},
): ProcessResult {
  const result = spawnSync(command, args, { encoding: "utf8", ...options });
  return {
    status: result.status,
    stdout: typeof result.stdout === "string" ? result.stdout : "",
    stderr: typeof result.stderr === "string" ? result.stderr : "",
  };
}

export function assertSuccess(result: ProcessResult, message: string): void {
  if (result.status !== 0) {
    throw new Error(
      `${message}\nexit=${result.status}\nstdout=${result.stdout}\nstderr=${result.stderr}`,
    );
  }
}

export function assertFailure(result: ProcessResult, message: string): void {
  if (result.status === 0) {
    throw new Error(
      `${message}\nexit=0\nstdout=${result.stdout}\nstderr=${result.stderr}`,
    );
  }
}

export function assertOutputContains(
  result: ProcessResult,
  needle: string,
  message: string,
): void {
  if (!result.stdout.includes(needle) && !result.stderr.includes(needle)) {
    throw new Error(
      `${message}\nExpected output to contain: ${needle}\nstdout=${result.stdout}\nstderr=${result.stderr}`,
    );
  }
}

export function assertOutputExcludes(
  result: ProcessResult,
  needle: string,
  message: string,
): void {
  if (result.stdout.includes(needle) || result.stderr.includes(needle)) {
    throw new Error(
      `${message}\nExpected output to exclude: ${needle}\nstdout=${result.stdout}\nstderr=${result.stderr}`,
    );
  }
}
