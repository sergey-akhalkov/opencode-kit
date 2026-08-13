#!/usr/bin/env node
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  CLOSED_TODO_STATUSES,
  OPEN_TODO_STATUSES,
  hasColumns,
  mergeTodoEvidence,
  normalizeMillis,
  readQuestionAndPermissionEvents,
  readTodoRows,
  readTodoWriteHistory,
  requestedSession,
  resolveRootRow,
  selectedRows,
  tableColumns,
  tableNames,
  todoEvidenceFromCurrent,
  warnMissingColumns,
} from "./db.ts";
import { emptyResult, isoTime, makeDateRange } from "./projection.ts";
import { detectRequirementSignals } from "./requirements.ts";
import { hashRef } from "./redaction.ts";
import { readCompletionEvidence } from "./evidence.ts";
import { openReadOnlyDatabase, type SqliteDatabase } from "./sqlite.ts";
import type {
  DeliveryContextQuestionIntervention,
  DeliveryContextSyntheticMessage,
  ReadSessionDeliveryContextOptions,
  SessionDeliveryContextResult,
} from "./projection.ts";

export * from "./redaction.ts";
export * from "./projection.ts";
export * from "./requirements.ts";
export * from "./db.ts";
export * from "./evidence.ts";

export type {
  DeliveryContextPermissionReply,
  DeliveryContextQuestionIntervention,
  DeliveryContextQuestionReply,
  DeliveryContextTodo,
  DeliveryContextTodoHistory,
  DeliveryContextUserMessage,
  ReadSessionDeliveryContextOptions,
  SessionDeliveryContextResult,
} from "./projection.ts";

function mergedQuestionInterventions(
  events: DeliveryContextQuestionIntervention[],
  syntheticMessages: DeliveryContextSyntheticMessage[],
): DeliveryContextQuestionIntervention[] {
  const merged = new Map<string, DeliveryContextQuestionIntervention>();
  for (const intervention of events) {
    merged.set(intervention.requestRef ?? intervention.eventRef, intervention);
  }
  for (const message of syntheticMessages) {
    if (message.provenance !== "guard") continue;
    const requestRef = message.text.match(
      /<completion_guard_question_correction\s+request_ref="(question_[A-Za-z0-9_-]+)">/,
    )?.[1];
    if (requestRef == null) continue;
    const existing = merged.get(requestRef);
    merged.set(requestRef, {
      actor: "guard",
      answers: existing?.answers ?? [],
      eventRef: existing?.eventRef ?? message.eventRef,
      questions: existing?.questions ?? [],
      requestRef,
      status: "rejected",
      time: existing?.time ?? message.time,
    });
  }
  return [...merged.values()].sort(
    (left, right) => (left.time ?? "").localeCompare(right.time ?? "") || left.eventRef.localeCompare(right.eventRef),
  );
}

function stringSet(value: unknown): Set<string> {
  return new Set(
    Array.isArray(value)
      ? value.filter((item): item is string => typeof item === "string" && /^question_[A-Za-z0-9_-]+$/.test(item))
      : [],
  );
}

function questionProvenance(row: Record<string, unknown>): {
  autonomous: Set<string>;
  autonomousCalls: Map<string, string>;
  pending: Set<string>;
  pendingCalls: Map<string, string>;
} {
  const parse = (value: unknown): Record<string, unknown> | null => {
    if (value != null && typeof value === "object" && !Array.isArray(value)) return value as Record<string, unknown>;
    if (typeof value !== "string") return null;
    try {
      const parsed = JSON.parse(value) as unknown;
      return parsed != null && typeof parsed === "object" && !Array.isArray(parsed)
        ? parsed as Record<string, unknown>
        : null;
    } catch {
      return null;
    }
  };
  const metadata = parse(row.metadata);
  const guard = parse(metadata?.completionGuard) ?? parse(metadata?.completion_guard);
  const callMap = (value: unknown): Map<string, string> => new Map(
    Array.isArray(value)
      ? value.flatMap((item) => {
          const entry = parse(item);
          return typeof entry?.requestRef === "string" && typeof entry.callRef === "string"
            ? [[entry.requestRef, entry.callRef] as const]
            : [];
        })
      : [],
  );
  return {
    autonomous: stringSet(guard?.autonomousQuestionRefs),
    autonomousCalls: callMap(guard?.autonomousQuestionCalls),
    pending: stringSet(guard?.pendingAutonomousQuestionRefs),
    pendingCalls: callMap(guard?.pendingAutonomousQuestionCalls),
  };
}

function requireHome(): string {
  const home = os.homedir();
  if (!home) {
    throw new Error("Home directory is not available; pass explicit dbPaths or dataDirs.");
  }
  return home;
}

function expandHome(input: string): string {
  if (input === "~") {
    return requireHome();
  }
  if (input.startsWith("~/") || input.startsWith("~\\")) {
    return path.join(requireHome(), input.slice(2));
  }
  return input;
}

function resolveInputPath(input: string): string {
  return path.resolve(expandHome(input));
}

function normalizeForDedupe(input: string): string {
  const resolved = path.resolve(input);
  return process.platform === "win32" ? resolved.toLowerCase() : resolved;
}

function uniquePaths(paths: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const candidate of paths) {
    const key = normalizeForDedupe(candidate);
    if (!seen.has(key)) {
      seen.add(key);
      result.push(candidate);
    }
  }
  return result;
}

function candidateDataDirs(
  options: Pick<ReadSessionDeliveryContextOptions, "dataDirs" | "useDefaultPaths">,
): string[] {
  const candidates = [...(options.dataDirs ?? [])];
  if (options.useDefaultPaths === false) {
    return uniquePaths(candidates.map(resolveInputPath));
  }
  const home = requireHome();
  if (process.env.OPENCODE_DATA_DIR) {
    candidates.push(resolveInputPath(process.env.OPENCODE_DATA_DIR));
  }
  if (process.env.XDG_DATA_HOME) {
    candidates.push(path.join(resolveInputPath(process.env.XDG_DATA_HOME), "opencode"));
  }
  candidates.push(path.join(home, ".local", "share", "opencode"));
  if (process.env.LOCALAPPDATA) {
    candidates.push(path.join(process.env.LOCALAPPDATA, "opencode"));
  }
  if (process.env.APPDATA) {
    candidates.push(path.join(process.env.APPDATA, "opencode"));
  }
  candidates.push(path.join(home, "Library", "Application Support", "opencode"));
  return uniquePaths(candidates.map(resolveInputPath));
}

function discoverDbPaths(
  options: Pick<ReadSessionDeliveryContextOptions, "dataDirs" | "dbPaths" | "useDefaultPaths">,
): string[] {
  const dataDirs = candidateDataDirs(options);
  const candidates = [...(options.dbPaths ?? []).map(resolveInputPath)];
  const explicitDataDirs = new Set(
    (options.dataDirs ?? []).map((dir) => normalizeForDedupe(resolveInputPath(dir))),
  );
  for (const dir of dataDirs) {
    const dbPath = path.join(dir, "opencode.db");
    if (explicitDataDirs.has(normalizeForDedupe(dir)) || fs.existsSync(dbPath)) {
      candidates.push(dbPath);
    }
  }
  return uniquePaths(candidates);
}

function contextForRow(
  db: SqliteDatabase,
  schema: Map<string, Set<string>>,
  sourceRef: string,
  row: Record<string, unknown> & { id: unknown },
  options: ReadSessionDeliveryContextOptions,
  warnings: string[],
  resolvedFromSessionRef: string | null,
): SessionDeliveryContextResult {
  const rawSessionId = String(row.id);
  warnMissingColumns(schema, "todo", ["session_id"], "todo table missing session_id column; todo evidence unavailable", warnings);
  warnMissingColumns(schema, "session_input", ["session_id"], "session_input table missing session_id column; direct prompt evidence unavailable", warnings);
  warnMissingColumns(schema, "message", ["session_id"], "message table missing session_id column; message prompt evidence unavailable", warnings);
  if (hasColumns(schema, "todo", ["session_id"]) && !hasColumns(schema, "todo", ["content", "status"])) {
    warnings.push("todo table missing content/status columns; todo evidence may be incomplete");
  }
  if (hasColumns(schema, "session_input", ["session_id"]) && !hasColumns(schema, "session_input", ["prompt"])) {
    warnings.push("session_input table missing prompt column; direct prompt evidence unavailable");
  }
  if (hasColumns(schema, "message", ["session_id"]) && !hasColumns(schema, "message", ["data"])) {
    warnings.push("message table missing data column; message prompt evidence unavailable");
  }
  const currentTodos = readTodoRows(db, schema, rawSessionId, isoTime);
  const todoHistory = readTodoWriteHistory(db, schema, rawSessionId, warnings);
  const everTodos = mergeTodoEvidence(
    [...todoHistory.todos, ...currentTodos.map(todoEvidenceFromCurrent)],
    isoTime,
  );
  const openTodos = currentTodos.filter(
    (todo) => todo.status != null && OPEN_TODO_STATUSES.has(todo.status),
  );
  const unresolvedTodos = everTodos.filter(
    (todo) => todo.status == null || !CLOSED_TODO_STATUSES.has(todo.status),
  );
  const completion = readCompletionEvidence(db, schema, rawSessionId, warnings);
  const userMessages = completion.humanMessages;
  const requirementSignals = detectRequirementSignals(completion.humanMessages);
  const provenance = questionProvenance(row);
  const events = readQuestionAndPermissionEvents(
    db,
    schema,
    rawSessionId,
    warnings,
    provenance.autonomous,
    provenance.pending,
  );
  const questionInterventions = mergedQuestionInterventions(
    [
      ...events.questionInterventions,
      ...[...provenance.autonomousCalls].flatMap(([requestRef, callRef]) => {
        const reply = completion.questionToolReplies.find((candidate) => candidate.callRef === callRef);
        return reply == null ? [] : [{
          actor: "guard" as const,
          answers: reply.answers,
          eventRef: reply.eventRef,
          questions: reply.questions,
          requestRef,
          status: "answered" as const,
          time: reply.time,
        }];
      }),
      ...[...provenance.pendingCalls].flatMap(([requestRef, callRef]) => {
        const reply = completion.questionToolReplies.find((candidate) => candidate.callRef === callRef);
        return reply == null ? [] : [{
          actor: "guard" as const,
          answers: reply.answers,
          eventRef: reply.eventRef,
          questions: reply.questions,
          requestRef,
          status: "resolution-unknown" as const,
          time: reply.time,
        }];
      }),
    ],
    completion.syntheticMessages,
  );
  return {
    assistantEvidence: completion.assistantEvidence,
    auditRefs: completion.auditRefs,
    background: completion.background,
    descendants: completion.descendants,
    diffEvidence: completion.diffEvidence,
    generatedAt: options.generatedAt ?? new Date().toISOString(),
    humanMessages: completion.humanMessages,
    missingSessions: [],
    permissionReplies: events.permissionReplies,
    questionInterventions,
    questionReplies: events.questionReplies,
    requirementSignals,
    resolvedFromSessionRef,
    schemaVersion: 2,
    session: {
      counts: {
        assistantEvidence: completion.assistantEvidence.length,
        auditRefs: completion.auditRefs.length,
        background: completion.background.length,
        currentTodos: currentTodos.length,
        descendants: completion.descendants.length,
        diffEvidence: completion.diffEvidence.length,
        everTodos: everTodos.length,
        humanMessages: completion.humanMessages.length,
        openTodos: openTodos.length,
        permissionReplies: events.permissionReplies.length,
        questionInterventions: questionInterventions.length,
        questionReplies: events.questionReplies.length,
        requirementSignals: requirementSignals.length,
        strategyRefs: completion.strategyRefs.length,
        syntheticMessages: completion.syntheticMessages.length,
        todoToolCalls: todoHistory.history.toolCalls,
        todos: everTodos.length,
        toolEvidence: completion.toolEvidence.length,
        truncationWarnings: completion.truncationWarnings.length,
        unresolvedTodos: unresolvedTodos.length,
        userMessages: userMessages.length,
        validationEvidence: completion.validationEvidence.length,
      },
      dateRange: makeDateRange([normalizeMillis(row.time_created), normalizeMillis(row.time_updated)]),
      sessionRef: hashRef("session", rawSessionId),
      sourceRef,
    },
    strategyRefs: completion.strategyRefs,
    syntheticMessages: completion.syntheticMessages,
    todos: {
      current: currentTodos,
      ever: everTodos,
      history: todoHistory.history,
      open: openTodos,
      unresolved: unresolvedTodos,
    },
    tool: "opencode-session-delivery-context",
    toolEvidence: completion.toolEvidence,
    truncationWarnings: completion.truncationWarnings,
    userMessages,
    validationEvidence: completion.validationEvidence,
    warnings,
  };
}

export function readSessionDeliveryContext(
  options: ReadSessionDeliveryContextOptions,
): SessionDeliveryContextResult {
  const requested = requestedSession(options.sessionId);
  const warnings: string[] = [];
  const dbPaths = discoverDbPaths({
    dataDirs: options.dataDirs,
    dbPaths: options.dbPaths,
    useDefaultPaths: options.useDefaultPaths,
  });
  if (dbPaths.length === 0) {
    warnings.push("no OpenCode database candidates found; pass dbPaths or dataDirs");
  }

  for (const dbPath of dbPaths) {
    if (!fs.existsSync(dbPath)) {
      warnings.push(`${hashRef("source", dbPath)} missing`);
      continue;
    }
    let db: SqliteDatabase | null = null;
    try {
      db = openReadOnlyDatabase(dbPath);
      const tables = tableNames(db);
      if (!tables.has("session")) {
        warnings.push(`${hashRef("source", dbPath)} missing session table`);
        continue;
      }
      const schema = new Map([...tables].map((table) => [table, tableColumns(db!, table)]));
      if (!hasColumns(schema, "session", ["id"])) {
        warnings.push(`${hashRef("source", dbPath)} missing session.id column`);
        continue;
      }
      const rows = selectedRows(db, schema, requested);
      if (rows.length > 0) {
        const startRow = rows[0];
        const startId = String(startRow.id);
        const targetRow = options.resolveRoot ? resolveRootRow(db, schema, startRow) : startRow;
        const resolvedFromSessionRef =
          options.resolveRoot && String(targetRow.id) !== startId ? hashRef("session", startId) : null;
        return contextForRow(
          db,
          schema,
          hashRef("source", dbPath),
          targetRow,
          options,
          warnings,
          resolvedFromSessionRef,
        );
      }
    } catch (error) {
      warnings.push(
        `${hashRef("source", dbPath)} error: ${error instanceof Error ? error.message : String(error)}`,
      );
    } finally {
      db?.close();
    }
  }

  return emptyResult(options, requested.missingRef, warnings);
}
