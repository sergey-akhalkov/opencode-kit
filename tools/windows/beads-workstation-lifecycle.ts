import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  BEADS_BRIDGE_REGISTRATION_FILE,
  BeadsBridgeRegistrationError,
  acquireBeadsBridgeWriterLease,
  inspectBeadsBridgeCoordination,
  loadBeadsBridgeRegistration,
} from "../../global/bin/beads-portfolio-bridge/beads-bridge-registration.ts";
import type {
  BeadsBridgeProcessIdentity,
  BeadsBridgeRegistration,
} from "../../global/bin/beads-portfolio-bridge/beads-bridge-registration.ts";
import {
  BEADS_RELEASE_MANIFEST_PATH,
  loadBeadsReleaseManifest,
} from "../../global/bin/beads-portfolio-bridge/beads-release.ts";
import { OPENCODE_PROTECTED_ROOT_ACL } from "./opencode-workstation-layout.ts";

type JsonRecord = Record<string, unknown>;
type FileIdentity = { bytes: number; sha256: string };
type ManagedFile = FileIdentity & { path: string; role: string };
type RegistrationIdentity = {
  adapterSha256: string;
  effectPolicySha256: string;
  ownerClass: BeadsBridgeRegistration["ownerClass"];
  prefix: string;
  profileSha256: string;
  projectRef: string;
  writerStatePath: string;
};
type InstallRecord = {
  schemaVersion: 1;
  release: {
    architecture: "amd64";
    archiveSha256: string;
    executableBytes: number;
    executableSha256: string;
    platform: "windows";
    version: string;
  };
  sourceManifestSha256: string;
  paths: BeadsWorkstationPaths;
  managedFiles: ManagedFile[];
  registration: RegistrationIdentity | null;
};

type BeadsWorkstationPaths = {
  adapter: string;
  bridgeRoot: string;
  executable: string;
  installRecord: string;
  registration: string;
  releaseManifest: string;
};

export type BeadsWorkstationLifecycleDependencies = {
  architecture?: () => string;
  fileIdentity?: (file: string) => FileIdentity;
  platform?: () => NodeJS.Platform | string;
};

type BeadsWorkstationLifecycleRequest = {
  operation: "preview" | "install" | "check" | "rollback";
  targetRoot: string;
  dryRun?: boolean;
  executableSourcePath?: string;
  manifestPath?: string;
  processIdentity?: BeadsBridgeProcessIdentity;
};

export type BeadsWorkstationLifecycleResult = {
  schemaVersion: 1;
  operation: BeadsWorkstationLifecycleRequest["operation"];
  status: "preview" | "installed" | "current" | "absent" | "partial-unknown" | "rolled-back";
  installed: boolean;
  eligible: boolean;
  complete: boolean;
  reason: "clear" | "not-installed" | "identity-drift" | "writer-liveness-unknown";
  paths: BeadsWorkstationPaths;
  drift: string[];
  diagnostics?: Array<{ drift: string; cause: string }>;
  retainedPaths: string[];
  writer: "clear" | "unknown" | "not-registered";
  plan?: JsonRecord;
};

export class BeadsWorkstationLifecycleError extends Error {
  readonly code: string;

  constructor(message: string, code: string, options: { cause?: unknown } = {}) {
    super(message, options.cause == null ? undefined : { cause: options.cause });
    this.name = "BeadsWorkstationLifecycleError";
    this.code = code;
  }
}

const BEADS_WORKSTATION_INSTALL_RECORD = "beads-workstation-lifecycle.json";

const modulePath = fileURLToPath(import.meta.url);
const moduleDirectory = path.dirname(modulePath);
const beadsRuntimeDirectory = path.join(moduleDirectory, "..", "..", "global", "bin", "beads-portfolio-bridge");
const SHA256 = /^[a-f0-9]{64}$/u;
const PROJECT_REF = /^project_[a-f0-9]{32}$/u;
const SOURCE_FILES = [
  { role: "lifecycle", source: (_manifestPath: string) => modulePath, destination: "beads-workstation-lifecycle.ts" },
  { role: "release-code", source: (_manifestPath: string) => path.join(beadsRuntimeDirectory, "beads-release.ts"), destination: "beads-release.ts" },
  { role: "release-manifest", source: (manifestPath: string) => manifestPath, destination: "beads-release.manifest.json" },
  { role: "registration-code", source: (_manifestPath: string) => path.join(beadsRuntimeDirectory, "beads-bridge-registration.ts"), destination: "beads-bridge-registration.ts" },
  { role: "adapter", source: (_manifestPath: string) => path.join(beadsRuntimeDirectory, "beads-vendor-adapter.ts"), destination: "beads/runtime/global/bin/beads-portfolio-bridge/beads-vendor-adapter.ts" },
  { role: "adapter-release-code", source: (_manifestPath: string) => path.join(beadsRuntimeDirectory, "beads-release.ts"), destination: "beads/runtime/global/bin/beads-portfolio-bridge/beads-release.ts" },
  { role: "adapter-release-manifest", source: (manifestPath: string) => manifestPath, destination: "beads/runtime/global/bin/beads-portfolio-bridge/beads-release.manifest.json" },
  { role: "portable-process", source: (_manifestPath: string) => path.join(moduleDirectory, "..", "..", "global", "bin", "portable-process.ts"), destination: "beads/runtime/global/bin/portable-process.ts" },
] as const;

function stableValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stableValue);
  if (value != null && typeof value === "object") {
    return Object.fromEntries(Object.entries(value as JsonRecord).sort(([left], [right]) => left.localeCompare(right)).map(([key, item]) => [key, stableValue(item)]));
  }
  return value;
}

function stableJson(value: unknown): string {
  return `${JSON.stringify(stableValue(value), null, 2)}\n`;
}

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

function digest(value: unknown, label: string): string {
  const selected = text(value, label);
  if (!SHA256.test(selected)) throw new Error(`${label} must be a lowercase SHA-256 digest.`);
  return selected;
}

function integer(value: unknown, label: string): number {
  if (!Number.isSafeInteger(value) || Number(value) < 0) throw new Error(`${label} must be a non-negative integer.`);
  return Number(value);
}

function defaultFileIdentity(file: string): FileIdentity {
  const content = fs.readFileSync(file);
  return { bytes: content.length, sha256: crypto.createHash("sha256").update(content).digest("hex") };
}

function dependencies(value: BeadsWorkstationLifecycleDependencies): Required<BeadsWorkstationLifecycleDependencies> {
  return {
    architecture: value.architecture ?? (() => process.arch),
    fileIdentity: value.fileIdentity ?? defaultFileIdentity,
    platform: value.platform ?? (() => process.platform),
  };
}

function samePath(left: string, right: string): boolean {
  return path.resolve(left).toLowerCase() === path.resolve(right).toLowerCase();
}

function containedBy(parent: string, child: string): boolean {
  const relative = path.relative(path.resolve(parent), path.resolve(child));
  return relative !== "" && !relative.startsWith("..") && !path.isAbsolute(relative);
}

function regularFile(file: string, label: string): void {
  const stat = fs.lstatSync(file, { throwIfNoEntry: false });
  if (stat == null || !stat.isFile() || stat.isSymbolicLink()) throw new Error(`${label} must be a regular file.`);
  if (!samePath(fs.realpathSync.native(file), file)) throw new Error(`${label} must be canonical.`);
}

function existingDirectory(directory: string, label: string): string {
  const absolute = path.resolve(directory);
  const stat = fs.lstatSync(absolute, { throwIfNoEntry: false });
  if (stat == null || !stat.isDirectory() || stat.isSymbolicLink()) throw new Error(`${label} must be an existing regular directory.`);
  if (!samePath(fs.realpathSync.native(absolute), absolute)) throw new Error(`${label} must be canonical.`);
  return absolute;
}

function previewDirectory(directory: string): string {
  const absolute = path.resolve(directory);
  const stat = fs.lstatSync(absolute, { throwIfNoEntry: false });
  if (stat != null && (!stat.isDirectory() || stat.isSymbolicLink() || !samePath(fs.realpathSync.native(absolute), absolute))) {
    throw new Error("Beads target root is unsafe.");
  }
  return absolute;
}

function workstationPaths(targetRoot: string): BeadsWorkstationPaths {
  return {
    adapter: path.join(targetRoot, "beads", "runtime", "global", "bin", "beads-portfolio-bridge", "beads-vendor-adapter.ts"),
    bridgeRoot: path.join(targetRoot, "beads-bridge"),
    executable: path.join(targetRoot, "beads", "bin", "bd.exe"),
    installRecord: path.join(targetRoot, BEADS_WORKSTATION_INSTALL_RECORD),
    registration: path.join(targetRoot, BEADS_BRIDGE_REGISTRATION_FILE),
    releaseManifest: path.join(targetRoot, "beads-release.manifest.json"),
  };
}

function assertHost(deps: Required<BeadsWorkstationLifecycleDependencies>): void {
  if (deps.platform() !== "win32") throw new BeadsWorkstationLifecycleError("Beads workstation lifecycle requires Windows.", "unsupported-platform");
  const architecture = deps.architecture();
  if (architecture !== "x64" && architecture !== "amd64") {
    throw new BeadsWorkstationLifecycleError("Beads workstation lifecycle requires amd64.", "unsupported-architecture");
  }
}

function sourceFiles(targetRoot: string, manifestPath: string): Array<{ destination: string; role: string; source: string }> {
  return SOURCE_FILES.map((entry) => ({
    destination: path.join(targetRoot, entry.destination),
    role: entry.role,
    source: entry.source(manifestPath),
  }));
}

function installPlan(request: BeadsWorkstationLifecycleRequest, deps: Required<BeadsWorkstationLifecycleDependencies>, requireTarget: boolean) {
  assertHost(deps);
  const targetRoot = requireTarget ? existingDirectory(request.targetRoot, "Beads target root") : previewDirectory(request.targetRoot);
  const manifestPath = path.resolve(request.manifestPath ?? BEADS_RELEASE_MANIFEST_PATH);
  regularFile(manifestPath, "Beads release manifest");
  const manifest = loadBeadsReleaseManifest(manifestPath);
  const paths = workstationPaths(targetRoot);
  return {
    manifest,
    manifestPath,
    paths,
    sources: sourceFiles(targetRoot, manifestPath),
    targetRoot,
  };
}

function parseManagedFile(value: unknown, targetRoot: string, label: string): ManagedFile {
  const input = record(value, label);
  exactKeys(input, ["bytes", "path", "role", "sha256"], label);
  const selectedPath = path.resolve(text(input.path, `${label}.path`));
  if (!containedBy(targetRoot, selectedPath)) throw new Error(`${label}.path must stay inside the target root.`);
  return { bytes: integer(input.bytes, `${label}.bytes`), path: selectedPath, role: text(input.role, `${label}.role`), sha256: digest(input.sha256, `${label}.sha256`) };
}

function parseRegistrationIdentity(value: unknown, paths: BeadsWorkstationPaths): RegistrationIdentity | null {
  if (value === null) return null;
  const input = record(value, "registration");
  exactKeys(input, ["adapterSha256", "effectPolicySha256", "ownerClass", "prefix", "profileSha256", "projectRef", "writerStatePath"], "registration");
  const projectRef = text(input.projectRef, "registration.projectRef");
  if (!PROJECT_REF.test(projectRef)) throw new Error("registration.projectRef is invalid.");
  const ownerClass = input.ownerClass;
  if (ownerClass !== "current-project" && ownerClass !== "opencode-kit") throw new Error("registration.ownerClass is invalid.");
  const writerStatePath = path.resolve(text(input.writerStatePath, "registration.writerStatePath"));
  const expectedState = path.join(paths.bridgeRoot, projectRef.slice("project_".length));
  if (!samePath(writerStatePath, expectedState)) throw new Error("registration.writerStatePath is invalid.");
  return {
    adapterSha256: digest(input.adapterSha256, "registration.adapterSha256"),
    effectPolicySha256: digest(input.effectPolicySha256, "registration.effectPolicySha256"),
    ownerClass,
    prefix: text(input.prefix, "registration.prefix"),
    profileSha256: digest(input.profileSha256, "registration.profileSha256"),
    projectRef,
    writerStatePath,
  };
}

function parseInstallRecord(value: unknown, targetRoot: string): InstallRecord {
  const input = record(value, "Beads workstation install record");
  exactKeys(input, ["managedFiles", "paths", "registration", "release", "schemaVersion", "sourceManifestSha256"], "Beads workstation install record");
  if (input.schemaVersion !== 1) throw new Error("Beads workstation install record schemaVersion must be 1.");
  const expectedPaths = workstationPaths(targetRoot);
  const rawPaths = record(input.paths, "paths");
  exactKeys(rawPaths, ["adapter", "bridgeRoot", "executable", "installRecord", "registration", "releaseManifest"], "paths");
  const paths = Object.fromEntries(Object.keys(expectedPaths).map((key) => {
    const name = key as keyof BeadsWorkstationPaths;
    const selected = path.resolve(text(rawPaths[name], `paths.${name}`));
    if (!samePath(selected, expectedPaths[name])) throw new Error(`paths.${name} differs from the workstation-owned identity.`);
    return [name, selected];
  })) as BeadsWorkstationPaths;
  const release = record(input.release, "release");
  exactKeys(release, ["architecture", "archiveSha256", "executableBytes", "executableSha256", "platform", "version"], "release");
  if (release.platform !== "windows" || release.architecture !== "amd64") throw new Error("release platform identity is invalid.");
  if (!Array.isArray(input.managedFiles)) throw new Error("managedFiles must be an array.");
  const managedFiles = input.managedFiles.map((item, index) => parseManagedFile(item, targetRoot, `managedFiles.${index}`));
  const expectedRoles = ["executable", ...SOURCE_FILES.map((item) => item.role)].sort();
  const actualRoles = managedFiles.map((item) => item.role).sort();
  if (actualRoles.length !== expectedRoles.length || actualRoles.some((role, index) => role !== expectedRoles[index])) {
    throw new Error("managedFiles roles differ from the closed install inventory.");
  }
  return {
    schemaVersion: 1,
    release: {
      architecture: "amd64",
      archiveSha256: digest(release.archiveSha256, "release.archiveSha256"),
      executableBytes: integer(release.executableBytes, "release.executableBytes"),
      executableSha256: digest(release.executableSha256, "release.executableSha256"),
      platform: "windows",
      version: text(release.version, "release.version"),
    },
    sourceManifestSha256: digest(input.sourceManifestSha256, "sourceManifestSha256"),
    paths,
    managedFiles,
    registration: parseRegistrationIdentity(input.registration, paths),
  };
}

function readInstallRecord(targetRoot: string): InstallRecord | null {
  const selected = workstationPaths(targetRoot).installRecord;
  const stat = fs.lstatSync(selected, { throwIfNoEntry: false });
  if (stat == null) return null;
  regularFile(selected, "Beads workstation install record");
  try {
    return parseInstallRecord(JSON.parse(fs.readFileSync(selected, "utf8")), targetRoot);
  } catch (cause) {
    throw new BeadsWorkstationLifecycleError("Beads workstation install record is invalid.", "install-record-drift", { cause });
  }
}

function writeInitialRecord(file: string, value: InstallRecord): void {
  fs.writeFileSync(file, stableJson(value), { encoding: "utf8", flag: "wx" });
}

function replaceRecord(file: string, value: InstallRecord): void {
  const temporary = `${file}.${process.pid}.new`;
  const previous = `${file}.${process.pid}.previous`;
  fs.writeFileSync(temporary, stableJson(value), { encoding: "utf8", flag: "wx" });
  fs.renameSync(file, previous);
  try {
    fs.renameSync(temporary, file);
    fs.rmSync(previous, { force: true });
  } catch (cause) {
    if (!fs.existsSync(file) && fs.existsSync(previous)) fs.renameSync(previous, file);
    fs.rmSync(temporary, { force: true });
    throw cause;
  }
}

function registrationMatches(recorded: RegistrationIdentity, registration: BeadsBridgeRegistration, paths: BeadsWorkstationPaths, adapterSha256: string, executableSha256: string): boolean {
  return samePath(registration.binaryPath, paths.executable)
    && registration.binarySha256 === executableSha256
    && samePath(registration.adapterPath, paths.adapter)
    && registration.adapterSha256 === adapterSha256
    && registration.adapterSha256 === recorded.adapterSha256
    && registration.effectPolicySha256 === recorded.effectPolicySha256
    && registration.ownerClass === recorded.ownerClass
    && registration.prefix === recorded.prefix
    && registration.profileSha256 === recorded.profileSha256
    && registration.projectRef === recorded.projectRef;
}

function retainedPaths(record: InstallRecord): string[] {
  const selected = [record.paths.installRecord, ...record.managedFiles.map((item) => item.path), record.paths.bridgeRoot];
  if (record.registration != null) selected.push(record.paths.registration, record.registration.writerStatePath);
  return [...new Set(selected.map((item) => path.resolve(item)))].sort();
}

function inspectInstalled(record: InstallRecord, deps: Required<BeadsWorkstationLifecycleDependencies>): { diagnostics: Array<{ drift: string; cause: string }>; drift: string[]; writer: BeadsWorkstationLifecycleResult["writer"] } {
  const drift: string[] = [];
  const diagnostics: Array<{ drift: string; cause: string }> = [];
  const addDrift = (name: string, cause: unknown) => {
    drift.push(name);
    diagnostics.push({ drift: name, cause: cause instanceof Error ? cause.message : String(cause) });
  };
  for (const item of record.managedFiles) {
    try {
      regularFile(item.path, item.role);
      const current = deps.fileIdentity(item.path);
      if (current.bytes !== item.bytes || current.sha256 !== item.sha256) addDrift(`managed:${item.role}`, `${item.role} identity differs from the install record.`);
    } catch (cause) {
      addDrift(`managed:${item.role}`, cause);
    }
  }
  try {
    const installedManifest = loadBeadsReleaseManifest(record.paths.releaseManifest);
    const manifestIdentity = deps.fileIdentity(record.paths.releaseManifest);
    if (manifestIdentity.sha256 !== record.sourceManifestSha256) addDrift("release-manifest", "Installed release manifest digest differs from the install record.");
    if (installedManifest.release.version !== record.release.version
      || installedManifest.release.platform !== record.release.platform
      || installedManifest.release.architecture !== record.release.architecture
      || installedManifest.release.archive.sha256 !== record.release.archiveSha256
      || installedManifest.release.executable.bytes !== record.release.executableBytes
      || installedManifest.release.executable.sha256 !== record.release.executableSha256) addDrift("release-identity", "Installed release identity differs from the install record.");
  } catch (cause) {
    addDrift("release-manifest", cause);
  }
  const bridgeStat = fs.lstatSync(record.paths.bridgeRoot, { throwIfNoEntry: false });
  if (bridgeStat == null || !bridgeStat.isDirectory() || bridgeStat.isSymbolicLink()) addDrift("bridge-root", "Bridge root is missing or unsafe.");
  if (record.registration == null) {
    if (fs.existsSync(record.paths.registration)) addDrift("untracked-registration", "Registration exists without a workstation ownership record.");
    return { diagnostics, drift: [...new Set(drift)].sort(), writer: "not-registered" };
  }
  try {
    const registration = loadBeadsBridgeRegistration(record.paths.registration);
    const adapter = record.managedFiles.find((item) => item.role === "adapter");
    if (adapter == null || !registrationMatches(record.registration, registration, record.paths, adapter.sha256, record.release.executableSha256)) addDrift("registration", "Registration identity differs from the managed installation.");
    const stateStat = fs.lstatSync(record.registration.writerStatePath, { throwIfNoEntry: false });
    if (stateStat == null || !stateStat.isDirectory() || stateStat.isSymbolicLink()) addDrift("writer-state", "Writer state is missing or unsafe.");
    const coordination = inspectBeadsBridgeCoordination(record.paths.registration);
    return { diagnostics, drift: [...new Set(drift)].sort(), writer: coordination.writer };
  } catch (cause) {
    addDrift("registration", cause);
    return { diagnostics, drift: [...new Set(drift)].sort(), writer: "unknown" };
  }
}

function previewResult(request: BeadsWorkstationLifecycleRequest, deps: Required<BeadsWorkstationLifecycleDependencies>): BeadsWorkstationLifecycleResult {
  const selected = installPlan(request, deps, false);
  return {
    schemaVersion: 1,
    operation: "preview",
    status: "preview",
    installed: fs.existsSync(selected.paths.installRecord),
    eligible: true,
    complete: true,
    reason: "clear",
    paths: selected.paths,
    drift: [],
    retainedPaths: [],
    writer: "not-registered",
    plan: {
      activation: "none",
      archive: {
        fileName: selected.manifest.release.archive.fileName,
        sha256: selected.manifest.release.archive.sha256,
        url: selected.manifest.release.archive.url,
      },
      executable: selected.manifest.release.executable,
      host: { architecture: "amd64", platform: "windows" },
      inheritedAcl: [...OPENCODE_PROTECTED_ROOT_ACL.display],
      managedFiles: [selected.paths.executable, ...selected.sources.map((item) => item.destination)],
      nonEffects: ["download", "profile-selection", "project-registration", "project-activation", "process", "service", "task", "hook", "remote"],
      registration: selected.paths.registration,
      rollback: "identity-checked; same bridge lease required when registered",
      version: selected.manifest.release.version,
      writerStorage: selected.paths.bridgeRoot,
    },
  };
}

function install(request: BeadsWorkstationLifecycleRequest, deps: Required<BeadsWorkstationLifecycleDependencies>): BeadsWorkstationLifecycleResult {
  const selected = installPlan(request, deps, true);
  if (readInstallRecord(selected.targetRoot) != null) {
    const current = check(request, deps);
    if (current.status !== "current") throw new BeadsWorkstationLifecycleError("Existing Beads installation is not current.", "identity-drift");
    return { ...current, operation: "install", status: "installed" };
  }
  const executableSourcePath = path.resolve(text(request.executableSourcePath, "executableSourcePath"));
  regularFile(executableSourcePath, "Beads executable source");
  if (containedBy(selected.targetRoot, executableSourcePath) || samePath(selected.targetRoot, executableSourcePath)) {
    throw new BeadsWorkstationLifecycleError("Beads executable source must remain outside the protected target.", "unsafe-source-path");
  }
  const executableIdentity = deps.fileIdentity(executableSourcePath);
  if (executableIdentity.bytes !== selected.manifest.release.executable.bytes || executableIdentity.sha256 !== selected.manifest.release.executable.sha256) {
    throw new BeadsWorkstationLifecycleError("Beads executable source differs from the reviewed manifest.", "executable-identity-mismatch");
  }
  for (const item of selected.sources) regularFile(item.source, `Beads source ${item.role}`);
  const destinations = [path.join(selected.targetRoot, "beads"), selected.paths.executable, ...selected.sources.map((item) => item.destination), selected.paths.bridgeRoot, selected.paths.registration];
  if (destinations.some((item) => fs.existsSync(item))) {
    throw new BeadsWorkstationLifecycleError("Beads managed destination already exists without a current install record.", "unmanaged-destination");
  }
  const attempted: string[] = [];
  try {
    for (const item of [{ role: "executable", source: executableSourcePath, destination: selected.paths.executable }, ...selected.sources]) {
      fs.mkdirSync(path.dirname(item.destination), { recursive: true });
      attempted.push(item.destination);
      fs.copyFileSync(item.source, item.destination, fs.constants.COPYFILE_EXCL);
      const expected = item.role === "executable" ? executableIdentity : deps.fileIdentity(item.source);
      const observed = deps.fileIdentity(item.destination);
      if (observed.bytes !== expected.bytes || observed.sha256 !== expected.sha256) throw new Error(`Installed ${item.role} copy differs.`);
    }
    fs.mkdirSync(selected.paths.bridgeRoot);
    const managedFiles = [
      { ...executableIdentity, path: selected.paths.executable, role: "executable" },
      ...selected.sources.map((item) => ({ ...deps.fileIdentity(item.source), path: item.destination, role: item.role })),
    ].sort((left, right) => left.role.localeCompare(right.role));
    const sourceManifestSha256 = deps.fileIdentity(selected.manifestPath).sha256;
    const record: InstallRecord = {
      schemaVersion: 1,
      release: {
        architecture: "amd64",
        archiveSha256: selected.manifest.release.archive.sha256,
        executableBytes: selected.manifest.release.executable.bytes,
        executableSha256: selected.manifest.release.executable.sha256,
        platform: "windows",
        version: selected.manifest.release.version,
      },
      sourceManifestSha256,
      paths: selected.paths,
      managedFiles,
      registration: null,
    };
    writeInitialRecord(selected.paths.installRecord, record);
  } catch (cause) {
    for (const file of attempted.reverse()) fs.rmSync(file, { force: true });
    for (const file of attempted) removeEmptyParents(file, selected.targetRoot);
    if (fs.existsSync(selected.paths.bridgeRoot) && fs.readdirSync(selected.paths.bridgeRoot).length === 0) fs.rmdirSync(selected.paths.bridgeRoot);
    throw new BeadsWorkstationLifecycleError("Beads installation failed and attributable copies were removed.", "install-failed", { cause });
  }
  const current = check(request, deps);
  if (current.status !== "current") throw new BeadsWorkstationLifecycleError("Beads installation readback differs.", "install-readback-drift");
  return { ...current, operation: "install", status: "installed" };
}

function check(request: BeadsWorkstationLifecycleRequest, deps: Required<BeadsWorkstationLifecycleDependencies>): BeadsWorkstationLifecycleResult {
  assertHost(deps);
  const targetRoot = previewDirectory(request.targetRoot);
  const paths = workstationPaths(targetRoot);
  const installed = readInstallRecord(targetRoot);
  if (installed == null) {
    return { schemaVersion: 1, operation: "check", status: "absent", installed: false, eligible: true, complete: true, reason: "not-installed", paths, drift: [], retainedPaths: [], writer: "not-registered" };
  }
  const observation = inspectInstalled(installed, deps);
  const current = observation.drift.length === 0;
  return {
    schemaVersion: 1,
    operation: "check",
    status: current ? "current" : "partial-unknown",
    installed: true,
    eligible: current,
    complete: current,
    reason: current ? "clear" : "identity-drift",
    paths: installed.paths,
    drift: observation.drift,
    diagnostics: observation.diagnostics,
    retainedPaths: current ? [] : retainedPaths(installed),
    writer: observation.writer,
  };
}

function removeEmptyParents(file: string, targetRoot: string): void {
  let current = path.dirname(file);
  while (containedBy(targetRoot, current) && !samePath(current, targetRoot)) {
    if (!fs.existsSync(current) || fs.readdirSync(current).length !== 0) return;
    fs.rmdirSync(current);
    current = path.dirname(current);
  }
}

function rollback(request: BeadsWorkstationLifecycleRequest, deps: Required<BeadsWorkstationLifecycleDependencies>): BeadsWorkstationLifecycleResult {
  const current = check(request, deps);
  if (!current.installed) return { ...current, operation: "rollback", status: "absent" };
  const targetRoot = existingDirectory(request.targetRoot, "Beads target root");
  const installed = readInstallRecord(targetRoot);
  if (installed == null) throw new BeadsWorkstationLifecycleError("Beads install record disappeared before rollback.", "install-record-drift");
  if (current.drift.length > 0) return { ...current, operation: "rollback", eligible: false, complete: false, status: "partial-unknown" };
  if (installed.registration != null && current.writer === "unknown") {
    return { ...current, operation: "rollback", eligible: true, complete: false, reason: "writer-liveness-unknown", status: "partial-unknown", retainedPaths: retainedPaths(installed) };
  }
  if (request.dryRun) {
    return { ...current, operation: "rollback", status: "current", plan: { action: "remove-matching-beads-material", acquiresBridgeLease: installed.registration != null } };
  }
  if (installed.registration != null) {
    if (request.processIdentity == null) throw new BeadsWorkstationLifecycleError("Rollback process identity is required for registered material.", "process-identity-required");
    const registration = loadBeadsBridgeRegistration(installed.paths.registration);
    try {
      acquireBeadsBridgeWriterLease(installed.paths.registration, registration, "rollback", request.processIdentity);
    } catch (cause) {
      if (cause instanceof BeadsBridgeRegistrationError && cause.code === "writer-liveness-unknown") {
        return { ...current, operation: "rollback", eligible: true, complete: false, reason: "writer-liveness-unknown", status: "partial-unknown", retainedPaths: retainedPaths(installed), writer: "unknown" };
      }
      throw new BeadsWorkstationLifecycleError("Beads rollback could not acquire the bridge lease.", "rollback-lease-failed", { cause });
    }
  }
  try {
    for (const item of installed.managedFiles) fs.rmSync(item.path, { force: true });
    if (installed.registration != null) {
      fs.rmSync(installed.paths.registration, { force: true });
      fs.rmSync(installed.registration.writerStatePath, { recursive: true, force: true });
    }
    if (fs.existsSync(installed.paths.bridgeRoot) && fs.readdirSync(installed.paths.bridgeRoot).length === 0) fs.rmdirSync(installed.paths.bridgeRoot);
    fs.rmSync(installed.paths.installRecord, { force: true });
    for (const item of installed.managedFiles) removeEmptyParents(item.path, targetRoot);
  } catch (cause) {
    throw new BeadsWorkstationLifecycleError("Beads rollback stopped with managed state preserved for repair.", "rollback-failed", { cause });
  }
  return {
    schemaVersion: 1,
    operation: "rollback",
    status: "rolled-back",
    installed: false,
    eligible: true,
    complete: true,
    reason: "clear",
    paths: installed.paths,
    drift: [],
    retainedPaths: [],
    writer: "clear",
  };
}

export function provisionBeadsBridgeWriterStorage(
  targetRootValue: string,
  dependenciesValue: BeadsWorkstationLifecycleDependencies = {},
): { schemaVersion: 1; projectRef: string; writerStatePath: string } {
  const deps = dependencies(dependenciesValue);
  assertHost(deps);
  const targetRoot = existingDirectory(targetRootValue, "Beads target root");
  const installed = readInstallRecord(targetRoot);
  if (installed == null) throw new BeadsWorkstationLifecycleError("Beads must be installed before writer storage is provisioned.", "not-installed");
  const observation = inspectInstalled({ ...installed, registration: null }, deps);
  const nonRegistrationDrift = observation.drift.filter((item) => item !== "untracked-registration");
  if (nonRegistrationDrift.length > 0) throw new BeadsWorkstationLifecycleError(`Beads installation drift blocks writer storage provisioning: ${nonRegistrationDrift.join(", ")}.`, "identity-drift");
  const registration = loadBeadsBridgeRegistration(installed.paths.registration);
  const adapter = installed.managedFiles.find((item) => item.role === "adapter");
  if (adapter == null
    || !samePath(registration.binaryPath, installed.paths.executable)
    || registration.binarySha256 !== installed.release.executableSha256
    || !samePath(registration.adapterPath, installed.paths.adapter)
    || registration.adapterSha256 !== adapter.sha256) {
    throw new BeadsWorkstationLifecycleError("Registration does not reference the managed Beads installation.", "registration-identity-drift");
  }
  const writerStatePath = path.join(installed.paths.bridgeRoot, registration.projectRef.slice("project_".length));
  const identity: RegistrationIdentity = {
    adapterSha256: registration.adapterSha256,
    effectPolicySha256: registration.effectPolicySha256,
    ownerClass: registration.ownerClass,
    prefix: registration.prefix,
    profileSha256: registration.profileSha256,
    projectRef: registration.projectRef,
    writerStatePath,
  };
  if (installed.registration != null && stableJson(installed.registration) !== stableJson(identity)) {
    throw new BeadsWorkstationLifecycleError("A different registration already owns the workstation writer storage.", "registration-conflict");
  }
  const stat = fs.lstatSync(writerStatePath, { throwIfNoEntry: false });
  if (stat == null) fs.mkdirSync(writerStatePath);
  else if (!stat.isDirectory() || stat.isSymbolicLink()) throw new BeadsWorkstationLifecycleError("Writer storage path is unsafe.", "writer-storage-unsafe");
  else if (installed.registration == null && fs.readdirSync(writerStatePath).length !== 0) throw new BeadsWorkstationLifecycleError("Unowned writer storage is not empty.", "writer-storage-unsafe");
  const next = { ...installed, registration: identity };
  replaceRecord(installed.paths.installRecord, next);
  const readback = readInstallRecord(targetRoot);
  if (readback == null || stableJson(readback.registration) !== stableJson(identity)) {
    throw new BeadsWorkstationLifecycleError("Writer storage ownership readback differs.", "writer-storage-readback-drift");
  }
  return { schemaVersion: 1, projectRef: registration.projectRef, writerStatePath };
}

export function runBeadsWorkstationLifecycle(
  request: BeadsWorkstationLifecycleRequest,
  dependenciesValue: BeadsWorkstationLifecycleDependencies = {},
): BeadsWorkstationLifecycleResult {
  const deps = dependencies(dependenciesValue);
  if (request.operation === "preview") return previewResult(request, deps);
  if (request.operation === "install") return install(request, deps);
  if (request.operation === "check") return check(request, deps);
  if (request.operation === "rollback") return rollback(request, deps);
  throw new BeadsWorkstationLifecycleError("Beads workstation operation is unsupported.", "unsupported-operation");
}
