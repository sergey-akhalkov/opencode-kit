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
  requireExactKeys,
  resolveValidationCommand,
  stableJson,
  verifyFixtureSeed,
  writeNewFile,
} from "./contracts.ts";

const PACK_PATH = "tools/proofs/fixtures/consumer-outcome/ordinary-small-closure-configured-r1.json";
const PACK_ID = "ordinary-small-closure-configured-r1";
export const ORDINARY_SMALL_CLOSURE_CONFIGURED_SCENARIO_ID = "configured-compact-ordinary-small";
const FIXTURE_PATH = "tools/proofs/fixtures/consumer-outcome/ordinary-small-closure-configured-v1";
const CHANGE_ID = "compact-note-title";
const MAXIMUM_CLAIM = "configured loaded-main observation for one reviewed SOSC-001 compact Ordinary Small exact authoring path in one disposable repository under the exact recorded candidate, model, profile, source, fixture, and environment only; the scenario is bounded to one request and proves only its current artifact, operation-gate, effect, and cleanup rows, not universal risk classification, untested repository or runtime versions, active user-process activation, or deployed behavior";
const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;
const FRICTION_FIELDS = [
  "ownerQuestionCount",
  "configuredProviderRequestCount",
  "failedToolCallCount",
  "duplicateFailedToolInvocationCount",
  "totalToolCallCount",
] as const;
const INITIAL_FILES = [
  "case.json",
  "notes/title.txt",
  "openspec/config.yaml",
  "oracle/check-result.ts",
  "scripts/check-title.ts",
] as const;
const ARTIFACT_FILES = [
  `openspec/changes/${CHANGE_ID}/.openspec.yaml`,
  `openspec/changes/${CHANGE_ID}/design.md`,
  `openspec/changes/${CHANGE_ID}/proposal.md`,
  `openspec/changes/${CHANGE_ID}/specs/note-title/spec.md`,
  `openspec/changes/${CHANGE_ID}/tasks.md`,
] as const;
const GOVERNED_SOURCE_PATHS = [
  "global/AGENTS.md",
  "global/bin/openspec-change/automation-dividend.ts",
  "global/bin/openspec-change/bounded-falsification.ts",
  "global/bin/openspec-change/claims.ts",
  "global/bin/openspec-change/delivery-horizon.ts",
  "global/bin/openspec-change/manifest.ts",
  "global/bin/openspec-change/state.ts",
  "global/bin/openspec-operation-gate.ts",
  "global/model-profiles/quality-independent.json",
  "global/skills/openspec-propose/SKILL.md",
  "profiles/core.json",
  "tools/model-profile.ts",
  "tools/proofs/consumer-outcome-regression.ts",
  "tools/proofs/consumer-outcome/capture.ts",
  "tools/proofs/consumer-outcome/contracts.ts",
  "tools/proofs/consumer-outcome/ordinary-small-closure-configured.ts",
  "tools/proofs/consumer-outcome/ordinary-small-closure.ts",
  PACK_PATH,
  FIXTURE_PATH,
  "tools/proofs/lib/opencode-proof-client.ts",
  "tools/proofs/lib/proof-process-cleanup.ts",
  "tools/runtime-surface-profile.ts",
] as const;
const EXPECTED_RESULT = {
  applyExitCode: 0,
  applyStatus: "passed",
  artifactProfile: "compact",
  forbiddenArtifactCount: 0,
  planningArtifacts: [...ARTIFACT_FILES],
  proposalCapsuleFieldCount: 6,
  proposeExitCode: 0,
  proposeStatus: "warning",
  riskDispositionKind: "ordinary-small-exact",
  status: "passed",
} as const;
const PACK_KEYS = ["configuredProviderRequestBound", "governedSourcePaths", "id", "maximumClaim", "profile", "runtimeProfile", "scenarios", "schemaVersion"] as const;
const SCENARIO_KEYS = [
  "allowedEffects", "cleanupOracle", "configuredProviderRequestBound", "evidenceByteBound", "expectedOutcome",
  "expectedResult", "fixtureId", "fixturePath", "forbiddenEffects", "frictionFields", "id", "initialManifest",
  "permissions", "proofExpectations", "request", "sampleCount", "shape", "validationArgv",
] as const;

type ConfiguredResult = typeof EXPECTED_RESULT;
type ConfiguredScenario = ScenarioRecord & { expectedResult: ConfiguredResult };
export type OrdinarySmallClosureConfiguredPack = {
  configuredProviderRequestBound: 1;
  governedSourcePaths: string[];
  id: typeof PACK_ID;
  maximumClaim: typeof MAXIMUM_CLAIM;
  profile: "quality-independent";
  runtimeProfile: "core";
  scenarios: [ConfiguredScenario];
  schemaVersion: 1;
};

export type OrdinarySmallClosureConfiguredEvaluation = {
  applyStatus: string | null;
  artifactPaths: string[];
  candidateId: string;
  cleanupComplete: boolean;
  configuredRoute: string | null;
  effectiveConfigDigest: string;
  evaluationDigest: string;
  failures: string[];
  forbiddenEffectCount: number;
  maximumClaim: typeof MAXIMUM_CLAIM;
  modelCalls: number;
  openCodeSha256: string;
  openCodeVersion: string;
  packDigest: string;
  proofStatus: number | null;
  proposeStatus: string | null;
  resolvedRoute: string | null;
  scenarioId: typeof ORDINARY_SMALL_CLOSURE_CONFIGURED_SCENARIO_ID;
  sourceDigest: string;
  status: "blocked" | "failed" | "passed";
  terminalClassification: string;
  toolCallCount: number;
  validationStatus: number | null;
};

function error(field: string, message: string, cause?: unknown): ContractError {
  const result = new ContractError(field, message);
  if (cause != null) (result as ContractError & { cause?: unknown }).cause = cause;
  return result;
}

function requireString(value: unknown, field: string): string {
  if (typeof value !== "string" || value.trim() === "" || value.length > 32_768) throw error(field, `${field} must be bounded non-empty text`);
  return value;
}

function requireStringArray(value: unknown, field: string): string[] {
  if (!Array.isArray(value) || value.length > 64 || value.some((item) => typeof item !== "string" || item.trim() === "" || item.length > 32_768)) {
    throw error(field, `${field} must be an array of bounded non-empty strings`);
  }
  return value as string[];
}

function exactArray(value: unknown, expected: readonly string[], field: string): string[] {
  const actual = requireStringArray(value, field);
  if (actual.join("|") !== expected.join("|")) throw error(field, `${field} drifted from the reviewed contract`);
  return actual;
}

function parseCommand(value: unknown, expectedArgv: readonly string[], expectedStdout: readonly string[], field: string): { argv: string[]; exitCode: number; stdoutIncludes: string[] } {
  const source = requireExactKeys(value, ["argv", "exitCode", "stdoutIncludes"], field);
  if (source.exitCode !== 0) throw error(`${field}.exitCode`, `${field}.exitCode must be zero`);
  return {
    argv: exactArray(source.argv, expectedArgv, `${field}.argv`),
    exitCode: 0,
    stdoutIncludes: exactArray(source.stdoutIncludes, expectedStdout, `${field}.stdoutIncludes`),
  };
}

function parseScenario(value: unknown): ConfiguredScenario {
  const field = "ordinarySmallClosureConfiguredPack.scenarios[0]";
  const source = requireExactKeys(value, SCENARIO_KEYS, field);
  if (source.id !== ORDINARY_SMALL_CLOSURE_CONFIGURED_SCENARIO_ID || source.fixtureId !== source.id || source.fixturePath !== FIXTURE_PATH || source.shape !== "openspec-backed") {
    throw error(field, "configured ordinary-small-closure scenario identity drifted");
  }
  if (source.sampleCount !== 1 || source.configuredProviderRequestBound !== 1 || source.evidenceByteBound !== 524_288) {
    throw error(field, "configured ordinary-small-closure bounds drifted");
  }
  const initial = requireExactKeys(source.initialManifest, ["files"], `${field}.initialManifest`);
  const outcome = requireExactKeys(source.expectedOutcome, ["exitCode", "stateFiles", "stdoutIncludes"], `${field}.expectedOutcome`);
  const permissions = requireExactKeys(source.permissions, ["allow", "deny"], `${field}.permissions`);
  const cleanup = requireExactKeys(source.cleanupOracle, ["fixtureRemoved", "processesRemoved", "sessionsRemoved"], `${field}.cleanupOracle`);
  if (outcome.exitCode !== 0 || cleanup.fixtureRemoved !== true || cleanup.processesRemoved !== true || cleanup.sessionsRemoved !== true) {
    throw error(field, "configured ordinary-small-closure outcome or cleanup contract drifted");
  }
  if (stableJson(requireExactKeys(source.expectedResult, Object.keys(EXPECTED_RESULT), `${field}.expectedResult`)) !== stableJson(EXPECTED_RESULT)) {
    throw error(`${field}.expectedResult`, "configured ordinary-small-closure expected result drifted");
  }
  const proofMarkers = [
    "\"applyExitCode\":0",
    "\"applyStatus\":\"passed\"",
    "\"artifactProfile\":\"compact\"",
    "\"forbiddenArtifactCount\":0",
    "\"proposalCapsuleFieldCount\":6",
    "\"proposeExitCode\":0",
    "\"proposeStatus\":\"warning\"",
    "\"riskDispositionKind\":\"ordinary-small-exact\"",
    "\"status\":\"passed\"",
  ];
  return {
    allowedEffects: exactArray(source.allowedEffects, ["local-read", "local-write", "configured-model-call"], `${field}.allowedEffects`),
    cleanupOracle: { fixtureRemoved: true, processesRemoved: true, sessionsRemoved: true },
    configuredProviderRequestBound: 1,
    evidenceByteBound: 524_288,
    expectedOutcome: {
      exitCode: 0,
      stateFiles: exactArray(outcome.stateFiles, ARTIFACT_FILES, `${field}.expectedOutcome.stateFiles`),
      stdoutIncludes: exactArray(outcome.stdoutIncludes, [], `${field}.expectedOutcome.stdoutIncludes`),
    },
    expectedResult: EXPECTED_RESULT,
    fixtureId: ORDINARY_SMALL_CLOSURE_CONFIGURED_SCENARIO_ID,
    fixturePath: FIXTURE_PATH,
    forbiddenEffects: exactArray(source.forbiddenEffects, ["archive", "commit", "credential-read", "destructive-action", "install", "protected-action", "remote", "target-worktree-write"], `${field}.forbiddenEffects`),
    frictionFields: exactArray(source.frictionFields, FRICTION_FIELDS, `${field}.frictionFields`) as ScenarioRecord["frictionFields"],
    id: ORDINARY_SMALL_CLOSURE_CONFIGURED_SCENARIO_ID,
    initialManifest: { files: exactArray(initial.files, INITIAL_FILES, `${field}.initialManifest.files`) },
    permissions: {
      allow: exactArray(permissions.allow, ["bash", "edit", "glob", "grep", "read", "skill:openspec-propose"], `${field}.permissions.allow`),
      deny: exactArray(permissions.deny, ["external_directory", "question", "task", "webfetch"], `${field}.permissions.deny`),
    },
    proofExpectations: parseCommand(source.proofExpectations, ["node", "oracle/check-result.ts"], proofMarkers, `${field}.proofExpectations`),
    request: requireString(source.request, `${field}.request`),
    sampleCount: 1,
    shape: "openspec-backed",
    validationArgv: exactArray(source.validationArgv, ["openspec", "validate", CHANGE_ID, "--strict"], `${field}.validationArgv`),
  };
}

export function parseOrdinarySmallClosureConfiguredPack(value: unknown): OrdinarySmallClosureConfiguredPack {
  const source = requireExactKeys(value, PACK_KEYS, "ordinarySmallClosureConfiguredPack");
  if (source.schemaVersion !== 1 || source.id !== PACK_ID || source.profile !== "quality-independent" || source.runtimeProfile !== "core"
    || source.configuredProviderRequestBound !== 1 || source.maximumClaim !== MAXIMUM_CLAIM) {
    throw error("ordinarySmallClosureConfiguredPack", "configured ordinary-small-closure pack identity drifted");
  }
  if (!Array.isArray(source.scenarios) || source.scenarios.length !== 1) throw error("ordinarySmallClosureConfiguredPack.scenarios", "configured ordinary-small-closure scenario population is incomplete");
  return {
    configuredProviderRequestBound: 1,
    governedSourcePaths: exactArray(source.governedSourcePaths, GOVERNED_SOURCE_PATHS, "ordinarySmallClosureConfiguredPack.governedSourcePaths"),
    id: PACK_ID,
    maximumClaim: MAXIMUM_CLAIM,
    profile: "quality-independent",
    runtimeProfile: "core",
    scenarios: [parseScenario(source.scenarios[0])],
    schemaVersion: 1,
  };
}

export function loadOrdinarySmallClosureConfiguredPack(repoRoot: string): { digest: string; pack: OrdinarySmallClosureConfiguredPack } {
  let source: string;
  let parsed: unknown;
  try {
    source = fs.readFileSync(path.join(repoRoot, PACK_PATH), "utf8");
    assertPrivacySafe(source, "configured ordinary-small-closure seed");
    parsed = JSON.parse(source);
  } catch (cause) {
    throw error("ordinarySmallClosureConfiguredPack", "configured ordinary-small-closure seed is unreadable or invalid", cause);
  }
  const pack = parseOrdinarySmallClosureConfiguredPack(parsed);
  const scenario = pack.scenarios[0];
  verifyFixtureSeed(repoRoot, scenario);
  resolveValidationCommand(scenario.validationArgv, `${scenario.id}.validationArgv`);
  resolveValidationCommand(scenario.proofExpectations.argv, `${scenario.id}.proofExpectations.argv`);
  return { digest: digestOf(pack), pack };
}

function configuredManifest(pack: OrdinarySmallClosureConfiguredPack): RegressionManifest {
  return {
    baselinePointerPath: "tools/proofs/baselines/ordinary-small-closure-configured.json",
    captureByteLimit: 8_388_608,
    defaultExpectation: "no-regression",
    frictionFields: [...FRICTION_FIELDS],
    governedSourcePaths: pack.governedSourcePaths,
    pairOrder: ["C1"],
    profile: pack.profile,
    sampleByteLimit: 524_288,
    sampleCount: 1,
    scenarios: pack.scenarios,
    schemaVersion: 3,
  };
}

function readDiagnostic(diagnosticPath: string): Record<string, unknown> {
  let diagnostic: unknown;
  try {
    const source = fs.readFileSync(diagnosticPath, "utf8");
    assertPrivacySafe(source, "configured ordinary-small-closure diagnostic");
    diagnostic = JSON.parse(source);
  } catch (cause) {
    throw error("diagnostic", "configured ordinary-small-closure diagnostic is unreadable or invalid", cause);
  }
  const result = requireExactKeys(diagnostic, Object.keys(diagnostic as Record<string, unknown>), "diagnostic");
  if (result.digest !== digestOf({ ...result, digest: "" })) throw error("diagnostic.digest", "configured ordinary-small-closure diagnostic digest mismatch");
  return result;
}

function changedText(diagnostic: Record<string, unknown>, relativePath: string): string | null {
  if (!Array.isArray(diagnostic.changes)) return null;
  const row = (diagnostic.changes as Array<Record<string, unknown>>).find((item) => item.path === relativePath);
  const after = row?.after as Record<string, unknown> | null | undefined;
  return typeof after?.text === "string" ? after.text : null;
}

function artifactFailures(diagnostic: Record<string, unknown>): string[] {
  const failures: string[] = [];
  const metadata = changedText(diagnostic, ARTIFACT_FILES[0]) ?? "";
  if (!/^schema:\s*spec-driven\s*$/m.test(metadata)) failures.push("metadata-schema");
  if (!/^artifactProfile:\s*compact\s*$/m.test(metadata)) failures.push("metadata-profile");
  if (!/^riskDisposition:\s*\r?\n\s+kind:\s*ordinary-small-exact\s*$/m.test(metadata)) failures.push("metadata-risk");
  const proposal = changedText(diagnostic, ARTIFACT_FILES[2]) ?? "";
  const capsuleFields = ["Outcome", "Operating Envelope", "Non-Goals", "Non-Deferrable Invariants", "Observable Proof", "Stop Line"];
  if (capsuleFields.some((field) => {
    const listField = proposal.includes(`**${field}**:`) || proposal.includes(`**${field}:**`);
    return !listField && !new RegExp(`^#{2,4} ${field}$`, "m").test(proposal);
  })) failures.push("proposal-capsule");
  for (const forbidden of ["Material Residual Risks", "Delivery Horizon", "Automation Dividend", "Bounded Falsification Review", "Claim And Evidence Scope"]) {
    if (proposal.includes(forbidden)) failures.push(`proposal-forbidden:${forbidden}`);
  }
  const design = changedText(diagnostic, ARTIFACT_FILES[1]) ?? "";
  if (design.trim().length < 20) failures.push("design-artifact");
  const specification = changedText(diagnostic, ARTIFACT_FILES[3]) ?? "";
  if (!specification.includes("## ADDED Requirements") || !specification.includes("### Requirement:") || !specification.includes("#### Scenario:")
    || !specification.includes("- **WHEN**") || !specification.includes("- **THEN**")) failures.push("spec-artifact");
  const tasks = changedText(diagnostic, ARTIFACT_FILES[4]) ?? "";
  if (!tasks.includes("- [ ]") || tasks.includes("[automation-dividend]")) failures.push("tasks-artifact");
  return failures;
}

export function evaluateOrdinarySmallClosureConfiguredDiagnostic(
  repoRoot: string,
  loaded: { digest: string; pack: OrdinarySmallClosureConfiguredPack },
  diagnostic: Record<string, unknown>,
): OrdinarySmallClosureConfiguredEvaluation {
  const failures: string[] = [];
  const scenario = loaded.pack.scenarios[0];
  if (diagnostic.scenarioDigest !== loaded.digest) failures.push("scenario-digest");
  if (diagnostic.scenarioId !== scenario.id) failures.push("scenario-id");
  const terminalClassification = typeof diagnostic.terminalClassification === "string" ? diagnostic.terminalClassification : "unknown";
  if (terminalClassification !== "completed-observation") failures.push("terminal-classification");
  const cleanup = diagnostic.cleanup as Record<string, unknown> | undefined;
  const cleanupComplete = cleanup?.complete === true && cleanup.fixtureRemoved === true && cleanup.processesRemoved === true && cleanup.sessionsRemoved === true;
  if (!cleanupComplete) failures.push("cleanup");
  const providerRequestCount = typeof diagnostic.providerRequestCount === "number" ? diagnostic.providerRequestCount : -1;
  if (providerRequestCount !== 1) failures.push("provider-request-bound");
  if (!Array.isArray(diagnostic.runtimeErrors) || diagnostic.runtimeErrors.length !== 0) failures.push("runtime-errors");
  const validation = diagnostic.validation as Record<string, unknown> | undefined;
  const proof = diagnostic.proof as Record<string, unknown> | undefined;
  const validationStatus = typeof validation?.status === "number" ? validation.status : null;
  const proofStatus = typeof proof?.status === "number" ? proof.status : null;
  if (validationStatus !== 0) failures.push("validation-status");
  if (proofStatus !== 0) failures.push("proof-status");
  const proofStdout = typeof proof?.stdout === "string" ? proof.stdout : "";
  for (const marker of scenario.proofExpectations.stdoutIncludes) if (!proofStdout.includes(marker)) failures.push(`proof-marker:${marker}`);
  let proofResult: Record<string, unknown> = {};
  try {
    proofResult = requireExactKeys(JSON.parse(proofStdout.trim()), Object.keys(EXPECTED_RESULT), "proofResult");
    if (stableJson(proofResult) !== stableJson(EXPECTED_RESULT)) failures.push("proof-result");
  } catch {
    failures.push("proof-result-json");
  }

  const session = diagnostic.session as Record<string, unknown> | undefined;
  const messages = session?.messages as Record<string, unknown> | undefined;
  const toolCalls = Array.isArray(messages?.toolCalls) ? messages.toolCalls as Array<Record<string, unknown>> : [];
  const toolNames = toolCalls.map((tool) => tool.name).filter((name): name is string => typeof name === "string");
  if (!toolNames.includes("read") || !toolNames.some((name) => name === "edit" || name === "apply_patch")) failures.push("required-tool-path");
  if (!toolNames.includes("skill")) failures.push("required-skill-path");
  const prohibitedTools = new Set(["question", "task", "todowrite", "webfetch", "websearch"]);
  const prohibitedToolCount = toolNames.filter((name) => prohibitedTools.has(name)).length;
  if (prohibitedToolCount > 0) failures.push("prohibited-tool");
  if (toolCalls.some((tool) => JSON.stringify(tool).replace(/\\/g, "/").includes("oracle/check-result.ts"))) failures.push("oracle-source-read");

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

  const artifactPaths = Array.isArray(diagnostic.changes)
    ? (diagnostic.changes as Array<Record<string, unknown>>).map((row) => row.path).filter((item): item is string => typeof item === "string").sort((left, right) => left.localeCompare(right))
    : [];
  if (artifactPaths.join("|") !== [...ARTIFACT_FILES].sort((left, right) => left.localeCompare(right)).join("|")) failures.push("fixture-write-set");
  failures.push(...artifactFailures(diagnostic));

  const candidateId = typeof diagnostic.candidateId === "string" ? diagnostic.candidateId : "unknown";
  if (!SAFE_ID.test(candidateId)) failures.push("candidate-id");
  const uniqueFailures = [...new Set(failures)].sort((left, right) => left.localeCompare(right));
  const evaluation: OrdinarySmallClosureConfiguredEvaluation = {
    applyStatus: typeof proofResult.applyStatus === "string" ? proofResult.applyStatus : null,
    artifactPaths,
    candidateId,
    cleanupComplete,
    configuredRoute,
    effectiveConfigDigest,
    evaluationDigest: "",
    failures: uniqueFailures,
    forbiddenEffectCount: prohibitedToolCount + (Array.isArray(diagnostic.runtimeErrors) ? diagnostic.runtimeErrors.length : 1),
    maximumClaim: MAXIMUM_CLAIM,
    modelCalls: providerRequestCount < 0 ? 0 : providerRequestCount,
    openCodeSha256,
    openCodeVersion,
    packDigest: loaded.digest,
    proofStatus,
    proposeStatus: typeof proofResult.proposeStatus === "string" ? proofResult.proposeStatus : null,
    resolvedRoute,
    scenarioId: ORDINARY_SMALL_CLOSURE_CONFIGURED_SCENARIO_ID,
    sourceDigest,
    status: cleanupComplete ? uniqueFailures.length === 0 ? "passed" : "failed" : "blocked",
    terminalClassification,
    toolCallCount: toolCalls.length,
    validationStatus,
  };
  evaluation.evaluationDigest = digestOf(evaluation);
  assertPrivacySafe(stableJson(evaluation), "configured ordinary-small-closure evaluation");
  return evaluation;
}

export function ordinarySmallClosureConfiguredPreflight(options: {
  candidateConfigDir: string;
  executable: string;
  gitRef: string;
  repoRoot: string;
  scenarioIds?: string[];
}): Record<string, unknown> {
  if (options.gitRef !== "working-tree") throw error("sourceRef", "configured ordinary-small-closure preflight requires --source-ref working-tree");
  if (options.scenarioIds?.length !== 1 || options.scenarioIds[0] !== ORDINARY_SMALL_CLOSURE_CONFIGURED_SCENARIO_ID) {
    throw error("scenarioIds", `configured ordinary-small-closure requires: ${ORDINARY_SMALL_CLOSURE_CONFIGURED_SCENARIO_ID}`);
  }
  const loaded = loadOrdinarySmallClosureConfiguredPack(options.repoRoot);
  const configDir = path.resolve(options.candidateConfigDir);
  for (const relative of ["AGENTS.md", "opencode.json", "skills/openspec-propose/SKILL.md"]) {
    if (!fs.existsSync(path.join(configDir, relative))) throw error("candidateConfigDir", `configured candidate is missing: ${relative}`);
  }
  const authority = fs.readFileSync(path.join(configDir, "AGENTS.md"), "utf8");
  const proposeSkill = fs.readFileSync(path.join(configDir, "skills/openspec-propose/SKILL.md"), "utf8");
  for (const marker of ["artifactProfile: compact | full", "riskDisposition.kind: ordinary-small-exact | material | unknown"]) {
    if (!authority.includes(marker) || !proposeSkill.includes(marker)) throw error("candidateConfigDir", `configured candidate is missing loaded marker: ${marker}`);
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
    scenarioIds: [ORDINARY_SMALL_CLOSURE_CONFIGURED_SCENARIO_ID],
    status: "ready",
  };
}

export async function captureOrdinarySmallClosureConfigured(options: {
  candidateConfigDir: string;
  candidateId: string;
  evidenceRoot: string;
  executable: string;
  gitRef: string;
  repoRoot: string;
  scenarioId: string;
}): Promise<{ diagnostic: Record<string, unknown>; evaluation: OrdinarySmallClosureConfiguredEvaluation }> {
  if (options.gitRef !== "working-tree") throw error("sourceRef", "configured ordinary-small-closure capture requires --source-ref working-tree");
  if (options.scenarioId !== ORDINARY_SMALL_CLOSURE_CONFIGURED_SCENARIO_ID) throw error("scenarioId", `configured ordinary-small-closure scenario must be: ${ORDINARY_SMALL_CLOSURE_CONFIGURED_SCENARIO_ID}`);
  const loaded = loadOrdinarySmallClosureConfiguredPack(options.repoRoot);
  const sourceIdentity = governedSourceIdentity(options.repoRoot, options.gitRef, loaded.pack.governedSourcePaths);
  const diagnostic = await captureConfiguredDiagnostic(configuredManifest(loaded.pack), loaded.digest, {
    candidateConfigDir: options.candidateConfigDir,
    candidateId: options.candidateId,
    evidenceRoot: options.evidenceRoot,
    executable: options.executable,
    repoRoot: options.repoRoot,
    retainChangedText: true,
    sourceIdentity,
  });
  const evaluation = evaluateOrdinarySmallClosureConfiguredDiagnostic(options.repoRoot, loaded, diagnostic);
  writeNewFile(path.join(options.evidenceRoot, "evaluation.json"), `${JSON.stringify(evaluation, null, 2)}\n`);
  return { diagnostic, evaluation };
}

export function replayOrdinarySmallClosureConfigured(repoRoot: string, diagnosticPath: string, scenarioId: string): OrdinarySmallClosureConfiguredEvaluation {
  if (scenarioId !== ORDINARY_SMALL_CLOSURE_CONFIGURED_SCENARIO_ID) throw error("scenarioId", `configured ordinary-small-closure scenario must be: ${ORDINARY_SMALL_CLOSURE_CONFIGURED_SCENARIO_ID}`);
  return evaluateOrdinarySmallClosureConfiguredDiagnostic(repoRoot, loadOrdinarySmallClosureConfiguredPack(repoRoot), readDiagnostic(diagnosticPath));
}
