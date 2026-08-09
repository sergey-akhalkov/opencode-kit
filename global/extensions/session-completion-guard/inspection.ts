import type { OpencodeClient, Session } from "@opencode-ai/sdk/v2";
import { hashRef, sanitizeText } from "../../plugin/session-delivery-context/redaction.ts";
import { syntheticAsyncMarker } from "./control.ts";
import type { AsyncLeaseRegistry } from "./leases.ts";
import { dataOf, record, stableDigest, stringValue } from "./runtime-support.ts";
import {
  discoverStrategyJournal,
  isJournalOnlyPath,
  type StrategyJournal,
} from "./strategy.ts";
import type { GuardOptions, Revision } from "./types.ts";

export type RuntimeContext = {
  assistantEvidence: Array<{ eventRef: string }>;
  background: Array<{ agent: string | null; status: string }>;
  humanMessages: Array<{ eventRef: string; text: string }>;
};

export type RootInspection = {
  context: RuntimeContext;
  journal: StrategyJournal;
  revision: Revision;
};

function runtimeContext(
  rawSessionID: string,
  messages: Array<{ info: Record<string, unknown>; parts: unknown[] }>,
): RuntimeContext {
  const assistantEvidence: Array<{ eventRef: string }> = [];
  const background: Array<{ agent: string | null; status: string }> = [];
  const humanMessages: Array<{ eventRef: string; text: string }> = [];
  for (const [index, message] of messages.entries()) {
    const info = record(message.info) ?? {};
    const messageID = stringValue(info.id) ?? `${rawSessionID}:${index}`;
    if (info.role === "assistant") assistantEvidence.push({ eventRef: hashRef("assistant", messageID) });
    const humanText = message.parts.flatMap((value) => {
      const part = record(value);
      if (
        info.role !== "user" ||
        part?.type !== "text" ||
        typeof part.text !== "string" ||
        part.synthetic === true ||
        syntheticAsyncMarker(part.text) != null ||
        /^<completion_guard\b/iu.test(part.text)
      ) return [];
      return [part.text];
    });
    if (humanText.length > 0) {
      humanMessages.push({
        eventRef: hashRef("message", messageID),
        text: sanitizeText(humanText.join("\n"), rawSessionID),
      });
    }
    for (const value of message.parts) {
      const part = record(value);
      if (part?.type !== "tool" || part.tool !== "task") continue;
      const state = record(part.state);
      const input = record(state?.input);
      background.push({
        agent: stringValue(input?.subagent_type) ?? stringValue(input?.agent),
        status: stringValue(state?.status) ?? "unknown",
      });
    }
  }
  return { assistantEvidence, background, humanMessages };
}

export async function inspectRootEvidence(input: {
  client: OpencodeClient;
  configDirectory: string;
  leases: AsyncLeaseRegistry;
  options: GuardOptions;
  root: Session;
}): Promise<RootInspection> {
  const messages = await dataOf<Array<{ info: Record<string, unknown>; parts: unknown[] }>>(
    input.client.session.messages({ sessionID: input.root.id, directory: input.configDirectory, limit: 200 }) as Promise<unknown>,
    "session.messages",
  );
  const context = runtimeContext(input.root.id, messages);
  const todos = await dataOf<Array<{ content: string; priority: string; status: string }>>(
    input.client.session.todo({ sessionID: input.root.id, directory: input.configDirectory }) as Promise<unknown>,
    "session.todo",
  );
  const diffs = await dataOf<Array<{ file?: string; additions: number; deletions: number; status?: string }>>(
    input.client.session.diff({ sessionID: input.root.id, directory: input.configDirectory }) as Promise<unknown>,
    "session.diff",
  );
  const journal = discoverStrategyJournal(
    input.root.directory,
    hashRef("session", input.root.id),
    context,
    input.options.strategyFallback,
  );
  const materialDiffs = diffs.filter((diff) => diff.file == null || !isJournalOnlyPath(diff.file));
  const humanRef = context.humanMessages[context.humanMessages.length - 1]?.eventRef ?? "none";
  const assistantRef = context.assistantEvidence[context.assistantEvidence.length - 1]?.eventRef ?? "none";
  const todoDigest = stableDigest(todos);
  const diffDigest = stableDigest(materialDiffs);
  const leaseGeneration = input.leases.generation(input.root.id);
  const revisionDigest = stableDigest({
    assistantRef,
    diffDigest,
    humanRef,
    journalDigest: journal.digest,
    leaseGeneration,
    todoDigest,
  });
  return {
    context,
    journal,
    revision: {
      assistantRef,
      diffDigest,
      humanRef,
      journalDigest: journal.digest,
      leaseGeneration,
      revisionDigest,
      todoDigest,
    },
  };
}
