#!/usr/bin/env bun
import { spawn, spawnSync } from "node:child_process";
import type { ChildProcessWithoutNullStreams } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import {
  isolatedProofServerEnvironment,
  probeProofServer,
  proofClient,
  proofErrorFacts,
  PROOF_SERVER_CONFIG_LOAD_MS,
  PROOF_SERVER_PLUGIN_READY_MS,
  PROOF_SERVER_READINESS_MS,
  proofServerStartupFacts,
  requestData,
  seedProofConfigDependencies,
  waitForProofRoute,
} from "./lib/opencode-proof-client.ts";
import { removeProofFixture, stopProofProcessTree } from "./lib/proof-process-cleanup.ts";

type Options = {
  candidateId: string;
  evidenceRoot: string;
  help: boolean;
  inputRoot: string | null;
  mode: "capture" | "replay";
  scenario: "ambiguous" | "continue" | "interrupted" | "owner-required" | "propose" | "transient";
};

type ProcessEvidence = {
  argv: string[];
  exitCode: number | null;
  signal: string | null;
  stderr: string;
  stdout: string;
};

type ServerProcess = {
  child: ChildProcessWithoutNullStreams;
  readyMs: number;
  stderr: string[];
  stdout: string[];
  url: string;
};

const sourceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const executor = path.join(sourceRoot, "global", "bin", "roadmap-mission-session-executor.ts");

function usage(): string {
  return [
    "Usage:",
    "  bun tools/proofs/roadmap-mission-runtime.ts --mode capture --scenario <continue|ambiguous|propose|owner-required|transient|interrupted> --candidate-id <id> --evidence-root <absolute-new-path>",
    "  bun tools/proofs/roadmap-mission-runtime.ts --mode replay --candidate-id <id> --input-root <capture-path> --evidence-root <absolute-new-path>",
  ].join("\n");
}

function required(args: string[], index: number, option: string): string {
  const value = args[index + 1];
  if (value == null || value.trim() === "" || value.startsWith("--")) throw new Error(`Missing value for ${option}`);
  return value;
}

function options(args: string[]): Options {
  if (args.length === 1 && (args[0] === "--help" || args[0] === "-h")) {
    return { candidateId: "help", evidenceRoot: sourceRoot, help: true, inputRoot: null, mode: "capture", scenario: "continue" };
  }
  let candidateId = "";
  let evidenceRoot = "";
  let inputRoot = "";
  let mode = "";
  let scenario = "";
  for (let index = 0; index < args.length; index++) {
    const arg = args[index];
    if (arg === "--candidate-id") {
      candidateId = required(args, index, arg);
      index++;
    } else if (arg === "--evidence-root") {
      evidenceRoot = required(args, index, arg);
      index++;
    } else if (arg === "--mode") {
      mode = required(args, index, arg);
      index++;
    } else if (arg === "--input-root") {
      inputRoot = required(args, index, arg);
      index++;
    } else if (arg === "--scenario") {
      scenario = required(args, index, arg);
      index++;
    } else {
      throw new Error(`Unknown option: ${arg}`);
    }
  }
  if (mode !== "capture" && mode !== "replay") throw new Error("--mode must be capture or replay");
  if (mode === "replay" && scenario === "") scenario = "continue";
  if (!( ["ambiguous", "continue", "interrupted", "owner-required", "propose", "transient"] as string[]).includes(scenario)) {
    throw new Error("--scenario is unsupported");
  }
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]{0,99}$/.test(candidateId)) throw new Error("--candidate-id must be a safe identifier");
  if (!path.isAbsolute(evidenceRoot)) throw new Error("--evidence-root must be absolute");
  if (mode === "replay" && !path.isAbsolute(inputRoot)) throw new Error("replay requires absolute --input-root");
  if (mode === "capture" && inputRoot !== "") throw new Error("capture does not accept --input-root");
  return {
    candidateId,
    evidenceRoot: path.resolve(evidenceRoot),
    help: false,
    inputRoot: inputRoot === "" ? null : path.resolve(inputRoot),
    mode,
    scenario: scenario as Options["scenario"],
  };
}

function stableValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stableValue);
  if (value == null || typeof value !== "object") return value;
  const input = value as Record<string, unknown>;
  return Object.fromEntries(Object.keys(input).sort().map((key) => [key, stableValue(input[key])]));
}

function json(value: unknown): string {
  return `${JSON.stringify(stableValue(value), null, 2)}\n`;
}

function sanitizeLog(text: string, replacements: Array<[string, string]>): string {
  return replacements.reduce((output, [value, placeholder]) => output
    .replaceAll(value, placeholder)
    .replaceAll(value.replaceAll("\\", "\\\\"), placeholder), text);
}

function serverDiagnostics(
  server: ServerProcess,
  replacements: Array<[string, string]>,
): string {
  const lines = `${server.stderr.join("")}\n${server.stdout.join("")}`.split(/\r?\n/);
  const selected = lines.filter((line) =>
    /\b(?:level=(?:ERROR|WARN)|error|failed|completion guard)\b/i.test(line) &&
    !line.includes("Command handled by roadmap mission launcher") &&
    !line.includes("Command handled by PTY plugin")
  );
  return sanitizeLog([...new Set(selected.slice(-100))].join("\n"), replacements).slice(-20_000);
}

function record(value: unknown): Record<string, unknown> | null {
  return value != null && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

function hash(file: string): string {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

function writeNew(file: string, content: string): void {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content, { encoding: "utf8", flag: "wx" });
}

function stage(evidenceRoot: string, name: string, detail: Record<string, unknown> = {}): void {
  fs.appendFileSync(path.join(evidenceRoot, "progress.jsonl"), `${JSON.stringify({ at: new Date().toISOString(), name, ...detail })}\n`, "utf8");
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

function contentText(value: unknown): string {
  if (typeof value === "string") return value;
  if (!Array.isArray(value)) return "";
  return value.map((part) => typeof part === "string" ? part : String(record(part)?.text ?? "")).join("\n");
}

function completion(text: string): Response {
  return Response.json({
    id: `chatcmpl_${crypto.randomUUID()}`,
    object: "chat.completion",
    created: Math.floor(Date.now() / 1_000),
    model: "proof-model",
    choices: [{ index: 0, message: { role: "assistant", content: text }, finish_reason: "stop" }],
    usage: { prompt_tokens: 10, completion_tokens: 10, total_tokens: 20 },
  });
}

function streamingCompletion(text: string): Response {
  const id = `chatcmpl_${crypto.randomUUID()}`;
  const created = Math.floor(Date.now() / 1_000);
  const chunks = [
    { id, object: "chat.completion.chunk", created, model: "proof-model", choices: [{ index: 0, delta: { role: "assistant", content: text }, finish_reason: null }] },
    { id, object: "chat.completion.chunk", created, model: "proof-model", choices: [{ index: 0, delta: {}, finish_reason: "stop" }] },
  ];
  return new Response(`${chunks.map((chunk) => `data: ${JSON.stringify(chunk)}\n\n`).join("")}data: [DONE]\n\n`, {
    headers: { "content-type": "text/event-stream" },
  });
}

function providerSimulator(scenario: Options["scenario"]) {
  let arbiterCalls = 0;
  let primaryCalls = 0;
  const requestKinds: string[] = [];
  const server = Bun.serve({
    hostname: "127.0.0.1",
    port: 0,
    async fetch(request) {
      const url = new URL(request.url);
      if (url.pathname.endsWith("/models")) {
        return Response.json({ object: "list", data: [{ id: "proof-model", object: "model", owned_by: "proof" }] });
      }
      if (!url.pathname.endsWith("/chat/completions")) return new Response("not found", { status: 404 });
      const body = await request.json() as Record<string, unknown>;
      const messages = Array.isArray(body.messages) ? body.messages.map(record).filter(Boolean) : [];
      const text = messages.map((message) => contentText(message?.content)).join("\n");
      const audit = text.match(/<completion_audit_(?:request|retry)>\s*([\s\S]*?)\s*<\/completion_audit_(?:request|retry)>/);
      let response: string;
      if (audit == null) {
        primaryCalls++;
        requestKinds.push("primary");
        if (scenario === "transient") {
          return Response.json({ error: { message: "temporary proof outage", type: "server_error" } }, { status: 503 });
        }
        response = "The disposable command fixture is complete. No tools or project edits are required.";
      } else {
        arbiterCalls++;
        requestKinds.push(`arbiter-${arbiterCalls}`);
        const input = JSON.parse(audit[1]) as Record<string, unknown>;
        const ownerRequired = scenario === "owner-required";
        response = JSON.stringify({
          schemaVersion: 1,
          auditID: input.auditID,
          rootSessionRef: input.rootSessionRef,
          inspectedRevision: input.inspectedRevision,
          verdict: ownerRequired ? "owner_required" : "allow_stop",
          confidence: "high",
          goalSummary: "Disposable roadmap command fixture complete",
          requirementMatrix: ownerRequired
            ? [{ evidenceRefs: [], requirementRef: "owner-boundary-proof", status: "owner_required" }]
            : [],
          unresolved: ownerRequired
            ? [{ evidenceGap: "Owner decision is intentionally absent", nextAction: "Stop the disposable campaign", nextEvidence: "New owner instruction", requirementRef: "owner-boundary-proof", stopCondition: "Owner instruction remains absent" }]
            : [],
          ownerBoundary: ownerRequired
            ? { decision: "Provide a new owner instruction", evidenceRefs: [], reason: "The synthetic scenario requires owner authority" }
            : null,
          questionAnswers: null,
          evidenceGaps: [],
          evidenceRefs: [],
          strategyAssessment: { fingerprint: "roadmap-runtime-proof", prohibitedStrategies: [], repeated: false, requiredRetryEvidence: [] },
        });
      }
      return body.stream === true ? streamingCompletion(response) : completion(response);
    },
  });
  return { facts: () => ({ arbiterCalls, primaryCalls, requestKinds }), server };
}

function writeConfig(configDir: string, dataDir: string, providerUrl: string): void {
  fs.mkdirSync(path.join(configDir, "agents"), { recursive: true });
  fs.mkdirSync(path.join(configDir, "commands"), { recursive: true });
  fs.copyFileSync(
    path.join(sourceRoot, "global", "agents", "session-completion-arbiter.md"),
    path.join(configDir, "agents", "session-completion-arbiter.md"),
  );
  for (const command of ["opsx-apply", "opsx-propose"]) {
    fs.copyFileSync(
      path.join(sourceRoot, "global", "commands", `${command}.md`),
      path.join(configDir, "commands", `${command}.md`),
    );
  }
  const bridge = pathToFileURL(path.join(sourceRoot, "global", "extensions", "opencode-pty-bridge.ts")).href;
  const guard = pathToFileURL(path.join(sourceRoot, "global", "extensions", "session-completion-guard.ts")).href;
  writeNew(path.join(configDir, "opencode.json"), json({
    $schema: "https://opencode.ai/config.json",
    model: "proof/proof-model",
    small_model: "proof/proof-model",
    permission: "allow",
    agent: {
      "session-completion-arbiter": { hidden: true, mode: "subagent", model: "proof/proof-model" },
    },
    provider: {
      proof: {
        npm: "@ai-sdk/openai-compatible",
        name: "Roadmap Runtime Proof",
        options: { apiKey: "proof-not-secret", baseURL: `${providerUrl}/v1`, maxRetries: 0 },
        models: { "proof-model": { name: "Proof Model", tool_call: true, limit: { context: 100000, output: 10000 } } },
      },
    },
    plugin: [bridge, [guard, {
      arbiterAgent: "session-completion-arbiter",
      arbiterPromptTimeoutMs: 5_000,
      auditWindow: { enabled: false, mode: "read-only-monitor", scope: "per-root", terminal: "powershell-shell" },
      certificateIssuers: ["roadmap-mission-session-executor"],
      certificateWaitMs: 5_000,
      enabled: true,
      initialDelayMs: 50,
      maxCycles: 3,
      maxDelayMs: 2_000,
      maxRequestBytes: 200_000,
      maxRetryAttempts: 1,
      maxWaitRechecks: 3,
      retainAuditSessions: 2,
      retryMultiplier: 1,
      settleMs: 50,
      statusToasts: false,
      strategyFallback: "docs/session-strategy-history",
      waitRecheckMs: 100,
    }]],
  }));
  seedProofConfigDependencies(configDir, path.join(sourceRoot, "global"));
  fs.mkdirSync(dataDir, { recursive: true });
}

function mission(scenario: Options["scenario"]): string {
  return json({
    allowedEffects: ["local-read", "local-write"],
    authorizationRefs: {},
    checkpoint: { localCommitAuthorized: false, mode: "evidence-only", workspace: "disposable" },
    evidencePath: "evidence/mission",
    missionId: "same-runtime-proof",
    roadmapPath: "docs/roadmap.md",
    schemaVersion: 1,
    slices: [{
      changeId: "change-a",
      dependsOn: [],
      effectClasses: ["local-read", "local-write"],
      id: "slice-a",
      operation: scenario === "propose" ? "propose" : "continue",
      outcome: "Complete the synthetic no-product-mutation command fixture.",
      ownedPaths: ["openspec/changes/change-a"],
    }],
    stopPolicy: { onExternalBlocked: true, onOwnerRequired: true, onUnknown: true },
    validationArgv: ["node", "tools/validate.mjs"],
    workflowOwner: { mode: "global-canonical" },
  });
}

function createApplyChange(project: string, complete: boolean): void {
  writeNew(path.join(project, "openspec", "config.yaml"), "schema: spec-driven\n");
  const change = path.join(project, "openspec", "changes", "change-a");
  writeNew(path.join(change, ".openspec.yaml"), "schema: spec-driven\ncreated: 2026-08-20\n");
  writeNew(path.join(change, "proposal.md"), [
    "## Why", "", "Prove deterministic terminal certification.", "",
    "## Outcome Capsule", "",
    "- **Outcome:** Complete one synthetic local task.",
    "- **Operating Envelope:** Disposable local fixture only.",
    "- **Non-Goals:** Network, credentials, remote state, deployment, or release.",
    "- **Non-Deferrable Invariants:** Exact task state and local containment.",
    "- **Observable Proof:** OpenSpec reports every accepted task complete.",
    "- **Material Residual Risks:** None outside the synthetic fixture.",
    "- **Stop Line:** Stop after deterministic task verification.", "",
    "## What Changes", "", "- Record one synthetic completed task.", "",
    "## Capabilities", "", "### New Capabilities", "", "- `synthetic-terminal`: Deterministic terminal proof.", "",
    "## Impact", "", "- Disposable OpenSpec artifacts only.", "",
  ].join("\n"));
  writeNew(path.join(change, "design.md"), "## Context\n\nUse deterministic OpenSpec task readback.\n\n## Goals / Non-Goals\n\nProve only the disposable task state.\n\n## Decisions\n\nReuse current OpenSpec instructions and validation.\n\n## Risks / Trade-offs\n\nNone outside the fixture.\n");
  writeNew(path.join(change, "tasks.md"), `## 1. Synthetic Task\n\n- [${complete ? "x" : " "}] 1.1 Complete the deterministic fixture.\n`);
  writeNew(path.join(change, "specs", "synthetic-terminal", "spec.md"), "## ADDED Requirements\n\n### Requirement: Synthetic terminal state is deterministic\nThe fixture SHALL expose one exact accepted task state.\n\n#### Scenario: Task state is read\n- **WHEN** OpenSpec apply instructions are inspected\n- **THEN** task 1.1 reports its current completion state\n");
}

async function startOpenCode(configDir: string, dataDir: string, project: string): Promise<ServerProcess> {
  const startedAt = Date.now();
  const port = await freePort();
  const child = spawn("opencode", ["serve", "--hostname", "127.0.0.1", "--port", String(port), "--print-logs", "--log-level", "INFO"], {
    cwd: project,
    env: isolatedProofServerEnvironment(process.env, configDir, dataDir),
    shell: false,
    stdio: "pipe",
  });
  const stdout: string[] = [];
  const stderr: string[] = [];
  child.stdout.on("data", (chunk) => stdout.push(String(chunk)));
  child.stderr.on("data", (chunk) => stderr.push(String(chunk)));
  const url = `http://127.0.0.1:${port}`;
  const client = proofClient(url, project);
  const configDeadline = startedAt + PROOF_SERVER_CONFIG_LOAD_MS;
  let pluginDeadline: number | null = null;
  let lastError: unknown = null;
  while (true) {
    const now = Date.now();
    const startup = proofServerStartupFacts(stdout.join(""), stderr.join(""), configDir);
    if (startup.isolatedConfigLoaded && pluginDeadline == null) pluginDeadline = now + PROOF_SERVER_PLUGIN_READY_MS;
    if ((!startup.isolatedConfigLoaded && now >= configDeadline) || (pluginDeadline != null && now >= pluginDeadline)) break;
    if (child.exitCode != null) throw new Error(`OpenCode server exited ${child.exitCode}: ${stderr.join("").slice(-1_000)}`);
    if (!stdout.join("").includes("opencode server listening")) {
      await Bun.sleep(50);
      continue;
    }
    try {
      const controller = new AbortController();
      const requestTimeoutMs = pluginDeadline == null
        ? PROOF_SERVER_PLUGIN_READY_MS
        : Math.max(1, pluginDeadline - now);
      const timer = setTimeout(() => controller.abort(new Error("OpenCode readiness request timed out")), requestTimeoutMs);
      try {
        await requestData(
          client.session.status({ directory: project }, { signal: controller.signal }) as Promise<unknown>,
          "runtime proof server readiness",
        );
      } finally {
        clearTimeout(timer);
      }
      return { child, readyMs: Date.now() - startedAt, stderr, stdout, url };
    } catch (error) {
      lastError = error;
      await Bun.sleep(100);
    }
  }
  const replacements: Array<[string, string]> = [
    [configDir, "<config-dir>"],
    [dataDir, "<data-dir>"],
    [project, "<project>"],
    [sourceRoot, "<source-root>"],
    [os.homedir(), "<home>"],
  ];
  const diagnostics = {
    errorChain: proofErrorFacts(lastError),
    exitCode: child.exitCode,
    probes: await probeProofServer(url),
    readinessStage: proofServerStartupFacts(stdout.join(""), stderr.join(""), configDir).isolatedConfigLoaded
      ? "configured-plugin-initialization"
      : "config-load",
    stderrChars: stderr.join("").length,
    stderrTail: sanitizeLog(stderr.join(""), replacements).slice(-4_000),
    stdoutChars: stdout.join("").length,
    stdoutTail: sanitizeLog(stdout.join(""), replacements).slice(-2_000),
  };
  await stopOpenCode({ child, readyMs: Date.now() - startedAt, stderr, stdout, url });
  throw new Error(`OpenCode server readiness timed out: ${JSON.stringify(diagnostics)}`);
}

async function stopOpenCode(server: ServerProcess): Promise<void> {
  await stopProofProcessTree(server.child);
}

function evaluateRaw(raw: Record<string, unknown>, candidateId: string): Record<string, unknown> {
  const executorEvidence = record(raw.executor) ?? {};
  const result = record(raw.result) ?? {};
  const provider = record(raw.provider) ?? {};
  const requestKinds = Array.isArray(provider.requestKinds) ? provider.requestKinds.map(String) : [];
  const scenario = typeof raw.scenario === "string" ? raw.scenario : "continue";
  const expected: Record<string, { arbiter: number; disposition: string; exitCode: number; primary: number }> = {
    ambiguous: { arbiter: 1, disposition: "completed", exitCode: 0, primary: 1 },
    continue: { arbiter: 0, disposition: "completed", exitCode: 0, primary: 1 },
    interrupted: { arbiter: 0, disposition: "terminal", exitCode: 1, primary: 0 },
    "owner-required": { arbiter: 1, disposition: "owner-required", exitCode: 3, primary: 1 },
    propose: { arbiter: 2, disposition: "completed", exitCode: 0, primary: 2 },
    transient: { arbiter: 0, disposition: "transient", exitCode: 1, primary: 4 },
  };
  const expectedScenario = expected[scenario];
  const primaryCallsMatch = scenario === "owner-required"
    ? provider.primaryCalls === 1 || provider.primaryCalls === 2
    : provider.primaryCalls === expectedScenario?.primary;
  const lifecycleClosed = scenario === "interrupted"
    ? result.writerClosure === "terminal" && result.cleanup === "not-required" && result.rootSessionRef == null
    : result.writerClosure === "terminal" && result.cleanup === "complete";
  const productComplete =
    expectedScenario != null &&
    raw.candidateId === candidateId &&
    result.disposition === expectedScenario.disposition &&
    primaryCallsMatch &&
    provider.arbiterCalls === expectedScenario.arbiter &&
    requestKinds.filter((kind) => kind === "primary").length === provider.primaryCalls &&
    requestKinds.filter((kind) => kind.startsWith("arbiter-")).length === expectedScenario.arbiter &&
    executorEvidence.exitCode === expectedScenario.exitCode &&
    lifecycleClosed &&
    (scenario === "continue" ? record(result.terminalCertificate) != null : result.terminalCertificate == null) &&
    (scenario === "owner-required"
      ? result.guardState === "owner-required" && result.questionDisposition === "owner-required" && result.errorClass === "owner-required"
      : expectedScenario.disposition === "completed"
        ? result.guardState === "passed"
        : result.errorClass === expectedScenario.disposition);
  const cleanupComplete = raw.cleanup === "complete";
  return {
    candidateId,
    cleanup: cleanupComplete ? "complete" : "blocked",
    command: "opsx-apply",
    completionMode: record(result.terminalCertificate) == null ? "arbiter-or-nonterminal" : "certified",
    disposition: result.disposition ?? "unknown",
    guardState: result.guardState ?? "unknown",
    missingObservation: cleanupComplete ? null : "proof-owned process-tree and fixture cleanup terminal completion",
    nestedServerStarted: false,
    productLane: productComplete ? "complete" : "blocked",
    providerCalls: { arbiter: provider.arbiterCalls ?? null, primary: provider.primaryCalls ?? null },
    rootSession: cleanupComplete
      ? scenario === "interrupted" ? "not-created-prior-root-deleted" : "created-and-deleted"
      : "deletion-recorded-cleanup-not-terminal",
    schemaVersion: 1,
    scenario,
    status: productComplete && cleanupComplete ? "complete" : "blocked",
    unlockCondition: cleanupComplete
      ? null
      : "Harden proof-owned process-tree/fixture cleanup and capture terminal cleanup evidence before another proof claim",
  };
}

function replay(opts: Options): void {
  if (opts.inputRoot == null) throw new Error("Replay input root is missing");
  if (fs.existsSync(opts.evidenceRoot)) throw new Error("Evidence root already exists");
  const rawFile = path.join(opts.inputRoot, "raw.json");
  if (!fs.lstatSync(rawFile).isFile()) throw new Error("Replay input raw.json is missing");
  const raw = JSON.parse(fs.readFileSync(rawFile, "utf8")) as Record<string, unknown>;
  fs.mkdirSync(opts.evidenceRoot, { recursive: false });
  const evaluation = evaluateRaw(raw, opts.candidateId);
  writeNew(path.join(opts.evidenceRoot, "evaluation.json"), json({
    ...evaluation,
    inputRawSha256: hash(rawFile),
    liveCalls: 0,
    replaySource: path.basename(opts.inputRoot),
  }));
  console.log(json({ candidateId: opts.candidateId, evidenceRoot: "<evidence-root>", mode: opts.mode, status: evaluation.status }).trimEnd());
}

async function runProcess(
  command: string,
  args: string[],
  cwd: string,
  env: NodeJS.ProcessEnv,
  timeoutMs: number,
): Promise<ProcessEvidence> {
  const child = spawn(command, args, { cwd, env, shell: false, stdio: "pipe" });
  let stdout = "";
  let stderr = "";
  child.stdout.on("data", (chunk) => { stdout += String(chunk); });
  child.stderr.on("data", (chunk) => { stderr += String(chunk); });
  const exited = new Promise<void>((resolve, reject) => {
    child.once("error", reject);
    child.once("exit", () => resolve());
  });
  const timedOut = await Promise.race([exited.then(() => false), Bun.sleep(timeoutMs).then(() => true)]);
  if (timedOut) {
    if (process.platform === "win32") {
      spawnSync("taskkill", ["/PID", String(child.pid), "/T", "/F"], { shell: false, stdio: "ignore" });
    } else {
      child.kill();
    }
    await Promise.race([exited, Bun.sleep(10_000).then(() => { throw new Error("Executor child did not stop after watchdog termination"); })]);
  }
  return {
    argv: [path.basename(command), ...args.map((arg) => arg.replaceAll(cwd, "<project-root>").replaceAll(sourceRoot, "<source-root>"))],
    exitCode: child.exitCode,
    signal: timedOut ? "watchdog-timeout" : child.signalCode,
    stderr: stderr.replaceAll(cwd, "<project-root>").replaceAll(sourceRoot, "<source-root>").slice(-20_000),
    stdout: stdout.replaceAll(cwd, "<project-root>").replaceAll(sourceRoot, "<source-root>").slice(-20_000),
  };
}

async function cleanupSessions(server: ServerProcess, project: string, rootIDs: string[]): Promise<void> {
  const client = proofClient(server.url, project);
  const listed = await requestData<unknown>(
    client.v2.session.list({ directory: project, roots: true, limit: 500 }) as Promise<unknown>,
    "runtime proof cleanup root list",
  );
  const listedRecord = record(listed);
  const listedRows = Array.isArray(listed)
    ? listed
    : Array.isArray(listedRecord?.data)
      ? listedRecord.data
      : Array.isArray(record(listedRecord?.data)?.data)
        ? record(listedRecord?.data)!.data as unknown[]
        : [];
  for (const row of listedRows.map(record).filter((entry): entry is Record<string, unknown> => entry != null)) {
    if (typeof row.id === "string" && typeof row.title === "string" && (row.title.startsWith("roadmap mission ") || row.title === "interrupted roadmap mission root")) {
      rootIDs.push(row.id);
    }
  }
  for (const rootID of [...new Set(rootIDs)]) {
    const children = await requestData<Array<Record<string, unknown>>>(
      client.session.children({ sessionID: rootID, directory: project }) as Promise<unknown>,
      "runtime proof cleanup children",
    );
    for (const child of children) {
      if (typeof child.id === "string") await requestData(client.session.delete({ sessionID: child.id, directory: project }) as Promise<unknown>, "runtime proof child delete");
    }
    await requestData(client.session.delete({ sessionID: rootID, directory: project }) as Promise<unknown>, "runtime proof root delete");
  }
}

async function capture(opts: Options): Promise<void> {
  if (fs.existsSync(opts.evidenceRoot)) throw new Error("Evidence root already exists");
  fs.mkdirSync(opts.evidenceRoot, { recursive: false });
  stage(opts.evidenceRoot, "capture-start", { scenario: opts.scenario });
  const fixture = fs.mkdtempSync(path.join(os.tmpdir(), "roadmap-runtime-proof-"));
  const configDir = path.join(fixture, "config");
  const dataDir = path.join(fixture, "data");
  const project = path.join(fixture, "project");
  fs.mkdirSync(path.join(project, "docs"), { recursive: true });
  fs.mkdirSync(path.join(project, "tools"), { recursive: true });
  writeNew(path.join(project, "AGENTS.md"), "# Disposable roadmap runtime proof\n");
  writeNew(path.join(project, "docs", "roadmap.md"), "# Disposable Roadmap\n");
  writeNew(path.join(project, "tools", "validate.mjs"), "process.exit(0);\n");
  writeNew(path.join(project, "mission.json"), mission(opts.scenario));
  if (opts.scenario !== "propose" && opts.scenario !== "interrupted") {
    createApplyChange(project, opts.scenario === "continue");
  }
  const provider = providerSimulator(opts.scenario);
  writeConfig(configDir, dataDir, `http://${provider.server.hostname}:${provider.server.port}`);
  let server: ServerProcess | null = null;
  const rootIDs: string[] = [];
  let run: ProcessEvidence | null = null;
  let raw: Record<string, unknown> | null = null;
  let failure: unknown = null;
  let cleanup = "pending";
  try {
    server = await startOpenCode(configDir, dataDir, project);
    stage(opts.evidenceRoot, "server-ready", { pid: server.child.pid });
    const arbiterRoute = await waitForProofRoute(
      proofClient(server.url, project),
      project,
      "session-completion-arbiter",
      PROOF_SERVER_PLUGIN_READY_MS,
    );
    stage(opts.evidenceRoot, "arbiter-route-ready", {
      model: `${arbiterRoute.model.providerID}/${arbiterRoute.model.modelID}`,
    });
    if (opts.scenario === "interrupted") {
      const blockedRoot = await requestData<Record<string, unknown>>(proofClient(server.url, project).session.create({
        directory: project,
        title: "interrupted roadmap mission root",
        metadata: {
          completionGuard: { grindEnabled: true, paused: true, state: "owner-required" },
          roadmapMission: {
            attempt: 1,
            changeId: "change-a",
            definitionDigest: "proof-interrupted-definition",
            missionId: "prior-proof-mission",
            schemaVersion: 1,
            sliceId: "slice-a",
          },
        },
      }) as Promise<unknown>, "interrupted root create");
      rootIDs.push(String(blockedRoot.id));
      stage(opts.evidenceRoot, "interrupted-root-created");
    }
    stage(opts.evidenceRoot, "executor-start");
    run = await runProcess(process.execPath, [
      executor,
      "execute",
      "--root",
      project,
      "--server-url",
      server.url,
      "--mission",
      "mission.json",
      "--slice",
      "slice-a",
      "--attempt",
      "1",
      "--result",
      "evidence/mission/attempt-1/result.json",
      "--timeout-ms",
      "30000",
    ], project, process.env, 150_000);
    stage(opts.evidenceRoot, "executor-exit", { exitCode: run.exitCode, signal: run.signal });
    const result = JSON.parse(fs.readFileSync(path.join(project, "evidence", "mission", "attempt-1", "result.json"), "utf8")) as Record<string, unknown>;
    if (typeof result.rootSessionRef === "string") rootIDs.push(result.rootSessionRef);
    const evidenceDirectory = path.join(project, "evidence", "mission", "attempt-1");
    raw = {
      candidateId: opts.candidateId,
      cleanup: "pending",
      arbiterRoute: {
        agent: arbiterRoute.agent,
        model: arbiterRoute.model,
      },
      environment: {
        directoryMatched: record(await requestData(proofClient(server.url, project).path.get({ directory: project }) as Promise<unknown>, "runtime proof path"))?.directory === project,
        node: process.version,
        platform: process.platform,
      },
      executor: run,
      provider: provider.facts(),
      result,
      runtimeEvidence: fs.readdirSync(evidenceDirectory).sort().map((name) => {
        const file = path.join(evidenceDirectory, name);
        if (fs.statSync(file).size > 200_000) throw new Error(`Runtime evidence exceeded 200000 bytes: ${name}`);
        return {
          name,
          sha256: hash(file),
          value: JSON.parse(fs.readFileSync(file, "utf8")),
        };
      }),
      schemaVersion: 1,
      scenario: opts.scenario,
      server: {
        diagnostics: serverDiagnostics(server, [
          [configDir, "<config-dir>"],
          [dataDir, "<data-dir>"],
          [project, "<project>"],
          [sourceRoot, "<source-root>"],
          [os.homedir(), "<home>"],
        ]),
        pid: server.child.pid,
        readyMs: server.readyMs,
        startup: proofServerStartupFacts(server.stdout.join(""), server.stderr.join(""), configDir),
        stderrChars: server.stderr.join("").length,
        stdoutChars: server.stdout.join("").length,
      },
      sources: [
        "global/bin/roadmap-mission-session-executor.ts",
        "global/bin/roadmap-mission/session-executor.ts",
        "global/bin/roadmap-mission/contracts.ts",
        "global/extensions/session-completion-guard.ts",
        "global/extensions/session-completion-guard/controller.ts",
        "global/extensions/session-completion-guard/status.ts",
        "global/extensions/session-completion-guard/terminal-certificate.ts",
        "global/extensions/session-completion-guard/verdict.ts",
      ].map((relative) => ({ path: relative, sha256: hash(path.join(sourceRoot, relative)) })),
    };
    stage(opts.evidenceRoot, "raw-ready");
  } catch (error) {
    failure = error;
  } finally {
    try {
      if (server != null) {
        await cleanupSessions(server, project, rootIDs);
        stage(opts.evidenceRoot, "sessions-clean");
        await stopOpenCode(server);
        stage(opts.evidenceRoot, "server-stopped");
      }
      await provider.server.stop(true);
      removeProofFixture(fixture);
      stage(opts.evidenceRoot, "fixture-removed");
      cleanup = "complete";
    } catch (error) {
      cleanup = "failed";
      failure ??= error;
    }
  }
  if (raw != null) {
    raw.cleanup = cleanup;
    writeNew(path.join(opts.evidenceRoot, "raw.json"), json(raw));
  }
  if (failure != null || raw == null) {
    writeNew(path.join(opts.evidenceRoot, "failure.json"), json({
      candidateId: opts.candidateId,
      cleanup,
      error: failure instanceof Error ? failure.message.slice(0, 4_000) : String(failure),
      executor: run,
      provider: provider.facts(),
      schemaVersion: 1,
      status: "failed",
    }));
    throw failure instanceof Error ? failure : new Error(String(failure));
  }
  const evaluation = evaluateRaw(raw, opts.candidateId);
  writeNew(path.join(opts.evidenceRoot, "evaluation.json"), json(evaluation));
  console.log(json({ candidateId: opts.candidateId, evidenceRoot: "<evidence-root>", mode: opts.mode, status: evaluation.status }).trimEnd());
  if (evaluation.status !== "complete") process.exitCode = 1;
}

const parsed = options(process.argv.slice(2));
const execution = parsed.help
  ? Promise.resolve().then(() => console.log(usage()))
  : parsed.mode === "replay"
    ? Promise.resolve().then(() => replay(parsed))
    : capture(parsed);
execution.catch((error) => {
  console.error(json({ error: error instanceof Error ? error.message : String(error), status: "blocked" }).trimEnd());
  process.exitCode = 1;
});
