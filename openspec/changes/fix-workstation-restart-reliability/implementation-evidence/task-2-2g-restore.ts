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
const trayScriptPath = path.join(protectedRoot, "tray.ps1")
const errorLogPath = path.join(protectedRoot, "logs", "controller-errors.log")
const installedController = path.join(protectedRoot, "opencode-workstation.ts")
const evidenceName = "task-2-2g-raw.json"
const delayMs = 25_000

function sleep(ms: number) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms)
}

function run(args: string[], timeoutMs: number) {
  const result = spawnSync(process.execPath, args, {
    cwd: repoRoot,
    encoding: "utf8",
    windowsHide: true,
    timeout: timeoutMs,
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

function readJson(filePath: string) {
  return JSON.parse(readFileSync(filePath, "utf8"))
}

function sha256(filePath: string) {
  const result = spawnSync("certutil", ["-hashfile", filePath, "SHA256"], { encoding: "utf8", windowsHide: true })
  const line = (result.stdout ?? "").split(/\r?\n/).map((item) => item.trim()).find((item) => /^[0-9A-Fa-f]{64}$/.test(item))
  return line?.toUpperCase() ?? null
}

function processAlive(processId: number) {
  if (!Number.isInteger(processId) || processId <= 0) return false
  const result = spawnSync("tasklist.exe", ["/FI", `PID eq ${processId}`, "/FO", "CSV", "/NH"], {
    encoding: "utf8",
    windowsHide: true,
    timeout: 5_000,
  })
  return (result.stdout ?? "").includes(`"${processId}"`)
}

function identities() {
  const state = existsSync(statePath) ? readJson(statePath) : null
  const tray = existsSync(trayStatePath) ? readJson(trayStatePath) : null
  return {
    status: state?.status ?? null,
    supervisorProcessId: state?.supervisor?.processId ?? null,
    serverRootProcessId: state?.serverRoot?.processId ?? null,
    listenerProcessId: state?.listeners?.[0]?.processId ?? null,
    candidate: state?.candidate ?? null,
    trayColor: tray?.color ?? null,
    controllerSha256: existsSync(installedController) ? sha256(installedController) : null,
    trayScriptSha256: existsSync(trayScriptPath) ? sha256(trayScriptPath) : null,
    errorLogBytes: existsSync(errorLogPath) ? statSync(errorLogPath).size : 0,
  }
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
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    if (probe()) return { label, ok: true, waitedMs: timeoutMs - (deadline - Date.now()) }
    sleep(500)
  }
  return { label, ok: false, waitedMs: timeoutMs }
}

function killPid(processId: number) {
  if (!Number.isInteger(processId) || processId <= 0) return { processId, status: "absent" }
  if (!processAlive(processId)) return { processId, status: "already-gone" }
  const killed = spawnSync("taskkill.exe", ["/PID", String(processId), "/F"], {
    encoding: "utf8",
    windowsHide: true,
    timeout: 8_000,
  })
  const gone = waitUntil(`pid-${processId}-gone`, 8_000, () => !processAlive(processId))
  return {
    processId,
    status: gone.ok ? "stopped" : "still-alive",
    taskkillStatus: killed.status,
    taskkillError: killed.error ? String(killed.error) : null,
    stderr: (killed.stderr ?? "").trim().slice(-400),
  }
}

function listByCommand(pattern: string) {
  const listing = spawnSync("powershell.exe", [
    "-NoLogo",
    "-NoProfile",
    "-Command",
    `$ids = @(Get-CimInstance Win32_Process -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -and $_.CommandLine -like '${pattern}' } | ForEach-Object { [int]$_.ProcessId }); $ids -join ','`,
  ], { encoding: "utf8", windowsHide: true, timeout: 15_000 })
  return (listing.stdout ?? "").trim().split(",").map((item) => Number(item.trim())).filter((item) => Number.isInteger(item) && item > 0)
}

function portOwners(port: number) {
  const listing = spawnSync("powershell.exe", [
    "-NoLogo",
    "-NoProfile",
    "-Command",
    `$rows = @(Get-NetTCPConnection -LocalAddress 127.0.0.1 -LocalPort ${port} -State Listen -ErrorAction SilentlyContinue | ForEach-Object { $proc = Get-CimInstance Win32_Process -Filter ("ProcessId=" + $_.OwningProcess) -ErrorAction SilentlyContinue; [ordered]@{ processId = [int]$_.OwningProcess; parentProcessId = [int]($proc.ParentProcessId); name = [string]$proc.Name } }); if ($rows.Count -eq 0) { '[]' } else { $rows | ConvertTo-Json -Compress }`,
  ], { encoding: "utf8", windowsHide: true, timeout: 15_000 })
  const text = (listing.stdout ?? "").trim()
  if (!text) return []
  try {
    const parsed = JSON.parse(text)
    return Array.isArray(parsed) ? parsed : [parsed]
  } catch {
    return [{ parseError: text.slice(0, 200) }]
  }
}

function listenCount(port: number) {
  const snapshot = spawnSync("powershell.exe", [
    "-NoLogo", "-NoProfile", "-Command",
    `@(Get-NetTCPConnection -LocalAddress 127.0.0.1 -LocalPort ${port} -State Listen -ErrorAction SilentlyContinue).Count`,
  ], { encoding: "utf8", windowsHide: true, timeout: 10_000 })
  return Number((snapshot.stdout ?? "").trim())
}

function killServeWscript() {
  const ids = listByCommand("*invoke.vbs*serve*")
  return { listed: ids, kills: ids.map(killPid) }
}

function stopTrayHost() {
  const ids = [...listByCommand("*tray.ps1*"), ...listByCommand("*tray-host.vbs*")]
  return { listed: ids, kills: ids.map(killPid) }
}

function startTrayHost() {
  const start = spawnSync("powershell.exe", [
    "-NoLogo",
    "-NoProfile",
    "-Command",
    "Start-ScheduledTask -TaskName 'OpenCode Workstation Tray' -ErrorAction Stop; (Get-ScheduledTask -TaskName 'OpenCode Workstation Tray').State.ToString()",
  ], { encoding: "utf8", windowsHide: true, timeout: 30_000 })
  return {
    startStatus: start.status,
    startStdout: (start.stdout ?? "").trim(),
    startStderr: (start.stderr ?? "").trim(),
  }
}

function restartErrorsSince(previousBytes: number) {
  if (!existsSync(errorLogPath)) return []
  const text = readFileSync(errorLogPath, "utf8")
  const added = previousBytes > 0 && text.length >= previousBytes ? text.slice(previousBytes) : text
  return added
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.includes('"operation":"restart"') && line.includes('"status":"error"'))
}

function serverHealthy() {
  const status = parseStatus(run([controller, "status"], 30_000).stdout)
  return Boolean(status?.health?.healthy)
}

function persist(record: Record<string, unknown>) {
  record.finishedAt = new Date().toISOString()
  writeFileSync(path.join(evidenceDir, evidenceName), `${JSON.stringify(record, null, 2)}\n`, "utf8")
}

const record: Record<string, unknown> = {
  schemaVersion: 1,
  startedAt: new Date().toISOString(),
  delayMs,
  mechanism: "stop-tray-per-pid-collect-install-start-tray-restart-finally-restore",
  repoControllerSha256: sha256(controller),
}

try {
  sleep(delayMs)
  const before = identities()
  record.before = before

  record.trayStop = stopTrayHost()
  const ordered = [before.serverRootProcessId, before.listenerProcessId, before.supervisorProcessId]
    .filter((processId): processId is number => Number.isInteger(processId) && processId > 0)
  record.pidStops = ordered.map(killPid)
  record.serveInvoker = killServeWscript()
  const leftover = ordered.filter((processId) => processAlive(processId))
  if (leftover.length > 0) throw new Error(`validated pids still alive: ${leftover.join(",")}`)

  const owners = portOwners(4096)
  record.leftover4096 = owners
  const sameTree = owners.filter((owner: { processId?: number; parentProcessId?: number }) => {
    const processId = Number(owner.processId)
    const parentProcessId = Number(owner.parentProcessId)
    return ordered.includes(processId) || ordered.includes(parentProcessId)
  })
  record.sameTreeLeftoverKills = sameTree.map((owner: { processId?: number }) => killPid(Number(owner.processId)))

  const portGone = waitUntil("ports-gone", 20_000, () => listenCount(4096) === 0 && listenCount(4097) === 0)
  record.portGone = portGone
  record.portGoneOwners = { 4096: portOwners(4096), 4097: portOwners(4097) }
  if (!portGone.ok) throw new Error("managed ports still listening after per-pid stop")

  const install = run([controller, "install"], 90_000)
  record.install = { status: install.status, signal: install.signal, error: install.error, stdout: install.stdout, stderr: install.stderr }
  if (install.status !== 0) throw new Error(`install exited ${install.status}`)

  record.trayStart = startTrayHost()

  const start = run([controller, "start"], 90_000)
  record.start = { status: start.status, signal: start.signal, error: start.error, stdout: start.stdout, stderr: start.stderr }
  if (start.status !== 0) throw new Error(`start exited ${start.status}`)

  const healthy = waitUntil("healthy", 90_000, () => serverHealthy())
  record.healthyAfterStart = healthy
  if (!healthy.ok) throw new Error("server did not become healthy after start")

  const green = waitUntil("tray-green", 30_000, () => identities().trayColor === "green")
  record.trayGreenAfterStart = green
  record.afterStart = identities()
  const beforeRestart = identities()
  const errorLogBytes = beforeRestart.errorLogBytes

  writeFileSync(trayCommandPath, `${JSON.stringify({ command: "restart" })}\n`, "utf8")
  record.trayCommandWrittenAt = new Date().toISOString()

  const replaced = waitUntil("tray-restart", 90_000, () => {
    const now = identities()
    return now.trayColor === "green" &&
      Number.isInteger(now.supervisorProcessId) &&
      now.supervisorProcessId !== beforeRestart.supervisorProcessId &&
      now.listenerProcessId !== beforeRestart.listenerProcessId
  })
  record.trayRestart = replaced
  record.afterRestart = identities()
  record.newRestartErrors = restartErrorsSince(errorLogBytes)
  const status = parseStatus(run([controller, "status"], 30_000).stdout)
  record.statusAfterRestart = {
    healthy: Boolean(status?.health?.healthy),
    installed: Boolean(status?.installed),
    controllerHash: status?.managed?.controllerHash ?? null,
    integrity: status?.managed?.integrity ?? null,
  }
  const after = identities()
  record.ok = Boolean(
    replaced.ok &&
    record.statusAfterRestart.healthy &&
    (record.newRestartErrors as string[]).length === 0 &&
    after.controllerSha256 === record.repoControllerSha256 &&
    after.supervisorProcessId !== beforeRestart.supervisorProcessId,
  )
} catch (error) {
  record.ok = false
  record.error = error instanceof Error ? error.message : String(error)
} finally {
  if (!serverHealthy()) {
    record.restore = {
      tray: startTrayHost(),
      start: run([controller, "start"], 90_000),
    }
    record.restore.healthy = waitUntil("restore-healthy", 90_000, () => serverHealthy())
    record.restore.after = identities()
  } else {
    record.restore = { skipped: true, reason: "already-healthy" }
  }
  persist(record)
}
