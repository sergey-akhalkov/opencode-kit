import { readFileSync, statSync } from "node:fs";
import type { Config, Plugin, PluginInput } from "@opencode-ai/plugin";

const GRAPHIFY_MCP_NAME = "graphify-global";
const GRAPHIFY_MANIFEST_PATH = String.raw`C:\ProgramData\OpenCodeWorkstation\manifest.json`;
const GRAPHIFY_REMOTE_URL = "http://127.0.0.1:4097/mcp";
const GRAPHIFY_MODULE = "graphify.serve";
const GRAPHIFY_CREDENTIAL_ENV = "OPENCODE_GRAPHIFY_API_KEY";
const GRAPHIFY_ENVIRONMENT = {
  PYTHONUNBUFFERED: "1",
  PYTHONIOENCODING: "utf-8",
  PYTHONUTF8: "1",
};

const GRAPHIFY_REPOSITORY_TOOLS = new Set([
  "graphify-global_list_prs",
  "graphify-global_get_pr_impact",
  "graphify-global_triage_prs",
]);

type GraphifyRuntime = {
  credential: string | undefined;
  manifestPath: string;
  platform: NodeJS.Platform;
};

function object(value: unknown, label: string): Record<string, unknown> {
  if (value == null || typeof value !== "object" || Array.isArray(value)) throw new Error(`${label} must be an object.`);
  return value as Record<string, unknown>;
}

function exactKeys(value: Record<string, unknown>, keys: string[], label: string): void {
  const actual = Object.keys(value).sort();
  const expected = [...keys].sort();
  if (actual.length !== expected.length || actual.some((key, index) => key !== expected[index])) {
    throw new Error(`${label} does not match the managed contract.`);
  }
}

function nonEmptyString(value: unknown, label: string): string {
  if (typeof value !== "string" || value.trim() === "") throw new Error(`${label} must be a non-empty string.`);
  return value;
}

function assertFile(filePath: string, extension: string, label: string): void {
  if (!filePath.toLowerCase().endsWith(extension) || !statSync(filePath).isFile()) {
    throw new Error(`${label} must reference an existing ${extension} file.`);
  }
}

function managedRemoteEntry(config: Config, credential: string | undefined): { mcp: Record<string, unknown>; timeout: number } {
  const mcp = object(config.mcp, "OpenCode MCP configuration");
  const entry = object(mcp[GRAPHIFY_MCP_NAME], "graphify-global entry");
  exactKeys(entry, ["type", "url", "enabled", "timeout", "oauth", "headers"], "graphify-global entry");
  const headers = object(entry.headers, "graphify-global headers");
  exactKeys(headers, ["Authorization"], "graphify-global headers");
  if (
    entry.type !== "remote"
    || entry.url !== GRAPHIFY_REMOTE_URL
    || entry.enabled !== true
    || entry.oauth !== false
    || headers.Authorization !== `Bearer ${credential ?? ""}`
    || !Number.isInteger(entry.timeout)
    || Number(entry.timeout) <= 0
  ) {
    throw new Error("graphify-global entry does not match the resolved managed remote contract.");
  }
  return { mcp, timeout: Number(entry.timeout) };
}

function localGraphifyCommand(manifestPath: string): string[] {
  let manifest: Record<string, unknown>;
  try {
    manifest = object(JSON.parse(readFileSync(manifestPath, "utf8")), "Workstation manifest");
  } catch (cause) {
    throw new Error(`Workstation manifest could not be read at '${manifestPath}'.`, { cause });
  }
  if (manifest.schemaVersion !== 1 && manifest.schemaVersion !== 2) {
    throw new Error(`Unsupported Workstation manifest schema '${String(manifest.schemaVersion)}'.`);
  }
  const graphify = object(manifest.graphify, "Workstation manifest graphify");
  const configuration = object(graphify.configuration, "Workstation manifest graphify configuration");
  const python = object(configuration.python, "Workstation manifest Graphify Python");
  const module = object(configuration.module, "Workstation manifest Graphify module");
  const graph = object(configuration.graph, "Workstation manifest Graphify graph");
  const pythonPath = nonEmptyString(python.path, "Workstation manifest Graphify Python path");
  const graphPath = nonEmptyString(graph.path, "Workstation manifest Graphify graph path");
  if (module.name !== GRAPHIFY_MODULE || graphify.endpoint !== GRAPHIFY_REMOTE_URL) {
    throw new Error("Workstation manifest Graphify identity does not match the managed contract.");
  }
  assertFile(pythonPath, ".exe", "Workstation manifest Graphify Python path");
  assertFile(graphPath, ".json", "Workstation manifest Graphify graph path");
  return [pythonPath, "-u", "-m", GRAPHIFY_MODULE, "--graph", graphPath];
}

function graphifyFailure(error: unknown): Record<string, unknown> {
  if (!(error instanceof Error)) return { name: "UnknownError" };
  const cause = error.cause instanceof Error
    ? { name: error.cause.name, message: error.cause.message, stack: error.cause.stack }
    : undefined;
  return { name: error.name, message: error.message, stack: error.stack, cause };
}

function configureGraphify(config: Config, runtime: GraphifyRuntime): void {
  if (runtime.platform !== "win32" || runtime.credential?.trim()) return;
  const { mcp, timeout } = managedRemoteEntry(config, runtime.credential);
  const command = localGraphifyCommand(runtime.manifestPath);
  mcp[GRAPHIFY_MCP_NAME] = {
    type: "local",
    command,
    cwd: ".",
    enabled: true,
    timeout,
    environment: { ...GRAPHIFY_ENVIRONMENT },
  };
}

export function requireExplicitGraphifyRepository(tool: string, args: Record<string, unknown>): void {
  if (!GRAPHIFY_REPOSITORY_TOOLS.has(tool)) return;
  if (typeof args.repo === "string" && args.repo.trim() !== "") return;
  throw new Error(`${tool} requires an explicit non-empty 'repo' argument because graphify-global is shared across projects.`);
}

export function createGraphifyProjectContextHooks(
  input: Pick<PluginInput, "client">,
  runtime: GraphifyRuntime = {
    credential: process.env[GRAPHIFY_CREDENTIAL_ENV],
    manifestPath: GRAPHIFY_MANIFEST_PATH,
    platform: process.platform,
  },
) {
  return {
    config: async (config: Config) => {
      try {
        configureGraphify(config, runtime);
      } catch (error) {
        try {
          await input.client.app.log({
            body: {
              service: "graphify-project-context",
              level: "warn",
              message: "Graphify direct-terminal fallback was not applied.",
              extra: { error: graphifyFailure(error) },
            },
          });
        } catch {
          // Logging must not turn a fail-closed fallback into a startup failure.
        }
      }
    },
    "tool.execute.before": async (hookInput: { tool: string }, output: { args: Record<string, unknown> }) => {
      requireExplicitGraphifyRepository(hookInput.tool, output.args);
    },
  };
}

export default {
  id: "opencode-dev-kit.graphify-project-context",
  server: async (input) => createGraphifyProjectContextHooks(input),
} satisfies { id: string; server: Plugin };
