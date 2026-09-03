import fs from "node:fs";
import path from "node:path";

import { assertPrivacySafe, ContractError, digestOf, redactPrivacyMarkers, requireExactKeys } from "./contracts.ts";
import type { ProspectiveConsequenceCapture } from "./capture.ts";

export const PROSPECTIVE_CONSEQUENCE_REHEARSAL_PACK_PATH = "tools/proofs/fixtures/consumer-outcome/prospective-consequence-rehearsal-r1.json";
export const PROSPECTIVE_CONSEQUENCE_REHEARSAL_MAXIMUM_CLAIM = "in the reviewed installed environment and PCR-001 population, the candidate arm completes reconstruction before candidate materialization, resumes the same verified reviewer context for initial comparison, uses a fresh corrected-candidate reviewer only with the still-current frozen reconstruction, reports evidence-backed distinctions through the existing readiness episode while unsupported consequence chains stay unknown, and does not add the rehearsal to the reviewed Ordinary Small or exact substitution controls; it does not prove discovery superiority over candidate-first review, retroactive separation for existing candidates, exhaustive foresight, universal abstraction quality, or correctness outside the exercised evidence and identities";

export const PROSPECTIVE_CONSEQUENCE_REHEARSAL_MEMBER_ORDER = [
  "unlabeled-actor-distinction",
  "state-lifecycle-distinction",
  "ownership-recovery-distinction",
  "material-inline-frame",
  "insufficient-evidence",
  "premature-candidate-materialization",
  "unverified-continuation",
  "corrected-review-freshness",
  "stale-reconstruction",
  "ordinary-small-direct",
  "exact-substitution-owner",
] as const;

const GOVERNED_SOURCE_PATHS = [
  "global/AGENTS.md",
  "global/principles-of-work.md",
  "global/agents/implementation-readiness-reviewer.md",
  "global/commands/opsx-propose.md",
  "global/commands/opsx-apply.md",
  "global/skills/behavioral-substitution-qualification/SKILL.md",
  "global/skills/change-ready-sdlc/SKILL.md",
  "global/skills/openspec-propose/SKILL.md",
  "global/skills/openspec-apply-change/SKILL.md",
  "global/model-profiles/quality-independent.json",
  "profiles/core.json",
  "profiles/all.json",
] as const;

const PACK_KEYS = [
  "schemaVersion",
  "id",
  "profile",
  "runtimeProfile",
  "configuredProviderRequestBound",
  "maximumClaim",
  "memberOrder",
  "governedSourcePaths",
  "scenarios",
] as const;
const SCENARIO_KEYS = [
  "id",
  "candidateSemanticOracle",
  "rawContext",
  "request",
  "initialFiles",
  "candidate",
  "permissions",
  "allowedEffects",
  "forbiddenEffects",
  "configuredProviderRequestBound",
  "taskCallBound",
  "expected",
] as const;
const RAW_CONTEXT_KEYS = ["outcome", "operatingEnvelope", "nonGoals", "evidence"] as const;
const CANDIDATE_KEYS = ["kind", "path", "content", "sentinel", "correctedContent", "materializeAfter"] as const;
const PERMISSION_KEYS = ["allow", "deny"] as const;
const ARM_BOUND_KEYS = ["baseline", "candidate"] as const;
const EXPECTED_KEYS = ["baseline", "candidate"] as const;
const OBSERVATION_KEYS = [
  "route",
  "protocolMode",
  "candidateStateAtReconstruction",
  "initialComparisonContinuity",
  "correctedReviewFreshness",
  "challengeCount",
  "taskCallCount",
  "terminalState",
  "consequenceIds",
  "unknownReasons",
] as const;

type PcrArm = "baseline" | "candidate";
type PcrCandidateKind = "file" | "inline" | "none";
type PcrRoute = "behavioral-substitution" | "direct" | "pre-authoring-separated" | "single-stage";
type PcrProtocolMode = "not-applicable" | "pre-authoring-separated" | "single-stage";
type PcrCandidateState = "absent" | "not-applicable" | "present" | "unknown";
type PcrContinuity = "not-applicable" | "unknown" | "verified";
type PcrSemanticOracle = "evidence-bounded" | "not-applicable" | "required-consequence" | "required-unknown";

export type ProspectiveConsequenceObservation = {
  candidateStateAtReconstruction: PcrCandidateState;
  challengeCount: number;
  consequenceIds: string[];
  correctedReviewFreshness: PcrContinuity;
  initialComparisonContinuity: PcrContinuity;
  protocolMode: PcrProtocolMode;
  route: PcrRoute;
  taskCallCount: number;
  terminalState: "closed" | "not-applicable" | "unknown";
  unknownReasons: string[];
};

export type ProspectiveConsequenceScenario = {
  allowedEffects: string[];
  candidate: {
    content: string;
    correctedContent: string;
    kind: PcrCandidateKind;
    materializeAfter: "not-applicable" | "reconstruction";
    path: string;
    sentinel: string;
  };
  candidateSemanticOracle: PcrSemanticOracle;
  configuredProviderRequestBound: number;
  expected: Record<PcrArm, ProspectiveConsequenceObservation>;
  forbiddenEffects: string[];
  id: string;
  initialFiles: string[];
  permissions: { allow: string[]; deny: string[] };
  rawContext: {
    evidence: string[];
    nonGoals: string[];
    operatingEnvelope: string;
    outcome: string;
  };
  request: string;
  taskCallBound: Record<PcrArm, number>;
};

export type ProspectiveConsequenceRehearsalPack = {
  configuredProviderRequestBound: number;
  governedSourcePaths: string[];
  id: "prospective-consequence-rehearsal-r1";
  maximumClaim: string;
  memberOrder: string[];
  profile: "quality-independent";
  runtimeProfile: "core";
  scenarios: ProspectiveConsequenceScenario[];
  schemaVersion: 1;
};

function requiredString(value: unknown, label: string): string {
  if (typeof value !== "string" || value.trim() === "") throw new ContractError(label, `${label} must be a non-empty string`);
  return value;
}

function stringArray(value: unknown, label: string): string[] {
  if (!Array.isArray(value) || value.some((entry) => typeof entry !== "string" || entry.trim() === "")) {
    throw new ContractError(label, `${label} must be a non-empty-string array`);
  }
  if (new Set(value).size !== value.length) throw new ContractError(label, `${label} must not contain duplicates`);
  return value as string[];
}

function boundedInteger(value: unknown, label: string, min: number, max: number): number {
  if (!Number.isInteger(value) || (value as number) < min || (value as number) > max) {
    throw new ContractError(label, `${label} must be an integer in [${min}, ${max}]`);
  }
  return value as number;
}

function oneOf<T extends string>(value: unknown, options: readonly T[], label: string): T {
  const text = requiredString(value, label);
  if (!options.includes(text as T)) throw new ContractError(label, `${label} must be one of ${options.join(",")}`);
  return text as T;
}

function containedRelativePath(value: unknown, label: string): string {
  const text = requiredString(value, label).replaceAll("\\", "/");
  if (path.isAbsolute(text) || text.includes("\0") || text.split("/").includes("..") || text.startsWith("/")) {
    throw new ContractError(label, `${label} escapes its fixture root`);
  }
  return text;
}

function parseObservation(value: unknown, label: string): ProspectiveConsequenceObservation {
  const record = requireExactKeys(value, OBSERVATION_KEYS, label);
  const observation: ProspectiveConsequenceObservation = {
    candidateStateAtReconstruction: oneOf(record.candidateStateAtReconstruction, ["absent", "not-applicable", "present", "unknown"], `${label}.candidateStateAtReconstruction`),
    challengeCount: boundedInteger(record.challengeCount, `${label}.challengeCount`, 0, 2),
    consequenceIds: stringArray(record.consequenceIds, `${label}.consequenceIds`),
    correctedReviewFreshness: oneOf(record.correctedReviewFreshness, ["not-applicable", "unknown", "verified"], `${label}.correctedReviewFreshness`),
    initialComparisonContinuity: oneOf(record.initialComparisonContinuity, ["not-applicable", "unknown", "verified"], `${label}.initialComparisonContinuity`),
    protocolMode: oneOf(record.protocolMode, ["not-applicable", "pre-authoring-separated", "single-stage"], `${label}.protocolMode`),
    route: oneOf(record.route, ["behavioral-substitution", "direct", "pre-authoring-separated", "single-stage"], `${label}.route`),
    taskCallCount: boundedInteger(record.taskCallCount, `${label}.taskCallCount`, 0, 3),
    terminalState: oneOf(record.terminalState, ["closed", "not-applicable", "unknown"], `${label}.terminalState`),
    unknownReasons: stringArray(record.unknownReasons, `${label}.unknownReasons`),
  };
  if (observation.terminalState === "unknown" && observation.unknownReasons.length === 0) {
    throw new ContractError(`${label}.unknownReasons`, `${label}.unknownReasons must explain Terminal State unknown`);
  }
  if (observation.terminalState !== "unknown" && observation.unknownReasons.length !== 0) {
    throw new ContractError(`${label}.unknownReasons`, `${label}.unknownReasons must be empty unless Terminal State is unknown`);
  }
  if (observation.protocolMode === "pre-authoring-separated" && observation.terminalState === "closed") {
    if (observation.candidateStateAtReconstruction !== "absent") throw new ContractError(`${label}.candidateStateAtReconstruction`, `${label} closed separation requires candidate absence`);
    if (observation.initialComparisonContinuity !== "verified") throw new ContractError(`${label}.initialComparisonContinuity`, `${label} closed separation requires verified initial continuity`);
  }
  if (observation.challengeCount === 2 && observation.terminalState === "closed" && observation.correctedReviewFreshness !== "verified") {
    throw new ContractError(`${label}.correctedReviewFreshness`, `${label} closed challenge count two requires verified corrected-review freshness`);
  }
  return observation;
}

export function parseProspectiveConsequenceObservation(value: unknown): ProspectiveConsequenceObservation {
  return parseObservation(value, "prospectiveConsequenceObservation");
}

function actorVisibleText(scenario: ProspectiveConsequenceScenario): string {
  return JSON.stringify({
    initialFiles: scenario.initialFiles,
    rawContext: scenario.rawContext,
    request: scenario.request,
  });
}

export function parseProspectiveConsequenceRehearsalPack(value: unknown): ProspectiveConsequenceRehearsalPack {
  const source = requireExactKeys(value, PACK_KEYS, "prospectiveConsequenceRehearsalPack");
  if (source.schemaVersion !== 1) throw new ContractError("prospectiveConsequenceRehearsalPack.schemaVersion", "prospectiveConsequenceRehearsalPack.schemaVersion must be 1");
  if (source.id !== "prospective-consequence-rehearsal-r1") throw new ContractError("prospectiveConsequenceRehearsalPack.id", "prospectiveConsequenceRehearsalPack.id is invalid");
  if (source.profile !== "quality-independent") throw new ContractError("prospectiveConsequenceRehearsalPack.profile", "prospectiveConsequenceRehearsalPack.profile must be quality-independent");
  if (source.runtimeProfile !== "core") throw new ContractError("prospectiveConsequenceRehearsalPack.runtimeProfile", "prospectiveConsequenceRehearsalPack.runtimeProfile must be core");
  if (source.maximumClaim !== PROSPECTIVE_CONSEQUENCE_REHEARSAL_MAXIMUM_CLAIM) throw new ContractError("prospectiveConsequenceRehearsalPack.maximumClaim", "prospectiveConsequenceRehearsalPack.maximumClaim is invalid");
  const memberOrder = stringArray(source.memberOrder, "prospectiveConsequenceRehearsalPack.memberOrder");
  if (memberOrder.join(",") !== PROSPECTIVE_CONSEQUENCE_REHEARSAL_MEMBER_ORDER.join(",")) throw new ContractError("prospectiveConsequenceRehearsalPack.memberOrder", "prospectiveConsequenceRehearsalPack.memberOrder must match PCR-001");
  const governedSourcePaths = stringArray(source.governedSourcePaths, "prospectiveConsequenceRehearsalPack.governedSourcePaths");
  if (governedSourcePaths.join(",") !== GOVERNED_SOURCE_PATHS.join(",")) throw new ContractError("prospectiveConsequenceRehearsalPack.governedSourcePaths", "prospectiveConsequenceRehearsalPack.governedSourcePaths must match the reviewed production path set");
  if (!Array.isArray(source.scenarios) || source.scenarios.length !== memberOrder.length) throw new ContractError("prospectiveConsequenceRehearsalPack.scenarios", `prospectiveConsequenceRehearsalPack.scenarios must contain exactly ${memberOrder.length} records`);

  const scenarios = source.scenarios.map((value, index): ProspectiveConsequenceScenario => {
    const label = `prospectiveConsequenceRehearsalPack.scenarios[${index}]`;
    const row = requireExactKeys(value, SCENARIO_KEYS, label);
    const raw = requireExactKeys(row.rawContext, RAW_CONTEXT_KEYS, `${label}.rawContext`);
    const candidateRecord = requireExactKeys(row.candidate, CANDIDATE_KEYS, `${label}.candidate`);
    const permissions = requireExactKeys(row.permissions, PERMISSION_KEYS, `${label}.permissions`);
    const taskCallBound = requireExactKeys(row.taskCallBound, ARM_BOUND_KEYS, `${label}.taskCallBound`);
    const expected = requireExactKeys(row.expected, EXPECTED_KEYS, `${label}.expected`);
    const candidateKind = oneOf(candidateRecord.kind, ["file", "inline", "none"], `${label}.candidate.kind`);
    const candidateSemanticOracle = oneOf(row.candidateSemanticOracle, ["evidence-bounded", "not-applicable", "required-consequence", "required-unknown"], `${label}.candidateSemanticOracle`);
    const candidatePath = candidateKind === "file"
      ? containedRelativePath(candidateRecord.path, `${label}.candidate.path`)
      : requiredString(candidateRecord.path, `${label}.candidate.path`);
    const scenario: ProspectiveConsequenceScenario = {
      allowedEffects: stringArray(row.allowedEffects, `${label}.allowedEffects`),
      candidate: {
        content: requiredString(candidateRecord.content, `${label}.candidate.content`),
        correctedContent: requiredString(candidateRecord.correctedContent, `${label}.candidate.correctedContent`),
        kind: candidateKind,
        materializeAfter: oneOf(candidateRecord.materializeAfter, ["not-applicable", "reconstruction"], `${label}.candidate.materializeAfter`),
        path: candidatePath,
        sentinel: requiredString(candidateRecord.sentinel, `${label}.candidate.sentinel`),
      },
      candidateSemanticOracle,
      configuredProviderRequestBound: boundedInteger(row.configuredProviderRequestBound, `${label}.configuredProviderRequestBound`, 1, 3),
      expected: {
        baseline: parseObservation(expected.baseline, `${label}.expected.baseline`),
        candidate: parseObservation(expected.candidate, `${label}.expected.candidate`),
      },
      forbiddenEffects: stringArray(row.forbiddenEffects, `${label}.forbiddenEffects`),
      id: requiredString(row.id, `${label}.id`),
      initialFiles: stringArray(row.initialFiles, `${label}.initialFiles`).map((entry, fileIndex) => containedRelativePath(entry, `${label}.initialFiles[${fileIndex}]`)),
      permissions: {
        allow: stringArray(permissions.allow, `${label}.permissions.allow`),
        deny: stringArray(permissions.deny, `${label}.permissions.deny`),
      },
      rawContext: {
        evidence: stringArray(raw.evidence, `${label}.rawContext.evidence`),
        nonGoals: stringArray(raw.nonGoals, `${label}.rawContext.nonGoals`),
        operatingEnvelope: requiredString(raw.operatingEnvelope, `${label}.rawContext.operatingEnvelope`),
        outcome: requiredString(raw.outcome, `${label}.rawContext.outcome`),
      },
      request: requiredString(row.request, `${label}.request`),
      taskCallBound: {
        baseline: boundedInteger(taskCallBound.baseline, `${label}.taskCallBound.baseline`, 0, 3),
        candidate: boundedInteger(taskCallBound.candidate, `${label}.taskCallBound.candidate`, 0, 3),
      },
    };

    if (scenario.id !== memberOrder[index]) throw new ContractError(`${label}.id`, `${label}.id must match PCR-001 member order`);
    if (scenario.expected.baseline.taskCallCount > scenario.taskCallBound.baseline || scenario.expected.candidate.taskCallCount > scenario.taskCallBound.candidate) {
      throw new ContractError(`${label}.taskCallBound`, `${label}.taskCallBound must contain the reviewed task-call expectations`);
    }
    if (scenario.configuredProviderRequestBound !== Math.max(1, scenario.expected.candidate.taskCallCount)) {
      throw new ContractError(`${label}.configuredProviderRequestBound`, `${label}.configuredProviderRequestBound must match the reviewed candidate root-turn bound`);
    }
    if (scenario.candidate.kind === "none" && scenario.candidate.materializeAfter !== "not-applicable") throw new ContractError(`${label}.candidate.materializeAfter`, `${label} no-candidate control must be not-applicable`);
    if (scenario.candidate.kind !== "none" && scenario.candidate.materializeAfter !== "reconstruction") throw new ContractError(`${label}.candidate.materializeAfter`, `${label} candidate materialization must follow reconstruction`);
    if (scenario.candidate.kind === "file" && scenario.initialFiles.includes(scenario.candidate.path)) throw new ContractError(`${label}.initialFiles`, `${label} materializes the file candidate before reconstruction`);
    if ((scenario.candidate.kind === "none") !== (scenario.candidateSemanticOracle === "not-applicable")) {
      throw new ContractError(`${label}.candidateSemanticOracle`, `${label}.candidateSemanticOracle must be not-applicable exactly for a no-candidate control`);
    }
    const candidateExpected = scenario.expected.candidate;
    if (scenario.candidateSemanticOracle === "required-consequence"
      && (candidateExpected.terminalState !== "closed" || candidateExpected.consequenceIds.length === 0)) {
      throw new ContractError(`${label}.candidateSemanticOracle`, `${label}.candidateSemanticOracle requires a reviewed closed consequence expectation`);
    }
    if ((scenario.candidateSemanticOracle === "required-unknown" || scenario.candidateSemanticOracle === "evidence-bounded")
      && (candidateExpected.terminalState !== "unknown" || candidateExpected.consequenceIds.length !== 0)) {
      throw new ContractError(`${label}.candidateSemanticOracle`, `${label}.candidateSemanticOracle requires a reviewed unknown fallback expectation`);
    }

    const visible = actorVisibleText(scenario);
    assertPrivacySafe(visible, `${label}.actorVisible`);
    if (/representedRisk|correctedAnswer|correctedArtifact|expectedObservations?/u.test(visible)) {
      throw new ContractError(`${label}.actorVisible`, `${label}.actorVisible contains a forbidden answer-bearing field`);
    }
    for (const forbidden of [scenario.candidate.sentinel, scenario.candidate.content, scenario.candidate.correctedContent]) {
      if (forbidden !== "none" && visible.includes(forbidden)) throw new ContractError(`${label}.actorVisible`, `${label}.actorVisible contains candidate or corrected-candidate material`);
    }
    for (const observation of [scenario.expected.baseline, scenario.expected.candidate]) {
      for (const consequenceId of observation.consequenceIds) {
        if (visible.includes(consequenceId)) throw new ContractError(`${label}.actorVisible`, `${label}.actorVisible contains evaluator-only expected label ${consequenceId}`);
      }
    }
    return scenario;
  });

  const expectedProviderRequestBound = scenarios.length + scenarios.reduce((sum, scenario) => sum + scenario.configuredProviderRequestBound, 0);
  const configuredProviderRequestBound = boundedInteger(source.configuredProviderRequestBound, "prospectiveConsequenceRehearsalPack.configuredProviderRequestBound", expectedProviderRequestBound, expectedProviderRequestBound);
  return {
    configuredProviderRequestBound,
    governedSourcePaths,
    id: "prospective-consequence-rehearsal-r1",
    maximumClaim: PROSPECTIVE_CONSEQUENCE_REHEARSAL_MAXIMUM_CLAIM,
    memberOrder,
    profile: "quality-independent",
    runtimeProfile: "core",
    scenarios,
    schemaVersion: 1,
  };
}

export function loadProspectiveConsequenceRehearsalPack(repoRoot: string): { digest: string; pack: ProspectiveConsequenceRehearsalPack } {
  const pack = parseProspectiveConsequenceRehearsalPack(JSON.parse(fs.readFileSync(path.join(repoRoot, PROSPECTIVE_CONSEQUENCE_REHEARSAL_PACK_PATH), "utf8")));
  return { digest: digestOf(pack), pack };
}

export function prospectiveConsequenceRehearsalPreflight(pack: ProspectiveConsequenceRehearsalPack, packDigest = digestOf(pack)): Record<string, unknown> {
  return {
    candidateMaterializationPlans: pack.scenarios.map((scenario) => ({ id: scenario.id, kind: scenario.candidate.kind, materializeAfter: scenario.candidate.materializeAfter })),
    configuredProviderRequestBound: pack.configuredProviderRequestBound,
    evaluatorOnlyObservationCount: pack.scenarios.reduce((sum, scenario) => sum + scenario.expected.baseline.consequenceIds.length + scenario.expected.candidate.consequenceIds.length, 0),
    maximumClaim: pack.maximumClaim,
    modelCalls: 0,
    packDigest,
    packId: pack.id,
    permissionRows: pack.scenarios.map((scenario) => ({ id: scenario.id, allow: scenario.permissions.allow, deny: scenario.permissions.deny })),
    scenarioIds: pack.memberOrder,
    semanticOracles: pack.scenarios.map((scenario) => ({ id: scenario.id, candidate: scenario.candidateSemanticOracle })),
    status: "ready",
    taskCallBounds: pack.scenarios.map((scenario) => ({ id: scenario.id, ...scenario.taskCallBound })),
  };
}

export type ProspectiveConsequenceRehearsalBundle = {
  bundleDigest: string;
  candidateId: string;
  captures: ProspectiveConsequenceCapture[];
  gitRef: string;
  packDigest: string;
  packId: "prospective-consequence-rehearsal-r1";
  schemaVersion: 1;
  sourceIdentity: { governedDigest: string; sourceRef: string };
};

export type ProspectiveConsequenceRehearsalLane = {
  arm: "baseline" | "candidate";
  candidateId: string;
  captures: ProspectiveConsequenceCapture[];
  laneDigest: string;
  packDigest: string;
  packId: "prospective-consequence-rehearsal-r1";
  schemaVersion: 1;
  sourceIdentity: { governedDigest: string; sourceRef: string };
};

export type ProspectiveConsequenceEvaluationRow = {
  actual: ProspectiveConsequenceObservation;
  arm: "baseline" | "candidate";
  expected: ProspectiveConsequenceObservation;
  failureIds: string[];
  oracleMatched: boolean;
  semanticOracle: PcrSemanticOracle;
  scenarioId: string;
  taskCallBound: number;
  taskCallCount: number;
};

export type ProspectiveConsequenceRehearsalEvaluation = {
  baselineDiscoveredConsequenceCount: number;
  candidateDiscoveredConsequenceCount: number;
  candidateId: string;
  evaluationDigest: string;
  failureIds: string[];
  maximumClaim: string;
  modelCalls: 0;
  providerCalls: 0;
  rows: ProspectiveConsequenceEvaluationRow[];
  status: "failed" | "passed";
};

export function sealProspectiveConsequenceRehearsalBundle(input: Omit<ProspectiveConsequenceRehearsalBundle, "bundleDigest" | "packId" | "schemaVersion">): ProspectiveConsequenceRehearsalBundle {
  assertPrivacySafe(JSON.stringify(input), "prospectiveConsequenceRehearsalBundle");
  const bundle: ProspectiveConsequenceRehearsalBundle = {
    ...input,
    bundleDigest: "",
    packId: "prospective-consequence-rehearsal-r1",
    schemaVersion: 1,
  };
  bundle.bundleDigest = digestOf({ ...bundle, bundleDigest: "" });
  return bundle;
}

export function sealProspectiveConsequenceRehearsalLane(input: Omit<ProspectiveConsequenceRehearsalLane, "laneDigest" | "packId" | "schemaVersion">): ProspectiveConsequenceRehearsalLane {
  const redactPrivateRoots = (value: unknown): unknown => {
    if (typeof value === "string") {
      const privateSafe = value
        .replace(/[A-Za-z]:\\+Users\\+[^\\\s]+/gi, "<home>")
        .replace(/Users\\+[^\\\s]+\\+/gi, "<home>\\")
        .replace(/\/home\/[^/\s]+/g, "<home>")
        .replace(/\/Users\/[^/\s]+/g, "<home>");
      return redactPrivacyMarkers(privateSafe).text;
    }
    if (Array.isArray(value)) return value.map(redactPrivateRoots);
    if (value != null && typeof value === "object") {
      return Object.fromEntries(Object.entries(value).map(([key, item]) => [redactPrivateRoots(key) as string, redactPrivateRoots(item)]));
    }
    return value;
  };
  const captures = redactPrivateRoots(input.captures) as ProspectiveConsequenceCapture[];
  assertPrivacySafe(JSON.stringify({ ...input, captures }), "prospectiveConsequenceRehearsalLane");
  const lane: ProspectiveConsequenceRehearsalLane = {
    ...input,
    captures,
    laneDigest: "",
    packId: "prospective-consequence-rehearsal-r1",
    schemaVersion: 1,
  };
  lane.laneDigest = digestOf({ ...lane, laneDigest: "" });
  return lane;
}

export function readProspectiveConsequenceRehearsalLane(lanePath: string): ProspectiveConsequenceRehearsalLane {
  const source = requireExactKeys(JSON.parse(fs.readFileSync(lanePath, "utf8")), ["arm", "candidateId", "captures", "laneDigest", "packDigest", "packId", "schemaVersion", "sourceIdentity"], "prospectiveConsequenceRehearsalLane");
  if (source.schemaVersion !== 1 || source.packId !== "prospective-consequence-rehearsal-r1" || (source.arm !== "baseline" && source.arm !== "candidate")) {
    throw new ContractError("prospectiveConsequenceRehearsalLane", "unsupported lane identity");
  }
  if (typeof source.candidateId !== "string" || typeof source.laneDigest !== "string" || typeof source.packDigest !== "string" || !Array.isArray(source.captures)) {
    throw new ContractError("prospectiveConsequenceRehearsalLane", "lane fields have invalid types");
  }
  const sourceIdentity = requireExactKeys(source.sourceIdentity, ["governedDigest", "sourceRef"], "prospectiveConsequenceRehearsalLane.sourceIdentity");
  if (typeof sourceIdentity.governedDigest !== "string" || typeof sourceIdentity.sourceRef !== "string") throw new ContractError("prospectiveConsequenceRehearsalLane.sourceIdentity", "source identity fields must be strings");
  const lane = source as unknown as ProspectiveConsequenceRehearsalLane;
  if (lane.laneDigest !== digestOf({ ...lane, laneDigest: "" })) throw new ContractError("prospectiveConsequenceRehearsalLane.laneDigest", "lane digest mismatch");
  return lane;
}

export function readProspectiveConsequenceRehearsalBundle(bundlePath: string): ProspectiveConsequenceRehearsalBundle {
  const source = requireExactKeys(JSON.parse(fs.readFileSync(bundlePath, "utf8")), ["bundleDigest", "candidateId", "captures", "gitRef", "packDigest", "packId", "schemaVersion", "sourceIdentity"], "prospectiveConsequenceRehearsalBundle");
  if (source.schemaVersion !== 1 || source.packId !== "prospective-consequence-rehearsal-r1") throw new ContractError("prospectiveConsequenceRehearsalBundle", "unsupported bundle identity");
  if (typeof source.bundleDigest !== "string" || typeof source.candidateId !== "string" || typeof source.gitRef !== "string" || typeof source.packDigest !== "string") {
    throw new ContractError("prospectiveConsequenceRehearsalBundle", "bundle identity fields must be strings");
  }
  if (!Array.isArray(source.captures)) throw new ContractError("prospectiveConsequenceRehearsalBundle.captures", "captures must be an array");
  const sourceIdentity = requireExactKeys(source.sourceIdentity, ["governedDigest", "sourceRef"], "prospectiveConsequenceRehearsalBundle.sourceIdentity");
  if (typeof sourceIdentity.governedDigest !== "string" || typeof sourceIdentity.sourceRef !== "string") {
    throw new ContractError("prospectiveConsequenceRehearsalBundle.sourceIdentity", "source identity fields must be strings");
  }
  return source as unknown as ProspectiveConsequenceRehearsalBundle;
}

export function evaluateProspectiveConsequenceRehearsal(
  pack: ProspectiveConsequenceRehearsalPack,
  bundle: ProspectiveConsequenceRehearsalBundle,
): ProspectiveConsequenceRehearsalEvaluation {
  const failures: string[] = [];
  if (bundle.packId !== pack.id) failures.push("pack-id-mismatch");
  if (bundle.packDigest !== digestOf(pack)) failures.push("pack-digest-mismatch");
  if (bundle.bundleDigest !== digestOf({ ...bundle, bundleDigest: "" })) failures.push("bundle-digest-mismatch");
  const capturesByKey = new Map<string, ProspectiveConsequenceCapture>();
  for (const capture of bundle.captures) {
    const key = `${capture.scenarioId}:${capture.arm}`;
    if (capturesByKey.has(key)) failures.push(`duplicate-capture:${key}`);
    capturesByKey.set(key, capture);
  }
  const rows: ProspectiveConsequenceEvaluationRow[] = [];
  for (const scenarioId of pack.memberOrder) {
    const scenario = pack.scenarios.find((item) => item.id === scenarioId)!;
    for (const arm of ["baseline", "candidate"] as const) {
      const expected = scenario.expected[arm];
      const capture = capturesByKey.get(`${scenarioId}:${arm}`);
      if (capture == null) {
        failures.push(`missing-capture:${scenarioId}:${arm}`);
        continue;
      }
      const route = scenario.candidate.kind === "none"
        ? capture.observation?.route ?? expected.route
        : arm === "baseline" ? "single-stage" : "pre-authoring-separated";
      const protocolMode = scenario.candidate.kind === "none"
        ? capture.observation?.protocolMode ?? expected.protocolMode
        : arm === "baseline" ? "single-stage" : "pre-authoring-separated";
      const candidateStateAtReconstruction = route === "direct" || route === "behavioral-substitution"
        ? "not-applicable"
        : capture.candidateStateAtReconstruction;
      const initialComparisonContinuity = route === "direct" || route === "behavioral-substitution" || arm === "baseline"
        ? "not-applicable"
        : capture.initialComparisonContinuity;
      const correctedReviewFreshness = route === "direct" || route === "behavioral-substitution" || arm === "baseline"
        ? "not-applicable"
        : capture.correctedReviewFreshness;
      const challengeCount = route === "direct" || route === "behavioral-substitution" ? 0 : correctedReviewFreshness === "verified" ? 2 : 1;
      const terminalState = capture.observation?.terminalState ?? "unknown";
      const consequenceIds = capture.observation?.consequenceIds ?? [];
      const mappedUnknown = capture.failure === "candidate-present-at-reconstruction"
        ? "candidate-materialized-before-reconstruction"
        : capture.failure === "reconstruction-identity-unverified" || capture.failure === "initial-continuation-unverified"
          ? "initial-continuation-unverified"
          : capture.failure === "frozen-reconstruction-stale"
            ? "frozen-reconstruction-stale"
            : capture.failure;
      const unknownReasons = capture.observation?.unknownReasons ?? (mappedUnknown == null ? [] : [mappedUnknown]);
      const actual: ProspectiveConsequenceObservation = {
        candidateStateAtReconstruction,
        challengeCount,
        consequenceIds,
        correctedReviewFreshness,
        initialComparisonContinuity,
        protocolMode,
        route,
        taskCallCount: capture.taskInvocations.length,
        terminalState,
        unknownReasons,
      };
      const failureIds: string[] = [];
      if (actual.candidateStateAtReconstruction !== expected.candidateStateAtReconstruction) failureIds.push("candidate-separation-mismatch");
      if (arm === "candidate" && actual.candidateStateAtReconstruction === "present") failureIds.push("candidate-visible-during-reconstruction");
      if (actual.initialComparisonContinuity !== expected.initialComparisonContinuity) failureIds.push("initial-continuation-mismatch");
      if (expected.initialComparisonContinuity === "verified" && actual.initialComparisonContinuity !== "verified") failureIds.push("initial-continuation-unverified");
      if (actual.correctedReviewFreshness !== expected.correctedReviewFreshness) failureIds.push("corrected-review-freshness-mismatch");
      if (expected.correctedReviewFreshness === "verified" && actual.correctedReviewFreshness !== "verified") failureIds.push("corrected-review-not-fresh");
      if (actual.route !== expected.route) failureIds.push("route-mismatch");
      if (actual.protocolMode !== expected.protocolMode) failureIds.push("protocol-mode-mismatch");
      if (actual.challengeCount !== expected.challengeCount) failureIds.push("challenge-count-mismatch");
      if (actual.taskCallCount > scenario.taskCallBound[arm]) failureIds.push("unexpected-task-repeat");
      if (actual.taskCallCount !== expected.taskCallCount) failureIds.push("task-call-count-mismatch");
      if (arm === "candidate") {
        if (scenario.candidateSemanticOracle === "required-consequence") {
          if (actual.terminalState !== "closed") failureIds.push("terminal-state-mismatch");
          if (actual.consequenceIds.length === 0) failureIds.push("missing-evidence-backed-consequence");
          if (actual.unknownReasons.length > 0) failureIds.push("unexpected-unknown-containment");
        } else if (scenario.candidateSemanticOracle === "required-unknown") {
          if (actual.terminalState !== "unknown") failureIds.push("terminal-state-mismatch");
          if (actual.consequenceIds.length > 0) failureIds.push("unexpected-consequence");
          if (actual.unknownReasons.length === 0) failureIds.push("unknown-containment-missing");
        } else if (scenario.candidateSemanticOracle === "evidence-bounded") {
          const closedConsequence = actual.terminalState === "closed" && actual.consequenceIds.length > 0 && actual.unknownReasons.length === 0;
          const explicitUnknown = actual.terminalState === "unknown" && actual.consequenceIds.length === 0 && actual.unknownReasons.length > 0;
          if (!closedConsequence && !explicitUnknown) failureIds.push("semantic-containment-mismatch");
        }
      }
      const stageOneVisible = JSON.stringify(capture.stageOneModelVisible);
      if (expected.protocolMode !== "not-applicable") {
        if (capture.stageOneModelVisible.prompt === ""
          || capture.stageOneModelVisible.toolResults.length === 0
          || scenario.initialFiles.some((file) => !capture.stageOneModelVisible.files.some((entry) => entry.path === file))) {
          failureIds.push("stage-one-stream-incomplete");
        }
        const candidateVisible = scenario.candidate.kind === "file" && stageOneVisible.includes(scenario.candidate.path)
          || scenario.candidate.sentinel !== "none" && stageOneVisible.includes(scenario.candidate.sentinel)
          || scenario.candidate.content !== "none" && stageOneVisible.includes(scenario.candidate.content);
        if (expected.candidateStateAtReconstruction === "absent" && candidateVisible) failureIds.push("candidate-visible-during-reconstruction");
        if (expected.candidateStateAtReconstruction === "present" && !candidateVisible) failureIds.push("candidate-separation-mismatch");
        if (expected.candidateStateAtReconstruction === "absent" && scenario.candidate.kind === "file"
          && capture.preReconstructionFiles.some((entry) => entry.path === scenario.candidate.path)) failureIds.push("candidate-visible-during-reconstruction");
        if (expected.candidateStateAtReconstruction === "absent" && scenario.candidate.kind === "file"
          && capture.stageOneModelVisible.files.some((entry) => entry.path === scenario.candidate.path)) failureIds.push("candidate-visible-during-reconstruction");
        if (expected.initialComparisonContinuity === "verified") {
          const reconstructionIndex = capture.eventOrder.indexOf("task:reconstruction");
          const materializationIndex = capture.eventOrder.indexOf(`candidate:${scenario.candidate.kind}`);
          const comparisonIndex = capture.eventOrder.indexOf("task:initial-comparison");
          if (reconstructionIndex < 0 || materializationIndex <= reconstructionIndex || comparisonIndex <= materializationIndex) failureIds.push("candidate-chronology-mismatch");
        }
      }
      if (capture.configuredProviderRequestCount > scenario.configuredProviderRequestBound) failureIds.push("provider-request-bound-exceeded");
      if ((expected.route !== "direct" && expected.route !== "behavioral-substitution") && capture.environmentIdentity == null) failureIds.push("environment-identity-missing");
      if (capture.forbiddenEffects.some((effect) => effect.observed)) failureIds.push("forbidden-effect-observed");
      if (!capture.cleanup.complete) failureIds.push("cleanup-incomplete");
      const uniqueFailureIds = [...new Set(failureIds)].sort();
      for (const failureId of uniqueFailureIds) failures.push(`${scenarioId}:${arm}:sample-${capture.sampleIndex}:${failureId}`);
      rows.push({
        actual,
        arm,
        expected,
        failureIds: uniqueFailureIds,
        oracleMatched: uniqueFailureIds.length === 0,
        semanticOracle: scenario.candidateSemanticOracle,
        scenarioId,
        taskCallBound: scenario.taskCallBound[arm],
        taskCallCount: capture.taskInvocations.length,
      });
    }
  }
  for (const scenarioId of pack.memberOrder) {
    const baselineIdentity = capturesByKey.get(`${scenarioId}:baseline`)?.environmentIdentity;
    const candidateIdentity = capturesByKey.get(`${scenarioId}:candidate`)?.environmentIdentity;
    if (baselineIdentity != null && candidateIdentity != null && JSON.stringify(baselineIdentity) !== JSON.stringify(candidateIdentity)) {
      failures.push(`${scenarioId}:matched-environment-identity-mismatch`);
    }
  }
  const extraCaptureKeys = [...capturesByKey.keys()].filter((key) => !pack.scenarios.some((scenario) => key === `${scenario.id}:baseline` || key === `${scenario.id}:candidate`));
  for (const key of extraCaptureKeys) failures.push(`unexpected-capture:${key}`);
  const normalizedFailures = [...new Set(failures)].sort();
  const evaluation = {
    baselineDiscoveredConsequenceCount: rows.filter((row) => row.arm === "baseline").reduce((sum, row) => sum + row.actual.consequenceIds.length, 0),
    candidateDiscoveredConsequenceCount: rows.filter((row) => row.arm === "candidate").reduce((sum, row) => sum + row.actual.consequenceIds.length, 0),
    candidateId: bundle.candidateId,
    evaluationDigest: "",
    failureIds: normalizedFailures,
    maximumClaim: pack.maximumClaim,
    modelCalls: 0 as const,
    providerCalls: 0 as const,
    rows,
    status: normalizedFailures.length === 0 ? "passed" as const : "failed" as const,
  };
  evaluation.evaluationDigest = digestOf({ ...evaluation, evaluationDigest: "" });
  return evaluation;
}
