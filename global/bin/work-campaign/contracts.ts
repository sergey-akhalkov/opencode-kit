import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import {
  PROTECTED_EFFECTS,
  safeId as missionSafeId,
  stableJson,
} from "../roadmap-mission/contracts.ts";
import type { CheckpointMode, EffectClass } from "../roadmap-mission/contracts.ts";

type JsonRecord = Record<string, unknown>;

export type CampaignSeverity = "P0" | "P1" | "P2" | "P3" | "unknown";
export type CampaignCheckpoint = {
  localCommitAuthorized: boolean;
  mode: CheckpointMode;
  workspace: "disposable" | "persistent";
};

export type WorkCampaignDefinition = {
  adapterPath: string;
  allowedEffects: EffectClass[];
  authorizationRefs: Partial<Record<EffectClass, string>>;
  budgets: {
    evidenceBytes: number;
    modelCalls: number;
    processAttempts: number;
    wallClockSeconds: number;
    waves: number;
  };
  campaignId: string;
  checkpoint: CampaignCheckpoint;
  evidencePath: string;
  exclusions: string[];
  hostResume: {
    enabled: boolean;
    supervisorRequired: boolean;
  };
  outcome: string;
  playbook: "audit-remediate";
  protectedDecisionPolicy: "owner-required";
  reportPath: string;
  schemaVersion: 1;
  scopeRoots: string[];
  statePath: string;
  stopPolicy: {
    onBudgetExhausted: true;
    onExplicitStop: true;
    onOwnerRequired: true;
    onProtected: true;
    onUnknown: true;
  };
  validationArgv: string[];
};

export type WorkCampaignAdapter = {
  adapterId: string;
  inventoryArgv: string[];
  realBoundaryProofArgv: string[];
  schemaVersion: 1;
};

export type CampaignInventoryBlock = {
  classification: "evidence" | "excluded" | "generated" | "maintained" | "vendor";
  digest: string;
  exclusionReason: string | null;
  id: string;
  kind: "file" | "logical-block";
  path: string;
  recordType: "inventory-block";
  reviewStatus: "blocked" | "excluded" | "needs-direct-review" | "needs-rereview" | "pending" | "reviewed-no-finding" | "reviewed-with-finding";
  schemaVersion: 1;
};

export type CampaignPartitionResult = {
  assignmentId: string;
  blockIds: string[];
  candidateDigest: string;
  evidenceRefs: string[];
  id: string;
  inventoryDigest: string;
  producerSessionRef: string;
  recordType: "partition-result";
  schemaVersion: 1;
  status: "blocked" | "complete" | "unknown";
  workItemIds: string[];
};

export type CampaignWorkItem = {
  affectedPaths: string[];
  candidateDigest: string;
  confidence: "high" | "low" | "medium" | "unknown";
  effectClasses: EffectClass[];
  evidenceRefs: string[];
  id: string;
  impact: string;
  initialSeverity: CampaignSeverity;
  likelyCause: string;
  ownedPaths: string[];
  principleRef: string;
  producerSessionRef: string;
  proposedOutcome: string;
  recordType: "work-item";
  scenario: string;
  schemaVersion: 1;
  sourceBlockIds: string[];
  status: "candidate" | "confirmed" | "duplicate" | "falsified" | "fixed-and-verified" | "owner-required" | "report-only" | "unknown-material";
};

export type CampaignReconciliationResult = {
  candidateDigest: string;
  disposition: "confirmed" | "duplicate" | "falsified" | "unknown";
  evidenceRefs: string[];
  id: string;
  producerSessionRef: string;
  recordType: "reconciliation-result";
  schemaVersion: 1;
  severity: CampaignSeverity;
  sourceDigest: string;
  workItemId: string;
};

export type CampaignInvestigationResult = {
  allowedObservations: string[];
  budgets: {
    modelCalls: number;
    wallClockSeconds: number;
  };
  evidenceRefs: string[];
  id: string;
  producerSessionRef: string;
  question: string;
  recordType: "investigation-result";
  result: "confirmed" | "falsified" | "owner-required" | "still-unknown";
  schemaVersion: 1;
  sourceBlockIds: string[];
  workItemId: string;
};

export type CampaignWaveSlice = {
  changeId: string;
  dependsOn: string[];
  effectClasses: EffectClass[];
  expectedProof: string;
  id: string;
  outcome: string;
  ownedPaths: string[];
  validationArgv: string[];
  workItemIds: string[];
};

export type CampaignWaveManifest = {
  campaignId: string;
  candidateDigest: string;
  definitionDigest: string;
  id: string;
  missionDefinitionDigest: string;
  recordType: "wave-manifest";
  schemaVersion: 1;
  slices: CampaignWaveSlice[];
  status: "frozen";
  workItemIds: string[];
};

export type CampaignClosureMatrix = {
  candidateDigest: string;
  challengeStatus: "blocked" | "complete" | "unknown";
  definitionDigest: string;
  inventory: {
    blocked: number;
    currentTerminal: number;
    needsRereview: number;
    total: number;
  };
  ownershipStatus: "blocked" | "terminal" | "unknown";
  proofStatus: "blocked" | "complete" | "unknown";
  recordType: "closure-matrix";
  reportDigest: string;
  schemaVersion: 1;
  terminalState: "blocked" | "complete" | "owner-required" | "unknown";
  validationStatus: "blocked" | "complete" | "unknown";
  waves: {
    archived: number;
    checkpointed: number;
    total: number;
  };
  workItems: {
    fixedAndVerified: number;
    ownerRequired: number;
    reportOnly: number;
    resolved: number;
    total: number;
    unknownMaterial: number;
    unresolvedP0P1: number;
  };
};

export type CampaignReportFact = {
  evidenceRefs: string[];
  id: string;
  summary: string;
};

export type CampaignReportSeed = {
  blockers: Array<CampaignReportFact & {
    status: "blocked" | "owner-required" | "unknown";
  }>;
  candidateDigest: string;
  challengeStatus: "blocked" | "complete" | "unknown";
  definitionDigest: string;
  limitations: CampaignReportFact[];
  matrixRows: Array<CampaignReportFact & {
    blockIds: string[];
    kind: "failure-mode" | "redundancy" | "test-gap";
    status: "open" | "report-only" | "resolved" | "unknown";
    workItemIds: string[];
  }>;
  maximumClaim: string;
  ownershipStatus: "blocked" | "terminal" | "unknown";
  proofStatus: "blocked" | "complete" | "unknown";
  recordType: "report-seed";
  schemaVersion: 1;
  terminalState: "blocked" | "complete" | "owner-required" | "unknown";
  validationRows: Array<CampaignReportFact & {
    argv: string[];
    kind: "proof" | "validation";
    status: "blocked" | "complete" | "unknown";
  }>;
  validationStatus: "blocked" | "complete" | "unknown";
  waveRows: Array<CampaignReportFact & {
    archiveRefs: string[];
    checkpointRef: string | null;
    status: "blocked" | "complete" | "unknown";
    waveId: string;
  }>;
};

export type CampaignTerminalHandoff = {
  candidateDigest: string;
  closure: CampaignClosureMatrix;
  definitionDigest: string;
  evidenceRefs: string[];
  maximumClaim: string;
  reportDigest: string;
  reportPath: string;
  schemaVersion: 1;
  terminalState: "complete";
};

export type CampaignSupervisionAdvice = {
  action: "resume" | "suppress" | "unknown";
  reason: "active-operation" | "budget" | "complete" | "definition-or-project-drift" | "explicit-stop" | "external-input-required" | "not-started" | "owner-protected" | "runtime-interruption-ready" | "terminal-evidence-restored" | "writer-or-cleanup-unknown";
};

export type WorkCampaignResult = {
  campaignId: string;
  cleanup: "complete" | "not-required" | "unknown";
  definitionDigest: string;
  disposition: "blocked" | "complete" | "owner-required" | "paused-budget" | "paused-external" | "paused-stop" | "paused-unknown";
  errorClass: "budget" | "immutable-input" | "locally-correctable" | "none" | "owner-protected" | "transient" | "unknown";
  errorMessage: string | null;
  evidenceRefs: string[];
  operation: "preflight" | "replay" | "resume" | "run" | "status" | "stop" | "verify";
  phase: "complete" | "discover" | "inventory" | "mission" | "paused" | "synthesize" | "verify";
  recordType: "campaign-result";
  schemaVersion: 1;
  supervision: CampaignSupervisionAdvice | null;
  terminalHandoff: CampaignTerminalHandoff | null;
  tool: "work-campaign";
  writerClosure: "isolated" | "terminal" | "unknown";
};

export type WorkCampaignRecord =
  | CampaignClosureMatrix
  | CampaignInventoryBlock
  | CampaignInvestigationResult
  | CampaignPartitionResult
  | CampaignReconciliationResult
  | CampaignReportSeed
  | CampaignWaveManifest
  | CampaignWorkItem
  | WorkCampaignResult;

export class WorkCampaignError extends Error {
  readonly cause: unknown;
  readonly exitCode: number;
  readonly field: string | null;

  constructor(message: string, exitCode = 2, options?: { cause?: unknown; field?: string }) {
    super(message);
    this.name = "WorkCampaignError";
    this.cause = options?.cause;
    this.exitCode = exitCode;
    this.field = options?.field ?? null;
  }
}

const effectClasses = new Set<EffectClass>([...PROTECTED_EFFECTS, "local-read", "local-write"]);
const digestPattern = /^[a-f0-9]{64}$/u;
const referencePattern = /^[a-z][a-z0-9-]*:(?:[A-Za-z0-9][A-Za-z0-9._/#-]*|\.[A-Za-z0-9][A-Za-z0-9._/#-]*)$/u;

function record(value: unknown, field: string): JsonRecord {
  if (value == null || typeof value !== "object" || Array.isArray(value)) {
    throw new WorkCampaignError(`${field} must be a JSON object`, 2, { field });
  }
  return value as JsonRecord;
}

function exactKeys(input: JsonRecord, expected: readonly string[], field: string): void {
  const extras = Object.keys(input).filter((key) => !expected.includes(key)).sort();
  const missing = expected.filter((key) => !(key in input));
  if (missing.length === 0 && extras.length === 0) return;
  const details = [
    missing.length === 0 ? null : `missing=${missing.join(",")}`,
    extras.length === 0 ? null : `unsupported=${extras.join(",")}`,
  ].filter((value): value is string => value != null).join(" ");
  throw new WorkCampaignError(`${field} has invalid fields: ${details}`, 2, { field });
}

function requiredString(value: unknown, field: string, max = 500): string {
  if (typeof value !== "string" || value.trim() === "" || value.length > max) {
    throw new WorkCampaignError(`${field} must be a non-empty string of at most ${max} characters`, 2, { field });
  }
  return value.trim();
}

function singleLine(value: unknown, field: string, max = 500): string {
  const parsed = requiredString(value, field, max);
  if (/[\r\n\0]/u.test(parsed)) throw new WorkCampaignError(`${field} must be a single-line string`, 2, { field });
  return parsed;
}

function safeId(value: unknown, field: string): string {
  try {
    return missionSafeId(value, field);
  } catch (error) {
    throw new WorkCampaignError(error instanceof Error ? error.message : `${field} must be a safe identifier`, 2, { cause: error, field });
  }
}

function safeRelative(value: unknown, field: string): string {
  const parsed = singleLine(value, field, 500);
  if (parsed.includes("\\") || path.posix.isAbsolute(parsed) || path.win32.isAbsolute(parsed)) {
    throw new WorkCampaignError(`${field} must be a forward-slash project-relative path`, 2, { field });
  }
  if (parsed.split("/").some((segment) => segment === "" || segment === "." || segment === "..")) {
    throw new WorkCampaignError(`${field} must not contain empty, current, or parent segments`, 2, { field });
  }
  return parsed;
}

function pathsOverlap(left: string, right: string): boolean {
  return left === right || left.startsWith(`${right}/`) || right.startsWith(`${left}/`);
}

function digest(value: unknown, field: string): string {
  const parsed = singleLine(value, field, 64);
  if (!digestPattern.test(parsed)) throw new WorkCampaignError(`${field} must be a lowercase SHA-256 digest`, 2, { field });
  return parsed;
}

function reference(value: unknown, field: string): string {
  const parsed = singleLine(value, field, 500);
  if (!referencePattern.test(parsed)) throw new WorkCampaignError(`${field} must be a typed reference`, 2, { field });
  return parsed;
}

function strings(value: unknown, field: string, options: { allowEmpty?: boolean; maxItems?: number; refs?: boolean; paths?: boolean; ids?: boolean } = {}): string[] {
  const maxItems = options.maxItems ?? 1_000;
  if (!Array.isArray(value) || value.length > maxItems || (!options.allowEmpty && value.length === 0)) {
    throw new WorkCampaignError(`${field} must contain ${options.allowEmpty ? "at most" : "between 1 and"} ${maxItems} items`, 2, { field });
  }
  const result = value.map((item, index) => {
    if (options.refs) return reference(item, `${field}[${index}]`);
    if (options.paths) return safeRelative(item, `${field}[${index}]`);
    if (options.ids) return safeId(item, `${field}[${index}]`);
    return singleLine(item, `${field}[${index}]`);
  });
  if (new Set(result).size !== result.length) throw new WorkCampaignError(`${field} must not contain duplicates`, 2, { field });
  return result.sort();
}

function argv(value: unknown, field: string): string[] {
  if (!Array.isArray(value) || value.length === 0 || value.length > 100) {
    throw new WorkCampaignError(`${field} must contain between 1 and 100 argv items`, 2, { field });
  }
  return value.map((item, index) => singleLine(item, `${field}[${index}]`, 1_000));
}

function integer(value: unknown, field: string, min = 0, max = Number.MAX_SAFE_INTEGER): number {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < min || value > max) {
    throw new WorkCampaignError(`${field} must be an integer from ${min} through ${max}`, 2, { field });
  }
  return value;
}

function enumValue<T extends string>(value: unknown, field: string, values: readonly T[]): T {
  const parsed = singleLine(value, field) as T;
  if (!values.includes(parsed)) throw new WorkCampaignError(`${field} is unsupported`, 2, { field });
  return parsed;
}

function effects(value: unknown, field: string, allowEmpty = false): EffectClass[] {
  const parsed = strings(value, field, { allowEmpty, maxItems: effectClasses.size });
  for (const effect of parsed) {
    if (!effectClasses.has(effect as EffectClass)) {
      throw new WorkCampaignError(`${field} contains unsupported effect class ${effect}`, 2, { field });
    }
  }
  return parsed as EffectClass[];
}

function authorizationRefs(value: unknown, allowed: EffectClass[]): Partial<Record<EffectClass, string>> {
  const input = record(value, "authorizationRefs");
  const result: Partial<Record<EffectClass, string>> = {};
  for (const key of Object.keys(input).sort()) {
    if (!effectClasses.has(key as EffectClass)) throw new WorkCampaignError(`authorizationRefs contains unsupported effect class ${key}`, 2, { field: "authorizationRefs" });
    if (!allowed.includes(key as EffectClass)) throw new WorkCampaignError(`authorizationRefs.${key} is outside allowedEffects`, 2, { field: `authorizationRefs.${key}` });
    result[key as EffectClass] = reference(input[key], `authorizationRefs.${key}`);
  }
  for (const effect of allowed) {
    if (PROTECTED_EFFECTS.has(effect) && result[effect] == null) {
      throw new WorkCampaignError(`protected effect ${effect} requires authorizationRefs.${effect}`, 2, { field: `authorizationRefs.${effect}` });
    }
  }
  return result;
}

function checkpoint(value: unknown): CampaignCheckpoint {
  const input = record(value, "checkpoint");
  exactKeys(input, ["localCommitAuthorized", "mode", "workspace"], "checkpoint");
  const mode = enumValue(input.mode, "checkpoint.mode", ["evidence-only", "external", "local-commit"] as const);
  const workspace = enumValue(input.workspace, "checkpoint.workspace", ["disposable", "persistent"] as const);
  if (typeof input.localCommitAuthorized !== "boolean") {
    throw new WorkCampaignError("checkpoint.localCommitAuthorized must be boolean", 2, { field: "checkpoint.localCommitAuthorized" });
  }
  if ((mode === "local-commit") !== input.localCommitAuthorized) {
    throw new WorkCampaignError("checkpoint.localCommitAuthorized must be true exactly for local-commit mode", 2, { field: "checkpoint.localCommitAuthorized" });
  }
  return { localCommitAuthorized: input.localCommitAuthorized, mode, workspace };
}

function nullableString(value: unknown, field: string, max = 2_000): string | null {
  return value == null ? null : requiredString(value, field, max);
}

function requireSchemaAndType(input: JsonRecord, recordType: string, fields: readonly string[]): void {
  exactKeys(input, ["schemaVersion", "recordType", ...fields], recordType);
  if (input.schemaVersion !== 1) throw new WorkCampaignError(`${recordType}.schemaVersion must be 1`, 2, { field: "schemaVersion" });
  if (input.recordType !== recordType) throw new WorkCampaignError(`recordType must be ${recordType}`, 2, { field: "recordType" });
}

export function campaignDigest(value: unknown): string {
  return crypto.createHash("sha256").update(stableJson(value)).digest("hex");
}

export function parseWorkCampaignDefinition(value: unknown): WorkCampaignDefinition {
  const input = record(value, "campaign definition");
  exactKeys(input, [
    "adapterPath",
    "allowedEffects",
    "authorizationRefs",
    "budgets",
    "campaignId",
    "checkpoint",
    "evidencePath",
    "exclusions",
    "hostResume",
    "outcome",
    "playbook",
    "protectedDecisionPolicy",
    "reportPath",
    "schemaVersion",
    "scopeRoots",
    "statePath",
    "stopPolicy",
    "validationArgv",
  ], "campaign definition");
  if (input.schemaVersion !== 1) throw new WorkCampaignError("campaign definition.schemaVersion must be 1", 2, { field: "schemaVersion" });
  if (input.playbook !== "audit-remediate") throw new WorkCampaignError(`unsupported playbook: ${String(input.playbook)}`, 2, { field: "playbook" });
  const allowedEffects = effects(input.allowedEffects, "allowedEffects");
  const refs = authorizationRefs(input.authorizationRefs, allowedEffects);
  const parsedCheckpoint = checkpoint(input.checkpoint);
  if (parsedCheckpoint.mode === "local-commit" && !allowedEffects.includes("local-commit")) {
    throw new WorkCampaignError("local-commit checkpoint requires local-commit in allowedEffects", 2, { field: "allowedEffects" });
  }
  const budgetInput = record(input.budgets, "budgets");
  exactKeys(budgetInput, ["evidenceBytes", "modelCalls", "processAttempts", "wallClockSeconds", "waves"], "budgets");
  const hostInput = record(input.hostResume, "hostResume");
  exactKeys(hostInput, ["enabled", "supervisorRequired"], "hostResume");
  if (typeof hostInput.enabled !== "boolean" || typeof hostInput.supervisorRequired !== "boolean") {
    throw new WorkCampaignError("hostResume values must be boolean", 2, { field: "hostResume" });
  }
  if (hostInput.enabled && !hostInput.supervisorRequired) {
    throw new WorkCampaignError("enabled host resume requires supervisorRequired=true", 2, { field: "hostResume.supervisorRequired" });
  }
  const stopInput = record(input.stopPolicy, "stopPolicy");
  const stopFields = ["onBudgetExhausted", "onExplicitStop", "onOwnerRequired", "onProtected", "onUnknown"] as const;
  exactKeys(stopInput, stopFields, "stopPolicy");
  for (const field of stopFields) {
    if (stopInput[field] !== true) throw new WorkCampaignError(`stopPolicy.${field} must be true`, 2, { field: `stopPolicy.${field}` });
  }
  if (input.protectedDecisionPolicy !== "owner-required") {
    throw new WorkCampaignError("protectedDecisionPolicy must be owner-required", 2, { field: "protectedDecisionPolicy" });
  }
  const adapterPath = safeRelative(input.adapterPath, "adapterPath");
  const evidencePath = safeRelative(input.evidencePath, "evidencePath");
  const reportPath = safeRelative(input.reportPath, "reportPath");
  const statePath = safeRelative(input.statePath, "statePath");
  const ownedPaths = [adapterPath, evidencePath, reportPath, statePath];
  if (ownedPaths.some((left, index) => ownedPaths.slice(index + 1).some((right) => pathsOverlap(left, right)))) {
    throw new WorkCampaignError("adapter, evidence, report, and state paths must not overlap", 2, { field: "paths" });
  }
  return {
    adapterPath,
    allowedEffects,
    authorizationRefs: refs,
    budgets: {
      evidenceBytes: integer(budgetInput.evidenceBytes, "budgets.evidenceBytes", 1, 1_073_741_824),
      modelCalls: integer(budgetInput.modelCalls, "budgets.modelCalls", 1, 10_000),
      processAttempts: integer(budgetInput.processAttempts, "budgets.processAttempts", 1, 1_000),
      wallClockSeconds: integer(budgetInput.wallClockSeconds, "budgets.wallClockSeconds", 1, 31_536_000),
      waves: integer(budgetInput.waves, "budgets.waves", 1, 1_000),
    },
    campaignId: safeId(input.campaignId, "campaignId"),
    checkpoint: parsedCheckpoint,
    evidencePath,
    exclusions: strings(input.exclusions, "exclusions", { allowEmpty: true, paths: true }),
    hostResume: { enabled: hostInput.enabled, supervisorRequired: hostInput.supervisorRequired },
    outcome: requiredString(input.outcome, "outcome", 4_000),
    playbook: "audit-remediate",
    protectedDecisionPolicy: "owner-required",
    reportPath,
    schemaVersion: 1,
    scopeRoots: strings(input.scopeRoots, "scopeRoots", { paths: true }),
    statePath,
    stopPolicy: {
      onBudgetExhausted: true,
      onExplicitStop: true,
      onOwnerRequired: true,
      onProtected: true,
      onUnknown: true,
    },
    validationArgv: argv(input.validationArgv, "validationArgv"),
  };
}

export function parseWorkCampaignAdapter(value: unknown): WorkCampaignAdapter {
  const input = record(value, "campaign adapter");
  exactKeys(input, ["adapterId", "inventoryArgv", "realBoundaryProofArgv", "schemaVersion"], "campaign adapter");
  if (input.schemaVersion !== 1) throw new WorkCampaignError("campaign adapter.schemaVersion must be 1", 2, { field: "schemaVersion" });
  return {
    adapterId: safeId(input.adapterId, "adapterId"),
    inventoryArgv: argv(input.inventoryArgv, "inventoryArgv"),
    realBoundaryProofArgv: argv(input.realBoundaryProofArgv, "realBoundaryProofArgv"),
    schemaVersion: 1,
  };
}

export function parseCampaignInventoryBlock(value: unknown): CampaignInventoryBlock {
  const input = record(value, "inventory-block");
  requireSchemaAndType(input, "inventory-block", ["classification", "digest", "exclusionReason", "id", "kind", "path", "reviewStatus"]);
  const classification = enumValue(input.classification, "classification", ["evidence", "excluded", "generated", "maintained", "vendor"] as const);
  const exclusionReason = nullableString(input.exclusionReason, "exclusionReason");
  if ((classification === "excluded") !== (exclusionReason != null)) {
    throw new WorkCampaignError("exclusionReason must be present exactly for excluded blocks", 2, { field: "exclusionReason" });
  }
  const reviewStatus = enumValue(input.reviewStatus, "reviewStatus", ["blocked", "excluded", "needs-direct-review", "needs-rereview", "pending", "reviewed-no-finding", "reviewed-with-finding"] as const);
  if ((classification === "excluded") !== (reviewStatus === "excluded")) {
    throw new WorkCampaignError("excluded classification and reviewStatus must be present together", 2, { field: "reviewStatus" });
  }
  return {
    classification,
    digest: digest(input.digest, "digest"),
    exclusionReason,
    id: safeId(input.id, "id"),
    kind: enumValue(input.kind, "kind", ["file", "logical-block"] as const),
    path: safeRelative(input.path, "path"),
    recordType: "inventory-block",
    reviewStatus,
    schemaVersion: 1,
  };
}

export function parseCampaignPartitionResult(value: unknown): CampaignPartitionResult {
  const input = record(value, "partition-result");
  requireSchemaAndType(input, "partition-result", ["assignmentId", "blockIds", "candidateDigest", "evidenceRefs", "id", "inventoryDigest", "producerSessionRef", "status", "workItemIds"]);
  return {
    assignmentId: safeId(input.assignmentId, "assignmentId"),
    blockIds: strings(input.blockIds, "blockIds", { ids: true }),
    candidateDigest: digest(input.candidateDigest, "candidateDigest"),
    evidenceRefs: strings(input.evidenceRefs, "evidenceRefs", { allowEmpty: true, refs: true }),
    id: safeId(input.id, "id"),
    inventoryDigest: digest(input.inventoryDigest, "inventoryDigest"),
    producerSessionRef: reference(input.producerSessionRef, "producerSessionRef"),
    recordType: "partition-result",
    schemaVersion: 1,
    status: enumValue(input.status, "status", ["blocked", "complete", "unknown"] as const),
    workItemIds: strings(input.workItemIds, "workItemIds", { allowEmpty: true, ids: true }),
  };
}

export function parseCampaignWorkItem(value: unknown): CampaignWorkItem {
  const input = record(value, "work-item");
  requireSchemaAndType(input, "work-item", [
    "affectedPaths", "candidateDigest", "confidence", "effectClasses", "evidenceRefs", "id", "impact", "initialSeverity", "likelyCause", "ownedPaths", "principleRef", "producerSessionRef", "proposedOutcome", "scenario", "sourceBlockIds", "status",
  ]);
  return {
    affectedPaths: strings(input.affectedPaths, "affectedPaths", { paths: true }),
    candidateDigest: digest(input.candidateDigest, "candidateDigest"),
    confidence: enumValue(input.confidence, "confidence", ["high", "low", "medium", "unknown"] as const),
    effectClasses: effects(input.effectClasses, "effectClasses"),
    evidenceRefs: strings(input.evidenceRefs, "evidenceRefs", { refs: true }),
    id: safeId(input.id, "id"),
    impact: requiredString(input.impact, "impact", 4_000),
    initialSeverity: enumValue(input.initialSeverity, "initialSeverity", ["P0", "P1", "P2", "P3", "unknown"] as const),
    likelyCause: requiredString(input.likelyCause, "likelyCause", 4_000),
    ownedPaths: strings(input.ownedPaths, "ownedPaths", { paths: true }),
    principleRef: reference(input.principleRef, "principleRef"),
    producerSessionRef: reference(input.producerSessionRef, "producerSessionRef"),
    proposedOutcome: requiredString(input.proposedOutcome, "proposedOutcome", 4_000),
    recordType: "work-item",
    scenario: requiredString(input.scenario, "scenario", 4_000),
    schemaVersion: 1,
    sourceBlockIds: strings(input.sourceBlockIds, "sourceBlockIds", { ids: true }),
    status: enumValue(input.status, "status", ["candidate", "confirmed", "duplicate", "falsified", "fixed-and-verified", "owner-required", "report-only", "unknown-material"] as const),
  };
}

export function parseCampaignReconciliationResult(value: unknown): CampaignReconciliationResult {
  const input = record(value, "reconciliation-result");
  requireSchemaAndType(input, "reconciliation-result", ["candidateDigest", "disposition", "evidenceRefs", "id", "producerSessionRef", "severity", "sourceDigest", "workItemId"]);
  return {
    candidateDigest: digest(input.candidateDigest, "candidateDigest"),
    disposition: enumValue(input.disposition, "disposition", ["confirmed", "duplicate", "falsified", "unknown"] as const),
    evidenceRefs: strings(input.evidenceRefs, "evidenceRefs", { refs: true }),
    id: safeId(input.id, "id"),
    producerSessionRef: reference(input.producerSessionRef, "producerSessionRef"),
    recordType: "reconciliation-result",
    schemaVersion: 1,
    severity: enumValue(input.severity, "severity", ["P0", "P1", "P2", "P3", "unknown"] as const),
    sourceDigest: digest(input.sourceDigest, "sourceDigest"),
    workItemId: safeId(input.workItemId, "workItemId"),
  };
}

export function parseCampaignInvestigationResult(value: unknown): CampaignInvestigationResult {
  const input = record(value, "investigation-result");
  requireSchemaAndType(input, "investigation-result", ["allowedObservations", "budgets", "evidenceRefs", "id", "producerSessionRef", "question", "result", "sourceBlockIds", "workItemId"]);
  const budgetInput = record(input.budgets, "budgets");
  exactKeys(budgetInput, ["modelCalls", "wallClockSeconds"], "budgets");
  return {
    allowedObservations: strings(input.allowedObservations, "allowedObservations"),
    budgets: {
      modelCalls: integer(budgetInput.modelCalls, "budgets.modelCalls", 1, 100),
      wallClockSeconds: integer(budgetInput.wallClockSeconds, "budgets.wallClockSeconds", 1, 86_400),
    },
    evidenceRefs: strings(input.evidenceRefs, "evidenceRefs", { refs: true }),
    id: safeId(input.id, "id"),
    producerSessionRef: reference(input.producerSessionRef, "producerSessionRef"),
    question: requiredString(input.question, "question", 4_000),
    recordType: "investigation-result",
    result: enumValue(input.result, "result", ["confirmed", "falsified", "owner-required", "still-unknown"] as const),
    schemaVersion: 1,
    sourceBlockIds: strings(input.sourceBlockIds, "sourceBlockIds", { ids: true }),
    workItemId: safeId(input.workItemId, "workItemId"),
  };
}

function parseWaveSlice(value: unknown, index: number): CampaignWaveSlice {
  const input = record(value, `slices[${index}]`);
  exactKeys(input, ["changeId", "dependsOn", "effectClasses", "expectedProof", "id", "outcome", "ownedPaths", "validationArgv", "workItemIds"], `slices[${index}]`);
  return {
    changeId: safeId(input.changeId, `slices[${index}].changeId`),
    dependsOn: strings(input.dependsOn, `slices[${index}].dependsOn`, { allowEmpty: true, ids: true }),
    effectClasses: effects(input.effectClasses, `slices[${index}].effectClasses`),
    expectedProof: requiredString(input.expectedProof, `slices[${index}].expectedProof`, 4_000),
    id: safeId(input.id, `slices[${index}].id`),
    outcome: requiredString(input.outcome, `slices[${index}].outcome`, 4_000),
    ownedPaths: strings(input.ownedPaths, `slices[${index}].ownedPaths`, { paths: true }),
    validationArgv: argv(input.validationArgv, `slices[${index}].validationArgv`),
    workItemIds: strings(input.workItemIds, `slices[${index}].workItemIds`, { ids: true }),
  };
}

export function parseCampaignWaveManifest(value: unknown): CampaignWaveManifest {
  const input = record(value, "wave-manifest");
  requireSchemaAndType(input, "wave-manifest", ["campaignId", "candidateDigest", "definitionDigest", "id", "missionDefinitionDigest", "slices", "status", "workItemIds"]);
  if (!Array.isArray(input.slices) || input.slices.length === 0 || input.slices.length > 100) {
    throw new WorkCampaignError("slices must contain between 1 and 100 items", 2, { field: "slices" });
  }
  const slices = input.slices.map(parseWaveSlice);
  const ids = slices.map((slice) => slice.id);
  if (new Set(ids).size !== ids.length || new Set(slices.map((slice) => slice.changeId)).size !== slices.length) {
    throw new WorkCampaignError("slice ids and change ids must be unique", 2, { field: "slices" });
  }
  const positions = new Map(ids.map((id, index) => [id, index]));
  for (const [index, slice] of slices.entries()) {
    for (const dependency of slice.dependsOn) {
      const position = positions.get(dependency);
      if (position == null || position >= index) {
        throw new WorkCampaignError(`slice ${slice.id} dependency ${dependency} must reference an earlier slice`, 2, { field: "slices" });
      }
    }
  }
  const workItemIds = strings(input.workItemIds, "workItemIds", { ids: true });
  const referenced = new Set(slices.flatMap((slice) => slice.workItemIds));
  if (workItemIds.some((id) => !referenced.has(id)) || [...referenced].some((id) => !workItemIds.includes(id))) {
    throw new WorkCampaignError("wave workItemIds must exactly match slice workItemIds", 2, { field: "workItemIds" });
  }
  return {
    campaignId: safeId(input.campaignId, "campaignId"),
    candidateDigest: digest(input.candidateDigest, "candidateDigest"),
    definitionDigest: digest(input.definitionDigest, "definitionDigest"),
    id: safeId(input.id, "id"),
    missionDefinitionDigest: digest(input.missionDefinitionDigest, "missionDefinitionDigest"),
    recordType: "wave-manifest",
    schemaVersion: 1,
    slices,
    status: enumValue(input.status, "status", ["frozen"] as const),
    workItemIds,
  };
}

function totals(value: unknown, field: string, names: readonly string[]): JsonRecord {
  const input = record(value, field);
  exactKeys(input, names, field);
  return Object.fromEntries(names.map((name) => [name, integer(input[name], `${field}.${name}`, 0)]));
}

export function parseCampaignClosureMatrix(value: unknown): CampaignClosureMatrix {
  const input = record(value, "closure-matrix");
  requireSchemaAndType(input, "closure-matrix", ["candidateDigest", "challengeStatus", "definitionDigest", "inventory", "ownershipStatus", "proofStatus", "reportDigest", "terminalState", "validationStatus", "waves", "workItems"]);
  const inventory = totals(input.inventory, "inventory", ["blocked", "currentTerminal", "needsRereview", "total"]);
  const waves = totals(input.waves, "waves", ["archived", "checkpointed", "total"]);
  const workItems = totals(input.workItems, "workItems", ["fixedAndVerified", "ownerRequired", "reportOnly", "resolved", "total", "unknownMaterial", "unresolvedP0P1"]);
  return {
    candidateDigest: digest(input.candidateDigest, "candidateDigest"),
    challengeStatus: enumValue(input.challengeStatus, "challengeStatus", ["blocked", "complete", "unknown"] as const),
    definitionDigest: digest(input.definitionDigest, "definitionDigest"),
    inventory: inventory as CampaignClosureMatrix["inventory"],
    ownershipStatus: enumValue(input.ownershipStatus, "ownershipStatus", ["blocked", "terminal", "unknown"] as const),
    proofStatus: enumValue(input.proofStatus, "proofStatus", ["blocked", "complete", "unknown"] as const),
    recordType: "closure-matrix",
    reportDigest: digest(input.reportDigest, "reportDigest"),
    schemaVersion: 1,
    terminalState: enumValue(input.terminalState, "terminalState", ["blocked", "complete", "owner-required", "unknown"] as const),
    validationStatus: enumValue(input.validationStatus, "validationStatus", ["blocked", "complete", "unknown"] as const),
    waves: waves as CampaignClosureMatrix["waves"],
    workItems: workItems as CampaignClosureMatrix["workItems"],
  };
}

function reportFact(value: unknown, field: string): CampaignReportFact {
  const input = record(value, field);
  exactKeys(input, ["evidenceRefs", "id", "summary"], field);
  return {
    evidenceRefs: strings(input.evidenceRefs, `${field}.evidenceRefs`, { allowEmpty: true, refs: true }),
    id: safeId(input.id, `${field}.id`),
    summary: requiredString(input.summary, `${field}.summary`, 4_000),
  };
}

function uniqueReportRows<T extends { id: string }>(rows: T[], field: string): T[] {
  if (new Set(rows.map((row) => row.id)).size !== rows.length) {
    throw new WorkCampaignError(`${field} ids must be unique`, 2, { field });
  }
  return rows.sort((left, right) => left.id.localeCompare(right.id));
}

export function parseCampaignReportSeed(value: unknown): CampaignReportSeed {
  const input = record(value, "report-seed");
  requireSchemaAndType(input, "report-seed", [
    "blockers", "candidateDigest", "challengeStatus", "definitionDigest", "limitations", "matrixRows", "maximumClaim", "ownershipStatus", "proofStatus", "terminalState", "validationRows", "validationStatus", "waveRows",
  ]);
  if (!Array.isArray(input.blockers) || !Array.isArray(input.limitations) || !Array.isArray(input.matrixRows)
    || !Array.isArray(input.validationRows) || !Array.isArray(input.waveRows)) {
    throw new WorkCampaignError("report-seed row collections must be arrays", 2, { field: "report-seed" });
  }
  const blockers = uniqueReportRows(input.blockers.map((value, index) => {
    const row = record(value, `blockers[${index}]`);
    exactKeys(row, ["evidenceRefs", "id", "status", "summary"], `blockers[${index}]`);
    return {
      ...reportFact({ evidenceRefs: row.evidenceRefs, id: row.id, summary: row.summary }, `blockers[${index}]`),
      status: enumValue(row.status, `blockers[${index}].status`, ["blocked", "owner-required", "unknown"] as const),
    };
  }), "blockers");
  const limitations = uniqueReportRows(input.limitations.map((value, index) => reportFact(value, `limitations[${index}]`)), "limitations");
  const matrixRows = uniqueReportRows(input.matrixRows.map((value, index) => {
    const row = record(value, `matrixRows[${index}]`);
    exactKeys(row, ["blockIds", "evidenceRefs", "id", "kind", "status", "summary", "workItemIds"], `matrixRows[${index}]`);
    return {
      ...reportFact({ evidenceRefs: row.evidenceRefs, id: row.id, summary: row.summary }, `matrixRows[${index}]`),
      blockIds: strings(row.blockIds, `matrixRows[${index}].blockIds`, { allowEmpty: true, ids: true }),
      kind: enumValue(row.kind, `matrixRows[${index}].kind`, ["failure-mode", "redundancy", "test-gap"] as const),
      status: enumValue(row.status, `matrixRows[${index}].status`, ["open", "report-only", "resolved", "unknown"] as const),
      workItemIds: strings(row.workItemIds, `matrixRows[${index}].workItemIds`, { allowEmpty: true, ids: true }),
    };
  }), "matrixRows");
  const validationRows = uniqueReportRows(input.validationRows.map((value, index) => {
    const row = record(value, `validationRows[${index}]`);
    exactKeys(row, ["argv", "evidenceRefs", "id", "kind", "status", "summary"], `validationRows[${index}]`);
    return {
      ...reportFact({ evidenceRefs: row.evidenceRefs, id: row.id, summary: row.summary }, `validationRows[${index}]`),
      argv: argv(row.argv, `validationRows[${index}].argv`),
      kind: enumValue(row.kind, `validationRows[${index}].kind`, ["proof", "validation"] as const),
      status: enumValue(row.status, `validationRows[${index}].status`, ["blocked", "complete", "unknown"] as const),
    };
  }), "validationRows");
  const waveRows = uniqueReportRows(input.waveRows.map((value, index) => {
    const row = record(value, `waveRows[${index}]`);
    exactKeys(row, ["archiveRefs", "checkpointRef", "evidenceRefs", "id", "status", "summary", "waveId"], `waveRows[${index}]`);
    return {
      ...reportFact({ evidenceRefs: row.evidenceRefs, id: row.id, summary: row.summary }, `waveRows[${index}]`),
      archiveRefs: strings(row.archiveRefs, `waveRows[${index}].archiveRefs`, { allowEmpty: true, refs: true }),
      checkpointRef: row.checkpointRef == null ? null : reference(row.checkpointRef, `waveRows[${index}].checkpointRef`),
      status: enumValue(row.status, `waveRows[${index}].status`, ["blocked", "complete", "unknown"] as const),
      waveId: safeId(row.waveId, `waveRows[${index}].waveId`),
    };
  }), "waveRows");
  return {
    blockers,
    candidateDigest: digest(input.candidateDigest, "candidateDigest"),
    challengeStatus: enumValue(input.challengeStatus, "challengeStatus", ["blocked", "complete", "unknown"] as const),
    definitionDigest: digest(input.definitionDigest, "definitionDigest"),
    limitations,
    matrixRows,
    maximumClaim: requiredString(input.maximumClaim, "maximumClaim", 4_000),
    ownershipStatus: enumValue(input.ownershipStatus, "ownershipStatus", ["blocked", "terminal", "unknown"] as const),
    proofStatus: enumValue(input.proofStatus, "proofStatus", ["blocked", "complete", "unknown"] as const),
    recordType: "report-seed",
    schemaVersion: 1,
    terminalState: enumValue(input.terminalState, "terminalState", ["blocked", "complete", "owner-required", "unknown"] as const),
    validationRows,
    validationStatus: enumValue(input.validationStatus, "validationStatus", ["blocked", "complete", "unknown"] as const),
    waveRows,
  };
}

export function parseWorkCampaignResult(value: unknown): WorkCampaignResult {
  const input = record(value, "campaign-result");
  requireSchemaAndType(input, "campaign-result", ["campaignId", "cleanup", "definitionDigest", "disposition", "errorClass", "errorMessage", "evidenceRefs", "operation", "phase", "supervision", "terminalHandoff", "tool", "writerClosure"]);
  const definitionDigest = digest(input.definitionDigest, "definitionDigest");
  const disposition = enumValue(input.disposition, "disposition", ["blocked", "complete", "owner-required", "paused-budget", "paused-external", "paused-stop", "paused-unknown"] as const);
  let terminalHandoff: CampaignTerminalHandoff | null = null;
  if (input.terminalHandoff != null) {
    const handoff = record(input.terminalHandoff, "terminalHandoff");
    exactKeys(handoff, ["candidateDigest", "closure", "definitionDigest", "evidenceRefs", "maximumClaim", "reportDigest", "reportPath", "schemaVersion", "terminalState"], "terminalHandoff");
    if (handoff.schemaVersion !== 1) throw new WorkCampaignError("terminalHandoff.schemaVersion must be 1", 2, { field: "terminalHandoff.schemaVersion" });
    const closure = parseCampaignClosureMatrix(handoff.closure);
    terminalHandoff = {
      candidateDigest: digest(handoff.candidateDigest, "terminalHandoff.candidateDigest"),
      closure,
      definitionDigest: digest(handoff.definitionDigest, "terminalHandoff.definitionDigest"),
      evidenceRefs: strings(handoff.evidenceRefs, "terminalHandoff.evidenceRefs", { refs: true }),
      maximumClaim: requiredString(handoff.maximumClaim, "terminalHandoff.maximumClaim", 4_000),
      reportDigest: digest(handoff.reportDigest, "terminalHandoff.reportDigest"),
      reportPath: safeRelative(handoff.reportPath, "terminalHandoff.reportPath"),
      schemaVersion: 1,
      terminalState: enumValue(handoff.terminalState, "terminalHandoff.terminalState", ["complete"] as const),
    };
    if (terminalHandoff.candidateDigest !== closure.candidateDigest
      || terminalHandoff.definitionDigest !== definitionDigest || closure.definitionDigest !== definitionDigest
      || terminalHandoff.reportDigest !== closure.reportDigest || closure.terminalState !== "complete"
      || closure.challengeStatus !== "complete") {
      throw new WorkCampaignError("terminalHandoff does not match its complete campaign closure", 2, { field: "terminalHandoff" });
    }
  }
  if ((disposition === "complete") !== (terminalHandoff != null)) {
    throw new WorkCampaignError("complete campaign disposition requires exactly one terminalHandoff", 2, { field: "terminalHandoff" });
  }
  let supervision: CampaignSupervisionAdvice | null = null;
  if (input.supervision != null) {
    const advice = record(input.supervision, "supervision");
    exactKeys(advice, ["action", "reason"], "supervision");
    supervision = {
      action: enumValue(advice.action, "supervision.action", ["resume", "suppress", "unknown"] as const),
      reason: enumValue(advice.reason, "supervision.reason", ["active-operation", "budget", "complete", "definition-or-project-drift", "explicit-stop", "external-input-required", "not-started", "owner-protected", "runtime-interruption-ready", "terminal-evidence-restored", "writer-or-cleanup-unknown"] as const),
    };
    if (input.operation !== "status") throw new WorkCampaignError("supervision advice is valid only for status", 2, { field: "supervision" });
  }
  return {
    campaignId: safeId(input.campaignId, "campaignId"),
    cleanup: enumValue(input.cleanup, "cleanup", ["complete", "not-required", "unknown"] as const),
    definitionDigest,
    disposition,
    errorClass: enumValue(input.errorClass, "errorClass", ["budget", "immutable-input", "locally-correctable", "none", "owner-protected", "transient", "unknown"] as const),
    errorMessage: nullableString(input.errorMessage, "errorMessage", 4_000),
    evidenceRefs: strings(input.evidenceRefs, "evidenceRefs", { allowEmpty: true, refs: true }),
    operation: enumValue(input.operation, "operation", ["preflight", "replay", "resume", "run", "status", "stop", "verify"] as const),
    phase: enumValue(input.phase, "phase", ["complete", "discover", "inventory", "mission", "paused", "synthesize", "verify"] as const),
    recordType: "campaign-result",
    schemaVersion: 1,
    supervision,
    terminalHandoff,
    tool: enumValue(input.tool, "tool", ["work-campaign"] as const),
    writerClosure: enumValue(input.writerClosure, "writerClosure", ["isolated", "terminal", "unknown"] as const),
  };
}

export function parseWorkCampaignRecord(value: unknown): WorkCampaignRecord {
  const input = record(value, "campaign record");
  switch (input.recordType) {
    case "campaign-result": return parseWorkCampaignResult(input);
    case "closure-matrix": return parseCampaignClosureMatrix(input);
    case "investigation-result": return parseCampaignInvestigationResult(input);
    case "inventory-block": return parseCampaignInventoryBlock(input);
    case "partition-result": return parseCampaignPartitionResult(input);
    case "reconciliation-result": return parseCampaignReconciliationResult(input);
    case "report-seed": return parseCampaignReportSeed(input);
    case "wave-manifest": return parseCampaignWaveManifest(input);
    case "work-item": return parseCampaignWorkItem(input);
    default: throw new WorkCampaignError(`unsupported campaign recordType: ${String(input.recordType)}`, 2, { field: "recordType" });
  }
}

function containedExistingFile(root: string, relative: string, field: string): string {
  const canonicalRoot = fs.realpathSync(root);
  const candidate = path.resolve(canonicalRoot, relative);
  const lexical = path.relative(canonicalRoot, candidate);
  if (lexical.startsWith("..") || path.isAbsolute(lexical)) {
    throw new WorkCampaignError(`${field} escapes the project root`, 2, { field });
  }
  let canonical: string;
  try {
    canonical = fs.realpathSync(candidate);
  } catch (error) {
    throw new WorkCampaignError(`${field} is unreadable`, 2, { cause: error, field });
  }
  const actual = path.relative(canonicalRoot, canonical);
  if (actual.startsWith("..") || path.isAbsolute(actual)) {
    throw new WorkCampaignError(`${field} resolves outside the project root`, 2, { field });
  }
  return canonical;
}

function loadJson(file: string, field: string): unknown {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (error) {
    throw new WorkCampaignError(`${field} must contain valid UTF-8 JSON`, 2, { cause: error, field });
  }
}

export function loadWorkCampaignDefinition(root: string, definitionPath: string): {
  adapter: WorkCampaignAdapter;
  adapterDigest: string;
  definition: WorkCampaignDefinition;
  definitionDigest: string;
} {
  const safeDefinitionPath = safeRelative(definitionPath, "definitionPath");
  const file = containedExistingFile(root, safeDefinitionPath, "definitionPath");
  const definition = parseWorkCampaignDefinition(loadJson(file, "definitionPath"));
  const adapterFile = containedExistingFile(root, definition.adapterPath, "adapterPath");
  const adapter = parseWorkCampaignAdapter(loadJson(adapterFile, "adapterPath"));
  return {
    adapter,
    adapterDigest: campaignDigest(adapter),
    definition,
    definitionDigest: campaignDigest(definition),
  };
}
