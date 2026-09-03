import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import { loadBeadsReleaseManifest } from "./beads-release.ts";
import type { BeadsReleaseManifest } from "./beads-release.ts";

type JsonRecord = Record<string, unknown>;
type OwnerClass = "current-project" | "opencode-kit";
type LeaseOperation =
  | "project-enable"
  | "project-disable"
  | "create-feature"
  | "add-dependency"
  | "update-feature"
  | "assign-feature"
  | "close-feature"
  | "rollback";

export type BeadsBridgeRegistrationInput = {
  enabled: boolean;
  projectRoot: string;
  ownerClass: OwnerClass;
  prefix: string;
  binaryPath: string;
  binarySha256: string;
  adapterPath: string;
  adapterSha256: string;
  profileSha256: string;
};

export type BeadsBridgeRegistration = BeadsBridgeRegistrationInput & {
  schemaVersion: 1;
  projectRef: string;
  releaseVersion: "1.2.2";
  profileName: "core-beads";
  effectPolicySha256: string;
};

export type BeadsBridgeProcessIdentity = {
  pid: number;
  processRef: string;
  executableSha256: string;
  startedAt: string;
};

export type BeadsBridgeWriterLease = BeadsBridgeProcessIdentity & {
  schemaVersion: 1;
  operation: LeaseOperation;
  projectRef: string;
  registrationSha256: string;
  adapterSha256: string;
  token: string;
};

export type BeadsBridgeWriterClosure = {
  schemaVersion: 1;
  status: "terminal" | "write-isolated" | "unknown";
  observedAt: string;
  processRef: string;
  childProcessRefs: string[];
  evidenceRefs: string[];
};

export type BeadsBridgeCoordinationState = {
  schemaVersion: 1;
  projectRef: string;
  registrationSha256: string;
  writes: "available" | "blocked";
  writer: "clear" | "unknown";
  preserveManagedMaterial: boolean;
  reason: "clear" | "registration-disabled" | "writer-lease-present" | "writer-lease-unsafe";
  lease: null | { operation: LeaseOperation; processRef: string; startedAt: string };
};

export class BeadsBridgeRegistrationError extends Error {
  readonly code: string;

  constructor(message: string, code: string, options: { cause?: unknown } = {}) {
    super(message, options.cause == null ? undefined : { cause: options.cause });
    this.name = "BeadsBridgeRegistrationError";
    this.code = code;
  }
}

export const BEADS_BRIDGE_REGISTRATION_FILE = "beads-bridge-registration.json";

const SHA256 = /^[a-f0-9]{64}$/u;
const PREFIX = /^[A-Za-z][A-Za-z0-9_]{1,15}$/u;
const SAFE_REF = /^[A-Za-z][A-Za-z0-9:._-]{0,127}$/u;
const UUID = /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/u;
const LEASE_OPERATIONS = new Set<LeaseOperation>([
  "project-enable",
  "project-disable",
  "create-feature",
  "add-dependency",
  "update-feature",
  "assign-feature",
  "close-feature",
  "rollback",
]);
const REGISTRATION_KEYS = [
  "schemaVersion",
  "enabled",
  "projectRoot",
  "projectRef",
  "ownerClass",
  "prefix",
  "releaseVersion",
  "binaryPath",
  "binarySha256",
  "adapterPath",
  "adapterSha256",
  "profileName",
  "profileSha256",
  "effectPolicySha256",
] as const;
const LEASE_KEYS = [
  "schemaVersion",
  "operation",
  "projectRef",
  "registrationSha256",
  "adapterSha256",
  "pid",
  "processRef",
  "executableSha256",
  "startedAt",
  "token",
] as const;
const CLOSURE_KEYS = ["schemaVersion", "status", "observedAt", "processRef", "childProcessRefs", "evidenceRefs"] as const;

function record(value: unknown, label: string): JsonRecord {
  if (value == null || typeof value !== "object" || Array.isArray(value)) throw new Error(`${label} must be an object.`);
  return value as JsonRecord;
}

function exactKeys(value: JsonRecord, keys: readonly string[], label: string): void {
  const actual = Object.keys(value).sort();
  const expected = [...keys].sort();
  if (actual.length !== expected.length || actual.some((key, index) => key !== expected[index])) {
    throw new Error(`${label} fields are invalid.`);
  }
}

function stableValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stableValue);
  if (value == null || typeof value !== "object") return value;
  return Object.fromEntries(Object.entries(value as JsonRecord).sort(([left], [right]) => left.localeCompare(right)).map(([key, item]) => [key, stableValue(item)]));
}

function stableJson(value: unknown): string {
  return `${JSON.stringify(stableValue(value), null, 2)}\n`;
}

function sha256(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function fileSha256(file: string): string {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

function safeRef(value: unknown, label: string): string {
  if (typeof value !== "string" || !SAFE_REF.test(value) || value.includes("..")) throw new Error(`${label} must be a privacy-safe reference.`);
  return value;
}

function digest(value: unknown, label: string): string {
  if (typeof value !== "string" || !SHA256.test(value)) throw new Error(`${label} must be a lowercase SHA-256 digest.`);
  return value;
}

function timestamp(value: unknown, label: string): string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/u.test(value) || Number.isNaN(Date.parse(value))) {
    throw new Error(`${label} must be a UTC ISO timestamp.`);
  }
  return value;
}

function absolute(value: unknown, label: string): string {
  if (typeof value !== "string" || value.trim() === "" || value.includes("\0") || !path.isAbsolute(value)) {
    throw new Error(`${label} must be an absolute path.`);
  }
  return path.resolve(value);
}

function samePath(left: string, right: string): boolean {
  return path.resolve(left).toLowerCase() === path.resolve(right).toLowerCase();
}

function containedBy(parent: string, candidate: string): boolean {
  const relative = path.relative(parent, candidate);
  return relative !== "" && relative !== ".." && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative);
}

function canonicalGitRoot(value: unknown): string {
  const selected = absolute(value, "projectRoot");
  const stat = fs.lstatSync(selected, { throwIfNoEntry: false });
  if (stat == null || !stat.isDirectory() || stat.isSymbolicLink()) throw new Error("projectRoot must be a regular directory.");
  const root = fs.realpathSync.native(selected);
  if (!samePath(root, selected)) throw new Error("projectRoot must be canonical.");
  const git = fs.lstatSync(path.join(root, ".git"), { throwIfNoEntry: false });
  if (git == null || git.isSymbolicLink() || (!git.isDirectory() && !git.isFile())) throw new Error("projectRoot must be a Git root.");
  return root;
}

function registrationFile(file: string): { file: string; protectedRoot: string } {
  const selected = absolute(file, "registration file");
  if (path.basename(selected) !== BEADS_BRIDGE_REGISTRATION_FILE) throw new Error("registration file name is invalid.");
  const parent = path.dirname(selected);
  const stat = fs.lstatSync(parent, { throwIfNoEntry: false });
  if (stat == null || !stat.isDirectory() || stat.isSymbolicLink()) throw new Error("registration parent must be a regular directory.");
  const protectedRoot = fs.realpathSync.native(parent);
  if (!samePath(parent, protectedRoot)) throw new Error("registration parent must be canonical.");
  return { file: selected, protectedRoot };
}

function regularFile(file: string): boolean {
  const stat = fs.lstatSync(file, { throwIfNoEntry: false });
  return stat != null && stat.isFile() && !stat.isSymbolicLink();
}

function readRegularJson(file: string, label: string): unknown {
  if (!regularFile(file)) throw new Error(`${label} must be a regular file.`);
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (cause) {
    throw new Error(`${label} must contain valid JSON.`, { cause });
  }
}

function writeExclusiveDurable(file: string, content: string): void {
  let handle: number | null = null;
  try {
    handle = fs.openSync(file, "wx", 0o600);
    fs.writeFileSync(handle, content, "utf8");
    fs.fsyncSync(handle);
    fs.closeSync(handle);
    handle = null;
  } finally {
    if (handle != null) fs.closeSync(handle);
  }
}

function replaceDurable(file: string, content: string): void {
  const temporary = `${file}.pending-${crypto.randomUUID()}`;
  try {
    writeExclusiveDurable(temporary, content);
    fs.renameSync(temporary, file);
  } finally {
    if (fs.existsSync(temporary)) fs.rmSync(temporary, { force: true });
  }
}

function ensureOwnedDirectory(parent: string, name: string): string {
  const directory = path.join(parent, name);
  if (!fs.existsSync(directory)) fs.mkdirSync(directory, { recursive: false, mode: 0o700 });
  const stat = fs.lstatSync(directory);
  if (!stat.isDirectory() || stat.isSymbolicLink()) throw new Error("bridge state directory is unsafe.");
  return directory;
}

function effectPolicySha256(manifest: BeadsReleaseManifest): string {
  return sha256(stableJson(manifest.initialization));
}

function projectRef(root: string): string {
  return `project_${sha256(root).slice(0, 32)}`;
}

function parseRegistration(value: unknown, protectedRoot: string, manifest: BeadsReleaseManifest): BeadsBridgeRegistration {
  const input = record(value, "Beads bridge registration");
  exactKeys(input, REGISTRATION_KEYS, "Beads bridge registration");
  if (input.schemaVersion !== 1) throw new Error("registration schemaVersion must be 1.");
  if (typeof input.enabled !== "boolean") throw new Error("registration enabled must be boolean.");
  const root = canonicalGitRoot(input.projectRoot);
  if (containedBy(root, protectedRoot) || containedBy(protectedRoot, root) || samePath(root, protectedRoot)) {
    throw new Error("protected state and project root must be separate.");
  }
  const binaryPath = absolute(input.binaryPath, "binaryPath");
  const adapterPath = absolute(input.adapterPath, "adapterPath");
  if (!containedBy(protectedRoot, binaryPath) || !containedBy(protectedRoot, adapterPath)) {
    throw new Error("managed binary and adapter paths must stay inside protected state.");
  }
  if (path.basename(binaryPath).toLowerCase() !== manifest.release.executable.fileName) throw new Error("binaryPath file name is invalid.");
  if (!regularFile(adapterPath) || !samePath(fs.realpathSync.native(adapterPath), adapterPath)) throw new Error("adapterPath must be a canonical regular file.");
  if (fileSha256(adapterPath) !== input.adapterSha256) throw new Error("adapterSha256 does not match the registered adapter file.");
  if (input.ownerClass !== "current-project" && input.ownerClass !== "opencode-kit") throw new Error("ownerClass is invalid.");
  if (typeof input.prefix !== "string" || !PREFIX.test(input.prefix)) throw new Error("prefix is invalid.");
  const expectedProjectRef = projectRef(root);
  if (input.projectRef !== expectedProjectRef) throw new Error("projectRef does not match the canonical root.");
  if (input.releaseVersion !== manifest.release.version) throw new Error("releaseVersion does not match the reviewed release.");
  if (input.profileName !== "core-beads") throw new Error("profileName must be core-beads.");
  if (input.binarySha256 !== manifest.release.executable.sha256) throw new Error("binarySha256 does not match the reviewed release.");
  if (input.effectPolicySha256 !== effectPolicySha256(manifest)) throw new Error("effectPolicySha256 does not match the reviewed policy.");
  return {
    schemaVersion: 1,
    enabled: input.enabled,
    projectRoot: root,
    projectRef: expectedProjectRef,
    ownerClass: input.ownerClass,
    prefix: input.prefix,
    releaseVersion: "1.2.2",
    binaryPath,
    binarySha256: digest(input.binarySha256, "binarySha256"),
    adapterPath,
    adapterSha256: digest(input.adapterSha256, "adapterSha256"),
    profileName: "core-beads",
    profileSha256: digest(input.profileSha256, "profileSha256"),
    effectPolicySha256: digest(input.effectPolicySha256, "effectPolicySha256"),
  };
}

function parseProcessIdentity(value: unknown): BeadsBridgeProcessIdentity {
  const input = record(value, "bridge process identity");
  exactKeys(input, ["pid", "processRef", "executableSha256", "startedAt"], "bridge process identity");
  if (!Number.isInteger(input.pid) || (input.pid as number) < 1 || (input.pid as number) > 2_147_483_647) throw new Error("process pid is invalid.");
  return {
    pid: input.pid as number,
    processRef: safeRef(input.processRef, "processRef"),
    executableSha256: digest(input.executableSha256, "executableSha256"),
    startedAt: timestamp(input.startedAt, "startedAt"),
  };
}

function parseLease(value: unknown): BeadsBridgeWriterLease {
  const input = record(value, "Beads bridge writer lease");
  exactKeys(input, LEASE_KEYS, "Beads bridge writer lease");
  if (input.schemaVersion !== 1) throw new Error("writer lease schemaVersion must be 1.");
  if (typeof input.operation !== "string" || !LEASE_OPERATIONS.has(input.operation as LeaseOperation)) throw new Error("writer lease operation is invalid.");
  if (typeof input.token !== "string" || !UUID.test(input.token)) throw new Error("writer lease token is invalid.");
  return {
    schemaVersion: 1,
    operation: input.operation as LeaseOperation,
    projectRef: safeRef(input.projectRef, "projectRef"),
    registrationSha256: digest(input.registrationSha256, "registrationSha256"),
    adapterSha256: digest(input.adapterSha256, "adapterSha256"),
    ...parseProcessIdentity({
      pid: input.pid,
      processRef: input.processRef,
      executableSha256: input.executableSha256,
      startedAt: input.startedAt,
    }),
    token: input.token,
  };
}

function refs(value: unknown, label: string, minimum: number): string[] {
  if (!Array.isArray(value) || value.length < minimum || value.length > 64) throw new Error(`${label} cardinality is invalid.`);
  const parsed = value.map((item) => safeRef(item, label));
  if (new Set(parsed).size !== parsed.length) throw new Error(`${label} must be unique.`);
  return parsed;
}

function parseClosure(value: unknown): BeadsBridgeWriterClosure {
  const input = record(value, "Beads bridge writer closure");
  exactKeys(input, CLOSURE_KEYS, "Beads bridge writer closure");
  if (input.schemaVersion !== 1) throw new Error("writer closure schemaVersion must be 1.");
  if (input.status !== "terminal" && input.status !== "write-isolated" && input.status !== "unknown") throw new Error("writer closure status is invalid.");
  return {
    schemaVersion: 1,
    status: input.status,
    observedAt: timestamp(input.observedAt, "observedAt"),
    processRef: safeRef(input.processRef, "processRef"),
    childProcessRefs: refs(input.childProcessRefs, "childProcessRefs", 0),
    evidenceRefs: refs(input.evidenceRefs, "evidenceRefs", input.status === "unknown" ? 0 : 1),
  };
}

function statePaths(file: string, registration: BeadsBridgeRegistration, requireInstalledStorage: boolean): { lock: string; state: string } {
  const { protectedRoot } = registrationFile(file);
  const bridge = path.join(protectedRoot, "beads-bridge");
  const state = path.join(bridge, registration.projectRef.slice("project_".length));
  for (const directory of [bridge, state]) {
    const stat = fs.lstatSync(directory, { throwIfNoEntry: false });
    if (stat == null && requireInstalledStorage) throw new Error("bridge writer storage is not installed.");
    if (stat != null && (!stat.isDirectory() || stat.isSymbolicLink())) throw new Error("bridge state directory is unsafe.");
  }
  if (containedBy(registration.projectRoot, state) || samePath(registration.projectRoot, state)) {
    throw new Error("bridge writer state must remain outside the project.");
  }
  return { lock: path.join(state, "writer.lock"), state };
}

function registrationDigest(registration: BeadsBridgeRegistration): string {
  const { enabled: _enabled, ...identity } = registration;
  return sha256(stableJson(identity));
}

function readLease(file: string): BeadsBridgeWriterLease {
  return parseLease(readRegularJson(file, "Beads bridge writer lease"));
}

function requireLeaseCorrelation(lease: BeadsBridgeWriterLease, registration: BeadsBridgeRegistration): void {
  if (
    lease.projectRef !== registration.projectRef
    || lease.registrationSha256 !== registrationDigest(registration)
    || lease.adapterSha256 !== registration.adapterSha256
  ) {
    throw new BeadsBridgeRegistrationError("Bridge writer lease does not match the active registration.", "lease-drift");
  }
}

export function createBeadsBridgeRegistration(file: string, value: BeadsBridgeRegistrationInput): BeadsBridgeRegistration {
  let selected: ReturnType<typeof registrationFile>;
  let registration: BeadsBridgeRegistration;
  try {
    selected = registrationFile(file);
    const manifest = loadBeadsReleaseManifest();
    registration = parseRegistration({
      schemaVersion: 1,
      ...value,
      projectRef: projectRef(canonicalGitRoot(value.projectRoot)),
      releaseVersion: manifest.release.version,
      profileName: "core-beads",
      effectPolicySha256: effectPolicySha256(manifest),
    }, selected.protectedRoot, manifest);
  } catch (cause) {
    throw new BeadsBridgeRegistrationError("Beads bridge registration input is invalid.", "registration-invalid", { cause });
  }
  if (fs.existsSync(selected.file)) {
    const current = loadBeadsBridgeRegistration(selected.file);
    if (stableJson(current) === stableJson(registration)) return current;
    throw new BeadsBridgeRegistrationError("A different Beads bridge registration already exists.", "registration-conflict");
  }
  try {
    writeExclusiveDurable(selected.file, stableJson(registration));
  } catch (cause) {
    const code = (cause as NodeJS.ErrnoException).code === "EEXIST" ? "registration-conflict" : "registration-write-failed";
    throw new BeadsBridgeRegistrationError("Beads bridge registration could not be created.", code, { cause });
  }
  const readback = loadBeadsBridgeRegistration(selected.file);
  if (stableJson(readback) !== stableJson(registration)) throw new BeadsBridgeRegistrationError("Beads bridge registration readback differs.", "registration-drift");
  return readback;
}

export function loadBeadsBridgeRegistration(file: string): BeadsBridgeRegistration {
  const selected = registrationFile(file);
  try {
    return parseRegistration(readRegularJson(selected.file, "Beads bridge registration"), selected.protectedRoot, loadBeadsReleaseManifest());
  } catch (cause) {
    if (cause instanceof BeadsBridgeRegistrationError) throw cause;
    throw new BeadsBridgeRegistrationError("Beads bridge registration is invalid or unreadable.", "registration-invalid", { cause });
  }
}

export function inspectBeadsBridgeCoordination(file: string): BeadsBridgeCoordinationState {
  const registration = loadBeadsBridgeRegistration(file);
  const digest = registrationDigest(registration);
  let paths: ReturnType<typeof statePaths>;
  try {
    paths = statePaths(file, registration, registration.enabled);
  } catch {
    return {
      schemaVersion: 1,
      projectRef: registration.projectRef,
      registrationSha256: digest,
      writes: "blocked",
      writer: "unknown",
      preserveManagedMaterial: true,
      reason: "writer-lease-unsafe",
      lease: null,
    };
  }
  if (!fs.existsSync(paths.lock)) {
    return {
      schemaVersion: 1,
      projectRef: registration.projectRef,
      registrationSha256: digest,
      writes: registration.enabled ? "available" : "blocked",
      writer: "clear",
      preserveManagedMaterial: false,
      reason: registration.enabled ? "clear" : "registration-disabled",
      lease: null,
    };
  }
  try {
    const lease = readLease(paths.lock);
    requireLeaseCorrelation(lease, registration);
    return {
      schemaVersion: 1,
      projectRef: registration.projectRef,
      registrationSha256: digest,
      writes: "blocked",
      writer: "unknown",
      preserveManagedMaterial: true,
      reason: "writer-lease-present",
      lease: { operation: lease.operation, processRef: lease.processRef, startedAt: lease.startedAt },
    };
  } catch {
    return {
      schemaVersion: 1,
      projectRef: registration.projectRef,
      registrationSha256: digest,
      writes: "blocked",
      writer: "unknown",
      preserveManagedMaterial: true,
      reason: "writer-lease-unsafe",
      lease: null,
    };
  }
}

export function setBeadsBridgeRegistrationEnabled(
  file: string,
  expected: BeadsBridgeRegistration,
  lease: BeadsBridgeWriterLease,
  enabled: boolean,
): BeadsBridgeRegistration {
  const current = loadBeadsBridgeRegistration(file);
  if (stableJson(current) !== stableJson(expected)) throw new BeadsBridgeRegistrationError("Registration changed before enabled-state transition.", "registration-drift");
  const parsedLease = parseLease(lease);
  requireLeaseCorrelation(parsedLease, current);
  const requiredOperation = enabled ? "project-enable" : "project-disable";
  if (parsedLease.operation !== requiredOperation) throw new BeadsBridgeRegistrationError("Writer lease does not admit this enabled-state transition.", "lease-operation-mismatch");
  const paths = statePaths(file, current, true);
  const stored = readLease(paths.lock);
  requireLeaseCorrelation(stored, current);
  if (stableJson(stored) !== stableJson(parsedLease)) throw new BeadsBridgeRegistrationError("Bridge writer lease changed before enabled-state transition.", "lease-drift");
  const next = parseRegistration({ ...current, enabled }, registrationFile(file).protectedRoot, loadBeadsReleaseManifest());
  try {
    replaceDurable(registrationFile(file).file, stableJson(next));
  } catch (cause) {
    throw new BeadsBridgeRegistrationError("Registration enabled state could not be replaced.", "registration-write-failed", { cause });
  }
  const readback = loadBeadsBridgeRegistration(file);
  if (stableJson(readback) !== stableJson(next)) throw new BeadsBridgeRegistrationError("Registration enabled-state readback differs.", "registration-drift");
  return readback;
}

export function acquireBeadsBridgeWriterLease(
  file: string,
  expected: BeadsBridgeRegistration,
  operation: LeaseOperation,
  processIdentity: BeadsBridgeProcessIdentity,
): BeadsBridgeWriterLease {
  const current = loadBeadsBridgeRegistration(file);
  if (stableJson(current) !== stableJson(expected)) throw new BeadsBridgeRegistrationError("Registration changed before lease acquisition.", "registration-drift");
  if (!LEASE_OPERATIONS.has(operation)) throw new BeadsBridgeRegistrationError("Bridge writer operation is unsupported.", "unsupported-operation");
  if (operation === "project-enable" ? current.enabled : operation !== "rollback" && !current.enabled) {
    throw new BeadsBridgeRegistrationError("Registration enabled state does not admit this mutation.", "registration-state");
  }
  let paths: ReturnType<typeof statePaths>;
  try {
    paths = statePaths(file, current, true);
  } catch (cause) {
    throw new BeadsBridgeRegistrationError("Bridge writer state is unsafe and remains an unknown repair gate.", "writer-liveness-unknown", { cause });
  }
  if (fs.existsSync(paths.lock)) {
    try {
      readLease(paths.lock);
    } catch (cause) {
      throw new BeadsBridgeRegistrationError("Bridge writer lease is unsafe and remains an unknown repair gate.", "writer-liveness-unknown", { cause });
    }
    throw new BeadsBridgeRegistrationError("Bridge writer lease already exists and liveness is unknown.", "writer-liveness-unknown");
  }
  let lease: BeadsBridgeWriterLease;
  try {
    const identity = parseProcessIdentity(processIdentity);
    lease = parseLease({
      schemaVersion: 1,
      operation,
      projectRef: current.projectRef,
      registrationSha256: registrationDigest(current),
      adapterSha256: current.adapterSha256,
      ...identity,
      token: crypto.randomUUID(),
    });
    writeExclusiveDurable(paths.lock, stableJson(lease));
  } catch (cause) {
    const code = (cause as NodeJS.ErrnoException).code === "EEXIST" ? "writer-liveness-unknown" : "lease-acquire-failed";
    throw new BeadsBridgeRegistrationError("Bridge writer lease could not be acquired.", code, { cause });
  }
  if (stableJson(readLease(paths.lock)) !== stableJson(lease)) throw new BeadsBridgeRegistrationError("Bridge writer lease readback differs.", "lease-drift");
  return lease;
}

export function releaseBeadsBridgeWriterLease(
  file: string,
  expected: BeadsBridgeRegistration,
  lease: BeadsBridgeWriterLease,
  closureValue: BeadsBridgeWriterClosure,
): string {
  const current = loadBeadsBridgeRegistration(file);
  if (stableJson(current) !== stableJson(expected)) throw new BeadsBridgeRegistrationError("Registration changed before lease release.", "registration-drift");
  const closure = parseClosure(closureValue);
  const parsedLease = parseLease(lease);
  requireLeaseCorrelation(parsedLease, current);
  if (closure.status === "unknown") throw new BeadsBridgeRegistrationError("Writer closure is unknown; the lease remains held.", "writer-liveness-unknown");
  if (closure.processRef !== parsedLease.processRef) throw new BeadsBridgeRegistrationError("Writer closure process does not match the lease.", "closure-mismatch");
  let paths: ReturnType<typeof statePaths>;
  try {
    paths = statePaths(file, current, true);
  } catch (cause) {
    throw new BeadsBridgeRegistrationError("Bridge writer state is unsafe and remains an unknown repair gate.", "writer-liveness-unknown", { cause });
  }
  const stored = readLease(paths.lock);
  requireLeaseCorrelation(stored, current);
  if (stableJson(stored) !== stableJson(parsedLease)) throw new BeadsBridgeRegistrationError("Bridge writer lease changed before release.", "lease-drift");
  const leases = ensureOwnedDirectory(paths.state, "leases");
  const archive = path.join(leases, `${closure.status}-${sha256(stableJson({ lease: parsedLease, closure })).slice(0, 16)}.json`);
  const archived = { schemaVersion: 1, lease: parsedLease, closure };
  if (fs.existsSync(archive)) {
    if (stableJson(readRegularJson(archive, "writer closure archive")) !== stableJson(archived)) {
      throw new BeadsBridgeRegistrationError("Writer closure archive differs.", "closure-drift");
    }
  } else {
    writeExclusiveDurable(archive, stableJson(archived));
  }
  if (stableJson(readLease(paths.lock)) !== stableJson(parsedLease)) throw new BeadsBridgeRegistrationError("Bridge writer lease changed during release.", "lease-drift");
  try {
    fs.unlinkSync(paths.lock);
  } catch (cause) {
    throw new BeadsBridgeRegistrationError("Bridge writer lease deletion is unknown.", "writer-liveness-unknown", { cause });
  }
  return path.relative(path.dirname(file), archive).replaceAll("\\", "/");
}
