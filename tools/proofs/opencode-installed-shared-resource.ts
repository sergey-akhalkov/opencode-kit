#!/usr/bin/env node
import { spawn, spawnSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { remoteGraphifyEntry } from "../windows/opencode-shared-tools.ts";
import { isolatedProofServerEnvironment, proofClient, requestData, seedProofConfigDependencies } from "./lib/opencode-proof-client.ts";
import { removeProofFixture, stopProofProcessTree } from "./lib/proof-process-cleanup.ts";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const baselinePath = path.join(root, "openspec", "changes", "optimize-shared-opencode-runtime-resources", "evidence-task-1-1-baseline-r1", "raw.json");
const keyPath = String.raw`C:\ProgramData\OpenCodeWorkstation\graphify-api-key`;

function median(values: number[]) { const sorted = [...values].sort((a, b) => a - b); return sorted[Math.floor(sorted.length / 2)]; }
function json(value: unknown) { return `${JSON.stringify(value, null, 2)}\n`; }
async function freePort() { return new Promise<number>((resolve, reject) => { const server = net.createServer(); server.once("error", reject); server.listen(0, "127.0.0.1", () => { const address = server.address(); if (!address || typeof address === "string") return reject(new Error("no port")); server.close(() => resolve(address.port)); }); }); }
function graphifyPrivateMiB() {
  const command = `$l=Get-NetTCPConnection -State Listen -LocalPort 4097 -ErrorAction Stop|Select-Object -First 1;$p=Get-CimInstance Win32_Process -Filter ("ProcessId = {0}" -f $l.OwningProcess);$ids=@([int]$l.OwningProcess,[int]$p.ParentProcessId)|Sort-Object -Unique;$sum=0;foreach($processId in $ids){$x=Get-Process -Id $processId -ErrorAction SilentlyContinue;if($x){$sum+=$x.PrivateMemorySize64}};[math]::Round($sum/1MB,3)`;
  const result = spawnSync("powershell.exe", ["-NoProfile", "-NonInteractive", "-Command", command], { encoding: "utf8", windowsHide: true });
  if (result.status !== 0) throw new Error("Graphify memory observation failed");
  return Number(result.stdout.trim().replace(",", "."));
}
async function waitConnected(baseUrl: string, directory: string) {
  const client = proofClient(baseUrl, directory); const deadline = Date.now() + 60_000;
  const project = await requestData<any>(client.project.current({ directory }), "project.current");
  while (Date.now() < deadline) {
    const statuses = await requestData<any>(client.mcp.status({ directory }), "mcp.status");
    if (statuses["graphify-global"]?.status === "connected") return { projectId: project.id, exact: path.resolve(project.worktree).toLowerCase() === path.resolve(directory).toLowerCase() };
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error("remote MCP timeout");
}
async function main() {
  const args = process.argv.slice(2); const rootIndex = args.indexOf("--evidence-root"); const evidenceRoot = rootIndex >= 0 ? path.resolve(args[rootIndex + 1]) : null;
  if (!evidenceRoot || fs.existsSync(evidenceRoot)) throw new Error("new --evidence-root required");
  fs.mkdirSync(evidenceRoot); const fixture = fs.mkdtempSync(path.join(os.tmpdir(), "opencode-installed-shared-"));
  const key = fs.readFileSync(keyPath, "utf8").trim(); let child: any = null; const raw: any = { schemaVersion: 1, providerCalls: 0 };
  try {
    const configDir = path.join(fixture, "config"); const runtime = path.join(fixture, "runtime"); seedProofConfigDependencies(configDir, path.join(root, "global"));
    fs.writeFileSync(path.join(configDir, "opencode.json"), json({ $schema: "https://opencode.ai/config.json", mcp: { "graphify-global": remoteGraphifyEntry(180000) }, permission: "allow", formatter: false, lsp: false }));
    const projects = [path.join(fixture, "project-a"), path.join(fixture, "project-b")]; projects.forEach((item) => { fs.mkdirSync(item); const git = spawnSync("git.exe", ["init", "--quiet", item], { windowsHide: true }); if (git.status !== 0) throw new Error("git init failed"); });
    const port = await freePort(); const baseUrl = `http://127.0.0.1:${port}`; const env = isolatedProofServerEnvironment(process.env, configDir, runtime); env.OPENCODE_GRAPHIFY_API_KEY = key;
    child = spawn("opencode.exe", ["serve", "--hostname", "127.0.0.1", "--port", String(port)], { cwd: fixture, env, stdio: ["pipe", "pipe", "pipe"], windowsHide: true });
    const readyDeadline = Date.now() + 60_000; let serverReady = false;
    while (Date.now() < readyDeadline) {
      try { const response = await fetch(`${baseUrl}/path?directory=${encodeURIComponent(projects[0])}`); await response.body?.cancel(); if (response.status === 200) { serverReady = true; break; } } catch {}
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
    if (!serverReady) throw new Error("proof-owned OpenCode server readiness timeout");
    const connected = []; for (const project of projects) connected.push(await waitConnected(baseUrl, project)); raw.projects = connected;
    raw.resourceSamplesMiB = []; for (let i = 0; i < 5; i++) { raw.resourceSamplesMiB.push(graphifyPrivateMiB()); await new Promise((resolve) => setTimeout(resolve, 400)); }
    const baseline = JSON.parse(fs.readFileSync(baselinePath, "utf8")); raw.baselineTwoClientPrivateMiB = median(baseline.twoClient.samples.map((sample: any) => sample.totals.privateMiB)); raw.candidateMedianPrivateMiB = median(raw.resourceSamplesMiB); raw.improvement = 1 - raw.candidateMedianPrivateMiB / raw.baselineTwoClientPrivateMiB;
    raw.secretSafe = !JSON.stringify(raw).includes(key) && !fs.readFileSync(path.join(configDir, "opencode.json"), "utf8").includes(key);
  } finally {
    if (child) await stopProofProcessTree(child);
    removeProofFixture(fixture); raw.cleanup = { complete: !fs.existsSync(fixture) };
  }
  const checks = { twoProjects: raw.projects?.length === 2 && raw.projects.every((x: any) => x.exact), resourceThreshold: raw.improvement >= 0.35, secretSafe: raw.secretSafe === true, noProviderCalls: raw.providerCalls === 0, cleanup: raw.cleanup.complete === true };
  const evaluation = { schemaVersion: 1, passed: Object.values(checks).every(Boolean), checks };
  fs.writeFileSync(path.join(evidenceRoot, "raw.json"), json(raw), { flag: "wx" }); fs.writeFileSync(path.join(evidenceRoot, "evaluation.json"), json(evaluation), { flag: "wx" }); process.stdout.write(json(evaluation)); if (!evaluation.passed) process.exitCode = 1;
}
main().catch((error) => { process.stderr.write(`${error.stack ?? error}\n`); process.exitCode = 1; });
