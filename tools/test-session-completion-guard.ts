#!/usr/bin/env node
/**
 * Critical regression oracles for session-completion-guard pure modules.
 * Exercises lease preflight, verdict correlation, stop detection, synthetic
 * continuation provenance, grind opt-in defaults, disable late-effect gates,
 * and main permission defaults without model/server I/O.
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
import {
  applyPermissionAllow,
  initialRootState,
  parseGuardOptions,
} from "../global/extensions/session-completion-guard/runtime-support.ts";
import { GuardAuditMonitorLauncher } from "../global/extensions/session-completion-guard/audit-monitor.ts";
import { GuardStatusReporter } from "../global/extensions/session-completion-guard/status.ts";
import {
  buildContinuation,
  parseCompletionVerdict,
  parseCompletionVerdictText,
} from "../global/extensions/session-completion-guard/verdict.ts";
import type { AuditEpoch, CompletionVerdict, RootState } from "../global/extensions/session-completion-guard/types.ts";
import { hashRef } from "../global/plugin/session-delivery-context/redaction.ts";

const RUNAUDIT_DISABLE_ORACLE_FLAG = "--oracle-runaudit-disable-race";
const QUESTION_CORRECTION_DISABLE_ORACLE_FLAG = "--oracle-question-correction-disable-race";
const RETRY_PROMPT_AMPLIFICATION_ORACLE_FLAG = "--oracle-retry-prompt-amplification";
const isBunRuntime = typeof (globalThis as { Bun?: unknown }).Bun !== "undefined";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function writeMinimalSessionDatabase(dbPath: string, rootSessionID: string): Promise<void> {
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
    questionRequestID: null,
    rootRef: "session_abcdef123456",
    rootSessionID: "session_root_secret",
    ...overrides,
  };
}

function validVerdict(overrides: Partial<CompletionVerdict> = {}): CompletionVerdict {
  return {
    auditID: "audit_fixture_1",
    confidence: "high",
    evidenceGaps: [],
    evidenceRefs: ["evidence_1"],
    goalSummary: "Complete the accepted task",
    inspectedRevision: "revision_1",
    ownerBoundary: null,
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

const tests: TestCase[] = [
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
        { agent: "build", model: { providerID: "xai", modelID: "grok-4.5" }, tools: null, variant: "high" },
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
    name: "critical: permission allow normalizes top-level and every configured agent",
    run: () => {
      const config: {
        permission?: unknown;
        agent?: Record<string, { permission?: unknown } | null | undefined>;
      } = {
        permission: { bash: "ask", edit: "ask" },
        agent: {
          build: { permission: "ask" },
          "session-completion-arbiter": {
            permission: { edit: "deny", task: "deny", question: "deny" },
          },
          "sdet-quality-engineer": { permission: { bash: "deny", edit: "ask" } },
          unused: null,
        },
      };
      applyPermissionAllow(config as never);
      assert(config.permission === "allow", "Top-level permission must become allow.");
      for (const [name, agent] of Object.entries(config.agent ?? {})) {
        if (agent == null) continue;
        assert(
          agent.permission === "allow",
          `Configured agent ${name} permission must become allow.`,
        );
      }
      assert(config.agent?.unused == null, "Null agent entries must remain null.");
    },
  },
  {
    name: "critical: guard options default to session-completion-arbiter route",
    run: () => {
      const options = parseGuardOptions({});
      assert(options.arbiterAgent === "session-completion-arbiter", "Default arbiter agent must be session-completion-arbiter.");
      assert(options.enabled === true, "Guard must default enabled.");
      assert(options.settleMs >= 0, "Settle window must be non-negative.");
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
                  model: { providerID: "xai", id: "grok-4.5" },
                }],
              },
            }),
          },
        },
        provider: {
          list: async () => ({
            data: {
              all: [{ id: "xai", models: { "grok-4.5": { id: "grok-4.5" } } }],
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
        questionRequestID: null,
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
      state.pendingQuestionCorrection = null;
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
    name: "critical: in-flight question correction must not continue root after grind disable",
    run: async () => {
      // Same Bun boundary as runAudit oracle: controller pulls bun-pty.
      if (!isBunRuntime) {
        const self = fileURLToPath(import.meta.url);
        const result = spawnSync("bun", [self, QUESTION_CORRECTION_DISABLE_ORACLE_FLAG], {
          cwd: path.resolve(path.dirname(self), ".."),
          encoding: "utf8",
          shell: false,
        });
        const combined = `${result.stdout ?? ""}\n${result.stderr ?? ""}`;
        assert(
          result.status === 0,
          `Bun question-correction disable-race oracle failed (status=${result.status}):\n${combined}`,
        );
        assert(
          combined.includes("PASS critical: in-flight question correction must not continue root after grind disable"),
          `Bun oracle did not report PASS:\n${combined}`,
        );
        return;
      }

      const { SessionCompletionController } = await import(
        "../global/extensions/session-completion-guard/controller.ts"
      );
      const rootID = "session_root_qcorr_disable";
      let root: Session = sessionFixture({ id: rootID, directory: "." });
      let promptAsyncCalls = 0;
      let sawAbortSignal = false;
      let releasePrompt!: () => void;
      const promptGate = new Promise<void>((resolve) => {
        releasePrompt = resolve;
      });
      let promptEntered = false;

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
          promptAsync: async (
            _body: unknown,
            opts?: { signal?: AbortSignal },
          ) => {
            promptEntered = true;
            promptAsyncCalls += 1;
            if (opts?.signal != null) sawAbortSignal = true;
            await promptGate;
            if (opts?.signal?.aborted) {
              const error = new Error("aborted") as Error & { name: string };
              error.name = "AbortError";
              throw error;
            }
            return {};
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
        cancelAudit(state: RootState, next?: RootState["state"]): void;
        deliverQuestionCorrection(state: RootState): Promise<void>;
        leases: AsyncLeaseRegistry;
        ptyFallback: { clearRoot(rootSessionID: string): void };
        roots: Map<string, RootState>;
      };
      const probe = controller as unknown as ControllerProbe;

      const state: RootState = {
        ...initialRootState(root),
        grindEnabled: true,
        pendingQuestionCorrection: "question_ref_fixture",
        state: "question-pending",
      };
      probe.roots.set(rootID, state);

      const runPromise = probe.deliverQuestionCorrection(state);
      await sleep(40);
      assert(promptEntered, "question correction must reach promptAsync before disable injection.");

      // Mirror /disable-grind while the unabortable promptAsync is in flight.
      state.controlTurnPending = true;
      state.guardTurnPending = true;
      state.paused = false;
      state.pendingQuestionCorrection = null;
      probe.cancelAudit(state, "disabled");
      state.grindEnabled = false;
      state.questions.clear();
      probe.leases.clearRoot(rootID);
      probe.ptyFallback.clearRoot(rootID);
      state.state = "disabled";

      releasePrompt();
      let thrown: unknown = null;
      try {
        await runPromise;
      } catch (error) {
        thrown = error;
      }

      assert(
        state.grindEnabled === false,
        "Disable must leave grindEnabled false after question-correction race.",
      );
      assert(
        state.state === "disabled",
        `Late question-correction completion must not revive disabled root (got state=${state.state}, promptAsyncCalls=${promptAsyncCalls}, sawAbortSignal=${sawAbortSignal}, thrown=${thrown instanceof Error ? thrown.name : String(thrown)})`,
      );
      assert(
        state.activeAudit == null,
        "Question-correction race must not leave an active audit epoch.",
      );
      // Guard-owned root continuation after disable is non-deferrable. Either the in-flight
      // promptAsync is abort-linked (cancelAudit aborts it) or it must not run at all once
      // disable has flipped local state. Completing without abort linkage after disable is red.
      if (promptAsyncCalls > 0 && !sawAbortSignal && thrown == null) {
        throw new Error(
          `Unabortable question-correction promptAsync completed after disable (promptAsyncCalls=${promptAsyncCalls}); disable must cancel guard-owned root continuation`,
        );
      }
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
                  rootSessionRef: rootRef,
                  inspectedRevision: "will-be-rewritten",
                  verdict: "owner_required",
                  confidence: "high",
                  goalSummary: "Need owner decision",
                  evidenceGaps: [],
                  evidenceRefs: [],
                  ownerBoundary: null,
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
                rootSessionRef: rootRef,
                inspectedRevision: "will-be-rewritten",
                verdict: "allow_stop",
                confidence: "high",
                goalSummary: "Accepted outcome complete",
                evidenceGaps: [],
                evidenceRefs: ["evidence_1"],
                ownerBoundary: null,
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
                    model: { providerID: "xai", id: "grok-4.5" },
                  }],
                },
              }),
            },
          },
          provider: {
            list: async () => ({
              data: {
                all: [{ id: "xai", models: { "grok-4.5": { id: "grok-4.5" } } }],
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
          questionRequestID: null,
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
];

const onlyRunauditOracle = process.argv.includes(RUNAUDIT_DISABLE_ORACLE_FLAG);
const onlyQuestionCorrectionOracle = process.argv.includes(QUESTION_CORRECTION_DISABLE_ORACLE_FLAG);
const onlyRetryAmplificationOracle = process.argv.includes(RETRY_PROMPT_AMPLIFICATION_ORACLE_FLAG);
const selectedTests = onlyRunauditOracle
  ? tests.filter((test) => test.name.includes("in-flight runAudit must not call arbiter prompt"))
  : onlyQuestionCorrectionOracle
    ? tests.filter((test) => test.name.includes("in-flight question correction must not continue root"))
    : onlyRetryAmplificationOracle
      ? tests.filter((test) => test.name.includes("same-epoch arbiter retry must not re-embed completionEvidence"))
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
