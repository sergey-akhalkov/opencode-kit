#!/usr/bin/env node
import { spawn } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadSharedToolsConfiguration } from "../windows/opencode-shared-tools.ts";
import { isolatedProofServerEnvironment, proofClient, requestData, seedProofConfigDependencies } from "./lib/opencode-proof-client.ts";
import { removeProofFixture, stopProofProcessTree } from "./lib/proof-process-cleanup.ts";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const machine = path.join(root, "tools", "windows", "opencode-workstation.config.json");
const controllerSource = path.join(root, "tools", "windows", "opencode-workstation.ts");
const graphPort = 4197;
const json = (value: unknown) => `${JSON.stringify(value, null, 2)}\n`;
async function freePort() { return new Promise<number>((resolve, reject) => { const s = net.createServer(); s.once("error", reject); s.listen(0, "127.0.0.1", () => { const a = s.address(); if (!a || typeof a === "string") return reject(new Error("port")); s.close(() => resolve(a.port)); }); }); }
async function portOpen(port: number) { return new Promise<boolean>((resolve) => { const s = net.createConnection({ host: "127.0.0.1", port }); s.setTimeout(500); s.once("connect", () => { s.destroy(); resolve(true); }); s.once("error", () => resolve(false)); s.once("timeout", () => { s.destroy(); resolve(false); }); }); }
async function waitPort(port: number, child: any, timeout = 120000) { const end = Date.now() + timeout; while (Date.now() < end) { if (child.exitCode != null) throw new Error("child exited"); const open = await new Promise<boolean>((resolve) => { const s = net.createConnection({ host: "127.0.0.1", port }); s.setTimeout(300); s.once("connect", () => { s.destroy(); resolve(true); }); s.once("error", () => resolve(false)); s.once("timeout", () => { s.destroy(); resolve(false); }); }); if (open) return; await new Promise((r) => setTimeout(r, 250)); } throw new Error("port timeout"); }
async function authStatus(key: string | null) { const response = await fetch(`http://127.0.0.1:${graphPort}/mcp`, { method: "POST", headers: { accept: "application/json, text/event-stream", "content-type": "application/json", ...(key ? { authorization: `Bearer ${key}` } : {}) }, body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "2025-03-26", capabilities: {}, clientInfo: { name: "degradation-proof", version: "1" } } }) }); await response.body?.cancel(); return response.status; }
async function waitMcp(client: any, directory: string, desired: string, timeout = 60000) { const end = Date.now() + timeout; while (Date.now() < end) { const status = (await requestData<any>(client.mcp.status({ directory }), "mcp.status"))["graphify-global"]?.status; if (status === desired) return status; await new Promise((r) => setTimeout(r, 250)); } return "timeout"; }

async function main() {
  const index = process.argv.indexOf("--evidence-root"); const evidenceRoot = index >= 0 ? path.resolve(process.argv[index + 1]) : null; if (!evidenceRoot || fs.existsSync(evidenceRoot)) throw new Error("new evidence root required"); fs.mkdirSync(evidenceRoot);
  const fixture = fs.mkdtempSync(path.join(os.tmpdir(), "opencode-degradation-")); const configuration = await loadSharedToolsConfiguration(machine); const key = crypto.randomBytes(32).toString("base64url"); let graph: any = null; let server: any = null; const raw: any = { schemaVersion: 1, providerCalls: 0, candidate: { controllerSourceSha256: crypto.createHash("sha256").update(fs.readFileSync(controllerSource)).digest("hex") }, managedPortsBefore: { port4096: null, port4097: null } };
  const startGraph = async () => { const args = ["-u", "-m", "graphify.serve", "--graph", configuration.graphify.graph.path, "--transport", "http", "--host", "127.0.0.1", "--port", String(graphPort), "--path", "/mcp", "--stateless"]; const child = spawn(configuration.graphify.python.path, args, { cwd: fixture, env: { ...process.env, GRAPHIFY_API_KEY: key, PYTHONUNBUFFERED: "1" }, stdio: ["pipe", "pipe", "pipe"], windowsHide: true }); await waitPort(graphPort, child); return child; };
  raw.managedPortsBefore = { port4096: await portOpen(4096), port4097: await portOpen(4097) };
  try {
    graph = await startGraph(); raw.auth = { missing: await authStatus(null), wrong: await authStatus("wrong-key-value-that-is-long-enough"), correct: await authStatus(key) };
    const configDir = path.join(fixture, "config"); const runtime = path.join(fixture, "runtime"); const project = path.join(fixture, "project"); fs.mkdirSync(project); seedProofConfigDependencies(configDir, path.join(root, "global"));
    fs.writeFileSync(path.join(configDir, "opencode.json"), json({ $schema: "https://opencode.ai/config.json", mcp: { "graphify-global": { type: "remote", url: `http://127.0.0.1:${graphPort}/mcp`, enabled: true, timeout: 180000, oauth: false, headers: { Authorization: "Bearer {env:OPENCODE_GRAPHIFY_API_KEY}" } } }, permission: "allow", formatter: false, lsp: false }));
    const port = await freePort(); const base = `http://127.0.0.1:${port}`; const env = isolatedProofServerEnvironment(process.env, configDir, runtime); env.OPENCODE_GRAPHIFY_API_KEY = key; server = spawn("opencode.exe", ["serve", "--hostname", "127.0.0.1", "--port", String(port)], { cwd: fixture, env, stdio: ["pipe", "pipe", "pipe"], windowsHide: true }); await waitPort(port, server, 60000);
    const client = proofClient(base, project); await requestData(client.project.current({ directory: project }), "project.current"); raw.before = await waitMcp(client, project, "connected");
    await stopProofProcessTree(graph); graph = null; const response = await fetch(`${base}/path?directory=${encodeURIComponent(project)}`); raw.openCodeSurvived = response.status === 200; await response.body?.cancel(); try { await authStatus(key); raw.graphifyUnavailable = false; } catch { raw.graphifyUnavailable = true; } raw.cachedStatusAfterExit = (await requestData<any>(client.mcp.status({ directory: project }), "mcp.status"))["graphify-global"]?.status;
    graph = await startGraph(); await requestData(client.mcp.connect({ name: "graphify-global", directory: project }), "mcp.connect"); raw.afterRecovery = await waitMcp(client, project, "connected"); raw.secretSafe = !JSON.stringify(raw).includes(key) && !fs.readFileSync(path.join(configDir, "opencode.json"), "utf8").includes(key);
  } finally { if (server) await stopProofProcessTree(server); if (graph) await stopProofProcessTree(graph); removeProofFixture(fixture); raw.cleanup = { complete: !fs.existsSync(fixture) }; raw.managedPortsAfter = { port4096: await portOpen(4096), port4097: await portOpen(4097) }; }
  const checks = { authClosed: raw.auth?.missing === 401 && raw.auth?.wrong === 401 && raw.auth?.correct === 200, initiallyConnected: raw.before === "connected", openCodeSurvived: raw.openCodeSurvived === true, degradedObserved: raw.graphifyUnavailable === true, recovered: raw.afterRecovery === "connected", managedUntouched: raw.managedPortsBefore.port4096 && raw.managedPortsBefore.port4097 && raw.managedPortsAfter.port4096 && raw.managedPortsAfter.port4097, noProviderCalls: raw.providerCalls === 0, secretSafe: raw.secretSafe === true, cleanup: raw.cleanup.complete === true };
  const evaluation = { schemaVersion: 1, passed: Object.values(checks).every(Boolean), checks }; fs.writeFileSync(path.join(evidenceRoot, "raw.json"), json(raw), { flag: "wx" }); fs.writeFileSync(path.join(evidenceRoot, "evaluation.json"), json(evaluation), { flag: "wx" }); process.stdout.write(json(evaluation)); if (!evaluation.passed) process.exitCode = 1;
}
main().catch((error) => { process.stderr.write(`${error.stack ?? error}\n`); process.exitCode = 1; });
