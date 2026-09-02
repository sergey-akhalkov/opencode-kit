import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { runPortableCommand } from "../../../global/bin/portable-process.ts";
import { loadModelProfile } from "../../model-profile.ts";
import { materializeRuntimeSurfaceProfile } from "../../runtime-surface-profile.ts";
import {
  assertProofRouteAvailable,
  configuredProofServerEnvironment,
  disabledToolMap,
  installedOpenCodeIdentity,
  proofClient,
  proofErrorFacts,
  proofServerLogs,
  proofServerStartupFacts,
  proofServerStartupFailure,
  runSummarizedProofSession,
  seedProofModelsCatalog,
  startProofServer,
  stopProofServer,
  type ProofRoute,
  type ProofServerHandle,
  type SummarizedProofEvidence,
} from "../lib/opencode-proof-client.ts";
import { removeProofFixture } from "../lib/proof-process-cleanup.ts";
import { materializeConfiguredProofConfig } from "./capture.ts";
import {
  defaultRedactions,
  digestOf,
  fixtureFileList,
  governedSourceIdentity,
  hashFiles,
  posixPath,
  redactText,
  sha256,
  stableJson,
  writeNewFile,
  type SourceIdentity,
} from "./contracts.ts";
import { statusScopeConfiguredRoutes } from "./status-scope.ts";

const FIXTURE_ROOT = "tools/proofs/fixtures/consumer-outcome/delivery-checkpoint-openspec-v1";
const CHANGE_ROOT = "openspec/changes/checkpoint-route";
export const DELIVERY_CHECKPOINT_CONTINUITY_SCENARIO_ID = "configured-openspec-compaction-route";
const SOURCE_PATHS = [
  "global/AGENTS.md",
  "global/opencode.json.template",
  "global/skills/openspec-apply-change",
  "global/model-profiles/quality-independent.json",
  "tools/proofs/consumer-outcome/delivery-checkpoint-continuity.ts",
  "tools/proofs/lib/opencode-proof-client.ts",
  FIXTURE_ROOT,
] as const;
const CHECKPOINT_FIELDS = [
  "Selected Route",
  "Preserved Outcome/Oracle/Population",
  "Next Action",
  "Next Oracle",
  "Suppression Condition",
] as const;

type Checkpoint = {
  checkpointRef: string;
  evidenceRefs: string[];
  nextActionPrefix: string;
  nextOracle: string;
  preservedOutcomeOraclePopulation: string;
  selectedRoute: string;
  suppressionCondition: string;
};

type ContinuityFixture = {
  checkpoint: Checkpoint;
  expectedPlanning: Record<string, string>;
  id: string;
  schemaVersion: 1;
  unchangedPlanningPaths: string[];
};

type CommandEvidence = {
  status: number | null;
  stderr: string;
  stdout: string;
};

type RoundtripEvidence = {
  compactionContext: string;
  error: SummarizedProofEvidence["error"];
  mainResponse: string;
  providerRequestCount: number;
  reconstructionResponse: string;
  sessionCleanup: SummarizedProofEvidence["cleanup"];
  sessionRef: string | null;
  summarizeAccepted: boolean;
  toolCalls: SummarizedProofEvidence["messages"]["toolCalls"];
};

export type DeliveryCheckpointContinuityBundle = {
  bundleDigest: string;
  byteLength: number;
  candidateId: string;
  captureErrorFacts: Array<Record<string, unknown>> | null;
  cleanup: {
    complete: boolean;
    error: string | null;
    fixtureRemoved: boolean;
    processRemoved: boolean;
    sessionsRemoved: boolean;
  };
  environment: {
    configDigest: string;
    installedOpenCode: ReturnType<typeof installedOpenCodeIdentity>;
    node: string;
    platform: NodeJS.Platform;
    routes: { compaction: string; main: string };
  };
  finalCommand: CommandEvidence | null;
  fixtureDigest: string;
  id: string;
  markers: {
    canary: Record<string, unknown> | null;
    precompaction: Record<string, unknown> | null;
  };
  planning: {
    after: Array<{ path: string; sha256: string }>;
    before: Array<{ path: string; sha256: string }>;
    changedPaths: string[];
    observed: Record<string, string>;
  };
  roundtrip: RoundtripEvidence;
  schemaVersion: 1;
  server: {
    signal: NodeJS.Signals | null;
    startup: ReturnType<typeof proofServerStartupFacts>;
    status: number | null;
    stderr: string;
    stdout: string;
  };
  sourceIdentity: SourceIdentity;
  sourceUnchanged: boolean;
};

export type DeliveryCheckpointContinuityEvaluation = {
  bundleDigest: string;
  evaluationDigest: string;
  failures: string[];
  maximumClaim: string;
  modelCalls: number;
  status: "blocked" | "failed" | "passed";
};

function object(value: unknown, label: string): Record<string, unknown> {
  assert(value != null && typeof value === "object" && !Array.isArray(value), `${label} must be an object`);
  return value as Record<string, unknown>;
}

function requiredString(value: unknown, label: string): string {
  assert(typeof value === "string" && value.trim() !== "", `${label} must be a non-empty string`);
  return value;
}

function parseFixture(value: unknown): ContinuityFixture {
  const root = object(value, "delivery checkpoint continuity fixture");
  assert.equal(root.schemaVersion, 1, "continuity fixture schemaVersion must be 1");
  const checkpointValue = object(root.checkpoint, "continuity checkpoint");
  const evidenceRefs = checkpointValue.evidenceRefs;
  assert(Array.isArray(evidenceRefs) && evidenceRefs.length > 0 && evidenceRefs.every((item) => typeof item === "string" && item.trim() !== ""), "checkpoint evidenceRefs must be non-empty strings");
  const expectedPlanningValue = object(root.expectedPlanning, "expected planning");
  const expectedPlanning = Object.fromEntries(Object.entries(expectedPlanningValue).map(([name, contents]) => [name, requiredString(contents, `expectedPlanning.${name}`)]));
  assert.deepEqual(Object.keys(expectedPlanning).sort(), ["design.md", "history.md", "tasks.md"], "expected planning paths must remain exact");
  const unchangedPlanningPaths = root.unchangedPlanningPaths;
  assert(Array.isArray(unchangedPlanningPaths) && unchangedPlanningPaths.length > 0 && unchangedPlanningPaths.every((item) => typeof item === "string" && item.trim() !== ""), "unchanged planning paths must be non-empty strings");
  return {
    checkpoint: {
      checkpointRef: requiredString(checkpointValue.checkpointRef, "checkpointRef"),
      evidenceRefs: [...evidenceRefs as string[]],
      nextActionPrefix: requiredString(checkpointValue.nextActionPrefix, "nextActionPrefix"),
      nextOracle: requiredString(checkpointValue.nextOracle, "nextOracle"),
      preservedOutcomeOraclePopulation: requiredString(checkpointValue.preservedOutcomeOraclePopulation, "preservedOutcomeOraclePopulation"),
      selectedRoute: requiredString(checkpointValue.selectedRoute, "selectedRoute"),
      suppressionCondition: requiredString(checkpointValue.suppressionCondition, "suppressionCondition"),
    },
    expectedPlanning,
    id: requiredString(root.id, "fixture id"),
    schemaVersion: 1,
    unchangedPlanningPaths: [...unchangedPlanningPaths as string[]],
  };
}

export function loadDeliveryCheckpointContinuityFixture(repoRoot: string): { digest: string; fixture: ContinuityFixture } {
  const root = path.join(repoRoot, FIXTURE_ROOT);
  const fixture = parseFixture(JSON.parse(fs.readFileSync(path.join(root, "case.json"), "utf8")));
  assert.equal(fixture.id, DELIVERY_CHECKPOINT_CONTINUITY_SCENARIO_ID, "continuity fixture id drifted from the configured scenario id");
  const files = fixtureFileList(root);
  return { digest: digestOf(hashFiles(root, files)), fixture };
}

function configuredPermission(): Record<string, unknown> {
  return {
    "*": "deny",
    bash: {
      "*": "deny",
      "*&&*": "deny",
      "*;*": "deny",
      "*<*": "deny",
      "*>*": "deny",
      "*|*": "deny",
      "node *": "allow",
      "node.exe *": "allow",
      "openspec *": "allow",
      "openspec.cmd *": "allow",
    },
    edit: "allow",
    external_directory: "deny",
    glob: "allow",
    grep: "allow",
    question: "deny",
    read: "allow",
    skill: { "*": "deny", "openspec-apply-change": "allow" },
    task: "deny",
    webfetch: "deny",
  };
}

function configuredProofRoute(agent: string, route: { model: string; variant: string }): ProofRoute {
  const [providerID, ...modelParts] = route.model.split("/");
  const modelID = modelParts.join("/");
  assert(providerID !== "" && modelID !== "", `Configured continuity route is malformed: ${agent}`);
  return { agent, hidden: agent === "compaction", model: { modelID, providerID }, variant: route.variant };
}

function checkpointState(checkpoint: Checkpoint, nextAction: string): string {
  return [
    "Delivery Checkpoint State",
    `Selected Route: ${checkpoint.selectedRoute}`,
    `Preserved Outcome/Oracle/Population: ${checkpoint.preservedOutcomeOraclePopulation}`,
    `Next Action: ${nextAction}`,
    `Next Oracle: ${checkpoint.nextOracle}`,
    `Suppression Condition: ${checkpoint.suppressionCondition}`,
  ].join("\n");
}

function mainPrompt(fixture: ContinuityFixture): string {
  return [
    "Original user goal: apply the active OpenSpec checkpoint-route change through the next safe boundary.",
    "This is a disposable local fixture. Do not use network, remote operations, delegation, questions, or external paths.",
    "First load the openspec-apply-change skill. Read case.json and the active checkpoint-route artifacts.",
    "Two materially different setup failures repeatedly reached the same costly late validation boundary. Preserve the accepted outcome, oracle, population, and non-deferrable invariants.",
    "Apply the smallest outcome-preserving route correction: replace design.md, tasks.md, and history.md byte-for-byte with the three corresponding expectedPlanning strings in case.json.",
    "Do not modify proposal.md, specs, ownership.json, or any file outside this fixture. Do not mark either task complete and do not run the late validation.",
    "Run node scripts/check-before-compaction.ts. If it fails, stop and report the original failure.",
    "After it passes, read the emitted JSON. Do not run the selected canary yet. Respond with one Delivery Checkpoint State block and no alternative checkpoint or strategy history entry.",
    "Use exactly these field values; replace only `<runtime nextAction>` with the full `nextAction` value emitted by the passing checker:",
    checkpointState(fixture.checkpoint, "<runtime nextAction>"),
  ].join("\n\n");
}

function reconstructionPrompt(): string {
  return [
    "Resume only from the retained compaction summary and the current disposable fixture.",
    "Read the retained Delivery Checkpoint State. If any field is missing, stop and report the missing field without inferring it from this prompt or the fixture.",
    "Do not append history or edit planning again. Execute the retained Next Action exactly, then run node scripts/check-final.ts as a separate command.",
    "Do not run the unchanged late validation. Do not create a Kaizen task, another checkpoint, another history entry, or another Next-Session Action.",
    "Return the JSON stdout from scripts/check-final.ts verbatim and no prose.",
  ].join("\n");
}

function readJsonIfPresent(file: string): Record<string, unknown> | null {
  if (!fs.existsSync(file)) return null;
  return object(JSON.parse(fs.readFileSync(file, "utf8")), path.basename(file));
}

function diffPaths(
  before: Array<{ path: string; sha256: string }>,
  after: Array<{ path: string; sha256: string }>,
): string[] {
  const left = new Map(before.map((item) => [item.path, item.sha256]));
  const right = new Map(after.map((item) => [item.path, item.sha256]));
  return [...new Set([...left.keys(), ...right.keys()])]
    .filter((item) => left.get(item) !== right.get(item))
    .sort((a, b) => a.localeCompare(b));
}

function redactJson<T>(value: T, replacements: Array<[string, string]>): T {
  if (value == null) return value;
  return JSON.parse(redactText(JSON.stringify(value), replacements)) as T;
}

function redactRoundtrip(roundtrip: SummarizedProofEvidence, replacements: Array<[string, string]>): RoundtripEvidence {
  return {
    compactionContext: redactText(roundtrip.compactionContext, replacements),
    error: redactJson(roundtrip.error, replacements),
    mainResponse: redactText(roundtrip.mainResponse, replacements),
    providerRequestCount: roundtrip.providerRequestCount,
    reconstructionResponse: redactText(roundtrip.reconstructionResponse, replacements),
    sessionCleanup: redactJson(roundtrip.cleanup, replacements),
    sessionRef: roundtrip.sessionID == null ? null : digestOf(roundtrip.sessionID).slice(0, 16),
    summarizeAccepted: roundtrip.summarizeAccepted,
    toolCalls: roundtrip.messages.toolCalls,
  };
}

export function sealDeliveryCheckpointContinuityBundle(value: Omit<DeliveryCheckpointContinuityBundle, "bundleDigest" | "byteLength">): DeliveryCheckpointContinuityBundle {
  const bundle: DeliveryCheckpointContinuityBundle = { ...value, bundleDigest: "", byteLength: 0 };
  bundle.bundleDigest = digestOf(bundle);
  bundle.byteLength = Buffer.byteLength(stableJson(bundle), "utf8");
  return bundle;
}

function verifyBundle(bundle: DeliveryCheckpointContinuityBundle, fixtureDigest: string): void {
  const clone = structuredClone(bundle);
  clone.bundleDigest = "";
  clone.byteLength = 0;
  assert.equal(bundle.bundleDigest, digestOf(clone), "delivery checkpoint continuity bundle digest mismatch");
  assert.equal(bundle.fixtureDigest, fixtureDigest, "delivery checkpoint continuity fixture mismatch");
}

function regexEscape(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function evaluateDeliveryCheckpointContinuity(
  fixture: ContinuityFixture,
  fixtureDigest: string,
  bundle: DeliveryCheckpointContinuityBundle,
): DeliveryCheckpointContinuityEvaluation {
  verifyBundle(bundle, fixtureDigest);
  const failures: string[] = [];
  const roundtrip = bundle.roundtrip;
  if (roundtrip.error != null) failures.push("roundtrip-error");
  if (!roundtrip.summarizeAccepted || roundtrip.compactionContext.trim() === "") failures.push("compaction-summary-missing");
  if (roundtrip.providerRequestCount !== 3) failures.push("provider-request-count-mismatch");
  if (!roundtrip.sessionCleanup.sessionsRemoved || roundtrip.sessionCleanup.error != null) failures.push("session-cleanup-incomplete");
  const markerAction = typeof bundle.markers.precompaction?.nextAction === "string" ? bundle.markers.precompaction.nextAction : "";
  const resumeToken = markerAction.startsWith(fixture.checkpoint.nextActionPrefix) ? markerAction.slice(fixture.checkpoint.nextActionPrefix.length) : "";
  if (!/^[a-f0-9]{24}$/.test(resumeToken)) failures.push("precompaction-resume-token-missing");
  const fieldValues: Record<(typeof CHECKPOINT_FIELDS)[number], string> = {
    "Selected Route": fixture.checkpoint.selectedRoute,
    "Preserved Outcome/Oracle/Population": fixture.checkpoint.preservedOutcomeOraclePopulation,
    "Next Action": markerAction,
    "Next Oracle": fixture.checkpoint.nextOracle,
    "Suppression Condition": fixture.checkpoint.suppressionCondition,
  };
  const exactState = checkpointState(fixture.checkpoint, markerAction);
  const mainResponse = typeof roundtrip.mainResponse === "string" ? roundtrip.mainResponse : "";
  if (!mainResponse.includes(exactState)) failures.push("main-response-checkpoint-state-missing");
  for (const field of CHECKPOINT_FIELDS) {
    const retained = new RegExp(`${regexEscape(field)}[^\n]{0,240}${regexEscape(fieldValues[field])}`, "i").test(roundtrip.compactionContext);
    if (!retained) failures.push(`missing-checkpoint-state:${field}`);
  }
  if (roundtrip.compactionContext.includes("Not started; no files or commands have been executed") || roundtrip.compactionContext.includes("Next Action: Load the `openspec-apply-change` skill")) {
    failures.push("compaction-regressed-to-unexecuted-state");
  }
  if (roundtrip.compactionContext.split(fixture.checkpoint.checkpointRef).length - 1 > 3) failures.push("checkpoint-state-duplicated");
  const expectedResponse = bundle.finalCommand?.stdout.trim() ?? "";
  if (expectedResponse === "" || !roundtrip.reconstructionResponse.includes(expectedResponse)) failures.push("continuation-response-mismatch");
  const toolNames = roundtrip.toolCalls.map((item) => item.name);
  for (const required of ["skill", "read", "bash"]) if (!toolNames.includes(required)) failures.push(`missing-tool-call:${required}`);
  if (!toolNames.some((name) => name === "edit" || name === "apply_patch")) failures.push("missing-tool-call:edit");
  for (const forbidden of ["question", "task", "webfetch"]) if (toolNames.includes(forbidden)) failures.push(`forbidden-tool-call:${forbidden}`);
  const expectedChanged = Object.keys(fixture.expectedPlanning).sort((a, b) => a.localeCompare(b));
  if (stableJson(bundle.planning.changedPaths) !== stableJson(expectedChanged)) failures.push("planning-change-set-mismatch");
  if (stableJson(diffPaths(bundle.planning.before, bundle.planning.after)) !== stableJson(bundle.planning.changedPaths)) failures.push("planning-digest-diff-mismatch");
  for (const [relative, expected] of Object.entries(fixture.expectedPlanning)) {
    if (bundle.planning.observed[relative] !== expected) failures.push(`planning-content-mismatch:${relative}`);
  }
  for (const relative of fixture.unchangedPlanningPaths) {
    const before = bundle.planning.before.find((item) => item.path === posixPath(relative));
    const after = bundle.planning.after.find((item) => item.path === posixPath(relative));
    if (before == null || after == null || before.sha256 !== after.sha256) failures.push(`preserved-artifact-mutated:${relative}`);
  }
  if (bundle.markers.precompaction?.status !== "ready-for-compaction") failures.push("precompaction-marker-missing");
  if (bundle.markers.canary?.status !== "passed") failures.push("canary-marker-missing");
  if (bundle.markers.canary?.checkpointRef !== fixture.checkpoint.checkpointRef) failures.push("canary-checkpoint-mismatch");
  if (bundle.markers.canary?.nextAction !== markerAction || bundle.markers.canary?.resumeTokenDigest !== sha256(resumeToken)) failures.push("canary-resume-token-mismatch");
  if (bundle.finalCommand?.status !== 0 || !bundle.finalCommand.stdout.includes('"duplicateHistoryEntries":0')) failures.push("final-check-failed");
  if (!bundle.cleanup.complete) failures.push("cleanup-incomplete");
  if (!bundle.sourceUnchanged) failures.push("governed-source-mutated");
  if (bundle.captureErrorFacts != null) failures.push("capture-error");
  const uniqueFailures = [...new Set(failures)].sort((a, b) => a.localeCompare(b));
  const status = uniqueFailures.includes("cleanup-incomplete") || uniqueFailures.includes("session-cleanup-incomplete")
    ? "blocked"
    : uniqueFailures.length === 0 ? "passed" : "failed";
  const result: DeliveryCheckpointContinuityEvaluation = {
    bundleDigest: bundle.bundleDigest,
    evaluationDigest: "",
    failures: uniqueFailures,
    maximumClaim: "Exact configured OpenSpec route correction, actual compaction retention, and continuation for the reviewed disposable fixture only.",
    modelCalls: roundtrip.providerRequestCount,
    status,
  };
  result.evaluationDigest = digestOf({ ...result, evaluationDigest: "" });
  return result;
}

export function readDeliveryCheckpointContinuityBundle(file: string, fixtureDigest: string): DeliveryCheckpointContinuityBundle {
  const bundle = JSON.parse(fs.readFileSync(file, "utf8")) as DeliveryCheckpointContinuityBundle;
  verifyBundle(bundle, fixtureDigest);
  return bundle;
}

function generatedConfig(repoRoot: string, proofRoot: string): { configDigest: string; configDir: string; routes: ReturnType<typeof statusScopeConfiguredRoutes> } {
  const generatedCore = path.join(proofRoot, "generated-core");
  const configDir = path.join(proofRoot, "candidate-config");
  materializeRuntimeSurfaceProfile({ profileName: "core", root: repoRoot, targetRoot: generatedCore });
  const profile = loadModelProfile(repoRoot, "quality-independent").profile;
  materializeConfiguredProofConfig(generatedCore, configDir, profile, configuredPermission());
  const configDigest = sha256(fs.readFileSync(path.join(configDir, "opencode.json")));
  return { configDigest, configDir, routes: statusScopeConfiguredRoutes(configDir) };
}

export function deliveryCheckpointContinuityPreflight(options: {
  candidateConfigDir?: string;
  executable?: string;
  repoRoot: string;
}): Record<string, unknown> {
  if (options.candidateConfigDir != null) {
    assert.equal(path.resolve(options.candidateConfigDir), path.join(path.resolve(options.repoRoot), "global"), "continuity proof must use the kit global source");
  }
  const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), "delivery-checkpoint-continuity-preflight-"));
  try {
    const loaded = loadDeliveryCheckpointContinuityFixture(options.repoRoot);
    const generated = generatedConfig(options.repoRoot, temporaryRoot);
    const config = object(JSON.parse(fs.readFileSync(path.join(generated.configDir, "opencode.json"), "utf8")), "configured proof config");
    const agents = object(config.agent, "configured proof agents");
    const compaction = object(agents.compaction, "configured compaction agent");
    const prompt = requiredString(compaction.prompt, "configured compaction prompt");
    assert(["Original User Goal", "Goal Status", "Session Reflection", "Next-Session Action"].every((field) => prompt.includes(field)), "configured compaction prompt is missing current summary fields");
    assert(prompt.includes("due or executing outcome-preserving delivery checkpoint has not reached its selected oracle"), "configured compaction prompt is missing the independent due-checkpoint preservation trigger");
    const mainAuthority = fs.readFileSync(path.join(options.repoRoot, "global", "AGENTS.md"), "utf8");
    const normalizedAuthority = mainAuthority.toLowerCase();
    assert(["selected route", "unchanged outcome/oracle/population", "next action", "next oracle", "suppression condition"].every((field) => normalizedAuthority.includes(field)), "loaded main authority is missing Delivery Checkpoint State fields");
    assert(mainAuthority.includes("latest completed assistant actions") && mainAuthority.includes("later observable evidence governs factual status") && mainAuthority.includes("never by itself clears or reclassifies `Live-Attempt Gate`"), "loaded main authority is missing bounded latest-observed-state precedence");
    const applySkill = fs.readFileSync(path.join(generated.configDir, "skills", "openspec-apply-change", "SKILL.md"), "utf8");
    assert(applySkill.includes("Delivery Checkpoint State") && applySkill.includes("history.md"), "configured apply skill is missing checkpoint continuity controls");
    let loadedConfig = false;
    let providerCredentialConfigured: boolean | null = null;
    let modelRoutesListed: boolean | null = null;
    if (options.executable != null) {
      for (const relative of ["cache", "config-home", "data/opencode", "state"]) fs.mkdirSync(path.join(temporaryRoot, relative), { recursive: true });
      seedProofModelsCatalog(temporaryRoot, [generated.routes.main.model, generated.routes.compaction.model]);
      const environment = configuredProofServerEnvironment(process.env, generated.configDir, temporaryRoot, { model: generated.routes.main.model, permission: "deny" });
      const configResult = runPortableCommand(options.repoRoot, [options.executable, "debug", "config"], { capture: true, env: environment, timeoutMs: 60_000 });
      const authResult = runPortableCommand(options.repoRoot, [options.executable, "auth", "list"], { capture: true, env: environment, timeoutMs: 60_000 });
      const modelResult = runPortableCommand(options.repoRoot, [options.executable, "models", "openai"], { capture: true, env: environment, timeoutMs: 60_000 });
      if ([configResult.status, authResult.status, modelResult.status].some((status) => status !== 0)) throw new Error("Delivery checkpoint continuity loaded-config preflight failed");
      loadedConfig = configResult.stdout.includes("Delivery Checkpoint State");
      providerCredentialConfigured = authResult.stdout.includes("OpenAI");
      const listedModels = modelResult.stdout.split(/\r?\n/u).map((line) => line.trim());
      modelRoutesListed = listedModels.includes(generated.routes.main.model) && listedModels.includes(generated.routes.compaction.model);
      assert(loadedConfig && providerCredentialConfigured && modelRoutesListed, "Delivery checkpoint continuity loaded preflight is incomplete");
    }
    return {
      compactionRoute: `${generated.routes.compaction.model}/${generated.routes.compaction.variant}`,
      configDigest: generated.configDigest,
      fixtureDigest: loaded.digest,
      fixtureId: loaded.fixture.id,
      loadedConfig,
      mainRoute: `${generated.routes.main.model}/${generated.routes.main.variant}`,
      modelRoutesListed,
      providerCredentialConfigured,
      stateFieldsPresent: true,
      status: "ready",
    };
  } finally {
    removeProofFixture(temporaryRoot);
  }
}

export async function captureDeliveryCheckpointContinuity(input: {
  candidateConfigDir?: string;
  candidateId: string;
  evidenceRoot: string;
  executable: string;
  gitRef: string;
  repoRoot: string;
}): Promise<{ bundle: DeliveryCheckpointContinuityBundle; evaluation: DeliveryCheckpointContinuityEvaluation }> {
  if (fs.existsSync(input.evidenceRoot)) throw new Error("Delivery checkpoint continuity evidence root must be create-new");
  const preflight = deliveryCheckpointContinuityPreflight(input);
  fs.mkdirSync(input.evidenceRoot, { recursive: true });
  const loaded = loadDeliveryCheckpointContinuityFixture(input.repoRoot);
  const sourceBefore = governedSourceIdentity(input.repoRoot, input.gitRef, [...SOURCE_PATHS]);
  const proofRoot = fs.mkdtempSync(path.join(os.tmpdir(), "delivery-checkpoint-continuity-"));
  const fixtureRoot = path.join(proofRoot, "fixture");
  const redactions = defaultRedactions(proofRoot, input.repoRoot);
  const openCode = installedOpenCodeIdentity(input.executable);
  let server: ProofServerHandle | null = null;
  let terminal: { signal: NodeJS.Signals | null; status: number | null } | null = null;
  let captureError: unknown = null;
  let cleanupError: unknown = null;
  let roundtrip: SummarizedProofEvidence = {
    cleanup: { error: null, sessionsRemoved: true },
    compactionContext: "",
    error: null,
    mainResponse: "",
    messages: { assistant: [], toolCalls: [] },
    providerRequestCount: 0,
    reconstructionResponse: "",
    sessionID: null,
    summarizeAccepted: false,
  };
  let finalCommand: CommandEvidence | null = null;
  let planningBefore: Array<{ path: string; sha256: string }> = [];
  let planningAfter: Array<{ path: string; sha256: string }> = [];
  let changedPaths: string[] = [];
  let observed: Record<string, string> = {};
  let precompaction: Record<string, unknown> | null = null;
  let canary: Record<string, unknown> | null = null;
  let configDigest = requiredString(preflight.configDigest, "preflight configDigest");
  let routes = { compaction: requiredString(preflight.compactionRoute, "preflight compaction route"), main: requiredString(preflight.mainRoute, "preflight main route") };
  try {
    fs.cpSync(path.join(input.repoRoot, FIXTURE_ROOT), fixtureRoot, { recursive: true });
    const changeRoot = path.join(fixtureRoot, CHANGE_ROOT);
    planningBefore = hashFiles(changeRoot, fixtureFileList(changeRoot));
    const generated = generatedConfig(input.repoRoot, proofRoot);
    configDigest = generated.configDigest;
    const main = configuredProofRoute("build", generated.routes.main);
    const compaction = configuredProofRoute("compaction", generated.routes.compaction);
    routes = {
      compaction: `${compaction.model.providerID}/${compaction.model.modelID}/${compaction.variant ?? "default"}`,
      main: `${main.model.providerID}/${main.model.modelID}/${main.variant ?? "default"}`,
    };
    for (const relative of ["cache", "config-home", "data/opencode", "state"]) fs.mkdirSync(path.join(proofRoot, relative), { recursive: true });
    seedProofModelsCatalog(proofRoot, [generated.routes.main.model, generated.routes.compaction.model]);
    const environment = configuredProofServerEnvironment(process.env, generated.configDir, proofRoot, { model: generated.routes.main.model, permission: "deny" });
    server = await startProofServer(input.executable, fixtureRoot, environment);
    const client = proofClient(server.url, fixtureRoot);
    await assertProofRouteAvailable(client, fixtureRoot, main);
    await assertProofRouteAvailable(client, fixtureRoot, compaction);
    const tools = await disabledToolMap(client, fixtureRoot);
    for (const name of ["apply_patch", "bash", "edit", "glob", "grep", "read", "skill"]) if (name in tools) tools[name] = true;
    const precompactionFile = path.join(fixtureRoot, "precompaction-result.json");
    roundtrip = await runSummarizedProofSession({
      afterSummary: () => {
        if (precompaction == null || !fs.existsSync(precompactionFile)) throw new Error("Precompaction runtime marker is unavailable before reconstruction");
        fs.rmSync(precompactionFile);
      },
      beforeSummary: (evidence) => {
        precompaction = readJsonIfPresent(precompactionFile);
        const nextAction = requiredString(precompaction?.nextAction, "precompaction nextAction");
        const resumeToken = requiredString(precompaction?.resumeToken, "precompaction resumeToken");
        assert.equal(nextAction, `${loaded.fixture.checkpoint.nextActionPrefix}${resumeToken}`, "precompaction nextAction and token disagree");
        assert(/^[a-f0-9]{24}$/.test(resumeToken), "precompaction resumeToken is malformed");
        assert(evidence.mainResponse.includes(checkpointState(loaded.fixture.checkpoint, nextAction)), "Main response is missing the dynamic pre-summary checkpoint state");
      },
      client,
      compactionRoute: compaction,
      directory: fixtureRoot,
      mainResponseMustInclude: [
        "Delivery Checkpoint State",
        `Next Action: ${loaded.fixture.checkpoint.nextActionPrefix}`,
        `Next Oracle: ${loaded.fixture.checkpoint.nextOracle}`,
      ],
      mainPrompt: mainPrompt(loaded.fixture),
      mainRoute: main,
      reconstructionPrompt: reconstructionPrompt(),
      timeoutMs: 240_000,
      title: `delivery-checkpoint-continuity-${loaded.fixture.id}`,
      tools,
    });
    planningAfter = hashFiles(changeRoot, fixtureFileList(changeRoot));
    changedPaths = diffPaths(planningBefore, planningAfter);
    observed = Object.fromEntries(Object.keys(loaded.fixture.expectedPlanning).map((relative) => [relative, fs.existsSync(path.join(changeRoot, relative)) ? fs.readFileSync(path.join(changeRoot, relative), "utf8") : ""]));
    canary = readJsonIfPresent(path.join(fixtureRoot, "canary-result.json"));
    const checked = runPortableCommand(fixtureRoot, [process.execPath, "scripts/check-final.ts"], { capture: true, timeoutMs: 30_000 });
    finalCommand = { status: checked.status, stderr: redactText(checked.stderr, redactions), stdout: redactText(checked.stdout, redactions) };
  } catch (error) {
    const startup = proofServerStartupFailure(error);
    if (startup != null) {
      server = startup.server;
      terminal = startup.terminal;
    }
    captureError = error;
  } finally {
    if (server != null && terminal == null) {
      try {
        terminal = await stopProofServer(server);
      } catch (error) {
        cleanupError = error;
      }
    }
    try {
      removeProofFixture(proofRoot);
    } catch (error) {
      cleanupError ??= error;
    }
  }
  const logs = server == null ? { stderr: "", stdout: "" } : proofServerLogs(server);
  const fixtureRemoved = !fs.existsSync(proofRoot);
  const processRemoved = server != null && terminal != null && cleanupError == null;
  const sessionsRemoved = roundtrip.cleanup.sessionsRemoved && roundtrip.cleanup.error == null;
  const sourceAfter = governedSourceIdentity(input.repoRoot, input.gitRef, [...SOURCE_PATHS]);
  const bundle = sealDeliveryCheckpointContinuityBundle({
    candidateId: input.candidateId,
    captureErrorFacts: captureError == null ? null : redactJson(proofErrorFacts(captureError), redactions),
    cleanup: {
      complete: fixtureRemoved && processRemoved && sessionsRemoved,
      error: cleanupError == null ? null : redactText(String(cleanupError), redactions),
      fixtureRemoved,
      processRemoved,
      sessionsRemoved,
    },
    environment: { configDigest, installedOpenCode: openCode, node: process.version, platform: process.platform, routes },
    finalCommand,
    fixtureDigest: loaded.digest,
    id: loaded.fixture.id,
    markers: { canary, precompaction },
    planning: { after: planningAfter, before: planningBefore, changedPaths, observed },
    roundtrip: redactRoundtrip(roundtrip, redactions),
    schemaVersion: 1,
    server: {
      signal: terminal?.signal ?? null,
      startup: proofServerStartupFacts(logs.stdout, logs.stderr, path.join(proofRoot, "candidate-config"), [proofRoot]),
      status: terminal?.status ?? null,
      stderr: redactText(logs.stderr.slice(-32_768), redactions),
      stdout: redactText(logs.stdout.slice(-32_768), redactions),
    },
    sourceIdentity: sourceBefore,
    sourceUnchanged: sourceBefore.governedDigest === sourceAfter.governedDigest,
  });
  const evaluation = evaluateDeliveryCheckpointContinuity(loaded.fixture, loaded.digest, bundle);
  writeNewFile(path.join(input.evidenceRoot, "bundle.json"), `${JSON.stringify(bundle, null, 2)}\n`);
  writeNewFile(path.join(input.evidenceRoot, "evaluation.json"), `${JSON.stringify(evaluation, null, 2)}\n`);
  return { bundle, evaluation };
}

export function replayDeliveryCheckpointContinuity(repoRoot: string, bundlePath: string): {
  bundle: DeliveryCheckpointContinuityBundle;
  evaluation: DeliveryCheckpointContinuityEvaluation;
} {
  const loaded = loadDeliveryCheckpointContinuityFixture(repoRoot);
  const bundle = readDeliveryCheckpointContinuityBundle(bundlePath, loaded.digest);
  return { bundle, evaluation: evaluateDeliveryCheckpointContinuity(loaded.fixture, loaded.digest, bundle) };
}
