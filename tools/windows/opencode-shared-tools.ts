#!/usr/bin/env node
import { spawnSync } from "node:child_process"
import { createHash } from "node:crypto"
import { existsSync, readFileSync, renameSync, rmSync, statSync, writeFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { resolveWorkstationConfigurationPath, workstationConfigPaths } from "./opencode-workstation-config.ts"

export const GRAPHIFY_MCP_NAME = "graphify-global"
export const GRAPHIFY_MODULE = "graphify.serve"
export const GRAPHIFY_HOST = "127.0.0.1"
export const GRAPHIFY_PORT = 4097
export const GRAPHIFY_PATH = "/mcp"
export const GRAPHIFY_ENDPOINT = `http://${GRAPHIFY_HOST}:${GRAPHIFY_PORT}${GRAPHIFY_PATH}`
export const GRAPHIFY_CREDENTIAL_ENV = "OPENCODE_GRAPHIFY_API_KEY"

const graphifyEnvironment = {
  PYTHONUNBUFFERED: "1",
  PYTHONIOENCODING: "utf-8",
  PYTHONUTF8: "1",
}
const configPlanBytes = new WeakMap()
const authorizedProbeTokens = new WeakSet()

function sha256(value) {
  return createHash("sha256").update(value).digest("hex")
}

export function fileIdentity(filePath) {
  const resolvedPath = path.resolve(filePath)
  const stats = statSync(resolvedPath)
  if (!stats.isFile()) throw new Error(`Expected a file at '${resolvedPath}'.`)
  const bytes = readFileSync(resolvedPath)
  return {
    path: resolvedPath,
    length: bytes.length,
    sha256: sha256(bytes),
  }
}

function samePath(left, right) {
  return path.resolve(left).toLowerCase() === path.resolve(right).toLowerCase()
}

function exactObjectKeys(value, expectedKeys, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${label} must be a JSON object.`)
  }
  const actual = Object.keys(value).sort()
  const expected = [...expectedKeys].sort()
  if (actual.length !== expected.length || actual.some((key, index) => key !== expected[index])) {
    throw new Error(`${label} must contain exactly: ${expected.join(", ")}.`)
  }
}

function nonEmptyString(value, label) {
  if (typeof value !== "string" || value.trim() === "") throw new Error(`${label} must be a non-empty string.`)
  return value
}

function runJson(executable, args, label, options = {}) {
  const result = spawnSync(executable, args, {
    encoding: "utf8",
    windowsHide: true,
    ...options,
  })
  if (result.error) throw new Error(`${label} could not start.`, { cause: result.error })
  if (result.status !== 0) {
    const diagnostic = (result.stderr || result.stdout || "no diagnostic output").trim().slice(-2_000)
    throw new Error(`${label} exited ${result.status}: ${diagnostic}`)
  }
  try {
    return JSON.parse(result.stdout.trim())
  } catch (error) {
    throw new Error(`${label} returned invalid JSON.`, { cause: error })
  }
}

function graphifyModuleIdentity(pythonPath) {
  const probe = [
    "import importlib.metadata, importlib.util, json, sys",
    `spec = importlib.util.find_spec(${JSON.stringify(GRAPHIFY_MODULE)})`,
    "assert spec is not None and spec.origin is not None, 'graphify.serve is unavailable'",
    "print(json.dumps({'executable': sys.executable, 'module': 'graphify.serve', 'origin': spec.origin, 'packageVersion': importlib.metadata.version('graphifyy')}))",
  ].join("; ")
  const result = runJson(pythonPath, ["-I", "-c", probe], "Graphify module identity probe")
  if (!samePath(result.executable, pythonPath)) {
    throw new Error(`Graphify module probe used unexpected Python executable '${result.executable}'.`)
  }
  if (result.module !== GRAPHIFY_MODULE || !existsSync(result.origin)) {
    throw new Error(`Python executable does not expose the required '${GRAPHIFY_MODULE}' module.`)
  }
  return {
    name: result.module,
    packageVersion: nonEmptyString(result.packageVersion, "Graphify package version"),
    source: fileIdentity(result.origin),
  }
}

export function graphifyArguments(graphify) {
  return [
    "-u",
    "-m",
    GRAPHIFY_MODULE,
    "--graph",
    graphify.graph.path,
    "--transport",
    "http",
    "--host",
    GRAPHIFY_HOST,
    "--port",
    String(GRAPHIFY_PORT),
    "--path",
    GRAPHIFY_PATH,
    "--stateless",
  ]
}

export function validateGraphifyConfiguration(value, configurationDirectory) {
  exactObjectKeys(value, ["python", "graph", "port"], "Workstation Graphify configuration")
  const pythonPath = path.resolve(configurationDirectory, nonEmptyString(value.python, "Graphify Python path"))
  const graphPath = path.resolve(configurationDirectory, nonEmptyString(value.graph, "Graphify graph path"))
  if (value.port !== GRAPHIFY_PORT) {
    throw new Error(`Graphify port must be the fixed loopback port ${GRAPHIFY_PORT}.`)
  }
  if (path.extname(pythonPath).toLowerCase() !== ".exe") {
    throw new Error("Graphify Python must be a Windows executable path.")
  }
  if (path.extname(graphPath).toLowerCase() !== ".json") {
    throw new Error("Graphify graph must be a .json file.")
  }
  const python = fileIdentity(pythonPath)
  const graph = fileIdentity(graphPath)
  const module = graphifyModuleIdentity(pythonPath)
  const graphify = {
    python,
    module,
    graph,
    endpoint: {
      host: GRAPHIFY_HOST,
      port: GRAPHIFY_PORT,
      path: GRAPHIFY_PATH,
      url: GRAPHIFY_ENDPOINT,
      transport: "streamable-http",
      stateless: true,
    },
  }
  const args = graphifyArguments(graphify)
  return {
    ...graphify,
    command: {
      executablePath: python.path,
      argumentDigest: sha256(JSON.stringify(args)),
      argumentCount: args.length,
      module: GRAPHIFY_MODULE,
    },
  }
}

export function validateSharedToolsConfigurationObject(configuration, configurationPath) {
  exactObjectKeys(configuration, ["schemaVersion", "repositories", "graphify"], "Workstation configuration")
  if (configuration.schemaVersion !== 2) {
    throw new Error(`Unsupported workstation configuration schema '${configuration.schemaVersion}'.`)
  }
  if (!configuration.repositories || typeof configuration.repositories !== "object" || Array.isArray(configuration.repositories)) {
    throw new Error("Workstation configuration repositories must be a JSON object.")
  }
  return {
    graphify: validateGraphifyConfiguration(configuration.graphify, path.dirname(path.resolve(configurationPath))),
  }
}

async function parseJsoncDocument(bytes, label) {
  const { getNodeValue, parseTree, printParseErrorCode } = await import("jsonc-parser")
  const text = Buffer.isBuffer(bytes) ? bytes.toString("utf8") : String(bytes)
  const errors = []
  const root = parseTree(text, errors, { allowTrailingComma: true, disallowComments: false })
  if (!root || errors.length > 0) {
    const detail = errors.map((error) => `${printParseErrorCode(error.error)}@${error.offset}`).join(", ")
    throw new Error(`${label} is invalid JSON/JSONC: ${detail || "missing document root"}.`)
  }
  const duplicates = []
  const visit = (node, nodePath = []) => {
    if (node.type === "object") {
      const seen = new Set()
      for (const property of node.children ?? []) {
        const key = property.children?.[0]?.value
        if (typeof key !== "string") continue
        const nextPath = [...nodePath, key]
        const dotted = nextPath.join(".")
        if (seen.has(key)) duplicates.push(dotted)
        seen.add(key)
        if (property.children?.[1]) visit(property.children[1], nextPath)
      }
      return
    }
    if (node.type === "array") {
      for (const [index, child] of (node.children ?? []).entries()) visit(child, [...nodePath, String(index)])
    }
  }
  visit(root)
  if (duplicates.length > 0) {
    throw new Error(`${label} contains duplicate properties: ${[...new Set(duplicates)].join(", ")}.`)
  }
  return { text, root, value: getNodeValue(root) }
}

export async function loadSharedToolsConfiguration(configurationPath) {
  const resolvedPath = path.resolve(configurationPath)
  if (!existsSync(resolvedPath)) throw new Error(`Workstation configuration is missing at '${resolvedPath}'.`)
  const bytes = readFileSync(resolvedPath)
  const document = await parseJsoncDocument(bytes, "Workstation configuration")
  const validated = validateSharedToolsConfigurationObject(document.value, resolvedPath)
  return {
    schemaVersion: 2,
    source: fileIdentity(resolvedPath),
    ...validated,
  }
}

function validateExactLocalGraphifyEntry(entry, graphify) {
  exactObjectKeys(entry, ["type", "command", "cwd", "enabled", "timeout", "environment"], "Local graphify-global entry")
  const expectedCommand = [graphify.python.path, "-u", "-m", GRAPHIFY_MODULE, "--graph", graphify.graph.path]
  if (entry.type !== "local" || entry.cwd !== "." || entry.enabled !== true) {
    throw new Error("graphify-global must be the enabled local MCP entry with cwd '.'.")
  }
  if (!Number.isInteger(entry.timeout) || entry.timeout <= 0) throw new Error("graphify-global timeout must be a positive integer.")
  if (!Array.isArray(entry.command) || entry.command.length !== expectedCommand.length) {
    throw new Error("graphify-global command does not match the configured Graphify executable/module/graph.")
  }
  for (let index = 0; index < expectedCommand.length; index++) {
    const actual = entry.command[index]
    const expected = expectedCommand[index]
    const matches = index === 0 || index === 5 ? samePath(actual, expected) : actual === expected
    if (!matches) throw new Error("graphify-global command does not match the configured Graphify executable/module/graph.")
  }
  exactObjectKeys(entry.environment, Object.keys(graphifyEnvironment), "graphify-global environment")
  for (const [name, value] of Object.entries(graphifyEnvironment)) {
    if (entry.environment[name] !== value) throw new Error(`graphify-global environment '${name}' is divergent.`)
  }
  return entry.timeout
}

export function remoteGraphifyEntry(timeout) {
  if (!Number.isInteger(timeout) || timeout <= 0) throw new Error("Remote Graphify timeout must be a positive integer.")
  return {
    type: "remote",
    url: GRAPHIFY_ENDPOINT,
    enabled: true,
    timeout,
    oauth: false,
    headers: {
      Authorization: `Bearer {env:${GRAPHIFY_CREDENTIAL_ENV}}`,
    },
  }
}

function validateRemoteGraphifyEntry(entry, timeout) {
  exactObjectKeys(entry, ["type", "url", "enabled", "timeout", "oauth", "headers"], "Remote graphify-global entry")
  exactObjectKeys(entry.headers, ["Authorization"], "Remote graphify-global headers")
  const expected = remoteGraphifyEntry(timeout)
  if (JSON.stringify(entry) !== JSON.stringify(expected)) throw new Error("Managed graphify-global entry failed exact readback validation.")
}

export async function assertReusableGraphifyConfig(configPath, graphify) {
  const resolvedPath = path.resolve(configPath)
  if (!existsSync(resolvedPath)) throw new Error(`OpenCode configuration is missing at '${resolvedPath}'.`)
  const document = await parseJsoncDocument(readFileSync(resolvedPath), "OpenCode configuration")
  const entry = document.value?.mcp?.[GRAPHIFY_MCP_NAME]
  if (!entry) throw new Error(`OpenCode configuration has no '${GRAPHIFY_MCP_NAME}' MCP entry.`)
  if (entry.type === "remote") {
    validateRemoteGraphifyEntry(entry, entry.timeout)
    return { kind: "remote", timeout: entry.timeout }
  }
  const timeout = validateExactLocalGraphifyEntry(entry, graphify)
  return { kind: "local", timeout }
}

function findNode(root, location) {
  let current = root
  for (const segment of location) {
    if (!current || current.type !== "object") return null
    const property = (current.children ?? []).find((candidate) => candidate.children?.[0]?.value === segment)
    current = property?.children?.[1] ?? null
  }
  return current
}

function readAclIdentity(filePath) {
  if (process.platform !== "win32") return { kind: "mode", mode: statSync(filePath).mode }
  const script = [
    "$ErrorActionPreference = 'Stop'",
    "$acl = Get-Acl -LiteralPath $env:OPENCODE_SHARED_TOOLS_ACL_PATH",
    "[ordered]@{ sddl = $acl.Sddl } | ConvertTo-Json -Compress",
  ].join("; ")
  const result = runJson("powershell.exe", ["-NoLogo", "-NoProfile", "-NonInteractive", "-Command", script], "ACL identity probe", {
    env: { ...process.env, OPENCODE_SHARED_TOOLS_ACL_PATH: path.resolve(filePath) },
  })
  const sddl = nonEmptyString(result.sddl, "ACL SDDL")
  return { kind: "windows-sddl", sha256: sha256(sddl), sddl }
}

function publicAclIdentity(identity) {
  return identity.kind === "windows-sddl"
    ? { kind: identity.kind, sha256: identity.sha256 }
    : identity
}

function applyAclDescriptor(filePath, identity) {
  if (identity.kind !== "windows-sddl") return
  const script = [
    "$ErrorActionPreference = 'Stop'",
    "$acl = Get-Acl -LiteralPath $env:OPENCODE_SHARED_TOOLS_ACL_TEMPLATE",
    "$acl.SetSecurityDescriptorSddlForm($env:OPENCODE_SHARED_TOOLS_ACL_SDDL)",
    "Set-Acl -LiteralPath $env:OPENCODE_SHARED_TOOLS_ACL_TARGET -AclObject $acl",
    "[ordered]@{ applied = $true } | ConvertTo-Json -Compress",
  ].join("; ")
  runJson("powershell.exe", ["-NoLogo", "-NoProfile", "-NonInteractive", "-Command", script], "ACL restoration", {
    env: {
      ...process.env,
      OPENCODE_SHARED_TOOLS_ACL_TEMPLATE: path.resolve(filePath),
      OPENCODE_SHARED_TOOLS_ACL_TARGET: path.resolve(filePath),
      OPENCODE_SHARED_TOOLS_ACL_SDDL: identity.sddl,
    },
  })
}

export async function planGraphifyConfigEdit(configPath, graphify) {
  const resolvedPath = path.resolve(configPath)
  if (!existsSync(resolvedPath)) throw new Error(`OpenCode configuration is missing at '${resolvedPath}'.`)
  const originalBytes = readFileSync(resolvedPath)
  const original = await parseJsoncDocument(originalBytes, "OpenCode configuration")
  const entryNode = findNode(original.root, ["mcp", GRAPHIFY_MCP_NAME])
  if (!entryNode) throw new Error(`OpenCode configuration has no '${GRAPHIFY_MCP_NAME}' MCP entry.`)
  const timeout = validateExactLocalGraphifyEntry(original.value?.mcp?.[GRAPHIFY_MCP_NAME], graphify)
  const managedEntry = remoteGraphifyEntry(timeout)
  const { applyEdits, modify } = await import("jsonc-parser")
  const edits = modify(original.text, ["mcp", GRAPHIFY_MCP_NAME], managedEntry, {
    formattingOptions: {
      insertSpaces: true,
      tabSize: 2,
      eol: original.text.includes("\r\n") ? "\r\n" : "\n",
    },
  })
  if (edits.length !== 1) throw new Error(`Expected one minimal graphify-global edit, observed ${edits.length}.`)
  const edit = edits[0]
  if (edit.offset < entryNode.offset || edit.offset + edit.length > entryNode.offset + entryNode.length) {
    throw new Error("graphify-global edit escaped the existing entry value range.")
  }
  const managedText = applyEdits(original.text, edits)
  const managedBytes = Buffer.from(managedText, "utf8")
  const managed = await parseJsoncDocument(managedBytes, "Managed OpenCode configuration")
  validateRemoteGraphifyEntry(managed.value?.mcp?.[GRAPHIFY_MCP_NAME], timeout)
  const prefixPreserved = original.text.slice(0, edit.offset) === managedText.slice(0, edit.offset)
  const suffixPreserved = original.text.slice(edit.offset + edit.length) === managedText.slice(edit.offset + edit.content.length)
  if (!prefixPreserved || !suffixPreserved) throw new Error("Minimal graphify-global edit changed unrelated configuration bytes.")
  const acl = readAclIdentity(resolvedPath)
  const plan = {
    schemaVersion: 1,
    source: fileIdentity(resolvedPath),
    managed: {
      path: resolvedPath,
      length: managedBytes.length,
      sha256: sha256(managedBytes),
    },
    acl: {
      original: publicAclIdentity(acl),
      managed: publicAclIdentity(acl),
      preserveExact: true,
    },
    edit: {
      count: 1,
      offset: edit.offset,
      originalLength: edit.length,
      managedLength: edit.content.length,
      targetPath: `mcp.${GRAPHIFY_MCP_NAME}`,
      prefixPreserved,
      suffixPreserved,
    },
    rollback: {
      requiresManagedSha256: sha256(managedBytes),
      restoresOriginalSha256: sha256(originalBytes),
      exactBytes: true,
      exactAcl: true,
    },
    projection: {
      type: managedEntry.type,
      url: managedEntry.url,
      enabled: managedEntry.enabled,
      timeout: managedEntry.timeout,
      oauth: managedEntry.oauth,
      authorization: `Bearer {env:${GRAPHIFY_CREDENTIAL_ENV}}`,
    },
  }
  configPlanBytes.set(plan, { originalBytes, managedBytes, acl })
  return plan
}

export function materializeGraphifyConfigPlan(plan, state) {
  const bytes = configPlanBytes.get(plan)
  if (!bytes) throw new Error("Graphify configuration plan was not created by this module instance.")
  if (state === "original") return Buffer.from(bytes.originalBytes)
  if (state === "managed") return Buffer.from(bytes.managedBytes)
  throw new Error("Graphify configuration state must be 'original' or 'managed'.")
}

export function applyGraphifyConfigPlan(plan, backupPath) {
  const bytes = configPlanBytes.get(plan)
  if (!bytes) throw new Error("Graphify configuration plan was not created by this module instance.")
  const targetPath = path.resolve(plan.source.path)
  const resolvedBackup = path.resolve(backupPath)
  if (existsSync(resolvedBackup)) throw new Error(`Graphify configuration backup already exists at '${resolvedBackup}'.`)
  if (fileIdentity(targetPath).sha256 !== plan.source.sha256) throw new Error("OpenCode configuration changed after Graphify edit planning.")
  const temporaryPath = `${targetPath}.${process.pid}.graphify-managed`
  try {
    writeFileSync(resolvedBackup, bytes.originalBytes, { flag: "wx" })
    writeFileSync(temporaryPath, bytes.managedBytes, { flag: "wx" })
    applyAclDescriptor(temporaryPath, bytes.acl)
    renameSync(temporaryPath, targetPath)
    const managed = fileIdentity(targetPath)
    if (managed.sha256 !== plan.managed.sha256) throw new Error("Managed OpenCode configuration hash mismatch after replacement.")
    return {
      path: targetPath,
      backupPath: resolvedBackup,
      original: plan.source,
      managed,
      originalAcl: publicAclIdentity(bytes.acl),
      originalAclSddl: bytes.acl.kind === "windows-sddl" ? bytes.acl.sddl : null,
    }
  } catch (error) {
    rmSync(temporaryPath, { force: true })
    if (existsSync(resolvedBackup) && fileIdentity(targetPath).sha256 === plan.source.sha256) rmSync(resolvedBackup, { force: true })
    throw new Error("Failed to apply managed Graphify OpenCode configuration.", { cause: error })
  }
}

export function restoreGraphifyConfig(record) {
  exactObjectKeys(record, ["path", "backupPath", "original", "managed", "originalAcl", "originalAclSddl"], "Managed Graphify config record")
  const targetPath = path.resolve(record.path)
  const backupPath = path.resolve(record.backupPath)
  if (!existsSync(backupPath)) throw new Error("Managed Graphify configuration backup is missing.")
  if (fileIdentity(targetPath).sha256 !== record.managed.sha256) throw new Error("Managed Graphify configuration drifted; refusing restore.")
  if (fileIdentity(backupPath).sha256 !== record.original.sha256) throw new Error("Managed Graphify configuration backup hash mismatch.")
  const temporaryPath = `${targetPath}.${process.pid}.graphify-restore`
  try {
    writeFileSync(temporaryPath, readFileSync(backupPath), { flag: "wx" })
    if (record.originalAclSddl) {
      applyAclDescriptor(temporaryPath, { kind: "windows-sddl", sddl: record.originalAclSddl, sha256: record.originalAcl.sha256 })
    }
    renameSync(temporaryPath, targetPath)
    const restored = fileIdentity(targetPath)
    if (restored.sha256 !== record.original.sha256) throw new Error("Restored OpenCode configuration hash mismatch.")
    return restored
  } catch (error) {
    rmSync(temporaryPath, { force: true })
    throw new Error("Failed to restore original OpenCode configuration.", { cause: error })
  }
}

export function protectedGraphifyProjection(protectedRoot) {
  const root = path.resolve(protectedRoot)
  return {
    credential: {
      path: path.join(root, "graphify-api-key"),
      aclClass: "credential",
      persistedValue: false,
      commandLineValue: false,
      configReference: `{env:${GRAPHIFY_CREDENTIAL_ENV}}`,
    },
    state: {
      path: path.join(root, "server-state.json"),
      aclClass: "protected-state",
      credentialValue: false,
    },
    module: {
      path: path.join(root, "opencode-shared-tools.ts"),
      hashValidated: true,
    },
  }
}

export function inspectGraphifyListeners(port = GRAPHIFY_PORT) {
  if (process.platform !== "win32") return []
  const script = [
    "$ErrorActionPreference = 'Stop'",
    `$rows = @(Get-NetTCPConnection -State Listen -LocalPort ${port} -ErrorAction SilentlyContinue | ForEach-Object {`,
    "  $owner = Get-CimInstance Win32_Process -Filter (\"ProcessId = {0}\" -f $_.OwningProcess) -ErrorAction Stop",
    "  [ordered]@{ localAddress = [string]$_.LocalAddress; localPort = [int]$_.LocalPort; processId = [int]$_.OwningProcess; parentProcessId = [int]$owner.ParentProcessId; executablePath = [string]$owner.ExecutablePath; creationDate = [string]$owner.CreationDate; commandLine = [string]$owner.CommandLine }",
    "})",
    "[ordered]@{ listeners = $rows } | ConvertTo-Json -Compress -Depth 4",
  ].join("\n")
  const result = runJson("powershell.exe", ["-NoLogo", "-NoProfile", "-NonInteractive", "-Command", script], "Graphify listener probe")
  const listeners = Array.isArray(result.listeners) ? result.listeners : result.listeners ? [result.listeners] : []
  return listeners.map((listener) => ({
    localAddress: listener.localAddress,
    localPort: listener.localPort,
    processId: listener.processId,
    parentProcessId: listener.parentProcessId,
    executablePath: listener.executablePath,
    creationDate: listener.creationDate,
    commandLineSha256: sha256(listener.commandLine ?? ""),
  }))
}

export function inspectProcessObservation(processId) {
  if (!Number.isInteger(processId) || processId <= 0) throw new Error("Process ID must be a positive integer.")
  if (process.platform !== "win32") throw new Error("Process identity inspection currently requires Windows.")
  const script = [
    "$ErrorActionPreference = 'Stop'",
    `$process = Get-CimInstance Win32_Process -Filter 'ProcessId = ${processId}' -ErrorAction Stop`,
    "[ordered]@{ processId = [int]$process.ProcessId; parentProcessId = [int]$process.ParentProcessId; executablePath = [string]$process.ExecutablePath; creationDate = [string]$process.CreationDate; commandLine = [string]$process.CommandLine } | ConvertTo-Json -Compress",
  ].join("\n")
  const result = runJson("powershell.exe", ["-NoLogo", "-NoProfile", "-NonInteractive", "-Command", script], "Process identity probe")
  return {
    processId: result.processId,
    parentProcessId: result.parentProcessId,
    executablePath: result.executablePath,
    creationDate: result.creationDate,
    commandLineSha256: sha256(result.commandLine ?? ""),
  }
}

export function evaluateGraphifyListenerState(listeners) {
  if (!Array.isArray(listeners)) throw new Error("Graphify listeners must be an array.")
  for (const listener of listeners) {
    if (!listener || typeof listener !== "object" || listener.localPort !== GRAPHIFY_PORT) {
      throw new Error(`Graphify listener observations must describe port ${GRAPHIFY_PORT}.`)
    }
  }
  return {
    status: listeners.length === 0 ? "ready" : "collision",
    listenerCount: listeners.length,
    credentialProbeAllowed: listeners.length === 0,
  }
}

export function graphifyProcessIdentity(graphify, observed) {
  exactObjectKeys(observed, ["processId", "parentProcessId", "executablePath", "creationDate", "arguments"], "Graphify process observation")
  if (!Number.isInteger(observed.processId) || observed.processId <= 0 || !Number.isInteger(observed.parentProcessId)) {
    throw new Error("Graphify process observation has invalid process identifiers.")
  }
  if (!samePath(observed.executablePath, graphify.python.path)) throw new Error("Graphify process executable identity is divergent.")
  if (typeof observed.creationDate !== "string" || observed.creationDate === "") throw new Error("Graphify process creation identity is missing.")
  const expectedArguments = graphifyArguments(graphify)
  if (JSON.stringify(observed.arguments) !== JSON.stringify(expectedArguments)) throw new Error("Graphify process arguments are divergent.")
  return Object.freeze({
    processId: observed.processId,
    parentProcessId: observed.parentProcessId,
    executablePath: path.resolve(observed.executablePath),
    creationDate: observed.creationDate,
    argumentDigest: sha256(JSON.stringify(observed.arguments)),
  })
}

export function authorizeGraphifyProbe(graphify, processIdentity, listener) {
  exactObjectKeys(listener, ["processId", "localAddress", "localPort", "ancestorProcessIds"], "Graphify listener observation")
  if (listener.localAddress !== GRAPHIFY_HOST || listener.localPort !== GRAPHIFY_PORT) {
    throw new Error("Graphify listener is not the configured fixed loopback endpoint.")
  }
  const ancestry = Array.isArray(listener.ancestorProcessIds) ? listener.ancestorProcessIds : []
  if (listener.processId !== processIdentity.processId && !ancestry.includes(processIdentity.processId)) {
    throw new Error("Graphify listener is not owned by the validated Graphify process.")
  }
  if (processIdentity.argumentDigest !== graphify.command.argumentDigest) {
    throw new Error("Graphify process command identity is divergent.")
  }
  const token = Object.freeze({ endpoint: GRAPHIFY_ENDPOINT, processId: processIdentity.processId })
  authorizedProbeTokens.add(token)
  return token
}

function parseMcpBody(contentType, body) {
  if (contentType.includes("application/json")) return JSON.parse(body)
  const data = body
    .split(/\r?\n/u)
    .filter((line) => line.startsWith("data:"))
    .map((line) => line.slice(5).trim())
    .filter(Boolean)
  if (data.length === 0) throw new Error("Graphify MCP response contained no JSON data event.")
  return JSON.parse(data[data.length - 1])
}

async function mcpRequest(endpoint, apiKey, payload, sessionId = null) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 10_000)
  try {
    const headers = {
      accept: "application/json, text/event-stream",
      "content-type": "application/json",
    }
    if (apiKey) headers.authorization = `Bearer ${apiKey}`
    if (sessionId) headers["mcp-session-id"] = sessionId
    const response = await fetch(endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
      signal: controller.signal,
    })
    const body = await response.text()
    return {
      status: response.status,
      sessionId: response.headers.get("mcp-session-id"),
      value: body === "" ? null : parseMcpBody(response.headers.get("content-type") ?? "", body),
    }
  } catch (error) {
    throw new Error("Graphify MCP request failed.", { cause: error })
  } finally {
    clearTimeout(timer)
  }
}

function requireAuthorizedProbeToken(probeToken) {
  if (!authorizedProbeTokens.has(probeToken) || probeToken.endpoint !== GRAPHIFY_ENDPOINT) {
    throw new Error("Credential-bearing Graphify probe requires a current validated process/listener identity.")
  }
}

async function initializeGraphifyMcp(apiKey) {
  const initialize = {
    jsonrpc: "2.0",
    id: 1,
    method: "initialize",
    params: {
      protocolVersion: "2025-03-26",
      capabilities: {},
      clientInfo: { name: "opencode-workstation", version: "1" },
    },
  }
  const initialized = await mcpRequest(GRAPHIFY_ENDPOINT, apiKey, initialize)
  if (initialized.status !== 200 || initialized.value?.error || !initialized.value?.result) {
    throw new Error(`Authenticated Graphify MCP initialize returned ${initialized.status} without a result.`)
  }
  await mcpRequest(
    GRAPHIFY_ENDPOINT,
    apiKey,
    { jsonrpc: "2.0", method: "notifications/initialized", params: {} },
    initialized.sessionId,
  )
  return initialized
}

export async function probeGraphifyMcp(probeToken, apiKey) {
  requireAuthorizedProbeToken(probeToken)
  if (typeof apiKey !== "string" || apiKey.length < 32) throw new Error("Graphify API key is missing or invalid.")
  const initialize = {
    jsonrpc: "2.0",
    id: 1,
    method: "initialize",
    params: {
      protocolVersion: "2025-03-26",
      capabilities: {},
      clientInfo: { name: "opencode-workstation", version: "1" },
    },
  }
  const unauthorized = await mcpRequest(GRAPHIFY_ENDPOINT, null, initialize)
  if (unauthorized.status !== 401) throw new Error(`Unauthenticated Graphify MCP probe returned ${unauthorized.status}, expected 401.`)
  const initialized = await initializeGraphifyMcp(apiKey)
  const tools = await mcpRequest(GRAPHIFY_ENDPOINT, apiKey, { jsonrpc: "2.0", id: 2, method: "tools/list", params: {} }, initialized.sessionId)
  if (tools.status !== 200 || tools.value?.error || !Array.isArray(tools.value?.result?.tools)) {
    throw new Error(`Authenticated Graphify MCP tools/list returned ${tools.status} without a tool inventory.`)
  }
  return {
    endpoint: GRAPHIFY_ENDPOINT,
    unauthenticatedStatus: unauthorized.status,
    authenticatedStatus: initialized.status,
    protocolVersion: initialized.value.result.protocolVersion,
    serverName: initialized.value.result.serverInfo?.name ?? null,
    tools: tools.value.result.tools.map((tool) => tool.name).sort(),
  }
}

export async function callGraphifyMcpTool(probeToken, apiKey, name, argumentsValue = {}) {
  requireAuthorizedProbeToken(probeToken)
  if (typeof apiKey !== "string" || apiKey.length < 32) throw new Error("Graphify API key is missing or invalid.")
  nonEmptyString(name, "Graphify MCP tool name")
  if (!argumentsValue || typeof argumentsValue !== "object" || Array.isArray(argumentsValue)) {
    throw new Error("Graphify MCP tool arguments must be an object.")
  }
  const initialized = await initializeGraphifyMcp(apiKey)
  const result = await mcpRequest(
    GRAPHIFY_ENDPOINT,
    apiKey,
    { jsonrpc: "2.0", id: 2, method: "tools/call", params: { name, arguments: argumentsValue } },
    initialized.sessionId,
  )
  if (result.status !== 200 || result.value?.error || !result.value?.result) {
    throw new Error(`Authenticated Graphify MCP tools/call '${name}' returned ${result.status} without a result.`)
  }
  return result.value.result
}

function redactText(value, secrets) {
  let redacted = String(value)
  for (const secret of secrets) {
    if (typeof secret === "string" && secret !== "") redacted = redacted.split(secret).join("[REDACTED]")
  }
  return redacted
    .replace(/(authorization\s*[:=]\s*bearer\s+)[^\s,;]+/giu, "$1[REDACTED]")
    .replace(/(x-api-key\s*[:=]\s*)[^\s,;]+/giu, "$1[REDACTED]")
}

export function redactGraphifyError(error, secrets = []) {
  const seen = new Set()
  const project = (value) => {
    if (value instanceof Error) {
      if (seen.has(value)) return { name: value.name, message: "[circular error cause]" }
      seen.add(value)
      return {
        name: redactText(value.name, secrets),
        message: redactText(value.message, secrets),
        stack: value.stack ? redactText(value.stack, secrets) : null,
        cause: value.cause ? project(value.cause) : null,
      }
    }
    return { name: "Error", message: redactText(value, secrets), stack: null, cause: null }
  }
  return project(error)
}

export async function preflightSharedGraphify(options) {
  const configuration = await loadSharedToolsConfiguration(options.configurationPath)
  const configEdit = await planGraphifyConfigEdit(options.opencodeConfigPath, configuration.graphify)
  const listeners = inspectGraphifyListeners(GRAPHIFY_PORT)
  const listenerState = evaluateGraphifyListenerState(listeners)
  return {
    schemaVersion: 1,
    operation: "preflight",
    status: listenerState.status,
    configuration: configuration.source,
    graphify: configuration.graphify,
    configEdit,
    protected: protectedGraphifyProjection(options.protectedRoot ?? String.raw`C:\ProgramData\OpenCodeWorkstation`),
    listener: {
      port: GRAPHIFY_PORT,
      count: listeners.length,
      processes: listeners,
      credentialProbeAllowed: listenerState.credentialProbeAllowed,
    },
    credentialValuesExposed: false,
  }
}

function usage() {
  return `OpenCode shared-tool contract

Usage:
  opencode-shared-tools.ts --help
  opencode-shared-tools.ts preflight [--config <path>] [--opencode-config <path>]

Preflight is effect-free: it reads identities and listener ownership but does not
write configuration, create credentials, start services, or contact an endpoint.
`
}

function requiredValue(args, index, option) {
  const value = args[index + 1]
  if (!value || value.startsWith("--")) throw new Error(`Missing value for ${option}.`)
  return value
}

async function main(args) {
  if (args.length === 0 || args[0] === "--help" || args[0] === "-h") {
    process.stdout.write(usage())
    return 0
  }
  if (args[0] !== "preflight") throw new Error(`Unknown mode '${args[0]}'.`)
  const sourceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..")
  const defaultPaths = workstationConfigPaths(path.join(sourceRoot, "tools", "windows"))
  let configurationPath = ""
  let opencodeConfigPath = path.join(sourceRoot, "global", "opencode.json")
  for (let index = 1; index < args.length; index++) {
    if (args[index] === "--config") {
      configurationPath = path.resolve(requiredValue(args, index, args[index]))
      index++
    } else if (args[index] === "--opencode-config") {
      opencodeConfigPath = path.resolve(requiredValue(args, index, args[index]))
      index++
    } else {
      throw new Error(`Unknown option '${args[index]}'.`)
    }
  }
  const resolvedConfiguration = resolveWorkstationConfigurationPath({
    explicitPath: configurationPath,
    sourceDirectory: defaultPaths.directory,
  })
  const result = await preflightSharedGraphify({ configurationPath: resolvedConfiguration.path, opencodeConfigPath })
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`)
  return result.status === "ready" ? 0 : 2
}

if (process.argv[1] && samePath(fileURLToPath(import.meta.url), process.argv[1])) {
  main(process.argv.slice(2)).then(
    (code) => { process.exitCode = code },
    (error) => {
      process.stderr.write(`${JSON.stringify(redactGraphifyError(error), null, 2)}\n`)
      process.exitCode = 1
    },
  )
}
