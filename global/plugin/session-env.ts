import type { Plugin } from "@opencode-ai/plugin";
import { isAbsolute, resolve } from "node:path";
import { readSessionDeliveryContext, type SessionDeliveryContextResult } from "./session-delivery-context/index.ts";

export const SESSION_DELIVERY_CONTEXT_TOOL = "session_delivery_context";
export const SESSION_DELIVERY_REVIEWER_AGENT = "session-delivery-reviewer";
const DREAM_TEAM_REVIEW_TOOL = "dream_team_review";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function deliveryContextMetadata(result: SessionDeliveryContextResult): Record<string, unknown> {
  return {
    missingSessions: result.missingSessions.length,
    currentTodos: result.session?.counts.currentTodos ?? 0,
    everTodos: result.session?.counts.everTodos ?? 0,
    openTodos: result.session?.counts.openTodos ?? 0,
    permissionReplies: result.session?.counts.permissionReplies ?? 0,
    questionReplies: result.session?.counts.questionReplies ?? 0,
    requirementSignals: result.session?.counts.requirementSignals ?? 0,
    resolvedFromSessionRef: result.resolvedFromSessionRef,
    sessionRef: result.session?.sessionRef ?? null,
    todoToolCalls: result.session?.counts.todoToolCalls ?? 0,
    unresolvedTodos: result.session?.counts.unresolvedTodos ?? 0,
    userMessages: result.session?.counts.userMessages ?? 0,
    warnings: result.warnings.length,
  };
}

export default {
  id: "opencode-dev-kit.session-env",
  server: async ({ directory } = {}) => ({
    "shell.env": async (input, output) => {
      if (typeof input.sessionID === "string" && input.sessionID !== "") {
        output.env.OPENCODE_SESSION_ID = input.sessionID;
      }
    },
    "tool.execute.before": async (input, output) => {
      if (input.tool !== DREAM_TEAM_REVIEW_TOOL || typeof input.sessionID !== "string" || input.sessionID === "") {
        return;
      }

      if (!isRecord(output.args)) {
        output.args = {};
      }

      if (!("callerSessionId" in output.args)) {
        output.args.callerSessionId = input.sessionID;
      }
      absolutizeRelativeRepo(output.args, directory);
    },
    tool: {
      [SESSION_DELIVERY_CONTEXT_TOOL]: {
        args: {},
        description: "Return redacted delivery-review context for the OpenCode session being reviewed: user prompts, question replies, permission replies, current todos, and todowrite history. When the reviewer runs as a subagent, resolves the root parent session so it audits the reviewed work session, not its own child session.",
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

function absolutizeRelativeRepo(args: Record<string, unknown>, directory: unknown): void {
  const repo = typeof args.repo === "string" ? args.repo.trim() : "";
  const base = typeof directory === "string" ? directory.trim() : "";
  if (repo.length === 0 || base.length === 0 || isAbsolute(repo)) return;
  args.repo = resolve(base, repo);
}
