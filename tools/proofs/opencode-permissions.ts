#!/usr/bin/env node
import crypto from "node:crypto";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import unrestrictedAgentTools, {
  TOOLLESS_AGENT_NAME,
  UNRESTRICTED_SESSION_PERMISSION,
} from "../../global/extensions/unrestricted-agent-tools.ts";
import {
  proofClient,
  proofServerLogs,
  requestData,
  startProofServer,
  stopProofServer,
  type ProofServerHandle,
} from "./lib/opencode-proof-client.ts";

const PERMISSION_KINDS = [
  "bash",
  "doom_loop",
  "edit",
  "external_directory",
  "glob",
  "grep",
  "list",
  "lsp",
  "question",
  "read",
  "skill",
  "task",
  "todowrite",
  "webfetch",
  "websearch",
] as const;

type JsonRecord = Record<string, unknown>;

type LiveSessionPermissionRecovery = {
  arbiter: {
    configuredPermission: "deny";
    enabledToolCount: 0;
    externalProviderCalled: false;
    listedToolCount: number;
    loopbackProviderCalls: 1;
    messageAdmission: true;
    nuphusConnected: true;
    persistedWildcardAllow: false;
    providerToolCount: 0;
  };
  ordinary: {
    inputPermission: "deny";
    messageAdmission: true;
    persistedPermission: "allow";
    providerCalled: false;
  };
};

type PermissionProofSession = {
  id: string;
  permission?: Array<{ action: string; pattern: string; permission: string }>;
};

type LoopbackProvider = {
  close(): Promise<void>;
  requests(): Array<{ toolNames: string[] }>;
  url: string;
};

type Options = {
  candidateId: string | null;
  evidenceRoot: string | null;
};

const sourceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const proofEnv = { ...process.env, OPENCODE_CONFIG_DIR: path.join(sourceRoot, "global") };

function parseArgs(args: string[]): Options {
  let candidateId: string | null = null;
  let evidenceRoot: string | null = null;
  for (let index = 0; index < args.length; index++) {
    const value = args[index + 1];
    if (args[index] === "--candidate-id" && value != null) {
      candidateId = value;
      index++;
    } else if (args[index] === "--evidence-root" && value != null) {
      evidenceRoot = path.resolve(value);
      index++;
    } else {
      throw new Error(`Unknown or incomplete option: ${args[index]}`);
    }
  }
  if ((candidateId == null) !== (evidenceRoot == null)) {
    throw new Error("--candidate-id and --evidence-root must be supplied together");
  }
  if (candidateId != null && !/^[A-Za-z0-9][A-Za-z0-9._-]{0,99}$/.test(candidateId)) {
    throw new Error("--candidate-id must be a safe identifier");
  }
  if (evidenceRoot != null && !path.isAbsolute(evidenceRoot)) {
    throw new Error("--evidence-root must be absolute");
  }
  return { candidateId, evidenceRoot };
}

function stableValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stableValue);
  if (value == null || typeof value !== "object") return value;
  const input = value as JsonRecord;
  return Object.fromEntries(Object.keys(input).sort().map((key) => [key, stableValue(input[key])]));
}

function stableJson(value: unknown): string {
  return `${JSON.stringify(stableValue(value), null, 2)}\n`;
}

function sha256(value: string | Buffer): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function writeNew(file: string, value: unknown): void {
  fs.writeFileSync(file, stableJson(value), { encoding: "utf8", flag: "wx" });
}

function record(value: unknown): JsonRecord | null {
  return value != null && typeof value === "object" && !Array.isArray(value)
    ? value as JsonRecord
    : null;
}

function completion(text: string, stream: boolean): string {
  const id = "chatcmpl_permission_proof";
  const created = Math.floor(Date.now() / 1_000);
  if (!stream) {
    return JSON.stringify({
      choices: [{ finish_reason: "stop", index: 0, message: { content: text, role: "assistant" } }],
      created,
      id,
      model: "proof-model",
      object: "chat.completion",
      usage: { completion_tokens: 1, prompt_tokens: 1, total_tokens: 2 },
    });
  }
  const chunks = [
    { choices: [{ delta: { content: text, role: "assistant" }, finish_reason: null, index: 0 }], created, id, model: "proof-model", object: "chat.completion.chunk" },
    { choices: [{ delta: {}, finish_reason: "stop", index: 0 }], created, id, model: "proof-model", object: "chat.completion.chunk" },
  ];
  return `${chunks.map((chunk) => `data: ${JSON.stringify(chunk)}\n\n`).join("")}data: [DONE]\n\n`;
}

function startLoopbackProvider(): Promise<LoopbackProvider> {
  const requests: Array<{ toolNames: string[] }> = [];
  const server = http.createServer((request, response) => {
    const url = request.url ?? "";
    if (url.endsWith("/models")) {
      response.writeHead(200, { "content-type": "application/json" });
      response.end(JSON.stringify({ data: [{ id: "proof-model", object: "model", owned_by: "proof" }], object: "list" }));
      return;
    }
    if (!url.endsWith("/chat/completions")) {
      response.writeHead(502, { "content-type": "application/json" });
      response.end(JSON.stringify({ error: { message: "permission proof blocks external egress" } }));
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
      const parsed = JSON.parse(Buffer.concat(chunks).toString("utf8")) as JsonRecord;
      const tools = Array.isArray(parsed.tools) ? parsed.tools : [];
      const toolNames = tools.flatMap((tool) => {
        const fn = record(record(tool)?.function);
        return typeof fn?.name === "string" ? [fn.name] : [];
      }).sort();
      requests.push({ toolNames });
      const stream = parsed.stream === true;
      response.writeHead(200, { "content-type": stream ? "text/event-stream" : "application/json" });
      response.end(completion("{}", stream));
    });
  });
  return new Promise((resolve, reject) => {
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (address == null || typeof address === "string") {
        reject(new Error("Loopback permission provider did not expose a TCP port"));
        return;
      }
      resolve({
        close: () => new Promise((done, fail) => {
          server.closeAllConnections();
          server.close((error) => error == null ? done() : fail(error));
        }),
        requests: () => [...requests],
        url: `http://127.0.0.1:${address.port}`,
      });
    });
    server.once("error", reject);
  });
}

async function proveLiveSessionPermissionRecovery(arbiterPermission: unknown): Promise<LiveSessionPermissionRecovery> {
  const fixture = fs.mkdtempSync(path.join(os.tmpdir(), "opencode-session-permission-proof-"));
  const project = path.join(fixture, "project");
  fs.mkdirSync(project, { recursive: true });
  fs.writeFileSync(path.join(project, "README.md"), "# Session permission proof\n");

  const environment: NodeJS.ProcessEnv = {
    ...proofEnv,
    OPENCODE_DB: path.join(fixture, "opencode.db"),
    OPENCODE_DISABLE_AUTOUPDATE: "1",
    OPENCODE_DISABLE_EMBEDDED_WEB_UI: "1",
    OPENCODE_DISABLE_EXTERNAL_SKILLS: "1",
    OPENCODE_DISABLE_LSP_DOWNLOAD: "1",
    OPENCODE_DISABLE_MODELS_FETCH: "1",
    OPENCODE_DISABLE_PROJECT_CONFIG: "1",
    OPENCODE_EXPERIMENTAL_DISABLE_FILEWATCHER: "1",
  };
  delete environment.OPENCODE_CONFIG;
  delete environment.OPENCODE_CONFIG_CONTENT;
  delete environment.OPENCODE_PURE;

  let client: ReturnType<typeof proofClient> | null = null;
  let failure: unknown = null;
  let outcome: LiveSessionPermissionRecovery | null = null;
  let provider: LoopbackProvider | null = null;
  let server: ProofServerHandle | null = null;
  let serverLogs: string[] = [];
  const sessionIDs: string[] = [];
  const cleanupErrors: unknown[] = [];
  try {
    provider = await startLoopbackProvider();
    environment.OPENCODE_CONFIG_CONTENT = JSON.stringify({
      agent: { [TOOLLESS_AGENT_NAME]: { model: "permission-proof/proof-model" } },
      model: "permission-proof/proof-model",
      provider: {
        "permission-proof": {
          models: {
            "proof-model": {
              limit: { context: 100_000, output: 10_000 },
              name: "Permission Proof Model",
              tool_call: true,
            },
          },
          name: "Loopback Permission Proof",
          npm: "@ai-sdk/openai-compatible",
          options: { apiKey: "proof-not-secret", baseURL: `${provider.url}/v1`, maxRetries: 0 },
        },
      },
      small_model: "permission-proof/proof-model",
    });
    server = await startProofServer("opencode", project, environment);
    client = proofClient(server.url, project, environment);
    const session = await requestData<PermissionProofSession>(client.session.create({
      directory: project,
      permission: [{ action: "deny", pattern: "*", permission: "*" }],
      title: "session permission proof",
    }), "restricted session create");
    const createdSessionID = session.id;
    sessionIDs.push(createdSessionID);
    await requestData(client.session.prompt({
      agent: "build",
      directory: project,
      noReply: true,
      parts: [{ text: "session permission proof", type: "text" }],
      sessionID: createdSessionID,
    }), "permission recovery message admission");
    const current = await requestData<PermissionProofSession>(
      client.session.get({ directory: project, sessionID: createdSessionID }),
      "session permission readback",
    );
    const allowed = current.permission?.some((rule) =>
      rule.action === "allow" && rule.pattern === "*" && rule.permission === "*"
    ) === true;
    if (!allowed) throw new Error("Live chat hook did not persist unrestricted session permissions");
    const arbiterSession = await requestData<PermissionProofSession>(client.session.create({
      directory: project,
      title: "arbiter permission proof",
    }), "arbiter session create");
    sessionIDs.push(arbiterSession.id);
    let nuphusConnected = false;
    for (let attempt = 0; attempt < 120; attempt++) {
      const statuses = await requestData<Record<string, unknown>>(client.mcp.status({ directory: project }), "MCP status");
      if (record(statuses.nuphus)?.status === "connected") {
        nuphusConnected = true;
        break;
      }
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
    if (!nuphusConnected) throw new Error("Nuphus MCP did not connect for the exact schema-boundary proof");
    await requestData(client.session.prompt({
      agent: TOOLLESS_AGENT_NAME,
      directory: project,
      parts: [{ text: "arbiter permission proof", type: "text" }],
      sessionID: arbiterSession.id,
    }), "arbiter message admission");
    const currentArbiter = await requestData<PermissionProofSession>(
      client.session.get({ directory: project, sessionID: arbiterSession.id }),
      "arbiter session permission readback",
    );
    const arbiterWildcardAllow = currentArbiter.permission?.some((rule) =>
      rule.action === "allow" && rule.pattern === "*" && rule.permission === "*"
    ) === true;
    if (arbiterWildcardAllow) throw new Error("Arbiter chat hook restored wildcard session permissions");
    const toolIDs = await requestData<string[]>(client.tool.ids({ directory: project }), "builtin tool inventory");
    const enabledTools = toolIDs.filter((tool) => {
      const sessionAction = effectiveAction(currentArbiter.permission, tool);
      return (sessionAction ?? configuredAction(arbiterPermission, tool)) !== "deny";
    });
    if (enabledTools.length > 0) {
      throw new Error(`Arbiter still has enabled resolved tools: ${enabledTools.join(",")}`);
    }
    const providerRequests = provider.requests();
    if (providerRequests.length !== 1 || providerRequests[0].toolNames.length !== 0) {
      throw new Error(`Arbiter provider request exposed tools: ${providerRequests.flatMap((row) => row.toolNames).join(",")}`);
    }
    outcome = {
      arbiter: {
        configuredPermission: "deny",
        enabledToolCount: 0,
        externalProviderCalled: false,
        listedToolCount: toolIDs.length,
        loopbackProviderCalls: 1,
        messageAdmission: true,
        nuphusConnected: true,
        persistedWildcardAllow: false,
        providerToolCount: 0,
      },
      ordinary: {
        inputPermission: "deny",
        messageAdmission: true,
        persistedPermission: "allow",
        providerCalled: false,
      },
    };
  } catch (error) {
    failure = error;
  } finally {
    if (client != null) {
      for (const sessionID of sessionIDs) {
        try {
          await requestData(client.session.delete({ directory: project, sessionID }), "permission proof session cleanup");
        } catch (error) {
          cleanupErrors.push(error);
        }
      }
    }
    if (server != null) {
      try {
        await stopProofServer(server);
      } catch (error) {
        cleanupErrors.push(error);
      }
      const logs = proofServerLogs(server);
      const escapedFixture = fixture.replaceAll("\\", "\\\\");
      serverLogs = `${logs.stdout}\n${logs.stderr}`
        .replaceAll(fixture, "<fixture>")
        .replaceAll(escapedFixture, "<fixture>")
        .replace(/ses_[A-Za-z0-9]+/g, "<session>")
        .split(/\r?\n/)
        .filter((line) => /error|failed|permission|session\.update|chat\.message/i.test(line))
        .slice(-40);
    }
    if (provider != null) {
      try {
        await provider.close();
      } catch (error) {
        cleanupErrors.push(error);
      }
    }
    try {
      fs.rmSync(fixture, { force: true, maxRetries: 50, recursive: true, retryDelay: 200 });
    } catch (error) {
      cleanupErrors.push(error);
    }
  }

  if (failure != null || cleanupErrors.length > 0 || outcome == null) {
    const error = new Error("Live persisted-session permission recovery proof failed") as Error & { cause?: unknown };
    error.cause = { cleanupErrors, failure, serverLogs };
    throw error;
  }
  return outcome;
}

function runJson(args: string[], env: NodeJS.ProcessEnv = proofEnv): JsonRecord {
  const result = spawnSync("opencode", args, {
    cwd: process.cwd(),
    encoding: "utf8",
    env,
    maxBuffer: 16 * 1024 * 1024,
    shell: false,
  });
  if (result.error != null) {
    const error = new Error(`Failed to launch opencode ${args.join(" ")}`) as Error & { cause?: unknown };
    error.cause = result.error;
    throw error;
  }
  if (result.status !== 0) {
    throw new Error(
      `opencode ${args.join(" ")} exited with status ${result.status ?? "unknown"}; stderr suppressed to avoid leaking resolved configuration`,
    );
  }
  try {
    const parsed = JSON.parse(result.stdout) as unknown;
    const output = record(parsed);
    if (output == null) throw new Error("output is not a JSON object");
    return output;
  } catch (error) {
    const wrapped = new Error(`opencode ${args.join(" ")} returned invalid JSON`) as Error & { cause?: unknown };
    wrapped.cause = error;
    throw wrapped;
  }
}

function allowsEverything(value: unknown): boolean {
  return value === "allow" || record(value)?.["*"] === "allow";
}

function configuredAction(value: unknown, permission: string): string {
  if (typeof value === "string") return value;
  const rules = record(value);
  const exact = rules?.[permission];
  if (typeof exact === "string") return exact;
  const exactPattern = record(exact)?.["*"];
  if (typeof exactPattern === "string") return exactPattern;
  const wildcard = rules?.["*"];
  if (typeof wildcard === "string") return wildcard;
  return "allow";
}

function effectiveAction(rules: unknown, permission: string): string | null {
  if (!Array.isArray(rules)) return null;
  let action: string | null = null;
  for (const value of rules) {
    const rule = record(value);
    if (
      (rule?.permission === "*" || rule?.permission === permission) &&
      rule.pattern === "*" &&
      typeof rule.action === "string"
    ) {
      action = rule.action;
    }
  }
  return action;
}

const versionResult = spawnSync("opencode", ["--version"], {
  cwd: process.cwd(),
  encoding: "utf8",
  env: proofEnv,
  shell: false,
});
if (versionResult.error != null || versionResult.status !== 0) {
  const error = new Error("Installed opencode version probe failed") as Error & { cause?: unknown };
  error.cause = versionResult.error;
  throw error;
}

const config = runJson(["debug", "config"]);
if (!allowsEverything(config.permission)) {
  throw new Error("Resolved top-level OpenCode permission is not allow-all");
}

const configuredMainPrecedence = Object.fromEntries(
  (["allow", "ask", "deny"] as const).map((requested) => {
    const resolved = runJson(["debug", "config"], {
      ...proofEnv,
      OPENCODE_CONFIG_CONTENT: JSON.stringify({ permission: requested }),
    });
    const actual = configuredAction(resolved.permission, "*");
    if (actual !== "allow") {
      throw new Error(`Unrestricted-agent-tools did not override main permission: requested=${requested} actual=${actual}`);
    }
    return [requested, actual];
  }),
);

const agents = record(config.agent);
if (agents == null || Object.keys(agents).length === 0) {
  throw new Error("Resolved OpenCode config contains no agents");
}

const agentNames = Object.keys(agents).sort();
const agentToolCounts: Array<{ agent: string; enabled: number }> = [];
for (const name of agentNames) {
  const configured = record(agents[name]);
  if (configured == null) throw new Error(`Resolved agent config is invalid: ${name}`);

  const effective = runJson(["debug", "agent", name]);
  const expectedAction = name === TOOLLESS_AGENT_NAME ? "deny" : "allow";
  for (const permission of PERMISSION_KINDS) {
    const expected = configuredAction(configured.permission, permission);
    const action = effectiveAction(effective.permission, permission);
    if (expected !== expectedAction) {
      throw new Error(`Resolved agent permission is incorrect: agent=${name} permission=${permission} expected=${expectedAction} configured=${expected}`);
    }
    if (action !== expected) {
      throw new Error(`Effective agent permission differs from configured policy: agent=${name} permission=${permission} expected=${expected} action=${action ?? "missing"}`);
    }
  }
  const tools = record(effective.tools);
  if (tools == null || Object.keys(tools).length === 0) {
    throw new Error(`Effective agent tool map is empty: agent=${name}`);
  }
  const enabled = Object.entries(tools).filter(([, available]) => available === true).map(([tool]) => tool);
  if (name === TOOLLESS_AGENT_NAME) {
    if (enabled.length > 0) throw new Error(`Tool-less arbiter exposes effective tools: ${enabled.join(",")}`);
  } else {
    const disabled = Object.entries(tools).filter(([, available]) => available !== true).map(([tool]) => tool);
    if (disabled.length > 0) throw new Error(`Effective agent tools are disabled: agent=${name} tools=${disabled.join(",")}`);
    if (tools.bash !== true) throw new Error(`Effective agent has no bash tool: agent=${name}`);
  }
  agentToolCounts.push({ agent: name, enabled: enabled.length });
}

const restrictedMessage = { tools: { bash: false, edit: false } };
const arbiterMessage = { tools: { bash: false, edit: false } };
const sessionUpdates: unknown[] = [];
const pluginHooks = await unrestrictedAgentTools.server({
  client: {
    session: {
      update: async (input: unknown) => {
        sessionUpdates.push(input);
        return { data: {} };
      },
    },
  },
  directory: process.cwd(),
} as never);
await pluginHooks["chat.message"]?.(
  { agent: "build", sessionID: "session_permission_proof" },
  { message: restrictedMessage as never, parts: [] },
);
if ("tools" in restrictedMessage) throw new Error("Message-level tool restrictions were not removed");
const sessionUpdate = record(sessionUpdates[0]);
const sessionUpdateBody = record(sessionUpdate?.body);
const sessionUpdatePath = record(sessionUpdate?.path);
const sessionUpdateQuery = record(sessionUpdate?.query);
if (
  sessionUpdates.length !== 1 ||
  sessionUpdatePath?.id !== "session_permission_proof" ||
  sessionUpdateQuery?.directory !== process.cwd() ||
  JSON.stringify(sessionUpdateBody?.permission) !== JSON.stringify(UNRESTRICTED_SESSION_PERMISSION)
) {
  throw new Error("Persisted session permissions were not restored to allow-all by the chat hook");
}
await pluginHooks["chat.message"]?.(
  { agent: TOOLLESS_AGENT_NAME, sessionID: "arbiter_permission_proof" },
  { message: arbiterMessage as never, parts: [] },
);
if (!("tools" in arbiterMessage) || sessionUpdates.length !== 1) {
  throw new Error("Tool-less arbiter was widened by the unrestricted chat hook");
}

const promptRouteSources = (fs.readdirSync(path.join(sourceRoot, "global"), {
  encoding: "utf8",
  recursive: true,
}) as string[])
  .filter((relative) => relative.endsWith(".ts"))
  .map((relative) => `global/${relative.replaceAll("\\", "/")}`)
  .sort((left, right) => left.localeCompare(right));
const promptToolFilters = promptRouteSources.filter((relative) => {
  const source = fs.readFileSync(path.join(sourceRoot, relative), "utf8");
  return /\.session\.prompt(?:Async)?\s*\(/.test(source) && /\btools\s*(?::|,)/.test(source);
});
if (promptToolFilters.length > 0) {
  throw new Error(`Completion-guard prompt routes still filter tools: ${promptToolFilters.join(",")}`);
}
const sessionPermissionFilters = promptRouteSources.filter((relative) => {
  const source = fs.readFileSync(path.join(sourceRoot, relative), "utf8");
  return /\.session\.create\s*\(/.test(source) && /\bpermission\s*(?::|,)/.test(source);
});
if (sessionPermissionFilters.length > 0) {
  throw new Error(`Session creation still overrides permissions: ${sessionPermissionFilters.join(",")}`);
}

const configuredArbiter = record(agents[TOOLLESS_AGENT_NAME]);
if (configuredArbiter == null) throw new Error("Resolved config does not contain the hidden completion arbiter");
const liveSessionPermissionRecovery = await proveLiveSessionPermissionRecovery(configuredArbiter.permission);
const options = parseArgs(process.argv.slice(2));
const summary = {
  schemaVersion: 1,
  boundary: "installed-opencode-resolved-agent-permissions",
  opencodeVersion: versionResult.stdout.trim(),
  agentCount: agentNames.length,
  agents: agentNames,
  agentToolCounts,
  configuredMainPrecedence,
  liveSessionPermissionRecovery,
  messageToolRestrictions: "removed-except-tool-less-arbiter",
  persistedSessionPermissions: "ordinary-healed-arbiter-not-overridden",
  promptToolRestrictions: "absent",
  sessionPermissionRestrictions: "absent",
  permissionKinds: PERMISSION_KINDS,
  outcome: "pass",
};

if (options.evidenceRoot != null && options.candidateId != null) {
  if (fs.existsSync(options.evidenceRoot)) throw new Error("Evidence root already exists");
  fs.mkdirSync(options.evidenceRoot, { recursive: false });
  writeNew(path.join(options.evidenceRoot, "raw.json"), {
    ...summary,
    candidateId: options.candidateId,
    environment: { node: process.version, platform: process.platform },
    invocation: ["npm", "run", "proof:permissions", "--", "--evidence-root", "<evidence-root>", "--candidate-id", options.candidateId],
    productionSources: [
      "global/extensions/unrestricted-agent-tools.ts",
      "global/extensions/session-completion-guard/controller.ts",
      "global/extensions/session-completion-guard/runtime-support.ts",
      "global/extensions/session-completion-guard/arbiter-route.ts",
      "global/agents/session-completion-arbiter.md",
      "global/agents/sdet-quality-engineer.md",
    ].map((relative) => ({ path: relative, sha256: sha256(fs.readFileSync(path.join(sourceRoot, relative))) })),
    runnerSource: {
      path: "tools/proofs/opencode-permissions.ts",
      sha256: sha256(fs.readFileSync(fileURLToPath(import.meta.url))),
    },
  });
  writeNew(path.join(options.evidenceRoot, "evaluation.json"), {
    candidateId: options.candidateId,
    allResolvedAgentTools: "normal-enabled-arbiter-denied",
    configuredMainPrecedence,
    liveSessionPermissionRecovery,
    mainDefault: "allow-all",
    messageToolRestrictions: "removed-except-tool-less-arbiter",
    persistedSessionPermissions: "ordinary-healed-arbiter-not-overridden",
    promptToolRestrictions: "absent",
    sessionPermissionRestrictions: "absent",
    schemaVersion: 1,
    status: "complete",
  });
}

console.log(stableJson(options.evidenceRoot == null
  ? summary
  : { candidateId: options.candidateId, evidenceRoot: "<evidence-root>", status: "complete" }).trimEnd());
