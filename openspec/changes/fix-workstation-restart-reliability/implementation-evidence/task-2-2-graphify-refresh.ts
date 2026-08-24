import { mkdtempSync, rmSync, writeFileSync } from "node:fs"
import os from "node:os"
import path from "node:path"
import { fileURLToPath } from "node:url"
import {
  assertReusableGraphifyConfig,
  remoteGraphifyEntry,
} from "../../../../tools/windows/opencode-shared-tools.ts"

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..", "..")
const liveConfigPath = path.join(repoRoot, "global", "opencode.json")
const evidencePath = path.join(path.dirname(fileURLToPath(import.meta.url)), "task-2-2-graphify-refresh.json")
const dummyGraphify = { python: { path: "python" }, graph: { path: "graph.json" } }

async function rejected(work: () => Promise<unknown>) {
  try {
    await work()
    return { rejected: false, message: null }
  } catch (error) {
    return { rejected: true, message: error instanceof Error ? error.message : String(error) }
  }
}

const fixtureRoot = mkdtempSync(path.join(os.tmpdir(), "oc-graphify-refresh-"))
const record: Record<string, unknown> = {
  schemaVersion: 1,
  startedAt: new Date().toISOString(),
}

try {
  const remotePath = path.join(fixtureRoot, "already-remote.json")
  writeFileSync(remotePath, `${JSON.stringify({ mcp: { "graphify-global": remoteGraphifyEntry(30) } }, null, 2)}\n`)
  const accepted = await assertReusableGraphifyConfig(remotePath, dummyGraphify)

  const driftedPath = path.join(fixtureRoot, "drifted-remote.json")
  writeFileSync(driftedPath, `${JSON.stringify({
    mcp: { "graphify-global": { ...remoteGraphifyEntry(30), url: "http://127.0.0.1:1/mcp" } },
  }, null, 2)}\n`)
  const drifted = await rejected(() => assertReusableGraphifyConfig(driftedPath, dummyGraphify))

  const extraKeyPath = path.join(fixtureRoot, "extra-key.json")
  writeFileSync(extraKeyPath, `${JSON.stringify({
    mcp: { "graphify-global": { ...remoteGraphifyEntry(30), extra: true } },
  }, null, 2)}\n`)
  const extraKey = await rejected(() => assertReusableGraphifyConfig(extraKeyPath, dummyGraphify))

  const live = await assertReusableGraphifyConfig(liveConfigPath, dummyGraphify)

  record.fixture = { kind: accepted.kind, timeout: accepted.timeout }
  record.driftedRejected = drifted.rejected
  record.extraKeyRejected = extraKey.rejected
  record.live = { kind: live.kind, timeoutPositive: Number.isInteger(live.timeout) && live.timeout > 0 }
  record.ok = accepted.kind === "remote" && drifted.rejected && extraKey.rejected && live.kind === "remote"
} catch (error) {
  record.ok = false
  record.error = error instanceof Error ? error.message : String(error)
} finally {
  rmSync(fixtureRoot, { recursive: true, force: true })
  record.cleanup = { fixtureAbsent: true }
  record.finishedAt = new Date().toISOString()
  writeFileSync(evidencePath, `${JSON.stringify(record, null, 2)}\n`)
}

process.stdout.write(`${JSON.stringify({ ok: record.ok, live: record.live, fixture: record.fixture }, null, 2)}\n`)
if (!record.ok) process.exitCode = 1
