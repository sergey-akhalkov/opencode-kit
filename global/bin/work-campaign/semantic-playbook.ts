import path from "node:path";

import {
  type CampaignInventoryBlock,
  type CampaignInvestigationResult,
  type CampaignPartitionResult,
  type CampaignReconciliationResult,
  type CampaignWaveManifest,
  type CampaignWorkItem,
  WorkCampaignError,
} from "./contracts.ts";
import type { EffectClass } from "../roadmap-mission/contracts.ts";
import {
  parseSemanticAssignment,
  type SemanticAssignment,
  type SemanticAssignmentResult,
} from "./semantic-executor.ts";

export type SemanticPlaybookJob = {
  assignment: SemanticAssignment;
  resultPath: string;
};

export type SemanticPlaybookContext = {
  allowedEffects: EffectClass[];
  blocks: CampaignInventoryBlock[];
  campaignId: string;
  candidateDigest: string;
  definitionDigest: string;
  inventoryDigest: string;
  modelCallBudget: number;
};

export type SemanticPlaybookFactory = {
  discovery(context: SemanticPlaybookContext): SemanticPlaybookJob[];
  investigation(
    context: SemanticPlaybookContext,
    item: CampaignWorkItem,
    reconciliation: CampaignReconciliationResult,
  ): SemanticPlaybookJob;
  reconciliation(context: SemanticPlaybookContext, item: CampaignWorkItem): SemanticPlaybookJob;
  synthesis(
    context: SemanticPlaybookContext,
    items: CampaignWorkItem[],
    reconciliations: CampaignReconciliationResult[],
  ): SemanticPlaybookJob;
};

export type SemanticPlaybookResult = {
  assignments: SemanticAssignment[];
  blockingWorkItemIds: string[];
  failure: {
    assignmentId: string | null;
    cleanup: SemanticAssignmentResult["cleanup"];
    errorClass: "budget" | "transient" | "unknown";
    evidenceRefs: string[];
    retryAllowed: boolean;
  } | null;
  investigations: CampaignInvestigationResult[];
  partitions: CampaignPartitionResult[];
  reconciliations: CampaignReconciliationResult[];
  status: "blocked" | "complete" | "paused-budget" | "paused-transient" | "paused-unknown" | "product-decision-required" | "waiting";
  wave: CampaignWaveManifest | null;
  workItems: CampaignWorkItem[];
};

export type SemanticPlaybookExecutor = (job: SemanticPlaybookJob) => Promise<SemanticAssignmentResult>;

class SemanticPlaybookPause extends Error {
  readonly failure: NonNullable<SemanticPlaybookResult["failure"]>;
  readonly status: "paused-budget" | "paused-transient" | "paused-unknown";

  constructor(
    status: "paused-budget" | "paused-transient" | "paused-unknown",
    failure: NonNullable<SemanticPlaybookResult["failure"]>,
    options: { cause?: unknown } = {},
  ) {
    super(`semantic playbook ${status}`);
    this.name = "SemanticPlaybookPause";
    this.failure = failure;
    this.status = status;
    if (options.cause !== undefined) (this as Error & { cause?: unknown }).cause = options.cause;
  }
}

function sameStrings(left: string[], right: string[]): boolean {
  return JSON.stringify([...left].sort()) === JSON.stringify([...right].sort());
}

function expectedBlocks(context: SemanticPlaybookContext): string[] {
  return context.blocks
    .filter((block) => block.classification === "maintained" && block.exclusionReason == null)
    .map((block) => block.id)
    .sort();
}

function checkedJob(
  context: SemanticPlaybookContext,
  job: SemanticPlaybookJob,
  assignmentType: SemanticAssignment["assignmentType"],
  sourceBlockIds?: string[],
): SemanticPlaybookJob {
  const assignment = parseSemanticAssignment(job.assignment);
  if (assignment.assignmentType !== assignmentType || assignment.campaignId !== context.campaignId
    || assignment.candidateDigest !== context.candidateDigest || assignment.definitionDigest !== context.definitionDigest
    || sourceBlockIds != null && !sameStrings(assignment.sourceBlockIds, sourceBlockIds)) {
    throw new WorkCampaignError(`${assignmentType} assignment differs from the playbook context`, 2, { field: "assignment" });
  }
  if (path.isAbsolute(job.resultPath) || job.resultPath.split(/[\\/]/u).includes("..") || job.resultPath.trim() === "") {
    throw new WorkCampaignError(`${assignmentType} resultPath must be a contained relative path`, 2, { field: "resultPath" });
  }
  return { assignment, resultPath: job.resultPath.replaceAll("\\", "/") };
}

export function validateSemanticPlaybookResult(job: SemanticPlaybookJob, result: SemanticAssignmentResult): SemanticAssignmentResult {
  const assignment = job.assignment;
  if (result.assignmentId !== assignment.assignmentId || result.assignmentType !== assignment.assignmentType
    || result.campaignId !== assignment.campaignId || result.candidateDigest !== assignment.candidateDigest
    || result.definitionDigest !== assignment.definitionDigest || result.phase !== assignment.phase
    || result.status !== "complete" || result.cleanup !== "complete" || result.errorClass !== "none"
    || result.modelCalls !== 1 || result.sessionRef == null || result.payload == null
    || result.verification.parentless !== true || result.verification.children !== 0
    || result.verification.fileDiffs !== 0 || result.verification.permissionRequests !== 0
    || result.verification.questions !== 0) {
    throw new WorkCampaignError(`semantic assignment ${assignment.assignmentId} did not reach terminal read-only completion`, 1, { field: "assignment" });
  }
  return result;
}

export function validateSemanticRetryJob(
  priorJob: SemanticPlaybookJob,
  priorResult: SemanticAssignmentResult,
  retryJob: SemanticPlaybookJob,
): SemanticPlaybookJob {
  const prior = parseSemanticAssignment(priorJob.assignment);
  const retry = parseSemanticAssignment(retryJob.assignment);
  if (JSON.stringify(prior) !== JSON.stringify(retry)
    || priorJob.resultPath === retryJob.resultPath
    || priorResult.assignmentId !== prior.assignmentId
    || priorResult.errorClass !== "runtime" && priorResult.errorClass !== "timeout"
    || priorResult.status !== "blocked" || priorResult.cleanup !== "complete"
    || priorResult.modelCalls !== 1 || priorResult.evidenceRefs.length === 0
    || priorResult.verification.children !== 0 || priorResult.verification.fileDiffs !== 0
    || priorResult.verification.parentless !== true || priorResult.verification.permissionRequests !== 0
    || priorResult.verification.questions !== 0) {
    throw new WorkCampaignError("semantic retry requires one immutable assignment, a new result path, and a terminal transient result", 2, { field: "assignment" });
  }
  return { assignment: retry, resultPath: retryJob.resultPath };
}

async function settleJobs(
  jobs: SemanticPlaybookJob[],
  execute: SemanticPlaybookExecutor,
): Promise<SemanticAssignmentResult[]> {
  const settled = await Promise.allSettled(jobs.map((job) => execute(job)));
  const failed = settled.find((result) => result.status === "rejected");
  if (failed?.status === "rejected") {
    throw new SemanticPlaybookPause("paused-unknown", {
      assignmentId: null,
      cleanup: "unknown",
      errorClass: "unknown",
      evidenceRefs: [],
      retryAllowed: false,
    }, { cause: failed.reason });
  }
  return settled.map((result, index) => {
    const value = (result as PromiseFulfilledResult<SemanticAssignmentResult>).value;
    if (value.cleanup === "unknown") {
      throw new SemanticPlaybookPause("paused-unknown", {
        assignmentId: value.assignmentId,
        cleanup: value.cleanup,
        errorClass: "unknown",
        evidenceRefs: value.evidenceRefs,
        retryAllowed: false,
      });
    }
    if (value.status === "blocked" && value.cleanup === "complete"
      && (value.errorClass === "runtime" || value.errorClass === "timeout")) {
      throw new SemanticPlaybookPause("paused-transient", {
        assignmentId: value.assignmentId,
        cleanup: value.cleanup,
        errorClass: "transient",
        evidenceRefs: value.evidenceRefs,
        retryAllowed: true,
      });
    }
    return validateSemanticPlaybookResult(jobs[index], value);
  });
}

function validateUniqueJobs(
  jobs: SemanticPlaybookJob[],
  seenIds: Set<string>,
  seenPaths: Set<string>,
  modelCallBudget: number,
): void {
  if (!Number.isSafeInteger(modelCallBudget) || modelCallBudget < 1 || seenIds.size + jobs.length > modelCallBudget) {
    throw new SemanticPlaybookPause("paused-budget", {
      assignmentId: null,
      cleanup: "not-required",
      errorClass: "budget",
      evidenceRefs: [],
      retryAllowed: false,
    });
  }
  for (const job of jobs) {
    if (seenIds.has(job.assignment.assignmentId)) throw new WorkCampaignError(`duplicate semantic assignment ${job.assignment.assignmentId}`, 2, { field: "assignment" });
    if (seenPaths.has(job.resultPath)) throw new WorkCampaignError(`shared semantic resultPath ${job.resultPath}`, 2, { field: "resultPath" });
    seenIds.add(job.assignment.assignmentId);
    seenPaths.add(job.resultPath);
  }
}

function finalizedItem(
  item: CampaignWorkItem,
  reconciliation: CampaignReconciliationResult,
  investigation: CampaignInvestigationResult | undefined,
): CampaignWorkItem {
  if (reconciliation.producerSessionRef === item.producerSessionRef) {
    throw new WorkCampaignError(`work item ${item.id} producer cannot reconcile its own candidate`, 2, { field: "assignment" });
  }
  if (reconciliation.disposition === "confirmed") {
    if (reconciliation.severity === "P0" || reconciliation.severity === "P1") return { ...item, status: "confirmed" };
    if (reconciliation.severity === "P2" || reconciliation.severity === "P3") return { ...item, status: "report-only" };
    throw new WorkCampaignError(`confirmed work item ${item.id} requires a supported severity`, 2, { field: "assignment" });
  }
  if (reconciliation.disposition === "falsified") return { ...item, status: "falsified" };
  if (reconciliation.disposition === "duplicate") return { ...item, status: "duplicate" };
  if (investigation == null) return { ...item, status: "unknown-material" };
  if (investigation.producerSessionRef === item.producerSessionRef
    || investigation.producerSessionRef === reconciliation.producerSessionRef) {
    throw new WorkCampaignError(`work item ${item.id} investigation is not fresh`, 2, { field: "assignment" });
  }
  if (investigation.result === "confirmed") {
    if (reconciliation.severity !== "P0" && reconciliation.severity !== "P1") {
      throw new WorkCampaignError(`investigated work item ${item.id} has no material severity`, 2, { field: "assignment" });
    }
    return { ...item, status: "confirmed" };
  }
  if (investigation.result === "falsified") return { ...item, status: "falsified" };
  if (investigation.result === "product-decision-required") return { ...item, status: "product-decision-required" };
  if (investigation.result === "owner-required" || investigation.result === "waiting") return { ...item, status: "waiting" };
  return { ...item, status: "unknown-material" };
}

export async function runSemanticPlaybook(
  context: SemanticPlaybookContext,
  factory: SemanticPlaybookFactory,
  execute: SemanticPlaybookExecutor,
): Promise<SemanticPlaybookResult> {
  const seenIds = new Set<string>();
  const seenPaths = new Set<string>();
  const partitions: CampaignPartitionResult[] = [];
  const discoveredItems: CampaignWorkItem[] = [];
  const assignments: SemanticAssignment[] = [];
  const reconciliations: CampaignReconciliationResult[] = [];
  const investigations: CampaignInvestigationResult[] = [];
  const workItems: CampaignWorkItem[] = [];
  try {
    const blockIds = context.blocks.map((block) => block.id);
    if (new Set(blockIds).size !== blockIds.length) throw new WorkCampaignError("inventory block ids must be unique", 2, { field: "blocks" });
    const expected = expectedBlocks(context);
    if (expected.length === 0) throw new WorkCampaignError("semantic playbook requires at least one maintained inventory block", 2, { field: "blocks" });

    const discoveryJobs = factory.discovery(context).map((job) => checkedJob(context, job, "discovery"));
    validateUniqueJobs(discoveryJobs, seenIds, seenPaths, context.modelCallBudget);
    const assignedBlocks = discoveryJobs.flatMap((job) => job.assignment.sourceBlockIds).sort();
    if (!sameStrings(assignedBlocks, expected) || new Set(assignedBlocks).size !== assignedBlocks.length) {
      throw new WorkCampaignError("discovery assignments must partition every maintained block exactly once", 2, { field: "assignment" });
    }

    assignments.push(...discoveryJobs.map((job) => job.assignment));
    const discoveryResults = await settleJobs(discoveryJobs, execute);
    for (let index = 0; index < discoveryResults.length; index++) {
      const payload = discoveryResults[index].payload as { partition?: CampaignPartitionResult; workItems?: CampaignWorkItem[] };
      if (payload.partition == null || !Array.isArray(payload.workItems)
        || payload.partition.inventoryDigest !== context.inventoryDigest
        || !sameStrings(payload.partition.blockIds, discoveryJobs[index].assignment.sourceBlockIds)
        || !sameStrings(payload.partition.workItemIds, payload.workItems.map((item) => item.id))
        || payload.workItems.some((item) => item.status !== "candidate" || item.candidateDigest !== context.candidateDigest
          || item.producerSessionRef !== payload.partition?.producerSessionRef
          || item.sourceBlockIds.some((id) => !payload.partition?.blockIds.includes(id)))) {
        throw new WorkCampaignError(`discovery assignment ${discoveryJobs[index].assignment.assignmentId} returned an invalid partition`, 1, { field: "assignment" });
      }
      partitions.push(payload.partition);
      discoveredItems.push(...payload.workItems);
    }
    if (new Set(partitions.map((partition) => partition.producerSessionRef)).size !== partitions.length
      || new Set(discoveredItems.map((item) => item.id)).size !== discoveredItems.length) {
      throw new WorkCampaignError("discovery partitions require fresh producers and unique work items", 2, { field: "assignment" });
    }

    for (const item of [...discoveredItems].sort((left, right) => left.id.localeCompare(right.id))) {
      const reconciliationJob = checkedJob(context, factory.reconciliation(context, item), "reconciliation", item.sourceBlockIds);
      validateUniqueJobs([reconciliationJob], seenIds, seenPaths, context.modelCallBudget);
      assignments.push(reconciliationJob.assignment);
      const reconciliationResult = (await settleJobs([reconciliationJob], execute))[0];
      const reconciliation = (reconciliationResult.payload as { reconciliation?: CampaignReconciliationResult }).reconciliation;
      if (reconciliation == null || reconciliation.workItemId !== item.id
        || !item.sourceBlockIds.some((id) => context.blocks.find((block) => block.id === id)?.digest === reconciliation.sourceDigest)) {
        throw new WorkCampaignError(`work item ${item.id} has no current source-correlated reconciliation`, 1, { field: "assignment" });
      }
      reconciliations.push(reconciliation);

      let investigation: CampaignInvestigationResult | undefined;
      if (reconciliation.disposition === "unknown") {
        const investigationJob = checkedJob(context, factory.investigation(context, item, reconciliation), "investigation", item.sourceBlockIds);
        validateUniqueJobs([investigationJob], seenIds, seenPaths, context.modelCallBudget);
        assignments.push(investigationJob.assignment);
        const investigationResult = (await settleJobs([investigationJob], execute))[0];
        investigation = (investigationResult.payload as { investigation?: CampaignInvestigationResult }).investigation;
        if (investigation == null || investigation.workItemId !== item.id || !sameStrings(investigation.sourceBlockIds, item.sourceBlockIds)) {
          throw new WorkCampaignError(`work item ${item.id} returned an invalid investigation`, 1, { field: "assignment" });
        }
        investigations.push(investigation);
      }
      const finalized = finalizedItem(item, reconciliation, investigation);
      workItems.push(finalized.status === "confirmed"
        && finalized.effectClasses.some((effect) => !context.allowedEffects.includes(effect))
        ? { ...finalized, status: "waiting" }
        : finalized);
    }

    const unknownWorkItemIds = workItems
      .filter((item) => item.status === "unknown-material")
      .map((item) => item.id)
      .sort();
    const ownerRequiredIds = workItems
      .filter((item) => item.status === "owner-required")
      .map((item) => item.id)
      .sort();
    const productDecisionIds = workItems
      .filter((item) => item.status === "product-decision-required")
      .map((item) => item.id)
      .sort();
    const waitingIds = workItems
      .filter((item) => item.status === "waiting")
      .map((item) => item.id)
      .sort();
    const blockingWorkItemIds = [...unknownWorkItemIds, ...ownerRequiredIds, ...productDecisionIds, ...waitingIds].sort();
    const completionStatus = productDecisionIds.length > 0
      ? "product-decision-required"
      : ownerRequiredIds.length > 0 || waitingIds.length > 0 ? "waiting" : "complete";
    if (unknownWorkItemIds.length > 0) {
      return { assignments, blockingWorkItemIds, failure: null, investigations, partitions, reconciliations, status: "blocked", wave: null, workItems };
    }

    const eligibleItems = workItems.filter((item) => item.status === "confirmed");
    if (eligibleItems.length === 0) {
      return {
        assignments,
        blockingWorkItemIds,
        failure: null,
        investigations,
        partitions,
        reconciliations,
        status: completionStatus,
        wave: null,
        workItems,
      };
    }

    const synthesisBlocks = [...new Set(eligibleItems.flatMap((item) => item.sourceBlockIds))].sort();
    const synthesisJob = checkedJob(context, factory.synthesis(context, eligibleItems, reconciliations), "synthesis", synthesisBlocks);
    validateUniqueJobs([synthesisJob], seenIds, seenPaths, context.modelCallBudget);
    assignments.push(synthesisJob.assignment);
    const synthesisResult = (await settleJobs([synthesisJob], execute))[0];
    const wave = (synthesisResult.payload as { wave?: CampaignWaveManifest }).wave;
    if (wave == null) throw new WorkCampaignError("synthesis returned no wave candidate", 1, { field: "assignment" });
    return {
      assignments,
      blockingWorkItemIds,
      failure: null,
      investigations,
      partitions,
      reconciliations,
      status: completionStatus,
      wave,
      workItems,
    };
  } catch (error) {
    if (!(error instanceof SemanticPlaybookPause)) throw error;
    return {
      assignments,
      blockingWorkItemIds: [],
      failure: error.failure,
      investigations,
      partitions,
      reconciliations,
      status: error.status,
      wave: null,
      workItems,
    };
  }
}
