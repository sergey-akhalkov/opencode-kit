import fs from "node:fs";
import path from "node:path";
import { hashRef } from "../session-delivery-context/redaction.ts";
import { parseLegacyFeedbackEntry } from "./legacy-feedback.ts";
import {
  captureKaizenSignal,
  readKaizenInbox,
  recordKaizenCheckpoint,
  recordKaizenDecision,
  recordKaizenDiagnostic,
  recordKaizenNoSignal,
  resolveKaizenStore,
  transitionKaizenSignal,
  type KaizenCaptureResult,
  type KaizenCheckpoint,
  type KaizenCheckpointInput,
  type KaizenDecision,
  type KaizenDecisionInput,
  type KaizenEnvironment,
  type KaizenObservation,
  type KaizenRootInput,
  type KaizenSignal,
  type KaizenSignalInput,
  type KaizenSource,
  type KaizenStatus,
  type KaizenStore,
} from "./store.ts";

export * from "./store.ts";

export const KAIZEN_REPORT_TOOL = "kaizen_report";
export const KAIZEN_STATUS_TOOL = "kaizen_status";
export const KAIZEN_DECISION_TOOL = "kaizen_decision";
export const KAIZEN_CHECKPOINT_TOOL = "kaizen_checkpoint";
export const KAIZEN_IMPORT_TOOL = "kaizen_import_feedback";
export const KAIZEN_ENVELOPE_OPEN = "<kaizen_signal>";
export const KAIZEN_ENVELOPE_CLOSE = "</kaizen_signal>";

export type KaizenProposalOwnerState = "current-root" | "different-root" | "invalid" | "unconfigured";

type KaizenFeatureInput = Omit<KaizenRootInput, "environment"> & { environment?: KaizenEnvironment };

export type KaizenFeature = {
  enabled: true;
  projectRef: string;
  proposalOwnerState: KaizenProposalOwnerState;
  capture(input: KaizenSignalInput, source: KaizenSource, context: { sessionRef: string; sourceEventRef?: string }, now?: Date): Promise<KaizenCaptureResult>;
  checkpoint(input: KaizenCheckpointInput, context: { sessionRef: string; sourceEventRef?: string }, now?: Date): Promise<KaizenCheckpoint>;
  decision(input: KaizenDecisionInput, context: { sessionRef: string; sourceEventRef?: string }, now?: Date): Promise<KaizenDecision>;
  diagnostic(source: KaizenSource, sourceEventRef: string, code: string, now?: Date): Promise<void>;
  noSignal(sourceEventRef: string, sessionRef: string, now?: Date): Promise<KaizenObservation>;
  repairGaps(checkpoints: KaizenCheckpoint[]): Promise<Array<{ changeRef: string; checkpointRef: string; createdAt: string; status: "repair-gap" }>>;
  status(options?: { limit?: number; originProjectRef?: string; statuses?: KaizenStatus[] }): ReturnType<typeof readKaizenInbox>;
  transition(input: { signalRef: string; status: Exclude<KaizenStatus, "pending">; note?: string }, now?: Date): Promise<KaizenSignal>;
  validateSessionDirectory(directory: string | undefined): boolean;
};

type PluginInput = {
  client?: {
    session?: {
      get(input: { path: { id: string }; query?: { directory?: string } }): Promise<unknown>;
      messages(input: { path: { id: string }; query?: { directory?: string; limit?: number } }): Promise<unknown>;
    };
  };
  project?: { worktree?: string };
  directory?: string;
  worktree?: string;
};

type ToolContext = {
  sessionID?: string;
  messageID?: string;
  directory?: string;
  worktree?: string;
  metadata(input: { title?: string; metadata?: Record<string, unknown> }): void;
};

const STRING = { type: "string" } as const;
const SIGNAL_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    kind: { enum: ["friction", "repetition", "waste", "failure-pattern", "process-gap", "tooling-gap"] },
    summary: STRING,
    observedEvidence: STRING,
    impact: STRING,
    likelyCause: STRING,
    doNotRepeat: STRING,
    scopeHint: { enum: ["current-project", "opencode-kit", "external", "unknown"] },
    evidenceRefs: { type: "array", minItems: 1, maxItems: 8, items: STRING },
  },
  required: ["kind", "summary", "observedEvidence", "impact", "likelyCause", "doNotRepeat", "scopeHint", "evidenceRefs"],
} as const;
const STATUS_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    details: { type: "boolean" },
    limit: { type: "integer", minimum: 1, maximum: 25 },
    scope: { enum: ["cross-project", "current-project"] },
    statuses: { type: "array", maxItems: 5, items: { enum: ["pending", "triaged", "promoted", "resolved", "wont-fix"] } },
  },
} as const;
const DECISION_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    signalRef: STRING,
    decision: { enum: ["duplicate", "local-memory", "project-change", "kit-candidate", "external-owner", "needs-investigation", "no-action", "owner-blocked", "resolved"] },
    evidenceRefs: { type: "array", minItems: 1, maxItems: 8, items: STRING },
    ownerClass: { enum: ["current-project", "opencode-kit", "external", "unknown"] },
    nextBoundaryOrTerminalReason: STRING,
  },
  required: ["signalRef", "decision", "evidenceRefs", "ownerClass", "nextBoundaryOrTerminalReason"],
} as const;
const CHECKPOINT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    changeRef: STRING,
    checkpointRef: STRING,
    status: { enum: ["harvest-pending", "captured", "no-signal", "archive-failed"] },
    signals: { type: "array", maxItems: 3, items: SIGNAL_SCHEMA },
  },
  required: ["changeRef", "status"],
} as const;
const IMPORT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    entry: STRING,
    evidenceRef: STRING,
  },
  required: ["entry", "evidenceRef"],
} as const;
class CaptureIssue extends Error {
  readonly code: string;

  constructor(code: string) {
    super(code);
    this.name = "CaptureIssue";
    this.code = code;
  }
}

function record(value: unknown): Record<string, unknown> | null {
  return value != null && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null;
}

function exactKeys(value: Record<string, unknown>, allowed: string[], field: string): void {
  const extras = Object.keys(value).filter((key) => !allowed.includes(key));
  if (extras.length > 0) throw new Error(`${field} contains unsupported keys: ${extras.sort().join(",")}`);
}

function responseValue(value: unknown): unknown {
  const response = record(value);
  if (response == null) return value;
  if (response.error != null) throw new Error("Kaizen client request failed.", { cause: response.error });
  return Object.hasOwn(response, "data") ? response.data : value;
}

async function withDeadline<T>(operation: Promise<T>, milliseconds: number, label: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | null = null;
  try {
    return await Promise.race([
      operation,
      new Promise<never>((_resolve, reject) => {
        timer = setTimeout(() => reject(new Error(`${label} timed out.`)), milliseconds);
      }),
    ]);
  } finally {
    if (timer != null) clearTimeout(timer);
  }
}

function sessionDirectoryMatches(store: KaizenStore, directory: string | undefined): boolean {
  if (directory == null || directory.trim() === "") return false;
  try {
    const canonical = fs.realpathSync.native(path.resolve(directory));
    const relative = path.relative(store.canonicalRoot, canonical);
    return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
  } catch {
    return false;
  }
}

function proposalOwnerState(store: KaizenStore, environment: KaizenEnvironment): KaizenProposalOwnerState {
  const configured = environment.OPENCODE_KAIZEN_PROPOSAL_OWNER_ROOT;
  if (configured == null || configured === "") return "unconfigured";
  if (configured.trim() !== configured || !path.isAbsolute(configured)) return "invalid";
  try {
    const canonical = fs.realpathSync.native(path.resolve(configured));
    if (!fs.statSync(canonical).isDirectory()) return "invalid";
    return path.relative(store.canonicalRoot, canonical) === "" ? "current-root" : "different-root";
  } catch {
    return "invalid";
  }
}

async function directoryEntries(directory: string): Promise<fs.Dirent[]> {
  try {
    return await fs.promises.readdir(directory, { withFileTypes: true });
  } catch (error) {
    if ((error as { code?: unknown })?.code === "ENOENT") return [];
    throw new Error("Kaizen archive repair-gap inspection failed.", { cause: error });
  }
}

async function pathExists(file: string): Promise<boolean> {
  try {
    await fs.promises.lstat(file);
    return true;
  } catch (error) {
    if ((error as { code?: unknown })?.code === "ENOENT") return false;
    throw new Error("Kaizen archive repair-gap inspection failed.", { cause: error });
  }
}

async function deriveRepairGaps(store: KaizenStore, checkpoints: KaizenCheckpoint[]) {
  const pending = checkpoints.filter((checkpoint) => checkpoint.projectRef === store.projectRef && checkpoint.status === "harvest-pending");
  if (pending.length === 0) return [];
  const archiveEntries = await directoryEntries(path.join(store.canonicalRoot, "openspec", "changes", "archive"));
  const gaps: Array<{ changeRef: string; checkpointRef: string; createdAt: string; status: "repair-gap" }> = [];
  for (const checkpoint of pending) {
    const active = path.join(store.canonicalRoot, "openspec", "changes", checkpoint.changeRef);
    if (await pathExists(active)) continue;
    const archived = archiveEntries.some((entry) => entry.isDirectory() && /^\d{4}-\d{2}-\d{2}-/u.test(entry.name) && entry.name.slice(11) === checkpoint.changeRef);
    if (archived) gaps.push({ changeRef: checkpoint.changeRef, checkpointRef: checkpoint.checkpointRef, createdAt: checkpoint.createdAt, status: "repair-gap" });
  }
  return gaps.sort((left, right) => left.createdAt.localeCompare(right.createdAt) || left.checkpointRef.localeCompare(right.checkpointRef));
}

export function createKaizenFeature(input: KaizenFeatureInput): KaizenFeature | null {
  const environment = input.environment ?? process.env;
  if (environment.OPENCODE_KAIZEN === "0") return null;
  const store = resolveKaizenStore({ ...input, environment });
  if (store == null) return null;
  return {
    enabled: true,
    projectRef: store.projectRef,
    proposalOwnerState: proposalOwnerState(store, environment),
    capture(signal, source, context, now) {
      return captureKaizenSignal(store, signal, source, context, now);
    },
    checkpoint(checkpoint, context, now) {
      return recordKaizenCheckpoint(store, checkpoint, context, now);
    },
    decision(decision, context, now) {
      return recordKaizenDecision(store, decision, context, now);
    },
    diagnostic(source, sourceEventRef, code, now) {
      return recordKaizenDiagnostic(store, source, sourceEventRef, code, now);
    },
    noSignal(sourceEventRef, sessionRef, now) {
      return recordKaizenNoSignal(store, sourceEventRef, sessionRef, now);
    },
    repairGaps(checkpoints) {
      return deriveRepairGaps(store, checkpoints);
    },
    status(options) {
      return readKaizenInbox(store, options);
    },
    transition(action, now) {
      return transitionKaizenSignal(store, action, now);
    },
    validateSessionDirectory(directory) {
      return sessionDirectoryMatches(store, directory);
    },
  };
}

export function parseKaizenEnvelope(summary: string): KaizenSignalInput[] {
  if (Buffer.byteLength(summary, "utf8") > 64 * 1024) throw new Error("Kaizen compaction summary exceeds 64 KiB.");
  const openCount = summary.split(KAIZEN_ENVELOPE_OPEN).length - 1;
  const closeCount = summary.split(KAIZEN_ENVELOPE_CLOSE).length - 1;
  const expression = /<kaizen_signal>\s*([\s\S]*?)\s*<\/kaizen_signal>/gu;
  const matches = [...summary.matchAll(expression)];
  if (openCount !== 1 || closeCount !== 1 || matches.length !== 1) throw new Error("Kaizen compaction summary must contain exactly one signal envelope.");
  if (Buffer.byteLength(matches[0]![1]!, "utf8") > 4 * 1024) throw new Error("Kaizen signal envelope exceeds 4 KiB.");
  let parsed: unknown;
  try {
    parsed = JSON.parse(matches[0]![1]!);
  } catch (error) {
    throw new Error("Kaizen signal envelope is not valid JSON.", { cause: error });
  }
  const envelope = record(parsed);
  if (envelope == null) throw new Error("Kaizen signal envelope must be an object.");
  exactKeys(envelope, ["schemaVersion", "signals"], "Kaizen signal envelope");
  if (envelope.schemaVersion !== 1 || !Array.isArray(envelope.signals) || envelope.signals.length > 3) throw new Error("Kaizen signal envelope schema is invalid.");
  return envelope.signals.map((value, index) => {
    const signal = record(value);
    if (signal == null) throw new Error(`Kaizen signal ${index} must be an object.`);
    exactKeys(signal, ["kind", "summary", "observedEvidence", "impact", "likelyCause", "doNotRepeat", "scopeHint", "evidenceRefs"], `Kaizen signal ${index}`);
    if ([signal.kind, signal.summary, signal.observedEvidence, signal.impact, signal.likelyCause, signal.doNotRepeat, signal.scopeHint].some((field) => typeof field !== "string")) {
      throw new Error(`Kaizen signal ${index} requires all closed-schema text fields.`);
    }
    if (!Array.isArray(signal.evidenceRefs)) throw new Error(`Kaizen signal ${index} evidenceRefs must be an array.`);
    return signal as KaizenSignalInput;
  });
}

function summaryText(message: Record<string, unknown>): string {
  const parts = Array.isArray(message.parts) ? message.parts : [];
  return parts.flatMap((part) => {
    const value = record(part);
    return value?.type === "text" && typeof value.text === "string" ? [value.text] : [];
  }).join("\n");
}

function newestSummary(messages: unknown[], sessionID: string): { id: string; text: string } {
  const candidates = messages.flatMap((message) => {
    const row = record(message);
    const info = record(row?.info);
    const time = record(info?.time);
    if (info?.role !== "assistant" || info.summary !== true || info.sessionID !== sessionID || typeof info.id !== "string" || typeof time?.created !== "number") return [];
    return [{ id: info.id, created: time.created, text: summaryText(row!) }];
  }).sort((left, right) => right.created - left.created || left.id.localeCompare(right.id));
  if (candidates.length === 0) throw new CaptureIssue("compaction-summary-missing");
  if (candidates.length > 1 && candidates[0]!.created === candidates[1]!.created) throw new CaptureIssue("compaction-summary-ambiguous");
  if (candidates[0]!.text.trim() === "") throw new CaptureIssue("compaction-summary-empty");
  return candidates[0]!;
}

function eventSessionID(event: unknown): string | null {
  const properties = record(record(event)?.properties);
  return typeof properties?.sessionID === "string" ? properties.sessionID : null;
}

function eventRef(event: unknown, sessionID: string): string {
  const id = record(event)?.id;
  return `compaction:${hashRef("session", sessionID)}:${hashRef("event", typeof id === "string" ? id : sessionID)}`;
}

function lifecycleToolInput<T>(args: unknown, label: string): T {
  const input = record(record(args)?.input);
  if (input == null) throw new Error(`${label} requires an object-valued input.`);
  return input as T;
}

function toolCaptureContext(kind: "explicit" | "decision" | "checkpoint", input: unknown, context: ToolContext) {
  if (typeof context.sessionID !== "string" || typeof context.messageID !== "string") throw new Error(`Kaizen ${kind} requires current session and message identity.`);
  return {
    sessionRef: hashRef("session", context.sessionID),
    sourceEventRef: `${kind}:${hashRef("message", context.messageID)}:${hashRef("input", JSON.stringify(input))}`,
  };
}

function boundedToolResult(title: string, value: unknown, metadata: Record<string, unknown>, context: ToolContext, maximumBytes = 32 * 1024) {
  const output = `${JSON.stringify(value, null, 2)}\n`;
  if (Buffer.byteLength(output, "utf8") > maximumBytes) throw new Error(`${title} output exceeded ${maximumBytes / 1024} KiB.`);
  context.metadata({ title, metadata });
  return { title, output, metadata };
}

function toolResult(result: KaizenCaptureResult, context: ToolContext) {
  const metadata = { action: result.action, occurrenceCount: result.occurrenceCount, projectRef: result.projectRef, sessionRef: result.sessionRef, signalRef: result.signalRef, source: result.source };
  return boundedToolResult("Kaizen report", result, metadata, context, 4 * 1024);
}

function statusProjection(
  inbox: Awaited<ReturnType<typeof readKaizenInbox>>,
  projectRef: string,
  repairGaps: Array<{ changeRef: string; checkpointRef: string; createdAt: string; status: "repair-gap" }>,
  options: {
    details: boolean;
    proposalOwnerState: KaizenProposalOwnerState;
    scope: "cross-project" | "current-project";
  },
) {
  return {
    schemaVersion: 1,
    activation: "enabled",
    projectRef,
    ordering: "oldest-createdAt-then-signalRef",
    proposalOwner: {
      state: options.proposalOwnerState,
      proposalCreationAllowed: options.proposalOwnerState === "current-root",
    },
    selection: {
      details: options.details,
      scope: options.scope,
      totalSignals: inbox.totalSignals,
    },
    counts: inbox.counts,
    capacity: inbox.capacity,
    signals: inbox.signals.map((signal) => ({
      signalRef: signal.signalRef,
      status: signal.status,
      sources: signal.sources,
      scopeHint: signal.scopeHint,
      occurrenceCount: signal.occurrenceCount,
      projectCount: signal.projectRefs.length,
      sessionCount: signal.sessionRefs.length,
      lastSeenAt: signal.lastSeenAt,
      createdAt: signal.createdAt,
      decisionRef: signal.decision?.decisionRef ?? null,
      ...(options.details ? {
        kind: signal.kind,
        summary: signal.summary,
        observedEvidence: signal.observedEvidence,
        impact: signal.impact,
        likelyCause: signal.likelyCause,
        doNotRepeat: signal.doNotRepeat,
        evidenceRefs: signal.evidenceRefs,
      } : {}),
    })),
    decisions: inbox.decisions.map((decision) => ({
      decisionRef: decision.decisionRef,
      signalRef: decision.signalRef,
      decision: decision.decision,
      ownerClass: decision.ownerClass,
      createdAt: decision.createdAt,
    })),
    checkpoints: inbox.checkpoints.map((checkpoint) => ({
      checkpointRef: checkpoint.checkpointRef,
      changeRef: checkpoint.changeRef,
      status: checkpoint.status,
      signalRefs: checkpoint.signalRefs,
      createdAt: checkpoint.createdAt,
    })),
    diagnostics: inbox.diagnostics,
    observations: inbox.observations,
    repairGaps,
    repairGapsTruncated: inbox.truncation.checkpoints,
    totalSignals: inbox.totalSignals,
    truncation: inbox.truncation,
    truncated: inbox.truncated,
  };
}

export function createKaizenPluginHooks(input: PluginInput, environment: KaizenEnvironment = process.env) {
  if (environment.OPENCODE_KAIZEN === "0") return {};
  const feature = createKaizenFeature({
    worktree: input.worktree,
    projectWorktree: input.project?.worktree,
    directory: input.directory,
    startupDirectory: input.directory,
    environment,
  });
  if (feature == null || input.client?.session?.get == null || input.client.session.messages == null || typeof input.directory !== "string") return {};
  const warned = new Set<string>();
  const warnOnce = (sessionID: string, code: string) => {
    const key = `${hashRef("session", sessionID)}:${code}`;
    if (warned.has(key)) return;
    warned.add(key);
    console.warn(`[kaizen] ${code}; session=${hashRef("session", sessionID)}`);
  };
  const diagnostic = async (sessionID: string, sourceRef: string, code: string) => {
    warnOnce(sessionID, code);
    try {
      await feature.diagnostic("compaction", `${sourceRef}:${code}`, code);
    } catch {
      warnOnce(sessionID, "diagnostic-store-failed");
    }
  };

  return {
    tool: {
      [KAIZEN_REPORT_TOOL]: {
        description: "Append one explicit bounded workflow-improvement signal to the machine-local cross-project Kaizen inbox.",
        args: { input: SIGNAL_SCHEMA },
        async execute(args: unknown, context: ToolContext) {
          if (!feature.validateSessionDirectory(context.directory ?? context.worktree)) throw new Error("Kaizen report context does not match the configured project root.");
          const signal = lifecycleToolInput<KaizenSignalInput>(args, "Kaizen report");
          return toolResult(await feature.capture(signal, "explicit", toolCaptureContext("explicit", signal, context)), context);
        },
      },
      [KAIZEN_STATUS_TOOL]: {
        description: "Return bounded Kaizen activation, capacity, refs, lifecycle, checkpoints, diagnostics, and explicitly gated triage details.",
        args: STATUS_SCHEMA,
        async execute(args: unknown, context: ToolContext) {
          if (!feature.validateSessionDirectory(context.directory ?? context.worktree)) throw new Error("Kaizen status context does not match the configured project root.");
          const input = record(args) ?? {};
          exactKeys(input, ["details", "limit", "scope", "statuses"], "Kaizen status");
          const details = input.details ?? false;
          if (typeof details !== "boolean") throw new Error("Kaizen status details must be a boolean.");
          const limit = input.limit == null ? 25 : input.limit;
          if (!Number.isInteger(limit) || (limit as number) < 1 || (limit as number) > 25) throw new Error("Kaizen status limit must be between 1 and 25.");
          const scope = input.scope ?? "cross-project";
          if (scope !== "cross-project" && scope !== "current-project") throw new Error("Kaizen status scope must be cross-project or current-project.");
          if (input.statuses != null && !Array.isArray(input.statuses)) throw new Error("Kaizen status statuses must be an array.");
          if (details && scope === "cross-project" && feature.proposalOwnerState !== "current-root") {
            throw new Error("Cross-project Kaizen triage details require the active project to be the configured proposal-owner root.");
          }
          const inbox = await feature.status({
            limit: limit as number,
            originProjectRef: scope === "current-project" ? feature.projectRef : undefined,
            statuses: input.statuses as KaizenStatus[] | undefined,
          });
          const repairGaps = await feature.repairGaps(inbox.checkpoints);
          const projection = statusProjection(inbox, feature.projectRef, repairGaps, {
            details,
            proposalOwnerState: feature.proposalOwnerState,
            scope,
          });
          return boundedToolResult("Kaizen status", projection, {
            checkpoints: inbox.counts.checkpoints,
            decisions: inbox.counts.decisions,
            pending: inbox.counts.pending,
            projectRef: feature.projectRef,
            repairGaps: repairGaps.length,
            signals: inbox.counts.signals,
            truncated: inbox.truncated,
          }, context);
        },
      },
      [KAIZEN_DECISION_TOOL]: {
        description: "Append one evidence-bounded non-authorizing lifecycle decision for an existing Kaizen signal.",
        args: { input: DECISION_SCHEMA },
        async execute(args: unknown, context: ToolContext) {
          if (!feature.validateSessionDirectory(context.directory ?? context.worktree)) throw new Error("Kaizen decision context does not match the configured project root.");
          const decisionInput = lifecycleToolInput<KaizenDecisionInput>(args, "Kaizen decision");
          const decision = await feature.decision(decisionInput, toolCaptureContext("decision", decisionInput, context));
          const output = {
            schemaVersion: 1,
            decisionRef: decision.decisionRef,
            signalRef: decision.signalRef,
            decision: decision.decision,
            ownerClass: decision.ownerClass,
            projectRef: decision.projectRef,
            sessionRef: decision.sessionRef,
            createdAt: decision.createdAt,
          };
          return boundedToolResult("Kaizen decision", output, output, context, 4 * 1024);
        },
      },
      [KAIZEN_CHECKPOINT_TOOL]: {
        description: "Append one idempotent non-authorizing OpenSpec archive-harvest checkpoint, including zero to three archive signals on successful closure.",
        args: { input: CHECKPOINT_SCHEMA },
        async execute(args: unknown, context: ToolContext) {
          if (!feature.validateSessionDirectory(context.directory ?? context.worktree)) throw new Error("Kaizen checkpoint context does not match the configured project root.");
          const input = lifecycleToolInput<Record<string, unknown>>(args, "Kaizen checkpoint");
          exactKeys(input, ["changeRef", "checkpointRef", "status", "signals"], "Kaizen checkpoint");
          const status = input.status;
          if (typeof input.changeRef !== "string" || !["harvest-pending", "captured", "no-signal", "archive-failed"].includes(String(status))) {
            throw new Error("Kaizen checkpoint requires a changeRef and valid status.");
          }
          const contextBase = toolCaptureContext("checkpoint", input, context);
          let checkpointInput: KaizenCheckpointInput;
          let sourceEventRef: string;
          if (status === "harvest-pending") {
            if (input.checkpointRef != null || input.signals != null) {
              throw new Error("Kaizen pending checkpoint requires only changeRef and harvest-pending status.");
            }
            checkpointInput = { changeRef: input.changeRef, status };
            sourceEventRef = contextBase.sourceEventRef;
          } else {
            if (typeof input.checkpointRef !== "string") throw new Error("Kaizen checkpoint closure requires checkpointRef.");
            const signals = input.signals;
            if (status === "captured") {
              if (!Array.isArray(signals) || signals.length < 1 || signals.length > 3) throw new Error("Captured Kaizen checkpoint requires one to three signals.");
              const signalRefs: string[] = [];
              for (const [index, signal] of signals.entries()) {
                const captured = await feature.capture(signal as KaizenSignalInput, "archive", {
                  sessionRef: contextBase.sessionRef,
                  sourceEventRef: `archive:${input.checkpointRef}:${index}`,
                });
                signalRefs.push(captured.signalRef);
              }
              checkpointInput = { changeRef: input.changeRef, checkpointRef: input.checkpointRef, status, signalRefs };
            } else {
              if (signals != null) throw new Error(`${status} Kaizen checkpoint must not contain signals.`);
              checkpointInput = { changeRef: input.changeRef, checkpointRef: input.checkpointRef, status };
            }
            sourceEventRef = `checkpoint:${input.checkpointRef}:${status}`;
          }
          const checkpoint = await feature.checkpoint(checkpointInput, { sessionRef: contextBase.sessionRef, sourceEventRef });
          return boundedToolResult("Kaizen checkpoint", checkpoint, {
            changeRef: checkpoint.changeRef,
            checkpointRef: checkpoint.checkpointRef,
            projectRef: checkpoint.projectRef,
            status: checkpoint.status,
          }, context, 4 * 1024);
        },
      },
      [KAIZEN_IMPORT_TOOL]: {
        description: "Import one exact maintained FB-* Markdown fallback entry as an idempotent pending legacy-feedback signal without trusting its written status.",
        args: { input: IMPORT_SCHEMA },
        async execute(args: unknown, context: ToolContext) {
          if (!feature.validateSessionDirectory(context.directory ?? context.worktree)) throw new Error("Kaizen legacy import context does not match the configured project root.");
          const input = lifecycleToolInput<Record<string, unknown>>(args, "Kaizen legacy import");
          exactKeys(input, ["entry", "evidenceRef"], "Kaizen legacy import");
          if (typeof input.entry !== "string" || typeof input.evidenceRef !== "string") throw new Error("Kaizen legacy import requires entry and evidenceRef strings.");
          const parsed = parseLegacyFeedbackEntry(input.entry, input.evidenceRef);
          const captureContext = toolCaptureContext("explicit", parsed.signal, context);
          const result = await feature.capture(parsed.signal, "legacy-feedback", {
            sessionRef: captureContext.sessionRef,
            sourceEventRef: `legacy:${feature.projectRef}:${parsed.feedbackId}`,
          });
          const output = {
            schemaVersion: 1,
            action: result.action,
            feedbackId: parsed.feedbackId,
            legacyStatus: parsed.legacyStatus,
            requiresCurrentEvidence: true,
            signalRef: result.signalRef,
            source: result.source,
          };
          return boundedToolResult("Kaizen legacy feedback import", output, output, context, 4 * 1024);
        },
      },
    },
    event: async ({ event }: { event: unknown }) => {
      if (record(event)?.type !== "session.compacted") return;
      const sessionID = eventSessionID(event);
      if (sessionID == null) {
        warnOnce("missing", "compaction-session-missing");
        return;
      }
      const sourceRef = eventRef(event, sessionID);
      try {
        const response = await withDeadline(input.client!.session!.get({ path: { id: sessionID }, query: { directory: input.directory } }), 1_000, "Kaizen root lookup");
        const session = record(responseValue(response));
        if (session?.id !== sessionID || session.parentID != null || session.parent_id != null) {
          await diagnostic(sessionID, sourceRef, "compaction-root-invalid");
          return;
        }
        if (!feature.validateSessionDirectory(typeof session.directory === "string" ? session.directory : undefined)) {
          await diagnostic(sessionID, sourceRef, "compaction-directory-mismatch");
          return;
        }
        const messagesResponse = await withDeadline(input.client!.session!.messages({ path: { id: sessionID }, query: { directory: input.directory, limit: 100 } }), 2_000, "Kaizen summary lookup");
        const messages = responseValue(messagesResponse);
        if (!Array.isArray(messages)) throw new Error("Kaizen summary lookup returned an invalid response.");
        const summary = newestSummary(messages, sessionID);
        let signals: KaizenSignalInput[];
        try {
          signals = parseKaizenEnvelope(summary.text);
        } catch {
          await diagnostic(sessionID, sourceRef, "compaction-envelope-invalid");
          return;
        }
        const summaryRef = `${sourceRef}:${hashRef("message", summary.id)}`;
        const sessionRef = hashRef("session", sessionID);
        if (signals.length === 0) {
          await feature.noSignal(summaryRef, sessionRef);
          return;
        }
        for (const [index, signal] of signals.entries()) {
          await feature.capture(signal, "compaction", {
            sessionRef,
            sourceEventRef: `${summaryRef}:${index}`,
          });
        }
      } catch (error) {
        await diagnostic(sessionID, sourceRef, error instanceof CaptureIssue ? error.code : "compaction-capture-failed");
      }
    },
    dispose: async () => {
      warned.clear();
    },
  };
}
