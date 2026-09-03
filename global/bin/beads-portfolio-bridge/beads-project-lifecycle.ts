import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import { runPortableCommand } from "../portable-process.ts";
import {
  acquireBeadsBridgeWriterLease,
  inspectBeadsBridgeCoordination,
  loadBeadsBridgeRegistration,
  releaseBeadsBridgeWriterLease,
  setBeadsBridgeRegistrationEnabled,
} from "./beads-bridge-registration.ts";
import type {
  BeadsBridgeProcessIdentity,
  BeadsBridgeRegistration,
  BeadsBridgeWriterLease,
} from "./beads-bridge-registration.ts";
import { BeadsAdapterError, buildBeadsAdapterInvocation, runBeadsAdapter } from "./beads-vendor-adapter.ts";
import type { BeadsAdapterDependencies, BeadsAdapterResponse } from "./beads-vendor-adapter.ts";
import { loadBeadsReleaseManifest, validateBeadsInitializationObservation, validateBeadsTrackedFilePrerequisite } from "./beads-release.ts";

type FileIdentity = { bytes: number; sha256: string };
type TreeIdentity = { exists: boolean; bytes: number; files: number; sha256: string | null };
type GitSnapshot = {
  tracked: Record<string, FileIdentity>;
  indexSha256: string;
  worktreeSha256: string;
  statusSha256: string;
  hooks: Record<string, FileIdentity>;
  remotes: string[];
  config: Record<string, string[]>;
  configSha256: string;
  exclude: { exists: boolean; bytes: number; sha256: string | null; contentBase64: string };
  store: TreeIdentity;
  rootEntries: string[];
  externalBoundarySha256: string | null;
  installed: { binary: "match" | "missing" | "drift"; adapter: "match" | "missing" | "drift"; profileSha256: string };
};

type LifecycleRecord = {
  schemaVersion: 1;
  projectRef: string;
  registrationSha256: string;
  status: "enabled" | "disabled" | "rolled-back";
  before: GitSnapshot;
  enabled: GitSnapshot;
  excludeAddedLines: string[];
  createdAt: string;
  updatedAt: string;
};

export type BeadsProjectLifecycleRequest = {
  operation: "preview" | "enable" | "disable" | "check" | "rollback";
  registrationFile: string;
  processIdentity?: BeadsBridgeProcessIdentity;
};

export type BeadsProjectLifecycleDependencies = {
  adapter?: BeadsAdapterDependencies;
  fileIdentity?: (file: string) => FileIdentity;
  captureExternalBoundary?: () => string;
};

export type BeadsProjectLifecycleResult = {
  schemaVersion: 1;
  operation: BeadsProjectLifecycleRequest["operation"];
  projectRef: string;
  status: "preview" | "enabled" | "disabled" | "current" | "rolled-back" | "partial-unknown";
  registrationEnabled: boolean;
  storePreserved: boolean;
  drift: string[];
  invocation: null | { argv: string[]; timeoutMs: number };
  observation: {
    trackedSha256: string;
    indexSha256: string;
    worktreeSha256: string;
    hooksSha256: string;
    remotesSha256: string;
    configSha256: string;
    excludeSha256: string | null;
    storeSha256: string | null;
    storeFiles: number;
    processCleanup: "terminal" | "not-needed" | "not-run";
  };
};

export class BeadsProjectLifecycleError extends Error {
  readonly code: string;

  constructor(message: string, code: string, options: { cause?: unknown } = {}) {
    super(message, options.cause == null ? undefined : { cause: options.cause });
    this.name = "BeadsProjectLifecycleError";
    this.code = code;
  }
}

const SHA256 = /^[a-f0-9]{64}$/u;
const MAX_TRACKED_FILES = 20_000;
const MAX_STORE_FILES = 50_000;
const MAX_LOCAL_FILE_BYTES = 1_000_000;
const MAX_RECORD_BYTES = 5_000_000;
const SAFE_PROJECT_REF = /^project_[a-f0-9]{32}$/u;
const SAFE_RELATIVE = /^(?!.*(?:^|[\\/])\.\.(?:[\\/]|$))[^\0:]+$/u;

function stableValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stableValue);
  if (value == null || typeof value !== "object") return value;
  return Object.fromEntries(Object.entries(value as Record<string, unknown>).sort(([left], [right]) => left.localeCompare(right)).map(([key, item]) => [key, stableValue(item)]));
}

function stableJson(value: unknown): string {
  return `${JSON.stringify(stableValue(value), null, 2)}\n`;
}

function sha256(value: string | Buffer): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function digestFile(file: string): string {
  const digest = crypto.createHash("sha256");
  const descriptor = fs.openSync(file, "r");
  const buffer = Buffer.allocUnsafe(1024 * 1024);
  try {
    for (;;) {
      const bytes = fs.readSync(descriptor, buffer, 0, buffer.length, null);
      if (bytes === 0) break;
      digest.update(buffer.subarray(0, bytes));
    }
  } finally {
    fs.closeSync(descriptor);
  }
  return digest.digest("hex");
}

function defaultFileIdentity(file: string): FileIdentity {
  const stat = fs.lstatSync(file, { throwIfNoEntry: false });
  if (stat == null || !stat.isFile() || stat.isSymbolicLink()) throw new Error("Expected a regular file.");
  return { bytes: stat.size, sha256: digestFile(file) };
}

function samePath(left: string, right: string): boolean {
  return path.resolve(left).toLowerCase() === path.resolve(right).toLowerCase();
}

function git(root: string, args: string[]): string {
  const result = runPortableCommand(root, ["git", ...args], { capture: true, timeoutMs: 15_000 });
  if (result.status !== 0 || result.error != null || result.timedOut || result.cleanupState === "unknown") {
    throw new Error(`Git observation failed for '${args[0] ?? "command"}'.`, { cause: result.error ?? new Error(result.stderr.trim() || `exit ${String(result.status)}`) });
  }
  return result.stdout;
}

function fileOrEmpty(file: string): Buffer {
  const stat = fs.lstatSync(file, { throwIfNoEntry: false });
  if (stat == null) return Buffer.alloc(0);
  if (!stat.isFile() || stat.isSymbolicLink() || stat.size > MAX_LOCAL_FILE_BYTES) throw new Error("Local Git control file is unsafe or oversized.");
  return fs.readFileSync(file);
}

function trackedFiles(root: string, identity: (file: string) => FileIdentity): Record<string, FileIdentity> {
  const names = git(root, ["ls-files", "-z"]).split("\0").filter(Boolean).sort();
  if (names.length > MAX_TRACKED_FILES) throw new Error("Tracked-file observation exceeded its bound.");
  return Object.fromEntries(names.map((name) => {
    const file = path.resolve(root, name);
    const relative = path.relative(root, file).replaceAll("\\", "/");
    if (relative.startsWith("../") || path.isAbsolute(relative)) throw new Error("Tracked path escaped the project root.");
    return [relative, identity(file)];
  }));
}

function hookFiles(root: string, identity: (file: string) => FileIdentity): Record<string, FileIdentity> {
  const directory = path.join(root, ".git", "hooks");
  if (!fs.existsSync(directory)) return {};
  const stat = fs.lstatSync(directory);
  if (!stat.isDirectory() || stat.isSymbolicLink()) throw new Error("Git hooks directory is unsafe.");
  return Object.fromEntries(fs.readdirSync(directory, { withFileTypes: true })
    .filter((entry) => entry.isFile() && !entry.isSymbolicLink())
    .map((entry) => [entry.name, identity(path.join(directory, entry.name))])
    .sort(([left], [right]) => left.localeCompare(right)));
}

function config(root: string): Record<string, string[]> {
  const output = git(root, ["config", "--local", "--null", "--list"]);
  const result: Record<string, string[]> = {};
  for (const row of output.split("\0").filter(Boolean)) {
    const separator = row.indexOf("\n");
    if (separator < 1) throw new Error("Local Git config output is malformed.");
    const key = row.slice(0, separator);
    const value = row.slice(separator + 1);
    (result[key] ??= []).push(value);
  }
  return Object.fromEntries(Object.entries(result).sort(([left], [right]) => left.localeCompare(right)).map(([key, values]) => [key, [...values].sort()]));
}

function treeIdentity(root: string): TreeIdentity {
  const stat = fs.lstatSync(root, { throwIfNoEntry: false });
  if (stat == null) return { exists: false, bytes: 0, files: 0, sha256: null };
  if (!stat.isDirectory() || stat.isSymbolicLink()) throw new Error("Beads store is unsafe.");
  const rows: Array<{ path: string; bytes: number; sha256: string }> = [];
  const pending = [root];
  while (pending.length > 0) {
    const directory = pending.pop()!;
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const absolute = path.join(directory, entry.name);
      if (entry.isSymbolicLink()) throw new Error("Beads store contains a symbolic link.");
      if (entry.isDirectory()) pending.push(absolute);
      else if (entry.isFile()) {
        const item = defaultFileIdentity(absolute);
        rows.push({ path: path.relative(root, absolute).replaceAll("\\", "/"), ...item });
        if (rows.length > MAX_STORE_FILES) throw new Error("Beads store observation exceeded its file bound.");
      } else throw new Error("Beads store contains an unsupported entry.");
    }
  }
  rows.sort((left, right) => left.path.localeCompare(right.path));
  return { exists: true, bytes: rows.reduce((sum, row) => sum + row.bytes, 0), files: rows.length, sha256: sha256(stableJson(rows)) };
}

function installedState(registration: BeadsBridgeRegistration, identity: (file: string) => FileIdentity): GitSnapshot["installed"] {
  const match = (file: string, expected: string): "match" | "missing" | "drift" => {
    if (!fs.existsSync(file)) return "missing";
    try {
      return identity(file).sha256 === expected ? "match" : "drift";
    } catch {
      return "drift";
    }
  };
  return {
    binary: match(registration.binaryPath, registration.binarySha256),
    adapter: match(registration.adapterPath, registration.adapterSha256),
    profileSha256: registration.profileSha256,
  };
}

function snapshot(registration: BeadsBridgeRegistration, dependencies: BeadsProjectLifecycleDependencies): GitSnapshot {
  const identity = dependencies.fileIdentity ?? defaultFileIdentity;
  const root = registration.projectRoot;
  const excludeFile = path.join(root, ".git", "info", "exclude");
  const exclude = fileOrEmpty(excludeFile);
  const localConfig = config(root);
  return {
    tracked: trackedFiles(root, identity),
    indexSha256: sha256(git(root, ["diff", "--cached", "--binary", "--no-ext-diff"])),
    worktreeSha256: sha256(git(root, ["diff", "--binary", "--no-ext-diff"])),
    statusSha256: sha256(git(root, ["status", "--porcelain=v1", "-z", "--untracked-files=all"])),
    hooks: hookFiles(root, identity),
    remotes: git(root, ["remote", "-v"]).split(/\r?\n/u).filter(Boolean).sort(),
    config: localConfig,
    configSha256: sha256(stableJson(localConfig)),
    exclude: { exists: fs.existsSync(excludeFile), bytes: exclude.length, sha256: fs.existsSync(excludeFile) ? sha256(exclude) : null, contentBase64: exclude.toString("base64") },
    store: treeIdentity(path.join(root, ".beads")),
    rootEntries: fs.readdirSync(root).filter((name) => name !== ".git").sort(),
    externalBoundarySha256: dependencies.captureExternalBoundary?.() ?? null,
    installed: installedState(registration, identity),
  };
}

function recordPath(registrationFile: string, registration: BeadsBridgeRegistration): string {
  return path.join(path.dirname(path.resolve(registrationFile)), "beads-bridge", registration.projectRef.slice("project_".length), "project-lifecycle.json");
}

function exactKeys(value: Record<string, unknown>, expected: string[], label: string): void {
  const actual = Object.keys(value).sort();
  const keys = [...expected].sort();
  if (actual.length !== keys.length || actual.some((key, index) => key !== keys[index])) throw new Error(`${label} fields are invalid.`);
}

function recordObject(value: unknown, label: string): Record<string, unknown> {
  if (value == null || typeof value !== "object" || Array.isArray(value)) throw new Error(`${label} must be an object.`);
  return value as Record<string, unknown>;
}

function identityMap(value: unknown, label: string): Record<string, FileIdentity> {
  const source = recordObject(value, label);
  const rows: Record<string, FileIdentity> = {};
  for (const [name, raw] of Object.entries(source)) {
    if (!SAFE_RELATIVE.test(name) || path.isAbsolute(name)) throw new Error(`${label} path is invalid.`);
    const item = recordObject(raw, `${label}.${name}`);
    exactKeys(item, ["bytes", "sha256"], `${label}.${name}`);
    if (!Number.isInteger(item.bytes) || (item.bytes as number) < 0) throw new Error(`${label} bytes are invalid.`);
    if (typeof item.sha256 !== "string" || !SHA256.test(item.sha256)) throw new Error(`${label} digest is invalid.`);
    rows[name] = { bytes: item.bytes as number, sha256: item.sha256 };
  }
  return rows;
}

function stringArray(value: unknown, label: string, maximum = 20_000): string[] {
  if (!Array.isArray(value) || value.length > maximum || value.some((item) => typeof item !== "string" || item.length > MAX_LOCAL_FILE_BYTES || item.includes("\0"))) {
    throw new Error(`${label} is invalid.`);
  }
  return value as string[];
}

function parseSnapshot(value: unknown, label: string): GitSnapshot {
  const source = recordObject(value, label);
  exactKeys(source, ["tracked", "indexSha256", "worktreeSha256", "statusSha256", "hooks", "remotes", "config", "configSha256", "exclude", "store", "rootEntries", "externalBoundarySha256", "installed"], label);
  for (const key of ["indexSha256", "worktreeSha256", "statusSha256", "configSha256"] as const) {
    if (typeof source[key] !== "string" || !SHA256.test(source[key])) throw new Error(`${label}.${key} is invalid.`);
  }
  const configSource = recordObject(source.config, `${label}.config`);
  const parsedConfig = Object.fromEntries(Object.entries(configSource).map(([key, values]) => {
    if (!/^[A-Za-z0-9][A-Za-z0-9.-]{0,127}$/u.test(key)) throw new Error(`${label}.config key is invalid.`);
    return [key, stringArray(values, `${label}.config.${key}`, 64)];
  }));
  if (sha256(stableJson(parsedConfig)) !== source.configSha256) throw new Error(`${label}.config does not match its digest.`);
  const exclude = recordObject(source.exclude, `${label}.exclude`);
  exactKeys(exclude, ["exists", "bytes", "sha256", "contentBase64"], `${label}.exclude`);
  if (typeof exclude.exists !== "boolean" || !Number.isInteger(exclude.bytes) || (exclude.bytes as number) < 0 || (exclude.bytes as number) > MAX_LOCAL_FILE_BYTES) throw new Error(`${label}.exclude identity is invalid.`);
  if (exclude.sha256 !== null && (typeof exclude.sha256 !== "string" || !SHA256.test(exclude.sha256))) throw new Error(`${label}.exclude digest is invalid.`);
  if (typeof exclude.contentBase64 !== "string") throw new Error(`${label}.exclude content is invalid.`);
  const excludeBytes = Buffer.from(exclude.contentBase64, "base64");
  if (excludeBytes.toString("base64") !== exclude.contentBase64 || excludeBytes.length !== exclude.bytes || (exclude.exists ? sha256(excludeBytes) !== exclude.sha256 : excludeBytes.length !== 0 || exclude.sha256 !== null)) {
    throw new Error(`${label}.exclude content does not match its identity.`);
  }
  const store = recordObject(source.store, `${label}.store`);
  exactKeys(store, ["exists", "bytes", "files", "sha256"], `${label}.store`);
  if (typeof store.exists !== "boolean" || !Number.isInteger(store.bytes) || (store.bytes as number) < 0 || !Number.isInteger(store.files) || (store.files as number) < 0 || (store.files as number) > MAX_STORE_FILES) throw new Error(`${label}.store identity is invalid.`);
  if (store.sha256 !== null && (typeof store.sha256 !== "string" || !SHA256.test(store.sha256))) throw new Error(`${label}.store digest is invalid.`);
  const installed = recordObject(source.installed, `${label}.installed`);
  exactKeys(installed, ["binary", "adapter", "profileSha256"], `${label}.installed`);
  if ((installed.binary !== "match" && installed.binary !== "missing" && installed.binary !== "drift") || (installed.adapter !== "match" && installed.adapter !== "missing" && installed.adapter !== "drift") || typeof installed.profileSha256 !== "string" || !SHA256.test(installed.profileSha256)) {
    throw new Error(`${label}.installed identity is invalid.`);
  }
  if (source.externalBoundarySha256 !== null && (typeof source.externalBoundarySha256 !== "string" || !SHA256.test(source.externalBoundarySha256))) throw new Error(`${label}.externalBoundarySha256 is invalid.`);
  return {
    tracked: identityMap(source.tracked, `${label}.tracked`),
    indexSha256: source.indexSha256 as string,
    worktreeSha256: source.worktreeSha256 as string,
    statusSha256: source.statusSha256 as string,
    hooks: identityMap(source.hooks, `${label}.hooks`),
    remotes: stringArray(source.remotes, `${label}.remotes`, 64),
    config: parsedConfig,
    configSha256: source.configSha256 as string,
    exclude: { exists: exclude.exists, bytes: exclude.bytes as number, sha256: exclude.sha256 as string | null, contentBase64: exclude.contentBase64 },
    store: { exists: store.exists, bytes: store.bytes as number, files: store.files as number, sha256: store.sha256 as string | null },
    rootEntries: stringArray(source.rootEntries, `${label}.rootEntries`).map((name) => {
      if (!SAFE_RELATIVE.test(name) || name.includes("/") || name.includes("\\")) throw new Error(`${label}.rootEntries path is invalid.`);
      return name;
    }),
    externalBoundarySha256: source.externalBoundarySha256 as string | null,
    installed: { binary: installed.binary, adapter: installed.adapter, profileSha256: installed.profileSha256 },
  };
}

function readRecord(file: string, registration: BeadsBridgeRegistration, registrationSha256: string): LifecycleRecord | null {
  const stat = fs.lstatSync(file, { throwIfNoEntry: false });
  if (stat == null) return null;
  if (!stat.isFile() || stat.isSymbolicLink() || stat.size > MAX_RECORD_BYTES) throw new Error("Project lifecycle record is unsafe or oversized.");
  const source = recordObject(JSON.parse(fs.readFileSync(file, "utf8")), "project lifecycle record");
  exactKeys(source, ["schemaVersion", "projectRef", "registrationSha256", "status", "before", "enabled", "excludeAddedLines", "createdAt", "updatedAt"], "project lifecycle record");
  if (source.schemaVersion !== 1 || source.projectRef !== registration.projectRef || source.registrationSha256 !== registrationSha256 || !SAFE_PROJECT_REF.test(String(source.projectRef)) || typeof source.registrationSha256 !== "string" || !SHA256.test(source.registrationSha256)) throw new Error("Project lifecycle record identity is invalid.");
  if (source.status !== "enabled" && source.status !== "disabled" && source.status !== "rolled-back") throw new Error("Project lifecycle record status is invalid.");
  if (typeof source.createdAt !== "string" || typeof source.updatedAt !== "string" || Number.isNaN(Date.parse(source.createdAt)) || Number.isNaN(Date.parse(source.updatedAt))) throw new Error("Project lifecycle record timestamps are invalid.");
  const before = parseSnapshot(source.before, "project lifecycle record.before");
  const enabled = parseSnapshot(source.enabled, "project lifecycle record.enabled");
  const excludeAddedLines = stringArray(source.excludeAddedLines, "project lifecycle record.excludeAddedLines", 10_000);
  if (!equality(excludeAddedLines, addedLines(before.exclude.contentBase64, enabled.exclude.contentBase64))) throw new Error("Project lifecycle exclude attribution differs.");
  return { schemaVersion: 1, projectRef: registration.projectRef, registrationSha256, status: source.status, before, enabled, excludeAddedLines, createdAt: source.createdAt, updatedAt: source.updatedAt };
}

function writeRecord(file: string, value: LifecycleRecord): void {
  const temporary = `${file}.pending-${crypto.randomUUID()}`;
  const content = stableJson(value);
  if (Buffer.byteLength(content) > MAX_RECORD_BYTES) throw new Error("Project lifecycle record exceeded its bound.");
  let handle: number | null = null;
  try {
    handle = fs.openSync(temporary, "wx", 0o600);
    fs.writeFileSync(handle, content, "utf8");
    fs.fsyncSync(handle);
    fs.closeSync(handle);
    handle = null;
    fs.renameSync(temporary, file);
  } finally {
    if (handle != null) fs.closeSync(handle);
    if (fs.existsSync(temporary)) fs.rmSync(temporary, { force: true });
  }
}

function lines(contentBase64: string): string[] {
  return Buffer.from(contentBase64, "base64").toString("utf8").split(/(?<=\n)/u);
}

function addedLines(before: string, after: string): string[] {
  const remaining = lines(before);
  const additions: string[] = [];
  for (const line of lines(after)) {
    const index = remaining.indexOf(line);
    if (index >= 0) remaining.splice(index, 1);
    else additions.push(line);
  }
  if (remaining.length > 0) throw new Error("Beads initialization removed existing exclude content.");
  return additions;
}

function equality(left: unknown, right: unknown): boolean {
  return stableJson(left) === stableJson(right);
}

function snapshotDrift(expected: GitSnapshot, actual: GitSnapshot, includeStore: boolean): string[] {
  const rows: Array<[string, unknown, unknown]> = [
    ["tracked", expected.tracked, actual.tracked],
    ["index", expected.indexSha256, actual.indexSha256],
    ["worktree", expected.worktreeSha256, actual.worktreeSha256],
    ["status", expected.statusSha256, actual.statusSha256],
    ["hooks", expected.hooks, actual.hooks],
    ["remotes", expected.remotes, actual.remotes],
    ["config", expected.config, actual.config],
    ["exclude", expected.exclude.sha256, actual.exclude.sha256],
    ["installed", expected.installed, actual.installed],
    ["external-boundary", expected.externalBoundarySha256, actual.externalBoundarySha256],
  ];
  if (includeStore) rows.push(["store", expected.store, actual.store]);
  return rows.filter(([, left, right]) => !equality(left, right)).map(([name]) => name);
}

function validateBefore(registration: BeadsBridgeRegistration, before: GitSnapshot): void {
  const manifest = loadBeadsReleaseManifest();
  for (const required of manifest.initialization.requiredTrackedFiles) {
    if (before.tracked[required.path] == null) throw new Error(`Tracked '${required.path}' is absent.`);
    validateBeadsTrackedFilePrerequisite(required, fs.readFileSync(path.resolve(registration.projectRoot, required.path), "utf8"));
  }
  const empty = sha256("");
  if (before.indexSha256 !== empty || before.worktreeSha256 !== empty || before.statusSha256 !== empty) throw new Error("Project must be clean before enablement.");
  if (before.remotes.length > 0) throw new Error("Project remotes are forbidden.");
  if (before.store.exists) throw new Error("Project already contains a Beads store.");
  if (before.installed.binary !== "match" || before.installed.adapter !== "match") throw new Error("Registered binary or adapter identity is not current.");
  if (before.config["beads.role"] != null) throw new Error("Existing beads.role is outside the clean enablement envelope.");
  if (!samePath(registration.projectRoot, fs.realpathSync.native(registration.projectRoot))) throw new Error("Project root changed before enablement.");
}

function validateEnabled(before: GitSnapshot, after: GitSnapshot, invocation: ReturnType<typeof buildBeadsAdapterInvocation>): string[] {
  const createdPaths = after.rootEntries.filter((item) => !before.rootEntries.includes(item));
  const modifiedPaths: string[] = [];
  if (!equality(before.config, after.config)) modifiedPaths.push(".git/config");
  if (before.exclude.sha256 !== after.exclude.sha256) modifiedPaths.push(".git/info/exclude");
  for (const name of new Set([...Object.keys(before.tracked), ...Object.keys(after.tracked)])) {
    if (!equality(before.tracked[name], after.tracked[name])) modifiedPaths.push(name);
  }
  if (!equality(before.hooks, after.hooks)) modifiedPaths.push(".git/hooks");
  const gitConfig: Record<string, string> = {};
  for (const key of new Set([...Object.keys(before.config), ...Object.keys(after.config)])) {
    const values = after.config[key] ?? [];
    if (!equality(values, before.config[key])) {
      if (values.length !== 1) throw new Error(`Beads initialization changed Git config '${key}' to an ambiguous value set.`);
      gitConfig[key] = values[0];
    }
  }
  const manifest = loadBeadsReleaseManifest();
  validateBeadsInitializationObservation(manifest, {
    flags: invocation.argv.filter((item) => item.startsWith("--")),
    ignoreSchemaSkew: false,
    trackedFileDigests: Object.fromEntries(Object.entries(after.tracked).map(([name, item]) => [name, item.sha256])),
    createdPaths,
    modifiedPaths,
    gitConfig,
    forbiddenEffects: [
      ...(!equality(before.indexSha256, after.indexSha256) ? ["git-index"] : []),
      ...(!equality(before.worktreeSha256, after.worktreeSha256) ? ["tracked-worktree"] : []),
      ...(!equality(before.hooks, after.hooks) ? ["git-hook"] : []),
      ...(!equality(before.remotes, after.remotes) ? ["git-remote"] : []),
      ...(!equality(before.externalBoundarySha256, after.externalBoundarySha256) ? ["external-path"] : []),
    ],
  });
  if (!after.store.exists) throw new Error("Beads initialization did not create the project-local store.");
  if (after.statusSha256 !== before.statusSha256) throw new Error("Beads initialization changed the Git status envelope.");
  return addedLines(before.exclude.contentBase64, after.exclude.contentBase64);
}

function observation(snapshotValue: GitSnapshot, cleanup: BeadsProjectLifecycleResult["observation"]["processCleanup"]): BeadsProjectLifecycleResult["observation"] {
  return {
    trackedSha256: sha256(stableJson(snapshotValue.tracked)),
    indexSha256: snapshotValue.indexSha256,
    worktreeSha256: snapshotValue.worktreeSha256,
    hooksSha256: sha256(stableJson(snapshotValue.hooks)),
    remotesSha256: sha256(stableJson(snapshotValue.remotes)),
    configSha256: snapshotValue.configSha256,
    excludeSha256: snapshotValue.exclude.sha256,
    storeSha256: snapshotValue.store.sha256,
    storeFiles: snapshotValue.store.files,
    processCleanup: cleanup,
  };
}

function result(
  operation: BeadsProjectLifecycleRequest["operation"],
  registration: BeadsBridgeRegistration,
  status: BeadsProjectLifecycleResult["status"],
  current: GitSnapshot,
  drift: string[] = [],
  invocation: BeadsProjectLifecycleResult["invocation"] = null,
  cleanup: BeadsProjectLifecycleResult["observation"]["processCleanup"] = "not-run",
): BeadsProjectLifecycleResult {
  return {
    schemaVersion: 1,
    operation,
    projectRef: registration.projectRef,
    status,
    registrationEnabled: registration.enabled,
    storePreserved: current.store.exists,
    drift,
    invocation,
    observation: observation(current, cleanup),
  };
}

function requireIdentity(value: BeadsBridgeProcessIdentity | undefined): BeadsBridgeProcessIdentity {
  if (value == null) throw new BeadsProjectLifecycleError("Mutating project lifecycle operation requires process identity.", "process-identity-required");
  return value;
}

function parseLifecycleRequest(value: unknown): BeadsProjectLifecycleRequest {
  const source = recordObject(value, "Beads project lifecycle request");
  const operations = new Set(["preview", "enable", "disable", "check", "rollback"]);
  if (typeof source.operation !== "string" || !operations.has(source.operation)) throw new BeadsProjectLifecycleError("Project lifecycle operation is unsupported.", "unsupported-operation");
  const mutating = source.operation === "enable" || source.operation === "disable" || source.operation === "rollback";
  exactKeys(source, mutating ? ["operation", "registrationFile", "processIdentity"] : ["operation", "registrationFile"], "Beads project lifecycle request");
  if (typeof source.registrationFile !== "string" || source.registrationFile.trim() === "" || !path.isAbsolute(source.registrationFile)) {
    throw new BeadsProjectLifecycleError("Project lifecycle registration file is invalid.", "invalid-request");
  }
  return {
    operation: source.operation as BeadsProjectLifecycleRequest["operation"],
    registrationFile: path.resolve(source.registrationFile),
    processIdentity: source.processIdentity as BeadsBridgeProcessIdentity | undefined,
  };
}

function terminalClosure(lease: BeadsBridgeWriterLease, evidence: string) {
  return {
    schemaVersion: 1 as const,
    status: "terminal" as const,
    observedAt: new Date().toISOString(),
    processRef: lease.processRef,
    childProcessRefs: [],
    evidenceRefs: [evidence],
  };
}

function adapterCleanup(adapter: BeadsAdapterResponse): "terminal" {
  if (adapter.process.exitCode !== 0 || adapter.process.timedOut) throw new Error("Successful adapter response did not prove terminal exit.");
  return "terminal";
}

function releaseAfterFailure(
  error: unknown,
  request: BeadsProjectLifecycleRequest,
  registration: BeadsBridgeRegistration,
  lease: BeadsBridgeWriterLease,
): void {
  if (error instanceof BeadsAdapterError && error.failure?.process.cleanupState === "unknown") return;
  releaseBeadsBridgeWriterLease(request.registrationFile, loadBeadsBridgeRegistration(request.registrationFile), lease, terminalClosure(lease, "evidence:lifecycle-failure-terminal"));
}

export function runBeadsProjectLifecycle(
  requestValue: unknown,
  dependencies: BeadsProjectLifecycleDependencies = {},
): BeadsProjectLifecycleResult {
  let request: BeadsProjectLifecycleRequest;
  try {
    request = parseLifecycleRequest(requestValue);
  } catch (cause) {
    if (cause instanceof BeadsProjectLifecycleError) throw cause;
    throw new BeadsProjectLifecycleError("Beads project lifecycle request is invalid.", "invalid-request", { cause });
  }
  const registration = loadBeadsBridgeRegistration(request.registrationFile);
  const lifecycleFile = recordPath(request.registrationFile, registration);
  const registrationSha256 = inspectBeadsBridgeCoordination(request.registrationFile).registrationSha256;
  let recordValue: LifecycleRecord | null;
  try {
    recordValue = readRecord(lifecycleFile, registration, registrationSha256);
  } catch (cause) {
    throw new BeadsProjectLifecycleError("Project lifecycle record is invalid or drifted.", "lifecycle-record-invalid", { cause });
  }
  if (request.operation === "preview") {
    const plan = buildBeadsAdapterInvocation({
      operation: "project-enable",
      executablePath: registration.binaryPath,
      projectRoot: registration.projectRoot,
      prefix: registration.prefix,
    });
    const current = snapshot(registration, dependencies);
    return result("preview", registration, "preview", current, [], { argv: plan.argv, timeoutMs: plan.timeoutMs });
  }
  if (request.operation === "check") {
    const current = snapshot(registration, dependencies);
    const drift = recordValue == null
      ? ["lifecycle-record"]
      : snapshotDrift(recordValue.status === "rolled-back" ? recordValue.before : recordValue.enabled, current, false)
        .filter((item) => recordValue.status !== "rolled-back" || item !== "status");
    if (current.store.exists && current.installed.binary === "match" && current.installed.adapter === "match") {
      runBeadsAdapter({ operation: "project-check", executablePath: registration.binaryPath, projectRoot: registration.projectRoot }, dependencies.adapter);
    }
    return result("check", registration, drift.length === 0 ? "current" : "partial-unknown", current, drift, null, "not-needed");
  }
  if (request.operation === "enable") {
    if (registration.enabled) throw new BeadsProjectLifecycleError("Project registration is already enabled.", "registration-state");
    const lease = acquireBeadsBridgeWriterLease(request.registrationFile, registration, "project-enable", requireIdentity(request.processIdentity));
    try {
      const before = snapshot(registration, dependencies);
      validateBefore(registration, before);
      const plan = buildBeadsAdapterInvocation({ operation: "project-enable", executablePath: registration.binaryPath, projectRoot: registration.projectRoot, prefix: registration.prefix });
      const adapter = runBeadsAdapter({ operation: "project-enable", executablePath: registration.binaryPath, projectRoot: registration.projectRoot, prefix: registration.prefix }, dependencies.adapter);
      const enabledSnapshot = snapshot(registration, dependencies);
      const excludeAddedLines = validateEnabled(before, enabledSnapshot, plan);
      const now = new Date().toISOString();
      writeRecord(lifecycleFile, {
        schemaVersion: 1,
        projectRef: registration.projectRef,
        registrationSha256,
        status: "enabled",
        before,
        enabled: enabledSnapshot,
        excludeAddedLines,
        createdAt: now,
        updatedAt: now,
      });
      const enabled = setBeadsBridgeRegistrationEnabled(request.registrationFile, registration, lease, true);
      releaseBeadsBridgeWriterLease(request.registrationFile, enabled, lease, terminalClosure(lease, "evidence:adapter-enable-terminal"));
      return result("enable", enabled, "enabled", enabledSnapshot, [], { argv: plan.argv, timeoutMs: plan.timeoutMs }, adapterCleanup(adapter));
    } catch (cause) {
      releaseAfterFailure(cause, request, registration, lease);
      throw new BeadsProjectLifecycleError("Beads project enablement failed and no enabled state was claimed.", "enable-failed", { cause });
    }
  }
  if (request.operation === "disable") {
    if (!registration.enabled || recordValue == null || recordValue.status !== "enabled") throw new BeadsProjectLifecycleError("Project lifecycle is not in the enabled state.", "registration-state");
    const lease = acquireBeadsBridgeWriterLease(request.registrationFile, registration, "project-disable", requireIdentity(request.processIdentity));
    try {
      const adapter = runBeadsAdapter({ operation: "project-disable", executablePath: registration.binaryPath, projectRoot: registration.projectRoot }, dependencies.adapter);
      if (adapter.result.kind !== "project-disable-check" || !adapter.result.canDisable) throw new Error("Adapter did not admit project disablement.");
      const disabled = setBeadsBridgeRegistrationEnabled(request.registrationFile, registration, lease, false);
      writeRecord(lifecycleFile, { ...recordValue, status: "disabled", updatedAt: new Date().toISOString() });
      const current = snapshot(disabled, dependencies);
      releaseBeadsBridgeWriterLease(request.registrationFile, disabled, lease, terminalClosure(lease, "evidence:adapter-disable-terminal"));
      return result("disable", disabled, "disabled", current, [], null, adapterCleanup(adapter));
    } catch (cause) {
      releaseAfterFailure(cause, request, registration, lease);
      throw new BeadsProjectLifecycleError("Beads project disablement failed.", "disable-failed", { cause });
    }
  }
  if (request.operation !== "rollback") throw new BeadsProjectLifecycleError("Project lifecycle operation is unsupported.", "unsupported-operation");
  if (registration.enabled || recordValue == null || recordValue.status !== "disabled") throw new BeadsProjectLifecycleError("Project must be disabled with a current lifecycle record before rollback.", "registration-state");
  const lease = acquireBeadsBridgeWriterLease(request.registrationFile, registration, "rollback", requireIdentity(request.processIdentity));
  try {
    const current = snapshot(registration, dependencies);
    const drift = snapshotDrift(recordValue.enabled, current, false);
    if (drift.length > 0) {
      releaseBeadsBridgeWriterLease(request.registrationFile, registration, lease, terminalClosure(lease, "evidence:rollback-drift-preserved"));
      return result("rollback", registration, "partial-unknown", current, drift);
    }
    if (!equality(recordValue.before.config["beads.role"], recordValue.enabled.config["beads.role"])) {
      git(registration.projectRoot, ["config", "--local", "--unset-all", "beads.role"]);
    }
    const excludeFile = path.join(registration.projectRoot, ".git", "info", "exclude");
    const beforeExclude = Buffer.from(recordValue.before.exclude.contentBase64, "base64");
    if (recordValue.before.exclude.exists) fs.writeFileSync(excludeFile, beforeExclude);
    else fs.rmSync(excludeFile, { force: true });
    const rolledBack = snapshot(registration, dependencies);
    const rollbackDrift = snapshotDrift(recordValue.before, rolledBack, false).filter((item) => item !== "status");
    if (rollbackDrift.length > 0) throw new Error(`Rollback readback differs: ${rollbackDrift.join(", ")}.`);
    writeRecord(lifecycleFile, { ...recordValue, status: "rolled-back", updatedAt: new Date().toISOString() });
    releaseBeadsBridgeWriterLease(request.registrationFile, registration, lease, terminalClosure(lease, "evidence:project-effects-rollback-terminal"));
    return result("rollback", registration, "rolled-back", rolledBack);
  } catch (cause) {
    releaseAfterFailure(cause, request, registration, lease);
    throw new BeadsProjectLifecycleError("Beads project rollback failed and project data was preserved.", "rollback-failed", { cause });
  }
}
