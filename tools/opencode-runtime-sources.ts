#!/usr/bin/env node
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

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
  root: string;
  schemaVersion: 1;
  sources: RuntimeSource[];
  warnings: string[];
};

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
  return {
    collisions: collisions(sources),
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
