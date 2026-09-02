import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

type JsonRecord = Record<string, unknown>;

export const BEADS_CAPABILITIES = [
  "version",
  "help",
  "metricsOff",
  "projectInitEmbedded",
  "projectWhere",
  "configList",
  "projectInfo",
  "projectStatus",
  "featureListAllMetadata",
  "featureCreateAtomicCorrelation",
  "dependencyAdd",
  "ready",
  "featureShow",
  "featureUpdateExact",
  "featureAssign",
  "featureClaim",
  "featureClose",
  "featureReopen",
  "featureHistory",
  "doctorEmbedded",
  "sqlEmbedded",
  "workLeases",
  "eventsJournal",
  "federation",
  "httpServer",
] as const;

export type BeadsCapability = typeof BEADS_CAPABILITIES[number];
export type BeadsCapabilityScope = "production" | "spike";
export type BeadsCapabilityStatus = "supported" | "spike-only" | "unsupported";

export type BeadsReleaseManifest = {
  schemaVersion: 1;
  tool: "beads";
  license: "MIT";
  release: {
    version: string;
    buildCommit: string;
    platform: "windows";
    architecture: "amd64";
    archive: { fileName: string; url: string; sha256: string };
    executable: { fileName: "bd.exe"; bytes: number; sha256: string };
  };
  capabilities: Record<BeadsCapability, BeadsCapabilityStatus>;
  initialization: {
    mode: "embedded";
    requiredFlags: string[];
    disallowedFlags: string[];
    requiredTrackedFiles: Array<{ path: string; sha256: string }>;
    allowedCreatedPaths: string[];
    allowedModifiedPaths: string[];
    allowedGitConfig: Array<{ key: string; value: string }>;
    forbiddenEffects: string[];
    metrics: "disabled";
    schemaSkew: "reject";
  };
};

export type BeadsReleaseCandidate = {
  version: string;
  buildCommit: string;
  platform: string;
  architecture: string;
  archiveSha256: string;
  executableBytes: number;
  executableSha256: string;
  requestedCapabilities: string[];
  capabilityScope: BeadsCapabilityScope;
};

export type BeadsInitializationObservation = {
  flags: string[];
  ignoreSchemaSkew: boolean;
  trackedFileDigests: Record<string, string>;
  createdPaths: string[];
  modifiedPaths: string[];
  gitConfig: Record<string, string>;
  forbiddenEffects: string[];
};

export const BEADS_RELEASE_MANIFEST_PATH = fileURLToPath(new URL("./beads-release.manifest.json", import.meta.url));

const SHA256 = /^[a-f0-9]{64}$/u;
const BUILD_COMMIT = /^[a-f0-9]{12}$/u;

function record(value: unknown, label: string): JsonRecord {
  if (value == null || typeof value !== "object" || Array.isArray(value)) throw new Error(`${label} must be an object.`);
  return value as JsonRecord;
}

function exactKeys(value: JsonRecord, expected: readonly string[], label: string): void {
  const actual = Object.keys(value).sort();
  const wanted = [...expected].sort();
  if (actual.length !== wanted.length || actual.some((key, index) => key !== wanted[index])) {
    throw new Error(`${label} must contain exactly: ${wanted.join(", ")}.`);
  }
}

function text(value: unknown, label: string): string {
  if (typeof value !== "string" || value.trim() === "") throw new Error(`${label} must be a non-empty string.`);
  return value;
}

function literal<T extends string>(value: unknown, expected: T, label: string): T {
  if (value !== expected) throw new Error(`${label} must be '${expected}'.`);
  return expected;
}

function digest(value: unknown, label: string): string {
  const selected = text(value, label);
  if (!SHA256.test(selected)) throw new Error(`${label} must be a lowercase SHA-256 digest.`);
  return selected;
}

function nonNegativeInteger(value: unknown, label: string): number {
  if (!Number.isSafeInteger(value) || (value as number) < 0) throw new Error(`${label} must be a non-negative integer.`);
  return value as number;
}

function uniqueStrings(value: unknown, label: string): string[] {
  if (!Array.isArray(value)) throw new Error(`${label} must be an array.`);
  const selected = value.map((item, index) => text(item, `${label}.${index}`));
  if (new Set(selected).size !== selected.length) throw new Error(`${label} must not contain duplicates.`);
  return selected;
}

function repositoryRelative(value: unknown, label: string): string {
  const selected = text(value, label).replaceAll("\\", "/");
  if (selected.startsWith("/") || /^[A-Za-z]:/u.test(selected) || selected.split("/").includes("..")) {
    throw new Error(`${label} must be a repository-relative path without parent traversal.`);
  }
  return selected;
}

function trackedFile(value: unknown, label: string): { path: string; sha256: string } {
  const input = record(value, label);
  exactKeys(input, ["path", "sha256"], label);
  return { path: repositoryRelative(input.path, `${label}.path`), sha256: digest(input.sha256, `${label}.sha256`) };
}

function gitConfig(value: unknown, label: string): { key: string; value: string } {
  const input = record(value, label);
  exactKeys(input, ["key", "value"], label);
  return { key: text(input.key, `${label}.key`), value: text(input.value, `${label}.value`) };
}

function parseCapabilities(value: unknown): Record<BeadsCapability, BeadsCapabilityStatus> {
  const input = record(value, "capabilities");
  exactKeys(input, BEADS_CAPABILITIES, "capabilities");
  return Object.fromEntries(BEADS_CAPABILITIES.map((name) => {
    const status = input[name];
    if (status !== "supported" && status !== "spike-only" && status !== "unsupported") {
      throw new Error(`capabilities.${name} has an unsupported status.`);
    }
    return [name, status];
  })) as Record<BeadsCapability, BeadsCapabilityStatus>;
}

export function parseBeadsReleaseManifest(value: unknown): BeadsReleaseManifest {
  const input = record(value, "Beads release manifest");
  exactKeys(input, ["capabilities", "initialization", "license", "release", "schemaVersion", "tool"], "Beads release manifest");
  if (input.schemaVersion !== 1) throw new Error("Beads release manifest schemaVersion must be 1.");

  const release = record(input.release, "release");
  exactKeys(release, ["architecture", "archive", "buildCommit", "executable", "platform", "version"], "release");
  const buildCommit = text(release.buildCommit, "release.buildCommit");
  if (!BUILD_COMMIT.test(buildCommit)) throw new Error("release.buildCommit must be a 12-character lowercase Git commit.");
  const archive = record(release.archive, "release.archive");
  exactKeys(archive, ["fileName", "sha256", "url"], "release.archive");
  const executable = record(release.executable, "release.executable");
  exactKeys(executable, ["bytes", "fileName", "sha256"], "release.executable");

  const initialization = record(input.initialization, "initialization");
  exactKeys(initialization, [
    "allowedCreatedPaths",
    "allowedGitConfig",
    "allowedModifiedPaths",
    "disallowedFlags",
    "forbiddenEffects",
    "metrics",
    "mode",
    "requiredFlags",
    "requiredTrackedFiles",
    "schemaSkew",
  ], "initialization");
  if (!Array.isArray(initialization.requiredTrackedFiles)) throw new Error("initialization.requiredTrackedFiles must be an array.");
  if (!Array.isArray(initialization.allowedGitConfig)) throw new Error("initialization.allowedGitConfig must be an array.");

  return {
    schemaVersion: 1,
    tool: literal(input.tool, "beads", "tool"),
    license: literal(input.license, "MIT", "license"),
    release: {
      version: text(release.version, "release.version"),
      buildCommit,
      platform: literal(release.platform, "windows", "release.platform"),
      architecture: literal(release.architecture, "amd64", "release.architecture"),
      archive: {
        fileName: text(archive.fileName, "release.archive.fileName"),
        url: text(archive.url, "release.archive.url"),
        sha256: digest(archive.sha256, "release.archive.sha256"),
      },
      executable: {
        fileName: literal(executable.fileName, "bd.exe", "release.executable.fileName"),
        bytes: nonNegativeInteger(executable.bytes, "release.executable.bytes"),
        sha256: digest(executable.sha256, "release.executable.sha256"),
      },
    },
    capabilities: parseCapabilities(input.capabilities),
    initialization: {
      mode: literal(initialization.mode, "embedded", "initialization.mode"),
      requiredFlags: uniqueStrings(initialization.requiredFlags, "initialization.requiredFlags"),
      disallowedFlags: uniqueStrings(initialization.disallowedFlags, "initialization.disallowedFlags"),
      requiredTrackedFiles: initialization.requiredTrackedFiles.map((item, index) => trackedFile(item, `initialization.requiredTrackedFiles.${index}`)),
      allowedCreatedPaths: uniqueStrings(initialization.allowedCreatedPaths, "initialization.allowedCreatedPaths").map((item, index) => repositoryRelative(item, `initialization.allowedCreatedPaths.${index}`)),
      allowedModifiedPaths: uniqueStrings(initialization.allowedModifiedPaths, "initialization.allowedModifiedPaths").map((item, index) => repositoryRelative(item, `initialization.allowedModifiedPaths.${index}`)),
      allowedGitConfig: initialization.allowedGitConfig.map((item, index) => gitConfig(item, `initialization.allowedGitConfig.${index}`)),
      forbiddenEffects: uniqueStrings(initialization.forbiddenEffects, "initialization.forbiddenEffects"),
      metrics: literal(initialization.metrics, "disabled", "initialization.metrics"),
      schemaSkew: literal(initialization.schemaSkew, "reject", "initialization.schemaSkew"),
    },
  };
}

export function loadBeadsReleaseManifest(manifestPath = BEADS_RELEASE_MANIFEST_PATH): BeadsReleaseManifest {
  const absolute = path.resolve(manifestPath);
  const stat = fs.lstatSync(absolute, { throwIfNoEntry: false });
  if (stat == null || !stat.isFile() || stat.isSymbolicLink()) throw new Error("Beads release manifest must be a regular file.");
  try {
    return parseBeadsReleaseManifest(JSON.parse(fs.readFileSync(absolute, "utf8")));
  } catch (error) {
    throw new Error(`Failed to load Beads release manifest '${absolute}'.`, { cause: error });
  }
}

export function requireBeadsCapability(
  manifest: BeadsReleaseManifest,
  capability: string,
  scope: BeadsCapabilityScope,
): BeadsCapabilityStatus {
  if (!BEADS_CAPABILITIES.includes(capability as BeadsCapability)) {
    throw new Error(`Beads capability '${capability}' is not in the reviewed matrix.`);
  }
  const status = manifest.capabilities[capability as BeadsCapability];
  if (status === "unsupported") throw new Error(`Beads capability '${capability}' is unavailable in the pinned release.`);
  if (status === "spike-only" && scope !== "spike") throw new Error(`Beads capability '${capability}' is limited to the disposable spike.`);
  return status;
}

export function validateBeadsReleaseCandidate(
  manifest: BeadsReleaseManifest,
  candidate: BeadsReleaseCandidate,
): BeadsReleaseManifest {
  const expected = manifest.release;
  const comparisons: Array<[string, unknown, unknown]> = [
    ["version", candidate.version, expected.version],
    ["build commit", candidate.buildCommit, expected.buildCommit],
    ["platform", candidate.platform, expected.platform],
    ["architecture", candidate.architecture, expected.architecture],
    ["archive SHA-256", candidate.archiveSha256, expected.archive.sha256],
    ["executable bytes", candidate.executableBytes, expected.executable.bytes],
    ["executable SHA-256", candidate.executableSha256, expected.executable.sha256],
  ];
  for (const [label, actual, wanted] of comparisons) {
    if (actual !== wanted) throw new Error(`Beads ${label} does not match the reviewed release.`);
  }
  for (const capability of candidate.requestedCapabilities) requireBeadsCapability(manifest, capability, candidate.capabilityScope);
  return manifest;
}

export function validateBeadsInitializationObservation(
  manifest: BeadsReleaseManifest,
  observation: BeadsInitializationObservation,
): void {
  const policy = manifest.initialization;
  if (observation.ignoreSchemaSkew || observation.flags.includes("--ignore-schema-skew")) {
    throw new Error("Beads schema skew must remain fail-closed.");
  }
  const actualFlags = new Set(observation.flags);
  const acceptedFlags = new Set(policy.requiredFlags);
  for (const required of acceptedFlags) if (!actualFlags.has(required)) throw new Error(`Beads initialization is missing required flag '${required}'.`);
  for (const actual of actualFlags) if (!acceptedFlags.has(actual)) throw new Error(`Beads initialization flag '${actual}' is not reviewed.`);
  for (const disallowed of policy.disallowedFlags) if (actualFlags.has(disallowed)) throw new Error(`Beads initialization flag '${disallowed}' is forbidden.`);

  for (const required of policy.requiredTrackedFiles) {
    if (observation.trackedFileDigests[required.path] !== required.sha256) {
      throw new Error(`Beads initialization requires the reviewed '${required.path}' digest.`);
    }
  }
  const allowedCreated = new Set(policy.allowedCreatedPaths);
  for (const created of observation.createdPaths.map((item, index) => repositoryRelative(item, `createdPaths.${index}`))) {
    if (!allowedCreated.has(created)) throw new Error(`Beads initialization created unreviewed path '${created}'.`);
  }
  const allowedModified = new Set(policy.allowedModifiedPaths);
  for (const modified of observation.modifiedPaths.map((item, index) => repositoryRelative(item, `modifiedPaths.${index}`))) {
    if (!allowedModified.has(modified)) throw new Error(`Beads initialization modified unreviewed path '${modified}'.`);
  }
  const allowedConfig = new Map(policy.allowedGitConfig.map((row) => [row.key, row.value]));
  for (const [key, value] of Object.entries(observation.gitConfig)) {
    if (allowedConfig.get(key) !== value) throw new Error(`Beads initialization changed unreviewed Git config '${key}'.`);
  }
  if (observation.forbiddenEffects.length > 0) {
    throw new Error(`Beads initialization observed forbidden effects: ${observation.forbiddenEffects.join(", ")}.`);
  }
}
