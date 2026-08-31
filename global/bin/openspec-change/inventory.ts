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
  MAX_MANIFEST_BYTES,
  type SchemaIssue,
} from "./manifest.ts";

export type InventoryMode = "all" | "ownership";

export type TaskCheckbox = {
  checked: boolean;
  taskId: string;
  text: string;
};

export type ChangeInventoryRow = {
  changeId: string;
  relativePath: string;
  mutationEnabled: boolean | "unknown";
  ownership: { status: "present" | "missing" | "invalid"; issues: SchemaIssue[] };
  checkedTasks: number;
  uncheckedTasks: number;
};

export type InventoryFinding = {
  id: "AUD-007";
  code: "ownership-overlap";
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

type Options = {
  root: string;
  mode: InventoryMode;
  showRoot: boolean;
};

function usage(): string {
  return `Usage:
  node global/bin/openspec-change/inventory.ts --root <path> [--mode all|ownership]

Reads active OpenSpec ownership.json files and task checkboxes.
It does not choose a winner or rewrite files.

Options:
  --root <path>   Project root containing openspec/changes.
  --mode <mode>   all (default) or ownership.
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
      if (mode !== "all" && mode !== "ownership") {
        throw new Error("--mode must be all or ownership.");
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

function inventoryChange(root: string, changeId: string, mode: InventoryMode): { row: ChangeInventoryRow; manifest: OwnershipManifest | null } {
  const relativePath = `openspec/changes/${changeId}`;
  const changeRoot = path.join(root, "openspec", "changes", changeId);
  const ownership = loadOwnership(changeRoot);
  const tasksPath = path.join(changeRoot, "tasks.md");
  const checkboxes = fs.existsSync(tasksPath) ? parseTaskCheckboxes(fs.readFileSync(tasksPath, "utf8")) : [];
  const checked = checkboxes.filter((item) => item.checked);
  return {
    manifest: ownership.manifest,
    row: {
      changeId,
      relativePath,
      mutationEnabled: ownership.manifest?.mutationEnabled ?? "unknown",
      ownership: ownership.status,
      checkedTasks: checked.length,
      uncheckedTasks: checkboxes.length - checked.length,
    },
  };
}

function findingsFrom(rows: ChangeInventoryRow[], overlaps: Array<OwnershipOverlap & { unresolved: boolean }>): InventoryFinding[] {
  const findings: InventoryFinding[] = [];
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
  const cycles = findOwnershipCycles(manifests);
  const overlaps = findOwnershipOverlaps(manifests).map((overlap) => {
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
