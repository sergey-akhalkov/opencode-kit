import crypto from "node:crypto";

import type { Plugin, ToolContext, ToolResult } from "@opencode-ai/plugin";

const ADVISOR_ID = "specialist-team-advisor";
const TOOL_ID = "specialist_catalog";
const DESCRIPTION_LIMIT = 160;
const WARNING_LIMIT = 64;
const CONTROL_PLANE_AGENTS = new Set([
  "compaction",
  "session-completion-arbiter",
  "summary",
  "title",
]);
const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9._-]{0,79}$/;

type ApiResponse = { data?: unknown; error?: unknown };
type CatalogTransport = {
  get?: (input: {
    path?: Record<string, string>;
    query?: Record<string, string>;
    url: string;
  }) => Promise<ApiResponse>;
};
type CatalogClient = {
  _client?: CatalogTransport;
  app?: {
    _client?: CatalogTransport;
    agents?: (input: { directory: string }) => Promise<ApiResponse>;
    skills?: (input: { directory: string }) => Promise<ApiResponse>;
  };
  session?: {
    get?: (input: { directory: string; sessionID: string }) => Promise<ApiResponse>;
  };
};
type CatalogApi = {
  agents: (directory: string) => Promise<ApiResponse>;
  session: (directory: string, sessionID: string) => Promise<ApiResponse>;
  skills: (directory: string) => Promise<ApiResponse>;
};
type SessionRow = {
  agent?: string;
  directory: string;
  id: string;
  parentID?: string;
  projectID?: string;
  version?: string;
};
type CatalogEntry = {
  availability: "available";
  class: "dispatchable-agent" | "skill" | "subagent";
  description: string;
  id: string;
};
type CatalogWarning = {
  artifactRef?: string;
  cause: string;
  stage: "agent" | "attribution" | "catalog" | "skill";
};

class CatalogFault extends Error {
  readonly causeCode: string;
  readonly stage: CatalogWarning["stage"];
  readonly status: "denied" | "unknown";

  constructor(
    status: "denied" | "unknown",
    causeCode: string,
    stage: CatalogWarning["stage"],
    cause?: unknown,
  ) {
    super(causeCode);
    this.name = "CatalogFault";
    this.status = status;
    this.causeCode = causeCode;
    this.stage = stage;
    if (cause != null) (this as Error & { cause?: unknown }).cause = cause;
  }
}

function stableJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  if (value != null && typeof value === "object") {
    return `{${Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, nested]) => `${JSON.stringify(key)}:${stableJson(nested)}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

function digest(value: unknown): string {
  return crypto.createHash("sha256").update(typeof value === "string" ? value : stableJson(value)).digest("hex");
}

function ref(value: string): string {
  return digest(value).slice(0, 16);
}

function record(value: unknown, label: string): Record<string, unknown> {
  if (value == null || typeof value !== "object" || Array.isArray(value)) throw new Error(`${label} has the wrong shape`);
  return value as Record<string, unknown>;
}

function unwrap(response: ApiResponse, label: string): unknown {
  if (response?.error != null) {
    const error = new Error(`${label} failed`) as Error & { cause?: unknown };
    error.cause = response.error;
    throw error;
  }
  if (response == null || !("data" in response)) throw new Error(`${label} returned no data`);
  return response.data;
}

function rows(value: unknown, label: string): Record<string, unknown>[] {
  if (Array.isArray(value)) return value.map((item) => record(item, label));
  const payload = record(value, label);
  if (!Array.isArray(payload.data)) throw new Error(`${label} returned no rows`);
  return payload.data.map((item) => record(item, label));
}

function safeCauseClass(error: unknown): string {
  let current = error;
  for (let depth = 0; depth < 4 && current != null; depth += 1) {
    if (current instanceof Error && SAFE_ID.test(current.name) && current.name !== "Error") return current.name;
    if (typeof current === "object") {
      const value = current as { cause?: unknown; name?: unknown };
      if (typeof value.name === "string" && SAFE_ID.test(value.name) && value.name !== "Error") return value.name;
      current = value.cause;
    } else {
      current = null;
    }
  }
  return "runtime-error";
}

function sanitizeDescription(value: unknown): { description: string; causes: string[] } {
  if (typeof value !== "string") return { causes: [], description: "" };
  const causes = new Set<string>();
  let result = value;
  if (/(?:file:\/\/\/|[A-Za-z]:[\\/]|\\\\)|(^|[\s(])(?:~[\\/]|\/(?:[^/\s,;]+[\\/])+)/i.test(result)) {
    result = "[redacted description]";
    causes.add("absolute-path-redacted");
  }
  const replace = (pattern: RegExp, replacement: string, cause: string): void => {
    const next = result.replace(pattern, replacement);
    if (next !== result) causes.add(cause);
    result = next;
  };
  replace(/PRIVATE_[A-Za-z0-9_]+/g, "[redacted]", "private-marker-redacted");
  replace(/\b(?:api[_-]?key|authorization|credential|password|secret|token)\s*[:=]\s*[^\s,;]+/gi, "[redacted]", "sensitive-value-redacted");
  replace(/\bBearer\s+[^\s,;]+/gi, "[redacted]", "sensitive-value-redacted");
  replace(/(?:file:\/\/\/|[A-Za-z]:[\\/]|\\\\)[^\s,;]+/g, "[path]", "absolute-path-redacted");
  replace(/(^|[\s(])(?:~[\\/]|\/(?:home|Users|var|tmp|etc|opt|srv|mnt|private)[\\/])[^\s,;]+/gi, "$1[path]", "absolute-path-redacted");
  replace(/[\r\n\t\u0000-\u001f\u007f]+/g, " ", "control-character-redacted");
  replace(/[^\x20-\x7e]/g, "?", "non-ascii-redacted");
  result = result.replace(/\s+/g, " ").trim();
  if (result.length > DESCRIPTION_LIMIT) {
    result = result.slice(0, DESCRIPTION_LIMIT).trimEnd();
    causes.add("description-truncated");
  }
  return { causes: [...causes].sort(), description: result };
}

function addWarning(warnings: CatalogWarning[], warning: CatalogWarning, dropped: { count: number }): void {
  if (warnings.length < WARNING_LIMIT) warnings.push(warning);
  else dropped.count += 1;
}

function projectEntries(
  agentPayload: unknown,
  skillPayload: unknown,
): { agents: CatalogEntry[]; skills: CatalogEntry[]; warnings: CatalogWarning[] } {
  const warnings: CatalogWarning[] = [];
  const dropped = { count: 0 };
  const agents = rows(agentPayload, "agent catalog")
    .flatMap((item): CatalogEntry[] => {
      const id = typeof item.id === "string" ? item.id : item.name;
      const mode = item.mode;
      if (typeof id !== "string" || !SAFE_ID.test(id)) {
        addWarning(warnings, { cause: "unsafe-id-omitted", stage: "agent" }, dropped);
        return [];
      }
      if (id === ADVISOR_ID || item.hidden === true || CONTROL_PLANE_AGENTS.has(id) || mode === "primary") return [];
      if (mode !== "subagent" && mode !== "all") {
        addWarning(warnings, { artifactRef: ref(id), cause: "non-dispatchable-mode-omitted", stage: "agent" }, dropped);
        return [];
      }
      const safe = sanitizeDescription(item.description);
      for (const cause of safe.causes) addWarning(warnings, { artifactRef: ref(id), cause, stage: "agent" }, dropped);
      return [{ availability: "available", class: mode === "subagent" ? "subagent" : "dispatchable-agent", description: safe.description, id }];
    })
    .sort((left, right) => left.id.localeCompare(right.id));
  const skills = rows(skillPayload, "skill catalog")
    .flatMap((item): CatalogEntry[] => {
      const id = item.name;
      if (typeof id !== "string" || !SAFE_ID.test(id)) {
        addWarning(warnings, { cause: "unsafe-id-omitted", stage: "skill" }, dropped);
        return [];
      }
      const safe = sanitizeDescription(item.description);
      for (const cause of safe.causes) addWarning(warnings, { artifactRef: ref(id), cause, stage: "skill" }, dropped);
      return [{ availability: "available", class: "skill", description: safe.description, id }];
    })
    .sort((left, right) => left.id.localeCompare(right.id));
  warnings.sort((left, right) => stableJson(left).localeCompare(stableJson(right)));
  if (dropped.count > 0) warnings[WARNING_LIMIT - 1] = { cause: "warnings-truncated", stage: "catalog" };
  return { agents, skills, warnings };
}

function catalogApi(client: CatalogClient): CatalogApi | null {
  if (
    typeof client.app?.agents === "function" &&
    typeof client.app.skills === "function" &&
    typeof client.session?.get === "function"
  ) {
    return {
      agents: (directory) => client.app!.agents!({ directory }),
      session: (directory, sessionID) => client.session!.get!({ directory, sessionID }),
      skills: (directory) => client.app!.skills!({ directory }),
    };
  }
  const transport = client._client ?? client.app?._client;
  if (typeof transport?.get !== "function") return null;
  return {
    agents: (directory) => transport.get!({ query: { directory }, url: "/agent" }),
    session: (directory, sessionID) => transport.get!({ path: { id: sessionID }, query: { directory }, url: "/session/{id}" }),
    skills: (directory) => transport.get!({ query: { directory }, url: "/skill" }),
  };
}

async function resolveRoot(api: CatalogApi, context: ToolContext): Promise<{ caller: SessionRow; root: SessionRow }> {
  const first = record(unwrap(await api.session(context.directory, context.sessionID), "session.get"), "session");
  if (first.id !== context.sessionID || first.agent !== ADVISOR_ID || typeof first.parentID !== "string" || first.parentID === "") {
    throw new CatalogFault("denied", "caller-attribution-mismatch", "attribution");
  }
  const caller = first as SessionRow;
  const visited = new Set<string>();
  let current = caller;
  for (let depth = 0; depth < 64; depth += 1) {
    if (visited.has(current.id)) throw new CatalogFault("unknown", "session-parent-cycle", "attribution");
    visited.add(current.id);
    if (current.parentID == null) return { caller, root: current };
    const parent = record(unwrap(await api.session(context.directory, current.parentID), "session.get"), "session");
    if (typeof parent.id !== "string" || typeof parent.directory !== "string") throw new CatalogFault("unknown", "session-shape-invalid", "attribution");
    current = parent as SessionRow;
  }
  throw new CatalogFault("unknown", "session-parent-depth-exceeded", "attribution");
}

function emptyResult(
  status: "denied" | "unknown",
  context: ToolContext,
  warning: CatalogWarning,
): Record<string, unknown> {
  return {
    agents: [],
    callerSessionRef: ref(context.sessionID),
    catalogRef: null,
    identity: {
      profile: { class: "root-effective", digest: null },
      runtime: { class: "opencode-app", digest: null },
      source: { class: "runtime-agent-skill-list", digest: null },
    },
    rootSessionRef: null,
    schemaVersion: 1,
    skills: [],
    status,
    warnings: [warning],
  };
}

function toolResult(value: Record<string, unknown>): ToolResult {
  return {
    metadata: {
      catalogRef: typeof value.catalogRef === "string" ? value.catalogRef : null,
      status: value.status,
    },
    output: JSON.stringify(value),
    title: "Root-effective specialist catalog",
  };
}

const specialistCatalogPlugin: Plugin = async ({ client: runtimeClient }) => {
  const client = runtimeClient as unknown as CatalogClient;
  const api = catalogApi(client);
  return {
    tool: {
      [TOOL_ID]: {
        args: {},
        description: "Return the privacy-safe agents and skills available to this advisor's parent root session.",
        async execute(_args: Record<string, never>, context: ToolContext): Promise<ToolResult> {
          if (context.agent !== ADVISOR_ID) {
            return toolResult(emptyResult("denied", context, { cause: "caller-not-advisor", stage: "attribution" }));
          }
          if (api == null) {
            return toolResult(emptyResult("unknown", context, { cause: "catalog-api-unavailable", stage: "catalog" }));
          }
          let caller: SessionRow;
          let root: SessionRow;
          try {
            ({ caller, root } = await resolveRoot(api, context));
          } catch (error) {
            const fault = error instanceof CatalogFault
              ? error
              : new CatalogFault("unknown", safeCauseClass(error), "attribution", error);
            return toolResult(emptyResult(fault.status, context, { cause: fault.causeCode, stage: fault.stage }));
          }
          try {
            const [agentResponse, skillResponse] = await Promise.all([
              api.agents(root.directory),
              api.skills(root.directory),
            ]);
            const projected = projectEntries(unwrap(agentResponse, "agent.list"), unwrap(skillResponse, "skill.list"));
            const rootSessionRef = ref(root.id);
            const callerSessionRef = ref(caller.id);
            const profileDigest = digest({
              agents: projected.agents.map(({ availability, class: artifactClass, id }) => ({ availability, class: artifactClass, id })),
              skills: projected.skills.map(({ availability, class: artifactClass, id }) => ({ availability, class: artifactClass, id })),
            });
            const sourceDigest = digest({ agents: projected.agents, skills: projected.skills, warnings: projected.warnings });
            const identity = {
              profile: { class: "root-effective", digest: profileDigest },
              runtime: { class: "opencode-app", digest: digest({ projectID: root.projectID ?? null, version: root.version ?? null }) },
              source: { class: "runtime-agent-skill-list", digest: sourceDigest },
            };
            const catalogRef = digest({
              agents: projected.agents,
              identity,
              rootSessionRef,
              schemaVersion: 1,
              skills: projected.skills,
              warnings: projected.warnings,
            });
            return toolResult({
              agents: projected.agents,
              callerSessionRef,
              catalogRef,
              identity,
              rootSessionRef,
              schemaVersion: 1,
              skills: projected.skills,
              status: "ok",
              warnings: projected.warnings,
            });
          } catch (error) {
            return toolResult(emptyResult("unknown", context, {
              cause: safeCauseClass(error),
              stage: "catalog",
            }));
          }
        },
      },
    },
  };
};

export default specialistCatalogPlugin;
