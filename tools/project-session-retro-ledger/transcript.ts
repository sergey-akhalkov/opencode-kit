import { DatabaseSync } from "node:sqlite";
import type { ProjectSessionRetroLedger } from "./types.ts";
import { discoverDbPaths } from "./sqlite-source.ts";
import { hashRef, makeDateRange, normalizeCount, normalizeMillis, quoteIdent } from "./utils.ts";

type TranscriptEventKind = "input" | "message" | "part" | "todo";

type TranscriptEvent = {
  data?: unknown;
  delivery?: string | null;
  eventRef: string;
  kind: TranscriptEventKind;
  messageRef?: string | null;
  priority?: string | null;
  prompt?: string;
  role?: string | null;
  status?: string | null;
  text?: string;
  time: string | null;
  tool?: string | null;
  type?: string | null;
};

type TranscriptSession = {
  counts: {
    inputs: number;
    messages: number;
    parts: number;
    todos: number;
  };
  dateRange: {
    from: string | null;
    to: string | null;
  };
  events: TranscriptEvent[];
  sessionRef: string;
  sourceRef: string;
};

export type ReadSessionTranscriptsOptions = {
  dataDirs?: string[];
  dbPaths?: string[];
  generatedAt?: string;
  includeContent?: boolean;
  inputLedger?: ProjectSessionRetroLedger | null;
  sessionIds: string[];
  useDefaultPaths?: boolean;
};

export type ProjectSessionTranscriptResult = {
  generatedAt: string;
  includeContent: boolean;
  missingSessions: string[];
  sessions: TranscriptSession[];
  tool: "opencode-project-session-retro-ledger";
};

type SessionRow = Record<string, unknown> & { id: unknown };
type EventWithOrder = TranscriptEvent & { order: number; tieBreak: string };
type RequestedSessionSelection = {
  candidateRefs: Set<string>;
  rawIds: Set<string>;
  requests: Array<{ candidateRefs: string[]; missingRef: string }>;
};

const STRUCTURAL_SECRET_KEYS = new Set(["cwd", "directory", "id", "message_id", "parent_id", "path", "project_id", "root", "session_id", "share_url", "workspace_id", "worktree"]);
const SESSION_REF_PATTERN = /^session_[a-f0-9]{12}$/;

function tableNames(db: InstanceType<typeof DatabaseSync>): Set<string> {
  const rows = db.prepare("select name from sqlite_master where type = 'table'").all() as Array<{ name: unknown }>;
  return new Set(rows.map((row) => String(row.name)));
}

function tableColumns(db: InstanceType<typeof DatabaseSync>, table: string): Set<string> {
  const rows = db.prepare(`pragma table_info(${quoteIdent(table)})`).all() as Array<{ name: unknown }>;
  return new Set(rows.map((row) => String(row.name)));
}

function hasColumns(schema: Map<string, Set<string>>, table: string, columns: string[]): boolean {
  const tableColumnsForTable = schema.get(table);
  return tableColumnsForTable != null && columns.every((column) => tableColumnsForTable.has(column));
}

function selectColumnOrNull(schema: Map<string, Set<string>>, table: string, column: string, alias = column): string {
  return schema.get(table)?.has(column) === true ? quoteIdent(column) : `null as ${quoteIdent(alias)}`;
}

function parseJsonRecord(value: unknown): Record<string, unknown> | null {
  try {
    const parsed = JSON.parse(String(value)) as unknown;
    return parsed != null && typeof parsed === "object" && !Array.isArray(parsed) ? parsed as Record<string, unknown> : null;
  } catch (_error) {
    return null;
  }
}

function redactStructuralSecrets(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(redactStructuralSecrets);
  }
  if (value == null || typeof value !== "object") {
    return value;
  }
  const result: Record<string, unknown> = {};
  for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
    if (STRUCTURAL_SECRET_KEYS.has(key.toLowerCase())) {
      continue;
    }
    result[key] = redactStructuralSecrets(nested);
  }
  return result;
}

function redactKnownSessionId(value: unknown, rawSessionId: string): unknown {
  const sessionRef = hashRef("session", rawSessionId);
  if (typeof value === "string") {
    return value.replaceAll(rawSessionId, sessionRef);
  }
  if (Array.isArray(value)) {
    return value.map((item) => redactKnownSessionId(item, rawSessionId));
  }
  if (value == null || typeof value !== "object") {
    return value;
  }
  return Object.fromEntries(Object.entries(value as Record<string, unknown>).map(([key, nested]) => [key, redactKnownSessionId(nested, rawSessionId)]));
}

function transcriptContent(value: unknown, rawSessionId: string): unknown {
  return redactKnownSessionId(redactStructuralSecrets(value), rawSessionId);
}

function eventTime(value: unknown): string | null {
  const millis = normalizeMillis(value);
  if (millis == null) {
    return null;
  }
  const date = new Date(millis);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function eventOrder(value: unknown): number {
  return normalizeMillis(value) ?? 0;
}

function requestedSessions(sessionIds: string[]): RequestedSessionSelection {
  const candidateRefs = new Set<string>();
  const rawIds = new Set<string>();
  const requests: RequestedSessionSelection["requests"] = [];
  for (const sessionId of sessionIds) {
    if (SESSION_REF_PATTERN.test(sessionId)) {
      const rawRef = hashRef("session", sessionId);
      candidateRefs.add(sessionId);
      candidateRefs.add(rawRef);
      rawIds.add(sessionId);
      requests.push({ candidateRefs: [sessionId, rawRef], missingRef: rawRef });
    } else {
      const ref = hashRef("session", sessionId);
      candidateRefs.add(ref);
      rawIds.add(sessionId);
      requests.push({ candidateRefs: [ref], missingRef: ref });
    }
  }
  return { candidateRefs, rawIds, requests };
}

function selectedRows(db: InstanceType<typeof DatabaseSync>, schema: Map<string, Set<string>>, requested: RequestedSessionSelection): SessionRow[] {
  const orderBy = schema.get("session")?.has("time_created") === true ? "time_created, id" : "id";
  const rows = db.prepare(`select * from session order by ${orderBy}`).all() as SessionRow[];
  return rows.filter((row) => {
    const rawID = String(row.id);
    return requested.rawIds.has(rawID) || requested.candidateRefs.has(hashRef("session", rawID));
  });
}

function readInputEvents(db: InstanceType<typeof DatabaseSync>, schema: Map<string, Set<string>>, rawSessionId: string, includeContent: boolean): EventWithOrder[] {
  if (!hasColumns(schema, "session_input", ["id", "session_id"])) {
    return [];
  }
  const select = ["id", selectColumnOrNull(schema, "session_input", "prompt"), selectColumnOrNull(schema, "session_input", "delivery"), selectColumnOrNull(schema, "session_input", "admitted_seq"), selectColumnOrNull(schema, "session_input", "promoted_seq"), selectColumnOrNull(schema, "session_input", "time_created")];
  const orderBy = schema.get("session_input")?.has("time_created") === true ? "time_created, id" : "id";
  const rows = db.prepare(`select ${select.join(", ")} from session_input where session_id = ? order by ${orderBy}`).all(rawSessionId) as Array<Record<string, unknown>>;
  return rows.map((row) => {
    const event: EventWithOrder = {
      delivery: row.delivery == null ? null : String(row.delivery),
      eventRef: hashRef("input", String(row.id)),
      kind: "input",
      order: eventOrder(row.time_created),
      tieBreak: String(row.id),
      time: eventTime(row.time_created),
    };
    if (includeContent && typeof row.prompt === "string") {
      event.prompt = transcriptContent(row.prompt, rawSessionId) as string;
    }
    return event;
  });
}

function readMessageEvents(db: InstanceType<typeof DatabaseSync>, schema: Map<string, Set<string>>, rawSessionId: string, includeContent: boolean): EventWithOrder[] {
  if (!hasColumns(schema, "message", ["id", "session_id"])) {
    return [];
  }
  const select = ["id", selectColumnOrNull(schema, "message", "time_created"), selectColumnOrNull(schema, "message", "data")];
  const orderBy = schema.get("message")?.has("time_created") === true ? "time_created, id" : "id";
  const rows = db.prepare(`select ${select.join(", ")} from message where session_id = ? order by ${orderBy}`).all(rawSessionId) as Array<Record<string, unknown>>;
  return rows.map((row) => {
    const parsed = parseJsonRecord(row.data);
    const event: EventWithOrder = {
      eventRef: hashRef("message", String(row.id)),
      kind: "message",
      order: eventOrder(row.time_created),
      role: typeof parsed?.role === "string" ? parsed.role : null,
      tieBreak: String(row.id),
      time: eventTime(row.time_created),
      type: parsed == null ? null : "message-data",
    };
    if (includeContent) {
      event.data = transcriptContent(parsed ?? row.data, rawSessionId);
    }
    return event;
  });
}

function readPartEvents(db: InstanceType<typeof DatabaseSync>, schema: Map<string, Set<string>>, rawSessionId: string, includeContent: boolean): EventWithOrder[] {
  if (!hasColumns(schema, "part", ["id", "session_id"])) {
    return [];
  }
  const select = ["id", selectColumnOrNull(schema, "part", "message_id"), selectColumnOrNull(schema, "part", "time_created"), selectColumnOrNull(schema, "part", "data")];
  const orderBy = schema.get("part")?.has("time_created") === true ? "time_created, id" : "id";
  const rows = db.prepare(`select ${select.join(", ")} from part where session_id = ? order by ${orderBy}`).all(rawSessionId) as Array<Record<string, unknown>>;
  return rows.map((row) => {
    const parsed = parseJsonRecord(row.data);
    const state = parsed?.state != null && typeof parsed.state === "object" && !Array.isArray(parsed.state) ? parsed.state as Record<string, unknown> : null;
    const event: EventWithOrder = {
      eventRef: hashRef("part", String(row.id)),
      kind: "part",
      messageRef: row.message_id == null ? null : hashRef("message", String(row.message_id)),
      order: eventOrder(row.time_created),
      status: typeof state?.status === "string" ? state.status : null,
      tieBreak: String(row.id),
      time: eventTime(row.time_created),
      tool: typeof parsed?.tool === "string" ? parsed.tool : null,
      type: typeof parsed?.type === "string" ? parsed.type : null,
    };
    if (includeContent) {
      event.data = transcriptContent(parsed ?? row.data, rawSessionId);
      if (typeof parsed?.text === "string") {
        event.text = transcriptContent(parsed.text, rawSessionId) as string;
      }
    }
    return event;
  });
}

function readTodoEvents(db: InstanceType<typeof DatabaseSync>, schema: Map<string, Set<string>>, rawSessionId: string, includeContent: boolean): EventWithOrder[] {
  if (!hasColumns(schema, "todo", ["session_id"])) {
    return [];
  }
  const select = [selectColumnOrNull(schema, "todo", "content"), selectColumnOrNull(schema, "todo", "status"), selectColumnOrNull(schema, "todo", "priority"), selectColumnOrNull(schema, "todo", "position"), selectColumnOrNull(schema, "todo", "time_created")];
  const todoColumns = schema.get("todo") ?? new Set<string>();
  const orderBy = [todoColumns.has("position") ? "position" : null, todoColumns.has("time_created") ? "time_created" : null, "session_id"].filter((column): column is string => column != null).join(", ");
  const rows = db.prepare(`select ${select.join(", ")} from todo where session_id = ? order by ${orderBy}`).all(rawSessionId) as Array<Record<string, unknown>>;
  return rows.map((row, index) => {
    const event: EventWithOrder = {
      eventRef: hashRef("todo", `${rawSessionId}:${String(row.position ?? index)}`),
      kind: "todo",
      order: eventOrder(row.time_created),
      priority: row.priority == null ? null : String(row.priority),
      status: row.status == null ? null : String(row.status),
      tieBreak: String(row.position ?? index),
      time: eventTime(row.time_created),
    };
    if (includeContent && typeof row.content === "string") {
      event.text = transcriptContent(row.content, rawSessionId) as string;
    }
    return event;
  });
}

function transcriptForRow(db: InstanceType<typeof DatabaseSync>, schema: Map<string, Set<string>>, sourceRef: string, row: SessionRow, includeContent: boolean): TranscriptSession {
  const rawSessionId = String(row.id);
  const events = [
    ...readInputEvents(db, schema, rawSessionId, includeContent),
    ...readMessageEvents(db, schema, rawSessionId, includeContent),
    ...readPartEvents(db, schema, rawSessionId, includeContent),
    ...readTodoEvents(db, schema, rawSessionId, includeContent),
  ].sort((left, right) => left.order - right.order || left.kind.localeCompare(right.kind) || left.tieBreak.localeCompare(right.tieBreak));
  const strippedEvents = events.map(({ order: _order, tieBreak: _tieBreak, ...event }) => event);
  return {
    counts: {
      inputs: strippedEvents.filter((event) => event.kind === "input").length,
      messages: normalizeCount(strippedEvents.filter((event) => event.kind === "message").length),
      parts: normalizeCount(strippedEvents.filter((event) => event.kind === "part").length),
      todos: normalizeCount(strippedEvents.filter((event) => event.kind === "todo").length),
    },
    dateRange: makeDateRange([normalizeMillis(row.time_created), normalizeMillis(row.time_updated)]),
    events: strippedEvents,
    sessionRef: hashRef("session", rawSessionId),
    sourceRef,
  };
}

export function readSessionTranscripts(options: ReadSessionTranscriptsOptions): ProjectSessionTranscriptResult {
  const requested = requestedSessions(options.sessionIds);
  const allowedByLedger = new Set(options.inputLedger == null ? requested.candidateRefs : Object.keys(options.inputLedger.sessions).filter((ref) => requested.candidateRefs.has(ref)));
  const dbPaths = discoverDbPaths({ dataDirs: options.dataDirs, dbPaths: options.dbPaths, useDefaultPaths: options.useDefaultPaths });
  const sessions = new Map<string, TranscriptSession>();

  for (const dbPath of dbPaths) {
    let db: InstanceType<typeof DatabaseSync> | null = null;
    try {
      db = new DatabaseSync(dbPath, { readOnly: true });
      const tables = tableNames(db);
      if (!tables.has("session")) {
        continue;
      }
      const schema = new Map([...tables].map((table) => [table, tableColumns(db!, table)]));
      if (!hasColumns(schema, "session", ["id"])) {
        continue;
      }
      const sourceRef = hashRef("source", dbPath);
      for (const row of selectedRows(db, schema, requested)) {
        const ref = hashRef("session", String(row.id));
        if (!allowedByLedger.has(ref) || sessions.has(ref)) {
          continue;
        }
        sessions.set(ref, transcriptForRow(db, schema, sourceRef, row, options.includeContent === true));
      }
    } finally {
      db?.close();
    }
  }

  const orderedSessions = [...sessions.values()].sort((left, right) => {
    const leftIndex = options.inputLedger?.analysisProgress.sessionOrder.indexOf(left.sessionRef) ?? -1;
    const rightIndex = options.inputLedger?.analysisProgress.sessionOrder.indexOf(right.sessionRef) ?? -1;
    if (leftIndex >= 0 || rightIndex >= 0) {
      return (leftIndex < 0 ? Number.MAX_SAFE_INTEGER : leftIndex) - (rightIndex < 0 ? Number.MAX_SAFE_INTEGER : rightIndex);
    }
    return left.sessionRef.localeCompare(right.sessionRef);
  });
  const foundRefs = new Set(orderedSessions.map((session) => session.sessionRef));
  return {
    generatedAt: options.generatedAt ?? new Date().toISOString(),
    includeContent: options.includeContent === true,
    missingSessions: requested.requests.filter((request) => !request.candidateRefs.some((ref) => foundRefs.has(ref))).map((request) => request.missingRef),
    sessions: orderedSessions,
    tool: "opencode-project-session-retro-ledger",
  };
}
