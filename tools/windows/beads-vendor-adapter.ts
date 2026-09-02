import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import { runPortableCommand } from "../../global/bin/portable-process.ts";
import {
  loadBeadsReleaseManifest,
  requireBeadsCapability,
} from "./beads-release.ts";
import type { BeadsCapability, BeadsReleaseManifest } from "./beads-release.ts";
import type { PortableCommandOptions, PortableCommandResult } from "../../global/bin/portable-process.ts";

type JsonRecord = Record<string, unknown>;
type BridgeOwnerClass = "current-project" | "opencode-kit";
type BridgeMetadata = {
  bridgeSchemaVersion: 1;
  kaizenSignalRef?: string;
  decisionRef?: string;
  projectRef?: string;
  ownerClass?: BridgeOwnerClass;
  changeRef?: string;
  taskRef?: string;
  sessionRef?: string;
};

type CommonRequest = {
  executablePath: string;
  projectRoot: string;
  timeoutMs?: number;
};

export type BeadsAdapterRequest = CommonRequest & (
  | { operation: "project-check" }
  | { operation: "project-enable"; prefix: string }
  | { operation: "project-disable" }
  | { operation: "list"; limit: number; correlation: Partial<BridgeMetadata> }
  | { operation: "ready"; limit: number; correlation: Partial<BridgeMetadata> }
  | { operation: "show"; id: string }
  | {
    operation: "create-feature";
    title: string;
    externalRef: string;
    metadata: Required<Pick<BridgeMetadata, "bridgeSchemaVersion" | "kaizenSignalRef" | "decisionRef" | "projectRef" | "ownerClass">>;
  }
  | { operation: "update-feature"; id: string; specId: string; changeRef: string }
  | { operation: "assign-feature"; id: string; assignee: string; taskRef: string; sessionRef: string }
  | { operation: "close-feature"; id: string; reason: string }
);

export type BeadsIssueFact = {
  id: string;
  status: string;
  priority: number;
  issueType: "feature";
  assignee: string | null;
  externalRef: string | null;
  specId: string | null;
  metadata: BridgeMetadata;
  dependencyCount: number;
  dependentCount: number;
  dependencies: Array<{
    id: string;
    status: string | null;
    issueType: string | null;
    dependencyType: string | null;
  }>;
};

type StreamFact = {
  bytes: number;
  sha256: string;
  truncated: boolean;
};

export type BeadsAdapterResponse = {
  schemaVersion: 1;
  operation: BeadsAdapterRequest["operation"];
  release: {
    version: string;
    buildCommit: string;
    platform: "windows";
    architecture: "amd64";
    executableBytes: number;
    executableSha256: string;
  };
  project: { rootSha256: string };
  process: {
    exitCode: number;
    signal: NodeJS.Signals | null;
    timedOut: false;
    cleanupState: "not-needed" | "terminal";
  };
  streams: { stdout: StreamFact; stderr: StreamFact };
  sideEffects: {
    kind: "none" | "project-init" | "beads-write";
    projectLocal: true;
    remote: false;
  };
  result:
    | { kind: "project"; initialized: true; prefix: string | null }
    | { kind: "project-disable-check"; canDisable: true; summary: BeadsStatusSummary }
    | { kind: "issues"; items: BeadsIssueFact[]; truncated: boolean };
  diagnostics: { messages: string[] };
};

export type BeadsAdapterFailure = Omit<BeadsAdapterResponse, "process" | "result"> & {
  process: {
    exitCode: number | null;
    signal: NodeJS.Signals | null;
    timedOut: boolean;
    cleanupState: "not-needed" | "terminal" | "unknown";
  };
  diagnostics: { code: string; messages: string[] };
};

export class BeadsAdapterError extends Error {
  readonly code: string;
  readonly failure?: BeadsAdapterFailure;

  constructor(message: string, code: string, options: { cause?: unknown; failure?: BeadsAdapterFailure } = {}) {
    super(message, options.cause == null ? undefined : { cause: options.cause });
    this.name = "BeadsAdapterError";
    this.code = code;
    this.failure = options.failure;
  }
}

export type BeadsAdapterDependencies = {
  inspectExecutable?: (file: string, manifest: BeadsReleaseManifest) => { bytes: number; sha256: string };
  inspectTrackedFile?: (file: string) => { sha256: string };
  runCommand?: (root: string, argv: readonly string[], options: PortableCommandOptions) => PortableCommandResult;
};

export type BeadsAdapterInvocation = {
  operation: BeadsAdapterRequest["operation"];
  argv: string[];
  capability: BeadsCapability;
  sideEffectKind: BeadsAdapterResponse["sideEffects"]["kind"];
  timeoutMs: number;
};

type BeadsStatusSummary = {
  total: number;
  open: number;
  inProgress: number;
  blocked: number;
  deferred: number;
  closed: number;
  ready: number;
};

const COMMON_KEYS = ["operation", "executablePath", "projectRoot"] as const;
const OPTIONAL_COMMON_KEYS = ["timeoutMs"] as const;
const BRIDGE_METADATA_KEYS = [
  "bridgeSchemaVersion",
  "kaizenSignalRef",
  "decisionRef",
  "projectRef",
  "ownerClass",
  "changeRef",
  "taskRef",
  "sessionRef",
] as const;
const INPUT_KEYS: Record<BeadsAdapterRequest["operation"], readonly string[]> = {
  "project-check": [],
  "project-enable": ["prefix"],
  "project-disable": [],
  list: ["limit", "correlation"],
  ready: ["limit", "correlation"],
  show: ["id"],
  "create-feature": ["title", "externalRef", "metadata"],
  "update-feature": ["id", "specId", "changeRef"],
  "assign-feature": ["id", "assignee", "taskRef", "sessionRef"],
  "close-feature": ["id", "reason"],
};
const STATUS_VALUES = new Set(["open", "in_progress", "blocked", "deferred", "closed", "pinned", "hooked"]);
const SAFE_REF = /^[A-Za-z][A-Za-z0-9:._-]{0,127}$/u;
const ISSUE_ID = /^[A-Za-z][A-Za-z0-9_-]{0,63}(?:\.[A-Za-z0-9_-]{1,32})*$/u;
const PREFIX = /^[A-Za-z][A-Za-z0-9_]{1,15}$/u;
const MAX_VENDOR_OUTPUT_BYTES = 250_000;
const MAX_DIAGNOSTIC_BYTES = 2_000;

function record(value: unknown, label: string): JsonRecord {
  if (value == null || typeof value !== "object" || Array.isArray(value)) throw new Error(`${label} must be an object.`);
  return value as JsonRecord;
}

function exactKeys(value: JsonRecord, required: readonly string[], optional: readonly string[], label: string): void {
  const allowed = new Set([...required, ...optional]);
  const missing = required.filter((key) => !(key in value));
  const extras = Object.keys(value).filter((key) => !allowed.has(key));
  if (missing.length > 0 || extras.length > 0) throw new Error(`${label} fields are invalid.`);
}

function boundedText(value: unknown, label: string, max: number): string {
  if (typeof value !== "string" || value !== value.trim() || value.length === 0 || value.length > max || /[\u0000-\u001f\u007f]/u.test(value)) {
    throw new Error(`${label} must be a trimmed bounded text value.`);
  }
  return value;
}

function safeRef(value: unknown, label: string): string {
  const text = boundedText(value, label, 128);
  if (!SAFE_REF.test(text) || text.includes("..")) throw new Error(`${label} must be a privacy-safe reference.`);
  return text;
}

function issueId(value: unknown): string {
  const id = boundedText(value, "id", 128);
  if (!ISSUE_ID.test(id) || id.startsWith("-")) throw new Error("id must be a bounded Beads identifier.");
  return id;
}

function integer(value: unknown, label: string, minimum: number, maximum: number): number {
  if (!Number.isInteger(value) || (value as number) < minimum || (value as number) > maximum) {
    throw new Error(`${label} must be an integer from ${minimum} through ${maximum}.`);
  }
  return value as number;
}

function absolutePath(value: unknown, label: string): string {
  if (typeof value !== "string" || value.trim() === "" || value.includes("\0") || !path.isAbsolute(value)) {
    throw new Error(`${label} must be an absolute path.`);
  }
  return path.resolve(value);
}

function parseMetadata(value: unknown, label: string, requireCreateFields: boolean): BridgeMetadata {
  const input = record(value, label);
  const required = requireCreateFields
    ? ["bridgeSchemaVersion", "kaizenSignalRef", "decisionRef", "projectRef", "ownerClass"]
    : [];
  exactKeys(input, required, BRIDGE_METADATA_KEYS, label);
  if (input.bridgeSchemaVersion != null && input.bridgeSchemaVersion !== 1) throw new Error(`${label}.bridgeSchemaVersion must be 1.`);
  const result: BridgeMetadata = { bridgeSchemaVersion: 1 };
  for (const key of ["kaizenSignalRef", "decisionRef", "projectRef", "changeRef", "taskRef", "sessionRef"] as const) {
    if (input[key] != null) result[key] = safeRef(input[key], `${label}.${key}`);
  }
  if (input.ownerClass != null) {
    if (input.ownerClass !== "current-project" && input.ownerClass !== "opencode-kit") {
      throw new Error(`${label}.ownerClass is invalid.`);
    }
    result.ownerClass = input.ownerClass;
  }
  return result;
}

function parseRequest(value: unknown): BeadsAdapterRequest {
  const input = record(value, "Beads adapter request");
  if (typeof input.operation !== "string" || !Object.hasOwn(INPUT_KEYS, input.operation)) {
    throw new BeadsAdapterError("Unsupported Beads adapter operation.", "unsupported-operation");
  }
  const operation = input.operation as BeadsAdapterRequest["operation"];
  exactKeys(input, [...COMMON_KEYS, ...INPUT_KEYS[operation]], OPTIONAL_COMMON_KEYS, "Beads adapter request");
  const common = {
    executablePath: absolutePath(input.executablePath, "executablePath"),
    operation,
    projectRoot: absolutePath(input.projectRoot, "projectRoot"),
    ...(input.timeoutMs == null ? {} : { timeoutMs: integer(input.timeoutMs, "timeoutMs", 1_000, 120_000) }),
  };
  switch (operation) {
    case "project-check":
    case "project-disable":
      return common as BeadsAdapterRequest;
    case "project-enable": {
      const prefix = boundedText(input.prefix, "prefix", 16);
      if (!PREFIX.test(prefix)) throw new Error("prefix must be a bounded safe Beads prefix.");
      return { ...common, operation, prefix };
    }
    case "list":
    case "ready":
      return {
        ...common,
        operation,
        limit: integer(input.limit, "limit", 1, 100),
        correlation: parseMetadata(input.correlation, "correlation", false),
      };
    case "show":
      return { ...common, operation, id: issueId(input.id) };
    case "create-feature":
      return {
        ...common,
        operation,
        title: boundedText(input.title, "title", 200),
        externalRef: safeRef(input.externalRef, "externalRef"),
        metadata: parseMetadata(input.metadata, "metadata", true) as Required<Pick<BridgeMetadata, "bridgeSchemaVersion" | "kaizenSignalRef" | "decisionRef" | "projectRef" | "ownerClass">>,
      };
    case "update-feature":
      return {
        ...common,
        operation,
        id: issueId(input.id),
        specId: safeRef(input.specId, "specId"),
        changeRef: safeRef(input.changeRef, "changeRef"),
      };
    case "assign-feature":
      return {
        ...common,
        operation,
        id: issueId(input.id),
        assignee: safeRef(input.assignee, "assignee"),
        taskRef: safeRef(input.taskRef, "taskRef"),
        sessionRef: safeRef(input.sessionRef, "sessionRef"),
      };
    case "close-feature":
      return { ...common, operation, id: issueId(input.id), reason: boundedText(input.reason, "reason", 200) };
  }
}

function metadataArgs(metadata: Partial<BridgeMetadata>): string[] {
  const result: string[] = [];
  for (const key of BRIDGE_METADATA_KEYS) {
    const value = metadata[key];
    if (value == null) continue;
    result.push("--metadata-field", `${key}=${String(value)}`);
  }
  return result;
}

type PlannedBeadsAdapterInvocation = BeadsAdapterInvocation & { request: BeadsAdapterRequest };

function planBeadsAdapterInvocation(value: unknown): PlannedBeadsAdapterInvocation {
  const request = parseRequest(value);
  const readGlobals = ["--json", "--sandbox", "--readonly", "--quiet"];
  const writeGlobals = ["--json", "--sandbox", "--quiet"];
  let argv: string[];
  let capability: BeadsCapability;
  let sideEffectKind: BeadsAdapterResponse["sideEffects"]["kind"] = "none";
  switch (request.operation) {
    case "project-check":
      argv = [...readGlobals, "where"];
      capability = "projectWhere";
      break;
    case "project-enable":
      argv = [
        "init", "--prefix", request.prefix, "--non-interactive", "--skip-agents", "--skip-hooks", "--setup-exclude",
        "--json", "--sandbox",
      ];
      capability = "projectInitEmbedded";
      sideEffectKind = "project-init";
      break;
    case "project-disable":
      argv = [...readGlobals, "status", "--no-activity"];
      capability = "projectStatus";
      break;
    case "list":
      argv = [...readGlobals, "list", "--type", "feature", "--all", "--limit", String(request.limit), "--sort", "id", ...metadataArgs(request.correlation)];
      capability = "featureListAllMetadata";
      break;
    case "ready":
      argv = [...readGlobals, "ready", "--type", "feature", "--limit", String(request.limit), "--sort", "priority", ...metadataArgs(request.correlation)];
      capability = "ready";
      break;
    case "show":
      argv = [...readGlobals, "show", `--id=${request.id}`];
      capability = "featureShow";
      break;
    case "create-feature":
      argv = [
        ...writeGlobals,
        "create", "--title", request.title, "--type", "feature", "--priority", "2", "--external-ref", request.externalRef,
        "--metadata", JSON.stringify(request.metadata), "--repo", ".",
      ];
      capability = "featureCreateAtomicCorrelation";
      sideEffectKind = "beads-write";
      break;
    case "update-feature":
      argv = [...writeGlobals, "update", request.id, "--spec-id", request.specId, "--set-metadata", `changeRef=${request.changeRef}`];
      capability = "featureUpdateExact";
      sideEffectKind = "beads-write";
      break;
    case "assign-feature":
      argv = [
        ...writeGlobals,
        "update", request.id, "--assignee", request.assignee,
        "--set-metadata", `taskRef=${request.taskRef}`, "--set-metadata", `sessionRef=${request.sessionRef}`,
      ];
      capability = "featureAssign";
      sideEffectKind = "beads-write";
      break;
    case "close-feature":
      argv = [...writeGlobals, "close", request.id, "--reason", request.reason];
      capability = "featureClose";
      sideEffectKind = "beads-write";
      break;
  }
  return {
    request,
    operation: request.operation,
    argv,
    capability,
    sideEffectKind,
    timeoutMs: request.timeoutMs ?? (request.operation === "project-enable" ? 120_000 : 30_000),
  };
}

export function buildBeadsAdapterInvocation(value: unknown): BeadsAdapterInvocation {
  const { request: _request, ...invocation } = planBeadsAdapterInvocation(value);
  return invocation;
}

function digestText(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function digestFile(file: string): string {
  const digest = crypto.createHash("sha256");
  const descriptor = fs.openSync(file, "r");
  const buffer = Buffer.allocUnsafe(1024 * 1024);
  try {
    for (;;) {
      const bytes = fs.readSync(descriptor, buffer, 0, buffer.length, null);
      if (bytes === 0) break;
      digest.update(buffer.subarray(0, bytes));
    }
  } finally {
    fs.closeSync(descriptor);
  }
  return digest.digest("hex");
}

function inspectExecutable(file: string, manifest: BeadsReleaseManifest): { bytes: number; sha256: string } {
  const stat = fs.lstatSync(file, { throwIfNoEntry: false });
  if (stat == null || !stat.isFile() || stat.isSymbolicLink()) throw new Error("not a regular executable file");
  if (path.basename(file).toLowerCase() !== manifest.release.executable.fileName) throw new Error("unexpected executable file name");
  const real = fs.realpathSync.native(file);
  if (path.resolve(real).toLowerCase() !== path.resolve(file).toLowerCase()) throw new Error("executable path is indirect");
  const sha256 = digestFile(file);
  if (stat.size !== manifest.release.executable.bytes || sha256 !== manifest.release.executable.sha256) {
    throw new Error("executable identity does not match the reviewed release");
  }
  return { bytes: stat.size, sha256 };
}

function resolveProjectRoot(
  request: BeadsAdapterRequest,
  manifest: BeadsReleaseManifest,
  inspectTrackedFile: (file: string) => { sha256: string } = (file) => ({ sha256: digestFile(file) }),
): string {
  const stat = fs.lstatSync(request.projectRoot, { throwIfNoEntry: false });
  if (stat == null || !stat.isDirectory() || stat.isSymbolicLink()) throw new Error("project root is not a regular directory");
  const root = fs.realpathSync.native(request.projectRoot);
  if (path.resolve(root).toLowerCase() !== path.resolve(request.projectRoot).toLowerCase()) throw new Error("project root is indirect");
  const git = fs.lstatSync(path.join(root, ".git"), { throwIfNoEntry: false });
  if (git == null || git.isSymbolicLink() || (!git.isDirectory() && !git.isFile())) throw new Error("project root has no direct Git marker");
  const beads = fs.lstatSync(path.join(root, ".beads"), { throwIfNoEntry: false });
  if (request.operation === "project-enable") {
    if (beads != null) throw new Error("project already contains Beads state");
    for (const tracked of manifest.initialization.requiredTrackedFiles) {
      const file = path.resolve(root, tracked.path);
      const fileStat = fs.lstatSync(file, { throwIfNoEntry: false });
      if (fileStat == null || !fileStat.isFile() || fileStat.isSymbolicLink() || inspectTrackedFile(file).sha256 !== tracked.sha256) {
        throw new Error("reviewed tracked initialization prerequisite is absent or drifted");
      }
    }
  } else if (beads == null || !beads.isDirectory() || beads.isSymbolicLink()) {
    throw new Error("project Beads state is absent or indirect");
  }
  return root;
}

function commandEnvironment(root: string): NodeJS.ProcessEnv {
  const environment = { ...process.env };
  for (const key of Object.keys(environment)) {
    if (/^(?:BEADS|BD)_(?:DB|DIR|DOLT|IGNORE_SCHEMA_SKEW|OTEL|ACTOR)/iu.test(key)) delete environment[key];
  }
  delete environment.CLAUDE_SESSION_ID;
  environment.BD_DISABLE_METRICS = "1";
  environment.BEADS_ACTOR = "opencode-kit-bridge";
  environment.BEADS_DIR = path.join(root, ".beads");
  environment.GIT_AUTHOR_EMAIL = "opencode-kit-bridge@localhost.invalid";
  return environment;
}

function streamFact(value: string): StreamFact {
  return {
    bytes: Buffer.byteLength(value),
    sha256: digestText(value),
    truncated: value.includes("<truncated>"),
  };
}

function safeDiagnostic(value: string, redactions: readonly string[]): string {
  let safe = value;
  for (const redaction of redactions.filter(Boolean).sort((left, right) => right.length - left.length)) {
    safe = safe.replaceAll(redaction, "<redacted>");
  }
  safe = safe
    .replace(/\b[A-Za-z]:[\\/][^\s"'<>]*/gu, "<path>")
    .replace(/\b(authorization|password|secret|token)\s*[:=]\s*[^\s,;]+/giu, "$1=<redacted>")
    .replace(/\bhttps?:\/\/[^\s/@]+:[^\s/@]+@/giu, "https://<redacted>@");
  if (Buffer.byteLength(safe) <= MAX_DIAGNOSTIC_BYTES) return safe.trim();
  return `${Buffer.from(safe).subarray(0, MAX_DIAGNOSTIC_BYTES).toString("utf8").trim()}\n<truncated>`;
}

function processState(result: PortableCommandResult): BeadsAdapterFailure["process"] {
  return {
    exitCode: result.status,
    signal: result.signal,
    timedOut: result.timedOut === true,
    cleanupState: result.cleanupState ?? "not-needed",
  };
}

function failureBase(
  plan: PlannedBeadsAdapterInvocation,
  manifest: BeadsReleaseManifest,
  identity: { bytes: number; sha256: string },
  root: string,
  result: PortableCommandResult,
  code: string,
  messages: string[],
): BeadsAdapterFailure {
  return {
    schemaVersion: 1,
    operation: plan.operation,
    release: {
      version: manifest.release.version,
      buildCommit: manifest.release.buildCommit,
      platform: manifest.release.platform,
      architecture: manifest.release.architecture,
      executableBytes: identity.bytes,
      executableSha256: identity.sha256,
    },
    project: { rootSha256: digestText(root.toLowerCase()) },
    process: processState(result),
    streams: { stdout: streamFact(result.stdout), stderr: streamFact(result.stderr) },
    sideEffects: { kind: plan.sideEffectKind, projectLocal: true, remote: false },
    diagnostics: { code, messages },
  };
}

function parseJson(stdout: string): unknown {
  if (Buffer.byteLength(stdout) > MAX_VENDOR_OUTPUT_BYTES || stdout.includes("<truncated>")) {
    throw new BeadsAdapterError("Beads output exceeded the adapter bound.", "output-too-large");
  }
  try {
    return JSON.parse(stdout);
  } catch (cause) {
    throw new BeadsAdapterError("Beads returned invalid JSON.", "invalid-vendor-json", { cause });
  }
}

function optionalString(value: unknown, label: string): string | null {
  if (value == null || value === "") return null;
  return boundedText(value, label, 256);
}

function optionalSafeRef(value: unknown, label: string): string | null {
  if (value == null || value === "") return null;
  return safeRef(value, label);
}

function nonNegative(value: unknown): number {
  return Number.isInteger(value) && (value as number) >= 0 ? value as number : 0;
}

function requiredNonNegative(value: unknown, label: string): number {
  if (!Number.isInteger(value) || (value as number) < 0) throw new Error(`${label} must be a non-negative integer.`);
  return value as number;
}

function outputMetadata(value: unknown): BridgeMetadata {
  let source = value;
  if (typeof source === "string") {
    try {
      source = JSON.parse(source);
    } catch (cause) {
      throw new BeadsAdapterError("Beads issue metadata is invalid JSON.", "invalid-vendor-json", { cause });
    }
  }
  if (!("bridgeSchemaVersion" in record(source, "Beads issue metadata"))) {
    throw new Error("Beads issue metadata has no bridge schema identity.");
  }
  const metadata = parseMetadata(source, "Beads issue metadata", true);
  if (metadata.bridgeSchemaVersion !== 1) throw new Error("Beads issue metadata is outside bridge schema 1.");
  return metadata;
}

function dependencyFacts(value: unknown): BeadsIssueFact["dependencies"] {
  if (value == null) return [];
  if (!Array.isArray(value) || value.length > 100) throw new Error("Beads dependency output is invalid or unbounded.");
  return value.map((item) => {
    const dep = record(item, "Beads dependency");
    return {
      id: issueId(dep.id),
      status: optionalString(dep.status, "dependency.status"),
      issueType: optionalString(dep.issue_type, "dependency.issue_type"),
      dependencyType: optionalString(dep.dependency_type, "dependency.dependency_type"),
    };
  });
}

function issueFact(value: unknown): BeadsIssueFact {
  const issue = record(value, "Beads issue");
  const status = boundedText(issue.status, "issue.status", 32);
  if (!STATUS_VALUES.has(status)) throw new Error("Beads issue status is unsupported.");
  if (issue.issue_type !== "feature") throw new Error("Beads issue output is not a feature.");
  return {
    id: issueId(issue.id),
    status,
    priority: integer(issue.priority, "issue.priority", 0, 4),
    issueType: "feature",
    assignee: optionalSafeRef(issue.assignee, "issue.assignee"),
    externalRef: optionalSafeRef(issue.external_ref, "issue.external_ref"),
    specId: optionalSafeRef(issue.spec_id, "issue.spec_id"),
    metadata: outputMetadata(issue.metadata),
    dependencyCount: nonNegative(issue.dependency_count),
    dependentCount: nonNegative(issue.dependent_count),
    dependencies: dependencyFacts(issue.dependencies),
  };
}

function issueRows(value: unknown, operation: BeadsAdapterRequest["operation"]): unknown[] {
  if (Array.isArray(value)) return value;
  if (operation === "create-feature") return [value];
  const row = record(value, "Beads issue output");
  if (Array.isArray(row.issues)) return row.issues;
  if (Array.isArray(row.closed)) return row.closed;
  throw new Error("Beads issue output shape is unsupported.");
}

function statusSummary(value: unknown): BeadsStatusSummary {
  const outer = record(value, "Beads status output");
  const summary = record(outer.summary, "Beads status summary");
  return {
    total: requiredNonNegative(summary.total_issues, "status.total_issues"),
    open: requiredNonNegative(summary.open_issues, "status.open_issues"),
    inProgress: requiredNonNegative(summary.in_progress_issues, "status.in_progress_issues"),
    blocked: requiredNonNegative(summary.blocked_issues, "status.blocked_issues"),
    deferred: requiredNonNegative(summary.deferred_issues, "status.deferred_issues"),
    closed: requiredNonNegative(summary.closed_issues, "status.closed_issues"),
    ready: requiredNonNegative(summary.ready_issues, "status.ready_issues"),
  };
}

function responseResult(
  plan: PlannedBeadsAdapterInvocation,
  parsed: unknown,
  root: string,
  stderr: string,
): BeadsAdapterResponse["result"] {
  if (plan.request.operation === "project-check") {
    const where = record(parsed, "Beads where output");
    const actual = optionalString(where.path, "where.path");
    if (actual == null || path.resolve(actual).toLowerCase() !== path.join(root, ".beads").toLowerCase()) {
      throw new Error("Beads where output does not match the canonical project store.");
    }
    const prefix = optionalString(where.prefix, "where.prefix");
    if (prefix != null && !PREFIX.test(prefix)) throw new Error("Beads where prefix is invalid.");
    return { kind: "project", initialized: true, prefix };
  }
  if (plan.request.operation === "project-enable") {
    record(parsed, "Beads init output");
    return { kind: "project", initialized: true, prefix: plan.request.prefix };
  }
  if (plan.request.operation === "project-disable") {
    return { kind: "project-disable-check", canDisable: true, summary: statusSummary(parsed) };
  }
  const rows = issueRows(parsed, plan.operation);
  if (rows.length > 100) throw new Error("Beads issue output exceeded the item bound.");
  return {
    kind: "issues",
    items: rows.map(issueFact),
    truncated: /Showing\s+\d+\s+of\s+\d+/iu.test(stderr),
  };
}

export function runBeadsAdapter(value: unknown, dependencies: BeadsAdapterDependencies = {}): BeadsAdapterResponse {
  let plan: PlannedBeadsAdapterInvocation;
  try {
    plan = planBeadsAdapterInvocation(value);
  } catch (cause) {
    if (cause instanceof BeadsAdapterError) throw cause;
    throw new BeadsAdapterError("Beads adapter request is invalid.", "invalid-request", { cause });
  }
  let manifest: BeadsReleaseManifest;
  try {
    manifest = loadBeadsReleaseManifest();
    requireBeadsCapability(manifest, plan.capability, "production");
  } catch (cause) {
    throw new BeadsAdapterError("Beads release contract is unavailable or unsupported.", "release-contract-mismatch", { cause });
  }
  let identity: { bytes: number; sha256: string };
  let root: string;
  try {
    identity = (dependencies.inspectExecutable ?? inspectExecutable)(plan.request.executablePath, manifest);
    root = resolveProjectRoot(plan.request, manifest, dependencies.inspectTrackedFile);
  } catch (cause) {
    throw new BeadsAdapterError("Beads executable or project identity check failed.", "identity-mismatch", { cause });
  }
  const runCommand = dependencies.runCommand ?? runPortableCommand;
  const result = runCommand(root, [plan.request.executablePath, ...plan.argv], {
    capture: true,
    env: commandEnvironment(root),
    timeoutMs: plan.timeoutMs,
  });
  const redactions = [root, plan.request.projectRoot, plan.request.executablePath];
  if (plan.request.operation === "create-feature") redactions.push(plan.request.title);
  if (plan.request.operation === "close-feature") redactions.push(plan.request.reason);
  if (result.timedOut === true || result.error != null || result.status !== 0 || result.cleanupState === "unknown") {
    const code = result.cleanupState === "unknown" ? "writer-liveness-unknown" : result.timedOut === true ? "timeout" : "vendor-failed";
    const messages = [result.stderr, result.error?.message ?? ""].map((item) => safeDiagnostic(item, redactions)).filter(Boolean);
    const failure = failureBase(plan, manifest, identity, root, result, code, messages);
    const cause = result.error ?? new Error(messages[0] ?? `Beads exited ${String(result.status)}.`);
    throw new BeadsAdapterError(`Beads ${plan.operation} failed.`, code, { cause, failure });
  }
  let parsed: unknown;
  let projected: BeadsAdapterResponse["result"];
  try {
    parsed = parseJson(result.stdout);
    projected = responseResult(plan, parsed, root, result.stderr);
  } catch (cause) {
    const code = cause instanceof BeadsAdapterError ? cause.code : "invalid-vendor-output";
    const messages = [safeDiagnostic(result.stderr, redactions)].filter(Boolean);
    const failure = failureBase(plan, manifest, identity, root, result, code, messages);
    throw new BeadsAdapterError("Beads returned an unsupported bounded output.", code, { cause, failure });
  }
  return {
    schemaVersion: 1,
    operation: plan.operation,
    release: {
      version: manifest.release.version,
      buildCommit: manifest.release.buildCommit,
      platform: manifest.release.platform,
      architecture: manifest.release.architecture,
      executableBytes: identity.bytes,
      executableSha256: identity.sha256,
    },
    project: { rootSha256: digestText(root.toLowerCase()) },
    process: {
      exitCode: result.status,
      signal: result.signal,
      timedOut: false,
      cleanupState: result.cleanupState === "terminal" ? "terminal" : "not-needed",
    },
    streams: { stdout: streamFact(result.stdout), stderr: streamFact(result.stderr) },
    sideEffects: { kind: plan.sideEffectKind, projectLocal: true, remote: false },
    result: projected,
    diagnostics: {
      messages: result.stderr.trim() === "" ? [] : [safeDiagnostic(result.stderr, redactions)],
    },
  };
}
