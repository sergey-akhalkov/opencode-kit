import {
  copyFileSync,
  existsSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync,
} from "node:fs"
import path from "node:path"

export const WORKSTATION_LOCAL_CONFIG_NAME = "opencode-workstation.config.json"
export const WORKSTATION_EXAMPLE_CONFIG_NAME = "opencode-workstation.config.example.json"

export type WorkstationConfigPaths = {
  directory: string
  local: string
  example: string
}

export type WorkstationConfigIo = {
  copyFileSync?: typeof copyFileSync
  existsSync?: typeof existsSync
  readFileSync?: typeof readFileSync
  renameSync?: typeof renameSync
  rmSync?: typeof rmSync
  writeFileSync?: typeof writeFileSync
}

export function workstationConfigPaths(directory: string): WorkstationConfigPaths {
  const resolved = path.resolve(directory)
  return {
    directory: resolved,
    local: path.join(resolved, WORKSTATION_LOCAL_CONFIG_NAME),
    example: path.join(resolved, WORKSTATION_EXAMPLE_CONFIG_NAME),
  }
}

export function missingWorkstationConfigMessage(expectedPath: string, paths: WorkstationConfigPaths): string {
  return [
    `Workstation configuration is missing at '${expectedPath}'.`,
    `Copy the tracked example '${paths.example}' to the gitignored local file '${paths.local}',`,
    "replace placeholders with this machine's repository and Graphify paths,",
    "and pass --config <local-path> if the file is not in the documented default location.",
    "The tracked example is not a live host mapping and is never used as the default config.",
  ].join(" ")
}

export function resolveWorkstationConfigurationPath(options: {
  explicitPath?: string
  sourceDirectory: string
}): { path: string; kind: "explicit" | "local" } {
  const paths = workstationConfigPaths(options.sourceDirectory)
  const explicit = options.explicitPath?.trim() ?? ""
  if (explicit.length > 0) {
    const resolved = path.resolve(explicit)
    if (path.basename(resolved) === WORKSTATION_EXAMPLE_CONFIG_NAME) {
      throw new Error(
        `Refusing the tracked example as live workstation configuration. Copy '${paths.example}' to '${paths.local}' and edit host mappings, or pass --config with a machine-local file.`,
      )
    }
    if (!existsSync(resolved)) {
      throw new Error(missingWorkstationConfigMessage(resolved, paths))
    }
    return { path: resolved, kind: "explicit" }
  }
  if (!existsSync(paths.local)) {
    throw new Error(missingWorkstationConfigMessage(paths.local, paths))
  }
  return { path: paths.local, kind: "local" }
}

export function replaceWorkstationLocalConfig(
  localPath: string,
  nextBytes: Uint8Array,
  io: WorkstationConfigIo = {},
): { backupPath: string | null } {
  const disk = {
    copyFileSync,
    existsSync,
    readFileSync,
    renameSync,
    rmSync,
    writeFileSync,
    ...io,
  }
  const resolved = path.resolve(localPath)
  if (path.basename(resolved) === WORKSTATION_EXAMPLE_CONFIG_NAME) {
    throw new Error("Refusing to write the tracked workstation example as a live local config.")
  }
  const backupPath = `${resolved}.previous`
  const temporary = `${resolved}.${process.pid}.tmp`
  const hadLocal = disk.existsSync(resolved)
  const previous = hadLocal ? disk.readFileSync(resolved) : null
  try {
    if (hadLocal) disk.copyFileSync(resolved, backupPath)
    disk.writeFileSync(temporary, nextBytes)
    disk.renameSync(temporary, resolved)
    return { backupPath: hadLocal ? backupPath : null }
  } catch (error) {
    try {
      disk.rmSync(temporary, { force: true })
    } catch {
      // Best-effort temp cleanup; restore below is the contract.
    }
    if (previous != null) {
      disk.writeFileSync(resolved, previous)
    }
    throw error
  }
}
