import {
  readSessionDeliveryContext,
  type SessionDeliveryContextResult,
} from "../../plugin/session-delivery-context/index.ts";
import { SESSION_GRAPH_SURFACE } from "../../plugin/session-delivery-context/session-graph.ts";
import { hashRef } from "../../plugin/session-delivery-context/redaction.ts";
import type { RootInspection } from "./inspection.ts";
import { questionRequestForArbiter } from "./question.ts";
import type { AuditEpoch } from "./types.ts";

export type ArbiterTodoMembership = "current" | "ever" | "open" | "unresolved";
type DeliveryTodo = SessionDeliveryContextResult["todos"]["current"][number];
type DeliveryValidation = SessionDeliveryContextResult["validationEvidence"][number];

export type ArbiterCompletionEvidence = Omit<
  SessionDeliveryContextResult,
  "schemaVersion" | "todos" | "userMessages" | "validationEvidence"
> & {
  schemaVersion: 1;
  sourceSchemaVersion: SessionDeliveryContextResult["schemaVersion"];
  todos: {
    history: SessionDeliveryContextResult["todos"]["history"];
    items: Array<DeliveryTodo & { memberships: ArbiterTodoMembership[] }>;
  };
  validationEvidence: Array<
    Omit<DeliveryValidation, "summary"> & { summary?: string | null; toolOutputRef?: string }
  >;
};

export type RequestContribution = { bytes: number; surface: string };

export class CanonicalEvidenceConflictError extends Error {
  readonly ref: string;
  readonly surface: string;

  constructor(surface: string, ref: string) {
    super(`Completion evidence conflict at ${surface} ref ${ref}`);
    this.name = "CanonicalEvidenceConflictError";
    this.ref = ref;
    this.surface = surface;
  }
}

export class AuditRequestOverflowError extends Error {
  readonly allowedBytes: number;
  readonly contributions: RequestContribution[];
  readonly observedBytes: number;

  constructor(observedBytes: number, allowedBytes: number, contributions: RequestContribution[] = []) {
    super(`Completion audit request exceeds byte limit (${observedBytes} > ${allowedBytes})`);
    this.name = "AuditRequestOverflowError";
    this.observedBytes = observedBytes;
    this.allowedBytes = allowedBytes;
    this.contributions = contributions;
  }
}

function stableValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stableValue);
  if (value == null || typeof value !== "object") return value;
  const input = value as Record<string, unknown>;
  return Object.fromEntries(Object.keys(input).sort().map((key) => [key, stableValue(input[key])]));
}

function sameValue(left: unknown, right: unknown): boolean {
  return JSON.stringify(stableValue(left)) === JSON.stringify(stableValue(right));
}

function canonicalRows<T>(rows: T[], surface: string, refOf: (row: T) => string): T[] {
  const canonical = new Map<string, T>();
  for (const row of rows) {
    const ref = refOf(row);
    const existing = canonical.get(ref);
    if (existing == null) canonical.set(ref, row);
    else if (!sameValue(existing, row)) throw new CanonicalEvidenceConflictError(surface, ref);
  }
  return [...canonical.values()];
}

function canonicalTodos(todos: SessionDeliveryContextResult["todos"]): ArbiterCompletionEvidence["todos"] {
  const order: ArbiterTodoMembership[] = ["current", "ever", "open", "unresolved"];
  const canonical = new Map<string, { memberships: Set<ArbiterTodoMembership>; todo: DeliveryTodo }>();
  for (const membership of order) {
    for (const todo of todos[membership]) {
      const existing = canonical.get(todo.eventRef);
      if (existing == null) {
        canonical.set(todo.eventRef, { memberships: new Set([membership]), todo });
      } else {
        if (!sameValue(existing.todo, todo)) throw new CanonicalEvidenceConflictError(`todos.${membership}`, todo.eventRef);
        existing.memberships.add(membership);
      }
    }
  }
  return {
    history: todos.history,
    items: [...canonical.values()].map(({ memberships, todo }) => ({
      ...todo,
      memberships: order.filter((membership) => memberships.has(membership)),
    })),
  };
}

export function canonicalArbiterEvidence(source: SessionDeliveryContextResult): ArbiterCompletionEvidence {
  const tools = canonicalRows(source.toolEvidence, "toolEvidence.callRef", (row) => row.callRef);
  const toolsByCall = new Map(tools.map((tool) => [tool.callRef, tool]));
  const validations = canonicalRows(
    source.validationEvidence,
    "validationEvidence.eventRef",
    (row) => row.eventRef,
  ).map((validation) => {
    const tool = toolsByCall.get(validation.callRef);
    if (tool == null || validation.summary !== tool.output) return validation;
    const { summary: _summary, ...retained } = validation;
    return { ...retained, toolOutputRef: tool.callRef };
  });
  const {
    schemaVersion: sourceSchemaVersion,
    todos,
    toolEvidence: _toolEvidence,
    userMessages: _userMessages,
    validationEvidence: _validationEvidence,
    ...retained
  } = source;
  return {
    ...retained,
    schemaVersion: 1,
    sourceSchemaVersion,
    todos: canonicalTodos(todos),
    toolEvidence: tools,
    validationEvidence: validations,
  };
}

export function captureArbiterEvidence(
  rootSessionID: string,
  rootSessionRef: string,
  projectRoot?: string,
  _sessionMetadata?: unknown,
  dbPaths?: string[],
): SessionDeliveryContextResult {
  const evidence = readSessionDeliveryContext({
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

export function requestContributions(request: string): RequestContribution[] {
  const match = request.match(/^<completion_audit_request>\n([\s\S]*)\n<\/completion_audit_request>$/);
  if (match == null) return [{ bytes: requestBytes(request), surface: "request" }];
  let parsed: unknown;
  try {
    parsed = JSON.parse(match[1]);
  } catch {
    return [{ bytes: requestBytes(request), surface: "request" }];
  }
  if (parsed == null || typeof parsed !== "object" || Array.isArray(parsed)) {
    return [{ bytes: requestBytes(request), surface: "request" }];
  }
  const jsonBytes = requestBytes(match[1]);
  return [
    ...Object.entries(parsed as Record<string, unknown>).map(([surface, value]) => ({
      bytes: requestBytes(JSON.stringify({ [surface]: value })),
      surface,
    })),
    { bytes: requestBytes(request) - jsonBytes, surface: "wrapper" },
  ].sort((left, right) => right.bytes - left.bytes || left.surface.localeCompare(right.surface)).slice(0, 8);
}

export function requireBoundedRequest(request: string, maxBytes: number): number {
  const observed = requestBytes(request);
  if (observed > maxBytes) throw new AuditRequestOverflowError(observed, maxBytes, requestContributions(request));
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
    schemaVersion: 2,
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
    completionEvidence: canonicalArbiterEvidence(completionEvidence),
    strategyJournal: {
      source: inspection.journal.source,
      path: inspection.journal.relativePath,
      digest: inspection.journal.digest,
    },
    instruction: "Evaluate only the supplied private canonical completionEvidence. Return one exact JSON verdict object with no Markdown or surrounding prose. Do not call tools.",
  };
  return `<completion_audit_request>\n${JSON.stringify(request)}\n</completion_audit_request>`;
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
