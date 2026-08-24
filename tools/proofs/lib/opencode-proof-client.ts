import {
  createOpencodeClient,
  type OpencodeClient,
  type Session,
} from "../../../global/node_modules/@opencode-ai/sdk/dist/v2/client.js";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

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

export const PROOF_SERVER_CONFIG_LOAD_MS = 15_000;
export const PROOF_SERVER_PLUGIN_READY_MS = 60_000;
export const PROOF_SERVER_READINESS_MS = PROOF_SERVER_CONFIG_LOAD_MS + PROOF_SERVER_PLUGIN_READY_MS;

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

export function isolatedProofServerEnvironment(
  baseEnvironment: NodeJS.ProcessEnv,
  configDir: string,
  runtimeRoot: string,
): NodeJS.ProcessEnv {
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
  const environment: NodeJS.ProcessEnv = {
    ...baseEnvironment,
    OPENCODE_CONFIG_DIR: configDir,
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
