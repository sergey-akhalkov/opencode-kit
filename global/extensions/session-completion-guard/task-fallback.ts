import type { OpencodeClient } from "@opencode-ai/sdk/v2";
import { hashRef } from "../../plugin/session-delivery-context/redaction.ts";
import type { AsyncLeaseRegistry } from "./leases.ts";
import { ensureNoError, restoredPromptContext } from "./runtime-support.ts";
import type { RootState } from "./types.ts";

export async function sendTaskFallback(
  client: OpencodeClient,
  leases: AsyncLeaseRegistry,
  state: RootState,
  callID: string,
  childSessionID: string,
): Promise<boolean> {
  if (!state.grindEnabled || state.paused) return false;
  const context = restoredPromptContext(state.root, state.promptContext);
  await ensureNoError(client.session.promptAsync({
    sessionID: state.root.id,
    directory: state.root.directory,
    ...(context.agent == null ? {} : { agent: context.agent }),
    ...(context.model == null ? {} : { model: context.model }),
    ...(context.variant == null ? {} : { variant: context.variant }),
    parts: [{
      type: "text",
      synthetic: true,
      text: [
        "<task_result>",
        `Call ID: ${callID}`,
        `Child Session ID: ${childSessionID}`,
        `Task Ref: ${hashRef("call", callID)}`,
        `Child Ref: ${hashRef("session", childSessionID)}`,
        "Status: completed",
        "Notification Source: completion-guard-fallback",
        "</task_result>",
      ].join("\n"),
      metadata: {
        provenance: "completion-guard-task-fallback",
        callRef: hashRef("call", callID),
        childRef: hashRef("session", childSessionID),
      },
    }],
  }) as Promise<unknown>, "session.promptAsync task fallback");
  leases.markTaskFallbackSent(callID);
  state.guardTurnPending = true;
  return true;
}
