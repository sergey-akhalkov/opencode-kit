import { spawnSync } from "node:child_process"
import { createHash } from "node:crypto"
import { existsSync, readFileSync, statSync, writeFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..", "..")
const controller = path.join(repoRoot, "tools", "windows", "opencode-workstation.ts")
const evidenceDirectory = path.dirname(fileURLToPath(import.meta.url))
const evidenceArgument = process.argv.indexOf("--evidence-path")
const evidencePath = evidenceArgument >= 0
  ? path.resolve(process.argv[evidenceArgument + 1] ?? "")
  : path.join(evidenceDirectory, "task-3-1-raw.json")
if (path.dirname(evidencePath).toLowerCase() !== evidenceDirectory.toLowerCase() || existsSync(evidencePath)) {
  throw new Error("Evidence path must be a new file in the implementation-evidence directory")
}
const protectedRoot = String.raw`C:\ProgramData\OpenCodeWorkstation`
const installedController = path.join(protectedRoot, "opencode-workstation.ts")
const manifestPath = path.join(protectedRoot, "manifest.json")
const statePath = path.join(protectedRoot, "server-state.json")
const trayStatePath = path.join(protectedRoot, "tray-state.json")
const trayCommandPath = path.join(protectedRoot, "tray-command.json")
const errorLogPath = path.join(protectedRoot, "logs", "controller-errors.log")
const credentialPath = path.join(protectedRoot, "server-password")
const graphifyCredentialPath = path.join(protectedRoot, "graphify-api-key")
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
    try {
      if (probe()) return { label, ok: true, waitedMs: Date.now() - started }
    } catch {
      // A state file can be observed between atomic lifecycle writes; retry the bounded probe.
    }
    sleep(100)
  }
  return { label, ok: false, waitedMs: timeoutMilliseconds }
}

function processObservation(processId: number) {
  const result = powershell(`$process=Get-CimInstance Win32_Process -Filter 'ProcessId = ${processId}' -ErrorAction SilentlyContinue;if($null-eq$process){'null'}else{[ordered]@{processId=[int]$process.ProcessId;parentProcessId=[int]$process.ParentProcessId;creationDate=[string]$process.CreationDate;executablePath=[string]$process.ExecutablePath}|ConvertTo-Json -Compress}`)
  const text = (result.stdout ?? "").trim()
  return !text || text === "null" ? null : JSON.parse(text)
}

function sameProcess(expected: Record<string, unknown>, current: Record<string, unknown> | null) {
  return current != null &&
    Number(current.processId) === Number(expected.processId) &&
    Number(current.parentProcessId) === Number(expected.parentProcessId) &&
    String(current.creationDate) === String(expected.creationDate) &&
    path.resolve(String(current.executablePath)).toLowerCase() === path.resolve(String(expected.executablePath)).toLowerCase()
}

function terminateCaptured(label: string, expected: Record<string, unknown>, beforeKill?: () => void, waitForExit = true) {
  const processId = Number(expected.processId)
  const current = processObservation(processId)
  if (!current) return { label, processId, status: "already-gone" }
  if (!sameProcess(expected, current)) throw new Error(`Refusing drifted ${label} PID ${processId}`)
  beforeKill?.()
  const result = spawnSync("taskkill.exe", ["/PID", String(processId), "/F"], {
    encoding: "utf8",
    timeout: 10_000,
    windowsHide: true,
  })
  if (!waitForExit) {
    if (result.status !== 0) throw new Error(`Failed to terminate validated ${label} PID ${processId}`)
    return { label, processId, status: "termination-issued", taskkillStatus: result.status }
  }
  const gone = waitUntil(`${label}-${processId}-gone`, 10_000, () => processObservation(processId) == null)
  if (!gone.ok) throw new Error(`Validated ${label} PID ${processId} remained alive`)
  return {
    label,
    processId,
    status: "stopped",
    taskkillStatus: result.status,
    taskkillError: result.error ? String(result.error) : null,
    stderr: (result.stderr ?? "").trim().slice(-500),
  }
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

function portOwners(port: number) {
  const result = powershell(`$rows=@(Get-NetTCPConnection -LocalAddress 127.0.0.1 -LocalPort ${port} -State Listen -ErrorAction SilentlyContinue|ForEach-Object{[ordered]@{processId=[int]$_.OwningProcess;localPort=[int]$_.LocalPort}});if($rows.Count-eq 0){'[]'}else{$rows|ConvertTo-Json -Compress}`)
  const text = (result.stdout ?? "").trim()
  if (!text) return []
  const parsed = JSON.parse(text)
  return Array.isArray(parsed) ? parsed : [parsed]
}

function trayColor() {
  if (!existsSync(trayStatePath)) return null
  try {
    return readJson(trayStatePath).color ?? null
  } catch {
    return null
  }
}

function identities() {
  if (!existsSync(statePath)) return null
  try {
    const state = readJson(statePath)
    return {
      status: state.status ?? null,
      candidate: state.candidate ?? null,
      supervisorProcessId: state.supervisor?.processId ?? null,
      serverRootProcessId: state.serverRoot?.processId ?? null,
      listenerProcessId: state.listeners?.[0]?.processId ?? null,
      graphifyRootProcessId: state.graphify?.root?.processId ?? null,
      graphifyListenerProcessId: state.graphify?.listener?.processId ?? null,
      trayColor: trayColor(),
    }
  } catch {
    return null
  }
}

function serverHealthy() {
  if (identities()?.status !== "running") return false
  const status = run([installedController, "status"], 30_000, protectedRoot)
  return status.status === 0 && parseJsonOutput(status.stdout)?.health?.healthy === true
}

function restartErrorsSince(previousBytes: number) {
  if (!existsSync(errorLogPath)) return []
  const bytes = readFileSync(errorLogPath)
  const added = bytes.subarray(Math.min(previousBytes, bytes.length)).toString("utf8")
  return added.split(/\r?\n/).flatMap((line) => {
    if (!line.trim()) return []
    try {
      const entry = JSON.parse(line)
      if (entry.operation !== "restart" || entry.status !== "error") return []
      return [{
        operation: entry.operation,
        status: entry.status,
        type: entry.error?.type ?? null,
        message: entry.error?.message ?? null,
        cause: entry.error?.cause ?? null,
      }]
    } catch {
      return []
    }
  })
}

function persist(record: Record<string, unknown>) {
  record.finishedAt = new Date().toISOString()
  const secrets = [credentialPath, graphifyCredentialPath]
    .filter((filePath) => existsSync(filePath))
    .map((filePath) => readFileSync(filePath, "utf8").trim())
    .filter(Boolean)
  let serialized = JSON.stringify(record, null, 2)
  for (const secret of secrets) serialized = serialized.replaceAll(secret, "[redacted]")
  writeFileSync(evidencePath, `${serialized}\n`, "utf8")
}

const record: Record<string, any> = {
  schemaVersion: 1,
  startedAt: new Date().toISOString(),
  mechanism: "writer-owned-disposable-listener-and-installed-tray-restart",
  writer: { processId: process.pid, executablePath: process.execPath },
  installedControllerHash: sha256File(installedController),
}
let disposableServer: ReturnType<typeof Bun.serve> | null = null
let captured: Array<{ label: string; observation: Record<string, unknown> }> = []
let mutationStarted = false

try {
  sleep(15_000)
  const elevation = powershell("$principal=[Security.Principal.WindowsPrincipal]::new([Security.Principal.WindowsIdentity]::GetCurrent());$principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)")
  record.elevated = (elevation.stdout ?? "").trim() === "True"
  if (!record.elevated) throw new Error("Detached runner is not elevated")
  if (!serverHealthy()) throw new Error("Managed runtime is not healthy before unmatched-listener proof")

  const manifest = readJson(manifestPath)
  if (typeof Bun === "undefined" || typeof Bun.serve !== "function") throw new Error("Runner requires the reviewed Bun executable before host mutation")
  if (record.installedControllerHash !== manifest.controller.sha256 || record.installedControllerHash !== sha256File(controller)) {
    throw new Error("Installed, manifest, and repository controller hashes are not the same candidate")
  }
  const state = readJson(statePath)
  if (state.status !== "running" || state.candidate !== manifest.candidate) throw new Error("Managed state/candidate is not current and running")
  const labels = [
    ["listener", state.listeners?.[0]],
    ["graphifyListener", state.graphify?.listener],
    ["graphifyRoot", state.graphify?.root],
    ["serverRoot", state.serverRoot],
    ["supervisor", state.supervisor],
  ]
  captured = labels.map(([label, identity]) => {
    if (!identity?.processId) throw new Error(`Missing ${label} identity`)
    const observation = processObservation(identity.processId)
    if (!observation) throw new Error(`Missing live ${label} process`)
    if (label === "listener") {
      if (observation.parentProcessId !== state.serverRoot.processId || path.resolve(observation.executablePath).toLowerCase() !== path.resolve(identity.executablePath).toLowerCase()) {
        throw new Error("Current managed listener identity drifted")
      }
    } else if (!sameProcess(identity, observation)) {
      throw new Error(`Current managed ${label} identity drifted`)
    }
    return { label, observation }
  })
  const initialOwners = portOwners(4096)
  if (initialOwners.length !== 1 || initialOwners[0].processId !== state.listeners[0].processId) throw new Error("Initial 4096 owner is not the captured managed listener")
  record.before = {
    candidate: manifest.candidate,
    identities: identities(),
    serverTask: taskInfo(serverTask),
    trayTask: taskInfo(trayTask),
    captured,
    portOwners: { 4096: initialOwners, 4097: portOwners(4097) },
  }

  mutationStarted = true
  record.managedStop = run([installedController, "stop"], 180_000, protectedRoot)
  if (record.managedStop.status !== 0) throw new Error(`Installed managed Stop exited ${record.managedStop.status}`)
  record.managedStopped = waitUntil("managed-tree-stopped", 30_000, () => (
    taskState(serverTask) !== "Running" && portOwners(4096).length === 0 && portOwners(4097).length === 0
  ))
  if (!record.managedStopped.ok) throw new Error("Managed Stop did not release both managed ports")
  disposableServer = Bun.serve({
    hostname: "127.0.0.1",
    port: 4096,
    fetch() {
      return new Response("disposable unmatched-listener proof")
    },
  })
  record.disposableListener = {
    processId: process.pid,
    hostname: disposableServer.hostname,
    port: disposableServer.port,
    process: processObservation(process.pid),
  }
  const disposableOwners = portOwners(4096)
  if (disposableOwners.length !== 1 || disposableOwners[0].processId !== process.pid) throw new Error("Writer did not become the sole disposable 4096 owner")

  const errorBytes = statSync(errorLogPath).size
  writeFileSync(trayCommandPath, `${JSON.stringify({ command: "restart" })}\n`, "utf8")
  record.commandWrittenAt = new Date().toISOString()
  record.restartingObserved = waitUntil("tray-restarting", 15_000, () => trayColor() === "restarting")
  record.failureObserved = waitUntil("ownership-failure", 60_000, () => restartErrorsSince(errorBytes).length > 0 && trayColor() === "red")
  record.failure = {
    errors: restartErrorsSince(errorBytes),
    trayColor: trayColor(),
    portOwners: portOwners(4096),
    writerAlive: processObservation(process.pid) != null,
  }
  const errorText = JSON.stringify(record.failure.errors)
  const serverCredential = readFileSync(credentialPath, "utf8").trim()
  const graphifyCredential = readFileSync(graphifyCredentialPath, "utf8").trim()
  record.failure.credentialDisclosure = {
    server: serverCredential.length > 0 && errorText.includes(serverCredential),
    graphify: graphifyCredential.length > 0 && errorText.includes(graphifyCredential),
  }
  const ownershipDiagnostic = /listener|port owner|server state/i.test(errorText)
  record.proofPassed = record.restartingObserved.ok &&
    record.failureObserved.ok &&
    record.failure.trayColor === "red" &&
    record.failure.portOwners.length === 1 &&
    record.failure.portOwners[0].processId === process.pid &&
    record.failure.writerAlive &&
    ownershipDiagnostic &&
    !record.failure.credentialDisclosure.server &&
    !record.failure.credentialDisclosure.graphify
  if (!record.proofPassed) throw new Error("Unmatched-listener refusal or failure-signaling oracle failed")
} catch (error) {
  record.proofPassed = false
  record.error = error instanceof Error ? error.message : String(error)
} finally {
  if (!mutationStarted) {
    record.ok = false
    record.cleanup = { skipped: true, reason: "preflight failed before host mutation" }
  } else {
    try {
      record.cleanup = {
        taskStop: stopTask(serverTask),
        terminations: [],
      }
      for (const entry of captured) {
        record.cleanup.terminations.push(terminateCaptured(entry.label, entry.observation))
      }
      if (disposableServer) {
        disposableServer.stop(true)
        disposableServer = null
      }
      record.cleanup.disposableReleased = waitUntil("disposable-listener-released", 10_000, () => !portOwners(4096).some((entry) => entry.processId === process.pid))
      const portsFree = waitUntil("managed-ports-free", 30_000, () => portOwners(4096).length === 0 && portOwners(4097).length === 0)
      record.cleanup.portsFree = portsFree
      record.cleanup.portOwners = { 4096: portOwners(4096), 4097: portOwners(4097) }
      if (!portsFree.ok) throw new Error("Refusing restore while a managed port remains owned")

      const restoreErrorBytes = statSync(errorLogPath).size
      if (taskState(trayTask) !== "Running") record.cleanup.trayTaskStart = startTask(trayTask)
      writeFileSync(trayCommandPath, `${JSON.stringify({ command: "restart" })}\n`, "utf8")
      record.cleanup.restoreCommandWrittenAt = new Date().toISOString()
      record.cleanup.restored = waitUntil("healthy-green-restore", 180_000, () => trayColor() === "green" && serverHealthy())
      record.cleanup.restoreErrors = restartErrorsSince(restoreErrorBytes)
      record.cleanup.after = {
        identities: identities(),
        serverTask: taskInfo(serverTask),
        trayTask: taskInfo(trayTask),
        portOwners: { 4096: portOwners(4096), 4097: portOwners(4097) },
      }
      record.ok = record.proofPassed && record.cleanup.restored.ok && record.cleanup.restoreErrors.length === 0
    } catch (cleanupError) {
      record.ok = false
      record.cleanupError = cleanupError instanceof Error ? cleanupError.message : String(cleanupError)
      record.cleanupAfterFailure = {
        identities: identities(),
        serverTask: taskInfo(serverTask),
        trayTask: taskInfo(trayTask),
        portOwners: { 4096: portOwners(4096), 4097: portOwners(4097) },
      }
    }
  }
  persist(record)
}
