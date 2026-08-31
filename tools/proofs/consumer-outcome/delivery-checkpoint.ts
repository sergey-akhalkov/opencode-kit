import fs from "node:fs";
import path from "node:path";

import { loadModelProfile } from "../../model-profile.ts";
import { installedOpenCodeIdentity } from "../lib/opencode-proof-client.ts";
import { captureConfiguredDiagnostic } from "./capture.ts";
import {
  type FrictionField,
  type RegressionManifest,
  type ScenarioRecord,
  type SourceIdentity,
  ContractError,
  assertPrivacySafe,
  digestOf,
  governedSourceIdentity,
  stableJson,
  verifyFixtureSeed,
  writeNewFile,
} from "./contracts.ts";

const PACK_PATH = "tools/proofs/fixtures/consumer-outcome/delivery-checkpoint-r1.json";
const CONFIGURED_PACK_PATH = "tools/proofs/fixtures/consumer-outcome/delivery-checkpoint-configured-r1.json";
const PACK_ID = "outcome-preserving-delivery-checkpoint-r1";
const CLAIM_ID = "OPDC-001";
const MAXIMUM_CLAIM = "provider-free structural proof for the twelve reviewed OPDC-001 scenarios and four OpenSpec/compaction continuity controls under the recorded seed and governed working-tree identity only; reviewed judgments remain fixture data and no configured behavior, semantic trigger quality, optimization benefit, cross-project reliability, or population-member support is established";
const CONFIGURED_MAXIMUM_CLAIM = "configured loaded-main observations for one reviewed ordinary checkpoint path and the twelve reviewed OPDC-001 members across two unrelated disposable ordinary/OpenSpec fixture repositories under the exact recorded candidate, model, profile, source, fixture, and environment only; each selected scenario is bounded to one request and supports only its exact member rows, not universal trigger quality, optimization benefit, untested cross-project reliability, active user-process activation, or deployed-runtime behavior";
const CONFIGURED_SCENARIO_IDS = [
  "configured-different-late-failures",
  "configured-population-ordinary",
  "configured-population-openspec-grind",
] as const;
type DeliveryCheckpointConfiguredScenarioId = typeof CONFIGURED_SCENARIO_IDS[number];
const CONFIGURED_SCENARIO_CONTRACTS: Record<DeliveryCheckpointConfiguredScenarioId, {
  fixturePath: string;
  resultKind: "population" | "single";
  shape: "openspec-backed" | "ordinary-small";
}> = {
  "configured-different-late-failures": {
    fixturePath: "tools/proofs/fixtures/consumer-outcome/delivery-checkpoint-v1",
    resultKind: "single",
    shape: "ordinary-small",
  },
  "configured-population-ordinary": {
    fixturePath: "tools/proofs/fixtures/consumer-outcome/delivery-checkpoint-population-ordinary-v1",
    resultKind: "population",
    shape: "ordinary-small",
  },
  "configured-population-openspec-grind": {
    fixturePath: "tools/proofs/fixtures/consumer-outcome/delivery-checkpoint-population-openspec-v1",
    resultKind: "population",
    shape: "openspec-backed",
  },
};
const CONFIGURED_EVENTS = [
  "trigger-detected:different-failures-same-costly-late-boundary",
  "checkpoint-recorded:late-validation-manifest-cache-r1",
  "route-selected:earlier-manifest-cache-canary",
  "scope-oracle-population:unchanged",
  "costly-action-repeat-count:0",
  "protected-boundary:unchanged",
  "autonomous-continuation:canary",
  "duplicate-suppressed:unchanged-evidence",
  "cleanup-ready:proof-owned-fixture",
] as const;
const MEMBER_ORDER = [
  "similar-retry-stagnation",
  "different-defect-late-discovery",
  "coarse-invalidation-amplification",
  "failed-costly-repetition",
  "dominant-repeated-setup",
  "advancing-long-work",
  "single-cheap-failure",
  "irreducible-cost",
  "duplicate-suppression",
  "independent-sibling-work",
  "scope-proof-weakening",
  "compaction-continuity",
] as const;
const CONTINUITY_ORDER = [
  "shift-left-route-change",
  "irreducible-current-route",
  "population-reduction-owner-boundary",
  "compaction-due-checkpoint",
] as const;
const GOVERNED_SOURCE_PATHS = [
  "global/AGENTS.md",
  "global/agents/session-completion-arbiter.md",
  "global/extensions/session-completion-guard/frontier.ts",
  "global/opencode.json.template",
  "global/skills/openspec-apply-change/SKILL.md",
  "openspec/specs/library-instruction-artifacts/spec.md",
  "openspec/specs/library-spec-workflow-integrity/spec.md",
  "openspec/specs/session-completion-guard/spec.md",
  "tools/proofs/consumer-outcome-regression.ts",
  "tools/proofs/consumer-outcome/delivery-checkpoint.ts",
  "tools/proofs/session-completion-guard-frontier.ts",
  PACK_PATH,
] as const;
const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;

type TaskClass = "grind" | "openspec" | "ordinary";
type CheckpointDisposition = "checkpoint" | "continue" | "irreducible" | "owner-boundary" | "suppress-duplicate";
type ScopeAction = "parked-owner-boundary" | "preserved";

type CostMeasurement = {
  count: number;
  expectedTotal: number;
  id: string;
  unitCost: number;
};

type Anchors = {
  oracleRef: string;
  outcomeRef: string;
  populationRef: string;
};

type CheckpointObservation = {
  anchors: Anchors;
  checkpointCount: number;
  events: string[];
  nextBoundaryRef: string | null;
  ownerQuestionCount: number;
  scopeAction: ScopeAction;
};

type RedControl = {
  expectedFailures: string[];
  id: string;
  observation: CheckpointObservation;
};

type ContinuityCompactionBlock = {
  fields: string[];
  heading: "Delivery Checkpoint State";
};

type ContinuityObservation = {
  changedPaths: string[];
  compactionBlock: ContinuityCompactionBlock | null;
  events: string[];
  historyAppendCount: number;
  kaizenDependency: boolean;
  ownerBoundaryRef: string | null;
  ownerQuestionCount: number;
};

type ContinuityControl = {
  expectedObservation: ContinuityObservation;
  id: string;
  redControls: Array<{
    expectedFailures: string[];
    id: string;
    observation: ContinuityObservation;
  }>;
};

type DeliveryCheckpointScenario = {
  expectedObservation: CheckpointObservation;
  id: string;
  redControls: RedControl[];
  reviewedJudgment: {
    costMeasurements: CostMeasurement[];
    disposition: CheckpointDisposition;
    reason: string;
  };
  taskClass: TaskClass;
};

type DeliveryCheckpointLimits = {
  maxCostUnits: number;
  maxEventsPerObservation: number;
  maxMeasurementsPerScenario: number;
  maxRedControlsPerScenario: number;
  maxScenarios: number;
};

export type DeliveryCheckpointPack = {
  claimId: typeof CLAIM_ID;
  continuityControls: ContinuityControl[];
  governedSourcePaths: string[];
  id: typeof PACK_ID;
  limits: DeliveryCheckpointLimits;
  maximumClaim: typeof MAXIMUM_CLAIM;
  scenarios: DeliveryCheckpointScenario[];
  schemaVersion: 1;
};

type DeliveryCheckpointEvaluationRow = {
  controlId: string | null;
  expected: "fail" | "pass";
  failures: string[];
  kind: "green" | "red";
  observed: "failed" | "passed";
  oracleMatched: boolean;
  scenarioId: string;
};

export type DeliveryCheckpointEvaluation = {
  continuityRows: DeliveryCheckpointEvaluationRow[];
  costArithmetic: Array<{
    measurements: CostMeasurement[];
    scenarioId: string;
    totalCostUnits: number;
  }>;
  evaluationDigest: string;
  liveCalls: 0;
  maximumClaim: typeof MAXIMUM_CLAIM;
  modelCalls: 0;
  packId: typeof PACK_ID;
  providerCalls: 0;
  rows: DeliveryCheckpointEvaluationRow[];
  schemaVersion: 1;
  status: "failed" | "passed";
};

export type DeliveryCheckpointBundle = {
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
  evaluation: DeliveryCheckpointEvaluation;
  pack: DeliveryCheckpointPack;
  packDigest: string;
  schemaVersion: 1;
  sourceIdentity: SourceIdentity;
};

const PACK_KEYS = ["claimId", "continuityControls", "governedSourcePaths", "id", "limits", "maximumClaim", "scenarios", "schemaVersion"] as const;
const LIMIT_KEYS = ["maxCostUnits", "maxEventsPerObservation", "maxMeasurementsPerScenario", "maxRedControlsPerScenario", "maxScenarios"] as const;
const SCENARIO_KEYS = ["expectedObservation", "id", "redControls", "reviewedJudgment", "taskClass"] as const;
const JUDGMENT_KEYS = ["costMeasurements", "disposition", "reason"] as const;
const MEASUREMENT_KEYS = ["count", "expectedTotal", "id", "unitCost"] as const;
const OBSERVATION_KEYS = ["anchors", "checkpointCount", "events", "nextBoundaryRef", "ownerQuestionCount", "scopeAction"] as const;
const ANCHOR_KEYS = ["oracleRef", "outcomeRef", "populationRef"] as const;
const RED_CONTROL_KEYS = ["expectedFailures", "id", "observation"] as const;
const CONTINUITY_KEYS = ["expectedObservation", "id", "redControls"] as const;
const CONTINUITY_OBSERVATION_KEYS = ["changedPaths", "compactionBlock", "events", "historyAppendCount", "kaizenDependency", "ownerBoundaryRef", "ownerQuestionCount"] as const;
const COMPACTION_BLOCK_KEYS = ["fields", "heading"] as const;
const BUNDLE_KEYS = ["bundleDigest", "candidateId", "cleanup", "effects", "evaluation", "pack", "packDigest", "schemaVersion", "sourceIdentity"] as const;

function error(field: string, message: string, cause?: unknown): ContractError {
  const result = new ContractError(field, message);
  if (cause != null) (result as ContractError & { cause?: unknown }).cause = cause;
  return result;
}

function record(value: unknown, field: string, keys: readonly string[]): Record<string, unknown> {
  if (value == null || typeof value !== "object" || Array.isArray(value)) throw error(field, `${field} must be an object`);
  const result = value as Record<string, unknown>;
  const actual = Object.keys(result).sort((left, right) => left.localeCompare(right));
  const expected = [...keys].sort((left, right) => left.localeCompare(right));
  if (actual.length !== expected.length || actual.some((key, index) => key !== expected[index])) {
    throw error(field, `${field} must contain exactly: ${expected.join(", ")}`);
  }
  return result;
}

function text(value: unknown, field: string): string {
  if (typeof value !== "string" || !SAFE_ID.test(value)) throw error(field, `${field} must be a safe non-empty identifier`);
  return value;
}

function integer(value: unknown, field: string, minimum: number, maximum: number): number {
  if (!Number.isSafeInteger(value) || (value as number) < minimum || (value as number) > maximum) {
    throw error(field, `${field} must be an integer in [${minimum}, ${maximum}]`);
  }
  return value as number;
}

function stringArray(value: unknown, field: string, maximum: number): string[] {
  if (!Array.isArray(value) || value.length > maximum) throw error(field, `${field} must be an array with at most ${maximum} items`);
  const result = value.map((item, index) => text(item, `${field}[${index}]`));
  if (new Set(result).size !== result.length) throw error(field, `${field} must contain unique items`);
  return result;
}

function pathArray(value: unknown, field: string, maximum: number): string[] {
  if (!Array.isArray(value) || value.length > maximum) throw error(field, `${field} must be an array with at most ${maximum} items`);
  const result = value.map((item, index) => {
    if (typeof item !== "string" || item.length === 0 || item.length > 512 || item.includes("\0") || item.includes("\n")) {
      throw error(`${field}[${index}]`, `${field}[${index}] must be a bounded repository-relative path`);
    }
    return item;
  });
  if (new Set(result).size !== result.length) throw error(field, `${field} must contain unique items`);
  return result;
}

function parseAnchors(value: unknown, field: string): Anchors {
  const source = record(value, field, ANCHOR_KEYS);
  return {
    oracleRef: text(source.oracleRef, `${field}.oracleRef`),
    outcomeRef: text(source.outcomeRef, `${field}.outcomeRef`),
    populationRef: text(source.populationRef, `${field}.populationRef`),
  };
}

function parseObservation(value: unknown, field: string, limits: DeliveryCheckpointLimits): CheckpointObservation {
  const source = record(value, field, OBSERVATION_KEYS);
  const scopeAction = source.scopeAction;
  if (scopeAction !== "parked-owner-boundary" && scopeAction !== "preserved") throw error(`${field}.scopeAction`, "invalid scope action");
  return {
    anchors: parseAnchors(source.anchors, `${field}.anchors`),
    checkpointCount: integer(source.checkpointCount, `${field}.checkpointCount`, 0, 1),
    events: stringArray(source.events, `${field}.events`, limits.maxEventsPerObservation),
    nextBoundaryRef: source.nextBoundaryRef === null ? null : text(source.nextBoundaryRef, `${field}.nextBoundaryRef`),
    ownerQuestionCount: integer(source.ownerQuestionCount, `${field}.ownerQuestionCount`, 0, 1),
    scopeAction,
  };
}

function observationFailures(observed: CheckpointObservation, expected: CheckpointObservation): string[] {
  const failures: string[] = [];
  if (observed.checkpointCount !== expected.checkpointCount) failures.push("checkpoint-count");
  if (observed.ownerQuestionCount !== expected.ownerQuestionCount) failures.push("owner-question-count");
  if (observed.nextBoundaryRef !== expected.nextBoundaryRef) failures.push("next-boundary");
  if (observed.anchors.outcomeRef !== expected.anchors.outcomeRef) failures.push("outcome-ref");
  if (observed.anchors.oracleRef !== expected.anchors.oracleRef) failures.push("oracle-ref");
  if (observed.anchors.populationRef !== expected.anchors.populationRef) failures.push("population-ref");
  if (observed.scopeAction !== expected.scopeAction) failures.push("scope-action");
  if (observed.events.join("\n") !== expected.events.join("\n")) failures.push("event-order");
  return failures;
}

function parseContinuityObservation(value: unknown, field: string, limits: DeliveryCheckpointLimits): ContinuityObservation {
  const source = record(value, field, CONTINUITY_OBSERVATION_KEYS);
  let compactionBlock: ContinuityCompactionBlock | null = null;
  if (source.compactionBlock !== null) {
    const block = record(source.compactionBlock, `${field}.compactionBlock`, COMPACTION_BLOCK_KEYS);
    if (block.heading !== "Delivery Checkpoint State") throw error(`${field}.compactionBlock.heading`, "compaction heading drifted");
    compactionBlock = {
      fields: boundedTextArray(block.fields, `${field}.compactionBlock.fields`, 16),
      heading: "Delivery Checkpoint State",
    };
  }
  if (typeof source.kaizenDependency !== "boolean") throw error(`${field}.kaizenDependency`, "kaizen dependency must be boolean");
  return {
    changedPaths: pathArray(source.changedPaths, `${field}.changedPaths`, 16),
    compactionBlock,
    events: stringArray(source.events, `${field}.events`, limits.maxEventsPerObservation),
    historyAppendCount: integer(source.historyAppendCount, `${field}.historyAppendCount`, 0, 1),
    kaizenDependency: source.kaizenDependency,
    ownerBoundaryRef: source.ownerBoundaryRef === null ? null : text(source.ownerBoundaryRef, `${field}.ownerBoundaryRef`),
    ownerQuestionCount: integer(source.ownerQuestionCount, `${field}.ownerQuestionCount`, 0, 1),
  };
}

function continuityFailures(observed: ContinuityObservation, expected: ContinuityObservation): string[] {
  const failures: string[] = [];
  if (observed.changedPaths.join("\n") !== expected.changedPaths.join("\n")) failures.push("changed-paths");
  if (stableJson(observed.compactionBlock) !== stableJson(expected.compactionBlock)) failures.push("compaction-block");
  if (observed.events.join("\n") !== expected.events.join("\n")) failures.push("event-order");
  if (observed.historyAppendCount !== expected.historyAppendCount) failures.push("history-append-count");
  if (observed.kaizenDependency !== expected.kaizenDependency) failures.push("kaizen-dependency");
  if (observed.ownerBoundaryRef !== expected.ownerBoundaryRef) failures.push("owner-boundary");
  if (observed.ownerQuestionCount !== expected.ownerQuestionCount) failures.push("owner-question-count");
  return failures;
}

function parseContinuityControl(value: unknown, index: number, limits: DeliveryCheckpointLimits): ContinuityControl {
  const field = `deliveryCheckpointPack.continuityControls[${index}]`;
  const source = record(value, field, CONTINUITY_KEYS);
  const id = text(source.id, `${field}.id`);
  if (id !== CONTINUITY_ORDER[index]) throw error(`${field}.id`, "continuity control order or identity drifted");
  const expectedObservation = parseContinuityObservation(source.expectedObservation, `${field}.expectedObservation`, limits);
  if (!Array.isArray(source.redControls) || source.redControls.length === 0 || source.redControls.length > limits.maxRedControlsPerScenario) {
    throw error(`${field}.redControls`, "continuity red controls are empty or over limit");
  }
  const redControls = source.redControls.map((value, controlIndex) => {
    const controlField = `${field}.redControls[${controlIndex}]`;
    const control = record(value, controlField, RED_CONTROL_KEYS);
    const observation = parseContinuityObservation(control.observation, `${controlField}.observation`, limits);
    const expectedFailures = stringArray(control.expectedFailures, `${controlField}.expectedFailures`, 8);
    if (expectedFailures.length === 0 || expectedFailures.join("\n") !== continuityFailures(observation, expectedObservation).join("\n")) {
      throw error(`${controlField}.expectedFailures`, "continuity red-control failures do not match the explicit observation difference");
    }
    return { expectedFailures, id: text(control.id, `${controlField}.id`), observation };
  });
  if (new Set(redControls.map((control) => control.id)).size !== redControls.length) throw error(`${field}.redControls`, "continuity red-control ids must be unique");
  return { expectedObservation, id, redControls };
}

function parseLimits(value: unknown): DeliveryCheckpointLimits {
  const source = record(value, "deliveryCheckpointPack.limits", LIMIT_KEYS);
  const limits = {
    maxCostUnits: integer(source.maxCostUnits, "deliveryCheckpointPack.limits.maxCostUnits", 1, 1_000_000),
    maxEventsPerObservation: integer(source.maxEventsPerObservation, "deliveryCheckpointPack.limits.maxEventsPerObservation", 1, 32),
    maxMeasurementsPerScenario: integer(source.maxMeasurementsPerScenario, "deliveryCheckpointPack.limits.maxMeasurementsPerScenario", 1, 16),
    maxRedControlsPerScenario: integer(source.maxRedControlsPerScenario, "deliveryCheckpointPack.limits.maxRedControlsPerScenario", 1, 16),
    maxScenarios: integer(source.maxScenarios, "deliveryCheckpointPack.limits.maxScenarios", 1, 64),
  };
  if (limits.maxScenarios !== MEMBER_ORDER.length) throw error("deliveryCheckpointPack.limits.maxScenarios", "scenario limit must equal the reviewed population");
  return limits;
}

function parseMeasurement(value: unknown, field: string, limits: DeliveryCheckpointLimits): CostMeasurement {
  const source = record(value, field, MEASUREMENT_KEYS);
  const count = integer(source.count, `${field}.count`, 0, limits.maxCostUnits);
  const unitCost = integer(source.unitCost, `${field}.unitCost`, 0, limits.maxCostUnits);
  const expectedTotal = integer(source.expectedTotal, `${field}.expectedTotal`, 0, limits.maxCostUnits);
  if (count * unitCost !== expectedTotal) throw error(`${field}.expectedTotal`, "explicit cost arithmetic does not match count * unitCost");
  return { count, expectedTotal, id: text(source.id, `${field}.id`), unitCost };
}

function parseScenario(value: unknown, index: number, limits: DeliveryCheckpointLimits): DeliveryCheckpointScenario {
  const field = `deliveryCheckpointPack.scenarios[${index}]`;
  const source = record(value, field, SCENARIO_KEYS);
  const id = text(source.id, `${field}.id`);
  if (id !== MEMBER_ORDER[index]) throw error(`${field}.id`, "scenario order or identity drifted");
  if (source.taskClass !== "ordinary" && source.taskClass !== "openspec" && source.taskClass !== "grind") throw error(`${field}.taskClass`, "invalid task class");
  const judgment = record(source.reviewedJudgment, `${field}.reviewedJudgment`, JUDGMENT_KEYS);
  if (judgment.disposition !== "checkpoint" && judgment.disposition !== "continue" && judgment.disposition !== "irreducible" && judgment.disposition !== "owner-boundary" && judgment.disposition !== "suppress-duplicate") {
    throw error(`${field}.reviewedJudgment.disposition`, "invalid reviewed disposition");
  }
  if (!Array.isArray(judgment.costMeasurements) || judgment.costMeasurements.length === 0 || judgment.costMeasurements.length > limits.maxMeasurementsPerScenario) {
    throw error(`${field}.reviewedJudgment.costMeasurements`, "cost measurements are empty or over limit");
  }
  const costMeasurements = judgment.costMeasurements.map((item, measurementIndex) => parseMeasurement(item, `${field}.reviewedJudgment.costMeasurements[${measurementIndex}]`, limits));
  const totalCostUnits = costMeasurements.reduce((sum, item) => sum + item.expectedTotal, 0);
  if (!Number.isSafeInteger(totalCostUnits) || totalCostUnits > limits.maxCostUnits) throw error(`${field}.reviewedJudgment.costMeasurements`, "scenario cost total exceeds the pack limit");
  const expectedObservation = parseObservation(source.expectedObservation, `${field}.expectedObservation`, limits);
  if (!Array.isArray(source.redControls) || source.redControls.length === 0 || source.redControls.length > limits.maxRedControlsPerScenario) {
    throw error(`${field}.redControls`, "red controls are empty or over limit");
  }
  const redControls = source.redControls.map((item, controlIndex): RedControl => {
    const controlField = `${field}.redControls[${controlIndex}]`;
    const control = record(item, controlField, RED_CONTROL_KEYS);
    const observation = parseObservation(control.observation, `${controlField}.observation`, limits);
    const expectedFailures = stringArray(control.expectedFailures, `${controlField}.expectedFailures`, 8);
    if (expectedFailures.length === 0 || expectedFailures.join("\n") !== observationFailures(observation, expectedObservation).join("\n")) {
      throw error(`${controlField}.expectedFailures`, "red-control failures do not match the explicit observation difference");
    }
    return { expectedFailures, id: text(control.id, `${controlField}.id`), observation };
  });
  if (new Set(redControls.map((control) => control.id)).size !== redControls.length) throw error(`${field}.redControls`, "red-control ids must be unique");
  return {
    expectedObservation,
    id,
    redControls,
    reviewedJudgment: {
      costMeasurements,
      disposition: judgment.disposition as CheckpointDisposition,
      reason: text(judgment.reason, `${field}.reviewedJudgment.reason`),
    },
    taskClass: source.taskClass,
  };
}

export function parseDeliveryCheckpointPack(value: unknown): DeliveryCheckpointPack {
  const source = record(value, "deliveryCheckpointPack", PACK_KEYS);
  if (source.schemaVersion !== 1 || source.id !== PACK_ID || source.claimId !== CLAIM_ID || source.maximumClaim !== MAXIMUM_CLAIM) {
    throw error("deliveryCheckpointPack", "delivery-checkpoint pack identity drifted");
  }
  const governedSourcePaths = pathArray(source.governedSourcePaths, "deliveryCheckpointPack.governedSourcePaths", GOVERNED_SOURCE_PATHS.length);
  if (governedSourcePaths.join("\n") !== GOVERNED_SOURCE_PATHS.join("\n")) throw error("deliveryCheckpointPack.governedSourcePaths", "governed source order drifted");
  for (const sourcePath of governedSourcePaths) {
    if (path.isAbsolute(sourcePath) || sourcePath.split(/[\\/]/).includes("..")) throw error("deliveryCheckpointPack.governedSourcePaths", "governed source paths must be repository-relative and contained");
  }
  const limits = parseLimits(source.limits);
  if (!Array.isArray(source.continuityControls) || source.continuityControls.length !== CONTINUITY_ORDER.length) {
    throw error("deliveryCheckpointPack.continuityControls", "continuity control population is incomplete");
  }
  const continuityControls = source.continuityControls.map((item, index) => parseContinuityControl(item, index, limits));
  if (!Array.isArray(source.scenarios) || source.scenarios.length !== limits.maxScenarios) throw error("deliveryCheckpointPack.scenarios", "scenario population is incomplete");
  const scenarios = source.scenarios.map((item, index) => parseScenario(item, index, limits));
  return { claimId: CLAIM_ID, continuityControls, governedSourcePaths, id: PACK_ID, limits, maximumClaim: MAXIMUM_CLAIM, scenarios, schemaVersion: 1 };
}

function readPackText(repoRoot: string): string {
  let source: string;
  try {
    source = fs.readFileSync(path.join(repoRoot, PACK_PATH), "utf8");
  } catch (cause) {
    throw error("deliveryCheckpointPack", "delivery-checkpoint seed is unreadable", cause);
  }
  assertPrivacySafe(source, "delivery-checkpoint seed");
  return source;
}

export function loadDeliveryCheckpointPack(repoRoot: string): { pack: DeliveryCheckpointPack; packDigest: string; seedByteDigest: string } {
  const source = readPackText(repoRoot);
  let parsed: unknown;
  try {
    parsed = JSON.parse(source);
  } catch (cause) {
    throw error("deliveryCheckpointPack", "delivery-checkpoint seed is not valid JSON", cause);
  }
  const pack = parseDeliveryCheckpointPack(parsed);
  return { pack, packDigest: digestOf(pack), seedByteDigest: digestOf(source) };
}

export function evaluateDeliveryCheckpointPack(pack: DeliveryCheckpointPack): DeliveryCheckpointEvaluation {
  const rows: DeliveryCheckpointEvaluationRow[] = [];
  const continuityRows: DeliveryCheckpointEvaluationRow[] = [];
  const costArithmetic = pack.scenarios.map((scenario) => ({
    measurements: scenario.reviewedJudgment.costMeasurements,
    scenarioId: scenario.id,
    totalCostUnits: scenario.reviewedJudgment.costMeasurements.reduce((sum, item) => sum + item.expectedTotal, 0),
  }));
  for (const scenario of pack.scenarios) {
    const greenFailures = observationFailures(scenario.expectedObservation, scenario.expectedObservation);
    rows.push({
      controlId: null,
      expected: "pass",
      failures: greenFailures,
      kind: "green",
      observed: greenFailures.length === 0 ? "passed" : "failed",
      oracleMatched: greenFailures.length === 0,
      scenarioId: scenario.id,
    });
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
  for (const control of pack.continuityControls) {
    const greenFailures = continuityFailures(control.expectedObservation, control.expectedObservation);
    continuityRows.push({
      controlId: null,
      expected: "pass",
      failures: greenFailures,
      kind: "green",
      observed: greenFailures.length === 0 ? "passed" : "failed",
      oracleMatched: greenFailures.length === 0,
      scenarioId: control.id,
    });
    for (const red of control.redControls) {
      const failures = continuityFailures(red.observation, control.expectedObservation);
      continuityRows.push({
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
  const allRows = [...rows, ...continuityRows];
  const status = allRows.every((row) => row.oracleMatched && (row.expected === "pass" ? row.observed === "passed" : row.observed === "failed")) ? "passed" : "failed";
  const evaluation: DeliveryCheckpointEvaluation = {
    continuityRows,
    costArithmetic,
    evaluationDigest: "",
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
  assertPrivacySafe(stableJson(evaluation), "delivery-checkpoint evaluation");
  return evaluation;
}

function sealBundle(value: Omit<DeliveryCheckpointBundle, "bundleDigest">): DeliveryCheckpointBundle {
  const bundle: DeliveryCheckpointBundle = { ...value, bundleDigest: "" };
  assertPrivacySafe(stableJson(bundle), "delivery-checkpoint bundle");
  bundle.bundleDigest = digestOf(bundle);
  return bundle;
}

function parseBundle(value: unknown): DeliveryCheckpointBundle {
  const source = record(value, "deliveryCheckpointBundle", BUNDLE_KEYS);
  if (source.schemaVersion !== 1) throw error("deliveryCheckpointBundle.schemaVersion", "unsupported delivery-checkpoint bundle schema");
  const pack = parseDeliveryCheckpointPack(source.pack);
  const packDigest = digestOf(pack);
  if (source.packDigest !== packDigest) throw error("deliveryCheckpointBundle.packDigest", "delivery-checkpoint pack digest mismatch");
  const expectedEvaluation = evaluateDeliveryCheckpointPack(pack);
  if (stableJson(source.evaluation) !== stableJson(expectedEvaluation)) throw error("deliveryCheckpointBundle.evaluation", "delivery-checkpoint evaluation mismatch");
  const bundle = source as unknown as DeliveryCheckpointBundle;
  if (!SAFE_ID.test(bundle.candidateId)) throw error("deliveryCheckpointBundle.candidateId", "invalid candidate id");
  if (bundle.effects?.evidenceWrites !== 2 || bundle.effects.modelCalls !== 0 || bundle.effects.networkCalls !== 0 || bundle.effects.processCalls !== 0 || bundle.effects.providerCalls !== 0 || bundle.effects.remoteEffects !== 0 || bundle.effects.sourceWrites !== 0) {
    throw error("deliveryCheckpointBundle.effects", "delivery-checkpoint effects mismatch");
  }
  if (bundle.cleanup?.status !== "complete" || bundle.cleanup.terminal !== true || bundle.cleanup.persistentTemporaryFiles !== 0 || bundle.cleanup.processesRemaining !== 0 || bundle.cleanup.sessionsRemaining !== 0) {
    throw error("deliveryCheckpointBundle.cleanup", "delivery-checkpoint cleanup mismatch");
  }
  const unsealed = structuredClone(bundle);
  unsealed.bundleDigest = "";
  if (bundle.bundleDigest !== digestOf(unsealed)) throw error("deliveryCheckpointBundle.bundleDigest", "delivery-checkpoint bundle digest mismatch");
  assertPrivacySafe(stableJson(bundle), "delivery-checkpoint bundle");
  return bundle;
}

export function deliveryCheckpointPreflight(repoRoot: string, gitRef: string): Record<string, unknown> {
  if (gitRef !== "working-tree") throw error("sourceRef", "delivery-checkpoint preflight requires --source-ref working-tree");
  const loaded = loadDeliveryCheckpointPack(repoRoot);
  const source = governedSourceIdentity(repoRoot, gitRef, loaded.pack.governedSourcePaths);
  return {
    governedDigest: source.governedDigest,
    governedSourcePaths: loaded.pack.governedSourcePaths,
    maximumClaim: MAXIMUM_CLAIM,
    memberCount: loaded.pack.scenarios.length,
    mode: "preflight",
    modelCalls: 0,
    pack: "delivery-checkpoint",
    packId: PACK_ID,
    processCalls: 0,
    providerCalls: 0,
    scenarioDigest: loaded.packDigest,
    scenarioIds: loaded.pack.scenarios.map((scenario) => scenario.id),
    seedIdentity: { digest: loaded.seedByteDigest, path: PACK_PATH },
    status: "ready",
  };
}

export function materializeDeliveryCheckpointBundle(options: {
  candidateId: string;
  evidenceRoot: string;
  gitRef: string;
  repoRoot: string;
}): { bundle: DeliveryCheckpointBundle; evaluation: DeliveryCheckpointEvaluation } {
  if (options.gitRef !== "working-tree") throw error("sourceRef", "delivery-checkpoint materialization requires --source-ref working-tree");
  if (!SAFE_ID.test(options.candidateId)) throw error("candidateId", "candidate id must be a safe token");
  if (!path.isAbsolute(options.evidenceRoot)) throw error("evidenceRoot", "delivery-checkpoint evidence root must be absolute");
  if (fs.existsSync(options.evidenceRoot)) throw error("evidenceRoot", "delivery-checkpoint evidence root must be create-new");
  const loaded = loadDeliveryCheckpointPack(options.repoRoot);
  const sourceIdentity = governedSourceIdentity(options.repoRoot, options.gitRef, loaded.pack.governedSourcePaths);
  const evaluation = evaluateDeliveryCheckpointPack(loaded.pack);
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
    throw error("evidenceRoot", "delivery-checkpoint materialization failed", cause);
  }
  return { bundle, evaluation };
}

export function replayDeliveryCheckpoint(bundlePath: string): { bundle: DeliveryCheckpointBundle; evaluation: DeliveryCheckpointEvaluation } {
  let source: string;
  try {
    source = fs.readFileSync(bundlePath, "utf8");
  } catch (cause) {
    throw error("deliveryCheckpointBundle", "delivery-checkpoint bundle is unreadable", cause);
  }
  assertPrivacySafe(source, "delivery-checkpoint bundle");
  let parsed: unknown;
  try {
    parsed = JSON.parse(source);
  } catch (cause) {
    throw error("deliveryCheckpointBundle", "delivery-checkpoint bundle is not valid JSON", cause);
  }
  const bundle = parseBundle(parsed);
  return { bundle, evaluation: bundle.evaluation };
}

type DeliveryCheckpointConfiguredSingleExpectedResult = {
  canary: "passed";
  checkpointCount: 1;
  costlyActionRepeatCount: 0;
  duplicateDisposition: "suppressed-unchanged-evidence";
  eventCount: 9;
  productQuestionCount: 0;
  protectedActionCount: 0;
  scopeOraclePopulation: "unchanged";
};

type DeliveryCheckpointConfiguredPopulationRow = {
  anchors: Anchors;
  checkpointCount: number;
  disposition: CheckpointDisposition;
  events: string[];
  memberId: typeof MEMBER_ORDER[number];
  nextBoundaryRef: string | null;
  ownerQuestionCount: number;
  scopeAction: ScopeAction;
  taskClass: TaskClass;
};

type DeliveryCheckpointConfiguredPopulationExpectedResult = {
  memberCount: number;
  ownerQuestionCount: number;
  protectedActionCount: 0;
  repositoryClass: string;
  rows: DeliveryCheckpointConfiguredPopulationRow[];
  schemaVersion: 1;
  scopeOraclePopulation: "unchanged";
};

type DeliveryCheckpointConfiguredExpectedResult =
  | DeliveryCheckpointConfiguredPopulationExpectedResult
  | DeliveryCheckpointConfiguredSingleExpectedResult;

type DeliveryCheckpointConfiguredScenario = ScenarioRecord & {
  expectedResult: DeliveryCheckpointConfiguredExpectedResult;
};

export type DeliveryCheckpointConfiguredPack = {
  configuredProviderRequestBound: 1;
  governedSourcePaths: string[];
  id: "delivery-checkpoint-configured-r1";
  maximumClaim: typeof CONFIGURED_MAXIMUM_CLAIM;
  profile: "quality-independent";
  runtimeProfile: "core";
  scenarios: DeliveryCheckpointConfiguredScenario[];
  schemaVersion: 1;
};

export type DeliveryCheckpointConfiguredEvaluation = {
  candidateId: string;
  configuredRoute: string | null;
  effectiveConfigDigest: string;
  evaluationDigest: string;
  failures: string[];
  maximumClaim: typeof CONFIGURED_MAXIMUM_CLAIM;
  modelCalls: number;
  openCodeSha256: string;
  openCodeVersion: string;
  packDigest: string;
  resolvedRoute: string | null;
  scenarioId: DeliveryCheckpointConfiguredScenarioId;
  sourceDigest: string;
  status: "failed" | "passed";
};

function boundedText(value: unknown, field: string, maximum = 16_384): string {
  if (typeof value !== "string" || value.length === 0 || value.length > maximum || value.includes("\0")) {
    throw error(field, `${field} must be bounded non-empty text`);
  }
  return value;
}

function boundedTextArray(value: unknown, field: string, maximumItems: number): string[] {
  if (!Array.isArray(value) || value.length > maximumItems) throw error(field, `${field} must be an array with at most ${maximumItems} items`);
  return value.map((item, index) => boundedText(item, `${field}[${index}]`, 2_048));
}

function isConfiguredScenarioId(value: string): value is DeliveryCheckpointConfiguredScenarioId {
  return (CONFIGURED_SCENARIO_IDS as readonly string[]).includes(value);
}

function parseConfiguredPopulationExpectedResult(
  value: unknown,
  field: string,
): DeliveryCheckpointConfiguredPopulationExpectedResult {
  const source = record(value, field, [
    "memberCount", "ownerQuestionCount", "protectedActionCount", "repositoryClass", "rows", "schemaVersion", "scopeOraclePopulation",
  ]);
  if (source.schemaVersion !== 1 || source.protectedActionCount !== 0 || source.scopeOraclePopulation !== "unchanged") {
    throw error(field, "configured population result identity drifted");
  }
  if (!Array.isArray(source.rows) || source.rows.length < 1 || source.rows.length > MEMBER_ORDER.length) {
    throw error(`${field}.rows`, "configured population result rows are out of bounds");
  }
  const rows = source.rows.map((value, index): DeliveryCheckpointConfiguredPopulationRow => {
    const rowField = `${field}.rows[${index}]`;
    const row = record(value, rowField, [
      "anchors", "checkpointCount", "disposition", "events", "memberId", "nextBoundaryRef", "ownerQuestionCount", "scopeAction", "taskClass",
    ]);
    const anchors = record(row.anchors, `${rowField}.anchors`, ANCHOR_KEYS);
    const memberId = boundedText(row.memberId, `${rowField}.memberId`, 128);
    const disposition = boundedText(row.disposition, `${rowField}.disposition`, 64);
    const scopeAction = boundedText(row.scopeAction, `${rowField}.scopeAction`, 64);
    const taskClass = boundedText(row.taskClass, `${rowField}.taskClass`, 64);
    if (!(MEMBER_ORDER as readonly string[]).includes(memberId)) throw error(`${rowField}.memberId`, "unknown OPDC-001 member");
    if (!["checkpoint", "continue", "irreducible", "owner-boundary", "suppress-duplicate"].includes(disposition)) {
      throw error(`${rowField}.disposition`, "unknown configured population disposition");
    }
    if (!["parked-owner-boundary", "preserved"].includes(scopeAction)) throw error(`${rowField}.scopeAction`, "unknown configured scope action");
    if (!["grind", "openspec", "ordinary"].includes(taskClass)) throw error(`${rowField}.taskClass`, "unknown configured task class");
    const nextBoundaryRef = row.nextBoundaryRef == null ? null : boundedText(row.nextBoundaryRef, `${rowField}.nextBoundaryRef`, 256);
    return {
      anchors: {
        oracleRef: boundedText(anchors.oracleRef, `${rowField}.anchors.oracleRef`, 256),
        outcomeRef: boundedText(anchors.outcomeRef, `${rowField}.anchors.outcomeRef`, 256),
        populationRef: boundedText(anchors.populationRef, `${rowField}.anchors.populationRef`, 256),
      },
      checkpointCount: integer(row.checkpointCount, `${rowField}.checkpointCount`, 0, 1),
      disposition: disposition as CheckpointDisposition,
      events: boundedTextArray(row.events, `${rowField}.events`, 8),
      memberId: memberId as typeof MEMBER_ORDER[number],
      nextBoundaryRef,
      ownerQuestionCount: integer(row.ownerQuestionCount, `${rowField}.ownerQuestionCount`, 0, 1),
      scopeAction: scopeAction as ScopeAction,
      taskClass: taskClass as TaskClass,
    };
  });
  if (new Set(rows.map((row) => row.memberId)).size !== rows.length) throw error(`${field}.rows`, "configured population member ids must be unique");
  const memberCount = integer(source.memberCount, `${field}.memberCount`, 1, MEMBER_ORDER.length);
  const ownerQuestionCount = integer(source.ownerQuestionCount, `${field}.ownerQuestionCount`, 0, MEMBER_ORDER.length);
  if (memberCount !== rows.length || ownerQuestionCount !== rows.reduce((total, row) => total + row.ownerQuestionCount, 0)) {
    throw error(field, "configured population result arithmetic drifted");
  }
  return {
    memberCount,
    ownerQuestionCount,
    protectedActionCount: 0,
    repositoryClass: boundedText(source.repositoryClass, `${field}.repositoryClass`, 128),
    rows,
    schemaVersion: 1,
    scopeOraclePopulation: "unchanged",
  };
}

function parseConfiguredScenario(value: unknown, index: number, repoRoot: string): DeliveryCheckpointConfiguredScenario {
  const field = `deliveryCheckpointConfiguredPack.scenarios[${index}]`;
  const source = record(value, field, [
    "allowedEffects", "cleanupOracle", "configuredProviderRequestBound", "evidenceByteBound", "expectedOutcome",
    "expectedResult", "fixtureId", "fixturePath", "forbiddenEffects", "frictionFields", "id", "initialManifest",
    "permissions", "proofExpectations", "request", "sampleCount", "shape", "validationArgv",
  ]);
  const scenarioId = boundedText(source.id, `${field}.id`, 128);
  if (!isConfiguredScenarioId(scenarioId)) throw error(`${field}.id`, "unknown configured delivery-checkpoint scenario");
  const contract = CONFIGURED_SCENARIO_CONTRACTS[scenarioId];
  if (source.fixtureId !== scenarioId || source.shape !== contract.shape) {
    throw error(field, "configured delivery-checkpoint scenario identity drifted");
  }
  const initialManifest = record(source.initialManifest, `${field}.initialManifest`, ["files"]);
  const expectedOutcome = record(source.expectedOutcome, `${field}.expectedOutcome`, ["exitCode", "stateFiles", "stdoutIncludes"]);
  const proof = record(source.proofExpectations, `${field}.proofExpectations`, ["argv", "exitCode", "stdoutIncludes"]);
  const permissions = record(source.permissions, `${field}.permissions`, ["allow", "deny"]);
  const cleanup = record(source.cleanupOracle, `${field}.cleanupOracle`, ["fixtureRemoved", "processesRemoved", "sessionsRemoved"]);
  if (source.configuredProviderRequestBound !== 1 || source.sampleCount !== 1 || source.evidenceByteBound !== 524_288) {
    throw error(field, "configured delivery-checkpoint bounds drifted");
  }
  if (expectedOutcome.exitCode !== 0 || proof.exitCode !== 0) throw error(field, "configured delivery-checkpoint exit contract drifted");
  for (const key of ["fixtureRemoved", "processesRemoved", "sessionsRemoved"] as const) {
    if (cleanup[key] !== true) throw error(`${field}.cleanupOracle.${key}`, "configured cleanup must fail closed");
  }
  let expectedResult: DeliveryCheckpointConfiguredExpectedResult;
  if (contract.resultKind === "single") {
    const expected = record(source.expectedResult, `${field}.expectedResult`, [
      "canary", "checkpointCount", "costlyActionRepeatCount", "duplicateDisposition", "eventCount",
      "productQuestionCount", "protectedActionCount", "scopeOraclePopulation",
    ]);
    expectedResult = {
      canary: "passed",
      checkpointCount: 1,
      costlyActionRepeatCount: 0,
      duplicateDisposition: "suppressed-unchanged-evidence",
      eventCount: 9,
      productQuestionCount: 0,
      protectedActionCount: 0,
      scopeOraclePopulation: "unchanged",
    };
    if (stableJson(expected) !== stableJson(expectedResult)) throw error(`${field}.expectedResult`, "configured delivery-checkpoint result contract drifted");
  } else {
    const expectedRef = record(source.expectedResult, `${field}.expectedResult`, ["fixtureField"]);
    if (expectedRef.fixtureField !== "expectedResult") throw error(`${field}.expectedResult.fixtureField`, "configured population fixture field drifted");
    let fixtureSeed: unknown;
    try {
      fixtureSeed = JSON.parse(fs.readFileSync(path.join(repoRoot, contract.fixturePath, "case.json"), "utf8"));
    } catch (cause) {
      throw error(`${field}.expectedResult`, "configured population case seed is unreadable or invalid", cause);
    }
    const fixture = record(fixtureSeed, `${field}.fixture`, ["cases", "expectedResult", "id", "repositoryClass", "schemaVersion"]);
    if (fixture.schemaVersion !== 1 || fixture.id !== scenarioId || fixture.repositoryClass !== (fixture.expectedResult as Record<string, unknown> | null)?.repositoryClass) {
      throw error(`${field}.fixture`, "configured population fixture identity drifted");
    }
    expectedResult = parseConfiguredPopulationExpectedResult(fixture.expectedResult, `${field}.fixture.expectedResult`);
  }
  const frictionFields = boundedTextArray(source.frictionFields, `${field}.frictionFields`, 5) as FrictionField[];
  const expectedFriction: FrictionField[] = [
    "ownerQuestionCount", "configuredProviderRequestCount", "failedToolCallCount",
    "duplicateFailedToolInvocationCount", "totalToolCallCount",
  ];
  if (frictionFields.join("|") !== expectedFriction.join("|")) throw error(`${field}.frictionFields`, "configured friction fields drifted");
  const scenario: DeliveryCheckpointConfiguredScenario = {
    allowedEffects: boundedTextArray(source.allowedEffects, `${field}.allowedEffects`, 8),
    cleanupOracle: { fixtureRemoved: true, processesRemoved: true, sessionsRemoved: true },
    configuredProviderRequestBound: 1,
    evidenceByteBound: 524_288,
    expectedOutcome: {
      exitCode: 0,
      stateFiles: pathArray(expectedOutcome.stateFiles, `${field}.expectedOutcome.stateFiles`, 8),
      stdoutIncludes: boundedTextArray(expectedOutcome.stdoutIncludes, `${field}.expectedOutcome.stdoutIncludes`, 8),
    },
    expectedResult,
    fixtureId: scenarioId,
    fixturePath: boundedText(source.fixturePath, `${field}.fixturePath`, 512),
    forbiddenEffects: boundedTextArray(source.forbiddenEffects, `${field}.forbiddenEffects`, 16),
    frictionFields,
    id: scenarioId,
    initialManifest: { files: pathArray(initialManifest.files, `${field}.initialManifest.files`, 16) },
    permissions: {
      allow: boundedTextArray(permissions.allow, `${field}.permissions.allow`, 16),
      deny: boundedTextArray(permissions.deny, `${field}.permissions.deny`, 16),
    },
    proofExpectations: {
      argv: boundedTextArray(proof.argv, `${field}.proofExpectations.argv`, 8),
      exitCode: 0,
      stdoutIncludes: boundedTextArray(proof.stdoutIncludes, `${field}.proofExpectations.stdoutIncludes`, 16),
    },
    request: boundedText(source.request, `${field}.request`),
    sampleCount: 1,
    shape: contract.shape,
    validationArgv: boundedTextArray(source.validationArgv, `${field}.validationArgv`, 8),
  };
  if (scenario.fixturePath !== contract.fixturePath) {
    throw error(`${field}.fixturePath`, "configured delivery-checkpoint fixture path drifted");
  }
  return scenario;
}

export function loadDeliveryCheckpointConfiguredPack(repoRoot: string): { digest: string; pack: DeliveryCheckpointConfiguredPack } {
  let parsed: unknown;
  try {
    const source = fs.readFileSync(path.join(repoRoot, CONFIGURED_PACK_PATH), "utf8");
    assertPrivacySafe(source, "configured delivery-checkpoint seed");
    parsed = JSON.parse(source);
  } catch (cause) {
    throw error("deliveryCheckpointConfiguredPack", "configured delivery-checkpoint seed is unreadable or invalid", cause);
  }
  const source = record(parsed, "deliveryCheckpointConfiguredPack", [
    "configuredProviderRequestBound", "governedSourcePaths", "id", "maximumClaim", "profile", "runtimeProfile", "scenarios", "schemaVersion",
  ]);
  if (source.schemaVersion !== 1 || source.id !== "delivery-checkpoint-configured-r1" || source.profile !== "quality-independent" || source.runtimeProfile !== "core"
    || source.configuredProviderRequestBound !== 1 || source.maximumClaim !== CONFIGURED_MAXIMUM_CLAIM) {
    throw error("deliveryCheckpointConfiguredPack", "configured delivery-checkpoint pack identity drifted");
  }
  const governedSourcePaths = pathArray(source.governedSourcePaths, "deliveryCheckpointConfiguredPack.governedSourcePaths", 32);
  if (governedSourcePaths.length === 0 || governedSourcePaths.some((entry) => path.isAbsolute(entry) || entry.split(/[\\/]/).includes(".."))) {
    throw error("deliveryCheckpointConfiguredPack.governedSourcePaths", "configured governed paths must be explicit and contained");
  }
  if (!Array.isArray(source.scenarios) || source.scenarios.length !== CONFIGURED_SCENARIO_IDS.length) {
    throw error("deliveryCheckpointConfiguredPack.scenarios", `configured delivery-checkpoint pack requires exactly ${CONFIGURED_SCENARIO_IDS.length} scenarios`);
  }
  const scenarios = source.scenarios.map((scenario, index) => parseConfiguredScenario(scenario, index, repoRoot));
  if (scenarios.map((scenario) => scenario.id).join("|") !== CONFIGURED_SCENARIO_IDS.join("|")) {
    throw error("deliveryCheckpointConfiguredPack.scenarios", "configured delivery-checkpoint scenario order drifted");
  }
  const populationMemberIds = scenarios.flatMap((scenario) => (
    "rows" in scenario.expectedResult ? scenario.expectedResult.rows.map((row) => row.memberId) : []
  ));
  if (populationMemberIds.length !== MEMBER_ORDER.length
    || new Set(populationMemberIds).size !== MEMBER_ORDER.length
    || MEMBER_ORDER.some((memberId) => !populationMemberIds.includes(memberId))) {
    throw error("deliveryCheckpointConfiguredPack.scenarios", "configured OPDC-001 population coverage drifted");
  }
  for (const scenario of scenarios) verifyFixtureSeed(repoRoot, scenario);
  const pack: DeliveryCheckpointConfiguredPack = {
    configuredProviderRequestBound: 1,
    governedSourcePaths,
    id: "delivery-checkpoint-configured-r1",
    maximumClaim: CONFIGURED_MAXIMUM_CLAIM,
    profile: "quality-independent",
    runtimeProfile: "core",
    scenarios,
    schemaVersion: 1,
  };
  return { digest: digestOf(pack), pack };
}

function configuredManifest(
  pack: DeliveryCheckpointConfiguredPack,
  scenario: DeliveryCheckpointConfiguredScenario,
): RegressionManifest {
  return {
    baselinePointerPath: "tools/proofs/baselines/delivery-checkpoint-configured.json",
    captureByteLimit: 8_388_608,
    defaultExpectation: "no-regression",
    frictionFields: [
      "ownerQuestionCount", "configuredProviderRequestCount", "failedToolCallCount",
      "duplicateFailedToolInvocationCount", "totalToolCallCount",
    ],
    governedSourcePaths: pack.governedSourcePaths,
    pairOrder: ["C1"],
    profile: pack.profile,
    sampleByteLimit: 524_288,
    sampleCount: 1,
    scenarios: [scenario],
    schemaVersion: 3,
  };
}

function readConfiguredDiagnostic(diagnosticPath: string): Record<string, unknown> {
  let diagnostic: unknown;
  try {
    const source = fs.readFileSync(diagnosticPath, "utf8");
    assertPrivacySafe(source, "configured delivery-checkpoint diagnostic");
    diagnostic = JSON.parse(source);
  } catch (cause) {
    throw error("diagnostic", "configured delivery-checkpoint diagnostic is unreadable or invalid", cause);
  }
  if (diagnostic == null || typeof diagnostic !== "object" || Array.isArray(diagnostic)) throw error("diagnostic", "configured diagnostic must be an object");
  const recordValue = diagnostic as Record<string, unknown>;
  if (recordValue.digest !== digestOf({ ...recordValue, digest: "" })) throw error("diagnostic.digest", "configured diagnostic digest mismatch");
  return recordValue;
}

function changedText(diagnostic: Record<string, unknown>, relativePath: string): string | null {
  if (!Array.isArray(diagnostic.changes)) return null;
  const rows = diagnostic.changes as Array<Record<string, unknown>>;
  const row = rows.find((item) => item.path === relativePath);
  const after = row?.after as Record<string, unknown> | null | undefined;
  return typeof after?.text === "string" ? after.text : null;
}

function evaluateConfiguredDiagnostic(
  repoRoot: string,
  loaded: { digest: string; pack: DeliveryCheckpointConfiguredPack },
  diagnostic: Record<string, unknown>,
): DeliveryCheckpointConfiguredEvaluation {
  const failures: string[] = [];
  const diagnosticScenarioId = typeof diagnostic.scenarioId === "string" ? diagnostic.scenarioId : "unknown";
  const scenario = loaded.pack.scenarios.find((candidate) => candidate.id === diagnosticScenarioId) ?? loaded.pack.scenarios[0]!;
  if (diagnostic.scenarioDigest !== loaded.digest) failures.push("scenario-digest");
  if (diagnostic.scenarioId !== scenario.id) failures.push("scenario-id");
  if (diagnostic.terminalClassification !== "completed-observation") failures.push("terminal-classification");
  const cleanup = diagnostic.cleanup as Record<string, unknown> | undefined;
  if (cleanup?.complete !== true || cleanup.fixtureRemoved !== true || cleanup.processesRemoved !== true || cleanup.sessionsRemoved !== true) failures.push("cleanup");
  const providerRequestCount = typeof diagnostic.providerRequestCount === "number" ? diagnostic.providerRequestCount : -1;
  if (providerRequestCount !== 1) failures.push("provider-request-bound");
  if (!Array.isArray(diagnostic.runtimeErrors) || diagnostic.runtimeErrors.length !== 0) failures.push("runtime-errors");
  const validation = diagnostic.validation as Record<string, unknown> | undefined;
  const proof = diagnostic.proof as Record<string, unknown> | undefined;
  if (validation?.status !== 0) failures.push("validation-status");
  if (proof?.status !== 0) failures.push("proof-status");
  const proofStdout = typeof proof?.stdout === "string" ? proof.stdout : "";
  for (const marker of scenario.proofExpectations.stdoutIncludes) {
    if (!proofStdout.includes(marker)) failures.push(`proof-marker:${marker}`);
  }
  const session = diagnostic.session as Record<string, unknown> | undefined;
  const messages = session?.messages as Record<string, unknown> | undefined;
  const toolCalls = Array.isArray(messages?.toolCalls) ? messages.toolCalls as Array<Record<string, unknown>> : [];
  if (toolCalls.some((tool) => typeof tool.name === "string" && new Set(["question", "task", "webfetch", "websearch"]).has(tool.name))) failures.push("prohibited-tool");
  const environment = diagnostic.environment as Record<string, unknown> | undefined;
  const startupFacts = environment?.startupFacts as Record<string, unknown> | undefined;
  if (startupFacts?.hostConfigLoaded === true || startupFacts?.ripgrepDownloadRequested === true) failures.push("runtime-isolation");
  const configuredRoute = typeof environment?.configuredRoute === "string" ? environment.configuredRoute : null;
  const resolvedRoute = typeof environment?.resolvedRoute === "string" ? environment.resolvedRoute : null;
  const profile = loadModelProfile(repoRoot, loaded.pack.profile).profile;
  const expectedRoute = `${profile.agent.build!.model}/${profile.agent.build!.variant}`;
  if (configuredRoute !== expectedRoute || resolvedRoute !== expectedRoute) failures.push("route-identity");
  const openCode = environment?.openCode as Record<string, unknown> | undefined;
  const openCodeSha256 = typeof openCode?.sha256 === "string" ? openCode.sha256 : "unknown";
  const openCodeVersion = typeof openCode?.version === "string" ? openCode.version : "unknown";
  if (!/^[a-f0-9]{64}$/.test(openCodeSha256) || openCodeVersion === "unknown") failures.push("opencode-identity");
  const runtimeManifest = Array.isArray(environment?.runtimeManifest) ? environment.runtimeManifest as Array<Record<string, unknown>> : [];
  const effectiveConfigRows = runtimeManifest.filter((row) => typeof row.path === "string" && row.path.startsWith("candidate-config/"));
  const effectiveConfigDigest = effectiveConfigRows.length === 0 ? "unknown" : digestOf(effectiveConfigRows);
  if (effectiveConfigDigest === "unknown") failures.push("effective-config-identity");
  const sourceIdentity = diagnostic.sourceIdentity as Record<string, unknown> | undefined;
  const sourceDigest = typeof sourceIdentity?.governedDigest === "string" ? sourceIdentity.governedDigest : "unknown";
  const currentSourceDigest = governedSourceIdentity(repoRoot, "working-tree", loaded.pack.governedSourcePaths).governedDigest;
  if (!/^[a-f0-9]{64}$/.test(sourceDigest) || sourceDigest !== currentSourceDigest) failures.push("source-identity");
  const changedPaths = Array.isArray(diagnostic.changes)
    ? (diagnostic.changes as Array<Record<string, unknown>>).map((row) => row.path).filter((item): item is string => typeof item === "string").sort((left, right) => left.localeCompare(right))
    : [];
  const expectedChangedPaths = [...scenario.expectedOutcome.stateFiles].sort((left, right) => left.localeCompare(right));
  if (changedPaths.join("|") !== expectedChangedPaths.join("|")) failures.push("fixture-write-set");
  if ("rows" in scenario.expectedResult) {
    try {
      const population = JSON.parse(changedText(diagnostic, "population-result.json") ?? "null") as unknown;
      if (stableJson(population) !== stableJson(scenario.expectedResult)) failures.push("population-result");
    } catch {
      failures.push("result-json");
    }
  } else {
    try {
      const checkpoint = JSON.parse(changedText(diagnostic, "checkpoint-result.json") ?? "null") as Record<string, unknown> | null;
      const canary = JSON.parse(changedText(diagnostic, "canary-result.json") ?? "null") as Record<string, unknown> | null;
      if (checkpoint == null || checkpoint.checkpointId !== "late-validation-manifest-cache-r1" || checkpoint.checkpointStatus !== "recorded"
        || checkpoint.triggerRef !== "materially-different-failures-same-costly-late-boundary" || checkpoint.selectedRoute !== "earlier-manifest-cache-canary"
        || checkpoint.outcomeRef !== "twelve-reviewed-local-reports" || checkpoint.envelopeRef !== "disposable-local-fixture"
        || checkpoint.oracleRef !== "unchanged-twelve-report-late-validation" || checkpoint.populationRef !== "twelve-report-population-r1"
        || checkpoint.checkpointCount !== 1 || checkpoint.costlyActionRepeatCount !== 0 || checkpoint.productQuestionCount !== 0
        || checkpoint.protectedActionCount !== 0 || checkpoint.duplicateDisposition !== "suppressed-unchanged-evidence"
        || !Array.isArray(checkpoint.events) || checkpoint.events.join("|") !== CONFIGURED_EVENTS.join("|")) failures.push("checkpoint-result");
      if (canary == null || canary.status !== "passed" || canary.boundary !== "manifest-and-cache-preflight" || canary.preservedPopulation !== "twelve-report-population-r1") failures.push("canary-result");
    } catch {
      failures.push("result-json");
    }
  }
  const candidateId = typeof diagnostic.candidateId === "string" ? diagnostic.candidateId : "unknown";
  if (!SAFE_ID.test(candidateId)) failures.push("candidate-id");
  const evaluation: DeliveryCheckpointConfiguredEvaluation = {
    candidateId,
    configuredRoute,
    effectiveConfigDigest,
    evaluationDigest: "",
    failures: [...new Set(failures)].sort((left, right) => left.localeCompare(right)),
    maximumClaim: CONFIGURED_MAXIMUM_CLAIM,
    modelCalls: providerRequestCount < 0 ? 0 : providerRequestCount,
    openCodeSha256,
    openCodeVersion,
    packDigest: loaded.digest,
    resolvedRoute,
    scenarioId: scenario.id as DeliveryCheckpointConfiguredScenarioId,
    sourceDigest,
    status: failures.length === 0 ? "passed" : "failed",
  };
  evaluation.evaluationDigest = digestOf(evaluation);
  assertPrivacySafe(stableJson(evaluation), "configured delivery-checkpoint evaluation");
  return evaluation;
}

export function deliveryCheckpointConfiguredPreflight(options: {
  candidateConfigDir: string;
  executable: string;
  gitRef: string;
  repoRoot: string;
  scenarioIds?: string[];
}): Record<string, unknown> {
  if (options.gitRef !== "working-tree") throw error("sourceRef", "configured delivery-checkpoint preflight requires --source-ref working-tree");
  const loaded = loadDeliveryCheckpointConfiguredPack(options.repoRoot);
  const selectedIds = options.scenarioIds ?? [CONFIGURED_SCENARIO_IDS[0]];
  const selectedScenario = selectedIds.length === 1
    ? loaded.pack.scenarios.find((scenario) => scenario.id === selectedIds[0])
    : null;
  if (selectedScenario == null) throw error("scenarioIds", `configured delivery-checkpoint requires exactly one of ${CONFIGURED_SCENARIO_IDS.join(",")}`);
  const configDir = path.resolve(options.candidateConfigDir);
  for (const relative of ["AGENTS.md", "opencode.json"]) {
    if (!fs.existsSync(path.join(configDir, relative))) throw error("candidateConfigDir", `configured candidate is missing: ${relative}`);
  }
  const source = governedSourceIdentity(options.repoRoot, options.gitRef, loaded.pack.governedSourcePaths);
  return {
    configuredProviderRequestBound: 1,
    governedDigest: source.governedDigest,
    governedSourcePaths: loaded.pack.governedSourcePaths,
    liveAttemptGate: "bounded-observation-authorized",
    maximumClaim: CONFIGURED_MAXIMUM_CLAIM,
    mode: "preflight",
    modelCalls: 0,
    openCode: installedOpenCodeIdentity(options.executable),
    pack: loaded.pack.id,
    packDigest: loaded.digest,
    runtimeProfile: loaded.pack.runtimeProfile,
    scenarioIds: [selectedScenario.id],
    status: "ready",
  };
}

export async function captureDeliveryCheckpointConfigured(options: {
  candidateConfigDir: string;
  candidateId: string;
  evidenceRoot: string;
  executable: string;
  gitRef: string;
  repoRoot: string;
  scenarioId: string;
}): Promise<{ diagnostic: Record<string, unknown>; evaluation: DeliveryCheckpointConfiguredEvaluation }> {
  if (options.gitRef !== "working-tree") throw error("sourceRef", "configured delivery-checkpoint capture requires --source-ref working-tree");
  const loaded = loadDeliveryCheckpointConfiguredPack(options.repoRoot);
  const scenario = loaded.pack.scenarios.find((candidate) => candidate.id === options.scenarioId);
  if (scenario == null) throw error("scenarioId", `unknown configured delivery-checkpoint scenario: ${options.scenarioId}`);
  const sourceIdentity = governedSourceIdentity(options.repoRoot, options.gitRef, loaded.pack.governedSourcePaths);
  const diagnostic = await captureConfiguredDiagnostic(configuredManifest(loaded.pack, scenario), loaded.digest, {
    candidateConfigDir: options.candidateConfigDir,
    candidateId: options.candidateId,
    evidenceRoot: options.evidenceRoot,
    executable: options.executable,
    repoRoot: options.repoRoot,
    retainChangedText: true,
    sourceIdentity,
  });
  const evaluation = evaluateConfiguredDiagnostic(options.repoRoot, loaded, diagnostic);
  writeNewFile(path.join(options.evidenceRoot, "evaluation.json"), `${JSON.stringify(evaluation, null, 2)}\n`);
  return { diagnostic, evaluation };
}

export function replayDeliveryCheckpointConfigured(
  repoRoot: string,
  diagnosticPath: string,
  scenarioId: string,
): DeliveryCheckpointConfiguredEvaluation {
  const loaded = loadDeliveryCheckpointConfiguredPack(repoRoot);
  if (!loaded.pack.scenarios.some((scenario) => scenario.id === scenarioId)) throw error("scenarioId", `unknown configured delivery-checkpoint scenario: ${scenarioId}`);
  const diagnostic = readConfiguredDiagnostic(diagnosticPath);
  if (diagnostic.scenarioId !== scenarioId) throw error("scenarioId", "configured replay scenario does not match the preserved diagnostic");
  return evaluateConfiguredDiagnostic(repoRoot, loaded, diagnostic);
}
