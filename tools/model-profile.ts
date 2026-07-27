#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync, type SpawnSyncReturns } from "node:child_process";
import { fileURLToPath } from "node:url";

export const MODEL_PROFILE_SCHEMA = "https://opencode.ai/config.json";

export const GOVERNED_BUILTIN_AGENTS = [
  "build",
  "compaction",
  "explore",
  "general",
  "plan",
  "scout",
  "summary",
  "title",
] as const;

const ROOT_PROFILE_FIELDS = new Set(["$schema", "agent", "model", "small_model"]);
const AGENT_PROFILE_FIELDS = new Set(["model", "variant"]);
const PROFILE_ID_PATTERN = /^[a-z0-9](?:[a-z0-9._-]*[a-z0-9])?$/;
const MODEL_ID_PATTERN = /^[a-z0-9][a-z0-9._-]*\/[a-z0-9][a-z0-9._:/-]*$/i;
const VARIANT_PATTERN = /^[a-z0-9][a-z0-9._-]*$/i;

export type ModelRoute = {
  model: string;
  variant: string;
};

export type ModelProfile = {
  $schema: string;
  model: string;
  small_model: string;
  agent: Record<string, ModelRoute>;
};

export type ProfileSourceKind = "committed" | "local";

export type LoadedModelProfile = {
  id: string;
  selection: string;
  sourceKind: ProfileSourceKind;
  filePath: string;
  profile: ModelProfile;
};

export type LauncherMode = "launch" | "check" | "explain";

export type LauncherArguments = {
  selection: string;
  mode: LauncherMode;
  openCodeArgs: string[];
};

export function repositoryRoot(): string {
  return path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
}

export function discoverGovernedAgentNames(root: string): string[] {
  const agentsDir = path.join(root, "global", "agents");
  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(agentsDir, { withFileTypes: true });
  } catch {
    throw new Error("Model profile agent catalog is unavailable: global/agents");
  }
  const markdownAgents = entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".md"))
    .map((entry) => path.basename(entry.name, ".md"));
  return [...new Set([...GOVERNED_BUILTIN_AGENTS, ...markdownAgents])]
    .sort((left, right) => left.localeCompare(right));
}

export function parseModelProfileText(
  text: string,
  governedAgents: string[],
  label = "selected",
): ModelProfile {
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch {
    throw new Error(`Model profile '${label}' contains invalid JSON`);
  }
  return validateModelProfile(value, governedAgents, label);
}

export function validateModelProfile(
  value: unknown,
  governedAgents: string[],
  label = "selected",
): ModelProfile {
  if (!isPlainRecord(value)) {
    throw new Error(`Model profile '${label}' must contain a JSON object`);
  }
  rejectUnsupportedFields(value, ROOT_PROFILE_FIELDS, `Model profile '${label}'`);
  if (value.$schema !== MODEL_PROFILE_SCHEMA) {
    throw new Error(`Model profile '${label}' must set $schema to ${MODEL_PROFILE_SCHEMA}`);
  }
  const model = requireModelId(value.model, label, "model");
  const smallModel = requireModelId(value.small_model, label, "small_model");
  if (!isPlainRecord(value.agent)) {
    throw new Error(`Model profile '${label}' field 'agent' must be an object`);
  }

  const routes: Record<string, ModelRoute> = {};
  for (const agentName of Object.keys(value.agent).sort((left, right) => left.localeCompare(right))) {
    const route = value.agent[agentName];
    if (!isPlainRecord(route)) {
      throw new Error(`Model profile '${label}' agent '${agentName}' must be an object`);
    }
    rejectUnsupportedFields(route, AGENT_PROFILE_FIELDS, `Model profile '${label}' agent '${agentName}'`);
    routes[agentName] = {
      model: requireModelId(route.model, label, `agent.${agentName}.model`),
      variant: requireVariant(route.variant, label, `agent.${agentName}.variant`),
    };
  }

  const expected = [...new Set(governedAgents)].sort((left, right) => left.localeCompare(right));
  const actual = Object.keys(routes).sort((left, right) => left.localeCompare(right));
  const missing = expected.filter((name) => !actual.includes(name));
  const extra = actual.filter((name) => !expected.includes(name));
  if (missing.length > 0 || extra.length > 0) {
    throw new Error(
      `Model profile '${label}' agent matrix is incomplete. Missing: ${missing.join(", ") || "none"}. Extra: ${extra.join(", ") || "none"}.`,
    );
  }

  return {
    $schema: MODEL_PROFILE_SCHEMA,
    model,
    small_model: smallModel,
    agent: routes,
  };
}

export function parseProfileSelection(selection: string): {
  id: string;
  sourceKind: ProfileSourceKind;
} {
  if (selection.length === 0 || selection !== selection.trim()) {
    throw new Error("Model profile selection must be a non-empty identifier");
  }
  const sourceKind: ProfileSourceKind = selection.startsWith("local:") ? "local" : "committed";
  const id = sourceKind === "local" ? selection.slice("local:".length) : selection;
  if (!PROFILE_ID_PATTERN.test(id) || id.includes("..")) {
    throw new Error(`Invalid model profile selection '${selection}'`);
  }
  return { id, sourceKind };
}

export function resolveProfilePath(root: string, selection: string): {
  id: string;
  sourceKind: ProfileSourceKind;
  filePath: string;
} {
  const { id, sourceKind } = parseProfileSelection(selection);
  const committedRoot = path.resolve(root, "global", "model-profiles");
  const profileRoot = sourceKind === "local" ? path.join(committedRoot, "local") : committedRoot;
  const candidate = path.resolve(profileRoot, `${id}.json`);
  if (!isPathInside(profileRoot, candidate)) {
    throw new Error(`Invalid model profile selection '${selection}'`);
  }

  let stat: fs.Stats;
  try {
    stat = fs.lstatSync(candidate);
  } catch {
    throw new Error(`Model profile '${selection}' was not found`);
  }
  if (!stat.isFile()) {
    throw new Error(`Model profile '${selection}' must resolve to a regular file`);
  }

  let realRoot: string;
  let realCandidate: string;
  try {
    realRoot = fs.realpathSync(profileRoot);
    realCandidate = fs.realpathSync(candidate);
  } catch {
    throw new Error(`Model profile '${selection}' could not be resolved safely`);
  }
  if (!isPathInside(realRoot, realCandidate)) {
    throw new Error(`Model profile '${selection}' resolves outside its profile namespace`);
  }
  return { id, sourceKind, filePath: realCandidate };
}

export function loadModelProfile(root: string, selection: string): LoadedModelProfile {
  const resolved = resolveProfilePath(root, selection);
  let text: string;
  try {
    text = fs.readFileSync(resolved.filePath, "utf8");
  } catch {
    throw new Error(`Model profile '${selection}' could not be read`);
  }
  return {
    ...resolved,
    selection,
    profile: parseModelProfileText(text, discoverGovernedAgentNames(root), selection),
  };
}

export function renderProfileExplanation(loaded: LoadedModelProfile): string {
  const lines = [
    `Profile: ${loaded.selection}`,
    `Source: ${loaded.sourceKind}`,
    `Path: ${loaded.filePath}`,
    `Model: ${loaded.profile.model}`,
    `Small model: ${loaded.profile.small_model}`,
    "Agents:",
  ];
  for (const agentName of Object.keys(loaded.profile.agent).sort((left, right) => left.localeCompare(right))) {
    const route = loaded.profile.agent[agentName];
    lines.push(`- ${agentName}: ${route.model} (${route.variant})`);
  }
  return lines.join("\n");
}

export function parseLauncherArguments(args: string[]): LauncherArguments {
  const selection = args[0];
  if (selection == null || selection.startsWith("--")) {
    throw new Error("Usage: npm run opencode:profile -- <id|local:id> [--check|--explain] [-- <opencode args>]");
  }

  let mode: LauncherMode = "launch";
  let modeFlag: string | undefined;
  let passthrough = false;
  const openCodeArgs: string[] = [];
  for (const arg of args.slice(1)) {
    if (!passthrough && arg === "--") {
      passthrough = true;
      continue;
    }
    if (!passthrough && (arg === "--check" || arg === "--explain")) {
      if (modeFlag != null) {
        throw new Error(`Model profile mode flags are ambiguous: ${modeFlag}, ${arg}`);
      }
      modeFlag = arg;
      mode = arg === "--check" ? "check" : "explain";
      continue;
    }
    openCodeArgs.push(arg);
  }
  if (mode !== "launch" && openCodeArgs.length > 0) {
    throw new Error(`${modeFlag} does not accept OpenCode arguments`);
  }
  return { selection, mode, openCodeArgs };
}

export function assertNoInheritedInlineConfig(environment: NodeJS.ProcessEnv): void {
  if ((environment.OPENCODE_CONFIG_CONTENT ?? "").trim().length > 0) {
    throw new Error(
      "Model profile launch refused because OPENCODE_CONFIG_CONTENT is already set; its value was not read or printed",
    );
  }
}

export function buildProfileChildEnvironment(
  baseEnvironment: NodeJS.ProcessEnv,
  loaded: LoadedModelProfile,
): NodeJS.ProcessEnv {
  assertNoInheritedInlineConfig(baseEnvironment);
  return {
    ...baseEnvironment,
    OPENCODE_CONFIG_CONTENT: JSON.stringify(loaded.profile),
  };
}

export function findExplicitPrimaryModel(args: string[]): string | undefined {
  const values: string[] = [];
  for (let index = 0; index < args.length; index++) {
    const arg = args[index];
    if (arg === "--model" || arg === "-m") {
      const value = args[index + 1];
      if (value == null || value.length === 0 || value.startsWith("-")) {
        throw new Error(`Explicit ${arg} requires a model identifier`);
      }
      values.push(value);
      index++;
    } else if (arg.startsWith("--model=")) {
      const value = arg.slice("--model=".length);
      if (value.length === 0) {
        throw new Error("Explicit --model requires a model identifier");
      }
      values.push(value);
    }
  }
  if (values.length > 1) {
    throw new Error("Multiple explicit OpenCode model arguments are ambiguous");
  }
  return values[0];
}

export function launchOpenCode(
  args: string[],
  environment: NodeJS.ProcessEnv,
  spawn: (
    command: string,
    args: readonly string[],
    options: { env: NodeJS.ProcessEnv; stdio: "inherit" },
  ) => SpawnSyncReturns<Buffer> = spawnSync,
): number {
  const result = spawn("opencode", args, { env: environment, stdio: "inherit" });
  if (result.error != null) {
    throw new Error(`Failed to start OpenCode: ${result.error.message}`);
  }
  if (result.signal != null) {
    throw new Error(`OpenCode terminated by signal ${result.signal}`);
  }
  return result.status ?? 1;
}

export function runModelProfileCli(
  args: string[],
  environment: NodeJS.ProcessEnv = process.env,
  root = repositoryRoot(),
): number {
  const options = parseLauncherArguments(args);
  assertNoInheritedInlineConfig(environment);
  const loaded = loadModelProfile(root, options.selection);

  if (options.mode === "explain") {
    console.log(renderProfileExplanation(loaded));
    return 0;
  }
  if (options.mode === "check") {
    console.log(
      `OK: model profile=${loaded.selection} source=${loaded.sourceKind} agents=${Object.keys(loaded.profile.agent).length}`,
    );
    return 0;
  }

  const explicitModel = findExplicitPrimaryModel(options.openCodeArgs);
  if (explicitModel != null && explicitModel !== loaded.profile.model) {
    console.warn(
      `INFO: model profile primary deviation profile=${loaded.selection} profileModel=${loaded.profile.model} explicitModel=${explicitModel}`,
    );
  }
  console.log(
    `Using model profile=${loaded.selection} source=${loaded.sourceKind} model=${loaded.profile.model}`,
  );
  return launchOpenCode(
    options.openCodeArgs,
    buildProfileChildEnvironment(environment, loaded),
  );
}

function requireModelId(value: unknown, label: string, field: string): string {
  if (typeof value !== "string" || !MODEL_ID_PATTERN.test(value)) {
    throw new Error(`Model profile '${label}' field '${field}' must be a provider/model identifier`);
  }
  return value;
}

function requireVariant(value: unknown, label: string, field: string): string {
  if (typeof value !== "string" || !VARIANT_PATTERN.test(value)) {
    throw new Error(`Model profile '${label}' field '${field}' must be a non-empty variant identifier`);
  }
  return value;
}

function rejectUnsupportedFields(
  value: Record<string, unknown>,
  allowed: ReadonlySet<string>,
  label: string,
): void {
  const unsupported = Object.keys(value)
    .filter((key) => !allowed.has(key))
    .sort((left, right) => left.localeCompare(right));
  if (unsupported.length > 0) {
    throw new Error(`${label} contains unsupported field '${unsupported[0]}'`);
  }
}

function isPathInside(root: string, candidate: string): boolean {
  const relative = path.relative(path.resolve(root), path.resolve(candidate));
  return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isDirectExecution(): boolean {
  const entry = process.argv[1];
  if (entry == null) return false;
  const current = path.resolve(fileURLToPath(import.meta.url));
  const invoked = path.resolve(entry);
  return process.platform === "win32"
    ? current.toLowerCase() === invoked.toLowerCase()
    : current === invoked;
}

if (isDirectExecution()) {
  try {
    process.exitCode = runModelProfileCli(process.argv.slice(2));
  } catch (error) {
    console.error(`ERROR: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  }
}
