import { spawnSync } from "node:child_process"
import { existsSync, readFileSync, statSync, writeFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..", "..")
const controller = path.join(repoRoot, "tools", "windows", "opencode-workstation.ts")
const evidenceDir = path.dirname(fileURLToPath(import.meta.url))
const protectedRoot = String.raw`C:\ProgramData\OpenCodeWorkstation`
const statePath = path.join(protectedRoot, "server-state.json")
const trayStatePath = path.join(protectedRoot, "tray-state.json")
const trayCommandPath = path.join(protectedRoot, "tray-command.json")
const installedController = path.join(protectedRoot, "opencode-workstation.ts")
const trayScriptPath = path.join(protectedRoot, "tray.ps1")
const errorLogPath = path.join(protectedRoot, "logs", "controller-errors.log")
const evidencePath = path.join(evidenceDir, "task-2-2h-raw.json")
const serverTask = "OpenCode Workstation Shared Server"
const trayTask = "OpenCode Workstation Tray"

function sleep(ms: number) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms)
}

function run(args: string[], timeoutMs: number) {
  const result = spawnSync(process.execPath, args, {
    cwd: repoRoot,
    encoding: "utf8",
    timeout: timeoutMs,
    windowsHide: true,
  })
  return {
    args,
    status: result.status,
    signal: result.signal,
    error: result.error ? String(result.error) : null,
    stdout: (result.stdout ?? "").slice(-8_000),
    stderr: (result.stderr ?? "").slice(-4_000),
  }
}

function powershell(command: string, timeoutMs = 30_000) {
  return spawnSync("powershell.exe", ["-NoLogo", "-NoProfile", "-NonInteractive", "-Command", command], {
    encoding: "utf8",
    timeout: timeoutMs,
    windowsHide: true,
  })
}

function readJson(filePath: string) {
  return JSON.parse(readFileSync(filePath, "utf8"))
}

function sha256Text(value: string) {
  return new Bun.CryptoHasher("sha256").update(value).digest("hex")
}

function sha256File(filePath: string) {
  return new Bun.CryptoHasher("sha256").update(readFileSync(filePath)).digest("hex").toUpperCase()
}

function parseStatus(text: string) {
  const start = text.indexOf("{")
  if (start < 0) return null
  try {
    return JSON.parse(text.slice(start))
  } catch {
    return null
  }
}

function waitUntil(label: string, timeoutMs: number, probe: () => boolean) {
  const started = Date.now()
  const deadline = started + timeoutMs
  while (Date.now() < deadline) {
    if (probe()) return { label, ok: true, waitedMs: Date.now() - started }
    sleep(500)
  }
  return { label, ok: false, waitedMs: timeoutMs }
}

function processObservation(processId: number) {
  const result = powershell(`$p=Get-CimInstance Win32_Process -Filter 'ProcessId = ${processId}' -ErrorAction SilentlyContinue;if($null -eq $p){'null'}else{[ordered]@{processId=[int]$p.ProcessId;parentProcessId=[int]$p.ParentProcessId;creationDate=[string]$p.CreationDate;executablePath=[string]$p.ExecutablePath;commandLine=[string]$p.CommandLine}|ConvertTo-Json -Compress}`)
  const text = (result.stdout ?? "").trim()
  return !text || text === "null" ? null : JSON.parse(text)
}

function validateProcess(label: string, expected: Record<string, unknown>) {
  const processId = Number(expected.processId)
  const observed = processObservation(processId)
  if (!observed) throw new Error(`${label} process ${processId} is absent before identity validation`)
  if (Number(expected.parentProcessId) !== observed.parentProcessId) throw new Error(`${label} parent identity drifted`)
  if (String(expected.creationDate) !== observed.creationDate) throw new Error(`${label} creation identity drifted`)
  if (path.resolve(String(expected.executablePath)).toLowerCase() !== path.resolve(observed.executablePath).toLowerCase()) {
    throw new Error(`${label} executable identity drifted`)
  }
  if (String(expected.commandLineSha256).toLowerCase() !== sha256Text(observed.commandLine).toLowerCase()) {
    throw new Error(`${label} command identity drifted`)
  }
  return observed
}

function portOwners(port: number) {
  const result = powershell(`$rows=@(Get-NetTCPConnection -LocalAddress 127.0.0.1 -LocalPort ${port} -State Listen -ErrorAction SilentlyContinue|ForEach-Object{$p=Get-CimInstance Win32_Process -Filter ('ProcessId = '+$_.OwningProcess) -ErrorAction SilentlyContinue;[ordered]@{processId=[int]$_.OwningProcess;parentProcessId=if($null-eq$p){0}else{[int]$p.ParentProcessId};name=if($null-eq$p){''}else{[string]$p.Name};commandLine=if($null-eq$p){''}else{[string]$p.CommandLine}}});if($rows.Count-eq 0){'[]'}else{$rows|ConvertTo-Json -Compress}`)
  const text = (result.stdout ?? "").trim()
  if (!text) return []
  const parsed = JSON.parse(text)
  return Array.isArray(parsed) ? parsed : [parsed]
}

function validateListener(label: string, expected: Record<string, unknown>, parentProcessId: number, port: number, commandPattern: RegExp) {
  const processId = Number(expected.processId)
  const owner = portOwners(port).find((row) => Number(row.processId) === processId)
  if (!owner) throw new Error(`${label} process ${processId} does not own port ${port}`)
  const observed = processObservation(processId)
  if (!observed || observed.parentProcessId !== parentProcessId || !commandPattern.test(observed.commandLine)) {
    throw new Error(`${label} live identity drifted`)
  }
  return observed
}

function taskState(taskName: string) {
  const result = powershell(`$t=Get-ScheduledTask -TaskName '${taskName}' -ErrorAction Stop;[string]$t.State`)
  return (result.stdout ?? "").trim()
}

function stopTask(taskName: string) {
  const result = powershell(`$t=Get-ScheduledTask -TaskName '${taskName}' -ErrorAction Stop;if([string]$t.State-eq'Running'){Stop-ScheduledTask -TaskName '${taskName}' -ErrorAction Stop};[string](Get-ScheduledTask -TaskName '${taskName}').State`)
  return { status: result.status, stdout: (result.stdout ?? "").trim(), stderr: (result.stderr ?? "").trim() }
}

function startTask(taskName: string) {
  const result = powershell(`Start-ScheduledTask -TaskName '${taskName}' -ErrorAction Stop;[string](Get-ScheduledTask -TaskName '${taskName}').State`)
  return { status: result.status, stdout: (result.stdout ?? "").trim(), stderr: (result.stderr ?? "").trim() }
}

function killPid(processId: number) {
  const before = processObservation(processId)
  if (!before) return { processId, status: "already-gone" }
  const result = spawnSync("taskkill.exe", ["/PID", String(processId), "/F"], {
    encoding: "utf8",
    timeout: 10_000,
    windowsHide: true,
  })
  const gone = waitUntil(`pid-${processId}-gone`, 10_000, () => processObservation(processId) == null)
  return {
    processId,
    status: gone.ok ? "stopped" : "still-alive",
    taskkillStatus: result.status,
    taskkillError: result.error ? String(result.error) : null,
    stderr: (result.stderr ?? "").trim().slice(-400),
  }
}

function identities() {
  const state = existsSync(statePath) ? readJson(statePath) : null
  const tray = existsSync(trayStatePath) ? readJson(trayStatePath) : null
  return {
    status: state?.status ?? null,
    supervisorProcessId: state?.supervisor?.processId ?? null,
    serverRootProcessId: state?.serverRoot?.processId ?? null,
    listenerProcessId: state?.listeners?.[0]?.processId ?? null,
    graphifyRootProcessId: state?.graphify?.root?.processId ?? null,
    graphifyListenerProcessId: state?.graphify?.listener?.processId ?? null,
    candidate: state?.candidate ?? null,
    trayColor: tray?.color ?? null,
    controllerSha256: existsSync(installedController) ? sha256File(installedController) : null,
    trayScriptSha256: existsSync(trayScriptPath) ? sha256File(trayScriptPath) : null,
    errorLogBytes: existsSync(errorLogPath) ? statSync(errorLogPath).size : 0,
  }
}

function serverHealthy() {
  const result = run([controller, "status"], 30_000)
  return result.status === 0 && Boolean(parseStatus(result.stdout)?.health?.healthy)
}

function restartErrorsSince(previousBytes: number) {
  if (!existsSync(errorLogPath)) return []
  const text = readFileSync(errorLogPath, "utf8")
  const added = previousBytes > 0 && text.length >= previousBytes ? text.slice(previousBytes) : text
  return added.split(/\r?\n/).map((line) => line.trim()).filter((line) => line.includes('"operation":"restart"') && line.includes('"status":"error"'))
}

function persist(record: Record<string, unknown>) {
  record.finishedAt = new Date().toISOString()
  writeFileSync(evidencePath, `${JSON.stringify(record, null, 2)}\n`, "utf8")
}

const record: Record<string, unknown> = {
  schemaVersion: 1,
  startedAt: new Date().toISOString(),
  mechanism: "stop-scheduled-task-then-validated-identities-install-start-one-tray-restart",
  repoControllerSha256: sha256File(controller),
}

try {
  sleep(15_000)
  const initialStatus = run([controller, "status"], 30_000)
  const initialPayload = parseStatus(initialStatus.stdout)
  if (initialStatus.status !== 0 || initialPayload?.health?.healthy !== true) throw new Error("initial installed status is not healthy")
  const state = readJson(statePath)
  const before = identities()
  record.before = before
  const supervisor = validateProcess("supervisor", state.supervisor)
  const serverRoot = validateProcess("serverRoot", state.serverRoot)
  if (serverRoot.parentProcessId !== supervisor.processId) throw new Error("serverRoot is not owned by the validated supervisor")
  const listener = validateListener("OpenCode listener", state.listeners[0], serverRoot.processId, 4096, /opencode.*serve/i)
  const graphifyRoot = validateProcess("Graphify root", state.graphify.root)
  if (graphifyRoot.parentProcessId !== supervisor.processId) throw new Error("Graphify root is not owned by the validated supervisor")
  const graphifyListener = validateProcess("Graphify listener", state.graphify.listener)
  validateListener("Graphify listener", state.graphify.listener, graphifyRoot.processId, 4097, /graphify\.serve/i)
  record.validated = {
    supervisor: supervisor.processId,
    serverRoot: serverRoot.processId,
    listener: listener.processId,
    graphifyRoot: graphifyRoot.processId,
    graphifyListener: graphifyListener.processId,
  }

  record.trayTaskStop = stopTask(trayTask)
  record.serverTaskStop = stopTask(serverTask)
  record.serverTaskReady = waitUntil("server-task-not-running", 30_000, () => taskState(serverTask) !== "Running")
  if (!(record.serverTaskReady as { ok: boolean }).ok) throw new Error("server scheduled task remained Running")

  const ordered = [serverRoot.processId, listener.processId, graphifyRoot.processId, graphifyListener.processId, supervisor.processId]
  record.pidStops = ordered.map(killPid)
  const remaining = ordered.filter((processId) => processObservation(processId) != null)
  if (remaining.length > 0) throw new Error(`validated processes still alive: ${remaining.join(",")}`)

  const liveOwners = [...portOwners(4096), ...portOwners(4097)].filter((owner) => processObservation(Number(owner.processId)) != null)
  const sameTree = liveOwners.filter((owner) => ordered.includes(Number(owner.processId)) || ordered.includes(Number(owner.parentProcessId)))
  record.sameTreeLeftoverStops = sameTree.map((owner) => killPid(Number(owner.processId)))
  const unmatched = liveOwners.filter((owner) => !sameTree.includes(owner))
  if (unmatched.length > 0) throw new Error(`unmatched managed-port owners remain: ${unmatched.map((owner) => owner.processId).join(",")}`)

  record.portsGone = waitUntil("raw-managed-port-rows-gone", 90_000, () => portOwners(4096).length === 0 && portOwners(4097).length === 0)
  record.portOwnersAfterStop = { 4096: portOwners(4096), 4097: portOwners(4097) }
  if (!(record.portsGone as { ok: boolean }).ok) throw new Error("managed port rows remained after task-first validated stop")

  const install = run([controller, "install"], 120_000)
  record.install = { status: install.status, signal: install.signal, error: install.error, stdout: install.stdout, stderr: install.stderr }
  if (install.status !== 0) throw new Error(`install exited ${install.status}`)

  record.trayTaskStart = startTask(trayTask)
  const start = run([controller, "start"], 120_000)
  record.start = { status: start.status, signal: start.signal, error: start.error, stdout: start.stdout, stderr: start.stderr }
  if (start.status !== 0) throw new Error(`start exited ${start.status}`)
  record.healthyAfterStart = waitUntil("healthy-after-start", 90_000, serverHealthy)
  if (!(record.healthyAfterStart as { ok: boolean }).ok) throw new Error("server did not become healthy after repaired start")
  record.greenAfterStart = waitUntil("tray-green-after-start", 30_000, () => identities().trayColor === "green")

  const beforeRestart = identities()
  writeFileSync(trayCommandPath, `${JSON.stringify({ command: "restart" })}\n`, "utf8")
  record.trayCommandWrittenAt = new Date().toISOString()
  record.trayRestart = waitUntil("one-tray-restart", 120_000, () => {
    const current = identities()
    return current.trayColor === "green" && current.supervisorProcessId !== beforeRestart.supervisorProcessId && current.listenerProcessId !== beforeRestart.listenerProcessId && serverHealthy()
  })
  record.afterRestart = identities()
  record.newRestartErrors = restartErrorsSince(beforeRestart.errorLogBytes)
  record.ok = Boolean(
    (record.trayRestart as { ok: boolean }).ok &&
    (record.newRestartErrors as string[]).length === 0 &&
    (record.afterRestart as { controllerSha256: string }).controllerSha256 === record.repoControllerSha256 &&
    serverHealthy(),
  )
} catch (error) {
  record.ok = false
  record.error = error instanceof Error ? error.message : String(error)
} finally {
  if (!serverHealthy()) {
    record.restore = {
      tray: startTask(trayTask),
      serverTaskStateBefore: taskState(serverTask),
      start: run([controller, "start"], 120_000),
    }
    ;(record.restore as Record<string, unknown>).healthy = waitUntil("restore-healthy", 120_000, serverHealthy)
    ;(record.restore as Record<string, unknown>).after = identities()
  } else {
    record.restore = { skipped: true, reason: "already-healthy" }
  }
  persist(record)
}
