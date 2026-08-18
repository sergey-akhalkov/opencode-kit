import { spawn, spawnSync } from "node:child_process"
import { createHash, randomBytes } from "node:crypto"
import {
  closeSync,
  copyFileSync,
  existsSync,
  mkdirSync,
  openSync,
  readFileSync,
  readdirSync,
  renameSync,
  rmdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const protectedRoot = String.raw`C:\ProgramData\OpenCodeWorkstation`
const taskName = "OpenCode Workstation Shared Server"
const endpoint = "http://127.0.0.1:4096"
const publicModes = new Set(["install", "preflight", "status", "start", "restart", "launch", "rollback"])
const controllerSourcePath = fileURLToPath(import.meta.url)
const installedControllerPath = path.join(protectedRoot, "opencode-workstation.ts")
const manifestPath = path.join(protectedRoot, "manifest.json")
const credentialPath = path.join(protectedRoot, "server-password")
const statePath = path.join(protectedRoot, "server-state.json")
const logsPath = path.join(protectedRoot, "logs")
const protectedAlacrittyConfigPath = path.join(protectedRoot, "alacritty.toml")
const backupPath = path.join(protectedRoot, "backup")
const alacrittyBackupPath = path.join(backupPath, "alacritty.toml")
const defaultConfigurationPath = path.join(path.dirname(controllerSourcePath), "opencode-workstation.config.json")
const repositoryIds = ["opencode-kit", "pmac-emulator", "controller-gateway-service", "windows-ui-automation"]
const shortcutNames = {
  start: "OpenCode Server - Start.lnk",
  restart: "OpenCode Server - Restart.lnk",
  "opencode-kit": "OpenCode - opencode-kit.lnk",
  "pmac-emulator": "OpenCode - pmac-emulator.lnk",
  "controller-gateway-service": "OpenCode - controller-gateway-service.lnk",
  "windows-ui-automation": "OpenCode - windows-ui-automation.lnk",
}

function showHelp() {
  process.stdout.write(`OpenCode workstation controller

Usage:
  opencode-workstation.ts --help
  opencode-workstation.ts preflight [--config <path>]
  opencode-workstation.ts status
  opencode-workstation.ts install [--config <path>]
  opencode-workstation.ts start
  opencode-workstation.ts restart
  opencode-workstation.ts launch --repository <id>
  opencode-workstation.ts rollback
  opencode-workstation.ts rollback --dry-run

Repository ids:
  opencode-kit
  pmac-emulator
  controller-gateway-service
  windows-ui-automation

The help, preflight, and status modes are read-only. All output except help is JSON.
`)
}

function run(executable, args, options = {}) {
  const result = spawnSync(executable, args, {
    cwd: options.cwd,
    encoding: "utf8",
    windowsHide: true,
    env: options.env ?? process.env,
  })
  if (result.error) throw new Error(`Failed to start ${executable}`, { cause: result.error })
  if (result.status !== 0) {
    const stderr = (result.stderr ?? "").trim().slice(-2_000)
    const stdout = (result.stdout ?? "").trim().slice(-2_000)
    throw new Error(`${executable} exited ${result.status}: ${stderr || stdout || "no diagnostic output"}`)
  }
  return (result.stdout ?? "").trim()
}

function runPowerShellJson(script, options = {}) {
  const encoded = Buffer.from(script, "utf16le").toString("base64")
  const output = run("powershell.exe", ["-NoLogo", "-NoProfile", "-NonInteractive", "-EncodedCommand", encoded], options)
  try {
    return JSON.parse(output)
  } catch (error) {
    throw new Error("Windows adapter returned invalid JSON", { cause: error })
  }
}

function resolveExecutable(name) {
  const values = run("where.exe", [name])
    .split(/\r?\n/u)
    .map((value) => value.trim())
    .filter(Boolean)
  if (values.length === 0) throw new Error(`Executable '${name}' was not found.`)
  return values[0]
}

function sha256File(filePath) {
  return createHash("sha256").update(readFileSync(filePath)).digest("hex").toUpperCase()
}

function sha256Text(value) {
  return createHash("sha256").update(value, "utf8").digest("hex")
}

function fileIdentity(filePath) {
  const stats = statSync(filePath)
  return {
    path: filePath,
    length: stats.size,
    sha256: stats.size > 0 ? sha256File(filePath) : null,
  }
}

function writeJsonAtomic(filePath, value) {
  const temporary = `${filePath}.${process.pid}.tmp`
  writeFileSync(temporary, `${JSON.stringify(value, null, 2)}\n`, { encoding: "utf8" })
  renameSync(temporary, filePath)
}

function readJson(filePath) {
  try {
    return JSON.parse(readFileSync(filePath, "utf8"))
  } catch (error) {
    throw new Error(`Failed to read JSON '${filePath}'`, { cause: error })
  }
}

function exactObjectKeys(value, expectedKeys, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error(`${label} must be a JSON object.`)
  const actual = Object.keys(value).sort()
  const expected = [...expectedKeys].sort()
  if (actual.length !== expected.length || actual.some((key, index) => key !== expected[index])) {
    throw new Error(`${label} must contain exactly: ${expected.join(", ")}.`)
  }
}

function loadWorkstationConfiguration(configurationPath = defaultConfigurationPath) {
  const resolvedPath = path.resolve(configurationPath)
  if (!existsSync(resolvedPath)) throw new Error(`Workstation configuration is missing at '${resolvedPath}'.`)
  const configuration = readJson(resolvedPath)
  exactObjectKeys(configuration, ["schemaVersion", "repositories"], "Workstation configuration")
  if (configuration.schemaVersion !== 1) {
    throw new Error(`Unsupported workstation configuration schema '${configuration.schemaVersion}'.`)
  }
  exactObjectKeys(configuration.repositories, repositoryIds, "Workstation configuration repositories")
  const repositories = Object.fromEntries(repositoryIds.map((id) => {
    const configuredPath = configuration.repositories[id]
    if (typeof configuredPath !== "string" || configuredPath.trim().length === 0) {
      throw new Error(`Workstation configuration repository '${id}' must be a non-empty path string.`)
    }
    return [id, path.resolve(path.dirname(resolvedPath), configuredPath)]
  }))
  return {
    schemaVersion: 1,
    source: fileIdentity(resolvedPath),
    repositories,
  }
}

function quoteWindowsArgument(value) {
  if (value.length > 0 && !/[\s"]/u.test(value)) return value
  let result = '"'
  let backslashes = 0
  for (const character of value) {
    if (character === "\\") {
      backslashes += 1
      continue
    }
    if (character === '"') {
      result += "\\".repeat(backslashes * 2 + 1) + '"'
      backslashes = 0
      continue
    }
    result += "\\".repeat(backslashes) + character
    backslashes = 0
  }
  return result + "\\".repeat(backslashes * 2) + '"'
}

function encodedPayload(value) {
  return Buffer.from(JSON.stringify(value), "utf8").toString("base64")
}

function applyProtectedRootAcl() {
  run("icacls.exe", [
    protectedRoot,
    "/inheritance:r",
    "/grant:r",
    "*S-1-5-18:(OI)(CI)F",
    "*S-1-5-32-544:(OI)(CI)F",
    "*S-1-5-32-545:(OI)(CI)RX",
  ])
}

function applyCredentialAcl() {
  run("icacls.exe", [
    credentialPath,
    "/inheritance:r",
    "/grant:r",
    "*S-1-5-18:F",
    "*S-1-5-32-544:F",
  ])
}

function registerServerTask(manifest) {
  const payload = encodedPayload({
    node: manifest.tools.node.executable.path,
    controller: installedControllerPath,
    root: protectedRoot,
    taskName,
    user: manifest.owner.user,
  })
  return runPowerShellJson(String.raw`
$ErrorActionPreference = 'Stop'
$payload = [Text.Encoding]::UTF8.GetString([Convert]::FromBase64String('${payload}')) | ConvertFrom-Json
$arguments = '"' + [string]$payload.controller + '" serve'
$action = New-ScheduledTaskAction -Execute ([string]$payload.node) -Argument $arguments -WorkingDirectory ([string]$payload.root)
$principal = New-ScheduledTaskPrincipal -UserId ([string]$payload.user) -LogonType Interactive -RunLevel Highest
$settings = New-ScheduledTaskSettingsSet -MultipleInstances IgnoreNew -ExecutionTimeLimit ([TimeSpan]::Zero) -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries
$task = Register-ScheduledTask -TaskName ([string]$payload.taskName) -Action $action -Principal $principal -Settings $settings -ErrorAction Stop
$triggers = @($task.Triggers | Where-Object { $null -ne $_.CimClass -and -not [string]::IsNullOrWhiteSpace([string]$_.CimClass.CimClassName) })
[ordered]@{
  taskName = [string]$task.TaskName
  state = [string]$task.State
  runLevel = [string]$task.Principal.RunLevel
  triggerCount = $triggers.Count
  actionCount = @($task.Actions).Count
} | ConvertTo-Json -Compress
`)
}

function unregisterServerTask() {
  runPowerShellJson(String.raw`
$ErrorActionPreference = 'Stop'
$task = Get-ScheduledTask -TaskName 'OpenCode Workstation Shared Server' -ErrorAction SilentlyContinue
if ($null -ne $task) {
  Unregister-ScheduledTask -TaskName 'OpenCode Workstation Shared Server' -Confirm:$false -ErrorAction Stop
}
[ordered]@{ removed = $null -ne $task } | ConvertTo-Json -Compress
`)
}

function createShortcut(shortcutPath, targetPath, argumentLine, workingDirectory, iconPath) {
  const payload = encodedPayload({ shortcutPath, targetPath, argumentLine, workingDirectory, iconPath })
  return runPowerShellJson(String.raw`
$ErrorActionPreference = 'Stop'
$payload = [Text.Encoding]::UTF8.GetString([Convert]::FromBase64String('${payload}')) | ConvertFrom-Json
$shell = New-Object -ComObject WScript.Shell
$shortcut = $shell.CreateShortcut([string]$payload.shortcutPath)
$shortcut.TargetPath = [string]$payload.targetPath
$shortcut.Arguments = [string]$payload.argumentLine
$shortcut.WorkingDirectory = [string]$payload.workingDirectory
$shortcut.IconLocation = ([string]$payload.iconPath) + ',0'
$shortcut.Save()
[ordered]@{ path = [string]$payload.shortcutPath; created = Test-Path -LiteralPath ([string]$payload.shortcutPath) } | ConvertTo-Json -Compress
`)
}

function readShortcut(shortcutPath) {
  const payload = encodedPayload({ shortcutPath })
  return runPowerShellJson(String.raw`
$ErrorActionPreference = 'Stop'
$payload = [Text.Encoding]::UTF8.GetString([Convert]::FromBase64String('${payload}')) | ConvertFrom-Json
if (-not (Test-Path -LiteralPath ([string]$payload.shortcutPath) -PathType Leaf)) {
  [ordered]@{ exists = $false } | ConvertTo-Json -Compress
  exit 0
}
$shell = New-Object -ComObject WScript.Shell
$shortcut = $shell.CreateShortcut([string]$payload.shortcutPath)
[ordered]@{
  exists = $true
  path = [string]$payload.shortcutPath
  targetPath = [string]$shortcut.TargetPath
  arguments = [string]$shortcut.Arguments
  workingDirectory = [string]$shortcut.WorkingDirectory
  iconLocation = [string]$shortcut.IconLocation
} | ConvertTo-Json -Compress
`)
}

function startServerTask() {
  return runPowerShellJson(String.raw`
$ErrorActionPreference = 'Stop'
Start-ScheduledTask -TaskName 'OpenCode Workstation Shared Server' -ErrorAction Stop
$task = Get-ScheduledTask -TaskName 'OpenCode Workstation Shared Server' -ErrorAction Stop
[ordered]@{ state = [string]$task.State } | ConvertTo-Json -Compress
`)
}

function stopServerTask() {
  return runPowerShellJson(String.raw`
$ErrorActionPreference = 'Stop'
$task = Get-ScheduledTask -TaskName 'OpenCode Workstation Shared Server' -ErrorAction Stop
if ([string]$task.State -eq 'Running') {
  Stop-ScheduledTask -TaskName 'OpenCode Workstation Shared Server' -ErrorAction Stop
}
$task = Get-ScheduledTask -TaskName 'OpenCode Workstation Shared Server' -ErrorAction Stop
[ordered]@{ state = [string]$task.State } | ConvertTo-Json -Compress
`)
}

function processObservation(processId) {
  const payload = encodedPayload({ processId })
  const value = runPowerShellJson(String.raw`
$ErrorActionPreference = 'Stop'
$payload = [Text.Encoding]::UTF8.GetString([Convert]::FromBase64String('${payload}')) | ConvertFrom-Json
$process = Get-CimInstance Win32_Process -Filter ('ProcessId = ' + [int]$payload.processId) -ErrorAction Stop
[ordered]@{
  processId = [int]$process.ProcessId
  parentProcessId = [int]$process.ParentProcessId
  creationDate = [string]$process.CreationDate
  executablePath = [string]$process.ExecutablePath
  commandLine = [string]$process.CommandLine
} | ConvertTo-Json -Compress
`)
  return {
    processId: value.processId,
    parentProcessId: value.parentProcessId,
    creationDate: value.creationDate,
    executablePath: value.executablePath,
    commandLineSha256: sha256Text(value.commandLine ?? ""),
  }
}

function elevateInvocation(args) {
  const argumentLine = [controllerSourcePath, ...args].map(quoteWindowsArgument).join(" ")
  const payload = encodedPayload({ executable: process.execPath, argumentLine })
  const result = runPowerShellJson(String.raw`
$ErrorActionPreference = 'Stop'
$payload = [Text.Encoding]::UTF8.GetString([Convert]::FromBase64String('${payload}')) | ConvertFrom-Json
$process = Start-Process -FilePath ([string]$payload.executable) -ArgumentList ([string]$payload.argumentLine) -Verb RunAs -Wait -PassThru
[ordered]@{ exitCode = [int]$process.ExitCode } | ConvertTo-Json -Compress
`)
  if (result.exitCode !== 0) throw new Error(`Elevated controller exited ${result.exitCode}.`)
}

function windowsSnapshot() {
  return runPowerShellJson(String.raw`
$ErrorActionPreference = 'Stop'
$identity = [Security.Principal.WindowsIdentity]::GetCurrent()
$principal = New-Object Security.Principal.WindowsPrincipal($identity)
$desktop = [Environment]::GetFolderPath('Desktop')
$package = Get-AppxPackage -Name Microsoft.PowerShell -ErrorAction Stop | Select-Object -First 1
$task = Get-ScheduledTask -TaskName 'OpenCode Workstation Shared Server' -ErrorAction SilentlyContinue
$listeners = @(Get-NetTCPConnection -LocalPort 4096 -State Listen -ErrorAction SilentlyContinue | ForEach-Object {
  $process = Get-CimInstance Win32_Process -Filter ('ProcessId = ' + $_.OwningProcess) -ErrorAction SilentlyContinue
  [ordered]@{
    localAddress = [string]$_.LocalAddress
    localPort = [int]$_.LocalPort
    processId = [int]$_.OwningProcess
    processName = if ($null -eq $process) { $null } else { [string]$process.Name }
    executablePath = if ($null -eq $process) { $null } else { [string]$process.ExecutablePath }
    commandKind = if ($null -eq $process -or [string]::IsNullOrWhiteSpace([string]$process.CommandLine)) {
      'unavailable'
    } elseif ([string]$process.CommandLine -match '(?i)opencode.*serve') {
      'opencode-serve'
    } else {
      'other'
    }
  }
})
[ordered]@{
  user = [string]$identity.Name
  userSid = [string]$identity.User.Value
  elevated = $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
  desktop = [string]$desktop
  userConfigDir = [Environment]::GetEnvironmentVariable('OPENCODE_CONFIG_DIR', 'User')
  powershellPackage = [ordered]@{
    name = [string]$package.Name
    version = [string]$package.Version
    fullName = [string]$package.PackageFullName
    executable = [IO.Path]::Combine([string]$package.InstallLocation, 'pwsh.exe')
  }
  task = if ($null -eq $task) {
    [ordered]@{ exists = $false; state = 'absent' }
  } else {
    $triggers = @($task.Triggers | Where-Object { $null -ne $_.CimClass -and -not [string]::IsNullOrWhiteSpace([string]$_.CimClass.CimClassName) })
    [ordered]@{
      exists = $true
      state = [string]$task.State
      runLevel = [string]$task.Principal.RunLevel
      triggerCount = $triggers.Count
      actionCount = @($task.Actions).Count
      actions = @($task.Actions | ForEach-Object {
        [ordered]@{
          execute = [string]$_.Execute
          arguments = [string]$_.Arguments
          workingDirectory = [string]$_.WorkingDirectory
        }
      })
    }
  }
  listeners = $listeners
} | ConvertTo-Json -Compress -Depth 8
`)
}

function powershellIdentity(aliasPath, snapshot) {
  const probe = run(aliasPath, [
    "-NoLogo",
    "-NoProfile",
    "-NonInteractive",
    "-Command",
    "[ordered]@{ edition = $PSVersionTable.PSEdition; version = $PSVersionTable.PSVersion.ToString() } | ConvertTo-Json -Compress",
  ])
  const identity = JSON.parse(probe)
  if (identity.edition !== "Core") throw new Error("Stable pwsh.exe did not report PowerShell Core.")
  if (snapshot.powershellPackage.name !== "Microsoft.PowerShell") {
    throw new Error("Stable Microsoft.PowerShell package identity is unavailable.")
  }
  return {
    alias: aliasPath,
    edition: identity.edition,
    version: identity.version,
    package: snapshot.powershellPackage.fullName,
    executable: fileIdentity(snapshot.powershellPackage.executable),
  }
}

function toolIdentities(snapshot) {
  const alacrittyPath = resolveExecutable("alacritty.exe")
  const powershellAlias = resolveExecutable("pwsh.exe")
  const opencodePath = resolveExecutable("opencode.exe")
  return {
    node: {
      version: process.version,
      executable: fileIdentity(process.execPath),
    },
    alacritty: {
      version: run(alacrittyPath, ["--version"]),
      executable: fileIdentity(alacrittyPath),
    },
    powershell: powershellIdentity(powershellAlias, snapshot),
    opencode: {
      version: run(opencodePath, ["--version"]),
      executable: fileIdentity(opencodePath),
    },
  }
}

function repositoryIdentities(repositoryPaths) {
  return Object.fromEntries(
    Object.entries(repositoryPaths).map(([id, repositoryPath]) => {
      if (!existsSync(repositoryPath)) throw new Error(`Repository '${id}' is missing at '${repositoryPath}'.`)
      let actual
      try {
        actual = path.resolve(run("git.exe", ["-C", repositoryPath, "rev-parse", "--show-toplevel"]))
      } catch (error) {
        throw new Error(`Repository '${id}' is not an exact Git worktree at '${repositoryPath}'.`, { cause: error })
      }
      const expected = path.resolve(repositoryPath)
      if (actual.toLowerCase() !== expected.toLowerCase()) {
        throw new Error(`Repository '${id}' resolves to unexpected git root '${actual}'.`)
      }
      return [id, expected]
    }),
  )
}

function snapshotListeners(snapshot) {
  return Array.isArray(snapshot.listeners)
    ? snapshot.listeners
    : snapshot.listeners
      ? [snapshot.listeners]
      : []
}

function environmentPlan(snapshot, configuration) {
  const desktop = snapshot.desktop
  if (!desktop || !existsSync(desktop)) throw new Error("Windows Desktop known folder is unavailable.")
  const processConfigDir = process.env.OPENCODE_CONFIG_DIR
  if (!processConfigDir || !existsSync(processConfigDir)) throw new Error("Process OPENCODE_CONFIG_DIR is missing or invalid.")
  if (processConfigDir.toLowerCase() !== String(snapshot.userConfigDir).toLowerCase()) {
    throw new Error("Process and user OPENCODE_CONFIG_DIR values differ.")
  }
  const shortcuts = Object.fromEntries(
    Object.entries(shortcutNames).map(([id, name]) => {
      const shortcutPath = path.join(desktop, name)
      return [id, { path: shortcutPath, exists: existsSync(shortcutPath) }]
    }),
  )
  const listeners = snapshotListeners(snapshot)
  return {
    user: snapshot.user,
    userSidIdentity: `sha256:${sha256Text(snapshot.userSid)}`,
    elevated: snapshot.elevated,
    desktop,
    opencodeConfigDir: processConfigDir,
    endpoint,
    taskName,
    protectedRoot,
    alacrittyConfig: path.join(process.env.APPDATA ?? "", "alacritty", "alacritty.toml"),
    configuration: configuration.source,
    repositories: repositoryIdentities(configuration.repositories),
    shortcuts,
    collisions: {
      protectedRootExists: existsSync(protectedRoot),
      taskExists: snapshot.task.exists,
      alacrittyConfigExists: existsSync(path.join(process.env.APPDATA ?? "", "alacritty", "alacritty.toml")),
      shortcutCount: Object.values(shortcuts).filter((shortcut) => shortcut.exists).length,
      portListenerCount: listeners.length,
    },
    task: snapshot.task,
    port: {
      listenerCount: listeners.length,
      listeners,
    },
  }
}

function installationPlan(tools, environment) {
  return {
    configuration: environment.configuration,
    controller: {
      source: fileIdentity(controllerSourcePath),
      installedPath: installedControllerPath,
    },
    protectedRoot,
    acl: {
      root: ["SYSTEM:F", "BUILTIN\\Administrators:F", "BUILTIN\\Users:RX"],
      credential: ["SYSTEM:F", "BUILTIN\\Administrators:F"],
    },
    manifestPath,
    credentialPath,
    statePath,
    logsPath,
    task: {
      name: taskName,
      execute: tools.node.executable.path,
      arguments: `"${installedControllerPath}" serve`,
      workingDirectory: protectedRoot,
      runLevel: "Highest",
      triggerCount: 0,
      multipleInstances: "IgnoreNew",
    },
    startShortcut: {
      path: environment.shortcuts.start.path,
      target: tools.node.executable.path,
      arguments: `${quoteWindowsArgument(installedControllerPath)} start`,
      workingDirectory: protectedRoot,
    },
  }
}

function loadManifest() {
  if (!existsSync(manifestPath)) throw new Error(`Managed manifest is missing at '${manifestPath}'.`)
  const manifest = readJson(manifestPath)
  if (manifest.schemaVersion !== 1) throw new Error(`Unsupported managed manifest schema '${manifest.schemaVersion}'.`)
  if (path.resolve(manifest.controller.installedPath).toLowerCase() !== path.resolve(installedControllerPath).toLowerCase()) {
    throw new Error("Managed manifest controller path does not match this installation.")
  }
  return manifest
}

function verifyInstalledController(manifest) {
  if (!existsSync(installedControllerPath)) throw new Error("Installed controller is missing.")
  const actual = sha256File(installedControllerPath)
  if (actual !== manifest.controller.sha256) {
    throw new Error(`Installed controller hash mismatch: expected ${manifest.controller.sha256}, observed ${actual}.`)
  }
  return actual
}

function readCredential() {
  if (!existsSync(credentialPath)) throw new Error("Managed server credential is missing.")
  const value = readFileSync(credentialPath, "utf8").trim()
  if (value.length < 32) throw new Error("Managed server credential is invalid.")
  return value
}

async function healthProbe(password) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 2_000)
  try {
    const response = await fetch(`${endpoint}/global/health`, {
      headers: {
        authorization: `Basic ${Buffer.from(`opencode:${password}`, "utf8").toString("base64")}`,
      },
      signal: controller.signal,
    })
    const body = await response.text()
    let payload
    try {
      payload = body ? JSON.parse(body) : null
    } catch {
      payload = null
    }
    return {
      reachable: true,
      status: response.status,
      healthy: response.status === 200 && payload?.healthy === true,
      version: payload?.version ?? null,
    }
  } catch (error) {
    return {
      reachable: false,
      status: null,
      healthy: false,
      version: null,
      error: error instanceof Error ? error.message : String(error),
    }
  } finally {
    clearTimeout(timeout)
  }
}

async function waitForHealth(password, validateBeforeProbe, timeoutMilliseconds = 60_000) {
  const deadline = Date.now() + timeoutMilliseconds
  validateBeforeProbe()
  let last = await healthProbe(password)
  while (!last.healthy && Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, 250))
    validateBeforeProbe()
    last = await healthProbe(password)
  }
  return last
}

async function waitForValidatedRunningState(manifest, timeoutMilliseconds = 60_000) {
  const deadline = Date.now() + timeoutMilliseconds
  let lastError = new Error("Managed server has not published running state.")
  while (Date.now() < deadline) {
    try {
      return validateManagedRunningState(manifest, windowsSnapshot()).state
    } catch (error) {
      lastError = error
    }
    await new Promise((resolve) => setTimeout(resolve, 100))
  }
  throw new Error("Managed server did not reach validated running state.", { cause: lastError })
}

async function validatedManagedHealth(manifest, snapshot = windowsSnapshot()) {
  const ownership = validateManagedRunningState(manifest, snapshot)
  const health = await healthProbe(readCredential())
  return { ownership, health }
}

async function waitForValidatedManagedHealth(manifest, timeoutMilliseconds = 15_000) {
  const deadline = Date.now() + timeoutMilliseconds
  let observed = await validatedManagedHealth(manifest)
  while (!observed.health.healthy && Date.now() < deadline) {
    if (observed.health.reachable && (observed.health.status === 401 || observed.health.status === 403)) return observed
    await new Promise((resolve) => setTimeout(resolve, 250))
    observed = await validatedManagedHealth(manifest)
  }
  return observed
}

function healthDiagnostic(health) {
  return `reachable=${health.reachable}, status=${health.status ?? "none"}, detail=${health.error ?? "not-healthy"}`
}

function processDescendsFrom(processId, ancestorProcessId) {
  const visited = new Set()
  let currentProcessId = processId
  for (let depth = 0; depth < 16; depth += 1) {
    if (currentProcessId === ancestorProcessId) return true
    if (!currentProcessId || visited.has(currentProcessId)) return false
    visited.add(currentProcessId)
    try {
      const current = processObservation(currentProcessId)
      if (current.parentProcessId === currentProcessId) return false
      currentProcessId = current.parentProcessId
    } catch {
      return false
    }
  }
  return false
}

async function waitForOwnedServeListener(serverRoot, timeoutMilliseconds = 60_000) {
  const deadline = Date.now() + timeoutMilliseconds
  while (Date.now() < deadline) {
    const snapshot = windowsSnapshot()
    const listeners = snapshotListeners(snapshot)
    if (listeners.length > 1) throw new Error("Multiple listeners appeared while starting the managed server.")
    if (listeners.length === 1) {
      return validateOwnedServeListener(serverRoot, snapshot)
    }
    await new Promise((resolve) => setTimeout(resolve, 100))
  }
  throw new Error("Managed server did not create its loopback listener before the startup timeout.")
}

function validateOwnedServeListener(serverRoot, snapshot, expectedListenerProcessId) {
  const listeners = snapshotListeners(snapshot)
  if (listeners.length !== 1) throw new Error("Managed server no longer has exactly one listener during readiness.")
  const listener = listeners[0]
  const currentRoot = processObservation(serverRoot.processId)
  if (!samePath(currentRoot.executablePath, serverRoot.executablePath) ||
      currentRoot.creationDate !== serverRoot.creationDate ||
      currentRoot.commandLineSha256 !== serverRoot.commandLineSha256) {
    throw new Error("Managed server root identity changed during startup.")
  }
  if ((expectedListenerProcessId !== undefined && listener.processId !== expectedListenerProcessId) ||
      listener.localAddress !== "127.0.0.1" ||
      listener.commandKind !== "opencode-serve" ||
      !processDescendsFrom(listener.processId, serverRoot.processId)) {
    throw new Error("Port 4096 owner does not belong to the managed server process tree.")
  }
  return { snapshot, listener }
}

function installedObservation(snapshot) {
  if (!existsSync(protectedRoot) || !snapshot.task.exists) {
    return {
      installed: false,
      integrity: "absent",
    }
  }
  const manifest = loadManifest()
  const controllerHash = verifyInstalledController(manifest)
  return {
    installed: true,
    integrity: "complete",
    controllerHash,
    credentialPresent: existsSync(credentialPath),
    statePresent: existsSync(statePath),
    task: snapshot.task,
    manifest: {
      schemaVersion: manifest.schemaVersion,
      candidate: manifest.candidate,
      owner: manifest.owner,
      endpoint: manifest.endpoint,
      installedAt: manifest.installedAt,
      configuration: manifest.configuration,
      createdShortcutIds: manifest.createdShortcutIds,
    },
  }
}

function managedAlacrittyContents(existing) {
  const shellLine = 'shell = { program = "pwsh.exe", args = ["-NoLogo"] }'
  if (existing === null || existing.trim().length === 0) return `[terminal]\n${shellLine}\n`
  if (/^\s*\[terminal\.shell\]\s*$/mu.test(existing)) {
    throw new Error("Existing [terminal.shell] config requires manual-compatible migration; refusing overwrite.")
  }
  const terminalMatch = /^\s*\[terminal\]\s*(?:#.*)?$/mu.exec(existing)
  if (!terminalMatch) return `${existing.replace(/\s*$/u, "")}\n\n[terminal]\n${shellLine}\n`

  const sectionStart = terminalMatch.index
  const contentStart = sectionStart + terminalMatch[0].length
  const nextSection = /^\s*\[[^\]]+\]\s*(?:#.*)?$/gmu
  nextSection.lastIndex = contentStart
  const nextMatch = nextSection.exec(existing)
  const sectionEnd = nextMatch ? nextMatch.index : existing.length
  const section = existing.slice(contentStart, sectionEnd)
  const shellMatch = /^\s*shell\s*=.*$/mu.exec(section)
  if (shellMatch) {
    const absoluteStart = contentStart + shellMatch.index
    return existing.slice(0, absoluteStart) + shellLine + existing.slice(absoluteStart + shellMatch[0].length)
  }
  return existing.slice(0, contentStart) + `\n${shellLine}` + existing.slice(contentStart)
}

function installAlacrittyConfiguration(manifest) {
  const ordinaryPath = path.join(process.env.APPDATA ?? "", "alacritty", "alacritty.toml")
  const ordinaryParent = path.dirname(ordinaryPath)
  const parentRoot = process.env.APPDATA
  if (!parentRoot || !existsSync(parentRoot)) throw new Error("APPDATA parent is unavailable for Alacritty config.")
  const previousExists = existsSync(ordinaryPath)
  const previousBytes = previousExists ? readFileSync(ordinaryPath) : null
  const previousText = previousBytes ? previousBytes.toString("utf8") : null

  if (!existsSync(ordinaryParent)) mkdirSync(ordinaryParent)
  if (!existsSync(backupPath)) mkdirSync(backupPath)
  if (previousBytes && !existsSync(alacrittyBackupPath)) writeFileSync(alacrittyBackupPath, previousBytes, { flag: "wx" })

  const ordinaryContents = managedAlacrittyContents(previousText)
  const protectedContents = '[terminal]\nshell = { program = "pwsh.exe", args = ["-NoLogo"] }\n'
  writeFileSync(ordinaryPath, ordinaryContents, "utf8")
  writeFileSync(protectedAlacrittyConfigPath, protectedContents, "utf8")

  return {
    ordinaryPath,
    ordinarySha256: sha256File(ordinaryPath),
    protectedPath: protectedAlacrittyConfigPath,
    protectedSha256: sha256File(protectedAlacrittyConfigPath),
    previousExists,
    previousSha256: previousBytes ? createHash("sha256").update(previousBytes).digest("hex").toUpperCase() : null,
    backupPath: previousBytes ? alacrittyBackupPath : null,
  }
}

function powershellSingleQuoted(value) {
  return `'${value.replaceAll("'", "''")}'`
}

async function launch(repository) {
  const snapshot = windowsSnapshot()
  if (!snapshot.elevated) {
    elevateInvocation(["launch", "--repository", repository])
    return { schemaVersion: 1, operation: "launch", status: "delegated-to-elevated-controller", repository }
  }
  const manifest = loadManifest()
  verifyInstalledController(manifest)
  if (!Object.hasOwn(manifest.repositories, repository)) throw new Error(`Repository '${repository}' is not in the protected manifest.`)
  const currentRepositories = repositoryIdentities(manifest.repositories)
  const repositoryPath = manifest.repositories[repository]
  if (currentRepositories[repository].toLowerCase() !== path.resolve(repositoryPath).toLowerCase()) {
    throw new Error(`Repository '${repository}' no longer matches its protected mapping.`)
  }
  if (!manifest.alacritty || !existsSync(manifest.alacritty.protectedPath)) {
    throw new Error("Protected Alacritty config is missing.")
  }
  const observed = await waitForValidatedManagedHealth(manifest)
  if (!observed.health.healthy) {
    throw new Error(`Shared OpenCode server is unavailable; run the Start shortcut first (${healthDiagnostic(observed.health)}).`)
  }
  const password = readCredential()

  const command = `& ${powershellSingleQuoted(manifest.tools.opencode.executable.path)} attach ${powershellSingleQuoted(endpoint)} --dir ${powershellSingleQuoted(repositoryPath)}`
  const child = spawn(
    manifest.tools.alacritty.executable.path,
    [
      "--config-file",
      manifest.alacritty.protectedPath,
      "--working-directory",
      repositoryPath,
      "-e",
      manifest.tools.powershell.alias,
      "-NoLogo",
      "-NoProfile",
      "-NoExit",
      "-Command",
      command,
    ],
    {
      cwd: repositoryPath,
      detached: true,
      stdio: "ignore",
      windowsHide: false,
      env: {
        ...process.env,
        OPENCODE_CONFIG_DIR: manifest.opencodeConfigDir,
        OPENCODE_SERVER_PASSWORD: password,
      },
    },
  )
  await new Promise((resolve, reject) => {
    child.once("spawn", resolve)
    child.once("error", reject)
  })
  child.unref()
  return {
    schemaVersion: 1,
    operation: "launch",
    status: "launched",
    repository,
    repositoryPath,
    alacrittyProcessId: child.pid,
    endpoint,
  }
}

function install(configurationPath) {
  const configuration = loadWorkstationConfiguration(configurationPath)
  const snapshot = windowsSnapshot()
  if (!snapshot.elevated) {
    elevateInvocation(["install", "--config", configuration.source.path])
    return { schemaVersion: 1, operation: "install", status: "delegated-to-elevated-controller" }
  }
  const hasManagedRoot = existsSync(protectedRoot)
  if (hasManagedRoot || snapshot.task.exists) {
    if (!hasManagedRoot || !snapshot.task.exists) {
      throw new Error("Partial managed installation exists; refusing repair until ownership is reconciled.")
    }
    const manifest = loadManifest()
    verifyInstalledController(manifest)
    const environment = environmentPlan(snapshot, configuration)
    if (environment.port.listenerCount > 0 || snapshot.task.state === "Running") {
      throw new Error("Managed controller repair requires the server task and port to be stopped.")
    }
    const sourceIdentity = fileIdentity(controllerSourcePath)
    const temporaryController = `${installedControllerPath}.${process.pid}.new`
    const previousController = `${installedControllerPath}.${process.pid}.previous`
    const originalManifest = readFileSync(manifestPath)
    const previousManifest = JSON.parse(originalManifest.toString("utf8"))
    const ordinaryPath = path.join(process.env.APPDATA ?? "", "alacritty", "alacritty.toml")
    const ordinaryExisted = existsSync(ordinaryPath)
    const ordinaryBytes = ordinaryExisted ? readFileSync(ordinaryPath) : null
    const shortcutExistence = Object.fromEntries(Object.entries(manifest.shortcuts).map(([id, shortcutPath]) => [id, existsSync(shortcutPath)]))
    for (const id of previousManifest.createdShortcutIds) {
      if (!shortcutMatches(readShortcut(previousManifest.shortcuts[id]), expectedShortcut(previousManifest, id))) {
        throw new Error(`Managed shortcut '${id}' drifted; refusing repair.`)
      }
    }
    copyFileSync(controllerSourcePath, temporaryController)
    const copiedIdentity = fileIdentity(temporaryController)
    if (copiedIdentity.sha256 !== sourceIdentity.sha256) {
      rmSync(temporaryController, { force: true })
      throw new Error("Repaired controller copy hash mismatch.")
    }
    try {
      renameSync(installedControllerPath, previousController)
      renameSync(temporaryController, installedControllerPath)
      manifest.candidate = sourceIdentity.sha256
      manifest.controller.sourcePath = controllerSourcePath
      manifest.controller.sha256 = sourceIdentity.sha256
      manifest.task.arguments = `"${installedControllerPath}" serve`
      manifest.updatedAt = new Date().toISOString()
      manifest.configuration = configuration.source
      manifest.repositories = environment.repositories
      manifest.tools = toolIdentities(snapshot)
      if (!manifest.alacritty) manifest.alacritty = installAlacrittyConfiguration(manifest)
      const shortcuts = Object.fromEntries(Object.keys(shortcutNames).map((id) => [id, createManagedShortcut(manifest, id)]))
      manifest.createdShortcutIds = Object.keys(shortcutNames)
      writeJsonAtomic(manifestPath, manifest)
      rmSync(previousController, { force: true })
      return {
        schemaVersion: 1,
        operation: "install",
        status: "repaired-stopped",
        candidate: manifest.candidate,
        task: windowsSnapshot().task,
        protectedRoot,
        alacritty: manifest.alacritty,
        shortcuts,
        credential: { present: existsSync(credentialPath), exposed: false },
      }
    } catch (error) {
      if (existsSync(installedControllerPath)) rmSync(installedControllerPath, { force: true })
      if (existsSync(previousController)) renameSync(previousController, installedControllerPath)
      if (existsSync(temporaryController)) rmSync(temporaryController, { force: true })
      writeFileSync(manifestPath, originalManifest)
      if (ordinaryBytes) writeFileSync(ordinaryPath, ordinaryBytes)
      else if (!ordinaryExisted && existsSync(ordinaryPath)) rmSync(ordinaryPath, { force: true })
      if (existsSync(protectedAlacrittyConfigPath)) rmSync(protectedAlacrittyConfigPath, { force: true })
      for (const [id, shortcutPath] of Object.entries(manifest.shortcuts)) {
        if (shortcutExistence[id]) createManagedShortcut(previousManifest, id)
        else if (existsSync(shortcutPath)) rmSync(shortcutPath, { force: true })
      }
      throw new Error("Managed controller repair failed and prior state was restored.", { cause: error })
    }
  }

  const candidate = preflight(configuration.source.path)
  if (candidate.status !== "ready") {
    throw new Error(`Install preflight is '${candidate.status}'; refusing host mutation.`)
  }

  const created = { root: false, task: false, shortcuts: [], alacritty: false }
  const sourceIdentity = fileIdentity(controllerSourcePath)
  const environment = candidate.environment
  const plan = candidate.installationPlan
  try {
    mkdirSync(protectedRoot)
    created.root = true
    applyProtectedRootAcl()
    mkdirSync(logsPath)
    copyFileSync(controllerSourcePath, installedControllerPath)
    const installedIdentity = fileIdentity(installedControllerPath)
    if (installedIdentity.sha256 !== sourceIdentity.sha256) throw new Error("Installed controller copy hash mismatch.")

    const password = randomBytes(32).toString("base64url")
    writeFileSync(credentialPath, `${password}\n`, { encoding: "utf8", flag: "wx" })
    applyCredentialAcl()

    const manifest = {
      schemaVersion: 1,
      candidate: sourceIdentity.sha256,
      installedAt: new Date().toISOString(),
      owner: {
        user: snapshot.user,
        userSidIdentity: `sha256:${sha256Text(snapshot.userSid)}`,
      },
      endpoint,
      opencodeConfigDir: environment.opencodeConfigDir,
      configuration: environment.configuration,
      repositories: environment.repositories,
      desktop: environment.desktop,
      tools: candidate.tools,
      controller: {
        sourcePath: controllerSourcePath,
        installedPath: installedControllerPath,
        sha256: installedIdentity.sha256,
      },
      task: plan.task,
      shortcuts: Object.fromEntries(Object.entries(environment.shortcuts).map(([id, value]) => [id, value.path])),
      createdShortcutIds: Object.keys(shortcutNames),
      preState: {
        protectedRootExists: false,
        taskExists: false,
        shortcutExistence: Object.fromEntries(Object.keys(shortcutNames).map((id) => [id, environment.shortcuts[id].exists])),
        alacrittyConfigExists: environment.collisions.alacrittyConfigExists,
      },
    }
    manifest.alacritty = installAlacrittyConfiguration(manifest)
    created.alacritty = true
    writeJsonAtomic(manifestPath, manifest)

    const task = registerServerTask(manifest)
    created.task = true
    const shortcuts = {}
    for (const id of Object.keys(shortcutNames)) {
      shortcuts[id] = ensureManagedShortcut(manifest, id)
      if (shortcuts[id].created) created.shortcuts.push(id)
    }
    return {
      schemaVersion: 1,
      operation: "install",
      status: "installed-stopped",
      candidate: manifest.candidate,
      task,
      shortcuts,
      alacritty: manifest.alacritty,
      protectedRoot,
      credential: { present: true, exposed: false },
    }
  } catch (error) {
    if (created.task) {
      try {
        unregisterServerTask()
      } catch {}
    }
    for (const id of created.shortcuts) {
      try {
        rmSync(environment.shortcuts[id].path, { force: true })
      } catch {}
    }
    if (created.alacritty) {
      try {
        const managed = existsSync(manifestPath) ? readJson(manifestPath) : null
        if (managed?.alacritty?.previousExists && managed.alacritty.backupPath && existsSync(managed.alacritty.backupPath)) {
          copyFileSync(managed.alacritty.backupPath, managed.alacritty.ordinaryPath)
        } else if (managed?.alacritty?.ordinaryPath) {
          rmSync(managed.alacritty.ordinaryPath, { force: true })
        }
      } catch {}
    }
    if (created.root && existsSync(protectedRoot)) {
      try {
        rmSync(protectedRoot, { recursive: true, force: true })
      } catch {}
    }
    throw new Error("Protected workstation installation failed and cleanup was attempted.", { cause: error })
  }
}

async function start() {
  const snapshot = windowsSnapshot()
  if (!snapshot.elevated) {
    elevateInvocation(["start"])
    return { schemaVersion: 1, operation: "start", status: "delegated-to-elevated-controller" }
  }
  const manifest = loadManifest()
  verifyInstalledController(manifest)
  const currentSnapshot = windowsSnapshot()
  const listeners = snapshotListeners(currentSnapshot)
  if (listeners.length > 0) {
    const existing = await waitForValidatedManagedHealth(manifest)
    if (!existing.health.healthy) {
      throw new Error(`Validated managed server is not healthy; use Restart (${healthDiagnostic(existing.health)}).`)
    }
    return {
      schemaVersion: 1,
      operation: "start",
      status: "reused",
      health: existing.health,
      state: existing.ownership.state,
    }
  }
  if (currentSnapshot.task.state !== "Running") startServerTask()
  const runningState = await waitForValidatedRunningState(manifest)
  const current = windowsSnapshot()
  const validated = await validatedManagedHealth(manifest, current)
  if (!validated.health.healthy) {
    throw new Error(`Managed server readiness failed; task state '${current.task.state}', logs '${logsPath}'.`)
  }
  return {
    schemaVersion: 1,
    operation: "start",
    status: "started",
    health: validated.health,
    state: runningState,
  }
}

function samePath(left, right) {
  return path.resolve(left).toLowerCase() === path.resolve(right).toLowerCase()
}

function expectedShortcut(manifest, id) {
  if (id === "start" || id === "restart") {
    return {
      path: manifest.shortcuts[id],
      targetPath: manifest.tools.node.executable.path,
      arguments: `${quoteWindowsArgument(installedControllerPath)} ${id}`,
      workingDirectory: protectedRoot,
    }
  }
  return {
    path: manifest.shortcuts[id],
    targetPath: manifest.tools.node.executable.path,
    arguments: `${quoteWindowsArgument(installedControllerPath)} launch --repository ${id}`,
    workingDirectory: manifest.repositories[id],
  }
}

function shortcutMatches(observed, expected) {
  return observed.exists === true &&
    samePath(observed.targetPath, expected.targetPath) &&
    observed.arguments === expected.arguments &&
    samePath(observed.workingDirectory, expected.workingDirectory)
}

function ensureManagedShortcut(manifest, id) {
  const expected = expectedShortcut(manifest, id)
  const observed = readShortcut(expected.path)
  if (observed.exists) {
    if (!shortcutMatches(observed, expected)) throw new Error(`Existing shortcut '${id}' does not match the protected manifest.`)
    return { path: expected.path, created: false, reused: true }
  }
  return createManagedShortcut(manifest, id)
}

function createManagedShortcut(manifest, id) {
  const expected = expectedShortcut(manifest, id)
  const icon = id === "start" || id === "restart"
    ? manifest.tools.opencode.executable.path
    : manifest.tools.alacritty.executable.path
  return createShortcut(expected.path, expected.targetPath, expected.arguments, expected.workingDirectory, icon)
}

function taskMatches(snapshot, manifest) {
  const action = snapshot.task.actions?.[0]
  return snapshot.task.exists === true &&
    snapshot.task.runLevel === "Highest" &&
    snapshot.task.triggerCount === 0 &&
    snapshot.task.actionCount === 1 &&
    samePath(action?.execute ?? "", manifest.tools.node.executable.path) &&
    action?.arguments === `"${installedControllerPath}" serve` &&
    samePath(action?.workingDirectory ?? "", protectedRoot)
}

function validateManagedRunningState(manifest, snapshot) {
  if (!taskMatches(snapshot, manifest)) throw new Error("Managed task identity does not match the protected manifest.")
  if (snapshot.task.state !== "Running") throw new Error(`Managed task is '${snapshot.task.state}', not Running.`)
  if (!existsSync(statePath)) throw new Error("Managed server state is missing while the task is Running.")
  const state = readJson(statePath)
  if (state.status !== "running") throw new Error(`Managed server state is '${state.status}', not running.`)
  if (state.candidate !== manifest.candidate) throw new Error("Managed server state candidate does not match the installed manifest.")
  const supervisor = processObservation(state.supervisor.processId)
  const serverRoot = processObservation(state.serverRoot.processId)
  const expectedListener = state.listeners?.[0]
  if (!expectedListener) throw new Error("Managed server state has no listener identity.")
  const listener = processObservation(expectedListener.processId)

  for (const [label, observed, expected] of [
    ["supervisor", supervisor, state.supervisor],
    ["serverRoot", serverRoot, state.serverRoot],
  ]) {
    if (!samePath(observed.executablePath, expected.executablePath) ||
        observed.creationDate !== expected.creationDate ||
        observed.commandLineSha256 !== expected.commandLineSha256) {
      throw new Error(`Managed ${label} process identity drifted; refusing termination.`)
    }
  }
  if (serverRoot.parentProcessId !== supervisor.processId) throw new Error("Managed server root is no longer a child of the supervisor.")
  if (listener.parentProcessId !== serverRoot.processId || !samePath(listener.executablePath, expectedListener.executablePath)) {
    throw new Error("Managed listener process identity drifted; refusing termination.")
  }
  const currentListeners = snapshotListeners(snapshot)
  if (currentListeners.length !== 1 || currentListeners[0].processId !== listener.processId) {
    throw new Error("Current port owner does not match the managed listener identity.")
  }
  return { state, supervisor, serverRoot, listener }
}

function processAlive(processId) {
  try {
    process.kill(processId, 0)
    return true
  } catch {
    return false
  }
}

async function stopManagedServer() {
  const manifest = loadManifest()
  verifyInstalledController(manifest)
  const snapshot = windowsSnapshot()
  if (snapshot.task.state !== "Running" && snapshotListeners(snapshot).length === 0) {
    return { status: "already-stopped", recordedProcessIds: [] }
  }
  const validated = validateManagedRunningState(manifest, snapshot)
  const recordedProcessIds = [
    validated.supervisor.processId,
    validated.serverRoot.processId,
    validated.listener.processId,
  ]
  run("taskkill.exe", ["/PID", String(validated.supervisor.processId), "/T", "/F"])
  const deadline = Date.now() + 20_000
  while (recordedProcessIds.some(processAlive) && Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, 100))
  }
  stopServerTask()
  const finalSnapshot = windowsSnapshot()
  const remaining = recordedProcessIds.filter(processAlive)
  const finalListeners = snapshotListeners(finalSnapshot)
  if (remaining.length > 0 || finalListeners.length > 0 || finalSnapshot.task.state === "Running") {
    throw new Error(`Managed server cleanup incomplete; remaining processes '${remaining.join(",")}', listeners '${finalListeners.length}', task '${finalSnapshot.task.state}'.`)
  }
  return {
    status: "stopped",
    recordedProcessIds,
    remainingProcessIds: remaining,
    listenerCount: snapshotListeners(finalSnapshot).length,
    taskState: finalSnapshot.task.state,
  }
}

async function restart() {
  const snapshot = windowsSnapshot()
  if (!snapshot.elevated) {
    elevateInvocation(["restart"])
    return { schemaVersion: 1, operation: "restart", status: "delegated-to-elevated-controller" }
  }
  const manifest = loadManifest()
  verifyInstalledController(manifest)
  const beforeState = existsSync(statePath) ? readJson(statePath) : null
  const stop = await stopManagedServer()
  const afterStopSnapshot = windowsSnapshot()
  if (snapshotListeners(afterStopSnapshot).length > 0) throw new Error("Listener remained after managed stop; refusing replacement.")
  startServerTask()
  const afterState = await waitForValidatedRunningState(manifest)
  const health = (await validatedManagedHealth(manifest)).health
  if (!health.healthy) throw new Error(`Managed server failed health after Restart; inspect '${logsPath}'.`)
  if (beforeState?.supervisor?.processId === afterState.supervisor.processId) {
    throw new Error("Restart did not replace the supervisor process identity.")
  }
  return {
    schemaVersion: 1,
    operation: "restart",
    status: "restarted",
    stop,
    before: beforeState ? {
      supervisorProcessId: beforeState.supervisor.processId,
      serverRootProcessId: beforeState.serverRoot.processId,
      listenerProcessId: beforeState.listeners?.[0]?.processId ?? null,
    } : null,
    after: {
      supervisorProcessId: afterState.supervisor.processId,
      serverRootProcessId: afterState.serverRoot.processId,
      listenerProcessId: afterState.listeners?.[0]?.processId ?? null,
    },
    health,
  }
}

async function serve() {
  if (path.resolve(controllerSourcePath).toLowerCase() !== path.resolve(installedControllerPath).toLowerCase()) {
    throw new Error("Serve mode is allowed only from the protected installed controller.")
  }
  const snapshot = windowsSnapshot()
  if (!snapshot.elevated) throw new Error("Serve mode requires an elevated task token.")
  const manifest = loadManifest()
  verifyInstalledController(manifest)
  const password = readCredential()
  if (snapshotListeners(snapshot).length > 0) throw new Error("Port 4096 is already owned; serve mode refused startup.")

  const stdoutHandle = openSync(path.join(logsPath, "server.stdout.log"), "w")
  const stderrHandle = openSync(path.join(logsPath, "server.stderr.log"), "w")
  const child = spawn(
    manifest.tools.opencode.executable.path,
    ["serve", "--hostname", "127.0.0.1", "--port", "4096"],
    {
      cwd: protectedRoot,
      windowsHide: true,
      stdio: ["ignore", stdoutHandle, stderrHandle],
      env: {
        ...process.env,
        OPENCODE_CONFIG_DIR: manifest.opencodeConfigDir,
        OPENCODE_SERVER_PASSWORD: password,
      },
    },
  )
  const terminateChild = () => {
    if (child.exitCode === null && child.pid) {
      spawnSync("taskkill.exe", ["/PID", String(child.pid), "/T", "/F"], { windowsHide: true })
    }
  }
  process.once("SIGINT", terminateChild)
  process.once("SIGTERM", terminateChild)

  let failure
  try {
    const state = {
      schemaVersion: 1,
      status: "starting",
      candidate: manifest.candidate,
      taskName,
      endpoint,
      startedAt: new Date().toISOString(),
      supervisor: processObservation(process.pid),
      serverRoot: processObservation(child.pid),
      listeners: [],
    }
    writeJsonAtomic(statePath, state)

    let ownedListener
    try {
      ownedListener = await waitForOwnedServeListener(state.serverRoot)
    } catch (error) {
      throw new Error("Managed OpenCode process did not establish the expected listener.", { cause: error })
    }
    let health
    try {
      health = await waitForHealth(
        password,
        () => validateOwnedServeListener(state.serverRoot, windowsSnapshot(), ownedListener.listener.processId),
      )
    } catch (error) {
      throw new Error("Managed listener ownership changed during readiness.", { cause: error })
    }
    if (!health.healthy) throw new Error(`OpenCode server failed readiness; inspect '${logsPath}'.`)
    const readySnapshot = windowsSnapshot()
    const readyListeners = snapshotListeners(readySnapshot)
    if (readyListeners.length !== 1 || readyListeners[0].processId !== ownedListener.listener.processId) {
      throw new Error("Managed listener identity changed during readiness validation.")
    }
    state.status = "running"
    state.health = health
    state.listeners = readyListeners
    writeJsonAtomic(statePath, state)

    const exit = await new Promise((resolve, reject) => {
      child.once("error", reject)
      child.once("exit", (code, signal) => resolve({ code, signal }))
    })
    state.status = "exited"
    state.exit = exit
    state.exitedAt = new Date().toISOString()
    writeJsonAtomic(statePath, state)
    if (exit.code !== 0) throw new Error(`OpenCode server exited ${exit.code ?? `by signal ${exit.signal}`}.`)
  } catch (error) {
    terminateChild()
    failure = error
  } finally {
    process.removeListener("SIGINT", terminateChild)
    process.removeListener("SIGTERM", terminateChild)
    for (const [label, handle] of [["stdout", stdoutHandle], ["stderr", stderrHandle]]) {
      try {
        closeSync(handle)
      } catch (error) {
        if (!failure) failure = new Error(`Failed to close managed server ${label} log handle.`, { cause: error })
      }
    }
  }
  if (failure) throw failure
}

function rollbackDryRun() {
  const snapshot = windowsSnapshot()
  const managed = installedObservation(snapshot)
  if (!managed.installed) {
    return { schemaVersion: 1, operation: "rollback", dryRun: true, eligible: true, actions: [] }
  }
  const manifest = loadManifest()
  const expectedTaskArguments = `"${installedControllerPath}" serve`
  const taskAction = snapshot.task.actions?.[0]
  const shortcutChecks = Object.fromEntries(
    manifest.createdShortcutIds.map((id) => [id, shortcutMatches(readShortcut(manifest.shortcuts[id]), expectedShortcut(manifest, id))]),
  )
  const ordinaryHash = manifest.alacritty && existsSync(manifest.alacritty.ordinaryPath)
    ? sha256File(manifest.alacritty.ordinaryPath)
    : null
  const protectedConfigHash = manifest.alacritty && existsSync(manifest.alacritty.protectedPath)
    ? sha256File(manifest.alacritty.protectedPath)
    : null
  const backupHash = manifest.alacritty?.previousExists && manifest.alacritty.backupPath && existsSync(manifest.alacritty.backupPath)
    ? sha256File(manifest.alacritty.backupPath)
    : null
  const checks = {
    controllerHash: verifyInstalledController(manifest) === manifest.controller.sha256,
    taskRunLevel: snapshot.task.runLevel === "Highest",
    taskTriggerCount: snapshot.task.triggerCount === 0,
    taskActionCount: snapshot.task.actionCount === 1,
    taskExecute: path.resolve(taskAction?.execute ?? "").toLowerCase() === path.resolve(manifest.tools.node.executable.path).toLowerCase(),
    taskArguments: taskAction?.arguments === expectedTaskArguments,
    shortcuts: Object.values(shortcutChecks).every(Boolean),
    ordinaryAlacrittyConfig: !manifest.alacritty || ordinaryHash === manifest.alacritty.ordinarySha256,
    protectedAlacrittyConfig: !manifest.alacritty || protectedConfigHash === manifest.alacritty.protectedSha256,
    alacrittyBackup: !manifest.alacritty?.previousExists || backupHash === manifest.alacritty.previousSha256,
    credentialPresent: existsSync(credentialPath),
  }
  return {
    schemaVersion: 1,
    operation: "rollback",
    dryRun: true,
    eligible: Object.values(checks).every(Boolean),
    checks,
    shortcutChecks,
    actions: ["stop-managed-server", "remove-managed-task", "restore-alacritty-config", "remove-managed-shortcuts", "remove-protected-root"],
  }
}

async function rollback() {
  const snapshot = windowsSnapshot()
  if (!snapshot.elevated) {
    elevateInvocation(["rollback"])
    return { schemaVersion: 1, operation: "rollback", status: "delegated-to-elevated-controller" }
  }
  const plan = rollbackDryRun()
  if (!plan.eligible) {
    throw new Error(`Rollback identity checks failed; preserving drift: ${JSON.stringify(plan.checks)}.`)
  }
  const manifest = loadManifest()
  const stop = await stopManagedServer()
  const removedShortcuts = []
  for (const id of manifest.createdShortcutIds) {
    const shortcutPath = manifest.shortcuts[id]
    if (existsSync(shortcutPath)) {
      rmSync(shortcutPath, { force: true })
      removedShortcuts.push(id)
    }
  }
  unregisterServerTask()

  if (manifest.alacritty) {
    if (manifest.alacritty.previousExists) {
      if (!manifest.alacritty.backupPath || !existsSync(manifest.alacritty.backupPath)) {
        throw new Error("Alacritty rollback backup is missing after managed artifacts were removed.")
      }
      copyFileSync(manifest.alacritty.backupPath, manifest.alacritty.ordinaryPath)
    } else {
      rmSync(manifest.alacritty.ordinaryPath, { force: true })
      const ordinaryParent = path.dirname(manifest.alacritty.ordinaryPath)
      if (existsSync(ordinaryParent) && readdirSync(ordinaryParent).length === 0) rmdirSync(ordinaryParent)
    }
  }
  rmSync(protectedRoot, { recursive: true, force: true })
  return {
    schemaVersion: 1,
    operation: "rollback",
    status: "rolled-back",
    stop,
    removedTask: true,
    removedShortcuts,
    restoredAlacrittyPreviousState: manifest.alacritty?.previousExists ?? true,
    removedProtectedRoot: !existsSync(protectedRoot),
  }
}

function preflight(configurationPath) {
  const configuration = loadWorkstationConfiguration(configurationPath)
  const snapshot = windowsSnapshot()
  const environment = environmentPlan(snapshot, configuration)
  const tools = toolIdentities(snapshot)
  const collisions = environment.collisions
  const collisionCount = Number(collisions.protectedRootExists) + Number(collisions.taskExists) + Number(collisions.shortcutCount > 0) + Number(collisions.portListenerCount > 0)
  return {
    schemaVersion: 1,
    operation: "preflight",
    status: collisionCount === 0 ? "ready" : "collision",
    tools,
    environment,
    installationPlan: installationPlan(tools, environment),
  }
}

async function status() {
  const snapshot = windowsSnapshot()
  const managed = installedObservation(snapshot)
  const manifest = managed.installed ? loadManifest() : null
  const configuration = manifest
    ? { source: manifest.configuration, repositories: manifest.repositories }
    : loadWorkstationConfiguration()
  const environment = environmentPlan(snapshot, configuration)
  let health = null
  if (manifest && managed.credentialPresent && snapshotListeners(snapshot).length > 0) {
    health = (await validatedManagedHealth(manifest)).health
  }
  return {
    schemaVersion: 1,
    operation: "status",
    installed: managed.installed,
    managed,
    health,
    environment,
  }
}

function parseInvocation(args) {
  if (args.length === 0) throw new Error("A mode is required. Run --help for usage.")
  const mode = args[0].toLowerCase()
  if (mode === "--help" || mode === "-h") {
    if (args.length !== 1) throw new Error("Help accepts no additional arguments.")
    return { mode: "help", repository: undefined, configurationPath: undefined }
  }
  if (mode === "serve") {
    if (args.length !== 1) throw new Error("Serve accepts no additional arguments.")
    return { mode, repository: undefined, configurationPath: undefined, dryRun: false }
  }
  if (!publicModes.has(mode)) throw new Error(`Unknown mode '${mode}'. Run --help for usage.`)
  if (mode === "launch") {
    if (args.length !== 3 || args[1] !== "--repository") {
      throw new Error("Launch requires exactly: launch --repository <id>.")
    }
    const repository = args[2]
    if (!repositoryIds.includes(repository)) throw new Error(`Unknown repository id '${repository}'.`)
    return { mode, repository, configurationPath: undefined, dryRun: false }
  }
  if (mode === "preflight" || mode === "install") {
    if (args.length === 1) return { mode, repository: undefined, configurationPath: undefined, dryRun: false }
    if (args.length === 3 && args[1] === "--config" && args[2].trim().length > 0) {
      return { mode, repository: undefined, configurationPath: path.resolve(args[2]), dryRun: false }
    }
    throw new Error(`Mode '${mode}' accepts only an optional --config <path>.`)
  }
  if (mode === "rollback" && args.length === 2 && args[1] === "--dry-run") {
    return { mode, repository: undefined, configurationPath: undefined, dryRun: true }
  }
  if (args.length !== 1) throw new Error(`Mode '${mode}' accepts no additional arguments.`)
  return { mode, repository: undefined, configurationPath: undefined, dryRun: false }
}

function writeJson(value) {
  process.stdout.write(`${JSON.stringify(value, null, 2)}\n`)
}

async function main() {
  let operation = "parse"
  try {
    const invocation = parseInvocation(process.argv.slice(2))
    operation = invocation.mode
    if (operation === "help") {
      showHelp()
    } else if (operation === "preflight") {
      writeJson(preflight(invocation.configurationPath))
    } else if (operation === "status") {
      writeJson(await status())
    } else if (operation === "install") {
      writeJson(install(invocation.configurationPath))
    } else if (operation === "start") {
      writeJson(await start())
    } else if (operation === "launch") {
      writeJson(await launch(invocation.repository))
    } else if (operation === "restart") {
      writeJson(await restart())
    } else if (operation === "serve") {
      await serve()
    } else if (operation === "rollback" && invocation.dryRun) {
      writeJson(rollbackDryRun())
    } else if (operation === "rollback") {
      writeJson(await rollback())
    } else {
      throw new Error(`Mode '${operation}' is not implemented in this candidate.`)
    }
  } catch (error) {
    const diagnostic = {
      schemaVersion: 1,
      operation,
      status: "error",
      error: {
        type: error instanceof Error ? error.constructor.name : typeof error,
        message: error instanceof Error ? error.message : String(error),
        cause: error instanceof Error && error.cause instanceof Error ? error.cause.message : undefined,
        stack: error instanceof Error ? error.stack : undefined,
      },
    }
    if (existsSync(logsPath)) {
      try {
        writeFileSync(path.join(logsPath, "controller-errors.log"), `${JSON.stringify(diagnostic)}\n`, { encoding: "utf8", flag: "a" })
      } catch {}
    }
    writeJson(diagnostic)
    process.exitCode = 1
  }
}

await main()
