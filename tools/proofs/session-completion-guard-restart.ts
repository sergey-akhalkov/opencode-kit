#!/usr/bin/env bun
import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { SessionCompletionController } from "../../global/extensions/session-completion-guard/controller.ts";
import { hashRef } from "../../global/plugin/session-delivery-context/redaction.ts";
import { proofClient, requestData } from "./lib/opencode-proof-client.ts";

type Scenario = "retention" | "retention-preflight" | "retention-recovery" | "retry";
type Options = { candidateId: string; evidenceRoot: string; help: boolean; scenario: Scenario };
const sourceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const runnerPath = fileURLToPath(import.meta.url);

function required(args: string[], index: number, option: string): string {
  const value = args[index + 1];
  if (value == null || value.trim() === "" || value.startsWith("--")) throw new Error(`Missing value for ${option}`);
  return value;
}

function usage(): string {
  return [
    "Usage:",
    "  bun tools/proofs/session-completion-guard-restart.ts --help",
    "  bun tools/proofs/session-completion-guard-restart.ts --candidate-id <id> --evidence-root <absolute-new-path> [--scenario retry|retention-preflight|retention-recovery|retention]",
    "",
    "Scenarios:",
    "  retry       Prove persisted bounded retry resumes in the same child (default).",
    "  retention-preflight   Capture canonical idle status for realistic interrupted child seeds only.",
    "  retention-recovery    Capture one loaded stale rotation and stop before repeat restart.",
    "  retention   Prove old idle interrupted children recover across two loaded restarts.",
  ].join("\n");
}

function options(args: string[]): Options {
  if (args[0] === "--help" || args[0] === "-h") return { candidateId: "help", evidenceRoot: "", help: true, scenario: "retry" };
  let candidateId = "";
  let evidenceRoot = "";
  let scenario: Scenario = "retry";
  for (let index = 0; index < args.length; index++) {
    if (args[index] === "--candidate-id") {
      candidateId = required(args, index, args[index]);
      index++;
    } else if (args[index] === "--evidence-root") {
      evidenceRoot = required(args, index, args[index]);
      index++;
    } else if (args[index] === "--scenario") {
      const value = required(args, index, args[index]);
      if (value !== "retention" && value !== "retention-preflight" && value !== "retention-recovery" && value !== "retry") throw new Error("Scenario must be retry, retention-preflight, retention-recovery, or retention");
      scenario = value;
      index++;
    } else throw new Error(`Unknown option: ${args[index]}`);
  }
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]{0,99}$/.test(candidateId)) throw new Error("Invalid candidate id");
  if (!path.isAbsolute(evidenceRoot)) throw new Error("Evidence root must be absolute");
  return { candidateId, evidenceRoot: path.resolve(evidenceRoot), help: false, scenario };
}

function record(value: unknown): Record<string, unknown> | null {
  return value != null && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null;
}

function stable(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stable);
  if (value == null || typeof value !== "object") return value;
  const input = value as Record<string, unknown>;
  return Object.fromEntries(Object.keys(input).sort().map((key) => [key, stable(input[key])]));
}

function json(value: unknown): string { return `${JSON.stringify(stable(value), null, 2)}\n`; }
function assert(value: unknown, message: string): asserts value { if (!value) throw new Error(message); }
function stage(name: string): void { console.error(JSON.stringify({ stage: name })); }

async function boundedRequestData<T>(request: Promise<unknown>, label: string, timeoutMs = 15_000): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | null = null;
  try {
    return await Promise.race([
      requestData<T>(request, label),
      new Promise<never>((_resolve, reject) => {
        timer = setTimeout(() => reject(new Error(`${label} timed out after ${timeoutMs}ms`)), timeoutMs);
      }),
    ]);
  } finally {
    if (timer != null) clearTimeout(timer);
  }
}

async function freePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      const port = typeof address === "object" && address != null ? address.port : 0;
      server.close((error) => error == null ? resolve(port) : reject(error));
    });
  });
}

function contentText(value: unknown): string {
  if (typeof value === "string") return value;
  if (!Array.isArray(value)) return "";
  return value.map((part) => typeof part === "string" ? part : String(record(part)?.text ?? "")).join("\n");
}

function completion(text: string): Response {
  const payload = {
    id: `chatcmpl_${crypto.randomUUID()}`,
    object: "chat.completion",
    created: Math.floor(Date.now() / 1000),
    model: "proof-model",
    choices: [{ index: 0, message: { role: "assistant", content: text }, finish_reason: "stop" }],
    usage: { prompt_tokens: 10, completion_tokens: 10, total_tokens: 20 },
  };
  return Response.json(payload);
}

function streamingCompletion(text: string): Response {
  const id = `chatcmpl_${crypto.randomUUID()}`;
  const created = Math.floor(Date.now() / 1000);
  const chunks = [
    { id, object: "chat.completion.chunk", created, model: "proof-model", choices: [{ index: 0, delta: { role: "assistant", content: text }, finish_reason: null }] },
    { id, object: "chat.completion.chunk", created, model: "proof-model", choices: [{ index: 0, delta: {}, finish_reason: "stop" }] },
  ];
  return new Response(`${chunks.map((chunk) => `data: ${JSON.stringify(chunk)}\n\n`).join("")}data: [DONE]\n\n`, {
    headers: { "content-type": "text/event-stream" },
  });
}

function simulator() {
  let arbiterCalls = 0;
  let arbiterOutage = true;
  let primaryCalls = 0;
  const requestKinds: string[] = [];
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
      const messages = Array.isArray(body.messages) ? body.messages.map(record).filter(Boolean) : [];
      const text = messages.map((message) => contentText(message?.content)).join("\n");
      const auditMatch = text.match(/<completion_audit_request>\s*([\s\S]*?)\s*<\/completion_audit_request>/);
      const retryMatch = text.match(/<completion_audit_retry>\s*([\s\S]*?)\s*<\/completion_audit_retry>/);
      if (auditMatch == null && retryMatch == null) {
        primaryCalls += 1;
        requestKinds.push("primary");
        return completion("The bounded local task is complete.");
      }
      arbiterCalls += 1;
      requestKinds.push(`arbiter-${arbiterCalls}`);
      if (arbiterOutage) return Response.json({ error: { message: "temporary proof outage", type: "server_error" } }, { status: 503 });
      const audit = JSON.parse((auditMatch ?? retryMatch)![1]) as Record<string, unknown>;
      const verdict = JSON.stringify({
        schemaVersion: 1,
        auditID: audit.auditID,
        rootSessionRef: audit.rootSessionRef,
        inspectedRevision: audit.inspectedRevision,
        verdict: "allow_stop",
        confidence: "high",
        goalSummary: "Disposable restart proof complete",
        requirementMatrix: [],
        unresolved: [],
        ownerBoundary: null,
        questionAnswers: null,
        evidenceGaps: [],
        evidenceRefs: [],
        strategyAssessment: { fingerprint: "restart-proof", prohibitedStrategies: [], repeated: false, requiredRetryEvidence: [] },
      });
      return body.stream === true ? streamingCompletion(verdict) : completion(verdict);
    },
  });
  return {
    server,
    facts: () => ({ arbiterCalls, primaryCalls, requestKinds }),
    recover: () => { arbiterOutage = false; },
  };
}

async function offlineUnlockPreflight(): Promise<void> {
  let releaseList!: (value: unknown) => void;
  const list = new Promise((resolve) => { releaseList = resolve; });
  const controller = new SessionCompletionController(
    { client: { app: { log: async () => ({ data: true }) } }, directory: sourceRoot } as never,
    { auditWindow: { enabled: false }, statusToasts: false },
    { v2: { session: { list: async () => list } } } as never,
  );
  const hooks = await Promise.race([
    controller.start(),
    Bun.sleep(1_000).then(() => { throw new Error("Plugin hooks blocked on startup reconciliation"); }),
  ]);
  releaseList({ data: { cursor: {}, data: [] } });
  await Bun.sleep(25);
  await hooks.dispose?.();

  const transport = simulator();
  try {
    transport.recover();
    const response = await fetch(`http://${transport.server.hostname}:${transport.server.port}/v1/chat/completions`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ messages: [{ role: "user", content: [
        "<completion_audit_retry>",
        JSON.stringify({ auditID: "audit_offline", rootSessionRef: "session_offline", inspectedRevision: "revision_offline" }),
        "</completion_audit_retry>",
      ].join("\n") }] }),
    });
    const payload = await response.json() as Record<string, unknown>;
    const choice = record(Array.isArray(payload.choices) ? payload.choices[0] : null);
    const message = record(choice?.message);
    const verdict = JSON.parse(String(message?.content ?? "")) as Record<string, unknown>;
    assert(verdict.auditID === "audit_offline" && verdict.inspectedRevision === "revision_offline", "Retry envelope preflight lost correlation");
  } finally {
    transport.server.stop(true);
  }
}

function writeConfig(configDir: string, dataDir: string, providerUrl: string, scenario: Scenario = "retry"): void {
  fs.mkdirSync(path.join(configDir, "agents"), { recursive: true });
  fs.copyFileSync(
    path.join(sourceRoot, "global", "agents", "session-completion-arbiter.md"),
    path.join(configDir, "agents", "session-completion-arbiter.md"),
  );
  const bridge = pathToFileURL(path.join(sourceRoot, "global", "extensions", "opencode-pty-bridge.ts")).href;
  const guard = pathToFileURL(path.join(sourceRoot, "global", "extensions", "session-completion-guard.ts")).href;
  fs.writeFileSync(path.join(configDir, "opencode.json"), json({
    $schema: "https://opencode.ai/config.json",
    model: "proof/proof-model",
    small_model: "proof/proof-model",
    agent: {
      "session-completion-arbiter": {
        hidden: true,
        mode: "subagent",
        model: "proof/proof-model",
      },
    },
    provider: {
      proof: {
        npm: "@ai-sdk/openai-compatible",
        name: "Guard Restart Proof",
        options: { apiKey: "proof-not-secret", baseURL: `${providerUrl}/v1`, maxRetries: 0 },
        models: { "proof-model": { name: "Proof Model", tool_call: true, limit: { context: 100000, output: 10000 } } },
      },
    },
    plugin: [bridge, [guard, {
      arbiterAgent: "session-completion-arbiter",
      arbiterPromptTimeoutMs: scenario === "retry" ? 5_000 : 2_000,
      auditWindow: { enabled: false, mode: "read-only-monitor", scope: "per-root", terminal: "powershell-shell" },
      enabled: true,
      initialDelayMs: 10_000,
      maxCycles: 3,
      maxDelayMs: 10_000,
      maxRequestBytes: 200_000,
      maxRetryAttempts: 2,
      maxWaitRechecks: 3,
      retainAuditSessions: 2,
      retryMultiplier: 1,
      settleMs: scenario === "retry" ? 50 : 2_000,
      statusToasts: false,
      strategyFallback: "docs/session-strategy-history",
      waitRecheckMs: 100,
    }]],
  }), "utf8");
  fs.writeFileSync(path.join(configDir, "package.json"), json({ private: true, type: "module" }), "utf8");
  fs.mkdirSync(dataDir, { recursive: true });
}

type ServerProcess = { child: ChildProcessWithoutNullStreams; stderr: string[]; stdout: string[]; url: string };

async function startOpenCode(configDir: string, dataDir: string, project: string): Promise<ServerProcess> {
  const port = await freePort();
  const child = spawn("opencode", ["serve", "--hostname", "127.0.0.1", "--port", String(port), "--print-logs", "--log-level", "INFO"], {
    cwd: project,
    env: {
      ...process.env,
      OPENCODE_CONFIG_DIR: configDir,
      XDG_CACHE_HOME: path.join(dataDir, "cache"),
      XDG_DATA_HOME: path.join(dataDir, "data"),
      XDG_STATE_HOME: path.join(dataDir, "state"),
    },
    shell: false,
    stdio: "pipe",
  });
  const stdout: string[] = [];
  const stderr: string[] = [];
  child.stdout.on("data", (chunk) => stdout.push(String(chunk)));
  child.stderr.on("data", (chunk) => stderr.push(String(chunk)));
  const url = `http://127.0.0.1:${port}`;
  const client = proofClient(url, project);
  const deadline = Date.now() + 30_000;
  let lastError: unknown = null;
  while (Date.now() < deadline) {
    if (child.exitCode != null) throw new Error(`OpenCode server exited ${child.exitCode}: ${stderr.join("").slice(-1_000)}`);
    try {
      await boundedRequestData(client.v2.agent.list({ location: { directory: project } }), "server agent readiness", 5_000);
      await boundedRequestData(client.session.status({ directory: project }), "server session readiness", 15_000);
      return { child, stderr, stdout, url };
    } catch (error) {
      lastError = error;
      await Bun.sleep(100);
    }
  }
  await stopOpenCode({ child, stderr, stdout, url });
  throw new Error(`OpenCode server readiness timed out: ${lastError instanceof Error ? lastError.message : String(lastError)}`);
}

async function stopOpenCode(server: ServerProcess): Promise<void> {
  if (server.child.exitCode != null) return;
  const exited = new Promise<void>((resolve) => server.child.once("exit", () => resolve()));
  server.child.kill();
  const graceful = await Promise.race([exited.then(() => true), Bun.sleep(10_000).then(() => false)]);
  if (graceful) return;
  spawnSync("taskkill", ["/PID", String(server.child.pid), "/T", "/F"], { shell: false, stdio: "ignore" });
  const forced = await Promise.race([exited.then(() => true), Bun.sleep(10_000).then(() => false)]);
  if (!forced) throw new Error("OpenCode server did not stop after forced termination");
}

async function waitGuard(client: ReturnType<typeof proofClient>, rootID: string, project: string, states: string[], timeoutMs: number) {
  const deadline = Date.now() + timeoutMs;
  let lastGuard: Record<string, unknown> = {};
  while (Date.now() < deadline) {
    const root = await boundedRequestData<Record<string, unknown>>(client.session.get({ sessionID: rootID, directory: project }), "guard root");
    const guard = record(record(root.metadata)?.completionGuard) ?? {};
    lastGuard = guard;
    if (states.includes(String(guard.state))) return { guard, root };
    await Bun.sleep(100);
  }
  throw new Error(`Guard did not reach ${states.join("|")}; last=${JSON.stringify({
    keys: Object.keys(lastGuard).sort(),
    state: lastGuard.state ?? null,
    message: lastGuard.message ?? null,
    restartRecoveryAction: lastGuard.restartRecoveryAction ?? null,
  })}`);
}

async function waitRetryChild(client: ReturnType<typeof proofClient>, rootID: string, project: string, timeoutMs: number) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const children = await requestData<Array<Record<string, unknown>>>(
      client.session.children({ sessionID: rootID, directory: project }),
      "retry child",
    );
    const retrying = children.find((child) => record(record(child.metadata)?.completionGuard)?.status === "retrying");
    if (retrying != null) return { child: retrying, children };
    await Bun.sleep(50);
  }
  throw new Error("Retry child metadata did not converge");
}

function proofFixture(opts: Options): string {
  return path.join(os.tmpdir(), `guard-restart-proof-${opts.scenario}-${opts.candidateId}`);
}

async function runRetry(opts: Options): Promise<void> {
  if (fs.existsSync(opts.evidenceRoot)) throw new Error("Evidence root already exists");
  await offlineUnlockPreflight();
  const fixture = proofFixture(opts);
  fs.mkdirSync(fixture, { recursive: false });
  const configDir = path.join(fixture, "config");
  const dataDir = path.join(fixture, "data");
  const project = path.join(fixture, "project");
  fs.mkdirSync(project, { recursive: true });
  fs.writeFileSync(path.join(project, "AGENTS.md"), "# Disposable restart proof\n", "utf8");
  const provider = simulator();
  writeConfig(configDir, dataDir, `http://${provider.server.hostname}:${provider.server.port}`, opts.scenario);
  const serverLogs: Array<{ ordinal: number; stderr: string; stdout: string }> = [];
  let server: ServerProcess | null = null;
  let rootID: string | null = null;
  let proofError: unknown = null;
  let listDiagnostic: Record<string, unknown> | null = null;
  let childDiagnostic: unknown = null;
  try {
    server = await startOpenCode(configDir, dataDir, project);
    fs.writeFileSync(path.join(fixture, "server-pid.json"), json({ pid: server.child.pid }), "utf8");
    stage("server-1-ready");
    let client = proofClient(server.url, project);
    const root = await requestData<Record<string, unknown>>(client.session.create({
      directory: project,
      title: "guard restart proof",
      metadata: { completionGuard: { grindEnabled: true, state: "running" } },
    }), "root create");
    rootID = String(root.id);
    const prompt = await requestData<{ info: Record<string, unknown> }>(client.session.prompt({
      sessionID: rootID,
      directory: project,
      model: { providerID: "proof", modelID: "proof-model" },
      system: "Return one short completion sentence and stop. Do not call tools.",
      tools: {},
      parts: [{ type: "text", text: "Complete the disposable local proof task." }],
    }), "root prompt");
    if (prompt.info.error != null) throw new Error("Primary proof prompt failed");
    const before = await waitGuard(client, rootID, project, ["audit-retrying"], 20_000);
    const retryBefore = await waitRetryChild(client, rootID, project, 5_000);
    stage("retry-persisted");
    const childrenBefore = retryBefore.children;
    const fullRetryBefore = await requestData<Record<string, unknown>>(
      client.session.get({ sessionID: String(retryBefore.child.id), directory: project }),
      "full retry child",
    );
    const auditBefore = record(record(fullRetryBefore.metadata)?.completionGuard) ?? {};
    assert(
      auditBefore.status === "retrying" &&
      typeof auditBefore.auditID === "string" &&
      typeof auditBefore.rootSessionRef === "string",
      "First server must persist one fully correlated retrying guard child",
    );
    await stopOpenCode(server);
    fs.rmSync(path.join(fixture, "server-pid.json"), { force: true });
    serverLogs.push({ ordinal: 1, stderr: server.stderr.join(""), stdout: server.stdout.join("") });
    provider.recover();
    server = await startOpenCode(configDir, dataDir, project);
    fs.writeFileSync(path.join(fixture, "server-pid.json"), json({ pid: server.child.pid }), "utf8");
    stage("server-2-ready");
    client = proofClient(server.url, project);
    const listed = await requestData<unknown>(
      client.v2.session.list({ directory: project, roots: true, limit: 500 }),
      "restart session list diagnostic",
    );
    const listedRecord = record(listed);
    const listedRows = Array.isArray(listed)
      ? listed
      : Array.isArray(listedRecord?.data)
        ? listedRecord.data
        : Array.isArray(record(listedRecord?.data)?.data)
          ? record(listedRecord?.data)!.data as unknown[]
          : [];
    const proofRows = listedRows.map(record).filter((row) => row?.title === "guard restart proof");
    listDiagnostic = {
      count: listedRows.length,
      keys: listedRecord == null ? [] : Object.keys(listedRecord).sort(),
      proofMatches: proofRows.length,
      proofMetadataKeys: proofRows.map((row) => Object.keys(record(record(row?.metadata)?.completionGuard) ?? {}).sort()),
    };
    const after = await waitGuard(client, rootID, project, ["passed", "error"], 30_000);
    stage(`terminal-${String(after.guard.state)}`);
    const childrenAfter = await requestData<Array<Record<string, unknown>>>(client.session.children({ sessionID: rootID, directory: project }), "children after restart");
    if (after.guard.state === "error") {
      const stored = await requestData<Array<{ info: Record<string, unknown>; parts: unknown[] }>>(
        client.session.messages({ sessionID: String(retryBefore.child.id), directory: project }),
        "failed recovered child messages",
      );
      childDiagnostic = stored.map((message) => ({
        errorName: String(record(message.info.error)?.name ?? ""),
        finish: message.info.finish ?? null,
        role: message.info.role ?? null,
        parts: message.parts.map((part) => {
          const value = record(part) ?? {};
          const text = typeof value.text === "string" ? value.text : "";
          let jsonKeys: string[] = [];
          try { jsonKeys = Object.keys(JSON.parse(text) as Record<string, unknown>).sort(); } catch { /* structural diagnostic only */ }
          return { jsonKeys, textChars: text.length, type: value.type ?? null };
        }),
      }));
    }
    assert(after.guard.state === "passed", `Recovered guard must pass, got ${String(after.guard.state)}`);
    const guardChildrenAfter = childrenAfter.filter((child) => record(record(child.metadata)?.completionGuard)?.auditID === auditBefore.auditID);
    assert(guardChildrenAfter.length === 1 && guardChildrenAfter[0]?.id === retryBefore.child.id, "Restart must reuse the same retained child");
    const fullRetryAfter = await requestData<Record<string, unknown>>(
      client.session.get({ sessionID: String(guardChildrenAfter[0]?.id), directory: project }),
      "full recovered child",
    );
    const auditAfter = record(record(fullRetryAfter.metadata)?.completionGuard) ?? {};
    assert(auditAfter.auditID === auditBefore.auditID, "Restart must preserve audit correlation");
    assert(Number(auditAfter.attempt) === 2, `Restart must preserve and advance bounded attempt, got ${String(auditAfter.attempt)}`);
    assert(after.guard.restartRecoveryAction === "resume-bounded-retry-after-settle", "Root must persist the restart recovery action");
    fs.mkdirSync(opts.evidenceRoot, { recursive: false });
    fs.writeFileSync(path.join(opts.evidenceRoot, "raw.json"), json({
      candidateId: opts.candidateId,
      cleanup: "pending",
      environment: { openCode: String(root.version ?? "unknown"), platform: process.platform },
      provider: provider.facts(),
      restart: {
        attemptAfter: auditAfter.attempt,
        attemptBefore: auditBefore.attempt,
        auditPreserved: auditAfter.auditID === auditBefore.auditID,
        childReused: guardChildrenAfter[0]?.id === retryBefore.child.id,
        nonGuardChildrenObserved: Math.max(0, childrenBefore.length - 1),
        rootStateAfter: after.guard.state,
        rootStateBefore: before.guard.state,
      },
      schemaVersion: 1,
      serverLogs: serverLogs.map((entry) => ({ ordinal: entry.ordinal, stderrChars: entry.stderr.length, stdoutChars: entry.stdout.length })),
    }), "utf8");
  } catch (error) {
    proofError = error;
    const stderr = server?.stderr.join("") ?? "";
    const sanitized = stderr
      .replaceAll(fixture.replaceAll("\\", "\\\\"), "<fixture>")
      .replaceAll(sourceRoot.replaceAll("\\", "\\\\"), "<source-root>")
      .replaceAll(os.homedir().replaceAll("\\", "\\\\"), "<home>")
      .replaceAll(fixture, "<fixture>")
      .replaceAll(sourceRoot, "<source-root>")
      .replaceAll(os.homedir(), "<home>")
      .slice(-4_000);
    const wrapped = new Error(`${error instanceof Error ? error.message : String(error)}; child=${JSON.stringify(childDiagnostic)}; list=${JSON.stringify(listDiagnostic)}; provider=${JSON.stringify(provider.facts())}; server=${JSON.stringify(sanitized)}`);
    throw wrapped;
  } finally {
    if (server != null) {
      try {
        if (rootID != null) {
          const client = proofClient(server.url, project);
          const children = await requestData<Array<Record<string, unknown>>>(client.session.children({ sessionID: rootID, directory: project }), "cleanup children");
          for (const child of children) await client.session.delete({ sessionID: String(child.id), directory: project });
          await client.session.delete({ sessionID: rootID, directory: project });
        }
      } finally {
        await stopOpenCode(server);
        fs.rmSync(path.join(fixture, "server-pid.json"), { force: true });
        serverLogs.push({ ordinal: serverLogs.length + 1, stderr: server.stderr.join(""), stdout: server.stdout.join("") });
      }
    }
    provider.server.stop(true);
    fs.rmSync(fixture, { recursive: true, force: true });
    stage("cleanup-complete");
    if (fs.existsSync(path.join(opts.evidenceRoot, "raw.json"))) {
      const raw = JSON.parse(fs.readFileSync(path.join(opts.evidenceRoot, "raw.json"), "utf8")) as Record<string, unknown>;
      raw.cleanup = "complete";
      fs.writeFileSync(path.join(opts.evidenceRoot, "raw.json"), json(raw), "utf8");
    } else if (proofError == null) throw new Error("Restart proof did not publish evidence");
  }
  stage("capture-complete");
}

async function runRetention(opts: Options): Promise<void> {
  if (fs.existsSync(opts.evidenceRoot)) throw new Error("Evidence root already exists");
  await offlineUnlockPreflight();
  const fixture = proofFixture(opts);
  fs.mkdirSync(fixture, { recursive: false });
  const configDir = path.join(fixture, "config");
  const dataDir = path.join(fixture, "data");
  const project = path.join(fixture, "project");
  fs.mkdirSync(project, { recursive: true });
  fs.writeFileSync(path.join(project, "AGENTS.md"), "# Disposable retention restart proof\n", "utf8");
  const provider = simulator();
  provider.recover();
  writeConfig(configDir, dataDir, `http://${provider.server.hostname}:${provider.server.port}`, opts.scenario);
  const serverLogs: Array<{ ordinal: number; retentionError: boolean; stderrChars: number; stdoutChars: number }> = [];
  let server: ServerProcess | null = null;
  let rootID: string | null = null;
  let proofError: unknown = null;
  let seedStatusTypes: string[] = [];
  let currentStage = "setup";
  try {
    server = await startOpenCode(configDir, dataDir, project);
    fs.writeFileSync(path.join(fixture, "server-pid.json"), json({ pid: server.child.pid }), "utf8");
    currentStage = "retention-server-1-ready";
    stage("retention-server-1-ready");
    let client = proofClient(server.url, project);
    const root = await boundedRequestData<Record<string, unknown>>(client.session.create({
      directory: project,
      title: "guard retention restart proof",
      metadata: { completionGuard: { grindEnabled: false, state: "disabled" } },
    }), "retention root create");
    rootID = String(root.id);
    const rootRef = hashRef("session", rootID);
    const interrupted: string[] = [];
    for (const ordinal of [1, 2]) {
      const child = await boundedRequestData<Record<string, unknown>>(client.session.create({
        directory: project,
        parentID: rootID,
        title: `interrupted retention audit ${ordinal}`,
        metadata: {
          completionGuard: {
            schemaVersion: 1,
            auditID: `audit_interrupted_${ordinal}`,
            rootSessionRef: rootRef,
            inspectedRevision: `revision_interrupted_${ordinal}`,
            kind: "completion",
            status: "auditing",
            attempt: 1,
          },
        },
      }), `interrupted child ${ordinal} create`);
      const childID = String(child.id);
      interrupted.push(childID);
      const seedPrompt = await boundedRequestData<{ info: Record<string, unknown> }>(client.session.prompt({
        sessionID: childID,
        directory: project,
        model: { providerID: "proof", modelID: "proof-model" },
        system: "Return one short completion sentence and stop. Do not call tools.",
        tools: {},
        parts: [{ type: "text", text: `Complete interrupted audit seed ${ordinal}.` }],
      }), `interrupted child ${ordinal} prompt`);
      if (seedPrompt.info.error != null) throw new Error(`Interrupted child ${ordinal} seed prompt failed`);
    }
    const seedStatuses = await boundedRequestData<Record<string, { type: string }>>(client.session.status({ directory: project }), "interrupted seed statuses");
    seedStatusTypes = interrupted.map((id) => String(seedStatuses[id]?.type ?? "absent-idle"));
    assert(seedStatusTypes.every((status) => status === "absent-idle" || status === "idle"), `Interrupted seed children must be canonically idle, got ${seedStatusTypes.join(",")}`);
    if (opts.scenario === "retention-preflight") {
      fs.mkdirSync(opts.evidenceRoot, { recursive: false });
      fs.writeFileSync(path.join(opts.evidenceRoot, "raw.json"), json({
        candidateId: opts.candidateId,
        cleanup: "pending",
        environment: { openCode: String(root.version ?? "unknown"), platform: process.platform },
        provider: provider.facts(),
        scenario: opts.scenario,
        schemaVersion: 1,
        seedStatusTypes,
      }), "utf8");
      return;
    }
    const unrelated = await boundedRequestData<Record<string, unknown>>(client.session.create({
      directory: project,
      parentID: rootID,
      title: "unrelated retained child",
    }), "unrelated child create");
    await boundedRequestData(client.session.update({
      sessionID: rootID,
      directory: project,
      metadata: { completionGuard: { grindEnabled: true, state: "running" } },
    }), "enable retention root");
    await stopOpenCode(server);
    fs.rmSync(path.join(fixture, "server-pid.json"), { force: true });
    serverLogs.push({
      ordinal: 1,
      retentionError: `${server.stdout.join("")}\n${server.stderr.join("")}`.includes("Retained completion arbiter child limit reached"),
      stderrChars: server.stderr.join("").length,
      stdoutChars: server.stdout.join("").length,
    });
    server = null;
    await Bun.sleep(2_500);

    server = await startOpenCode(configDir, dataDir, project);
    fs.writeFileSync(path.join(fixture, "server-pid.json"), json({ pid: server.child.pid }), "utf8");
    currentStage = "retention-server-2-ready";
    stage("retention-server-2-ready");
    client = proofClient(server.url, project);
    const recovered = await waitGuard(client, rootID, project, ["passed", "error"], 30_000);
    assert(recovered.guard.state === "passed", `Retention recovery must pass, got ${String(recovered.guard.state)}`);
    currentStage = "retention-recovery-passed";
    const childrenAfterRecovery = await boundedRequestData<Array<Record<string, unknown>>>(
      client.session.children({ sessionID: rootID, directory: project }),
      "children after retention recovery",
    );
    const interruptedAfterRecovery = interrupted.filter((id) => childrenAfterRecovery.some((child) => child.id === id));
    const guardAfterRecovery = childrenAfterRecovery.filter((child) =>
      record(record(child.metadata)?.completionGuard)?.rootSessionRef === rootRef
    );
    assert(interruptedAfterRecovery.length === 1, "Retention recovery must rotate exactly one interrupted child");
    assert(childrenAfterRecovery.some((child) => child.id === unrelated.id), "Retention recovery must preserve the unrelated child");
    assert(guardAfterRecovery.length === 2, `Retention recovery must preserve finite capacity, got ${guardAfterRecovery.length}`);
    assert(
      guardAfterRecovery.some((child) => record(record(child.metadata)?.completionGuard)?.status === "passed"),
      "Retention recovery must complete one replacement audit",
    );
    const callsAfterRecovery = provider.facts().arbiterCalls;
    assert(callsAfterRecovery >= 1, "Retention recovery must reach the arbiter boundary");
    serverLogs.push({
      ordinal: 2,
      retentionError: `${server.stdout.join("")}\n${server.stderr.join("")}`.includes("Retained completion arbiter child limit reached"),
      stderrChars: server.stderr.join("").length,
      stdoutChars: server.stdout.join("").length,
    });
    if (opts.scenario === "retention-recovery") {
      assert(serverLogs.every((entry) => !entry.retentionError), "Loaded retention recovery emitted the original retention-limit error");
      fs.mkdirSync(opts.evidenceRoot, { recursive: false });
      fs.writeFileSync(path.join(opts.evidenceRoot, "raw.json"), json({
        candidateId: opts.candidateId,
        cleanup: "pending",
        environment: { openCode: String(root.version ?? "unknown"), platform: process.platform },
        provider: provider.facts(),
        retention: {
          guardChildrenAfterRecovery: guardAfterRecovery.length,
          interruptedChildrenAfterRecovery: interruptedAfterRecovery.length,
          recoveryState: recovered.guard.state,
          seedStatusTypes,
          unrelatedPreservedAfterRecovery: childrenAfterRecovery.some((child) => child.id === unrelated.id),
        },
        scenario: opts.scenario,
        schemaVersion: 1,
        serverLogs,
      }), "utf8");
      return;
    }
    await stopOpenCode(server);
    fs.rmSync(path.join(fixture, "server-pid.json"), { force: true });
    server = null;

    server = await startOpenCode(configDir, dataDir, project);
    fs.writeFileSync(path.join(fixture, "server-pid.json"), json({ pid: server.child.pid }), "utf8");
    currentStage = "retention-server-3-ready";
    stage("retention-server-3-ready");
    client = proofClient(server.url, project);
    const callDeadline = Date.now() + 30_000;
    while (provider.facts().arbiterCalls <= callsAfterRecovery && Date.now() < callDeadline) await Bun.sleep(100);
    assert(provider.facts().arbiterCalls > callsAfterRecovery, "Verification restart must reach a later arbiter boundary");
    const verified = await waitGuard(client, rootID, project, ["passed", "error"], 10_000);
    assert(verified.guard.state === "passed", `Verification restart must pass, got ${String(verified.guard.state)}`);
    currentStage = "retention-verification-passed";
    const childrenAfterVerification = await boundedRequestData<Array<Record<string, unknown>>>(
      client.session.children({ sessionID: rootID, directory: project }),
      "children after verification restart",
    );
    const guardAfterVerification = childrenAfterVerification.filter((child) =>
      record(record(child.metadata)?.completionGuard)?.rootSessionRef === rootRef
    );
    assert(guardAfterVerification.length === 2, `Verification restart must retain exactly two guard children, got ${guardAfterVerification.length}`);
    assert(childrenAfterVerification.some((child) => child.id === unrelated.id), "Verification restart must preserve the unrelated child");
    serverLogs.push({
      ordinal: 3,
      retentionError: `${server.stdout.join("")}\n${server.stderr.join("")}`.includes("Retained completion arbiter child limit reached"),
      stderrChars: server.stderr.join("").length,
      stdoutChars: server.stdout.join("").length,
    });
    assert(serverLogs.every((entry) => !entry.retentionError), "Loaded retention recovery emitted the original retention-limit error");
    fs.mkdirSync(opts.evidenceRoot, { recursive: false });
    fs.writeFileSync(path.join(opts.evidenceRoot, "raw.json"), json({
      candidateId: opts.candidateId,
      cleanup: "pending",
      environment: { openCode: String(root.version ?? "unknown"), platform: process.platform },
      provider: provider.facts(),
      retention: {
        guardChildrenAfterRecovery: guardAfterRecovery.length,
        guardChildrenAfterVerification: guardAfterVerification.length,
        interruptedChildrenAfterRecovery: interruptedAfterRecovery.length,
        unrelatedPreservedAfterRecovery: childrenAfterRecovery.some((child) => child.id === unrelated.id),
        unrelatedPreservedAfterVerification: childrenAfterVerification.some((child) => child.id === unrelated.id),
        recoveryState: recovered.guard.state,
        verificationState: verified.guard.state,
        seedStatusTypes,
      },
      scenario: opts.scenario,
      schemaVersion: 1,
      serverLogs,
    }), "utf8");
  } catch (error) {
    proofError = error;
    const stderr = server?.stderr.join("") ?? "";
    const sanitized = stderr
      .replaceAll(fixture.replaceAll("\\", "\\\\"), "<fixture>")
      .replaceAll(sourceRoot.replaceAll("\\", "\\\\"), "<source-root>")
      .replaceAll(os.homedir().replaceAll("\\", "\\\\"), "<home>")
      .replaceAll(fixture, "<fixture>")
      .replaceAll(sourceRoot, "<source-root>")
      .replaceAll(os.homedir(), "<home>")
      .slice(-4_000);
    if (!fs.existsSync(opts.evidenceRoot)) fs.mkdirSync(opts.evidenceRoot, { recursive: false });
    fs.writeFileSync(path.join(opts.evidenceRoot, "failure.json"), json({
      candidateId: opts.candidateId,
      cleanup: "pending",
      error: error instanceof Error ? error.message : String(error),
      provider: provider.facts(),
      scenario: opts.scenario,
      schemaVersion: 1,
      serverLogTail: sanitized,
      stage: currentStage,
      status: "failed",
    }), { encoding: "utf8", flag: "wx" });
    throw new Error(`${error instanceof Error ? error.message : String(error)}; provider=${JSON.stringify(provider.facts())}; server=${JSON.stringify(sanitized)}`);
  } finally {
    if (server != null) {
      try {
        if (rootID != null) {
          const client = proofClient(server.url, project);
          const children = await boundedRequestData<Array<Record<string, unknown>>>(client.session.children({ sessionID: rootID, directory: project }), "retention cleanup children");
          for (const child of children) await boundedRequestData(client.session.delete({ sessionID: String(child.id), directory: project }), "retention cleanup child delete");
          await boundedRequestData(client.session.delete({ sessionID: rootID, directory: project }), "retention cleanup root delete");
        }
      } finally {
        await stopOpenCode(server);
        fs.rmSync(path.join(fixture, "server-pid.json"), { force: true });
      }
    }
    provider.server.stop(true);
    fs.rmSync(fixture, { recursive: true, force: true });
    stage("cleanup-complete");
    if (fs.existsSync(path.join(opts.evidenceRoot, "raw.json"))) {
      const raw = JSON.parse(fs.readFileSync(path.join(opts.evidenceRoot, "raw.json"), "utf8")) as Record<string, unknown>;
      raw.cleanup = "complete";
      fs.writeFileSync(path.join(opts.evidenceRoot, "raw.json"), json(raw), "utf8");
    } else if (fs.existsSync(path.join(opts.evidenceRoot, "failure.json"))) {
      const failure = JSON.parse(fs.readFileSync(path.join(opts.evidenceRoot, "failure.json"), "utf8")) as Record<string, unknown>;
      failure.cleanup = "complete";
      fs.writeFileSync(path.join(opts.evidenceRoot, "failure.json"), json(failure), "utf8");
    } else if (proofError == null) throw new Error("Retention restart proof did not publish evidence");
  }
  stage("capture-complete");
}

function evaluate(opts: Options): void {
  const rawPath = path.join(opts.evidenceRoot, "raw.json");
  const raw = JSON.parse(fs.readFileSync(rawPath, "utf8")) as Record<string, unknown>;
  if (opts.scenario === "retention-preflight") {
    assert(raw.candidateId === opts.candidateId && raw.scenario === "retention-preflight", "Retention preflight candidate correlation mismatch");
    assert(raw.cleanup === "complete", "Retention preflight cleanup is incomplete");
    assert(Array.isArray(raw.seedStatusTypes) && raw.seedStatusTypes.length === 2 && raw.seedStatusTypes.every((status) => status === "absent-idle" || status === "idle"), "Retention preflight seeds were not canonically idle");
    fs.writeFileSync(path.join(opts.evidenceRoot, "evaluation.json"), json({
      candidateId: opts.candidateId,
      cleanup: "complete",
      scenario: opts.scenario,
      seedStatus: "canonical-idle",
      schemaVersion: 1,
      status: "complete",
    }), { encoding: "utf8", flag: "wx" });
    return;
  }
  if (opts.scenario === "retention-recovery") {
    const retention = record(raw.retention) ?? {};
    assert(raw.candidateId === opts.candidateId && raw.scenario === "retention-recovery", "Retention recovery capture candidate correlation mismatch");
    assert(raw.cleanup === "complete", "Retention recovery capture cleanup is incomplete");
    assert(retention.recoveryState === "passed", "Retention recovery capture did not reach passed");
    assert(Number(retention.guardChildrenAfterRecovery) === 2 && Number(retention.interruptedChildrenAfterRecovery) === 1, "Retention recovery capture did not rotate within finite capacity");
    assert(retention.unrelatedPreservedAfterRecovery === true, "Retention recovery capture changed the unrelated child");
    const serverLogs = Array.isArray(raw.serverLogs) ? raw.serverLogs.map(record) : [];
    assert(serverLogs.length === 2 && serverLogs.every((entry) => entry?.retentionError === false), "Retention recovery capture contains the original retention error");
    fs.writeFileSync(path.join(opts.evidenceRoot, "evaluation.json"), json({
      candidateId: opts.candidateId,
      cleanup: "complete",
      recovery: "old-idle-interrupted-rotation",
      scenario: opts.scenario,
      schemaVersion: 1,
      status: "complete",
    }), { encoding: "utf8", flag: "wx" });
    return;
  }
  if (opts.scenario === "retention") {
    const retention = record(raw.retention) ?? {};
    assert(raw.candidateId === opts.candidateId && raw.scenario === "retention", "Retention restart capture candidate correlation mismatch");
    assert(raw.cleanup === "complete", "Retention restart capture cleanup is incomplete");
    assert(retention.recoveryState === "passed" && retention.verificationState === "passed", "Retention restart capture did not pass both loaded starts");
    assert(Number(retention.guardChildrenAfterRecovery) === 2 && Number(retention.guardChildrenAfterVerification) === 2, "Retention restart capture exceeded finite capacity");
    assert(Number(retention.interruptedChildrenAfterRecovery) === 1, "Retention restart capture did not rotate exactly one interrupted child");
    assert(Array.isArray(retention.seedStatusTypes) && retention.seedStatusTypes.length === 2 && retention.seedStatusTypes.every((status) => status === "absent-idle" || status === "idle"), "Retention restart seeds were not canonically idle");
    assert(retention.unrelatedPreservedAfterRecovery === true && retention.unrelatedPreservedAfterVerification === true, "Retention restart capture changed the unrelated child");
    const serverLogs = Array.isArray(raw.serverLogs) ? raw.serverLogs.map(record) : [];
    assert(serverLogs.length === 3 && serverLogs.every((entry) => entry?.retentionError === false), "Retention restart capture contains the original retention error");
    fs.writeFileSync(path.join(opts.evidenceRoot, "evaluation.json"), json({
      candidateId: opts.candidateId,
      cleanup: "complete",
      restartRecovery: "old-idle-interrupted-rotation-repeat-safe",
      scenario: opts.scenario,
      schemaVersion: 1,
      status: "complete",
    }), { encoding: "utf8", flag: "wx" });
    return;
  }
  const restart = record(raw.restart) ?? {};
  assert(raw.candidateId === opts.candidateId, "Restart capture candidate correlation mismatch");
  assert(raw.cleanup === "complete", "Restart capture cleanup is incomplete");
  assert(restart.auditPreserved === true, "Restart capture did not preserve audit identity");
  assert(restart.childReused === true, "Restart capture did not reuse the retained child");
  assert(Number(restart.attemptBefore) === 1 && Number(restart.attemptAfter) === 2, "Restart capture attempt progression differed");
  assert(restart.rootStateBefore === "audit-retrying" && restart.rootStateAfter === "passed", "Restart capture did not reach passed");
  fs.writeFileSync(path.join(opts.evidenceRoot, "evaluation.json"), json({
    candidateId: opts.candidateId,
    cleanup: "complete",
    restartRecovery: "same-child-same-audit-bounded-attempt",
    schemaVersion: 1,
    status: "complete",
  }), { encoding: "utf8", flag: "wx" });
}

async function supervise(opts: Options): Promise<void> {
  const fixture = proofFixture(opts);
  const child = spawn(process.execPath, [runnerPath, "--internal-worker", "--candidate-id", opts.candidateId, "--evidence-root", opts.evidenceRoot, "--scenario", opts.scenario], {
    cwd: sourceRoot,
    env: process.env,
    shell: false,
    stdio: "pipe",
  });
  child.stdout.pipe(process.stdout);
  child.stderr.pipe(process.stderr);
  const timedOut = await new Promise<boolean>((resolve) => {
    const timer = setTimeout(() => {
      child.kill();
      resolve(true);
    }, 120_000);
    child.once("exit", () => { clearTimeout(timer); resolve(false); });
  });
  if (timedOut) {
    await new Promise((resolve) => child.exitCode == null ? child.once("exit", resolve) : resolve(undefined));
    const pidFile = path.join(fixture, "server-pid.json");
    if (fs.existsSync(pidFile)) {
      const pid = Number(record(JSON.parse(fs.readFileSync(pidFile, "utf8")))?.pid);
      if (Number.isSafeInteger(pid) && pid > 0) spawnSync("taskkill", ["/PID", String(pid), "/T", "/F"], { shell: false, stdio: "ignore" });
    }
    fs.rmSync(fixture, { recursive: true, force: true });
    throw new Error("Guard restart worker exceeded its 120000ms terminal limit");
  }
  if (child.exitCode !== 0) throw new Error(`Guard restart worker exited ${String(child.exitCode)}`);
  evaluate(opts);
  console.log(json({ candidateId: opts.candidateId, evidenceRoot: "<evidence-root>", status: "complete" }).trimEnd());
}

const internalWorker = process.argv[2] === "--internal-worker";
const cliArgs = internalWorker ? process.argv.slice(3) : process.argv.slice(2);
const parsed = options(cliArgs);
  const execution = parsed.help
  ? Promise.resolve().then(() => console.log(usage()))
  : internalWorker
    ? parsed.scenario === "retry" ? runRetry(parsed) : runRetention(parsed)
    : supervise(parsed);
execution.catch((error) => {
  console.error(json({ error: error instanceof Error ? error.message : String(error), status: "blocked" }).trimEnd());
  process.exitCode = 1;
});
