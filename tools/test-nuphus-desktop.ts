import assert from "node:assert/strict";
import { spawn, spawnSync, type ChildProcessWithoutNullStreams } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { once } from "node:events";
import test from "node:test";
import { fileURLToPath } from "node:url";
import {
  exactBlock,
  guardedRollback,
  mcpClient,
  privacySafe,
  sameNotepadIdentity,
  sameNotepadWindow,
  screenshotFact,
  toolValue,
} from "./proofs/nuphus-desktop.ts";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const runner = path.join(root, "tools", "proofs", "nuphus-desktop.ts");
const localInstructions = path.join(root, "global", "opencode.local.instructions.md");
const digest = (value: string): string => crypto.createHash("sha256").update(value).digest("hex");

function rpcFixture(): ChildProcessWithoutNullStreams {
  const script = String.raw`
let buffer = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => {
  buffer += chunk;
  for (;;) {
    const index = buffer.indexOf("\n");
    if (index < 0) break;
    const line = buffer.slice(0, index).trim();
    buffer = buffer.slice(index + 1);
    if (!line) continue;
    const request = JSON.parse(line);
    if (request.method === "hang") continue;
    const response = request.method === "error"
      ? { jsonrpc: "2.0", id: request.id, error: { code: -32000, message: "fixture failure" } }
      : { jsonrpc: "2.0", id: request.id, result: { content: [{ type: "text", text: JSON.stringify({ width: 2520, height: 1680 }) }] } };
    const serialized = JSON.stringify(response) + "\n";
    process.stdout.write(serialized.slice(0, 7));
    setTimeout(() => process.stdout.write(serialized.slice(7)), 5);
  }
});
`;
  return spawn(process.execPath, ["-e", script], { stdio: ["pipe", "pipe", "pipe"], windowsHide: true });
}

async function stopFixture(child: ChildProcessWithoutNullStreams): Promise<void> {
  if (child.exitCode != null || child.signalCode != null) return;
  child.kill();
  await once(child, "exit");
}

test("CLI option validation is fail-closed and help is effect-free", () => {
  const help = spawnSync(process.execPath, [runner, "--help"], { cwd: root, encoding: "utf8", windowsHide: true });
  assert.equal(help.status, 0);
  assert.match(help.stdout, /--mode absent/);
  const invalid = spawnSync(process.execPath, [runner, "--mode", "unknown"], { cwd: root, encoding: "utf8", windowsHide: true });
  assert.notEqual(invalid.status, 0);
  assert.match(invalid.stderr, /--mode must be/);
});

test("early capture failure keeps mode identity, cause, and privacy", () => {
  const fixture = fs.mkdtempSync(path.join(os.tmpdir(), "nuphus-failure-test-"));
  const evidenceRoot = path.join(fixture, "evidence");
  try {
    const result = spawnSync(process.execPath, [
      runner,
      "--mode", "config",
      "--candidate-id", "failure-fixture",
      "--config-dir", root,
      "--input-root", path.join(fixture, "missing"),
      "--evidence-root", evidenceRoot,
    ], { cwd: root, encoding: "utf8", windowsHide: true });
    assert.notEqual(result.status, 0);
    const raw = JSON.parse(fs.readFileSync(path.join(evidenceRoot, "raw.json"), "utf8"));
    assert.equal(raw.proofKind, "nuphus-desktop-config");
    assert.equal(raw.privacySafe, true);
    assert.match(raw.failure.message, /does not contain raw\.json/);
  } finally {
    fs.rmSync(fixture, { force: true, recursive: true });
  }
});

test("JSON-RPC framing preserves success, error, and timeout causes", async () => {
  const child = rpcFixture();
  const client = mcpClient(child);
  try {
    const success = toolValue(await client.request("success", {}, 5_000)) as Record<string, unknown>;
    assert.deepEqual(success, { height: 1680, width: 2520 });
    await assert.rejects(client.request("error", {}, 5_000), /fixture failure/);
    await assert.rejects(client.request("hang", {}, 100), /timed out after 100ms/);
  } finally {
    await stopFixture(child);
  }
});

test("saved PNG evidence is accepted while text-base64 is not visual proof", () => {
  const fixture = fs.mkdtempSync(path.join(os.tmpdir(), "nuphus-png-test-"));
  const png = path.join(fixture, "proof.png");
  try {
    fs.writeFileSync(png, Buffer.from([137, 80, 78, 71, 13, 10, 26, 10, 1]));
    const fact = screenshotFact("proof.png", png, { height: 1, width: 1 });
    assert.equal(fact.pngSignature, true);
    assert.equal(privacySafe(fact, [fixture]), true);
    assert.equal(privacySafe("data:image/png;base64,AAAA"), false);
    assert.equal(privacySafe("iVBORw0KGgo"), false);
  } finally {
    fs.rmSync(fixture, { force: true, recursive: true });
  }
});

test("exact rollback preserves unrelated bytes and rejects drift", () => {
  const baseline = "owner=unchanged\r\n\r\nnext=true\r\n";
  const block = "\r\nNUPHUS=true\r\n";
  const candidate = `owner=unchanged${block}\r\n\r\nnext=true\r\n`;
  assert.equal(exactBlock(candidate, block.replaceAll("\r\n", "\n"), "fixture").occurrences, 1);
  assert.equal(guardedRollback(candidate, digest(candidate), block, digest(baseline)), baseline);
  assert.throws(() => guardedRollback(`${candidate}drift`, digest(candidate), block, digest(baseline)), /current identity drifted/);
  assert.throws(() => guardedRollback(`${candidate}drift`, digest(`${candidate}drift`), block, digest(baseline)), /recorded preimage/);
});

test("Notepad process and window identity reject stale targets", () => {
  const createdAt = "2026-08-30T00:00:00.0000000Z";
  assert.equal(sameNotepadIdentity({ createdAt, name: "Notepad.exe", pid: 10 }, 10, createdAt), true);
  assert.equal(sameNotepadIdentity({ createdAt, name: "Notepad.exe", pid: 11 }, 10, createdAt), false);
  assert.equal(sameNotepadIdentity(null, 10, createdAt), false);
  assert.equal(sameNotepadIdentity({ createdAt: "2026-08-30T00:00:01.0000000Z", name: "Notepad.exe", pid: 10 }, 10, createdAt), false);
  assert.equal(sameNotepadIdentity({ createdAt, name: "explorer.exe", pid: 10 }, 10, createdAt), false);
  const state = { hwnd: 20, pid: 10, title: "proof.txt - Notepad" };
  assert.equal(sameNotepadWindow({ hwnd: 20, process_id: 10, title: state.title }, state), true);
  assert.equal(sameNotepadWindow({ hwnd: 21, process_id: 10, title: state.title }, state), false);
  assert.equal(sameNotepadWindow({ hwnd: 20, process_id: 11, title: state.title }, state), false);
  assert.equal(sameNotepadWindow({ hwnd: 20, process_id: 10, title: "other" }, state), false);
});

test("durable guidance positions Nuphus for UI work and binds visual safety", () => {
  const source = fs.readFileSync(runner, "utf8");
  const loadedGuidance = fs.readFileSync(localInstructions, "utf8");
  for (const content of [source, loadedGuidance]) {
    assert.match(content, /During UI development or debugging, use Nuphus/);
    assert.match(content, /visible only in the running interface/);
    assert.match(content, /Do not replace source, logs, tests, or application-native diagnostics/);
  }
  assert.match(source, /desktop_window_screenshot/);
  assert.match(source, /never Read a full-desktop image containing unrelated windows/);
  assert.match(source, /do not retry it unchanged/);
  assert.match(source, /Do not call or configure \\`desktop_vision\\`/);
  assert.doesNotMatch(source, /prefer \\`desktop_perceive\\` for coordinates/);
});
