#!/usr/bin/env node
import { spawn, spawnSync, type ChildProcessWithoutNullStreams } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  createRoutedProofSessions,
  deleteProofSessions,
  proofClient,
  requestData,
  waitForProofRoute,
  type RoutedProofSessions,
} from "./lib/opencode-proof-client.ts";

type Mode = "preflight" | "capture" | "replay";
type Options = {
  candidateId: string;
  evidenceRoot: string;
  fixtureRoot: string | null;
  inputRoot: string | null;
  mode: Mode;
};
type JsonRecord = Record<string, unknown>;
type ServerProcess = {
  child: ChildProcessWithoutNullStreams;
  stderr: string[];
  stdout: string[];
  url: string;
};

const sourceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const usage = [
  "Usage:",
  "  node tools/proofs/sdet-unattended-edit.ts --mode preflight|capture|replay --candidate-id <id> --evidence-root <absolute-new-path> [--input-root <capture-path> --fixture-root <proof-owned-path>]",
  "",
  "Modes:",
  "  preflight  Resolve the installed SDET child route without a model call.",
  "  capture    Invoke the SDET child once and prove an unattended scoped edit.",
  "  replay     Evaluate one preserved capture and completed local cleanup without a model call.",
].join("\n");

function parseArgs(args: string[]): Options | null {
  if (args.length === 1 && (args[0] === "--help" || args[0] === "-h")) return null;
  let candidateId: string | null = null;
  let evidenceRoot: string | null = null;
  let fixtureRoot: string | null = null;
  let inputRoot: string | null = null;
  let mode: Mode | null = null;
  for (let index = 0; index < args.length; index++) {
    const flag = args[index];
    const value = args[index + 1];
    if (flag === "--candidate-id" && value != null) candidateId = value;
    else if (flag === "--evidence-root" && value != null) evidenceRoot = path.resolve(value);
    else if (flag === "--fixture-root" && value != null) fixtureRoot = path.resolve(value);
    else if (flag === "--input-root" && value != null) inputRoot = path.resolve(value);
    else if (flag === "--mode" && (value === "preflight" || value === "capture" || value === "replay")) mode = value;
    else throw new Error(`Unknown or incomplete option: ${flag}`);
    index++;
  }
  if (candidateId == null || evidenceRoot == null || mode == null) throw new Error(usage);
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]{0,99}$/.test(candidateId)) {
    throw new Error("--candidate-id must be a safe identifier");
  }
  if (!path.isAbsolute(evidenceRoot)) throw new Error("--evidence-root must be absolute");
  if (mode === "replay" && (inputRoot == null || fixtureRoot == null)) {
    throw new Error("Replay requires --input-root and --fixture-root");
  }
  if (mode !== "replay" && (inputRoot != null || fixtureRoot != null)) {
    throw new Error("--input-root and --fixture-root are replay-only options");
  }
  return { candidateId, evidenceRoot, fixtureRoot, inputRoot, mode };
}

function record(value: unknown): JsonRecord | null {
  return value != null && typeof value === "object" && !Array.isArray(value) ? value as JsonRecord : null;
}

function stable(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stable);
  if (value == null || typeof value !== "object") return value;
  const input = value as JsonRecord;
  return Object.fromEntries(Object.keys(input).sort().map((key) => [key, stable(input[key])]));
}

function stableJson(value: unknown): string {
  return `${JSON.stringify(stable(value), null, 2)}\n`;
}

function sha256(value: string | Buffer): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function writeNew(file: string, value: unknown): void {
  fs.writeFileSync(file, stableJson(value), { encoding: "utf8", flag: "wx" });
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function freePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      const port = typeof address === "object" && address != null ? address.port : 0;
      server.close((error) => error == null ? resolve(port) : reject(error));
    });
  });
}

async function startOpenCode(project: string, runtimeRoot: string): Promise<ServerProcess> {
  const port = await freePort();
  const child = spawn("opencode", [
    "serve", "--hostname", "127.0.0.1", "--port", String(port), "--print-logs", "--log-level", "INFO",
  ], {
    cwd: project,
    env: {
      ...process.env,
      OPENCODE_CONFIG_DIR: path.join(sourceRoot, "global"),
      OPENCODE_PURE: "1",
      XDG_CACHE_HOME: path.join(runtimeRoot, "cache"),
      XDG_STATE_HOME: path.join(runtimeRoot, "state"),
    },
    shell: false,
    stdio: "pipe",
  });
  const stdout: string[] = [];
  const stderr: string[] = [];
  child.stdout.on("data", (chunk) => stdout.push(String(chunk)));
  child.stderr.on("data", (chunk) => stderr.push(String(chunk)));
  const url = `http://127.0.0.1:${port}`;
  const client = proofClient(url, project);
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    if (child.exitCode != null) throw new Error(`OpenCode server exited before readiness: ${child.exitCode}`);
    try {
      await requestData(client.v2.agent.list({ location: { directory: project } }) as Promise<unknown>, "server agent readiness");
      await requestData(client.session.status({ directory: project }) as Promise<unknown>, "server session readiness");
      return { child, stderr, stdout, url };
    } catch {
      await delay(100);
    }
  }
  await stopOpenCode({ child, stderr, stdout, url });
  throw new Error("OpenCode server readiness timed out");
}

async function stopOpenCode(server: ServerProcess): Promise<void> {
  if (server.child.exitCode != null) return;
  const exited = new Promise<void>((resolve) => server.child.once("exit", () => resolve()));
  server.child.kill();
  if (await Promise.race([exited.then(() => true), delay(10_000).then(() => false)])) return;
  if (process.platform === "win32" && server.child.pid != null) {
    spawnSync("taskkill", ["/PID", String(server.child.pid), "/T", "/F"], { shell: false, stdio: "ignore" });
  } else {
    server.child.kill("SIGKILL");
  }
  if (!await Promise.race([exited.then(() => true), delay(10_000).then(() => false)])) {
    throw new Error("OpenCode server did not stop after forced termination");
  }
}

function permissionRows(value: unknown): JsonRecord[] {
  if (Array.isArray(value)) return value.map(record).filter((row): row is JsonRecord => row != null);
  const rows = record(value)?.data;
  return Array.isArray(rows) ? rows.map(record).filter((row): row is JsonRecord => row != null) : [];
}

async function pendingPermissions(client: ReturnType<typeof proofClient>, project: string, sessionID: string): Promise<JsonRecord[]> {
  const payload = await requestData<unknown>(
    client.permission.list({ directory: project }) as Promise<unknown>,
    "permission list",
  );
  return permissionRows(payload).filter((row) => row.sessionID === sessionID);
}

async function promptWithoutPermissionRequest(
  client: ReturnType<typeof proofClient>,
  project: string,
  sessions: RoutedProofSessions,
  prompt: string,
  route: Awaited<ReturnType<typeof waitForProofRoute>>,
): Promise<{ info: JsonRecord; parts: unknown[]; permissionPolls: number }> {
  let stopped = false;
  let permissionPolls = 0;
  const promptPromise = requestData<{ info: JsonRecord; parts: unknown[] }>(client.session.prompt({
    agent: route.agent,
    directory: project,
    model: route.model,
    parts: [{ type: "text", text: prompt, synthetic: true }],
    sessionID: sessions.child.id,
    ...(route.variant == null ? {} : { variant: route.variant }),
  }) as Promise<unknown>, "SDET proof prompt");
  const monitor = (async (): Promise<never> => {
    const deadline = Date.now() + 180_000;
    while (!stopped) {
      permissionPolls++;
      const pending = await pendingPermissions(client, project, sessions.child.id);
      if (pending.length > 0) {
        await client.session.abort({ directory: project, sessionID: sessions.child.id });
        const names = [...new Set(pending.map((row) => String(row.permission ?? "unknown")))].sort();
        throw new Error(`SDET emitted an interactive permission request: ${names.join(",")}`);
      }
      if (Date.now() >= deadline) {
        await client.session.abort({ directory: project, sessionID: sessions.child.id });
        throw new Error("SDET proof prompt timed out");
      }
      await delay(50);
    }
    throw new Error("permission monitor stopped");
  })();
  try {
    const result = await Promise.race([promptPromise, monitor]);
    stopped = true;
    await monitor.catch((error) => {
      if (!(error instanceof Error) || error.message !== "permission monitor stopped") throw error;
    });
    return { ...result, permissionPolls };
  } catch (error) {
    stopped = true;
    await client.session.abort({ directory: project, sessionID: sessions.child.id });
    await monitor.catch(() => undefined);
    await promptPromise.catch(() => undefined);
    throw error;
  }
}

function fileManifest(root: string): Array<{ bytes: number; path: string; sha256: string }> {
  const rows: Array<{ bytes: number; path: string; sha256: string }> = [];
  const visit = (directory: string): void => {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const absolute = path.join(directory, entry.name);
      if (entry.isDirectory()) visit(absolute);
      else if (entry.isFile()) {
        const content = fs.readFileSync(absolute);
        rows.push({ bytes: content.length, path: path.relative(root, absolute).replaceAll("\\", "/"), sha256: sha256(content) });
      }
    }
  };
  visit(root);
  return rows;
}

function toolFacts(messages: Array<{ parts?: unknown[] }>): Array<{ status: string; tool: string }> {
  return messages.flatMap((message) => Array.isArray(message.parts) ? message.parts : []).flatMap((part) => {
    const row = record(part);
    if (row?.type !== "tool" || typeof row.tool !== "string") return [];
    return [{ status: String(record(row.state)?.status ?? "unknown"), tool: row.tool }];
  });
}

function replayPreservedCapture(options: Options, approvedTempParent: string): { pass: boolean; raw: JsonRecord } {
  const inputRoot = options.inputRoot!;
  const fixtureRoot = options.fixtureRoot!;
  const inputRawPath = path.join(inputRoot, "raw.json");
  if (!fs.existsSync(inputRawPath)) throw new Error("Replay input raw.json is missing");
  const inputText = fs.readFileSync(inputRawPath, "utf8");
  const input = JSON.parse(inputText) as JsonRecord;
  const facts = record(input.facts) ?? {};
  const cleanup = record(input.cleanup) ?? {};
  const files = Array.isArray(facts.files) ? facts.files.map(record).filter((row): row is JsonRecord => row != null) : [];
  const tools = Array.isArray(facts.toolFacts) ? facts.toolFacts.map(record).filter((row): row is JsonRecord => row != null) : [];
  const sourceRows = Array.isArray(input.sources) ? input.sources.map(record).filter((row): row is JsonRecord => row != null) : [];
  const productSourcesCurrent = [
    "global/agents/sdet-quality-engineer.md",
    "tools/contracts/sdet-quality-engineer.ts",
  ].every((relative) => sourceRows.some((row) =>
    row.path === relative && row.sha256 === sha256(fs.readFileSync(path.join(sourceRoot, relative))),
  ));
  const fixtureInsideApprovedTemp = path.resolve(fixtureRoot).startsWith(`${path.resolve(approvedTempParent)}${path.sep}`);
  const fixtureAbsent = fixtureInsideApprovedTemp && !fs.existsSync(fixtureRoot);
  const factsPass =
    input.candidateId === options.candidateId &&
    facts.childAgent === "sdet-quality-engineer" &&
    facts.childParentExact === true &&
    facts.correlatedChildren === 1 &&
    facts.editCompleted === true &&
    facts.outputExact === true &&
    facts.pendingBefore === 0 &&
    facts.pendingAfter === 0 &&
    files.length === 1 &&
    files[0]?.path === "tests/permission-proof.txt" &&
    tools.some((row) => ["apply_patch", "edit", "write"].includes(String(row.tool)) && row.status === "completed") &&
    productSourcesCurrent;
  const cleanupPass = cleanup.sessionsDeleted === true && cleanup.serverStopped === true && fixtureAbsent;
  const pass = factsPass && cleanupPass;
  return {
    pass,
    raw: {
      candidateId: options.candidateId,
      cleanupPass,
      factsPass,
      fixtureAbsent,
      fixtureInsideApprovedTemp,
      inputRawSha256: sha256(inputText),
      productSourcesCurrent,
      schemaVersion: 1,
    },
  };
}

const parsedOptions = parseArgs(process.argv.slice(2));
if (parsedOptions == null) {
  console.log(usage);
  process.exit(0);
  throw new Error("unreachable");
}
const options: Options = parsedOptions;

if (fs.existsSync(options.evidenceRoot)) throw new Error("Evidence root already exists");
const evidenceParent = path.dirname(options.evidenceRoot);
if (!fs.existsSync(evidenceParent) || !fs.statSync(evidenceParent).isDirectory()) {
  throw new Error("Evidence root parent must already exist");
}
fs.mkdirSync(options.evidenceRoot, { recursive: false });

const tempParent = path.join(os.tmpdir(), "opencode");
if (!fs.existsSync(tempParent) || !fs.statSync(tempParent).isDirectory()) {
  throw new Error(`Approved OpenCode temp parent is missing: ${tempParent}`);
}
if (options.mode === "replay") {
  const replay = replayPreservedCapture(options, tempParent);
  writeNew(path.join(options.evidenceRoot, "raw.json"), replay.raw);
  writeNew(path.join(options.evidenceRoot, "evaluation.json"), {
    candidateId: options.candidateId,
    mode: options.mode,
    schemaVersion: 1,
    status: replay.pass ? "pass" : "fail",
  });
  console.log(stableJson({ candidateId: options.candidateId, evidenceRoot: "<evidence-root>", mode: options.mode, status: replay.pass ? "pass" : "fail" }).trimEnd());
  if (!replay.pass) throw new Error("Preserved SDET capture replay failed");
  process.exit(0);
  throw new Error("unreachable");
}
const runtimeRoot = fs.mkdtempSync(path.join(tempParent, `sdet-unattended-${options.mode}-`));
const project = path.join(runtimeRoot, "project");
fs.mkdirSync(path.join(project, "tests"), { recursive: true });

let server: ServerProcess | null = null;
let sessions: RoutedProofSessions | null = null;
let failure: unknown = null;
let facts: JsonRecord = {};
const cleanup = { fixtureDeleted: false, serverStopped: false, sessionsDeleted: false };
try {
  server = await startOpenCode(project, runtimeRoot);
  const client = proofClient(server.url, project);
  const route = await waitForProofRoute(client, project, "sdet-quality-engineer", 10_000);
  sessions = await createRoutedProofSessions(client, project, route, "SDET unattended edit proof");
  const child = await requestData<JsonRecord>(client.session.get({ directory: project, sessionID: sessions.child.id }) as Promise<unknown>, "SDET child readback");
  const children = await requestData<JsonRecord[]>(client.session.children({ directory: project, sessionID: sessions.root.id }) as Promise<unknown>, "SDET child correlation");
  const beforePending = await pendingPermissions(client, project, sessions.child.id);
  facts = {
    childAgent: child.agent ?? null,
    childParentExact: child.parentID === sessions.root.id,
    correlatedChildren: children.filter((row) => row.id === sessions!.child.id).length,
    mode: options.mode,
    model: `${route.model.providerID}/${route.model.modelID}/${route.variant ?? "default"}`,
    pendingBefore: beforePending.length,
  };
  if (facts.childAgent !== "sdet-quality-engineer" || facts.childParentExact !== true || facts.correlatedChildren !== 1 || facts.pendingBefore !== 0) {
    throw new Error("SDET route preflight failed");
  }

  if (options.mode === "capture") {
    const expected = "SDET_EDIT_ALLOWED\n";
    const prompt = [
      "Original requirement: SDET test-only edits must run without an operator permission prompt while all non-edit restrictions remain denied.",
      `Candidate Reference: ${options.candidateId}. Current RC: development.`,
      "Current Runtime Proof: installed permission readback resolves SDET edit=allow and preserves every declared deny.",
      "Operating envelope: this disposable local project only. Exact test-only write scope: tests/permission-proof.txt. No production files exist.",
      "Create exactly tests/permission-proof.txt with ASCII text SDET_EDIT_ALLOWED followed by one newline using the edit tool, then read it.",
      "Do not create or modify another file. Do not use bash, network, credentials, external directories, delegation, skills, todos, or questions.",
      "If edit requests approval or is unavailable, return Action: blocked without another route. Otherwise return the required SDET_QUALITY_REPORT.",
    ].join("\n");
    const result = await promptWithoutPermissionRequest(client, project, sessions, prompt, route);
    if (result.info.error != null) throw new Error("SDET proof returned an assistant error");
    const messages = await requestData<Array<{ parts?: unknown[] }>>(client.session.messages({ directory: project, sessionID: sessions.child.id }) as Promise<unknown>, "SDET proof messages");
    const tools = toolFacts(messages);
    const output = path.join(project, "tests", "permission-proof.txt");
    const pendingAfter = await pendingPermissions(client, project, sessions.child.id);
    const manifest = fileManifest(project);
    const outputExact = fs.existsSync(output) && fs.readFileSync(output, "utf8") === expected;
    const editCompleted = tools.some((tool) => ["apply_patch", "edit", "write"].includes(tool.tool) && tool.status === "completed");
    facts = {
      ...facts,
      editCompleted,
      files: manifest,
      outputExact,
      pendingAfter: pendingAfter.length,
      permissionPolls: result.permissionPolls,
      toolFacts: tools,
    };
    if (!outputExact || manifest.length !== 1 || manifest[0]?.path !== "tests/permission-proof.txt" || !editCompleted || pendingAfter.length !== 0) {
      throw new Error("SDET unattended edit outcome failed");
    }
  }
} catch (error) {
  failure = error;
} finally {
  if (server != null) {
    const client = proofClient(server.url, project);
    if (sessions != null) {
      try {
        await deleteProofSessions(client, project, sessions);
        cleanup.sessionsDeleted = true;
      } catch (error) {
        failure ??= error;
      }
    }
    try {
      await stopOpenCode(server);
      cleanup.serverStopped = true;
    } catch (error) {
      failure ??= error;
    }
  }
  try {
    fs.rmSync(runtimeRoot, { force: true, maxRetries: 10, recursive: true, retryDelay: 100 });
    cleanup.fixtureDeleted = !fs.existsSync(runtimeRoot);
  } catch (error) {
    failure ??= error;
  }
}

const sourcePaths = [
  "global/agents/sdet-quality-engineer.md",
  "tools/contracts/sdet-quality-engineer.ts",
  "tools/proofs/lib/opencode-proof-client.ts",
  "tools/proofs/sdet-unattended-edit.ts",
];
const raw = {
  candidateId: options.candidateId,
  cleanup,
  environment: {
    node: process.version,
    opencode: spawnSync("opencode", ["--version"], { encoding: "utf8", shell: false }).stdout.trim(),
    platform: process.platform,
  },
  facts,
  failure: failure instanceof Error ? failure.message.slice(0, 500) : failure == null ? null : String(failure).slice(0, 500),
  invocation: ["node", "tools/proofs/sdet-unattended-edit.ts", "--mode", options.mode, "--candidate-id", options.candidateId, "--evidence-root", "<evidence-root>"],
  schemaVersion: 1,
  sources: sourcePaths.map((relative) => ({ path: relative, sha256: sha256(fs.readFileSync(path.join(sourceRoot, relative))) })),
};
const pass = failure == null && cleanup.fixtureDeleted && cleanup.serverStopped && cleanup.sessionsDeleted;
writeNew(path.join(options.evidenceRoot, "raw.json"), raw);
writeNew(path.join(options.evidenceRoot, "evaluation.json"), {
  candidateId: options.candidateId,
  mode: options.mode,
  schemaVersion: 1,
  status: pass ? "pass" : "fail",
});
console.log(stableJson({ candidateId: options.candidateId, evidenceRoot: "<evidence-root>", mode: options.mode, status: pass ? "pass" : "fail" }).trimEnd());
if (!pass) throw failure instanceof Error ? failure : new Error("SDET unattended edit proof failed");
