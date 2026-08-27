import fs from "node:fs";
import path from "node:path";
import {
  type Arm,
  type BaselinePointer,
  type BoundedFalsificationObservation,
  type BoundedFalsificationScenarioExpectation,
  type CaptureBundle,
  type CandidateRequest,
  type ComplexityFacadeObservation,
  type ComplexityFacadeScenarioExpectation,
  type DecisionGapPack,
  type EnvironmentIdentity,
  type EvaluationResult,
  type ExpectedDecision,
  type Expectation,
  type FoundationIntegrityObservation,
  type FoundationIntegrityScenarioExpectation,
  type FrictionField,
  type FrictionVector,
  type RegressionManifest,
  type SampleEvidence,
  type SourceIdentity,
  type StatusScopeDecision,
  type StatusScopeDecisionSet,
  ContractError,
  BOUNDED_FALSIFICATION_OBSERVATION_KEYS,
  COMPLEXITY_FACADE_OBSERVATION_KEYS,
  FRICTION_FIELDS,
  FOUNDATION_INTEGRITY_OBSERVATION_KEYS,
  SAMPLE_BYTE_LIMIT,
  CAPTURE_BYTE_LIMIT,
  SCHEMA_VERSION,
  STATUS_SCOPE_DECISION_KEYS,
  assertPrivacySafe,
  bundleByteLength,
  containsPrivatePath,
  defaultRedactions,
  digestOf,
  redactText,
  emptyFriction,
  evaluatorDigest,
  loadBaselinePointer,
  loadManifest,
  median,
  parseCandidateRequest,
  parseBoundedFalsificationObservation,
  parseComplexityFacadeObservation,
  parseFoundationIntegrityObservation,
  parseStatusScopeDecisionSet,
  privacyMarkers,
  stableJson,
} from "./contracts.ts";

const CRITICAL_FIELDS = ["cleanup", "forbiddenEffects", "friction", "permissions", "proof", "validation"] as const;

function environmentDigest(identity: EnvironmentIdentity): string {
  return digestOf(identity);
}

function compareEnvironment(left: EnvironmentIdentity, right: EnvironmentIdentity): string[] {
  const mismatches: string[] = [];
  for (const key of Object.keys(left).sort() as Array<keyof EnvironmentIdentity>) {
    if (left[key] !== right[key]) mismatches.push(String(key));
  }
  return mismatches;
}

function compareSource(left: SourceIdentity, right: SourceIdentity): string[] {
  if (left.governedDigest === right.governedDigest && left.gitRef === right.gitRef && left.kind === right.kind) return [];
  const names = new Set([...left.pathDigests.map((row) => row.path), ...right.pathDigests.map((row) => row.path)]);
  const changed: string[] = [];
  for (const name of [...names].sort((a, b) => a.localeCompare(b))) {
    const baseline = left.pathDigests.find((row) => row.path === name)?.sha256 ?? "absent";
    const current = right.pathDigests.find((row) => row.path === name)?.sha256 ?? "absent";
    if (baseline !== current) changed.push(`${name}:${baseline.slice(0, 12)}:${current.slice(0, 12)}`);
  }
  return changed;
}

function sampleComplete(sample: SampleEvidence): string[] {
  const missing: string[] = [];
  if (sample.cleanup.complete !== true || sample.cleanup.error != null) missing.push("cleanup");
  if (sample.permissions.violations.length > 0) missing.push("permissions");
  if (!Array.isArray(sample.forbiddenEffects) || sample.forbiddenEffects.length === 0) missing.push("forbiddenEffects");
  if (sample.forbiddenEffects.some((row) => row.observed)) missing.push("forbiddenEffects");
  if (sample.validation.status == null) missing.push("validation");
  if (sample.proof.status == null) missing.push("proof");
  for (const field of FRICTION_FIELDS) {
    if (!Number.isInteger(sample.friction[field]) || sample.friction[field] < 0) missing.push(`friction.${field}`);
  }
  return missing;
}

function outcomeHolds(sample: SampleEvidence, scenario: RegressionManifest["scenarios"][number]): string[] {
  const failures: string[] = [];
  const fileSet = new Set(sample.files.map((row) => row.path));
  for (const required of scenario.expectedOutcome.stateFiles) {
    if (!fileSet.has(required)) failures.push(`outcome.stateFiles.${required}`);
  }
  if (sample.command.status !== scenario.expectedOutcome.exitCode) failures.push("outcome.exitCode");
  for (const snippet of scenario.expectedOutcome.stdoutIncludes) {
    if (!sample.command.stdout.includes(snippet)) failures.push("outcome.stdout");
  }
  if (sample.validation.status !== 0) failures.push("validation.exitCode");
  if (sample.proof.status !== scenario.proofExpectations.exitCode) failures.push("proof.exitCode");
  for (const snippet of scenario.proofExpectations.stdoutIncludes) {
    if (!sample.proof.stdout.includes(snippet)) failures.push("proof.stdout");
  }
  return [...new Set(failures)];
}

function scanPrivacy(sample: SampleEvidence): string[] {
  const text = stableJson(sample);
  const hits: string[] = [];
  for (const marker of privacyMarkers()) {
    if (marker.test(text)) hits.push("secret-marker");
  }
  if (containsPrivatePath(text)) hits.push("private-path");
  try {
    assertPrivacySafe(text, "sample");
  } catch (error) {
    if (error instanceof ContractError) hits.push(error.field);
  }
  return [...new Set(hits)];
}

function groupSamples(bundle: CaptureBundle, arm: Arm, scenarioId: string): SampleEvidence[] {
  return bundle.samples
    .filter((sample) => sample.arm === arm && sample.scenarioId === scenarioId)
    .sort((left, right) => left.sampleIndex - right.sampleIndex);
}

function mediansFor(samples: SampleEvidence[], expectedCount: number): FrictionVector {
  const next = emptyFriction();
  for (const field of FRICTION_FIELDS) {
    next[field] = median(samples.map((sample) => sample.friction[field]), expectedCount);
  }
  return next;
}

function result(partial: Omit<EvaluationResult, "digest" | "schemaVersion">): EvaluationResult {
  const value: EvaluationResult = { ...partial, digest: "", schemaVersion: SCHEMA_VERSION };
  value.digest = digestOf({ ...value, digest: "" });
  return value;
}

export function verifyBundleIntegrity(bundle: CaptureBundle, rawText?: string): void {
  if (bundle.schemaVersion !== SCHEMA_VERSION) throw new ContractError("bundle.schemaVersion", "bundle schema is invalid");
  const expected = bundle.samples.reduce((sum, sample) => sum + Buffer.byteLength(stableJson(sample), "utf8"), 0);
  if (bundle.byteLength !== expected) {
    throw new ContractError("bundle.byteLength", "bundle hash or schema does not match recorded inventory");
  }
  if (rawText != null && Buffer.byteLength(rawText, "utf8") > CAPTURE_BYTE_LIMIT) {
    throw new ContractError("bundle.byteLength", "bundle exceeds the reviewed capture bound");
  }
  for (const sample of bundle.samples) {
    if (sample.schemaVersion !== SCHEMA_VERSION) throw new ContractError("sample.schemaVersion", "sample schema is invalid");
    const expected = digestOf({ ...sample, hashes: { sample: "" } });
    if (sample.hashes.sample !== expected) throw new ContractError("sample.hashes", "sample hash does not match recorded inventory");
    if (sample.diagnostics.truncatedFields.some((field) => CRITICAL_FIELDS.includes(field as (typeof CRITICAL_FIELDS)[number]) || field.startsWith("friction") || field === "outcome")) {
      throw new ContractError(sample.diagnostics.truncatedFields[0] ?? "truncated", "acceptance-critical field is truncated");
    }
    if (Buffer.byteLength(stableJson(sample), "utf8") > SAMPLE_BYTE_LIMIT) {
      throw new ContractError("sample.byteLength", "sample exceeds the reviewed byte bound");
    }
  }
}

export function evaluateBundle(input: {
  baseline: CaptureBundle;
  candidate?: CaptureBundle;
  expectation: Expectation | "baseline-establishment";
  manifest: RegressionManifest;
}): EvaluationResult {
  verifyBundleIntegrity(input.baseline);
  const sourceDigest = input.baseline.sourceIdentity.governedDigest;
  const envByScenario = new Map<string, EnvironmentIdentity>();
  const reasons: string[] = [];
  for (const sample of input.baseline.samples) {
    const current = envByScenario.get(sample.scenarioId);
    if (current == null) envByScenario.set(sample.scenarioId, sample.environmentIdentity);
    else {
      const envMismatch = compareEnvironment(current, sample.environmentIdentity);
      if (envMismatch.length > 0) reasons.push(`environment:${envMismatch.join(",")}`);
    }
    reasons.push(...sampleComplete(sample).map((field) => `baseline.${sample.scenarioId}.${sample.sampleIndex}.${field}`));
    reasons.push(...scanPrivacy(sample).map((field) => `baseline.${sample.scenarioId}.${sample.sampleIndex}.${field}`));
    const scenario = input.manifest.scenarios.find((row) => row.id === sample.scenarioId);
    if (scenario == null) reasons.push(`baseline.unknown-scenario.${sample.scenarioId}`);
    else reasons.push(...outcomeHolds(sample, scenario).map((field) => `baseline.${sample.scenarioId}.${sample.sampleIndex}.${field}`));
    const scenarioBound = input.manifest.scenarios.find((row) => row.id === sample.scenarioId);
    if (scenarioBound != null && sample.friction.configuredProviderRequestCount > scenarioBound.configuredProviderRequestBound) {
      reasons.push(`baseline.${sample.scenarioId}.${sample.sampleIndex}.provider-bound`);
    }
  }

  const baselineMedians: Record<string, FrictionVector> = {};
  for (const scenario of input.manifest.scenarios) {
    const samples = groupSamples(input.baseline, "baseline", scenario.id);
    if (samples.length !== input.manifest.sampleCount) reasons.push(`baseline.${scenario.id}.sampleCount`);
    else baselineMedians[scenario.id] = mediansFor(samples, input.manifest.sampleCount);
  }

  const firstEnv = input.baseline.samples[0]?.environmentIdentity;
  if (firstEnv == null) {
    return result({
      baselineMedians: {},
      candidateMedians: null,
      environmentDigest: "",
      expectation: input.expectation,
      improvedField: null,
      reasons: ["missing-environment"],
      scenarioDigest: input.baseline.scenarioDigest,
      sourceDigest,
      status: "blocked",
    });
  }
  if (input.expectation === "baseline-establishment") {
    const blocked = reasons.some((reason) => reason.includes("cleanup") || reason.includes("forbidden") || reason.includes("permissions") || reason.includes("secret") || reason.includes("private-path") || reason.includes("environment") || reason.includes("truncated"));
    const failed = reasons.some((reason) => reason.includes("outcome") || reason.includes("validation") || reason.includes("proof"));
    return result({
      baselineMedians,
      candidateMedians: null,
      environmentDigest: environmentDigest(firstEnv),
      expectation: "baseline-establishment",
      improvedField: null,
      reasons,
      scenarioDigest: input.baseline.scenarioDigest,
      sourceDigest,
      status: blocked ? "blocked" : failed ? "failed" : "baseline-established",
    });
  }

  if (input.candidate == null) {
    return result({
      baselineMedians,
      candidateMedians: null,
      environmentDigest: environmentDigest(firstEnv),
      expectation: input.expectation,
      improvedField: null,
      reasons: [...reasons, "missing-candidate"],
      scenarioDigest: input.baseline.scenarioDigest,
      sourceDigest,
      status: "blocked",
    });
  }
  verifyBundleIntegrity(input.candidate);
  for (const sample of input.candidate.samples) {
    const expected = envByScenario.get(sample.scenarioId);
    if (expected == null) continue;
    const envMismatch = compareEnvironment(expected, sample.environmentIdentity);
    if (envMismatch.length > 0) {
      return result({
        baselineMedians,
        candidateMedians: null,
        environmentDigest: environmentDigest(firstEnv),
        expectation: input.expectation,
        improvedField: null,
        reasons: [`environment:${envMismatch.join(",")}`],
        scenarioDigest: input.baseline.scenarioDigest,
        sourceDigest,
        status: "blocked",
      });
    }
  }
  for (const sample of input.candidate.samples) {
    reasons.push(...sampleComplete(sample).map((field) => `candidate.${sample.scenarioId}.${sample.sampleIndex}.${field}`));
    reasons.push(...scanPrivacy(sample).map((field) => `candidate.${sample.scenarioId}.${sample.sampleIndex}.${field}`));
    const scenario = input.manifest.scenarios.find((row) => row.id === sample.scenarioId);
    if (scenario == null) reasons.push(`candidate.unknown-scenario.${sample.scenarioId}`);
    else {
      reasons.push(...outcomeHolds(sample, scenario).map((field) => `candidate.${sample.scenarioId}.${sample.sampleIndex}.${field}`));
      if (sample.friction.configuredProviderRequestCount > scenario.configuredProviderRequestBound) {
        reasons.push(`candidate.${sample.scenarioId}.${sample.sampleIndex}.provider-bound`);
      }
    }
  }

  const unknown = reasons.filter((reason) => reason.includes("cleanup") || reason.includes("forbiddenEffects") || reason.includes("permissions") || reason.includes("secret") || reason.includes("private-path"));
  if (unknown.length > 0) {
    return result({
      baselineMedians,
      candidateMedians: null,
      environmentDigest: environmentDigest(firstEnv),
      expectation: input.expectation,
      improvedField: null,
      reasons,
      scenarioDigest: input.baseline.scenarioDigest,
      sourceDigest,
      status: "blocked",
    });
  }
  const outcomeFailures = reasons.filter((reason) => reason.includes("outcome") || reason.includes("validation") || reason.includes("proof"));
  if (outcomeFailures.length > 0) {
    return result({
      baselineMedians,
      candidateMedians: null,
      environmentDigest: environmentDigest(firstEnv),
      expectation: input.expectation,
      improvedField: null,
      reasons,
      scenarioDigest: input.baseline.scenarioDigest,
      sourceDigest,
      status: "failed",
    });
  }

  const candidateMedians: Record<string, FrictionVector> = {};
  let improved: EvaluationResult["improvedField"] = null;
  for (const scenario of input.manifest.scenarios) {
    const samples = groupSamples(input.candidate, "candidate", scenario.id);
    if (samples.length !== input.manifest.sampleCount) {
      return result({
        baselineMedians,
        candidateMedians: null,
        environmentDigest: environmentDigest(firstEnv),
        expectation: input.expectation,
        improvedField: null,
        reasons: [...reasons, `candidate.${scenario.id}.sampleCount`],
        scenarioDigest: input.baseline.scenarioDigest,
        sourceDigest,
        status: "blocked",
      });
    }
    candidateMedians[scenario.id] = mediansFor(samples, input.manifest.sampleCount);
    const baseline = baselineMedians[scenario.id];
    for (const field of FRICTION_FIELDS) {
      if (candidateMedians[scenario.id][field] > baseline[field]) {
        reasons.push(`friction-regression:${scenario.id}:${field}:${baseline[field]}:${candidateMedians[scenario.id][field]}`);
      } else if (candidateMedians[scenario.id][field] < baseline[field] && improved == null) {
        improved = { baseline: baseline[field], candidate: candidateMedians[scenario.id][field], field, scenarioId: scenario.id };
      }
    }
  }
  if (reasons.some((reason) => reason.startsWith("friction-regression:"))) {
    return result({
      baselineMedians,
      candidateMedians,
      environmentDigest: environmentDigest(firstEnv),
      expectation: input.expectation,
      improvedField: null,
      reasons,
      scenarioDigest: input.baseline.scenarioDigest,
      sourceDigest,
      status: "failed",
    });
  }
  if (input.expectation === "improvement" && improved == null) {
    return result({
      baselineMedians,
      candidateMedians,
      environmentDigest: environmentDigest(firstEnv),
      expectation: input.expectation,
      improvedField: null,
      reasons: [...reasons, "no-strict-friction-improvement"],
      scenarioDigest: input.baseline.scenarioDigest,
      sourceDigest,
      status: "failed",
    });
  }
  return result({
    baselineMedians,
    candidateMedians,
    environmentDigest: environmentDigest(firstEnv),
    expectation: input.expectation,
    improvedField: input.expectation === "improvement" ? improved : null,
    reasons,
    scenarioDigest: input.baseline.scenarioDigest,
    sourceDigest,
    status: input.expectation === "improvement" ? "passed-improvement" : "passed-no-regression",
  });
}

export type DecisionGapEvaluation = {
  decisionOracles: Array<{
    arm: Arm;
    expected: DecisionGapPack["expectedDecisions"][string];
    observed: (DecisionGapPack["expectedDecisions"][string] & { caseId: string }) | null;
    failures: string[];
    passed: boolean;
    sampleIndex: number;
    scenarioId: string;
  }>;
  digest: string;
  evaluatorIdentity?: {
    capture: { baseline: string; candidate: string | null };
    terminalReplay: string;
  };
  evaluation: EvaluationResult;
  maximumClaim: string;
  foundationIntegrityOracles?: Array<{
    arm: Arm;
    expected: FoundationIntegrityObservation;
    failures: string[];
    observed: FoundationIntegrityObservation | null;
    passed: boolean;
    sampleIndex: number;
    scenarioId: string;
  }>;
  foundationIntegrityRows?: Array<{
    arm: Arm;
    expectedStatus: "supported" | "unknown";
    failures: string[];
    memberId: string;
    observedStatus: "supported" | "unknown" | null;
    passed: boolean;
    sampleIndex: number;
    scenarioId: string;
  }>;
  statusScopeOracles?: Array<{
    arm: Arm;
    expected: StatusScopeDecision;
    failures: string[];
    memberId: string;
    observed: StatusScopeDecision | null;
    passed: boolean;
    phase: "main" | "reconstruction";
    sampleIndex: number;
    scenarioId: string;
  }>;
  boundedFalsificationOracles?: Array<{
    arm: Arm;
    expected: BoundedFalsificationObservation;
    failures: string[];
    memberId: string;
    observed: BoundedFalsificationObservation | null;
    passed: boolean;
    sampleIndex: number;
    scenarioId: string;
  }>;
  complexityOracles?: Array<{
    arm: Arm;
    expected: ComplexityFacadeObservation;
    failures: string[];
    memberId: string;
    observed: ComplexityFacadeObservation | null;
    passed: boolean;
    sampleIndex: number;
    scenarioId: string;
  }>;
};

function observedDecision(stdout: string, expected: ExpectedDecision): (ExpectedDecision & { caseId: string }) | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(stdout.trim());
  } catch {
    return null;
  }
  if (parsed == null || typeof parsed !== "object" || Array.isArray(parsed)) return null;
  const record = parsed as Record<string, unknown>;
  const expectedKeys = ["caseId", ...Object.keys(expected)].sort();
  if (Object.keys(record).sort().join(",") !== expectedKeys.join(",")) return null;
  const caseId = record.caseId;
  if (typeof caseId !== "string" || caseId.trim() === "") return null;
  for (const [key, expectedValue] of Object.entries(expected)) {
    const observedValue = record[key];
    if (typeof expectedValue === "string" && typeof observedValue !== "string") return null;
    if (Array.isArray(expectedValue) && (!Array.isArray(observedValue) || observedValue.some((item) => typeof item !== "string"))) return null;
  }
  return record as ExpectedDecision & { caseId: string };
}

function decisionFailures(expected: ExpectedDecision, observed: (ExpectedDecision & { caseId: string }) | null, scenarioId: string): string[] {
  if (observed == null) return ["malformed-observation"];
  const failures: string[] = [];
  if (observed.caseId !== scenarioId) failures.push("caseId");
  for (const [key, expectedValue] of Object.entries(expected)) {
    if (stableJson(observed[key as keyof ExpectedDecision]) !== stableJson(expectedValue)) failures.push(key);
  }
  return failures;
}

function observedBoundedFalsification(text: string): BoundedFalsificationObservation | null {
  try {
    return parseBoundedFalsificationObservation(JSON.parse(text.trim()), "bounded-falsification observation");
  } catch {
    return null;
  }
}

function boundedFalsificationFailures(
  expected: BoundedFalsificationObservation,
  observed: BoundedFalsificationObservation | null,
  sample: SampleEvidence,
): string[] {
  if (observed == null) return ["malformed-observation"];
  const failures: string[] = BOUNDED_FALSIFICATION_OBSERVATION_KEYS
    .filter((key) => stableJson(observed[key]) !== stableJson(expected[key]));
  const completedTasks = sample.toolCalls.filter((tool) => tool.name === "task" && tool.status === "completed").length;
  const expectedTasks = expected.reviewerLaunchCount + (expected.exactOwnerAgent === "none" ? 0 : 1);
  if (completedTasks !== expectedTasks) failures.push("review-tool-count");
  if (sample.toolCalls.some((tool) => tool.name === "task" && tool.status !== "completed")) failures.push("review-tool-failure");
  return failures;
}

function evaluateBoundedFalsificationPack(input: {
  baseline: CaptureBundle;
  candidate?: CaptureBundle;
  expectation: Expectation | "baseline-establishment";
  pack: DecisionGapPack;
}): DecisionGapEvaluation {
  const boundedFalsificationOracles: NonNullable<DecisionGapEvaluation["boundedFalsificationOracles"]> = [];
  const identityFailures: string[] = [];
  const expectedScenarioDigest = digestOf(input.pack);
  for (const [arm, bundle] of [["baseline", input.baseline], ["candidate", input.candidate]] as const) {
    if (bundle == null) continue;
    if (bundle.scenarioDigest !== expectedScenarioDigest) {
      identityFailures.push(`bounded-falsification-oracle:${arm}:scenario-digest:${expectedScenarioDigest}:${bundle.scenarioDigest}`);
    }
    for (const scenario of input.pack.manifest.scenarios) {
      const expectation = input.pack.expectedDecisions[scenario.id] as BoundedFalsificationScenarioExpectation;
      const expected = expectation[arm];
      for (const sample of groupSamples(bundle, arm, scenario.id)) {
        const observed = observedBoundedFalsification(sample.proof.stdout);
        const failures = boundedFalsificationFailures(expected, observed, sample);
        boundedFalsificationOracles.push({
          arm,
          expected,
          failures,
          memberId: scenario.id,
          observed,
          passed: failures.length === 0,
          sampleIndex: sample.sampleIndex,
          scenarioId: scenario.id,
        });
      }
    }
  }
  const expectedRows = input.pack.manifest.scenarios.length * input.pack.manifest.sampleCount * (input.candidate == null ? 1 : 2);
  if (boundedFalsificationOracles.length !== expectedRows) {
    identityFailures.push(`bounded-falsification-oracle:sampleCount:${expectedRows}:${boundedFalsificationOracles.length}`);
  }
  const rawBase = evaluateBundle({
    baseline: input.baseline,
    candidate: input.candidate,
    expectation: input.expectation,
    manifest: input.pack.manifest,
  });
  const baseReasons = rawBase.reasons.filter((reason) => !reason.startsWith("friction-regression:"));
  const base = rawBase.status === "failed" && baseReasons.length === 0 && input.candidate != null
    ? result({
      baselineMedians: rawBase.baselineMedians,
      candidateMedians: rawBase.candidateMedians,
      environmentDigest: rawBase.environmentDigest,
      expectation: rawBase.expectation,
      improvedField: null,
      reasons: [],
      scenarioDigest: rawBase.scenarioDigest,
      sourceDigest: rawBase.sourceDigest,
      status: "passed-no-regression",
    })
    : rawBase;
  const failures = boundedFalsificationOracles.flatMap((row) => row.failures.map(
    (field) => `bounded-falsification-oracle:${row.arm}:${row.scenarioId}:${row.sampleIndex}:${field}`,
  ));
  failures.push(...identityFailures);
  const configuredProviderRequests = [input.baseline, input.candidate]
    .filter((bundle): bundle is CaptureBundle => bundle != null)
    .flatMap((bundle) => bundle.samples)
    .reduce((sum, sample) => sum + sample.friction.configuredProviderRequestCount, 0);
  if (configuredProviderRequests > input.pack.configuredProviderRequestBound) {
    failures.push(`bounded-falsification-oracle:pack-provider-bound:${input.pack.configuredProviderRequestBound}:${configuredProviderRequests}`);
  }
  const evaluation = failures.length === 0 ? base : result({
    baselineMedians: base.baselineMedians,
    candidateMedians: base.candidateMedians,
    environmentDigest: base.environmentDigest,
    expectation: base.expectation,
    improvedField: base.improvedField,
    reasons: [...base.reasons, ...failures],
    scenarioDigest: base.scenarioDigest,
    sourceDigest: base.sourceDigest,
    status: base.status === "blocked" || base.status === "stale-evidence" || identityFailures.length > 0 ? "blocked" : "failed",
  });
  const value: DecisionGapEvaluation = {
    boundedFalsificationOracles,
    decisionOracles: [],
    digest: "",
    evaluatorIdentity: {
      capture: { baseline: input.baseline.evaluatorDigest, candidate: input.candidate?.evaluatorDigest ?? null },
      terminalReplay: evaluatorDigest(),
    },
    evaluation,
    maximumClaim: input.pack.maximumClaim,
  };
  value.digest = digestOf({ ...value, digest: "" });
  return value;
}

function observedStatusScope(text: string): StatusScopeDecisionSet | null {
  try {
    return parseStatusScopeDecisionSet(JSON.parse(text.trim()), "status-scope observation");
  } catch {
    return null;
  }
}

function statusScopeMemberFailures(expected: StatusScopeDecision, observed: StatusScopeDecision | null): string[] {
  if (observed == null) return ["malformed-observation"];
  return STATUS_SCOPE_DECISION_KEYS.filter((key) => observed[key] !== expected[key]);
}

function evaluateStatusScopePack(input: {
  baseline: CaptureBundle;
  candidate?: CaptureBundle;
  expectation: Expectation | "baseline-establishment";
  pack: DecisionGapPack;
}): DecisionGapEvaluation {
  const scenario = input.pack.manifest.scenarios[0];
  const expected = input.pack.expectedDecisions[scenario.id] as StatusScopeDecisionSet;
  const statusScopeOracles: NonNullable<DecisionGapEvaluation["statusScopeOracles"]> = [];
  const failures: string[] = [];
  const expectedScenarioDigest = digestOf(input.pack);
  for (const [arm, bundle] of [["baseline", input.baseline], ["candidate", input.candidate]] as const) {
    if (bundle == null) continue;
    if (bundle.scenarioDigest !== expectedScenarioDigest) {
      failures.push(`status-scope-oracle:${arm}:scenario-digest:${expectedScenarioDigest}:${bundle.scenarioDigest}`);
    }
    for (const sample of groupSamples(bundle, arm, scenario.id)) {
      const evidence = sample.statusScope;
      if (evidence == null) {
        failures.push(`status-scope:${arm}:${scenario.id}:${sample.sampleIndex}:missing-evidence`);
      } else {
        if (!evidence.summarizeAccepted) failures.push(`status-scope:${arm}:${scenario.id}:${sample.sampleIndex}:summarize`);
        if (evidence.compactionContext.trim() === "") failures.push(`status-scope:${arm}:${scenario.id}:${sample.sampleIndex}:compaction-context`);
        if (evidence.error != null) failures.push(`status-scope:${arm}:${scenario.id}:${sample.sampleIndex}:roundtrip-error:${evidence.error.stage}`);
        if (evidence.providerRequestCount !== 3 || sample.friction.configuredProviderRequestCount !== evidence.providerRequestCount) {
          failures.push(`status-scope:${arm}:${scenario.id}:${sample.sampleIndex}:provider-request-count`);
        }
        if (evidence.messages.toolCalls.length > 0) failures.push(`status-scope:${arm}:${scenario.id}:${sample.sampleIndex}:tool-call`);
        const summaries = evidence.messages.assistant.filter((message) => message.summary);
        const responses = evidence.messages.assistant.filter((message) => !message.summary);
        if (!summaries.some((message) => message.text === evidence.compactionContext)) {
          failures.push(`status-scope:${arm}:${scenario.id}:${sample.sampleIndex}:summary-readback`);
        }
        if (!responses.some((message) => message.text === evidence.reconstructionResponse)) {
          failures.push(`status-scope:${arm}:${scenario.id}:${sample.sampleIndex}:reconstruction-readback`);
        }
      }
      for (const phase of ["main", "reconstruction"] as const) {
        const observedSet = evidence == null
          ? null
          : observedStatusScope(phase === "main" ? evidence.mainResponse : evidence.reconstructionResponse);
        for (const [index, expectedMember] of expected.members.entries()) {
          const observedMember = observedSet?.members[index] ?? null;
          const rowFailures = statusScopeMemberFailures(expectedMember, observedMember);
          statusScopeOracles.push({
            arm,
            expected: expectedMember,
            failures: rowFailures,
            memberId: expectedMember.id,
            observed: observedMember,
            passed: rowFailures.length === 0,
            phase,
            sampleIndex: sample.sampleIndex,
            scenarioId: scenario.id,
          });
        }
      }
    }
  }
  const expectedRows = expected.members.length * 2 * (input.candidate == null ? 1 : 2);
  if (statusScopeOracles.length !== expectedRows) failures.push(`status-scope-oracle:sampleCount:${expectedRows}:${statusScopeOracles.length}`);
  const verdictOracles = input.candidate == null
    ? statusScopeOracles
    : statusScopeOracles.filter((row) => row.arm === "candidate");
  failures.push(...verdictOracles.flatMap((row) => row.failures.map(
    (field) => `status-scope-oracle:${row.arm}:${row.phase}:${row.memberId}:${field}`,
  )));
  const baselineHasOracleFailure = statusScopeOracles.some((row) => row.arm === "baseline" && !row.passed);
  if (input.expectation === "improvement" && !baselineHasOracleFailure) {
    failures.push("status-scope-oracle:no-baseline-failure");
  }
  const configuredProviderRequests = [input.baseline, input.candidate]
    .filter((bundle): bundle is CaptureBundle => bundle != null)
    .flatMap((bundle) => bundle.samples)
    .reduce((sum, sample) => sum + sample.friction.configuredProviderRequestCount, 0);
  if (configuredProviderRequests > input.pack.configuredProviderRequestBound) {
    failures.push(`status-scope-oracle:pack-provider-bound:${input.pack.configuredProviderRequestBound}:${configuredProviderRequests}`);
  }
  const rawBase = evaluateBundle({
    baseline: input.baseline,
    candidate: input.candidate,
    expectation: input.expectation === "improvement" ? "no-regression" : input.expectation,
    manifest: input.pack.manifest,
  });
  const base = input.expectation === "improvement" ? result({
    baselineMedians: rawBase.baselineMedians,
    candidateMedians: rawBase.candidateMedians,
    environmentDigest: rawBase.environmentDigest,
    expectation: "improvement",
    improvedField: null,
    reasons: rawBase.reasons,
    scenarioDigest: rawBase.scenarioDigest,
    sourceDigest: rawBase.sourceDigest,
    status: rawBase.status === "passed-no-regression" && baselineHasOracleFailure
      ? "passed-improvement"
      : rawBase.status,
  }) : rawBase;
  const evaluation = failures.length === 0 ? base : result({
    baselineMedians: base.baselineMedians,
    candidateMedians: base.candidateMedians,
    environmentDigest: base.environmentDigest,
    expectation: base.expectation,
    improvedField: base.improvedField,
    reasons: [...base.reasons, ...failures],
    scenarioDigest: base.scenarioDigest,
    sourceDigest: base.sourceDigest,
    status: base.status === "blocked" || base.status === "stale-evidence" || failures.some((failure) => failure.includes("digest")) ? "blocked" : "failed",
  });
  const value: DecisionGapEvaluation = {
    decisionOracles: [],
    digest: "",
    evaluatorIdentity: {
      capture: {
        baseline: input.baseline.evaluatorDigest,
        candidate: input.candidate?.evaluatorDigest ?? null,
      },
      terminalReplay: evaluatorDigest(),
    },
    evaluation,
    maximumClaim: input.pack.maximumClaim,
    statusScopeOracles,
  };
  value.digest = digestOf({ ...value, digest: "" });
  return value;
}

function observedFoundationIntegrity(text: string): FoundationIntegrityObservation | null {
  try {
    return parseFoundationIntegrityObservation(JSON.parse(text.trim()), "foundation-integrity observation");
  } catch {
    return null;
  }
}

function foundationIntegrityFailures(
  expected: FoundationIntegrityObservation,
  observed: FoundationIntegrityObservation | null,
  sample: SampleEvidence,
): string[] {
  if (observed == null) return ["malformed-observation"];
  const failures: string[] = FOUNDATION_INTEGRITY_OBSERVATION_KEYS
    .filter((key) => stableJson(observed[key]) !== stableJson(expected[key]));
  const completedTasks = sample.toolCalls.filter((tool) => tool.name === "task" && tool.status === "completed").length;
  const completedSkills = sample.toolCalls.filter((tool) => tool.name === "skill" && tool.status === "completed").length;
  if (completedTasks !== expected.initialReviewCount + expected.correctedReviewCount) failures.push("owner-tool-count");
  if (completedSkills !== expected.recoverySkillCount) failures.push("recovery-skill-tool-count");
  if (sample.toolCalls.some((tool) => (tool.name === "task" || tool.name === "skill") && tool.status !== "completed")) {
    failures.push("owner-or-recovery-tool-failure");
  }
  return failures;
}

function evaluateFoundationIntegrityPack(input: {
  baseline: CaptureBundle;
  candidate?: CaptureBundle;
  expectation: Expectation | "baseline-establishment";
  pack: DecisionGapPack;
}): DecisionGapEvaluation {
  const foundationIntegrityOracles: NonNullable<DecisionGapEvaluation["foundationIntegrityOracles"]> = [];
  const foundationIntegrityRows: NonNullable<DecisionGapEvaluation["foundationIntegrityRows"]> = [];
  const identityFailures: string[] = [];
  const expectedScenarioDigest = digestOf(input.pack);
  for (const [arm, bundle] of [["baseline", input.baseline], ["candidate", input.candidate]] as const) {
    if (bundle == null) continue;
    if (bundle.scenarioDigest !== expectedScenarioDigest) {
      identityFailures.push(`foundation-integrity-oracle:${arm}:scenario-digest:${expectedScenarioDigest}:${bundle.scenarioDigest}`);
    }
    for (const scenario of input.pack.manifest.scenarios) {
      const expectation = input.pack.expectedDecisions[scenario.id] as FoundationIntegrityScenarioExpectation;
      const expected = expectation[arm];
      for (const sample of groupSamples(bundle, arm, scenario.id)) {
        const observed = observedFoundationIntegrity(sample.proof.stdout);
        const failures = foundationIntegrityFailures(expected, observed, sample);
        foundationIntegrityOracles.push({
          arm,
          expected,
          failures,
          observed,
          passed: failures.length === 0,
          sampleIndex: sample.sampleIndex,
          scenarioId: scenario.id,
        });
        for (const [index, expectedRow] of expected.terminalRows.entries()) {
          const observedRow = observed?.terminalRows[index] ?? null;
          const rowFailures: string[] = [];
          if (observedRow == null) rowFailures.push("missing-row");
          else {
            if (observedRow.memberId !== expectedRow.memberId) rowFailures.push("memberId");
            if (observedRow.status !== expectedRow.status) rowFailures.push("status");
          }
          foundationIntegrityRows.push({
            arm,
            expectedStatus: expectedRow.status,
            failures: rowFailures,
            memberId: expectedRow.memberId,
            observedStatus: observedRow?.status ?? null,
            passed: rowFailures.length === 0,
            sampleIndex: sample.sampleIndex,
            scenarioId: scenario.id,
          });
        }
      }
    }
  }
  const armCount = input.candidate == null ? 1 : 2;
  const expectedScenarioRows = input.pack.manifest.scenarios.length * input.pack.manifest.sampleCount * armCount;
  if (foundationIntegrityOracles.length !== expectedScenarioRows) {
    identityFailures.push(`foundation-integrity-oracle:sampleCount:${expectedScenarioRows}:${foundationIntegrityOracles.length}`);
  }
  const expectedTerminalRows = (input.pack.foundationIntegrity?.memberOrder.length ?? 0) * input.pack.manifest.sampleCount * armCount;
  if (foundationIntegrityRows.length !== expectedTerminalRows) {
    identityFailures.push(`foundation-integrity-terminal-row:sampleCount:${expectedTerminalRows}:${foundationIntegrityRows.length}`);
  }
  const base = evaluateBundle({
    baseline: input.baseline,
    candidate: input.candidate,
    expectation: input.expectation,
    manifest: input.pack.manifest,
  });
  const baseReasons = base.reasons.filter((reason) => !reason.startsWith("friction-regression:"));
  const normalizedBase = base.status === "failed" && baseReasons.length === 0 && input.candidate != null
    ? result({
      baselineMedians: base.baselineMedians,
      candidateMedians: base.candidateMedians,
      environmentDigest: base.environmentDigest,
      expectation: base.expectation,
      improvedField: null,
      reasons: [],
      scenarioDigest: base.scenarioDigest,
      sourceDigest: base.sourceDigest,
      status: "passed-no-regression",
    })
    : base;
  const failures = foundationIntegrityOracles.flatMap((row) => row.failures.map(
    (field) => `foundation-integrity-oracle:${row.arm}:${row.scenarioId}:${row.sampleIndex}:${field}`,
  ));
  failures.push(...identityFailures);
  const configuredProviderRequests = [input.baseline, input.candidate]
    .filter((bundle): bundle is CaptureBundle => bundle != null)
    .flatMap((bundle) => bundle.samples)
    .reduce((sum, sample) => sum + sample.friction.configuredProviderRequestCount, 0);
  if (configuredProviderRequests > input.pack.configuredProviderRequestBound) {
    failures.push(`foundation-integrity-oracle:pack-provider-bound:${input.pack.configuredProviderRequestBound}:${configuredProviderRequests}`);
  }
  const evaluation = failures.length === 0 ? normalizedBase : result({
    baselineMedians: normalizedBase.baselineMedians,
    candidateMedians: normalizedBase.candidateMedians,
    environmentDigest: normalizedBase.environmentDigest,
    expectation: normalizedBase.expectation,
    improvedField: normalizedBase.improvedField,
    reasons: [...normalizedBase.reasons, ...failures],
    scenarioDigest: normalizedBase.scenarioDigest,
    sourceDigest: normalizedBase.sourceDigest,
    status: normalizedBase.status === "blocked" || normalizedBase.status === "stale-evidence" || identityFailures.length > 0 ? "blocked" : "failed",
  });
  const value: DecisionGapEvaluation = {
    decisionOracles: [],
    digest: "",
    evaluatorIdentity: {
      capture: { baseline: input.baseline.evaluatorDigest, candidate: input.candidate?.evaluatorDigest ?? null },
      terminalReplay: evaluatorDigest(),
    },
    evaluation,
    foundationIntegrityOracles,
    foundationIntegrityRows,
    maximumClaim: input.pack.maximumClaim,
  };
  value.digest = digestOf({ ...value, digest: "" });
  return value;
}

function observedComplexityFacade(text: string): ComplexityFacadeObservation | null {
  try {
    return parseComplexityFacadeObservation(JSON.parse(text.trim()), "complexity facade observation");
  } catch {
    return null;
  }
}

function complexityFacadeFailures(
  expected: ComplexityFacadeObservation,
  observed: ComplexityFacadeObservation | null,
): string[] {
  if (observed == null) return ["malformed-observation"];
  return COMPLEXITY_FACADE_OBSERVATION_KEYS
    .filter((key) => stableJson(observed[key]) !== stableJson(expected[key]));
}

function evaluateComplexityPack(input: {
  baseline: CaptureBundle;
  candidate?: CaptureBundle;
  expectation: Expectation | "baseline-establishment";
  pack: DecisionGapPack;
}): DecisionGapEvaluation {
  const complexityOracles: NonNullable<DecisionGapEvaluation["complexityOracles"]> = [];
  const failures: string[] = [];
  const expectedScenarioDigest = digestOf(input.pack);
  for (const [arm, bundle] of [["baseline", input.baseline], ["candidate", input.candidate]] as const) {
    if (bundle == null) continue;
    if (bundle.scenarioDigest !== expectedScenarioDigest) {
      failures.push(`complexity-oracle:${arm}:scenario-digest:${expectedScenarioDigest}:${bundle.scenarioDigest}`);
    }
    for (const scenario of input.pack.manifest.scenarios) {
      const expectation = input.pack.expectedDecisions[scenario.id] as ComplexityFacadeScenarioExpectation;
      const expected = expectation[arm];
      for (const sample of groupSamples(bundle, arm, scenario.id)) {
        const observed = observedComplexityFacade(sample.proof.stdout);
        const rowFailures = complexityFacadeFailures(expected, observed);
        complexityOracles.push({
          arm,
          expected,
          failures: rowFailures,
          memberId: scenario.id,
          observed,
          passed: rowFailures.length === 0,
          sampleIndex: sample.sampleIndex,
          scenarioId: scenario.id,
        });
      }
    }
  }
  const expectedRows = input.pack.manifest.scenarios.length * input.pack.manifest.sampleCount * (input.candidate == null ? 1 : 2);
  if (complexityOracles.length !== expectedRows) failures.push(`complexity-oracle:sampleCount:${expectedRows}:${complexityOracles.length}`);
  failures.push(...complexityOracles.flatMap((row) => row.failures.map(
    (field) => `complexity-oracle:${row.arm}:${row.scenarioId}:${row.sampleIndex}:${field}`,
  )));
  if (input.candidate != null) {
    const baselineSample = groupSamples(input.baseline, "baseline", input.pack.manifest.scenarios[0]!.id)[0];
    const candidateSample = groupSamples(input.candidate, "candidate", input.pack.manifest.scenarios[0]!.id)[0];
    for (const relative of ["src/order-service.ts", "src/run-order.ts"]) {
      const before = baselineSample?.files.find((file) => file.path === relative)?.sha256;
      const after = candidateSample?.files.find((file) => file.path === relative)?.sha256;
      if (before == null || after == null) failures.push(`complexity-fact-diff:${relative}:missing`);
      else if (before === after) failures.push(`complexity-fact-diff:${relative}:unchanged`);
    }
    if (baselineSample?.validation.status !== candidateSample?.validation.status || baselineSample?.validation.stdout !== candidateSample?.validation.stdout) {
      failures.push("complexity-fact-diff:representative-proof");
    }
  }
  const configuredProviderRequests = [input.baseline, input.candidate]
    .filter((bundle): bundle is CaptureBundle => bundle != null)
    .flatMap((bundle) => bundle.samples)
    .reduce((sum, sample) => sum + sample.friction.configuredProviderRequestCount, 0);
  if (configuredProviderRequests > input.pack.configuredProviderRequestBound) {
    failures.push(`complexity-oracle:pack-provider-bound:${input.pack.configuredProviderRequestBound}:${configuredProviderRequests}`);
  }
  const base = evaluateBundle({
    baseline: input.baseline,
    candidate: input.candidate,
    expectation: input.expectation,
    manifest: input.pack.manifest,
  });
  const evaluation = failures.length === 0 ? base : result({
    baselineMedians: base.baselineMedians,
    candidateMedians: base.candidateMedians,
    environmentDigest: base.environmentDigest,
    expectation: base.expectation,
    improvedField: base.improvedField,
    reasons: [...base.reasons, ...failures],
    scenarioDigest: base.scenarioDigest,
    sourceDigest: base.sourceDigest,
    status: base.status === "blocked" || base.status === "stale-evidence" || failures.some((failure) => failure.includes("digest")) ? "blocked" : "failed",
  });
  const value: DecisionGapEvaluation = {
    complexityOracles,
    decisionOracles: [],
    digest: "",
    evaluatorIdentity: {
      capture: { baseline: input.baseline.evaluatorDigest, candidate: input.candidate?.evaluatorDigest ?? null },
      terminalReplay: evaluatorDigest(),
    },
    evaluation,
    maximumClaim: input.pack.maximumClaim,
  };
  value.digest = digestOf({ ...value, digest: "" });
  return value;
}

export function evaluateDecisionGapPack(input: {
  baseline: CaptureBundle;
  candidate?: CaptureBundle;
  expectation: Expectation | "baseline-establishment";
  pack: DecisionGapPack;
}): DecisionGapEvaluation {
  if (input.pack.name === "bounded-falsification") return evaluateBoundedFalsificationPack(input);
  if (input.pack.name === "status-scope") return evaluateStatusScopePack(input);
  if (input.pack.name === "foundation-integrity") return evaluateFoundationIntegrityPack(input);
  if (input.pack.name === "complexity") return evaluateComplexityPack(input);
  const decisionOracles: DecisionGapEvaluation["decisionOracles"] = [];
  const identityFailures: string[] = [];
  const expectedScenarioDigest = digestOf(input.pack);
  for (const [arm, bundle] of [["baseline", input.baseline], ["candidate", input.candidate]] as const) {
    if (bundle != null && bundle.scenarioDigest !== expectedScenarioDigest) {
      identityFailures.push(`decision-oracle:${arm}:scenario-digest:${expectedScenarioDigest}:${bundle.scenarioDigest}`);
    }
  }
  if (input.candidate != null && input.baseline.evaluatorDigest !== input.candidate.evaluatorDigest) {
    identityFailures.push(`decision-oracle:evaluator-digest:${input.baseline.evaluatorDigest}:${input.candidate.evaluatorDigest}`);
  }
  for (const scenario of input.pack.manifest.scenarios) {
    const expected = input.pack.expectedDecisions[scenario.id] as ExpectedDecision;
    for (const [arm, bundle] of [["baseline", input.baseline], ["candidate", input.candidate]] as const) {
      if (bundle == null) continue;
      for (const sample of groupSamples(bundle, arm, scenario.id)) {
        const observed = observedDecision(sample.proof.stdout, expected);
        const failures = decisionFailures(expected, observed, scenario.id);
        decisionOracles.push({
          arm,
          expected,
          failures,
          observed,
          passed: failures.length === 0,
          sampleIndex: sample.sampleIndex,
          scenarioId: scenario.id,
        });
      }
    }
  }
  const base = evaluateBundle({
    baseline: input.baseline,
    candidate: input.candidate,
    expectation: input.expectation,
    manifest: input.pack.manifest,
  });
  const expectedRows = input.pack.manifest.scenarios.length * input.pack.manifest.sampleCount * (input.candidate == null ? 1 : 2);
  const failures = decisionOracles
    .flatMap((row) => row.failures.map((field) => `decision-oracle:${row.arm}:${row.scenarioId}:${row.sampleIndex}:${field}`));
  failures.push(...identityFailures);
  if (decisionOracles.length !== expectedRows) failures.push(`decision-oracle:sampleCount:${expectedRows}:${decisionOracles.length}`);
  const configuredProviderRequests = [input.baseline, input.candidate]
    .filter((bundle): bundle is CaptureBundle => bundle != null)
    .flatMap((bundle) => bundle.samples)
    .reduce((sum, sample) => sum + sample.friction.configuredProviderRequestCount, 0);
  if (configuredProviderRequests > input.pack.configuredProviderRequestBound) {
    failures.push(`decision-oracle:pack-provider-bound:${input.pack.configuredProviderRequestBound}:${configuredProviderRequests}`);
  }
  const evaluation = failures.length === 0 ? base : result({
    baselineMedians: base.baselineMedians,
    candidateMedians: base.candidateMedians,
    environmentDigest: base.environmentDigest,
    expectation: base.expectation,
    improvedField: base.improvedField,
    reasons: [...base.reasons, ...failures],
    scenarioDigest: base.scenarioDigest,
    sourceDigest: base.sourceDigest,
    status: base.status === "blocked" || base.status === "stale-evidence" || identityFailures.length > 0 ? "blocked" : "failed",
  });
  const value: DecisionGapEvaluation = { decisionOracles, digest: "", evaluation, maximumClaim: input.pack.maximumClaim };
  value.digest = digestOf({ ...value, digest: "" });
  return value;
}

export function sanitizePreservedBundle(text: string, kitRoot: string): CaptureBundle {
  const redacted = redactText(text, defaultRedactions("unused-proof-root", kitRoot));
  const parsed = JSON.parse(redacted) as CaptureBundle;
  parsed.samples = parsed.samples.map((sample) => {
    const next = { ...sample, hashes: { sample: "" } };
    next.hashes.sample = digestOf({ ...next, hashes: { sample: "" } });
    return next;
  });
  parsed.byteLength = bundleByteLength(parsed);
  return parsed;
}

export function readBundle(filePath: string): CaptureBundle {
  const text = fs.readFileSync(filePath, "utf8");
  const parsed = JSON.parse(text) as CaptureBundle;
  verifyBundleIntegrity(parsed, text);
  return parsed;
}

export function replayEvaluation(input: {
  baselinePath: string;
  candidatePath?: string;
  expectation: Expectation | "baseline-establishment";
  manifest: RegressionManifest;
}): EvaluationResult {
  return evaluateBundle({
    baseline: readBundle(input.baselinePath),
    candidate: input.candidatePath == null ? undefined : readBundle(input.candidatePath),
    expectation: input.expectation,
    manifest: input.manifest,
  });
}

export function gateCurrent(input: {
  candidatePath?: string;
  candidateRequestPath?: string;
  currentSource: SourceIdentity;
  manifest: RegressionManifest;
  pointer: BaselinePointer;
  repoRoot: string;
}): EvaluationResult {
  if (input.pointer.status !== "accepted" || input.pointer.bundlePath == null || input.pointer.sourceDigest == null) {
    return result({
      baselineMedians: {},
      candidateMedians: null,
      environmentDigest: input.pointer.environmentDigest ?? "",
      expectation: "baseline-establishment",
      improvedField: null,
      reasons: ["no-accepted-baseline"],
      scenarioDigest: input.pointer.scenarioDigest ?? "",
      sourceDigest: input.currentSource.governedDigest,
      status: "blocked",
    });
  }
  const evaluator = evaluatorDigest();
  if (input.pointer.evaluatorDigest != null && input.pointer.evaluatorDigest !== evaluator) {
    return result({
      baselineMedians: {},
      candidateMedians: null,
      environmentDigest: input.pointer.environmentDigest ?? "",
      expectation: "no-regression",
      improvedField: null,
      reasons: ["stale-evaluator"],
      scenarioDigest: input.pointer.scenarioDigest ?? "",
      sourceDigest: input.currentSource.governedDigest,
      status: "blocked",
    });
  }
  const baselinePath = path.resolve(input.repoRoot, input.pointer.bundlePath);
  let baseline: CaptureBundle;
  try {
    baseline = readBundle(baselinePath);
  } catch (error) {
    return result({
      baselineMedians: {},
      candidateMedians: null,
      environmentDigest: input.pointer.environmentDigest ?? "",
      expectation: "no-regression",
      improvedField: null,
      reasons: ["stale-evidence", error instanceof Error ? error.message : String(error)],
      scenarioDigest: input.pointer.scenarioDigest ?? "",
      sourceDigest: input.currentSource.governedDigest,
      status: "stale-evidence",
    });
  }
  const replayed = evaluateBundle({
    baseline,
    expectation: "baseline-establishment",
    manifest: input.manifest,
  });
  if (replayed.status !== "baseline-established") {
    return result({
      ...replayed,
      reasons: [...replayed.reasons, "baseline-replay-failed"],
      status: "blocked",
    });
  }
  const changed = compareSource(baseline.sourceIdentity, input.currentSource);
  if (changed.length === 0 && input.currentSource.governedDigest === input.pointer.sourceDigest) {
    return result({
      baselineMedians: replayed.baselineMedians,
      candidateMedians: null,
      environmentDigest: replayed.environmentDigest,
      expectation: "no-regression",
      improvedField: null,
      reasons: ["unchanged-governed-source"],
      scenarioDigest: replayed.scenarioDigest,
      sourceDigest: input.currentSource.governedDigest,
      status: "baseline-current",
    });
  }
  if (input.candidatePath == null || input.candidateRequestPath == null) {
    return result({
      baselineMedians: replayed.baselineMedians,
      candidateMedians: null,
      environmentDigest: replayed.environmentDigest,
      expectation: "no-regression",
      improvedField: null,
      reasons: ["stale-evidence", ...changed],
      scenarioDigest: replayed.scenarioDigest,
      sourceDigest: input.currentSource.governedDigest,
      status: "stale-evidence",
    });
  }
  const request = parseCandidateRequest(JSON.parse(fs.readFileSync(input.candidateRequestPath, "utf8")));
  const candidate = readBundle(input.candidatePath);
  if (candidate.sourceIdentity.governedDigest !== input.currentSource.governedDigest) {
    return result({
      baselineMedians: replayed.baselineMedians,
      candidateMedians: null,
      environmentDigest: replayed.environmentDigest,
      expectation: request.expectation,
      improvedField: null,
      reasons: ["stale-evidence", "candidate-source-mismatch"],
      scenarioDigest: replayed.scenarioDigest,
      sourceDigest: input.currentSource.governedDigest,
      status: "stale-evidence",
    });
  }
  return evaluateBundle({
    baseline,
    candidate,
    expectation: request.expectation,
    manifest: input.manifest,
  });
}

export function loadGateInputs(repoRoot: string): { manifest: RegressionManifest; pointer: BaselinePointer } {
  return {
    manifest: loadManifest(repoRoot).manifest,
    pointer: loadBaselinePointer(repoRoot),
  };
}
