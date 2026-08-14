#!/usr/bin/env bun
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { Session } from "../../global/node_modules/@opencode-ai/sdk/dist/v2/index.js";
import { ensureArbiterChild } from "../../global/extensions/session-completion-guard/arbiter-child.ts";
import { hashRef } from "../../global/plugin/session-delivery-context/redaction.ts";
import { initialRootState, stableDigest } from "../../global/extensions/session-completion-guard/runtime-support.ts";
import type { AuditEpoch } from "../../global/extensions/session-completion-guard/types.ts";

type Mode = "baseline" | "candidate";
type Options = { candidateId: string; evidenceRoot: string; help: boolean; mode: Mode };
type RuntimeStatus = "busy" | "idle" | "retry";
type ScenarioKind = "busy" | "current" | "old-idle" | "ownership" | "recent" | "unknown";

const sourceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const runnerPath = fileURLToPath(import.meta.url);
const sourcePaths = [
  "global/extensions/session-completion-guard/arbiter-child.ts",
  "global/extensions/session-completion-guard/arbiter-route.ts",
  "global/extensions/session-completion-guard/runtime-support.ts",
  "global/extensions/session-completion-guard/types.ts",
  "tools/proofs/session-completion-guard-retention-recovery.ts",
] as const;
const retentionError = "Retained completion arbiter child limit reached with no eligible terminal child";
const promptTimeoutMs = 120_000;

function usage(): string {
  return [
    "Usage:",
    "  bun tools/proofs/session-completion-guard-retention-recovery.ts --help",
    "  bun tools/proofs/session-completion-guard-retention-recovery.ts --mode baseline|candidate --candidate-id <id> --evidence-root <absolute-new-path>",
    "",
    "Modes:",
    "  baseline   Prove the unchanged retention deadlock without mutating protected controls.",
    "  candidate  Prove safe stale quarantine, rotation, and protected controls.",
  ].join("\n");
}

function requiredValue(args: string[], index: number, option: string): string {
  const value = args[index + 1];
  if (value == null || value.trim() === "" || value.startsWith("--")) throw new Error(`Missing value for ${option}`);
  return value;
}

function parseArgs(args: string[]): Options {
  if (args[0] === "--help" || args[0] === "-h") return { candidateId: "help", evidenceRoot: "", help: true, mode: "baseline" };
  let candidateId = "";
  let evidenceRoot = "";
  let mode: Mode | null = null;
  for (let index = 0; index < args.length; index++) {
    const arg = args[index];
    if (arg === "--candidate-id") {
      candidateId = requiredValue(args, index, arg);
      index++;
    } else if (arg === "--evidence-root") {
      evidenceRoot = requiredValue(args, index, arg);
      index++;
    } else if (arg === "--mode") {
      const value = requiredValue(args, index, arg);
      if (value !== "baseline" && value !== "candidate") throw new Error("--mode must be baseline or candidate");
      mode = value;
      index++;
    } else {
      throw new Error(`Unknown option: ${arg}`);
    }
  }
  if (mode == null) throw new Error("--mode is required");
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]{0,99}$/.test(candidateId)) throw new Error("--candidate-id must be a safe identifier");
  if (!path.isAbsolute(evidenceRoot)) throw new Error("--evidence-root must be absolute");
  return { candidateId, evidenceRoot: path.resolve(evidenceRoot), help: false, mode };
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function digest(file: string): string {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
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
  fs.writeFileSync(file, json(value), { encoding: "utf8", flag: "wx" });
}

function session(id: string, directory: string, parentID: string | undefined, updated: number, metadata?: Record<string, unknown>): Session {
  return {
    id,
    ...(parentID == null ? {} : { parentID }),
    projectID: "guard-retention-recovery-proof",
    directory,
    title: id,
    version: "1",
    time: { created: updated, updated },
    ...(metadata == null ? {} : { metadata }),
  } as Session;
}

async function runScenario(kind: ScenarioKind) {
  const directory = "D:/disposable/guard-retention-recovery";
  const rootID = `session_retention_${kind}`;
  const rootRef = hashRef("session", rootID);
  const now = Date.now();
  const old = now - promptTimeoutMs - 10_000;
  const recent = now - 1_000;
  const guardMetadata = (auditID: string, status = "auditing", ref = rootRef) => ({
    completionGuard: { auditID, rootSessionRef: ref, status },
  });
  const root = session(rootID, directory, undefined, old);
  const unrelated = session(`child-${kind}-unrelated`, directory, rootID, old);
  const wrongOwner = session(`child-${kind}-wrong-owner`, directory, rootID, old, guardMetadata("audit-wrong", "auditing", "session_wrong_owner"));
  const first = session(`child-${kind}-first`, directory, rootID, kind === "recent" ? recent : old, guardMetadata(kind === "current" ? "audit-current" : "audit-first"));
  const second = session(`child-${kind}-second`, directory, rootID, kind === "recent" ? recent + 1 : old + 1, guardMetadata("audit-second"));
  const createdID = `child-${kind}-created`;
  const values = new Map([first, second, unrelated, wrongOwner].map((value) => [value.id, value]));
  const statuses: Record<string, { type: RuntimeStatus }> = kind === "busy" || kind === "ownership"
    ? { [first.id]: { type: "busy" }, [second.id]: { type: "busy" } }
    : {};
  const updates: Array<{ id: string; status: unknown }> = [];
  const deleted: string[] = [];
  const created: string[] = [];
  const children = kind === "ownership" ? [first, second, wrongOwner, unrelated] : [first, second, unrelated];
  const client = {
    tool: { ids: async () => ({ data: ["read", "bash"] }) },
    v2: { agent: { list: async () => ({ data: { data: [{ id: "session-completion-arbiter", hidden: true, model: { providerID: "proof", id: "model" } }] } }) } },
    provider: { list: async () => ({ data: { all: [{ id: "proof", models: { model: {} } }], connected: ["proof"] } }) },
    session: {
      children: async () => ({ data: children.filter((child) => values.has(child.id)) }),
      get: async ({ sessionID }: { sessionID: string }) => ({ data: values.get(sessionID) }),
      status: async () => kind === "unknown"
        ? { error: { name: "StatusUnavailable", message: "proof status unavailable" } }
        : { data: statuses },
      update: async ({ sessionID, metadata }: { sessionID: string; metadata?: Session["metadata"] }) => {
        const current = values.get(sessionID);
        if (current == null) throw new Error(`Unknown proof session ${sessionID}`);
        const next = { ...current, metadata, time: { ...current.time, updated: Date.now() } };
        values.set(sessionID, next);
        updates.push({ id: sessionID, status: (metadata as Record<string, Record<string, unknown>> | undefined)?.completionGuard?.status });
        return { data: next };
      },
      delete: async ({ sessionID }: { sessionID: string }) => {
        deleted.push(sessionID);
        values.delete(sessionID);
        return { data: true };
      },
      create: async (args: { metadata: Session["metadata"] }) => {
        created.push(createdID);
        const value = session(createdID, directory, rootID, now, args.metadata as Record<string, unknown>);
        values.set(value.id, value);
        return { data: value };
      },
    },
  };
  const revisionBase = { assistantRef: "none", diffDigest: "none", humanRef: "none", journalDigest: "none", leaseGeneration: 0, todoDigest: "none" };
  const epoch: AuditEpoch = {
    auditID: "audit-current",
    attempt: 1,
    childSessionID: kind === "current" ? first.id : null,
    completionEvidence: null,
    inspected: { ...revisionBase, revisionDigest: stableDigest(revisionBase) },
    kind: "completion",
    questionRequest: null,
    rootRef,
    rootSessionID: rootID,
  };
  let error: string | null = null;
  try {
    await ensureArbiterChild(
      client as never,
      directory,
      "session-completion-arbiter",
      { ...initialRootState(root), grindEnabled: true },
      epoch,
      2,
      promptTimeoutMs,
    );
  } catch (cause) {
    error = cause instanceof Error ? cause.message : String(cause);
  }
  return {
    created,
    deleted,
    error,
    kind,
    preserved: {
      unrelated: values.has(unrelated.id),
      wrongOwner: values.has(wrongOwner.id),
    },
    statuses: Object.fromEntries([...values].map(([id, value]) => [id, (value.metadata as Record<string, Record<string, unknown>> | undefined)?.completionGuard?.status ?? null])),
    updates,
  };
}

function evaluate(mode: Mode, scenarios: Awaited<ReturnType<typeof runScenario>>[]): Record<string, unknown> {
  const byKind = Object.fromEntries(scenarios.map((scenario) => [scenario.kind, scenario]));
  const blocked = ["busy", "ownership", "recent"] as const;
  for (const kind of blocked) {
    const scenario = byKind[kind];
    assert(scenario.error === retentionError, `${kind} must preserve the retention conflict`);
    assert(scenario.created.length === 0 && scenario.deleted.length === 0 && scenario.updates.length === 0, `${kind} must not mutate sessions`);
    assert(scenario.preserved.unrelated && scenario.preserved.wrongOwner, `${kind} must preserve unrelated ownership`);
  }
  const unknown = byKind.unknown;
  assert(unknown.error === "session.status audit retention failed", "unknown status request must preserve its owning failure");
  assert(unknown.created.length === 0 && unknown.deleted.length === 0 && unknown.updates.length === 0, "unknown status request must not mutate sessions");
  assert(unknown.preserved.unrelated && unknown.preserved.wrongOwner, "unknown status request must preserve unrelated ownership");
  const current = byKind.current;
  assert(current.error == null && current.created.length === 0 && current.deleted.length === 0, "current epoch child must be reused without rotation");
  assert(current.updates.length === 1 && current.updates[0]?.id === "child-current-first" && current.updates[0]?.status === "auditing", "current epoch update must remain scoped to itself");
  const oldIdle = byKind["old-idle"];
  if (mode === "baseline") {
    assert(oldIdle.error === retentionError, "baseline must reproduce the exact old-idle retention conflict");
    assert(oldIdle.created.length === 0 && oldIdle.deleted.length === 0 && oldIdle.updates.length === 0, "baseline old-idle scenario must not mutate sessions");
  } else {
    assert(oldIdle.error == null, `candidate old-idle recovery failed: ${oldIdle.error ?? "unknown"}`);
    assert(oldIdle.created.length === 1, "candidate must create exactly one replacement audit child");
    assert(oldIdle.deleted.length === 1 && oldIdle.deleted[0] === "child-old-idle-first", "candidate must rotate only the oldest eligible interrupted child");
    assert(oldIdle.updates.some((entry) => entry.id === "child-old-idle-first" && entry.status === "stale"), "candidate must mark the rotated interrupted child stale before deletion");
    assert(oldIdle.preserved.unrelated && oldIdle.preserved.wrongOwner, "candidate must preserve unrelated ownership");
  }
  return {
    baselineDeadlockReproduced: mode === "baseline",
    candidateRecovered: mode === "candidate",
    currentEpochPreserved: true,
    protectedControls: [...blocked, "unknown"],
    status: "passed",
  };
}

async function run(options: Options): Promise<void> {
  if (options.help) {
    console.log(usage());
    return;
  }
  if (fs.existsSync(options.evidenceRoot)) throw new Error("Evidence root already exists");
  const scenarios = await Promise.all((["busy", "current", "old-idle", "ownership", "recent", "unknown"] as const).map(runScenario));
  const evaluation = evaluate(options.mode, scenarios);
  fs.mkdirSync(options.evidenceRoot, { recursive: false });
  writeNew(path.join(options.evidenceRoot, "raw.json"), {
    candidateId: options.candidateId,
    cleanup: "complete",
    environment: { bun: Bun.version, platform: process.platform },
    mode: options.mode,
    scenarios,
    schemaVersion: 1,
    sources: sourcePaths.map((relative) => ({ path: relative, sha256: digest(path.join(sourceRoot, relative)) })),
  });
  writeNew(path.join(options.evidenceRoot, "evaluation.json"), {
    candidateId: options.candidateId,
    cleanup: "complete",
    ...evaluation,
    mode: options.mode,
    schemaVersion: 1,
  });
  console.log(json({ candidateId: options.candidateId, evidenceRoot: "<evidence-root>", mode: options.mode, status: "passed" }).trimEnd());
}

run(parseArgs(process.argv.slice(2))).catch((error) => {
  console.error(json({ error: error instanceof Error ? error.message : String(error), status: "blocked" }).trimEnd());
  process.exitCode = 1;
});
