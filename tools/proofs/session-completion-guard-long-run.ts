#!/usr/bin/env bun
import crypto from "node:crypto";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { Database } from "bun:sqlite";
import type { Session } from "../../global/node_modules/@opencode-ai/sdk/dist/v2/index.js";
import { ensureArbiterChild } from "../../global/extensions/session-completion-guard/arbiter-child.ts";
import {
  buildArbiterAuditRequest,
  CanonicalEvidenceConflictError,
  requestContributions,
  requestBytes,
  requireBoundedRequest,
  type ArbiterCompletionEvidence,
} from "../../global/extensions/session-completion-guard/arbiter-evidence.ts";
import { SessionCompletionController } from "../../global/extensions/session-completion-guard/controller.ts";
import { materializeWorkFrontier } from "../../global/extensions/session-completion-guard/frontier.ts";
import { AsyncLeaseRegistry } from "../../global/extensions/session-completion-guard/leases.ts";
import {
  initialRootState,
  stableDigest,
} from "../../global/extensions/session-completion-guard/runtime-support.ts";
import type {
  AuditEpoch,
  RootState,
} from "../../global/extensions/session-completion-guard/types.ts";
import { sendTaskFallback } from "../../global/extensions/session-completion-guard/task-fallback.ts";
import { discoverStrategyJournal } from "../../global/extensions/session-completion-guard/strategy.ts";
import { parseCompletionVerdictText } from "../../global/extensions/session-completion-guard/verdict.ts";
import {
  hashRef,
  readSessionDeliveryContext,
  type SessionDeliveryContextResult,
} from "../../global/plugin/session-delivery-context/index.ts";
import {
  installedOpenCodeIdentity,
  isolatedProofServerEnvironment,
  proofClient,
  proofErrorFacts,
  requestData,
  seedProofConfigDependencies,
  startProofServer,
  waitForProofRoute,
} from "./lib/opencode-proof-client.ts";
import { removeProofFixture, stopProofProcessTree } from "./lib/proof-process-cleanup.ts";

type Mode = "fixture" | "incidents" | "installed" | "replay" | "suite";
type DeliveryTodo = SessionDeliveryContextResult["todos"]["current"][number];
type Options = {
  candidateId: string;
  databasePath: string | null;
  evidenceRoot: string;
  executablePath: string | null;
  inputPath: string | null;
  messageChars: number;
  messageCount: number;
  mode: Mode;
  reviewedFixture: boolean;
  runtimeSource: string;
};

const sourceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const runnerPath = fileURLToPath(import.meta.url);
const sourcePaths = [
  "global/agents/session-completion-arbiter.md",
  "global/extensions/session-completion-guard.ts",
  "global/extensions/session-completion-guard/arbiter-child.ts",
  "global/extensions/session-completion-guard/arbiter-evidence.ts",
  "global/extensions/session-completion-guard/controller.ts",
  "global/extensions/session-completion-guard/leases.ts",
  "global/extensions/session-completion-guard/runtime-support.ts",
  "global/extensions/session-completion-guard/status.ts",
  "global/extensions/session-completion-guard/task-fallback.ts",
  "global/extensions/session-completion-guard/types.ts",
  "global/plugin/session-delivery-context/db.ts",
  "global/plugin/session-delivery-context/evidence.ts",
  "global/plugin/session-delivery-context/index.ts",
  "global/plugin/session-delivery-context/projection.ts",
  "global/opencode.json.template",
  "tools/proofs/session-completion-guard-long-run.ts",
] as const;

const MAX_REQUEST_BYTES = 200_000;
const REVIEWED_COUNTS = {
  assistantEvidence: 16,
  background: 32,
  descendants: 32,
  diffEvidence: 24,
  humanMessages: 32,
  permissionReplies: 32,
  questionReplies: 32,
  syntheticMessages: 32,
  todoCurrent: 64,
  todoEver: 64,
  todoOpen: 64,
  todoUnresolved: 64,
  toolEvidence: 64,
  validationEvidence: 24,
} as const;

const HELP = `Usage:
  bun tools/proofs/session-completion-guard-long-run.ts --mode <suite|fixture|incidents|installed|replay> --candidate-id <id> --evidence-root <absolute-new-path> [mode input]

Modes:
  suite       Run the maintained provider-free long-run guard suite.
  fixture     Build and evaluate the current production request for the reviewed maximum-cardinality fixture.
  incidents   Read terminal overflow metadata from --database <absolute-path> in query-only mode.
  installed   Run an isolated installed OpenCode root with --opencode; use --reviewed-fixture for the exact hidden-arbiter fixture.
  replay      Re-evaluate --input <absolute-raw.json> without recreating a fixture or reading the database.

Effects:
  --help/-h performs no reads or writes. Other modes create only the requested new evidence root.
  With no arguments, suite mode uses a unique temporary evidence root for the maintained npm proof command.
  suite and fixture use a disposable SQLite database removed before success. incidents opens the supplied
  database read-only with PRAGMA query_only=ON. installed uses a disposable config/database, one local simulator,
  and removable sessions; it makes no external provider call and never installs, activates, or mutates source.

Evidence and cleanup:
  Captures use stable raw.json/evaluation.json files with source hashes, exact request bytes, zero-call facts,
  and privacy-safe refs only. replay writes evaluation.json from preserved raw input. Disposable databases are
  deleted in finally; read-only handles are closed in finally; evidence roots are retained.
`;

function requiredValue(args: string[], index: number, option: string): string {
  const value = args[index + 1];
  if (value == null || value.trim() === "" || value.startsWith("--")) throw new Error(`Missing value for ${option}`);
  return value;
}

function parseArgs(args: string[]): Options {
  if (args.length === 0) {
    return {
      candidateId: "session-completion-guard-long-run",
      databasePath: null,
      evidenceRoot: path.join(os.tmpdir(), `session-completion-guard-long-run-${process.pid}-${Date.now()}`),
      executablePath: null,
      inputPath: null,
      messageChars: 2_500,
      messageCount: 32,
      mode: "suite",
      reviewedFixture: false,
      runtimeSource: sourceRoot,
    };
  }
  let candidateId = "";
  let databasePath: string | null = null;
  let evidenceRoot = "";
  let executablePath: string | null = null;
  let inputPath: string | null = null;
  let messageChars = 2_500;
  let messageCount = 32;
  let mode: Mode = "suite";
  let reviewedFixture = false;
  let runtimeSource = sourceRoot;
  for (let index = 0; index < args.length; index++) {
    const arg = args[index];
    if (arg === "--candidate-id") {
      candidateId = requiredValue(args, index, arg);
      index++;
    } else if (arg === "--database") {
      databasePath = requiredValue(args, index, arg);
      index++;
    } else if (arg === "--evidence-root") {
      evidenceRoot = requiredValue(args, index, arg);
      index++;
    } else if (arg === "--input") {
      inputPath = requiredValue(args, index, arg);
      index++;
    } else if (arg === "--message-chars") {
      messageChars = Number(requiredValue(args, index, arg));
      index++;
    } else if (arg === "--message-count") {
      messageCount = Number(requiredValue(args, index, arg));
      index++;
    } else if (arg === "--mode") {
      const value = requiredValue(args, index, arg);
      if (!(["fixture", "incidents", "installed", "replay", "suite"] as string[]).includes(value)) {
        throw new Error(`Unsupported --mode: ${value}`);
      }
      mode = value as Mode;
      index++;
    } else if (arg === "--opencode") {
      executablePath = requiredValue(args, index, arg);
      index++;
    } else if (arg === "--runtime-source") {
      runtimeSource = requiredValue(args, index, arg);
      index++;
    } else if (arg === "--reviewed-fixture") {
      reviewedFixture = true;
    } else {
      throw new Error(`Unknown option: ${arg}`);
    }
  }
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]{0,99}$/.test(candidateId)) throw new Error("--candidate-id must be a safe identifier");
  if (!path.isAbsolute(evidenceRoot)) throw new Error("--evidence-root must be absolute");
  if (mode === "incidents" && (databasePath == null || !path.isAbsolute(databasePath))) {
    throw new Error("--database must be absolute in incidents mode");
  }
  if (mode === "replay" && (inputPath == null || !path.isAbsolute(inputPath))) {
    throw new Error("--input must be absolute in replay mode");
  }
  if (mode === "installed" && (executablePath == null || !path.isAbsolute(executablePath))) {
    throw new Error("--opencode must be absolute in installed mode");
  }
  if (!Number.isSafeInteger(messageCount) || messageCount < 1 || messageCount > 32) throw new Error("--message-count must be an integer from 1 to 32");
  if (!Number.isSafeInteger(messageChars) || messageChars < 64 || messageChars > 2_500) throw new Error("--message-chars must be an integer from 64 to 2500");
  if (!path.isAbsolute(runtimeSource)) throw new Error("--runtime-source must be absolute");
  return {
    candidateId,
    databasePath: databasePath == null ? null : path.resolve(databasePath),
    evidenceRoot: path.resolve(evidenceRoot),
    executablePath: executablePath == null ? null : path.resolve(executablePath),
    inputPath: inputPath == null ? null : path.resolve(inputPath),
    messageChars,
    messageCount,
    mode,
    reviewedFixture,
    runtimeSource: path.resolve(runtimeSource),
  };
}

function stableValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stableValue);
  if (value == null || typeof value !== "object") return value;
  const input = value as Record<string, unknown>;
  return Object.fromEntries(Object.keys(input).sort().map((key) => [key, stableValue(input[key])]));
}

function json(value: unknown): string {
  return `${JSON.stringify(stableValue(value), null, 2)}\n`;
}

function writeNew(file: string, value: unknown): void {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, typeof value === "string" ? value : json(value), { encoding: "utf8", flag: "wx" });
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function digest(file: string): string {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

function createLongRootDatabase(dbPath: string, rootID: string): void {
  const db = new Database(dbPath, { create: true });
  try {
    db.run("create table session (id text primary key, parent_id text, agent text, metadata text, time_created integer, time_updated integer)");
    db.run("create index session_parent_idx on session (parent_id)");
    db.run("create table message (id text primary key, session_id text not null, time_created integer, data text)");
    db.run("create table part (id text primary key, message_id text not null, session_id text not null, time_created integer, time_updated integer, data text)");
    db.run("create table todo (session_id text not null, content text, status text, priority text, position integer, time_created integer, time_updated integer)");
    db.run("create table event (id text primary key, session_id text not null, time_created integer, type text, properties text)");
    db.run(
      "insert into session (id, parent_id, agent, metadata, time_created, time_updated) values (?, null, null, ?, ?, ?)",
      [rootID, JSON.stringify({ completionGuard: { grindEnabled: true } }), 1_700_000_000_000, 1_700_000_100_000],
    );
    for (let index = 0; index < 80; index++) {
      const messageID = `message-${index}`;
      const text = `Human requirement ${index}: ${"bounded-context ".repeat(index === 0 || index === 79 ? 300 : 2)}`;
      db.run("insert into message (id, session_id, time_created, data) values (?, ?, ?, ?)", [
        messageID,
        rootID,
        1_700_000_000_100 + index,
        JSON.stringify({ role: "user", content: text }),
      ]);
      db.run(
        "insert into todo (session_id, content, status, priority, position, time_created, time_updated) values (?, ?, ?, ?, ?, ?, ?)",
        [rootID, `Todo ${index} ${"detail ".repeat(index === 79 ? 400 : 1)}`, "pending", "high", index, 1_700_000_001_000 + index, 1_700_000_002_000 + index],
      );
      db.run("insert into part (id, message_id, session_id, time_created, time_updated, data) values (?, ?, ?, ?, ?, ?)", [
        `tool-${index}`,
        messageID,
        rootID,
        1_700_000_003_000 + index,
        1_700_000_004_000 + index,
        JSON.stringify({
          type: "tool",
          tool: "bash",
          callID: `call-${index}`,
          state: { status: "completed", input: { command: `validate-${index}` }, output: "X".repeat(3_000) },
        }),
      ]);
    }
    for (let index = 0; index < 48; index++) {
      const requestID = `question-${index}`;
      db.run("insert into event (id, session_id, time_created, type, properties) values (?, ?, ?, ?, ?)", [
        `asked-${index}`,
        rootID,
        1_700_000_005_000 + index * 3,
        "question.asked",
        JSON.stringify({ requestID, questions: [{ question: `Question ${index} ${"Q".repeat(2_500)}` }] }),
      ]);
      db.run("insert into event (id, session_id, time_created, type, properties) values (?, ?, ?, ?, ?)", [
        `replied-${index}`,
        rootID,
        1_700_000_005_001 + index * 3,
        "question.replied",
        JSON.stringify({ requestID, answers: [[`Answer ${index} ${"A".repeat(2_500)}`]] }),
      ]);
      db.run("insert into event (id, session_id, time_created, type, properties) values (?, ?, ?, ?, ?)", [
        `permission-${index}`,
        rootID,
        1_700_000_005_002 + index * 3,
        "permission.replied",
        JSON.stringify({ requestID: `permission-${index}`, reply: `allow-${index}-${"P".repeat(2_500)}` }),
      ]);
    }
  } finally {
    db.close();
  }
}

function readProjectionInChild(dbPath: string, rootID: string): ReturnType<typeof readSessionDeliveryContext> {
  const result = spawnSync(process.execPath, [runnerPath, "--internal-project", dbPath, rootID], {
    cwd: sourceRoot,
    encoding: "utf8",
    shell: false,
  });
  if (result.status !== 0) throw new Error(`Projection child failed with exit ${String(result.status)}`);
  return JSON.parse(result.stdout) as ReturnType<typeof readSessionDeliveryContext>;
}

function reviewedLongRootFixture(source: SessionDeliveryContextResult): SessionDeliveryContextResult {
  const fixture = structuredClone(source);
  const time = (index: number) => new Date(1_700_000_010_000 + index).toISOString();
  fixture.session!.sourceRef = "source_reviewed_long_root";
  fixture.humanMessages = Array.from({ length: REVIEWED_COUNTS.humanMessages }, (_, index) => ({
    eventRef: `human_${index.toString().padStart(2, "0")}`,
    kind: "message" as const,
    text: `Reviewed human requirement ${index} ${"H".repeat(60)}`,
    time: time(index),
  }));
  fixture.permissionReplies = Array.from({ length: REVIEWED_COUNTS.permissionReplies }, (_, index) => ({
    eventRef: `permission_${index.toString().padStart(2, "0")}`,
    reply: `allow-reviewed-${index}-${"P".repeat(29)}`,
    requestRef: `permission_request_${index.toString().padStart(2, "0")}`,
    time: time(index),
  }));
  fixture.questionReplies = Array.from({ length: REVIEWED_COUNTS.questionReplies }, (_, index) => ({
    answers: [[`Reviewed answer ${index} ${"A".repeat(50)}`]],
    eventRef: `question_reply_${index.toString().padStart(2, "0")}`,
    questions: [`Reviewed question ${index} ${"Q".repeat(50)}`],
    requestRef: `question_request_${index.toString().padStart(2, "0")}`,
    status: "replied" as const,
    time: time(index),
  }));
  fixture.requirementSignals = fixture.humanMessages.map((message, index) => ({
    eventRef: `requirement_${index.toString().padStart(2, "0")}`,
    kind: "request",
    messageRef: message.eventRef,
    text: message.text,
    time: message.time,
  }));
  fixture.assistantEvidence = Array.from({ length: REVIEWED_COUNTS.assistantEvidence }, (_, index) => ({
    agent: "build",
    error: null,
    eventRef: `assistant_${index.toString().padStart(2, "0")}`,
    finish: "stop",
    modelRef: "model_reviewed",
    text: `Assistant evidence ${index} ${"A".repeat(150)}`,
    time: time(index),
    truncated: true,
  }));
  fixture.background = Array.from({ length: REVIEWED_COUNTS.background }, (_, index) => ({
    agent: "general",
    callRef: `call_background_${index.toString().padStart(2, "0")}`,
    childRef: `child_${index.toString().padStart(2, "0")}`,
    resultConsumed: index % 2 === 0,
    status: index % 2 === 0 ? "completed" : "idle",
  }));
  fixture.descendants = Array.from({ length: REVIEWED_COUNTS.descendants }, (_, index) => ({
    agent: "general",
    parentRef: index === 0 ? fixture.session!.sessionRef : `descendant_${(index - 1).toString().padStart(2, "0")}`,
    resultConsumed: index % 2 === 0,
    sessionRef: `descendant_${index.toString().padStart(2, "0")}`,
    status: "idle",
    updated: time(index),
  }));
  fixture.diffEvidence = Array.from({ length: REVIEWED_COUNTS.diffEvidence }, (_, index) => ({
    eventRef: `diff_${index.toString().padStart(2, "0")}`,
    files: Array.from({ length: 4 }, (__, fileIndex) => `file_${index}_${fileIndex}.ts`),
    patchRef: `patch_${index.toString().padStart(2, "0")}`,
    time: time(index),
  }));
  fixture.syntheticMessages = Array.from({ length: REVIEWED_COUNTS.syntheticMessages }, (_, index) => ({
    eventRef: `synthetic_${index.toString().padStart(2, "0")}`,
    kind: "message",
    provenance: index % 2 === 0 ? "guard" : "task",
    text: `Synthetic evidence ${index} ${"S".repeat(78)}`,
    time: time(index),
    truncated: true,
  }));
  fixture.toolEvidence = Array.from({ length: REVIEWED_COUNTS.toolEvidence }, (_, index) => ({
    callRef: `call_reviewed_${index.toString().padStart(2, "0")}`,
    eventRef: `tool_reviewed_${index.toString().padStart(2, "0")}`,
    output: `Reviewed tool output ${index} ${"T".repeat(400)}`,
    status: "completed",
    time: time(index),
    title: `reviewed-${index}`,
    tool: "bash",
    truncated: true,
  }));
  fixture.validationEvidence = fixture.toolEvidence.slice(0, REVIEWED_COUNTS.validationEvidence).map((tool, index) => ({
    callRef: tool.callRef,
    command: `validate-reviewed-${index}`,
    eventRef: `validation_reviewed_${index.toString().padStart(2, "0")}`,
    status: "passed",
    summary: tool.output,
    time: tool.time,
    truncated: tool.truncated,
  }));
  const currentTodos = Array.from({ length: REVIEWED_COUNTS.todoCurrent }, (_, index) => ({
    content: `Reviewed todo ${index} ${"D".repeat(20)}`,
    eventRef: `todo_reviewed_${index.toString().padStart(2, "0")}`,
    firstSeen: time(index),
    lastSeen: time(index),
    priority: "high",
    seenCount: 2,
    source: "todowrite" as const,
    status: "pending",
    time: time(index),
  }));
  fixture.todos = {
    current: structuredClone(currentTodos),
    ever: structuredClone(currentTodos),
    history: { available: true, source: "todowrite_parts", toolCalls: 64 },
    open: structuredClone(currentTodos),
    unresolved: structuredClone(currentTodos),
  };
  fixture.userMessages = structuredClone(fixture.humanMessages);
  const counts = fixture.session!.counts;
  fixture.session!.counts = {
    ...counts,
    assistantEvidence: fixture.assistantEvidence.length,
    background: fixture.background.length,
    currentTodos: fixture.todos.current.length,
    descendants: fixture.descendants.length,
    diffEvidence: fixture.diffEvidence.length,
    everTodos: fixture.todos.ever.length,
    humanMessages: fixture.humanMessages.length,
    openTodos: fixture.todos.open.length,
    permissionReplies: fixture.permissionReplies.length,
    questionReplies: fixture.questionReplies.length,
    syntheticMessages: fixture.syntheticMessages.length,
    todoToolCalls: fixture.todos.history.toolCalls,
    todos: fixture.todos.current.length,
    toolEvidence: fixture.toolEvidence.length,
    unresolvedTodos: fixture.todos.unresolved.length,
    userMessages: fixture.userMessages.length,
    validationEvidence: fixture.validationEvidence.length,
  };
  return fixture;
}

function reviewedCounts(fixture: SessionDeliveryContextResult) {
  return {
    assistantEvidence: fixture.assistantEvidence.length,
    background: fixture.background.length,
    descendants: fixture.descendants.length,
    diffEvidence: fixture.diffEvidence.length,
    humanMessages: fixture.humanMessages.length,
    permissionReplies: fixture.permissionReplies.length,
    questionReplies: fixture.questionReplies.length,
    syntheticMessages: fixture.syntheticMessages.length,
    todoCurrent: fixture.todos.current.length,
    todoEver: fixture.todos.ever.length,
    todoOpen: fixture.todos.open.length,
    todoUnresolved: fixture.todos.unresolved.length,
    toolEvidence: fixture.toolEvidence.length,
    validationEvidence: fixture.validationEvidence.length,
  };
}

function emptyCompletionEvidence(): SessionDeliveryContextResult {
  return {
    assistantEvidence: [],
    auditRefs: [],
    background: [],
    descendants: [],
    diffEvidence: [],
    generatedAt: "1970-01-01T00:00:00.000Z",
    humanMessages: [],
    missingSessions: [],
    permissionReplies: [],
    questionInterventions: [],
    questionReplies: [],
    requirementSignals: [],
    resolvedFromSessionRef: null,
    schemaVersion: 2,
    session: null,
    strategyRefs: [],
    syntheticMessages: [],
    todos: {
      current: [],
      ever: [],
      history: { available: false, source: "current_snapshot_only", toolCalls: 0 },
      open: [],
      unresolved: [],
    },
    tool: "opencode-session-delivery-context",
    toolEvidence: [],
    truncationWarnings: [],
    userMessages: [],
    validationEvidence: [],
    warnings: [],
    workFrontier: { assessment: null, errorCode: "missing-frontier", status: "absent" },
  };
}

function assertReviewedCounts(fixture: SessionDeliveryContextResult): void {
  const actual = reviewedCounts(fixture);
  assert(JSON.stringify(actual) === JSON.stringify(REVIEWED_COUNTS), `Reviewed fixture count mismatch: ${JSON.stringify(actual)}`);
}

function sameStable(left: unknown, right: unknown): boolean {
  return JSON.stringify(stableValue(left)) === JSON.stringify(stableValue(right));
}

function readCandidateRequest(request: string): { evidence: ArbiterCompletionEvidence; schemaVersion: unknown } {
  const match = request.match(/^<completion_audit_request>\n([\s\S]*)\n<\/completion_audit_request>$/);
  assert(match != null, "Candidate request wrapper is malformed");
  const payload = record(JSON.parse(match[1]), "candidate request");
  return {
    evidence: record(payload.completionEvidence, "candidate completionEvidence") as unknown as ArbiterCompletionEvidence,
    schemaVersion: payload.schemaVersion,
  };
}

function candidateReadbackMatrix(
  source: SessionDeliveryContextResult,
  candidate: ArbiterCompletionEvidence,
  sourceDigestBefore: string,
): Record<string, boolean> {
  const restoredTodos: Record<ArbiterCompletionEvidence["todos"]["items"][number]["memberships"][number], DeliveryTodo[]> = {
    current: [],
    ever: [],
    open: [],
    unresolved: [],
  };
  for (const item of candidate.todos.items) {
    const { memberships, ...todo } = item;
    for (const membership of memberships) restoredTodos[membership].push(todo);
  }
  const toolsByCall = new Map(candidate.toolEvidence.map((tool) => [tool.callRef, tool]));
  const restoredValidation = candidate.validationEvidence.map((validation) => {
    if (validation.toolOutputRef == null) return validation;
    const tool = toolsByCall.get(validation.toolOutputRef);
    assert(tool != null, `Validation output ref is missing: ${validation.toolOutputRef}`);
    const { toolOutputRef: _toolOutputRef, ...retained } = validation;
    return { ...retained, summary: tool.output };
  });
  return {
    authority: sameStable(
      {
        humanMessages: candidate.humanMessages,
        permissionReplies: candidate.permissionReplies,
        questionInterventions: candidate.questionInterventions,
        questionReplies: candidate.questionReplies,
        requirementSignals: candidate.requirementSignals,
      },
      {
        humanMessages: source.humanMessages,
        permissionReplies: source.permissionReplies,
        questionInterventions: source.questionInterventions,
        questionReplies: source.questionReplies,
        requirementSignals: source.requirementSignals,
      },
    ),
    liveness: sameStable(
      { auditRefs: candidate.auditRefs, background: candidate.background, descendants: candidate.descendants },
      { auditRefs: source.auditRefs, background: source.background, descendants: source.descendants },
    ),
    publicSourceUnchanged: stableDigest(source) === sourceDigestBefore,
    todos: sameStable(
      { ...restoredTodos, history: candidate.todos.history },
      source.todos,
    ),
    truncation: sameStable(
      { truncationWarnings: candidate.truncationWarnings, warnings: candidate.warnings },
      { truncationWarnings: source.truncationWarnings, warnings: source.warnings },
    ),
    userAliasOmitted: !("userMessages" in candidate),
    validation: sameStable(
      { toolEvidence: candidate.toolEvidence, validationEvidence: restoredValidation },
      { toolEvidence: source.toolEvidence, validationEvidence: source.validationEvidence },
    ),
  };
}

function session(id: string, directory: string, rootID?: string, updated = 0, metadata?: Record<string, unknown>): Session {
  return {
    id,
    ...(rootID == null ? {} : { parentID: rootID }),
    projectID: "guard-long-run-proof",
    directory,
    title: id,
    version: "1",
    time: { created: updated, updated },
    ...(metadata == null ? {} : { metadata }),
  } as Session;
}

async function proveOverflow(
  directory: string,
  completionEvidence: ReturnType<typeof readSessionDeliveryContext>,
  maxRequestBytes = MAX_REQUEST_BYTES,
) {
  const rootID = "session_guard_long_run_overflow";
  const rootRef = hashRef("session", rootID);
  let root = session(rootID, directory);
  let promptCalls = 0;
  let childCreates = 0;
  const logs: Array<Record<string, unknown>> = [];
  const client = {
    session: {
      update: async (args: { metadata?: Session["metadata"] }) => {
        root = { ...root, metadata: args.metadata };
        return { data: root };
      },
      create: async () => { childCreates += 1; return { data: session("unexpected-child", directory, rootID) }; },
      prompt: async () => { promptCalls += 1; return { data: { info: {}, parts: [] } }; },
    },
    tui: { showToast: async () => ({ data: true }) },
  };
  const controller = new SessionCompletionController(
    { client: { app: { log: async ({ body }: { body: Record<string, unknown> }) => { logs.push(body); return { data: true }; } }, directory } } as never,
    { auditWindow: { enabled: false }, maxRequestBytes, maxRetryAttempts: 2, statusToasts: false },
    client as never,
  );
  const revisionBase = {
    assistantRef: "none",
    diffDigest: stableDigest([]),
    humanRef: "none",
    journalDigest: stableDigest([]),
    leaseGeneration: 0,
    todoDigest: stableDigest([]),
  };
  const revision = { ...revisionBase, revisionDigest: stableDigest(revisionBase) };
  const epoch: AuditEpoch = {
    auditID: "audit_guard_long_run_overflow",
    attempt: 0,
    childSessionID: null,
    completionEvidence,
    inspected: revision,
    kind: "completion",
    questionRequest: null,
    rootRef,
    rootSessionID: rootID,
  };
  const state: RootState = {
    ...initialRootState(root),
    activeAudit: epoch,
    auditAbort: new AbortController(),
    auditDiagnostics: {
      allowedRequestBytes: maxRequestBytes,
      attempt: 0,
      attemptLimit: 2,
      endedAt: null,
      errorClass: null,
      requestBytes: null,
      retainedChildCount: null,
      startedAt: Date.now(),
    },
    grindEnabled: true,
    state: "auditing",
  };
  const inspection = {
    context: { assistantEvidence: [], background: [], humanMessages: [] },
    journal: {
      absolutePath: path.join(directory, "history.md"),
      digest: revision.journalDigest,
      relativePath: "history.md",
      source: "docs_fallback" as const,
    },
    revision,
  };
  const request = buildArbiterAuditRequest(epoch, inspection, completionEvidence);
  const measuredRequestBytes = requestBytes(request);
  const probe = controller as unknown as {
    roots: Map<string, RootState>;
    runAudit(state: RootState, inspection: unknown, epoch: AuditEpoch): Promise<void>;
  };
  probe.roots.set(rootID, state);
  await probe.runAudit(state, inspection, epoch);
  assert(promptCalls === 0 && childCreates === 0, "Overflow must stop before child creation or model prompt");
  assert(state.state === "error" && state.activeAudit == null, "Overflow must leave a terminal error state");
  assert(state.auditDiagnostics.errorClass === "input-state", "Overflow must be classified as terminal input-state");
  assert((state.auditDiagnostics.requestBytes ?? 0) > maxRequestBytes, "Overflow must preserve observed request bytes");
  assert(state.auditDiagnostics.requestBytes === measuredRequestBytes, "Controller request bytes must match the exact built request");
  return {
    allowedBytes: maxRequestBytes,
    childCreates,
    errorClass: state.auditDiagnostics.errorClass,
    observedBytes: state.auditDiagnostics.requestBytes,
    promptCalls,
    requestDigest: crypto.createHash("sha256").update(request).digest("hex"),
    stoppedLog: logs.some((entry) => entry.message === "completion audit stopped"),
  };
}

async function proveCandidateController(
  directory: string,
  completionEvidence: SessionDeliveryContextResult,
) {
  const rootID = "session_guard_reviewed_candidate";
  const rootRef = hashRef("session", rootID);
  let root = session(rootID, directory);
  let child: Session | null = null;
  let childCreates = 0;
  let continuationCalls = 0;
  const logs: Array<Record<string, unknown>> = [];
  const journal = discoverStrategyJournal(
    directory,
    rootRef,
    { background: [], humanMessages: [] },
    "docs/session-strategy-history",
  );
  const prompts: string[] = [];
  const revisionBase = {
    assistantRef: "none",
    diffDigest: stableDigest([]),
    humanRef: "none",
    journalDigest: journal.digest,
    leaseGeneration: 0,
    todoDigest: stableDigest([]),
  };
  const revision = { ...revisionBase, revisionDigest: stableDigest(revisionBase) };
  const epoch: AuditEpoch = {
    auditID: "audit_guard_reviewed_candidate",
    attempt: 0,
    childSessionID: null,
    completionEvidence,
    inspected: revision,
    kind: "completion",
    questionRequest: null,
    rootRef,
    rootSessionID: rootID,
  };
  const client = {
    tool: { ids: async () => ({ data: [] }) },
    v2: { agent: { list: async () => ({ data: { data: [{ id: "session-completion-arbiter", hidden: true, model: { providerID: "proof", id: "model" } }] } }) } },
    provider: { list: async () => ({ data: { all: [{ id: "proof", models: { model: {} } }], connected: ["proof"] } }) },
    session: {
      children: async () => ({ data: child == null ? [] : [child] }),
      create: async (args: { metadata: Session["metadata"] }) => {
        childCreates += 1;
        child = session("session_guard_reviewed_candidate_child", directory, rootID, 1, args.metadata as Record<string, unknown>);
        return { data: child };
      },
      get: async ({ sessionID }: { sessionID: string }) => ({ data: sessionID === rootID ? root : child }),
      diff: async () => ({ data: [] }),
      messages: async () => ({ data: [] }),
      prompt: async (args: { parts: Array<{ text?: string }> }) => {
        const text = args.parts.map((part) => part.text ?? "").join("\n");
        prompts.push(text);
        return { data: { info: {}, parts: [{
          type: "text",
          text: JSON.stringify({
            schemaVersion: 1,
            auditID: epoch.auditID,
            rootSessionRef: epoch.rootRef,
            inspectedRevision: revision.revisionDigest,
            verdict: "allow_stop",
            confidence: "high",
            goalSummary: "Reviewed provider-free candidate complete",
            requirementMatrix: [],
            unresolved: [],
            strategyAssessment: { fingerprint: "reviewed-candidate", prohibitedStrategies: [], repeated: false, requiredRetryEvidence: [] },
            questionAnswers: null,
            ownerBoundary: null,
            evidenceRefs: [],
            evidenceGaps: [],
          }),
        }] } };
      },
      promptAsync: async () => { continuationCalls += 1; return { data: true }; },
      status: async () => ({ data: child == null ? {} : { [child.id]: { type: "idle" } } }),
      todo: async () => ({ data: [] }),
      update: async (args: { sessionID: string; metadata?: Session["metadata"] }) => {
        if (args.sessionID === rootID) root = { ...root, metadata: args.metadata };
        else if (child != null) child = { ...child, metadata: args.metadata };
        return { data: args.sessionID === rootID ? root : child };
      },
    },
    tui: { showToast: async () => ({ data: true }) },
  };
  const controller = new SessionCompletionController(
    { client: { app: { log: async ({ body }: { body: Record<string, unknown> }) => { logs.push(body); return { data: true }; } }, directory } } as never,
    { auditWindow: { enabled: false }, maxRequestBytes: MAX_REQUEST_BYTES, maxRetryAttempts: 1, statusToasts: false },
    client as never,
  );
  const state: RootState = {
    ...initialRootState(root),
    activeAudit: epoch,
    auditAbort: new AbortController(),
    grindEnabled: true,
    state: "auditing",
  };
  const inspection = {
    context: { assistantEvidence: [], background: [], humanMessages: [] },
    journal,
    revision,
  };
  const expectedRequest = buildArbiterAuditRequest(epoch, inspection, completionEvidence);
  const probe = controller as unknown as {
    roots: Map<string, RootState>;
    runAudit(state: RootState, inspection: unknown, epoch: AuditEpoch): Promise<void>;
  };
  probe.roots.set(rootID, state);
  await probe.runAudit(state, inspection, epoch);
  assert(childCreates === 1 && prompts.length === 1, "Candidate controller must create and prompt one fake child");
  assert(prompts[0] === expectedRequest, "Candidate controller must submit the exact measured request");
  assert(state.auditDiagnostics.requestBytes === requestBytes(expectedRequest), "Candidate controller request byte diagnostics mismatch");
  assert(
    state.state === "passed" && state.activeAudit == null,
    `Candidate controller must reach passed terminal state (state=${state.state}, errorClass=${state.auditDiagnostics.errorClass}, active=${state.activeAudit != null}, continuationCalls=${continuationCalls}, logs=${JSON.stringify(logs)})`,
  );
  assert(continuationCalls === 0, "Candidate controller continuation side-effect mismatch");
  return {
    childCreates,
    cleanup: "complete",
    continuationCalls,
    promptCalls: prompts.length,
    requestBytes: state.auditDiagnostics.requestBytes,
    requestDigest: crypto.createHash("sha256").update(expectedRequest).digest("hex"),
    rootState: state.state,
    verdict: "allow_stop",
  };
}

async function proveRetention(directory: string) {
  const rootID = "session_guard_long_run_retention";
  const root = session(rootID, directory);
  const rootRef = hashRef("session", rootID);
  const metadata = (auditID: string, status: string) => ({ completionGuard: { auditID, rootSessionRef: rootRef, status } });
  const oldest = session("child-oldest", directory, rootID, 1, metadata("audit-oldest", "passed"));
  const newest = session("child-newest", directory, rootID, 2, metadata("audit-newest", "continued"));
  const unrelated = session("child-unrelated", directory, rootID, 0);
  const created = session("child-current", directory, rootID, 3);
  const deleted: string[] = [];
  const client = {
    tool: { ids: async () => ({ data: ["read", "bash"] }) },
    v2: { agent: { list: async () => ({ data: { data: [{ id: "session-completion-arbiter", hidden: true, model: { providerID: "proof", id: "model" } }] } }) } },
    provider: { list: async () => ({ data: { all: [{ id: "proof", models: { model: {} } }], connected: ["proof"] } }) },
    session: {
      children: async () => ({ data: [oldest, newest, unrelated] }),
      get: async ({ sessionID }: { sessionID: string }) => ({ data: [oldest, newest, unrelated].find((child) => child.id === sessionID) }),
      status: async () => ({ data: { [oldest.id]: { type: "idle" }, [newest.id]: { type: "idle" }, [unrelated.id]: { type: "idle" } } }),
      delete: async ({ sessionID }: { sessionID: string }) => { deleted.push(sessionID); return { data: true }; },
      create: async (args: { metadata: Session["metadata"] }) => ({ data: { ...created, metadata: args.metadata } }),
    },
  };
  const revisionBase = { assistantRef: "none", diffDigest: "none", humanRef: "none", journalDigest: "none", leaseGeneration: 0, todoDigest: "none" };
  const epoch: AuditEpoch = {
    auditID: "audit-current",
    attempt: 1,
    childSessionID: null,
    completionEvidence: null,
    inspected: { ...revisionBase, revisionDigest: stableDigest(revisionBase) },
    kind: "completion",
    questionRequest: null,
    rootRef,
    rootSessionID: rootID,
  };
  const state = { ...initialRootState(root), grindEnabled: true };
  const result = await ensureArbiterChild(client as never, directory, "session-completion-arbiter", state, epoch, 2);
  assert(deleted.length === 1 && deleted[0] === oldest.id, `Retention must delete only the oldest eligible child, got ${deleted.join(",")}`);
  assert(result.child.id === created.id && result.retainedChildCount === 2, "Retention must create one current child within the finite limit");
  return { createdChild: result.child.id, deleted, retainedChildCount: result.retainedChildCount, unrelatedPreserved: true };
}

async function proveFailureClasses(directory: string) {
  const rootID = "session_guard_failure_classes";
  const root = session(rootID, directory);
  const rootRef = hashRef("session", rootID);
  const revisionBase = { assistantRef: "none", diffDigest: "none", humanRef: "none", journalDigest: "none", leaseGeneration: 0, todoDigest: "none" };
  const revision = { ...revisionBase, revisionDigest: stableDigest(revisionBase) };
  let child = session("child-failure-class", directory, rootID, 1, {
    completionGuard: { auditID: "audit-failure-class", rootSessionRef: rootRef, status: "auditing" },
  });
  let promptCalls = 0;
  let rootValue = root;
  const client = {
    tool: { ids: async () => ({ data: [] }) },
    v2: { agent: { list: async () => ({ data: { data: [{ id: "session-completion-arbiter", hidden: true, model: { providerID: "proof", id: "model" } }] } }) } },
    provider: { list: async () => ({ data: { all: [{ id: "proof", models: { model: {} } }], connected: ["proof"] } }) },
    session: {
      children: async () => ({ data: [child] }),
      get: async ({ sessionID }: { sessionID: string }) => ({ data: sessionID === rootID ? rootValue : child }),
      update: async (args: { sessionID: string; metadata?: Session["metadata"] }) => {
        if (args.sessionID === rootID) rootValue = { ...rootValue, metadata: args.metadata };
        else child = { ...child, metadata: args.metadata };
        return { data: args.sessionID === rootID ? rootValue : child };
      },
      prompt: async () => { promptCalls += 1; return { data: { info: {}, parts: [] } }; },
    },
    tui: { showToast: async () => ({ data: true }) },
  };
  const controller = new SessionCompletionController(
    { client: { app: { log: async () => ({ data: true }) } }, directory } as never,
    { auditWindow: { enabled: false }, maxRetryAttempts: 3, statusToasts: false },
    client as never,
  );
  const epoch: AuditEpoch = {
    auditID: "audit-failure-class",
    attempt: 0,
    childSessionID: child.id,
    completionEvidence: emptyCompletionEvidence(),
    inspected: revision,
    kind: "completion",
    questionRequest: null,
    rootRef,
    rootSessionID: rootID,
  };
  const state: RootState = {
    ...initialRootState(root),
    activeAudit: epoch,
    auditAbort: new AbortController(),
    auditDiagnostics: {
      allowedRequestBytes: 200_000,
      attempt: 0,
      attemptLimit: 3,
      endedAt: null,
      errorClass: null,
      requestBytes: null,
      retainedChildCount: null,
      startedAt: Date.now(),
    },
    grindEnabled: true,
    state: "auditing",
  };
  const probe = controller as unknown as {
    roots: Map<string, RootState>;
    runAudit(state: RootState, inspection: unknown, epoch: AuditEpoch): Promise<void>;
    retryAudit(state: RootState, inspection: unknown, epoch: AuditEpoch, error: unknown): Promise<void>;
  };
  probe.roots.set(rootID, state);
  const inspection = { context: { assistantEvidence: [], background: [], humanMessages: [] }, journal: { digest: "none", relativePath: null, source: "none" }, revision };
  await probe.runAudit(state, inspection, epoch);
  assert(state.state === "error" && state.activeAudit == null && state.auditDiagnostics.errorClass === "input-state", "Malformed verdict must stop as immutable input-state");
  assert(promptCalls === 1 && state.retryTimer == null, "Malformed verdict must not retry");

  const transientEpoch = { ...epoch, auditID: "audit-transient-exhausted", attempt: 1 };
  const transientState: RootState = {
    ...initialRootState(root),
    activeAudit: transientEpoch,
    auditAbort: new AbortController(),
    auditDiagnostics: { ...state.auditDiagnostics, attempt: 1, attemptLimit: 1, endedAt: null, errorClass: null, startedAt: Date.now() },
    grindEnabled: true,
    state: "auditing",
  };
  const exhaustedController = new SessionCompletionController(
    { client: { app: { log: async () => ({ data: true }) } }, directory } as never,
    { auditWindow: { enabled: false }, maxRetryAttempts: 1, statusToasts: false },
    client as never,
  ) as unknown as typeof probe;
  exhaustedController.roots.set(rootID, transientState);
  await exhaustedController.retryAudit(transientState, inspection, transientEpoch, new Error("temporary provider unavailable"));
  assert(transientState.state === "error" && transientState.activeAudit == null, "Transient exhaustion must stop terminally");
  assert(transientState.retryTimer == null && transientState.auditDiagnostics.errorClass === "transient", "Transient exhaustion must not leave a retry timer");
  return { immutablePromptCalls: promptCalls, immutableStatus: state.state, transientStatus: transientState.state };
}

async function proveDuplicateRetryChildren(directory: string) {
  const rootID = "session_guard_duplicate_retry";
  const rootRef = hashRef("session", rootID);
  const workFrontier = materializeWorkFrontier({
    acceptedOutcomeRef: "outcome_duplicate_retry",
    expectedGeneration: 0,
    gates: [],
    items: [{
      dependsOn: [],
      evidenceRefs: ["evidence_duplicate_retry"],
      gateRefs: [],
      id: "item_duplicate_retry",
      requirementRefs: ["requirement_duplicate_retry"],
      status: "complete",
    }],
    parkedDecisions: [],
    progressFingerprint: "progress_duplicate_retry",
  }, { basisHumanRef: "none", currentGeneration: 0, taskStateDigest: stableDigest([]) }).frontier;
  const root = session(rootID, directory, undefined, 0, { completionGuard: { grindEnabled: true, workFrontier } });
  const child = (id: string) => session(id, directory, rootID, 1, {
    completionGuard: { auditID: "audit-duplicate", attempt: 1, inspectedRevision: "revision", kind: "completion", rootSessionRef: rootRef, status: "retrying" },
  });
  const children = [child("child-duplicate-a"), child("child-duplicate-b")];
  let rootValue = root;
  const controller = new SessionCompletionController(
    { client: { app: { log: async () => ({ data: true }) } }, directory } as never,
    { auditWindow: { enabled: false }, maxRetryAttempts: 3, statusToasts: false },
    {
      v2: { session: { list: async () => ({ data: { cursor: {}, data: [root] } }) } },
      session: {
        children: async () => ({ data: children }),
        get: async ({ sessionID }: { sessionID: string }) => ({ data: sessionID === rootID ? rootValue : children.find((candidate) => candidate.id === sessionID) }),
        update: async (args: { metadata?: Session["metadata"] }) => {
          rootValue = { ...rootValue, metadata: args.metadata };
          return { data: rootValue };
        },
      },
      tui: { showToast: async () => ({ data: true }) },
    } as never,
  );
  const probe = controller as unknown as { reconcileRoots(): Promise<void>; roots: Map<string, RootState> };
  await probe.reconcileRoots();
  const state = probe.roots.get(rootID);
  assert(state?.state === "error" && state.restartRecoveryAction === "blocked-multiple-retrying-children", "Duplicate retry children must block startup recovery");
  return { action: state.restartRecoveryAction, status: state.state };
}

async function proveTaskFallback(directory: string) {
  const rootID = "session_guard_task_fallback";
  const root = session(rootID, directory);
  const leases = new AsyncLeaseRegistry({ onGeneration: () => undefined, onTerminalPty: () => undefined });
  leases.beforeTool("task", rootID, "call_task_fallback", {});
  leases.afterTool("task", rootID, "call_task_fallback", "background task_id=task_fallback", { sessionID: "session_task_child" }, () => null);
  const children = [{ id: "session_task_child", status: "idle" as const }];
  const lease = leases.terminalTaskAwaitingResult(rootID, children);
  assert(lease?.childSessionID === "session_task_child", "Terminal task fallback correlation missing");
  const prompts: string[] = [];
  const state = { ...initialRootState(root), grindEnabled: true };
  const client = { session: { promptAsync: async (args: { parts?: Array<{ text?: string }> }) => {
    prompts.push(args.parts?.map((part) => part.text ?? "").join("") ?? "");
    return { data: true };
  } } };
  assert(await sendTaskFallback(client as never, leases, state, lease.callID, lease.childSessionID), "Enabled task fallback must send");
  assert(prompts.length === 1 && prompts[0].includes(lease.callID) && prompts[0].includes(lease.childSessionID), "Task fallback must preserve internal correlation");
  leases.consumeSynthetic(rootID, prompts[0]);
  assert(leases.preflight(rootID, [], children).kind === "clear", "Consumed task fallback must clear async preflight");
  assert(leases.terminalTaskAwaitingResult(rootID, children) == null, "Task fallback must be exactly once");
  const disabled = { ...initialRootState(root), grindEnabled: false };
  assert(!await sendTaskFallback(client as never, leases, disabled, "call_disabled", "session_disabled"), "Disabled root must suppress task fallback");
  assert(prompts.length === 1, "Disable suppression must not add a prompt");
  return { exactlyOnce: true, promptCount: prompts.length, suppressedWhenDisabled: true };
}

async function proveWaitExhaustion(directory: string) {
  let rootValue = session("session_guard_wait_exhaustion", directory);
  const controller = new SessionCompletionController(
    { client: { app: { log: async () => ({ data: true }) } }, directory } as never,
    { auditWindow: { enabled: false }, maxWaitRechecks: 1, statusToasts: false },
    { session: { update: async (args: { metadata?: Session["metadata"] }) => {
      rootValue = { ...rootValue, metadata: args.metadata };
      return { data: rootValue };
    } }, tui: { showToast: async () => ({ data: true }) } } as never,
  );
  const state = { ...initialRootState(rootValue), grindEnabled: true, waitRecheckCount: 1 };
  const probe = controller as unknown as { scheduleWaitRecheck(state: RootState, reason: string): void };
  probe.scheduleWaitRecheck(state, "background result has not reached the root");
  await Bun.sleep(25);
  assert(state.state === "error" && state.waitRecheckTimer == null, "Wait recheck exhaustion must be terminal and timer-free");
  return { count: state.waitRecheckCount, status: state.state };
}

function record(value: unknown, name: string): Record<string, unknown> {
  if (value == null || typeof value !== "object" || Array.isArray(value)) throw new Error(`${name} must be an object`);
  return value as Record<string, unknown>;
}

function numberValue(value: unknown, name: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) throw new Error(`${name} must be a finite number`);
  return value;
}

function evaluateRaw(rawValue: unknown): Record<string, unknown> {
  const raw = record(rawValue, "raw evidence");
  const candidateId = String(raw.candidateId ?? "");
  const cleanup = String(raw.cleanup ?? "unknown");
  const mode = String(raw.mode ?? "");
  assert(candidateId !== "", "Raw evidence candidateId is missing");
  assert(cleanup === "complete", "Raw evidence cleanup must be complete");
  if (mode === "fixture") {
    const fixture = record(raw.fixture, "fixture");
    const counts = record(fixture.counts, "fixture.counts");
    const overflow = record(raw.overflow, "overflow");
    const observedBytes = numberValue(overflow.observedBytes, "overflow.observedBytes");
    const allowedBytes = numberValue(overflow.allowedBytes, "overflow.allowedBytes");
    assert(JSON.stringify(counts) === JSON.stringify(REVIEWED_COUNTS), "Fixture retained counts do not match the reviewed population");
    assert(allowedBytes === MAX_REQUEST_BYTES && observedBytes > allowedBytes, "Baseline fixture must exceed the unchanged request limit");
    assert(overflow.promptCalls === 0 && overflow.childCreates === 0, "Baseline overflow must create no child or model call");
    assert(overflow.errorClass === "input-state" && overflow.stoppedLog === true, "Baseline overflow must remain terminal and observable");
    return {
      baselineOverflow: true,
      candidateId,
      cleanup,
      exactRequestBytes: observedBytes,
      mode,
      requestLimit: allowedBytes,
      reviewedCounts: true,
      schemaVersion: 1,
      status: "complete",
      zeroChildModelCalls: true,
    };
  }
  if (mode === "candidate") {
    const candidate = record(raw.candidate, "candidate");
    const controller = record(raw.controller, "controller");
    const fixture = record(raw.fixture, "fixture");
    const counts = record(fixture.counts, "fixture.counts");
    const matrix = record(candidate.readbackMatrix, "candidate.readbackMatrix");
    const exactRequestBytes = numberValue(candidate.exactRequestBytes, "candidate.exactRequestBytes");
    assert(JSON.stringify(counts) === JSON.stringify(REVIEWED_COUNTS), "Candidate fixture retained counts do not match the reviewed population");
    assert(exactRequestBytes <= 175_000 && exactRequestBytes <= MAX_REQUEST_BYTES, "Candidate fixture must retain proof-control and runtime headroom");
    assert(candidate.byteStable === true && candidate.requestSchemaVersion === 2 && candidate.evidenceSchemaVersion === 1, "Candidate schemas and serialization must be stable");
    assert(Object.values(matrix).every((value) => value === true), "Candidate readback matrix is incomplete");
    assert(raw.modelCalls === 0 && raw.childCreates === 0, "Candidate builder proof must create no child or model call");
    assert(
      controller.childCreates === 1 && controller.promptCalls === 1 && typeof controller.requestBytes === "number" && controller.requestBytes <= MAX_REQUEST_BYTES
        && ((controller.rootState === "passed" && controller.verdict === "allow_stop" && controller.continuationCalls === 0)
          || (controller.rootState === "continued" && controller.verdict === "continue" && controller.continuationCalls === 1)),
      "Candidate provider-free controller path mismatch",
    );
    return {
      byteStable: true,
      candidateId,
      cleanup,
      exactRequestBytes,
      mode,
      proofControlLimit: 175_000,
      readbackComplete: true,
      requestLimit: MAX_REQUEST_BYTES,
      schemaVersion: 1,
      status: "complete",
      zeroChildModelCalls: true,
    };
  }
  if (mode === "installed-reviewed") {
    const fixture = record(raw.fixture, "fixture");
    const counts = record(fixture.counts, "fixture.counts");
    const provider = record(raw.provider, "provider");
    const request = record(raw.request, "request");
    const result = record(provider.result, "provider.result");
    const exactRequestBytes = numberValue(request.requestBytes, "request.requestBytes");
    assert(JSON.stringify(counts) === JSON.stringify(REVIEWED_COUNTS), "Installed reviewed fixture identity mismatch");
    assert(exactRequestBytes <= 175_000 && exactRequestBytes <= MAX_REQUEST_BYTES, "Installed reviewed request exceeds its control envelope");
    assert(request.requestSchemaVersion === 2 && request.evidenceSchemaVersion === 1, "Installed reviewed request schema mismatch");
    assert(provider.arbiterCalls === 1 && provider.primaryCalls === 0 && provider.externalCalls === 0, "Installed reviewed fixture must use exactly one local hidden-arbiter call");
    assert(result.verdict === "allow_stop" && result.requirementRows === 0, "Installed reviewed verdict matrix mismatch");
    assert(raw.cleanup === "complete" && raw.childCount === 1, "Installed reviewed cleanup/child count mismatch");
    return {
      candidateId,
      cleanup,
      exactRequestBytes,
      externalCalls: 0,
      mode,
      requestLimit: MAX_REQUEST_BYTES,
      schemaVersion: 1,
      status: "complete",
      verdict: "allow_stop",
    };
  }
  if (mode === "installed") {
    const profile = record(raw.profile, "profile");
    const provider = record(raw.provider, "provider");
    const request = record(raw.request, "request");
    const root = record(raw.root, "root");
    const result = record(provider.result, "provider.result");
    const exactRequestBytes = numberValue(request.requestBytes, "request.requestBytes");
    assert(exactRequestBytes <= MAX_REQUEST_BYTES, "Installed request exceeds the unchanged runtime limit");
    const representation = request.requestSchemaVersion === 2 && request.evidenceSchemaVersion === 1
      ? "private-canonical-v1"
      : request.requestSchemaVersion === 1 && request.evidenceSchemaVersion === 2
        ? "legacy-public-v2"
        : null;
    assert(representation != null, "Installed request schema mismatch");
    assert(provider.arbiterCalls === 1 && provider.externalCalls === 0, "Installed proof must use one local arbiter call and no external call");
    assert(provider.primaryCalls === Number(profile.messageCount) + 1, "Installed primary call count must include the official activation turn");
    assert(
      result.verdict === "allow_stop" && result.requirementRows === 0
        && result.questionAnswers === null && result.ownerBoundary === null,
      "Installed correlated verdict matrix mismatch",
    );
    assert(root.state === "passed" && numberValue(root.childCount, "root.childCount") >= 1, "Installed root must pass through a retained child");
    assert(request.humanMessages === profile.messageCount, "Installed human-message readback mismatch");
    assert(request.assistantEvidence === Math.min(Number(profile.messageCount) + 1, 16), "Installed assistant-evidence readback mismatch");
    return {
      candidateId,
      cleanup,
      exactRequestBytes,
      externalCalls: 0,
      mode,
      profile,
      representation,
      requestLimit: MAX_REQUEST_BYTES,
      rootState: "passed",
      schemaVersion: 1,
      status: "complete",
    };
  }
  if (mode === "incidents") {
    const observations = Array.isArray(raw.observations) ? raw.observations.map((value) => record(value, "incident")) : [];
    const summary = record(raw.summary, "summary");
    const query = record(raw.query, "query");
    assert(observations.length === 8 && summary.incidentCount === 8, "Incident inventory must contain the reviewed eight terminal roots");
    assert(summary.minRequestBytes === 214_535 && summary.maxRequestBytes === 254_691, "Incident byte range changed from the reviewed population");
    assert(observations.every((row) => row.allowedBytes === MAX_REQUEST_BYTES), "Every incident must retain the configured request limit");
    assert(observations.every((row) =>
      row.disposition === "fit"
        ? typeof row.candidateBytes === "number" && row.candidateBytes <= MAX_REQUEST_BYTES
        : row.disposition === "irreducible-critical-overflow" || row.disposition === "irreducible-critical-conflict"
    ), "Every incident must fit the candidate or retain an explicit critical classification");
    assert(new Set(observations.map((row) => row.sessionRef)).size === observations.length, "Incident refs must be unique");
    assert(query.queryOnly === true && query.closed === true && query.writes === 0, "Incident database access must be query-only and closed");
    assert(raw.modelCalls === 0 && raw.childCreates === 0, "Incident inventory must create no child or model call");
    return {
      candidateId,
      cleanup,
      incidentCount: observations.length,
      maxCandidateBytes: summary.maxCandidateBytes,
      minCandidateBytes: summary.minCandidateBytes,
      maxRequestBytes: summary.maxRequestBytes,
      minRequestBytes: summary.minRequestBytes,
      mode,
      privacySafe: true,
      queryOnly: true,
      schemaVersion: 1,
      status: "complete",
      zeroChildModelCalls: true,
    };
  }
  throw new Error(`Unsupported raw evidence mode: ${mode}`);
}

function writeCapture(options: Options, raw: Record<string, unknown>): void {
  if (fs.existsSync(options.evidenceRoot)) throw new Error("Evidence root already exists");
  fs.mkdirSync(options.evidenceRoot, { recursive: false });
  const rawPath = path.join(options.evidenceRoot, "raw.json");
  writeNew(rawPath, raw);
  const evaluation = {
    ...evaluateRaw(raw),
    rawDigest: digest(rawPath),
  };
  writeNew(path.join(options.evidenceRoot, "evaluation.json"), evaluation);
  console.log(json({ candidateId: options.candidateId, evidenceRoot: "<evidence-root>", mode: options.mode, status: "complete" }).trimEnd());
}

type InstalledAuditCapture = {
  assistantEvidence: number;
  evidenceSchemaVersion: unknown;
  humanMessages: number;
  requestBytes: number;
  requestDigest: string;
  requestSchemaVersion: unknown;
  rootSessionRef: unknown;
};

function fixedText(prefix: string, length: number): string {
  return `${prefix}${"X".repeat(length)}`.slice(0, length);
}

function providerContent(value: unknown): string {
  if (typeof value === "string") return value;
  if (!Array.isArray(value)) return "";
  return value.map((part) => typeof part === "string" ? part : String(record(part, "provider content part").text ?? "")).join("\n");
}

function installedStreamingCompletion(text: string): Response {
  const id = `chatcmpl_${crypto.randomUUID()}`;
  const created = Math.floor(Date.now() / 1_000);
  const chunks = [
    { id, object: "chat.completion.chunk", created, model: "proof-model", choices: [{ index: 0, delta: { role: "assistant", content: text }, finish_reason: null }] },
    { id, object: "chat.completion.chunk", created, model: "proof-model", choices: [{ index: 0, delta: {}, finish_reason: "stop" }] },
  ];
  return new Response(`${chunks.map((chunk) => `data: ${JSON.stringify(chunk)}\n\n`).join("")}data: [DONE]\n\n`, {
    headers: { "content-type": "text/event-stream" },
  });
}

function installedProvider(messageChars: number) {
  let arbiterCalls = 0;
  let audit: InstalledAuditCapture | null = null;
  let primaryCalls = 0;
  let result: { ownerBoundary: null; questionAnswers: null; requirementRows: number; verdict: "allow_stop" } | null = null;
  const server = Bun.serve({
    hostname: "127.0.0.1",
    port: 0,
    async fetch(request) {
      const url = new URL(request.url);
      if (url.pathname.endsWith("/models")) {
        return Response.json({ object: "list", data: [{ id: "proof-model", object: "model", owned_by: "proof" }] });
      }
      if (!url.pathname.endsWith("/chat/completions")) return new Response("not found", { status: 404 });
      const body = await request.json() as Record<string, unknown>;
      const messages = Array.isArray(body.messages) ? body.messages.map((message) => record(message, "provider message")) : [];
      const text = messages.map((message) => providerContent(message?.content)).join("\n");
      const match = text.match(/<completion_audit_request>\s*([\s\S]*?)\s*<\/completion_audit_request>/);
      let response: string;
      if (match == null) {
        primaryCalls += 1;
        response = fixedText("Synthetic installed long-root output. ", messageChars);
      } else {
        arbiterCalls += 1;
        const requestPayload = JSON.parse(match[1]) as Record<string, unknown>;
        const completionEvidence = record(requestPayload.completionEvidence, "installed completionEvidence");
        audit = {
          assistantEvidence: Array.isArray(completionEvidence.assistantEvidence) ? completionEvidence.assistantEvidence.length : -1,
          evidenceSchemaVersion: completionEvidence.schemaVersion,
          humanMessages: Array.isArray(completionEvidence.humanMessages) ? completionEvidence.humanMessages.length : -1,
          requestBytes: requestBytes(match[0]),
          requestDigest: crypto.createHash("sha256").update(match[0]).digest("hex"),
          requestSchemaVersion: requestPayload.schemaVersion,
          rootSessionRef: requestPayload.rootSessionRef,
        };
        result = { ownerBoundary: null, questionAnswers: null, requirementRows: 0, verdict: "allow_stop" };
        response = JSON.stringify({
          schemaVersion: 1,
          auditID: requestPayload.auditID,
          rootSessionRef: requestPayload.rootSessionRef,
          inspectedRevision: requestPayload.inspectedRevision,
          verdict: "allow_stop",
          confidence: "high",
          goalSummary: "Disposable installed long-root proof complete",
          requirementMatrix: [],
          unresolved: [],
          ownerBoundary: null,
          questionAnswers: null,
          evidenceGaps: [],
          evidenceRefs: [],
          strategyAssessment: {
            fingerprint: "installed-long-root-proof",
            prohibitedStrategies: [],
            repeated: false,
            requiredRetryEvidence: [],
          },
        });
      }
      return body.stream === true ? installedStreamingCompletion(response) : Response.json({
        id: `chatcmpl_${crypto.randomUUID()}`,
        object: "chat.completion",
        created: Math.floor(Date.now() / 1_000),
        model: "proof-model",
        choices: [{ index: 0, message: { role: "assistant", content: response }, finish_reason: "stop" }],
        usage: { prompt_tokens: 10, completion_tokens: 10, total_tokens: 20 },
      });
    },
  });
  return { facts: () => ({ arbiterCalls, audit, primaryCalls, result }), server };
}

function writeInstalledConfig(configDir: string, runtimeSource: string, providerUrl: string): string {
  const agentSource = path.join(runtimeSource, "global", "agents", "session-completion-arbiter.md");
  const guardSource = path.join(runtimeSource, "global", "extensions", "session-completion-guard.ts");
  const bridgeSource = path.join(runtimeSource, "global", "extensions", "opencode-pty-bridge.ts");
  for (const required of [agentSource, guardSource, bridgeSource]) assert(fs.existsSync(required), `Installed runtime source is missing ${required}`);
  fs.mkdirSync(path.join(configDir, "agents"), { recursive: true });
  fs.copyFileSync(agentSource, path.join(configDir, "agents", "session-completion-arbiter.md"));
  writeNew(path.join(configDir, "opencode.json"), {
    $schema: "https://opencode.ai/config.json",
    model: "proof/proof-model",
    small_model: "proof/proof-model",
    permission: "allow",
    agent: {
      "session-completion-arbiter": { hidden: true, mode: "subagent", model: "proof/proof-model" },
    },
    provider: {
      proof: {
        npm: "@ai-sdk/openai-compatible",
        name: "Completion Guard Installed Proof",
        options: { apiKey: "proof-not-secret", baseURL: `${providerUrl}/v1`, maxRetries: 0 },
        models: { "proof-model": { name: "Proof Model", tool_call: true, limit: { context: 500_000, output: 10_000 } } },
      },
    },
    plugin: [
      pathToFileURL(bridgeSource).href,
      [pathToFileURL(guardSource).href, {
        arbiterAgent: "session-completion-arbiter",
        arbiterPromptTimeoutMs: 10_000,
        auditWindow: { enabled: false, mode: "read-only-monitor", scope: "per-root", terminal: "powershell-shell" },
        enabled: true,
        initialDelayMs: 50,
        maxCycles: 3,
        maxDelayMs: 2_000,
        maxRequestBytes: MAX_REQUEST_BYTES,
        maxRetryAttempts: 1,
        maxWaitRechecks: 3,
        retainAuditSessions: 2,
        retryMultiplier: 1,
        settleMs: 50,
        statusToasts: false,
        strategyFallback: "docs/session-strategy-history",
        waitRecheckMs: 100,
      }],
    ],
  });
  seedProofConfigDependencies(configDir, path.join(sourceRoot, "global"));
  return crypto.createHash("sha256").update(fs.readFileSync(path.join(configDir, "opencode.json"))).digest("hex");
}

async function runInstalledReviewed(options: Options): Promise<void> {
  assert(options.executablePath != null, "Installed reviewed mode requires an executable");
  assert(fs.existsSync(path.dirname(options.evidenceRoot)), "Installed reviewed evidence parent is missing");
  assert(!fs.existsSync(options.evidenceRoot), "Installed reviewed evidence root already exists");
  const fixtureRoot = fs.mkdtempSync(path.join(os.tmpdir(), "guard-reviewed-installed-"));
  const configDir = path.join(fixtureRoot, "config");
  const project = path.join(fixtureRoot, "project");
  const runtime = path.join(fixtureRoot, "runtime");
  fs.mkdirSync(project, { recursive: true });
  fs.writeFileSync(path.join(project, "AGENTS.md"), "# Disposable reviewed completion-guard proof\n", "utf8");
  const provider = installedProvider(128);
  const configDigest = writeInstalledConfig(configDir, options.runtimeSource, `http://${provider.server.hostname}:${provider.server.port}`);
  const environment = isolatedProofServerEnvironment(process.env, configDir, runtime);
  const installed = installedOpenCodeIdentity(options.executablePath);
  let server: Awaited<ReturnType<typeof startProofServer>> | null = null;
  let client: ReturnType<typeof proofClient> | null = null;
  let rootID: string | null = null;
  let childID: string | null = null;
  let raw: Record<string, unknown> | null = null;
  let failure: unknown = null;
  try {
    server = await startProofServer(options.executablePath, project, environment);
    client = proofClient(server.url, project, environment);
    const route = await waitForProofRoute(client, project, "session-completion-arbiter", 15_000);
    assert(route.hidden && route.model.providerID === "proof" && route.model.modelID === "proof-model", "Installed reviewed route mismatch");
    const root = await requestData<Record<string, unknown>>(client.session.create({ directory: project, title: "reviewed arbiter root" }) as Promise<unknown>, "reviewed root create");
    rootID = String(root.id);
    const child = await requestData<Record<string, unknown>>(client.session.create({
      agent: route.agent,
      directory: project,
      model: { id: route.model.modelID, providerID: route.model.providerID },
      parentID: rootID,
      title: "reviewed hidden arbiter child",
    }) as Promise<unknown>, "reviewed child create");
    childID = String(child.id);
    const fixtureDb = path.join(fixtureRoot, "reviewed.db");
    createLongRootDatabase(fixtureDb, "session_guard_reviewed_long_root");
    const completionEvidence = reviewedLongRootFixture(readProjectionInChild(fixtureDb, "session_guard_reviewed_long_root"));
    assertReviewedCounts(completionEvidence);
    const revisionBase = {
      assistantRef: "none",
      diffDigest: stableDigest([]),
      humanRef: "none",
      journalDigest: stableDigest([]),
      leaseGeneration: 0,
      todoDigest: stableDigest([]),
    };
    const revision = { ...revisionBase, revisionDigest: stableDigest(revisionBase) };
    const epoch: AuditEpoch = {
      auditID: "audit_installed_reviewed_fixture",
      attempt: 0,
      childSessionID: childID,
      completionEvidence,
      inspected: revision,
      kind: "completion",
      questionRequest: null,
      rootRef: hashRef("session", rootID),
      rootSessionID: rootID,
    };
    const request = buildArbiterAuditRequest(epoch, {
      context: { assistantEvidence: [], background: [], humanMessages: [] },
      journal: { absolutePath: path.join(fixtureRoot, "history.md"), digest: revision.journalDigest, relativePath: "history.md", source: "docs_fallback" },
      revision,
    }, completionEvidence);
    requireBoundedRequest(request, MAX_REQUEST_BYTES);
    const response = await requestData<Record<string, unknown>>(client.session.prompt({
      agent: route.agent,
      directory: project,
      model: { providerID: route.model.providerID, modelID: route.model.modelID },
      parts: [{ type: "text", text: request }],
      sessionID: childID,
      tools: {},
    }) as Promise<unknown>, "reviewed hidden arbiter prompt");
    const parts = Array.isArray(response.parts) ? response.parts : [];
    const verdict = parseCompletionVerdictText(parts as never, epoch);
    const facts = provider.facts();
    assert(verdict.verdict === "allow_stop" && facts.audit != null && facts.result != null, "Installed reviewed verdict mismatch");
    assert(facts.audit.requestDigest === crypto.createHash("sha256").update(request).digest("hex"), "Installed reviewed provider request mismatch");
    raw = {
      candidateId: options.candidateId,
      childCount: 1,
      cleanup: "pending",
      environment: {
        configDigest,
        executableSha256: installed.sha256,
        openCode: installed.version,
        platform: process.platform,
        runtimeSourceHashes: [
          "global/agents/session-completion-arbiter.md",
          "global/extensions/session-completion-guard/arbiter-evidence.ts",
          "global/extensions/session-completion-guard/controller.ts",
          "global/plugin/session-delivery-context/projection.ts",
        ].map((relative) => ({ path: relative, sha256: digest(path.join(options.runtimeSource, relative)) })),
      },
      fixture: { counts: reviewedCounts(completionEvidence) },
      mode: "installed-reviewed",
      provider: { arbiterCalls: facts.arbiterCalls, externalCalls: 0, primaryCalls: facts.primaryCalls, result: facts.result },
      request: facts.audit,
      schemaVersion: 1,
    };
  } catch (error) {
    failure = error;
  } finally {
    if (client != null) {
      try {
        if (childID != null) await client.session.delete({ directory: project, sessionID: childID });
        if (rootID != null) await client.session.delete({ directory: project, sessionID: rootID });
      } catch (error) {
        failure ??= error;
      }
    }
    if (server != null) {
      try {
        await stopProofProcessTree(server.child);
      } catch (error) {
        failure ??= error;
      }
    }
    provider.server.stop(true);
    try {
      removeProofFixture(fixtureRoot);
    } catch (error) {
      failure ??= error;
    }
  }
  if (failure != null) {
    fs.mkdirSync(options.evidenceRoot, { recursive: false });
    writeNew(path.join(options.evidenceRoot, "failure.json"), {
      candidateId: options.candidateId,
      cleanup: fs.existsSync(fixtureRoot) ? "unknown" : "complete",
      error: failure instanceof Error ? failure.message : String(failure),
      errorFacts: proofErrorFacts(failure),
      mode: "installed-reviewed",
      provider: provider.facts(),
      schemaVersion: 1,
    });
    throw failure;
  }
  assert(raw != null && !fs.existsSync(fixtureRoot), "Installed reviewed cleanup must complete before retention");
  raw.cleanup = "complete";
  writeCapture(options, raw);
}

async function runInstalled(options: Options): Promise<void> {
  if (options.reviewedFixture) return runInstalledReviewed(options);
  assert(options.executablePath != null, "Installed mode requires an executable");
  assert(fs.existsSync(path.dirname(options.evidenceRoot)), "Installed evidence parent is missing");
  assert(!fs.existsSync(options.evidenceRoot), "Installed evidence root already exists");
  const fixture = fs.mkdtempSync(path.join(os.tmpdir(), "guard-long-run-installed-"));
  const configDir = path.join(fixture, "config");
  const project = path.join(fixture, "project");
  const runtime = path.join(fixture, "runtime");
  fs.mkdirSync(project, { recursive: true });
  fs.writeFileSync(path.join(project, "AGENTS.md"), "# Disposable installed completion-guard proof\n", "utf8");
  const provider = installedProvider(options.messageChars);
  const configDigest = writeInstalledConfig(configDir, options.runtimeSource, `http://${provider.server.hostname}:${provider.server.port}`);
  const environment = isolatedProofServerEnvironment(process.env, configDir, runtime);
  const installed = installedOpenCodeIdentity(options.executablePath);
  let server: Awaited<ReturnType<typeof startProofServer>> | null = null;
  let client: ReturnType<typeof proofClient> | null = null;
  let rootID: string | null = null;
  let raw: Record<string, unknown> | null = null;
  let failure: unknown = null;
  try {
    server = await startProofServer(options.executablePath, project, environment);
    client = proofClient(server.url, project, environment);
    const route = await waitForProofRoute(client, project, "session-completion-arbiter", 15_000);
    assert(route.hidden && route.model.providerID === "proof" && route.model.modelID === "proof-model", "Installed hidden arbiter route mismatch");
    const root = await requestData<Record<string, unknown>>(client.session.create({
      directory: project,
      title: "installed long-root request budget proof",
    }) as Promise<unknown>, "installed root create");
    rootID = String(root.id);
    for (let index = 0; index < options.messageCount; index += 1) {
      if (index === options.messageCount - 1) {
        await requestData(client.session.command({
          arguments: "",
          command: "enable-grind",
          directory: project,
          sessionID: rootID,
        }) as Promise<unknown>, "enable installed guard");
      }
      const prompt = await requestData<Record<string, unknown>>(client.session.prompt({
        directory: project,
        model: { providerID: "proof", modelID: "proof-model" },
        parts: [{ type: "text", text: fixedText(`Synthetic installed requirement ${index + 1}. `, options.messageChars) }],
        sessionID: rootID,
        system: "Return the requested synthetic completion text and stop. Do not call tools.",
        tools: {},
      }) as Promise<unknown>, `installed prompt ${index + 1}`);
      assert(record(prompt.info, "installed prompt info").error == null, `Installed primary prompt ${index + 1} failed`);
    }
    const deadline = Date.now() + 60_000;
    let rootState = "unknown";
    while (Date.now() < deadline) {
      const current = await requestData<Record<string, unknown>>(client.session.get({ directory: project, sessionID: rootID }) as Promise<unknown>, "installed root readback");
      const metadata = record(current.metadata, "installed root metadata");
      rootState = String(record(metadata.completionGuard, "installed guard metadata").state ?? "unknown");
      if (rootState === "passed" && provider.facts().audit != null) break;
      if (rootState === "error" || rootState === "capability-blocked") throw new Error(`Installed guard reached ${rootState}`);
      await Bun.sleep(100);
    }
    const facts = provider.facts();
    assert(rootState === "passed" && facts.audit != null, "Installed guard did not reach one passed audit");
    assert(facts.audit.requestBytes <= MAX_REQUEST_BYTES, "Installed long-root request exceeded the unchanged runtime limit");
    const children = await requestData<Array<Record<string, unknown>>>(client.session.children({ directory: project, sessionID: rootID }) as Promise<unknown>, "installed child readback");
    raw = {
      candidateId: options.candidateId,
      cleanup: "pending",
      environment: {
        configDigest,
        executableSha256: installed.sha256,
        openCode: installed.version,
        platform: process.platform,
        runtimeSourceHashes: [
          "global/agents/session-completion-arbiter.md",
          "global/extensions/session-completion-guard/arbiter-evidence.ts",
          "global/extensions/session-completion-guard/controller.ts",
          "global/plugin/session-delivery-context/projection.ts",
        ].map((relative) => ({ path: relative, sha256: digest(path.join(options.runtimeSource, relative)) })),
      },
      mode: "installed",
      profile: { messageChars: options.messageChars, messageCount: options.messageCount },
      provider: { arbiterCalls: facts.arbiterCalls, externalCalls: 0, primaryCalls: facts.primaryCalls, result: facts.result },
      request: facts.audit,
      root: { childCount: children.length, rootRef: facts.audit.rootSessionRef, state: rootState },
      schemaVersion: 1,
    };
  } catch (error) {
    failure = error;
  } finally {
    if (client != null && rootID != null) {
      try {
        const children = await requestData<Array<Record<string, unknown>>>(client.session.children({ directory: project, sessionID: rootID }) as Promise<unknown>, "installed cleanup children");
        for (const child of children) await client.session.delete({ directory: project, sessionID: String(child.id) });
        await client.session.delete({ directory: project, sessionID: rootID });
      } catch (error) {
        failure ??= error;
      }
    }
    if (server != null) {
      try {
        await stopProofProcessTree(server.child);
      } catch (error) {
        failure ??= error;
      }
    }
    provider.server.stop(true);
    try {
      removeProofFixture(fixture);
    } catch (error) {
      failure ??= error;
    }
  }
  if (failure != null) {
    const serverLog = server == null
      ? ""
      : Buffer.concat([...server.stderr, ...server.stdout]).toString("utf8")
        .replaceAll(fixture, "<fixture>")
        .replaceAll(options.runtimeSource, "<runtime-source>")
        .split(/\r?\n/)
        .filter((line) => /error|fail|plugin|command/i.test(line))
        .slice(-40)
        .join("\n")
        .slice(-12_000);
    fs.mkdirSync(options.evidenceRoot, { recursive: false });
    writeNew(path.join(options.evidenceRoot, "failure.json"), {
      candidateId: options.candidateId,
      cleanup: fs.existsSync(fixture) ? "unknown" : "complete",
      error: failure instanceof Error ? failure.message : String(failure),
      errorFacts: proofErrorFacts(failure),
      mode: "installed",
      provider: provider.facts(),
      schemaVersion: 1,
      serverLog,
    });
    throw failure;
  }
  assert(raw != null && !fs.existsSync(fixture), "Installed proof cleanup must complete before evidence retention");
  raw.cleanup = "complete";
  writeCapture(options, raw);
}

async function runFixture(options: Options): Promise<void> {
  const fixtureRoot = fs.mkdtempSync(path.join(os.tmpdir(), "guard-long-run-reviewed-"));
  let raw: Record<string, unknown> | null = null;
  try {
    const rootID = "session_guard_reviewed_long_root";
    const dbPath = path.join(fixtureRoot, "opencode.db");
    createLongRootDatabase(dbPath, rootID);
    const fixture = reviewedLongRootFixture(readProjectionInChild(dbPath, rootID));
    assertReviewedCounts(fixture);
    const sourceDigestBefore = stableDigest(fixture);
    const revisionBase = {
      assistantRef: "none",
      diffDigest: stableDigest([]),
      humanRef: "none",
      journalDigest: stableDigest([]),
      leaseGeneration: 0,
      todoDigest: stableDigest([]),
    };
    const revision = { ...revisionBase, revisionDigest: stableDigest(revisionBase) };
    const epoch: AuditEpoch = {
      auditID: "audit_guard_reviewed_long_root",
      attempt: 0,
      childSessionID: null,
      completionEvidence: fixture,
      inspected: revision,
      kind: "completion",
      questionRequest: null,
      rootRef: hashRef("session", rootID),
      rootSessionID: rootID,
    };
    const inspection = {
      context: { assistantEvidence: [], background: [], humanMessages: [] },
      journal: {
        absolutePath: path.join(fixtureRoot, "history.md"),
        digest: revision.journalDigest,
        relativePath: "history.md",
        source: "docs_fallback" as const,
      },
      revision,
    };
    const first = buildArbiterAuditRequest(epoch, inspection, fixture);
    const second = buildArbiterAuditRequest(epoch, inspection, fixture);
    const exactRequestBytes = requireBoundedRequest(first, MAX_REQUEST_BYTES);
    const readback = readCandidateRequest(first);
    const matrix = candidateReadbackMatrix(fixture, readback.evidence, sourceDigestBefore);
    const controller = await proveCandidateController(fixtureRoot, fixture);
    raw = {
      candidateId: options.candidateId,
      candidate: {
        byteStable: first === second,
        contributions: requestContributions(first),
        evidenceSchemaVersion: readback.evidence.schemaVersion,
        exactRequestBytes,
        privateProjectionBytes: requestBytes(JSON.stringify(readback.evidence)),
        readbackMatrix: matrix,
        requestDigest: crypto.createHash("sha256").update(first).digest("hex"),
        requestSchemaVersion: readback.schemaVersion,
      },
      childCreates: 0,
      cleanup: "complete",
      controller,
      environment: { bun: Bun.version, platform: process.platform },
      fixture: {
        counts: reviewedCounts(fixture),
        projectionBytes: requestBytes(JSON.stringify(fixture)),
      },
      mode: "candidate",
      modelCalls: 0,
      schemaVersion: 1,
      sources: sourcePaths.map((relative) => ({ path: relative, sha256: digest(path.join(sourceRoot, relative)) })),
    };
  } finally {
    fs.rmSync(fixtureRoot, { recursive: true, force: true });
  }
  assert(raw != null && !fs.existsSync(fixtureRoot), "Reviewed fixture cleanup must complete before evidence retention");
  writeCapture(options, raw);
}

function runIncidents(options: Options): void {
  assert(options.databasePath != null, "Incident database path is missing");
  const database = new Database(options.databasePath, { readonly: true, strict: true });
  let queryOnly = false;
  let closed = false;
  let rows: Array<{ allowedBytes: number; id: string; requestBytes: number }> = [];
  try {
    database.exec("pragma query_only = on");
    queryOnly = record(database.query("pragma query_only").get(), "query_only").query_only === 1;
    rows = database.query(`
      select
        id,
        cast(json_extract(metadata, '$.completionGuard.auditDiagnostics.requestBytes') as integer) as requestBytes,
        cast(json_extract(metadata, '$.completionGuard.auditDiagnostics.allowedRequestBytes') as integer) as allowedBytes
      from session
      where parent_id is null
        and json_valid(metadata)
        and json_extract(metadata, '$.completionGuard.state') = 'error'
        and json_extract(metadata, '$.completionGuard.auditDiagnostics.errorClass') = 'input-state'
        and cast(json_extract(metadata, '$.completionGuard.auditDiagnostics.requestBytes') as integer)
          > cast(json_extract(metadata, '$.completionGuard.auditDiagnostics.allowedRequestBytes') as integer)
      order by requestBytes, id
    `).all() as Array<{ allowedBytes: number; id: string; requestBytes: number }>;
  } finally {
    database.close();
    closed = true;
  }
  const revisionBase = {
    assistantRef: "none",
    diffDigest: stableDigest([]),
    humanRef: "none",
    journalDigest: stableDigest([]),
    leaseGeneration: 0,
    todoDigest: stableDigest([]),
  };
  const revision = { ...revisionBase, revisionDigest: stableDigest(revisionBase) };
  const observations = rows.map((row, index) => {
    const sessionRef = hashRef("session", row.id);
    const completionEvidence = readSessionDeliveryContext({
      dbPaths: [options.databasePath!],
      generatedAt: "2026-08-28T00:00:00.000Z",
      resolveRoot: true,
      sessionId: row.id,
      useDefaultPaths: false,
    });
    let candidateBytes: number | null = null;
    let disposition = "fit";
    try {
      candidateBytes = requestBytes(buildArbiterAuditRequest({
        auditID: `audit_incident_${index + 1}`,
        attempt: 0,
        childSessionID: null,
        completionEvidence,
        inspected: revision,
        kind: "completion",
        questionRequest: null,
        rootRef: sessionRef,
        rootSessionID: row.id,
      }, {
        context: { assistantEvidence: [], background: [], humanMessages: [] },
        journal: { absolutePath: "<private>", digest: revision.journalDigest, relativePath: null, source: "none" },
        revision,
      }, completionEvidence));
      if (candidateBytes > MAX_REQUEST_BYTES) disposition = "irreducible-critical-overflow";
    } catch (error) {
      if (error instanceof CanonicalEvidenceConflictError) disposition = "irreducible-critical-conflict";
      else throw error;
    }
    return {
      allowedBytes: row.allowedBytes,
      candidateBytes,
      disposition,
      member: `observed-overflow-${String(index + 1).padStart(2, "0")}`,
      requestBytes: row.requestBytes,
      sessionRef,
    };
  });
  const raw: Record<string, unknown> = {
    candidateId: options.candidateId,
    childCreates: 0,
    cleanup: "complete",
    mode: "incidents",
    modelCalls: 0,
    observations,
    privacyScan: {
      databasePathRetained: false,
      metadataTextRetained: false,
      rawSessionIdsRetained: false,
    },
    query: { closed, queryOnly, writes: 0 },
    schemaVersion: 1,
    sourceDigest: crypto.createHash("sha256").update(sourcePaths.map((relative) => digest(path.join(sourceRoot, relative))).join("\n")).digest("hex"),
    summary: {
      allowedBytes: [...new Set(observations.map((row) => row.allowedBytes))],
      incidentCount: observations.length,
      maxCandidateBytes: Math.max(...observations.map((row) => row.candidateBytes ?? 0)),
      maxRequestBytes: Math.max(...observations.map((row) => row.requestBytes)),
      minCandidateBytes: Math.min(...observations.flatMap((row) => row.candidateBytes == null ? [] : [row.candidateBytes])),
      minRequestBytes: Math.min(...observations.map((row) => row.requestBytes)),
    },
  };
  const serialized = JSON.stringify(raw);
  assert(!serialized.includes(options.databasePath), "Incident output must not retain the database path");
  assert(rows.every((row) => !serialized.includes(row.id)), "Incident output must not retain raw session ids");
  writeCapture(options, raw);
}

function runReplay(options: Options): void {
  assert(options.inputPath != null, "Replay input path is missing");
  if (fs.existsSync(options.evidenceRoot)) throw new Error("Evidence root already exists");
  const raw = JSON.parse(fs.readFileSync(options.inputPath, "utf8")) as unknown;
  const source = record(raw, "raw evidence");
  assert(source.candidateId === options.candidateId, "Replay candidateId must match preserved raw evidence");
  fs.mkdirSync(options.evidenceRoot, { recursive: false });
  writeNew(path.join(options.evidenceRoot, "evaluation.json"), {
    ...evaluateRaw(raw),
    rawDigest: digest(options.inputPath),
    replay: true,
  });
  console.log(json({ candidateId: options.candidateId, evidenceRoot: "<evidence-root>", mode: options.mode, status: "complete" }).trimEnd());
}

async function run(options: Options): Promise<void> {
  if (fs.existsSync(options.evidenceRoot)) throw new Error("Evidence root already exists");
  const fixture = fs.mkdtempSync(path.join(os.tmpdir(), "guard-long-run-proof-"));
  let cleanup = "pending";
  try {
    const rootID = "session_guard_long_root";
    const dbPath = path.join(fixture, "opencode.db");
    createLongRootDatabase(dbPath, rootID);
    const projection = readProjectionInChild(dbPath, rootID);
    const surfaces = new Set(projection.truncationWarnings.map((entry) => entry.surface));
    for (const expected of ["humanMessages", "humanMessages.text", "permissionReplies", "questionReplies", "todos.current", "toolEvidence"]) {
      assert(surfaces.has(expected), `Long-root projection missing truncation fact for ${expected}`);
    }
    assert(projection.humanMessages.length === 32, "Human messages must retain a bounded edge subset");
    assert(projection.todos.current.length === 64, "Current todos must retain a bounded edge subset");
    assert(projection.questionReplies.length === 32 && projection.permissionReplies.length === 32, "Question/permission events must be bounded");
    const projectionBytes = Buffer.byteLength(JSON.stringify(projection), "utf8");
    const overflow = await proveOverflow(fixture, projection, 1_024);
    const retention = await proveRetention(fixture);
    const failureClasses = await proveFailureClasses(fixture);
    const duplicateRetryChildren = await proveDuplicateRetryChildren(fixture);
    const taskFallback = await proveTaskFallback(fixture);
    const waitExhaustion = await proveWaitExhaustion(fixture);
    fs.mkdirSync(options.evidenceRoot, { recursive: false });
    writeNew(path.join(options.evidenceRoot, "raw.json"), {
      candidateId: options.candidateId,
      environment: { bun: Bun.version, platform: process.platform },
      overflow,
      failureClasses,
      duplicateRetryChildren,
      projection: {
        counts: projection.session?.counts,
        outputBytes: projectionBytes,
        retained: {
          humanMessages: projection.humanMessages.length,
          permissionReplies: projection.permissionReplies.length,
          questionReplies: projection.questionReplies.length,
          todos: projection.todos.current.length,
          toolEvidence: projection.toolEvidence.length,
        },
        truncationWarnings: projection.truncationWarnings,
      },
      retention,
      taskFallback,
      waitExhaustion,
      schemaVersion: 1,
      sources: sourcePaths.map((relative) => ({ path: relative, sha256: digest(path.join(sourceRoot, relative)) })),
    });
    writeNew(path.join(options.evidenceRoot, "evaluation.json"), {
      candidateId: options.candidateId,
      cleanup,
      noPromptOnOverflow: overflow.promptCalls === 0,
      failureClassesBounded: true,
      projectionBounded: true,
      retainedChildPolicy: "oldest-idle-terminal-only",
      restartConflictPolicy: "duplicate-retrying-children-blocked",
      schemaVersion: 1,
      status: "complete",
      taskFallback: "exactly-once-disable-safe",
      waitRechecks: "finite-terminal-exhaustion",
    });
  } finally {
    fs.rmSync(fixture, { recursive: true, force: true });
    cleanup = "complete";
  }
  const evaluationPath = path.join(options.evidenceRoot, "evaluation.json");
  const evaluation = JSON.parse(fs.readFileSync(evaluationPath, "utf8")) as Record<string, unknown>;
  evaluation.cleanup = cleanup;
  fs.writeFileSync(evaluationPath, json(evaluation), "utf8");
  console.log(json({ candidateId: options.candidateId, evidenceRoot: "<evidence-root>", status: "complete" }).trimEnd());
}

if (process.argv[2] === "--help" || process.argv[2] === "-h") {
  process.stdout.write(HELP);
} else if (process.argv[2] === "--internal-project") {
  const dbPath = process.argv[3];
  const rootID = process.argv[4];
  if (dbPath == null || rootID == null) throw new Error("Internal projection arguments missing");
  process.stdout.write(json(readSessionDeliveryContext({
    dbPaths: [dbPath],
    generatedAt: "2026-08-13T00:00:00.000Z",
    resolveRoot: true,
    sessionId: rootID,
    useDefaultPaths: false,
  })));
} else {
  const options = parseArgs(process.argv.slice(2));
  const result = options.mode === "fixture"
    ? runFixture(options)
    : options.mode === "incidents"
      ? Promise.resolve(runIncidents(options))
      : options.mode === "installed"
        ? runInstalled(options)
      : options.mode === "replay"
        ? Promise.resolve(runReplay(options))
        : run(options);
  result.catch((error) => {
    console.error(json({ error: error instanceof Error ? error.message : String(error), status: "blocked" }).trimEnd());
    process.exitCode = 1;
  });
}
