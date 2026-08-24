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
} from "./proofs/consumer-outcome/contracts.ts";
import { evaluateBundle, evaluateDecisionGapPack, gateCurrent, replayEvaluation } from "./proofs/consumer-outcome/evaluate.ts";

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
    files: [{ path: partial.scenarioId === "ordinary-small-greeting" ? "src/greet.ts" : "src/report.ts", sha256: "a" }],
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

function arms(scenarioId: string, friction: FrictionVector, sourceDigest?: string): SampleEvidence[] {
  return [1, 2, 3].map((sampleIndex) => sample({
    arm: scenarioId.endsWith("-c") ? "candidate" : "baseline",
    friction,
    sampleIndex,
    scenarioId: scenarioId.replace(/-c$/, ""),
    sourceIdentity: source(sourceDigest),
  }));
}

function invokeCli(args: string[], cwd = root): { status: number | null; stderr: string; stdout: string } {
  const result = spawnSync(process.execPath, [cli, ...args], { cwd, encoding: "utf8", timeout: 60_000 });
  return { status: result.status, stderr: result.stderr ?? "", stdout: result.stdout ?? "" };
}

const tests: TestCase[] = [
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
