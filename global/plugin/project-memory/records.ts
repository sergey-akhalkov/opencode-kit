import path from "node:path";
import type {
  ProjectMemoryCandidate,
  ProjectMemoryCandidateInput,
  ProjectMemoryConfidence,
  ProjectMemoryFingerprint,
  ProjectMemoryKind,
  ProjectMemoryLifecycleEvent,
  ProjectMemoryInvalidation,
  ProjectMemoryPromotion,
} from "./store.ts";

export const PROJECT_MEMORY_SCHEMA_VERSION = 1;
export const PROJECT_MEMORY_CANDIDATE_BYTES = 16 * 1024;
export const PROJECT_MEMORY_LIFECYCLE_BYTES = 4 * 1024;

const REF_PATTERN = /^(?:card|event)_[a-f0-9]{32}$/;

export class ProjectMemoryError extends Error {
  readonly code: string;

  constructor(code: string, message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "ProjectMemoryError";
    this.code = code;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === "object" && !Array.isArray(value);
}

export function byteLength(value: string): number {
  return Buffer.byteLength(value, "utf8");
}

function uniqueStrings(values: string[]): string[] {
  return [...new Set(values)];
}

export function requiredText(value: unknown, field: string): string {
  if (typeof value !== "string" || value.trim() === "") {
    throw new ProjectMemoryError("invalid-field", `Project memory field '${field}' must be a non-empty string.`);
  }
  return value.trim();
}

function stringList(value: unknown, field: string): string[] {
  if (!Array.isArray(value)) {
    throw new ProjectMemoryError("invalid-field", `Project memory field '${field}' must be an array.`);
  }
  return uniqueStrings(value.map((item) => requiredText(item, field)));
}

function exactKeys(value: Record<string, unknown>, expected: string[], surface: string): void {
  const actual = Object.keys(value).sort();
  const wanted = [...expected].sort();
  if (actual.length !== wanted.length || actual.some((key, index) => key !== wanted[index])) {
    throw new ProjectMemoryError("malformed-record", `Project memory ${surface} metadata has unexpected fields.`);
  }
}

export function isoTime(value: unknown, field: string): string {
  const text = requiredText(value, field);
  const time = Date.parse(text);
  if (!Number.isFinite(time) || new Date(time).toISOString() !== text) {
    throw new ProjectMemoryError("invalid-field", `Project memory field '${field}' must be an ISO timestamp.`);
  }
  return text;
}

export function normalizeRepositorySelector(value: string, field: string): string {
  const text = requiredText(value, field).replaceAll("\\", "/");
  if (
    path.posix.isAbsolute(text)
    || path.win32.isAbsolute(text)
    || /^[A-Za-z]:/.test(text)
    || text.startsWith("//")
    || text.split("/").includes("..")
  ) {
    throw new ProjectMemoryError("unsafe-selector", `Project memory field '${field}' must remain repository-relative.`);
  }
  const normalized = path.posix.normalize(text).replace(/^\.\//, "");
  if (normalized === "." || normalized === "" || normalized.startsWith("../")) {
    throw new ProjectMemoryError("unsafe-selector", `Project memory field '${field}' must remain repository-relative.`);
  }
  return normalized;
}

export function assertCandidateEnums(input: Pick<ProjectMemoryCandidateInput, "kind" | "confidence">): void {
  if (input.kind !== "tip" && input.kind !== "pitfall" && input.kind !== "procedure") {
    throw new ProjectMemoryError("invalid-field", "Project memory field 'kind' is invalid.");
  }
  if (input.confidence !== "low" && input.confidence !== "medium" && input.confidence !== "high") {
    throw new ProjectMemoryError("invalid-field", "Project memory field 'confidence' is invalid.");
  }
}

export function isProjectMemoryRef(value: string, prefix?: "card" | "event"): boolean {
  return REF_PATTERN.test(value) && (prefix == null || value.startsWith(`${prefix}_`));
}

export function candidateMarkdown(candidate: ProjectMemoryCandidate): string {
  const metadata = {
    schema_version: candidate.schemaVersion,
    event: candidate.event,
    event_ref: candidate.eventRef,
    card_ref: candidate.cardRef,
    title: candidate.title,
    kind: candidate.kind,
    created_at: candidate.createdAt,
    confidence: candidate.confidence,
    triggers: candidate.triggers,
    applies_to: candidate.appliesTo,
    evidence_paths: candidate.evidencePaths,
  };
  return [
    "# Project Memory Candidate",
    "",
    "```json",
    JSON.stringify(metadata, null, 2),
    "```",
    "",
    "## Technique",
    "",
    candidate.technique,
    "",
    "## Why",
    "",
    candidate.why,
    "",
    "## Evidence",
    "",
    candidate.evidence,
    "",
    "## Invalidated When",
    "",
    candidate.invalidatedWhen,
    "",
  ].join("\n");
}

export function promotionMarkdown(promotion: ProjectMemoryPromotion): string {
  const metadata = {
    schema_version: promotion.schemaVersion,
    event: promotion.event,
    event_ref: promotion.eventRef,
    card_ref: promotion.cardRef,
    created_at: promotion.createdAt,
    verified_at: promotion.verifiedAt,
    fingerprints: promotion.fingerprints,
  };
  return [
    "# Project Memory Promotion",
    "",
    "```json",
    JSON.stringify(metadata, null, 2),
    "```",
    "",
    "## Evidence",
    "",
    promotion.evidence,
    "",
  ].join("\n");
}

export function invalidationMarkdown(invalidation: ProjectMemoryInvalidation): string {
  const metadata = {
    schema_version: invalidation.schemaVersion,
    event: invalidation.event,
    event_ref: invalidation.eventRef,
    card_ref: invalidation.cardRef,
    created_at: invalidation.createdAt,
  };
  return [
    "# Project Memory Invalidation",
    "",
    "```json",
    JSON.stringify(metadata, null, 2),
    "```",
    "",
    "## Reason",
    "",
    invalidation.reason,
    "",
  ].join("\n");
}

function parseSections(body: string, names: string[]): Record<string, string> {
  const result: Record<string, string> = {};
  let remaining = body;
  for (let index = 0; index < names.length; index += 1) {
    const name = names[index];
    const marker = `## ${name}\n\n`;
    if (!remaining.startsWith(marker)) {
      throw new ProjectMemoryError("malformed-record", `Project memory record is missing section '${name}'.`);
    }
    remaining = remaining.slice(marker.length);
    const nextName = names[index + 1];
    if (nextName == null) {
      result[name] = requiredText(remaining, name);
      remaining = "";
    } else {
      const nextMarker = `\n\n## ${nextName}\n\n`;
      const nextIndex = remaining.indexOf(nextMarker);
      if (nextIndex < 0) throw new ProjectMemoryError("malformed-record", `Project memory record is missing section '${nextName}'.`);
      result[name] = requiredText(remaining.slice(0, nextIndex), name);
      remaining = remaining.slice(nextIndex + 2);
    }
  }
  if (remaining.trim() !== "") throw new ProjectMemoryError("malformed-record", "Project memory record has trailing content.");
  return result;
}

function parseRecord(value: string, heading: string): { metadata: Record<string, unknown>; body: string } {
  const prefix = `# ${heading}\n\n\`\`\`json\n`;
  if (!value.startsWith(prefix)) throw new ProjectMemoryError("malformed-record", `Project memory record heading '${heading}' is invalid.`);
  const fence = "\n```\n\n";
  const fenceIndex = value.indexOf(fence, prefix.length);
  if (fenceIndex < 0 || value.indexOf("```", fenceIndex + fence.length) >= 0) {
    throw new ProjectMemoryError("malformed-record", "Project memory record must contain exactly one JSON metadata block.");
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(value.slice(prefix.length, fenceIndex));
  } catch (error) {
    throw new ProjectMemoryError("malformed-record", "Project memory metadata is not valid JSON.", { cause: error });
  }
  if (!isRecord(parsed)) throw new ProjectMemoryError("malformed-record", "Project memory metadata must be an object.");
  return { metadata: parsed, body: value.slice(fenceIndex + fence.length) };
}

function parseAppliesTo(value: unknown): { paths: string[]; symbols: string[] } {
  if (!isRecord(value)) throw new ProjectMemoryError("malformed-record", "Project memory applies_to metadata is invalid.");
  exactKeys(value, ["paths", "symbols"], "applies_to");
  return {
    paths: stringList(value.paths, "applies_to.paths").map((item) => normalizeRepositorySelector(item, "applies_to.paths")),
    symbols: stringList(value.symbols, "applies_to.symbols"),
  };
}

function parseFingerprints(value: unknown): ProjectMemoryFingerprint[] {
  if (!Array.isArray(value)) throw new ProjectMemoryError("malformed-record", "Project memory fingerprints metadata is invalid.");
  return value.map((item) => {
    if (!isRecord(item)) throw new ProjectMemoryError("malformed-record", "Project memory fingerprint metadata is invalid.");
    exactKeys(item, ["path", "sha256"], "fingerprint");
    const digest = requiredText(item.sha256, "fingerprints.sha256");
    if (!/^[a-f0-9]{64}$/.test(digest)) throw new ProjectMemoryError("malformed-record", "Project memory fingerprint digest is invalid.");
    return {
      path: normalizeRepositorySelector(requiredText(item.path, "fingerprints.path"), "fingerprints.path"),
      sha256: digest,
    };
  });
}

export function parseCandidateMarkdown(value: string): ProjectMemoryCandidate {
  if (byteLength(value) > PROJECT_MEMORY_CANDIDATE_BYTES) throw new ProjectMemoryError("record-too-large", "Project memory candidate exceeds 16 KiB.");
  const { metadata, body } = parseRecord(value, "Project Memory Candidate");
  exactKeys(metadata, [
    "schema_version",
    "event",
    "event_ref",
    "card_ref",
    "title",
    "kind",
    "created_at",
    "confidence",
    "triggers",
    "applies_to",
    "evidence_paths",
  ], "candidate");
  if (metadata.schema_version !== PROJECT_MEMORY_SCHEMA_VERSION || metadata.event !== "candidate") {
    throw new ProjectMemoryError("unsupported-schema", "Project memory candidate schema is unsupported.");
  }
  const cardRef = requiredText(metadata.card_ref, "card_ref");
  const eventRef = requiredText(metadata.event_ref, "event_ref");
  if (!isProjectMemoryRef(cardRef, "card") || !isProjectMemoryRef(eventRef, "event")) {
    throw new ProjectMemoryError("malformed-record", "Project memory candidate refs are invalid.");
  }
  const kind = requiredText(metadata.kind, "kind") as ProjectMemoryKind;
  const confidence = requiredText(metadata.confidence, "confidence") as ProjectMemoryConfidence;
  assertCandidateEnums({ kind, confidence });
  const sections = parseSections(body, ["Technique", "Why", "Evidence", "Invalidated When"]);
  return {
    schemaVersion: 1,
    event: "candidate",
    eventRef,
    cardRef,
    title: requiredText(metadata.title, "title"),
    kind,
    createdAt: isoTime(metadata.created_at, "created_at"),
    confidence,
    triggers: stringList(metadata.triggers, "triggers"),
    appliesTo: parseAppliesTo(metadata.applies_to),
    evidencePaths: stringList(metadata.evidence_paths, "evidence_paths").map((item) => normalizeRepositorySelector(item, "evidence_paths")),
    technique: sections.Technique,
    why: sections.Why,
    evidence: sections.Evidence,
    invalidatedWhen: sections["Invalidated When"],
  };
}

export function parseLifecycleMarkdown(value: string): ProjectMemoryLifecycleEvent {
  if (byteLength(value) > PROJECT_MEMORY_LIFECYCLE_BYTES) throw new ProjectMemoryError("record-too-large", "Project memory lifecycle event exceeds 4 KiB.");
  const promotion = value.startsWith("# Project Memory Promotion\n");
  const { metadata, body } = parseRecord(value, promotion ? "Project Memory Promotion" : "Project Memory Invalidation");
  const expected = promotion
    ? ["schema_version", "event", "event_ref", "card_ref", "created_at", "verified_at", "fingerprints"]
    : ["schema_version", "event", "event_ref", "card_ref", "created_at"];
  exactKeys(metadata, expected, promotion ? "promotion" : "invalidation");
  if (metadata.schema_version !== PROJECT_MEMORY_SCHEMA_VERSION) {
    throw new ProjectMemoryError("unsupported-schema", "Project memory lifecycle schema is unsupported.");
  }
  const eventRef = requiredText(metadata.event_ref, "event_ref");
  const cardRef = requiredText(metadata.card_ref, "card_ref");
  if (!isProjectMemoryRef(eventRef, "event") || !isProjectMemoryRef(cardRef, "card")) {
    throw new ProjectMemoryError("malformed-record", "Project memory lifecycle refs are invalid.");
  }
  const createdAt = isoTime(metadata.created_at, "created_at");
  if (promotion) {
    if (metadata.event !== "promote") throw new ProjectMemoryError("malformed-record", "Project memory promotion event kind is invalid.");
    const sections = parseSections(body, ["Evidence"]);
    return {
      schemaVersion: 1,
      event: "promote",
      eventRef,
      cardRef,
      createdAt,
      verifiedAt: isoTime(metadata.verified_at, "verified_at"),
      fingerprints: parseFingerprints(metadata.fingerprints),
      evidence: sections.Evidence,
    };
  }
  if (metadata.event !== "invalidate") throw new ProjectMemoryError("malformed-record", "Project memory invalidation event kind is invalid.");
  const sections = parseSections(body, ["Reason"]);
  return {
    schemaVersion: 1,
    event: "invalidate",
    eventRef,
    cardRef,
    createdAt,
    reason: sections.Reason,
  };
}
