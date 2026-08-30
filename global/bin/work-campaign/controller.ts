import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import { runPortableCommand } from "../portable-process.ts";
import { stableJson } from "../roadmap-mission/contracts.ts";
import { campaignDigest, WorkCampaignError, parseWorkCampaignRecord } from "./contracts.ts";
import type {
  CampaignClosureMatrix,
  CampaignInventoryBlock,
  CampaignPartitionResult,
  CampaignReconciliationResult,
  CampaignReportSeed,
  CampaignWaveManifest,
  CampaignWorkItem,
  WorkCampaignAdapter,
  WorkCampaignDefinition,
  WorkCampaignResult,
} from "./contracts.ts";
import {
  appendCampaignLedgerRecord,
  materializeCampaignReport,
  readCampaignReport,
  readCurrentCampaignReconciliations,
  readCurrentCampaignSeedRecords,
} from "./materializer.ts";
import {
  handoffEvidenceRefs,
  invokeCampaignMission,
  materializeCampaignMission,
  observeCampaignMission,
  requestCampaignMissionStop,
} from "./mission-handoff.ts";
import type {
  CampaignMissionMaterialization,
  CampaignMissionOptions,
} from "./mission-handoff.ts";
import { loadValidatedPhaseInput } from "./phase-input.ts";
import { preflightCampaign, readCampaignCandidateDigest } from "./preflight.ts";
import type { CampaignPreflightReport } from "./preflight.ts";
import {
  acquireCampaignWriterLease,
  readCampaignStateProjection,
  recordCampaignStopIntent,
  recordCampaignTransitionWithLease,
  releaseCampaignWriterLease,
  replayCampaignState,
} from "./state.ts";
import type {
  CampaignActiveOperation,
  CampaignBudgetState,
  CampaignStateProjection,
  CampaignTransitionDescriptor,
  CampaignWriterLease,
} from "./state.ts";
import { loadValidatedVerificationInput } from "./verification-input.ts";
import type {
  ValidatedFinalChallengeInput,
  ValidatedReconciliationInput,
  ValidatedRereviewInput,
  ValidatedWaveInput,
} from "./verification-input.ts";

function executableDigest(): string {
  try {
    return crypto.createHash("sha256").update(fs.readFileSync(process.execPath)).digest("hex");
  } catch (error) {
    throw new WorkCampaignError("current executable identity is unreadable", 2, { cause: error, field: "executable" });
  }
}

function budget(
  definition: WorkCampaignDefinition,
  evidenceBytes: number,
  processAttempts: number,
  waves: number,
  modelCalls = 0,
  wallClockSeconds = 0,
): CampaignBudgetState {
  return {
    consumed: { evidenceBytes, modelCalls, processAttempts, wallClockSeconds, waves },
    limits: definition.budgets,
    revision: 0,
  };
}

function activeOperation(kind: CampaignActiveOperation["kind"], lease: CampaignWriterLease, createdAt: string): CampaignActiveOperation {
  return {
    kind,
    process: {
      executableDigest: lease.executableDigest,
      pid: lease.pid,
      processRef: lease.processRef,
      startedAt: createdAt,
      status: "active",
    },
    session: { sessionRef: `session:fake-${kind}`, status: "terminal" },
    writer: { leaseRef: `lease:${lease.token}`, owner: "campaign", status: "active" },
  };
}

function missionOperation(missionId: string): CampaignActiveOperation {
  return {
    kind: "mission",
    process: null,
    session: null,
    writer: { leaseRef: `lease:mission-${missionId}`, owner: "mission", status: "active" },
  };
}

function descriptor(input: Omit<CampaignTransitionDescriptor, "createdAt" | "schemaVersion">, createdAt: string): CampaignTransitionDescriptor {
  return { ...input, createdAt, schemaVersion: 1 };
}

function result(
  definition: WorkCampaignDefinition,
  definitionDigest: string,
  operation: WorkCampaignResult["operation"],
  input: Omit<WorkCampaignResult, "campaignId" | "definitionDigest" | "operation" | "recordType" | "schemaVersion" | "supervision" | "terminalHandoff" | "tool"> & {
    terminalHandoff?: WorkCampaignResult["terminalHandoff"];
  },
): WorkCampaignResult {
  return parseWorkCampaignRecord({
    supervision: null,
    terminalHandoff: null,
    ...input,
    campaignId: definition.campaignId,
    definitionDigest,
    operation,
    recordType: "campaign-result",
    schemaVersion: 1,
    tool: "work-campaign",
  }) as WorkCampaignResult;
}

function resultFromProjection(
  root: string,
  definition: WorkCampaignDefinition,
  definitionDigest: string,
  operation: WorkCampaignResult["operation"],
  projection: CampaignStateProjection,
): WorkCampaignResult {
  const disposition: WorkCampaignResult["disposition"] = projection.disposition === "complete" ? "complete"
    : projection.disposition === "owner-required" ? "owner-required"
      : projection.disposition === "product-decision-required" ? "product-decision-required"
        : projection.disposition === "waiting" ? "waiting"
      : projection.disposition === "paused-budget" ? "paused-budget"
        : projection.disposition === "paused-external" ? "paused-external"
          : projection.disposition === "paused-stop" ? "paused-stop"
            : projection.disposition === "paused-unknown" ? "paused-unknown"
              : "blocked";
  let terminalHandoff: WorkCampaignResult["terminalHandoff"] = null;
  if (disposition === "complete") {
    const report = readCampaignReport(root, definition);
    const rows = currentCampaignRows(root, definition);
    const candidateDigest = readCampaignCandidateDigest(root, definition);
    if (report.closure.candidateDigest !== candidateDigest || report.closure.definitionDigest !== definitionDigest
      || report.closure.reportDigest !== report.reportDigest || report.closure.terminalState !== "complete"
      || report.closure.challengeStatus !== "complete" || rows.reportSeed.terminalState !== "complete"
      || !currentVerificationArtifacts(root, definition, candidateDigest, rows.reportSeed)) {
      return result(definition, definitionDigest, operation, {
        cleanup: projection.activeOperation == null ? "complete" : "unknown",
        disposition: "blocked",
        errorClass: "immutable-input",
        errorMessage: "Terminal campaign state no longer has current source, report, validation, and proof evidence.",
        evidenceRefs: projection.evidenceRefs,
        phase: "verify",
        writerClosure: projection.activeOperation == null ? "terminal" : "unknown",
      });
    }
    terminalHandoff = {
      candidateDigest,
      closure: report.closure,
      definitionDigest,
      evidenceRefs: [...new Set([...projection.evidenceRefs, `report:${report.reportDigest}`])].sort(),
      maximumClaim: rows.reportSeed.maximumClaim,
      reportDigest: report.reportDigest,
      reportPath: definition.reportPath,
      schemaVersion: 1,
      terminalState: "complete",
    };
  }
  return result(definition, definitionDigest, operation, {
    cleanup: projection.activeOperation == null ? "complete" : "unknown",
    disposition,
    errorClass: disposition === "product-decision-required" ? "owner-protected"
      : disposition === "waiting" ? "locally-correctable"
      : disposition === "paused-external" ? "locally-correctable"
      : disposition === "paused-stop" ? "none"
        : disposition === "paused-unknown" ? "unknown"
          : disposition === "owner-required" ? "owner-protected"
          : disposition === "blocked" ? "immutable-input" : "none",
    errorMessage: disposition === "product-decision-required"
      ? "Campaign drained the dependency-valid authorized wave frontier and preserves a material product decision."
      : disposition === "waiting"
        ? "Campaign drained the dependency-valid authorized wave frontier and preserves a resumable non-product gate."
      : disposition === "paused-external" && projection.lastTransitionKind === "rereview" && projection.phase === "synthesize"
      ? "Changed-block re-review found candidate work; a fresh non-self reconciliation is required."
      : disposition === "paused-external" && projection.lastTransitionKind === "rereview" && projection.evidenceRefs.includes("blocker:critical-sdet-required")
        ? "Current confirmed P0 work is fixed and proven; fresh test-only critical SDET evidence is required before terminal completion."
      : disposition === "paused-external" && projection.evidenceRefs.includes("blocker:terminal-evidence-currentness-required")
        ? "Current source, report, aggregate validation, or real-boundary proof evidence must be restored before terminal completion."
      : disposition === "paused-external" && projection.lastTransitionKind === "findings-freeze" && projection.phase === "synthesize"
        ? "Current P0/P1 findings are confirmed; a correlated synthesis wave is required."
      : disposition === "paused-external" && projection.lastTransitionKind === "rereview"
      ? "Changed-block re-review and campaign verification are complete; a correlated final challenge is required."
      : disposition === "paused-external" && projection.phase === "verify"
      ? "Mission handoff is consumed; changed-block re-review is required before another wave."
      : disposition === "paused-external" && projection.phase === "mission"
        ? "Mission requires a terminal correlated handoff before campaign verification."
        : disposition === "paused-external" ? "Frozen wave is ready; mission integration is not enabled at this provider-free rung."
      : disposition === "owner-required" ? "Campaign preserves an owner-required work item without admitting its effects."
        : disposition === "blocked" ? "Campaign state is not at a supported controller boundary." : null,
    evidenceRefs: projection.evidenceRefs,
    phase: projection.phase,
    terminalHandoff,
    writerClosure: projection.activeOperation == null ? "terminal" : "unknown",
  });
}

function missionObservationResult(
  definition: WorkCampaignDefinition,
  definitionDigest: string,
  operation: WorkCampaignResult["operation"],
  handoff: ReturnType<typeof observeCampaignMission>,
): WorkCampaignResult {
  const unknown = handoff.writerClosure === "unknown" || handoff.cleanupClosure === "unknown";
  const terminalScopedStop = handoff.disposition === "product-decision-required" || handoff.disposition === "waiting";
  return result(definition, definitionDigest, operation, {
    cleanup: unknown ? "unknown" : "complete",
    disposition: unknown ? "paused-unknown" : "paused-external",
    errorClass: unknown ? "unknown" : "locally-correctable",
    errorMessage: unknown
      ? "Mission ownership or cleanup is not terminal."
      : handoff.disposition === "complete" || terminalScopedStop
        ? "Mission is terminal; resume the campaign to consume its correlated handoff."
        : `Mission is terminal with disposition ${handoff.disposition}; campaign verification cannot start.`,
    evidenceRefs: handoffEvidenceRefs(handoff),
    phase: "mission",
    writerClosure: unknown ? "unknown" : "terminal",
  });
}

function blockedResult(
  definition: WorkCampaignDefinition,
  definitionDigest: string,
  operation: WorkCampaignResult["operation"],
  preflight: CampaignPreflightReport,
): WorkCampaignResult {
  const failures = preflight.checks.filter((check) => check.status !== "passed");
  const writerUnknown = failures.some((check) => check.id === "campaign:writer" || check.status === "unknown");
  return result(definition, definitionDigest, operation, {
    cleanup: "not-required",
    disposition: writerUnknown ? "paused-unknown" : "blocked",
    errorClass: writerUnknown ? "unknown" : "immutable-input",
    errorMessage: failures.map((check) => `${check.id}: ${check.summary}`).join(" "),
    evidenceRefs: [],
    phase: "inventory",
    writerClosure: writerUnknown ? "unknown" : "terminal",
  });
}

export function runProviderFreeCampaign(
  root: string,
  definition: WorkCampaignDefinition,
  definitionDigest: string,
  adapterDigest: string,
  phaseInputPath: string,
  missionOptions?: CampaignMissionOptions,
): WorkCampaignResult {
  const preflight = preflightCampaign(root, definition, definitionDigest, adapterDigest);
  if (preflight.status !== "eligible" || preflight.identities == null || preflight.candidateDigest == null) {
    return blockedResult(definition, definitionDigest, "run", preflight);
  }
  const existing = readCampaignStateProjection(root, definition);
  if (existing != null) {
    if (missionOptions != null && existing.missionRef != null && existing.waveId != null) {
      return missionObservationResult(definition, definitionDigest, "run", observeCampaignMission(root, definition, existing.waveId));
    }
    return resultFromProjection(root, definition, definitionDigest, "run", existing);
  }
  const validated = loadValidatedPhaseInput(root, phaseInputPath, definition, definitionDigest, preflight.candidateDigest);
  const started = Date.now();
  const createdAt = (offset: number): string => new Date(started + offset).toISOString();
  const lease = acquireCampaignWriterLease(root, definition, {
    createdAt: createdAt(0),
    executableDigest: executableDigest(),
    pid: process.pid,
    processRef: `process:work-campaign-${process.pid}`,
  });
  let finalEvidenceRefs = validated.evidenceRefs;
  let mission: CampaignMissionMaterialization | null = null;
  try {
    const record = (value: CampaignTransitionDescriptor) => recordCampaignTransitionWithLease(root, definition, value, lease);
    record(descriptor({
      activeOperation: null,
      budget: budget(definition, 0, 0, 0),
      disposition: "ready",
      eventId: "controller-preflight",
      evidenceRefs: [`file:${phaseInputPath}`],
      identities: preflight.identities,
      kind: "preflight",
      missionRef: null,
      phase: "inventory",
      stopRequested: false,
      waveId: null,
    }, createdAt(0)));
    const inventoryOperation = activeOperation("inventory", lease, createdAt(1));
    record(descriptor({
      activeOperation: inventoryOperation,
      budget: budget(definition, validated.evidenceBytes, 1, 0, validated.modelCalls),
      disposition: "running",
      eventId: "inventory-start",
      evidenceRefs: validated.evidenceRefs,
      identities: preflight.identities,
      kind: "phase-start",
      missionRef: null,
      phase: "inventory",
      stopRequested: false,
      waveId: null,
    }, createdAt(1)));
    for (const block of validated.blocks) appendCampaignLedgerRecord(root, definition, block);
    record(descriptor({
      activeOperation: null,
      budget: budget(definition, validated.evidenceBytes, 1, 0, validated.modelCalls),
      disposition: "ready",
      eventId: "inventory-complete",
      evidenceRefs: [...validated.evidenceRefs, `inventory:${validated.inventoryDigest}`].sort(),
      identities: preflight.identities,
      kind: "phase-complete",
      missionRef: null,
      phase: "discover",
      stopRequested: false,
      waveId: null,
    }, createdAt(2)));
    const discoverOperation = activeOperation("discover", lease, createdAt(3));
    record(descriptor({
      activeOperation: discoverOperation,
      budget: budget(definition, validated.evidenceBytes, 2, 0, validated.modelCalls),
      disposition: "running",
      eventId: "discover-start",
      evidenceRefs: validated.evidenceRefs,
      identities: preflight.identities,
      kind: "phase-start",
      missionRef: null,
      phase: "discover",
      stopRequested: false,
      waveId: null,
    }, createdAt(3)));
    for (const seed of validated.discoveryRecords) appendCampaignLedgerRecord(root, definition, seed);
    record(descriptor({
      activeOperation: null,
      budget: budget(definition, validated.evidenceBytes, 2, 0, validated.modelCalls),
      disposition: "ready",
      eventId: "findings-freeze",
      evidenceRefs: validated.evidenceRefs,
      identities: preflight.identities,
      kind: "findings-freeze",
      missionRef: null,
      phase: "synthesize",
      stopRequested: false,
      waveId: null,
    }, createdAt(4)));
    const synthesizeOperation = activeOperation("synthesize", lease, createdAt(5));
    record(descriptor({
      activeOperation: synthesizeOperation,
      budget: budget(definition, validated.evidenceBytes, 3, 0, validated.modelCalls),
      disposition: "running",
      eventId: "synthesize-start",
      evidenceRefs: validated.evidenceRefs,
      identities: preflight.identities,
      kind: "phase-start",
      missionRef: null,
      phase: "synthesize",
      stopRequested: false,
      waveId: null,
    }, createdAt(5)));
    if (validated.wave != null) appendCampaignLedgerRecord(root, definition, validated.wave);
    appendCampaignLedgerRecord(root, definition, validated.reportSeed);
    const materialized = materializeCampaignReport(root, definition);
    mission = missionOptions == null || validated.wave == null
      ? null
      : materializeCampaignMission(root, definition, definitionDigest, validated.wave);
    finalEvidenceRefs = [...new Set([
      ...validated.evidenceRefs,
      `report:${materialized.reportDigest}`,
      ...(validated.wave == null ? [] : [`wave:${validated.wave.id}`]),
      ...(mission == null ? [] : [`mission-definition:${mission.definitionDigest}`, `wave:${mission.waveDigest}`, `transition:${mission.correlationDigest}`]),
    ])].sort();
    record(descriptor({
      activeOperation: synthesizeOperation,
      budget: budget(definition, validated.evidenceBytes, 3, 0, validated.modelCalls),
      disposition: "running",
      eventId: "report-materialized",
      evidenceRefs: finalEvidenceRefs,
      identities: preflight.identities,
      kind: "report-materialized",
      missionRef: null,
      phase: "synthesize",
      stopRequested: false,
      waveId: null,
    }, createdAt(6)));
    if (validated.wave == null) {
      const waiting = validated.reportSeed.terminalState === "owner-required" || validated.reportSeed.terminalState === "waiting";
      const productDecisionRequired = validated.reportSeed.terminalState === "product-decision-required";
      record(descriptor({
        activeOperation: null,
        budget: budget(definition, validated.evidenceBytes, 3, 0, validated.modelCalls),
        disposition: productDecisionRequired ? "product-decision-required" : waiting ? "waiting" : "paused-external",
        eventId: productDecisionRequired ? "product-decision-required" : waiting ? "waiting" : "final-challenge-pause",
        evidenceRefs: [...new Set([
          ...finalEvidenceRefs,
          productDecisionRequired ? "blocker:product-decision-required"
            : waiting ? "blocker:non-product-wait" : "blocker:final-challenge-not-enabled",
        ])].sort(),
        identities: preflight.identities,
        kind: productDecisionRequired ? "product-decision-required" : waiting ? "waiting" : "pause",
        missionRef: null,
        phase: "paused",
        stopRequested: false,
        waveId: null,
      }, createdAt(7)));
    } else {
      record(descriptor({
        activeOperation: null,
        budget: budget(definition, validated.evidenceBytes, 3, 1, validated.modelCalls),
        disposition: "ready",
        eventId: "wave-admitted",
        evidenceRefs: finalEvidenceRefs,
        identities: preflight.identities,
        kind: "wave-admitted",
        missionRef: null,
        phase: "mission",
        stopRequested: false,
        waveId: validated.wave.id,
      }, createdAt(7)));
      if (mission == null) {
        record(descriptor({
          activeOperation: null,
          budget: budget(definition, validated.evidenceBytes, 3, 1, validated.modelCalls),
          disposition: "paused-external",
          eventId: "mission-integration-pause",
          evidenceRefs: [...new Set([...finalEvidenceRefs, "blocker:mission-integration-not-enabled"])].sort(),
          identities: preflight.identities,
          kind: "pause",
          missionRef: null,
          phase: "paused",
          stopRequested: false,
          waveId: validated.wave.id,
        }, createdAt(8)));
      } else {
        record(descriptor({
          activeOperation: missionOperation(mission.definition.missionId),
          budget: budget(definition, validated.evidenceBytes, 4, 1, validated.modelCalls),
          disposition: "running",
          eventId: "mission-launch",
          evidenceRefs: finalEvidenceRefs,
          identities: preflight.identities,
          kind: "mission-launch",
          missionRef: mission.missionRef,
          phase: "mission",
          stopRequested: false,
          waveId: validated.wave.id,
        }, createdAt(8)));
      }
    }
  } finally {
    releaseCampaignWriterLease(root, definition, lease);
  }
  if (mission != null && missionOptions != null) {
    const handoff = invokeCampaignMission(root, mission, missionOptions);
    return missionObservationResult(definition, definitionDigest, "run", handoff);
  }
  const projection = readCampaignStateProjection(root, definition);
  if (projection == null) throw new WorkCampaignError("campaign projection is missing after provider-free execution", 1, { field: "statePath" });
  return resultFromProjection(root, definition, definitionDigest, "run", projection);
}

function consumeCompletedMission(
  root: string,
  definition: WorkCampaignDefinition,
  definitionDigest: string,
  handoff: ReturnType<typeof observeCampaignMission>,
): WorkCampaignResult {
  const replay = replayCampaignState(root, definition);
  if (replay.status !== "valid" || replay.writerStatus !== "clear") {
    throw new WorkCampaignError("campaign state or writer is not current before mission handoff consumption", 1, { field: "campaign state" });
  }
  const before = readCampaignStateProjection(root, definition);
  if (before == null || before.waveId !== handoff.waveId || before.missionRef !== `mission:${handoff.missionId}`) {
    throw new WorkCampaignError("mission handoff does not match the active campaign wave", 2, { field: "missionRef" });
  }
  if (before.lastTransitionKind === "verification") return resultFromProjection(root, definition, definitionDigest, "resume", before);
  const seeds = readCurrentCampaignSeedRecords(root, definition);
  const items = seeds.filter((seed): seed is CampaignWorkItem => seed.recordType === "work-item");
  const blocks = seeds.filter((seed): seed is CampaignInventoryBlock => seed.recordType === "inventory-block");
  const reportSeeds = seeds.filter((seed): seed is CampaignReportSeed => seed.recordType === "report-seed");
  const partitions = seeds.filter((seed): seed is CampaignPartitionResult => seed.recordType === "partition-result");
  if (reportSeeds.length !== 1) throw new WorkCampaignError("campaign requires exactly one current report seed", 2, { field: "report-seed" });
  const workItemIds = new Set(handoff.workItemRefs);
  const waveItems = items.filter((item) => workItemIds.has(item.id));
  if (waveItems.length !== workItemIds.size || waveItems.some((item) => item.status !== "confirmed" && item.status !== "fixed-and-verified")) {
    throw new WorkCampaignError("mission handoff work items are not current confirmed campaign items", 2, { field: "workItemRefs" });
  }
  const blockIds = new Set(waveItems.flatMap((item) => item.sourceBlockIds));
  const waveBlocks = blocks.filter((block) => blockIds.has(block.id));
  if (waveBlocks.length !== blockIds.size) throw new WorkCampaignError("mission handoff source blocks are incomplete", 2, { field: "sourceBlockIds" });
  const refs = handoffEvidenceRefs(handoff);
  const archiveRefs = refs.filter((ref) => ref.startsWith("archive:"));
  const checkpointRef = refs.find((ref) => ref.startsWith("checkpoint:")) ?? null;
  const lease = acquireCampaignWriterLease(root, definition, {
    createdAt: new Date().toISOString(),
    executableDigest: executableDigest(),
    pid: process.pid,
    processRef: `process:work-campaign-${process.pid}`,
  });
  try {
    let current = readCampaignStateProjection(root, definition);
    if (current == null) throw new WorkCampaignError("campaign projection disappeared before handoff consumption", 1, { field: "statePath" });
    if (current.lastTransitionKind === "mission-launch"
      || current.lastTransitionKind === "product-decision-required"
      || current.lastTransitionKind === "waiting") {
      recordCampaignTransitionWithLease(root, definition, descriptor({
        activeOperation: null,
        budget: current.budget,
        disposition: "ready",
        eventId: `mission-terminal-${handoff.waveId}`,
        evidenceRefs: [...new Set([...current.evidenceRefs, ...refs])].sort(),
        identities: current.identities,
        kind: "mission-terminal",
        missionRef: current.missionRef,
        phase: "verify",
        stopRequested: current.stopRequested,
        waveId: current.waveId,
      }, new Date().toISOString()), lease);
      current = readCampaignStateProjection(root, definition);
      if (current == null) throw new WorkCampaignError("mission-terminal transition did not materialize", 1, { field: "statePath" });
    }
    for (const item of waveItems) {
      appendCampaignLedgerRecord(root, definition, {
        ...item,
        evidenceRefs: [...new Set([...item.evidenceRefs, ...refs])].sort(),
        status: "fixed-and-verified",
      });
    }
    const nextBlocks = blocks.map((block) => blockIds.has(block.id) ? { ...block, reviewStatus: "needs-rereview" as const } : block);
    for (const block of nextBlocks.filter((block) => blockIds.has(block.id))) appendCampaignLedgerRecord(root, definition, block);
    const inventoryDigest = campaignDigest(nextBlocks.slice().sort((left, right) => left.id.localeCompare(right.id)));
    for (const partition of partitions) appendCampaignLedgerRecord(root, definition, { ...partition, inventoryDigest });
    const reportSeed = reportSeeds[0];
    appendCampaignLedgerRecord(root, definition, {
      ...reportSeed,
      blockers: [{
        evidenceRefs: refs,
        id: "changed-block-rereview",
        status: "blocked",
        summary: "Mission-owned source changes require a fresh block review before another wave.",
      }],
      limitations: [],
      matrixRows: reportSeed.matrixRows.map((row) => row.id === "redundancy"
        ? row
        : {
            ...row,
            evidenceRefs: [...new Set([...row.evidenceRefs, ...refs])].sort(),
            status: "resolved",
            summary: "The disposable mission and terminal parent handoff exercised this boundary.",
          }),
       maximumClaim: "One disposable local wave completed through the existing mission controller; campaign aggregate verification and changed-block re-review remain pending.",
       proofStatus: "unknown",
       terminalState: "unknown",
       validationRows: reportSeed.validationRows.map((row) => ({
         ...row,
         evidenceRefs: [...new Set([...row.evidenceRefs, ...refs])].sort(),
         status: "unknown",
         summary: "Campaign aggregate verification remains pending after the mission handoff.",
       })),
       validationStatus: "unknown",
      waveRows: reportSeed.waveRows.map((row) => row.waveId === handoff.waveId
        ? {
            ...row,
            archiveRefs,
            checkpointRef,
            evidenceRefs: [...new Set([...row.evidenceRefs, ...refs])].sort(),
            status: "complete",
          }
        : row),
    });
    const materialized = materializeCampaignReport(root, definition);
    readCampaignReport(root, definition);
    current = readCampaignStateProjection(root, definition);
    if (current == null) throw new WorkCampaignError("campaign projection disappeared before verification transition", 1, { field: "statePath" });
    if (current.lastTransitionKind !== "verification") {
      const stopped = current.stopRequested;
      recordCampaignTransitionWithLease(root, definition, descriptor({
        activeOperation: null,
        budget: current.budget,
        disposition: stopped ? "paused-stop" : "paused-external",
        eventId: `verification-${handoff.waveId}`,
        evidenceRefs: [...new Set([
          ...current.evidenceRefs,
          ...refs,
          `report:${materialized.reportDigest}`,
          ...(stopped ? [] : ["blocker:changed-block-rereview-required"]),
        ])].sort(),
        identities: current.identities,
        kind: stopped ? "pause" : "verification",
        missionRef: current.missionRef,
        phase: stopped ? "paused" : "verify",
        stopRequested: current.stopRequested,
        waveId: current.waveId,
      }, new Date().toISOString()), lease);
    }
  } finally {
    releaseCampaignWriterLease(root, definition, lease);
  }
  const projection = readCampaignStateProjection(root, definition);
  if (projection == null) throw new WorkCampaignError("campaign projection is missing after mission consumption", 1, { field: "statePath" });
  return resultFromProjection(root, definition, definitionDigest, "resume", projection);
}

function consumeScopedMissionStop(
  root: string,
  definition: WorkCampaignDefinition,
  definitionDigest: string,
  handoff: ReturnType<typeof observeCampaignMission>,
): WorkCampaignResult {
  if (handoff.disposition !== "product-decision-required" && handoff.disposition !== "waiting") {
    throw new WorkCampaignError("scoped mission stop requires a product-decision or waiting handoff", 2, { field: "mission" });
  }
  if (handoff.writerClosure !== "terminal" || handoff.cleanupClosure !== "terminal" || handoff.blocker == null) {
    throw new WorkCampaignError("scoped mission stop is not terminal-clear", 1, { field: "mission" });
  }
  const replay = replayCampaignState(root, definition);
  if (replay.status !== "valid" || replay.writerStatus !== "clear") {
    throw new WorkCampaignError("campaign state or writer is not current before scoped mission handoff consumption", 1, { field: "campaign state" });
  }
  const before = readCampaignStateProjection(root, definition);
  if (before == null || before.waveId !== handoff.waveId || before.missionRef !== `mission:${handoff.missionId}`) {
    throw new WorkCampaignError("scoped mission handoff does not match the active campaign wave", 2, { field: "missionRef" });
  }
  if (before.lastTransitionKind === handoff.disposition && before.disposition === handoff.disposition) {
    return resultFromProjection(root, definition, definitionDigest, "resume", before);
  }
  if (!( ["mission-launch", "product-decision-required", "waiting"] as string[]).includes(before.lastTransitionKind)) {
    throw new WorkCampaignError("scoped mission handoff is not consumable at the current campaign boundary", 2, { field: "missionRef" });
  }
  const rows = currentCampaignRows(root, definition);
  const wave = rows.waves.find((entry) => entry.id === handoff.waveId);
  if (wave == null) throw new WorkCampaignError("scoped mission handoff has no current frozen wave", 2, { field: "waveId" });
  const waveItemIds = new Set(wave.workItemIds);
  const completedIds = new Set(handoff.completedWorkItemRefs);
  const blockedIds = new Set(handoff.blockedWorkItemRefs);
  if (blockedIds.size === 0
    || [...completedIds, ...blockedIds].some((id) => !waveItemIds.has(id))) {
    throw new WorkCampaignError("scoped mission handoff does not project completed and blocked frozen-wave items", 2, { field: "workItemRefs" });
  }
  const waveItems = rows.items.filter((item) => waveItemIds.has(item.id));
  if (waveItems.length !== waveItemIds.size
    || waveItems.some((item) => item.status !== "confirmed" && item.status !== "fixed-and-verified")) {
    throw new WorkCampaignError("scoped mission handoff work items are not current campaign items", 2, { field: "workItemRefs" });
  }
  const refs = handoffEvidenceRefs(handoff);
  const archiveRefs = refs.filter((ref) => ref.startsWith("archive:"));
  const checkpointRef = refs.find((ref) => ref.startsWith("checkpoint:")) ?? null;
  const completionLimitation = completedIds.size === 0
    ? "No authorized sibling completed; blocked and dependent work remains unresolved."
    : "Dependency-valid authorized siblings completed; blocked and dependent work remains unresolved.";
  const waveSummary = completedIds.size === 0
    ? "No authorized sibling completed or checkpointed; scoped blocked and dependent work remains unresolved."
    : checkpointRef == null
      ? "Authorized siblings completed without checkpoint evidence; scoped blocked work remains unresolved."
      : "Authorized siblings completed and checkpointed; scoped blocked work remains unresolved.";
  const lease = acquireCampaignWriterLease(root, definition, {
    createdAt: nextCreatedAt(before),
    executableDigest: executableDigest(),
    pid: process.pid,
    processRef: `process:work-campaign-${process.pid}`,
  });
  try {
    for (const item of waveItems.filter((entry) => completedIds.has(entry.id) && entry.status !== "fixed-and-verified")) {
      appendCampaignLedgerRecord(root, definition, {
        ...item,
        evidenceRefs: [...new Set([...item.evidenceRefs, ...refs])].sort(),
        status: "fixed-and-verified",
      });
    }
    const reportSeed: CampaignReportSeed = {
      ...rows.reportSeed,
      blockers: [{
        evidenceRefs: refs,
        id: `mission-${handoff.disposition}`,
        status: handoff.disposition,
        summary: `The frozen wave retains a ${handoff.disposition} blocker until: ${handoff.blocker.resumeCondition}`,
      }],
      challengeStatus: "unknown",
      limitations: [{
        evidenceRefs: refs,
        id: "scoped-mission-stop",
        summary: completionLimitation,
      }],
      maximumClaim: `The disposable campaign consumed one ${handoff.disposition} mission handoff after completing ${completedIds.size} authorized sibling item(s); blocked work remains unresolved.`,
      ownershipStatus: "terminal",
      proofStatus: "unknown",
      terminalState: handoff.disposition,
      validationStatus: "unknown",
      waveRows: rows.reportSeed.waveRows.map((row) => row.waveId === handoff.waveId
        ? {
            ...row,
            archiveRefs,
            checkpointRef,
            evidenceRefs: [...new Set([...row.evidenceRefs, ...refs])].sort(),
            status: "blocked" as const,
            summary: waveSummary,
          }
        : row),
    };
    appendCampaignLedgerRecord(root, definition, reportSeed);
    const materialized = materializeCampaignReport(root, definition);
    readCampaignReport(root, definition);
    const current = readCampaignStateProjection(root, definition);
    if (current == null || current.lastTransitionKind !== before.lastTransitionKind) {
      throw new WorkCampaignError("campaign state changed during scoped mission handoff consumption", 1, { field: "statePath" });
    }
    recordCampaignTransitionWithLease(root, definition, descriptor({
      activeOperation: null,
      budget: current.budget,
      disposition: handoff.disposition,
      eventId: `${handoff.disposition}-${handoff.waveId}-${current.sequence}`,
      evidenceRefs: [...new Set([...current.evidenceRefs, ...refs, `report:${materialized.reportDigest}`])].sort(),
      identities: current.identities,
      kind: handoff.disposition,
      missionRef: current.missionRef,
      phase: "paused",
      stopRequested: current.stopRequested,
      waveId: current.waveId,
    }, nextCreatedAt(current)), lease);
  } finally {
    releaseCampaignWriterLease(root, definition, lease);
  }
  const projection = readCampaignStateProjection(root, definition);
  if (projection == null) throw new WorkCampaignError("campaign projection is missing after scoped mission stop", 1, { field: "statePath" });
  return resultFromProjection(root, definition, definitionDigest, "resume", projection);
}

type VerificationCommandKind = "aggregate-validation" | "real-boundary-proof";

type VerificationCommandEvidence = {
  error: Error | null;
  reference: string;
  relative: string;
  status: number | null;
  text: string;
};

function sameStrings(left: string[], right: string[]): boolean {
  return stableJson(left.slice().sort()) === stableJson(right.slice().sort());
}

function nextCreatedAt(current: CampaignStateProjection): string {
  return new Date(Math.max(Date.now(), Date.parse(current.createdAt) + 1)).toISOString();
}

function verificationCommand(
  root: string,
  definition: WorkCampaignDefinition,
  candidateDigest: string,
  kind: VerificationCommandKind,
  argv: string[],
): VerificationCommandEvidence {
  const command = runPortableCommand(root, argv, {
    capture: true,
    timeoutMs: Math.max(1_000, definition.budgets.wallClockSeconds * 1_000),
  });
  const text = stableJson({
    argv,
    candidateDigest,
    commandKind: kind,
    errorName: command.error?.name ?? null,
    exitCode: command.status,
    schemaVersion: 1,
    signal: command.signal,
    status: command.status === 0 && command.error == null && !command.timedOut ? "complete" : "blocked",
    stderr: { bytes: Buffer.byteLength(command.stderr), digest: campaignDigest(command.stderr) },
    stdout: { bytes: Buffer.byteLength(command.stdout), digest: campaignDigest(command.stdout) },
    timedOut: command.timedOut === true,
  });
  const relative = `${definition.evidencePath}/verification/${candidateDigest}/${kind}-${campaignDigest(text).slice(0, 16)}.json`;
  const error = command.status === 0 && command.error == null && !command.timedOut
    ? null
    : command.error ?? new Error(`${argv[0]} exited ${String(command.status)}${command.timedOut ? " after timeout" : ""}`);
  return { error, reference: `file:${relative}`, relative, status: command.status, text };
}

function writeVerificationEvidence(root: string, evidence: VerificationCommandEvidence): void {
  const file = path.resolve(root, evidence.relative);
  const lexical = path.relative(path.resolve(root), file);
  if (lexical.startsWith("..") || path.isAbsolute(lexical)) throw new WorkCampaignError("verification evidence path escapes the project root", 2, { field: "evidencePath" });
  fs.mkdirSync(path.dirname(file), { recursive: true });
  if (fs.existsSync(file)) {
    if (fs.readFileSync(file, "utf8") !== evidence.text) throw new WorkCampaignError("verification evidence identity differs", 2, { field: "evidencePath" });
    return;
  }
  fs.writeFileSync(file, evidence.text, { encoding: "utf8", flag: "wx" });
  if (fs.readFileSync(file, "utf8") !== evidence.text) throw new WorkCampaignError("verification evidence readback differs", 1, { field: "evidencePath" });
}

function currentVerificationArtifacts(
  root: string,
  definition: WorkCampaignDefinition,
  candidateDigest: string,
  reportSeed: CampaignReportSeed,
): boolean {
  const expectedKeys = [
    "argv", "candidateDigest", "commandKind", "errorName", "exitCode", "schemaVersion", "signal", "status", "stderr", "stdout", "timedOut",
  ].sort();
  for (const row of reportSeed.validationRows) {
    const kind: VerificationCommandKind = row.kind === "validation" ? "aggregate-validation" : "real-boundary-proof";
    const prefix = `file:${definition.evidencePath}/verification/${candidateDigest}/${kind}-`;
    const refs = row.evidenceRefs.filter((reference) => reference.startsWith(prefix) && reference.endsWith(".json"));
    if (refs.length !== 1) return false;
    const relative = refs[0].slice("file:".length);
    const file = path.resolve(root, relative);
    const lexical = path.relative(path.resolve(root), file);
    if (lexical.startsWith("..") || path.isAbsolute(lexical)) return false;
    try {
      const canonical = fs.realpathSync(file);
      const actual = path.relative(fs.realpathSync(root), canonical);
      const stat = fs.lstatSync(canonical);
      if (actual.startsWith("..") || path.isAbsolute(actual) || !stat.isFile() || stat.isSymbolicLink()) return false;
      const source = fs.readFileSync(canonical, "utf8");
      if (path.basename(canonical) !== `${kind}-${campaignDigest(source).slice(0, 16)}.json`) return false;
      const record = JSON.parse(source) as Record<string, unknown>;
      if (stableJson(Object.keys(record).sort()) !== stableJson(expectedKeys)
        || record.schemaVersion !== 1 || record.candidateDigest !== candidateDigest || record.commandKind !== kind
        || stableJson(record.argv) !== stableJson(row.argv) || record.status !== "complete" || record.exitCode !== 0
        || record.timedOut !== false || record.errorName != null) return false;
    } catch {
      return false;
    }
  }
  return reportSeed.validationRows.length > 0;
}

function incrementBudget(
  current: CampaignStateProjection,
  definition: WorkCampaignDefinition,
  inputEvidenceBytes: number,
  artifactBytes: number,
  modelCalls: number,
  processAttempts: number,
  wallClockSeconds: number,
): CampaignBudgetState {
  const next: CampaignBudgetState = {
    consumed: {
      evidenceBytes: current.budget.consumed.evidenceBytes + inputEvidenceBytes + artifactBytes,
      modelCalls: current.budget.consumed.modelCalls + modelCalls,
      processAttempts: current.budget.consumed.processAttempts + processAttempts,
      wallClockSeconds: current.budget.consumed.wallClockSeconds + wallClockSeconds,
      waves: current.budget.consumed.waves,
    },
    limits: current.budget.limits,
    revision: current.budget.revision,
  };
  for (const key of Object.keys(next.consumed) as Array<keyof CampaignBudgetState["consumed"]>) {
    if (next.consumed[key] > definition.budgets[key]) throw new WorkCampaignError(`campaign ${key} budget is exhausted`, 1, { field: `budgets.${key}` });
  }
  return next;
}

function currentCampaignRows(root: string, definition: WorkCampaignDefinition): {
  blocks: CampaignInventoryBlock[];
  items: CampaignWorkItem[];
  reconciliations: CampaignReconciliationResult[];
  reportSeed: CampaignReportSeed;
  waves: CampaignWaveManifest[];
} {
  const seeds = readCurrentCampaignSeedRecords(root, definition);
  const reportSeeds = seeds.filter((seed): seed is CampaignReportSeed => seed.recordType === "report-seed");
  if (reportSeeds.length !== 1) throw new WorkCampaignError("campaign requires exactly one current report seed", 2, { field: "report-seed" });
  return {
    blocks: seeds.filter((seed): seed is CampaignInventoryBlock => seed.recordType === "inventory-block"),
    items: seeds.filter((seed): seed is CampaignWorkItem => seed.recordType === "work-item"),
    reconciliations: readCurrentCampaignReconciliations(root, definition),
    reportSeed: reportSeeds[0],
    waves: seeds.filter((seed): seed is CampaignWaveManifest => seed.recordType === "wave-manifest"),
  };
}

function fixedP0ItemIds(rows: ReturnType<typeof currentCampaignRows>): string[] {
  const severity = new Map<string, CampaignReconciliationResult["severity"]>();
  for (const reconciliation of rows.reconciliations) severity.set(reconciliation.workItemId, reconciliation.severity);
  return rows.items
    .filter((item) => item.status === "fixed-and-verified" && severity.get(item.id) === "P0")
    .map((item) => item.id)
    .sort();
}

function expectedRereviewIds(current: CampaignStateProjection, rows: ReturnType<typeof currentCampaignRows>): string[] {
  const wave = rows.waves.find((candidate) => candidate.id === current.waveId);
  if (wave == null) throw new WorkCampaignError("current frozen wave is unavailable for re-review", 2, { field: "waveId" });
  const waveIds = new Set(wave.workItemIds);
  const items = rows.items.filter((item) => waveIds.has(item.id));
  if (items.length !== waveIds.size) throw new WorkCampaignError("current frozen wave work items are incomplete", 2, { field: "workItemIds" });
  return [...new Set(items.flatMap((item) => item.sourceBlockIds))].sort();
}

function actualBlockDigest(root: string, block: CampaignInventoryBlock): string {
  if (block.kind !== "file") throw new WorkCampaignError(`changed block ${block.id} must be a file at this verification rung`, 2, { field: "recordPaths" });
  const file = path.resolve(root, block.path);
  const lexical = path.relative(path.resolve(root), file);
  if (lexical.startsWith("..") || path.isAbsolute(lexical)) throw new WorkCampaignError(`changed block ${block.id} escapes the project root`, 2, { field: "recordPaths" });
  let canonical: string;
  try {
    canonical = fs.realpathSync(file);
  } catch (error) {
    throw new WorkCampaignError(`changed block ${block.id} is unreadable`, 2, { cause: error, field: "recordPaths" });
  }
  const actual = path.relative(fs.realpathSync(root), canonical);
  const stat = fs.lstatSync(canonical);
  if (actual.startsWith("..") || path.isAbsolute(actual) || !stat.isFile() || stat.isSymbolicLink()) {
    throw new WorkCampaignError(`changed block ${block.id} must be a contained regular non-symlink file`, 2, { field: "recordPaths" });
  }
  return crypto.createHash("sha256").update(fs.readFileSync(canonical)).digest("hex");
}

function currentInventoryCandidate(blocks: CampaignInventoryBlock[]): string {
  const included = blocks.filter((block) => block.classification !== "excluded" && block.exclusionReason == null);
  if (included.some((block) => block.kind !== "file") || new Set(included.map((block) => block.path)).size !== included.length) {
    throw new WorkCampaignError("task-4.3 verification requires one current file block per tracked source path", 2, { field: "inventory-block" });
  }
  return campaignDigest(included.map((block) => ({ path: block.path, sha256: block.digest })).sort((left, right) => left.path.localeCompare(right.path)));
}

function pausedVerificationResult(
  definition: WorkCampaignDefinition,
  definitionDigest: string,
  evidenceRefs: string[],
  message: string,
): WorkCampaignResult {
  return result(definition, definitionDigest, "verify", {
    cleanup: "complete",
    disposition: "paused-external",
    errorClass: "locally-correctable",
    errorMessage: message,
    evidenceRefs,
    phase: "verify",
    writerClosure: "terminal",
  });
}

function verifyRereview(
  root: string,
  definition: WorkCampaignDefinition,
  definitionDigest: string,
  adapter: WorkCampaignAdapter,
  current: CampaignStateProjection,
  input: ValidatedRereviewInput,
): WorkCampaignResult {
  if (current.lastTransitionKind === "rereview") return resultFromProjection(root, definition, definitionDigest, "verify", current);
  if (current.lastTransitionKind !== "verification" || current.phase !== "verify") {
    throw new WorkCampaignError("semantic re-review is valid only at the changed-block verification boundary", 2, { field: "verificationInputPath" });
  }
  const rows = currentCampaignRows(root, definition);
  const expectedIds = expectedRereviewIds(current, rows);
  if (!sameStrings(input.assignment.sourceBlockIds, expectedIds) || !sameStrings(input.blocks.map((block) => block.id), expectedIds)) {
    throw new WorkCampaignError("semantic re-review must cover the frozen wave changed blocks exactly", 2, { field: "sourceBlockIds" });
  }
  const currentBlockById = new Map(rows.blocks.map((block) => [block.id, block]));
  const nextBlockById = new Map(rows.blocks.map((block) => [block.id, block]));
  for (const block of input.blocks) {
    const previous = currentBlockById.get(block.id);
    if (previous == null || block.path !== previous.path || block.kind !== previous.kind || block.classification !== previous.classification
      || block.exclusionReason !== previous.exclusionReason || block.digest !== actualBlockDigest(root, block)
      || block.reviewStatus !== "reviewed-with-finding") {
      throw new WorkCampaignError(`changed block ${block.id} is not a current terminal re-review`, 2, { field: "recordPaths" });
    }
    nextBlockById.set(block.id, block);
  }
  const nextBlocks = [...nextBlockById.values()].sort((left, right) => left.id.localeCompare(right.id));
  const candidateDigest = readCampaignCandidateDigest(root, definition);
  if (input.assignment.candidateDigest !== candidateDigest || currentInventoryCandidate(nextBlocks) !== candidateDigest) {
    throw new WorkCampaignError("semantic re-review candidate differs from current tracked source", 2, { field: "candidateDigest" });
  }
  const inventoryDigest = campaignDigest(nextBlocks);
  if (input.partition.assignmentId !== input.assignment.assignmentId || input.partition.status !== "complete"
    || input.partition.candidateDigest !== candidateDigest || input.partition.inventoryDigest !== inventoryDigest
    || !sameStrings(input.partition.blockIds, expectedIds)) {
    throw new WorkCampaignError("semantic re-review partition identity or coverage differs", 2, { field: "partition" });
  }
  const newItemIds = input.workItems.map((item) => item.id).sort();
  if (!sameStrings(input.partition.workItemIds, newItemIds)) {
    throw new WorkCampaignError("semantic re-review partition work items differ", 2, { field: "workItemIds" });
  }
  const existingItemIds = new Set(rows.items.map((item) => item.id));
  for (const item of input.workItems) {
    if (existingItemIds.has(item.id)) throw new WorkCampaignError(`re-review work item ${item.id} duplicates a current stable identity`, 2, { field: "workItems" });
    if (item.status !== "candidate" || item.candidateDigest !== candidateDigest
      || item.producerSessionRef !== input.partition.producerSessionRef
      || item.sourceBlockIds.length === 0 || item.sourceBlockIds.some((id) => !expectedIds.includes(id))) {
      throw new WorkCampaignError(`re-review work item ${item.id} is not a current discovery candidate`, 2, { field: "workItems" });
    }
  }
  const projectedModelCalls = current.budget.consumed.modelCalls + input.assignment.budgets.modelCalls;
  const projectedProcesses = current.budget.consumed.processAttempts + 2;
  const projectedEvidence = current.budget.consumed.evidenceBytes + input.evidenceBytes;
  if (projectedModelCalls > definition.budgets.modelCalls || projectedProcesses > definition.budgets.processAttempts
    || projectedEvidence > definition.budgets.evidenceBytes) {
    throw new WorkCampaignError("campaign verification budget is exhausted before command execution", 1, { field: "budgets" });
  }
  const started = Date.now();
  const validation = verificationCommand(root, definition, candidateDigest, "aggregate-validation", definition.validationArgv);
  const proof = verificationCommand(root, definition, candidateDigest, "real-boundary-proof", adapter.realBoundaryProofArgv);
  const artifacts = [validation, proof];
  const nextBudget = incrementBudget(
    current,
    definition,
    input.evidenceBytes,
    artifacts.reduce((total, artifact) => total + Buffer.byteLength(artifact.text), 0),
    input.assignment.budgets.modelCalls,
    2,
    Math.max(1, Math.ceil((Date.now() - started) / 1_000)),
  );
  for (const artifact of artifacts) writeVerificationEvidence(root, artifact);
  const failed = artifacts.find((artifact) => artifact.error != null);
  if (failed != null) {
    throw new WorkCampaignError(`${failed.relative} did not complete successfully`, 1, { cause: failed.error, field: failed.relative });
  }
  const refs = [...new Set([...current.evidenceRefs, ...input.evidenceRefs, ...artifacts.map((artifact) => artifact.reference)])].sort();
  const reboundItems = rows.items.map((item) => ({
    ...item,
    candidateDigest,
    evidenceRefs: [...new Set([...item.evidenceRefs, ...input.evidenceRefs])].sort(),
  }));
  const hasNewWork = input.workItems.length > 0;
  const criticalP0Ids = fixedP0ItemIds(rows);
  const criticalSdetPending = !hasNewWork && criticalP0Ids.length > 0;
  const validationRef = validation.reference;
  const proofRef = proof.reference;
  const nextReportSeed: CampaignReportSeed = {
    ...rows.reportSeed,
    blockers: hasNewWork
      ? [{
          evidenceRefs: refs,
          id: "next-wave-reconciliation",
          status: "blocked",
          summary: "Current re-review candidates require fresh non-self reconciliation before another wave can freeze.",
        }]
      : criticalSdetPending
        ? [{
            evidenceRefs: refs,
            id: "critical-sdet-pending",
            status: "blocked",
            summary: `Fresh test-only critical SDET evidence is required for confirmed P0 work: ${criticalP0Ids.join(", ")}.`,
          }]
        : [],
    candidateDigest,
    challengeStatus: "unknown",
    limitations: [{
      evidenceRefs: refs,
      id: hasNewWork ? "next-wave-pending" : criticalSdetPending ? "critical-sdet-pending" : "single-wave-configured-envelope",
      summary: hasNewWork
        ? "The completed wave is current, but newly discovered material work has not yet passed reconciliation and synthesis."
        : criticalSdetPending
          ? "The confirmed P0 correction is current, but mandatory fresh test-only critical evidence is not yet recorded."
        : "This result covers one disposable configured wave; multi-wave and host recovery remain outside task 4.3.",
    }],
    matrixRows: rows.reportSeed.matrixRows.map((row) => ({
      ...row,
      evidenceRefs: [...new Set([...row.evidenceRefs, ...refs])].sort(),
      status: row.status === "report-only" ? "report-only" : criticalSdetPending && row.kind === "test-gap" ? "open" : "resolved",
      summary: row.status === "report-only"
        ? row.summary
        : criticalSdetPending && row.kind === "test-gap"
          ? "Fresh test-only critical SDET evidence is pending for the confirmed P0 correction."
          : "The disposable mission, changed-block re-review, aggregate validation, and real-boundary proof exercised this row.",
    })),
    maximumClaim: hasNewWork
      ? "One disposable local campaign completed one remediation wave and current changed-block re-review; a newly discovered candidate remains pending non-self reconciliation."
      : criticalSdetPending
        ? "One disposable local campaign completed a confirmed P0 remediation wave through current re-review, aggregate validation, and real-boundary proof; mandatory fresh test-only critical evidence and final challenge remain pending."
      : "One disposable configured local campaign completed one P1 remediation wave through current changed-block re-review, aggregate validation, and real-boundary proof; final challenge remains pending.",
    ownershipStatus: "terminal",
    proofStatus: "complete",
    terminalState: "unknown",
    validationRows: rows.reportSeed.validationRows.map((row) => {
      const expectedArgv = row.kind === "validation" ? definition.validationArgv : adapter.realBoundaryProofArgv;
      const reference = row.kind === "validation" ? validationRef : proofRef;
      if (stableJson(row.argv) !== stableJson(expectedArgv)) throw new WorkCampaignError(`report row ${row.id} command identity differs`, 2, { field: "validationRows" });
      return {
        ...row,
        evidenceRefs: [...new Set([...row.evidenceRefs, reference])].sort(),
        status: "complete" as const,
        summary: `${row.kind === "validation" ? "Campaign aggregate validation" : "Declared real-boundary proof"} completed with retained command evidence.`,
      };
    }),
    validationStatus: "complete",
  };
  const lease = acquireCampaignWriterLease(root, definition, {
    createdAt: nextCreatedAt(current),
    executableDigest: executableDigest(),
    pid: process.pid,
    processRef: `process:work-campaign-${process.pid}`,
  });
  try {
    for (const block of input.blocks) appendCampaignLedgerRecord(root, definition, block);
    appendCampaignLedgerRecord(root, definition, input.partition);
    for (const item of reboundItems) appendCampaignLedgerRecord(root, definition, item);
    for (const item of input.workItems) appendCampaignLedgerRecord(root, definition, item);
    appendCampaignLedgerRecord(root, definition, nextReportSeed);
    const materialized = materializeCampaignReport(root, definition);
    readCampaignReport(root, definition);
    const latest = readCampaignStateProjection(root, definition);
    if (latest == null || latest.lastTransitionKind !== "verification") throw new WorkCampaignError("campaign state changed during re-review", 1, { field: "statePath" });
    recordCampaignTransitionWithLease(root, definition, descriptor({
      activeOperation: null,
      budget: nextBudget,
      disposition: "paused-external",
      eventId: `rereview-${String(current.waveId)}`,
      evidenceRefs: [...new Set([
        ...refs,
        `report:${materialized.reportDigest}`,
        hasNewWork ? "blocker:next-wave-reconciliation-required" : criticalSdetPending ? "blocker:critical-sdet-required" : "blocker:final-challenge-required",
      ])].sort(),
      identities: latest.identities,
      kind: "rereview",
      missionRef: latest.missionRef,
      phase: hasNewWork ? "synthesize" : "verify",
      stopRequested: latest.stopRequested,
      waveId: latest.waveId,
    }, nextCreatedAt(latest)), lease);
  } finally {
    releaseCampaignWriterLease(root, definition, lease);
  }
  const projection = readCampaignStateProjection(root, definition);
  if (projection == null) throw new WorkCampaignError("campaign projection is missing after re-review", 1, { field: "statePath" });
  return resultFromProjection(root, definition, definitionDigest, "verify", projection);
}

function verifyReconciliation(
  root: string,
  definition: WorkCampaignDefinition,
  definitionDigest: string,
  current: CampaignStateProjection,
  input: ValidatedReconciliationInput,
): WorkCampaignResult {
  if (current.lastTransitionKind === "findings-freeze") return resultFromProjection(root, definition, definitionDigest, "verify", current);
  if (current.lastTransitionKind !== "rereview" || current.phase !== "synthesize") {
    throw new WorkCampaignError("semantic reconciliation is valid only after a re-review found candidate work", 2, { field: "verificationInputPath" });
  }
  const rows = currentCampaignRows(root, definition);
  const candidateDigest = readCampaignCandidateDigest(root, definition);
  const item = rows.items.find((row) => row.id === input.reconciliation.workItemId);
  if (item == null || item.status !== "candidate" || item.candidateDigest !== candidateDigest
    || input.reconciliation.candidateDigest !== candidateDigest
    || input.reconciliation.producerSessionRef === item.producerSessionRef
    || !sameStrings(input.assignment.sourceBlockIds, item.sourceBlockIds)
    || !item.sourceBlockIds.some((id) => rows.blocks.find((block) => block.id === id)?.digest === input.reconciliation.sourceDigest)) {
    throw new WorkCampaignError("semantic reconciliation is not fresh, non-self, and source-correlated", 2, { field: "reconciliation" });
  }
  if (input.reconciliation.disposition !== "confirmed"
    || (input.reconciliation.severity !== "P0" && input.reconciliation.severity !== "P1")) {
    throw new WorkCampaignError("task 5.1 next-wave reconciliation requires one confirmed P0/P1", 2, { field: "reconciliation" });
  }
  const nextBudget = incrementBudget(current, definition, input.evidenceBytes, 0, input.assignment.budgets.modelCalls, 0, 0);
  const refs = [...new Set([...current.evidenceRefs, ...input.evidenceRefs, ...input.reconciliation.evidenceRefs])].sort();
  const nextItem: CampaignWorkItem = {
    ...item,
    confidence: item.confidence,
    evidenceRefs: [...new Set([...item.evidenceRefs, ...refs])].sort(),
    initialSeverity: input.reconciliation.severity,
    status: "confirmed",
  };
  const nextReportSeed: CampaignReportSeed = {
    ...rows.reportSeed,
    blockers: [{
      evidenceRefs: refs,
      id: "next-wave-synthesis",
      status: "blocked",
      summary: "Current confirmed P0/P1 work requires one correlated synthesis result before another wave can freeze.",
    }],
    limitations: [{
      evidenceRefs: refs,
      id: "next-wave-pending",
      summary: "A current material finding is confirmed but its next remediation wave has not yet frozen.",
    }],
    maximumClaim: "One disposable local campaign completed one remediation wave and confirmed one current next-wave P0/P1 through non-self source-correlated reconciliation; synthesis remains pending.",
    terminalState: "unknown",
  };
  const lease = acquireCampaignWriterLease(root, definition, {
    createdAt: nextCreatedAt(current),
    executableDigest: executableDigest(),
    pid: process.pid,
    processRef: `process:work-campaign-${process.pid}`,
  });
  try {
    appendCampaignLedgerRecord(root, definition, input.reconciliation);
    appendCampaignLedgerRecord(root, definition, nextItem);
    appendCampaignLedgerRecord(root, definition, nextReportSeed);
    const materialized = materializeCampaignReport(root, definition);
    readCampaignReport(root, definition);
    const latest = readCampaignStateProjection(root, definition);
    if (latest == null || latest.lastTransitionKind !== "rereview") throw new WorkCampaignError("campaign state changed during reconciliation", 1, { field: "statePath" });
    recordCampaignTransitionWithLease(root, definition, descriptor({
      activeOperation: null,
      budget: nextBudget,
      disposition: "paused-external",
      eventId: `findings-freeze-${item.id}`,
      evidenceRefs: [...new Set([...refs, `report:${materialized.reportDigest}`, "blocker:next-wave-synthesis-required"])].sort(),
      identities: latest.identities,
      kind: "findings-freeze",
      missionRef: null,
      phase: "synthesize",
      stopRequested: latest.stopRequested,
      waveId: latest.waveId,
    }, nextCreatedAt(latest)), lease);
  } finally {
    releaseCampaignWriterLease(root, definition, lease);
  }
  const projection = readCampaignStateProjection(root, definition);
  if (projection == null) throw new WorkCampaignError("campaign projection is missing after reconciliation", 1, { field: "statePath" });
  return resultFromProjection(root, definition, definitionDigest, "verify", projection);
}

function verifyNextWave(
  root: string,
  definition: WorkCampaignDefinition,
  definitionDigest: string,
  current: CampaignStateProjection,
  input: ValidatedWaveInput,
  missionOptions: CampaignMissionOptions | undefined,
): WorkCampaignResult {
  if (current.lastTransitionKind === "mission-launch" || current.lastTransitionKind === "wave-admitted") {
    return resultFromProjection(root, definition, definitionDigest, "verify", current);
  }
  if (current.lastTransitionKind !== "findings-freeze" || current.phase !== "synthesize") {
    throw new WorkCampaignError("semantic wave synthesis is valid only after current findings freeze", 2, { field: "verificationInputPath" });
  }
  if (missionOptions == null) throw new WorkCampaignError("semantic next-wave synthesis requires explicit mission options", 2, { field: "mission" });
  const rows = currentCampaignRows(root, definition);
  const candidateDigest = readCampaignCandidateDigest(root, definition);
  const eligible = rows.items.filter((item) => item.status === "confirmed").sort((left, right) => left.id.localeCompare(right.id));
  const eligibleIds = eligible.map((item) => item.id);
  const sourceBlockIds = [...new Set(eligible.flatMap((item) => item.sourceBlockIds))].sort();
  if (eligible.length === 0 || input.wave.candidateDigest !== candidateDigest
    || input.assignment.candidateDigest !== candidateDigest
    || !sameStrings(input.assignment.sourceBlockIds, sourceBlockIds)
    || !sameStrings(input.wave.workItemIds, eligibleIds)
    || rows.waves.some((wave) => wave.id === input.wave.id)) {
    throw new WorkCampaignError("semantic next wave does not exactly cover current confirmed P0/P1 work", 2, { field: "wave" });
  }
  const itemById = new Map(eligible.map((item) => [item.id, item]));
  const assignedIds = input.wave.slices.flatMap((slice) => slice.workItemIds).sort();
  if (!sameStrings(assignedIds, eligibleIds)) throw new WorkCampaignError("next-wave slices must assign each eligible work item exactly once", 2, { field: "wave.slices" });
  for (const slice of input.wave.slices) {
    const pathsCurrent = slice.ownedPaths.every((owned) => definition.scopeRoots.some((scope) => owned === scope || owned.startsWith(`${scope}/`))
      && !definition.exclusions.some((excluded) => owned === excluded || owned.startsWith(`${excluded}/`) || excluded.startsWith(`${owned}/`)));
    if (!pathsCurrent || slice.effectClasses.some((effect) => !definition.allowedEffects.includes(effect))
      || slice.workItemIds.some((id) => itemById.get(id)?.status !== "confirmed")) {
      throw new WorkCampaignError(`next-wave slice ${slice.id} exceeds current path, effect, or item authority`, 2, { field: "wave.slices" });
    }
  }
  const priorWaveIds = new Set(rows.waves.map((wave) => wave.id));
  if (rows.reportSeed.waveRows.filter((row) => priorWaveIds.has(row.waveId)).some((row) =>
    row.status !== "complete" || row.archiveRefs.length === 0 || row.checkpointRef == null
  )) {
    throw new WorkCampaignError("all prior waves must be archived and checkpointed before next-wave admission", 2, { field: "waveRows" });
  }
  const nextBudget = incrementBudget(current, definition, input.evidenceBytes, 0, input.assignment.budgets.modelCalls, 0, 0);
  nextBudget.consumed.waves += 1;
  if (nextBudget.consumed.waves > definition.budgets.waves) throw new WorkCampaignError("campaign waves budget is exhausted", 1, { field: "budgets.waves" });
  const refs = [...new Set([...current.evidenceRefs, ...input.evidenceRefs, `wave:${input.wave.id}`])].sort();
  const nextReportSeed: CampaignReportSeed = {
    ...rows.reportSeed,
    blockers: [{ evidenceRefs: refs, id: `mission-${input.wave.id}`, status: "blocked", summary: "The newly frozen wave requires one terminal mission handoff." }],
    challengeStatus: "unknown",
    limitations: [{ evidenceRefs: refs, id: "multi-wave-in-progress", summary: "A second frozen wave is admitted but has not completed mission handoff and re-review." }],
    maximumClaim: "One disposable local campaign completed one wave and admitted one current non-self-confirmed P0/P1 into a second immutable mission wave.",
    terminalState: "unknown",
    waveRows: [...rows.reportSeed.waveRows, {
      archiveRefs: [],
      checkpointRef: null,
      evidenceRefs: refs,
      id: `wave-${input.wave.id}`,
      status: "unknown" as const,
      summary: "The current next wave is frozen and pending terminal mission handoff.",
      waveId: input.wave.id,
    }].sort((left, right) => left.id.localeCompare(right.id)),
  };
  const lease = acquireCampaignWriterLease(root, definition, {
    createdAt: nextCreatedAt(current),
    executableDigest: executableDigest(),
    pid: process.pid,
    processRef: `process:work-campaign-${process.pid}`,
  });
  let mission: CampaignMissionMaterialization;
  try {
    appendCampaignLedgerRecord(root, definition, input.wave);
    appendCampaignLedgerRecord(root, definition, nextReportSeed);
    const report = materializeCampaignReport(root, definition);
    readCampaignReport(root, definition);
    mission = materializeCampaignMission(root, definition, definitionDigest, input.wave);
    let latest = readCampaignStateProjection(root, definition);
    if (latest == null || latest.lastTransitionKind !== "findings-freeze") throw new WorkCampaignError("campaign state changed during next-wave synthesis", 1, { field: "statePath" });
    const evidenceRefs = [...new Set([...refs, `report:${report.reportDigest}`, `mission-definition:${mission.definitionDigest}`, `transition:${mission.correlationDigest}`])].sort();
    recordCampaignTransitionWithLease(root, definition, descriptor({
      activeOperation: null,
      budget: nextBudget,
      disposition: "ready",
      eventId: `wave-admitted-${input.wave.id}`,
      evidenceRefs,
      identities: latest.identities,
      kind: "wave-admitted",
      missionRef: null,
      phase: "mission",
      stopRequested: latest.stopRequested,
      waveId: input.wave.id,
    }, nextCreatedAt(latest)), lease);
    latest = readCampaignStateProjection(root, definition);
    if (latest == null) throw new WorkCampaignError("next-wave admission did not project", 1, { field: "statePath" });
    recordCampaignTransitionWithLease(root, definition, descriptor({
      activeOperation: missionOperation(mission.definition.missionId),
      budget: nextBudget,
      disposition: "running",
      eventId: `mission-launch-${input.wave.id}`,
      evidenceRefs,
      identities: latest.identities,
      kind: "mission-launch",
      missionRef: mission.missionRef,
      phase: "mission",
      stopRequested: latest.stopRequested,
      waveId: input.wave.id,
    }, nextCreatedAt(latest)), lease);
  } finally {
    releaseCampaignWriterLease(root, definition, lease);
  }
  return missionObservationResult(definition, definitionDigest, "verify", invokeCampaignMission(root, mission, missionOptions));
}

function closureReadyForCompletion(closure: CampaignClosureMatrix, reportSeed: CampaignReportSeed): boolean {
  return closure.inventory.blocked === 0
    && closure.inventory.needsRereview === 0
    && closure.inventory.currentTerminal === closure.inventory.total
    && closure.workItems.unresolvedP0P1 === 0
    && closure.workItems.unknownMaterial === 0
    && closure.workItems.ownerRequired === 0
    && closure.workItems.productDecisionRequired === 0
    && closure.workItems.waiting === 0
    && closure.workItems.resolved === closure.workItems.total
    && closure.waves.archived === closure.waves.total
    && closure.waves.checkpointed === closure.waves.total
    && closure.ownershipStatus === "terminal"
    && closure.proofStatus === "complete"
    && closure.validationStatus === "complete"
    && reportSeed.blockers.length === 0;
}

function appendTerminalTransitions(
  root: string,
  definition: WorkCampaignDefinition,
  definitionDigest: string,
  current: CampaignStateProjection,
  budgetState: CampaignBudgetState,
  evidenceRefs: string[],
  operation: WorkCampaignResult["operation"],
  existingLease?: CampaignWriterLease,
): WorkCampaignResult {
  const ownsLease = existingLease == null;
  const lease = existingLease ?? acquireCampaignWriterLease(root, definition, {
      createdAt: nextCreatedAt(current),
      executableDigest: executableDigest(),
      pid: process.pid,
      processRef: `process:work-campaign-${process.pid}`,
  });
  try {
    let latest = readCampaignStateProjection(root, definition);
    if (latest == null) throw new WorkCampaignError("campaign projection is missing before terminal completion", 1, { field: "statePath" });
    const recoveringEvidencePause = latest.lastTransitionKind === "pause"
      && latest.evidenceRefs.includes("blocker:terminal-evidence-currentness-required");
    const materialized = latest.lastTransitionKind === "report-materialized" || recoveringEvidencePause
      ? readCampaignReport(root, definition)
      : materializeCampaignReport(root, definition);
    const readback = readCampaignReport(root, definition);
    if (readback.closure.terminalState !== "complete") throw new WorkCampaignError("campaign report is not terminal-complete", 2, { field: "terminalState" });
    const terminalEvidenceCurrent = (): boolean => {
      const rows = currentCampaignRows(root, definition);
      const candidateDigest = readCampaignCandidateDigest(root, definition);
      return readback.closure.candidateDigest === candidateDigest
        && currentVerificationArtifacts(root, definition, candidateDigest, rows.reportSeed);
    };
    const pauseForCurrentEvidence = (): WorkCampaignResult => {
      const alreadyPaused = latest.lastTransitionKind === "pause"
        && latest.evidenceRefs.includes("blocker:terminal-evidence-currentness-required");
      if (!alreadyPaused) {
        recordCampaignTransitionWithLease(root, definition, descriptor({
          activeOperation: null,
          budget: budgetState,
          disposition: "paused-external",
          eventId: `terminal-evidence-pause-${latest.sequence}`,
          evidenceRefs: [...new Set([...evidenceRefs, `report:${materialized.reportDigest}`, "blocker:terminal-evidence-currentness-required"])].sort(),
          identities: latest.identities,
          kind: "pause",
          missionRef: latest.missionRef,
          phase: "paused",
          stopRequested: latest.stopRequested,
          waveId: latest.waveId,
        }, nextCreatedAt(latest)), lease);
        const paused = readCampaignStateProjection(root, definition);
        if (paused == null) throw new WorkCampaignError("terminal evidence pause did not project", 1, { field: "statePath" });
        latest = paused;
      }
      return resultFromProjection(root, definition, definitionDigest, operation, latest);
    };
    if (!terminalEvidenceCurrent()) return pauseForCurrentEvidence();
    if (latest.lastTransitionKind !== "report-materialized") {
      recordCampaignTransitionWithLease(root, definition, descriptor({
        activeOperation: null,
        budget: budgetState,
        disposition: "ready",
        eventId: recoveringEvidencePause ? `report-materialized-recovery-${latest.sequence}` : `report-materialized-final-${String(latest.waveId)}`,
        evidenceRefs: [...new Set([...evidenceRefs, `report:${materialized.reportDigest}`])].sort(),
        identities: latest.identities,
        kind: "report-materialized",
        missionRef: latest.missionRef,
        phase: "verify",
        stopRequested: latest.stopRequested,
        waveId: latest.waveId,
      }, nextCreatedAt(latest)), lease);
      latest = readCampaignStateProjection(root, definition);
      if (latest == null) throw new WorkCampaignError("report-materialized transition did not project", 1, { field: "statePath" });
    }
    if (!terminalEvidenceCurrent()) return pauseForCurrentEvidence();
    recordCampaignTransitionWithLease(root, definition, descriptor({
      activeOperation: null,
      budget: budgetState,
      disposition: "complete",
      eventId: `terminal-complete-${String(latest.waveId)}`,
      evidenceRefs: [...new Set([...evidenceRefs, `report:${materialized.reportDigest}`])].sort(),
      identities: latest.identities,
      kind: "terminal-complete",
      missionRef: latest.missionRef,
      phase: "complete",
      stopRequested: latest.stopRequested,
      waveId: latest.waveId,
    }, nextCreatedAt(latest)), lease);
  } finally {
    if (ownsLease) releaseCampaignWriterLease(root, definition, lease);
  }
  const projection = readCampaignStateProjection(root, definition);
  if (projection == null) throw new WorkCampaignError("campaign projection is missing after terminal completion", 1, { field: "statePath" });
  return resultFromProjection(root, definition, definitionDigest, operation, projection);
}

function challengeMatchesCurrent(current: CampaignClosureMatrix, challenged: CampaignClosureMatrix): boolean {
  return stableJson(challenged) === stableJson({ ...current, challengeStatus: "complete", terminalState: "unknown" });
}

function verifyFinalChallenge(
  root: string,
  definition: WorkCampaignDefinition,
  definitionDigest: string,
  current: CampaignStateProjection,
  input: ValidatedFinalChallengeInput,
): WorkCampaignResult {
  if (current.lastTransitionKind !== "rereview") throw new WorkCampaignError("final challenge is valid only after changed-block re-review", 2, { field: "verificationInputPath" });
  const rows = currentCampaignRows(root, definition);
  if (rows.reportSeed.terminalState === "complete") {
    const challengeRefs = rows.reportSeed.limitations.flatMap((row) => row.evidenceRefs);
    if (!input.evidenceRefs.every((reference) => challengeRefs.includes(reference))) {
      throw new WorkCampaignError("partial finalization evidence differs from the supplied final challenge", 2, { field: "verificationInputPath" });
    }
    const recoveredBudget = incrementBudget(current, definition, input.evidenceBytes, 0, input.assignment.budgets.modelCalls, 0, 0);
    return appendTerminalTransitions(root, definition, definitionDigest, current, recoveredBudget, [...new Set([...current.evidenceRefs, ...input.evidenceRefs])].sort(), "verify");
  }
  const report = readCampaignReport(root, definition);
  const currentCandidateDigest = readCampaignCandidateDigest(root, definition);
  if (report.closure.candidateDigest !== currentCandidateDigest) {
    return pausedVerificationResult(definition, definitionDigest, input.evidenceRefs, "Current tracked source differs from the candidate that produced aggregate validation and proof.");
  }
  if (!currentVerificationArtifacts(root, definition, currentCandidateDigest, rows.reportSeed)) {
    return pausedVerificationResult(definition, definitionDigest, input.evidenceRefs, "Current aggregate validation or real-boundary proof evidence is missing, stale, or unreadable.");
  }
  const blockIds = rows.blocks.map((block) => block.id).sort();
  if (input.assignment.candidateDigest !== report.closure.candidateDigest || input.assignment.definitionDigest !== definitionDigest
    || !sameStrings(input.assignment.sourceBlockIds, blockIds) || input.closure.challengeStatus !== "complete"
    || input.closure.terminalState !== "unknown" || !challengeMatchesCurrent(report.closure, input.closure)) {
    throw new WorkCampaignError("final challenge does not match the current pre-challenge closure", 2, { field: "closure" });
  }
  if (!closureReadyForCompletion(report.closure, rows.reportSeed)) {
    return pausedVerificationResult(definition, definitionDigest, input.evidenceRefs, "Current campaign facts do not permit terminal completion.");
  }
  const nextBudget = incrementBudget(current, definition, input.evidenceBytes, 0, input.assignment.budgets.modelCalls, 0, 0);
  const refs = [...new Set([...current.evidenceRefs, ...input.evidenceRefs])].sort();
  const terminalSeed: CampaignReportSeed = {
    ...rows.reportSeed,
    challengeStatus: "complete",
    limitations: rows.reportSeed.limitations.map((row) => ({ ...row, evidenceRefs: [...new Set([...row.evidenceRefs, ...input.evidenceRefs])].sort() })),
    matrixRows: rows.reportSeed.matrixRows.map((row) => ({ ...row, evidenceRefs: [...new Set([...row.evidenceRefs, ...input.evidenceRefs])].sort() })),
    maximumClaim: `One disposable configured local campaign completed ${report.closure.workItems.fixedAndVerified} fixed-and-verified P0/P1 item(s) across ${report.closure.waves.total} archived and checkpointed wave(s) through current re-review, aggregate validation, real-boundary proof, and final challenge; population and host claims remain outside this result.`,
    terminalState: "complete",
  };
  const lease = acquireCampaignWriterLease(root, definition, {
    createdAt: nextCreatedAt(current),
    executableDigest: executableDigest(),
    pid: process.pid,
    processRef: `process:work-campaign-${process.pid}`,
  });
  let terminalResult: WorkCampaignResult;
  try {
    appendCampaignLedgerRecord(root, definition, terminalSeed);
    terminalResult = appendTerminalTransitions(root, definition, definitionDigest, current, nextBudget, refs, "verify", lease);
  } finally {
    releaseCampaignWriterLease(root, definition, lease);
  }
  return terminalResult;
}

export function verifyCampaign(
  root: string,
  definition: WorkCampaignDefinition,
  definitionDigest: string,
  adapter: WorkCampaignAdapter,
  verificationInputPath: string,
  missionOptions?: CampaignMissionOptions,
): WorkCampaignResult {
  const replay = replayCampaignState(root, definition);
  const current = readCampaignStateProjection(root, definition);
  if (replay.status !== "valid" || replay.writerStatus !== "clear" || current == null) {
    return result(definition, definitionDigest, "verify", {
      cleanup: replay.writerStatus === "clear" ? "not-required" : "unknown",
      disposition: "paused-unknown",
      errorClass: "unknown",
      errorMessage: "Campaign state or writer ownership is not current for verification.",
      evidenceRefs: [],
      phase: "verify",
      writerClosure: replay.writerStatus === "clear" ? "terminal" : "unknown",
    });
  }
  if (current.lastTransitionKind === "terminal-complete") return resultFromProjection(root, definition, definitionDigest, "verify", current);
  if (current.lastTransitionKind === "report-materialized") {
    return appendTerminalTransitions(root, definition, definitionDigest, current, current.budget, current.evidenceRefs, "verify");
  }
  const input = loadValidatedVerificationInput(root, verificationInputPath, definition, definitionDigest);
  if (input.inputType === "semantic-rereview-input") return verifyRereview(root, definition, definitionDigest, adapter, current, input);
  if (input.inputType === "semantic-reconciliation-input") return verifyReconciliation(root, definition, definitionDigest, current, input);
  if (input.inputType === "semantic-wave-input") return verifyNextWave(root, definition, definitionDigest, current, input, missionOptions);
  return verifyFinalChallenge(root, definition, definitionDigest, current, input);
}

export function resumeCampaign(
  root: string,
  definition: WorkCampaignDefinition,
  definitionDigest: string,
): WorkCampaignResult {
  const replay = replayCampaignState(root, definition);
  const current = readCampaignStateProjection(root, definition);
  if (replay.status !== "valid" || replay.writerStatus !== "clear" || current == null) {
    return result(definition, definitionDigest, "resume", {
      cleanup: replay.writerStatus === "clear" ? "not-required" : "unknown",
      disposition: "paused-unknown",
      errorClass: "unknown",
      errorMessage: "Campaign state or writer ownership is not current for resume.",
      evidenceRefs: [],
      phase: "mission",
      writerClosure: replay.writerStatus === "clear" ? "terminal" : "unknown",
    });
  }
  if (current.lastTransitionKind === "report-materialized"
    || current.lastTransitionKind === "pause" && current.evidenceRefs.includes("blocker:terminal-evidence-currentness-required")) {
    return appendTerminalTransitions(root, definition, definitionDigest, current, current.budget, current.evidenceRefs, "resume");
  }
  if (current.lastTransitionKind !== "mission-launch" && current.lastTransitionKind !== "mission-terminal"
    && current.lastTransitionKind !== "product-decision-required" && current.lastTransitionKind !== "waiting") {
    return resultFromProjection(root, definition, definitionDigest, "resume", current);
  }
  if (current.missionRef == null || current.waveId == null) return resultFromProjection(root, definition, definitionDigest, "resume", current);
  const handoff = observeCampaignMission(root, definition, current.waveId);
  if (handoff.disposition === "product-decision-required" || handoff.disposition === "waiting") {
    return consumeScopedMissionStop(root, definition, definitionDigest, handoff);
  }
  if (handoff.disposition !== "complete") return missionObservationResult(definition, definitionDigest, "resume", handoff);
  return consumeCompletedMission(root, definition, definitionDigest, handoff);
}

function currentResult(
  root: string,
  definition: WorkCampaignDefinition,
  definitionDigest: string,
  operation: "replay" | "status",
): WorkCampaignResult {
  const replay = replayCampaignState(root, definition);
  if (replay.status !== "valid") {
    return result(definition, definitionDigest, operation, {
      cleanup: replay.writerStatus === "clear" ? "not-required" : "unknown",
      disposition: replay.writerStatus === "clear" ? "blocked" : "paused-unknown",
      errorClass: replay.writerStatus === "clear" ? "immutable-input" : "unknown",
      errorMessage: replay.sequence === 0 ? "Campaign has not started." : "Campaign state, projection, stop intent, or writer ownership is not current.",
      evidenceRefs: [],
      phase: "inventory",
      writerClosure: replay.writerStatus === "clear" ? "terminal" : "unknown",
    });
  }
  const projection = readCampaignStateProjection(root, definition);
  if (projection == null) throw new WorkCampaignError("campaign projection is missing after valid replay", 1, { field: "statePath" });
  readCampaignReport(root, definition);
  return resultFromProjection(root, definition, definitionDigest, operation, projection);
}

export function statusCampaign(root: string, definition: WorkCampaignDefinition, definitionDigest: string): WorkCampaignResult {
  const current = currentResult(root, definition, definitionDigest, "status");
  const projection = readCampaignStateProjection(root, definition);
  const missionHandoff = projection?.activeOperation?.writer.owner === "mission" && projection.waveId != null
    ? observeCampaignMission(root, definition, projection.waveId)
    : null;
  const reported = missionHandoff == null
    ? current
    : missionObservationResult(definition, definitionDigest, "status", missionHandoff);
  let supervision: WorkCampaignResult["supervision"];
  if (reported.writerClosure === "unknown" || reported.cleanup === "unknown") {
    supervision = { action: "unknown", reason: "writer-or-cleanup-unknown" };
  } else if (projection == null) {
    supervision = reported.errorMessage === "Campaign has not started."
      ? { action: "suppress", reason: "not-started" }
      : { action: "suppress", reason: "definition-or-project-drift" };
  } else if (missionHandoff != null
    && (missionHandoff.disposition === "complete" || missionHandoff.disposition === "product-decision-required" || missionHandoff.disposition === "waiting")
    && missionHandoff.writerClosure === "terminal" && missionHandoff.cleanupClosure === "terminal"
    && projection?.lastTransitionKind === "mission-launch") {
    supervision = { action: "resume", reason: "runtime-interruption-ready" };
  } else if (projection.activeOperation != null) {
    supervision = { action: "suppress", reason: "active-operation" };
  } else if (reported.disposition === "paused-stop") {
    supervision = { action: "suppress", reason: "explicit-stop" };
  } else if (reported.disposition === "paused-budget") {
    supervision = { action: "suppress", reason: "budget" };
  } else if (reported.disposition === "owner-required") {
    supervision = { action: "suppress", reason: "owner-protected" };
  } else if (reported.disposition === "product-decision-required") {
    supervision = { action: "suppress", reason: "product-decision" };
  } else if (reported.disposition === "waiting") {
    supervision = { action: "suppress", reason: "non-product-wait" };
  } else if (reported.disposition === "complete") {
    supervision = { action: "suppress", reason: "complete" };
  } else if (projection.lastTransitionKind === "pause" && projection.evidenceRefs.includes("blocker:terminal-evidence-currentness-required")) {
    const rows = currentCampaignRows(root, definition);
    const candidateDigest = readCampaignCandidateDigest(root, definition);
    supervision = currentVerificationArtifacts(root, definition, candidateDigest, rows.reportSeed)
      ? { action: "resume", reason: "terminal-evidence-restored" }
      : { action: "suppress", reason: "definition-or-project-drift" };
  } else if (reported.disposition === "blocked") {
    supervision = { action: "suppress", reason: "definition-or-project-drift" };
  } else {
    supervision = { action: "suppress", reason: "external-input-required" };
  }
  return parseWorkCampaignRecord({ ...reported, supervision }) as WorkCampaignResult;
}

export function replayCampaign(root: string, definition: WorkCampaignDefinition, definitionDigest: string): WorkCampaignResult {
  return currentResult(root, definition, definitionDigest, "replay");
}

export function stopCampaign(
  root: string,
  definition: WorkCampaignDefinition,
  definitionDigest: string,
  source: "operator" | "signal" | "supervisor",
  evidenceRef: string,
): WorkCampaignResult {
  const replay = replayCampaignState(root, definition);
  if (replay.status !== "valid" || replay.writerStatus !== "clear") {
    return result(definition, definitionDigest, "stop", {
      cleanup: replay.writerStatus === "clear" ? "not-required" : "unknown",
      disposition: "paused-unknown",
      errorClass: "unknown",
      errorMessage: "Stop intent cannot close while campaign state or writer ownership is unknown.",
      evidenceRefs: [evidenceRef],
      phase: "paused",
      writerClosure: replay.writerStatus === "clear" ? "terminal" : "unknown",
    });
  }
  const current = readCampaignStateProjection(root, definition);
  if (current == null) throw new WorkCampaignError("cannot stop a campaign before its preflight transition", 1, { field: "statePath" });
  recordCampaignStopIntent(root, definition, { evidenceRef, source });
  if (current.disposition === "paused-stop" && current.stopRequested) return resultFromProjection(root, definition, definitionDigest, "stop", current);
  const missionActive = current.activeOperation?.writer.owner === "mission" && current.waveId != null;
  let missionOwnershipUnknown = false;
  let missionEvidenceRefs: string[] = [];
  if (missionActive && current.waveId != null) {
    requestCampaignMissionStop(root, definition, current.waveId);
    const handoff = observeCampaignMission(root, definition, current.waveId);
    missionOwnershipUnknown = handoff.writerClosure === "unknown" || handoff.cleanupClosure === "unknown";
    missionEvidenceRefs = handoffEvidenceRefs(handoff);
  }
  const started = Date.now();
  const lease = acquireCampaignWriterLease(root, definition, {
    createdAt: new Date(started).toISOString(),
    executableDigest: executableDigest(),
    pid: process.pid,
    processRef: `process:work-campaign-${process.pid}`,
  });
  try {
    const evidenceRefs = [...new Set([...current.evidenceRefs, evidenceRef, ...missionEvidenceRefs])].sort();
    recordCampaignTransitionWithLease(root, definition, descriptor({
      activeOperation: current.activeOperation,
      budget: current.budget,
      disposition: current.disposition,
      eventId: "controller-stop-requested",
      evidenceRefs,
      identities: current.identities,
      kind: "stop-requested",
      missionRef: current.missionRef,
      phase: current.phase,
      stopRequested: true,
      waveId: current.waveId,
    }, new Date(started).toISOString()), lease);
    recordCampaignTransitionWithLease(root, definition, descriptor({
      activeOperation: missionOwnershipUnknown ? current.activeOperation : null,
      budget: current.budget,
      disposition: missionOwnershipUnknown ? "paused-unknown" : "paused-stop",
      eventId: "controller-stop-pause",
      evidenceRefs,
      identities: current.identities,
      kind: "pause",
      missionRef: current.missionRef,
      phase: "paused",
      stopRequested: true,
      waveId: current.waveId,
    }, new Date(started + 1).toISOString()), lease);
  } finally {
    releaseCampaignWriterLease(root, definition, lease);
  }
  const projection = readCampaignStateProjection(root, definition);
  if (projection == null) throw new WorkCampaignError("campaign projection is missing after stop", 1, { field: "statePath" });
  return resultFromProjection(root, definition, definitionDigest, "stop", projection);
}
