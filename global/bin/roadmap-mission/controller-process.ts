import { runPortableCommandStreaming } from "../portable-process.ts";
import { RoadmapMissionError } from "./contracts.ts";
import type { MissionExecutorDisposition, RoadmapMissionDefinition, RoadmapMissionSlice } from "./contracts.ts";
import { readMissionStopIntent, recordMissionStopIntent } from "./state.ts";

export type ProcessEvidence = {
  argv: string[];
  cleanupState?: "not-needed" | "terminal" | "unknown";
  exitCode: number | null;
  executorDisposition?: MissionExecutorDisposition;
  executorResultPath?: string;
  forced?: boolean;
  resultError?: string;
  signal: string | null;
  stderr: string;
  stopped?: boolean;
  stdout: string;
  timedOut?: boolean;
};

export function bounded(value: string, max = 20_000): string {
  return value.length <= max ? value : `${value.slice(0, max)}\n<truncated>`;
}

export function redacted(value: string, roots: string[]): string {
  return roots.reduce((text, root, index) => text
    .replaceAll(root, index === 0 ? "<project-root>" : "<global-source>")
    .replaceAll(root.replaceAll("\\", "/"), index === 0 ? "<project-root>" : "<global-source>"), value);
}

function prefixedWriter(prefix: string, roots: string[], stream: { write: (value: string) => unknown }): {
  flush: () => void;
  push: (chunk: string) => void;
} {
  let buffered = "";
  const emit = (line: string): void => {
    const safe = redacted(line, roots);
    stream.write(`${prefix} ${safe.length <= 4_000 ? safe : `${safe.slice(0, 4_000)} <truncated>`}\n`);
  };
  return {
    flush: () => {
      if (buffered !== "") emit(buffered);
      buffered = "";
    },
    push: (chunk) => {
      buffered += chunk;
      const lines = buffered.split(/\r?\n/);
      buffered = lines.pop() ?? "";
      for (const line of lines) emit(line);
    },
  };
}

export function missionStopRequested(
  root: string,
  definition: RoadmapMissionDefinition,
  signalRequested: boolean,
): boolean {
  let intent = readMissionStopIntent(root, definition);
  if (signalRequested && intent == null) {
    intent = recordMissionStopIntent(root, definition, {
      controllerPtyRef: null,
      rootSessionRef: null,
      source: "signal",
    });
  }
  return intent != null;
}

export async function invokeMissionExecutor(
  root: string,
  globalSource: string,
  definition: RoadmapMissionDefinition,
  slice: RoadmapMissionSlice,
  argv: string[],
  timeoutMs: number,
  signalRequested: () => boolean,
): Promise<ProcessEvidence> {
  const roots = [root, globalSource];
  const stdout = prefixedWriter(`[${slice.id}/${slice.changeId}/session/stdout]`, roots, process.stderr);
  const stderr = prefixedWriter(`[${slice.id}/${slice.changeId}/session/stderr]`, roots, process.stderr);
  const result = await runPortableCommandStreaming(root, argv, {
    captureBytes: 200_000,
    onStderr: stderr.push,
    onStdout: stdout.push,
    shouldStop: () => missionStopRequested(root, definition, signalRequested()),
    stopGraceMs: 5_000,
    timeoutMs,
  });
  stdout.flush();
  stderr.flush();
  if (result.stopError != null) {
    throw new RoadmapMissionError("mission executor stop observation failed", 1, { cause: result.stopError });
  }
  if (result.error != null) {
    throw new RoadmapMissionError("mission executor could not start", 1, { cause: result.error });
  }
  return {
    argv: argv.map((value) => redacted(value, roots)),
    exitCode: result.status,
    forced: result.forced,
    signal: result.signal,
    stderr: bounded(redacted(result.stderr, roots)),
    stopped: result.stopped,
    stdout: bounded(redacted(result.stdout, roots)),
    timedOut: result.timedOut,
  };
}
