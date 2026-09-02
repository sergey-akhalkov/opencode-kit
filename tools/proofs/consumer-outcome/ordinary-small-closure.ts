import fs from "node:fs";
import path from "node:path";

import {
  type SourceIdentity,
  ContractError,
  assertPrivacySafe,
  digestOf,
  governedSourceIdentity,
  stableJson,
  writeNewFile,
} from "./contracts.ts";

const PACK_PATH = "tools/proofs/fixtures/consumer-outcome/ordinary-small-closure-r1.json";
const PACK_ID = "ordinary-small-closure-r1";
const CLAIM_ID = "SOSC-001";
const MAXIMUM_CLAIM = "provider-free structural proof for exactly the twelve reviewed SOSC-001 seed members under the recorded seed and current governed working-tree identity only; all risk dispositions, artifact expectations, gate outcomes, and diagnostics are reviewed fixture facts, and no installed behavior, model behavior, provider compatibility, untested population, universal semantic classification, or delivery-speed claim is established";
const MEMBER_ORDER = [
  "compact-ordinary-exact",
  "full-ordinary-exact",
  "full-material",
  "full-unknown",
  "legacy-missing-metadata",
  "partial-metadata",
  "malformed-values",
  "compact-material",
  "compact-unknown",
  "stale-compact",
  "explicit-optional-mechanisms",
  "syntax-versus-prose-defects",
] as const;
const GOVERNED_SOURCE_PATHS = [
  "tools/proofs/consumer-outcome-regression.ts",
  "tools/proofs/consumer-outcome/contracts.ts",
  "tools/proofs/consumer-outcome/ordinary-small-closure.ts",
  PACK_PATH,
] as const;
const SAFE_TOKEN = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;

type ArtifactProfile = "absent" | "compact" | "full" | "invalid";
type NormalizedProfile = "compact" | "full" | "invalid" | "legacy";
type RiskDispositionKind = "absent" | "invalid" | "material" | "ordinary-small-exact" | "unknown";
type MetadataState = "complete" | "malformed" | "missing" | "partial";
type MetadataValidity = "invalid" | "valid";
type GateStatus = "blocked" | "legacy-strict" | "ready";
type OptionalMechanismState = "correlated" | "omitted";

type FactSet = {
  expected: string[];
  observed: string[];
};

type EffectFacts = {
  modelCalls: number;
  networkCalls: number;
  processCalls: number;
  providerCalls: number;
  remoteEffects: number;
  sourceWrites: number;
};

type CleanupFacts = {
  persistentTemporaryFiles: number;
  processesRemaining: number;
  sessionsRemaining: number;
  status: "complete" | "incomplete";
  terminal: boolean;
};

type ClosureObservation = {
  artifactFacts: FactSet;
  artifactProfile: ArtifactProfile;
  cleanup: CleanupFacts;
  diagnosticIds: string[];
  effectFacts: EffectFacts;
  equivalentProseAccepted: boolean;
  eventFacts: FactSet;
  gateStatus: GateStatus;
  metadataState: MetadataState;
  metadataValidity: MetadataValidity;
  mutationAuthorized: boolean;
  normalizedProfile: NormalizedProfile;
  optionalCorrelationValid: boolean;
  optionalMechanismState: OptionalMechanismState;
  parserTokensValid: boolean;
  riskDispositionKind: RiskDispositionKind;
  staleCompact: boolean;
};

type ClosureScenario = {
  id: typeof MEMBER_ORDER[number];
  observation: ClosureObservation;
  redControls: Array<{
    expectedFailures: string[];
    id: string;
    patch: Partial<ClosureObservation>;
  }>;
};

type ClosureLimits = {
  maxArtifactsPerObservation: number;
  maxDiagnosticsPerObservation: number;
  maxEventsPerObservation: number;
  maxRedControlsPerScenario: number;
  maxScenarios: number;
};

export type OrdinarySmallClosurePack = {
  claimId: typeof CLAIM_ID;
  governedSourcePaths: string[];
  id: typeof PACK_ID;
  limits: ClosureLimits;
  maximumClaim: typeof MAXIMUM_CLAIM;
  scenarios: ClosureScenario[];
  schemaVersion: 1;
};

type EvaluationRow = {
  actualFailureIds: string[];
  controlId: string | null;
  expectedFailureIds: string[];
  kind: "green" | "red";
  memberId: string;
  oracleMatched: boolean;
};

export type OrdinarySmallClosureEvaluation = {
  evaluationDigest: string;
  liveCalls: 0;
  maximumClaim: typeof MAXIMUM_CLAIM;
  memberIds: string[];
  modelCalls: 0;
  networkCalls: 0;
  packId: typeof PACK_ID;
  processCalls: 0;
  providerCalls: 0;
  rows: EvaluationRow[];
  schemaVersion: 1;
  sourceWrites: 0;
  status: "failed" | "passed";
};

export type OrdinarySmallClosureBundle = {
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
  evaluation: OrdinarySmallClosureEvaluation;
  pack: OrdinarySmallClosurePack;
  packDigest: string;
  schemaVersion: 1;
  sourceIdentity: SourceIdentity;
};

const PACK_KEYS = ["claimId", "governedSourcePaths", "id", "limits", "maximumClaim", "scenarios", "schemaVersion"] as const;
const LIMIT_KEYS = ["maxArtifactsPerObservation", "maxDiagnosticsPerObservation", "maxEventsPerObservation", "maxRedControlsPerScenario", "maxScenarios"] as const;
const SCENARIO_KEYS = ["id", "observation", "redControls"] as const;
const RED_CONTROL_KEYS = ["expectedFailures", "id", "patch"] as const;
const OBSERVATION_KEYS = ["artifactFacts", "artifactProfile", "cleanup", "diagnosticIds", "effectFacts", "equivalentProseAccepted", "eventFacts", "gateStatus", "metadataState", "metadataValidity", "mutationAuthorized", "normalizedProfile", "optionalCorrelationValid", "optionalMechanismState", "parserTokensValid", "riskDispositionKind", "staleCompact"] as const;
const FACT_SET_KEYS = ["expected", "observed"] as const;
const EFFECT_KEYS = ["modelCalls", "networkCalls", "processCalls", "providerCalls", "remoteEffects", "sourceWrites"] as const;
const CLEANUP_KEYS = ["persistentTemporaryFiles", "processesRemaining", "sessionsRemaining", "status", "terminal"] as const;
const BUNDLE_KEYS = ["bundleDigest", "candidateId", "cleanup", "effects", "evaluation", "pack", "packDigest", "schemaVersion", "sourceIdentity"] as const;
const BUNDLE_EFFECT_KEYS = ["evidenceWrites", ...EFFECT_KEYS] as const;

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
  if (typeof value !== "string" || value.length === 0 || value.length > 256 || value.includes("\0") || value.includes("\n")) {
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

function enumValue<T extends string>(value: unknown, field: string, allowed: readonly T[]): T {
  if (typeof value !== "string" || !allowed.includes(value as T)) throw error(field, `${field} has an invalid value`);
  return value as T;
}

function parseFactSet(value: unknown, field: string, maximum: number): FactSet {
  const source = record(value, field, FACT_SET_KEYS);
  return {
    expected: textArray(source.expected, `${field}.expected`, maximum),
    observed: textArray(source.observed, `${field}.observed`, maximum),
  };
}

function parseEffects(value: unknown, field: string): EffectFacts {
  const source = record(value, field, EFFECT_KEYS);
  return {
    modelCalls: integer(source.modelCalls, `${field}.modelCalls`, 0, 4),
    networkCalls: integer(source.networkCalls, `${field}.networkCalls`, 0, 4),
    processCalls: integer(source.processCalls, `${field}.processCalls`, 0, 4),
    providerCalls: integer(source.providerCalls, `${field}.providerCalls`, 0, 4),
    remoteEffects: integer(source.remoteEffects, `${field}.remoteEffects`, 0, 4),
    sourceWrites: integer(source.sourceWrites, `${field}.sourceWrites`, 0, 4),
  };
}

function parseCleanup(value: unknown, field: string): CleanupFacts {
  const source = record(value, field, CLEANUP_KEYS);
  return {
    persistentTemporaryFiles: integer(source.persistentTemporaryFiles, `${field}.persistentTemporaryFiles`, 0, 4),
    processesRemaining: integer(source.processesRemaining, `${field}.processesRemaining`, 0, 4),
    sessionsRemaining: integer(source.sessionsRemaining, `${field}.sessionsRemaining`, 0, 4),
    status: enumValue(source.status, `${field}.status`, ["complete", "incomplete"] as const),
    terminal: boolean(source.terminal, `${field}.terminal`),
  };
}

function parseObservation(value: unknown, field: string, limits: ClosureLimits): ClosureObservation {
  const source = record(value, field, OBSERVATION_KEYS);
  return {
    artifactFacts: parseFactSet(source.artifactFacts, `${field}.artifactFacts`, limits.maxArtifactsPerObservation),
    artifactProfile: enumValue(source.artifactProfile, `${field}.artifactProfile`, ["absent", "compact", "full", "invalid"] as const),
    cleanup: parseCleanup(source.cleanup, `${field}.cleanup`),
    diagnosticIds: tokenArray(source.diagnosticIds, `${field}.diagnosticIds`, limits.maxDiagnosticsPerObservation),
    effectFacts: parseEffects(source.effectFacts, `${field}.effectFacts`),
    equivalentProseAccepted: boolean(source.equivalentProseAccepted, `${field}.equivalentProseAccepted`),
    eventFacts: parseFactSet(source.eventFacts, `${field}.eventFacts`, limits.maxEventsPerObservation),
    gateStatus: enumValue(source.gateStatus, `${field}.gateStatus`, ["blocked", "legacy-strict", "ready"] as const),
    metadataState: enumValue(source.metadataState, `${field}.metadataState`, ["complete", "malformed", "missing", "partial"] as const),
    metadataValidity: enumValue(source.metadataValidity, `${field}.metadataValidity`, ["invalid", "valid"] as const),
    mutationAuthorized: boolean(source.mutationAuthorized, `${field}.mutationAuthorized`),
    normalizedProfile: enumValue(source.normalizedProfile, `${field}.normalizedProfile`, ["compact", "full", "invalid", "legacy"] as const),
    optionalCorrelationValid: boolean(source.optionalCorrelationValid, `${field}.optionalCorrelationValid`),
    optionalMechanismState: enumValue(source.optionalMechanismState, `${field}.optionalMechanismState`, ["correlated", "omitted"] as const),
    parserTokensValid: boolean(source.parserTokensValid, `${field}.parserTokensValid`),
    riskDispositionKind: enumValue(source.riskDispositionKind, `${field}.riskDispositionKind`, ["absent", "invalid", "material", "ordinary-small-exact", "unknown"] as const),
    staleCompact: boolean(source.staleCompact, `${field}.staleCompact`),
  };
}

function parsePatch(value: unknown, field: string, limits: ClosureLimits): Partial<ClosureObservation> {
  const source = record(value, field);
  const keys = Object.keys(source);
  if (keys.length === 0 || keys.some((key) => !OBSERVATION_KEYS.includes(key as typeof OBSERVATION_KEYS[number]))) {
    throw error(field, `${field} must contain one or more known observation fields`);
  }
  const result: Partial<ClosureObservation> = {};
  for (const key of keys) {
    const parsed = parseObservation({
      artifactFacts: { expected: [], observed: [] },
      artifactProfile: "absent",
      cleanup: { persistentTemporaryFiles: 0, processesRemaining: 0, sessionsRemaining: 0, status: "complete", terminal: true },
      diagnosticIds: [],
      effectFacts: { modelCalls: 0, networkCalls: 0, processCalls: 0, providerCalls: 0, remoteEffects: 0, sourceWrites: 0 },
      equivalentProseAccepted: true,
      eventFacts: { expected: [], observed: [] },
      gateStatus: "blocked",
      metadataState: "missing",
      metadataValidity: "valid",
      mutationAuthorized: false,
      normalizedProfile: "legacy",
      optionalCorrelationValid: true,
      optionalMechanismState: "omitted",
      parserTokensValid: true,
      riskDispositionKind: "absent",
      staleCompact: false,
      [key]: source[key],
    }, field, limits);
    Object.assign(result, { [key]: parsed[key as keyof ClosureObservation] });
  }
  return result;
}

function expectedMetadataState(observation: ClosureObservation): MetadataState {
  if (observation.artifactProfile === "invalid" || observation.riskDispositionKind === "invalid") return "malformed";
  const profileAbsent = observation.artifactProfile === "absent";
  const riskAbsent = observation.riskDispositionKind === "absent";
  if (profileAbsent && riskAbsent) return "missing";
  if (profileAbsent || riskAbsent) return "partial";
  return "complete";
}

function expectedNormalizedProfile(observation: ClosureObservation): NormalizedProfile {
  const metadataState = expectedMetadataState(observation);
  if (metadataState === "missing") return "legacy";
  if (metadataState !== "complete") return "invalid";
  return observation.artifactProfile as "compact" | "full";
}

function expectedDiagnostics(observation: ClosureObservation): string[] {
  const failures: string[] = [];
  const metadataState = expectedMetadataState(observation);
  if (metadataState === "partial") failures.push("metadata-partial");
  if (metadataState === "malformed") failures.push("metadata-malformed");
  if (observation.artifactProfile === "compact" && (observation.riskDispositionKind === "material" || observation.riskDispositionKind === "unknown")) {
    failures.push("artifact-profile-risk-conflict");
  }
  if (observation.riskDispositionKind === "unknown") failures.push("risk-disposition-unknown");
  if (observation.artifactProfile === "compact" && observation.staleCompact) failures.push("compact-stale");
  if (observation.optionalMechanismState === "correlated" && !observation.optionalCorrelationValid) failures.push("optional-mechanism-correlation");
  if (!observation.parserTokensValid) failures.push("parser-token-defect");
  if (!observation.equivalentProseAccepted) failures.push("equivalent-prose-rejected");
  return failures;
}

function consistencyFailures(observation: ClosureObservation): string[] {
  const failures: string[] = [];
  const metadataState = expectedMetadataState(observation);
  if (observation.metadataState !== metadataState) failures.push("metadata-state");
  if (observation.metadataValidity !== (metadataState === "partial" || metadataState === "malformed" ? "invalid" : "valid")) failures.push("metadata-validity");
  if (observation.normalizedProfile !== expectedNormalizedProfile(observation)) failures.push("normalized-profile");
  const diagnostics = expectedDiagnostics(observation);
  if (observation.diagnosticIds.join("\n") !== diagnostics.join("\n")) failures.push("diagnostic-ids");
  const gateStatus: GateStatus = diagnostics.length > 0 ? "blocked" : observation.normalizedProfile === "legacy" ? "legacy-strict" : "ready";
  if (observation.gateStatus !== gateStatus) failures.push("gate-status");
  if (observation.mutationAuthorized !== (gateStatus === "ready")) failures.push("mutation-authority");
  if (observation.artifactFacts.expected.join("\n") !== observation.artifactFacts.observed.join("\n")) failures.push("artifact-facts");
  if (observation.eventFacts.expected.join("\n") !== observation.eventFacts.observed.join("\n")) failures.push("event-facts");
  if (Object.values(observation.effectFacts).some((value) => value !== 0)) failures.push("effect-facts");
  if (observation.cleanup.status !== "complete" || !observation.cleanup.terminal || observation.cleanup.persistentTemporaryFiles !== 0 || observation.cleanup.processesRemaining !== 0 || observation.cleanup.sessionsRemaining !== 0) {
    failures.push("cleanup-facts");
  }
  return failures;
}

function observationFailures(observed: ClosureObservation, expected: ClosureObservation): string[] {
  const failures: string[] = [];
  if (observed.artifactProfile !== expected.artifactProfile) failures.push("artifact-profile");
  if (observed.riskDispositionKind !== expected.riskDispositionKind) failures.push("risk-disposition-kind");
  if (observed.metadataState !== expected.metadataState) failures.push("metadata-state");
  if (observed.metadataValidity !== expected.metadataValidity) failures.push("metadata-validity");
  if (observed.normalizedProfile !== expected.normalizedProfile) failures.push("normalized-profile");
  if (observed.staleCompact !== expected.staleCompact) failures.push("stale-compact");
  if (observed.optionalMechanismState !== expected.optionalMechanismState) failures.push("optional-mechanism-state");
  if (observed.optionalCorrelationValid !== expected.optionalCorrelationValid) failures.push("optional-correlation");
  if (observed.parserTokensValid !== expected.parserTokensValid) failures.push("parser-tokens");
  if (observed.equivalentProseAccepted !== expected.equivalentProseAccepted) failures.push("equivalent-prose");
  if (observed.gateStatus !== expected.gateStatus) failures.push("gate-status");
  if (observed.mutationAuthorized !== expected.mutationAuthorized) failures.push("mutation-authority");
  if (stableJson(observed.artifactFacts) !== stableJson(expected.artifactFacts)) failures.push("artifact-facts");
  if (stableJson(observed.eventFacts) !== stableJson(expected.eventFacts)) failures.push("event-facts");
  if (observed.diagnosticIds.join("\n") !== expected.diagnosticIds.join("\n")) failures.push("diagnostic-ids");
  if (stableJson(observed.effectFacts) !== stableJson(expected.effectFacts)) failures.push("effect-facts");
  if (stableJson(observed.cleanup) !== stableJson(expected.cleanup)) failures.push("cleanup-facts");
  return failures;
}

function parseLimits(value: unknown): ClosureLimits {
  const source = record(value, "ordinarySmallClosurePack.limits", LIMIT_KEYS);
  const limits = {
    maxArtifactsPerObservation: integer(source.maxArtifactsPerObservation, "ordinarySmallClosurePack.limits.maxArtifactsPerObservation", 1, 16),
    maxDiagnosticsPerObservation: integer(source.maxDiagnosticsPerObservation, "ordinarySmallClosurePack.limits.maxDiagnosticsPerObservation", 1, 8),
    maxEventsPerObservation: integer(source.maxEventsPerObservation, "ordinarySmallClosurePack.limits.maxEventsPerObservation", 1, 16),
    maxRedControlsPerScenario: integer(source.maxRedControlsPerScenario, "ordinarySmallClosurePack.limits.maxRedControlsPerScenario", 1, 8),
    maxScenarios: integer(source.maxScenarios, "ordinarySmallClosurePack.limits.maxScenarios", 1, 16),
  };
  if (limits.maxScenarios !== MEMBER_ORDER.length) throw error("ordinarySmallClosurePack.limits.maxScenarios", "scenario limit must equal the reviewed population");
  return limits;
}

function parseScenario(value: unknown, index: number, limits: ClosureLimits): ClosureScenario {
  const field = `ordinarySmallClosurePack.scenarios[${index}]`;
  const source = record(value, field, SCENARIO_KEYS);
  const id = token(source.id, `${field}.id`);
  if (id !== MEMBER_ORDER[index]) throw error(`${field}.id`, "scenario order or identity drifted");
  const observation = parseObservation(source.observation, `${field}.observation`, limits);
  const consistency = consistencyFailures(observation);
  if (consistency.length > 0) throw error(`${field}.observation`, `reviewed observation is inconsistent: ${consistency.join(", ")}`);
  if (!Array.isArray(source.redControls) || source.redControls.length === 0 || source.redControls.length > limits.maxRedControlsPerScenario) {
    throw error(`${field}.redControls`, "red controls are empty or over limit");
  }
  const redControls = source.redControls.map((value, controlIndex) => {
    const controlField = `${field}.redControls[${controlIndex}]`;
    const control = record(value, controlField, RED_CONTROL_KEYS);
    const patch = parsePatch(control.patch, `${controlField}.patch`, limits);
    const expectedFailures = tokenArray(control.expectedFailures, `${controlField}.expectedFailures`, OBSERVATION_KEYS.length);
    const actualFailures = observationFailures({ ...structuredClone(observation), ...patch }, observation);
    if (actualFailures.length === 0 || expectedFailures.join("\n") !== actualFailures.join("\n")) {
      throw error(`${controlField}.expectedFailures`, "red-control failures do not match the explicit observation patch");
    }
    return { expectedFailures, id: token(control.id, `${controlField}.id`), patch };
  });
  if (new Set(redControls.map((control) => control.id)).size !== redControls.length) throw error(`${field}.redControls`, "red-control ids must be unique");
  return { id: id as typeof MEMBER_ORDER[number], observation, redControls };
}

export function parseOrdinarySmallClosurePack(value: unknown): OrdinarySmallClosurePack {
  const source = record(value, "ordinarySmallClosurePack", PACK_KEYS);
  if (source.schemaVersion !== 1 || source.id !== PACK_ID || source.claimId !== CLAIM_ID || source.maximumClaim !== MAXIMUM_CLAIM) {
    throw error("ordinarySmallClosurePack", "ordinary-small-closure pack identity drifted");
  }
  const governedSourcePaths = pathArray(source.governedSourcePaths, "ordinarySmallClosurePack.governedSourcePaths");
  if (governedSourcePaths.join("\n") !== GOVERNED_SOURCE_PATHS.join("\n")) throw error("ordinarySmallClosurePack.governedSourcePaths", "governed source order drifted");
  const limits = parseLimits(source.limits);
  if (!Array.isArray(source.scenarios) || source.scenarios.length !== limits.maxScenarios) throw error("ordinarySmallClosurePack.scenarios", "scenario population is incomplete");
  const scenarios = source.scenarios.map((scenario, index) => parseScenario(scenario, index, limits));
  return { claimId: CLAIM_ID, governedSourcePaths, id: PACK_ID, limits, maximumClaim: MAXIMUM_CLAIM, scenarios, schemaVersion: 1 };
}

export function loadOrdinarySmallClosurePack(repoRoot: string): { pack: OrdinarySmallClosurePack; packDigest: string; seedByteDigest: string } {
  let source: string;
  try {
    source = fs.readFileSync(path.join(repoRoot, PACK_PATH), "utf8");
  } catch (cause) {
    throw error("ordinarySmallClosurePack", "ordinary-small-closure seed is unreadable", cause);
  }
  assertPrivacySafe(source, "ordinary-small-closure seed");
  let parsed: unknown;
  try {
    parsed = JSON.parse(source);
  } catch (cause) {
    throw error("ordinarySmallClosurePack", "ordinary-small-closure seed is not valid JSON", cause);
  }
  const pack = parseOrdinarySmallClosurePack(parsed);
  return { pack, packDigest: digestOf(pack), seedByteDigest: digestOf(source) };
}

export function evaluateOrdinarySmallClosurePack(pack: OrdinarySmallClosurePack): OrdinarySmallClosureEvaluation {
  const rows: EvaluationRow[] = [];
  for (const scenario of pack.scenarios) {
    const greenFailures = consistencyFailures(scenario.observation);
    rows.push({
      actualFailureIds: greenFailures,
      controlId: null,
      expectedFailureIds: [],
      kind: "green",
      memberId: scenario.id,
      oracleMatched: greenFailures.length === 0,
    });
    for (const control of scenario.redControls) {
      const actualFailures = observationFailures({ ...structuredClone(scenario.observation), ...control.patch }, scenario.observation);
      rows.push({
        actualFailureIds: actualFailures,
        controlId: control.id,
        expectedFailureIds: control.expectedFailures,
        kind: "red",
        memberId: scenario.id,
        oracleMatched: actualFailures.join("\n") === control.expectedFailures.join("\n"),
      });
    }
  }
  const evaluation: OrdinarySmallClosureEvaluation = {
    evaluationDigest: "",
    liveCalls: 0,
    maximumClaim: MAXIMUM_CLAIM,
    memberIds: pack.scenarios.map((scenario) => scenario.id),
    modelCalls: 0,
    networkCalls: 0,
    packId: PACK_ID,
    processCalls: 0,
    providerCalls: 0,
    rows,
    schemaVersion: 1,
    sourceWrites: 0,
    status: rows.every((row) => row.oracleMatched) ? "passed" : "failed",
  };
  evaluation.evaluationDigest = digestOf(evaluation);
  assertPrivacySafe(stableJson(evaluation), "ordinary-small-closure evaluation");
  return evaluation;
}

function sealBundle(value: Omit<OrdinarySmallClosureBundle, "bundleDigest">): OrdinarySmallClosureBundle {
  const bundle: OrdinarySmallClosureBundle = { ...value, bundleDigest: "" };
  assertPrivacySafe(stableJson(bundle), "ordinary-small-closure bundle");
  bundle.bundleDigest = digestOf(bundle);
  return bundle;
}

function parseBundle(value: unknown, repoRoot: string): OrdinarySmallClosureBundle {
  const source = record(value, "ordinarySmallClosureBundle", BUNDLE_KEYS);
  if (source.schemaVersion !== 1) throw error("ordinarySmallClosureBundle.schemaVersion", "unsupported ordinary-small-closure bundle schema");
  const pack = parseOrdinarySmallClosurePack(source.pack);
  const current = loadOrdinarySmallClosurePack(repoRoot);
  const packDigest = digestOf(pack);
  if (source.packDigest !== packDigest || current.packDigest !== packDigest || stableJson(current.pack) !== stableJson(pack)) {
    throw error("ordinarySmallClosureBundle.packDigest", "ordinary-small-closure pack digest mismatch");
  }
  const expectedEvaluation = evaluateOrdinarySmallClosurePack(pack);
  if (stableJson(source.evaluation) !== stableJson(expectedEvaluation)) throw error("ordinarySmallClosureBundle.evaluation", "ordinary-small-closure evaluation mismatch");
  const candidateId = token(source.candidateId, "ordinarySmallClosureBundle.candidateId");
  const effects = record(source.effects, "ordinarySmallClosureBundle.effects", BUNDLE_EFFECT_KEYS);
  if (effects.evidenceWrites !== 2 || EFFECT_KEYS.some((key) => effects[key] !== 0)) throw error("ordinarySmallClosureBundle.effects", "ordinary-small-closure effects mismatch");
  const cleanup = record(source.cleanup, "ordinarySmallClosureBundle.cleanup", CLEANUP_KEYS);
  if (cleanup.status !== "complete" || cleanup.terminal !== true || cleanup.persistentTemporaryFiles !== 0 || cleanup.processesRemaining !== 0 || cleanup.sessionsRemaining !== 0) {
    throw error("ordinarySmallClosureBundle.cleanup", "ordinary-small-closure cleanup mismatch");
  }
  const currentSource = governedSourceIdentity(repoRoot, "working-tree", pack.governedSourcePaths);
  if (stableJson(source.sourceIdentity) !== stableJson(currentSource)) throw error("ordinarySmallClosureBundle.sourceIdentity", "ordinary-small-closure governed source identity mismatch");
  const bundle = source as unknown as OrdinarySmallClosureBundle;
  bundle.candidateId = candidateId;
  const unsealed = structuredClone(bundle);
  unsealed.bundleDigest = "";
  if (bundle.bundleDigest !== digestOf(unsealed)) throw error("ordinarySmallClosureBundle.bundleDigest", "ordinary-small-closure bundle digest mismatch");
  assertPrivacySafe(stableJson(bundle), "ordinary-small-closure bundle");
  return bundle;
}

export function ordinarySmallClosurePreflight(repoRoot: string, gitRef: string): Record<string, unknown> {
  if (gitRef !== "working-tree") throw error("sourceRef", "ordinary-small-closure preflight requires --source-ref working-tree");
  const loaded = loadOrdinarySmallClosurePack(repoRoot);
  const source = governedSourceIdentity(repoRoot, gitRef, loaded.pack.governedSourcePaths);
  const evaluation = evaluateOrdinarySmallClosurePack(loaded.pack);
  return {
    governedDigest: source.governedDigest,
    governedSourcePaths: loaded.pack.governedSourcePaths,
    liveCalls: 0,
    maximumClaim: MAXIMUM_CLAIM,
    memberCount: loaded.pack.scenarios.length,
    memberIds: loaded.pack.scenarios.map((scenario) => scenario.id),
    mode: "preflight",
    modelCalls: 0,
    networkCalls: 0,
    pack: "ordinary-small-closure",
    packId: PACK_ID,
    processCalls: 0,
    providerCalls: 0,
    scenarioDigest: loaded.packDigest,
    seedIdentity: { digest: loaded.seedByteDigest, path: PACK_PATH },
    sourceWrites: 0,
    status: evaluation.status === "passed" ? "ready" : "failed",
  };
}

export function materializeOrdinarySmallClosureBundle(options: {
  candidateId: string;
  evidenceRoot: string;
  gitRef: string;
  repoRoot: string;
}): { bundle: OrdinarySmallClosureBundle; evaluation: OrdinarySmallClosureEvaluation } {
  if (options.gitRef !== "working-tree") throw error("sourceRef", "ordinary-small-closure materialization requires --source-ref working-tree");
  if (!SAFE_TOKEN.test(options.candidateId)) throw error("candidateId", "candidate id must be a safe token");
  if (!path.isAbsolute(options.evidenceRoot)) throw error("evidenceRoot", "ordinary-small-closure evidence root must be absolute");
  if (fs.existsSync(options.evidenceRoot)) throw error("evidenceRoot", "ordinary-small-closure evidence root must be create-new");
  const loaded = loadOrdinarySmallClosurePack(options.repoRoot);
  const sourceIdentity = governedSourceIdentity(options.repoRoot, options.gitRef, loaded.pack.governedSourcePaths);
  const evaluation = evaluateOrdinarySmallClosurePack(loaded.pack);
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
    throw error("evidenceRoot", "ordinary-small-closure materialization failed", cause);
  }
  return { bundle, evaluation };
}

export function replayOrdinarySmallClosureBundle(repoRoot: string, bundlePath: string): { bundle: OrdinarySmallClosureBundle; evaluation: OrdinarySmallClosureEvaluation } {
  let source: string;
  try {
    source = fs.readFileSync(bundlePath, "utf8");
  } catch (cause) {
    throw error("ordinarySmallClosureBundle", "ordinary-small-closure bundle is unreadable", cause);
  }
  assertPrivacySafe(source, "ordinary-small-closure bundle");
  let parsed: unknown;
  try {
    parsed = JSON.parse(source);
  } catch (cause) {
    throw error("ordinarySmallClosureBundle", "ordinary-small-closure bundle is not valid JSON", cause);
  }
  const bundle = parseBundle(parsed, repoRoot);
  return { bundle, evaluation: bundle.evaluation };
}
