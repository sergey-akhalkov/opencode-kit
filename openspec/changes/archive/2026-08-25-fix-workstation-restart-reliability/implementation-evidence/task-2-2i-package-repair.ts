import { spawnSync } from "node:child_process"
import { createHash } from "node:crypto"
import { existsSync, readFileSync, statSync, writeFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..", "..")
const controller = path.join(repoRoot, "tools", "windows", "opencode-workstation.ts")
const evidencePath = path.join(path.dirname(fileURLToPath(import.meta.url)), "task-2-2i-raw.json")
const protectedRoot = String.raw`C:\ProgramData\OpenCodeWorkstation`
const installedController = path.join(protectedRoot, "opencode-workstation.ts")
const installedSharedTools = path.join(protectedRoot, "opencode-shared-tools.ts")
const installedConfigurationModule = path.join(protectedRoot, "opencode-workstation-config.ts")
const manifestPath = path.join(protectedRoot, "manifest.json")
const statePath = path.join(protectedRoot, "server-state.json")
const trayStatePath = path.join(protectedRoot, "tray-state.json")
const trayCommandPath = path.join(protectedRoot, "tray-command.json")
const trayScriptPath = path.join(protectedRoot, "tray.ps1")
const errorLogPath = path.join(protectedRoot, "logs", "controller-errors.log")
const serverTask = "OpenCode Workstation Shared Server"
const trayTask = "OpenCode Workstation Tray"

function sleep(milliseconds: number) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, milliseconds)
}

function run(args: string[], timeoutMilliseconds: number, cwd = repoRoot) {
  const result = spawnSync(process.execPath, args, {
    cwd,
    encoding: "utf8",
    timeout: timeoutMilliseconds,
    windowsHide: true,
  })
  return {
    args,
    status: result.status,
    signal: result.signal,
    error: result.error ? String(result.error) : null,
    stdout: (result.stdout ?? "").slice(-12_000),
    stderr: (result.stderr ?? "").slice(-8_000),
  }
}

function powershell(command: string, timeoutMilliseconds = 30_000) {
  return spawnSync("powershell.exe", ["-NoLogo", "-NoProfile", "-NonInteractive", "-Command", command], {
    encoding: "utf8",
    timeout: timeoutMilliseconds,
    windowsHide: true,
  })
}

function readJson(filePath: string) {
  return JSON.parse(readFileSync(filePath, "utf8"))
}

function sha256File(filePath: string) {
  return createHash("sha256").update(readFileSync(filePath)).digest("hex").toUpperCase()
}

function parseJsonOutput(text: string) {
  const start = text.indexOf("{")
  if (start < 0) return null
  try {
    return JSON.parse(text.slice(start))
  } catch {
    return null
  }
}

function waitUntil(label: string, timeoutMilliseconds: number, probe: () => boolean) {
  const started = Date.now()
  const deadline = started + timeoutMilliseconds
  while (Date.now() < deadline) {
    if (probe()) return { label, ok: true, waitedMs: Date.now() - started }
    sleep(250)
  }
  return { label, ok: false, waitedMs: timeoutMilliseconds }
}

function taskState(taskName: string) {
  const result = powershell(`$task=Get-ScheduledTask -TaskName '${taskName}' -ErrorAction Stop;[string]$task.State`)
  if (result.status !== 0) throw new Error(`Failed to read scheduled task '${taskName}': ${(result.stderr ?? "").trim()}`)
  return (result.stdout ?? "").trim()
}

function taskInfo(taskName: string) {
  const result = powershell(`$task=Get-ScheduledTask -TaskName '${taskName}' -ErrorAction Stop;$info=Get-ScheduledTaskInfo -TaskName '${taskName}' -ErrorAction Stop;[ordered]@{state=[string]$task.State;lastRunTime=$info.LastRunTime.ToString('o');lastTaskResult=[int]$info.LastTaskResult}|ConvertTo-Json -Compress`)
  if (result.status !== 0) throw new Error(`Failed to inspect scheduled task '${taskName}': ${(result.stderr ?? "").trim()}`)
  return JSON.parse((result.stdout ?? "").trim())
}

function stopTask(taskName: string) {
  const result = powershell(`$task=Get-ScheduledTask -TaskName '${taskName}' -ErrorAction Stop;if([string]$task.State-eq'Running'){Stop-ScheduledTask -TaskName '${taskName}' -ErrorAction Stop};[string](Get-ScheduledTask -TaskName '${taskName}').State`)
  return { status: result.status, stdout: (result.stdout ?? "").trim(), stderr: (result.stderr ?? "").trim() }
}

function startTask(taskName: string) {
  const result = powershell(`Start-ScheduledTask -TaskName '${taskName}' -ErrorAction Stop;[string](Get-ScheduledTask -TaskName '${taskName}').State`)
  return { status: result.status, stdout: (result.stdout ?? "").trim(), stderr: (result.stderr ?? "").trim() }
}

function processObservation(processId: number) {
  const result = powershell(`$process=Get-CimInstance Win32_Process -Filter 'ProcessId = ${processId}' -ErrorAction SilentlyContinue;if($null-eq$process){'null'}else{[ordered]@{processId=[int]$process.ProcessId;parentProcessId=[int]$process.ParentProcessId;creationDate=[string]$process.CreationDate;executablePath=[string]$process.ExecutablePath;commandLine=[string]$process.CommandLine}|ConvertTo-Json -Compress}`)
  const text = (result.stdout ?? "").trim()
  return !text || text === "null" ? null : JSON.parse(text)
}

function trayProcesses() {
  const result = powershell("$rows=@(Get-CimInstance Win32_Process -Filter \"Name = 'pwsh.exe'\" -ErrorAction SilentlyContinue|ForEach-Object{[ordered]@{processId=[int]$_.ProcessId;parentProcessId=[int]$_.ParentProcessId;creationDate=[string]$_.CreationDate;executablePath=[string]$_.ExecutablePath;commandLine=[string]$_.CommandLine}});if($rows.Count-eq 0){'[]'}else{$rows|ConvertTo-Json -Compress}")
  const text = (result.stdout ?? "").trim()
  if (!text) return []
  const parsed = JSON.parse(text)
  return (Array.isArray(parsed) ? parsed : [parsed]).filter((entry) => /-File\s+"?C:\\ProgramData\\OpenCodeWorkstation\\tray\.ps1"?\s*$/i.test(entry.commandLine))
}

function validateTrayProcess(observation: Record<string, unknown>, manifest: Record<string, any>) {
  const expectedExecutable = path.resolve(manifest.tools.powershell.executable.path).toLowerCase()
  const actualExecutable = path.resolve(String(observation.executablePath)).toLowerCase()
  if (actualExecutable !== expectedExecutable) throw new Error(`Tray process ${observation.processId} executable identity drifted`)
  const normalized = String(observation.commandLine).replace(/\s+/g, " ").trim().toLowerCase()
  const expected = `"${expectedExecutable}" -nologo -noprofile -sta -windowstyle hidden -file "${trayScriptPath.toLowerCase()}"`
  if (normalized !== expected) throw new Error(`Tray process ${observation.processId} command identity drifted`)
  return observation
}

function terminateValidatedProcess(observation: Record<string, unknown>) {
  const processId = Number(observation.processId)
  const current = processObservation(processId)
  if (!current) return { processId, status: "already-gone" }
  if (String(current.creationDate) !== String(observation.creationDate) || path.resolve(current.executablePath).toLowerCase() !== path.resolve(String(observation.executablePath)).toLowerCase()) {
    throw new Error(`Tray process ${processId} identity changed before termination`)
  }
  const result = spawnSync("taskkill.exe", ["/PID", String(processId), "/F"], {
    encoding: "utf8",
    timeout: 10_000,
    windowsHide: true,
  })
  const gone = waitUntil(`tray-${processId}-gone`, 10_000, () => processObservation(processId) == null)
  if (!gone.ok) throw new Error(`Validated tray process ${processId} remained alive`)
  return {
    processId,
    status: "stopped",
    taskkillStatus: result.status,
    taskkillError: result.error ? String(result.error) : null,
    stderr: (result.stderr ?? "").trim().slice(-500),
  }
}

function portOwners(port: number) {
  const result = powershell(`$rows=@(Get-NetTCPConnection -LocalAddress 127.0.0.1 -LocalPort ${port} -State Listen -ErrorAction SilentlyContinue|ForEach-Object{[ordered]@{processId=[int]$_.OwningProcess;localPort=[int]$_.LocalPort}});if($rows.Count-eq 0){'[]'}else{$rows|ConvertTo-Json -Compress}`)
  const text = (result.stdout ?? "").trim()
  if (!text) return []
  const parsed = JSON.parse(text)
  return Array.isArray(parsed) ? parsed : [parsed]
}

function identities() {
  const state = existsSync(statePath) ? readJson(statePath) : null
  const tray = existsSync(trayStatePath) ? readJson(trayStatePath) : null
  return {
    status: state?.status ?? null,
    candidate: state?.candidate ?? null,
    supervisorProcessId: state?.supervisor?.processId ?? null,
    serverRootProcessId: state?.serverRoot?.processId ?? null,
    listenerProcessId: state?.listeners?.[0]?.processId ?? null,
    graphifyRootProcessId: state?.graphify?.root?.processId ?? null,
    graphifyListenerProcessId: state?.graphify?.listener?.processId ?? null,
    trayColor: tray?.color ?? null,
  }
}

function serverHealthy() {
  if (identities().status !== "running") return false
  const status = run([controller, "status"], 30_000)
  return status.status === 0 && parseJsonOutput(status.stdout)?.health?.healthy === true
}

function restartErrorsSince(previousBytes: number) {
  if (!existsSync(errorLogPath)) return []
  const bytes = readFileSync(errorLogPath)
  const added = bytes.subarray(Math.min(previousBytes, bytes.length)).toString("utf8")
  return added.split(/\r?\n/).map((line) => line.trim()).filter((line) => line.includes('"operation":"restart"') && line.includes('"status":"error"'))
}

function persist(record: Record<string, unknown>) {
  record.finishedAt = new Date().toISOString()
  writeFileSync(evidencePath, `${JSON.stringify(record, null, 2)}\n`, "utf8")
}

const record: Record<string, any> = {
  schemaVersion: 1,
  startedAt: new Date().toISOString(),
  mechanism: "repair-complete-static-module-set-then-single-tray-start-and-restart",
  sourceHashes: {
    controller: sha256File(controller),
    sharedTools: sha256File(path.join(repoRoot, "tools", "windows", "opencode-shared-tools.ts")),
    configurationModule: sha256File(path.join(repoRoot, "tools", "windows", "opencode-workstation-config.ts")),
  },
}

try {
  sleep(15_000)
  const elevation = powershell("$principal=[Security.Principal.WindowsPrincipal]::new([Security.Principal.WindowsIdentity]::GetCurrent());$principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)")
  record.elevated = (elevation.stdout ?? "").trim() === "True"
  if (!record.elevated) throw new Error("Detached runner is not elevated")

  record.before = {
    serverTask: taskInfo(serverTask),
    trayTask: taskInfo(trayTask),
    identities: identities(),
    portOwners: { 4096: portOwners(4096), 4097: portOwners(4097) },
    manifestCandidate: readJson(manifestPath).candidate,
    errorLogBytes: existsSync(errorLogPath) ? statSync(errorLogPath).size : 0,
  }
  if (record.before.portOwners[4096].length > 0 || record.before.portOwners[4097].length > 0) {
    throw new Error("Managed ports are not free before package repair")
  }

  const manifestBefore = readJson(manifestPath)
  const staleTray = trayProcesses().map((entry) => validateTrayProcess(entry, manifestBefore))
  if (staleTray.length > 1) throw new Error(`Expected at most one validated tray process, observed ${staleTray.length}`)
  record.staleTray = staleTray
  record.trayTaskStop = stopTask(trayTask)
  record.serverTaskStop = stopTask(serverTask)
  record.trayProcessStop = staleTray.length === 1 ? terminateValidatedProcess(staleTray[0]) : { status: "absent" }
  if (!waitUntil("tasks-ready", 30_000, () => taskState(trayTask) !== "Running" && taskState(serverTask) !== "Running").ok) {
    throw new Error("Scheduled tasks did not become non-running before repair")
  }
  if (trayProcesses().length > 0) throw new Error("Validated stale tray host remained after termination")

  const install = run([controller, "install"], 120_000)
  record.install = install
  if (install.status !== 0) throw new Error(`install exited ${install.status}`)

  const manifestAfterInstall = readJson(manifestPath)
  record.installedPackage = {
    candidate: manifestAfterInstall.candidate,
    controller: { manifest: manifestAfterInstall.controller.sha256, actual: sha256File(installedController) },
    sharedTools: { manifest: manifestAfterInstall.sharedTools.sha256, actual: sha256File(installedSharedTools) },
    configurationModule: { manifest: manifestAfterInstall.configurationModule.sha256, actual: sha256File(installedConfigurationModule) },
  }
  for (const [label, identity] of Object.entries(record.installedPackage).filter(([label]) => label !== "candidate")) {
    if ((identity as { manifest: string; actual: string }).manifest !== (identity as { manifest: string; actual: string }).actual) {
      throw new Error(`Installed ${label} hash does not match manifest`)
    }
  }

  record.installedHelp = run([installedController, "--help"], 30_000, protectedRoot)
  if (record.installedHelp.status !== 0 || !record.installedHelp.stdout.includes("restart") || !record.installedHelp.stdout.includes("stop")) {
    throw new Error(`installed --help exited ${record.installedHelp.status}`)
  }

  const staleTrayProcessId = staleTray[0]?.processId ?? null
  record.trayTaskStart = startTask(trayTask)
  record.freshTrayReady = waitUntil("fresh-tray-ready", 30_000, () => {
    const current = trayProcesses()
    return current.length === 1 && current[0].processId !== staleTrayProcessId
  })
  if (!record.freshTrayReady.ok) throw new Error("Fresh tray host did not start")
  record.freshTray = trayProcesses().map((entry) => validateTrayProcess(entry, manifestAfterInstall))

  record.initialHealthy = waitUntil("tray-started-server-healthy", 180_000, serverHealthy)
  if (!record.initialHealthy.ok) throw new Error("Fresh tray did not restore a healthy server")
  record.initialGreen = waitUntil("tray-green-before-restart", 30_000, () => identities().trayColor === "green")
  if (!record.initialGreen.ok) throw new Error("Fresh tray did not report green before Restart")

  const beforeRestart = identities()
  const restartErrorBytes = statSync(errorLogPath).size
  record.beforeRestart = beforeRestart
  writeFileSync(trayCommandPath, `${JSON.stringify({ command: "restart" })}\n`, "utf8")
  record.trayCommandWrittenAt = new Date().toISOString()
  record.restartingObserved = waitUntil("tray-restarting-observed", 15_000, () => identities().trayColor === "restarting")
  record.trayRestart = waitUntil("one-tray-restart", 180_000, () => {
    const current = identities()
    return current.trayColor === "green" &&
      current.supervisorProcessId !== beforeRestart.supervisorProcessId &&
      current.listenerProcessId !== beforeRestart.listenerProcessId &&
      serverHealthy()
  })
  record.afterRestart = identities()
  record.restartErrors = restartErrorsSince(restartErrorBytes)
  record.afterTasks = { server: taskInfo(serverTask), tray: taskInfo(trayTask) }
  record.ok = record.restartingObserved.ok && record.trayRestart.ok && record.restartErrors.length === 0
  if (!record.ok) throw new Error("One tray Restart did not satisfy replacement, green-lamp, and error-log oracles")
} catch (error) {
  record.ok = false
  record.error = error instanceof Error ? error.message : String(error)
} finally {
  if (!serverHealthy()) {
    record.restore = {
      before: {
        serverTask: taskInfo(serverTask),
        trayTask: taskInfo(trayTask),
        portOwners: { 4096: portOwners(4096), 4097: portOwners(4097) },
      },
    }
    if (trayProcesses().length === 0) record.restore.trayTaskStart = startTask(trayTask)
    if (taskState(serverTask) !== "Running" && portOwners(4096).length === 0 && portOwners(4097).length === 0) {
      record.restore.start = run([controller, "start"], 180_000)
    }
    record.restore.healthy = waitUntil("mandatory-restore-healthy", 180_000, serverHealthy)
    record.restore.after = {
      identities: identities(),
      serverTask: taskInfo(serverTask),
      trayTask: taskInfo(trayTask),
      portOwners: { 4096: portOwners(4096), 4097: portOwners(4097) },
    }
  } else {
    record.restore = { skipped: true, reason: "already-healthy" }
  }
  persist(record)
}
