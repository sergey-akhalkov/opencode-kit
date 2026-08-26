import { spawnSync } from "node:child_process"
import crypto from "node:crypto"
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const protectedRoot = "C:\\ProgramData\\OpenCodeWorkstation"
const manifestPath = path.join(protectedRoot, "manifest.json")
const outputPath = path.join(path.dirname(fileURLToPath(import.meta.url)), "task-4-2-installed-validation-r3.json")
const expectedCandidate = "8e403f654255d4dc9e85f6d17b23613ecdc98a55ac8126c2bb83124f1a6f4dd9"
const expectedControllerHash = "57E009D8A32A8F5300C636984C912F4DB4686051722947C43C78DBBAE5A7DB1A"

if (fs.existsSync(outputPath)) throw new Error(`Refusing to overwrite existing evidence: ${outputPath}`)

type CommandResult = {
  name: string
  arguments: string[]
  exitCode: number | null
  timedOut: boolean
  stdout: string
  stderr: string
}

const result: {
  schemaVersion: number
  recordedAt: string
  candidate: string | null
  controllerHash: string | null
  configurationPath: string | null
  commands: CommandResult[]
  checks: Record<string, boolean>
  ok: boolean
  error: string | null
} = {
  schemaVersion: 1,
  recordedAt: new Date().toISOString(),
  candidate: null,
  controllerHash: null,
  configurationPath: null,
  commands: [],
  checks: {},
  ok: false,
  error: null,
}

try {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"))
  const bunPath = String(manifest.tools.node.executable.path)
  const controllerPath = String(manifest.controller.installedPath)
  result.candidate = String(manifest.candidate)
  result.configurationPath = String(manifest.configuration.path)
  result.controllerHash = crypto.createHash("sha256").update(fs.readFileSync(controllerPath)).digest("hex").toUpperCase()

  const invoke = (name: string, args: string[]): CommandResult => {
    const completed = spawnSync(bunPath, [controllerPath, ...args], {
      encoding: "utf8",
      timeout: 120_000,
      windowsHide: true,
      maxBuffer: 8 * 1024 * 1024,
    })
    return {
      name,
      arguments: args,
      exitCode: completed.status,
      timedOut: completed.error?.code === "ETIMEDOUT",
      stdout: completed.stdout ?? "",
      stderr: completed.stderr ?? "",
    }
  }

  result.commands = [
    invoke("help", ["--help"]),
    invoke("preflight", ["preflight", "--config", result.configurationPath]),
    invoke("status", ["status"]),
  ]
  const help = result.commands[0]
  const preflight = JSON.parse(result.commands[1].stdout)
  const status = JSON.parse(result.commands[2].stdout)
  result.checks = {
    elevated: preflight.environment?.elevated === true,
    candidateMatches: result.candidate === expectedCandidate,
    controllerHashMatches: result.controllerHash === expectedControllerHash,
    commandsExitedZero: result.commands.every((command) => !command.timedOut && command.exitCode === 0),
    helpListsRestart: /^\s*opencode-workstation\.ts\s+restart\s*$/mu.test(help.stdout),
    helpListsStop: /^\s*opencode-workstation\.ts\s+stop\s*$/mu.test(help.stdout),
    integrityComplete: status.managed?.integrity === "complete",
    serverTaskRunning: status.managed?.task?.state === "Running",
    trayTaskRunning: status.managed?.trayTask?.state === "Running",
  }
  result.ok = Object.values(result.checks).every(Boolean)
} catch (error) {
  result.error = error instanceof Error ? error.stack ?? error.message : String(error)
} finally {
  fs.writeFileSync(outputPath, `${JSON.stringify(result, null, 2)}\n`, { encoding: "utf8", flag: "wx" })
}

if (!result.ok) process.exitCode = 1
