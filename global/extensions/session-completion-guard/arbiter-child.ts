import type { OpencodeClient, Session } from "@opencode-ai/sdk/v2";
import { hashRef } from "../../plugin/session-delivery-context/redaction.ts";
import { resolveArbiterRoute } from "./arbiter-route.ts";
import { dataOf, hasErrorName, record } from "./runtime-support.ts";
import type { AuditEpoch, RootState } from "./types.ts";

async function session(client: OpencodeClient, directory: string, sessionID: string): Promise<Session> {
  return dataOf<Session>(
    client.session.get({ sessionID, directory }) as Promise<unknown>,
    "session.get retained audit child",
  );
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
  const knownID = epoch.childSessionID ?? state.auditChildSessionID;
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
  const children = await dataOf<Session[]>(
    client.session.children({ sessionID: state.root.id, directory }) as Promise<unknown>,
    "session.children retained audit child",
  );
  const matches = children.filter((child) =>
    child.parentID === state.root.id &&
    record(child.metadata?.completionGuard)?.rootSessionRef === epoch.rootRef
  );
  if (matches.length > 1) throw new Error("Multiple retained completion arbiter children found");
  return matches[0] ?? null;
}

export async function ensureArbiterChild(
  client: OpencodeClient,
  directory: string,
  arbiterAgent: string,
  state: RootState,
  epoch: AuditEpoch,
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
          ...(epoch.questionRequestID == null ? {} : { questionRef: hashRef("question", epoch.questionRequestID) }),
          status: "auditing",
          attempt: epoch.attempt,
        },
      },
    }) as Promise<unknown>, "session.update retained audit child");
    epoch.childSessionID = child.id;
    state.auditChildSessionID = child.id;
    return { child, route };
  }
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
        ...(epoch.questionRequestID == null ? {} : { questionRef: hashRef("question", epoch.questionRequestID) }),
        status: "auditing",
        attempt: epoch.attempt,
      },
    },
  }) as Promise<unknown>, "session.create audit child");
  epoch.childSessionID = child.id;
  state.auditChildSessionID = child.id;
  return { child, route };
}
