#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { captureLane } from "./proofs/consumer-outcome/capture.ts";
import {
  type CaptureBundle,
  type EnvironmentIdentity,
  type FrictionVector,
  type SampleEvidence,
  type SourceIdentity,
  type StatusScopeDecisionSet,
  ContractError,
  digestOf,
  emptyFriction,
  evaluatorDigest,
  governedSourceIdentity,
  loadDecisionGapPack,
  loadManifest,
  parseCandidateRequest,
  parseDecisionGapPack,
  parseManifest,
  posixPath,
  stableJson,
  verifyFixtureSeed,
} from "./proofs/consumer-outcome/contracts.ts";
import { evaluateBundle, evaluateDecisionGapPack, gateCurrent, replayEvaluation } from "./proofs/consumer-outcome/evaluate.ts";
import { assertProofRouteAvailable, configuredProofServerEnvironment, proofServerLogs, proofServerStartupFacts, proofServerStartupFailure, runSummarizedProofSession, seedProofModelsCatalog, startProofServer, waitForProofRoute, type ProofRoute } from "./proofs/lib/opencode-proof-client.ts";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const cli = path.join(root, "tools/proofs/consumer-outcome-regression.ts");

type TestCase = { name: string; run: () => Promise<void> | void };

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function tempDir(name: string): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), `consumer-outcome-test-${name}-`));
}

function env(overrides: Partial<EnvironmentIdentity> = {}): EnvironmentIdentity {
  return {
    dependencyIdentity: "node-test",
    initialFixtureDigest: "fixture",
    model: "proof/proof-model",
    opencodeVersion: "local-fixture",
    osClass: "windows",
    permissionDigest: "perm",
    profile: "quality-independent",
    scenarioDigest: "scenario",
    validationArgvDigest: "validation",
    variant: "none",
    ...overrides,
  };
}

function source(digest = "source-a"): SourceIdentity {
  return { gitRef: "HEAD", governedDigest: digest, kind: "staged-ref", pathDigests: [{ path: "global/AGENTS.md", sha256: digest }] };
}

function seal(sample: Omit<SampleEvidence, "hashes">): SampleEvidence {
  const next: SampleEvidence = { ...sample, hashes: { sample: "" } };
  next.hashes.sample = digestOf({ ...next, hashes: { sample: "" } });
  return next;
}

function sample(partial: Partial<SampleEvidence> & Pick<SampleEvidence, "arm" | "sampleIndex" | "scenarioId">): SampleEvidence {
  return seal({
    cleanup: { complete: true, error: null, fixtureRemoved: true, processesRemoved: true, sessionsRemoved: true },
    command: { argv: ["local-provider"], status: 0, stderr: "", stdout: "" },
    diagnostics: { elapsedMs: null, tokens: null, truncatedFields: [] },
    environmentIdentity: env({ initialFixtureDigest: partial.scenarioId }),
    forbiddenEffects: [{ name: "remote", observed: false }],
    friction: emptyFriction(),
    permissions: { allow: ["edit"], deny: ["question"], violations: [] },
    proof: {
      argv: ["node"],
      status: 0,
      stderr: "",
      stdout: partial.scenarioId === "ordinary-small-greeting" ? "Hello, Ada" : "{\"status\":\"ok\",\"count\":1}",
    },
    requestSha256: "r",
    schemaVersion: 1,
    sideEffects: ["local-write"],
    sourceIdentity: source(),
    toolCalls: [],
    validation: { argv: ["node"], status: 0, stderr: "", stdout: "OK" },
    ...partial,
    files: partial.files ?? [
      { path: partial.scenarioId === "ordinary-small-greeting" ? "src/greet.ts" : "src/report.ts", sha256: "a" },
      { path: partial.scenarioId === "ordinary-small-greeting" ? "test/greet.test.ts" : "test/report.test.ts", sha256: "b" },
    ],
  });
}

function bundleOf(samples: SampleEvidence[], kind: CaptureBundle["kind"] = "baseline"): CaptureBundle {
  const bundle: CaptureBundle = {
    byteLength: 0,
    comparisonIdentity: "cmp",
    evaluatorDigest: evaluatorDigest(),
    inventory: ["bundle.json"],
    kind,
    samples,
    scenarioDigest: "scenario",
    schemaVersion: 1,
    sourceIdentity: samples[0]?.sourceIdentity ?? source(),
  };
  bundle.byteLength = bundle.samples.reduce((sum, row) => sum + Buffer.byteLength(stableJson(row), "utf8"), 0);
  return bundle;
}

function statusScopeSample(input: {
  arm: "baseline" | "candidate";
  expected: StatusScopeDecisionSet;
  providerRequestCount?: number;
  reconstructionExpected?: StatusScopeDecisionSet;
  scenario: ReturnType<typeof loadDecisionGapPack>["pack"]["manifest"]["scenarios"][number];
}): SampleEvidence {
  const providerRequestCount = input.providerRequestCount ?? 3;
  const mainResponse = stableJson(input.expected);
  const reconstructionResponse = stableJson(input.reconstructionExpected ?? input.expected);
  return sample({
    arm: input.arm,
    command: { argv: ["opencode", "serve", "--port", "<ephemeral>"], status: 0, stderr: "", stdout: `${mainResponse}\n${reconstructionResponse}` },
    environmentIdentity: env({ initialFixtureDigest: input.scenario.id, model: "openai/gpt-5.6-sol/xhigh|compaction=openai/gpt-5.6-sol/xhigh", variant: "xhigh|compaction=xhigh" }),
    files: [
      { path: "global/AGENTS.md", sha256: "1".repeat(64) },
      { path: "global/opencode.json", sha256: "2".repeat(64) },
    ],
    forbiddenEffects: input.scenario.forbiddenEffects.map((name) => ({ name, observed: false })),
    friction: { ...emptyFriction(), configuredProviderRequestCount: providerRequestCount },
    permissions: { ...input.scenario.permissions, violations: [] },
    proof: { argv: input.scenario.proofExpectations.argv, status: 0, stderr: "", stdout: input.scenario.proofExpectations.stdoutIncludes.join(" ") },
    sampleIndex: 1,
    scenarioId: input.scenario.id,
    sideEffects: input.scenario.allowedEffects,
    statusScope: {
      compactionContext: stableJson(input.expected),
      compactionRoute: "openai/gpt-5.6-sol/xhigh",
      error: null,
      mainResponse,
      mainRoute: "openai/gpt-5.6-sol/xhigh",
      messages: {
        assistant: [
          { agent: "build", error: null, finish: "stop", modelID: "gpt-5.6-sol", providerID: "openai", summary: false, text: mainResponse },
          { agent: "compaction", error: null, finish: "stop", modelID: "gpt-5.6-sol", providerID: "openai", summary: true, text: stableJson(input.expected) },
          { agent: "build", error: null, finish: "stop", modelID: "gpt-5.6-sol", providerID: "openai", summary: false, text: reconstructionResponse },
        ],
        toolCalls: [],
      },
      providerRequestCount,
      reconstructionResponse,
      server: { argv: ["opencode", "serve"], executableSha256: "3".repeat(64), signal: null, status: 0, stderr: "", stdout: "server ready" },
      sessionID: "session-test",
      summarizeAccepted: true,
    },
    validation: { argv: input.scenario.validationArgv, status: 0, stderr: "", stdout: "validation passed" },
  });
}

function arms(scenarioId: string, friction: FrictionVector, sourceDigest?: string): SampleEvidence[] {
  return [1, 2, 3].map((sampleIndex) => sample({
    arm: scenarioId.endsWith("-c") ? "candidate" : "baseline",
    friction,
    sampleIndex,
    scenarioId: scenarioId.replace(/-c$/, ""),
    sourceIdentity: source(sourceDigest),
  }));
}

function invokeCli(args: string[], cwd = root, environment: NodeJS.ProcessEnv = {}): { status: number | null; stderr: string; stdout: string } {
  const result = spawnSync(process.execPath, [cli, ...args], { cwd, encoding: "utf8", env: { ...process.env, ...environment }, timeout: 60_000 });
  return { status: result.status, stderr: result.stderr ?? "", stdout: result.stdout ?? "" };
}

const tests: TestCase[] = [
  {
    name: "configured proof environment pins ripgrep and route readiness matches the installed SDK agent shape",
    async run() {
      const runtime = tempDir("configured-proof-environment");
      try {
        const environment = configuredProofServerEnvironment(process.env, path.join(root, "global"), runtime, { model: "openai/gpt-5.6-sol" });
        const firstPath = environment.PATH?.split(path.delimiter)[0] ?? "";
        assert(firstPath !== "" && fs.existsSync(path.join(firstPath, process.platform === "win32" ? "rg.exe" : "rg")), "configured proof environment must pin installed ripgrep first on PATH");
        assert(environment.OPENCODE_PURE === "1" && environment.OPENCODE_DISABLE_DEFAULT_PLUGINS == null, "configured proof must retain internal provider plugins while suppressing external plugins");
        assert(environment.OPENCODE_DB === path.join(runtime, "data", "opencode", "opencode.db"), "configured proof database must remain under the proof root");
        const catalog = seedProofModelsCatalog(runtime, ["openai/gpt-5.6-sol", "xai/grok-4.6"]);
        assert(/^[a-f0-9]{64}$/.test(catalog.sha256) && fs.existsSync(path.join(runtime, "cache", "opencode", "models.json")), "configured proof must seed the reviewed cached model catalog");
        let listCalls = 0;
        const client = {
          provider: {
            list: async () => ({ data: { all: [{ id: "openai", models: { "gpt-5.6-sol": {} } }], connected: ["openai"], default: {} } }),
          },
          v2: {
            agent: {
              list: async () => ({ data: listCalls++ === 0 ? [] : [{ hidden: false, id: "build", model: { id: "gpt-5.6-sol", providerID: "openai", variant: "xhigh" } }] }),
            },
          },
        } as unknown as Parameters<typeof waitForProofRoute>[0];
        const route = await waitForProofRoute(client, runtime, "build", 1_000);
        await assertProofRouteAvailable(client as Parameters<typeof assertProofRouteAvailable>[0], runtime, route);
        assert(route.model.modelID === "gpt-5.6-sol" && route.model.providerID === "openai" && route.variant === "xhigh", JSON.stringify(route));
        assert(listCalls === 2, `route wait must retry an initially empty list, calls=${listCalls}`);
        assert(proofServerStartupFacts("", "downloading ripgrep", path.join(root, "global")).ripgrepDownloadRequested, "startup facts must classify a ripgrep download request");
      } finally {
        fs.rmSync(runtime, { force: true, recursive: true });
      }
    },
  },
  {
    name: "proof server startup failure retains terminal process and diagnostic streams",
    async run() {
      const directory = tempDir("proof-server-startup-failure");
      try {
        let captured: unknown = null;
        try {
          await startProofServer(process.execPath, directory, process.env, 2_000);
        } catch (error) {
          captured = error;
        }
        const failure = proofServerStartupFailure(captured);
        assert(failure != null, "startup failure must retain its proof-server handle");
        assert(failure.terminal?.status === 1, `expected terminal exit 1, got ${JSON.stringify(failure.terminal)}`);
        assert(proofServerLogs(failure.server).stderr.trim() !== "", "startup failure must retain child stderr for redacted capture");
      } finally {
        fs.rmSync(directory, { force: true, recursive: true });
      }
    },
  },
  {
    name: "summarized proof session performs three provider requests, retains summary context, and deletes the session",
    async run() {
      const expected = "{\"members\":[{\"id\":\"known\"}]}";
      const reconstructed = "{\"members\":[{\"id\":\"known\"}]}";
      const summary = `Retained status context: ${expected}`;
      const calls: string[] = [];
      const promptInputs: Array<Record<string, unknown>> = [];
      let promptCount = 0;
      const message = (text: string, isSummary = false) => ({
        info: { agent: isSummary ? "compaction" : "build", finish: "stop", modelID: "gpt-5.6-sol", providerID: "openai", role: "assistant", summary: isSummary },
        parts: [{ text, type: "text" }],
      });
      const client = {
        session: {
          abort: async () => { calls.push("abort"); return { data: true }; },
          create: async () => { calls.push("create"); return { data: { id: "session-provider-free" } }; },
          delete: async () => { calls.push("delete"); return { data: true }; },
          messages: async () => {
            calls.push("messages");
            return { data: promptCount === 1 ? [message(expected), message(summary, true)] : [message(summary, true), message(reconstructed)] };
          },
          prompt: async (input: Record<string, unknown>) => {
            calls.push("prompt");
            promptInputs.push(input);
            const text = promptCount++ === 0 ? expected : reconstructed;
            return { data: message(text) };
          },
          summarize: async () => { calls.push("summarize"); return { data: true }; },
        },
      } as unknown as Parameters<typeof runSummarizedProofSession>[0]["client"];
      const route: ProofRoute = { agent: "build", hidden: false, model: { modelID: "gpt-5.6-sol", providerID: "openai" }, variant: "xhigh" };
      const result = await runSummarizedProofSession({
        client,
        compactionRoute: { ...route, agent: "compaction" },
        directory: ".",
        mainPrompt: "main",
        mainRoute: route,
        reconstructionPrompt: "reconstruct",
        timeoutMs: 1_000,
        title: "provider-free-test",
        tools: {},
      });
      assert(result.error == null, `unexpected summarized-session error: ${JSON.stringify(result.error)}`);
      assert(result.providerRequestCount === 3, "summarized session must count main, summarize, and reconstruction requests");
      assert(result.compactionContext === summary, "summarized session must retain the actual summary message");
      assert(result.mainResponse === expected && result.reconstructionResponse === reconstructed, "summarized session must retain both assistant responses");
      assert(result.cleanup.sessionsRemoved && result.cleanup.error == null, "summarized session must delete its session");
      assert(calls.join(",") === "create,prompt,summarize,messages,prompt,messages,delete", `unexpected summarized-session call order: ${calls.join(",")}`);
      assert(promptInputs.length === 2 && promptInputs.every((input) => !("model" in input) && !("variant" in input)), "configured agent prompts must not override their resolved route");
    },
  },
  {
    name: "reviewed scenarios load deterministically",
    run: () => {
      const first = loadManifest(root);
      const second = loadManifest(root);
      assert(first.digest === second.digest, "scenario digest must be stable");
      assert(first.manifest.scenarios.map((row) => row.id).join(",") === "ordinary-small-greeting,openspec-add-json-output", "scenario order");
    },
  },
  {
    name: "focused decision pack is explicit, generic, and separate from the maintained baseline",
    run: () => {
      const manifestPath = path.join(root, "config/consumer-outcome-regression.json");
      const pointerPath = path.join(root, "config/consumer-outcome-baseline.json");
      const beforeManifest = fs.readFileSync(manifestPath);
      const beforePointer = fs.readFileSync(pointerPath);
      const first = loadDecisionGapPack(root);
      const second = loadDecisionGapPack(root);
      assert(first.digest === second.digest, "focused pack digest must be stable");
      assert(first.pack.manifest.sampleCount === 1, "focused pack must use one sample per arm");
      assert(first.pack.manifest.pairOrder.join(",") === "B1,C1", "focused pack pair order must be explicit");
      assert(first.pack.manifest.scenarios.every((row) => row.configuredProviderRequestBound === 8), "focused provider bound must be eight");
      assert(Object.keys(first.pack.expectedDecisions).join(",") === "representative-finite-population,exact-finite-environment,unavailable-real-oracle,ordinary-small-exact-case", "focused decision order");
      assert(Buffer.compare(beforeManifest, fs.readFileSync(manifestPath)) === 0, "focused load must not rewrite the general manifest");
      assert(Buffer.compare(beforePointer, fs.readFileSync(pointerPath)) === 0, "focused load must not rewrite the maintained baseline pointer");

      const raw = JSON.parse(fs.readFileSync(path.join(root, "tools/proofs/fixtures/consumer-outcome/claim-evidence-decision-gap.json"), "utf8")) as Record<string, unknown>;
      const inferred = structuredClone(raw);
      inferred.inferredExpectation = "improvement";
      let failed = false;
      try {
        parseDecisionGapPack(inferred);
      } catch (error) {
        failed = error instanceof ContractError && error.message.includes("inferredExpectation");
      }
      assert(failed, "semantic expectation inference must fail before effects");
      const promoted = structuredClone(raw);
      promoted.expectation = "improvement";
      failed = false;
      try {
        parseDecisionGapPack(promoted);
      } catch (error) {
        failed = error instanceof ContractError && error.message.includes("no-regression");
      }
      assert(failed, "focused pack must reject baseline promotion expectations");
    },
  },
  {
    name: "shift-left pack preflight is exact, bounded, and rejects malformed inputs before effects",
    run: () => {
      const manifestPath = path.join(root, "config/consumer-outcome-regression.json");
      const pointerPath = path.join(root, "config/consumer-outcome-baseline.json");
      const claimPackPath = path.join(root, "tools/proofs/fixtures/consumer-outcome/claim-evidence-decision-gap.json");
      const before = [manifestPath, pointerPath, claimPackPath].map((file) => fs.readFileSync(file));
      const loaded = loadDecisionGapPack(root, "shift-left");
      assert(loaded.pack.id === "shift-left-decision-gap-r1", "shift-left pack id");
      assert(loaded.pack.manifest.scenarios.map((row) => row.id).join(",") === "reachable-characterization-first,sufficient-lower-rung", "shift-left scenario order");
      assert(loaded.pack.manifest.sampleCount === 1, "shift-left pack must use one sample per arm");
      assert(loaded.pack.configuredProviderRequestBound === 4, "shift-left configured provider bound must be four total");
      assert(loaded.pack.maximumClaim.startsWith("two reviewed shift-left decisions"), "shift-left maximum claim");

      const preflight = invokeCli(["--mode", "preflight", "--pack", "shift-left", "--source-ref", "HEAD"]);
      assert(preflight.status === 0, preflight.stderr || preflight.stdout);
      const payload = JSON.parse(preflight.stdout) as Record<string, unknown>;
      assert(payload.modelCalls === 0, "shift-left preflight must be provider-free");
      assert(payload.sampleCountPerArm === 1 && payload.configuredProviderRequestBound === 4, "shift-left preflight bounds");
      assert(Array.isArray(payload.governedSourcePaths) && payload.governedSourcePaths.length === 6, "shift-left governed source paths");
      assert(payload.sampleByteLimit === 524288 && payload.captureByteLimit === 8388608, "shift-left evidence bounds");
      assert(payload.maximumClaim === loaded.pack.maximumClaim, "shift-left preflight claim ceiling");

      const raw = JSON.parse(fs.readFileSync(path.join(root, "tools/proofs/fixtures/consumer-outcome/shift-left-decision-gap-r1.json"), "utf8")) as Record<string, unknown>;
      for (const [label, mutate, expected] of [
        ["extra", (value: Record<string, unknown>) => { value.inferredPriority = "high"; }, "inferredPriority"],
        ["missing", (value: Record<string, unknown>) => { delete value.maximumClaim; }, "maximumClaim"],
        ["malformed", (value: Record<string, unknown>) => {
          const scenarios = value.scenarios as Array<Record<string, unknown>>;
          (scenarios[0].expectedDecision as Record<string, unknown>).deferredDependents = "implement-parser";
        }, "deferredDependents"],
      ] as const) {
        const changed = structuredClone(raw);
        mutate(changed);
        let message = "";
        try {
          parseDecisionGapPack(changed, "shift-left");
        } catch (error) {
          message = error instanceof Error ? error.message : String(error);
        }
        assert(message.includes(expected), `${label} shift-left pack must fail on ${expected}`);
      }

      const escaped = structuredClone(raw);
      (escaped.scenarios as Array<Record<string, unknown>>)[0].fixturePath = "../outside";
      let containmentFailed = false;
      try {
        const parsed = parseDecisionGapPack(escaped, "shift-left");
        verifyFixtureSeed(root, parsed.manifest.scenarios[0]);
      } catch (error) {
        containmentFailed = error instanceof ContractError;
      }
      assert(containmentFailed, "non-contained shift-left fixture must fail before capture");

      const unknown = invokeCli(["--mode", "preflight", "--pack", "unknown"]);
      assert(unknown.status === 1 && unknown.stderr.includes("Invalid pack"), unknown.stderr || unknown.stdout);
      for (const [index, file] of [manifestPath, pointerPath, claimPackPath].entries()) {
        assert(Buffer.compare(before[index], fs.readFileSync(file)) === 0, `${file} must remain byte-isolated`);
      }
    },
  },
  {
    name: "status-scope preflight freezes exact ownership, routes, members, and bounds without effects",
    run: () => {
      const loaded = loadDecisionGapPack(root, "status-scope");
      assert(loaded.pack.id === "status-scope-r1", "status-scope pack id");
      assert(loaded.pack.configuredProviderRequestBound === 6, "status-scope configured provider bound must be six total");
      assert(loaded.pack.manifest.scenarios.length === 1 && loaded.pack.manifest.sampleCount === 1, "status-scope must use one roundtrip sample per arm");
      assert(loaded.pack.statusScope?.memberOrder.join(",") === "known-resource-path-unknown,resource-unknown-negative-control,compaction-roundtrip-mixed-status", "status-scope member order");
      assert(fs.readFileSync(path.join(root, "global", "principles-of-work.md"), "utf8").includes("Scope status to subject/evidence."), "status-scope canonical principle marker");
      assert(fs.readFileSync(path.join(root, "global", "AGENTS.md"), "utf8").includes("routes/outcomes never clear it"), "status-scope compaction authority marker");
      assert(fs.readFileSync(path.join(root, "global", "skills", "change-ready-sdlc", "SKILL.md"), "utf8").includes("never clear it because another route/outcome works"), "status-scope Change-Ready marker");
      const templateConfig = JSON.parse(fs.readFileSync(path.join(root, "global", "opencode.json.template"), "utf8"));
      const activeConfig = JSON.parse(fs.readFileSync(path.join(root, "global", "opencode.json"), "utf8"));
      const promptMarker = "For mixed status, add `Status Scope` with exact subject/dimension/value";
      assert(templateConfig.agent.compaction.prompt.includes(promptMarker), "status-scope canonical compaction prompt marker");
      assert(activeConfig.agent.compaction.prompt === templateConfig.agent.compaction.prompt, "status-scope active compaction prompt mirror");

      const activeOwnership = path.join(root, "openspec", "changes", "prevent-cross-layer-status-ambiguity", "ownership.json");
      const archiveRoot = path.join(root, "openspec", "changes", "archive");
      const archivedOwnership = fs.existsSync(archiveRoot)
        ? fs.readdirSync(archiveRoot, { withFileTypes: true })
          .filter((entry) => entry.isDirectory() && entry.name.endsWith("-prevent-cross-layer-status-ambiguity"))
          .map((entry) => path.join(archiveRoot, entry.name, "ownership.json"))
          .filter((file) => fs.existsSync(file))
          .sort()
        : [];
      const ownershipPath = fs.existsSync(activeOwnership)
        ? activeOwnership
        : archivedOwnership.length === 1
          ? archivedOwnership[0]
          : (() => { throw new Error(`Expected one active or archived status-scope ownership file, found ${archivedOwnership.length}.`); })();
      const expectedOwnershipLifecycle = ownershipPath === activeOwnership ? "active" : "archived";

      const watched = [
        "global/AGENTS.md",
        "global/principles-of-work.md",
        "global/opencode.json",
        "global/opencode.json.template",
        "global/skills/change-ready-sdlc/SKILL.md",
        "tools/proofs/fixtures/consumer-outcome/status-scope-r1.json",
        "tools/proofs/fixtures/consumer-outcome/status-scope/cases.json",
      ].map((relative) => path.join(root, relative)).concat(ownershipPath);
      const before = watched.map((file) => fs.readFileSync(file));
      const installation = tempDir("status-scope-opencode");
      const packageRoot = path.join(installation, "opencode-ai");
      const executable = path.join(packageRoot, "bin", "opencode.exe");
      fs.mkdirSync(path.dirname(executable), { recursive: true });
      fs.writeFileSync(executable, "synthetic executable identity\n");
      fs.writeFileSync(path.join(packageRoot, "package.json"), JSON.stringify({ version: "1.18.23-test" }));
      try {
        const preflight = invokeCli([
          "--mode", "preflight",
          "--pack", "status-scope",
          "--source-ref", "working-tree",
          "--opencode", executable,
        ], root, { OPENCODE_CONFIG_DIR: path.join(root, "global") });
        assert(preflight.status === 0, preflight.stderr || preflight.stdout);
        const payload = JSON.parse(preflight.stdout) as Record<string, any>;
        assert(payload.modelCalls === 0 && payload.configuredProviderRequestBound === 6, "status-scope preflight call bounds");
        assert(payload.baseline.sourceRef === "working-tree" && payload.baseline.pathDigests.length === 5, "status-scope baseline source freeze");
        assert(payload.candidate.sourcePlan === "same-kit-global-after-reviewed-instruction-edit", "status-scope candidate source plan");
        assert(payload.modelRoutes.main === "openai/gpt-5.6-sol/xhigh" && payload.modelRoutes.compaction === "xai/grok-4.6/high", "status-scope routes");
        assert(payload.modelRoutes.profile === "active-config" && payload.modelRoutes.requestedProfile === "quality-independent", "status-scope route source");
        assert(payload.compactionPrompt.status === "same" && payload.compactionPrompt.restartBoundary === "none", "status-scope prompt mirror");
        assert(payload.ownership.lifecycle === expectedOwnershipLifecycle, "status-scope ownership lifecycle");
        assert(payload.ownership.mutationEnabled === (expectedOwnershipLifecycle === "active") && payload.ownership.overlappingWriterState === "clear", "status-scope ownership");
        assert(payload.foreignSourceMutationAllowed === false, "status-scope foreign source mutation must remain denied");
        assert(payload.scenarioMembers.join(",") === loaded.pack.statusScope?.memberOrder.join(","), "status-scope preflight population");
        assert(payload.openCode.version === "1.18.23-test", "status-scope installed identity");
        for (const [index, file] of watched.entries()) {
          assert(Buffer.compare(before[index], fs.readFileSync(file)) === 0, `${file} must remain byte-isolated`);
        }
      } finally {
        fs.rmSync(installation, { force: true, recursive: true });
      }
    },
  },
  {
    name: "status-scope oracle accepts exact main and reconstructed dimensions and rejects cross-dimension broadening",
    run: () => {
      const loaded = loadDecisionGapPack(root, "status-scope");
      const scenario = loaded.pack.manifest.scenarios[0];
      const expected = loaded.pack.expectedDecisions[scenario.id] as StatusScopeDecisionSet;
      const baseline = bundleOf([statusScopeSample({ arm: "baseline", expected, scenario })]);
      baseline.scenarioDigest = loaded.digest;
      const candidate = bundleOf([statusScopeSample({ arm: "candidate", expected, scenario })], "candidate");
      candidate.scenarioDigest = loaded.digest;
      const passed = evaluateDecisionGapPack({ baseline, candidate, expectation: "no-regression", pack: loaded.pack });
      assert(passed.evaluation.status === "passed-no-regression", JSON.stringify(passed.evaluation));
      assert(passed.statusScopeOracles?.length === 12 && passed.statusScopeOracles.every((row) => row.passed), "all status dimensions in both phases and arms must pass");

      const lossyReconstruction = structuredClone(expected) as any;
      lossyReconstruction.members[0].actionAuthority = null;
      const lossyBaseline = bundleOf([
        statusScopeSample({ arm: "baseline", expected, reconstructionExpected: lossyReconstruction, scenario }),
      ]);
      lossyBaseline.scenarioDigest = loaded.digest;
      const improved = evaluateDecisionGapPack({ baseline: lossyBaseline, candidate, expectation: "improvement", pack: loaded.pack });
      assert(improved.evaluation.status === "passed-improvement", JSON.stringify(improved.evaluation));
      assert(improved.statusScopeOracles?.some((row) => row.arm === "baseline" && !row.passed), "improvement must retain the failing baseline oracle");
      assert(improved.statusScopeOracles?.filter((row) => row.arm === "candidate").every((row) => row.passed), "improvement requires every candidate oracle");

      lossyBaseline.evaluatorDigest = "baseline-capture-evaluator";
      candidate.evaluatorDigest = "candidate-capture-evaluator";
      const replayedByOneEvaluator = evaluateDecisionGapPack({ baseline: lossyBaseline, candidate, expectation: "improvement", pack: loaded.pack });
      assert(replayedByOneEvaluator.evaluation.status === "passed-improvement", JSON.stringify(replayedByOneEvaluator.evaluation));
      assert(replayedByOneEvaluator.evaluatorIdentity?.capture.baseline === "baseline-capture-evaluator", "baseline capture evaluator provenance");
      assert(replayedByOneEvaluator.evaluatorIdentity?.capture.candidate === "candidate-capture-evaluator", "candidate capture evaluator provenance");
      assert(replayedByOneEvaluator.evaluatorIdentity?.terminalReplay === evaluatorDigest(), "terminal replay evaluator identity");

      const broadened = structuredClone(expected);
      broadened.members[0].resourceAvailability = "unknown";
      const broadenedCandidate = bundleOf([statusScopeSample({ arm: "candidate", expected: broadened, scenario })], "candidate");
      broadenedCandidate.scenarioDigest = loaded.digest;
      const failed = evaluateDecisionGapPack({ baseline, candidate: broadenedCandidate, expectation: "no-regression", pack: loaded.pack });
      assert(failed.evaluation.status === "failed", "cross-dimension broadening must fail the exact oracle");
      assert(failed.evaluation.reasons.includes("status-scope-oracle:candidate:main:known-resource-path-unknown:resourceAvailability"), JSON.stringify(failed.evaluation.reasons));

      const reconstructionConflict = structuredClone(expected);
      reconstructionConflict.members[2].acceptedOutcomeState = "blocked";
      const reconstructionCandidate = bundleOf([
        statusScopeSample({ arm: "candidate", expected, reconstructionExpected: reconstructionConflict, scenario }),
      ], "candidate");
      reconstructionCandidate.scenarioDigest = loaded.digest;
      const reconstructionFailed = evaluateDecisionGapPack({ baseline, candidate: reconstructionCandidate, expectation: "no-regression", pack: loaded.pack });
      assert(reconstructionFailed.evaluation.reasons.includes("status-scope-oracle:candidate:reconstruction:compaction-roundtrip-mixed-status:acceptedOutcomeState"), JSON.stringify(reconstructionFailed.evaluation.reasons));

      const overBound = bundleOf([statusScopeSample({ arm: "candidate", expected, providerRequestCount: 4, scenario })], "candidate");
      overBound.scenarioDigest = loaded.digest;
      const boundFailed = evaluateDecisionGapPack({ baseline, candidate: overBound, expectation: "no-regression", pack: loaded.pack });
      assert(boundFailed.evaluation.reasons.some((reason) => reason.includes("provider-request-count")), "per-arm request count mismatch must fail");
      assert(boundFailed.evaluation.reasons.includes("status-scope-oracle:pack-provider-bound:6:7"), JSON.stringify(boundFailed.evaluation.reasons));
    },
  },
  {
    name: "status-scope replay is provider-free and deterministic through the terminal evaluator",
    run: () => {
      const loaded = loadDecisionGapPack(root, "status-scope");
      const scenario = loaded.pack.manifest.scenarios[0];
      const expected = loaded.pack.expectedDecisions[scenario.id] as StatusScopeDecisionSet;
      const baseline = bundleOf([statusScopeSample({ arm: "baseline", expected, scenario })]);
      baseline.scenarioDigest = loaded.digest;
      const candidate = bundleOf([statusScopeSample({ arm: "candidate", expected, scenario })], "candidate");
      candidate.scenarioDigest = loaded.digest;
      const lossyReconstruction = structuredClone(expected) as any;
      lossyReconstruction.members[0].actionAuthority = null;
      const lossyBaseline = bundleOf([
        statusScopeSample({ arm: "baseline", expected, reconstructionExpected: lossyReconstruction, scenario }),
      ]);
      lossyBaseline.scenarioDigest = loaded.digest;
      const directory = tempDir("status-scope-replay");
      const baselinePath = path.join(directory, "baseline.json");
      const candidatePath = path.join(directory, "candidate.json");
      const lossyBaselinePath = path.join(directory, "lossy-baseline.json");
      fs.writeFileSync(baselinePath, `${stableJson(baseline)}\n`);
      fs.writeFileSync(candidatePath, `${stableJson(candidate)}\n`);
      fs.writeFileSync(lossyBaselinePath, `${stableJson(lossyBaseline)}\n`);
      try {
        const baselineOnly = invokeCli(["--mode", "replay", "--pack", "status-scope", "--baseline", baselinePath, "--expectation", "baseline-establishment"]);
        assert(baselineOnly.status === 0, baselineOnly.stderr || baselineOnly.stdout);
        const baselinePayload = JSON.parse(baselineOnly.stdout) as Record<string, any>;
        assert(baselinePayload.liveCalls === 0 && baselinePayload.evaluation.evaluation.status === "baseline-established", JSON.stringify(baselinePayload));
        const args = ["--mode", "replay", "--pack", "status-scope", "--baseline", baselinePath, "--candidate", candidatePath, "--expectation", "no-regression"];
        const first = invokeCli(args);
        const second = invokeCli(args);
        assert(first.status === 0 && second.status === 0, first.stderr || second.stderr || first.stdout || second.stdout);
        const firstPayload = JSON.parse(first.stdout) as Record<string, any>;
        const secondPayload = JSON.parse(second.stdout) as Record<string, any>;
        assert(firstPayload.liveCalls === 0 && secondPayload.liveCalls === 0, "status-scope replay must remain provider-free");
        assert(firstPayload.evaluation.digest === secondPayload.evaluation.digest, "status-scope terminal evaluation must be deterministic");
        assert(firstPayload.evaluation.evaluation.status === "passed-no-regression", JSON.stringify(firstPayload.evaluation));
        const resultPath = path.join(directory, "terminal-replay.json");
        const improvement = invokeCli(["--mode", "replay", "--pack", "status-scope", "--baseline", lossyBaselinePath, "--candidate", candidatePath, "--expectation", "improvement", "--result-path", resultPath]);
        assert(improvement.status === 0, improvement.stderr || improvement.stdout);
        const improvementPayload = JSON.parse(improvement.stdout) as Record<string, any>;
        assert(improvementPayload.liveCalls === 0 && improvementPayload.evaluation.evaluation.status === "passed-improvement", JSON.stringify(improvementPayload));
        assert(fs.readFileSync(resultPath, "utf8") === `${improvement.stdout.trim()}\n`, "result path must seal the emitted replay bytes");
        const duplicate = invokeCli(["--mode", "replay", "--pack", "status-scope", "--baseline", lossyBaselinePath, "--candidate", candidatePath, "--expectation", "improvement", "--result-path", resultPath]);
        assert(duplicate.status === 1 && duplicate.stderr.includes("create-new path already exists"), "result path must fail closed on overwrite");
      } finally {
        fs.rmSync(directory, { force: true, recursive: true });
      }
    },
  },
  {
    name: "incomplete or extra fields fail before effects",
    run: () => {
      const loaded = JSON.parse(fs.readFileSync(path.join(root, "config/consumer-outcome-regression.json"), "utf8")) as Record<string, unknown>;
      const missing = structuredClone(loaded);
      delete (missing.scenarios as Array<Record<string, unknown>>)[0].cleanupOracle;
      let failed = false;
      try {
        parseManifest(missing);
      } catch (error) {
        failed = error instanceof ContractError && error.message.includes("cleanupOracle");
      }
      assert(failed, "missing cleanup must fail");
      const extra = structuredClone(loaded);
      extra.qualityScore = 9;
      failed = false;
      try {
        parseManifest(extra);
      } catch (error) {
        failed = error instanceof ContractError && error.message.includes("extra=[qualityScore]");
      }
      assert(failed, "helper-inferred field must fail");
    },
  },
  {
    name: "path escape, unresolved command, and invalid bounds fail",
    run: async () => {
      const loaded = JSON.parse(fs.readFileSync(path.join(root, "config/consumer-outcome-regression.json"), "utf8")) as Record<string, unknown>;
      const escaped = structuredClone(loaded);
      (escaped.scenarios as Array<Record<string, unknown>>)[0].fixturePath = "../secret";
      let failed = false;
      try {
        const parsed = parseManifest(escaped);
        parsed.scenarios[0].fixturePath = "../secret";
      } catch {
        failed = true;
      }
      assert(failed || escaped.scenarios != null, "escape path is rejected at fixture verification");
      const bound = structuredClone(loaded);
      bound.sampleByteLimit = 12;
      failed = false;
      try {
        parseManifest(bound);
      } catch (error) {
        failed = error instanceof ContractError;
      }
      assert(failed, "invalid bound must fail");
      const { resolveValidationCommand } = await import("./proofs/consumer-outcome/contracts.ts");
      failed = false;
      try {
        resolveValidationCommand(["definitely-not-a-command-xyz"], "validationArgv");
      } catch (error) {
        failed = error instanceof ContractError;
      }
      assert(failed, "unresolved command must fail");
    },
  },
  {
    name: "help and -h are effect-free",
    run: () => {
      const watch = tempDir("help");
      const before = fs.readdirSync(root).sort().join("\n");
      const help = invokeCli(["--help"]);
      const shortHelp = invokeCli(["-h"]);
      const after = fs.readdirSync(root).sort().join("\n");
      assert(help.status === 0 && shortHelp.status === 0, "help must exit zero");
      for (const output of [help.stdout, shortHelp.stdout]) {
        assert(output.includes("Inputs:"), output);
        assert(output.includes("Effects:"), output);
        assert(output.includes("Evidence:"), output);
        assert(output.includes("Cleanup:"), output);
        assert(output.includes("baseline"), output);
        assert(output.includes("capture"), output);
        assert(output.includes("replay"), output);
        assert(output.includes("evaluate"), output);
        assert(output.includes("gate"), output);
      }
      assert(before === after, "help must not change the project listing");
      assert(fs.readdirSync(watch).length === 0, "help must not create files");
      fs.rmSync(watch, { force: true, recursive: true });
    },
  },
  {
    name: "preflight does not capture",
    run: () => {
      const result = invokeCli(["--mode", "preflight", "--source-ref", "HEAD"]);
      assert(result.status === 0, result.stderr || result.stdout);
      const parsed = JSON.parse(result.stdout) as { mode: string; modelCalls: number; status: string };
      assert(parsed.mode === "preflight" && parsed.modelCalls === 0 && parsed.status === "ready", "preflight payload");
    },
  },
  {
    name: "evaluator matrix: baseline, no-regression, improvement, and required failures",
    run: () => {
      const manifest = loadManifest(root).manifest;
      const baselineSamples = [
        ...[1, 2, 3].map((sampleIndex) => sample({ arm: "baseline", sampleIndex, scenarioId: "ordinary-small-greeting" })),
        ...[1, 2, 3].map((sampleIndex) => sample({ arm: "baseline", sampleIndex, scenarioId: "openspec-add-json-output" })),
      ];
      const baseline = bundleOf(baselineSamples);
      const established = evaluateBundle({ baseline, expectation: "baseline-establishment", manifest });
      assert(established.status === "baseline-established", established.reasons.join(","));
      const equalCandidate = bundleOf([
        ...[1, 2, 3].map((sampleIndex) => sample({ arm: "candidate", sampleIndex, scenarioId: "ordinary-small-greeting" })),
        ...[1, 2, 3].map((sampleIndex) => sample({ arm: "candidate", sampleIndex, scenarioId: "openspec-add-json-output" })),
      ], "matched");
      const noReg = evaluateBundle({ baseline, candidate: equalCandidate, expectation: "no-regression", manifest });
      assert(noReg.status === "passed-no-regression", noReg.reasons.join(","));
      assert(noReg.improvedField == null, "no-regression must not claim improvement");
      const improvedFriction = { ...emptyFriction(), totalToolCallCount: 0 };
      const baselineBusy = bundleOf([
        ...[1, 2, 3].map((sampleIndex) => sample({ arm: "baseline", friction: { ...emptyFriction(), totalToolCallCount: 2 }, sampleIndex, scenarioId: "ordinary-small-greeting" })),
        ...[1, 2, 3].map((sampleIndex) => sample({ arm: "baseline", friction: { ...emptyFriction(), totalToolCallCount: 2 }, sampleIndex, scenarioId: "openspec-add-json-output" })),
      ]);
      const improved = bundleOf([
        ...[1, 2, 3].map((sampleIndex) => sample({ arm: "candidate", friction: improvedFriction, sampleIndex, scenarioId: "ordinary-small-greeting" })),
        ...[1, 2, 3].map((sampleIndex) => sample({ arm: "candidate", friction: improvedFriction, sampleIndex, scenarioId: "openspec-add-json-output" })),
      ], "matched");
      const better = evaluateBundle({ baseline: baselineBusy, candidate: improved, expectation: "improvement", manifest });
      assert(better.status === "passed-improvement", better.reasons.join(","));
      assert(better.improvedField?.field === "totalToolCallCount", "improved field");
      const sameImprovement = evaluateBundle({ baseline, candidate: equalCandidate, expectation: "improvement", manifest });
      assert(sameImprovement.status === "failed" && sameImprovement.reasons.includes("no-strict-friction-improvement"), "no strict improvement");
      const broken = bundleOf([
        ...[1, 2, 3].map((sampleIndex) => sample({
          arm: "candidate",
          proof: { argv: ["node"], status: 1, stderr: "fail", stdout: "" },
          sampleIndex,
          scenarioId: "ordinary-small-greeting",
        })),
        ...[1, 2, 3].map((sampleIndex) => sample({ arm: "candidate", sampleIndex, scenarioId: "openspec-add-json-output" })),
      ], "matched");
      const outcome = evaluateBundle({ baseline, candidate: broken, expectation: "no-regression", manifest });
      assert(outcome.status === "failed", "incorrect candidate must fail");
      const missingSafety = bundleOf([
        ...[1, 2, 3].map((sampleIndex) => sample({
          arm: "candidate",
          cleanup: { complete: false, error: "unknown", fixtureRemoved: false, processesRemoved: false, sessionsRemoved: false },
          sampleIndex,
          scenarioId: "ordinary-small-greeting",
        })),
        ...[1, 2, 3].map((sampleIndex) => sample({ arm: "candidate", sampleIndex, scenarioId: "openspec-add-json-output" })),
      ], "matched");
      const blocked = evaluateBundle({ baseline, candidate: missingSafety, expectation: "no-regression", manifest });
      assert(blocked.status === "blocked", "missing cleanup must block");
      const regress = bundleOf([
        ...[1, 2, 3].map((sampleIndex) => sample({ arm: "candidate", friction: { ...emptyFriction(), ownerQuestionCount: 4 }, sampleIndex, scenarioId: "ordinary-small-greeting" })),
        ...[1, 2, 3].map((sampleIndex) => sample({ arm: "candidate", sampleIndex, scenarioId: "openspec-add-json-output" })),
      ], "matched");
      const friction = evaluateBundle({ baseline, candidate: regress, expectation: "no-regression", manifest });
      assert(friction.status === "failed" && friction.reasons.some((reason) => reason.includes("friction-regression")), "friction regression");
    },
  },
  {
    name: "replay is deterministic and tamper fails closed",
    run: () => {
      const manifest = loadManifest(root).manifest;
      const samples = [
        ...[1, 2, 3].map((sampleIndex) => sample({ arm: "baseline", sampleIndex, scenarioId: "ordinary-small-greeting" })),
        ...[1, 2, 3].map((sampleIndex) => sample({ arm: "baseline", sampleIndex, scenarioId: "openspec-add-json-output" })),
      ];
      const bundle = bundleOf(samples);
      const dir = tempDir("replay");
      const file = path.join(dir, "bundle.json");
      fs.writeFileSync(file, stableJson(bundle));
      const first = replayEvaluation({ baselinePath: file, expectation: "baseline-establishment", manifest });
      const second = replayEvaluation({ baselinePath: file, expectation: "baseline-establishment", manifest });
      assert(first.digest === second.digest, "replay digest must match");
      const before = fs.readFileSync(file, "utf8");
      const tampered = JSON.parse(before) as CaptureBundle;
      tampered.samples[0].friction.ownerQuestionCount = 9;
      fs.writeFileSync(file, stableJson(tampered));
      let failed = false;
      try {
        replayEvaluation({ baselinePath: file, expectation: "baseline-establishment", manifest });
      } catch (error) {
        failed = error instanceof ContractError;
      }
      assert(failed, "tamper must fail closed");
      fs.writeFileSync(file, before);
      assert(fs.readFileSync(file, "utf8") === before, "replay must not rewrite a restored bundle");
      fs.rmSync(dir, { force: true, recursive: true });
    },
  },
  {
    name: "privacy and truncation fail closed",
    run: () => {
      const manifest = loadManifest(root).manifest;
      const secret = bundleOf([
        ...[1, 2, 3].map((sampleIndex) => sample({
          arm: "baseline",
          command: { argv: ["x"], status: 0, stderr: "", stdout: "api_key=sk-hidden-value" },
          sampleIndex,
          scenarioId: "ordinary-small-greeting",
        })),
        ...[1, 2, 3].map((sampleIndex) => sample({ arm: "baseline", sampleIndex, scenarioId: "openspec-add-json-output" })),
      ]);
      const secretResult = evaluateBundle({ baseline: secret, expectation: "baseline-establishment", manifest });
      assert(secretResult.status === "blocked", "secret marker must block");
      const truncated = bundleOf([
        ...[1, 2, 3].map((sampleIndex) => sample({
          arm: "baseline",
          diagnostics: { elapsedMs: null, tokens: null, truncatedFields: ["cleanup"] },
          sampleIndex,
          scenarioId: "ordinary-small-greeting",
        })),
        ...[1, 2, 3].map((sampleIndex) => sample({ arm: "baseline", sampleIndex, scenarioId: "openspec-add-json-output" })),
      ]);
      let failed = false;
      try {
        evaluateBundle({ baseline: truncated, expectation: "baseline-establishment", manifest });
      } catch (error) {
        failed = error instanceof ContractError;
      }
      assert(failed, "critical truncation must fail closed");
    },
  },
  {
    name: "harness capture records both scenarios and cleans up",
    run: async () => {
      const loaded = loadManifest(root);
      const evidence = tempDir("capture");
      fs.rmSync(evidence, { force: true, recursive: true });
      const sourceIdentity = governedSourceIdentity(root, "HEAD", loaded.manifest.governedSourcePaths);
      const bundle = await captureLane(loaded.manifest, loaded.digest, {
        candidateId: "harness-1",
        evidenceRoot: evidence,
        failure: "none",
        gitRef: "HEAD",
        kind: "baseline",
        repoRoot: root,
        sessionMode: "harness",
        sourceIdentity,
      });
      assert(bundle.samples.length === 6, `expected 6 baseline samples, got ${bundle.samples.length}`);
      assert(bundle.samples.every((row) => row.cleanup.complete), bundle.samples.map((row) => row.cleanup.error).join(","));
      const evaluation = evaluateBundle({ baseline: bundle, expectation: "baseline-establishment", manifest: loaded.manifest });
      assert(evaluation.status === "baseline-established", evaluation.reasons.join(","));
      const replayDir = tempDir("capture-replay");
      const copy = path.join(replayDir, "bundle.json");
      fs.copyFileSync(path.join(evidence, "bundle.json"), copy);
      const first = replayEvaluation({ baselinePath: copy, expectation: "baseline-establishment", manifest: loaded.manifest });
      const second = replayEvaluation({ baselinePath: copy, expectation: "baseline-establishment", manifest: loaded.manifest });
      assert(first.digest === second.digest, "captured replay digest");
      const current = gateCurrent({
        currentSource: sourceIdentity,
        manifest: loaded.manifest,
        pointer: {
          baselineVersion: "b1",
          bundlePath: path.relative(root, path.join(evidence, "bundle.json")).replaceAll("\\", "/"),
          environmentDigest: digestOf(bundle.samples[0].environmentIdentity),
          evaluatorDigest: evaluatorDigest(),
          priorBaselineReference: null,
          reason: "test",
          scenarioDigest: loaded.digest,
          schemaVersion: 1,
          sourceDigest: sourceIdentity.governedDigest,
          status: "accepted",
        },
        repoRoot: root,
      });
      assert(current.status === "baseline-current", current.reasons.join(","));
      fs.rmSync(evidence, { force: true, recursive: true });
      fs.rmSync(replayDir, { force: true, recursive: true });
    },
  },
  {
    name: "focused decision pack captures and replays all four explicit oracles provider-free",
    run: async () => {
      const loaded = loadDecisionGapPack(root);
      const evidence = tempDir("decision-gap-capture");
      fs.rmSync(evidence, { force: true, recursive: true });
      const sourceIdentity = governedSourceIdentity(root, "working-tree", loaded.pack.manifest.governedSourcePaths);
      const bundle = await captureLane(loaded.pack.manifest, loaded.digest, {
        candidateId: "decision-gap-r1",
        evidenceRoot: evidence,
        failure: "none",
        gitRef: "working-tree",
        kind: "matched",
        repoRoot: root,
        sessionMode: "harness",
        sourceIdentity,
      });
      assert(bundle.samples.length === 8, `expected 8 focused samples, got ${bundle.samples.length}`);
      const evaluation = evaluateDecisionGapPack({
        baseline: bundle,
        candidate: bundle,
        expectation: "no-regression",
        pack: loaded.pack,
      });
      assert(evaluation.evaluation.status === "passed-no-regression", evaluation.evaluation.reasons.join(","));
      assert(evaluation.decisionOracles.length === 8 && evaluation.decisionOracles.every((row) => row.passed), "all explicit decision oracles must pass");
      const replay = invokeCli([
        "--mode", "replay",
        "--pack", "claim-evidence",
        "--baseline", path.join(evidence, "bundle.json"),
        "--candidate", path.join(evidence, "bundle.json"),
        "--expectation", "no-regression",
      ]);
      assert(replay.status === 0, replay.stderr || replay.stdout);
      const replayed = JSON.parse(replay.stdout) as { evaluation: { decisionOracles: Array<{ passed: boolean }>; evaluation: { status: string } }; liveCalls: number };
      assert(replayed.liveCalls === 0, "focused replay must be provider-free");
      assert(replayed.evaluation.evaluation.status === "passed-no-regression", replay.stdout);
      assert(replayed.evaluation.decisionOracles.every((row) => row.passed), "replayed focused oracles must pass");
      const blockedRoot = path.join(tempDir("decision-gap-baseline"), "new-evidence");
      const blocked = invokeCli([
        "--mode", "baseline",
        "--pack", "claim-evidence",
        "--candidate-id", "blocked-promotion",
        "--evidence-root", blockedRoot,
      ]);
      assert(blocked.status === 1 && blocked.stderr.includes("cannot establish, promote, or gate"), blocked.stderr || blocked.stdout);
      assert(!fs.existsSync(blockedRoot), "rejected baseline promotion must not create evidence");
      fs.rmSync(path.dirname(blockedRoot), { force: true, recursive: true });
      fs.rmSync(evidence, { force: true, recursive: true });
    },
  },
  {
    name: "shift-left focused pack captures separate arms and replays deterministically provider-free",
    run: async () => {
      const loaded = loadDecisionGapPack(root, "shift-left");
      const parent = tempDir("shift-left-capture");
      const baselineRoot = path.join(parent, "baseline");
      const candidateRoot = path.join(parent, "candidate");
      const sourceIdentity = governedSourceIdentity(root, "HEAD", loaded.pack.manifest.governedSourcePaths);
      const baseline = await captureLane(loaded.pack.manifest, loaded.digest, {
        candidateId: "shift-left-baseline-r1",
        evidenceRoot: baselineRoot,
        failure: "none",
        gitRef: "HEAD",
        kind: "baseline",
        repoRoot: root,
        sessionMode: "harness",
        sourceIdentity,
      });
      const candidate = await captureLane(loaded.pack.manifest, loaded.digest, {
        candidateId: "shift-left-candidate-r1",
        evidenceRoot: candidateRoot,
        failure: "none",
        gitRef: "HEAD",
        kind: "candidate",
        repoRoot: root,
        sessionMode: "harness",
        sourceIdentity,
      });
      assert(baseline.samples.length === 2 && candidate.samples.length === 2, "shift-left pack must capture two samples per arm");
      assert([...baseline.samples, ...candidate.samples].every((row) => row.cleanup.complete && row.cleanup.sessionsRemoved), "shift-left capture cleanup");
      assert([...baseline.samples, ...candidate.samples].every((row) => row.friction.configuredProviderRequestCount === 0), "harness capture must use zero configured-provider requests");

      const first = invokeCli([
        "--mode", "replay",
        "--pack", "shift-left",
        "--baseline", path.join(baselineRoot, "bundle.json"),
        "--candidate", path.join(candidateRoot, "bundle.json"),
      ]);
      const second = invokeCli([
        "--mode", "replay",
        "--pack", "shift-left",
        "--baseline", path.join(baselineRoot, "bundle.json"),
        "--candidate", path.join(candidateRoot, "bundle.json"),
      ]);
      assert(first.status === 0 && second.status === 0, first.stderr || second.stderr || first.stdout || second.stdout);
      const firstPayload = JSON.parse(first.stdout) as { evaluation: { decisionOracles: Array<{ passed: boolean }>; digest: string; evaluation: { status: string }; maximumClaim: string }; liveCalls: number };
      const secondPayload = JSON.parse(second.stdout) as typeof firstPayload;
      assert(firstPayload.liveCalls === 0 && secondPayload.liveCalls === 0, "shift-left replay must have zero live calls");
      assert(firstPayload.evaluation.evaluation.status === "passed-no-regression", first.stdout);
      assert(firstPayload.evaluation.decisionOracles.length === 4 && firstPayload.evaluation.decisionOracles.every((row) => row.passed), "all shift-left oracles must pass");
      assert(firstPayload.evaluation.digest === secondPayload.evaluation.digest, "shift-left replay digest must be deterministic");
      assert(firstPayload.evaluation.maximumClaim === loaded.pack.maximumClaim, "shift-left replay must emit its maximum claim");
      fs.rmSync(parent, { force: true, recursive: true });
    },
  },
  {
    name: "shift-left decision and hard-gate failures retain exact attribution",
    run: () => {
      const loaded = loadDecisionGapPack(root, "shift-left");
      const ids = loaded.pack.manifest.scenarios.map((row) => row.id);
      const makeSample = (arm: "baseline" | "candidate", scenarioId: string, overrides: Partial<SampleEvidence> = {}): SampleEvidence => sample({
        arm,
        files: [{ path: "decision.json", sha256: "decision" }],
        proof: {
          argv: ["node", "check-decision.ts", scenarioId],
          status: 0,
          stderr: "",
          stdout: JSON.stringify({ caseId: scenarioId, ...loaded.pack.expectedDecisions[scenarioId] }),
        },
        sampleIndex: 1,
        scenarioId,
        ...overrides,
      });
      const baseline = bundleOf(ids.map((id) => makeSample("baseline", id)), "baseline");
      baseline.scenarioDigest = loaded.digest;
      const candidate = (overrides: Partial<Record<string, Partial<SampleEvidence>>> = {}): CaptureBundle => {
        const bundle = bundleOf(
          ids.map((id) => makeSample("candidate", id, overrides[id])),
          "candidate",
        );
        bundle.scenarioDigest = loaded.digest;
        return bundle;
      };
      const evaluate = (next: CaptureBundle) => evaluateDecisionGapPack({
        baseline,
        candidate: next,
        expectation: "no-regression",
        pack: loaded.pack,
      });

      const wrongOrder = {
        caseId: ids[0],
        ...loaded.pack.expectedDecisions[ids[0]],
        firstAction: "implement-parser",
      };
      const wrong = evaluate(candidate({
        [ids[0]]: { proof: { argv: ["node"], status: 0, stderr: "", stdout: JSON.stringify(wrongOrder) } },
      }));
      assert(wrong.evaluation.status === "failed", "dependent expansion must fail");
      assert(wrong.evaluation.reasons.includes(`decision-oracle:candidate:${ids[0]}:1:firstAction`), wrong.evaluation.reasons.join(","));

      const climbed = {
        caseId: ids[1],
        ...loaded.pack.expectedDecisions[ids[1]],
        claimCeiling: "protected-end-to-end-observation",
        firstAction: "run-protected-end-to-end-proof",
        protectedActionDisposition: "selected",
        selectedSufficientBoundary: "protected-end-to-end-runtime",
      };
      const unnecessaryClimb = evaluate(candidate({
        [ids[1]]: { proof: { argv: ["node"], status: 0, stderr: "", stdout: JSON.stringify(climbed) } },
      }));
      assert(unnecessaryClimb.evaluation.reasons.includes(`decision-oracle:candidate:${ids[1]}:1:selectedSufficientBoundary`), unnecessaryClimb.evaluation.reasons.join(","));

      const missingClaim = { caseId: ids[0], ...loaded.pack.expectedDecisions[ids[0]], claimCeiling: undefined };
      delete missingClaim.claimCeiling;
      const malformed = evaluate(candidate({
        [ids[0]]: { proof: { argv: ["node"], status: 0, stderr: "", stdout: JSON.stringify(missingClaim) } },
      }));
      assert(malformed.evaluation.reasons.includes(`decision-oracle:candidate:${ids[0]}:1:malformed-observation`), malformed.evaluation.reasons.join(","));

      const safety = evaluate(candidate({
        [ids[0]]: { forbiddenEffects: [{ name: "protected-action", observed: true }] },
      }));
      assert(safety.evaluation.status === "blocked" && safety.evaluation.reasons.includes(`candidate.${ids[0]}.1.forbiddenEffects`), safety.evaluation.reasons.join(","));

      const environment = evaluate(candidate({
        [ids[0]]: { environmentIdentity: env({ initialFixtureDigest: ids[0], model: "other/model" }) },
      }));
      assert(environment.evaluation.status === "blocked" && environment.evaluation.reasons.some((reason) => reason.includes("environment:model")), environment.evaluation.reasons.join(","));

      const staleScenario = candidate();
      staleScenario.scenarioDigest = "stale-pack";
      const stale = evaluate(staleScenario);
      assert(stale.evaluation.status === "blocked" && stale.evaluation.reasons.some((reason) => reason.includes("decision-oracle:candidate:scenario-digest")), stale.evaluation.reasons.join(","));

      const privacy = evaluate(candidate({
        [ids[0]]: { command: { argv: ["node"], status: 0, stderr: "", stdout: "api_key=sk-hidden-value" } },
      }));
      assert(privacy.evaluation.status === "blocked" && privacy.evaluation.reasons.some((reason) => reason.includes(`candidate.${ids[0]}.1.secret-marker`)), privacy.evaluation.reasons.join(","));

      const cleanup = evaluate(candidate({
        [ids[0]]: { cleanup: { complete: false, error: "unknown", fixtureRemoved: false, processesRemoved: false, sessionsRemoved: false } },
      }));
      assert(cleanup.evaluation.status === "blocked" && cleanup.evaluation.reasons.includes(`candidate.${ids[0]}.1.cleanup`), cleanup.evaluation.reasons.join(","));

      const providerBound = evaluate(candidate(Object.fromEntries(ids.map((id) => [id, {
        friction: { ...emptyFriction(), configuredProviderRequestCount: 3 },
      }]))));
      assert(providerBound.evaluation.status === "failed" && providerBound.evaluation.reasons.includes("decision-oracle:pack-provider-bound:4:6"), providerBound.evaluation.reasons.join(","));

      const tampered = candidate();
      tampered.samples[0].proof.stdout = "{}";
      let integrityFailed = false;
      try {
        evaluate(tampered);
      } catch (error) {
        integrityFailed = error instanceof ContractError;
      }
      assert(integrityFailed, "shift-left bundle integrity must fail closed");

      const checkerRoot = tempDir("shift-left-checker-observation");
      fs.cpSync(path.join(root, "tools/proofs/fixtures/consumer-outcome/shift-left-decision-gap"), checkerRoot, { recursive: true });
      fs.writeFileSync(path.join(checkerRoot, "decision.json"), stableJson({
        caseId: ids[1],
        ...loaded.pack.expectedDecisions[ids[1]],
        deferredDependents: ["protected-end-to-end-runtime"],
      }));
      const checker = spawnSync(process.execPath, ["check-decision.ts", ids[1]], { cwd: checkerRoot, encoding: "utf8" });
      assert(checker.status === 1 && checker.stderr.includes("undeclared action"), checker.stderr || checker.stdout);
      assert(JSON.parse(checker.stdout).deferredDependents[0] === "protected-end-to-end-runtime", "failed checker must preserve the bounded observation");
      fs.rmSync(checkerRoot, { force: true, recursive: true });
    },
  },
  {
    name: "injected failures preserve identity and block later samples",
    run: async () => {
      const loaded = loadManifest(root);
      const sourceIdentity = governedSourceIdentity(root, "HEAD", loaded.manifest.governedSourcePaths);
      const evidence = tempDir("fail-cleanup");
      fs.rmSync(evidence, { force: true, recursive: true });
      let message = "";
      try {
        await captureLane(loaded.manifest, loaded.digest, {
          candidateId: "fail-cleanup",
          evidenceRoot: evidence,
          failure: "cleanup",
          gitRef: "HEAD",
          kind: "baseline",
          repoRoot: root,
          sessionMode: "harness",
          sourceIdentity,
        });
      } catch (error) {
        message = error instanceof Error ? error.message : String(error);
      }
      assert(message.includes("writer") || message.includes("cleanup"), message);
      fs.rmSync(evidence, { force: true, recursive: true });
    },
  },
  {
    name: "baseline pointer is not mutated by evaluation",
    run: () => {
      const pointerPath = path.join(root, "config/consumer-outcome-baseline.json");
      const before = fs.readFileSync(pointerPath);
      const manifest = loadManifest(root).manifest;
      const baseline = bundleOf([
        ...[1, 2, 3].map((sampleIndex) => sample({ arm: "baseline", sampleIndex, scenarioId: "ordinary-small-greeting" })),
        ...[1, 2, 3].map((sampleIndex) => sample({ arm: "baseline", sampleIndex, scenarioId: "openspec-add-json-output" })),
      ]);
      evaluateBundle({ baseline, expectation: "baseline-establishment", manifest });
      const after = fs.readFileSync(pointerPath);
      assert(Buffer.compare(before, after) === 0, "pointer bytes must not change");
    },
  },
  {
    name: "gate freshness and candidate expectation",
    run: () => {
      const manifest = loadManifest(root).manifest;
      const current = source("aaa");
      const stale = gateCurrent({
        currentSource: source("bbb"),
        manifest,
        pointer: {
          baselineVersion: "b1",
          bundlePath: "missing.json",
          environmentDigest: "e",
          evaluatorDigest: evaluatorDigest(),
          priorBaselineReference: null,
          reason: "first",
          scenarioDigest: "scenario",
          schemaVersion: 1,
          sourceDigest: "aaa",
          status: "accepted",
        },
        repoRoot: root,
      });
      assert(stale.status === "blocked" || stale.status === "stale-evidence", stale.status);
      parseCandidateRequest({ candidateId: "c1", expectation: "improvement", sourceRoot: root });
      let failed = false;
      try {
        parseCandidateRequest({ candidateId: "c1", expectation: "improvement", sourceRoot: root, inferred: true });
      } catch {
        failed = true;
      }
      assert(failed, "candidate request extra field must fail");
      void current;
    },
  },
  {
    name: "package scripts route the focused tests and provider-free CLI",
    run: () => {
      const pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8")) as { scripts: Record<string, string> };
      assert(pkg.scripts["proof:consumer-outcome"] === "node tools/proofs/consumer-outcome-regression.ts", "proof script");
      assert(pkg.scripts["test:focused:consumer-outcome"] === "node tools/run-focused-test.ts tools/test-consumer-outcome.ts", "focused script");
      assert(pkg.scripts.test.includes("tools/test-consumer-outcome.ts"), "test suite includes consumer outcome");
      const readme = fs.readFileSync(path.join(root, "tools/proofs/README.md"), "utf8");
      assert(readme.includes("`consumer-outcome-regression.ts`"), "proof inventory");
      assert(readme.includes("never runs from CI"), "capture authorization");
    },
  },
];

let failed = 0;
for (const test of tests) {
  try {
    await test.run();
    console.log(`PASS ${test.name}`);
  } catch (error) {
    failed += 1;
    console.error(`FAIL ${test.name}`);
    console.error(error instanceof Error ? error.message : String(error));
  }
}
if (failed > 0) process.exit(1);
console.log(`OK: consumer outcome tests=${tests.length}`);
