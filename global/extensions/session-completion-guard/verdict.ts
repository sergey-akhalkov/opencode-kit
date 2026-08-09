import type { TextPartInput } from "@opencode-ai/sdk/v2";
import type { AuditEpoch, CompletionVerdict, GuardContinuation, RootPromptContext } from "./types.ts";

const VERDICT_VALUES = new Set(["allow_stop", "continue", "owner_required", "user_paused"]);
const CONFIDENCE_VALUES = new Set(["high", "medium", "low"]);
const REQUIREMENT_STATUS_VALUES = new Set(["complete", "deferred", "owner_required", "unresolved"]);

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
  if (verdict === "continue" && unresolved.length === 0) {
    throw new Error("A continue verdict requires at least one unresolved requirement");
  }
  if (verdict === "owner_required" && (typeof input.ownerBoundary !== "string" || input.ownerBoundary.trim() === "")) {
    throw new Error("An owner_required verdict requires ownerBoundary");
  }
  return {
    auditID,
    confidence: input.confidence as CompletionVerdict["confidence"],
    evidenceGaps: stringArray(input.evidenceGaps, "evidenceGaps", 128),
    evidenceRefs: stringArray(input.evidenceRefs, "evidenceRefs", 256),
    goalSummary: requiredString(input.goalSummary, "goalSummary", 2_000),
    inspectedRevision,
    ownerBoundary: input.ownerBoundary == null ? null : requiredString(input.ownerBoundary, "ownerBoundary", 2_000),
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
    journalPath,
    requireTroubleshooter,
    instruction: requireTroubleshooter
      ? "Invoke the diagnosis-only troubleshooter through the task adapter with the complete recorded case file. Verify its report before selecting a distinct mechanism."
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
