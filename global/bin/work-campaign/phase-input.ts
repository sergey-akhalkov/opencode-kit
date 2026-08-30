import fs from "node:fs";
import path from "node:path";

import { stableJson } from "../roadmap-mission/contracts.ts";
import { WorkCampaignError, campaignDigest } from "./contracts.ts";
import type {
  CampaignInventoryBlock,
  CampaignInvestigationResult,
  CampaignClosureMatrix,
  CampaignPartitionResult,
  CampaignReconciliationResult,
  CampaignReportSeed,
  CampaignWaveManifest,
  CampaignWorkItem,
  WorkCampaignDefinition,
  WorkCampaignRecord,
  WorkCampaignResult,
} from "./contracts.ts";
import { loadCampaignSeedRecord } from "./materializer.ts";

type JsonRecord = Record<string, unknown>;
type CampaignSeedRecord = Exclude<WorkCampaignRecord, CampaignClosureMatrix | WorkCampaignResult>;

type FakeSemanticPhaseInput = {
  campaignId: string;
  candidateDigest: string;
  definitionDigest: string;
  evidenceRefs: string[];
  inputType: "fake-semantic-phase-input";
  inventoryDigest: string;
  modelCalls: number;
  recordPaths: string[];
  schemaVersion: 1;
  waveId: string | null;
};

export type ValidatedPhaseInput = {
  blocks: CampaignInventoryBlock[];
  discoveryRecords: CampaignSeedRecord[];
  evidenceBytes: number;
  evidenceRefs: string[];
  inventoryDigest: string;
  modelCalls: number;
  reportSeed: CampaignReportSeed;
  wave: CampaignWaveManifest | null;
};

const digestPattern = /^[a-f0-9]{64}$/u;
const referencePattern = /^[a-z][a-z0-9-]*:(?:[A-Za-z0-9][A-Za-z0-9._/#-]*|\.[A-Za-z0-9][A-Za-z0-9._/#-]*)$/u;

function object(value: unknown, field: string): JsonRecord {
  if (value == null || typeof value !== "object" || Array.isArray(value)) {
    throw new WorkCampaignError(`${field} must be a JSON object`, 2, { field });
  }
  return value as JsonRecord;
}

function exactKeys(input: JsonRecord, expected: readonly string[], field: string): void {
  const missing = expected.filter((key) => !(key in input));
  const extras = Object.keys(input).filter((key) => !expected.includes(key)).sort();
  if (missing.length === 0 && extras.length === 0) return;
  const detail = [
    missing.length > 0 ? `missing=${missing.join(",")}` : null,
    extras.length > 0 ? `unsupported=${extras.join(",")}` : null,
  ].filter((value): value is string => value != null).join(" ");
  throw new WorkCampaignError(`${field} has invalid fields: ${detail}`, 2, { field });
}

function string(value: unknown, field: string, max = 500): string {
  if (typeof value !== "string" || value.trim() === "" || value.length > max || /[\r\n\0]/u.test(value)) {
    throw new WorkCampaignError(`${field} must be a non-empty single-line string of at most ${max} characters`, 2, { field });
  }
  return value.trim();
}

function nonnegativeInteger(value: unknown, field: string): number {
  if (!Number.isSafeInteger(value) || Number(value) < 0) {
    throw new WorkCampaignError(`${field} must be a non-negative safe integer`, 2, { field });
  }
  return Number(value);
}

function safeRelative(value: unknown, field: string): string {
  const parsed = string(value, field);
  if (parsed.includes("\\") || path.posix.isAbsolute(parsed) || path.win32.isAbsolute(parsed)
    || parsed.split("/").some((part) => part === "" || part === "." || part === "..")) {
    throw new WorkCampaignError(`${field} must be a contained forward-slash project-relative path`, 2, { field });
  }
  return parsed;
}

function strings(value: unknown, field: string, options: { refs?: boolean; paths?: boolean } = {}): string[] {
  if (!Array.isArray(value) || value.length === 0 || value.length > 1_000) {
    throw new WorkCampaignError(`${field} must contain between 1 and 1000 items`, 2, { field });
  }
  const parsed = value.map((item, index) => {
    const result = options.paths ? safeRelative(item, `${field}[${index}]`) : string(item, `${field}[${index}]`);
    if (options.refs && !referencePattern.test(result)) {
      throw new WorkCampaignError(`${field}[${index}] must be a typed reference`, 2, { field });
    }
    return result;
  });
  if (new Set(parsed).size !== parsed.length) throw new WorkCampaignError(`${field} must not contain duplicates`, 2, { field });
  return parsed;
}

function containedFile(root: string, relative: string, field: string): string {
  const candidate = path.resolve(root, safeRelative(relative, field));
  const lexical = path.relative(path.resolve(root), candidate);
  if (lexical.startsWith("..") || path.isAbsolute(lexical)) throw new WorkCampaignError(`${field} escapes the project root`, 2, { field });
  let canonical: string;
  try {
    canonical = fs.realpathSync(candidate);
  } catch (error) {
    throw new WorkCampaignError(`${field} is unreadable`, 2, { cause: error, field });
  }
  const actual = path.relative(fs.realpathSync(root), canonical);
  const stat = fs.lstatSync(canonical);
  if (actual.startsWith("..") || path.isAbsolute(actual) || !stat.isFile() || stat.isSymbolicLink()) {
    throw new WorkCampaignError(`${field} must be a contained regular non-symlink file`, 2, { field });
  }
  return canonical;
}

function parsePhaseInput(root: string, relative: string, definition: WorkCampaignDefinition, definitionDigest: string): FakeSemanticPhaseInput {
  const file = containedFile(root, relative, "phaseInputPath");
  let input: JsonRecord;
  try {
    input = object(JSON.parse(fs.readFileSync(file, "utf8")), "fake semantic phase input");
  } catch (error) {
    if (error instanceof WorkCampaignError) throw error;
    throw new WorkCampaignError("phaseInputPath must contain valid UTF-8 JSON", 2, { cause: error, field: "phaseInputPath" });
  }
  exactKeys(input, ["campaignId", "candidateDigest", "definitionDigest", "evidenceRefs", "inputType", "inventoryDigest", "modelCalls", "recordPaths", "schemaVersion", "waveId"], "fake semantic phase input");
  if (input.schemaVersion !== 1 || input.inputType !== "fake-semantic-phase-input") {
    throw new WorkCampaignError("fake semantic phase input identity is unsupported", 2, { field: "phaseInputPath" });
  }
  const campaignId = string(input.campaignId, "campaignId", 100);
  const parsedDefinitionDigest = string(input.definitionDigest, "definitionDigest", 64);
  const candidateDigest = string(input.candidateDigest, "candidateDigest", 64);
  const inventoryDigest = string(input.inventoryDigest, "inventoryDigest", 64);
  if (!digestPattern.test(parsedDefinitionDigest) || !digestPattern.test(candidateDigest) || !digestPattern.test(inventoryDigest)) {
    throw new WorkCampaignError("phase input digests must be lowercase SHA-256 values", 2, { field: "phaseInputPath" });
  }
  if (campaignId !== definition.campaignId || parsedDefinitionDigest !== definitionDigest) {
    throw new WorkCampaignError("phase input campaign or definition identity differs", 2, { field: "phaseInputPath" });
  }
  const recordPaths = strings(input.recordPaths, "recordPaths", { paths: true });
  if (stableJson(recordPaths) !== stableJson(recordPaths.slice().sort())) {
    throw new WorkCampaignError("recordPaths must use stable lexical order", 2, { field: "recordPaths" });
  }
  return {
    campaignId,
    candidateDigest,
    definitionDigest: parsedDefinitionDigest,
    evidenceRefs: strings(input.evidenceRefs, "evidenceRefs", { refs: true }).sort(),
    inputType: "fake-semantic-phase-input",
    inventoryDigest,
    modelCalls: nonnegativeInteger(input.modelCalls, "modelCalls"),
    recordPaths,
    schemaVersion: 1,
    waveId: input.waveId == null ? null : string(input.waveId, "waveId", 100),
  };
}

function recordKey(record: CampaignSeedRecord): string {
  return record.recordType === "report-seed" ? "report-seed" : `${record.recordType}:${record.id}`;
}

function recordEvidenceRefs(record: CampaignSeedRecord): string[] {
  if ("evidenceRefs" in record && Array.isArray(record.evidenceRefs)) return record.evidenceRefs;
  if (record.recordType === "report-seed") {
    return [...record.blockers, ...record.limitations, ...record.matrixRows, ...record.validationRows, ...record.waveRows]
      .flatMap((row) => row.evidenceRefs);
  }
  return [];
}

function validateItemReconciliation(
  item: CampaignWorkItem,
  reconciliation: CampaignReconciliationResult,
  investigation: CampaignInvestigationResult | undefined,
  definition: WorkCampaignDefinition,
): void {
  if (item.producerSessionRef === reconciliation.producerSessionRef) {
    throw new WorkCampaignError(`work item ${item.id} producer cannot reconcile its own candidate`, 2, { field: "recordPaths" });
  }
  if (reconciliation.disposition !== "unknown") {
    if (investigation != null) throw new WorkCampaignError(`work item ${item.id} has an unnecessary investigation`, 2, { field: "recordPaths" });
    const materialConfirmed = reconciliation.disposition === "confirmed"
      && (reconciliation.severity === "P0" || reconciliation.severity === "P1");
    const authorized = item.effectClasses.every((effect) => definition.allowedEffects.includes(effect));
    const expected = item.status === "confirmed"
      ? materialConfirmed && authorized
      : item.status === "owner-required" || item.status === "waiting"
        ? materialConfirmed && !authorized
      : item.status === "report-only"
        ? reconciliation.disposition === "confirmed" && (reconciliation.severity === "P2" || reconciliation.severity === "P3")
        : item.status === "falsified"
          ? reconciliation.disposition === "falsified"
          : item.status === "duplicate"
            ? reconciliation.disposition === "duplicate"
            : false;
    if (!expected) throw new WorkCampaignError(`work item ${item.id} has no matching terminal reconciliation`, 2, { field: "recordPaths" });
    return;
  }
  if (investigation == null || investigation.workItemId !== item.id
    || stableJson(investigation.sourceBlockIds) !== stableJson(item.sourceBlockIds)
    || investigation.producerSessionRef === item.producerSessionRef
    || investigation.producerSessionRef === reconciliation.producerSessionRef) {
    throw new WorkCampaignError(`work item ${item.id} requires one fresh source-correlated investigation`, 2, { field: "recordPaths" });
  }
  const expected = investigation.result === "confirmed"
    ? item.status === "confirmed" && (reconciliation.severity === "P0" || reconciliation.severity === "P1")
    : investigation.result === "falsified"
      ? item.status === "falsified"
      : investigation.result === "product-decision-required"
        ? item.status === "product-decision-required"
        : investigation.result === "waiting"
          ? item.status === "waiting"
      : investigation.result === "owner-required"
        ? item.status === "owner-required" || item.status === "waiting"
        : item.status === "unknown-material";
  if (!expected) throw new WorkCampaignError(`work item ${item.id} differs from its investigation result`, 2, { field: "recordPaths" });
  if (investigation.result === "still-unknown") {
    throw new WorkCampaignError(`work item ${item.id} remains still-unknown and blocks findings freeze`, 1, { field: "recordPaths" });
  }
}

function overlaps(left: string, right: string): boolean {
  return left === right || left.startsWith(`${right}/`) || right.startsWith(`${left}/`);
}

function pathInsideScope(relative: string, definition: WorkCampaignDefinition): boolean {
  return definition.scopeRoots.some((scope) => relative === scope || relative.startsWith(`${scope}/`))
    && !definition.exclusions.some((excluded) => overlaps(relative, excluded));
}

function validatePhaseRecords(
  root: string,
  inputPath: string,
  input: FakeSemanticPhaseInput,
  definition: WorkCampaignDefinition,
): ValidatedPhaseInput {
  const records = input.recordPaths.map((relative) => loadCampaignSeedRecord(root, relative, definition.budgets.evidenceBytes));
  const keys = records.map(recordKey);
  if (new Set(keys).size !== keys.length) throw new WorkCampaignError("phase input contains duplicate seed owners", 2, { field: "recordPaths" });
  const blocks = records.filter((record): record is CampaignInventoryBlock => record.recordType === "inventory-block").sort((left, right) => left.id.localeCompare(right.id));
  const partitions = records.filter((record): record is CampaignPartitionResult => record.recordType === "partition-result").sort((left, right) => left.id.localeCompare(right.id));
  const items = records.filter((record): record is CampaignWorkItem => record.recordType === "work-item").sort((left, right) => left.id.localeCompare(right.id));
  const reconciliations = records.filter((record): record is CampaignReconciliationResult => record.recordType === "reconciliation-result").sort((left, right) => left.id.localeCompare(right.id));
  const investigations = records.filter((record): record is CampaignInvestigationResult => record.recordType === "investigation-result").sort((left, right) => left.id.localeCompare(right.id));
  const waves = records.filter((record): record is CampaignWaveManifest => record.recordType === "wave-manifest");
  const reportSeeds = records.filter((record): record is CampaignReportSeed => record.recordType === "report-seed");
  if (blocks.length === 0 || partitions.length === 0 || waves.length > 1 || reportSeeds.length !== 1) {
    throw new WorkCampaignError("phase input requires inventory, partition results, at most one wave, and one report seed", 2, { field: "recordPaths" });
  }
  if (blocks.some((block) => !["excluded", "reviewed-no-finding", "reviewed-with-finding"].includes(block.reviewStatus))) {
    throw new WorkCampaignError("findings freeze requires every inventory block to have a current terminal review status", 1, { field: "recordPaths" });
  }
  const inventoryDigest = campaignDigest(blocks);
  if (inventoryDigest !== input.inventoryDigest) throw new WorkCampaignError("phase input inventory digest differs", 2, { field: "inventoryDigest" });
  const includedBlockIds = blocks.filter((block) => block.reviewStatus !== "excluded").map((block) => block.id).sort();
  const partitionBlockIds = partitions.flatMap((partition) => partition.blockIds).sort();
  if (stableJson(includedBlockIds) !== stableJson(partitionBlockIds) || partitions.some((partition) => partition.status !== "complete" || partition.inventoryDigest !== inventoryDigest || partition.candidateDigest !== input.candidateDigest)) {
    throw new WorkCampaignError("complete partition results must cover every included block exactly once", 2, { field: "recordPaths" });
  }
  const blockById = new Map(blocks.map((block) => [block.id, block]));
  const itemById = new Map(items.map((item) => [item.id, item]));
  const reconciliationByItem = new Map<string, CampaignReconciliationResult>();
  for (const reconciliation of reconciliations) {
    if (reconciliationByItem.has(reconciliation.workItemId)) throw new WorkCampaignError(`work item ${reconciliation.workItemId} has multiple reconciliations`, 2, { field: "recordPaths" });
    reconciliationByItem.set(reconciliation.workItemId, reconciliation);
  }
  const investigationByItem = new Map<string, CampaignInvestigationResult>();
  for (const investigation of investigations) {
    if (investigationByItem.has(investigation.workItemId)) throw new WorkCampaignError(`work item ${investigation.workItemId} has multiple investigations`, 2, { field: "recordPaths" });
    investigationByItem.set(investigation.workItemId, investigation);
  }
  const partitionByItem = new Map(partitions.flatMap((partition) => partition.workItemIds.map((itemId) => [itemId, partition] as const)));
  if (new Set(partitions.map((partition) => partition.producerSessionRef)).size !== partitions.length) {
    throw new WorkCampaignError("discovery partitions require fresh producer sessions", 2, { field: "recordPaths" });
  }
  for (const item of items) {
    if (item.candidateDigest !== input.candidateDigest || item.sourceBlockIds.some((id) => !blockById.has(id))) {
      throw new WorkCampaignError(`work item ${item.id} differs from the current candidate or inventory`, 2, { field: "recordPaths" });
    }
    const reconciliation = reconciliationByItem.get(item.id);
    if (reconciliation == null || reconciliation.candidateDigest !== input.candidateDigest
      || !item.sourceBlockIds.some((id) => blockById.get(id)?.digest === reconciliation.sourceDigest)) {
      throw new WorkCampaignError(`work item ${item.id} has no current source-correlated reconciliation`, 2, { field: "recordPaths" });
    }
    if (partitionByItem.get(item.id)?.producerSessionRef !== item.producerSessionRef) {
      throw new WorkCampaignError(`work item ${item.id} differs from its discovery producer`, 2, { field: "recordPaths" });
    }
    validateItemReconciliation(item, reconciliation, investigationByItem.get(item.id), definition);
  }
  if (reconciliationByItem.size !== items.length) throw new WorkCampaignError("reconciliation results must match work items exactly", 2, { field: "recordPaths" });
  if (investigations.some((investigation) => reconciliationByItem.get(investigation.workItemId)?.disposition !== "unknown")) {
    throw new WorkCampaignError("investigations must match unknown reconciliation results exactly", 2, { field: "recordPaths" });
  }
  const partitionItemIds = partitions.flatMap((partition) => partition.workItemIds).sort();
  if (stableJson(partitionItemIds) !== stableJson(items.map((item) => item.id).sort())) {
    throw new WorkCampaignError("partition work-item refs must match current work items exactly", 2, { field: "recordPaths" });
  }
  const eligible = items.filter((item) => item.status === "confirmed").map((item) => item.id).sort();
  const wave = waves[0] ?? null;
  if (eligible.length === 0) {
    if (wave != null || input.waveId != null) {
      throw new WorkCampaignError("report-only or waiting input must not invent a mutation wave", 2, { field: "recordPaths" });
    }
  } else {
    if (wave == null || input.waveId == null || wave.id !== input.waveId
      || wave.campaignId !== definition.campaignId || wave.definitionDigest !== input.definitionDigest
      || wave.candidateDigest !== input.candidateDigest || stableJson(wave.workItemIds) !== stableJson(eligible)) {
      throw new WorkCampaignError("frozen wave must assign every current authorized confirmed P0/P1 item exactly once", 2, { field: "recordPaths" });
    }
    const sliceItems = wave.slices.flatMap((slice) => slice.workItemIds).sort();
    if (stableJson(sliceItems) !== stableJson(eligible)) throw new WorkCampaignError("wave slices must assign eligible items exactly once", 2, { field: "recordPaths" });
    for (const slice of wave.slices) {
      if (slice.effectClasses.some((effect) => !definition.allowedEffects.includes(effect))
        || slice.ownedPaths.some((owned) => !pathInsideScope(owned, definition))) {
        throw new WorkCampaignError(`wave slice ${slice.id} exceeds campaign path or effect authority`, 2, { field: "recordPaths" });
      }
      for (const itemId of slice.workItemIds) {
        const item = itemById.get(itemId);
        if (item == null || item.status !== "confirmed") throw new WorkCampaignError(`wave slice ${slice.id} references an ineligible work item`, 2, { field: "recordPaths" });
      }
    }
  }
  const reportSeed = reportSeeds[0];
  const ownerRequired = items.some((item) => item.status === "owner-required");
  const productDecisionRequired = items.some((item) => item.status === "product-decision-required");
  const waiting = items.some((item) => item.status === "waiting") || ownerRequired;
  const expectedTerminal = productDecisionRequired ? "product-decision-required" : waiting ? "waiting" : "unknown";
  const terminalMatches = reportSeed.terminalState === expectedTerminal
    || ownerRequired && reportSeed.terminalState === "owner-required";
  const invalidReport = reportSeed.candidateDigest !== input.candidateDigest
    || reportSeed.definitionDigest !== input.definitionDigest
    || !terminalMatches
    || productDecisionRequired && !reportSeed.blockers.some((row) => row.status === "product-decision-required")
    || waiting && !reportSeed.blockers.some((row) => row.status === "owner-required" || row.status === "waiting")
    || !productDecisionRequired && reportSeed.blockers.some((row) => row.status === "product-decision-required")
    || !waiting && reportSeed.blockers.some((row) => row.status === "owner-required" || row.status === "waiting");
  if (wave == null) {
    if (invalidReport || reportSeed.waveRows.length !== 0) {
      throw new WorkCampaignError("no-wave report seed must preserve report-only or waiting state for verification", 2, { field: "recordPaths" });
    }
  } else {
    const waveRows = reportSeed.waveRows.filter((row) => row.waveId === wave.id);
    if (invalidReport || waveRows.length !== 1 || reportSeed.waveRows.length !== 1 || waveRows[0].status === "complete"
      || waveRows[0].archiveRefs.length !== 0 || waveRows[0].checkpointRef != null) {
      throw new WorkCampaignError("report seed must represent the current unexecuted frozen wave", 2, { field: "recordPaths" });
    }
  }
  const orderedTypes: CampaignSeedRecord["recordType"][] = [
    "inventory-block", "partition-result", "work-item", "reconciliation-result", "investigation-result", "wave-manifest", "report-seed",
  ];
  const ordered = records.slice().sort((left, right) => {
    const rank = orderedTypes.indexOf(left.recordType) - orderedTypes.indexOf(right.recordType);
    return rank !== 0 ? rank : recordKey(left).localeCompare(recordKey(right));
  });
  const inputBytes = fs.statSync(containedFile(root, inputPath, "phaseInputPath")).size
    + input.recordPaths.reduce((total, relative) => total + fs.statSync(containedFile(root, relative, "recordPaths")).size, 0);
  if (inputBytes > definition.budgets.evidenceBytes) throw new WorkCampaignError("phase input exceeds the campaign evidence budget", 1, { field: "recordPaths" });
  if (input.modelCalls > definition.budgets.modelCalls) throw new WorkCampaignError("phase input exceeds the campaign model-call budget", 1, { field: "modelCalls" });
  return {
    blocks,
    discoveryRecords: ordered.filter((record) => record.recordType !== "inventory-block" && record.recordType !== "wave-manifest" && record.recordType !== "report-seed"),
    evidenceBytes: inputBytes,
    evidenceRefs: [...new Set([
      ...input.evidenceRefs,
      `file:${inputPath}`,
      ...input.recordPaths.map((relative) => `file:${relative}`),
      ...records.flatMap(recordEvidenceRefs),
    ])].sort(),
    inventoryDigest,
    modelCalls: input.modelCalls,
    reportSeed,
    wave,
  };
}

export function loadValidatedPhaseInput(
  root: string,
  inputPath: string,
  definition: WorkCampaignDefinition,
  definitionDigest: string,
  candidateDigest: string,
): ValidatedPhaseInput {
  const input = parsePhaseInput(root, inputPath, definition, definitionDigest);
  if (input.candidateDigest !== candidateDigest) {
    throw new WorkCampaignError("phase input candidate digest differs from the current tracked source", 2, { field: "candidateDigest" });
  }
  return validatePhaseRecords(root, inputPath, input, definition);
}
