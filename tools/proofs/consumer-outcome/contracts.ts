import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { resolvePortableCommand, runPortableCommand } from "../../../global/bin/portable-process.ts";

export const SCHEMA_VERSION = 1;
export const SAMPLE_BYTE_LIMIT = 524288;
export const CAPTURE_BYTE_LIMIT = 8388608;
export const PROFILE = "quality-independent";
export const BASELINE_POINTER_PATH = "config/consumer-outcome-baseline.json";
export const MANIFEST_PATH = "config/consumer-outcome-regression.json";
export const DECISION_GAP_PACK_PATH = "tools/proofs/fixtures/consumer-outcome/claim-evidence-decision-gap.json";
export const SHIFT_LEFT_PACK_PATH = "tools/proofs/fixtures/consumer-outcome/shift-left-decision-gap-r1.json";
export const STATUS_SCOPE_PACK_PATH = "tools/proofs/fixtures/consumer-outcome/status-scope-r1.json";
export const FRICTION_FIELDS = [
  "ownerQuestionCount",
  "configuredProviderRequestCount",
  "failedToolCallCount",
  "duplicateFailedToolInvocationCount",
  "totalToolCallCount",
] as const;
export const PAIR_ORDER = ["B1,C1", "C2,B2", "B3,C3"] as const;
export const MODES = ["preflight", "baseline", "capture", "replay", "evaluate", "gate"] as const;

export type FrictionField = (typeof FRICTION_FIELDS)[number];
export type Expectation = "no-regression" | "improvement";
export type Arm = "baseline" | "candidate";
export type Mode = (typeof MODES)[number];
export type DecisionPackName = "claim-evidence" | "shift-left" | "status-scope";
export type EvaluationStatus =
  | "baseline-established"
  | "baseline-current"
  | "passed-no-regression"
  | "passed-improvement"
  | "failed"
  | "blocked"
  | "stale-evidence";

export type FrictionVector = Record<FrictionField, number>;

export type CommandContract = {
  argv: string[];
  exitCode: number;
  stdoutIncludes: string[];
};

export type ExpectedOutcome = {
  exitCode: number;
  stateFiles: string[];
  stdoutIncludes: string[];
};

export type Permissions = {
  allow: string[];
  deny: string[];
};

export type CleanupOracle = {
  fixtureRemoved: boolean;
  processesRemoved: boolean;
  sessionsRemoved: boolean;
};

export type ScenarioRecord = {
  allowedEffects: string[];
  cleanupOracle: CleanupOracle;
  configuredProviderRequestBound: number;
  evidenceByteBound: number;
  expectedOutcome: ExpectedOutcome;
  fixtureId: string;
  fixturePath: string;
  forbiddenEffects: string[];
  frictionFields: FrictionField[];
  id: string;
  initialManifest: { files: string[] };
  permissions: Permissions;
  proofExpectations: CommandContract;
  request: string;
  sampleCount: number;
  shape: "ordinary-small" | "openspec-backed";
  validationArgv: string[];
};

export type ClaimEvidenceDecision = {
  claimDisposition: "blocked" | "narrowed" | "supported" | "unknown";
  completionDisposition: "allow_stop" | "continue";
};

export type ShiftLeftDecision = {
  claimCeiling: string;
  currentRung: string;
  deferredDependents: string[];
  firstAction: string;
  protectedActionDisposition: string;
  selectedSufficientBoundary: string;
};

export type StatusScopeDecision = {
  acceptedOutcomeState: string;
  actionAuthority: string;
  evidenceState: string;
  id: string;
  operationalConsequence: string;
  proofPathReadiness: string;
  resourceAvailability: string;
};

export type StatusScopeDecisionSet = {
  members: StatusScopeDecision[];
};

export type ExpectedDecision = ClaimEvidenceDecision | ShiftLeftDecision | StatusScopeDecisionSet;

export type DecisionGapPack = {
  configuredProviderRequestBound: number;
  expectedDecisions: Record<string, ExpectedDecision>;
  id: string;
  manifest: RegressionManifest;
  maximumClaim: string;
  name: DecisionPackName;
  statusScope?: {
    memberOrder: string[];
    reconstructionRequest: string;
  };
};

export type RegressionManifest = {
  baselinePointerPath: string;
  captureByteLimit: number;
  defaultExpectation: Expectation;
  frictionFields: FrictionField[];
  governedSourcePaths: string[];
  pairOrder: string[];
  profile: string;
  sampleByteLimit: number;
  sampleCount: number;
  scenarios: ScenarioRecord[];
  schemaVersion: number;
};

export type CandidateRequest = {
  candidateId: string;
  expectation: Expectation;
  sourceRoot: string;
};

export type SourceIdentity = {
  gitRef: string;
  governedDigest: string;
  kind: "staged-ref" | "working-tree";
  pathDigests: Array<{ path: string; sha256: string }>;
};

export type EnvironmentIdentity = {
  dependencyIdentity: string;
  initialFixtureDigest: string;
  model: string;
  opencodeVersion: string;
  osClass: string;
  permissionDigest: string;
  profile: string;
  scenarioDigest: string;
  validationArgvDigest: string;
  variant: string;
};

export type ToolCallFact = {
  argumentDigest: string;
  name: string;
  status: string | null;
};

export type StatusScopeEvidence = {
  compactionContext: string;
  compactionRoute: string;
  error: {
    facts: Array<Record<string, unknown>>;
    stage: string;
  } | null;
  mainResponse: string;
  mainRoute: string;
  messages: {
    assistant: Array<{
      agent: string | null;
      error: Array<Record<string, unknown>> | null;
      finish: string | null;
      modelID: string | null;
      providerID: string | null;
      summary: boolean;
      text: string;
    }>;
    toolCalls: Array<{ name: string; status: string | null }>;
  };
  providerRequestCount: number;
  reconstructionResponse: string;
  server: {
    argv: string[];
    executableSha256: string;
    signal: string | null;
    status: number | null;
    stderr: string;
    stdout: string;
  };
  sessionID: string | null;
  summarizeAccepted: boolean;
};

export type SampleEvidence = {
  arm: Arm;
  cleanup: CleanupOracle & { complete: boolean; error: string | null };
  command: { argv: string[]; status: number | null; stderr: string; stdout: string };
  diagnostics: { elapsedMs: number | null; tokens: unknown; truncatedFields: string[] };
  environmentIdentity: EnvironmentIdentity;
  forbiddenEffects: Array<{ name: string; observed: boolean }>;
  friction: FrictionVector;
  files: Array<{ path: string; sha256: string }>;
  hashes: { sample: string };
  permissions: Permissions & { violations: string[] };
  proof: { argv: string[]; status: number | null; stderr: string; stdout: string };
  requestSha256: string;
  sampleIndex: number;
  scenarioId: string;
  schemaVersion: number;
  sideEffects: string[];
  sourceIdentity: SourceIdentity;
  statusScope?: StatusScopeEvidence;
  toolCalls: ToolCallFact[];
  validation: { argv: string[]; status: number | null; stderr: string; stdout: string };
};

export type CaptureBundle = {
  byteLength: number;
  comparisonIdentity: string;
  evaluatorDigest: string;
  inventory: string[];
  kind: "baseline" | "candidate" | "matched";
  samples: SampleEvidence[];
  scenarioDigest: string;
  schemaVersion: number;
  sourceIdentity: SourceIdentity;
};

export type BaselinePointer = {
  baselineVersion: string | null;
  bundlePath: string | null;
  environmentDigest: string | null;
  evaluatorDigest: string | null;
  priorBaselineReference: string | null;
  reason: string | null;
  scenarioDigest: string | null;
  schemaVersion: number;
  sourceDigest: string | null;
  status: "unestablished" | "accepted";
};

export type EvaluationResult = {
  baselineMedians: Record<string, FrictionVector>;
  candidateMedians: Record<string, FrictionVector> | null;
  digest: string;
  environmentDigest: string;
  expectation: Expectation | "baseline-establishment";
  improvedField: { baseline: number; candidate: number; field: FrictionField; scenarioId: string } | null;
  reasons: string[];
  scenarioDigest: string;
  schemaVersion: number;
  sourceDigest: string;
  status: EvaluationStatus;
};

const MANIFEST_KEYS = [
  "baselinePointerPath",
  "captureByteLimit",
  "defaultExpectation",
  "frictionFields",
  "governedSourcePaths",
  "pairOrder",
  "profile",
  "sampleByteLimit",
  "sampleCount",
  "scenarios",
  "schemaVersion",
] as const;
const SCENARIO_KEYS = [
  "allowedEffects",
  "cleanupOracle",
  "configuredProviderRequestBound",
  "evidenceByteBound",
  "expectedOutcome",
  "fixtureId",
  "fixturePath",
  "forbiddenEffects",
  "frictionFields",
  "id",
  "initialManifest",
  "permissions",
  "proofExpectations",
  "request",
  "sampleCount",
  "shape",
  "validationArgv",
] as const;
const OUTCOME_KEYS = ["exitCode", "stateFiles", "stdoutIncludes"] as const;
const COMMAND_KEYS = ["argv", "exitCode", "stdoutIncludes"] as const;
const PERMISSION_KEYS = ["allow", "deny"] as const;
const CLEANUP_KEYS = ["fixtureRemoved", "processesRemoved", "sessionsRemoved"] as const;
const CANDIDATE_KEYS = ["candidateId", "expectation", "sourceRoot"] as const;
const POINTER_KEYS = [
  "baselineVersion",
  "bundlePath",
  "environmentDigest",
  "evaluatorDigest",
  "priorBaselineReference",
  "reason",
  "scenarioDigest",
  "schemaVersion",
  "sourceDigest",
  "status",
] as const;
const DECISION_PACK_KEYS = [
  "configuredProviderRequestBound",
  "expectation",
  "governedSourcePaths",
  "id",
  "pairOrder",
  "profile",
  "sampleCountPerArm",
  "scenarios",
  "schemaVersion",
] as const;
const SHIFT_LEFT_DECISION_PACK_KEYS = [...DECISION_PACK_KEYS, "maximumClaim"] as const;
const STATUS_SCOPE_DECISION_PACK_KEYS = [...SHIFT_LEFT_DECISION_PACK_KEYS, "memberOrder", "reconstructionRequest"] as const;
const DECISION_SCENARIO_KEYS = [...SCENARIO_KEYS, "expectedDecision"] as const;
const EXPECTED_DECISION_KEYS = ["claimDisposition", "completionDisposition"] as const;
const SHIFT_LEFT_DECISION_KEYS = [
  "claimCeiling",
  "currentRung",
  "deferredDependents",
  "firstAction",
  "protectedActionDisposition",
  "selectedSufficientBoundary",
] as const;
export const STATUS_SCOPE_DECISION_KEYS = [
  "acceptedOutcomeState",
  "actionAuthority",
  "evidenceState",
  "id",
  "operationalConsequence",
  "proofPathReadiness",
  "resourceAvailability",
] as const;
const DECISION_PACK_SPECS = {
  "claim-evidence": {
    id: "claim-evidence-decision-gap-r1",
    maximumClaim: "four reviewed claim-evidence decisions for the recorded model, source, prompt, fixture, and environment only",
    path: DECISION_GAP_PACK_PATH,
    requestBound: 8,
    scenarioIds: [
      "representative-finite-population",
      "exact-finite-environment",
      "unavailable-real-oracle",
      "ordinary-small-exact-case",
    ],
  },
  "shift-left": {
    id: "shift-left-decision-gap-r1",
    maximumClaim: "two reviewed shift-left decisions for the recorded model, source, prompt, fixture, and environment only",
    path: SHIFT_LEFT_PACK_PATH,
    requestBound: 4,
    scenarioIds: ["reachable-characterization-first", "sufficient-lower-rung"],
  },
  "status-scope": {
    id: "status-scope-r1",
    maximumClaim: "three reviewed status-scope members for the recorded model, source, prompt, fixture, and environment only",
    path: STATUS_SCOPE_PACK_PATH,
    requestBound: 6,
    scenarioIds: ["status-scope-roundtrip"],
  },
} as const satisfies Record<DecisionPackName, {
  id: string;
  maximumClaim: string;
  path: string;
  requestBound: number;
  scenarioIds: readonly string[];
}>;

export class ContractError extends Error {
  readonly field: string;
  constructor(field: string, message: string) {
    super(message);
    this.field = field;
  }
}

export function sha256(value: string | Uint8Array): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

export function stableValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stableValue);
  if (value == null || typeof value !== "object") return value;
  const input = value as Record<string, unknown>;
  return Object.fromEntries(Object.keys(input).sort().map((key) => [key, stableValue(input[key])]));
}

export function stableJson(value: unknown): string {
  return `${JSON.stringify(stableValue(value), null, 2)}\n`;
}

export function digestOf(value: unknown): string {
  return sha256(JSON.stringify(stableValue(value)));
}

export function posixPath(value: string): string {
  return value.replaceAll("\\", "/");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === "object" && !Array.isArray(value);
}

export function requireExactKeys(value: unknown, keys: readonly string[], label: string): Record<string, unknown> {
  if (!isRecord(value)) throw new ContractError(label, `${label} must be an object`);
  const actual = Object.keys(value).sort();
  const expected = [...keys].sort();
  const missing = expected.filter((key) => !actual.includes(key));
  const extra = actual.filter((key) => !expected.includes(key));
  if (missing.length > 0 || extra.length > 0) {
    throw new ContractError(label, `${label} schema: missing=[${missing.join(",")}] extra=[${extra.join(",")}]`);
  }
  return value;
}

function requireString(value: unknown, label: string): string {
  if (typeof value !== "string" || value.trim() === "") throw new ContractError(label, `${label} must be a non-empty string`);
  return value;
}

function requireInteger(value: unknown, label: string, min: number, max: number): number {
  if (typeof value !== "number" || !Number.isInteger(value) || value < min || value > max) {
    throw new ContractError(label, `${label} must be an integer in [${min}, ${max}]`);
  }
  return value;
}

function requireStringArray(value: unknown, label: string): string[] {
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string" || item.trim() === "")) {
    throw new ContractError(label, `${label} must be a non-empty-string array`);
  }
  return value;
}

function requireBoolean(value: unknown, label: string): boolean {
  if (typeof value !== "boolean") throw new ContractError(label, `${label} must be a boolean`);
  return value;
}

export function assertContained(root: string, candidate: string, label: string): string {
  const resolvedRoot = path.resolve(root);
  const resolved = path.resolve(candidate);
  const relative = posixPath(path.relative(resolvedRoot, resolved));
  if (relative === "" || relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new ContractError(label, `${label} escapes its containment root`);
  }
  return resolved;
}

export function assertRelativeContained(relativePath: string, allowedPrefix: string, label: string): string {
  const normalized = posixPath(relativePath);
  if (path.isAbsolute(relativePath) || normalized.includes("\0") || normalized.split("/").includes("..") || !normalized.startsWith(`${allowedPrefix}/`)) {
    throw new ContractError(label, `${label} must stay under ${allowedPrefix}`);
  }
  return normalized;
}

function parseCommand(value: unknown, label: string): CommandContract {
  const record = requireExactKeys(value, COMMAND_KEYS, label);
  const argv = requireStringArray(record.argv, `${label}.argv`);
  if (argv.length === 0) throw new ContractError(`${label}.argv`, `${label}.argv must contain an executable`);
  return {
    argv,
    exitCode: requireInteger(record.exitCode, `${label}.exitCode`, 0, 255),
    stdoutIncludes: requireStringArray(record.stdoutIncludes, `${label}.stdoutIncludes`),
  };
}

function parseScenario(
  value: unknown,
  index: number,
  constraints: { configuredProviderRequestBound: number; sampleCount: number } = { configuredProviderRequestBound: 1, sampleCount: 3 },
): ScenarioRecord {
  const label = `scenarios[${index}]`;
  const record = requireExactKeys(value, SCENARIO_KEYS, label);
  const shape = requireString(record.shape, `${label}.shape`);
  if (shape !== "ordinary-small" && shape !== "openspec-backed") {
    throw new ContractError(`${label}.shape`, `${label}.shape must be ordinary-small or openspec-backed`);
  }
  const initial = requireExactKeys(record.initialManifest, ["files"], `${label}.initialManifest`);
  const outcome = requireExactKeys(record.expectedOutcome, OUTCOME_KEYS, `${label}.expectedOutcome`);
  const permissions = requireExactKeys(record.permissions, PERMISSION_KEYS, `${label}.permissions`);
  const cleanup = requireExactKeys(record.cleanupOracle, CLEANUP_KEYS, `${label}.cleanupOracle`);
  const frictionFields = requireStringArray(record.frictionFields, `${label}.frictionFields`);
  if (frictionFields.join(",") !== FRICTION_FIELDS.join(",")) {
    throw new ContractError(`${label}.frictionFields`, `${label}.frictionFields must match the reviewed friction vector`);
  }
  return {
    allowedEffects: requireStringArray(record.allowedEffects, `${label}.allowedEffects`),
    cleanupOracle: {
      fixtureRemoved: requireBoolean(cleanup.fixtureRemoved, `${label}.cleanupOracle.fixtureRemoved`),
      processesRemoved: requireBoolean(cleanup.processesRemoved, `${label}.cleanupOracle.processesRemoved`),
      sessionsRemoved: requireBoolean(cleanup.sessionsRemoved, `${label}.cleanupOracle.sessionsRemoved`),
    },
    configuredProviderRequestBound: requireInteger(
      record.configuredProviderRequestBound,
      `${label}.configuredProviderRequestBound`,
      constraints.configuredProviderRequestBound,
      constraints.configuredProviderRequestBound,
    ),
    evidenceByteBound: requireInteger(record.evidenceByteBound, `${label}.evidenceByteBound`, SAMPLE_BYTE_LIMIT, SAMPLE_BYTE_LIMIT),
    expectedOutcome: {
      exitCode: requireInteger(outcome.exitCode, `${label}.expectedOutcome.exitCode`, 0, 255),
      stateFiles: requireStringArray(outcome.stateFiles, `${label}.expectedOutcome.stateFiles`),
      stdoutIncludes: requireStringArray(outcome.stdoutIncludes, `${label}.expectedOutcome.stdoutIncludes`),
    },
    fixtureId: requireString(record.fixtureId, `${label}.fixtureId`),
    fixturePath: requireString(record.fixturePath, `${label}.fixturePath`),
    forbiddenEffects: requireStringArray(record.forbiddenEffects, `${label}.forbiddenEffects`),
    frictionFields: [...FRICTION_FIELDS],
    id: requireString(record.id, `${label}.id`),
    initialManifest: { files: requireStringArray(initial.files, `${label}.initialManifest.files`) },
    permissions: {
      allow: requireStringArray(permissions.allow, `${label}.permissions.allow`),
      deny: requireStringArray(permissions.deny, `${label}.permissions.deny`),
    },
    proofExpectations: parseCommand(record.proofExpectations, `${label}.proofExpectations`),
    request: requireString(record.request, `${label}.request`),
    sampleCount: requireInteger(record.sampleCount, `${label}.sampleCount`, constraints.sampleCount, constraints.sampleCount),
    shape,
    validationArgv: requireStringArray(record.validationArgv, `${label}.validationArgv`),
  };
}

function parseExpectedDecision(value: unknown, label: string): ExpectedDecision {
  const record = requireExactKeys(value, EXPECTED_DECISION_KEYS, label);
  const claimDisposition = requireString(record.claimDisposition, `${label}.claimDisposition`);
  const completionDisposition = requireString(record.completionDisposition, `${label}.completionDisposition`);
  if (claimDisposition !== "blocked" && claimDisposition !== "narrowed" && claimDisposition !== "supported" && claimDisposition !== "unknown") {
    throw new ContractError(`${label}.claimDisposition`, `${label}.claimDisposition is invalid`);
  }
  if (completionDisposition !== "allow_stop" && completionDisposition !== "continue") {
    throw new ContractError(`${label}.completionDisposition`, `${label}.completionDisposition is invalid`);
  }
  return { claimDisposition, completionDisposition };
}

function parseShiftLeftDecision(value: unknown, label: string): ShiftLeftDecision {
  const record = requireExactKeys(value, SHIFT_LEFT_DECISION_KEYS, label);
  return {
    claimCeiling: requireString(record.claimCeiling, `${label}.claimCeiling`),
    currentRung: requireString(record.currentRung, `${label}.currentRung`),
    deferredDependents: requireStringArray(record.deferredDependents, `${label}.deferredDependents`),
    firstAction: requireString(record.firstAction, `${label}.firstAction`),
    protectedActionDisposition: requireString(record.protectedActionDisposition, `${label}.protectedActionDisposition`),
    selectedSufficientBoundary: requireString(record.selectedSufficientBoundary, `${label}.selectedSufficientBoundary`),
  };
}

export function parseStatusScopeDecisionSet(value: unknown, label: string): StatusScopeDecisionSet {
  const record = requireExactKeys(value, ["members"], label);
  if (!Array.isArray(record.members) || record.members.length !== 3) {
    throw new ContractError(`${label}.members`, `${label}.members must contain exactly three records`);
  }
  const members = record.members.map((value, index) => {
    const memberLabel = `${label}.members[${index}]`;
    const member = requireExactKeys(value, STATUS_SCOPE_DECISION_KEYS, memberLabel);
    return {
      acceptedOutcomeState: requireString(member.acceptedOutcomeState, `${memberLabel}.acceptedOutcomeState`),
      actionAuthority: requireString(member.actionAuthority, `${memberLabel}.actionAuthority`),
      evidenceState: requireString(member.evidenceState, `${memberLabel}.evidenceState`),
      id: requireString(member.id, `${memberLabel}.id`),
      operationalConsequence: requireString(member.operationalConsequence, `${memberLabel}.operationalConsequence`),
      proofPathReadiness: requireString(member.proofPathReadiness, `${memberLabel}.proofPathReadiness`),
      resourceAvailability: requireString(member.resourceAvailability, `${memberLabel}.resourceAvailability`),
    };
  });
  return { members };
}

export function parseManifest(value: unknown): RegressionManifest {
  const record = requireExactKeys(value, MANIFEST_KEYS, "manifest");
  if (record.schemaVersion !== SCHEMA_VERSION) throw new ContractError("manifest.schemaVersion", "manifest.schemaVersion must be 1");
  if (requireString(record.profile, "manifest.profile") !== PROFILE) throw new ContractError("manifest.profile", "manifest.profile must be quality-independent");
  if (requireString(record.baselinePointerPath, "manifest.baselinePointerPath") !== BASELINE_POINTER_PATH) {
    throw new ContractError("manifest.baselinePointerPath", `manifest.baselinePointerPath must be ${BASELINE_POINTER_PATH}`);
  }
  if (requireInteger(record.sampleByteLimit, "manifest.sampleByteLimit", SAMPLE_BYTE_LIMIT, SAMPLE_BYTE_LIMIT) !== SAMPLE_BYTE_LIMIT) {
    throw new ContractError("manifest.sampleByteLimit", "invalid sample byte bound");
  }
  if (requireInteger(record.captureByteLimit, "manifest.captureByteLimit", CAPTURE_BYTE_LIMIT, CAPTURE_BYTE_LIMIT) !== CAPTURE_BYTE_LIMIT) {
    throw new ContractError("manifest.captureByteLimit", "invalid capture byte bound");
  }
  if (requireInteger(record.sampleCount, "manifest.sampleCount", 3, 3) !== 3) {
    throw new ContractError("manifest.sampleCount", "manifest.sampleCount must be 3");
  }
  const pairOrder = requireStringArray(record.pairOrder, "manifest.pairOrder");
  if (pairOrder.join(",") !== PAIR_ORDER.join(",")) throw new ContractError("manifest.pairOrder", "manifest.pairOrder must be B1,C1 C2,B2 B3,C3");
  const frictionFields = requireStringArray(record.frictionFields, "manifest.frictionFields");
  if (frictionFields.join(",") !== FRICTION_FIELDS.join(",")) throw new ContractError("manifest.frictionFields", "manifest.frictionFields must match the reviewed vector");
  const expectation = requireString(record.defaultExpectation, "manifest.defaultExpectation");
  if (expectation !== "no-regression") throw new ContractError("manifest.defaultExpectation", "controlled fixtures must default to no-regression");
  const scenarios = record.scenarios;
  if (!Array.isArray(scenarios) || scenarios.length !== 2) throw new ContractError("manifest.scenarios", "manifest.scenarios must contain exactly two records");
  return {
    baselinePointerPath: BASELINE_POINTER_PATH,
    captureByteLimit: CAPTURE_BYTE_LIMIT,
    defaultExpectation: "no-regression",
    frictionFields: [...FRICTION_FIELDS],
    governedSourcePaths: requireStringArray(record.governedSourcePaths, "manifest.governedSourcePaths"),
    pairOrder: [...PAIR_ORDER],
    profile: PROFILE,
    sampleByteLimit: SAMPLE_BYTE_LIMIT,
    sampleCount: 3,
    scenarios: scenarios.map((scenario, index) => parseScenario(scenario, index)),
    schemaVersion: SCHEMA_VERSION,
  };
}

export function parseDecisionGapPack(value: unknown, packName: DecisionPackName = "claim-evidence"): DecisionGapPack {
  const spec = DECISION_PACK_SPECS[packName];
  const packKeys = packName === "status-scope"
    ? STATUS_SCOPE_DECISION_PACK_KEYS
    : packName === "shift-left"
      ? SHIFT_LEFT_DECISION_PACK_KEYS
      : DECISION_PACK_KEYS;
  const record = requireExactKeys(value, packKeys, "decisionPack");
  if (record.schemaVersion !== SCHEMA_VERSION) throw new ContractError("decisionPack.schemaVersion", "decisionPack.schemaVersion must be 1");
  if (requireString(record.id, "decisionPack.id") !== spec.id) {
    throw new ContractError("decisionPack.id", "decisionPack.id is invalid");
  }
  if (requireString(record.profile, "decisionPack.profile") !== PROFILE) {
    throw new ContractError("decisionPack.profile", `decisionPack.profile must be ${PROFILE}`);
  }
  if (requireString(record.expectation, "decisionPack.expectation") !== "no-regression") {
    throw new ContractError("decisionPack.expectation", "focused decision packs must use no-regression");
  }
  const sampleCount = requireInteger(record.sampleCountPerArm, "decisionPack.sampleCountPerArm", 1, 1);
  const requestBound = requireInteger(record.configuredProviderRequestBound, "decisionPack.configuredProviderRequestBound", spec.requestBound, spec.requestBound);
  const pairOrder = requireStringArray(record.pairOrder, "decisionPack.pairOrder");
  if (pairOrder.join(",") !== "B1,C1") throw new ContractError("decisionPack.pairOrder", "decisionPack.pairOrder must be B1,C1");
  const statusScope = packName === "status-scope" ? {
    memberOrder: requireStringArray(record.memberOrder, "decisionPack.memberOrder"),
    reconstructionRequest: requireString(record.reconstructionRequest, "decisionPack.reconstructionRequest"),
  } : null;
  if (statusScope != null && statusScope.memberOrder.join(",") !== "known-resource-path-unknown,resource-unknown-negative-control,compaction-roundtrip-mixed-status") {
    throw new ContractError("decisionPack.memberOrder", "decisionPack.memberOrder must match CSA-001");
  }
  if (!Array.isArray(record.scenarios) || record.scenarios.length !== spec.scenarioIds.length) {
    throw new ContractError("decisionPack.scenarios", `decisionPack.scenarios must contain exactly ${spec.scenarioIds.length} records`);
  }
  const scenarios: ScenarioRecord[] = [];
  const expectedDecisions: Record<string, ExpectedDecision> = {};
  for (const [index, raw] of record.scenarios.entries()) {
    const label = `decisionPack.scenarios[${index}]`;
    const row = requireExactKeys(raw, DECISION_SCENARIO_KEYS, label);
    const scenario = parseScenario(
      Object.fromEntries(SCENARIO_KEYS.map((key) => [key, row[key]])),
      index,
      { configuredProviderRequestBound: requestBound, sampleCount },
    );
    if (scenario.id !== spec.scenarioIds[index]) {
      throw new ContractError(`${label}.id`, `expected ${spec.scenarioIds[index]}`);
    }
    scenarios.push(scenario);
    expectedDecisions[scenario.id] = packName === "shift-left"
      ? parseShiftLeftDecision(row.expectedDecision, `${label}.expectedDecision`)
      : packName === "status-scope"
        ? parseStatusScopeDecisionSet(row.expectedDecision, `${label}.expectedDecision`)
        : parseExpectedDecision(row.expectedDecision, `${label}.expectedDecision`);
    if (statusScope != null) {
      const decision = expectedDecisions[scenario.id] as StatusScopeDecisionSet;
      if (decision.members.map((member) => member.id).join(",") !== statusScope.memberOrder.join(",")) {
        throw new ContractError(`${label}.expectedDecision.members`, "status-scope expected members must match memberOrder");
      }
    }
  }
  const maximumClaim = packName === "shift-left" || packName === "status-scope"
    ? requireString(record.maximumClaim, "decisionPack.maximumClaim")
    : spec.maximumClaim;
  if (maximumClaim !== spec.maximumClaim) throw new ContractError("decisionPack.maximumClaim", "decisionPack.maximumClaim is invalid");
  return {
    configuredProviderRequestBound: requestBound,
    expectedDecisions,
    id: spec.id,
    manifest: {
      baselinePointerPath: BASELINE_POINTER_PATH,
      captureByteLimit: CAPTURE_BYTE_LIMIT,
      defaultExpectation: "no-regression",
      frictionFields: [...FRICTION_FIELDS],
      governedSourcePaths: requireStringArray(record.governedSourcePaths, "decisionPack.governedSourcePaths"),
      pairOrder: ["B1,C1"],
      profile: PROFILE,
      sampleByteLimit: SAMPLE_BYTE_LIMIT,
      sampleCount,
      scenarios,
      schemaVersion: SCHEMA_VERSION,
    },
    maximumClaim,
    name: packName,
    ...(statusScope == null ? {} : { statusScope }),
  };
}

export function parseCandidateRequest(value: unknown): CandidateRequest {
  const record = requireExactKeys(value, CANDIDATE_KEYS, "candidateRequest");
  const expectation = requireString(record.expectation, "candidateRequest.expectation");
  if (expectation !== "no-regression" && expectation !== "improvement") {
    throw new ContractError("candidateRequest.expectation", "candidateRequest.expectation must be no-regression or improvement");
  }
  return {
    candidateId: requireString(record.candidateId, "candidateRequest.candidateId"),
    expectation,
    sourceRoot: requireString(record.sourceRoot, "candidateRequest.sourceRoot"),
  };
}

export function parseBaselinePointer(value: unknown): BaselinePointer {
  const record = requireExactKeys(value, POINTER_KEYS, "baselinePointer");
  const status = requireString(record.status, "baselinePointer.status");
  if (status !== "unestablished" && status !== "accepted") {
    throw new ContractError("baselinePointer.status", "baselinePointer.status must be unestablished or accepted");
  }
  const optional = (field: string): string | null => {
    const current = record[field];
    if (current == null) return null;
    return requireString(current, `baselinePointer.${field}`);
  };
  return {
    baselineVersion: optional("baselineVersion"),
    bundlePath: optional("bundlePath"),
    environmentDigest: optional("environmentDigest"),
    evaluatorDigest: optional("evaluatorDigest"),
    priorBaselineReference: optional("priorBaselineReference"),
    reason: optional("reason"),
    scenarioDigest: optional("scenarioDigest"),
    schemaVersion: requireInteger(record.schemaVersion, "baselinePointer.schemaVersion", 1, 1),
    sourceDigest: optional("sourceDigest"),
    status,
  };
}

export function emptyFriction(): FrictionVector {
  return {
    configuredProviderRequestCount: 0,
    duplicateFailedToolInvocationCount: 0,
    failedToolCallCount: 0,
    ownerQuestionCount: 0,
    totalToolCallCount: 0,
  };
}

export function median(values: number[], expectedCount = 3): number {
  if (values.length !== expectedCount || expectedCount < 1 || expectedCount % 2 === 0 || values.some((value) => !Number.isInteger(value) || value < 0)) {
    throw new ContractError("friction.median", `each friction field requires ${expectedCount} non-negative integer samples`);
  }
  return [...values].sort((left, right) => left - right)[Math.floor(expectedCount / 2)];
}

export function argumentDigest(input: unknown): string {
  return digestOf(input ?? null);
}

export function fixtureFileList(fixtureRoot: string): string[] {
  const files: string[] = [];
  const visit = (directory: string): void => {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true }).sort((left, right) => left.name.localeCompare(right.name))) {
      const full = path.join(directory, entry.name);
      if (entry.isDirectory()) visit(full);
      else files.push(posixPath(path.relative(fixtureRoot, full)));
    }
  };
  visit(fixtureRoot);
  return files;
}

export function hashFiles(root: string, files: string[]): Array<{ path: string; sha256: string }> {
  return files.map((relative) => {
    const full = assertContained(root, path.join(root, relative), relative);
    return { path: posixPath(relative), sha256: sha256(fs.readFileSync(full)) };
  });
}

export function verifyFixtureSeed(repoRoot: string, scenario: ScenarioRecord): { digest: string; files: Array<{ path: string; sha256: string }> } {
  const fixtureRoot = assertContained(repoRoot, path.join(repoRoot, scenario.fixturePath), scenario.id);
  assertRelativeContained(scenario.fixturePath, "tools/proofs/fixtures/consumer-outcome", `${scenario.id}.fixturePath`);
  const listed = [...scenario.initialManifest.files].map(posixPath).sort((left, right) => left.localeCompare(right));
  const present = fixtureFileList(fixtureRoot);
  if (listed.join("\n") !== present.join("\n")) {
    throw new ContractError(`${scenario.id}.initialManifest`, `${scenario.id} fixture files must match the reviewed initial manifest exactly`);
  }
  const files = hashFiles(fixtureRoot, listed);
  return { digest: digestOf(files), files };
}

export function resolveValidationCommand(argv: string[], label: string): void {
  const resolution = resolvePortableCommand(argv, process.env);
  if (!resolution.ok) throw new ContractError(label, `${label} is unresolved: ${"reason" in resolution ? resolution.reason : "unknown resolution failure"}`);
}

export function loadManifest(repoRoot: string, manifestPath = path.join(repoRoot, MANIFEST_PATH)): { digest: string; manifest: RegressionManifest } {
  const text = fs.readFileSync(manifestPath, "utf8");
  const manifest = parseManifest(JSON.parse(text));
  if (manifest.scenarios[0].shape !== "ordinary-small" || manifest.scenarios[1].shape !== "openspec-backed") {
    throw new ContractError("manifest.scenarios", "scenario order must be ordinary-small then openspec-backed");
  }
  for (const scenario of manifest.scenarios) {
    verifyFixtureSeed(repoRoot, scenario);
    resolveValidationCommand(scenario.validationArgv, `${scenario.id}.validationArgv`);
    resolveValidationCommand(scenario.proofExpectations.argv, `${scenario.id}.proofExpectations.argv`);
  }
  if (manifest.governedSourcePaths.length === 0) throw new ContractError("manifest.governedSourcePaths", "governed source paths must be explicit");
  return { digest: digestOf(manifest), manifest };
}

export function loadDecisionGapPack(repoRoot: string, packName: DecisionPackName = "claim-evidence"): { digest: string; pack: DecisionGapPack } {
  const packPath = path.join(repoRoot, DECISION_PACK_SPECS[packName].path);
  const pack = parseDecisionGapPack(JSON.parse(fs.readFileSync(packPath, "utf8")), packName);
  for (const scenario of pack.manifest.scenarios) {
    verifyFixtureSeed(repoRoot, scenario);
    resolveValidationCommand(scenario.validationArgv, `${scenario.id}.validationArgv`);
    resolveValidationCommand(scenario.proofExpectations.argv, `${scenario.id}.proofExpectations.argv`);
  }
  if (pack.manifest.governedSourcePaths.length === 0) throw new ContractError("decisionPack.governedSourcePaths", "governed source paths must be explicit");
  return { digest: digestOf(pack), pack };
}

export function loadBaselinePointer(repoRoot: string, pointerPath = path.join(repoRoot, BASELINE_POINTER_PATH)): BaselinePointer {
  return parseBaselinePointer(JSON.parse(fs.readFileSync(pointerPath, "utf8")));
}

export function governedSourceIdentity(repoRoot: string, gitRef: string, governedSourcePaths: string[]): SourceIdentity {
  const kind = gitRef === "working-tree" ? "working-tree" : "staged-ref";
  const files = new Set<string>();
  for (const entry of governedSourcePaths) {
    if (kind === "working-tree") {
      const full = path.join(repoRoot, entry);
      if (!fs.existsSync(full)) throw new ContractError(entry, `governed input is unreadable: ${entry}`);
      if (fs.statSync(full).isDirectory()) {
        for (const file of fixtureFileList(full)) files.add(posixPath(path.join(entry, file)));
      } else {
        files.add(posixPath(entry));
      }
    } else {
      const listed = runPortableCommand(repoRoot, ["git", "ls-tree", "-r", "--name-only", gitRef, entry], { capture: true });
      if (listed.status !== 0) throw new ContractError(entry, `governed input is unreadable: ${entry}`);
      const rows = listed.stdout.split(/\r?\n/).map((row) => row.trim()).filter(Boolean);
      if (rows.length === 0) throw new ContractError(entry, `governed input is unreadable: ${entry}`);
      for (const row of rows) files.add(posixPath(row));
    }
  }
  const pathDigests = [...files].sort((left, right) => left.localeCompare(right)).map((relative) => {
    if (kind === "working-tree") {
      return { path: relative, sha256: sha256(fs.readFileSync(path.join(repoRoot, relative))) };
    }
    const shown = runPortableCommand(repoRoot, ["git", "show", `${gitRef}:${relative}`], { capture: true });
    if (shown.status !== 0) throw new ContractError(relative, `governed input is unreadable: ${relative}`);
    return { path: relative, sha256: sha256(shown.stdout) };
  });
  return {
    gitRef,
    governedDigest: digestOf(pathDigests),
    kind,
    pathDigests,
  };
}

export function evaluatorDigest(): string {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const files = ["contracts.ts", "evaluate.ts", "capture.ts"].map((name) => {
    const full = path.join(here, name);
    return { path: name, sha256: fs.existsSync(full) ? sha256(fs.readFileSync(full)) : "absent" };
  });
  return digestOf(files);
}

export function osClass(platform = process.platform): string {
  if (platform === "win32") return "windows";
  if (platform === "darwin") return "darwin";
  return "unix";
}

export function privacyMarkers(): RegExp[] {
  return [
    /\bsk-[A-Za-z0-9_-]{8,}\b/,
    /\bapi[_-]?key\b/i,
    /\bBearer\s+[A-Za-z0-9._~+/-]+=*/,
    /\b(password|secret|token)\s*[:=]\s*\S+/i,
  ];
}

export function containsPrivatePath(text: string): boolean {
  return /[A-Za-z]:\\Users\\[^\\\s]+/.test(text)
    || /Users\\[^\\\s]+\\/.test(text)
    || /\/home\/[^/\s]+/.test(text)
    || /\/Users\/[^/\s]+/.test(text);
}

export function redactText(text: string, replacements: Array<[string, string]>): string {
  let result = text;
  for (const [value, label] of replacements) {
    if (value.trim() === "") continue;
    for (const variant of [value, value.replaceAll("\\", "\\\\"), value.replaceAll("\\", "/")]) {
      result = result.split(variant).join(label);
    }
  }
  return result;
}

export function defaultRedactions(proofRoot: string, kitRoot: string): Array<[string, string]> {
  const home = os.homedir();
  const user = path.basename(home);
  return [
    [proofRoot, "<proof-root>"],
    [kitRoot, "<kit-root>"],
    [home, "<home>"],
    [`Users\\${user}`, "<home>"],
    [`Users/${user}`, "<home>"],
    [user, "<user>"],
    ["Users\\<user>", "<home>"],
    ["Users/<user>", "<home>"],
  ];
}

export function assertPrivacySafe(text: string, label: string): void {
  for (const marker of privacyMarkers()) {
    if (marker.test(text)) throw new ContractError(label, `${label} contains a secret marker`);
  }
  if (containsPrivatePath(text)) throw new ContractError(label, `${label} contains a private path`);
}

export function emptyBaselinePointer(): BaselinePointer {
  return {
    baselineVersion: null,
    bundlePath: null,
    environmentDigest: null,
    evaluatorDigest: null,
    priorBaselineReference: null,
    reason: null,
    scenarioDigest: null,
    schemaVersion: SCHEMA_VERSION,
    sourceDigest: null,
    status: "unestablished",
  };
}

export function writeNewFile(filePath: string, content: string): void {
  if (fs.existsSync(filePath)) throw new ContractError(filePath, "create-new path already exists");
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content, "utf8");
}

export function bundleByteLength(bundle: CaptureBundle): number {
  return bundle.samples.reduce((sum, sample) => sum + Buffer.byteLength(stableJson(sample), "utf8"), 0);
}
