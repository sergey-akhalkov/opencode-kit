#!/usr/bin/env node
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

import {
  OPENCODE_WORKSTATION_SERVER_CREDENTIAL_PATH,
  WORK_CAMPAIGN_SUPERVISOR_PROTECTED_ROOT,
  WORK_CAMPAIGN_SUPERVISOR_TASK_NAME,
  quoteWindowsArgument,
} from "./opencode-workstation-layout.ts";

type JsonRecord = Record<string, unknown>;

export type CampaignSupervisorInstalledFile = {
  bytes: number;
  digest: string;
  path: string;
};

export type CampaignSupervisorInstallManifest = {
  credentialPath: string;
  installId: string;
  installedFiles: CampaignSupervisorInstalledFile[];
  kitSource: {
    digest: string;
    files: CampaignSupervisorInstalledFile[];
    root: string;
  };
  node: { digest: string; path: string };
  protectedRoot: string;
  registry: { digest: string; path: string };
  resultPath: string;
  runtimeRoot: string;
  schemaVersion: 1;
  supervisorModulePath: string;
  task: {
    arguments: string;
    execute: string;
    name: string;
    policy: {
      executionTimeLimit: "PT0S";
      logonType: "Interactive";
      multipleInstances: "IgnoreNew";
      runLevel: "Highest";
      trigger: "AtLogon";
    };
    user: string;
    workingDirectory: string;
  };
};

type SupervisorModule = {
  runCampaignSupervisor: (options: {
    environment: NodeJS.ProcessEnv;
    operation: "run";
    registryPath: string;
    signal?: AbortSignal;
  }) => Promise<unknown>;
};

export type CampaignSupervisorHostDependencies = {
  loadSupervisor?: (modulePath: string) => Promise<SupervisorModule>;
  writeResult?: (resultPath: string, value: unknown) => void;
};

const SHA256 = /^[a-f0-9]{64}$/u;

function stableValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stableValue);
  if (value == null || typeof value !== "object") return value;
  const record = value as JsonRecord;
  return Object.fromEntries(Object.keys(record).sort().map((key) => [key, stableValue(record[key])]));
}

function stableJson(value: unknown): string {
  return `${JSON.stringify(stableValue(value), null, 2)}\n`;
}

function sha256(value: string | Buffer): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function record(value: unknown, label: string): JsonRecord {
  if (value == null || typeof value !== "object" || Array.isArray(value)) throw new Error(`${label} must be an object.`);
  return value as JsonRecord;
}

function exactKeys(value: JsonRecord, expected: string[], label: string): void {
  const actual = Object.keys(value).sort();
  const wanted = expected.slice().sort();
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
  if (!SHA256.test(selected)) throw new Error(`${label} must be a SHA-256 digest.`);
  return selected;
}

function integer(value: unknown, label: string): number {
  if (!Number.isSafeInteger(value) || (value as number) < 0) throw new Error(`${label} must be a non-negative integer.`);
  return value as number;
}

function samePath(left: string, right: string): boolean {
  const normalize = (value: string): string => path.resolve(value).replace(/[\\/]+$/u, "").toLocaleLowerCase();
  return normalize(left) === normalize(right);
}

function containedFile(root: string, value: unknown, label: string): string {
  const selected = path.resolve(text(value, label));
  const relative = path.relative(path.resolve(root), selected);
  if (relative === "" || relative.startsWith("..") || path.isAbsolute(relative)) throw new Error(`${label} must be below the protected root.`);
  return selected;
}

function installedFile(value: unknown, root: string, label: string): CampaignSupervisorInstalledFile {
  const row = record(value, label);
  exactKeys(row, ["bytes", "digest", "path"], label);
  return {
    bytes: integer(row.bytes, `${label}.bytes`),
    digest: digest(row.digest, `${label}.digest`),
    path: containedFile(root, row.path, `${label}.path`),
  };
}

export function campaignSupervisorInstallId(manifest: Omit<CampaignSupervisorInstallManifest, "installId">): string {
  return sha256(stableJson(manifest));
}

function parseCampaignSupervisorInstallManifest(value: unknown, manifestPath: string): CampaignSupervisorInstallManifest {
  const input = record(value, "Campaign supervisor install manifest");
  exactKeys(input, ["credentialPath", "installId", "installedFiles", "kitSource", "node", "protectedRoot", "registry", "resultPath", "runtimeRoot", "schemaVersion", "supervisorModulePath", "task"], "Campaign supervisor install manifest");
  if (input.schemaVersion !== 1) throw new Error("Campaign supervisor install manifest schemaVersion must be 1.");
  const protectedRoot = path.resolve(text(input.protectedRoot, "protectedRoot"));
  if (!samePath(path.dirname(path.resolve(manifestPath)), protectedRoot)) throw new Error("Manifest path must be directly below protectedRoot.");
  const kitSource = record(input.kitSource, "kitSource");
  exactKeys(kitSource, ["digest", "files", "root"], "kitSource");
  if (!Array.isArray(kitSource.files) || kitSource.files.length === 0) throw new Error("kitSource.files must be non-empty.");
  const sourceRoot = path.resolve(text(kitSource.root, "kitSource.root"));
  const sourceFiles = kitSource.files.map((row, index) => installedFile(row, sourceRoot, `kitSource.files.${index}`));
  const node = record(input.node, "node");
  exactKeys(node, ["digest", "path"], "node");
  const registry = record(input.registry, "registry");
  exactKeys(registry, ["digest", "path"], "registry");
  const task = record(input.task, "task");
  exactKeys(task, ["arguments", "execute", "name", "policy", "user", "workingDirectory"], "task");
  const policy = record(task.policy, "task.policy");
  exactKeys(policy, ["executionTimeLimit", "logonType", "multipleInstances", "runLevel", "trigger"], "task.policy");
  if (policy.executionTimeLimit !== "PT0S" || policy.logonType !== "Interactive" || policy.multipleInstances !== "IgnoreNew"
    || policy.runLevel !== "Highest" || policy.trigger !== "AtLogon") throw new Error("task.policy is unsupported.");
  if (!Array.isArray(input.installedFiles) || input.installedFiles.length === 0) throw new Error("installedFiles must be non-empty.");
  const installedFiles = input.installedFiles.map((row, index) => installedFile(row, protectedRoot, `installedFiles.${index}`));
  if (new Set(installedFiles.map((row) => row.path.toLocaleLowerCase())).size !== installedFiles.length) throw new Error("installedFiles paths must be unique.");
  const manifest: CampaignSupervisorInstallManifest = {
    credentialPath: path.resolve(text(input.credentialPath, "credentialPath")),
    installId: digest(input.installId, "installId"),
    installedFiles,
    kitSource: { digest: digest(kitSource.digest, "kitSource.digest"), files: sourceFiles, root: sourceRoot },
    node: { digest: digest(node.digest, "node.digest"), path: path.resolve(text(node.path, "node.path")) },
    protectedRoot,
    registry: { digest: digest(registry.digest, "registry.digest"), path: containedFile(protectedRoot, registry.path, "registry.path") },
    resultPath: containedFile(protectedRoot, input.resultPath, "resultPath"),
    runtimeRoot: path.resolve(text(input.runtimeRoot, "runtimeRoot")),
    schemaVersion: 1,
    supervisorModulePath: containedFile(protectedRoot, input.supervisorModulePath, "supervisorModulePath"),
    task: {
      arguments: text(task.arguments, "task.arguments"),
      execute: path.resolve(text(task.execute, "task.execute")),
      name: text(task.name, "task.name"),
      policy: policy as CampaignSupervisorInstallManifest["task"]["policy"],
      user: text(task.user, "task.user"),
      workingDirectory: path.resolve(text(task.workingDirectory, "task.workingDirectory")),
    },
  };
  if (!samePath(manifest.runtimeRoot, path.join(protectedRoot, "runtime"))) throw new Error("runtimeRoot must be the protected runtime directory.");
  if (!samePath(manifest.task.workingDirectory, protectedRoot)) throw new Error("task.workingDirectory must equal protectedRoot.");
  if (!samePath(manifest.task.execute, manifest.node.path)) throw new Error("task.execute must equal the recorded Node path.");
  const hostPath = path.join(protectedRoot, "tools", "windows", "work-campaign-supervisor-host.ts");
  if (manifest.task.name !== WORK_CAMPAIGN_SUPERVISOR_TASK_NAME || manifest.task.arguments !== quoteWindowsArgument(hostPath)) {
    throw new Error("task must invoke the exact installed campaign supervisor host.");
  }
  if (!samePath(manifest.supervisorModulePath, path.join(protectedRoot, "global", "bin", "work-campaign", "supervisor.ts"))) {
    throw new Error("supervisorModulePath is not the exact installed supervisor module.");
  }
  const { installId: _installId, ...payload } = manifest;
  if (campaignSupervisorInstallId(payload) !== manifest.installId) throw new Error("Campaign supervisor install manifest digest is stale.");
  return manifest;
}

export function loadCampaignSupervisorInstallManifest(manifestPath: string): CampaignSupervisorInstallManifest {
  const absolute = path.resolve(manifestPath);
  const stat = fs.lstatSync(absolute, { throwIfNoEntry: false });
  if (stat == null || !stat.isFile() || stat.isSymbolicLink()) throw new Error("Campaign supervisor install manifest must be a regular file.");
  return parseCampaignSupervisorInstallManifest(JSON.parse(fs.readFileSync(absolute, "utf8")), absolute);
}

function verifyFile(file: string, expectedDigest: string, expectedBytes?: number): void {
  const stat = fs.lstatSync(file, { throwIfNoEntry: false });
  if (stat == null || !stat.isFile() || stat.isSymbolicLink()) throw new Error(`Installed campaign supervisor file is missing or unsafe: ${file}`);
  if (expectedBytes != null && stat.size !== expectedBytes) throw new Error(`Installed campaign supervisor file size drifted: ${file}`);
  if (sha256(fs.readFileSync(file)) !== expectedDigest) throw new Error(`Installed campaign supervisor file digest drifted: ${file}`);
}

function writeResultAtomic(resultPath: string, value: unknown): void {
  fs.mkdirSync(path.dirname(resultPath), { recursive: true });
  const temporary = `${resultPath}.${process.pid}.tmp`;
  fs.writeFileSync(temporary, stableJson(value), { encoding: "utf8", flag: "wx" });
  fs.renameSync(temporary, resultPath);
}

export async function runInstalledCampaignSupervisor(
  manifestPath: string,
  options: { expectedCredentialPath?: string; expectedProtectedRoot?: string; operation?: "run" | "status" | "stop"; signal?: AbortSignal } = {},
  dependencies: CampaignSupervisorHostDependencies = {},
): Promise<unknown> {
  const manifest = loadCampaignSupervisorInstallManifest(manifestPath);
  if (options.expectedCredentialPath != null && !samePath(manifest.credentialPath, options.expectedCredentialPath)) {
    throw new Error("Campaign supervisor credential path differs from the workstation owner.");
  }
  if (options.expectedProtectedRoot != null && !samePath(manifest.protectedRoot, options.expectedProtectedRoot)) {
    throw new Error("Campaign supervisor protected root differs from the installed owner.");
  }
  verifyFile(manifest.node.path, manifest.node.digest);
  verifyFile(manifest.registry.path, manifest.registry.digest);
  for (const file of manifest.installedFiles) verifyFile(file.path, file.digest, file.bytes);
  const credentialStat = fs.lstatSync(manifest.credentialPath, { throwIfNoEntry: false });
  if (credentialStat == null || !credentialStat.isFile() || credentialStat.isSymbolicLink()) throw new Error("Managed OpenCode credential is missing or unsafe.");
  const password = fs.readFileSync(manifest.credentialPath, "utf8").trim();
  if (password.length < 1) throw new Error("Managed OpenCode credential is empty.");
  const loadSupervisor = dependencies.loadSupervisor ?? (async (modulePath: string) => await import(pathToFileURL(modulePath).href) as SupervisorModule);
  const supervisor = await loadSupervisor(manifest.supervisorModulePath);
  if (typeof supervisor.runCampaignSupervisor !== "function") throw new Error("Installed supervisor module has no runCampaignSupervisor export.");
  const report = await supervisor.runCampaignSupervisor({
    environment: { ...process.env, OPENCODE_SERVER_PASSWORD: password },
    operation: options.operation ?? "run",
    registryPath: manifest.registry.path,
    signal: options.signal,
  });
  const result = { installId: manifest.installId, operation: options.operation ?? "run", report, schemaVersion: 1, status: "completed", tool: "work-campaign-supervisor-host" };
  (dependencies.writeResult ?? writeResultAtomic)(manifest.resultPath, result);
  return result;
}

function isMainModule(): boolean {
  const entrypoint = process.argv[1];
  return entrypoint != null && import.meta.url === pathToFileURL(path.resolve(entrypoint)).href;
}

if (isMainModule()) {
  const manifestPath = path.join(import.meta.dirname, "..", "..", "manifest.json");
  const args = process.argv.slice(2);
  const operation = args.length === 0 ? "run" : args.length === 1 && (args[0] === "status" || args[0] === "stop") ? args[0] : null;
  if (operation == null) {
    console.error(stableJson({ error: "Operation must be omitted, status, or stop.", schemaVersion: 1, status: "blocked", tool: "work-campaign-supervisor-host" }).trimEnd());
    process.exitCode = 2;
  } else {
    const abort = new AbortController();
    const stop = (): void => abort.abort();
    process.once("SIGINT", stop);
    process.once("SIGTERM", stop);
    void runInstalledCampaignSupervisor(manifestPath, {
      expectedCredentialPath: OPENCODE_WORKSTATION_SERVER_CREDENTIAL_PATH,
      expectedProtectedRoot: WORK_CAMPAIGN_SUPERVISOR_PROTECTED_ROOT,
      operation,
      signal: abort.signal,
    }).then((result) => {
      console.log(stableJson(result).trimEnd());
    }).catch((error: unknown) => {
      console.error(stableJson({
        cause: error instanceof Error && error.cause instanceof Error ? error.cause.message : null,
        error: error instanceof Error ? error.message : "Campaign supervisor host failed.",
        schemaVersion: 1,
        status: "blocked",
        tool: "work-campaign-supervisor-host",
      }).trimEnd());
      process.exitCode = 1;
    }).finally(() => {
      process.off("SIGINT", stop);
      process.off("SIGTERM", stop);
    });
  }
}
