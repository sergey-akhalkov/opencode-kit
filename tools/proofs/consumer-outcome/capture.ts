import fs from "node:fs";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import { type PortableCommandResult, runPortableCommand } from "../../../global/bin/portable-process.ts";
import { loadModelProfile } from "../../model-profile.ts";
import {
  type DiagnosticProofEvidence,
  type ProofServerHandle,
  assertProofRouteAvailable,
  configuredProofServerEnvironment,
  installedOpenCodeIdentity,
  proofClient,
  proofErrorFacts,
  proofServerLogs,
  proofServerStartupFacts,
  proofServerStartupFailure,
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

export type CaptureFailureKind = "none" | "model" | "tool" | "validation" | "evidence" | "timeout" | "cleanup";
export type SessionMode = "harness" | "configured";
export const FOUNDATION_SERVER_PROMPT_TIMEOUT_MS = 420_000;

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

function configuredPermission(scenario: RegressionManifest["scenarios"][number]): Record<string, unknown> {
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
    inventory: input.inventory ?? ["bundle.json"],
    kind: input.kind,
    samples: input.samples,
    scenarioDigest: input.scenarioDigest,
    schemaVersion: SCHEMA_VERSION,
    sourceIdentity: input.sourceIdentity,
  };
  bundle.byteLength = bundleByteLength(bundle);
  if (bundle.byteLength > CAPTURE_BYTE_LIMIT) throw new ContractError("bundle.byteLength", "capture exceeds the reviewed byte bound");
  writeNewFile(path.join(input.evidenceRoot, "bundle.json"), stableJson(bundle));
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
  for (const relative of ["cache", "config-home", "data", "state"]) visit(path.join(proofRoot, relative));
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
  const configDir = options.candidateConfigDir ?? path.join(options.repoRoot, "global");
  const profile = loadModelProfile(options.repoRoot, manifest.profile).profile;
  const configuredRoute = profile.agent.build;
  for (const relative of ["cache", "config-home", "data/opencode", "state"]) {
    fs.mkdirSync(path.join(proofRoot, relative), { recursive: true });
  }
  const modelsCatalog = seedProofModelsCatalog(proofRoot, [configuredRoute.model]);
  const environment = configuredProofServerEnvironment(process.env, configDir, proofRoot, {
    ...profile,
    permission: configuredPermission(scenario),
  });
  const redactions = defaultRedactions(proofRoot, options.repoRoot);
  const openCode = installedOpenCodeIdentity(options.executable);
  let server: ProofServerHandle | null = null;
  let serverTerminal: { signal: NodeJS.Signals | null; status: number | null } | null = null;
  let roundtrip = emptyDiagnosticEvidence();
  let resolvedRoute = `${configuredRoute.model}/${configuredRoute.variant}`;
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
  const safeDiagnostic = sealConfiguredDiagnostic(diagnostic);
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
    inventory: ["bundle.json", "diagnostic.json"],
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
        stdout: result.stdout.slice(0, stdoutLimit),
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
