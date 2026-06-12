import { tool } from "@opencode-ai/plugin";
import type { Plugin } from "@opencode-ai/plugin";
import type { AutopilotOptions } from "../../tools/openspec-autopilot-output.ts";
import { createAutopilotController, toPluginToolOutput } from "../../tools/openspec-autopilot-controller.ts";

function optionalNonEmptyString(value?: string): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function repoRoot(ctx: { worktree?: string; directory?: string }): string {
  return optionalNonEmptyString(ctx.worktree) ?? optionalNonEmptyString(ctx.directory) ?? process.cwd();
}

export default {
  id: "openspec.autopilot",
  server: async (ctx, options?: AutopilotOptions) => {
    const resolvedOptions = options ?? {};
    const controller = createAutopilotController({ root: repoRoot(ctx) }, resolvedOptions);
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
            return toPluginToolOutput(await controller.runNext({ changeId: args.changeId, taskId: args.taskId }, { kind: "model-tool", name: "autopilot_run_next" }));
          },
        }),
        autopilot_status: tool({
          description: "Return concise OpenSpec Autopilot status for task ledgers, blockers, and MRs.",
          args: {
            changeId: tool.schema.string().optional().describe("Optional OpenSpec change id to inspect."),
          },
          async execute(args) {
            return toPluginToolOutput(await controller.status({ changeId: args.changeId }, { kind: "model-tool", name: "autopilot_status" }));
          },
        }),
        autopilot_collect: tool({
          description: "Collect plugin-owned worker reports and attempt legal runtime advancement without direct protected-file mutation.",
          args: {
            taskId: tool.schema.string().optional().describe("Optional task id to collect."),
          },
          async execute(args) {
            return toPluginToolOutput(await controller.collect({ taskId: args.taskId }, { kind: "model-tool", name: "autopilot_collect" }));
          },
        }),
        autopilot_answer_blocker: tool({
          description: "Validate a selected user answer envelope for a pending plugin-owned autopilot blocker question. MVP does not mutate state yet.",
          args: {
            questionId: tool.schema.string().describe("Blocker question id."),
            taskId: tool.schema.string().optional().describe("Related task id."),
            selectedLabel: tool.schema.string().optional().describe("Selected option label."),
            action: tool.schema.string().optional().describe("Selected blocker action."),
          },
          async execute(args) {
            return toPluginToolOutput(await controller.answerBlocker(args, { kind: "model-tool", name: "autopilot_answer_blocker" }));
          },
        }),
        autopilot_stop: tool({
          description: "Acknowledge a pause or cancel request for an autopilot run/task and report whether plugin-owned active runtime state changed.",
          args: {
            target: tool.schema.string().optional().describe("run, task, or all."),
            id: tool.schema.string().optional().describe("Run id or task id."),
            reason: tool.schema.string().optional().describe("Reason for pause or cancel."),
          },
          async execute(args) {
            return toPluginToolOutput(await controller.stop(args, { kind: "model-tool", name: "autopilot_stop" }));
          },
        }),
      },
    };
  },
} satisfies { id: string; server: Plugin };
