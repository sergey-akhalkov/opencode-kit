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
  proofServerStartupFailure,
  proofServerStartupFacts,
  runSummarizedProofSession,
  seedProofModelsCatalog,
  startProofServer,
  stopProofServer,
  type ProofRoute,
  type ProofServerHandle,
  type SummarizedProofEvidence,
} from "../lib/opencode-proof-client.ts";
import { removeProofFixture } from "../lib/proof-process-cleanup.ts";
import {
  defaultRedactions,
  digestOf,
  governedSourceIdentity,
  redactText,
  stableJson,
  writeNewFile,
  type SourceIdentity,
} from "./contracts.ts";

const FIXTURE_PATH = "tools/proofs/fixtures/consumer-outcome/team-advice-continuity-r1.json";
const SOURCE_PATHS = [
  "global/AGENTS.md",
  "global/opencode.json.template",
  "global/model-profiles/quality-independent.json",
  "profiles/core.json",
  "tools/runtime-surface-profile.ts",
  "tools/proofs/consumer-outcome-regression.ts",
  "tools/proofs/consumer-outcome/team-advice-continuity.ts",
  FIXTURE_PATH,
] as const;
const FIELDS = [
  "Advisor Task Ref",
  "Candidate Ref",
  "Catalog Ref",
  "Main Disposition",
  "Active Work Packages",
  "Terminal Work Packages",
  "Pending Activation Evidence",
  "Specialist Liveness",
  "Integration State",
  "Unavailable Material Capabilities",
  "Reconsultation Condition",
] as const;

type ContinuityCase = {
  catalogNoise: string[];
  currentFacts: { candidateRef: string; catalogChanged: boolean; catalogRef: string; continuityEvents: string[] };
  expected: { reconsult: boolean; stalePackages: string[]; terminalPackages: string[] };
  id: "changed-catalog" | "unchanged-engagement";
  initialState: Record<(typeof FIELDS)[number], string>;
};

export type TeamAdviceContinuityFixture = {
  cases: ContinuityCase[];
  configuredProviderRequestBound: 6;
  fields: string[];
  id: "team-advice-continuity-r1";
  maximumClaim: string;
  schemaVersion: 1;
};

export type TeamAdviceContinuitySample = {
  caseId: ContinuityCase["id"];
  compactionContext: string;
  error: SummarizedProofEvidence["error"];
  providerRequestCount: number;
  reconstructionResponse: string;
  sessionCleanup: SummarizedProofEvidence["cleanup"];
  sessionRef: string | null;
  summarizeAccepted: boolean;
  toolCalls: SummarizedProofEvidence["messages"]["toolCalls"];
};

export type TeamAdviceContinuityBundle = {
  bundleDigest: string;
  byteLength: number;
  candidateId: string;
  captureErrorFacts: Array<Record<string, unknown>> | null;
  cleanup: { complete: boolean; error: string | null; fixtureRemoved: boolean; processRemoved: boolean; sessionsRemoved: boolean };
  environment: {
    installedOpenCode: { sha256: string; version: string };
    model: string;
    node: string;
    platform: string;
    profile: "quality-independent";
    runtimeProfile: "core";
    variant: string;
  };
  fixtureDigest: string;
  kind: "team-advice-continuity";
  routes: { compaction: string; main: string };
  samples: TeamAdviceContinuitySample[];
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

export type TeamAdviceContinuityEvaluation = {
  bundleDigest: string;
  evaluationDigest: string;
  maximumClaim: string;
  modelCalls: number;
  rows: Array<{ caseId: string; failures: string[]; passed: boolean }>;
  status: "blocked" | "failed" | "passed";
};

function object(value: unknown, label: string): Record<string, unknown> {
  assert(value != null && typeof value === "object" && !Array.isArray(value), `${label} must be an object`);
  return value as Record<string, unknown>;
}

function strings(value: unknown, label: string): string[] {
  assert(Array.isArray(value) && value.every((item) => typeof item === "string" && item.trim() !== ""), `${label} must contain non-empty strings`);
  return value;
}

export function loadTeamAdviceContinuityFixture(repoRoot: string): { digest: string; fixture: TeamAdviceContinuityFixture } {
  const source = object(JSON.parse(fs.readFileSync(path.join(repoRoot, FIXTURE_PATH), "utf8")), "continuity fixture");
  assert.equal(source.schemaVersion, 1);
  assert.equal(source.id, "team-advice-continuity-r1");
  assert.equal(source.configuredProviderRequestBound, 6);
  assert.deepEqual(strings(source.fields, "continuity fields"), FIELDS);
  const rawCases = source.cases;
  assert(Array.isArray(rawCases) && rawCases.length === 2, "continuity fixture must contain two cases");
  const cases = rawCases.map((raw, index): ContinuityCase => {
    const row = object(raw, `continuity case ${index}`);
    assert(row.id === "unchanged-engagement" || row.id === "changed-catalog", "continuity case id is invalid");
    const initial = object(row.initialState, `${row.id}.initialState`);
    assert.deepEqual(Object.keys(initial), FIELDS);
    const initialState = Object.fromEntries(FIELDS.map((field) => {
      const value = initial[field];
      assert(typeof value === "string" && value.trim() !== "", `${row.id}.${field} must be a non-empty string`);
      return [field, value];
    })) as ContinuityCase["initialState"];
    const current = object(row.currentFacts, `${row.id}.currentFacts`);
    const expected = object(row.expected, `${row.id}.expected`);
    assert(typeof current.candidateRef === "string" && typeof current.catalogRef === "string" && typeof current.catalogChanged === "boolean");
    const continuityEvents = strings(current.continuityEvents, `${row.id}.currentFacts.continuityEvents`);
    assert(typeof expected.reconsult === "boolean");
    return {
      catalogNoise: strings(row.catalogNoise, `${row.id}.catalogNoise`),
      currentFacts: { candidateRef: current.candidateRef, catalogChanged: current.catalogChanged, catalogRef: current.catalogRef, continuityEvents },
      expected: {
        reconsult: expected.reconsult,
        stalePackages: strings(expected.stalePackages, `${row.id}.expected.stalePackages`),
        terminalPackages: strings(expected.terminalPackages, `${row.id}.expected.terminalPackages`),
      },
      id: row.id,
      initialState,
    };
  });
  assert.deepEqual(cases.map((item) => item.id), ["unchanged-engagement", "changed-catalog"]);
  assert(typeof source.maximumClaim === "string" && source.maximumClaim.trim() !== "");
  const fixture: TeamAdviceContinuityFixture = {
    cases,
    configuredProviderRequestBound: 6,
    fields: [...FIELDS],
    id: "team-advice-continuity-r1",
    maximumClaim: source.maximumClaim,
    schemaVersion: 1,
  };
  return { digest: digestOf(fixture), fixture };
}

function mainPrompt(input: ContinuityCase): string {
  const state = FIELDS.map((field) => `${field}: ${input.initialState[field]}`).join("\n");
  return [
    "Original user goal: resume the existing bounded integration mission from its current engagement checkpoint.",
    "A current team recommendation exists. Treat the following as authoritative current state and acknowledge the checkpoint without calling tools or selecting a new team:",
    state,
    "",
    `Full Catalog Snapshot (context only; compaction must not retain it): ${input.catalogNoise.join(", ")}`,
    "Respond only that the checkpoint is recorded and no work should be continued before compaction.",
  ].join("\n");
}

function reconstructionPrompt(input: ContinuityCase): string {
  return [
    "Resume from the retained compaction summary. Do not call tools, dispatch, or continue implementation.",
    `Current candidate verification: ${input.currentFacts.candidateRef}.`,
    `Current catalog verification: ${input.currentFacts.catalogRef}.`,
    `Catalog identity changed since the retained summary: ${input.currentFacts.catalogChanged}.`,
    `Observed continuation events: ${input.currentFacts.continuityEvents.join(", ")}.`,
    "Compaction, propose-to-apply transition, package completion, and ordinary progress are not reconsultation triggers by themselves.",
    "Only a pending catalog-dependent recommendation may become stale. Terminal evidence remains attributed to its original candidate/catalog.",
    "Return one JSON object only with exactly these keys: caseId, candidateRef, catalogRef, reconsult, stalePackages, terminalPackages.",
    `caseId must be ${input.id}. Use only facts retained in the summary and the current verification above.`,
  ].join("\n");
}

function proofRoute(agent: string, route: { model: string; variant: string }): ProofRoute {
  const [providerID, ...modelParts] = route.model.split("/");
  const modelID = modelParts.join("/");
  assert(providerID !== "" && modelID !== "", `Configured continuity route is malformed: ${agent}`);
  return { agent, hidden: agent === "compaction", model: { modelID, providerID }, variant: route.variant };
}

function configuredRoutes(repoRoot: string, configDir: string): { compaction: { model: string; variant: string }; main: { model: string; variant: string } } {
  const profile = loadModelProfile(repoRoot, "quality-independent").profile;
  const config = object(JSON.parse(fs.readFileSync(path.join(configDir, "opencode.json"), "utf8")), "generated core config");
  const agents = object(config.agent, "generated core agents");
  const compaction = object(agents.compaction, "generated compaction agent");
  assert(typeof compaction.model === "string" && compaction.model.trim() !== "", "generated compaction model is missing");
  assert(typeof compaction.variant === "string" && compaction.variant.trim() !== "", "generated compaction variant is missing");
  return {
    compaction: { model: compaction.model, variant: compaction.variant },
    main: { model: profile.agent.build.model, variant: profile.agent.build.variant },
  };
}

export function teamAdviceContinuityPreflight(repoRoot: string, executable?: string): {
  cleanupObserverEncoding: "empty-success" | "json" | null;
  cleanupObserverReady: boolean | null;
  compactionRoute: string;
  fixtureDigest: string;
  loadedConfig: boolean;
  mainRoute: string;
  modelRoutesListed: boolean | null;
  providerCredentialConfigured: boolean | null;
  stateFieldsPresent: boolean;
  status: "ready";
  temporaryRootRemoved: boolean;
} {
  const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), "team-advice-continuity-preflight-"));
  try {
    const configDir = path.join(temporaryRoot, "generated-core");
    materializeRuntimeSurfaceProfile({ profileName: "core", root: repoRoot, targetRoot: configDir });
    const routes = configuredRoutes(repoRoot, configDir);
    const config = object(JSON.parse(fs.readFileSync(path.join(configDir, "opencode.json"), "utf8")), "generated core config");
    const agents = object(config.agent, "generated core agents");
    const compaction = object(agents.compaction, "generated compaction agent");
    const prompt = typeof compaction.prompt === "string" ? compaction.prompt : "";
    const loaded = loadTeamAdviceContinuityFixture(repoRoot);
    assert(["Original User Goal", "Goal Status", "Session Reflection", "Next-Session Action"].every((field) => prompt.includes(field)), "generated compaction prompt is missing current summary fields");
    assert(FIELDS.every((field) => prompt.includes(field)), "generated compaction prompt is missing a Team Advice state field");
    assert(prompt.includes("copy exactly these supplied labels and values verbatim") && prompt.includes("Never merge, rename, summarize, or omit any of them"), "generated compaction prompt is missing exact Team Advice preservation");
    const mainAuthority = fs.readFileSync(path.join(repoRoot, "global", "AGENTS.md"), "utf8");
    assert(FIELDS.every((field) => mainAuthority.includes(field)), "loaded main authority is missing a Team Advice State field");
    let cleanupObserverReady: boolean | null = null;
    let cleanupObserverEncoding: "empty-success" | "json" | null = null;
    let loadedConfig = false;
    let modelRoutesListed: boolean | null = null;
    let providerCredentialConfigured: boolean | null = null;
    if (executable != null) {
      for (const relative of ["cache", "config-home", "data/opencode", "state"]) fs.mkdirSync(path.join(temporaryRoot, relative), { recursive: true });
      seedProofModelsCatalog(temporaryRoot, [routes.main.model, routes.compaction.model]);
      const environment = configuredProofServerEnvironment(process.env, configDir, temporaryRoot, { model: routes.main.model, permission: "deny" });
      const configResult = runPortableCommand(repoRoot, [executable, "debug", "config"], { capture: true, env: environment, timeoutMs: 60_000 });
      const authResult = runPortableCommand(repoRoot, [executable, "auth", "list"], { capture: true, env: environment, timeoutMs: 60_000 });
      const modelResult = runPortableCommand(repoRoot, [executable, "models", "openai"], { capture: true, env: environment, timeoutMs: 60_000 });
      const sessionResult = runPortableCommand(repoRoot, [executable, "session", "list", "--format", "json", "--pure"], { capture: true, env: environment, timeoutMs: 60_000 });
      const statuses = [configResult.status, authResult.status, modelResult.status, sessionResult.status];
      if (statuses.some((status) => status !== 0)) throw new Error(`Team advice continuity loaded-config preflight failed: ${statuses.join(",")}`);
      let parsedConfig: unknown;
      let parsedSessions: unknown;
      try {
        parsedConfig = JSON.parse(configResult.stdout);
      } catch {
        throw new Error(`Team advice continuity loaded config returned invalid JSON (${configResult.stdout.length} bytes).`);
      }
      if (sessionResult.stdout.trim() === "" && sessionResult.stderr.trim() === "") {
        parsedSessions = [];
        cleanupObserverEncoding = "empty-success";
      } else {
        try {
          parsedSessions = JSON.parse(sessionResult.stdout);
          cleanupObserverEncoding = "json";
        } catch {
          throw new Error(`Team advice continuity session observer returned invalid JSON (${sessionResult.stdout.length} bytes).`);
        }
      }
      const debugConfig = object(parsedConfig, "loaded core config");
      const debugAgents = object(debugConfig.agent, "loaded core agents");
      const debugCompaction = object(debugAgents.compaction, "loaded compaction agent");
      assert.equal(debugCompaction.model, compaction.model, "loaded compaction model drifted from generated core");
      assert.equal(debugCompaction.variant, compaction.variant, "loaded compaction variant drifted from generated core");
      const listedModels = modelResult.stdout.split(/\r?\n/u).map((line) => line.trim());
      modelRoutesListed = listedModels.includes(routes.main.model) && listedModels.includes(routes.compaction.model);
      providerCredentialConfigured = authResult.stdout.includes("OpenAI");
      cleanupObserverReady = Array.isArray(parsedSessions) && parsedSessions.length === 0;
      assert.equal(modelRoutesListed, true, "continuity proof model routes are unavailable");
      assert.equal(providerCredentialConfigured, true, "continuity proof provider identity is unavailable");
      assert.equal(cleanupObserverReady, true, "continuity cleanup observer is not empty");
      loadedConfig = true;
    }
    return {
      cleanupObserverEncoding,
      cleanupObserverReady,
      compactionRoute: `${routes.compaction.model}/${routes.compaction.variant}`,
      fixtureDigest: loaded.digest,
      loadedConfig,
      mainRoute: `${routes.main.model}/${routes.main.variant}`,
      modelRoutesListed,
      providerCredentialConfigured,
      stateFieldsPresent: true,
      status: "ready",
      temporaryRootRemoved: true,
    };
  } finally {
    removeProofFixture(temporaryRoot);
  }
}

function redactJson<T>(value: T, replacements: Array<[string, string]>): T {
  if (value == null) return value;
  return JSON.parse(redactText(JSON.stringify(value), replacements)) as T;
}

function redactRoundtrip(roundtrip: SummarizedProofEvidence, replacements: Array<[string, string]>): TeamAdviceContinuitySample {
  return {
    caseId: "unchanged-engagement",
    compactionContext: redactText(roundtrip.compactionContext, replacements),
    error: redactJson(roundtrip.error, replacements),
    providerRequestCount: roundtrip.providerRequestCount,
    reconstructionResponse: redactText(roundtrip.reconstructionResponse, replacements),
    sessionCleanup: redactJson(roundtrip.cleanup, replacements),
    sessionRef: roundtrip.sessionID == null ? null : digestOf(roundtrip.sessionID).slice(0, 16),
    summarizeAccepted: roundtrip.summarizeAccepted,
    toolCalls: roundtrip.messages.toolCalls,
  };
}

export function sealTeamAdviceContinuityBundle(value: Omit<TeamAdviceContinuityBundle, "bundleDigest" | "byteLength">): TeamAdviceContinuityBundle {
  const bundle: TeamAdviceContinuityBundle = { ...value, bundleDigest: "", byteLength: 0 };
  bundle.bundleDigest = digestOf(bundle);
  bundle.byteLength = Buffer.byteLength(stableJson(bundle), "utf8");
  return bundle;
}

function verifyBundle(bundle: TeamAdviceContinuityBundle, fixtureDigest: string): void {
  const clone = structuredClone(bundle);
  clone.bundleDigest = "";
  clone.byteLength = 0;
  assert.equal(bundle.bundleDigest, digestOf(clone), "Team advice continuity bundle digest mismatch");
  assert.equal(bundle.fixtureDigest, fixtureDigest, "Team advice continuity fixture mismatch");
}

function responseObject(text: string): Record<string, unknown> | null {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  try {
    return object(JSON.parse(text.slice(start, end + 1)), "continuity reconstruction");
  } catch {
    return null;
  }
}

function regexEscape(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function packageIds(value: unknown): string[] | null {
  if (!Array.isArray(value) || !value.every((item) => typeof item === "string" && item.trim() !== "")) return null;
  return value.map((item) => item.split(":", 1)[0]!).sort((left, right) => left.localeCompare(right));
}

export function evaluateTeamAdviceContinuity(
  fixture: TeamAdviceContinuityFixture,
  fixtureDigest: string,
  bundle: TeamAdviceContinuityBundle,
): TeamAdviceContinuityEvaluation {
  verifyBundle(bundle, fixtureDigest);
  const rows = fixture.cases.map((control) => {
    const sample = bundle.samples.find((item) => item.caseId === control.id);
    const failures: string[] = [];
    if (sample == null) return { caseId: control.id, failures: ["missing-sample"], passed: false };
    if (sample.error != null) failures.push("roundtrip-error");
    if (!sample.summarizeAccepted || sample.compactionContext.trim() === "") failures.push("compaction-summary-missing");
    if (sample.providerRequestCount !== 3) failures.push("provider-request-count-mismatch");
    if (sample.toolCalls.length !== 0) failures.push("unexpected-tool-call");
    if (!sample.sessionCleanup.sessionsRemoved || sample.sessionCleanup.error != null) failures.push("session-cleanup-incomplete");
    for (const field of FIELDS) {
      const value = control.initialState[field];
      const retained = new RegExp(`${regexEscape(field)}[^\\n]{0,240}${regexEscape(value)}`, "i").test(sample.compactionContext);
      if (!retained) failures.push(`missing-state:${field}`);
    }
    if (sample.compactionContext.includes("Full Catalog Snapshot") || control.catalogNoise.some((id) => sample.compactionContext.includes(id))) {
      failures.push("catalog-replayed-in-summary");
    }
    const response = responseObject(sample.reconstructionResponse);
    if (response == null) failures.push("reconstruction-json-invalid");
    else {
      const expectedKeys = ["candidateRef", "caseId", "catalogRef", "reconsult", "stalePackages", "terminalPackages"];
      if (stableJson(Object.keys(response).sort()) !== stableJson(expectedKeys)) failures.push("reconstruction-schema-mismatch");
      if (response.caseId !== control.id || response.candidateRef !== control.currentFacts.candidateRef || response.catalogRef !== control.currentFacts.catalogRef) failures.push("reconstruction-identity-mismatch");
      if (response.reconsult !== control.expected.reconsult) failures.push("reconsultation-disposition-mismatch");
      if (stableJson(packageIds(response.stalePackages)) !== stableJson(packageIds(control.expected.stalePackages))) failures.push("stale-package-mismatch");
      if (stableJson(packageIds(response.terminalPackages)) !== stableJson(packageIds(control.expected.terminalPackages))) failures.push("terminal-evidence-mismatch");
    }
    return { caseId: control.id, failures: [...new Set(failures)].sort(), passed: failures.length === 0 };
  });
  if (!bundle.cleanup.complete || !bundle.sourceUnchanged) rows.push({ caseId: "capture-envelope", failures: [!bundle.cleanup.complete ? "cleanup-incomplete" : "governed-source-mutated"], passed: false });
  const status = rows.some((row) => row.failures.includes("cleanup-incomplete")) ? "blocked" : rows.every((row) => row.passed) ? "passed" : "failed";
  const result: TeamAdviceContinuityEvaluation = {
    bundleDigest: bundle.bundleDigest,
    evaluationDigest: "",
    maximumClaim: fixture.maximumClaim,
    modelCalls: bundle.samples.reduce((sum, sample) => sum + sample.providerRequestCount, 0),
    rows,
    status,
  };
  result.evaluationDigest = digestOf({ ...result, evaluationDigest: "" });
  return result;
}

export function readTeamAdviceContinuityBundle(file: string, fixtureDigest: string): TeamAdviceContinuityBundle {
  const bundle = JSON.parse(fs.readFileSync(file, "utf8")) as TeamAdviceContinuityBundle;
  verifyBundle(bundle, fixtureDigest);
  return bundle;
}

export async function captureTeamAdviceContinuity(input: {
  candidateId: string;
  evidenceRoot: string;
  executable: string;
  gitRef: string;
  repoRoot: string;
}): Promise<{ bundle: TeamAdviceContinuityBundle; evaluation: TeamAdviceContinuityEvaluation }> {
  if (fs.existsSync(input.evidenceRoot)) throw new Error("Team advice continuity evidence root must be create-new");
  const localPreflight = teamAdviceContinuityPreflight(input.repoRoot, input.executable);
  fs.mkdirSync(input.evidenceRoot, { recursive: true });
  const loaded = loadTeamAdviceContinuityFixture(input.repoRoot);
  const sourceBefore = governedSourceIdentity(input.repoRoot, input.gitRef, [...SOURCE_PATHS]);
  const proofRoot = fs.mkdtempSync(path.join(os.tmpdir(), "team-advice-continuity-"));
  const configDir = path.join(proofRoot, "generated-core");
  const fixtureRoot = path.join(proofRoot, "fixture");
  fs.mkdirSync(fixtureRoot, { recursive: true });
  const redactions = defaultRedactions(proofRoot, input.repoRoot);
  const openCode = installedOpenCodeIdentity(input.executable);
  const samples: TeamAdviceContinuitySample[] = [];
  let server: ProofServerHandle | null = null;
  let terminal: { signal: NodeJS.Signals | null; status: number | null } | null = null;
  let captureError: unknown = null;
  let cleanupError: unknown = null;
  let sessionAttempted = false;
  let routes = { compaction: localPreflight.compactionRoute, main: localPreflight.mainRoute };
  try {
    materializeRuntimeSurfaceProfile({ profileName: "core", root: input.repoRoot, targetRoot: configDir });
    for (const relative of ["cache", "config-home", "data/opencode", "state"]) fs.mkdirSync(path.join(proofRoot, relative), { recursive: true });
    const selectedRoutes = configuredRoutes(input.repoRoot, configDir);
    seedProofModelsCatalog(proofRoot, [selectedRoutes.main.model, selectedRoutes.compaction.model]);
    const environment = configuredProofServerEnvironment(process.env, configDir, proofRoot, { model: selectedRoutes.main.model, permission: "deny" });
    server = await startProofServer(input.executable, fixtureRoot, environment);
    const client = proofClient(server.url, fixtureRoot);
    const main = proofRoute("build", selectedRoutes.main);
    const compaction = proofRoute("compaction", selectedRoutes.compaction);
    routes = {
      compaction: `${compaction.model.providerID}/${compaction.model.modelID}/${compaction.variant ?? "default"}`,
      main: `${main.model.providerID}/${main.model.modelID}/${main.variant ?? "default"}`,
    };
    assert.equal(routes.main, `${selectedRoutes.main.model}/${selectedRoutes.main.variant}`);
    assert.equal(routes.compaction, `${selectedRoutes.compaction.model}/${selectedRoutes.compaction.variant}`);
    await assertProofRouteAvailable(client, fixtureRoot, main);
    await assertProofRouteAvailable(client, fixtureRoot, compaction);
    const tools = await disabledToolMap(client, fixtureRoot);
    for (const control of loaded.fixture.cases) {
      sessionAttempted = true;
      const roundtrip = await runSummarizedProofSession({
        client,
        compactionRoute: compaction,
        directory: fixtureRoot,
        mainPrompt: mainPrompt(control),
        mainRoute: main,
        reconstructionPrompt: reconstructionPrompt(control),
        title: `team-advice-continuity-${control.id}`,
        tools,
      });
      const sample = redactRoundtrip(roundtrip, redactions);
      sample.caseId = control.id;
      samples.push(sample);
      if (roundtrip.error != null || !roundtrip.cleanup.sessionsRemoved) break;
    }
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
  const sessionsRemoved = !sessionAttempted || samples.length > 0 && samples.every((sample) => sample.sessionCleanup.sessionsRemoved && sample.sessionCleanup.error == null);
  const cleanupComplete = fixtureRemoved && processRemoved && sessionsRemoved;
  const sourceAfter = governedSourceIdentity(input.repoRoot, input.gitRef, [...SOURCE_PATHS]);
  const bundle = sealTeamAdviceContinuityBundle({
    candidateId: input.candidateId,
    captureErrorFacts: captureError == null ? null : redactJson(proofErrorFacts(captureError), redactions),
    cleanup: {
      complete: cleanupComplete,
      error: cleanupError == null ? null : redactText(String(cleanupError), redactions),
      fixtureRemoved,
      processRemoved,
      sessionsRemoved,
    },
    environment: {
      installedOpenCode: openCode,
      model: routes.main.split("/").slice(0, -1).join("/"),
      node: process.version,
      platform: process.platform,
      profile: "quality-independent",
      runtimeProfile: "core",
      variant: routes.main.split("/").at(-1)!,
    },
    fixtureDigest: loaded.digest,
    kind: "team-advice-continuity",
    routes,
    samples,
    schemaVersion: 1,
    server: {
      signal: terminal?.signal ?? null,
      startup: proofServerStartupFacts(logs.stdout, logs.stderr, configDir, [proofRoot]),
      status: terminal?.status ?? null,
      stderr: redactText(logs.stderr.slice(-32_768), redactions),
      stdout: redactText(logs.stdout.slice(-32_768), redactions),
    },
    sourceIdentity: sourceBefore,
    sourceUnchanged: sourceBefore.governedDigest === sourceAfter.governedDigest,
  });
  const evaluation = evaluateTeamAdviceContinuity(loaded.fixture, loaded.digest, bundle);
  writeNewFile(path.join(input.evidenceRoot, "bundle.json"), `${JSON.stringify(bundle, null, 2)}\n`);
  writeNewFile(path.join(input.evidenceRoot, "evaluation.json"), `${JSON.stringify(evaluation, null, 2)}\n`);
  return { bundle, evaluation };
}
