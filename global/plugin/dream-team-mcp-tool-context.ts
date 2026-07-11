import type { Plugin } from "@opencode-ai/plugin";
import { isAbsolute, resolve } from "node:path";

const DREAM_TEAM_REVIEW_TOOL = "dream_team_review";
const DREAM_TEAM_IMPLEMENT_TOOL = "dream_team_implement";
const DREAM_TEAM_TOOLS = new Set([DREAM_TEAM_REVIEW_TOOL, DREAM_TEAM_IMPLEMENT_TOOL]);

export async function applyDreamTeamReviewCallerSessionScope(
  input: unknown,
  output: unknown,
  directory: unknown,
  client: unknown,
): Promise<void> {
  await applyDreamTeamToolContext(input, output, directory, client);
}

export async function applyDreamTeamToolContext(
  input: unknown,
  output: unknown,
  directory: unknown,
  client: unknown,
): Promise<void> {
  if (!isRecord(input) || typeof input.tool !== "string" || !DREAM_TEAM_TOOLS.has(input.tool)) {
    return;
  }

  await assertTopLevelCaller(input.sessionID, directory, client);
  if (!isRecord(output) || !isRecord(output.args)) {
    throw new Error("Dream Team MCP tool context requires mutable arguments");
  }
  assertMutableArguments(output.args);
  absolutizeRelativeRepo(output.args, directory);

  if (input.tool !== DREAM_TEAM_REVIEW_TOOL) return;
  const sessionID = typeof input.sessionID === "string" ? input.sessionID.trim() : "";
  if (sessionID.length === 0 || "callerSessionId" in output.args) return;
  output.args.callerSessionId = sessionID;
}

function assertMutableArguments(args: Record<string, unknown>): void {
  if (!Object.isExtensible(args)) {
    throw new Error("Dream Team MCP tool context requires mutable arguments");
  }
  for (const key of ["repo", "callerSessionId"]) {
    const descriptor = Object.getOwnPropertyDescriptor(args, key);
    if (descriptor === undefined) continue;
    if ("writable" in descriptor ? descriptor.writable === false : descriptor.set === undefined) {
      throw new Error("Dream Team MCP tool context requires mutable arguments");
    }
  }
}

export default {
  id: "dream-team.tool-context",
  server: async ({ directory, client } = {}) => ({
    "tool.execute.before": async (input, output) => {
      await applyDreamTeamToolContext(input, output, directory, client);
    },
  }),
} satisfies { id: string; server: Plugin };

async function assertTopLevelCaller(
  sessionID: unknown,
  directory: unknown,
  client: unknown,
): Promise<void> {
  const normalizedSessionID = typeof sessionID === "string" ? sessionID.trim() : "";
  if (normalizedSessionID.length === 0) {
    throw new Error("Dream Team MCP calls require a resolvable top-level OpenCode session");
  }

  const sessionApi = isRecord(client) && isRecord(client.session) ? client.session : undefined;
  if (sessionApi === undefined || typeof sessionApi.list !== "function") {
    throw new Error("Dream Team MCP calls require OpenCode session hierarchy access");
  }

  const response = await sessionApi.list({
    query: typeof directory === "string" && directory.trim().length > 0 ? { directory } : {},
  });
  const sessions = isRecord(response) && Array.isArray(response.data) ? response.data : undefined;
  const caller = sessions?.find(
    (session) => isRecord(session) && session.id === normalizedSessionID,
  );
  if (!isRecord(caller)) {
    throw new Error("Dream Team MCP caller session could not be resolved");
  }
  if (!("parentID" in caller)) return;
  if (typeof caller.parentID === "string" && caller.parentID.trim().length > 0) {
    throw new Error("Dream Team MCP tools cannot be called from an OpenCode child session");
  }
  throw new Error("Dream Team MCP caller session has an invalid parentID");
}

function absolutizeRelativeRepo(args: Record<string, unknown>, directory: unknown): void {
  const repo = typeof args.repo === "string" ? args.repo.trim() : "";
  const base = typeof directory === "string" ? directory.trim() : "";
  if (repo.length === 0 || base.length === 0 || isAbsolute(repo)) return;
  args.repo = resolve(base, repo);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
