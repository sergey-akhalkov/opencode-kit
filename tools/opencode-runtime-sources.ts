#!/usr/bin/env node
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { parse as jsoncParse } from "jsonc-parser";

export type RuntimeSourceKind = "agent" | "command" | "config" | "instruction" | "plugin" | "skill";

export type RuntimeSource = {
  kind: RuntimeSourceKind;
  location: string;
  name: string;
  source: "built-in" | "custom" | "explicit" | "host-default" | "inline" | "project" | "unknown";
};

export type RuntimeSourceCollision = {
  kind: RuntimeSourceKind;
  locations: string[];
  name: string;
};

export type RuntimeSourceReport = {
  collisions: RuntimeSourceCollision[];
  unattended: {
    canonicalWorkflow: Array<Pick<RuntimeSource, "kind" | "location" | "name" | "source">>;
    collisionStatus: "blocked" | "clear";
    guard: {
      capabilityStatus: "passed" | "unknown";
      limits: Record<string, number | null>;
      origin: string | null;
    };
    helpers: Array<{ path: string; sha256: string }>;
  };
  root: string;
  schemaVersion: 1;
  sources: RuntimeSource[];
  warnings: string[];
};

const CANONICAL_SKILLS = new Set(["openspec-apply-change", "openspec-archive-change", "openspec-propose"]);
const CANONICAL_COMMANDS = new Set(["opsx-apply", "opsx-archive", "opsx-propose"]);
const GUARD_LIMITS = [
  "maxCycles",
  "maxRetryAttempts",
  "arbiterPromptTimeoutMs",
  "waitRecheckMs",
  "maxRequestBytes",
  "maxWaitRechecks",
  "retainAuditSessions",
] as const;

type SourceRoot = Pick<RuntimeSource, "source"> & { root: string };

function normalize(value: string): string {
  return value.replaceAll("\\", "/").replace(/\/$/, "");
}

function redactLocation(value: string): string {
  const normalized = normalize(path.resolve(value));
  const home = normalize(os.homedir());
  return normalized === home || normalized.startsWith(`${home}/`)
    ? `<home>${normalized.slice(home.length)}`
    : normalized;
}

function isFile(file: string): boolean {
  try {
    return fs.lstatSync(file).isFile();
  } catch {
    return false;
  }
}

function isDirectory(directory: string): boolean {
  try {
    return fs.lstatSync(directory).isDirectory();
  } catch {
    return false;
  }
}

function addFileSources(
  result: RuntimeSource[],
  sourceRoot: SourceRoot,
  subdirectory: string,
  kind: "agent" | "command" | "plugin",
): void {
  const directory = path.join(sourceRoot.root, subdirectory);
  if (!isDirectory(directory)) {
    return;
  }
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (!entry.isFile()) {
      continue;
    }
    const extension = path.extname(entry.name);
    result.push({
      kind,
      location: redactLocation(path.join(directory, entry.name)),
      name: extension === "" ? entry.name : entry.name.slice(0, -extension.length),
      source: sourceRoot.source,
    });
  }
}

function addSkillSources(result: RuntimeSource[], sourceRoot: SourceRoot, subdirectory: string): void {
  const directory = path.join(sourceRoot.root, subdirectory);
  if (!isDirectory(directory)) {
    return;
  }
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const skillFile = path.join(directory, entry.name, "SKILL.md");
    if (!entry.isDirectory() || !isFile(skillFile)) {
      continue;
    }
    result.push({
      kind: "skill",
      location: redactLocation(skillFile),
      name: entry.name,
      source: sourceRoot.source,
    });
  }
}

function addRootSources(result: RuntimeSource[], sourceRoot: SourceRoot): void {
  for (const configName of ["opencode.json", "opencode.jsonc"]) {
    const config = path.join(sourceRoot.root, configName);
    if (isFile(config)) {
      result.push({ kind: "config", location: redactLocation(config), name: configName, source: sourceRoot.source });
    }
  }
  for (const instructionName of ["AGENTS.md", "opencode.local.instructions.md"]) {
    const instruction = path.join(sourceRoot.root, instructionName);
    if (isFile(instruction)) {
      result.push({ kind: "instruction", location: redactLocation(instruction), name: instructionName, source: sourceRoot.source });
    }
  }
  addFileSources(result, sourceRoot, "agent", "agent");
  addFileSources(result, sourceRoot, "agents", "agent");
  addFileSources(result, sourceRoot, "command", "command");
  addFileSources(result, sourceRoot, "commands", "command");
  addFileSources(result, sourceRoot, "plugin", "plugin");
  addFileSources(result, sourceRoot, "plugins", "plugin");
  addSkillSources(result, sourceRoot, "skill");
  addSkillSources(result, sourceRoot, "skills");
}

function addProjectSources(result: RuntimeSource[], root: string): void {
  const projectRoot: SourceRoot = { root, source: "project" };
  for (const configName of ["opencode.json", "opencode.jsonc"]) {
    const config = path.join(root, configName);
    if (isFile(config)) {
      result.push({ kind: "config", location: redactLocation(config), name: configName, source: "project" });
    }
  }
  const instruction = path.join(root, "AGENTS.md");
  if (isFile(instruction)) {
    result.push({ kind: "instruction", location: redactLocation(instruction), name: "AGENTS.md", source: "project" });
  }
  addRootSources(result, { ...projectRoot, root: path.join(root, ".opencode") });
}

function sourceRoots(root: string): SourceRoot[] {
  const roots: SourceRoot[] = [
    { root: path.join(os.homedir(), ".config", "opencode"), source: "host-default" },
  ];
  const custom = process.env.OPENCODE_CONFIG_DIR?.trim();
  if (custom) {
    roots.push({ root: path.resolve(custom), source: "custom" });
  }
  return roots.filter(
    (candidate, index, items) =>
      items.findIndex((item) => normalize(path.resolve(item.root)).toLowerCase() === normalize(path.resolve(candidate.root)).toLowerCase()) === index,
  );
}

function addEnvironmentSources(result: RuntimeSource[]): void {
  const explicit = process.env.OPENCODE_CONFIG?.trim();
  if (explicit) {
    result.push({ kind: "config", location: redactLocation(explicit), name: "OPENCODE_CONFIG", source: "explicit" });
  }
  if (process.env.OPENCODE_CONFIG_CONTENT?.trim()) {
    result.push({ kind: "config", location: "<inline>", name: "OPENCODE_CONFIG_CONTENT", source: "inline" });
  }
}

function collisions(sources: RuntimeSource[]): RuntimeSourceCollision[] {
  const grouped = new Map<string, RuntimeSource[]>();
  for (const source of sources) {
    const key = source.kind === "config" ? "config:<resolved-config>" : `${source.kind}:${source.name.toLowerCase()}`;
    grouped.set(key, [...(grouped.get(key) ?? []), source]);
  }
  return [...grouped.values()]
    .filter((items) => new Set(items.map((item) => item.source)).size > 1)
    .map((items) => ({
      kind: items[0].kind,
      locations: items.map((item) => item.location).sort(),
      name: items[0].kind === "config" ? "OpenCode config" : items[0].name,
    }))
    .sort((left, right) => left.kind.localeCompare(right.kind) || left.name.localeCompare(right.name));
}

function activeGlobalRoot(): string {
  const custom = process.env.OPENCODE_CONFIG_DIR?.trim();
  return custom ? path.resolve(custom) : path.join(os.homedir(), ".config", "opencode");
}

function guardDiagnostics(globalRoot: string): RuntimeSourceReport["unattended"]["guard"] {
  const config = path.join(globalRoot, "opencode.json");
  const empty = Object.fromEntries(GUARD_LIMITS.map((name) => [name, null]));
  if (!isFile(config)) return { capabilityStatus: "unknown", limits: empty, origin: null };
  try {
    const errors: jsoncParse.ParseError[] = [];
    const parsed = jsoncParse(fs.readFileSync(config, "utf8"), errors, {
      allowTrailingComma: true,
      disallowComments: false,
    }) as Record<string, unknown> | null;
    if (errors.length > 0 || parsed == null || Array.isArray(parsed)) {
      return { capabilityStatus: "unknown", limits: empty, origin: null };
    }
    const tuple = (Array.isArray(parsed.plugin) ? parsed.plugin : []).find((plugin) =>
      Array.isArray(plugin) && typeof plugin[0] === "string" && plugin[0].includes("session-completion-guard")
    );
    if (!Array.isArray(tuple) || typeof tuple[1] !== "object" || tuple[1] == null || Array.isArray(tuple[1])) {
      return { capabilityStatus: "unknown", limits: empty, origin: null };
    }
    const options = tuple[1] as Record<string, unknown>;
    return {
      capabilityStatus: "unknown",
      limits: Object.fromEntries(GUARD_LIMITS.map((name) => [name, typeof options[name] === "number" ? options[name] : null])),
      origin: typeof tuple[0] === "string" && tuple[0].startsWith("file:")
        ? redactLocation(fileURLToPath(tuple[0]))
        : typeof tuple[0] === "string" ? tuple[0] : null,
    };
  } catch {
    return { capabilityStatus: "unknown", limits: empty, origin: null };
  }
}

export function inspectRuntimeSources(root: string): RuntimeSourceReport {
  const sources: RuntimeSource[] = [];
  addProjectSources(sources, root);
  for (const sourceRoot of sourceRoots(root)) {
    addRootSources(sources, sourceRoot);
  }
  addEnvironmentSources(sources);
  sources.sort(
    (left, right) =>
      left.kind.localeCompare(right.kind) ||
      left.name.localeCompare(right.name) ||
      left.location.localeCompare(right.location),
  );
  const sourceCollisions = collisions(sources);
  const canonicalWorkflow = sources.filter((source) =>
    (source.kind === "skill" && CANONICAL_SKILLS.has(source.name)) ||
    (source.kind === "command" && CANONICAL_COMMANDS.has(source.name))
  );
  const globalRoot = activeGlobalRoot();
  return {
    collisions: sourceCollisions,
    unattended: {
      canonicalWorkflow,
      collisionStatus: sourceCollisions.some((collision) =>
        (collision.kind === "skill" && CANONICAL_SKILLS.has(collision.name)) ||
        (collision.kind === "command" && CANONICAL_COMMANDS.has(collision.name))
      ) ? "blocked" : "clear",
      guard: guardDiagnostics(globalRoot),
      helpers: [
        "bin/openspec-operation-gate.ts",
        "bin/openspec-archive.ts",
        "bin/roadmap-mission.ts",
      ].filter((relative) => isFile(path.join(globalRoot, relative))).map((relative) => ({
        path: relative,
        sha256: crypto.createHash("sha256").update(fs.readFileSync(path.join(globalRoot, relative))).digest("hex"),
      })),
    },
    root: redactLocation(root),
    schemaVersion: 1,
    sources,
    warnings: [
      "Source presence does not prove precedence or that every source was loaded by a running process.",
      "Config-declared instruction globs are not expanded because resolved config may contain secrets; configured paths not represented by conventional locations require an isolated privacy-safe workflow.",
    ],
  };
}

function parseRoot(args: string[]): string {
  const index = args.indexOf("--root");
  if (index === -1) {
    return path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  }
  const value = args[index + 1];
  if (!value || value.startsWith("--")) {
    throw new Error("Missing value for --root.");
  }
  return path.resolve(value);
}

function isMainModule(): boolean {
  const entrypoint = process.argv[1];
  return Boolean(entrypoint && import.meta.url === pathToFileURL(path.resolve(entrypoint)).href);
}

if (isMainModule()) {
  try {
    console.log(JSON.stringify(inspectRuntimeSources(parseRoot(process.argv.slice(2))), null, 2));
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
