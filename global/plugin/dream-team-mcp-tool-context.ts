import type { Plugin } from "@opencode-ai/plugin";
import { isAbsolute, resolve } from "node:path";

const DREAM_TEAM_REVIEW_TOOL = "dream_team_review";
const DREAM_TEAM_IMPLEMENT_TOOL = "dream_team_implement";
const DREAM_TEAM_TOOLS = new Set([DREAM_TEAM_REVIEW_TOOL, DREAM_TEAM_IMPLEMENT_TOOL]);
const MODEL_PROFILE_ID_ENV = "OPENCODE_MODEL_PROFILE_ID";
const MODEL_PROFILE_REVIEW_MODEL_ENV = "OPENCODE_MODEL_PROFILE_DREAM_TEAM_REVIEW_MODEL";
const MODEL_PROFILE_REVIEW_VARIANT_ENV = "OPENCODE_MODEL_PROFILE_DREAM_TEAM_REVIEW_VARIANT";
const MODEL_PROFILE_IMPLEMENT_MODEL_ENV = "OPENCODE_MODEL_PROFILE_DREAM_TEAM_IMPLEMENT_MODEL";
const MODEL_PROFILE_IMPLEMENT_VARIANT_ENV = "OPENCODE_MODEL_PROFILE_DREAM_TEAM_IMPLEMENT_VARIANT";
const PROFILE_SELECTION_PATTERN = /^(?:local:)?[a-z0-9](?:[a-z0-9._-]*[a-z0-9])?$/;
const MODEL_ID_PATTERN = /^[a-z0-9][a-z0-9._-]*\/[a-z0-9][a-z0-9._:/-]*$/i;
const VARIANT_PATTERN = /^[a-z0-9][a-z0-9._-]*$/i;

type ProfileDeviation = {
  field: "model" | "variant";
  profileValue: string;
  explicitValue: string;
};

type ProfileRoutingPlan = {
  profileId: string;
  assignments: Partial<Record<"model" | "variant", string>>;
  deviations: ProfileDeviation[];
};

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
  environment: NodeJS.ProcessEnv = process.env,
): Promise<void> {
  if (!isRecord(input) || typeof input.tool !== "string" || !DREAM_TEAM_TOOLS.has(input.tool)) {
    return;
  }

  await assertTopLevelCaller(input.sessionID, directory, client);
  if (!isRecord(output) || !isRecord(output.args)) {
    throw new Error("Dream Team MCP tool context requires mutable arguments");
  }
  assertMutableArguments(output.args);
  const profilePlan = planProfileRouting(input.tool, output.args, environment);
  assertProfileRoutingPlanMutable(output.args, profilePlan);
  await logProfileDeviations(client, input.tool, profilePlan);
  absolutizeRelativeRepo(output.args, directory);
  applyProfileRoutingPlan(output.args, profilePlan);

  if (input.tool !== DREAM_TEAM_REVIEW_TOOL) return;
  const sessionID = typeof input.sessionID === "string" ? input.sessionID.trim() : "";
  if (sessionID.length === 0 || "callerSessionId" in output.args) return;
  output.args.callerSessionId = sessionID;
}

export function planProfileRouting(
  tool: string,
  args: Record<string, unknown>,
  environment: NodeJS.ProcessEnv,
): ProfileRoutingPlan | null {
  const rawProfileId = environment[MODEL_PROFILE_ID_ENV] ?? "";
  if (rawProfileId.length === 0) return null;
  if (
    rawProfileId !== rawProfileId.trim() ||
    rawProfileId.includes("..") ||
    !PROFILE_SELECTION_PATTERN.test(rawProfileId)
  ) {
    throw new Error("Active model profile marker is malformed");
  }

  const review = tool === DREAM_TEAM_REVIEW_TOOL;
  const model = requireBridgeValue(
    environment[review ? MODEL_PROFILE_REVIEW_MODEL_ENV : MODEL_PROFILE_IMPLEMENT_MODEL_ENV],
    MODEL_ID_PATTERN,
    rawProfileId,
    review ? "review model" : "implementation model",
  );
  const variant = requireBridgeValue(
    environment[review ? MODEL_PROFILE_REVIEW_VARIANT_ENV : MODEL_PROFILE_IMPLEMENT_VARIANT_ENV],
    VARIANT_PATTERN,
    rawProfileId,
    review ? "review variant" : "implementation variant",
  );

  const explicitModel = readExplicitRoutingArgument(args, "model", MODEL_ID_PATTERN);
  const explicitVariant = readExplicitRoutingArgument(args, "variant", VARIANT_PATTERN);
  const assignments: ProfileRoutingPlan["assignments"] = {};
  const deviations: ProfileDeviation[] = [];

  if (explicitModel == null) {
    assignments.model = model;
  } else if (explicitModel !== model) {
    deviations.push({ field: "model", profileValue: model, explicitValue: explicitModel });
  }

  if (explicitVariant == null && (explicitModel == null || explicitModel === model)) {
    assignments.variant = variant;
  } else if (explicitVariant != null && explicitVariant !== variant) {
    deviations.push({ field: "variant", profileValue: variant, explicitValue: explicitVariant });
  }

  return { profileId: rawProfileId, assignments, deviations };
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

function applyProfileRoutingPlan(
  args: Record<string, unknown>,
  plan: ProfileRoutingPlan | null,
): void {
  if (plan == null) return;
  for (const [field, value] of Object.entries(plan.assignments)) {
    args[field] = value;
  }
}

function assertProfileRoutingPlanMutable(
  args: Record<string, unknown>,
  plan: ProfileRoutingPlan | null,
): void {
  if (plan == null) return;
  for (const field of Object.keys(plan.assignments)) {
    const descriptor = Object.getOwnPropertyDescriptor(args, field);
    if (
      descriptor != null &&
      ("writable" in descriptor ? descriptor.writable === false : descriptor.set === undefined)
    ) {
      throw new Error("Dream Team MCP tool context requires mutable profile routing arguments");
    }
  }
}

async function logProfileDeviations(
  client: unknown,
  tool: string,
  plan: ProfileRoutingPlan | null,
): Promise<void> {
  if (plan == null || plan.deviations.length === 0) return;
  const app = isRecord(client) && isRecord(client.app) ? client.app : undefined;
  if (app == null || typeof app.log !== "function") {
    throw new Error("Dream Team model profile deviation requires OpenCode structured logging");
  }
  await app.log({
    body: {
      service: "dream-team.tool-context",
      level: "info",
      message: "Dream Team model profile deviation",
      extra: {
        profile: plan.profileId,
        tool,
        deviations: plan.deviations,
      },
    },
  });
}

function requireBridgeValue(
  value: string | undefined,
  pattern: RegExp,
  profileId: string,
  field: string,
): string {
  if (value == null || value !== value.trim() || !pattern.test(value)) {
    throw new Error(`Active model profile '${profileId}' has an incomplete or invalid Dream Team ${field} bridge`);
  }
  return value;
}

function readExplicitRoutingArgument(
  args: Record<string, unknown>,
  field: "model" | "variant",
  pattern: RegExp,
): string | undefined {
  if (!(field in args) || args[field] == null) return undefined;
  const value = args[field];
  if (typeof value !== "string" || value !== value.trim() || !pattern.test(value)) {
    throw new Error(`Dream Team explicit ${field} must be a valid non-empty identifier`);
  }
  return value;
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
