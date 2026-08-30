import crypto from "node:crypto";
import fs from "node:fs";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import { spawn, spawnSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";
import {
  configuredProofServerEnvironment,
  installedOpenCodeIdentity,
  proofClient,
  proofErrorFacts,
  proofServerLogs,
  proofServerStartupFailure,
  requestData,
  seedProofConfigDependencies,
  startProofServer,
  stopProofServer,
  isolatedProofServerEnvironment,
  type ProofServerHandle,
} from "./lib/opencode-proof-client.ts";
import { stableJson } from "../../global/bin/roadmap-mission/contracts.ts";
import { resolvePortableCommand } from "../../global/bin/portable-process.ts";
import { createKaizenFeature, createKaizenPluginHooks } from "../../global/plugin/kaizen/index.ts";
import {
  KAIZEN_LIFECYCLE_BYTES,
  KAIZEN_LIFECYCLE_LIMIT,
  KAIZEN_SIGNAL_BYTES,
  KAIZEN_SIGNAL_LIMIT,
} from "../../global/plugin/kaizen/store.ts";

type Options = {
  evidenceDir: string | null;
  help: boolean;
  mode: "preflight" | "capture-compaction-identity" | "store-boundary" | "archive-boundary" | "triage-boundary" | "population" | "loaded-tools" | "loaded-tools-preflight" | "replay-loaded-tools";
  opencode: string | null;
};

type ProviderRequest = {
  bytes: number;
  sha256: string;
  stream: boolean;
  toolNames: string[];
};

type ProviderHandle = {
  close(): Promise<void>;
  requests(): ProviderRequest[];
  trapped(): number;
  url: string;
};

const sourceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const evidenceRoot = path.join(sourceRoot, "openspec", "changes", "add-cross-project-kaizen-loop", "evidence");
const acceptedStoreEnvelope = {
  lifecycleBytes: 4 * 1024,
  lifecycleLimit: 8_000,
  signalBytes: 16 * 1024,
  signalLimit: 2_000,
};
const seedText = "KZN_COMPACTION_IDENTITY_SEED_R1";
const summaryText = [
  "Original User Goal",
  "- Preserve one synthetic Kaizen compaction identity.",
  "",
  "Goal Status",
  "- working",
  "",
  "Session Reflection",
  "- Outcome: Synthetic compaction identity captured.",
  "- Slowest Loop Or Largest Time Sink: none.",
  "- Concrete Evidence: one root compaction.",
  "- Likely Cause And Uncertainty: synthetic fixture only.",
  "- Do Not Repeat: no extra summarization call.",
].join("\n");
const loadedSignal = {
  kind: "tooling-gap",
  summary: "Loaded Kaizen status boundary needs an explicit observation",
  observedEvidence: "The copied plugin must execute report and status through pinned OpenCode.",
  impact: "Without the loaded observation, direct-module evidence could be mistaken for installed behavior.",
  likelyCause: "Task 1.4 has not yet retained a loaded tool-call bundle.",
  doNotRepeat: "Do not claim loaded Kaizen tools from direct imports alone.",
  scopeHint: "opencode-kit",
  evidenceRefs: ["tools/proofs/cross-project-kaizen.ts"],
} as const;

function usage(): string {
  return [
    "Usage:",
    "  node tools/proofs/cross-project-kaizen.ts --mode preflight --opencode <absolute-path>",
    "  node tools/proofs/cross-project-kaizen.ts --mode capture-compaction-identity --opencode <absolute-path> --evidence-dir <path>",
    "  node tools/proofs/cross-project-kaizen.ts --mode store-boundary --evidence-dir <path>",
    "  node tools/proofs/cross-project-kaizen.ts --mode archive-boundary --evidence-dir <path>",
    "  node tools/proofs/cross-project-kaizen.ts --mode triage-boundary --evidence-dir <path>",
    "  node tools/proofs/cross-project-kaizen.ts --mode population --evidence-dir <path>",
    "  node tools/proofs/cross-project-kaizen.ts --mode loaded-tools --opencode <absolute-path> --evidence-dir <path>",
    "  node tools/proofs/cross-project-kaizen.ts --mode loaded-tools-preflight --opencode <absolute-path> --evidence-dir <path>",
    "  node tools/proofs/cross-project-kaizen.ts --mode replay-loaded-tools --evidence-dir <existing-path>",
    "",
    "Compaction identity mode uses one disposable Git root, isolated OpenCode state,",
    "one loopback model call, one event subscription, one message readback, and terminal",
    "session/server/provider/root cleanup. Store mode uses two consumer Git roots, one",
    "disabled control, one isolated data root, zero network/provider calls, immutable",
    "record readback, clean-worktree checks, and terminal root cleanup. Both modes retain",
    "identities and digests only; transcript and summary text are not persisted. Loaded-tools",
    "mode copies the production plugin, loads it through pinned OpenCode, uses one loopback",
    "prompt to execute report then status, and retains only bounded refs, tool facts, hashes,",
    "diagnostics, effects, and cleanup. Archive mode drives the canonical helper in five",
    "disposable roots, uses no provider, preserves only bounded state, and removes every root.",
    "Triage mode proves owner-root detail containment and one strictly valid disposable proposal",
    "from a consumer-origin signal with no provider, source-project write, or retained fixture.",
    "Population mode strictly reads the reviewed 25-member seed, runs focused production tests",
    "plus fresh archive/triage boundaries, and retains exact member-to-driver observations.",
  ].join("\n");
}

function parseArgs(argv: string[]): Options {
  const options: Options = { evidenceDir: null, help: false, mode: "preflight", opencode: null };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--help" || arg === "-h") options.help = true;
    else if (arg === "--mode") {
      const value = argv[++index];
      if (value !== "preflight" && value !== "capture-compaction-identity" && value !== "store-boundary" && value !== "archive-boundary" && value !== "triage-boundary" && value !== "population" && value !== "loaded-tools" && value !== "loaded-tools-preflight" && value !== "replay-loaded-tools") throw new Error(`Invalid --mode: ${value ?? "missing"}`);
      options.mode = value;
    } else if (arg === "--opencode") options.opencode = argv[++index] ?? null;
    else if (arg === "--evidence-dir") options.evidenceDir = argv[++index] ?? null;
    else throw new Error(`Unknown option: ${arg}`);
  }
  if (options.help) return options;
  if (options.mode !== "store-boundary" && options.mode !== "archive-boundary" && options.mode !== "triage-boundary" && options.mode !== "population" && options.mode !== "replay-loaded-tools" && (options.opencode == null || !path.isAbsolute(options.opencode))) throw new Error("--opencode must be an absolute path");
  if (options.mode !== "preflight" && options.evidenceDir == null) throw new Error(`${options.mode} requires --evidence-dir`);
  if (options.mode === "preflight" && options.evidenceDir != null) throw new Error("Preflight mode does not write evidence");
  if ((options.mode === "store-boundary" || options.mode === "archive-boundary" || options.mode === "triage-boundary" || options.mode === "population" || options.mode === "replay-loaded-tools") && options.opencode != null) throw new Error(`${options.mode} does not use --opencode`);
  return options;
}

function sha256(value: string | Buffer): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function readJson(file: string): Record<string, unknown> {
  return JSON.parse(fs.readFileSync(file, "utf8")) as Record<string, unknown>;
}

function staticIdentity(opencode: string): Record<string, unknown> {
  const legacyTypes = fs.readFileSync(path.join(sourceRoot, "global", "node_modules", "@opencode-ai", "sdk", "dist", "gen", "types.gen.d.ts"), "utf8");
  const v2Types = fs.readFileSync(path.join(sourceRoot, "global", "node_modules", "@opencode-ai", "sdk", "dist", "v2", "gen", "types.gen.d.ts"), "utf8");
  const sdkPackage = readJson(path.join(sourceRoot, "global", "node_modules", "@opencode-ai", "sdk", "package.json"));
  const pluginPackage = readJson(path.join(sourceRoot, "global", "node_modules", "@opencode-ai", "plugin", "package.json"));
  const sourceAssertions = {
    legacyCompactedSessionOnly: /type: "session\.compacted";\s*properties: \{\s*sessionID: string;\s*\};/u.test(legacyTypes),
    legacySummaryIdentity: /id: string;\s*sessionID: string;\s*role: "assistant";[\s\S]*?parentID: string;[\s\S]*?summary\?: boolean;/u.test(legacyTypes),
    v2CompactedSessionOnly: /type: "session\.compacted";\s*properties: \{\s*sessionID: string;\s*\};/u.test(v2Types),
    v2MessagesBeforeCursor: /limit\?: number;\s*before\?: string;/u.test(v2Types),
  };
  if (Object.values(sourceAssertions).some((value) => !value)) throw new Error(`Pinned SDK source assertion failed: ${JSON.stringify(sourceAssertions)}`);
  return {
    node: process.version,
    opencode: installedOpenCodeIdentity(opencode),
    pluginVersion: pluginPackage.version ?? null,
    sdkVersion: sdkPackage.version ?? null,
    sourceAssertions,
  };
}

function contentBytes(value: unknown): number {
  return Buffer.byteLength(typeof value === "string" ? value : JSON.stringify(value ?? ""), "utf8");
}

function completion(text: string, stream: boolean): string {
  const id = `chatcmpl_${crypto.randomUUID()}`;
  const created = Math.floor(Date.now() / 1_000);
  if (!stream) {
    return JSON.stringify({
      id,
      object: "chat.completion",
      created,
      model: "proof-model",
      choices: [{ index: 0, message: { role: "assistant", content: text }, finish_reason: "stop" }],
      usage: { prompt_tokens: 10, completion_tokens: 10, total_tokens: 20 },
    });
  }
  const chunks = [
    { id, object: "chat.completion.chunk", created, model: "proof-model", choices: [{ index: 0, delta: { role: "assistant", content: text }, finish_reason: null }] },
    { id, object: "chat.completion.chunk", created, model: "proof-model", choices: [{ index: 0, delta: {}, finish_reason: "stop" }] },
  ];
  return `${chunks.map((chunk) => `data: ${JSON.stringify(chunk)}\n\n`).join("")}data: [DONE]\n\n`;
}

function startProvider(): Promise<ProviderHandle> {
  const captured: ProviderRequest[] = [];
  let trapped = 0;
  const server = http.createServer((request, response) => {
    const url = request.url ?? "";
    if (url.endsWith("/models")) {
      response.writeHead(200, { "content-type": "application/json" });
      response.end(JSON.stringify({ object: "list", data: [{ id: "proof-model", object: "model", owned_by: "proof" }] }));
      return;
    }
    if (!url.endsWith("/chat/completions")) {
      trapped += 1;
      response.writeHead(502, { "content-type": "application/json" });
      response.end(JSON.stringify({ error: { message: "external egress blocked by Kaizen compaction proof" } }));
      return;
    }
    const chunks: Buffer[] = [];
    let bytes = 0;
    request.on("data", (chunk: Buffer) => {
      bytes += chunk.length;
      if (bytes <= 512 * 1024) chunks.push(chunk);
    });
    request.on("end", () => {
      if (bytes > 512 * 1024) {
        response.writeHead(413);
        response.end();
        return;
      }
      const body = Buffer.concat(chunks).toString("utf8");
      let parsed: Record<string, unknown> = {};
      try {
        parsed = JSON.parse(body) as Record<string, unknown>;
      } catch {
        trapped += 1;
      }
      const stream = parsed.stream === true;
      const tools = Array.isArray(parsed.tools) ? parsed.tools : [];
      const toolNames = tools.flatMap((tool) => {
        if (tool == null || typeof tool !== "object") return [];
        const row = tool as Record<string, unknown>;
        const fn = row.function != null && typeof row.function === "object" ? row.function as Record<string, unknown> : null;
        return typeof fn?.name === "string" ? [fn.name] : [];
      }).sort();
      captured.push({ bytes, sha256: sha256(body), stream, toolNames });
      response.writeHead(200, { "content-type": stream ? "text/event-stream" : "application/json" });
      response.end(completion(summaryText, stream));
    });
  });
  return new Promise((resolve, reject) => {
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (address == null || typeof address === "string") {
        reject(new Error("Loopback provider did not expose a TCP port"));
        return;
      }
      resolve({
        close: () => new Promise((done, fail) => {
          server.closeAllConnections();
          server.close((error) => error == null ? done() : fail(error));
        }),
        requests: () => [...captured],
        trapped: () => trapped,
        url: `http://127.0.0.1:${address.port}`,
      });
    });
    server.once("error", reject);
  });
}

function toolCallCompletion(name: string, input: unknown, stream: boolean, index: number): string {
  const id = `chatcmpl_kaizen_tools_${index}`;
  const callID = `call_kaizen_tools_${index}`;
  const created = Math.floor(Date.now() / 1_000);
  if (!stream) {
    return JSON.stringify({
      id,
      object: "chat.completion",
      created,
      model: "proof-model",
      choices: [{
        index: 0,
        message: { role: "assistant", content: null, tool_calls: [{ id: callID, type: "function", function: { name, arguments: JSON.stringify(input) } }] },
        finish_reason: "tool_calls",
      }],
    });
  }
  const chunks = [
    { id, object: "chat.completion.chunk", created, model: "proof-model", choices: [{ index: 0, delta: { role: "assistant", tool_calls: [{ index: 0, id: callID, type: "function", function: { name, arguments: JSON.stringify(input) } }] }, finish_reason: null }] },
    { id, object: "chat.completion.chunk", created, model: "proof-model", choices: [{ index: 0, delta: {}, finish_reason: "tool_calls" }] },
  ];
  return `${chunks.map((chunk) => `data: ${JSON.stringify(chunk)}\n\n`).join("")}data: [DONE]\n\n`;
}

function startToolProvider(): Promise<ProviderHandle> {
  const captured: ProviderRequest[] = [];
  let trapped = 0;
  const server = http.createServer((request, response) => {
    const url = request.url ?? "";
    if (url.endsWith("/models")) {
      response.writeHead(200, { "content-type": "application/json" });
      response.end(JSON.stringify({ object: "list", data: [{ id: "proof-model", object: "model", owned_by: "proof" }] }));
      return;
    }
    if (!url.endsWith("/chat/completions")) {
      trapped += 1;
      response.writeHead(502, { "content-type": "application/json" });
      response.end(JSON.stringify({ error: { message: "external egress blocked by Kaizen loaded-tools proof" } }));
      return;
    }
    const chunks: Buffer[] = [];
    let bytes = 0;
    request.on("data", (chunk: Buffer) => {
      bytes += chunk.length;
      if (bytes <= 512 * 1024) chunks.push(chunk);
    });
    request.on("end", () => {
      if (bytes > 512 * 1024) {
        response.writeHead(413);
        response.end();
        return;
      }
      const body = Buffer.concat(chunks).toString("utf8");
      let parsed: Record<string, unknown> = {};
      try {
        parsed = JSON.parse(body) as Record<string, unknown>;
      } catch {
        trapped += 1;
      }
      const stream = parsed.stream === true;
      const tools = Array.isArray(parsed.tools) ? parsed.tools : [];
      const toolNames = tools.flatMap((tool) => {
        if (tool == null || typeof tool !== "object") return [];
        const row = tool as Record<string, unknown>;
        const fn = row.function != null && typeof row.function === "object" ? row.function as Record<string, unknown> : null;
        return typeof fn?.name === "string" ? [fn.name] : [];
      }).sort();
      const index = captured.length;
      captured.push({ bytes, sha256: sha256(body), stream, toolNames });
      response.writeHead(200, { "content-type": stream ? "text/event-stream" : "application/json" });
      if (index === 0) response.end(toolCallCompletion("kaizen_report", { input: loadedSignal }, stream, index));
      else if (index === 1) response.end(toolCallCompletion("kaizen_status", { limit: 25 }, stream, index));
      else if (index === 2) response.end(completion("Loaded Kaizen report and status completed.", stream));
      else {
        trapped += 1;
        response.end(completion("Unexpected extra Kaizen provider call.", stream));
      }
    });
  });
  return new Promise((resolve, reject) => {
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (address == null || typeof address === "string") {
        reject(new Error("Loopback tool provider did not expose a TCP port"));
        return;
      }
      resolve({
        close: () => new Promise((done, fail) => {
          server.closeAllConnections();
          server.close((error) => error == null ? done() : fail(error));
        }),
        requests: () => [...captured],
        trapped: () => trapped,
        url: `http://127.0.0.1:${address.port}`,
      });
    });
    server.once("error", reject);
  });
}

function config(providerUrl: string, plugin?: string): Record<string, unknown> {
  return {
    $schema: "https://opencode.ai/config.json",
    model: "proof/proof-model",
    small_model: "proof/proof-model",
    permission: plugin == null ? "deny" : {
      "*": "deny",
      kaizen_report: "allow",
      kaizen_status: "allow",
      kaizen_decision: "allow",
      kaizen_checkpoint: "allow",
    },
    ...(plugin == null ? {} : { plugin: [plugin] }),
    provider: {
      proof: {
        npm: "@ai-sdk/openai-compatible",
        name: "Kaizen Compaction Identity Proof",
        options: { apiKey: "proof-not-secret", baseURL: `${providerUrl}/v1`, maxRetries: 0 },
        models: {
          "proof-model": {
            name: "Proof Model",
            tool_call: plugin != null,
            limit: { context: 100_000, output: 10_000 },
          },
        },
      },
    },
  };
}

function messageRows(messages: unknown[]): Array<Record<string, unknown>> {
  return messages.flatMap((message) => {
    if (message == null || typeof message !== "object") return [];
    const value = message as { info?: unknown; parts?: unknown };
    if (value.info == null || typeof value.info !== "object") return [];
    const info = value.info as Record<string, unknown>;
    if (info.role !== "assistant" || info.summary !== true) return [];
    const parts = Array.isArray(value.parts) ? value.parts : [];
    const text = parts.flatMap((part) => {
      if (part == null || typeof part !== "object") return [];
      const row = part as Record<string, unknown>;
      return row.type === "text" && typeof row.text === "string" ? [row.text] : [];
    }).join("\n");
    const time = info.time != null && typeof info.time === "object" ? info.time as Record<string, unknown> : {};
    return [{
      id: typeof info.id === "string" ? info.id : null,
      sessionID: typeof info.sessionID === "string" ? info.sessionID : null,
      parentID: typeof info.parentID === "string" ? info.parentID : null,
      created: typeof time.created === "number" ? time.created : null,
      completed: typeof time.completed === "number" ? time.completed : null,
      summary: true,
      textBytes: contentBytes(text),
      textSha256: sha256(text),
    }];
  });
}

function eventPayload(value: unknown): Record<string, unknown> | null {
  if (value == null || typeof value !== "object") return null;
  const row = value as Record<string, unknown>;
  if (row.type === "session.compacted") return row;
  const payload = row.payload;
  return payload != null && typeof payload === "object" && (payload as Record<string, unknown>).type === "session.compacted"
    ? payload as Record<string, unknown>
    : null;
}

function sessionIDOfEvent(value: Record<string, unknown>): string | null {
  const properties = value.properties;
  return properties != null && typeof properties === "object" && typeof (properties as Record<string, unknown>).sessionID === "string"
    ? (properties as Record<string, unknown>).sessionID as string
    : null;
}

async function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  let timer: NodeJS.Timeout | null = null;
  try {
    return await Promise.race([
      promise,
      new Promise<never>((_resolve, reject) => {
        timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
      }),
    ]);
  } finally {
    if (timer != null) clearTimeout(timer);
  }
}

function redact(text: string, roots: string[]): string {
  let result = text;
  for (const [index, root] of roots.entries()) {
    const slash = root.replaceAll("\\", "/");
    const escaped = JSON.stringify(root).slice(1, -1);
    for (const form of new Set([root, slash, escaped])) result = result.replaceAll(form, `<root-${index + 1}>`);
  }
  for (const value of Object.values(loadedSignal)) {
    if (typeof value === "string") {
      result = result.replaceAll(value, "<synthetic-kaizen-signal>");
      result = result.replaceAll(JSON.stringify(value).slice(1, -1), "<synthetic-kaizen-signal>");
    }
  }
  return result
    .replaceAll(seedText, "<synthetic-seed>")
    .replaceAll(JSON.stringify(seedText).slice(1, -1), "<synthetic-seed>")
    .replaceAll(summaryText, "<synthetic-summary>")
    .replaceAll(JSON.stringify(summaryText).slice(1, -1), "<synthetic-summary>")
    .replaceAll("proof-not-secret", "<proof-key>");
}

async function capture(options: Options, identity: Record<string, unknown>): Promise<void> {
  const requestedEvidenceDir = path.resolve(options.evidenceDir!);
  const relativeEvidence = path.relative(evidenceRoot, requestedEvidenceDir);
  if (relativeEvidence === "" || relativeEvidence.startsWith("..") || path.isAbsolute(relativeEvidence)) {
    throw new Error("--evidence-dir must be a new child of the Kaizen change evidence directory");
  }
  if (fs.existsSync(requestedEvidenceDir)) throw new Error("--evidence-dir already exists");
  fs.mkdirSync(requestedEvidenceDir);

  const fixtureRoot = fs.mkdtempSync(path.join(os.tmpdir(), "opencode-kaizen-compaction-"));
  const projectRoot = path.join(fixtureRoot, "project");
  const configDir = path.join(fixtureRoot, "config");
  const runtimeRoot = path.join(fixtureRoot, "runtime");
  fs.mkdirSync(projectRoot, { recursive: true });
  const git = spawnSync("git", ["init", "--quiet", projectRoot], { encoding: "utf8", shell: false, windowsHide: true });
  if (git.status !== 0) throw new Error(`Disposable git init failed: ${git.stderr.trim()}`);

  let provider: ProviderHandle | null = null;
  let proofServer: ProofServerHandle | null = null;
  let sessionID: string | null = null;
  let eventAbort: AbortController | null = null;
  let eventCollector: Promise<void> | null = null;
  const compactedEvents: Record<string, unknown>[] = [];
  const cleanup: Record<string, unknown> = {
    activeConfigUnchanged: false,
    eventStreamClosed: false,
    fixtureRemoved: false,
    providerClosed: false,
    serverStopped: false,
    sessionDeleted: false,
  };
  const activeConfig = path.join(sourceRoot, "global", "opencode.json");
  const activeConfigBefore = sha256(fs.readFileSync(activeConfig));
  const bundle: Record<string, unknown> = {
    schemaVersion: 1,
    status: "failed",
    candidate: "cross-project-kaizen-loop-runtime-api-gate-r1",
    environment: identity,
    invocation: "node tools/proofs/cross-project-kaizen.ts --mode capture-compaction-identity --opencode <installed-opencode> --evidence-dir openspec/changes/add-cross-project-kaizen-loop/evidence/compaction-identity-r1",
    stage: "setup",
    provider: null,
    event: null,
    messages: null,
    checks: null,
    cleanup,
    diagnostics: null,
    error: null,
  };

  try {
    provider = await startProvider();
    bundle.stage = "server-start";
    const configured = config(provider.url);
    seedProofConfigDependencies(configDir, path.join(sourceRoot, "global"));
    const environment = configuredProofServerEnvironment(process.env, configDir, runtimeRoot, configured);
    environment.ALL_PROXY = provider.url;
    environment.HTTP_PROXY = provider.url;
    environment.HTTPS_PROXY = provider.url;
    environment.NO_PROXY = "127.0.0.1,localhost";
    environment.HOME = path.join(runtimeRoot, "home");
    environment.USERPROFILE = environment.HOME;
    environment.XDG_DATA_HOME = path.join(runtimeRoot, "data");
    for (const key of ["ANTHROPIC_API_KEY", "AZURE_OPENAI_API_KEY", "GOOGLE_GENERATIVE_AI_API_KEY", "OPENAI_API_KEY", "XAI_API_KEY"]) delete environment[key];
    fs.mkdirSync(path.dirname(environment.OPENCODE_DB!), { recursive: true });
    proofServer = await startProofServer(options.opencode!, projectRoot, environment);
    const client = proofClient(proofServer.url, projectRoot, environment);

    bundle.stage = "session-create";
    const session = await withTimeout(requestData<Record<string, unknown>>(client.session.create({ directory: projectRoot, title: "kaizen-compaction-identity-r1" }) as Promise<unknown>, "Kaizen compaction session create"), 30_000, "session create");
    if (typeof session.id !== "string" || session.parentID != null) throw new Error("Created Kaizen compaction session is not a verified root session");
    sessionID = session.id;

    bundle.stage = "seed";
    await withTimeout(requestData(client.session.prompt({
      directory: projectRoot,
      sessionID,
      noReply: true,
      model: { providerID: "proof", modelID: "proof-model" },
      parts: [{ type: "text", text: seedText }],
      tools: {},
    }) as Promise<unknown>, "Kaizen compaction seed"), 30_000, "seed message");
    if (provider.requests().length !== 0) throw new Error("Seed message unexpectedly invoked the provider");

    const before = await withTimeout(requestData<unknown[]>(client.session.messages({ directory: projectRoot, limit: 100, sessionID }) as Promise<unknown>, "Kaizen pre-compaction messages"), 30_000, "pre-compaction messages");
    const summariesBefore = messageRows(before);

    bundle.stage = "event-subscribe";
    eventAbort = new AbortController();
    const subscription = await withTimeout(client.event.subscribe({ directory: projectRoot }, { signal: eventAbort.signal }), 30_000, "event subscribe");
    eventCollector = (async () => {
      try {
        for await (const event of subscription.stream) {
          const compacted = eventPayload(event);
          if (compacted != null) compactedEvents.push(compacted);
        }
      } catch (error) {
        if (!eventAbort?.signal.aborted) throw error;
      }
    })();

    bundle.stage = "summarize";
    const summarizeAccepted = await withTimeout(requestData<boolean>(client.session.summarize({
      auto: false,
      directory: projectRoot,
      modelID: "proof-model",
      providerID: "proof",
      sessionID,
    }) as Promise<unknown>, "Kaizen compaction summarize"), 60_000, "summarize");
    const eventDeadline = Date.now() + 15_000;
    while (!compactedEvents.some((event) => sessionIDOfEvent(event) === sessionID) && Date.now() < eventDeadline) {
      await new Promise((resolve) => setTimeout(resolve, 25));
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
    eventAbort.abort();
    await withTimeout(eventCollector, 5_000, "event collector shutdown");
    cleanup.eventStreamClosed = true;

    bundle.stage = "message-readback";
    const after = await withTimeout(requestData<unknown[]>(client.session.messages({ directory: projectRoot, limit: 100, sessionID }) as Promise<unknown>, "Kaizen post-compaction messages"), 30_000, "post-compaction messages");
    const summariesAfter = messageRows(after);
    const beforeIds = new Set(summariesBefore.flatMap((row) => typeof row.id === "string" ? [row.id] : []));
    const newSummaries = summariesAfter.filter((row) => typeof row.id === "string" && !beforeIds.has(row.id));
    const rootEvents = compactedEvents.filter((event) => sessionIDOfEvent(event) === sessionID);
    const wrongRootEvents = compactedEvents.filter((event) => sessionIDOfEvent(event) !== sessionID);
    const checks = {
      activeConfigUnchanged: sha256(fs.readFileSync(activeConfig)) === activeConfigBefore,
      eventHasSessionOnlyIdentity: rootEvents.length === 1 && Object.keys((rootEvents[0]?.properties ?? {}) as object).sort().join(",") === "sessionID",
      exactlyOneNewSummary: newSummaries.length === 1,
      exactlyOneProviderCall: provider.requests().length === 1,
      noProviderCallBeforeSummarize: true,
      noTranscriptRetained: true,
      noWrongRootEvent: wrongRootEvents.length === 0,
      rootEventObserved: rootEvents.length === 1,
      rootSessionVerified: session.parentID == null,
      summaryAccepted: summarizeAccepted === true,
      summaryBelongsToRoot: newSummaries.length === 1 && newSummaries[0]?.sessionID === sessionID,
      summaryHasIdentity: newSummaries.length === 1 && typeof newSummaries[0]?.id === "string" && typeof newSummaries[0]?.created === "number",
      summaryTextMatchesProvider: newSummaries.length === 1 && newSummaries[0]?.textSha256 === sha256(summaryText),
      zeroEgressTraps: provider.trapped() === 0,
    };
    bundle.provider = { requests: provider.requests(), trapped: provider.trapped() };
    bundle.event = { compacted: rootEvents, wrongRootCount: wrongRootEvents.length };
    bundle.messages = {
      beforeCount: before.length,
      afterCount: after.length,
      summariesBefore,
      summariesAfter,
      newSummaries,
    };
    bundle.checks = checks;
    if (Object.values(checks).some((value) => !value)) throw new Error(`Kaizen compaction identity checks failed: ${JSON.stringify(checks)}`);
    bundle.status = "passed";
    bundle.stage = "cleanup";
  } catch (error) {
    bundle.error = proofErrorFacts(error);
  } finally {
    eventAbort?.abort();
    if (eventCollector != null) {
      try {
        await withTimeout(eventCollector, 5_000, "event collector finalization");
        cleanup.eventStreamClosed = true;
      } catch (error) {
        cleanup.eventStreamError = proofErrorFacts(error);
      }
    }
    if (proofServer != null && sessionID != null) {
      try {
        const client = proofClient(proofServer.url, projectRoot);
        const response = await client.session.delete({ directory: projectRoot, sessionID }) as { error?: unknown };
        if (response.error != null) throw response.error;
        cleanup.sessionDeleted = true;
      } catch (error) {
        cleanup.sessionDeleteError = proofErrorFacts(error);
      }
    }
    if (proofServer != null) {
      const logs = proofServerLogs(proofServer);
      try {
        cleanup.serverTerminal = await stopProofServer(proofServer);
        cleanup.serverStopped = true;
      } catch (error) {
        cleanup.serverStopError = proofErrorFacts(error);
      }
      bundle.diagnostics = {
        stderr: redact(logs.stderr, [fixtureRoot, sourceRoot, os.homedir()]),
        stdout: redact(logs.stdout, [fixtureRoot, sourceRoot, os.homedir()]),
      };
    }
    if (provider != null) {
      try {
        await provider.close();
        cleanup.providerClosed = true;
      } catch (error) {
        cleanup.providerCloseError = proofErrorFacts(error);
      }
    }
    cleanup.activeConfigUnchanged = sha256(fs.readFileSync(activeConfig)) === activeConfigBefore;
    fs.rmSync(fixtureRoot, { recursive: true, force: true });
    cleanup.fixtureRemoved = !fs.existsSync(fixtureRoot);
    const requiredCleanup = ["activeConfigUnchanged", "eventStreamClosed", "fixtureRemoved", "providerClosed", "serverStopped", "sessionDeleted"];
    if (requiredCleanup.some((key) => cleanup[key] !== true)) bundle.status = "failed";
    bundle.stage = "terminal";
    const serialized = redact(stableJson(bundle), [fixtureRoot, sourceRoot, os.homedir()]);
    for (const forbidden of [fixtureRoot, sourceRoot, os.homedir(), seedText, summaryText]) {
      if (serialized.includes(forbidden) || serialized.includes(forbidden.replaceAll("\\", "/"))) throw new Error("Retained Kaizen evidence contains forbidden private or transcript text");
    }
    fs.writeFileSync(path.join(requestedEvidenceDir, "bundle.json"), serialized, { encoding: "utf8", flag: "wx" });
    console.log(stableJson({ evidenceDir: path.relative(sourceRoot, requestedEvidenceDir).replaceAll("\\", "/"), status: bundle.status }).trim());
    if (bundle.status !== "passed") process.exitCode = 1;
  }
}

function gitInit(directory: string): void {
  fs.mkdirSync(directory, { recursive: true });
  const result = spawnSync("git", ["init", "--quiet"], { cwd: directory, encoding: "utf8", shell: false, windowsHide: true });
  if (result.status !== 0) throw new Error(`Disposable git init failed: ${result.stderr.trim()}`);
}

function gitClean(directory: string): boolean {
  const result = spawnSync("git", ["status", "--porcelain=v1", "--untracked-files=all"], { cwd: directory, encoding: "utf8", shell: false, windowsHide: true });
  return result.status === 0 && result.stdout.trim() === "";
}

function storeFileFacts(inboxRoot: string, fixtureRoot: string): Array<{ bytes: number; name: string; population: "lifecycle" | "signal"; privacySafe: boolean; sha256: string }> {
  return ([
    ["signals", "signal"],
    ["events", "lifecycle"],
  ] as const).flatMap(([directory, population]) => {
    const root = path.join(inboxRoot, directory);
    if (!fs.existsSync(root)) return [];
    return fs.readdirSync(root).sort().map((name) => {
      const bytes = fs.readFileSync(path.join(root, name));
      return {
        bytes: bytes.length,
        name: `${directory}/${name}`,
        population,
        privacySafe: !bytes.includes(Buffer.from(fixtureRoot)),
        sha256: sha256(bytes),
      };
    });
  });
}

function candidateSourceDigests(): Array<{ path: string; sha256: string }> {
  return [
    "global/plugin/kaizen/store.ts",
    "global/plugin/kaizen/index.ts",
    "global/plugin/session-env.ts",
    "global/plugin/project-memory/store.ts",
    "tools/test-cross-project-kaizen.ts",
    "tools/proofs/cross-project-kaizen.ts",
  ].map((relative) => ({ path: relative, sha256: sha256(fs.readFileSync(path.join(sourceRoot, ...relative.split("/")))) }));
}

async function storeBoundary(options: Options): Promise<void> {
  const requestedEvidenceDir = path.resolve(options.evidenceDir!);
  const evidenceName = path.basename(requestedEvidenceDir);
  const relativeEvidence = path.relative(evidenceRoot, requestedEvidenceDir);
  if (relativeEvidence === "" || relativeEvidence.startsWith("..") || path.isAbsolute(relativeEvidence)) {
    throw new Error("--evidence-dir must be a new child of the Kaizen change evidence directory");
  }
  if (fs.existsSync(requestedEvidenceDir)) throw new Error("--evidence-dir already exists");
  fs.mkdirSync(requestedEvidenceDir);

  const fixtureRoot = fs.mkdtempSync(path.join(os.tmpdir(), "opencode-kaizen-store-"));
  const projectA = path.join(fixtureRoot, "consumer-a");
  const projectB = path.join(fixtureRoot, "consumer-b");
  const projectDisabled = path.join(fixtureRoot, "consumer-disabled");
  const dataRoot = path.join(fixtureRoot, "data");
  const activeConfig = path.join(sourceRoot, "global", "opencode.json");
  const activeConfigBefore = sha256(fs.readFileSync(activeConfig));
  const bundle: Record<string, unknown> = {
    schemaVersion: 1,
    candidate: `cross-project-kaizen-loop-${evidenceName}`,
    environment: { node: process.version, platform: process.platform, providerCalls: 0, networkRequests: 0 },
    invocation: `node tools/proofs/cross-project-kaizen.ts --mode store-boundary --evidence-dir openspec/changes/add-cross-project-kaizen-loop/evidence/${evidenceName}`,
    status: "failed",
    checks: null,
    effects: null,
    cleanup: { fixtureRemoved: false },
    error: null,
  };
  try {
    gitInit(projectA);
    gitInit(projectB);
    gitInit(projectDisabled);
    const environment = { OPENCODE_DATA_DIR: dataRoot };
    const first = createKaizenFeature({ worktree: projectA, environment });
    const second = createKaizenFeature({ worktree: projectB, environment });
    if (first == null || second == null) throw new Error("Kaizen store boundary did not enable both project features");
    const [capturedA, capturedB] = await Promise.all([
      first.capture({
        kind: "friction",
        summary: `Repeated setup in ${projectA}`,
        observedEvidence: "The same disposable setup was repeated for consumer A.",
        impact: "Repeated setup delays the direct store observation.",
        likelyCause: "The proof setup is not yet shared.",
        doNotRepeat: "Do not rebuild equivalent setup without reusing the bounded helper.",
        scopeHint: "opencode-kit",
        evidenceRefs: ["tools/proofs/cross-project-kaizen.ts"],
      }, "explicit", {
        sessionRef: `session_${sha256("store-boundary-consumer-a").slice(0, 32)}`,
        sourceEventRef: "explicit:store-boundary-consumer-a",
      }, new Date("2026-08-29T09:00:00.000Z")),
      second.capture({
        kind: "tooling-gap",
        summary: `Missing local status command in ${projectB}`,
        observedEvidence: "Consumer B has no loaded bounded status command yet.",
        impact: "The operator cannot inspect the local inbox through a loaded tool.",
        likelyCause: "Task 1.4 has not composed the status tool.",
        doNotRepeat: "Do not infer loaded status behavior from direct module readback.",
        scopeHint: "opencode-kit",
        evidenceRefs: ["tools/proofs/cross-project-kaizen.ts"],
      }, "explicit", {
        sessionRef: `session_${sha256("store-boundary-consumer-b").slice(0, 32)}`,
        sourceEventRef: "explicit:store-boundary-consumer-b",
      }, new Date("2026-08-29T09:00:01.000Z")),
    ]);
    const status = await first.status();
    const inboxRoot = path.join(dataRoot, "kaizen", "v1", "inbox");
    const fileFacts = storeFileFacts(inboxRoot, fixtureRoot);
    const beforeDisabled = fileFacts.map((item) => item.sha256).join(":");
    const disabled = createKaizenFeature({ worktree: projectDisabled, environment: { ...environment, OPENCODE_KAIZEN: "0" } });
    const afterDisabled = storeFileFacts(inboxRoot, fixtureRoot).map((item) => item.sha256).join(":");
    const signalFiles = fileFacts.filter((item) => item.population === "signal");
    const lifecycleFiles = fileFacts.filter((item) => item.population === "lifecycle");
    const signalSchemaFacts = status.signals.map((signal) => ({
      acceptedFieldsPresent: ["schemaVersion", "sources", "summary", "observedEvidence", "impact", "likelyCause", "doNotRepeat", "scopeHint", "evidenceRefs", "projectRefs", "sessionRefs"]
        .every((field) => Object.hasOwn(signal, field)),
      evidenceRefCount: signal.evidenceRefs.length,
      projectRefsSafe: signal.projectRefs.length > 0 && signal.projectRefs.every((ref) => /^project_[a-f0-9]{32}$/u.test(ref)),
      scopeHint: signal.scopeHint,
      sessionRefsSafe: signal.sessionRefs.length > 0 && signal.sessionRefs.every((ref) => /^session_[a-f0-9]{12,64}$/u.test(ref)),
      signalRef: signal.signalRef,
      sourceKinds: signal.sources,
      textFieldsPresent: [signal.summary, signal.observedEvidence, signal.impact, signal.likelyCause, signal.doNotRepeat].every((value) => value.trim() !== ""),
    }));
    const checks = {
      activeConfigUnchanged: sha256(fs.readFileSync(activeConfig)) === activeConfigBefore,
      acceptedEnvelopeConstants: KAIZEN_SIGNAL_LIMIT === acceptedStoreEnvelope.signalLimit
        && KAIZEN_LIFECYCLE_LIMIT === acceptedStoreEnvelope.lifecycleLimit
        && KAIZEN_SIGNAL_BYTES === acceptedStoreEnvelope.signalBytes
        && KAIZEN_LIFECYCLE_BYTES === acceptedStoreEnvelope.lifecycleBytes,
      boundedRecords: signalFiles.length === 2
        && signalFiles.every((item) => item.bytes <= acceptedStoreEnvelope.signalBytes)
        && lifecycleFiles.length === 0,
      acceptedSignalSchema: signalSchemaFacts.length === 2 && signalSchemaFacts.every((fact) => fact.acceptedFieldsPresent
        && fact.evidenceRefCount > 0
        && fact.projectRefsSafe
        && fact.sessionRefsSafe
        && fact.sourceKinds.length === 1
        && fact.sourceKinds[0] === "explicit"
        && ["current-project", "opencode-kit", "external", "unknown"].includes(fact.scopeHint)
        && fact.textFieldsPresent),
      canonicalProjectIsolation: capturedA.projectRef !== capturedB.projectRef,
      disabledNoWrite: disabled == null && beforeDisabled === afterDisabled,
      durableReadback: status.counts.events === 2
        && status.counts.signalRecords === 2
        && status.counts.lifecycleEvents === 0
        && status.counts.signals === 2,
      networkFree: true,
      privacySafe: fileFacts.every((item) => item.privacySafe) && !JSON.stringify(status).includes(fixtureRoot),
      providerFree: true,
      stableRefs: /^project_[a-f0-9]{32}$/u.test(capturedA.projectRef) && /^project_[a-f0-9]{32}$/u.test(capturedB.projectRef),
      worktreesClean: gitClean(projectA) && gitClean(projectB) && gitClean(projectDisabled),
    };
    bundle.checks = checks;
    bundle.effects = {
      acceptedStoreEnvelope,
      candidateSources: candidateSourceDigests(),
      recordFiles: fileFacts,
      signalSchemaFacts,
      projectRefs: [capturedA.projectRef, capturedB.projectRef].sort(),
      signalRefs: [capturedA.signalRef, capturedB.signalRef].sort(),
      status: { counts: status.counts, totalSignals: status.totalSignals, truncated: status.truncated },
      worktreeWrites: 0,
    };
    if (Object.values(checks).some((value) => !value)) throw new Error(`Kaizen store boundary checks failed: ${JSON.stringify(checks)}`);
    bundle.status = "passed";
  } catch (error) {
    bundle.error = proofErrorFacts(error);
  } finally {
    fs.rmSync(fixtureRoot, { recursive: true, force: true });
    (bundle.cleanup as Record<string, unknown>).fixtureRemoved = !fs.existsSync(fixtureRoot);
    if ((bundle.cleanup as Record<string, unknown>).fixtureRemoved !== true) bundle.status = "failed";
    const serialized = redact(stableJson(bundle), [fixtureRoot, sourceRoot, os.homedir()]);
    for (const forbidden of [fixtureRoot, sourceRoot, os.homedir()]) {
      if (serialized.includes(forbidden) || serialized.includes(forbidden.replaceAll("\\", "/"))) throw new Error("Retained Kaizen store evidence contains a private root");
    }
    fs.writeFileSync(path.join(requestedEvidenceDir, "bundle.json"), serialized, { encoding: "utf8", flag: "wx" });
    console.log(stableJson({ evidenceDir: path.relative(sourceRoot, requestedEvidenceDir).replaceAll("\\", "/"), status: bundle.status }).trim());
    if (bundle.status !== "passed") process.exitCode = 1;
  }
}

function writeArchiveFixture(project: string, changeId: string): void {
  const write = (relative: string, content: string) => {
    const file = path.join(project, relative);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, content, { encoding: "utf8", flag: "wx" });
  };
  fs.mkdirSync(project, { recursive: true });
  gitInit(project);
  write("openspec/config.yaml", "schema: spec-driven\n");
  write(`openspec/changes/${changeId}/proposal.md`, `# Proposal\n\n## Why\n\nProve one disposable archive boundary.\n\n## What Changes\n\n- Add one disposable archive fixture.\n\n### Outcome Capsule\n\n- **Outcome**: Archive one disposable exact fixture.\n- **Operating Envelope**: One local disposable OpenSpec root.\n- **Non-Goals**: No remote, release, install, or production effect.\n- **Non-Deferrable Invariants**: Archive and harvest remain independent.\n- **Observable Proof**: Official archive output and checkpoint readback.\n- **Material Residual Risks**: none - disposable exact fixture.\n- **Stop Line**: Stop after local archive and cleanup.\n- **Delivery Horizon:** none - disposable proof is not delivery work.\n- **Automation Dividend**: exempt - one disposable exact fixture.\n- **Bounded Falsification Review**: exempt - Ordinary Small exact fixture.\n\n## Claim And Evidence Scope\n\n- **Claim And Evidence Scope**: Exact disposable archive at the official helper boundary.\n\n## Capabilities\n\n### New Capabilities\n- \`archive-fixture\`: Provides one disposable archive fixture.\n`);
  write(`openspec/changes/${changeId}/design.md`, "# Design\n\nUse the canonical deterministic helper once in a disposable root.\n");
  write(`openspec/changes/${changeId}/tasks.md`, "# Tasks\n\n- [x] 1.1 Complete the disposable archive fixture.\n");
  write(`openspec/changes/${changeId}/history.md`, "# Strategy History\n");
  write(`openspec/changes/${changeId}/specs/archive-fixture/spec.md`, `## ADDED Requirements\n\n### Requirement: Disposable archive fixture\nThe disposable project SHALL archive one completed local fixture without an external effect.\n\n#### Scenario: Fixture archives\n- **WHEN** the canonical helper runs\n- **THEN** the completed change moves to the official archive.\n`);
}

function writeTriageProposal(project: string, changeId: string, signalRef: string): string[] {
  const written: string[] = [];
  const write = (relative: string, content: string) => {
    const file = path.join(project, relative);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, content, { encoding: "utf8", flag: "wx" });
    written.push(relative);
  };
  write("openspec/config.yaml", "schema: spec-driven\n");
  write(`openspec/changes/${changeId}/proposal.md`, `# Proposal\n\n## Why\n\nA reviewed consumer-origin Kaizen signal identified one bounded kit-owned proof setup gap.\n\n## What Changes\n\n- Add one disposable owner-root proposal fixture linked to ${signalRef}.\n\n### Outcome Capsule\n\n- **Outcome**: Represent one reviewed kit-owned Kaizen candidate as an ordinary OpenSpec proposal.\n- **Operating Envelope**: One configured disposable proposal-owner root.\n- **Non-Goals**: No source-project mutation, apply, archive, commit, remote issue, or release.\n- **Non-Deferrable Invariants**: Proposal promotion occurs only at the canonical configured owner root and remains non-authorizing.\n- **Observable Proof**: Strict OpenSpec validation and exact owner/source root write inspection.\n- **Material Residual Risks**: Installed model-command following remains outside this provider-free boundary.\n- **Stop Line**: Stop after one valid local proposal and fixture cleanup.\n- **Delivery Horizon:** none - disposable proof is not delivery work.\n- **Automation Dividend**: Retain one provider-free owner-root containment mode.\n- **Bounded Falsification Review**: exempt - reviewed disposable exact fixture.\n\n## Claim And Evidence Scope\n\n- **Claim And Evidence Scope**: Provider-free configured owner-root containment for source signal ${signalRef}; no installed command claim.\n\n## Capabilities\n\n### New Capabilities\n- \`kaizen-triage-proof\`: Provides one disposable owner-root proposal fixture.\n`);
  write(`openspec/changes/${changeId}/design.md`, `# Design\n\nUse the configured Kaizen proposal-owner root as the only proposal write boundary. The consumer root remains unchanged.\n`);
  write(`openspec/changes/${changeId}/tasks.md`, `# Tasks\n\n- [ ] 1.1 Implement and prove the reviewed disposable proposal fixture.\n`);
  write(`openspec/changes/${changeId}/specs/kaizen-triage-proof/spec.md`, `## ADDED Requirements\n\n### Requirement: Owner-root-contained proposal\nThe fixture SHALL create an ordinary proposal only in the configured canonical proposal-owner root.\n\n#### Scenario: Consumer signal is promoted\n- **WHEN** current reviewed evidence supports one cohesive kit-owned candidate\n- **THEN** exactly one proposal is created in the owner root and the consumer root is not mutated.\n`);
  return written;
}

async function triageBoundary(options: Options): Promise<void> {
  const requestedEvidenceDir = path.resolve(options.evidenceDir!);
  const evidenceName = path.basename(requestedEvidenceDir);
  const relativeEvidence = path.relative(evidenceRoot, requestedEvidenceDir);
  if (relativeEvidence === "" || relativeEvidence.startsWith("..") || path.isAbsolute(relativeEvidence)) throw new Error("--evidence-dir must be a new child of the Kaizen change evidence directory");
  if (fs.existsSync(requestedEvidenceDir)) throw new Error("--evidence-dir already exists");
  fs.mkdirSync(requestedEvidenceDir);

  const fixtureRoot = fs.mkdtempSync(path.join(os.tmpdir(), "opencode-kaizen-triage-"));
  const ownerRoot = path.join(fixtureRoot, "proposal-owner");
  const consumerRoot = path.join(fixtureRoot, "consumer");
  const dataRoot = path.join(fixtureRoot, "data");
  const activeConfig = path.join(sourceRoot, "global", "opencode.json");
  const activeConfigBefore = sha256(fs.readFileSync(activeConfig));
  const cleanup: Record<string, unknown> = { activeConfigUnchanged: false, fixtureRemoved: false };
  const bundle: Record<string, unknown> = {
    schemaVersion: 1,
    candidate: `cross-project-kaizen-loop-${evidenceName}`,
    environment: { node: process.version, platform: process.platform, providerCalls: 0, networkRequests: 0 },
    invocation: `node tools/proofs/cross-project-kaizen.ts --mode triage-boundary --evidence-dir openspec/changes/add-cross-project-kaizen-loop/evidence/${evidenceName}`,
    status: "failed",
    checks: null,
    effects: null,
    cleanup,
    error: null,
  };
  try {
    gitInit(ownerRoot);
    gitInit(consumerRoot);
    const environment = { OPENCODE_DATA_DIR: dataRoot, OPENCODE_KAIZEN_PROPOSAL_OWNER_ROOT: ownerRoot };
    const consumer = createKaizenFeature({ worktree: consumerRoot, environment });
    const owner = createKaizenFeature({ worktree: ownerRoot, environment });
    if (consumer == null || owner == null) throw new Error("Kaizen triage boundary did not enable both project features");
    const captured = await consumer.capture({
      kind: "tooling-gap",
      summary: "Consumer proof setup needs one bounded kit helper",
      observedEvidence: "Reviewed synthetic evidence identifies repeated provider-free fixture setup.",
      impact: "Repeated setup delays the first real boundary observation.",
      likelyCause: "The kit does not yet expose the reviewed bounded fixture helper.",
      doNotRepeat: "Do not infer semantic cohesion from recurrence or signal counts.",
      scopeHint: "opencode-kit",
      evidenceRefs: ["tools/proofs/cross-project-kaizen.ts"],
    }, "explicit", {
      sessionRef: `session_${sha256("triage-consumer").slice(0, 32)}`,
      sourceEventRef: "explicit:triage-consumer",
    }, new Date("2026-08-29T13:00:00.000Z"));

    const ownerHooks = createKaizenPluginHooks({
      directory: ownerRoot,
      project: { worktree: ownerRoot },
      client: { session: { async get() { return { data: null }; }, async messages() { return { data: [] }; } } },
    }, environment) as Record<string, unknown>;
    const consumerHooks = createKaizenPluginHooks({
      directory: consumerRoot,
      project: { worktree: consumerRoot },
      client: { session: { async get() { return { data: null }; }, async messages() { return { data: [] }; } } },
    }, environment) as Record<string, unknown>;
    const ownerTools = ownerHooks.tool as Record<string, { execute(args: unknown, context: unknown): Promise<{ output: string }> }>;
    const consumerTools = consumerHooks.tool as Record<string, { execute(args: unknown, context: unknown): Promise<{ output: string }> }>;
    const context = (root: string, messageID: string) => ({ directory: root, worktree: root, sessionID: "session_kaizen_triage_boundary", messageID, metadata(_value: unknown) {} });
    let nonOwnerRejected = false;
    try {
      await consumerTools.kaizen_status!.execute({ details: true, limit: 25, scope: "cross-project", statuses: ["pending"] }, context(consumerRoot, "message_consumer_details"));
    } catch (error) {
      nonOwnerRejected = error instanceof Error && error.message.includes("configured proposal-owner root");
    }
    const detailed = JSON.parse((await ownerTools.kaizen_status!.execute({ details: true, limit: 25, scope: "cross-project", statuses: ["pending"] }, context(ownerRoot, "message_owner_details"))).output) as {
      proposalOwner: { proposalCreationAllowed: boolean; state: string };
      selection: { details: boolean; scope: string; totalSignals: number };
      signals: Array<{ signalRef: string }>;
    };
    const decision = JSON.parse((await ownerTools.kaizen_decision!.execute({ input: {
      signalRef: captured.signalRef,
      decision: "kit-candidate",
      evidenceRefs: ["tools/proofs/cross-project-kaizen.ts"],
      ownerClass: "opencode-kit",
      nextBoundaryOrTerminalReason: "Create one disposable ordinary proposal in the configured owner root.",
    } }, context(ownerRoot, "message_owner_decision"))).output) as { decisionRef: string };
    const changeId = "kaizen-triage-proof";
    const written = writeTriageProposal(ownerRoot, changeId, captured.signalRef);
    const validationArgs = ["validate", changeId, "--strict"];
    const resolved = resolvePortableCommand(["openspec", ...validationArgs]);
    if (!resolved.ok) throw new Error(resolved.reason);
    const installedEntry = path.join(path.dirname(resolved.selected), "node_modules", "@fission-ai", "openspec", "bin", "openspec.js");
    const validationCommand = process.platform === "win32" && fs.existsSync(installedEntry)
      ? { executable: process.execPath, args: [installedEntry, ...validationArgs], mechanism: "installed-node-entrypoint" }
      : { executable: resolved.executable, args: [...resolved.args], mechanism: resolved.kind };
    const validation = spawnSync(validationCommand.executable, validationCommand.args, { cwd: ownerRoot, encoding: "utf8", shell: false, timeout: 120_000, windowsHide: true });
    if (validation.error != null) throw validation.error;
    const ownerChanges = fs.readdirSync(path.join(ownerRoot, "openspec", "changes"), { withFileTypes: true }).filter((entry) => entry.isDirectory()).map((entry) => entry.name).sort();
    const consumerEntries = fs.readdirSync(consumerRoot, { withFileTypes: true }).filter((entry) => entry.name !== ".git").map((entry) => entry.name).sort();
    const checks = {
      activeConfigUnchanged: sha256(fs.readFileSync(activeConfig)) === activeConfigBefore,
      consumerOrigin: captured.projectRef === consumer.projectRef && captured.projectRef !== owner.projectRef,
      consumerRootUnchanged: consumerEntries.length === 0 && gitClean(consumerRoot),
      decisionRecorded: /^decision_[a-f0-9]{32}$/u.test(decision.decisionRef),
      detailedOwnerRead: detailed.proposalOwner.state === "current-root"
        && detailed.proposalOwner.proposalCreationAllowed
        && detailed.selection.details
        && detailed.selection.scope === "cross-project"
        && detailed.selection.totalSignals === 1
        && detailed.signals[0]?.signalRef === captured.signalRef,
      exactlyOneProposal: ownerChanges.length === 1 && ownerChanges[0] === changeId && written.filter((relative) => relative.endsWith("proposal.md")).length === 1,
      nonOwnerRejected,
      ownerRootOnly: written.every((relative) => fs.existsSync(path.join(ownerRoot, relative))) && !fs.existsSync(path.join(consumerRoot, "openspec")),
      providerFree: true,
      strictValidation: validation.status === 0,
    };
    bundle.checks = checks;
    bundle.effects = {
      commandDigests: Object.fromEntries(["global/commands/kaizen-status.md", "global/commands/kaizen-triage.md"].map((relative) => [relative, sha256(fs.readFileSync(path.join(sourceRoot, relative)))])),
      decisionRef: decision.decisionRef,
      proposalArtifactCount: written.length - 1,
      proposalChangeCount: ownerChanges.length,
      proposalOwnerState: detailed.proposalOwner.state,
      signalRef: captured.signalRef,
      sourceDigests: candidateSourceDigests(),
      sourceProjectWrites: consumerEntries.length,
      validation: {
        mechanism: validationCommand.mechanism,
        status: validation.status,
        stderr: redact(validation.stderr ?? "", [fixtureRoot, sourceRoot, os.homedir()]),
        stdout: redact(validation.stdout ?? "", [fixtureRoot, sourceRoot, os.homedir()]),
      },
    };
    if (Object.values(checks).some((value) => !value)) throw new Error(`Kaizen triage-boundary checks failed: ${JSON.stringify(checks)}`);
    bundle.status = "passed";
  } catch (error) {
    bundle.error = proofErrorFacts(error);
  } finally {
    cleanup.activeConfigUnchanged = sha256(fs.readFileSync(activeConfig)) === activeConfigBefore;
    fs.rmSync(fixtureRoot, { recursive: true, force: true });
    cleanup.fixtureRemoved = !fs.existsSync(fixtureRoot);
    if (cleanup.activeConfigUnchanged !== true || cleanup.fixtureRemoved !== true) bundle.status = "failed";
    const serialized = redact(stableJson(bundle), [fixtureRoot, sourceRoot, os.homedir()]);
    for (const forbidden of [fixtureRoot, sourceRoot, os.homedir()]) {
      if (serialized.includes(forbidden) || serialized.includes(forbidden.replaceAll("\\", "/"))) throw new Error("Retained Kaizen triage evidence contains a private root");
    }
    fs.writeFileSync(path.join(requestedEvidenceDir, "bundle.json"), serialized, { encoding: "utf8", flag: "wx" });
    console.log(stableJson({ evidenceDir: path.relative(sourceRoot, requestedEvidenceDir).replaceAll("\\", "/"), status: bundle.status }).trim());
    if (bundle.status !== "passed") process.exitCode = 1;
  }
}

type PopulationScenario = {
  id: string;
  driver:
    | { kind: "focused-tests"; names: string[] }
    | { kind: "archive-boundary"; scenario: string }
    | { kind: "triage-boundary"; scenario: string };
};

function strictPopulationRecord(value: unknown, label: string, keys: string[]): Record<string, unknown> {
  if (value == null || typeof value !== "object" || Array.isArray(value)) throw new Error(`${label} must be an object`);
  const record = value as Record<string, unknown>;
  const actual = Object.keys(record).sort();
  const expected = [...keys].sort();
  if (JSON.stringify(actual) !== JSON.stringify(expected)) throw new Error(`${label} keys must be exactly ${expected.join(",")}`);
  return record;
}

function readPopulationSeed(file: string): { populationId: string; scenarios: PopulationScenario[] } {
  const root = strictPopulationRecord(JSON.parse(fs.readFileSync(file, "utf8")), "Kaizen population seed", ["populationId", "scenarios", "schemaVersion"]);
  if (root.schemaVersion !== 1 || typeof root.populationId !== "string" || !Array.isArray(root.scenarios)) throw new Error("Kaizen population seed schema is invalid");
  const scenarios = root.scenarios.map((value, index): PopulationScenario => {
    const scenario = strictPopulationRecord(value, `Kaizen population scenario ${index}`, ["driver", "id"]);
    if (typeof scenario.id !== "string" || !/^[a-z][a-z0-9-]{2,63}$/u.test(scenario.id)) throw new Error(`Kaizen population scenario ${index} id is invalid`);
    const driverValue = scenario.driver;
    if (driverValue == null || typeof driverValue !== "object" || Array.isArray(driverValue)) throw new Error(`Kaizen population scenario ${scenario.id} driver is invalid`);
    const kind = (driverValue as Record<string, unknown>).kind;
    if (kind === "focused-tests") {
      const driver = strictPopulationRecord(driverValue, `Kaizen population scenario ${scenario.id} driver`, ["kind", "names"]);
      if (!Array.isArray(driver.names) || driver.names.length < 1 || driver.names.some((name) => typeof name !== "string" || name.trim() === "")) throw new Error(`Kaizen population scenario ${scenario.id} test names are invalid`);
      return { id: scenario.id, driver: { kind, names: [...new Set(driver.names as string[])] } };
    }
    if (kind === "archive-boundary" || kind === "triage-boundary") {
      const driver = strictPopulationRecord(driverValue, `Kaizen population scenario ${scenario.id} driver`, ["kind", "scenario"]);
      if (typeof driver.scenario !== "string" || driver.scenario.trim() === "") throw new Error(`Kaizen population scenario ${scenario.id} boundary scenario is invalid`);
      return { id: scenario.id, driver: { kind, scenario: driver.scenario } };
    }
    throw new Error(`Kaizen population scenario ${scenario.id} driver kind is invalid`);
  });
  if (scenarios.length !== 25 || new Set(scenarios.map((scenario) => scenario.id)).size !== scenarios.length) throw new Error("Kaizen population seed must contain exactly 25 unique scenarios");
  return { populationId: root.populationId, scenarios };
}

async function quietBoundary(operation: () => Promise<void>): Promise<string[]> {
  const lines: string[] = [];
  const previous = console.log;
  console.log = (...args: unknown[]) => { lines.push(args.map(String).join(" ")); };
  try {
    await operation();
    return lines;
  } finally {
    console.log = previous;
  }
}

async function populationBoundary(options: Options): Promise<void> {
  const requestedEvidenceDir = path.resolve(options.evidenceDir!);
  const evidenceName = path.basename(requestedEvidenceDir);
  const relativeEvidence = path.relative(evidenceRoot, requestedEvidenceDir);
  if (relativeEvidence === "" || relativeEvidence.startsWith("..") || path.isAbsolute(relativeEvidence)) throw new Error("--evidence-dir must be a new child of the Kaizen change evidence directory");
  if (fs.existsSync(requestedEvidenceDir)) throw new Error("--evidence-dir already exists");
  fs.mkdirSync(requestedEvidenceDir);

  const seedFile = path.join(sourceRoot, "tools", "proofs", "fixtures", "cross-project-kaizen", "population-v1.json");
  const indexFile = path.join(sourceRoot, "openspec", "changes", "add-cross-project-kaizen-loop", "evidence-index.json");
  const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), "opencode-kaizen-population-"));
  const sourceFiles = [
    "global/bin/openspec-archive.ts",
    "global/commands/kaizen-status.md",
    "global/commands/kaizen-triage.md",
    "global/plugin/kaizen/index.ts",
    "global/plugin/kaizen/legacy-feedback.ts",
    "global/plugin/kaizen/store.ts",
    "global/plugin/session-env.ts",
    "global/skills/complain/SKILL.md",
    "global/skills/openspec-archive-change/SKILL.md",
    "tools/proofs/cross-project-kaizen.ts",
    "tools/proofs/fixtures/cross-project-kaizen/population-v1.json",
    "tools/test-cross-project-kaizen.ts",
  ];
  const sourceBefore = Object.fromEntries(sourceFiles.map((relative) => [relative, sha256(fs.readFileSync(path.join(sourceRoot, relative)))]));
  const activeConfig = path.join(sourceRoot, "global", "opencode.json");
  const activeConfigBefore = sha256(fs.readFileSync(activeConfig));
  const cleanup: Record<string, unknown> = { activeConfigUnchanged: false, archiveFixtureRemoved: false, fixtureRemoved: false, triageFixtureRemoved: false };
  const bundle: Record<string, unknown> = {
    schemaVersion: 1,
    candidate: `cross-project-kaizen-loop-${evidenceName}`,
    environment: { node: process.version, platform: process.platform, providerCalls: 0, networkRequests: 0 },
    invocation: `node tools/proofs/cross-project-kaizen.ts --mode population --evidence-dir openspec/changes/add-cross-project-kaizen-loop/evidence/${evidenceName}`,
    status: "failed",
    checks: null,
    seed: null,
    drivers: null,
    observations: [],
    cleanup,
    error: null,
  };
  try {
    const seed = readPopulationSeed(seedFile);
    const normalizedSeed = stableJson({ schemaVersion: 1, populationId: seed.populationId, scenarios: seed.scenarios });
    const readbackFile = path.join(temporaryRoot, "population-readback.json");
    fs.writeFileSync(readbackFile, normalizedSeed, { encoding: "utf8", flag: "wx" });
    const readback = readPopulationSeed(readbackFile);
    const evidenceIndex = readJson(indexFile);
    const claims = Array.isArray(evidenceIndex.claims) ? evidenceIndex.claims as Array<Record<string, unknown>> : [];
    const claim = claims.find((item) => item.claimId === "KZN-001");
    const population = claim?.population != null && typeof claim.population === "object" ? claim.population as Record<string, unknown> : null;
    const claimMembers = Array.isArray(population?.members) ? population.members as unknown[] : [];
    const seedIds = seed.scenarios.map((scenario) => scenario.id);

    const focusedStartedAt = Date.now();
    const focused = spawnSync(process.execPath, [path.join(sourceRoot, "tools", "test-cross-project-kaizen.ts"), "--json"], {
      cwd: sourceRoot,
      encoding: "utf8",
      shell: false,
      timeout: 180_000,
      windowsHide: true,
    });
    if (focused.error != null) throw focused.error;
    if (focused.status !== 0) throw new Error(`Focused Kaizen population tests failed (${focused.status}): ${focused.stderr}`);
    const focusedResult = JSON.parse((focused.stdout ?? "").trim()) as { schemaVersion?: unknown; status?: unknown; tests?: unknown };
    if (focusedResult.schemaVersion !== 1 || focusedResult.status !== "passed" || !Array.isArray(focusedResult.tests) || focusedResult.tests.some((name) => typeof name !== "string")) throw new Error("Focused Kaizen test result schema is invalid");
    const passedTests = new Set(focusedResult.tests as string[]);
    const focusedElapsedMs = Date.now() - focusedStartedAt;

    const archiveDir = path.join(requestedEvidenceDir, "archive-boundary");
    const archiveStartedAt = Date.now();
    const archiveOutput = await quietBoundary(() => archiveBoundary({ ...options, evidenceDir: archiveDir, mode: "archive-boundary", opencode: null }));
    const archiveElapsedMs = Date.now() - archiveStartedAt;
    const archiveBundle = readJson(path.join(archiveDir, "bundle.json"));
    const archiveScenarios = Array.isArray(archiveBundle.scenarios) ? archiveBundle.scenarios as Array<Record<string, unknown>> : [];
    const triageDir = path.join(requestedEvidenceDir, "triage-boundary");
    const triageStartedAt = Date.now();
    const triageOutput = await quietBoundary(() => triageBoundary({ ...options, evidenceDir: triageDir, mode: "triage-boundary", opencode: null }));
    const triageElapsedMs = Date.now() - triageStartedAt;
    const triageBundle = readJson(path.join(triageDir, "bundle.json"));

    const observations = seed.scenarios.map((scenario) => {
      let supported = false;
      let facts: string[];
      if (scenario.driver.kind === "focused-tests") {
        supported = scenario.driver.names.every((name) => passedTests.has(name));
        facts = scenario.driver.names.map((name) => `focused-test:${name}`);
      } else if (scenario.driver.kind === "archive-boundary") {
        const row = archiveScenarios.find((item) => item.scenario === scenario.driver.scenario);
        supported = archiveBundle.status === "passed" && row?.scenario === scenario.driver.scenario && typeof row.harvest === "string";
        facts = [`archive-scenario:${scenario.driver.scenario}`, `harvest:${String(row?.harvest ?? "missing")}`];
      } else {
        const checks = triageBundle.checks != null && typeof triageBundle.checks === "object" ? triageBundle.checks as Record<string, unknown> : {};
        supported = triageBundle.status === "passed" && Object.values(checks).every((value) => value === true);
        facts = [`triage-scenario:${scenario.driver.scenario}`, `proposal-count:${String((triageBundle.effects as Record<string, unknown> | undefined)?.proposalChangeCount ?? "missing")}`];
      }
      return { memberId: scenario.id, driver: scenario.driver.kind, status: supported ? "supported" : "red", facts };
    });
    const sourceAfter = Object.fromEntries(sourceFiles.map((relative) => [relative, sha256(fs.readFileSync(path.join(sourceRoot, relative)))]));
    const archiveCleanup = archiveBundle.cleanup != null && typeof archiveBundle.cleanup === "object" ? archiveBundle.cleanup as Record<string, unknown> : {};
    const triageCleanup = triageBundle.cleanup != null && typeof triageBundle.cleanup === "object" ? triageBundle.cleanup as Record<string, unknown> : {};
    cleanup.archiveFixtureRemoved = archiveCleanup.fixtureRemoved === true;
    cleanup.triageFixtureRemoved = triageCleanup.fixtureRemoved === true;
    const checks = {
      activeConfigUnchanged: sha256(fs.readFileSync(activeConfig)) === activeConfigBefore,
      allMembersSupported: observations.length === 25 && observations.every((observation) => observation.status === "supported"),
      archiveBoundaryPassed: archiveBundle.status === "passed" && archiveOutput.length === 1,
      claimPopulationMatched: population?.id === seed.populationId && JSON.stringify(claimMembers) === JSON.stringify(seedIds),
      focusedTestsPassed: focusedResult.status === "passed" && passedTests.size >= 24,
      loadedModesExposed: usage().includes("--mode loaded-tools") && usage().includes("--mode archive-boundary"),
      providerFree: true,
      seedReadbackStable: normalizedSeed === stableJson({ schemaVersion: 1, populationId: readback.populationId, scenarios: readback.scenarios }),
      sourceUnchanged: JSON.stringify(sourceBefore) === JSON.stringify(sourceAfter),
      triageBoundaryPassed: triageBundle.status === "passed" && triageOutput.length === 1,
    };
    bundle.checks = checks;
    bundle.seed = { populationId: seed.populationId, scenarios: seedIds, sha256: sha256(fs.readFileSync(seedFile)) };
    bundle.drivers = {
      archive: { elapsedMs: archiveElapsedMs, status: archiveBundle.status, scenarios: archiveScenarios.map((item) => item.scenario) },
      focusedTests: { count: passedTests.size, elapsedMs: focusedElapsedMs, status: focusedResult.status },
      triage: { elapsedMs: triageElapsedMs, status: triageBundle.status },
    };
    bundle.resources = {
      lifecycleBytes: KAIZEN_LIFECYCLE_BYTES,
      lifecycleLimit: KAIZEN_LIFECYCLE_LIMIT,
      retainedChildBundles: 2,
      signalBytes: KAIZEN_SIGNAL_BYTES,
      signalLimit: KAIZEN_SIGNAL_LIMIT,
    };
    bundle.observations = observations;
    if (Object.values(checks).some((value) => !value)) throw new Error(`Kaizen population checks failed: ${JSON.stringify(checks)}`);
    bundle.status = "passed";
  } catch (error) {
    bundle.error = proofErrorFacts(error);
  } finally {
    cleanup.activeConfigUnchanged = sha256(fs.readFileSync(activeConfig)) === activeConfigBefore;
    fs.rmSync(temporaryRoot, { recursive: true, force: true });
    cleanup.fixtureRemoved = !fs.existsSync(temporaryRoot);
    if (Object.values(cleanup).some((value) => value !== true)) bundle.status = "failed";
    const serialized = redact(stableJson(bundle), [temporaryRoot, sourceRoot, os.homedir()]);
    for (const forbidden of [temporaryRoot, sourceRoot, os.homedir()]) {
      if (serialized.includes(forbidden) || serialized.includes(forbidden.replaceAll("\\", "/"))) throw new Error("Retained Kaizen population evidence contains a private root");
    }
    fs.writeFileSync(path.join(requestedEvidenceDir, "bundle.json"), serialized, { encoding: "utf8", flag: "wx" });
    console.log(stableJson({ evidenceDir: path.relative(sourceRoot, requestedEvidenceDir).replaceAll("\\", "/"), status: bundle.status }).trim());
    if (bundle.status !== "passed") process.exitCode = 1;
  }
}

function archiveHelper(project: string, changeId: string, failValidation: boolean): { archived: boolean; archivePath: string | null; status: number | null; stderr: string; stdout: string } {
  const args = [path.join(sourceRoot, "global", "bin", "openspec-archive.ts"), "--root", project, "--change", changeId];
  if (failValidation) args.push("--", process.execPath, "-e", "process.exit(7)");
  else args.push("--validation-not-applicable", "disposable archive proof has no product runtime");
  const result = spawnSync(process.execPath, args, { cwd: project, encoding: "utf8", shell: false, timeout: 120_000, windowsHide: true });
  if (result.error != null) throw result.error;
  const stdout = result.stdout ?? "";
  let archivePath: string | null = null;
  try {
    const parsed = JSON.parse(stdout) as { status?: unknown; path?: unknown };
    if (parsed.status === "archived" && typeof parsed.path === "string") archivePath = path.isAbsolute(parsed.path) ? parsed.path : path.resolve(project, parsed.path);
  } catch {
    archivePath = null;
  }
  return { archived: result.status === 0 && archivePath != null, archivePath, status: result.status, stderr: result.stderr ?? "", stdout };
}

async function archiveBoundary(options: Options): Promise<void> {
  const requestedEvidenceDir = path.resolve(options.evidenceDir!);
  const evidenceName = path.basename(requestedEvidenceDir);
  const relativeEvidence = path.relative(evidenceRoot, requestedEvidenceDir);
  if (relativeEvidence === "" || relativeEvidence.startsWith("..") || path.isAbsolute(relativeEvidence)) throw new Error("--evidence-dir must be a new child of the Kaizen change evidence directory");
  if (fs.existsSync(requestedEvidenceDir)) throw new Error("--evidence-dir already exists");
  fs.mkdirSync(requestedEvidenceDir);

  const fixtureRoot = fs.mkdtempSync(path.join(os.tmpdir(), "opencode-kaizen-archive-"));
  const dataRoot = path.join(fixtureRoot, "data");
  const activeConfig = path.join(sourceRoot, "global", "opencode.json");
  const activeConfigBefore = sha256(fs.readFileSync(activeConfig));
  const bundle: Record<string, unknown> = {
    schemaVersion: 1,
    candidate: `cross-project-kaizen-loop-${evidenceName}`,
    invocation: `node tools/proofs/cross-project-kaizen.ts --mode archive-boundary --evidence-dir openspec/changes/add-cross-project-kaizen-loop/evidence/${evidenceName}`,
    environment: { node: process.version, platform: process.platform, providerCalls: 0 },
    sourceDigests: Object.fromEntries([
      "global/bin/openspec-archive.ts",
      "global/plugin/kaizen/index.ts",
      "global/plugin/kaizen/store.ts",
      "global/skills/openspec-archive-change/SKILL.md",
      "tools/proofs/cross-project-kaizen.ts",
      "tools/test-contracts-change-ready-delivery.ts",
      "tools/test-cross-project-kaizen.ts",
      "tools/validators/devkit-contract.ts",
    ].map((relative) => [relative, sha256(fs.readFileSync(path.join(sourceRoot, relative)))])),
    status: "failed",
    checks: null,
    scenarios: [],
    cleanup: { activeConfigUnchanged: false, fixtureRemoved: false },
    error: null,
  };
  try {
    const scenarios: Array<Record<string, unknown>> = [];
    for (const scenario of ["captured", "no-signal", "repair-gap", "unavailable", "archive-failed"] as const) {
      const changeId = `kaizen-${scenario}`;
      const project = path.join(fixtureRoot, scenario, `project-${scenario}`);
      writeArchiveFixture(project, changeId);
      const environment = { OPENCODE_DATA_DIR: dataRoot, ...(scenario === "unavailable" ? { OPENCODE_KAIZEN: "0" } : {}) };
      const sessionID = `session_${sha256(`archive:${scenario}`).slice(0, 32)}`;
      const hooks = createKaizenPluginHooks({
        directory: project,
        project: { worktree: project },
        client: { session: { async get() { return { data: null }; }, async messages() { return { data: [] }; } } },
      }, environment) as Record<string, unknown>;
      const tools = hooks.tool as Record<string, { execute(args: unknown, context: unknown): Promise<{ output: string }> }> | undefined;
      const context = (messageID: string) => ({ directory: project, worktree: project, sessionID, messageID, metadata(_value: unknown) {} });
      let checkpointRef: string | null = null;
      if (tools?.kaizen_checkpoint != null) {
        const first = await tools.kaizen_checkpoint.execute({ input: { changeRef: changeId, status: "harvest-pending" } }, context(`message_${scenario}_pending`));
        checkpointRef = (JSON.parse(first.output) as { checkpointRef: string }).checkpointRef;
        const repeated = await tools.kaizen_checkpoint.execute({ input: { changeRef: changeId, status: "harvest-pending" } }, context(`message_${scenario}_pending_repeated`));
        if ((JSON.parse(repeated.output) as { checkpointRef: string }).checkpointRef !== checkpointRef) throw new Error(`Archive ${scenario} pending checkpoint was not idempotent`);
      }
      const helper = archiveHelper(project, changeId, scenario === "archive-failed");
      let harvest: "captured" | "no-signal" | "repair-gap" | "unavailable" | "archive-failed";
      let archiveUnchangedAfterRepair: boolean | null = null;
      if (!helper.archived) {
        if (scenario !== "archive-failed" || checkpointRef == null || tools?.kaizen_checkpoint == null) throw new Error(`Archive ${scenario} helper failed unexpectedly`);
        await tools.kaizen_checkpoint.execute({ input: { changeRef: changeId, checkpointRef, status: "archive-failed" } }, context("message_archive_failed_close"));
        harvest = "archive-failed";
      } else if (checkpointRef == null || tools?.kaizen_checkpoint == null) {
        harvest = "unavailable";
      } else if (scenario === "repair-gap") {
        const beforeRepair = directoryIdentity(helper.archivePath!);
        const feature = createKaizenFeature({ worktree: project, environment });
        if (feature == null) throw new Error("Repair-gap scenario lost its Kaizen feature");
        const pending = (await feature.status()).checkpoints.find((checkpoint) => checkpoint.checkpointRef === checkpointRef);
        if (pending?.status !== "harvest-pending") throw new Error("Repair-gap scenario did not retain its open checkpoint");
        harvest = "repair-gap";
        await tools.kaizen_checkpoint.execute({ input: { changeRef: changeId, checkpointRef, status: "no-signal" } }, context("message_repair_close"));
        archiveUnchangedAfterRepair = JSON.stringify(beforeRepair) === JSON.stringify(directoryIdentity(helper.archivePath!));
      } else if (scenario === "captured") {
        await tools.kaizen_checkpoint.execute({ input: {
          changeRef: changeId,
          checkpointRef,
          status: "captured",
          signals: [{ ...loadedSignal, summary: "Archive proof repeated one bounded local setup" }],
        } }, context("message_archive_captured_close"));
        harvest = "captured";
      } else {
        await tools.kaizen_checkpoint.execute({ input: { changeRef: changeId, checkpointRef, status: "no-signal" } }, context("message_archive_empty_close"));
        harvest = "no-signal";
      }
      const feature = createKaizenFeature({ worktree: project, environment });
      const status = feature == null ? null : await feature.status();
      const checkpoint = checkpointRef == null ? null : status?.checkpoints.find((item) => item.checkpointRef === checkpointRef) ?? null;
      const archiveSignals = status?.signals.filter((signal) => signal.sources.includes("archive")) ?? [];
      const checkpointSignals = checkpoint == null ? [] : checkpoint.signalRefs.map((signalRef) => status?.signals.find((signal) => signal.signalRef === signalRef) ?? null);
      scenarios.push({
        scenario,
        archive: helper.archived ? "archived" : "failed",
        archivePathPresent: helper.archivePath != null && fs.existsSync(helper.archivePath),
        archiveUnchangedAfterRepair,
        activeChangePresent: fs.existsSync(path.join(project, "openspec", "changes", changeId)),
        checkpointRef,
        checkpointStatus: checkpoint?.status ?? null,
        harvest,
        checkpointSignalCount: checkpointSignals.length,
        checkpointSignalSources: checkpointSignals.flatMap((signal) => signal?.sources ?? []).sort(),
        globalArchiveSignalCount: archiveSignals.length,
        helper: {
          status: helper.status,
          stderr: redact(helper.stderr, [fixtureRoot, sourceRoot, os.homedir()]),
          stdoutBytes: Buffer.byteLength(helper.stdout, "utf8"),
          stdoutSha256: sha256(helper.stdout),
        },
      });
    }
    const byName = new Map(scenarios.map((scenario) => [scenario.scenario, scenario]));
    const checks = {
      activeConfigUnchanged: sha256(fs.readFileSync(activeConfig)) === activeConfigBefore,
      archiveFailedClosed: byName.get("archive-failed")?.archive === "failed" && byName.get("archive-failed")?.checkpointStatus === "archive-failed" && byName.get("archive-failed")?.harvest === "archive-failed" && byName.get("archive-failed")?.checkpointSignalCount === 0,
      capturedClosed: byName.get("captured")?.archive === "archived" && byName.get("captured")?.checkpointStatus === "captured" && byName.get("captured")?.checkpointSignalCount === 1 && JSON.stringify(byName.get("captured")?.checkpointSignalSources) === JSON.stringify(["archive"]),
      noSignalClosed: byName.get("no-signal")?.archive === "archived" && byName.get("no-signal")?.checkpointStatus === "no-signal" && byName.get("no-signal")?.checkpointSignalCount === 0,
      repairGapDerivedOnly: byName.get("repair-gap")?.archive === "archived" && byName.get("repair-gap")?.harvest === "repair-gap" && byName.get("repair-gap")?.checkpointStatus === "no-signal" && byName.get("repair-gap")?.checkpointSignalCount === 0 && byName.get("repair-gap")?.archiveUnchangedAfterRepair === true,
      unavailableNotPersisted: byName.get("unavailable")?.archive === "archived" && byName.get("unavailable")?.checkpointRef == null && byName.get("unavailable")?.harvest === "unavailable",
      officialMovementOnce: scenarios.every((scenario) => scenario.archive === "failed" || scenario.archivePathPresent === true && scenario.activeChangePresent === false),
    };
    bundle.checks = checks;
    bundle.scenarios = scenarios;
    if (Object.values(checks).some((value) => !value)) throw new Error(`Kaizen archive-boundary checks failed: ${JSON.stringify(checks)}`);
    bundle.status = "passed";
  } catch (error) {
    bundle.error = proofErrorFacts(error);
  } finally {
    (bundle.cleanup as Record<string, unknown>).activeConfigUnchanged = sha256(fs.readFileSync(activeConfig)) === activeConfigBefore;
    fs.rmSync(fixtureRoot, { recursive: true, force: true });
    (bundle.cleanup as Record<string, unknown>).fixtureRemoved = !fs.existsSync(fixtureRoot);
    if (Object.values(bundle.cleanup as Record<string, unknown>).some((value) => value !== true)) bundle.status = "failed";
    fs.writeFileSync(path.join(requestedEvidenceDir, "bundle.json"), redact(stableJson(bundle), [fixtureRoot, sourceRoot, os.homedir()]), { encoding: "utf8", flag: "wx" });
    console.log(stableJson({ evidenceDir: path.relative(sourceRoot, requestedEvidenceDir).replaceAll("\\", "/"), status: bundle.status }).trim());
    if (bundle.status !== "passed") process.exitCode = 1;
  }
}

function directoryIdentity(root: string): { files: number; sha256: string } {
  const rows: Array<{ path: string; sha256: string }> = [];
  const visit = (directory: string) => {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true }).sort((left, right) => left.name.localeCompare(right.name))) {
      const absolute = path.join(directory, entry.name);
      if (entry.isDirectory()) visit(absolute);
      else if (entry.isFile()) rows.push({ path: path.relative(root, absolute).replaceAll("\\", "/"), sha256: sha256(fs.readFileSync(absolute)) });
      else throw new Error("Copied Kaizen plugin contains an unsupported filesystem entry");
    }
  };
  visit(root);
  return { files: rows.length, sha256: sha256(stableJson(rows)) };
}

function loadedToolFacts(messages: unknown[], forbiddenText: string[]): Array<Record<string, unknown>> {
  const facts: Array<Record<string, unknown>> = [];
  for (const message of messages) {
    if (message == null || typeof message !== "object") continue;
    const parts = Array.isArray((message as { parts?: unknown }).parts) ? (message as { parts: unknown[] }).parts : [];
    for (const part of parts) {
      if (part == null || typeof part !== "object") continue;
      const value = part as Record<string, unknown>;
      if (value.type !== "tool" || (value.tool !== "kaizen_report" && value.tool !== "kaizen_status")) continue;
      const state = value.state != null && typeof value.state === "object" ? value.state as Record<string, unknown> : {};
      const output = typeof state.output === "string" ? state.output : "";
      let result: Record<string, unknown> | null = null;
      try {
        const parsed = JSON.parse(output) as Record<string, unknown>;
        if (value.tool === "kaizen_report") {
          result = {
            action: parsed.action ?? null,
            projectRef: parsed.projectRef ?? null,
            sessionRef: parsed.sessionRef ?? null,
            signalRef: parsed.signalRef ?? null,
            source: parsed.source ?? null,
            status: parsed.status ?? null,
          };
        } else {
          const counts = parsed.counts != null && typeof parsed.counts === "object" ? parsed.counts as Record<string, unknown> : {};
          const signals = Array.isArray(parsed.signals) ? parsed.signals : [];
          result = {
            activation: parsed.activation ?? null,
            capacity: parsed.capacity ?? null,
            projectRef: parsed.projectRef ?? null,
            signalRefs: signals.flatMap((signal) => signal != null && typeof signal === "object" && typeof (signal as Record<string, unknown>).signalRef === "string" ? [(signal as Record<string, unknown>).signalRef] : []),
            signals: counts.signals ?? null,
            truncated: parsed.truncated ?? null,
          };
        }
      } catch {
        result = null;
      }
      facts.push({
        name: value.tool,
        outputBytes: Buffer.byteLength(output, "utf8"),
        outputSha256: sha256(output),
        privacySafe: forbiddenText.every((text) => text === "" || !output.includes(text)),
        result,
        status: typeof state.status === "string" ? state.status : null,
      });
    }
  }
  return facts;
}

function pluginOnlyConfig(plugin: string): Record<string, unknown> {
  return {
    $schema: "https://opencode.ai/config.json",
    permission: {
      "*": "deny",
      kaizen_report: "allow",
      kaizen_status: "allow",
      kaizen_decision: "allow",
      kaizen_checkpoint: "allow",
    },
    plugin: [plugin],
  };
}

function writeTracedKaizenPlugin(configDir: string, copiedPlugin: string, traceFile: string): string {
  const wrapper = path.join(configDir, "runtime", "kaizen-loaded-tools-wrapper.ts");
  const source = pathToFileURL(path.join(copiedPlugin, "session-env.ts")).href;
  fs.writeFileSync(wrapper, `import fs from "node:fs";
const traceFile = ${JSON.stringify(traceFile)};
const sourceUrl = ${JSON.stringify(source)};
const trace = (phase, detail = {}) => fs.appendFileSync(traceFile, JSON.stringify({ phase, ...detail }) + "\\n", "utf8");
trace("wrapper-module-enter");
export default {
  id: "kaizen-loaded-tools-wrapper",
  async server(input) {
    trace("factory-enter");
    trace("source-import-enter");
    const module = await import(sourceUrl);
    trace("source-import-exit");
    trace("source-factory-enter");
    const hooks = await module.default.server(input);
    trace("source-factory-exit", { kaizenTools: Object.keys(hooks.tool ?? {}).filter((name) => name.startsWith("kaizen_")).sort() });
    trace("factory-exit");
    return hooks;
  },
};
`, { encoding: "utf8", flag: "wx" });
  return pathToFileURL(wrapper).href;
}

function traceRows(traceFile: string): Array<Record<string, unknown>> {
  if (!fs.existsSync(traceFile)) return [];
  return fs.readFileSync(traceFile, "utf8").trim().split(/\r?\n/u).filter(Boolean).map((line) => JSON.parse(line) as Record<string, unknown>);
}

function pluginRuntimeIdentity(root: string): Record<string, unknown> {
  const packageFile = path.join(root, "package.json");
  const lockFile = path.join(root, "package-lock.json");
  const pluginPackage = path.join(root, "node_modules", "@opencode-ai", "plugin", "package.json");
  const sdkPackage = path.join(root, "node_modules", "@opencode-ai", "sdk", "package.json");
  return {
    lockSha256: sha256(fs.readFileSync(lockFile)),
    packageSha256: sha256(fs.readFileSync(packageFile)),
    pluginPackageSha256: sha256(fs.readFileSync(pluginPackage)),
    pluginVersion: (JSON.parse(fs.readFileSync(pluginPackage, "utf8")) as { version?: string }).version ?? null,
    sdkPackageSha256: sha256(fs.readFileSync(sdkPackage)),
    sdkVersion: (JSON.parse(fs.readFileSync(sdkPackage, "utf8")) as { version?: string }).version ?? null,
  };
}

function loadedEnvironment(configDir: string, runtimeRoot: string, dataRoot: string, providerUrl: string): NodeJS.ProcessEnv {
  const environment = isolatedProofServerEnvironment(process.env, configDir, runtimeRoot);
  environment.ALL_PROXY = providerUrl;
  environment.HTTP_PROXY = providerUrl;
  environment.HTTPS_PROXY = providerUrl;
  environment.NO_PROXY = "127.0.0.1,localhost";
  environment.HOME = path.join(runtimeRoot, "home");
  environment.USERPROFILE = environment.HOME;
  environment.OPENCODE_DATA_DIR = dataRoot;
  environment.OPENCODE_PURE = "0";
  delete environment.OPENCODE_DISABLE_DEFAULT_PLUGINS;
  for (const key of ["ANTHROPIC_API_KEY", "AZURE_OPENAI_API_KEY", "GOOGLE_GENERATIVE_AI_API_KEY", "OPENAI_API_KEY", "XAI_API_KEY"]) delete environment[key];
  return environment;
}

async function runProcess(executable: string, args: string[], cwd: string, environment: NodeJS.ProcessEnv, timeoutMs: number): Promise<{
  status: number | null;
  stderr: string;
  stdout: string;
  timedOut: boolean;
}> {
  return await new Promise((resolve, reject) => {
    const child = spawn(executable, args, { cwd, env: environment, shell: false, windowsHide: true });
    const stdout: Buffer[] = [];
    const stderr: Buffer[] = [];
    let stdoutBytes = 0;
    let stderrBytes = 0;
    let timedOut = false;
    child.stdout.on("data", (chunk: Buffer) => {
      if (stdoutBytes < 1024 * 1024) {
        stdout.push(chunk);
        stdoutBytes += chunk.length;
      }
    });
    child.stderr.on("data", (chunk: Buffer) => {
      if (stderrBytes < 1024 * 1024) {
        stderr.push(chunk);
        stderrBytes += chunk.length;
      }
    });
    child.once("error", reject);
    const timer = setTimeout(() => {
      timedOut = true;
      child.kill();
    }, timeoutMs);
    child.once("close", (status) => {
      clearTimeout(timer);
      resolve({ status, stderr: Buffer.concat(stderr).toString("utf8"), stdout: Buffer.concat(stdout).toString("utf8"), timedOut });
    });
  });
}

async function runLoadedConfigPreflights(input: {
  configFile: string;
  environment: NodeJS.ProcessEnv;
  opencode: string;
  plugin: string;
  projectRoot: string;
  provider: ProviderHandle;
  traceFile: string;
  roots: string[];
}): Promise<Array<Record<string, unknown>>> {
  const results: Array<Record<string, unknown>> = [];
  const expectedPhases = ["wrapper-module-enter", "factory-enter", "source-import-enter", "source-import-exit", "source-factory-enter", "source-factory-exit", "factory-exit"];
  for (const phase of ["plugin-only", "provider-added"] as const) {
    fs.writeFileSync(input.configFile, stableJson(phase === "plugin-only" ? pluginOnlyConfig(input.plugin) : config(input.provider.url, input.plugin)), "utf8");
    fs.writeFileSync(input.traceFile, "", "utf8");
    const command = await runProcess(input.opencode, ["debug", "config"], input.projectRoot, input.environment, 60_000);
    const trace = traceRows(input.traceFile);
    const phases = trace.flatMap((row) => typeof row.phase === "string" ? [row.phase] : []);
    const result = {
      phase,
      status: command.status,
      timedOut: command.timedOut,
      stderr: redact(command.stderr, input.roots),
      stdoutBytes: Buffer.byteLength(command.stdout, "utf8"),
      stdoutSha256: sha256(command.stdout),
      trace,
      providerRequestCount: input.provider.requests().length,
      trappedEgress: input.provider.trapped(),
    };
    results.push(result);
    if (command.status !== 0 || command.timedOut || expectedPhases.some((expected) => !phases.includes(expected)) || input.provider.requests().length !== 0 || input.provider.trapped() !== 0) {
      throw Object.assign(new Error(`Kaizen ${phase} config preflight failed.`), { preflights: results });
    }
  }
  return results;
}

async function loadedToolsPreflight(options: Options, identity: Record<string, unknown>): Promise<void> {
  const requestedEvidenceDir = path.resolve(options.evidenceDir!);
  const relativeEvidence = path.relative(evidenceRoot, requestedEvidenceDir);
  if (relativeEvidence === "" || relativeEvidence.startsWith("..") || path.isAbsolute(relativeEvidence)) throw new Error("--evidence-dir must be a new child of the Kaizen change evidence directory");
  if (fs.existsSync(requestedEvidenceDir)) throw new Error("--evidence-dir already exists");
  fs.mkdirSync(requestedEvidenceDir);
  const evidenceName = path.basename(requestedEvidenceDir);
  const fixtureRoot = fs.mkdtempSync(path.join(os.tmpdir(), "opencode-kaizen-loaded-preflight-"));
  const projectRoot = path.join(fixtureRoot, "project");
  const configDir = path.join(fixtureRoot, "config");
  const runtimeRoot = path.join(fixtureRoot, "runtime");
  const dataRoot = path.join(fixtureRoot, "kaizen-data");
  const copiedPlugin = path.join(configDir, "runtime", "plugin");
  const traceFile = path.join(fixtureRoot, "plugin-trace.jsonl");
  const activeConfig = path.join(sourceRoot, "global", "opencode.json");
  const activeConfigBefore = sha256(fs.readFileSync(activeConfig));
  let provider: ProviderHandle | null = null;
  const cleanup: Record<string, unknown> = { activeConfigUnchanged: false, fixtureRemoved: false, providerClosed: false };
  const bundle: Record<string, unknown> = {
    schemaVersion: 1,
    candidate: `cross-project-kaizen-loop-${evidenceName}`,
    environment: identity,
    invocation: `node tools/proofs/cross-project-kaizen.ts --mode loaded-tools-preflight --opencode <installed-opencode> --evidence-dir openspec/changes/add-cross-project-kaizen-loop/evidence/${evidenceName}`,
    status: "failed",
    copiedPlugin: null,
    pluginRuntime: null,
    preflights: [],
    provider: null,
    cleanup,
    error: null,
  };
  try {
    gitInit(projectRoot);
    seedProofConfigDependencies(configDir, path.join(sourceRoot, "global"));
    const configHome = path.join(runtimeRoot, "config-home", "opencode");
    seedProofConfigDependencies(configHome, path.join(sourceRoot, "global"));
    fs.mkdirSync(path.dirname(copiedPlugin), { recursive: true });
    fs.cpSync(path.join(sourceRoot, "global", "plugin"), copiedPlugin, { recursive: true });
    const sourcePluginIdentity = directoryIdentity(path.join(sourceRoot, "global", "plugin"));
    const copiedPluginIdentity = directoryIdentity(copiedPlugin);
    if (JSON.stringify(sourcePluginIdentity) !== JSON.stringify(copiedPluginIdentity)) throw new Error("Copied plugin identity does not match source");
    bundle.copiedPlugin = { source: sourcePluginIdentity, copied: copiedPluginIdentity };
    bundle.pluginRuntime = { configDir: pluginRuntimeIdentity(configDir), configHome: pluginRuntimeIdentity(configHome) };
    provider = await startToolProvider();
    const plugin = writeTracedKaizenPlugin(configDir, copiedPlugin, traceFile);
    const configFile = path.join(configDir, "opencode.json");
    const environment = loadedEnvironment(configDir, runtimeRoot, dataRoot, provider.url);
    const preflights = await runLoadedConfigPreflights({ configFile, environment, opencode: options.opencode!, plugin, projectRoot, provider, traceFile, roots: [fixtureRoot, sourceRoot, os.homedir()] });
    bundle.preflights = preflights;
    bundle.provider = { requests: provider.requests(), trapped: provider.trapped() };
    const checks = {
      activeConfigUnchanged: sha256(fs.readFileSync(activeConfig)) === activeConfigBefore,
      cleanWorktree: gitClean(projectRoot),
      copiedPluginMatched: JSON.stringify(sourcePluginIdentity) === JSON.stringify(copiedPluginIdentity),
      phasesComplete: preflights.length === 2 && preflights.every((row) => row.status === 0 && row.timedOut === false),
      providerFree: provider.requests().length === 0,
      zeroEgress: provider.trapped() === 0,
    };
    bundle.checks = checks;
    if (Object.values(checks).some((value) => !value)) throw new Error(`Kaizen loaded-tools preflight checks failed: ${JSON.stringify(checks)}`);
    bundle.status = "passed";
  } catch (error) {
    const rows = error != null && typeof error === "object" && Array.isArray((error as { preflights?: unknown }).preflights)
      ? (error as { preflights: unknown[] }).preflights
      : null;
    if (rows != null) bundle.preflights = rows;
    bundle.error = proofErrorFacts(error);
  } finally {
    if (provider != null) {
      bundle.provider = { requests: provider.requests(), trapped: provider.trapped() };
      try {
        await provider.close();
        cleanup.providerClosed = true;
      } catch (error) {
        cleanup.providerCloseError = proofErrorFacts(error);
      }
    }
    cleanup.activeConfigUnchanged = sha256(fs.readFileSync(activeConfig)) === activeConfigBefore;
    fs.rmSync(fixtureRoot, { recursive: true, force: true });
    cleanup.fixtureRemoved = !fs.existsSync(fixtureRoot);
    if (["activeConfigUnchanged", "fixtureRemoved", "providerClosed"].some((key) => cleanup[key] !== true)) bundle.status = "failed";
    const serialized = redact(stableJson(bundle), [fixtureRoot, sourceRoot, os.homedir()]);
    fs.writeFileSync(path.join(requestedEvidenceDir, "bundle.json"), serialized, { encoding: "utf8", flag: "wx" });
    console.log(stableJson({ evidenceDir: path.relative(sourceRoot, requestedEvidenceDir).replaceAll("\\", "/"), status: bundle.status }).trim());
    if (bundle.status !== "passed") process.exitCode = 1;
  }
}

async function loadedToolsBoundary(options: Options, identity: Record<string, unknown>): Promise<void> {
  const requestedEvidenceDir = path.resolve(options.evidenceDir!);
  const evidenceName = path.basename(requestedEvidenceDir);
  const relativeEvidence = path.relative(evidenceRoot, requestedEvidenceDir);
  if (relativeEvidence === "" || relativeEvidence.startsWith("..") || path.isAbsolute(relativeEvidence)) {
    throw new Error("--evidence-dir must be a new child of the Kaizen change evidence directory");
  }
  if (fs.existsSync(requestedEvidenceDir)) throw new Error("--evidence-dir already exists");
  fs.mkdirSync(requestedEvidenceDir);

  const fixtureRoot = fs.mkdtempSync(path.join(os.tmpdir(), "opencode-kaizen-loaded-tools-"));
  const projectRoot = path.join(fixtureRoot, "project");
  const configDir = path.join(fixtureRoot, "config");
  const runtimeRoot = path.join(fixtureRoot, "runtime");
  const dataRoot = path.join(fixtureRoot, "kaizen-data");
  const copiedPlugin = path.join(configDir, "runtime", "plugin");
  const traceFile = path.join(fixtureRoot, "plugin-trace.jsonl");
  const activeConfig = path.join(sourceRoot, "global", "opencode.json");
  const activeConfigBefore = sha256(fs.readFileSync(activeConfig));
  let provider: ProviderHandle | null = null;
  let proofServer: ProofServerHandle | null = null;
  let sessionID: string | null = null;
  const cleanup: Record<string, unknown> = {
    activeConfigUnchanged: false,
    fixtureRemoved: false,
    providerClosed: false,
    serverStopped: false,
    sessionDeleted: false,
  };
  const bundle: Record<string, unknown> = {
    schemaVersion: 1,
    candidate: `cross-project-kaizen-loop-${evidenceName}`,
    environment: identity,
    invocation: `node tools/proofs/cross-project-kaizen.ts --mode loaded-tools --opencode <installed-opencode> --evidence-dir openspec/changes/add-cross-project-kaizen-loop/evidence/${evidenceName}`,
    status: "failed",
    stage: "setup",
    checks: null,
    copiedPlugin: null,
    pluginRuntime: null,
    preflights: [],
    pluginTrace: [],
    provider: null,
    tools: null,
    store: null,
    diagnostics: null,
    cleanup,
    error: null,
  };

  try {
    gitInit(projectRoot);
    seedProofConfigDependencies(configDir, path.join(sourceRoot, "global"));
    const configHome = path.join(runtimeRoot, "config-home", "opencode");
    seedProofConfigDependencies(configHome, path.join(sourceRoot, "global"));
    fs.mkdirSync(path.dirname(copiedPlugin), { recursive: true });
    fs.cpSync(path.join(sourceRoot, "global", "plugin"), copiedPlugin, { recursive: true });
    const sourcePluginIdentity = directoryIdentity(path.join(sourceRoot, "global", "plugin"));
    const copiedPluginIdentity = directoryIdentity(copiedPlugin);
    if (JSON.stringify(sourcePluginIdentity) !== JSON.stringify(copiedPluginIdentity)) throw new Error("Copied plugin identity does not match the source plugin identity");
    bundle.copiedPlugin = { copied: copiedPluginIdentity, source: sourcePluginIdentity };
    bundle.pluginRuntime = { configDir: pluginRuntimeIdentity(configDir), configHome: pluginRuntimeIdentity(configHome) };

    provider = await startToolProvider();
    const plugin = writeTracedKaizenPlugin(configDir, copiedPlugin, traceFile);
    const configFile = path.join(configDir, "opencode.json");
    const environment = loadedEnvironment(configDir, runtimeRoot, dataRoot, provider.url);
    fs.mkdirSync(path.dirname(environment.OPENCODE_DB!), { recursive: true });

    bundle.stage = "config-preflight";
    try {
      bundle.preflights = await runLoadedConfigPreflights({ configFile, environment, opencode: options.opencode!, plugin, projectRoot, provider, traceFile, roots: [fixtureRoot, sourceRoot, os.homedir()] });
    } catch (error) {
      if (error != null && typeof error === "object" && Array.isArray((error as { preflights?: unknown }).preflights)) {
        bundle.preflights = (error as { preflights: unknown[] }).preflights;
      }
      throw error;
    }
    fs.writeFileSync(traceFile, "", "utf8");

    bundle.stage = "server-start";
    proofServer = await startProofServer(options.opencode!, projectRoot, environment);
    const client = proofClient(proofServer.url, projectRoot, environment);
    bundle.stage = "session-create";
    const session = await withTimeout(requestData<Record<string, unknown>>(client.session.create({ directory: projectRoot, title: `kaizen-${evidenceName}` }) as Promise<unknown>, "Kaizen loaded-tools session create"), 30_000, "loaded-tools session create");
    if (typeof session.id !== "string" || session.parentID != null) throw new Error("Created Kaizen loaded-tools session is not a verified root session");
    sessionID = session.id;

    bundle.stage = "prompt";
    await withTimeout(requestData(client.session.prompt({
      directory: projectRoot,
      sessionID,
      model: { providerID: "proof", modelID: "proof-model" },
      parts: [{ type: "text", text: "Execute the scripted Kaizen loaded-tools proof." }],
      tools: { kaizen_report: true, kaizen_status: true, kaizen_decision: true, kaizen_checkpoint: true },
    }) as Promise<unknown>, "Kaizen loaded-tools prompt"), 120_000, "loaded-tools prompt");

    bundle.stage = "readback";
    const messages = await withTimeout(requestData<unknown[]>(client.session.messages({ directory: projectRoot, limit: 100, sessionID }) as Promise<unknown>, "Kaizen loaded-tools messages"), 30_000, "loaded-tools messages");
    const toolFacts = loadedToolFacts(messages, [
      fixtureRoot,
      sourceRoot,
      os.homedir(),
      loadedSignal.summary,
      loadedSignal.observedEvidence,
      loadedSignal.impact,
      loadedSignal.likelyCause,
      loadedSignal.doNotRepeat,
      ...loadedSignal.evidenceRefs,
    ]);
    const report = toolFacts.find((fact) => fact.name === "kaizen_report");
    const status = toolFacts.find((fact) => fact.name === "kaizen_status");
    const reportResult = report?.result as Record<string, unknown> | undefined;
    const statusResult = status?.result as Record<string, unknown> | undefined;

    const copiedStore = await import(`${pathToFileURL(path.join(copiedPlugin, "kaizen", "store.ts")).href}?loaded=${Date.now()}`) as typeof import("../../global/plugin/kaizen/store.ts");
    const store = copiedStore.resolveKaizenStore({ worktree: projectRoot, environment });
    if (store == null) throw new Error("Copied Kaizen store was not enabled for loaded readback");
    const inbox = await copiedStore.readKaizenInbox(store, { limit: 25 });
    const inboxRoot = path.join(dataRoot, "kaizen", "v1", "inbox");
    const fileFacts = storeFileFacts(inboxRoot, fixtureRoot);
    const advertised = provider.requests()[0]?.toolNames ?? [];
    const pluginTrace = traceRows(traceFile);
    const sourceFactoryExit = pluginTrace.find((row) => row.phase === "source-factory-exit");
    const checks = {
      activeConfigUnchanged: sha256(fs.readFileSync(activeConfig)) === activeConfigBefore,
      allToolsAdvertised: ["kaizen_checkpoint", "kaizen_decision", "kaizen_report", "kaizen_status"].every((name) => advertised.includes(name)),
      copiedPluginMatched: JSON.stringify(sourcePluginIdentity) === JSON.stringify(copiedPluginIdentity),
      configPreflightsPassed: Array.isArray(bundle.preflights) && bundle.preflights.length === 2,
      pluginFactoryCompleted: Array.isArray(sourceFactoryExit?.kaizenTools) && ["kaizen_checkpoint", "kaizen_decision", "kaizen_report", "kaizen_status"].every((name) => (sourceFactoryExit.kaizenTools as unknown[]).includes(name)),
      loadedReportCompleted: report?.status === "completed" && typeof reportResult?.signalRef === "string" && reportResult.source === "explicit",
      loadedStatusCompleted: status?.status === "completed" && statusResult?.activation === "enabled" && statusResult.signals === 1,
      matchingImmutableRecord: inbox.counts.signalRecords === 1 && inbox.signals.length === 1 && inbox.signals[0]?.signalRef === reportResult?.signalRef,
      networkContained: provider.trapped() === 0,
      privacySafe: toolFacts.every((fact) => fact.privacySafe === true) && fileFacts.every((fact) => fact.privacySafe) && !JSON.stringify({ inbox: {
        projectRefs: inbox.signals.flatMap((signal) => signal.projectRefs),
        sessionRefs: inbox.signals.flatMap((signal) => signal.sessionRefs),
      } }).includes(fixtureRoot),
      providerCallsBounded: provider.requests().length === 3,
      recordBounded: fileFacts.length === 1 && fileFacts[0]?.population === "signal" && fileFacts[0].bytes <= acceptedStoreEnvelope.signalBytes,
      statusPayloadFree: status?.privacySafe === true,
      worktreeClean: gitClean(projectRoot),
    };
    bundle.checks = checks;
    bundle.provider = { requests: provider.requests(), trapped: provider.trapped() };
    bundle.pluginTrace = pluginTrace;
    bundle.tools = toolFacts;
    bundle.store = {
      candidateSources: candidateSourceDigests(),
      counts: inbox.counts,
      fileFacts,
      projectRefs: inbox.signals.flatMap((signal) => signal.projectRefs).sort(),
      sessionRefs: inbox.signals.flatMap((signal) => signal.sessionRefs).sort(),
      signalRefs: inbox.signals.map((signal) => signal.signalRef).sort(),
      worktreeWrites: 0,
    };
    if (Object.values(checks).some((value) => !value)) throw new Error(`Kaizen loaded-tools checks failed: ${JSON.stringify(checks)}`);
    bundle.status = "passed";
    bundle.stage = "cleanup";
  } catch (error) {
    const startupFailure = proofServerStartupFailure(error);
    if (startupFailure != null) {
      const logs = proofServerLogs(startupFailure.server);
      bundle.diagnostics = {
        stderr: redact(logs.stderr, [fixtureRoot, sourceRoot, os.homedir()]),
        stdout: redact(logs.stdout, [fixtureRoot, sourceRoot, os.homedir()]),
      };
      cleanup.serverTerminal = startupFailure.terminal;
      cleanup.serverStopped = startupFailure.terminal != null;
      proofServer = null;
    }
    bundle.pluginTrace = traceRows(traceFile);
    bundle.error = proofErrorFacts(error);
  } finally {
    if (proofServer != null && sessionID != null) {
      try {
        const client = proofClient(proofServer.url, projectRoot);
        const response = await client.session.delete({ directory: projectRoot, sessionID }) as { error?: unknown };
        if (response.error != null) throw response.error;
        cleanup.sessionDeleted = true;
      } catch (error) {
        cleanup.sessionDeleteError = proofErrorFacts(error);
      }
    }
    if (proofServer != null) {
      const logs = proofServerLogs(proofServer);
      try {
        cleanup.serverTerminal = await stopProofServer(proofServer);
        cleanup.serverStopped = true;
      } catch (error) {
        cleanup.serverStopError = proofErrorFacts(error);
      }
      bundle.diagnostics = {
        stderr: redact(logs.stderr, [fixtureRoot, sourceRoot, os.homedir()]),
        stdout: redact(logs.stdout, [fixtureRoot, sourceRoot, os.homedir()]),
      };
    }
    if (provider != null) {
      try {
        await provider.close();
        cleanup.providerClosed = true;
      } catch (error) {
        cleanup.providerCloseError = proofErrorFacts(error);
      }
    }
    bundle.pluginTrace = traceRows(traceFile);
    cleanup.activeConfigUnchanged = sha256(fs.readFileSync(activeConfig)) === activeConfigBefore;
    fs.rmSync(fixtureRoot, { recursive: true, force: true });
    cleanup.fixtureRemoved = !fs.existsSync(fixtureRoot);
    const requiredCleanup = ["activeConfigUnchanged", "fixtureRemoved", "providerClosed", "serverStopped", ...(sessionID == null ? [] : ["sessionDeleted"])];
    if (requiredCleanup.some((key) => cleanup[key] !== true)) bundle.status = "failed";
    bundle.stage = "terminal";
    const serialized = redact(stableJson(bundle), [fixtureRoot, sourceRoot, os.homedir()]);
    for (const forbidden of [fixtureRoot, sourceRoot, os.homedir(), ...Object.values(loadedSignal).flatMap((value) => typeof value === "string" ? [value] : [])]) {
      if (serialized.includes(forbidden) || serialized.includes(forbidden.replaceAll("\\", "/"))) throw new Error("Retained Kaizen loaded-tools evidence contains forbidden private or signal text");
    }
    fs.writeFileSync(path.join(requestedEvidenceDir, "bundle.json"), serialized, { encoding: "utf8", flag: "wx" });
    console.log(stableJson({ evidenceDir: path.relative(sourceRoot, requestedEvidenceDir).replaceAll("\\", "/"), status: bundle.status }).trim());
    if (bundle.status !== "passed") process.exitCode = 1;
  }
}

function replayLoadedTools(options: Options): void {
  const inputDir = path.resolve(options.evidenceDir!);
  const relative = path.relative(evidenceRoot, inputDir);
  if (relative === "" || relative.startsWith("..") || path.isAbsolute(relative)) throw new Error("Replay input must be a child of the Kaizen evidence directory");
  const bundleFile = path.join(inputDir, "bundle.json");
  const stat = fs.lstatSync(bundleFile);
  if (!stat.isFile() || stat.isSymbolicLink() || stat.size > 1024 * 1024) throw new Error("Replay bundle must be one bounded regular file");
  const bundle = JSON.parse(fs.readFileSync(bundleFile, "utf8")) as Record<string, unknown>;
  const errors = Array.isArray(bundle.error) ? bundle.error : [];
  const messages = errors.flatMap((error) => error != null && typeof error === "object" && typeof (error as Record<string, unknown>).message === "string"
    ? [(error as Record<string, unknown>).message as string]
    : []);
  const cleanup = bundle.cleanup != null && typeof bundle.cleanup === "object" ? bundle.cleanup as Record<string, unknown> : {};
  const checks = bundle.checks != null && typeof bundle.checks === "object" ? bundle.checks as Record<string, unknown> : {};
  const startupFailure = messages.some((message) => message.includes("proof server") || message.includes("ready within"));
  const failedChecks = Object.entries(checks).filter(([, value]) => value !== true).map(([name]) => name).sort();
  const oracleFailure = (bundle.tools != null || bundle.store != null)
    && failedChecks.length === 2
    && failedChecks[0] === "privacySafe"
    && failedChecks[1] === "statusPayloadFree";
  console.log(stableJson({
    schemaVersion: 1,
    mode: "replay-loaded-tools",
    writes: false,
    input: path.relative(sourceRoot, bundleFile).replaceAll("\\", "/"),
    candidate: bundle.candidate ?? null,
    terminalReplay: bundle.status === "passed" ? "passed" : "failed",
    classification: startupFailure && bundle.tools == null && bundle.store == null
      ? "proof-runner-or-environment-startup"
      : oracleFailure ? "proof-runner-oracle" : "unknown",
    productCandidateReached: bundle.tools != null || bundle.store != null,
    providerReached: bundle.provider != null,
    cleanupObserved: {
      activeConfigUnchanged: cleanup.activeConfigUnchanged ?? null,
      fixtureRemoved: cleanup.fixtureRemoved ?? null,
      providerClosed: cleanup.providerClosed ?? null,
      serverStopped: cleanup.serverStopped ?? null,
      sessionDeleted: cleanup.sessionDeleted ?? null,
    },
    unlockCondition: oracleFailure
      ? "retained projection identifies an overbroad scopeHint privacy oracle; correct the oracle to forbid only roots and signal text, validate offline, and use one new bounded capture"
      : "startup diagnostics and terminal state retained; causally different config-file loading; no proof-owned process remains",
  }).trim());
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    console.log(usage());
    return;
  }
  if (options.mode === "replay-loaded-tools") {
    replayLoadedTools(options);
    return;
  }
  if (options.mode === "store-boundary") {
    await storeBoundary(options);
    return;
  }
  if (options.mode === "archive-boundary") {
    await archiveBoundary(options);
    return;
  }
  if (options.mode === "triage-boundary") {
    await triageBoundary(options);
    return;
  }
  if (options.mode === "population") {
    await populationBoundary(options);
    return;
  }
  const identity = staticIdentity(options.opencode!);
  if (options.mode === "preflight") {
    console.log(stableJson({ mode: options.mode, ready: true, writes: false, providerCalls: 0, identity }).trim());
    return;
  }
  if (options.mode === "loaded-tools") {
    await loadedToolsBoundary(options, identity);
    return;
  }
  if (options.mode === "loaded-tools-preflight") {
    await loadedToolsPreflight(options, identity);
    return;
  }
  await capture(options, identity);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack ?? error.message : String(error));
  process.exitCode = 1;
});
