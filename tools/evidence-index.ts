#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { pathToFileURL } from "node:url";

type EvidenceReferenceRole = "current-terminal" | "first-causal-failure" | "successor-unlock";

type EvidenceLane = {
  candidateId: string;
  currentTerminalBundle: string;
  firstCausalFailure: string | null;
  name: string;
  retryCondition: string;
  successorUnlockEvidence: string | null;
  terminalStatus: "blocked" | "complete" | "unknown";
};

type HashedEvidenceLane = {
  files: Array<{ bytes: number; digest: string; path: string }>;
  kind: "environment" | "evaluator" | "product" | "raw-bundle" | "replay" | "runner" | "terminal";
  name: string;
};

export type ResolvedEvidenceLane = {
  candidateId: string;
  lane: string;
  references: Array<{ exists: true; path: string; role: EvidenceReferenceRole }>;
  retryConditionPresent: true;
  schemaVersion: 1;
  terminalStatus: EvidenceLane["terminalStatus"];
} | {
  kind: HashedEvidenceLane["kind"];
  lane: string;
  references: Array<{
    exists: true;
    indexedBytes: number;
    indexedDigest: string;
    path: string;
    role: "indexed-file";
  }>;
  schemaVersion: 2;
};

const MAX_INDEX_BYTES = 65_536;
const MAX_LANES = 64;
const MAX_LANE_FILES = 64;
const MAX_TEXT = 1_000;
const SAFE_NAME = /^[a-z0-9][a-z0-9._-]{0,119}$/;
const SHA256 = /^[a-f0-9]{64}$/;

function plainRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value != null && !Array.isArray(value);
}

function boundedString(value: unknown, label: string, pattern?: RegExp): string {
  if (typeof value !== "string" || value.trim() === "" || value.length > MAX_TEXT || (pattern != null && !pattern.test(value))) {
    throw new Error(`Evidence index has an invalid ${label}.`);
  }
  return value;
}

function safeRelativeFile(value: unknown, label: string): string {
  const relative = boundedString(value, label).replaceAll("\\", "/");
  if (path.isAbsolute(relative) || relative.split("/").some((part) => part === "" || part === "." || part === "..")) {
    throw new Error(`Evidence index ${label} must be a safe relative file path.`);
  }
  return relative;
}

function optionalRelativeFile(value: unknown, label: string): string | null {
  return value === null ? null : safeRelativeFile(value, label);
}

function parseLane(value: unknown): EvidenceLane {
  if (!plainRecord(value)) throw new Error("Evidence index lane must be an object.");
  const terminalStatus = value.terminalStatus;
  if (terminalStatus !== "blocked" && terminalStatus !== "complete" && terminalStatus !== "unknown") {
    throw new Error("Evidence index lane has an invalid terminalStatus.");
  }
  return {
    candidateId: boundedString(value.candidateId, "candidateId", SAFE_NAME),
    currentTerminalBundle: safeRelativeFile(value.currentTerminalBundle, "currentTerminalBundle"),
    firstCausalFailure: optionalRelativeFile(value.firstCausalFailure, "firstCausalFailure"),
    name: boundedString(value.name, "lane name", SAFE_NAME),
    retryCondition: boundedString(value.retryCondition, "retryCondition"),
    successorUnlockEvidence: optionalRelativeFile(value.successorUnlockEvidence, "successorUnlockEvidence"),
    terminalStatus,
  };
}

function parseHashedLane(value: unknown): HashedEvidenceLane {
  if (!plainRecord(value)) throw new Error("Evidence index lane must be an object.");
  const kind = value.kind;
  if (kind !== "environment" && kind !== "evaluator" && kind !== "product" && kind !== "raw-bundle" && kind !== "replay" && kind !== "runner" && kind !== "terminal") {
    throw new Error("Evidence index lane has an invalid kind.");
  }
  if (!Array.isArray(value.files) || value.files.length === 0 || value.files.length > MAX_LANE_FILES) {
    throw new Error(`Evidence index lane must contain 1..${MAX_LANE_FILES} files.`);
  }
  const pathPrefix = value.pathPrefix === undefined
    ? null
    : safeRelativeFile(value.pathPrefix, "lane pathPrefix");
  const files = value.files.map((file, index) => {
    if (!plainRecord(file)) throw new Error(`Evidence index lane file ${index} must be an object.`);
    if (!Number.isSafeInteger(file.bytes) || (file.bytes as number) < 0) {
      throw new Error(`Evidence index lane file ${index} has invalid bytes.`);
    }
    const relative = safeRelativeFile(file.path, `lane file ${index} path`);
    return {
      bytes: file.bytes as number,
      digest: boundedString(file.digest, `lane file ${index} digest`, SHA256),
      path: pathPrefix == null ? relative : `${pathPrefix}/${relative}`,
    };
  });
  if (new Set(files.map((file) => file.path)).size !== files.length) {
    throw new Error("Evidence index lane file paths must be unique.");
  }
  return { files, kind, name: boundedString(value.name, "lane name", SAFE_NAME) };
}

function readIndex(indexFile: string): { lanes: EvidenceLane[]; schemaVersion: 1 } | { lanes: HashedEvidenceLane[]; schemaVersion: 2 } {
  const stat = fs.lstatSync(indexFile);
  if (!stat.isFile() || stat.isSymbolicLink() || stat.size > MAX_INDEX_BYTES) {
    throw new Error("Evidence index must be a regular file no larger than 65536 bytes.");
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(fs.readFileSync(indexFile, "utf8"));
  } catch {
    throw new Error("Evidence index is not valid JSON.");
  }
  if (!plainRecord(parsed)) throw new Error("Evidence index must be an object.");
  const laneSource = parsed.lanes;
  if ((parsed.schemaVersion !== 1 && parsed.schemaVersion !== 2) || !Array.isArray(laneSource)) {
    throw new Error("Evidence index must use schemaVersion 1 or 2 with a lanes array.");
  }
  if (laneSource.length === 0 || laneSource.length > MAX_LANES) {
    throw new Error(`Evidence index must contain 1..${MAX_LANES} lanes.`);
  }
  const lanes = parsed.schemaVersion === 1 ? laneSource.map(parseLane) : laneSource.map(parseHashedLane);
  if (new Set(lanes.map((lane) => lane.name)).size !== lanes.length) {
    throw new Error("Evidence index lane names must be unique.");
  }
  return parsed.schemaVersion === 1
    ? { lanes: lanes as EvidenceLane[], schemaVersion: 1 }
    : { lanes: lanes as HashedEvidenceLane[], schemaVersion: 2 };
}

function existingReference(
  indexDirectory: string,
  relative: string,
  role: EvidenceReferenceRole,
): ResolvedEvidenceLane["references"][number] {
  const absolute = path.resolve(indexDirectory, relative);
  const boundary = `${path.resolve(indexDirectory)}${path.sep}`;
  if (!absolute.startsWith(boundary)) throw new Error(`Evidence ${role} reference escapes the index directory.`);
  try {
    const stat = fs.lstatSync(absolute);
    if (!stat.isFile() || stat.isSymbolicLink()) throw new Error("not-regular");
  } catch {
    throw new Error(`Evidence ${role} reference is missing or is not a regular file: ${relative}`);
  }
  return { exists: true, path: relative, role };
}

export function resolveEvidenceLane(indexFile: string, laneName: string): ResolvedEvidenceLane {
  const selectedName = boundedString(laneName, "requested lane", SAFE_NAME);
  const index = readIndex(path.resolve(indexFile));
  const lane = index.lanes.find((candidate) => candidate.name === selectedName);
  if (lane == null) throw new Error(`Evidence lane is not indexed: ${selectedName}`);
  const directory = path.dirname(path.resolve(indexFile));
  if (index.schemaVersion === 2) {
    const hashedLane = lane as HashedEvidenceLane;
    return {
      kind: hashedLane.kind,
      lane: hashedLane.name,
      references: hashedLane.files.map((file) => {
        existingReference(directory, file.path, "current-terminal");
        return {
          exists: true,
          indexedBytes: file.bytes,
          indexedDigest: file.digest,
          path: file.path,
          role: "indexed-file" as const,
        };
      }),
      schemaVersion: 2,
    };
  }
  const legacyLane = lane as EvidenceLane;
  const references: ResolvedEvidenceLane["references"] = [];
  if (legacyLane.firstCausalFailure != null) {
    references.push(existingReference(directory, legacyLane.firstCausalFailure, "first-causal-failure"));
  }
  if (legacyLane.successorUnlockEvidence != null) {
    references.push(existingReference(directory, legacyLane.successorUnlockEvidence, "successor-unlock"));
  }
  references.push(existingReference(directory, legacyLane.currentTerminalBundle, "current-terminal"));
  return {
    candidateId: legacyLane.candidateId,
    lane: legacyLane.name,
    references,
    retryConditionPresent: true,
    schemaVersion: 1,
    terminalStatus: legacyLane.terminalStatus,
  };
}

export function materializeEvidenceIndex(indexFile: string): { files: number; lanes: number } {
  const absoluteIndex = path.resolve(indexFile);
  const parsed = JSON.parse(fs.readFileSync(absoluteIndex, "utf8")) as unknown;
  if (!plainRecord(parsed) || parsed.schemaVersion !== 2 || !Array.isArray(parsed.lanes)) {
    throw new Error("Evidence index materialization requires schemaVersion 2 with a lanes array.");
  }
  const directory = path.dirname(absoluteIndex);
  let fileCount = 0;
  for (const laneValue of parsed.lanes) {
    if (!plainRecord(laneValue) || !Array.isArray(laneValue.files) || laneValue.files.length === 0) {
      throw new Error("Evidence index materialization requires every lane to contain files.");
    }
    const pathPrefix = laneValue.pathPrefix === undefined
      ? null
      : safeRelativeFile(laneValue.pathPrefix, "lane pathPrefix");
    for (const fileValue of laneValue.files) {
      if (!plainRecord(fileValue)) throw new Error("Evidence index lane file must be an object.");
      const fileRelative = safeRelativeFile(fileValue.path, "lane file path");
      const relative = pathPrefix == null ? fileRelative : `${pathPrefix}/${fileRelative}`;
      const absolute = path.resolve(directory, relative);
      const boundary = `${directory}${path.sep}`;
      if (!absolute.startsWith(boundary)) throw new Error("Evidence index lane file escapes the index directory.");
      const stat = fs.lstatSync(absolute);
      if (!stat.isFile() || stat.isSymbolicLink()) throw new Error(`Evidence lane path is not a regular file: ${relative}`);
      const content = fs.readFileSync(absolute);
      fileValue.bytes = content.byteLength;
      fileValue.digest = createHash("sha256").update(content).digest("hex");
      fileCount += 1;
    }
  }
  const serialized = `${JSON.stringify(parsed)}\n`;
  if (Buffer.byteLength(serialized, "utf8") > MAX_INDEX_BYTES) throw new Error("Materialized evidence index exceeds 65536 bytes.");
  fs.writeFileSync(absoluteIndex, serialized, "utf8");
  readIndex(absoluteIndex);
  return { files: fileCount, lanes: parsed.lanes.length };
}

function usage(): string {
  return `Usage:
  node tools/evidence-index.ts --index <file> --lane <name>
  node tools/evidence-index.ts --index <file> --materialize

Reads bounded index metadata and checks only the selected lane's referenced files.
Materialize deterministically refreshes schema-v2 lane file sizes and SHA-256 digests.
Neither mode prints referenced bundle content.`;
}

function isMainModule(): boolean {
  const entrypoint = process.argv[1];
  return Boolean(entrypoint && import.meta.url === pathToFileURL(path.resolve(entrypoint)).href);
}

if (isMainModule()) {
  try {
    if (process.argv.includes("--help") || process.argv.includes("-h")) {
      console.log(usage());
      process.exit(0);
    }
    const indexAt = process.argv.indexOf("--index");
    const laneAt = process.argv.indexOf("--lane");
    const indexFile = indexAt >= 0 ? process.argv[indexAt + 1] : undefined;
    const lane = laneAt >= 0 ? process.argv[laneAt + 1] : undefined;
    if (process.argv.includes("--materialize")) {
      if (indexFile == null) throw new Error("--index is required.");
      console.log(JSON.stringify(materializeEvidenceIndex(indexFile), null, 2));
      process.exit(0);
    }
    if (indexFile == null || lane == null) throw new Error("--index and --lane are required.");
    console.log(JSON.stringify(resolveEvidenceLane(indexFile, lane), null, 2));
  } catch (error) {
    console.error(error instanceof Error ? error.message : "Evidence index resolution failed.");
    process.exit(1);
  }
}
