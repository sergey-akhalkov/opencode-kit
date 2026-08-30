import type { OpencodeClient, Session } from "@opencode-ai/sdk/v2";
import { hashRef } from "../../plugin/session-delivery-context/redaction.ts";
import { resolveArbiterRoute } from "./arbiter-route.ts";
import { dataOf, hasErrorName, record } from "./runtime-support.ts";
import type { AuditEpoch, RootState } from "./types.ts";

const TERMINAL_AUDIT_STATUSES = new Set([
  "continued",
  "error",
  "owner-required",
  "passed",
  "product-decision-required",
  "question-answered",
  "stale",
  "user-paused",
  "waiting",
]);

async function session(client: OpencodeClient, directory: string, sessionID: string): Promise<Session> {
  return dataOf<Session>(
    client.session.get({ sessionID, directory }) as Promise<unknown>,
    "session.get retained audit child",
  );
}

async function fullChildren(client: OpencodeClient, directory: string, rootSessionID: string): Promise<Session[]> {
  const children = await dataOf<Session[]>(
    client.session.children({ sessionID: rootSessionID, directory }) as Promise<unknown>,
    "session.children retained audit child",
  );
  return Promise.all(children.map((child) => session(client, directory, child.id)));
}

function validateChild(child: Session, state: RootState, epoch: AuditEpoch): void {
  const metadata = record(child.metadata?.completionGuard);
  if (child.parentID !== state.root.id || metadata?.rootSessionRef !== epoch.rootRef) {
    throw new Error("Retained completion arbiter child has invalid root ownership");
  }
}

async function retainedChild(
  client: OpencodeClient,
  directory: string,
  state: RootState,
  epoch: AuditEpoch,
): Promise<Session | null> {
  const knownID = epoch.childSessionID;
  if (knownID != null) {
    try {
      const child = await session(client, directory, knownID);
      validateChild(child, state, epoch);
      return child;
    } catch (error) {
      if (!hasErrorName(error, "NotFoundError")) throw error;
      epoch.childSessionID = null;
      state.auditChildSessionID = null;
    }
  }
  const children = await fullChildren(client, directory, state.root.id);
  const matches = children.filter((child) =>
    child.parentID === state.root.id &&
    record(child.metadata?.completionGuard)?.rootSessionRef === epoch.rootRef
  );
  const current = matches.filter((child) => record(child.metadata?.completionGuard)?.auditID === epoch.auditID);
  if (current.length > 1) throw new Error("Multiple current completion arbiter children found");
  return current[0] ?? null;
}

async function enforceRetention(
  client: OpencodeClient,
  directory: string,
  state: RootState,
  epoch: AuditEpoch,
  limit: number,
  interruptedAuditGraceMs: number,
): Promise<number> {
  const children = await fullChildren(client, directory, state.root.id);
  const guardChildren = children.filter((child) =>
    child.parentID === state.root.id && record(child.metadata?.completionGuard)?.rootSessionRef === epoch.rootRef
  );
  if (limit === -1 || guardChildren.length < limit) return guardChildren.length;
  const statuses = await dataOf<Record<string, { type: string }>>(
    client.session.status({ directory }) as Promise<unknown>,
    "session.status audit retention",
  );
  const isCurrent = (child: Session): boolean => {
    const metadata = record(child.metadata?.completionGuard);
    return child.id === epoch.childSessionID || metadata?.auditID === epoch.auditID;
  };
  const isIdle = (child: Session, currentStatuses: Record<string, { type: string }>): boolean =>
    currentStatuses[child.id] == null || currentStatuses[child.id]?.type === "idle";
  const eligible = guardChildren.filter((child) => {
    const metadata = record(child.metadata?.completionGuard);
    return !isCurrent(child) &&
      isIdle(child, statuses) &&
      TERMINAL_AUDIT_STATUSES.has(String(metadata?.status ?? ""));
  });
  const requiredRotations = guardChildren.length - limit + 1;
  if (eligible.length < requiredRotations && Number.isFinite(interruptedAuditGraceMs)) {
    const staleBefore = Date.now() - interruptedAuditGraceMs;
    const interrupted = guardChildren
      .filter((child) => !isCurrent(child) &&
        isIdle(child, statuses) &&
        child.time.updated <= staleBefore &&
        record(child.metadata?.completionGuard)?.status === "auditing")
      .sort((left, right) => left.time.updated - right.time.updated || left.id.localeCompare(right.id));
    for (const candidate of interrupted) {
      if (eligible.length >= requiredRotations) break;
      const current = await session(client, directory, candidate.id);
      validateChild(current, state, epoch);
      const metadata = record(current.metadata?.completionGuard);
      if (isCurrent(current) || metadata?.status !== "auditing" || current.time.updated > staleBefore) continue;
      const currentStatuses = await dataOf<Record<string, { type: string }>>(
        client.session.status({ directory }) as Promise<unknown>,
        "session.status interrupted audit quarantine",
      );
      if (!isIdle(current, currentStatuses)) continue;
      const stale = await dataOf<Session>(client.session.update({
        sessionID: current.id,
        directory,
        metadata: {
          ...(current.metadata ?? {}),
          completionGuard: {
            ...metadata,
            status: "stale",
            staleReason: "interrupted-audit-timeout",
          },
        },
      }) as Promise<unknown>, "session.update interrupted audit quarantine");
      eligible.push(stale);
    }
  }
  eligible.sort((left, right) => left.time.updated - right.time.updated || left.id.localeCompare(right.id));
  let retained = guardChildren.length;
  for (const child of eligible) {
    if (retained < limit) break;
    await dataOf<unknown>(
      client.session.delete({ sessionID: child.id, directory }) as Promise<unknown>,
      "session.delete retained audit child",
    );
    retained -= 1;
  }
  if (retained >= limit) {
    throw new Error("Retained completion arbiter child limit reached with no eligible terminal child");
  }
  return retained;
}

export async function ensureArbiterChild(
  client: OpencodeClient,
  directory: string,
  arbiterAgent: string,
  state: RootState,
  epoch: AuditEpoch,
  retainAuditSessions: number,
  interruptedAuditGraceMs = Number.POSITIVE_INFINITY,
) {
  const route = await resolveArbiterRoute(client, directory, arbiterAgent, state.auditAbort?.signal);
  const retained = await retainedChild(client, directory, state, epoch);
  if (retained != null) {
    const child = await dataOf<Session>(client.session.update({
      sessionID: retained.id,
      directory,
      metadata: {
        ...(retained.metadata ?? {}),
        completionGuard: {
          ...(record(retained.metadata?.completionGuard) ?? {}),
          schemaVersion: 2,
          auditID: epoch.auditID,
          rootSessionRef: epoch.rootRef,
          inspectedRevision: epoch.inspected.revisionDigest,
          kind: epoch.kind,
          ...(epoch.questionRequest == null ? {} : { questionRef: hashRef("question", epoch.questionRequest.requestID) }),
          status: "auditing",
          attempt: epoch.attempt,
        },
      },
    }) as Promise<unknown>, "session.update retained audit child");
    epoch.childSessionID = child.id;
    state.auditChildSessionID = child.id;
    return { child, retainedChildCount: null, route };
  }
  const retainedChildCount = await enforceRetention(
    client,
    directory,
    state,
    epoch,
    retainAuditSessions,
    interruptedAuditGraceMs,
  );
  const child = await dataOf<Session>(client.session.create({
    directory,
    parentID: state.root.id,
    title: `Completion audit ${epoch.auditID}`,
    agent: arbiterAgent,
    model: {
      id: route.model.modelID,
      providerID: route.model.providerID,
      ...(route.variant == null ? {} : { variant: route.variant }),
    },
    metadata: {
      completionGuard: {
        schemaVersion: 2,
        auditID: epoch.auditID,
        rootSessionRef: epoch.rootRef,
        inspectedRevision: epoch.inspected.revisionDigest,
        kind: epoch.kind,
        ...(epoch.questionRequest == null ? {} : { questionRef: hashRef("question", epoch.questionRequest.requestID) }),
        status: "auditing",
        attempt: epoch.attempt,
      },
    },
  }) as Promise<unknown>, "session.create audit child");
  epoch.childSessionID = child.id;
  state.auditChildSessionID = child.id;
  return { child, retainedChildCount: retainedChildCount + 1, route };
}
