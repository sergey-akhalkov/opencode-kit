import crypto, { randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import {
  loadMissionDefinition,
  missionDefinitionDigest,
  parseMissionBlocker,
  RoadmapMissionError,
  stableJson,
} from "./contracts.ts";
import type { CheckpointMode, MissionBlocker, RoadmapMissionDefinition } from "./contracts.ts";

const TRANSITION_KINDS = [
  "archive",
  "archive-launch",
  "checkpoint",
  "pause",
  "preflight",
  "proof-validation",
  "frontier-stop",
  "restart-reconciliation",
  "session-completion",
  "session-launch",
  "slice-blocked",
  "slice-resume",
  "successor-activation",
  "terminal-stop",
] as const;

const DISPOSITIONS = [
  "awaiting-checkpoint",
  "blocked",
  "complete",
  "paused",
  "paused-unknown",
  "product-decision-required",
  "ready",
  "running",
  "waiting",
] as const;

const OPERATION_KINDS = [
  "archive",
  "checkpoint",
  "preflight",
  "proof-validation",
  "session",
  "successor",
] as const;

export type MissionTransitionKind = typeof TRANSITION_KINDS[number];
export type MissionDisposition = typeof DISPOSITIONS[number];

export type MissionIdentity = {
  kit: string;
  node: string;
  openCode: string;
  openSpec: string;
  repository: string;
};

export type MissionActiveOperation = {
  kind: typeof OPERATION_KINDS[number];
  processRef: string | null;
  sessionRef: string | null;
};

export type MissionTransitionDescriptor = {
  activeOperation: MissionActiveOperation | null;
  blocker?: MissionBlocker;
  checkpoint: {
    identity: string | null;
    mode: CheckpointMode;
  };
  createdAt: string;
  cursor: number;
  disposition: MissionDisposition;
  evidenceRefs: string[];
  identities: MissionIdentity;
  kind: MissionTransitionKind;
  recovery: {
    attempts: number;
    sliceStartedAt: string | null;
  };
  schemaVersion: 1;
  sliceId: string | null;
};

export type MissionStateProjection = Omit<MissionTransitionDescriptor, "kind"> & {
  definitionDigest: string;
  lastTransitionDigest: string;
  lastTransitionKind: MissionTransitionKind;
  missionId: string;
  sequence: number;
};

export type MissionResultFacts = {
  archiveRefs: string[];
  evidenceRefs: string[];
  executorAttempts: Array<{
    attempt: number;
    resultRef: string;
    sliceId: string;
  }>;
  processRefs: string[];
  projection: MissionStateProjection | null;
};

export type MissionParkedSlice = {
  blocker: MissionBlocker;
  cursor: number;
  recovery: MissionTransitionDescriptor["recovery"];
  transitionDigest: string;
};

export type MissionSchedulingFacts = {
  completedSliceIds: string[];
  parkedSlices: MissionParkedSlice[];
};

export type MissionTransitionRecord = MissionTransitionDescriptor & {
  definitionDigest: string;
  missionId: string;
  previousStateDigest: string | null;
  previousTransitionDigest: string | null;
  resultingStateDigest: string;
  sequence: number;
  transitionDigest: string;
};

export type WriterLease = {
  createdAt: string;
  definitionDigest: string;
  missionId: string;
  pid: number;
  schemaVersion: 1;
  token: string;
};

export type MissionStopIntent = {
  controllerPtyRef: string | null;
  definitionDigest: string;
  missionId: string;
  requestedAt: string;
  rootSessionRef: string | null;
  schemaVersion: 1;
  source: "campaign" | "signal" | "slash";
};

type Chain = {
  projection: MissionStateProjection | null;
  records: MissionTransitionRecord[];
};

export type MissionReplayReport = {
  definitionDigest: string;
  exitCode: number;
  lastTransitionDigest: string | null;
  missionId: string;
  operation: "state-replay";
  projectionStatus: "current" | "missing" | "stale";
  schemaVersion: 1;
  sequence: number;
  stateDigest: string | null;
  status: "blocked" | "valid";
  tool: "roadmap-mission";
  transitionCount: number;
  writerStatus: "active" | "clear" | "stale" | "unknown";
};

function record(value: unknown): Record<string, unknown> | null {
  return value != null && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

function exactKeys(input: Record<string, unknown>, expected: readonly string[], field: string, optional: readonly string[] = []): void {
  const missing = expected.filter((key) => !(key in input));
  const extras = Object.keys(input).filter((key) => !expected.includes(key) && !optional.includes(key)).sort();
  if (missing.length > 0 || extras.length > 0) {
    const detail = [
      missing.length > 0 ? `missing=${missing.join(",")}` : null,
      extras.length > 0 ? `unsupported=${extras.join(",")}` : null,
    ].filter((value): value is string => value != null).join(" ");
    throw new RoadmapMissionError(`${field} has invalid fields: ${detail}`, 2);
  }
}

function requiredString(value: unknown, field: string, max = 500): string {
  if (typeof value !== "string" || value.trim() === "" || value.length > max || /[\r\n\0]/.test(value)) {
    throw new RoadmapMissionError(`${field} must be a non-empty single-line string of at most ${max} characters`, 2);
  }
  return value.trim();
}

function nullableString(value: unknown, field: string, max = 500): string | null {
  return value == null ? null : requiredString(value, field, max);
}

function safeRelative(value: unknown, field: string): string {
  const parsed = requiredString(value, field).replaceAll("\\", "/").replace(/^\.\//, "");
  if (path.isAbsolute(parsed) || parsed.split("/").some((part) => part === "" || part === "." || part === "..")) {
    throw new RoadmapMissionError(`${field} must be a contained project-relative path`, 2);
  }
  return parsed;
}

function parseTimestamp(value: unknown, field: string): string {
  const parsed = requiredString(value, field, 100);
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(parsed) || Number.isNaN(Date.parse(parsed))) {
    throw new RoadmapMissionError(`${field} must be an ISO UTC timestamp`, 2);
  }
  return parsed;
}

function parseActiveOperation(value: unknown): MissionActiveOperation | null {
  if (value == null) return null;
  const input = record(value);
  if (input == null) throw new RoadmapMissionError("activeOperation must be an object or null", 2);
  exactKeys(input, ["kind", "processRef", "sessionRef"], "activeOperation");
  const kind = requiredString(input.kind, "activeOperation.kind") as MissionActiveOperation["kind"];
  if (!(OPERATION_KINDS as readonly string[]).includes(kind)) {
    throw new RoadmapMissionError("activeOperation.kind is unsupported", 2);
  }
  return {
    kind,
    processRef: nullableString(input.processRef, "activeOperation.processRef"),
    sessionRef: nullableString(input.sessionRef, "activeOperation.sessionRef"),
  };
}

function parseCheckpoint(value: unknown, definition: RoadmapMissionDefinition): MissionTransitionDescriptor["checkpoint"] {
  const input = record(value);
  if (input == null) throw new RoadmapMissionError("checkpoint must be an object", 2);
  exactKeys(input, ["identity", "mode"], "checkpoint");
  if (input.mode !== definition.checkpoint.mode) {
    throw new RoadmapMissionError("checkpoint.mode must match the mission definition", 2);
  }
  return {
    identity: nullableString(input.identity, "checkpoint.identity"),
    mode: input.mode as CheckpointMode,
  };
}

function parseIdentities(value: unknown): MissionIdentity {
  const input = record(value);
  if (input == null) throw new RoadmapMissionError("identities must be an object", 2);
  const fields = ["kit", "node", "openCode", "openSpec", "repository"] as const;
  exactKeys(input, fields, "identities");
  return Object.fromEntries(fields.map((field) => [field, requiredString(input[field], `identities.${field}`)])) as MissionIdentity;
}

function parseRecovery(value: unknown): MissionTransitionDescriptor["recovery"] {
  const input = record(value);
  if (input == null) throw new RoadmapMissionError("recovery must be an object", 2);
  exactKeys(input, ["attempts", "sliceStartedAt"], "recovery");
  if (!Number.isSafeInteger(input.attempts) || (input.attempts as number) < 0) {
    throw new RoadmapMissionError("recovery.attempts must be a non-negative integer", 2);
  }
  const sliceStartedAt = input.sliceStartedAt == null
    ? null
    : parseTimestamp(input.sliceStartedAt, "recovery.sliceStartedAt");
  if (((input.attempts as number) === 0) !== (sliceStartedAt == null)) {
    throw new RoadmapMissionError("recovery.sliceStartedAt must be present exactly when attempts is non-zero", 2);
  }
  return { attempts: input.attempts as number, sliceStartedAt };
}

export function parseTransitionDescriptor(
  value: unknown,
  definition: RoadmapMissionDefinition,
): MissionTransitionDescriptor {
  const input = record(value);
  if (input == null) throw new RoadmapMissionError("transition descriptor must be an object", 2);
  exactKeys(input, [
    "schemaVersion",
    "kind",
    "createdAt",
    "cursor",
    "sliceId",
    "disposition",
    "activeOperation",
    "checkpoint",
    "evidenceRefs",
    "identities",
    "recovery",
  ], "transition descriptor", ["blocker"]);
  if (input.schemaVersion !== 1) throw new RoadmapMissionError("transition schemaVersion must be 1", 2);
  const kind = requiredString(input.kind, "kind") as MissionTransitionKind;
  if (!(TRANSITION_KINDS as readonly string[]).includes(kind)) {
    throw new RoadmapMissionError("transition kind is unsupported", 2);
  }
  if (!Number.isSafeInteger(input.cursor) || (input.cursor as number) < 0 || (input.cursor as number) >= definition.slices.length) {
    throw new RoadmapMissionError("cursor must identify one mission slice", 2);
  }
  const sliceId = nullableString(input.sliceId, "sliceId", 100);
  if (sliceId != null && definition.slices[input.cursor as number]?.id !== sliceId) {
    throw new RoadmapMissionError("sliceId must match the mission slice at cursor", 2);
  }
  const disposition = requiredString(input.disposition, "disposition") as MissionDisposition;
  if (!(DISPOSITIONS as readonly string[]).includes(disposition)) {
    throw new RoadmapMissionError("disposition is unsupported", 2);
  }
  if (!Array.isArray(input.evidenceRefs) || input.evidenceRefs.length > 100) {
    throw new RoadmapMissionError("evidenceRefs must contain at most 100 paths", 2);
  }
  const evidenceRefs = input.evidenceRefs.map((entry, index) => safeRelative(entry, `evidenceRefs[${index}]`)).sort();
  if (new Set(evidenceRefs).size !== evidenceRefs.length) {
    throw new RoadmapMissionError("evidenceRefs must not contain duplicates", 2);
  }
  const descriptor: MissionTransitionDescriptor = {
    activeOperation: parseActiveOperation(input.activeOperation),
    ...("blocker" in input && input.blocker != null
      ? { blocker: parseMissionBlocker(input.blocker, "transition blocker") }
      : {}),
    checkpoint: parseCheckpoint(input.checkpoint, definition),
    createdAt: parseTimestamp(input.createdAt, "createdAt"),
    cursor: input.cursor as number,
    disposition,
    evidenceRefs,
    identities: parseIdentities(input.identities),
    kind,
    recovery: parseRecovery(input.recovery),
    schemaVersion: 1,
    sliceId,
  };
  if (kind === "archive" && disposition !== "awaiting-checkpoint") {
    throw new RoadmapMissionError("archive transition must await checkpoint", 2);
  }
  if (kind === "checkpoint" && descriptor.checkpoint.identity == null) {
    throw new RoadmapMissionError("checkpoint transition requires checkpoint.identity", 2);
  }
  if (kind === "session-launch" && descriptor.activeOperation?.kind !== "session") {
    throw new RoadmapMissionError("session-launch transition requires activeOperation.kind=session", 2);
  }
  if (kind === "terminal-stop" && !["blocked", "complete", "paused", "paused-unknown"].includes(disposition)) {
    throw new RoadmapMissionError("terminal-stop disposition must be blocked, complete, paused, or paused-unknown", 2);
  }
  const blockingSessionCompletion = kind === "session-completion"
    && (disposition === "product-decision-required" || disposition === "waiting");
  if (["frontier-stop", "slice-blocked", "slice-resume"].includes(kind) || blockingSessionCompletion) {
    if (descriptor.blocker == null || (kind !== "slice-resume" && descriptor.blocker.disposition !== disposition)) {
      throw new RoadmapMissionError(`${kind} transition requires its exact blocker`, 2);
    }
    if (blockingSessionCompletion && descriptor.activeOperation != null) {
      throw new RoadmapMissionError("blocking session-completion transition must close active operation ownership", 2);
    }
  } else if (descriptor.blocker != null && kind !== "restart-reconciliation") {
    throw new RoadmapMissionError(`${kind} transition must not carry blocker facts`, 2);
  }
  if (kind === "slice-resume" && disposition !== "ready") {
    throw new RoadmapMissionError("slice-resume transition must be ready", 2);
  }
  return descriptor;
}

function stateRoot(root: string, missionId: string): string {
  return path.join(root, ".opencode-dev-kit", "runtime", "roadmap-missions", missionId);
}

function assertContained(root: string, target: string): void {
  const relative = path.relative(root, target);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new RoadmapMissionError("mission runtime path escaped the project root", 2);
  }
}

function ensureDirectory(root: string, target: string): void {
  assertContained(root, target);
  const relative = path.relative(root, target);
  let current = root;
  for (const segment of relative.split(path.sep).filter(Boolean)) {
    current = path.join(current, segment);
    if (!fs.existsSync(current)) {
      fs.mkdirSync(current);
      continue;
    }
    const stat = fs.lstatSync(current);
    if (stat.isSymbolicLink() || !stat.isDirectory()) {
      throw new RoadmapMissionError(`mission runtime directory is unsafe: ${path.relative(root, current).replaceAll("\\", "/")}`, 2);
    }
  }
}

function regularFile(file: string): boolean {
  try {
    const stat = fs.lstatSync(file);
    return stat.isFile() && !stat.isSymbolicLink();
  } catch {
    return false;
  }
}

function digest(value: unknown): string {
  return crypto.createHash("sha256").update(stableJson(value)).digest("hex");
}

function writeExclusiveDurable(file: string, content: string): void {
  let handle: number | null = null;
  try {
    handle = fs.openSync(file, "wx");
    fs.writeFileSync(handle, content, "utf8");
    fs.fsyncSync(handle);
    fs.closeSync(handle);
    handle = null;
  } finally {
    if (handle != null) fs.closeSync(handle);
  }
}

function writeProjectionAtomic(directory: string, projection: MissionStateProjection): void {
  const target = path.join(directory, "state.json");
  if (fs.existsSync(target) && !regularFile(target)) {
    throw new RoadmapMissionError("state.json is not a regular non-symlink file", 2);
  }
  const temporary = path.join(directory, `.state.${process.pid}.${randomUUID()}.tmp`);
  try {
    writeExclusiveDurable(temporary, stableJson(projection));
    fs.renameSync(temporary, target);
  } finally {
    if (fs.existsSync(temporary)) fs.rmSync(temporary, { force: true });
  }
}

function parseStopIntent(value: unknown, definition: RoadmapMissionDefinition): MissionStopIntent {
  const input = record(value);
  if (input == null) throw new RoadmapMissionError("mission stop intent must be an object", 2);
  exactKeys(input, [
    "schemaVersion",
    "missionId",
    "definitionDigest",
    "requestedAt",
    "source",
    "rootSessionRef",
    "controllerPtyRef",
  ], "mission stop intent");
  if (input.schemaVersion !== 1 || input.missionId !== definition.missionId) {
    throw new RoadmapMissionError("mission stop intent identity is invalid", 2);
  }
  const definitionDigest = requiredString(input.definitionDigest, "mission stop intent definitionDigest", 64);
  if (definitionDigest !== missionDefinitionDigest(definition)) {
    throw new RoadmapMissionError("mission stop intent definition digest differs", 2);
  }
  if (input.source !== "campaign" && input.source !== "slash" && input.source !== "signal") {
    throw new RoadmapMissionError("mission stop intent source is unsupported", 2);
  }
  return {
    controllerPtyRef: nullableString(input.controllerPtyRef, "mission stop intent controllerPtyRef", 200),
    definitionDigest,
    missionId: definition.missionId,
    requestedAt: parseTimestamp(input.requestedAt, "mission stop intent requestedAt"),
    rootSessionRef: nullableString(input.rootSessionRef, "mission stop intent rootSessionRef", 200),
    schemaVersion: 1,
    source: input.source,
  };
}

export function readMissionStopIntent(
  root: string,
  definition: RoadmapMissionDefinition,
): MissionStopIntent | null {
  const file = path.join(stateRoot(root, definition.missionId), "stop-intent.json");
  if (!fs.existsSync(file)) return null;
  if (!regularFile(file)) throw new RoadmapMissionError("mission stop intent is not a regular non-symlink file", 2);
  try {
    return parseStopIntent(JSON.parse(fs.readFileSync(file, "utf8")), definition);
  } catch (error) {
    if (error instanceof RoadmapMissionError) throw error;
    throw new RoadmapMissionError("mission stop intent is unreadable", 2, { cause: error });
  }
}

export function recordMissionStopIntent(
  root: string,
  definition: RoadmapMissionDefinition,
  input: Pick<MissionStopIntent, "controllerPtyRef" | "rootSessionRef" | "source"> & { requestedAt?: string },
): MissionStopIntent {
  const directory = stateRoot(root, definition.missionId);
  ensureDirectory(root, directory);
  const existing = readMissionStopIntent(root, definition);
  if (existing != null) return existing;
  const file = path.join(directory, "stop-intent.json");
  const intent = parseStopIntent({
    controllerPtyRef: input.controllerPtyRef,
    definitionDigest: missionDefinitionDigest(definition),
    missionId: definition.missionId,
    requestedAt: input.requestedAt ?? new Date().toISOString(),
    rootSessionRef: input.rootSessionRef,
    schemaVersion: 1,
    source: input.source,
  }, definition);
  writeExclusiveDurable(file, stableJson(intent));
  return intent;
}

export function clearMissionStopIntent(root: string, definition: RoadmapMissionDefinition): void {
  const file = path.join(stateRoot(root, definition.missionId), "stop-intent.json");
  if (!fs.existsSync(file)) return;
  readMissionStopIntent(root, definition);
  fs.unlinkSync(file);
}

function pidStatus(pid: number): "active" | "stale" | "unknown" {
  if (!Number.isSafeInteger(pid) || pid <= 0) return "unknown";
  try {
    process.kill(pid, 0);
    return "active";
  } catch (error) {
    const code = error instanceof Error && "code" in error ? String((error as NodeJS.ErrnoException).code) : "";
    return code === "ESRCH" ? "stale" : code === "EPERM" ? "active" : "unknown";
  }
}

function parseWriterLease(value: unknown): WriterLease {
  const input = record(value);
  if (input == null) throw new RoadmapMissionError("writer lease is malformed", 2);
  const fields = ["schemaVersion", "missionId", "definitionDigest", "token", "pid", "createdAt"] as const;
  exactKeys(input, fields, "writer lease");
  if (input.schemaVersion !== 1 || !Number.isSafeInteger(input.pid) || (input.pid as number) <= 0) {
    throw new RoadmapMissionError("writer lease is malformed", 2);
  }
  return {
    createdAt: parseTimestamp(input.createdAt, "writer lease createdAt"),
    definitionDigest: requiredString(input.definitionDigest, "writer lease definitionDigest", 64),
    missionId: requiredString(input.missionId, "writer lease missionId", 100),
    pid: input.pid as number,
    schemaVersion: 1,
    token: requiredString(input.token, "writer lease token", 100),
  };
}

function readLease(file: string): WriterLease {
  if (!regularFile(file)) throw new RoadmapMissionError("writer lease is not a regular non-symlink file", 2);
  try {
    return parseWriterLease(JSON.parse(fs.readFileSync(file, "utf8")));
  } catch (error) {
    if (error instanceof RoadmapMissionError) throw error;
    throw new RoadmapMissionError("writer lease is unreadable", 2, { cause: error });
  }
}

export function acquireWriterLease(
  root: string,
  definition: RoadmapMissionDefinition,
  createdAt = new Date().toISOString(),
): WriterLease {
  const directory = stateRoot(root, definition.missionId);
  ensureDirectory(root, directory);
  const lock = path.join(directory, "writer.lock");
  const definitionDigest = missionDefinitionDigest(definition);
  if (fs.existsSync(lock)) {
    const existing = readLease(lock);
    if (existing.missionId !== definition.missionId || existing.definitionDigest !== definitionDigest) {
      throw new RoadmapMissionError("writer lease identity does not match the mission definition", 2);
    }
    const status = pidStatus(existing.pid);
    if (status !== "stale") {
      throw new RoadmapMissionError(`writer lease liveness is ${status}`, 1);
    }
    const staleDirectory = path.join(directory, "leases");
    ensureDirectory(root, staleDirectory);
    const stale = path.join(staleDirectory, `stale-${digest(existing).slice(0, 16)}.json`);
    if (fs.existsSync(stale)) throw new RoadmapMissionError("stale writer lease archive already exists", 2);
    fs.renameSync(lock, stale);
  }
  const lease: WriterLease = {
    createdAt: parseTimestamp(createdAt, "writer lease createdAt"),
    definitionDigest,
    missionId: definition.missionId,
    pid: process.pid,
    schemaVersion: 1,
    token: randomUUID(),
  };
  writeExclusiveDurable(lock, stableJson(lease));
  return lease;
}

export function releaseWriterLease(root: string, lease: WriterLease): void {
  const lock = path.join(stateRoot(root, lease.missionId), "writer.lock");
  const current = readLease(lock);
  if (stableJson(current) !== stableJson(lease)) {
    throw new RoadmapMissionError("writer lease changed before release", 2);
  }
  fs.unlinkSync(lock);
}

function transitionUnsigned(recordValue: MissionTransitionRecord): Omit<MissionTransitionRecord, "resultingStateDigest" | "transitionDigest"> {
  const { resultingStateDigest: _state, transitionDigest: _transition, ...unsigned } = recordValue;
  return unsigned;
}

function projectionFromRecord(recordValue: MissionTransitionRecord): MissionStateProjection {
  return {
    activeOperation: recordValue.activeOperation,
    ...(recordValue.blocker == null ? {} : { blocker: recordValue.blocker }),
    checkpoint: recordValue.checkpoint,
    createdAt: recordValue.createdAt,
    cursor: recordValue.cursor,
    definitionDigest: recordValue.definitionDigest,
    disposition: recordValue.disposition,
    evidenceRefs: recordValue.evidenceRefs,
    identities: recordValue.identities,
    lastTransitionDigest: recordValue.transitionDigest,
    lastTransitionKind: recordValue.kind,
    missionId: recordValue.missionId,
    recovery: recordValue.recovery,
    schemaVersion: 1,
    sequence: recordValue.sequence,
    sliceId: recordValue.sliceId,
  };
}

function parseTransitionRecord(value: unknown): MissionTransitionRecord {
  const input = record(value);
  if (input == null) throw new RoadmapMissionError("transition record must be an object", 2);
  if (!Number.isSafeInteger(input.cursor) || (input.cursor as number) < 0) {
    throw new RoadmapMissionError("transition cursor must be a non-negative integer", 2);
  }
  const definition = {
    checkpoint: { mode: input.checkpoint != null && record(input.checkpoint)?.mode },
    slices: [{ id: input.sliceId }],
  } as RoadmapMissionDefinition;
  const descriptor = parseTransitionDescriptor({
    activeOperation: input.activeOperation,
    ...(input.blocker == null ? {} : { blocker: input.blocker }),
    checkpoint: input.checkpoint,
    createdAt: input.createdAt,
    cursor: 0,
    disposition: input.disposition,
    evidenceRefs: input.evidenceRefs,
    identities: input.identities,
    kind: input.kind,
    recovery: input.recovery,
    schemaVersion: input.schemaVersion,
    sliceId: input.sliceId,
  }, definition);
  const fields = [
    "schemaVersion",
    "kind",
    "createdAt",
    "cursor",
    "sliceId",
    "disposition",
    "activeOperation",
    "checkpoint",
    "evidenceRefs",
    "identities",
    "recovery",
    "missionId",
    "definitionDigest",
    "sequence",
    "previousTransitionDigest",
    "previousStateDigest",
    "transitionDigest",
    "resultingStateDigest",
  ];
  exactKeys(input, fields, "transition record", ["blocker"]);
  if (!Number.isSafeInteger(input.sequence) || (input.sequence as number) <= 0) {
    throw new RoadmapMissionError("transition sequence must be a positive integer", 2);
  }
  return {
    ...descriptor,
    cursor: input.cursor as number,
    definitionDigest: requiredString(input.definitionDigest, "definitionDigest", 64),
    missionId: requiredString(input.missionId, "missionId", 100),
    previousStateDigest: nullableString(input.previousStateDigest, "previousStateDigest", 64),
    previousTransitionDigest: nullableString(input.previousTransitionDigest, "previousTransitionDigest", 64),
    resultingStateDigest: requiredString(input.resultingStateDigest, "resultingStateDigest", 64),
    sequence: input.sequence as number,
    transitionDigest: requiredString(input.transitionDigest, "transitionDigest", 64),
  };
}

function schedulingFactsFromRecords(records: MissionTransitionRecord[]): MissionSchedulingFacts {
  const completed = new Set<string>();
  const parked = new Map<string, MissionParkedSlice>();
  for (const transition of records) {
    if (transition.kind === "checkpoint" && transition.sliceId != null) {
      completed.add(transition.sliceId);
      parked.delete(transition.sliceId);
    } else if (
      (transition.kind === "slice-blocked" || transition.kind === "session-completion") &&
      transition.sliceId != null &&
      transition.blocker != null
    ) {
      parked.set(transition.sliceId, {
        blocker: transition.blocker,
        cursor: transition.cursor,
        recovery: transition.recovery,
        transitionDigest: transition.transitionDigest,
      });
    } else if (transition.kind === "slice-resume" && transition.sliceId != null) {
      parked.delete(transition.sliceId);
    }
  }
  return {
    completedSliceIds: [...completed].sort(),
    parkedSlices: [...parked.values()].sort((left, right) => left.cursor - right.cursor),
  };
}

export function ownedPathsOverlap(left: string[], right: string[]): boolean {
  return left.some((leftPath) => right.some((rightPath) =>
    leftPath === rightPath || leftPath.startsWith(`${rightPath}/`) || rightPath.startsWith(`${leftPath}/`)
  ));
}

function validateTransitionProgression(
  definition: RoadmapMissionDefinition,
  records: MissionTransitionRecord[],
  previous: MissionStateProjection | null,
  descriptor: MissionTransitionDescriptor,
  location: string,
): void {
  if (previous == null) {
    if (descriptor.kind !== "preflight") throw new RoadmapMissionError("first mission transition must be preflight", 2);
    return;
  }
  const facts = schedulingFactsFromRecords(records);
  const completed = new Set(facts.completedSliceIds);
  const parked = new Map(facts.parkedSlices.map((entry) => [definition.slices[entry.cursor].id, entry]));
  const slice = definition.slices[descriptor.cursor];
  const moved = descriptor.cursor !== previous.cursor;
  if (moved && descriptor.kind !== "successor-activation" && descriptor.kind !== "slice-resume" && descriptor.kind !== "frontier-stop") {
    throw new RoadmapMissionError(`transition cursor changed without explicit activation at ${location}`, 2);
  }
  if (!moved && descriptor.kind === "successor-activation") {
    throw new RoadmapMissionError("successor activation must select another slice", 2);
  }
  if (descriptor.kind === "successor-activation") {
    const previousEffectiveRecord = [...records]
      .reverse()
      .find((recordValue) => recordValue.kind !== "restart-reconciliation" && recordValue.kind !== "pause" && recordValue.kind !== "frontier-stop") ?? null;
    if (
      previousEffectiveRecord?.kind !== "checkpoint" &&
      previousEffectiveRecord?.kind !== "slice-blocked" &&
      !(previousEffectiveRecord?.kind === "session-completion" && previousEffectiveRecord.blocker != null)
    ) {
      throw new RoadmapMissionError("successor activation requires a checkpoint or parked slice", 2);
    }
    if (completed.has(slice.id) || parked.has(slice.id) || !slice.dependsOn.every((dependency) => completed.has(dependency))) {
      throw new RoadmapMissionError("successor activation selected a dependency-ineligible slice", 2);
    }
    if (facts.parkedSlices.some((entry) => ownedPathsOverlap(slice.ownedPaths, definition.slices[entry.cursor].ownedPaths))) {
      throw new RoadmapMissionError("successor activation overlaps a parked slice", 2);
    }
    if (descriptor.recovery.attempts !== 0 || descriptor.recovery.sliceStartedAt != null) {
      throw new RoadmapMissionError("successor activation must reset recovery", 2);
    }
  } else if (descriptor.kind === "slice-resume") {
    const prior = parked.get(slice.id);
    if (
      prior == null ||
      descriptor.blocker == null ||
      stableJson(descriptor.blocker) !== stableJson(prior.blocker) ||
      descriptor.recovery.attempts !== prior.recovery.attempts ||
      !slice.dependsOn.every((dependency) => completed.has(dependency)) ||
      facts.parkedSlices.some((entry) => entry.cursor !== descriptor.cursor && ownedPathsOverlap(slice.ownedPaths, definition.slices[entry.cursor].ownedPaths))
    ) {
      throw new RoadmapMissionError("slice resume does not consume one eligible parked transition", 2);
    }
  } else if (descriptor.kind === "frontier-stop") {
    const prior = parked.get(slice.id);
    if (
      prior == null ||
      descriptor.blocker == null ||
      stableJson(descriptor.blocker) !== stableJson(prior.blocker) ||
      stableJson(descriptor.recovery) !== stableJson(prior.recovery)
    ) {
      throw new RoadmapMissionError("frontier stop does not identify an active parked slice", 2);
    }
  } else if (moved) {
    throw new RoadmapMissionError(`transition cursor is invalid at ${location}`, 2);
  } else if (
    descriptor.recovery.attempts < previous.recovery.attempts ||
    (previous.recovery.sliceStartedAt != null && descriptor.recovery.sliceStartedAt !== previous.recovery.sliceStartedAt)
  ) {
    throw new RoadmapMissionError(`transition recovery regressed at ${location}`, 2);
  }
  if (descriptor.kind === "slice-blocked" || (descriptor.kind === "session-completion" && descriptor.blocker != null)) {
    if (completed.has(slice.id) || parked.has(slice.id) || descriptor.activeOperation != null) {
      throw new RoadmapMissionError("slice-blocked transition must park one incomplete unparked slice", 2);
    }
  }
  if (descriptor.kind === "checkpoint" && parked.has(slice.id)) {
    throw new RoadmapMissionError("checkpoint cannot clear a parked slice without explicit resume", 2);
  }
  if (descriptor.kind === "restart-reconciliation" && (
    previous.activeOperation != null ||
    descriptor.activeOperation != null ||
    descriptor.disposition !== previous.disposition ||
    stableJson(descriptor.blocker ?? null) !== stableJson(previous.blocker ?? null) ||
    stableJson(descriptor.checkpoint) !== stableJson(previous.checkpoint) ||
    stableJson(descriptor.recovery) !== stableJson(previous.recovery)
  )) {
    throw new RoadmapMissionError("restart reconciliation changed prior state facts", 2);
  }
  if (descriptor.kind === "terminal-stop" && descriptor.disposition === "complete") {
    if (completed.size !== definition.slices.length) {
      throw new RoadmapMissionError("complete terminal stop requires every slice checkpoint", 2);
    }
  }
}

function readChain(root: string, definition: RoadmapMissionDefinition): Chain {
  const directory = stateRoot(root, definition.missionId);
  const transitions = path.join(directory, "transitions");
  if (!fs.existsSync(transitions)) return { projection: null, records: [] };
  if (!fs.lstatSync(transitions).isDirectory() || fs.lstatSync(transitions).isSymbolicLink()) {
    throw new RoadmapMissionError("transitions path is unsafe", 2);
  }
  const files = fs.readdirSync(transitions, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
    .map((entry) => entry.name)
    .sort();
  const records: MissionTransitionRecord[] = [];
  let previousProjection: MissionStateProjection | null = null;
  const expectedDefinitionDigest = missionDefinitionDigest(definition);
  for (const [index, file] of files.entries()) {
    const absolute = path.join(transitions, file);
    if (!regularFile(absolute)) throw new RoadmapMissionError(`transition is unsafe: ${file}`, 2);
    let transition: MissionTransitionRecord;
    try {
      transition = parseTransitionRecord(JSON.parse(fs.readFileSync(absolute, "utf8")));
    } catch (error) {
      if (error instanceof RoadmapMissionError) throw error;
      throw new RoadmapMissionError(`transition is unreadable: ${file}`, 2, { cause: error });
    }
    const expectedSequence = index + 1;
    if (transition.sequence !== expectedSequence || !file.startsWith(`${String(expectedSequence).padStart(8, "0")}-`)) {
      throw new RoadmapMissionError(`transition sequence is not contiguous at ${file}`, 2);
    }
    if (transition.missionId !== definition.missionId || transition.definitionDigest !== expectedDefinitionDigest) {
      throw new RoadmapMissionError(`transition identity differs at sequence ${expectedSequence}`, 2);
    }
    if (
      transition.cursor >= definition.slices.length ||
      (transition.sliceId != null && definition.slices[transition.cursor]?.id !== transition.sliceId) ||
      transition.checkpoint.mode !== definition.checkpoint.mode
    ) {
      throw new RoadmapMissionError(`transition mission facts differ at sequence ${expectedSequence}`, 2);
    }
    const previousTransitionDigest = records.at(-1)?.transitionDigest ?? null;
    const previousStateDigest = previousProjection == null ? null : digest(previousProjection);
    if (
      transition.previousTransitionDigest !== previousTransitionDigest ||
      transition.previousStateDigest !== previousStateDigest
    ) {
      throw new RoadmapMissionError(`transition prior-state correlation differs at sequence ${expectedSequence}`, 2);
    }
    const expectedTransitionDigest = digest(transitionUnsigned(transition));
    if (transition.transitionDigest !== expectedTransitionDigest || !file.includes(expectedTransitionDigest.slice(0, 16))) {
      throw new RoadmapMissionError(`transition digest differs at sequence ${expectedSequence}`, 2);
    }
    const projection = projectionFromRecord(transition);
    if (transition.resultingStateDigest !== digest(projection)) {
      throw new RoadmapMissionError(`transition resulting state differs at sequence ${expectedSequence}`, 2);
    }
    validateTransitionProgression(definition, records, previousProjection, transition, `sequence ${expectedSequence}`);
    records.push(transition);
    previousProjection = projection;
  }
  return { projection: previousProjection, records };
}

function projectionStatus(directory: string, projection: MissionStateProjection | null): "current" | "missing" | "stale" {
  const file = path.join(directory, "state.json");
  if (!fs.existsSync(file)) return "missing";
  if (!regularFile(file) || projection == null) return "stale";
  try {
    return stableJson(JSON.parse(fs.readFileSync(file, "utf8"))) === stableJson(projection) ? "current" : "stale";
  } catch {
    return "stale";
  }
}

function writerStatus(directory: string): MissionReplayReport["writerStatus"] {
  const file = path.join(directory, "writer.lock");
  if (!fs.existsSync(file)) return "clear";
  try {
    return pidStatus(readLease(file).pid);
  } catch {
    return "unknown";
  }
}

function appendTransition(
  root: string,
  definition: RoadmapMissionDefinition,
  descriptor: MissionTransitionDescriptor,
  lease: WriterLease,
): MissionTransitionRecord {
  const directory = stateRoot(root, definition.missionId);
  const lock = readLease(path.join(directory, "writer.lock"));
  if (stableJson(lock) !== stableJson(lease)) throw new RoadmapMissionError("writer lease ownership changed", 2);
  const chain = readChain(root, definition);
  const currentStatus = projectionStatus(directory, chain.projection);
  if (chain.records.length > 0 && currentStatus !== "current") {
    throw new RoadmapMissionError("state projection is not current; reconcile before appending", 1);
  }
  if (chain.records.length === 0 && currentStatus !== "missing") {
    throw new RoadmapMissionError("state projection exists without a transition chain", 2);
  }
  const previous = chain.projection;
  validateTransitionProgression(definition, chain.records, previous, descriptor, "append");
  if (previous != null) {
    const previousEffectiveKind = [...chain.records]
      .reverse()
      .find((recordValue) => recordValue.kind !== "restart-reconciliation" && recordValue.kind !== "pause" && recordValue.kind !== "frontier-stop")?.kind ?? null;
    if (descriptor.kind === "checkpoint" && previousEffectiveKind !== "archive") {
      throw new RoadmapMissionError("checkpoint transition requires the immediately prior archive transition", 2);
    }
    if (
      descriptor.kind === "archive" &&
      chain.records.some((recordValue) => recordValue.kind === "archive" && recordValue.cursor === descriptor.cursor)
    ) {
      throw new RoadmapMissionError("mission slice already has an archive transition", 2);
    }
    if (descriptor.kind === "restart-reconciliation") {
      if (previous.activeOperation != null) {
        throw new RoadmapMissionError("restart reconciliation cannot clear an active operation", 1);
      }
      if (
        descriptor.cursor !== previous.cursor ||
        descriptor.sliceId !== previous.sliceId ||
        descriptor.disposition !== previous.disposition ||
        descriptor.activeOperation != null ||
        stableJson(descriptor.blocker ?? null) !== stableJson(previous.blocker ?? null) ||
        stableJson(descriptor.checkpoint) !== stableJson(previous.checkpoint) ||
        stableJson(descriptor.recovery) !== stableJson(previous.recovery)
      ) {
        throw new RoadmapMissionError("restart reconciliation must preserve prior state facts", 2);
      }
    }
  }
  const sequence = chain.records.length + 1;
  const unsigned = {
    ...descriptor,
    definitionDigest: missionDefinitionDigest(definition),
    missionId: definition.missionId,
    previousStateDigest: previous == null ? null : digest(previous),
    previousTransitionDigest: previous?.lastTransitionDigest ?? null,
    sequence,
  };
  const transitionDigest = digest(unsigned);
  const projection: MissionStateProjection = {
    activeOperation: descriptor.activeOperation,
    ...(descriptor.blocker == null ? {} : { blocker: descriptor.blocker }),
    checkpoint: descriptor.checkpoint,
    createdAt: descriptor.createdAt,
    cursor: descriptor.cursor,
    definitionDigest: unsigned.definitionDigest,
    disposition: descriptor.disposition,
    evidenceRefs: descriptor.evidenceRefs,
    identities: descriptor.identities,
    lastTransitionDigest: transitionDigest,
    lastTransitionKind: descriptor.kind,
    missionId: definition.missionId,
    recovery: descriptor.recovery,
    schemaVersion: 1,
    sequence,
    sliceId: descriptor.sliceId,
  };
  const transition: MissionTransitionRecord = {
    ...unsigned,
    resultingStateDigest: digest(projection),
    transitionDigest,
  };
  const transitionDirectory = path.join(directory, "transitions");
  ensureDirectory(root, transitionDirectory);
  const file = path.join(
    transitionDirectory,
    `${String(sequence).padStart(8, "0")}-${transitionDigest.slice(0, 16)}.json`,
  );
  writeExclusiveDurable(file, stableJson(transition));
  writeProjectionAtomic(directory, projection);
  return transition;
}

export function withMissionWriterLease<T>(
  root: string,
  definition: RoadmapMissionDefinition,
  createdAt: string,
  action: (lease: WriterLease) => T,
): T {
  const lease = acquireWriterLease(root, definition, createdAt);
  try {
    return action(lease);
  } finally {
    releaseWriterLease(root, lease);
  }
}

function containedJson(root: string, relative: string, label: string): unknown {
  const normalized = safeRelative(relative, label);
  const file = path.resolve(root, normalized);
  assertContained(root, file);
  if (!regularFile(file)) throw new RoadmapMissionError(`${label} must be a regular non-symlink file`, 2);
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (error) {
    throw new RoadmapMissionError(`${label} must contain valid JSON`, 2, { cause: error });
  }
}

export function loadTransitionDescriptor(
  root: string,
  relative: string,
  definition: RoadmapMissionDefinition,
): MissionTransitionDescriptor {
  return parseTransitionDescriptor(containedJson(root, relative, "event file"), definition);
}

export function recordMissionTransition(
  root: string,
  missionPath: string,
  eventPath: string,
): MissionTransitionRecord {
  const definition = loadMissionDefinition(root, missionPath);
  const descriptor = loadTransitionDescriptor(root, eventPath, definition);
  return withMissionWriterLease(root, definition, descriptor.createdAt, (lease) =>
    appendTransition(root, definition, descriptor, lease)
  );
}

export function recordMissionTransitionDescriptor(
  root: string,
  definition: RoadmapMissionDefinition,
  descriptor: MissionTransitionDescriptor,
): MissionTransitionRecord {
  return withMissionWriterLease(root, definition, descriptor.createdAt, (lease) =>
    appendTransition(root, definition, descriptor, lease)
  );
}

export function recordMissionTransitionWithLease(
  root: string,
  definition: RoadmapMissionDefinition,
  descriptor: MissionTransitionDescriptor,
  lease: WriterLease,
): MissionTransitionRecord {
  return appendTransition(root, definition, descriptor, lease);
}

export function readMissionStateProjection(
  root: string,
  definition: RoadmapMissionDefinition,
): MissionStateProjection | null {
  const chain = readChain(root, definition);
  const directory = stateRoot(root, definition.missionId);
  const status = projectionStatus(directory, chain.projection);
  if (chain.records.length === 0 && status === "missing") return null;
  if (status !== "current") throw new RoadmapMissionError("state projection is not current", 1);
  return chain.projection;
}

export function readMissionSchedulingFacts(
  root: string,
  definition: RoadmapMissionDefinition,
): MissionSchedulingFacts {
  const chain = readChain(root, definition);
  const directory = stateRoot(root, definition.missionId);
  const status = projectionStatus(directory, chain.projection);
  if (chain.records.length > 0 && status !== "current") {
    throw new RoadmapMissionError("state projection is not current", 1);
  }
  if (chain.records.length === 0 && status !== "missing") {
    throw new RoadmapMissionError("state projection exists without a transition chain", 2);
  }
  return schedulingFactsFromRecords(chain.records);
}

export function selectMissionFrontierStop(facts: MissionSchedulingFacts): MissionParkedSlice | null {
  return facts.parkedSlices.find((entry) => entry.blocker.disposition === "product-decision-required")
    ?? facts.parkedSlices[0]
    ?? null;
}

export function readMissionResultFacts(
  root: string,
  definition: RoadmapMissionDefinition,
): MissionResultFacts {
  const chain = readChain(root, definition);
  const directory = stateRoot(root, definition.missionId);
  const status = projectionStatus(directory, chain.projection);
  if (chain.records.length > 0 && status !== "current") {
    throw new RoadmapMissionError("state projection is not current", 1);
  }
  if (chain.records.length === 0 && status !== "missing") {
    throw new RoadmapMissionError("state projection exists without a transition chain", 2);
  }
  const archiveRefs = [...new Set(chain.records
    .filter((transition) => transition.kind === "archive")
    .flatMap((transition) => transition.evidenceRefs)
    .filter((reference) => reference.startsWith("openspec/changes/archive/")))].sort();
  const evidenceRefs = [...new Set(chain.records.flatMap((transition) => transition.evidenceRefs))].sort();
  const processRefs = [...new Set(chain.records.flatMap((transition) => {
    const processRef = transition.activeOperation?.processRef;
    return processRef == null ? [] : [`${transition.sliceId ?? "mission"}:${processRef}`];
  }))].sort();
  const executorAttempts = chain.records.flatMap((transition) => {
    if (transition.kind !== "session-completion" || transition.sliceId == null || transition.recovery.attempts < 1) return [];
    const resultRef = `${definition.evidencePath}/${transition.sliceId}/attempt-${transition.recovery.attempts}/result.json`;
    return transition.evidenceRefs.includes(resultRef)
      ? [{ attempt: transition.recovery.attempts, resultRef, sliceId: transition.sliceId }]
      : [];
  });
  return {
    archiveRefs,
    evidenceRefs,
    executorAttempts,
    processRefs,
    projection: chain.projection,
  };
}

export function recordMissionUnknownPause(
  root: string,
  definition: RoadmapMissionDefinition,
): MissionTransitionRecord | null {
  const current = readMissionStateProjection(root, definition);
  if (current == null || current.disposition === "paused-unknown") return null;
  return withMissionWriterLease(root, definition, new Date().toISOString(), (lease) => appendTransition(root, definition, {
    activeOperation: current.activeOperation,
    checkpoint: current.checkpoint,
    createdAt: new Date().toISOString(),
    cursor: current.cursor,
    disposition: "paused-unknown",
    evidenceRefs: current.evidenceRefs,
    identities: current.identities,
    kind: "pause",
    recovery: current.recovery,
    schemaVersion: 1,
    sliceId: current.sliceId,
  }, lease));
}

export function reconcileMissionState(
  root: string,
  missionPath: string,
  eventPath: string,
): MissionTransitionRecord {
  const definition = loadMissionDefinition(root, missionPath);
  const descriptor = loadTransitionDescriptor(root, eventPath, definition);
  if (descriptor.kind !== "restart-reconciliation") {
    throw new RoadmapMissionError("state reconciliation requires kind=restart-reconciliation", 2);
  }
  return withMissionWriterLease(root, definition, descriptor.createdAt, (lease) => {
    const chain = readChain(root, definition);
    if (chain.projection == null) throw new RoadmapMissionError("cannot reconcile an empty transition chain", 2);
    const directory = stateRoot(root, definition.missionId);
    if (projectionStatus(directory, chain.projection) !== "current") {
      writeProjectionAtomic(directory, chain.projection);
    }
    const reconciledDescriptor = descriptor.blocker == null && chain.projection.blocker != null
      ? { ...descriptor, blocker: chain.projection.blocker }
      : descriptor;
    return appendTransition(root, definition, reconciledDescriptor, lease);
  });
}

export function replayMissionState(root: string, missionPath: string): MissionReplayReport {
  const definition = loadMissionDefinition(root, missionPath);
  const chain = readChain(root, definition);
  const directory = stateRoot(root, definition.missionId);
  const projection = projectionStatus(directory, chain.projection);
  const observedWriter = writerStatus(directory);
  const writer = chain.projection?.activeOperation != null && observedWriter === "clear"
    ? "unknown"
    : observedWriter;
  const stateValid = chain.records.length === 0 ? projection === "missing" : projection === "current";
  const writerValid = writer === "clear" || writer === "stale";
  const valid = stateValid && writerValid;
  return {
    definitionDigest: missionDefinitionDigest(definition),
    exitCode: valid ? 0 : 1,
    lastTransitionDigest: chain.projection?.lastTransitionDigest ?? null,
    missionId: definition.missionId,
    operation: "state-replay",
    projectionStatus: projection,
    schemaVersion: 1,
    sequence: chain.projection?.sequence ?? 0,
    stateDigest: chain.projection == null ? null : digest(chain.projection),
    status: valid ? "valid" : "blocked",
    tool: "roadmap-mission",
    transitionCount: chain.records.length,
    writerStatus: writer,
  };
}
