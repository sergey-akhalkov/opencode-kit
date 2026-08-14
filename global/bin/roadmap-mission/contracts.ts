import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

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

export type RoadmapMissionSlice = {
  changeId: string;
  dependsOn: string[];
  effectClasses: EffectClass[];
  id: string;
  operation: MissionOperation;
  outcome: string;
  ownedPaths: string[];
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

function safeId(value: unknown, field: string): string {
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

function exactKeys(input: Record<string, unknown>, expected: readonly string[], field: string): void {
  const extras = Object.keys(input).filter((key) => !expected.includes(key)).sort();
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

function parseSlice(value: unknown, index: number): RoadmapMissionSlice {
  const input = record(value);
  if (input == null) throw new RoadmapMissionError(`slices[${index}] must be an object`, 2);
  exactKeys(input, ["id", "changeId", "operation", "dependsOn", "outcome", "effectClasses", "ownedPaths"], `slices[${index}]`);
  const operation = requiredString(input.operation, `slices[${index}].operation`) as MissionOperation;
  if (operation !== "continue" && operation !== "propose") {
    throw new RoadmapMissionError(`slices[${index}].operation must be continue or propose`, 2);
  }
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
  ], "mission definition");
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
    roadmapPath: safeRelative(input.roadmapPath, "roadmapPath"),
    schemaVersion: 1,
    slices,
    stopPolicy: parseStopPolicy(input.stopPolicy),
    validationArgv,
    workflowOwner: parseWorkflowOwner(input.workflowOwner),
  };
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
