import {
  createOpencodeClient,
  type OpencodeClient,
  type Session,
} from "../../../global/node_modules/@opencode-ai/sdk/dist/v2/client.js";
import { spawn, spawnSync, type ChildProcessWithoutNullStreams } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import { stopProofProcessTree } from "./proof-process-cleanup.ts";

export type ProofRoute = {
  agent: string;
  hidden: boolean;
  model: {
    modelID: string;
    providerID: string;
  };
  variant: string | null;
};

export type RoutedProofSessions = {
  child: Session;
  root: Session;
};

export type ProofServerProbe = {
  error?: string;
  route: string;
  status?: number;
};

export type ProofServerStartupFacts = {
  hostConfigLoaded: boolean;
  isolatedConfigLoaded: boolean;
  ripgrepDownloadRequested: boolean;
};

export type ProofServerHandle = {
  child: ChildProcessWithoutNullStreams;
  completion: Promise<{ signal: NodeJS.Signals | null; status: number | null }>;
  stderr: Buffer[];
  stdout: Buffer[];
  url: string;
};

export type ProofServerStartupFailure = {
  server: ProofServerHandle;
  terminal: { signal: NodeJS.Signals | null; status: number | null } | null;
};

export type SummarizedProofEvidence = {
  cleanup: {
    error: Array<Record<string, unknown>> | null;
    sessionsRemoved: boolean;
  };
  compactionContext: string;
  error: {
    facts: Array<Record<string, unknown>>;
    stage: "create" | "main" | "summarize" | "summary-readback" | "reconstruction" | "final-readback";
  } | null;
  mainResponse: string;
  messages: {
    assistant: Array<{
      agent: string | null;
      error: Array<Record<string, unknown>> | null;
      finish: string | null;
      modelID: string | null;
      providerID: string | null;
      summary: boolean;
      text: string;
    }>;
    toolCalls: Array<{ name: string; status: string | null }>;
  };
  providerRequestCount: number;
  reconstructionResponse: string;
  sessionID: string | null;
  summarizeAccepted: boolean;
};

export type DiagnosticProofEvidence = {
  cleanup: {
    error: Array<Record<string, unknown>> | null;
    sessionsRemoved: boolean;
  };
  errors: Array<{
    facts: Array<Record<string, unknown>>;
    stage: "create" | "prompt" | "abort" | "readback";
  }>;
  messages: SummarizedProofEvidence["messages"];
  providerRequestCount: number;
  response: string;
  sessionID: string | null;
};

export const PROOF_SERVER_CONFIG_LOAD_MS = 15_000;
export const PROOF_SERVER_PLUGIN_READY_MS = 165_000;
export const PROOF_SERVER_READINESS_MS = PROOF_SERVER_CONFIG_LOAD_MS + PROOF_SERVER_PLUGIN_READY_MS;

export function installedOpenCodeIdentity(executable: string): { sha256: string; version: string } {
  if (!path.isAbsolute(executable) || !fs.statSync(executable).isFile()) throw new Error("Installed OpenCode executable is unreadable");
  const packagePath = path.resolve(path.dirname(executable), "..", "package.json");
  const packageVersion = fs.existsSync(packagePath)
    ? (JSON.parse(fs.readFileSync(packagePath, "utf8")) as Record<string, unknown>).version
    : null;
  const versionResult = packageVersion == null
    ? spawnSync(executable, ["--version"], { encoding: "utf8", shell: false, windowsHide: true })
    : null;
  const version = typeof packageVersion === "string" && packageVersion.trim() !== ""
    ? packageVersion.trim()
    : versionResult?.status === 0
      ? versionResult.stdout.trim().split(/\r?\n/, 1)[0]
      : null;
  if (version == null || version === "") throw new Error("Installed OpenCode version is unreadable");
  return {
    sha256: crypto.createHash("sha256").update(fs.readFileSync(executable)).digest("hex"),
    version,
  };
}

export function proofServerStartupFacts(
  stdout: string,
  stderr: string,
  configDir: string,
  isolatedRoots: string[] = [],
): ProofServerStartupFacts {
  const logs = `${stdout}\n${stderr}`.replaceAll("\\\\", "\\");
  const hostConfigRoots = [
    path.join(os.homedir(), ".config", "opencode"),
    ...(process.env.XDG_CONFIG_HOME == null ? [] : [path.join(process.env.XDG_CONFIG_HOME, "opencode")]),
  ];
  return {
    hostConfigLoaded: hostConfigRoots.some((root) => logs.includes(root)),
    isolatedConfigLoaded: [configDir, ...isolatedRoots].some((root) => logs.includes(root)),
    ripgrepDownloadRequested: logs.includes("downloading ripgrep"),
  };
}

function installedRipgrep(baseEnvironment: NodeJS.ProcessEnv): string {
  const executable = process.platform === "win32" ? "rg.exe" : "rg";
  const cacheRoots = [
    baseEnvironment.XDG_CACHE_HOME,
    path.join(os.homedir(), ".cache"),
    ...(process.platform === "darwin" ? [path.join(os.homedir(), "Library", "Caches")] : []),
  ].filter((value): value is string => typeof value === "string" && value.trim() !== "");
  const ripgrep = cacheRoots
    .map((root) => path.join(root, "opencode", "bin", executable))
    .find((candidate) => fs.existsSync(candidate));
  if (ripgrep == null) throw new Error("Installed OpenCode ripgrep dependency is unavailable for an offline proof server");
  return ripgrep;
}

export function isolatedProofServerEnvironment(
  baseEnvironment: NodeJS.ProcessEnv,
  configDir: string,
  runtimeRoot: string,
): NodeJS.ProcessEnv {
  const ripgrep = installedRipgrep(baseEnvironment);
  const environment: NodeJS.ProcessEnv = {
    ...baseEnvironment,
    OPENCODE_CONFIG_DIR: configDir,
    OPENCODE_DB: path.join(runtimeRoot, "data", "opencode", "opencode.db"),
    OPENCODE_DISABLE_AUTOUPDATE: "1",
    OPENCODE_DISABLE_DEFAULT_PLUGINS: "1",
    OPENCODE_DISABLE_EMBEDDED_WEB_UI: "1",
    OPENCODE_DISABLE_EXTERNAL_SKILLS: "1",
    OPENCODE_DISABLE_LSP_DOWNLOAD: "1",
    OPENCODE_DISABLE_MODELS_FETCH: "1",
    OPENCODE_EXPERIMENTAL_DISABLE_FILEWATCHER: "1",
    OPENCODE_PURE: "0",
    OPENCODE_TEST_HOME: path.join(runtimeRoot, "home"),
    PATH: `${path.dirname(ripgrep)}${path.delimiter}${baseEnvironment.PATH ?? ""}`,
    XDG_CACHE_HOME: path.join(runtimeRoot, "cache"),
    XDG_CONFIG_HOME: path.join(runtimeRoot, "config-home"),
    XDG_DATA_HOME: path.join(runtimeRoot, "data"),
    XDG_STATE_HOME: path.join(runtimeRoot, "state"),
  };
  delete environment.OPENCODE_CONFIG;
  delete environment.OPENCODE_CONFIG_CONTENT;
  delete environment.OPENCODE_PID;
  delete environment.OPENCODE_SERVER_PASSWORD;
  delete environment.OPENCODE_SERVER_USERNAME;
  delete environment.OPENCODE_SESSION_ID;
  return environment;
}

export function configuredProofServerEnvironment(
  baseEnvironment: NodeJS.ProcessEnv,
  configDir: string,
  runtimeRoot: string,
  configContent: Record<string, unknown>,
): NodeJS.ProcessEnv {
  const ripgrep = installedRipgrep(baseEnvironment);
  const environment: NodeJS.ProcessEnv = {
    ...baseEnvironment,
    OPENCODE_CONFIG_CONTENT: JSON.stringify(configContent),
    OPENCODE_CONFIG_DIR: configDir,
    OPENCODE_DB: path.join(runtimeRoot, "data", "opencode", "opencode.db"),
    OPENCODE_DISABLE_AUTOUPDATE: "1",
    OPENCODE_DISABLE_EMBEDDED_WEB_UI: "1",
    OPENCODE_DISABLE_EXTERNAL_SKILLS: "1",
    OPENCODE_DISABLE_LSP_DOWNLOAD: "1",
    OPENCODE_DISABLE_MODELS_FETCH: "1",
    OPENCODE_DISABLE_PROJECT_CONFIG: "1",
    OPENCODE_EXPERIMENTAL_DISABLE_FILEWATCHER: "1",
    OPENCODE_PURE: "1",
    PATH: `${path.dirname(ripgrep)}${path.delimiter}${baseEnvironment.PATH ?? ""}`,
    XDG_CACHE_HOME: path.join(runtimeRoot, "cache"),
    XDG_CONFIG_HOME: path.join(runtimeRoot, "config-home"),
    XDG_STATE_HOME: path.join(runtimeRoot, "state"),
  };
  delete environment.OPENCODE_CONFIG;
  delete environment.OPENCODE_PID;
  delete environment.OPENCODE_SERVER_PASSWORD;
  delete environment.OPENCODE_SERVER_USERNAME;
  delete environment.OPENCODE_SESSION_ID;
  return environment;
}

export function seedProofConfigDependencies(configDir: string, dependencyRoot: string): void {
  const packageFile = path.join(dependencyRoot, "package.json");
  const lockFile = path.join(dependencyRoot, "package-lock.json");
  const nodeModules = path.join(dependencyRoot, "node_modules");
  for (const required of [packageFile, lockFile, nodeModules]) {
    if (!fs.existsSync(required)) throw new Error(`Installed proof config dependency is unavailable: ${path.basename(required)}`);
  }
  fs.mkdirSync(configDir, { recursive: true });
  fs.copyFileSync(packageFile, path.join(configDir, "package.json"));
  fs.copyFileSync(lockFile, path.join(configDir, "package-lock.json"));
  fs.symlinkSync(nodeModules, path.join(configDir, "node_modules"), process.platform === "win32" ? "junction" : "dir");
}

export function seedProofModelsCatalog(runtimeRoot: string, requiredModels: string[]): { sha256: string } {
  const source = path.join(os.homedir(), ".cache", "opencode", "models.json");
  if (!fs.existsSync(source)) throw new Error("Installed OpenCode models catalog is unavailable for an offline proof server");
  const bytes = fs.readFileSync(source);
  const catalog = JSON.parse(bytes.toString("utf8")) as Record<string, unknown>;
  if (catalog == null || typeof catalog !== "object" || Array.isArray(catalog)) {
    throw new Error("Installed OpenCode models catalog is malformed");
  }
  for (const route of requiredModels) {
    const [providerID, ...modelParts] = route.split("/");
    const provider = catalog[providerID];
    const models = provider != null && typeof provider === "object" && !Array.isArray(provider)
      ? (provider as Record<string, unknown>).models
      : null;
    const modelID = modelParts.join("/");
    if (providerID === "" || modelID === "" || models == null || typeof models !== "object" || Array.isArray(models) || !Object.hasOwn(models, modelID)) {
      throw new Error(`Installed OpenCode models catalog does not contain ${route}`);
    }
  }
  const destination = path.join(runtimeRoot, "cache", "opencode", "models.json");
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.writeFileSync(destination, bytes, { flag: "wx" });
  return { sha256: crypto.createHash("sha256").update(bytes).digest("hex") };
}

export function proofErrorFacts(error: unknown): Array<Record<string, unknown>> {
  const facts: Array<Record<string, unknown>> = [];
  let current: unknown = error;
  for (let depth = 0; depth < 4 && current != null; depth++) {
    const value = typeof current === "object" ? current as Record<string, unknown> : null;
    facts.push({
      depth,
      ...(typeof current === "string" ? { message: current } : {}),
      ...(typeof value?.name === "string" ? { name: value.name } : {}),
      ...(typeof value?.message === "string" ? { message: value.message } : {}),
      ...(typeof value?.code === "string" || typeof value?.code === "number" ? { code: value.code } : {}),
      ...(typeof value?.status === "string" || typeof value?.status === "number" ? { status: value.status } : {}),
    });
    current = value?.cause;
  }
  return facts;
}

export async function probeProofServer(baseUrl: string): Promise<ProofServerProbe[]> {
  return Promise.all(["/path", "/session/status"].map(async (route) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 2_000);
    try {
      const response = await fetch(new URL(route, baseUrl), { signal: controller.signal });
      await response.body?.cancel();
      return { route, status: response.status };
    } catch (error) {
      return {
        error: proofErrorFacts(error).map((fact) => String(fact.message ?? fact.name ?? "unknown")).join(": ").slice(0, 500),
        route,
      };
    } finally {
      clearTimeout(timer);
    }
  }));
}

export async function requestData<T>(request: Promise<unknown>, label: string): Promise<T> {
  const response = await request as { data?: T; error?: unknown };
  if (response.error != null) {
    const error = new Error(`${label} failed`) as Error & { cause?: unknown };
    error.cause = response.error;
    throw error;
  }
  if (!("data" in response)) throw new Error(`${label} returned no data`);
  return response.data as T;
}

export function proofClient(baseUrl: string, directory: string): OpencodeClient {
  const password = process.env.OPENCODE_SERVER_PASSWORD;
  const username = process.env.OPENCODE_SERVER_USERNAME ?? "opencode";
  const headers = password
    ? { Authorization: `Basic ${Buffer.from(`${username}:${password}`).toString("base64")}` }
    : undefined;
  return createOpencodeClient({ baseUrl, directory, ...(headers == null ? {} : { headers }) });
}

function agentRows(payload: unknown): Array<Record<string, unknown>> {
  if (Array.isArray(payload)) return payload.filter((value): value is Record<string, unknown> => value != null && typeof value === "object");
  if (payload != null && typeof payload === "object") {
    const data = (payload as { data?: unknown }).data;
    if (Array.isArray(data)) return data.filter((value): value is Record<string, unknown> => value != null && typeof value === "object");
  }
  throw new Error("agent.list returned an unsupported payload shape");
}

export async function resolveProofRoute(
  client: OpencodeClient,
  directory: string,
  agent: string,
): Promise<ProofRoute> {
  const payload = await requestData<unknown>(
    client.v2.agent.list({ location: { directory } }) as Promise<unknown>,
    "agent.list",
  );
  const rows = agentRows(payload);
  const row = rows.find((candidate) => candidate.id === agent);
  if (row == null) {
    const available = rows.flatMap((candidate) => typeof candidate.id === "string" ? [candidate.id] : []).sort();
    throw new Error(`Configured proof agent is unavailable: ${agent}; available=${available.join(",")}`);
  }
  const model = row.model as { id?: unknown; providerID?: unknown; variant?: unknown } | undefined;
  if (typeof model?.providerID !== "string" || typeof model.id !== "string") {
    throw new Error(`Configured proof agent has no model route: ${agent}`);
  }
  return {
    agent,
    hidden: row.hidden === true,
    model: { modelID: model.id, providerID: model.providerID },
    variant: typeof model.variant === "string" ? model.variant : null,
  };
}

export async function assertProofRouteAvailable(
  client: OpencodeClient,
  directory: string,
  route: ProofRoute,
): Promise<void> {
  const providers = await requestData<{
    all: Array<{ id: string; models: Record<string, unknown> }>;
    connected: string[];
  }>(client.provider.list({ directory }) as Promise<unknown>, "provider.list");
  const provider = providers.all.find((candidate) => candidate.id === route.model.providerID);
  if (provider == null) throw new Error(`Configured proof provider is unavailable: ${route.model.providerID}`);
  if (!Object.hasOwn(provider.models, route.model.modelID)) {
    throw new Error(`Configured proof model is unavailable: ${route.model.providerID}/${route.model.modelID}`);
  }
  if (!providers.connected.includes(route.model.providerID)) {
    throw new Error(`Configured proof provider is not connected: ${route.model.providerID}`);
  }
}

export async function waitForProofRoute(
  client: OpencodeClient,
  directory: string,
  agent: string,
  timeoutMs = 5_000,
): Promise<ProofRoute> {
  const deadline = Date.now() + timeoutMs;
  let lastError: unknown = null;
  do {
    try {
      return await resolveProofRoute(client, directory, agent);
    } catch (error) {
      lastError = error;
      if (Date.now() >= deadline) break;
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  } while (true);
  const error = new Error(`Proof agent route did not become ready within ${timeoutMs}ms`) as Error & { cause?: unknown };
  error.cause = lastError;
  throw error;
}

export async function disabledToolMap(
  client: OpencodeClient,
  directory: string,
): Promise<Record<string, boolean>> {
  const ids = await requestData<string[]>(client.tool.ids({ directory }) as Promise<unknown>, "tool.ids");
  return Object.fromEntries(ids.map((id) => [id, false]));
}

export async function createRoutedProofSessions(
  client: OpencodeClient,
  directory: string,
  route: ProofRoute,
  title: string,
): Promise<RoutedProofSessions> {
  const root = await requestData<Session>(client.session.create({
    directory,
    title: `${title} root`,
  }) as Promise<unknown>, "proof root create");
  try {
    const child = await requestData<Session>(client.session.create({
      agent: route.agent,
      directory,
      model: {
        id: route.model.modelID,
        providerID: route.model.providerID,
        ...(route.variant == null ? {} : { variant: route.variant }),
      },
      parentID: root.id,
      title: `${title} child`,
    }) as Promise<unknown>, "proof child create");
    return { child, root };
  } catch (error) {
    await client.session.delete({ directory, sessionID: root.id });
    throw error;
  }
}

export async function deleteProofSessions(
  client: OpencodeClient,
  directory: string,
  sessions: Partial<RoutedProofSessions>,
): Promise<void> {
  let cleanupError: unknown = null;
  for (const session of [sessions.child, sessions.root]) {
    if (session == null) continue;
    try {
      const response = await client.session.delete({ directory, sessionID: session.id }) as { error?: unknown };
      if (response.error != null) throw response.error;
    } catch (error) {
      cleanupError ??= error;
    }
  }
  if (cleanupError != null) {
    const error = new Error("Proof session cleanup failed") as Error & { cause?: unknown };
    error.cause = cleanupError;
    throw error;
  }
}

function freeProofPort(): Promise<number> {
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

export async function startProofServer(
  executable: string,
  directory: string,
  environment: NodeJS.ProcessEnv,
  timeoutMs = PROOF_SERVER_READINESS_MS,
): Promise<ProofServerHandle> {
  const port = await freeProofPort();
  const child = spawn(executable, [
    "serve",
    "--hostname", "127.0.0.1",
    "--port", String(port),
    "--print-logs",
    "--log-level", "INFO",
  ], {
    cwd: directory,
    env: environment,
    shell: false,
    windowsHide: true,
  });
  const stderr: Buffer[] = [];
  const stdout: Buffer[] = [];
  let stderrBytes = 0;
  let stdoutBytes = 0;
  child.stderr.on("data", (chunk: Buffer) => {
    if (stderrBytes < 1024 * 1024) {
      stderr.push(chunk);
      stderrBytes += chunk.length;
    }
  });
  child.stdout.on("data", (chunk: Buffer) => {
    if (stdoutBytes < 1024 * 1024) {
      stdout.push(chunk);
      stdoutBytes += chunk.length;
    }
  });
  const completion = new Promise<{ signal: NodeJS.Signals | null; status: number | null }>((resolve, reject) => {
    child.once("error", reject);
    child.once("close", (status, signal) => resolve({ signal, status }));
  });
  const handle: ProofServerHandle = { child, completion, stderr, stdout, url: `http://127.0.0.1:${port}` };
  const deadline = Date.now() + timeoutMs;
  try {
    while (Date.now() < deadline) {
      if (child.exitCode != null) throw new Error(`Pinned OpenCode proof server exited during readiness: ${child.exitCode}`);
      const probes = await probeProofServer(handle.url);
      if (probes.some((probe) => probe.route === "/session/status" && probe.status != null && probe.status >= 200 && probe.status < 500)) return handle;
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    throw new Error(`Pinned OpenCode proof server did not become ready within ${timeoutMs}ms`);
  } catch (error) {
    let terminal: ProofServerStartupFailure["terminal"] = null;
    let cleanupError: unknown = null;
    try {
      terminal = await stopProofServer(handle);
    } catch (stopError) {
      cleanupError = stopError;
    }
    const failure = new Error("Pinned OpenCode proof server startup failed") as Error & ProofServerStartupFailure & { cause?: unknown; cleanupCause?: unknown };
    failure.cause = error;
    failure.cleanupCause = cleanupError;
    failure.server = handle;
    failure.terminal = terminal;
    throw failure;
  }
}

export function proofServerStartupFailure(error: unknown): ProofServerStartupFailure | null {
  if (error == null || typeof error !== "object") return null;
  const value = error as Partial<ProofServerStartupFailure>;
  return value.server != null && typeof value.server === "object" && "child" in value.server
    ? { server: value.server, terminal: value.terminal ?? null }
    : null;
}

export async function stopProofServer(server: ProofServerHandle): Promise<{ signal: NodeJS.Signals | null; status: number | null }> {
  if (server.child.exitCode == null && server.child.signalCode == null) await stopProofProcessTree(server.child);
  const terminal = await Promise.race([
    server.completion,
    new Promise<never>((_resolve, reject) => setTimeout(() => reject(new Error("Pinned OpenCode proof server did not terminate within 10000ms")), 10_000)),
  ]);
  const probes = await probeProofServer(server.url);
  if (probes.some((probe) => probe.status != null)) throw new Error("Pinned OpenCode proof server listener remained reachable after termination");
  return terminal;
}

export function proofServerLogs(server: ProofServerHandle): { stderr: string; stdout: string } {
  return {
    stderr: Buffer.concat(server.stderr).toString("utf8"),
    stdout: Buffer.concat(server.stdout).toString("utf8"),
  };
}

function messageText(message: unknown): string {
  if (message == null || typeof message !== "object") return "";
  const parts = (message as { parts?: unknown }).parts;
  if (!Array.isArray(parts)) return "";
  return parts.flatMap((part) => {
    if (part == null || typeof part !== "object") return [];
    const value = part as Record<string, unknown>;
    return value.type === "text" && typeof value.text === "string" ? [value.text] : [];
  }).join("\n");
}

function messageProjection(messages: unknown[]): SummarizedProofEvidence["messages"] {
  const assistant: SummarizedProofEvidence["messages"]["assistant"] = [];
  const toolCalls: SummarizedProofEvidence["messages"]["toolCalls"] = [];
  for (const message of messages) {
    if (message == null || typeof message !== "object") continue;
    const row = message as { info?: unknown; parts?: unknown };
    const info = row.info != null && typeof row.info === "object" ? row.info as Record<string, unknown> : {};
    const parts = Array.isArray(row.parts) ? row.parts : [];
    if (info.role === "assistant") {
      assistant.push({
        agent: typeof info.agent === "string" ? info.agent : null,
        error: info.error == null ? null : proofErrorFacts(info.error),
        finish: typeof info.finish === "string" ? info.finish : null,
        modelID: typeof info.modelID === "string" ? info.modelID : null,
        providerID: typeof info.providerID === "string" ? info.providerID : null,
        summary: info.summary === true,
        text: messageText(message),
      });
    }
    for (const part of parts) {
      if (part == null || typeof part !== "object") continue;
      const value = part as Record<string, unknown>;
      const state = value.state != null && typeof value.state === "object" ? value.state as Record<string, unknown> : {};
      if (value.type === "tool" && typeof value.tool === "string") {
        toolCalls.push({ name: value.tool, status: typeof state.status === "string" ? state.status : null });
      }
    }
  }
  return { assistant, toolCalls };
}

async function requestWithTimeout<T>(
  create: (signal: AbortSignal) => Promise<unknown>,
  label: string,
  timeoutMs: number,
): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await requestData<T>(create(controller.signal), label);
  } finally {
    clearTimeout(timer);
  }
}

export async function runSummarizedProofSession(input: {
  client: OpencodeClient;
  compactionRoute: ProofRoute;
  directory: string;
  mainPrompt: string;
  mainRoute: ProofRoute;
  reconstructionPrompt: string;
  timeoutMs?: number;
  title: string;
  tools: Record<string, boolean>;
}): Promise<SummarizedProofEvidence> {
  const timeoutMs = input.timeoutMs ?? 240_000;
  const evidence: SummarizedProofEvidence = {
    cleanup: { error: null, sessionsRemoved: false },
    compactionContext: "",
    error: null,
    mainResponse: "",
    messages: { assistant: [], toolCalls: [] },
    providerRequestCount: 0,
    reconstructionResponse: "",
    sessionID: null,
    summarizeAccepted: false,
  };
  let stage: NonNullable<SummarizedProofEvidence["error"]>["stage"] = "create";
  try {
    const session = await requestWithTimeout<Session>(
      (signal) => input.client.session.create({ directory: input.directory, title: input.title }, { signal }),
      "status-scope session create",
      timeoutMs,
    );
    evidence.sessionID = session.id;
    stage = "main";
    evidence.providerRequestCount += 1;
    const main = await requestWithTimeout<Record<string, unknown>>(
      (signal) => input.client.session.prompt({
        agent: input.mainRoute.agent,
        directory: input.directory,
        parts: [{ type: "text", text: input.mainPrompt }],
        sessionID: session.id,
        tools: input.tools,
      }, { signal }),
      "status-scope main response",
      timeoutMs,
    );
    evidence.mainResponse = messageText(main);
    stage = "summarize";
    evidence.providerRequestCount += 1;
    evidence.summarizeAccepted = await requestWithTimeout<boolean>(
      (signal) => input.client.session.summarize({
        auto: false,
        directory: input.directory,
        modelID: input.compactionRoute.model.modelID,
        providerID: input.compactionRoute.model.providerID,
        sessionID: session.id,
      }, { signal }),
      "status-scope compaction",
      timeoutMs,
    );
    stage = "summary-readback";
    const compacted = await requestWithTimeout<unknown[]>(
      (signal) => input.client.session.messages({ directory: input.directory, limit: 100, sessionID: session.id }, { signal }),
      "status-scope compaction messages",
      timeoutMs,
    );
    evidence.messages = messageProjection(compacted);
    evidence.compactionContext = evidence.messages.assistant.filter((message) => message.summary).at(-1)?.text ?? "";
    if (!evidence.summarizeAccepted || evidence.compactionContext.trim() === "") throw new Error("Compaction summary was not retained by the session");
    stage = "reconstruction";
    evidence.providerRequestCount += 1;
    const reconstruction = await requestWithTimeout<Record<string, unknown>>(
      (signal) => input.client.session.prompt({
        agent: input.mainRoute.agent,
        directory: input.directory,
        parts: [{ type: "text", text: input.reconstructionPrompt }],
        sessionID: session.id,
        tools: input.tools,
      }, { signal }),
      "status-scope reconstruction",
      timeoutMs,
    );
    evidence.reconstructionResponse = messageText(reconstruction);
    stage = "final-readback";
    const finalMessages = await requestWithTimeout<unknown[]>(
      (signal) => input.client.session.messages({ directory: input.directory, limit: 100, sessionID: session.id }, { signal }),
      "status-scope final messages",
      timeoutMs,
    );
    evidence.messages = messageProjection(finalMessages);
  } catch (error) {
    evidence.error = { facts: proofErrorFacts(error), stage };
    if (evidence.sessionID != null) {
      try {
        await input.client.session.abort({ directory: input.directory, sessionID: evidence.sessionID });
      } catch {
        // The server shutdown remains the terminal fallback for a failed request.
      }
    }
  } finally {
    if (evidence.sessionID != null) {
      try {
        const response = await input.client.session.delete({ directory: input.directory, sessionID: evidence.sessionID }) as { error?: unknown };
        if (response.error != null) throw response.error;
        evidence.cleanup.sessionsRemoved = true;
      } catch (error) {
        evidence.cleanup.error = proofErrorFacts(error);
      }
    } else {
      evidence.cleanup.sessionsRemoved = true;
    }
  }
  return evidence;
}

export async function runDiagnosticProofSession(input: {
  client: OpencodeClient;
  directory: string;
  prompt: string;
  route: ProofRoute;
  timeoutMs?: number;
  title: string;
}): Promise<DiagnosticProofEvidence> {
  const timeoutMs = input.timeoutMs ?? 180_000;
  const evidence: DiagnosticProofEvidence = {
    cleanup: { error: null, sessionsRemoved: false },
    errors: [],
    messages: { assistant: [], toolCalls: [] },
    providerRequestCount: 0,
    response: "",
    sessionID: null,
  };
  let stage: DiagnosticProofEvidence["errors"][number]["stage"] = "create";
  try {
    const session = await requestWithTimeout<Session>(
      (signal) => input.client.session.create({ directory: input.directory, title: input.title }, { signal }),
      "diagnostic session create",
      timeoutMs,
    );
    evidence.sessionID = session.id;
    stage = "prompt";
    evidence.providerRequestCount = 1;
    const response = await requestWithTimeout<Record<string, unknown>>(
      (signal) => input.client.session.prompt({
        agent: input.route.agent,
        directory: input.directory,
        parts: [{ type: "text", text: input.prompt }],
        sessionID: session.id,
      }, { signal }),
      "diagnostic prompt",
      timeoutMs,
    );
    evidence.response = messageText(response);
  } catch (error) {
    evidence.errors.push({ facts: proofErrorFacts(error), stage });
    if (stage === "prompt" && evidence.sessionID != null) {
      try {
        await input.client.session.abort({ directory: input.directory, sessionID: evidence.sessionID });
      } catch (abortError) {
        evidence.errors.push({ facts: proofErrorFacts(abortError), stage: "abort" });
      }
    }
  } finally {
    if (evidence.sessionID != null) {
      try {
        const messages = await requestWithTimeout<unknown[]>(
          (signal) => input.client.session.messages({ directory: input.directory, limit: 100, sessionID: evidence.sessionID! }, { signal }),
          "diagnostic message readback",
          timeoutMs,
        );
        evidence.messages = messageProjection(messages);
      } catch (readbackError) {
        evidence.errors.push({ facts: proofErrorFacts(readbackError), stage: "readback" });
      }
      try {
        const response = await input.client.session.delete({ directory: input.directory, sessionID: evidence.sessionID }) as { error?: unknown };
        if (response.error != null) throw response.error;
        evidence.cleanup.sessionsRemoved = true;
      } catch (cleanupError) {
        evidence.cleanup.error = proofErrorFacts(cleanupError);
      }
    } else {
      evidence.cleanup.sessionsRemoved = true;
    }
  }
  return evidence;
}
