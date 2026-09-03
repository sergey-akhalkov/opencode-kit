import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { pathToFileURL } from "node:url";

export const RUNTIME_SURFACE_PROFILE_SCHEMA_VERSION = 1;
export const RUNTIME_SURFACE_CONFIG_MODES = ["ask", "all-compatibility"] as const;
export const REQUIRED_RUNTIME_SURFACE_PROFILE_NAMES = ["all", "core"] as const;
export const BEADS_PORTFOLIO_SKILL = "beads-portfolio-bridge";
export const BEADS_PORTFOLIO_HELPER_DIRECTORY = "global/bin/beads-portfolio-bridge";

export const CORE_SKILLS = [
  "behavioral-substitution-qualification",
  "change-ready-sdlc",
  "complain",
  "complexity-management",
  "foundation-integrity-recovery",
  "next-step",
  "openspec-abandon-change",
  "openspec-apply-change",
  "openspec-archive-change",
  "openspec-propose",
  "reuse-discovery",
  "roadmap-delivery-trajectory",
] as const;

export const CORE_AGENTS = [
  "code-quality-reviewer",
  "evidence-sufficiency-reviewer",
  "execution-safety-reviewer",
  "foundation-integrity-reviewer",
  "implementation-readiness-reviewer",
  "implementation-worker",
  "instruction-artifact-reviewer",
  "openspec-architecture-reviewer",
  "sdet-quality-engineer",
  "specialist-team-advisor",
  "test-coverage-reviewer",
  "troubleshooter",
] as const;

export const CORE_COMMANDS = ["kaizen-status", "kaizen-triage", "opsx-apply", "opsx-archive", "opsx-propose"] as const;

export const DELIVERY_TRAJECTORY_HELPER_FILES = [
  "global/bin/delivery-trajectory-context.ts",
  "global/bin/openspec-change/delivery-horizon.ts",
  "global/bin/openspec-change/manifest.ts",
] as const;

export const OPENSPEC_ARCHIVE_HELPER_FILES = [
  "global/bin/openspec-archive.ts",
  "global/bin/portable-process.ts",
  "global/bin/openspec-change/claims.ts",
  "global/bin/openspec-change/gate.ts",
  "global/bin/openspec-change/inventory.ts",
  "global/bin/openspec-change/ownership.ts",
  "global/bin/openspec-change/state.ts",
] as const;

export const ALL_COMPATIBILITY_FILES = [
  "global/AGENTS.md",
  "global/bin/complexity-foraging-contract.ts",
  "global/bin/complexity-foraging-inventory.ts",
  "global/opencode.json.template",
  "global/opencode.local.instructions.example.md",
  "global/principles-of-work.md",
] as const;

export const SPECIALIST_CATALOG_PLUGIN_FILE = "extensions/specialist-catalog.ts";
export const UNRESTRICTED_AGENT_TOOLS_PLUGIN_FILE = "extensions/unrestricted-agent-tools.ts";

export const CORE_FILES = [
  "global/AGENTS.md",
  "global/bin/complexity-foraging-contract.ts",
  "global/bin/complexity-foraging-inventory.ts",
  ...DELIVERY_TRAJECTORY_HELPER_FILES,
  ...OPENSPEC_ARCHIVE_HELPER_FILES,
  `global/${SPECIALIST_CATALOG_PLUGIN_FILE}`,
  `global/${UNRESTRICTED_AGENT_TOOLS_PLUGIN_FILE}`,
  "global/opencode.json.template",
  "global/opencode.local.instructions.example.md",
  "global/principles-of-work.md",
].sort(compareLocale);

export const CORE_DIRECTORIES = ["global/plugin"] as const;

export const CORE_BEADS_SKILLS = [BEADS_PORTFOLIO_SKILL, ...CORE_SKILLS].sort(compareLocale);
export const CORE_BEADS_AGENTS = [...CORE_AGENTS];
export const CORE_BEADS_COMMANDS = [...CORE_COMMANDS];
export const CORE_BEADS_FILES = [...CORE_FILES];
export const CORE_BEADS_DIRECTORIES = [BEADS_PORTFOLIO_HELPER_DIRECTORY, ...CORE_DIRECTORIES].sort(compareLocale);

export const ALL_COMPATIBILITY_DIRECTORIES = [
  "global/bin",
  "global/extensions",
  "global/model-profiles",
  "global/plugin",
  "global/plugins",
] as const;

export type RuntimeSurfaceConfigMode = (typeof RUNTIME_SURFACE_CONFIG_MODES)[number];

export type RuntimeSurfaceProfile = {
  agents: string[];
  commands: string[];
  configMode: RuntimeSurfaceConfigMode;
  description: string;
  directories: string[];
  files: string[];
  name: string;
  schemaVersion: typeof RUNTIME_SURFACE_PROFILE_SCHEMA_VERSION;
  skills: string[];
};

export type RuntimeSurfaceEntryKind = "agent" | "command" | "directory" | "file" | "skill";

export type RuntimeSurfaceEntry = {
  destination: string;
  kind: RuntimeSurfaceEntryKind;
  owner: string;
  source: string;
};

export type RuntimeSurfaceInspection = {
  errors: string[];
  profiles: Map<string, RuntimeSurfaceProfile>;
};

const PROFILE_KEYS = [
  "agents",
  "commands",
  "configMode",
  "description",
  "directories",
  "files",
  "name",
  "schemaVersion",
  "skills",
] as const;

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value != null && !Array.isArray(value);
}

function compareLocale(left: string, right: string): number {
  return left.localeCompare(right);
}

export function findDuplicateStrings(values: string[]): string[] {
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  for (const value of values) {
    if (seen.has(value)) {
      duplicates.add(value);
    }
    seen.add(value);
  }
  return [...duplicates].sort(compareLocale);
}

export function isStableSorted(values: string[]): boolean {
  return values.every((value, index) => index === 0 || compareLocale(values[index - 1]!, value) < 0);
}

export function serializeRuntimeSurfaceProfile(profile: RuntimeSurfaceProfile): string {
  return `${JSON.stringify({
    schemaVersion: profile.schemaVersion,
    name: profile.name,
    description: profile.description,
    configMode: profile.configMode,
    agents: profile.agents,
    commands: profile.commands,
    directories: profile.directories,
    files: profile.files,
    skills: profile.skills,
  }, null, 2)}\n`;
}

export function safeRepositoryRelativePath(value: string): string | null {
  if (value.includes("\\") || value !== value.replaceAll("\\", "/")) {
    return null;
  }
  if (value.startsWith("/") || /^[A-Za-z]:/.test(value)) {
    return null;
  }
  const parts = value.split("/");
  if (parts.some((part) => part === "" || part === "." || part === "..")) {
    return null;
  }
  if (!value.startsWith("global/")) {
    return null;
  }
  return value;
}

function readStringArray(value: unknown, file: string, key: string, errors: string[]): string[] {
  if (value == null) {
    errors.push(`Profile field '${key}' must be an array of non-empty strings: ${file}`);
    return [];
  }
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string" || item.trim() === "")) {
    errors.push(`Profile field '${key}' must be an array of non-empty strings: ${file}`);
    return [];
  }
  return value;
}

export function parseRuntimeSurfaceProfile(
  value: unknown,
  file: string,
  expectedName: string,
): { errors: string[]; profile: RuntimeSurfaceProfile | null } {
  const errors: string[] = [];
  if (!isPlainRecord(value)) {
    errors.push(`Profile must be a JSON object: ${file}`);
    return { errors, profile: null };
  }
  for (const key of Object.keys(value).sort(compareLocale)) {
    if (!PROFILE_KEYS.includes(key as (typeof PROFILE_KEYS)[number])) {
      errors.push(`Unsupported profile field '${key}': ${file}`);
    }
  }
  if (value.schemaVersion !== RUNTIME_SURFACE_PROFILE_SCHEMA_VERSION) {
    errors.push(`Profile field 'schemaVersion' must be ${RUNTIME_SURFACE_PROFILE_SCHEMA_VERSION}: ${file}`);
  }
  if (typeof value.name !== "string" || value.name !== expectedName) {
    errors.push(`Profile name must match filename '${expectedName}': ${file}`);
  }
  if (typeof value.description !== "string" || value.description.trim() === "") {
    errors.push(`Profile description must be a string: ${file}`);
  }
  if (
    typeof value.configMode !== "string" ||
    !RUNTIME_SURFACE_CONFIG_MODES.includes(value.configMode as RuntimeSurfaceConfigMode)
  ) {
    errors.push(`Profile field 'configMode' must be ask or all-compatibility: ${file}`);
  }
  const skills = readStringArray(value.skills, file, "skills", errors);
  const agents = readStringArray(value.agents, file, "agents", errors);
  const commands = readStringArray(value.commands, file, "commands", errors);
  const files = readStringArray(value.files, file, "files", errors);
  const directories = readStringArray(value.directories, file, "directories", errors);
  const configModeValid = typeof value.configMode === "string" &&
    RUNTIME_SURFACE_CONFIG_MODES.includes(value.configMode as RuntimeSurfaceConfigMode);
  const descriptionValid = typeof value.description === "string" && value.description.trim() !== "";
  if (
    value.schemaVersion !== RUNTIME_SURFACE_PROFILE_SCHEMA_VERSION ||
    typeof value.name !== "string" ||
    value.name !== expectedName ||
    !descriptionValid ||
    !configModeValid
  ) {
    return { errors, profile: null };
  }
  return {
    errors,
    profile: {
      agents,
      commands,
      configMode: value.configMode as RuntimeSurfaceConfigMode,
      description: value.description as string,
      directories,
      files,
      name: expectedName,
      schemaVersion: RUNTIME_SURFACE_PROFILE_SCHEMA_VERSION,
      skills,
    },
  };
}

export function loadRuntimeSurfaceProfile(
  root: string,
  name: string,
): { errors: string[]; profile: RuntimeSurfaceProfile | null } {
  const relative = `profiles/${name}.json`;
  const file = path.join(root, "profiles", `${name}.json`);
  let text: string;
  try {
    text = fs.readFileSync(file, "utf8");
  } catch {
    return { errors: [`Missing runtime-surface profile: ${relative}`], profile: null };
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { errors: [`Profile contains invalid JSON: ${file}`], profile: null };
  }
  return parseRuntimeSurfaceProfile(parsed, file, name);
}

function destinationForNamed(kind: "agent" | "command" | "skill", name: string): string {
  if (kind === "skill") {
    return `skills/${name}`;
  }
  if (kind === "agent") {
    return `agents/${name}.md`;
  }
  return `commands/${name}.md`;
}

function sourceForNamed(kind: "agent" | "command" | "skill", name: string): string {
  if (kind === "skill") {
    return `global/skills/${name}`;
  }
  if (kind === "agent") {
    return `global/agents/${name}.md`;
  }
  return `global/commands/${name}.md`;
}

function destinationForGlobalPath(source: string): string {
  return source.slice("global/".length);
}

export function ownerForDestination(destination: string): string {
  const skillMatch = /^skills\/([^/]+)(?:\/.*)?$/.exec(destination);
  if (skillMatch) {
    return `skill:${skillMatch[1]}`;
  }
  const agentMatch = /^agents\/([^/]+)\.md$/.exec(destination);
  if (agentMatch) {
    return `agent:${agentMatch[1]}`;
  }
  const commandMatch = /^commands\/([^/]+)\.md$/.exec(destination);
  if (commandMatch) {
    return `command:${commandMatch[1]}`;
  }
  if (destination === "opencode.json" || destination === "opencode.json.template") {
    return "config:opencode.json";
  }
  return `path:${destination}`;
}

function pushEntry(
  entries: RuntimeSurfaceEntry[],
  errors: string[],
  file: string,
  kind: RuntimeSurfaceEntryKind,
  source: string,
  destination: string,
): void {
  const safe = safeRepositoryRelativePath(source);
  if (safe == null) {
    errors.push(`Profile path escapes the repository: ${source} (${file})`);
    return;
  }
  entries.push({
    destination,
    kind,
    owner: ownerForDestination(destination),
    source: safe,
  });
}

export function resolveRuntimeSurfaceProfile(
  root: string,
  profile: RuntimeSurfaceProfile,
  file: string,
): { entries: RuntimeSurfaceEntry[]; errors: string[] } {
  const errors: string[] = [];
  const entries: RuntimeSurfaceEntry[] = [];
  const resolvedRoot = path.resolve(root);

  for (const [key, values] of [
    ["skills", profile.skills],
    ["agents", profile.agents],
    ["commands", profile.commands],
    ["files", profile.files],
    ["directories", profile.directories],
  ] as const) {
    const duplicates = findDuplicateStrings(values);
    if (duplicates.length > 0) {
      errors.push(`Profile has duplicate ${key} ${duplicates.join(", ")}: ${file}`);
    }
    if (!isStableSorted(values)) {
      errors.push(`Profile field '${key}' must be stably ordered: ${file}`);
    }
  }

  for (const name of profile.skills) {
    pushEntry(entries, errors, file, "skill", sourceForNamed("skill", name), destinationForNamed("skill", name));
  }
  for (const name of profile.agents) {
    pushEntry(entries, errors, file, "agent", sourceForNamed("agent", name), destinationForNamed("agent", name));
  }
  for (const name of profile.commands) {
    pushEntry(entries, errors, file, "command", sourceForNamed("command", name), destinationForNamed("command", name));
  }
  for (const source of profile.files) {
    pushEntry(entries, errors, file, "file", source, destinationForGlobalPath(source));
  }
  for (const source of profile.directories) {
    pushEntry(entries, errors, file, "directory", source, destinationForGlobalPath(source));
  }

  const byOwner = new Map<string, RuntimeSurfaceEntry>();
  for (const entry of entries) {
    const existing = byOwner.get(entry.owner);
    if (existing == null) {
      byOwner.set(entry.owner, entry);
      continue;
    }
    if (existing.source === entry.source) {
      errors.push(`Profile has duplicate owner '${entry.owner}': ${file}`);
    } else {
      errors.push(
        `Profile has conflicting owners for '${entry.owner}': ${existing.source} and ${entry.source} (${file})`,
      );
    }
  }

  for (const entry of entries) {
    const absolute = path.resolve(resolvedRoot, ...entry.source.split("/"));
    const relative = path.relative(resolvedRoot, absolute);
    if (relative.startsWith("..") || path.isAbsolute(relative)) {
      errors.push(`Profile path escapes the repository: ${entry.source} (${file})`);
      continue;
    }
    if (entry.kind === "directory" || entry.kind === "skill") {
      if (!fs.existsSync(absolute) || !fs.statSync(absolute).isDirectory()) {
        errors.push(`Profile source is missing: ${entry.source} (${file})`);
      }
    } else if (!fs.existsSync(absolute) || !fs.statSync(absolute).isFile()) {
      errors.push(`Profile source is missing: ${entry.source} (${file})`);
    }
  }

  return { entries, errors };
}

function sameStringSet(actual: string[], expected: readonly string[]): { extra: string[]; missing: string[] } {
  const actualSet = new Set(actual);
  const expectedSet = new Set(expected);
  return {
    extra: actual.filter((value) => !expectedSet.has(value)).sort(compareLocale),
    missing: expected.filter((value) => !actualSet.has(value)).sort(compareLocale),
  };
}

function reportSetMismatch(
  errors: string[],
  label: string,
  actual: string[],
  expected: readonly string[],
  file: string,
): void {
  const diff = sameStringSet(actual, expected);
  if (diff.missing.length > 0 || diff.extra.length > 0) {
    errors.push(
      `${label} Missing: ${diff.missing.join(", ") || "none"}. Extra: ${diff.extra.join(", ") || "none"}. (${file})`,
    );
  }
}

export function kitHasNamedCoreCatalog(skillNames: string[], agentNames: string[]): boolean {
  return CORE_SKILLS.every((name) => skillNames.includes(name)) &&
    CORE_AGENTS.every((name) => agentNames.includes(name));
}

export function inspectRuntimeSurfaceProfiles(
  root: string,
  skillNames: string[],
  agentNames: string[],
  commandNames: string[],
): RuntimeSurfaceInspection {
  const errors: string[] = [];
  const profiles = new Map<string, RuntimeSurfaceProfile>();
  const profilesDir = path.join(root, "profiles");
  if (!fs.existsSync(profilesDir) || !fs.statSync(profilesDir).isDirectory()) {
    return { errors, profiles };
  }
  const profileFiles = fs
    .readdirSync(profilesDir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
    .map((entry) => entry.name)
    .sort(compareLocale);
  const profileNames = profileFiles.map((file) => path.basename(file, ".json"));
  const skillSet = new Set(skillNames);
  const beadsSourcePresent = skillSet.has(BEADS_PORTFOLIO_SKILL)
    || fs.existsSync(path.join(root, ...BEADS_PORTFOLIO_HELPER_DIRECTORY.split("/")));
  const requiredProfileNames = beadsSourcePresent
    ? [...REQUIRED_RUNTIME_SURFACE_PROFILE_NAMES, "core-beads"]
    : [...REQUIRED_RUNTIME_SURFACE_PROFILE_NAMES];
  for (const required of requiredProfileNames) {
    if (!profileNames.includes(required)) {
      errors.push(beadsSourcePresent
        ? `Install profiles with Beads source must contain profiles/core.json, profiles/core-beads.json, and profiles/all.json.`
        : `Install profiles must contain profiles/core.json and profiles/all.json.`);
      break;
    }
  }

  const agentSet = new Set(agentNames);
  const commandSet = new Set(commandNames);
  const complete = kitHasNamedCoreCatalog(skillNames, agentNames);

  for (const fileName of profileFiles) {
    const name = path.basename(fileName, ".json");
    const loaded = loadRuntimeSurfaceProfile(root, name);
    errors.push(...loaded.errors);
    if (loaded.profile == null) {
      continue;
    }
    const file = path.join(root, "profiles", fileName);
    const resolved = resolveRuntimeSurfaceProfile(root, loaded.profile, file);
    errors.push(...resolved.errors);
    for (const skill of loaded.profile.skills) {
      if (!skillSet.has(skill)) {
        errors.push(`Profile references missing skill '${skill}': ${file}`);
      }
    }
    for (const agent of loaded.profile.agents) {
      if (!agentSet.has(agent)) {
        errors.push(`Profile references missing agent '${agent}': ${file}`);
      }
    }
    for (const command of loaded.profile.commands) {
      if (!commandSet.has(command)) {
        errors.push(`Profile references missing command '${command}': ${file}`);
      }
    }
    if (name === "all") {
      reportSetMismatch(errors, "profiles/all.json must match repository skills.", loaded.profile.skills, skillNames, file);
      reportSetMismatch(errors, "profiles/all.json must match repository agents.", loaded.profile.agents, agentNames, file);
      reportSetMismatch(
        errors,
        "profiles/all.json must match repository commands.",
        loaded.profile.commands,
        commandNames,
        file,
      );
      if (complete) {
        reportSetMismatch(errors, "profiles/all.json files must match the full catalog.", loaded.profile.files, ALL_COMPATIBILITY_FILES, file);
        reportSetMismatch(
          errors,
          "profiles/all.json directories must match the full catalog.",
          loaded.profile.directories,
          ALL_COMPATIBILITY_DIRECTORIES,
          file,
        );
        if (loaded.profile.configMode !== "all-compatibility") {
          errors.push(`profiles/all.json configMode must be all-compatibility: ${file}`);
        }
      }
    }
    if (name === "core" && complete) {
      reportSetMismatch(errors, "profiles/core.json skills must match the named core catalog.", loaded.profile.skills, CORE_SKILLS, file);
      reportSetMismatch(errors, "profiles/core.json agents must match the named core catalog.", loaded.profile.agents, CORE_AGENTS, file);
      reportSetMismatch(
        errors,
        "profiles/core.json commands must match the named core catalog.",
        loaded.profile.commands,
        CORE_COMMANDS,
        file,
      );
      reportSetMismatch(errors, "profiles/core.json files must match the named core catalog.", loaded.profile.files, CORE_FILES, file);
      reportSetMismatch(
        errors,
        "profiles/core.json directories must match the named core catalog.",
        loaded.profile.directories,
        CORE_DIRECTORIES,
        file,
      );
      if (loaded.profile.configMode !== "ask") {
        errors.push(`profiles/core.json configMode must be ask: ${file}`);
      }
    }
    const containsBeadsSurface = loaded.profile.skills.includes(BEADS_PORTFOLIO_SKILL)
      || loaded.profile.directories.some((entry) => entry === BEADS_PORTFOLIO_HELPER_DIRECTORY || entry.startsWith(`${BEADS_PORTFOLIO_HELPER_DIRECTORY}/`))
      || loaded.profile.files.some((entry) => entry.startsWith(`${BEADS_PORTFOLIO_HELPER_DIRECTORY}/`));
    if (containsBeadsSurface && name !== "core-beads" && name !== "all") {
      errors.push(`Beads runtime artifacts require the concrete full profiles/core-beads.json identity: ${file}`);
    }
    if (name === "core-beads" && complete) {
      reportSetMismatch(errors, "profiles/core-beads.json skills must equal core plus the Beads skill.", loaded.profile.skills, CORE_BEADS_SKILLS, file);
      reportSetMismatch(errors, "profiles/core-beads.json agents must match core.", loaded.profile.agents, CORE_BEADS_AGENTS, file);
      reportSetMismatch(errors, "profiles/core-beads.json commands must match core.", loaded.profile.commands, CORE_BEADS_COMMANDS, file);
      reportSetMismatch(errors, "profiles/core-beads.json files must match core.", loaded.profile.files, CORE_BEADS_FILES, file);
      reportSetMismatch(errors, "profiles/core-beads.json directories must equal core plus the Beads helper closure.", loaded.profile.directories, CORE_BEADS_DIRECTORIES, file);
      if (loaded.profile.configMode !== "ask") {
        errors.push(`profiles/core-beads.json configMode must be ask: ${file}`);
      }
    }
    profiles.set(name, loaded.profile);
  }

  return { errors, profiles };
}

export function listCommandNames(root: string): string[] {
  const commandsDir = path.join(root, "global", "commands");
  if (!fs.existsSync(commandsDir) || !fs.statSync(commandsDir).isDirectory()) {
    return [];
  }
  return fs
    .readdirSync(commandsDir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".md"))
    .map((entry) => path.basename(entry.name, ".md"))
    .sort(compareLocale);
}

export const EFFECTIVE_RUNTIME_SURFACE_MANIFEST = ".runtime-surface.json";
export const GENERATED_RUNTIME_PROFILES_RELATIVE = "global/.runtime-profiles";
export const CORE_CONFIG_SCHEMA = "https://opencode.ai/config.json";
export const ROADMAP_MISSION_PLUGIN_FILES = [
  "extensions/opencode-pty-bridge.ts",
  "extensions/roadmap-mission-launcher.ts",
  "extensions/session-completion-guard.ts",
] as const;
export const ROADMAP_MISSION_RUNTIME_FILES = [
  "bin/roadmap-mission.ts",
  "bin/roadmap-mission-session-executor.ts",
  "bin/roadmap-mission/contracts.ts",
  "bin/roadmap-mission/controller-adapter.ts",
  "bin/roadmap-mission/controller-process.ts",
  "bin/roadmap-mission/controller-result.ts",
  "bin/roadmap-mission/controller.ts",
  "bin/roadmap-mission/parent-correlation.ts",
  "bin/roadmap-mission/preflight.ts",
  "bin/roadmap-mission/session-executor.ts",
  "bin/roadmap-mission/state.ts",
  ...ROADMAP_MISSION_PLUGIN_FILES,
  "extensions/session-completion-guard/terminal-certificate.ts",
] as const;
export const WORK_CAMPAIGN_RUNTIME_FILES = [
  "bin/work-campaign-supervisor.ts",
  "bin/work-campaign-semantic-executor.ts",
  "bin/work-campaign.ts",
  "bin/work-campaign/contracts.ts",
  "bin/work-campaign/controller.ts",
  "bin/work-campaign/materializer.ts",
  "bin/work-campaign/mission-handoff.ts",
  "bin/work-campaign/phase-input.ts",
  "bin/work-campaign/preflight.ts",
  "bin/work-campaign/semantic-executor.ts",
  "bin/work-campaign/semantic-playbook.ts",
  "bin/work-campaign/semantic-schema.ts",
  "bin/work-campaign/state.ts",
  "bin/work-campaign/supervisor.ts",
  "bin/work-campaign/verification-input.ts",
] as const;
export const PORTABLE_WORKFLOW_RUNTIME_FILES = [
  "bin/openspec-operation-gate.ts",
  "bin/openspec-archive.ts",
  "bin/portable-process.ts",
  "bin/portable-process-supervisor.ts",
  ...ROADMAP_MISSION_RUNTIME_FILES,
  ...WORK_CAMPAIGN_RUNTIME_FILES,
  "bin/validate-staged.ts",
] as const;

export type MaterializeInjectedFailure = "after-backup" | "after-stage";

export type MaterializeRuntimeSurfaceOptions = {
  injectFailure?: MaterializeInjectedFailure;
  profileName: string;
  root: string;
  targetRoot: string;
};

export type EffectiveRuntimeSurfaceManifest = {
  entries: Array<{
    destination: string;
    digest: string;
    kind: RuntimeSurfaceEntryKind;
    owner: string;
    source: string;
  }>;
  profile: string;
  schemaVersion: 1;
};

export type MaterializeRuntimeSurfaceResult = {
  backupRoot: string | null;
  manifest: EffectiveRuntimeSurfaceManifest;
  targetRoot: string;
};

function pathsEqual(left: string, right: string): boolean {
  return path.resolve(left) === path.resolve(right);
}

function isInside(parent: string, child: string): boolean {
  const relative = path.relative(path.resolve(parent), path.resolve(child));
  return relative !== "" && !relative.startsWith("..") && !path.isAbsolute(relative);
}

function skippedCopyName(name: string): boolean {
  return name === ".git" || name === "node_modules";
}

export function digestFile(filePath: string): string {
  return crypto.createHash("sha256").update(fs.readFileSync(filePath)).digest("hex");
}

export function walkExactFiles(root: string): string[] {
  const files: string[] = [];
  const visit = (current: string): void => {
    const entries = fs.readdirSync(current, { withFileTypes: true }).sort((left, right) => left.name.localeCompare(right.name));
    for (const entry of entries) {
      if (skippedCopyName(entry.name)) {
        continue;
      }
      const next = path.join(current, entry.name);
      if (entry.isDirectory()) {
        visit(next);
      } else if (entry.isFile()) {
        files.push(next);
      }
    }
  };
  visit(root);
  return files;
}

function digestDirectory(directory: string): string {
  const hash = crypto.createHash("sha256");
  const root = path.resolve(directory);
  for (const file of walkExactFiles(root)) {
    const relative = path.relative(root, file).split(path.sep).join("/");
    hash.update(relative);
    hash.update("\0");
    hash.update(fs.readFileSync(file));
    hash.update("\0");
  }
  return hash.digest("hex");
}

function copyExact(source: string, destination: string): void {
  const stat = fs.statSync(source);
  if (stat.isDirectory()) {
    fs.mkdirSync(destination, { recursive: true });
    for (const entry of fs.readdirSync(source, { withFileTypes: true }).sort((left, right) => left.name.localeCompare(right.name))) {
      if (skippedCopyName(entry.name)) {
        continue;
      }
      copyExact(path.join(source, entry.name), path.join(destination, entry.name));
    }
    return;
  }
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.copyFileSync(source, destination);
}

function removeIfExists(target: string): void {
  fs.rmSync(target, { recursive: true, force: true });
}

function assertSafeGeneratedRoot(root: string, targetRoot: string): string {
  const resolvedRoot = path.resolve(root);
  const resolvedTarget = path.resolve(targetRoot);
  const sourceGlobal = path.join(resolvedRoot, "global");
  const generatedHome = path.join(resolvedRoot, ...GENERATED_RUNTIME_PROFILES_RELATIVE.split("/"));
  if (!path.isAbsolute(resolvedTarget)) {
    throw new Error("Generated runtime-surface root must be an absolute path.");
  }
  if (pathsEqual(resolvedTarget, resolvedRoot) || pathsEqual(resolvedTarget, sourceGlobal)) {
    throw new Error("Generated runtime-surface root must not overwrite the repository source.");
  }
  if (isInside(sourceGlobal, resolvedTarget) && !pathsEqual(resolvedTarget, generatedHome) && !isInside(generatedHome, resolvedTarget)) {
    throw new Error("Generated runtime-surface root must not overwrite the source global directory.");
  }
  return resolvedTarget;
}

function writeEffectiveManifest(stagingRoot: string, manifest: EffectiveRuntimeSurfaceManifest): void {
  const file = path.join(stagingRoot, EFFECTIVE_RUNTIME_SURFACE_MANIFEST);
  fs.writeFileSync(file, `${JSON.stringify(manifest, null, 2)}\n`);
}

export function readbackRuntimeSurfaceTree(
  root: string,
  targetRoot: string,
  entries: RuntimeSurfaceEntry[],
): string[] {
  const errors: string[] = [];
  const resolvedRoot = path.resolve(root);
  const resolvedTarget = path.resolve(targetRoot);
  const expected = new Set<string>([EFFECTIVE_RUNTIME_SURFACE_MANIFEST, "opencode.json"]);
  for (const entry of entries) {
    const source = path.join(resolvedRoot, ...entry.source.split("/"));
    const destination = path.join(resolvedTarget, ...entry.destination.split("/"));
    expected.add(entry.destination);
    if (entry.kind === "directory" || entry.kind === "skill") {
      if (!fs.existsSync(destination) || !fs.statSync(destination).isDirectory()) {
        errors.push(`Generated tree missing directory ${entry.destination}.`);
        continue;
      }
      const sourceFiles = walkExactFiles(source);
      for (const sourceFile of sourceFiles) {
        const relative = path.relative(source, sourceFile).split(path.sep).join("/");
        const destFile = path.join(destination, ...relative.split("/"));
        expected.add(`${entry.destination}/${relative}`);
        if (!fs.existsSync(destFile) || !fs.readFileSync(sourceFile).equals(fs.readFileSync(destFile))) {
          errors.push(`Generated tree does not byte-match ${entry.source}/${relative}.`);
        }
      }
    } else if (!fs.existsSync(destination) || !fs.readFileSync(source).equals(fs.readFileSync(destination))) {
      errors.push(`Generated tree does not byte-match ${entry.source}.`);
    }
  }
  for (const file of walkExactFiles(resolvedTarget)) {
    const relative = path.relative(resolvedTarget, file).split(path.sep).join("/");
    if (!expected.has(relative) && ![...expected].some((prefix) => relative.startsWith(`${prefix}/`))) {
      errors.push(`Generated tree contains unowned file ${relative}.`);
    }
  }
  return errors;
}

export type RuntimeSurfaceInstallKind = "all" | "core" | "core-beads" | "none" | "unknown" | "unprofiled";

export type RuntimeSurfaceInstallPlan = {
  additions: string[];
  currentKind: RuntimeSurfaceInstallKind;
  currentOwners: string[];
  currentRoot: string | null;
  proposedName: string;
  proposedOwners: string[];
  removals: string[];
};

function profileOwners(root: string, name: string): string[] {
  const loaded = loadRuntimeSurfaceProfile(root, name);
  if (loaded.profile == null) {
    return [];
  }
  const resolved = resolveRuntimeSurfaceProfile(root, loaded.profile, path.join(root, "profiles", `${name}.json`));
  if (resolved.errors.length > 0) {
    return [];
  }
  return [...new Set(resolved.entries.map((entry) => entry.owner))].sort(compareLocale);
}

export function inspectRuntimeSurfaceInstall(options: {
  configDir: string | undefined;
  proposedName?: string;
  root: string;
}): RuntimeSurfaceInstallPlan {
  const proposedName = options.proposedName ?? "core";
  const currentRoot = options.configDir != null && options.configDir.trim() !== ""
    ? path.resolve(options.configDir)
    : null;
  let currentKind: RuntimeSurfaceInstallKind = "none";
  let currentOwners: string[] = [];
  if (currentRoot != null) {
    const manifestPath = path.join(currentRoot, EFFECTIVE_RUNTIME_SURFACE_MANIFEST);
    if (fs.existsSync(manifestPath) && fs.statSync(manifestPath).isFile()) {
      try {
        const parsed = JSON.parse(fs.readFileSync(manifestPath, "utf8")) as { profile?: unknown };
        if (parsed.profile === "core" || parsed.profile === "core-beads" || parsed.profile === "all") {
          currentKind = parsed.profile;
          currentOwners = profileOwners(options.root, parsed.profile);
        } else {
          currentKind = "unknown";
        }
      } catch {
        currentKind = "unknown";
      }
    } else if (pathsEqual(currentRoot, path.join(options.root, "global"))) {
      currentKind = "unprofiled";
      currentOwners = profileOwners(options.root, "all");
    } else {
      currentKind = "unknown";
    }
  }
  const proposedOwners = profileOwners(options.root, proposedName);
  const currentSet = new Set(currentOwners);
  const proposedSet = new Set(proposedOwners);
  return {
    additions: proposedOwners.filter((owner) => !currentSet.has(owner)),
    currentKind,
    currentOwners,
    currentRoot,
    proposedName,
    proposedOwners,
    removals: currentOwners.filter((owner) => !proposedSet.has(owner)),
  };
}

export type RuntimeSurfaceConfigRenderMode = "all-compatibility" | "ask" | "machine-autonomy";

export const ALL_COMPATIBILITY_PLUGIN_FILES = [
  "plugins/notify.ts",
  "plugin/session-env.ts",
  UNRESTRICTED_AGENT_TOOLS_PLUGIN_FILE,
  SPECIALIST_CATALOG_PLUGIN_FILE,
  ...ROADMAP_MISSION_PLUGIN_FILES,
] as const;
export const CORE_PLUGIN_FILES = [
  "plugin/session-env.ts",
  UNRESTRICTED_AGENT_TOOLS_PLUGIN_FILE,
  SPECIALIST_CATALOG_PLUGIN_FILE,
] as const;

export function materializeRuntimeSurfaceTemplate(templateText: string, targetRoot: string): string {
  const target = path.resolve(targetRoot);
  let materialized = templateText.replaceAll(
    JSON.stringify("__OPENCODE_CONFIG_DIR__/principles-of-work.md"),
    JSON.stringify(path.join(target, "principles-of-work.md").replaceAll("\\", "/")),
  );
  materialized = materialized.replaceAll(
    JSON.stringify("__OPENCODE_CONFIG_DIR__/opencode.local.instructions.md"),
    JSON.stringify(path.join(target, "opencode.local.instructions.md").replaceAll("\\", "/")),
  );
  for (const pluginPath of ALL_COMPATIBILITY_PLUGIN_FILES) {
    materialized = materialized.replaceAll(
      JSON.stringify(`__OPENCODE_CONFIG_DIR__/${pluginPath}`),
      JSON.stringify(pathToFileURL(path.join(target, ...pluginPath.split("/"))).href),
    );
  }
  return materialized.replaceAll(
    JSON.stringify("__OPENCODE_SCRIPT_RUNTIME__"),
    JSON.stringify(path.resolve(process.execPath).replaceAll("\\", "/")),
  );
}

export function renderRuntimeSurfaceConfig(
  mode: RuntimeSurfaceConfigRenderMode,
  materializedTemplate?: Record<string, unknown>,
): Record<string, unknown> {
  const permission = mode === "ask" ? "ask" : "allow";
  const instructions = Array.isArray(materializedTemplate?.instructions)
    ? materializedTemplate.instructions
    : [
        "__OPENCODE_CONFIG_DIR__/principles-of-work.md",
        "__OPENCODE_CONFIG_DIR__/opencode.local.instructions.md",
      ];
  const config: Record<string, unknown> = {
    $schema: CORE_CONFIG_SCHEMA,
    instructions,
    permission,
  };
  const templateAgents = materializedTemplate?.agent && typeof materializedTemplate.agent === "object" && !Array.isArray(materializedTemplate.agent)
    ? materializedTemplate.agent as Record<string, unknown>
    : {};
  const templateCompaction = templateAgents.compaction && typeof templateAgents.compaction === "object" && !Array.isArray(templateAgents.compaction)
    ? templateAgents.compaction as Record<string, unknown>
    : null;
  if (templateCompaction != null) {
    config.agent = { compaction: { ...templateCompaction } };
  }
  const templatePlugins = Array.isArray(materializedTemplate?.plugin) ? materializedTemplate.plugin : [];
  const catalogPlugins = templatePlugins.filter((entry) =>
    typeof entry === "string" && entry.startsWith("file:") && entry.endsWith(`/${SPECIALIST_CATALOG_PLUGIN_FILE}`)
  );
  if (mode === "ask") {
    const corePlugins = templatePlugins.filter((entry) => typeof entry === "string" && CORE_PLUGIN_FILES.some((relative) => entry.startsWith("file:") && entry.endsWith(`/${relative}`)));
    if (corePlugins.length !== CORE_PLUGIN_FILES.length || catalogPlugins.length !== 1) {
      throw new Error("The core profile requires exactly one materialized entry for every core plugin.");
    }
    config.plugin = corePlugins;
  }
  if (mode === "all-compatibility") {
    if (typeof materializedTemplate?.model !== "string" || !Array.isArray(materializedTemplate.plugin)) {
      throw new Error("The all profile requires a materialized template with model and plugin entries.");
    }
    if (catalogPlugins.length !== 1) {
      throw new Error("The all profile requires exactly one materialized specialist catalog plugin entry.");
    }
    config.model = materializedTemplate.model;
    config.plugin = materializedTemplate.plugin;
  }
  return config;
}

export function writeRuntimeSurfaceConfig(
  targetRoot: string,
  mode: RuntimeSurfaceConfigRenderMode,
  runtimeRoot: string = targetRoot,
): string {
  const file = path.join(path.resolve(targetRoot), "opencode.json");
  const templateFile = path.join(path.resolve(targetRoot), "opencode.json.template");
  const materializedTemplate = fs.existsSync(templateFile)
    ? JSON.parse(materializeRuntimeSurfaceTemplate(fs.readFileSync(templateFile, "utf8"), runtimeRoot)) as Record<string, unknown>
    : undefined;
  const rendered = renderRuntimeSurfaceConfig(mode, materializedTemplate);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(rendered, null, 2)}\n`);
  return file;
}

export function readRenderedPermission(configPath: string): string {
  const parsed = JSON.parse(fs.readFileSync(configPath, "utf8")) as { permission?: unknown };
  if (typeof parsed.permission !== "string") {
    throw new Error(`Rendered config is missing permission: ${configPath}`);
  }
  return parsed.permission;
}

export function materializeRuntimeSurfaceProfile(
  options: MaterializeRuntimeSurfaceOptions,
): MaterializeRuntimeSurfaceResult {
  const resolvedRoot = path.resolve(options.root);
  const targetRoot = assertSafeGeneratedRoot(resolvedRoot, options.targetRoot);
  const loaded = loadRuntimeSurfaceProfile(resolvedRoot, options.profileName);
  if (loaded.profile == null || loaded.errors.length > 0) {
    throw new Error(loaded.errors.join("\n") || `Unable to load profile '${options.profileName}'.`);
  }
  const profileFile = path.join(resolvedRoot, "profiles", `${options.profileName}.json`);
  const resolved = resolveRuntimeSurfaceProfile(resolvedRoot, loaded.profile, profileFile);
  if (resolved.errors.length > 0) {
    throw new Error(resolved.errors.join("\n"));
  }
  const parent = path.dirname(targetRoot);
  fs.mkdirSync(parent, { recursive: true });
  const stamp = `${process.pid}-${crypto.randomBytes(4).toString("hex")}`;
  const stagingRoot = `${targetRoot}.staging-${stamp}`;
  const backupRoot = `${targetRoot}.backup-${stamp}`;
  let relocatedExisting = false;
  try {
    removeIfExists(stagingRoot);
    fs.mkdirSync(stagingRoot, { recursive: true });
    const manifest: EffectiveRuntimeSurfaceManifest = {
      entries: resolved.entries.map((entry) => {
        const source = path.join(resolvedRoot, ...entry.source.split("/"));
        return {
          destination: entry.destination,
          digest: entry.kind === "directory" || entry.kind === "skill" ? digestDirectory(source) : digestFile(source),
          kind: entry.kind,
          owner: entry.owner,
          source: entry.source,
        };
      }),
      profile: options.profileName,
      schemaVersion: 1,
    };
    writeEffectiveManifest(stagingRoot, manifest);
    for (const entry of resolved.entries) {
      copyExact(
        path.join(resolvedRoot, ...entry.source.split("/")),
        path.join(stagingRoot, ...entry.destination.split("/")),
      );
    }
    writeRuntimeSurfaceConfig(
      stagingRoot,
      loaded.profile.configMode === "ask" ? "ask" : "all-compatibility",
      targetRoot,
    );
    const readback = readbackRuntimeSurfaceTree(resolvedRoot, stagingRoot, resolved.entries);
    if (readback.length > 0) {
      throw new Error(readback.join("\n"));
    }
    if (options.injectFailure === "after-stage") {
      throw new Error("Injected materialization failure after staging.");
    }
    if (fs.existsSync(targetRoot)) {
      removeIfExists(backupRoot);
      fs.renameSync(targetRoot, backupRoot);
      relocatedExisting = true;
    }
    if (options.injectFailure === "after-backup") {
      throw new Error("Injected materialization failure after backup.");
    }
    fs.renameSync(stagingRoot, targetRoot);
    return {
      backupRoot: relocatedExisting ? backupRoot : null,
      manifest,
      targetRoot,
    };
  } catch (error) {
    if (relocatedExisting && !fs.existsSync(targetRoot) && fs.existsSync(backupRoot)) {
      fs.renameSync(backupRoot, targetRoot);
    }
    removeIfExists(stagingRoot);
    throw error;
  }
}
