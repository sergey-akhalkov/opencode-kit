import type { Plugin } from "@opencode-ai/plugin";
import { readSessionDeliveryContext, type SessionDeliveryContextResult } from "./session-delivery-context/index.ts";
import { requireExplicitGraphifyRepository } from "./graphify-project-context.ts";

export const SESSION_DELIVERY_CONTEXT_TOOL = "session_delivery_context";
export const SESSION_COMPLETION_ARBITER_AGENT = "session-completion-arbiter";

function deliveryContextMetadata(result: SessionDeliveryContextResult): Record<string, unknown> {
  return {
    assistantEvidence: result.session?.counts.assistantEvidence ?? 0,
    auditRefs: result.session?.counts.auditRefs ?? 0,
    background: result.session?.counts.background ?? 0,
    missingSessions: result.missingSessions.length,
    currentTodos: result.session?.counts.currentTodos ?? 0,
    everTodos: result.session?.counts.everTodos ?? 0,
    openTodos: result.session?.counts.openTodos ?? 0,
    permissionReplies: result.session?.counts.permissionReplies ?? 0,
    questionInterventions: result.session?.counts.questionInterventions ?? 0,
    questionReplies: result.session?.counts.questionReplies ?? 0,
    requirementSignals: result.session?.counts.requirementSignals ?? 0,
    resolvedFromSessionRef: result.resolvedFromSessionRef,
    sessionRef: result.session?.sessionRef ?? null,
    syntheticMessages: result.session?.counts.syntheticMessages ?? 0,
    todoToolCalls: result.session?.counts.todoToolCalls ?? 0,
    unresolvedTodos: result.session?.counts.unresolvedTodos ?? 0,
    userMessages: result.session?.counts.userMessages ?? 0,
    validationEvidence: result.session?.counts.validationEvidence ?? 0,
    warnings: result.warnings.length,
  };
}

export default {
  id: "opencode-dev-kit.session-env",
  server: async () => ({
    "shell.env": async (input, output) => {
      if (typeof input.sessionID === "string" && input.sessionID !== "") {
        output.env.OPENCODE_SESSION_ID = input.sessionID;
      }
    },
    "tool.execute.before": async (input, output) => {
      requireExplicitGraphifyRepository(input.tool, output.args);
    },
    tool: {
      [SESSION_DELIVERY_CONTEXT_TOOL]: {
        args: {},
        description: "Return versioned, redacted root parent session completion evidence with human and synthetic provenance, human question replies, guard interventions, todos, bounded assistant/tool/diff/validation evidence, descendants, background state, strategy refs, audits, and explicit truncation warnings.",
        async execute(_args, context) {
          const result = readSessionDeliveryContext({ resolveRoot: true, sessionId: context.sessionID });
          const metadata = deliveryContextMetadata(result);
          context.metadata({
            metadata,
            title: "Session delivery context",
          });
          return {
            metadata,
            output: `${JSON.stringify(result, null, 2)}\n`,
            title: "Session delivery context",
          };
        },
      },
    },
  }),
} satisfies { id: string; server: Plugin };
