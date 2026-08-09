import { hasColumns, normalizeMillis, quoteIdent, selectColumnOrNull } from "./db.ts";
import { hashRef, sanitizeText } from "./redaction.ts";
import type { DbSchema } from "./db-types.ts";
import type { SqliteDatabase } from "./sqlite.ts";
import type {
  DeliveryContextAssistantEvidence,
  DeliveryContextAuditRef,
  DeliveryContextBackgroundEvidence,
  DeliveryContextDescendantEvidence,
  DeliveryContextDiffEvidence,
  DeliveryContextStrategyRef,
  DeliveryContextSyntheticMessage,
  DeliveryContextToolEvidence,
  DeliveryContextTruncation,
  DeliveryContextUserMessage,
  DeliveryContextValidationEvidence,
} from "./projection.ts";

const ASSISTANT_LIMIT = 16;
const DESCENDANT_LIMIT = 32;
const DIFF_LIMIT = 24;
const EXECUTION_TEXT_LIMIT = 2_000;
const SYNTHETIC_LIMIT = 32;
const SYNTHETIC_TEXT_LIMIT = 4_000;
const TOOL_LIMIT = 64;
const VALIDATION_LIMIT = 24;

type CompletionEvidence = {
  assistantEvidence: DeliveryContextAssistantEvidence[];
  auditRefs: DeliveryContextAuditRef[];
  background: DeliveryContextBackgroundEvidence[];
  descendants: DeliveryContextDescendantEvidence[];
  diffEvidence: DeliveryContextDiffEvidence[];
  humanMessages: DeliveryContextUserMessage[];
  strategyRefs: DeliveryContextStrategyRef[];
  syntheticMessages: DeliveryContextSyntheticMessage[];
  toolEvidence: DeliveryContextToolEvidence[];
  truncationWarnings: DeliveryContextTruncation[];
  validationEvidence: DeliveryContextValidationEvidence[];
};

type MessageRow = Record<string, unknown> & {
  data: unknown;
  id: unknown;
  time_created: unknown;
};

type PartRow = Record<string, unknown> & {
  data: unknown;
  id: unknown;
  message_id: unknown;
  session_id: unknown;
  time_created: unknown;
};

function parseRecord(value: unknown): Record<string, unknown> | null {
  if (value != null && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  if (typeof value !== "string") {
    return null;
  }
  try {
    const parsed = JSON.parse(value) as unknown;
    return parsed != null && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

function stringValue(value: unknown): string | null {
  return typeof value === "string" && value !== "" ? value : null;
}

function eventTime(value: unknown): string | null {
  const millis = normalizeMillis(value);
  if (millis == null) return null;
  const date = new Date(millis);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function textIdentity(text: string): string {
  return text.trim().replace(/\s+/g, " ").toLowerCase();
}

function boundedText(
  raw: string,
  rawSessionId: string,
  surface: string,
  limit: number,
  truncations: DeliveryContextTruncation[],
): { text: string; truncated: boolean } {
  const sanitized = sanitizeText(raw, rawSessionId);
  if (sanitized.length <= limit) {
    return { text: sanitized, truncated: false };
  }
  truncations.push({ limit, omitted: sanitized.length - limit, surface });
  return { text: sanitized.slice(0, limit), truncated: true };
}

function cap<T>(
  values: T[],
  limit: number,
  surface: string,
  truncations: DeliveryContextTruncation[],
): T[] {
  if (values.length <= limit) return values;
  truncations.push({ limit, omitted: values.length - limit, surface });
  return values.slice(values.length - limit);
}

function partProvenance(part: Record<string, unknown>, text: string): DeliveryContextSyntheticMessage["provenance"] {
  const metadata = parseRecord(part.metadata);
  const declared = [metadata?.provenance, metadata?.source, metadata?.owner]
    .map(stringValue)
    .filter((value): value is string => value != null)
    .join(" ")
    .toLowerCase();
  if (declared.includes("completion-guard") || declared.includes("session-guard") || /^<completion_guard\b/i.test(text)) {
    return "guard";
  }
  if (declared.includes("pty") || /^<pty_exited\b/i.test(text)) return "pty";
  if (declared.includes("task") || /^<task_(?:result|error)\b/i.test(text)) return "task";
  if (declared.includes("compact") || declared.includes("summary")) return "compaction";
  return "opencode";
}

function isSyntheticPart(part: Record<string, unknown>, text: string): boolean {
  if (part.synthetic === true) return true;
  const provenance = partProvenance(part, text);
  return provenance !== "opencode" || /^<(?:pty_exited|task_result|task_error|completion_guard)\b/i.test(text);
}

function partText(part: Record<string, unknown>): string | null {
  return stringValue(part.text) ?? stringValue(part.content);
}

function readParts(
  db: SqliteDatabase,
  schema: DbSchema,
  sessionIds: string[],
): PartRow[] {
  if (sessionIds.length === 0 || !hasColumns(schema, "part", ["session_id", "message_id", "data"])) {
    return [];
  }
  const select = [
    selectColumnOrNull(schema, "part", "id"),
    selectColumnOrNull(schema, "part", "message_id"),
    selectColumnOrNull(schema, "part", "session_id"),
    selectColumnOrNull(schema, "part", "time_created"),
    selectColumnOrNull(schema, "part", "data"),
  ];
  const order = schema.get("part")?.has("time_created") === true
    ? `${quoteIdent("time_created")}, ${quoteIdent("id")}`
    : quoteIdent("message_id");
  return db.prepare(
    `select ${select.join(", ")} from part where session_id in (${sessionIds.map(() => "?").join(", ")}) order by ${order}`,
  ).all(...sessionIds) as PartRow[];
}

function readMessages(
  db: SqliteDatabase,
  schema: DbSchema,
  sessionId: string,
): MessageRow[] {
  if (!hasColumns(schema, "message", ["session_id", "data"])) return [];
  const select = [
    selectColumnOrNull(schema, "message", "id"),
    selectColumnOrNull(schema, "message", "time_created"),
    selectColumnOrNull(schema, "message", "data"),
  ];
  const order = schema.get("message")?.has("time_created") === true
    ? `${quoteIdent("time_created")}, ${quoteIdent("id")}`
    : quoteIdent("id");
  return db.prepare(
    `select ${select.join(", ")} from message where session_id = ? order by ${order}`,
  ).all(sessionId) as MessageRow[];
}

function userMessageEvidence(
  messages: MessageRow[],
  parts: PartRow[],
  rawSessionId: string,
  truncations: DeliveryContextTruncation[],
): { human: DeliveryContextUserMessage[]; synthetic: DeliveryContextSyntheticMessage[]; rawSynthetic: string[] } {
  const byMessage = new Map<string, Array<{ parsed: Record<string, unknown>; row: PartRow }>>();
  for (const row of parts) {
    const parsed = parseRecord(row.data);
    if (parsed == null) continue;
    const messageId = String(row.message_id);
    const existing = byMessage.get(messageId) ?? [];
    existing.push({ parsed, row });
    byMessage.set(messageId, existing);
  }
  const human: DeliveryContextUserMessage[] = [];
  const synthetic: DeliveryContextSyntheticMessage[] = [];
  const rawSynthetic: string[] = [];
  for (const [index, row] of messages.entries()) {
    const message = parseRecord(row.data);
    if (message?.role !== "user") continue;
    const messageId = String(row.id ?? `${rawSessionId}:${index}`);
    const messageParts = byMessage.get(messageId) ?? [];
    const textParts = messageParts.flatMap(({ parsed }) => {
      const text = partText(parsed);
      return text == null || parsed.ignored === true ? [] : [{ parsed, text }];
    });
    if (textParts.length === 0) {
      const direct = stringValue(message.content) ?? stringValue(message.text);
      if (direct != null) textParts.push({ parsed: message, text: direct });
    }
    const humanText = textParts.filter(({ parsed, text }) => !isSyntheticPart(parsed, text));
    if (humanText.length > 0) {
      human.push({
        eventRef: hashRef("message", messageId),
        kind: "message",
        text: sanitizeText(humanText.map(({ text }) => text).join("\n"), rawSessionId),
        time: eventTime(row.time_created),
      });
    }
    for (const [partIndex, { parsed, text }] of textParts.entries()) {
      if (!isSyntheticPart(parsed, text)) continue;
      rawSynthetic.push(text);
      const bounded = boundedText(
        text,
        rawSessionId,
        "syntheticMessages.text",
        SYNTHETIC_TEXT_LIMIT,
        truncations,
      );
      synthetic.push({
        eventRef: hashRef("synthetic", `${messageId}:${partIndex}`),
        kind: "message",
        provenance: partProvenance(parsed, text),
        text: bounded.text,
        time: eventTime(row.time_created),
        truncated: bounded.truncated,
      });
    }
  }
  return { human, rawSynthetic, synthetic };
}

function sessionInputEvidence(
  db: SqliteDatabase,
  schema: DbSchema,
  rawSessionId: string,
  seenHuman: Set<string>,
  truncations: DeliveryContextTruncation[],
): { human: DeliveryContextUserMessage[]; synthetic: DeliveryContextSyntheticMessage[] } {
  if (!hasColumns(schema, "session_input", ["session_id", "prompt"])) {
    return { human: [], synthetic: [] };
  }
  const select = [
    selectColumnOrNull(schema, "session_input", "id"),
    selectColumnOrNull(schema, "session_input", "prompt"),
    selectColumnOrNull(schema, "session_input", "delivery"),
    selectColumnOrNull(schema, "session_input", "time_created"),
  ];
  const rows = db.prepare(
    `select ${select.join(", ")} from session_input where session_id = ? order by ${quoteIdent("time_created")}, ${quoteIdent("id")}`,
  ).all(rawSessionId) as Array<Record<string, unknown>>;
  const human: DeliveryContextUserMessage[] = [];
  const synthetic: DeliveryContextSyntheticMessage[] = [];
  for (const [index, row] of rows.entries()) {
    const prompt = stringValue(row.prompt);
    if (prompt == null) continue;
    const delivery = `${String(row.delivery ?? "")} ${JSON.stringify(parseRecord(row.delivery) ?? {})}`.toLowerCase();
    const machineGenerated = /synthetic|guard|compaction|task_result|pty_exited/.test(delivery);
    const eventRef = hashRef("input", String(row.id ?? `${rawSessionId}:${index}`));
    if (machineGenerated) {
      const bounded = boundedText(prompt, rawSessionId, "syntheticMessages.text", SYNTHETIC_TEXT_LIMIT, truncations);
      synthetic.push({
        eventRef,
        kind: "session_input",
        provenance: delivery.includes("guard") ? "guard" : "opencode",
        text: bounded.text,
        time: eventTime(row.time_created),
        truncated: bounded.truncated,
      });
      continue;
    }
    const sanitized = sanitizeText(prompt, rawSessionId);
    const identity = textIdentity(sanitized);
    if (seenHuman.has(identity)) continue;
    seenHuman.add(identity);
    human.push({ eventRef, kind: "session_input", text: sanitized, time: eventTime(row.time_created) });
  }
  return { human, synthetic };
}

function executionEvidence(
  messages: MessageRow[],
  parts: PartRow[],
  rawSessionId: string,
  truncations: DeliveryContextTruncation[],
): Pick<CompletionEvidence, "assistantEvidence" | "background" | "diffEvidence" | "strategyRefs" | "toolEvidence" | "validationEvidence"> {
  const messagesById = new Map(messages.map((row) => [String(row.id), parseRecord(row.data)]));
  const assistantText = new Map<string, string[]>();
  const assistantEvidence: DeliveryContextAssistantEvidence[] = [];
  const background: DeliveryContextBackgroundEvidence[] = [];
  const diffEvidence: DeliveryContextDiffEvidence[] = [];
  const strategyRefs = new Map<string, DeliveryContextStrategyRef>();
  const toolEvidence: DeliveryContextToolEvidence[] = [];
  const validationEvidence: DeliveryContextValidationEvidence[] = [];

  for (const row of parts) {
    const parsed = parseRecord(row.data);
    if (parsed == null) continue;
    const messageId = String(row.message_id);
    if (parsed.type === "text" && parsed.ignored !== true && messagesById.get(messageId)?.role === "assistant") {
      const text = partText(parsed);
      if (text != null) {
        const existing = assistantText.get(messageId) ?? [];
        existing.push(text);
        assistantText.set(messageId, existing);
      }
      continue;
    }
    if (parsed.type === "patch") {
      const files = Array.isArray(parsed.files)
        ? parsed.files.filter((value): value is string => typeof value === "string").map((file) => hashRef("path", file))
        : [];
      diffEvidence.push({
        eventRef: hashRef("diff", String(row.id)),
        files,
        patchRef: hashRef("patch", stringValue(parsed.hash) ?? JSON.stringify(files)),
        time: eventTime(row.time_created),
      });
      continue;
    }
    if (parsed.type !== "tool") continue;
    const state = parseRecord(parsed.state);
    const input = parseRecord(state?.input);
    const metadata = parseRecord(state?.metadata) ?? parseRecord(parsed.metadata);
    const tool = stringValue(parsed.tool) ?? "unknown";
    const status = stringValue(state?.status) ?? "unknown";
    const title = stringValue(state?.title);
    const output = stringValue(state?.output) ?? stringValue(state?.error);
    const boundedOutput = output == null
      ? null
      : boundedText(output, rawSessionId, "toolEvidence.output", EXECUTION_TEXT_LIMIT, truncations);
    const command = stringValue(input?.command);
    const callID = stringValue(parsed.callID) ?? String(row.id);
    const toolRow: DeliveryContextToolEvidence = {
      callRef: hashRef("call", callID),
      eventRef: hashRef("tool", String(row.id)),
      output: boundedOutput?.text ?? null,
      status,
      time: eventTime(row.time_created),
      title: title == null ? null : sanitizeText(title, rawSessionId),
      tool,
      truncated: boundedOutput?.truncated ?? false,
    };
    toolEvidence.push(toolRow);
    if (tool === "task") {
      const child = stringValue(metadata?.sessionID) ?? stringValue(metadata?.sessionId) ?? stringValue(metadata?.childSessionID);
      background.push({
        agent: stringValue(input?.subagent_type) ?? stringValue(input?.agent),
        callRef: toolRow.callRef,
        childRef: child == null ? null : hashRef("session", child),
        resultConsumed: status === "completed" ? "unknown" : false,
        status,
      });
    }
    const commandText = `${command ?? ""} ${title ?? ""}`;
    if (/\b(?:test|validate|lint|build|check|doctor|openspec\s+validate)\b/i.test(commandText)) {
      validationEvidence.push({
        callRef: toolRow.callRef,
        command: command == null ? null : sanitizeText(command, rawSessionId),
        eventRef: toolRow.eventRef,
        status,
        summary: boundedOutput?.text ?? null,
        time: toolRow.time,
        truncated: boundedOutput?.truncated ?? false,
      });
    }
    const strategyText = `${command ?? ""}\n${output ?? ""}`;
    for (const match of strategyText.matchAll(/(?:openspec[\\/]changes[\\/][^\s"']+[\\/]history\.md|docs[\\/]session-strategy-history[\\/][^\s"']+\.md)/gi)) {
      const rawPath = match[0];
      const source = /openspec/i.test(rawPath) ? "openspec_history" : "docs_fallback";
      const ref = hashRef("strategy", rawPath);
      strategyRefs.set(ref, { ref, source });
    }
  }

  for (const [index, row] of messages.entries()) {
    const message = parseRecord(row.data);
    if (message?.role !== "assistant") continue;
    const messageId = String(row.id ?? `${rawSessionId}:${index}`);
    const text = (assistantText.get(messageId) ?? []).join("\n");
    const bounded = boundedText(text, rawSessionId, "assistantEvidence.text", EXECUTION_TEXT_LIMIT, truncations);
    const error = parseRecord(message.error);
    assistantEvidence.push({
      agent: stringValue(message.agent),
      error: stringValue(error?.name),
      eventRef: hashRef("assistant", messageId),
      finish: stringValue(message.finish),
      modelRef: hashRef("model", `${String(message.providerID ?? "unknown")}/${String(message.modelID ?? "unknown")}`),
      text: bounded.text,
      time: eventTime(row.time_created),
      truncated: bounded.truncated,
    });
  }

  return {
    assistantEvidence: cap(assistantEvidence, ASSISTANT_LIMIT, "assistantEvidence", truncations),
    background: cap(background, DESCENDANT_LIMIT, "background", truncations),
    diffEvidence: cap(diffEvidence, DIFF_LIMIT, "diffEvidence", truncations),
    strategyRefs: [...strategyRefs.values()],
    toolEvidence: cap(toolEvidence, TOOL_LIMIT, "toolEvidence", truncations),
    validationEvidence: cap(validationEvidence, VALIDATION_LIMIT, "validationEvidence", truncations),
  };
}

function descendantEvidence(
  db: SqliteDatabase,
  schema: DbSchema,
  rawSessionId: string,
  rawSynthetic: string[],
  truncations: DeliveryContextTruncation[],
): Pick<CompletionEvidence, "auditRefs" | "descendants"> {
  if (!hasColumns(schema, "session", ["id", "parent_id"])) return { auditRefs: [], descendants: [] };
  const rows = db.prepare("select * from session order by time_created, id").all() as Array<Record<string, unknown>>;
  const childrenByParent = new Map<string, Array<Record<string, unknown>>>();
  for (const row of rows) {
    const parent = stringValue(row.parent_id);
    if (parent == null) continue;
    const existing = childrenByParent.get(parent) ?? [];
    existing.push(row);
    childrenByParent.set(parent, existing);
  }
  const descendantsRaw: Array<Record<string, unknown>> = [];
  const queue = [...(childrenByParent.get(rawSessionId) ?? [])];
  const seen = new Set<string>();
  while (queue.length > 0 && descendantsRaw.length <= DESCENDANT_LIMIT * 4) {
    const row = queue.shift()!;
    const id = String(row.id);
    if (seen.has(id)) continue;
    seen.add(id);
    descendantsRaw.push(row);
    queue.push(...(childrenByParent.get(id) ?? []));
  }
  const ids = descendantsRaw.map((row) => String(row.id));
  const parts = readParts(db, schema, ids);
  const activeBySession = new Set<string>();
  const observedBySession = new Set<string>();
  for (const row of parts) {
    observedBySession.add(String(row.session_id));
    const parsed = parseRecord(row.data);
    const state = parseRecord(parsed?.state);
    if (parsed?.type === "tool" && ["pending", "running"].includes(String(state?.status))) {
      activeBySession.add(String(row.session_id));
    }
  }
  const auditRefs: DeliveryContextAuditRef[] = [];
  const descendants = descendantsRaw.map((row): DeliveryContextDescendantEvidence => {
    const id = String(row.id);
    const metadata = parseRecord(row.metadata);
    const guard = parseRecord(metadata?.completionGuard) ?? parseRecord(metadata?.completion_guard);
    const agent = stringValue(row.agent) ?? stringValue(metadata?.agent);
    const childRef = hashRef("session", id);
    if (agent === "session-completion-arbiter" || guard != null) {
      auditRefs.push({
        auditRef: hashRef("audit", stringValue(guard?.auditID) ?? id),
        childRef,
        status: stringValue(guard?.status) ?? (activeBySession.has(id) ? "running" : "retained"),
      });
    }
    const consumed = rawSynthetic.some((text) => text.includes(id));
    return {
      agent,
      parentRef: hashRef("session", String(row.parent_id)),
      resultConsumed: consumed ? true : activeBySession.has(id) ? false : "unknown",
      sessionRef: childRef,
      status: activeBySession.has(id) ? "running" : observedBySession.has(id) ? "idle" : "unknown",
      updated: eventTime(row.time_updated),
    };
  });
  return {
    auditRefs: cap(auditRefs, DESCENDANT_LIMIT, "auditRefs", truncations),
    descendants: cap(descendants, DESCENDANT_LIMIT, "descendants", truncations),
  };
}

export function readCompletionEvidence(
  db: SqliteDatabase,
  schema: DbSchema,
  rawSessionId: string,
  warnings: string[],
): CompletionEvidence {
  const truncationWarnings: DeliveryContextTruncation[] = [];
  if (!hasColumns(schema, "message", ["session_id", "data"])) {
    warnings.push("message table missing session_id/data columns; completion message evidence unavailable");
  }
  if (schema.has("part") && !hasColumns(schema, "part", ["session_id", "message_id", "data"])) {
    warnings.push("part table missing session_id/message_id/data columns; bounded execution evidence unavailable");
  }
  const messages = readMessages(db, schema, rawSessionId);
  const parts = readParts(db, schema, [rawSessionId]);
  const user = userMessageEvidence(messages, parts, rawSessionId, truncationWarnings);
  const seenHuman = new Set(user.human.map((message) => textIdentity(message.text)));
  const inputs = sessionInputEvidence(db, schema, rawSessionId, seenHuman, truncationWarnings);
  const execution = executionEvidence(messages, parts, rawSessionId, truncationWarnings);
  const descendants = descendantEvidence(db, schema, rawSessionId, user.rawSynthetic, truncationWarnings);
  const humanMessages = [...user.human, ...inputs.human].sort(
    (left, right) => (left.time ?? "").localeCompare(right.time ?? "") || left.eventRef.localeCompare(right.eventRef),
  );
  const syntheticMessages = cap(
    [...user.synthetic, ...inputs.synthetic].sort(
      (left, right) => (left.time ?? "").localeCompare(right.time ?? "") || left.eventRef.localeCompare(right.eventRef),
    ),
    SYNTHETIC_LIMIT,
    "syntheticMessages",
    truncationWarnings,
  );
  return {
    ...execution,
    ...descendants,
    humanMessages,
    syntheticMessages,
    truncationWarnings,
  };
}
