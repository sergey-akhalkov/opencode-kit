import fs from "node:fs";
import path from "node:path";
import {
  type Arm,
  type BaselinePointer,
  type CaptureBundle,
  type CandidateRequest,
  type DecisionGapPack,
  type EnvironmentIdentity,
  type EvaluationResult,
  type Expectation,
  type FrictionField,
  type FrictionVector,
  type RegressionManifest,
  type SampleEvidence,
  type SourceIdentity,
  ContractError,
  FRICTION_FIELDS,
  SAMPLE_BYTE_LIMIT,
  CAPTURE_BYTE_LIMIT,
  SCHEMA_VERSION,
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
    passed: boolean;
    sampleIndex: number;
    scenarioId: string;
  }>;
  digest: string;
  evaluation: EvaluationResult;
};

function observedDecision(stdout: string): (DecisionGapPack["expectedDecisions"][string] & { caseId: string }) | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(stdout.trim());
  } catch {
    return null;
  }
  if (parsed == null || typeof parsed !== "object" || Array.isArray(parsed)) return null;
  const record = parsed as Record<string, unknown>;
  if (Object.keys(record).sort().join(",") !== "caseId,claimDisposition,completionDisposition") return null;
  const caseId = record.caseId;
  const claimDisposition = record.claimDisposition;
  const completionDisposition = record.completionDisposition;
  if (typeof caseId !== "string" || caseId.trim() === "") return null;
  if (claimDisposition !== "blocked" && claimDisposition !== "narrowed" && claimDisposition !== "supported" && claimDisposition !== "unknown") return null;
  if (completionDisposition !== "allow_stop" && completionDisposition !== "continue") return null;
  return { caseId, claimDisposition, completionDisposition };
}

export function evaluateDecisionGapPack(input: {
  baseline: CaptureBundle;
  candidate?: CaptureBundle;
  expectation: Expectation;
  pack: DecisionGapPack;
}): DecisionGapEvaluation {
  const decisionOracles: DecisionGapEvaluation["decisionOracles"] = [];
  for (const scenario of input.pack.manifest.scenarios) {
    const expected = input.pack.expectedDecisions[scenario.id];
    for (const [arm, bundle] of [["baseline", input.baseline], ["candidate", input.candidate]] as const) {
      if (bundle == null) continue;
      for (const sample of groupSamples(bundle, arm, scenario.id)) {
        const observed = observedDecision(sample.proof.stdout);
        decisionOracles.push({
          arm,
          expected,
          observed,
          passed: observed?.caseId === scenario.id
            && observed.claimDisposition === expected.claimDisposition
            && observed.completionDisposition === expected.completionDisposition,
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
    .filter((row) => !row.passed)
    .map((row) => `decision-oracle:${row.arm}:${row.scenarioId}:${row.sampleIndex}`);
  if (decisionOracles.length !== expectedRows) failures.push(`decision-oracle:sampleCount:${expectedRows}:${decisionOracles.length}`);
  const evaluation = failures.length === 0 ? base : result({
    baselineMedians: base.baselineMedians,
    candidateMedians: base.candidateMedians,
    environmentDigest: base.environmentDigest,
    expectation: base.expectation,
    improvedField: base.improvedField,
    reasons: [...base.reasons, ...failures],
    scenarioDigest: base.scenarioDigest,
    sourceDigest: base.sourceDigest,
    status: base.status === "blocked" || base.status === "stale-evidence" ? base.status : "failed",
  });
  const value: DecisionGapEvaluation = { decisionOracles, digest: "", evaluation };
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
