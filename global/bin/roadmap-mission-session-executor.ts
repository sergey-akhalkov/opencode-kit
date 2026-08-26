#!/usr/bin/env node
import path from "node:path";
import { pathToFileURL } from "node:url";
import { RoadmapMissionError, stableJson } from "./roadmap-mission/contracts.ts";
import { executeMissionSession } from "./roadmap-mission/session-executor.ts";
import type { SessionExecutorOptions } from "./roadmap-mission/session-executor.ts";

function usage(): string {
  return [
    "Usage:",
    "  node roadmap-mission-session-executor.ts execute --root <project-root> --mission <project-contained-json> --slice <slice-id> --attempt <number> --result <project-contained-json> [--server-url <loopback-origin>] [--parent-session <session-id>] [--timeout-ms <number>]",
    "  --server-url defaults to OPENCODE_ROADMAP_SERVER_URL; --parent-session defaults to OPENCODE_ROADMAP_PARENT_SESSION.",
    "  Executes one bounded slice through the current loopback OpenCode runtime; it never starts a nested server or performs archive, commit, or remote mutation itself.",
    "  Operators use /mission-status for read-only state, /mission-stop for graceful intent, and cockpit Kill only as an emergency hard stop.",
  ].join("\n");
}

function requiredValue(args: string[], index: number, option: string): string {
  const value = args[index + 1];
  if (value == null || value.trim() === "" || value.startsWith("--")) throw new RoadmapMissionError(`Missing value for ${option}`, 2);
  return value;
}

export function parseSessionExecutorArgs(args: string[]): SessionExecutorOptions {
  if (args[0] === "--help" || args[0] === "-h") {
    console.log(usage());
    process.exit(0);
  }
  if (args[0] !== "execute") throw new RoadmapMissionError("Supported operation is execute", 2);
  const values = new Map<string, string>();
  for (let index = 1; index < args.length; index++) {
    const option = args[index];
    if (!["--root", "--server-url", "--mission", "--slice", "--attempt", "--result", "--parent-session", "--timeout-ms"].includes(option)) {
      throw new RoadmapMissionError(`Unknown option: ${option}`, 2);
    }
    values.set(option, requiredValue(args, index, option));
    index++;
  }
  for (const option of ["--root", "--mission", "--slice", "--attempt", "--result"]) {
    if (!values.has(option)) throw new RoadmapMissionError(`Missing required ${option}`, 2);
  }
  const attempt = Number(values.get("--attempt"));
  const timeoutMs = Number(values.get("--timeout-ms") ?? "900000");
  if (!Number.isSafeInteger(attempt) || attempt < 1 || attempt > 20) throw new RoadmapMissionError("--attempt must be an integer between 1 and 20", 2);
  if (!Number.isSafeInteger(timeoutMs) || timeoutMs < 1_000 || timeoutMs > 86_400_000) {
    throw new RoadmapMissionError("--timeout-ms must be an integer between 1000 and 86400000", 2);
  }
  return {
    attempt,
    missionPath: values.get("--mission")!,
    parentSessionRef: values.get("--parent-session") ?? process.env.OPENCODE_ROADMAP_PARENT_SESSION ?? null,
    resultPath: values.get("--result")!,
    root: path.resolve(values.get("--root")!),
    serverUrl: values.get("--server-url") ?? process.env.OPENCODE_ROADMAP_SERVER_URL ?? "",
    sliceId: values.get("--slice")!,
    timeoutMs,
  };
}

function directExecution(): boolean {
  return process.argv[1] != null && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;
}

if (directExecution()) {
  try {
    const result = await executeMissionSession(parseSessionExecutorArgs(process.argv.slice(2)));
    console.log(stableJson(result).trimEnd());
    process.exitCode = result.disposition === "completed" ? 0 : result.disposition === "owner-required" || result.disposition === "paused" ? 3 : 1;
  } catch (error) {
    const failure = error instanceof RoadmapMissionError
      ? error
      : new RoadmapMissionError("Roadmap mission session executor failed", 1, { cause: error });
    console.error(stableJson({
      error: failure.message,
      exitCode: failure.exitCode,
      operation: process.argv[2] ?? "unknown",
      schemaVersion: 1,
      status: "blocked",
      tool: "roadmap-mission-session-executor",
    }).trimEnd());
    process.exitCode = failure.exitCode;
  }
}
