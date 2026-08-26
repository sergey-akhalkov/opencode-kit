import { spawnSync } from "node:child_process"
import { createHash } from "node:crypto"
import { existsSync, readFileSync, statSync, writeFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..", "..")
const sourceController = path.join(repoRoot, "tools", "windows", "opencode-workstation.ts")
const evidenceDirectory = path.dirname(fileURLToPath(import.meta.url))
const evidenceArgument = process.argv.indexOf("--evidence-path")
const evidencePath = evidenceArgument >= 0
  ? path.resolve(process.argv[evidenceArgument + 1] ?? "")
  : path.join(evidenceDirectory, "task-2-2j-tray-restart-raw.json")
if (path.dirname(evidencePath).toLowerCase() !== evidenceDirectory.toLowerCase() || existsSync(evidencePath)) {
  throw new Error("Evidence path must be a new file in the implementation-evidence directory")
}
const protectedRoot = String.raw`C:\ProgramData\OpenCodeWorkstation`
const installedController = path.join(protectedRoot, "opencode-workstation.ts")
const manifestPath = path.join(protectedRoot, "manifest.json")
const statePath = path.join(protectedRoot, "server-state.json")
const trayStatePath = path.join(protectedRoot, "tray-state.json")
const trayCommandPath = path.join(protectedRoot, "tray-command.json")
const trayScriptPath = path.join(protectedRoot, "tray.ps1")
const errorLogPath = path.join(protectedRoot, "logs", "controller-errors.log")
const credentialPaths = [path.join(protectedRoot, "server-password"), path.join(protectedRoot, "graphify-api-key")]
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
    try {
      if (probe()) return { label, ok: true, waitedMs: Date.now() - started }
    } catch {
      // Lifecycle state files are atomically replaced; retry a bounded transient read.
    }
    sleep(200)
  }
  return { label, ok: false, waitedMs: timeoutMilliseconds }
}

function taskState(taskName: string) {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const result = powershell(`$task=Get-ScheduledTask -TaskName '${taskName}' -ErrorAction Stop;[string]$task.State`)
    if (result.status === 0) return (result.stdout ?? "").trim()
    sleep(250)
  }
  throw new Error(`Failed to read task '${taskName}'`)
}

function taskInfo(taskName: string) {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const result = powershell(`$task=Get-ScheduledTask -TaskName '${taskName}' -ErrorAction Stop;$info=Get-ScheduledTaskInfo -TaskName '${taskName}' -ErrorAction Stop;[ordered]@{state=[string]$task.State;lastRunTime=$info.LastRunTime.ToString('o');lastTaskResult=[int]$info.LastTaskResult}|ConvertTo-Json -Compress`)
    if (result.status === 0) return JSON.parse((result.stdout ?? "").trim())
    sleep(250)
  }
  throw new Error(`Failed to inspect task '${taskName}'`)
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
  const normalized = String(observation.commandLine).replace(/\s+/g, " ").trim().toLowerCase()
  const expectedCommand = `"${expectedExecutable}" -nologo -noprofile -sta -windowstyle hidden -file "${trayScriptPath.toLowerCase()}"`
  if (actualExecutable !== expectedExecutable || normalized !== expectedCommand) throw new Error(`Tray process ${observation.processId} identity drifted`)
  return observation
}

function terminateValidatedTray(observation: Record<string, unknown>) {
  const processId = Number(observation.processId)
  const current = processObservation(processId)
  if (!current) return { processId, status: "already-gone" }
  if (String(current.creationDate) !== String(observation.creationDate) || path.resolve(current.executablePath).toLowerCase() !== path.resolve(String(observation.executablePath)).toLowerCase()) {
    throw new Error(`Tray PID ${processId} changed before termination`)
  }
  const result = spawnSync("taskkill.exe", ["/PID", String(processId), "/F"], { encoding: "utf8", timeout: 10_000, windowsHide: true })
  const gone = waitUntil(`tray-${processId}-gone`, 10_000, () => processObservation(processId) == null)
  if (!gone.ok) throw new Error(`Validated tray PID ${processId} remained alive`)
  return { processId, status: "stopped", taskkillStatus: result.status, stderr: (result.stderr ?? "").trim().slice(-500) }
}

function identities() {
  let state = null
  let tray = null
  try {
    state = existsSync(statePath) ? readJson(statePath) : null
    tray = existsSync(trayStatePath) ? readJson(trayStatePath) : null
  } catch {
    return { status: null, candidate: null, supervisorProcessId: null, serverRootProcessId: null, listenerProcessId: null, graphifyRootProcessId: null, graphifyListenerProcessId: null, trayColor: null }
  }
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
  const status = run([installedController, "status"], 30_000, protectedRoot)
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
  const secrets = credentialPaths.filter(existsSync).map((filePath) => readFileSync(filePath, "utf8").trim()).filter(Boolean)
  let serialized = JSON.stringify(record, null, 2)
  for (const secret of secrets) serialized = serialized.replaceAll(secret, "[redacted]")
  writeFileSync(evidencePath, `${serialized}\n`, "utf8")
}

const record: Record<string, any> = { schemaVersion: 1, startedAt: new Date().toISOString() }
let trayMutationStarted = false

try {
  sleep(15_000)
  const elevation = powershell("$principal=[Security.Principal.WindowsPrincipal]::new([Security.Principal.WindowsIdentity]::GetCurrent());$principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)")
  record.elevated = (elevation.stdout ?? "").trim() === "True"
  if (!record.elevated) throw new Error("Detached runner is not elevated")

  const manifest = readJson(manifestPath)
  record.package = {
    candidate: manifest.candidate,
    sourceController: sha256File(sourceController),
    installedController: sha256File(installedController),
    manifestController: manifest.controller.sha256,
  }
  if (record.package.sourceController !== record.package.installedController || record.package.installedController !== record.package.manifestController) {
    throw new Error("Source, installed, and manifest controller hashes differ")
  }
  record.healthyPreflight = waitUntil("healthy-preflight", 30_000, serverHealthy)
  if (!record.healthyPreflight.ok) throw new Error("Managed runtime is not healthy before tray proof")

  const currentTray = trayProcesses().map((entry) => validateTrayProcess(entry, manifest))
  if (currentTray.length !== 1) throw new Error(`Expected one exact tray host, observed ${currentTray.length}`)
  record.before = { identities: identities(), serverTask: taskInfo(serverTask), trayTask: taskInfo(trayTask), tray: currentTray }
  record.trayTaskStop = stopTask(trayTask)
  trayMutationStarted = true
  record.trayStop = terminateValidatedTray(currentTray[0])
  record.trayTaskStart = startTask(trayTask)
  record.freshTrayReady = waitUntil("fresh-tray", 30_000, () => {
    const current = trayProcesses()
    return current.length === 1 && current[0].processId !== currentTray[0].processId
  })
  if (!record.freshTrayReady.ok) throw new Error("Fresh tray did not start")
  record.freshTray = trayProcesses().map((entry) => validateTrayProcess(entry, manifest))
  record.greenBeforeRestart = waitUntil("healthy-green-before-restart", 90_000, () => identities().trayColor === "green" && serverHealthy())
  if (!record.greenBeforeRestart.ok) throw new Error("Fresh tray did not reach green health")

  const beforeRestart = identities()
  const errorBytes = statSync(errorLogPath).size
  record.beforeRestart = beforeRestart
  writeFileSync(trayCommandPath, `${JSON.stringify({ command: "restart" })}\n`, "utf8")
  record.commandWrittenAt = new Date().toISOString()
  record.restartingObserved = waitUntil("tray-restarting", 15_000, () => identities().trayColor === "restarting")
  record.restarted = waitUntil("tray-replaced-runtime", 180_000, () => {
    const current = identities()
    return current.trayColor === "green" &&
      current.supervisorProcessId !== beforeRestart.supervisorProcessId &&
      current.listenerProcessId !== beforeRestart.listenerProcessId &&
      serverHealthy()
  })
  record.afterRestart = identities()
  record.restartErrors = restartErrorsSince(errorBytes)
  record.afterTasks = { server: taskInfo(serverTask), tray: taskInfo(trayTask) }
  record.ok = record.restartingObserved.ok && record.restarted.ok && record.restartErrors.length === 0
  if (!record.ok) throw new Error("Current-candidate tray Restart oracle failed")
} catch (error) {
  record.ok = false
  record.error = error instanceof Error ? error.message : String(error)
} finally {
  if (trayMutationStarted) {
    try {
      record.restore = { before: { identities: identities(), serverTask: taskInfo(serverTask), trayTask: taskInfo(trayTask) } }
      const manifest = readJson(manifestPath)
      if (trayProcesses().length !== 1 || taskState(trayTask) !== "Running") {
        const current = trayProcesses().map((entry) => validateTrayProcess(entry, manifest))
        if (current.length > 1) throw new Error("Refusing tray recovery with multiple exact tray hosts")
        record.restore.trayTaskStop = stopTask(trayTask)
        if (current.length === 1) record.restore.trayStop = terminateValidatedTray(current[0])
        record.restore.trayTaskStart = startTask(trayTask)
        record.restore.trayReady = waitUntil("mandatory-tray-restore", 30_000, () => trayProcesses().length === 1)
      }
      if (!serverHealthy() && taskState(serverTask) !== "Running") {
        record.restore.serverStart = run([installedController, "start"], 180_000, protectedRoot)
      }
      record.restore.healthy = waitUntil("mandatory-health-restore", 180_000, serverHealthy)
      if (record.restore.healthy.ok && identities().trayColor !== "green") {
        const current = trayProcesses().map((entry) => validateTrayProcess(entry, manifest))
        if (current.length !== 1) throw new Error("Expected one exact tray host before lamp recovery")
        record.restore.lampTaskStop = stopTask(trayTask)
        record.restore.lampTrayStop = terminateValidatedTray(current[0])
        record.restore.lampTaskStart = startTask(trayTask)
      }
      record.restore.green = waitUntil("mandatory-green-restore", 90_000, () => identities().trayColor === "green" && serverHealthy())
      record.restore.after = { identities: identities(), serverTask: taskInfo(serverTask), trayTask: taskInfo(trayTask) }
    } catch (restoreError) {
      record.ok = false
      record.restoreError = restoreError instanceof Error ? restoreError.message : String(restoreError)
      record.restoreAfterFailure = { identities: identities(), serverTask: taskInfo(serverTask), trayTask: taskInfo(trayTask) }
    }
  } else {
    record.restore = { skipped: true, reason: "preflight-failed-before-mutation" }
  }
  persist(record)
}
