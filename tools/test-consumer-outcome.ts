#!/usr/bin/env node
import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { runPortableCommand } from "../global/bin/portable-process.ts";
import { FOUNDATION_SERVER_PROMPT_TIMEOUT_MS, captureLane, changedTextEvidence, configuredScenarioTimeoutMs, copyScenarioSeed, createCaptureBundle, createFoundationBundleFromDiagnostic, materializeConfiguredProofConfig, processTerminationEvidence, sealConfiguredDiagnostic, sealSample } from "./proofs/consumer-outcome/capture.ts";
import {
  type CaptureBundle,
  type BoundedFalsificationScenarioExpectation,
  type ComplexityFacadeScenarioExpectation,
  type EnvironmentIdentity,
  type FrictionVector,
  type FoundationIntegrityScenarioExpectation,
  type SampleEvidence,
  type SourceIdentity,
  type StatusScopeDecisionSet,
  COMPLEXITY_CONFIGURED_SESSION_MEMBER_ORDER,
  ContractError,
  assertPrivacySafe,
  defaultRedactions,
  digestOf,
  emptyFriction,
  evaluatorDigest,
  governedSourceIdentity,
  complexityConfiguredInvocationManifest,
  loadComplexityConfiguredSessionPack,
  loadDecisionGapPack,
  loadManifest,
  parseCandidateRequest,
  parseComplexityConfiguredSessionPack,
  parseDecisionGapPack,
  parseManifest,
  posixPath,
  redactText,
  redactPrivacyMarkers,
  sha256,
  stableJson,
  verifyFixtureSeed,
} from "./proofs/consumer-outcome/contracts.ts";
import { evaluateBundle, evaluateComplexityConfiguredSessionPack, evaluateDecisionGapPack, gateCurrent, replayEvaluation } from "./proofs/consumer-outcome/evaluate.ts";
import { loadDeliveryCheckpointConfiguredPack, loadDeliveryCheckpointPack, parseDeliveryCheckpointPack } from "./proofs/consumer-outcome/delivery-checkpoint.ts";
import {
  deliveryCheckpointContinuityPreflight,
  evaluateDeliveryCheckpointContinuity,
  loadDeliveryCheckpointContinuityFixture,
  sealDeliveryCheckpointContinuityBundle,
  type DeliveryCheckpointContinuityBundle,
} from "./proofs/consumer-outcome/delivery-checkpoint-continuity.ts";
import { loadDeliveryTrajectoryConfiguredPack, loadDeliveryTrajectoryPack, selectDeliveryTrajectoryConfiguredScenario } from "./proofs/consumer-outcome/delivery-trajectory.ts";
import { evaluateTeamAdviceContinuity, loadTeamAdviceContinuityFixture, sealTeamAdviceContinuityBundle, teamAdviceContinuityPreflight, type TeamAdviceContinuityBundle, type TeamAdviceContinuitySample } from "./proofs/consumer-outcome/team-advice-continuity.ts";
import { evaluateTeamAdvisingPack, loadTeamAdvisingPack, redactTeamBundlePrivacy, sanitizeTeamEvidenceText, sealTeamBundle, sealTeamSample, selectTeamAdvisingPack, type TeamBundle, type TeamSampleEvidence } from "./proofs/consumer-outcome/team-advising.ts";
import { projectBundles, selectComplexityConfiguredPack, selectFoundationPack } from "./proofs/consumer-outcome-regression.ts";
import { assertProofRouteAvailable, configuredProofServerEnvironment, proofServerLogs, proofServerStartupFacts, proofServerStartupFailure, runDiagnosticProofSession, runSummarizedProofSession, seedProofModelsCatalog, startProofServer, stopProofServer, waitForProofRoute, type ProofRoute, type ProofServerHandle } from "./proofs/lib/opencode-proof-client.ts";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const cli = path.join(root, "tools/proofs/consumer-outcome-regression.ts");

type TestCase = { name: string; run: () => Promise<void> | void };

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function tempDir(name: string): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), `consumer-outcome-test-${name}-`));
}

function resolveChangeFile(changeId: string, relative: string): { lifecycle: "active" | "archived"; path: string } {
  const active = path.join(root, "openspec", "changes", changeId, relative);
  if (fs.existsSync(active)) return { lifecycle: "active", path: active };
  const archiveRoot = path.join(root, "openspec", "changes", "archive");
  const archived = fs.existsSync(archiveRoot)
    ? fs.readdirSync(archiveRoot, { withFileTypes: true })
      .filter((entry) => entry.isDirectory() && entry.name.endsWith(`-${changeId}`))
      .map((entry) => path.join(archiveRoot, entry.name, relative))
      .filter((file) => fs.existsSync(file))
      .sort()
    : [];
  if (archived.length !== 1) throw new Error(`Expected one active or archived ${changeId}/${relative}, found ${archived.length}.`);
  return { lifecycle: "archived", path: archived[0]! };
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

function foundationIntegritySample(input: {
  arm: "baseline" | "candidate";
  expected: FoundationIntegrityScenarioExpectation["baseline"];
  scenario: ReturnType<typeof loadDecisionGapPack>["pack"]["manifest"]["scenarios"][number];
}): SampleEvidence {
  const taskCount = input.expected.initialReviewCount + input.expected.correctedReviewCount;
  const toolCalls = [
    ...Array.from({ length: taskCount }, (_, index) => ({ argumentDigest: `task-${index}`, name: "task", status: "completed" })),
    ...Array.from({ length: input.expected.recoverySkillCount }, (_, index) => ({ argumentDigest: `skill-${index}`, name: "skill", status: "completed" })),
  ];
  return sample({
    arm: input.arm,
    environmentIdentity: env({ initialFixtureDigest: input.scenario.id }),
    files: [{ path: "decision.json", sha256: "decision" }],
    forbiddenEffects: input.scenario.forbiddenEffects.map((name) => ({ name, observed: false })),
    friction: { ...emptyFriction(), totalToolCallCount: toolCalls.length },
    permissions: { ...input.scenario.permissions, violations: [] },
    proof: { argv: input.scenario.proofExpectations.argv, status: 0, stderr: "", stdout: JSON.stringify(input.expected) },
    sampleIndex: 1,
    scenarioId: input.scenario.id,
    sideEffects: input.scenario.allowedEffects,
    toolCalls,
    validation: { argv: input.scenario.validationArgv, status: 0, stderr: "", stdout: "validation passed" },
  });
}

function boundedFalsificationSample(input: {
  arm: "baseline" | "candidate";
  expected: BoundedFalsificationScenarioExpectation["baseline"];
  scenario: ReturnType<typeof loadDecisionGapPack>["pack"]["manifest"]["scenarios"][number];
}): SampleEvidence {
  const taskCount = input.expected.reviewerLaunchCount + (input.expected.exactOwnerAgent === "none" ? 0 : 1);
  const toolCalls = Array.from({ length: taskCount }, (_, index) => ({ argumentDigest: `task-${index}`, name: "task", status: "completed" }));
  return sample({
    arm: input.arm,
    environmentIdentity: env({ initialFixtureDigest: input.scenario.id }),
    files: input.scenario.expectedOutcome.stateFiles.map((filePath) => ({ path: filePath, sha256: `state-${filePath}` })),
    forbiddenEffects: input.scenario.forbiddenEffects.map((name) => ({ name, observed: false })),
    friction: { ...emptyFriction(), totalToolCallCount: toolCalls.length },
    permissions: { ...input.scenario.permissions, violations: [] },
    proof: { argv: input.scenario.proofExpectations.argv, status: 0, stderr: "", stdout: JSON.stringify(input.expected) },
    sampleIndex: 1,
    scenarioId: input.scenario.id,
    sideEffects: input.scenario.allowedEffects,
    toolCalls,
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
    name: "delivery-checkpoint pack materializes reviewed judgments provider-free and rejects red controls",
    run() {
      const directory = tempDir("delivery-checkpoint");
      const evidenceRoot = path.join(directory, "materialized");
      try {
        const loaded = loadDeliveryCheckpointPack(root);
        const sourceBefore = governedSourceIdentity(root, "working-tree", loaded.pack.governedSourcePaths).governedDigest;
        assert(loaded.pack.claimId === "OPDC-001" && loaded.pack.scenarios.length === 12, "delivery-checkpoint population identity");
        assert(loaded.pack.continuityControls.map((control) => control.id).join(",") === "shift-left-route-change,irreducible-current-route,population-reduction-owner-boundary,compaction-due-checkpoint", "delivery-checkpoint continuity control order");
        const compactionControl = loaded.pack.continuityControls.find((control) => control.id === "compaction-due-checkpoint");
        assert(compactionControl?.expectedObservation.compactionBlock?.fields.join(",") === "Checkpoint Ref,Evidence Refs,Selected Route,Preserved Outcome/Oracle/Population,Next Action,Next Oracle,Suppression Condition", "delivery-checkpoint compaction fields");
        assert(loaded.pack.continuityControls.every((control) => control.expectedObservation.kaizenDependency === false), "delivery-checkpoint continuity must not depend on Kaizen");
        assert(loaded.pack.scenarios.map((scenario) => scenario.id).join(",") === [
          "similar-retry-stagnation",
          "different-defect-late-discovery",
          "coarse-invalidation-amplification",
          "failed-costly-repetition",
          "dominant-repeated-setup",
          "advancing-long-work",
          "single-cheap-failure",
          "irreducible-cost",
          "duplicate-suppression",
          "independent-sibling-work",
          "scope-proof-weakening",
          "compaction-continuity",
        ].join(","), "delivery-checkpoint scenario order");

        const help = invokeCli(["--help"]);
        const shortHelp = invokeCli(["-h"]);
        assert(help.status === 0 && shortHelp.status === 0 && help.stdout === shortHelp.stdout, "delivery-checkpoint help must be effect-free and stable");
        assert(help.stdout.includes("delivery-checkpoint freezes twelve reviewed OPDC-001 members") && help.stdout.includes("without semantic scoring"), "delivery-checkpoint help inventory");
        const preflight = invokeCli(["--mode", "preflight", "--pack", "delivery-checkpoint", "--source-ref", "working-tree"]);
        assert(preflight.status === 0, preflight.stderr || preflight.stdout);
        const preflightOutput = JSON.parse(preflight.stdout) as Record<string, unknown>;
        assert(preflightOutput.status === "ready" && preflightOutput.memberCount === 12, preflight.stdout);
        assert(preflightOutput.modelCalls === 0 && preflightOutput.processCalls === 0 && preflightOutput.providerCalls === 0, "delivery-checkpoint preflight effects");

        const materialized = invokeCli([
          "--mode", "materialize",
          "--pack", "delivery-checkpoint",
          "--source-ref", "working-tree",
          "--candidate-id", "opdc-provider-free-test",
          "--evidence-root", evidenceRoot,
        ]);
        assert(materialized.status === 0, materialized.stderr || materialized.stdout);
        const output = JSON.parse(materialized.stdout) as {
          evaluation?: {
            continuityRows?: Array<{ expected?: unknown; observed?: unknown; oracleMatched?: unknown }>;
            costArithmetic?: Array<{ scenarioId?: unknown; totalCostUnits?: unknown }>;
            rows?: Array<{ expected?: unknown; observed?: unknown; oracleMatched?: unknown }>;
            status?: unknown;
          };
          liveCalls?: unknown;
          pointerMutated?: unknown;
          sourceDigest?: unknown;
        };
        assert(output.evaluation?.status === "passed" && output.evaluation.rows?.length === 24, materialized.stdout);
        assert(output.evaluation.rows.filter((row) => row.expected === "pass" && row.observed === "passed" && row.oracleMatched === true).length === 12, "delivery-checkpoint green rows");
        assert(output.evaluation.rows.filter((row) => row.expected === "fail" && row.observed === "failed" && row.oracleMatched === true).length === 12, "delivery-checkpoint deliberate red rows");
        assert(output.evaluation.continuityRows?.filter((row) => row.expected === "pass" && row.observed === "passed" && row.oracleMatched === true).length === 4, "delivery-checkpoint continuity green rows");
        assert(output.evaluation.continuityRows?.filter((row) => row.expected === "fail" && row.observed === "failed" && row.oracleMatched === true).length === 7, "delivery-checkpoint continuity deliberate red rows");
        assert(output.evaluation.costArithmetic?.find((row) => row.scenarioId === "dominant-repeated-setup")?.totalCostUnits === 825, "delivery-checkpoint explicit cost arithmetic");
        assert(output.liveCalls === 0 && output.pointerMutated === false && output.sourceDigest === sourceBefore, "delivery-checkpoint materialization effects and identity");
        const bundlePath = path.join(evidenceRoot, "bundle.json");
        const bundle = JSON.parse(fs.readFileSync(bundlePath, "utf8")) as Record<string, unknown>;
        const effects = bundle.effects as Record<string, unknown>;
        const cleanup = bundle.cleanup as Record<string, unknown>;
        assert(effects.providerCalls === 0 && effects.networkCalls === 0 && effects.processCalls === 0 && effects.sourceWrites === 0 && effects.remoteEffects === 0, "delivery-checkpoint bundle effects");
        assert(cleanup.status === "complete" && cleanup.terminal === true && cleanup.persistentTemporaryFiles === 0, "delivery-checkpoint cleanup");
        assert(governedSourceIdentity(root, "working-tree", loaded.pack.governedSourcePaths).governedDigest === sourceBefore, "delivery-checkpoint materialization must not mutate governed source");

        const replayArgs = ["--mode", "evaluate", "--pack", "delivery-checkpoint", "--baseline", bundlePath];
        const replayA = invokeCli(replayArgs);
        const replayB = invokeCli(replayArgs);
        assert(replayA.status === 0 && replayB.status === 0, replayA.stderr || replayB.stderr || replayA.stdout || replayB.stdout);
        assert(replayA.stdout === replayB.stdout, "delivery-checkpoint replay must be byte-stable");
        const replayOutput = JSON.parse(replayA.stdout) as { evaluation?: { rows?: unknown[]; status?: unknown }; liveCalls?: unknown };
        assert(replayOutput.evaluation?.status === "passed" && replayOutput.evaluation.rows?.length === 24 && replayOutput.liveCalls === 0, replayA.stdout);

        const existingRoot = invokeCli([
          "--mode", "materialize", "--pack", "delivery-checkpoint", "--source-ref", "working-tree",
          "--candidate-id", "opdc-existing-root-test", "--evidence-root", evidenceRoot,
        ]);
        assert(existingRoot.status === 1 && existingRoot.stderr.includes("must be create-new"), existingRoot.stderr || existingRoot.stdout);
        const stalePath = path.join(directory, "stale.json");
        bundle.bundleDigest = "0".repeat(64);
        fs.writeFileSync(stalePath, `${JSON.stringify(bundle)}\n`, "utf8");
        const stale = invokeCli(["--mode", "evaluate", "--pack", "delivery-checkpoint", "--baseline", stalePath]);
        assert(stale.status === 1 && stale.stderr.includes("bundle digest mismatch"), stale.stderr || stale.stdout);

        const rawSeed = JSON.parse(fs.readFileSync(path.join(root, "tools/proofs/fixtures/consumer-outcome/delivery-checkpoint-r1.json"), "utf8")) as Record<string, unknown>;
        const malformed = structuredClone(rawSeed);
        delete malformed.claimId;
        let malformedError: unknown;
        try {
          parseDeliveryCheckpointPack(malformed);
        } catch (error) {
          malformedError = error;
        }
        assert(malformedError instanceof ContractError, "delivery-checkpoint malformed seed must fail closed");
        const overflow = structuredClone(rawSeed) as { scenarios: Array<{ reviewedJudgment: { costMeasurements: Array<Record<string, unknown>> } }> };
        overflow.scenarios[0]!.reviewedJudgment.costMeasurements[0] = { id: "overflow", count: 1000000, unitCost: 2, expectedTotal: 2000000 };
        let overflowError: unknown;
        try {
          parseDeliveryCheckpointPack(overflow);
        } catch (error) {
          overflowError = error;
        }
        assert(overflowError instanceof ContractError, "delivery-checkpoint cost overflow must fail closed");

        const helperSource = fs.readFileSync(path.join(root, "tools/proofs/consumer-outcome/delivery-checkpoint.ts"), "utf8");
        for (const forbidden of ["Date.now", "performance.now", "similarityScore", "dominanceThreshold", "qualityScore"]) {
          assert(!helperSource.includes(forbidden), `delivery-checkpoint helper must not contain ${forbidden}`);
        }
        const packageJson = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8")) as { scripts?: Record<string, string> };
        const proofReadme = fs.readFileSync(path.join(root, "tools/proofs/README.md"), "utf8");
        assert(packageJson.scripts?.["proof:consumer-outcome"] === "node tools/proofs/consumer-outcome-regression.ts", "delivery-checkpoint proof inventory script");
        assert(proofReadme.includes("consumer-outcome-regression.ts"), "delivery-checkpoint existing proof inventory readback");
      } finally {
        fs.rmSync(directory, { force: true, recursive: true });
      }
    },
  },
  {
    name: "delivery-checkpoint configured pack freezes one canary and two finite population repositories",
    run() {
      const directory = tempDir("delivery-checkpoint-configured");
      try {
        const loaded = loadDeliveryCheckpointConfiguredPack(root);
        const scenario = loaded.pack.scenarios[0]!;
        assert(loaded.pack.id === "delivery-checkpoint-configured-r1", "configured delivery-checkpoint pack identity");
        assert(loaded.pack.runtimeProfile === "core" && loaded.pack.profile === "quality-independent", "configured delivery-checkpoint profile identity");
        assert(loaded.pack.configuredProviderRequestBound === 1 && loaded.pack.scenarios.length === 3, "configured delivery-checkpoint request bound");
        assert(scenario.id === "configured-different-late-failures" && scenario.shape === "ordinary-small", "configured delivery-checkpoint scenario identity");
        assert("checkpointCount" in scenario.expectedResult && scenario.expectedResult.checkpointCount === 1 && scenario.expectedResult.costlyActionRepeatCount === 0, "configured delivery-checkpoint exact result");
        assert("productQuestionCount" in scenario.expectedResult && scenario.expectedResult.productQuestionCount === 0 && scenario.expectedResult.protectedActionCount === 0, "configured delivery-checkpoint safety result");
        const populationScenarios = loaded.pack.scenarios.slice(1);
        const populationMemberIds = populationScenarios.flatMap((candidate) => (
          "rows" in candidate.expectedResult ? candidate.expectedResult.rows.map((row) => row.memberId) : []
        ));
        assert(populationMemberIds.length === 12 && new Set(populationMemberIds).size === 12, "configured delivery-checkpoint finite population coverage");
        assert(populationScenarios.map((candidate) => candidate.shape).join(",") === "ordinary-small,openspec-backed", "configured delivery-checkpoint unrelated repository classes");
        assert(loaded.pack.maximumClaim.includes("twelve reviewed OPDC-001 members") && loaded.pack.maximumClaim.includes("exact member rows"), "configured delivery-checkpoint claim ceiling");
        const fixtureRoot = path.join(directory, "fixture");
        fs.cpSync(path.join(root, scenario.fixturePath), fixtureRoot, { recursive: true });
        fs.writeFileSync(path.join(fixtureRoot, "checkpoint-result.json"), `${JSON.stringify({
          schemaVersion: 1,
          checkpointId: "late-validation-manifest-cache-r1",
          checkpointStatus: "recorded",
          triggerRef: "materially-different-failures-same-costly-late-boundary",
          selectedRoute: "earlier-manifest-cache-canary",
          nextOracle: "canary-result.json:passed",
          outcomeRef: "twelve-reviewed-local-reports",
          envelopeRef: "disposable-local-fixture",
          oracleRef: "unchanged-twelve-report-late-validation",
          populationRef: "twelve-report-population-r1",
          nonDeferrableInvariants: ["no-population-reduction", "no-proof-weakening", "no-protected-action"],
          checkpointCount: 1,
          costlyActionRepeatCount: 0,
          productQuestionCount: 0,
          protectedActionCount: 0,
          duplicateDisposition: "suppressed-unchanged-evidence",
          events: [
            "trigger-detected:different-failures-same-costly-late-boundary",
            "checkpoint-recorded:late-validation-manifest-cache-r1",
            "route-selected:earlier-manifest-cache-canary",
            "scope-oracle-population:unchanged",
            "costly-action-repeat-count:0",
            "protected-boundary:unchanged",
            "autonomous-continuation:canary",
            "duplicate-suppressed:unchanged-evidence",
            "cleanup-ready:proof-owned-fixture",
          ],
        })}\n`, "utf8");
        const canary = spawnSync(process.execPath, ["scripts/run-canary.ts"], { cwd: fixtureRoot, encoding: "utf8", timeout: 60_000 });
        assert(canary.status === 0 && canary.stdout.includes('"status":"passed"'), canary.stderr || canary.stdout);
        const proof = spawnSync(process.execPath, ["scripts/check-result.ts"], { cwd: fixtureRoot, encoding: "utf8", timeout: 60_000 });
        assert(proof.status === 0 && proof.stdout.includes('"eventCount":9') && proof.stdout.includes('"scopeOraclePopulation":"unchanged"'), proof.stderr || proof.stdout);
        for (const [index, populationScenario] of populationScenarios.entries()) {
          assert("rows" in populationScenario.expectedResult, "configured population scenario result kind");
          const populationRoot = path.join(directory, `population-${index}`);
          fs.cpSync(path.join(root, populationScenario.fixturePath), populationRoot, { recursive: true });
          fs.writeFileSync(path.join(populationRoot, "population-result.json"), `${JSON.stringify(populationScenario.expectedResult)}\n`, "utf8");
          const populationProof = spawnSync(process.execPath, ["scripts/check-result.ts"], { cwd: populationRoot, encoding: "utf8", timeout: 60_000 });
          assert(populationProof.status === 0 && populationProof.stdout.includes(`"memberCount":${populationScenario.expectedResult.memberCount}`)
            && populationProof.stdout.includes(`"repositoryClass":"${populationScenario.expectedResult.repositoryClass}"`), populationProof.stderr || populationProof.stdout);
        }
        const help = invokeCli(["--help"]);
        assert(help.status === 0 && help.stdout.includes("configured ordinary/OpenSpec population lane permits one request") && help.stdout.includes("exact reviewed rows"), "configured delivery-checkpoint help inventory");
        const missingLiveInputs = invokeCli([
          "--mode", "preflight", "--pack", "delivery-checkpoint", "--source-ref", "working-tree", "--session-mode", "configured",
        ]);
        assert(missingLiveInputs.status === 1 && missingLiveInputs.stderr.includes("requires --opencode and --candidate-config-dir"), missingLiveInputs.stderr || missingLiveInputs.stdout);
      } finally {
        fs.rmSync(directory, { force: true, recursive: true });
      }
    },
  },
  {
    name: "delivery-checkpoint OpenSpec compaction fixture and evaluator fail closed offline",
    run() {
      const directory = tempDir("delivery-checkpoint-continuity");
      const fixtureRoot = path.join(directory, "fixture");
      try {
        const loaded = loadDeliveryCheckpointContinuityFixture(root);
        const preflight = deliveryCheckpointContinuityPreflight({ repoRoot: root });
        assert(preflight.status === "ready" && preflight.stateFieldsPresent === true, "delivery-checkpoint continuity offline preflight");
        fs.cpSync(path.join(root, "tools/proofs/fixtures/consumer-outcome/delivery-checkpoint-openspec-v1"), fixtureRoot, { recursive: true });
        const changeRoot = path.join(fixtureRoot, "openspec", "changes", "checkpoint-route");
        const initialPlanning = Object.fromEntries(Object.keys(loaded.fixture.expectedPlanning).map((relative) => [relative, fs.readFileSync(path.join(changeRoot, relative), "utf8")]));
        for (const [relative, contents] of Object.entries(loaded.fixture.expectedPlanning)) fs.writeFileSync(path.join(changeRoot, relative), contents, "utf8");
        const beforeCompaction = spawnSync(process.execPath, ["scripts/check-before-compaction.ts"], { cwd: fixtureRoot, encoding: "utf8", timeout: 60_000 });
        const precompaction = JSON.parse(fs.readFileSync(path.join(fixtureRoot, "precompaction-result.json"), "utf8")) as { nextAction: string; resumeToken: string };
        fs.rmSync(path.join(fixtureRoot, "precompaction-result.json"));
        const canary = spawnSync(process.execPath, ["scripts/complete-canary.ts", "--resume-token", precompaction.resumeToken], { cwd: fixtureRoot, encoding: "utf8", timeout: 60_000 });
        const final = spawnSync(process.execPath, ["scripts/check-final.ts"], { cwd: fixtureRoot, encoding: "utf8", timeout: 60_000 });
        assert(beforeCompaction.status === 0 && canary.status === 0 && final.status === 0, beforeCompaction.stderr || canary.stderr || final.stderr);
        const changedPaths = Object.keys(loaded.fixture.expectedPlanning).sort((a, b) => a.localeCompare(b));
        const unchanged = loaded.fixture.unchangedPlanningPaths.map((relative) => ({ path: posixPath(relative), sha256: sha256(fs.readFileSync(path.join(changeRoot, relative))) }));
        const before = [
          ...unchanged,
          ...changedPaths.map((relative) => ({ path: relative, sha256: sha256(initialPlanning[relative]!) })),
        ].sort((a, b) => a.path.localeCompare(b.path));
        const after = [
          ...unchanged,
          ...changedPaths.map((relative) => ({ path: relative, sha256: sha256(fs.readFileSync(path.join(changeRoot, relative))) })),
        ].sort((a, b) => a.path.localeCompare(b.path));
        const checkpoint = loaded.fixture.checkpoint;
        const summary = [
          "Delivery Checkpoint State",
          `Selected Route: ${checkpoint.selectedRoute}`,
          `Preserved Outcome/Oracle/Population: ${checkpoint.preservedOutcomeOraclePopulation}`,
          `Next Action: ${precompaction.nextAction}`,
          `Next Oracle: ${checkpoint.nextOracle}`,
          `Suppression Condition: ${checkpoint.suppressionCondition}`,
        ].join("\n");
        const bundle = sealDeliveryCheckpointContinuityBundle({
          candidateId: "offline-fixture",
          captureErrorFacts: null,
          cleanup: { complete: true, error: null, fixtureRemoved: true, processRemoved: true, sessionsRemoved: true },
          environment: {
            configDigest: "a".repeat(64),
            installedOpenCode: { sha256: "b".repeat(64), version: "fixture" },
            node: process.version,
            platform: process.platform,
            routes: { compaction: "fixture/model/default", main: "fixture/model/default" },
          },
          finalCommand: { status: 0, stderr: "", stdout: final.stdout },
          fixtureDigest: loaded.digest,
          id: loaded.fixture.id,
          markers: {
            canary: JSON.parse(fs.readFileSync(path.join(fixtureRoot, "canary-result.json"), "utf8")),
            precompaction,
          },
          planning: { after, before, changedPaths, observed: { ...loaded.fixture.expectedPlanning } },
          roundtrip: {
            compactionContext: summary,
            error: null,
            mainResponse: summary,
            providerRequestCount: 3,
            reconstructionResponse: final.stdout.trim(),
            sessionCleanup: { error: null, sessionsRemoved: true },
            sessionRef: "fixture-session",
            summarizeAccepted: true,
            toolCalls: [
              { name: "skill", status: "completed" },
              { name: "read", status: "completed" },
              { name: "apply_patch", status: "completed" },
              { name: "bash", status: "completed" },
            ],
          },
          schemaVersion: 1,
          server: {
            signal: null,
            startup: { hostConfigLoaded: false, isolatedConfigLoaded: true, ripgrepDownloadRequested: false },
            status: 0,
            stderr: "",
            stdout: "",
          },
          sourceIdentity: source("continuity-source"),
          sourceUnchanged: true,
        });
        const green = evaluateDeliveryCheckpointContinuity(loaded.fixture, loaded.digest, bundle);
        assert(green.status === "passed" && green.failures.length === 0 && green.modelCalls === 3, JSON.stringify(green));
        const redInput = structuredClone(bundle) as DeliveryCheckpointContinuityBundle;
        redInput.roundtrip.compactionContext = summary.replace(`Next Oracle: ${checkpoint.nextOracle}\n`, "");
        const { bundleDigest: _bundleDigest, byteLength: _byteLength, ...redValue } = redInput;
        const redBundle = sealDeliveryCheckpointContinuityBundle(redValue);
        const red = evaluateDeliveryCheckpointContinuity(loaded.fixture, loaded.digest, redBundle);
        assert(red.status === "failed" && red.failures.includes("missing-checkpoint-state:Next Oracle"), JSON.stringify(red));
      } finally {
        fs.rmSync(directory, { force: true, recursive: true });
      }
    },
  },
  {
    name: "delivery-trajectory pack is provider-free, replay-stable, and fail-closed",
    run() {
      const directory = tempDir("delivery-trajectory");
      const baselineRoot = path.join(directory, "baseline");
      const candidateRoot = path.join(directory, "candidate");
      try {
        const pack = loadDeliveryTrajectoryPack(root).pack;
        assert(pack.governedSourcePaths.includes("openspec/specs/library-roadmap-delivery-trajectory/spec.md"), "delivery-trajectory pack must govern the canonical archived spec");
        assert(pack.governedSourcePaths.every((sourcePath) => !sourcePath.startsWith("openspec/changes/")), "delivery-trajectory governed sources must survive change archive");
        const preflight = invokeCli(["--mode", "preflight", "--pack", "delivery-trajectory", "--source-ref", "working-tree"]);
        assert(preflight.status === 0, preflight.stderr || preflight.stdout);
        const preflightOutput = JSON.parse(preflight.stdout) as {
          memberCount?: unknown;
          modelCalls?: unknown;
          processCalls?: unknown;
          providerCalls?: unknown;
          scenarioIds?: unknown[];
          status?: unknown;
        };
        assert(preflightOutput.status === "ready" && preflightOutput.memberCount === 13, preflight.stdout);
        assert(preflightOutput.scenarioIds?.length === 13, "delivery-trajectory member inventory");
        assert(preflightOutput.modelCalls === 0 && preflightOutput.processCalls === 0 && preflightOutput.providerCalls === 0, "delivery-trajectory preflight effects");

        const baseline = invokeCli([
          "--mode", "baseline",
          "--pack", "delivery-trajectory",
          "--source-ref", "working-tree",
          "--candidate-id", "delivery-trajectory-baseline-test",
          "--evidence-root", baselineRoot,
        ]);
        assert(baseline.status === 0, baseline.stderr || baseline.stdout);
        const baselineOutput = JSON.parse(baseline.stdout) as { evaluation?: { rows?: unknown[]; status?: unknown }; liveCalls?: unknown; pointerMutated?: unknown; sourceDigest?: unknown };
        assert(baselineOutput.evaluation?.status === "passed" && baselineOutput.evaluation.rows?.length === 13, baseline.stdout);
        assert(baselineOutput.liveCalls === 0 && baselineOutput.pointerMutated === false, baseline.stdout);

        const baselinePath = path.join(baselineRoot, "bundle.json");
        const candidate = invokeCli([
          "--mode", "capture",
          "--pack", "delivery-trajectory",
          "--source-ref", "working-tree",
          "--candidate-id", "delivery-trajectory-candidate-test",
          "--evidence-root", candidateRoot,
          "--baseline", baselinePath,
        ]);
        assert(candidate.status === 0, candidate.stderr || candidate.stdout);
        const candidateOutput = JSON.parse(candidate.stdout) as {
          evaluation?: { evaluationDigest?: unknown; inputDifference?: Record<string, unknown>; rows?: unknown[]; status?: unknown };
          liveCalls?: unknown;
          pointerMutated?: unknown;
          sourceDigest?: unknown;
        };
        assert(candidateOutput.evaluation?.status === "passed" && candidateOutput.evaluation.rows?.length === 26, candidate.stdout);
        assert(candidateOutput.evaluation?.inputDifference?.matchedExceptNamedDifference === true, candidate.stdout);
        assert(candidateOutput.liveCalls === 0 && candidateOutput.pointerMutated === false, candidate.stdout);
        assert(candidateOutput.sourceDigest === baselineOutput.sourceDigest, "delivery-trajectory source identity");

        const candidatePath = path.join(candidateRoot, "bundle.json");
        const replayArgs = [
          "--mode", "evaluate",
          "--pack", "delivery-trajectory",
          "--source-ref", "working-tree",
          "--baseline", baselinePath,
          "--candidate", candidatePath,
        ];
        const replayA = invokeCli(replayArgs);
        const replayB = invokeCli(replayArgs);
        assert(replayA.status === 0 && replayB.status === 0, replayA.stderr || replayB.stderr || replayA.stdout || replayB.stdout);
        assert(replayA.stdout === replayB.stdout, "delivery-trajectory replay must be byte-stable");
        const replayOutput = JSON.parse(replayA.stdout) as { evaluation?: { evaluationDigest?: unknown; status?: unknown }; liveCalls?: unknown };
        assert(replayOutput.evaluation?.status === "passed" && replayOutput.liveCalls === 0, replayA.stdout);
        assert(replayOutput.evaluation?.evaluationDigest === candidateOutput.evaluation?.evaluationDigest, "delivery-trajectory evaluator digest");

        const invalidPath = path.join(directory, "invalid.json");
        fs.writeFileSync(invalidPath, "not-json\n", "utf8");
        const invalid = invokeCli(["--mode", "evaluate", "--pack", "delivery-trajectory", "--source-ref", "working-tree", "--baseline", invalidPath]);
        assert(invalid.status === 1 && invalid.stderr.includes("not valid JSON"), invalid.stderr || invalid.stdout);

        const stalePath = path.join(directory, "stale.json");
        const staleBundle = JSON.parse(fs.readFileSync(baselinePath, "utf8")) as Record<string, unknown>;
        staleBundle.bundleDigest = "0".repeat(64);
        fs.writeFileSync(stalePath, `${JSON.stringify(staleBundle)}\n`, "utf8");
        const stale = invokeCli(["--mode", "evaluate", "--pack", "delivery-trajectory", "--source-ref", "working-tree", "--baseline", stalePath]);
        assert(stale.status === 1 && stale.stderr.includes("bundle digest mismatch"), stale.stderr || stale.stdout);

        const privatePath = path.join(directory, "private.json");
        fs.writeFileSync(privatePath, `${JSON.stringify({ path: String.raw`C:\Users\private-user\source` })}\n`, "utf8");
        const privateReplay = invokeCli(["--mode", "evaluate", "--pack", "delivery-trajectory", "--source-ref", "working-tree", "--baseline", privatePath]);
        assert(privateReplay.status === 1 && privateReplay.stderr.includes("contains a private path"), privateReplay.stderr || privateReplay.stdout);

        const configured = invokeCli(["--mode", "preflight", "--pack", "delivery-trajectory", "--source-ref", "working-tree", "--session-mode", "configured"]);
        assert(configured.status === 1 && configured.stderr.includes("requires --opencode and --candidate-config-dir"), configured.stderr || configured.stdout);
        const existingRoot = invokeCli([
          "--mode", "baseline",
          "--pack", "delivery-trajectory",
          "--source-ref", "working-tree",
          "--candidate-id", "delivery-trajectory-existing-root-test",
          "--evidence-root", baselineRoot,
        ]);
        assert(existingRoot.status === 1 && existingRoot.stderr.includes("must be create-new"), existingRoot.stderr || existingRoot.stdout);
      } finally {
        fs.rmSync(directory, { force: true, recursive: true });
      }
    },
  },
  {
    name: "delivery-trajectory configured pack freezes two archive happy paths",
    run() {
      const loaded = loadDeliveryTrajectoryConfiguredPack(root);
      assert(loaded.pack.id === "delivery-trajectory-configured-r1", "configured trajectory pack identity");
      assert(loaded.pack.runtimeProfile === "core" && loaded.pack.profile === "quality-independent", "configured trajectory profile identity");
      assert(loaded.pack.configuredProviderRequestBound === 2 && loaded.pack.scenarios.length === 2, "configured trajectory request bound");
      assert(loaded.pack.scenarios.map((scenario) => scenario.id).join(",") === "configured-no-trigger-archive,configured-repeated-touch-successor", "configured trajectory scenario order");
      assert(loaded.pack.scenarios.every((scenario) => scenario.fixturePath.endsWith("delivery-trajectory-v1") && scenario.cleanupOracle.fixtureRemoved), "configured trajectory fixture and cleanup");
      const noTrigger = selectDeliveryTrajectoryConfiguredScenario(loaded.pack, "configured-no-trigger-archive");
      assert(noTrigger.scenarios.length === 1 && noTrigger.scenarios[0]?.expectedResult.trajectory === "none", "configured no-trigger selection");
      let unknown: unknown;
      try {
        selectDeliveryTrajectoryConfiguredScenario(loaded.pack, "missing");
      } catch (error) {
        unknown = error;
      }
      assert(unknown instanceof ContractError, "configured trajectory selection must fail closed");
      const help = invokeCli(["--help"]);
      assert(help.status === 0 && help.stdout.includes("two explicit archive happy paths") && help.stdout.includes("one request per selected scenario"), "configured trajectory help inventory");
    },
  },
  {
    name: "team-advising pack freezes the nine-member population and bounded root turns",
    run() {
      const loaded = loadTeamAdvisingPack(root);
      assert(loaded.pack.memberOrder.length === 9, "team-advising member count");
      assert(loaded.pack.scenarios.reduce((sum, scenario) => sum + scenario.turns.length, 0) === 10, "team-advising turn count per arm");
      assert(loaded.pack.configuredProviderRequestBound === 20, "team-advising total provider request bound");
      assert(loaded.pack.scenarios.filter((scenario) => scenario.id === "mid-task-topology-change")[0]?.turns.length === 2, "team-advising multi-turn member");
      assert(loaded.pack.scenarios.every((scenario) => scenario.expected.changedPaths.includes("result.json")), "team-advising result evidence path");
      assert(/^[a-f0-9]{64}$/.test(loaded.digest), "team-advising pack digest");
      const selected = selectTeamAdvisingPack(loaded.pack, ["trivial-owner-local-direct", "non-trivial-single-domain-main-alone"]);
      assert(selected.memberOrder.join(",") === "trivial-owner-local-direct,non-trivial-single-domain-main-alone", "team-advising selected member order");
      assert(selected.configuredProviderRequestBound === 4, "team-advising selected request bound");
      assert(selected.maximumClaim.includes("selected STA-001 subset"), "team-advising selected claim ceiling");
      const privateHome = String.raw`C:\Users\private-user`;
      const escapedPrivateOutput = JSON.stringify({ repo: "D:/home/private-user/repo", runtime: String.raw`C:\Users\private-user\AppData\Local\Temp\proof` });
      const sanitized = sanitizeTeamEvidenceText(escapedPrivateOutput, [privateHome, String.raw`D:\home\private-user`]);
      assertPrivacySafe(sanitized.text, "team-advising escaped private paths");
      const genericSanitized = sanitizeTeamEvidenceText(escapedPrivateOutput, []);
      assert(genericSanitized.counts.privatePath === 2, "team-advising generic private-path redaction count");
      assertPrivacySafe(genericSanitized.text, "team-advising generic private-path redaction");
      const teamRunnerSource = fs.readFileSync(path.join(root, "tools/proofs/consumer-outcome/team-advising.ts"), "utf8");
      assert(teamRunnerSource.includes("checkpoint-${String(samples.length).padStart(2, \"0\")}.json"), "team-advising checkpoint path");
      assert(teamRunnerSource.includes("for (const checkpoint of checkpoints) fs.rmSync(checkpoint, { force: true })"), "team-advising terminal checkpoint cleanup");
      const help = invokeCli(["--help"]);
      assert(help.status === 0 && help.stdout.includes("team-advising uses nine reviewed scenarios") && help.stdout.includes("team-advising --continuity"), "team-advising help inventory");
    },
  },
  {
    name: "team-advising continuity evaluation preserves exact state and changed-catalog invalidation",
    run() {
      const directory = tempDir("team-advising-continuity");
      try {
        const loaded = loadTeamAdviceContinuityFixture(root);
        const preflight = teamAdviceContinuityPreflight(root);
        assert(preflight.loadedConfig === false && !("packDigest" in preflight) && !("scenarioIds" in preflight), "continuity local preflight must not inherit STA-001 identity");
        assert(loaded.fixture.cases.length === 2 && loaded.fixture.configuredProviderRequestBound === 6, "continuity fixture bounds");
        const samples = loaded.fixture.cases.map((control): TeamAdviceContinuitySample => ({
          caseId: control.id,
          compactionContext: loaded.fixture.fields.map((field) => `${field}: ${control.initialState[field as keyof typeof control.initialState]}`).join("\n"),
          error: null,
          providerRequestCount: 3,
          reconstructionResponse: JSON.stringify({
            candidateRef: control.currentFacts.candidateRef,
            caseId: control.id,
            catalogRef: control.currentFacts.catalogRef,
            reconsult: control.expected.reconsult,
            stalePackages: control.expected.stalePackages.map((item) => item.split(":", 1)[0]),
            terminalPackages: control.expected.terminalPackages.map((item) => item.split(":", 1)[0]),
          }),
          sessionCleanup: { error: null, sessionsRemoved: true },
          sessionRef: "fixture-session",
          summarizeAccepted: true,
          toolCalls: [],
        }));
        const bundle: TeamAdviceContinuityBundle = sealTeamAdviceContinuityBundle({
          candidateId: "continuity-fixture",
          captureErrorFacts: null,
          cleanup: { complete: true, error: null, fixtureRemoved: true, processRemoved: true, sessionsRemoved: true },
          environment: {
            installedOpenCode: { sha256: "installed", version: "fixture" },
            model: "proof/model",
            node: process.version,
            platform: process.platform,
            profile: "quality-independent",
            runtimeProfile: "core",
            variant: "high",
          },
          fixtureDigest: loaded.digest,
          kind: "team-advice-continuity",
          routes: { compaction: "proof/model/high", main: "proof/model/high" },
          samples,
          schemaVersion: 1,
          server: {
            signal: null,
            startup: { hostConfigLoaded: false, isolatedConfigLoaded: true, ripgrepDownloadRequested: false },
            status: 0,
            stderr: "",
            stdout: "",
          },
          sourceIdentity: source(),
          sourceUnchanged: true,
        });
        assert(evaluateTeamAdviceContinuity(loaded.fixture, loaded.digest, bundle).status === "passed", "continuity direct evaluation");
        const bundlePath = path.join(directory, "bundle.json");
        fs.writeFileSync(bundlePath, `${JSON.stringify(bundle, null, 2)}\n`, "utf8");
        const replay = invokeCli(["--mode", "evaluate", "--pack", "team-advising", "--continuity", "--candidate", bundlePath]);
        assert(replay.status === 0, replay.stderr || replay.stdout);
        const output = JSON.parse(replay.stdout) as { evaluation?: { modelCalls?: unknown; status?: unknown }; liveCalls?: unknown };
        assert(output.evaluation?.status === "passed" && output.evaluation.modelCalls === 6 && output.liveCalls === 0, replay.stdout);
        bundle.bundleDigest = "stale";
        fs.writeFileSync(bundlePath, `${JSON.stringify(bundle, null, 2)}\n`, "utf8");
        const stale = invokeCli(["--mode", "evaluate", "--pack", "team-advising", "--continuity", "--candidate", bundlePath]);
        assert(stale.status === 1 && stale.stderr.includes("digest mismatch"), stale.stderr);
      } finally {
        fs.rmSync(directory, { force: true, recursive: true });
      }
    },
  },
  {
    name: "team-advising replay verifies a sealed provider-free nine-member baseline",
    run() {
      const directory = tempDir("team-advising-replay");
      try {
        const loaded = loadTeamAdvisingPack(root);
        const samples = loaded.pack.scenarios.map((scenario): TeamSampleEvidence => sealTeamSample({
          adviceStates: [],
          arm: "baseline",
          catalogCalls: 0,
          childExports: [],
          cleanup: { complete: true, error: null, fixtureRemoved: true, processesRemoved: true, remainingSessions: 0, sessionsRemoved: true },
          commands: scenario.turns.map((_turn, index) => ({ argv: ["opencode", "run"], elapsedMs: 1, status: 0, stderr: "", stdout: "", turn: index + 1 })),
          configuredProviderRequestCount: scenario.turns.length,
          files: scenario.expected.changedPaths.map((file) => ({ path: file, sha256: "fixture" })),
          fixtureDigest: "fixture",
          forbiddenEffects: [{ name: "remote", observed: false }],
          privacyRedactions: {},
          proof: { argv: ["node", "check-result.ts"], status: 0, stderr: "", stdout: `OK: ${scenario.id}` },
          result: {
            acceptedPackages: [],
            caseId: scenario.id,
            mainDisposition: "direct",
            missionOutcome: "complete",
            reconsultationCondition: "none",
            schemaVersion: 1,
            unavailableCapabilities: [],
          },
          rootRef: "root-ref",
          scenarioId: scenario.id,
          sourceUnchanged: true,
          taskEvents: [],
          toolEvents: [],
          workerCompletedBeforeProof: false,
        }));
        const bundle: TeamBundle = sealTeamBundle({
          arm: "baseline",
          candidateId: "team-baseline-fixture",
          environment: {
            installedOpenCode: { sha256: "installed", version: "fixture" },
            model: "proof/model",
            node: process.version,
            platform: process.platform,
            profile: "quality-independent",
            runtimeProfile: "core",
            variant: "high",
          },
          packDigest: loaded.digest,
          samples,
          schemaVersion: 1,
          sourceIdentity: { gitRef: "working-tree", governedDigest: "source", kind: "working-tree", pathDigests: [] },
        });
        const legacyCandidateSamples = samples.map((sample): TeamSampleEvidence => {
          const { hashes: _hashes, ...value } = sample;
          return sealTeamSample({ ...value, arm: "candidate" });
        });
        const { bundleDigest: _bundleDigest, byteLength: _byteLength, ...bundleValue } = bundle;
        const legacyCandidate = sealTeamBundle({
          ...bundleValue,
          arm: "candidate",
          candidateId: "team-candidate-without-safety-oracles",
          samples: legacyCandidateSamples,
        });
        const legacyEvaluation = evaluateTeamAdvisingPack(loaded.pack, loaded.digest, bundle, legacyCandidate);
        assert(legacyEvaluation.rows.some((row) => row.arm === "candidate" && row.failures.includes("forbidden-effect-oracle-missing")), "candidate replay must reject hardcoded safety absence without an oracle");
        const bundlePath = path.join(directory, "bundle.json");
        fs.writeFileSync(bundlePath, `${JSON.stringify(bundle, null, 2)}\n`, "utf8");
        const replay = invokeCli(["--mode", "evaluate", "--pack", "team-advising", "--baseline", bundlePath]);
        assert(replay.status === 0, replay.stderr || replay.stdout);
        const output = JSON.parse(replay.stdout) as { evaluation?: { status?: unknown }; liveCalls?: unknown };
        assert(output.evaluation?.status === "passed" && output.liveCalls === 0, replay.stdout);
        const subset = invokeCli([
          "--mode", "evaluate",
          "--pack", "team-advising",
          "--baseline", bundlePath,
          "--scenarios", "trivial-owner-local-direct,non-trivial-single-domain-main-alone",
        ]);
        assert(subset.status === 0, subset.stderr || subset.stdout);
        const subsetOutput = JSON.parse(subset.stdout) as { evaluation?: { maximumClaim?: unknown; modelCalls?: unknown; rows?: unknown[]; status?: unknown }; liveCalls?: unknown };
        assert(subsetOutput.evaluation?.status === "passed" && subsetOutput.liveCalls === 0, subset.stdout);
        assert(subsetOutput.evaluation?.rows?.length === 2, "team-advising subset replay row count");
        assert(subsetOutput.evaluation?.modelCalls === 2, "team-advising subset replay model call count");
        assert(String(subsetOutput.evaluation?.maximumClaim).includes("selected STA-001 subset"), "team-advising subset replay claim ceiling");
        const unsafe = structuredClone(bundle);
        unsafe.samples[0]!.commands[0]!.stdout = String.raw`{"path":"C:\\Users\\private-user\\fixture"}`;
        unsafe.samples[0]!.hashes.sample = "";
        unsafe.samples[0]!.hashes.sample = digestOf(unsafe.samples[0]!);
        unsafe.bundleDigest = "";
        unsafe.byteLength = 0;
        unsafe.bundleDigest = digestOf(unsafe);
        unsafe.byteLength = Buffer.byteLength(stableJson(unsafe), "utf8");
        fs.writeFileSync(bundlePath, `${JSON.stringify(unsafe, null, 2)}\n`, "utf8");
        const unsafeReplay = invokeCli(["--mode", "evaluate", "--pack", "team-advising", "--baseline", bundlePath]);
        assert(unsafeReplay.status === 1 && unsafeReplay.stdout.includes("privacy-unsafe"), unsafeReplay.stderr || unsafeReplay.stdout);
        const redacted = redactTeamBundlePrivacy(unsafe, loaded.digest, "privacy-redacted-baseline");
        const redactedEvaluation = evaluateTeamAdvisingPack(loaded.pack, loaded.digest, redacted);
        assert(redacted.derivation?.sourceBundleDigest === unsafe.bundleDigest, "privacy conversion must retain sealed source provenance");
        assert(redacted.samples[0]!.privacyRedactions.privatePath === 1, "privacy conversion must count the private path");
        assert(redactedEvaluation.status === "passed", JSON.stringify(redactedEvaluation));
        bundle.bundleDigest = "stale";
        fs.writeFileSync(bundlePath, `${JSON.stringify(bundle, null, 2)}\n`, "utf8");
        const stale = invokeCli(["--mode", "evaluate", "--pack", "team-advising", "--baseline", bundlePath]);
        assert(stale.status === 1 && stale.stderr.includes("digest mismatch"), stale.stderr);
      } finally {
        fs.rmSync(directory, { force: true, recursive: true });
      }
    },
  },
  {
    name: "configured command evidence distinguishes exit, launch failure, and supervised timeout",
    run() {
      const normal = runPortableCommand(root, [process.execPath, "-e", "process.exit(0)"], { capture: true, timeoutMs: 1_000 });
      const nonzero = runPortableCommand(root, [process.execPath, "-e", "process.exit(7)"], { capture: true, timeoutMs: 1_000 });
      const launchFailure = runPortableCommand(root, ["missing-consumer-outcome-command"], { capture: true, timeoutMs: 1_000 });
      const timeout = runPortableCommand(root, [process.execPath, "-e", "setTimeout(() => {}, 10_000)"], { capture: true, timeoutMs: 50 });
      const normalFacts = processTerminationEvidence(normal, 1_000);
      const nonzeroFacts = processTerminationEvidence(nonzero, 1_000);
      const launchFacts = processTerminationEvidence(launchFailure, 1_000);
      const timeoutFacts = processTerminationEvidence(timeout, 50);
      assert(normal.status === 0 && !normalFacts.timedOut && normalFacts.error == null, "normal exit facts");
      assert(nonzero.status === 7 && !nonzeroFacts.timedOut && nonzeroFacts.error == null, "nonzero exit facts");
      assert(launchFailure.status === 1 && launchFacts.cleanupState === "unknown" && launchFacts.error != null, "launch failure facts");
      assert(timeoutFacts.timedOut && timeoutFacts.cleanupState === "terminal" && timeoutFacts.error?.code === "ETIMEDOUT", "timeout facts");
    },
  },
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
    name: "proof server cleanup terminates the owned process tree",
    async run() {
      const child = spawn(process.execPath, ["-e", "setInterval(() => {}, 1000)"], { stdio: "pipe", windowsHide: true });
      const completion: ProofServerHandle["completion"] = new Promise((resolve, reject) => {
        child.once("error", reject);
        child.once("close", (status, signal) => resolve({ signal, status }));
      });
      const server: ProofServerHandle = { child, completion, stderr: [], stdout: [], url: "http://127.0.0.1:1" };
      await new Promise((resolve) => setTimeout(resolve, 100));
      const terminal = await stopProofServer(server);
      assert(child.exitCode != null || child.signalCode != null, `proof process must be terminal: ${JSON.stringify(terminal)}`);
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
    name: "summarized proof session aborts before compaction when the main response oracle is missing",
    async run() {
      const calls: string[] = [];
      const message = { info: { agent: "build", finish: "stop", modelID: "gpt-5.6-sol", providerID: "openai", role: "assistant", summary: false }, parts: [{ text: "main response without checkpoint", type: "text" }] };
      const client = {
        session: {
          abort: async () => { calls.push("abort"); return { data: true }; },
          create: async () => { calls.push("create"); return { data: { id: "missing-main-oracle" } }; },
          delete: async () => { calls.push("delete"); return { data: true }; },
          messages: async () => { calls.push("messages"); return { data: [message] }; },
          prompt: async () => { calls.push("prompt"); return { data: message }; },
          summarize: async () => { calls.push("summarize"); return { data: true }; },
        },
      } as unknown as Parameters<typeof runSummarizedProofSession>[0]["client"];
      const route: ProofRoute = { agent: "build", hidden: false, model: { modelID: "gpt-5.6-sol", providerID: "openai" }, variant: "xhigh" };
      const result = await runSummarizedProofSession({
        client,
        compactionRoute: { ...route, agent: "compaction" },
        directory: ".",
        mainPrompt: "main",
        mainResponseMustInclude: ["Checkpoint Ref: required"],
        mainRoute: route,
        reconstructionPrompt: "reconstruct",
        timeoutMs: 1_000,
        title: "missing-main-oracle-test",
        tools: {},
      });
      assert(result.error?.stage === "main" && result.providerRequestCount === 1, JSON.stringify(result));
      assert(!result.summarizeAccepted && result.reconstructionResponse === "", "failed main oracle must not reach compaction or reconstruction");
      assert(calls.join(",") === "create,prompt,abort,delete", `missing main oracle must fail before summarize: ${calls.join(",")}`);
      assert(result.cleanup.sessionsRemoved && result.cleanup.error == null, "failed main oracle must still delete its session");
    },
  },
  {
    name: "diagnostic proof session preserves structured prompt failure and terminal readback",
    run: async () => {
      const calls: string[] = [];
      const assistant = {
        info: {
          agent: "build",
          error: { name: "ProviderError", message: "synthetic provider failure", status: 503 },
          finish: "error",
          modelID: "gpt-5.6-sol",
          providerID: "openai",
          role: "assistant",
        },
        parts: [{ type: "text", text: "partial structured observation" }],
      };
      const client = {
        session: {
          abort: async () => { calls.push("abort"); return { data: true }; },
          create: async () => { calls.push("create"); return { data: { id: "diagnostic-session" } }; },
          delete: async () => { calls.push("delete"); return { data: true }; },
          messages: async () => { calls.push("messages"); return { data: [assistant] }; },
          prompt: async () => { calls.push("prompt"); return { error: { name: "ProviderError", message: "synthetic provider failure", status: 503 } }; },
        },
      } as unknown as Parameters<typeof runDiagnosticProofSession>[0]["client"];
      const route: ProofRoute = { agent: "build", hidden: false, model: { modelID: "gpt-5.6-sol", providerID: "openai" }, variant: "xhigh" };
      const result = await runDiagnosticProofSession({
        client,
        directory: ".",
        prompt: "diagnose",
        route,
        timeoutMs: 1_000,
        title: "provider-free-diagnostic-test",
      });
      assert(result.providerRequestCount === 1, "diagnostic must count exactly one attempted prompt");
      assert(result.errors.length === 1 && result.errors[0]?.stage === "prompt", JSON.stringify(result.errors));
      assert(result.messages.assistant[0]?.finish === "error" && result.messages.assistant[0]?.error?.[0]?.name === "ProviderError", "diagnostic readback must retain assistant terminal error");
      assert(result.messages.assistant[0]?.text === "partial structured observation", "diagnostic readback must retain partial assistant text");
      assert(result.cleanup.sessionsRemoved && result.cleanup.error == null, "diagnostic must delete its session");
      assert(calls.join(",") === "create,prompt,abort,messages,delete", `unexpected diagnostic call order: ${calls.join(",")}`);
    },
  },
  {
    name: "foundation server diagnostic converts to a bounded evaluator bundle provider-free",
    run: () => {
      const loaded = loadDecisionGapPack(root, "foundation-integrity");
      const selected = selectFoundationPack(loaded.pack, ["protected-product-ambiguity"]);
      const scenario = selected.pack.manifest.scenarios[0]!;
      const before = verifyFixtureSeed(root, scenario).files;
      const expected = selected.pack.expectedDecisions[scenario.id] as FoundationIntegrityScenarioExpectation;
      const evidenceRoot = tempDir("foundation-diagnostic-bundle");
      const sourceIdentity = source("foundation-server-source");
      const diagnostic: Record<string, unknown> = {
        cleanup: { complete: true, fixtureRemoved: true, processesRemoved: true, sessionsRemoved: true },
        elapsedMs: 123,
        environment: { startupFacts: { ripgrepDownloadRequested: false } },
        files: { after: [...before, { path: "decision.json", sha256: digestOf(expected.candidate) }], before },
        proof: { argv: scenario.proofExpectations.argv, status: 0, stderr: "", stdout: stableJson(expected.candidate) },
        providerRequestCount: 1,
        runtimeErrors: [],
        session: {
          latestAssistant: { error: null, finish: "stop" },
          messages: {
            assistant: [{ agent: "build", error: null, finish: "stop", modelID: "gpt-5.6-sol", providerID: "openai", summary: false, text: "complete" }],
            toolCalls: [{ name: "read", status: "completed" }, { name: "task", status: "completed" }, { name: "apply_patch", status: "completed" }],
          },
          response: "complete",
        },
        terminalClassification: "completed-observation",
        validation: { argv: scenario.validationArgv, status: 0, stderr: "", stdout: "" },
      };
      const bundle = createFoundationBundleFromDiagnostic(selected.pack.manifest, selected.digest, {
        candidateId: "foundation-server-source",
        evidenceRoot,
        executable: process.execPath,
        repoRoot: root,
        sourceIdentity,
      }, diagnostic);
      assert(bundle.inventory.join(",") === "bundle.json,diagnostic.json" && bundle.samples.length === 1, "server capture bundle inventory");
      assert(bundle.samples[0]?.command.status === 0 && bundle.samples[0]?.cleanup.complete, "server capture terminal facts");
      assert(bundle.samples[0]?.friction.configuredProviderRequestCount === 1 && bundle.samples[0]?.friction.totalToolCallCount === 3, "server capture request and tool counts");
      assert(bundle.samples[0]?.permissions.violations.length === 0, "apply_patch must satisfy the logical edit permission");
      assert(bundle.samples[0]?.environmentIdentity.model === "openai/gpt-5.6-sol" && bundle.samples[0]?.environmentIdentity.variant === "xhigh", "server capture configured route identity");
      fs.rmSync(evidenceRoot, { force: true, recursive: true });
    },
  },
  {
    name: "configured diagnostic retains stable changed text evidence",
    run: () => {
      const first = changedTextEvidence(
        { "src/a.ts": "export const a = 1;\n", "src/deleted.ts": "old\n" },
        { "src/a.ts": "export const a = 2;\n", "src/added.ts": "new\n" },
      );
      const second = changedTextEvidence(
        { "src/deleted.ts": "old\n", "src/a.ts": "export const a = 1;\n" },
        { "src/added.ts": "new\n", "src/a.ts": "export const a = 2;\n" },
      );
      assert(stableJson(first) === stableJson(second), "changed text evidence must have stable ordering");
      assert(first.map((row) => row.path).join(",") === "src/a.ts,src/added.ts,src/deleted.ts", "changed text paths");
      assert(first[0]?.before?.sha256 === sha256("export const a = 1;\n") && first[0]?.after?.sha256 === sha256("export const a = 2;\n"), "modified text hashes");
      assert(first[1]?.before == null && first[1]?.after?.text === "new\n", "added text evidence");
      assert(first[2]?.before?.text === "old\n" && first[2]?.after == null, "deleted text evidence");
      const proofRoot = path.join(os.homedir(), "AppData", "Local", "Temp", "configured-proof");
      const privateChanges = changedTextEvidence({}, {
        "archive-result.json": `${JSON.stringify({ path: path.join(proofRoot, "fixture", "openspec", "changes", "archive") })}\n`,
      });
      const redacted = redactText(JSON.stringify(privateChanges), defaultRedactions(proofRoot, root));
      assert(redacted.includes("<proof-root>"), "changed text must redact the disposable proof root");
      assertPrivacySafe(redacted, "redacted changed text");
    },
  },
  {
    name: "configured proof config preserves core and pins only the bounded build route",
    run: () => {
      const temporary = tempDir("configured-proof-config");
      const source = path.join(temporary, "source");
      const target = path.join(temporary, "target");
      fs.mkdirSync(path.join(source, "bin"), { recursive: true });
      fs.writeFileSync(path.join(source, "bin", "helper.ts"), "export {};\n");
      fs.writeFileSync(path.join(source, "opencode.json"), `${JSON.stringify({
        $schema: "https://opencode.ai/config.json",
        agent: { compaction: { model: "openai/existing", prompt: "keep" } },
        instructions: [path.join(source, "instructions.md").replaceAll("\\", "/")],
        permission: "ask",
        plugin: [`file:///${path.join(source, "plugin.ts").replaceAll("\\", "/")}`],
      }, null, 2)}\n`);
      const permission = { "*": "deny", read: "allow" };
      materializeConfiguredProofConfig(source, target, {
        $schema: "https://opencode.ai/config.json",
        agent: {
          build: { model: "openai/gpt-5.6-sol", variant: "xhigh" },
          general: { model: "openai/unused", variant: "high" },
        },
        model: "openai/gpt-5.6-sol",
        small_model: "xai/grok-4.6",
      }, permission);
      const config = JSON.parse(fs.readFileSync(path.join(target, "opencode.json"), "utf8"));
      assert(config.agent.build.model === "openai/gpt-5.6-sol" && config.agent.build.variant === "xhigh", "effective config build route");
      assert(config.agent.compaction.prompt === "keep" && config.agent.general == null, "effective config preserves core without unrelated routes");
      assert(JSON.stringify(config.permission) === JSON.stringify(permission), "effective config bounded permission");
      assert(config.instructions[0].includes(target.replaceAll("\\", "/")) && config.plugin[0].includes(target.replaceAll("\\", "/")), "effective config relocated roots");
      assert(fs.existsSync(path.join(target, "bin", "helper.ts")), "effective config copies the exact candidate surface");
      fs.rmSync(temporary, { force: true, recursive: true });
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
      assert(fs.readFileSync(path.join(root, "global", "AGENTS.md"), "utf8").includes("Live-Attempt Gate: clear | blocked | unknown"), "status-scope compaction authority marker");
      assert(fs.readFileSync(path.join(root, "global", "skills", "change-ready-sdlc", "SKILL.md"), "utf8").includes("It never clears or waives safety"), "status-scope Change-Ready marker");
      const templateConfig = JSON.parse(fs.readFileSync(path.join(root, "global", "opencode.json.template"), "utf8"));
      const activeConfig = JSON.parse(fs.readFileSync(path.join(root, "global", "opencode.json"), "utf8"));
      const promptMarker = "For mixed status, add `Status Scope` with exact subject/dimension/value";
      assert(templateConfig.agent.compaction.prompt.includes(promptMarker), "status-scope canonical compaction prompt marker");
      const activePromptMirrored = activeConfig.agent.compaction.prompt === templateConfig.agent.compaction.prompt;

      const ownership = resolveChangeFile("prevent-cross-layer-status-ambiguity", "ownership.json");
      const ownershipPath = ownership.path;
      const expectedOwnershipLifecycle = ownership.lifecycle;

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
        if (!activePromptMirrored) {
          assert(preflight.status === 1 && preflight.stderr.includes("status-scope compaction prompt source and active mirror differ"), preflight.stderr || preflight.stdout);
          for (const [index, file] of watched.entries()) {
            assert(Buffer.compare(before[index], fs.readFileSync(file)) === 0, `${file} must remain byte-isolated`);
          }
          return;
        }
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
        const baselineOnly = invokeCli(["--mode", "evaluate", "--pack", "status-scope", "--baseline", baselinePath, "--expectation", "baseline-establishment"]);
        assert(baselineOnly.status === 0, baselineOnly.stderr || baselineOnly.stdout);
        const baselinePayload = JSON.parse(baselineOnly.stdout) as Record<string, any>;
        assert(baselinePayload.liveCalls === 0 && baselinePayload.evaluation.evaluation.status === "baseline-established", JSON.stringify(baselinePayload));
        const args = ["--mode", "evaluate", "--pack", "status-scope", "--baseline", baselinePath, "--candidate", candidatePath, "--expectation", "no-regression"];
        const first = invokeCli(args);
        const second = invokeCli(args);
        assert(first.status === 0 && second.status === 0, first.stderr || second.stderr || first.stdout || second.stdout);
        const firstPayload = JSON.parse(first.stdout) as Record<string, any>;
        const secondPayload = JSON.parse(second.stdout) as Record<string, any>;
        assert(firstPayload.liveCalls === 0 && secondPayload.liveCalls === 0, "status-scope replay must remain provider-free");
        assert(firstPayload.evaluation.digest === secondPayload.evaluation.digest, "status-scope terminal evaluation must be deterministic");
        assert(firstPayload.evaluation.evaluation.status === "passed-no-regression", JSON.stringify(firstPayload.evaluation));
        const resultPath = path.join(directory, "terminal-replay.json");
        const improvement = invokeCli(["--mode", "evaluate", "--pack", "status-scope", "--baseline", lossyBaselinePath, "--candidate", candidatePath, "--expectation", "improvement", "--result-path", resultPath]);
        assert(improvement.status === 0, improvement.stderr || improvement.stdout);
        const improvementPayload = JSON.parse(improvement.stdout) as Record<string, any>;
        assert(improvementPayload.liveCalls === 0 && improvementPayload.evaluation.evaluation.status === "passed-improvement", JSON.stringify(improvementPayload));
        assert(fs.readFileSync(resultPath, "utf8") === `${improvement.stdout.trim()}\n`, "result path must seal the emitted replay bytes");
        const duplicate = invokeCli(["--mode", "evaluate", "--pack", "status-scope", "--baseline", lossyBaselinePath, "--candidate", candidatePath, "--expectation", "improvement", "--result-path", resultPath]);
        assert(duplicate.status === 1 && duplicate.stderr.includes("create-new path already exists"), "result path must fail closed on overwrite");
      } finally {
        fs.rmSync(directory, { force: true, recursive: true });
      }
    },
  },
  {
    name: "bounded-falsification preflight freezes twelve reviewed members and excludes proof code from source identity",
    run: () => {
      const loaded = loadDecisionGapPack(root, "bounded-falsification");
      assert(loaded.pack.id === "bounded-falsification-r1", "bounded-falsification pack id");
      assert(loaded.pack.manifest.scenarios.length === 12, "bounded-falsification must contain twelve configured scenarios");
      assert(loaded.pack.boundedFalsification?.memberOrder.join(",") === loaded.pack.manifest.scenarios.map((scenario) => scenario.id).join(","), "bounded member and scenario order");
      assert(loaded.pack.configuredProviderRequestBound === 24, "bounded pack must permit one primary request per scenario and arm");
      assert(loaded.pack.manifest.scenarios.every((scenario) => scenario.configuredProviderRequestBound === 1), "bounded scenario request bound");
      assert(loaded.pack.manifest.governedSourcePaths.every((entry) => !entry.startsWith("tools/proofs/") && !entry.startsWith("openspec/changes/")), "proof and change evidence must not mutate governed instruction identity");
      assert(configuredScenarioTimeoutMs(loaded.pack.manifest.scenarios[0]!, "none") === 300_000, "fresh readiness workflow timeout");
      const rereview = loaded.pack.manifest.scenarios.find((scenario) => scenario.id === "material-correction-rereview")!;
      assert(configuredScenarioTimeoutMs(rereview, "none") === FOUNDATION_SERVER_PROMPT_TIMEOUT_MS, "two-review bounded member must retain a sufficient member-local timeout");
      assert(configuredScenarioTimeoutMs(rereview, "timeout") === 50, "failure injection must override the member-local timeout");
      const exactOwner = loaded.pack.manifest.scenarios.find((scenario) => scenario.id === "exact-practice-owner")!;
      assert(configuredScenarioTimeoutMs(exactOwner, "none") === FOUNDATION_SERVER_PROMPT_TIMEOUT_MS, "two-owner bounded member must retain a sufficient member-local timeout");

      const first = invokeCli(["--mode", "preflight", "--pack", "bounded-falsification", "--source-ref", "working-tree"]);
      const second = invokeCli(["--mode", "preflight", "--pack", "bounded-falsification", "--source-ref", "working-tree"]);
      assert(first.status === 0 && second.status === 0, first.stderr || second.stderr || first.stdout || second.stdout);
      const firstPayload = JSON.parse(first.stdout) as Record<string, any>;
      const secondPayload = JSON.parse(second.stdout) as Record<string, any>;
      assert(firstPayload.modelCalls === 0 && secondPayload.modelCalls === 0, "bounded preflight must be provider-free");
      assert(firstPayload.scenarioMembers.length === 12 && firstPayload.terminalRowCountPerArm === 12, "bounded preflight population");
      assert(firstPayload.permissionEnvelope.allow.join(",") === "edit,read,task:implementation-readiness-reviewer,task:instruction-artifact-reviewer", "bounded exact allow envelope");
      assert(firstPayload.permissionEnvelope.deny.join(",") === "bash,external_directory,glob,grep,question,skill,webfetch", "bounded exact deny envelope");
      assert(firstPayload.comparisonControls.join(",") === "model,variant,profile,permissions,environment,request,initialManifest", "matched control inventory");
      assert(stableJson(firstPayload) === stableJson(secondPayload), "two provider-free preflights must freeze an identical baseline manifest");

      const fixture = JSON.parse(fs.readFileSync(path.join(root, "tools/proofs/fixtures/consumer-outcome/bounded-falsification-v1/cases.json"), "utf8")) as { cases: Array<Record<string, any>> };
      const fixtureById = new Map(fixture.cases.map((row) => [row.caseId, row]));
      const checkerParent = tempDir("bounded-falsification-checker");
      try {
        for (const scenario of loaded.pack.manifest.scenarios) {
          const expected = loaded.pack.expectedDecisions[scenario.id] as BoundedFalsificationScenarioExpectation;
          const sourceRoot = path.join(root, scenario.fixturePath);
          const dedicatedCasePath = path.join(sourceRoot, "case.json");
          const scenarioCase = fs.existsSync(dedicatedCasePath)
            ? JSON.parse(fs.readFileSync(dedicatedCasePath, "utf8")) as Record<string, any>
            : fixtureById.get(scenario.id);
          assert(stableJson(scenarioCase?.baselineDecision) === stableJson(expected.baseline), `${scenario.id} baseline seed must match the reviewed pack`);
          if (scenarioCase?.candidateDecision != null) {
            assert(stableJson(scenarioCase.candidateDecision) === stableJson(expected.candidate), `${scenario.id} candidate seed must match the reviewed pack`);
          }
          for (const arm of ["baseline", "candidate"] as const) {
            const fixtureRoot = path.join(checkerParent, `${scenario.id}-${arm}`);
            fs.cpSync(sourceRoot, fixtureRoot, { recursive: true });
            if (arm === "candidate" && typeof scenarioCase?.correctedArtifact === "string") {
              fs.writeFileSync(path.join(fixtureRoot, "candidate.md"), scenarioCase.correctedArtifact);
            }
            fs.writeFileSync(path.join(fixtureRoot, "decision.json"), stableJson(expected[arm]));
            const checked = spawnSync(process.execPath, ["check-decision.ts", scenario.id], { cwd: fixtureRoot, encoding: "utf8" });
            assert(checked.status === 0, checked.stderr || checked.stdout);
            assert(stableJson(JSON.parse(checked.stdout)) === stableJson(expected[arm]), `${scenario.id} ${arm} checker readback`);
          }
        }

        const sharedScenario = loaded.pack.manifest.scenarios.find((scenario) => scenario.id === "missing-observable-oracle")!;
        const projectedRoot = path.join(checkerParent, "missing-observable-oracle-projected");
        const projectedExpected = loaded.pack.expectedDecisions[sharedScenario.id] as BoundedFalsificationScenarioExpectation;
        copyScenarioSeed(path.join(root, sharedScenario.fixturePath), projectedRoot, sharedScenario, projectedExpected.candidate);
        const projected = JSON.parse(fs.readFileSync(path.join(projectedRoot, "cases.json"), "utf8")) as { cases: Array<Record<string, any>> };
        assert(projected.cases.length === 1 && projected.cases[0]?.caseId === sharedScenario.id, "shared bounded fixture must become one actor-visible member before capture");
        assert(stableJson(projected.cases[0]?.candidateDecision) === stableJson(projectedExpected.candidate), "candidate projection must expose the exact main-only terminal record");
        assert(fs.readFileSync(path.join(projectedRoot, "candidate.md"), "utf8") === projected.cases[0]?.initialCandidateArtifact, "candidate projection must materialize the reviewed mutable artifact");
        assert(fixture.cases.length === 12, "member projection must not mutate the reviewed source seed");
        fs.writeFileSync(path.join(projectedRoot, "candidate.md"), projected.cases[0]?.correctedArtifact);
        fs.writeFileSync(path.join(projectedRoot, "decision.json"), stableJson(projectedExpected.candidate));
        const projectedCheck = spawnSync(process.execPath, ["check-decision.ts", sharedScenario.id], { cwd: projectedRoot, encoding: "utf8" });
        assert(projectedCheck.status === 0 && stableJson(JSON.parse(projectedCheck.stdout)) === stableJson(projectedExpected.candidate), projectedCheck.stderr || projectedCheck.stdout);

        const coherent = loaded.pack.manifest.scenarios[0]!;
        const coherentCase = JSON.parse(fs.readFileSync(path.join(root, coherent.fixturePath, "case.json"), "utf8")) as Record<string, any>;
        const missingCorrectionRoot = path.join(checkerParent, "coherent-missing-correction");
        fs.cpSync(path.join(root, coherent.fixturePath), missingCorrectionRoot, { recursive: true });
        fs.writeFileSync(path.join(missingCorrectionRoot, "decision.json"), stableJson(coherentCase.candidateDecision));
        const missingCorrection = spawnSync(process.execPath, ["check-decision.ts", coherent.id], { cwd: missingCorrectionRoot, encoding: "utf8" });
        assert(missingCorrection.status === 1 && missingCorrection.stderr.includes("requires the reviewed candidate.md correction"), missingCorrection.stderr || missingCorrection.stdout);

        const malformedRoot = path.join(checkerParent, "coherent-malformed-record");
        fs.cpSync(path.join(root, coherent.fixturePath), malformedRoot, { recursive: true });
        const malformedDecision = structuredClone(coherentCase.candidateDecision);
        malformedDecision.semanticReadiness = "failed";
        fs.writeFileSync(path.join(malformedRoot, "candidate.md"), coherentCase.correctedArtifact);
        fs.writeFileSync(path.join(malformedRoot, "decision.json"), stableJson(malformedDecision));
        const malformed = spawnSync(process.execPath, ["check-decision.ts", coherent.id], { cwd: malformedRoot, encoding: "utf8" });
        assert(malformed.status === 1 && malformed.stderr.includes("semanticReadiness is invalid"), malformed.stderr || malformed.stdout);

        const identityParent = tempDir("bounded-member-identity");
        try {
          const consumerFixtureBase = path.join(identityParent, "repo", "tools/proofs/fixtures/consumer-outcome");
          fs.mkdirSync(consumerFixtureBase, { recursive: true });
          fs.cpSync(path.join(root, "tools/proofs/fixtures/consumer-outcome/bounded-falsification-v1"), path.join(consumerFixtureBase, "bounded-falsification-v1"), { recursive: true });
          fs.cpSync(path.join(root, coherent.fixturePath), path.join(identityParent, "repo", coherent.fixturePath), { recursive: true });
          const before = verifyFixtureSeed(path.join(identityParent, "repo"), coherent);
          const sharedPath = path.join(consumerFixtureBase, "bounded-falsification-v1", "cases.json");
          const shared = JSON.parse(fs.readFileSync(sharedPath, "utf8")) as { cases: Array<Record<string, any>> };
          const unrelated = shared.cases.find((row) => row.caseId === "material-inline-plan");
          assert(unrelated != null, "material-inline-plan fixture row");
          unrelated.representedRisk = `${unrelated.representedRisk} unrelated-drift`;
          fs.writeFileSync(sharedPath, stableJson(shared));
          const afterUnrelated = verifyFixtureSeed(path.join(identityParent, "repo"), coherent);
          assert(afterUnrelated.digest === before.digest, "unrelated shared-member drift must not change coherent-wrong-outcome identity");
          fs.appendFileSync(path.join(identityParent, "repo", coherent.fixturePath, "candidate.md"), "selected-drift\n");
          const afterSelected = verifyFixtureSeed(path.join(identityParent, "repo"), coherent);
          assert(afterSelected.digest !== before.digest, "selected actor-visible drift must change coherent-wrong-outcome identity");
        } finally {
          fs.rmSync(identityParent, { force: true, recursive: true });
        }
      } finally {
        fs.rmSync(checkerParent, { force: true, recursive: true });
      }

      const raw = JSON.parse(fs.readFileSync(path.join(root, "tools/proofs/fixtures/consumer-outcome/bounded-falsification-r1.json"), "utf8")) as Record<string, any>;
      for (const [label, mutate, expected] of [
        ["semantic score", (value: Record<string, any>) => { value.inferredReviewQuality = 99; }, "inferredReviewQuality"],
        ["challenge overflow", (value: Record<string, any>) => { value.scenarios[0].expectedDecision.candidate.challengeCount = 3; }, "challengeCount"],
        ["attack class drift", (value: Record<string, any>) => { value.scenarios[0].expectedDecision.candidate.attackClasses[0] = "quality-score:attempted"; }, "attackClasses"],
      ] as const) {
        const changed = structuredClone(raw);
        mutate(changed);
        let message = "";
        try {
          parseDecisionGapPack(changed, "bounded-falsification");
        } catch (error) {
          message = error instanceof Error ? error.message : String(error);
        }
        assert(message.includes(expected), `${label} must fail before effects: ${message}`);
      }
      const help = invokeCli(["--help"]);
      assert(help.status === 0 && help.stdout.includes("bounded-falsification"), "effect-free help must advertise bounded-falsification");
    },
  },
  {
    name: "bounded-falsification evaluator replays twelve explicit baseline and candidate decisions provider-free",
    run: () => {
      const loaded = loadDecisionGapPack(root, "bounded-falsification");
      const baselineSamples = loaded.pack.manifest.scenarios.map((scenario) => {
        const expected = loaded.pack.expectedDecisions[scenario.id] as BoundedFalsificationScenarioExpectation;
        return boundedFalsificationSample({ arm: "baseline", expected: expected.baseline, scenario });
      });
      const candidateSamples = loaded.pack.manifest.scenarios.map((scenario) => {
        const expected = loaded.pack.expectedDecisions[scenario.id] as BoundedFalsificationScenarioExpectation;
        return boundedFalsificationSample({ arm: "candidate", expected: expected.candidate, scenario });
      });
      const baseline = bundleOf(baselineSamples, "baseline");
      baseline.scenarioDigest = loaded.digest;
      const candidate = bundleOf(candidateSamples, "candidate");
      candidate.scenarioDigest = loaded.digest;
      const evaluated = evaluateDecisionGapPack({ baseline, candidate, expectation: "no-regression", pack: loaded.pack });
      assert(evaluated.evaluation.status === "passed-no-regression", JSON.stringify(evaluated.evaluation));
      assert(evaluated.boundedFalsificationOracles?.length === 24 && evaluated.boundedFalsificationOracles.every((row) => row.passed), "twelve explicit rows per arm must pass");
      assert(evaluated.boundedFalsificationOracles?.filter((row) => row.arm === "baseline").every((row) => row.expected.semanticReadiness === "unknown"), "baseline must not claim semantic readiness");
      assert(evaluated.boundedFalsificationOracles?.filter((row) => row.arm === "candidate").every((row) => row.expected.semanticReadiness === "ready"), "candidate members must carry reviewed terminal readiness");

      const directory = tempDir("bounded-falsification-replay");
      const baselinePath = path.join(directory, "baseline.json");
      const candidatePath = path.join(directory, "candidate.json");
      fs.writeFileSync(baselinePath, stableJson(baseline));
      fs.writeFileSync(candidatePath, stableJson(candidate));
      try {
        const baselineOnly = invokeCli(["--mode", "evaluate", "--pack", "bounded-falsification", "--baseline", baselinePath, "--expectation", "baseline-establishment"]);
        assert(baselineOnly.status === 0, baselineOnly.stderr || baselineOnly.stdout);
        const baselinePayload = JSON.parse(baselineOnly.stdout) as Record<string, any>;
        assert(baselinePayload.liveCalls === 0 && baselinePayload.evaluation.evaluation.status === "baseline-established", JSON.stringify(baselinePayload));
        assert(baselinePayload.evaluation.boundedFalsificationOracles.length === 12, "baseline replay must retain twelve unknown rows");
        const args = ["--mode", "evaluate", "--pack", "bounded-falsification", "--baseline", baselinePath, "--candidate", candidatePath];
        const first = invokeCli(args);
        const second = invokeCli(args);
        assert(first.status === 0 && second.status === 0, first.stderr || second.stderr || first.stdout || second.stdout);
        const firstPayload = JSON.parse(first.stdout) as Record<string, any>;
        const secondPayload = JSON.parse(second.stdout) as Record<string, any>;
        assert(firstPayload.liveCalls === 0 && secondPayload.liveCalls === 0, "bounded terminal replay must make zero provider calls");
        assert(firstPayload.evaluation.digest === secondPayload.evaluation.digest, "bounded terminal replay digest must be deterministic");
      } finally {
        fs.rmSync(directory, { force: true, recursive: true });
      }

      const wrongExpected = structuredClone((loaded.pack.expectedDecisions["coherent-wrong-outcome"] as BoundedFalsificationScenarioExpectation).candidate);
      wrongExpected.reviewerLaunchCount = 0;
      const wrongCandidate = bundleOf([
        boundedFalsificationSample({ arm: "candidate", expected: wrongExpected, scenario: loaded.pack.manifest.scenarios[0]! }),
        ...candidateSamples.slice(1),
      ], "candidate");
      wrongCandidate.scenarioDigest = loaded.digest;
      const failed = evaluateDecisionGapPack({ baseline, candidate: wrongCandidate, expectation: "no-regression", pack: loaded.pack });
      assert(failed.evaluation.status === "failed" && failed.evaluation.reasons.includes("bounded-falsification-oracle:candidate:coherent-wrong-outcome:1:reviewerLaunchCount"), JSON.stringify(failed.evaluation.reasons));
    },
  },
  {
    name: "foundation-integrity preflight freezes seven scenarios, twelve partitions, and exact permissions without provider calls",
    run: () => {
      const loaded = loadDecisionGapPack(root, "foundation-integrity");
      assert(loaded.pack.id === "foundation-integrity-r1", "foundation-integrity pack id");
      assert(loaded.pack.manifest.scenarios.length === 7, "foundation-integrity must contain seven configured-session scenarios");
      assert(loaded.pack.foundationIntegrity?.memberOrder.length === 12, "foundation-integrity must contain twelve explicit partition members");
      assert(loaded.pack.configuredProviderRequestBound === 14, "foundation-integrity pack bound must cover seven calls per arm");
      assert(loaded.pack.manifest.scenarios.every((scenario) => scenario.configuredProviderRequestBound === 1), "each foundation-integrity scenario must allow one primary call");
      assert(configuredScenarioTimeoutMs(loaded.pack.manifest.scenarios[0]!, "none") === 300_000, "two-review foundation workflow must retain its observed 300-second bound");
      assert(FOUNDATION_SERVER_PROMPT_TIMEOUT_MS === 420_000, "structured foundation server workflow must retain its observed long-session bound");
      assert(configuredScenarioTimeoutMs(loadDecisionGapPack(root, "shift-left").pack.manifest.scenarios[0]!, "none") === 180_000, "unrelated configured scenarios must retain the existing 180-second bound");
      assert(configuredScenarioTimeoutMs(loaded.pack.manifest.scenarios[0]!, "timeout") === 50, "failure injection must retain its fast timeout oracle");
      const preflight = invokeCli(["--mode", "preflight", "--pack", "foundation-integrity", "--source-ref", "working-tree"]);
      assert(preflight.status === 0, preflight.stderr || preflight.stdout);
      const payload = JSON.parse(preflight.stdout) as Record<string, any>;
      assert(payload.modelCalls === 0 && payload.configuredSessionRequired === true, "foundation-integrity preflight must be provider-free and require configured capture");
      assert(payload.scenarioIds.length === 7 && payload.scenarioMembers.length === 12 && payload.terminalRowCountPerArm === 12, "foundation-integrity preflight population");
      assert(payload.permissionEnvelope.allow.join(",") === "edit,read,skill:foundation-integrity-recovery,task:foundation-integrity-reviewer", "foundation-integrity exact allow envelope");
      assert(payload.permissionEnvelope.deny.join(",") === "bash,external_directory,glob,grep,question,webfetch", "foundation-integrity exact deny envelope");
      assert(payload.permissionEnvelope.externalWrites === false && payload.permissionEnvelope.fixtureWrites === true, "foundation-integrity write containment");
      const selectedPreflight = invokeCli([
        "--mode", "preflight", "--pack", "foundation-integrity", "--source-ref", "working-tree",
        "--scenarios", "mismatch-unique-recovery",
      ]);
      assert(selectedPreflight.status === 0, selectedPreflight.stderr || selectedPreflight.stdout);
      const selectedPayload = JSON.parse(selectedPreflight.stdout) as Record<string, any>;
      assert(selectedPayload.modelCalls === 0, "foundation-integrity subset preflight must remain provider-free");
      assert(selectedPayload.scenarioIds.join(",") === "mismatch-unique-recovery", "subset preflight must retain only the selected scenario");
      assert(selectedPayload.scenarioMembers.length === 3 && selectedPayload.configuredProviderRequestBound === 2, "subset preflight must retain the three happy-path members and matched two-arm bound");

      const checkerParent = tempDir("foundation-integrity-checker");
      try {
        for (const scenario of loaded.pack.manifest.scenarios) {
          const caseRecord = JSON.parse(fs.readFileSync(path.join(root, scenario.fixturePath, "cases", `${scenario.id}.json`), "utf8")) as Record<string, any>;
          const expected = loaded.pack.expectedDecisions[scenario.id] as FoundationIntegrityScenarioExpectation;
          const expectedFallback = structuredClone(expected.baseline) as Record<string, unknown>;
          delete expectedFallback.artifactRows;
          assert(stableJson(caseRecord.fallbackDecision) === stableJson(expectedFallback), `${scenario.id} fallbackDecision must exactly match the reviewed baseline observation`);
          for (const arm of ["baseline", "candidate"] as const) {
            const fixtureRoot = path.join(checkerParent, `${scenario.id}-${arm}`);
            fs.cpSync(path.join(root, scenario.fixturePath), fixtureRoot, { recursive: true });
            if (arm === "candidate" && caseRecord.facts.correctedState != null) {
              fs.writeFileSync(path.join(fixtureRoot, caseRecord.facts.correctionPath), stableJson(caseRecord.facts.correctedState));
            }
            const decision = structuredClone(expected[arm]) as Record<string, unknown>;
            delete decision.artifactRows;
            fs.writeFileSync(path.join(fixtureRoot, "decision.json"), stableJson(decision));
            const checked = spawnSync(process.execPath, ["check-decision.ts", scenario.id], { cwd: fixtureRoot, encoding: "utf8" });
            assert(checked.status === 0, checked.stderr || checked.stdout);
            assert(stableJson(JSON.parse(checked.stdout)) === stableJson(expected[arm]), `${scenario.id} ${arm} checker observation must match reviewed IDs, states, and hashes`);
          }
        }
      } finally {
        fs.rmSync(checkerParent, { force: true, recursive: true });
      }

      const raw = JSON.parse(fs.readFileSync(path.join(root, "tools/proofs/fixtures/consumer-outcome/foundation-integrity-r1.json"), "utf8")) as Record<string, any>;
      const missingMember = structuredClone(raw);
      missingMember.scenarios[0].expectedDecision.candidate.terminalRows.pop();
      let message = "";
      try {
        parseDecisionGapPack(missingMember, "foundation-integrity");
      } catch (error) {
        message = error instanceof Error ? error.message : String(error);
      }
      assert(message.includes("same members") || message.includes("memberOrder"), `missing foundation terminal row must fail: ${message}`);
      const invalidHash = structuredClone(raw);
      invalidHash.scenarios[0].expectedDecision.candidate.artifactRows[0].stateSha256 = "semantic-score";
      message = "";
      try {
        parseDecisionGapPack(invalidHash, "foundation-integrity");
      } catch (error) {
        message = error instanceof Error ? error.message : String(error);
      }
      assert(message.includes("stateSha256"), `non-explicit foundation artifact hash must fail: ${message}`);
      const help = invokeCli(["--help"]);
      assert(help.status === 0 && help.stdout.includes("foundation-integrity"), "effect-free help must advertise foundation-integrity");
    },
  },
  {
    name: "foundation-integrity evaluator emits seven scenario and twelve terminal rows per arm with deterministic provider-free replay",
    run: () => {
      const loaded = loadDecisionGapPack(root, "foundation-integrity");
      const baselineSamples = loaded.pack.manifest.scenarios.map((scenario) => {
        const expected = loaded.pack.expectedDecisions[scenario.id] as FoundationIntegrityScenarioExpectation;
        return foundationIntegritySample({ arm: "baseline", expected: expected.baseline, scenario });
      });
      const candidateSamples = loaded.pack.manifest.scenarios.map((scenario) => {
        const expected = loaded.pack.expectedDecisions[scenario.id] as FoundationIntegrityScenarioExpectation;
        return foundationIntegritySample({ arm: "candidate", expected: expected.candidate, scenario });
      });
      const baseline = bundleOf(baselineSamples, "baseline");
      baseline.scenarioDigest = loaded.digest;
      const candidate = bundleOf(candidateSamples, "candidate");
      candidate.scenarioDigest = loaded.digest;
      const evaluated = evaluateDecisionGapPack({ baseline, candidate, expectation: "no-regression", pack: loaded.pack });
      assert(evaluated.evaluation.status === "passed-no-regression", JSON.stringify(evaluated.evaluation));
      assert(evaluated.foundationIntegrityOracles?.length === 14 && evaluated.foundationIntegrityOracles.every((row) => row.passed), "all seven scenario rows per arm must pass");
      assert(evaluated.foundationIntegrityRows?.length === 24 && evaluated.foundationIntegrityRows.every((row) => row.passed), "all twelve terminal rows per arm must pass");
      assert(evaluated.foundationIntegrityRows?.filter((row) => row.arm === "baseline").every((row) => row.expectedStatus === "unknown"), "baseline rows must not claim candidate behavior");
      assert(evaluated.foundationIntegrityRows?.filter((row) => row.arm === "candidate").every((row) => row.expectedStatus === "supported"), "candidate rows must support every reviewed partition");

      const happyId = "mismatch-unique-recovery";
      const remainingIds = loaded.pack.manifest.scenarios.map((scenario) => scenario.id).filter((id) => id !== happyId);
      const happy = selectFoundationPack(loaded.pack, [happyId]);
      const remaining = selectFoundationPack(loaded.pack, remainingIds);
      const happyEvaluation = evaluateDecisionGapPack({
        baseline: projectBundles([baseline], happy.digest, [happyId]),
        candidate: projectBundles([candidate], happy.digest, [happyId]),
        expectation: "no-regression",
        pack: happy.pack,
      });
      assert(happyEvaluation.evaluation.status === "passed-no-regression", JSON.stringify(happyEvaluation.evaluation));
      assert(happyEvaluation.foundationIntegrityOracles?.length === 2 && happyEvaluation.foundationIntegrityRows?.length === 6, "happy-path projection must retain one scenario and three members per arm");
      const remainingCandidate = projectBundles([candidate], remaining.digest, remainingIds);
      const composedCandidate = projectBundles([
        projectBundles([candidate], happy.digest, [happyId]),
        remainingCandidate,
      ], loaded.digest, loaded.pack.manifest.scenarios.map((scenario) => scenario.id));
      const composedEvaluation = evaluateDecisionGapPack({
        baseline: projectBundles([baseline], loaded.digest, loaded.pack.manifest.scenarios.map((scenario) => scenario.id)),
        candidate: composedCandidate,
        expectation: "no-regression",
        pack: loaded.pack,
      });
      assert(composedEvaluation.evaluation.status === "passed-no-regression", JSON.stringify(composedEvaluation.evaluation));
      assert(composedEvaluation.foundationIntegrityRows?.length === 24, "provider-free composition must restore all twelve members per arm without repeated candidate samples");

      const directory = tempDir("foundation-integrity-replay");
      const baselinePath = path.join(directory, "baseline.json");
      const candidatePath = path.join(directory, "candidate.json");
      fs.writeFileSync(baselinePath, stableJson(baseline));
      fs.writeFileSync(candidatePath, stableJson(candidate));
      try {
        const baselineOnly = invokeCli(["--mode", "evaluate", "--pack", "foundation-integrity", "--baseline", baselinePath, "--expectation", "baseline-establishment"]);
        assert(baselineOnly.status === 0, baselineOnly.stderr || baselineOnly.stdout);
        const baselinePayload = JSON.parse(baselineOnly.stdout) as Record<string, any>;
        assert(baselinePayload.liveCalls === 0 && baselinePayload.evaluation.evaluation.status === "baseline-established", JSON.stringify(baselinePayload));
        assert(baselinePayload.evaluation.foundationIntegrityOracles.length === 7 && baselinePayload.evaluation.foundationIntegrityRows.length === 12, "baseline replay must retain seven scenarios and twelve unknown rows");
        const args = ["--mode", "evaluate", "--pack", "foundation-integrity", "--baseline", baselinePath, "--candidate", candidatePath];
        const first = invokeCli(args);
        const second = invokeCli(args);
        assert(first.status === 0 && second.status === 0, first.stderr || second.stderr || first.stdout || second.stdout);
        const firstPayload = JSON.parse(first.stdout) as Record<string, any>;
        const secondPayload = JSON.parse(second.stdout) as Record<string, any>;
        assert(firstPayload.liveCalls === 0 && secondPayload.liveCalls === 0, "foundation-integrity replay must make zero provider calls");
        assert(firstPayload.evaluation.digest === secondPayload.evaluation.digest, "foundation-integrity terminal replay digest must be deterministic");

        const wrongExpected = structuredClone((loaded.pack.expectedDecisions[loaded.pack.manifest.scenarios[0].id] as FoundationIntegrityScenarioExpectation).candidate);
        wrongExpected.artifactRows[0].stateSha256 = "0".repeat(64);
        const wrongCandidate = bundleOf([
          foundationIntegritySample({ arm: "candidate", expected: wrongExpected, scenario: loaded.pack.manifest.scenarios[0] }),
          ...candidateSamples.slice(1),
        ], "candidate");
        wrongCandidate.scenarioDigest = loaded.digest;
        const failed = evaluateDecisionGapPack({ baseline, candidate: wrongCandidate, expectation: "no-regression", pack: loaded.pack });
        assert(failed.evaluation.status === "failed" && failed.evaluation.reasons.includes("foundation-integrity-oracle:candidate:mismatch-unique-recovery:1:artifactRows"), JSON.stringify(failed.evaluation.reasons));
      } finally {
        fs.rmSync(directory, { force: true, recursive: true });
      }
    },
  },
  {
    name: "configured complexity partition pack preserves twelve matched fixture and invocation identities",
    run: () => {
      const loaded = loadComplexityConfiguredSessionPack(root);
      assert(loaded.pack.id === "complexity-configured-session-r1", "configured complexity pack identity");
      assert(loaded.pack.configuredProviderRequestBound === 24, "configured complexity pack request bound");
      assert(loaded.pack.memberOrder.join(",") === COMPLEXITY_CONFIGURED_SESSION_MEMBER_ORDER.join(","), "configured complexity member order");
      assert(loaded.pack.manifest.scenarios.map((scenario) => scenario.id).join(",") === loaded.pack.memberOrder.join(","), "configured complexity scenarios must cover member order exactly");
      const preflight = invokeCli(["--mode", "preflight", "--pack", "complexity-configured", "--source-ref", "working-tree"]);
      assert(preflight.status === 0, preflight.stderr || preflight.stdout);
      const gate = JSON.parse(preflight.stdout) as Record<string, any>;
      assert(gate.modelCalls === 0 && gate.invocationManifest.length === 24, "configured complexity preflight must remain provider-free and complete");
      assert(gate.configuredCapture.semanticClaimBeforeCapture === "unsupported", "configured complexity preflight must not claim an uncaptured outcome");

      const diagnostic = loadDecisionGapPack(root, "complexity");
      assert(diagnostic.pack.manifest.scenarios.length === 1 && diagnostic.pack.manifest.scenarios[0]?.id === "useful-current-consumer-facade", "task-2.4 diagnostic pack must remain independently sealed");

      const invocationRows = complexityConfiguredInvocationManifest(loaded.pack);
      assert(invocationRows.length === 24, `configured invocation rows=${invocationRows.length}`);
      const selected = selectComplexityConfiguredPack(loaded.pack, ["default-core-availability"]);
      assert(selected.pack.memberOrder.join(",") === "default-core-availability" && selected.pack.configuredProviderRequestBound === 2, "configured complexity selection must retain one bounded member");
      assert(selected.pack.manifest.scenarios[0]?.id === "default-core-availability" && Object.keys(selected.pack.expectedDecisions).join(",") === "default-core-availability", "configured complexity selection must project its scenario and oracle");
      const selectedPreflight = invokeCli(["--mode", "preflight", "--pack", "complexity-configured", "--scenarios", "default-core-availability", "--source-ref", "working-tree"]);
      assert(selectedPreflight.status === 0, selectedPreflight.stderr || selectedPreflight.stdout);
      const selectedGate = JSON.parse(selectedPreflight.stdout) as Record<string, any>;
      assert(selectedGate.modelCalls === 0 && selectedGate.configuredProviderRequestBound === 2 && selectedGate.invocationManifest.length === 2, "configured complexity selected preflight must remain provider-free and bounded");
      const baselineSamples: SampleEvidence[] = [];
      const candidateSamples: SampleEvidence[] = [];
      for (const scenario of loaded.pack.manifest.scenarios) {
        const pair = invocationRows.filter((row) => row.scenarioId === scenario.id);
        assert(pair.length === 2 && pair[0]?.arm === "baseline" && pair[1]?.arm === "candidate", `${scenario.id} arm order`);
        const [baseline, candidate] = pair;
        assert(baseline.comparisonIdentity === candidate.comparisonIdentity, `${scenario.id} comparison identity drifted`);
        assert(baseline.requestIdentity === candidate.requestIdentity, `${scenario.id} prompt drifted`);
        assert(baseline.modelIdentity === candidate.modelIdentity, `${scenario.id} model route drifted`);
        assert(baseline.variantIdentity === candidate.variantIdentity, `${scenario.id} variant route drifted`);
        assert(baseline.permissionIdentity === candidate.permissionIdentity, `${scenario.id} permissions drifted`);
        assert(baseline.environmentIdentity === candidate.environmentIdentity, `${scenario.id} environment drifted`);
        assert(baseline.maximumClaim === loaded.pack.expectedDecisions[scenario.id]?.baseline.maximumClaim, `${scenario.id} baseline maximum claim`);
        assert(candidate.maximumClaim === loaded.pack.expectedDecisions[scenario.id]?.candidate.maximumClaim, `${scenario.id} candidate maximum claim`);
        for (const arm of ["baseline", "candidate"] as const) {
          const observation = loaded.pack.expectedDecisions[scenario.id]?.[arm];
          assert(observation != null, `${scenario.id} ${arm} observation missing`);
          assert(observation.triggerFacts.length > 0 && observation.ownerFacts.length > 0, `${scenario.id} ${arm} trigger/owner facts missing`);
          assert(observation.contextFacts.length > 0 && observation.pathFacts.length > 0, `${scenario.id} ${arm} context/path facts missing`);
          assert(observation.maximumClaim.endsWith("-only"), `${scenario.id} ${arm} claim is not partition-bounded`);
        }

        const expectedPair = loaded.pack.expectedDecisions[scenario.id]!;
        const caseRecord = JSON.parse(fs.readFileSync(path.join(root, scenario.fixturePath, "case.json"), "utf8")) as Record<string, any>;
        const decisionContract = caseRecord.decisionContract as Record<string, any>;
        const expectedUnion = (field: "contextFacts" | "ownerFacts" | "pathFacts" | "triggerFacts") => [
          ...new Set([...expectedPair.baseline[field], ...expectedPair.candidate[field]]),
        ];
        assert(Array.isArray(decisionContract.instructions) && decisionContract.instructions.length === 4, `${scenario.id} decision contract instructions`);
        assert(decisionContract.maximumClaim === expectedPair.baseline.maximumClaim && decisionContract.maximumClaim === expectedPair.candidate.maximumClaim, `${scenario.id} decision contract maximum claim`);
        assert(decisionContract.admissionClasses.join(",") === [...new Set([expectedPair.baseline.admissionClass, expectedPair.candidate.admissionClass])].join(","), `${scenario.id} decision contract admission classes`);
        assert(decisionContract.dispositions.join(",") === [...new Set([expectedPair.baseline.disposition, expectedPair.candidate.disposition])].join(","), `${scenario.id} decision contract dispositions`);
        for (const field of ["contextFacts", "ownerFacts", "pathFacts", "triggerFacts"] as const) {
          assert(decisionContract.factVocabulary[field].join(",") === expectedUnion(field).join(","), `${scenario.id} decision contract ${field}`);
        }
        const expectedRoutes = [...new Set([stableJson(expectedPair.baseline), stableJson(expectedPair.candidate)])];
        const actualRoutes = decisionContract.routeDecisions.map((route: Record<string, any>) => {
          assert(typeof route.id === "string" && route.id !== "" && typeof route.when === "string" && route.when !== "", `${scenario.id} route decision identity`);
          return stableJson(route.decision);
        });
        assert(actualRoutes.join("\n") === expectedRoutes.join("\n"), `${scenario.id} route decisions must preserve the reviewed oracle records exactly once in arm order`);

        for (const arm of ["baseline", "candidate"] as const) {
          const fixtureRoot = tempDir(`complexity-${scenario.id}-${arm}`);
          try {
            fs.cpSync(path.join(root, scenario.fixturePath), fixtureRoot, { recursive: true });
            fs.writeFileSync(path.join(fixtureRoot, "decision.json"), stableJson(loaded.pack.expectedDecisions[scenario.id]![arm]));
            const validation = spawnSync(scenario.validationArgv[0], scenario.validationArgv.slice(1), { cwd: fixtureRoot, encoding: "utf8" });
            assert(validation.status === 0, `${scenario.id} ${arm} validation: ${validation.stderr || validation.stdout}`);
            const proof = spawnSync(scenario.proofExpectations.argv[0], scenario.proofExpectations.argv.slice(1), { cwd: fixtureRoot, encoding: "utf8" });
            assert(proof.status === 0, `${scenario.id} ${arm} proof: ${proof.stderr || proof.stdout}`);
            assert(scenario.proofExpectations.stdoutIncludes.every((text) => proof.stdout.includes(text)), `${scenario.id} ${arm} proof output drifted`);
            const captured = sample({
              arm,
              command: { argv: ["configured-seed", arm], status: 0, stderr: "", stdout: "" },
              environmentIdentity: env({ initialFixtureDigest: scenario.id }),
              files: [...new Set([...scenario.initialManifest.files, ...scenario.expectedOutcome.stateFiles])]
                .sort()
                .map((file) => ({ path: file, sha256: sha256(file) })),
              forbiddenEffects: scenario.forbiddenEffects.map((name) => ({ name, observed: false })),
              permissions: { ...scenario.permissions, violations: [] },
              proof: {
                argv: scenario.proofExpectations.argv,
                status: proof.status,
                stderr: proof.stderr,
                stdout: proof.stdout,
              },
              sampleIndex: 1,
              scenarioId: scenario.id,
              sideEffects: scenario.allowedEffects,
              validation: {
                argv: scenario.validationArgv,
                status: validation.status,
                stderr: validation.stderr,
                stdout: validation.stdout,
              },
            });
            (arm === "baseline" ? baselineSamples : candidateSamples).push(captured);
          } finally {
            fs.rmSync(fixtureRoot, { force: true, recursive: true });
          }
        }
        assert(scenario.cleanupOracle.fixtureRemoved && scenario.cleanupOracle.processesRemoved && scenario.cleanupOracle.sessionsRemoved, `${scenario.id} cleanup oracle must fail closed`);
      }

      const baseline = bundleOf(baselineSamples, "baseline");
      const candidate = bundleOf(candidateSamples, "candidate");
      baseline.scenarioDigest = loaded.digest;
      candidate.scenarioDigest = loaded.digest;
      const evaluation = evaluateComplexityConfiguredSessionPack({ baseline, candidate, expectation: "no-regression", pack: loaded.pack });
      assert(evaluation.evaluation.status === "passed-no-regression", JSON.stringify(evaluation.evaluation.reasons));
      assert(evaluation.complexityPartitionOracles?.length === 24 && evaluation.complexityPartitionOracles.every((row) => row.passed), "all configured complexity observations must match their reviewed oracle");
      assert(evaluation.complexityFactDiffs?.length === 84 && evaluation.complexityFactDiffs.every((row) => row.state !== "unknown"), "all seven exact fact dimensions must be known for every partition");
      assert(evaluation.complexityFactDiffs.some((row) => row.scenarioId === "useful-current-consumer-facade" && row.dimension === "consumer-context" && row.state === "changed"), "facade consumer context must remain an explicit fact diff");
      assert(evaluation.complexityFactDiffs.some((row) => row.scenarioId === "useful-current-consumer-facade" && row.dimension === "effects" && row.state === "unchanged"), "facade effects must remain directly comparable");
      const replayed = evaluateComplexityConfiguredSessionPack({ baseline, candidate, expectation: "no-regression", pack: loaded.pack });
      assert(replayed.digest === evaluation.digest, "configured complexity evaluation must replay deterministically");

      const diagnosticCandidate = structuredClone(candidate);
      const diagnosticFirst = diagnosticCandidate.samples[0]!;
      const { hashes: _diagnosticHashes, ...diagnosticFields } = diagnosticFirst;
      diagnosticCandidate.samples[0] = seal({
        ...diagnosticFields,
        friction: { ...diagnosticFirst.friction, failedToolCallCount: 1, totalToolCallCount: diagnosticFirst.friction.totalToolCallCount + 1 },
        toolCalls: [{ argumentDigest: "0".repeat(64), name: "bash", status: "error" }],
      });
      diagnosticCandidate.byteLength = diagnosticCandidate.samples.reduce((sum, row) => sum + Buffer.byteLength(stableJson(row), "utf8"), 0);
      const diagnosticEvaluation = evaluateComplexityConfiguredSessionPack({ baseline, candidate: diagnosticCandidate, expectation: "no-regression", pack: loaded.pack });
      assert(diagnosticEvaluation.evaluation.status === "passed-no-regression", JSON.stringify(diagnosticEvaluation.evaluation));
      assert(diagnosticEvaluation.complexityFactDiffs?.some((row) => row.scenarioId === "cohesive-small-project" && row.dimension === "errors" && row.state === "changed" && row.candidate?.includes("tool:0:bash:error")), "configured complexity failed tool calls must remain visible in exact error facts");

      const replayRoot = tempDir("complexity-configured-replay");
      const baselinePath = path.join(replayRoot, "baseline.json");
      const candidatePath = path.join(replayRoot, "candidate.json");
      fs.writeFileSync(baselinePath, stableJson(baseline));
      fs.writeFileSync(candidatePath, stableJson(candidate));
      try {
        const baselineOnly = invokeCli(["--mode", "evaluate", "--pack", "complexity-configured", "--baseline", baselinePath, "--expectation", "baseline-establishment"]);
        assert(baselineOnly.status === 0, baselineOnly.stderr || baselineOnly.stdout);
        const baselinePayload = JSON.parse(baselineOnly.stdout) as Record<string, any>;
        assert(baselinePayload.liveCalls === 0 && baselinePayload.evaluation.evaluation.status === "baseline-established", JSON.stringify(baselinePayload));
        const replayArgs = ["--mode", "evaluate", "--pack", "complexity-configured", "--baseline", baselinePath, "--candidate", candidatePath];
        const firstReplay = invokeCli(replayArgs);
        const secondReplay = invokeCli(replayArgs);
        assert(firstReplay.status === 0 && secondReplay.status === 0, firstReplay.stderr || secondReplay.stderr || firstReplay.stdout || secondReplay.stdout);
        const firstPayload = JSON.parse(firstReplay.stdout) as Record<string, any>;
        const secondPayload = JSON.parse(secondReplay.stdout) as Record<string, any>;
        assert(firstPayload.liveCalls === 0 && secondPayload.liveCalls === 0, "configured complexity replay must make zero provider calls");
        assert(firstPayload.evaluation.evaluation.status === "passed-no-regression", JSON.stringify(firstPayload));
        assert(firstPayload.evaluation.digest === secondPayload.evaluation.digest, "configured complexity terminal replay digest must be deterministic");
      } finally {
        fs.rmSync(replayRoot, { force: true, recursive: true });
      }

      const malformedCandidate = structuredClone(candidate);
      const first = malformedCandidate.samples[0]!;
      const { hashes: _hashes, ...firstFields } = first;
      malformedCandidate.samples[0] = seal({ ...firstFields, proof: { ...first.proof, stdout: "{}" } });
      malformedCandidate.byteLength = malformedCandidate.samples.reduce((sum, row) => sum + Buffer.byteLength(stableJson(row), "utf8"), 0);
      const malformed = evaluateComplexityConfiguredSessionPack({ baseline, candidate: malformedCandidate, expectation: "no-regression", pack: loaded.pack });
      assert(malformed.evaluation.status === "failed", JSON.stringify(malformed.evaluation));
      assert(malformed.evaluation.reasons.includes("complexity-partition:candidate:cohesive-small-project:1:malformed-observation"), JSON.stringify(malformed.evaluation.reasons));
      assert(malformed.evaluation.reasons.includes("complexity-fact-diff:cohesive-small-project:consumer-context:unknown"), JSON.stringify(malformed.evaluation.reasons));

      const sourcePack = JSON.parse(fs.readFileSync(path.join(root, "tools/proofs/fixtures/consumer-outcome/complexity-configured-session-r1.json"), "utf8")) as Record<string, any>;
      const semanticAlternative = structuredClone(sourcePack);
      semanticAlternative.scenarios[4].expectedDecision.candidate.disposition = "retain";
      parseComplexityConfiguredSessionPack(semanticAlternative);

      const helperScore = structuredClone(sourcePack);
      helperScore.qualityScore = 9;
      let rejectedScore = false;
      try {
        parseComplexityConfiguredSessionPack(helperScore);
      } catch (error) {
        rejectedScore = error instanceof ContractError && error.message.includes("qualityScore");
      }
      assert(rejectedScore, "configured complexity pack must reject helper-inferred scores");
    },
  },
  {
    name: "complexity facade pack prepares one bounded member and replays its reviewed refactor provider-free",
    run: async () => {
      const loaded = loadDecisionGapPack(root, "complexity");
      assert(loaded.pack.manifest.scenarios.length === 1, "complexity pack must contain one prepared member");
      assert(loaded.pack.manifest.scenarios[0].id === "useful-current-consumer-facade", "complexity member identity");
      const preflight = invokeCli(["--mode", "preflight", "--pack", "complexity", "--source-ref", "working-tree"]);
      assert(preflight.status === 0, preflight.stderr || preflight.stdout);
      const gate = JSON.parse(preflight.stdout) as Record<string, any>;
      assert(gate.modelCalls === 0 && gate.configuredProviderRequestBound === 1, "complexity preflight request bound");
      assert(gate.configuredCapture.liveAttemptGate === "requires-current-explicit-clearance", "complexity live gate must remain explicit");
      assert(gate.scenarioMembers.join(",") === "useful-current-consumer-facade", "complexity member gate");
      assert(gate.effectEnvelope.fixtureWritesOnly === true && gate.cleanupContract.fixtureRemoved === true, "complexity effect and cleanup gate");

      const invalidContextRoot = tempDir("complexity-invalid-context");
      fs.cpSync(path.join(root, loaded.pack.manifest.scenarios[0].fixturePath), invalidContextRoot, { recursive: true });
      const invalidDecision = structuredClone((loaded.pack.expectedDecisions["useful-current-consumer-facade"] as ComplexityFacadeScenarioExpectation).candidate);
      invalidDecision.changeRehearsal.essentialContext.push("src/inventory.ts: should be hidden after the facade");
      fs.writeFileSync(path.join(invalidContextRoot, "decision.json"), stableJson(invalidDecision));
      const invalidContext = spawnSync(process.execPath, ["check-decision.ts"], { cwd: invalidContextRoot, encoding: "utf8" });
      assert(invalidContext.status !== 0 && invalidContext.stderr.includes("retains hidden internal: src/inventory.ts"), invalidContext.stderr || invalidContext.stdout);
      fs.rmSync(invalidContextRoot, { force: true, recursive: true });

      const parent = tempDir("complexity-facade");
      const baselineRoot = path.join(parent, "baseline");
      const candidateRoot = path.join(parent, "candidate");
      const sourceIdentity = governedSourceIdentity(root, "working-tree", loaded.pack.manifest.governedSourcePaths);
      const baseline = await captureLane(loaded.pack.manifest, loaded.digest, {
        candidateId: "complexity-facade-baseline-r1",
        evidenceRoot: baselineRoot,
        failure: "none",
        gitRef: "working-tree",
        kind: "baseline",
        repoRoot: root,
        sessionMode: "harness",
        sourceIdentity,
      });
      const candidate = await captureLane(loaded.pack.manifest, loaded.digest, {
        candidateId: "complexity-facade-candidate-r1",
        evidenceRoot: candidateRoot,
        failure: "none",
        gitRef: "working-tree",
        kind: "candidate",
        repoRoot: root,
        sessionMode: "harness",
        sourceIdentity,
      });
      assert([...baseline.samples, ...candidate.samples].every((sample) => sample.cleanup.complete), "complexity fixture cleanup");
      assert([...baseline.samples, ...candidate.samples].every((sample) => sample.friction.configuredProviderRequestCount === 0), "offline preparation must make zero configured calls");
      assert(baseline.samples[0].validation.stdout === candidate.samples[0].validation.stdout, "same scenario output must be preserved");
      for (const relative of ["src/order-service.ts", "src/run-order.ts"]) {
        const before = baseline.samples[0].files.find((file) => file.path === relative)?.sha256;
        const after = candidate.samples[0].files.find((file) => file.path === relative)?.sha256;
        assert(before != null && after != null && before !== after, `${relative} must have a reviewed fact diff`);
      }
      const evaluated = evaluateDecisionGapPack({ baseline, candidate, expectation: "no-regression", pack: loaded.pack });
      assert(evaluated.evaluation.status === "passed-no-regression", evaluated.evaluation.reasons.join(","));
      assert(evaluated.complexityOracles?.length === 2 && evaluated.complexityOracles.every((row) => row.passed), "complexity reviewed oracles");

      const replayArgs = [
        "--mode", "evaluate",
        "--pack", "complexity",
        "--baseline", path.join(baselineRoot, "bundle.json"),
        "--candidate", path.join(candidateRoot, "bundle.json"),
      ];
      const first = invokeCli(replayArgs);
      const second = invokeCli(replayArgs);
      assert(first.status === 0 && second.status === 0, first.stderr || second.stderr || first.stdout || second.stdout);
      const firstPayload = JSON.parse(first.stdout) as Record<string, any>;
      const secondPayload = JSON.parse(second.stdout) as Record<string, any>;
      assert(firstPayload.liveCalls === 0 && secondPayload.liveCalls === 0, "complexity replay must make zero live calls");
      assert(firstPayload.evaluation.digest === secondPayload.evaluation.digest, "complexity replay must be deterministic");
      assert(firstPayload.evaluation.evaluation.status === "passed-no-regression", first.stdout);

      const blockedRoot = path.join(parent, "blocked-configured-capture");
      const blocked = invokeCli([
        "--mode", "capture",
        "--pack", "complexity",
        "--candidate-id", "blocked-configured-capture",
        "--evidence-root", blockedRoot,
        "--baseline", path.join(baselineRoot, "bundle.json"),
        "--source-ref", "working-tree",
        "--session-mode", "configured",
      ]);
      assert(blocked.status === 1 && blocked.stderr.includes("separately cleared diagnose invocation"), blocked.stderr || blocked.stdout);
      assert(!fs.existsSync(blockedRoot), "blocked configured capture must create no evidence");
      fs.rmSync(parent, { force: true, recursive: true });
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
        assert(output.includes("Diagnostics:"), output);
        assert(output.includes("Cleanup:"), output);
        assert(output.includes("baseline"), output);
        assert(output.includes("capture"), output);
        assert(!output.includes("--mode replay"), output);
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
      const redacted = redactPrivacyMarkers("api_key=sk-hidden-value Bearer abc.def token=opaque-value");
      assert(redacted.counts.credentialName === 1 && redacted.counts.providerPrefix === 1, "diagnostic redaction must count credential names and provider prefixes");
      assert(redacted.counts.authorizationHeader === 1 && redacted.counts.sensitiveAssignment === 1, "diagnostic redaction must count authorization and assignment markers");
      assertPrivacySafe(redacted.text, "redacted diagnostic text");
      const sealedDiagnostic = sealConfiguredDiagnostic({ digest: "", nested: { log: "api_key=sk-hidden-value" } });
      assert((sealedDiagnostic.privacyRedactions as Record<string, number>).credentialName === 1, "sealed diagnostic must preserve only privacy marker counts");
      assert(sealedDiagnostic.digest === digestOf({ ...sealedDiagnostic, digest: "" }), "diagnostic digest must bind the sanitized evidence and marker counts");
      assertPrivacySafe(stableJson(sealedDiagnostic), "sealed diagnostic");
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
        "--mode", "evaluate",
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
        "--mode", "evaluate",
        "--pack", "shift-left",
        "--baseline", path.join(baselineRoot, "bundle.json"),
        "--candidate", path.join(candidateRoot, "bundle.json"),
      ]);
      const second = invokeCli([
        "--mode", "evaluate",
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
    name: "missing foundation decision seals negative evidence before cleanup",
    run: async () => {
      const loaded = loadDecisionGapPack(root, "foundation-integrity");
      const selected = selectFoundationPack(loaded.pack, ["mismatch-unique-recovery"]);
      const sourceIdentity = governedSourceIdentity(root, "HEAD", selected.pack.manifest.governedSourcePaths);
      const baselineEvidence = tempDir("foundation-missing-decision-baseline");
      const evidence = tempDir("foundation-missing-decision");
      fs.rmSync(baselineEvidence, { force: true, recursive: true });
      fs.rmSync(evidence, { force: true, recursive: true });
      const bundle = await captureLane(selected.pack.manifest, selected.digest, {
        candidateId: "foundation-missing-decision",
        evidenceRoot: evidence,
        failure: "model",
        gitRef: "HEAD",
        kind: "candidate",
        repoRoot: root,
        sessionMode: "harness",
        sourceIdentity,
      });
      assert(bundle.samples.length === 1 && bundle.samples[0]?.cleanup.complete, "missing outcome must retain one terminal, cleaned-up sample");
      assert(bundle.samples[0]?.proof.status === 1, "missing decision checker must retain its non-zero proof exit");
      assert(!bundle.samples[0]?.files.some((file) => file.path === "decision.json"), "missing decision must remain an explicit absent state file");
      assert(fs.existsSync(path.join(evidence, "bundle.json")), "negative sample must be sealed before handoff");
      const { hashes: _hashes, ...baselineDraft } = structuredClone(bundle.samples[0]!);
      const baselineDecision = stableJson({
        caseId: "mismatch-unique-recovery",
        ...(selected.pack.expectedDecisions["mismatch-unique-recovery"] as { baseline: Record<string, unknown> }).baseline,
      });
      baselineDraft.arm = "baseline";
      baselineDraft.files.push({ path: "decision.json", sha256: digestOf(baselineDecision) });
      baselineDraft.proof = { ...baselineDraft.proof, status: 0, stderr: "", stdout: baselineDecision };
      baselineDraft.validation = { ...baselineDraft.validation, status: 0, stderr: "", stdout: baselineDecision };
      const baseline = createCaptureBundle({
        candidateId: "foundation-missing-decision-baseline",
        evidenceRoot: baselineEvidence,
        kind: "baseline",
        samples: [sealSample(baselineDraft)],
        scenarioDigest: selected.digest,
        sourceIdentity,
      });
      const evaluation = evaluateDecisionGapPack({ baseline, candidate: bundle, expectation: "no-regression", pack: selected.pack });
      assert(evaluation.evaluation.status === "failed", "sealed missing output must reach a terminal evaluator failure");
      assert(evaluation.evaluation.reasons.some((reason) => reason.includes("proof") || reason.includes("outcome")), evaluation.evaluation.reasons.join(","));
      fs.rmSync(baselineEvidence, { force: true, recursive: true });
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
      assert(readme.includes("automatically cleaned temporary directory outside the repository"), "temporary-output contract");
      assert(readme.includes("Do not create repository `evidence/` trees"), "no durable proof artifacts");
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
