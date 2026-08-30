import fs from "node:fs";
import path from "node:path";
import {
  missionDefinitionDigest,
  parseMissionExecutorResult,
  RoadmapMissionError,
} from "./contracts.ts";
import type {
  PersistedMissionExecutorResult,
  RoadmapMissionDefinition,
  RoadmapMissionSlice,
} from "./contracts.ts";

export function expandExecutorArgv(
  argv: string[],
  definition: RoadmapMissionDefinition,
  slice: RoadmapMissionSlice,
  attempt: number,
  globalSource: string,
  missionPath: string,
  root: string,
  resultPath: string,
): string[] {
  const values = {
    attempt: String(attempt),
    changeId: slice.changeId,
    definitionDigest: missionDefinitionDigest(definition),
    globalSource,
    missionId: definition.missionId,
    missionPath,
    operation: slice.operation,
    resultPath,
    root,
    sliceId: slice.id,
  };
  return argv.map((value) => Object.entries(values).reduce(
    (expanded, [name, replacement]) => expanded.replaceAll(`{${name}}`, replacement),
    value,
  ));
}

export function readExecutorResult(
  root: string,
  definition: RoadmapMissionDefinition,
  slice: RoadmapMissionSlice,
  attempt: number,
  resultPath: string,
): PersistedMissionExecutorResult {
  const file = path.resolve(root, resultPath);
  let parsed: unknown;
  try {
    const stat = fs.lstatSync(file);
    if (stat.isSymbolicLink() || !stat.isFile() || stat.size > 1_000_000) {
      throw new Error("not a bounded regular file");
    }
    parsed = JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (error) {
    throw new RoadmapMissionError("executor result must be a readable bounded regular JSON file", 1, { cause: error });
  }
  const result = parseMissionExecutorResult(parsed, {
    attempt,
    definitionDigest: missionDefinitionDigest(definition),
    missionId: definition.missionId,
    slice,
  });
  for (const evidenceRef of result.evidenceRefs) {
    if (!evidenceRef.startsWith(`${definition.evidencePath}/`)) {
      throw new RoadmapMissionError("executor evidence reference is outside the mission evidence path", 1);
    }
    try {
      const stat = fs.lstatSync(path.resolve(root, evidenceRef));
      if (stat.isSymbolicLink() || !stat.isFile()) throw new Error("not a regular file");
    } catch (error) {
      throw new RoadmapMissionError("executor evidence reference is not a readable regular file", 1, { cause: error });
    }
  }
  return result;
}
