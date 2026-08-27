export const COMPLEXITY_FORAGING_SCHEMA_VERSION = 1;
export const COMPLEXITY_FORAGING_DEFAULT_BOUNDS = {
  maxBytes: 512 * 1024 * 1024,
  maxFiles: 100_000,
  timeoutMs: 120_000,
} as const;
export const COMPLEXITY_FORAGING_HARD_BOUNDS = {
  maxBytes: 4 * 1024 * 1024 * 1024,
  maxFiles: 1_000_000,
  timeoutMs: 600_000,
} as const;

export const COMPLEXITY_SCOPE_CLASSES = [
  "maintained",
  "generated",
  "vendor",
  "evidence",
  "corpus",
  "dependency",
  "unknown",
] as const;

export const COMPLEXITY_CANDIDATE_KINDS = [
  "source",
  "test",
  "component",
  "manifest",
  "architecture-doc",
  "entrypoint",
  "public-surface",
  "proof",
] as const;

export const COMPLEXITY_DETECTORS = [
  "extension",
  "exact-name",
  "path-segment",
  "manifest-field",
  "reviewed-scope",
] as const;

export const COMPLEXITY_SUPPORT_STATES = [
  "complete",
  "partial",
  "unknown",
  "unsupported",
  "unreadable",
  "blocked",
] as const;

export const COMPLEXITY_DIAGNOSTIC_STAGES = [
  "root",
  "scope",
  "traversal",
  "read",
  "bounds",
  "cancellation",
  "detector",
] as const;

export type ComplexityScopeClass = typeof COMPLEXITY_SCOPE_CLASSES[number];
export type ComplexityCandidateKind = typeof COMPLEXITY_CANDIDATE_KINDS[number];
export type ComplexityDetector = typeof COMPLEXITY_DETECTORS[number];
export type ComplexitySupportState = typeof COMPLEXITY_SUPPORT_STATES[number];
export type ComplexityDiagnosticStage = typeof COMPLEXITY_DIAGNOSTIC_STAGES[number];

export type ComplexityRootIdentity = {
  kind: "sha256";
  digest: string;
};

export type ComplexityScopeEntry = {
  path: string;
  class: ComplexityScopeClass;
  reason: string;
};

export type ComplexityReviewedScope = {
  includes: ComplexityScopeEntry[];
  excludes: ComplexityScopeEntry[];
};

export type ComplexityForagingScopeFile = ComplexityReviewedScope & {
  recordType: "scope";
  schemaVersion: 1;
};

export type ComplexityForagingInput = {
  recordType: "input";
  schemaVersion: 1;
  root: ComplexityRootIdentity;
  scope: ComplexityReviewedScope;
  bounds: {
    maxFiles: number;
    maxBytes: number;
    timeoutMs: number;
  };
};

export type ComplexityForagingOutput = {
  recordType: "output";
  schemaVersion: 1;
  root: ComplexityRootIdentity;
  scope: ComplexityForagingInput["scope"];
  support: {
    state: ComplexitySupportState;
    unsupportedFields: string[];
    unknownFields: string[];
  };
  candidates: Array<{
    kind: ComplexityCandidateKind;
    path: string;
    evidence: {
      detector: ComplexityDetector;
      value: string;
    };
  }>;
  counts: {
    files: number;
    directories: number;
    bytes: number;
    lines: number;
    maintained: number;
    generated: number;
    vendor: number;
    evidence: number;
    corpus: number;
    dependency: number;
    unknown: number;
    unsupported: number;
    unreadable: number;
  };
  largestMaintainedFiles: Array<{
    path: string;
    bytes: number;
    lines: number;
  }>;
  topLevelConcentration: Array<{
    path: string;
    files: number;
    bytes: number;
    lines: number;
  }>;
  diagnostics: Array<{
    stage: ComplexityDiagnosticStage;
    path: string | null;
    cause: {
      name: string;
      code: string;
      message: string;
    };
  }>;
};

export type ComplexityForagingRecord = ComplexityForagingScopeFile | ComplexityForagingInput | ComplexityForagingOutput;

export class ComplexityForagingContractError extends Error {
  readonly field: string;

  constructor(field: string, message: string) {
    super(`${field}: ${message}`);
    this.name = "ComplexityForagingContractError";
    this.field = field;
  }
}

type UnknownRecord = Record<string, unknown>;

const MAX_ARRAY = 10_000;
const MAX_TEXT = 500;
const SAFE_FIELD = /^[a-z][a-z0-9._-]{0,199}$/u;
const SAFE_CAUSE_CODE = /^[A-Za-z0-9][A-Za-z0-9._-]{0,99}$/u;

function record(value: unknown, field: string): UnknownRecord {
  if (typeof value !== "object" || value == null || Array.isArray(value)) {
    throw new ComplexityForagingContractError(field, "must be an object");
  }
  return value as UnknownRecord;
}

function exactKeys(value: UnknownRecord, expected: readonly string[], field: string): void {
  const missing = expected.filter((key) => !(key in value));
  const extras = Object.keys(value).filter((key) => !expected.includes(key)).sort();
  if (missing.length > 0 || extras.length > 0) {
    const details = [
      missing.length === 0 ? null : `missing=${missing.join(",")}`,
      extras.length === 0 ? null : `unsupported=${extras.join(",")}`,
    ].filter((item): item is string => item != null).join(" ");
    throw new ComplexityForagingContractError(field, `has invalid fields: ${details}`);
  }
}

function string(value: unknown, field: string, pattern?: RegExp): string {
  if (typeof value !== "string" || value.trim() === "" || value.length > MAX_TEXT || /[\r\n\0]/u.test(value)) {
    throw new ComplexityForagingContractError(field, `must be a non-empty single-line string of at most ${MAX_TEXT} characters`);
  }
  if (pattern != null && !pattern.test(value)) {
    throw new ComplexityForagingContractError(field, "has an unsupported value");
  }
  return value;
}

function enumValue<T extends string>(value: unknown, allowed: readonly T[], field: string): T {
  const parsed = string(value, field);
  if (!allowed.includes(parsed as T)) {
    throw new ComplexityForagingContractError(field, `must be one of ${allowed.join(", ")}`);
  }
  return parsed as T;
}

function integer(value: unknown, field: string, maximum = Number.MAX_SAFE_INTEGER): number {
  if (!Number.isSafeInteger(value) || (value as number) < 0 || (value as number) > maximum) {
    throw new ComplexityForagingContractError(field, `must be an integer from 0 through ${maximum}`);
  }
  return value as number;
}

function positiveInteger(value: unknown, field: string, maximum: number): number {
  const parsed = integer(value, field, maximum);
  if (parsed === 0) throw new ComplexityForagingContractError(field, "must be greater than zero");
  return parsed;
}

function array(value: unknown, field: string): unknown[] {
  if (!Array.isArray(value) || value.length > MAX_ARRAY) {
    throw new ComplexityForagingContractError(field, `must be an array of at most ${MAX_ARRAY} items`);
  }
  return value;
}

function safeRelativePath(value: unknown, field: string): string {
  const parsed = string(value, field);
  if (parsed.includes("\\") || parsed.startsWith("/") || /^[A-Za-z]:/u.test(parsed)) {
    throw new ComplexityForagingContractError(field, "must be a forward-slash project-relative path");
  }
  if (parsed.split("/").some((part) => part === "" || part === "." || part === "..")) {
    throw new ComplexityForagingContractError(field, "must not contain empty, current, or parent segments");
  }
  return parsed;
}

function rootIdentity(value: unknown, field: string): ComplexityRootIdentity {
  const input = record(value, field);
  exactKeys(input, ["kind", "digest"], field);
  if (input.kind !== "sha256") throw new ComplexityForagingContractError(`${field}.kind`, "must be sha256");
  return {
    kind: "sha256",
    digest: string(input.digest, `${field}.digest`, /^[a-f0-9]{64}$/u),
  };
}

function scopeEntry(value: unknown, field: string): ComplexityScopeEntry {
  const input = record(value, field);
  exactKeys(input, ["path", "class", "reason"], field);
  return {
    path: safeRelativePath(input.path, `${field}.path`),
    class: enumValue(input.class, COMPLEXITY_SCOPE_CLASSES, `${field}.class`),
    reason: string(input.reason, `${field}.reason`),
  };
}

function scope(value: unknown, field: string): ComplexityForagingInput["scope"] {
  const input = record(value, field);
  exactKeys(input, ["includes", "excludes"], field);
  const parseEntries = (items: unknown, entryField: string): ComplexityScopeEntry[] => {
    const parsed = array(items, entryField).map((item, index) => scopeEntry(item, `${entryField}[${index}]`));
    const identities = parsed.map((item) => `${item.path}\0${item.class}`);
    if (new Set(identities).size !== identities.length) {
      throw new ComplexityForagingContractError(entryField, "must not repeat a path/class pair");
    }
    return parsed.sort((left, right) => left.path.localeCompare(right.path) || left.class.localeCompare(right.class));
  };
  return {
    includes: parseEntries(input.includes, `${field}.includes`),
    excludes: parseEntries(input.excludes, `${field}.excludes`),
  };
}

function bounds(value: unknown, field: string): ComplexityForagingInput["bounds"] {
  const input = record(value, field);
  exactKeys(input, ["maxFiles", "maxBytes", "timeoutMs"], field);
  return {
    maxFiles: positiveInteger(input.maxFiles, `${field}.maxFiles`, COMPLEXITY_FORAGING_HARD_BOUNDS.maxFiles),
    maxBytes: positiveInteger(input.maxBytes, `${field}.maxBytes`, COMPLEXITY_FORAGING_HARD_BOUNDS.maxBytes),
    timeoutMs: positiveInteger(input.timeoutMs, `${field}.timeoutMs`, COMPLEXITY_FORAGING_HARD_BOUNDS.timeoutMs),
  };
}

function schemaVersion(value: unknown): 1 {
  if (value !== COMPLEXITY_FORAGING_SCHEMA_VERSION) {
    throw new ComplexityForagingContractError("schemaVersion", `must equal ${COMPLEXITY_FORAGING_SCHEMA_VERSION}`);
  }
  return COMPLEXITY_FORAGING_SCHEMA_VERSION;
}

function inputRecord(value: UnknownRecord): ComplexityForagingInput {
  exactKeys(value, ["recordType", "schemaVersion", "root", "scope", "bounds"], "<root>");
  return {
    recordType: "input",
    schemaVersion: schemaVersion(value.schemaVersion),
    root: rootIdentity(value.root, "root"),
    scope: scope(value.scope, "scope"),
    bounds: bounds(value.bounds, "bounds"),
  };
}

function scopeFileRecord(value: UnknownRecord): ComplexityForagingScopeFile {
  exactKeys(value, ["recordType", "schemaVersion", "includes", "excludes"], "<root>");
  const reviewedScope = scope({ includes: value.includes, excludes: value.excludes }, "scope");
  return {
    recordType: "scope",
    schemaVersion: schemaVersion(value.schemaVersion),
    includes: reviewedScope.includes,
    excludes: reviewedScope.excludes,
  };
}

function fieldList(value: unknown, field: string): string[] {
  const parsed = array(value, field).map((item, index) => string(item, `${field}[${index}]`, SAFE_FIELD));
  if (new Set(parsed).size !== parsed.length) throw new ComplexityForagingContractError(field, "must not contain duplicates");
  return parsed.sort();
}

function support(value: unknown, field: string): ComplexityForagingOutput["support"] {
  const input = record(value, field);
  exactKeys(input, ["state", "unsupportedFields", "unknownFields"], field);
  return {
    state: enumValue(input.state, COMPLEXITY_SUPPORT_STATES, `${field}.state`),
    unsupportedFields: fieldList(input.unsupportedFields, `${field}.unsupportedFields`),
    unknownFields: fieldList(input.unknownFields, `${field}.unknownFields`),
  };
}

function candidates(value: unknown, field: string): ComplexityForagingOutput["candidates"] {
  const parsed = array(value, field).map((item, index) => {
    const candidateField = `${field}[${index}]`;
    const input = record(item, candidateField);
    exactKeys(input, ["kind", "path", "evidence"], candidateField);
    const evidence = record(input.evidence, `${candidateField}.evidence`);
    exactKeys(evidence, ["detector", "value"], `${candidateField}.evidence`);
    return {
      kind: enumValue(input.kind, COMPLEXITY_CANDIDATE_KINDS, `${candidateField}.kind`),
      path: safeRelativePath(input.path, `${candidateField}.path`),
      evidence: {
        detector: enumValue(evidence.detector, COMPLEXITY_DETECTORS, `${candidateField}.evidence.detector`),
        value: string(evidence.value, `${candidateField}.evidence.value`),
      },
    };
  });
  const identities = parsed.map((item) => `${item.kind}\0${item.path}\0${item.evidence.detector}\0${item.evidence.value}`);
  if (new Set(identities).size !== identities.length) throw new ComplexityForagingContractError(field, "must not contain duplicates");
  return parsed.sort((left, right) => left.kind.localeCompare(right.kind)
    || left.path.localeCompare(right.path)
    || left.evidence.detector.localeCompare(right.evidence.detector)
    || left.evidence.value.localeCompare(right.evidence.value));
}

const COUNT_FIELDS = [
  "files",
  "directories",
  "bytes",
  "lines",
  "maintained",
  "generated",
  "vendor",
  "evidence",
  "corpus",
  "dependency",
  "unknown",
  "unsupported",
  "unreadable",
] as const;

function counts(value: unknown, field: string): ComplexityForagingOutput["counts"] {
  const input = record(value, field);
  exactKeys(input, COUNT_FIELDS, field);
  return Object.fromEntries(COUNT_FIELDS.map((name) => [name, integer(input[name], `${field}.${name}`)])) as ComplexityForagingOutput["counts"];
}

function largestFiles(value: unknown, field: string): ComplexityForagingOutput["largestMaintainedFiles"] {
  return array(value, field).map((item, index) => {
    const itemField = `${field}[${index}]`;
    const input = record(item, itemField);
    exactKeys(input, ["path", "bytes", "lines"], itemField);
    return {
      path: safeRelativePath(input.path, `${itemField}.path`),
      bytes: integer(input.bytes, `${itemField}.bytes`),
      lines: integer(input.lines, `${itemField}.lines`),
    };
  }).sort((left, right) => right.bytes - left.bytes || right.lines - left.lines || left.path.localeCompare(right.path));
}

function concentration(value: unknown, field: string): ComplexityForagingOutput["topLevelConcentration"] {
  return array(value, field).map((item, index) => {
    const itemField = `${field}[${index}]`;
    const input = record(item, itemField);
    exactKeys(input, ["path", "files", "bytes", "lines"], itemField);
    const parsedPath = safeRelativePath(input.path, `${itemField}.path`);
    if (parsedPath.includes("/")) throw new ComplexityForagingContractError(`${itemField}.path`, "must identify one top-level entry");
    return {
      path: parsedPath,
      files: integer(input.files, `${itemField}.files`),
      bytes: integer(input.bytes, `${itemField}.bytes`),
      lines: integer(input.lines, `${itemField}.lines`),
    };
  }).sort((left, right) => right.bytes - left.bytes || right.files - left.files || left.path.localeCompare(right.path));
}

function diagnosticMessage(value: unknown, field: string): string {
  const parsed = string(value, field);
  if (/[A-Za-z]:[\\/]|\\\\|(?:^|\s)\/[A-Za-z0-9._-]/u.test(parsed)) {
    throw new ComplexityForagingContractError(field, "must not contain an absolute private path");
  }
  return parsed;
}

function diagnostics(value: unknown, field: string): ComplexityForagingOutput["diagnostics"] {
  return array(value, field).map((item, index) => {
    const itemField = `${field}[${index}]`;
    const input = record(item, itemField);
    exactKeys(input, ["stage", "path", "cause"], itemField);
    const cause = record(input.cause, `${itemField}.cause`);
    exactKeys(cause, ["name", "code", "message"], `${itemField}.cause`);
    return {
      stage: enumValue(input.stage, COMPLEXITY_DIAGNOSTIC_STAGES, `${itemField}.stage`),
      path: input.path == null ? null : safeRelativePath(input.path, `${itemField}.path`),
      cause: {
        name: string(cause.name, `${itemField}.cause.name`, /^[A-Za-z][A-Za-z0-9]*$/u),
        code: string(cause.code, `${itemField}.cause.code`, SAFE_CAUSE_CODE),
        message: diagnosticMessage(cause.message, `${itemField}.cause.message`),
      },
    };
  }).sort((left, right) => left.stage.localeCompare(right.stage)
    || (left.path ?? "").localeCompare(right.path ?? "")
    || left.cause.code.localeCompare(right.cause.code));
}

function outputRecord(value: UnknownRecord): ComplexityForagingOutput {
  exactKeys(value, [
    "recordType",
    "schemaVersion",
    "root",
    "scope",
    "support",
    "candidates",
    "counts",
    "largestMaintainedFiles",
    "topLevelConcentration",
    "diagnostics",
  ], "<root>");
  return {
    recordType: "output",
    schemaVersion: schemaVersion(value.schemaVersion),
    root: rootIdentity(value.root, "root"),
    scope: scope(value.scope, "scope"),
    support: support(value.support, "support"),
    candidates: candidates(value.candidates, "candidates"),
    counts: counts(value.counts, "counts"),
    largestMaintainedFiles: largestFiles(value.largestMaintainedFiles, "largestMaintainedFiles"),
    topLevelConcentration: concentration(value.topLevelConcentration, "topLevelConcentration"),
    diagnostics: diagnostics(value.diagnostics, "diagnostics"),
  };
}

export function parseComplexityForagingRecord(value: unknown): ComplexityForagingRecord {
  const input = record(value, "<root>");
  if (input.recordType === "scope") return scopeFileRecord(input);
  if (input.recordType === "input") return inputRecord(input);
  if (input.recordType === "output") return outputRecord(input);
  throw new ComplexityForagingContractError("recordType", "must be scope, input, or output");
}

export function stableComplexityForagingJson(value: unknown): string {
  return `${JSON.stringify(parseComplexityForagingRecord(value), null, 2)}\n`;
}
