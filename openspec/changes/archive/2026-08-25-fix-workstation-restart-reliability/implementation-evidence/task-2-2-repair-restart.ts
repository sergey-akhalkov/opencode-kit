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
const errorLogPath = path.join(protectedRoot, "logs", "controller-errors.log")
const installedController = path.join(protectedRoot, "opencode-workstation.ts")
const delayMs = 30_000
const evidenceName = "task-2-2b-raw.json"

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

function startTrayTask() {
  return spawnSync("powershell.exe", [
    "-NoLogo",
    "-NoProfile",
    "-Command",
    "Start-ScheduledTask -TaskName 'OpenCode Workstation Tray' -ErrorAction Stop; (Get-ScheduledTask -TaskName 'OpenCode Workstation Tray').State.ToString()",
  ], { encoding: "utf8", windowsHide: true, timeout: 30_000 })
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

const record: Record<string, unknown> = {
  schemaVersion: 1,
  startedAt: new Date().toISOString(),
  delayMs,
}

try {
  sleep(delayMs)
  record.before = identities()
  const stop = run([controller, "stop"], 45_000)
  record.stop = { status: stop.status, signal: stop.signal, error: stop.error, stdout: stop.stdout, stderr: stop.stderr }
  if (stop.status !== 0) throw new Error(`stop exited ${stop.status}`)

  const portGone = waitUntil("port-gone", 20_000, () => {
    const snapshot = spawnSync("powershell.exe", [
      "-NoLogo", "-NoProfile", "-Command",
      "@(Get-NetTCPConnection -LocalAddress 127.0.0.1 -LocalPort 4096 -State Listen -ErrorAction SilentlyContinue).Count",
    ], { encoding: "utf8", windowsHide: true, timeout: 10_000 })
    return Number((snapshot.stdout ?? "").trim()) === 0
  })
  record.portGone = portGone
  if (!portGone.ok) throw new Error("port 4096 still listening after stop")

  const install = run([controller, "install"], 90_000)
  record.install = { status: install.status, signal: install.signal, error: install.error, stdout: install.stdout, stderr: install.stderr }
  if (install.status !== 0) throw new Error(`install exited ${install.status}`)

  const start = run([controller, "start"], 90_000)
  record.start = { status: start.status, signal: start.signal, error: start.error, stdout: start.stdout, stderr: start.stderr }
  if (start.status !== 0) throw new Error(`start exited ${start.status}`)

  const trayStart = startTrayTask()
  record.trayStart = { status: trayStart.status, stdout: (trayStart.stdout ?? "").trim(), stderr: (trayStart.stderr ?? "").trim() }

  const healthy = waitUntil("healthy", 90_000, () => {
    const status = parseStatus(run([controller, "status"], 30_000).stdout)
    return Boolean(status?.health?.healthy)
  })
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
  record.ok = Boolean(
    replaced.ok &&
    record.statusAfterRestart.healthy &&
    (record.newRestartErrors as string[]).length === 0 &&
    record.statusAfterRestart.controllerHash &&
    record.statusAfterRestart.controllerHash !== "2035F30776BB6E4D566B852CDAC902B94E7F598F796E57AB50BE3AE05C4BD3E6",
  )
} catch (error) {
  record.ok = false
  record.error = error instanceof Error ? error.message : String(error)
} finally {
  try {
    const status = parseStatus(run([controller, "status"], 30_000).stdout)
    if (!status?.health?.healthy) {
      record.restoreStart = run([controller, "start"], 90_000)
      record.restoreTray = {
        status: startTrayTask().status,
      }
    }
  } catch (restoreError) {
    record.restoreError = restoreError instanceof Error ? restoreError.message : String(restoreError)
  }
  record.finishedAt = new Date().toISOString()
  writeFileSync(path.join(evidenceDir, evidenceName), `${JSON.stringify(record, null, 2)}\n`, "utf8")
}
