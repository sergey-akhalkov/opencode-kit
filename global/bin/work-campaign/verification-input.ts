import fs from "node:fs";
import path from "node:path";

import { stableJson } from "../roadmap-mission/contracts.ts";
import {
  WorkCampaignError,
  campaignDigest,
  parseCampaignClosureMatrix,
  parseCampaignPartitionResult,
  parseCampaignReconciliationResult,
  parseCampaignWaveManifest,
  parseCampaignWorkItem,
} from "./contracts.ts";
import type {
  CampaignClosureMatrix,
  CampaignInventoryBlock,
  CampaignPartitionResult,
  CampaignReconciliationResult,
  CampaignWaveManifest,
  CampaignWorkItem,
  WorkCampaignDefinition,
} from "./contracts.ts";
import { loadCampaignSeedRecord } from "./materializer.ts";
import {
  parseSemanticAssignment,
  type SemanticAssignment,
  type SemanticAssignmentResult,
} from "./semantic-executor.ts";
import { validateSemanticPlaybookResult } from "./semantic-playbook.ts";

type JsonRecord = Record<string, unknown>;
type VerificationInputType = "semantic-final-challenge-input" | "semantic-reconciliation-input" | "semantic-rereview-input" | "semantic-wave-input";

type VerificationInput = {
  assignmentPath: string;
  evidenceRefs: string[];
  inputType: VerificationInputType;
  recordPaths: string[];
  resultPath: string;
  schemaVersion: 1;
};

type ValidatedBase = {
  assignment: SemanticAssignment;
  evidenceBytes: number;
  evidenceRefs: string[];
};

export type ValidatedRereviewInput = ValidatedBase & {
  blocks: CampaignInventoryBlock[];
  inputType: "semantic-rereview-input";
  partition: CampaignPartitionResult;
  workItems: CampaignWorkItem[];
};

export type ValidatedFinalChallengeInput = ValidatedBase & {
  closure: CampaignClosureMatrix;
  inputType: "semantic-final-challenge-input";
};

export type ValidatedReconciliationInput = ValidatedBase & {
  inputType: "semantic-reconciliation-input";
  reconciliation: CampaignReconciliationResult;
};

export type ValidatedWaveInput = ValidatedBase & {
  inputType: "semantic-wave-input";
  wave: CampaignWaveManifest;
};

export type ValidatedVerificationInput = ValidatedFinalChallengeInput | ValidatedReconciliationInput | ValidatedRereviewInput | ValidatedWaveInput;

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
  throw new WorkCampaignError(`${field} has invalid fields: ${[
    missing.length === 0 ? null : `missing=${missing.join(",")}`,
    extras.length === 0 ? null : `unsupported=${extras.join(",")}`,
  ].filter(Boolean).join(" ")}`, 2, { field });
}

function text(value: unknown, field: string, max = 500): string {
  if (typeof value !== "string" || value.trim() === "" || value.length > max || /[\r\n\0]/u.test(value)) {
    throw new WorkCampaignError(`${field} must be a non-empty single-line string of at most ${max} characters`, 2, { field });
  }
  return value.trim();
}

function oneOf<const T extends readonly string[]>(value: unknown, field: string, allowed: T): T[number] {
  const parsed = text(value, field);
  if (!allowed.includes(parsed)) throw new WorkCampaignError(`${field} is unsupported`, 2, { field });
  return parsed as T[number];
}

function integer(value: unknown, field: string, minimum = 0): number {
  if (!Number.isSafeInteger(value) || Number(value) < minimum) {
    throw new WorkCampaignError(`${field} must be a safe integer of at least ${minimum}`, 2, { field });
  }
  return Number(value);
}

function safeRelative(value: unknown, field: string): string {
  const parsed = text(value, field);
  if (parsed.includes("\\") || path.posix.isAbsolute(parsed) || path.win32.isAbsolute(parsed)
    || parsed.split("/").some((part) => part === "" || part === "." || part === "..")) {
    throw new WorkCampaignError(`${field} must be a contained forward-slash project-relative path`, 2, { field });
  }
  return parsed;
}

function strings(value: unknown, field: string, options: { allowEmpty?: boolean; paths?: boolean; refs?: boolean } = {}): string[] {
  if (!Array.isArray(value) || value.length > 1_000 || (!options.allowEmpty && value.length === 0)) {
    throw new WorkCampaignError(`${field} has an invalid item count`, 2, { field });
  }
  const parsed = value.map((item, index) => {
    const result = options.paths ? safeRelative(item, `${field}[${index}]`) : text(item, `${field}[${index}]`);
    if (options.refs && !referencePattern.test(result)) throw new WorkCampaignError(`${field}[${index}] must be a typed reference`, 2, { field });
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

function readJson(root: string, relative: string, field: string): { bytes: number; value: unknown } {
  const file = containedFile(root, relative, field);
  try {
    const source = fs.readFileSync(file, "utf8");
    return { bytes: Buffer.byteLength(source), value: JSON.parse(source) };
  } catch (error) {
    throw new WorkCampaignError(`${field} must contain valid UTF-8 JSON`, 2, { cause: error, field });
  }
}

function parseInput(root: string, relative: string): { bytes: number; input: VerificationInput } {
  const loaded = readJson(root, relative, "verificationInputPath");
  const input = object(loaded.value, "verification input");
  exactKeys(input, ["assignmentPath", "evidenceRefs", "inputType", "recordPaths", "resultPath", "schemaVersion"], "verification input");
  if (input.schemaVersion !== 1) throw new WorkCampaignError("verification input schemaVersion must be 1", 2, { field: "verificationInputPath" });
  const recordPaths = strings(input.recordPaths, "recordPaths", { allowEmpty: true, paths: true });
  if (stableJson(recordPaths) !== stableJson(recordPaths.slice().sort())) throw new WorkCampaignError("recordPaths must use stable lexical order", 2, { field: "recordPaths" });
  return {
    bytes: loaded.bytes,
    input: {
      assignmentPath: safeRelative(input.assignmentPath, "assignmentPath"),
      evidenceRefs: strings(input.evidenceRefs, "evidenceRefs", { refs: true }).sort(),
      inputType: oneOf(input.inputType, "inputType", ["semantic-final-challenge-input", "semantic-reconciliation-input", "semantic-rereview-input", "semantic-wave-input"] as const),
      recordPaths,
      resultPath: safeRelative(input.resultPath, "resultPath"),
      schemaVersion: 1,
    },
  };
}

function parseResult(value: unknown, assignment: SemanticAssignment): SemanticAssignmentResult {
  const input = object(value, "semantic assignment result");
  exactKeys(input, [
    "assignmentDigest", "assignmentId", "assignmentType", "campaignId", "candidateDigest", "cleanup", "definitionDigest",
    "environment", "errorClass", "errorMessage", "evidenceRefs", "model", "modelCalls", "outputBytes", "outputDigest",
    "payload", "phase", "resultType", "runtimeRef", "schemaVersion", "sessionRef", "status", "toolCalls", "verification",
  ], "semantic assignment result");
  if (input.schemaVersion !== 1 || input.resultType !== "semantic-assignment-result") {
    throw new WorkCampaignError("semantic assignment result identity is unsupported", 2, { field: "resultPath" });
  }
  const assignmentDigest = text(input.assignmentDigest, "assignmentDigest", 64);
  if (!digestPattern.test(assignmentDigest) || assignmentDigest !== campaignDigest(assignment)) {
    throw new WorkCampaignError("semantic assignment result digest differs", 2, { field: "assignmentDigest" });
  }
  const environment = object(input.environment, "environment");
  exactKeys(environment, ["node", "platform"], "environment");
  const verification = object(input.verification, "verification");
  exactKeys(verification, ["children", "fileDiffs", "parentless", "permissionRequests", "questions"], "verification");
  const modelInput = object(input.model, "model");
  exactKeys(modelInput, ["agent", "modelID", "providerID", "variant"], "model");
  const toolCallsInput = Array.isArray(input.toolCalls) ? input.toolCalls : null;
  if (toolCallsInput == null || toolCallsInput.length > 10_000) throw new WorkCampaignError("toolCalls must be a bounded array", 2, { field: "toolCalls" });
  const toolCalls = toolCallsInput.map((value, index) => {
    const row = object(value, `toolCalls[${index}]`);
    exactKeys(row, ["name", "status"], `toolCalls[${index}]`);
    return { name: text(row.name, `toolCalls[${index}].name`), status: row.status == null ? null : text(row.status, `toolCalls[${index}].status`) };
  });
  const payloadInput = object(input.payload, "payload");
  let payload: SemanticAssignmentResult["payload"];
  if (assignment.assignmentType === "discovery") {
    exactKeys(payloadInput, ["partition", "workItems"], "payload");
    if (!Array.isArray(payloadInput.workItems)) throw new WorkCampaignError("payload.workItems must be an array", 2, { field: "payload.workItems" });
    payload = {
      partition: parseCampaignPartitionResult(payloadInput.partition),
      workItems: payloadInput.workItems.map(parseCampaignWorkItem),
    };
  } else if (assignment.assignmentType === "reconciliation") {
    exactKeys(payloadInput, ["reconciliation"], "payload");
    payload = { reconciliation: parseCampaignReconciliationResult(payloadInput.reconciliation) };
  } else if (assignment.assignmentType === "synthesis") {
    exactKeys(payloadInput, ["wave"], "payload");
    payload = { wave: parseCampaignWaveManifest(payloadInput.wave) };
  } else if (assignment.assignmentType === "final-challenge") {
    exactKeys(payloadInput, ["closure"], "payload");
    payload = { closure: parseCampaignClosureMatrix(payloadInput.closure) };
  } else {
    throw new WorkCampaignError("verification input accepts only discovery, reconciliation, synthesis, or final-challenge assignments", 2, { field: "assignmentType" });
  }
  const outputDigest = text(input.outputDigest, "outputDigest", 64);
  const sessionRef = text(input.sessionRef, "sessionRef", 500);
  const result: SemanticAssignmentResult = {
    assignmentDigest,
    assignmentId: text(input.assignmentId, "assignmentId", 100),
    assignmentType: oneOf(input.assignmentType, "assignmentType", ["discovery", "final-challenge", "investigation", "reconciliation", "synthesis"] as const),
    campaignId: text(input.campaignId, "campaignId", 100),
    candidateDigest: text(input.candidateDigest, "candidateDigest", 64),
    cleanup: oneOf(input.cleanup, "cleanup", ["complete", "not-required", "unknown"] as const),
    definitionDigest: text(input.definitionDigest, "definitionDigest", 64),
    environment: { node: text(environment.node, "environment.node"), platform: text(environment.platform, "environment.platform") as NodeJS.Platform },
    errorClass: oneOf(input.errorClass, "errorClass", ["cleanup-unknown", "invalid-result", "none", "runtime", "timeout"] as const),
    errorMessage: input.errorMessage == null ? null : text(input.errorMessage, "errorMessage", 4_000),
    evidenceRefs: strings(input.evidenceRefs, "result.evidenceRefs", { refs: true }),
    model: {
      agent: text(modelInput.agent, "model.agent"),
      modelID: text(modelInput.modelID, "model.modelID"),
      providerID: text(modelInput.providerID, "model.providerID"),
      variant: modelInput.variant == null ? null : text(modelInput.variant, "model.variant"),
    },
    modelCalls: integer(input.modelCalls, "modelCalls"),
    outputBytes: integer(input.outputBytes, "outputBytes", 1),
    outputDigest,
    payload,
    phase: text(input.phase, "phase"),
    resultType: "semantic-assignment-result",
    runtimeRef: text(input.runtimeRef, "runtimeRef"),
    schemaVersion: 1,
    sessionRef,
    status: oneOf(input.status, "status", ["blocked", "complete", "unknown"] as const),
    toolCalls,
    verification: {
      children: integer(verification.children, "verification.children"),
      fileDiffs: integer(verification.fileDiffs, "verification.fileDiffs"),
      parentless: verification.parentless === true,
      permissionRequests: integer(verification.permissionRequests, "verification.permissionRequests"),
      questions: integer(verification.questions, "verification.questions"),
    },
  };
  if (!digestPattern.test(outputDigest) || result.outputBytes > assignment.budgets.outputBytes) {
    throw new WorkCampaignError("semantic output identity or byte budget differs", 2, { field: "outputDigest" });
  }
  if (assignment.assignmentType === "discovery" && result.payload != null && "partition" in result.payload) {
    if (result.payload.partition.assignmentId !== assignment.assignmentId
      || result.payload.partition.candidateDigest !== assignment.candidateDigest
      || result.payload.partition.producerSessionRef !== result.sessionRef
      || result.payload.workItems.some((item) => item.candidateDigest !== assignment.candidateDigest || item.producerSessionRef !== result.sessionRef)) {
      throw new WorkCampaignError("semantic discovery payload identity differs from its assignment or producer session", 2, { field: "payload" });
    }
  } else if (assignment.assignmentType === "final-challenge" && result.payload != null && "closure" in result.payload) {
    if (result.payload.closure.candidateDigest !== assignment.candidateDigest
      || result.payload.closure.definitionDigest !== assignment.definitionDigest) {
      throw new WorkCampaignError("semantic final challenge identity differs from its assignment", 2, { field: "payload" });
    }
  } else if (assignment.assignmentType === "reconciliation" && result.payload != null && "reconciliation" in result.payload) {
    if (result.payload.reconciliation.candidateDigest !== assignment.candidateDigest
      || result.payload.reconciliation.producerSessionRef !== result.sessionRef) {
      throw new WorkCampaignError("semantic reconciliation identity differs from its assignment or producer session", 2, { field: "payload" });
    }
  } else if (assignment.assignmentType === "synthesis" && result.payload != null && "wave" in result.payload) {
    if (result.payload.wave.campaignId !== assignment.campaignId
      || result.payload.wave.candidateDigest !== assignment.candidateDigest
      || result.payload.wave.definitionDigest !== assignment.definitionDigest) {
      throw new WorkCampaignError("semantic wave identity differs from its assignment", 2, { field: "payload" });
    }
  }
  return validateSemanticPlaybookResult({ assignment, resultPath: "verification-result.json" }, result);
}

export function loadValidatedVerificationInput(
  root: string,
  inputPath: string,
  definition: WorkCampaignDefinition,
  definitionDigest: string,
): ValidatedVerificationInput {
  const parsed = parseInput(root, inputPath);
  const assignmentSource = readJson(root, parsed.input.assignmentPath, "assignmentPath");
  const assignment = parseSemanticAssignment(assignmentSource.value);
  const resultSource = readJson(root, parsed.input.resultPath, "resultPath");
  const result = parseResult(resultSource.value, assignment);
  if (assignment.campaignId !== definition.campaignId || assignment.definitionDigest !== definitionDigest) {
    throw new WorkCampaignError("verification assignment campaign or definition identity differs", 2, { field: "assignmentPath" });
  }
  const records = parsed.input.recordPaths.map((relative) => loadCampaignSeedRecord(root, relative, definition.budgets.evidenceBytes));
  if (records.some((record) => record.recordType !== "inventory-block")) {
    throw new WorkCampaignError("verification recordPaths accept only inventory blocks", 2, { field: "recordPaths" });
  }
  const blocks = records as CampaignInventoryBlock[];
  const evidenceBytes = parsed.bytes + assignmentSource.bytes + resultSource.bytes
    + parsed.input.recordPaths.reduce((total, relative) => total + fs.statSync(containedFile(root, relative, "recordPaths")).size, 0);
  if (evidenceBytes > definition.budgets.evidenceBytes) throw new WorkCampaignError("verification input exceeds the campaign evidence budget", 1, { field: "verificationInputPath" });
  const evidenceRefs = [...new Set([
    ...parsed.input.evidenceRefs,
    ...assignment.evidenceRefs,
    ...result.evidenceRefs,
    `file:${inputPath}`,
    `file:${parsed.input.assignmentPath}`,
    `file:${parsed.input.resultPath}`,
    ...parsed.input.recordPaths.map((relative) => `file:${relative}`),
  ])].sort();
  if (parsed.input.inputType === "semantic-rereview-input") {
    if (assignment.assignmentType !== "discovery" || blocks.length === 0 || !("partition" in result.payload!)) {
      throw new WorkCampaignError("semantic rereview input requires discovery plus inventory block records", 2, { field: "inputType" });
    }
    return {
      assignment,
      blocks,
      evidenceBytes,
      evidenceRefs,
      inputType: "semantic-rereview-input",
      partition: result.payload.partition,
      workItems: result.payload.workItems,
    };
  }
  if (parsed.input.inputType === "semantic-reconciliation-input") {
    if (assignment.assignmentType !== "reconciliation" || blocks.length !== 0 || !("reconciliation" in result.payload!)) {
      throw new WorkCampaignError("semantic reconciliation input requires one reconciliation and no block records", 2, { field: "inputType" });
    }
    return {
      assignment,
      evidenceBytes,
      evidenceRefs,
      inputType: "semantic-reconciliation-input",
      reconciliation: result.payload.reconciliation,
    };
  }
  if (parsed.input.inputType === "semantic-wave-input") {
    if (assignment.assignmentType !== "synthesis" || blocks.length !== 0 || !("wave" in result.payload!)) {
      throw new WorkCampaignError("semantic wave input requires one synthesis wave and no block records", 2, { field: "inputType" });
    }
    return {
      assignment,
      evidenceBytes,
      evidenceRefs,
      inputType: "semantic-wave-input",
      wave: result.payload.wave,
    };
  }
  if (assignment.assignmentType !== "final-challenge" || blocks.length !== 0 || !("closure" in result.payload!)) {
    throw new WorkCampaignError("semantic final-challenge input requires one closure and no block records", 2, { field: "inputType" });
  }
  return {
    assignment,
    closure: result.payload.closure,
    evidenceBytes,
    evidenceRefs,
    inputType: "semantic-final-challenge-input",
  };
}
