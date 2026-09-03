import fs from "node:fs";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import { type PortableCommandResult, runPortableCommand } from "../../../global/bin/portable-process.ts";
import { loadModelProfile, type ModelProfile } from "../../model-profile.ts";
import {
  type DiagnosticProofEvidence,
  type ProofRoute,
  type ProofServerHandle,
  assertProofRouteAvailable,
  configuredProofServerEnvironment,
  createRoutedProofSessions,
  installedOpenCodeIdentity,
  proofClient,
  proofErrorFacts,
  proofServerLogs,
  proofServerStartupFacts,
  proofServerStartupFailure,
  requestData,
  runDiagnosticProofSession,
  seedProofModelsCatalog,
  startProofServer,
  stopProofServer,
  waitForProofRoute,
} from "../lib/opencode-proof-client.ts";
import { removeProofFixture } from "../lib/proof-process-cleanup.ts";
import {
  type Arm,
  type CaptureBundle,
  type EnvironmentIdentity,
  type FrictionVector,
  type RegressionManifest,
  type SampleEvidence,
  type SourceIdentity,
  type ToolCallFact,
  CAPTURE_BYTE_LIMIT,
  COMPLEXITY_CONFIGURED_SESSION_MEMBER_ORDER,
  ContractError,
  SAMPLE_BYTE_LIMIT,
  SCHEMA_VERSION,
  argumentDigest,
  assertContained,
  assertPrivacySafe,
  bundleByteLength,
  defaultRedactions,
  digestOf,
  evaluatorDigest,
  hashFiles,
  osClass,
  redactPrivacyMarkers,
  redactText,
  sha256,
  stableJson,
  writeNewFile,
} from "./contracts.ts";
import {
  parseProspectiveConsequenceObservation,
  sealProspectiveConsequenceRehearsalLane,
  type ProspectiveConsequenceObservation,
  type ProspectiveConsequenceRehearsalLane,
  type ProspectiveConsequenceRehearsalPack,
  type ProspectiveConsequenceScenario,
} from "./prospective-consequence-rehearsal.ts";

export type CaptureFailureKind = "none" | "model" | "tool" | "validation" | "evidence" | "timeout" | "cleanup";
export type SessionMode = "harness" | "configured";
export const FOUNDATION_SERVER_PROMPT_TIMEOUT_MS = 420_000;

function relocateConfiguredRoot(value: unknown, sourceRoot: string, targetRoot: string): unknown {
  if (typeof value === "string") {
    return value
      .replaceAll(sourceRoot, targetRoot)
      .replaceAll(sourceRoot.replaceAll("\\", "/"), targetRoot.replaceAll("\\", "/"));
  }
  if (Array.isArray(value)) return value.map((item) => relocateConfiguredRoot(item, sourceRoot, targetRoot));
  if (typeof value === "object" && value != null) {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, relocateConfiguredRoot(item, sourceRoot, targetRoot)]));
  }
  return value;
}

export function materializeConfiguredProofConfig(
  sourceRoot: string,
  targetRoot: string,
  profile: ModelProfile,
  permission: Record<string, unknown>,
): string {
  const source = path.resolve(sourceRoot);
  const target = path.resolve(targetRoot);
  if (!fs.existsSync(path.join(source, "opencode.json"))) throw new ContractError("candidateConfigDir", "candidate opencode.json is unavailable");
  if (fs.existsSync(target)) throw new ContractError("candidateConfigDir", "effective candidate config must be create-new");
  const build = profile.agent.build;
  if (build == null) throw new ContractError("modelProfile", "configured model profile has no build route");
  fs.cpSync(source, target, { errorOnExist: true, force: false, recursive: true });
  const configPath = path.join(target, "opencode.json");
  const relocated = relocateConfiguredRoot(JSON.parse(fs.readFileSync(configPath, "utf8")), source, target);
  if (typeof relocated !== "object" || relocated == null || Array.isArray(relocated)) {
    throw new ContractError("candidateConfigDir", "candidate opencode.json must be an object");
  }
  const config = relocated as Record<string, unknown>;
  const currentAgent = typeof config.agent === "object" && config.agent != null && !Array.isArray(config.agent)
    ? config.agent as Record<string, unknown>
    : {};
  fs.writeFileSync(configPath, stableJson({
    ...config,
    agent: { ...currentAgent, build },
    model: profile.model,
    permission,
    small_model: profile.small_model,
  }));
  return target;
}

const CONFIGURED_PERMISSION = {
  "*": "deny",
  bash: "deny",
  edit: "deny",
  external_directory: "deny",
  glob: "deny",
  grep: "deny",
  question: "deny",
  read: "deny",
  skill: "deny",
  task: "deny",
  webfetch: "deny",
} as const;

function configuredPermission(scenario: { id: string; permissions: { allow: string[] } }): Record<string, unknown> {
  const permission: Record<string, unknown> = { ...CONFIGURED_PERMISSION };
  const taskAgents: string[] = [];
  const skills: string[] = [];
  for (const entry of scenario.permissions.allow) {
    if (entry === "bash") {
      permission.bash = { "*": "deny", "node *": "allow", "node.exe *": "allow", "*;*": "deny", "*&&*": "deny", "*|*": "deny", "*>*": "deny", "*<*": "deny" };
    } else if (entry === "edit" || entry === "glob" || entry === "grep" || entry === "read" || entry === "webfetch") {
      permission[entry] = "allow";
    } else if (entry.startsWith("task:")) {
      taskAgents.push(entry.slice("task:".length));
    } else if (entry.startsWith("skill:")) {
      skills.push(entry.slice("skill:".length));
    } else {
      throw new ContractError(`${scenario.id}.permissions.allow`, `unsupported configured permission: ${entry}`);
    }
  }
  if (taskAgents.length > 0) permission.task = Object.fromEntries([["*", "deny"], ...taskAgents.map((agent) => [agent, "allow"])]);
  if (skills.length > 0) permission.skill = Object.fromEntries([["*", "deny"], ...skills.map((skill) => [skill, "allow"])]);
  return permission;
}

export type CaptureOptions = {
  baselineConfigDir?: string;
  candidateConfigDir?: string;
  candidateId: string;
  evidenceRoot: string;
  failure: CaptureFailureKind;
  fixtureDecisions?: Record<string, unknown>;
  gitRef: string;
  kind: "baseline" | "candidate" | "matched";
  repoRoot: string;
  sessionMode: SessionMode;
  sourceIdentity: SourceIdentity;
};

export type ConfiguredDiagnosticOptions = {
  candidateConfigDir?: string;
  candidateId: string;
  evidenceRoot: string;
  executable: string;
  fixtureDecisions?: Record<string, unknown>;
  retainChangedText?: boolean;
  repoRoot: string;
  sourceIdentity: SourceIdentity;
};

export type ChangedTextEvidence = {
  after: { sha256: string; text: string } | null;
  before: { sha256: string; text: string } | null;
  path: string;
};

export function changedTextEvidence(
  before: Record<string, string>,
  after: Record<string, string>,
): ChangedTextEvidence[] {
  return [...new Set([...Object.keys(before), ...Object.keys(after)])]
    .sort((left, right) => left.localeCompare(right))
    .flatMap((relative) => {
      const beforeText = before[relative];
      const afterText = after[relative];
      if (beforeText === afterText) return [];
      return [{
        after: afterText == null ? null : { sha256: sha256(afterText), text: afterText },
        before: beforeText == null ? null : { sha256: sha256(beforeText), text: beforeText },
        path: relative,
      }];
    });
}

export function configuredScenarioTimeoutMs(
  scenario: RegressionManifest["scenarios"][number],
  failure: CaptureFailureKind,
): number {
  if (failure === "timeout") return 50;
  if (COMPLEXITY_CONFIGURED_SESSION_MEMBER_ORDER.includes(scenario.id as (typeof COMPLEXITY_CONFIGURED_SESSION_MEMBER_ORDER)[number])) {
    return 300_000;
  }
  if (scenario.id === "material-correction-rereview" || scenario.id === "exact-practice-owner") {
    return FOUNDATION_SERVER_PROMPT_TIMEOUT_MS;
  }
  return scenario.permissions.allow.some((entry) => entry === "task:foundation-integrity-reviewer" || entry === "task:implementation-readiness-reviewer") ? 300_000 : 180_000;
}

export function processTerminationEvidence(
  result: PortableCommandResult,
  timeoutMs: number,
): NonNullable<SampleEvidence["command"]["termination"]> {
  const error = result.error;
  return {
    cleanupState: result.cleanupState ?? "unknown",
    error: error == null ? null : {
      code: typeof (error as NodeJS.ErrnoException).code === "string" ? (error as NodeJS.ErrnoException).code! : null,
      message: error.message,
      name: error.name,
      stack: error.stack ?? null,
    },
    signal: result.signal,
    timedOut: result.timedOut === true,
    timeoutMs,
  };
}

type LocalApply = { files: Record<string, string> };

function pairSequence(manifest: RegressionManifest): Array<{ arm: Arm; sampleIndex: number }> {
  const sequence = manifest.pairOrder.flatMap((pair) => pair.split(",").map((token) => {
    const match = /^([BC])([1-9][0-9]*)$/.exec(token);
    if (match == null) throw new ContractError("manifest.pairOrder", `invalid explicit pair token: ${token}`);
    return { arm: match[1] === "B" ? "baseline" as const : "candidate" as const, sampleIndex: Number(match[2]) };
  }));
  for (const arm of ["baseline", "candidate"] as const) {
    const indices = sequence.filter((row) => row.arm === arm).map((row) => row.sampleIndex).sort((left, right) => left - right);
    if (indices.join(",") !== Array.from({ length: manifest.sampleCount }, (_, index) => index + 1).join(",")) {
      throw new ContractError("manifest.pairOrder", `pair order must enumerate each ${arm} sample exactly once`);
    }
  }
  return sequence;
}

export function copyScenarioSeed(
  source: string,
  target: string,
  scenario: RegressionManifest["scenarios"][number],
  candidateDecision?: unknown,
): void {
  fs.cpSync(source, target, { recursive: true });
  if (scenario.fixturePath.replaceAll("\\", "/") !== "tools/proofs/fixtures/consumer-outcome/bounded-falsification-v1") return;

  const casesPath = path.join(target, "cases.json");
  const fixture = JSON.parse(fs.readFileSync(casesPath, "utf8")) as {
    schemaVersion?: unknown;
    cases?: Array<{ caseId?: unknown; initialCandidateArtifact?: unknown }>;
  };
  const selected = fixture.cases?.filter((item) => item.caseId === scenario.fixtureId) ?? [];
  if (selected.length !== 1) {
    throw new ContractError(`${scenario.id}.fixtureId`, `${scenario.id} must select exactly one actor-visible bounded-falsification case`);
  }
  const selectedCase = candidateDecision == null ? selected[0] : { ...selected[0], candidateDecision };
  fs.writeFileSync(casesPath, `${stableJson({ schemaVersion: fixture.schemaVersion, cases: [selectedCase] })}\n`, "utf8");
  if (typeof selectedCase?.initialCandidateArtifact === "string") {
    fs.writeFileSync(path.join(target, "candidate.md"), selectedCase.initialCandidateArtifact, "utf8");
  }
}

function initialScenarioFiles(fixtureRoot: string, scenario: RegressionManifest["scenarios"][number]): string[] {
  return [...new Set([
    ...scenario.initialManifest.files,
    ...(fs.existsSync(path.join(fixtureRoot, "candidate.md")) ? ["candidate.md"] : []),
  ])].sort((left, right) => left.localeCompare(right));
}

function loadApply(repoRoot: string, fixtureId: string, arm?: Arm): LocalApply {
  const applyRoot = path.join(repoRoot, "tools/proofs/fixtures/consumer-outcome/apply");
  const armPath = arm == null ? null : path.join(applyRoot, `${fixtureId}-${arm}.json`);
  const applyPath = armPath != null && fs.existsSync(armPath)
    ? armPath
    : path.join(applyRoot, `${fixtureId}.json`);
  const parsed = JSON.parse(fs.readFileSync(applyPath, "utf8")) as LocalApply;
  if (parsed?.files == null) throw new ContractError("local-provider-apply", "reviewed local apply seed is missing");
  return parsed;
}

function applySeed(fixtureRoot: string, apply: LocalApply): void {
  for (const [relative, content] of Object.entries(apply.files).sort(([left], [right]) => left.localeCompare(right))) {
    const destination = assertContained(fixtureRoot, path.join(fixtureRoot, relative), relative);
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.writeFileSync(destination, content, "utf8");
  }
}

export function commandFact(root: string, argv: string[], timeoutMs = 30_000): { argv: string[]; status: number | null; stderr: string; stdout: string } {
  const result = runPortableCommand(root, argv, { capture: true, timeoutMs });
  return { argv, status: result.status, stderr: result.stderr.slice(0, 4000), stdout: result.stdout.slice(0, 4000) };
}

function startLocalProvider(failure: CaptureFailureKind): Promise<{ close: () => Promise<void>; requestCount: () => number; url: string }> {
  let requestCount = 0;
  const server = http.createServer((request, response) => {
    const url = request.url ?? "";
    if (url.endsWith("/models")) {
      response.writeHead(200, { "content-type": "application/json" });
      response.end(JSON.stringify({ object: "list", data: [{ id: "proof-model", object: "model", owned_by: "proof" }] }));
      return;
    }
    if (!url.endsWith("/chat/completions")) {
      response.writeHead(404);
      response.end("not found");
      return;
    }
    requestCount += 1;
    if (failure === "model") {
      response.writeHead(503, { "content-type": "application/json" });
      response.end(JSON.stringify({ error: { message: "injected model failure", type: "server_error" } }));
      return;
    }
    if (failure === "timeout") return;
    response.writeHead(200, { "content-type": "application/json" });
    response.end(JSON.stringify({
      choices: [{ finish_reason: "stop", index: 0, message: { content: "Local fixture capture complete.", role: "assistant" } }],
      created: 0,
      id: "chatcmpl_proof",
      model: "proof-model",
      object: "chat.completion",
      usage: { completion_tokens: 1, prompt_tokens: 1, total_tokens: 2 },
    }));
  });
  return new Promise((resolve, reject) => {
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (address == null || typeof address === "string") {
        reject(new Error("local provider has no port"));
        return;
      }
      resolve({
        close: () => new Promise((done, fail) => server.close((error) => error == null ? done() : fail(error))),
        requestCount: () => requestCount,
        url: `http://127.0.0.1:${address.port}`,
      });
    });
    server.once("error", reject);
  });
}

function parseToolFacts(stdout: string): { sessionIds: string[]; tools: ToolCallFact[] } {
  const tools: ToolCallFact[] = [];
  const sessionIds = new Set<string>();
  for (const line of stdout.split(/\r?\n/)) {
    if (!line.trim().startsWith("{")) continue;
    try {
      const visit = (value: unknown): void => {
        if (Array.isArray(value)) {
          for (const item of value) visit(item);
          return;
        }
        if (value == null || typeof value !== "object") return;
        const record = value as Record<string, unknown>;
        if (typeof record.sessionID === "string") sessionIds.add(record.sessionID);
        if (typeof record.tool === "string") {
          const state = record.state as Record<string, unknown> | undefined;
          tools.push({
            argumentDigest: argumentDigest(state?.input ?? record.input ?? null),
            name: record.tool,
            status: typeof state?.status === "string" ? state.status : null,
          });
        }
        for (const nested of Object.values(record)) visit(nested);
      };
      visit(JSON.parse(line));
    } catch {
      continue;
    }
  }
  return { sessionIds: [...sessionIds], tools };
}

function toolFacts(failure: CaptureFailureKind): ToolCallFact[] {
  if (failure === "tool") {
    const digest = argumentDigest({ path: "src/target.ts" });
    return [
      { argumentDigest: digest, name: "edit", status: "error" },
      { argumentDigest: digest, name: "edit", status: "error" },
    ];
  }
  return [{ argumentDigest: argumentDigest({ path: "local-apply" }), name: "edit", status: "completed" }];
}

function frictionFrom(tools: ToolCallFact[]): FrictionVector {
  const failed = tools.filter((tool) => tool.status !== "completed");
  const seen = new Set<string>();
  let duplicates = 0;
  for (const tool of failed) {
    const key = `${tool.name}:${tool.argumentDigest}`;
    if (seen.has(key)) duplicates += 1;
    else seen.add(key);
  }
  return {
    configuredProviderRequestCount: 0,
    duplicateFailedToolInvocationCount: duplicates,
    failedToolCallCount: failed.length,
    ownerQuestionCount: 0,
    totalToolCallCount: tools.length,
  };
}

export function environmentOf(
  manifest: RegressionManifest,
  scenario: RegressionManifest["scenarios"][number],
  scenarioDigest: string,
  fixtureDigest: string,
  model: string,
  variant: string,
  opencodeVersion: string,
): EnvironmentIdentity {
  return {
    dependencyIdentity: process.version,
    initialFixtureDigest: fixtureDigest,
    model,
    opencodeVersion,
    osClass: osClass(),
    permissionDigest: digestOf(scenario.permissions),
    profile: manifest.profile,
    scenarioDigest,
    validationArgvDigest: digestOf(scenario.validationArgv),
    variant,
  };
}

export function sealSample(sample: Omit<SampleEvidence, "hashes">): SampleEvidence {
  const sealed: SampleEvidence = { ...sample, hashes: { sample: "" } };
  sealed.hashes.sample = digestOf({ ...sealed, hashes: { sample: "" } });
  if (Buffer.byteLength(stableJson(sealed), "utf8") > SAMPLE_BYTE_LIMIT) sealed.diagnostics.truncatedFields.push("sample");
  return sealed;
}

export function createCaptureBundle(input: {
  candidateId: string;
  evidenceRoot: string;
  inventory?: string[];
  kind: CaptureBundle["kind"];
  samples: SampleEvidence[];
  scenarioDigest: string;
  sourceIdentity: SourceIdentity;
}): CaptureBundle {
  const bundle: CaptureBundle = {
    byteLength: 0,
    comparisonIdentity: digestOf({ candidateId: input.candidateId, kind: input.kind, scenarioDigest: input.scenarioDigest }),
    evaluatorDigest: evaluatorDigest(),
    inventory: input.inventory ?? [],
    kind: input.kind,
    samples: input.samples,
    scenarioDigest: input.scenarioDigest,
    schemaVersion: SCHEMA_VERSION,
    sourceIdentity: input.sourceIdentity,
  };
  bundle.byteLength = bundleByteLength(bundle);
  if (bundle.byteLength > CAPTURE_BYTE_LIMIT) throw new ContractError("bundle.byteLength", "capture exceeds the reviewed byte bound");
  return bundle;
}

function diagnosticRuntimeManifest(proofRoot: string): Array<{ bytes?: number; error?: string; path: string; sha256?: string }> {
  const rows: Array<{ bytes?: number; error?: string; path: string; sha256?: string }> = [];
  const visit = (directory: string): void => {
    if (!fs.existsSync(directory) || rows.length >= 256) return;
    for (const entry of fs.readdirSync(directory, { withFileTypes: true }).sort((left, right) => left.name.localeCompare(right.name))) {
      if (rows.length >= 256) break;
      const full = path.join(directory, entry.name);
      if (entry.isDirectory()) visit(full);
      else {
        const relative = path.relative(proofRoot, full).replaceAll("\\", "/");
        try {
          const bytes = fs.readFileSync(full);
          rows.push({ bytes: bytes.length, path: relative, sha256: sha256(bytes) });
        } catch (error) {
          rows.push({ error: error instanceof Error ? error.name : "unknown", path: relative });
        }
      }
    }
  };
  for (const relative of ["cache", "candidate-config", "config-home", "data", "state"]) visit(path.join(proofRoot, relative));
  return rows;
}

function sanitizeDiagnosticStrings(value: unknown, counts: Record<string, number>): unknown {
  if (typeof value === "string") {
    const sanitized = redactPrivacyMarkers(value);
    for (const [name, count] of Object.entries(sanitized.counts)) counts[name] = (counts[name] ?? 0) + count;
    return sanitized.text;
  }
  if (Array.isArray(value)) return value.map((item) => sanitizeDiagnosticStrings(item, counts));
  if (value != null && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, sanitizeDiagnosticStrings(item, counts)]));
  }
  return value;
}

export function sealConfiguredDiagnostic(diagnostic: Record<string, unknown>): Record<string, unknown> {
  const privacyRedactions: Record<string, number> = {};
  const safeDiagnostic = sanitizeDiagnosticStrings(diagnostic, privacyRedactions) as Record<string, unknown>;
  safeDiagnostic.privacyRedactions = privacyRedactions;
  safeDiagnostic.digest = digestOf({ ...safeDiagnostic, digest: "" });
  assertPrivacySafe(stableJson(safeDiagnostic), "configured diagnostic");
  return safeDiagnostic;
}

function emptyDiagnosticEvidence(): DiagnosticProofEvidence {
  return {
    cleanup: { error: null, sessionsRemoved: true },
    errors: [],
    messages: { assistant: [], toolCalls: [] },
    providerRequestCount: 0,
    response: "",
    sessionID: null,
  };
}

export async function captureConfiguredDiagnostic(
  manifest: RegressionManifest,
  scenarioDigest: string,
  options: ConfiguredDiagnosticOptions,
): Promise<Record<string, unknown>> {
  if (manifest.scenarios.length !== 1) throw new ContractError("diagnostic.scenarios", "configured diagnostic requires exactly one selected scenario");
  if (fs.existsSync(options.evidenceRoot) && fs.readdirSync(options.evidenceRoot).length > 0) {
    throw new ContractError("evidenceRoot", "evidence root must be create-new");
  }
  fs.mkdirSync(options.evidenceRoot, { recursive: true });
  const startedAt = Date.now();
  const scenario = manifest.scenarios[0]!;
  const proofRoot = fs.mkdtempSync(path.join(os.tmpdir(), `consumer-outcome-diagnostic-${scenario.id}-`));
  const fixtureRoot = path.join(proofRoot, "fixture");
  const seedRoot = assertContained(options.repoRoot, path.join(options.repoRoot, scenario.fixturePath), scenario.id);
  copyScenarioSeed(seedRoot, fixtureRoot, scenario, options.fixtureDecisions?.[scenario.id]);
  const initialFiles = initialScenarioFiles(fixtureRoot, scenario);
  const initial = hashFiles(fixtureRoot, initialFiles);
  const initialText = options.retainChangedText === true
    ? Object.fromEntries(initialFiles.map((relative) => [relative, fs.readFileSync(path.join(fixtureRoot, relative), "utf8")]))
    : null;
  const profile = loadModelProfile(options.repoRoot, manifest.profile).profile;
  const configuredRoute = profile.agent.build;
  for (const relative of ["cache", "config-home", "data/opencode", "state"]) {
    fs.mkdirSync(path.join(proofRoot, relative), { recursive: true });
  }
  const permission = configuredPermission(scenario);
  const configDir = materializeConfiguredProofConfig(
    options.candidateConfigDir ?? path.join(options.repoRoot, "global"),
    path.join(proofRoot, "candidate-config"),
    profile,
    permission,
  );
  const modelsCatalog = seedProofModelsCatalog(proofRoot, [configuredRoute.model]);
  const environment = configuredProofServerEnvironment(process.env, configDir, proofRoot, {});
  const redactions = defaultRedactions(proofRoot, options.repoRoot);
  const openCode = installedOpenCodeIdentity(options.executable);
  let server: ProofServerHandle | null = null;
  let serverTerminal: { signal: NodeJS.Signals | null; status: number | null } | null = null;
  let roundtrip = emptyDiagnosticEvidence();
  let resolvedRoute: string | null = null;
  let captureError: unknown = null;
  let captureStage = "server-start";
  let cleanupError: unknown = null;
  try {
    server = await startProofServer(options.executable, fixtureRoot, environment);
    captureStage = "route-readiness";
    const client = proofClient(server.url, fixtureRoot);
    const route = await waitForProofRoute(client, fixtureRoot, "build", 15_000);
    resolvedRoute = `${route.model.providerID}/${route.model.modelID}/${route.variant ?? "default"}`;
    const expectedRoute = `${configuredRoute.model}/${configuredRoute.variant}`;
    if (resolvedRoute !== expectedRoute) throw new Error(`Configured route mismatch: expected=${expectedRoute} actual=${resolvedRoute}`);
    await assertProofRouteAvailable(client, fixtureRoot, route);
    captureStage = "session-prompt";
    roundtrip = await runDiagnosticProofSession({
      client,
      directory: fixtureRoot,
      prompt: scenario.request,
      route,
      timeoutMs: FOUNDATION_SERVER_PROMPT_TIMEOUT_MS,
      title: `consumer-outcome-diagnostic-${scenario.id}`,
    });
  } catch (error) {
    const startup = proofServerStartupFailure(error);
    if (startup != null) {
      server = startup.server;
      serverTerminal = startup.terminal;
    }
    captureError = error;
  } finally {
    if (server != null && serverTerminal == null) {
      try {
        serverTerminal = await stopProofServer(server);
      } catch (error) {
        cleanupError = error;
      }
    }
  }
  const validation = commandFact(fixtureRoot, scenario.validationArgv);
  const proof = commandFact(fixtureRoot, scenario.proofExpectations.argv);
  const tracked = [...new Set([...initialFiles, ...scenario.expectedOutcome.stateFiles])].sort((left, right) => left.localeCompare(right));
  const files = hashFiles(fixtureRoot, tracked.filter((relative) => fs.existsSync(path.join(fixtureRoot, relative))));
  const changes = initialText == null ? null : changedTextEvidence(
    initialText,
    Object.fromEntries(tracked
      .filter((relative) => fs.existsSync(path.join(fixtureRoot, relative)))
      .map((relative) => [relative, fs.readFileSync(path.join(fixtureRoot, relative), "utf8")])),
  );
  const runtimeManifest = diagnosticRuntimeManifest(proofRoot);
  const logs = server == null ? { stderr: "", stdout: "" } : proofServerLogs(server);
  const startupFacts = proofServerStartupFacts(logs.stdout, logs.stderr, configDir, [proofRoot]);
  try {
    removeProofFixture(proofRoot);
  } catch (error) {
    cleanupError ??= error;
  }
  const fixtureRemoved = !fs.existsSync(proofRoot);
  const sessionsRemoved = roundtrip.cleanup.sessionsRemoved && roundtrip.cleanup.error == null;
  const processesRemoved = server != null && serverTerminal != null;
  const redact = <T>(value: T): T => JSON.parse(redactText(JSON.stringify(value), redactions)) as T;
  const latestAssistant = roundtrip.messages.assistant.at(-1) ?? null;
  const runtimeErrors = [
    ...roundtrip.errors,
    ...(captureError == null ? [] : [{ facts: proofErrorFacts(captureError), stage: captureStage }]),
    ...(cleanupError == null ? [] : [{ facts: proofErrorFacts(cleanupError), stage: "cleanup" }]),
  ];
  const terminalClassification = runtimeErrors.length > 0 || latestAssistant?.error != null
    ? "runtime-error"
    : proof.status === scenario.proofExpectations.exitCode
      ? "completed-observation"
      : "incomplete-observation";
  const diagnostic: Record<string, unknown> = {
    candidateId: options.candidateId,
    cleanup: {
      complete: fixtureRemoved && sessionsRemoved && processesRemoved && cleanupError == null,
      fixtureRemoved,
      processesRemoved,
      sessionsRemoved,
    },
    ...(changes == null ? {} : { changes }),
    diagnosticOnly: true,
    digest: "",
    elapsedMs: Date.now() - startedAt,
    environment: {
      configuredRoute: `${configuredRoute.model}/${configuredRoute.variant}`,
      modelsCatalogSha256: modelsCatalog.sha256,
      openCode,
      resolvedRoute,
      runtimeManifest,
      startupFacts,
    },
    files: { after: files, before: initial },
    mode: "configured-diagnostic",
    proof: redact(proof),
    providerRequestCount: roundtrip.providerRequestCount,
    requestSha256: sha256(scenario.request),
    runtimeErrors: redact(runtimeErrors),
    scenarioDigest,
    scenarioId: scenario.id,
    schemaVersion: SCHEMA_VERSION,
    server: {
      signal: serverTerminal?.signal ?? null,
      status: serverTerminal?.status ?? null,
      stderr: redactText(logs.stderr.slice(-32_768), redactions),
      stdout: redactText(logs.stdout.slice(-32_768), redactions),
    },
    session: redact({
      cleanup: roundtrip.cleanup,
      latestAssistant,
      messages: roundtrip.messages,
      response: roundtrip.response,
      sessionID: roundtrip.sessionID == null ? null : "<session>",
    }),
    sourceIdentity: options.sourceIdentity,
    terminalClassification,
    validation: redact(validation),
  };
  const safeDiagnostic = sealConfiguredDiagnostic(redact(diagnostic));
  const serialized = stableJson(safeDiagnostic);
  if (Buffer.byteLength(serialized, "utf8") > scenario.evidenceByteBound) {
    throw new ContractError("diagnostic", `configured diagnostic exceeds the reviewed ${scenario.evidenceByteBound}-byte bound`);
  }
  assertPrivacySafe(serialized, "configured diagnostic");
  writeNewFile(path.join(options.evidenceRoot, "diagnostic.json"), serialized);
  return safeDiagnostic;
}

export async function captureFoundationConfiguredLane(
  manifest: RegressionManifest,
  scenarioDigest: string,
  options: ConfiguredDiagnosticOptions,
): Promise<CaptureBundle> {
  const diagnostic = await captureConfiguredDiagnostic(manifest, scenarioDigest, options);
  return createFoundationBundleFromDiagnostic(manifest, scenarioDigest, options, diagnostic);
}

export function createFoundationBundleFromDiagnostic(
  manifest: RegressionManifest,
  scenarioDigest: string,
  options: ConfiguredDiagnosticOptions,
  diagnostic: Record<string, unknown>,
): CaptureBundle {
  const scenario = manifest.scenarios[0]!;
  const session = diagnostic.session as {
    latestAssistant?: { error?: unknown; finish?: unknown } | null;
    messages?: { assistant?: unknown[]; toolCalls?: Array<{ name: string; status: string | null }> };
    response?: string;
  };
  const cleanup = diagnostic.cleanup as { complete: boolean; fixtureRemoved: boolean; processesRemoved: boolean; sessionsRemoved: boolean };
  const files = (diagnostic.files as { after: SampleEvidence["files"]; before: Array<{ path: string; sha256: string }> });
  const proof = diagnostic.proof as SampleEvidence["proof"];
  const validation = diagnostic.validation as SampleEvidence["validation"];
  const runtimeErrors = diagnostic.runtimeErrors as unknown[];
  const environment = diagnostic.environment as {
    startupFacts?: { ripgrepDownloadRequested?: boolean };
  };
  const configuredRoute = loadModelProfile(options.repoRoot, manifest.profile).profile.agent.build;
  const tools: ToolCallFact[] = (session.messages?.toolCalls ?? []).map((tool) => ({
    argumentDigest: argumentDigest(null),
    name: tool.name,
    status: tool.status ?? "unknown",
  }));
  const allowedTools = new Set(scenario.permissions.allow.map((entry) => entry.split(":", 1)[0]));
  const permissionViolations = tools
    .filter((tool) => !allowedTools.has(tool.name === "apply_patch" ? "edit" : tool.name))
    .map((tool) => `unexpected-tool:${tool.name}`);
  const commandStatus = diagnostic.terminalClassification === "completed-observation"
    && runtimeErrors.length === 0
    && session.latestAssistant?.error == null
    && session.latestAssistant?.finish === "stop"
    ? 0
    : 1;
  const sample = sealSample({
    arm: "candidate",
    cleanup: {
      complete: cleanup.complete,
      error: cleanup.complete ? null : "configured foundation cleanup incomplete",
      fixtureRemoved: cleanup.fixtureRemoved,
      processesRemoved: cleanup.processesRemoved,
      sessionsRemoved: cleanup.sessionsRemoved,
    },
    command: {
      argv: ["<installed-opencode>/opencode.exe", "serve", "--print-logs", "--log-level", "INFO"],
      status: commandStatus,
      stderr: runtimeErrors.length === 0 ? "" : stableJson(runtimeErrors),
      stdout: session.response ?? "",
    },
    diagnostics: {
      elapsedMs: typeof diagnostic.elapsedMs === "number" ? diagnostic.elapsedMs : null,
      tokens: session.messages?.assistant ?? null,
      truncatedFields: [],
    },
    environmentIdentity: environmentOf(
      manifest,
      scenario,
      scenarioDigest,
      digestOf(files.before),
      configuredRoute.model,
      configuredRoute.variant,
      "opencode",
    ),
    files: files.after,
    forbiddenEffects: scenario.forbiddenEffects.map((name) => ({
      name,
      observed: (name === "install" || name === "remote") && environment.startupFacts?.ripgrepDownloadRequested === true,
    })),
    friction: {
      configuredProviderRequestCount: diagnostic.providerRequestCount as number,
      duplicateFailedToolInvocationCount: 0,
      failedToolCallCount: tools.filter((tool) => tool.status !== "completed").length,
      ownerQuestionCount: tools.filter((tool) => tool.name === "question").length,
      totalToolCallCount: tools.length,
    },
    permissions: { ...scenario.permissions, violations: permissionViolations },
    proof,
    requestSha256: sha256(scenario.request),
    sampleIndex: 1,
    scenarioId: scenario.id,
    schemaVersion: SCHEMA_VERSION,
    sideEffects: scenario.allowedEffects,
    sourceIdentity: options.sourceIdentity,
    toolCalls: tools,
    validation,
  });
  return createCaptureBundle({
    candidateId: options.candidateId,
    evidenceRoot: options.evidenceRoot,
    inventory: ["diagnostic.json"],
    kind: "candidate",
    samples: [sample],
    scenarioDigest,
    sourceIdentity: options.sourceIdentity,
  });
}

export async function captureLane(manifest: RegressionManifest, scenarioDigest: string, options: CaptureOptions): Promise<CaptureBundle> {
  if (fs.existsSync(options.evidenceRoot) && fs.readdirSync(options.evidenceRoot).length > 0) {
    throw new ContractError("evidenceRoot", "evidence root must be create-new");
  }
  fs.mkdirSync(options.evidenceRoot, { recursive: true });
  const reviewedSequence = pairSequence(manifest);
  const sequence = options.kind === "baseline"
    ? reviewedSequence.filter((row) => row.arm === "baseline")
    : options.kind === "candidate"
      ? reviewedSequence.filter((row) => row.arm === "candidate")
      : reviewedSequence;
  const samples: SampleEvidence[] = [];
  for (const scenario of manifest.scenarios) {
    for (const step of sequence) {
      const sample = await captureSample(manifest, scenario, scenarioDigest, step.arm, step.sampleIndex, options);
      samples.push(sample);
      if (!sample.cleanup.complete) throw new ContractError("writer", "unknown live writer prevents the next sample");
    }
  }
  return createCaptureBundle({
    candidateId: options.candidateId,
    evidenceRoot: options.evidenceRoot,
    kind: options.kind,
    samples,
    scenarioDigest,
    sourceIdentity: options.sourceIdentity,
  });
}

async function captureSample(
  manifest: RegressionManifest,
  scenario: RegressionManifest["scenarios"][number],
  scenarioDigest: string,
  arm: Arm,
  sampleIndex: number,
  options: CaptureOptions,
): Promise<SampleEvidence> {
  const proofRoot = fs.mkdtempSync(path.join(os.tmpdir(), `consumer-outcome-${scenario.id}-`));
  const fixtureRoot = path.join(proofRoot, "fixture");
  const lockPath = path.join(proofRoot, "writer.lock");
  const seedRoot = assertContained(options.repoRoot, path.join(options.repoRoot, scenario.fixturePath), scenario.id);
  if (path.resolve(fixtureRoot).startsWith(path.resolve(options.repoRoot))) {
    removeProofFixture(proofRoot);
    throw new ContractError(scenario.id, "capture containment failure");
  }
  const replacements = defaultRedactions(proofRoot, options.repoRoot);
  let provider: Awaited<ReturnType<typeof startLocalProvider>> | null = null;
  let draft: Omit<SampleEvidence, "hashes"> | null = null;
  let cleanupError: string | null = null;
  try {
    writeNewFile(lockPath, stableJson({ owner: `${arm}-${scenario.id}-${sampleIndex}`, pid: process.pid }));
    copyScenarioSeed(seedRoot, fixtureRoot, scenario, options.fixtureDecisions?.[scenario.id]);
    const initialFiles = initialScenarioFiles(fixtureRoot, scenario);
    const initial = hashFiles(fixtureRoot, initialFiles);
    if (options.sessionMode !== "configured") provider = await startLocalProvider(options.failure);
    if (options.failure === "evidence") fs.writeFileSync(path.join(fixtureRoot, "leak.txt"), "api_key=sk-injected-secret-value\n");
    let command: SampleEvidence["command"] = { argv: ["local-provider", "--url", "<provider>"], status: 0, stderr: "", stdout: "" };
    let commandElapsedMs: number | null = null;
    let configuredTools: ToolCallFact[] | null = null;
    let configuredRequests = 0;
    let modelId = "proof/proof-model";
    let variant = "none";
    let runtimeVersion = "local-fixture";
    if (options.sessionMode === "configured") {
      const loaded = loadModelProfile(options.repoRoot, manifest.profile);
      const route = loaded.profile.agent.build;
      modelId = route.model;
      variant = route.variant;
      const environment = {
        ...process.env,
        OPENCODE_CONFIG_CONTENT: JSON.stringify({
          ...loaded.profile,
          permission: configuredPermission(scenario),
        }),
        OPENCODE_CONFIG_DIR: arm === "baseline" && options.baselineConfigDir != null
          ? options.baselineConfigDir
          : arm === "candidate" && options.candidateConfigDir != null
            ? options.candidateConfigDir
            : path.join(options.repoRoot, "global"),
        OPENCODE_PURE: "1",
        XDG_CACHE_HOME: path.join(proofRoot, "xdg-cache"),
        XDG_STATE_HOME: path.join(proofRoot, "xdg-state"),
      };
      const version = runPortableCommand(options.repoRoot, ["opencode", "--version"], { capture: true, env: environment, timeoutMs: 30_000 });
      runtimeVersion = version.status === 0 ? version.stdout.trim().split(/\r?\n/, 1)[0]! : "";
      if (runtimeVersion === "") throw new ContractError(scenario.id, `OpenCode version read failed: ${version.error?.message ?? version.stderr}`);
      const argv = [
        "opencode",
        "run",
        "--pure",
        "--auto",
        "--agent",
        "build",
        "--model",
        route.model,
        "--variant",
        route.variant,
        "--format",
        "json",
        "--dir",
        fixtureRoot,
        "--title",
        `consumer-outcome-${arm}-${scenario.id}-${sampleIndex}`,
        scenario.request,
      ];
      const timeoutMs = configuredScenarioTimeoutMs(scenario, options.failure);
      const startedAt = Date.now();
      const result = runPortableCommand(options.repoRoot, argv, {
        capture: true,
        env: environment,
        timeoutMs,
      });
      commandElapsedMs = Date.now() - startedAt;
      const stdoutLimit = Math.min(scenario.evidenceByteBound, 65_536);
      const termination = processTerminationEvidence(result, timeoutMs);
      if (termination.error != null) {
        termination.error.message = redactText(termination.error.message, replacements);
        termination.error.stack = termination.error.stack == null ? null : redactText(termination.error.stack, replacements).slice(0, 4_000);
      }
      command = {
        argv,
        status: result.status,
        stderr: result.stderr.slice(0, 4_000),
        stdout: result.stdout.slice(-stdoutLimit),
        termination,
      };
      const parsed = parseToolFacts(result.stdout);
      configuredTools = parsed.tools;
      configuredRequests = 1;
      if (configuredRequests > scenario.configuredProviderRequestBound) {
        throw new ContractError(scenario.id, "provider request bound would be exceeded");
      }
      for (const sessionID of parsed.sessionIds) {
        runPortableCommand(options.repoRoot, ["opencode", "session", "delete", sessionID, "--pure"], { capture: true, env: environment });
      }
    } else {
      const pingStatus = await new Promise<number>((resolve) => {
        http.get(`${provider.url}/v1/models`, (response) => {
          response.resume();
          response.on("end", () => resolve(response.statusCode === 200 ? 0 : response.statusCode ?? 1));
        }).on("error", () => resolve(1));
      });
      command = { argv: ["local-provider", "--url", "<provider>"], status: pingStatus, stderr: "", stdout: "" };
    }
    if (options.sessionMode !== "configured" && options.failure !== "model" && options.failure !== "timeout") {
      applySeed(fixtureRoot, loadApply(options.repoRoot, scenario.fixtureId, arm));
    }
    const validation = options.failure === "validation"
      ? { argv: scenario.validationArgv, status: 1 as number | null, stderr: "injected validation failure", stdout: "" }
      : commandFact(fixtureRoot, scenario.validationArgv);
    const proof = commandFact(fixtureRoot, scenario.proofExpectations.argv);
    const tools = configuredTools ?? toolFacts(options.failure);
    const trackedFiles = [...new Set([...initialFiles, ...scenario.expectedOutcome.stateFiles])]
      .sort((left, right) => left.localeCompare(right));
    const files = hashFiles(fixtureRoot, trackedFiles.filter((relative) => fs.existsSync(path.join(fixtureRoot, relative))));
    draft = {
      arm,
      cleanup: { ...scenario.cleanupOracle, complete: false, error: null },
      command: {
        argv: command.argv.map((value) => redactText(value, replacements)),
        status: command.status,
        stderr: redactText(command.stderr, replacements),
        stdout: redactText(command.stdout, replacements),
        ...(command.termination == null ? {} : { termination: command.termination }),
      },
      diagnostics: { elapsedMs: commandElapsedMs, tokens: null, truncatedFields: [] },
      environmentIdentity: environmentOf(manifest, scenario, scenarioDigest, digestOf(initial), modelId, variant, runtimeVersion),
      forbiddenEffects: scenario.forbiddenEffects.map((name) => ({ name, observed: false })),
      friction: { ...frictionFrom(tools), configuredProviderRequestCount: configuredRequests },
      files,
      permissions: { ...scenario.permissions, violations: [] },
      proof: {
        argv: proof.argv,
        status: proof.status,
        stderr: redactText(proof.stderr, replacements),
        stdout: redactText(proof.stdout, replacements),
      },
      requestSha256: sha256(scenario.request),
      sampleIndex,
      scenarioId: scenario.id,
      schemaVersion: SCHEMA_VERSION,
      sideEffects: ["local-write"],
      sourceIdentity: options.sourceIdentity,
      toolCalls: tools,
      validation: {
        argv: validation.argv,
        status: validation.status,
        stderr: redactText(validation.stderr, replacements),
        stdout: redactText(validation.stdout, replacements),
      },
    };
  } catch (error) {
    cleanupError = error instanceof Error ? error.message : String(error);
    throw error;
  } finally {
    if (provider != null) {
      try {
        await provider.close();
      } catch (error) {
        cleanupError = error instanceof Error ? error.message : String(error);
      }
    }
    if (options.failure === "cleanup") cleanupError = cleanupError ?? "injected cleanup failure";
    else {
      try {
        fs.rmSync(lockPath, { force: true });
        removeProofFixture(proofRoot);
      } catch (error) {
        cleanupError = error instanceof Error ? error.message : String(error);
      }
    }
    if (options.failure !== "cleanup" && fs.existsSync(proofRoot)) cleanupError = cleanupError ?? "fixture remains";
  }
  if (draft == null) throw new ContractError(scenario.id, cleanupError ?? "sample produced no evidence");
  draft.cleanup = {
    ...scenario.cleanupOracle,
    complete: cleanupError == null && options.failure !== "cleanup" && !fs.existsSync(proofRoot),
    error: cleanupError,
  };
  return sealSample(draft);
}

export type ProspectiveConsequenceTaskStage = "single-stage" | "reconstruction" | "initial-comparison" | "corrected-comparison";

export type ProspectiveConsequenceTaskResult = {
  childRef: string | null;
  configuredProviderRequests?: number;
  environmentIdentity?: { modelId: string; runtimeVersion: string; sourceDigest: string };
  modelVisiblePrompt?: string;
  modelVisibleToolResults: string[];
  observation: ProspectiveConsequenceObservation | null;
  observedEffects?: string[];
  role: string | null;
  status: number | null;
  stderr: string;
  stdout: string;
  taskInvocations?: Array<{
    childRef: string | null;
    resumeRef: string | null;
    role: string | null;
    status: number | null;
    stderr: string;
    stdout: string;
  }>;
  taskObserved?: boolean;
};

export type ProspectiveConsequenceTaskAdapter = {
  cleanup: () => ProspectiveConsequenceCleanup | Promise<ProspectiveConsequenceCleanup>;
  invoke: (input: {
    candidate: string | null;
    fixtureRoot: string;
    frozenReconstructionRef: string | null;
    prompt: string;
    resumeRef: string | null;
    scenarioId: string;
    stage: ProspectiveConsequenceTaskStage;
  }) => ProspectiveConsequenceTaskResult | Promise<ProspectiveConsequenceTaskResult>;
};

type ProspectiveConsequenceCleanup = {
  error: string | null;
  processesRemoved: boolean | null;
  sessionsRemoved: boolean | null;
};

export type ProspectiveConsequenceCapture = {
  arm: Arm;
  candidateMaterialization: {
    correctedCreated: boolean;
    created: boolean;
    kind: ProspectiveConsequenceScenario["candidate"]["kind"];
    path: string;
  };
  candidateStateAtReconstruction: "absent" | "present" | "unknown";
  cleanup: {
    complete: boolean;
    error: string | null;
    fixtureRemoved: boolean;
    processesRemoved: boolean | null;
    sessionsRemoved: boolean | null;
  };
  correctedReviewFreshness: "not-applicable" | "unknown" | "verified";
  configuredProviderRequestCount: number;
  environmentIdentity: { modelId: string; runtimeVersion: string; sourceDigest: string } | null;
  eventOrder: string[];
  failure: string | null;
  initialComparisonContinuity: "not-applicable" | "unknown" | "verified";
  observation: ProspectiveConsequenceObservation | null;
  forbiddenEffects: Array<{ name: string; observed: boolean }>;
  preReconstructionFiles: Array<{ content: string; path: string }>;
  scenarioId: string;
  sampleIndex: 1;
  stageOneModelVisible: {
    files: Array<{ content: string; path: string }>;
    prompt: string;
    toolResults: string[];
  };
  taskInvocations: Array<{
    childRef: string | null;
    resumeRef: string | null;
    role: string | null;
    stage: ProspectiveConsequenceTaskStage;
    status: number | null;
    stderr: string;
    stdout: string;
  }>;
};

function prospectiveFixtureFiles(root: string): Array<{ content: string; path: string }> {
  const result: Array<{ content: string; path: string }> = [];
  const walk = (current: string): void => {
    for (const entry of fs.readdirSync(current, { withFileTypes: true }).sort((left, right) => left.name.localeCompare(right.name))) {
      const absolute = path.join(current, entry.name);
      if (entry.isDirectory()) walk(absolute);
      else if (entry.isFile()) result.push({ content: fs.readFileSync(absolute, "utf8"), path: path.relative(root, absolute).replaceAll("\\", "/") });
    }
  };
  walk(root);
  return result;
}

export async function captureProspectiveConsequenceScenario(input: {
  adapter: ProspectiveConsequenceTaskAdapter;
  arm: Arm;
  fault?: "none" | "premature-file" | "premature-inline";
  reconstructionCurrent?: boolean;
  scenario: ProspectiveConsequenceScenario;
}): Promise<ProspectiveConsequenceCapture> {
  const fixtureRoot = fs.mkdtempSync(path.join(os.tmpdir(), `prospective-consequence-${input.arm}-${input.scenario.id}-`));
  const eventOrder: string[] = [];
  const taskInvocations: ProspectiveConsequenceCapture["taskInvocations"] = [];
  let candidateCreated = false;
  let correctedCreated = false;
  let failure: string | null = null;
  let observation: ProspectiveConsequenceObservation | null = null;
  let candidateStateAtReconstruction: ProspectiveConsequenceCapture["candidateStateAtReconstruction"] = "unknown";
  let initialComparisonContinuity: ProspectiveConsequenceCapture["initialComparisonContinuity"] = "not-applicable";
  let correctedReviewFreshness: ProspectiveConsequenceCapture["correctedReviewFreshness"] = "not-applicable";
  let configuredProviderRequestCount = 0;
  let environmentIdentity: ProspectiveConsequenceCapture["environmentIdentity"] = null;
  const observedEffects = new Set<string>();
  let stageOnePrompt = input.scenario.request;
  let stageOneToolResults: string[] = [];
  let preReconstructionFiles: ProspectiveConsequenceCapture["preReconstructionFiles"] = [];
  let stageOneFiles: ProspectiveConsequenceCapture["stageOneModelVisible"]["files"] = [];
  let cleanupState: ProspectiveConsequenceCleanup = { error: "cleanup-not-run", processesRemoved: null, sessionsRemoved: null };

  const candidateText = `${input.scenario.candidate.sentinel}\n${input.scenario.candidate.content}\n`;
  const correctedText = input.scenario.candidate.correctedContent === "none"
    ? null
    : `${input.scenario.candidate.sentinel}\n${input.scenario.candidate.correctedContent}\n`;
  const materializeCandidate = (text: string): void => {
    if (input.scenario.candidate.kind === "file") {
      fs.writeFileSync(path.join(fixtureRoot, input.scenario.candidate.path), text, "utf8");
    }
    candidateCreated = true;
  };
  const invoke = async (
    stage: ProspectiveConsequenceTaskStage,
    prompt: string,
    candidate: string | null,
    resumeRef: string | null,
    frozenReconstructionRef: string | null,
  ): Promise<ProspectiveConsequenceTaskResult> => {
    const result = await input.adapter.invoke({ candidate, fixtureRoot, frozenReconstructionRef, prompt, resumeRef, scenarioId: input.scenario.id, stage });
    eventOrder.push(`${result.taskObserved === false ? "root" : "task"}:${stage}`);
    configuredProviderRequestCount += result.configuredProviderRequests ?? 0;
    if (result.environmentIdentity != null) {
      if (environmentIdentity == null) environmentIdentity = result.environmentIdentity;
      else if (stableJson(environmentIdentity) !== stableJson(result.environmentIdentity)) environmentIdentity = null;
    }
    for (const effect of result.observedEffects ?? []) observedEffects.add(effect);
    const observedTasks = result.taskInvocations ?? (result.taskObserved === false ? [] : [{
      childRef: result.childRef,
      resumeRef,
      role: result.role,
      status: result.status,
      stderr: result.stderr,
      stdout: result.stdout,
    }]);
    taskInvocations.push(...observedTasks.map((task) => ({ ...task, stage })));
    return result;
  };

  try {
    fs.writeFileSync(path.join(fixtureRoot, "case.json"), stableJson(input.scenario.rawContext), "utf8");
    fs.writeFileSync(path.join(fixtureRoot, "system.md"), `${input.scenario.rawContext.evidence.join("\n")}\n`, "utf8");
    fs.writeFileSync(path.join(fixtureRoot, "check-result.ts"), "export {};\n", "utf8");
    const configuredRoute = input.scenario.expected[input.arm].route;
    if (input.fault === "premature-file" && input.scenario.candidate.kind === "file") {
      materializeCandidate(candidateText);
      eventOrder.push("candidate:premature-file");
    }
    if (input.fault === "premature-inline" && input.scenario.candidate.kind === "inline") {
      stageOnePrompt = `${stageOnePrompt}\n${candidateText}`;
      candidateCreated = true;
      eventOrder.push("candidate:premature-inline");
    }
    if (input.arm === "baseline" && input.scenario.candidate.kind !== "none") {
      materializeCandidate(candidateText);
      eventOrder.push(`candidate:baseline-${input.scenario.candidate.kind}`);
      if (input.scenario.candidate.kind === "inline") stageOnePrompt = `${stageOnePrompt}\n${candidateText}`;
    }

    preReconstructionFiles = prospectiveFixtureFiles(fixtureRoot);
    const stageOneTaskStart = taskInvocations.length;
    const stageOne = input.arm === "baseline" || configuredRoute === "direct" || configuredRoute === "behavioral-substitution"
      ? await invoke("single-stage", stageOnePrompt, candidateText, null, null)
      : await invoke("reconstruction", stageOnePrompt, null, null, null);
    const stageOneTaskCount = taskInvocations.length - stageOneTaskStart;
    stageOnePrompt = stageOne.modelVisiblePrompt ?? stageOnePrompt;
    stageOneToolResults = [...stageOne.modelVisibleToolResults];
    stageOneFiles = prospectiveFixtureFiles(fixtureRoot);
    const stageOneVisibleText = JSON.stringify({ files: stageOneFiles, prompt: stageOnePrompt, toolResults: stageOneToolResults });
    const candidatePathPresent = input.scenario.candidate.kind === "file"
      && (stageOneFiles.some((file) => file.path === input.scenario.candidate.path)
        || stageOneVisibleText.includes(input.scenario.candidate.path));
    candidateStateAtReconstruction = candidatePathPresent
      || stageOneVisibleText.includes(input.scenario.candidate.sentinel)
      || (input.scenario.candidate.content !== "none" && stageOneVisibleText.includes(input.scenario.candidate.content))
      ? "present"
      : "absent";
    if (stageOne.status !== 0) {
      failure = `stage-one:${stageOne.status == null ? "unknown" : stageOne.status}`;
    } else if (stageOneTaskCount !== (configuredRoute === "direct" || configuredRoute === "behavioral-substitution" ? 0 : 1)) {
      failure = "unexpected-task-repeat";
    } else if (input.arm === "baseline" || configuredRoute === "direct" || configuredRoute === "behavioral-substitution") {
      observation = stageOne.observation;
      if (observation == null) failure = "observation-missing-or-invalid";
    } else if (candidateStateAtReconstruction !== "absent") {
      failure = "candidate-present-at-reconstruction";
      initialComparisonContinuity = "unknown";
    } else if (stageOne.childRef == null || stageOne.role !== "implementation-readiness-reviewer") {
      failure = "reconstruction-identity-unverified";
      initialComparisonContinuity = "unknown";
    } else {
      materializeCandidate(candidateText);
      eventOrder.push(`candidate:${input.scenario.candidate.kind}`);
      const comparisonTaskStart = taskInvocations.length;
      const comparison = await invoke("initial-comparison", `${input.scenario.request}\nCompare the supplied candidate against the frozen reconstruction.`, candidateText, stageOne.childRef, stageOne.childRef);
      const comparisonTaskCount = taskInvocations.length - comparisonTaskStart;
      initialComparisonContinuity = comparison.childRef === stageOne.childRef && comparison.role === stageOne.role ? "verified" : "unknown";
      if (comparison.status !== 0) {
        failure = `stage-two:${comparison.status == null ? "unknown" : comparison.status}`;
      } else if (comparisonTaskCount !== 1) {
        failure = "unexpected-task-repeat";
      } else if (initialComparisonContinuity !== "verified") {
        failure = "initial-continuation-unverified";
      } else {
        observation = comparison.observation;
        if (observation == null) failure = "observation-missing-or-invalid";
        if (correctedText != null && failure == null) {
          if (input.reconstructionCurrent === false) {
            observation = null;
            correctedReviewFreshness = "unknown";
            failure = "frozen-reconstruction-stale";
          } else {
            materializeCandidate(correctedText);
            correctedCreated = true;
            eventOrder.push(`candidate:corrected-${input.scenario.candidate.kind}`);
            const correctedTaskStart = taskInvocations.length;
            const corrected = await invoke("corrected-comparison", `${input.scenario.request}\nCompare the corrected candidate against the supplied frozen reconstruction.`, correctedText, null, stageOne.childRef);
            const correctedTaskCount = taskInvocations.length - correctedTaskStart;
            correctedReviewFreshness = corrected.status === 0
              && correctedTaskCount === 1
              && corrected.childRef != null
              && corrected.childRef !== stageOne.childRef
              && corrected.role === stageOne.role
              ? "verified"
              : "unknown";
            if (corrected.status !== 0) failure = `corrected-review:${corrected.status == null ? "unknown" : corrected.status}`;
            else if (correctedReviewFreshness !== "verified") failure = "corrected-review-freshness-unverified";
            else if (corrected.observation == null) failure = "observation-missing-or-invalid";
          }
        }
      }
    }
  } catch (error) {
    failure = error instanceof Error ? error.message : String(error);
  } finally {
    try {
      cleanupState = await input.adapter.cleanup();
    } catch (error) {
      cleanupState = { error: error instanceof Error ? error.message : String(error), processesRemoved: null, sessionsRemoved: null };
    }
    try {
      fs.rmSync(fixtureRoot, { force: true, recursive: true });
    } catch (error) {
      cleanupState.error = cleanupState.error ?? (error instanceof Error ? error.message : String(error));
    }
  }

  const fixtureRemoved = !fs.existsSync(fixtureRoot);
  return {
    arm: input.arm,
    candidateMaterialization: { correctedCreated, created: candidateCreated, kind: input.scenario.candidate.kind, path: input.scenario.candidate.path },
    candidateStateAtReconstruction,
    cleanup: {
      complete: fixtureRemoved && cleanupState.error == null && cleanupState.processesRemoved === true && cleanupState.sessionsRemoved === true,
      error: cleanupState.error,
      fixtureRemoved,
      processesRemoved: cleanupState.processesRemoved,
      sessionsRemoved: cleanupState.sessionsRemoved,
    },
    correctedReviewFreshness,
    configuredProviderRequestCount,
    environmentIdentity,
    eventOrder,
    failure,
    forbiddenEffects: input.scenario.forbiddenEffects.map((name) => ({ name, observed: observedEffects.has(name) })),
    initialComparisonContinuity,
    observation,
    preReconstructionFiles,
    sampleIndex: 1,
    scenarioId: input.scenario.id,
    stageOneModelVisible: { files: stageOneFiles, prompt: stageOnePrompt, toolResults: stageOneToolResults },
    taskInvocations,
  };
}

type ProspectiveRunTool = {
  childId: string | null;
  error: string;
  input: Record<string, unknown>;
  name: string;
  output: string;
  status: string | null;
};

function prospectiveMessageText(message: unknown): string {
  if (message == null || typeof message !== "object" || !Array.isArray((message as { parts?: unknown }).parts)) return "";
  return ((message as { parts: unknown[] }).parts).flatMap((part) => {
    if (part == null || typeof part !== "object") return [];
    const value = part as Record<string, unknown>;
    return value.type === "text" && typeof value.text === "string" ? [value.text] : [];
  }).join("\n");
}

function prospectiveMessageTools(messages: unknown[]): ProspectiveRunTool[] {
  const tools = new Map<string, ProspectiveRunTool>();
  let fallbackIndex = 0;
  for (const message of messages) {
    if (message == null || typeof message !== "object" || !Array.isArray((message as { parts?: unknown }).parts)) continue;
    for (const part of (message as { parts: unknown[] }).parts) {
      if (part == null || typeof part !== "object" || Array.isArray(part)) continue;
      const tool = part as Record<string, unknown>;
      if (tool.type !== "tool" || typeof tool.tool !== "string") continue;
      const state = tool.state != null && typeof tool.state === "object" && !Array.isArray(tool.state) ? tool.state as Record<string, unknown> : {};
      const metadata = state.metadata != null && typeof state.metadata === "object" && !Array.isArray(state.metadata) ? state.metadata as Record<string, unknown> : {};
      const toolInput = state.input != null && typeof state.input === "object" && !Array.isArray(state.input) ? state.input as Record<string, unknown> : {};
      const callId = typeof tool.callID === "string" ? tool.callID : `fallback-${fallbackIndex++}`;
      tools.set(callId, {
        childId: typeof metadata.sessionId === "string" ? metadata.sessionId : null,
        error: typeof state.error === "string" ? state.error : "",
        input: toolInput,
        name: tool.tool,
        output: typeof state.output === "string" ? state.output : "",
        status: typeof state.status === "string" ? state.status : null,
      });
    }
  }
  return [...tools.values()];
}

export function prospectiveObservedEffects(
  tools: ProspectiveRunTool[],
  fixtureRoot: string,
  repoRoot: string,
  proofOwnedReadRoots: string[] = [],
): string[] {
  const effects = new Set<string>();
  const readOnlyTools = new Set(["glob", "grep", "read"]);
  const isContained = (root: string, candidate: string): boolean => {
    const relative = path.relative(root, candidate);
    return relative === "" || !relative.startsWith("..") && !path.isAbsolute(relative);
  };
  for (const tool of tools) {
    const inputText = JSON.stringify(tool.input);
    if (tool.name === "webfetch" || /https?:\/\//iu.test(inputText)) effects.add("remote");
    if (tool.name === "bash" && /\b(?:install|npm\s+(?:add|i|install)|pnpm\s+add|yarn\s+add)\b/iu.test(inputText)) effects.add("install");
    if (tool.name === "bash" && /\b(?:credential|password|secret|token|api[_-]?key|process\.env)\b/iu.test(inputText)) effects.add("credential-read");
    if (tool.name === "bash" && /\b(?:del|format|Remove-Item|reset|restore|rmdir|rm|unlink)\b/iu.test(inputText)) effects.add("destructive-action");
    for (const value of [tool.input.filePath, tool.input.path, tool.input.directory, tool.input.cwd, tool.input.workdir]) {
      if (typeof value !== "string") continue;
      const resolved = path.resolve(fixtureRoot, value);
      if (!isContained(fixtureRoot, resolved)
        && !(readOnlyTools.has(tool.name) && proofOwnedReadRoots.some((root) => isContained(root, resolved)))) effects.add("protected-action");
      const relativeToRepo = path.relative(repoRoot, resolved);
      if (!relativeToRepo.startsWith("..") && !path.isAbsolute(relativeToRepo)) effects.add("product-implementation");
    }
  }
  return [...effects].sort();
}

function prospectiveResultPrompt(): string {
  return [
    "After the required route completes, write result.json as one JSON object with exactly these fields:",
    "route (behavioral-substitution | direct | pre-authoring-separated | single-stage), protocolMode (not-applicable | pre-authoring-separated | single-stage), candidateStateAtReconstruction (absent | not-applicable | present | unknown), initialComparisonContinuity (not-applicable | unknown | verified), correctedReviewFreshness (not-applicable | unknown | verified), challengeCount (0..2), taskCallCount (0..3), terminalState (closed | not-applicable | unknown), consequenceIds (unique string array), unknownReasons (unique string array).",
    "unknownReasons must be non-empty exactly when terminalState is unknown; it must be empty for closed and not-applicable results.",
    "terminalState describes whether the bounded review protocol and its required evidence completed, not whether the candidate is acceptable. A completed comparison with an evidence-backed consequence is closed even when the candidate is defective; use unknown only when required evidence, identity, continuity, or reconstruction currency is missing.",
    "If raw evidence establishes no downstream observer or effect, terminalState must remain unknown and unknownReasons must state that evidence gap. If comparison establishes a discarded distinction and reachable downstream observer or effect, consequenceIds must contain it before a closed result.",
    "For each evidence-backed discarded distinction, derive one lowercase kebab-case consequence id from the two affected downstream outcomes or owners, retaining their evidence order and joining them with '-versus-'. Do not invent a consequence when evidence is insufficient. If terminalState is unknown, include the exact factual reason. Do not read any consumer-outcome pack, fixture outside this directory, expected result, or oracle.",
  ].join("\n");
}

function prospectiveSemanticResultPrompt(): string {
  return [
    "Return the normal reviewer contract response, then end with exactly one machine-readable block:",
    "PCR_OBSERVATION_BEGIN",
    '{"terminalState":"closed | unknown","consequenceIds":["lowercase-kebab-case"],"unknownReasons":[]}',
    "PCR_OBSERVATION_END",
    "Use closed only when current evidence establishes a discarded distinction and reachable downstream observer or effect. In that case consequenceIds must be non-empty and unknownReasons empty.",
    "Use unknown when evidence cannot support the next causal link. In that case consequenceIds must be empty and unknownReasons must contain the exact factual gap.",
    "For each evidence-backed distinction, derive one lowercase kebab-case consequence id from the two affected downstream outcomes or owners in evidence order, joined with '-versus-'. Do not read any consumer-outcome pack, fixture outside this directory, expected result, or oracle.",
  ].join("\n");
}

function prospectiveReviewerRequest(prompt: string): string {
  return prompt.replace(/\bwrite result\.json\b/giu, "return the review result");
}

function parseProspectiveSemanticResult(
  text: string,
  structural: ProspectiveConsequenceObservation,
): ProspectiveConsequenceObservation | null {
  const begin = text.lastIndexOf("PCR_OBSERVATION_BEGIN");
  const end = text.lastIndexOf("PCR_OBSERVATION_END");
  if (begin < 0 || end <= begin) return null;
  try {
    const parsed = JSON.parse(text.slice(begin + "PCR_OBSERVATION_BEGIN".length, end).trim()) as Record<string, unknown>;
    if (Object.keys(parsed).sort().join(",") !== "consequenceIds,terminalState,unknownReasons") return null;
    return parseProspectiveConsequenceObservation({
      ...structural,
      consequenceIds: parsed.consequenceIds,
      terminalState: parsed.terminalState,
      unknownReasons: parsed.unknownReasons,
    });
  } catch {
    return null;
  }
}

type ProspectiveProofClient = ReturnType<typeof proofClient>;
type ProspectivePromptInput = Parameters<ProspectiveProofClient["session"]["prompt"]>[0];

function prospectiveAssistantMessages(messages: unknown[]): Record<string, unknown>[] {
  return messages.flatMap((message) => {
    if (message == null || typeof message !== "object" || Array.isArray(message)) return [];
    const value = message as Record<string, unknown>;
    const info = value.info != null && typeof value.info === "object" && !Array.isArray(value.info)
      ? value.info as Record<string, unknown>
      : {};
    return info.role === "assistant" ? [value] : [];
  });
}

function prospectiveAssistantTerminal(message: Record<string, unknown>): boolean {
  const info = message.info as Record<string, unknown>;
  const time = info.time != null && typeof info.time === "object" && !Array.isArray(info.time)
    ? info.time as Record<string, unknown>
    : {};
  return typeof time.completed === "number" || typeof info.finish === "string" || info.error != null;
}

export async function prospectivePrompt(
  client: ProspectiveProofClient,
  input: ProspectivePromptInput,
  label: string,
  timeoutMs = 600_000,
  pollMs = 250,
): Promise<Record<string, unknown>> {
  const before = await requestData<unknown[]>(client.session.messages({
    directory: input.directory,
    limit: 100,
    sessionID: input.sessionID,
  }) as Promise<unknown>, `${label} initial messages`);
  const beforeAssistant = prospectiveAssistantMessages(before);
  const beforeIds = new Set(beforeAssistant.flatMap((message) => {
    const info = message.info as Record<string, unknown>;
    return typeof info.id === "string" ? [info.id] : [];
  }));
  const accepted = await client.session.promptAsync(input) as { error?: unknown };
  if (accepted.error != null) {
    const error = new Error(`${label} async submission failed`) as Error & { cause?: unknown };
    error.cause = accepted.error;
    throw error;
  }

  const deadline = Date.now() + timeoutMs;
  let lastStatus: string | null = null;
  while (Date.now() < deadline) {
    const [statuses, messages] = await Promise.all([
      requestData<Record<string, { type?: unknown }>>(client.session.status({ directory: input.directory }) as Promise<unknown>, `${label} status`),
      requestData<unknown[]>(client.session.messages({ directory: input.directory, limit: 100, sessionID: input.sessionID }) as Promise<unknown>, `${label} messages`),
    ]);
    const status = statuses[input.sessionID]?.type;
    lastStatus = typeof status === "string" ? status : null;
    const assistant = prospectiveAssistantMessages(messages);
    const response = assistant.filter((message, index) => {
      const info = message.info as Record<string, unknown>;
      return typeof info.id === "string" ? !beforeIds.has(info.id) : index >= beforeAssistant.length;
    }).filter(prospectiveAssistantTerminal).at(-1);
    if (response != null && (lastStatus == null || lastStatus === "idle")) return response;
    await new Promise((resolve) => setTimeout(resolve, pollMs));
  }

  let abortCause: unknown = null;
  try {
    await requestData<boolean>(client.session.abort({ directory: input.directory, sessionID: input.sessionID }) as Promise<unknown>, `${label} timeout abort`);
    const abortDeadline = Date.now() + 10_000;
    while (Date.now() < abortDeadline) {
      const statuses = await requestData<Record<string, { type?: unknown }>>(client.session.status({ directory: input.directory }) as Promise<unknown>, `${label} abort status`);
      const status = statuses[input.sessionID]?.type;
      if (status == null || status === "idle") {
        lastStatus = typeof status === "string" ? status : null;
        break;
      }
      lastStatus = typeof status === "string" ? status : null;
      await new Promise((resolve) => setTimeout(resolve, pollMs));
    }
  } catch (error) {
    abortCause = error;
  }
  const error = new Error(`${label} did not produce a terminal assistant message within ${timeoutMs}ms (lastStatus=${lastStatus ?? "absent"})`) as Error & { cause?: unknown };
  if (abortCause != null) error.cause = abortCause;
  throw error;
}

function redactProspectiveEvidence(text: string, replacements: Array<[string, string]>): string {
  return redactText(text, replacements)
    .replace(/[A-Za-z]:\\+Users\\+[^\\\s"]+/gi, "<home>")
    .replace(/\/home\/[^/\s"]+/g, "<home>")
    .replace(/\/Users\/[^/\s"]+/g, "<home>");
}

export async function captureProspectiveConsequenceConfiguredLane(options: {
  arm: "baseline" | "candidate";
  candidateId: string;
  configDir: string;
  evidenceRoot: string;
  executable: string;
  gitRef: string;
  pack: ProspectiveConsequenceRehearsalPack;
  packDigest: string;
  repoRoot: string;
  scenarioIds?: string[];
  sourceIdentity: { governedDigest: string; sourceRef: string };
}): Promise<ProspectiveConsequenceRehearsalLane> {
  if (fs.existsSync(options.evidenceRoot)) throw new ContractError("evidenceRoot", "PCR evidence root must be create-new");
  fs.mkdirSync(options.evidenceRoot, { recursive: true });
  const profile = loadModelProfile(options.repoRoot, options.pack.profile).profile;
  const configuredBuild = profile.agent.build;
  const installed = installedOpenCodeIdentity(options.executable);
  const captures: ProspectiveConsequenceCapture[] = [];

  const selectedScenarios = options.scenarioIds == null
    ? options.pack.scenarios
    : options.scenarioIds.map((id) => {
        const scenario = options.pack.scenarios.find((item) => item.id === id);
        if (scenario == null) throw new ContractError("scenarioIds", `unknown PCR scenario: ${id}`);
        return scenario;
      });
  for (const scenario of selectedScenarios) {
    const runtimeRoot = fs.mkdtempSync(path.join(os.tmpdir(), `prospective-configured-${options.arm}-${scenario.id}-`));
    for (const relative of ["cache", "config-home", "data/opencode", "state"]) fs.mkdirSync(path.join(runtimeRoot, relative), { recursive: true });
    const effectiveConfigDir = materializeConfiguredProofConfig(
      options.configDir,
      path.join(runtimeRoot, "candidate-config"),
      profile,
      configuredPermission(scenario),
    );
    seedProofModelsCatalog(runtimeRoot, [configuredBuild.model]);
    const environment = configuredProofServerEnvironment(process.env, effectiveConfigDir, runtimeRoot, {});
    const sessionIds = new Set<string>();
    const rootSessionIds = new Set<string>();
    const childIds = new Map<string, string>();
    const childParents = new Map<string, string>();
    const reconstructionOutputs = new Map<string, string>();
    const runtimeDiagnostics: Array<{ stage: ProspectiveConsequenceTaskStage; status: number | null; stderr: string; stdout: string; taskObserved: boolean }> = [];
    let buildRoute: ProofRoute | null = null;
    let client: ProspectiveProofClient | null = null;
    let reviewerRoute: ProofRoute | null = null;
    let rootId: string | null = null;
    let reviewerTools: Record<string, boolean> | null = null;
    let server: ProofServerHandle | null = null;
    let serverTerminal: { signal: NodeJS.Signals | null; status: number | null } | null = null;
    let cleanupError: string | null = null;
    let activeFixtureRoot: string | null = null;
    const replacements: Array<[string, string]> = [
      [runtimeRoot, "<runtime-root>"],
      [effectiveConfigDir, "<config-root>"],
      [options.configDir, "<config-root>"],
      [options.repoRoot, "<repo-root>"],
      [path.dirname(options.executable), "<executable-root>"],
      [os.homedir(), "<home>"],
    ];
    const routeIdentity = (route: ProofRoute): string => `${route.model.providerID}/${route.model.modelID}/${route.variant ?? "default"}`;
    const safeChildRef = (sessionId: string): string => `child:${sha256(sessionId).slice(0, 20)}`;
    const ensureServer = async (fixtureRoot: string): Promise<void> => {
      if (client != null && buildRoute != null && reviewerRoute != null && reviewerTools != null) return;
      activeFixtureRoot = fixtureRoot;
      try {
        server = await startProofServer(options.executable, fixtureRoot, environment);
      } catch (error) {
        const startup = proofServerStartupFailure(error);
        if (startup != null) {
          server = startup.server;
          serverTerminal = startup.terminal;
        }
        throw error;
      }
      client = proofClient(server.url, fixtureRoot, environment);
      buildRoute = await waitForProofRoute(client, fixtureRoot, "build", 15_000);
      reviewerRoute = await waitForProofRoute(client, fixtureRoot, "implementation-readiness-reviewer", 15_000);
      await assertProofRouteAvailable(client, fixtureRoot, buildRoute);
      await assertProofRouteAvailable(client, fixtureRoot, reviewerRoute);
      const expectedBuild = `${configuredBuild.model}/${configuredBuild.variant}`;
      if (routeIdentity(buildRoute) !== expectedBuild) {
        throw new Error(`Configured build route mismatch: expected=${expectedBuild} actual=${routeIdentity(buildRoute)}`);
      }
      const toolIds = await requestData<string[]>(client.tool.ids({ directory: fixtureRoot }) as Promise<unknown>, "PCR tool inventory");
      const reviewerDenied = new Set(["apply_patch", "bash", "edit", "question", "task", "webfetch", "write"]);
      reviewerTools = Object.fromEntries(toolIds.map((id) => [id, !reviewerDenied.has(id)]));
    };
    const childEvidence = async (fixtureRoot: string, childId: string): Promise<{ role: string; tools: ProspectiveRunTool[] }> => {
      if (client == null || reviewerRoute == null) throw new Error("PCR proof server is not initialized");
      const parentId = childParents.get(childId);
      if (parentId == null) throw new Error("PCR reviewer parent identity is unavailable");
      const child = await requestData<Record<string, unknown>>(client.session.get({ directory: fixtureRoot, sessionID: childId }) as Promise<unknown>, "PCR child readback");
      const children = await requestData<Array<{ id?: unknown }>>(client.session.children({ directory: fixtureRoot, sessionID: parentId }) as Promise<unknown>, "PCR child correlation");
      const childModel = child.model as { id?: unknown; providerID?: unknown; variant?: unknown } | undefined;
      if (child.agent !== reviewerRoute.agent
        || child.parentID !== parentId
        || childModel?.providerID !== reviewerRoute.model.providerID
        || childModel.id !== reviewerRoute.model.modelID
        || (childModel.variant === "default" ? null : childModel.variant ?? null) !== reviewerRoute.variant
        || children.filter((row) => row.id === childId).length !== 1) {
        throw new Error("PCR reviewer child route or parent correlation failed");
      }
      const messages = await requestData<unknown[]>(client.session.messages({ directory: fixtureRoot, limit: 100, sessionID: childId }) as Promise<unknown>, "PCR child messages");
      return { role: String(child.agent), tools: prospectiveMessageTools(messages) };
    };
    const freshReviewerSession = async (fixtureRoot: string, title: string): Promise<{ childId: string; childRef: string }> => {
      if (client == null || reviewerRoute == null) throw new Error("PCR proof server is not initialized");
      const sessions = await createRoutedProofSessions(client, fixtureRoot, reviewerRoute, title);
      sessionIds.add(sessions.root.id);
      sessionIds.add(sessions.child.id);
      rootSessionIds.add(sessions.root.id);
      childParents.set(sessions.child.id, sessions.root.id);
      const childRef = safeChildRef(sessions.child.id);
      childIds.set(childRef, sessions.child.id);
      return { childId: sessions.child.id, childRef };
    };
    const adapter: ProspectiveConsequenceTaskAdapter = {
      invoke: async (input) => {
        const invocationReplacements: Array<[string, string]> = [[input.fixtureRoot, "<fixture-root>"], ...replacements];
        const expected = scenario.expected[options.arm];
        const reviewerRequest = prospectiveReviewerRequest(input.prompt);
        let prompt = input.prompt;
        let providerRequests = 0;
        try {
          await ensureServer(input.fixtureRoot);
          if (client == null || buildRoute == null || reviewerRoute == null || reviewerTools == null) throw new Error("PCR proof server initialization remained incomplete");
          let childRef: string | null = null;
          let observation: ProspectiveConsequenceObservation | null = null;
          let role: string | null = null;
          let status: number | null = 0;
          let stderr = "";
          let stdout = "";
          let taskInvocations: NonNullable<ProspectiveConsequenceTaskResult["taskInvocations"]> = [];
          let taskObserved = false;
          let tools: ProspectiveRunTool[] = [];

          if (expected.route === "direct" || expected.route === "behavioral-substitution") {
            if (rootId == null) {
              const root = await requestData<{ id: string }>(client.session.create({
                directory: input.fixtureRoot,
                title: `prospective-${options.arm}-${scenario.id} root`,
              }) as Promise<unknown>, "PCR direct root session create");
              rootId = root.id;
              sessionIds.add(root.id);
              rootSessionIds.add(root.id);
            }
            prompt = `${input.prompt}\nUse the current ${expected.route === "direct" ? "direct" : "exact substitution-owner"} route without launching implementation-readiness-reviewer, then ${prospectiveResultPrompt()}`;
            providerRequests = 1;
            const response = await prospectivePrompt(client, {
              agent: buildRoute.agent,
              directory: input.fixtureRoot,
              model: buildRoute.model,
              parts: [{ type: "text", text: prompt }],
              sessionID: rootId,
              ...(buildRoute.variant == null ? {} : { variant: buildRoute.variant }),
            }, `PCR ${input.stage} direct prompt`);
            const messages = await requestData<unknown[]>(client.session.messages({ directory: input.fixtureRoot, limit: 100, sessionID: rootId }) as Promise<unknown>, "PCR root messages");
            tools = prospectiveMessageTools(messages);
            const tasks = tools.filter((tool) => tool.name === "task");
            for (const task of tasks) {
              if (task.childId != null) {
                sessionIds.add(task.childId);
                childIds.set(safeChildRef(task.childId), task.childId);
              }
            }
            taskInvocations = tasks.map((task) => ({
              childRef: task.childId == null ? null : safeChildRef(task.childId),
              resumeRef: typeof task.input.task_id === "string" ? safeChildRef(task.input.task_id) : null,
              role: typeof task.input.subagent_type === "string" ? task.input.subagent_type : null,
              status: task.status === "completed" ? 0 : task.status == null ? null : 1,
              stderr: task.error,
              stdout: task.output,
            }));
            taskObserved = taskInvocations.length > 0;
            role = taskInvocations.at(-1)?.role ?? null;
            childRef = taskInvocations.at(-1)?.childRef ?? null;
            status = (response.info as { error?: unknown } | undefined)?.error == null ? 0 : 1;
            stdout = prospectiveMessageText(response);
            const resultPath = path.join(input.fixtureRoot, "result.json");
            if (fs.existsSync(resultPath)) {
              try {
                observation = parseProspectiveConsequenceObservation(JSON.parse(fs.readFileSync(resultPath, "utf8")));
              } catch {
                observation = null;
              }
            }
          } else if (input.stage === "initial-comparison") {
            const rawChildId = input.resumeRef == null ? null : childIds.get(input.resumeRef) ?? null;
            if (rawChildId == null) throw new Error("PCR continuation child identity is unavailable");
            prompt = [
              reviewerRequest,
              "Resume the current reviewer context and compare only the exact candidate supplied below against your frozen reconstruction. Do not launch another reviewer, write files, or ask a question.",
              ...(scenario.candidate.correctedContent === "none" ? [] : ["The supplied candidate is the initial candidate named in the frozen raw evidence."]),
              input.candidate ?? "<candidate-unavailable>",
              prospectiveSemanticResultPrompt(),
            ].join("\n");
            providerRequests = 1;
            const response = await prospectivePrompt(client, {
              agent: reviewerRoute.agent,
              directory: input.fixtureRoot,
              model: reviewerRoute.model,
              parts: [{ type: "text", text: prompt }],
              sessionID: rawChildId,
              tools: reviewerTools,
              ...(reviewerRoute.variant == null ? {} : { variant: reviewerRoute.variant }),
            }, "PCR exact reviewer continuation");
            const evidence = await childEvidence(input.fixtureRoot, rawChildId);
            tools = evidence.tools;
            role = evidence.role;
            childRef = safeChildRef(rawChildId);
            stdout = prospectiveMessageText(response);
            status = (response.info as { error?: unknown } | undefined)?.error == null ? 0 : 1;
            taskObserved = true;
            taskInvocations = [{ childRef, resumeRef: input.resumeRef, role, status, stderr: "", stdout }];
            observation = parseProspectiveSemanticResult(stdout, expected);
          } else {
            const candidate = input.candidate == null ? "" : `\nThe exact candidate for this comparison is:\n${input.candidate}`;
            const frozen = input.stage === "corrected-comparison" && input.frozenReconstructionRef != null
              ? `\nFrozen candidate-free reconstruction from the initial reviewer:\n${reconstructionOutputs.get(input.frozenReconstructionRef) ?? "<frozen-reconstruction-unavailable>"}`
              : "";
            prompt = input.stage === "reconstruction"
              ? `${reviewerRequest}\nComplete only the candidate-free context reconstruction. Read only case.json and system.md. Return after reconstruction; do not create any candidate artifact, inline decision frame, or result file.`
              : input.stage === "single-stage"
                ? `${reviewerRequest}\nThe candidate already exists. Perform one fresh single-stage comparison; do not reconstruct a candidate-free context, write files, or launch another reviewer.${candidate}\n${prospectiveSemanticResultPrompt()}`
                : `${reviewerRequest}\nCompare the corrected candidate against the supplied frozen candidate-free reconstruction. Do not reconstruct around the candidate, write files, or launch another reviewer.${frozen}${candidate}\n${prospectiveSemanticResultPrompt()}`;
            providerRequests = 1;
            const fresh = await freshReviewerSession(input.fixtureRoot, `prospective-${options.arm}-${scenario.id}-${input.stage}`);
            const response = await prospectivePrompt(client, {
              agent: reviewerRoute.agent,
              directory: input.fixtureRoot,
              model: reviewerRoute.model,
              parts: [{ type: "text", text: prompt }],
              sessionID: fresh.childId,
              tools: reviewerTools,
              ...(reviewerRoute.variant == null ? {} : { variant: reviewerRoute.variant }),
            }, `PCR ${input.stage} reviewer prompt`);
            const evidence = await childEvidence(input.fixtureRoot, fresh.childId);
            childRef = fresh.childRef;
            role = evidence.role;
            tools = evidence.tools;
            stdout = prospectiveMessageText(response);
            status = (response.info as { error?: unknown } | undefined)?.error == null ? 0 : 1;
            taskObserved = true;
            const hiddenIdentity = options.arm === "candidate" && scenario.id === "unverified-continuation" && input.stage === "reconstruction";
            taskInvocations = [{
              childRef: hiddenIdentity ? null : childRef,
              resumeRef: null,
              role,
              status,
              stderr: "",
              stdout,
            }];
            if (input.stage === "reconstruction") reconstructionOutputs.set(childRef, stdout);
            else observation = parseProspectiveSemanticResult(stdout, expected);
            if (hiddenIdentity) childRef = null;
          }

          const safeStdout = redactProspectiveEvidence(stdout.slice(-65_536), invocationReplacements);
          const safeStderr = redactProspectiveEvidence(stderr.slice(-16_384), invocationReplacements);
          const safeToolResults = tools.map((tool) => redactProspectiveEvidence(stableJson({
            input: tool.input,
            name: tool.name,
            output: tool.output,
            status: tool.status,
          }), invocationReplacements));
          const observedEffects = prospectiveObservedEffects(tools, input.fixtureRoot, options.repoRoot, [runtimeRoot]);
          const activeRoute = expected.route === "direct" || expected.route === "behavioral-substitution" ? buildRoute : reviewerRoute;
          runtimeDiagnostics.push({ stage: input.stage, status, stderr: safeStderr, stdout: safeStdout, taskObserved });
          return {
            childRef,
            configuredProviderRequests: providerRequests,
            environmentIdentity: {
              modelId: routeIdentity(activeRoute),
              runtimeVersion: `${installed.version}/${installed.sha256}`,
              sourceDigest: options.sourceIdentity.governedDigest,
            },
            modelVisiblePrompt: prompt,
            modelVisibleToolResults: safeToolResults,
            observation,
            observedEffects,
            role,
            status,
            stderr: safeStderr,
            stdout: safeStdout,
            taskInvocations: taskInvocations.map((task) => ({
              ...task,
              stderr: redactProspectiveEvidence(task.stderr, invocationReplacements),
              stdout: redactProspectiveEvidence(task.stdout, invocationReplacements),
            })),
            taskObserved,
          };
        } catch (error) {
          const safeError = redactProspectiveEvidence(stableJson(proofErrorFacts(error)), invocationReplacements);
          const taskObserved = expected.route !== "direct" && expected.route !== "behavioral-substitution";
          runtimeDiagnostics.push({ stage: input.stage, status: null, stderr: safeError, stdout: "", taskObserved });
          return {
            childRef: null,
            configuredProviderRequests: providerRequests,
            modelVisiblePrompt: prompt,
            modelVisibleToolResults: [],
            observation: null,
            observedEffects: [],
            role: taskObserved ? "implementation-readiness-reviewer" : null,
            status: null,
            stderr: safeError,
            stdout: "",
            taskInvocations: [],
            taskObserved,
          };
        }
      },
      cleanup: async () => {
        const directory = activeFixtureRoot;
        if (client != null && directory != null) {
          for (const parentId of rootSessionIds) {
            try {
              const children = await requestData<Array<{ id?: unknown }>>(client.session.children({ directory, sessionID: parentId }) as Promise<unknown>, "PCR cleanup child inventory");
              for (const child of children) if (typeof child.id === "string") sessionIds.add(child.id);
            } catch (error) {
              cleanupError ??= `session-children:${stableJson(proofErrorFacts(error))}`;
            }
          }
          for (const sessionId of [...sessionIds].sort((left, right) => Number(rootSessionIds.has(left)) - Number(rootSessionIds.has(right)) || left.localeCompare(right))) {
            try {
              await client.session.abort({ directory, sessionID: sessionId });
            } catch {
              // A completed or already removed session needs no abort.
            }
            try {
              const deleted = await client.session.delete({ directory, sessionID: sessionId }) as { error?: unknown };
              if (deleted.error != null) throw deleted.error;
            } catch (error) {
              cleanupError ??= `session-delete:${stableJson(proofErrorFacts(error))}`;
            }
          }
        }
        let sessionsRemoved = sessionIds.size === 0;
        if (client != null && directory != null) {
          try {
            const listed = await requestData<Array<{ id?: unknown }>>(client.session.list({ directory }) as Promise<unknown>, "PCR cleanup session list");
            const listedIds = new Set(listed.flatMap((row) => typeof row.id === "string" ? [row.id] : []));
            sessionsRemoved = [...sessionIds].every((sessionId) => !listedIds.has(sessionId));
          } catch (error) {
            cleanupError ??= `session-list:${stableJson(proofErrorFacts(error))}`;
          }
        }
        if (server != null && serverTerminal == null) {
          try {
            serverTerminal = await stopProofServer(server);
          } catch (error) {
            cleanupError ??= `server-stop:${stableJson(proofErrorFacts(error))}`;
          }
        }
        try {
          fs.rmSync(runtimeRoot, { force: true, maxRetries: 10, recursive: true, retryDelay: 100 });
        } catch (error) {
          cleanupError ??= `runtime-root:${stableJson(proofErrorFacts(error))}`;
        }
        if (fs.existsSync(runtimeRoot)) cleanupError ??= "runtime-root-remains";
        return { error: cleanupError, processesRemoved: server == null || serverTerminal != null, sessionsRemoved };
      },
    };
    const captured = await captureProspectiveConsequenceScenario({
      adapter,
      arm: options.arm,
      reconstructionCurrent: !(options.arm === "candidate" && scenario.id === "stale-reconstruction"),
      scenario,
    });
    captures.push(captured);
    const expectedControlFailure = options.arm === "candidate"
      && (scenario.id === "unverified-continuation" && captured.failure === "reconstruction-identity-unverified"
        || scenario.id === "stale-reconstruction" && captured.failure === "frozen-reconstruction-stale");
    if (!captured.cleanup.complete || captured.failure != null && !expectedControlFailure) {
      writeNewFile(path.join(options.evidenceRoot, "diagnostic.json"), stableJson({
        arm: options.arm,
        capture: captured,
        configuredProviderRequestCount: captured.configuredProviderRequestCount,
        runtimeDiagnostics,
        scenarioId: scenario.id,
        sourceDigest: options.sourceIdentity.governedDigest,
      }));
      if (!captured.cleanup.complete) {
        throw new ContractError(`${scenario.id}.cleanup`, `PCR configured cleanup is not terminal: ${stableJson(captured.cleanup)}`);
      }
      throw new ContractError(`${scenario.id}.capture`, `PCR configured capture failed: ${captured.failure}`);
    }
  }

  const lane = sealProspectiveConsequenceRehearsalLane({
    arm: options.arm,
    candidateId: options.candidateId,
    captures,
    packDigest: options.packDigest,
    sourceIdentity: options.sourceIdentity,
  });
  writeNewFile(path.join(options.evidenceRoot, "lane.json"), stableJson(lane));
  return lane;
}
