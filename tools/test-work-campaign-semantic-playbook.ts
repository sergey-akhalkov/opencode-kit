#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { after, test } from "node:test";

import type {
  CampaignInventoryBlock,
  CampaignInvestigationResult,
  CampaignReconciliationResult,
  CampaignWaveManifest,
  CampaignWorkItem,
} from "../global/bin/work-campaign/contracts.ts";
import type { EffectClass } from "../global/bin/roadmap-mission/contracts.ts";
import type { SemanticAssignment, SemanticAssignmentResult } from "../global/bin/work-campaign/semantic-executor.ts";
import {
  runSemanticPlaybook,
  validateSemanticRetryJob,
  type SemanticPlaybookContext,
  type SemanticPlaybookFactory,
  type SemanticPlaybookJob,
} from "../global/bin/work-campaign/semantic-playbook.ts";
import { configuredMissionEnvironment, consumeConfiguredFirstMissionHandoff } from "./proofs/work-campaign-playbook.ts";
import { buildPopulationRows, classifyPopulationConfiguredInput } from "./proofs/work-campaign.ts";
import { operatorExtensionSurfaceMatches } from "./proofs/work-campaign-windows-installed.ts";

const digest = "a".repeat(64);
const definitionDigest = "b".repeat(64);
const inventoryDigest = "c".repeat(64);
const semanticRawPath = process.env.WORK_CAMPAIGN_SEMANTIC_RAW_PATH;
const semanticCandidateId = process.env.WORK_CAMPAIGN_SEMANTIC_CANDIDATE_ID ?? "work-campaign-semantic-focused";
const semanticEvidence: Record<string, unknown> = {};

test("configured proof consumes one injected first-mission handoff and validates its terminal shape", async () => {
  let calls = 0;
  const environment = { ...process.env, TASK_7_1_HOOK: "present" };
  const result = await consumeConfiguredFirstMissionHandoff(
    path.resolve("fixture-root"),
    definitionDigest,
    environment,
    (context) => {
      calls++;
      assert.equal(context.definitionDigest, definitionDigest);
      assert.equal(context.environment.TASK_7_1_HOOK, "present");
      return { disposition: "paused-external", exitCode: 3, phase: "verify" };
    },
  );
  assert.equal(calls, 1);
  assert.equal(result.phase, "verify");
  await assert.rejects(
    consumeConfiguredFirstMissionHandoff(path.resolve("fixture-root"), definitionDigest, environment, () => ({
      disposition: "paused-external",
      exitCode: 3,
      phase: "mission",
    })),
    /did not reach verification/u,
  );
});

test("configured mission environment preserves a Windows-style Path under one canonical key", () => {
  const environment = configuredMissionEnvironment({ Path: "C:\\tools;C:\\Windows" }, "C:\\mission-bin");
  assert.equal(environment.Path, undefined);
  assert.equal(environment.PATH, `C:\\mission-bin${path.delimiter}C:\\tools;C:\\Windows`);
});

test("population configured and installed-operator inputs remain identity-bound and branch-isolated", () => {
  const configured = {
    candidateId: "candidate-r1",
    checks: { candidateMatched: true, environmentMatched: true },
    environmentId: "environment-r1",
    proofKind: "campaign-configured-complete",
    status: "complete",
  };
  const operator = {
    ...configured,
    checks: { ...configured.checks, windowsSupervisorReentryObserved: true },
    hostEffects: 3,
    proofKind: "campaign-installed-operator",
  };
  assert.deepEqual(
    classifyPopulationConfiguredInput(configured, false, "candidate-r1", "environment-r1"),
    { configuredCurrent: true, windowsReentryObserved: false },
  );
  assert.deepEqual(
    classifyPopulationConfiguredInput(operator, true, "candidate-r1", "environment-r1"),
    { configuredCurrent: true, windowsReentryObserved: true },
  );
  assert.equal(classifyPopulationConfiguredInput(operator, false, "candidate-r1", "environment-r1").configuredCurrent, false);
  assert.equal(classifyPopulationConfiguredInput(configured, true, "candidate-r1", "environment-r1").configuredCurrent, false);
  assert.equal(classifyPopulationConfiguredInput(operator, true, "different-candidate", "environment-r1").configuredCurrent, false);
  assert.equal(classifyPopulationConfiguredInput(operator, true, "candidate-r1", "different-environment").configuredCurrent, false);
  assert.equal(classifyPopulationConfiguredInput({ ...operator, hostEffects: 0 }, true, "candidate-r1", "environment-r1").windowsReentryObserved, false);
});

test("confirmed P0 population support comes only from the critical closure oracle", () => {
  const semanticP1Only = {
    configured: {},
    controller: { verification: {} },
    semantic: { evidence: { happyPath: { statuses: [["item-p1", "confirmed"]] } } },
  };
  const unsupported = buildPopulationRows(semanticP1Only, "candidate-r1", "environment-r1")
    .find((row) => row.id === "confirmed-p0");
  assert.equal(unsupported?.observed, false);

  const supported = buildPopulationRows({
    ...semanticP1Only,
    controller: { verification: {
      criticalFinalDisposition: "paused-external",
      criticalRereviewDisposition: "paused-external",
      criticalSdetPending: true,
    } },
  }, "candidate-r1", "environment-r1").find((row) => row.id === "confirmed-p0");
  assert.equal(supported?.observed, true);
  assert.deepEqual(supported?.evidenceRefs, ["proof:controller"]);
  assert.deepEqual(supported?.scenarios, ["confirmed-p0", "critical-sdet-pending"]);
});

test("installed-operator preflight binds extension identities without conflating project config digests", () => {
  const preflight = { configDigest: "a".repeat(64), mcpIds: ["mcp-a"], pluginIds: ["sha256:plugin-a"] };
  assert.equal(operatorExtensionSurfaceMatches(preflight, { ...preflight, configDigest: "b".repeat(64) }), true);
  assert.equal(operatorExtensionSurfaceMatches(preflight, { ...preflight, mcpIds: ["mcp-b"] }), false);
  assert.equal(operatorExtensionSurfaceMatches(preflight, { ...preflight, pluginIds: ["sha256:plugin-b"] }), false);
});

function block(id: string, sourceDigest: string): CampaignInventoryBlock {
  return {
    classification: "maintained",
    digest: sourceDigest,
    exclusionReason: null,
    id,
    kind: "file",
    path: `src/${id}.ts`,
    recordType: "inventory-block",
    reviewStatus: "pending",
    schemaVersion: 1,
  };
}

const context: SemanticPlaybookContext = {
  allowedEffects: ["local-read", "local-write"],
  blocks: [block("block-a", "d".repeat(64)), block("block-b", "e".repeat(64))],
  campaignId: "fixture-campaign",
  candidateDigest: digest,
  definitionDigest,
  inventoryDigest,
  modelCallBudget: 10,
};

function assignment(assignmentId: string, assignmentType: SemanticAssignment["assignmentType"], sourceBlockIds: string[]): SemanticAssignment {
  return {
    assignmentId,
    assignmentType,
    budgets: { modelCalls: 1, outputBytes: 16_384, wallClockSeconds: 60 },
    campaignId: context.campaignId,
    candidateDigest: context.candidateDigest,
    definitionDigest: context.definitionDigest,
    evidenceRefs: [`assignment:${assignmentId}`],
    phase: assignmentType === "discovery" ? "discover" : assignmentType === "synthesis" ? "synthesize" : "reconcile",
    request: `Perform the exact reviewed ${assignmentType} assignment ${assignmentId}.`,
    schemaVersion: 1,
    sourceBlockIds,
  };
}

function job(id: string, type: SemanticAssignment["assignmentType"], blocks: string[]): SemanticPlaybookJob {
  return { assignment: assignment(id, type, blocks), resultPath: `evidence/${id}.json` };
}

function workItem(
  id: string,
  producerSessionRef: string,
  sourceBlockIds: string[],
  severity: "P1" | "P3",
  effectClasses: EffectClass[] = ["local-write"],
): CampaignWorkItem {
  return {
    affectedPaths: sourceBlockIds.map((blockId) => `src/${blockId}.ts`),
    candidateDigest: digest,
    confidence: "high",
    effectClasses,
    evidenceRefs: [`evidence:${id}`],
    id,
    impact: severity === "P1" ? "A current accepted behavior is materially blocked." : "Current behavior remains correct.",
    initialSeverity: severity,
    likelyCause: severity === "P1" ? "A current reviewed branch is absent." : "An optional name could be clearer.",
    ownedPaths: sourceBlockIds.map((blockId) => `src/${blockId}.ts`),
    principleRef: severity === "P1" ? "principle:fast-feedback" : "principle:yagni",
    producerSessionRef,
    proposedOutcome: severity === "P1" ? "Restore the bounded branch." : "Retain as report-only.",
    recordType: "work-item",
    scenario: severity === "P1" ? "The reviewed boundary fails now." : "Only optional polish is available.",
    schemaVersion: 1,
    sourceBlockIds,
    status: "candidate",
  };
}

function factory(): SemanticPlaybookFactory {
  return {
    discovery: () => [job("discover-a", "discovery", ["block-a"]), job("discover-b", "discovery", ["block-b"])],
    reconciliation: (_context, item) => job(`reconcile-${item.id}`, "reconciliation", item.sourceBlockIds),
    investigation: (_context, item) => ({
      assignment: {
        ...assignment(`investigate-${item.id}`, "investigation", item.sourceBlockIds),
        request: `Determine whether current source confirms or falsifies the exact branch omission for ${item.id}; read only the assigned blocks.`,
      },
      resultPath: `evidence/investigate-${item.id}.json`,
    }),
    synthesis: (_context, items) => job(
      "synthesize-wave",
      "synthesis",
      [...new Set(items.filter((item) => item.status === "confirmed").flatMap((item) => item.sourceBlockIds))].sort(),
    ),
  };
}

function completeResult(assignment: SemanticAssignment, sessionRef: string, payload: SemanticAssignmentResult["payload"]): SemanticAssignmentResult {
  return {
    assignmentDigest: "f".repeat(64),
    assignmentId: assignment.assignmentId,
    assignmentType: assignment.assignmentType,
    campaignId: assignment.campaignId,
    candidateDigest: assignment.candidateDigest,
    cleanup: "complete",
    definitionDigest: assignment.definitionDigest,
    environment: { node: process.version, platform: process.platform },
    errorClass: "none",
    errorMessage: null,
    evidenceRefs: assignment.evidenceRefs,
    model: { agent: "fixture", modelID: "fixture-model", providerID: "fixture-provider", variant: null },
    modelCalls: 1,
    outputBytes: 1,
    outputDigest: "1".repeat(64),
    payload,
    phase: assignment.phase,
    resultType: "semantic-assignment-result",
    runtimeRef: "2".repeat(64),
    schemaVersion: 1,
    sessionRef,
    status: "complete",
    toolCalls: [],
    verification: { children: 0, fileDiffs: 0, parentless: true, permissionRequests: 0, questions: 0 },
  };
}

function fixtureExecutor(options: {
  includeP1?: boolean;
  includeP3?: boolean;
  includeUnknown?: boolean;
  investigationResult?: CampaignInvestigationResult["result"];
  p1Disposition?: CampaignReconciliationResult["disposition"];
  unknownEffects?: EffectClass[];
} = {}) {
  const {
    includeP1 = true,
    includeP3 = true,
    includeUnknown = true,
    investigationResult = "confirmed",
    p1Disposition = "confirmed",
    unknownEffects = ["local-write"],
  } = options;
  let activeDiscovery = 0;
  let maximumDiscovery = 0;
  let activeSerialized = 0;
  let maximumSerialized = 0;
  let synthesisCalls = 0;
  const execute = async ({ assignment }: SemanticPlaybookJob): Promise<SemanticAssignmentResult> => {
    const session = `session:${assignment.assignmentId}`;
    if (assignment.assignmentType === "discovery") {
      activeDiscovery++;
      maximumDiscovery = Math.max(maximumDiscovery, activeDiscovery);
      await new Promise((resolve) => setTimeout(resolve, 20));
      activeDiscovery--;
      const items = assignment.assignmentId === "discover-a"
        ? includeP1 ? [workItem("item-p1", session, ["block-a"], "P1")] : []
        : [
          ...(includeP3 ? [workItem("item-p3", session, ["block-b"], "P3")] : []),
          ...(includeUnknown ? [workItem("item-unknown", session, ["block-b"], "P1", unknownEffects)] : []),
        ];
      return completeResult(assignment, session, {
        partition: {
          assignmentId: assignment.assignmentId,
          blockIds: assignment.sourceBlockIds,
          candidateDigest: digest,
          evidenceRefs: [`result:${assignment.assignmentId}`],
          id: `partition-${assignment.assignmentId}`,
          inventoryDigest,
          producerSessionRef: session,
          recordType: "partition-result",
          schemaVersion: 1,
          status: "complete",
          workItemIds: items.map((item) => item.id).sort(),
        },
        workItems: items,
      });
    }

    activeSerialized++;
    maximumSerialized = Math.max(maximumSerialized, activeSerialized);
    await new Promise((resolve) => setTimeout(resolve, 1));
    activeSerialized--;
    if (assignment.assignmentType === "reconciliation") {
      const itemId = assignment.assignmentId.replace("reconcile-", "");
      const reconciliation: CampaignReconciliationResult = {
        candidateDigest: digest,
        disposition: itemId === "item-unknown" ? "unknown" : itemId === "item-p1" ? p1Disposition : "confirmed",
        evidenceRefs: [`result:${assignment.assignmentId}`],
        id: assignment.assignmentId,
        producerSessionRef: session,
        recordType: "reconciliation-result",
        schemaVersion: 1,
        severity: itemId === "item-p3" ? "P3" : "P1",
        sourceDigest: itemId === "item-p1" ? context.blocks[0].digest : context.blocks[1].digest,
        workItemId: itemId,
      };
      return completeResult(assignment, session, { reconciliation });
    }
    if (assignment.assignmentType === "investigation") {
      const workItemId = assignment.assignmentId.replace("investigate-", "");
      const scoped = investigationResult === "product-decision-required" || investigationResult === "waiting";
      const evidenceRef = `result:${assignment.assignmentId}`;
      const resumeCondition = investigationResult === "product-decision-required"
        ? "Owner selects the accepted product behavior."
        : "The bounded technical prerequisite becomes available.";
      const investigation: CampaignInvestigationResult = {
        allowedObservations: ["read assigned current source"],
        blocker: scoped ? {
          affectedItemRefs: [workItemId],
          decisions: investigationResult === "product-decision-required" ? [{
            affectedItemRefs: [workItemId],
            decisionPoint: "Select the accepted fixture behavior.",
            evidenceRefs: [evidenceRef],
            id: `decision-${workItemId}`,
            optionInvariantItemRefs: [],
            questionRef: `question:${workItemId}`,
          }] : [],
          disposition: investigationResult,
          evidenceRefs: [evidenceRef],
          frontier: null,
          gates: [{
            affectedItemRefs: [workItemId],
            evidenceRefs: [evidenceRef],
            id: `${investigationResult === "product-decision-required" ? "decision" : "technical"}-${workItemId}`,
            kind: investigationResult === "product-decision-required" ? "product-decision" : "technical",
            resumeCondition,
          }],
          resumeCondition,
          rootSessionRef: session,
          source: "mission-preflight",
          waitKind: investigationResult === "waiting" ? "technical" : null,
        } : null,
        budgets: { modelCalls: 1, wallClockSeconds: 60 },
        evidenceRefs: [evidenceRef],
        id: assignment.assignmentId,
        producerSessionRef: session,
        question: "Does current source confirm or falsify the exact branch omission?",
        recordType: "investigation-result",
        result: investigationResult,
        schemaVersion: 1,
        sourceBlockIds: assignment.sourceBlockIds,
        workItemId,
      };
      return completeResult(assignment, session, { investigation });
    }
    synthesisCalls++;
    const includeP1Slice = assignment.sourceBlockIds.includes("block-a");
    const includeUnknownSlice = assignment.sourceBlockIds.includes("block-b");
    const workItemIds = [
      ...(includeP1Slice ? ["item-p1"] : []),
      ...(includeUnknownSlice ? ["item-unknown"] : []),
    ];
    const wave: CampaignWaveManifest = {
      campaignId: context.campaignId,
      candidateDigest: digest,
      definitionDigest,
      id: "wave-1",
      missionDefinitionDigest: "3".repeat(64),
      recordType: "wave-manifest",
      schemaVersion: 1,
      slices: [
        ...(includeP1Slice
          ? [{ changeId: "change-p1", dependsOn: [], effectClasses: ["local-write" as const], expectedProof: "Run proof A.", id: "slice-p1", outcome: "Fix P1.", ownedPaths: ["src/block-a.ts"], validationArgv: ["node", "proof-a.mjs"], workItemIds: ["item-p1"] }]
          : []),
        ...(includeUnknownSlice
          ? [{ changeId: "change-unknown", dependsOn: includeP1Slice ? ["slice-p1"] : [], effectClasses: ["local-write" as const], expectedProof: "Run proof B.", id: "slice-unknown", outcome: "Fix investigated P1.", ownedPaths: ["src/block-b.ts"], validationArgv: ["node", "proof-b.mjs"], workItemIds: ["item-unknown"] }]
          : []),
      ],
      status: "frozen",
      workItemIds,
    };
    return completeResult(assignment, session, { wave });
  };
  return {
    execute,
    observations: () => ({ maximumDiscovery, maximumSerialized, synthesisCalls }),
  };
}

test("semantic playbook fans out discovery, serializes integration, investigates unknowns, and excludes P2/P3", async () => {
  const fixture = fixtureExecutor();
  const result = await runSemanticPlaybook(context, factory(), fixture.execute);
  assert.equal(result.status, "complete");
  assert.deepEqual(result.workItems.map((item) => [item.id, item.status]), [
    ["item-p1", "confirmed"],
    ["item-p3", "report-only"],
    ["item-unknown", "confirmed"],
  ]);
  assert.deepEqual(result.wave?.workItemIds, ["item-p1", "item-unknown"]);
  assert.equal(result.investigations.length, 1);
  assert.deepEqual(fixture.observations(), { maximumDiscovery: 2, maximumSerialized: 1, synthesisCalls: 1 });
  semanticEvidence.happyPath = {
    assignments: result.assignments.length,
    statuses: result.workItems.map((item) => [item.id, item.status]),
    status: result.status,
    waveItems: result.wave?.workItemIds ?? [],
  };
});

test("still-unknown consumes one investigation and blocks synthesis without downgrade", async () => {
  const fixture = fixtureExecutor({ investigationResult: "still-unknown" });
  const result = await runSemanticPlaybook(context, factory(), fixture.execute);
  assert.equal(result.status, "blocked");
  assert.deepEqual(result.blockingWorkItemIds, ["item-unknown"]);
  assert.equal(result.workItems.find((item) => item.id === "item-unknown")?.status, "unknown-material");
  assert.equal(result.investigations.length, 1);
  assert.equal(fixture.observations().synthesisCalls, 0);
  semanticEvidence.stillUnknown = { blockingWorkItemIds: result.blockingWorkItemIds, status: result.status, synthesisCalls: 0 };
});

test("discovery rejects overlapping source blocks and shared result paths before execution", async () => {
  let calls = 0;
  const invalidFactory = factory();
  invalidFactory.discovery = () => [
    job("discover-a", "discovery", ["block-a"]),
    { ...job("discover-b", "discovery", ["block-a", "block-b"]), resultPath: "evidence/discover-a.json" },
  ];
  await assert.rejects(
    runSemanticPlaybook(context, invalidFactory, async () => {
      calls++;
      throw new Error("must not execute");
    }),
    /shared semantic resultPath|partition every maintained block/u,
  );
  assert.equal(calls, 0);
});

test("concurrent discovery waits for every launched root to settle before reporting failure", async () => {
  let settled = 0;
  const result = await runSemanticPlaybook(
    context,
    factory(),
    async ({ assignment }) => {
      await new Promise((resolve) => setTimeout(resolve, assignment.assignmentId === "discover-a" ? 5 : 20));
      settled++;
      throw new Error(`fixture failure ${assignment.assignmentId}`);
    },
  );
  assert.equal(settled, 2);
  assert.equal(result.status, "paused-unknown");
  assert.deepEqual(result.failure, {
    assignmentId: null,
    cleanup: "unknown",
    errorClass: "unknown",
    evidenceRefs: [],
    retryAllowed: false,
  });
  semanticEvidence.executorRejection = { settled, failure: result.failure, status: result.status };
});

test("report-only, duplicate, and falsified work finish without synthesis or mutation wave", async () => {
  const reportOnly = fixtureExecutor({ includeP1: false, includeUnknown: false });
  const reportOnlyResult = await runSemanticPlaybook(context, factory(), reportOnly.execute);
  assert.equal(reportOnlyResult.status, "complete");
  assert.equal(reportOnlyResult.wave, null);
  assert.equal(reportOnly.observations().synthesisCalls, 0);
  assert.deepEqual(reportOnlyResult.workItems.map((item) => item.status), ["report-only"]);

  for (const disposition of ["duplicate", "falsified"] as const) {
    const fixture = fixtureExecutor({ includeP3: false, includeUnknown: false, p1Disposition: disposition });
    const result = await runSemanticPlaybook(context, factory(), fixture.execute);
    assert.equal(result.status, "complete");
    assert.equal(result.wave, null);
    assert.equal(fixture.observations().synthesisCalls, 0);
    assert.deepEqual(result.workItems.map((item) => item.status), [disposition]);
  }
  semanticEvidence.noWave = { duplicate: "complete", falsified: "complete", reportOnly: reportOnlyResult.status, synthesisCalls: 0 };
});

test("investigation preserves confirmed, falsified, still-unknown, product-decision, and wait outcomes", async () => {
  const expected = {
    confirmed: { status: "complete", item: "confirmed", wave: true },
    falsified: { status: "complete", item: "falsified", wave: false },
    "owner-required": { status: "waiting", item: "waiting", wave: false },
    "product-decision-required": { status: "product-decision-required", item: "product-decision-required", wave: false },
    "still-unknown": { status: "blocked", item: "unknown-material", wave: false },
    waiting: { status: "waiting", item: "waiting", wave: false },
  } as const;
  for (const investigationResult of Object.keys(expected) as CampaignInvestigationResult["result"][]) {
    const fixture = fixtureExecutor({ includeP1: false, includeP3: false, investigationResult });
    const result = await runSemanticPlaybook(context, factory(), fixture.execute);
    assert.equal(result.status, expected[investigationResult].status);
    assert.equal(result.workItems[0].status, expected[investigationResult].item);
    assert.equal(result.wave != null, expected[investigationResult].wave);
  }
  semanticEvidence.investigations = expected;
});

test("protected work remains waiting while an authorized sibling freezes separately", async () => {
  const fixture = fixtureExecutor({ includeP3: false, investigationResult: "confirmed", unknownEffects: ["external"] });
  const result = await runSemanticPlaybook(context, factory(), fixture.execute);
  assert.equal(result.status, "waiting");
  assert.deepEqual(result.blockingWorkItemIds, ["item-unknown"]);
  assert.deepEqual(result.workItems.map((item) => [item.id, item.status]), [
    ["item-p1", "confirmed"],
    ["item-unknown", "waiting"],
  ]);
  assert.deepEqual(result.wave?.workItemIds, ["item-p1"]);
  semanticEvidence.protectedSplit = {
    blockerIds: result.blockingWorkItemIds,
    status: result.status,
    waveItems: result.wave?.workItemIds ?? [],
  };
});

test("investigation product decision remains scoped while an authorized sibling freezes", async () => {
  const fixture = fixtureExecutor({ includeP3: false, investigationResult: "product-decision-required" });
  const result = await runSemanticPlaybook(context, factory(), fixture.execute);
  assert.equal(result.status, "product-decision-required");
  assert.deepEqual(result.blockingWorkItemIds, ["item-unknown"]);
  assert.deepEqual(result.workItems.map((item) => [item.id, item.status]), [
    ["item-p1", "confirmed"],
    ["item-unknown", "product-decision-required"],
  ]);
  assert.deepEqual(result.wave?.workItemIds, ["item-p1"]);
});

test("budget, transient, cleanup, and retry controls fail closed without automatic retry", async () => {
  let calls = 0;
  const budget = await runSemanticPlaybook({ ...context, modelCallBudget: 1 }, factory(), async () => {
    calls++;
    throw new Error("must not execute");
  });
  assert.equal(calls, 0);
  assert.equal(budget.status, "paused-budget");

  const firstJob = factory().discovery(context)[0];
  const transientResult: SemanticAssignmentResult = {
    ...completeResult(firstJob.assignment, "session:transient", null),
    errorClass: "runtime",
    errorMessage: "provider temporarily unavailable",
    outputDigest: null,
    payload: null,
    status: "blocked",
  };
  const transient = await runSemanticPlaybook(context, factory(), async ({ assignment }) => {
    calls++;
    return { ...transientResult, assignmentId: assignment.assignmentId, assignmentType: assignment.assignmentType, phase: assignment.phase };
  });
  assert.equal(transient.status, "paused-transient");
  assert.equal(transient.failure?.retryAllowed, true);
  assert.equal(calls, 2);

  const retryJob = { ...firstJob, resultPath: "evidence/discover-a-retry.json" };
  assert.deepEqual(validateSemanticRetryJob(firstJob, transientResult, retryJob), retryJob);
  assert.throws(
    () => validateSemanticRetryJob(firstJob, { ...transientResult, cleanup: "unknown" }, retryJob),
    /terminal transient result/u,
  );

  const cleanupUnknown = await runSemanticPlaybook(context, factory(), async ({ assignment }) => ({
    ...transientResult,
    assignmentId: assignment.assignmentId,
    assignmentType: assignment.assignmentType,
    cleanup: "unknown",
    errorClass: "cleanup-unknown",
    phase: assignment.phase,
    status: "unknown",
  }));
  assert.equal(cleanupUnknown.status, "paused-unknown");
  assert.equal(cleanupUnknown.failure?.retryAllowed, false);
  semanticEvidence.controls = {
    budgetStatus: budget.status,
    cleanupRetryAllowed: cleanupUnknown.failure?.retryAllowed,
    cleanupStatus: cleanupUnknown.status,
    retryAccepted: true,
    retryRejectedOnUnknownCleanup: true,
    transientCalls: calls,
    transientRetryAllowed: transient.failure?.retryAllowed,
    transientStatus: transient.status,
  };
});

after(() => {
  if (semanticRawPath == null) return;
  fs.writeFileSync(semanticRawPath, `${JSON.stringify({
    candidateId: semanticCandidateId,
    effects: { hostEffects: 0, modelCalls: 0, providerCalls: 0, sourceWrites: 0 },
    evidence: semanticEvidence,
    schemaVersion: 1,
  }, null, 2)}\n`, { encoding: "utf8", flag: "wx" });
});
