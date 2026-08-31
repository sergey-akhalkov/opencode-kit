import type { TextPartInput } from "@opencode-ai/sdk/v2";
import { parsePersistedWorkFrontier, type WorkFrontierAssessment } from "./frontier.ts";
import type {
  AuditEpoch,
  CompletionVerdict,
  GuardContinuation,
  OwnerBoundaryVerdict,
  RootPromptContext,
} from "./types.ts";
import { validateQuestionAnswers } from "./question.ts";

const VERDICT_VALUES = new Set(["allow_stop", "continue", "product_decision_required", "user_paused", "waiting"]);
const CONFIDENCE_VALUES = new Set(["high", "medium", "low"]);
const REQUIREMENT_STATUS_VALUES = new Set(["complete", "deferred", "product_decision_required", "unresolved"]);
const QUESTION_ACTION_VALUES = new Set(["answer", "defer", "present-product-decision"]);
const WAIT_KIND_VALUES = new Set(["budget", "capability", "external", "live-attempt", "process", "safety", "technical", "writer-liveness"]);

function record(value: unknown): Record<string, unknown> | null {
  return value != null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

export function parseCompletionVerdictText(parts: unknown[], epoch: AuditEpoch): CompletionVerdict {
  const text = parts
    .map(record)
    .filter((part) => part?.type === "text")
    .map((part) => typeof part?.text === "string" ? part.text : "")
    .join("")
    .trim();
  if (text.length === 0 || !text.startsWith("{") || !text.endsWith("}")) {
    throw new Error("Completion arbiter must return one exact JSON object");
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch (error) {
    const malformed = new Error("Completion arbiter returned malformed JSON") as Error & { cause?: unknown };
    malformed.cause = error;
    throw malformed;
  }
  return parseCompletionVerdict(parsed, epoch);
}

function requiredString(value: unknown, field: string, max = 4_000): string {
  if (typeof value !== "string" || value.trim() === "" || value.length > max) {
    throw new Error(`Invalid completion verdict field: ${field}`);
  }
  return value;
}

function stringArray(value: unknown, field: string, maxItems = 256): string[] {
  if (!Array.isArray(value) || value.length > maxItems || value.some((item) => typeof item !== "string")) {
    throw new Error(`Invalid completion verdict field: ${field}`);
  }
  return value as string[];
}

function uniqueStringArray(value: unknown, field: string, maxItems = 256): string[] {
  const result = stringArray(value, field, maxItems);
  if (new Set(result).size !== result.length) throw new Error(`Invalid completion verdict field: ${field}`);
  return result;
}

function nullableString(value: unknown, field: string, max = 4_000): string | null {
  return value === null ? null : requiredString(value, field, max);
}

function nonNegativeInteger(value: unknown, field: string): number {
  if (typeof value !== "number" || !Number.isInteger(value) || value < 0) {
    throw new Error(`Invalid completion verdict field: ${field}`);
  }
  return value;
}

function sameRefs(left: string[], right: string[]): boolean {
  return JSON.stringify([...left].sort()) === JSON.stringify([...right].sort());
}

function exactKeys(value: Record<string, unknown>, expected: readonly string[], field: string): void {
  const actual = Object.keys(value).sort();
  const wanted = [...expected].sort();
  if (actual.length !== wanted.length || actual.some((key, index) => key !== wanted[index])) {
    const actualKeys = new Set(actual);
    const wantedKeys = new Set(wanted);
    const missing = wanted.filter((key) => !actualKeys.has(key));
    const unexpected = actual.filter((key) => !wantedKeys.has(key));
    throw new Error(
      `Invalid completion verdict field: ${field} keys; missing=${missing.join(",") || "none"}; unexpected=${unexpected.join(",") || "none"}`,
    );
  }
}

function ownerBoundary(value: unknown): OwnerBoundaryVerdict | null {
  if (value == null) return null;
  const boundary = record(value);
  if (boundary == null) throw new Error("Invalid completion verdict field: ownerBoundary");
  exactKeys(
    boundary,
    ["affectedItemRefs", "consequences", "decision", "evidenceRefs", "resumeCondition"],
    "ownerBoundary",
  );
  return {
    affectedItemRefs: uniqueStringArray(boundary.affectedItemRefs, "ownerBoundary.affectedItemRefs", 16),
    consequences: uniqueStringArray(boundary.consequences, "ownerBoundary.consequences", 16)
      .map((value, index) => requiredString(value, `ownerBoundary.consequences[${index}]`, 1_000)),
    decision: requiredString(boundary.decision, "ownerBoundary.decision", 2_000),
    evidenceRefs: uniqueStringArray(boundary.evidenceRefs, "ownerBoundary.evidenceRefs", 64),
    resumeCondition: requiredString(boundary.resumeCondition, "ownerBoundary.resumeCondition", 2_000),
  };
}

function frontierAssessment(epoch: AuditEpoch): WorkFrontierAssessment {
  const projection = epoch.completionEvidence?.workFrontier;
  if (projection?.status !== "present" || projection.assessment == null) {
    throw new Error("Completion verdict requires current work frontier evidence");
  }
  const assessment = parsePersistedWorkFrontier(projection.assessment.frontier);
  if (
    assessment.frontier.basisHumanRef !== epoch.inspected.humanRef ||
    assessment.frontier.taskStateDigest !== epoch.inspected.todoDigest ||
    assessment.frontierState !== projection.assessment.frontierState ||
    !sameRefs(assessment.runnableItemRefs, projection.assessment.runnableItemRefs) ||
    !sameRefs(assessment.openGateRefs, projection.assessment.openGateRefs) ||
    !sameRefs(assessment.parkedDecisionRefs, projection.assessment.parkedDecisionRefs)
  ) {
    throw new Error("Completion verdict frontier correlation mismatch");
  }
  return assessment;
}

export function parseCompletionVerdict(value: unknown, epoch: AuditEpoch): CompletionVerdict {
  const input = record(value);
  if (input == null || input.schemaVersion !== 2) {
    throw new Error("Unsupported or missing completion verdict schemaVersion");
  }
  exactKeys(input, [
    "auditID",
    "confidence",
    "deferredGateRefs",
    "evidenceGaps",
    "evidenceRefs",
    "frontierGeneration",
    "goalSummary",
    "inspectedRevision",
    "ownerBoundary",
    "parkedDecisionRefs",
    "questionAction",
    "questionAnswers",
    "requirementMatrix",
    "resumeCondition",
    "rootSessionRef",
    "runnableItemRefs",
    "schemaVersion",
    "selectedItemRef",
    "strategyAssessment",
    "unresolved",
    "verdict",
    "waitKind",
  ], "root");
  const auditID = requiredString(input.auditID, "auditID");
  const rootSessionRef = requiredString(input.rootSessionRef, "rootSessionRef");
  const inspectedRevision = requiredString(input.inspectedRevision, "inspectedRevision");
  if (
    auditID !== epoch.auditID ||
    rootSessionRef !== epoch.rootRef ||
    inspectedRevision !== epoch.inspected.revisionDigest
  ) {
    throw new Error("Completion verdict correlation mismatch");
  }
  const frontier = frontierAssessment(epoch);
  const frontierGeneration = nonNegativeInteger(input.frontierGeneration, "frontierGeneration");
  if (frontierGeneration !== frontier.frontier.frontierGeneration) {
    throw new Error("Completion verdict frontier correlation mismatch");
  }
  if (!VERDICT_VALUES.has(String(input.verdict))) {
    throw new Error("Invalid completion verdict field: verdict");
  }
  if (!CONFIDENCE_VALUES.has(String(input.confidence))) {
    throw new Error("Invalid completion verdict field: confidence");
  }
  if (!Array.isArray(input.requirementMatrix) || input.requirementMatrix.length > 128) {
    throw new Error("Invalid completion verdict field: requirementMatrix");
  }
  const requirementMatrix = input.requirementMatrix.map((value, index) => {
    const item = record(value);
    const status = String(item?.status ?? "");
    if (item == null || !REQUIREMENT_STATUS_VALUES.has(status)) {
      throw new Error(`Invalid completion verdict requirementMatrix[${index}]`);
    }
    exactKeys(item, ["evidenceRefs", "requirementRef", "status"], `requirementMatrix[${index}]`);
    return {
      evidenceRefs: uniqueStringArray(item.evidenceRefs, `requirementMatrix[${index}].evidenceRefs`, 64),
      requirementRef: requiredString(item.requirementRef, `requirementMatrix[${index}].requirementRef`),
      status: status as CompletionVerdict["requirementMatrix"][number]["status"],
    };
  });
  if (!Array.isArray(input.unresolved) || input.unresolved.length > 64) {
    throw new Error("Invalid completion verdict field: unresolved");
  }
  const unresolved = input.unresolved.map((value, index) => {
    const item = record(value);
    if (item == null) throw new Error(`Invalid completion verdict unresolved[${index}]`);
    exactKeys(item, ["evidenceGap", "nextAction", "nextEvidence", "requirementRef", "stopCondition"], `unresolved[${index}]`);
    return {
      evidenceGap: requiredString(item.evidenceGap, `unresolved[${index}].evidenceGap`),
      nextAction: requiredString(item.nextAction, `unresolved[${index}].nextAction`),
      nextEvidence: requiredString(item.nextEvidence, `unresolved[${index}].nextEvidence`),
      requirementRef: requiredString(item.requirementRef, `unresolved[${index}].requirementRef`),
      stopCondition: requiredString(item.stopCondition, `unresolved[${index}].stopCondition`),
    };
  });
  const strategy = record(input.strategyAssessment);
  if (strategy == null || typeof strategy.repeated !== "boolean") {
    throw new Error("Invalid completion verdict field: strategyAssessment");
  }
  exactKeys(strategy, ["fingerprint", "prohibitedStrategies", "repeated", "requiredRetryEvidence"], "strategyAssessment");
  const verdict = input.verdict as CompletionVerdict["verdict"];
  const parsedOwnerBoundary = ownerBoundary(input.ownerBoundary);
  const runnableItemRefs = uniqueStringArray(input.runnableItemRefs, "runnableItemRefs", 16);
  if (!sameRefs(runnableItemRefs, frontier.runnableItemRefs)) {
    throw new Error("Completion verdict runnable set mismatch");
  }
  const selectedItemRef = nullableString(input.selectedItemRef, "selectedItemRef", 128);
  if (selectedItemRef != null && !frontier.runnableItemRefs.includes(selectedItemRef)) {
    throw new Error("Completion verdict selected item is not runnable");
  }
  const parkedDecisionRefs = uniqueStringArray(input.parkedDecisionRefs, "parkedDecisionRefs", 8);
  if (parkedDecisionRefs.some((ref) => !frontier.parkedDecisionRefs.includes(ref))) {
    throw new Error("Completion verdict contains an invented parked decision ref");
  }
  const deferredGateRefs = uniqueStringArray(input.deferredGateRefs, "deferredGateRefs", 16);
  if (deferredGateRefs.some((ref) => !frontier.openGateRefs.includes(ref))) {
    throw new Error("Completion verdict contains an invented deferred gate ref");
  }
  const questionAction = input.questionAction === null
    ? null
    : QUESTION_ACTION_VALUES.has(String(input.questionAction))
      ? input.questionAction as NonNullable<CompletionVerdict["questionAction"]>
      : (() => { throw new Error("Invalid completion verdict field: questionAction"); })();
  const waitKind = input.waitKind === null
    ? null
    : WAIT_KIND_VALUES.has(String(input.waitKind))
      ? input.waitKind as NonNullable<CompletionVerdict["waitKind"]>
      : (() => { throw new Error("Invalid completion verdict field: waitKind"); })();
  const resumeCondition = nullableString(input.resumeCondition, "resumeCondition", 2_000);
  const questionAnswers = questionAction === "answer"
    ? epoch.kind === "question"
      ? validateQuestionAnswers(input.questionAnswers, epoch.questionRequest?.questions ?? [])
      : (() => { throw new Error("Only a pending-question verdict may answer questions"); })()
    : input.questionAnswers === null
      ? null
      : (() => { throw new Error("Only questionAction=answer may define questionAnswers"); })();
  if (epoch.kind === "completion" && (questionAction === "answer" || questionAction === "defer")) {
    throw new Error("Completion audits cannot answer or defer a question");
  }
  if (epoch.kind === "question" && questionAction == null && verdict !== "user_paused") {
    throw new Error("Pending question verdict requires an explicit questionAction");
  }

  if (verdict === "continue") {
    if (frontier.frontierState !== "runnable" || runnableItemRefs.length === 0 || unresolved.length === 0) {
      throw new Error("A continue verdict requires a non-empty runnable frontier and unresolved requirement");
    }
    if (waitKind != null || resumeCondition != null || parsedOwnerBoundary != null) {
      throw new Error("A continue verdict cannot wait or define an ownerBoundary");
    }
    if (questionAction === null && (epoch.kind !== "completion" || selectedItemRef == null || deferredGateRefs.length > 0)) {
      throw new Error("A completion continue verdict requires one selected runnable item and no deferred question gate");
    }
    if (questionAction === "answer" && (selectedItemRef != null || parkedDecisionRefs.length > 0 || deferredGateRefs.length > 0)) {
      throw new Error("An autonomous answer cannot select work or classify a blocker");
    }
    if (questionAction === "defer" && (
      epoch.kind !== "question" ||
      selectedItemRef == null ||
      (parkedDecisionRefs.length === 0) === (deferredGateRefs.length === 0)
    )) {
      throw new Error("A deferred runnable question requires one selected item and exactly one blocker-ref class");
    }
    if (questionAction === "present-product-decision") {
      throw new Error("A runnable frontier cannot present a product decision");
    }
  } else if (verdict === "product_decision_required") {
    if (
      frontier.frontierState !== "product-decision" ||
      runnableItemRefs.length > 0 ||
      selectedItemRef != null ||
      waitKind != null ||
      resumeCondition != null ||
      deferredGateRefs.length > 0 ||
      parkedDecisionRefs.length !== 1 ||
      questionAction !== "present-product-decision" ||
      parsedOwnerBoundary == null ||
      unresolved.length === 0 ||
      !requirementMatrix.some((item) => item.status === "product_decision_required")
    ) {
      throw new Error("A product_decision_required verdict requires one exact empty-frontier product decision");
    }
    const decision = frontier.frontier.parkedDecisions.find((item) => item.id === parkedDecisionRefs[0]);
    if (
      decision == null ||
      !sameRefs(parsedOwnerBoundary.affectedItemRefs, decision.affectedItemRefs) ||
      parsedOwnerBoundary.evidenceRefs.some((ref) => !decision.evidenceRefs.includes(ref))
    ) {
      throw new Error("Product decision ownerBoundary does not match the parked decision");
    }
  } else if (verdict === "waiting") {
    const openNonProduct = frontier.frontier.gates
      .filter((gate) => gate.status === "open" && gate.kind !== "product-decision");
    if (
      frontier.frontierState !== "waiting" ||
      runnableItemRefs.length > 0 ||
      selectedItemRef != null ||
      waitKind == null ||
      resumeCondition == null ||
      parkedDecisionRefs.length > 0 ||
      parsedOwnerBoundary != null ||
      unresolved.length === 0 ||
      deferredGateRefs.length === 0 ||
      !sameRefs(deferredGateRefs, openNonProduct.map((gate) => gate.id)) ||
      openNonProduct.some((gate) => gate.kind !== waitKind) ||
      (epoch.kind === "completion" ? questionAction !== null : questionAction !== "defer")
    ) {
      throw new Error("A waiting verdict requires the exact empty-frontier non-product gates");
    }
  } else if (verdict === "allow_stop") {
    if (
      frontier.frontierState !== "complete" ||
      runnableItemRefs.length > 0 ||
      selectedItemRef != null ||
      waitKind != null ||
      resumeCondition != null ||
      parkedDecisionRefs.length > 0 ||
      deferredGateRefs.length > 0 ||
      parsedOwnerBoundary != null ||
      unresolved.length > 0 ||
      requirementMatrix.some((item) => item.status !== "complete" && item.status !== "deferred") ||
      (epoch.kind === "completion" ? questionAction !== null : questionAction !== "answer")
    ) {
      throw new Error("An allow_stop verdict requires complete frontier closure");
    }
  } else if (
    selectedItemRef != null ||
    waitKind != null ||
    resumeCondition != null ||
    parkedDecisionRefs.length > 0 ||
    deferredGateRefs.length > 0 ||
    parsedOwnerBoundary != null ||
    questionAction != null
  ) {
    throw new Error("A user_paused verdict cannot define a controller action");
  }
  return {
    auditID,
    confidence: input.confidence as CompletionVerdict["confidence"],
    deferredGateRefs,
    evidenceGaps: uniqueStringArray(input.evidenceGaps, "evidenceGaps", 128),
    evidenceRefs: uniqueStringArray(input.evidenceRefs, "evidenceRefs", 256),
    frontierGeneration,
    goalSummary: requiredString(input.goalSummary, "goalSummary", 2_000),
    inspectedRevision,
    ownerBoundary: parsedOwnerBoundary,
    parkedDecisionRefs,
    questionAction,
    questionAnswers,
    requirementMatrix,
    resumeCondition,
    rootSessionRef,
    runnableItemRefs,
    schemaVersion: 2,
    selectedItemRef,
    strategyAssessment: {
      fingerprint: requiredString(strategy.fingerprint, "strategyAssessment.fingerprint"),
      prohibitedStrategies: uniqueStringArray(strategy.prohibitedStrategies, "strategyAssessment.prohibitedStrategies", 64),
      repeated: strategy.repeated,
      requiredRetryEvidence: uniqueStringArray(strategy.requiredRetryEvidence, "strategyAssessment.requiredRetryEvidence", 64),
    },
    unresolved,
    verdict,
    waitKind,
  };
}

function bounded(value: string, max: number): string {
  return value.length <= max ? value : `${value.slice(0, max)}\n[truncated by completion guard]`;
}

export function buildContinuation(
  verdict: CompletionVerdict,
  context: RootPromptContext,
  journalPath: string,
  requireTroubleshooter: boolean,
  failureChain?: string,
): GuardContinuation {
  const unresolved = verdict.unresolved.map((item) => ({
    requirementRef: item.requirementRef,
    evidenceGap: item.evidenceGap,
    nextAction: item.nextAction,
    nextEvidence: item.nextEvidence,
    stopCondition: item.stopCondition,
  }));
  const payload = {
    schemaVersion: 2,
    provenance: "completion-guard",
    auditID: verdict.auditID,
    frontierGeneration: verdict.frontierGeneration,
    inspectedRevision: verdict.inspectedRevision,
    selectedItemRef: verdict.selectedItemRef,
    parkedDecisionRefs: verdict.parkedDecisionRefs,
    deferredGateRefs: verdict.deferredGateRefs,
    unresolved,
    prohibitedStrategies: verdict.strategyAssessment.prohibitedStrategies,
    requiredRetryEvidence: verdict.strategyAssessment.requiredRetryEvidence,
    ...(failureChain == null ? {} : { failureChain }),
    journalPath,
    requireTroubleshooter,
    instruction: requireTroubleshooter
      ? `Invoke the diagnosis-only troubleshooter through the task adapter with the complete recorded case file. Include the exact line \"Failure Chain: ${failureChain}\" in its prompt. Verify its report before selecting a distinct mechanism.`
      : "Continue only the bounded unresolved work. Preserve user authority and stop at the stated condition.",
  };
  const text = `<completion_guard schema_version="2">\n${bounded(JSON.stringify(payload, null, 2), 8_000)}\n</completion_guard>`;
  const part: TextPartInput = {
    type: "text",
    text,
    synthetic: true,
    metadata: {
      provenance: "completion-guard",
      auditID: verdict.auditID,
      inspectedRevision: verdict.inspectedRevision,
    },
  };
  return { context, part };
}
