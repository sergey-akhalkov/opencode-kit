import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { runPortableCommand, runPortableCommandStreaming } from "../portable-process.ts";
import { stableJson } from "../roadmap-mission/contracts.ts";
import {
  loadWorkCampaignDefinition,
  parseWorkCampaignResult,
  WorkCampaignError,
} from "./contracts.ts";
import type {
  CampaignSupervisionAdvice,
  WorkCampaignResult,
} from "./contracts.ts";

type JsonRecord = Record<string, unknown>;

type CampaignSupervisorPolicy = {
  backoffMs: number[];
  commandTimeoutMs: number;
  healthPollMs: number;
  healthTimeoutMs: number;
  logBytes: number;
  logGenerations: number;
  maxRestarts: number;
};

type CampaignSupervisorRegistration = {
  definitionDigest: string;
  definitionPath: string;
  enabled: boolean;
  id: string;
  root: string;
};

type CampaignSupervisorRegistry = {
  policy: CampaignSupervisorPolicy;
  registrations: CampaignSupervisorRegistration[];
  runtime: {
    endpoint: string;
    expectedVersion: string;
  };
  schemaVersion: 1;
  workCampaignDigest: string;
};

type SupervisorReason = CampaignSupervisionAdvice["reason"]
  | "duplicate-supervisor"
  | "preflight-blocked"
  | "registry-disabled"
  | "resume-failed"
  | "runtime-not-ready"
  | "stop-requested";

type CampaignSupervisorRow = {
  attempts: number;
  campaign: Pick<WorkCampaignResult, "disposition" | "phase" | "supervision" | "writerClosure"> | null;
  id: string;
  logs: string[];
  process: {
    executableDigest: string;
    owner: "campaign-controller";
    pid: number;
    processRef: string;
    startedAt: string;
  } | null;
  reason: SupervisorReason;
  state: "blocked" | "ready" | "resumed" | "stopped" | "suppressed" | "unknown";
};

type CampaignSupervisorReport = {
  operation: "run" | "status" | "stop";
  recordType: "campaign-supervisor-report";
  registryDigest: string;
  rows: CampaignSupervisorRow[];
  runtime: {
    healthy: boolean;
    status: number | null;
    version: string | null;
  };
  schemaVersion: 1;
  tool: "work-campaign-supervisor";
};

type SupervisorOperationOptions = {
  environment?: NodeJS.ProcessEnv;
  operation: CampaignSupervisorReport["operation"];
  registrationId?: string;
  registryPath: string;
  signal?: AbortSignal;
};

type CampaignSupervisorDependencies = {
  runStreaming: typeof runPortableCommandStreaming;
  wait: (ms: number, signal?: AbortSignal) => Promise<void>;
};

const SAFE_ID = /^[a-z0-9][a-z0-9._-]{0,99}$/u;
const SHA256 = /^[a-f0-9]{64}$/u;
const WORK_CAMPAIGN_PATH = fileURLToPath(new URL("../work-campaign.ts", import.meta.url));

function record(value: unknown, field: string): JsonRecord {
  if (value == null || typeof value !== "object" || Array.isArray(value)) throw new WorkCampaignError(`${field} must be an object`, 2, { field });
  return value as JsonRecord;
}

function exactKeys(value: JsonRecord, expected: string[], field: string): void {
  const actual = Object.keys(value).sort();
  const required = [...expected].sort();
  if (stableJson(actual) !== stableJson(required)) throw new WorkCampaignError(`${field} has invalid fields`, 2, { field });
}

function text(value: unknown, field: string, pattern?: RegExp): string {
  if (typeof value !== "string" || value.trim() === "" || value.length > 1_000 || (pattern != null && !pattern.test(value))) {
    throw new WorkCampaignError(`${field} is invalid`, 2, { field });
  }
  return value;
}

function integer(value: unknown, field: string, minimum: number, maximum: number): number {
  if (!Number.isSafeInteger(value) || (value as number) < minimum || (value as number) > maximum) {
    throw new WorkCampaignError(`${field} must be an integer from ${minimum} through ${maximum}`, 2, { field });
  }
  return value as number;
}

function digestFile(file: string, field: string): string {
  try {
    return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
  } catch (error) {
    throw new WorkCampaignError(`${field} identity is unreadable`, 2, { cause: error, field });
  }
}

function samePath(left: string, right: string): boolean {
  const a = path.resolve(left);
  const b = path.resolve(right);
  return process.platform === "win32" ? a.toLocaleLowerCase() === b.toLocaleLowerCase() : a === b;
}

function containedFile(root: string, relative: string, field: string): string {
  const normalized = text(relative, field).replaceAll("\\", "/");
  if (path.posix.isAbsolute(normalized) || path.win32.isAbsolute(normalized)
    || normalized.split("/").some((part) => part === "" || part === "." || part === "..")) {
    throw new WorkCampaignError(`${field} must be a contained project-relative file`, 2, { field });
  }
  const absolute = path.resolve(root, normalized);
  const lexical = path.relative(path.resolve(root), absolute);
  if (lexical.startsWith("..") || path.isAbsolute(lexical)) throw new WorkCampaignError(`${field} escapes the project root`, 2, { field });
  const stat = fs.lstatSync(absolute, { throwIfNoEntry: false });
  if (stat == null || !stat.isFile() || stat.isSymbolicLink()) throw new WorkCampaignError(`${field} must identify a regular file`, 2, { field });
  return normalized;
}

function canonicalGitRoot(value: unknown, field: string, environment: NodeJS.ProcessEnv): string {
  const requested = path.resolve(text(value, field));
  const stat = fs.lstatSync(requested, { throwIfNoEntry: false });
  if (stat == null || !stat.isDirectory() || stat.isSymbolicLink()) throw new WorkCampaignError(`${field} must identify a regular directory`, 2, { field });
  const canonical = fs.realpathSync(requested);
  if (!samePath(requested, canonical)) throw new WorkCampaignError(`${field} must be canonical`, 2, { field });
  const git = runPortableCommand(canonical, ["git", "rev-parse", "--show-toplevel"], { capture: true, env: environment, timeoutMs: 10_000 });
  if (git.error != null || git.status !== 0 || !samePath(git.stdout.trim(), canonical)) {
    throw new WorkCampaignError(`${field} must be the exact Git worktree root`, 2, { cause: git.error, field });
  }
  return canonical;
}

function loopbackEndpoint(value: unknown): string {
  let parsed: URL;
  try {
    parsed = new URL(text(value, "runtime.endpoint"));
  } catch (error) {
    throw new WorkCampaignError("runtime.endpoint is invalid", 2, { cause: error, field: "runtime.endpoint" });
  }
  const host = parsed.hostname.toLocaleLowerCase();
  if (parsed.protocol !== "http:" || !["127.0.0.1", "localhost", "[::1]", "::1"].includes(host)
    || parsed.username !== "" || parsed.password !== "" || parsed.search !== "" || parsed.hash !== ""
    || (parsed.pathname !== "" && parsed.pathname !== "/")) {
    throw new WorkCampaignError("runtime.endpoint must be an uncredentialed loopback HTTP origin", 2, { field: "runtime.endpoint" });
  }
  return parsed.origin;
}

export function loadCampaignSupervisorRegistry(
  registryPath: string,
  environment: NodeJS.ProcessEnv = process.env,
): { digest: string; path: string; registry: CampaignSupervisorRegistry } {
  if (!path.isAbsolute(registryPath)) throw new WorkCampaignError("--registry must be absolute", 2, { field: "registry" });
  const absolute = path.resolve(registryPath);
  const stat = fs.lstatSync(absolute, { throwIfNoEntry: false });
  if (stat == null || !stat.isFile() || stat.isSymbolicLink()) throw new WorkCampaignError("registry must be a regular file", 2, { field: "registry" });
  let input: JsonRecord;
  try {
    input = record(JSON.parse(fs.readFileSync(absolute, "utf8")), "registry");
  } catch (error) {
    if (error instanceof WorkCampaignError) throw error;
    throw new WorkCampaignError("registry is not readable JSON", 2, { cause: error, field: "registry" });
  }
  exactKeys(input, ["policy", "registrations", "runtime", "schemaVersion", "workCampaignDigest"], "registry");
  if (input.schemaVersion !== 1) throw new WorkCampaignError("registry.schemaVersion must be 1", 2, { field: "schemaVersion" });
  const policyInput = record(input.policy, "policy");
  exactKeys(policyInput, ["backoffMs", "commandTimeoutMs", "healthPollMs", "healthTimeoutMs", "logBytes", "logGenerations", "maxRestarts"], "policy");
  if (!Array.isArray(policyInput.backoffMs) || policyInput.backoffMs.length > 10) throw new WorkCampaignError("policy.backoffMs is invalid", 2, { field: "policy.backoffMs" });
  const backoffMs = policyInput.backoffMs.map((value, index) => integer(value, `policy.backoffMs.${index}`, 0, 60_000));
  const policy: CampaignSupervisorPolicy = {
    backoffMs,
    commandTimeoutMs: integer(policyInput.commandTimeoutMs, "policy.commandTimeoutMs", 100, 600_000),
    healthPollMs: integer(policyInput.healthPollMs, "policy.healthPollMs", 10, 10_000),
    healthTimeoutMs: integer(policyInput.healthTimeoutMs, "policy.healthTimeoutMs", 100, 300_000),
    logBytes: integer(policyInput.logBytes, "policy.logBytes", 1_024, 5_000_000),
    logGenerations: integer(policyInput.logGenerations, "policy.logGenerations", 1, 20),
    maxRestarts: integer(policyInput.maxRestarts, "policy.maxRestarts", 0, 10),
  };
  if (backoffMs.length < policy.maxRestarts) throw new WorkCampaignError("policy.backoffMs must cover every restart", 2, { field: "policy.backoffMs" });
  const runtimeInput = record(input.runtime, "runtime");
  exactKeys(runtimeInput, ["endpoint", "expectedVersion"], "runtime");
  const workCampaignDigest = text(input.workCampaignDigest, "workCampaignDigest", SHA256);
  if (digestFile(WORK_CAMPAIGN_PATH, "workCampaign") !== workCampaignDigest) throw new WorkCampaignError("workCampaignDigest differs from the installed campaign entrypoint", 2, { field: "workCampaignDigest" });
  if (!Array.isArray(input.registrations) || input.registrations.length === 0 || input.registrations.length > 64) {
    throw new WorkCampaignError("registrations must contain 1..64 rows", 2, { field: "registrations" });
  }
  const registrations = input.registrations.map((value, index) => {
    const row = record(value, `registrations.${index}`);
    exactKeys(row, ["definitionDigest", "definitionPath", "enabled", "id", "root"], `registrations.${index}`);
    if (typeof row.enabled !== "boolean") throw new WorkCampaignError(`registrations.${index}.enabled must be boolean`, 2, { field: `registrations.${index}.enabled` });
    const root = canonicalGitRoot(row.root, `registrations.${index}.root`, environment);
    const definitionPath = containedFile(root, text(row.definitionPath, `registrations.${index}.definitionPath`), `registrations.${index}.definitionPath`);
    const loaded = loadWorkCampaignDefinition(root, definitionPath);
    const definitionDigest = text(row.definitionDigest, `registrations.${index}.definitionDigest`, SHA256);
    if (loaded.definitionDigest !== definitionDigest) throw new WorkCampaignError(`registrations.${index}.definitionDigest is stale`, 2, { field: `registrations.${index}.definitionDigest` });
    return {
      definitionDigest,
      definitionPath,
      enabled: row.enabled,
      id: text(row.id, `registrations.${index}.id`, SAFE_ID),
      root,
    };
  });
  if (new Set(registrations.map((row) => row.id)).size !== registrations.length) throw new WorkCampaignError("registration ids must be unique", 2, { field: "registrations" });
  const registry: CampaignSupervisorRegistry = {
    policy,
    registrations,
    runtime: {
      endpoint: loopbackEndpoint(runtimeInput.endpoint),
      expectedVersion: text(runtimeInput.expectedVersion, "runtime.expectedVersion", /^[A-Za-z0-9][A-Za-z0-9._+-]{0,99}$/u),
    },
    schemaVersion: 1,
    workCampaignDigest,
  };
  return {
    digest: crypto.createHash("sha256").update(stableJson(registry)).digest("hex"),
    path: absolute,
    registry,
  };
}

type Health = CampaignSupervisorReport["runtime"];

async function probeRuntime(registry: CampaignSupervisorRegistry, environment: NodeJS.ProcessEnv, timeoutMs: number): Promise<Health> {
  const password = environment.OPENCODE_SERVER_PASSWORD;
  if (password == null || password.length < 1) return { healthy: false, status: null, version: null };
  const abort = new AbortController();
  const timer = setTimeout(() => abort.abort(), timeoutMs);
  try {
    const response = await fetch(`${registry.runtime.endpoint}/global/health`, {
      headers: { authorization: `Basic ${Buffer.from(`opencode:${password}`, "utf8").toString("base64")}` },
      signal: abort.signal,
    });
    let payload: JsonRecord | null = null;
    try {
      payload = record(await response.json(), "runtime health");
    } catch {
      payload = null;
    }
    const version = typeof payload?.version === "string" ? payload.version : null;
    return {
      healthy: response.status === 200 && payload?.healthy === true && version === registry.runtime.expectedVersion,
      status: response.status,
      version,
    };
  } catch {
    return { healthy: false, status: null, version: null };
  } finally {
    clearTimeout(timer);
  }
}

function wait(ms: number, signal?: AbortSignal): Promise<void> {
  if (signal?.aborted || ms === 0) return Promise.resolve();
  return new Promise((resolve) => {
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener("abort", () => { clearTimeout(timer); resolve(); }, { once: true });
  });
}

async function waitForRuntime(registry: CampaignSupervisorRegistry, environment: NodeJS.ProcessEnv, signal?: AbortSignal): Promise<Health> {
  const deadline = Date.now() + registry.policy.healthTimeoutMs;
  let health: Health = { healthy: false, status: null, version: null };
  do {
    health = await probeRuntime(registry, environment, Math.min(registry.policy.commandTimeoutMs, 10_000));
    if (health.healthy || signal?.aborted || Date.now() >= deadline) return health;
    await wait(registry.policy.healthPollMs, signal);
  } while (Date.now() <= deadline);
  return health;
}

function campaignArgv(operation: "preflight" | "resume" | "status" | "stop", registration: CampaignSupervisorRegistration): string[] {
  const base = [WORK_CAMPAIGN_PATH, operation, "--root", registration.root, "--definition", registration.definitionPath];
  return operation === "stop" ? [...base, "--source", "supervisor", "--evidence-ref", `supervisor:${registration.id}`] : base;
}

function invokeCampaign(
  operation: "preflight" | "status" | "stop",
  registration: CampaignSupervisorRegistration,
  policy: CampaignSupervisorPolicy,
  environment: NodeJS.ProcessEnv,
): { output: JsonRecord | WorkCampaignResult | null; status: number | null } {
  const invoked = runPortableCommand(registration.root, [process.execPath, ...campaignArgv(operation, registration)], {
    capture: true,
    env: environment,
    timeoutMs: policy.commandTimeoutMs,
  });
  const source = invoked.stdout.trim() || invoked.stderr.trim();
  let output: JsonRecord | WorkCampaignResult | null = null;
  try {
    const parsed = JSON.parse(source) as unknown;
    output = operation === "status" || operation === "stop" ? parseWorkCampaignResult(parsed) : record(parsed, "preflight result");
  } catch {
    output = null;
  }
  return { output, status: invoked.status };
}

function campaignSummary(result: WorkCampaignResult | null): CampaignSupervisorRow["campaign"] {
  return result == null ? null : {
    disposition: result.disposition,
    phase: result.phase,
    supervision: result.supervision,
    writerClosure: result.writerClosure,
  };
}

function reconcileRegistration(
  registration: CampaignSupervisorRegistration,
  policy: CampaignSupervisorPolicy,
  environment: NodeJS.ProcessEnv,
): { advice: CampaignSupervisionAdvice | null; campaign: WorkCampaignResult | null; reason: SupervisorReason } {
  const preflight = invokeCampaign("preflight", registration, policy, environment);
  if (preflight.status !== 0 || preflight.output == null || preflight.output.definitionDigest !== registration.definitionDigest || preflight.output.status !== "eligible") {
    return { advice: null, campaign: null, reason: "preflight-blocked" };
  }
  const status = invokeCampaign("status", registration, policy, environment);
  const campaign = status.output != null && "recordType" in status.output ? status.output as WorkCampaignResult : null;
  if (campaign == null || campaign.definitionDigest !== registration.definitionDigest || campaign.supervision == null) {
    return { advice: null, campaign, reason: "definition-or-project-drift" };
  }
  return { advice: campaign.supervision, campaign, reason: campaign.supervision.reason };
}

function runtimeRoot(registryPath: string, id: string): string {
  return path.join(path.dirname(registryPath), "runtime", id);
}

function processAlive(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return (error as NodeJS.ErrnoException).code === "EPERM";
  }
}

function acquireLease(directory: string, registration: CampaignSupervisorRegistration, registryDigest: string): { bytes: string; file: string } | null {
  fs.mkdirSync(directory, { recursive: true });
  const file = path.join(directory, "supervisor.lock");
  if (fs.existsSync(file)) {
    let prior: JsonRecord;
    try {
      const stat = fs.lstatSync(file);
      if (!stat.isFile() || stat.isSymbolicLink()) return null;
      prior = record(JSON.parse(fs.readFileSync(file, "utf8")), "supervisor lease");
    } catch {
      return null;
    }
    if (typeof prior.pid !== "number" || processAlive(prior.pid)) return null;
    const archive = path.join(directory, `supervisor.stale-${crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex").slice(0, 16)}.json`);
    if (!fs.existsSync(archive)) fs.renameSync(file, archive);
    else if (fs.readFileSync(archive, "utf8") === fs.readFileSync(file, "utf8")) fs.unlinkSync(file);
    else return null;
  }
  const startedAt = new Date().toISOString();
  const executableDigest = digestFile(process.execPath, "supervisor executable");
  const bytes = stableJson({
    executableDigest,
    owner: "campaign-supervisor",
    pid: process.pid,
    processRef: `process:${registration.id}-${crypto.createHash("sha256").update(`${process.pid}:${startedAt}:${registryDigest}`).digest("hex").slice(0, 24)}`,
    registrationId: registration.id,
    registryDigest,
    schemaVersion: 1,
    startedAt,
  });
  fs.writeFileSync(file, bytes, { encoding: "utf8", flag: "wx" });
  return { bytes, file };
}

function releaseLease(lease: { bytes: string; file: string }): boolean {
  try {
    if (fs.readFileSync(lease.file, "utf8") !== lease.bytes) return false;
    fs.unlinkSync(lease.file);
    return true;
  } catch {
    return false;
  }
}

function privacySafe(value: string, registration: CampaignSupervisorRegistration, supervisorRoot: string, environment: NodeJS.ProcessEnv): string {
  let safe = value.replaceAll(registration.root, "<project-root>").replaceAll(supervisorRoot, "<supervisor-root>");
  const password = environment.OPENCODE_SERVER_PASSWORD;
  if (password != null && password !== "") safe = safe.replaceAll(password, "<redacted>");
  return safe.replace(/[\0]+/gu, "");
}

function writeLogGeneration(
  directory: string,
  registration: CampaignSupervisorRegistration,
  policy: CampaignSupervisorPolicy,
  environment: NodeJS.ProcessEnv,
  result: Awaited<ReturnType<typeof runPortableCommandStreaming>>,
): string[] {
  const logRoot = path.join(directory, "logs");
  fs.mkdirSync(logRoot, { recursive: true });
  const generations = fs.readdirSync(logRoot).flatMap((name) => {
    const match = /^(\d{6})\.meta\.json$/u.exec(name);
    return match == null ? [] : [Number.parseInt(match[1], 10)];
  });
  const generation = (generations.length === 0 ? 0 : Math.max(...generations)) + 1;
  const prefix = String(generation).padStart(6, "0");
  const executableDigest = digestFile(process.execPath, "campaign controller executable");
  const processRef = result.pid == null ? null : `process:${registration.id}-${crypto.createHash("sha256").update(`${result.pid}:${result.startedAt}:${executableDigest}`).digest("hex").slice(0, 24)}`;
  const files = [`${prefix}.stdout.log`, `${prefix}.stderr.log`, `${prefix}.meta.json`];
  fs.writeFileSync(path.join(logRoot, files[0]), privacySafe(result.stdout.slice(0, policy.logBytes), registration, directory, environment), { encoding: "utf8", flag: "wx" });
  fs.writeFileSync(path.join(logRoot, files[1]), privacySafe(result.stderr.slice(0, policy.logBytes), registration, directory, environment), { encoding: "utf8", flag: "wx" });
  fs.writeFileSync(path.join(logRoot, files[2]), stableJson({
    cleanup: result.cleanupState ?? (result.forced ? "unknown" : "terminal"),
    executableDigest,
    owner: "campaign-controller",
    pid: result.pid,
    processRef,
    schemaVersion: 1,
    signal: result.signal,
    startedAt: result.startedAt,
    status: result.status,
    stopped: result.stopped,
    timedOut: result.timedOut,
  }), { encoding: "utf8", flag: "wx" });
  const retained = [...generations, generation].sort((left, right) => left - right);
  for (const expired of retained.slice(0, Math.max(0, retained.length - policy.logGenerations))) {
    const old = String(expired).padStart(6, "0");
    for (const suffix of ["stdout.log", "stderr.log", "meta.json"]) {
      const file = path.join(logRoot, `${old}.${suffix}`);
      const stat = fs.lstatSync(file, { throwIfNoEntry: false });
      if (stat == null || !stat.isFile() || stat.isSymbolicLink()) throw new WorkCampaignError("supervisor log rotation encountered unsafe material", 1, { field: "logs" });
      fs.unlinkSync(file);
    }
  }
  return files.map((name) => `runtime/${registration.id}/logs/${name}`);
}

async function resumeRegistration(
  registryPath: string,
  registryDigest: string,
  registration: CampaignSupervisorRegistration,
  policy: CampaignSupervisorPolicy,
  environment: NodeJS.ProcessEnv,
  dependencies: CampaignSupervisorDependencies,
  signal?: AbortSignal,
): Promise<CampaignSupervisorRow> {
  const directory = runtimeRoot(registryPath, registration.id);
  const lease = acquireLease(directory, registration, registryDigest);
  if (lease == null) return { attempts: 0, campaign: null, id: registration.id, logs: [], process: null, reason: "duplicate-supervisor", state: "unknown" };
  let logs: string[] = [];
  let lastCampaign: WorkCampaignResult | null = null;
  let processIdentity: CampaignSupervisorRow["process"] = null;
  try {
    for (let attempt = 0; attempt <= policy.maxRestarts; attempt++) {
      const reconciled = reconcileRegistration(registration, policy, environment);
      lastCampaign = reconciled.campaign;
      if (reconciled.advice?.action !== "resume") {
        return {
          attempts: attempt,
          campaign: campaignSummary(lastCampaign),
          id: registration.id,
          logs,
          process: processIdentity,
          reason: reconciled.reason,
          state: reconciled.advice?.action === "unknown" ? "unknown" : "suppressed",
        };
      }
      let stopRecorded = false;
      const child = await dependencies.runStreaming(registration.root, [process.execPath, ...campaignArgv("resume", registration)], {
        captureBytes: policy.logBytes,
        env: environment,
        shouldStop: () => {
          if (!signal?.aborted) return false;
          if (!stopRecorded) {
            invokeCampaign("stop", registration, policy, environment);
            stopRecorded = true;
          }
          return true;
        },
        stopGraceMs: 5_000,
        timeoutMs: policy.commandTimeoutMs,
      });
      const generationLogs = writeLogGeneration(directory, registration, policy, environment, child);
      logs = [...logs, ...generationLogs];
      const executableDigest = digestFile(process.execPath, "campaign controller executable");
      processIdentity = child.pid == null ? null : {
        executableDigest,
        owner: "campaign-controller",
        pid: child.pid,
        processRef: `process:${registration.id}-${crypto.createHash("sha256").update(`${child.pid}:${child.startedAt}:${executableDigest}`).digest("hex").slice(0, 24)}`,
        startedAt: child.startedAt,
      };
      if (signal?.aborted || child.stopped) {
        return { attempts: attempt + 1, campaign: campaignSummary(lastCampaign), id: registration.id, logs, process: processIdentity, reason: "stop-requested", state: "stopped" };
      }
      let resumed: WorkCampaignResult | null = null;
      try {
        resumed = parseWorkCampaignResult(JSON.parse(child.stdout));
      } catch {
        resumed = null;
      }
      if (resumed != null && resumed.operation === "resume" && resumed.definitionDigest === registration.definitionDigest) {
        return { attempts: attempt + 1, campaign: campaignSummary(resumed), id: registration.id, logs, process: processIdentity, reason: reconciled.reason, state: "resumed" };
      }
      if (attempt >= policy.maxRestarts) break;
      await dependencies.wait(policy.backoffMs[attempt], signal);
    }
    return { attempts: policy.maxRestarts + 1, campaign: campaignSummary(lastCampaign), id: registration.id, logs, process: processIdentity, reason: "resume-failed", state: "blocked" };
  } finally {
    if (!releaseLease(lease)) throw new WorkCampaignError("supervisor lease closure is unknown", 1, { field: "lease" });
  }
}

export async function runCampaignSupervisor(
  options: SupervisorOperationOptions,
  dependencyOverrides: Partial<CampaignSupervisorDependencies> = {},
): Promise<CampaignSupervisorReport> {
  const environment = options.environment ?? process.env;
  const dependencies: CampaignSupervisorDependencies = {
    runStreaming: dependencyOverrides.runStreaming ?? runPortableCommandStreaming,
    wait: dependencyOverrides.wait ?? wait,
  };
  const loaded = loadCampaignSupervisorRegistry(options.registryPath, environment);
  const selected = loaded.registry.registrations.filter((row) => options.registrationId == null || row.id === options.registrationId);
  if (options.registrationId != null && selected.length !== 1) throw new WorkCampaignError("--registration is not present in the registry", 2, { field: "registration" });
  const health = options.operation === "run"
    ? await waitForRuntime(loaded.registry, environment, options.signal)
    : await probeRuntime(loaded.registry, environment, Math.min(loaded.registry.policy.commandTimeoutMs, 2_000));
  const rows: CampaignSupervisorRow[] = [];
  for (const registration of selected) {
    if (!registration.enabled) {
      rows.push({ attempts: 0, campaign: null, id: registration.id, logs: [], process: null, reason: "registry-disabled", state: "suppressed" });
      continue;
    }
    if (options.operation === "run" && !health.healthy) {
      rows.push({ attempts: 0, campaign: null, id: registration.id, logs: [], process: null, reason: "runtime-not-ready", state: "suppressed" });
      continue;
    }
    if (options.operation === "stop") {
      const stopped = invokeCampaign("stop", registration, loaded.registry.policy, environment);
      const campaign = stopped.output != null && "recordType" in stopped.output ? stopped.output as WorkCampaignResult : null;
      rows.push({ attempts: 1, campaign: campaignSummary(campaign), id: registration.id, logs: [], process: null, reason: "stop-requested", state: campaign == null ? "blocked" : "stopped" });
      continue;
    }
    const reconciled = reconcileRegistration(registration, loaded.registry.policy, environment);
    if (options.operation === "status") {
      rows.push({
        attempts: 0,
        campaign: campaignSummary(reconciled.campaign),
        id: registration.id,
        logs: [],
        process: null,
        reason: reconciled.reason,
        state: reconciled.advice?.action === "resume" ? "ready" : reconciled.advice?.action === "unknown" ? "unknown" : "suppressed",
      });
      continue;
    }
    rows.push(await resumeRegistration(loaded.path, loaded.digest, registration, loaded.registry.policy, environment, dependencies, options.signal));
  }
  return {
    operation: options.operation,
    recordType: "campaign-supervisor-report",
    registryDigest: loaded.digest,
    rows,
    runtime: health,
    schemaVersion: 1,
    tool: "work-campaign-supervisor",
  };
}
