import type { Plugin } from "@opencode-ai/plugin";

const GRAPHIFY_REPOSITORY_TOOLS = new Set([
  "graphify-global_list_prs",
  "graphify-global_get_pr_impact",
  "graphify-global_triage_prs",
]);

export function requireExplicitGraphifyRepository(tool: string, args: Record<string, unknown>): void {
  if (!GRAPHIFY_REPOSITORY_TOOLS.has(tool)) return;
  if (typeof args.repo === "string" && args.repo.trim() !== "") return;
  throw new Error(`${tool} requires an explicit non-empty 'repo' argument because graphify-global is shared across projects.`);
}

export default {
  id: "opencode-dev-kit.graphify-project-context",
  server: async () => ({
    "tool.execute.before": async (input, output) => {
      requireExplicitGraphifyRepository(input.tool, output.args);
    },
  }),
} satisfies { id: string; server: Plugin };
