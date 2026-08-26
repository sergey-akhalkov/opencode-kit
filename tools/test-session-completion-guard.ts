#!/usr/bin/env node
/**
 * Critical regression oracles for session-completion-guard pure modules.
 * Exercises lease preflight, verdict correlation, stop detection, synthetic
 * continuation provenance, grind opt-in defaults, disable late-effect gates,
 * and permission precedence without model/server I/O.
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { PTYSessionInfo } from "opencode-pty/plugin/pty/types";
import type { Session } from "@opencode-ai/sdk/v2";
import { AsyncLeaseRegistry } from "../global/extensions/session-completion-guard/leases.ts";
import {
  isExplicitHumanStop,
  isGuardSyntheticPart,
  syntheticAsyncMarker,
} from "../global/extensions/session-completion-guard/control.ts";
import {
  configureGrindCommands,
  grindControlAction,
  grindControlPart,
} from "../global/extensions/session-completion-guard/grind-control.ts";
import type { RootInspection } from "../global/extensions/session-completion-guard/inspection.ts";
import { PtyFallbackScheduler } from "../global/extensions/session-completion-guard/pty-fallback.ts";
import { ensureArbiterChild } from "../global/extensions/session-completion-guard/arbiter-child.ts";
import {
  buildArbiterAuditRequest,
  captureArbiterEvidence,
  requireBoundedRequest,
} from "../global/extensions/session-completion-guard/arbiter-evidence.ts";
import {
  configuredPermissionClass,
  initialRootState,
  parseGuardOptions,
} from "../global/extensions/session-completion-guard/runtime-support.ts";
import { GuardAuditMonitorLauncher } from "../global/extensions/session-completion-guard/audit-monitor.ts";
import { GuardStatusReporter, STATUS_CONVERGENCE_PASSES } from "../global/extensions/session-completion-guard/status.ts";
import { ArbiterScheduler } from "../global/extensions/session-completion-guard/arbiter-scheduler.ts";
import { normalizeQuestionRequest } from "../global/extensions/session-completion-guard/question.ts";
import {
  buildContinuation,
  parseCompletionVerdict,
  parseCompletionVerdictText,
} from "../global/extensions/session-completion-guard/verdict.ts";
import type { AuditEpoch, CompletionVerdict, RootState } from "../global/extensions/session-completion-guard/types.ts";
import { hashRef } from "../global/plugin/session-delivery-context/redaction.ts";
import {
  createTerminalCertificateChallenge,
  evaluateTerminalCertificate,
  ROADMAP_MISSION_CERTIFICATE_ISSUER,
} from "../global/extensions/session-completion-guard/terminal-certificate.ts";
import {
  readClaimEvidence,
  terminalClaimBindings,
} from "../global/extensions/session-completion-guard/claim-evidence.ts";

const RUNAUDIT_DISABLE_ORACLE_FLAG = "--oracle-runaudit-disable-race";
const QUESTION_REPLY_DISABLE_ORACLE_FLAG = "--oracle-question-reply-disable-race";
const RETRY_PROMPT_AMPLIFICATION_ORACLE_FLAG = "--oracle-retry-prompt-amplification";
const TERMINAL_CERTIFICATE_RECHECK_ORACLE_FLAG = "--oracle-terminal-certificate-recheck";
const isBunRuntime = typeof (globalThis as { Bun?: unknown }).Bun !== "undefined";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function writeMinimalSessionDatabase(
  dbPath: string,
  rootSessionID: string,
  assistantMessages = 0,
): Promise<void> {
  // Bun cannot resolve node:sqlite; Node cannot use bun:sqlite. Keep creation runtime-local.
  if (isBunRuntime) {
    const sqlite = await import("bun:sqlite") as {
      Database: new (filename: string) => {
        close(): void;
        exec(sql: string): void;
        run(sql: string, ...params: unknown[]): void;
      };
    };
    const db = new sqlite.Database(dbPath);
    try {
      db.exec("create table session (id text primary key);");
      db.run("insert into session (id) values (?)", rootSessionID);
      if (assistantMessages > 0) {
        db.exec("create table message (id text primary key, session_id text not null, time_created integer, data text);");
        db.exec("create table part (id text primary key, message_id text not null, session_id text not null, time_created integer, data text);");
        for (let index = 0; index < assistantMessages; index += 1) {
          const messageID = `message_assistant_${index}`;
          db.run("insert into message (id, session_id, time_created, data) values (?, ?, ?, ?)", messageID, rootSessionID, index + 1, JSON.stringify({ role: "assistant" }));
          db.run("insert into part (id, message_id, session_id, time_created, data) values (?, ?, ?, ?, ?)", `part_assistant_${index}`, messageID, rootSessionID, index + 1, JSON.stringify({ type: "text", text: `completed step ${index + 1}` }));
        }
      }
    } finally {
      db.close();
    }
    return;
  }
  const sqlite = await import("node:sqlite") as {
    DatabaseSync: new (filename: string) => {
      close(): void;
      exec(sql: string): void;
      prepare(sql: string): { run(...params: unknown[]): unknown };
    };
  };
  const db = new sqlite.DatabaseSync(dbPath);
  try {
    db.exec("create table session (id text primary key);");
    db.prepare("insert into session (id) values (?)").run(rootSessionID);
    if (assistantMessages > 0) {
      db.exec("create table message (id text primary key, session_id text not null, time_created integer, data text);");
      db.exec("create table part (id text primary key, message_id text not null, session_id text not null, time_created integer, data text);");
      const insertMessage = db.prepare("insert into message (id, session_id, time_created, data) values (?, ?, ?, ?)");
      const insertPart = db.prepare("insert into part (id, message_id, session_id, time_created, data) values (?, ?, ?, ?, ?)");
      for (let index = 0; index < assistantMessages; index += 1) {
        const messageID = `message_assistant_${index}`;
        insertMessage.run(messageID, rootSessionID, index + 1, JSON.stringify({ role: "assistant" }));
        insertPart.run(`part_assistant_${index}`, messageID, rootSessionID, index + 1, JSON.stringify({ type: "text", text: `completed step ${index + 1}` }));
      }
    }
  } finally {
    db.close();
  }
}

function sessionFixture(overrides: Record<string, unknown> = {}): Session {
  return {
    id: "session_root_fixture",
    projectID: "proj_fixture",
    directory: ".",
    title: "fixture",
    version: "1",
    time: { created: 0, updated: 0 },
    ...overrides,
  } as Session;
}

type TestCase = {
  name: string;
  run: () => void | Promise<void>;
};

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

function assertThrows(run: () => unknown, expected: string, message: string): void {
  try {
    run();
  } catch (error) {
    const text = error instanceof Error ? error.message : String(error);
    assert(text.includes(expected), `${message}\nExpected error containing: ${expected}\nActual: ${text}`);
    return;
  }
  throw new Error(`${message}\nExpected throw containing: ${expected}`);
}

function ptyInfo(partial: Partial<PTYSessionInfo> & Pick<PTYSessionInfo, "id" | "status">): PTYSessionInfo {
  return {
    title: partial.title ?? "fixture",
    command: partial.command ?? "sleep",
    args: partial.args ?? ["1"],
    workdir: partial.workdir ?? ".",
    notifyOnExit: partial.notifyOnExit ?? true,
    timedOut: partial.timedOut ?? false,
    pid: partial.pid ?? 1,
    createdAt: partial.createdAt ?? new Date(0).toISOString(),
    lineCount: partial.lineCount ?? 0,
    ...partial,
  };
}

function epoch(overrides: Partial<AuditEpoch> = {}): AuditEpoch {
  return {
    auditID: "audit_fixture_1",
    attempt: 0,
    childSessionID: null,
    completionEvidence: null,
    inspected: {
      assistantRef: "assistant_1",
      diffDigest: "diff_1",
      humanRef: "human_1",
      journalDigest: "journal_1",
      leaseGeneration: 1,
      revisionDigest: "revision_1",
      todoDigest: "todo_1",
    },
    kind: "completion",
    questionRequest: null,
    rootRef: "session_abcdef123456",
    rootSessionID: "session_root_secret",
    ...overrides,
  };
}

type RetentionStatusResult = { data: Record<string, { type: string }> } | { error: { name: string; message: string } };

async function runInterruptedRetention(options: {
  childSessionID?: string | null;
  firstUpdatedOffsetMs: number;
  secondUpdatedOffsetMs: number;
  statusForCall: (call: number, childIDs: { first: string; second: string }) => RetentionStatusResult;
}): Promise<{
  created: string[];
  deleted: string[];
  error: string | null;
  firstPresent: boolean;
  firstStatus: unknown;
  secondPresent: boolean;
  secondStatus: unknown;
  unrelatedPresent: boolean;
  updates: Array<{ id: string; status: unknown }>;
  wrongOwnerPresent: boolean;
  wrongOwnerStatus: unknown;
}> {
  const rootID = "session_root_retention";
  const rootRef = hashRef("session", rootID);
  const now = Date.now();
  const firstID = "session_child_retention_first";
  const secondID = "session_child_retention_second";
  const unrelatedID = "session_child_retention_unrelated";
  const wrongOwnerID = "session_child_retention_wrong_owner";
  const createdID = "session_child_retention_created";
  const guardMeta = (auditID: string, ref = rootRef) => ({
    completionGuard: { auditID, rootSessionRef: ref, status: "auditing" },
  });
  const child = (id: string, offsetMs: number, metadata?: Session["metadata"]): Session =>
    sessionFixture({
      id,
      parentID: rootID,
      time: { created: now + offsetMs, updated: now + offsetMs },
      ...(metadata == null ? {} : { metadata }),
    });
  const first = child(firstID, options.firstUpdatedOffsetMs, guardMeta("audit_retention_first"));
  const second = child(secondID, options.secondUpdatedOffsetMs, guardMeta("audit_retention_second"));
  const unrelated = child(unrelatedID, -130_000);
  const wrongOwner = child(wrongOwnerID, -130_000, guardMeta("audit_wrong", "session_wrong_owner"));
  const values = new Map<string, Session>([first, second, unrelated, wrongOwner].map((value) => [value.id, value]));
  const created: string[] = [];
  const deleted: string[] = [];
  const updates: Array<{ id: string; status: unknown }> = [];
  let statusCalls = 0;
  const client = {
    tool: { ids: async () => ({ data: ["read"] }) },
    v2: {
      agent: {
        list: async () => ({
          data: {
            data: [{
              id: "session-completion-arbiter",
              hidden: true,
              model: { providerID: "xai", id: "grok-4.6" },
            }],
          },
        }),
      },
    },
    provider: {
      list: async () => ({
        data: {
          all: [{ id: "xai", models: { "grok-4.6": { id: "grok-4.6" } } }],
          connected: ["xai"],
        },
      }),
    },
    session: {
      children: async () => ({
        data: [first, second, unrelated, wrongOwner].filter((value) => values.has(value.id)),
      }),
      get: async ({ sessionID }: { sessionID: string }) => {
        const current = values.get(sessionID);
        return current == null ? { error: { name: "NotFoundError" } } : { data: current };
      },
      status: async () => {
        statusCalls += 1;
        return options.statusForCall(statusCalls, { first: firstID, second: secondID });
      },
      update: async ({ sessionID, metadata }: { sessionID: string; metadata?: Session["metadata"] }) => {
        const current = values.get(sessionID);
        if (current == null) return { error: { name: "NotFoundError" } };
        const next = { ...current, metadata, time: { ...current.time, updated: Date.now() } };
        values.set(sessionID, next);
        updates.push({
          id: sessionID,
          status: (metadata as { completionGuard?: { status?: unknown } } | undefined)?.completionGuard?.status,
        });
        return { data: next };
      },
      delete: async ({ sessionID }: { sessionID: string }) => {
        deleted.push(sessionID);
        values.delete(sessionID);
        return { data: true };
      },
      create: async (args: { metadata?: Session["metadata"] }) => {
        created.push(createdID);
        const value = child(createdID, 0, args.metadata);
        values.set(createdID, value);
        return { data: value };
      },
    },
  };
  let error: string | null = null;
  try {
    await ensureArbiterChild(
      client as never,
      ".",
      "session-completion-arbiter",
      { ...initialRootState(sessionFixture({ id: rootID })), grindEnabled: true },
      epoch({
        auditID: "audit_retention_current",
        attempt: 1,
        childSessionID: options.childSessionID ?? null,
        rootRef,
        rootSessionID: rootID,
      }),
      2,
      120_000,
    );
  } catch (cause) {
    error = cause instanceof Error ? cause.message : String(cause);
  }
  const statusOf = (id: string): unknown =>
    (values.get(id)?.metadata as { completionGuard?: { status?: unknown } } | undefined)?.completionGuard?.status ?? null;
  return {
    created,
    deleted,
    error,
    firstPresent: values.has(firstID),
    firstStatus: statusOf(firstID),
    secondPresent: values.has(secondID),
    secondStatus: statusOf(secondID),
    unrelatedPresent: values.has(unrelatedID),
    updates,
    wrongOwnerPresent: values.has(wrongOwnerID),
    wrongOwnerStatus: statusOf(wrongOwnerID),
  };
}

async function runRouteSettle(options: {
  abortMs?: number;
  holdLookups?: boolean;
  readyAfterLookups: number;
  releaseHeldAfter?: "abort" | "settle";
}): Promise<{
  created: number;
  elapsedMs: number;
  error: Error | null;
  lookups: number;
  tools: Record<string, boolean> | null;
}> {
  const rootID = "session_root_route_settle";
  const abort = new AbortController();
  let lookups = 0;
  let created = 0;
  let releaseHeldLookups = () => {};
  const heldLookups = options.holdLookups === true
    ? new Promise<void>((resolve) => {
      releaseHeldLookups = resolve;
    })
    : Promise.resolve();
  const readyAgent = {
    hidden: true,
    id: "session-completion-arbiter",
    model: { id: "grok-4.6", providerID: "xai" },
  };
  const client = {
    provider: {
      list: async () => ({
        data: {
          all: [{ id: "xai", models: { "grok-4.6": { id: "grok-4.6" } } }],
          connected: ["xai"],
        },
      }),
    },
    session: {
      children: async () => ({ data: [] }),
      create: async () => {
        created += 1;
        return { data: sessionFixture({ id: "session_child_route_settle", parentID: rootID }) };
      },
      delete: async () => ({ data: true }),
      get: async () => ({ error: { name: "NotFoundError" } }),
      status: async () => ({ data: {} }),
      update: async () => ({ error: { name: "NotFoundError" } }),
    },
    tool: {
      ids: async () => {
        lookups += 1;
        await heldLookups;
        return { data: ["read", "edit", "bash"] };
      },
    },
    v2: {
      agent: {
        list: async () => ({
          data: { data: lookups >= options.readyAfterLookups ? [readyAgent] : [] },
        }),
      },
    },
  };
  const started = Date.now();
  if (options.releaseHeldAfter === "abort") {
    abort.signal.addEventListener("abort", () => {
      setTimeout(releaseHeldLookups, 5);
    }, { once: true });
  }
  if (options.abortMs != null) setTimeout(() => abort.abort(), options.abortMs);
  let error: Error | null = null;
  let tools: Record<string, boolean> | null = null;
  try {
    const result = await ensureArbiterChild(
      client as never,
      ".",
      "session-completion-arbiter",
      { ...initialRootState(sessionFixture({ id: rootID })), auditAbort: abort, grindEnabled: true },
      epoch({
        auditID: "audit_route_settle",
        childSessionID: null,
        rootRef: hashRef("session", rootID),
        rootSessionID: rootID,
      }),
      2,
    );
    tools = result.route.tools;
  } catch (cause) {
    error = cause instanceof Error ? cause : new Error(String(cause));
  }
  if (options.releaseHeldAfter === "settle") {
    releaseHeldLookups();
    await sleep(30);
  }
  return { created, elapsedMs: Date.now() - started, error, lookups, tools };
}

function validVerdict(overrides: Partial<CompletionVerdict> = {}): CompletionVerdict {
  return {
    auditID: "audit_fixture_1",
    claimMatrix: [],
    confidence: "high",
    evidenceGaps: [],
    evidenceRefs: ["evidence_1"],
    goalSummary: "Complete the accepted task",
    inspectedRevision: "revision_1",
    ownerBoundary: null,
    questionAnswers: null,
    requirementMatrix: [{
      evidenceRefs: ["evidence_1"],
      requirementRef: "req_1",
      status: "unresolved",
    }],
    rootSessionRef: "session_abcdef123456",
    schemaVersion: 1,
    strategyAssessment: {
      fingerprint: "fp_1",
      prohibitedStrategies: [],
      repeated: false,
      requiredRetryEvidence: [],
    },
    unresolved: [{
      evidenceGap: "missing proof",
      nextAction: "run proof",
      nextEvidence: "green proof",
      requirementRef: "req_1",
      stopCondition: "proof green",
    }],
    verdict: "continue",
    ...overrides,
  };
}

function claimRecord(input: {
  candidateId?: string;
  claimId: string;
  disposition?: "blocked" | "supported";
  members?: string[];
}): Record<string, unknown> {
  const candidateId = input.candidateId ?? "candidate-current";
  const members = input.members ?? ["member-1"];
  const broad = members.length > 1;
  const disposition = input.disposition ?? "supported";
  const observedMembers = disposition === "supported" ? members : members.slice(0, 1);
  return {
    candidateId,
    claimClass: broad ? "finite-population" : "exact-case",
    claimId: input.claimId,
    coverageBasis: broad ? "finite-population" : "exact-case",
    disposition,
    environmentId: "environment-current",
    evidenceRefs: ["product"],
    independentChallenge: broad
      ? { evidenceRefs: [], required: true, status: "missing" }
      : { evidenceRefs: [], required: false, status: "not-required" },
    materialExclusions: [],
    maximumSupportedClaim: broad ? `Only ${members[0]} is supported.` : `Exact ${members[0]} only.`,
    narrowingAccepted: false,
    observationBoundary: "result-boundary",
    observations: observedMembers.map((memberId) => ({
      candidateId,
      environmentId: "environment-current",
      evidenceRefs: ["product"],
      memberId,
      observationBoundary: "result-boundary",
      paths: { baseline: null, candidate: null, production: "production-path" },
      status: "supported",
      terminal: true,
      unresolvedObservations: [],
    })),
    outcomeRef: `outcome:${input.claimId}`,
    paths: { baseline: null, candidate: null, production: "production-path" },
    population: {
      id: `population-${input.claimId.toLowerCase()}`,
      materialClasses: [],
      members,
      partitionRule: null,
      residualSpace: null,
    },
    realOracle: { evidenceRefs: [], required: false, status: "not-required" },
    statement: `Claim ${input.claimId}`,
    unknowns: [],
  };
}

function writeClaimIndex(root: string, changeId: string, claims: Record<string, unknown>[]): void {
  const changeRoot = path.join(root, "openspec", "changes", changeId);
  fs.mkdirSync(changeRoot, { recursive: true });
  fs.writeFileSync(path.join(changeRoot, "evidence-index.json"), JSON.stringify({
    candidateId: "candidate-current",
    changeId,
    claims,
    environmentId: "environment-current",
    lanes: [{ files: [], kind: "terminal", name: "product" }],
    retention: { exception: null, maxBytes: 25 * 1024 * 1024, maxFiles: 64 },
    schemaVersion: 2,
    tasks: [],
  }));
}

function claimMatrixRow(
  claim: ReturnType<typeof readClaimEvidence>["claims"][number],
): NonNullable<CompletionVerdict["claimMatrix"]>[number] {
  return {
    claimId: claim.claimId,
    closureState: claim.closureState,
    evidenceRefs: claim.evidenceRefs,
    maximumSupportedClaim: claim.maximumSupportedClaim,
    outcomeRef: claim.outcomeRef,
  };
}

const tests: TestCase[] = [
  {
    name: "critical: standalone plugin factories resolve before installed project bootstrap",
    run: () => {
      const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
      const script = [
        "import completionGuardPlugin from './global/extensions/session-completion-guard.ts';",
        "import ptyBridgePlugin from './global/extensions/opencode-pty-bridge.ts';",
        "const directory = process.cwd();",
        "const input = { client: { _client: {} }, directory, project: { id: 'project_factory_preflight' }, serverUrl: new URL('http://127.0.0.1:1'), worktree: directory };",
        "const bridge = await ptyBridgePlugin.server(input);",
        "const guard = await completionGuardPlugin.server(input, { auditWindow: { enabled: false, mode: 'read-only-monitor', scope: 'per-root', terminal: 'powershell-shell' }, enabled: true, statusToasts: false });",
        "await guard.dispose?.();",
        "console.log(JSON.stringify({ bridge: typeof bridge === 'object', guard: typeof guard.event === 'function' && typeof guard.config === 'function' }));",
      ].join("\n");
      const child = spawnSync("bun", ["-e", script], { cwd: repoRoot, encoding: "utf8", timeout: 15_000 });
      assert(child.status === 0, child.stderr || child.stdout || "Plugin factory subprocess failed.");
      const facts = JSON.parse(child.stdout.trim()) as { bridge?: boolean; guard?: boolean };
      assert(facts.bridge === true && facts.guard === true, "Both standalone plugin factories must return hooks.");
    },
  },
  {
    name: "critical: awaited running PTY suppresses audit preflight as waiting",
    run: () => {
      const generations: string[] = [];
      const leases = new AsyncLeaseRegistry({
        onGeneration: (root) => generations.push(root),
        onTerminalPty: () => { /* ignore */ },
      });
      const root = "session_root_pty";
      leases.beforeTool("pty_spawn", root, "call_1", { notifyOnExit: true });
      leases.afterTool(
        "pty_spawn",
        root,
        "call_1",
        "Spawned PTY ID: pty_abc123",
        { id: "pty_abc123" },
        () => ptyInfo({ id: "pty_abc123", status: "running", notifyOnExit: true }),
      );
      const result = leases.preflight(root, [ptyInfo({ id: "pty_abc123", status: "running", notifyOnExit: true })], []);
      assert(result.kind === "waiting", `Expected waiting preflight, got ${JSON.stringify(result)}`);
      assert(result.reason.includes("awaited PTY is active"), `Unexpected waiting reason: ${result.reason}`);
      assert(generations.includes(root), "PTY spawn must advance lease generation.");
    },
  },
  {
    name: "critical: unknown awaited PTY status fails closed without clear preflight",
    run: () => {
      const leases = new AsyncLeaseRegistry({
        onGeneration: () => { /* ignore */ },
        onTerminalPty: () => { /* ignore */ },
      });
      const root = "session_root_unknown";
      leases.beforeTool("pty_spawn", root, "call_u", { notifyOnExit: true });
      leases.afterTool("pty_spawn", root, "call_u", "Spawned PTY ID: pty_unknown1", { id: "pty_unknown1" }, () => null);
      const result = leases.preflight(root, [], []);
      assert(result.kind === "unknown", `Expected unknown preflight, got ${JSON.stringify(result)}`);
      assert(result.reason.includes("unknown"), `Unexpected unknown reason: ${result.reason}`);
    },
  },
  {
    name: "critical: terminal tombstone closes later correlated spawn without reopening as running",
    run: () => {
      const terminal: Array<{ root: string; ptyID: string }> = [];
      const leases = new AsyncLeaseRegistry({
        onGeneration: () => { /* ignore */ },
        onTerminalPty: (root, lease) => terminal.push({ root, ptyID: lease.ptyID }),
      });
      const root = "session_root_tombstone";
      const info = ptyInfo({ id: "pty_tomb_1", status: "exited", notifyOnExit: true, exitCode: 0 });
      leases.onManagerUpdate(info);
      leases.beforeTool("pty_spawn", root, "call_t", { notifyOnExit: true });
      leases.afterTool("pty_spawn", root, "call_t", "Spawned PTY ID: pty_tomb_1", { id: "pty_tomb_1" }, () => info);
      const lease = leases.getPtyLease("pty_tomb_1");
      assert(lease?.status === "exited", `Tombstone must force terminal status, got ${lease?.status}`);
      assert(terminal.some((entry) => entry.ptyID === "pty_tomb_1"), "Terminal tombstone must emit onTerminalPty for fallback scheduling.");
      const waiting = leases.preflight(root, [info], []);
      assert(waiting.kind === "waiting", "Exit notification must still be pending before synthetic consumption.");
      leases.consumeSynthetic(root, "<pty_exited>\nID: pty_tomb_1\n</pty_exited>");
      const clear = leases.preflight(root, [info], []);
      assert(clear.kind === "clear", `After exit consumption preflight must clear, got ${JSON.stringify(clear)}`);
    },
  },
  {
    name: "critical: background task lease waits until synthetic result is consumed",
    run: () => {
      const leases = new AsyncLeaseRegistry({
        onGeneration: () => { /* ignore */ },
        onTerminalPty: () => { /* ignore */ },
      });
      const root = "session_root_task";
      leases.beforeTool("task", root, "task_call_1", { description: "child work" });
      leases.afterTool(
        "task",
        root,
        "task_call_1",
        "background task started sessionID=session_child_1",
        { sessionID: "session_child_1" },
        () => null,
      );
      const running = leases.preflight(root, [], [{ id: "session_child_1", status: "running" }]);
      assert(running.kind === "waiting", `Running child must wait, got ${JSON.stringify(running)}`);
      const pending = leases.preflight(root, [], [{ id: "session_child_1", status: "idle" }]);
      assert(pending.kind === "waiting", `Unconsumed task result must wait, got ${JSON.stringify(pending)}`);
      assert(
        pending.reason.includes("background"),
        `Pending background lease must remain waiting until synthetic consumption, got ${pending.reason}`,
      );
      leases.consumeSynthetic(root, "<task_result sessionID=\"session_child_1\">done</task_result>");
      const clear = leases.preflight(root, [], [{ id: "session_child_1", status: "idle" }]);
      assert(clear.kind === "clear", `Consumed task result must clear, got ${JSON.stringify(clear)}`);
    },
  },
  {
    name: "critical: unattributed running notifyOnExit PTY is unknown fail-closed",
    run: () => {
      const leases = new AsyncLeaseRegistry({
        onGeneration: () => { /* ignore */ },
        onTerminalPty: () => { /* ignore */ },
      });
      const result = leases.preflight(
        "session_root_unattr",
        [ptyInfo({ id: "pty_stranger", status: "running", notifyOnExit: true })],
        [],
      );
      assert(result.kind === "unknown", `Unattributed awaited PTY must be unknown, got ${JSON.stringify(result)}`);
    },
  },
  {
    name: "critical: malformed or fenced arbiter text never becomes a verdict",
    run: () => {
      const current = epoch();
      assertThrows(
        () => parseCompletionVerdictText([{ type: "text", text: "```json\n{\"schemaVersion\":1}\n```" }], current),
        "exact JSON object",
        "Fenced JSON must be rejected.",
      );
      assertThrows(
        () => parseCompletionVerdictText([{ type: "text", text: "looks complete" }], current),
        "exact JSON object",
        "Prose must be rejected.",
      );
      assertThrows(
        () => parseCompletionVerdictText([{ type: "text", text: "{not-json}" }], current),
        "malformed JSON",
        "Broken JSON object text must be rejected.",
      );
    },
  },
  {
    name: "critical: claim projection preserves closure and reports stale malformed oversized and truncated sources",
    run: () => {
      const root = fs.mkdtempSync(path.join(os.tmpdir(), "completion-claim-projection-"));
      try {
        writeClaimIndex(root, "supported", [claimRecord({ claimId: "CLAIM-EXACT" })]);
        writeClaimIndex(root, "stale", [claimRecord({ candidateId: "candidate-stale", claimId: "CLAIM-STALE" })]);
        const malformedRoot = path.join(root, "openspec", "changes", "malformed");
        fs.mkdirSync(malformedRoot, { recursive: true });
        fs.writeFileSync(path.join(malformedRoot, "evidence-index.json"), "{ malformed");
        const oversizedRoot = path.join(root, "openspec", "changes", "oversized");
        fs.mkdirSync(oversizedRoot, { recursive: true });
        fs.writeFileSync(path.join(oversizedRoot, "evidence-index.json"), "X".repeat(65_537));

        const supported = readClaimEvidence(root, ["supported"]);
        assert(supported.complete, `Supported exact projection must be complete: ${JSON.stringify(supported)}`);
        assert(supported.claims[0]?.closureState === "supported", "Exact matching claim must project as supported.");
        const stale = readClaimEvidence(root, ["stale"]);
        assert(stale.claims[0]?.closureState === "stale", "Stale candidate identity must remain explicit.");
        const malformed = readClaimEvidence(root, ["malformed"]);
        assert(
          !malformed.complete && malformed.omissions[0]?.code === "evidence-index-malformed",
          "Malformed selected closure must become an explicit omission.",
        );
        const oversized = readClaimEvidence(root, ["oversized"]);
        assert(
          !oversized.complete && oversized.omissions[0]?.code === "evidence-index-oversized",
          "Oversized selected closure must become an explicit omission.",
        );

        writeClaimIndex(root, "many-a", Array.from({ length: 17 }, (_, index) =>
          claimRecord({ claimId: `CLAIM-A-${String(index).padStart(2, "0")}` })
        ));
        writeClaimIndex(root, "many-b", Array.from({ length: 17 }, (_, index) =>
          claimRecord({ claimId: `CLAIM-B-${String(index).padStart(2, "0")}` })
        ));
        const truncated = readClaimEvidence(root, ["many-a", "many-b"]);
        assert(truncated.claims.length === 32, "Claim projection must retain its bounded record limit.");
        assert(
          !truncated.complete && truncated.omissions.some((entry) => entry.code === "claim-limit" && entry.omitted === 2),
          "Truncated claim projection must report the exact omitted count.",
        );
        const currentEpoch = epoch({
          completionEvidence: { claimEvidence: truncated, schemaVersion: 2 } as never,
        });
        const request = buildArbiterAuditRequest(
          currentEpoch,
          {
            context: { assistantEvidence: [], background: [], humanMessages: [] },
            journal: { digest: "journal", relativePath: "history.md", source: "openspec_history" },
            revision: currentEpoch.inspected,
          } as never,
          currentEpoch.completionEvidence!,
        );
        assert(
          request.includes('"claimEvidence"') && request.includes('"claim-limit"'),
          "Bounded arbiter request must retain claim records and omission metadata together.",
        );
        assertThrows(
          () => requireBoundedRequest(request, 1_024),
          "exceeds byte limit",
          "Oversized claim closure must fail before another required field is dropped.",
        );
      } finally {
        fs.rmSync(root, { force: true, recursive: true });
      }
    },
  },
  {
    name: "critical: claim verdicts preserve supplied ceilings and cannot stop on unsupported explicit closure",
    run: () => {
      const root = fs.mkdtempSync(path.join(os.tmpdir(), "completion-claim-verdict-"));
      try {
        writeClaimIndex(root, "blocked", [claimRecord({
          claimId: "CLAIM-BROAD",
          disposition: "blocked",
          members: ["member-1", "member-2"],
        })]);
        writeClaimIndex(root, "supported", [claimRecord({ claimId: "CLAIM-EXACT" })]);
        const blockedProjection = readClaimEvidence(root, ["blocked"]);
        const blockedEpoch = epoch({
          completionEvidence: { claimEvidence: blockedProjection, schemaVersion: 2 } as never,
        });
        const blockedRow = claimMatrixRow(blockedProjection.claims[0]);
        assert(
          terminalClaimBindings(blockedProjection).reason === "claim-closure-incomplete",
          "Blocked broad claim must force terminal certificates through model arbitration.",
        );
        const continued = parseCompletionVerdict(validVerdict({ claimMatrix: [blockedRow] }), blockedEpoch);
        assert(continued.verdict === "continue", "Representative-only broad claim must remain continuable.");
        assertThrows(
          () => parseCompletionVerdict(validVerdict({
            claimMatrix: [blockedRow],
            requirementMatrix: [{ evidenceRefs: [], requirementRef: "req_1", status: "complete" }],
            unresolved: [],
            verdict: "allow_stop",
          }), blockedEpoch),
          "unsupported claim closure",
          "Blocked broad claim must not become allow_stop.",
        );
        assertThrows(
          () => parseCompletionVerdict(validVerdict({
            claimMatrix: [{ ...blockedRow, maximumSupportedClaim: "All members are supported." }],
          }), blockedEpoch),
          "does not match supplied claim evidence",
          "Arbiter claim text must not widen the supplied ceiling.",
        );

        const supportedProjection = readClaimEvidence(root, ["supported"]);
        const supportedEpoch = epoch({
          completionEvidence: { claimEvidence: supportedProjection, schemaVersion: 2 } as never,
        });
        const supportedBindings = terminalClaimBindings(supportedProjection);
        assert(
          supportedBindings.reason == null && supportedBindings.acceptedClaimIds[0] === "CLAIM-EXACT",
          "Supported explicit claims must bind deterministic certificate identities.",
        );
        const stopped = parseCompletionVerdict(validVerdict({
          claimMatrix: [claimMatrixRow(supportedProjection.claims[0])],
          requirementMatrix: [{ evidenceRefs: ["product"], requirementRef: "req_1", status: "complete" }],
          unresolved: [],
          verdict: "allow_stop",
        }), supportedEpoch);
        assert(stopped.verdict === "allow_stop", "Supported exact claim may stop.");

        const incompleteEpoch = epoch({
          completionEvidence: {
            claimEvidence: {
              ...supportedProjection,
              complete: false,
              omissions: [{ changeRef: null, code: "claim-limit", detail: "truncated", omitted: 1 }],
            },
            schemaVersion: 2,
          } as never,
        });
        assertThrows(
          () => parseCompletionVerdict(validVerdict({
            claimMatrix: [claimMatrixRow(supportedProjection.claims[0])],
            requirementMatrix: [{ evidenceRefs: ["product"], requirementRef: "req_1", status: "complete" }],
            unresolved: [],
            verdict: "allow_stop",
          }), incompleteEpoch),
          "complete explicitly selected claim closure",
          "Truncated explicit closure must fail closed.",
        );
        assert(
          terminalClaimBindings(incompleteEpoch.completionEvidence!.claimEvidence).reason === "claim-closure-omitted",
          "Truncated closure must not enter deterministic certificate acceptance.",
        );
        const missingMatrix = validVerdict();
        delete (missingMatrix as { claimMatrix?: unknown }).claimMatrix;
        assertThrows(
          () => parseCompletionVerdict(missingMatrix, epoch()),
          "claimMatrix",
          "Arbiter verdict must always carry the structured claim matrix.",
        );
      } finally {
        fs.rmSync(root, { force: true, recursive: true });
      }
    },
  },
  {
    name: "critical: correlation-mismatched verdict is rejected with no apply path",
    run: () => {
      const current = epoch();
      const mismatched = validVerdict({ auditID: "audit_stale_other" });
      assertThrows(
        () => parseCompletionVerdict(mismatched, current),
        "correlation mismatch",
        "Stale audit id must fail closed.",
      );
      assertThrows(
        () => parseCompletionVerdict(validVerdict({ rootSessionRef: "session_otherref12" }), current),
        "correlation mismatch",
        "Root ref mismatch must fail closed.",
      );
      assertThrows(
        () => parseCompletionVerdict(validVerdict({ inspectedRevision: "revision_other" }), current),
        "correlation mismatch",
        "Revision mismatch must fail closed.",
      );
    },
  },
  {
    name: "critical: valid continue verdict builds synthetic non-human continuation",
    run: () => {
      const verdict = parseCompletionVerdict(validVerdict(), epoch());
      const continuation = buildContinuation(
        verdict,
        { agent: "build", model: { providerID: "xai", modelID: "grok-4.6" }, tools: null, variant: "high" },
        "docs/session-strategy-history/session_abcdef123456.md",
        false,
      );
      assert(continuation.part.synthetic === true, "Continuation part must be synthetic.");
      assert(continuation.part.type === "text", "Continuation must be a text part.");
      assert(continuation.part.text.includes("<completion_guard"), "Continuation must use completion_guard envelope.");
      assert(continuation.part.metadata?.provenance === "completion-guard", "Continuation metadata must mark completion-guard provenance.");
      assert(isGuardSyntheticPart(continuation.part as unknown as Record<string, unknown>), "Guard synthetic detector must accept built continuation.");
      assert(!continuation.part.text.includes("session_root_secret"), "Continuation must not leak raw root session id.");
    },
  },
  {
    name: "critical: continue without unresolved requirements is invalid",
    run: () => {
      assertThrows(
        () => parseCompletionVerdict(validVerdict({ unresolved: [], requirementMatrix: [{ evidenceRefs: [], requirementRef: "r", status: "complete" }], verdict: "continue" }), epoch()),
        "continue verdict requires at least one unresolved",
        "Empty continue payload must fail closed.",
      );
    },
  },
  {
    name: "critical: owner_required without ownerBoundary is invalid",
    run: () => {
      assertThrows(
        () => parseCompletionVerdict(validVerdict({
          verdict: "owner_required",
          ownerBoundary: null,
          unresolved: [],
          requirementMatrix: [{ evidenceRefs: [], requirementRef: "r", status: "owner_required" }],
        }), epoch()),
        "ownerBoundary",
        "owner_required must carry an exact boundary.",
      );
    },
  },
  {
    name: "critical: structured ownerBoundary object is canonical; string/legacy shapes fail closed",
    run: () => {
      // Live incident: arbiter returned schema-valid {decision,reason,evidenceRefs[]} while the
      // prior parser required a string, so owner_required retried with the question still open.
      const structured = {
        decision: "Owner must choose the protected action",
        reason: "The action requires owner authority",
        evidenceRefs: ["event_ref_1"],
      };
      const parsed = parseCompletionVerdict(validVerdict({
        verdict: "owner_required",
        ownerBoundary: structured as never,
        unresolved: [],
        requirementMatrix: [{ evidenceRefs: ["event_ref_1"], requirementRef: "r", status: "owner_required" }],
      }), epoch());
      assert(parsed.verdict === "owner_required", "Structured owner_required must parse.");
      assert(parsed.ownerBoundary?.decision === structured.decision, "decision must be preserved.");
      assert(parsed.ownerBoundary?.reason === structured.reason, "reason must be preserved.");
      assert(
        JSON.stringify(parsed.ownerBoundary?.evidenceRefs) === JSON.stringify(structured.evidenceRefs),
        "evidenceRefs must be preserved.",
      );

      // Text path must accept the same structured JSON the hidden arbiter emits.
      const fromText = parseCompletionVerdictText(
        [{ type: "text", text: JSON.stringify(validVerdict({
          verdict: "owner_required",
          ownerBoundary: structured as never,
          unresolved: [],
          requirementMatrix: [{ evidenceRefs: ["event_ref_1"], requirementRef: "r", status: "owner_required" }],
        })) }],
        epoch(),
      );
      assert(
        fromText.ownerBoundary?.decision === structured.decision,
        "JSON text path must accept structured ownerBoundary.",
      );

      // Prior string-only contract would accept this; current contract must reject it.
      assertThrows(
        () => parseCompletionVerdict(validVerdict({
          verdict: "owner_required",
          ownerBoundary: "Owner must choose the protected action" as never,
          unresolved: [],
          requirementMatrix: [{ evidenceRefs: [], requirementRef: "r", status: "owner_required" }],
        }), epoch()),
        "ownerBoundary",
        "String ownerBoundary must fail closed (no legacy string acceptance).",
      );
      assertThrows(
        () => parseCompletionVerdict(validVerdict({
          verdict: "owner_required",
          ownerBoundary: { decision: "x", reason: "", evidenceRefs: [] } as never,
          unresolved: [],
          requirementMatrix: [{ evidenceRefs: [], requirementRef: "r", status: "owner_required" }],
        }), epoch()),
        "ownerBoundary.reason",
        "Empty reason must fail validation.",
      );
      assertThrows(
        () => parseCompletionVerdict(validVerdict({
          verdict: "continue",
          ownerBoundary: structured as never,
        }), epoch()),
        "ownerBoundary",
        "Non-owner verdict must not carry ownerBoundary.",
      );
      assertThrows(
        () => parseCompletionVerdict(validVerdict({
          verdict: "allow_stop",
          unresolved: [],
          requirementMatrix: [{ evidenceRefs: ["e"], requirementRef: "r", status: "complete" }],
          ownerBoundary: structured as never,
        }), epoch()),
        "ownerBoundary",
        "allow_stop must require null ownerBoundary.",
      );
    },
  },
  {
    name: "critical: explicit English human stop wins; negated and quoted stop do not",
    run: () => {
      assert(isExplicitHumanStop("stop"), "Bare stop must suspend.");
      assert(isExplicitHumanStop("please stop working now"), "Directed stop must suspend.");
      assert(!isExplicitHumanStop("do not stop"), "Negated English stop must not suspend.");
      assert(!isExplicitHumanStop('the word "stop" means halt'), "Quoted discussion must not suspend.");
      assert(!isExplicitHumanStop("example: stop"), "Discussion/example nearby stop must not suspend.");
    },
  },
  {
    name: "critical: non-synthetic Russian stop/pause phrases must suspend the guard",
    run: () => {
      // JS \\b is ASCII-word only; Cyrillic stop tokens currently fail to match and leave the root unpaused.
      for (const phrase of ["стоп", "пауза", "остановись", "пожалуйста остановись", "приостанови", "хватит"]) {
        assert(
          isExplicitHumanStop(phrase),
          `Russian interrupt phrase must suspend guard: ${JSON.stringify(phrase)}`,
        );
      }
      assert(!isExplicitHumanStop("не останавливайся"), "Negated Russian stop must not suspend.");
      assert(!isExplicitHumanStop("не надо останавливаться"), "Negated Russian instruction must not suspend.");
    },
  },
  {
    name: "critical: synthetic PTY/task markers are classified and not human stop",
    run: () => {
      assert(syntheticAsyncMarker("<pty_exited>\nID: pty_1\n</pty_exited>") === "pty", "PTY exit marker must classify as pty.");
      assert(syntheticAsyncMarker("<task_result>ok</task_result>") === "task", "Task result marker must classify as task.");
      assert(syntheticAsyncMarker("please continue") == null, "Ordinary text must not be async marker.");
      assert(!isExplicitHumanStop("<pty_exited>\nID: pty_1\nstatus: exited\n</pty_exited>"), "Synthetic PTY exit text must not count as human stop.");
    },
  },
  {
    name: "critical: grind command config preserves main and specialist permission precedence",
    run: () => {
      const build = Object.freeze({ permission: "ask" as const });
      const arbiter = Object.freeze({
        permission: Object.freeze({ edit: "deny", task: "deny", question: "deny" }),
      });
      const sdet = Object.freeze({ permission: Object.freeze({ bash: "deny", edit: "ask" }) });
      const originalAgents = Object.freeze({
        build,
        "session-completion-arbiter": arbiter,
        "sdet-quality-engineer": sdet,
        unused: null,
      });
      const configuredPermission = Object.freeze({ bash: "ask" as const, edit: "deny" as const });
      const config: {
        permission?: unknown;
        agent?: Record<string, { permission?: unknown } | null | undefined>;
        command?: Record<string, unknown>;
      } = {
        permission: configuredPermission,
        agent: originalAgents,
        command: { existing: { description: "fixture", template: "fixture" } },
      };
      configureGrindCommands(config as never);
      assert(config.permission === configuredPermission, "Guard command setup must not replace merged main permissions.");
      assert(configuredPermissionClass(config.permission) === "mixed", "Mixed configured permissions must be diagnosed without disclosure.");
      assert(config.agent === originalAgents, "Guard command setup must not replace loaded agent config.");
      assert(config.agent?.unused == null, "Null agent entries must remain null.");
      assert(build.permission === "ask", "Original immutable build config must remain unchanged.");
      assert(arbiter.permission.edit === "deny", "Original immutable arbiter config must remain unchanged.");
      assert(sdet.permission.bash === "deny", "Original immutable specialist config must remain unchanged.");

      const resolvedArbiter = config.agent?.["session-completion-arbiter"];
      const resolvedSdet = config.agent?.["sdet-quality-engineer"];
      const resolvedBuild = config.agent?.build;
      assert(resolvedArbiter === arbiter, "Arbiter agent object must remain unchanged.");
      assert(
        resolvedArbiter.permission === arbiter.permission,
        "Arbiter permission map must remain the declared object.",
      );
      assert(
        (resolvedArbiter.permission as Record<string, unknown>).edit === "deny",
        "Arbiter edit must remain deny.",
      );
      assert(
        (resolvedArbiter.permission as Record<string, unknown>)["*"] !== "allow",
        "Arbiter must not receive allow-all from guard command setup.",
      );
      assert(
        (resolvedSdet?.permission as Record<string, unknown>).bash === "deny",
        "SDET bash must remain deny.",
      );
      assert(
        (resolvedSdet?.permission as Record<string, unknown>).edit === "ask",
        "SDET edit must remain the declared ask.",
      );
      assert(
        (resolvedSdet?.permission as Record<string, unknown>)["*"] !== "allow",
        "SDET must not receive allow-all from guard command setup.",
      );
      assert(
        (resolvedSdet?.permission as Record<string, unknown>).doom_loop !== "allow",
        "Specialist doom_loop must not be rewritten to allow.",
      );
      assert(
        resolvedBuild?.permission === "ask",
        "Build agent string permission must remain unchanged.",
      );
      assert(config.command?.existing != null, "Existing commands must remain configured.");
      assert(config.command?.["enable-grind"] != null, "Enable command must be configured.");
      assert(config.command?.["disable-grind"] != null, "Disable command must be configured.");
      for (const action of ["allow", "ask", "deny"] as const) {
        const scalarConfig = { permission: action };
        configureGrindCommands(scalarConfig as never);
        assert(scalarConfig.permission === action, `Guard command setup must preserve scalar ${action}.`);
        assert(configuredPermissionClass(scalarConfig.permission) === action, `Configured ${action} diagnostic must be exact.`);
      }
    },
  },
  {
    name: "critical: terminal certificates reject forged stale incomplete and question-pending claims",
    run: () => {
      const challenge = createTerminalCertificateChallenge({
        acceptedClaimIds: ["CLAIM-EXACT"],
        claimEvidenceRefs: ["claim-evidence"],
        issuer: ROADMAP_MISSION_CERTIFICATE_ISSUER,
        leaseGeneration: 7,
        requirementIds: ["1.1", "1.2"],
        revisionDigest: "revision_current",
        rootRef: "session_current",
      });
      const certificate = (overrides: Partial<typeof challenge> = {}, evidenceRefs = ["evidence/terminal.json"]) => {
        const bound = createTerminalCertificateChallenge({
          acceptedClaimIds: overrides.acceptedClaimIds ?? challenge.acceptedClaimIds,
          claimEvidenceRefs: overrides.claimEvidenceRefs ?? challenge.claimEvidenceRefs,
          issuer: overrides.issuer ?? challenge.issuer,
          leaseGeneration: overrides.leaseGeneration ?? challenge.leaseGeneration,
          requirementIds: overrides.requirementIds ?? challenge.requirementIds,
          revisionDigest: overrides.revisionDigest ?? challenge.revisionDigest,
          rootRef: overrides.rootRef ?? challenge.rootRef,
        });
        return { ...bound, disposition: "allow_stop" as const, evidenceRefs };
      };
      const evaluate = (candidate: unknown, configuredIssuers = [ROADMAP_MISSION_CERTIFICATE_ISSUER], pendingQuestion = false) =>
        evaluateTerminalCertificate({ certificate: candidate, challenge, configuredIssuers, pendingQuestion });
      const accepted = evaluate(certificate());
      assert(accepted.status === "accepted" && accepted.certificate != null, "Current configured certificate must be accepted.");
      const rejected = (
        result: ReturnType<typeof evaluate>,
        reason: string,
        message: string,
      ) => {
        assert(result.status === "rejected" && result.certificate == null && result.reason === reason, message);
      };
      const malformed = (result: ReturnType<typeof evaluate>, message: string) => {
        assert(result.status === "rejected" && result.certificate == null && result.reason?.startsWith("malformed:") === true, message);
      };
      rejected(evaluate(certificate({ issuer: "forged-issuer" })), "issuer-mismatch", "Forged issuer must be rejected without deterministic pass.");
      rejected(evaluate(certificate({ rootRef: "session_forged" })), "root-mismatch", "Forged root must be rejected without deterministic pass.");
      rejected(evaluate(certificate({ revisionDigest: "revision_stale" })), "stale-revision", "Stale revision must be rejected without deterministic pass.");
      rejected(evaluate(certificate({ leaseGeneration: 6 })), "stale-lease", "Stale lease must be rejected without deterministic pass.");
      rejected(evaluate(certificate({ requirementIds: ["1.1"] })), "missing-requirement", "Missing requirement must be rejected without deterministic pass.");
      rejected(evaluate(certificate({ acceptedClaimIds: [] })), "missing-claim", "Missing accepted claim must be rejected without deterministic pass.");
      rejected(evaluate(certificate({ claimEvidenceRefs: [] })), "claim-evidence-mismatch", "Mismatched claim evidence must be rejected without deterministic pass.");
      rejected(evaluate(certificate(), [], false), "unknown-issuer", "Unknown issuer must be rejected without deterministic pass.");
      rejected(evaluate(certificate(), [ROADMAP_MISSION_CERTIFICATE_ISSUER], true), "pending-question", "Pending question must reject terminal completion without deterministic pass.");
      malformed(evaluate(certificate({}, ["../private.json"])), "Unsafe evidence reference must be rejected without deterministic pass.");
      malformed(evaluate({ ...certificate(), disposition: "continue" }), "Non-terminal disposition must be rejected without deterministic pass.");
      const exactChallenge = createTerminalCertificateChallenge({
        issuer: ROADMAP_MISSION_CERTIFICATE_ISSUER,
        leaseGeneration: 7,
        requirementIds: ["exact"],
        revisionDigest: "revision_exact",
        rootRef: "session_exact",
      });
      const exactCertificate = { ...exactChallenge, disposition: "allow_stop" as const, evidenceRefs: ["evidence/exact.json"] };
      const exact = evaluateTerminalCertificate({
        certificate: exactCertificate,
        challenge: exactChallenge,
        configuredIssuers: [ROADMAP_MISSION_CERTIFICATE_ISSUER],
        pendingQuestion: false,
      });
      assert(exact.status === "accepted", "Current exact certificate without broad claims must remain accepted.");
    },
  },
  {
    name: "critical: completed message-bearing root preserves inspection and certificate evidence",
    run: async () => {
      const { inspectRootEvidence } = await import(
        "../global/extensions/session-completion-guard/inspection.ts"
      );
      const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), "scg-terminal-preflight-"));
      const previousDatabase = process.env.OPENCODE_DB;
      try {
        const rootID = "session_root_terminal_preflight";
        const rootRef = hashRef("session", rootID);
        const dbPath = path.join(dataDir, "opencode.db");
        await writeMinimalSessionDatabase(dbPath, rootID, 11);
        process.env.OPENCODE_DB = dbPath;
        const root = sessionFixture({
          id: rootID,
          directory: dataDir,
          metadata: {
            completionGuard: { grindEnabled: true, state: "running" },
            roadmapMission: {
              acceptedRequirementIds: ["1.1"],
              certificateIssuer: ROADMAP_MISSION_CERTIFICATE_ISSUER,
              certificateStatus: "pending",
              terminalCertificate: null,
            },
          },
        });
        const messages = Array.from({ length: 11 }, (_, index) => ({
          info: { id: `message_assistant_${index}`, role: "assistant" },
          parts: index === 1
            ? [{
                type: "tool",
                tool: "bash",
                state: {
                  error: [{ depth: 0, message: "permission denied" }],
                  status: "error",
                },
              }]
            : [{ type: "text", text: `completed step ${index + 1}` }],
        }));
        const client = {
          session: {
            messages: async () => ({ data: messages }),
            todo: async () => ({ data: [] }),
            diff: async () => ({ data: [] }),
          },
        };
        const options = parseGuardOptions({
          auditWindow: { enabled: false },
          certificateIssuers: [ROADMAP_MISSION_CERTIFICATE_ISSUER],
          certificateWaitMs: 5_000,
          settleMs: 0,
          statusToasts: false,
          strategyFallback: "strategy-fallback",
        });
        const leases = new AsyncLeaseRegistry({
          onGeneration: () => { /* no-op */ },
          onTerminalPty: () => { /* no-op */ },
        });
        const inspection = await inspectRootEvidence({
          client: client as never,
          configDirectory: dataDir,
          leases,
          options,
          root,
        });
        assert(
          inspection.context.assistantEvidence.length === 11,
          "Completed message-bearing inspection must retain all assistant evidence refs.",
        );
        const evidence = captureArbiterEvidence(rootID, rootRef, dataDir, root.metadata);
        assert(
          evidence.session?.sessionRef === rootRef && evidence.missingSessions.length === 0,
          "Completed message-bearing database must resolve the inspected root without omissions.",
        );
      } finally {
        if (previousDatabase == null) delete process.env.OPENCODE_DB;
        else process.env.OPENCODE_DB = previousDatabase;
        fs.rmSync(dataDir, { recursive: true, force: true });
      }
    },
  },
  {
    name: "critical: guard options default to session-completion-arbiter route",
    run: () => {
      const options = parseGuardOptions({});
      assert(options.arbiterAgent === "session-completion-arbiter", "Default arbiter agent must be session-completion-arbiter.");
      assert(options.certificateIssuers.length === 0, "Terminal certificate issuers must require explicit configuration.");
      assert(options.certificateWaitMs >= 0, "Terminal certificate wait must be bounded.");
      assert(options.enabled === true, "Guard must default enabled.");
      assert(options.settleMs >= 0, "Settle window must be non-negative.");
      assert(options.arbiterActiveLimit === 2 && options.arbiterQueueLimit === 32, "Arbiter scheduler defaults must be 2/32.");
    },
  },
  {
    name: "critical: allow_stop verdict parses without unresolved work",
    run: () => {
      const verdict = parseCompletionVerdict(validVerdict({
        verdict: "allow_stop",
        unresolved: [],
        requirementMatrix: [{ evidenceRefs: ["e1"], requirementRef: "r1", status: "complete" }],
      }), epoch());
      assert(verdict.verdict === "allow_stop", "allow_stop must parse.");
      const text = JSON.stringify(verdict);
      const fromText = parseCompletionVerdictText([{ type: "text", text }], epoch());
      assert(fromText.verdict === "allow_stop", "Whole-text JSON transport must accept allow_stop.");
    },
  },
  {
    name: "critical: non-question verdicts require null questionAnswers; autonomous answers use exact offered labels",
    run: () => {
      const omitted = validVerdict();
      delete (omitted as { questionAnswers?: unknown }).questionAnswers;
      assertThrows(
        () => parseCompletionVerdict(omitted, epoch()),
        "questionAnswers",
        "Omitted questionAnswers on a completion verdict must fail closed.",
      );
      assertThrows(
        () => parseCompletionVerdict(validVerdict({ questionAnswers: [["Recommended"]] }), epoch()),
        "questionAnswers",
        "A non-question verdict must not carry an answer matrix.",
      );

      const request = normalizeQuestionRequest({
        id: "question_fixture_1",
        questions: [{
          custom: false,
          header: "Strategy",
          multiple: false,
          options: [
            { label: "Recommended", description: "Safest reversible local choice" },
            { label: "Alternative", description: "Another reversible local choice" },
          ],
          question: "Which safe local strategy should I use?",
        }],
      });
      const questionEpoch = epoch({
        kind: "question",
        questionRequest: request,
      });
      const autonomous = parseCompletionVerdict(validVerdict({
        questionAnswers: [["Recommended"]],
        requirementMatrix: [{ evidenceRefs: ["e1"], requirementRef: "r1", status: "complete" }],
        unresolved: [],
        verdict: "allow_stop",
      }), questionEpoch);
      assert(autonomous.verdict === "allow_stop", "Autonomous question allow_stop must parse.");
      assert(
        autonomous.questionAnswers?.[0]?.[0] === "Recommended",
        "Autonomous question answers must keep the exact offered label.",
      );

      assertThrows(
        () => parseCompletionVerdict(validVerdict({
          questionAnswers: [["Invented"]],
          requirementMatrix: [{ evidenceRefs: ["e1"], requirementRef: "r1", status: "complete" }],
          unresolved: [],
          verdict: "allow_stop",
        }), questionEpoch),
        "questionAnswers[0]",
        "Unoffered label must fail closed.",
      );

      const owner = parseCompletionVerdict(validVerdict({
        ownerBoundary: {
          decision: "Owner must choose the protected action",
          evidenceRefs: ["event_ref_1"],
          reason: "The action requires owner authority",
        },
        questionAnswers: null,
        requirementMatrix: [{ evidenceRefs: ["event_ref_1"], requirementRef: "r", status: "owner_required" }],
        unresolved: [],
        verdict: "owner_required",
      }), questionEpoch);
      assert(owner.verdict === "owner_required", "Owner-required question verdict must parse.");
      assert(owner.questionAnswers === null, "Owner-required question verdict must carry null answers.");

      assertThrows(
        () => parseCompletionVerdict(validVerdict({
          ownerBoundary: {
            decision: "Owner must choose the protected action",
            evidenceRefs: ["event_ref_1"],
            reason: "The action requires owner authority",
          },
          questionAnswers: [["Recommended"]],
          requirementMatrix: [{ evidenceRefs: ["event_ref_1"], requirementRef: "r", status: "owner_required" }],
          unresolved: [],
          verdict: "owner_required",
        }), questionEpoch),
        "questionAnswers",
        "Owner-required question verdict must not carry answers.",
      );
    },
  },
  {
    name: "critical: new roots default grind off; only explicit true enables",
    run: () => {
      const plain = initialRootState(sessionFixture());
      assert(plain.grindEnabled === false, "Missing completionGuard metadata must leave grind disabled.");
      assert(plain.state === "disabled", "Default root state must be disabled.");
      const truthyString = initialRootState(sessionFixture({
        metadata: { completionGuard: { grindEnabled: "true" } },
      }));
      assert(truthyString.grindEnabled === false, "Non-boolean truthy grindEnabled must not enable grind.");
      const enabled = initialRootState(sessionFixture({
        metadata: { completionGuard: { grindEnabled: true } },
      }));
      assert(enabled.grindEnabled === true, "Explicit boolean true must enable grind.");
      assert(enabled.state === "running", "Explicitly enabled unpaused root must start running.");
    },
  },
  {
    name: "critical: grind commands are exact, synthetic, and config-registered only",
    run: () => {
      assert(grindControlAction("enable-grind") === "enable", "enable-grind must map to enable.");
      assert(grindControlAction("disable-grind") === "disable", "disable-grind must map to disable.");
      assert(grindControlAction("Enable-Grind") == null, "Command names must be exact/case-sensitive.");
      assert(grindControlAction("grind") == null, "Unrelated commands must not be grind controls.");
      const enablePart = grindControlPart("enable");
      const disablePart = grindControlPart("disable");
      assert(isGuardSyntheticPart(enablePart), "Enable control part must classify as guard synthetic for self-audit suppression.");
      assert(isGuardSyntheticPart(disablePart), "Disable control part must classify as guard synthetic.");
      assert(enablePart.synthetic === true, "Enable control part must be synthetic.");
      assert((enablePart.metadata as { provenance?: string }).provenance === "completion-guard", "Control provenance must be completion-guard.");
      const config: { command?: Record<string, { template?: string }> } = {};
      configureGrindCommands(config as never);
      assert(config.command?.["enable-grind"]?.template != null, "Config hook must register enable-grind.");
      assert(config.command?.["disable-grind"]?.template != null, "Config hook must register disable-grind.");
      assert(
        Object.keys(config.command ?? {}).sort().join(",") === "disable-grind,enable-grind",
        "Only the two grind control commands may be registered by configureGrindCommands.",
      );
    },
  },
  {
    name: "critical: disable clears only the correlated root leases; sibling leases remain",
    run: () => {
      const leases = new AsyncLeaseRegistry({
        onGeneration: () => { /* ignore */ },
        onTerminalPty: () => { /* ignore */ },
      });
      const rootA = "session_root_a";
      const rootB = "session_root_b";
      leases.beforeTool("pty_spawn", rootA, "call_a", { notifyOnExit: true });
      leases.afterTool(
        "pty_spawn",
        rootA,
        "call_a",
        "Spawned PTY ID: pty_a1",
        { id: "pty_a1" },
        () => ptyInfo({ id: "pty_a1", status: "running", notifyOnExit: true }),
      );
      leases.beforeTool("pty_spawn", rootB, "call_b", { notifyOnExit: true });
      leases.afterTool(
        "pty_spawn",
        rootB,
        "call_b",
        "Spawned PTY ID: pty_b1",
        { id: "pty_b1" },
        () => ptyInfo({ id: "pty_b1", status: "running", notifyOnExit: true }),
      );
      leases.clearRoot(rootA);
      assert(leases.getPtyLease("pty_a1") == null, "Disable/clear must drop only the targeted root lease.");
      assert(leases.getPtyLease("pty_b1")?.rootSessionID === rootB, "Sibling root lease must survive clearRoot of another root.");
      const sibling = leases.preflight(rootB, [ptyInfo({ id: "pty_b1", status: "running", notifyOnExit: true })], []);
      assert(sibling.kind === "waiting", `Sibling preflight must still wait on its PTY, got ${JSON.stringify(sibling)}`);
    },
  },
  {
    name: "critical: disabled status persistence must not observe/launch monitor",
    run: async () => {
      let observeCalls = 0;
      let updateCalls = 0;
      const root = sessionFixture({ id: "session_root_mon" });
      const state = {
        ...initialRootState(root),
        grindEnabled: false,
        state: "disabled",
        statusMessage: null,
        lastStatusKey: null,
      } as RootState;
      const reporter = new GuardStatusReporter({
        client: {
          session: {
            get: async () => ({ data: state.root }),
            update: async (args: { metadata?: unknown }) => {
              updateCalls += 1;
              return { data: { ...root, metadata: args.metadata } };
            },
          },
          tui: {
            showToast: async () => {
              throw new Error("toast must not run when statusToasts is false");
            },
          },
        } as never,
        statusToasts: false,
        monitor: {
          observe: async () => {
            observeCalls += 1;
          },
        },
        log: async () => { /* ignore */ },
      });
      await reporter.persist(state);
      assert(updateCalls === 1, "Disabled root may still persist metadata.");
      assert(observeCalls === 0, "Disabled root must not invoke monitor.observe.");
      state.grindEnabled = true;
      state.state = "running";
      await reporter.persist(state);
      assert(observeCalls === 1, "Enabled root may observe monitor once per persist.");
    },
  },
  {
    name: "critical: in-flight PTY fallback must not inject after grind disable",
    run: async () => {
      const root = "session_root_fallback_disable";
      const ptyID = "pty_fb_dis_1";
      let promptCalls = 0;
      const leases = new AsyncLeaseRegistry({
        onGeneration: () => { /* ignore */ },
        onTerminalPty: () => { /* ignore */ },
      });
      leases.beforeTool("pty_spawn", root, "call_fb", { notifyOnExit: true });
      leases.afterTool(
        "pty_spawn",
        root,
        "call_fb",
        `Spawned PTY ID: ${ptyID}`,
        { id: ptyID },
        () => ptyInfo({ id: ptyID, status: "exited", notifyOnExit: true, exitCode: 0 }),
      );
      const lease = leases.getPtyLease(ptyID);
      assert(lease != null && lease.notificationConsumed === false, "Fixture lease must await exit notification.");

      const state = {
        paused: false,
        grindEnabled: true,
        guardTurnPending: false,
        promptContext: { agent: null, model: null, tools: null, variant: null },
        root: sessionFixture({ id: root, directory: "." }),
      } as unknown as RootState;

      let releaseResolve!: () => void;
      const resolveGate = new Promise<void>((resolve) => {
        releaseResolve = resolve;
      });

      const scheduler = new PtyFallbackScheduler({
        client: {
          session: {
            promptAsync: async () => {
              promptCalls += 1;
              return {};
            },
          },
        } as never,
        leases,
        settleMs: 5,
        resolveRoot: async () => {
          // Reproduce /disable-grind while fallback send is already past getPtyLease:
          // clear guard-owned lease state and flip grind off before promptAsync.
          await resolveGate;
          leases.clearRoot(root);
          state.grindEnabled = false;
          return state;
        },
        onFailure: async () => {
          throw new Error("onFailure must not run for suppressed fallback");
        },
      });

      scheduler.schedule(
        root,
        ptyID,
        ptyInfo({ id: ptyID, status: "exited", notifyOnExit: true, exitCode: 0 }),
      );
      await sleep(40);
      releaseResolve();
      await sleep(40);
      assert(
        promptCalls === 0,
        `Disabled root must not receive PTY fallback injection after disable race; promptAsync calls=${promptCalls}`,
      );
      scheduler.dispose();
    },
  },
  {
    name: "critical: in-flight runAudit must not call arbiter prompt after grind disable",
    run: async () => {
      // Controller imports the PTY bridge (bun-pty). Node's type-stripping cannot load that
      // graph; under Node re-exec this single oracle via Bun. Under Bun, import dynamically.
      if (!isBunRuntime) {
        const self = fileURLToPath(import.meta.url);
        const result = spawnSync("bun", [self, RUNAUDIT_DISABLE_ORACLE_FLAG], {
          cwd: path.resolve(path.dirname(self), ".."),
          encoding: "utf8",
          shell: false,
        });
        const combined = `${result.stdout ?? ""}\n${result.stderr ?? ""}`;
        assert(
          result.status === 0,
          `Bun controller disable-race oracle failed (status=${result.status}):\n${combined}`,
        );
        assert(
          combined.includes("PASS critical: in-flight runAudit must not call arbiter prompt after grind disable"),
          `Bun oracle did not report PASS:\n${combined}`,
        );
        return;
      }

      const { SessionCompletionController } = await import(
        "../global/extensions/session-completion-guard/controller.ts"
      );
      const rootID = "session_root_runaudit_disable";
      const childID = "session_child_runaudit_1";
      const rootRef = hashRef("session", rootID);
      let root: Session = sessionFixture({ id: rootID, directory: "." });
      let promptCalls = 0;
      let promptAsyncCalls = 0;
      let releasePersist!: () => void;
      const persistGate = new Promise<void>((resolve) => {
        releasePersist = resolve;
      });
      let rootPersistEntered = false;

      const client = {
        session: {
          get: async ({ sessionID }: { sessionID: string }) => {
            if (sessionID === rootID) return { data: root };
            if (sessionID === childID) {
              return {
                data: {
                  ...root,
                  id: childID,
                  parentID: rootID,
                  metadata: { completionGuard: { rootSessionRef: rootRef } },
                },
              };
            }
            return { error: { name: "NotFoundError" } };
          },
          update: async (args: { sessionID: string; metadata?: unknown }) => {
            if (args.sessionID === rootID) {
              // runAudit awaits status.persist (root update) after ensureArbiterChild.
              // Hold here so /disable-grind can invalidate the epoch mid-flight.
              if (!rootPersistEntered) {
                rootPersistEntered = true;
                await persistGate;
              }
              root = { ...root, metadata: args.metadata as Session["metadata"] };
              return { data: root };
            }
            return {
              data: {
                id: args.sessionID,
                parentID: rootID,
                directory: ".",
                projectID: "proj_fixture",
                title: "audit-child",
                version: "1",
                time: { created: 0, updated: 0 },
                metadata: args.metadata,
              },
            };
          },
          create: async () => ({
            data: {
              id: childID,
              parentID: rootID,
              directory: ".",
              projectID: "proj_fixture",
              title: "audit-child",
              version: "1",
              time: { created: 0, updated: 0 },
              metadata: { completionGuard: { rootSessionRef: rootRef } },
            },
          }),
          children: async () => ({ data: [] }),
          prompt: async () => {
            promptCalls += 1;
            return { data: { info: {}, parts: [{ type: "text", text: "{}" }] } };
          },
          promptAsync: async () => {
            promptAsyncCalls += 1;
            return {};
          },
        },
        tool: { ids: async () => ({ data: ["bash"] }) },
        v2: {
          agent: {
            list: async () => ({
              data: {
                data: [{
                  id: "session-completion-arbiter",
                  hidden: true,
                  model: { providerID: "xai", id: "grok-4.6" },
                }],
              },
            }),
          },
        },
        provider: {
          list: async () => ({
            data: {
              all: [{ id: "xai", models: { "grok-4.6": { id: "grok-4.6" } } }],
              connected: ["xai"],
            },
          }),
        },
        tui: { showToast: async () => ({}) },
      };

      const input = {
        client: {
          app: { log: async () => ({}) },
        },
        directory: ".",
      };
      const controller = new SessionCompletionController(
        input as never,
        { statusToasts: false, settleMs: 0, auditWindow: { enabled: false } },
        client as never,
      );
      type ControllerProbe = {
        cancelAudit(state: RootState, next?: RootState["state"]): void;
        leases: AsyncLeaseRegistry;
        ptyFallback: { clearRoot(rootSessionID: string): void };
        roots: Map<string, RootState>;
        runAudit(state: RootState, inspection: RootInspection, epoch: AuditEpoch): Promise<void>;
      };
      const probe = controller as unknown as ControllerProbe;

      const revision = {
        assistantRef: "assistant_runaudit",
        diffDigest: "diff_runaudit",
        humanRef: "human_runaudit",
        journalDigest: "journal_runaudit",
        leaseGeneration: 0,
        revisionDigest: "revision_runaudit",
        todoDigest: "todo_runaudit",
      };
      const inspection: RootInspection = {
        context: { assistantEvidence: [], background: [], humanMessages: [] },
        journal: {
          absolutePath: "docs/session-strategy-history/session_runaudit.md",
          digest: "journal_runaudit",
          relativePath: "docs/session-strategy-history/session_runaudit.md",
          source: "docs_fallback",
        },
        revision,
      };
      const epoch: AuditEpoch = {
        auditID: "audit_runaudit_disable_1",
        attempt: 0,
        childSessionID: null,
        // Pre-seed evidence so captureArbiterEvidence (live delivery context) is skipped.
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
        grindEnabled: true,
        state: "auditing",
      };
      probe.roots.set(rootID, state);

      const runPromise = probe.runAudit(state, inspection, epoch);
      await sleep(40);
      assert(rootPersistEntered, "runAudit must reach status.persist await before disable injection.");

      // Mirror /disable-grind side effects at the mid-audit await boundary.
      state.controlTurnPending = true;
      state.guardTurnPending = true;
      state.paused = false;
      probe.cancelAudit(state, "disabled");
      state.grindEnabled = false;
      state.questions.clear();
      probe.leases.clearRoot(rootID);
      probe.ptyFallback.clearRoot(rootID);

      releasePersist();
      await runPromise;

      assert(
        promptCalls === 0,
        `Disabled root must not receive arbiter session.prompt after disable race; promptCalls=${promptCalls}`,
      );
      assert(
        promptAsyncCalls === 0,
        `Disabled root must not receive promptAsync after runAudit disable race; promptAsyncCalls=${promptAsyncCalls}`,
      );
      assert(state.grindEnabled === false, "Disable must leave grindEnabled false.");
      assert(state.activeAudit == null, "Disable must clear active audit epoch.");
      assert(state.state === "disabled", `Disable must leave state disabled, got ${state.state}`);
    },
  },
  {
    name: "critical: in-flight official question reply must not apply after grind disable",
    run: async () => {
      // Same Bun boundary as runAudit oracle: controller pulls bun-pty.
      if (!isBunRuntime) {
        const self = fileURLToPath(import.meta.url);
        const result = spawnSync("bun", [self, QUESTION_REPLY_DISABLE_ORACLE_FLAG], {
          cwd: path.resolve(path.dirname(self), ".."),
          encoding: "utf8",
          shell: false,
        });
        const combined = `${result.stdout ?? ""}\n${result.stderr ?? ""}`;
        assert(
          result.status === 0,
          `Bun official-reply disable-race oracle failed (status=${result.status}):\n${combined}`,
        );
        assert(
          combined.includes("PASS critical: in-flight official question reply must not apply after grind disable"),
          `Bun oracle did not report PASS:\n${combined}`,
        );
        return;
      }

      const { SessionCompletionController } = await import(
        "../global/extensions/session-completion-guard/controller.ts"
      );
      const rootID = "session_root_qreply_disable";
      const requestID = "question_qreply_disable_1";
      const rootRef = hashRef("session", rootID);
      let root: Session = sessionFixture({ id: rootID, directory: "." });
      let replyCalls = 0;
      let appliedReplies = 0;
      let rejectCalls = 0;
      let promptAsyncCalls = 0;
      let sawAbortSignal = false;
      let releaseReply!: () => void;
      const replyGate = new Promise<void>((resolve) => {
        releaseReply = resolve;
      });
      let replyEntered = false;

      const client = {
        session: {
          get: async ({ sessionID }: { sessionID: string }) => {
            if (sessionID === rootID) return { data: root };
            return { error: { name: "NotFoundError" } };
          },
          update: async (args: { sessionID: string; metadata?: unknown }) => {
            if (args.sessionID === rootID) {
              root = { ...root, metadata: args.metadata as Session["metadata"] };
              return { data: root };
            }
            return { data: { id: args.sessionID, metadata: args.metadata } };
          },
          messages: async () => ({ data: [] }),
          todo: async () => ({ data: [] }),
          diff: async () => ({ data: [] }),
          promptAsync: async () => {
            promptAsyncCalls += 1;
            return {};
          },
        },
        question: {
          reply: async (
            _args: { requestID?: string; answers?: string[][] },
            opts?: { signal?: AbortSignal },
          ) => {
            replyEntered = true;
            replyCalls += 1;
            if (opts?.signal != null) sawAbortSignal = true;
            await replyGate;
            if (opts?.signal?.aborted) {
              const error = new Error("aborted") as Error & { name: string };
              error.name = "AbortError";
              throw error;
            }
            appliedReplies += 1;
            return { data: true };
          },
          reject: async () => {
            rejectCalls += 1;
            return { data: true };
          },
        },
        tui: { showToast: async () => ({}) },
      };

      const controller = new SessionCompletionController(
        { client: { app: { log: async () => ({}) } }, directory: "." } as never,
        { statusToasts: false, settleMs: 0, auditWindow: { enabled: false } },
        client as never,
      );
      type ControllerProbe = {
        applyQuestionVerdict(state: RootState, epoch: AuditEpoch, verdict: CompletionVerdict): Promise<void>;
        onCommand(
          input: { arguments: string; command: string; sessionID: string },
          output: { parts: unknown[] },
        ): Promise<void>;
        roots: Map<string, RootState>;
      };
      const probe = controller as unknown as ControllerProbe;

      const request = normalizeQuestionRequest({
        id: requestID,
        tool: { callID: "call_qreply_disable_1" },
        questions: [{
          custom: false,
          header: "Strategy",
          multiple: false,
          options: [
            { label: "Recommended", description: "Safest reversible local choice" },
            { label: "Alternative", description: "Another reversible local choice" },
          ],
          question: "Which safe local strategy should I use?",
        }],
      });
      const revision = {
        assistantRef: "assistant_qreply",
        diffDigest: "diff_qreply",
        humanRef: "human_qreply",
        journalDigest: "journal_qreply",
        leaseGeneration: 0,
        revisionDigest: "revision_qreply",
        todoDigest: "todo_qreply",
      };
      const questionEpoch = epoch({
        auditID: "audit_qreply_disable_1",
        inspected: revision,
        kind: "question",
        questionRequest: request,
        rootRef,
        rootSessionID: rootID,
      });
      const verdict = parseCompletionVerdict(validVerdict({
        auditID: questionEpoch.auditID,
        inspectedRevision: revision.revisionDigest,
        questionAnswers: [["Recommended"]],
        requirementMatrix: [{ evidenceRefs: ["e1"], requirementRef: "r1", status: "complete" }],
        rootSessionRef: rootRef,
        unresolved: [],
        verdict: "allow_stop",
      }), questionEpoch);

      const state: RootState = {
        ...initialRootState(root),
        activeAudit: questionEpoch,
        auditAbort: new AbortController(),
        grindEnabled: true,
        state: "question-auditing",
      };
      state.questions.set(requestID, {
        auditID: questionEpoch.auditID,
        replyObserved: false,
        request,
        state: "open",
      });
      probe.roots.set(rootID, state);

      const runPromise = probe.applyQuestionVerdict(state, questionEpoch, verdict);
      await sleep(40);
      assert(replyEntered, "official question reply must be reached before disable injection.");

      await probe.onCommand(
        { arguments: "", command: "disable-grind", sessionID: rootID },
        { parts: [] },
      );

      releaseReply();
      let thrown: unknown = null;
      try {
        await runPromise;
      } catch (error) {
        thrown = error;
      }

      assert(state.grindEnabled === false, "Disable must leave grindEnabled false after official-reply race.");
      assert(
        state.state === "disabled",
        `Late official reply must not revive disabled root (got state=${state.state}, replyCalls=${replyCalls}, appliedReplies=${appliedReplies}, rejectCalls=${rejectCalls}, promptAsyncCalls=${promptAsyncCalls}, sawAbortSignal=${sawAbortSignal}, thrown=${thrown instanceof Error ? thrown.name : String(thrown)})`,
      );
      assert(appliedReplies === 0, `Disable must abort official reply effect; appliedReplies=${appliedReplies}`);
      assert(rejectCalls === 0, `Disable must not reject the question; rejectCalls=${rejectCalls}`);
      assert(promptAsyncCalls === 0, `Disable must not inject root continuation; promptAsyncCalls=${promptAsyncCalls}`);
      assert(state.autonomousQuestionRefs.size === 0, "Disable must not confirm synthetic question authority.");
      assert(
        state.pendingAutonomousQuestionRefs.size === 1,
        `Disable during reply must retain fail-closed pending provenance; pending=${state.pendingAutonomousQuestionRefs.size}`,
      );
      assert(state.activeAudit == null, "Disable must clear the active question audit epoch.");
    },
  },
  {
    name: "critical: same-epoch arbiter retry must not re-embed completionEvidence",
    run: async () => {
      // Same Bun boundary as other controller oracles: controller pulls bun-pty.
      // Locks the confirmed grind defect where every retry re-sent the full audit
      // payload into one retained child until the provider 500k prompt limit failed.
      if (!isBunRuntime) {
        const self = fileURLToPath(import.meta.url);
        const result = spawnSync("bun", [self, RETRY_PROMPT_AMPLIFICATION_ORACLE_FLAG], {
          cwd: path.resolve(path.dirname(self), ".."),
          encoding: "utf8",
          shell: false,
        });
        const combined = `${result.stdout ?? ""}\n${result.stderr ?? ""}`;
        assert(
          result.status === 0,
          `Bun retry-prompt-amplification oracle failed (status=${result.status}):\n${combined}`,
        );
        assert(
          combined.includes("PASS critical: same-epoch arbiter retry must not re-embed completionEvidence"),
          `Bun oracle did not report PASS:\n${combined}`,
        );
        return;
      }

      const { SessionCompletionController } = await import(
        "../global/extensions/session-completion-guard/controller.ts"
      );
      const { inspectRootEvidence } = await import(
        "../global/extensions/session-completion-guard/inspection.ts"
      );

      const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), "scg-retry-amplify-"));
      try {
        const rootID = "session_root_retry_amplify";
        const childID = "session_child_retry_amplify_1";
        const rootRef = hashRef("session", rootID);
        const evidenceMarker = `COMPLETION_EVIDENCE_MARKER_${"X".repeat(4_000)}`;
        let root: Session = sessionFixture({ id: rootID, directory: dataDir });
        const promptBodies: Array<{ sessionID: string; text: string }> = [];
        let createCalls = 0;
        let promptAsyncCalls = 0;
        let promptOrdinal = 0;

        const client = {
          session: {
            get: async ({ sessionID }: { sessionID: string }) => {
              if (sessionID === rootID) return { data: root };
              if (sessionID === childID) {
                return {
                  data: {
                    ...root,
                    id: childID,
                    parentID: rootID,
                    metadata: { completionGuard: { rootSessionRef: rootRef } },
                  },
                };
              }
              return { error: { name: "NotFoundError" } };
            },
            update: async (args: { sessionID: string; metadata?: unknown }) => {
              if (args.sessionID === rootID) {
                root = { ...root, metadata: args.metadata as Session["metadata"] };
                return { data: root };
              }
              return {
                data: {
                  id: args.sessionID,
                  parentID: rootID,
                  directory: dataDir,
                  projectID: "proj_fixture",
                  title: "audit-child",
                  version: "1",
                  time: { created: 0, updated: 0 },
                  metadata: args.metadata,
                },
              };
            },
            create: async () => {
              createCalls += 1;
              return {
                data: {
                  id: childID,
                  parentID: rootID,
                  directory: dataDir,
                  projectID: "proj_fixture",
                  title: "audit-child",
                  version: "1",
                  time: { created: 0, updated: 0 },
                  metadata: { completionGuard: { rootSessionRef: rootRef } },
                },
              };
            },
            children: async () => ({
              data: createCalls === 0
                ? []
                : [{
                  id: childID,
                  parentID: rootID,
                  directory: dataDir,
                  projectID: "proj_fixture",
                  title: "audit-child",
                  version: "1",
                  time: { created: 0, updated: 0 },
                  metadata: { completionGuard: { rootSessionRef: rootRef } },
                }],
            }),
            messages: async () => ({ data: [] }),
            todo: async () => ({ data: [] }),
            diff: async () => ({ data: [] }),
            prompt: async (args: {
              sessionID: string;
              parts?: Array<{ type?: string; text?: string }>;
            }) => {
              const text = args.parts?.map((part) => part.text ?? "").join("") ?? "";
              promptBodies.push({ sessionID: args.sessionID, text });
              promptOrdinal += 1;
              if (promptOrdinal === 1) {
                // Malformed owner_required mirrors the live incident parser failure.
                const invalid = {
                  schemaVersion: 1,
                  auditID: "audit_retry_amplify_1",
                  claimMatrix: [],
                  rootSessionRef: rootRef,
                  inspectedRevision: "will-be-rewritten",
                  verdict: "owner_required",
                  confidence: "high",
                  goalSummary: "Need owner decision",
                  evidenceGaps: [],
                  evidenceRefs: [],
                  ownerBoundary: null,
                  questionAnswers: null,
                  requirementMatrix: [{
                    evidenceRefs: [],
                    requirementRef: "req_1",
                    status: "owner_required",
                  }],
                  unresolved: [],
                  strategyAssessment: {
                    fingerprint: "fp_retry",
                    prohibitedStrategies: [],
                    repeated: false,
                    requiredRetryEvidence: [],
                  },
                };
                // inspectedRevision is filled after inspection is known (below via closure rewrite).
                return {
                  data: {
                    info: {},
                    parts: [{ type: "text", text: JSON.stringify(invalid) }],
                  },
                };
              }
              const allowStop = {
                schemaVersion: 1,
                auditID: "audit_retry_amplify_1",
                claimMatrix: [],
                rootSessionRef: rootRef,
                inspectedRevision: "will-be-rewritten",
                verdict: "allow_stop",
                confidence: "high",
                goalSummary: "Accepted outcome complete",
                evidenceGaps: [],
                evidenceRefs: ["evidence_1"],
                ownerBoundary: null,
                questionAnswers: null,
                requirementMatrix: [{
                  evidenceRefs: ["evidence_1"],
                  requirementRef: "req_1",
                  status: "complete",
                }],
                unresolved: [],
                strategyAssessment: {
                  fingerprint: "fp_retry",
                  prohibitedStrategies: [],
                  repeated: false,
                  requiredRetryEvidence: [],
                },
              };
              return {
                data: {
                  info: {},
                  parts: [{ type: "text", text: JSON.stringify(allowStop) }],
                },
              };
            },
            promptAsync: async () => {
              promptAsyncCalls += 1;
              return {};
            },
          },
          tool: { ids: async () => ({ data: ["bash"] }) },
          v2: {
            agent: {
              list: async () => ({
                data: {
                  data: [{
                    id: "session-completion-arbiter",
                    hidden: true,
                    model: { providerID: "xai", id: "grok-4.6" },
                  }],
                },
              }),
            },
          },
          provider: {
            list: async () => ({
              data: {
                all: [{ id: "xai", models: { "grok-4.6": { id: "grok-4.6" } } }],
                connected: ["xai"],
              },
            }),
          },
          tui: { showToast: async () => ({}) },
        };

        const input = {
          client: {
            app: { log: async () => ({}) },
          },
          directory: dataDir,
        };
        const controller = new SessionCompletionController(
          input as never,
          {
            statusToasts: false,
            settleMs: 0,
            initialDelayMs: 1,
            maxDelayMs: 1,
            auditWindow: { enabled: false },
            strategyFallback: "strategy-fallback",
          },
          client as never,
        );
        type ControllerProbe = {
          roots: Map<string, RootState>;
          runAudit(state: RootState, inspection: RootInspection, epoch: AuditEpoch): Promise<void>;
          leases: AsyncLeaseRegistry;
        };
        const probe = controller as unknown as ControllerProbe;

        const inspection = await inspectRootEvidence({
          client: client as never,
          configDirectory: dataDir,
          leases: probe.leases,
          options: parseGuardOptions({
            statusToasts: false,
            settleMs: 0,
            initialDelayMs: 1,
            maxDelayMs: 1,
            auditWindow: { enabled: false },
            strategyFallback: "strategy-fallback",
          }),
          root,
        });
        const revisionDigest = inspection.revision.revisionDigest;

        // Rewrite verdict payloads so correlation matches the live inspection digest.
        const originalPrompt = client.session.prompt;
        client.session.prompt = async (args) => {
          const result = await originalPrompt(args);
          const part = result.data.parts[0];
          if (part?.type === "text" && typeof part.text === "string") {
            const parsed = JSON.parse(part.text) as Record<string, unknown>;
            parsed.inspectedRevision = revisionDigest;
            part.text = JSON.stringify(parsed);
          }
          return result;
        };

        const epoch: AuditEpoch = {
          auditID: "audit_retry_amplify_1",
          attempt: 0,
          childSessionID: null,
          completionEvidence: {
            schemaVersion: 2,
            session: { sessionRef: rootRef },
            bulk: evidenceMarker,
          } as never,
          inspected: inspection.revision,
          kind: "completion",
          questionRequest: null,
          rootRef,
          rootSessionID: rootID,
        };
        const state: RootState = {
          ...initialRootState(root),
          activeAudit: epoch,
          auditAbort: new AbortController(),
          grindEnabled: true,
          state: "auditing",
        };
        probe.roots.set(rootID, state);

        await probe.runAudit(state, inspection, epoch);

        const deadline = Date.now() + 5_000;
        while (Date.now() < deadline && state.state !== "passed") {
          await sleep(20);
        }

        assert(promptBodies.length === 2, `Expected first attempt + one retry prompt, got ${promptBodies.length}`);
        assert(createCalls === 1, `Same retained child must be reused; createCalls=${createCalls}`);
        assert(
          promptBodies.every((entry) => entry.sessionID === childID),
          `All arbiter prompts must target the same retained child; sessions=${promptBodies.map((e) => e.sessionID).join(",")}`,
        );

        const [first, retry] = promptBodies;
        assert(
          first.text.includes("<completion_audit_request>") && first.text.includes("completionEvidence"),
          "First attempt must send the full completion audit request with completionEvidence.",
        );
        assert(
          first.text.includes(evidenceMarker),
          "First attempt must retain the complete evidence payload.",
        );
        assert(
          !retry.text.includes("completionEvidence") && !retry.text.includes(evidenceMarker),
          "Retry prompt must not re-embed completionEvidence (same-epoch prompt amplification).",
        );
        assert(
          retry.text.includes("<completion_audit_retry>") && retry.text.includes("previousError"),
          "Retry prompt must carry bounded schema feedback, not a silent re-prompt.",
        );
        assert(
          /ownerBoundary/i.test(retry.text),
          `Retry feedback must surface the parser failure cause; retry=${retry.text.slice(0, 400)}`,
        );
        assert(
          retry.text.length < 2_000 && retry.text.length < first.text.length / 2,
          `Retry prompt must stay bounded (retryChars=${retry.text.length}, firstChars=${first.text.length}).`,
        );
        assert(
          promptAsyncCalls === 0,
          `Invalid first response and allow_stop must not inject root continuation; promptAsyncCalls=${promptAsyncCalls}`,
        );
        assert(epoch.attempt === 2, `Expected two attempts on the same epoch, got attempt=${epoch.attempt}`);
        assert(
          state.state === "passed",
          `Valid second response must reach terminal Passed; state=${state.state} prompts=${promptBodies.length}`,
        );
        assert(state.activeAudit == null, "Passed audit must clear the active epoch.");
      } finally {
        fs.rmSync(dataDir, { recursive: true, force: true });
      }
    },
  },
  {
    name: "critical: in-flight status persist must not rewrite grindEnabled true after disable",
    run: async () => {
      // /disable-grind must persist disabled mode. A concurrent pre-disable status.persist that
      // already snapshotted grindEnabled:true must not land afterward and resurrect enablement
      // (restart/reload would then audit without a new /enable-grind).
      const rootID = "session_root_persist_disable";
      const root = sessionFixture({ id: rootID, directory: "." });
      const state = {
        ...initialRootState(root),
        grindEnabled: true,
        state: "auditing",
        statusMessage: "Auditing completion",
      } as RootState;

      let releaseUpdate!: () => void;
      const updateGate = new Promise<void>((resolve) => {
        releaseUpdate = resolve;
      });
      let updateEntered = false;
      let writtenGuard: Record<string, unknown> | null = null;
      let observeCalls = 0;

      const reporter = new GuardStatusReporter({
        client: {
          session: {
            get: async () => ({ data: state.root }),
            update: async (args: { sessionID: string; metadata?: unknown }) => {
              updateEntered = true;
              await updateGate;
              const metadata = args.metadata as { completionGuard?: Record<string, unknown> };
              writtenGuard = metadata.completionGuard ?? null;
              return {
                data: {
                  ...root,
                  metadata: args.metadata,
                },
              };
            },
          },
          tui: {
            showToast: async () => {
              throw new Error("toast must not run when statusToasts is false");
            },
          },
        } as never,
        statusToasts: false,
        monitor: {
          observe: async () => {
            observeCalls += 1;
          },
        },
        log: async () => { /* ignore */ },
      });

      const persistPromise = reporter.persist(state);
      await sleep(40);
      assert(updateEntered, "status.persist must reach session.update before disable injection.");

      // Mirror /disable-grind local flip while an earlier enabled persist is in flight.
      state.grindEnabled = false;
      state.state = "disabled";
      state.statusMessage = "Grind disabled for this session";

      releaseUpdate();
      await persistPromise;

      assert(
        writtenGuard != null && writtenGuard.grindEnabled === false,
        `In-flight status persist must not rewrite grindEnabled true after disable; wrote=${JSON.stringify(writtenGuard)}`,
      );
      assert(
        writtenGuard.state === "disabled",
        `In-flight status persist must not rewrite non-disabled state after disable; wrote=${JSON.stringify(writtenGuard)}`,
      );
      assert(observeCalls === 0, "Persist completing after disable must not observe/launch monitor.");
      assert(state.grindEnabled === false, "Local grindEnabled must remain false after late persist.");
    },
  },
  {
    name: "critical: in-flight monitor observe must not spawn after grind disable",
    run: async () => {
      // /disable-grind must suppress later monitor launch. observe() currently gates only on
      // entry START_STATES and may await openHandoff before spawn; disable during that await
      // must not still spawn window-control/shell processes.
      const rootID = "session_root_monitor_disable";
      const root = sessionFixture({ id: rootID, directory: "." });
      const state = {
        ...initialRootState(root),
        grindEnabled: true,
        state: "auditing",
        statusMessage: "Auditing completion",
      } as RootState;

      const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), "scg-monitor-disable-"));
      try {
        const dbPath = path.join(dataDir, "opencode.db");
        await writeMinimalSessionDatabase(dbPath, rootID);

        let releaseHandoff!: () => void;
        const handoffGate = new Promise<void>((resolve) => {
          releaseHandoff = resolve;
        });
        let handoffEntered = false;
        let spawnCalls = 0;
        const spawnCommands: string[] = [];

        const launcher = new GuardAuditMonitorLauncher(
          {
            closePassedAfterMs: 15_000,
            enabled: true,
            mode: "read-only-monitor",
            scope: "per-root",
            terminal: "powershell-shell",
            validationError: null,
          },
          {
            directory: ".",
            environment: {
              OPENCODE_DATA_DIR: dataDir,
              USERPROFILE: path.join(dataDir, "home"),
              HOME: path.join(dataDir, "home"),
            },
            platform: "win32",
            openHandoff: async () => {
              handoffEntered = true;
              await handoffGate;
              return {
                pipeName: "\\\\.\\pipe\\fixture-guard-monitor",
                close: () => { /* ignore */ },
              };
            },
            spawnProcess: ((command: string) => {
              spawnCalls += 1;
              spawnCommands.push(command);
              return {
                stdout: { on: () => { /* ignore */ } },
                stderr: { on: () => { /* ignore */ } },
                once: () => { /* ignore */ },
                kill: () => true,
                unref: () => { /* ignore */ },
              };
            }) as never,
            log: async () => { /* ignore */ },
          },
        );

        const observePromise = launcher.observe(state);
        await sleep(40);
        assert(handoffEntered, "monitor observe must reach openHandoff before disable injection.");

        // Mirror /disable-grind while monitor handoff is in flight.
        state.grindEnabled = false;
        state.state = "disabled";
        state.statusMessage = "Grind disabled for this session";

        releaseHandoff();
        await observePromise;

        assert(
          spawnCalls === 0,
          `Disabled root must not spawn monitor processes after disable race; spawnCalls=${spawnCalls} commands=${JSON.stringify(spawnCommands)}`,
        );
        assert(state.grindEnabled === false, "Local grindEnabled must remain false after late monitor observe.");
      } finally {
        fs.rmSync(dataDir, { recursive: true, force: true });
      }
    },
  },
  {
    name: "critical: old idle interrupted audits rotate one stale child and preserve unrelated ownership",
    run: async () => {
      const result = await runInterruptedRetention({
        firstUpdatedOffsetMs: -130_000,
        secondUpdatedOffsetMs: -129_000,
        statusForCall: () => ({ data: {} }),
      });
      assert(result.error == null, `old idle recovery must not fail: ${result.error ?? "unknown"}`);
      assert(result.created.length === 1, `must create exactly one replacement child, got ${JSON.stringify(result.created)}`);
      assert(
        result.deleted.length === 1 && result.deleted[0] === "session_child_retention_first",
        `must delete only the oldest interrupted child, got ${JSON.stringify(result.deleted)}`,
      );
      assert(
        result.updates.some((entry) => entry.id === "session_child_retention_first" && entry.status === "stale"),
        `must mark the rotated child stale before deletion, updates=${JSON.stringify(result.updates)}`,
      );
      assert(result.firstPresent === false, "rotated interrupted child must be gone after deletion");
      assert(result.secondPresent && result.secondStatus === "auditing", "newer interrupted sibling must remain auditing");
      assert(result.unrelatedPresent, "unrelated child must be preserved");
      assert(result.wrongOwnerPresent && result.wrongOwnerStatus === "auditing", "foreign-owned child must be preserved");
    },
  },
  {
    name: "critical: interrupted quarantine must not mutate a child that is busy on status re-check",
    run: async () => {
      const result = await runInterruptedRetention({
        firstUpdatedOffsetMs: -130_000,
        secondUpdatedOffsetMs: -129_000,
        statusForCall: (call, childIDs) =>
          call === 1 ? { data: {} } : { data: { [childIDs.first]: { type: "busy" } } },
      });
      assert(result.error == null, `remaining idle sibling must still recover: ${result.error ?? "unknown"}`);
      assert(
        result.deleted.length === 1 && result.deleted[0] === "session_child_retention_second",
        `must rotate the still-idle sibling, not the busy child, got ${JSON.stringify(result.deleted)}`,
      );
      assert(
        result.updates.every((entry) => entry.id !== "session_child_retention_first"),
        `busy-on-recheck child must not be marked stale, updates=${JSON.stringify(result.updates)}`,
      );
      assert(result.firstPresent && result.firstStatus === "auditing", "busy-on-recheck child must remain auditing");
      assert(result.unrelatedPresent && result.wrongOwnerPresent, "unrelated and foreign children must be preserved");
    },
  },
  {
    name: "critical: hidden route becoming ready during settle creates one child and no earlier child",
    run: async () => {
      const result = await runRouteSettle({ readyAfterLookups: 2 });
      assert(result.error == null, `ready-during-settle must not fail: ${result.error?.message ?? "unknown"}`);
      assert(result.lookups >= 2, `must retry provider-free lookup until ready, lookups=${result.lookups}`);
      assert(result.created === 1, `must create exactly one child after readiness, created=${result.created}`);
      assert(result.tools != null, "ready route must return a tool map");
      assert(
        Object.values(result.tools ?? {}).every((enabled) => enabled === false),
        `hidden route must disable every tool before child creation, tools=${JSON.stringify(result.tools)}`,
      );
    },
  },
  {
    name: "critical: interrupting route settle creates no child and preserves cancellation",
    run: async () => {
      const result = await runRouteSettle({ abortMs: 30, readyAfterLookups: Number.POSITIVE_INFINITY });
      assert(result.created === 0, `interrupt must not create an audit child, created=${result.created}`);
      assert(result.error != null, "interrupt must fail closed instead of succeeding a late route");
      assert(
        result.error?.name === "AbortError" || (result.error?.message ?? "").includes("cancelled"),
        `interrupt must surface cancellation, error=${result.error?.name}:${result.error?.message}`,
      );
    },
  },
  {
    name: "critical: exhausted hidden route stays capability-blocked with last cause and no child",
    run: async () => {
      const result = await runRouteSettle({ readyAfterLookups: Number.POSITIVE_INFINITY });
      assert(result.created === 0, `exhaustion must not create an audit child, created=${result.created}`);
      assert(result.lookups >= 2, `exhaustion must retry provider-free lookup, lookups=${result.lookups}`);
      assert(
        result.elapsedMs >= 4_500 && result.elapsedMs < 8_000,
        `exhaustion must stay inside the finite settle window, elapsedMs=${result.elapsedMs}`,
      );
      assert(
        (result.error?.message ?? "").includes(
          "Configured hidden completion arbiter route is unavailable after bounded readiness settle",
        ),
        `exhaustion must keep the capability-shaped wrapper, error=${result.error?.message ?? "none"}`,
      );
      const cause = (result.error as Error & { cause?: unknown } | null)?.cause;
      const causeMessage = cause instanceof Error ? cause.message : String(cause ?? "");
      assert(
        causeMessage.includes("Configured hidden completion arbiter route is unavailable"),
        `exhaustion must preserve the last route error as cause, cause=${causeMessage}`,
      );
    },
  },
  {
    name: "critical: abort during in-flight route lookup creates no child after late ready read",
    run: async () => {
      const result = await runRouteSettle({
        abortMs: 20,
        holdLookups: true,
        readyAfterLookups: 1,
        releaseHeldAfter: "abort",
      });
      assert(result.created === 0, `in-flight abort must not create an audit child, created=${result.created}`);
      assert(result.lookups >= 1, `in-flight abort must start a provider-free lookup, lookups=${result.lookups}`);
      assert(
        result.elapsedMs < 2_000,
        `in-flight abort must not wait out the settle window, elapsedMs=${result.elapsedMs}`,
      );
      assert(result.error != null, "in-flight abort must fail closed instead of returning a late route");
      assert(
        result.error?.name === "AbortError" || (result.error?.message ?? "").includes("cancelled"),
        `in-flight abort must surface cancellation, error=${result.error?.name}:${result.error?.message}`,
      );
    },
  },
  {
    name: "critical: hung route lookup cannot outlive settle or create a child after late ready read",
    run: async () => {
      const result = await runRouteSettle({
        holdLookups: true,
        readyAfterLookups: 1,
        releaseHeldAfter: "settle",
      });
      assert(result.created === 0, `hung lookup must not create an audit child, created=${result.created}`);
      assert(result.lookups >= 1, `hung lookup must start a provider-free attempt, lookups=${result.lookups}`);
      assert(
        result.elapsedMs >= 4_500 && result.elapsedMs < 8_000,
        `hung lookup must stay inside the finite settle window, elapsedMs=${result.elapsedMs}`,
      );
      assert(
        (result.error?.message ?? "").includes(
          "Configured hidden completion arbiter route is unavailable after bounded readiness settle",
        ),
        `hung lookup must keep the capability-shaped wrapper, error=${result.error?.message ?? "none"}`,
      );
      const cause = (result.error as Error & { cause?: unknown } | null)?.cause;
      const causeMessage = cause instanceof Error ? cause.message : String(cause ?? "");
      assert(
        causeMessage.includes("timed out"),
        `hung lookup must preserve the per-attempt deadline as cause, cause=${causeMessage}`,
      );
    },
  },
  {
    name: "critical: waiting terminal certificate rechecks and validates issued evidence across a transient guard turn",
    run: async () => {
      if (!isBunRuntime) {
        const self = fileURLToPath(import.meta.url);
        const result = spawnSync("bun", [self, TERMINAL_CERTIFICATE_RECHECK_ORACLE_FLAG], {
          cwd: path.resolve(path.dirname(self), ".."),
          encoding: "utf8",
          env: { ...process.env, OPENCODE_PROOF_TERMINAL_STAGE_STDERR: "1" },
          shell: false,
        });
        const combined = `${result.stdout ?? ""}\n${result.stderr ?? ""}`;
        assert(result.status === 0, `Bun terminal-certificate recheck oracle failed (status=${result.status}):\n${combined}`);
        assert(
          combined.includes("PASS critical: waiting terminal certificate rechecks and validates issued evidence across a transient guard turn"),
          `Bun terminal-certificate oracle did not report PASS:\n${combined}`,
        );
        assert(
          combined.includes("[session-completion-guard:terminal-stage]"),
          `Bun terminal-certificate oracle did not emit the proof-only stage record:\n${combined}`,
        );
        return;
      }

      const { SessionCompletionController } = await import(
        "../global/extensions/session-completion-guard/controller.ts"
      );
      const root = sessionFixture({ id: "session_root_certificate_recheck", directory: "." });
      const state = {
        ...initialRootState(root),
        grindEnabled: true,
        guardTurnPending: true,
        state: "settling-idle",
        terminalCertificate: {
          challenge: null,
          deadlineAt: Date.now() + 5_000,
          evidenceRefs: [],
          issuer: ROADMAP_MISSION_CERTIFICATE_ISSUER,
          reason: null,
          status: "waiting",
        },
      } as RootState;
      const controller = new SessionCompletionController(
        { client: { app: { log: async () => ({}) } }, directory: "." } as never,
        { auditWindow: { enabled: false }, settleMs: 10, statusToasts: false },
        {} as never,
      );
      const probe = controller as unknown as {
        childStatuses(state: RootState, statuses: Record<string, { type: string }>): Promise<Array<{ id: string; status: "idle" | "running" | "unknown" }>>;
        handleSettledIdle(state: RootState, expectedGeneration: number): Promise<void>;
        inspectRoot(state: RootState): Promise<RootInspection>;
        leases: AsyncLeaseRegistry;
        scheduleIdle(state: RootState, blockedRetry?: boolean): void;
        session(sessionID: string): Promise<Session>;
        sessionStatuses(): Promise<Record<string, { type: string }>>;
        tryTerminalCertificate(state: RootState, inspection: RootInspection): Promise<"accepted" | "fallback" | "waiting">;
      };
      probe.session = async () => state.root;

      await probe.handleSettledIdle(state, 0);
      if (state.settleTimer == null) {
        throw new Error("Transient guard turn must not drop the waiting certificate recheck.");
      }
      clearTimeout(state.settleTimer);
      state.settleTimer = null;

      state.root = {
        ...state.root,
        metadata: {
          ...(state.root.metadata ?? {}),
          roadmapMission: {
            certificateStatus: "issued",
            terminalCertificate: { disposition: "allow_stop" },
          },
        },
      };
      let validatorCalls = 0;
      let statusCalls = 0;
      probe.sessionStatuses = async () => ({
        [state.root.id]: { type: statusCalls++ === 0 ? "busy" : "idle" },
      });
      probe.childStatuses = async () => [];
      probe.inspectRoot = async () => ({
        revision: { leaseGeneration: 0, revisionDigest: "revision_certificate_recheck" },
      } as RootInspection);
      probe.tryTerminalCertificate = async () => {
        validatorCalls += 1;
        return "accepted";
      };
      await probe.handleSettledIdle(state, 0);
      if (state.settleTimer == null) {
        throw new Error("An issued certificate must retain a settle recheck after a transient busy status.");
      }
      clearTimeout(state.settleTimer);
      state.settleTimer = null;
      await probe.handleSettledIdle(state, 0);
      assert(validatorCalls === 1, "An issued certificate must reach the existing validator despite a transient guard turn.");

      validatorCalls = 0;
      probe.sessionStatuses = async () => ({ [state.root.id]: { type: "idle" } });
      const leaseProbe = probe.leases as unknown as {
        preflight(rootSessionID: string, managerSessions: PTYSessionInfo[], children: Array<{ id: string; status: "idle" | "running" | "unknown" }>): unknown;
      };
      const originalPreflight = leaseProbe.preflight;
      leaseProbe.preflight = () => ({ generation: 1, kind: "clear" });
      await probe.handleSettledIdle(state, 0);
      if (state.settleTimer == null) {
        throw new Error("An issued certificate must retain a settle recheck after preflight generation drift.");
      }
      clearTimeout(state.settleTimer);
      state.settleTimer = null;
      leaseProbe.preflight = originalPreflight;

      probe.inspectRoot = async () => ({
        revision: { leaseGeneration: 1, revisionDigest: "revision_certificate_drift" },
      } as RootInspection);
      await probe.handleSettledIdle(state, 0);
      if (state.settleTimer == null) {
        throw new Error("An issued certificate must retain a settle recheck after inspection generation drift.");
      }
      clearTimeout(state.settleTimer);
      state.settleTimer = null;

      probe.inspectRoot = async () => ({
        revision: { leaseGeneration: 0, revisionDigest: "revision_certificate_recheck" },
      } as RootInspection);
      await probe.handleSettledIdle(state, 0);
      assert(validatorCalls === 1, "Stable generation must reach terminal certificate validation exactly once.");

      const issuedRoot = state.root;
      state.root = {
        ...state.root,
        metadata: {
          ...(state.root.metadata ?? {}),
          roadmapMission: {
            certificateStatus: "pending",
            terminalCertificate: null,
          },
        },
      };
      validatorCalls = 0;
      probe.session = async () => issuedRoot;
      await probe.handleSettledIdle(state, 0);
      if (state.settleTimer != null) {
        clearTimeout(state.settleTimer);
        state.settleTimer = null;
      }
      assert(validatorCalls === 1, "A waiting certificate must refresh authoritative issued metadata before transient gating.");

      validatorCalls = 0;
      probe.scheduleIdle(state, true);
      await sleep(40);
      assert(state.settleTimer == null, "The scheduled terminal-certificate settle callback must finish.");
      assert(validatorCalls === 1, "The scheduled settle callback must reach stable certificate validation.");
      assert(
        [...state.terminalDiagnosticStages].some((stage) => stage.endsWith(":settle-fired")),
        "Terminal diagnostics must record actual settle timer delivery.",
      );
      assert(
        [...state.terminalDiagnosticStages].some((stage) => stage.endsWith(":validator-accepted")),
        "Terminal diagnostics must record validator entry and result.",
      );
    },
  },
  {
    name: "critical: repeated certified status persists a changed revision while suppressing duplicate toast",
    run: async () => {
      const root = sessionFixture({ id: "session_root_repeated_certified_status" });
      const state = {
        ...initialRootState(root),
        grindEnabled: true,
      } as RootState;
      let storedMetadata: Record<string, unknown> = { ...(root.metadata ?? {}) };
      let updateCalls = 0;
      let toastCalls = 0;
      const reporter = new GuardStatusReporter({
        client: {
          session: {
            get: async () => ({ data: { ...root, metadata: storedMetadata } }),
            update: async (args: { metadata?: unknown }) => {
              updateCalls += 1;
              storedMetadata = args.metadata as Record<string, unknown>;
              return { data: { ...root, metadata: storedMetadata } };
            },
          },
          tui: {
            showToast: async () => {
              toastCalls += 1;
              return {};
            },
          },
        } as never,
        statusToasts: true,
        log: async () => { /* ignore */ },
      });

      state.lastAuditedRevision = "revision_proposal";
      state.terminalCertificate = {
        challenge: null,
        deadlineAt: null,
        evidenceRefs: ["proposal-evidence"],
        issuer: ROADMAP_MISSION_CERTIFICATE_ISSUER,
        reason: null,
        status: "accepted",
      };
      await reporter.set(state, "passed", "Completion guard passed (certified)", "success");

      state.state = "settling-idle";
      state.terminalCertificate = {
        challenge: createTerminalCertificateChallenge({
          issuer: ROADMAP_MISSION_CERTIFICATE_ISSUER,
          leaseGeneration: 0,
          requirementIds: ["1"],
          revisionDigest: "revision_apply",
          rootRef: hashRef("session", root.id),
        }),
        deadlineAt: Date.now() + 5_000,
        evidenceRefs: [],
        issuer: ROADMAP_MISSION_CERTIFICATE_ISSUER,
        reason: null,
        status: "waiting",
      };
      await reporter.persist(state);

      state.lastAuditedRevision = "revision_apply";
      state.terminalCertificate = {
        challenge: null,
        deadlineAt: null,
        evidenceRefs: ["apply-evidence"],
        issuer: ROADMAP_MISSION_CERTIFICATE_ISSUER,
        reason: null,
        status: "accepted",
      };
      await reporter.set(state, "passed", "Completion guard passed (certified)", "success");

      const guard = storedMetadata.completionGuard as Record<string, unknown>;
      const certificate = guard.terminalCertificate as Record<string, unknown>;
      assert(updateCalls === 3, `Both certified revisions and the waiting transition must persist; updates=${updateCalls}.`);
      assert(toastCalls === 1, `Repeated certified status must suppress only duplicate toast; toasts=${toastCalls}.`);
      assert(guard.state === "passed", "Second certified revision must persist passed state.");
      assert(guard.lastAuditedRevision === "revision_apply", "Second certified revision must replace proposal revision.");
      assert(certificate.status === "accepted", "Second certified certificate must replace durable waiting state.");
    },
  },
  {
    name: "critical: guard status persistence preserves a concurrently issued terminal certificate",
    run: async () => {
      const root = sessionFixture({
        id: "session_root_status_certificate",
        metadata: {
          roadmapMission: {
            certificateReason: null,
            certificateStatus: "pending",
            terminalCertificate: null,
          },
        },
      });
      const state = {
        ...initialRootState(root),
        grindEnabled: true,
        state: "settling-idle",
      } as RootState;
      const certificate = {
        challengeRef: "challenge_external",
        disposition: "allow_stop",
        issuer: "roadmap-mission-session-executor",
        requirementIds: ["artifact:proposal"],
      };
      let storedMetadata: Record<string, unknown> = {
        ...(root.metadata ?? {}),
        roadmapMission: {
          certificateReason: null,
          certificateStatus: "issued",
          terminalCertificate: certificate,
        },
      };
      let getCalls = 0;
      const reporter = new GuardStatusReporter({
        client: {
          session: {
            get: async () => {
              getCalls += 1;
              return { data: { ...root, metadata: storedMetadata } };
            },
            update: async (args: { metadata?: unknown }) => {
              storedMetadata = args.metadata as Record<string, unknown>;
              return { data: { ...root, metadata: storedMetadata } };
            },
          },
          tui: { showToast: async () => undefined },
        } as never,
        statusToasts: false,
        log: async () => { /* ignore */ },
      });

      const persisted = await reporter.persist(state);
      const mission = storedMetadata.roadmapMission as Record<string, unknown>;
      assert(persisted === true, "Status write with an external certificate must converge.");
      assert(getCalls === 1, `Status write must refresh metadata exactly once, got ${getCalls}.`);
      assert(mission.certificateStatus === "issued", "Status write must not restore stale pending certificate status.");
      assert(mission.terminalCertificate === certificate, "Status write must preserve the externally issued certificate.");
      assert(storedMetadata.completionGuard != null, "Status write must still persist completion-guard metadata.");
    },
  },
  {
    name: "critical: status persistence terminates after eight non-converging passes",
    run: async () => {
      const root = sessionFixture({ id: "session_root_status_bound" });
      const state = {
        ...initialRootState(root),
        grindEnabled: true,
        state: "running",
      } as RootState;
      let updateCalls = 0;
      let exhaustLogs = 0;
      const reporter = new GuardStatusReporter({
        client: {
          session: {
            get: async () => ({ data: state.root }),
            update: async (args: { metadata?: unknown }) => {
              updateCalls += 1;
              state.continuationCycles += 1;
              return { data: { ...root, metadata: args.metadata } };
            },
          },
          tui: { showToast: async () => undefined },
        } as never,
        statusToasts: false,
        log: async (_level, message) => {
          if (message === "guard status persistence exhausted") exhaustLogs += 1;
        },
      });
      const persisted = await reporter.persist(state);
      assert(persisted === false, "Continuous mutation must not report convergence.");
      assert(updateCalls === STATUS_CONVERGENCE_PASSES, `Expected ${STATUS_CONVERGENCE_PASSES} passes, got ${updateCalls}`);
      assert(exhaustLogs === 1, "Exhaustion must emit one diagnostic.");
    },
  },
  {
    name: "critical: arbiter scheduler enforces two active, 32 queued, overflow, and revision cancel",
    run: async () => {
      const scheduler = new ArbiterScheduler(2, 32);
      const first = await scheduler.acquire("root-a", "epoch-a");
      const second = await scheduler.acquire("root-b", "epoch-b");
      assert(first === "acquired" && second === "acquired", "First two roots must acquire.");
      assert(scheduler.activeCount === 2, "Active count must stay at two.");
      const waiting: Array<Promise<string>> = [];
      for (let index = 0; index < 32; index += 1) {
        waiting.push(scheduler.acquire(`root-q-${index}`, `epoch-q-${index}`));
      }
      assert(scheduler.queuedCount === 32, "Queue must hold 32 roots.");
      const overflow = await scheduler.acquire("root-overflow", "epoch-overflow");
      assert(overflow === "overload", "33rd queued root must be rejected.");
      void scheduler.acquire("root-q-0", "epoch-q-0-rev");
      const original = await waiting[0];
      assert(original === "cancelled", "Revision must cancel the queued epoch.");
      scheduler.release("root-a", "epoch-a");
      const promoted = await waiting[1];
      assert(promoted === "acquired", "FIFO must promote the next queued root.");
      assert(scheduler.activeCount === 2, "Promotion must not create a third active slot.");
      assert(scheduler.queuedCount === 31, "Revised epoch must remain queued behind earlier FIFO entries.");
    },
  },
];

const onlyRunauditOracle = process.argv.includes(RUNAUDIT_DISABLE_ORACLE_FLAG);
const onlyQuestionReplyOracle = process.argv.includes(QUESTION_REPLY_DISABLE_ORACLE_FLAG);
const onlyRetryAmplificationOracle = process.argv.includes(RETRY_PROMPT_AMPLIFICATION_ORACLE_FLAG);
const onlyTerminalCertificateRecheckOracle = process.argv.includes(TERMINAL_CERTIFICATE_RECHECK_ORACLE_FLAG);
const selectedTests = onlyRunauditOracle
  ? tests.filter((test) => test.name.includes("in-flight runAudit must not call arbiter prompt"))
  : onlyQuestionReplyOracle
    ? tests.filter((test) => test.name.includes("in-flight official question reply must not apply"))
    : onlyRetryAmplificationOracle
      ? tests.filter((test) => test.name.includes("same-epoch arbiter retry must not re-embed completionEvidence"))
      : onlyTerminalCertificateRecheckOracle
        ? tests.filter((test) => test.name.includes("waiting terminal certificate rechecks and validates issued evidence"))
        : tests;

let failed = 0;
for (const test of selectedTests) {
  try {
    await test.run();
    console.log(`PASS ${test.name}`);
  } catch (error) {
    failed++;
    const message = error instanceof Error ? error.message : String(error);
    console.error(`FAIL ${test.name}`);
    console.error(message);
  }
}

if (failed > 0) {
  process.exit(1);
}

console.log(`OK: session completion guard tests=${selectedTests.length}`);
