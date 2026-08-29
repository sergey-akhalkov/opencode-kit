#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

import {
  buildWorkCampaignSupervisorPreview,
  checkWorkCampaignSupervisorInstallation,
  planWorkCampaignSupervisorRepair,
  planWorkCampaignSupervisorRollback,
} from "./work-campaign-supervisor.ts";
import type {
  WorkCampaignSupervisorObservation,
  WorkCampaignSupervisorPreview,
  WorkCampaignSupervisorPreviewOptions,
  WorkCampaignSupervisorRuntimeObservation,
  WorkCampaignSupervisorTaskObservation,
} from "./work-campaign-supervisor.ts";
import { OPENCODE_PROTECTED_ROOT_ACL } from "./opencode-workstation-layout.ts";

type TaskSnapshot = {
  observation: WorkCampaignSupervisorTaskObservation | null;
  state: string | null;
};

type ProcessSnapshot = {
  executablePath: string;
  pid: number;
};

export type WorkCampaignSupervisorInstallDependencies = {
  applyRootAcl: (root: string) => void;
  isElevated: () => boolean;
  registerTask: (preview: WorkCampaignSupervisorPreview) => void;
  rootAclCurrent: (root: string) => boolean;
  snapshot: (preview: WorkCampaignSupervisorPreview) => { processes: ProcessSnapshot[]; task: TaskSnapshot };
  startTask: (name: string) => void;
  unregisterTask: (name: string) => void;
};

export type WorkCampaignSupervisorInstallResult = {
  installId: string;
  operation: "install" | "repair" | "rollback" | "run-task";
  schemaVersion: 1;
  status: "current" | "installed" | "removed" | "started";
  taskName: string;
};

function stableValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stableValue);
  if (value == null || typeof value !== "object") return value;
  const record = value as Record<string, unknown>;
  return Object.fromEntries(Object.keys(record).sort().map((key) => [key, stableValue(record[key])]));
}

function stableJson(value: unknown): string {
  return `${JSON.stringify(stableValue(value), null, 2)}\n`;
}

function sha256File(file: string): string {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

function samePath(left: string, right: string): boolean {
  const normalize = (value: string): string => path.resolve(value).replace(/[\\/]+$/u, "").toLocaleLowerCase();
  return normalize(left) === normalize(right);
}

function encodedPayload(value: unknown): string {
  return Buffer.from(JSON.stringify(value), "utf8").toString("base64");
}

function run(command: string, args: string[]): string {
  const result = spawnSync(command, args, { encoding: "utf8", shell: false, windowsHide: true });
  if (result.error != null) throw new Error(`${command} could not start.`, { cause: result.error });
  if (result.status !== 0) throw new Error(`${command} exited ${String(result.status)}: ${(result.stderr || result.stdout).trim()}`);
  return result.stdout.trim();
}

function runPowerShellJson(script: string): unknown {
  const output = run("pwsh.exe", ["-NoLogo", "-NoProfile", "-NonInteractive", "-Command", script]);
  if (output === "") return null;
  try {
    return JSON.parse(output) as unknown;
  } catch (error) {
    throw new Error("Windows campaign supervisor PowerShell returned invalid JSON.", { cause: error });
  }
}

function defaultIsElevated(): boolean {
  return runPowerShellJson(String.raw`
$principal = [Security.Principal.WindowsPrincipal]::new([Security.Principal.WindowsIdentity]::GetCurrent())
[bool]$principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator) | ConvertTo-Json -Compress
`) === true;
}

function rootAclRules(): Array<{ rights: "FullControl" | "ReadAndExecute"; sid: string }> {
  return OPENCODE_PROTECTED_ROOT_ACL.icacls.map((entry) => {
    const match = /^\*([^:]+):\(OI\)\(CI\)(F|RX)$/u.exec(entry);
    if (match == null) throw new Error("Protected-root ACL contract is invalid.");
    return { rights: match[2] === "F" ? "FullControl" : "ReadAndExecute", sid: match[1]! };
  });
}

function defaultApplyRootAcl(root: string): void {
  const payload = encodedPayload({ root, rules: rootAclRules() });
  runPowerShellJson(String.raw`
$ErrorActionPreference = 'Stop'
$payload = [Text.Encoding]::UTF8.GetString([Convert]::FromBase64String('${payload}')) | ConvertFrom-Json
$acl = Get-Acl -LiteralPath ([string]$payload.root)
$acl.SetAccessRuleProtection($true, $false)
foreach ($existing in @($acl.Access)) { [void]$acl.RemoveAccessRuleSpecific($existing) }
foreach ($expected in @($payload.rules)) {
  $sid = [Security.Principal.SecurityIdentifier]::new([string]$expected.sid)
  $rights = [Security.AccessControl.FileSystemRights]([string]$expected.rights)
  $rule = [Security.AccessControl.FileSystemAccessRule]::new($sid, $rights, [Security.AccessControl.InheritanceFlags]'ContainerInherit, ObjectInherit', [Security.AccessControl.PropagationFlags]::None, [Security.AccessControl.AccessControlType]::Allow)
  [void]$acl.AddAccessRule($rule)
}
Set-Acl -LiteralPath ([string]$payload.root) -AclObject $acl
[ordered]@{ applied = $true } | ConvertTo-Json -Compress
`);
}

function defaultRootAclCurrent(root: string): boolean {
  const payload = encodedPayload({ root, rules: rootAclRules() });
  return runPowerShellJson(String.raw`
$ErrorActionPreference = 'Stop'
$payload = [Text.Encoding]::UTF8.GetString([Convert]::FromBase64String('${payload}')) | ConvertFrom-Json
$acl = Get-Acl -LiteralPath ([string]$payload.root)
$expected = @{}
foreach ($entry in @($payload.rules)) { $expected[[string]$entry.sid] = [int][Security.AccessControl.FileSystemRights]([string]$entry.rights) }
$rules = @($acl.Access | Where-Object { -not $_.IsInherited })
$valid = $acl.AreAccessRulesProtected -and $rules.Count -eq $expected.Count
foreach ($rule in $rules) {
  $sid = $rule.IdentityReference.Translate([Security.Principal.SecurityIdentifier]).Value
  $rights = [int]$rule.FileSystemRights
  $required = $expected[$sid]
  if ($null -eq $required -or $rule.AccessControlType -ne [Security.AccessControl.AccessControlType]::Allow -or ($rights -band $required) -ne $required) { $valid = $false }
}
[bool]$valid | ConvertTo-Json -Compress
`) === true;
}

function defaultRegisterTask(preview: WorkCampaignSupervisorPreview): void {
  const payload = encodedPayload(preview.task);
  runPowerShellJson(String.raw`
$ErrorActionPreference = 'Stop'
$payload = [Text.Encoding]::UTF8.GetString([Convert]::FromBase64String('${payload}')) | ConvertFrom-Json
$action = New-ScheduledTaskAction -Execute ([string]$payload.execute) -Argument ([string]$payload.arguments) -WorkingDirectory ([string]$payload.workingDirectory)
$principal = New-ScheduledTaskPrincipal -UserId ([string]$payload.user) -LogonType Interactive -RunLevel Highest
$trigger = New-ScheduledTaskTrigger -AtLogOn -User ([string]$payload.user)
$settings = New-ScheduledTaskSettingsSet -MultipleInstances IgnoreNew -ExecutionTimeLimit ([TimeSpan]::Zero) -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries
$task = Register-ScheduledTask -TaskName ([string]$payload.name) -Action $action -Principal $principal -Trigger $trigger -Settings $settings -ErrorAction Stop
[ordered]@{ taskName = [string]$task.TaskName; state = [string]$task.State } | ConvertTo-Json -Compress
`);
}

function defaultUnregisterTask(name: string): void {
  const payload = encodedPayload({ name });
  runPowerShellJson(String.raw`
$ErrorActionPreference = 'Stop'
$payload = [Text.Encoding]::UTF8.GetString([Convert]::FromBase64String('${payload}')) | ConvertFrom-Json
Unregister-ScheduledTask -TaskName ([string]$payload.name) -Confirm:$false -ErrorAction Stop
[ordered]@{ removed = $true } | ConvertTo-Json -Compress
`);
}

function defaultStartTask(name: string): void {
  const payload = encodedPayload({ name });
  runPowerShellJson(String.raw`
$ErrorActionPreference = 'Stop'
$payload = [Text.Encoding]::UTF8.GetString([Convert]::FromBase64String('${payload}')) | ConvertFrom-Json
Start-ScheduledTask -TaskName ([string]$payload.name) -ErrorAction Stop
[ordered]@{ started = $true } | ConvertTo-Json -Compress
`);
}

function defaultSnapshot(preview: WorkCampaignSupervisorPreview): { processes: ProcessSnapshot[]; task: TaskSnapshot } {
  const host = preview.manifest.installedFiles.find((file) => samePath(file.path, path.join(preview.manifest.protectedRoot, "tools", "windows", "work-campaign-supervisor-host.ts")));
  if (host == null) throw new Error("Installed host identity is missing from the manifest.");
  const payload = encodedPayload({ hostPath: host.path, name: preview.task.name, nodePath: preview.task.execute, user: preview.task.user });
  const value = runPowerShellJson(String.raw`
$ErrorActionPreference = 'Stop'
$payload = [Text.Encoding]::UTF8.GetString([Convert]::FromBase64String('${payload}')) | ConvertFrom-Json
$task = Get-ScheduledTask -TaskName ([string]$payload.name) -ErrorAction SilentlyContinue
$taskValue = $null
if ($null -ne $task) {
  $action = @($task.Actions)[0]
  $observedUser = [string]$task.Principal.UserId
  try {
    $observedSid = [Security.Principal.NTAccount]::new($observedUser).Translate([Security.Principal.SecurityIdentifier]).Value
    $expectedSid = [Security.Principal.NTAccount]::new([string]$payload.user).Translate([Security.Principal.SecurityIdentifier]).Value
    if ($observedSid -eq $expectedSid) { $observedUser = [string]$payload.user }
  } catch {}
  $taskValue = [ordered]@{
    arguments = [string]$action.Arguments
    execute = [string]$action.Execute
    exists = $true
    multipleInstances = [string]$task.Settings.MultipleInstances
    runLevel = [string]$task.Principal.RunLevel
    state = [string]$task.State
    taskName = [string]$task.TaskName
    triggerCount = @($task.Triggers).Count
    user = $observedUser
    workingDirectory = [string]$action.WorkingDirectory
  }
}
$processes = @(Get-CimInstance Win32_Process | Where-Object {
  [string]$_.ExecutablePath -ieq [string]$payload.nodePath -and
  $null -ne $_.CommandLine -and
  ([string]$_.CommandLine).Contains([string]$payload.hostPath)
} | ForEach-Object { [ordered]@{ executablePath = [string]$_.ExecutablePath; pid = [int]$_.ProcessId } })
[ordered]@{ processes = $processes; task = $taskValue } | ConvertTo-Json -Compress -Depth 8
`) as { processes?: unknown; task?: unknown } | null;
  const rawProcesses = Array.isArray(value?.processes) ? value.processes : value?.processes == null ? [] : [value.processes];
  const processes = rawProcesses.map((entry) => {
    if (entry == null || typeof entry !== "object" || typeof (entry as ProcessSnapshot).executablePath !== "string" || !Number.isSafeInteger((entry as ProcessSnapshot).pid)) {
      throw new Error("Windows campaign supervisor process snapshot is invalid.");
    }
    return entry as ProcessSnapshot;
  });
  let task: TaskSnapshot = { observation: null, state: null };
  if (value?.task != null && typeof value.task === "object") {
    const selected = value.task as WorkCampaignSupervisorTaskObservation & { state?: unknown };
    if (selected.exists !== true || typeof selected.state !== "string") throw new Error("Windows campaign supervisor task snapshot is invalid.");
    task = {
      observation: {
        arguments: selected.arguments,
        execute: selected.execute,
        exists: true,
        multipleInstances: selected.multipleInstances,
        runLevel: selected.runLevel,
        taskName: selected.taskName,
        triggerCount: selected.triggerCount,
        user: selected.user,
        workingDirectory: selected.workingDirectory,
      },
      state: selected.state,
    };
  }
  return { processes, task };
}

const defaultDependencies: WorkCampaignSupervisorInstallDependencies = {
  applyRootAcl: defaultApplyRootAcl,
  isElevated: defaultIsElevated,
  registerTask: defaultRegisterTask,
  rootAclCurrent: defaultRootAclCurrent,
  snapshot: defaultSnapshot,
  startTask: defaultStartTask,
  unregisterTask: defaultUnregisterTask,
};

function dependencies(overrides: Partial<WorkCampaignSupervisorInstallDependencies>): WorkCampaignSupervisorInstallDependencies {
  return { ...defaultDependencies, ...overrides };
}

function requireElevated(selected: WorkCampaignSupervisorInstallDependencies): void {
  if (!selected.isElevated()) throw new Error("Windows campaign supervisor lifecycle requires an elevated process.");
}

export function observeWorkCampaignSupervisor(
  preview: WorkCampaignSupervisorPreview,
  overrides: Partial<WorkCampaignSupervisorInstallDependencies> = {},
): WorkCampaignSupervisorObservation {
  const selected = dependencies(overrides);
  const snapshot = selected.snapshot(preview);
  let runtime: WorkCampaignSupervisorRuntimeObservation;
  if (snapshot.processes.length > 1) {
    runtime = { process: null, state: "unknown" };
  } else if (snapshot.processes.length === 1) {
    const process = snapshot.processes[0]!;
    const host = preview.manifest.installedFiles.find((file) => samePath(file.path, path.join(preview.manifest.protectedRoot, "tools", "windows", "work-campaign-supervisor-host.ts")));
    runtime = host == null || !samePath(process.executablePath, preview.manifest.node.path)
      ? { process: null, state: "unknown" }
      : {
        process: {
          executableDigest: preview.manifest.node.digest,
          executablePath: process.executablePath,
          hostDigest: host.digest,
          hostPath: host.path,
          taskName: preview.task.name,
        },
        state: "running",
      };
  } else {
    runtime = snapshot.task.state?.toLocaleLowerCase() === "running"
      ? { process: null, state: "unknown" }
      : { process: null, state: "absent" };
  }
  return { runtime, schemaVersion: 1, task: snapshot.task.observation };
}

function copyVerified(source: string, target: string, digest: string, exclusive: boolean): void {
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(source, target, exclusive ? fs.constants.COPYFILE_EXCL : 0);
  if (sha256File(target) !== digest) throw new Error(`Installed copy digest mismatch: ${target}`);
}

function manifestPath(preview: WorkCampaignSupervisorPreview): string {
  return path.join(preview.manifest.protectedRoot, "manifest.json");
}

function installResult(preview: WorkCampaignSupervisorPreview, operation: WorkCampaignSupervisorInstallResult["operation"], status: WorkCampaignSupervisorInstallResult["status"]): WorkCampaignSupervisorInstallResult {
  return { installId: preview.manifest.installId, operation, schemaVersion: 1, status, taskName: preview.task.name };
}

export function installWorkCampaignSupervisor(
  preview: WorkCampaignSupervisorPreview,
  overrides: Partial<WorkCampaignSupervisorInstallDependencies> = {},
): WorkCampaignSupervisorInstallResult {
  const selected = dependencies(overrides);
  requireElevated(selected);
  const observation = observeWorkCampaignSupervisor(preview, selected);
  const check = checkWorkCampaignSupervisorInstallation(preview, observation);
  if (check.source.status !== "current" || check.runtime.status !== "current" || observation.runtime.state === "running") {
    throw new Error("Windows campaign supervisor source or runtime identity is not safe for installation.");
  }
  if (fs.lstatSync(preview.manifest.protectedRoot, { throwIfNoEntry: false }) != null || observation.task != null || check.installed.status !== "missing") {
    throw new Error("Windows campaign supervisor target is not an empty attributable installation boundary.");
  }
  const plan = planWorkCampaignSupervisorRepair(preview, observation);
  if (!plan.eligible) throw new Error(`Windows campaign supervisor install is blocked: ${plan.blockers.join(",")}.`);
  let createdRoot = false;
  let registeredTask = false;
  try {
    fs.mkdirSync(preview.manifest.protectedRoot);
    createdRoot = true;
    selected.applyRootAcl(preview.manifest.protectedRoot);
    if (!selected.rootAclCurrent(preview.manifest.protectedRoot)) throw new Error("Windows campaign supervisor protected-root ACL readback is not current.");
    for (const file of preview.sourceFiles) copyVerified(file.sourcePath, file.installedPath, file.digest, true);
    copyVerified(preview.registry.sourcePath, preview.registry.installedPath, preview.registry.digest, true);
    fs.writeFileSync(manifestPath(preview), stableJson(preview.manifest), { encoding: "utf8", flag: "wx" });
    selected.registerTask(preview);
    registeredTask = true;
    const installed = checkWorkCampaignSupervisorInstallation(preview, observeWorkCampaignSupervisor(preview, selected));
    if (installed.status !== "current") {
      const fileCounts = Object.fromEntries(["current", "drifted", "missing"].map((status) => [status, installed.installed.files.filter((file) => file.status === status).length]));
      throw new Error(`Windows campaign supervisor install readback is not current: source=${installed.source.status}, installed=${installed.installed.status}, manifest=${installed.installed.manifest}, registry=${installed.installed.registry}, files=${JSON.stringify(fileCounts)}, task=${installed.task.status}, runtime=${installed.runtime.status}.`);
    }
    return installResult(preview, "install", "installed");
  } catch (error) {
    let cleanupError: unknown = null;
    if (registeredTask) {
      try { selected.unregisterTask(preview.task.name); } catch (caught) { cleanupError = caught; }
    }
    if (createdRoot) {
      try { fs.rmSync(preview.manifest.protectedRoot, { recursive: true, force: true }); } catch (caught) { cleanupError ??= caught; }
    }
    throw new Error(cleanupError == null
      ? "Windows campaign supervisor installation failed and created state was removed."
      : "Windows campaign supervisor installation failed and cleanup is unknown.", { cause: cleanupError ?? error });
  }
}

export function repairWorkCampaignSupervisor(
  preview: WorkCampaignSupervisorPreview,
  overrides: Partial<WorkCampaignSupervisorInstallDependencies> = {},
): WorkCampaignSupervisorInstallResult {
  const selected = dependencies(overrides);
  requireElevated(selected);
  const observation = observeWorkCampaignSupervisor(preview, selected);
  const check = checkWorkCampaignSupervisorInstallation(preview, observation);
  if (check.status === "current") return installResult(preview, "repair", "current");
  const plan = planWorkCampaignSupervisorRepair(preview, observation);
  if (!plan.eligible) throw new Error(`Windows campaign supervisor repair is blocked: ${plan.blockers.join(",")}.`);
  if (check.installed.manifest !== "current") throw new Error("Windows campaign supervisor repair requires the exact current install manifest.");
  const replacements: Array<{ previous: string | null; target: string; temporary: string }> = [];
  let registeredTask = false;
  try {
    for (const [index, installed] of preview.manifest.installedFiles.entries()) {
      if (check.installed.files[index]?.status === "current") continue;
      const source = preview.manifest.kitSource.files[index]!;
      const temporary = `${installed.path}.repair-${process.pid}.new`;
      const previous = fs.existsSync(installed.path) ? `${installed.path}.repair-${process.pid}.previous` : null;
      copyVerified(source.path, temporary, installed.digest, true);
      if (previous != null) fs.renameSync(installed.path, previous);
      fs.renameSync(temporary, installed.path);
      replacements.push({ previous, target: installed.path, temporary });
    }
    if (check.installed.registry !== "current") {
      const target = preview.registry.installedPath;
      const temporary = `${target}.repair-${process.pid}.new`;
      const previous = fs.existsSync(target) ? `${target}.repair-${process.pid}.previous` : null;
      copyVerified(preview.registry.sourcePath, temporary, preview.registry.digest, true);
      if (previous != null) fs.renameSync(target, previous);
      fs.renameSync(temporary, target);
      replacements.push({ previous, target, temporary });
    }
    selected.applyRootAcl(preview.manifest.protectedRoot);
    if (!selected.rootAclCurrent(preview.manifest.protectedRoot)) throw new Error("Windows campaign supervisor protected-root ACL readback is not current.");
    if (check.task.status === "missing") {
      selected.registerTask(preview);
      registeredTask = true;
    }
    const repaired = checkWorkCampaignSupervisorInstallation(preview, observeWorkCampaignSupervisor(preview, selected));
    if (repaired.status !== "current") throw new Error("Windows campaign supervisor repair readback is not current.");
    for (const replacement of replacements) if (replacement.previous != null) fs.rmSync(replacement.previous, { force: true });
    return installResult(preview, "repair", "current");
  } catch (error) {
    let restorationError: unknown = null;
    if (registeredTask) {
      try { selected.unregisterTask(preview.task.name); } catch (caught) { restorationError = caught; }
    }
    for (const replacement of [...replacements].reverse()) {
      try {
        fs.rmSync(replacement.target, { force: true });
        if (replacement.previous != null) fs.renameSync(replacement.previous, replacement.target);
        fs.rmSync(replacement.temporary, { force: true });
      } catch (caught) { restorationError ??= caught; }
    }
    throw new Error(restorationError == null
      ? "Windows campaign supervisor repair failed and prior files were restored."
      : "Windows campaign supervisor repair failed and restoration is unknown.", { cause: restorationError ?? error });
  }
}

function assertAttributableTree(preview: WorkCampaignSupervisorPreview): void {
  const root = preview.manifest.protectedRoot;
  const runtime = preview.manifest.runtimeRoot;
  const staticFiles = new Set([
    ...preview.manifest.installedFiles.map((file) => path.resolve(file.path).toLocaleLowerCase()),
    path.resolve(preview.manifest.registry.path).toLocaleLowerCase(),
    path.resolve(manifestPath(preview)).toLocaleLowerCase(),
  ]);
  const allowedDirectories = new Set<string>([path.resolve(root).toLocaleLowerCase(), path.resolve(runtime).toLocaleLowerCase()]);
  for (const file of staticFiles) {
    let directory = path.dirname(file);
    while (directory.startsWith(path.resolve(root).toLocaleLowerCase())) {
      allowedDirectories.add(directory);
      if (samePath(directory, root)) break;
      directory = path.dirname(directory);
    }
  }
  for (const campaign of preview.campaigns) {
    allowedDirectories.add(path.resolve(runtime, campaign.id).toLocaleLowerCase());
    allowedDirectories.add(path.resolve(runtime, campaign.id, "logs").toLocaleLowerCase());
  }
  const visit = (directory: string): void => {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const absolute = path.join(directory, entry.name);
      const normalized = path.resolve(absolute).toLocaleLowerCase();
      if (entry.isSymbolicLink()) throw new Error(`Windows campaign supervisor rollback found a symbolic link: ${absolute}`);
      if (entry.isDirectory()) {
        if (!allowedDirectories.has(normalized)) throw new Error(`Windows campaign supervisor rollback found an unattributable directory: ${absolute}`);
        visit(absolute);
        continue;
      }
      if (!entry.isFile()) throw new Error(`Windows campaign supervisor rollback found unsafe material: ${absolute}`);
      if (staticFiles.has(normalized)) continue;
      const relativeRuntime = path.relative(runtime, absolute).replaceAll("\\", "/");
      const allowedRuntime = relativeRuntime === "host-result.json"
        || /^[a-z0-9][a-z0-9._-]{0,99}\/supervisor\.stale-[a-f0-9]{16}\.json$/u.test(relativeRuntime)
        || /^[a-z0-9][a-z0-9._-]{0,99}\/logs\/\d{6}\.(?:stdout\.log|stderr\.log|meta\.json)$/u.test(relativeRuntime);
      if (!allowedRuntime) throw new Error(`Windows campaign supervisor rollback found an unattributable file: ${absolute}`);
    }
  };
  visit(root);
}

export function rollbackWorkCampaignSupervisor(
  preview: WorkCampaignSupervisorPreview,
  overrides: Partial<WorkCampaignSupervisorInstallDependencies> = {},
): WorkCampaignSupervisorInstallResult {
  const selected = dependencies(overrides);
  requireElevated(selected);
  const observation = observeWorkCampaignSupervisor(preview, selected);
  const plan = planWorkCampaignSupervisorRollback(preview, observation);
  if (!plan.eligible) throw new Error(`Windows campaign supervisor rollback is blocked: ${plan.blockers.join(",")}.`);
  const check = checkWorkCampaignSupervisorInstallation(preview, observation);
  if (check.installed.status === "missing" && check.task.status === "missing") return installResult(preview, "rollback", "removed");
  if (check.installed.status !== "current" || (check.task.status !== "current" && check.task.status !== "missing")) {
    throw new Error("Windows campaign supervisor rollback requires exact installed and task identity.");
  }
  if (!selected.rootAclCurrent(preview.manifest.protectedRoot)) throw new Error("Windows campaign supervisor rollback is blocked by protected-root ACL drift.");
  assertAttributableTree(preview);
  if (check.task.status === "current") selected.unregisterTask(preview.task.name);
  const afterTask = observeWorkCampaignSupervisor(preview, selected);
  if (afterTask.task != null || afterTask.runtime.state !== "absent") {
    throw new Error("Windows campaign supervisor rollback task/process cleanup is unknown; protected files were preserved.");
  }
  fs.rmSync(preview.manifest.protectedRoot, { recursive: true, force: false });
  if (fs.existsSync(preview.manifest.protectedRoot)) throw new Error("Windows campaign supervisor protected root removal is unknown.");
  return installResult(preview, "rollback", "removed");
}

export function startWorkCampaignSupervisorTask(
  preview: WorkCampaignSupervisorPreview,
  overrides: Partial<WorkCampaignSupervisorInstallDependencies> = {},
): WorkCampaignSupervisorInstallResult {
  const selected = dependencies(overrides);
  requireElevated(selected);
  const observation = observeWorkCampaignSupervisor(preview, selected);
  const check = checkWorkCampaignSupervisorInstallation(preview, observation);
  if (check.status !== "current" || observation.runtime.state !== "absent") {
    throw new Error("Windows campaign supervisor task start requires a current idle installation.");
  }
  selected.startTask(preview.task.name);
  return installResult(preview, "run-task", "started");
}

function usage(): string {
  return [
    "Usage:",
    "  node tools/windows/work-campaign-supervisor-install.ts install|check|repair|run-task|rollback --kit-root <absolute> --registry <absolute> --workstation-manifest <absolute> [--workstation-root <absolute>] [--protected-root <absolute>]",
    "",
    "Install, repair, run-task, and rollback are explicit elevated local host mutations.",
    "Check is read-only. No operation prints or accepts a credential value.",
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
      if (operation == null || !["install", "check", "repair", "run-task", "rollback"].includes(operation)) {
        throw new Error("Operation must be install, check, repair, run-task, or rollback.");
      }
      const selected: Record<string, string> = {};
      for (let index = 1; index < args.length; index++) {
        const option = args[index]!;
        if (!["--kit-root", "--registry", "--workstation-manifest", "--workstation-root", "--protected-root"].includes(option)) throw new Error(`Unknown option: ${option}`);
        selected[option] = required(args, index, option);
        index++;
      }
      for (const requiredOption of ["--kit-root", "--registry", "--workstation-manifest"]) {
        if (selected[requiredOption] == null || !path.isAbsolute(selected[requiredOption])) throw new Error(`${requiredOption} must be absolute.`);
      }
      const options: WorkCampaignSupervisorPreviewOptions = {
        kitRoot: selected["--kit-root"]!,
        protectedRoot: selected["--protected-root"],
        registryPath: selected["--registry"]!,
        workstationManifestPath: selected["--workstation-manifest"]!,
        workstationRoot: selected["--workstation-root"],
      };
      const preview = buildWorkCampaignSupervisorPreview(options);
      const result = operation === "check"
        ? checkWorkCampaignSupervisorInstallation(preview, observeWorkCampaignSupervisor(preview))
        : operation === "install" ? installWorkCampaignSupervisor(preview)
          : operation === "repair" ? repairWorkCampaignSupervisor(preview)
            : operation === "run-task" ? startWorkCampaignSupervisorTask(preview)
              : rollbackWorkCampaignSupervisor(preview);
      console.log(stableJson(result).trimEnd());
      if (operation === "check" && result.status !== "current") process.exitCode = 1;
    }
  } catch (error) {
    console.error(stableJson({
      cause: error instanceof Error && error.cause instanceof Error ? error.cause.message : null,
      error: error instanceof Error ? error.message : "Windows campaign supervisor lifecycle failed.",
      schemaVersion: 1,
      status: "blocked",
      tool: "work-campaign-supervisor-install",
    }).trimEnd());
    process.exitCode = 1;
  }
}
