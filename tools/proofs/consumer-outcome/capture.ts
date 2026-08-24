import fs from "node:fs";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import { runPortableCommand } from "../../../global/bin/portable-process.ts";
import { loadModelProfile } from "../../model-profile.ts";
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
  ContractError,
  SAMPLE_BYTE_LIMIT,
  SCHEMA_VERSION,
  argumentDigest,
  assertContained,
  bundleByteLength,
  defaultRedactions,
  digestOf,
  evaluatorDigest,
  hashFiles,
  osClass,
  redactText,
  sha256,
  stableJson,
  writeNewFile,
} from "./contracts.ts";

export type CaptureFailureKind = "none" | "model" | "tool" | "validation" | "evidence" | "timeout" | "cleanup";
export type SessionMode = "harness" | "configured";

const CONFIGURED_PERMISSION = {
  "*": "deny",
  bash: { "*": "deny", "node *": "allow", "node.exe *": "allow", "*;*": "deny", "*&&*": "deny", "*|*": "deny", "*>*": "deny", "*<*": "deny" },
  edit: "allow",
  external_directory: "deny",
  glob: "allow",
  grep: "allow",
  question: "deny",
  read: "allow",
  skill: "deny",
  task: "deny",
  webfetch: "deny",
} as const;

export type CaptureOptions = {
  candidateConfigDir?: string;
  candidateId: string;
  evidenceRoot: string;
  failure: CaptureFailureKind;
  gitRef: string;
  kind: "baseline" | "candidate" | "matched";
  repoRoot: string;
  sessionMode: SessionMode;
  sourceIdentity: SourceIdentity;
};

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

function copySeed(source: string, target: string): void {
  fs.cpSync(source, target, { recursive: true });
}

function loadApply(repoRoot: string, fixtureId: string): LocalApply {
  const parsed = JSON.parse(fs.readFileSync(path.join(repoRoot, "tools/proofs/fixtures/consumer-outcome/apply", `${fixtureId}.json`), "utf8")) as LocalApply;
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

function commandFact(root: string, argv: string[], timeoutMs = 30_000): { argv: string[]; status: number | null; stderr: string; stdout: string } {
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

function environmentOf(
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

function sealSample(sample: Omit<SampleEvidence, "hashes">): SampleEvidence {
  const sealed: SampleEvidence = { ...sample, hashes: { sample: "" } };
  sealed.hashes.sample = digestOf({ ...sealed, hashes: { sample: "" } });
  if (Buffer.byteLength(stableJson(sealed), "utf8") > SAMPLE_BYTE_LIMIT) sealed.diagnostics.truncatedFields.push("sample");
  return sealed;
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
  const bundle: CaptureBundle = {
    byteLength: 0,
    comparisonIdentity: digestOf({ candidateId: options.candidateId, kind: options.kind, scenarioDigest }),
    evaluatorDigest: evaluatorDigest(),
    inventory: ["bundle.json"],
    kind: options.kind,
    samples,
    scenarioDigest,
    schemaVersion: SCHEMA_VERSION,
    sourceIdentity: options.sourceIdentity,
  };
  bundle.byteLength = bundleByteLength(bundle);
  if (bundle.byteLength > CAPTURE_BYTE_LIMIT) throw new ContractError("bundle.byteLength", "capture exceeds the reviewed byte bound");
  writeNewFile(path.join(options.evidenceRoot, "bundle.json"), stableJson(bundle));
  return bundle;
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
    copySeed(seedRoot, fixtureRoot);
    const initial = hashFiles(fixtureRoot, scenario.initialManifest.files);
    if (options.sessionMode !== "configured") provider = await startLocalProvider(options.failure);
    if (options.failure === "evidence") fs.writeFileSync(path.join(fixtureRoot, "leak.txt"), "api_key=sk-injected-secret-value\n");
    let command = { argv: ["local-provider", "--url", "<provider>"], status: 0 as number | null, stderr: "", stdout: "" };
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
      runtimeVersion = "opencode";
      const environment = {
        ...process.env,
        OPENCODE_CONFIG_CONTENT: JSON.stringify({
          ...loaded.profile,
          permission: CONFIGURED_PERMISSION,
        }),
        OPENCODE_CONFIG_DIR: arm === "candidate" && options.candidateConfigDir != null
          ? options.candidateConfigDir
          : path.join(options.repoRoot, "global"),
        OPENCODE_PURE: "1",
        XDG_CACHE_HOME: path.join(proofRoot, "xdg-cache"),
        XDG_STATE_HOME: path.join(proofRoot, "xdg-state"),
      };
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
      const result = runPortableCommand(options.repoRoot, argv, {
        capture: true,
        env: environment,
        timeoutMs: options.failure === "timeout" ? 50 : 180_000,
      });
      const stdoutLimit = Math.min(scenario.evidenceByteBound, 65_536);
      command = { argv, status: result.status, stderr: result.stderr.slice(0, 4_000), stdout: result.stdout.slice(0, stdoutLimit) };
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
      applySeed(fixtureRoot, loadApply(options.repoRoot, scenario.fixtureId));
    }
    const validation = options.failure === "validation"
      ? { argv: scenario.validationArgv, status: 1 as number | null, stderr: "injected validation failure", stdout: "" }
      : commandFact(fixtureRoot, scenario.validationArgv);
    const proof = commandFact(fixtureRoot, scenario.proofExpectations.argv);
    const tools = configuredTools ?? toolFacts(options.failure);
    const files = hashFiles(fixtureRoot, [...new Set([...scenario.initialManifest.files, ...scenario.expectedOutcome.stateFiles])].sort((left, right) => left.localeCompare(right)));
    draft = {
      arm,
      cleanup: { ...scenario.cleanupOracle, complete: false, error: null },
      command: {
        argv: command.argv.map((value) => redactText(value, replacements)),
        status: command.status,
        stderr: redactText(command.stderr, replacements),
        stdout: redactText(command.stdout, replacements),
      },
      diagnostics: { elapsedMs: null, tokens: null, truncatedFields: [] },
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
