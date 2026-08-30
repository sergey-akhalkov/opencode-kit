#!/usr/bin/env node
import { spawn, spawnSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import {
  WorkCampaignError,
  campaignDigest,
  parseWorkCampaignRecord,
} from "../global/bin/work-campaign/contracts.ts";
import { stableJson } from "../global/bin/roadmap-mission/contracts.ts";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const runner = "tools/proofs/work-campaign.ts";
const candidateId = "work-campaign-focused-test-r1";
let observedProcessStarts = 0;

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function invoke(args: string[]) {
  observedProcessStarts++;
  return spawnSync(process.execPath, [runner, ...args], {
    cwd: root,
    encoding: "utf8",
    timeout: 30_000,
  });
}

function digest(file: string): string {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

function applyMutation(value: Record<string, unknown>, operation: Record<string, unknown>): Record<string, unknown> {
  const result = structuredClone(value);
  if (operation.kind === "none") return result;
  const parts = operation.path as string[];
  let parent = result;
  for (const part of parts.slice(0, -1)) parent = parent[part] as Record<string, unknown>;
  const leaf = parts[parts.length - 1] ?? "";
  if (operation.kind === "delete") delete parent[leaf];
  else parent[leaf] = structuredClone(operation.value);
  return result;
}

function invokeProduction(projectRoot: string, operation: string, extra: string[] = []) {
  observedProcessStarts++;
  return spawnSync(process.execPath, [
    "global/bin/work-campaign.ts",
    operation,
    "--root", projectRoot,
    "--definition", "campaign.json",
    ...extra,
  ], { cwd: root, encoding: "utf8", timeout: 30_000 });
}

function parseProduction(result: ReturnType<typeof spawnSync>): Record<string, unknown> {
  return JSON.parse(result.stdout || result.stderr) as Record<string, unknown>;
}

async function waitFor(predicate: () => boolean, timeoutMs: number, message: string): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (predicate()) return;
    await new Promise((resolve) => setTimeout(resolve, 25));
  }
  throw new Error(message);
}

function killProofProcessTree(child: ReturnType<typeof spawn>): void {
  if (child.exitCode != null || child.signalCode != null || child.pid == null) return;
  if (process.platform === "win32") {
    spawnSync("taskkill", ["/PID", String(child.pid), "/T", "/F"], { shell: false, stdio: "ignore" });
  } else {
    child.kill("SIGKILL");
  }
}

const fixture = fs.mkdtempSync(path.join(os.tmpdir(), "work-campaign-test-"));
let capturedMaterializerRaw: Record<string, unknown> | null = null;
let capturedStateRaw: Record<string, unknown> | null = null;
try {
  const help = invoke(["--help"]);
  assert(help.status === 0, `help must exit 0: ${help.stderr}`);
  assert(help.stdout.includes("provider, source, OpenSpec, Git, process, host, and remote calls are zero"), "help must name replay effects");

  const preflightRoot = path.join(fixture, "preflight");
  const preflight = invoke([
    "--mode", "preflight",
    "--candidate-id", candidateId,
    "--evidence-root", preflightRoot,
  ]);
  assert(preflight.status === 0, `preflight must exit 0: ${preflight.stderr}`);
  const summary = JSON.parse(preflight.stdout) as { liveCalls: number; status: string };
  assert(summary.status === "complete" && summary.liveCalls === 0, "preflight summary must be provider-free and complete");

  const raw = JSON.parse(fs.readFileSync(path.join(preflightRoot, "raw.json"), "utf8")) as {
    cleanup: string;
    effects: { hostEffects: number; processStarts: number; providerCalls: number };
    projectManifest: { afterDigest: string; beforeDigest: string; sourceWrites: number };
    scenarios: Array<{ expected: { failedCheck: string | null; status: string }; failedChecks: string[]; id: string; status: string }>;
  };
  assert(raw.cleanup === "complete", "preflight fixture cleanup must be terminal");
  assert(raw.effects.providerCalls === 0 && raw.effects.processStarts === 0 && raw.effects.hostEffects === 0, "preflight effects must all be zero");
  assert(raw.projectManifest.beforeDigest === raw.projectManifest.afterDigest && raw.projectManifest.sourceWrites === 0, "preflight must not mutate fixture source");
  assert(raw.scenarios.length === 7, "preflight must retain the seven reviewed scenarios");
  assert(raw.scenarios.every((scenario) => scenario.status === scenario.expected.status), "each reviewed scenario must reach its expected status");
  assert(raw.scenarios.every((scenario) => scenario.expected.failedCheck == null || scenario.failedChecks.includes(scenario.expected.failedCheck)), "each negative scenario must expose its expected failed check");

  const replayA = path.join(fixture, "replay-a");
  const replayB = path.join(fixture, "replay-b");
  for (const evidenceRoot of [replayA, replayB]) {
    const replay = invoke([
      "--mode", "replay",
      "--candidate-id", candidateId,
      "--input-root", preflightRoot,
      "--evidence-root", evidenceRoot,
    ]);
    assert(replay.status === 0, `replay must exit 0: ${replay.stderr}`);
    const replaySummary = JSON.parse(replay.stdout) as { liveCalls: number; status: string };
    assert(replaySummary.status === "complete" && replaySummary.liveCalls === 0, "replay must be zero-call and complete");
  }
  const replayABytes = fs.readFileSync(path.join(replayA, "evaluation.json"));
  const replayBBytes = fs.readFileSync(path.join(replayB, "evaluation.json"));
  assert(replayABytes.equals(replayBBytes), "two replays must be byte-identical");
  assert(replayABytes.equals(fs.readFileSync(path.join(preflightRoot, "evaluation.json"))), "replay must reproduce the preflight evaluation exactly");

  const tamperedInput = path.join(fixture, "tampered-input");
  fs.mkdirSync(tamperedInput);
  const tamperedRaw = JSON.parse(fs.readFileSync(path.join(preflightRoot, "raw.json"), "utf8")) as Record<string, unknown>;
  (tamperedRaw.effects as Record<string, unknown>).providerCalls = 1;
  fs.writeFileSync(path.join(tamperedInput, "raw.json"), `${JSON.stringify(tamperedRaw, null, 2)}\n`, "utf8");
  fs.copyFileSync(path.join(preflightRoot, "evaluation.json"), path.join(tamperedInput, "evaluation.json"));
  const tamperedOutput = path.join(fixture, "tampered-output");
  const tampered = invoke([
    "--mode", "replay",
    "--candidate-id", candidateId,
    "--input-root", tamperedInput,
    "--evidence-root", tamperedOutput,
  ]);
  assert(tampered.status === 1, "tampered effect evidence must fail closed");
  const tamperedEvaluation = JSON.parse(fs.readFileSync(path.join(tamperedOutput, "evaluation.json"), "utf8")) as {
    checks: { providerCallsZero: boolean; sourceEvaluationCurrent: boolean };
    status: string;
  };
  assert(tamperedEvaluation.status === "blocked", "tampered replay must remain blocked");
  assert(!tamperedEvaluation.checks.providerCallsZero && !tamperedEvaluation.checks.sourceEvaluationCurrent, "tampered replay must identify both raw effect and preserved-evaluation drift");

  const contractFixtureRoot = path.join(root, "tools", "proofs", "fixtures", "consumer-outcome", "work-campaign-v1");
  const baseDefinition = JSON.parse(fs.readFileSync(path.join(contractFixtureRoot, "definition.valid.json"), "utf8")) as Record<string, unknown>;
  const baseAdapter = JSON.parse(fs.readFileSync(path.join(contractFixtureRoot, "adapter.valid.json"), "utf8")) as Record<string, unknown>;
  const contractPack = JSON.parse(fs.readFileSync(path.join(contractFixtureRoot, "contract-cases.json"), "utf8")) as {
    cases: Array<{
      expectedExit: number;
      expectedField: string | null;
      id: string;
      operation: Record<string, unknown>;
      target: "adapter" | "definition";
    }>;
    schemaVersion: number;
  };
  assert(contractPack.schemaVersion === 1 && contractPack.cases.length === 10, "contract pack must retain ten reviewed cases");
  for (const item of contractPack.cases) {
    const project = path.join(fixture, `contract-${item.id}`);
    fs.mkdirSync(project);
    const definition = item.target === "definition" ? applyMutation(baseDefinition, item.operation) : structuredClone(baseDefinition);
    const adapter = item.target === "adapter" ? applyMutation(baseAdapter, item.operation) : structuredClone(baseAdapter);
    const definitionFile = path.join(project, "campaign.json");
    const adapterFile = path.join(project, "adapter.valid.json");
    fs.writeFileSync(definitionFile, `${JSON.stringify(definition, null, 2)}\n`, "utf8");
    fs.writeFileSync(adapterFile, `${JSON.stringify(adapter, null, 2)}\n`, "utf8");
    const before = [digest(definitionFile), digest(adapterFile)];
    observedProcessStarts++;
    const result = spawnSync(process.execPath, [
      "global/bin/work-campaign.ts",
      "contract-preflight",
      "--root", project,
      "--definition", "campaign.json",
    ], { cwd: root, encoding: "utf8", timeout: 30_000 });
    assert(result.status === item.expectedExit, `${item.id} exit=${result.status}: ${result.stderr}`);
    const output = JSON.parse(item.expectedExit === 0 ? result.stdout : result.stderr) as { field?: string | null; phase?: string; status: string };
    assert(output.status === (item.expectedExit === 0 ? "contract-valid" : "blocked"), `${item.id} status must match expectation`);
    if (item.expectedField != null) assert(output.field === item.expectedField, `${item.id} field=${String(output.field)} expected=${item.expectedField}`);
    if (item.expectedExit === 0) assert(output.phase === "inventory", "valid production preflight must select inventory phase");
    assert(JSON.stringify(before) === JSON.stringify([digest(definitionFile), digest(adapterFile)]), `${item.id} must not mutate input files`);
  }

  const malformedProject = path.join(fixture, "contract-malformed-json");
  fs.mkdirSync(malformedProject);
  fs.writeFileSync(path.join(malformedProject, "campaign.json"), "{ invalid\n", "utf8");
  observedProcessStarts++;
  const malformed = spawnSync(process.execPath, [
    "global/bin/work-campaign.ts",
    "contract-preflight",
    "--root", malformedProject,
    "--definition", "campaign.json",
  ], { cwd: root, encoding: "utf8", timeout: 30_000 });
  assert(malformed.status === 2, "malformed JSON must fail with schema/input exit 2");
  const malformedOutput = JSON.parse(malformed.stderr) as { cause: string | null; field: string | null; status: string };
  assert(malformedOutput.status === "blocked" && malformedOutput.field === "definitionPath", "malformed JSON must identify definitionPath");
  assert(typeof malformedOutput.cause === "string" && malformedOutput.cause.length > 0, "malformed JSON must preserve its parse cause");

  const overlappingProject = path.join(fixture, "contract-overlapping-paths");
  fs.mkdirSync(overlappingProject);
  const overlappingDefinition = structuredClone(baseDefinition);
  overlappingDefinition.reportPath = `${String(overlappingDefinition.statePath)}/report.md`;
  fs.writeFileSync(path.join(overlappingProject, "campaign.json"), `${JSON.stringify(overlappingDefinition, null, 2)}\n`, "utf8");
  fs.writeFileSync(path.join(overlappingProject, "adapter.valid.json"), `${JSON.stringify(baseAdapter, null, 2)}\n`, "utf8");
  const overlapping = invokeProduction(overlappingProject, "contract-preflight");
  assert(overlapping.status === 2 && parseProduction(overlapping).field === "paths", "overlapping campaign owners must fail before any effect");

  const hash = "a".repeat(64);
  const recordCases: unknown[] = [
    {
      schemaVersion: 1,
      recordType: "inventory-block",
      id: "block-a",
      path: "src/a.ts",
      digest: hash,
      kind: "file",
      classification: "maintained",
      exclusionReason: null,
      reviewStatus: "pending",
    },
    {
      schemaVersion: 1,
      recordType: "partition-result",
      id: "partition-a",
      assignmentId: "assignment-a",
      candidateDigest: hash,
      inventoryDigest: hash,
      producerSessionRef: "session:partition-a",
      evidenceRefs: ["file:.work/evidence/partition-a.json"],
      blockIds: ["block-a"],
      status: "complete",
      workItemIds: ["item-a"],
    },
    {
      schemaVersion: 1,
      recordType: "work-item",
      id: "item-a",
      sourceBlockIds: ["block-a"],
      candidateDigest: hash,
      principleRef: "principle:first-do-no-harm",
      scenario: "A current local failure is reachable.",
      evidenceRefs: ["evidence:item-a"],
      impact: "The accepted outcome is blocked.",
      likelyCause: "unknown",
      proposedOutcome: "Restore the bounded behavior.",
      affectedPaths: ["src/a.ts"],
      ownedPaths: ["src/a.ts"],
      effectClasses: ["local-read", "local-write"],
      confidence: "medium",
      initialSeverity: "P1",
      producerSessionRef: "session:partition-a",
      status: "candidate",
    },
    {
      schemaVersion: 1,
      recordType: "reconciliation-result",
      id: "reconcile-a",
      workItemId: "item-a",
      candidateDigest: hash,
      sourceDigest: hash,
      producerSessionRef: "session:reconcile-a",
      evidenceRefs: ["evidence:reconcile-a"],
      disposition: "confirmed",
      severity: "P1",
    },
    {
      schemaVersion: 1,
      recordType: "investigation-result",
      id: "investigate-a",
      workItemId: "item-a",
      question: "Which local cause is current?",
      allowedObservations: ["read current source"],
      sourceBlockIds: ["block-a"],
      budgets: { modelCalls: 1, wallClockSeconds: 60 },
      producerSessionRef: "session:investigate-a",
      evidenceRefs: ["evidence:investigate-a"],
      result: "confirmed",
    },
    {
      schemaVersion: 1,
      recordType: "wave-manifest",
      id: "wave-a",
      campaignId: "fixture-campaign",
      definitionDigest: hash,
      candidateDigest: hash,
      workItemIds: ["item-a"],
      slices: [{
        id: "slice-a",
        changeId: "change-a",
        dependsOn: [],
        outcome: "Fix item a.",
        workItemIds: ["item-a"],
        ownedPaths: ["src/a.ts"],
        effectClasses: ["local-write"],
        expectedProof: "Run the local proof.",
        validationArgv: ["node", "validate.mjs"],
      }],
      missionDefinitionDigest: hash,
      status: "frozen",
    },
    {
      schemaVersion: 1,
      recordType: "closure-matrix",
      candidateDigest: hash,
      definitionDigest: hash,
      inventory: { total: 1, currentTerminal: 1, blocked: 0, needsRereview: 0 },
      workItems: { total: 1, resolved: 1, fixedAndVerified: 1, reportOnly: 0, unresolvedP0P1: 0, unknownMaterial: 0, ownerRequired: 0, productDecisionRequired: 0, waiting: 0 },
      waves: { total: 1, archived: 1, checkpointed: 1 },
      validationStatus: "complete",
      proofStatus: "complete",
      challengeStatus: "complete",
      ownershipStatus: "terminal",
      reportDigest: hash,
      terminalState: "complete",
    },
    {
      schemaVersion: 1,
      recordType: "campaign-result",
      tool: "work-campaign",
      operation: "preflight",
      campaignId: "fixture-campaign",
      definitionDigest: hash,
      disposition: "blocked",
      phase: "inventory",
      evidenceRefs: [],
      errorClass: "immutable-input",
      errorMessage: "Fixture control.",
      cleanup: "not-required",
      supervision: null,
      terminalHandoff: null,
      writerClosure: "terminal",
    },
    {
      schemaVersion: 1,
      recordType: "report-seed",
      candidateDigest: hash,
      definitionDigest: hash,
      blockers: [],
      limitations: [{ id: "limit-a", summary: "The fixture is provider-free.", evidenceRefs: ["evidence:limit-a"] }],
      matrixRows: [{ id: "matrix-a", kind: "failure-mode", status: "resolved", summary: "A reviewed failure mode.", blockIds: ["block-a"], workItemIds: ["item-a"], evidenceRefs: ["evidence:matrix-a"] }],
      validationRows: [{ id: "validation-a", kind: "validation", status: "complete", argv: ["node", "validate.mjs"], summary: "Validation completed.", evidenceRefs: ["evidence:validation-a"] }],
      waveRows: [{ id: "wave-result-a", waveId: "wave-a", status: "complete", archiveRefs: ["archive:change-a"], checkpointRef: "checkpoint:change-a", summary: "Wave completed.", evidenceRefs: ["evidence:wave-a"] }],
      validationStatus: "complete",
      proofStatus: "complete",
      challengeStatus: "complete",
      ownershipStatus: "terminal",
      terminalState: "complete",
      maximumClaim: "The reviewed fixture records are current.",
    },
  ];
  const parsedTypes = recordCases.map((record) => parseWorkCampaignRecord(record).recordType);
  assert(new Set(parsedTypes).size === 9, "all nine campaign record types must parse through the shared dispatcher");
  try {
    parseWorkCampaignRecord({ ...(recordCases[0] as Record<string, unknown>), unexpected: true });
    throw new Error("extra campaign record field unexpectedly passed");
  } catch (error) {
    assert(error instanceof WorkCampaignError && error.field === "inventory-block", "extra record field must fail with attributed campaign error");
  }
  const campaignResult = recordCases.find((record) => record.recordType === "campaign-result") as Record<string, unknown>;
  const completeClosure = recordCases.find((record) => record.recordType === "closure-matrix") as Record<string, unknown>;
  const terminalHandoff = {
    candidateDigest: hash,
    closure: completeClosure,
    definitionDigest: hash,
    evidenceRefs: ["report:terminal"],
    maximumClaim: "The complete fixture is bounded to one reviewed case.",
    reportDigest: hash,
    reportPath: ".work-campaign/report.md",
    schemaVersion: 1,
    terminalState: "complete",
  };
  const completeResult = { ...campaignResult, disposition: "complete", phase: "complete", terminalHandoff };
  assert(parseWorkCampaignRecord(completeResult).recordType === "campaign-result", "complete campaign result must parse with one correlated terminal handoff");
  for (const malformedResult of [
    { ...completeResult, terminalHandoff: null },
    { ...campaignResult, terminalHandoff },
    { ...completeResult, terminalHandoff: { ...terminalHandoff, unsupported: true } },
  ]) {
    try {
      parseWorkCampaignRecord(malformedResult);
      throw new Error("malformed terminal campaign result unexpectedly passed");
    } catch (error) {
      assert(error instanceof WorkCampaignError && error.field?.startsWith("terminalHandoff") === true, "terminal handoff mismatch must fail with attributed campaign error");
    }
  }

  const materializerProject = path.join(fixture, "materializer");
  const materializerRecords = path.join(materializerProject, "records");
  fs.mkdirSync(materializerRecords, { recursive: true });
  fs.mkdirSync(path.join(materializerProject, "src"));
  fs.writeFileSync(path.join(materializerProject, "campaign.json"), `${JSON.stringify(baseDefinition, null, 2)}\n`, "utf8");
  fs.writeFileSync(path.join(materializerProject, "adapter.valid.json"), `${JSON.stringify(baseAdapter, null, 2)}\n`, "utf8");
  fs.writeFileSync(path.join(materializerProject, "src", "a.ts"), "export const a = 1;\n", "utf8");
  fs.writeFileSync(path.join(materializerProject, "src", "b.ts"), "export const b = 2;\n", "utf8");
  const materializerInputs = ["campaign.json", "adapter.valid.json", "src/a.ts", "src/b.ts"];
  const materializerBeforeDigests = materializerInputs.map((relative) => digest(path.join(materializerProject, relative)));
  const materializerPreflight = invokeProduction(materializerProject, "contract-preflight");
  assert(materializerPreflight.status === 0, `materializer preflight must pass: ${materializerPreflight.stderr}`);
  const materializerDefinitionDigest = parseProduction(materializerPreflight).definitionDigest as string;
  const materializerCandidateDigest = "b".repeat(64);
  const materializerCommands: Array<[string, ReturnType<typeof spawnSync>]> = [["preflight", materializerPreflight]];

  function appendMaterializerSeed(name: string, record: Record<string, unknown>): ReturnType<typeof spawnSync> {
    const relative = `records/${name}.json`;
    fs.writeFileSync(path.join(materializerProject, relative), `${JSON.stringify(record, null, 2)}\n`, "utf8");
    const result = invokeProduction(materializerProject, "ledger-append", ["--record", relative]);
    materializerCommands.push([`append-${name}`, result]);
    assert(result.status === 0, `${name} seed append must pass: ${result.stderr}`);
    return result;
  }

  const blockA = {
    schemaVersion: 1,
    recordType: "inventory-block",
    id: "block-a",
    path: "src/a.ts",
    digest: digest(path.join(materializerProject, "src", "a.ts")),
    kind: "file",
    classification: "maintained",
    exclusionReason: null,
    reviewStatus: "reviewed-with-finding",
  };
  const blockB = {
    schemaVersion: 1,
    recordType: "inventory-block",
    id: "block-b",
    path: "src/b.ts",
    digest: digest(path.join(materializerProject, "src", "b.ts")),
    kind: "file",
    classification: "maintained",
    exclusionReason: null,
    reviewStatus: "reviewed-with-finding",
  };
  const itemP1 = {
    schemaVersion: 1,
    recordType: "work-item",
    id: "item-p1",
    sourceBlockIds: ["block-a"],
    candidateDigest: materializerCandidateDigest,
    principleRef: "principle:fast-feedback",
    scenario: "The current local behavior fails at the reviewed boundary.",
    evidenceRefs: ["evidence:item-p1"],
    impact: "The accepted material outcome is blocked.",
    likelyCause: "The current implementation omits one required branch.",
    proposedOutcome: "Restore the bounded required behavior.",
    affectedPaths: ["src/a.ts"],
    ownedPaths: ["src/a.ts"],
    effectClasses: ["local-read", "local-write"],
    confidence: "high",
    initialSeverity: "P1",
    producerSessionRef: "session:discovery-p1",
    status: "confirmed",
  };
  const itemP2 = {
    schemaVersion: 1,
    recordType: "work-item",
    id: "item-p2",
    sourceBlockIds: ["block-b"],
    candidateDigest: materializerCandidateDigest,
    principleRef: "principle:yagni",
    scenario: "A naming improvement is useful but does not block current behavior.",
    evidenceRefs: ["evidence:item-p2"],
    impact: "The current accepted outcome remains correct.",
    likelyCause: "The name predates the current convention.",
    proposedOutcome: "Retain the observation as report-only.",
    affectedPaths: ["src/b.ts"],
    ownedPaths: ["src/b.ts"],
    effectClasses: ["local-read"],
    confidence: "high",
    initialSeverity: "P2",
    producerSessionRef: "session:discovery-p2",
    status: "report-only",
  };
  const reconciliationP1 = {
    schemaVersion: 1,
    recordType: "reconciliation-result",
    id: "reconcile-p1",
    workItemId: "item-p1",
    candidateDigest: materializerCandidateDigest,
    sourceDigest: blockA.digest,
    producerSessionRef: "session:reconcile-p1",
    evidenceRefs: ["evidence:reconcile-p1"],
    disposition: "confirmed",
    severity: "P1",
  };
  const reconciliationP2 = {
    schemaVersion: 1,
    recordType: "reconciliation-result",
    id: "reconcile-p2",
    workItemId: "item-p2",
    candidateDigest: materializerCandidateDigest,
    sourceDigest: blockB.digest,
    producerSessionRef: "session:reconcile-p2",
    evidenceRefs: ["evidence:reconcile-p2"],
    disposition: "confirmed",
    severity: "P2",
  };
  const wave = {
    schemaVersion: 1,
    recordType: "wave-manifest",
    id: "wave-1",
    campaignId: "fixture-campaign",
    definitionDigest: materializerDefinitionDigest,
    candidateDigest: materializerCandidateDigest,
    workItemIds: ["item-p1"],
    slices: [{
      id: "slice-p1",
      changeId: "change-p1",
      dependsOn: [],
      outcome: "Fix the confirmed P1.",
      workItemIds: ["item-p1"],
      ownedPaths: ["src/a.ts"],
      effectClasses: ["local-write"],
      expectedProof: "Run the disposable local proof.",
      validationArgv: ["node", "validate.mjs"],
    }],
    missionDefinitionDigest: "c".repeat(64),
    status: "frozen",
  };
  const reportSeed = {
    schemaVersion: 1,
    recordType: "report-seed",
    candidateDigest: materializerCandidateDigest,
    definitionDigest: materializerDefinitionDigest,
    blockers: [],
    limitations: [{ id: "provider-free", summary: "The fixture does not exercise configured inference or host recovery.", evidenceRefs: ["evidence:provider-free"] }],
    matrixRows: [
      { id: "redundancy-a", kind: "redundancy", status: "report-only", summary: "One reviewed duplication remains non-material.", blockIds: ["block-b"], workItemIds: ["item-p2"], evidenceRefs: ["evidence:redundancy-a"] },
      { id: "test-gap-a", kind: "test-gap", status: "resolved", summary: "The focused regression covers the changed branch.", blockIds: ["block-a"], workItemIds: ["item-p1"], evidenceRefs: ["evidence:test-gap-a"] },
      { id: "failure-mode-a", kind: "failure-mode", status: "resolved", summary: "Report drift is rejected against current ledger bytes.", blockIds: ["block-a"], workItemIds: ["item-p1"], evidenceRefs: ["evidence:failure-mode-a"] },
    ],
    validationRows: [
      { id: "focused-validation", kind: "validation", status: "complete", argv: ["node", "validate.mjs"], summary: "Focused validation completed for the reviewed fixture.", evidenceRefs: ["evidence:focused-validation"] },
      { id: "real-boundary-proof", kind: "proof", status: "complete", argv: ["node", "proof.mjs"], summary: "The production materializer boundary completed in the disposable fixture.", evidenceRefs: ["evidence:real-boundary-proof"] },
    ],
    waveRows: [{ id: "wave-result-1", waveId: "wave-1", status: "complete", archiveRefs: ["archive:change-p1"], checkpointRef: "checkpoint:change-p1", summary: "The seeded wave is represented as completed evidence for report projection.", evidenceRefs: ["evidence:wave-result-1"] }],
    validationStatus: "complete",
    proofStatus: "complete",
    challengeStatus: "unknown",
    ownershipStatus: "terminal",
    terminalState: "unknown",
    maximumClaim: "The reviewed provider-free fixture materializes and reads back current explicit campaign records.",
  };
  for (const [name, record] of [
    ["block-a", blockA],
    ["block-b", blockB],
    ["item-p1", itemP1],
    ["item-p2", itemP2],
    ["reconcile-p1", reconciliationP1],
    ["reconcile-p2", reconciliationP2],
    ["wave-1", wave],
    ["report-seed", reportSeed],
  ] as const) appendMaterializerSeed(name, record);

  const firstMaterialization = invokeProduction(materializerProject, "report-materialize");
  materializerCommands.push(["materialize-initial", firstMaterialization]);
  assert(firstMaterialization.status === 0, `initial report materialization must pass: ${firstMaterialization.stderr}`);
  const firstProjection = parseProduction(firstMaterialization) as { closure: { workItems: Record<string, number> }; reportDigest: string; seedEntries: number; status: string };
  assert(firstProjection.status === "report-materialized" && firstProjection.seedEntries === 8, "initial materialization must index all eight current seeds");
  assert(firstProjection.closure.workItems.unresolvedP0P1 === 1 && firstProjection.closure.workItems.reportOnly === 1, "initial closure must retain one unresolved P1 and one report-only P2");
  const initialReadback = invokeProduction(materializerProject, "report-readback");
  materializerCommands.push(["readback-initial", initialReadback]);
  assert(initialReadback.status === 0 && parseProduction(initialReadback).reportDigest === firstProjection.reportDigest, "initial report readback must match the current ledger");
  const identicalMaterialization = invokeProduction(materializerProject, "report-materialize");
  materializerCommands.push(["materialize-identical", identicalMaterialization]);
  assert(identicalMaterialization.status === 0 && parseProduction(identicalMaterialization).reportDigest === firstProjection.reportDigest, "unchanged regeneration must be digest-identical");

  const fixedP1 = { ...itemP1, status: "fixed-and-verified", evidenceRefs: ["evidence:item-p1", "evidence:item-p1-fixed"] };
  const fixedAppend = appendMaterializerSeed("item-p1-fixed", fixedP1);
  assert(parseProduction(fixedAppend).status === "seed-appended", "changed P1 seed must append a new ledger entry");
  const duplicateFixed = invokeProduction(materializerProject, "ledger-append", ["--record", "records/item-p1-fixed.json"]);
  materializerCommands.push(["append-item-p1-fixed-duplicate", duplicateFixed]);
  assert(duplicateFixed.status === 0 && parseProduction(duplicateFixed).status === "seed-current", "exact current seed append must be idempotent");
  const fixedMaterialization = invokeProduction(materializerProject, "report-materialize");
  materializerCommands.push(["materialize-fixed", fixedMaterialization]);
  assert(fixedMaterialization.status === 0, `fixed report materialization must pass: ${fixedMaterialization.stderr}`);
  const fixedProjection = parseProduction(fixedMaterialization) as { closure: { workItems: Record<string, number> }; reportDigest: string; seedEntries: number };
  assert(fixedProjection.seedEntries === 9 && fixedProjection.closure.workItems.fixedAndVerified === 1 && fixedProjection.closure.workItems.unresolvedP0P1 === 0, "fixed P1 must update every closure total without a duplicate seed");
  const reportFile = path.join(materializerProject, ".work-campaign", "report.md");
  const fixedReport = fs.readFileSync(reportFile, "utf8");
  assert(fixedReport.includes("| `item-p1` | P1 | fixed-and-verified |"), "report must show the current fixed P1 disposition");
  assert(fixedReport.includes("| `item-p2` | P2 | report-only |"), "report regeneration must retain the P2 row");
  assert(!fixedReport.includes("| `item-p1` | P1 | confirmed |"), "report regeneration must remove the stale unresolved P1 row");
  const fixedReadback = invokeProduction(materializerProject, "report-readback");
  materializerCommands.push(["readback-fixed", fixedReadback]);
  assert(fixedReadback.status === 0 && parseProduction(fixedReadback).reportDigest === fixedProjection.reportDigest, "fixed report readback must match current seeds");

  fs.appendFileSync(reportFile, "\nmanual drift\n", "utf8");
  const driftedReadback = invokeProduction(materializerProject, "report-readback");
  materializerCommands.push(["readback-drifted", driftedReadback]);
  assert(driftedReadback.status === 2 && parseProduction(driftedReadback).field === "reportPath", "manual Markdown drift must fail readback without changing ledger state");
  const repairedMaterialization = invokeProduction(materializerProject, "report-materialize");
  materializerCommands.push(["materialize-repaired", repairedMaterialization]);
  assert(repairedMaterialization.status === 0 && parseProduction(repairedMaterialization).reportDigest === fixedProjection.reportDigest, "regeneration must restore the exact current report digest");
  const repairedReadback = invokeProduction(materializerProject, "report-readback");
  materializerCommands.push(["readback-repaired", repairedReadback]);
  assert(repairedReadback.status === 0, "repaired report must read back current");

  const corruptMaterializerProject = path.join(fixture, "materializer-corrupt-ledger");
  fs.cpSync(materializerProject, corruptMaterializerProject, { recursive: true });
  const corruptLedgerRoot = path.join(corruptMaterializerProject, ".work-campaign", "evidence", "ledger", "entries");
  const firstLedgerFile = path.join(corruptLedgerRoot, fs.readdirSync(corruptLedgerRoot).sort()[0]);
  const corruptLedgerEntry = JSON.parse(fs.readFileSync(firstLedgerFile, "utf8")) as Record<string, unknown>;
  corruptLedgerEntry.recordDigest = "d".repeat(64);
  fs.writeFileSync(firstLedgerFile, `${JSON.stringify(corruptLedgerEntry, null, 2)}\n`, "utf8");
  const corruptLedger = invokeProduction(corruptMaterializerProject, "report-materialize");
  materializerCommands.push(["materialize-corrupt-ledger", corruptLedger]);
  assert(corruptLedger.status === 2 && corruptLedger.stderr.includes("record digest differs"), "corrupt ledger seed must block regeneration");

  const materializerAfterDigests = materializerInputs.map((relative) => digest(path.join(materializerProject, relative)));
  assert(JSON.stringify(materializerBeforeDigests) === JSON.stringify(materializerAfterDigests), "materializer operations must leave definition, adapter, and source bytes unchanged");
  capturedMaterializerRaw = {
    candidateId: process.env.WORK_CAMPAIGN_MATERIALIZER_CANDIDATE_ID ?? "work-campaign-materializer-focused",
    cleanup: "pending",
    commands: materializerCommands.map(([name, result]) => ({
      exitCode: result.status,
      field: parseProduction(result).field ?? null,
      name,
      operation: parseProduction(result).operation ?? "unknown",
      reportDigest: parseProduction(result).reportDigest ?? null,
      seedEntries: parseProduction(result).seedEntries ?? null,
      sequence: parseProduction(result).sequence ?? null,
      status: parseProduction(result).status,
    })),
    effects: { gitCalls: 0, hostEffects: 0, openSpecCalls: 0, processStarts: observedProcessStarts, providerCalls: 0, sourceWrites: 0 },
    environment: { node: process.version, platform: process.platform },
    negativeControls: { corruptLedger: corruptLedger.status, reportDrift: driftedReadback.status },
    proofKind: "campaign-ledger-report-materializer",
    regeneration: {
      fixedAndVerified: fixedProjection.closure.workItems.fixedAndVerified,
      fixedDigest: fixedProjection.reportDigest,
      initialDigest: firstProjection.reportDigest,
      p2Retained: fixedReport.includes("| `item-p2` | P2 | report-only |"),
      repairedDigest: parseProduction(repairedMaterialization).reportDigest,
      staleP1Removed: !fixedReport.includes("| `item-p1` | P1 | confirmed |"),
      unchangedDigest: parseProduction(identicalMaterialization).reportDigest,
      unresolvedP0P1: fixedProjection.closure.workItems.unresolvedP0P1,
    },
    schemaVersion: 1,
    sourceCandidate: [
      "global/bin/work-campaign.ts",
      "global/bin/work-campaign/contracts.ts",
      "global/bin/work-campaign/materializer.ts",
      "tools/proofs/work-campaign.ts",
      "tools/test-work-campaign.ts",
    ].map((relative) => ({ path: relative, sha256: digest(path.join(root, relative)) })),
    sourceManifest: { afterDigests: materializerAfterDigests, beforeDigests: materializerBeforeDigests, sourceWrites: 0 },
  };

  if (process.env.WORK_CAMPAIGN_MATERIALIZER_RAW_PATH == null) {
  const stateProject = path.join(fixture, "state-restart");
  fs.mkdirSync(path.join(stateProject, "events"), { recursive: true });
  fs.mkdirSync(path.join(stateProject, "src"));
  fs.writeFileSync(path.join(stateProject, "campaign.json"), `${JSON.stringify(baseDefinition, null, 2)}\n`, "utf8");
  fs.writeFileSync(path.join(stateProject, "adapter.valid.json"), `${JSON.stringify(baseAdapter, null, 2)}\n`, "utf8");
  fs.writeFileSync(path.join(stateProject, "src", "input.txt"), "source bytes must remain unchanged\n", "utf8");

  const stateInputs = ["campaign.json", "adapter.valid.json", "src/input.txt"];
  const stateInputDigests = stateInputs.map((relative) => digest(path.join(stateProject, relative)));
  const limits = structuredClone(baseDefinition.budgets) as Record<string, number>;
  const consumed = { evidenceBytes: 0, modelCalls: 0, processAttempts: 0, wallClockSeconds: 0, waves: 0 };
  const executableDigest = digest(process.execPath);
  const identities = {
    kit: "candidate:work-campaign-state-r1",
    node: process.version,
    openCode: "not-used-provider-free",
    openSpec: "not-used-provider-free",
    repository: "repository:disposable-state-fixture",
  };
  const activeOperation = {
    kind: "inventory",
    process: {
      executableDigest,
      pid: process.pid,
      processRef: `process:state-test-${process.pid}`,
      startedAt: "2026-08-27T15:30:01.000Z",
      status: "active",
    },
    session: { sessionRef: "session:inventory-a", status: "active" },
    writer: { leaseRef: "lease:inventory-a", owner: "campaign", status: "active" },
  };

  function writeEvent(name: string, value: Record<string, unknown>): string {
    const relative = `events/${name}.json`;
    fs.writeFileSync(path.join(stateProject, relative), `${JSON.stringify(value, null, 2)}\n`, "utf8");
    return relative;
  }

  function event(input: {
    activeOperation?: Record<string, unknown> | null;
    budget?: Record<string, unknown>;
    createdAt: string;
    disposition: string;
    eventId: string;
    kind: string;
    phase: string;
    stopRequested?: boolean;
  }): Record<string, unknown> {
    return {
      activeOperation: input.activeOperation ?? null,
      budget: input.budget ?? { consumed, limits, revision: 0 },
      createdAt: input.createdAt,
      disposition: input.disposition,
      eventId: input.eventId,
      evidenceRefs: [`evidence:${input.eventId}`],
      identities,
      kind: input.kind,
      missionRef: null,
      phase: input.phase,
      schemaVersion: 1,
      stopRequested: input.stopRequested ?? false,
      waveId: null,
    };
  }

  const preflightEvent = writeEvent("preflight", event({
    createdAt: "2026-08-27T15:30:00.000Z",
    disposition: "ready",
    eventId: "preflight-a",
    kind: "preflight",
    phase: "inventory",
  }));
  const statePreflight = invokeProduction(stateProject, "state-record", ["--event", preflightEvent]);
  assert(statePreflight.status === 0 && parseProduction(statePreflight).sequence === 1, `state preflight must persist: ${statePreflight.stderr}`);
  const duplicatePreflight = invokeProduction(stateProject, "state-record", ["--event", preflightEvent]);
  assert(duplicatePreflight.status === 0 && parseProduction(duplicatePreflight).sequence === 1, "same eventId and facts must be idempotent");

  const phaseEvent = writeEvent("phase-start", event({
    activeOperation,
    budget: {
      consumed: { ...consumed, processAttempts: 1, wallClockSeconds: 1 },
      limits,
      revision: 0,
    },
    createdAt: "2026-08-27T15:30:01.000Z",
    disposition: "running",
    eventId: "inventory-start-a",
    kind: "phase-start",
    phase: "inventory",
  }));
  const phaseStart = invokeProduction(stateProject, "state-record", ["--event", phaseEvent]);
  assert(phaseStart.status === 0 && parseProduction(phaseStart).sequence === 2, `phase start must persist: ${phaseStart.stderr}`);
  const beforeKill = invokeProduction(stateProject, "state-replay");
  assert(beforeKill.status === 0 && parseProduction(beforeKill).sequence === 2, `pre-kill replay must be current: ${beforeKill.stderr}`);

  const contractsUrl = pathToFileURL(path.join(root, "global", "bin", "work-campaign", "contracts.ts")).href;
  const stateUrl = pathToFileURL(path.join(root, "global", "bin", "work-campaign", "state.ts")).href;
  const childScript = [
    'import crypto from "node:crypto";',
    'import fs from "node:fs";',
    `import { loadWorkCampaignDefinition } from ${JSON.stringify(contractsUrl)};`,
    `import { acquireCampaignWriterLease } from ${JSON.stringify(stateUrl)};`,
    `const project = ${JSON.stringify(stateProject)};`,
    'const definition = loadWorkCampaignDefinition(project, "campaign.json").definition;',
    'const executableDigest = crypto.createHash("sha256").update(fs.readFileSync(process.execPath)).digest("hex");',
    'acquireCampaignWriterLease(project, definition, { createdAt: "2026-08-27T15:30:02.000Z", executableDigest, pid: process.pid, processRef: `process:proof-child-${process.pid}` });',
    'setInterval(() => {}, 1_000);',
  ].join("\n");
  const leaseChild = spawn(process.execPath, ["--input-type=module", "--eval", childScript], {
    cwd: root,
    shell: false,
    stdio: ["ignore", "ignore", "pipe"],
  });
  const writerLock = path.join(stateProject, ".opencode-dev-kit", "runtime", "work-campaigns", "fixture-campaign", "writer.lock");
  let blockedWhileLive: ReturnType<typeof spawnSync> | null = null;
  try {
    await waitFor(() => fs.existsSync(writerLock), 5_000, "proof-owned campaign writer lease was not created");
    blockedWhileLive = invokeProduction(stateProject, "state-record", ["--event", phaseEvent]);
    assert(blockedWhileLive.status === 1 && parseProduction(blockedWhileLive).field === "writer.lock", "an existing writer lease must block append");
    killProofProcessTree(leaseChild);
    await waitFor(() => leaseChild.exitCode != null || leaseChild.signalCode != null, 5_000, "proof-owned lease process did not terminate");
  } finally {
    killProofProcessTree(leaseChild);
  }
  assert(blockedWhileLive != null, "proof-owned live-writer control was not captured");
  const leaseDigest = digest(writerLock);
  const lease = JSON.parse(fs.readFileSync(writerLock, "utf8")) as Record<string, unknown> & { definitionDigest: string; token: string };
  const blockedAfterKill = invokeProduction(stateProject, "state-replay");
  assert(blockedAfterKill.status === 1 && parseProduction(blockedAfterKill).writerStatus === "unknown", "dead PID alone must not clear campaign writer ownership");
  const attestationPath = "events/writer-terminal.json";
  const writerAttestation = {
    campaignId: "fixture-campaign",
    definitionDigest: lease.definitionDigest,
    evidenceRef: "evidence:proof-child-terminal",
    leaseToken: lease.token,
    observedAt: "2026-08-27T15:30:03.000Z",
    schemaVersion: 1,
    status: "terminal",
  };
  fs.writeFileSync(path.join(stateProject, attestationPath), `${JSON.stringify(writerAttestation, null, 2)}\n`, "utf8");
  const leaseArchiveRoot = path.join(stateProject, ".opencode-dev-kit", "runtime", "work-campaigns", "fixture-campaign", "leases");
  fs.mkdirSync(leaseArchiveRoot);
  const strandedArchive = path.join(leaseArchiveRoot, `terminal-${campaignDigest({ attestation: writerAttestation, lease }).slice(0, 16)}.json`);
  fs.writeFileSync(strandedArchive, stableJson({ attestation: writerAttestation, lease }), "utf8");
  const writerReconcile = invokeProduction(stateProject, "state-reconcile-writer", ["--attestation", attestationPath]);
  assert(writerReconcile.status === 0 && parseProduction(writerReconcile).status === "writer-reconciled", `terminal attestation must finish an archive-before-unlock retry: ${writerReconcile.stderr}`);
  const duplicateWriterReconcile = invokeProduction(stateProject, "state-reconcile-writer", ["--attestation", attestationPath]);
  assert(duplicateWriterReconcile.status === 0 && parseProduction(duplicateWriterReconcile).archivePath === parseProduction(writerReconcile).archivePath, "completed writer reconciliation must be idempotent");
  const afterKill = invokeProduction(stateProject, "state-replay");
  assert(afterKill.status === 0 && parseProduction(afterKill).stateDigest === parseProduction(beforeKill).stateDigest, "writer reconciliation must reconstruct the exact pre-kill cursor without consuming an event");

  const projectionFile = path.join(stateProject, ".opencode-dev-kit", "runtime", "work-campaigns", "fixture-campaign", "state.json");
  const staleProjection = JSON.parse(fs.readFileSync(projectionFile, "utf8")) as Record<string, unknown>;
  staleProjection.sequence = 999;
  fs.writeFileSync(projectionFile, `${JSON.stringify(staleProjection, null, 2)}\n`, "utf8");
  const staleReplay = invokeProduction(stateProject, "state-replay");
  assert(staleReplay.status === 1 && parseProduction(staleReplay).projectionStatus === "stale", "stale projection must block replay");

  const reconcileEvent = writeEvent("restart-reconciliation", event({
    activeOperation,
    budget: {
      consumed: { ...consumed, processAttempts: 1, wallClockSeconds: 1 },
      limits,
      revision: 0,
    },
    createdAt: "2026-08-27T15:30:04.000Z",
    disposition: "running",
    eventId: "restart-reconciliation-a",
    kind: "restart-reconciliation",
    phase: "inventory",
  }));
  const stateReconcile = invokeProduction(stateProject, "state-reconcile", ["--event", reconcileEvent]);
  assert(stateReconcile.status === 0 && parseProduction(stateReconcile).sequence === 3, `state reconciliation must rebuild and append: ${stateReconcile.stderr}`);
  const duplicateReconcile = invokeProduction(stateProject, "state-reconcile", ["--event", reconcileEvent]);
  assert(duplicateReconcile.status === 0 && parseProduction(duplicateReconcile).sequence === 3, "restart event must not be consumed twice");

  const pauseEvent = writeEvent("pause", event({
    budget: {
      consumed: { ...consumed, processAttempts: 2, wallClockSeconds: 2 },
      limits,
      revision: 0,
    },
    createdAt: "2026-08-27T15:30:05.000Z",
    disposition: "paused-external",
    eventId: "pause-a",
    kind: "pause",
    phase: "paused",
  }));
  const pause = invokeProduction(stateProject, "state-record", ["--event", pauseEvent]);
  assert(pause.status === 0 && parseProduction(pause).sequence === 4, `pause must persist: ${pause.stderr}`);

  const revisedLimits = { ...limits, waves: (limits.waves ?? 0) + 1 };
  const budgetEvent = writeEvent("budget-revision", event({
    budget: {
      consumed: { ...consumed, processAttempts: 2, wallClockSeconds: 2 },
      limits: revisedLimits,
      revision: 1,
    },
    createdAt: "2026-08-27T15:30:06.000Z",
    disposition: "paused-budget",
    eventId: "budget-revision-a",
    kind: "budget-revision",
    phase: "paused",
  }));
  const budgetRevision = invokeProduction(stateProject, "state-record", ["--event", budgetEvent]);
  assert(budgetRevision.status === 0 && parseProduction(budgetRevision).sequence === 5, `larger finite budget revision must persist: ${budgetRevision.stderr}`);
  const regressedBudgetEvent = writeEvent("budget-regression", event({
    budget: {
      consumed: { ...consumed, processAttempts: 1, wallClockSeconds: 1 },
      limits: revisedLimits,
      revision: 1,
    },
    createdAt: "2026-08-27T15:30:07.000Z",
    disposition: "paused-budget",
    eventId: "budget-regression-a",
    kind: "checkpoint",
    phase: "paused",
  }));
  const regressedBudget = invokeProduction(stateProject, "state-record", ["--event", regressedBudgetEvent]);
  assert(regressedBudget.status === 2 && parseProduction(regressedBudget).field === "budget.consumed", "budget consumption regression must fail closed");

  const stop = invokeProduction(stateProject, "state-stop", ["--source", "operator", "--evidence-ref", "evidence:operator-stop"]);
  assert(stop.status === 0 && parseProduction(stop).status === "stop-requested", `stop intent must persist: ${stop.stderr}`);
  const conflictingStop = invokeProduction(stateProject, "state-stop", ["--source", "supervisor", "--evidence-ref", "evidence:different-stop"]);
  assert(conflictingStop.status === 2, "different stop intent facts must not overwrite the first request");
  const terminalReplay = invokeProduction(stateProject, "state-replay");
  assert(terminalReplay.status === 0 && parseProduction(terminalReplay).stopIntent === "current" && parseProduction(terminalReplay).sequence === 5, "terminal replay must retain exact chain and stop intent");

  const transitionRoot = path.join(stateProject, ".opencode-dev-kit", "runtime", "work-campaigns", "fixture-campaign", "transitions");
  assert(fs.readdirSync(transitionRoot).length === 5, "idempotent retries and rejected events must not add transitions");

  const missingProject = path.join(fixture, "state-missing");
  fs.cpSync(stateProject, missingProject, { recursive: true });
  const missingTransitions = path.join(missingProject, ".opencode-dev-kit", "runtime", "work-campaigns", "fixture-campaign", "transitions");
  fs.rmSync(path.join(missingTransitions, fs.readdirSync(missingTransitions).sort()[1]));
  const missingReplay = invokeProduction(missingProject, "state-replay");
  assert(missingReplay.status === 2 && missingReplay.stderr.includes("not contiguous"), "missing transition must fail chain reconstruction");

  const corruptProject = path.join(fixture, "state-corrupt");
  fs.cpSync(stateProject, corruptProject, { recursive: true });
  const corruptTransitions = path.join(corruptProject, ".opencode-dev-kit", "runtime", "work-campaigns", "fixture-campaign", "transitions");
  const corruptFile = path.join(corruptTransitions, fs.readdirSync(corruptTransitions).sort()[4]);
  const corruptRecord = JSON.parse(fs.readFileSync(corruptFile, "utf8")) as Record<string, unknown>;
  corruptRecord.evidenceRefs = ["evidence:tampered"];
  fs.writeFileSync(corruptFile, `${JSON.stringify(corruptRecord, null, 2)}\n`, "utf8");
  const corruptReplay = invokeProduction(corruptProject, "state-replay");
  assert(corruptReplay.status === 2 && corruptReplay.stderr.includes("digest differs"), "corrupt transition must fail digest validation");

  const reorderedProject = path.join(fixture, "state-reordered");
  fs.cpSync(stateProject, reorderedProject, { recursive: true });
  const reorderedTransitions = path.join(reorderedProject, ".opencode-dev-kit", "runtime", "work-campaigns", "fixture-campaign", "transitions");
  const reorderedFiles = fs.readdirSync(reorderedTransitions).sort();
  const temporaryTransition = path.join(reorderedTransitions, "swap.tmp");
  fs.renameSync(path.join(reorderedTransitions, reorderedFiles[0]), temporaryTransition);
  fs.renameSync(path.join(reorderedTransitions, reorderedFiles[1]), path.join(reorderedTransitions, reorderedFiles[0]));
  fs.renameSync(temporaryTransition, path.join(reorderedTransitions, reorderedFiles[1]));
  const reorderedReplay = invokeProduction(reorderedProject, "state-replay");
  assert(reorderedReplay.status === 2 && reorderedReplay.stderr.includes("not contiguous"), "reordered transition must fail sequence validation");

  const staleDefinitionProject = path.join(fixture, "state-stale-definition");
  fs.cpSync(stateProject, staleDefinitionProject, { recursive: true });
  const staleDefinition = JSON.parse(fs.readFileSync(path.join(staleDefinitionProject, "campaign.json"), "utf8")) as Record<string, unknown>;
  staleDefinition.outcome = "A changed outcome creates a different campaign definition digest.";
  fs.writeFileSync(path.join(staleDefinitionProject, "campaign.json"), `${JSON.stringify(staleDefinition, null, 2)}\n`, "utf8");
  const staleDefinitionReplay = invokeProduction(staleDefinitionProject, "state-replay");
  assert(staleDefinitionReplay.status === 2 && staleDefinitionReplay.stderr.includes("identity differs"), "changed definition must fail transition identity validation");

  const finalStateInputDigests = stateInputs.map((relative) => digest(path.join(stateProject, relative)));
  assert(JSON.stringify(stateInputDigests) === JSON.stringify(finalStateInputDigests), "campaign state operations must leave definition, adapter, and source bytes unchanged");
  const stateCommands = [
    ["preflight", statePreflight],
    ["duplicate-preflight", duplicatePreflight],
    ["phase-start", phaseStart],
    ["before-kill-replay", beforeKill],
    ["blocked-live-writer", blockedWhileLive],
    ["blocked-dead-writer", blockedAfterKill],
    ["writer-reconcile", writerReconcile],
    ["duplicate-writer-reconcile", duplicateWriterReconcile],
    ["after-kill-replay", afterKill],
    ["stale-projection-replay", staleReplay],
    ["state-reconcile", stateReconcile],
    ["duplicate-reconcile", duplicateReconcile],
    ["pause", pause],
    ["budget-revision", budgetRevision],
    ["budget-regression", regressedBudget],
    ["stop", stop],
    ["conflicting-stop", conflictingStop],
    ["terminal-replay", terminalReplay],
    ["missing-transition", missingReplay],
    ["corrupt-transition", corruptReplay],
    ["reordered-transition", reorderedReplay],
    ["stale-definition", staleDefinitionReplay],
  ] as const;
  capturedStateRaw = {
    candidateId: process.env.WORK_CAMPAIGN_STATE_CANDIDATE_ID ?? "work-campaign-state-focused",
    cleanup: "pending",
    commands: stateCommands.map(([name, result]) => ({
      exitCode: result.status,
      field: parseProduction(result).field ?? null,
      name,
      operation: parseProduction(result).operation ?? "unknown",
      projectionStatus: parseProduction(result).projectionStatus ?? null,
      sequence: parseProduction(result).sequence ?? null,
      status: parseProduction(result).status,
      stopIntent: parseProduction(result).stopIntent ?? null,
      writerStatus: parseProduction(result).writerStatus ?? null,
    })),
    effects: {
      gitCalls: 0,
      hostEffects: 0,
      openSpecCalls: 0,
      processStarts: stateCommands.length + 1,
      providerCalls: 0,
      sourceWrites: 0,
    },
    environment: { node: process.version, platform: process.platform },
    negativeControls: {
      budgetRegression: regressedBudget.status,
      conflictingStop: conflictingStop.status,
      corruptTransition: corruptReplay.status,
      missingTransition: missingReplay.status,
      reorderedTransition: reorderedReplay.status,
      staleDefinition: staleDefinitionReplay.status,
      staleProjection: staleReplay.status,
    },
    proofKind: "campaign-state-restart",
    restart: {
      afterKillStateDigest: parseProduction(afterKill).stateDigest,
      beforeKillStateDigest: parseProduction(beforeKill).stateDigest,
      childExitCode: leaseChild.exitCode,
      childSignal: leaseChild.signalCode,
      deadWriterStatus: parseProduction(blockedAfterKill).writerStatus,
      leaseDigest,
      reconciledArchivePath: parseProduction(writerReconcile).archivePath,
      terminalSequence: parseProduction(terminalReplay).sequence,
      transitionFiles: fs.readdirSync(transitionRoot).sort().map((name) => ({ name, sha256: digest(path.join(transitionRoot, name)) })),
    },
    schemaVersion: 1,
    sourceCandidate: [
      "global/bin/work-campaign.ts",
      "global/bin/work-campaign/contracts.ts",
      "global/bin/work-campaign/materializer.ts",
      "global/bin/work-campaign/state.ts",
      "tools/test-work-campaign.ts",
    ].map((relative) => ({ path: relative, sha256: digest(path.join(root, relative)) })),
    sourceManifest: {
      afterDigests: finalStateInputDigests,
      beforeDigests: stateInputDigests,
      sourceWrites: 0,
    },
  };
  }
} finally {
  fs.rmSync(fixture, { recursive: true, force: true });
}

const materializerRawPath = process.env.WORK_CAMPAIGN_MATERIALIZER_RAW_PATH;
if (materializerRawPath != null) {
  if (capturedMaterializerRaw == null) throw new Error("campaign materializer raw evidence was not captured");
  capturedMaterializerRaw.cleanup = fs.existsSync(fixture) ? "unknown" : "complete";
  fs.writeFileSync(materializerRawPath, `${JSON.stringify(capturedMaterializerRaw, null, 2)}\n`, { encoding: "utf8", flag: "wx" });
}

const stateRawPath = process.env.WORK_CAMPAIGN_STATE_RAW_PATH;
if (stateRawPath != null) {
  if (capturedStateRaw == null) throw new Error("campaign state raw evidence was not captured");
  capturedStateRaw.cleanup = fs.existsSync(fixture) ? "unknown" : "complete";
  fs.writeFileSync(stateRawPath, `${JSON.stringify(capturedStateRaw, null, 2)}\n`, { encoding: "utf8", flag: "wx" });
}

process.stdout.write(process.env.WORK_CAMPAIGN_MATERIALIZER_RAW_PATH == null
  ? "OK: work-campaign proof-contract, materializer, and state-replay suites\n"
  : "OK: work-campaign proof-contract and materializer suites\n");
