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
import {
  GRAPHIFY_ENDPOINT,
  GRAPHIFY_PORT,
  applyGraphifyConfigPlan,
  authorizeGraphifyProbe,
  graphifyArguments,
  graphifyProcessIdentity,
  inspectGraphifyListeners,
  inspectProcessObservation,
  assertReusableGraphifyConfig,
  planGraphifyConfigEdit,
  probeGraphifyMcp,
  restoreGraphifyConfig,
  validateSharedToolsConfigurationObject,
} from "./opencode-shared-tools.ts"
import { resolveWorkstationConfigurationPath } from "./opencode-workstation-config.ts"
import {
  OPENCODE_OWNER_LOGON_TASK_POLICY,
  OPENCODE_PROTECTED_CREDENTIAL_ACL,
  OPENCODE_PROTECTED_ROOT_ACL,
  OPENCODE_WORKSTATION_PROTECTED_ROOT,
  OPENCODE_WORKSTATION_SERVER_CREDENTIAL_PATH,
  OPENCODE_WORKSTATION_SERVER_TASK_NAME,
  OPENCODE_WORKSTATION_TRAY_TASK_NAME,
  quoteWindowsArgument,
} from "./opencode-workstation-layout.ts"

const protectedRoot = OPENCODE_WORKSTATION_PROTECTED_ROOT
const taskName = OPENCODE_WORKSTATION_SERVER_TASK_NAME
const trayTaskName = OPENCODE_WORKSTATION_TRAY_TASK_NAME
const OPEN_CODE_PORT = 4096
const endpoint = `http://127.0.0.1:${OPEN_CODE_PORT}`
const publicModes = new Set(["install", "preflight", "status", "start", "stop", "restart", "launch", "rollback"])
const controllerSourcePath = fileURLToPath(import.meta.url)
const installedControllerPath = path.join(protectedRoot, "opencode-workstation.ts")
const sharedToolsSourcePath = path.join(path.dirname(controllerSourcePath), "opencode-shared-tools.ts")
const installedSharedToolsPath = path.join(protectedRoot, "opencode-shared-tools.ts")
const configurationModuleSourcePath = path.join(path.dirname(controllerSourcePath), "opencode-workstation-config.ts")
const installedConfigurationModulePath = path.join(protectedRoot, "opencode-workstation-config.ts")
const layoutModuleSourcePath = path.join(path.dirname(controllerSourcePath), "opencode-workstation-layout.ts")
const installedLayoutModulePath = path.join(protectedRoot, "opencode-workstation-layout.ts")
const manifestPath = path.join(protectedRoot, "manifest.json")
const credentialPath = OPENCODE_WORKSTATION_SERVER_CREDENTIAL_PATH
const graphifyCredentialPath = path.join(protectedRoot, "graphify-api-key")
const statePath = path.join(protectedRoot, "server-state.json")
const graphifyConfigBackupPath = path.join(protectedRoot, "backup", "opencode-config.before-graphify")
const logsPath = path.join(protectedRoot, "logs")
const protectedAlacrittyConfigPath = path.join(protectedRoot, "alacritty.toml")
const invokePath = path.join(protectedRoot, "invoke.vbs")
const trayScriptPath = path.join(protectedRoot, "tray.ps1")
const trayHostPath = path.join(protectedRoot, "tray-host.vbs")
const trayStatePath = path.join(protectedRoot, "tray-state.json")
const trayCommandPath = path.join(protectedRoot, "tray-command.json")
const wscriptPath = path.join(process.env.SystemRoot ?? "C:\\Windows", "System32", "wscript.exe")
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
  opencode-workstation.ts stop
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

Machine-local mappings live in gitignored opencode-workstation.config.json.
Copy opencode-workstation.config.example.json to that name and replace placeholders.
Do not pass the tracked example as --config.
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
  const resolvedPath = resolveWorkstationConfigurationPath({
    explicitPath: configurationPath === defaultConfigurationPath ? undefined : configurationPath,
    sourceDirectory: path.dirname(controllerSourcePath),
  }).path
  if (!existsSync(resolvedPath)) throw new Error(`Workstation configuration is missing at '${resolvedPath}'.`)
  const configuration = readJson(resolvedPath)
  const sharedTools = validateSharedToolsConfigurationObject(configuration, resolvedPath)
  exactObjectKeys(configuration.repositories, repositoryIds, "Workstation configuration repositories")
  const repositories = Object.fromEntries(repositoryIds.map((id) => {
    const configuredPath = configuration.repositories[id]
    if (typeof configuredPath !== "string" || configuredPath.trim().length === 0) {
      throw new Error(`Workstation configuration repository '${id}' must be a non-empty path string.`)
    }
    return [id, path.resolve(path.dirname(resolvedPath), configuredPath)]
  }))
  return {
    schemaVersion: 2,
    source: fileIdentity(resolvedPath),
    repositories,
    graphify: sharedTools.graphify,
  }
}

function encodedPayload(value) {
  return Buffer.from(JSON.stringify(value), "utf8").toString("base64")
}

function applyProtectedRootAcl() {
  run("icacls.exe", [
    protectedRoot,
    "/inheritance:r",
    "/grant:r",
    ...OPENCODE_PROTECTED_ROOT_ACL.icacls,
  ])
}

function applyCredentialAcl(targetPath = credentialPath) {
  run("icacls.exe", [
    targetPath,
    "/inheritance:r",
    "/grant:r",
    ...OPENCODE_PROTECTED_CREDENTIAL_ACL.icacls,
  ])
}

function expectedInvokerArguments(modeArgs) {
  return `//nologo ${quoteWindowsArgument(invokePath)} ${modeArgs}`
}

function expectedServerTaskArguments() {
  return expectedInvokerArguments("serve")
}

function vbsQuote(value) {
  return `"${String(value).replaceAll("\"", "\"\"")}"`
}

function managedInvokerContents(manifest) {
  return [
    "Option Explicit",
    "Dim shell, command, index, code",
    "Set shell = CreateObject(\"WScript.Shell\")",
    `command = ${vbsQuote(manifest.tools.node.executable.path)} & " " & ${vbsQuote(installedControllerPath)}`,
    "For index = 0 To WScript.Arguments.Count - 1",
    "  command = command & \" \" & QuoteArg(WScript.Arguments(index))",
    "Next",
    "code = shell.Run(command, 0, True)",
    "If code <> 0 Then",
    "  If WScript.Arguments.Count = 0 Or LCase(WScript.Arguments(0)) <> \"serve\" Then",
    `    shell.Popup "OpenCode workstation command failed. See ${logsPath}\\controller-errors.log", 0, "OpenCode Workstation", 16`,
    "  End If",
    "  WScript.Quit code",
    "End If",
    "",
    "Function QuoteArg(value)",
    "  If InStr(value, \" \") > 0 Or InStr(value, Chr(34)) > 0 Then",
    "    QuoteArg = Chr(34) & Replace(value, Chr(34), Chr(34) & Chr(34)) & Chr(34)",
    "  Else",
    "    QuoteArg = value",
    "  End If",
    "End Function",
    "",
  ].join("\r\n")
}

function writeManagedInvoker(manifest) {
  if (!existsSync(wscriptPath)) throw new Error(`wscript.exe is missing at '${wscriptPath}'.`)
  writeFileSync(invokePath, managedInvokerContents(manifest), "utf8")
  return { path: invokePath, sha256: sha256File(invokePath), wscriptPath }
}

function expectedTrayTaskArguments() {
  return `//nologo ${quoteWindowsArgument(trayHostPath)}`
}

function managedTrayHostContents(manifest) {
  const powershell = manifest.tools.powershell.executable.path
  return [
    "Option Explicit",
    "Dim shell, command, code",
    "Set shell = CreateObject(\"WScript.Shell\")",
    `command = Chr(34) & ${vbsQuote(powershell)} & Chr(34) & " -NoLogo -NoProfile -STA -WindowStyle Hidden -File " & Chr(34) & ${vbsQuote(trayScriptPath)} & Chr(34)`,
    "code = shell.Run(command, 0, True)",
    "WScript.Quit code",
    "",
  ].join("\r\n")
}

function managedTrayScriptContents(manifest) {
  const node = manifest.tools.node.executable.path
  return `# OpenCode workstation tray host
$ErrorActionPreference = 'Continue'
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

$mutex = New-Object System.Threading.Mutex($false, 'Local\\OpenCodeWorkstationTray')
if (-not $mutex.WaitOne(0, $false)) { exit 0 }

$node = ${JSON.stringify(node)}
$controller = ${JSON.stringify(installedControllerPath)}
$stateFile = ${JSON.stringify(trayStatePath)}
    $serverState = ${JSON.stringify(statePath)}
    $commandFile = ${JSON.stringify(trayCommandPath)}
    $errorLog = ${JSON.stringify(path.join(logsPath, "controller-errors.log"))}
    $label = 'opencode-server'
$script:phase = 'starting'
$script:worker = $null
$script:blinkOn = $true
$script:recoveryAttempts = 0
$script:nextRecoveryAt = [DateTime]::MinValue
$script:recoveryBlocked = $false
$script:authenticatedHealthWorker = $null
$script:authenticatedHealthWorkerGeneration = -1
$script:healthGeneration = 0
$script:lastAuthenticatedHealthStartedAt = [DateTime]::MinValue
$script:lastAuthenticatedHealthCompletedAt = [DateTime]::MinValue
$script:managedRuntimeHealthy = $false

function New-LampIcon([System.Drawing.Color]$color) {
  $bitmap = New-Object System.Drawing.Bitmap 16, 16
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  $graphics.SmoothingMode = 'AntiAlias'
  $graphics.Clear([System.Drawing.Color]::Transparent)
  $graphics.FillEllipse((New-Object System.Drawing.SolidBrush $color), 1, 1, 14, 14)
  $graphics.Dispose()
  return [System.Drawing.Icon]::FromHandle($bitmap.GetHicon())
}

function Write-LampState([string]$color) {
  $payload = @{ schemaVersion = 1; color = $color; label = $label; updatedAt = [DateTime]::UtcNow.ToString('o') } | ConvertTo-Json -Compress
  [IO.File]::WriteAllText($stateFile, $payload)
}

function Test-ServerHealthy {
  $script:managedRuntimeHealthy -and ([DateTime]::UtcNow - $script:lastAuthenticatedHealthCompletedAt).TotalSeconds -le 20
}

function Invalidate-ManagedHealth {
  $script:healthGeneration += 1
  $script:managedRuntimeHealthy = $false
  $script:lastAuthenticatedHealthCompletedAt = [DateTime]::MinValue
}

function Update-AuthenticatedHealth {
  $now = [DateTime]::UtcNow
  if ($script:authenticatedHealthWorker -and $script:authenticatedHealthWorker.HasExited) {
    if ($script:authenticatedHealthWorkerGeneration -eq $script:healthGeneration -and $script:phase -eq 'idle') {
      $script:managedRuntimeHealthy = [int]$script:authenticatedHealthWorker.ExitCode -eq 0
      $script:lastAuthenticatedHealthCompletedAt = $now
    }
    $script:authenticatedHealthWorker = $null
  }
  if ($script:phase -eq 'idle' -and -not $script:authenticatedHealthWorker -and ($now - $script:lastAuthenticatedHealthStartedAt).TotalSeconds -ge 10) {
    $script:lastAuthenticatedHealthStartedAt = $now
    $script:authenticatedHealthWorkerGeneration = $script:healthGeneration
    $script:authenticatedHealthWorker = Start-Process -FilePath $node -ArgumentList @($controller, 'tray-health-probe') -WindowStyle Hidden -PassThru
  }
  if (($now - $script:lastAuthenticatedHealthCompletedAt).TotalSeconds -gt 20) {
    $script:managedRuntimeHealthy = $false
  }
}

function Test-RecoverableServerExit {
  if (-not (Test-Path -LiteralPath $serverState)) { return $false }
  try { $state = Get-Content -LiteralPath $serverState -Raw | ConvertFrom-Json } catch { return $false }
  if ([string]$state.status -ne 'exited' -or $null -eq $state.exit) { return $false }
  ($null -ne $state.exit.code -and [int]$state.exit.code -ne 0) -or -not [string]::IsNullOrWhiteSpace([string]$state.exit.signal)
}

function Start-ControllerAsync([string]$mode) {
  if ($script:worker -and -not $script:worker.HasExited) { return }
  $script:worker = Start-Process -FilePath $node -ArgumentList @($controller, $mode) -WindowStyle Hidden -PassThru
}

function Invoke-Recovery {
  if ($script:phase -ne 'idle' -or $script:recoveryBlocked -or $script:recoveryAttempts -ge 3) { return }
  if ([DateTime]::UtcNow -lt $script:nextRecoveryAt -or -not (Test-RecoverableServerExit)) { return }
  Invalidate-ManagedHealth
  $script:phase = 'recovering'
  $script:recoveryAttempts += 1
  $script:nextRecoveryAt = [DateTime]::UtcNow.AddMinutes(1)
  $script:blinkOn = $true
  $notify.Icon = $red
  $notify.Text = "$label (recovering)"
  Write-LampState 'recovering'
  Start-ControllerAsync 'start'
}

$green = New-LampIcon ([System.Drawing.Color]::FromArgb(0, 180, 0))
$red = New-LampIcon ([System.Drawing.Color]::FromArgb(200, 0, 0))
$amber = New-LampIcon ([System.Drawing.Color]::FromArgb(220, 140, 0))
$notify = New-Object System.Windows.Forms.NotifyIcon
$notify.Text = "$label (starting)"
$notify.Icon = $red
$notify.Visible = $true
Write-LampState 'starting'

function Set-SteadyLamp([string]$color) {
  if ($color -eq 'green') {
    $notify.Icon = $green
    $notify.Text = $label
  } else {
    $notify.Icon = $red
    $notify.Text = $label
  }
  Write-LampState $color
}

function Update-Lamp {
  if (Test-ServerHealthy) { Set-SteadyLamp 'green' } else { Set-SteadyLamp 'red' }
}

function Close-Tray {
  $timer.Stop()
  $notify.Visible = $false
  $notify.Dispose()
  try { $mutex.ReleaseMutex() } catch {}
  $context.ExitThread()
}

function Invoke-Restart {
  if ($script:phase -eq 'restarting' -or $script:phase -eq 'recovering' -or $script:phase -eq 'exiting') { return }
  Invalidate-ManagedHealth
  $script:recoveryBlocked = $true
  $script:recoveryAttempts = 0
  $script:phase = 'restarting'
  $script:blinkOn = $true
  $notify.Icon = $red
  $notify.Text = "$label (restarting)"
  Write-LampState 'restarting'
  Start-ControllerAsync 'restart'
}

function Invoke-Exit {
  if ($script:phase -eq 'exiting') { return }
  Invalidate-ManagedHealth
  $script:recoveryBlocked = $true
  $script:phase = 'exiting'
  Set-SteadyLamp 'red'
  Start-ControllerAsync 'stop'
}

$menu = New-Object System.Windows.Forms.ContextMenuStrip
$restartItem = New-Object System.Windows.Forms.ToolStripMenuItem 'Restart'
$exitItem = New-Object System.Windows.Forms.ToolStripMenuItem 'Exit'
$restartItem.add_Click({ try { Invoke-Restart } catch {} })
$exitItem.add_Click({ try { Invoke-Exit } catch {} })
[void]$menu.Items.Add($restartItem)
[void]$menu.Items.Add($exitItem)
$notify.ContextMenuStrip = $menu

Start-ControllerAsync 'start'

$timer = New-Object System.Windows.Forms.Timer
$timer.Interval = 400
$timer.add_Tick({
  try {
    Update-AuthenticatedHealth
    if (Test-Path -LiteralPath $commandFile) {
      $requested = $null
      try { $requested = (Get-Content -LiteralPath $commandFile -Raw | ConvertFrom-Json).command } catch {}
      Remove-Item -LiteralPath $commandFile -Force -ErrorAction SilentlyContinue
      if ($requested -eq 'restart') { Invoke-Restart }
      elseif ($requested -eq 'exit') { Invoke-Exit }
    }
    if ($script:worker -and $script:worker.HasExited) {
      $code = [int]$script:worker.ExitCode
      $script:worker = $null
      if ($script:phase -eq 'exiting') { Close-Tray; return }
      if ($script:phase -eq 'recovering') {
        if ($code -eq 0) {
          $script:phase = 'idle'
          $script:recoveryAttempts = 0
          $script:nextRecoveryAt = [DateTime]::MinValue
          Update-Lamp
          return
        }
        $script:phase = 'idle'
        Set-SteadyLamp 'red'
        if ($script:recoveryAttempts -ge 3) {
          $script:recoveryBlocked = $true
          $notify.Text = "$label (recovery failed)"
          $notify.ShowBalloonTip(8000, 'OpenCode Workstation', "Automatic recovery failed. See $errorLog", [System.Windows.Forms.ToolTipIcon]::Error)
        }
        return
      }
      if ($script:phase -eq 'restarting') {
        if ($code -eq 0) {
          $script:phase = 'idle'
          $script:recoveryBlocked = $false
          Update-Lamp
          return
        }
        $script:phase = 'failed'
        $notify.Icon = $red
        $notify.Text = "$label (restart failed)"
        Write-LampState 'red'
        $notify.ShowBalloonTip(8000, 'OpenCode Workstation', "Restart failed. See $errorLog", [System.Windows.Forms.ToolTipIcon]::Error)
        return
      }
      $script:phase = 'idle'
      if ($code -eq 0 -and (Test-ServerHealthy)) {
        $script:recoveryAttempts = 0
        $script:nextRecoveryAt = [DateTime]::MinValue
      }
      Update-Lamp
      return
    }
    if ($script:phase -eq 'restarting' -or $script:phase -eq 'starting' -or $script:phase -eq 'recovering') {
      $script:blinkOn = -not $script:blinkOn
      $notify.Icon = $(if ($script:blinkOn) { $red } else { $amber })
      $notify.Text = $(if ($script:phase -eq 'restarting') { "$label (restarting)" } elseif ($script:phase -eq 'recovering') { "$label (recovering)" } else { "$label (starting)" })
      Write-LampState $script:phase
    } elseif ($script:phase -eq 'failed') {
      $notify.Icon = $red
      $notify.Text = "$label (restart failed)"
    } elseif ($script:phase -eq 'idle') {
      Update-Lamp
      Invoke-Recovery
    }
  } catch {}
})
$timer.Start()

$context = New-Object System.Windows.Forms.ApplicationContext
$notify.add_Disposed({ try { $timer.Stop() } catch {}; try { $mutex.ReleaseMutex() } catch {}; try { $context.ExitThread() } catch {} })
[System.Windows.Forms.Application]::Run($context)
`
}

function writeManagedTray(manifest) {
  writeFileSync(trayHostPath, managedTrayHostContents(manifest), "utf8")
  writeFileSync(trayScriptPath, managedTrayScriptContents(manifest), "utf8")
  return {
    hostPath: trayHostPath,
    hostSha256: sha256File(trayHostPath),
    scriptPath: trayScriptPath,
    scriptSha256: sha256File(trayScriptPath),
  }
}

function registerServerTask(manifest, actionOverride) {
  const payload = encodedPayload({
    execute: actionOverride?.execute ?? wscriptPath,
    arguments: actionOverride?.arguments ?? expectedServerTaskArguments(),
    root: protectedRoot,
    taskName,
    user: manifest.owner.user,
  })
  return runPowerShellJson(String.raw`
$ErrorActionPreference = 'Stop'
$payload = [Text.Encoding]::UTF8.GetString([Convert]::FromBase64String('${payload}')) | ConvertFrom-Json
$action = New-ScheduledTaskAction -Execute ([string]$payload.execute) -Argument ([string]$payload.arguments) -WorkingDirectory ([string]$payload.root)
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

function registerTrayTask(manifest) {
  const payload = encodedPayload({
    execute: wscriptPath,
    arguments: expectedTrayTaskArguments(),
    policy: OPENCODE_OWNER_LOGON_TASK_POLICY,
    root: protectedRoot,
    taskName: trayTaskName,
    user: manifest.owner.user,
  })
  return runPowerShellJson(String.raw`
$ErrorActionPreference = 'Stop'
$payload = [Text.Encoding]::UTF8.GetString([Convert]::FromBase64String('${payload}')) | ConvertFrom-Json
$action = New-ScheduledTaskAction -Execute ([string]$payload.execute) -Argument ([string]$payload.arguments) -WorkingDirectory ([string]$payload.root)
$principal = New-ScheduledTaskPrincipal -UserId ([string]$payload.user) -LogonType ([string]$payload.policy.logonType) -RunLevel ([string]$payload.policy.runLevel)
$trigger = New-ScheduledTaskTrigger -AtLogon -User ([string]$payload.user)
$settings = New-ScheduledTaskSettingsSet -MultipleInstances ([string]$payload.policy.multipleInstances) -ExecutionTimeLimit ([TimeSpan]::Zero) -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries
$task = Register-ScheduledTask -TaskName ([string]$payload.taskName) -Action $action -Principal $principal -Trigger $trigger -Settings $settings -ErrorAction Stop
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

function unregisterTrayTask() {
  runPowerShellJson(String.raw`
$ErrorActionPreference = 'Stop'
$commandPath = '${trayCommandPath}'
$scriptPath = '${trayScriptPath}'
$scriptArgument = '-File "' + $scriptPath + '"'
function Get-ManagedTrayProcesses {
  @(Get-CimInstance Win32_Process -Filter "Name = 'pwsh.exe'" -ErrorAction SilentlyContinue | Where-Object {
    [string]$_.CommandLine -like ('*' + $scriptArgument + '*')
  })
}
$task = Get-ScheduledTask -TaskName 'OpenCode Workstation Tray' -ErrorAction SilentlyContinue
$processes = @(Get-ManagedTrayProcesses)
$graceful = ($null -eq $task -or [string]$task.State -ne 'Running') -and $processes.Count -eq 0
$forcedProcessCount = 0
if ($null -ne $task -and ([string]$task.State -eq 'Running' -or $processes.Count -gt 0)) {
  [IO.File]::WriteAllText($commandPath, '{"schemaVersion":1,"command":"exit"}')
  $deadline = [DateTime]::UtcNow.AddSeconds(15)
  do {
    Start-Sleep -Milliseconds 200
    $task = Get-ScheduledTask -TaskName 'OpenCode Workstation Tray' -ErrorAction SilentlyContinue
    $processes = @(Get-ManagedTrayProcesses)
  } while (($null -ne $task -and [string]$task.State -eq 'Running' -or $processes.Count -gt 0) -and [DateTime]::UtcNow -lt $deadline)
  $graceful = ($null -eq $task -or [string]$task.State -ne 'Running') -and $processes.Count -eq 0
}
if (-not $graceful) {
  if ($null -ne $task -and [string]$task.State -eq 'Running') {
    Stop-ScheduledTask -TaskName 'OpenCode Workstation Tray' -ErrorAction SilentlyContinue
  }
  $processes = @(Get-ManagedTrayProcesses)
  $forcedProcessCount = $processes.Count
  $processes | ForEach-Object { Stop-Process -Id ([int]$_.ProcessId) -Force -ErrorAction Stop }
  $deadline = [DateTime]::UtcNow.AddSeconds(15)
  do {
    Start-Sleep -Milliseconds 200
    $processes = @(Get-ManagedTrayProcesses)
  } while ($processes.Count -gt 0 -and [DateTime]::UtcNow -lt $deadline)
  if ($processes.Count -gt 0) { throw 'Managed tray process remained after task stop.' }
}
if ($null -ne $task) {
  Unregister-ScheduledTask -TaskName 'OpenCode Workstation Tray' -Confirm:$false -ErrorAction Stop
}
Remove-Item -LiteralPath $commandPath -Force -ErrorAction SilentlyContinue
[ordered]@{ removed = $null -ne $task; graceful = $graceful; forcedProcessCount = $forcedProcessCount } | ConvertTo-Json -Compress
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

function elevateInvocation(args, directProcessOnly = false) {
  const argumentLine = [controllerSourcePath, ...args].map(quoteWindowsArgument).join(" ")
  const payload = encodedPayload({ executable: process.execPath, argumentLine, directProcessOnly })
  const result = runPowerShellJson(String.raw`
$ErrorActionPreference = 'Stop'
$payload = [Text.Encoding]::UTF8.GetString([Convert]::FromBase64String('${payload}')) | ConvertFrom-Json
$process = if ([bool]$payload.directProcessOnly) {
  Start-Process -FilePath ([string]$payload.executable) -ArgumentList ([string]$payload.argumentLine) -Verb RunAs -WindowStyle Hidden -PassThru
} else {
  Start-Process -FilePath ([string]$payload.executable) -ArgumentList ([string]$payload.argumentLine) -Verb RunAs -WindowStyle Hidden -Wait -PassThru
}
if ([bool]$payload.directProcessOnly) { $process.WaitForExit() }
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
$trayTask = Get-ScheduledTask -TaskName 'OpenCode Workstation Tray' -ErrorAction SilentlyContinue
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
  trayTask = if ($null -eq $trayTask) {
    [ordered]@{ exists = $false; state = 'absent' }
  } else {
    $trayTriggers = @($trayTask.Triggers | Where-Object { $null -ne $_.CimClass -and -not [string]::IsNullOrWhiteSpace([string]$_.CimClass.CimClassName) })
    [ordered]@{
      exists = $true
      state = [string]$trayTask.State
      runLevel = [string]$trayTask.Principal.RunLevel
      triggerCount = $trayTriggers.Count
      actionCount = @($trayTask.Actions).Count
      actions = @($trayTask.Actions | ForEach-Object {
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
  if (!existsSync(wscriptPath)) throw new Error(`wscript.exe is missing at '${wscriptPath}'.`)
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
  const graphifyListeners = inspectGraphifyListeners()
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
    graphify: configuration.graphify,
    repositories: repositoryIdentities(configuration.repositories),
    shortcuts,
    collisions: {
      protectedRootExists: existsSync(protectedRoot),
      taskExists: snapshot.task.exists,
      trayTaskExists: snapshot.trayTask?.exists === true,
      alacrittyConfigExists: existsSync(path.join(process.env.APPDATA ?? "", "alacritty", "alacritty.toml")),
      shortcutCount: Object.values(shortcuts).filter((shortcut) => shortcut.exists).length,
      portListenerCount: listeners.length,
      graphifyPortListenerCount: graphifyListeners.length,
    },
    task: snapshot.task,
    port: {
      listenerCount: listeners.length,
      listeners,
    },
    graphifyPort: {
      listenerCount: graphifyListeners.length,
      listeners: graphifyListeners,
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
    sharedTools: {
      source: fileIdentity(sharedToolsSourcePath),
      installedPath: installedSharedToolsPath,
    },
    configurationModule: {
      source: fileIdentity(configurationModuleSourcePath),
      installedPath: installedConfigurationModulePath,
    },
    layoutModule: {
      source: fileIdentity(layoutModuleSourcePath),
      installedPath: installedLayoutModulePath,
    },
    protectedRoot,
    acl: {
      root: [...OPENCODE_PROTECTED_ROOT_ACL.display],
      credential: [...OPENCODE_PROTECTED_CREDENTIAL_ACL.display],
    },
    manifestPath,
    credentialPath,
    graphifyCredentialPath,
    graphifyConfigBackupPath,
    statePath,
    logsPath,
    task: {
      name: taskName,
      execute: wscriptPath,
      arguments: expectedServerTaskArguments(),
      workingDirectory: protectedRoot,
      runLevel: "Highest",
      triggerCount: 0,
      multipleInstances: "IgnoreNew",
    },
    trayTask: {
      name: trayTaskName,
      execute: wscriptPath,
      arguments: expectedTrayTaskArguments(),
      workingDirectory: protectedRoot,
      runLevel: OPENCODE_OWNER_LOGON_TASK_POLICY.runLevel,
      triggerCount: 1,
      multipleInstances: OPENCODE_OWNER_LOGON_TASK_POLICY.multipleInstances,
    },
    startShortcut: {
      path: environment.shortcuts.start.path,
      target: wscriptPath,
      arguments: expectedInvokerArguments("start"),
      workingDirectory: protectedRoot,
    },
  }
}

function loadManifest() {
  if (!existsSync(manifestPath)) throw new Error(`Managed manifest is missing at '${manifestPath}'.`)
  const manifest = readJson(manifestPath)
  if (manifest.schemaVersion !== 1 && manifest.schemaVersion !== 2) throw new Error(`Unsupported managed manifest schema '${manifest.schemaVersion}'.`)
  if (path.resolve(manifest.controller.installedPath).toLowerCase() !== path.resolve(installedControllerPath).toLowerCase()) {
    throw new Error("Managed manifest controller path does not match this installation.")
  }
  return manifest
}

function verifyInstalledSharedTools(manifest) {
  if (manifest.schemaVersion !== 2 || !manifest.sharedTools) throw new Error("Managed shared-tool module is not installed.")
  if (!existsSync(installedSharedToolsPath)) throw new Error("Installed shared-tool module is missing.")
  const actual = sha256File(installedSharedToolsPath)
  if (actual !== manifest.sharedTools.sha256) {
    throw new Error(`Installed shared-tool module hash mismatch: expected ${manifest.sharedTools.sha256}, observed ${actual}.`)
  }
  return actual
}

function verifyInstalledConfigurationModule(manifest) {
  if (manifest.schemaVersion !== 2 || !manifest.configurationModule) throw new Error("Managed workstation configuration module is not installed.")
  if (!existsSync(installedConfigurationModulePath)) throw new Error("Installed workstation configuration module is missing.")
  const actual = sha256File(installedConfigurationModulePath)
  if (actual !== manifest.configurationModule.sha256) {
    throw new Error(`Installed workstation configuration module hash mismatch: expected ${manifest.configurationModule.sha256}, observed ${actual}.`)
  }
  return actual
}

function verifyInstalledLayoutModule(manifest) {
  if (manifest.schemaVersion !== 2 || !manifest.layoutModule) throw new Error("Managed workstation layout module is not installed.")
  if (!existsSync(installedLayoutModulePath)) throw new Error("Installed workstation layout module is missing.")
  const actual = sha256File(installedLayoutModulePath)
  if (actual !== manifest.layoutModule.sha256) {
    throw new Error(`Installed workstation layout module hash mismatch: expected ${manifest.layoutModule.sha256}, observed ${actual}.`)
  }
  return actual
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

function readGraphifyCredential() {
  if (!existsSync(graphifyCredentialPath)) throw new Error("Managed Graphify credential is missing.")
  const value = readFileSync(graphifyCredentialPath, "utf8").trim()
  if (value.length < 32) throw new Error("Managed Graphify credential is invalid.")
  return value
}

async function healthProbe(password, timeoutMilliseconds = 10_000) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMilliseconds)
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

async function waitForValidatedRunningState(manifest, timeoutMilliseconds = 120_000) {
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
  const openCode = await healthProbe(readCredential())
  let graphify
  try {
    const processIdentity = graphifyProcessIdentity(manifest.graphify.configuration, {
      processId: ownership.graphifyRoot.processId,
      parentProcessId: ownership.graphifyRoot.parentProcessId,
      executablePath: ownership.graphifyRoot.executablePath,
      creationDate: ownership.graphifyRoot.creationDate,
      arguments: graphifyArguments(manifest.graphify.configuration),
    })
    const token = authorizeGraphifyProbe(manifest.graphify.configuration, processIdentity, {
      processId: ownership.graphifyListener.processId,
      localAddress: "127.0.0.1",
      localPort: GRAPHIFY_PORT,
      ancestorProcessIds: [ownership.graphifyRoot.processId],
    })
    graphify = await probeGraphifyMcp(token, readGraphifyCredential())
  } catch (error) {
    graphify = { healthy: false, error: error instanceof Error ? error.message : String(error) }
  }
  const health = {
    ...openCode,
    healthy: openCode.healthy && graphify.authenticatedStatus === 200 && graphify.unauthenticatedStatus === 401,
    openCode,
    graphify,
  }
  return { ownership, health }
}

async function waitForValidatedManagedHealth(manifest, timeoutMilliseconds = 15_000, initialSnapshot) {
  const deadline = Date.now() + timeoutMilliseconds
  const snapshot = initialSnapshot ?? windowsSnapshot()
  let observed = await validatedManagedHealth(manifest, snapshot)
  while (!observed.health.healthy && Date.now() < deadline) {
    if (observed.health.reachable && (observed.health.status === 401 || observed.health.status === 403)) return observed
    await new Promise((resolve) => setTimeout(resolve, 250))
    observed = await validatedManagedHealth(manifest, snapshot)
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
  const sharedToolsHash = manifest.schemaVersion === 2 ? verifyInstalledSharedTools(manifest) : null
  const configurationModuleHash = manifest.schemaVersion === 2 ? verifyInstalledConfigurationModule(manifest) : null
  const layoutModuleHash = manifest.schemaVersion === 2 && manifest.layoutModule ? verifyInstalledLayoutModule(manifest) : null
  return {
    installed: true,
    integrity: "complete",
    controllerHash,
    sharedToolsHash,
    configurationModuleHash,
    layoutModuleHash,
    credentialPresent: existsSync(credentialPath),
    graphifyCredentialPresent: existsSync(graphifyCredentialPath),
    statePresent: existsSync(statePath),
        task: snapshot.task,
        trayTask: snapshot.trayTask,
        manifest: {
      schemaVersion: manifest.schemaVersion,
      candidate: manifest.candidate,
      owner: manifest.owner,
      endpoint: manifest.endpoint,
      graphifyEndpoint: manifest.graphify?.endpoint ?? null,
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
  const shellMatch = /^[ \t]*shell\s*=.*$/mu.exec(section)
  if (shellMatch) {
    const absoluteStart = contentStart + shellMatch.index
    return existing.slice(0, absoluteStart) + shellLine + existing.slice(absoluteStart + shellMatch[0].length)
  }
  const prefix = existing.slice(0, contentStart).endsWith("\n") ? "" : "\n"
  return existing.slice(0, contentStart) + `${prefix}${shellLine}\n` + existing.slice(contentStart)
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
  const protectedContents = "[window]\nstartup_mode = \"Maximized\"\n\n[terminal]\nshell = { program = \"pwsh.exe\", args = [\"-NoLogo\"] }\n"
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
    elevateInvocation(["launch", "--repository", repository], true)
    return { schemaVersion: 1, operation: "launch", status: "delegated-to-elevated-controller", repository }
  }
  const manifest = loadManifest()
  verifyInstalledController(manifest)
  verifyInstalledSharedTools(manifest)
  verifyInstalledConfigurationModule(manifest)
  if (!Object.hasOwn(manifest.repositories, repository)) throw new Error(`Repository '${repository}' is not in the protected manifest.`)
  const currentRepositories = repositoryIdentities(manifest.repositories)
  const repositoryPath = manifest.repositories[repository]
  if (currentRepositories[repository].toLowerCase() !== path.resolve(repositoryPath).toLowerCase()) {
    throw new Error(`Repository '${repository}' no longer matches its protected mapping.`)
  }
  if (!manifest.alacritty || !existsSync(manifest.alacritty.protectedPath)) {
    throw new Error("Protected Alacritty config is missing.")
  }
  rejectDegradedState(manifest, snapshot)
  validateManagedRunningState(manifest, snapshot)
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

async function install(configurationPath) {
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
    if (environment.port.listenerCount > 0 || environment.graphifyPort.listenerCount > 0 || snapshot.task.state === "Running") {
      throw new Error("Managed controller repair requires the server task and both managed ports to be stopped.")
    }
    const sourceIdentity = fileIdentity(controllerSourcePath)
    const sharedToolsIdentity = fileIdentity(sharedToolsSourcePath)
    const configurationModuleIdentity = fileIdentity(configurationModuleSourcePath)
    const layoutModuleIdentity = fileIdentity(layoutModuleSourcePath)
    const temporaryController = `${installedControllerPath}.${process.pid}.new`
    const previousController = `${installedControllerPath}.${process.pid}.previous`
    const temporarySharedTools = `${installedSharedToolsPath}.${process.pid}.new`
    const previousSharedTools = `${installedSharedToolsPath}.${process.pid}.previous`
    const temporaryConfigurationModule = `${installedConfigurationModulePath}.${process.pid}.new`
    const previousConfigurationModule = `${installedConfigurationModulePath}.${process.pid}.previous`
    const temporaryLayoutModule = `${installedLayoutModulePath}.${process.pid}.new`
    const previousLayoutModule = `${installedLayoutModulePath}.${process.pid}.previous`
    const originalManifest = readFileSync(manifestPath)
    const previousManifest = JSON.parse(originalManifest.toString("utf8"))
    const ordinaryPath = path.join(process.env.APPDATA ?? "", "alacritty", "alacritty.toml")
    const ordinaryExisted = existsSync(ordinaryPath)
    const ordinaryBytes = ordinaryExisted ? readFileSync(ordinaryPath) : null
    const shortcutExistence = Object.fromEntries(Object.entries(manifest.shortcuts).map(([id, shortcutPath]) => [id, existsSync(shortcutPath)]))
    const previousShortcuts = Object.fromEntries(previousManifest.createdShortcutIds.map((id) => [id, readShortcut(previousManifest.shortcuts[id])]))
    const previousTaskAction = snapshot.task.actions?.[0] ?? null
    const previousManagedFiles = Object.fromEntries(
      [invokePath, trayScriptPath, trayHostPath, protectedAlacrittyConfigPath].map((filePath) => [
        filePath,
        existsSync(filePath) ? readFileSync(filePath) : null,
      ]),
    )
    const previousSharedToolsExisted = existsSync(installedSharedToolsPath)
    const previousConfigurationModuleExisted = existsSync(installedConfigurationModulePath)
    const previousLayoutModuleExisted = existsSync(installedLayoutModulePath)
    const previousGraphifyCredentialExisted = existsSync(graphifyCredentialPath)
    let appliedGraphifyConfig = null
    const graphifyConfigPlan = manifest.schemaVersion === 1
      ? await planGraphifyConfigEdit(path.join(environment.opencodeConfigDir, "opencode.json"), configuration.graphify)
      : null
    if (manifest.schemaVersion === 2) {
      verifyInstalledSharedTools(manifest)
      if (manifest.configurationModule) verifyInstalledConfigurationModule(manifest)
      manifest.graphify.configEdit = await refreshManagedGraphifyConfigEdit(manifest, configuration.graphify)
    }
    for (const id of previousManifest.createdShortcutIds) {
      if (!shortcutAcceptableForRepair(previousShortcuts[id], previousManifest, id)) {
        throw new Error(`Managed shortcut '${id}' drifted; refusing repair.`)
      }
    }
    copyFileSync(controllerSourcePath, temporaryController)
    copyFileSync(sharedToolsSourcePath, temporarySharedTools)
    copyFileSync(configurationModuleSourcePath, temporaryConfigurationModule)
    copyFileSync(layoutModuleSourcePath, temporaryLayoutModule)
    const copiedIdentity = fileIdentity(temporaryController)
    if (copiedIdentity.sha256 !== sourceIdentity.sha256) {
      rmSync(temporaryController, { force: true })
      throw new Error("Repaired controller copy hash mismatch.")
    }
    if (fileIdentity(temporarySharedTools).sha256 !== sharedToolsIdentity.sha256) {
      rmSync(temporaryController, { force: true })
      rmSync(temporarySharedTools, { force: true })
      rmSync(temporaryConfigurationModule, { force: true })
      rmSync(temporaryLayoutModule, { force: true })
      throw new Error("Repaired shared-tool module copy hash mismatch.")
    }
    if (fileIdentity(temporaryConfigurationModule).sha256 !== configurationModuleIdentity.sha256) {
      rmSync(temporaryController, { force: true })
      rmSync(temporarySharedTools, { force: true })
      rmSync(temporaryConfigurationModule, { force: true })
      rmSync(temporaryLayoutModule, { force: true })
      throw new Error("Repaired workstation configuration module copy hash mismatch.")
    }
    if (fileIdentity(temporaryLayoutModule).sha256 !== layoutModuleIdentity.sha256) {
      rmSync(temporaryController, { force: true })
      rmSync(temporarySharedTools, { force: true })
      rmSync(temporaryConfigurationModule, { force: true })
      rmSync(temporaryLayoutModule, { force: true })
      throw new Error("Repaired workstation layout module copy hash mismatch.")
    }
    try {
      renameSync(installedControllerPath, previousController)
      renameSync(temporaryController, installedControllerPath)
      if (previousSharedToolsExisted) renameSync(installedSharedToolsPath, previousSharedTools)
      renameSync(temporarySharedTools, installedSharedToolsPath)
      if (previousConfigurationModuleExisted) renameSync(installedConfigurationModulePath, previousConfigurationModule)
      renameSync(temporaryConfigurationModule, installedConfigurationModulePath)
      if (previousLayoutModuleExisted) renameSync(installedLayoutModulePath, previousLayoutModule)
      renameSync(temporaryLayoutModule, installedLayoutModulePath)
      if (!previousGraphifyCredentialExisted) {
        writeFileSync(graphifyCredentialPath, `${randomBytes(32).toString("base64url")}\n`, { encoding: "utf8", flag: "wx" })
        applyCredentialAcl(graphifyCredentialPath)
      }
      if (graphifyConfigPlan) appliedGraphifyConfig = applyGraphifyConfigPlan(graphifyConfigPlan, graphifyConfigBackupPath)
      manifest.schemaVersion = 2
      manifest.candidate = sha256Text(`${sourceIdentity.sha256}:${sharedToolsIdentity.sha256}:${configurationModuleIdentity.sha256}:${layoutModuleIdentity.sha256}`)
      manifest.controller.sourcePath = controllerSourcePath
      manifest.controller.sha256 = sourceIdentity.sha256
      manifest.sharedTools = {
        sourcePath: sharedToolsSourcePath,
        installedPath: installedSharedToolsPath,
        sha256: sharedToolsIdentity.sha256,
      }
      manifest.configurationModule = {
        sourcePath: configurationModuleSourcePath,
        installedPath: installedConfigurationModulePath,
        sha256: configurationModuleIdentity.sha256,
      }
      manifest.layoutModule = {
        sourcePath: layoutModuleSourcePath,
        installedPath: installedLayoutModulePath,
        sha256: layoutModuleIdentity.sha256,
      }
      manifest.graphify = {
        configuration: environment.graphify,
        endpoint: GRAPHIFY_ENDPOINT,
        port: GRAPHIFY_PORT,
        credentialPath: graphifyCredentialPath,
        configEdit: appliedGraphifyConfig ?? manifest.graphify.configEdit,
      }
      manifest.task = {
        ...manifest.task,
        execute: wscriptPath,
        arguments: expectedServerTaskArguments(),
        workingDirectory: protectedRoot,
        triggerCount: 0,
      }
      manifest.updatedAt = new Date().toISOString()
      manifest.configuration = configuration.source
      manifest.repositories = environment.repositories
      manifest.tools = toolIdentities(snapshot)
      manifest.invoker = writeManagedInvoker(manifest)
      if (!manifest.alacritty) {
        manifest.alacritty = installAlacrittyConfiguration(manifest)
      } else {
        writeFileSync(
          protectedAlacrittyConfigPath,
          "[window]\nstartup_mode = \"Maximized\"\n\n[terminal]\nshell = { program = \"pwsh.exe\", args = [\"-NoLogo\"] }\n",
          "utf8",
        )
        manifest.alacritty.protectedSha256 = sha256File(protectedAlacrittyConfigPath)
        if (existsSync(manifest.alacritty.ordinaryPath)) {
          manifest.alacritty.ordinarySha256 = sha256File(manifest.alacritty.ordinaryPath)
        }
      }
      unregisterServerTask()
      registerServerTask(manifest)
      manifest.tray = writeManagedTray(manifest)
      unregisterTrayTask()
      registerTrayTask(manifest)
      const shortcuts = Object.fromEntries(Object.keys(shortcutNames).map((id) => [id, createManagedShortcut(manifest, id)]))
      manifest.createdShortcutIds = Object.keys(shortcutNames)
      writeJsonAtomic(manifestPath, manifest)
      rmSync(previousController, { force: true })
      rmSync(previousSharedTools, { force: true })
      rmSync(previousConfigurationModule, { force: true })
      rmSync(previousLayoutModule, { force: true })
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
        graphifyCredential: { present: existsSync(graphifyCredentialPath), exposed: false },
      }
    } catch (error) {
      let restorationError = null
      if (existsSync(installedControllerPath)) rmSync(installedControllerPath, { force: true })
      if (existsSync(previousController)) renameSync(previousController, installedControllerPath)
      if (existsSync(temporaryController)) rmSync(temporaryController, { force: true })
      if (existsSync(installedSharedToolsPath)) rmSync(installedSharedToolsPath, { force: true })
      if (existsSync(previousSharedTools)) renameSync(previousSharedTools, installedSharedToolsPath)
      if (existsSync(temporarySharedTools)) rmSync(temporarySharedTools, { force: true })
      if (existsSync(installedConfigurationModulePath)) rmSync(installedConfigurationModulePath, { force: true })
      if (existsSync(previousConfigurationModule)) renameSync(previousConfigurationModule, installedConfigurationModulePath)
      if (existsSync(temporaryConfigurationModule)) rmSync(temporaryConfigurationModule, { force: true })
      if (existsSync(installedLayoutModulePath)) rmSync(installedLayoutModulePath, { force: true })
      if (existsSync(previousLayoutModule)) renameSync(previousLayoutModule, installedLayoutModulePath)
      if (existsSync(temporaryLayoutModule)) rmSync(temporaryLayoutModule, { force: true })
      if (!previousGraphifyCredentialExisted) rmSync(graphifyCredentialPath, { force: true })
      writeFileSync(manifestPath, originalManifest)
      if (ordinaryBytes) writeFileSync(ordinaryPath, ordinaryBytes)
      else if (!ordinaryExisted && existsSync(ordinaryPath)) rmSync(ordinaryPath, { force: true })
      for (const [filePath, bytes] of Object.entries(previousManagedFiles)) {
        if (bytes) writeFileSync(filePath, bytes)
        else rmSync(filePath, { force: true })
      }
      for (const [id, shortcutPath] of Object.entries(manifest.shortcuts)) {
        const previous = previousShortcuts[id]
        if (shortcutExistence[id] && previous?.exists) {
          createShortcut(
            shortcutPath,
            previous.targetPath,
            previous.arguments,
            previous.workingDirectory,
            id === "start" || id === "restart"
              ? previousManifest.tools.opencode.executable.path
              : previousManifest.tools.alacritty.executable.path,
          )
        } else if (existsSync(shortcutPath)) rmSync(shortcutPath, { force: true })
      }
      try {
        unregisterServerTask()
        if (previousTaskAction?.execute && previousTaskAction?.arguments) {
          registerServerTask(previousManifest, {
            execute: previousTaskAction.execute,
            arguments: previousTaskAction.arguments,
          })
        }
      } catch (restoreError) { restorationError = restoreError }
      try {
        unregisterTrayTask()
        registerTrayTask(previousManifest)
      } catch (restoreError) { restorationError ??= restoreError }
      if (appliedGraphifyConfig) {
        try {
          restoreGraphifyConfig(appliedGraphifyConfig)
          rmSync(appliedGraphifyConfig.backupPath, { force: true })
        } catch (restoreError) { restorationError ??= restoreError }
      }
      throw new Error(
        restorationError ? "Managed controller repair failed and prior state restoration was incomplete." : "Managed controller repair failed and prior state was restored.",
        { cause: restorationError ?? error },
      )
    }
  }

  const candidate = await preflight(configuration.source.path)
  if (candidate.status !== "ready") {
    throw new Error(`Install preflight is '${candidate.status}'; refusing host mutation.`)
  }

  const created = { root: false, task: false, shortcuts: [], alacritty: false, graphifyConfig: null }
  const sourceIdentity = fileIdentity(controllerSourcePath)
  const sharedToolsIdentity = fileIdentity(sharedToolsSourcePath)
  const configurationModuleIdentity = fileIdentity(configurationModuleSourcePath)
  const layoutModuleIdentity = fileIdentity(layoutModuleSourcePath)
  const environment = candidate.environment
  const plan = candidate.installationPlan
  try {
    mkdirSync(protectedRoot)
    created.root = true
    applyProtectedRootAcl()
    mkdirSync(logsPath)
    mkdirSync(backupPath)
    copyFileSync(controllerSourcePath, installedControllerPath)
    const installedIdentity = fileIdentity(installedControllerPath)
    if (installedIdentity.sha256 !== sourceIdentity.sha256) throw new Error("Installed controller copy hash mismatch.")
    copyFileSync(sharedToolsSourcePath, installedSharedToolsPath)
    const installedSharedToolsIdentity = fileIdentity(installedSharedToolsPath)
    if (installedSharedToolsIdentity.sha256 !== sharedToolsIdentity.sha256) throw new Error("Installed shared-tool module copy hash mismatch.")
    copyFileSync(configurationModuleSourcePath, installedConfigurationModulePath)
    const installedConfigurationModuleIdentity = fileIdentity(installedConfigurationModulePath)
    if (installedConfigurationModuleIdentity.sha256 !== configurationModuleIdentity.sha256) throw new Error("Installed workstation configuration module copy hash mismatch.")
    copyFileSync(layoutModuleSourcePath, installedLayoutModulePath)
    const installedLayoutModuleIdentity = fileIdentity(installedLayoutModulePath)
    if (installedLayoutModuleIdentity.sha256 !== layoutModuleIdentity.sha256) throw new Error("Installed workstation layout module copy hash mismatch.")

    const password = randomBytes(32).toString("base64url")
    writeFileSync(credentialPath, `${password}\n`, { encoding: "utf8", flag: "wx" })
    applyCredentialAcl()
    const graphifyPassword = randomBytes(32).toString("base64url")
    writeFileSync(graphifyCredentialPath, `${graphifyPassword}\n`, { encoding: "utf8", flag: "wx" })
    applyCredentialAcl(graphifyCredentialPath)
    created.graphifyConfig = applyGraphifyConfigPlan(candidate.graphifyConfigEdit, graphifyConfigBackupPath)

    const manifest = {
      schemaVersion: 2,
      candidate: sha256Text(`${sourceIdentity.sha256}:${sharedToolsIdentity.sha256}:${configurationModuleIdentity.sha256}:${layoutModuleIdentity.sha256}`),
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
      sharedTools: {
        sourcePath: sharedToolsSourcePath,
        installedPath: installedSharedToolsPath,
        sha256: installedSharedToolsIdentity.sha256,
      },
      configurationModule: {
        sourcePath: configurationModuleSourcePath,
        installedPath: installedConfigurationModulePath,
        sha256: installedConfigurationModuleIdentity.sha256,
      },
      layoutModule: {
        sourcePath: layoutModuleSourcePath,
        installedPath: installedLayoutModulePath,
        sha256: installedLayoutModuleIdentity.sha256,
      },
      graphify: {
        configuration: environment.graphify,
        endpoint: GRAPHIFY_ENDPOINT,
        port: GRAPHIFY_PORT,
        credentialPath: graphifyCredentialPath,
        configEdit: created.graphifyConfig,
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
    manifest.invoker = writeManagedInvoker(manifest)
    manifest.tray = writeManagedTray(manifest)
    writeJsonAtomic(manifestPath, manifest)

    const task = registerServerTask(manifest)
    registerTrayTask(manifest)
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
      graphifyCredential: { present: true, exposed: false },
    }
  } catch (error) {
    if (created.task) {
      try {
        unregisterTrayTask()
      } catch {}
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
    if (created.graphifyConfig) {
      try {
        restoreGraphifyConfig(created.graphifyConfig)
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
  verifyInstalledSharedTools(manifest)
  verifyInstalledConfigurationModule(manifest)
  const currentSnapshot = windowsSnapshot()
  const listeners = snapshotListeners(currentSnapshot)
  const graphifyListeners = inspectGraphifyListeners()
  if (listeners.length > 0 || graphifyListeners.length > 0) {
    rejectDegradedState(manifest, currentSnapshot)
    await waitForValidatedRunningState(manifest)
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

function sameHash(left, right) {
  return typeof left === "string" && typeof right === "string" && left.toLowerCase() === right.toLowerCase()
}

async function refreshManagedGraphifyConfigEdit(manifest, graphify) {
  const record = manifest.graphify?.configEdit
  if (!record?.path || !record.managed?.sha256) {
    throw new Error("Managed Graphify configuration record is missing.")
  }
  if (sameHash(sha256File(record.path), record.managed.sha256)) return record
  try {
    await assertReusableGraphifyConfig(record.path, graphify)
  } catch (error) {
    throw new Error("Managed Graphify configuration drifted; refusing repair.", { cause: error })
  }
  const identity = fileIdentity(record.path)
  return {
    ...record,
    managed: {
      path: identity.path,
      length: identity.length,
      sha256: identity.sha256,
    },
  }
}

function previousNodeShortcut(manifest, id) {
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

function expectedShortcut(manifest, id) {
  if (id === "start" || id === "restart") {
    return {
      path: manifest.shortcuts[id],
      targetPath: wscriptPath,
      arguments: expectedInvokerArguments(id),
      workingDirectory: protectedRoot,
    }
  }
  return {
    path: manifest.shortcuts[id],
    targetPath: wscriptPath,
    arguments: expectedInvokerArguments(`launch --repository ${id}`),
    workingDirectory: manifest.repositories[id],
  }
}

function shortcutAcceptableForRepair(observed, manifest, id) {
  return shortcutMatches(observed, expectedShortcut(manifest, id)) ||
    shortcutMatches(observed, previousNodeShortcut(manifest, id))
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
    samePath(action?.execute ?? "", wscriptPath) &&
    action?.arguments === expectedServerTaskArguments() &&
    samePath(action?.workingDirectory ?? "", protectedRoot)
}

function processIdentityMatches(observed, expected) {
  return samePath(observed.executablePath, expected.executablePath) &&
    observed.creationDate === expected.creationDate &&
    observed.commandLineSha256 === expected.commandLineSha256
}

function requireMatchingProcess(label, expected) {
  const observed = processObservation(expected.processId)
  if (!processIdentityMatches(observed, expected)) {
    throw new Error(`Managed ${label} process identity drifted; refusing termination.`)
  }
  return observed
}

function requireMatchingListener(serverRoot, expectedListener) {
  const listener = processObservation(expectedListener.processId)
  if (listener.parentProcessId !== serverRoot.processId || !samePath(listener.executablePath, expectedListener.executablePath)) {
    throw new Error("Managed listener process identity drifted; refusing termination.")
  }
  return listener
}

function listenerOwnedByServerRoot(listenerProcessId, serverRootProcessId) {
  return listenerProcessId === serverRootProcessId || processDescendsFrom(listenerProcessId, serverRootProcessId)
}

function leftoverManagedListener(listener, serverRoot, supervisor, expectedListener) {
  if (!Number.isInteger(listener?.processId)) return false
  if (listener.processId === expectedListener?.processId) return true
  if (listener.processId === serverRoot.processId) return true
  try {
    const observed = processObservation(listener.processId)
    if (observed.parentProcessId === serverRoot.processId) return true
    if (observed.parentProcessId === supervisor.processId) return true
  } catch {
    return false
  }
  return listenerOwnedByServerRoot(listener.processId, serverRoot.processId)
}

function readManagedTaskState(manifest, snapshot) {
  if (!taskMatches(snapshot, manifest)) throw new Error("Managed task identity does not match the protected manifest.")
  if (snapshot.task.state !== "Running") throw new Error(`Managed task is '${snapshot.task.state}', not Running.`)
  if (!existsSync(statePath)) throw new Error("Managed server state is missing while the task is Running.")
  const state = readJson(statePath)
  if (state.candidate !== manifest.candidate) throw new Error("Managed server state candidate does not match the installed manifest.")
  return state
}

function rejectDegradedState(manifest, snapshot) {
  const state = readManagedTaskState(manifest, snapshot)
  if (state.status === "degraded") {
    throw new Error("Managed Graphify is degraded while OpenCode remains available; use Restart before launching a new client.")
  }
  return state
}

function validateManagedRunningState(manifest, snapshot) {
  const state = readManagedTaskState(manifest, snapshot)
  if (state.status !== "running") throw new Error(`Managed server state is '${state.status}', not running.`)
  const supervisor = requireMatchingProcess("supervisor", state.supervisor)
  const serverRoot = requireMatchingProcess("serverRoot", state.serverRoot)
  const expectedListener = state.listeners?.[0]
  if (!expectedListener) throw new Error("Managed server state has no listener identity.")
  const listener = requireMatchingListener(serverRoot, expectedListener)
  if (serverRoot.parentProcessId !== supervisor.processId) throw new Error("Managed server root is no longer a child of the supervisor.")
  const graphifyRoot = requireMatchingProcess("Graphify root", state.graphify.root)
  if (graphifyRoot.parentProcessId !== supervisor.processId) throw new Error("Managed Graphify root is no longer a child of the supervisor.")
  const graphifyListener = requireMatchingListener(graphifyRoot, state.graphify.listener)
  const currentGraphifyListeners = inspectGraphifyListeners()
  if (currentGraphifyListeners.length !== 1 || currentGraphifyListeners[0].processId !== graphifyListener.processId) {
    throw new Error("Current Graphify port owner does not match the managed listener identity.")
  }
  const currentListeners = snapshotListeners(snapshot)
  if (currentListeners.length !== 1 || currentListeners[0].processId !== listener.processId) {
    throw new Error("Current port owner does not match the managed listener identity.")
  }
  return { state, supervisor, serverRoot, listener, graphifyRoot, graphifyListener }
}

function validateManagedStopState(manifest, snapshot) {
  const currentListeners = snapshotListeners(snapshot)
  const currentGraphifyListeners = inspectGraphifyListeners()
  if (!taskMatches(snapshot, manifest)) throw new Error("Managed task identity does not match the protected manifest.")
  if (snapshot.task.state !== "Running") {
    if (currentListeners.length > 0) {
      throw new Error("Current port owner does not match the managed listener identity.")
    }
    if (currentGraphifyListeners.length > 0) {
      throw new Error("Current Graphify port owner does not match the managed listener identity.")
    }
    throw new Error(`Managed task is '${snapshot.task.state}', not Running.`)
  }
  const state = readManagedTaskState(manifest, snapshot)
  if (state.status !== "running" && state.status !== "starting" && state.status !== "degraded") {
    if (currentListeners.length > 0) {
      throw new Error("Current port owner does not match the managed listener identity.")
    }
    if (currentGraphifyListeners.length > 0) {
      throw new Error("Current Graphify port owner does not match the managed listener identity.")
    }
    throw new Error(`Managed server state is '${state.status}', not running.`)
  }
  const supervisor = requireMatchingProcess("supervisor", state.supervisor)
  const serverRoot = requireMatchingProcess("serverRoot", state.serverRoot)
  if (serverRoot.parentProcessId !== supervisor.processId) throw new Error("Managed server root is no longer a child of the supervisor.")
  let graphifyRoot
  let graphifyListener
  if (state.graphify?.root && processAlive(state.graphify.root.processId)) {
    graphifyRoot = requireMatchingProcess("Graphify root", state.graphify.root)
    if (graphifyRoot.parentProcessId !== supervisor.processId) throw new Error("Managed Graphify root is no longer a child of the supervisor.")
  }
  if (currentGraphifyListeners.length > 1) throw new Error("Multiple current Graphify port owners exist.")
  if (state.graphify?.listener && processAlive(state.graphify.listener.processId) && graphifyRoot) {
    graphifyListener = requireMatchingListener(graphifyRoot, state.graphify.listener)
  }
  if (currentGraphifyListeners.length === 1) {
    if (!graphifyRoot || !listenerOwnedByServerRoot(currentGraphifyListeners[0].processId, graphifyRoot.processId)) {
      throw new Error("Current Graphify port owner does not match the managed listener identity.")
    }
    if (!graphifyListener) graphifyListener = processObservation(currentGraphifyListeners[0].processId)
  }
  if (state.status === "running") {
    const expectedListener = state.listeners?.[0]
    if (!expectedListener) throw new Error("Managed server state has no listener identity.")
    let listener
    if (processAlive(expectedListener.processId)) {
      listener = requireMatchingListener(serverRoot, expectedListener)
    }
    if (currentListeners.length > 1) {
      throw new Error("Current port owner does not match the managed listener identity.")
    }
    if (currentListeners.length === 1) {
      const current = currentListeners[0]
      if (!listenerOwnedByServerRoot(current.processId, serverRoot.processId)) {
        throw new Error("Current port owner does not match the managed listener identity.")
      }
      if (listener && listener.processId !== current.processId) {
        throw new Error("Current port owner does not match the managed listener identity.")
      }
      if (!listener) listener = processObservation(current.processId)
    } else if (listener) {
      throw new Error("Current port owner does not match the managed listener identity.")
    }
    return { state, supervisor, serverRoot, listener, graphifyRoot, graphifyListener }
  }
  let listener
  const expectedListener = state.listeners?.[0]
  if (expectedListener && processAlive(expectedListener.processId)) {
    listener = requireMatchingListener(serverRoot, expectedListener)
  }
  if (currentListeners.length > 1) {
    throw new Error("Current port owner does not match the managed listener identity.")
  }
  if (currentListeners.length === 1) {
    const current = currentListeners[0]
    if (!listenerOwnedByServerRoot(current.processId, serverRoot.processId)) {
      throw new Error("Current port owner does not match the managed listener identity.")
    }
    if (listener && listener.processId !== current.processId) {
      throw new Error("Current port owner does not match the managed listener identity.")
    }
    if (!listener) listener = processObservation(current.processId)
  }
  return { state, supervisor, serverRoot, listener, graphifyRoot, graphifyListener }
}

function processAlive(processId) {
  try {
    process.kill(processId, 0)
    return true
  } catch {
    return false
  }
}

function terminateManagedServeInvoker() {
  const payload = encodedPayload({ wscriptPath, invokePath })
  const value = runPowerShellJson(String.raw`
$ErrorActionPreference = 'Stop'
$payload = [Text.Encoding]::UTF8.GetString([Convert]::FromBase64String('${payload}')) | ConvertFrom-Json
$invoke = [string]$payload.invokePath
$wscript = [string]$payload.wscriptPath
$ids = @(Get-CimInstance Win32_Process -ErrorAction Stop | Where-Object {
  $_.ExecutablePath -and ([string]$_.ExecutablePath -ieq $wscript) -and
  $_.CommandLine -and ([string]$_.CommandLine -like ('*' + $invoke + '*serve*'))
} | ForEach-Object { [int]$_.ProcessId })
[ordered]@{ processIds = $ids } | ConvertTo-Json -Compress
`)
  const processIds = Array.isArray(value.processIds) ? value.processIds : value.processIds != null ? [value.processIds] : []
  for (const processId of processIds) {
    terminateValidatedProcess(processId)
  }
  return processIds
}

function terminateValidatedProcess(processId) {
  if (!Number.isInteger(processId) || !processAlive(processId)) {
    return { processId, status: "already-gone" }
  }
  const result = spawnSync("taskkill.exe", ["/PID", String(processId), "/F"], {
    encoding: "utf8",
    windowsHide: true,
  })
  if (!processAlive(processId)) {
    return { processId, status: "stopped", taskkillStatus: result.status }
  }
  if (result.error) throw new Error(`Failed to start taskkill.exe for process ${processId}`, { cause: result.error })
  const stderr = (result.stderr ?? "").trim().slice(-2_000)
  const stdout = (result.stdout ?? "").trim().slice(-2_000)
  throw new Error(`taskkill.exe exited ${result.status}: ${stderr || stdout || "no diagnostic output"}; process ${processId} is still alive`)
}

function terminateRecordedProcess(expected) {
  if (!expected || !Number.isInteger(expected.processId) || !processAlive(expected.processId)) return false
  const observed = processObservation(expected.processId)
  if (!processIdentityMatches(observed, expected)) {
    throw new Error(`Recorded process ${expected.processId} identity drifted; refusing termination.`)
  }
  terminateValidatedProcess(expected.processId)
  return true
}

async function stopManagedServer() {
  const manifest = loadManifest()
  verifyInstalledController(manifest)
  const snapshot = windowsSnapshot()
  if (snapshot.task.state !== "Running" && snapshotListeners(snapshot).length === 0 && inspectGraphifyListeners().length === 0) {
    writeManagedStoppedState()
    return { status: "already-stopped", recordedProcessIds: [] }
  }
  const validated = validateManagedStopState(manifest, snapshot)
  const recordedProcessIds = [
    validated.serverRoot.processId,
    validated.listener?.processId,
    validated.graphifyRoot?.processId,
    validated.graphifyListener?.processId,
    validated.supervisor.processId,
  ].filter((processId) => Number.isInteger(processId))
  for (const processId of recordedProcessIds) {
    terminateValidatedProcess(processId)
  }
  const deadline = Date.now() + 20_000
  while (Date.now() < deadline) {
    const leftovers = snapshotListeners(windowsSnapshot()).filter((listener) => (
      leftoverManagedListener(listener, validated.serverRoot, validated.supervisor, validated.listener)
    ))
    const graphifyLeftovers = inspectGraphifyListeners().filter((listener) => (
      validated.graphifyRoot && leftoverManagedListener(listener, validated.graphifyRoot, validated.supervisor, validated.graphifyListener)
    ))
    for (const leftover of leftovers) {
      if (!recordedProcessIds.includes(leftover.processId)) recordedProcessIds.push(leftover.processId)
      terminateValidatedProcess(leftover.processId)
    }
    for (const leftover of graphifyLeftovers) {
      if (!recordedProcessIds.includes(leftover.processId)) recordedProcessIds.push(leftover.processId)
      terminateValidatedProcess(leftover.processId)
    }
    if (!recordedProcessIds.some(processAlive) && leftovers.length === 0 && graphifyLeftovers.length === 0) break
    await new Promise((resolve) => setTimeout(resolve, 100))
  }
  terminateManagedServeInvoker()
  stopServerTask()
  const taskDeadline = Date.now() + 10_000
  while (windowsSnapshot().task.state === "Running" && Date.now() < taskDeadline) {
    terminateManagedServeInvoker()
    stopServerTask()
    await new Promise((resolve) => setTimeout(resolve, 100))
  }
  const finalSnapshot = windowsSnapshot()
  const remaining = recordedProcessIds.filter(processAlive)
  const finalListeners = snapshotListeners(finalSnapshot)
  const finalGraphifyListeners = inspectGraphifyListeners()
  if (remaining.length > 0 || finalListeners.length > 0 || finalGraphifyListeners.length > 0 || finalSnapshot.task.state === "Running") {
    throw new Error(`Managed server cleanup incomplete; remaining processes '${remaining.join(",")}', listeners '${finalListeners.length}', Graphify listeners '${finalGraphifyListeners.length}', task '${finalSnapshot.task.state}'.`)
  }
  writeManagedStoppedState()
  return {
    status: "stopped",
    recordedProcessIds,
    remainingProcessIds: remaining,
    listenerCount: finalListeners.length,
    graphifyListenerCount: finalGraphifyListeners.length,
    taskState: finalSnapshot.task.state,
  }
}

async function unauthenticatedChallenge(uri, timeoutMilliseconds = 2_000) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMilliseconds)
  try {
    const response = await fetch(uri, { signal: controller.signal })
    await response.body?.cancel()
    return response.status === 401
  } catch {
    return false
  } finally {
    clearTimeout(timeout)
  }
}

function trayListenerSnapshot() {
  return runPowerShellJson(String.raw`
$ErrorActionPreference = 'Stop'
$listeners = @(@(4096, 4097) | ForEach-Object {
  $port = $_
  @(Get-NetTCPConnection -LocalAddress 127.0.0.1 -LocalPort $port -State Listen -ErrorAction SilentlyContinue | ForEach-Object {
    [ordered]@{ localPort = [int]$_.LocalPort; processId = [int]$_.OwningProcess }
  })
})
[ordered]@{ listeners = $listeners } | ConvertTo-Json -Compress -Depth 3
`)
}

function trayListenerMatches(snapshot, port, processId) {
  const listeners = Array.isArray(snapshot.listeners) ? snapshot.listeners : snapshot.listeners ? [snapshot.listeners] : []
  const matches = listeners.filter((listener) => listener.localPort === port)
  return matches.length === 1 && matches[0].processId === processId
}

function writeManagedStoppedState() {
  if (!existsSync(statePath)) return
  const state = readJson(statePath)
  state.status = "stopped"
  state.stoppedAt = new Date().toISOString()
  state.health = { ...state.health, healthy: false }
  writeJsonAtomic(statePath, state)
}

async function stop() {
  const snapshot = windowsSnapshot()
  if (!snapshot.elevated) {
    elevateInvocation(["stop"])
    return { schemaVersion: 1, operation: "stop", status: "delegated-to-elevated-controller" }
  }
  const result = await stopManagedServer()
  return {
    schemaVersion: 1,
    operation: "stop",
    ...result,
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
  if (inspectGraphifyListeners().length > 0) throw new Error("Graphify listener remained after managed stop; refusing replacement.")
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
      graphifyRootProcessId: beforeState.graphify?.root?.processId ?? null,
      graphifyListenerProcessId: beforeState.graphify?.listener?.processId ?? null,
    } : null,
    after: {
      supervisorProcessId: afterState.supervisor.processId,
      serverRootProcessId: afterState.serverRoot.processId,
      listenerProcessId: afterState.listeners?.[0]?.processId ?? null,
      graphifyRootProcessId: afterState.graphify?.root?.processId ?? null,
      graphifyListenerProcessId: afterState.graphify?.listener?.processId ?? null,
    },
    health,
  }
}

function openManagedServiceLog(name) {
  const currentPath = path.join(logsPath, name)
  const previousPath = `${currentPath}.previous`
  if (existsSync(currentPath)) {
    rmSync(previousPath, { force: true })
    renameSync(currentPath, previousPath)
  }
  return openSync(currentPath, "w")
}

async function serve() {
  if (path.resolve(controllerSourcePath).toLowerCase() !== path.resolve(installedControllerPath).toLowerCase()) {
    throw new Error("Serve mode is allowed only from the protected installed controller.")
  }
  const snapshot = windowsSnapshot()
  if (!snapshot.elevated) throw new Error("Serve mode requires an elevated task token.")
  const manifest = loadManifest()
  verifyInstalledController(manifest)
  verifyInstalledSharedTools(manifest)
  verifyInstalledConfigurationModule(manifest)
  const password = readCredential()
  const graphifyPassword = readGraphifyCredential()
  if (snapshotListeners(snapshot).length > 0) throw new Error("Port 4096 is already owned; serve mode refused startup.")
  if (inspectGraphifyListeners().length > 0) throw new Error(`Port ${GRAPHIFY_PORT} is already owned; serve mode refused startup.`)

  const handles = {
    serverStdout: openManagedServiceLog("server.stdout.log"),
    serverStderr: openManagedServiceLog("server.stderr.log"),
    graphifyStdout: openManagedServiceLog("graphify.stdout.log"),
    graphifyStderr: openManagedServiceLog("graphify.stderr.log"),
  }
  const graphifyArgs = graphifyArguments(manifest.graphify.configuration)
  const graphifyChild = spawn(manifest.graphify.configuration.python.path, graphifyArgs, {
    cwd: protectedRoot,
    windowsHide: true,
    stdio: ["ignore", handles.graphifyStdout, handles.graphifyStderr],
    env: {
      ...process.env,
      GRAPHIFY_API_KEY: graphifyPassword,
      PYTHONUNBUFFERED: "1",
      PYTHONIOENCODING: "utf-8",
      PYTHONUTF8: "1",
    },
  })
  let openCodeChild
  let managedGraphifyRoot
  let managedOpenCodeRoot
  let managedGraphifyListener
  let managedOpenCodeListener
  const terminateChildren = () => {
    for (const expected of [managedOpenCodeRoot, managedGraphifyRoot, managedOpenCodeListener, managedGraphifyListener]) {
      try { terminateRecordedProcess(expected) } catch {}
    }
  }
  process.once("SIGINT", terminateChildren)
  process.once("SIGTERM", terminateChildren)

  let failure
  try {
    const state = {
      schemaVersion: 2,
      status: "starting",
      candidate: manifest.candidate,
      taskName,
      endpoint,
      graphifyEndpoint: GRAPHIFY_ENDPOINT,
      startedAt: new Date().toISOString(),
      supervisor: processObservation(process.pid),
      graphify: {
        root: processObservation(graphifyChild.pid),
        listener: null,
        health: null,
      },
      serverRoot: null,
      listeners: [],
    }
    managedGraphifyRoot = state.graphify.root
    writeJsonAtomic(statePath, state)

    const graphifyDeadline = Date.now() + 120_000
    let graphifyListener
    while (Date.now() < graphifyDeadline) {
      if (graphifyChild.exitCode != null) throw new Error(`Managed Graphify exited ${graphifyChild.exitCode} before readiness.`)
      const listeners = inspectGraphifyListeners()
      if (listeners.length > 1) throw new Error("Multiple listeners appeared on the managed Graphify port.")
      if (listeners.length === 1) {
        if (!listenerOwnedByServerRoot(listeners[0].processId, state.graphify.root.processId)) {
          throw new Error("Graphify listener is not owned by the managed Graphify root.")
        }
        managedGraphifyListener = processObservation(listeners[0].processId)
        graphifyListener = processObservation(listeners[0].processId)
        break
      }
      await new Promise((resolve) => setTimeout(resolve, 2_000))
    }
    if (!graphifyListener) throw new Error("Managed Graphify did not establish its listener within 120000ms.")
    state.graphify.listener = graphifyListener
    managedGraphifyRoot = state.graphify.root
    managedGraphifyListener = graphifyListener
    const graphifyIdentity = graphifyProcessIdentity(manifest.graphify.configuration, {
      processId: state.graphify.root.processId,
      parentProcessId: state.graphify.root.parentProcessId,
      executablePath: state.graphify.root.executablePath,
      creationDate: state.graphify.root.creationDate,
      arguments: graphifyArgs,
    })
    const graphifyToken = authorizeGraphifyProbe(manifest.graphify.configuration, graphifyIdentity, {
      processId: graphifyListener.processId,
      localAddress: "127.0.0.1",
      localPort: GRAPHIFY_PORT,
      ancestorProcessIds: [state.graphify.root.processId],
    })
    state.graphify.health = await probeGraphifyMcp(graphifyToken, graphifyPassword)
    writeJsonAtomic(statePath, state)

    openCodeChild = spawn(
      manifest.tools.opencode.executable.path,
      ["serve", "--hostname", "127.0.0.1", "--port", "4096"],
      {
        cwd: protectedRoot,
        windowsHide: true,
        stdio: ["ignore", handles.serverStdout, handles.serverStderr],
        env: {
          ...process.env,
          OPENCODE_CONFIG_DIR: manifest.opencodeConfigDir,
          OPENCODE_SERVER_PASSWORD: password,
          OPENCODE_GRAPHIFY_API_KEY: graphifyPassword,
        },
      },
    )
    state.serverRoot = processObservation(openCodeChild.pid)
    managedOpenCodeRoot = state.serverRoot
    writeJsonAtomic(statePath, state)

    let ownedListener
    try {
      ownedListener = await waitForOwnedServeListener(state.serverRoot)
    } catch (error) {
      throw new Error("Managed OpenCode process did not establish the expected listener.", { cause: error })
    }
    let openCodeHealth
    try {
      openCodeHealth = await waitForHealth(
        password,
        () => validateOwnedServeListener(state.serverRoot, windowsSnapshot(), ownedListener.listener.processId),
      )
    } catch (error) {
      throw new Error("Managed listener ownership changed during readiness.", { cause: error })
    }
    if (!openCodeHealth.healthy) throw new Error(`OpenCode server failed readiness; inspect '${logsPath}'.`)
    managedOpenCodeListener = processObservation(ownedListener.listener.processId)
    const readyListeners = snapshotListeners(windowsSnapshot())
    if (readyListeners.length !== 1 || readyListeners[0].processId !== ownedListener.listener.processId) {
      throw new Error("Managed listener identity changed during readiness validation.")
    }
    state.status = "running"
    state.health = { healthy: true, openCode: openCodeHealth, graphify: state.graphify.health }
    state.listeners = readyListeners
    writeJsonAtomic(statePath, state)

    const graphifyExitPromise = graphifyChild.exitCode != null
      ? Promise.resolve({ service: "graphify", code: graphifyChild.exitCode, signal: graphifyChild.signalCode })
      : new Promise((resolve, reject) => {
          graphifyChild.once("error", reject)
          graphifyChild.once("exit", (code, signal) => resolve({ service: "graphify", code, signal }))
        })
    const openCodeExitPromise = new Promise((resolve, reject) => {
      openCodeChild.once("error", reject)
      openCodeChild.once("exit", (code, signal) => resolve({ service: "opencode", code, signal }))
    })
    let exit = await Promise.race([graphifyExitPromise, openCodeExitPromise])
    if (exit.service === "graphify") {
      state.status = "degraded"
      state.health = { healthy: false, openCode: openCodeHealth, graphify: { healthy: false, exit } }
      state.graphify.exit = exit
      state.graphify.exitedAt = new Date().toISOString()
      writeJsonAtomic(statePath, state)
      exit = await openCodeExitPromise
    }
    terminateChildren()
    state.status = "exited"
    state.exit = exit
    state.exitedAt = new Date().toISOString()
    writeJsonAtomic(statePath, state)
    if (exit.code !== 0) throw new Error(`OpenCode server exited ${exit.code ?? `by signal ${exit.signal}`}.`)
  } catch (error) {
    terminateChildren()
    failure = error
  } finally {
    process.removeListener("SIGINT", terminateChildren)
    process.removeListener("SIGTERM", terminateChildren)
    for (const [label, handle] of Object.entries(handles)) {
      try {
        closeSync(handle)
      } catch (error) {
        if (!failure) failure = new Error(`Failed to close managed ${label} log handle.`, { cause: error })
      }
    }
  }
  if (failure) throw failure
}

async function probeManagedRuntimeHealthForTray() {
  if (path.resolve(controllerSourcePath).toLowerCase() !== path.resolve(installedControllerPath).toLowerCase()) {
    throw new Error("Tray health probe is allowed only from the protected installed controller.")
  }
  const manifest = loadManifest()
  verifyInstalledController(manifest)
  verifyInstalledSharedTools(manifest)
  verifyInstalledConfigurationModule(manifest)
  if (!existsSync(statePath)) return false
  const state = readJson(statePath)
  const openCodeProcessId = state.listeners?.[0]?.processId
  const graphifyProcessId = state.graphify?.listener?.processId
  if (state.status !== "running" || state.health?.healthy !== true || !Number.isInteger(openCodeProcessId) || !Number.isInteger(graphifyProcessId)) {
    return false
  }
  const listeners = trayListenerSnapshot()
  if (!trayListenerMatches(listeners, OPEN_CODE_PORT, openCodeProcessId) || !trayListenerMatches(listeners, GRAPHIFY_PORT, graphifyProcessId)) {
    return false
  }
  const [openCode, openCodeChallenge, graphifyChallenge] = await Promise.all([
    healthProbe(readCredential()),
    unauthenticatedChallenge(`${endpoint}/global/health`),
    unauthenticatedChallenge(GRAPHIFY_ENDPOINT),
  ])
  return openCode.healthy && openCodeChallenge && graphifyChallenge
}

function rollbackDryRun() {
  const snapshot = windowsSnapshot()
  const managed = installedObservation(snapshot)
  if (!managed.installed) {
    return { schemaVersion: 1, operation: "rollback", dryRun: true, eligible: true, actions: [] }
  }
  const manifest = loadManifest()
  const expectedTaskArguments = expectedServerTaskArguments()
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
    sharedToolsHash: verifyInstalledSharedTools(manifest) === manifest.sharedTools.sha256,
    configurationModuleHash: verifyInstalledConfigurationModule(manifest) === manifest.configurationModule.sha256,
    layoutModuleHash: !manifest.layoutModule || verifyInstalledLayoutModule(manifest) === manifest.layoutModule.sha256,
    taskRunLevel: snapshot.task.runLevel === "Highest",
    taskTriggerCount: snapshot.task.triggerCount === 0,
    taskActionCount: snapshot.task.actionCount === 1,
    taskExecute: path.resolve(taskAction?.execute ?? "").toLowerCase() === path.resolve(wscriptPath).toLowerCase(),
    taskArguments: taskAction?.arguments === expectedTaskArguments,
    shortcuts: Object.values(shortcutChecks).every(Boolean),
    ordinaryAlacrittyConfig: !manifest.alacritty || ordinaryHash === manifest.alacritty.ordinarySha256,
    protectedAlacrittyConfig: !manifest.alacritty || protectedConfigHash === manifest.alacritty.protectedSha256,
    alacrittyBackup: !manifest.alacritty?.previousExists || backupHash === manifest.alacritty.previousSha256,
    credentialPresent: existsSync(credentialPath),
    graphifyCredentialPresent: existsSync(graphifyCredentialPath),
    graphifyConfigManaged: existsSync(manifest.graphify.configEdit.path) && sameHash(sha256File(manifest.graphify.configEdit.path), manifest.graphify.configEdit.managed.sha256),
    graphifyConfigBackup: existsSync(manifest.graphify.configEdit.backupPath) && sameHash(sha256File(manifest.graphify.configEdit.backupPath), manifest.graphify.configEdit.original.sha256),
    invokerPresent: !manifest.invoker || existsSync(invokePath),
    invokerHash: !manifest.invoker || (existsSync(invokePath) && sha256File(invokePath) === manifest.invoker.sha256),
  }
  return {
    schemaVersion: 1,
    operation: "rollback",
    dryRun: true,
    eligible: Object.values(checks).every(Boolean),
    checks,
    shortcutChecks,
    actions: ["stop-managed-server", "remove-managed-task", "restore-opencode-config", "restore-alacritty-config", "remove-managed-shortcuts", "remove-protected-root"],
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
  const restoredOpenCodeConfig = restoreGraphifyConfig(manifest.graphify.configEdit)
  const removedShortcuts = []
  for (const id of manifest.createdShortcutIds) {
    const shortcutPath = manifest.shortcuts[id]
    if (existsSync(shortcutPath)) {
      rmSync(shortcutPath, { force: true })
      removedShortcuts.push(id)
    }
  }
  unregisterTrayTask()
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
    restoredOpenCodeConfig,
    removedProtectedRoot: !existsSync(protectedRoot),
  }
}

async function preflight(configurationPath) {
  const configuration = loadWorkstationConfiguration(configurationPath)
  const snapshot = windowsSnapshot()
  const environment = environmentPlan(snapshot, configuration)
  const tools = toolIdentities(snapshot)
  const collisions = environment.collisions
  const opencodeConfigPath = path.join(environment.opencodeConfigDir, "opencode.json")
  let configEdit
  try {
    configEdit = await planGraphifyConfigEdit(opencodeConfigPath, configuration.graphify)
  } catch (error) {
    if (!existsSync(manifestPath)) throw error
    const manifest = loadManifest()
    if (manifest.schemaVersion !== 2) throw error
    const refreshed = await refreshManagedGraphifyConfigEdit(manifest, configuration.graphify)
    if (path.resolve(refreshed.path) !== path.resolve(opencodeConfigPath)) {
      throw new Error("Managed Graphify configuration path drifted; refusing preflight.", { cause: error })
    }
    configEdit = {
      status: "already-managed",
      source: fileIdentity(opencodeConfigPath),
      rollback: refreshed.original,
      projection: { type: "remote", url: GRAPHIFY_ENDPOINT, authorization: "Bearer {env:OPENCODE_GRAPHIFY_API_KEY}" },
    }
  }
  const collisionCount = Number(collisions.protectedRootExists) + Number(collisions.taskExists) + Number(collisions.shortcutCount > 0) + Number(collisions.portListenerCount > 0) + Number(collisions.graphifyPortListenerCount > 0)
  return {
    schemaVersion: 1,
    operation: "preflight",
    status: collisionCount === 0 ? "ready" : "collision",
    tools,
    environment,
    graphifyConfigEdit: configEdit,
    installationPlan: installationPlan(tools, environment),
  }
}

async function status() {
  const snapshot = windowsSnapshot()
  const managed = installedObservation(snapshot)
  const manifest = managed.installed ? loadManifest() : null
  const configuration = manifest?.schemaVersion === 2
    ? { source: manifest.configuration, repositories: manifest.repositories, graphify: manifest.graphify.configuration }
    : loadWorkstationConfiguration()
  const environment = environmentPlan(snapshot, configuration)
  let health = null
  if (manifest && managed.credentialPresent && snapshotListeners(snapshot).length > 0) {
    try {
      health = manifest.schemaVersion === 2
        ? (await validatedManagedHealth(manifest)).health
        : await healthProbe(readCredential())
    } catch (error) {
      const state = existsSync(statePath) ? readJson(statePath) : null
      health = {
        healthy: false,
        status: state?.status ?? "unknown",
        error: error instanceof Error ? error.message : String(error),
      }
    }
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
  if (mode === "tray-health-probe") {
    if (args.length !== 1) throw new Error("Tray health probe accepts no additional arguments.")
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
      writeJson(await preflight(invocation.configurationPath))
    } else if (operation === "status") {
      writeJson(await status())
    } else if (operation === "install") {
      writeJson(await install(invocation.configurationPath))
    } else if (operation === "start") {
      writeJson(await start())
    } else if (operation === "launch") {
      writeJson(await launch(invocation.repository))
    } else if (operation === "stop") {
      writeJson(await stop())
    } else if (operation === "restart") {
      writeJson(await restart())
    } else if (operation === "serve") {
      await serve()
    } else if (operation === "tray-health-probe") {
      process.exitCode = (await probeManagedRuntimeHealthForTray()) ? 0 : 1
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
      recordedAt: new Date().toISOString(),
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
