#!/usr/bin/env node
import path from "node:path";
import { pathToFileURL } from "node:url";
import {
  RoadmapMissionError,
  stableJson,
} from "./roadmap-mission/contracts.ts";
import {
  loadedWorkflowCheck,
  preflightMission,
  preflightMissionDefinition,
} from "./roadmap-mission/preflight.ts";
import {
  reconcileMissionState,
  recordMissionTransition,
  replayMissionState,
} from "./roadmap-mission/state.ts";
import {
  resumeMissionController,
  runMissionController,
} from "./roadmap-mission/controller.ts";

export {
  loadMissionDefinition,
  parseMissionDefinition,
  RoadmapMissionError,
  stableJson,
} from "./roadmap-mission/contracts.ts";
export type {
  CheckpointMode,
  EffectClass,
  MissionCheck,
  MissionOperation,
  RoadmapMissionDefinition,
  RoadmapMissionPreflight,
  RoadmapMissionSlice,
} from "./roadmap-mission/contracts.ts";
export {
  preflightMission,
  preflightMissionDefinition,
} from "./roadmap-mission/preflight.ts";

type CliOptions = {
  globalSource: string;
  event: string;
  adapter: string;
  checkpointIdentity: string;
  mission: string;
  operation: "definition" | "preflight" | "resume" | "run" | "state-reconcile" | "state-record" | "state-replay" | "workflow";
  root: string;
};

function usage(): string {
  return [
    "Usage:",
    "  node roadmap-mission.ts preflight --root <project-root> --global-source <kit-global-source> --mission <project-contained-json>",
    "  node roadmap-mission.ts definition --root <project-root> --mission <project-contained-json>",
    "  node roadmap-mission.ts workflow --root <project-root> --global-source <kit-global-source>",
    "  node roadmap-mission.ts state-record --root <project-root> --mission <project-contained-json> --event <project-contained-json>",
    "  node roadmap-mission.ts state-replay --root <project-root> --mission <project-contained-json>",
    "  node roadmap-mission.ts state-reconcile --root <project-root> --mission <project-contained-json> --event <project-contained-json>",
    "  node roadmap-mission.ts run --root <project-root> --global-source <kit-global-source> --mission <project-contained-json> --adapter <project-contained-json>",
    "  node roadmap-mission.ts resume --root <project-root> --global-source <kit-global-source> --mission <project-contained-json> --adapter <project-contained-json>",
  ].join("\n");
}

function requiredValue(args: string[], index: number, option: string): string {
  const value = args[index + 1];
  if (value == null || value.trim() === "" || value.startsWith("--")) {
    throw new RoadmapMissionError(`Missing value for ${option}`, 2);
  }
  return value;
}

export function parseArgs(args: string[]): CliOptions {
  const operation = args[0];
  if (operation === "--help" || operation === "-h") {
    console.log(usage());
    process.exit(0);
  }
  if (
    operation !== "preflight" &&
    operation !== "definition" &&
    operation !== "workflow" &&
    operation !== "state-record" &&
    operation !== "state-replay" &&
    operation !== "state-reconcile"
    && operation !== "run"
    && operation !== "resume"
  ) {
    throw new RoadmapMissionError("Supported operations are preflight, definition, workflow, state-record, state-replay, and state-reconcile", 2);
  }
  let root = "";
  let mission = "";
  let globalSource = "";
  let event = "";
  let adapter = "";
  let checkpointIdentity = "";
  for (let index = 1; index < args.length; index++) {
    const arg = args[index];
    if (arg === "--root") {
      root = requiredValue(args, index, arg);
      index++;
    } else if (arg === "--mission") {
      mission = requiredValue(args, index, arg);
      index++;
    } else if (arg === "--global-source") {
      globalSource = requiredValue(args, index, arg);
      index++;
    } else if (arg === "--event") {
      event = requiredValue(args, index, arg);
      index++;
    } else if (arg === "--adapter") {
      adapter = requiredValue(args, index, arg);
      index++;
    } else if (arg === "--checkpoint-identity") {
      checkpointIdentity = requiredValue(args, index, arg);
      index++;
    } else {
      throw new RoadmapMissionError(`Unknown option: ${arg}`, 2);
    }
  }
  if (root === "") throw new RoadmapMissionError("Missing required --root <project-root>", 2);
  if ((operation === "preflight" || operation === "workflow" || operation === "run" || operation === "resume") && globalSource === "") {
    throw new RoadmapMissionError("Missing required --global-source <kit-global-source>", 2);
  }
  if (operation !== "workflow" && mission === "") {
    throw new RoadmapMissionError("Missing required --mission <project-contained-json>", 2);
  }
  if ((operation === "state-record" || operation === "state-reconcile") && event === "") {
    throw new RoadmapMissionError("Missing required --event <project-contained-json>", 2);
  }
  if ((operation === "run" || operation === "resume") && adapter === "") {
    throw new RoadmapMissionError("Missing required --adapter <project-contained-json>", 2);
  }
  return {
    adapter,
    checkpointIdentity,
    event,
    globalSource: globalSource === "" ? "" : path.resolve(globalSource),
    mission,
    operation,
    root: path.resolve(root),
  };
}

function directExecution(): boolean {
  return process.argv[1] != null && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;
}

if (directExecution()) {
  try {
    const options = parseArgs(process.argv.slice(2));
    const report = options.operation === "definition"
      ? preflightMissionDefinition(options.root, options.mission)
      : options.operation === "workflow"
        ? (() => {
            const check = loadedWorkflowCheck(options.root, options.globalSource);
            const eligible = check.status === "passed" && !check.blocking;
            return {
              check,
              exitCode: eligible ? 0 : 1,
              operation: "workflow",
              schemaVersion: 1,
              status: eligible ? "eligible" : "blocked",
              tool: "roadmap-mission",
            };
          })()
        : options.operation === "run" || options.operation === "resume"
          ? (options.operation === "run" ? runMissionController : resumeMissionController)({
              adapterPath: options.adapter,
              ...(options.checkpointIdentity === "" ? {} : { checkpointIdentity: options.checkpointIdentity }),
              globalSource: options.globalSource,
              missionPath: options.mission,
              root: options.root,
            })
          : options.operation === "state-record"
          ? (() => {
              const transition = recordMissionTransition(options.root, options.mission, options.event);
              return {
                exitCode: 0,
                operation: "state-record",
                schemaVersion: 1,
                status: "recorded",
                tool: "roadmap-mission",
                transition,
              };
            })()
          : options.operation === "state-replay"
            ? replayMissionState(options.root, options.mission)
            : options.operation === "state-reconcile"
              ? (() => {
                  const transition = reconcileMissionState(options.root, options.mission, options.event);
                  return {
                    exitCode: 0,
                    operation: "state-reconcile",
                    schemaVersion: 1,
                    status: "recorded",
                    tool: "roadmap-mission",
                    transition,
                  };
                })()
              : preflightMission(options.root, options.globalSource, options.mission);
    console.log(stableJson(report).trimEnd());
    process.exitCode = report.exitCode;
  } catch (error) {
    const failure = error instanceof RoadmapMissionError
      ? error
      : new RoadmapMissionError("Roadmap mission preflight failed", 1, { cause: error });
    console.error(stableJson({
      error: failure.message,
      exitCode: failure.exitCode,
      operation: process.argv[2] ?? "unknown",
      schemaVersion: 1,
      status: "blocked",
      tool: "roadmap-mission",
    }).trimEnd());
    process.exitCode = failure.exitCode;
  }
}
