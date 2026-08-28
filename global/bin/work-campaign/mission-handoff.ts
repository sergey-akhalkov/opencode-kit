import fs from "node:fs";
import path from "node:path";

import { runPortableCommand } from "../portable-process.ts";
import {
  loadMissionDefinition,
  missionDefinitionDigest,
  parseMissionDefinition,
  RoadmapMissionError,
  stableJson,
} from "../roadmap-mission/contracts.ts";
import type {
  MissionParentHandoff,
  RoadmapMissionDefinition,
} from "../roadmap-mission/contracts.ts";
import {
  buildMissionParentHandoff,
  missionParentWaveDigest,
  parseMissionParentHandoff,
} from "../roadmap-mission/parent-correlation.ts";
import {
  readMissionStateProjection,
  recordMissionStopIntent,
  replayMissionState,
} from "../roadmap-mission/state.ts";
import { campaignDigest, WorkCampaignError } from "./contracts.ts";
import type {
  CampaignWaveManifest,
  WorkCampaignDefinition,
} from "./contracts.ts";

export type CampaignMissionOptions = {
  adapterPath: string;
  checkpointIdentity?: string;
  globalSource: string;
};

export type CampaignMissionMaterialization = {
  correlationDigest: string;
  definition: RoadmapMissionDefinition;
  definitionDigest: string;
  missionPath: string;
  missionRef: string;
  waveDigest: string;
  wavePath: string;
};

const typedRefPattern = /^[a-z][a-z0-9-]*:(?:[A-Za-z0-9][A-Za-z0-9._/#-]*|\.[A-Za-z0-9][A-Za-z0-9._/#-]*)$/u;

function containedRelative(value: string, field: string): string {
  if (value.includes("\\") || path.posix.isAbsolute(value) || path.win32.isAbsolute(value)
    || value.split("/").some((part) => part === "" || part === "." || part === "..")) {
    throw new WorkCampaignError(`${field} must be a contained forward-slash project-relative path`, 2, { field });
  }
  return value;
}

function missionId(definition: WorkCampaignDefinition, wave: CampaignWaveManifest): string {
  const value = `${definition.campaignId}-${wave.id}`;
  if (!/^[a-z0-9][a-z0-9._-]{0,99}$/u.test(value)) {
    throw new WorkCampaignError("campaign and wave ids do not form a valid mission id", 2, { field: "missionId" });
  }
  return value;
}

function artifactPaths(definition: WorkCampaignDefinition, waveId: string): { missionPath: string; wavePath: string } {
  return {
    missionPath: containedRelative(path.posix.join(definition.evidencePath, "missions", waveId, "definition.json"), "missionPath"),
    wavePath: containedRelative(path.posix.join(definition.evidencePath, "waves", `${waveId}.json`), "wavePath"),
  };
}

function writeExact(root: string, relative: string, content: string): void {
  const rootCanonical = fs.realpathSync(root);
  const target = path.resolve(root, containedRelative(relative, "campaign mission artifact"));
  const lexical = path.relative(path.resolve(root), target);
  if (lexical.startsWith("..") || path.isAbsolute(lexical)) {
    throw new WorkCampaignError("campaign mission artifact escapes the project root", 2, { field: relative });
  }
  fs.mkdirSync(path.dirname(target), { recursive: true });
  const parentCanonical = fs.realpathSync(path.dirname(target));
  const actual = path.relative(rootCanonical, parentCanonical);
  if (actual.startsWith("..") || path.isAbsolute(actual)) {
    throw new WorkCampaignError("campaign mission artifact parent escapes the project root", 2, { field: relative });
  }
  if (fs.existsSync(target)) {
    const stat = fs.lstatSync(target);
    if (!stat.isFile() || stat.isSymbolicLink() || fs.readFileSync(target, "utf8") !== content) {
      throw new WorkCampaignError("campaign mission artifact already exists with different or unsafe bytes", 2, { field: relative });
    }
    return;
  }
  let handle: number | null = null;
  try {
    handle = fs.openSync(target, "wx");
    fs.writeFileSync(handle, content, "utf8");
    fs.fsyncSync(handle);
    fs.closeSync(handle);
    handle = null;
  } finally {
    if (handle != null) fs.closeSync(handle);
  }
}

export function buildCampaignMissionDefinition(
  definition: WorkCampaignDefinition,
  definitionDigest: string,
  wave: CampaignWaveManifest,
): CampaignMissionMaterialization {
  if (wave.slices.some((slice) => stableJson(slice.validationArgv) !== stableJson(definition.validationArgv))) {
    throw new WorkCampaignError("every frozen wave slice must use the campaign validation argv", 2, { field: "validationArgv" });
  }
  const paths = artifactPaths(definition, wave.id);
  const waveDigest = missionParentWaveDigest(wave);
  const correlationDigest = campaignDigest({
    campaignId: definition.campaignId,
    definitionDigest,
    eventId: "wave-admitted",
    schemaVersion: 1,
    waveDigest,
    waveId: wave.id,
    workItemRefs: wave.workItemIds,
  });
  const allowedEffects = [...new Set(wave.slices.flatMap((slice) => slice.effectClasses))].sort();
  const authorizationRefs = Object.fromEntries(
    allowedEffects.flatMap((effect) => definition.authorizationRefs[effect] == null
      ? []
      : [[effect, definition.authorizationRefs[effect]]]),
  );
  const parsed = parseMissionDefinition({
    allowedEffects,
    authorizationRefs,
    checkpoint: definition.checkpoint,
    evidencePath: path.posix.dirname(paths.missionPath),
    missionId: missionId(definition, wave),
    parent: {
      campaignDefinitionDigest: definitionDigest,
      campaignId: definition.campaignId,
      campaignTransitionDigest: correlationDigest,
      parentEvidencePath: paths.wavePath,
      schemaVersion: 1,
      waveDigest,
      waveId: wave.id,
      workItemRefs: wave.workItemIds,
    },
    roadmapPath: definition.reportPath,
    schemaVersion: 1,
    slices: wave.slices.map((slice) => ({
      changeId: slice.changeId,
      dependsOn: slice.dependsOn,
      effectClasses: slice.effectClasses,
      id: slice.id,
      operation: "propose",
      outcome: slice.outcome,
      ownedPaths: slice.ownedPaths,
      workItemRefs: slice.workItemIds,
    })),
    stopPolicy: { onExternalBlocked: true, onOwnerRequired: true, onUnknown: true },
    validationArgv: definition.validationArgv,
    workflowOwner: { mode: "global-canonical" },
  });
  const parsedDigest = missionDefinitionDigest(parsed);
  return {
    correlationDigest,
    definition: parsed,
    definitionDigest: parsedDigest,
    missionPath: paths.missionPath,
    missionRef: `mission:${parsed.missionId}`,
    waveDigest,
    wavePath: paths.wavePath,
  };
}

export function materializeCampaignMission(
  root: string,
  definition: WorkCampaignDefinition,
  definitionDigest: string,
  wave: CampaignWaveManifest,
): CampaignMissionMaterialization {
  const materialized = buildCampaignMissionDefinition(definition, definitionDigest, wave);
  if (wave.missionDefinitionDigest !== materialized.definitionDigest) {
    throw new WorkCampaignError("frozen wave missionDefinitionDigest differs from the deterministic mission", 2, { field: "missionDefinitionDigest" });
  }
  writeExact(root, materialized.wavePath, stableJson(wave));
  writeExact(root, materialized.missionPath, stableJson(materialized.definition));
  const readback = loadMissionDefinition(root, materialized.missionPath);
  if (missionDefinitionDigest(readback) !== materialized.definitionDigest) {
    throw new WorkCampaignError("materialized mission readback differs", 1, { field: "missionPath" });
  }
  return materialized;
}

function parseMissionOutput(
  stdout: string,
  materialized: CampaignMissionMaterialization,
): MissionParentHandoff {
  let report: Record<string, unknown>;
  try {
    const value = JSON.parse(stdout) as unknown;
    if (value == null || typeof value !== "object" || Array.isArray(value)) throw new Error("report root is not an object");
    report = value as Record<string, unknown>;
  } catch (error) {
    throw new WorkCampaignError("roadmap mission returned invalid JSON", 1, { cause: error, field: "mission" });
  }
  if (report.tool !== "roadmap-mission" || report.definitionDigest !== materialized.definitionDigest || report.missionId !== materialized.definition.missionId) {
    throw new WorkCampaignError("roadmap mission result identity differs", 1, { field: "mission" });
  }
  if (report.status === "blocked" && report.cursor === 0) {
    const processEvidence = Array.isArray(report.processEvidence) ? report.processEvidence : [];
    const detail = processEvidence.flatMap((value) => {
      if (value == null || typeof value !== "object" || Array.isArray(value)) return [];
      const entry = value as Record<string, unknown>;
      return [entry.stderr, entry.stdout].filter((text): text is string => typeof text === "string" && text.trim() !== "");
    }).join(" ").slice(0, 4_000);
    throw new WorkCampaignError(`roadmap mission preflight blocked${detail === "" ? "" : `: ${detail}`}`, 1, { field: "mission" });
  }
  return parseMissionParentHandoff(report.parentHandoff, materialized.definition);
}

export function invokeCampaignMission(
  root: string,
  materialized: CampaignMissionMaterialization,
  options: CampaignMissionOptions,
): MissionParentHandoff {
  const argv = [
    process.execPath,
    path.join(options.globalSource, "bin", "roadmap-mission.ts"),
    "run",
    "--root",
    root,
    "--global-source",
    options.globalSource,
    "--mission",
    materialized.missionPath,
    "--adapter",
    options.adapterPath,
    ...(options.checkpointIdentity == null ? [] : ["--checkpoint-identity", options.checkpointIdentity]),
  ];
  const outcome = runPortableCommand(root, argv, { capture: true, timeoutMs: 3_600_000 });
  if (outcome.cleanupState === "unknown") {
    throw new WorkCampaignError("roadmap mission process cleanup is unknown", 1, { field: "mission" });
  }
  if (outcome.stdout.trim() === "") {
    const detail = (outcome.stderr || outcome.error?.message || "no diagnostics").slice(0, 4_000);
    throw new WorkCampaignError(`roadmap mission produced no result: ${detail}`, 1, { field: "mission" });
  }
  const handoff = parseMissionOutput(outcome.stdout, materialized);
  if (outcome.status !== 0 && handoff.disposition === "complete") {
    throw new WorkCampaignError("roadmap mission exit status contradicts its completed handoff", 1, { field: "mission" });
  }
  return handoff;
}

export function observeCampaignMission(
  root: string,
  definition: WorkCampaignDefinition,
  waveId: string,
): MissionParentHandoff {
  try {
    const missionPath = artifactPaths(definition, waveId).missionPath;
    const mission = loadMissionDefinition(root, missionPath);
    const replay = replayMissionState(root, missionPath);
    const projection = readMissionStateProjection(root, mission);
    const disposition: MissionParentHandoff["disposition"] = replay.writerStatus !== "clear" || projection?.activeOperation != null
      ? "paused-unknown"
      : projection?.disposition === "complete"
        ? "complete"
        : projection?.disposition === "paused"
          ? "paused"
          : projection?.disposition === "paused-unknown"
            ? "paused-unknown"
            : "blocked";
    return buildMissionParentHandoff(root, missionPath, mission, disposition, []);
  } catch (error) {
    if (error instanceof WorkCampaignError) throw error;
    if (error instanceof RoadmapMissionError) {
      throw new WorkCampaignError("roadmap mission handoff observation failed", error.exitCode, { cause: error, field: "mission" });
    }
    throw error;
  }
}

export function requestCampaignMissionStop(
  root: string,
  definition: WorkCampaignDefinition,
  waveId: string,
): void {
  const mission = loadMissionDefinition(root, artifactPaths(definition, waveId).missionPath);
  recordMissionStopIntent(root, mission, {
    controllerPtyRef: null,
    rootSessionRef: null,
    source: "campaign",
  });
}

export function handoffEvidenceRefs(handoff: MissionParentHandoff): string[] {
  const typed = (kind: string, value: string): string => {
    if (typedRefPattern.test(value)) return value;
    const candidate = `${kind}:${value}`;
    return typedRefPattern.test(candidate) ? candidate : `${kind}:${campaignDigest(value)}`;
  };
  return [...new Set([
    ...handoff.archiveRefs.map((value) => typed("archive", value)),
    ...handoff.evidenceRefs.map((value) => typed("file", value)),
    ...handoff.processRefs.map((value) => typed("process", value)),
    ...handoff.sessionRefs.map((value) => typed("session", value)),
    ...(handoff.checkpoint.identity == null ? [] : [typed("checkpoint", handoff.checkpoint.identity)]),
    `mission:${handoff.missionId}`,
    `wave:${handoff.waveId}`,
  ])].sort();
}
