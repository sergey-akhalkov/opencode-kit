import fs from "node:fs";
import path from "node:path";
import {
  missionDefinitionDigest,
  parseMissionBlocker,
  RoadmapMissionError,
  stableJson,
} from "./contracts.ts";
import type {
  CheckpointMode,
  EffectClass,
  MissionCheck,
  MissionParentHandoff,
  RoadmapMissionDefinition,
} from "./contracts.ts";
import type { ProcessEvidence } from "./controller-process.ts";
import { readExecutorResult } from "./controller-result.ts";
import { readMissionResultFacts, readMissionSchedulingFacts, replayMissionState, selectMissionFrontierStop } from "./state.ts";

type FrozenWaveSlice = {
  changeId: string;
  dependsOn: string[];
  effectClasses: EffectClass[];
  expectedProof: string;
  id: string;
  outcome: string;
  ownedPaths: string[];
  validationArgv: string[];
  workItemIds: string[];
};

type FrozenWave = {
  campaignId: string;
  candidateDigest: string;
  definitionDigest: string;
  id: string;
  missionDefinitionDigest: string;
  recordType: "wave-manifest";
  schemaVersion: 1;
  slices: FrozenWaveSlice[];
  status: "frozen";
  workItemIds: string[];
};

function record(value: unknown, field: string): Record<string, unknown> {
  if (value == null || typeof value !== "object" || Array.isArray(value)) {
    throw new RoadmapMissionError(`${field} must be an object`, 2);
  }
  return value as Record<string, unknown>;
}

function exactKeys(input: Record<string, unknown>, expected: readonly string[], field: string): void {
  const missing = expected.filter((key) => !(key in input));
  const extras = Object.keys(input).filter((key) => !expected.includes(key)).sort();
  if (missing.length > 0 || extras.length > 0) {
    const detail = [
      missing.length > 0 ? `missing=${missing.join(",")}` : null,
      extras.length > 0 ? `unsupported=${extras.join(",")}` : null,
    ].filter((value): value is string => value != null).join(" ");
    throw new RoadmapMissionError(`${field} has invalid fields: ${detail}`, 2);
  }
}

function singleLine(value: unknown, field: string, max = 4_000): string {
  if (typeof value !== "string" || value.trim() === "" || value.length > max || /[\r\n\0]/.test(value)) {
    throw new RoadmapMissionError(`${field} must be a non-empty single-line string of at most ${max} characters`, 2);
  }
  return value.trim();
}

function nullableSingleLine(value: unknown, field: string, max = 4_000): string | null {
  return value == null ? null : singleLine(value, field, max);
}

function safeId(value: unknown, field: string): string {
  const parsed = singleLine(value, field, 100);
  if (!/^[a-z0-9][a-z0-9._-]*$/.test(parsed) || parsed === "." || parsed === "..") {
    throw new RoadmapMissionError(`${field} must be a safe lowercase identifier`, 2);
  }
  return parsed;
}

function digest(value: unknown, field: string): string {
  const parsed = singleLine(value, field, 64);
  if (!/^[a-f0-9]{64}$/.test(parsed)) throw new RoadmapMissionError(`${field} must be a lowercase SHA-256 digest`, 2);
  return parsed;
}

function safeRelative(value: unknown, field: string): string {
  const parsed = singleLine(value, field, 500).replaceAll("\\", "/").replace(/^\.\//, "");
  if (path.isAbsolute(parsed) || parsed.split("/").some((segment) => segment === "" || segment === "." || segment === "..")) {
    throw new RoadmapMissionError(`${field} must be a contained project-relative path`, 2);
  }
  return parsed;
}

function strings(
  value: unknown,
  field: string,
  options: { allowEmpty?: boolean; ids?: boolean; maxItems?: number; paths?: boolean; preserveOrder?: boolean } = {},
): string[] {
  const maxItems = options.maxItems ?? 1_000;
  if (!Array.isArray(value) || value.length > maxItems || (!options.allowEmpty && value.length === 0)) {
    throw new RoadmapMissionError(`${field} must contain ${options.allowEmpty ? "at most" : "between 1 and"} ${maxItems} items`, 2);
  }
  const values = value.map((item, index) => options.ids
    ? safeId(item, `${field}[${index}]`)
    : options.paths
    ? safeRelative(item, `${field}[${index}]`)
    : singleLine(item, `${field}[${index}]`, 1_000));
  if (new Set(values).size !== values.length) throw new RoadmapMissionError(`${field} must not contain duplicates`, 2);
  return options.preserveOrder ? values : values.sort();
}

function parseWaveSlice(value: unknown, index: number): FrozenWaveSlice {
  const input = record(value, `parent wave slices[${index}]`);
  exactKeys(input, [
    "changeId",
    "dependsOn",
    "effectClasses",
    "expectedProof",
    "id",
    "outcome",
    "ownedPaths",
    "validationArgv",
    "workItemIds",
  ], `parent wave slices[${index}]`);
  return {
    changeId: safeId(input.changeId, `parent wave slices[${index}].changeId`),
    dependsOn: strings(input.dependsOn, `parent wave slices[${index}].dependsOn`, { allowEmpty: true, ids: true }),
    effectClasses: strings(input.effectClasses, `parent wave slices[${index}].effectClasses`) as EffectClass[],
    expectedProof: singleLine(input.expectedProof, `parent wave slices[${index}].expectedProof`),
    id: safeId(input.id, `parent wave slices[${index}].id`),
    outcome: singleLine(input.outcome, `parent wave slices[${index}].outcome`),
    ownedPaths: strings(input.ownedPaths, `parent wave slices[${index}].ownedPaths`, { paths: true }),
    validationArgv: strings(input.validationArgv, `parent wave slices[${index}].validationArgv`, { preserveOrder: true }),
    workItemIds: strings(input.workItemIds, `parent wave slices[${index}].workItemIds`, { ids: true }),
  };
}

function parseFrozenWave(value: unknown): FrozenWave {
  const input = record(value, "parent wave");
  exactKeys(input, [
    "campaignId",
    "candidateDigest",
    "definitionDigest",
    "id",
    "missionDefinitionDigest",
    "recordType",
    "schemaVersion",
    "slices",
    "status",
    "workItemIds",
  ], "parent wave");
  if (input.schemaVersion !== 1 || input.recordType !== "wave-manifest" || input.status !== "frozen") {
    throw new RoadmapMissionError("parent wave schema, recordType, or status is unsupported", 2);
  }
  if (!Array.isArray(input.slices) || input.slices.length === 0 || input.slices.length > 100) {
    throw new RoadmapMissionError("parent wave slices must contain between 1 and 100 items", 2);
  }
  const slices = input.slices.map(parseWaveSlice);
  const ids = slices.map((slice) => slice.id);
  if (new Set(ids).size !== ids.length || new Set(slices.map((slice) => slice.changeId)).size !== slices.length) {
    throw new RoadmapMissionError("parent wave slice ids and change ids must be unique", 2);
  }
  const positions = new Map(ids.map((id, index) => [id, index]));
  for (const [index, slice] of slices.entries()) {
    for (const dependency of slice.dependsOn) {
      const dependencyIndex = positions.get(dependency);
      if (dependencyIndex == null || dependencyIndex >= index) {
        throw new RoadmapMissionError(`parent wave slice ${slice.id} dependency ${dependency} must reference an earlier slice`, 2);
      }
    }
  }
  const workItemIds = strings(input.workItemIds, "parent wave workItemIds", { ids: true });
  const referenced = [...new Set(slices.flatMap((slice) => slice.workItemIds))].sort();
  if (stableJson(workItemIds) !== stableJson(referenced)) {
    throw new RoadmapMissionError("parent wave workItemIds must exactly match slice workItemIds", 2);
  }
  return {
    campaignId: safeId(input.campaignId, "parent wave campaignId"),
    candidateDigest: digest(input.candidateDigest, "parent wave candidateDigest"),
    definitionDigest: digest(input.definitionDigest, "parent wave definitionDigest"),
    id: safeId(input.id, "parent wave id"),
    missionDefinitionDigest: digest(input.missionDefinitionDigest, "parent wave missionDefinitionDigest"),
    recordType: "wave-manifest",
    schemaVersion: 1,
    slices,
    status: "frozen",
    workItemIds,
  };
}

export function missionParentWaveDigest(value: unknown): string {
  const wave = parseFrozenWave(value);
  const { missionDefinitionDigest: _missionDefinitionDigest, ...digestInput } = wave;
  return missionDefinitionDigest(digestInput);
}

export function parseMissionParentHandoff(
  value: unknown,
  definition: RoadmapMissionDefinition,
): MissionParentHandoff {
  const input = record(value, "parent handoff");
  if (definition.parent == null) throw new RoadmapMissionError("parent handoff requires a parent-correlated mission", 2);
  if (!("blocker" in input)) input.blocker = null;
  if (!("blockedWorkItemRefs" in input)) {
    input.blockedWorkItemRefs = input.blocker == null
      ? []
      : record(input.blocker, "parent handoff blocker").affectedItemRefs;
  }
  if (!("completedWorkItemRefs" in input)) {
    input.completedWorkItemRefs = input.disposition === "complete" ? definition.parent.workItemRefs : [];
  }
  exactKeys(input, [
    "archiveRefs",
    "blocker",
    "blockedWorkItemRefs",
    "campaignDefinitionDigest",
    "campaignId",
    "campaignTransitionDigest",
    "checkpoint",
    "cleanupClosure",
    "completedWorkItemRefs",
    "definitionDigest",
    "disposition",
    "evidenceRefs",
    "missionId",
    "ownerCondition",
    "processRefs",
    "retryCondition",
    "schemaVersion",
    "sessionRefs",
    "tool",
    "waveDigest",
    "waveId",
    "workItemRefs",
    "writerClosure",
  ], "parent handoff");
  if (input.schemaVersion !== 1 || input.tool !== "roadmap-mission-parent-handoff") {
    throw new RoadmapMissionError("parent handoff schema or tool is unsupported", 2);
  }
  const checkpointInput = record(input.checkpoint, "parent handoff checkpoint");
  exactKeys(checkpointInput, ["identity", "mode"], "parent handoff checkpoint");
  const mode = singleLine(checkpointInput.mode, "parent handoff checkpoint.mode") as CheckpointMode;
  if (!( ["evidence-only", "external", "local-commit"] as readonly string[]).includes(mode) || mode !== definition.checkpoint.mode) {
    throw new RoadmapMissionError("parent handoff checkpoint mode does not match the mission", 2);
  }
  const disposition = singleLine(input.disposition, "parent handoff disposition") as MissionParentHandoff["disposition"];
  if (!( ["blocked", "complete", "paused", "paused-unknown", "product-decision-required", "waiting"] as readonly string[]).includes(disposition)) {
    throw new RoadmapMissionError("parent handoff disposition is unsupported", 2);
  }
  const writerClosure = singleLine(input.writerClosure, "parent handoff writerClosure") as MissionParentHandoff["writerClosure"];
  const cleanupClosure = singleLine(input.cleanupClosure, "parent handoff cleanupClosure") as MissionParentHandoff["cleanupClosure"];
  if (!( ["terminal", "unknown"] as readonly string[]).includes(writerClosure) || !( ["terminal", "unknown"] as readonly string[]).includes(cleanupClosure)) {
    throw new RoadmapMissionError("parent handoff closure is unsupported", 2);
  }
  const pathRefs = (field: "archiveRefs" | "evidenceRefs", maxItems: number): string[] => {
    const refs = strings(input[field], `parent handoff ${field}`, { allowEmpty: true, maxItems, paths: true });
    if (field === "archiveRefs" && refs.some((entry) => !entry.startsWith("openspec/changes/archive/"))) {
      throw new RoadmapMissionError("parent handoff archiveRefs must remain under the OpenSpec archive root", 2);
    }
    return refs;
  };
  const stringRefs = (field: "processRefs" | "sessionRefs"): string[] =>
    strings(input[field], `parent handoff ${field}`, { allowEmpty: true, maxItems: 2_000 });
  const archiveRefs = pathRefs("archiveRefs", 100);
  const evidenceRefs = pathRefs("evidenceRefs", 10_000);
  const processRefs = stringRefs("processRefs");
  const sessionRefs = stringRefs("sessionRefs");
  const workItemRefs = strings(input.workItemRefs, "parent handoff workItemRefs", { ids: true, preserveOrder: true });
  const blockedWorkItemRefs = strings(input.blockedWorkItemRefs, "parent handoff blockedWorkItemRefs", { allowEmpty: true, ids: true, preserveOrder: true });
  const completedWorkItemRefs = strings(input.completedWorkItemRefs, "parent handoff completedWorkItemRefs", { allowEmpty: true, ids: true, preserveOrder: true });
  const ownerCondition = nullableSingleLine(input.ownerCondition, "parent handoff ownerCondition");
  const blocker = input.blocker == null ? null : parseMissionBlocker(input.blocker, "parent handoff blocker");
  const handoff: MissionParentHandoff = {
    archiveRefs,
    blocker,
    blockedWorkItemRefs,
    campaignDefinitionDigest: digest(input.campaignDefinitionDigest, "parent handoff campaignDefinitionDigest"),
    campaignId: safeId(input.campaignId, "parent handoff campaignId"),
    campaignTransitionDigest: digest(input.campaignTransitionDigest, "parent handoff campaignTransitionDigest"),
    checkpoint: {
      identity: nullableSingleLine(checkpointInput.identity, "parent handoff checkpoint.identity", 500),
      mode,
    },
    cleanupClosure,
    completedWorkItemRefs,
    definitionDigest: digest(input.definitionDigest, "parent handoff definitionDigest"),
    disposition,
    evidenceRefs,
    missionId: safeId(input.missionId, "parent handoff missionId"),
    ownerCondition: ownerCondition as MissionParentHandoff["ownerCondition"],
    processRefs,
    retryCondition: nullableSingleLine(input.retryCondition, "parent handoff retryCondition"),
    schemaVersion: 1,
    sessionRefs,
    tool: "roadmap-mission-parent-handoff",
    waveDigest: digest(input.waveDigest, "parent handoff waveDigest"),
    waveId: safeId(input.waveId, "parent handoff waveId"),
    workItemRefs,
    writerClosure,
  };
  const parent = definition.parent;
  if (
    handoff.campaignId !== parent.campaignId ||
    handoff.campaignDefinitionDigest !== parent.campaignDefinitionDigest ||
    handoff.campaignTransitionDigest !== parent.campaignTransitionDigest ||
    handoff.waveId !== parent.waveId ||
    handoff.waveDigest !== parent.waveDigest ||
    !same(handoff.workItemRefs, parent.workItemRefs) ||
    handoff.missionId !== definition.missionId ||
    handoff.definitionDigest !== missionDefinitionDigest(definition)
  ) {
    throw new RoadmapMissionError("parent handoff correlation does not match the mission definition", 2);
  }
  const parentWorkItems = new Set(parent.workItemRefs);
  if (
    handoff.blockedWorkItemRefs.some((ref) => !parentWorkItems.has(ref)) ||
    handoff.completedWorkItemRefs.some((ref) => !parentWorkItems.has(ref)) ||
    handoff.blockedWorkItemRefs.some((ref) => handoff.completedWorkItemRefs.includes(ref))
  ) {
    throw new RoadmapMissionError("parent handoff work-item projections are not disjoint subsets of the frozen wave", 2);
  }
  if (handoff.blocker != null && handoff.blocker.affectedItemRefs.some((ref) => !handoff.blockedWorkItemRefs.includes(ref))) {
    throw new RoadmapMissionError("parent handoff selected blocker is absent from blockedWorkItemRefs", 2);
  }
  if (handoff.ownerCondition !== null && handoff.ownerCondition !== "product-decision" && handoff.ownerCondition !== "unknown") {
    throw new RoadmapMissionError("parent handoff ownerCondition is unsupported", 2);
  }
  if (handoff.disposition === "complete") {
    if (
      handoff.writerClosure !== "terminal" ||
      handoff.cleanupClosure !== "terminal" ||
      handoff.checkpoint.identity == null ||
      handoff.archiveRefs.length !== definition.slices.length ||
      handoff.archiveRefs.some((entry) => !handoff.evidenceRefs.includes(entry)) ||
      handoff.processRefs.length < definition.slices.length ||
      handoff.sessionRefs.length < definition.slices.length ||
      handoff.retryCondition != null ||
      handoff.ownerCondition != null ||
      handoff.blocker != null ||
      !same(handoff.completedWorkItemRefs, parent.workItemRefs) ||
      handoff.blockedWorkItemRefs.length !== 0
    ) {
      throw new RoadmapMissionError("completed parent handoff is not terminal-clear", 2);
    }
  } else if (handoff.disposition === "product-decision-required") {
    if (
      handoff.blocker?.disposition !== "product-decision-required" ||
      handoff.retryCondition !== handoff.blocker.resumeCondition ||
      handoff.ownerCondition !== "product-decision"
    ) {
      throw new RoadmapMissionError("product-decision parent handoff is incomplete", 2);
    }
  } else if (handoff.disposition === "waiting") {
    if (
      handoff.blocker?.disposition !== "waiting" ||
      handoff.retryCondition !== handoff.blocker.resumeCondition ||
      handoff.ownerCondition != null
    ) {
      throw new RoadmapMissionError("waiting parent handoff is incomplete", 2);
    }
  } else if (
    handoff.retryCondition == null ||
    handoff.ownerCondition !== "unknown" ||
    (handoff.blocker != null && handoff.retryCondition !== handoff.blocker.resumeCondition)
  ) {
    throw new RoadmapMissionError("non-complete parent handoff must expose its retry and owner conditions", 2);
  }
  return handoff;
}

function readFrozenWave(root: string, relative: string): FrozenWave {
  const file = path.resolve(root, relative);
  const rootRelative = path.relative(root, file);
  if (rootRelative.startsWith("..") || path.isAbsolute(rootRelative)) {
    throw new RoadmapMissionError("parent evidence must remain inside the project root", 2);
  }
  try {
    const stat = fs.lstatSync(file);
    if (!stat.isFile() || stat.isSymbolicLink() || stat.size > 1_000_000) throw new Error("not a bounded regular file");
    return parseFrozenWave(JSON.parse(fs.readFileSync(file, "utf8")));
  } catch (error) {
    if (error instanceof RoadmapMissionError) throw error;
    throw new RoadmapMissionError("parent evidence must be a readable bounded regular wave JSON file", 2, { cause: error });
  }
}

function same(left: unknown, right: unknown): boolean {
  return stableJson(left) === stableJson(right);
}

function validateParentCorrelation(root: string, definition: RoadmapMissionDefinition): FrozenWave {
  const parent = definition.parent;
  if (parent == null) throw new RoadmapMissionError("mission has no parent correlation", 2);
  const wave = readFrozenWave(root, parent.parentEvidencePath);
  if (
    wave.campaignId !== parent.campaignId ||
    wave.definitionDigest !== parent.campaignDefinitionDigest ||
    wave.id !== parent.waveId ||
    missionParentWaveDigest(wave) !== parent.waveDigest ||
    wave.missionDefinitionDigest !== missionDefinitionDigest(definition) ||
    !same(wave.workItemIds, parent.workItemRefs) ||
    wave.slices.length !== definition.slices.length
  ) {
    throw new RoadmapMissionError("parent wave identity, digest, refs, or slice count differs from the mission", 2);
  }
  for (const [index, slice] of definition.slices.entries()) {
    const frozen = wave.slices[index];
    if (
      slice.operation !== "propose" ||
      slice.id !== frozen.id ||
      slice.changeId !== frozen.changeId ||
      !same(slice.dependsOn, frozen.dependsOn) ||
      !same(slice.effectClasses, frozen.effectClasses) ||
      !same(slice.ownedPaths, frozen.ownedPaths) ||
      slice.outcome !== frozen.outcome ||
      !same(slice.workItemRefs, frozen.workItemIds) ||
      !same(definition.validationArgv, frozen.validationArgv)
    ) {
      throw new RoadmapMissionError(`parent wave slice ${index} differs from mission slice ${slice.id}`, 2);
    }
  }
  return wave;
}

export function parentCorrelationCheck(root: string, definition: RoadmapMissionDefinition): MissionCheck {
  try {
    validateParentCorrelation(root, definition);
    return {
      blocking: false,
      id: "definition:parent-correlation",
      status: "passed",
      summary: "Mission slices and parent refs exactly match the durable frozen wave.",
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      blocking: true,
      id: "definition:parent-correlation",
      status: "blocked",
      summary: `Parent campaign correlation is invalid: ${message}.`,
    };
  }
}

export function buildMissionParentHandoff(
  root: string,
  missionPath: string,
  definition: RoadmapMissionDefinition,
  disposition: MissionParentHandoff["disposition"],
  processEvidence: ProcessEvidence[],
): MissionParentHandoff {
  validateParentCorrelation(root, definition);
  const parent = definition.parent;
  if (parent == null) throw new RoadmapMissionError("mission has no parent correlation", 2);
  const facts = readMissionResultFacts(root, definition);
  const replay = replayMissionState(root, missionPath);
  const results = facts.executorAttempts.map((attempt) => {
    const slice = definition.slices.find((candidate) => candidate.id === attempt.sliceId);
    if (slice == null) throw new RoadmapMissionError(`executor result references unknown slice ${attempt.sliceId}`, 2);
    return readExecutorResult(root, definition, slice, attempt.attempt, attempt.resultRef);
  });
  const sessionRefs = [...new Set(results.flatMap((result) => result.rootSessionRef == null ? [] : [result.rootSessionRef]))].sort();
  const completedSlices = new Set(results.filter((result) => result.disposition === "completed").map((result) => result.sliceId));
  const completedWorkItemRefs = [...new Set(definition.slices
    .filter((slice) => completedSlices.has(slice.id))
    .flatMap((slice) => slice.workItemRefs))].sort();
  const executorCleanupClear = results.every((result) => result.writerClosure !== "unknown" && result.cleanup !== "unknown");
  const currentProcessCleanupClear = processEvidence.every((evidence) =>
    evidence.cleanupState !== "unknown" && (evidence.cleanupState != null || evidence.executorResultPath != null)
  );
  const writerClear = replay.status === "valid" && replay.writerStatus === "clear" && facts.projection?.activeOperation == null;
  const completedEvidenceClear = disposition !== "complete" || definition.slices.every((slice) => completedSlices.has(slice.id));
  const cleanupClear = writerClear && executorCleanupClear && currentProcessCleanupClear && completedEvidenceClear;
  const schedulingFacts = readMissionSchedulingFacts(root, definition);
  const blocker = facts.projection?.blocker
    ?? selectMissionFrontierStop(schedulingFacts)?.blocker
    ?? null;
  const blockedWorkItemRefs = [...new Set(schedulingFacts.parkedSlices
    .flatMap((entry) => entry.blocker.affectedItemRefs))].sort();
  return parseMissionParentHandoff({
    archiveRefs: facts.archiveRefs,
    blocker,
    blockedWorkItemRefs,
    campaignDefinitionDigest: parent.campaignDefinitionDigest,
    campaignId: parent.campaignId,
    campaignTransitionDigest: parent.campaignTransitionDigest,
    checkpoint: facts.projection?.checkpoint ?? { identity: null, mode: definition.checkpoint.mode },
    cleanupClosure: cleanupClear ? "terminal" : "unknown",
    completedWorkItemRefs,
    definitionDigest: missionDefinitionDigest(definition),
    disposition,
    evidenceRefs: [...new Set([...facts.evidenceRefs, parent.parentEvidencePath])].sort(),
    missionId: definition.missionId,
    ownerCondition: disposition === "product-decision-required"
      ? "product-decision"
      : disposition === "complete" || disposition === "waiting"
        ? null
        : "unknown",
    processRefs: facts.processRefs,
    retryCondition: disposition === "complete" ? null : blocker?.resumeCondition ?? `mission-status:${disposition}`,
    schemaVersion: 1,
    sessionRefs,
    tool: "roadmap-mission-parent-handoff",
    waveDigest: parent.waveDigest,
    waveId: parent.waveId,
    workItemRefs: parent.workItemRefs,
    writerClosure: writerClear ? "terminal" : "unknown",
  }, definition);
}
