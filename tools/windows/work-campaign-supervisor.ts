#!/usr/bin/env node
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

import { loadCampaignSupervisorRegistry } from "../../global/bin/work-campaign/supervisor.ts";
import { PORTABLE_WORKFLOW_RUNTIME_FILES } from "../runtime-surface-profile.ts";
import {
  OPENCODE_OWNER_LOGON_TASK_POLICY,
  OPENCODE_PROTECTED_ROOT_ACL,
  OPENCODE_WORKSTATION_PROTECTED_ROOT,
  OPENCODE_WORKSTATION_SERVER_CREDENTIAL_PATH,
  quoteWindowsArgument,
} from "./opencode-workstation-layout.ts";
import {
  campaignSupervisorInstallId,
  loadCampaignSupervisorInstallManifest,
} from "./work-campaign-supervisor-host.ts";
import type {
  CampaignSupervisorInstallManifest,
  CampaignSupervisorInstalledFile,
} from "./work-campaign-supervisor-host.ts";

type JsonRecord = Record<string, unknown>;

export const WORK_CAMPAIGN_SUPERVISOR_PROTECTED_ROOT = String.raw`C:\ProgramData\OpenCodeWorkCampaignSupervisor`;
export const WORK_CAMPAIGN_SUPERVISOR_TASK_NAME = "OpenCode Work Campaign Supervisor";

export type WorkCampaignSupervisorPreviewOptions = {
  kitRoot: string;
  nodePath?: string;
  protectedRoot?: string;
  registryPath: string;
  workstationManifestPath?: string;
  workstationRoot?: string;
};

export type WorkCampaignSupervisorTaskObservation = {
  arguments: string;
  execute: string;
  exists: true;
  multipleInstances: string;
  runLevel: string;
  taskName: string;
  triggerCount: number;
  user: string;
  workingDirectory: string;
};

export type WorkCampaignSupervisorRuntimeObservation = {
  process: null | {
    executableDigest: string;
    executablePath: string;
    hostDigest: string;
    hostPath: string;
    taskName: string;
  };
  state: "absent" | "running" | "stopped" | "unknown";
};

export type WorkCampaignSupervisorObservation = {
  runtime: WorkCampaignSupervisorRuntimeObservation;
  schemaVersion: 1;
  task: WorkCampaignSupervisorTaskObservation | null;
};

export type WorkCampaignSupervisorPreview = {
  acl: { root: string[] };
  campaigns: Array<{ definitionDigest: string; enabled: boolean; id: string; rootDigest: string }>;
  effects: "none";
  manifest: CampaignSupervisorInstallManifest;
  operation: "preview";
  registry: { digest: string; installedPath: string; sourcePath: string };
  rollback: { paths: string[]; preserves: string[]; taskName: string };
  runtime: { endpoint: string; expectedVersion: string; root: string };
  schemaVersion: 1;
  sourceFiles: Array<{ bytes: number; digest: string; installedPath: string; sourcePath: string }>;
  task: CampaignSupervisorInstallManifest["task"];
};

type IdentityStatus = "current" | "drifted" | "missing" | "unknown";

export type WorkCampaignSupervisorCheck = {
  installed: {
    files: Array<{ path: string; status: Exclude<IdentityStatus, "unknown"> }>;
    manifest: Exclude<IdentityStatus, "unknown">;
    registry: Exclude<IdentityStatus, "unknown">;
    status: Exclude<IdentityStatus, "unknown">;
  };
  operation: "check";
  runtime: { state: WorkCampaignSupervisorRuntimeObservation["state"]; status: IdentityStatus };
  schemaVersion: 1;
  source: { files: Array<{ path: string; status: Exclude<IdentityStatus, "unknown"> }>; status: Exclude<IdentityStatus, "unknown"> };
  status: IdentityStatus;
  task: { status: Exclude<IdentityStatus, "unknown"> };
};

export type WorkCampaignSupervisorActionPlan = {
  actions: Array<{ kind: string; path?: string; taskName?: string }>;
  blockers: string[];
  eligible: boolean;
  operation: "repair-plan" | "rollback-plan";
  schemaVersion: 1;
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

function samePath(left: string, right: string): boolean {
  const normalize = (value: string): string => path.resolve(value).replace(/[\\/]+$/u, "").toLocaleLowerCase();
  return normalize(left) === normalize(right);
}

function identity(file: string): { bytes: number; digest: string; path: string } {
  const absolute = path.resolve(file);
  const stat = fs.lstatSync(absolute, { throwIfNoEntry: false });
  if (stat == null || !stat.isFile() || stat.isSymbolicLink()) throw new Error(`Required source is missing or unsafe: ${absolute}`);
  return { bytes: stat.size, digest: sha256(fs.readFileSync(absolute)), path: absolute };
}

function canonicalDirectory(value: string, label: string): string {
  if (!path.isAbsolute(value)) throw new Error(`${label} must be absolute.`);
  const requested = path.resolve(value);
  const stat = fs.lstatSync(requested, { throwIfNoEntry: false });
  if (stat == null || !stat.isDirectory() || stat.isSymbolicLink()) throw new Error(`${label} must be a regular directory.`);
  const canonical = fs.realpathSync(requested);
  if (!samePath(requested, canonical)) throw new Error(`${label} must be canonical.`);
  return canonical;
}

function readWorkstationOwner(manifestPath: string, workstationRoot: string): string {
  const absolute = path.resolve(manifestPath);
  if (!samePath(path.dirname(absolute), workstationRoot)) throw new Error("Workstation manifest must be directly below the workstation protected root.");
  const stat = fs.lstatSync(absolute, { throwIfNoEntry: false });
  if (stat == null || !stat.isFile() || stat.isSymbolicLink()) throw new Error("Workstation manifest is missing or unsafe.");
  const parsed = JSON.parse(fs.readFileSync(absolute, "utf8")) as JsonRecord;
  const owner = parsed.owner;
  if (owner == null || typeof owner !== "object" || Array.isArray(owner) || typeof (owner as JsonRecord).user !== "string" || ((owner as JsonRecord).user as string).trim() === "") {
    throw new Error("Workstation manifest owner.user is missing.");
  }
  return (owner as JsonRecord).user as string;
}

function sourceDigest(files: CampaignSupervisorInstalledFile[], root: string): string {
  return sha256(stableJson(files.map((file) => ({
    bytes: file.bytes,
    digest: file.digest,
    path: path.relative(root, file.path).replaceAll("\\", "/"),
  }))));
}

export function buildWorkCampaignSupervisorPreview(options: WorkCampaignSupervisorPreviewOptions): WorkCampaignSupervisorPreview {
  const kitRoot = canonicalDirectory(options.kitRoot, "kitRoot");
  const workstationRoot = path.resolve(options.workstationRoot ?? OPENCODE_WORKSTATION_PROTECTED_ROOT);
  const protectedRoot = path.resolve(options.protectedRoot ?? WORK_CAMPAIGN_SUPERVISOR_PROTECTED_ROOT);
  const relativeToWorkstation = path.relative(workstationRoot, protectedRoot);
  if (relativeToWorkstation === "" || (!relativeToWorkstation.startsWith("..") && !path.isAbsolute(relativeToWorkstation))) {
    throw new Error("Campaign supervisor protected root must be independent from the workstation protected root.");
  }
  const workstationManifestPath = path.resolve(options.workstationManifestPath ?? path.join(workstationRoot, "manifest.json"));
  const owner = readWorkstationOwner(workstationManifestPath, workstationRoot);
  const registryPath = path.resolve(options.registryPath);
  const loadedRegistry = loadCampaignSupervisorRegistry(registryPath);
  const node = identity(path.resolve(options.nodePath ?? process.execPath));
  const relativeSources = [
    ...PORTABLE_WORKFLOW_RUNTIME_FILES.map((relative) => `global/${relative}`),
    "tools/windows/work-campaign-supervisor-host.ts",
  ];
  const sourceFiles = relativeSources.map((relative) => {
    const source = identity(path.join(kitRoot, relative));
    return { ...source, installedPath: path.join(protectedRoot, relative), sourcePath: source.path };
  });
  const kitFiles = sourceFiles.map((file) => ({ bytes: file.bytes, digest: file.digest, path: file.sourcePath }));
  const installedFiles = sourceFiles.map((file) => ({ bytes: file.bytes, digest: file.digest, path: file.installedPath }));
  const registryIdentity = identity(registryPath);
  const installedRegistryPath = path.join(protectedRoot, "registry.json");
  const hostPath = path.join(protectedRoot, "tools", "windows", "work-campaign-supervisor-host.ts");
  const runtimeRoot = path.join(protectedRoot, "runtime");
  const resultPath = path.join(runtimeRoot, "host-result.json");
  const task = {
    arguments: quoteWindowsArgument(hostPath),
    execute: node.path,
    name: WORK_CAMPAIGN_SUPERVISOR_TASK_NAME,
    policy: { ...OPENCODE_OWNER_LOGON_TASK_POLICY },
    user: owner,
    workingDirectory: protectedRoot,
  };
  const manifestPayload: Omit<CampaignSupervisorInstallManifest, "installId"> = {
    credentialPath: path.resolve(options.workstationRoot == null ? OPENCODE_WORKSTATION_SERVER_CREDENTIAL_PATH : path.join(workstationRoot, "server-password")),
    installedFiles,
    kitSource: { digest: sourceDigest(kitFiles, kitRoot), files: kitFiles, root: kitRoot },
    node: { digest: node.digest, path: node.path },
    protectedRoot,
    registry: { digest: registryIdentity.digest, path: installedRegistryPath },
    resultPath,
    runtimeRoot,
    schemaVersion: 1,
    supervisorModulePath: path.join(protectedRoot, "global", "bin", "work-campaign", "supervisor.ts"),
    task,
  };
  const manifest: CampaignSupervisorInstallManifest = { ...manifestPayload, installId: campaignSupervisorInstallId(manifestPayload) };
  return {
    acl: { root: [...OPENCODE_PROTECTED_ROOT_ACL.display] },
    campaigns: loadedRegistry.registry.registrations.map((registration) => ({
      definitionDigest: registration.definitionDigest,
      enabled: registration.enabled,
      id: registration.id,
      rootDigest: sha256(registration.root),
    })),
    effects: "none",
    manifest,
    operation: "preview",
    registry: { digest: registryIdentity.digest, installedPath: installedRegistryPath, sourcePath: registryIdentity.path },
    rollback: {
      paths: [manifest.resultPath, manifest.runtimeRoot, manifest.registry.path, ...manifest.installedFiles.map((file) => file.path), path.join(protectedRoot, "manifest.json"), protectedRoot],
      preserves: [workstationRoot, manifest.credentialPath, ...loadedRegistry.registry.registrations.map((registration) => registration.root)],
      taskName: task.name,
    },
    runtime: { endpoint: loadedRegistry.registry.runtime.endpoint, expectedVersion: loadedRegistry.registry.runtime.expectedVersion, root: runtimeRoot },
    schemaVersion: 1,
    sourceFiles,
    task,
  };
}

function fileStatus(file: CampaignSupervisorInstalledFile): Exclude<IdentityStatus, "unknown"> {
  const stat = fs.lstatSync(file.path, { throwIfNoEntry: false });
  if (stat == null) return "missing";
  if (!stat.isFile() || stat.isSymbolicLink() || stat.size !== file.bytes) return "drifted";
  return sha256(fs.readFileSync(file.path)) === file.digest ? "current" : "drifted";
}

function taskStatus(expected: CampaignSupervisorInstallManifest["task"], observed: WorkCampaignSupervisorTaskObservation | null): Exclude<IdentityStatus, "unknown"> {
  if (observed == null) return "missing";
  return observed.exists === true
    && observed.arguments === expected.arguments
    && samePath(observed.execute, expected.execute)
    && observed.multipleInstances === expected.policy.multipleInstances
    && observed.runLevel === expected.policy.runLevel
    && observed.taskName === expected.name
    && observed.triggerCount === 1
    && observed.user === expected.user
    && samePath(observed.workingDirectory, expected.workingDirectory)
    ? "current" : "drifted";
}

function runtimeStatus(preview: WorkCampaignSupervisorPreview, observed: WorkCampaignSupervisorRuntimeObservation): IdentityStatus {
  if (observed.state === "unknown") return "unknown";
  if (observed.state === "absent" || observed.state === "stopped") return "current";
  const process = observed.process;
  const host = preview.manifest.installedFiles.find((file) => samePath(file.path, path.join(preview.manifest.protectedRoot, "tools", "windows", "work-campaign-supervisor-host.ts")));
  if (process == null || host == null) return "unknown";
  return samePath(process.executablePath, preview.manifest.node.path)
    && process.executableDigest === preview.manifest.node.digest
    && samePath(process.hostPath, host.path)
    && process.hostDigest === host.digest
    && process.taskName === preview.manifest.task.name
    ? "current" : "unknown";
}

export function checkWorkCampaignSupervisorInstallation(
  preview: WorkCampaignSupervisorPreview,
  observation: WorkCampaignSupervisorObservation,
): WorkCampaignSupervisorCheck {
  if (observation.schemaVersion !== 1) throw new Error("Observation schemaVersion must be 1.");
  const sourceFiles = preview.manifest.kitSource.files.map((file) => ({ path: file.path, status: fileStatus(file) }));
  const sourceStatus = sourceFiles.every((file) => file.status === "current") ? "current" : "drifted";
  const manifestPath = path.join(preview.manifest.protectedRoot, "manifest.json");
  let manifestStatus: Exclude<IdentityStatus, "unknown"> = "missing";
  const manifestStat = fs.lstatSync(manifestPath, { throwIfNoEntry: false });
  if (manifestStat != null) {
    try {
      manifestStatus = loadCampaignSupervisorInstallManifest(manifestPath).installId === preview.manifest.installId ? "current" : "drifted";
    } catch {
      manifestStatus = "drifted";
    }
  }
  const installedFiles = preview.manifest.installedFiles.map((file) => ({ path: file.path, status: fileStatus(file) }));
  const registryStatus = fileStatus({ bytes: fs.lstatSync(preview.registry.sourcePath).size, digest: preview.registry.digest, path: preview.registry.installedPath });
  const installedStatus = manifestStatus === "missing" && installedFiles.every((file) => file.status === "missing") && registryStatus === "missing"
    ? "missing"
    : manifestStatus === "current" && installedFiles.every((file) => file.status === "current") && registryStatus === "current"
      ? "current" : "drifted";
  const selectedTaskStatus = taskStatus(preview.task, observation.task);
  const selectedRuntimeStatus = runtimeStatus(preview, observation.runtime);
  const status: IdentityStatus = selectedRuntimeStatus === "unknown" ? "unknown"
    : sourceStatus === "drifted" || installedStatus === "drifted" || selectedTaskStatus === "drifted" ? "drifted"
      : sourceStatus === "current" && installedStatus === "current" && selectedTaskStatus === "current" ? "current" : "missing";
  return {
    installed: { files: installedFiles, manifest: manifestStatus, registry: registryStatus, status: installedStatus },
    operation: "check",
    runtime: { state: observation.runtime.state, status: selectedRuntimeStatus },
    schemaVersion: 1,
    source: { files: sourceFiles, status: sourceStatus },
    status,
    task: { status: selectedTaskStatus },
  };
}

export function planWorkCampaignSupervisorRepair(
  preview: WorkCampaignSupervisorPreview,
  observation: WorkCampaignSupervisorObservation,
): WorkCampaignSupervisorActionPlan {
  const check = checkWorkCampaignSupervisorInstallation(preview, observation);
  const blockers: string[] = [];
  if (check.source.status !== "current") blockers.push("source-drift");
  if (check.runtime.status === "unknown" || observation.runtime.state === "running") blockers.push("runtime-ownership-not-terminal");
  if (check.task.status === "drifted") blockers.push("task-identity-drift");
  if (check.installed.manifest === "drifted") blockers.push("manifest-identity-drift");
  const actions: WorkCampaignSupervisorActionPlan["actions"] = [];
  if (blockers.length === 0 && check.status !== "current") {
    actions.push({ kind: "ensure-protected-root", path: preview.manifest.protectedRoot });
    for (const file of check.installed.files.filter((row) => row.status !== "current")) actions.push({ kind: "copy-file", path: file.path });
    if (check.installed.registry !== "current") actions.push({ kind: "write-registry", path: preview.manifest.registry.path });
    actions.push({ kind: "write-manifest", path: path.join(preview.manifest.protectedRoot, "manifest.json") });
    actions.push({ kind: "apply-protected-acl", path: preview.manifest.protectedRoot });
    if (check.task.status === "missing") actions.push({ kind: "register-task", taskName: preview.manifest.task.name });
  }
  return { actions, blockers, eligible: blockers.length === 0, operation: "repair-plan", schemaVersion: 1 };
}

export function planWorkCampaignSupervisorRollback(
  preview: WorkCampaignSupervisorPreview,
  observation: WorkCampaignSupervisorObservation,
): WorkCampaignSupervisorActionPlan {
  const check = checkWorkCampaignSupervisorInstallation(preview, observation);
  const blockers: string[] = [];
  if (check.runtime.status === "unknown" || observation.runtime.state === "running") blockers.push("runtime-ownership-not-terminal");
  if (check.installed.status === "drifted") blockers.push("installed-identity-drift");
  if (check.task.status === "drifted") blockers.push("task-identity-drift");
  const actions: WorkCampaignSupervisorActionPlan["actions"] = [];
  if (blockers.length === 0 && (check.installed.status !== "missing" || check.task.status !== "missing")) {
    if (check.task.status === "current") actions.push({ kind: "unregister-task", taskName: preview.manifest.task.name });
    actions.push({ kind: "remove-attributable-runtime", path: preview.manifest.runtimeRoot });
    for (const file of [...preview.manifest.installedFiles].reverse()) actions.push({ kind: "remove-file", path: file.path });
    actions.push({ kind: "remove-file", path: preview.manifest.registry.path });
    actions.push({ kind: "remove-file", path: path.join(preview.manifest.protectedRoot, "manifest.json") });
    actions.push({ kind: "remove-empty-protected-root", path: preview.manifest.protectedRoot });
  }
  return { actions, blockers, eligible: blockers.length === 0, operation: "rollback-plan", schemaVersion: 1 };
}

function usage(): string {
  return [
    "Usage:",
    "  node tools/windows/work-campaign-supervisor.ts preview --kit-root <absolute> --registry <absolute> --workstation-manifest <absolute> [--workstation-root <absolute>] [--protected-root <absolute>]",
    "  node tools/windows/work-campaign-supervisor.ts check|repair-plan|rollback-plan <preview options> --observation <absolute-json>",
    "",
    "Task 6.3 operations are read-only plans. They do not create directories, copy files, change ACLs, register tasks, read credential values, start processes, or mutate host state.",
  ].join("\n");
}

function required(args: string[], index: number, option: string): string {
  const value = args[index + 1];
  if (value == null || value.trim() === "" || value.startsWith("--")) throw new Error(`Missing value for ${option}.`);
  return value;
}

function isMainModule(): boolean {
  const entrypoint = process.argv[1];
  return entrypoint != null && import.meta.url === pathToFileURL(path.resolve(entrypoint)).href;
}

if (isMainModule()) {
  try {
    const args = process.argv.slice(2);
    if (args.length === 1 && (args[0] === "--help" || args[0] === "-h")) {
      console.log(usage());
    } else {
      const operation = args[0];
      if (!operation || !["preview", "check", "repair-plan", "rollback-plan"].includes(operation)) throw new Error("Operation must be preview, check, repair-plan, or rollback-plan.");
      const selected: Record<string, string> = {};
      for (let index = 1; index < args.length; index++) {
        const option = args[index];
        if (!["--kit-root", "--registry", "--workstation-manifest", "--workstation-root", "--protected-root", "--observation"].includes(option)) throw new Error(`Unknown option: ${option}`);
        selected[option] = required(args, index, option);
        index++;
      }
      for (const requiredOption of ["--kit-root", "--registry", "--workstation-manifest"]) {
        if (selected[requiredOption] == null || !path.isAbsolute(selected[requiredOption])) throw new Error(`${requiredOption} must be absolute.`);
      }
      const preview = buildWorkCampaignSupervisorPreview({
        kitRoot: selected["--kit-root"],
        protectedRoot: selected["--protected-root"],
        registryPath: selected["--registry"],
        workstationManifestPath: selected["--workstation-manifest"],
        workstationRoot: selected["--workstation-root"],
      });
      let output: unknown = preview;
      if (operation !== "preview") {
        const observationPath = selected["--observation"];
        if (observationPath == null || !path.isAbsolute(observationPath)) throw new Error("--observation must be absolute.");
        const observation = JSON.parse(fs.readFileSync(observationPath, "utf8")) as WorkCampaignSupervisorObservation;
        output = operation === "check" ? checkWorkCampaignSupervisorInstallation(preview, observation)
          : operation === "repair-plan" ? planWorkCampaignSupervisorRepair(preview, observation)
            : planWorkCampaignSupervisorRollback(preview, observation);
      }
      console.log(stableJson(output).trimEnd());
      if (operation === "check" && (output as WorkCampaignSupervisorCheck).status !== "current") process.exitCode = 1;
      if ((operation === "repair-plan" || operation === "rollback-plan") && !(output as WorkCampaignSupervisorActionPlan).eligible) process.exitCode = 1;
    }
  } catch (error) {
    console.error(stableJson({ error: error instanceof Error ? error.message : "Windows campaign supervisor planning failed.", schemaVersion: 1, status: "blocked", tool: "work-campaign-supervisor-windows" }).trimEnd());
    process.exitCode = 1;
  }
}
