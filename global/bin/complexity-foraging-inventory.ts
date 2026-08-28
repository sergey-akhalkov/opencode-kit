#!/usr/bin/env node
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

import {
  COMPLEXITY_FORAGING_DEFAULT_BOUNDS,
  COMPLEXITY_FORAGING_HARD_BOUNDS,
  ComplexityForagingContractError,
  parseComplexityForagingRecord,
  stableComplexityForagingJson,
  type ComplexityCandidateKind,
  type ComplexityForagingOutput,
  type ComplexityForagingScopeFile,
  type ComplexityScopeClass,
  type ComplexityScopeEntry,
} from "./complexity-foraging-contract.ts";

export type Options = {
  bounds: {
    maxFiles: number;
    maxBytes: number;
    timeoutMs: number;
  };
  cancelPath: string | null;
  format: "json" | "markdown";
  help: boolean;
  root: string | null;
  scopePath: string | null;
};

type ScanState = {
  candidates: Map<string, ComplexityForagingOutput["candidates"][number]>;
  counts: ComplexityForagingOutput["counts"];
  diagnostics: ComplexityForagingOutput["diagnostics"];
  effectiveExcludes: Map<string, ComplexityScopeEntry>;
  largestMaintainedFiles: ComplexityForagingOutput["largestMaintainedFiles"];
  maintainedBytesRead: number;
  sourcePaths: Set<string>;
  startedAt: number;
  topLevel: Map<string, { files: number; bytes: number; lines: number }>;
};

class ScanStopped extends Error {
  readonly code: string;
  readonly stage: "bounds" | "cancellation";

  constructor(stage: "bounds" | "cancellation", code: string, message: string) {
    super(message);
    this.name = stage === "cancellation" ? "CancellationError" : "BoundError";
    this.stage = stage;
    this.code = code;
  }
}

const SOURCE_EXTENSIONS = new Set([
  ".c", ".cc", ".cpp", ".cs", ".dart", ".ex", ".exs", ".fs", ".go", ".java", ".js", ".jsx",
  ".kt", ".kts", ".lua", ".mjs", ".mts", ".php", ".py", ".rb", ".rs", ".scala", ".swift",
  ".svelte", ".ts", ".tsx", ".vue",
]);
const TEXT_EXTENSIONS = new Set([...SOURCE_EXTENSIONS, ".json", ".jsonc", ".md", ".toml", ".yaml", ".yml", ".xml"]);
const MANIFEST_NAMES = new Set([
  "package.json", "Cargo.toml", "pyproject.toml", "go.mod", "pom.xml", "build.gradle", "build.gradle.kts",
  "Makefile", "CMakeLists.txt", "deno.json",
]);
const CONVENTIONAL_COMPONENTS = new Set(["app", "crates", "lib", "packages", "src"]);
const TEST_SEGMENTS = new Set(["__tests__", "spec", "test", "tests"]);
const GENERATED_DIRECTORIES = new Set([".next", ".nuxt", "build", "coverage", "dist", "out", "target"]);
const VENDOR_DIRECTORIES = new Set(["node_modules", "vendor"]);
const EVIDENCE_DIRECTORIES = new Set([".review-evidence", "evidence", "implementation-evidence", "runs"]);
const CORPUS_DIRECTORIES = new Set(["corpus"]);
const DEPENDENCY_DIRECTORIES = new Set([".venv", "deps"]);
const ENTRYPOINT_NAMES = /^(?:app|index|main)\.[A-Za-z0-9]+$/u;
const TEST_NAME = /(?:^test.*|\.(?:spec|test))\.(?:cjs|cts|js|jsx|mjs|mts|ts|tsx)$/iu;
const MAX_SCOPE_BYTES = 65_536;

function usage(): string {
  return [
    "Usage:",
    "  node global/bin/complexity-foraging-inventory.ts --help",
    "  node global/bin/complexity-foraging-inventory.ts --root <path> [options]",
    "",
    "Read-only, provider-free project foraging facts. Help performs no scan and creates no files.",
    "No repository files are modified.",
    "",
    "Options:",
    "  --root <path>       Explicit local project root (required for a scan).",
    "  --scope <path>      Optional versioned reviewed scope JSON; never generated heuristically.",
    "  --format <kind>     Stable json or markdown output (default json).",
    `  --max-files <n>     Traversed file bound (default ${COMPLEXITY_FORAGING_DEFAULT_BOUNDS.maxFiles}, hard cap ${COMPLEXITY_FORAGING_HARD_BOUNDS.maxFiles}).`,
    `  --max-bytes <n>     Maintained text-read bound (default ${COMPLEXITY_FORAGING_DEFAULT_BOUNDS.maxBytes}, hard cap ${COMPLEXITY_FORAGING_HARD_BOUNDS.maxBytes}).`,
    `  --timeout-ms <n>    Wall-clock bound (default ${COMPLEXITY_FORAGING_DEFAULT_BOUNDS.timeoutMs}, hard cap ${COMPLEXITY_FORAGING_HARD_BOUNDS.timeoutMs}).`,
    "  --cancel-file <path> Stop with blocked support when this caller-owned marker exists; the inventory never writes it.",
    "  --help, -h          Show this effect-free help.",
    "",
    "Output uses a SHA-256 root identity, project-relative paths, exact detector evidence, reviewed exclusions,",
    "and explicit complete/partial/unknown/unsupported/unreadable/blocked fallback states. It emits no source payload or semantic score.",
    "Complete, partial, unknown, and unsupported scans exit 0; invalid input, unreadable roots, cancellation, or exhausted bounds exit non-zero.",
  ].join("\n");
}

function valueAfter(args: string[], index: number, option: string): string {
  const value = args[index + 1];
  if (value == null || value.trim() === "" || value.startsWith("--")) throw new Error(`Missing value for ${option}`);
  return value;
}

function positiveInteger(value: string, option: string, maximum: number): number {
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 1 || parsed > maximum) {
    throw new Error(`${option} must be an integer from 1 through ${maximum}`);
  }
  return parsed;
}

function parseArgs(args: string[]): Options {
  const options: Options = {
    bounds: { ...COMPLEXITY_FORAGING_DEFAULT_BOUNDS },
    cancelPath: null,
    format: "json",
    help: false,
    root: null,
    scopePath: null,
  };
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index] ?? "";
    if (arg === "--help" || arg === "-h") options.help = true;
    else if (arg === "--root") {
      options.root = path.resolve(valueAfter(args, index, arg));
      index += 1;
    } else if (arg.startsWith("--root=")) options.root = path.resolve(arg.slice("--root=".length));
    else if (arg === "--scope") {
      options.scopePath = path.resolve(valueAfter(args, index, arg));
      index += 1;
    } else if (arg.startsWith("--scope=")) options.scopePath = path.resolve(arg.slice("--scope=".length));
    else if (arg === "--cancel-file") {
      options.cancelPath = path.resolve(valueAfter(args, index, arg));
      index += 1;
    } else if (arg.startsWith("--cancel-file=")) options.cancelPath = path.resolve(arg.slice("--cancel-file=".length));
    else if (arg === "--format") {
      const value = valueAfter(args, index, arg);
      if (value !== "json" && value !== "markdown") throw new Error("--format must be json or markdown");
      options.format = value;
      index += 1;
    } else if (arg.startsWith("--format=")) {
      const value = arg.slice("--format=".length);
      if (value !== "json" && value !== "markdown") throw new Error("--format must be json or markdown");
      options.format = value;
    } else if (arg === "--max-files") {
      options.bounds.maxFiles = positiveInteger(valueAfter(args, index, arg), arg, COMPLEXITY_FORAGING_HARD_BOUNDS.maxFiles);
      index += 1;
    } else if (arg === "--max-bytes") {
      options.bounds.maxBytes = positiveInteger(valueAfter(args, index, arg), arg, COMPLEXITY_FORAGING_HARD_BOUNDS.maxBytes);
      index += 1;
    } else if (arg === "--timeout-ms") {
      options.bounds.timeoutMs = positiveInteger(valueAfter(args, index, arg), arg, COMPLEXITY_FORAGING_HARD_BOUNDS.timeoutMs);
      index += 1;
    } else throw new Error(`Unsupported argument ${arg}`);
  }
  if (!options.help && options.root == null) throw new Error("Missing required --root <path>");
  return options;
}

function rootIdentity(root: string): ComplexityForagingOutput["root"] {
  const normalized = path.resolve(root).replaceAll("\\", "/");
  return { kind: "sha256", digest: crypto.createHash("sha256").update(normalized, "utf8").digest("hex") };
}

function readScope(scopePath: string | null): ComplexityForagingScopeFile {
  if (scopePath == null) return { recordType: "scope", schemaVersion: 1, includes: [], excludes: [] };
  let stat: fs.Stats;
  try {
    stat = fs.lstatSync(scopePath);
  } catch (error) {
    const details = cause(error, "Scope could not be read");
    throw new Error(`${details.message} (${details.name}/${details.code})`);
  }
  if (!stat.isFile() || stat.isSymbolicLink() || stat.size > MAX_SCOPE_BYTES) {
    throw new Error(`Scope must be a regular file no larger than ${MAX_SCOPE_BYTES} bytes`);
  }
  let value: unknown;
  try {
    value = JSON.parse(fs.readFileSync(scopePath, "utf8"));
  } catch (error) {
    const details = cause(error, "Scope JSON could not be parsed");
    throw new Error(`${details.message} (${details.name}/${details.code})`);
  }
  const parsed = parseComplexityForagingRecord(value);
  if (parsed.recordType !== "scope") throw new Error("Scope file recordType must be scope");
  return parsed;
}

function emptyCounts(): ComplexityForagingOutput["counts"] {
  return {
    files: 0,
    directories: 0,
    bytes: 0,
    lines: 0,
    maintained: 0,
    generated: 0,
    vendor: 0,
    evidence: 0,
    corpus: 0,
    dependency: 0,
    unknown: 0,
    unsupported: 0,
    unreadable: 0,
  };
}

function toRelative(root: string, target: string): string {
  return path.relative(root, target).replaceAll("\\", "/");
}

function isUnder(relative: string, parent: string): boolean {
  return relative === parent || relative.startsWith(`${parent}/`);
}

function bestMatch(relative: string, entries: ComplexityScopeEntry[]): ComplexityScopeEntry | null {
  return entries.filter((entry) => isUnder(relative, entry.path))
    .sort((left, right) => right.path.length - left.path.length || left.path.localeCompare(right.path))[0] ?? null;
}

function builtInClass(relative: string): ComplexityScopeClass | null {
  for (const segment of relative.split("/")) {
    if (GENERATED_DIRECTORIES.has(segment)) return "generated";
    if (VENDOR_DIRECTORIES.has(segment)) return "vendor";
    if (EVIDENCE_DIRECTORIES.has(segment)) return "evidence";
    if (CORPUS_DIRECTORIES.has(segment)) return "corpus";
    if (DEPENDENCY_DIRECTORIES.has(segment)) return "dependency";
    if (segment === ".git") return "unknown";
  }
  return null;
}

function classify(relative: string, scope: ComplexityForagingScopeFile): { class: ComplexityScopeClass; reason: string } {
  const excluded = bestMatch(relative, scope.excludes);
  if (excluded != null) return { class: excluded.class, reason: excluded.reason };
  const included = bestMatch(relative, scope.includes);
  if (included != null) return { class: included.class, reason: included.reason };
  const builtIn = builtInClass(relative);
  if (builtIn != null) return { class: builtIn, reason: "maintained exact directory detector" };
  if (scope.includes.length > 0) return { class: "unknown", reason: "outside reviewed include scope" };
  return { class: "maintained", reason: "default readable scope" };
}

function countLines(text: string): number {
  if (text.length === 0) return 0;
  const normalized = text.replaceAll("\r\n", "\n").replaceAll("\r", "\n");
  const newlines = normalized.split("\n").length - 1;
  return normalized.endsWith("\n") ? newlines : newlines + 1;
}

function cause(error: unknown, message = "Path could not be read"): ComplexityForagingOutput["diagnostics"][number]["cause"] {
  const value = typeof error === "object" && error != null ? error as { code?: unknown; message?: unknown; name?: unknown } : {};
  return {
    name: typeof value.name === "string" && /^[A-Za-z][A-Za-z0-9]*$/u.test(value.name) ? value.name : "Error",
    code: typeof value.code === "string" && /^[A-Za-z0-9][A-Za-z0-9._-]*$/u.test(value.code) ? value.code : "UNKNOWN",
    message,
  };
}

function assertControl(options: Options, state: ScanState): void {
  if (options.cancelPath != null && fs.existsSync(options.cancelPath)) {
    throw new ScanStopped("cancellation", "CANCELLED", "Caller cancellation marker was observed");
  }
  if (Date.now() - state.startedAt >= options.bounds.timeoutMs) {
    throw new ScanStopped("bounds", "TIMEOUT", `timeout bound reached (${options.bounds.timeoutMs}ms)`);
  }
}

function assertFileBudget(options: Options, state: ScanState): void {
  assertControl(options, state);
  if (state.counts.files >= options.bounds.maxFiles) {
    throw new ScanStopped("bounds", "MAX_FILES", `max-files bound reached (${options.bounds.maxFiles})`);
  }
}

function incrementClass(counts: ComplexityForagingOutput["counts"], scopeClass: ComplexityScopeClass): void {
  counts[scopeClass] += 1;
}

function addExclude(state: ScanState, pathValue: string, scopeClass: ComplexityScopeClass, reason: string): void {
  const key = `${pathValue}\0${scopeClass}`;
  if (!state.effectiveExcludes.has(key)) state.effectiveExcludes.set(key, { path: pathValue, class: scopeClass, reason });
}

function addCandidate(
  state: ScanState,
  kind: ComplexityCandidateKind,
  pathValue: string,
  detector: ComplexityForagingOutput["candidates"][number]["evidence"]["detector"],
  value: string,
): void {
  const key = `${kind}\0${pathValue}\0${detector}\0${value}`;
  if (!state.candidates.has(key)) state.candidates.set(key, { kind, path: pathValue, evidence: { detector, value } });
}

function isTestPath(relative: string): boolean {
  const segments = relative.split("/");
  return segments.some((segment) => TEST_SEGMENTS.has(segment)) || TEST_NAME.test(path.posix.basename(relative));
}

function detectFile(state: ScanState, relative: string, text: string | null): void {
  const base = path.posix.basename(relative);
  const extension = path.posix.extname(base).toLowerCase();
  const test = isTestPath(relative);
  if (SOURCE_EXTENSIONS.has(extension)) {
    addCandidate(state, test ? "test" : "source", relative, test ? "exact-name" : "extension", test ? base : extension);
    if (test) addCandidate(state, "proof", relative, "path-segment", relative.split("/").find((segment) => TEST_SEGMENTS.has(segment)) ?? base);
    else state.sourcePaths.add(relative);
  }
  if (MANIFEST_NAMES.has(base)) addCandidate(state, "manifest", relative, "exact-name", base);
  if (/^(?:ARCHITECTURE|DESIGN)\.md$/iu.test(base) || /(?:^|\/)docs\/architecture[^/]*\.md$/iu.test(relative)) {
    addCandidate(state, "architecture-doc", relative, "exact-name", base);
  }
  if (ENTRYPOINT_NAMES.test(base)) addCandidate(state, "entrypoint", relative, "exact-name", base);
  if (base === "package.json" && text != null) {
    try {
      const manifest = JSON.parse(text) as { exports?: unknown; main?: unknown; module?: unknown; types?: unknown };
      for (const field of ["exports", "main", "module", "types"] as const) {
        const target = manifest[field];
        if (typeof target !== "string") continue;
        const normalized = target.replaceAll("\\", "/").replace(/^\.\//u, "");
        if (normalized !== "" && !normalized.startsWith("/") && !normalized.split("/").includes("..")) {
          addCandidate(state, "public-surface", normalized, "manifest-field", field);
        }
      }
    } catch (error) {
      state.diagnostics.push({ stage: "detector", path: relative, cause: cause(error, "Manifest could not be parsed") });
    }
  }
}

function recordMaintainedFile(state: ScanState, relative: string, fullPath: string, size: number, options: Options): void {
  const extension = path.posix.extname(relative).toLowerCase();
  const textReadable = TEXT_EXTENSIONS.has(extension) || MANIFEST_NAMES.has(path.posix.basename(relative));
  let lines = 0;
  let text: string | null = null;
  if (textReadable) {
    if (state.maintainedBytesRead + size > options.bounds.maxBytes) {
      throw new ScanStopped("bounds", "MAX_BYTES", `max-bytes bound reached (${options.bounds.maxBytes})`);
    }
    state.maintainedBytesRead += size;
    assertControl(options, state);
    try {
      const content = fs.readFileSync(fullPath, "utf8");
      text = content;
      lines = countLines(content);
      state.counts.lines += lines;
      assertControl(options, state);
    } catch (error) {
      state.counts.unreadable += 1;
      state.diagnostics.push({ stage: "read", path: relative, cause: cause(error, "Maintained file could not be read") });
      return;
    }
  }
  state.largestMaintainedFiles.push({ path: relative, bytes: size, lines });
  const top = relative.split("/")[0] ?? relative;
  const summary = state.topLevel.get(top) ?? { files: 0, bytes: 0, lines: 0 };
  summary.files += 1;
  summary.bytes += size;
  summary.lines += lines;
  state.topLevel.set(top, summary);
  detectFile(state, relative, text);
}

function recordFile(state: ScanState, root: string, fullPath: string, scopeClass: ComplexityScopeClass, options: Options): void {
  const relative = toRelative(root, fullPath);
  assertFileBudget(options, state);
  let stat: fs.Stats;
  try {
    stat = fs.statSync(fullPath);
  } catch (error) {
    state.counts.unreadable += 1;
    state.diagnostics.push({ stage: "read", path: relative, cause: cause(error, "File metadata could not be read") });
    return;
  }
  state.counts.files += 1;
  state.counts.bytes += stat.size;
  incrementClass(state.counts, scopeClass);
  if (scopeClass === "maintained") recordMaintainedFile(state, relative, fullPath, stat.size, options);
}

function countClassifiedTree(
  root: string,
  directory: string,
  scopeClass: ComplexityScopeClass,
  state: ScanState,
  options: Options,
): void {
  assertControl(options, state);
  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(directory, { withFileTypes: true }).sort((left, right) => left.name.localeCompare(right.name));
  } catch (error) {
    state.counts.unreadable += 1;
    state.diagnostics.push({ stage: "read", path: toRelative(root, directory), cause: cause(error, "Directory could not be read") });
    return;
  }
  for (const entry of entries) {
    assertControl(options, state);
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      state.counts.directories += 1;
      countClassifiedTree(root, fullPath, scopeClass, state, options);
    } else if (entry.isFile()) recordFile(state, root, fullPath, scopeClass, options);
    else state.counts.unsupported += 1;
  }
}

function isAncestorOfReviewedEntry(relative: string, scope: ComplexityForagingScopeFile): boolean {
  return [...scope.includes, ...scope.excludes].some((entry) => entry.path.startsWith(`${relative}/`));
}

function walkDirectory(root: string, directory: string, scope: ComplexityForagingScopeFile, state: ScanState, options: Options): void {
  assertControl(options, state);
  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(directory, { withFileTypes: true }).sort((left, right) => left.name.localeCompare(right.name));
  } catch (error) {
    state.counts.unreadable += 1;
    state.diagnostics.push({ stage: "read", path: toRelative(root, directory) || null, cause: cause(error, "Directory could not be read") });
    return;
  }
  for (const entry of entries) {
    assertControl(options, state);
    const fullPath = path.join(directory, entry.name);
    const relative = toRelative(root, fullPath);
    const classification = classify(relative, scope);
    if (entry.isDirectory()) {
      state.counts.directories += 1;
      const shouldTraverse = classification.class === "maintained" || isAncestorOfReviewedEntry(relative, scope);
      if (shouldTraverse) walkDirectory(root, fullPath, scope, state, options);
      else {
        addExclude(state, relative, classification.class, classification.reason);
        countClassifiedTree(root, fullPath, classification.class, state, options);
      }
    } else if (entry.isFile()) recordFile(state, root, fullPath, classification.class, options);
    else state.counts.unsupported += 1;
  }
}

function componentCandidates(state: ScanState, scope: ComplexityForagingScopeFile): void {
  const sourceRoots = new Set([...state.sourcePaths].map((source) => source.split("/")[0] ?? source));
  const reviewedRoots = new Set<string>();
  for (const entry of scope.includes.filter((item) => item.class === "maintained")) {
    if ([...state.sourcePaths].some((source) => isUnder(source, entry.path))) {
      addCandidate(state, "component", entry.path, "reviewed-scope", entry.path);
      reviewedRoots.add(entry.path);
    }
  }
  for (const root of [...sourceRoots].sort()) {
    if (CONVENTIONAL_COMPONENTS.has(root) && !reviewedRoots.has(root)) addCandidate(state, "component", root, "exact-name", root);
  }
}

function supportState(state: ScanState, stopped: ScanStopped | null): ComplexityForagingOutput["support"] {
  const hasManifest = [...state.candidates.values()].some((candidate) => candidate.kind === "manifest");
  const hasDetectorError = state.diagnostics.some((diagnostic) => diagnostic.stage === "detector");
  const rootUnreadable = state.diagnostics.some((diagnostic) => diagnostic.stage === "read" && diagnostic.path == null);
  const unsupportedFields = hasManifest ? [] : ["ecosystem.detectors"];
  const unknownFields = [
    ...(state.counts.unknown > 0 ? ["unclassified-paths"] : []),
    ...(state.counts.unreadable > 0 ? ["unreadable-paths"] : []),
    ...(hasDetectorError ? ["detector-results"] : []),
    ...(stopped == null ? [] : ["traversal-complete"]),
  ];
  return {
    state: stopped != null
      ? "blocked"
      : rootUnreadable
        ? "unreadable"
      : state.counts.unreadable > 0 || hasDetectorError
      ? "partial"
      : state.counts.unknown > 0 && state.counts.maintained === 0
        ? "unknown"
        : state.counts.unknown > 0
          ? "partial"
      : hasManifest ? "complete" : "unsupported",
    unsupportedFields,
    unknownFields,
  };
}

function outputRecord(
  root: string,
  scope: ComplexityForagingScopeFile,
  state: ScanState,
  support: ComplexityForagingOutput["support"],
): ComplexityForagingOutput {
  return parseComplexityForagingRecord({
    recordType: "output",
    schemaVersion: 1,
    root: rootIdentity(root),
    scope: {
      includes: scope.includes,
      excludes: [...state.effectiveExcludes.values()],
    },
    support,
    candidates: [...state.candidates.values()],
    counts: state.counts,
    largestMaintainedFiles: state.largestMaintainedFiles
      .sort((left, right) => right.bytes - left.bytes || right.lines - left.lines || left.path.localeCompare(right.path))
      .slice(0, 20),
    topLevelConcentration: [...state.topLevel.entries()]
      .map(([pathValue, value]) => ({ path: pathValue, ...value }))
      .sort((left, right) => right.bytes - left.bytes || right.files - left.files || left.path.localeCompare(right.path))
      .slice(0, 20),
    diagnostics: state.diagnostics,
  }) as ComplexityForagingOutput;
}

function emptyState(scope: ComplexityForagingScopeFile): ScanState {
  return {
    candidates: new Map(),
    counts: emptyCounts(),
    diagnostics: [],
    effectiveExcludes: new Map(scope.excludes.map((entry) => [`${entry.path}\0${entry.class}`, entry])),
    largestMaintainedFiles: [],
    maintainedBytesRead: 0,
    sourcePaths: new Set(),
    startedAt: Date.now(),
    topLevel: new Map(),
  };
}

export function scan(options: Options): ComplexityForagingOutput {
  const root = options.root ?? "";
  const scope = readScope(options.scopePath);
  const state = emptyState(scope);
  let rootStat: fs.Stats;
  try {
    rootStat = fs.statSync(root);
  } catch (error) {
    state.counts.unreadable = 1;
    state.diagnostics.push({ stage: "root", path: null, cause: cause(error, "Root could not be read") });
    return outputRecord(root, scope, state, { state: "unreadable", unsupportedFields: [], unknownFields: ["root"] });
  }
  if (!rootStat.isDirectory()) {
    state.counts.unreadable = 1;
    state.diagnostics.push({
      stage: "root",
      path: null,
      cause: { name: "Error", code: "ROOT_NOT_DIRECTORY", message: "Root is not a directory" },
    });
    return outputRecord(root, scope, state, { state: "unreadable", unsupportedFields: [], unknownFields: ["root"] });
  }
  let stopped: ScanStopped | null = null;
  try {
    walkDirectory(root, root, scope, state, options);
    assertControl(options, state);
    componentCandidates(state, scope);
  } catch (error) {
    if (!(error instanceof ScanStopped)) throw error;
    stopped = error;
    state.diagnostics.push({
      stage: error.stage,
      path: null,
      cause: { name: error.name, code: error.code, message: error.message },
    });
  }
  for (const entry of state.effectiveExcludes.values()) {
    state.diagnostics.push({
      stage: "scope",
      path: entry.path,
      cause: {
        name: "ScopeNotice",
        code: "EXCLUSION_NOT_ABSENCE",
        message: "Reviewed exclusion is not proof that no relevant evidence exists",
      },
    });
  }
  return outputRecord(root, scope, state, supportState(state, stopped));
}

function markdownCell(value: string): string {
  return value.replaceAll("\\", "\\\\").replaceAll("|", "\\|");
}

export function renderMarkdown(value: ComplexityForagingOutput): string {
  const output = parseComplexityForagingRecord(value) as ComplexityForagingOutput;
  const scopeRows = [
    ...output.scope.includes.map((entry) => ["include", entry.path, entry.class, entry.reason]),
    ...output.scope.excludes.map((entry) => ["exclude", entry.path, entry.class, entry.reason]),
  ];
  return [
    "# Complexity Foraging Inventory",
    "",
    `- Schema: ${output.schemaVersion}`,
    `- Root: ${output.root.kind}:${output.root.digest}`,
    `- Support: ${output.support.state}`,
    `- Unsupported fields: ${output.support.unsupportedFields.join(", ") || "none"}`,
    `- Unknown fields: ${output.support.unknownFields.join(", ") || "none"}`,
    "",
    "## Counts",
    "",
    "| Class | Count |",
    "| --- | ---: |",
    ...Object.entries(output.counts).map(([name, count]) => `| ${name} | ${count} |`),
    "",
    "## Reviewed Scope",
    "",
    "| Mode | Path | Class | Reason |",
    "| --- | --- | --- | --- |",
    ...(scopeRows.length === 0 ? ["| none | none | none | none |"] : scopeRows.map((row) => `| ${row.map(markdownCell).join(" | ")} |`)),
    "",
    "## Candidates",
    "",
    "| Kind | Path | Detector | Evidence |",
    "| --- | --- | --- | --- |",
    ...(output.candidates.length === 0 ? ["| none | none | none | none |"] : output.candidates.map((candidate) => `| ${[candidate.kind, candidate.path, candidate.evidence.detector, candidate.evidence.value].map(markdownCell).join(" | ")} |`)),
    "",
    "## Largest Maintained Files",
    "",
    "| Path | Bytes | Lines |",
    "| --- | ---: | ---: |",
    ...(output.largestMaintainedFiles.length === 0 ? ["| none | 0 | 0 |"] : output.largestMaintainedFiles.map((file) => `| ${markdownCell(file.path)} | ${file.bytes} | ${file.lines} |`)),
    "",
    "## Top-Level Concentration",
    "",
    "| Path | Files | Bytes | Lines |",
    "| --- | ---: | ---: | ---: |",
    ...(output.topLevelConcentration.length === 0 ? ["| none | 0 | 0 | 0 |"] : output.topLevelConcentration.map((entry) => `| ${markdownCell(entry.path)} | ${entry.files} | ${entry.bytes} | ${entry.lines} |`)),
    "",
    "## Diagnostics",
    "",
    "| Stage | Path | Cause | Message |",
    "| --- | --- | --- | --- |",
    ...(output.diagnostics.length === 0 ? ["| none | none | none | none |"] : output.diagnostics.map((entry) => `| ${[entry.stage, entry.path ?? "<root>", `${entry.cause.name}/${entry.cause.code}`, entry.cause.message].map(markdownCell).join(" | ")} |`)),
    "",
  ].join("\n");
}

function redactRoot(message: string, root: string | null): string {
  if (root == null) return message;
  return [root, root.replaceAll("\\", "/"), root.replaceAll("/", "\\")]
    .filter((item) => item !== "")
    .reduce((current, item) => current.split(item).join("<redacted>"), message);
}

function main(args: string[]): number {
  const options = parseArgs(args);
  if (options.help) {
    process.stdout.write(`${usage()}\n`);
    return 0;
  }
  const output = scan(options);
  process.stdout.write(options.format === "json" ? stableComplexityForagingJson(output) : renderMarkdown(output));
  return output.support.state === "blocked" || output.support.state === "unreadable" ? 1 : 0;
}

if (process.argv[1] != null && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  let root: string | null = null;
  try {
    const args = process.argv.slice(2);
    const rootIndex = args.findIndex((arg) => arg === "--root" || arg.startsWith("--root="));
    root = rootIndex < 0
      ? null
      : args[rootIndex] === "--root"
        ? path.resolve(args[rootIndex + 1] ?? "")
        : path.resolve(args[rootIndex]!.slice("--root=".length));
    process.exitCode = main(args);
  } catch (error) {
    const message = error instanceof ComplexityForagingContractError || error instanceof Error ? error.message : String(error);
    process.stderr.write(`${redactRoot(message, root)}\n`);
    process.exitCode = 1;
  }
}
