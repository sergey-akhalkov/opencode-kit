import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { loadModelProfile } from "../../model-profile.ts";
import {
  assertProofRouteAvailable,
  configuredProofServerEnvironment,
  disabledToolMap,
  installedOpenCodeIdentity,
  proofClient,
  proofErrorFacts,
  proofServerStartupFailure,
  proofServerStartupFacts,
  proofServerLogs,
  runSummarizedProofSession,
  seedProofModelsCatalog,
  startProofServer,
  stopProofServer,
  waitForProofRoute,
  type ProofServerHandle,
  type SummarizedProofEvidence,
} from "../lib/opencode-proof-client.ts";
import { removeProofFixture } from "../lib/proof-process-cleanup.ts";
import { commandFact, createCaptureBundle, environmentOf, sealSample } from "./capture.ts";
import {
  type Arm,
  type CaptureBundle,
  type DecisionGapPack,
  type SampleEvidence,
  type SourceIdentity,
  argumentDigest,
  assertContained,
  defaultRedactions,
  digestOf,
  hashFiles,
  redactText,
  sha256,
} from "./contracts.ts";

const STATUS_SCOPE_PERMISSION = "deny" as const;

type StatusScopeCaptureOptions = {
  arm: Arm;
  candidateConfigDir?: string;
  candidateId: string;
  evidenceRoot: string;
  executable: string;
  repoRoot: string;
  sourceIdentity: SourceIdentity;
};

export function statusScopeConfiguredRoutes(configDir: string): {
  compaction: { model: string; variant: string };
  main: { model: string; variant: string };
} {
  const config = JSON.parse(fs.readFileSync(path.join(configDir, "opencode.json"), "utf8")) as {
    agent?: Record<string, { model?: unknown; variant?: unknown }>;
  };
  const route = (agent: string): { model: string; variant: string } => {
    const value = config.agent?.[agent];
    if (typeof value?.model !== "string" || typeof value.variant !== "string") {
      throw new Error(`Configured status-scope route is incomplete: ${agent}`);
    }
    return { model: value.model, variant: value.variant };
  };
  return { compaction: route("compaction"), main: route("build") };
}

function emptyRoundtrip(): SummarizedProofEvidence {
  return {
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
}

export async function captureStatusScopeLane(
  pack: DecisionGapPack,
  scenarioDigest: string,
  options: StatusScopeCaptureOptions,
): Promise<CaptureBundle> {
  if (pack.name !== "status-scope" || pack.statusScope == null || pack.manifest.scenarios.length !== 1) {
    throw new Error("captureStatusScopeLane requires the reviewed status-scope pack");
  }
  if (fs.existsSync(options.evidenceRoot) && fs.readdirSync(options.evidenceRoot).length > 0) {
    throw new Error("evidence root must be create-new");
  }
  fs.mkdirSync(options.evidenceRoot, { recursive: true });
  const scenario = pack.manifest.scenarios[0];
  const proofRoot = fs.mkdtempSync(path.join(os.tmpdir(), "consumer-outcome-status-scope-"));
  const fixtureRoot = path.join(proofRoot, "fixture");
  const seedRoot = assertContained(options.repoRoot, path.join(options.repoRoot, scenario.fixturePath), scenario.id);
  fs.cpSync(seedRoot, fixtureRoot, { recursive: true });
  const initialFiles = hashFiles(fixtureRoot, scenario.initialManifest.files);
  const fixtureDigest = digestOf(initialFiles);
  const cases = fs.readFileSync(path.join(fixtureRoot, "cases.json"), "utf8").trim();
  const mainPrompt = `${scenario.request}\n\nSTATUS_SCOPE_FACTS:\n${cases}`;
  const configDir = options.arm === "candidate" && options.candidateConfigDir != null
    ? options.candidateConfigDir
    : path.join(options.repoRoot, "global");
  const profile = loadModelProfile(options.repoRoot, pack.manifest.profile).profile;
  const configuredRoutes = statusScopeConfiguredRoutes(configDir);
  for (const relative of ["cache", "config-home", "data/opencode", "state"]) {
    fs.mkdirSync(path.join(proofRoot, relative), { recursive: true });
  }
  const modelsCatalog = seedProofModelsCatalog(proofRoot, [configuredRoutes.main.model, configuredRoutes.compaction.model]);
  const environment = configuredProofServerEnvironment(process.env, configDir, proofRoot, {
    ...profile,
    permission: STATUS_SCOPE_PERMISSION,
  });
  const redactions = defaultRedactions(proofRoot, options.repoRoot);
  const openCode = installedOpenCodeIdentity(options.executable);
  let server: ProofServerHandle | null = null;
  let serverTerminal: { signal: NodeJS.Signals | null; status: number | null } | null = null;
  let roundtrip = emptyRoundtrip();
  let mainRoute = `${configuredRoutes.main.model}/${configuredRoutes.main.variant}`;
  let compactionRoute = `${configuredRoutes.compaction.model}/${configuredRoutes.compaction.variant}`;
  let captureError: unknown = null;
  let captureErrorStage = "server-start";
  let processCleanupError: unknown = null;
  let validation = commandFact(fixtureRoot, scenario.validationArgv);
  let proof = commandFact(fixtureRoot, scenario.proofExpectations.argv);
  try {
    server = await startProofServer(options.executable, fixtureRoot, environment);
    captureErrorStage = "session-roundtrip";
    const client = proofClient(server.url, fixtureRoot);
    const main = await waitForProofRoute(client, fixtureRoot, "build", 15_000);
    const compaction = await waitForProofRoute(client, fixtureRoot, "compaction", 15_000);
    mainRoute = `${main.model.providerID}/${main.model.modelID}/${main.variant ?? "default"}`;
    compactionRoute = `${compaction.model.providerID}/${compaction.model.modelID}/${compaction.variant ?? "default"}`;
    const expectedMain = `${configuredRoutes.main.model}/${configuredRoutes.main.variant}`;
    const expectedCompaction = `${configuredRoutes.compaction.model}/${configuredRoutes.compaction.variant}`;
    if (mainRoute !== expectedMain || compactionRoute !== expectedCompaction) {
      throw new Error(`Configured route mismatch: main=${mainRoute} compaction=${compactionRoute}`);
    }
    await assertProofRouteAvailable(client, fixtureRoot, main);
    await assertProofRouteAvailable(client, fixtureRoot, compaction);
    const tools = await disabledToolMap(client, fixtureRoot);
    roundtrip = await runSummarizedProofSession({
      client,
      compactionRoute: compaction,
      directory: fixtureRoot,
      mainPrompt,
      mainRoute: main,
      reconstructionPrompt: pack.statusScope.reconstructionRequest,
      title: `consumer-outcome-${options.arm}-status-scope`,
      tools,
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
        processCleanupError = error;
      }
    }
    try {
      removeProofFixture(proofRoot);
    } catch (error) {
      processCleanupError ??= error;
    }
  }
  const logs = server == null ? { stderr: "", stdout: "" } : proofServerLogs(server);
  const startupFacts = proofServerStartupFacts(logs.stdout, logs.stderr, configDir, [proofRoot]);
  const fixtureRemoved = !fs.existsSync(proofRoot);
  const processesRemoved = server != null && serverTerminal != null && processCleanupError == null;
  const sessionsRemoved = roundtrip.cleanup.sessionsRemoved && roundtrip.cleanup.error == null;
  const failure = captureError ?? processCleanupError;
  const failureFacts = failure == null ? null : proofErrorFacts(failure);
  const combinedError = roundtrip.error ?? (failureFacts == null ? null : { facts: failureFacts, stage: captureErrorStage });
  const statusScope: NonNullable<SampleEvidence["statusScope"]> = {
    compactionContext: redactText(roundtrip.compactionContext, redactions),
    compactionRoute,
    error: combinedError,
    mainResponse: redactText(roundtrip.mainResponse, redactions),
    mainRoute,
    messages: {
      assistant: roundtrip.messages.assistant.map((message) => ({ ...message, text: redactText(message.text, redactions) })),
      toolCalls: roundtrip.messages.toolCalls,
    },
    providerRequestCount: roundtrip.providerRequestCount,
    reconstructionResponse: redactText(roundtrip.reconstructionResponse, redactions),
    server: {
      argv: ["<installed-opencode>/opencode.exe", "serve", "--hostname", "127.0.0.1", "--port", "<ephemeral>", "--print-logs", "--log-level", "INFO"],
      executableSha256: openCode.sha256,
      signal: serverTerminal?.signal ?? null,
      status: serverTerminal?.status ?? null,
      stderr: redactText(logs.stderr.slice(-32_768), redactions),
      stdout: redactText(logs.stdout.slice(-32_768), redactions),
    },
    sessionID: roundtrip.sessionID,
    summarizeAccepted: roundtrip.summarizeAccepted,
  };
  const toolCalls = roundtrip.messages.toolCalls.map((tool) => ({
    argumentDigest: argumentDigest(null),
    name: tool.name,
    status: tool.status,
  }));
  const commandStatus = combinedError == null && roundtrip.providerRequestCount === 3 ? 0 : 1;
  const sample = sealSample({
    arm: options.arm,
    cleanup: {
      complete: fixtureRemoved && processesRemoved && sessionsRemoved,
      error: fixtureRemoved && processesRemoved && sessionsRemoved ? null : "status-scope cleanup incomplete",
      fixtureRemoved,
      processesRemoved,
      sessionsRemoved,
    },
    command: {
      argv: statusScope.server.argv,
      status: commandStatus,
      stderr: failureFacts == null ? "" : JSON.stringify(failureFacts),
      stdout: [statusScope.mainResponse, statusScope.reconstructionResponse].filter(Boolean).join("\n"),
    },
    diagnostics: {
      elapsedMs: null,
      tokens: roundtrip.messages.assistant.map((message) => ({ modelID: message.modelID, providerID: message.providerID })),
      truncatedFields: [logs.stderr.length > 32_768 ? "statusScope.server.stderr" : "", logs.stdout.length > 32_768 ? "statusScope.server.stdout" : ""].filter(Boolean),
    },
    environmentIdentity: {
      ...environmentOf(
        pack.manifest,
        scenario,
        scenarioDigest,
        fixtureDigest,
        `${mainRoute}|compaction=${compactionRoute}`,
        `${configuredRoutes.main.variant}|compaction=${configuredRoutes.compaction.variant}`,
        openCode.version,
      ),
      dependencyIdentity: `${process.version}|models=${modelsCatalog.sha256}`,
    },
    files: initialFiles,
    forbiddenEffects: scenario.forbiddenEffects.map((name) => ({
      name,
      observed: (name === "install" || name === "remote") && startupFacts.ripgrepDownloadRequested,
    })),
    friction: {
      configuredProviderRequestCount: roundtrip.providerRequestCount,
      duplicateFailedToolInvocationCount: 0,
      failedToolCallCount: toolCalls.filter((tool) => tool.status !== "completed").length,
      ownerQuestionCount: 0,
      totalToolCallCount: toolCalls.length,
    },
    permissions: {
      ...scenario.permissions,
      violations: toolCalls.map((tool) => `unexpected-tool:${tool.name}`),
    },
    proof: {
      argv: proof.argv,
      status: proof.status,
      stderr: redactText(proof.stderr, redactions),
      stdout: redactText(proof.stdout, redactions),
    },
    requestSha256: sha256(mainPrompt),
    sampleIndex: 1,
    scenarioId: scenario.id,
    schemaVersion: 1,
    sideEffects: scenario.allowedEffects,
    sourceIdentity: options.sourceIdentity,
    statusScope,
    toolCalls,
    validation: {
      argv: validation.argv,
      status: validation.status,
      stderr: redactText(validation.stderr, redactions),
      stdout: redactText(validation.stdout, redactions),
    },
  });
  return createCaptureBundle({
    candidateId: options.candidateId,
    evidenceRoot: options.evidenceRoot,
    kind: options.arm,
    samples: [sample],
    scenarioDigest,
    sourceIdentity: options.sourceIdentity,
  });
}
