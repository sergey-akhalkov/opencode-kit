#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

import {
  DeliveryHorizonError,
  deliveryHorizonRelativePath,
  parseDeliveryHorizon,
  parseDeliveryHorizonDeclaration,
  type DeliveryHorizon,
} from "./openspec-change/delivery-horizon.ts";
import { SAFE_ID, digestText, safeRelativePath } from "./openspec-change/manifest.ts";

export const DELIVERY_TRAJECTORY_CONTEXT_SCHEMA_VERSION = 1;
export const DELIVERY_TRAJECTORY_CONTEXT_DEFAULT_BOUNDS = {
  maxArchives: 8,
  maxBytes: 2 * 1024 * 1024,
  timeoutMs: 30_000,
} as const;
export const DELIVERY_TRAJECTORY_CONTEXT_HARD_BOUNDS = {
  maxArchives: 64,
  maxBytes: 8 * 1024 * 1024,
  timeoutMs: 120_000,
} as const;

export type DeliveryTrajectoryContextErrorCode =
  | "aborted"
  | "archive-limit"
  | "byte-limit"
  | "current-archive-link-mismatch"
  | "invalid"
  | "invalid-argument"
  | "missing"
  | "path-escape"
  | "timeout"
  | "unreadable"
  | "unsupported";

export class DeliveryTrajectoryContextError extends Error {
  readonly code: DeliveryTrajectoryContextErrorCode;
  readonly field?: string;
  readonly limit?: number;
  readonly actual?: number;
  readonly status = "blocked" as const;

  constructor(
    message: string,
    options: {
      actual?: number;
      cause?: unknown;
      code?: DeliveryTrajectoryContextErrorCode;
      field?: string;
      limit?: number;
    } = {},
  ) {
    super(message);
    if (options.cause !== undefined) {
      (this as DeliveryTrajectoryContextError & { cause?: unknown }).cause = options.cause;
    }
    this.name = "DeliveryTrajectoryContextError";
    this.code = options.code ?? "invalid";
    this.field = options.field;
    this.limit = options.limit;
    this.actual = options.actual;
  }
}

export type DeliveryTrajectoryContextOptions = {
  archiveId: string;
  horizonId: string;
  maxArchives?: number;
  maxBytes?: number;
  root: string;
  signal?: AbortSignal;
  timeoutMs?: number;
};

export type DeliveryTrajectoryFileFact =
  | {
      bytes: number;
      path: string;
      sha256: string;
      support: "present";
    }
  | {
      bytes: null;
      path: string;
      sha256: null;
      support: "missing";
    };

export type DeliveryTrajectoryArchiveFact = {
  archiveId: string;
  archivePath: string;
  current: boolean;
  files: {
    proposal: DeliveryTrajectoryFileFact & { support: "present" };
    tasks: DeliveryTrajectoryFileFact;
    history: DeliveryTrajectoryFileFact;
    evidenceIndex: DeliveryTrajectoryFileFact;
  };
  linkage: {
    horizonId: string;
    state: "linked";
  };
};

export type DeliveryTrajectoryRequirementFact = {
  bytes: number;
  kind: "outcome" | "exit-predicate" | "non-deferrable-invariant" | "non-goal";
  order: number;
  path: string;
  sha256: string;
  support: "present";
};

export type DeliveryTrajectoryContextResult = {
  archiveOrdering: "archive-id-lexical-ascending";
  archives: DeliveryTrajectoryArchiveFact[];
  bounds: {
    byteAccounting: "distinct-project-relative-file-bytes-once";
    hard: {
      maxArchives: number;
      maxBytes: number;
      timeoutMs: number;
    };
    requested: {
      maxArchives: number;
      maxBytes: number;
      timeoutMs: number;
    };
    used: {
      archives: number;
      bytes: number;
      filesRead: number;
    };
  };
  effects: {
    gitOperations: 0;
    modelCalls: 0;
    networkCalls: 0;
    openSpecOperations: 0;
    processStarts: 0;
    providerCalls: 0;
    writes: 0;
  };
  horizon: {
    file: DeliveryTrajectoryFileFact & { support: "present" };
    id: string;
    requirements: DeliveryTrajectoryRequirementFact[];
    schemaVersion: 1;
    window: {
      start: string;
      usefulBy: string;
    };
  };
  privacy: {
    absolutePathsEmitted: false;
    projectRoot: "<project>";
    rootDigestEmitted: false;
    sourcePayloadsEmitted: false;
    untrackedContentsEmitted: false;
  };
  schemaVersion: 1;
  semanticInference: false;
  status: "complete";
};

export type DeliveryTrajectoryContextCliOptions = {
  archiveId: string | null;
  format: "json" | "markdown";
  help: boolean;
  horizonId: string | null;
  maxArchives: number;
  maxBytes: number;
  root: string | null;
  timeoutMs: number;
};

export type DeliveryTrajectoryContextCliIo = {
  stderr: { write(value: string): unknown };
  stdout: { write(value: string): unknown };
};

type NormalizedOptions = {
  archiveId: string;
  horizonId: string;
  maxArchives: number;
  maxBytes: number;
  root: string;
  signal?: AbortSignal;
  timeoutMs: number;
};

type ReadFact = {
  bytes: number;
  path: string;
  sha256: string;
  text: string;
};

type CollectionState = {
  cache: Map<string, ReadFact>;
  filesRead: number;
  maxBytes: number;
  root: string;
  signal?: AbortSignal;
  startedAt: number;
  timeoutMs: number;
  usedBytes: number;
};

type LinkedArchive = {
  archiveId: string;
  archivePath: string;
  proposal: ReadFact;
};

const ARCHIVE_ROOT = "openspec/changes/archive";
const ARCHIVE_FILES = {
  proposal: "proposal.md",
  tasks: "tasks.md",
  history: "history.md",
  evidenceIndex: "evidence-index.json",
} as const;

function compareAscii(left: string, right: string): number {
  return left === right ? 0 : left < right ? -1 : 1;
}

function safeIdentifier(value: string, field: string, reserveNone: boolean): string {
  if (
    typeof value !== "string"
    || !SAFE_ID.test(value)
    || value === "."
    || value === ".."
    || (reserveNone && value === "none")
  ) {
    throw new DeliveryTrajectoryContextError(`${field} must be one safe non-reserved id.`, {
      code: "invalid-argument",
      field,
    });
  }
  return value;
}

function boundedPositiveInteger(value: number, field: string, maximum: number): number {
  if (!Number.isSafeInteger(value) || value < 1 || value > maximum) {
    throw new DeliveryTrajectoryContextError(`${field} must be a positive integer within its hard cap.`, {
      actual: value,
      code: "invalid-argument",
      field,
      limit: maximum,
    });
  }
  return value;
}

function normalizeOptions(options: DeliveryTrajectoryContextOptions): NormalizedOptions {
  if (typeof options.root !== "string" || !path.isAbsolute(options.root)) {
    throw new DeliveryTrajectoryContextError("root must be an absolute project path.", {
      code: "invalid-argument",
      field: "root",
    });
  }
  return {
    archiveId: safeIdentifier(options.archiveId, "archiveId", false),
    horizonId: safeIdentifier(options.horizonId, "horizonId", true),
    maxArchives: boundedPositiveInteger(
      options.maxArchives ?? DELIVERY_TRAJECTORY_CONTEXT_DEFAULT_BOUNDS.maxArchives,
      "maxArchives",
      DELIVERY_TRAJECTORY_CONTEXT_HARD_BOUNDS.maxArchives,
    ),
    maxBytes: boundedPositiveInteger(
      options.maxBytes ?? DELIVERY_TRAJECTORY_CONTEXT_DEFAULT_BOUNDS.maxBytes,
      "maxBytes",
      DELIVERY_TRAJECTORY_CONTEXT_HARD_BOUNDS.maxBytes,
    ),
    root: path.resolve(options.root),
    signal: options.signal,
    timeoutMs: boundedPositiveInteger(
      options.timeoutMs ?? DELIVERY_TRAJECTORY_CONTEXT_DEFAULT_BOUNDS.timeoutMs,
      "timeoutMs",
      DELIVERY_TRAJECTORY_CONTEXT_HARD_BOUNDS.timeoutMs,
    ),
  };
}

function checkInterrupt(state: CollectionState, field: string): void {
  if (state.signal?.aborted === true) {
    throw new DeliveryTrajectoryContextError("Delivery trajectory context collection was aborted.", {
      cause: state.signal.reason,
      code: "aborted",
      field,
    });
  }
  if (performance.now() - state.startedAt >= state.timeoutMs) {
    throw new DeliveryTrajectoryContextError("Delivery trajectory context collection exceeded its timeout.", {
      code: "timeout",
      field,
      limit: state.timeoutMs,
    });
  }
}

function causeCode(cause: unknown): string | undefined {
  if (typeof cause !== "object" || cause == null || !("code" in cause)) return undefined;
  return typeof cause.code === "string" ? cause.code : undefined;
}

function missingCause(cause: unknown): boolean {
  const code = causeCode(cause);
  return code === "ENOENT" || code === "ENOTDIR";
}

function assertRelativePath(relative: string, field: string): void {
  const issue = safeRelativePath(relative, field);
  if (issue == null) return;
  throw new DeliveryTrajectoryContextError(
    issue.code === "escape" ? `${field} escapes the project root.` : `${field} is not a safe project-relative path.`,
    { code: issue.code === "escape" ? "path-escape" : "invalid", field },
  );
}

function containedPath(root: string, relative: string, field: string): string {
  assertRelativePath(relative, field);
  const resolved = path.resolve(root, ...relative.split("/"));
  const relation = path.relative(root, resolved);
  if (relation === "" || relation === ".." || relation.startsWith(`..${path.sep}`) || path.isAbsolute(relation)) {
    throw new DeliveryTrajectoryContextError(`${field} escapes the project root.`, {
      code: "path-escape",
      field,
    });
  }
  return resolved;
}

function canonicalProjectRoot(root: string, state: CollectionState): string {
  checkInterrupt(state, "root");
  let stat: fs.Stats;
  try {
    stat = fs.lstatSync(root);
  } catch (cause) {
    throw new DeliveryTrajectoryContextError("Project root is missing or unreadable.", {
      cause,
      code: missingCause(cause) ? "missing" : "unreadable",
      field: "root",
    });
  }
  if (stat.isSymbolicLink()) {
    throw new DeliveryTrajectoryContextError("Project root must not be a symbolic link.", {
      code: "path-escape",
      field: "root",
    });
  }
  if (!stat.isDirectory()) {
    throw new DeliveryTrajectoryContextError("Project root must be an ordinary directory.", {
      code: "invalid",
      field: "root",
    });
  }
  try {
    const canonical = fs.realpathSync(root);
    checkInterrupt(state, "root");
    return canonical;
  } catch (cause) {
    if (cause instanceof DeliveryTrajectoryContextError) throw cause;
    throw new DeliveryTrajectoryContextError("Project root is unreadable.", {
      cause,
      code: "unreadable",
      field: "root",
    });
  }
}

function inspectContainedEntry(
  state: CollectionState,
  relative: string,
  field: string,
  expected: "directory" | "file",
): { absolute: string; stat: fs.Stats } {
  const absolute = containedPath(state.root, relative, field);
  let current = state.root;
  const segments = relative.split("/");
  let finalStat: fs.Stats | undefined;
  for (let index = 0; index < segments.length; index += 1) {
    checkInterrupt(state, field);
    current = path.join(current, segments[index] ?? "");
    let stat: fs.Stats;
    try {
      stat = fs.lstatSync(current);
    } catch (cause) {
      throw new DeliveryTrajectoryContextError(`${field} is missing or unreadable.`, {
        cause,
        code: missingCause(cause) ? "missing" : "unreadable",
        field,
      });
    }
    checkInterrupt(state, field);
    if (stat.isSymbolicLink()) {
      throw new DeliveryTrajectoryContextError(`${field} must not traverse a symbolic link.`, {
        code: "path-escape",
        field,
      });
    }
    const final = index === segments.length - 1;
    if (!final && !stat.isDirectory()) {
      throw new DeliveryTrajectoryContextError(`${field} has a non-directory parent.`, {
        code: "invalid",
        field,
      });
    }
    if (final) finalStat = stat;
  }
  if (finalStat == null) {
    throw new DeliveryTrajectoryContextError(`${field} is invalid.`, { code: "invalid", field });
  }
  if ((expected === "directory" && !finalStat.isDirectory()) || (expected === "file" && !finalStat.isFile())) {
    throw new DeliveryTrajectoryContextError(`${field} must be an ordinary ${expected}.`, {
      code: "invalid",
      field,
    });
  }
  let canonical: string;
  try {
    canonical = fs.realpathSync(absolute);
  } catch (cause) {
    throw new DeliveryTrajectoryContextError(`${field} is unreadable.`, {
      cause,
      code: "unreadable",
      field,
    });
  }
  const relation = path.relative(state.root, canonical);
  if (relation === "" || relation === ".." || relation.startsWith(`..${path.sep}`) || path.isAbsolute(relation)) {
    throw new DeliveryTrajectoryContextError(`${field} escapes the project root.`, {
      code: "path-escape",
      field,
    });
  }
  checkInterrupt(state, field);
  return { absolute: canonical, stat: finalStat };
}

function readBoundedFile(state: CollectionState, relative: string, field: string): ReadFact {
  checkInterrupt(state, field);
  const cached = state.cache.get(relative);
  if (cached != null) return cached;
  const entry = inspectContainedEntry(state, relative, field, "file");
  const remaining = state.maxBytes - state.usedBytes;
  if (entry.stat.size > remaining) {
    throw new DeliveryTrajectoryContextError("Aggregate input bytes exceed maxBytes.", {
      actual: state.usedBytes + entry.stat.size,
      code: "byte-limit",
      field,
      limit: state.maxBytes,
    });
  }

  let descriptor: number | undefined;
  let content: Buffer | undefined;
  let failure: unknown;
  try {
    descriptor = fs.openSync(entry.absolute, "r");
    const opened = fs.fstatSync(descriptor);
    if (!opened.isFile() || opened.isSymbolicLink()) {
      throw new DeliveryTrajectoryContextError(`${field} must remain an ordinary file while read.`, {
        code: "invalid",
        field,
      });
    }
    const chunks: Buffer[] = [];
    while (true) {
      checkInterrupt(state, field);
      const available = state.maxBytes - state.usedBytes + 1;
      const chunk = Buffer.allocUnsafe(Math.min(64 * 1024, available));
      const count = fs.readSync(descriptor, chunk, 0, chunk.length, null);
      state.usedBytes += count;
      checkInterrupt(state, field);
      if (state.usedBytes > state.maxBytes) {
        throw new DeliveryTrajectoryContextError("Aggregate input bytes exceed maxBytes.", {
          actual: state.usedBytes,
          code: "byte-limit",
          field,
          limit: state.maxBytes,
        });
      }
      if (count === 0) break;
      chunks.push(chunk.subarray(0, count));
    }
    content = Buffer.concat(chunks);
  } catch (cause) {
    failure = cause;
  }
  if (descriptor != null) {
    try {
      fs.closeSync(descriptor);
    } catch (cause) {
      if (failure === undefined) failure = cause;
    }
  }
  if (failure !== undefined) {
    if (failure instanceof DeliveryTrajectoryContextError) throw failure;
    throw new DeliveryTrajectoryContextError(`${field} is unreadable.`, {
      cause: failure,
      code: missingCause(failure) ? "missing" : "unreadable",
      field,
    });
  }
  if (content == null) {
    throw new DeliveryTrajectoryContextError(`${field} is unreadable.`, { code: "unreadable", field });
  }
  const text = content.toString("utf8");
  const fact = { bytes: content.byteLength, path: relative, sha256: digestText(text), text };
  state.cache.set(relative, fact);
  state.filesRead += 1;
  return fact;
}

function presentFact(fact: ReadFact): DeliveryTrajectoryFileFact & { support: "present" } {
  return {
    bytes: fact.bytes,
    path: fact.path,
    sha256: fact.sha256,
    support: "present",
  };
}

function optionalFileFact(state: CollectionState, relative: string, field: string): DeliveryTrajectoryFileFact {
  try {
    return presentFact(readBoundedFile(state, relative, field));
  } catch (cause) {
    if (cause instanceof DeliveryTrajectoryContextError && cause.code === "missing") {
      return { bytes: null, path: relative, sha256: null, support: "missing" };
    }
    throw cause;
  }
}

function parseHorizon(text: string, horizonId: string): DeliveryHorizon {
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch (cause) {
    throw new DeliveryTrajectoryContextError("Delivery Horizon must contain valid JSON.", {
      cause,
      code: "invalid",
      field: "horizon",
    });
  }
  try {
    return parseDeliveryHorizon(value, horizonId);
  } catch (cause) {
    if (!(cause instanceof DeliveryHorizonError)) throw cause;
    const code: DeliveryTrajectoryContextErrorCode = cause.code === "unsupported"
      ? "unsupported"
      : cause.code === "escape"
        ? "path-escape"
        : cause.code === "unreadable"
          ? "unreadable"
          : cause.code === "missing"
            ? "missing"
            : "invalid";
    throw new DeliveryTrajectoryContextError(
      code === "unsupported" ? "Delivery Horizon schema version is unsupported." : "Delivery Horizon is malformed or contradictory.",
      { cause, code, field: cause.field ?? "horizon" },
    );
  }
}

function requirementFacts(
  state: CollectionState,
  horizon: DeliveryHorizon,
): DeliveryTrajectoryRequirementFact[] {
  const groups: Array<{
    kind: DeliveryTrajectoryRequirementFact["kind"];
    refs: string[];
  }> = [
    { kind: "outcome", refs: horizon.outcomeRefs },
    { kind: "exit-predicate", refs: horizon.exitPredicateRefs },
    { kind: "non-deferrable-invariant", refs: horizon.nonDeferrableInvariantRefs },
    { kind: "non-goal", refs: horizon.nonGoalRefs },
  ];
  const facts: DeliveryTrajectoryRequirementFact[] = [];
  for (const group of groups) {
    for (let index = 0; index < group.refs.length; index += 1) {
      const ref = group.refs[index] ?? "";
      const fact = readBoundedFile(state, ref, `horizon.${group.kind}[${index}]`);
      facts.push({
        bytes: fact.bytes,
        kind: group.kind,
        order: facts.length,
        path: fact.path,
        sha256: fact.sha256,
        support: "present",
      });
    }
  }
  return facts;
}

function directoryEntries(state: CollectionState, relative: string, field: string): fs.Dirent[] {
  const directory = inspectContainedEntry(state, relative, field, "directory");
  checkInterrupt(state, field);
  try {
    const entries = fs.readdirSync(directory.absolute, { withFileTypes: true });
    checkInterrupt(state, field);
    return entries.sort((left, right) => compareAscii(left.name, right.name));
  } catch (cause) {
    if (cause instanceof DeliveryTrajectoryContextError) throw cause;
    throw new DeliveryTrajectoryContextError(`${field} is unreadable.`, {
      cause,
      code: missingCause(cause) ? "missing" : "unreadable",
      field,
    });
  }
}

function linkedArchives(
  state: CollectionState,
  archiveId: string,
  horizonId: string,
): LinkedArchive[] {
  const entries = directoryEntries(state, ARCHIVE_ROOT, "archiveRoot");
  const currentEntry = entries.find((entry) => entry.name === archiveId);
  if (currentEntry == null) {
    throw new DeliveryTrajectoryContextError("The named current archive is missing.", {
      code: "missing",
      field: "currentArchive",
    });
  }
  if (currentEntry.isSymbolicLink()) {
    throw new DeliveryTrajectoryContextError("The named current archive must not be a symbolic link.", {
      code: "path-escape",
      field: "currentArchive",
    });
  }
  if (!currentEntry.isDirectory()) {
    throw new DeliveryTrajectoryContextError("The named current archive must be an ordinary directory.", {
      code: "invalid",
      field: "currentArchive",
    });
  }

  const linked: LinkedArchive[] = [];
  for (const entry of entries) {
    if (compareAscii(entry.name, archiveId) > 0) break;
    if (entry.isSymbolicLink()) {
      throw new DeliveryTrajectoryContextError("An archive-window entry must not be a symbolic link.", {
        code: "path-escape",
        field: "archiveWindow",
      });
    }
    if (!entry.isDirectory()) continue;
    const candidateId = safeIdentifier(entry.name, "archiveWindow.archiveId", false);
    const archivePath = `${ARCHIVE_ROOT}/${candidateId}`;
    inspectContainedEntry(state, archivePath, `archives.${candidateId}`, "directory");
    const proposalPath = `${archivePath}/${ARCHIVE_FILES.proposal}`;
    const proposal = readBoundedFile(state, proposalPath, `archives.${candidateId}.proposal`);
    const declaration = parseDeliveryHorizonDeclaration(proposal.text);
    if (candidateId === archiveId) {
      if (declaration.status !== "linked" || declaration.horizonId !== horizonId) {
        throw new DeliveryTrajectoryContextError(
          "The named current archive proposal does not link exactly to the requested Delivery Horizon.",
          { code: "current-archive-link-mismatch", field: "currentArchive.proposal" },
        );
      }
    } else if (declaration.status === "duplicate" || declaration.status === "malformed") {
      throw new DeliveryTrajectoryContextError(
        "An inspected archive proposal has an invalid Delivery Horizon declaration.",
        { code: "invalid", field: `archives.${candidateId}.proposal` },
      );
    }
    if (declaration.status === "linked" && declaration.horizonId === horizonId) {
      linked.push({ archiveId: candidateId, archivePath, proposal });
    }
  }
  return linked;
}

function archiveFacts(
  state: CollectionState,
  linked: LinkedArchive[],
  currentArchiveId: string,
  horizonId: string,
): DeliveryTrajectoryArchiveFact[] {
  return linked.map((archive) => {
    const filePath = (name: string): string => `${archive.archivePath}/${name}`;
    return {
      archiveId: archive.archiveId,
      archivePath: archive.archivePath,
      current: archive.archiveId === currentArchiveId,
      files: {
        proposal: presentFact(archive.proposal),
        tasks: optionalFileFact(state, filePath(ARCHIVE_FILES.tasks), `archives.${archive.archiveId}.tasks`),
        history: optionalFileFact(state, filePath(ARCHIVE_FILES.history), `archives.${archive.archiveId}.history`),
        evidenceIndex: optionalFileFact(
          state,
          filePath(ARCHIVE_FILES.evidenceIndex),
          `archives.${archive.archiveId}.evidenceIndex`,
        ),
      },
      linkage: { horizonId, state: "linked" },
    };
  });
}

export function collectDeliveryTrajectoryContext(
  options: DeliveryTrajectoryContextOptions,
): DeliveryTrajectoryContextResult {
  const normalized = normalizeOptions(options);
  const state: CollectionState = {
    cache: new Map(),
    filesRead: 0,
    maxBytes: normalized.maxBytes,
    root: normalized.root,
    signal: normalized.signal,
    startedAt: performance.now(),
    timeoutMs: normalized.timeoutMs,
    usedBytes: 0,
  };
  state.root = canonicalProjectRoot(normalized.root, state);

  const horizonPath = deliveryHorizonRelativePath(normalized.horizonId);
  const horizonFile = readBoundedFile(state, horizonPath, "horizon");
  const horizon = parseHorizon(horizonFile.text, normalized.horizonId);
  const requirements = requirementFacts(state, horizon);
  const linked = linkedArchives(state, normalized.archiveId, normalized.horizonId);
  if (linked.length > normalized.maxArchives) {
    throw new DeliveryTrajectoryContextError("Eligible current and preceding linked archives exceed maxArchives.", {
      actual: linked.length,
      code: "archive-limit",
      field: "archives",
      limit: normalized.maxArchives,
    });
  }
  const archives = archiveFacts(state, linked, normalized.archiveId, normalized.horizonId);
  checkInterrupt(state, "complete");

  return {
    archiveOrdering: "archive-id-lexical-ascending",
    archives,
    bounds: {
      byteAccounting: "distinct-project-relative-file-bytes-once",
      hard: { ...DELIVERY_TRAJECTORY_CONTEXT_HARD_BOUNDS },
      requested: {
        maxArchives: normalized.maxArchives,
        maxBytes: normalized.maxBytes,
        timeoutMs: normalized.timeoutMs,
      },
      used: {
        archives: archives.length,
        bytes: state.usedBytes,
        filesRead: state.filesRead,
      },
    },
    effects: {
      gitOperations: 0,
      modelCalls: 0,
      networkCalls: 0,
      openSpecOperations: 0,
      processStarts: 0,
      providerCalls: 0,
      writes: 0,
    },
    horizon: {
      file: presentFact(horizonFile),
      id: horizon.id,
      requirements,
      schemaVersion: horizon.schemaVersion,
      window: { start: horizon.windowStart, usefulBy: horizon.usefulBy },
    },
    privacy: {
      absolutePathsEmitted: false,
      projectRoot: "<project>",
      rootDigestEmitted: false,
      sourcePayloadsEmitted: false,
      untrackedContentsEmitted: false,
    },
    schemaVersion: DELIVERY_TRAJECTORY_CONTEXT_SCHEMA_VERSION,
    semanticInference: false,
    status: "complete",
  };
}

export function formatDeliveryTrajectoryContextJson(result: DeliveryTrajectoryContextResult): string {
  return `${JSON.stringify(result, null, 2)}\n`;
}

function markdown(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replace(/([\\`*_{}[\]()#+.!|~-])/gu, "\\$1");
}

function markdownFileRow(label: string, fact: DeliveryTrajectoryFileFact): string {
  return `| ${markdown(label)} | ${markdown(fact.path)} | ${fact.support} | ${fact.bytes ?? "-"} | ${fact.sha256 ?? "-"} |`;
}

export function formatDeliveryTrajectoryContextMarkdown(result: DeliveryTrajectoryContextResult): string {
  const lines = [
    "# Delivery Trajectory Context",
    "",
    `- Status: ${result.status}`,
    `- Project root: ${result.privacy.projectRoot}`,
    `- Semantic inference: ${result.semanticInference}`,
    `- Archive ordering: ${result.archiveOrdering}`,
    `- Archives: ${result.bounds.used.archives}/${result.bounds.requested.maxArchives}`,
    `- Bytes: ${result.bounds.used.bytes}/${result.bounds.requested.maxBytes}`,
    `- Files read: ${result.bounds.used.filesRead}`,
    `- Byte accounting: ${result.bounds.byteAccounting}`,
    `- Timeout bound: ${result.bounds.requested.timeoutMs} ms`,
    "",
    "## Horizon",
    "",
    `- Id: ${markdown(result.horizon.id)}`,
    `- Schema version: ${result.horizon.schemaVersion}`,
    `- Window start: ${markdown(result.horizon.window.start)}`,
    `- Useful by: ${markdown(result.horizon.window.usefulBy)}`,
    "",
    "| Kind | Path | Support | Bytes | SHA-256 |",
    "| --- | --- | --- | ---: | --- |",
    markdownFileRow("horizon", result.horizon.file),
    ...result.horizon.requirements.map((fact) =>
      markdownFileRow(`${fact.kind}[${fact.order}]`, {
        bytes: fact.bytes,
        path: fact.path,
        sha256: fact.sha256,
        support: fact.support,
      }),
    ),
    "",
    "## Archives",
    "",
  ];
  for (const archive of result.archives) {
    lines.push(
      `### ${markdown(archive.archiveId)}`,
      "",
      `- Path: ${markdown(archive.archivePath)}`,
      `- Current: ${archive.current}`,
      `- Linkage: ${archive.linkage.state}`,
      `- Horizon: ${markdown(archive.linkage.horizonId)}`,
      "",
      "| File | Path | Support | Bytes | SHA-256 |",
      "| --- | --- | --- | ---: | --- |",
      markdownFileRow("proposal", archive.files.proposal),
      markdownFileRow("tasks", archive.files.tasks),
      markdownFileRow("history", archive.files.history),
      markdownFileRow("evidence-index", archive.files.evidenceIndex),
      "",
    );
  }
  lines.push(
    "## Effects And Privacy",
    "",
    `- Writes: ${result.effects.writes}`,
    `- Process starts: ${result.effects.processStarts}`,
    `- Provider calls: ${result.effects.providerCalls}`,
    `- Model calls: ${result.effects.modelCalls}`,
    `- Network calls: ${result.effects.networkCalls}`,
    `- Git operations: ${result.effects.gitOperations}`,
    `- OpenSpec operations: ${result.effects.openSpecOperations}`,
    `- Absolute paths emitted: ${result.privacy.absolutePathsEmitted}`,
    `- Root digest emitted: ${result.privacy.rootDigestEmitted}`,
    `- Source payloads emitted: ${result.privacy.sourcePayloadsEmitted}`,
    `- Untracked contents emitted: ${result.privacy.untrackedContentsEmitted}`,
    "",
  );
  return `${lines.join("\n")}\n`;
}

export function deliveryTrajectoryContextUsage(): string {
  return [
    "Usage:",
    "  node global/bin/delivery-trajectory-context.ts --help",
    "  node global/bin/delivery-trajectory-context.ts -h",
    "  node global/bin/delivery-trajectory-context.ts --root <absolute-project-root> --horizon <safe-id> --archive <safe-archive-id> [options]",
    "",
    "Effect-free, provider-free facts for one explicit Delivery Horizon and successful linked archive.",
    "Help reads no repository, starts no process, and works outside a repository.",
    "",
    "Required inputs:",
    "  --root <path>       Explicit absolute project root; no parent or alternate-source search.",
    "  --horizon <id>      Exact safe Delivery Horizon id.",
    "  --archive <id>      Exact safe current archive id.",
    "",
    "Options:",
    "  --format <kind>     Stable json or deterministic factual markdown (default json).",
    `  --max-archives <n>  Linked current-plus-predecessor bound (default ${DELIVERY_TRAJECTORY_CONTEXT_DEFAULT_BOUNDS.maxArchives}, hard cap ${DELIVERY_TRAJECTORY_CONTEXT_HARD_BOUNDS.maxArchives}).`,
    `  --max-bytes <n>     Aggregate distinct-file read bound (default ${DELIVERY_TRAJECTORY_CONTEXT_DEFAULT_BOUNDS.maxBytes}, hard cap ${DELIVERY_TRAJECTORY_CONTEXT_HARD_BOUNDS.maxBytes}).`,
    `  --timeout-ms <n>    Collection timeout (default ${DELIVERY_TRAJECTORY_CONTEXT_DEFAULT_BOUNDS.timeoutMs}, hard cap ${DELIVERY_TRAJECTORY_CONTEXT_HARD_BOUNDS.timeoutMs}).`,
    "  --help, -h          Show this effect-free help.",
    "",
    "Evidence: relative paths, linkage, schema/window, support states, byte sizes, and SHA-256 digests only.",
    "Effects: zero writes, process starts, provider/model/network calls, Git operations, and OpenSpec operations.",
    "Bounds: excess archive count, aggregate bytes, timeout, or cancellation blocks clean output; no truncation.",
    "Cleanup: none; the command creates no files or processes.",
    "No semantic progress, trigger, forecast, N/K, strategy, quality, authority, or successor inference occurs.",
  ].join("\n");
}

function argumentValue(args: string[], index: number, option: string): string {
  const value = args[index + 1];
  if (value == null || value === "" || value.startsWith("-")) {
    throw new DeliveryTrajectoryContextError(`Missing value for ${option}.`, {
      code: "invalid-argument",
      field: option,
    });
  }
  return value;
}

function argumentInteger(value: string, option: string, maximum: number): number {
  if (!/^[1-9]\d*$/u.test(value)) {
    throw new DeliveryTrajectoryContextError(`${option} must be a positive integer.`, {
      code: "invalid-argument",
      field: option,
    });
  }
  return boundedPositiveInteger(Number(value), option, maximum);
}

export function parseDeliveryTrajectoryContextArgs(args: string[]): DeliveryTrajectoryContextCliOptions {
  const options: DeliveryTrajectoryContextCliOptions = {
    archiveId: null,
    format: "json",
    help: false,
    horizonId: null,
    maxArchives: DELIVERY_TRAJECTORY_CONTEXT_DEFAULT_BOUNDS.maxArchives,
    maxBytes: DELIVERY_TRAJECTORY_CONTEXT_DEFAULT_BOUNDS.maxBytes,
    root: null,
    timeoutMs: DELIVERY_TRAJECTORY_CONTEXT_DEFAULT_BOUNDS.timeoutMs,
  };
  const seen = new Set<string>();
  const once = (key: string, field: string): void => {
    if (seen.has(key)) {
      throw new DeliveryTrajectoryContextError(`Duplicate argument ${field}.`, {
        code: "invalid-argument",
        field,
      });
    }
    seen.add(key);
  };
  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index] ?? "";
    if (argument === "--help" || argument === "-h") {
      once("help", argument);
      options.help = true;
    } else if (argument === "--root") {
      once("root", argument);
      options.root = argumentValue(args, index, argument);
      index += 1;
    } else if (argument === "--horizon") {
      once("horizon", argument);
      options.horizonId = argumentValue(args, index, argument);
      index += 1;
    } else if (argument === "--archive") {
      once("archive", argument);
      options.archiveId = argumentValue(args, index, argument);
      index += 1;
    } else if (argument === "--format") {
      once("format", argument);
      const value = argumentValue(args, index, argument);
      if (value !== "json" && value !== "markdown") {
        throw new DeliveryTrajectoryContextError("--format must be json or markdown.", {
          code: "invalid-argument",
          field: "--format",
        });
      }
      options.format = value;
      index += 1;
    } else if (argument === "--max-archives") {
      once("maxArchives", argument);
      options.maxArchives = argumentInteger(
        argumentValue(args, index, argument),
        argument,
        DELIVERY_TRAJECTORY_CONTEXT_HARD_BOUNDS.maxArchives,
      );
      index += 1;
    } else if (argument === "--max-bytes") {
      once("maxBytes", argument);
      options.maxBytes = argumentInteger(
        argumentValue(args, index, argument),
        argument,
        DELIVERY_TRAJECTORY_CONTEXT_HARD_BOUNDS.maxBytes,
      );
      index += 1;
    } else if (argument === "--timeout-ms") {
      once("timeoutMs", argument);
      options.timeoutMs = argumentInteger(
        argumentValue(args, index, argument),
        argument,
        DELIVERY_TRAJECTORY_CONTEXT_HARD_BOUNDS.timeoutMs,
      );
      index += 1;
    } else {
      throw new DeliveryTrajectoryContextError("Unknown or positional argument.", {
        code: "invalid-argument",
        field: "arguments",
      });
    }
  }
  if (options.help) {
    if (args.length !== 1) {
      throw new DeliveryTrajectoryContextError("Help must be requested without other arguments.", {
        code: "invalid-argument",
        field: "help",
      });
    }
    return options;
  }
  if (options.root == null || options.horizonId == null || options.archiveId == null) {
    throw new DeliveryTrajectoryContextError("--root, --horizon, and --archive are required.", {
      code: "invalid-argument",
      field: "arguments",
    });
  }
  if (!path.isAbsolute(options.root)) {
    throw new DeliveryTrajectoryContextError("--root must be an absolute project path.", {
      code: "invalid-argument",
      field: "--root",
    });
  }
  safeIdentifier(options.horizonId, "--horizon", true);
  safeIdentifier(options.archiveId, "--archive", false);
  return options;
}

function safeErrorLine(cause: unknown): string {
  const error = cause instanceof DeliveryTrajectoryContextError
    ? cause
    : new DeliveryTrajectoryContextError("Unexpected collection failure.", {
        cause,
        code: "unreadable",
        field: "collection",
      });
  const field = error.field == null ? "" : ` [${error.field}]`;
  const limit = error.limit == null ? "" : ` limit=${error.limit}`;
  const actual = error.actual == null || !Number.isFinite(error.actual) ? "" : ` actual=${error.actual}`;
  return `delivery-trajectory-context: ${error.code}${field}: ${error.message}${limit}${actual}`;
}

export function runDeliveryTrajectoryContextCli(
  args: string[] = process.argv.slice(2),
  io: DeliveryTrajectoryContextCliIo = process,
): number {
  let options: DeliveryTrajectoryContextCliOptions;
  try {
    options = parseDeliveryTrajectoryContextArgs(args);
  } catch (cause) {
    io.stderr.write(`${safeErrorLine(cause)}\n`);
    return 1;
  }
  if (options.help) {
    io.stdout.write(`${deliveryTrajectoryContextUsage()}\n`);
    return 0;
  }

  const controller = new AbortController();
  const abort = (): void => controller.abort(new Error("Interrupted."));
  process.once("SIGINT", abort);
  try {
    const result = collectDeliveryTrajectoryContext({
      archiveId: options.archiveId ?? "",
      horizonId: options.horizonId ?? "",
      maxArchives: options.maxArchives,
      maxBytes: options.maxBytes,
      root: options.root ?? "",
      signal: controller.signal,
      timeoutMs: options.timeoutMs,
    });
    io.stdout.write(
      options.format === "json"
        ? formatDeliveryTrajectoryContextJson(result)
        : formatDeliveryTrajectoryContextMarkdown(result),
    );
    return 0;
  } catch (cause) {
    io.stderr.write(`${safeErrorLine(cause)}\n`);
    return 1;
  } finally {
    process.off("SIGINT", abort);
  }
}

if (process.argv[1] != null && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  process.exitCode = runDeliveryTrajectoryContextCli();
}
