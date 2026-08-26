import { spawnSync } from "node:child_process"
import { createHash } from "node:crypto"
import { existsSync, readFileSync, statSync, writeFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..", "..")
const sourceController = path.join(repoRoot, "tools", "windows", "opencode-workstation.ts")
const evidencePath = path.join(path.dirname(fileURLToPath(import.meta.url)), "task-3-2-raw.json")
const protectedRoot = String.raw`C:\ProgramData\OpenCodeWorkstation`
const installedController = path.join(protectedRoot, "opencode-workstation.ts")
const manifestPath = path.join(protectedRoot, "manifest.json")
const statePath = path.join(protectedRoot, "server-state.json")
const trayStatePath = path.join(protectedRoot, "tray-state.json")
const errorLogPath = path.join(protectedRoot, "logs", "controller-errors.log")
const credentialPaths = [path.join(protectedRoot, "server-password"), path.join(protectedRoot, "graphify-api-key")]
const serverTask = "OpenCode Workstation Shared Server"
const trayTask = "OpenCode Workstation Tray"

function sleep(milliseconds: number) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, milliseconds)
}

function run(args: string[], timeoutMilliseconds: number, cwd = repoRoot) {
  const result = spawnSync(process.execPath, args, { cwd, encoding: "utf8", timeout: timeoutMilliseconds, windowsHide: true })
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
      // Retry transient state/task observations inside the bounded envelope.
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

function portOwners(port: number) {
  const result = powershell(`$rows=@(Get-NetTCPConnection -LocalAddress 127.0.0.1 -LocalPort ${port} -State Listen -ErrorAction SilentlyContinue|ForEach-Object{[ordered]@{processId=[int]$_.OwningProcess;localPort=[int]$_.LocalPort}});if($rows.Count-eq 0){'[]'}else{$rows|ConvertTo-Json -Compress}`)
  const text = (result.stdout ?? "").trim()
  if (!text) return []
  const parsed = JSON.parse(text)
  return Array.isArray(parsed) ? parsed : [parsed]
}

function processObservation(processId: number) {
  const result = powershell(`$process=Get-CimInstance Win32_Process -Filter 'ProcessId = ${processId}' -ErrorAction SilentlyContinue;if($null-eq$process){'null'}else{[ordered]@{processId=[int]$process.ProcessId;parentProcessId=[int]$process.ParentProcessId;creationDate=[string]$process.CreationDate;executablePath=[string]$process.ExecutablePath;commandLine=[string]$process.CommandLine}|ConvertTo-Json -Compress}`)
  const text = (result.stdout ?? "").trim()
  return !text || text === "null" ? null : JSON.parse(text)
}

function identities() {
  try {
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
  } catch {
    return { status: null, candidate: null, supervisorProcessId: null, serverRootProcessId: null, listenerProcessId: null, graphifyRootProcessId: null, graphifyListenerProcessId: null, trayColor: null }
  }
}

function serverHealthy() {
  if (identities().status !== "running") return false
  const result = run([installedController, "status"], 30_000, protectedRoot)
  return result.status === 0 && parseJsonOutput(result.stdout)?.health?.healthy === true
}

function shortcutProjection(shortcutPath: string) {
  const escaped = shortcutPath.replaceAll("'", "''")
  const result = powershell(`$shell=New-Object -ComObject WScript.Shell;$shortcut=$shell.CreateShortcut('${escaped}');[ordered]@{path='${escaped}';targetPath=[string]$shortcut.TargetPath;arguments=[string]$shortcut.Arguments;workingDirectory=[string]$shortcut.WorkingDirectory}|ConvertTo-Json -Compress`)
  if (result.status !== 0) throw new Error("Failed to inspect Desktop Restart shortcut")
  return JSON.parse((result.stdout ?? "").trim())
}

function invokeShortcut(shortcutPath: string) {
  const escaped = shortcutPath.replaceAll("'", "''")
  const result = powershell(`$process=Start-Process -FilePath '${escaped}' -PassThru -ErrorAction Stop;[ordered]@{phase='started';processId=[int]$process.Id;startedAt=(Get-Date).ToString('o')}|ConvertTo-Json -Compress;$process.WaitForExit();[ordered]@{phase='exited';processId=[int]$process.Id;exitCode=[int]$process.ExitCode;exitedAt=(Get-Date).ToString('o')}|ConvertTo-Json -Compress;exit $process.ExitCode`, 300_000)
  const lines = (result.stdout ?? "").split(/\r?\n/).map((line) => line.trim()).filter(Boolean).flatMap((line) => {
    try { return [JSON.parse(line)] } catch { return [] }
  })
  return {
    status: result.status,
    signal: result.signal,
    error: result.error ? String(result.error) : null,
    stderr: (result.stderr ?? "").trim().slice(-2_000),
    started: lines.find((entry) => entry.phase === "started") ?? null,
    exited: lines.find((entry) => entry.phase === "exited") ?? null,
  }
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
let invocationStarted = false
let invokerIdentity: Record<string, unknown> | null = null
let invokerCleanupAuthorized = false

try {
  sleep(15_000)
  const elevation = powershell("$principal=[Security.Principal.WindowsPrincipal]::new([Security.Principal.WindowsIdentity]::GetCurrent());$principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)")
  record.elevated = (elevation.stdout ?? "").trim() === "True"
  if (!record.elevated) throw new Error("Detached runner is not elevated")

  const manifest = readJson(manifestPath)
  const sourceHash = sha256File(sourceController)
  const installedHash = sha256File(installedController)
  record.package = { candidate: manifest.candidate, sourceHash, installedHash, manifestHash: manifest.controller.sha256 }
  if (sourceHash !== installedHash || installedHash !== manifest.controller.sha256) throw new Error("Source, installed, and manifest controller hashes differ")
  record.healthyPreflight = waitUntil("healthy-preflight", 30_000, serverHealthy)
  if (!record.healthyPreflight.ok) throw new Error("Managed runtime is not healthy before Desktop proof")

  const shortcutPath = manifest.shortcuts.restart
  const shortcut = shortcutProjection(shortcutPath)
  const expectedArguments = `//nologo ${path.join(protectedRoot, "invoke.vbs")} restart`
  record.shortcut = shortcut
  if (path.resolve(shortcut.targetPath).toLowerCase() !== path.resolve(manifest.task.execute).toLowerCase() ||
      shortcut.arguments !== expectedArguments ||
      path.resolve(shortcut.workingDirectory).toLowerCase() !== protectedRoot.toLowerCase()) {
    throw new Error("Desktop Restart shortcut identity drifted")
  }

  const before = identities()
  const errorBytes = statSync(errorLogPath).size
  record.before = { identities: before, serverTask: taskInfo(serverTask), trayTask: taskInfo(trayTask), ports: { 4096: portOwners(4096), 4097: portOwners(4097) } }
  invocationStarted = true
  record.invocation = invokeShortcut(shortcutPath)
  const invokerProcessId = Number(record.invocation.started?.processId)
  if (!record.invocation.exited && Number.isInteger(invokerProcessId)) {
    invokerIdentity = processObservation(invokerProcessId)
    if (invokerIdentity) {
      const expectedExecutable = path.resolve(manifest.task.execute).toLowerCase()
      const commandLine = String(invokerIdentity.commandLine).replace(/\s+/g, " ").trim()
      invokerCleanupAuthorized = path.resolve(String(invokerIdentity.executablePath)).toLowerCase() === expectedExecutable &&
        commandLine.toLowerCase().endsWith(`//nologo ${path.join(protectedRoot, "invoke.vbs")} restart`.toLowerCase())
      if (!invokerCleanupAuthorized) throw new Error("Timed-out Desktop invoker identity drifted; refusing cleanup")
    }
  }
  record.invokerAfterWait = invokerIdentity
  record.replaced = waitUntil("desktop-replaced-runtime", 180_000, () => {
    const current = identities()
    return current.supervisorProcessId !== before.supervisorProcessId && current.listenerProcessId !== before.listenerProcessId && current.trayColor === "green" && serverHealthy()
  })
  record.after = { identities: identities(), serverTask: taskInfo(serverTask), trayTask: taskInfo(trayTask), ports: { 4096: portOwners(4096), 4097: portOwners(4097) } }
  record.restartErrors = restartErrorsSince(errorBytes)
  record.ok = record.invocation.status === 0 &&
    record.invocation.exited?.exitCode === 0 &&
    invokerIdentity == null &&
    record.replaced.ok &&
    record.restartErrors.length === 0
  if (!record.ok) throw new Error("Desktop Restart replacement or invoker-dialog oracle failed")
} catch (error) {
  record.ok = false
  record.error = error instanceof Error ? error.message : String(error)
} finally {
  try {
    if (invokerIdentity && invokerCleanupAuthorized) {
      const current = processObservation(Number(invokerIdentity.processId))
      if (current && String(current.creationDate) === String(invokerIdentity.creationDate) &&
          path.resolve(current.executablePath).toLowerCase() === path.resolve(String(invokerIdentity.executablePath)).toLowerCase() &&
          String(current.commandLine) === String(invokerIdentity.commandLine)) {
        record.invokerCleanup = spawnSync("taskkill.exe", ["/PID", String(invokerIdentity.processId), "/F"], { encoding: "utf8", timeout: 10_000, windowsHide: true }).status
      }
    }
    if (invocationStarted && !serverHealthy() && taskState(serverTask) !== "Running" && portOwners(4096).length === 0 && portOwners(4097).length === 0) {
      record.restoreStart = run([installedController, "start"], 240_000, protectedRoot)
    }
    record.restore = invocationStarted
      ? waitUntil("healthy-green-after-desktop", 180_000, () => identities().trayColor === "green" && serverHealthy())
      : { label: "not-started", ok: true, waitedMs: 0 }
    record.final = { identities: identities(), serverTask: taskInfo(serverTask), trayTask: taskInfo(trayTask), ports: { 4096: portOwners(4096), 4097: portOwners(4097) } }
  } catch (restoreError) {
    record.ok = false
    record.restoreError = restoreError instanceof Error ? restoreError.message : String(restoreError)
  }
  persist(record)
}
