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
import { isolatedProofServerEnvironment, probeProofServer, proofClient, proofErrorFacts, PROOF_SERVER_CONFIG_LOAD_MS, PROOF_SERVER_PLUGIN_READY_MS, PROOF_SERVER_READINESS_MS, proofServerStartupFacts, requestData, seedProofConfigDependencies } from "./lib/opencode-proof-client.ts";
import { removeProofFixture, stopProofProcessTree } from "./lib/proof-process-cleanup.ts";

type Scenario = "claims" | "multi-root" | "retention" | "retention-preflight" | "retention-recovery" | "retry";
type Mode = "capture" | "evaluate";
type Options = { candidateId: string; evidenceRoot: string; help: boolean; mode: Mode; scenario: Scenario };
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
    "  bun tools/proofs/session-completion-guard-restart.ts --mode capture|evaluate --candidate-id <id> --evidence-root <absolute-path> [--scenario claims|multi-root|retry|retention-preflight|retention-recovery|retention]",
    "",
    "Scenarios:",
    "  claims      Prove installed claim continuation, exact stop, truncation, and ordinary idle behavior.",
    "  multi-root  Prove installed process-wide active/queue bounds and overload isolation with a local provider.",
    "  retry       Prove persisted bounded retry resumes in the same child (default).",
    "  retention-preflight   Capture canonical idle status for realistic interrupted child seeds only.",
    "  retention-recovery    Capture one loaded stale rotation and stop before repeat restart.",
    "  retention   Prove old idle interrupted children recover across two loaded restarts.",
  ].join("\n");
}

function options(args: string[]): Options {
  if (args[0] === "--help" || args[0] === "-h") return { candidateId: "help", evidenceRoot: "", help: true, mode: "capture", scenario: "retry" };
  let candidateId = "";
  let evidenceRoot = "";
  let mode: Mode = "capture";
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
      if (value !== "claims" && value !== "multi-root" && value !== "retention" && value !== "retention-preflight" && value !== "retention-recovery" && value !== "retry") throw new Error("Scenario must be claims, multi-root, retry, retention-preflight, retention-recovery, or retention");
      scenario = value;
      index++;
    } else if (args[index] === "--mode") {
      const value = required(args, index, args[index]);
      if (value !== "capture" && value !== "evaluate") throw new Error("Mode must be capture or evaluate");
      mode = value;
      index++;
    } else throw new Error(`Unknown option: ${args[index]}`);
  }
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]{0,99}$/.test(candidateId)) throw new Error("Invalid candidate id");
  if (!path.isAbsolute(evidenceRoot)) throw new Error("Evidence root must be absolute");
  return { candidateId, evidenceRoot: path.resolve(evidenceRoot), help: false, mode, scenario };
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

function simulator(scenario: Scenario = "retry") {
  let arbiterCalls = 0;
  let arbiterInFlight = 0;
  let arbiterOutage = scenario === "retry";
  let maxArbiterInFlight = 0;
  let primaryCalls = 0;
  let releaseHeldArbiters: (() => void) | null = null;
  const heldArbiters = new Promise<void>((resolve) => { releaseHeldArbiters = resolve; });
  const rootRefs: string[] = [];
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
        const primary = "The bounded local task is complete.";
        return body.stream === true ? streamingCompletion(primary) : completion(primary);
      }
      arbiterCalls += 1;
      requestKinds.push(`arbiter-${arbiterCalls}`);
      if (arbiterOutage) return Response.json({ error: { message: "temporary proof outage", type: "server_error" } }, { status: 503 });
      const audit = JSON.parse((auditMatch ?? retryMatch)![1]) as Record<string, unknown>;
      if (scenario === "multi-root") {
        arbiterInFlight += 1;
        maxArbiterInFlight = Math.max(maxArbiterInFlight, arbiterInFlight);
        rootRefs.push(String(audit.rootSessionRef ?? "unknown"));
        await heldArbiters;
        arbiterInFlight -= 1;
      }
      const claimEvidence = record(record(audit.completionEvidence)?.claimEvidence);
      const claims = Array.isArray(claimEvidence?.claims) ? claimEvidence.claims.map(record).filter(Boolean) : [];
      const claimMatrix = claims.map((claim) => ({
        claimId: claim?.claimId,
        closureState: claim?.closureState,
        evidenceRefs: claim?.evidenceRefs,
        maximumSupportedClaim: claim?.maximumSupportedClaim,
        outcomeRef: claim?.outcomeRef,
      }));
      const claimContinuation = scenario === "claims" && (
        claimEvidence?.complete !== true || claims.some((claim) => claim?.closureState !== "supported")
      );
      const verdict = JSON.stringify({
        schemaVersion: 1,
        auditID: audit.auditID,
        claimMatrix,
        rootSessionRef: audit.rootSessionRef,
        inspectedRevision: audit.inspectedRevision,
        verdict: claimContinuation ? "continue" : "allow_stop",
        confidence: "high",
        goalSummary: "Disposable restart proof complete",
        requirementMatrix: claimContinuation
          ? [{ evidenceRefs: [], requirementRef: "claim-scope", status: "unresolved" }]
          : [],
        unresolved: claimContinuation
          ? [{
              evidenceGap: "Supplied claim closure is incomplete.",
              nextAction: "Complete or honestly narrow the structured claim closure.",
              nextEvidence: "Current supported claim closure.",
              requirementRef: "claim-scope",
              stopCondition: "Claim closure supports the accepted scope.",
            }]
          : [],
        ownerBoundary: null,
        questionAnswers: null,
        evidenceGaps: claimContinuation ? ["claim-closure-incomplete"] : [],
        evidenceRefs: [],
        strategyAssessment: { fingerprint: "restart-proof", prohibitedStrategies: [], repeated: false, requiredRetryEvidence: [] },
      });
      return body.stream === true ? streamingCompletion(verdict) : completion(verdict);
    },
  });
  return {
    server,
    facts: () => ({ arbiterCalls, arbiterInFlight, maxArbiterInFlight, primaryCalls, requestKinds, rootRefs }),
    recover: () => { arbiterOutage = false; },
    release: () => { releaseHeldArbiters?.(); },
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
    const primary = await fetch(`http://${transport.server.hostname}:${transport.server.port}/v1/chat/completions`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ messages: [{ role: "user", content: "Complete the local primary turn." }], stream: true }),
    });
    const stream = await primary.text();
    assert(
      primary.headers.get("content-type")?.includes("text/event-stream") === true
        && stream.includes('"finish_reason":"stop"')
        && stream.includes("data: [DONE]"),
      "Primary streaming preflight omitted the terminal SSE frame",
    );
  } finally {
    transport.server.stop(true);
  }
}

function readPluginStartupTrace(dataDir: string): Array<{ hook?: string; phase: string; plugin: string }> {
  const traceFile = path.join(dataDir, "plugin-startup.jsonl");
  if (!fs.existsSync(traceFile)) return [];
  return fs.readFileSync(traceFile, "utf8").split(/\r?\n/).filter(Boolean).slice(0, 128).flatMap((line) => {
    try {
      const row = JSON.parse(line) as Record<string, unknown>;
      if (typeof row.plugin !== "string" || typeof row.phase !== "string") return [];
      return [{
        ...(typeof row.hook === "string" ? { hook: row.hook } : {}),
        phase: row.phase,
        plugin: row.plugin,
      }];
    } catch {
      return [];
    }
  });
}

function writeTracedPlugin(configDir: string, dataDir: string, name: string, target: string): string {
  const pluginsDir = path.join(configDir, "proof-plugins");
  fs.mkdirSync(pluginsDir, { recursive: true });
  const destination = path.join(pluginsDir, `${name}.ts`);
  const traceFile = path.join(dataDir, "plugin-startup.jsonl");
  const source = [
    'import fs from "node:fs";',
    `import plugin from ${JSON.stringify(target)};`,
    `const pluginName = ${JSON.stringify(name)};`,
    `const traceFile = ${JSON.stringify(traceFile)};`,
    "const mark = (phase, hook) => fs.appendFileSync(traceFile, `${JSON.stringify({ plugin: pluginName, phase, ...(hook == null ? {} : { hook }) })}\\n`, 'utf8');",
    "export default {",
    "  id: plugin.id,",
    "  server: async (input, options) => {",
    "    mark('factory-enter');",
    "    try {",
    "      const hooks = await plugin.server(input, options);",
    "      mark('factory-exit');",
    "      const tracedHooks = new Set(['config', 'dispose']);",
    "      return Object.fromEntries(Object.entries(hooks).map(([hook, value]) => [hook, typeof value !== 'function' || !tracedHooks.has(hook) ? value : async (...args) => {",
    "        mark('hook-enter', hook);",
    "        try {",
    "          const result = await value.apply(hooks, args);",
    "          mark('hook-exit', hook);",
    "          return result;",
    "        } catch (error) {",
    "          mark('hook-error', hook);",
    "          throw error;",
    "        }",
    "      }]));",
    "    } catch (error) {",
    "      mark('factory-error');",
    "      throw error;",
    "    }",
    "  },",
    "};",
    "",
  ].join("\n");
  fs.writeFileSync(destination, source, "utf8");
  return pathToFileURL(destination).href;
}

function warmupIsolatedPluginResolver(configDir: string, dataDir: string, project: string): { elapsedMs: number; isolatedCacheEntries: string[] } {
  const env = isolatedProofServerEnvironment(process.env, configDir, dataDir);
  const started = Date.now();
  const result = spawnSync("opencode", ["debug", "config"], {
    cwd: project,
    encoding: "utf8",
    env,
    shell: false,
    timeout: 45_000,
    windowsHide: true,
  });
  if (result.status !== 0) {
    throw new Error(`Isolated plugin-resolver warmup failed: status=${result.status} signal=${result.signal} stderr=${String(result.stderr ?? "").slice(-500)}`);
  }
  const cacheRoot = path.join(dataDir, "cache");
  return {
    elapsedMs: Date.now() - started,
    isolatedCacheEntries: fs.existsSync(cacheRoot) ? fs.readdirSync(cacheRoot).slice(0, 16) : [],
  };
}

async function offlinePluginTracePreflight(): Promise<void> {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "guard-plugin-trace-preflight-"));
  const configDir = path.join(root, "config");
  const dataDir = path.join(root, "data");
  fs.mkdirSync(dataDir, { recursive: true });
  try {
    const bridgeUrl = writeTracedPlugin(
      configDir,
      dataDir,
      "pty-bridge",
      pathToFileURL(path.join(sourceRoot, "global", "extensions", "opencode-pty-bridge.ts")).href,
    );
    const guardUrl = writeTracedPlugin(
      configDir,
      dataDir,
      "completion-guard",
      pathToFileURL(path.join(sourceRoot, "global", "extensions", "session-completion-guard.ts")).href,
    );
    const input = {
      client: { _client: {} },
      directory: sourceRoot,
      project: { id: "project_trace_preflight" },
      serverUrl: new URL("http://127.0.0.1:1"),
      worktree: sourceRoot,
    };
    const bridge = (await import(bridgeUrl)).default as { server: (input: unknown, options?: unknown) => Promise<Record<string, unknown>> };
    const guard = (await import(guardUrl)).default as { server: (input: unknown, options?: unknown) => Promise<Record<string, unknown>> };
    await bridge.server(input);
    const guardHooks = await guard.server(input, {
      auditWindow: { enabled: false, mode: "read-only-monitor", scope: "per-root", terminal: "powershell-shell" },
      enabled: true,
      statusToasts: false,
    });
    if (typeof guardHooks.dispose === "function") await guardHooks.dispose();
    const trace = readPluginStartupTrace(dataDir);
    for (const expected of [
      "pty-bridge:factory-enter",
      "pty-bridge:factory-exit",
      "completion-guard:factory-enter",
      "completion-guard:factory-exit",
      "completion-guard:dispose:hook-enter",
      "completion-guard:dispose:hook-exit",
    ]) {
      const [plugin, hookOrPhase, maybePhase] = expected.split(":");
      const phase = maybePhase ?? hookOrPhase;
      const hook = maybePhase == null ? undefined : hookOrPhase;
      assert(trace.some((row) => row.plugin === plugin && row.phase === phase && row.hook === hook), `Plugin trace preflight omitted ${expected}`);
    }
  } finally {
    removeProofFixture(root);
  }
}

function writeConfig(configDir: string, dataDir: string, providerUrl: string, scenario: Scenario = "retry"): void {
  fs.mkdirSync(path.join(configDir, "agents"), { recursive: true });
  fs.copyFileSync(
    path.join(sourceRoot, "global", "agents", "session-completion-arbiter.md"),
    path.join(configDir, "agents", "session-completion-arbiter.md"),
  );
  const bridgeSource = pathToFileURL(path.join(sourceRoot, "global", "extensions", "opencode-pty-bridge.ts")).href;
  const guardSource = pathToFileURL(path.join(sourceRoot, "global", "extensions", "session-completion-guard.ts")).href;
  const bridge = scenario === "claims" ? writeTracedPlugin(configDir, dataDir, "pty-bridge", bridgeSource) : bridgeSource;
  const guard = scenario === "claims" ? writeTracedPlugin(configDir, dataDir, "completion-guard", guardSource) : guardSource;
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
      arbiterActiveLimit: 2,
      arbiterAgent: "session-completion-arbiter",
      arbiterPromptTimeoutMs: scenario === "multi-root" ? 60_000 : scenario === "retry" ? 5_000 : 2_000,
      arbiterQueueLimit: 32,
      auditWindow: { enabled: false, mode: "read-only-monitor", scope: "per-root", terminal: "powershell-shell" },
      enabled: true,
      initialDelayMs: scenario === "multi-root" ? 100 : 10_000,
      maxCycles: 3,
      maxDelayMs: 10_000,
      maxRequestBytes: 200_000,
      maxRetryAttempts: 2,
      maxWaitRechecks: 3,
      retainAuditSessions: 2,
      retryMultiplier: 1,
      settleMs: scenario === "retry" || scenario === "multi-root" ? 50 : 2_000,
      statusToasts: false,
      strategyFallback: "docs/session-strategy-history",
      waitRecheckMs: 100,
    }]],
  }), "utf8");
  seedProofConfigDependencies(configDir, path.join(sourceRoot, "global"));
  fs.mkdirSync(dataDir, { recursive: true });
}

type ServerProcess = { child: ChildProcessWithoutNullStreams; readyMs: number; stderr: string[]; stdout: string[]; url: string };

async function startOpenCode(
  configDir: string,
  dataDir: string,
  project: string,
  httpFirst = false,
): Promise<ServerProcess> {
  const startedAt = Date.now();
  const port = await freePort();
  const child = spawn("opencode", ["serve", "--hostname", "127.0.0.1", "--port", String(port), "--print-logs", "--log-level", "INFO"], {
    cwd: project,
    env: isolatedProofServerEnvironment(process.env, configDir, dataDir),
    shell: false,
    stdio: "pipe",
  });
  const stdout: string[] = [];
  const stderr: string[] = [];
  child.stdout.on("data", (chunk) => stdout.push(String(chunk)));
  child.stderr.on("data", (chunk) => stderr.push(String(chunk)));
  const url = `http://127.0.0.1:${port}`;
  if (httpFirst) {
    const listenDeadline = startedAt + PROOF_SERVER_CONFIG_LOAD_MS;
    const readyDeadline = startedAt + PROOF_SERVER_READINESS_MS;
    let lastError: unknown = null;
    try {
      while (!`${stdout.join("")}\n${stderr.join("")}`.includes("opencode server listening")) {
        if (child.exitCode != null) throw new Error(`OpenCode server exited ${child.exitCode}`);
        if (Date.now() >= listenDeadline) throw new Error("OpenCode listener did not start inside the config-load bound");
        await Bun.sleep(100);
      }
      for (const route of ["/path", "/session/status"]) {
        const controller = new AbortController();
        const remaining = Math.max(1, readyDeadline - Date.now());
        const timer = setTimeout(() => controller.abort(new Error(`HTTP readiness ${route} timed out`)), remaining);
        try {
          const response = await fetch(new URL(route, url), { signal: controller.signal });
          await response.body?.cancel();
          if (!response.ok) throw new Error(`HTTP readiness ${route} returned ${response.status}`);
        } catch (error) {
          lastError = error;
          throw error;
        } finally {
          clearTimeout(timer);
        }
      }
      return { child, readyMs: Date.now() - startedAt, stderr, stdout, url };
    } catch (error) {
      const diagnostics = {
        errorChain: proofErrorFacts(lastError ?? error),
        exitCode: child.exitCode,
        pluginStartupTrace: readPluginStartupTrace(dataDir),
        probes: await probeProofServer(url),
        readinessStage: "http-first",
        stderrChars: stderr.join("").length,
        stdoutChars: stdout.join("").length,
      };
      await stopOpenCode({ child, readyMs: Date.now() - startedAt, stderr, stdout, url });
      throw new Error(`OpenCode HTTP-first readiness failed: ${JSON.stringify(diagnostics)}`);
    }
  }
  const client = proofClient(url, project);
  const configDeadline = startedAt + PROOF_SERVER_CONFIG_LOAD_MS;
  let pluginDeadline: number | null = null;
  let lastError: unknown = null;
  while (true) {
    const now = Date.now();
    const startup = proofServerStartupFacts(stdout.join(""), stderr.join(""), configDir);
    if (startup.isolatedConfigLoaded && pluginDeadline == null) pluginDeadline = now + PROOF_SERVER_PLUGIN_READY_MS;
    if ((!startup.isolatedConfigLoaded && now >= configDeadline) || (pluginDeadline != null && now >= pluginDeadline)) break;
    if (child.exitCode != null) throw new Error(`OpenCode server exited ${child.exitCode}: ${stderr.join("").slice(-1_000)}`);
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(new Error("OpenCode readiness request timed out")), 5_000);
      try {
        await requestData(client.session.status({ directory: project }, { signal: controller.signal }), "server session readiness");
      } finally {
        clearTimeout(timer);
      }
      return { child, readyMs: Date.now() - startedAt, stderr, stdout, url };
    } catch (error) {
      lastError = error;
      await Bun.sleep(100);
    }
  }
  const sanitizeLog = (text: string) => [
    [configDir, "<config-dir>"],
    [dataDir, "<data-dir>"],
    [project, "<project>"],
    [sourceRoot, "<source-root>"],
    [os.homedir(), "<home>"],
  ].reduce((output, [value, placeholder]) => output
    .replaceAll(value, placeholder)
    .replaceAll(value.replaceAll("\\", "\\\\"), placeholder), text);
  const diagnostics = {
    errorChain: proofErrorFacts(lastError),
    exitCode: child.exitCode,
    pluginStartupTrace: readPluginStartupTrace(dataDir),
    probes: await probeProofServer(url),
    readinessStage: proofServerStartupFacts(stdout.join(""), stderr.join(""), configDir).isolatedConfigLoaded
      ? "configured-plugin-initialization"
      : "config-load",
    stderrChars: stderr.join("").length,
    stderrTail: sanitizeLog(stderr.join("")).slice(-4_000),
    stdoutChars: stdout.join("").length,
    stdoutTail: sanitizeLog(stdout.join("")).slice(-2_000),
  };
  await stopOpenCode({ child, readyMs: Date.now() - startedAt, stderr, stdout, url });
  throw new Error(`OpenCode server readiness timed out: ${JSON.stringify(diagnostics)}`);
}

async function stopOpenCode(server: ServerProcess): Promise<void> {
  await stopProofProcessTree(server.child);
  const port = Number(new URL(server.url).port);
  await stopProofListener(port);
}

function stopWindowsProofListener(port: number): void {
  if (process.platform !== "win32") return;
  const command = [
    `$listener=Get-NetTCPConnection -State Listen -LocalAddress '127.0.0.1' -LocalPort ${port} -ErrorAction Stop | Select-Object -First 1`,
    "$process=Get-CimInstance Win32_Process -Filter (\"ProcessId = {0}\" -f $listener.OwningProcess)",
    `if($null -eq $process -or $process.CommandLine -notlike '*opencode*serve*--port ${port}*'){exit 42}`,
    "Stop-Process -Id $listener.OwningProcess -Force -ErrorAction Stop",
  ].join(";");
  const stopped = spawnSync("powershell.exe", ["-NoProfile", "-NonInteractive", "-Command", command], {
    shell: false,
    stdio: "ignore",
    timeout: 10_000,
  });
  if (stopped.status !== 0) throw new Error(`Proof-owned OpenCode listener on port ${port} could not be verified and stopped`);
}

async function stopProofListener(port: number): Promise<void> {
  const deadline = Date.now() + 5_000;
  let closedSince: number | null = null;
  while (Date.now() < deadline) {
    if (await listenerOpen(port)) {
      closedSince = null;
      stopWindowsProofListener(port);
    } else {
      closedSince ??= Date.now();
      if (Date.now() - closedSince >= 750) return;
    }
    await Bun.sleep(100);
  }
  if (await listenerOpen(port)) {
    throw new Error(`Proof-owned OpenCode listener on port ${port} remained active after cleanup`);
  }
}

async function listenerOpen(port: number): Promise<boolean> {
  return await new Promise<boolean>((resolve) => {
    const socket = net.createConnection({ host: "127.0.0.1", port });
    socket.setTimeout(500);
    socket.once("connect", () => { socket.destroy(); resolve(true); });
    socket.once("error", () => resolve(false));
    socket.once("timeout", () => { socket.destroy(); resolve(false); });
  });
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

function claimRecord(claimId: string, members: string[], disposition: "blocked" | "supported"): Record<string, unknown> {
  const broad = members.length > 1;
  const observed = disposition === "supported" ? members : members.slice(0, 1);
  return {
    candidateId: "claims-candidate",
    claimClass: broad ? "finite-population" : "exact-case",
    claimId,
    coverageBasis: broad ? "finite-population" : "exact-case",
    disposition,
    environmentId: "claims-environment",
    evidenceRefs: ["product"],
    independentChallenge: broad
      ? { evidenceRefs: [], required: true, status: "missing" }
      : { evidenceRefs: [], required: false, status: "not-required" },
    materialExclusions: [],
    maximumSupportedClaim: broad ? `Only ${members[0]} is supported.` : `Exact ${members[0]} only.`,
    narrowingAccepted: false,
    observationBoundary: "installed-guard-result",
    observations: observed.map((memberId) => ({
      candidateId: "claims-candidate",
      environmentId: "claims-environment",
      evidenceRefs: ["product"],
      memberId,
      observationBoundary: "installed-guard-result",
      paths: { baseline: null, candidate: null, production: "installed-guard" },
      status: "supported",
      terminal: true,
      unresolvedObservations: [],
    })),
    outcomeRef: `outcome:${claimId}`,
    paths: { baseline: null, candidate: null, production: "installed-guard" },
    population: {
      id: `population-${claimId.toLowerCase()}`,
      materialClasses: [],
      members,
      partitionRule: null,
      residualSpace: null,
    },
    realOracle: { evidenceRefs: [], required: false, status: "not-required" },
    statement: `Installed guard claim ${claimId}`,
    unknowns: [],
  };
}

function writeClaimIndex(project: string, changeId: string, claims: Record<string, unknown>[]): void {
  const changeRoot = path.join(project, "openspec", "changes", changeId);
  fs.mkdirSync(changeRoot, { recursive: true });
  fs.writeFileSync(path.join(changeRoot, "evidence-index.json"), json({
    candidateId: "claims-candidate",
    changeId,
    claims,
    environmentId: "claims-environment",
    lanes: [{ files: [], kind: "terminal", name: "product" }],
    retention: { exception: null, maxBytes: 25 * 1024 * 1024, maxFiles: 64 },
    schemaVersion: 2,
    tasks: [],
  }), "utf8");
}

function resetClaimChanges(project: string): void {
  fs.rmSync(path.join(project, "openspec"), { force: true, recursive: true });
}

async function waitAuditChild(
  client: ReturnType<typeof proofClient>,
  rootID: string,
  project: string,
  expectedStatus: "continued" | "passed",
): Promise<{ child: Record<string, unknown>; request: Record<string, unknown>; requestBytes: number; result: Record<string, unknown> }> {
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    const children = await boundedRequestData<Array<Record<string, unknown>>>(
      client.session.children({ sessionID: rootID, directory: project }),
      "claim audit children",
    );
    const child = children.find((candidate) =>
      record(record(candidate.metadata)?.completionGuard)?.status === expectedStatus
    );
    if (child == null) {
      await Bun.sleep(100);
      continue;
    }
    const messages = await boundedRequestData<Array<{ info: Record<string, unknown>; parts: unknown[] }>>(
      client.session.messages({ sessionID: String(child.id), directory: project }),
      "claim audit messages",
    );
    const texts = messages.flatMap((message) => message.parts.flatMap((part) => {
      const value = record(part);
      return typeof value?.text === "string" ? [value.text] : [];
    }));
    const requestText = texts.find((text) => text.includes("<completion_audit_request>"));
    const resultText = [...texts].reverse().find((text) => text.trim().startsWith("{") && text.trim().endsWith("}"));
    const requestMatch = requestText?.match(/<completion_audit_request>\s*([\s\S]*?)\s*<\/completion_audit_request>/);
    if (requestMatch == null || resultText == null) throw new Error("Claim audit child omitted request or result evidence");
    return {
      child,
      request: JSON.parse(requestMatch[1]) as Record<string, unknown>,
      requestBytes: Buffer.byteLength(requestText!, "utf8"),
      result: JSON.parse(resultText) as Record<string, unknown>,
    };
  }
  throw new Error(`Claim audit child did not reach ${expectedStatus}`);
}

function sourceHashes(): Array<{ digest: string; path: string }> {
  return [
    "global/agents/session-completion-arbiter.md",
    "global/extensions/session-completion-guard/arbiter-evidence.ts",
    "global/extensions/session-completion-guard/claim-evidence.ts",
    "global/extensions/session-completion-guard/terminal-certificate.ts",
    "global/extensions/session-completion-guard/verdict.ts",
    "global/plugin/session-delivery-context/projection.ts",
    "tools/proofs/session-completion-guard-restart.ts",
  ].map((relative) => ({
    digest: new Bun.CryptoHasher("sha256").update(fs.readFileSync(path.join(sourceRoot, relative))).digest("hex"),
    path: relative,
  }));
}

function multiRootSourceHashes(): Array<{ digest: string; path: string }> {
  return [
    "global/extensions/session-completion-guard.ts",
    "global/extensions/session-completion-guard/arbiter-scheduler.ts",
    "global/extensions/session-completion-guard/controller.ts",
    "global/extensions/session-completion-guard/runtime-support.ts",
    "global/extensions/session-completion-guard/status.ts",
    "global/plugin/session-delivery-context/index.ts",
    "global/plugin/session-delivery-context/session-graph.ts",
    "tools/proofs/session-completion-guard-restart.ts",
  ].map((relative) => ({
    digest: new Bun.CryptoHasher("sha256").update(fs.readFileSync(path.join(sourceRoot, relative))).digest("hex"),
    path: relative,
  }));
}

async function runMultiRoot(opts: Options): Promise<void> {
  if (fs.existsSync(opts.evidenceRoot)) throw new Error("Evidence root already exists");
  await offlineUnlockPreflight();
  const fixture = proofFixture(opts);
  fs.mkdirSync(fixture, { recursive: false });
  const configDir = path.join(fixture, "config");
  const dataDir = path.join(fixture, "data");
  const project = path.join(fixture, "project");
  fs.mkdirSync(project, { recursive: true });
  fs.writeFileSync(path.join(project, "AGENTS.md"), "# Disposable multi-root guard proof\n", "utf8");
  const provider = simulator("multi-root");
  const progress = { current: 0, phase: "startup", total: 35 };
  const progressTimer = setInterval(() => {
    const facts = provider.facts();
    console.error(JSON.stringify({
      arbiterCalls: facts.arbiterCalls,
      arbiterInFlight: facts.arbiterInFlight,
      current: progress.current,
      phase: progress.phase,
      primaryCalls: facts.primaryCalls,
      stage: "multi-root-progress",
      total: progress.total,
    }));
  }, 2_000);
  progressTimer.unref();
  writeConfig(configDir, dataDir, `http://${provider.server.hostname}:${provider.server.port}`, "multi-root");
  let server: ServerProcess | null = null;
  const rootIDs: string[] = [];
  const liveRootIDs = new Set<string>();
  let proofError: unknown = null;
  try {
    server = await startOpenCode(configDir, dataDir, project);
    fs.writeFileSync(path.join(fixture, "server-pid.json"), json({ pid: server.child.pid, port: Number(new URL(server.url).port) }), "utf8");
    stage("multi-root-server-ready");
    const workloadStartedAt = Date.now();
    const client = proofClient(server.url, project);
    progress.phase = "create-roots";
    for (let index = 0; index < 35; index += 1) {
      const root = await requestData<Record<string, unknown>>(client.session.create({
        directory: project,
        title: `guard multi-root ${String(index).padStart(2, "0")}`,
        metadata: { completionGuard: { grindEnabled: true, state: "running" } },
      }), `multi-root create ${index}`);
      rootIDs.push(String(root.id));
      liveRootIDs.add(String(root.id));
      progress.current = rootIDs.length;
    }
    progress.phase = "dispatch-prompts";
    progress.current = 0;
    const promptsTerminal = Promise.allSettled(rootIDs.map((sessionID, index) => requestData<{ info: Record<string, unknown> }>(
      client.session.prompt({
        sessionID,
        directory: project,
        model: { providerID: "proof", modelID: "proof-model" },
        system: "Return one short completion sentence and stop. Do not call tools.",
        tools: {},
        parts: [{ type: "text", text: `Complete disposable local root ${index}.` }],
      }),
      `multi-root prompt ${index}`,
    )));

    const states = async (): Promise<Array<{ message: string; rootRef: string; state: string }>> =>
      await Promise.all(rootIDs.filter((sessionID) => liveRootIDs.has(sessionID)).map(async (sessionID) => {
        const root = await requestData<Record<string, unknown>>(
          client.session.get({ sessionID, directory: project }),
          "multi-root state",
        );
        const guard = record(record(root.metadata)?.completionGuard) ?? {};
        return {
          message: String(guard.message ?? "").slice(0, 200),
          rootRef: hashRef("session", sessionID),
          state: String(guard.state ?? "unknown"),
        };
      }));

    let heldStates: Awaited<ReturnType<typeof states>> = [];
    const heldDeadline = Date.now() + 45_000;
    progress.phase = "held-poll";
    while (Date.now() < heldDeadline) {
      heldStates = await states();
      progress.current += 1;
      const facts = provider.facts();
      if (facts.arbiterCalls === 2 && heldStates.filter((row) => row.state === "error").length === 1) break;
      await Bun.sleep(100);
    }
    const heldFacts = provider.facts();
    assert(heldFacts.arbiterCalls === 2 && heldFacts.maxArbiterInFlight === 2, "Installed guard exceeded or failed to fill the two active arbiter slots");
    assert(heldStates.filter((row) => row.state === "error").length === 1, "Installed guard did not reject exactly one root at queue capacity");
    const activeRefs = new Set(heldFacts.rootRefs);
    const overload = heldStates.find((row) => row.state === "error");
    const queuedHealthy = heldStates.find((row) => row.state !== "error" && !activeRefs.has(row.rootRef));
    assert(overload != null && queuedHealthy != null, "Installed guard did not expose an overload root and a queued healthy root");
    const retainedRefs = new Set([...activeRefs, overload.rootRef, queuedHealthy.rootRef]);
    const cancelledRootIDs = rootIDs.filter((sessionID) => !retainedRefs.has(hashRef("session", sessionID)));
    assert(cancelledRootIDs.length === 31, `Installed guard cancellation population differed: ${cancelledRootIDs.length}`);
    progress.phase = "cancel-queued";
    progress.current = 0;
    for (const sessionID of cancelledRootIDs) {
      await client.session.delete({ sessionID, directory: project });
      liveRootIDs.delete(sessionID);
      progress.current += 1;
    }
    await Bun.sleep(500);
    provider.release();

    let terminalStates: Awaited<ReturnType<typeof states>> = [];
    const terminalDeadline = Date.now() + 60_000;
    progress.phase = "terminal-poll";
    progress.current = 0;
    while (Date.now() < terminalDeadline) {
      terminalStates = await states();
      progress.current += 1;
      if (terminalStates.every((row) => row.state === "passed" || row.state === "error")) break;
      await Bun.sleep(100);
    }
    progress.phase = "await-prompts";
    progress.current = 0;
    const promptResults = await promptsTerminal;
    const facts = provider.facts();
    const passed = terminalStates.filter((row) => row.state === "passed");
    const errors = terminalStates.filter((row) => row.state === "error");
    assert(passed.length === 3 && errors.length === 1, `Installed multi-root terminal states differed: passed=${passed.length} error=${errors.length}`);
    assert(passed.some((row) => row.rootRef === queuedHealthy.rootRef), "Queued healthy root did not complete behind the saturated roots");
    assert(facts.primaryCalls === 35 && facts.arbiterCalls === 3 && facts.maxArbiterInFlight === 2, "Installed provider-call bounds differed");
    assert(new Set(facts.rootRefs).size === 3, "Installed arbiter routing duplicated or omitted a retained accepted root");
    fs.mkdirSync(opts.evidenceRoot, { recursive: false });
    progress.phase = "publish-evidence";
    fs.writeFileSync(path.join(opts.evidenceRoot, "raw.json"), json({
      candidateId: opts.candidateId,
      cleanup: "pending",
      environment: {
        model: "proof/proof-model",
        platform: process.platform,
        serverReadyMs: server.readyMs,
        sourceHashes: multiRootSourceHashes(),
      },
      multiRoot: {
        activeLimit: 2,
        accepted: 34,
        cancelled: cancelledRootIDs.length,
        errorDiagnostics: errors,
        healthyQueuedPassed: passed.some((row) => row.rootRef === queuedHealthy.rootRef),
        passed: passed.length,
        promptRejected: promptResults.filter((result) => result.status === "rejected").length,
        queueLimit: 32,
        rejected: errors.length,
        roots: rootIDs.length,
        workloadElapsedMs: Date.now() - workloadStartedAt,
      },
      provider: facts,
      scenario: "multi-root",
      schemaVersion: 1,
      serverLogs: {
        stderrChars: server.stderr.join("").length,
        stdoutChars: server.stdout.join("").length,
      },
    }), "utf8");
  } catch (error) {
    proofError = error;
    throw error;
  } finally {
    let cleanupError: unknown = null;
    progress.phase = "cleanup";
    progress.current = rootIDs.length;
    provider.release();
    try {
      if (server != null) {
        try {
          const client = proofClient(server.url, project);
          for (const rootID of rootIDs.filter((sessionID) => liveRootIDs.has(sessionID))) {
            const children = await requestData<Array<Record<string, unknown>>>(
              client.session.children({ sessionID: rootID, directory: project }),
              "multi-root cleanup children",
            );
            for (const child of children) await client.session.delete({ sessionID: String(child.id), directory: project });
            await client.session.delete({ sessionID: rootID, directory: project });
          }
        } finally {
          await stopOpenCode(server);
          fs.rmSync(path.join(fixture, "server-pid.json"), { force: true });
        }
      }
      provider.server.stop(true);
      removeProofFixture(fixture);
    } catch (error) {
      cleanupError = error;
      provider.server.stop(true);
    }
    stage("multi-root-cleanup-complete");
    clearInterval(progressTimer);
    if (fs.existsSync(path.join(opts.evidenceRoot, "raw.json"))) {
      const raw = JSON.parse(fs.readFileSync(path.join(opts.evidenceRoot, "raw.json"), "utf8")) as Record<string, unknown>;
      raw.cleanup = "complete";
      fs.writeFileSync(path.join(opts.evidenceRoot, "raw.json"), json(raw), "utf8");
    } else if (proofError == null && cleanupError == null) throw new Error("Multi-root proof did not publish evidence");
    if (cleanupError != null && proofError == null) throw cleanupError;
  }
  stage("multi-root-capture-complete");
}

async function runClaims(opts: Options): Promise<void> {
  if (fs.existsSync(opts.evidenceRoot)) throw new Error("Evidence root already exists");
  await offlineUnlockPreflight();
  await offlinePluginTracePreflight();
  const fixture = proofFixture(opts);
  fs.mkdirSync(fixture, { recursive: false });
  const configDir = path.join(fixture, "config");
  const dataDir = path.join(fixture, "data");
  const project = path.join(fixture, "project");
  fs.mkdirSync(project, { recursive: true });
  fs.writeFileSync(path.join(project, "AGENTS.md"), "# Disposable claim-evidence guard proof\n", "utf8");
  const provider = simulator("claims");
  writeConfig(configDir, dataDir, `http://${provider.server.hostname}:${provider.server.port}`, "claims");
  const pluginResolverWarmup = warmupIsolatedPluginResolver(configDir, dataDir, project);
  let server: ServerProcess | null = null;
  const rootIDs = new Set<string>();
  const cases: Array<Record<string, unknown>> = [];
  let openCodeVersion = "unknown";
  let proofError: unknown = null;
  try {
    server = await startOpenCode(configDir, dataDir, project, true);
    fs.writeFileSync(path.join(fixture, "server-pid.json"), json({ pid: server.child.pid }), "utf8");
    stage("claims-server-ready");
    const client = proofClient(server.url, project);
    const definitions = [
      {
        expected: "continue",
        name: "representative-overclaim",
        prepare: () => {
          resetClaimChanges(project);
          writeClaimIndex(project, "representative", [claimRecord("CLAIM-REPRESENTATIVE", ["member-1", "member-2"], "blocked")]);
          return "representative";
        },
      },
      {
        expected: "allow_stop",
        name: "supported-exact",
        prepare: () => {
          resetClaimChanges(project);
          writeClaimIndex(project, "exact", [claimRecord("CLAIM-EXACT", ["member-1"], "supported")]);
          return "exact";
        },
      },
      {
        expected: "continue",
        name: "truncated-closure",
        prepare: () => {
          resetClaimChanges(project);
          writeClaimIndex(project, "many-a", Array.from({ length: 17 }, (_, index) =>
            claimRecord(`CLAIM-A-${String(index).padStart(2, "0")}`, [`member-a-${index}`], "supported")
          ));
          writeClaimIndex(project, "many-b", Array.from({ length: 17 }, (_, index) =>
            claimRecord(`CLAIM-B-${String(index).padStart(2, "0")}`, [`member-b-${index}`], "supported")
          ));
          return null;
        },
      },
      {
        expected: "allow_stop",
        name: "ordinary-small-idle",
        prepare: () => {
          resetClaimChanges(project);
          return null;
        },
      },
    ] as const;

    for (const definition of definitions) {
      const changeId = definition.prepare();
      const before = provider.facts();
      const root = await boundedRequestData<Record<string, unknown>>(client.session.create({
        directory: project,
        title: `claim guard ${definition.name}`,
        metadata: {
          completionGuard: { grindEnabled: true, state: "running" },
          ...(changeId == null ? {} : { roadmapMission: { changeId } }),
        },
      }), `claim root ${definition.name}`);
      const rootID = String(root.id);
      rootIDs.add(rootID);
      openCodeVersion = String(root.version ?? openCodeVersion);
      const prompt = await boundedRequestData<{ info: Record<string, unknown> }>(client.session.prompt({
        sessionID: rootID,
        directory: project,
        model: { providerID: "proof", modelID: "proof-model" },
        system: "Return one short completion sentence and stop. Do not call tools.",
        tools: {},
        parts: [{ type: "text", text: `Complete the reviewed ${definition.name} claim proof.` }],
      }), `claim prompt ${definition.name}`);
      if (prompt.info.error != null) throw new Error(`Primary claim prompt failed: ${definition.name}`);
      const expectedStatus = definition.expected === "continue" ? "continued" : "passed";
      const audit = await waitAuditChild(client, rootID, project, expectedStatus);
      if (definition.expected === "continue") {
        await boundedRequestData(client.session.command({
          arguments: "",
          command: "disable-grind",
          directory: project,
          sessionID: rootID,
        }), `disable continued claim ${definition.name}`);
        await waitGuard(client, rootID, project, ["disabled"], 10_000);
      } else {
        await waitGuard(client, rootID, project, ["passed"], 10_000);
      }
      const completionEvidence = record(audit.request.completionEvidence) ?? {};
      const claimEvidence = record(completionEvidence.claimEvidence) ?? {};
      const verdict = String(audit.result.verdict ?? "unknown");
      assert(verdict === definition.expected, `${definition.name} verdict was ${verdict}`);
      const after = provider.facts();
      cases.push({
        arbiterRequest: {
          auditKind: audit.request.auditKind,
          claimEvidence,
          requestBytes: audit.requestBytes,
          rootSessionRef: audit.request.rootSessionRef,
        },
        arbiterResult: {
          claimMatrix: audit.result.claimMatrix,
          evidenceGaps: audit.result.evidenceGaps,
          unresolved: audit.result.unresolved,
          verdict,
        },
        expected: definition.expected,
        name: definition.name,
        providerCalls: {
          arbiter: after.arbiterCalls - before.arbiterCalls,
          primary: after.primaryCalls - before.primaryCalls,
        },
        rootSessionRef: hashRef("session", rootID),
        rootState: definition.expected === "continue" ? "disabled-after-continued" : "passed",
      });
      const children = await boundedRequestData<Array<Record<string, unknown>>>(
        client.session.children({ sessionID: rootID, directory: project }),
        `claim cleanup children ${definition.name}`,
      );
      for (const child of children) {
        await boundedRequestData(client.session.delete({ sessionID: String(child.id), directory: project }), "claim child delete");
      }
      await boundedRequestData(client.session.delete({ sessionID: rootID, directory: project }), "claim root delete");
      rootIDs.delete(rootID);
    }
    const calls = provider.facts();
    assert(calls.arbiterCalls === 4, `Claim proof expected four arbiter calls, got ${calls.arbiterCalls}`);
    assert(calls.primaryCalls <= 8, `Claim proof primary call bound exceeded: ${calls.primaryCalls}`);
    fs.mkdirSync(opts.evidenceRoot, { recursive: false });
    fs.writeFileSync(path.join(opts.evidenceRoot, "raw.json"), json({
      candidateId: opts.candidateId,
      cases,
      cleanup: "pending",
      environment: {
        configDigest: new Bun.CryptoHasher("sha256").update(fs.readFileSync(path.join(configDir, "opencode.json"))).digest("hex"),
        model: "proof/proof-model",
        openCode: openCodeVersion,
        platform: process.platform,
        pluginResolverWarmup,
        pluginStartupTrace: readPluginStartupTrace(dataDir),
        sourceHashes: sourceHashes(),
      },
      provider: { ...calls, externalCalls: 0, totalBound: 12 },
      scenario: "claims",
      schemaVersion: 1,
    }), "utf8");
  } catch (error) {
    proofError = error;
    if (!fs.existsSync(opts.evidenceRoot)) fs.mkdirSync(opts.evidenceRoot, { recursive: false });
    fs.writeFileSync(path.join(opts.evidenceRoot, "failure.json"), json({
      candidateId: opts.candidateId,
      cases,
      cleanup: "pending",
      error: error instanceof Error ? error.message : String(error),
      openCode: openCodeVersion,
      pluginResolverWarmup,
      pluginStartupTrace: readPluginStartupTrace(dataDir),
      provider: provider.facts(),
      scenario: "claims",
      schemaVersion: 1,
      status: "failed",
    }), { encoding: "utf8", flag: "wx" });
    throw error;
  } finally {
    if (server != null) {
      try {
        const client = proofClient(server.url, project);
        for (const rootID of rootIDs) {
          try {
            const children = await boundedRequestData<Array<Record<string, unknown>>>(
              client.session.children({ sessionID: rootID, directory: project }),
              "claim final cleanup children",
            );
            for (const child of children) await client.session.delete({ sessionID: String(child.id), directory: project });
            await client.session.delete({ sessionID: rootID, directory: project });
          } catch { /* process cleanup still owns the disposable server tree */ }
        }
      } finally {
        await stopOpenCode(server);
        fs.rmSync(path.join(fixture, "server-pid.json"), { force: true });
      }
    }
    provider.server.stop(true);
    const diagnostics = server == null ? null : {
      pluginStartupTrace: readPluginStartupTrace(dataDir),
      stderrChars: server.stderr.join("").length,
      stderrError: /\b(?:error|fatal|panic)\b/i.test(server.stderr.join("")),
      stdoutChars: server.stdout.join("").length,
    };
    removeProofFixture(fixture);
    if (fs.existsSync(path.join(opts.evidenceRoot, "raw.json"))) {
      const raw = JSON.parse(fs.readFileSync(path.join(opts.evidenceRoot, "raw.json"), "utf8")) as Record<string, unknown>;
      raw.cleanup = "complete";
      raw.diagnostics = diagnostics;
      raw.processCleanup = "complete";
      fs.writeFileSync(path.join(opts.evidenceRoot, "raw.json"), json(raw), "utf8");
    } else if (fs.existsSync(path.join(opts.evidenceRoot, "failure.json"))) {
      const failure = JSON.parse(fs.readFileSync(path.join(opts.evidenceRoot, "failure.json"), "utf8")) as Record<string, unknown>;
      failure.cleanup = "complete";
      failure.diagnostics = diagnostics;
      failure.processCleanup = "complete";
      fs.writeFileSync(path.join(opts.evidenceRoot, "failure.json"), json(failure), "utf8");
    } else if (proofError == null) {
      throw new Error("Claim guard proof did not publish evidence");
    }
    stage("cleanup-complete");
  }
  stage("capture-complete");
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
    removeProofFixture(fixture);
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
  let guardCommands: string[] = [];
  let seedStatusTypes: string[] = [];
  let currentStage = "setup";
  try {
    server = await startOpenCode(configDir, dataDir, project, true);
    fs.writeFileSync(path.join(fixture, "server-pid.json"), json({ pid: server.child.pid }), "utf8");
    currentStage = "retention-server-1-ready";
    stage("retention-server-1-ready");
    let client = proofClient(server.url, project);
    const commands = await boundedRequestData<unknown>(client.command.list({ directory: project }), "retention command list");
    const commandRecord = record(commands);
    const commandRows = Array.isArray(commands)
      ? commands
      : Array.isArray(commandRecord?.data)
        ? commandRecord.data
        : Array.isArray(record(commandRecord?.data)?.data)
          ? record(commandRecord?.data)!.data as unknown[]
          : [];
    guardCommands = commandRows.map(record).flatMap((row) => {
      const name = typeof row?.name === "string" ? row.name : typeof row?.id === "string" ? row.id : null;
      return name == null ? [] : [name];
    }).filter((name) => name === "disable-grind" || name === "enable-grind").sort();
    assert(guardCommands.join(",") === "disable-grind,enable-grind", `Completion guard control commands are unavailable: ${guardCommands.join(",")}`);
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
        guardCommands,
        provider: provider.facts(),
        scenario: opts.scenario,
        schemaVersion: 1,
        seedStatusTypes,
        startup: {
          ...proofServerStartupFacts(server.stdout.join(""), server.stderr.join(""), configDir),
          readyMs: server.readyMs,
        },
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
    removeProofFixture(fixture);
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
  const failurePath = path.join(opts.evidenceRoot, "failure.json");
  if (!fs.existsSync(rawPath) && fs.existsSync(failurePath)) {
    const failure = JSON.parse(fs.readFileSync(failurePath, "utf8")) as Record<string, unknown>;
    assert(failure.candidateId === opts.candidateId && failure.scenario === opts.scenario, "Failure capture correlation mismatch");
    assert(failure.cleanup === "complete" && failure.processCleanup === "complete", "Failure capture cleanup is incomplete");
    const provider = record(failure.provider) ?? {};
    if (opts.scenario === "claims" && (Number(provider.arbiterCalls ?? 0) > 0 || Number(provider.primaryCalls ?? 0) > 0)) {
      fs.writeFileSync(path.join(opts.evidenceRoot, "evaluation.json"), json({
        candidateId: opts.candidateId,
        cleanup: "complete",
        failureClass: "proof-runner-provider-bound",
        liveAttemptGate: "blocked",
        providerCalls: {
          arbiter: Number(provider.arbiterCalls ?? 0),
          primary: Number(provider.primaryCalls ?? 0),
        },
        scenario: opts.scenario,
        schemaVersion: 1,
        status: "blocked",
        terminalReplayResult: "blocked-after-guard",
        unlockCondition: "Correct the stale provider-call bound, preserve all case evidence on failure, then use one create-new capture.",
      }), { encoding: "utf8", flag: "wx" });
      return;
    }
    assert(Number(provider.arbiterCalls ?? 0) === 0 && Number(provider.primaryCalls ?? 0) === 0, "Startup failure unexpectedly reached provider effects");
    fs.writeFileSync(path.join(opts.evidenceRoot, "evaluation.json"), json({
      candidateId: opts.candidateId,
      cleanup: "complete",
      failureClass: "proof-runner-environment-readiness",
      liveAttemptGate: "blocked",
      scenario: opts.scenario,
      schemaVersion: 1,
      status: "blocked",
      terminalReplayResult: "blocked-before-guard",
      unlockCondition: "Use a causally distinct isolated plugin-startup mechanism before another installed claim capture.",
    }), { encoding: "utf8", flag: "wx" });
    return;
  }
  const raw = JSON.parse(fs.readFileSync(rawPath, "utf8")) as Record<string, unknown>;
  if (opts.scenario === "claims") {
    assert(raw.candidateId === opts.candidateId && raw.scenario === "claims", "Claim capture candidate correlation mismatch");
    assert(raw.cleanup === "complete" && raw.processCleanup === "complete", "Claim capture cleanup is incomplete");
    const cases = Array.isArray(raw.cases) ? raw.cases.map(record).filter(Boolean) : [];
    assert(cases.length === 4, `Claim capture must contain four cases, got ${cases.length}`);
    const byName = new Map(cases.map((entry) => [String(entry?.name), entry]));
    const representative = byName.get("representative-overclaim") ?? {};
    const exact = byName.get("supported-exact") ?? {};
    const truncated = byName.get("truncated-closure") ?? {};
    const ordinary = byName.get("ordinary-small-idle") ?? {};
    const claimProjection = (entry: Record<string, unknown>): Record<string, unknown> =>
      record(record(entry.arbiterRequest)?.claimEvidence) ?? {};
    const verdict = (entry: Record<string, unknown>): string => String(record(entry.arbiterResult)?.verdict ?? "unknown");
    const representativeClaims = Array.isArray(claimProjection(representative).claims)
      ? claimProjection(representative).claims as Array<Record<string, unknown>>
      : [];
    assert(verdict(representative) === "continue" && representativeClaims[0]?.closureState === "blocked", "Representative overclaim did not continue with blocked closure");
    const exactClaims = Array.isArray(claimProjection(exact).claims)
      ? claimProjection(exact).claims as Array<Record<string, unknown>>
      : [];
    assert(verdict(exact) === "allow_stop" && exactClaims[0]?.closureState === "supported", "Supported exact claim did not stop");
    const truncatedProjection = claimProjection(truncated);
    const omissions = Array.isArray(truncatedProjection.omissions) ? truncatedProjection.omissions.map(record) : [];
    assert(
      verdict(truncated) === "continue" && truncatedProjection.complete === false && omissions.some((entry) => entry?.code === "claim-limit" && entry.omitted === 2),
      "Truncated closure did not continue with an exact omission",
    );
    const ordinaryProjection = claimProjection(ordinary);
    assert(
      verdict(ordinary) === "allow_stop" && ordinaryProjection.complete === true && Array.isArray(ordinaryProjection.claims) && ordinaryProjection.claims.length === 0,
      "Ordinary Small idle behavior changed",
    );
    const provider = record(raw.provider) ?? {};
    assert(provider.arbiterCalls === 4 && Number(provider.primaryCalls) <= 8 && Number(provider.arbiterCalls) + Number(provider.primaryCalls) <= 12 && provider.externalCalls === 0, "Claim provider-call bound or isolation failed");
    const environment = record(raw.environment) ?? {};
    assert(environment.model === "proof/proof-model" && typeof environment.configDigest === "string", "Claim environment identity is incomplete");
    assert(Array.isArray(environment.sourceHashes) && environment.sourceHashes.length === 7, "Claim source identities are incomplete");
    fs.writeFileSync(path.join(opts.evidenceRoot, "evaluation.json"), json({
      candidateId: opts.candidateId,
      cleanup: "complete",
      decisions: {
        ordinarySmall: "allow_stop",
        representativeOverclaim: "continue",
        supportedExact: "allow_stop",
        truncatedClosure: "continue",
      },
      providerCalls: { arbiter: provider.arbiterCalls, external: 0, primary: provider.primaryCalls },
      scenario: "claims",
      schemaVersion: 1,
      status: "complete",
    }), { encoding: "utf8", flag: "wx" });
    return;
  }
  if (opts.scenario === "multi-root") {
    const multiRoot = record(raw.multiRoot) ?? {};
    const provider = record(raw.provider) ?? {};
    const environment = record(raw.environment) ?? {};
    assert(raw.candidateId === opts.candidateId && raw.scenario === "multi-root", "Multi-root capture candidate correlation mismatch");
    assert(raw.cleanup === "complete", "Multi-root cleanup is incomplete");
    assert(multiRoot.roots === 35 && multiRoot.accepted === 34 && multiRoot.passed === 3 && multiRoot.cancelled === 31 && multiRoot.rejected === 1, "Multi-root terminal population differed");
    assert(multiRoot.healthyQueuedPassed === true, "Multi-root queued healthy root did not complete after saturated-root release");
    assert(Number(multiRoot.workloadElapsedMs) > 0 && Number(multiRoot.workloadElapsedMs) < 120_000, "Multi-root workload exceeded its terminal bound");
    assert(multiRoot.activeLimit === 2 && multiRoot.queueLimit === 32, "Multi-root configured bounds differed");
    assert(provider.primaryCalls === 35 && provider.arbiterCalls === 3 && provider.maxArbiterInFlight === 2, "Multi-root provider bounds differed");
    assert(Array.isArray(provider.rootRefs) && new Set(provider.rootRefs).size === 3, "Multi-root retained routing was not unique");
    assert(environment.model === "proof/proof-model" && Array.isArray(environment.sourceHashes) && environment.sourceHashes.length === 8, "Multi-root environment identity is incomplete");
    assert(Number(environment.serverReadyMs) > 0 && Number(environment.serverReadyMs) <= PROOF_SERVER_READINESS_MS, "Multi-root server readiness exceeded its configured bound");
    fs.writeFileSync(path.join(opts.evidenceRoot, "evaluation.json"), json({
      candidateId: opts.candidateId,
      cleanup: "complete",
      installedBoundary: "35-roots-two-active-32-queued-one-overload-31-cancelled-healthy-queued-pass",
      providerCalls: { arbiter: provider.arbiterCalls, external: 0, primary: provider.primaryCalls },
      scenario: "multi-root",
      schemaVersion: 1,
      status: "complete",
    }), { encoding: "utf8", flag: "wx" });
    return;
  }
  if (opts.scenario === "retention-preflight") {
    assert(raw.candidateId === opts.candidateId && raw.scenario === "retention-preflight", "Retention preflight candidate correlation mismatch");
    assert(raw.cleanup === "complete", "Retention preflight cleanup is incomplete");
    assert(Array.isArray(raw.seedStatusTypes) && raw.seedStatusTypes.length === 2 && raw.seedStatusTypes.every((status) => status === "absent-idle" || status === "idle"), "Retention preflight seeds were not canonically idle");
    assert(Array.isArray(raw.guardCommands) && raw.guardCommands.join(",") === "disable-grind,enable-grind", "Retention preflight did not load completion guard controls");
    const startup = record(raw.startup) ?? {};
    assert(startup.hostConfigLoaded === false, "Retention preflight loaded host config");
    assert(startup.isolatedConfigLoaded === true, "Retention preflight did not load the isolated config");
    assert(startup.ripgrepDownloadRequested === false, "Retention preflight attempted a ripgrep download");
    assert(typeof startup.readyMs === "number" && startup.readyMs <= PROOF_SERVER_READINESS_MS, "Retention preflight exceeded the runtime readiness bound");
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
  const timedOutPhase = await new Promise<string | null>((resolve) => {
    let phase = "startup";
    let timer: ReturnType<typeof setTimeout> | undefined;
    const arm = (timeoutMs: number) => {
      if (timer != null) clearTimeout(timer);
      timer = setTimeout(() => {
        child.kill();
        resolve(phase);
      }, timeoutMs);
    };
    arm(opts.scenario === "multi-root" ? PROOF_SERVER_READINESS_MS : 120_000);
    if (opts.scenario === "multi-root") {
      child.stderr.on("data", (chunk) => {
        if (phase === "startup" && String(chunk).includes('"stage":"multi-root-server-ready"')) {
          phase = "workload";
          arm(120_000);
        }
      });
    }
    child.once("exit", () => { if (timer != null) clearTimeout(timer); resolve(null); });
  });
  if (timedOutPhase != null) {
    await new Promise((resolve) => child.exitCode == null ? child.once("exit", resolve) : resolve(undefined));
    const pidFile = path.join(fixture, "server-pid.json");
    if (fs.existsSync(pidFile)) {
      const processRecord = record(JSON.parse(fs.readFileSync(pidFile, "utf8"))) ?? {};
      const pid = Number(processRecord.pid);
      const port = Number(processRecord.port);
      if (Number.isSafeInteger(pid) && pid > 0) spawnSync("taskkill", ["/PID", String(pid), "/T", "/F"], { shell: false, stdio: "ignore" });
      if (Number.isSafeInteger(port) && port > 0 && port <= 65_535) await stopProofListener(port);
    }
    removeProofFixture(fixture);
    throw new Error(`Guard restart worker exceeded its ${timedOutPhase} terminal limit`);
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
  : parsed.mode === "evaluate"
    ? Promise.resolve().then(() => evaluate(parsed))
  : internalWorker
    ? parsed.scenario === "claims"
      ? runClaims(parsed)
      : parsed.scenario === "multi-root"
      ? runMultiRoot(parsed)
      : parsed.scenario === "retry"
      ? runRetry(parsed)
      : runRetention(parsed)
    : supervise(parsed);
execution.catch((error) => {
  console.error(json({ error: error instanceof Error ? error.message : String(error), status: "blocked" }).trimEnd());
  process.exitCode = 1;
});
