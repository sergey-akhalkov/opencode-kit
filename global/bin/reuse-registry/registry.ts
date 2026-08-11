import fs from "node:fs";
import path from "node:path";

import {
  DEFAULT_QUERY_LIMIT,
  MAX_QUERY_LIMIT,
  capabilitiesFileSchema,
  capabilityIndexSchema,
  generatedProjectSchema,
  groupsFileSchema,
  pendingCandidateSchema,
  privateConfigSchema,
  projectsFileSchema,
  registryDescriptorSchema,
  resolvedPlanSchema,
  REUSE_SCHEMA_VERSION,
  type Capability,
  type CapabilityIndex,
  type CapabilitiesFile,
  type GeneratedProject,
  type GroupsFile,
  type PendingCandidate,
  type PrivateConfig,
  type ProjectsFile,
  type RegistryDescriptor,
  type ResolvedPlan,
} from "./contracts.ts";
import {
  assertContained,
  assertRealDirectory,
  readJson,
  readOptionalBytes,
  replaceFileAtomically,
  replaceFilesAtomically,
  ReuseRegistryError,
  sha256,
  stableJson,
} from "./io.ts";
import { generatedProjectPath, scanProject, verifyCapabilitySource } from "./scanner.ts";

type LoadedRegistry = {
  capabilities: Capability[];
  capabilityFiles: Map<string, { file: string; value: CapabilitiesFile }>;
  descriptor: RegistryDescriptor;
  groups: GroupsFile;
  index: CapabilityIndex;
  projects: ProjectsFile;
  revision: string;
  root: string;
};

function assertUnique(values: string[], label: string): void {
  const duplicate = values.find((value, index) => values.indexOf(value) !== index);
  if (duplicate != null) throw new ReuseRegistryError(`${label} contains duplicate ID: ${duplicate}`);
}

function normalizeTerms(values: string[]): string[] {
  return [...new Set(values.flatMap((value) => value.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean)))].sort();
}

function searchableTerms(capability: Capability): Set<string> {
  return new Set(normalizeTerms([capability.id, capability.summary, ...capability.keywords]));
}

function validateCapabilities(capabilities: Capability[], projects: ProjectsFile): void {
  assertUnique(capabilities.map((item) => item.id), "Capabilities");
  const projectIds = new Set(projects.projects.map((item) => item.id));
  const capabilityIds = new Set(capabilities.map((item) => item.id));
  for (const capability of capabilities) {
    if (capability.project !== "external" && !projectIds.has(capability.project)) {
      throw new ReuseRegistryError(`Capability references unknown project: ${capability.id}`);
    }
    if (capability.keywords.some((keyword, index) => capability.keywords.indexOf(keyword) !== index)) {
      throw new ReuseRegistryError(`Capability keywords are not unique: ${capability.id}`);
    }
    if ([...capability.keywords].sort().join("\0") !== capability.keywords.join("\0")) {
      throw new ReuseRegistryError(`Capability keywords are not sorted: ${capability.id}`);
    }
    if (capability.status === "deprecated" && capability.replacement == null) {
      throw new ReuseRegistryError(`Deprecated capability must name a replacement: ${capability.id}`);
    }
    if (capability.replacement != null && !capabilityIds.has(capability.replacement)) {
      throw new ReuseRegistryError(`Capability replacement is missing: ${capability.id}`);
    }
    if (capability.maturity === "adopted-external") {
      if (capability.external == null || capability.kind !== "external-library" || capability.project !== "external") {
        throw new ReuseRegistryError(`Adopted external capability fields are inconsistent: ${capability.id}`);
      }
    } else if (capability.external != null) {
      throw new ReuseRegistryError(`Owned capability must not define external package fields: ${capability.id}`);
    }
  }
}

function deriveIndex(descriptor: RegistryDescriptor, capabilities: Capability[]): CapabilityIndex {
  return capabilityIndexSchema.parse({
    capabilities: [...capabilities].sort((left, right) => left.id.localeCompare(right.id)),
    registry: descriptor.id,
    version: REUSE_SCHEMA_VERSION,
  });
}

function capabilitiesDirectory(root: string): string {
  return path.join(root, "capabilities");
}

function loadCapabilityFiles(root: string): Map<string, { file: string; value: CapabilitiesFile }> {
  const directory = assertRealDirectory(capabilitiesDirectory(root), "Capabilities directory");
  const result = new Map<string, { file: string; value: CapabilitiesFile }>();
  for (const entry of fs.readdirSync(directory, { withFileTypes: true }).sort((left, right) => left.name.localeCompare(right.name))) {
    if (!entry.isFile() || !entry.name.endsWith(".json")) continue;
    const file = assertContained(directory, path.join(directory, entry.name), "Capability file");
    const value = readJson(file, capabilitiesFileSchema, `Capability file ${entry.name}`);
    if (result.has(value.project)) throw new ReuseRegistryError(`Multiple capability files own project: ${value.project}`);
    if (value.capabilities.some((capability) => capability.project !== value.project)) {
      throw new ReuseRegistryError(`Capability file project ownership mismatch: ${value.project}`);
    }
    result.set(value.project, { file, value });
  }
  return result;
}

function validateGeneratedFiles(root: string, projects: ProjectsFile): void {
  const directory = path.join(root, "generated", "projects");
  if (!fs.existsSync(directory)) return;
  assertRealDirectory(directory, "Generated projects directory");
  const validProjects = new Set(projects.projects.map((project) => project.id));
  const seen = new Set<string>();
  for (const entry of fs.readdirSync(directory, { withFileTypes: true }).sort((left, right) => left.name.localeCompare(right.name))) {
    if (!entry.isFile() || !entry.name.endsWith(".json")) continue;
    const value = readJson(path.join(directory, entry.name), generatedProjectSchema, `Generated project ${entry.name}`);
    if (!validProjects.has(value.project)) throw new ReuseRegistryError(`Generated record references unknown project: ${value.project}`);
    if (seen.has(value.project)) throw new ReuseRegistryError(`Generated project is duplicated: ${value.project}`);
    seen.add(value.project);
  }
}

export function loadPrivateConfig(file: string): PrivateConfig {
  if (file.trim() === "") throw new ReuseRegistryError("Explicit private config path is required", "degraded", 3);
  return readJson(path.resolve(file), privateConfigSchema, "Private reuse config");
}

export function loadResolvedPlan(file: string): ResolvedPlan {
  return readJson(path.resolve(file), resolvedPlanSchema, "Resolved reuse plan");
}

export function loadRegistry(config: PrivateConfig): LoadedRegistry {
  const root = assertRealDirectory(config.registryRoot, "Registry root");
  const descriptor = readJson(path.join(root, "registry.json"), registryDescriptorSchema, "Registry descriptor");
  const projects = readJson(path.join(root, "projects.json"), projectsFileSchema, "Registry projects");
  const groups = readJson(path.join(root, "groups.json"), groupsFileSchema, "Registry groups");
  assertUnique(projects.projects.map((item) => item.id), "Projects");
  assertUnique(groups.groups.map((item) => item.id), "Groups");
  const projectIds = new Set(projects.projects.map((item) => item.id));
  for (const group of groups.groups) {
    assertUnique(group.projects, `Group ${group.id}`);
    const unknown = group.projects.find((project) => !projectIds.has(project));
    if (unknown != null) throw new ReuseRegistryError(`Group references unknown project: ${group.id}`);
  }
  const capabilityFiles = loadCapabilityFiles(root);
  const capabilities = [...capabilityFiles.values()].flatMap((entry) => entry.value.capabilities);
  validateCapabilities(capabilities, projects);
  const index = readJson(path.join(root, "generated", "capability-index.json"), capabilityIndexSchema, "Capability index");
  const expectedIndex = deriveIndex(descriptor, capabilities);
  if (stableJson(index) !== stableJson(expectedIndex)) throw new ReuseRegistryError("Derived capability index does not match canonical records");
  validateGeneratedFiles(root, projects);
  return {
    capabilities,
    capabilityFiles,
    descriptor,
    groups,
    index,
    projects,
    revision: sha256(stableJson({ descriptor, groups, projects, capabilities })),
    root,
  };
}

function pendingFiles(config: PrivateConfig): string[] {
  if (!fs.existsSync(config.outboxRoot)) return [];
  const root = assertRealDirectory(config.outboxRoot, "Outbox root");
  return fs.readdirSync(root, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
    .map((entry) => assertContained(root, path.join(root, entry.name), "Pending candidate"))
    .sort();
}

export function registryStatus(config: PrivateConfig): Record<string, unknown> {
  const pending = pendingFiles(config).map((file) => readJson(file, pendingCandidateSchema, "Pending candidate").capability.id).sort();
  try {
    const registry = loadRegistry(config);
    return {
      registry: registry.descriptor.id,
      revision: registry.revision,
      source: "registry",
      status: "ok",
      pending,
    };
  } catch (error) {
    if (!(error instanceof ReuseRegistryError) || error.status !== "degraded") throw error;
    return { source: "none", status: "degraded", unavailable: "registry", pending };
  }
}

export function validateRegistry(config: PrivateConfig): Record<string, unknown> {
  const registry = loadRegistry(config);
  return {
    capabilities: registry.capabilities.length,
    groups: registry.groups.groups.length,
    projects: registry.projects.projects.length,
    registry: registry.descriptor.id,
    revision: registry.revision,
    status: "ok",
  };
}

export function queryRegistry(
  config: PrivateConfig,
  options: { groups: string[]; limit?: number; needs: string[]; offset?: number },
): Record<string, unknown> {
  const registry = loadRegistry(config);
  const enabled = new Set(config.enabledGroups);
  const requested = options.groups.length === 0 && config.enabledGroups.length === 1
    ? [...config.enabledGroups]
    : [...new Set(options.groups)].sort();
  if (requested.length === 0) throw new ReuseRegistryError("An explicit requested group is required when config does not enable exactly one group");
  const unknown = requested.find((group) => !registry.groups.groups.some((candidate) => candidate.id === group));
  if (unknown != null) throw new ReuseRegistryError(`Requested group is unknown: ${unknown}`);
  const disabled = requested.find((group) => !enabled.has(group));
  if (disabled != null) throw new ReuseRegistryError(`Requested group is not enabled: ${disabled}`);
  const selectedProjects = new Set(registry.groups.groups.filter((group) => requested.includes(group.id)).flatMap((group) => group.projects));
  const needs = normalizeTerms(options.needs);
  if (needs.length === 0) throw new ReuseRegistryError("At least one non-empty query term is required");
  const limit = options.limit ?? DEFAULT_QUERY_LIMIT;
  const offset = options.offset ?? 0;
  if (!Number.isInteger(limit) || limit < 1 || limit > MAX_QUERY_LIMIT) throw new ReuseRegistryError(`Query limit must be between 1 and ${MAX_QUERY_LIMIT}`);
  if (!Number.isInteger(offset) || offset < 0) throw new ReuseRegistryError("Query offset must be a non-negative integer");
  const matches = registry.index.capabilities
    .filter((capability) => capability.status === "active" && (capability.project === "external" || selectedProjects.has(capability.project)))
    .filter((capability) => {
      const searchable = searchableTerms(capability);
      return needs.every((term) => searchable.has(term));
    })
    .sort((left, right) => left.id.localeCompare(right.id));
  const results = matches.slice(offset, offset + limit).map((capability) => ({
    ...capability,
    binding: capability.project === "external" ? "not-applicable" : config.projects[capability.project] == null ? "unbound" : "bound",
    verification: verifyCapabilitySource(config, capability),
  }));
  return {
    groups: requested,
    hasMore: offset + results.length < matches.length,
    limit,
    needs,
    offset,
    registry: registry.descriptor.id,
    results,
    revision: registry.revision,
    source: "registry",
    status: "ok",
    total: matches.length,
  };
}

function assertPlanAuthority(config: PrivateConfig, registry: LoadedRegistry, plan: ResolvedPlan): void {
  if (plan.registry !== registry.descriptor.id) throw new ReuseRegistryError("Plan registry identity does not match active registry");
  if (!config.enabledGroups.includes(plan.group)) throw new ReuseRegistryError("Plan group is not enabled");
  const group = registry.groups.groups.find((candidate) => candidate.id === plan.group);
  if (group == null) throw new ReuseRegistryError("Plan group is unknown");
  const allowed = new Set(group.projects);
  assertUnique(plan.projects.map((project) => project.id), "Plan projects");
  const unselected = plan.projects.find((project) => !allowed.has(project.id));
  if (unselected != null) throw new ReuseRegistryError(`Plan project is outside the selected group: ${unselected.id}`);
  assertRealDirectory(plan.tempParent, "Plan temporary parent");
}

export function bootstrapRegistry(config: PrivateConfig, plan: ResolvedPlan): Record<string, unknown> {
  if (plan.operation !== "bootstrap" && plan.operation !== "rescan") throw new ReuseRegistryError("Plan operation cannot scan projects");
  const registry = loadRegistry(config);
  assertPlanAuthority(config, registry, plan);
  const generated: GeneratedProject[] = plan.projects.map((project) => scanProject(config, registry.projects, plan, project));
  const changes = generated.map((value) => ({
    file: generatedProjectPath(registry.root, value.project),
    next: stableJson(value),
  }));
  replaceFilesAtomically(changes);
  const validated = loadRegistry(config);
  return {
    candidates: generated.reduce((total, value) => total + value.candidates.length, 0),
    curatedCapabilities: validated.capabilities.length,
    mode: plan.mode,
    projects: generated.map((value) => ({
      candidates: value.candidates.length,
      commit: value.scanState.lastSuccessfulCommit,
      entrypoints: value.inventory.entrypoints.length,
      id: value.project,
      tree: value.scanState.tree,
    })),
    registry: registry.descriptor.id,
    status: "ok",
  };
}

function outboxFile(config: PrivateConfig, capability: Capability): string {
  fs.mkdirSync(config.outboxRoot, { recursive: true });
  const root = assertRealDirectory(config.outboxRoot, "Outbox root");
  return assertContained(root, path.join(root, `${sha256(capability.id).slice(0, 24)}.json`), "Pending candidate file");
}

export function enqueueCandidate(config: PrivateConfig, candidateFile: string): Record<string, unknown> {
  const candidate = readJson(path.resolve(candidateFile), pendingCandidateSchema, "Capability candidate");
  const file = outboxFile(config, candidate.capability);
  if (fs.existsSync(file)) throw new ReuseRegistryError(`Pending capability already exists: ${candidate.capability.id}`, "conflict", 4);
  replaceFileAtomically(file, stableJson(candidate), null);
  return { capability: candidate.capability.id, registryImpact: "pending", status: "ok" };
}

function canonicalCapabilityFile(registry: LoadedRegistry, project: string): { file: string; value: CapabilitiesFile } {
  const existing = registry.capabilityFiles.get(project);
  if (existing != null) return existing;
  return {
    file: path.join(capabilitiesDirectory(registry.root), `${sha256(project).slice(0, 16)}.json`),
    value: { capabilities: [], project, version: REUSE_SCHEMA_VERSION },
  };
}

export function syncOutbox(config: PrivateConfig): Record<string, unknown> {
  const files = pendingFiles(config);
  const synced: string[] = [];
  for (const pendingFile of files) {
    const pending: PendingCandidate = readJson(pendingFile, pendingCandidateSchema, "Pending candidate");
    const registry = loadRegistry(config);
    const existing = registry.capabilities.find((capability) => capability.id === pending.capability.id);
    if (existing != null && stableJson(existing) !== stableJson(pending.capability)) {
      throw new ReuseRegistryError(`Central capability conflicts with pending record: ${pending.capability.id}`, "conflict", 4);
    }
    if (existing == null) {
      const owner = canonicalCapabilityFile(registry, pending.capability.project);
      const nextOwner = capabilitiesFileSchema.parse({
        ...owner.value,
        capabilities: [...owner.value.capabilities, pending.capability].sort((left, right) => left.id.localeCompare(right.id)),
      });
      const allCapabilities = [...registry.capabilities, pending.capability];
      validateCapabilities(allCapabilities, registry.projects);
      const nextIndex = deriveIndex(registry.descriptor, allCapabilities);
      replaceFilesAtomically([
        { file: owner.file, next: stableJson(nextOwner) },
        { file: path.join(registry.root, "generated", "capability-index.json"), next: stableJson(nextIndex) },
      ]);
      loadRegistry(config);
    }
    try {
      fs.rmSync(pendingFile, { force: true });
    } catch (error) {
      throw new ReuseRegistryError(`Capability synced but pending cleanup failed: ${pending.capability.id}`, "blocked", 5, { cause: error });
    }
    synced.push(pending.capability.id);
  }
  return { pending: pendingFiles(config).length, registryImpact: synced.length === 0 ? "not-applicable" : "synced", status: "ok", synced };
}

export function pendingCandidateTemplate(capability: Capability): PendingCandidate {
  return pendingCandidateSchema.parse({ capability, createdBy: "reuse-registry-client", status: "pending", version: REUSE_SCHEMA_VERSION });
}
