import fs from "node:fs";
import path from "node:path";
import { hashRef } from "../session-delivery-context/redaction.ts";
import {
  appendProjectMemoryCandidate,
  invalidateProjectMemoryCard,
  pathContainedByRoot,
  promoteProjectMemoryCandidate,
  resolveProjectMemoryStore,
  type ProjectMemoryCandidateInput,
  type ProjectMemoryEnvironment,
  type ProjectMemoryInvalidationInput,
  type ProjectMemoryManageResult,
  type ProjectMemoryPromotionInput,
  type ProjectMemoryRootInput,
  type ProjectMemoryStore,
} from "./store.ts";
import {
  recallProjectMemory,
  revalidateProjectMemorySelection,
  PROJECT_MEMORY_RECALL_OUTPUT_BYTES,
  type ProjectMemoryRecallRequest,
  type ProjectMemoryRecallResult,
} from "./recall.ts";

export * from "./store.ts";
export * from "./recall.ts";

export type ProjectMemoryManageAction =
  | ({ action: "candidate" } & ProjectMemoryCandidateInput)
  | ({ action: "promote" } & ProjectMemoryPromotionInput)
  | ({ action: "invalidate" } & ProjectMemoryInvalidationInput);

export type ProjectMemoryFeatureInput = Omit<ProjectMemoryRootInput, "environment"> & {
  environment?: ProjectMemoryEnvironment;
};

export type ProjectMemoryFeature = {
  enabled: true;
  projectRef: string;
  manage(action: ProjectMemoryManageAction, now?: Date): Promise<ProjectMemoryManageResult>;
  recall(request: ProjectMemoryRecallRequest, options?: { automatic?: boolean; now?: Date }): Promise<ProjectMemoryRecallResult>;
  revalidate(refs: string[], options?: { now?: Date }): Promise<ProjectMemoryRecallResult>;
  validateSessionDirectory(directory: string | undefined): boolean;
};

type ProjectMemoryPluginInput = {
  client?: {
    session?: {
      get(input: { path: { id: string }; query?: { directory?: string } }): Promise<unknown>;
    };
  };
  project?: {
    worktree?: string;
  };
  directory?: string;
  worktree?: string;
};

type ProjectMemoryToolContext = {
  directory?: string;
  worktree?: string;
  metadata(input: { title?: string; metadata?: Record<string, unknown> }): void;
};

type ProjectMemorySelection = {
  capsule: string;
  refs: string[];
  warnings: string[];
  truncated: boolean;
};

const STRING_SCHEMA = { type: "string" } as const;
const STRING_ARRAY_SCHEMA = { type: "array", items: STRING_SCHEMA } as const;
const RECALL_INPUT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    query: STRING_SCHEMA,
    path: STRING_SCHEMA,
    symbol: STRING_SCHEMA,
    statuses: { type: "array", items: { enum: ["candidate", "active", "invalidated"] } },
    limit: { type: "integer", minimum: 1, maximum: 7 },
  },
  required: ["query"],
} as const;
const MANAGE_INPUT_SCHEMA = {
  oneOf: [
    {
      type: "object",
      additionalProperties: false,
      properties: {
        action: { const: "candidate" },
        title: STRING_SCHEMA,
        kind: { enum: ["tip", "pitfall", "procedure"] },
        confidence: { enum: ["low", "medium", "high"] },
        triggers: STRING_ARRAY_SCHEMA,
        appliesTo: {
          type: "object",
          additionalProperties: false,
          properties: { paths: STRING_ARRAY_SCHEMA, symbols: STRING_ARRAY_SCHEMA },
        },
        evidencePaths: STRING_ARRAY_SCHEMA,
        technique: STRING_SCHEMA,
        why: STRING_SCHEMA,
        evidence: STRING_SCHEMA,
        invalidatedWhen: STRING_SCHEMA,
      },
      required: ["action", "title", "kind", "confidence", "triggers", "technique", "why", "evidence", "invalidatedWhen"],
    },
    {
      type: "object",
      additionalProperties: false,
      properties: {
        action: { const: "promote" },
        cardRef: STRING_SCHEMA,
        evidence: STRING_SCHEMA,
        verifiedAt: STRING_SCHEMA,
      },
      required: ["action", "cardRef", "evidence"],
    },
    {
      type: "object",
      additionalProperties: false,
      properties: {
        action: { const: "invalidate" },
        cardRef: STRING_SCHEMA,
        reason: STRING_SCHEMA,
      },
      required: ["action", "cardRef", "reason"],
    },
  ],
} as const;
const PROJECT_MEMORY_MANAGE_OUTPUT_BYTES = 4 * 1024;

function record(value: unknown): Record<string, unknown> | null {
  return value != null && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

function responseData(value: unknown): Record<string, unknown> {
  const result = record(value);
  if (result == null) throw new Error("Project memory session lookup returned an invalid response.");
  if (result.error != null) throw new Error("Project memory session lookup failed.", { cause: result.error });
  return record(result.data) ?? result;
}

async function withDeadline<T>(operation: Promise<T>, milliseconds: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      operation,
      new Promise<never>((_resolve, reject) => {
        timer = setTimeout(() => reject(new Error("Project memory root lookup timed out.")), milliseconds);
      }),
    ]);
  } finally {
    if (timer != null) clearTimeout(timer);
  }
}

function messageText(parts: unknown[]): string {
  return parts.flatMap((part) => {
    const row = record(part);
    return row?.synthetic !== true && row?.type === "text" && typeof row.text === "string" ? [row.text] : [];
  }).join("\n");
}

function sessionIdFromEvent(event: unknown): string | null {
  const row = record(event);
  const properties = record(row?.properties);
  if (typeof properties?.sessionID === "string") return properties.sessionID;
  const info = record(properties?.info);
  return typeof info?.id === "string" ? info.id : null;
}

function toolInput(args: unknown): Record<string, unknown> {
  const input = record(record(args)?.input);
  if (input == null) throw new Error("Project memory tool requires an object-valued 'input' argument.");
  return input;
}

function toolResult(title: string, result: unknown, maximumBytes: number, context: ProjectMemoryToolContext) {
  const output = `${JSON.stringify(result, null, 2)}\n`;
  if (Buffer.byteLength(output, "utf8") > maximumBytes) throw new Error(`${title} output exceeded its fixed limit.`);
  const metadata = {
    bytes: Buffer.byteLength(output, "utf8"),
    projectRef: record(result)?.projectRef ?? null,
  };
  context.metadata({ title, metadata });
  return { title, output, metadata };
}

function sessionDirectoryMatches(store: ProjectMemoryStore, directory: string | undefined): boolean {
  if (directory == null || directory.trim() === "") return false;
  try {
    const canonical = fs.realpathSync.native(path.resolve(directory));
    return pathContainedByRoot(canonical, store.canonicalRoot);
  } catch {
    return false;
  }
}

export function createProjectMemoryFeature(input: ProjectMemoryFeatureInput): ProjectMemoryFeature | null {
  const environment = input.environment ?? process.env;
  if (environment.OPENCODE_PROJECT_MEMORY !== "1") return null;
  const store = resolveProjectMemoryStore({ ...input, environment });
  if (store == null) return null;
  return {
    enabled: true,
    projectRef: store.projectRef,
    async manage(action, now) {
      if (action.action === "candidate") return appendProjectMemoryCandidate(store, action, now);
      if (action.action === "promote") return promoteProjectMemoryCandidate(store, action, now);
      return invalidateProjectMemoryCard(store, action, now);
    },
    recall(request, options) {
      return recallProjectMemory(store, request, options);
    },
    revalidate(refs, options) {
      return revalidateProjectMemorySelection(store, refs, options);
    },
    validateSessionDirectory(directory) {
      return sessionDirectoryMatches(store, directory);
    },
  };
}

export function createProjectMemoryPluginHooks(input: ProjectMemoryPluginInput, environment = process.env) {
  if (environment.OPENCODE_PROJECT_MEMORY !== "1") return {};
  const feature = createProjectMemoryFeature({
    worktree: input.worktree,
    projectWorktree: input.project?.worktree,
    directory: input.directory,
    startupDirectory: input.directory,
    environment,
  });
  if (feature == null || input.client?.session?.get == null || typeof input.directory !== "string") return {};
  const selections = new Map<string, ProjectMemorySelection>();
  const warned = new Set<string>();

  const warnOnce = (sessionID: string, reason: string) => {
    const sessionRef = hashRef("session", sessionID);
    const key = `${sessionRef}:${reason}`;
    if (warned.has(key)) return;
    warned.add(key);
    console.warn(`[project-memory] ${reason}; session=${sessionRef}`);
  };

  const verifiedRoot = async (sessionID: string): Promise<boolean> => {
    try {
      const response = await withDeadline(input.client!.session!.get({
        path: { id: sessionID },
        query: { directory: input.directory! },
      }), 1_000);
      const session = responseData(response);
      if (session.id !== sessionID) return false;
      if (session.parentID != null || session.parent_id != null) return false;
      const directory = typeof session.directory === "string" ? session.directory : null;
      if (directory == null || !feature.validateSessionDirectory(directory)) return false;
      return true;
    } catch {
      warnOnce(sessionID, "root lookup failed");
      return false;
    }
  };

  const requireToolRoot = (context: ProjectMemoryToolContext) => {
    if (!feature.validateSessionDirectory(context.directory ?? context.worktree)) {
      throw new Error("Project memory tool context does not match the configured project root.");
    }
  };

  const currentSelection = async (sessionID: string): Promise<ProjectMemorySelection | null> => {
    const selection = selections.get(sessionID);
    if (selection == null) return null;
    try {
      const recalled = await feature.revalidate(selection.refs);
      if (recalled.results.length === 0 && !recalled.coreIncluded) {
        selections.delete(sessionID);
        return null;
      }
      const current = {
        capsule: recalled.capsule,
        refs: recalled.results.map((item) => item.ref),
        warnings: recalled.warnings,
        truncated: recalled.truncated,
      };
      selections.set(sessionID, current);
      return current;
    } catch {
      selections.delete(sessionID);
      warnOnce(sessionID, "selection revalidation failed");
      return null;
    }
  };

  return {
    tool: {
      project_memory_recall: {
        description: "Recall bounded current project memory. Input requires query and may include repository-relative path, symbol, statuses, and limit.",
        args: { input: RECALL_INPUT_SCHEMA },
        async execute(args: unknown, context: ProjectMemoryToolContext) {
          requireToolRoot(context);
          const result = await feature.recall(toolInput(args) as ProjectMemoryRecallRequest);
          return toolResult("Project memory recall", result, PROJECT_MEMORY_RECALL_OUTPUT_BYTES, context);
        },
      },
      project_memory_manage: {
        description: "Append one explicit project-memory candidate, promotion, or invalidation event under the machine-local project store.",
        args: { input: MANAGE_INPUT_SCHEMA },
        async execute(args: unknown, context: ProjectMemoryToolContext) {
          requireToolRoot(context);
          const result = await feature.manage(toolInput(args) as ProjectMemoryManageAction);
          selections.clear();
          return toolResult("Project memory manage", result, PROJECT_MEMORY_MANAGE_OUTPUT_BYTES, context);
        },
      },
    },
    "chat.message": async (
      hookInput: { sessionID: string },
      output: { parts: unknown[] },
    ) => {
      selections.delete(hookInput.sessionID);
      if (typeof hookInput.sessionID !== "string" || hookInput.sessionID.trim() === "") return;
      const text = messageText(output.parts);
      if (text.trim() === "" || !await verifiedRoot(hookInput.sessionID)) return;
      try {
        const recalled = await feature.recall({ query: text }, { automatic: true });
        if (recalled.results.length === 0 && !recalled.coreIncluded) return;
        selections.set(hookInput.sessionID, {
          capsule: recalled.capsule,
          refs: recalled.results.map((item) => item.ref),
          warnings: recalled.warnings,
          truncated: recalled.truncated,
        });
      } catch {
        warnOnce(hookInput.sessionID, "automatic recall failed");
      }
    },
    "experimental.chat.system.transform": async (
      hookInput: { sessionID?: string },
      output: { system: string[] },
    ) => {
      if (hookInput.sessionID == null) return;
      const selection = await currentSelection(hookInput.sessionID);
      if (selection != null) output.system.push(selection.capsule);
    },
    "experimental.session.compacting": async (
      hookInput: { sessionID: string },
      output: { context: string[] },
    ) => {
      const selection = await currentSelection(hookInput.sessionID);
      if (selection != null) output.context.push(selection.capsule);
    },
    event: async ({ event }: { event: unknown }) => {
      if (record(event)?.type !== "session.deleted") return;
      const sessionID = sessionIdFromEvent(event);
      if (sessionID != null) {
        selections.delete(sessionID);
        for (const key of [...warned]) if (key.startsWith(`${hashRef("session", sessionID)}:`)) warned.delete(key);
      }
    },
    dispose: async () => {
      selections.clear();
      warned.clear();
    },
  };
}
