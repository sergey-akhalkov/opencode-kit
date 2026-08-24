#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const controller = path.join(root, "tools", "windows", "opencode-workstation.ts");
const config = path.join(root, "tools", "windows", "opencode-workstation.config.json");
const installed = String.raw`C:\ProgramData\OpenCodeWorkstation\opencode-workstation.ts`;
const manifest = String.raw`C:\ProgramData\OpenCodeWorkstation\manifest.json`;
const globalConfig = path.join(root, "global", "opencode.json");
const keyPath = String.raw`C:\ProgramData\OpenCodeWorkstation\graphify-api-key`;

function sha(file: string) { return fs.existsSync(file) ? crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex") : null; }
function run(file: string, args: string[], timeout = 240_000) {
  const result = spawnSync(file, args, { cwd: root, encoding: "utf8", windowsHide: true, timeout });
  let output = null;
  try { output = result.stdout ? JSON.parse(result.stdout) : null; } catch {}
  return { exitCode: result.status, signal: result.signal, stdoutSha256: crypto.createHash("sha256").update(result.stdout ?? "").digest("hex"), stderr: (result.stderr ?? "").slice(-4000), output };
}
function evaluate(raw: any) {
  const checks = {
    stopped: raw.operations.stop.exitCode === 0,
    repaired: raw.operations.install.exitCode === 0 && raw.operations.install.output?.status === "repaired-stopped",
    started: raw.operations.start.exitCode === 0,
    schema2: raw.after.manifest?.schemaVersion === 2,
    installedHashes: raw.after.manifest?.controller?.sha256 && raw.after.manifest?.sharedTools?.sha256,
    compositeHealthy: raw.after.status?.health?.healthy === true,
    bothListeners: raw.after.status?.environment?.port?.listenerCount === 1 && raw.after.status?.environment?.graphifyPort?.listenerCount === 1,
    configManaged: raw.after.configSha256 === raw.after.manifest?.graphify?.configEdit?.managed?.sha256,
    envReferenceOnly: raw.after.configHasEnvReference === true && raw.after.configContainsCredential === false,
    secretSafe: raw.secretSafe === true,
  };
  return { schemaVersion: 1, passed: Object.values(checks).every(Boolean), checks };
}

const args = process.argv.slice(2);
const evidenceIndex = args.indexOf("--evidence-root");
const evidenceRoot = evidenceIndex >= 0 ? path.resolve(args[evidenceIndex + 1]) : null;
if (!evidenceRoot || fs.existsSync(evidenceRoot)) throw new Error("A new absolute --evidence-root is required");
fs.mkdirSync(evidenceRoot, { recursive: false });
const raw: any = {
  schemaVersion: 1,
  before: {
    controllerSha256: sha(installed),
    manifest: fs.existsSync(manifest) ? JSON.parse(fs.readFileSync(manifest, "utf8")) : null,
    configSha256: sha(globalConfig),
    status: run(process.execPath, [controller, "status"], 120_000).output,
  },
  operations: {},
};
try {
  raw.operations.stop = run(process.execPath, [controller, "stop"], 120_000);
  if (raw.operations.stop.exitCode !== 0) throw new Error("stop failed");
  raw.operations.install = run(process.execPath, [controller, "install", "--config", config], 240_000);
  if (raw.operations.install.exitCode !== 0) throw new Error("install failed");
  raw.operations.start = run(process.execPath, [installed, "start"], 300_000);
  if (raw.operations.start.exitCode !== 0) throw new Error("start failed");
} catch (error) {
  raw.failure = error instanceof Error ? { message: error.message, stack: error.stack } : { message: String(error) };
  raw.operations.recoveryStart = run(process.execPath, [installed, "start"], 300_000);
}
const credential = fs.existsSync(keyPath) ? fs.readFileSync(keyPath, "utf8").trim() : "";
const configText = fs.readFileSync(globalConfig, "utf8");
raw.after = {
  controllerSha256: sha(installed),
  manifest: fs.existsSync(manifest) ? JSON.parse(fs.readFileSync(manifest, "utf8")) : null,
  configSha256: sha(globalConfig),
  configHasEnvReference: configText.includes("{env:OPENCODE_GRAPHIFY_API_KEY}"),
  configContainsCredential: credential !== "" && configText.includes(credential),
  status: run(process.execPath, [installed, "status"], 180_000).output,
};
const projected = JSON.stringify(raw);
raw.secretSafe = credential !== "" && !projected.includes(credential) && !configText.includes(credential);
const evaluation = evaluate(raw);
fs.writeFileSync(path.join(evidenceRoot, "raw.json"), `${JSON.stringify(raw, null, 2)}\n`, { flag: "wx" });
fs.writeFileSync(path.join(evidenceRoot, "evaluation.json"), `${JSON.stringify(evaluation, null, 2)}\n`, { flag: "wx" });
process.exitCode = evaluation.passed ? 0 : 1;
