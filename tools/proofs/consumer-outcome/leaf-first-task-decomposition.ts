import fs from "node:fs";
import path from "node:path";

import { materializeWorkFrontier } from "../../../global/extensions/session-completion-guard/frontier.ts";
import {
  type SourceIdentity,
  ContractError,
  assertPrivacySafe,
  digestOf,
  governedSourceIdentity,
  stableJson,
  writeNewFile,
} from "./contracts.ts";

const PACK_PATH = "tools/proofs/fixtures/consumer-outcome/leaf-first-task-decomposition-r1.json";
const FRONTIER_SEED_PATH = "tools/proofs/fixtures/session-completion-guard/grind-frontier-v1/grind-frontier-v1.seed.json";
const PACK_ID = "leaf-first-task-decomposition-r1";
const CLAIM_ID = "LFTD-001";
const MAXIMUM_CLAIM = "provider-free structural proof for the eleven reviewed LFTD-001 members, four explicit OpenSpec task controls, and four linked schema-v1 grind-frontier controls under the recorded seed and governed working-tree identity only; reviewed judgments remain fixture data and no configured behavior, universal decomposition quality, optimal task shape, untested population support, installed activation, or deployed-runtime behavior is established";
const MEMBER_ORDER = [
  "proactive-compound-decomposition",
  "recursive-independent-prerequisite",
  "same-leaf-local-failure",
  "parent-suppression",
  "integration-only-failure",
  "independent-siblings",
  "cohesive-ordinary-small",
  "grouped-mechanical-edits",
  "owner-protected-gates",
  "compaction-continuity",
  "checkpoint-composition",
] as const;
const FRONTIER_SCENARIOS: Partial<Record<typeof MEMBER_ORDER[number], string>> = {
  "checkpoint-composition": "leaf-first-checkpoint-composition",
  "independent-siblings": "leaf-first-independent-siblings",
  "owner-protected-gates": "leaf-first-owner-gate",
  "parent-suppression": "leaf-first-parent-suppression",
};
const OPEN_SPEC_CONTROL_ORDER = [
  "proactive-task-authoring",
  "hidden-prerequisite-correction",
  "same-leaf-no-planning-churn",
  "checked-parent-reopened",
] as const;
const GOVERNED_SOURCE_PATHS = [
  "global/AGENTS.md",
  "global/extensions/session-completion-guard/frontier.ts",
  "global/opencode.json.template",
  "tools/proofs/consumer-outcome-regression.ts",
  "tools/proofs/consumer-outcome/leaf-first-task-decomposition.ts",
  "tools/proofs/session-completion-guard-frontier.ts",
  PACK_PATH,
  FRONTIER_SEED_PATH,
] as const;
const SAFE_TOKEN = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;

type TaskClass = "grind" | "openspec" | "ordinary";
type Disposition = "compose-checkpoint" | "decompose" | "direct" | "parent-local" | "park-gated" | "preserve";

type LeafObservation = {
  action: Disposition;
  blockedParentRef: string | null;
  checkpointRef: string | null;
  compactionFields: string[];
  dependencyRefs: string[];
  events: string[];
  evidenceRefs: string[];
  gateRefs: string[];
  leafRefs: string[];
  ownerQuestionCount: number;
  parentOracleRef: string | null;
  parkedDecisionRefs: string[];
  runnableRefs: string[];
  suppressionIdentity: string | null;
};

type LeafScenario = {
  expectedObservation: LeafObservation;
  frontierScenarioId: string | null;
  id: typeof MEMBER_ORDER[number];
  redControls: Array<{
    expectedFailures: string[];
    id: string;
    observation: LeafObservation;
  }>;
  reviewedJudgment: {
    disposition: Disposition;
    reason: string;
  };
  taskClass: TaskClass;
};

type LeafLimits = {
  maxCompactionFields: number;
  maxEventsPerObservation: number;
  maxRedControlsPerScenario: number;
  maxRefsPerField: number;
  maxScenarios: number;
};

type OpenSpecTaskObservation = {
  changedPaths: string[];
  dependencyRefs: string[];
  events: string[];
  evidenceRefs: string[];
  historyAppendCount: number;
  parentTaskRef: string | null;
  parentTaskState: "absent" | "checked" | "open";
  proposalChanged: boolean;
  scopeChanged: boolean;
  taskRefs: string[];
};

type OpenSpecTaskControl = {
  expectedObservation: OpenSpecTaskObservation;
  id: typeof OPEN_SPEC_CONTROL_ORDER[number];
  redControls: Array<{
    expectedFailures: string[];
    id: string;
    observation: OpenSpecTaskObservation;
  }>;
};

export type LeafFirstPack = {
  claimId: typeof CLAIM_ID;
  governedSourcePaths: string[];
  id: typeof PACK_ID;
  limits: LeafLimits;
  maximumClaim: typeof MAXIMUM_CLAIM;
  openSpecControls: OpenSpecTaskControl[];
  scenarios: LeafScenario[];
  schemaVersion: 1;
};

type EvaluationRow = {
  controlId: string | null;
  expected: "fail" | "pass";
  failures: string[];
  kind: "green" | "red";
  observed: "failed" | "passed";
  oracleMatched: boolean;
  scenarioId: string;
};

export type LeafFirstEvaluation = {
  evaluationDigest: string;
  frontierRows: Array<{
    failures: string[];
    frontierScenarioId: string;
    scenarioId: string;
    status: "failed" | "passed";
  }>;
  liveCalls: 0;
  maximumClaim: typeof MAXIMUM_CLAIM;
  modelCalls: 0;
  packId: typeof PACK_ID;
  providerCalls: 0;
  rows: EvaluationRow[];
  schemaVersion: 1;
  status: "failed" | "passed";
};

export type LeafFirstBundle = {
  bundleDigest: string;
  candidateId: string;
  cleanup: {
    persistentTemporaryFiles: 0;
    processesRemaining: 0;
    sessionsRemaining: 0;
    status: "complete";
    terminal: true;
  };
  effects: {
    evidenceWrites: 2;
    modelCalls: 0;
    networkCalls: 0;
    processCalls: 0;
    providerCalls: 0;
    remoteEffects: 0;
    sourceWrites: 0;
  };
  evaluation: LeafFirstEvaluation;
  pack: LeafFirstPack;
  packDigest: string;
  schemaVersion: 1;
  sourceIdentity: SourceIdentity;
};

const PACK_KEYS = ["claimId", "governedSourcePaths", "id", "limits", "maximumClaim", "openSpecControls", "scenarios", "schemaVersion"] as const;
const LIMIT_KEYS = ["maxCompactionFields", "maxEventsPerObservation", "maxRedControlsPerScenario", "maxRefsPerField", "maxScenarios"] as const;
const SCENARIO_KEYS = ["expectedObservation", "frontierScenarioId", "id", "redControls", "reviewedJudgment", "taskClass"] as const;
const JUDGMENT_KEYS = ["disposition", "reason"] as const;
const OBSERVATION_KEYS = ["action", "blockedParentRef", "checkpointRef", "compactionFields", "dependencyRefs", "events", "evidenceRefs", "gateRefs", "leafRefs", "ownerQuestionCount", "parentOracleRef", "parkedDecisionRefs", "runnableRefs", "suppressionIdentity"] as const;
const RED_CONTROL_KEYS = ["expectedFailures", "id", "observation"] as const;
const OPEN_SPEC_CONTROL_KEYS = ["expectedObservation", "id", "redControls"] as const;
const OPEN_SPEC_OBSERVATION_KEYS = ["changedPaths", "dependencyRefs", "events", "evidenceRefs", "historyAppendCount", "parentTaskRef", "parentTaskState", "proposalChanged", "scopeChanged", "taskRefs"] as const;
const BUNDLE_KEYS = ["bundleDigest", "candidateId", "cleanup", "effects", "evaluation", "pack", "packDigest", "schemaVersion", "sourceIdentity"] as const;

function error(field: string, message: string, cause?: unknown): ContractError {
  const result = new ContractError(field, message);
  if (cause != null) (result as ContractError & { cause?: unknown }).cause = cause;
  return result;
}

function record(value: unknown, field: string, keys?: readonly string[]): Record<string, unknown> {
  if (value == null || typeof value !== "object" || Array.isArray(value)) throw error(field, `${field} must be an object`);
  const result = value as Record<string, unknown>;
  if (keys != null) {
    const actual = Object.keys(result).sort((left, right) => left.localeCompare(right));
    const expected = [...keys].sort((left, right) => left.localeCompare(right));
    if (actual.length !== expected.length || actual.some((key, index) => key !== expected[index])) {
      throw error(field, `${field} must contain exactly: ${expected.join(", ")}`);
    }
  }
  return result;
}

function token(value: unknown, field: string): string {
  if (typeof value !== "string" || !SAFE_TOKEN.test(value)) throw error(field, `${field} must be a safe non-empty token`);
  return value;
}

function boundedText(value: unknown, field: string): string {
  if (typeof value !== "string" || value.length === 0 || value.length > 512 || value.includes("\0") || value.includes("\n")) {
    throw error(field, `${field} must be bounded single-line text`);
  }
  return value;
}

function integer(value: unknown, field: string, minimum: number, maximum: number): number {
  if (!Number.isSafeInteger(value) || (value as number) < minimum || (value as number) > maximum) {
    throw error(field, `${field} must be an integer in [${minimum}, ${maximum}]`);
  }
  return value as number;
}

function boolean(value: unknown, field: string): boolean {
  if (typeof value !== "boolean") throw error(field, `${field} must be boolean`);
  return value;
}

function tokenArray(value: unknown, field: string, maximum: number): string[] {
  if (!Array.isArray(value) || value.length > maximum) throw error(field, `${field} must contain at most ${maximum} tokens`);
  const result = value.map((item, index) => token(item, `${field}[${index}]`));
  if (new Set(result).size !== result.length) throw error(field, `${field} must contain unique tokens`);
  return result;
}

function textArray(value: unknown, field: string, maximum: number): string[] {
  if (!Array.isArray(value) || value.length > maximum) throw error(field, `${field} must contain at most ${maximum} values`);
  const result = value.map((item, index) => boundedText(item, `${field}[${index}]`));
  if (new Set(result).size !== result.length) throw error(field, `${field} must contain unique values`);
  return result;
}

function pathArray(value: unknown, field: string): string[] {
  if (!Array.isArray(value) || value.length !== GOVERNED_SOURCE_PATHS.length) throw error(field, `${field} population is incomplete`);
  const result = value.map((item, index) => boundedText(item, `${field}[${index}]`));
  for (const sourcePath of result) {
    if (path.isAbsolute(sourcePath) || sourcePath.split(/[\\/]/).includes("..")) throw error(field, `${field} must contain repository-relative paths`);
  }
  return result;
}

function disposition(value: unknown, field: string): Disposition {
  if (value !== "compose-checkpoint" && value !== "decompose" && value !== "direct" && value !== "parent-local" && value !== "park-gated" && value !== "preserve") {
    throw error(field, `${field} has an invalid reviewed disposition`);
  }
  return value;
}

function nullableToken(value: unknown, field: string): string | null {
  return value === null ? null : token(value, field);
}

function parseObservation(value: unknown, field: string, limits: LeafLimits): LeafObservation {
  const source = record(value, field, OBSERVATION_KEYS);
  return {
    action: disposition(source.action, `${field}.action`),
    blockedParentRef: nullableToken(source.blockedParentRef, `${field}.blockedParentRef`),
    checkpointRef: nullableToken(source.checkpointRef, `${field}.checkpointRef`),
    compactionFields: textArray(source.compactionFields, `${field}.compactionFields`, limits.maxCompactionFields),
    dependencyRefs: tokenArray(source.dependencyRefs, `${field}.dependencyRefs`, limits.maxRefsPerField),
    events: tokenArray(source.events, `${field}.events`, limits.maxEventsPerObservation),
    evidenceRefs: tokenArray(source.evidenceRefs, `${field}.evidenceRefs`, limits.maxRefsPerField),
    gateRefs: tokenArray(source.gateRefs, `${field}.gateRefs`, limits.maxRefsPerField),
    leafRefs: tokenArray(source.leafRefs, `${field}.leafRefs`, limits.maxRefsPerField),
    ownerQuestionCount: integer(source.ownerQuestionCount, `${field}.ownerQuestionCount`, 0, 1),
    parentOracleRef: nullableToken(source.parentOracleRef, `${field}.parentOracleRef`),
    parkedDecisionRefs: tokenArray(source.parkedDecisionRefs, `${field}.parkedDecisionRefs`, limits.maxRefsPerField),
    runnableRefs: tokenArray(source.runnableRefs, `${field}.runnableRefs`, limits.maxRefsPerField),
    suppressionIdentity: nullableToken(source.suppressionIdentity, `${field}.suppressionIdentity`),
  };
}

function observationFailures(observed: LeafObservation, expected: LeafObservation): string[] {
  const failures: string[] = [];
  if (observed.action !== expected.action) failures.push("action");
  if (observed.blockedParentRef !== expected.blockedParentRef) failures.push("blocked-parent");
  if (observed.checkpointRef !== expected.checkpointRef) failures.push("checkpoint-ref");
  if (observed.compactionFields.join("\n") !== expected.compactionFields.join("\n")) failures.push("compaction-fields");
  if (observed.dependencyRefs.join("\n") !== expected.dependencyRefs.join("\n")) failures.push("dependency-refs");
  if (observed.events.join("\n") !== expected.events.join("\n")) failures.push("event-order");
  if (observed.evidenceRefs.join("\n") !== expected.evidenceRefs.join("\n")) failures.push("evidence-refs");
  if (observed.gateRefs.join("\n") !== expected.gateRefs.join("\n")) failures.push("gate-refs");
  if (observed.leafRefs.join("\n") !== expected.leafRefs.join("\n")) failures.push("leaf-refs");
  if (observed.ownerQuestionCount !== expected.ownerQuestionCount) failures.push("owner-question-count");
  if (observed.parentOracleRef !== expected.parentOracleRef) failures.push("parent-oracle");
  if (observed.parkedDecisionRefs.join("\n") !== expected.parkedDecisionRefs.join("\n")) failures.push("parked-decision-refs");
  if (observed.runnableRefs.join("\n") !== expected.runnableRefs.join("\n")) failures.push("runnable-refs");
  if (observed.suppressionIdentity !== expected.suppressionIdentity) failures.push("suppression-identity");
  return failures;
}

function parseOpenSpecObservation(value: unknown, field: string, limits: LeafLimits): OpenSpecTaskObservation {
  const source = record(value, field, OPEN_SPEC_OBSERVATION_KEYS);
  if (source.parentTaskState !== "absent" && source.parentTaskState !== "checked" && source.parentTaskState !== "open") {
    throw error(`${field}.parentTaskState`, `${field}.parentTaskState is invalid`);
  }
  return {
    changedPaths: textArray(source.changedPaths, `${field}.changedPaths`, limits.maxRefsPerField),
    dependencyRefs: tokenArray(source.dependencyRefs, `${field}.dependencyRefs`, limits.maxRefsPerField),
    events: tokenArray(source.events, `${field}.events`, limits.maxEventsPerObservation),
    evidenceRefs: tokenArray(source.evidenceRefs, `${field}.evidenceRefs`, limits.maxRefsPerField),
    historyAppendCount: integer(source.historyAppendCount, `${field}.historyAppendCount`, 0, 2),
    parentTaskRef: nullableToken(source.parentTaskRef, `${field}.parentTaskRef`),
    parentTaskState: source.parentTaskState,
    proposalChanged: boolean(source.proposalChanged, `${field}.proposalChanged`),
    scopeChanged: boolean(source.scopeChanged, `${field}.scopeChanged`),
    taskRefs: tokenArray(source.taskRefs, `${field}.taskRefs`, limits.maxRefsPerField),
  };
}

function openSpecObservationFailures(observed: OpenSpecTaskObservation, expected: OpenSpecTaskObservation): string[] {
  const failures: string[] = [];
  if (observed.changedPaths.join("\n") !== expected.changedPaths.join("\n")) failures.push("changed-paths");
  if (observed.dependencyRefs.join("\n") !== expected.dependencyRefs.join("\n")) failures.push("dependency-refs");
  if (observed.events.join("\n") !== expected.events.join("\n")) failures.push("event-order");
  if (observed.evidenceRefs.join("\n") !== expected.evidenceRefs.join("\n")) failures.push("evidence-refs");
  if (observed.historyAppendCount !== expected.historyAppendCount) failures.push("history-append-count");
  if (observed.parentTaskRef !== expected.parentTaskRef) failures.push("parent-task-ref");
  if (observed.parentTaskState !== expected.parentTaskState) failures.push("parent-task-state");
  if (observed.proposalChanged !== expected.proposalChanged) failures.push("proposal-change");
  if (observed.scopeChanged !== expected.scopeChanged) failures.push("scope-change");
  if (observed.taskRefs.join("\n") !== expected.taskRefs.join("\n")) failures.push("task-refs");
  return failures;
}

function parseLimits(value: unknown): LeafLimits {
  const source = record(value, "leafFirstPack.limits", LIMIT_KEYS);
  const limits = {
    maxCompactionFields: integer(source.maxCompactionFields, "leafFirstPack.limits.maxCompactionFields", 1, 16),
    maxEventsPerObservation: integer(source.maxEventsPerObservation, "leafFirstPack.limits.maxEventsPerObservation", 1, 32),
    maxRedControlsPerScenario: integer(source.maxRedControlsPerScenario, "leafFirstPack.limits.maxRedControlsPerScenario", 1, 8),
    maxRefsPerField: integer(source.maxRefsPerField, "leafFirstPack.limits.maxRefsPerField", 1, 16),
    maxScenarios: integer(source.maxScenarios, "leafFirstPack.limits.maxScenarios", 1, 32),
  };
  if (limits.maxScenarios !== MEMBER_ORDER.length) throw error("leafFirstPack.limits.maxScenarios", "scenario limit must equal the reviewed population");
  return limits;
}

function parseScenario(value: unknown, index: number, limits: LeafLimits): LeafScenario {
  const field = `leafFirstPack.scenarios[${index}]`;
  const source = record(value, field, SCENARIO_KEYS);
  const id = token(source.id, `${field}.id`);
  if (id !== MEMBER_ORDER[index]) throw error(`${field}.id`, "scenario order or identity drifted");
  if (source.taskClass !== "ordinary" && source.taskClass !== "openspec" && source.taskClass !== "grind") throw error(`${field}.taskClass`, "invalid task class");
  const judgment = record(source.reviewedJudgment, `${field}.reviewedJudgment`, JUDGMENT_KEYS);
  const expectedObservation = parseObservation(source.expectedObservation, `${field}.expectedObservation`, limits);
  const frontierScenarioId = nullableToken(source.frontierScenarioId, `${field}.frontierScenarioId`);
  if (frontierScenarioId !== (FRONTIER_SCENARIOS[id as typeof MEMBER_ORDER[number]] ?? null)) {
    throw error(`${field}.frontierScenarioId`, "frontier scenario identity drifted");
  }
  if (!Array.isArray(source.redControls) || source.redControls.length === 0 || source.redControls.length > limits.maxRedControlsPerScenario) {
    throw error(`${field}.redControls`, "red controls are empty or over limit");
  }
  const redControls = source.redControls.map((value, controlIndex) => {
    const controlField = `${field}.redControls[${controlIndex}]`;
    const control = record(value, controlField, RED_CONTROL_KEYS);
    const observation = parseObservation(control.observation, `${controlField}.observation`, limits);
    const expectedFailures = tokenArray(control.expectedFailures, `${controlField}.expectedFailures`, OBSERVATION_KEYS.length);
    if (expectedFailures.length === 0 || expectedFailures.join("\n") !== observationFailures(observation, expectedObservation).join("\n")) {
      throw error(`${controlField}.expectedFailures`, "red-control failures do not match the explicit observation difference");
    }
    return { expectedFailures, id: token(control.id, `${controlField}.id`), observation };
  });
  if (new Set(redControls.map((control) => control.id)).size !== redControls.length) throw error(`${field}.redControls`, "red-control ids must be unique");
  const reviewedDisposition = disposition(judgment.disposition, `${field}.reviewedJudgment.disposition`);
  if (reviewedDisposition !== expectedObservation.action) throw error(`${field}.reviewedJudgment.disposition`, "reviewed disposition must match the expected observation action");
  return {
    expectedObservation,
    frontierScenarioId,
    id: id as typeof MEMBER_ORDER[number],
    redControls,
    reviewedJudgment: { disposition: reviewedDisposition, reason: boundedText(judgment.reason, `${field}.reviewedJudgment.reason`) },
    taskClass: source.taskClass,
  };
}

function parseOpenSpecControl(value: unknown, index: number, limits: LeafLimits): OpenSpecTaskControl {
  const field = `leafFirstPack.openSpecControls[${index}]`;
  const source = record(value, field, OPEN_SPEC_CONTROL_KEYS);
  const id = token(source.id, `${field}.id`);
  if (id !== OPEN_SPEC_CONTROL_ORDER[index]) throw error(`${field}.id`, "OpenSpec control order or identity drifted");
  const expectedObservation = parseOpenSpecObservation(source.expectedObservation, `${field}.expectedObservation`, limits);
  if (!Array.isArray(source.redControls) || source.redControls.length === 0 || source.redControls.length > limits.maxRedControlsPerScenario) {
    throw error(`${field}.redControls`, "OpenSpec red controls are empty or over limit");
  }
  const redControls = source.redControls.map((value, controlIndex) => {
    const controlField = `${field}.redControls[${controlIndex}]`;
    const control = record(value, controlField, RED_CONTROL_KEYS);
    const observation = parseOpenSpecObservation(control.observation, `${controlField}.observation`, limits);
    const expectedFailures = tokenArray(control.expectedFailures, `${controlField}.expectedFailures`, OPEN_SPEC_OBSERVATION_KEYS.length);
    if (expectedFailures.length === 0 || expectedFailures.join("\n") !== openSpecObservationFailures(observation, expectedObservation).join("\n")) {
      throw error(`${controlField}.expectedFailures`, "OpenSpec red-control failures do not match the explicit observation difference");
    }
    return { expectedFailures, id: token(control.id, `${controlField}.id`), observation };
  });
  return { expectedObservation, id: id as typeof OPEN_SPEC_CONTROL_ORDER[number], redControls };
}

export function parseLeafFirstPack(value: unknown): LeafFirstPack {
  const source = record(value, "leafFirstPack", PACK_KEYS);
  if (source.schemaVersion !== 1 || source.id !== PACK_ID || source.claimId !== CLAIM_ID || source.maximumClaim !== MAXIMUM_CLAIM) {
    throw error("leafFirstPack", "leaf-first pack identity drifted");
  }
  const governedSourcePaths = pathArray(source.governedSourcePaths, "leafFirstPack.governedSourcePaths");
  if (governedSourcePaths.join("\n") !== GOVERNED_SOURCE_PATHS.join("\n")) throw error("leafFirstPack.governedSourcePaths", "governed source order drifted");
  const limits = parseLimits(source.limits);
  if (!Array.isArray(source.openSpecControls) || source.openSpecControls.length !== OPEN_SPEC_CONTROL_ORDER.length) {
    throw error("leafFirstPack.openSpecControls", "OpenSpec control population is incomplete");
  }
  const openSpecControls = source.openSpecControls.map((control, index) => parseOpenSpecControl(control, index, limits));
  if (!Array.isArray(source.scenarios) || source.scenarios.length !== limits.maxScenarios) throw error("leafFirstPack.scenarios", "scenario population is incomplete");
  const scenarios = source.scenarios.map((scenario, index) => parseScenario(scenario, index, limits));
  return { claimId: CLAIM_ID, governedSourcePaths, id: PACK_ID, limits, maximumClaim: MAXIMUM_CLAIM, openSpecControls, scenarios, schemaVersion: 1 };
}

export function loadLeafFirstPack(repoRoot: string): { pack: LeafFirstPack; packDigest: string; seedByteDigest: string } {
  let source: string;
  try {
    source = fs.readFileSync(path.join(repoRoot, PACK_PATH), "utf8");
  } catch (cause) {
    throw error("leafFirstPack", "leaf-first seed is unreadable", cause);
  }
  assertPrivacySafe(source, "leaf-first seed");
  let parsed: unknown;
  try {
    parsed = JSON.parse(source);
  } catch (cause) {
    throw error("leafFirstPack", "leaf-first seed is not valid JSON", cause);
  }
  const pack = parseLeafFirstPack(parsed);
  return { pack, packDigest: digestOf(pack), seedByteDigest: digestOf(source) };
}

function loadFrontierScenarios(repoRoot: string): Map<string, Record<string, unknown>> {
  let source: string;
  try {
    source = fs.readFileSync(path.join(repoRoot, FRONTIER_SEED_PATH), "utf8");
  } catch (cause) {
    throw error("frontierSeed", "linked frontier seed is unreadable", cause);
  }
  assertPrivacySafe(source, "linked frontier seed");
  const parsed = record(JSON.parse(source), "frontierSeed");
  if (parsed.schemaVersion !== 1 || parsed.claimId !== "GRIND-TSB-001" || !Array.isArray(parsed.scenarios)) throw error("frontierSeed", "linked frontier seed identity drifted");
  const scenarios = parsed.scenarios.map((value, index) => record(value, `frontierSeed.scenarios[${index}]`));
  const ids = scenarios.map((scenario, index) => token(scenario.id, `frontierSeed.scenarios[${index}].id`));
  if (new Set(ids).size !== ids.length || ids.join("\n") !== [...ids].sort((left, right) => left.localeCompare(right)).join("\n")) {
    throw error("frontierSeed.scenarios", "linked frontier scenario order or identity drifted");
  }
  return new Map(scenarios.map((scenario) => [scenario.id as string, scenario]));
}

function frontierFailures(scenario: LeafScenario, frontierScenarios: Map<string, Record<string, unknown>>): string[] {
  if (scenario.frontierScenarioId == null) return [];
  const linked = frontierScenarios.get(scenario.frontierScenarioId);
  if (linked == null) return ["frontier-scenario"];
  const context = record(linked.context, `${scenario.frontierScenarioId}.context`);
  const expected = record(linked.expected, `${scenario.frontierScenarioId}.expected`);
  const currentGeneration = integer(context.currentGeneration, `${scenario.frontierScenarioId}.context.currentGeneration`, 0, Number.MAX_SAFE_INTEGER);
  const assessment = materializeWorkFrontier(linked.input, {
    basisHumanRef: token(context.latestHumanRef, `${scenario.frontierScenarioId}.context.latestHumanRef`),
    currentGeneration,
    taskStateDigest: boundedText(context.taskStateDigest, `${scenario.frontierScenarioId}.context.taskStateDigest`),
  });
  const actual = {
    frontierState: assessment.frontierState,
    openGateRefs: assessment.openGateRefs,
    parkedDecisionRefs: assessment.parkedDecisionRefs,
    runnableItemRefs: assessment.runnableItemRefs,
    serverGeneration: assessment.frontier.frontierGeneration,
  };
  const reviewed = {
    frontierState: expected.frontierState,
    openGateRefs: expected.openGateRefs,
    parkedDecisionRefs: expected.parkedDecisionRefs,
    runnableItemRefs: expected.runnableItemRefs,
    serverGeneration: expected.serverGeneration,
  };
  const failures: string[] = [];
  if (stableJson(actual) !== stableJson(reviewed) || expected.status !== "accepted" || expected.reason !== "ok") failures.push("frontier-fixture");
  if (assessment.runnableItemRefs.join("\n") !== scenario.expectedObservation.runnableRefs.join("\n")) failures.push("frontier-runnable-refs");
  if (assessment.openGateRefs.join("\n") !== scenario.expectedObservation.gateRefs.join("\n")) failures.push("frontier-gate-refs");
  if (assessment.parkedDecisionRefs.join("\n") !== scenario.expectedObservation.parkedDecisionRefs.join("\n")) failures.push("frontier-parked-decision-refs");
  if (scenario.expectedObservation.blockedParentRef != null) {
    const input = record(linked.input, `${scenario.frontierScenarioId}.input`);
    const items = Array.isArray(input.items) ? input.items.map((item, index) => record(item, `${scenario.frontierScenarioId}.input.items[${index}]`)) : [];
    const parent = items.find((item) => item.id === scenario.expectedObservation.blockedParentRef);
    if (parent == null || assessment.runnableItemRefs.includes(scenario.expectedObservation.blockedParentRef)) failures.push("frontier-parent-suppression");
    else if (!Array.isArray(parent.dependsOn) || parent.dependsOn.join("\n") !== scenario.expectedObservation.dependencyRefs.join("\n")) failures.push("frontier-dependency-refs");
  }
  return failures;
}

export function evaluateLeafFirstPack(pack: LeafFirstPack, repoRoot: string): LeafFirstEvaluation {
  const frontierScenarios = loadFrontierScenarios(repoRoot);
  const rows: EvaluationRow[] = [];
  const frontierRows: LeafFirstEvaluation["frontierRows"] = [];
  for (const scenario of pack.scenarios) {
    const linkedFailures = frontierFailures(scenario, frontierScenarios);
    rows.push({
      controlId: null,
      expected: "pass",
      failures: linkedFailures,
      kind: "green",
      observed: linkedFailures.length === 0 ? "passed" : "failed",
      oracleMatched: linkedFailures.length === 0,
      scenarioId: scenario.id,
    });
    if (scenario.frontierScenarioId != null) {
      frontierRows.push({
        failures: linkedFailures,
        frontierScenarioId: scenario.frontierScenarioId,
        scenarioId: scenario.id,
        status: linkedFailures.length === 0 ? "passed" : "failed",
      });
    }
    for (const control of scenario.redControls) {
      const failures = observationFailures(control.observation, scenario.expectedObservation);
      rows.push({
        controlId: control.id,
        expected: "fail",
        failures,
        kind: "red",
        observed: failures.length === 0 ? "passed" : "failed",
        oracleMatched: failures.join("\n") === control.expectedFailures.join("\n"),
        scenarioId: scenario.id,
      });
    }
  }
  for (const control of pack.openSpecControls) {
    rows.push({
      controlId: null,
      expected: "pass",
      failures: [],
      kind: "green",
      observed: "passed",
      oracleMatched: true,
      scenarioId: control.id,
    });
    for (const red of control.redControls) {
      const failures = openSpecObservationFailures(red.observation, control.expectedObservation);
      rows.push({
        controlId: red.id,
        expected: "fail",
        failures,
        kind: "red",
        observed: failures.length === 0 ? "passed" : "failed",
        oracleMatched: failures.join("\n") === red.expectedFailures.join("\n"),
        scenarioId: control.id,
      });
    }
  }
  const status = rows.every((row) => row.oracleMatched && (row.expected === "pass" ? row.observed === "passed" : row.observed === "failed")) ? "passed" : "failed";
  const evaluation: LeafFirstEvaluation = {
    evaluationDigest: "",
    frontierRows,
    liveCalls: 0,
    maximumClaim: MAXIMUM_CLAIM,
    modelCalls: 0,
    packId: PACK_ID,
    providerCalls: 0,
    rows,
    schemaVersion: 1,
    status,
  };
  evaluation.evaluationDigest = digestOf(evaluation);
  assertPrivacySafe(stableJson(evaluation), "leaf-first evaluation");
  return evaluation;
}

function sealBundle(value: Omit<LeafFirstBundle, "bundleDigest">): LeafFirstBundle {
  const bundle: LeafFirstBundle = { ...value, bundleDigest: "" };
  assertPrivacySafe(stableJson(bundle), "leaf-first bundle");
  bundle.bundleDigest = digestOf(bundle);
  return bundle;
}

function parseBundle(value: unknown, repoRoot: string): LeafFirstBundle {
  const source = record(value, "leafFirstBundle", BUNDLE_KEYS);
  if (source.schemaVersion !== 1) throw error("leafFirstBundle.schemaVersion", "unsupported leaf-first bundle schema");
  const pack = parseLeafFirstPack(source.pack);
  const packDigest = digestOf(pack);
  if (source.packDigest !== packDigest) throw error("leafFirstBundle.packDigest", "leaf-first pack digest mismatch");
  const expectedEvaluation = evaluateLeafFirstPack(pack, repoRoot);
  if (stableJson(source.evaluation) !== stableJson(expectedEvaluation)) throw error("leafFirstBundle.evaluation", "leaf-first evaluation mismatch");
  const bundle = source as unknown as LeafFirstBundle;
  if (!SAFE_TOKEN.test(bundle.candidateId)) throw error("leafFirstBundle.candidateId", "invalid candidate id");
  if (bundle.effects?.evidenceWrites !== 2 || bundle.effects.modelCalls !== 0 || bundle.effects.networkCalls !== 0 || bundle.effects.processCalls !== 0 || bundle.effects.providerCalls !== 0 || bundle.effects.remoteEffects !== 0 || bundle.effects.sourceWrites !== 0) {
    throw error("leafFirstBundle.effects", "leaf-first effects mismatch");
  }
  if (bundle.cleanup?.status !== "complete" || bundle.cleanup.terminal !== true || bundle.cleanup.persistentTemporaryFiles !== 0 || bundle.cleanup.processesRemaining !== 0 || bundle.cleanup.sessionsRemaining !== 0) {
    throw error("leafFirstBundle.cleanup", "leaf-first cleanup mismatch");
  }
  const currentSource = governedSourceIdentity(repoRoot, "working-tree", pack.governedSourcePaths);
  if (stableJson(bundle.sourceIdentity) !== stableJson(currentSource)) throw error("leafFirstBundle.sourceIdentity", "leaf-first governed source identity mismatch");
  const unsealed = structuredClone(bundle);
  unsealed.bundleDigest = "";
  if (bundle.bundleDigest !== digestOf(unsealed)) throw error("leafFirstBundle.bundleDigest", "leaf-first bundle digest mismatch");
  assertPrivacySafe(stableJson(bundle), "leaf-first bundle");
  return bundle;
}

export function leafFirstPreflight(repoRoot: string, gitRef: string): Record<string, unknown> {
  if (gitRef !== "working-tree") throw error("sourceRef", "leaf-first preflight requires --source-ref working-tree");
  const loaded = loadLeafFirstPack(repoRoot);
  const source = governedSourceIdentity(repoRoot, gitRef, loaded.pack.governedSourcePaths);
  const evaluation = evaluateLeafFirstPack(loaded.pack, repoRoot);
  return {
    frontierScenarioCount: evaluation.frontierRows.length,
    governedDigest: source.governedDigest,
    governedSourcePaths: loaded.pack.governedSourcePaths,
    maximumClaim: MAXIMUM_CLAIM,
    memberCount: loaded.pack.scenarios.length,
    mode: "preflight",
    modelCalls: 0,
    openSpecControlCount: loaded.pack.openSpecControls.length,
    pack: "leaf-first-task-decomposition",
    packId: PACK_ID,
    processCalls: 0,
    providerCalls: 0,
    scenarioDigest: loaded.packDigest,
    scenarioIds: loaded.pack.scenarios.map((scenario) => scenario.id),
    seedIdentity: { digest: loaded.seedByteDigest, path: PACK_PATH },
    status: evaluation.status === "passed" ? "ready" : "failed",
  };
}

export function materializeLeafFirstBundle(options: {
  candidateId: string;
  evidenceRoot: string;
  gitRef: string;
  repoRoot: string;
}): { bundle: LeafFirstBundle; evaluation: LeafFirstEvaluation } {
  if (options.gitRef !== "working-tree") throw error("sourceRef", "leaf-first materialization requires --source-ref working-tree");
  if (!SAFE_TOKEN.test(options.candidateId)) throw error("candidateId", "candidate id must be a safe token");
  if (!path.isAbsolute(options.evidenceRoot)) throw error("evidenceRoot", "leaf-first evidence root must be absolute");
  if (fs.existsSync(options.evidenceRoot)) throw error("evidenceRoot", "leaf-first evidence root must be create-new");
  const loaded = loadLeafFirstPack(options.repoRoot);
  const sourceIdentity = governedSourceIdentity(options.repoRoot, options.gitRef, loaded.pack.governedSourcePaths);
  const evaluation = evaluateLeafFirstPack(loaded.pack, options.repoRoot);
  const bundle = sealBundle({
    candidateId: options.candidateId,
    cleanup: { persistentTemporaryFiles: 0, processesRemaining: 0, sessionsRemaining: 0, status: "complete", terminal: true },
    effects: { evidenceWrites: 2, modelCalls: 0, networkCalls: 0, processCalls: 0, providerCalls: 0, remoteEffects: 0, sourceWrites: 0 },
    evaluation,
    pack: loaded.pack,
    packDigest: loaded.packDigest,
    schemaVersion: 1,
    sourceIdentity,
  });
  try {
    writeNewFile(path.join(options.evidenceRoot, "bundle.json"), stableJson(bundle));
    writeNewFile(path.join(options.evidenceRoot, "evaluation.json"), stableJson(evaluation));
  } catch (cause) {
    fs.rmSync(options.evidenceRoot, { force: true, recursive: true });
    throw error("evidenceRoot", "leaf-first materialization failed", cause);
  }
  return { bundle, evaluation };
}

export function replayLeafFirstBundle(repoRoot: string, bundlePath: string): { bundle: LeafFirstBundle; evaluation: LeafFirstEvaluation } {
  let source: string;
  try {
    source = fs.readFileSync(bundlePath, "utf8");
  } catch (cause) {
    throw error("leafFirstBundle", "leaf-first bundle is unreadable", cause);
  }
  assertPrivacySafe(source, "leaf-first bundle");
  let parsed: unknown;
  try {
    parsed = JSON.parse(source);
  } catch (cause) {
    throw error("leafFirstBundle", "leaf-first bundle is not valid JSON", cause);
  }
  const bundle = parseBundle(parsed, repoRoot);
  return { bundle, evaluation: bundle.evaluation };
}
