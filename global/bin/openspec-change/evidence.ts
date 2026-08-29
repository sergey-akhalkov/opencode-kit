import {
  DEFAULT_EVIDENCE_MAX_BYTES,
  DEFAULT_EVIDENCE_MAX_FILES,
  MAX_LANES,
  MAX_TASKS,
  OPENSPEC_EVIDENCE_LEGACY_SCHEMA_VERSION,
  OPENSPEC_EVIDENCE_SCHEMA_VERSION,
  SAFE_ID,
  SAFE_TOKEN,
  digestText,
  extraKeys,
  failIssues,
  isSha256,
  readArray,
  readObject,
  readString,
  safeRelativePath,
  type ParseResult,
  type SchemaIssue,
} from "./manifest.ts";
import { parseClaimRecords, type ClaimEvidenceRecord } from "./claims.ts";

export {
  evaluateClaimEvidence,
  parseClaimRecords,
  type ClaimChallengeStatus,
  type ClaimClass,
  type ClaimClosureReason,
  type ClaimClosureResult,
  type ClaimClosureState,
  type ClaimCoverageBasis,
  type ClaimDisposition,
  type ClaimEvidenceRecord,
  type ClaimIndependentChallenge,
  type ClaimObservation,
  type ClaimObservationStatus,
  type ClaimPaths,
  type ClaimPopulation,
  type ClaimRealOracle,
  type ClaimRealOracleStatus,
} from "./claims.ts";

export type EvidenceBoundaryKind = "named-entrypoint" | "manual" | "external";
export type EvidenceTaskResult = "complete" | "incomplete" | "unknown" | "red";
export type EvidenceCleanup = "none" | "complete" | "unknown";
export type EvidenceLaneKind = "product" | "runner" | "evaluator" | "environment" | "raw-bundle" | "replay" | "terminal";
export type EvidenceBoundary = { kind: EvidenceBoundaryKind; name: string; effects: string[] };
export type EvidenceInvocation = { command: string; status: number | "unknown"; recordedAt: string };
export type EvidenceManualGate = { reason: string; disposition: string };
export type EvidenceTaskRow = {
  taskId: string;
  taskTextDigest: string;
  result: EvidenceTaskResult;
  candidateId: string;
  environmentId: string;
  requiredBoundary: EvidenceBoundary;
  boundary: EvidenceBoundary;
  invocation: EvidenceInvocation | null;
  artifacts: string[];
  cleanup: EvidenceCleanup;
  manualGate: EvidenceManualGate | null;
};
export type EvidenceLaneFile = { path: string; bytes: number; digest: string };
export type EvidenceLane = { name: string; kind: EvidenceLaneKind; files: EvidenceLaneFile[] };
export type EvidenceRetentionException = { maxFiles: number; maxBytes: number; reason: string; cleanupRule: string; validation: string };
export type EvidenceRetention = { maxFiles: number; maxBytes: number; exception: EvidenceRetentionException | null };
export type EvidenceIndex = {
  schemaVersion: typeof OPENSPEC_EVIDENCE_SCHEMA_VERSION;
  changeId: string;
  candidateId: string;
  environmentId: string;
  retention: EvidenceRetention;
  tasks: EvidenceTaskRow[];
  lanes: EvidenceLane[];
  claims: ClaimEvidenceRecord[];
};

function collect(issues: SchemaIssue[], result: ParseResult<unknown>): void {
  if (!result.ok) issues.push(...result.issues);
}

function readInt(value: unknown, path: string): ParseResult<number> {
  if (value === undefined) return failIssues([{ code: "missing", path, message: "Invalid input: expected number, received undefined" }]);
  if (typeof value !== "number" || !Number.isInteger(value)) return failIssues([{ code: "invalid", path, message: "Invalid integer." }]);
  return { ok: true, value };
}

function parseBoundary(value: unknown, path: string): ParseResult<EvidenceBoundary> {
  const object = readObject(value, path);
  if (!object.ok) return object;
  const issues = extraKeys(object.value, ["kind", "name", "effects"], path);
  const kind = object.value.kind;
  if (kind !== "named-entrypoint" && kind !== "manual" && kind !== "external") {
    issues.push(kind === undefined
      ? { code: "missing", path: `${path}.kind`, message: "Invalid input: expected string, received undefined" }
      : { code: "invalid", path: `${path}.kind`, message: "Invalid boundary kind." });
  }
  const name = readString(object.value.name, `${path}.name`, SAFE_TOKEN);
  const effectsRaw = readArray(object.value.effects, `${path}.effects`);
  collect(issues, name);
  collect(issues, effectsRaw);
  const effects: string[] = [];
  if (effectsRaw.ok) {
    for (const [index, effect] of effectsRaw.value.entries()) {
      const parsed = readString(effect, `${path}.effects.${index}`, SAFE_TOKEN);
      collect(issues, parsed);
      if (parsed.ok) effects.push(parsed.value);
    }
  }
  if (issues.length > 0 || !name.ok || kind !== "named-entrypoint" && kind !== "manual" && kind !== "external") return failIssues(issues);
  return { ok: true, value: { kind, name: name.value, effects } };
}

function readTaskRecord(value: unknown, path: string): ParseResult<Record<string, unknown>> {
  if (!Array.isArray(value)) return readObject(value, path);
  if (value.length !== 10 || value[0] !== "entrypoint") {
    return failIssues([{ code: "invalid", path, message: "Compact task evidence must be an exact entrypoint tuple." }]);
  }
  return {
    ok: true,
    value: {
      taskId: value[1],
      taskTextDigest: value[2],
      result: value[3],
      boundary: { kind: "named-entrypoint", name: value[4], effects: value[5] },
      invocation: { command: value[6], status: value[7], recordedAt: value[8] },
      cleanup: value[9],
    },
  };
}

export function taskTextDigest(text: string): string {
  return digestText(text.trim());
}

export function inspectEvidenceDocument(input: unknown): ParseResult<EvidenceIndex> {
  if (typeof input === "object" && input != null && !Array.isArray(input) && "schemaVersion" in input && input.schemaVersion === OPENSPEC_EVIDENCE_LEGACY_SCHEMA_VERSION) {
    return failIssues([{ code: "unknown", path: "schemaVersion", message: "Evidence index schemaVersion 1 cannot prove task evidence." }]);
  }
  return parseEvidenceIndex(input);
}

export function parseEvidenceIndex(input: unknown): ParseResult<EvidenceIndex> {
  const object = readObject(input, "<root>");
  if (!object.ok) return object;
  const issues = extraKeys(object.value, ["schemaVersion", "changeId", "candidateId", "environmentId", "retention", "tasks", "lanes", "claims"], "<root>");
  if (object.value.schemaVersion !== OPENSPEC_EVIDENCE_SCHEMA_VERSION) {
    issues.push(object.value.schemaVersion === undefined
      ? { code: "missing", path: "schemaVersion", message: "Invalid input: expected number, received undefined" }
      : { code: "invalid", path: "schemaVersion", message: "schemaVersion must be 2." });
  }
  const changeId = readString(object.value.changeId, "changeId", SAFE_ID);
  const candidateId = readString(object.value.candidateId, "candidateId", SAFE_ID);
  const environmentId = readString(object.value.environmentId, "environmentId", SAFE_ID);
  const retentionRaw = readObject(object.value.retention, "retention");
  const tasksRaw = readArray(object.value.tasks, "tasks");
  const lanesRaw = readArray(object.value.lanes, "lanes");
  const claims = parseClaimRecords(object.value.claims ?? [], "claims");
  collect(issues, changeId);
  collect(issues, candidateId);
  collect(issues, environmentId);
  collect(issues, retentionRaw);
  collect(issues, tasksRaw);
  collect(issues, lanesRaw);
  collect(issues, claims);
  if (!changeId.ok || !candidateId.ok || !environmentId.ok || !retentionRaw.ok || !tasksRaw.ok || !lanesRaw.ok || !claims.ok) return failIssues(issues);
  issues.push(...extraKeys(retentionRaw.value, ["maxFiles", "maxBytes", "exception"], "retention"));
  const maxFiles = readInt(retentionRaw.value.maxFiles, "retention.maxFiles");
  const maxBytes = readInt(retentionRaw.value.maxBytes, "retention.maxBytes");
  collect(issues, maxFiles);
  collect(issues, maxBytes);
  let exception: EvidenceRetentionException | null = null;
  if (retentionRaw.value.exception !== null && retentionRaw.value.exception !== undefined) {
    const exceptionRaw = readObject(retentionRaw.value.exception, "retention.exception");
    if (!exceptionRaw.ok) issues.push(...exceptionRaw.issues);
    else {
      issues.push(...extraKeys(exceptionRaw.value, ["maxFiles", "maxBytes", "reason", "cleanupRule", "validation"], "retention.exception"));
      const exFiles = readInt(exceptionRaw.value.maxFiles, "retention.exception.maxFiles");
      const exBytes = readInt(exceptionRaw.value.maxBytes, "retention.exception.maxBytes");
      const reason = readString(exceptionRaw.value.reason, "retention.exception.reason");
      const cleanupRule = readString(exceptionRaw.value.cleanupRule, "retention.exception.cleanupRule");
      const validation = readString(exceptionRaw.value.validation, "retention.exception.validation");
      collect(issues, exFiles);
      collect(issues, exBytes);
      collect(issues, reason);
      collect(issues, cleanupRule);
      collect(issues, validation);
      if (exFiles.ok && exBytes.ok && reason.ok && cleanupRule.ok && validation.ok) {
        if (exFiles.value < 1 || exBytes.value < 1) issues.push({ code: "invalid", path: "retention.exception", message: "Exception maxima must be finite and positive." });
        else exception = { maxFiles: exFiles.value, maxBytes: exBytes.value, reason: reason.value, cleanupRule: cleanupRule.value, validation: validation.value };
      }
    }
  }
  if (maxFiles.ok && maxBytes.ok && exception == null) {
    if (maxFiles.value > DEFAULT_EVIDENCE_MAX_FILES) issues.push({ code: "invalid", path: "retention.maxFiles", message: `Default retention maxFiles cannot exceed ${DEFAULT_EVIDENCE_MAX_FILES}.` });
    if (maxBytes.value > DEFAULT_EVIDENCE_MAX_BYTES) issues.push({ code: "invalid", path: "retention.maxBytes", message: `Default retention maxBytes cannot exceed ${DEFAULT_EVIDENCE_MAX_BYTES}.` });
  }
  const tasks: EvidenceTaskRow[] = [];
  const taskIds = new Set<string>();
  for (const [index, item] of tasksRaw.value.entries()) {
    const record = readTaskRecord(item, `tasks.${index}`);
    if (!record.ok) { issues.push(...record.issues); continue; }
    issues.push(...extraKeys(record.value, ["taskId", "taskTextDigest", "result", "candidateId", "environmentId", "requiredBoundary", "boundary", "invocation", "artifacts", "cleanup", "manualGate"], `tasks.${index}`));
    const taskId = readString(record.value.taskId, `tasks.${index}.taskId`, SAFE_TOKEN);
    const taskTextDigestValue = readString(record.value.taskTextDigest, `tasks.${index}.taskTextDigest`);
    const result = record.value.result;
    const boundary = parseBoundary(record.value.boundary, `tasks.${index}.boundary`);
    const rowCandidate = record.value.candidateId === undefined
      ? { ok: true as const, value: candidateId.value }
      : readString(record.value.candidateId, `tasks.${index}.candidateId`, SAFE_ID);
    const rowEnvironment = record.value.environmentId === undefined
      ? { ok: true as const, value: environmentId.value }
      : readString(record.value.environmentId, `tasks.${index}.environmentId`, SAFE_ID);
    const requiredBoundary = record.value.requiredBoundary === undefined
      ? boundary.ok
        ? { ok: true as const, value: boundary.value }
        : failIssues([{ code: "missing", path: `tasks.${index}.requiredBoundary`, message: "Cannot inherit requiredBoundary without an explicit boundary." }])
      : parseBoundary(record.value.requiredBoundary, `tasks.${index}.requiredBoundary`);
    const artifactsRaw = record.value.artifacts === undefined
      ? { ok: true as const, value: [] }
      : readArray(record.value.artifacts, `tasks.${index}.artifacts`);
    const cleanup = record.value.cleanup;
    collect(issues, taskId);
    collect(issues, taskTextDigestValue);
    collect(issues, rowCandidate);
    collect(issues, rowEnvironment);
    collect(issues, requiredBoundary);
    collect(issues, boundary);
    collect(issues, artifactsRaw);
    if (result !== "complete" && result !== "incomplete" && result !== "unknown" && result !== "red") {
      issues.push(result === undefined
        ? { code: "missing", path: `tasks.${index}.result`, message: "Invalid input: expected string, received undefined" }
        : { code: "invalid", path: `tasks.${index}.result`, message: "Invalid task result." });
    }
    if (cleanup !== "none" && cleanup !== "complete" && cleanup !== "unknown") {
      issues.push(cleanup === undefined
        ? { code: "missing", path: `tasks.${index}.cleanup`, message: "Invalid input: expected string, received undefined" }
        : { code: "invalid", path: `tasks.${index}.cleanup`, message: "Invalid cleanup." });
    }
    if (taskTextDigestValue.ok && !isSha256(taskTextDigestValue.value)) issues.push({ code: "invalid", path: `tasks.${index}.taskTextDigest`, message: "taskTextDigest must be sha256 hex." });
    if (taskId.ok && taskIds.has(taskId.value)) issues.push({ code: "invalid", path: `tasks.${index}.taskId`, message: `Duplicate taskId: ${taskId.value}.` });
    if (taskId.ok) taskIds.add(taskId.value);
    const artifacts: string[] = [];
    if (artifactsRaw.ok) {
      for (const [artifactIndex, artifact] of artifactsRaw.value.entries()) {
        const parsed = readString(artifact, `tasks.${index}.artifacts.${artifactIndex}`);
        collect(issues, parsed);
        if (parsed.ok) {
          const escape = safeRelativePath(parsed.value, `tasks.${index}.artifacts.${artifactIndex}`);
          if (escape) issues.push(escape);
          else artifacts.push(parsed.value);
        }
      }
    }
    let invocation: EvidenceInvocation | null = null;
    if (record.value.invocation !== null && record.value.invocation !== undefined) {
      const invocationRaw = readObject(record.value.invocation, `tasks.${index}.invocation`);
      if (!invocationRaw.ok) issues.push(...invocationRaw.issues);
      else {
        issues.push(...extraKeys(invocationRaw.value, ["command", "status", "recordedAt"], `tasks.${index}.invocation`));
        const command = readString(invocationRaw.value.command, `tasks.${index}.invocation.command`);
        const recordedAt = readString(invocationRaw.value.recordedAt, `tasks.${index}.invocation.recordedAt`);
        collect(issues, command);
        collect(issues, recordedAt);
        const status = invocationRaw.value.status;
        if (status !== "unknown" && (typeof status !== "number" || !Number.isInteger(status))) {
          issues.push(status === undefined
            ? { code: "missing", path: `tasks.${index}.invocation.status`, message: "Invalid input: expected number, received undefined" }
            : { code: "invalid", path: `tasks.${index}.invocation.status`, message: "Invalid invocation status." });
        } else if (command.ok && recordedAt.ok) {
          invocation = { command: command.value, status, recordedAt: recordedAt.value };
        }
      }
    }
    let manualGate: EvidenceManualGate | null = null;
    if (record.value.manualGate !== null && record.value.manualGate !== undefined) {
      const gateRaw = readObject(record.value.manualGate, `tasks.${index}.manualGate`);
      if (!gateRaw.ok) issues.push(...gateRaw.issues);
      else {
        const reason = readString(gateRaw.value.reason, `tasks.${index}.manualGate.reason`);
        const disposition = readString(gateRaw.value.disposition, `tasks.${index}.manualGate.disposition`);
        collect(issues, reason);
        collect(issues, disposition);
        if (reason.ok && disposition.ok) manualGate = { reason: reason.value, disposition: disposition.value };
      }
    }
    if (boundary.ok && boundary.value.kind === "named-entrypoint" && invocation == null && result === "complete") {
      issues.push({ code: "missing", path: `tasks.${index}.invocation`, message: "Complete named-entrypoint evidence requires invocation." });
    }
    if (requiredBoundary.ok && (requiredBoundary.value.kind === "manual" || requiredBoundary.value.kind === "external") && manualGate == null && result === "complete") {
      issues.push({ code: "missing", path: `tasks.${index}.manualGate`, message: "Complete manual/external evidence requires a manual gate." });
    }
    if (taskId.ok && taskTextDigestValue.ok && rowCandidate.ok && rowEnvironment.ok && requiredBoundary.ok && boundary.ok && (result === "complete" || result === "incomplete" || result === "unknown" || result === "red") && (cleanup === "none" || cleanup === "complete" || cleanup === "unknown")) {
      tasks.push({
        taskId: taskId.value,
        taskTextDigest: taskTextDigestValue.value,
        result,
        candidateId: rowCandidate.value,
        environmentId: rowEnvironment.value,
        requiredBoundary: requiredBoundary.value,
        boundary: boundary.value,
        invocation,
        artifacts,
        cleanup,
        manualGate,
      });
    }
  }
  const lanes: EvidenceLane[] = [];
  const laneNames = new Set<string>();
  for (const [index, item] of lanesRaw.value.entries()) {
    const record = readObject(item, `lanes.${index}`);
    if (!record.ok) { issues.push(...record.issues); continue; }
    const name = readString(record.value.name, `lanes.${index}.name`, SAFE_TOKEN);
    const kind = record.value.kind;
    const filesRaw = readArray(record.value.files, `lanes.${index}.files`);
    const pathPrefixRaw = record.value.pathPrefix;
    let pathPrefix = "";
    if (pathPrefixRaw !== undefined) {
      const parsedPrefix = readString(pathPrefixRaw, `lanes.${index}.pathPrefix`);
      collect(issues, parsedPrefix);
      if (parsedPrefix.ok) {
        const escape = safeRelativePath(parsedPrefix.value, `lanes.${index}.pathPrefix`);
        if (escape) issues.push(escape);
        else pathPrefix = parsedPrefix.value.replaceAll("\\", "/");
      }
    }
    collect(issues, name);
    collect(issues, filesRaw);
    if (kind !== "product" && kind !== "runner" && kind !== "evaluator" && kind !== "environment" && kind !== "raw-bundle" && kind !== "replay" && kind !== "terminal") {
      issues.push(kind === undefined
        ? { code: "missing", path: `lanes.${index}.kind`, message: "Invalid input: expected string, received undefined" }
        : { code: "invalid", path: `lanes.${index}.kind`, message: "Invalid lane kind." });
    }
    if (name.ok && laneNames.has(name.value)) issues.push({ code: "invalid", path: `lanes.${index}.name`, message: `Duplicate lane name: ${name.value}.` });
    if (name.ok) laneNames.add(name.value);
    const files: EvidenceLaneFile[] = [];
    if (filesRaw.ok) {
      for (const [fileIndex, file] of filesRaw.value.entries()) {
        const rowPath = `lanes.${index}.files.${fileIndex}`;
        const fileRaw = Array.isArray(file)
          ? file.length === 3
            ? { ok: true as const, value: { path: file[0], bytes: file[1], digest: file[2] } }
            : failIssues([{ code: "invalid", path: rowPath, message: "Compact lane file must contain exactly path, bytes, and digest." }])
          : readObject(file, rowPath);
        if (!fileRaw.ok) { issues.push(...fileRaw.issues); continue; }
        const filePath = readString(fileRaw.value.path, `lanes.${index}.files.${fileIndex}.path`);
        const bytes = readInt(fileRaw.value.bytes, `lanes.${index}.files.${fileIndex}.bytes`);
        const digest = readString(fileRaw.value.digest, `lanes.${index}.files.${fileIndex}.digest`);
        collect(issues, filePath);
        collect(issues, bytes);
        collect(issues, digest);
        if (filePath.ok) {
          const escape = safeRelativePath(filePath.value, `lanes.${index}.files.${fileIndex}.path`);
          if (escape) issues.push(escape);
        }
        if (digest.ok && !isSha256(digest.value)) issues.push({ code: "invalid", path: `lanes.${index}.files.${fileIndex}.digest`, message: "digest must be sha256 hex." });
        if (filePath.ok && bytes.ok && digest.ok) {
          const normalized = filePath.value.replaceAll("\\", "/");
          files.push({ path: pathPrefix === "" ? normalized : `${pathPrefix}/${normalized}`, bytes: bytes.value, digest: digest.value });
        }
      }
    }
    if (name.ok && (kind === "product" || kind === "runner" || kind === "evaluator" || kind === "environment" || kind === "raw-bundle" || kind === "replay" || kind === "terminal")) {
      lanes.push({ name: name.value, kind, files });
    }
  }
  if (tasks.length > MAX_TASKS || lanes.length > MAX_LANES) issues.push({ code: "invalid", path: "<root>", message: "Too many tasks or lanes." });
  if (issues.length > 0 || !maxFiles.ok || !maxBytes.ok) return failIssues(issues);
  return {
    ok: true,
    value: {
      schemaVersion: OPENSPEC_EVIDENCE_SCHEMA_VERSION,
      changeId: changeId.value,
      candidateId: candidateId.value,
      environmentId: environmentId.value,
      retention: { maxFiles: maxFiles.value, maxBytes: maxBytes.value, exception },
      tasks,
      lanes,
      claims: claims.value,
    },
  };
}

export function effectsCoverRequired(actual: string[], required: string[]): boolean {
  const have = new Set(actual);
  return required.every((effect) => have.has(effect));
}

export function proofEnvelopeState(row: EvidenceTaskRow, currentCandidateId: string | null, currentEnvironmentId: string | null, currentDigest: string | null): "match" | "mismatch" | "stale" | "unknown" | "red" {
  if (row.result === "red") return "red";
  if (row.candidateId.trim() === "" || row.environmentId.trim() === "") return "unknown";
  if (currentDigest == null) return "unknown";
  if (row.taskTextDigest !== currentDigest) return "stale";
  if (currentCandidateId != null && row.candidateId !== currentCandidateId) return "stale";
  if (currentEnvironmentId != null && row.environmentId !== currentEnvironmentId) return "stale";
  if (row.boundary.kind !== row.requiredBoundary.kind || row.boundary.name !== row.requiredBoundary.name) return "mismatch";
  if (!effectsCoverRequired(row.boundary.effects, row.requiredBoundary.effects)) return "mismatch";
  if (row.result === "unknown") return "unknown";
  if (row.result === "incomplete") return "mismatch";
  return "match";
}

export function effectiveRetention(index: EvidenceIndex): { maxFiles: number; maxBytes: number; exception: boolean } {
  if (index.retention.exception != null) {
    return { maxFiles: index.retention.exception.maxFiles, maxBytes: index.retention.exception.maxBytes, exception: true };
  }
  return {
    maxFiles: Math.min(index.retention.maxFiles, DEFAULT_EVIDENCE_MAX_FILES),
    maxBytes: Math.min(index.retention.maxBytes, DEFAULT_EVIDENCE_MAX_BYTES),
    exception: false,
  };
}
