import fs from "node:fs";
import path from "node:path";

import { loadModelProfile } from "../../model-profile.ts";
import { installedOpenCodeIdentity } from "../lib/opencode-proof-client.ts";
import { captureConfiguredDiagnostic } from "./capture.ts";
import {
  type RegressionManifest,
  type ScenarioRecord,
  ContractError,
  assertPrivacySafe,
  digestOf,
  governedSourceIdentity,
  resolveValidationCommand,
  stableJson,
  verifyFixtureSeed,
  writeNewFile,
} from "./contracts.ts";

const PACK_PATH = "tools/proofs/fixtures/consumer-outcome/leaf-first-task-decomposition-configured-r1.json";
const PACK_ID = "leaf-first-task-decomposition-configured-r1";
export const LEAF_FIRST_CONFIGURED_SCENARIO_IDS = ["configured-ordinary-leaf-first", "configured-openspec-leaf-first"] as const;
type LeafFirstConfiguredScenarioId = typeof LEAF_FIRST_CONFIGURED_SCENARIO_IDS[number];
const ORDINARY_SCENARIO_ID = LEAF_FIRST_CONFIGURED_SCENARIO_IDS[0];
const OPENSPEC_SCENARIO_ID = LEAF_FIRST_CONFIGURED_SCENARIO_IDS[1];
const ORDINARY_FIXTURE_PATH = "tools/proofs/fixtures/consumer-outcome/leaf-first-task-decomposition-ordinary-v1";
const OPENSPEC_FIXTURE_PATH = "tools/proofs/fixtures/consumer-outcome/leaf-first-task-decomposition-openspec-v1";
const MAXIMUM_CLAIM = "configured loaded-main observations for one reviewed LFTD-001 ordinary-root happy path plus cohesive, same-leaf, grouped-mechanical, and integration-only controls and one reviewed prescribed OpenSpec authoring/apply path that reopens a checked coarse parent in two disposable repositories under the exact recorded candidate, model, profile, source, fixture, and environment only; each selected scenario is bounded to one request and supports only its current-run rows, not universal trigger quality, optimal decomposition, untested population support, active user-process activation, or deployed-runtime behavior";
const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;
const FRICTION_FIELDS = [
  "ownerQuestionCount",
  "configuredProviderRequestCount",
  "failedToolCallCount",
  "duplicateFailedToolInvocationCount",
  "totalToolCallCount",
] as const;
const GOVERNED_SOURCE_PATHS = [
  "global/AGENTS.md",
  "global/model-profiles/quality-independent.json",
  "profiles/core.json",
  "tools/model-profile.ts",
  "tools/proofs/consumer-outcome-regression.ts",
  "tools/proofs/consumer-outcome/capture.ts",
  "tools/proofs/consumer-outcome/contracts.ts",
  "tools/proofs/consumer-outcome/leaf-first-task-decomposition-configured.ts",
  "tools/proofs/consumer-outcome/leaf-first-task-decomposition.ts",
  PACK_PATH,
  OPENSPEC_FIXTURE_PATH,
  ORDINARY_FIXTURE_PATH,
  "tools/proofs/lib/opencode-proof-client.ts",
  "tools/proofs/lib/proof-process-cleanup.ts",
  "tools/runtime-surface-profile.ts",
] as const;
const ORDINARY_INITIAL_FILES = [
  "case.json",
  "scripts/check-result.ts",
  "scripts/observe.ts",
  "work/cohesive.txt",
  "work/integration-left.txt",
  "work/integration-parent.txt",
  "work/integration-right.txt",
  "work/leaf-a.txt",
  "work/leaf-b.txt",
  "work/mechanical-a.txt",
  "work/mechanical-b.txt",
  "work/same-leaf.txt",
] as const;
const ORDINARY_STATE_FILES = [
  "result/cohesive.json",
  "result/events.json",
  "result/grouped-mechanical.json",
  "result/integration-only.json",
  "result/leaf-a.json",
  "result/leaf-b.json",
  "result/parent.json",
  "result/same-leaf.json",
  "work/cohesive.txt",
  "work/integration-parent.txt",
  "work/leaf-a.txt",
  "work/leaf-b.txt",
  "work/mechanical-a.txt",
  "work/mechanical-b.txt",
  "work/same-leaf.txt",
] as const;
const ORDINARY_EVENTS = [
  "leaf-a-proof:passed",
  "leaf-b-proof:passed",
  "parent-integration-proof:passed",
  "cohesive-direct-proof:passed",
  "same-leaf-local-failure:observed",
  "same-leaf-corrected",
  "same-leaf-proof:passed",
  "grouped-mechanical-proof:passed",
  "integration-only-failure:observed",
  "integration-parent-corrected",
  "integration-parent-proof:passed",
] as const;
const ORDINARY_EXPECTED_RESULT = {
  cohesiveMode: "direct",
  eventCount: 11,
  integrationMode: "parent-local-correct",
  leafProofCount: 2,
  mechanicalMode: "grouped-direct",
  parentAfterLeaves: true,
  parentProof: "distinct",
  sameLeafMode: "direct-correct",
  status: "passed",
  taskArtifactCount: 0,
} as const;
const OPENSPEC_INITIAL_FILES = [
  "case.json",
  "expected/final-design.md",
  "expected/final-history.md",
  "expected/final-tasks.md",
  "expected/proactive-tasks.md",
  "openspec/changes/leaf-first-fixture/.openspec.yaml",
  "openspec/changes/leaf-first-fixture/design.md",
  "openspec/changes/leaf-first-fixture/history.md",
  "openspec/changes/leaf-first-fixture/ownership.json",
  "openspec/changes/leaf-first-fixture/proposal.md",
  "openspec/changes/leaf-first-fixture/specs/fixture-client/spec.md",
  "openspec/changes/leaf-first-fixture/tasks.md",
  "scripts/check-proactive.ts",
  "scripts/check-result.ts",
  "scripts/events.ts",
  "scripts/materialize-task-shape.ts",
  "scripts/reveal-prerequisite.ts",
  "scripts/run-same-leaf.ts",
  "work/same-leaf.txt",
] as const;
const OPENSPEC_STATE_FILES = [
  "openspec/changes/leaf-first-fixture/design.md",
  "openspec/changes/leaf-first-fixture/history.md",
  "openspec/changes/leaf-first-fixture/tasks.md",
  "result/events.json",
  "result/final.json",
  "result/hidden-prerequisite.json",
  "result/proactive.json",
  "result/same-leaf.json",
  "work/same-leaf.txt",
] as const;
const OPENSPEC_EVENTS = [
  "proactive-task-tree:passed",
  "hidden-prerequisite:observed",
  "same-leaf-local-failure:observed",
  "same-leaf-corrected",
  "same-leaf-proof:passed",
  "recursive-task-delta:passed",
  "parent-integration-still-open",
  "passing-evidence-preserved",
] as const;
const OPENSPEC_EXPECTED_RESULT = {
  changedPlanningPaths: ["design.md", "history.md", "tasks.md"],
  coarseParentReopened: true,
  dependencyRefCount: 3,
  eventCount: 8,
  historyAppendCount: 1,
  parentState: "open",
  proposalChanged: false,
  sameLeafMode: "direct-correct",
  scopeChanged: false,
  status: "passed",
  taskRefCount: 4,
} as const;
const PACK_KEYS = ["configuredProviderRequestBound", "governedSourcePaths", "id", "maximumClaim", "profile", "runtimeProfile", "scenarios", "schemaVersion"] as const;
const SCENARIO_KEYS = [
  "allowedEffects", "cleanupOracle", "configuredProviderRequestBound", "evidenceByteBound", "expectedOutcome",
  "expectedResult", "fixtureId", "fixturePath", "forbiddenEffects", "frictionFields", "id", "initialManifest",
  "permissions", "proofExpectations", "request", "sampleCount", "shape", "validationArgv",
] as const;

type LeafFirstConfiguredResult = typeof ORDINARY_EXPECTED_RESULT | typeof OPENSPEC_EXPECTED_RESULT;
type LeafFirstConfiguredScenario = ScenarioRecord & { expectedResult: LeafFirstConfiguredResult };
export type LeafFirstConfiguredPack = {
  configuredProviderRequestBound: 1;
  governedSourcePaths: string[];
  id: typeof PACK_ID;
  maximumClaim: typeof MAXIMUM_CLAIM;
  profile: "quality-independent";
  runtimeProfile: "core";
  scenarios: LeafFirstConfiguredScenario[];
  schemaVersion: 1;
};

export type LeafFirstConfiguredEvaluation = {
  candidateId: string;
  configuredRoute: string | null;
  effectiveConfigDigest: string;
  evaluationDigest: string;
  failures: string[];
  maximumClaim: typeof MAXIMUM_CLAIM;
  modelCalls: number;
  openCodeSha256: string;
  openCodeVersion: string;
  packDigest: string;
  resolvedRoute: string | null;
  scenarioId: LeafFirstConfiguredScenarioId;
  sourceDigest: string;
  status: "blocked" | "failed" | "passed";
};

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
    if (actual.join("|") !== expected.join("|")) throw error(field, `${field} must contain exactly: ${expected.join(", ")}`);
  }
  return result;
}

function text(value: unknown, field: string): string {
  if (typeof value !== "string" || value.trim() === "" || value.length > 32_768) throw error(field, `${field} must be bounded non-empty text`);
  return value;
}

function stringArray(value: unknown, field: string, limit = 32): string[] {
  if (!Array.isArray(value) || value.length > limit || value.some((item) => typeof item !== "string" || item.trim() === "")) {
    throw error(field, `${field} must be an array of at most ${limit} non-empty strings`);
  }
  return value as string[];
}

function exactArray(value: unknown, expected: readonly string[], field: string): string[] {
  const actual = stringArray(value, field, Math.max(expected.length, 1));
  if (actual.join("|") !== expected.join("|")) throw error(field, `${field} drifted from the reviewed contract`);
  return actual;
}

function parseCommand(value: unknown, field: string, expectedArgv: readonly string[], stdoutIncludes: readonly string[]): { argv: string[]; exitCode: number; stdoutIncludes: string[] } {
  const source = record(value, field, ["argv", "exitCode", "stdoutIncludes"]);
  if (source.exitCode !== 0) throw error(`${field}.exitCode`, `${field}.exitCode must be zero`);
  return {
    argv: exactArray(source.argv, expectedArgv, `${field}.argv`),
    exitCode: 0,
    stdoutIncludes: exactArray(source.stdoutIncludes, stdoutIncludes, `${field}.stdoutIncludes`),
  };
}

function parseScenario(value: unknown, index: number): LeafFirstConfiguredScenario {
  const field = `leafFirstConfiguredPack.scenarios[${index}]`;
  const source = record(value, field, SCENARIO_KEYS);
  const id = text(source.id, `${field}.id`);
  if (id !== LEAF_FIRST_CONFIGURED_SCENARIO_IDS[index] || source.fixtureId !== id) throw error(field, "configured leaf-first scenario order or identity drifted");
  const openspec = id === OPENSPEC_SCENARIO_ID;
  const expected: LeafFirstConfiguredResult = openspec ? { ...OPENSPEC_EXPECTED_RESULT } : { ...ORDINARY_EXPECTED_RESULT };
  const fixturePath = openspec ? OPENSPEC_FIXTURE_PATH : ORDINARY_FIXTURE_PATH;
  const shape = openspec ? "openspec-backed" as const : "ordinary-small" as const;
  if (source.fixturePath !== fixturePath || source.shape !== shape) throw error(field, "configured leaf-first fixture or shape drifted");
  if (source.sampleCount !== 1 || source.configuredProviderRequestBound !== 1 || source.evidenceByteBound !== 524_288) throw error(field, "configured leaf-first bounds drifted");
  const initial = record(source.initialManifest, `${field}.initialManifest`, ["files"]);
  const outcome = record(source.expectedOutcome, `${field}.expectedOutcome`, ["exitCode", "stateFiles", "stdoutIncludes"]);
  const permissions = record(source.permissions, `${field}.permissions`, ["allow", "deny"]);
  const cleanup = record(source.cleanupOracle, `${field}.cleanupOracle`, ["fixtureRemoved", "processesRemoved", "sessionsRemoved"]);
  if (outcome.exitCode !== 0 || cleanup.fixtureRemoved !== true || cleanup.processesRemoved !== true || cleanup.sessionsRemoved !== true) {
    throw error(field, "configured leaf-first outcome or cleanup contract drifted");
  }
  if (stableJson(record(source.expectedResult, `${field}.expectedResult`)) !== stableJson(expected)) throw error(`${field}.expectedResult`, "configured leaf-first expected result drifted");
  const proofMarkers = openspec ? [
    "\"changedPlanningPaths\":[\"design.md\",\"history.md\",\"tasks.md\"]",
    "\"coarseParentReopened\":true",
    "\"dependencyRefCount\":3",
    "\"eventCount\":8",
    "\"historyAppendCount\":1",
    "\"parentState\":\"open\"",
    "\"proposalChanged\":false",
    "\"sameLeafMode\":\"direct-correct\"",
    "\"scopeChanged\":false",
    "\"status\":\"passed\"",
    "\"taskRefCount\":4",
  ] : [
    "\"cohesiveMode\":\"direct\"",
    "\"eventCount\":11",
    "\"integrationMode\":\"parent-local-correct\"",
    "\"leafProofCount\":2",
    "\"mechanicalMode\":\"grouped-direct\"",
    "\"parentAfterLeaves\":true",
    "\"parentProof\":\"distinct\"",
    "\"sameLeafMode\":\"direct-correct\"",
    "\"status\":\"passed\"",
    "\"taskArtifactCount\":0",
  ];
  return {
    allowedEffects: exactArray(source.allowedEffects, ["local-read", "local-write", "configured-model-call"], `${field}.allowedEffects`),
    cleanupOracle: { fixtureRemoved: true, processesRemoved: true, sessionsRemoved: true },
    configuredProviderRequestBound: 1,
    evidenceByteBound: 524_288,
    expectedOutcome: {
      exitCode: 0,
      stateFiles: exactArray(outcome.stateFiles, openspec ? OPENSPEC_STATE_FILES : ORDINARY_STATE_FILES, `${field}.expectedOutcome.stateFiles`),
      stdoutIncludes: exactArray(outcome.stdoutIncludes, [], `${field}.expectedOutcome.stdoutIncludes`),
    },
    expectedResult: expected,
    fixtureId: id,
    fixturePath,
    forbiddenEffects: exactArray(source.forbiddenEffects, openspec
      ? ["archive", "commit", "credential-read", "destructive-action", "install", "protected-action", "remote", "target-worktree-write"]
      : ["commit", "credential-read", "destructive-action", "install", "protected-action", "remote", "target-worktree-write"], `${field}.forbiddenEffects`),
    frictionFields: exactArray(source.frictionFields, FRICTION_FIELDS, `${field}.frictionFields`) as ScenarioRecord["frictionFields"],
    id,
    initialManifest: { files: exactArray(initial.files, openspec ? OPENSPEC_INITIAL_FILES : ORDINARY_INITIAL_FILES, `${field}.initialManifest.files`) },
    permissions: {
      allow: exactArray(permissions.allow, openspec
        ? ["bash", "edit", "glob", "grep", "read", "skill:openspec-apply-change", "skill:openspec-propose"]
        : ["bash", "edit", "glob", "grep", "read"], `${field}.permissions.allow`),
      deny: exactArray(permissions.deny, openspec
        ? ["external_directory", "question", "task", "webfetch"]
        : ["external_directory", "question", "skill", "task", "webfetch"], `${field}.permissions.deny`),
    },
    proofExpectations: parseCommand(source.proofExpectations, `${field}.proofExpectations`, ["node", "scripts/check-result.ts"], proofMarkers),
    request: text(source.request, `${field}.request`),
    sampleCount: 1,
    shape,
    validationArgv: exactArray(source.validationArgv, openspec
      ? ["openspec", "validate", "leaf-first-fixture", "--strict"]
      : ["node", "scripts/check-result.ts"], `${field}.validationArgv`),
  };
}

export function parseLeafFirstConfiguredPack(value: unknown): LeafFirstConfiguredPack {
  const source = record(value, "leafFirstConfiguredPack", PACK_KEYS);
  if (source.schemaVersion !== 1 || source.id !== PACK_ID || source.profile !== "quality-independent" || source.runtimeProfile !== "core"
    || source.configuredProviderRequestBound !== 1 || source.maximumClaim !== MAXIMUM_CLAIM) {
    throw error("leafFirstConfiguredPack", "configured leaf-first pack identity drifted");
  }
  if (!Array.isArray(source.scenarios) || source.scenarios.length !== LEAF_FIRST_CONFIGURED_SCENARIO_IDS.length) throw error("leafFirstConfiguredPack.scenarios", "configured leaf-first scenario population is incomplete");
  return {
    configuredProviderRequestBound: 1,
    governedSourcePaths: exactArray(source.governedSourcePaths, GOVERNED_SOURCE_PATHS, "leafFirstConfiguredPack.governedSourcePaths"),
    id: PACK_ID,
    maximumClaim: MAXIMUM_CLAIM,
    profile: "quality-independent",
    runtimeProfile: "core",
    scenarios: source.scenarios.map((scenario, index) => parseScenario(scenario, index)),
    schemaVersion: 1,
  };
}

export function loadLeafFirstConfiguredPack(repoRoot: string): { digest: string; pack: LeafFirstConfiguredPack } {
  let source: string;
  let parsed: unknown;
  try {
    source = fs.readFileSync(path.join(repoRoot, PACK_PATH), "utf8");
    assertPrivacySafe(source, "configured leaf-first seed");
    parsed = JSON.parse(source);
  } catch (cause) {
    throw error("leafFirstConfiguredPack", "configured leaf-first seed is unreadable or invalid", cause);
  }
  const pack = parseLeafFirstConfiguredPack(parsed);
  for (const scenario of pack.scenarios) {
    verifyFixtureSeed(repoRoot, scenario);
    resolveValidationCommand(scenario.validationArgv, `${scenario.id}.validationArgv`);
    resolveValidationCommand(scenario.proofExpectations.argv, `${scenario.id}.proofExpectations.argv`);
  }
  return { digest: digestOf(pack), pack };
}

function configuredManifest(pack: LeafFirstConfiguredPack, scenario: LeafFirstConfiguredScenario): RegressionManifest {
  return {
    baselinePointerPath: "tools/proofs/baselines/leaf-first-task-decomposition-configured.json",
    captureByteLimit: 8_388_608,
    defaultExpectation: "no-regression",
    frictionFields: [...FRICTION_FIELDS],
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
    assertPrivacySafe(source, "configured leaf-first diagnostic");
    diagnostic = JSON.parse(source);
  } catch (cause) {
    throw error("diagnostic", "configured leaf-first diagnostic is unreadable or invalid", cause);
  }
  const result = record(diagnostic, "diagnostic");
  if (result.digest !== digestOf({ ...result, digest: "" })) throw error("diagnostic.digest", "configured leaf-first diagnostic digest mismatch");
  return result;
}

function changedText(diagnostic: Record<string, unknown>, relativePath: string): string | null {
  if (!Array.isArray(diagnostic.changes)) return null;
  const row = (diagnostic.changes as Array<Record<string, unknown>>).find((item) => item.path === relativePath);
  const after = row?.after as Record<string, unknown> | null | undefined;
  return typeof after?.text === "string" ? after.text : null;
}

function changedBeforeText(diagnostic: Record<string, unknown>, relativePath: string): string | null {
  if (!Array.isArray(diagnostic.changes)) return null;
  const row = (diagnostic.changes as Array<Record<string, unknown>>).find((item) => item.path === relativePath);
  const before = row?.before as Record<string, unknown> | null | undefined;
  return typeof before?.text === "string" ? before.text : null;
}

function changedJson(diagnostic: Record<string, unknown>, relativePath: string): unknown {
  const source = changedText(diagnostic, relativePath);
  if (source == null) throw new Error(`${relativePath} is missing from changed text`);
  return JSON.parse(source) as unknown;
}

function ordinaryResultFailures(diagnostic: Record<string, unknown>): string[] {
  const failures: string[] = [];
  try {
    if (stableJson(changedJson(diagnostic, "result/events.json")) !== stableJson(ORDINARY_EVENTS)) failures.push("event-order");
    if (stableJson(changedJson(diagnostic, "result/leaf-a.json")) !== stableJson({ id: "leaf-a", oracle: "work/leaf-a.txt", status: "passed" })) failures.push("leaf-a-proof");
    if (stableJson(changedJson(diagnostic, "result/leaf-b.json")) !== stableJson({ id: "leaf-b", oracle: "work/leaf-b.txt", status: "passed" })) failures.push("leaf-b-proof");
    if (stableJson(changedJson(diagnostic, "result/parent.json")) !== stableJson({ dependencies: ["leaf-a", "leaf-b"], id: "release-bundle", oracle: "distinct-integration", status: "passed" })) failures.push("parent-proof");
    if (stableJson(changedJson(diagnostic, "result/cohesive.json")) !== stableJson({ id: "cohesive", mode: "direct", status: "passed" })) failures.push("cohesive-control");
    if (stableJson(changedJson(diagnostic, "result/same-leaf.json")) !== stableJson({ id: "same-leaf", mode: "direct-correct", status: "passed" })) failures.push("same-leaf-control");
    if (stableJson(changedJson(diagnostic, "result/grouped-mechanical.json")) !== stableJson({ id: "grouped-mechanical", mode: "grouped-direct", owners: 2, status: "passed" })) failures.push("grouped-mechanical-control");
    if (stableJson(changedJson(diagnostic, "result/integration-only.json")) !== stableJson({ id: "integration-only", leafEvidencePreserved: true, mode: "parent-local-correct", status: "passed" })) failures.push("integration-only-control");
    for (const [relative, expected] of [
      ["work/leaf-a.txt", "alpha-ready"], ["work/leaf-b.txt", "beta-ready"], ["work/cohesive.txt", "cohesive-ready"],
      ["work/same-leaf.txt", "local-fixed"], ["work/mechanical-a.txt", "mechanical-ready"], ["work/mechanical-b.txt", "mechanical-ready"],
      ["work/integration-parent.txt", "integrated-fixed"],
    ] as const) {
      if (changedText(diagnostic, relative)?.trim() !== expected) failures.push(`work-result:${relative}`);
    }
  } catch {
    failures.push("result-json");
  }
  return failures;
}

function openSpecResultFailures(_repoRoot: string, diagnostic: Record<string, unknown>): string[] {
  const failures: string[] = [];
  try {
    if (!changedBeforeText(diagnostic, "openspec/changes/leaf-first-fixture/tasks.md")?.includes("- [x] 1.1")) failures.push("checked-parent-seed");
    if (stableJson(changedJson(diagnostic, "result/events.json")) !== stableJson(OPENSPEC_EVENTS)) failures.push("event-order");
    if (stableJson(changedJson(diagnostic, "result/proactive.json")) !== stableJson({ dependencyRefs: ["leaf-schema:parent-client", "leaf-transport:parent-client"], parentState: "open", status: "passed" })) failures.push("proactive-task-tree");
    if (stableJson(changedJson(diagnostic, "result/hidden-prerequisite.json")) !== stableJson({ affectedLeaf: "leaf-schema", parent: "parent-client", preservedEvidence: ["evidence-transport"], prerequisite: "leaf-schema-prerequisite", status: "observed" })) failures.push("hidden-prerequisite");
    if (stableJson(changedJson(diagnostic, "result/same-leaf.json")) !== stableJson({ id: "same-leaf", mode: "direct-correct", status: "passed" })) failures.push("same-leaf-control");
    if (stableJson(changedJson(diagnostic, "result/final.json")) !== stableJson(OPENSPEC_EXPECTED_RESULT)) failures.push("final-result");
    for (const [actual, markers] of [
      ["openspec/changes/leaf-first-fixture/design.md", ["leaf-schema-prerequisite", "leaf-schema", "leaf-transport", "parent-client", "evidence-transport"]],
      ["openspec/changes/leaf-first-fixture/history.md", ["leaf-schema-prerequisite", "evidence-transport", "Selected route", "Retry condition"]],
      ["openspec/changes/leaf-first-fixture/tasks.md", ["[leaf-schema-prerequisite]", "[leaf-schema]", "[leaf-transport]", "[parent-client]", "Dependencies", "Observable Proof"]],
    ] as const) {
      const text = (changedText(diagnostic, actual) ?? "").toLowerCase();
      if (markers.some((marker) => !text.includes(marker.toLowerCase()))) failures.push(`planning-result:${actual}`);
    }
    if (changedText(diagnostic, "work/same-leaf.txt")?.trim() !== "local-fixed") failures.push("work-result:work/same-leaf.txt");
  } catch {
    failures.push("result-json");
  }
  return failures;
}

export function evaluateLeafFirstConfiguredDiagnostic(
  repoRoot: string,
  loaded: { digest: string; pack: LeafFirstConfiguredPack },
  diagnostic: Record<string, unknown>,
): LeafFirstConfiguredEvaluation {
  const failures: string[] = [];
  const diagnosticScenarioId = typeof diagnostic.scenarioId === "string" ? diagnostic.scenarioId : "unknown";
  const scenario = loaded.pack.scenarios.find((candidate) => candidate.id === diagnosticScenarioId) ?? loaded.pack.scenarios[0]!;
  if (diagnostic.scenarioDigest !== loaded.digest) failures.push("scenario-digest");
  if (diagnostic.scenarioId !== scenario.id || !LEAF_FIRST_CONFIGURED_SCENARIO_IDS.includes(diagnosticScenarioId as LeafFirstConfiguredScenarioId)) failures.push("scenario-id");
  if (diagnostic.terminalClassification !== "completed-observation") failures.push("terminal-classification");
  const cleanup = diagnostic.cleanup as Record<string, unknown> | undefined;
  const cleanupComplete = cleanup?.complete === true && cleanup.fixtureRemoved === true && cleanup.processesRemoved === true && cleanup.sessionsRemoved === true;
  if (!cleanupComplete) failures.push("cleanup");
  const providerRequestCount = typeof diagnostic.providerRequestCount === "number" ? diagnostic.providerRequestCount : -1;
  if (providerRequestCount !== 1) failures.push("provider-request-bound");
  if (!Array.isArray(diagnostic.runtimeErrors) || diagnostic.runtimeErrors.length !== 0) failures.push("runtime-errors");
  const validation = diagnostic.validation as Record<string, unknown> | undefined;
  const proof = diagnostic.proof as Record<string, unknown> | undefined;
  if (validation?.status !== 0) failures.push("validation-status");
  if (proof?.status !== 0) failures.push("proof-status");
  const proofStdout = typeof proof?.stdout === "string" ? proof.stdout : "";
  for (const marker of scenario.proofExpectations.stdoutIncludes) if (!proofStdout.includes(marker)) failures.push(`proof-marker:${marker}`);
  try {
    if (stableJson(JSON.parse(proofStdout.trim())) !== stableJson(scenario.expectedResult)) failures.push("proof-result");
  } catch {
    failures.push("proof-result-json");
  }

  const session = diagnostic.session as Record<string, unknown> | undefined;
  const messages = session?.messages as Record<string, unknown> | undefined;
  const toolCalls = Array.isArray(messages?.toolCalls) ? messages.toolCalls as Array<Record<string, unknown>> : [];
  const toolNames = toolCalls.map((tool) => tool.name).filter((name): name is string => typeof name === "string");
  if (!toolNames.includes("read") || !toolNames.includes("bash") || !toolNames.some((name) => name === "edit" || name === "apply_patch")) failures.push("required-tool-path");
  if (scenario.id === OPENSPEC_SCENARIO_ID && toolNames.filter((name) => name === "skill").length < 2) failures.push("required-skill-path");
  const prohibitedTools = new Set(["question", "task", "todowrite", "webfetch", "websearch", ...(scenario.id === ORDINARY_SCENARIO_ID ? ["skill"] : [])]);
  if (toolNames.some((name) => prohibitedTools.has(name))) failures.push("prohibited-tool");
  if (scenario.id === OPENSPEC_SCENARIO_ID && toolCalls.some((tool) => JSON.stringify(tool).replace(/\\/g, "/").includes("expected/"))) failures.push("oracle-source-read");

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
  if (sourceDigest !== currentSourceDigest || !/^[a-f0-9]{64}$/.test(sourceDigest)) failures.push("source-identity");

  const changedPaths = Array.isArray(diagnostic.changes)
    ? (diagnostic.changes as Array<Record<string, unknown>>).map((row) => row.path).filter((item): item is string => typeof item === "string").sort((left, right) => left.localeCompare(right))
    : [];
  if (changedPaths.join("|") !== [...scenario.expectedOutcome.stateFiles].sort((left, right) => left.localeCompare(right)).join("|")) failures.push("fixture-write-set");
  failures.push(...(scenario.id === OPENSPEC_SCENARIO_ID ? openSpecResultFailures(repoRoot, diagnostic) : ordinaryResultFailures(diagnostic)));

  const candidateId = typeof diagnostic.candidateId === "string" ? diagnostic.candidateId : "unknown";
  if (!SAFE_ID.test(candidateId)) failures.push("candidate-id");
  const uniqueFailures = [...new Set(failures)].sort((left, right) => left.localeCompare(right));
  const evaluation: LeafFirstConfiguredEvaluation = {
    candidateId,
    configuredRoute,
    effectiveConfigDigest,
    evaluationDigest: "",
    failures: uniqueFailures,
    maximumClaim: MAXIMUM_CLAIM,
    modelCalls: providerRequestCount < 0 ? 0 : providerRequestCount,
    openCodeSha256,
    openCodeVersion,
    packDigest: loaded.digest,
    resolvedRoute,
    scenarioId: scenario.id as LeafFirstConfiguredScenarioId,
    sourceDigest,
    status: cleanupComplete ? uniqueFailures.length === 0 ? "passed" : "failed" : "blocked",
  };
  evaluation.evaluationDigest = digestOf(evaluation);
  assertPrivacySafe(stableJson(evaluation), "configured leaf-first evaluation");
  return evaluation;
}

export function leafFirstConfiguredPreflight(options: {
  candidateConfigDir: string;
  executable: string;
  gitRef: string;
  repoRoot: string;
  scenarioIds?: string[];
}): Record<string, unknown> {
  if (options.gitRef !== "working-tree") throw error("sourceRef", "configured leaf-first preflight requires --source-ref working-tree");
  if (options.scenarioIds?.length !== 1 || !LEAF_FIRST_CONFIGURED_SCENARIO_IDS.includes(options.scenarioIds[0] as LeafFirstConfiguredScenarioId)) {
    throw error("scenarioIds", `configured leaf-first requires one of: ${LEAF_FIRST_CONFIGURED_SCENARIO_IDS.join(", ")}`);
  }
  const scenarioId = options.scenarioIds[0] as LeafFirstConfiguredScenarioId;
  const loaded = loadLeafFirstConfiguredPack(options.repoRoot);
  const configDir = path.resolve(options.candidateConfigDir);
  for (const relative of ["AGENTS.md", "opencode.json"]) if (!fs.existsSync(path.join(configDir, relative))) throw error("candidateConfigDir", `configured candidate is missing: ${relative}`);
  const authority = fs.readFileSync(path.join(configDir, "AGENTS.md"), "utf8");
  if (!authority.includes("### Leaf-first dependency execution") || !authority.includes("Leaf evidence proves only that leaf")) {
    throw error("candidateConfigDir", "configured candidate is missing the loaded leaf-first authority");
  }
  if (scenarioId === OPENSPEC_SCENARIO_ID) {
    for (const relative of ["skills/openspec-apply-change/SKILL.md", "skills/openspec-propose/SKILL.md"]) {
      if (!fs.existsSync(path.join(configDir, relative))) throw error("candidateConfigDir", `configured OpenSpec candidate is missing: ${relative}`);
    }
  }
  const profile = loadModelProfile(options.repoRoot, loaded.pack.profile).profile;
  const source = governedSourceIdentity(options.repoRoot, options.gitRef, loaded.pack.governedSourcePaths);
  return {
    configuredProviderRequestBound: 1,
    configuredRoute: `${profile.agent.build!.model}/${profile.agent.build!.variant}`,
    governedDigest: source.governedDigest,
    governedSourcePaths: loaded.pack.governedSourcePaths,
    liveAttemptGate: "bounded-synthetic-observation-authorized",
    maximumClaim: MAXIMUM_CLAIM,
    mode: "preflight",
    modelCalls: 0,
    openCode: installedOpenCodeIdentity(options.executable),
    pack: loaded.pack.id,
    packDigest: loaded.digest,
    runtimeProfile: loaded.pack.runtimeProfile,
    scenarioIds: [scenarioId],
    status: "ready",
  };
}

export async function captureLeafFirstConfigured(options: {
  candidateConfigDir: string;
  candidateId: string;
  evidenceRoot: string;
  executable: string;
  gitRef: string;
  repoRoot: string;
  scenarioId: string;
}): Promise<{ diagnostic: Record<string, unknown>; evaluation: LeafFirstConfiguredEvaluation }> {
  if (options.gitRef !== "working-tree") throw error("sourceRef", "configured leaf-first capture requires --source-ref working-tree");
  if (!LEAF_FIRST_CONFIGURED_SCENARIO_IDS.includes(options.scenarioId as LeafFirstConfiguredScenarioId)) {
    throw error("scenarioId", `configured leaf-first scenario must be one of: ${LEAF_FIRST_CONFIGURED_SCENARIO_IDS.join(", ")}`);
  }
  const loaded = loadLeafFirstConfiguredPack(options.repoRoot);
  const scenario = loaded.pack.scenarios.find((candidate) => candidate.id === options.scenarioId)!;
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
  const evaluation = evaluateLeafFirstConfiguredDiagnostic(options.repoRoot, loaded, diagnostic);
  writeNewFile(path.join(options.evidenceRoot, "evaluation.json"), `${JSON.stringify(evaluation, null, 2)}\n`);
  return { diagnostic, evaluation };
}

export function replayLeafFirstConfigured(repoRoot: string, diagnosticPath: string, scenarioId: string): LeafFirstConfiguredEvaluation {
  if (!LEAF_FIRST_CONFIGURED_SCENARIO_IDS.includes(scenarioId as LeafFirstConfiguredScenarioId)) {
    throw error("scenarioId", `configured leaf-first scenario must be one of: ${LEAF_FIRST_CONFIGURED_SCENARIO_IDS.join(", ")}`);
  }
  return evaluateLeafFirstConfiguredDiagnostic(repoRoot, loadLeafFirstConfiguredPack(repoRoot), readConfiguredDiagnostic(diagnosticPath));
}
