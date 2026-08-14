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
  "question-answered",
  "stale",
  "user-paused",
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
  const eligible = guardChildren
    .filter((child) => {
      const metadata = record(child.metadata?.completionGuard);
      return child.id !== epoch.childSessionID &&
        statuses[child.id]?.type === "idle" &&
        TERMINAL_AUDIT_STATUSES.has(String(metadata?.status ?? ""));
    })
    .sort((left, right) => left.time.updated - right.time.updated || left.id.localeCompare(right.id));
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
) {
  const route = await resolveArbiterRoute(client, directory, arbiterAgent);
  const retained = await retainedChild(client, directory, state, epoch);
  if (retained != null) {
    const child = await dataOf<Session>(client.session.update({
      sessionID: retained.id,
      directory,
      metadata: {
        ...(retained.metadata ?? {}),
        completionGuard: {
          ...(record(retained.metadata?.completionGuard) ?? {}),
          schemaVersion: 1,
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
  const retainedChildCount = await enforceRetention(client, directory, state, epoch, retainAuditSessions);
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
        schemaVersion: 1,
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
