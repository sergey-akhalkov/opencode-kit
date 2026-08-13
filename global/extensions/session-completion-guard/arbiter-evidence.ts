import {
  readSessionDeliveryContext,
  type SessionDeliveryContextResult,
} from "../../plugin/session-delivery-context/index.ts";
import { hashRef } from "../../plugin/session-delivery-context/redaction.ts";
import type { RootInspection } from "./inspection.ts";
import { questionRequestForArbiter } from "./question.ts";
import type { AuditEpoch } from "./types.ts";

const MAX_AUDIT_EVIDENCE_CHARS = 200_000;

export function captureArbiterEvidence(
  rootSessionID: string,
  rootSessionRef: string,
): SessionDeliveryContextResult {
  const evidence = readSessionDeliveryContext({ resolveRoot: true, sessionId: rootSessionID });
  if (
    evidence.schemaVersion !== 2 ||
    evidence.missingSessions.length > 0 ||
    evidence.session?.sessionRef !== rootSessionRef
  ) {
    throw new Error("Completion evidence does not match the inspected root session");
  }
  if (JSON.stringify(evidence).length > MAX_AUDIT_EVIDENCE_CHARS) {
    throw new Error("Completion evidence exceeds the bounded audit input limit");
  }
  return evidence;
}

export function buildArbiterAuditRequest(
  epoch: AuditEpoch,
  inspection: RootInspection,
  completionEvidence: SessionDeliveryContextResult,
): string {
  const question = epoch.questionRequest == null
    ? null
    : {
        ...questionRequestForArbiter(epoch.questionRequest),
        requestRef: hashRef("question", epoch.questionRequest.requestID),
      };
  const request = {
    schemaVersion: 1,
    auditID: epoch.auditID,
    rootSessionRef: epoch.rootRef,
    inspectedRevision: epoch.inspected.revisionDigest,
    auditKind: epoch.kind,
    question,
    contextCounts: {
      assistantEvidence: inspection.context.assistantEvidence.length,
      background: inspection.context.background.length,
      humanMessages: inspection.context.humanMessages.length,
    },
    completionEvidence,
    strategyJournal: {
      source: inspection.journal.source,
      path: inspection.journal.relativePath,
      digest: inspection.journal.digest,
    },
    instruction: "Evaluate only the supplied redacted completionEvidence. Return one exact JSON verdict object with no Markdown or surrounding prose. Do not call tools.",
  };
  return `<completion_audit_request>\n${JSON.stringify(request, null, 2)}\n</completion_audit_request>`;
}

export function buildArbiterRetryRequest(epoch: AuditEpoch, previousError: string): string {
  const request = {
    schemaVersion: 1,
    auditID: epoch.auditID,
    rootSessionRef: epoch.rootRef,
    inspectedRevision: epoch.inspected.revisionDigest,
    attempt: epoch.attempt,
    previousError: previousError.slice(0, 1_000),
    instruction: "Correct the verdict for the original completion_audit_request in this retained child. Return one exact schema-valid JSON verdict object with no Markdown or surrounding prose. Do not call tools.",
  };
  return `<completion_audit_retry>\n${JSON.stringify(request, null, 2)}\n</completion_audit_retry>`;
}
