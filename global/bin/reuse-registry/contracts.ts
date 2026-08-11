import path from "node:path";
import { z } from "zod";

export const REUSE_SCHEMA_VERSION = 1 as const;
export const REUSE_SCANNER_VERSION = 1 as const;
export const DEFAULT_QUERY_LIMIT = 10;
export const MAX_QUERY_LIMIT = 50;

const logicalIdPattern = /^[a-z0-9](?:[a-z0-9._-]|\/(?!\/))*[a-z0-9]$|^[a-z0-9]$/;
const fullGitObjectPattern = /^[0-9a-f]{40}$/;

export const logicalIdSchema = z.string().min(1).max(120).regex(logicalIdPattern).refine(
  (value) => value.split("/").every((segment) => segment !== "." && segment !== ".." && segment !== ""),
  "logical ID contains an invalid path segment",
);

export const safeRelativePathSchema = z.string().min(1).max(500).transform((value) => value.replaceAll("\\", "/")).pipe(
  z.string().refine((value) => {
    if (path.posix.isAbsolute(value) || /^[A-Za-z]:/.test(value)) return false;
    const segments = value.split("/");
    return segments.every((segment) => segment !== "" && segment !== "." && segment !== "..");
  }, "path must be normalized, relative, and contained"),
);

const absolutePathSchema = z.string().min(1).max(1000).refine((value) => path.isAbsolute(value), "path must be absolute");
const boundedText = z.string().trim().min(1).max(300);
const boundedList = z.array(z.string().trim().min(1).max(160)).max(24);

export const entrypointSchema = z.object({
  command: z.string().trim().min(1).max(240).optional(),
  path: safeRelativePathSchema,
  symbol: z.string().trim().min(1).max(160).optional(),
}).strict().refine((value) => Number(value.command != null) + Number(value.symbol != null) === 1, {
  message: "entrypoint must define exactly one symbol or command",
});

export const evidenceSchema = z.object({
  path: safeRelativePathSchema,
}).strict();

export const capabilitySchema = z.object({
  constraints: boundedList,
  effects: z.array(z.enum(["none", "filesystem-read", "filesystem-write", "network", "process", "environment", "external-state"])).min(1).max(12),
  entrypoints: z.array(entrypointSchema).min(1).max(12),
  evidence: z.array(evidenceSchema).min(1).max(12),
  external: z.object({
    ecosystem: z.string().trim().min(1).max(80),
    package: z.string().trim().min(1).max(160),
    versionRange: z.string().trim().min(1).max(120),
  }).strict().optional(),
  id: logicalIdSchema,
  keywords: z.array(z.string().trim().min(1).max(80)).min(1).max(24),
  kind: z.enum(["library", "tool", "service", "adapter", "protocol", "external-library"]),
  maturity: z.enum(["local-reusable", "portable-proven", "adopted-external"]),
  project: logicalIdSchema,
  qualification: z.object({
    basis: z.enum(["standalone-tool", "two-consumers", "unrelated-project-proof", "adopted-dependency"]),
    consumers: z.array(z.string().trim().min(1).max(160)).max(12).default([]),
  }).strict().optional(),
  replacement: logicalIdSchema.optional(),
  status: z.enum(["active", "deprecated"]),
  summary: boundedText,
}).strict();

export const registryDescriptorSchema = z.object({
  id: logicalIdSchema,
  version: z.literal(REUSE_SCHEMA_VERSION),
}).strict();

export const projectDescriptorSchema = z.object({
  id: logicalIdSchema,
  repository: z.string().trim().min(1).max(300),
}).strict();

export const projectsFileSchema = z.object({
  projects: z.array(projectDescriptorSchema).max(500),
  version: z.literal(REUSE_SCHEMA_VERSION),
}).strict();

export const groupSchema = z.object({
  id: logicalIdSchema,
  projects: z.array(logicalIdSchema).max(500),
}).strict();

export const groupsFileSchema = z.object({
  groups: z.array(groupSchema).max(200),
  version: z.literal(REUSE_SCHEMA_VERSION),
}).strict();

export const capabilitiesFileSchema = z.object({
  capabilities: z.array(capabilitySchema).max(500),
  project: logicalIdSchema,
  version: z.literal(REUSE_SCHEMA_VERSION),
}).strict();

export const capabilityIndexSchema = z.object({
  capabilities: z.array(capabilitySchema).max(10_000),
  registry: logicalIdSchema,
  version: z.literal(REUSE_SCHEMA_VERSION),
}).strict();

export const privateConfigSchema = z.object({
  cacheRoot: absolutePathSchema,
  enabledGroups: z.array(logicalIdSchema).min(1).max(100),
  outboxRoot: absolutePathSchema,
  projects: z.record(logicalIdSchema, z.object({
    codebaseMemoryProject: z.string().trim().min(1).max(240).optional(),
    root: absolutePathSchema,
    scanRef: z.string().trim().min(1).max(300),
  }).strict()),
  registryRoot: absolutePathSchema,
  version: z.literal(REUSE_SCHEMA_VERSION),
}).strict();

export const resolvedPlanSchema = z.object({
  group: logicalIdSchema,
  mode: z.enum(["initial", "incremental", "no-op", "full-fallback"]),
  operation: z.enum(["bootstrap", "rescan"]),
  projects: z.array(z.object({
    codebaseMemoryProject: z.string().trim().min(1).max(240).optional(),
    commit: z.string().regex(fullGitObjectPattern),
    id: logicalIdSchema,
    root: absolutePathSchema,
    scanRef: z.string().trim().min(1).max(300),
    tree: z.string().regex(fullGitObjectPattern),
  }).strict()).min(1).max(100),
  registry: logicalIdSchema,
  tempParent: absolutePathSchema,
  version: z.literal(REUSE_SCHEMA_VERSION),
}).strict();

export const generatedEntrypointSchema = z.object({
  command: z.string().trim().min(1).max(240).optional(),
  owner: z.string().trim().min(1).max(240),
  path: safeRelativePathSchema,
  symbol: z.string().trim().min(1).max(160).optional(),
}).strict().refine((value) => Number(value.command != null) + Number(value.symbol != null) === 1, {
  message: "generated entrypoint must define exactly one symbol or command",
});

export const generatedCandidateSchema = z.object({
  entrypoint: generatedEntrypointSchema,
  evidence: z.array(safeRelativePathSchema).min(1).max(12),
  id: logicalIdSchema,
  state: z.enum(["discovered", "changed", "stale", "unchanged"]),
  summary: boundedText,
}).strict();

export const generatedProjectSchema = z.object({
  candidates: z.array(generatedCandidateSchema).max(2000),
  inventory: z.object({
    buildFiles: z.array(safeRelativePathSchema).max(1000),
    commands: z.array(z.object({ name: z.string().trim().min(1).max(160), value: z.string().max(1000) }).strict()).max(500),
    dependencies: z.array(z.object({ name: z.string().trim().min(1).max(200), scope: z.enum(["runtime", "development", "optional", "peer"]) }).strict()).max(5000),
    docs: z.array(safeRelativePathSchema).max(5000),
    entrypoints: z.array(generatedEntrypointSchema).max(5000),
    manifests: z.array(safeRelativePathSchema).max(1000),
    packages: z.array(z.object({ manifest: safeRelativePathSchema, root: z.string().max(500) }).strict()).max(1000),
    proofs: z.array(safeRelativePathSchema).max(5000),
    sourceFiles: z.array(safeRelativePathSchema).max(50_000),
    specs: z.array(safeRelativePathSchema).max(5000),
    tests: z.array(safeRelativePathSchema).max(20_000),
    unsupported: z.array(z.string().trim().min(1).max(200)).max(100),
  }).strict(),
  project: logicalIdSchema,
  repository: z.string().trim().min(1).max(300),
  scanState: z.object({
    lastSuccessfulCommit: z.string().regex(fullGitObjectPattern),
    mode: z.enum(["initial", "incremental", "no-op", "full-fallback"]),
    scanPolicyHash: z.string().regex(/^[0-9a-f]{64}$/),
    scanRef: z.string().trim().min(1).max(300),
    scannerVersion: z.literal(REUSE_SCANNER_VERSION),
    schemaVersion: z.literal(REUSE_SCHEMA_VERSION),
    tree: z.string().regex(fullGitObjectPattern),
  }).strict(),
  version: z.literal(REUSE_SCHEMA_VERSION),
}).strict();

export const pendingCandidateSchema = z.object({
  capability: capabilitySchema,
  createdBy: z.literal("reuse-registry-client"),
  status: z.literal("pending"),
  version: z.literal(REUSE_SCHEMA_VERSION),
}).strict();

export type Capability = z.infer<typeof capabilitySchema>;
export type CapabilityIndex = z.infer<typeof capabilityIndexSchema>;
export type CapabilitiesFile = z.infer<typeof capabilitiesFileSchema>;
export type GeneratedProject = z.infer<typeof generatedProjectSchema>;
export type GroupsFile = z.infer<typeof groupsFileSchema>;
export type PendingCandidate = z.infer<typeof pendingCandidateSchema>;
export type PrivateConfig = z.infer<typeof privateConfigSchema>;
export type ProjectsFile = z.infer<typeof projectsFileSchema>;
export type RegistryDescriptor = z.infer<typeof registryDescriptorSchema>;
export type ResolvedPlan = z.infer<typeof resolvedPlanSchema>;
