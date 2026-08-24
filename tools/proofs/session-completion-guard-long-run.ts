#!/usr/bin/env bun
import crypto from "node:crypto";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Database } from "bun:sqlite";
import type { Session } from "../../global/node_modules/@opencode-ai/sdk/dist/v2/index.js";
import { ensureArbiterChild } from "../../global/extensions/session-completion-guard/arbiter-child.ts";
import { SessionCompletionController } from "../../global/extensions/session-completion-guard/controller.ts";
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
import { hashRef, readSessionDeliveryContext } from "../../global/plugin/session-delivery-context/index.ts";

type Options = { candidateId: string; evidenceRoot: string };

const sourceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const runnerPath = fileURLToPath(import.meta.url);
const sourcePaths = [
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
] as const;

function requiredValue(args: string[], index: number, option: string): string {
  const value = args[index + 1];
  if (value == null || value.trim() === "" || value.startsWith("--")) throw new Error(`Missing value for ${option}`);
  return value;
}

function parseArgs(args: string[]): Options {
  let candidateId = "";
  let evidenceRoot = "";
  for (let index = 0; index < args.length; index++) {
    const arg = args[index];
    if (arg === "--candidate-id") {
      candidateId = requiredValue(args, index, arg);
      index++;
    } else if (arg === "--evidence-root") {
      evidenceRoot = requiredValue(args, index, arg);
      index++;
    } else {
      throw new Error(`Unknown option: ${arg}`);
    }
  }
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]{0,99}$/.test(candidateId)) throw new Error("--candidate-id must be a safe identifier");
  if (!path.isAbsolute(evidenceRoot)) throw new Error("--evidence-root must be absolute");
  return { candidateId, evidenceRoot: path.resolve(evidenceRoot) };
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

async function proveOverflow(directory: string, completionEvidence: ReturnType<typeof readSessionDeliveryContext>) {
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
    { auditWindow: { enabled: false }, maxRequestBytes: 1_024, maxRetryAttempts: 2, statusToasts: false },
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
      allowedRequestBytes: 1_024,
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
  const probe = controller as unknown as {
    roots: Map<string, RootState>;
    runAudit(state: RootState, inspection: unknown, epoch: AuditEpoch): Promise<void>;
  };
  probe.roots.set(rootID, state);
  await probe.runAudit(state, {
    context: { assistantEvidence: [], background: [], humanMessages: [] },
    journal: { digest: revision.journalDigest, relativePath: null, source: "none" },
    revision,
  }, epoch);
  assert(promptCalls === 0 && childCreates === 0, "Overflow must stop before child creation or model prompt");
  assert(state.state === "error" && state.activeAudit == null, "Overflow must leave a terminal error state");
  assert(state.auditDiagnostics.errorClass === "input-state", "Overflow must be classified as terminal input-state");
  assert((state.auditDiagnostics.requestBytes ?? 0) > 1_024, "Overflow must preserve observed request bytes");
  return {
    childCreates,
    errorClass: state.auditDiagnostics.errorClass,
    observedBytes: state.auditDiagnostics.requestBytes,
    promptCalls,
    stoppedLog: logs.some((entry) => entry.message === "completion audit stopped"),
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
    completionEvidence: { schemaVersion: 2, session: { sessionRef: rootRef } } as never,
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
  const root = session(rootID, directory, undefined, 0, { completionGuard: { grindEnabled: true } });
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
    const overflow = await proveOverflow(fixture, projection);
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

if (process.argv[2] === "--internal-project") {
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
} else run(parseArgs(process.argv.slice(2))).catch((error) => {
  console.error(json({ error: error instanceof Error ? error.message : String(error), status: "blocked" }).trimEnd());
  process.exitCode = 1;
});
