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

const PACK_PATH = "tools/proofs/fixtures/consumer-outcome/delivery-trajectory-r1.json";
const CONFIGURED_PACK_PATH = "tools/proofs/fixtures/consumer-outcome/delivery-trajectory-configured-r1.json";
const PACK_ID = "roadmap-delivery-trajectory-v1";
const PACK_SEED_ID = "delivery-trajectory-r1";
const MAXIMUM_CLAIM = "provider-free proof-contract evidence for the 13 reviewed roadmap-delivery-trajectory-v1 members under the recorded seed and governed source identity only; it supports no configured semantic behavior or population-member claim";
const DIFFERENCE_NAME = "candidate-artifact-availability";
const EVIDENCE_KIND = "provider-free-contract-only";
const MEMBER_ORDER = [
  "explicit-horizon-within-window",
  "legacy-or-unlinked-archive",
  "repeated-item-touch-trigger",
  "shared-owner-fan-out-trigger",
  "forecast-outside-window",
  "missing-window-or-measurement",
  "external-linear-bottleneck",
  "outcome-preserving-successor",
  "quality-weakening-owner-boundary",
  "unchanged-trigger-no-duplicate",
  "signal-failure-after-successful-archive",
  "default-core-availability",
  "missing-capability",
] as const;
const CONFIGURED_SCENARIO_ORDER = [
  "configured-no-trigger-archive",
  "configured-repeated-touch-successor",
] as const;
const GOVERNED_SOURCE_PATHS = [
  "openspec/changes/add-roadmap-delivery-trajectory-loop/proposal.md",
  "openspec/changes/add-roadmap-delivery-trajectory-loop/design.md",
  "openspec/changes/add-roadmap-delivery-trajectory-loop/tasks.md",
  "openspec/changes/add-roadmap-delivery-trajectory-loop/specs/library-roadmap-delivery-trajectory/spec.md",
  "tools/proofs/consumer-outcome-regression.ts",
  "tools/proofs/consumer-outcome/contracts.ts",
  "tools/proofs/consumer-outcome/delivery-trajectory.ts",
  PACK_PATH,
] as const;

type DeliveryTrajectoryArm = "baseline" | "candidate";
type CandidateArtifactAvailability = "absent" | "available";

export type DeliveryTrajectoryPack = {
  governedSourcePaths: string[];
  id: typeof PACK_SEED_ID;
  maximumClaim: typeof MAXIMUM_CLAIM;
  members: Array<{ id: string }>;
  packId: typeof PACK_ID;
  schemaVersion: 1;
};

export type LoadedDeliveryTrajectoryPack = {
  pack: DeliveryTrajectoryPack;
  packDigest: string;
  seedByteDigest: string;
};

type DeliveryTrajectoryObservation = {
  memberId: string;
  observation: {
    candidateArtifactAvailability: CandidateArtifactAvailability;
    evidenceKind: typeof EVIDENCE_KIND;
  };
};

export type DeliveryTrajectoryBundle = {
  arm: DeliveryTrajectoryArm;
  bundleDigest: string;
  candidateId: string;
  cleanup: {
    persistentTemporaryFixtures: 0;
    processesRemaining: 0;
    sessionsRemaining: 0;
    status: "complete";
    terminal: true;
  };
  effects: {
    createNewEvidenceRoot: true;
    modelCalls: 0;
    networkCalls: 0;
    processCalls: 0;
    productCalls: 0;
    providerCalls: 0;
    readClass: "governed-source-and-reviewed-seed-only";
    sessionCalls: 0;
    writes: ["bundle.json", "evaluation.json"];
  };
  inputIdentity: {
    candidateArtifactAvailability: CandidateArtifactAvailability;
    differenceName: typeof DIFFERENCE_NAME;
    governedSourceDigest: string;
    reviewedInputDigest: string;
    seedByteDigest: string;
  };
  maximumClaim: typeof MAXIMUM_CLAIM;
  observations: DeliveryTrajectoryObservation[];
  packDigest: string;
  packId: typeof PACK_ID;
  privacy: {
    absolutePathsEmitted: false;
    privatePathsEmitted: false;
    sourcePayloadsEmitted: false;
  };
  schemaVersion: 1;
  sourceIdentity: SourceIdentity;
};

export type DeliveryTrajectoryEvaluation = {
  bundleDigests: { baseline: string; candidate: string | null };
  evaluationDigest: string;
  inputDifference: {
    baseline: "absent";
    candidate: "available" | null;
    matchedExceptNamedDifference: boolean | null;
    name: typeof DIFFERENCE_NAME;
  };
  liveCalls: 0;
  maximumClaim: typeof MAXIMUM_CLAIM;
  modelCalls: 0;
  packId: typeof PACK_ID;
  providerCalls: 0;
  rows: Array<{
    arm: DeliveryTrajectoryArm;
    failures: string[];
    memberId: string;
    passed: true;
  }>;
  schemaVersion: 1;
  status: "passed";
};

const TOP_LEVEL_PACK_KEYS = ["governedSourcePaths", "id", "maximumClaim", "members", "packId", "schemaVersion"] as const;
const BUNDLE_KEYS = ["arm", "bundleDigest", "candidateId", "cleanup", "effects", "inputIdentity", "maximumClaim", "observations", "packDigest", "packId", "privacy", "schemaVersion", "sourceIdentity"] as const;
const SOURCE_KEYS = ["gitRef", "governedDigest", "kind", "pathDigests"] as const;
const SOURCE_ROW_KEYS = ["path", "sha256"] as const;
const INPUT_KEYS = ["candidateArtifactAvailability", "differenceName", "governedSourceDigest", "reviewedInputDigest", "seedByteDigest"] as const;
const OBSERVATION_KEYS = ["memberId", "observation"] as const;
const OBSERVATION_VALUE_KEYS = ["candidateArtifactAvailability", "evidenceKind"] as const;
const EFFECT_KEYS = ["createNewEvidenceRoot", "modelCalls", "networkCalls", "processCalls", "productCalls", "providerCalls", "readClass", "sessionCalls", "writes"] as const;
const PRIVACY_KEYS = ["absolutePathsEmitted", "privatePathsEmitted", "sourcePayloadsEmitted"] as const;
const CLEANUP_KEYS = ["persistentTemporaryFixtures", "processesRemaining", "sessionsRemaining", "status", "terminal"] as const;

function contractError(field: string, message: string, cause?: unknown): ContractError {
  const error = new ContractError(field, message);
  if (cause != null) (error as ContractError & { cause?: unknown }).cause = cause;
  return error;
}

function exactRecord(value: unknown, field: string, keys: readonly string[]): Record<string, unknown> {
  if (value == null || typeof value !== "object" || Array.isArray(value)) {
    throw contractError(field, `${field} must be an object`);
  }
  const record = value as Record<string, unknown>;
  const actual = Object.keys(record).sort((left, right) => left.localeCompare(right));
  const expected = [...keys].sort((left, right) => left.localeCompare(right));
  if (actual.length !== expected.length || actual.some((key, index) => key !== expected[index])) {
    throw contractError(field, `${field} must contain exactly: ${expected.join(", ")}`);
  }
  return record;
}

function exactString(value: unknown, field: string): string {
  if (typeof value !== "string" || value === "") throw contractError(field, `${field} must be a non-empty string`);
  return value;
}

function exactZero(value: unknown, field: string): 0 {
  if (value !== 0) throw contractError(field, `${field} must be zero`);
  return 0;
}

function exactFalse(value: unknown, field: string): false {
  if (value !== false) throw contractError(field, `${field} must be false`);
  return false;
}

function exactTrue(value: unknown, field: string): true {
  if (value !== true) throw contractError(field, `${field} must be true`);
  return true;
}

function exactStringArray(value: unknown, field: string): string[] {
  if (!Array.isArray(value)) throw contractError(field, `${field} must be an array`);
  return value.map((item, index) => exactString(item, `${field}[${index}]`));
}

function parseJson(text: string, field: string): unknown {
  try {
    return JSON.parse(text);
  } catch (cause) {
    throw contractError(field, `${field} is not valid JSON`, cause);
  }
}

function readPrivacySafeText(filePath: string, field: string): string {
  let text: string;
  try {
    text = fs.readFileSync(filePath, "utf8");
  } catch (cause) {
    throw contractError(field, `${field} is unreadable`, cause);
  }
  assertPrivacySafe(text, field);
  return text;
}

function parsePack(value: unknown): DeliveryTrajectoryPack {
  const source = exactRecord(value, "deliveryTrajectoryPack", TOP_LEVEL_PACK_KEYS);
  if (source.schemaVersion !== 1) throw contractError("deliveryTrajectoryPack.schemaVersion", "unsupported delivery trajectory pack schema");
  if (source.id !== PACK_SEED_ID) throw contractError("deliveryTrajectoryPack.id", "unexpected delivery trajectory seed id");
  if (source.packId !== PACK_ID) throw contractError("deliveryTrajectoryPack.packId", "unexpected delivery trajectory claim id");
  if (source.maximumClaim !== MAXIMUM_CLAIM) throw contractError("deliveryTrajectoryPack.maximumClaim", "delivery trajectory maximum claim drifted");

  const governedSourcePaths = exactStringArray(source.governedSourcePaths, "deliveryTrajectoryPack.governedSourcePaths");
  if (governedSourcePaths.length !== GOVERNED_SOURCE_PATHS.length || governedSourcePaths.some((entry, index) => entry !== GOVERNED_SOURCE_PATHS[index])) {
    throw contractError("deliveryTrajectoryPack.governedSourcePaths", "delivery trajectory governed source order drifted");
  }
  for (const entry of governedSourcePaths) {
    if (path.isAbsolute(entry) || entry.split(/[\\/]/).includes("..")) {
      throw contractError("deliveryTrajectoryPack.governedSourcePaths", "governed source paths must be repository-relative and contained");
    }
  }

  if (!Array.isArray(source.members) || source.members.length !== MEMBER_ORDER.length) {
    throw contractError("deliveryTrajectoryPack.members", "delivery trajectory pack must contain exactly 13 members");
  }
  const members = source.members.map((value, index) => {
    const row = exactRecord(value, `deliveryTrajectoryPack.members[${index}]`, ["id"]);
    const id = exactString(row.id, `deliveryTrajectoryPack.members[${index}].id`);
    if (id !== MEMBER_ORDER[index]) throw contractError("deliveryTrajectoryPack.members", "delivery trajectory member order drifted");
    return { id };
  });
  if (new Set(members.map((member) => member.id)).size !== MEMBER_ORDER.length) {
    throw contractError("deliveryTrajectoryPack.members", "delivery trajectory members must be unique");
  }

  return {
    governedSourcePaths,
    id: PACK_SEED_ID,
    maximumClaim: MAXIMUM_CLAIM,
    members,
    packId: PACK_ID,
    schemaVersion: 1,
  };
}

export function loadDeliveryTrajectoryPack(repoRoot: string): LoadedDeliveryTrajectoryPack {
  const text = readPrivacySafeText(path.join(repoRoot, PACK_PATH), "delivery trajectory seed");
  const pack = parsePack(parseJson(text, "delivery trajectory seed"));
  return {
    pack,
    packDigest: digestOf(pack),
    seedByteDigest: digestOf(text),
  };
}

function parseSourceIdentity(value: unknown, pack: DeliveryTrajectoryPack): SourceIdentity {
  const source = exactRecord(value, "deliveryTrajectoryBundle.sourceIdentity", SOURCE_KEYS);
  if (source.gitRef !== "working-tree" || source.kind !== "working-tree") {
    throw contractError("deliveryTrajectoryBundle.sourceIdentity", "delivery trajectory source must be the provider-free working tree");
  }
  if (!Array.isArray(source.pathDigests) || source.pathDigests.length !== pack.governedSourcePaths.length) {
    throw contractError("deliveryTrajectoryBundle.sourceIdentity.pathDigests", "governed source path count mismatch");
  }
  const pathDigests = source.pathDigests.map((value, index) => {
    const row = exactRecord(value, `deliveryTrajectoryBundle.sourceIdentity.pathDigests[${index}]`, SOURCE_ROW_KEYS);
    const relative = exactString(row.path, `deliveryTrajectoryBundle.sourceIdentity.pathDigests[${index}].path`);
    const sha256 = exactString(row.sha256, `deliveryTrajectoryBundle.sourceIdentity.pathDigests[${index}].sha256`);
    if (!/^[a-f0-9]{64}$/.test(sha256)) throw contractError("deliveryTrajectoryBundle.sourceIdentity.pathDigests", "invalid governed source digest");
    return { path: relative, sha256 };
  });
  const expectedPaths = [...pack.governedSourcePaths].sort((left, right) => left.localeCompare(right));
  if (pathDigests.some((row, index) => row.path !== expectedPaths[index])) {
    throw contractError("deliveryTrajectoryBundle.sourceIdentity.pathDigests", "governed source path identity mismatch");
  }
  const governedDigest = exactString(source.governedDigest, "deliveryTrajectoryBundle.sourceIdentity.governedDigest");
  if (governedDigest !== digestOf(pathDigests)) {
    throw contractError("deliveryTrajectoryBundle.sourceIdentity.governedDigest", "governed source digest mismatch");
  }
  return { gitRef: "working-tree", governedDigest, kind: "working-tree", pathDigests };
}

function expectedAvailability(arm: DeliveryTrajectoryArm): CandidateArtifactAvailability {
  return arm === "baseline" ? "absent" : "available";
}

function reviewedInputDigest(loaded: LoadedDeliveryTrajectoryPack, sourceIdentity: SourceIdentity): string {
  return digestOf({
    memberIds: loaded.pack.members.map((member) => member.id),
    packDigest: loaded.packDigest,
    packId: loaded.pack.packId,
    seedByteDigest: loaded.seedByteDigest,
    sourceIdentity,
  });
}

function parseBundle(value: unknown, loaded: LoadedDeliveryTrajectoryPack): DeliveryTrajectoryBundle {
  const source = exactRecord(value, "deliveryTrajectoryBundle", BUNDLE_KEYS);
  if (source.schemaVersion !== 1) throw contractError("deliveryTrajectoryBundle.schemaVersion", "unsupported delivery trajectory bundle schema");
  if (source.arm !== "baseline" && source.arm !== "candidate") throw contractError("deliveryTrajectoryBundle.arm", "invalid delivery trajectory arm");
  const arm = source.arm;
  const availability = expectedAvailability(arm);
  const candidateId = exactString(source.candidateId, "deliveryTrajectoryBundle.candidateId");
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/.test(candidateId)) throw contractError("deliveryTrajectoryBundle.candidateId", "candidate id must be a safe token");
  if (source.packId !== PACK_ID || source.packDigest !== loaded.packDigest) throw contractError("deliveryTrajectoryBundle.packDigest", "delivery trajectory pack identity mismatch");
  if (source.maximumClaim !== MAXIMUM_CLAIM) throw contractError("deliveryTrajectoryBundle.maximumClaim", "delivery trajectory maximum claim mismatch");

  const sourceIdentity = parseSourceIdentity(source.sourceIdentity, loaded.pack);
  const input = exactRecord(source.inputIdentity, "deliveryTrajectoryBundle.inputIdentity", INPUT_KEYS);
  if (input.candidateArtifactAvailability !== availability || input.differenceName !== DIFFERENCE_NAME) {
    throw contractError("deliveryTrajectoryBundle.inputIdentity", "candidate artifact availability does not match the bundle arm");
  }
  if (input.governedSourceDigest !== sourceIdentity.governedDigest || input.seedByteDigest !== loaded.seedByteDigest) {
    throw contractError("deliveryTrajectoryBundle.inputIdentity", "delivery trajectory source or seed identity mismatch");
  }
  const expectedReviewedInputDigest = reviewedInputDigest(loaded, sourceIdentity);
  if (input.reviewedInputDigest !== expectedReviewedInputDigest) {
    throw contractError("deliveryTrajectoryBundle.inputIdentity.reviewedInputDigest", "reviewed input digest mismatch");
  }

  if (!Array.isArray(source.observations) || source.observations.length !== MEMBER_ORDER.length) {
    throw contractError("deliveryTrajectoryBundle.observations", "delivery trajectory bundle must contain one observation per member");
  }
  const observations = source.observations.map((value, index): DeliveryTrajectoryObservation => {
    const row = exactRecord(value, `deliveryTrajectoryBundle.observations[${index}]`, OBSERVATION_KEYS);
    const observation = exactRecord(row.observation, `deliveryTrajectoryBundle.observations[${index}].observation`, OBSERVATION_VALUE_KEYS);
    if (row.memberId !== MEMBER_ORDER[index]) throw contractError("deliveryTrajectoryBundle.observations", "delivery trajectory observation order mismatch");
    if (observation.candidateArtifactAvailability !== availability || observation.evidenceKind !== EVIDENCE_KIND) {
      throw contractError("deliveryTrajectoryBundle.observations", "delivery trajectory observation value mismatch");
    }
    return {
      memberId: MEMBER_ORDER[index],
      observation: { candidateArtifactAvailability: availability, evidenceKind: EVIDENCE_KIND },
    };
  });
  if (new Set(observations.map((row) => row.memberId)).size !== MEMBER_ORDER.length) {
    throw contractError("deliveryTrajectoryBundle.observations", "delivery trajectory observations must be unique");
  }

  const effects = exactRecord(source.effects, "deliveryTrajectoryBundle.effects", EFFECT_KEYS);
  exactTrue(effects.createNewEvidenceRoot, "deliveryTrajectoryBundle.effects.createNewEvidenceRoot");
  exactZero(effects.modelCalls, "deliveryTrajectoryBundle.effects.modelCalls");
  exactZero(effects.networkCalls, "deliveryTrajectoryBundle.effects.networkCalls");
  exactZero(effects.processCalls, "deliveryTrajectoryBundle.effects.processCalls");
  exactZero(effects.productCalls, "deliveryTrajectoryBundle.effects.productCalls");
  exactZero(effects.providerCalls, "deliveryTrajectoryBundle.effects.providerCalls");
  exactZero(effects.sessionCalls, "deliveryTrajectoryBundle.effects.sessionCalls");
  if (effects.readClass !== "governed-source-and-reviewed-seed-only") throw contractError("deliveryTrajectoryBundle.effects.readClass", "delivery trajectory read class mismatch");
  const writes = exactStringArray(effects.writes, "deliveryTrajectoryBundle.effects.writes");
  if (writes.length !== 2 || writes[0] !== "bundle.json" || writes[1] !== "evaluation.json") {
    throw contractError("deliveryTrajectoryBundle.effects.writes", "delivery trajectory write set mismatch");
  }

  const privacy = exactRecord(source.privacy, "deliveryTrajectoryBundle.privacy", PRIVACY_KEYS);
  exactFalse(privacy.absolutePathsEmitted, "deliveryTrajectoryBundle.privacy.absolutePathsEmitted");
  exactFalse(privacy.privatePathsEmitted, "deliveryTrajectoryBundle.privacy.privatePathsEmitted");
  exactFalse(privacy.sourcePayloadsEmitted, "deliveryTrajectoryBundle.privacy.sourcePayloadsEmitted");

  const cleanup = exactRecord(source.cleanup, "deliveryTrajectoryBundle.cleanup", CLEANUP_KEYS);
  exactZero(cleanup.persistentTemporaryFixtures, "deliveryTrajectoryBundle.cleanup.persistentTemporaryFixtures");
  exactZero(cleanup.processesRemaining, "deliveryTrajectoryBundle.cleanup.processesRemaining");
  exactZero(cleanup.sessionsRemaining, "deliveryTrajectoryBundle.cleanup.sessionsRemaining");
  if (cleanup.status !== "complete") throw contractError("deliveryTrajectoryBundle.cleanup.status", "delivery trajectory cleanup is not complete");
  exactTrue(cleanup.terminal, "deliveryTrajectoryBundle.cleanup.terminal");

  const bundle: DeliveryTrajectoryBundle = {
    arm,
    bundleDigest: exactString(source.bundleDigest, "deliveryTrajectoryBundle.bundleDigest"),
    candidateId,
    cleanup: { persistentTemporaryFixtures: 0, processesRemaining: 0, sessionsRemaining: 0, status: "complete", terminal: true },
    effects: {
      createNewEvidenceRoot: true,
      modelCalls: 0,
      networkCalls: 0,
      processCalls: 0,
      productCalls: 0,
      providerCalls: 0,
      readClass: "governed-source-and-reviewed-seed-only",
      sessionCalls: 0,
      writes: ["bundle.json", "evaluation.json"],
    },
    inputIdentity: {
      candidateArtifactAvailability: availability,
      differenceName: DIFFERENCE_NAME,
      governedSourceDigest: sourceIdentity.governedDigest,
      reviewedInputDigest: expectedReviewedInputDigest,
      seedByteDigest: loaded.seedByteDigest,
    },
    maximumClaim: MAXIMUM_CLAIM,
    observations,
    packDigest: loaded.packDigest,
    packId: PACK_ID,
    privacy: { absolutePathsEmitted: false, privatePathsEmitted: false, sourcePayloadsEmitted: false },
    schemaVersion: 1,
    sourceIdentity,
  };
  const unsealed = structuredClone(bundle);
  unsealed.bundleDigest = "";
  if (bundle.bundleDigest !== digestOf(unsealed)) throw contractError("deliveryTrajectoryBundle.bundleDigest", "delivery trajectory bundle digest mismatch");
  return bundle;
}

function sealBundle(value: Omit<DeliveryTrajectoryBundle, "bundleDigest">): DeliveryTrajectoryBundle {
  const bundle: DeliveryTrajectoryBundle = { ...value, bundleDigest: "" };
  assertPrivacySafe(stableJson(bundle), "delivery trajectory bundle");
  bundle.bundleDigest = digestOf(bundle);
  return bundle;
}

function createBundle(
  arm: DeliveryTrajectoryArm,
  candidateId: string,
  loaded: LoadedDeliveryTrajectoryPack,
  sourceIdentity: SourceIdentity,
): DeliveryTrajectoryBundle {
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/.test(candidateId)) {
    throw contractError("candidateId", "candidate id must be a safe token");
  }
  const availability = expectedAvailability(arm);
  return sealBundle({
    arm,
    candidateId,
    cleanup: { persistentTemporaryFixtures: 0, processesRemaining: 0, sessionsRemaining: 0, status: "complete", terminal: true },
    effects: {
      createNewEvidenceRoot: true,
      modelCalls: 0,
      networkCalls: 0,
      processCalls: 0,
      productCalls: 0,
      providerCalls: 0,
      readClass: "governed-source-and-reviewed-seed-only",
      sessionCalls: 0,
      writes: ["bundle.json", "evaluation.json"],
    },
    inputIdentity: {
      candidateArtifactAvailability: availability,
      differenceName: DIFFERENCE_NAME,
      governedSourceDigest: sourceIdentity.governedDigest,
      reviewedInputDigest: reviewedInputDigest(loaded, sourceIdentity),
      seedByteDigest: loaded.seedByteDigest,
    },
    maximumClaim: MAXIMUM_CLAIM,
    observations: loaded.pack.members.map((member) => ({
      memberId: member.id,
      observation: { candidateArtifactAvailability: availability, evidenceKind: EVIDENCE_KIND },
    })),
    packDigest: loaded.packDigest,
    packId: PACK_ID,
    privacy: { absolutePathsEmitted: false, privatePathsEmitted: false, sourcePayloadsEmitted: false },
    schemaVersion: 1,
    sourceIdentity,
  });
}

export function readDeliveryTrajectoryBundle(
  bundlePath: string,
  loaded: LoadedDeliveryTrajectoryPack,
): DeliveryTrajectoryBundle {
  const text = readPrivacySafeText(bundlePath, "delivery trajectory bundle");
  return parseBundle(parseJson(text, "delivery trajectory bundle"), loaded);
}

export function evaluateDeliveryTrajectory(
  loaded: LoadedDeliveryTrajectoryPack,
  baseline: DeliveryTrajectoryBundle,
  candidate?: DeliveryTrajectoryBundle,
): DeliveryTrajectoryEvaluation {
  if (baseline.arm !== "baseline") throw contractError("deliveryTrajectoryEvaluation.baseline", "baseline bundle has the wrong arm");
  if (candidate != null) {
    if (candidate.arm !== "candidate") throw contractError("deliveryTrajectoryEvaluation.candidate", "candidate bundle has the wrong arm");
    if (candidate.packDigest !== baseline.packDigest || candidate.inputIdentity.reviewedInputDigest !== baseline.inputIdentity.reviewedInputDigest) {
      throw contractError("deliveryTrajectoryEvaluation.inputIdentity", "baseline and candidate reviewed inputs do not match");
    }
    if (digestOf(candidate.sourceIdentity) !== digestOf(baseline.sourceIdentity)) {
      throw contractError("deliveryTrajectoryEvaluation.sourceIdentity", "baseline and candidate governed source identities do not match");
    }
    if (baseline.inputIdentity.candidateArtifactAvailability !== "absent" || candidate.inputIdentity.candidateArtifactAvailability !== "available") {
      throw contractError("deliveryTrajectoryEvaluation.inputDifference", "candidate artifact availability is not the sole named input difference");
    }
  }

  const rows: DeliveryTrajectoryEvaluation["rows"] = [];
  for (const bundle of candidate == null ? [baseline] : [baseline, candidate]) {
    for (const member of loaded.pack.members) {
      const observation = bundle.observations.find((row) => row.memberId === member.id);
      if (observation == null) throw contractError("deliveryTrajectoryEvaluation.rows", "missing delivery trajectory observation");
      rows.push({ arm: bundle.arm, failures: [], memberId: member.id, passed: true });
    }
  }
  const result: DeliveryTrajectoryEvaluation = {
    bundleDigests: { baseline: baseline.bundleDigest, candidate: candidate?.bundleDigest ?? null },
    evaluationDigest: "",
    inputDifference: {
      baseline: "absent",
      candidate: candidate == null ? null : "available",
      matchedExceptNamedDifference: candidate == null ? null : true,
      name: DIFFERENCE_NAME,
    },
    liveCalls: 0,
    maximumClaim: MAXIMUM_CLAIM,
    modelCalls: 0,
    packId: PACK_ID,
    providerCalls: 0,
    rows,
    schemaVersion: 1,
    status: "passed",
  };
  result.evaluationDigest = digestOf(result);
  assertPrivacySafe(stableJson(result), "delivery trajectory evaluation");
  return result;
}

export function deliveryTrajectoryPreflight(repoRoot: string, gitRef: string): {
  governedDigest: string;
  governedSourcePaths: string[];
  maximumClaim: string;
  memberCount: 13;
  modelCalls: 0;
  pack: "delivery-trajectory";
  packId: typeof PACK_ID;
  processCalls: 0;
  providerCalls: 0;
  scenarioDigest: string;
  scenarioIds: string[];
  seedIdentity: { digest: string; path: typeof PACK_PATH };
  status: "ready";
} {
  if (gitRef !== "working-tree") throw contractError("sourceRef", "delivery-trajectory preflight requires --source-ref working-tree to remain process-free");
  const loaded = loadDeliveryTrajectoryPack(repoRoot);
  const source = governedSourceIdentity(repoRoot, gitRef, loaded.pack.governedSourcePaths);
  return {
    governedDigest: source.governedDigest,
    governedSourcePaths: loaded.pack.governedSourcePaths,
    maximumClaim: MAXIMUM_CLAIM,
    memberCount: 13,
    modelCalls: 0,
    pack: "delivery-trajectory",
    packId: PACK_ID,
    processCalls: 0,
    providerCalls: 0,
    scenarioDigest: loaded.packDigest,
    scenarioIds: loaded.pack.members.map((member) => member.id),
    seedIdentity: { digest: loaded.seedByteDigest, path: PACK_PATH },
    status: "ready",
  };
}

export function materializeDeliveryTrajectoryBundle(options: {
  arm: DeliveryTrajectoryArm;
  baselinePath?: string;
  candidateId: string;
  evidenceRoot: string;
  gitRef: string;
  repoRoot: string;
}): { bundle: DeliveryTrajectoryBundle; evaluation: DeliveryTrajectoryEvaluation } {
  if (options.gitRef !== "working-tree") throw contractError("sourceRef", "delivery-trajectory materialization requires --source-ref working-tree to remain process-free");
  if (!path.isAbsolute(options.evidenceRoot)) throw contractError("evidenceRoot", "delivery trajectory evidence root must be absolute");
  if (fs.existsSync(options.evidenceRoot)) throw contractError("evidenceRoot", "delivery trajectory evidence root must be create-new");
  if (options.arm === "candidate" && options.baselinePath == null) throw contractError("baseline", "delivery trajectory candidate capture requires --baseline");
  if (options.arm === "baseline" && options.baselinePath != null) throw contractError("baseline", "delivery trajectory baseline materialization does not accept --baseline");

  const loaded = loadDeliveryTrajectoryPack(options.repoRoot);
  const sourceIdentity = governedSourceIdentity(options.repoRoot, options.gitRef, loaded.pack.governedSourcePaths);
  const bundle = createBundle(options.arm, options.candidateId, loaded, sourceIdentity);
  const baseline = options.arm === "baseline"
    ? bundle
    : readDeliveryTrajectoryBundle(options.baselinePath!, loaded);
  const evaluation = evaluateDeliveryTrajectory(loaded, baseline, options.arm === "candidate" ? bundle : undefined);
  try {
    writeNewFile(path.join(options.evidenceRoot, "bundle.json"), stableJson(bundle));
    writeNewFile(path.join(options.evidenceRoot, "evaluation.json"), stableJson(evaluation));
  } catch (cause) {
    throw contractError("evidenceRoot", "delivery trajectory bundle materialization failed", cause);
  }
  return { bundle, evaluation };
}

export function replayDeliveryTrajectory(
  repoRoot: string,
  baselinePath: string,
  candidatePath?: string,
): DeliveryTrajectoryEvaluation {
  const loaded = loadDeliveryTrajectoryPack(repoRoot);
  const baseline = readDeliveryTrajectoryBundle(baselinePath, loaded);
  const candidate = candidatePath == null ? undefined : readDeliveryTrajectoryBundle(candidatePath, loaded);
  return evaluateDeliveryTrajectory(loaded, baseline, candidate);
}

type DeliveryTrajectoryConfiguredExpectedResult = {
  archive: "archived";
  disposition: "replan-outcome-preserving" | null;
  receiptCount: 0 | 1;
  successor: boolean;
  trajectory: "none" | "review-required";
};

type DeliveryTrajectoryConfiguredScenario = ScenarioRecord & {
  expectedResult: DeliveryTrajectoryConfiguredExpectedResult;
};

export type DeliveryTrajectoryConfiguredPack = {
  configuredProviderRequestBound: 2;
  governedSourcePaths: string[];
  id: "delivery-trajectory-configured-r1";
  maximumClaim: string;
  profile: "quality-independent";
  runtimeProfile: "core";
  scenarios: DeliveryTrajectoryConfiguredScenario[];
  schemaVersion: 1;
};

export type DeliveryTrajectoryConfiguredEvaluation = {
  candidateId: string;
  configuredRoute: string | null;
  effectiveConfigDigest: string;
  evaluationDigest: string;
  failures: string[];
  maximumClaim: string;
  modelCalls: number;
  openCodeSha256: string;
  openCodeVersion: string;
  packDigest: string;
  resolvedRoute: string | null;
  scenarioId: string;
  sourceDigest: string;
  status: "failed" | "passed";
};

function exactInteger(value: unknown, field: string): number {
  if (!Number.isSafeInteger(value) || (value as number) < 0) throw contractError(field, `${field} must be a non-negative integer`);
  return value as number;
}

function exactBoolean(value: unknown, field: string): boolean {
  if (typeof value !== "boolean") throw contractError(field, `${field} must be a boolean`);
  return value;
}

function parseConfiguredScenario(value: unknown, index: number): DeliveryTrajectoryConfiguredScenario {
  const field = `deliveryTrajectoryConfiguredPack.scenarios[${index}]`;
  const source = exactRecord(value, field, [
    "allowedEffects", "cleanupOracle", "configuredProviderRequestBound", "evidenceByteBound", "expectedOutcome",
    "expectedResult", "fixtureId", "fixturePath", "forbiddenEffects", "frictionFields", "id", "initialManifest",
    "permissions", "proofExpectations", "request", "sampleCount", "shape", "validationArgv",
  ]);
  const id = exactString(source.id, `${field}.id`);
  if (id !== CONFIGURED_SCENARIO_ORDER[index]) throw contractError(`${field}.id`, "configured scenario order drifted");
  if (source.shape !== "openspec-backed") throw contractError(`${field}.shape`, "configured trajectory scenarios must be OpenSpec-backed");
  const initialManifest = exactRecord(source.initialManifest, `${field}.initialManifest`, ["files"]);
  const expectedOutcome = exactRecord(source.expectedOutcome, `${field}.expectedOutcome`, ["exitCode", "stateFiles", "stdoutIncludes"]);
  const proof = exactRecord(source.proofExpectations, `${field}.proofExpectations`, ["argv", "exitCode", "stdoutIncludes"]);
  const permissions = exactRecord(source.permissions, `${field}.permissions`, ["allow", "deny"]);
  const cleanup = exactRecord(source.cleanupOracle, `${field}.cleanupOracle`, ["fixtureRemoved", "processesRemoved", "sessionsRemoved"]);
  const expected = exactRecord(source.expectedResult, `${field}.expectedResult`, ["archive", "disposition", "receiptCount", "successor", "trajectory"]);
  if (expected.archive !== "archived") throw contractError(`${field}.expectedResult.archive`, "configured archive expectation drifted");
  if (expected.trajectory !== "none" && expected.trajectory !== "review-required") throw contractError(`${field}.expectedResult.trajectory`, "invalid trajectory expectation");
  if (expected.disposition !== null && expected.disposition !== "replan-outcome-preserving") throw contractError(`${field}.expectedResult.disposition`, "invalid configured disposition");
  const receiptCount = exactInteger(expected.receiptCount, `${field}.expectedResult.receiptCount`);
  if (receiptCount !== 0 && receiptCount !== 1) throw contractError(`${field}.expectedResult.receiptCount`, "configured receipt count must be zero or one");
  const successor = exactBoolean(expected.successor, `${field}.expectedResult.successor`);
  if ((expected.trajectory === "none") !== (expected.disposition === null && receiptCount === 0 && !successor)) {
    throw contractError(`${field}.expectedResult`, "configured trajectory expectation is contradictory");
  }
  if ((expected.trajectory === "review-required") !== (expected.disposition === "replan-outcome-preserving" && receiptCount === 1 && successor)) {
    throw contractError(`${field}.expectedResult`, "configured review expectation is contradictory");
  }
  const frictionFields = exactStringArray(source.frictionFields, `${field}.frictionFields`) as FrictionField[];
  const expectedFriction: FrictionField[] = [
    "ownerQuestionCount", "configuredProviderRequestCount", "failedToolCallCount",
    "duplicateFailedToolInvocationCount", "totalToolCallCount",
  ];
  if (frictionFields.join("|") !== expectedFriction.join("|")) throw contractError(`${field}.frictionFields`, "configured friction fields drifted");
  const configuredProviderRequestBound = exactInteger(source.configuredProviderRequestBound, `${field}.configuredProviderRequestBound`);
  if (configuredProviderRequestBound !== 1) throw contractError(`${field}.configuredProviderRequestBound`, "each configured trajectory case permits one request");
  const sampleCount = exactInteger(source.sampleCount, `${field}.sampleCount`);
  if (sampleCount !== 1) throw contractError(`${field}.sampleCount`, "each configured trajectory case requires one sample");
  const evidenceByteBound = exactInteger(source.evidenceByteBound, `${field}.evidenceByteBound`);
  if (evidenceByteBound !== 524_288) throw contractError(`${field}.evidenceByteBound`, "configured trajectory evidence bound drifted");
  for (const key of ["fixtureRemoved", "processesRemoved", "sessionsRemoved"] as const) {
    if (cleanup[key] !== true) throw contractError(`${field}.cleanupOracle.${key}`, "configured trajectory cleanup must fail closed");
  }
  const scenario: DeliveryTrajectoryConfiguredScenario = {
    allowedEffects: exactStringArray(source.allowedEffects, `${field}.allowedEffects`),
    cleanupOracle: { fixtureRemoved: true, processesRemoved: true, sessionsRemoved: true },
    configuredProviderRequestBound: 1,
    evidenceByteBound,
    expectedOutcome: {
      exitCode: exactInteger(expectedOutcome.exitCode, `${field}.expectedOutcome.exitCode`),
      stateFiles: exactStringArray(expectedOutcome.stateFiles, `${field}.expectedOutcome.stateFiles`),
      stdoutIncludes: exactStringArray(expectedOutcome.stdoutIncludes, `${field}.expectedOutcome.stdoutIncludes`),
    },
    expectedResult: {
      archive: "archived",
      disposition: expected.disposition as DeliveryTrajectoryConfiguredExpectedResult["disposition"],
      receiptCount: receiptCount as 0 | 1,
      successor,
      trajectory: expected.trajectory,
    },
    fixtureId: exactString(source.fixtureId, `${field}.fixtureId`),
    fixturePath: exactString(source.fixturePath, `${field}.fixturePath`),
    forbiddenEffects: exactStringArray(source.forbiddenEffects, `${field}.forbiddenEffects`),
    frictionFields,
    id,
    initialManifest: { files: exactStringArray(initialManifest.files, `${field}.initialManifest.files`) },
    permissions: {
      allow: exactStringArray(permissions.allow, `${field}.permissions.allow`),
      deny: exactStringArray(permissions.deny, `${field}.permissions.deny`),
    },
    proofExpectations: {
      argv: exactStringArray(proof.argv, `${field}.proofExpectations.argv`),
      exitCode: exactInteger(proof.exitCode, `${field}.proofExpectations.exitCode`),
      stdoutIncludes: exactStringArray(proof.stdoutIncludes, `${field}.proofExpectations.stdoutIncludes`),
    },
    request: exactString(source.request, `${field}.request`),
    sampleCount,
    shape: "openspec-backed",
    validationArgv: exactStringArray(source.validationArgv, `${field}.validationArgv`),
  };
  if (scenario.fixtureId !== id || scenario.expectedOutcome.exitCode !== 0 || scenario.proofExpectations.exitCode !== 0) {
    throw contractError(field, "configured trajectory fixture identity or exit contract drifted");
  }
  return scenario;
}

export function loadDeliveryTrajectoryConfiguredPack(repoRoot: string): { digest: string; pack: DeliveryTrajectoryConfiguredPack } {
  const text = readPrivacySafeText(path.join(repoRoot, CONFIGURED_PACK_PATH), "configured delivery trajectory seed");
  const source = exactRecord(parseJson(text, "configured delivery trajectory seed"), "deliveryTrajectoryConfiguredPack", [
    "configuredProviderRequestBound", "governedSourcePaths", "id", "maximumClaim", "profile", "runtimeProfile", "scenarios", "schemaVersion",
  ]);
  if (source.schemaVersion !== 1 || source.id !== "delivery-trajectory-configured-r1" || source.profile !== "quality-independent" || source.runtimeProfile !== "core") {
    throw contractError("deliveryTrajectoryConfiguredPack", "configured delivery trajectory pack identity drifted");
  }
  if (source.configuredProviderRequestBound !== 2) throw contractError("deliveryTrajectoryConfiguredPack.configuredProviderRequestBound", "configured request bound must be two");
  const governedSourcePaths = exactStringArray(source.governedSourcePaths, "deliveryTrajectoryConfiguredPack.governedSourcePaths");
  if (governedSourcePaths.length === 0 || governedSourcePaths.some((entry) => path.isAbsolute(entry) || entry.split(/[\\/]/).includes(".."))) {
    throw contractError("deliveryTrajectoryConfiguredPack.governedSourcePaths", "configured governed paths must be explicit and contained");
  }
  if (!Array.isArray(source.scenarios) || source.scenarios.length !== CONFIGURED_SCENARIO_ORDER.length) {
    throw contractError("deliveryTrajectoryConfiguredPack.scenarios", "configured delivery trajectory pack must contain two scenarios");
  }
  const scenarios = source.scenarios.map(parseConfiguredScenario);
  for (const scenario of scenarios) verifyFixtureSeed(repoRoot, scenario);
  const pack: DeliveryTrajectoryConfiguredPack = {
    configuredProviderRequestBound: 2,
    governedSourcePaths,
    id: "delivery-trajectory-configured-r1",
    maximumClaim: exactString(source.maximumClaim, "deliveryTrajectoryConfiguredPack.maximumClaim"),
    profile: "quality-independent",
    runtimeProfile: "core",
    scenarios,
    schemaVersion: 1,
  };
  return { digest: digestOf(pack), pack };
}

export function selectDeliveryTrajectoryConfiguredScenario(
  pack: DeliveryTrajectoryConfiguredPack,
  scenarioId: string,
): DeliveryTrajectoryConfiguredPack {
  const scenarios = pack.scenarios.filter((scenario) => scenario.id === scenarioId);
  if (scenarios.length !== 1) throw contractError("scenarioId", `unknown configured delivery trajectory scenario: ${scenarioId}`);
  return { ...pack, configuredProviderRequestBound: 2, scenarios };
}

function configuredManifest(pack: DeliveryTrajectoryConfiguredPack): RegressionManifest {
  return {
    baselinePointerPath: "tools/proofs/baselines/delivery-trajectory-configured.json",
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
    scenarios: pack.scenarios,
    schemaVersion: 3,
  };
}

function readConfiguredDiagnostic(diagnosticPath: string): Record<string, unknown> {
  const text = readPrivacySafeText(diagnosticPath, "configured delivery trajectory diagnostic");
  const value = parseJson(text, "configured delivery trajectory diagnostic");
  if (value == null || typeof value !== "object" || Array.isArray(value)) throw contractError("diagnostic", "configured diagnostic must be an object");
  const diagnostic = value as Record<string, unknown>;
  const digest = exactString(diagnostic.digest, "diagnostic.digest");
  if (digest !== digestOf({ ...diagnostic, digest: "" })) throw contractError("diagnostic.digest", "configured diagnostic digest mismatch");
  return diagnostic;
}

function evaluateConfiguredDiagnostic(
  repoRoot: string,
  pack: DeliveryTrajectoryConfiguredPack,
  packDigest: string,
  diagnostic: Record<string, unknown>,
): DeliveryTrajectoryConfiguredEvaluation {
  if (pack.scenarios.length !== 1) throw contractError("configuredEvaluation", "configured evaluation requires one selected scenario");
  const scenario = pack.scenarios[0]!;
  const failures: string[] = [];
  if (diagnostic.scenarioDigest !== packDigest) failures.push("scenario-digest");
  if (diagnostic.scenarioId !== scenario.id) failures.push("scenario-id");
  if (diagnostic.terminalClassification !== "completed-observation") failures.push("terminal-classification");
  const cleanup = diagnostic.cleanup as Record<string, unknown> | undefined;
  if (cleanup?.complete !== true || cleanup.fixtureRemoved !== true || cleanup.processesRemoved !== true || cleanup.sessionsRemoved !== true) failures.push("cleanup");
  const providerRequestCount = typeof diagnostic.providerRequestCount === "number" ? diagnostic.providerRequestCount : -1;
  if (providerRequestCount < 1 || providerRequestCount > scenario.configuredProviderRequestBound) failures.push("provider-request-bound");
  const runtimeErrors = Array.isArray(diagnostic.runtimeErrors) ? diagnostic.runtimeErrors : ["missing"];
  if (runtimeErrors.length !== 0) failures.push("runtime-errors");
  const validation = diagnostic.validation as Record<string, unknown> | undefined;
  const proof = diagnostic.proof as Record<string, unknown> | undefined;
  if (validation?.status !== 0) failures.push("validation-status");
  if (proof?.status !== scenario.proofExpectations.exitCode) failures.push("proof-status");
  const proofStdout = typeof proof?.stdout === "string" ? proof.stdout : "";
  for (const marker of scenario.proofExpectations.stdoutIncludes) {
    if (!proofStdout.includes(marker)) failures.push(`proof-marker:${marker}`);
  }
  const session = diagnostic.session as Record<string, unknown> | undefined;
  const messages = session?.messages as Record<string, unknown> | undefined;
  const toolCalls = Array.isArray(messages?.toolCalls) ? messages.toolCalls as Array<Record<string, unknown>> : [];
  const prohibitedTools = new Set(["question", "task", "webfetch", "websearch"]);
  if (toolCalls.some((tool) => typeof tool.name === "string" && prohibitedTools.has(tool.name))) failures.push("prohibited-tool");
  const environment = diagnostic.environment as Record<string, unknown> | undefined;
  const startupFacts = environment?.startupFacts as Record<string, unknown> | undefined;
  if (startupFacts?.hostConfigLoaded === true || startupFacts?.ripgrepDownloadRequested === true) failures.push("runtime-isolation");
  const configuredRoute = typeof environment?.configuredRoute === "string" ? environment.configuredRoute : null;
  const resolvedRoute = typeof environment?.resolvedRoute === "string" ? environment.resolvedRoute : null;
  const profile = loadModelProfile(repoRoot, pack.profile).profile;
  const expectedRoute = `${profile.agent.build!.model}/${profile.agent.build!.variant}`;
  if (configuredRoute !== expectedRoute || resolvedRoute !== expectedRoute) failures.push("route-identity");
  const openCode = environment?.openCode as Record<string, unknown> | undefined;
  const openCodeSha256 = typeof openCode?.sha256 === "string" ? openCode.sha256 : "unknown";
  const openCodeVersion = typeof openCode?.version === "string" ? openCode.version : "unknown";
  if (!/^[a-f0-9]{64}$/.test(openCodeSha256) || openCodeVersion === "unknown") failures.push("opencode-identity");
  const runtimeManifest = Array.isArray(environment?.runtimeManifest)
    ? environment.runtimeManifest as Array<Record<string, unknown>>
    : [];
  const effectiveConfigRows = runtimeManifest.filter((row) => typeof row.path === "string" && row.path.startsWith("candidate-config/"));
  const effectiveConfigDigest = effectiveConfigRows.length === 0 ? "unknown" : digestOf(effectiveConfigRows);
  if (effectiveConfigDigest === "unknown") failures.push("effective-config-identity");
  const sourceIdentity = diagnostic.sourceIdentity as Record<string, unknown> | undefined;
  const sourceDigest = typeof sourceIdentity?.governedDigest === "string" ? sourceIdentity.governedDigest : "unknown";
  if (!/^[a-f0-9]{64}$/.test(sourceDigest)) failures.push("source-identity");
  const candidateId = typeof diagnostic.candidateId === "string" ? diagnostic.candidateId : "unknown";
  if (candidateId === "unknown") failures.push("candidate-id");
  const evaluation: DeliveryTrajectoryConfiguredEvaluation = {
    candidateId,
    configuredRoute,
    effectiveConfigDigest,
    evaluationDigest: "",
    failures: [...new Set(failures)].sort((left, right) => left.localeCompare(right)),
    maximumClaim: pack.maximumClaim,
    modelCalls: providerRequestCount < 0 ? 0 : providerRequestCount,
    openCodeSha256,
    openCodeVersion,
    packDigest,
    resolvedRoute,
    scenarioId: scenario.id,
    sourceDigest,
    status: failures.length === 0 ? "passed" : "failed",
  };
  evaluation.evaluationDigest = digestOf(evaluation);
  assertPrivacySafe(stableJson(evaluation), "configured delivery trajectory evaluation");
  return evaluation;
}

export function deliveryTrajectoryConfiguredPreflight(options: {
  candidateConfigDir: string;
  executable: string;
  gitRef: string;
  repoRoot: string;
  scenarioIds?: string[];
}): Record<string, unknown> {
  if (options.gitRef !== "working-tree") throw contractError("sourceRef", "configured delivery trajectory preflight requires --source-ref working-tree");
  const loaded = loadDeliveryTrajectoryConfiguredPack(options.repoRoot);
  const selectedIds = options.scenarioIds ?? loaded.pack.scenarios.map((scenario) => scenario.id);
  if (selectedIds.length === 0 || new Set(selectedIds).size !== selectedIds.length) throw contractError("scenarioIds", "configured scenario ids must be unique and non-empty");
  const selected = selectedIds.map((id) => selectDeliveryTrajectoryConfiguredScenario(loaded.pack, id).scenarios[0]!);
  const configDir = path.resolve(options.candidateConfigDir);
  for (const relative of [
    "opencode.json",
    "skills/openspec-archive-change/SKILL.md",
    "skills/roadmap-delivery-trajectory/SKILL.md",
    "bin/openspec-archive.ts",
    "bin/delivery-trajectory-context.ts",
    "bin/openspec-change/delivery-horizon.ts",
  ]) {
    if (!fs.existsSync(path.join(configDir, relative))) throw contractError("candidateConfigDir", `generated core capability is missing: ${relative}`);
  }
  const source = governedSourceIdentity(options.repoRoot, options.gitRef, loaded.pack.governedSourcePaths);
  return {
    configuredProviderRequestBound: selected.reduce((sum, scenario) => sum + scenario.configuredProviderRequestBound, 0),
    governedDigest: source.governedDigest,
    governedSourcePaths: loaded.pack.governedSourcePaths,
    liveAttemptGate: "clear-after-this-provider-free-preflight",
    maximumClaim: loaded.pack.maximumClaim,
    mode: "preflight",
    modelCalls: 0,
    openCode: installedOpenCodeIdentity(options.executable),
    pack: loaded.pack.id,
    packDigest: loaded.digest,
    runtimeProfile: loaded.pack.runtimeProfile,
    scenarioIds: selected.map((scenario) => scenario.id),
    status: "ready",
  };
}

export async function captureDeliveryTrajectoryConfigured(options: {
  candidateConfigDir: string;
  candidateId: string;
  evidenceRoot: string;
  executable: string;
  gitRef: string;
  repoRoot: string;
  scenarioId: string;
}): Promise<{ diagnostic: Record<string, unknown>; evaluation: DeliveryTrajectoryConfiguredEvaluation }> {
  if (options.gitRef !== "working-tree") throw contractError("sourceRef", "configured delivery trajectory capture requires --source-ref working-tree");
  const loaded = loadDeliveryTrajectoryConfiguredPack(options.repoRoot);
  const selected = selectDeliveryTrajectoryConfiguredScenario(loaded.pack, options.scenarioId);
  const sourceIdentity = governedSourceIdentity(options.repoRoot, options.gitRef, loaded.pack.governedSourcePaths);
  const diagnostic = await captureConfiguredDiagnostic(configuredManifest(selected), loaded.digest, {
    candidateConfigDir: options.candidateConfigDir,
    candidateId: options.candidateId,
    evidenceRoot: options.evidenceRoot,
    executable: options.executable,
    repoRoot: options.repoRoot,
    retainChangedText: true,
    sourceIdentity,
  });
  const evaluation = evaluateConfiguredDiagnostic(options.repoRoot, selected, loaded.digest, diagnostic);
  writeNewFile(path.join(options.evidenceRoot, "evaluation.json"), `${JSON.stringify(evaluation, null, 2)}\n`);
  return { diagnostic, evaluation };
}

export function replayDeliveryTrajectoryConfigured(
  repoRoot: string,
  diagnosticPath: string,
  scenarioId: string,
): DeliveryTrajectoryConfiguredEvaluation {
  const loaded = loadDeliveryTrajectoryConfiguredPack(repoRoot);
  const selected = selectDeliveryTrajectoryConfiguredScenario(loaded.pack, scenarioId);
  return evaluateConfiguredDiagnostic(repoRoot, selected, loaded.digest, readConfiguredDiagnostic(diagnosticPath));
}
