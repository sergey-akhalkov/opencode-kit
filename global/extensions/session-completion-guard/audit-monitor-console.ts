import crypto from "node:crypto";
import {
  readMonitorHandoff,
  type MonitorConnection,
} from "./audit-monitor-handoff.ts";
import {
  openMonitorStorage,
  type MonitorSession,
} from "./audit-monitor-storage.ts";

const POLL_MS = 500;
const MAX_FAILURES = 5;
const DELETE_CLOSE_MS = 2_000;

function hashRef(prefix: string, value: unknown): string {
  const normalized = typeof value === "string" && value !== "" ? value : "<missing>";
  return `${prefix}_${crypto.createHash("sha256").update(normalized).digest("hex").slice(0, 12)}`;
}

function record(value: unknown): Record<string, unknown> | null {
  return value != null && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

function text(value: unknown, fallback = "-"): string {
  return typeof value === "string" && value !== "" ? value.slice(0, 500) : fallback;
}

function integer(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isInteger(value) ? value : fallback;
}

function requiredEnvironment(name: string): string {
  const value = process.env[name];
  if (value == null || value === "") throw new Error(`Missing monitor environment: ${name}`);
  return value;
}

async function monitorConnection(): Promise<MonitorConnection> {
  const handoffIndex = process.argv.indexOf("--handoff");
  if (handoffIndex >= 0) {
    const pipeName = process.argv[handoffIndex + 1];
    if (pipeName == null || pipeName === "") throw new Error("Missing guard monitor handoff name");
    return readMonitorHandoff(pipeName);
  }
  return {
    closePassedAfterMs: Math.max(
      0,
      Number.parseInt(process.env.OPENCODE_GUARD_MONITOR_CLOSE_PASSED_MS ?? "15000", 10),
    ),
    databasePath: requiredEnvironment("OPENCODE_GUARD_MONITOR_DATABASE"),
    rootSessionID: requiredEnvironment("OPENCODE_GUARD_MONITOR_ROOT_ID"),
  };
}

function errorTag(error: unknown): string {
  let current = error;
  for (let depth = 0; depth < 5 && current != null; depth += 1) {
    const value = record(current);
    const tag = value?.code ?? value?._tag ?? value?.name;
    if (typeof tag === "string" && tag !== "Error" && tag !== "TypeError") return tag.slice(0, 100);
    current = value?.cause;
  }
  return text(record(error)?.name, "UnknownError");
}

function latestAuditChild(children: MonitorSession[], rootRef: string): MonitorSession | null {
  return children
    .filter((child) => record(child.metadata?.completionGuard)?.rootSessionRef === rootRef)
    .sort((left, right) => integer(right.time?.updated, 0) - integer(left.time?.updated, 0))[0] ?? null;
}

function stateView(
  root: MonitorSession,
  children: MonitorSession[],
  closePassedAfterMs: number,
  now: number,
  terminalSince: number | null,
) {
  const guard = record(root.metadata?.completionGuard) ?? {};
  const rootRef = text(guard.rootRef, hashRef("session", root.id));
  const child = latestAuditChild(children, rootRef);
  const audit = record(child?.metadata?.completionGuard) ?? {};
  const state = text(guard.state, "unknown");
  const passedRemaining = state === "passed" && terminalSince != null
    ? Math.max(0, closePassedAfterMs - (now - terminalSince))
    : null;
  const model = child?.model == null
    ? "-"
    : `${text(child.model.providerID)}/${text(child.model.id)}${child.model.variant == null ? "" : `/${text(child.model.variant)}`}`;
  return {
    key: JSON.stringify({
      state,
      message: guard.message,
      auditID: audit.auditID,
      status: audit.status,
      attempt: audit.attempt,
      verdict: audit.verdict,
      questionRef: audit.questionRef,
      passedSeconds: passedRemaining == null ? null : Math.ceil(passedRemaining / 1_000),
    }),
    lines: [
      "OpenCode Completion Guard",
      "=========================",
      `Root:       ${rootRef}`,
      `State:      ${state}`,
      `Message:    ${text(guard.message)}`,
      `Audit:      ${audit.auditID == null ? "-" : hashRef("audit", String(audit.auditID))}`,
      `Child:      ${child == null ? "-" : hashRef("session", child.id)}`,
      `Kind:       ${text(audit.kind)}`,
      `Question:   ${text(audit.questionRef)}`,
      `Model:      ${model}`,
      `Attempt:    ${integer(audit.attempt, 0)}`,
      `Audit state:${audit.status == null ? " -" : ` ${text(audit.status)}`}`,
      `Verdict:    ${text(audit.verdict)}`,
      `Requirements:${audit.requirementCount == null ? " -" : ` ${integer(audit.requirementCount, 0)}`}`,
      `Unresolved: ${audit.unresolvedCount == null ? "-" : integer(audit.unresolvedCount, 0)}`,
      `Confidence: ${text(audit.confidence)}`,
      "",
      "This window is read-only. Closing it does not affect the guard.",
      ...(passedRemaining == null ? [] : ["", `Closing in ${Math.ceil(passedRemaining / 1_000)}s...`]),
    ],
    passedRemaining,
    state,
  };
}

function render(lines: string[]): void {
  if (process.stdout.isTTY) process.stdout.write("\u001b[2J\u001b[H");
  process.stdout.write(`${lines.join("\n")}\n`);
}

const connection = await monitorConnection();
const rootSessionID = text(connection.rootSessionID, "");
const databasePath = text(connection.databasePath, "");
if (rootSessionID === "" || databasePath === "") throw new Error("Guard monitor handoff is missing root context");
const closePassedAfterMs = Math.max(0, integer(connection.closePassedAfterMs, 15_000));
const storage = openMonitorStorage(databasePath);

let failures = 0;
let lastKey: string | null = null;
let terminalSince: number | null = null;
let deletedSince: number | null = null;

for (;;) {
  const now = Date.now();
  try {
    const snapshot = storage.read(rootSessionID);
    failures = 0;
    if (snapshot.root == null) {
      deletedSince ??= now;
      const remaining = Math.ceil(Math.max(0, DELETE_CLOSE_MS - (now - deletedSince)) / 1_000);
      const key = `deleted:${remaining}`;
      if (key !== lastKey) {
        render([
          "OpenCode Completion Guard",
          "=========================",
          `Root:  ${hashRef("session", rootSessionID)}`,
          "State: session-deleted",
          "",
          "Closing monitor...",
        ]);
        lastKey = key;
      }
      if (now - deletedSince >= DELETE_CLOSE_MS) process.exit(0);
      await new Promise((resolve) => setTimeout(resolve, POLL_MS));
      continue;
    }
    deletedSince = null;
    const root = snapshot.root;
    const state = text(record(root.metadata?.completionGuard)?.state, "unknown");
    terminalSince = state === "passed" ? (terminalSince ?? now) : null;
    const view = stateView(root, snapshot.children, closePassedAfterMs, now, terminalSince);
    if (view.key !== lastKey) {
      render(view.lines);
      lastKey = view.key;
    }
    if (view.passedRemaining != null && view.passedRemaining <= 0) process.exit(0);
  } catch (error) {
    const tag = errorTag(error);
    failures += 1;
    const key = `failure:${tag}:${failures}`;
    if (key !== lastKey) {
      render([
        "OpenCode Completion Guard",
        "=========================",
        `Root:  ${hashRef("session", rootSessionID)}`,
        "State: monitor-disconnected",
        `Cause: ${tag}`,
        `Retry: ${failures}/${MAX_FAILURES}`,
        "",
        "Guard behavior is unaffected.",
      ]);
      lastKey = key;
    }
    if (failures >= MAX_FAILURES) process.exit(1);
  }
  await new Promise((resolve) => setTimeout(resolve, POLL_MS));
}
