#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import {
  findOwnershipCycles,
  findOwnershipOverlaps,
  parseOwnershipManifest,
  unresolvedOwnershipConflict,
  type OwnershipManifest,
  type OwnershipOverlap,
} from "./ownership.ts";
import {
  effectiveRetention,
  evaluateClaimEvidence,
  inspectEvidenceDocument,
  proofEnvelopeState,
  taskTextDigest,
  type ClaimClosureReason,
  type ClaimClosureState,
  type EvidenceIndex,
} from "./evidence.ts";
import {
  MAX_MANIFEST_BYTES,
  type SchemaIssue,
} from "./manifest.ts";

export type InventoryMode = "all" | "ownership" | "evidence";

export type TaskCheckbox = {
  checked: boolean;
  taskId: string;
  text: string;
  digest: string;
};

export type ChangeInventoryRow = {
  changeId: string;
  relativePath: string;
  mutationEnabled: boolean | "unknown";
  ownership: { status: "present" | "missing" | "invalid"; issues: SchemaIssue[] };
  evidence: { status: "present" | "missing" | "invalid" | "unknown"; issues: SchemaIssue[] };
  checkedTasks: number;
  uncheckedTasks: number;
  taskRows: number;
  claimRows: number;
  claims: ClaimInventoryRow[];
  incompleteTasks: string[];
  envelopeMismatches: string[];
  staleTasks: string[];
  unknownTasks: string[];
  retainedFiles: number;
  retainedBytes: number;
  unindexedFiles: string[];
  overLimit: boolean;
};

export type ClaimInventoryRow = {
  claimId: string;
  state: ClaimClosureState;
  maximumSupportedClaim: string;
  requiredMembers: number;
  supportedMembers: number;
  reasons: ClaimClosureReason[];
};

export type InventoryFinding = {
  id: "AUD-001" | "AUD-006" | "AUD-007" | "AUD-008" | "AUD-009";
  code: "invalid-complete" | "evidence-unbounded" | "ownership-overlap" | "proof-envelope-mismatch" | "claim-evidence-gap";
  changeIds: string[];
  fact: string;
  winner: null;
};

export type OpenSpecChangeInventory = {
  schemaVersion: 1;
  mode: InventoryMode;
  writes: false;
  filesRewritten: [];
  changes: ChangeInventoryRow[];
  overlaps: Array<OwnershipOverlap & { unresolved: boolean }>;
  cycles: string[][];
  findings: InventoryFinding[];
};

const PLANNING_FILES = new Set([
  "proposal.md",
  "design.md",
  "tasks.md",
  "history.md",
  "ownership.json",
  "evidence-index.json",
  ".openspec.yaml",
]);

type Options = {
  root: string;
  mode: InventoryMode;
  showRoot: boolean;
};

function usage(): string {
  return `Usage:
  node global/bin/openspec-change/inventory.ts --root <path> [--mode all|ownership|evidence]

Reads active OpenSpec ownership.json and evidence-index.json files.
It does not choose a winner, rewrite files, or delete evidence.

Options:
  --root <path>   Project root containing openspec/changes.
  --mode <mode>   all (default), ownership, or evidence.
  --show-root     Include the absolute root path in JSON.
  --help, -h      Show this help.`;
}

function readValue(args: string[], index: number, option: string): string {
  const value = args[index + 1];
  if (value == null || value.trim() === "" || value.startsWith("--")) {
    throw new Error(`Missing value for ${option}.`);
  }
  return value;
}

export function parseInventoryArgs(args: string[]): Options | { help: true } {
  if (args.includes("--help") || args.includes("-h")) {
    return { help: true };
  }
  const options: Options = { root: "", mode: "all", showRoot: false };
  for (let index = 0; index < args.length; index++) {
    const arg = args[index];
    if (arg === "--root") {
      options.root = readValue(args, index, arg);
      index++;
    } else if (arg === "--mode") {
      const mode = readValue(args, index, arg);
      if (mode !== "all" && mode !== "ownership" && mode !== "evidence") {
        throw new Error("--mode must be all, ownership, or evidence.");
      }
      options.mode = mode;
      index++;
    } else if (arg === "--show-root") {
      options.showRoot = true;
    } else {
      throw new Error(`Unknown option: ${arg}`);
    }
  }
  if (!options.root) {
    throw new Error("Missing required --root <path>.");
  }
  return options;
}

function safeChangeId(value: string): boolean {
  return /^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(value) && value !== "." && value !== "..";
}

function readJsonFile(filePath: string): { ok: true; value: unknown } | { ok: false; issues: SchemaIssue[] } {
  try {
    const stat = fs.lstatSync(filePath);
    if (!stat.isFile() || stat.isSymbolicLink() || stat.size > MAX_MANIFEST_BYTES) {
      return { ok: false, issues: [{ code: "invalid", path: path.basename(filePath), message: "File must be a regular file no larger than 65536 bytes." }] };
    }
    return { ok: true, value: JSON.parse(fs.readFileSync(filePath, "utf8")) };
  } catch {
    return { ok: false, issues: [{ code: "unknown", path: path.basename(filePath), message: "File is missing, unreadable, or not valid JSON." }] };
  }
}

export function parseTaskCheckboxes(text: string): TaskCheckbox[] {
  const rows: TaskCheckbox[] = [];
  for (const line of text.split(/\r?\n/)) {
    const match = /^\s*[-*]\s+\[([ xX])\]\s+(.*)$/.exec(line);
    if (match == null) continue;
    const textValue = match[2].trim();
    const idMatch = /^(\d+(?:\.\d+)*)\b/.exec(textValue);
    rows.push({
      checked: match[1] !== " ",
      taskId: idMatch?.[1] ?? `task-${rows.length + 1}`,
      text: textValue,
      digest: taskTextDigest(textValue),
    });
  }
  return rows;
}

function listActiveChangeIds(root: string): string[] {
  const changesDir = path.join(root, "openspec", "changes");
  if (!fs.existsSync(changesDir) || !fs.statSync(changesDir).isDirectory()) {
    return [];
  }
  return fs.readdirSync(changesDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name !== "archive" && safeChangeId(entry.name))
    .map((entry) => entry.name)
    .sort((left, right) => left.localeCompare(right));
}

function isPlanningPath(relative: string): boolean {
  const normalized = relative.replaceAll("\\", "/");
  if (PLANNING_FILES.has(normalized)) return true;
  return normalized.startsWith("specs/") || normalized.startsWith("automation/");
}

function listRetainedFiles(changeRoot: string): Array<{ relative: string; bytes: number }> {
  const collected: Array<{ relative: string; bytes: number }> = [];
  const walk = (directory: string): void => {
    let entries: fs.Dirent[] = [];
    try {
      entries = fs.readdirSync(directory, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name))) {
      const absolute = path.join(directory, entry.name);
      const relative = path.relative(changeRoot, absolute).replaceAll("\\", "/");
      if (entry.isSymbolicLink()) continue;
      if (entry.isDirectory()) {
        walk(absolute);
        continue;
      }
      if (!entry.isFile() || isPlanningPath(relative)) continue;
      try {
        collected.push({ relative, bytes: fs.statSync(absolute).size });
      } catch {
        collected.push({ relative, bytes: -1 });
      }
    }
  };
  walk(changeRoot);
  return collected;
}

function loadOwnership(changeRoot: string): { manifest: OwnershipManifest | null; status: ChangeInventoryRow["ownership"] } {
  const filePath = path.join(changeRoot, "ownership.json");
  if (!fs.existsSync(filePath)) {
    return { manifest: null, status: { status: "missing", issues: [{ code: "missing", path: "ownership.json", message: "Ownership manifest is absent." }] } };
  }
  const raw = readJsonFile(filePath);
  if (!raw.ok) return { manifest: null, status: { status: "invalid", issues: raw.issues } };
  const parsed = parseOwnershipManifest(raw.value);
  if (!parsed.ok) return { manifest: null, status: { status: "invalid", issues: parsed.issues } };
  return { manifest: parsed.value, status: { status: "present", issues: [] } };
}

function loadEvidence(changeRoot: string): { index: EvidenceIndex | null; status: ChangeInventoryRow["evidence"] } {
  const filePath = path.join(changeRoot, "evidence-index.json");
  if (!fs.existsSync(filePath)) {
    return { index: null, status: { status: "missing", issues: [{ code: "missing", path: "evidence-index.json", message: "Evidence index is absent." }] } };
  }
  const raw = readJsonFile(filePath);
  if (!raw.ok) return { index: null, status: { status: "invalid", issues: raw.issues } };
  const parsed = inspectEvidenceDocument(raw.value);
  if (!parsed.ok) {
    const unknown = parsed.issues.some((issue) => issue.code === "unknown");
    return { index: null, status: { status: unknown ? "unknown" : "invalid", issues: parsed.issues } };
  }
  return { index: parsed.value, status: { status: "present", issues: [] } };
}

function inventoryChange(root: string, changeId: string, mode: InventoryMode): { row: ChangeInventoryRow; manifest: OwnershipManifest | null } {
  const relativePath = `openspec/changes/${changeId}`;
  const changeRoot = path.join(root, "openspec", "changes", changeId);
  const ownership = mode === "evidence" ? { manifest: null, status: { status: "missing" as const, issues: [] } } : loadOwnership(changeRoot);
  const evidence = mode === "ownership" ? { index: null, status: { status: "missing" as const, issues: [] } } : loadEvidence(changeRoot);
  const tasksPath = path.join(changeRoot, "tasks.md");
  const checkboxes = fs.existsSync(tasksPath) ? parseTaskCheckboxes(fs.readFileSync(tasksPath, "utf8")) : [];
  const checked = checkboxes.filter((item) => item.checked);
  const incompleteTasks: string[] = [];
  const envelopeMismatches: string[] = [];
  const staleTasks: string[] = [];
  const unknownTasks: string[] = [];
  const rowsById = new Map((evidence.index?.tasks ?? []).map((row) => [row.taskId, row]));
  if (mode !== "ownership") {
    for (const task of checked) {
      const row = rowsById.get(task.taskId);
      if (row == null) {
        incompleteTasks.push(task.taskId);
        continue;
      }
      const state = proofEnvelopeState(row, evidence.index?.candidateId ?? null, evidence.index?.environmentId ?? null, task.digest);
      if (state === "mismatch") envelopeMismatches.push(task.taskId);
      else if (state === "stale") staleTasks.push(task.taskId);
      else if (state === "unknown" || state === "red") unknownTasks.push(task.taskId);
      if (state !== "match") incompleteTasks.push(task.taskId);
    }
  }
  const availableEvidenceRefs = new Set((evidence.index?.lanes ?? []).map((lane) => lane.name));
  const claims: ClaimInventoryRow[] = (evidence.index?.claims ?? []).map((claim) => {
    const result = evaluateClaimEvidence(
      claim,
      evidence.index?.candidateId ?? "unknown-candidate",
      evidence.index?.environmentId ?? "unknown-environment",
      availableEvidenceRefs,
    );
    return {
      claimId: claim.claimId,
      state: result.state,
      maximumSupportedClaim: claim.maximumSupportedClaim,
      requiredMembers: result.requiredMembers,
      supportedMembers: result.supportedMembers,
      reasons: result.reasons,
    };
  });
  const retained = mode === "ownership" ? [] : listRetainedFiles(changeRoot);
  const indexed = new Set((evidence.index?.lanes ?? []).flatMap((lane) => lane.files.map((file) => file.path.replaceAll("\\", "/"))));
  const unindexedFiles = retained.filter((file) => !indexed.has(file.relative)).map((file) => file.relative);
  const unknownBytes = retained.some((file) => file.bytes < 0);
  const retainedBytes = unknownBytes ? -1 : retained.reduce((sum, file) => sum + file.bytes, 0);
  const limits = evidence.index == null ? { maxFiles: 64, maxBytes: 25 * 1024 * 1024 } : effectiveRetention(evidence.index);
  const overLimit = retained.length > limits.maxFiles || retainedBytes < 0 || retainedBytes > limits.maxBytes || unindexedFiles.length > 0;
  return {
    manifest: ownership.manifest,
    row: {
      changeId,
      relativePath,
      mutationEnabled: ownership.manifest?.mutationEnabled ?? "unknown",
      ownership: ownership.status,
      evidence: evidence.status,
      checkedTasks: checked.length,
      uncheckedTasks: checkboxes.length - checked.length,
      taskRows: evidence.index?.tasks.length ?? 0,
      claimRows: claims.length,
      claims,
      incompleteTasks,
      envelopeMismatches,
      staleTasks,
      unknownTasks,
      retainedFiles: retained.length,
      retainedBytes,
      unindexedFiles,
      overLimit,
    },
  };
}

function findingsFrom(rows: ChangeInventoryRow[], overlaps: Array<OwnershipOverlap & { unresolved: boolean }>): InventoryFinding[] {
  const findings: InventoryFinding[] = [];
  for (const row of rows) {
    if (row.checkedTasks > 0 && (row.incompleteTasks.length > 0 || row.evidence.status !== "present")) {
      findings.push({
        id: "AUD-001",
        code: "invalid-complete",
        changeIds: [row.changeId],
        fact: "Checked tasks are not evidence-complete.",
        winner: null,
      });
    }
    if (row.overLimit) {
      findings.push({
        id: "AUD-006",
        code: "evidence-unbounded",
        changeIds: [row.changeId],
        fact: `Retained ${row.retainedFiles} files / ${row.retainedBytes} bytes with ${row.unindexedFiles.length} unindexed.`,
        winner: null,
      });
    }
    if (row.envelopeMismatches.length > 0) {
      findings.push({
        id: "AUD-008",
        code: "proof-envelope-mismatch",
        changeIds: [row.changeId],
        fact: `Weaker or mismatched proof envelope for task(s): ${row.envelopeMismatches.join(", ")}.`,
        winner: null,
      });
    }
    const unsupportedClaims = row.claims.filter((claim) => claim.state !== "supported" && claim.state !== "narrowed");
    if (unsupportedClaims.length > 0) {
      findings.push({
        id: "AUD-009",
        code: "claim-evidence-gap",
        changeIds: [row.changeId],
        fact: unsupportedClaims.map((claim) => `${claim.claimId}=${claim.state} (${claim.supportedMembers}/${claim.requiredMembers})`).join(", "),
        winner: null,
      });
    }
  }
  const unresolved = overlaps.filter((item) => item.unresolved);
  if (unresolved.length > 0) {
    const changeIds = [...new Set(unresolved.flatMap((item) => [item.leftChangeId, item.rightChangeId]))].sort((left, right) => left.localeCompare(right));
    findings.push({
      id: "AUD-007",
      code: "ownership-overlap",
      changeIds,
      fact: "Active owners overlap without a single mutation-enabled acyclic dependency or transfer.",
      winner: null,
    });
  }
  return findings.sort((left, right) => left.id.localeCompare(right.id) || left.changeIds.join(",").localeCompare(right.changeIds.join(",")));
}

export function inventoryOpenSpecChanges(root: string, mode: InventoryMode = "all"): OpenSpecChangeInventory {
  const resolved = path.resolve(root);
  const changeIds = listActiveChangeIds(resolved);
  const scanned = changeIds.map((changeId) => inventoryChange(resolved, changeId, mode));
  const manifests = scanned.flatMap((item) => item.manifest == null ? [] : [item.manifest]);
  const cycles = mode === "evidence" ? [] : findOwnershipCycles(manifests);
  const overlaps = mode === "evidence"
    ? []
    : findOwnershipOverlaps(manifests).map((overlap) => {
      const left = manifests.find((item) => item.changeId === overlap.leftChangeId);
      const right = manifests.find((item) => item.changeId === overlap.rightChangeId);
      return {
        ...overlap,
        unresolved: left == null || right == null || unresolvedOwnershipConflict(overlap, left, right, cycles),
      };
    });
  const changes = scanned.map((item) => item.row);
  return {
    schemaVersion: 1,
    mode,
    writes: false,
    filesRewritten: [],
    changes,
    overlaps,
    cycles,
    findings: findingsFrom(changes, overlaps),
  };
}

function redactRoot(root: string, value: unknown): unknown {
  const token = root.replaceAll("\\", "/");
  return JSON.parse(JSON.stringify(value).replaceAll(root.replaceAll("\\", "\\\\"), "<repo>").replaceAll(token, "<repo>"));
}

export function runOpenSpecChangeInventoryCli(args: string[]): number {
  try {
    const parsed = parseInventoryArgs(args);
    if ("help" in parsed) {
      console.log(usage());
      return 0;
    }
    const inventory = inventoryOpenSpecChanges(parsed.root, parsed.mode);
    const output = parsed.showRoot ? { ...inventory, root: path.resolve(parsed.root) } : inventory;
    console.log(JSON.stringify(parsed.showRoot ? output : redactRoot(path.resolve(parsed.root), output), null, 2));
    return 0;
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    return 2;
  }
}

function isMainModule(): boolean {
  const entrypoint = process.argv[1];
  return Boolean(entrypoint && import.meta.url === pathToFileURL(path.resolve(entrypoint)).href);
}

if (isMainModule()) {
  process.exitCode = runOpenSpecChangeInventoryCli(process.argv.slice(2));
}
