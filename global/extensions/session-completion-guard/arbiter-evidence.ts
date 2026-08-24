import {
  readSessionDeliveryContext,
  type SessionDeliveryContextResult,
} from "../../plugin/session-delivery-context/index.ts";
import { SESSION_GRAPH_SURFACE } from "../../plugin/session-delivery-context/session-graph.ts";
import { hashRef } from "../../plugin/session-delivery-context/redaction.ts";
import type { RootInspection } from "./inspection.ts";
import { questionRequestForArbiter } from "./question.ts";
import type { AuditEpoch } from "./types.ts";
import { readClaimEvidence, selectedClaimChangeIds } from "./claim-evidence.ts";

export class AuditRequestOverflowError extends Error {
  readonly allowedBytes: number;
  readonly observedBytes: number;

  constructor(observedBytes: number, allowedBytes: number) {
    super(`Completion audit request exceeds byte limit (${observedBytes} > ${allowedBytes})`);
    this.name = "AuditRequestOverflowError";
    this.observedBytes = observedBytes;
    this.allowedBytes = allowedBytes;
  }
}

export function captureArbiterEvidence(
  rootSessionID: string,
  rootSessionRef: string,
  projectRoot?: string,
  sessionMetadata?: unknown,
  dbPaths?: string[],
): SessionDeliveryContextResult {
  const evidence = readSessionDeliveryContext({
    claimEvidence: readClaimEvidence(projectRoot, selectedClaimChangeIds(sessionMetadata)),
    ...(dbPaths == null ? {} : { dbPaths, useDefaultPaths: false }),
    projectRoot,
    resolveRoot: true,
    sessionId: rootSessionID,
  });
  if (
    evidence.schemaVersion !== 2 ||
    evidence.missingSessions.length > 0 ||
    evidence.session?.sessionRef !== rootSessionRef
  ) {
    throw new Error("Completion evidence does not match the inspected root session");
  }
  if (evidence.truncationWarnings.some((entry) => entry.surface === SESSION_GRAPH_SURFACE)) {
    throw new Error("Completion evidence omitted descendants that can affect liveness");
  }
  return evidence;
}

export function requestBytes(request: string): number {
  return Buffer.byteLength(request, "utf8");
}

export function requireBoundedRequest(request: string, maxBytes: number): number {
  const observed = requestBytes(request);
  if (observed > maxBytes) throw new AuditRequestOverflowError(observed, maxBytes);
  return observed;
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
