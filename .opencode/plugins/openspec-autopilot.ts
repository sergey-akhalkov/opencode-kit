import { tool } from "@opencode-ai/plugin";
import type { Plugin } from "@opencode-ai/plugin";
import type { AutopilotOptions, AutopilotOutput } from "../../tools/openspec-autopilot-output.ts";
import {
  createAnswerBlockerOutput,
  createCollectOutput,
  createRunNextOutput,
  createStatusOutput,
  createStopOutput,
  readLedgerSummaries,
} from "../../tools/openspec-autopilot-output.ts";

function jsonOutput(payload: AutopilotOutput | Record<string, unknown>): { output: string; metadata: Record<string, unknown> } {
  return {
    output: JSON.stringify(payload, null, 2),
    metadata: {
      service: "openspec-autopilot",
      outcome: typeof payload.outcome === "string" ? payload.outcome : "status",
    },
  };
}

function repoRoot(ctx: { worktree?: string; directory?: string }): string {
  return ctx.worktree ?? ctx.directory ?? process.cwd();
}

export default {
  id: "openspec.autopilot",
  server: async (ctx, options?: AutopilotOptions) => {
    const resolvedOptions = options ?? {};
    return {
      tool: {
        autopilot_run_next: tool({
          description:
            "Continue OpenSpec Autopilot as far as safely possible until blocker, MR wait, idle state, or MVP limit. The plugin is authoritative for process/state transitions.",
          args: {
            changeId: tool.schema.string().optional().describe("Optional OpenSpec change id to prefer."),
            taskId: tool.schema.string().optional().describe("Optional task id to prefer."),
          },
          async execute(args) {
            const root = repoRoot(ctx);
            const ledgers = readLedgerSummaries(root, resolvedOptions, { changeId: args.changeId, taskId: args.taskId });
            return jsonOutput(createRunNextOutput(ledgers));
          },
        }),
        autopilot_status: tool({
          description: "Return concise OpenSpec Autopilot status for task ledgers, blockers, and MRs.",
          args: {
            changeId: tool.schema.string().optional().describe("Optional OpenSpec change id to inspect."),
          },
          async execute(args) {
            const root = repoRoot(ctx);
            const ledgers = readLedgerSummaries(root, resolvedOptions, { changeId: args.changeId });
            return jsonOutput(createStatusOutput(ledgers));
          },
        }),
        autopilot_collect: tool({
          description: "Collect finished worker reports and attempt legal state advancement. MVP validates ledgers and returns no-op collect status.",
          args: {
            taskId: tool.schema.string().optional().describe("Optional task id to collect."),
          },
          async execute(args) {
            const root = repoRoot(ctx);
            const ledgers = readLedgerSummaries(root, resolvedOptions, { taskId: args.taskId });
            return jsonOutput(createCollectOutput(ledgers));
          },
        }),
        autopilot_answer_blocker: tool({
          description: "Apply a selected user answer to an autopilot blocker question. MVP accepts the envelope but does not mutate state yet.",
          args: {
            questionId: tool.schema.string().describe("Blocker question id."),
            taskId: tool.schema.string().optional().describe("Related task id."),
            selectedLabel: tool.schema.string().optional().describe("Selected option label."),
            action: tool.schema.string().optional().describe("Selected blocker action."),
          },
          async execute(args) {
            return jsonOutput(createAnswerBlockerOutput(args.questionId));
          },
        }),
        autopilot_stop: tool({
          description: "Pause or cancel an autopilot run/task. MVP returns a safe no-op stop result.",
          args: {
            target: tool.schema.string().optional().describe("run, task, or all."),
            id: tool.schema.string().optional().describe("Run id or task id."),
            reason: tool.schema.string().optional().describe("Reason for pause or cancel."),
          },
          async execute(args) {
            return jsonOutput(createStopOutput(args.target));
          },
        }),
      },
    };
  },
} satisfies { id: string; server: Plugin };
