#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const controllerPath = path.join(root, "tools", "windows", "opencode-workstation.ts");

function sha256(value: string | Buffer): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function parse(args: string[]) {
  const values: Record<string, string> = {};
  for (let index = 0; index < args.length; index += 2) values[args[index]] = args[index + 1];
  if (args.length === 1 && ["--help", "-h"].includes(args[0])) return { help: true };
  if (!values["--mode"] || !values["--evidence-root"] || !values["--candidate-id"]) throw new Error("Required: --mode capture|replay --candidate-id <id> --evidence-root <absolute-path> [--input-root <path>]");
  return { help: false, mode: values["--mode"], candidateId: values["--candidate-id"], evidenceRoot: path.resolve(values["--evidence-root"]), inputRoot: values["--input-root"] ? path.resolve(values["--input-root"]) : null };
}

function writeNew(file: string, value: unknown) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`, { flag: "wx" });
}

function evaluate(raw: any, mode: string) {
  const checks = {
    directWrapperExited: raw.success?.exitCode === 0 && raw.success?.elapsedMs < raw.success?.grandchildDelayMs,
    detachedChildSurvived: raw.success?.markerObserved === true && raw.success?.grandchildAliveAfterWrapper === true,
    failureCodePreserved: raw.failure?.exitCode === 23,
    controllerDirectWait: raw.source?.directWaitForExit === true && raw.source?.launchUsesDirectOnly === true,
    nonLaunchStillSynchronous: raw.source?.nonLaunchStartProcessWait === true,
    invokerPopupPreserved: raw.source?.popupPreserved === true,
    recordedIdentityTermination: raw.source?.recordedIdentityTermination === true,
    cleanupComplete: raw.cleanup?.complete === true,
  };
  return { schemaVersion: 1, mode, passed: Object.values(checks).every(Boolean), checks, liveCalls: mode === "replay" ? 0 : undefined };
}

async function capture(options: any) {
  if (fs.existsSync(options.evidenceRoot)) throw new Error("Evidence root already exists");
  const fixture = fs.mkdtempSync(path.join(os.tmpdir(), "opencode-handoff-"));
  const marker = path.join(fixture, "marker.json");
  const grandchild = path.join(fixture, "grandchild.js");
  const parent = path.join(fixture, "parent.js");
  const failure = path.join(fixture, "failure.js");
  fs.writeFileSync(grandchild, `const fs=require('node:fs'); setTimeout(()=>{fs.writeFileSync(${JSON.stringify(marker)}, JSON.stringify({pid:process.pid}));},2000); setTimeout(()=>{},30000);\n`);
  fs.writeFileSync(parent, `const {spawn}=require('node:child_process'); const c=spawn(process.execPath,[${JSON.stringify(grandchild)}],{detached:true,stdio:'ignore'}); c.unref();\n`);
  fs.writeFileSync(failure, "process.exit(23);\n");
  const invoke = (script: string) => {
    const payload = Buffer.from(JSON.stringify({ executable: process.execPath, script }), "utf8").toString("base64");
    const powerShell = `$payload=[Text.Encoding]::UTF8.GetString([Convert]::FromBase64String('${payload}'))|ConvertFrom-Json; $sw=[Diagnostics.Stopwatch]::StartNew(); $p=Start-Process -FilePath $payload.executable -ArgumentList ('"'+$payload.script+'"') -PassThru -WindowStyle Hidden; $p.WaitForExit(); $sw.Stop(); [ordered]@{exitCode=[int]$p.ExitCode;elapsedMs=[int]$sw.ElapsedMilliseconds}|ConvertTo-Json -Compress`;
    const result = spawnSync("powershell.exe", ["-NoLogo", "-NoProfile", "-NonInteractive", "-Command", powerShell], { encoding: "utf8", windowsHide: true });
    if (result.error || result.status !== 0) throw new Error("PowerShell handoff fixture failed", { cause: result.error });
    return JSON.parse(result.stdout.trim());
  };
  const success = invoke(parent);
  const deadline = Date.now() + 10_000;
  while (!fs.existsSync(marker) && Date.now() < deadline) await new Promise((resolve) => setTimeout(resolve, 100));
  const markerValue = fs.existsSync(marker) ? JSON.parse(fs.readFileSync(marker, "utf8")) : null;
  const alive = markerValue ? spawnSync("powershell.exe", ["-NoProfile", "-Command", `if (Get-Process -Id ${markerValue.pid} -ErrorAction SilentlyContinue) { exit 0 } else { exit 1 }`], { windowsHide: true }).status === 0 : false;
  const source = fs.readFileSync(controllerPath, "utf8");
  const raw: any = {
    schemaVersion: 1,
    candidateId: options.candidateId,
    source: {
      path: path.relative(root, controllerPath),
      sha256: sha256(source),
      directWaitForExit: source.includes("if ([bool]$payload.directProcessOnly) { $process.WaitForExit() }"),
      launchUsesDirectOnly: source.includes('elevateInvocation(["launch", "--repository", repository], true)'),
      nonLaunchStartProcessWait: source.includes("-Verb RunAs -WindowStyle Hidden -Wait -PassThru"),
      popupPreserved: source.includes("OpenCode workstation command failed. See"),
      recordedIdentityTermination: source.includes("function terminateRecordedProcess(expected)") && source.includes("if (!processIdentityMatches(observed, expected))") && source.includes("terminateRecordedProcess(expected)"),
    },
    success: { ...success, grandchildDelayMs: 2000, markerObserved: markerValue != null, grandchildAliveAfterWrapper: alive },
    failure: invoke(failure),
  };
  if (markerValue?.pid) {
    spawnSync("taskkill.exe", ["/PID", String(markerValue.pid), "/T", "/F"], { windowsHide: true });
  }
  fs.rmSync(fixture, { recursive: true, force: true });
  raw.cleanup = { complete: !fs.existsSync(fixture) };
  const evaluation = evaluate(raw, "capture");
  writeNew(path.join(options.evidenceRoot, "raw.json"), raw);
  writeNew(path.join(options.evidenceRoot, "evaluation.json"), evaluation);
  process.stdout.write(`${JSON.stringify(evaluation, null, 2)}\n`);
  if (!evaluation.passed) process.exitCode = 1;
}

async function main() {
  const options: any = parse(process.argv.slice(2));
  if (options.help) {
    process.stdout.write("Provider-free direct-process handoff capture/replay.\n");
    return;
  }
  if (options.mode === "capture") return capture(options);
  const raw = JSON.parse(fs.readFileSync(path.join(options.inputRoot, "raw.json"), "utf8"));
  const evaluation = evaluate(raw, "replay");
  writeNew(path.join(options.evidenceRoot, "evaluation.json"), evaluation);
  process.stdout.write(`${JSON.stringify(evaluation, null, 2)}\n`);
  if (!evaluation.passed) process.exitCode = 1;
}

main().catch((error) => { process.stderr.write(`${error.stack ?? error}\n`); process.exitCode = 1; });
