import crypto, { randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import { stableJson } from "../roadmap-mission/contracts.ts";
import type { WorkCampaignDefinition } from "./contracts.ts";
import { WorkCampaignError, campaignDigest } from "./contracts.ts";

type JsonRecord = Record<string, unknown>;

const transitionKinds = [
  "budget-revision",
  "checkpoint",
  "findings-freeze",
  "investigation-result",
  "mission-launch",
  "mission-terminal",
  "owner-required",
  "partition-complete",
  "partition-launch",
  "pause",
  "phase-complete",
  "phase-start",
  "preflight",
  "product-decision-required",
  "report-materialized",
  "restart-reconciliation",
  "rereview",
  "stop-requested",
  "terminal-complete",
  "verification",
  "waiting",
  "wave-admitted",
] as const;
const phases = ["complete", "discover", "inventory", "mission", "paused", "synthesize", "verify"] as const;
const dispositions = ["blocked", "complete", "owner-required", "paused-budget", "paused-external", "paused-stop", "paused-unknown", "product-decision-required", "ready", "running", "waiting"] as const;
const operationKinds = ["discover", "inventory", "investigation", "mission", "reconcile", "report", "synthesize", "verify"] as const;

export type CampaignTransitionKind = typeof transitionKinds[number];
export type CampaignPhase = typeof phases[number];
export type CampaignDisposition = typeof dispositions[number];

export type CampaignRuntimeIdentities = {
  kit: string;
  node: string;
  openCode: string;
  openSpec: string;
  repository: string;
};

export type CampaignBudgetState = {
  consumed: {
    evidenceBytes: number;
    modelCalls: number;
    processAttempts: number;
    wallClockSeconds: number;
    waves: number;
  };
  limits: WorkCampaignDefinition["budgets"];
  revision: number;
};

export type CampaignActiveOperation = {
  kind: typeof operationKinds[number];
  process: null | {
    executableDigest: string;
    pid: number;
    processRef: string;
    startedAt: string;
    status: "active" | "terminal" | "unknown";
  };
  session: null | {
    sessionRef: string;
    status: "active" | "terminal" | "unknown";
  };
  writer: {
    leaseRef: string | null;
    owner: "campaign" | "mission" | "none" | "semantic";
    status: "active" | "isolated" | "terminal" | "unknown";
  };
};

export type CampaignTransitionDescriptor = {
  activeOperation: CampaignActiveOperation | null;
  budget: CampaignBudgetState;
  createdAt: string;
  disposition: CampaignDisposition;
  eventId: string;
  evidenceRefs: string[];
  identities: CampaignRuntimeIdentities;
  kind: CampaignTransitionKind;
  missionRef: string | null;
  phase: CampaignPhase;
  schemaVersion: 1;
  stopRequested: boolean;
  waveId: string | null;
};

export type CampaignStateProjection = Omit<CampaignTransitionDescriptor, "eventId" | "kind"> & {
  campaignId: string;
  definitionDigest: string;
  lastEventId: string;
  lastTransitionDigest: string;
  lastTransitionKind: CampaignTransitionKind;
  sequence: number;
};

export type CampaignTransitionRecord = CampaignTransitionDescriptor & {
  campaignId: string;
  definitionDigest: string;
  previousStateDigest: string | null;
  previousTransitionDigest: string | null;
  resultingStateDigest: string;
  sequence: number;
  transitionDigest: string;
};

export type CampaignWriterLease = {
  campaignId: string;
  createdAt: string;
  definitionDigest: string;
  executableDigest: string;
  pid: number;
  processRef: string;
  schemaVersion: 1;
  token: string;
};

export type CampaignWriterAttestation = {
  campaignId: string;
  definitionDigest: string;
  evidenceRef: string;
  leaseToken: string;
  observedAt: string;
  schemaVersion: 1;
  status: "isolated" | "terminal";
};

export type CampaignStopIntent = {
  campaignId: string;
  definitionDigest: string;
  evidenceRef: string;
  requestedAt: string;
  schemaVersion: 1;
  source: "operator" | "signal" | "supervisor";
};

export type CampaignReplayReport = {
  campaignId: string;
  definitionDigest: string;
  exitCode: number;
  lastTransitionDigest: string | null;
  operation: "state-replay";
  projectionStatus: "current" | "missing" | "stale";
  schemaVersion: 1;
  sequence: number;
  stateDigest: string | null;
  status: "blocked" | "valid";
  stopIntent: "absent" | "current" | "unknown";
  tool: "work-campaign";
  transitionCount: number;
  writerStatus: "clear" | "unknown";
};

type Chain = {
  projection: CampaignStateProjection | null;
  records: CampaignTransitionRecord[];
};

function object(value: unknown, field: string): JsonRecord {
  if (value == null || typeof value !== "object" || Array.isArray(value)) {
    throw new WorkCampaignError(`${field} must be a JSON object`, 2, { field });
  }
  return value as JsonRecord;
}

function exactKeys(input: JsonRecord, expected: readonly string[], field: string): void {
  const missing = expected.filter((key) => !(key in input));
  const extras = Object.keys(input).filter((key) => !expected.includes(key)).sort();
  if (missing.length === 0 && extras.length === 0) return;
  const detail = [
    missing.length > 0 ? `missing=${missing.join(",")}` : null,
    extras.length > 0 ? `unsupported=${extras.join(",")}` : null,
  ].filter((value): value is string => value != null).join(" ");
  throw new WorkCampaignError(`${field} has invalid fields: ${detail}`, 2, { field });
}

function string(value: unknown, field: string, max = 500): string {
  if (typeof value !== "string" || value.trim() === "" || value.length > max || /[\r\n\0]/u.test(value)) {
    throw new WorkCampaignError(`${field} must be a non-empty single-line string of at most ${max} characters`, 2, { field });
  }
  return value.trim();
}

function typedRef(value: unknown, field: string): string {
  const parsed = string(value, field);
  if (!/^[a-z][a-z0-9-]*:(?:[A-Za-z0-9][A-Za-z0-9._/#-]*|\.[A-Za-z0-9][A-Za-z0-9._/#-]*)$/u.test(parsed)) {
    throw new WorkCampaignError(`${field} must be a typed reference`, 2, { field });
  }
  return parsed;
}

function safeId(value: unknown, field: string): string {
  const parsed = string(value, field, 100);
  if (!/^[a-z0-9][a-z0-9._-]*$/u.test(parsed) || parsed === "." || parsed === "..") {
    throw new WorkCampaignError(`${field} must be a safe lowercase identifier`, 2, { field });
  }
  return parsed;
}

function sha256(value: unknown, field: string): string {
  const parsed = string(value, field, 64);
  if (!/^[a-f0-9]{64}$/u.test(parsed)) throw new WorkCampaignError(`${field} must be a lowercase SHA-256 digest`, 2, { field });
  return parsed;
}

function timestamp(value: unknown, field: string): string {
  const parsed = string(value, field, 100);
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/u.test(parsed) || Number.isNaN(Date.parse(parsed))) {
    throw new WorkCampaignError(`${field} must be an ISO UTC timestamp`, 2, { field });
  }
  return parsed;
}

function integer(value: unknown, field: string, min = 0): number {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < min) {
    throw new WorkCampaignError(`${field} must be an integer of at least ${min}`, 2, { field });
  }
  return value;
}

function enumValue<T extends string>(value: unknown, field: string, values: readonly T[]): T {
  const parsed = string(value, field) as T;
  if (!values.includes(parsed)) throw new WorkCampaignError(`${field} is unsupported`, 2, { field });
  return parsed;
}

function references(value: unknown, field: string): string[] {
  if (!Array.isArray(value) || value.length > 1_000) throw new WorkCampaignError(`${field} must contain at most 1000 refs`, 2, { field });
  const parsed = value.map((item, index) => typedRef(item, `${field}[${index}]`));
  if (new Set(parsed).size !== parsed.length) throw new WorkCampaignError(`${field} must not contain duplicates`, 2, { field });
  return parsed.sort();
}

function parseIdentities(value: unknown): CampaignRuntimeIdentities {
  const input = object(value, "identities");
  const fields = ["kit", "node", "openCode", "openSpec", "repository"] as const;
  exactKeys(input, fields, "identities");
  return Object.fromEntries(fields.map((field) => [field, string(input[field], `identities.${field}`)])) as CampaignRuntimeIdentities;
}

function parseBudgetNumbers(value: unknown, field: string, min: number): WorkCampaignDefinition["budgets"] {
  const input = object(value, field);
  const fields = ["evidenceBytes", "modelCalls", "processAttempts", "wallClockSeconds", "waves"] as const;
  exactKeys(input, fields, field);
  return Object.fromEntries(fields.map((name) => [name, integer(input[name], `${field}.${name}`, min)])) as WorkCampaignDefinition["budgets"];
}

function parseBudget(value: unknown): CampaignBudgetState {
  const input = object(value, "budget");
  exactKeys(input, ["consumed", "limits", "revision"], "budget");
  return {
    consumed: parseBudgetNumbers(input.consumed, "budget.consumed", 0),
    limits: parseBudgetNumbers(input.limits, "budget.limits", 1),
    revision: integer(input.revision, "budget.revision", 0),
  };
}

function parseProcess(value: unknown): CampaignActiveOperation["process"] {
  if (value == null) return null;
  const input = object(value, "activeOperation.process");
  exactKeys(input, ["executableDigest", "pid", "processRef", "startedAt", "status"], "activeOperation.process");
  return {
    executableDigest: sha256(input.executableDigest, "activeOperation.process.executableDigest"),
    pid: integer(input.pid, "activeOperation.process.pid", 1),
    processRef: typedRef(input.processRef, "activeOperation.process.processRef"),
    startedAt: timestamp(input.startedAt, "activeOperation.process.startedAt"),
    status: enumValue(input.status, "activeOperation.process.status", ["active", "terminal", "unknown"] as const),
  };
}

function parseSession(value: unknown): CampaignActiveOperation["session"] {
  if (value == null) return null;
  const input = object(value, "activeOperation.session");
  exactKeys(input, ["sessionRef", "status"], "activeOperation.session");
  return {
    sessionRef: typedRef(input.sessionRef, "activeOperation.session.sessionRef"),
    status: enumValue(input.status, "activeOperation.session.status", ["active", "terminal", "unknown"] as const),
  };
}

function parseWriter(value: unknown): CampaignActiveOperation["writer"] {
  const input = object(value, "activeOperation.writer");
  exactKeys(input, ["leaseRef", "owner", "status"], "activeOperation.writer");
  const owner = enumValue(input.owner, "activeOperation.writer.owner", ["campaign", "mission", "none", "semantic"] as const);
  const status = enumValue(input.status, "activeOperation.writer.status", ["active", "isolated", "terminal", "unknown"] as const);
  const leaseRef = input.leaseRef == null ? null : typedRef(input.leaseRef, "activeOperation.writer.leaseRef");
  if ((owner === "none") !== (leaseRef == null)) {
    throw new WorkCampaignError("activeOperation.writer leaseRef must be null exactly for owner=none", 2, { field: "activeOperation.writer.leaseRef" });
  }
  return { leaseRef, owner, status };
}

function parseActiveOperation(value: unknown): CampaignActiveOperation | null {
  if (value == null) return null;
  const input = object(value, "activeOperation");
  exactKeys(input, ["kind", "process", "session", "writer"], "activeOperation");
  return {
    kind: enumValue(input.kind, "activeOperation.kind", operationKinds),
    process: parseProcess(input.process),
    session: parseSession(input.session),
    writer: parseWriter(input.writer),
  };
}

function parseCampaignTransitionDescriptor(value: unknown): CampaignTransitionDescriptor {
  const input = object(value, "campaign transition descriptor");
  exactKeys(input, ["activeOperation", "budget", "createdAt", "disposition", "eventId", "evidenceRefs", "identities", "kind", "missionRef", "phase", "schemaVersion", "stopRequested", "waveId"], "campaign transition descriptor");
  if (input.schemaVersion !== 1) throw new WorkCampaignError("campaign transition descriptor.schemaVersion must be 1", 2, { field: "schemaVersion" });
  if (typeof input.stopRequested !== "boolean") throw new WorkCampaignError("stopRequested must be boolean", 2, { field: "stopRequested" });
  return {
    activeOperation: parseActiveOperation(input.activeOperation),
    budget: parseBudget(input.budget),
    createdAt: timestamp(input.createdAt, "createdAt"),
    disposition: enumValue(input.disposition, "disposition", dispositions),
    eventId: safeId(input.eventId, "eventId"),
    evidenceRefs: references(input.evidenceRefs, "evidenceRefs"),
    identities: parseIdentities(input.identities),
    kind: enumValue(input.kind, "kind", transitionKinds),
    missionRef: input.missionRef == null ? null : typedRef(input.missionRef, "missionRef"),
    phase: enumValue(input.phase, "phase", phases),
    schemaVersion: 1,
    stopRequested: input.stopRequested,
    waveId: input.waveId == null ? null : safeId(input.waveId, "waveId"),
  };
}

function stateRoot(root: string, definition: WorkCampaignDefinition): string {
  return path.resolve(root, definition.statePath);
}

function assertContained(root: string, target: string): void {
  const relative = path.relative(path.resolve(root), target);
  if (relative.startsWith("..") || path.isAbsolute(relative)) throw new WorkCampaignError("campaign runtime path escapes project root", 2, { field: "statePath" });
}

function ensureDirectory(root: string, directory: string): void {
  assertContained(root, directory);
  const relative = path.relative(path.resolve(root), directory);
  let current = path.resolve(root);
  for (const part of relative.split(path.sep).filter(Boolean)) {
    current = path.join(current, part);
    if (!fs.existsSync(current)) fs.mkdirSync(current);
    const stat = fs.lstatSync(current);
    if (stat.isSymbolicLink() || !stat.isDirectory()) {
      throw new WorkCampaignError(`campaign runtime directory is unsafe: ${path.relative(root, current).replace(/\\/gu, "/")}`, 2, { field: "statePath" });
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

function writeProjectionAtomic(directory: string, projection: CampaignStateProjection): void {
  const target = path.join(directory, "state.json");
  if (fs.existsSync(target) && !regularFile(target)) throw new WorkCampaignError("state.json is not a regular non-symlink file", 2, { field: "state.json" });
  const temporary = path.join(directory, `.state.${process.pid}.${randomUUID()}.tmp`);
  try {
    writeExclusiveDurable(temporary, stableJson(projection));
    fs.renameSync(temporary, target);
  } finally {
    if (fs.existsSync(temporary)) fs.rmSync(temporary, { force: true });
  }
}

function parseLease(value: unknown): CampaignWriterLease {
  const input = object(value, "campaign writer lease");
  exactKeys(input, ["campaignId", "createdAt", "definitionDigest", "executableDigest", "pid", "processRef", "schemaVersion", "token"], "campaign writer lease");
  if (input.schemaVersion !== 1) throw new WorkCampaignError("campaign writer lease.schemaVersion must be 1", 2, { field: "schemaVersion" });
  return {
    campaignId: safeId(input.campaignId, "campaignId"),
    createdAt: timestamp(input.createdAt, "createdAt"),
    definitionDigest: sha256(input.definitionDigest, "definitionDigest"),
    executableDigest: sha256(input.executableDigest, "executableDigest"),
    pid: integer(input.pid, "pid", 1),
    processRef: typedRef(input.processRef, "processRef"),
    schemaVersion: 1,
    token: string(input.token, "token", 100),
  };
}

function readLease(file: string): CampaignWriterLease {
  if (!regularFile(file)) throw new WorkCampaignError("campaign writer lease is not a regular non-symlink file", 2, { field: "writer.lock" });
  try {
    return parseLease(JSON.parse(fs.readFileSync(file, "utf8")));
  } catch (error) {
    if (error instanceof WorkCampaignError) throw error;
    throw new WorkCampaignError("campaign writer lease is unreadable", 2, { cause: error, field: "writer.lock" });
  }
}

export function acquireCampaignWriterLease(
  root: string,
  definition: WorkCampaignDefinition,
  processIdentity: Pick<CampaignWriterLease, "createdAt" | "executableDigest" | "pid" | "processRef">,
): CampaignWriterLease {
  const directory = stateRoot(root, definition);
  ensureDirectory(root, directory);
  const lock = path.join(directory, "writer.lock");
  if (fs.existsSync(lock)) {
    readLease(lock);
    throw new WorkCampaignError("campaign writer lease state is unknown; terminal or isolated attestation is required", 1, { field: "writer.lock" });
  }
  const lease = parseLease({
    campaignId: definition.campaignId,
    createdAt: processIdentity.createdAt,
    definitionDigest: campaignDigest(definition),
    executableDigest: processIdentity.executableDigest,
    pid: processIdentity.pid,
    processRef: processIdentity.processRef,
    schemaVersion: 1,
    token: randomUUID(),
  });
  writeExclusiveDurable(lock, stableJson(lease));
  return lease;
}

export function releaseCampaignWriterLease(root: string, definition: WorkCampaignDefinition, lease: CampaignWriterLease): void {
  const lock = path.join(stateRoot(root, definition), "writer.lock");
  const current = readLease(lock);
  if (stableJson(current) !== stableJson(lease)) throw new WorkCampaignError("campaign writer lease changed before release", 2, { field: "writer.lock" });
  fs.unlinkSync(lock);
}

function parseCampaignWriterAttestation(value: unknown): CampaignWriterAttestation {
  const input = object(value, "campaign writer attestation");
  exactKeys(input, ["campaignId", "definitionDigest", "evidenceRef", "leaseToken", "observedAt", "schemaVersion", "status"], "campaign writer attestation");
  if (input.schemaVersion !== 1) throw new WorkCampaignError("campaign writer attestation.schemaVersion must be 1", 2, { field: "schemaVersion" });
  return {
    campaignId: safeId(input.campaignId, "campaignId"),
    definitionDigest: sha256(input.definitionDigest, "definitionDigest"),
    evidenceRef: typedRef(input.evidenceRef, "evidenceRef"),
    leaseToken: string(input.leaseToken, "leaseToken", 100),
    observedAt: timestamp(input.observedAt, "observedAt"),
    schemaVersion: 1,
    status: enumValue(input.status, "status", ["isolated", "terminal"] as const),
  };
}

function parseWriterLeaseArchive(value: unknown): { attestation: CampaignWriterAttestation; lease: CampaignWriterLease } {
  const input = object(value, "campaign writer lease archive");
  exactKeys(input, ["attestation", "lease"], "campaign writer lease archive");
  return {
    attestation: parseCampaignWriterAttestation(input.attestation),
    lease: parseLease(input.lease),
  };
}

function readWriterLeaseArchive(file: string): { attestation: CampaignWriterAttestation; lease: CampaignWriterLease } {
  if (!regularFile(file)) throw new WorkCampaignError("campaign writer lease archive is unsafe", 2, { field: "writer attestation" });
  try {
    return parseWriterLeaseArchive(JSON.parse(fs.readFileSync(file, "utf8")));
  } catch (error) {
    if (error instanceof WorkCampaignError) throw error;
    throw new WorkCampaignError("campaign writer lease archive is unreadable", 2, { cause: error, field: "writer attestation" });
  }
}

export function reconcileCampaignWriterLease(root: string, definition: WorkCampaignDefinition, attestation: CampaignWriterAttestation): string {
  const directory = stateRoot(root, definition);
  const lock = path.join(directory, "writer.lock");
  const archiveDirectory = path.join(directory, "leases");
  if (!fs.existsSync(lock)) {
    if (!fs.existsSync(archiveDirectory)) throw new WorkCampaignError("campaign writer lease does not exist", 2, { field: "writer.lock" });
    const archiveStat = fs.lstatSync(archiveDirectory);
    if (!archiveStat.isDirectory() || archiveStat.isSymbolicLink()) {
      throw new WorkCampaignError("campaign writer lease archive directory is unsafe", 2, { field: "writer attestation" });
    }
    const entries = fs.readdirSync(archiveDirectory, { withFileTypes: true });
    if (entries.some((entry) => !entry.isFile() || !entry.name.endsWith(".json"))) {
      throw new WorkCampaignError("campaign writer lease archive directory contains an unsupported entry", 2, { field: "writer attestation" });
    }
    const matches = entries.flatMap((entry) => {
      const archive = path.join(archiveDirectory, entry.name);
      const record = readWriterLeaseArchive(archive);
      return stableJson(record.attestation) === stableJson(attestation) ? [archive] : [];
    });
    if (matches.length !== 1) {
      throw new WorkCampaignError("campaign writer attestation has no unique archived lease", 2, { field: "writer attestation" });
    }
    return path.relative(root, matches[0]).replace(/\\/gu, "/");
  }
  const lease = readLease(lock);
  if (
    attestation.campaignId !== lease.campaignId
    || attestation.definitionDigest !== lease.definitionDigest
    || attestation.leaseToken !== lease.token
    || lease.campaignId !== definition.campaignId
    || lease.definitionDigest !== campaignDigest(definition)
  ) {
    throw new WorkCampaignError("campaign writer attestation does not match the current lease", 2, { field: "writer attestation" });
  }
  ensureDirectory(root, archiveDirectory);
  const archive = path.join(archiveDirectory, `${attestation.status}-${campaignDigest({ attestation, lease }).slice(0, 16)}.json`);
  const archived = { attestation, lease };
  if (fs.existsSync(archive)) {
    if (stableJson(readWriterLeaseArchive(archive)) !== stableJson(archived)) {
      throw new WorkCampaignError("campaign writer attestation archive differs", 2, { field: "writer attestation" });
    }
  } else {
    writeExclusiveDurable(archive, stableJson(archived));
  }
  if (stableJson(readLease(lock)) !== stableJson(lease)) {
    throw new WorkCampaignError("campaign writer lease changed during reconciliation", 2, { field: "writer.lock" });
  }
  fs.unlinkSync(lock);
  return path.relative(root, archive).replace(/\\/gu, "/");
}

function projectionFromRecord(value: Omit<CampaignTransitionRecord, "resultingStateDigest">): CampaignStateProjection {
  return {
    activeOperation: value.activeOperation,
    budget: value.budget,
    campaignId: value.campaignId,
    createdAt: value.createdAt,
    definitionDigest: value.definitionDigest,
    disposition: value.disposition,
    evidenceRefs: value.evidenceRefs,
    identities: value.identities,
    lastEventId: value.eventId,
    lastTransitionDigest: value.transitionDigest,
    lastTransitionKind: value.kind,
    missionRef: value.missionRef,
    phase: value.phase,
    schemaVersion: 1,
    sequence: value.sequence,
    stopRequested: value.stopRequested,
    waveId: value.waveId,
  };
}

function unsignedTransition(value: CampaignTransitionRecord): Omit<CampaignTransitionRecord, "resultingStateDigest" | "transitionDigest"> {
  const { resultingStateDigest: _state, transitionDigest: _transition, ...unsigned } = value;
  return unsigned;
}

function parseTransitionRecord(value: unknown): CampaignTransitionRecord {
  const input = object(value, "campaign transition record");
  exactKeys(input, [
    "activeOperation", "budget", "campaignId", "createdAt", "definitionDigest", "disposition", "eventId", "evidenceRefs", "identities", "kind", "missionRef", "phase", "previousStateDigest", "previousTransitionDigest", "resultingStateDigest", "schemaVersion", "sequence", "stopRequested", "transitionDigest", "waveId",
  ], "campaign transition record");
  const descriptor = parseCampaignTransitionDescriptor({
    activeOperation: input.activeOperation,
    budget: input.budget,
    createdAt: input.createdAt,
    disposition: input.disposition,
    eventId: input.eventId,
    evidenceRefs: input.evidenceRefs,
    identities: input.identities,
    kind: input.kind,
    missionRef: input.missionRef,
    phase: input.phase,
    schemaVersion: input.schemaVersion,
    stopRequested: input.stopRequested,
    waveId: input.waveId,
  });
  return {
    ...descriptor,
    campaignId: safeId(input.campaignId, "campaignId"),
    definitionDigest: sha256(input.definitionDigest, "definitionDigest"),
    previousStateDigest: input.previousStateDigest == null ? null : sha256(input.previousStateDigest, "previousStateDigest"),
    previousTransitionDigest: input.previousTransitionDigest == null ? null : sha256(input.previousTransitionDigest, "previousTransitionDigest"),
    resultingStateDigest: sha256(input.resultingStateDigest, "resultingStateDigest"),
    sequence: integer(input.sequence, "sequence", 1),
    transitionDigest: sha256(input.transitionDigest, "transitionDigest"),
  };
}

function readChain(root: string, definition: WorkCampaignDefinition): Chain {
  const directory = stateRoot(root, definition);
  const transitions = path.join(directory, "transitions");
  if (!fs.existsSync(transitions)) return { projection: null, records: [] };
  const transitionStat = fs.lstatSync(transitions);
  if (!transitionStat.isDirectory() || transitionStat.isSymbolicLink()) throw new WorkCampaignError("transitions path is unsafe", 2, { field: "transitions" });
  const files = fs.readdirSync(transitions, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
    .map((entry) => entry.name)
    .sort();
  const records: CampaignTransitionRecord[] = [];
  let previousProjection: CampaignStateProjection | null = null;
  for (const [index, file] of files.entries()) {
    const absolute = path.join(transitions, file);
    if (!regularFile(absolute)) throw new WorkCampaignError(`transition is unsafe: ${file}`, 2, { field: "transitions" });
    let transition: CampaignTransitionRecord;
    try {
      transition = parseTransitionRecord(JSON.parse(fs.readFileSync(absolute, "utf8")));
    } catch (error) {
      if (error instanceof WorkCampaignError) throw error;
      throw new WorkCampaignError(`transition is unreadable: ${file}`, 2, { cause: error, field: "transitions" });
    }
    const sequence = index + 1;
    if (transition.sequence !== sequence || !file.startsWith(`${String(sequence).padStart(8, "0")}-`)) {
      throw new WorkCampaignError(`transition sequence is not contiguous at ${file}`, 2, { field: "transitions" });
    }
    if (transition.campaignId !== definition.campaignId || transition.definitionDigest !== campaignDigest(definition)) {
      throw new WorkCampaignError(`transition identity differs at sequence ${sequence}`, 2, { field: "transitions" });
    }
    const previousTransitionDigest = records[records.length - 1]?.transitionDigest ?? null;
    const previousStateDigest = previousProjection == null ? null : campaignDigest(previousProjection);
    if (transition.previousTransitionDigest !== previousTransitionDigest || transition.previousStateDigest !== previousStateDigest) {
      throw new WorkCampaignError(`transition prior-state correlation differs at sequence ${sequence}`, 2, { field: "transitions" });
    }
    const expectedTransitionDigest = campaignDigest(unsignedTransition(transition));
    if (transition.transitionDigest !== expectedTransitionDigest || !file.includes(expectedTransitionDigest.slice(0, 16))) {
      throw new WorkCampaignError(`transition digest differs at sequence ${sequence}`, 2, { field: "transitions" });
    }
    const projection = projectionFromRecord(transition);
    if (transition.resultingStateDigest !== campaignDigest(projection)) {
      throw new WorkCampaignError(`transition resulting state differs at sequence ${sequence}`, 2, { field: "transitions" });
    }
    if (records.some((record) => record.eventId === transition.eventId)) {
      throw new WorkCampaignError(`transition eventId is duplicated at sequence ${sequence}`, 2, { field: "eventId" });
    }
    validateEvolution(definition, previousProjection, descriptorOf(transition));
    records.push(transition);
    previousProjection = projection;
  }
  return { projection: previousProjection, records };
}

function descriptorOf(value: CampaignTransitionRecord): CampaignTransitionDescriptor {
  const { campaignId: _campaign, definitionDigest: _definition, previousStateDigest: _previousState, previousTransitionDigest: _previousTransition, resultingStateDigest: _resulting, sequence: _sequence, transitionDigest: _transition, ...descriptor } = value;
  return descriptor;
}

function everyBudget(a: WorkCampaignDefinition["budgets"], predicate: (value: number, key: keyof WorkCampaignDefinition["budgets"]) => boolean): boolean {
  return (Object.keys(a) as Array<keyof WorkCampaignDefinition["budgets"]>).every((key) => predicate(a[key], key));
}

function validateEvolution(definition: WorkCampaignDefinition, previous: CampaignStateProjection | null, descriptor: CampaignTransitionDescriptor): void {
  const consumedWithinLimits = everyBudget(descriptor.budget.consumed, (value, key) => value <= descriptor.budget.limits[key]);
  if (!consumedWithinLimits) throw new WorkCampaignError("budget consumption exceeds its limit", 2, { field: "budget" });
  if (previous == null) {
    if (descriptor.kind !== "preflight" || descriptor.phase !== "inventory" || descriptor.disposition !== "ready" || descriptor.activeOperation != null || descriptor.stopRequested) {
      throw new WorkCampaignError("first campaign transition must be a ready inventory preflight", 2, { field: "kind" });
    }
    if (descriptor.budget.revision !== 0) throw new WorkCampaignError("initial budget revision must be 0", 2, { field: "budget.revision" });
    if (stableJson(descriptor.budget.limits) !== stableJson(definition.budgets)) {
      throw new WorkCampaignError("initial budget limits must match the campaign definition", 2, { field: "budget.limits" });
    }
    return;
  }
  if (previous.lastTransitionKind === "terminal-complete") {
    throw new WorkCampaignError("terminal-complete is the final campaign transition", 2, { field: "kind" });
  }
  if (!everyBudget(descriptor.budget.consumed, (value, key) => value >= previous.budget.consumed[key])) {
    throw new WorkCampaignError("budget consumption must not regress", 2, { field: "budget.consumed" });
  }
  if (Date.parse(descriptor.createdAt) < Date.parse(previous.createdAt)) {
    throw new WorkCampaignError("transition createdAt must not regress", 2, { field: "createdAt" });
  }
  if (descriptor.stopRequested === false && previous.stopRequested) {
    throw new WorkCampaignError("stopRequested must not clear", 2, { field: "stopRequested" });
  }
  if (descriptor.stopRequested !== previous.stopRequested && descriptor.kind !== "stop-requested") {
    throw new WorkCampaignError("only stop-requested may change stopRequested", 2, { field: "stopRequested" });
  }
  const limitsChanged = stableJson(descriptor.budget.limits) !== stableJson(previous.budget.limits);
  if (limitsChanged) {
    if (descriptor.kind !== "budget-revision" || descriptor.budget.revision !== previous.budget.revision + 1) {
      throw new WorkCampaignError("budget limits may change only in the next budget revision", 2, { field: "budget" });
    }
    if (!everyBudget(descriptor.budget.limits, (value, key) => value >= previous.budget.limits[key])) {
      throw new WorkCampaignError("budget revision must not lower limits", 2, { field: "budget.limits" });
    }
  } else if (descriptor.budget.revision !== previous.budget.revision) {
    throw new WorkCampaignError("budget revision changed without new limits", 2, { field: "budget.revision" });
  }
  if (descriptor.kind === "phase-start" && (descriptor.disposition !== "running" || descriptor.activeOperation == null)) {
    throw new WorkCampaignError("phase-start requires running disposition and an active operation", 2, { field: "phase-start" });
  }
  if (descriptor.kind === "phase-complete" && descriptor.activeOperation != null) {
    throw new WorkCampaignError("phase-complete requires no active operation", 2, { field: "phase-complete" });
  }
  if (descriptor.kind === "pause" && (descriptor.phase !== "paused" || !descriptor.disposition.startsWith("paused-"))) {
    throw new WorkCampaignError("pause requires paused phase and disposition", 2, { field: "pause" });
  }
  if ((descriptor.kind === "product-decision-required" || descriptor.kind === "waiting")
    && (descriptor.phase !== "paused" || descriptor.disposition !== descriptor.kind || descriptor.activeOperation != null)) {
    throw new WorkCampaignError(`${descriptor.kind} requires matching paused disposition and no active operation`, 2, { field: descriptor.kind });
  }
  if (descriptor.kind === "stop-requested" && !descriptor.stopRequested) {
    throw new WorkCampaignError("stop-requested requires stopRequested=true", 2, { field: "stopRequested" });
  }
  if (descriptor.kind === "restart-reconciliation") {
    const preserved = {
      activeOperation: descriptor.activeOperation,
      budget: descriptor.budget,
      disposition: descriptor.disposition,
      missionRef: descriptor.missionRef,
      phase: descriptor.phase,
      stopRequested: descriptor.stopRequested,
      waveId: descriptor.waveId,
    };
    const prior = {
      activeOperation: previous.activeOperation,
      budget: previous.budget,
      disposition: previous.disposition,
      missionRef: previous.missionRef,
      phase: previous.phase,
      stopRequested: previous.stopRequested,
      waveId: previous.waveId,
    };
    if (stableJson(preserved) !== stableJson(prior)) {
      throw new WorkCampaignError("restart reconciliation must preserve prior state facts", 2, { field: "restart-reconciliation" });
    }
  }
  if (descriptor.kind === "terminal-complete" && (descriptor.phase !== "complete" || descriptor.disposition !== "complete" || descriptor.activeOperation != null)) {
    throw new WorkCampaignError("terminal-complete requires complete phase/disposition and no active operation", 2, { field: "terminal-complete" });
  }
}

function projectionStatus(directory: string, projection: CampaignStateProjection | null): CampaignReplayReport["projectionStatus"] {
  const file = path.join(directory, "state.json");
  if (!fs.existsSync(file)) return "missing";
  if (!regularFile(file) || projection == null) return "stale";
  try {
    return stableJson(JSON.parse(fs.readFileSync(file, "utf8"))) === stableJson(projection) ? "current" : "stale";
  } catch {
    return "stale";
  }
}

function writerStatus(directory: string): CampaignReplayReport["writerStatus"] {
  const file = path.join(directory, "writer.lock");
  return fs.existsSync(file) ? "unknown" : "clear";
}

function appendTransition(root: string, definition: WorkCampaignDefinition, descriptor: CampaignTransitionDescriptor, lease: CampaignWriterLease): CampaignTransitionRecord {
  const directory = stateRoot(root, definition);
  const currentLease = readLease(path.join(directory, "writer.lock"));
  if (stableJson(currentLease) !== stableJson(lease)) throw new WorkCampaignError("campaign writer lease ownership changed", 2, { field: "writer.lock" });
  const chain = readChain(root, definition);
  const currentProjectionStatus = projectionStatus(directory, chain.projection);
  if (chain.records.length > 0 && currentProjectionStatus !== "current") {
    throw new WorkCampaignError("state projection is not current; reconcile before appending", 1, { field: "state.json" });
  }
  if (chain.records.length === 0 && currentProjectionStatus !== "missing") {
    throw new WorkCampaignError("state projection exists without a transition chain", 2, { field: "state.json" });
  }
  const duplicate = chain.records.find((record) => record.eventId === descriptor.eventId);
  if (duplicate != null) {
    if (stableJson(descriptorOf(duplicate)) !== stableJson(descriptor)) {
      throw new WorkCampaignError("eventId already exists with different transition facts", 2, { field: "eventId" });
    }
    return duplicate;
  }
  validateEvolution(definition, chain.projection, descriptor);
  const sequence = chain.records.length + 1;
  const unsigned = {
    ...descriptor,
    campaignId: definition.campaignId,
    definitionDigest: campaignDigest(definition),
    previousStateDigest: chain.projection == null ? null : campaignDigest(chain.projection),
    previousTransitionDigest: chain.projection?.lastTransitionDigest ?? null,
    sequence,
  };
  const transitionDigest = campaignDigest(unsigned);
  const transitionBase = { ...unsigned, transitionDigest };
  const projection = projectionFromRecord(transitionBase);
  const transition: CampaignTransitionRecord = {
    ...transitionBase,
    resultingStateDigest: campaignDigest(projection),
  };
  const transitionDirectory = path.join(directory, "transitions");
  ensureDirectory(root, transitionDirectory);
  const file = path.join(transitionDirectory, `${String(sequence).padStart(8, "0")}-${transitionDigest.slice(0, 16)}.json`);
  writeExclusiveDurable(file, stableJson(transition));
  writeProjectionAtomic(directory, projection);
  return transition;
}

function executableDigest(): string {
  try {
    return crypto.createHash("sha256").update(fs.readFileSync(process.execPath)).digest("hex");
  } catch (error) {
    throw new WorkCampaignError("current executable identity is unreadable", 2, { cause: error, field: "executable" });
  }
}

export function recordCampaignTransition(root: string, definition: WorkCampaignDefinition, descriptor: CampaignTransitionDescriptor): CampaignTransitionRecord {
  const lease = acquireCampaignWriterLease(root, definition, {
    createdAt: descriptor.createdAt,
    executableDigest: executableDigest(),
    pid: process.pid,
    processRef: `process:work-campaign-${process.pid}`,
  });
  try {
    return appendTransition(root, definition, descriptor, lease);
  } finally {
    releaseCampaignWriterLease(root, definition, lease);
  }
}

export function recordCampaignTransitionWithLease(
  root: string,
  definition: WorkCampaignDefinition,
  descriptor: CampaignTransitionDescriptor,
  lease: CampaignWriterLease,
): CampaignTransitionRecord {
  return appendTransition(root, definition, descriptor, lease);
}

function parseStopIntent(value: unknown, definition: WorkCampaignDefinition): CampaignStopIntent {
  const input = object(value, "campaign stop intent");
  exactKeys(input, ["campaignId", "definitionDigest", "evidenceRef", "requestedAt", "schemaVersion", "source"], "campaign stop intent");
  if (input.schemaVersion !== 1 || input.campaignId !== definition.campaignId || input.definitionDigest !== campaignDigest(definition)) {
    throw new WorkCampaignError("campaign stop intent identity is invalid", 2, { field: "stop intent" });
  }
  return {
    campaignId: definition.campaignId,
    definitionDigest: campaignDigest(definition),
    evidenceRef: typedRef(input.evidenceRef, "evidenceRef"),
    requestedAt: timestamp(input.requestedAt, "requestedAt"),
    schemaVersion: 1,
    source: enumValue(input.source, "source", ["operator", "signal", "supervisor"] as const),
  };
}

function readCampaignStopIntent(root: string, definition: WorkCampaignDefinition): CampaignStopIntent | null {
  const file = path.join(stateRoot(root, definition), "stop-intent.json");
  if (!fs.existsSync(file)) return null;
  if (!regularFile(file)) throw new WorkCampaignError("campaign stop intent is unsafe", 2, { field: "stop-intent.json" });
  try {
    return parseStopIntent(JSON.parse(fs.readFileSync(file, "utf8")), definition);
  } catch (error) {
    if (error instanceof WorkCampaignError) throw error;
    throw new WorkCampaignError("campaign stop intent is unreadable", 2, { cause: error, field: "stop-intent.json" });
  }
}

export function recordCampaignStopIntent(
  root: string,
  definition: WorkCampaignDefinition,
  input: Pick<CampaignStopIntent, "evidenceRef" | "source"> & { requestedAt?: string },
): CampaignStopIntent {
  const directory = stateRoot(root, definition);
  ensureDirectory(root, directory);
  const existing = readCampaignStopIntent(root, definition);
  if (existing != null) {
    if (existing.evidenceRef !== input.evidenceRef || existing.source !== input.source) {
      throw new WorkCampaignError("campaign stop intent already exists with different facts", 2, { field: "stop intent" });
    }
    return existing;
  }
  const intent = parseStopIntent({
    campaignId: definition.campaignId,
    definitionDigest: campaignDigest(definition),
    evidenceRef: input.evidenceRef,
    requestedAt: input.requestedAt ?? new Date().toISOString(),
    schemaVersion: 1,
    source: input.source,
  }, definition);
  writeExclusiveDurable(path.join(directory, "stop-intent.json"), stableJson(intent));
  return intent;
}

function stopIntentStatus(root: string, definition: WorkCampaignDefinition): CampaignReplayReport["stopIntent"] {
  try {
    return readCampaignStopIntent(root, definition) == null ? "absent" : "current";
  } catch {
    return "unknown";
  }
}

export function replayCampaignState(root: string, definition: WorkCampaignDefinition): CampaignReplayReport {
  const chain = readChain(root, definition);
  const directory = stateRoot(root, definition);
  const projection = projectionStatus(directory, chain.projection);
  const writer = writerStatus(directory);
  const stop = stopIntentStatus(root, definition);
  const valid = chain.records.length > 0 && projection === "current" && writer === "clear" && stop !== "unknown";
  return {
    campaignId: definition.campaignId,
    definitionDigest: campaignDigest(definition),
    exitCode: valid ? 0 : 1,
    lastTransitionDigest: chain.projection?.lastTransitionDigest ?? null,
    operation: "state-replay",
    projectionStatus: projection,
    schemaVersion: 1,
    sequence: chain.projection?.sequence ?? 0,
    stateDigest: chain.projection == null ? null : campaignDigest(chain.projection),
    status: valid ? "valid" : "blocked",
    stopIntent: stop,
    tool: "work-campaign",
    transitionCount: chain.records.length,
    writerStatus: writer,
  };
}

export function readCampaignStateProjection(root: string, definition: WorkCampaignDefinition): CampaignStateProjection | null {
  return readChain(root, definition).projection;
}

export function reconcileCampaignState(
  root: string,
  definition: WorkCampaignDefinition,
  descriptor: CampaignTransitionDescriptor,
): CampaignTransitionRecord {
  if (descriptor.kind !== "restart-reconciliation") {
    throw new WorkCampaignError("state reconciliation requires kind=restart-reconciliation", 2, { field: "kind" });
  }
  const directory = stateRoot(root, definition);
  if (writerStatus(directory) !== "clear") throw new WorkCampaignError("campaign writer state is unknown", 1, { field: "writer.lock" });
  const lease = acquireCampaignWriterLease(root, definition, {
    createdAt: descriptor.createdAt,
    executableDigest: executableDigest(),
    pid: process.pid,
    processRef: `process:work-campaign-${process.pid}`,
  });
  try {
    const chain = readChain(root, definition);
    if (chain.projection == null) throw new WorkCampaignError("campaign transition chain is empty", 1, { field: "transitions" });
    if (projectionStatus(directory, chain.projection) !== "current") writeProjectionAtomic(directory, chain.projection);
    return appendTransition(root, definition, descriptor, lease);
  } finally {
    releaseCampaignWriterLease(root, definition, lease);
  }
}

function containedJson(root: string, relative: string, field: string): unknown {
  if (relative.includes("\\") || path.posix.isAbsolute(relative) || path.win32.isAbsolute(relative) || relative.split("/").some((part) => part === "" || part === "." || part === "..")) {
    throw new WorkCampaignError(`${field} must be a contained project-relative path`, 2, { field });
  }
  const file = path.resolve(root, relative);
  assertContained(root, file);
  if (!regularFile(file)) throw new WorkCampaignError(`${field} must be a regular non-symlink file`, 2, { field });
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (error) {
    throw new WorkCampaignError(`${field} must contain valid JSON`, 2, { cause: error, field });
  }
}

export function loadCampaignTransitionDescriptor(root: string, relative: string): CampaignTransitionDescriptor {
  return parseCampaignTransitionDescriptor(containedJson(root, relative, "transitionPath"));
}

export function loadCampaignWriterAttestation(root: string, relative: string): CampaignWriterAttestation {
  return parseCampaignWriterAttestation(containedJson(root, relative, "attestationPath"));
}
