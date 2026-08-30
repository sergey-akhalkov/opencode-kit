import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { sanitizeMemoryText, canonicalProjectRoot, resolveOpenCodeDataRoot, type ProjectMemoryRootInput } from "../project-memory/store.ts";

export const KAIZEN_SCHEMA_VERSION = 1;
export const KAIZEN_SIGNAL_LIMIT = 2_000;
export const KAIZEN_LIFECYCLE_LIMIT = 8_000;
export const KAIZEN_SIGNAL_BYTES = 16 * 1024;
export const KAIZEN_LIFECYCLE_BYTES = 4 * 1024;
export const KAIZEN_STATUS_LIMIT = 100;

const SIGNAL_PATTERN = /^signal-(\d{4})\.json$/;
const EVENT_PATTERN = /^event-(\d{6})\.json$/;
const SAFE_REF = /^[A-Za-z0-9][A-Za-z0-9._:/-]{0,159}$/;
const SAFE_CODE = /^[a-z][a-z0-9-]{1,63}$/;

export type KaizenKind = "friction" | "repetition" | "waste" | "failure-pattern" | "process-gap" | "tooling-gap";
export type KaizenSource = "explicit" | "compaction" | "archive" | "legacy-feedback";
export type KaizenStatus = "pending" | "triaged" | "promoted" | "resolved" | "wont-fix";
export type KaizenScopeHint = "current-project" | "opencode-kit" | "external" | "unknown";
export type KaizenDecisionKind = "duplicate" | "local-memory" | "project-change" | "kit-candidate" | "external-owner" | "needs-investigation" | "no-action" | "owner-blocked" | "resolved";
export type KaizenOwnerClass = "current-project" | "opencode-kit" | "external" | "unknown";
export type KaizenCheckpointStatus = "harvest-pending" | "captured" | "no-signal" | "archive-failed";
export type KaizenEnvironment = Record<string, string | undefined>;

export type KaizenRootInput = Omit<ProjectMemoryRootInput, "environment"> & {
  environment?: KaizenEnvironment;
};

export type KaizenStore = {
  canonicalRoot: string;
  dataRoot: string;
  projectRef: string;
  storeRoot: string;
};

export type KaizenSignalInput = {
  kind: KaizenKind;
  summary: string;
  observedEvidence: string;
  impact: string;
  likelyCause: string;
  doNotRepeat: string;
  scopeHint: KaizenScopeHint;
  evidenceRefs: string[];
};

export type KaizenCaptureContext = {
  sessionRef: string;
  sourceEventRef?: string;
};

export type KaizenSignal = {
  schemaVersion: 1;
  signalRef: string;
  dedupFingerprint: string;
  kind: KaizenKind;
  summary: string;
  observedEvidence: string;
  impact: string;
  likelyCause: string;
  doNotRepeat: string;
  scopeHint: KaizenScopeHint;
  evidenceRefs: string[];
  projectRef: string;
  projectRefs: string[];
  sessionRef: string;
  sessionRefs: string[];
  sources: KaizenSource[];
  status: KaizenStatus;
  occurrenceCount: number;
  createdAt: string;
  lastSeenAt: string;
  decision: KaizenDecision | null;
};

export type KaizenDecisionInput = {
  signalRef: string;
  decision: KaizenDecisionKind;
  evidenceRefs: string[];
  ownerClass: KaizenOwnerClass;
  nextBoundaryOrTerminalReason: string;
};

export type KaizenDecision = KaizenDecisionInput & {
  schemaVersion: 1;
  decisionRef: string;
  projectRef: string;
  sessionRef: string;
  createdAt: string;
};

export type KaizenCheckpointInput = {
  changeRef: string;
  checkpointRef?: string;
  status: KaizenCheckpointStatus;
  signalRefs?: string[];
};

export type KaizenCheckpoint = {
  schemaVersion: 1;
  checkpointRef: string;
  changeRef: string;
  status: KaizenCheckpointStatus;
  signalRefs: string[];
  projectRef: string;
  sessionRef: string;
  createdAt: string;
};

export type KaizenDiagnostic = {
  code: string;
  createdAt: string;
  diagnosticRef: string;
  projectRef: string;
  source: KaizenSource;
};

export type KaizenObservation = {
  createdAt: string;
  observationRef: string;
  outcome: "no-signal";
  projectRef: string;
  sessionRef: string;
  source: "compaction";
};

export type KaizenInbox = {
  schemaVersion: 1;
  counts: Record<KaizenStatus, number> & {
    checkpoints: number;
    decisions: number;
    diagnostics: number;
    events: number;
    lifecycleEvents: number;
    observations: number;
    signalRecords: number;
    signals: number;
  };
  capacity: {
    lifecycleBytes: number;
    lifecycleLimit: number;
    lifecycleUsed: number;
    signalBytes: number;
    signalLimit: number;
    signalUsed: number;
  };
  checkpoints: KaizenCheckpoint[];
  decisions: KaizenDecision[];
  diagnostics: KaizenDiagnostic[];
  observations: KaizenObservation[];
  signals: KaizenSignal[];
  totalSignals: number;
  truncation: {
    checkpoints: boolean;
    decisions: boolean;
    diagnostics: boolean;
    observations: boolean;
    signals: boolean;
  };
  truncated: boolean;
};

export type KaizenCaptureResult = {
  schemaVersion: 1;
  action: "captured" | "deduplicated";
  signalRef: string;
  projectRef: string;
  sessionRef: string;
  source: KaizenSource;
  status: KaizenStatus;
  occurrenceCount: number;
};

type CaptureRecord = {
  schemaVersion: 1;
  event: "capture";
  eventRef: string;
  signalRef: string;
  sourceEventRef: string;
  dedupFingerprint: string;
  source: KaizenSource;
  projectRef: string;
  sessionRef: string;
  kind: KaizenKind;
  summary: string;
  observedEvidence: string;
  impact: string;
  likelyCause: string;
  doNotRepeat: string;
  scopeHint: KaizenScopeHint;
  evidenceRefs: string[];
  createdAt: string;
};

type TransitionRecord = {
  schemaVersion: 1;
  event: "transition";
  eventRef: string;
  signalRef: string;
  projectRef: string;
  status: Exclude<KaizenStatus, "pending">;
  note: string | null;
  createdAt: string;
};

type DiagnosticRecord = {
  schemaVersion: 1;
  event: "diagnostic";
  eventRef: string;
  diagnosticRef: string;
  sourceEventRef: string;
  source: KaizenSource;
  projectRef: string;
  code: string;
  createdAt: string;
};

type ObservationRecord = {
  schemaVersion: 1;
  event: "observation";
  eventRef: string;
  observationRef: string;
  sourceEventRef: string;
  source: "compaction";
  outcome: "no-signal";
  projectRef: string;
  sessionRef: string;
  createdAt: string;
};

type DecisionRecord = {
  schemaVersion: 1;
  event: "decision";
  eventRef: string;
  decisionRef: string;
  sourceEventRef: string;
  signalRef: string;
  decision: KaizenDecisionKind;
  evidenceRefs: string[];
  ownerClass: KaizenOwnerClass;
  nextBoundaryOrTerminalReason: string;
  projectRef: string;
  sessionRef: string;
  createdAt: string;
};

type CheckpointRecord = {
  schemaVersion: 1;
  event: "checkpoint";
  eventRef: string;
  sourceEventRef: string;
  checkpointRef: string;
  changeRef: string;
  status: KaizenCheckpointStatus;
  signalRefs: string[];
  projectRef: string;
  sessionRef: string;
  createdAt: string;
};

type LifecycleRecord = TransitionRecord | DiagnosticRecord | ObservationRecord | DecisionRecord | CheckpointRecord;

type KaizenRecords = {
  lifecycle: LifecycleRecord[];
  signals: CaptureRecord[];
};

export class KaizenError extends Error {
  readonly code: string;

  constructor(code: string, message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "KaizenError";
    this.code = code;
  }
}

function errorCode(error: unknown): string | null {
  return error != null && typeof error === "object" && typeof (error as { code?: unknown }).code === "string"
    ? (error as { code: string }).code
    : null;
}

function sha256(value: string | Buffer): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function randomRef(prefix: "event"): string {
  return `${prefix}_${crypto.randomBytes(16).toString("hex")}`;
}

function stableEventRef(kind: "capture" | "diagnostic" | "observation" | "decision" | "checkpoint", identity: string): string {
  return `event_${sha256(`${kind}\0${identity}`).slice(0, 32)}`;
}

function exactKeys(value: Record<string, unknown>, expected: string[], field: string): void {
  const actual = Object.keys(value).sort();
  const wanted = [...expected].sort();
  if (actual.length !== wanted.length || actual.some((key, index) => key !== wanted[index])) {
    throw new KaizenError("malformed-record", `${field} has an invalid key set.`);
  }
}

function record(value: unknown, field: string): Record<string, unknown> {
  if (value == null || typeof value !== "object" || Array.isArray(value)) throw new KaizenError("invalid-field", `${field} must be an object.`);
  return value as Record<string, unknown>;
}

function text(value: unknown, field: string, maximumBytes: number, allowEmpty = false): string {
  if (typeof value !== "string") throw new KaizenError("invalid-field", `${field} must be a string.`);
  const trimmed = value.trim();
  if (!allowEmpty && trimmed === "") throw new KaizenError("invalid-field", `${field} must not be empty.`);
  if (Buffer.byteLength(trimmed, "utf8") > maximumBytes) throw new KaizenError("record-too-large", `${field} exceeds its byte limit.`);
  return trimmed;
}

function optionalText(value: unknown, field: string, maximumBytes: number): string | null {
  return value == null ? null : text(value, field, maximumBytes);
}

function enumValue<T extends string>(value: unknown, field: string, allowed: readonly T[]): T {
  if (typeof value !== "string" || !allowed.includes(value as T)) throw new KaizenError("invalid-field", `${field} is invalid.`);
  return value as T;
}

function isoTime(value: unknown, field: string): string {
  const parsed = text(value, field, 64);
  const date = new Date(parsed);
  if (!Number.isFinite(date.valueOf()) || date.toISOString() !== parsed) throw new KaizenError("invalid-field", `${field} must be canonical ISO-8601.`);
  return parsed;
}

function safeRef(value: unknown, field: string): string {
  const parsed = text(value, field, 160);
  if (!SAFE_REF.test(parsed) || parsed.includes("..") || /^[A-Za-z]:[\\/]/u.test(parsed) || parsed.startsWith("/")) {
    throw new KaizenError("unsafe-reference", `${field} must be an opaque bounded reference.`);
  }
  return parsed;
}

function refList(value: unknown, field: string): string[] {
  if (!Array.isArray(value) || value.length < 1 || value.length > 8) throw new KaizenError("invalid-field", `${field} must contain one to eight repository-relative references.`);
  return [...new Set(value.map((item, index) => {
    const parsed = text(item, `${field}.${index}`, 160);
    if (path.isAbsolute(parsed) || parsed.includes("\\") || parsed.split("/").some((part) => part === "" || part === "." || part === "..")
      || !/^[A-Za-z0-9._-]+(?:\/[A-Za-z0-9._-]+)*$/u.test(parsed)) {
      throw new KaizenError("unsafe-reference", `${field}.${index} must be a repository-relative reference.`);
    }
    return parsed;
  }))];
}

function signalRefList(value: unknown, field: string): string[] {
  if (!Array.isArray(value) || value.length > 3) throw new KaizenError("invalid-field", `${field} must contain at most three signal refs.`);
  return [...new Set(value.map((item, index) => {
    const parsed = safeRef(item, `${field}.${index}`);
    if (!/^signal_[a-f0-9]{32}$/u.test(parsed)) throw new KaizenError("unsafe-reference", `${field}.${index} must be a privacy-safe signal ref.`);
    return parsed;
  }))];
}

function changeRef(value: unknown): string {
  const parsed = safeRef(value, "changeRef");
  if (!/^[a-z0-9][a-z0-9._-]{1,119}$/u.test(parsed)) throw new KaizenError("unsafe-reference", "changeRef must be a bounded OpenSpec change ref.");
  return parsed;
}

function sanitize(value: unknown, field: string, maximumBytes: number, store: KaizenStore): string {
  const sanitized = sanitizeMemoryText(text(value, field, maximumBytes), store.canonicalRoot);
  if (/(?:^|\s)[A-Za-z]:[\\/]|(?:^|\s)\/(?:Users|home|tmp)\//u.test(sanitized)) {
    throw new KaizenError("privacy", `${field} contains an absolute private path after redaction.`);
  }
  return sanitized;
}

function sanitizeOptional(value: unknown, field: string, maximumBytes: number, store: KaizenStore): string | null {
  return value == null ? null : sanitize(value, field, maximumBytes, store);
}

function signalFingerprint(kind: KaizenKind, summary: string): string {
  const normalized = summary.toLowerCase().replace(/\s+/gu, " ").trim();
  return sha256(`${kind}\0${normalized}`);
}

function signalRef(fingerprint: string): string {
  return `signal_${fingerprint.slice(0, 32)}`;
}

function nowIso(now?: Date): string {
  const value = now ?? new Date();
  if (!Number.isFinite(value.valueOf())) throw new KaizenError("invalid-time", "Kaizen event time is invalid.");
  return value.toISOString();
}

export function resolveKaizenStore(input: KaizenRootInput): KaizenStore | null {
  const environment = input.environment ?? process.env;
  if (environment.OPENCODE_KAIZEN === "0") return null;
  const canonicalRoot = canonicalProjectRoot({ ...input, environment });
  if (canonicalRoot == null) return null;
  const dataRoot = path.join(resolveOpenCodeDataRoot({ ...input, environment }), "kaizen", "v1");
  return {
    canonicalRoot,
    dataRoot,
    projectRef: `project_${sha256(canonicalRoot).slice(0, 32)}`,
    storeRoot: path.join(dataRoot, "inbox"),
  };
}

function sessionRef(value: unknown): string {
  const parsed = safeRef(value, "sessionRef");
  if (!/^session_[a-f0-9]{12,64}$/u.test(parsed)) throw new KaizenError("unsafe-reference", "sessionRef must be a privacy-safe session hash.");
  return parsed;
}

function captureRecord(store: KaizenStore, input: KaizenSignalInput, source: KaizenSource, context: KaizenCaptureContext, now?: Date): CaptureRecord {
  exactKeys(record(input, "signal"), ["doNotRepeat", "evidenceRefs", "impact", "kind", "likelyCause", "observedEvidence", "scopeHint", "summary"], "signal");
  const kind = enumValue(input.kind, "kind", ["friction", "repetition", "waste", "failure-pattern", "process-gap", "tooling-gap"] as const);
  const summary = sanitize(input.summary, "summary", 1024, store);
  const fingerprint = signalFingerprint(kind, summary);
  const sourceEventRef = safeRef(context.sourceEventRef ?? `${source}:${crypto.randomUUID()}`, "sourceEventRef");
  return {
    schemaVersion: KAIZEN_SCHEMA_VERSION,
    event: "capture",
    eventRef: stableEventRef("capture", `${source}\0${sourceEventRef}`),
    signalRef: signalRef(fingerprint),
    sourceEventRef,
    dedupFingerprint: fingerprint,
    source,
    projectRef: store.projectRef,
    sessionRef: sessionRef(context.sessionRef),
    kind,
    summary,
    observedEvidence: sanitize(input.observedEvidence, "observedEvidence", 2048, store),
    impact: sanitize(input.impact, "impact", 1024, store),
    likelyCause: sanitize(input.likelyCause, "likelyCause", 1024, store),
    doNotRepeat: sanitize(input.doNotRepeat, "doNotRepeat", 1024, store),
    scopeHint: enumValue(input.scopeHint, "scopeHint", ["current-project", "opencode-kit", "external", "unknown"] as const),
    evidenceRefs: refList(input.evidenceRefs, "evidenceRefs"),
    createdAt: nowIso(now),
  };
}

async function slotEntries(directory: string, pattern: RegExp, limit: number, population: string): Promise<fs.Dirent[]> {
  let values: fs.Dirent[];
  try {
    values = await fs.promises.readdir(directory, { withFileTypes: true });
  } catch (error) {
    if (errorCode(error) === "ENOENT") return [];
    throw new KaizenError("store-read", `Kaizen ${population} slots could not be enumerated.`, { cause: error });
  }
  const entries = values.filter((entry) => pattern.test(entry.name)).sort((left, right) => left.name.localeCompare(right.name));
  if (entries.length > limit) throw new KaizenError("corpus-envelope", `Kaizen inbox exceeds its fixed ${population} limit.`);
  return entries;
}

function parseRecord(value: unknown, population: "signal" | "lifecycle"): CaptureRecord | LifecycleRecord {
  const input = record(value, "record");
  if (input.schemaVersion !== KAIZEN_SCHEMA_VERSION) throw new KaizenError("unsupported-schema", "Kaizen record schema version is unsupported.");
  const event = input.event;
  if (event === "capture") {
    if (population !== "signal") throw new KaizenError("malformed-record", "Kaizen capture record is outside the signal population.");
    exactKeys(input, ["schemaVersion", "event", "eventRef", "signalRef", "sourceEventRef", "dedupFingerprint", "source", "projectRef", "sessionRef", "kind", "summary", "observedEvidence", "impact", "likelyCause", "doNotRepeat", "scopeHint", "evidenceRefs", "createdAt"], "capture record");
    const fingerprint = text(input.dedupFingerprint, "dedupFingerprint", 64);
    if (!/^[a-f0-9]{64}$/u.test(fingerprint)) throw new KaizenError("malformed-record", "Kaizen dedup fingerprint is invalid.");
    const parsed: CaptureRecord = {
      schemaVersion: 1,
      event,
      eventRef: safeRef(input.eventRef, "eventRef"),
      signalRef: safeRef(input.signalRef, "signalRef"),
      sourceEventRef: safeRef(input.sourceEventRef, "sourceEventRef"),
      dedupFingerprint: fingerprint,
      source: enumValue(input.source, "source", ["explicit", "compaction", "archive", "legacy-feedback"] as const),
      projectRef: safeRef(input.projectRef, "projectRef"),
      sessionRef: sessionRef(input.sessionRef),
      kind: enumValue(input.kind, "kind", ["friction", "repetition", "waste", "failure-pattern", "process-gap", "tooling-gap"] as const),
      summary: text(input.summary, "summary", 1024),
      observedEvidence: text(input.observedEvidence, "observedEvidence", 2048),
      impact: text(input.impact, "impact", 1024),
      likelyCause: text(input.likelyCause, "likelyCause", 1024),
      doNotRepeat: text(input.doNotRepeat, "doNotRepeat", 1024),
      scopeHint: enumValue(input.scopeHint, "scopeHint", ["current-project", "opencode-kit", "external", "unknown"] as const),
      evidenceRefs: refList(input.evidenceRefs, "evidenceRefs"),
      createdAt: isoTime(input.createdAt, "createdAt"),
    };
    if (parsed.signalRef !== signalRef(parsed.dedupFingerprint) || parsed.dedupFingerprint !== signalFingerprint(parsed.kind, parsed.summary)) {
      throw new KaizenError("malformed-record", "Kaizen signal identity does not match its normalized payload.");
    }
    return parsed;
  }
  if (event === "transition") {
    if (population !== "lifecycle") throw new KaizenError("malformed-record", "Kaizen transition record is outside the lifecycle population.");
    exactKeys(input, ["schemaVersion", "event", "eventRef", "signalRef", "projectRef", "status", "note", "createdAt"], "transition record");
    return {
      schemaVersion: 1,
      event,
      eventRef: safeRef(input.eventRef, "eventRef"),
      signalRef: safeRef(input.signalRef, "signalRef"),
      projectRef: safeRef(input.projectRef, "projectRef"),
      status: enumValue(input.status, "status", ["triaged", "promoted", "resolved", "wont-fix"] as const),
      note: optionalText(input.note, "note", 512),
      createdAt: isoTime(input.createdAt, "createdAt"),
    };
  }
  if (event === "diagnostic") {
    if (population !== "lifecycle") throw new KaizenError("malformed-record", "Kaizen diagnostic record is outside the lifecycle population.");
    exactKeys(input, ["schemaVersion", "event", "eventRef", "diagnosticRef", "sourceEventRef", "source", "projectRef", "code", "createdAt"], "diagnostic record");
    const code = text(input.code, "code", 64);
    if (!SAFE_CODE.test(code)) throw new KaizenError("malformed-record", "Kaizen diagnostic code is invalid.");
    return {
      schemaVersion: 1,
      event,
      eventRef: safeRef(input.eventRef, "eventRef"),
      diagnosticRef: safeRef(input.diagnosticRef, "diagnosticRef"),
      sourceEventRef: safeRef(input.sourceEventRef, "sourceEventRef"),
      source: enumValue(input.source, "source", ["explicit", "compaction", "archive", "legacy-feedback"] as const),
      projectRef: safeRef(input.projectRef, "projectRef"),
      code,
      createdAt: isoTime(input.createdAt, "createdAt"),
    };
  }
  if (event === "observation") {
    if (population !== "lifecycle") throw new KaizenError("malformed-record", "Kaizen observation record is outside the lifecycle population.");
    exactKeys(input, ["schemaVersion", "event", "eventRef", "observationRef", "sourceEventRef", "source", "outcome", "projectRef", "sessionRef", "createdAt"], "observation record");
    return {
      schemaVersion: 1,
      event,
      eventRef: safeRef(input.eventRef, "eventRef"),
      observationRef: safeRef(input.observationRef, "observationRef"),
      sourceEventRef: safeRef(input.sourceEventRef, "sourceEventRef"),
      source: enumValue(input.source, "source", ["compaction"] as const),
      outcome: enumValue(input.outcome, "outcome", ["no-signal"] as const),
      projectRef: safeRef(input.projectRef, "projectRef"),
      sessionRef: sessionRef(input.sessionRef),
      createdAt: isoTime(input.createdAt, "createdAt"),
    };
  }
  if (event === "decision") {
    if (population !== "lifecycle") throw new KaizenError("malformed-record", "Kaizen decision record is outside the lifecycle population.");
    exactKeys(input, ["schemaVersion", "event", "eventRef", "decisionRef", "sourceEventRef", "signalRef", "decision", "evidenceRefs", "ownerClass", "nextBoundaryOrTerminalReason", "projectRef", "sessionRef", "createdAt"], "decision record");
    return {
      schemaVersion: 1,
      event,
      eventRef: safeRef(input.eventRef, "eventRef"),
      decisionRef: safeRef(input.decisionRef, "decisionRef"),
      sourceEventRef: safeRef(input.sourceEventRef, "sourceEventRef"),
      signalRef: safeRef(input.signalRef, "signalRef"),
      decision: enumValue(input.decision, "decision", ["duplicate", "local-memory", "project-change", "kit-candidate", "external-owner", "needs-investigation", "no-action", "owner-blocked", "resolved"] as const),
      evidenceRefs: refList(input.evidenceRefs, "evidenceRefs"),
      ownerClass: enumValue(input.ownerClass, "ownerClass", ["current-project", "opencode-kit", "external", "unknown"] as const),
      nextBoundaryOrTerminalReason: text(input.nextBoundaryOrTerminalReason, "nextBoundaryOrTerminalReason", 1024),
      projectRef: safeRef(input.projectRef, "projectRef"),
      sessionRef: sessionRef(input.sessionRef),
      createdAt: isoTime(input.createdAt, "createdAt"),
    };
  }
  if (event === "checkpoint") {
    if (population !== "lifecycle") throw new KaizenError("malformed-record", "Kaizen checkpoint record is outside the lifecycle population.");
    exactKeys(input, ["schemaVersion", "event", "eventRef", "sourceEventRef", "checkpointRef", "changeRef", "status", "signalRefs", "projectRef", "sessionRef", "createdAt"], "checkpoint record");
    return {
      schemaVersion: 1,
      event,
      eventRef: safeRef(input.eventRef, "eventRef"),
      sourceEventRef: safeRef(input.sourceEventRef, "sourceEventRef"),
      checkpointRef: safeRef(input.checkpointRef, "checkpointRef"),
      changeRef: changeRef(input.changeRef),
      status: enumValue(input.status, "status", ["harvest-pending", "captured", "no-signal", "archive-failed"] as const),
      signalRefs: signalRefList(input.signalRefs, "signalRefs"),
      projectRef: safeRef(input.projectRef, "projectRef"),
      sessionRef: sessionRef(input.sessionRef),
      createdAt: isoTime(input.createdAt, "createdAt"),
    };
  }
  throw new KaizenError("malformed-record", "Kaizen event kind is invalid.");
}

async function readSlot(file: string, name: string, population: "signal" | "lifecycle", maximumBytes: number): Promise<CaptureRecord | LifecycleRecord> {
  try {
    const stat = await fs.promises.lstat(file);
    if (!stat.isFile() || stat.isSymbolicLink() || stat.size > maximumBytes) throw new KaizenError("malformed-record", `Kaizen ${population} slot is unsafe or over limit.`);
    return parseRecord(JSON.parse(await fs.promises.readFile(file, "utf8")), population);
  } catch (error) {
    if (error instanceof KaizenError) throw error;
    throw new KaizenError("store-read", `Kaizen ${population} '${name}' could not be read.`, { cause: error });
  }
}

async function readConcurrentSlot(file: string, name: string, population: "signal" | "lifecycle", maximumBytes: number): Promise<CaptureRecord | LifecycleRecord> {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    try {
      return await readSlot(file, name, population, maximumBytes);
    } catch (error) {
      if (!(error instanceof KaizenError) || error.code !== "store-read" || attempt === 9) throw error;
      await new Promise((resolve) => setTimeout(resolve, 10));
    }
  }
  throw new KaizenError("store-read", `Kaizen ${population} '${name}' did not become readable.`);
}

async function readPopulation<T extends CaptureRecord | LifecycleRecord>(
  directory: string,
  pattern: RegExp,
  limit: number,
  maximumBytes: number,
  population: "signal" | "lifecycle",
): Promise<T[]> {
  const result: T[] = [];
  for (const entry of await slotEntries(directory, pattern, limit, population)) {
    result.push(await readSlot(path.join(directory, entry.name), entry.name, population, maximumBytes) as T);
  }
  return result;
}

async function records(store: KaizenStore): Promise<KaizenRecords> {
  const [signals, lifecycle] = await Promise.all([
    readPopulation<CaptureRecord>(path.join(store.storeRoot, "signals"), SIGNAL_PATTERN, KAIZEN_SIGNAL_LIMIT, KAIZEN_SIGNAL_BYTES, "signal"),
    readPopulation<LifecycleRecord>(path.join(store.storeRoot, "events"), EVENT_PATTERN, KAIZEN_LIFECYCLE_LIMIT, KAIZEN_LIFECYCLE_BYTES, "lifecycle"),
  ]);
  return { lifecycle, signals };
}

async function appendFixedSlot<T extends CaptureRecord | LifecycleRecord>(input: {
  directory: string;
  event: T;
  identityMatches(existing: T): boolean;
  limit: number;
  maximumBytes: number;
  population: "signal" | "lifecycle";
  prefix: "signal" | "event";
  width: number;
}): Promise<{ created: boolean; record: T }> {
  const content = `${JSON.stringify(input.event, null, 2)}\n`;
  if (Buffer.byteLength(content, "utf8") > input.maximumBytes) {
    throw new KaizenError("record-too-large", `Kaizen ${input.population} exceeds ${input.maximumBytes / 1024} KiB after redaction.`);
  }
  await fs.promises.mkdir(input.directory, { recursive: true });
  for (let index = 0; index < input.limit; index += 1) {
    const name = `${input.prefix}-${String(index).padStart(input.width, "0")}.json`;
    const file = path.join(input.directory, name);
    try {
      await fs.promises.writeFile(file, content, { encoding: "utf8", flag: "wx" });
      return { created: true, record: input.event };
    } catch (error) {
      if (errorCode(error) !== "EEXIST") throw new KaizenError("store-write", `Kaizen ${input.population} append failed.`, { cause: error });
      const existing = await readConcurrentSlot(file, name, input.population, input.maximumBytes) as T;
      if (input.identityMatches(existing)) return { created: false, record: existing };
    }
  }
  throw new KaizenError("capacity", `Kaizen inbox ${input.population} capacity is exhausted.`);
}

function appendSignal(store: KaizenStore, event: CaptureRecord): Promise<{ created: boolean; record: CaptureRecord }> {
  return appendFixedSlot({
    directory: path.join(store.storeRoot, "signals"),
    event,
    identityMatches: (existing) => existing.sourceEventRef === event.sourceEventRef,
    limit: KAIZEN_SIGNAL_LIMIT,
    maximumBytes: KAIZEN_SIGNAL_BYTES,
    population: "signal",
    prefix: "signal",
    width: 4,
  });
}

function appendLifecycle(store: KaizenStore, event: LifecycleRecord): Promise<{ created: boolean; record: LifecycleRecord }> {
  return appendFixedSlot({
    directory: path.join(store.storeRoot, "events"),
    event,
    identityMatches: (existing) => existing.eventRef === event.eventRef,
    limit: KAIZEN_LIFECYCLE_LIMIT,
    maximumBytes: KAIZEN_LIFECYCLE_BYTES,
    population: "lifecycle",
    prefix: "event",
    width: 6,
  });
}

function fold(all: KaizenRecords): { signals: KaizenSignal[]; diagnostics: KaizenDiagnostic[]; observations: KaizenObservation[]; decisions: KaizenDecision[]; checkpoints: KaizenCheckpoint[] } {
  const signals = new Map<string, KaizenSignal>();
  const diagnostics = new Map<string, KaizenDiagnostic>();
  const decisions = new Map<string, KaizenDecision>();
  const checkpoints = new Map<string, KaizenCheckpoint>();
  const observations = new Map<string, KaizenObservation>();
  const captures = [...all.signals].sort((left, right) => left.createdAt.localeCompare(right.createdAt) || left.eventRef.localeCompare(right.eventRef));
  for (const event of captures) {
    const current = signals.get(event.signalRef);
    if (current == null) {
      signals.set(event.signalRef, {
        schemaVersion: 1,
        signalRef: event.signalRef,
        dedupFingerprint: event.dedupFingerprint,
        kind: event.kind,
        summary: event.summary,
        observedEvidence: event.observedEvidence,
        impact: event.impact,
        likelyCause: event.likelyCause,
        doNotRepeat: event.doNotRepeat,
        scopeHint: event.scopeHint,
        evidenceRefs: [...event.evidenceRefs],
        projectRef: event.projectRef,
        projectRefs: [event.projectRef],
        sessionRef: event.sessionRef,
        sessionRefs: [event.sessionRef],
        sources: [event.source],
        status: "pending",
        occurrenceCount: 1,
        createdAt: event.createdAt,
        lastSeenAt: event.createdAt,
        decision: null,
      });
    } else {
      current.projectRefs = [...new Set([...current.projectRefs, event.projectRef])].sort();
      current.sessionRefs = [...new Set([...current.sessionRefs, event.sessionRef])].sort();
      current.sources = [...new Set([...current.sources, event.source])].sort() as KaizenSource[];
      current.occurrenceCount += 1;
      current.lastSeenAt = event.createdAt;
    }
  }
  const lifecycle = [...all.lifecycle].sort((left, right) => {
    const time = left.createdAt.localeCompare(right.createdAt);
    if (time !== 0) return time;
    if (left.event === "checkpoint" && right.event === "checkpoint" && left.checkpointRef === right.checkpointRef && left.status !== right.status) {
      return left.status === "harvest-pending" ? -1 : 1;
    }
    return left.eventRef.localeCompare(right.eventRef);
  });
  for (const event of lifecycle) {
    if (event.event === "transition") {
      const signal = signals.get(event.signalRef);
      if (signal == null) throw new KaizenError("malformed-record", "Kaizen transition references an unknown signal.");
      signal.status = event.status;
    } else if (event.event === "diagnostic" && !diagnostics.has(event.sourceEventRef)) {
      diagnostics.set(event.sourceEventRef, {
        code: event.code,
        createdAt: event.createdAt,
        diagnosticRef: event.diagnosticRef,
        projectRef: event.projectRef,
        source: event.source,
      });
    } else if (event.event === "observation" && !observations.has(event.sourceEventRef)) {
      observations.set(event.sourceEventRef, {
        createdAt: event.createdAt,
        observationRef: event.observationRef,
        outcome: event.outcome,
        projectRef: event.projectRef,
        sessionRef: event.sessionRef,
        source: event.source,
      });
    } else if (event.event === "decision") {
      const signal = signals.get(event.signalRef);
      if (signal == null) throw new KaizenError("malformed-record", "Kaizen decision references an unknown signal.");
      const decision: KaizenDecision = {
        schemaVersion: 1,
        decisionRef: event.decisionRef,
        signalRef: event.signalRef,
        decision: event.decision,
        evidenceRefs: [...event.evidenceRefs],
        ownerClass: event.ownerClass,
        nextBoundaryOrTerminalReason: event.nextBoundaryOrTerminalReason,
        projectRef: event.projectRef,
        sessionRef: event.sessionRef,
        createdAt: event.createdAt,
      };
      decisions.set(event.decisionRef, decision);
      signal.decision = decision;
      signal.status = ["duplicate", "no-action", "resolved"].includes(event.decision) ? "resolved" : "triaged";
    } else if (event.event === "checkpoint") {
      const current = checkpoints.get(event.checkpointRef);
      if (event.status === "harvest-pending") {
        if (event.signalRefs.length !== 0 || current != null) throw new KaizenError("malformed-record", "Kaizen checkpoint has an invalid pending state.");
      } else {
        if (current == null || current.status !== "harvest-pending" || current.changeRef !== event.changeRef) {
          throw new KaizenError("malformed-record", "Kaizen checkpoint closure has no matching pending state.");
        }
        if ((event.status === "captured") !== (event.signalRefs.length > 0)) {
          throw new KaizenError("malformed-record", "Kaizen checkpoint closure has invalid signal refs.");
        }
        if (event.signalRefs.some((ref) => !signals.has(ref))) throw new KaizenError("malformed-record", "Kaizen checkpoint references an unknown signal.");
      }
      checkpoints.set(event.checkpointRef, {
        schemaVersion: 1,
        checkpointRef: event.checkpointRef,
        changeRef: event.changeRef,
        status: event.status,
        signalRefs: [...event.signalRefs],
        projectRef: event.projectRef,
        sessionRef: event.sessionRef,
        createdAt: event.createdAt,
      });
    }
  }
  return {
    signals: [...signals.values()].sort((left, right) => right.lastSeenAt.localeCompare(left.lastSeenAt) || left.signalRef.localeCompare(right.signalRef)),
    diagnostics: [...diagnostics.values()].sort((left, right) => right.createdAt.localeCompare(left.createdAt) || left.diagnosticRef.localeCompare(right.diagnosticRef)),
    observations: [...observations.values()].sort((left, right) => right.createdAt.localeCompare(left.createdAt) || left.observationRef.localeCompare(right.observationRef)),
    decisions: [...decisions.values()].sort((left, right) => right.createdAt.localeCompare(left.createdAt) || left.decisionRef.localeCompare(right.decisionRef)),
    checkpoints: [...checkpoints.values()].sort((left, right) => right.createdAt.localeCompare(left.createdAt) || left.checkpointRef.localeCompare(right.checkpointRef)),
  };
}

export async function readKaizenInbox(store: KaizenStore, options: { limit?: number; originProjectRef?: string; statuses?: KaizenStatus[] } = {}): Promise<KaizenInbox> {
  const all = await records(store);
  const folded = fold(all);
  const limit = options.limit ?? 50;
  if (!Number.isInteger(limit) || limit < 1 || limit > KAIZEN_STATUS_LIMIT) throw new KaizenError("invalid-limit", `Kaizen status limit must be between 1 and ${KAIZEN_STATUS_LIMIT}.`);
  const originProjectRef = options.originProjectRef == null ? null : safeRef(options.originProjectRef, "originProjectRef");
  if (originProjectRef != null && !/^project_[a-f0-9]{32}$/u.test(originProjectRef)) throw new KaizenError("unsafe-reference", "originProjectRef must be a privacy-safe project ref.");
  const statuses = options.statuses == null ? null : new Set(options.statuses.map((status) => enumValue(status, "status", ["pending", "triaged", "promoted", "resolved", "wont-fix"] as const)));
  const selected = folded.signals
    .filter((signal) => statuses == null || statuses.has(signal.status))
    .filter((signal) => originProjectRef == null || signal.projectRef === originProjectRef)
    .sort((left, right) => left.createdAt.localeCompare(right.createdAt) || left.signalRef.localeCompare(right.signalRef));
  const counts = {
    pending: 0,
    triaged: 0,
    promoted: 0,
    resolved: 0,
    "wont-fix": 0,
    checkpoints: folded.checkpoints.length,
    decisions: folded.decisions.length,
    diagnostics: folded.diagnostics.length,
    observations: folded.observations.length,
    events: all.signals.length + all.lifecycle.length,
    lifecycleEvents: all.lifecycle.length,
    signalRecords: all.signals.length,
    signals: folded.signals.length,
  };
  for (const signal of folded.signals) counts[signal.status] += 1;
  const truncation = {
    checkpoints: folded.checkpoints.length > limit,
    decisions: folded.decisions.length > limit,
    diagnostics: folded.diagnostics.length > Math.min(limit, 20),
    observations: folded.observations.length > Math.min(limit, 20),
    signals: selected.length > limit,
  };
  return {
    schemaVersion: 1,
    capacity: {
      lifecycleBytes: KAIZEN_LIFECYCLE_BYTES,
      lifecycleLimit: KAIZEN_LIFECYCLE_LIMIT,
      lifecycleUsed: all.lifecycle.length,
      signalBytes: KAIZEN_SIGNAL_BYTES,
      signalLimit: KAIZEN_SIGNAL_LIMIT,
      signalUsed: all.signals.length,
    },
    checkpoints: folded.checkpoints.slice(0, limit),
    decisions: folded.decisions.slice(0, limit),
    counts,
    diagnostics: folded.diagnostics.slice(0, Math.min(limit, 20)),
    observations: folded.observations.slice(0, Math.min(limit, 20)),
    signals: selected.slice(0, limit),
    totalSignals: selected.length,
    truncation,
    truncated: Object.values(truncation).some(Boolean),
  };
}

export async function captureKaizenSignal(
  store: KaizenStore,
  input: KaizenSignalInput,
  source: KaizenSource,
  context: KaizenCaptureContext,
  now?: Date,
): Promise<KaizenCaptureResult> {
  const event = captureRecord(store, input, source, context, now);
  const appended = await appendSignal(store, event);
  const signal = fold(await records(store)).signals.find((item) => item.signalRef === appended.record.signalRef);
  if (signal == null) throw new KaizenError("malformed-record", "Kaizen idempotency record is incomplete.");
  return {
    schemaVersion: 1,
    action: appended.created && signal.occurrenceCount === 1 ? "captured" : "deduplicated",
    signalRef: signal.signalRef,
    projectRef: store.projectRef,
    sessionRef: appended.record.sessionRef,
    source: appended.record.source,
    status: signal.status,
    occurrenceCount: signal.occurrenceCount,
  };
}

export async function recordKaizenDecision(
  store: KaizenStore,
  input: KaizenDecisionInput,
  context: KaizenCaptureContext,
  now?: Date,
): Promise<KaizenDecision> {
  exactKeys(record(input, "decision"), ["signalRef", "decision", "evidenceRefs", "ownerClass", "nextBoundaryOrTerminalReason"], "decision");
  const signalRefValue = safeRef(input.signalRef, "signalRef");
  if (!/^signal_[a-f0-9]{32}$/u.test(signalRefValue)) throw new KaizenError("unsafe-reference", "signalRef must be a privacy-safe signal ref.");
  const current = await records(store);
  if (!fold(current).signals.some((signal) => signal.signalRef === signalRefValue)) throw new KaizenError("signal-not-found", "Kaizen signal was not found.");
  if (input.ownerClass === "unknown" && input.decision !== "needs-investigation") {
    throw new KaizenError("invalid-field", "Unknown Kaizen ownership requires a needs-investigation decision.");
  }
  const sourceEventRef = safeRef(context.sourceEventRef ?? `decision:${crypto.randomUUID()}`, "sourceEventRef");
  const eventRef = stableEventRef("decision", sourceEventRef);
  const existing = current.lifecycle.find((event): event is DecisionRecord => event.event === "decision" && event.eventRef === eventRef);
  if (existing != null) return fold(current).decisions.find((decision) => decision.decisionRef === existing.decisionRef)!;
  const event: DecisionRecord = {
    schemaVersion: 1,
    event: "decision",
    eventRef,
    decisionRef: `decision_${sha256(sourceEventRef).slice(0, 32)}`,
    sourceEventRef,
    signalRef: signalRefValue,
    decision: enumValue(input.decision, "decision", ["duplicate", "local-memory", "project-change", "kit-candidate", "external-owner", "needs-investigation", "no-action", "owner-blocked", "resolved"] as const),
    evidenceRefs: refList(input.evidenceRefs, "evidenceRefs"),
    ownerClass: enumValue(input.ownerClass, "ownerClass", ["current-project", "opencode-kit", "external", "unknown"] as const),
    nextBoundaryOrTerminalReason: sanitize(input.nextBoundaryOrTerminalReason, "nextBoundaryOrTerminalReason", 1024, store),
    projectRef: store.projectRef,
    sessionRef: sessionRef(context.sessionRef),
    createdAt: nowIso(now),
  };
  await appendLifecycle(store, event);
  return fold(await records(store)).decisions.find((decision) => decision.decisionRef === event.decisionRef)!;
}

export async function recordKaizenCheckpoint(
  store: KaizenStore,
  input: KaizenCheckpointInput,
  context: KaizenCaptureContext,
  now?: Date,
): Promise<KaizenCheckpoint> {
  exactKeys(record(input, "checkpoint"), ["changeRef", "checkpointRef", "status", "signalRefs"].filter((key) => Object.hasOwn(input, key)), "checkpoint");
  const status = enumValue(input.status, "status", ["harvest-pending", "captured", "no-signal", "archive-failed"] as const);
  const changeRefValue = changeRef(input.changeRef);
  const sourceEventRef = safeRef(context.sourceEventRef ?? `checkpoint:${crypto.randomUUID()}`, "sourceEventRef");
  const eventRef = stableEventRef("checkpoint", sourceEventRef);
  const current = await records(store);
  const existingEvent = current.lifecycle.find((event): event is CheckpointRecord => event.event === "checkpoint" && event.eventRef === eventRef);
  if (existingEvent != null) return fold(current).checkpoints.find((checkpoint) => checkpoint.checkpointRef === existingEvent.checkpointRef)!;
  const folded = fold(current);
  let checkpointRefValue: string;
  let signalRefs: string[];
  if (status === "harvest-pending") {
    if (input.checkpointRef != null || (input.signalRefs?.length ?? 0) !== 0) throw new KaizenError("invalid-field", "Pending checkpoint input cannot contain checkpointRef or signalRefs.");
    const existingPending = folded.checkpoints.find((checkpoint) => checkpoint.changeRef === changeRefValue && checkpoint.projectRef === store.projectRef && checkpoint.status === "harvest-pending");
    if (existingPending != null) return existingPending;
    checkpointRefValue = `checkpoint_${sha256(`${changeRefValue}\0${sourceEventRef}`).slice(0, 32)}`;
    if (folded.checkpoints.some((checkpoint) => checkpoint.checkpointRef === checkpointRefValue)) throw new KaizenError("invalid-transition", "Kaizen checkpoint is already open.");
    signalRefs = [];
  } else {
    checkpointRefValue = safeRef(input.checkpointRef, "checkpointRef");
    if (!/^checkpoint_[a-f0-9]{32}$/u.test(checkpointRefValue)) throw new KaizenError("unsafe-reference", "checkpointRef must be a privacy-safe checkpoint ref.");
    const pending = folded.checkpoints.find((checkpoint) => checkpoint.checkpointRef === checkpointRefValue);
    if (pending == null || pending.status !== "harvest-pending" || pending.changeRef !== changeRefValue) {
      throw new KaizenError("invalid-transition", "Kaizen checkpoint closure requires one matching pending checkpoint.");
    }
    signalRefs = signalRefList(input.signalRefs ?? [], "signalRefs");
    if ((status === "captured") !== (signalRefs.length > 0)) throw new KaizenError("invalid-field", "Only captured checkpoints may contain one to three signal refs.");
    if (signalRefs.some((ref) => !folded.signals.some((signal) => signal.signalRef === ref))) throw new KaizenError("signal-not-found", "Kaizen checkpoint references an unknown signal.");
  }
  const event: CheckpointRecord = {
    schemaVersion: 1,
    event: "checkpoint",
    eventRef,
    sourceEventRef,
    checkpointRef: checkpointRefValue,
    changeRef: changeRefValue,
    status,
    signalRefs,
    projectRef: store.projectRef,
    sessionRef: sessionRef(context.sessionRef),
    createdAt: nowIso(now),
  };
  await appendLifecycle(store, event);
  return fold(await records(store)).checkpoints.find((checkpoint) => checkpoint.checkpointRef === checkpointRefValue)!;
}

export async function recordKaizenDiagnostic(
  store: KaizenStore,
  source: KaizenSource,
  sourceEventRef: string,
  code: string,
  now?: Date,
): Promise<void> {
  if (!SAFE_CODE.test(code)) throw new KaizenError("invalid-field", "Kaizen diagnostic code is invalid.");
  const safeSourceRef = safeRef(sourceEventRef, "sourceEventRef");
  await appendLifecycle(store, {
    schemaVersion: 1,
    event: "diagnostic",
    eventRef: stableEventRef("diagnostic", `${source}\0${safeSourceRef}`),
    diagnosticRef: `diagnostic_${sha256(`${safeSourceRef}\0${code}`).slice(0, 32)}`,
    sourceEventRef: safeSourceRef,
    source,
    projectRef: store.projectRef,
    code,
    createdAt: nowIso(now),
  });
}

export async function recordKaizenNoSignal(
  store: KaizenStore,
  sourceEventRef: string,
  sessionRefValue: string,
  now?: Date,
): Promise<KaizenObservation> {
  const safeSourceRef = safeRef(sourceEventRef, "sourceEventRef");
  const event: ObservationRecord = {
    schemaVersion: 1,
    event: "observation",
    eventRef: stableEventRef("observation", safeSourceRef),
    observationRef: `observation_${sha256(safeSourceRef).slice(0, 32)}`,
    sourceEventRef: safeSourceRef,
    source: "compaction",
    outcome: "no-signal",
    projectRef: store.projectRef,
    sessionRef: sessionRef(sessionRefValue),
    createdAt: nowIso(now),
  };
  await appendLifecycle(store, event);
  return fold(await records(store)).observations.find((observation) => observation.observationRef === event.observationRef)!;
}

export async function transitionKaizenSignal(
  store: KaizenStore,
  input: { signalRef: string; status: Exclude<KaizenStatus, "pending">; note?: string },
  now?: Date,
): Promise<KaizenSignal> {
  exactKeys(record(input, "transition"), ["signalRef", "status", "note"].filter((key) => Object.hasOwn(input, key)), "transition");
  const current = await records(store);
  const before = fold(current).signals.find((signal) => signal.signalRef === input.signalRef);
  if (before == null) throw new KaizenError("signal-not-found", "Kaizen signal was not found.");
  const event: TransitionRecord = {
    schemaVersion: 1,
    event: "transition",
    eventRef: randomRef("event"),
    signalRef: safeRef(input.signalRef, "signalRef"),
    projectRef: store.projectRef,
    status: enumValue(input.status, "status", ["triaged", "promoted", "resolved", "wont-fix"] as const),
    note: sanitizeOptional(input.note, "note", 512, store),
    createdAt: nowIso(now),
  };
  await appendLifecycle(store, event);
  return fold(await records(store)).signals.find((signal) => signal.signalRef === input.signalRef)!;
}
