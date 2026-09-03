import fs from "node:fs";
import path from "node:path";

import { loadBeadsReleaseManifest } from "../../../global/bin/beads-portfolio-bridge/beads-release.ts";
import {
  BEADS_PORTFOLIO_HELPER_DIRECTORY,
  BEADS_PORTFOLIO_SKILL,
  loadRuntimeSurfaceProfile,
} from "../../runtime-surface-profile.ts";
import {
  type SourceIdentity,
  ContractError,
  assertPrivacySafe,
  digestOf,
  governedSourceIdentity,
  stableJson,
  writeNewFile,
} from "./contracts.ts";

const PACK_PATH = "tools/proofs/fixtures/consumer-outcome/beads-portfolio-bridge-r1.json";
const PACK_ID = "beads-portfolio-bridge-r1";
const CLAIM_ID = "BPB-001";
const MAXIMUM_CLAIM = "provider-free deterministic materialization for the exact reviewed BPB-001 source population and its first Kaizen, workstation, profile, and installed-pilot consumers under the current governed working-tree identity only; it proves seed/schema/readback, current release and profile correlation, deliberate red detection, stable output, and zero provider, network, remote, project, or protected-host effects, not an installed executable, enabled project, production claim, remote portfolio, or protected rollback";
const SECTION_ORDER = ["release", "repository", "kaizen", "dependency", "assignment", "link", "terminal", "profiles", "gitEffects", "workstation"] as const;
const GOVERNED_SOURCE_PATHS = [
  "tools/proofs/consumer-outcome-regression.ts",
  "tools/proofs/consumer-outcome/contracts.ts",
  "tools/proofs/consumer-outcome/beads-portfolio-bridge.ts",
  PACK_PATH,
  "global/bin/beads-portfolio-bridge/beads-release.manifest.json",
  "global/bin/beads-portfolio-bridge/beads-release.ts",
  "global/bin/beads-portfolio-bridge/beads-vendor-adapter.ts",
  "global/bin/beads-portfolio-bridge/beads-bridge-registration.ts",
  "global/bin/beads-portfolio-bridge/beads-project-lifecycle.ts",
  "global/bin/beads-portfolio-bridge/beads-kaizen-orchestrator.ts",
  "tools/windows/beads-workstation-lifecycle.ts",
  "tools/runtime-surface-profile.ts",
  "profiles/core.json",
  "profiles/core-beads.json",
  "profiles/all.json",
  "tools/test-beads-kaizen-orchestrator.ts",
  "tools/test-beads-workstation-lifecycle.ts",
] as const;
const SAFE_TOKEN = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/u;

export type BeadsPortfolioBridgeSection = typeof SECTION_ORDER[number];

export type BeadsPortfolioBridgePack = {
  schemaVersion: 1;
  id: typeof PACK_ID;
  claimId: typeof CLAIM_ID;
  maximumClaim: typeof MAXIMUM_CLAIM;
  governedSourcePaths: string[];
  release: { version: string; buildCommit: string; platform: string; architecture: string; archiveSha256: string; executableSha256: string; executableBytes: number };
  repository: { prefix: string; requiredTrackedPaths: string[]; allowedCreatedPaths: string[]; allowedModifiedPaths: string[]; forbiddenEffects: string[] };
  kaizen: { signalKind: string; decision: string; ownerClass: string; bridgeSchemaVersion: number; metadataKeys: string[]; promotionStatus: string; replayStatus: string };
  dependency: { relationType: string; beforeReady: boolean; afterReady: boolean; replayChanged: boolean; sourceExecution: string; productionClaimAvailable: boolean };
  assignment: { assignee: string; taskRef: string; sessionRef: string; changed: boolean; replayChanged: boolean; productionClaimAvailable: boolean };
  link: { changeRef: string; specId: string; interruption: string; readbackPersisted: boolean; resumedChanged: boolean; conflictingLinkRejected: boolean };
  terminal: { archiveStatus: string; runtimeProofStatus: string; validationStatus: string; externalEffectsStatus: string; sourceWriterStatus: string; cleanupStatus: string; closeBeforeResolve: boolean; resumedSignalResolved: boolean; replayChanged: boolean };
  profiles: { defaultProfile: string; coreBeadsSkillCount: number; coreBeadsHelperCount: number; coreBeadsProfileSkillCount: number; coreBeadsProfileHelperCount: number; allBeadsSkillCount: number; allBeadsHelperCount: number; configMode: string; prohibitedSurfaces: string[] };
  gitEffects: { trackedStatusBefore: string; trackedStatusAfter: string; remoteCount: number; agentInstructionCreated: boolean; providerCalls: number; networkCalls: number; sourceCommitCount: number };
  workstation: { previewStatus: string; installStatus: string; checkStatus: string; activeWriterRollbackStatus: string; activeWriterRollbackReason: string; terminalRollbackStatus: string; retainedKinds: string[]; removedKinds: string[]; nonEffects: string[] };
  redControls: Array<{ id: string; section: BeadsPortfolioBridgeSection; expectedFailureId: string }>;
};

export type BeadsPortfolioBridgeEvaluation = {
  schemaVersion: 1;
  packId: typeof PACK_ID;
  memberIds: BeadsPortfolioBridgeSection[];
  rows: Array<{ memberId: BeadsPortfolioBridgeSection; controlId: string | null; kind: "green" | "red"; expectedFailureIds: string[]; actualFailureIds: string[]; oracleMatched: boolean }>;
  liveCalls: 0;
  modelCalls: 0;
  networkCalls: 0;
  processCalls: 0;
  providerCalls: 0;
  projectWrites: 0;
  protectedHostWrites: 0;
  remoteEffects: 0;
  maximumClaim: typeof MAXIMUM_CLAIM;
  status: "failed" | "passed";
  evaluationDigest: string;
};

export type BeadsPortfolioBridgeBundle = {
  schemaVersion: 1;
  candidateId: string;
  pack: BeadsPortfolioBridgePack;
  packDigest: string;
  sourceIdentity: SourceIdentity;
  evaluation: BeadsPortfolioBridgeEvaluation;
  effects: { evidenceWrites: 2; modelCalls: 0; networkCalls: 0; processCalls: 0; providerCalls: 0; projectWrites: 0; protectedHostWrites: 0; remoteEffects: 0 };
  cleanup: { status: "complete"; terminal: true; persistentTemporaryFiles: 0; processesRemaining: 0; sessionsRemaining: 0 };
  bundleDigest: string;
};

const TOP_KEYS = ["schemaVersion", "id", "claimId", "maximumClaim", "governedSourcePaths", ...SECTION_ORDER, "redControls"] as const;
const SECTION_KEYS: Record<BeadsPortfolioBridgeSection, readonly string[]> = {
  release: ["version", "buildCommit", "platform", "architecture", "archiveSha256", "executableSha256", "executableBytes"],
  repository: ["prefix", "requiredTrackedPaths", "allowedCreatedPaths", "allowedModifiedPaths", "forbiddenEffects"],
  kaizen: ["signalKind", "decision", "ownerClass", "bridgeSchemaVersion", "metadataKeys", "promotionStatus", "replayStatus"],
  dependency: ["relationType", "beforeReady", "afterReady", "replayChanged", "sourceExecution", "productionClaimAvailable"],
  assignment: ["assignee", "taskRef", "sessionRef", "changed", "replayChanged", "productionClaimAvailable"],
  link: ["changeRef", "specId", "interruption", "readbackPersisted", "resumedChanged", "conflictingLinkRejected"],
  terminal: ["archiveStatus", "runtimeProofStatus", "validationStatus", "externalEffectsStatus", "sourceWriterStatus", "cleanupStatus", "closeBeforeResolve", "resumedSignalResolved", "replayChanged"],
  profiles: ["defaultProfile", "coreBeadsSkillCount", "coreBeadsHelperCount", "coreBeadsProfileSkillCount", "coreBeadsProfileHelperCount", "allBeadsSkillCount", "allBeadsHelperCount", "configMode", "prohibitedSurfaces"],
  gitEffects: ["trackedStatusBefore", "trackedStatusAfter", "remoteCount", "agentInstructionCreated", "providerCalls", "networkCalls", "sourceCommitCount"],
  workstation: ["previewStatus", "installStatus", "checkStatus", "activeWriterRollbackStatus", "activeWriterRollbackReason", "terminalRollbackStatus", "retainedKinds", "removedKinds", "nonEffects"],
};
const ARRAY_FIELDS = new Set(["requiredTrackedPaths", "allowedCreatedPaths", "allowedModifiedPaths", "forbiddenEffects", "metadataKeys", "prohibitedSurfaces", "retainedKinds", "removedKinds", "nonEffects"]);
const BOOLEAN_FIELDS = new Set(["beforeReady", "afterReady", "replayChanged", "productionClaimAvailable", "changed", "readbackPersisted", "resumedChanged", "conflictingLinkRejected", "closeBeforeResolve", "resumedSignalResolved", "agentInstructionCreated"]);
const INTEGER_FIELDS = new Set(["executableBytes", "bridgeSchemaVersion", "coreBeadsSkillCount", "coreBeadsHelperCount", "coreBeadsProfileSkillCount", "coreBeadsProfileHelperCount", "allBeadsSkillCount", "allBeadsHelperCount", "remoteCount", "providerCalls", "networkCalls", "sourceCommitCount"]);

function error(field: string, message: string, cause?: unknown): ContractError {
  const result = new ContractError(field, message);
  if (cause != null) (result as ContractError & { cause?: unknown }).cause = cause;
  return result;
}

function record(value: unknown, field: string, keys: readonly string[]): Record<string, unknown> {
  if (value == null || typeof value !== "object" || Array.isArray(value)) throw error(field, `${field} must be an object`);
  const source = value as Record<string, unknown>;
  const actual = Object.keys(source).sort((left, right) => left.localeCompare(right));
  const expected = [...keys].sort((left, right) => left.localeCompare(right));
  if (actual.join("\n") !== expected.join("\n")) throw error(field, `${field} must contain exactly: ${expected.join(", ")}`);
  return source;
}

function string(value: unknown, field: string, allowEmpty = false): string {
  if (typeof value !== "string" || (!allowEmpty && value.length === 0) || value.length > 512 || value.includes("\0") || value.includes("\n")) {
    throw error(field, `${field} must be bounded single-line text`);
  }
  return value;
}

function stringArray(value: unknown, field: string, maximum = 16): string[] {
  if (!Array.isArray(value) || value.length === 0 || value.length > maximum) throw error(field, `${field} must be a bounded non-empty array`);
  const result = value.map((item, index) => string(item, `${field}[${index}]`));
  if (new Set(result).size !== result.length) throw error(field, `${field} must contain unique values`);
  return result;
}

function integer(value: unknown, field: string): number {
  if (!Number.isSafeInteger(value) || (value as number) < 0) throw error(field, `${field} must be a non-negative integer`);
  return value as number;
}

function boolean(value: unknown, field: string): boolean {
  if (typeof value !== "boolean") throw error(field, `${field} must be boolean`);
  return value;
}

function parseSection<T extends BeadsPortfolioBridgeSection>(value: unknown, section: T): BeadsPortfolioBridgePack[T] {
  const source = record(value, `beadsPortfolioBridgePack.${section}`, SECTION_KEYS[section]);
  for (const [key, item] of Object.entries(source)) {
    const field = `beadsPortfolioBridgePack.${section}.${key}`;
    if (ARRAY_FIELDS.has(key)) stringArray(item, field);
    else if (BOOLEAN_FIELDS.has(key)) boolean(item, field);
    else if (INTEGER_FIELDS.has(key)) integer(item, field);
    else string(item, field, section === "gitEffects" && (key === "trackedStatusBefore" || key === "trackedStatusAfter"));
  }
  return source as BeadsPortfolioBridgePack[T];
}

export function parseBeadsPortfolioBridgePack(value: unknown): BeadsPortfolioBridgePack {
  const source = record(value, "beadsPortfolioBridgePack", TOP_KEYS);
  if (source.schemaVersion !== 1 || source.id !== PACK_ID || source.claimId !== CLAIM_ID || source.maximumClaim !== MAXIMUM_CLAIM) {
    throw error("beadsPortfolioBridgePack", "Beads portfolio bridge pack identity drifted");
  }
  const governedSourcePaths = stringArray(source.governedSourcePaths, "beadsPortfolioBridgePack.governedSourcePaths", GOVERNED_SOURCE_PATHS.length);
  if (governedSourcePaths.join("\n") !== GOVERNED_SOURCE_PATHS.join("\n")) throw error("beadsPortfolioBridgePack.governedSourcePaths", "governed source order drifted");
  if (!Array.isArray(source.redControls) || source.redControls.length !== SECTION_ORDER.length) throw error("beadsPortfolioBridgePack.redControls", "red-control population is incomplete");
  const redControls = source.redControls.map((value, index) => {
    const field = `beadsPortfolioBridgePack.redControls[${index}]`;
    const control = record(value, field, ["id", "section", "expectedFailureId"]);
    const section = string(control.section, `${field}.section`) as BeadsPortfolioBridgeSection;
    if (section !== SECTION_ORDER[index]) throw error(`${field}.section`, "red-control section order drifted");
    const expectedFailureId = string(control.expectedFailureId, `${field}.expectedFailureId`);
    if (expectedFailureId !== `${section}-drift`) throw error(`${field}.expectedFailureId`, "red-control failure identity drifted");
    return { id: string(control.id, `${field}.id`), section, expectedFailureId };
  });
  if (new Set(redControls.map((control) => control.id)).size !== redControls.length) throw error("beadsPortfolioBridgePack.redControls", "red-control ids must be unique");
  return {
    schemaVersion: 1,
    id: PACK_ID,
    claimId: CLAIM_ID,
    maximumClaim: MAXIMUM_CLAIM,
    governedSourcePaths,
    release: parseSection(source.release, "release"),
    repository: parseSection(source.repository, "repository"),
    kaizen: parseSection(source.kaizen, "kaizen"),
    dependency: parseSection(source.dependency, "dependency"),
    assignment: parseSection(source.assignment, "assignment"),
    link: parseSection(source.link, "link"),
    terminal: parseSection(source.terminal, "terminal"),
    profiles: parseSection(source.profiles, "profiles"),
    gitEffects: parseSection(source.gitEffects, "gitEffects"),
    workstation: parseSection(source.workstation, "workstation"),
    redControls,
  };
}

export function loadBeadsPortfolioBridgePack(repoRoot: string): { pack: BeadsPortfolioBridgePack; packDigest: string; seedByteDigest: string } {
  let source: string;
  try {
    source = fs.readFileSync(path.join(repoRoot, PACK_PATH), "utf8");
  } catch (cause) {
    throw error("beadsPortfolioBridgePack", "Beads portfolio bridge seed is unreadable", cause);
  }
  assertPrivacySafe(source, "Beads portfolio bridge seed");
  try {
    const pack = parseBeadsPortfolioBridgePack(JSON.parse(source));
    return { pack, packDigest: digestOf(pack), seedByteDigest: digestOf(source) };
  } catch (cause) {
    if (cause instanceof ContractError) throw cause;
    throw error("beadsPortfolioBridgePack", "Beads portfolio bridge seed is invalid", cause);
  }
}

function currentSectionFailures(repoRoot: string, pack: BeadsPortfolioBridgePack, section: BeadsPortfolioBridgeSection): string[] {
  if (section === "release") {
    const manifest = loadBeadsReleaseManifest(path.join(repoRoot, "global/bin/beads-portfolio-bridge/beads-release.manifest.json"));
    const current = {
      version: manifest.release.version,
      buildCommit: manifest.release.buildCommit,
      platform: manifest.release.platform,
      architecture: manifest.release.architecture,
      archiveSha256: manifest.release.archive.sha256,
      executableSha256: manifest.release.executable.sha256,
      executableBytes: manifest.release.executable.bytes,
    };
    return stableJson(current) === stableJson(pack.release) ? [] : ["release-drift"];
  }
  if (section === "repository") {
    const manifest = loadBeadsReleaseManifest(path.join(repoRoot, "global/bin/beads-portfolio-bridge/beads-release.manifest.json"));
    const current = {
      prefix: "BPB",
      requiredTrackedPaths: manifest.initialization.requiredTrackedFiles.map((item) => item.path),
      allowedCreatedPaths: manifest.initialization.allowedCreatedPaths,
      allowedModifiedPaths: manifest.initialization.allowedModifiedPaths,
      forbiddenEffects: manifest.initialization.forbiddenEffects,
    };
    return stableJson(current) === stableJson(pack.repository) ? [] : ["repository-drift"];
  }
  if (section === "profiles") {
    const core = loadRuntimeSurfaceProfile(repoRoot, "core");
    const coreBeads = loadRuntimeSurfaceProfile(repoRoot, "core-beads");
    const all = loadRuntimeSurfaceProfile(repoRoot, "all");
    if (core.profile == null || coreBeads.profile == null || all.profile == null || core.errors.length + coreBeads.errors.length + all.errors.length > 0) return ["profiles-drift"];
    const helperSelections = (directories: string[]) => directories.filter((name) => BEADS_PORTFOLIO_HELPER_DIRECTORY === name || BEADS_PORTFOLIO_HELPER_DIRECTORY.startsWith(`${name}/`)).length;
    const current = {
      defaultProfile: "core",
      coreBeadsSkillCount: core.profile.skills.filter((name) => name === BEADS_PORTFOLIO_SKILL).length,
      coreBeadsHelperCount: helperSelections(core.profile.directories),
      coreBeadsProfileSkillCount: coreBeads.profile.skills.filter((name) => name === BEADS_PORTFOLIO_SKILL).length,
      coreBeadsProfileHelperCount: helperSelections(coreBeads.profile.directories),
      allBeadsSkillCount: all.profile.skills.filter((name) => name === BEADS_PORTFOLIO_SKILL).length,
      allBeadsHelperCount: helperSelections(all.profile.directories),
      configMode: coreBeads.profile.configMode,
      prohibitedSurfaces: pack.profiles.prohibitedSurfaces,
    };
    return stableJson(current) === stableJson(pack.profiles) ? [] : ["profiles-drift"];
  }
  return [];
}

function mutateSection(pack: BeadsPortfolioBridgePack, section: BeadsPortfolioBridgeSection): BeadsPortfolioBridgePack {
  const mutated = structuredClone(pack);
  if (section === "release") mutated.release.version = "1.2.3";
  else if (section === "repository") mutated.repository.prefix = "DRIFT";
  else if (section === "kaizen") mutated.kaizen.bridgeSchemaVersion = 2;
  else if (section === "dependency") mutated.dependency.relationType = "parent-child";
  else if (section === "assignment") mutated.assignment.assignee = "agent:drift";
  else if (section === "link") mutated.link.changeRef = "drift-change";
  else if (section === "terminal") mutated.terminal.archiveStatus = "active";
  else if (section === "profiles") mutated.profiles.coreBeadsProfileSkillCount = 0;
  else if (section === "gitEffects") mutated.gitEffects.remoteCount = 1;
  else mutated.workstation.installStatus = "failed";
  return mutated;
}

export function evaluateBeadsPortfolioBridgePack(repoRoot: string, pack: BeadsPortfolioBridgePack): BeadsPortfolioBridgeEvaluation {
  const rows: BeadsPortfolioBridgeEvaluation["rows"] = [];
  for (const section of SECTION_ORDER) {
    const actualFailureIds = currentSectionFailures(repoRoot, pack, section);
    rows.push({ memberId: section, controlId: null, kind: "green", expectedFailureIds: [], actualFailureIds, oracleMatched: actualFailureIds.length === 0 });
    const control = pack.redControls.find((item) => item.section === section)!;
    const mutated = mutateSection(pack, section);
    const redFailures = stableJson(mutated[section]) === stableJson(pack[section]) ? [] : [`${section}-drift`];
    rows.push({ memberId: section, controlId: control.id, kind: "red", expectedFailureIds: [control.expectedFailureId], actualFailureIds: redFailures, oracleMatched: redFailures.join("\n") === control.expectedFailureId });
  }
  const evaluation: BeadsPortfolioBridgeEvaluation = {
    schemaVersion: 1,
    packId: PACK_ID,
    memberIds: [...SECTION_ORDER],
    rows,
    liveCalls: 0,
    modelCalls: 0,
    networkCalls: 0,
    processCalls: 0,
    providerCalls: 0,
    projectWrites: 0,
    protectedHostWrites: 0,
    remoteEffects: 0,
    maximumClaim: MAXIMUM_CLAIM,
    status: rows.every((row) => row.oracleMatched) ? "passed" : "failed",
    evaluationDigest: "",
  };
  evaluation.evaluationDigest = digestOf(evaluation);
  assertPrivacySafe(stableJson(evaluation), "Beads portfolio bridge evaluation");
  return evaluation;
}

function sealBundle(value: Omit<BeadsPortfolioBridgeBundle, "bundleDigest">): BeadsPortfolioBridgeBundle {
  const bundle: BeadsPortfolioBridgeBundle = { ...value, bundleDigest: "" };
  assertPrivacySafe(stableJson(bundle), "Beads portfolio bridge bundle");
  bundle.bundleDigest = digestOf(bundle);
  return bundle;
}

export function beadsPortfolioBridgePreflight(repoRoot: string, gitRef: string): Record<string, unknown> {
  if (gitRef !== "working-tree") throw error("sourceRef", "Beads portfolio bridge preflight requires --source-ref working-tree");
  const loaded = loadBeadsPortfolioBridgePack(repoRoot);
  const source = governedSourceIdentity(repoRoot, gitRef, loaded.pack.governedSourcePaths);
  const evaluation = evaluateBeadsPortfolioBridgePack(repoRoot, loaded.pack);
  return {
    mode: "preflight",
    pack: "beads-portfolio-bridge",
    packId: PACK_ID,
    claimId: CLAIM_ID,
    memberIds: [...SECTION_ORDER],
    memberCount: SECTION_ORDER.length,
    redControlCount: loaded.pack.redControls.length,
    governedDigest: source.governedDigest,
    governedSourcePaths: loaded.pack.governedSourcePaths,
    scenarioDigest: loaded.packDigest,
    seedIdentity: { path: PACK_PATH, digest: loaded.seedByteDigest },
    liveCalls: 0,
    modelCalls: 0,
    networkCalls: 0,
    processCalls: 0,
    providerCalls: 0,
    projectWrites: 0,
    protectedHostWrites: 0,
    remoteEffects: 0,
    maximumClaim: MAXIMUM_CLAIM,
    status: evaluation.status === "passed" ? "ready" : "failed",
  };
}

export function materializeBeadsPortfolioBridgeBundle(options: { candidateId: string; evidenceRoot: string; gitRef: string; repoRoot: string }): { bundle: BeadsPortfolioBridgeBundle; evaluation: BeadsPortfolioBridgeEvaluation } {
  if (options.gitRef !== "working-tree") throw error("sourceRef", "Beads portfolio bridge materialization requires --source-ref working-tree");
  if (!SAFE_TOKEN.test(options.candidateId)) throw error("candidateId", "candidate id must be a safe token");
  if (!path.isAbsolute(options.evidenceRoot) || fs.existsSync(options.evidenceRoot)) throw error("evidenceRoot", "Beads portfolio bridge evidence root must be absolute and create-new");
  const loaded = loadBeadsPortfolioBridgePack(options.repoRoot);
  const sourceIdentity = governedSourceIdentity(options.repoRoot, options.gitRef, loaded.pack.governedSourcePaths);
  const evaluation = evaluateBeadsPortfolioBridgePack(options.repoRoot, loaded.pack);
  const bundle = sealBundle({
    schemaVersion: 1,
    candidateId: options.candidateId,
    pack: loaded.pack,
    packDigest: loaded.packDigest,
    sourceIdentity,
    evaluation,
    effects: { evidenceWrites: 2, modelCalls: 0, networkCalls: 0, processCalls: 0, providerCalls: 0, projectWrites: 0, protectedHostWrites: 0, remoteEffects: 0 },
    cleanup: { status: "complete", terminal: true, persistentTemporaryFiles: 0, processesRemaining: 0, sessionsRemaining: 0 },
  });
  try {
    writeNewFile(path.join(options.evidenceRoot, "bundle.json"), stableJson(bundle));
    writeNewFile(path.join(options.evidenceRoot, "evaluation.json"), stableJson(evaluation));
  } catch (cause) {
    fs.rmSync(options.evidenceRoot, { recursive: true, force: true });
    throw error("evidenceRoot", "Beads portfolio bridge materialization failed", cause);
  }
  return { bundle, evaluation };
}

export function replayBeadsPortfolioBridgeBundle(repoRoot: string, bundlePath: string): { bundle: BeadsPortfolioBridgeBundle; evaluation: BeadsPortfolioBridgeEvaluation } {
  let source: string;
  try {
    source = fs.readFileSync(bundlePath, "utf8");
  } catch (cause) {
    throw error("beadsPortfolioBridgeBundle", "Beads portfolio bridge bundle is unreadable", cause);
  }
  assertPrivacySafe(source, "Beads portfolio bridge bundle");
  let parsed: unknown;
  try {
    parsed = JSON.parse(source);
  } catch (cause) {
    throw error("beadsPortfolioBridgeBundle", "Beads portfolio bridge bundle is not valid JSON", cause);
  }
  const value = record(parsed, "beadsPortfolioBridgeBundle", ["schemaVersion", "candidateId", "pack", "packDigest", "sourceIdentity", "evaluation", "effects", "cleanup", "bundleDigest"]);
  if (value.schemaVersion !== 1) throw error("beadsPortfolioBridgeBundle.schemaVersion", "unsupported bundle schema");
  const pack = parseBeadsPortfolioBridgePack(value.pack);
  const current = loadBeadsPortfolioBridgePack(repoRoot);
  if (value.packDigest !== current.packDigest || value.packDigest !== digestOf(pack) || stableJson(pack) !== stableJson(current.pack)) throw error("beadsPortfolioBridgeBundle.packDigest", "pack digest mismatch");
  const evaluation = evaluateBeadsPortfolioBridgePack(repoRoot, pack);
  if (stableJson(value.evaluation) !== stableJson(evaluation)) throw error("beadsPortfolioBridgeBundle.evaluation", "evaluation mismatch");
  if (stableJson(value.sourceIdentity) !== stableJson(governedSourceIdentity(repoRoot, "working-tree", pack.governedSourcePaths))) throw error("beadsPortfolioBridgeBundle.sourceIdentity", "governed source identity mismatch");
  const effects = record(value.effects, "beadsPortfolioBridgeBundle.effects", ["evidenceWrites", "modelCalls", "networkCalls", "processCalls", "providerCalls", "projectWrites", "protectedHostWrites", "remoteEffects"]);
  if (effects.evidenceWrites !== 2 || Object.entries(effects).some(([key, count]) => key !== "evidenceWrites" && count !== 0)) throw error("beadsPortfolioBridgeBundle.effects", "effect facts mismatch");
  const cleanup = record(value.cleanup, "beadsPortfolioBridgeBundle.cleanup", ["status", "terminal", "persistentTemporaryFiles", "processesRemaining", "sessionsRemaining"]);
  if (cleanup.status !== "complete" || cleanup.terminal !== true || cleanup.persistentTemporaryFiles !== 0 || cleanup.processesRemaining !== 0 || cleanup.sessionsRemaining !== 0) throw error("beadsPortfolioBridgeBundle.cleanup", "cleanup facts mismatch");
  const bundle = value as unknown as BeadsPortfolioBridgeBundle;
  if (!SAFE_TOKEN.test(bundle.candidateId)) throw error("beadsPortfolioBridgeBundle.candidateId", "candidate id is invalid");
  const unsealed = structuredClone(bundle);
  unsealed.bundleDigest = "";
  if (bundle.bundleDigest !== digestOf(unsealed)) throw error("beadsPortfolioBridgeBundle.bundleDigest", "bundle digest mismatch");
  return { bundle, evaluation };
}
