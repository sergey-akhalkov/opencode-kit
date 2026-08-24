import type { TextPartInput } from "@opencode-ai/sdk/v2";
import type {
  AuditEpoch,
  CompletionVerdict,
  GuardContinuation,
  OwnerBoundaryVerdict,
  RootPromptContext,
} from "./types.ts";
import { validateQuestionAnswers } from "./question.ts";

const VERDICT_VALUES = new Set(["allow_stop", "continue", "owner_required", "user_paused"]);
const CONFIDENCE_VALUES = new Set(["high", "medium", "low"]);
const REQUIREMENT_STATUS_VALUES = new Set(["complete", "deferred", "owner_required", "unresolved"]);
const CLAIM_CLOSURE_VALUES = new Set(["supported", "narrowed", "blocked", "unknown", "stale"]);

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

function exactKeys(value: Record<string, unknown>, expected: readonly string[], field: string): void {
  const actual = Object.keys(value).sort();
  const wanted = [...expected].sort();
  if (actual.length !== wanted.length || actual.some((key, index) => key !== wanted[index])) {
    throw new Error(`Invalid completion verdict field: ${field}`);
  }
}

function ownerBoundary(value: unknown): OwnerBoundaryVerdict | null {
  if (value == null) return null;
  const boundary = record(value);
  if (boundary == null) throw new Error("Invalid completion verdict field: ownerBoundary");
  return {
    decision: requiredString(boundary.decision, "ownerBoundary.decision", 2_000),
    evidenceRefs: stringArray(boundary.evidenceRefs, "ownerBoundary.evidenceRefs", 64),
    reason: requiredString(boundary.reason, "ownerBoundary.reason", 2_000),
  };
}

export function parseCompletionVerdict(value: unknown, epoch: AuditEpoch): CompletionVerdict {
  const input = record(value);
  if (input == null || input.schemaVersion !== 1) {
    throw new Error("Unsupported or missing completion verdict schemaVersion");
  }
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
    return {
      evidenceRefs: stringArray(item.evidenceRefs, `requirementMatrix[${index}].evidenceRefs`, 64),
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
  const verdict = input.verdict as CompletionVerdict["verdict"];
  if (!Array.isArray(input.claimMatrix) || input.claimMatrix.length > 32) {
    throw new Error("Invalid completion verdict field: claimMatrix");
  }
  const projected = new Map(
    (epoch.completionEvidence?.claimEvidence?.claims ?? []).map((claim) => [claim.claimId, claim]),
  );
  const claimIds = new Set<string>();
  const claimMatrix = input.claimMatrix.map((value, index) => {
    const item = record(value);
    if (item == null) throw new Error(`Invalid completion verdict field: claimMatrix[${index}]`);
    exactKeys(
      item,
      ["claimId", "closureState", "evidenceRefs", "maximumSupportedClaim", "outcomeRef"],
      `claimMatrix[${index}]`,
    );
    const claimId = requiredString(item.claimId, `claimMatrix[${index}].claimId`, 200);
    const closureState = String(item.closureState ?? "");
    if (!CLAIM_CLOSURE_VALUES.has(closureState)) {
      throw new Error(`Invalid completion verdict field: claimMatrix[${index}].closureState`);
    }
    if (claimIds.has(claimId)) throw new Error(`Duplicate completion verdict claim: ${claimId}`);
    claimIds.add(claimId);
    const evidenceRefs = stringArray(item.evidenceRefs, `claimMatrix[${index}].evidenceRefs`, 64);
    const maximumSupportedClaim = requiredString(
      item.maximumSupportedClaim,
      `claimMatrix[${index}].maximumSupportedClaim`,
      1_000,
    );
    const outcomeRef = requiredString(item.outcomeRef, `claimMatrix[${index}].outcomeRef`, 200);
    const source = projected.get(claimId);
    if (
      source == null ||
      source.closureState !== closureState ||
      source.maximumSupportedClaim !== maximumSupportedClaim ||
      source.outcomeRef !== outcomeRef ||
      JSON.stringify([...source.evidenceRefs].sort()) !== JSON.stringify([...evidenceRefs].sort())
    ) {
      throw new Error(`Completion verdict claimMatrix[${index}] does not match supplied claim evidence`);
    }
    return {
      claimId,
      closureState: closureState as NonNullable<CompletionVerdict["claimMatrix"]>[number]["closureState"],
      evidenceRefs,
      maximumSupportedClaim,
      outcomeRef,
    };
  });
  const claimEvidence = epoch.completionEvidence?.claimEvidence;
  if (verdict === "allow_stop") {
    if (claimMatrix.some((claim) => claim.closureState !== "supported")) {
      throw new Error("An allow_stop verdict cannot accept unsupported claim closure");
    }
    if (claimEvidence?.selection === "explicit" && (
      !claimEvidence.complete || claimMatrix.length !== claimEvidence.claims.length
    )) {
      throw new Error("An allow_stop verdict requires complete explicitly selected claim closure");
    }
  }
  const parsedOwnerBoundary = ownerBoundary(input.ownerBoundary);
  const questionAnswers = epoch.kind === "question" && (verdict === "allow_stop" || verdict === "continue")
    ? validateQuestionAnswers(input.questionAnswers, epoch.questionRequest?.questions ?? [])
    : input.questionAnswers === null
      ? null
      : (() => { throw new Error("Only an autonomous pending-question verdict may define questionAnswers"); })();
  if (verdict === "continue" && unresolved.length === 0) {
    throw new Error("A continue verdict requires at least one unresolved requirement");
  }
  if (verdict === "owner_required" && parsedOwnerBoundary == null) {
    throw new Error("An owner_required verdict requires a structured ownerBoundary");
  }
  if (verdict !== "owner_required" && parsedOwnerBoundary != null) {
    throw new Error("Only an owner_required verdict may define ownerBoundary");
  }
  return {
    auditID,
    claimMatrix,
    confidence: input.confidence as CompletionVerdict["confidence"],
    evidenceGaps: stringArray(input.evidenceGaps, "evidenceGaps", 128),
    evidenceRefs: stringArray(input.evidenceRefs, "evidenceRefs", 256),
    goalSummary: requiredString(input.goalSummary, "goalSummary", 2_000),
    inspectedRevision,
    ownerBoundary: parsedOwnerBoundary,
    questionAnswers,
    requirementMatrix,
    rootSessionRef,
    schemaVersion: 1,
    strategyAssessment: {
      fingerprint: requiredString(strategy.fingerprint, "strategyAssessment.fingerprint"),
      prohibitedStrategies: stringArray(strategy.prohibitedStrategies, "strategyAssessment.prohibitedStrategies", 64),
      repeated: strategy.repeated,
      requiredRetryEvidence: stringArray(strategy.requiredRetryEvidence, "strategyAssessment.requiredRetryEvidence", 64),
    },
    unresolved,
    verdict,
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
    schemaVersion: 1,
    provenance: "completion-guard",
    auditID: verdict.auditID,
    inspectedRevision: verdict.inspectedRevision,
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
  const text = `<completion_guard schema_version="1">\n${bounded(JSON.stringify(payload, null, 2), 8_000)}\n</completion_guard>`;
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
