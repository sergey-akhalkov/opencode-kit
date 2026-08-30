import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { parseTerminalCertificate } from "../../extensions/session-completion-guard/terminal-certificate.ts";
import type { TerminalCertificate } from "../../extensions/session-completion-guard/terminal-certificate.ts";

const EFFECT_CLASSES = [
  "activation",
  "cost",
  "credentials",
  "deployment",
  "destructive",
  "external",
  "hardware",
  "installation",
  "local-commit",
  "local-read",
  "local-write",
  "provider-inference",
  "publication",
  "release",
  "remote",
] as const;

export const PROTECTED_EFFECTS = new Set<EffectClass>([
  "activation",
  "cost",
  "credentials",
  "deployment",
  "destructive",
  "external",
  "hardware",
  "installation",
  "local-commit",
  "provider-inference",
  "publication",
  "release",
  "remote",
]);

export type EffectClass = typeof EFFECT_CLASSES[number];
export type MissionOperation = "continue" | "propose";
export type CheckpointMode = "evidence-only" | "external" | "local-commit";

export type MissionParentCorrelation = {
  campaignDefinitionDigest: string;
  campaignId: string;
  campaignTransitionDigest: string;
  parentEvidencePath: string;
  schemaVersion: 1;
  waveDigest: string;
  waveId: string;
  workItemRefs: string[];
};

export type RoadmapMissionSlice = {
  changeId: string;
  dependsOn: string[];
  effectClasses: EffectClass[];
  id: string;
  operation: MissionOperation;
  outcome: string;
  ownedPaths: string[];
  workItemRefs?: string[];
};

export type RoadmapMissionDefinition = {
  allowedEffects: EffectClass[];
  authorizationRefs: Partial<Record<EffectClass, string>>;
  checkpoint: {
    localCommitAuthorized: boolean;
    mode: CheckpointMode;
    workspace: "disposable" | "persistent";
  };
  evidencePath: string;
  missionId: string;
  parent?: MissionParentCorrelation;
  roadmapPath: string;
  schemaVersion: 1;
  slices: RoadmapMissionSlice[];
  stopPolicy: {
    onExternalBlocked: true;
    onOwnerRequired: true;
    onUnknown: true;
  };
  validationArgv: string[];
  workflowOwner: {
    mode: "global-canonical";
  };
};

export type MissionWaitKind =
  | "budget"
  | "capability"
  | "external"
  | "live-attempt"
  | "process"
  | "safety"
  | "technical"
  | "writer-liveness";

export type MissionBlocker = {
  affectedItemRefs: string[];
  decisions: Array<{
    affectedItemRefs: string[];
    decisionPoint: string;
    evidenceRefs: string[];
    id: string;
    optionInvariantItemRefs: string[];
    questionRef: string;
  }>;
  disposition: "product-decision-required" | "waiting";
  evidenceRefs: string[];
  frontier: {
    acceptedOutcomeRef: string;
    basisHumanRef: string;
    frontierGeneration: number;
    progressFingerprint: string;
    taskStateDigest: string;
  } | null;
  gates: Array<{
    affectedItemRefs: string[];
    evidenceRefs: string[];
    id: string;
    kind: "product-decision" | MissionWaitKind;
    resumeCondition: string;
  }>;
  resumeCondition: string;
  rootSessionRef: string | null;
  source: "completion-guard" | "mission-preflight";
  waitKind: MissionWaitKind | null;
};

export type MissionParentHandoff = {
  archiveRefs: string[];
  blocker: MissionBlocker | null;
  blockedWorkItemRefs: string[];
  campaignDefinitionDigest: string;
  campaignId: string;
  campaignTransitionDigest: string;
  checkpoint: {
    identity: string | null;
    mode: CheckpointMode;
  };
  cleanupClosure: "terminal" | "unknown";
  completedWorkItemRefs: string[];
  definitionDigest: string;
  disposition: "blocked" | "complete" | "paused" | "paused-unknown" | "product-decision-required" | "waiting";
  evidenceRefs: string[];
  missionId: string;
  ownerCondition: "product-decision" | "unknown" | null;
  processRefs: string[];
  retryCondition: string | null;
  schemaVersion: 1;
  sessionRefs: string[];
  tool: "roadmap-mission-parent-handoff";
  waveDigest: string;
  waveId: string;
  workItemRefs: string[];
  writerClosure: "terminal" | "unknown";
};

export type MissionCheck = {
  blocking: boolean;
  id: string;
  status: "blocked" | "passed" | "unknown";
  summary: string;
};

export type RoadmapMissionPreflight = {
  checks: MissionCheck[];
  definitionDigest: string | null;
  eligibleSlice: Pick<RoadmapMissionSlice, "changeId" | "id" | "operation"> | null;
  exitCode: number;
  missionId: string | null;
  operation: "preflight";
  schemaVersion: 1;
  status: "blocked" | "eligible";
  tool: "roadmap-mission";
};

const EXECUTOR_DISPOSITIONS = [
  "completed",
  "product-decision-required",
  "waiting",
  "paused",
  "terminal",
  "transient",
] as const;

const EXECUTOR_GUARD_STATES = [
  "audit-retrying",
  "auditing",
  "continuation-pending",
  "disabled",
  "error",
  "frontier-reconciling",
  "owner-required",
  "passed",
  "paused",
  "product-decision-required",
  "question-answering",
  "question-auditing",
  "question-pending",
  "running",
  "settling-idle",
  "stale",
  "unknown",
  "waiting",
  "waiting-async",
] as const;

export type MissionExecutorDisposition = typeof EXECUTOR_DISPOSITIONS[number];

export type MissionExecutorResult = {
  attempt: number;
  blocker: MissionBlocker | null;
  changeId: string;
  cleanup: "complete" | "not-required" | "unknown";
  definitionDigest: string;
  disposition: MissionExecutorDisposition;
  errorClass: "none" | "paused" | "product-decision-required" | "terminal" | "transient" | "unknown" | "waiting";
  errorMessage: string | null;
  evidenceRefs: string[];
  guardState: typeof EXECUTOR_GUARD_STATES[number];
  missionId: string;
  phases: Array<{
    command: "opsx-apply" | "opsx-propose";
    evidenceRef: string;
    status: "completed" | "failed" | "interrupted";
  }>;
  questionDisposition: "autonomous" | "none" | "product-decision-required" | "unknown";
  rootSessionRef: string | null;
  runtimeRef: string;
  schemaVersion: 1;
  sliceId: string;
  terminalCertificate: TerminalCertificate | null;
  tool: "roadmap-mission-session-executor";
  writerClosure: "isolated" | "terminal" | "unknown";
};

export type PersistedMissionExecutorResult = MissionExecutorResult | (
  Omit<MissionExecutorResult, "blocker" | "disposition" | "errorClass" | "questionDisposition"> & {
    blocker: null;
    disposition: "owner-required";
    errorClass: "owner-required";
    questionDisposition: "owner-required";
  }
);

export type MissionExecutorExpectation = {
  attempt: number;
  definitionDigest: string;
  missionId: string;
  slice: Pick<RoadmapMissionSlice, "changeId" | "id" | "operation">;
};

export class RoadmapMissionError extends Error {
  readonly exitCode: number;

  constructor(message: string, exitCode = 1, options?: ErrorOptions) {
    super(message, options);
    this.name = "RoadmapMissionError";
    this.exitCode = exitCode;
  }
}

function record(value: unknown): Record<string, unknown> | null {
  return value != null && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

function stableValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stableValue);
  const input = record(value);
  if (input == null) return value;
  return Object.fromEntries(
    Object.keys(input).sort().map((key) => [key, stableValue(input[key])]),
  );
}

export function stableJson(value: unknown): string {
  return `${JSON.stringify(stableValue(value), null, 2)}\n`;
}

export function missionDefinitionDigest(value: unknown): string {
  return crypto.createHash("sha256").update(JSON.stringify(stableValue(value))).digest("hex");
}

function requiredString(value: unknown, field: string, max = 500): string {
  if (typeof value !== "string" || value.trim() === "" || value.length > max) {
    throw new RoadmapMissionError(`${field} must be a non-empty string of at most ${max} characters`, 2);
  }
  return value.trim();
}

function singleLineString(value: unknown, field: string, max = 500): string {
  const parsed = requiredString(value, field, max);
  if (/[\r\n\0]/.test(parsed)) {
    throw new RoadmapMissionError(`${field} must be a single-line string`, 2);
  }
  return parsed;
}

function nullableSingleLineString(value: unknown, field: string, max = 500): string | null {
  return value == null ? null : singleLineString(value, field, max);
}

function digestString(value: unknown, field: string): string {
  const parsed = singleLineString(value, field, 64);
  if (!/^[a-f0-9]{64}$/.test(parsed)) {
    throw new RoadmapMissionError(`${field} must be a lowercase SHA-256 digest`, 2);
  }
  return parsed;
}

export function safeId(value: unknown, field: string): string {
  const parsed = requiredString(value, field, 100);
  if (!/^[a-z0-9][a-z0-9._-]*$/.test(parsed) || parsed === "." || parsed === "..") {
    throw new RoadmapMissionError(`${field} must be a safe lowercase identifier`, 2);
  }
  return parsed;
}

function safeRelative(value: unknown, field: string): string {
  const parsed = requiredString(value, field, 500).replaceAll("\\", "/").replace(/^\.\//, "");
  if (path.isAbsolute(parsed)) {
    throw new RoadmapMissionError(`${field} must be project-relative`, 2);
  }
  const segments = parsed.split("/");
  if (segments.some((segment) => segment === "" || segment === "." || segment === "..")) {
    throw new RoadmapMissionError(`${field} must not contain empty, current, or parent segments`, 2);
  }
  return parsed;
}

function exactKeys(
  input: Record<string, unknown>,
  expected: readonly string[],
  field: string,
  optional: readonly string[] = [],
): void {
  const supported = [...expected, ...optional];
  const extras = Object.keys(input).filter((key) => !supported.includes(key)).sort();
  const missing = expected.filter((key) => !(key in input));
  if (missing.length > 0 || extras.length > 0) {
    const details = [
      missing.length === 0 ? null : `missing=${missing.join(",")}`,
      extras.length === 0 ? null : `unsupported=${extras.join(",")}`,
    ].filter((value): value is string => value != null).join(" ");
    throw new RoadmapMissionError(`${field} has invalid fields: ${details}`, 2);
  }
}

function stringArray(value: unknown, field: string, maxItems: number, allowEmpty: boolean): string[] {
  if (!Array.isArray(value) || value.length > maxItems || (!allowEmpty && value.length === 0)) {
    throw new RoadmapMissionError(`${field} must contain ${allowEmpty ? "at most" : "between 1 and"} ${maxItems} items`, 2);
  }
  return value.map((item, index) => requiredString(item, `${field}[${index}]`, 500));
}

function unique<T extends string>(values: T[], field: string): T[] {
  if (new Set(values).size !== values.length) {
    throw new RoadmapMissionError(`${field} must not contain duplicates`, 2);
  }
  return values;
}

function effectArray(value: unknown, field: string, allowEmpty: boolean): EffectClass[] {
  const values = unique(stringArray(value, field, EFFECT_CLASSES.length, allowEmpty), field);
  for (const effect of values) {
    if (!(EFFECT_CLASSES as readonly string[]).includes(effect)) {
      throw new RoadmapMissionError(`${field} contains unsupported effect class ${effect}`, 2);
    }
  }
  return (values as EffectClass[]).sort();
}

function parseAuthorizationRefs(value: unknown): Partial<Record<EffectClass, string>> {
  const input = record(value);
  if (input == null) throw new RoadmapMissionError("authorizationRefs must be an object", 2);
  const result: Partial<Record<EffectClass, string>> = {};
  for (const key of Object.keys(input).sort()) {
    if (!(EFFECT_CLASSES as readonly string[]).includes(key)) {
      throw new RoadmapMissionError(`authorizationRefs contains unsupported effect class ${key}`, 2);
    }
    result[key as EffectClass] = requiredString(input[key], `authorizationRefs.${key}`, 500);
  }
  return result;
}

function parseCheckpoint(value: unknown): RoadmapMissionDefinition["checkpoint"] {
  const input = record(value);
  if (input == null) throw new RoadmapMissionError("checkpoint must be an object", 2);
  exactKeys(input, ["mode", "workspace", "localCommitAuthorized"], "checkpoint");
  const mode = requiredString(input.mode, "checkpoint.mode") as CheckpointMode;
  if (!(["evidence-only", "external", "local-commit"] as string[]).includes(mode)) {
    throw new RoadmapMissionError("checkpoint.mode is unsupported", 2);
  }
  const workspace = requiredString(input.workspace, "checkpoint.workspace") as "disposable" | "persistent";
  if (workspace !== "disposable" && workspace !== "persistent") {
    throw new RoadmapMissionError("checkpoint.workspace must be disposable or persistent", 2);
  }
  if (typeof input.localCommitAuthorized !== "boolean") {
    throw new RoadmapMissionError("checkpoint.localCommitAuthorized must be boolean", 2);
  }
  if (mode === "local-commit" && input.localCommitAuthorized !== true) {
    throw new RoadmapMissionError("local-commit checkpoint requires explicit localCommitAuthorized=true", 2);
  }
  if (mode !== "local-commit" && input.localCommitAuthorized === true) {
    throw new RoadmapMissionError("localCommitAuthorized may be true only for local-commit checkpoint", 2);
  }
  return { localCommitAuthorized: input.localCommitAuthorized, mode, workspace };
}

function parseStopPolicy(value: unknown): RoadmapMissionDefinition["stopPolicy"] {
  const input = record(value);
  if (input == null) throw new RoadmapMissionError("stopPolicy must be an object", 2);
  exactKeys(input, ["onExternalBlocked", "onOwnerRequired", "onUnknown"], "stopPolicy");
  for (const field of ["onExternalBlocked", "onOwnerRequired", "onUnknown"] as const) {
    if (input[field] !== true) throw new RoadmapMissionError(`stopPolicy.${field} must be true`, 2);
  }
  return { onExternalBlocked: true, onOwnerRequired: true, onUnknown: true };
}

function parseWorkflowOwner(value: unknown): RoadmapMissionDefinition["workflowOwner"] {
  const input = record(value);
  if (input == null) throw new RoadmapMissionError("workflowOwner must be an object", 2);
  exactKeys(input, ["mode"], "workflowOwner");
  if (input.mode !== "global-canonical") {
    throw new RoadmapMissionError("workflowOwner.mode must be global-canonical", 2);
  }
  return { mode: "global-canonical" };
}

function parseParentCorrelation(value: unknown): MissionParentCorrelation {
  const input = record(value);
  if (input == null) throw new RoadmapMissionError("parent must be an object", 2);
  exactKeys(input, [
    "schemaVersion",
    "campaignId",
    "campaignDefinitionDigest",
    "campaignTransitionDigest",
    "waveId",
    "waveDigest",
    "workItemRefs",
    "parentEvidencePath",
  ], "parent");
  if (input.schemaVersion !== 1) throw new RoadmapMissionError("parent.schemaVersion must be 1", 2);
  return {
    campaignDefinitionDigest: digestString(input.campaignDefinitionDigest, "parent.campaignDefinitionDigest"),
    campaignId: safeId(input.campaignId, "parent.campaignId"),
    campaignTransitionDigest: digestString(input.campaignTransitionDigest, "parent.campaignTransitionDigest"),
    parentEvidencePath: safeRelative(input.parentEvidencePath, "parent.parentEvidencePath"),
    schemaVersion: 1,
    waveDigest: digestString(input.waveDigest, "parent.waveDigest"),
    waveId: safeId(input.waveId, "parent.waveId"),
    workItemRefs: unique(stringArray(input.workItemRefs, "parent.workItemRefs", 1_000, false).map(
      (item, index) => safeId(item, `parent.workItemRefs[${index}]`),
    ), "parent.workItemRefs"),
  };
}

function parseSlice(value: unknown, index: number): RoadmapMissionSlice {
  const input = record(value);
  if (input == null) throw new RoadmapMissionError(`slices[${index}] must be an object`, 2);
  exactKeys(
    input,
    ["id", "changeId", "operation", "dependsOn", "outcome", "effectClasses", "ownedPaths"],
    `slices[${index}]`,
    ["workItemRefs"],
  );
  const operation = requiredString(input.operation, `slices[${index}].operation`) as MissionOperation;
  if (operation !== "continue" && operation !== "propose") {
    throw new RoadmapMissionError(`slices[${index}].operation must be continue or propose`, 2);
  }
  const workItemRefs = "workItemRefs" in input
    ? unique(stringArray(input.workItemRefs, `slices[${index}].workItemRefs`, 1_000, false).map(
      (item, workItemIndex) => safeId(item, `slices[${index}].workItemRefs[${workItemIndex}]`),
    ), `slices[${index}].workItemRefs`)
    : undefined;
  return {
    changeId: safeId(input.changeId, `slices[${index}].changeId`),
    dependsOn: unique(stringArray(input.dependsOn, `slices[${index}].dependsOn`, 100, true).map(
      (item, dependencyIndex) => safeId(item, `slices[${index}].dependsOn[${dependencyIndex}]`),
    ), `slices[${index}].dependsOn`),
    effectClasses: effectArray(input.effectClasses, `slices[${index}].effectClasses`, false),
    id: safeId(input.id, `slices[${index}].id`),
    operation,
    outcome: requiredString(input.outcome, `slices[${index}].outcome`, 2_000),
    ownedPaths: unique(stringArray(input.ownedPaths, `slices[${index}].ownedPaths`, 1_000, true).map(
      (item, pathIndex) => safeRelative(item, `slices[${index}].ownedPaths[${pathIndex}]`),
    ), `slices[${index}].ownedPaths`).sort(),
    ...(workItemRefs == null ? {} : { workItemRefs }),
  };
}

function validateSlices(
  slices: RoadmapMissionSlice[],
  allowedEffects: EffectClass[],
  authorizationRefs: Partial<Record<EffectClass, string>>,
  checkpoint: RoadmapMissionDefinition["checkpoint"],
): void {
  if (slices.length === 0 || slices.length > 100) {
    throw new RoadmapMissionError("slices must contain between 1 and 100 items", 2);
  }
  const ids = slices.map((slice) => slice.id);
  unique(ids, "slices ids");
  unique(slices.map((slice) => slice.changeId), "slices changeId values");
  const position = new Map(ids.map((id, index) => [id, index]));
  const allowed = new Set(allowedEffects);
  for (const [index, slice] of slices.entries()) {
    for (const dependency of slice.dependsOn) {
      const dependencyIndex = position.get(dependency);
      if (dependencyIndex == null) {
        throw new RoadmapMissionError(`slice ${slice.id} depends on unknown slice ${dependency}`, 2);
      }
      if (dependencyIndex >= index) {
        throw new RoadmapMissionError(`slice ${slice.id} dependency ${dependency} must appear earlier in serial order`, 2);
      }
    }
    for (const effect of slice.effectClasses) {
      if (!allowed.has(effect)) {
        throw new RoadmapMissionError(`slice ${slice.id} uses effect ${effect} outside allowedEffects`, 2);
      }
      if (PROTECTED_EFFECTS.has(effect) && authorizationRefs[effect] == null) {
        throw new RoadmapMissionError(`slice ${slice.id} protected effect ${effect} requires authorizationRefs.${effect}`, 2);
      }
    }
  }
  if (slices.length > 1 && checkpoint.mode === "evidence-only" && checkpoint.workspace !== "disposable") {
    throw new RoadmapMissionError("multi-slice evidence-only missions require checkpoint.workspace=disposable", 2);
  }
  if (checkpoint.mode === "local-commit" && !allowed.has("local-commit")) {
    throw new RoadmapMissionError("local-commit checkpoint requires local-commit in allowedEffects", 2);
  }
}

export function parseMissionDefinition(value: unknown): RoadmapMissionDefinition {
  const input = record(value);
  if (input == null) throw new RoadmapMissionError("mission definition must be a JSON object", 2);
  exactKeys(input, [
    "schemaVersion",
    "missionId",
    "roadmapPath",
    "evidencePath",
    "validationArgv",
    "workflowOwner",
    "checkpoint",
    "allowedEffects",
    "authorizationRefs",
    "stopPolicy",
    "slices",
  ], "mission definition", ["parent"]);
  if (input.schemaVersion !== 1) throw new RoadmapMissionError("mission schemaVersion must be 1", 2);
  const allowedEffects = effectArray(input.allowedEffects, "allowedEffects", false);
  const authorizationRefs = parseAuthorizationRefs(input.authorizationRefs);
  for (const effect of Object.keys(authorizationRefs) as EffectClass[]) {
    if (!allowedEffects.includes(effect)) {
      throw new RoadmapMissionError(`authorizationRefs.${effect} is present but ${effect} is not allowed`, 2);
    }
  }
  const checkpoint = parseCheckpoint(input.checkpoint);
  const slices = Array.isArray(input.slices) ? input.slices.map(parseSlice) : [];
  validateSlices(slices, allowedEffects, authorizationRefs, checkpoint);
  const parent = "parent" in input ? parseParentCorrelation(input.parent) : undefined;
  if (parent == null && slices.some((slice) => slice.workItemRefs != null)) {
    throw new RoadmapMissionError("slice workItemRefs require a parent campaign correlation", 2);
  }
  if (parent != null) {
    if (slices.some((slice) => slice.operation !== "propose" || slice.workItemRefs == null)) {
      throw new RoadmapMissionError("parent-correlated slices must be propose operations with workItemRefs", 2);
    }
    const referenced = slices.flatMap((slice) => slice.workItemRefs ?? []);
    if (new Set(referenced).size !== referenced.length || JSON.stringify(referenced) !== JSON.stringify(parent.workItemRefs)) {
      throw new RoadmapMissionError("parent workItemRefs must exactly match ordered slice workItemRefs", 2);
    }
  }
  const validationArgv = stringArray(input.validationArgv, "validationArgv", 100, false);
  if (validationArgv.some((item) => /[\r\n\0]/.test(item))) {
    throw new RoadmapMissionError("validationArgv items must not contain control line or null characters", 2);
  }
  return {
    allowedEffects,
    authorizationRefs,
    checkpoint,
    evidencePath: safeRelative(input.evidencePath, "evidencePath"),
    missionId: safeId(input.missionId, "missionId"),
    ...(parent == null ? {} : { parent }),
    roadmapPath: safeRelative(input.roadmapPath, "roadmapPath"),
    schemaVersion: 1,
    slices,
    stopPolicy: parseStopPolicy(input.stopPolicy),
    validationArgv,
    workflowOwner: parseWorkflowOwner(input.workflowOwner),
  };
}

export function parseMissionBlocker(value: unknown, field = "mission blocker"): MissionBlocker {
  const input = record(value);
  if (input == null) throw new RoadmapMissionError(`${field} must be an object`, 2);
  exactKeys(input, [
    "affectedItemRefs",
    "decisions",
    "disposition",
    "evidenceRefs",
    "frontier",
    "gates",
    "resumeCondition",
    "rootSessionRef",
    "source",
    "waitKind",
  ], field);
  const refs = (candidate: unknown, refField: string, max = 100): string[] => {
    if (!Array.isArray(candidate) || candidate.length > max) {
      throw new RoadmapMissionError(`${refField} must contain at most ${max} references`, 2);
    }
    const parsed = candidate.map((entry, index) => singleLineString(entry, `${refField}[${index}]`, 2_000));
    if (new Set(parsed).size !== parsed.length) {
      throw new RoadmapMissionError(`${refField} must not contain duplicates`, 2);
    }
    return parsed;
  };
  const disposition = singleLineString(input.disposition, `${field}.disposition`) as MissionBlocker["disposition"];
  if (disposition !== "product-decision-required" && disposition !== "waiting") {
    throw new RoadmapMissionError(`${field}.disposition is unsupported`, 2);
  }
  const source = singleLineString(input.source, `${field}.source`) as MissionBlocker["source"];
  if (source !== "completion-guard" && source !== "mission-preflight") {
    throw new RoadmapMissionError(`${field}.source is unsupported`, 2);
  }
  const waitKinds: MissionWaitKind[] = [
    "budget",
    "capability",
    "external",
    "live-attempt",
    "process",
    "safety",
    "technical",
    "writer-liveness",
  ];
  const waitKind = input.waitKind == null
    ? null
    : singleLineString(input.waitKind, `${field}.waitKind`) as MissionWaitKind;
  if (waitKind != null && !waitKinds.includes(waitKind)) {
    throw new RoadmapMissionError(`${field}.waitKind is unsupported`, 2);
  }
  if (!Array.isArray(input.gates) || input.gates.length > 100) {
    throw new RoadmapMissionError(`${field}.gates must contain at most 100 entries`, 2);
  }
  const gates = input.gates.map((value, index): MissionBlocker["gates"][number] => {
    const gate = record(value);
    if (gate == null) throw new RoadmapMissionError(`${field}.gates[${index}] must be an object`, 2);
    exactKeys(gate, ["affectedItemRefs", "evidenceRefs", "id", "kind", "resumeCondition"], `${field}.gates[${index}]`);
    const kind = singleLineString(gate.kind, `${field}.gates[${index}].kind`) as MissionBlocker["gates"][number]["kind"];
    if (kind !== "product-decision" && !waitKinds.includes(kind as MissionWaitKind)) {
      throw new RoadmapMissionError(`${field}.gates[${index}].kind is unsupported`, 2);
    }
    return {
      affectedItemRefs: refs(gate.affectedItemRefs, `${field}.gates[${index}].affectedItemRefs`),
      evidenceRefs: refs(gate.evidenceRefs, `${field}.gates[${index}].evidenceRefs`),
      id: singleLineString(gate.id, `${field}.gates[${index}].id`, 500),
      kind,
      resumeCondition: singleLineString(gate.resumeCondition, `${field}.gates[${index}].resumeCondition`, 2_000),
    };
  });
  if (new Set(gates.map((gate) => gate.id)).size !== gates.length) {
    throw new RoadmapMissionError(`${field}.gates ids must not contain duplicates`, 2);
  }
  if (!Array.isArray(input.decisions) || input.decisions.length > 100) {
    throw new RoadmapMissionError(`${field}.decisions must contain at most 100 entries`, 2);
  }
  const decisions = input.decisions.map((value, index): MissionBlocker["decisions"][number] => {
    const decision = record(value);
    if (decision == null) throw new RoadmapMissionError(`${field}.decisions[${index}] must be an object`, 2);
    exactKeys(decision, [
      "affectedItemRefs",
      "decisionPoint",
      "evidenceRefs",
      "id",
      "optionInvariantItemRefs",
      "questionRef",
    ], `${field}.decisions[${index}]`);
    return {
      affectedItemRefs: refs(decision.affectedItemRefs, `${field}.decisions[${index}].affectedItemRefs`),
      decisionPoint: singleLineString(decision.decisionPoint, `${field}.decisions[${index}].decisionPoint`, 2_000),
      evidenceRefs: refs(decision.evidenceRefs, `${field}.decisions[${index}].evidenceRefs`),
      id: singleLineString(decision.id, `${field}.decisions[${index}].id`, 500),
      optionInvariantItemRefs: refs(decision.optionInvariantItemRefs, `${field}.decisions[${index}].optionInvariantItemRefs`),
      questionRef: singleLineString(decision.questionRef, `${field}.decisions[${index}].questionRef`, 500),
    };
  });
  if (new Set(decisions.map((decision) => decision.id)).size !== decisions.length) {
    throw new RoadmapMissionError(`${field}.decisions ids must not contain duplicates`, 2);
  }
  let frontier: MissionBlocker["frontier"] = null;
  if (input.frontier != null) {
    const candidate = record(input.frontier);
    if (candidate == null) throw new RoadmapMissionError(`${field}.frontier must be an object or null`, 2);
    exactKeys(candidate, [
      "acceptedOutcomeRef",
      "basisHumanRef",
      "frontierGeneration",
      "progressFingerprint",
      "taskStateDigest",
    ], `${field}.frontier`);
    if (!Number.isSafeInteger(candidate.frontierGeneration) || (candidate.frontierGeneration as number) < 1) {
      throw new RoadmapMissionError(`${field}.frontier.frontierGeneration must be a positive integer`, 2);
    }
    frontier = {
      acceptedOutcomeRef: singleLineString(candidate.acceptedOutcomeRef, `${field}.frontier.acceptedOutcomeRef`, 500),
      basisHumanRef: singleLineString(candidate.basisHumanRef, `${field}.frontier.basisHumanRef`, 500),
      frontierGeneration: candidate.frontierGeneration as number,
      progressFingerprint: singleLineString(candidate.progressFingerprint, `${field}.frontier.progressFingerprint`, 2_000),
      taskStateDigest: digestString(candidate.taskStateDigest, `${field}.frontier.taskStateDigest`),
    };
  }
  const blocker: MissionBlocker = {
    affectedItemRefs: refs(input.affectedItemRefs, `${field}.affectedItemRefs`),
    decisions,
    disposition,
    evidenceRefs: refs(input.evidenceRefs, `${field}.evidenceRefs`),
    frontier,
    gates,
    resumeCondition: singleLineString(input.resumeCondition, `${field}.resumeCondition`, 2_000),
    rootSessionRef: nullableSingleLineString(input.rootSessionRef, `${field}.rootSessionRef`, 500),
    source,
    waitKind,
  };
  if (disposition === "product-decision-required") {
    if (waitKind != null || decisions.length === 0 || !gates.some((gate) => gate.kind === "product-decision")) {
      throw new RoadmapMissionError(`${field} product decision facts are incomplete`, 2);
    }
  } else if (waitKind == null || gates.some((gate) => gate.kind === "product-decision" && decisions.length === 0)) {
    throw new RoadmapMissionError(`${field} waiting facts are incomplete`, 2);
  }
  return blocker;
}

export function parseMissionExecutorResult(
  value: unknown,
  expected: MissionExecutorExpectation,
): PersistedMissionExecutorResult {
  const input = record(value);
  if (input == null) throw new RoadmapMissionError("executor result must be a JSON object", 2);
  if (!("terminalCertificate" in input)) input.terminalCertificate = null;
  if (!("blocker" in input)) input.blocker = null;
  exactKeys(input, [
    "schemaVersion",
    "tool",
    "missionId",
    "definitionDigest",
    "sliceId",
    "changeId",
    "attempt",
    "blocker",
    "runtimeRef",
    "rootSessionRef",
    "disposition",
    "phases",
    "guardState",
    "questionDisposition",
    "writerClosure",
    "cleanup",
    "evidenceRefs",
    "errorClass",
    "errorMessage",
    "terminalCertificate",
  ], "executor result");
  if (input.schemaVersion !== 1 || input.tool !== "roadmap-mission-session-executor") {
    throw new RoadmapMissionError("executor result schema or tool is unsupported", 2);
  }
  if (!Number.isSafeInteger(input.attempt) || (input.attempt as number) < 1 || (input.attempt as number) > 20) {
    throw new RoadmapMissionError("executor result attempt must be an integer between 1 and 20", 2);
  }
  const missionId = safeId(input.missionId, "executor result missionId");
  const sliceId = safeId(input.sliceId, "executor result sliceId");
  const changeId = safeId(input.changeId, "executor result changeId");
  const definitionDigest = digestString(input.definitionDigest, "executor result definitionDigest");
  if (
    missionId !== expected.missionId ||
    sliceId !== expected.slice.id ||
    changeId !== expected.slice.changeId ||
    definitionDigest !== expected.definitionDigest ||
    input.attempt !== expected.attempt
  ) {
    throw new RoadmapMissionError("executor result correlation does not match the requested mission slice attempt", 2);
  }
  const disposition = singleLineString(input.disposition, "executor result disposition") as MissionExecutorDisposition | "owner-required";
  const legacyOwnerRequired = disposition === "owner-required";
  if (!(EXECUTOR_DISPOSITIONS as readonly string[]).includes(disposition) && !legacyOwnerRequired) {
    throw new RoadmapMissionError("executor result disposition is unsupported", 2);
  }
  const guardState = singleLineString(input.guardState, "executor result guardState") as MissionExecutorResult["guardState"];
  if (!(EXECUTOR_GUARD_STATES as readonly string[]).includes(guardState)) {
    throw new RoadmapMissionError("executor result guardState is unsupported", 2);
  }
  const questionDisposition = singleLineString(
    input.questionDisposition,
    "executor result questionDisposition",
  ) as MissionExecutorResult["questionDisposition"] | "owner-required";
  if (!( ["autonomous", "none", "owner-required", "product-decision-required", "unknown"] as readonly string[]).includes(questionDisposition)) {
    throw new RoadmapMissionError("executor result questionDisposition is unsupported", 2);
  }
  const writerClosure = singleLineString(input.writerClosure, "executor result writerClosure") as MissionExecutorResult["writerClosure"];
  if (!( ["isolated", "terminal", "unknown"] as readonly string[]).includes(writerClosure)) {
    throw new RoadmapMissionError("executor result writerClosure is unsupported", 2);
  }
  const cleanup = singleLineString(input.cleanup, "executor result cleanup") as MissionExecutorResult["cleanup"];
  if (!( ["complete", "not-required", "unknown"] as readonly string[]).includes(cleanup)) {
    throw new RoadmapMissionError("executor result cleanup is unsupported", 2);
  }
  const errorClass = singleLineString(input.errorClass, "executor result errorClass") as MissionExecutorResult["errorClass"] | "owner-required";
  if (!( ["none", "owner-required", "paused", "product-decision-required", "terminal", "transient", "unknown", "waiting"] as readonly string[]).includes(errorClass)) {
    throw new RoadmapMissionError("executor result errorClass is unsupported", 2);
  }
  const blocker = input.blocker == null ? null : parseMissionBlocker(input.blocker, "executor result blocker");
  const errorMessage = nullableSingleLineString(input.errorMessage, "executor result errorMessage", 1_000);
  if ((errorClass === "none") !== (errorMessage == null)) {
    throw new RoadmapMissionError("executor result errorMessage must be null exactly when errorClass is none", 2);
  }
  if (!Array.isArray(input.evidenceRefs) || input.evidenceRefs.length > 100) {
    throw new RoadmapMissionError("executor result evidenceRefs must contain at most 100 paths", 2);
  }
  const evidenceRefs = input.evidenceRefs.map((entry, index) =>
    safeRelative(entry, `executor result evidenceRefs[${index}]`)
  ).sort();
  if (new Set(evidenceRefs).size !== evidenceRefs.length) {
    throw new RoadmapMissionError("executor result evidenceRefs must not contain duplicates", 2);
  }
  if (!Array.isArray(input.phases) || input.phases.length > 2) {
    throw new RoadmapMissionError("executor result phases must contain at most two entries", 2);
  }
  const phases = input.phases.map((value, index): MissionExecutorResult["phases"][number] => {
    const phase = record(value);
    if (phase == null) throw new RoadmapMissionError(`executor result phases[${index}] must be an object`, 2);
    exactKeys(phase, ["command", "status", "evidenceRef"], `executor result phases[${index}]`);
    const command = singleLineString(phase.command, `executor result phases[${index}].command`) as "opsx-apply" | "opsx-propose";
    if (command !== "opsx-apply" && command !== "opsx-propose") {
      throw new RoadmapMissionError(`executor result phases[${index}].command is unsupported`, 2);
    }
    const status = singleLineString(phase.status, `executor result phases[${index}].status`) as MissionExecutorResult["phases"][number]["status"];
    if (!( ["completed", "failed", "interrupted"] as readonly string[]).includes(status)) {
      throw new RoadmapMissionError(`executor result phases[${index}].status is unsupported`, 2);
    }
    const evidenceRef = safeRelative(phase.evidenceRef, `executor result phases[${index}].evidenceRef`);
    if (!evidenceRefs.includes(evidenceRef)) {
      throw new RoadmapMissionError(`executor result phases[${index}].evidenceRef is absent from evidenceRefs`, 2);
    }
    return { command, evidenceRef, status };
  });
  const expectedCommands = expected.slice.operation === "propose"
    ? ["opsx-propose", "opsx-apply"]
    : ["opsx-apply"];
  if (phases.some((phase, index) => phase.command !== expectedCommands[index])) {
    throw new RoadmapMissionError("executor result phase order does not match the requested operation", 2);
  }
  const rootSessionRef = nullableSingleLineString(input.rootSessionRef, "executor result rootSessionRef", 200);
  let terminalCertificate: TerminalCertificate | null = null;
  if (input.terminalCertificate != null) {
    try {
      terminalCertificate = parseTerminalCertificate(input.terminalCertificate);
    } catch (error) {
      throw new RoadmapMissionError("executor result terminalCertificate is invalid", 2, { cause: error });
    }
  }
  const result = {
    attempt: input.attempt as number,
    blocker,
    changeId,
    cleanup,
    definitionDigest,
    disposition,
    errorClass,
    errorMessage,
    evidenceRefs,
    guardState,
    missionId,
    phases,
    questionDisposition,
    rootSessionRef,
    runtimeRef: digestString(input.runtimeRef, "executor result runtimeRef"),
    schemaVersion: 1,
    sliceId,
    terminalCertificate,
    tool: "roadmap-mission-session-executor",
    writerClosure,
  };
  if (disposition === "completed") {
    if (
      phases.length !== expectedCommands.length ||
      phases.some((phase) => phase.status !== "completed") ||
      guardState !== "passed" ||
      rootSessionRef == null ||
      questionDisposition === "owner-required" ||
      questionDisposition === "product-decision-required" ||
      blocker != null ||
      writerClosure === "unknown" ||
      cleanup !== "complete" ||
      errorClass !== "none"
    ) {
      throw new RoadmapMissionError("completed executor result is not terminal-clear", 2);
    }
  }
  if (legacyOwnerRequired && (
    blocker != null || questionDisposition !== "owner-required" || writerClosure === "unknown" || cleanup !== "complete" || errorClass !== "owner-required"
  )) {
    throw new RoadmapMissionError("legacy owner-required executor result did not close active ownership", 2);
  }
  if ((disposition === "product-decision-required" || disposition === "waiting") && (
    blocker?.disposition !== disposition ||
    writerClosure === "unknown" ||
    cleanup !== "complete" ||
    errorClass !== disposition ||
    (disposition === "product-decision-required" && questionDisposition !== "product-decision-required") ||
    (disposition === "waiting" && questionDisposition === "product-decision-required")
  )) {
    throw new RoadmapMissionError(`${disposition} executor result did not preserve a closed blocker`, 2);
  }
  if (disposition === "transient" && errorClass !== "transient") {
    throw new RoadmapMissionError("transient executor result requires transient errorClass", 2);
  }
  if (disposition === "terminal" && errorClass !== "terminal" && errorClass !== "unknown") {
    throw new RoadmapMissionError("terminal executor result requires terminal or unknown errorClass", 2);
  }
  if (disposition === "paused" && (blocker != null || (errorClass !== "paused" && errorClass !== "unknown"))) {
    throw new RoadmapMissionError("paused executor result requires paused or unknown errorClass", 2);
  }
  return result as PersistedMissionExecutorResult;
}

function containedFile(root: string, input: string, label: string): string {
  const resolved = path.resolve(root, input);
  const relative = path.relative(root, resolved);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new RoadmapMissionError(`${label} must remain inside the project root`, 2);
  }
  let stat: fs.Stats;
  try {
    stat = fs.lstatSync(resolved);
  } catch (error) {
    throw new RoadmapMissionError(`${label} is missing`, 2, { cause: error });
  }
  if (stat.isSymbolicLink() || !stat.isFile()) {
    throw new RoadmapMissionError(`${label} must be a regular non-symlink file`, 2);
  }
  return resolved;
}

export function loadMissionDefinition(root: string, missionPath: string): RoadmapMissionDefinition {
  const file = containedFile(root, missionPath, "mission file");
  let parsed: unknown;
  try {
    parsed = JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (error) {
    throw new RoadmapMissionError("mission file must contain valid UTF-8 JSON", 2, { cause: error });
  }
  const definition = parseMissionDefinition(parsed);
  containedFile(root, definition.roadmapPath, "roadmapPath");
  const evidence = path.resolve(root, definition.evidencePath);
  const evidenceRelative = path.relative(root, evidence);
  if (evidenceRelative.startsWith("..") || path.isAbsolute(evidenceRelative)) {
    throw new RoadmapMissionError("evidencePath must remain inside the project root", 2);
  }
  return definition;
}
