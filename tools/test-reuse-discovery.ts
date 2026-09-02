#!/usr/bin/env node
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

import {
  applyCapabilityCompositionAuthoringControl,
  applyCapabilityCompositionReuseControl,
  capabilityCompositionPrompts,
  capabilityCompositionRedControls,
  capabilityCompositionReusePrompts,
  capabilityCompositionReuseScenarioIds,
  capabilityCompositionScenarioIds,
  createCompliantCapabilityCompositionFixture,
  evaluateCapabilityCompositionReuseObservation,
  evaluateCapabilityCompositionScenario,
  expectedCapabilityCompositionReuseObservation,
  isCapabilityCompositionReuseScenario,
  isCapabilityCompositionScenario,
  loadCapabilityCompositionSeed,
  parseCapabilityCompositionObservation,
  parseCapabilityCompositionSeed,
  setupCapabilityCompositionScenario,
} from "./proofs/lib/capability-composition-scenarios.ts";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const runner = path.join(root, "tools", "proofs", "reuse-discovery.ts");

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

function digest(value: string | Uint8Array): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function run(args: string[]): { status: number | null; stdout: string; stderr: string } {
  const result = spawnSync(process.execPath, [runner, ...args], {
    cwd: root,
    encoding: "utf8",
    shell: false,
  });
  return {
    status: result.status,
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? "",
  };
}

function bundle(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    schemaVersion: 1,
    candidate: { id: "test-candidate", kind: "candidate", sourceHashes: { "global/AGENTS.md": "abc" } },
    cleanup: { error: null, removed: true, sessionDeleteStatuses: [] },
    command: { argv: ["opencode"], status: 0, stderr: "", stdout: "" },
    environment: {
      agent: "build",
      model: "openai/gpt-5.6-sol",
      profile: "quality-independent",
      route: "openai/gpt-5.6-sol/xhigh",
      toolPolicy: [],
      variant: "xhigh",
    },
    facts: {
      assistantText: "Decision: extend formatStatus in src/status.ts. No sibling module.",
      elapsedMs: 1,
      eventCount: 1,
      sessionIds: [],
      tokens: [],
      toolCalls: [{ input: { name: "reuse-discovery" }, name: "skill", status: "completed" }],
    },
    input: { prompt: "test", scenario: "local-owner" },
    sideEffects: { after: { "src/status.ts": "1" }, before: { "src/status.ts": "1" } },
    ...overrides,
  };
}

function writeBundles(dir: string, extendText: string, env: Record<string, unknown> = {}): void {
  fs.mkdirSync(dir, { recursive: true });
  const local = bundle({
    facts: {
      assistantText: "Decision: build-minimal after reuse-discovery. cross-project: degraded",
      elapsedMs: 1,
      eventCount: 1,
      sessionIds: [],
      tokens: [],
      toolCalls: [{ input: { name: "reuse-discovery" }, name: "skill", status: "completed" }],
    },
    environment: { agent: "build", model: "openai/gpt-5.6-sol", profile: "quality-independent", route: "openai/gpt-5.6-sol/xhigh", toolPolicy: [], variant: "xhigh", ...env },
  });
  const trivial = bundle({
    facts: {
      assistantText: "Fix the period.",
      elapsedMs: 1,
      eventCount: 1,
      sessionIds: [],
      tokens: [],
      toolCalls: [],
    },
  });
  const extend = bundle({
    facts: {
      assistantText: extendText,
      elapsedMs: 1,
      eventCount: 1,
      sessionIds: [],
      tokens: [],
      toolCalls: [],
    },
  });
  fs.writeFileSync(path.join(dir, "local-owner.bundle.json"), `${JSON.stringify(local)}\n`);
  fs.writeFileSync(path.join(dir, "trivial-fix.bundle.json"), `${JSON.stringify(trivial)}\n`);
  fs.writeFileSync(path.join(dir, "extend-existing-owner.bundle.json"), `${JSON.stringify(extend)}\n`);
}

function observationText(observation: ReturnType<typeof expectedCapabilityCompositionReuseObservation>): string {
  return [
    `Disposition: ${observation.disposition}`,
    `Selected candidate: ${observation.selectedCandidate}`,
    `Contract fit: ${observation.contractFit}`,
    `Total cost: ${observation.totalCost}`,
    `Popularity only: ${observation.popularityOnly}`,
    `Cross-project: ${observation.crossProject}`,
  ].join("\n");
}

function writeCapabilityBundles(dir: string, redPopularity = false): void {
  fs.mkdirSync(dir, { recursive: true });
  for (const scenario of capabilityCompositionReuseScenarioIds()) {
    const expected = redPopularity && scenario === "popular-contract-mismatch"
      ? applyCapabilityCompositionReuseControl(scenario, "popularity-only")
      : expectedCapabilityCompositionReuseObservation(scenario);
    const row = bundle({
      facts: {
        assistantText: observationText(expected),
        elapsedMs: 1,
        eventCount: 1,
        sessionIds: [],
        tokens: [],
        toolCalls: [],
      },
      input: { prompt: capabilityCompositionReusePrompts()[scenario], scenario },
      sideEffects: { after: { "evidence/candidates.json": "1" }, before: { "evidence/candidates.json": "1" } },
    });
    fs.writeFileSync(path.join(dir, `${scenario}.bundle.json`), `${JSON.stringify(row)}\n`);
  }
}

function main(): void {
  const source = fs.readFileSync(runner, "utf8");
  const scenarioMatch = /const LEGACY_SCENARIOS: readonly LegacyScenario\[\] = \[([^\]]+)\]/.exec(source);
  assert(scenarioMatch != null, "scenario list is present");
  const order = [...scenarioMatch[1].matchAll(/"([^"]+)"/g)].map((item) => item[1]);
  assert(JSON.stringify(order) === JSON.stringify(["local-owner", "trivial-fix", "extend-existing-owner"]), "stable scenario order");

  const help = run(["--help"]);
  assert(help.status === 0, "help exits 0");
  assert(help.stdout.includes("extend-existing-owner"), "help lists extend-existing-owner");
  assert(!help.stdout.includes(os.homedir()), "help is privacy-safe");
  assert(help.stdout.includes("capability-composition"), "help lists the capability-composition pack");

  const seed = loadCapabilityCompositionSeed();
  assert(seed.claimId === "CCO-001" && seed.authoringScenarios.length === 8 && seed.reuseScenarios.length === 4, "CCO seed has the reviewed finite population");
  assert(!JSON.stringify(seed).includes(os.homedir()) && !JSON.stringify(seed).includes("C:\\Users"), "CCO seed is privacy-safe");
  let malformedRejected = false;
  try {
    parseCapabilityCompositionSeed({ claimId: "CCO-001", pack: "capability-composition", schemaVersion: 1 });
  } catch {
    malformedRejected = true;
  }
  assert(malformedRejected, "malformed CCO seed fails closed");
  const concatenatedObservation = parseCapabilityCompositionObservation([
    "No files or processes will be changed.Disposition: reuse",
    "Selected candidate: current-normalizer",
    "Contract fit: verified",
    "Total cost: lower",
    "Popularity only: no",
    "Cross-project: degraded",
  ].join("\n"));
  assert(concatenatedObservation?.disposition === "reuse" && concatenatedObservation.crossProject === "degraded", "CCO observation parser tolerates captured commentary/final concatenation");

  const authoringFixture = fs.mkdtempSync(path.join(os.tmpdir(), "cco-authoring-test-"));
  try {
    for (const scenario of capabilityCompositionScenarioIds()) {
      assert(isCapabilityCompositionScenario(scenario), `authoring scenario ${scenario} is recognized`);
      const scenarioRoot = path.join(authoringFixture, scenario);
      setupCapabilityCompositionScenario(scenarioRoot, scenario);
      assert(!evaluateCapabilityCompositionScenario(scenarioRoot, scenario).pass, `incomplete authoring fixture ${scenario} fails`);
      createCompliantCapabilityCompositionFixture(scenarioRoot, scenario);
      assert(evaluateCapabilityCompositionScenario(scenarioRoot, scenario).pass, `compliant authoring fixture ${scenario} passes`);
      assert(capabilityCompositionPrompts()[scenario].length > 0, `authoring prompt ${scenario} is present`);
    }
    for (const control of capabilityCompositionRedControls("authoring")) {
      if (control.owner !== "authoring" || !isCapabilityCompositionScenario(control.scenario)) continue;
      const controlRoot = path.join(authoringFixture, `control-${control.id}`);
      setupCapabilityCompositionScenario(controlRoot, control.scenario);
      createCompliantCapabilityCompositionFixture(controlRoot, control.scenario);
      applyCapabilityCompositionAuthoringControl(controlRoot, control.id);
      const evaluated = evaluateCapabilityCompositionScenario(controlRoot, control.scenario);
      assert(!evaluated.pass && evaluated.facts[control.expectedFailure] === false, `authoring red control ${control.id} fails ${control.expectedFailure}`);
    }
    for (const scenario of capabilityCompositionReuseScenarioIds()) {
      assert(isCapabilityCompositionReuseScenario(scenario), `reuse scenario ${scenario} is recognized`);
      assert(evaluateCapabilityCompositionReuseObservation(scenario, expectedCapabilityCompositionReuseObservation(scenario)).pass, `reuse row ${scenario} passes reviewed observation`);
    }
    const popularExpected = expectedCapabilityCompositionReuseObservation("popular-contract-mismatch");
    assert(evaluateCapabilityCompositionReuseObservation("popular-contract-mismatch", { ...popularExpected, popularityOnly: "yes" }).pass, "popular mismatch accepts a rejected-candidate-only label when the local target remains selected");
    const popularity = capabilityCompositionRedControls("reuse").find((row) => row.id === "popularity-only");
    assert(popularity != null && isCapabilityCompositionReuseScenario(popularity.scenario), "popularity-only control is declared");
    if (popularity != null && isCapabilityCompositionReuseScenario(popularity.scenario)) {
      const evaluated = evaluateCapabilityCompositionReuseObservation(popularity.scenario, applyCapabilityCompositionReuseControl(popularity.scenario, popularity.id));
      assert(!evaluated.pass && evaluated.facts.matchesReviewedObservation === false, "popularity-only selection fails reviewed observation");
    }
  } finally {
    fs.rmSync(authoringFixture, { recursive: true, force: true });
    assert(!fs.existsSync(authoringFixture), "CCO authoring fixture cleanup removes the root");
  }

  const missingRoot = path.join(os.tmpdir(), `reuse-discovery-test-missing-${process.pid}`);
  const missingEval = path.join(os.tmpdir(), `reuse-discovery-test-missing-eval-${process.pid}`);
  const missing = run([
    "--mode", "evaluate",
    "--evidence-root", missingEval,
    "--baseline-root", missingRoot,
    "--candidate-root", missingRoot,
  ]);
  assert(missing.status !== 0, "missing bundle fails");
  const missingText = `${missing.stdout}\n${missing.stderr}`;
  assert(missingText.includes("Unable to read local-owner bundle"), "missing bundle names the scenario");
  assert(missingText.includes("cause") || missing.stderr.includes("ENOENT") || missingText.includes("no such file") || missingText.includes("Unable to read"), "missing bundle preserves cause");

  const fixture = fs.mkdtempSync(path.join(os.tmpdir(), "reuse-discovery-test-"));
  try {
    const baseline = path.join(fixture, "baseline");
    const candidate = path.join(fixture, "candidate");
    writeBundles(baseline, "Decision: extend formatStatus in src/status.ts.");
    writeBundles(candidate, "Decision: extend formatStatus in src/status.ts.");
    writeBundles(path.join(fixture, "mismatch"), "Decision: extend formatStatus in src/status.ts.", { model: "other/model", route: "other/model/xhigh" });

    const mismatchEval = path.join(fixture, "eval-mismatch");
    const mismatch = run([
      "--mode", "evaluate",
      "--evidence-root", mismatchEval,
      "--baseline-root", baseline,
      "--candidate-root", path.join(fixture, "mismatch"),
    ]);
    assert(mismatch.status !== 0, "environment mismatch fails");
    assert(`${mismatch.stdout}\n${mismatch.stderr}`.includes("Source/environment mismatch"), "mismatch names the identity failure");
    assert(!fs.existsSync(mismatchEval), "mismatch fails before creating evidence root");

    const siblingEval = path.join(fixture, "eval-sibling");
    writeBundles(path.join(fixture, "sibling"), "Add a new sibling module error-status.ts instead of touching formatStatus.");
    const sibling = run([
      "--mode", "evaluate",
      "--evidence-root", siblingEval,
      "--baseline-root", baseline,
      "--candidate-root", path.join(fixture, "sibling"),
    ]);
    assert(sibling.status !== 0, "sibling proposal fails extend oracle");
    assert(fs.existsSync(path.join(siblingEval, "evaluation.json")), "failed extend oracle still writes evaluation");

    const goodEval = path.join(fixture, "eval-good");
    const good = run([
      "--mode", "evaluate",
      "--evidence-root", goodEval,
      "--baseline-root", baseline,
      "--candidate-root", candidate,
    ]);
    assert(good.status === 0, `valid extend evaluate exits 0: ${good.stderr}`);
    const first = fs.readFileSync(path.join(goodEval, "evaluation.json"));
    assert(!first.toString("utf8").includes(os.homedir()), "evaluation is privacy-safe");

    const replayEval = path.join(fixture, "eval-replay");
    const replay = run([
      "--mode", "evaluate",
      "--evidence-root", replayEval,
      "--baseline-root", baseline,
      "--candidate-root", candidate,
    ]);
    assert(replay.status === 0, "replay evaluate exits 0");
    const second = fs.readFileSync(path.join(replayEval, "evaluation.json"));
    assert(digest(first) === digest(second), "replayed evaluation digest matches");

    const exists = run([
      "--mode", "evaluate",
      "--evidence-root", goodEval,
      "--baseline-root", baseline,
      "--candidate-root", candidate,
    ]);
    assert(exists.status !== 0, "existing evidence root fails closed");
    assert(`${exists.stdout}\n${exists.stderr}`.includes("already exists"), "cleanup/create failure names the existing root");

    const ccoBaseline = path.join(fixture, "cco-baseline");
    const ccoCandidate = path.join(fixture, "cco-candidate");
    const ccoRed = path.join(fixture, "cco-red");
    writeCapabilityBundles(ccoBaseline);
    writeCapabilityBundles(ccoCandidate);
    writeCapabilityBundles(ccoRed, true);
    const baselineGapFile = path.join(ccoBaseline, "popular-contract-mismatch.bundle.json");
    const baselineGap = JSON.parse(fs.readFileSync(baselineGapFile, "utf8")) as Record<string, any>;
    baselineGap.facts.assistantText = observationText({
      ...expectedCapabilityCompositionReuseObservation("popular-contract-mismatch"),
      contractFit: "verified",
    });
    baselineGap.sideEffects.after[".serena/project.yml"] = "operator-metadata";
    fs.writeFileSync(baselineGapFile, `${JSON.stringify(baselineGap)}\n`);
    const ccoBaselineEvalRoot = path.join(fixture, "cco-baseline-eval");
    const ccoBaselineEval = run([
      "--mode", "evaluate",
      "--pack", "capability-composition",
      "--evidence-root", ccoBaselineEvalRoot,
      "--baseline-root", ccoBaseline,
    ]);
    assert(ccoBaselineEval.status === 0, `CCO baseline gap characterization exits 0: ${ccoBaselineEval.stderr}`);
    const ccoBaselineResult = JSON.parse(fs.readFileSync(path.join(ccoBaselineEvalRoot, "evaluation.json"), "utf8")) as Record<string, any>;
    const baselineGapRow = ccoBaselineResult.rows.find((row: Record<string, any>) => row.scenario === "popular-contract-mismatch");
    assert(ccoBaselineResult.baselineComplete === true && ccoBaselineResult.candidateComplete == null, "CCO baseline completeness is capture-only");
    assert(baselineGapRow.baseline.evaluation.pass === false, "CCO baseline preserves reviewed-observation gaps");
    assert(baselineGapRow.baseline.changedPaths.includes(".serena/project.yml") && baselineGapRow.baseline.productChanges.length === 0, "CCO baseline reports operator metadata without treating it as product mutation");
    const ccoEvalRoot = path.join(fixture, "cco-eval");
    const cco = run([
      "--mode", "evaluate",
      "--pack", "capability-composition",
      "--evidence-root", ccoEvalRoot,
      "--baseline-root", ccoBaseline,
      "--candidate-root", ccoCandidate,
    ]);
    assert(cco.status === 0, `CCO reuse evaluation exits 0: ${cco.stderr}`);
    const ccoReplayRoot = path.join(fixture, "cco-replay");
    const ccoReplay = run([
      "--mode", "evaluate",
      "--pack", "capability-composition",
      "--evidence-root", ccoReplayRoot,
      "--baseline-root", ccoBaseline,
      "--candidate-root", ccoCandidate,
    ]);
    assert(ccoReplay.status === 0, "CCO reuse replay exits 0");
    assert(digest(fs.readFileSync(path.join(ccoEvalRoot, "evaluation.json"))) === digest(fs.readFileSync(path.join(ccoReplayRoot, "evaluation.json"))), "CCO reuse replay digest matches");
    const ccoRedRoot = path.join(fixture, "cco-red-eval");
    const rejectedPopularity = run([
      "--mode", "evaluate",
      "--pack", "capability-composition",
      "--evidence-root", ccoRedRoot,
      "--baseline-root", ccoBaseline,
      "--candidate-root", ccoRed,
    ]);
    assert(rejectedPopularity.status !== 0, "CCO popularity-only candidate fails");
    assert(fs.existsSync(path.join(ccoRedRoot, "evaluation.json")), "CCO failed candidate preserves evaluation");
  } finally {
    fs.rmSync(fixture, { recursive: true, force: true });
    assert(!fs.existsSync(fixture), "test fixture cleanup removes the root");
  }

  process.stdout.write("OK: reuse-discovery tests=17\n");
}

main();
