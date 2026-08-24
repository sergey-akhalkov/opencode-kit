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

export type ManagedPromptDrift = {
  active: { markers: string[]; sha256: string } | null;
  field: "agent.compaction.prompt";
  reason: "active-missing" | "active-unreadable" | "content-differs" | "content-matches" | "template-unreadable";
  restartBoundary: "none" | "resolve-source-before-sync" | "synchronize-active-copy-and-restart";
  status: "different" | "missing" | "same" | "unknown";
  template: { markers: string[]; sha256: string } | null;
};

export type RuntimeSourceReport = {
  collisions: RuntimeSourceCollision[];
  managedPrompts: ManagedPromptDrift[];
  unattended: {
    canonicalWorkflow: Array<Pick<RuntimeSource, "kind" | "location" | "name" | "source">>;
    collisionStatus: "blocked" | "clear";
    guard: {
      capabilityStatus: "passed" | "unknown";
      limits: Record<string, number | null>;
      origin: string | null;
    };
    helpers: Array<{ path: string; sha256: string }>;
    helperResolution: RuntimeGlobalHelperResolution[];
  };
  root: string;
  schemaVersion: 2;
  sources: RuntimeSource[];
  warnings: string[];
};

export type RuntimeGlobalHelperResolution = {
  attempts: Array<{
    exists: boolean;
    helper: string;
    source: "custom" | "host-default";
  }>;
  collisionStatus: RuntimeSourceReport["unattended"]["collisionStatus"];
  relativePath: string;
  selected: { helper: string; source: "custom" | "host-default" } | null;
  status: "blocked" | "missing" | "resolved";
};

export type RuntimeSourceInventory = Pick<RuntimeSourceReport, "collisions" | "sources"> & {
  canonicalWorkflow: RuntimeSourceReport["unattended"]["canonicalWorkflow"];
  collisionStatus: RuntimeSourceReport["unattended"]["collisionStatus"];
};

export type InstructionEvidenceClass = "config-declared" | "conventional" | "runtime-observed" | "unknown";

export type LoaderVisibleInstructionSource = {
  category: "on-demand-body" | "startup-visible-candidate";
  evidenceClass: InstructionEvidenceClass;
  file: string | null;
  identity: string;
  kind: "agent" | "command" | "instruction" | "skill";
  reason: string | null;
  source: RuntimeSource["source"];
};

export type LoaderVisibleInstructionManifest = {
  project: string;
  sources: LoaderVisibleInstructionSource[];
};

const CANONICAL_SKILLS = new Set(["openspec-apply-change", "openspec-archive-change", "openspec-propose"]);
const CANONICAL_COMMANDS = new Set(["opsx-apply", "opsx-archive", "opsx-propose"]);
const GUARD_LIMITS = [
  "maxCycles",
  "maxRetryAttempts",
  "arbiterPromptTimeoutMs",
  "certificateWaitMs",
  "waitRecheckMs",
  "maxRequestBytes",
  "maxWaitRechecks",
  "retainAuditSessions",
] as const;
const COMPACTION_PROMPT_MARKERS = [
  ["live-attempt-gate", "Live-Attempt Gate"],
  ["next-session-action", "Next-Session Action"],
  ["original-user-goal", "Original User Goal"],
  ["pending-strategy-history", "Pending Strategy History"],
  ["session-reflection", "Session Reflection"],
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
  for (const instructionName of ["AGENTS.md", "principles-of-work.md", "opencode.local.instructions.md"]) {
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

function projectSearchRoots(root: string): string[] {
  const selected = path.resolve(root);
  const roots = [selected];
  let current = selected;
  for (let depth = 0; depth < 31; depth++) {
    if (isDirectory(path.join(current, ".git")) || isFile(path.join(current, ".git"))) {
      return roots;
    }
    const parent = path.dirname(current);
    if (parent === current) {
      return [selected];
    }
    roots.push(parent);
    current = parent;
  }
  return [selected];
}

function safeManifestIdentity(scope: string, kind: LoaderVisibleInstructionSource["kind"], ordinal: number): string {
  return `<${scope}:${kind}:${ordinal}>`;
}

function addManifestFile(
  result: LoaderVisibleInstructionSource[],
  file: string,
  identity: string,
  source: RuntimeSource["source"],
  evidenceClass: InstructionEvidenceClass,
  kind: LoaderVisibleInstructionSource["kind"],
  category: LoaderVisibleInstructionSource["category"],
): void {
  if (!isFile(file)) return;
  result.push({ category, evidenceClass, file, identity, kind, reason: null, source });
}

function addManifestArtifacts(
  result: LoaderVisibleInstructionSource[],
  root: string,
  scope: string,
  source: RuntimeSource["source"],
  evidenceClass: InstructionEvidenceClass,
): void {
  for (const [kind, directories] of [
    ["agent", ["agent", "agents"]],
    ["command", ["command", "commands"]],
  ] as const) {
    const files = directories.flatMap((subdirectory) => {
      const directory = path.join(root, subdirectory);
      if (!isDirectory(directory)) return [];
      return fs.readdirSync(directory, { withFileTypes: true })
        .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith(".md"))
        .map((entry) => path.join(directory, entry.name));
    }).sort((left, right) => left.localeCompare(right));
    files.forEach((file, index) => addManifestFile(
      result,
      file,
      safeManifestIdentity(scope, kind, index + 1),
      source,
      evidenceClass,
      kind,
      "on-demand-body",
    ));
  }

  const skills = ["skill", "skills"].flatMap((subdirectory) => {
    const directory = path.join(root, subdirectory);
    if (!isDirectory(directory)) return [];
    return fs.readdirSync(directory, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => path.join(directory, entry.name, "SKILL.md"))
      .filter(isFile);
  }).sort((left, right) => left.localeCompare(right));
  skills.forEach((file, index) => addManifestFile(
    result,
    file,
    safeManifestIdentity(scope, "skill", index + 1),
    source,
    evidenceClass,
    "skill",
    "on-demand-body",
  ));
}

type ConfigCandidate = {
  file: string;
  identity: string;
  source: RuntimeSource["source"];
};

function configCandidates(projectRoot: string): ConfigCandidate[] {
  const result: ConfigCandidate[] = [];
  const seen = new Set<string>();
  const add = (file: string, identity: string, source: RuntimeSource["source"]): void => {
    const key = normalize(path.resolve(file)).toLowerCase();
    if (!isFile(file) || seen.has(key)) return;
    seen.add(key);
    result.push({ file, identity, source });
  };

  for (const sourceRoot of sourceRoots(projectRoot)) {
    for (const configName of ["opencode.json", "opencode.jsonc"]) {
      add(path.join(sourceRoot.root, configName), `<global:${sourceRoot.source}:config>`, sourceRoot.source);
    }
  }
  const explicit = process.env.OPENCODE_CONFIG?.trim();
  if (explicit) add(path.resolve(explicit), "<explicit:config>", "explicit");

  projectSearchRoots(projectRoot).forEach((root, index) => {
    const scope = index === 0 ? "project" : `parent:${index}`;
    for (const configName of ["opencode.json", "opencode.jsonc"]) {
      add(path.join(root, configName), `<${scope}:config>`, "project");
      add(path.join(root, ".opencode", configName), `<${scope}:.opencode:config>`, "project");
    }
  });
  return result;
}

function configInstructionSources(candidate: ConfigCandidate): LoaderVisibleInstructionSource[] {
  let parsed: unknown;
  const errors: jsoncParse.ParseError[] = [];
  try {
    parsed = jsoncParse(fs.readFileSync(candidate.file, "utf8"), errors, {
      allowTrailingComma: true,
      disallowComments: false,
    });
  } catch {
    parsed = null;
    errors.push({ error: 0, length: 0, offset: 0 });
  }
  const unknown = (reason: string, index = 0): LoaderVisibleInstructionSource => ({
    category: "startup-visible-candidate",
    evidenceClass: "unknown",
    file: null,
    identity: `${candidate.identity}:instructions:${index}`,
    kind: "instruction",
    reason,
    source: candidate.source,
  });
  if (errors.length > 0 || parsed == null || typeof parsed !== "object" || Array.isArray(parsed)) {
    return [unknown("config-unreadable-or-malformed")];
  }
  const instructions = (parsed as Record<string, unknown>).instructions;
  if (instructions === undefined) return [];
  if (!Array.isArray(instructions)) return [unknown("unsupported-instructions-shape")];

  return instructions.map((entry, index) => {
    const identity = `${candidate.identity}:instructions:${index}`;
    if (typeof entry !== "string" || entry.trim() === "") return unknown("unsupported-instruction-entry", index);
    const value = entry.trim();
    if (/^[a-z][a-z0-9+.-]*:\/\//i.test(value)) return unknown("remote-instruction", index);
    if (/[*?[\]{}]/.test(value)) return unknown("instruction-glob", index);
    if (path.extname(value).toLowerCase() !== ".md") return unknown("unsupported-instruction-extension", index);
    const resolved = path.isAbsolute(value) ? path.resolve(value) : path.resolve(path.dirname(candidate.file), value);
    try {
      const stat = fs.lstatSync(resolved);
      if (!stat.isFile() || stat.isSymbolicLink()) return unknown("instruction-not-readable-file", index);
    } catch {
      return unknown("instruction-not-readable-file", index);
    }
    return {
      category: "startup-visible-candidate",
      evidenceClass: "config-declared",
      file: resolved,
      identity,
      kind: "instruction",
      reason: null,
      source: candidate.source,
    };
  });
}

export function inspectLoaderVisibleInstructionManifest(root: string): LoaderVisibleInstructionManifest {
  const project = path.resolve(root);
  if (!isDirectory(project)) {
    throw new Error("Project is not a directory: <redacted>");
  }
  const result: LoaderVisibleInstructionSource[] = [];

  for (const sourceRoot of sourceRoots(project)) {
    const scope = `global:${sourceRoot.source}`;
    for (const instructionName of ["AGENTS.md", "principles-of-work.md", "opencode.local.instructions.md"]) {
      addManifestFile(
        result,
        path.join(sourceRoot.root, instructionName),
        `<${scope}:${instructionName}>`,
        sourceRoot.source,
        "runtime-observed",
        "instruction",
        "startup-visible-candidate",
      );
    }
    addManifestArtifacts(result, sourceRoot.root, scope, sourceRoot.source, "runtime-observed");
  }

  projectSearchRoots(project).forEach((projectSourceRoot, index) => {
    const scope = index === 0 ? "project" : `parent:${index}`;
    for (const instructionName of ["AGENTS.md", "opencode.local.instructions.md"]) {
      addManifestFile(
        result,
        path.join(projectSourceRoot, instructionName),
        `<${scope}:${instructionName}>`,
        "project",
        "conventional",
        "instruction",
        "startup-visible-candidate",
      );
      addManifestFile(
        result,
        path.join(projectSourceRoot, ".opencode", instructionName),
        `<${scope}:.opencode:${instructionName}>`,
        "project",
        "conventional",
        "instruction",
        "startup-visible-candidate",
      );
    }
    addManifestArtifacts(result, path.join(projectSourceRoot, ".opencode"), `${scope}:.opencode`, "project", "conventional");
  });

  for (const candidate of configCandidates(project)) {
    result.push(...configInstructionSources(candidate));
  }
  if (process.env.OPENCODE_CONFIG_CONTENT?.trim()) {
    result.push({
      category: "startup-visible-candidate",
      evidenceClass: "unknown",
      file: null,
      identity: "<inline-config:instructions>",
      kind: "instruction",
      reason: "inline-config-not-inspected",
      source: "inline",
    });
  }

  const evidenceRank: Record<InstructionEvidenceClass, number> = {
    unknown: 0,
    conventional: 1,
    "runtime-observed": 2,
    "config-declared": 3,
  };
  const measured = new Map<string, LoaderVisibleInstructionSource>();
  const unknown = result.filter((source) => source.file == null);
  for (const source of result.filter((item) => item.file != null)) {
    const key = `${source.category}:${normalize(path.resolve(source.file!)).toLowerCase()}`;
    const current = measured.get(key);
    if (current == null || evidenceRank[source.evidenceClass] > evidenceRank[current.evidenceClass]) {
      measured.set(key, source);
    }
  }
  const sources = [...measured.values(), ...unknown];
  sources.sort(
    (left, right) =>
      left.category.localeCompare(right.category) ||
      left.identity.localeCompare(right.identity) ||
      left.evidenceClass.localeCompare(right.evidenceClass),
  );
  return { project, sources };
}

function activeGlobalRoot(): string {
  const custom = process.env.OPENCODE_CONFIG_DIR?.trim();
  return custom ? path.resolve(custom) : path.join(os.homedir(), ".config", "opencode");
}

type ManagedPromptValue = { kind: "missing" | "unknown" } | { kind: "value"; value: string };

function managedCompactionPrompt(file: string): ManagedPromptValue {
  if (!isFile(file)) return { kind: "missing" };
  try {
    const errors: jsoncParse.ParseError[] = [];
    const parsed = jsoncParse(fs.readFileSync(file, "utf8"), errors, {
      allowTrailingComma: true,
      disallowComments: false,
    });
    if (errors.length > 0 || parsed == null || typeof parsed !== "object" || Array.isArray(parsed)) {
      return { kind: "unknown" };
    }
    const agent = (parsed as Record<string, unknown>).agent;
    if (agent == null || typeof agent !== "object" || Array.isArray(agent)) return { kind: "missing" };
    const compaction = (agent as Record<string, unknown>).compaction;
    if (compaction == null || typeof compaction !== "object" || Array.isArray(compaction)) return { kind: "missing" };
    const prompt = (compaction as Record<string, unknown>).prompt;
    if (prompt === undefined) return { kind: "missing" };
    return typeof prompt === "string" ? { kind: "value", value: prompt } : { kind: "unknown" };
  } catch {
    return { kind: "unknown" };
  }
}

function managedPromptDigest(value: string): NonNullable<ManagedPromptDrift["template"]> {
  return {
    markers: COMPACTION_PROMPT_MARKERS.filter(([, marker]) => value.includes(marker)).map(([id]) => id),
    sha256: crypto.createHash("sha256").update(value, "utf8").digest("hex"),
  };
}

export function inspectManagedPromptDrift(templateFile: string, activeFile: string): ManagedPromptDrift[] {
  const templateValue = managedCompactionPrompt(templateFile);
  const activeValue = managedCompactionPrompt(activeFile);
  if (templateValue.kind !== "value") {
    return [{
      active: activeValue.kind === "value" ? managedPromptDigest(activeValue.value) : null,
      field: "agent.compaction.prompt",
      reason: "template-unreadable",
      restartBoundary: "resolve-source-before-sync",
      status: "unknown",
      template: null,
    }];
  }
  const template = managedPromptDigest(templateValue.value);
  if (activeValue.kind === "missing") {
    return [{
      active: null,
      field: "agent.compaction.prompt",
      reason: "active-missing",
      restartBoundary: "synchronize-active-copy-and-restart",
      status: "missing",
      template,
    }];
  }
  if (activeValue.kind === "unknown") {
    return [{
      active: null,
      field: "agent.compaction.prompt",
      reason: "active-unreadable",
      restartBoundary: "resolve-source-before-sync",
      status: "unknown",
      template,
    }];
  }
  const active = managedPromptDigest(activeValue.value);
  const same = template.sha256 === active.sha256 && template.markers.join("\0") === active.markers.join("\0");
  return [{
    active,
    field: "agent.compaction.prompt",
    reason: same ? "content-matches" : "content-differs",
    restartBoundary: same ? "none" : "synchronize-active-copy-and-restart",
    status: same ? "same" : "different",
    template,
  }];
}

function resolveRuntimeGlobalHelperFromInventory(
  inventory: RuntimeSourceInventory,
  relativePath: string,
): RuntimeGlobalHelperResolution {
  const normalizedRelative = normalize(relativePath).replace(/^\/+/, "");
  if (!normalizedRelative.startsWith("bin/") || normalizedRelative.includes("../")) {
    throw new Error(`Runtime global helper must be a safe bin-relative path: ${relativePath}`);
  }
  const custom = process.env.OPENCODE_CONFIG_DIR?.trim();
  const hostDefault = path.join(os.homedir(), ".config", "opencode");
  const candidates: Array<{ root: string; source: "custom" | "host-default" }> = custom
    ? [{ root: path.resolve(custom), source: "custom" }, { root: hostDefault, source: "host-default" }]
    : [{ root: hostDefault, source: "host-default" }];
  const seen = new Set<string>();
  const attempts = candidates.flatMap((candidate) => {
    const key = process.platform === "win32" ? candidate.root.toLowerCase() : candidate.root;
    if (seen.has(key)) return [];
    seen.add(key);
    const helper = path.join(candidate.root, normalizedRelative);
    return [{ exists: isFile(helper), helper: redactLocation(helper), source: candidate.source }];
  });
  const found = attempts.find((attempt) => attempt.exists) ?? null;
  const status = inventory.collisionStatus === "blocked" ? "blocked" : found == null ? "missing" : "resolved";
  return {
    attempts,
    collisionStatus: inventory.collisionStatus,
    relativePath: normalizedRelative,
    selected: status === "resolved" && found != null ? { helper: found.helper, source: found.source } : null,
    status,
  };
}

export function resolveRuntimeGlobalHelper(root: string, relativePath: string): RuntimeGlobalHelperResolution {
  return resolveRuntimeGlobalHelperFromInventory(inspectRuntimeSourceInventory(root), relativePath);
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

export function inspectRuntimeSourceInventory(root: string): RuntimeSourceInventory {
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
  return {
    canonicalWorkflow,
    collisionStatus: sourceCollisions.some((collision) =>
      (collision.kind === "skill" && CANONICAL_SKILLS.has(collision.name)) ||
      (collision.kind === "command" && CANONICAL_COMMANDS.has(collision.name))
    ) ? "blocked" : "clear",
    collisions: sourceCollisions,
    sources,
  };
}

export function inspectRuntimeSources(root: string): RuntimeSourceReport {
  const inventory = inspectRuntimeSourceInventory(root);
  const globalRoot = activeGlobalRoot();
  const helperPaths = [
    "bin/openspec-operation-gate.ts",
    "bin/openspec-archive.ts",
    "bin/roadmap-mission.ts",
  ];
  return {
    collisions: inventory.collisions,
    managedPrompts: inspectManagedPromptDrift(
      path.join(path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "global"), "opencode.json.template"),
      path.join(globalRoot, "opencode.json"),
    ),
    unattended: {
      canonicalWorkflow: inventory.canonicalWorkflow,
      collisionStatus: inventory.collisionStatus,
      guard: guardDiagnostics(globalRoot),
      helpers: helperPaths.filter((relative) => isFile(path.join(globalRoot, relative))).map((relative) => ({
        path: relative,
        sha256: crypto.createHash("sha256").update(fs.readFileSync(path.join(globalRoot, relative))).digest("hex"),
      })),
      helperResolution: helperPaths.map((relative) => resolveRuntimeGlobalHelperFromInventory(inventory, relative)),
    },
    root: redactLocation(root),
    schemaVersion: 2,
    sources: inventory.sources,
    warnings: [
      "Source presence does not prove precedence or that every source was loaded by a running process.",
      "Config-declared instruction globs are not expanded because resolved config may contain secrets; configured paths not represented by conventional locations require an isolated privacy-safe workflow.",
    ],
  };
}

function usage(): string {
  return `Usage:
  npm run opencode:sources -- [options]

Options:
  --root <path>  Project directory to inspect. Default: repository root.
  --help, -h     Show this help.`;
}

function parseArgs(args: string[]): { help: boolean; root: string } {
  if (args.includes("--help") || args.includes("-h")) {
    return { help: true, root: "" };
  }

  let root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  for (let index = 0; index < args.length; index++) {
    const arg = args[index];
    if (arg === "--root") {
      const value = args[index + 1];
      if (!value || value.startsWith("--")) {
        throw new Error("Missing value for --root.");
      }
      root = path.resolve(value);
      index++;
    } else {
      throw new Error(`Unknown option: ${arg}`);
    }
  }
  return { help: false, root };
}

function isMainModule(): boolean {
  const entrypoint = process.argv[1];
  return Boolean(entrypoint && import.meta.url === pathToFileURL(path.resolve(entrypoint)).href);
}

if (isMainModule()) {
  try {
    const options = parseArgs(process.argv.slice(2));
    if (options.help) {
      console.log(usage());
    } else {
      console.log(JSON.stringify(inspectRuntimeSources(options.root), null, 2));
    }
  } catch (error) {
    console.error(`${error instanceof Error ? error.message : String(error)}\n\n${usage()}`);
    process.exitCode = 1;
  }
}
