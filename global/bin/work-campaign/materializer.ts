import fs from "node:fs";
import path from "node:path";
import { createHash, randomUUID } from "node:crypto";

import { stableJson } from "../roadmap-mission/contracts.ts";
import {
  WorkCampaignError,
  campaignDigest,
  parseWorkCampaignRecord,
} from "./contracts.ts";
import type {
  CampaignClosureMatrix,
  CampaignInventoryBlock,
  CampaignReportSeed,
  CampaignReconciliationResult,
  CampaignWaveManifest,
  CampaignWorkItem,
  WorkCampaignDefinition,
  WorkCampaignRecord,
  WorkCampaignResult,
} from "./contracts.ts";

export type CampaignSeedRecord = Exclude<WorkCampaignRecord, CampaignClosureMatrix | WorkCampaignResult>;

type CampaignLedgerEntry = {
  entryDigest: string;
  previousEntryDigest: string | null;
  record: CampaignSeedRecord;
  recordDigest: string;
  recordKey: string;
  schemaVersion: 1;
  sequence: number;
};

type ActiveSeedRecord = {
  entryDigest: string;
  record: CampaignSeedRecord;
  recordDigest: string;
  recordKey: string;
  sequence: number;
};

type CampaignSeedIndex = {
  activeRecords: Array<{
    entryDigest: string;
    recordDigest: string;
    recordKey: string;
    recordType: CampaignSeedRecord["recordType"];
    sequence: number;
  }>;
  campaignId: string;
  definitionDigest: string;
  entryCount: number;
  lastEntryDigest: string | null;
  recordCounts: Record<string, number>;
  schemaVersion: 1;
};

type CampaignReportProjection = {
  campaignId: string;
  candidateDigest: string;
  closureDigest: string;
  definitionDigest: string;
  indexDigest: string;
  inventoryDigest: string;
  ledgerDigest: string;
  reportDigest: string;
  reportPath: string;
  schemaVersion: 1;
};

export type CampaignLedgerAppendResult = {
  appended: boolean;
  entryDigest: string;
  indexDigest: string;
  recordDigest: string;
  recordKey: string;
  sequence: number;
};

export type CampaignMaterializationResult = CampaignReportProjection & {
  closure: CampaignClosureMatrix;
  seedEntries: number;
  status: "current";
};

const digestPattern = /^[a-f0-9]{64}$/u;
const entryNamePattern = /^(\d{8})-([a-f0-9]{64})\.json$/u;
const maxLedgerEntries = 10_000;

function plainRecord(value: unknown, field: string): Record<string, unknown> {
  if (value == null || typeof value !== "object" || Array.isArray(value)) {
    throw new WorkCampaignError(`${field} must be a JSON object`, 2, { field });
  }
  return value as Record<string, unknown>;
}

function exactKeys(input: Record<string, unknown>, expected: readonly string[], field: string): void {
  const extras = Object.keys(input).filter((key) => !expected.includes(key)).sort();
  const missing = expected.filter((key) => !(key in input));
  if (extras.length === 0 && missing.length === 0) return;
  const details = [
    missing.length === 0 ? null : `missing=${missing.join(",")}`,
    extras.length === 0 ? null : `unsupported=${extras.join(",")}`,
  ].filter((value): value is string => value != null).join(" ");
  throw new WorkCampaignError(`${field} has invalid fields: ${details}`, 2, { field });
}

function digest(value: unknown, field: string): string {
  if (typeof value !== "string" || !digestPattern.test(value)) {
    throw new WorkCampaignError(`${field} must be a lowercase SHA-256 digest`, 2, { field });
  }
  return value;
}

function integer(value: unknown, field: string, min = 0): number {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < min) {
    throw new WorkCampaignError(`${field} must be an integer of at least ${min}`, 2, { field });
  }
  return value;
}

function regularFile(file: string): boolean {
  const stat = fs.lstatSync(file, { throwIfNoEntry: false });
  return stat?.isFile() === true && !stat.isSymbolicLink();
}

function canonicalRoot(root: string): string {
  try {
    return fs.realpathSync(root);
  } catch (error) {
    throw new WorkCampaignError("project root is unreadable", 2, { cause: error, field: "root" });
  }
}

function resolveContainedDirectory(root: string, relative: string, create: boolean): string {
  let current = canonicalRoot(root);
  for (const segment of relative.split("/")) {
    current = path.join(current, segment);
    const stat = fs.lstatSync(current, { throwIfNoEntry: false });
    if (stat == null) {
      if (!create) throw new WorkCampaignError(`${relative} is unreadable`, 2, { field: relative });
      fs.mkdirSync(current);
      continue;
    }
    if (!stat.isDirectory() || stat.isSymbolicLink()) {
      throw new WorkCampaignError(`${relative} must contain only ordinary directories`, 2, { field: relative });
    }
  }
  return current;
}

function resolveContainedFile(root: string, relative: string, createParent: boolean): string {
  const parts = relative.split("/");
  const name = parts.pop();
  if (name == null) throw new WorkCampaignError("contained file path is empty", 2, { field: relative });
  const parent = parts.length === 0
    ? canonicalRoot(root)
    : resolveContainedDirectory(root, parts.join("/"), createParent);
  const file = path.join(parent, name);
  const stat = fs.lstatSync(file, { throwIfNoEntry: false });
  if (stat != null && (!stat.isFile() || stat.isSymbolicLink())) {
    throw new WorkCampaignError(`${relative} must be an ordinary file`, 2, { field: relative });
  }
  return file;
}

function readContainedJson(root: string, relative: string, field: string, maxBytes: number): unknown {
  const file = resolveContainedFile(root, relative, false);
  if (!regularFile(file)) throw new WorkCampaignError(`${field} is unreadable`, 2, { field });
  if (fs.statSync(file).size > maxBytes) throw new WorkCampaignError(`${field} exceeds its ${maxBytes}-byte input limit`, 2, { field });
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (error) {
    throw new WorkCampaignError(`${field} must contain valid UTF-8 JSON`, 2, { cause: error, field });
  }
}

function writeExclusiveDurable(file: string, content: string): void {
  const descriptor = fs.openSync(file, "wx");
  try {
    fs.writeFileSync(descriptor, content, "utf8");
    fs.fsyncSync(descriptor);
  } finally {
    fs.closeSync(descriptor);
  }
}

function writeAtomic(file: string, content: string): void {
  if (fs.existsSync(file) && !regularFile(file)) {
    throw new WorkCampaignError(`${path.basename(file)} is not a regular non-symlink file`, 2, { field: path.basename(file) });
  }
  const temporary = path.join(path.dirname(file), `.${path.basename(file)}.${process.pid}.${randomUUID()}.tmp`);
  try {
    writeExclusiveDurable(temporary, content);
    fs.renameSync(temporary, file);
  } finally {
    if (fs.existsSync(temporary)) fs.rmSync(temporary, { force: true });
  }
}

function parseSeedRecord(value: unknown): CampaignSeedRecord {
  const parsed = parseWorkCampaignRecord(value);
  if (parsed.recordType === "closure-matrix" || parsed.recordType === "campaign-result") {
    throw new WorkCampaignError(`${parsed.recordType} is derived or lifecycle state and cannot be appended as a reviewed seed`, 2, { field: "recordType" });
  }
  return parsed as CampaignSeedRecord;
}

function recordKey(record: CampaignSeedRecord): string {
  if (record.recordType === "report-seed") return "report-seed";
  return `${record.recordType}:${record.id}`;
}

function bytesDigest(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

function entryBase(entry: Omit<CampaignLedgerEntry, "entryDigest">): Omit<CampaignLedgerEntry, "entryDigest"> {
  return entry;
}

function parseLedgerEntry(value: unknown, file: string, expectedSequence: number, expectedPrevious: string | null): CampaignLedgerEntry {
  const input = plainRecord(value, file);
  exactKeys(input, ["entryDigest", "previousEntryDigest", "record", "recordDigest", "recordKey", "schemaVersion", "sequence"], file);
  if (input.schemaVersion !== 1) throw new WorkCampaignError(`${file}.schemaVersion must be 1`, 2, { field: file });
  const sequence = integer(input.sequence, `${file}.sequence`, 1);
  if (sequence !== expectedSequence) throw new WorkCampaignError(`${file} sequence is not contiguous`, 2, { field: file });
  const previousEntryDigest = input.previousEntryDigest == null ? null : digest(input.previousEntryDigest, `${file}.previousEntryDigest`);
  if (previousEntryDigest !== expectedPrevious) throw new WorkCampaignError(`${file} previous entry digest differs`, 2, { field: file });
  const record = parseSeedRecord(input.record);
  const parsedRecordDigest = digest(input.recordDigest, `${file}.recordDigest`);
  if (parsedRecordDigest !== campaignDigest(record)) throw new WorkCampaignError(`${file} record digest differs`, 2, { field: file });
  const parsedRecordKey = typeof input.recordKey === "string" ? input.recordKey : "";
  if (parsedRecordKey !== recordKey(record)) throw new WorkCampaignError(`${file} record key differs`, 2, { field: file });
  const parsedEntryDigest = digest(input.entryDigest, `${file}.entryDigest`);
  const base = entryBase({
    previousEntryDigest,
    record,
    recordDigest: parsedRecordDigest,
    recordKey: parsedRecordKey,
    schemaVersion: 1,
    sequence,
  });
  if (parsedEntryDigest !== campaignDigest(base)) throw new WorkCampaignError(`${file} entry digest differs`, 2, { field: file });
  return { ...base, entryDigest: parsedEntryDigest };
}

function ledgerPaths(root: string, definition: WorkCampaignDefinition, create: boolean): {
  current: string;
  entries: string;
  evidence: string;
  index: string;
  projection: string;
} {
  const evidence = resolveContainedDirectory(root, definition.evidencePath, create);
  const ledger = path.join(evidence, "ledger");
  const entries = path.join(ledger, "entries");
  const current = path.join(evidence, "current");
  for (const directory of [ledger, entries, current]) {
    const stat = fs.lstatSync(directory, { throwIfNoEntry: false });
    if (stat == null) {
      if (!create) throw new WorkCampaignError("campaign ledger is unreadable", 2, { field: "evidencePath" });
      fs.mkdirSync(directory);
    } else if (!stat.isDirectory() || stat.isSymbolicLink()) {
      throw new WorkCampaignError("campaign ledger contains a non-directory or symbolic link", 2, { field: "evidencePath" });
    }
  }
  return {
    current,
    entries,
    evidence,
    index: path.join(ledger, "seed-index.json"),
    projection: path.join(current, "report-projection.json"),
  };
}

function replayLedger(entriesDirectory: string): CampaignLedgerEntry[] {
  const names = fs.readdirSync(entriesDirectory).sort();
  if (names.length > maxLedgerEntries) throw new WorkCampaignError(`campaign ledger exceeds ${maxLedgerEntries} entries`, 2, { field: "ledger" });
  const entries: CampaignLedgerEntry[] = [];
  let previous: string | null = null;
  for (const [index, name] of names.entries()) {
    const match = entryNamePattern.exec(name);
    if (match == null || Number(match[1]) !== index + 1) {
      throw new WorkCampaignError(`campaign ledger entry ${name} is not contiguous`, 2, { field: "ledger" });
    }
    const file = path.join(entriesDirectory, name);
    if (!regularFile(file)) throw new WorkCampaignError(`campaign ledger entry ${name} is not an ordinary file`, 2, { field: "ledger" });
    let parsed: unknown;
    try {
      parsed = JSON.parse(fs.readFileSync(file, "utf8"));
    } catch (error) {
      throw new WorkCampaignError(`campaign ledger entry ${name} is invalid JSON`, 2, { cause: error, field: "ledger" });
    }
    const entry = parseLedgerEntry(parsed, name, index + 1, previous);
    if (match[2] !== entry.entryDigest) throw new WorkCampaignError(`campaign ledger entry ${name} filename digest differs`, 2, { field: "ledger" });
    entries.push(entry);
    previous = entry.entryDigest;
  }
  return entries;
}

function activeRecords(entries: CampaignLedgerEntry[]): ActiveSeedRecord[] {
  const current = new Map<string, ActiveSeedRecord>();
  for (const entry of entries) {
    current.set(entry.recordKey, {
      entryDigest: entry.entryDigest,
      record: entry.record,
      recordDigest: entry.recordDigest,
      recordKey: entry.recordKey,
      sequence: entry.sequence,
    });
  }
  return [...current.values()].sort((left, right) => left.recordKey.localeCompare(right.recordKey));
}

function buildSeedIndex(definition: WorkCampaignDefinition, entries: CampaignLedgerEntry[]): CampaignSeedIndex {
  const active = activeRecords(entries);
  const recordCounts: Record<string, number> = {};
  for (const row of active) recordCounts[row.record.recordType] = (recordCounts[row.record.recordType] ?? 0) + 1;
  return {
    activeRecords: active.map((row) => ({
      entryDigest: row.entryDigest,
      recordDigest: row.recordDigest,
      recordKey: row.recordKey,
      recordType: row.record.recordType,
      sequence: row.sequence,
    })),
    campaignId: definition.campaignId,
    definitionDigest: campaignDigest(definition),
    entryCount: entries.length,
    lastEntryDigest: entries[entries.length - 1]?.entryDigest ?? null,
    recordCounts: Object.fromEntries(Object.entries(recordCounts).sort(([left], [right]) => left.localeCompare(right))),
    schemaVersion: 1,
  };
}

function directoryBytes(directory: string): number {
  let bytes = 0;
  const visit = (current: string): void => {
    for (const name of fs.readdirSync(current).sort()) {
      const item = path.join(current, name);
      const stat = fs.lstatSync(item);
      if (stat.isSymbolicLink()) throw new WorkCampaignError("campaign evidence must not contain symbolic links", 2, { field: "evidencePath" });
      if (stat.isDirectory()) visit(item);
      else if (stat.isFile()) bytes += stat.size;
      else throw new WorkCampaignError("campaign evidence must contain only ordinary files and directories", 2, { field: "evidencePath" });
    }
  };
  visit(directory);
  return bytes;
}

function retainedBytesAfter(evidence: string, report: string, replacements: Map<string, string>): number {
  const evidenceBoundary = `${evidence}${path.sep}`;
  const reportInsideEvidence = report.startsWith(evidenceBoundary);
  let bytes = directoryBytes(evidence);
  if (!reportInsideEvidence && regularFile(report)) bytes += fs.statSync(report).size;
  for (const [file, content] of replacements) {
    const counted = file.startsWith(evidenceBoundary) || file === report;
    if (!counted) continue;
    if (regularFile(file)) bytes -= fs.statSync(file).size;
    bytes += Buffer.byteLength(content, "utf8");
  }
  return bytes;
}

function requireEvidenceBudget(definition: WorkCampaignDefinition, bytes: number): void {
  if (bytes > definition.budgets.evidenceBytes) {
    throw new WorkCampaignError(`campaign evidence would exceed its ${definition.budgets.evidenceBytes}-byte budget`, 2, { field: "budgets.evidenceBytes" });
  }
}

function under(relative: string, owner: string): boolean {
  return relative === owner || relative.startsWith(`${owner}/`);
}

function refs(values: string[]): string {
  return values.length === 0 ? "none" : values.map((value) => `\`${value}\``).join(", ");
}

function cell(value: string): string {
  return value.replace(/\\/gu, "\\\\").replace(/\|/gu, "\\|").replace(/\r?\n/gu, "<br>");
}

function table(headers: string[], rows: string[][]): string {
  if (rows.length === 0) return "none";
  return [
    `| ${headers.join(" | ")} |`,
    `| ${headers.map(() => "---").join(" | ")} |`,
    ...rows.map((row) => `| ${row.join(" | ")} |`),
  ].join("\n");
}

function latestReconciliations(active: ActiveSeedRecord[]): Map<string, ActiveSeedRecord & { record: CampaignReconciliationResult }> {
  const result = new Map<string, ActiveSeedRecord & { record: CampaignReconciliationResult }>();
  for (const row of active) {
    if (row.record.recordType !== "reconciliation-result") continue;
    const previous = result.get(row.record.workItemId);
    if (previous == null || previous.sequence < row.sequence) {
      result.set(row.record.workItemId, row as ActiveSeedRecord & { record: CampaignReconciliationResult });
    }
  }
  return result;
}

function requireReportSeed(active: ActiveSeedRecord[]): ActiveSeedRecord & { record: CampaignReportSeed } {
  const row = active.find((item) => item.record.recordType === "report-seed");
  if (row == null) throw new WorkCampaignError("campaign ledger has no current report-seed", 2, { field: "report-seed" });
  return row as ActiveSeedRecord & { record: CampaignReportSeed };
}

function validateCurrentRecords(
  definition: WorkCampaignDefinition,
  active: ActiveSeedRecord[],
  inventoryDigest: string,
): {
  blocks: Array<ActiveSeedRecord & { record: CampaignInventoryBlock }>;
  reportSeed: ActiveSeedRecord & { record: CampaignReportSeed };
  waves: Array<ActiveSeedRecord & { record: CampaignWaveManifest }>;
  workItems: Array<ActiveSeedRecord & { record: CampaignWorkItem }>;
} {
  const definitionDigest = campaignDigest(definition);
  const blocks = active.filter((row): row is ActiveSeedRecord & { record: CampaignInventoryBlock } => row.record.recordType === "inventory-block");
  const workItems = active.filter((row): row is ActiveSeedRecord & { record: CampaignWorkItem } => row.record.recordType === "work-item");
  const waves = active.filter((row): row is ActiveSeedRecord & { record: CampaignWaveManifest } => row.record.recordType === "wave-manifest");
  const reportSeed = requireReportSeed(active);
  if (blocks.length === 0) throw new WorkCampaignError("campaign ledger has no inventory blocks", 2, { field: "inventory-block" });
  if (new Set(blocks.map((row) => row.record.path)).size !== blocks.length) {
    throw new WorkCampaignError("current inventory block paths must be unique", 2, { field: "inventory-block" });
  }
  for (const { record } of blocks) {
    const inScope = definition.scopeRoots.some((scope) => under(record.path, scope));
    const excluded = definition.exclusions.some((exclusion) => under(record.path, exclusion));
    if (record.classification === "excluded" ? !excluded && !inScope : !inScope || excluded) {
      throw new WorkCampaignError(`inventory block ${record.id} does not match declared scope/exclusions`, 2, { field: "inventory-block" });
    }
  }
  if (reportSeed.record.definitionDigest !== definitionDigest) {
    throw new WorkCampaignError("report-seed definition digest differs", 2, { field: "report-seed.definitionDigest" });
  }
  const blockIds = new Set(blocks.map((row) => row.record.id));
  const itemIds = new Set(workItems.map((row) => row.record.id));
  for (const { record } of workItems) {
    if (record.candidateDigest !== reportSeed.record.candidateDigest) throw new WorkCampaignError(`work item ${record.id} candidate digest differs`, 2, { field: "work-item" });
    if (record.sourceBlockIds.some((id) => !blockIds.has(id))) throw new WorkCampaignError(`work item ${record.id} references an unknown block`, 2, { field: "work-item" });
  }
  for (const { record } of blocks) {
    const hasFinding = workItems.some((row) => row.record.sourceBlockIds.includes(record.id));
    if ((record.reviewStatus === "reviewed-with-finding") !== hasFinding
      && ["reviewed-no-finding", "reviewed-with-finding"].includes(record.reviewStatus)) {
      throw new WorkCampaignError(`inventory block ${record.id} review status conflicts with current work-item refs`, 2, { field: "inventory-block.reviewStatus" });
    }
  }
  for (const { record } of active) {
    if (record.recordType === "partition-result") {
      if (record.blockIds.some((id) => !blockIds.has(id)) || record.workItemIds.some((id) => !itemIds.has(id))) {
        throw new WorkCampaignError(`partition result ${record.id} contains an unknown reference`, 2, { field: "partition-result" });
      }
    } else if (record.recordType === "reconciliation-result") {
      if (!itemIds.has(record.workItemId)) {
        throw new WorkCampaignError(`reconciliation result ${record.id} identity differs`, 2, { field: "reconciliation-result" });
      }
    } else if (record.recordType === "investigation-result") {
      if (!itemIds.has(record.workItemId) || record.sourceBlockIds.some((id) => !blockIds.has(id))) {
        throw new WorkCampaignError(`investigation result ${record.id} contains an unknown reference`, 2, { field: "investigation-result" });
      }
    } else if (record.recordType === "wave-manifest") {
      if (record.campaignId !== definition.campaignId || record.definitionDigest !== definitionDigest) {
        throw new WorkCampaignError(`wave ${record.id} identity differs`, 2, { field: "wave-manifest" });
      }
      if (record.workItemIds.some((id) => !itemIds.has(id))) throw new WorkCampaignError(`wave ${record.id} references an unknown work item`, 2, { field: "wave-manifest" });
    }
  }
  const reconciliations = latestReconciliations(active);
  for (const { record } of waves) {
    for (const id of record.workItemIds) {
      const item = workItems.find((row) => row.record.id === id)?.record;
      const severity = reconciliations.get(id)?.record.severity ?? item?.initialSeverity;
      if (item == null || !["P0", "P1"].includes(String(severity)) || !["confirmed", "fixed-and-verified"].includes(item.status)) {
        throw new WorkCampaignError(`wave ${record.id} contains a non-remediation work item ${id}`, 2, { field: "wave-manifest" });
      }
    }
  }
  for (const row of reportSeed.record.matrixRows) {
    if (row.blockIds.some((id) => !blockIds.has(id)) || row.workItemIds.some((id) => !itemIds.has(id))) {
      throw new WorkCampaignError(`matrix row ${row.id} contains an unknown reference`, 2, { field: "report-seed.matrixRows" });
    }
  }
  const waveIds = new Set(waves.map((row) => row.record.id));
  if (new Set(reportSeed.record.waveRows.map((row) => row.waveId)).size !== reportSeed.record.waveRows.length) {
    throw new WorkCampaignError("report-seed waveRows must reference each wave at most once", 2, { field: "report-seed.waveRows" });
  }
  for (const row of reportSeed.record.waveRows) {
    if (!waveIds.has(row.waveId)) throw new WorkCampaignError(`wave row ${row.id} references an unknown wave`, 2, { field: "report-seed.waveRows" });
    if (row.status === "complete" && (row.archiveRefs.length === 0 || row.checkpointRef == null)) {
      throw new WorkCampaignError(`complete wave row ${row.id} requires archive and checkpoint refs`, 2, { field: "report-seed.waveRows" });
    }
  }
  return { blocks, reportSeed, waves, workItems };
}

function closureFacts(
  definition: WorkCampaignDefinition,
  active: ActiveSeedRecord[],
  inventoryDigest: string,
): Omit<CampaignClosureMatrix, "reportDigest"> {
  const { blocks, reportSeed, waves, workItems } = validateCurrentRecords(definition, active, inventoryDigest);
  const reconciliations = latestReconciliations(active);
  const currentTerminal = blocks.filter((row) => ["excluded", "reviewed-no-finding", "reviewed-with-finding"].includes(row.record.reviewStatus)).length;
  const needsRereview = blocks.filter((row) => row.record.reviewStatus === "needs-rereview").length;
  const blocked = blocks.length - currentTerminal - needsRereview;
  const fixedAndVerified = workItems.filter((row) => row.record.status === "fixed-and-verified").length;
  const reportOnly = workItems.filter((row) => row.record.status === "report-only").length;
  const ownerRequired = workItems.filter((row) => row.record.status === "owner-required").length;
  const unknownMaterial = workItems.filter((row) => row.record.status === "unknown-material").length;
  const resolved = workItems.filter((row) => ["duplicate", "falsified", "fixed-and-verified", "report-only"].includes(row.record.status)).length;
  const unresolvedP0P1 = workItems.filter((row) => {
    const severity = reconciliations.get(row.record.id)?.record.severity ?? row.record.initialSeverity;
    return ["P0", "P1"].includes(severity) && !["duplicate", "falsified", "fixed-and-verified", "report-only"].includes(row.record.status);
  }).length;
  for (const row of workItems) {
    const severity = reconciliations.get(row.record.id)?.record.severity ?? row.record.initialSeverity;
    if (row.record.status === "report-only" && !["P2", "P3"].includes(severity)) {
      throw new WorkCampaignError(`work item ${row.record.id} cannot be report-only at severity ${severity}`, 2, { field: "work-item.status" });
    }
  }
  const completedWaveRows = reportSeed.record.waveRows.filter((row) => row.status === "complete");
  const archived = completedWaveRows.filter((row) => row.archiveRefs.length > 0).length;
  const checkpointed = completedWaveRows.filter((row) => row.checkpointRef != null).length;
  const validationRows = reportSeed.record.validationRows.filter((row) => row.kind === "validation");
  const proofRows = reportSeed.record.validationRows.filter((row) => row.kind === "proof");
  const validationRowsCurrent = validationRows.length > 0 && validationRows.every((row) => row.status === "complete");
  const proofRowsCurrent = proofRows.length > 0 && proofRows.every((row) => row.status === "complete");
  if (reportSeed.record.validationStatus === "complete" && !validationRowsCurrent) {
    throw new WorkCampaignError("validationStatus complete conflicts with validation rows", 2, { field: "report-seed.validationStatus" });
  }
  if (reportSeed.record.proofStatus === "complete" && !proofRowsCurrent) {
    throw new WorkCampaignError("proofStatus complete conflicts with proof rows", 2, { field: "report-seed.proofStatus" });
  }
  if (reportSeed.record.terminalState === "complete") {
    const complete = blocked === 0
      && needsRereview === 0
      && unresolvedP0P1 === 0
      && unknownMaterial === 0
      && ownerRequired === 0
      && resolved === workItems.length
      && waves.length === archived
      && waves.length === checkpointed
      && reportSeed.record.blockers.length === 0
      && reportSeed.record.challengeStatus === "complete"
      && reportSeed.record.ownershipStatus === "terminal"
      && reportSeed.record.proofStatus === "complete"
      && reportSeed.record.validationStatus === "complete";
    if (!complete) throw new WorkCampaignError("terminalState complete conflicts with current explicit closure facts", 2, { field: "report-seed.terminalState" });
  }
  return {
    candidateDigest: reportSeed.record.candidateDigest,
    challengeStatus: reportSeed.record.challengeStatus,
    definitionDigest: campaignDigest(definition),
    inventory: { blocked, currentTerminal, needsRereview, total: blocks.length },
    ownershipStatus: reportSeed.record.ownershipStatus,
    proofStatus: reportSeed.record.proofStatus,
    recordType: "closure-matrix",
    schemaVersion: 1,
    terminalState: reportSeed.record.terminalState,
    validationStatus: reportSeed.record.validationStatus,
    waves: { archived, checkpointed, total: waves.length },
    workItems: { fixedAndVerified, ownerRequired, reportOnly, resolved, total: workItems.length, unknownMaterial, unresolvedP0P1 },
  };
}

function seedRef(row: ActiveSeedRecord): string {
  return `ledger:${String(row.sequence).padStart(8, "0")}/${row.entryDigest}`;
}

function renderReport(
  definition: WorkCampaignDefinition,
  active: ActiveSeedRecord[],
  index: CampaignSeedIndex,
  indexDigest: string,
  inventoryDigest: string,
  closure: Omit<CampaignClosureMatrix, "reportDigest">,
): string {
  const { blocks, reportSeed, waves, workItems } = validateCurrentRecords(definition, active, inventoryDigest);
  const reconciliations = latestReconciliations(active);
  const metadata = Buffer.from(stableJson({
    campaignId: definition.campaignId,
    candidateDigest: closure.candidateDigest,
    definitionDigest: closure.definitionDigest,
    indexDigest,
    inventoryDigest,
    ledgerDigest: index.lastEntryDigest,
    schemaVersion: 1,
  }), "utf8").toString("base64url");
  const workRows = workItems.map((row) => {
    const reconciliation = reconciliations.get(row.record.id);
    const severity = reconciliation?.record.severity ?? row.record.initialSeverity;
    return [
      `\`${row.record.id}\``,
      severity,
      row.record.status,
      cell(row.record.scenario),
      cell(row.record.impact),
      refs(row.record.evidenceRefs),
      `\`${seedRef(row)}\``,
    ];
  });
  const traceRows = workItems.map((row) => {
    const memberships = waves.filter((wave) => wave.record.workItemIds.includes(row.record.id));
    const changes = memberships.flatMap((wave) => wave.record.slices.filter((slice) => slice.workItemIds.includes(row.record.id)).map((slice) => slice.changeId));
    return [
      `\`${row.record.id}\``,
      refs(row.record.sourceBlockIds.map((id) => `block:${id}`)),
      refs(memberships.map((wave) => `wave:${wave.record.id}`)),
      refs(changes.map((id) => `change:${id}`)),
      refs(row.record.evidenceRefs),
    ];
  });
  const matrixTable = (kind: CampaignReportSeed["matrixRows"][number]["kind"]): string => table(
    ["ID", "Status", "Summary", "Blocks", "Work Items", "Evidence"],
    reportSeed.record.matrixRows.filter((row) => row.kind === kind).map((row) => [
      `\`${row.id}\``, row.status, cell(row.summary), refs(row.blockIds.map((id) => `block:${id}`)), refs(row.workItemIds.map((id) => `item:${id}`)), refs(row.evidenceRefs),
    ]),
  );
  return [
    `<!-- work-campaign-report-v1:${metadata} -->`,
    "# Autonomous Work Campaign Report",
    "",
    "## Identity",
    "",
    `- Campaign: \`${definition.campaignId}\``,
    `- Definition digest: \`${closure.definitionDigest}\``,
    `- Candidate digest: \`${closure.candidateDigest}\``,
    `- Ledger digest: \`${index.lastEntryDigest ?? "none"}\``,
    `- Inventory digest: \`${inventoryDigest}\``,
    `- Report seed: \`${seedRef(reportSeed)}\``,
    "",
    "## Outcome",
    "",
    definition.outcome,
    "",
    "## Scope",
    "",
    ...definition.scopeRoots.map((value) => `- \`${value}\``),
    "",
    "## Exclusions",
    "",
    ...(definition.exclusions.length === 0 ? ["none"] : definition.exclusions.map((value) => `- \`${value}\``)),
    "",
    "## Block Coverage",
    "",
    table(["ID", "Path", "Kind", "Classification", "Review", "Digest", "Seed"], blocks.map((row) => [
      `\`${row.record.id}\``, `\`${row.record.path}\``, row.record.kind, row.record.classification, row.record.reviewStatus, `\`${row.record.digest}\``, `\`${seedRef(row)}\``,
    ])),
    "",
    `Coverage totals: total=${closure.inventory.total}, current-terminal=${closure.inventory.currentTerminal}, blocked=${closure.inventory.blocked}, needs-rereview=${closure.inventory.needsRereview}.`,
    "",
    "## P0-P3 Findings And Dispositions",
    "",
    table(["ID", "Severity", "Disposition", "Scenario", "Impact", "Evidence", "Seed"], workRows),
    "",
    `Work-item totals: total=${closure.workItems.total}, resolved=${closure.workItems.resolved}, fixed-and-verified=${closure.workItems.fixedAndVerified}, report-only=${closure.workItems.reportOnly}, unresolved-P0-P1=${closure.workItems.unresolvedP0P1}, unknown-material=${closure.workItems.unknownMaterial}, owner-required=${closure.workItems.ownerRequired}.`,
    "",
    "## Remediation Traceability",
    "",
    table(["Work Item", "Blocks", "Waves", "Changes", "Evidence"], traceRows),
    "",
    "## Redundancy Matrix",
    "",
    matrixTable("redundancy"),
    "",
    "## Test-Gap Matrix",
    "",
    matrixTable("test-gap"),
    "",
    "## Failure-Mode Matrix",
    "",
    matrixTable("failure-mode"),
    "",
    "## Waves And Checkpoints",
    "",
    table(["Wave", "Status", "Archives", "Checkpoint", "Summary", "Evidence"], reportSeed.record.waveRows.map((row) => [
      `\`${row.waveId}\``, row.status, refs(row.archiveRefs), row.checkpointRef == null ? "none" : `\`${row.checkpointRef}\``, cell(row.summary), refs(row.evidenceRefs),
    ])),
    "",
    `Wave totals: total=${closure.waves.total}, archived=${closure.waves.archived}, checkpointed=${closure.waves.checkpointed}.`,
    "",
    "## Validation And Proof",
    "",
    table(["ID", "Kind", "Status", "Argv", "Summary", "Evidence"], reportSeed.record.validationRows.map((row) => [
      `\`${row.id}\``, row.kind, row.status, `\`${cell(JSON.stringify(row.argv))}\``, cell(row.summary), refs(row.evidenceRefs),
    ])),
    "",
    `Aggregate statuses: validation=${closure.validationStatus}, proof=${closure.proofStatus}, challenge=${closure.challengeStatus}, ownership=${closure.ownershipStatus}.`,
    "",
    "## Blockers",
    "",
    table(["ID", "Status", "Summary", "Evidence"], reportSeed.record.blockers.map((row) => [
      `\`${row.id}\``, row.status, cell(row.summary), refs(row.evidenceRefs),
    ])),
    "",
    "## Limitations",
    "",
    table(["ID", "Summary", "Evidence"], reportSeed.record.limitations.map((row) => [
      `\`${row.id}\``, cell(row.summary), refs(row.evidenceRefs),
    ])),
    "",
    "## Closure",
    "",
    `Terminal state: \`${closure.terminalState}\`.`,
    "",
    "## Maximum Claim",
    "",
    reportSeed.record.maximumClaim,
    "",
  ].join("\n");
}

function buildMaterialization(definition: WorkCampaignDefinition, entries: CampaignLedgerEntry[]): {
  closure: CampaignClosureMatrix;
  closureDigest: string;
  closureText: string;
  index: CampaignSeedIndex;
  indexDigest: string;
  indexText: string;
  inventoryDigest: string;
  projection: CampaignReportProjection;
  projectionText: string;
  report: string;
  reportDigest: string;
} {
  const active = activeRecords(entries);
  const index = buildSeedIndex(definition, entries);
  const indexText = stableJson(index);
  const indexDigest = campaignDigest(index);
  const inventory = active
    .filter((row): row is ActiveSeedRecord & { record: CampaignInventoryBlock } => row.record.recordType === "inventory-block")
    .map((row) => row.record)
    .sort((left, right) => left.id.localeCompare(right.id));
  const inventoryDigest = campaignDigest(inventory);
  const facts = closureFacts(definition, active, inventoryDigest);
  const report = renderReport(definition, active, index, indexDigest, inventoryDigest, facts);
  const reportDigest = bytesDigest(report);
  const closure: CampaignClosureMatrix = { ...facts, reportDigest };
  const closureText = stableJson(closure);
  const closureDigest = campaignDigest(closure);
  const projection: CampaignReportProjection = {
    campaignId: definition.campaignId,
    candidateDigest: facts.candidateDigest,
    closureDigest,
    definitionDigest: campaignDigest(definition),
    indexDigest,
    inventoryDigest,
    ledgerDigest: index.lastEntryDigest ?? campaignDigest([]),
    reportDigest,
    reportPath: definition.reportPath,
    schemaVersion: 1,
  };
  return {
    closure,
    closureDigest,
    closureText,
    index,
    indexDigest,
    indexText,
    inventoryDigest,
    projection,
    projectionText: stableJson(projection),
    report,
    reportDigest,
  };
}

function projectionFromJson(value: unknown): CampaignReportProjection {
  const input = plainRecord(value, "report projection");
  exactKeys(input, ["campaignId", "candidateDigest", "closureDigest", "definitionDigest", "indexDigest", "inventoryDigest", "ledgerDigest", "reportDigest", "reportPath", "schemaVersion"], "report projection");
  if (input.schemaVersion !== 1) throw new WorkCampaignError("report projection schemaVersion must be 1", 2, { field: "report projection" });
  const campaignId = typeof input.campaignId === "string" ? input.campaignId : "";
  const reportPath = typeof input.reportPath === "string" ? input.reportPath : "";
  if (campaignId === "" || reportPath === "") throw new WorkCampaignError("report projection identity is invalid", 2, { field: "report projection" });
  return {
    campaignId,
    candidateDigest: digest(input.candidateDigest, "report projection.candidateDigest"),
    closureDigest: digest(input.closureDigest, "report projection.closureDigest"),
    definitionDigest: digest(input.definitionDigest, "report projection.definitionDigest"),
    indexDigest: digest(input.indexDigest, "report projection.indexDigest"),
    inventoryDigest: digest(input.inventoryDigest, "report projection.inventoryDigest"),
    ledgerDigest: digest(input.ledgerDigest, "report projection.ledgerDigest"),
    reportDigest: digest(input.reportDigest, "report projection.reportDigest"),
    reportPath,
    schemaVersion: 1,
  };
}

export function loadCampaignSeedRecord(root: string, relative: string, evidenceBudget: number): CampaignSeedRecord {
  return parseSeedRecord(readContainedJson(root, relative, "recordPath", Math.min(evidenceBudget, 8_388_608)));
}

export function readCurrentCampaignSeedRecords(
  root: string,
  definition: WorkCampaignDefinition,
): CampaignSeedRecord[] {
  const paths = ledgerPaths(root, definition, false);
  return activeRecords(replayLedger(paths.entries)).map((entry) => entry.record);
}

export function readCurrentCampaignReconciliations(
  root: string,
  definition: WorkCampaignDefinition,
): CampaignReconciliationResult[] {
  const paths = ledgerPaths(root, definition, false);
  return [...latestReconciliations(activeRecords(replayLedger(paths.entries))).values()]
    .sort((left, right) => left.record.workItemId.localeCompare(right.record.workItemId))
    .map((entry) => entry.record);
}

export function appendCampaignLedgerRecord(
  root: string,
  definition: WorkCampaignDefinition,
  record: CampaignSeedRecord,
): CampaignLedgerAppendResult {
  const paths = ledgerPaths(root, definition, true);
  const entries = replayLedger(paths.entries);
  const current = activeRecords(entries).find((row) => row.recordKey === recordKey(record));
  const recordDigest = campaignDigest(record);
  if (current?.recordDigest === recordDigest) {
    const index = buildSeedIndex(definition, entries);
    const indexText = stableJson(index);
    writeAtomic(paths.index, indexText);
    return {
      appended: false,
      entryDigest: current.entryDigest,
      indexDigest: campaignDigest(index),
      recordDigest,
      recordKey: current.recordKey,
      sequence: current.sequence,
    };
  }
  if (entries.length >= maxLedgerEntries) throw new WorkCampaignError(`campaign ledger exceeds ${maxLedgerEntries} entries`, 2, { field: "ledger" });
  const base = entryBase({
    previousEntryDigest: entries[entries.length - 1]?.entryDigest ?? null,
    record,
    recordDigest,
    recordKey: recordKey(record),
    schemaVersion: 1,
    sequence: entries.length + 1,
  });
  const entry: CampaignLedgerEntry = { ...base, entryDigest: campaignDigest(base) };
  const nextEntries = [...entries, entry];
  const index = buildSeedIndex(definition, nextEntries);
  const entryText = stableJson(entry);
  const indexText = stableJson(index);
  const entryFile = path.join(paths.entries, `${String(entry.sequence).padStart(8, "0")}-${entry.entryDigest}.json`);
  const reportFile = resolveContainedFile(root, definition.reportPath, true);
  requireEvidenceBudget(definition, retainedBytesAfter(paths.evidence, reportFile, new Map([
    [entryFile, entryText],
    [paths.index, indexText],
  ])));
  writeExclusiveDurable(entryFile, entryText);
  writeAtomic(paths.index, indexText);
  return {
    appended: true,
    entryDigest: entry.entryDigest,
    indexDigest: campaignDigest(index),
    recordDigest,
    recordKey: entry.recordKey,
    sequence: entry.sequence,
  };
}

export function materializeCampaignReport(root: string, definition: WorkCampaignDefinition): CampaignMaterializationResult {
  const paths = ledgerPaths(root, definition, true);
  const reportFile = resolveContainedFile(root, definition.reportPath, true);
  const entries = replayLedger(paths.entries);
  const materialized = buildMaterialization(definition, entries);
  const closureFile = path.join(paths.current, "closure.json");
  const replacements = new Map<string, string>([
    [paths.index, materialized.indexText],
    [closureFile, materialized.closureText],
    [reportFile, materialized.report],
    [paths.projection, materialized.projectionText],
  ]);
  requireEvidenceBudget(definition, retainedBytesAfter(paths.evidence, reportFile, replacements));
  writeAtomic(paths.index, materialized.indexText);
  writeAtomic(closureFile, materialized.closureText);
  writeAtomic(reportFile, materialized.report);
  writeAtomic(paths.projection, materialized.projectionText);
  return {
    ...materialized.projection,
    closure: materialized.closure,
    seedEntries: entries.length,
    status: "current",
  };
}

export function readCampaignReport(root: string, definition: WorkCampaignDefinition): CampaignMaterializationResult {
  const paths = ledgerPaths(root, definition, false);
  const reportFile = resolveContainedFile(root, definition.reportPath, false);
  const closureFile = path.join(paths.current, "closure.json");
  for (const file of [paths.index, closureFile, paths.projection, reportFile]) {
    if (!regularFile(file)) throw new WorkCampaignError(`${path.basename(file)} is unreadable`, 2, { field: path.basename(file) });
  }
  const entries = replayLedger(paths.entries);
  const expected = buildMaterialization(definition, entries);
  let projection: CampaignReportProjection;
  try {
    projection = projectionFromJson(JSON.parse(fs.readFileSync(paths.projection, "utf8")));
  } catch (error) {
    if (error instanceof WorkCampaignError) throw error;
    throw new WorkCampaignError("report projection is invalid JSON", 2, { cause: error, field: "report projection" });
  }
  const actual = {
    closure: fs.readFileSync(closureFile, "utf8"),
    index: fs.readFileSync(paths.index, "utf8"),
    projection,
    report: fs.readFileSync(reportFile, "utf8"),
  };
  if (actual.index !== expected.indexText) throw new WorkCampaignError("seed index differs from the current ledger", 2, { field: "seed-index.json" });
  if (actual.closure !== expected.closureText) throw new WorkCampaignError("closure projection differs from the current ledger", 2, { field: "closure.json" });
  if (actual.report !== expected.report) throw new WorkCampaignError("Markdown report differs from the current ledger", 2, { field: "reportPath" });
  if (stableJson(actual.projection) !== expected.projectionText) throw new WorkCampaignError("report projection differs from the current ledger", 2, { field: "report-projection.json" });
  return {
    ...expected.projection,
    closure: expected.closure,
    seedEntries: entries.length,
    status: "current",
  };
}
