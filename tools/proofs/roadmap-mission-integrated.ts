#!/usr/bin/env bun
import { spawn } from "node:child_process";
import type { ChildProcessWithoutNullStreams } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { runPortableCommand } from "../../global/bin/portable-process.ts";
import { loadMissionDefinition } from "../../global/bin/roadmap-mission/contracts.ts";
import { recordMissionStopIntent } from "../../global/bin/roadmap-mission/state.ts";
import { ROADMAP_MISSION_CERTIFICATE_ISSUER } from "../../global/extensions/session-completion-guard/terminal-certificate.ts";
import { loadModelProfile } from "../model-profile.ts";
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

type Mode = "capture" | "diagnose" | "preflight" | "replay" | "selftest" | "startup";
type Options = {
  candidateId: string;
  evidenceRoot: string;
  help: boolean;
  inputRoot: string | null;
  mode: Mode;
  profile: string;
  runtimeUrl: string | null;
};
type ServerProcess = {
  attached: boolean;
  child: ChildProcessWithoutNullStreams | null;
  commandNames: string[];
  listenObserved: boolean;
  probes: Array<{ error?: string; route: string; status?: number }>;
  readyMs: number;
  stderr: string[];
  stdout: string[];
  url: string;
};

const sourceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");

function usage(): string {
  return [
    "Usage:",
    "  bun tools/proofs/roadmap-mission-integrated.ts --mode preflight --profile <name> --candidate-id <id> --evidence-root <absolute-new-path>",
    "  bun tools/proofs/roadmap-mission-integrated.ts --mode capture --profile <name> --candidate-id <id> --evidence-root <absolute-new-path>",
    "  bun tools/proofs/roadmap-mission-integrated.ts --mode diagnose --profile <name> --candidate-id <id> --evidence-root <absolute-new-path> [--runtime-url <loopback-url>]",
    "  bun tools/proofs/roadmap-mission-integrated.ts --mode startup --profile <name> --candidate-id <id> --evidence-root <absolute-new-path>",
    "  bun tools/proofs/roadmap-mission-integrated.ts --mode replay --candidate-id <id> --input-root <capture-path> --evidence-root <absolute-new-path>",
    "  bun tools/proofs/roadmap-mission-integrated.ts --mode selftest --candidate-id <id> --evidence-root <absolute-new-path>",
  ].join("\n");
}

function required(args: string[], index: number, option: string): string {
  const value = args[index + 1];
  if (value == null || value.trim() === "" || value.startsWith("--")) throw new Error(`Missing value for ${option}`);
  return value;
}

function options(args: string[]): Options {
  if (args.length === 1 && (args[0] === "--help" || args[0] === "-h")) {
    return { candidateId: "help", evidenceRoot: sourceRoot, help: true, inputRoot: null, mode: "preflight", profile: "quality-independent", runtimeUrl: null };
  }
  let candidateId = "";
  let evidenceRoot = "";
  let inputRoot = "";
  let mode = "";
  let profile = "quality-independent";
  let runtimeUrl = "";
  for (let index = 0; index < args.length; index++) {
    const arg = args[index];
    if (arg === "--candidate-id") {
      candidateId = required(args, index, arg);
      index++;
    } else if (arg === "--evidence-root") {
      evidenceRoot = required(args, index, arg);
      index++;
    } else if (arg === "--input-root") {
      inputRoot = required(args, index, arg);
      index++;
    } else if (arg === "--mode") {
      mode = required(args, index, arg);
      index++;
    } else if (arg === "--profile") {
      profile = required(args, index, arg);
      index++;
    } else if (arg === "--runtime-url") {
      runtimeUrl = required(args, index, arg);
      index++;
    } else {
      throw new Error(`Unknown option: ${arg}`);
    }
  }
  if (mode !== "capture" && mode !== "diagnose" && mode !== "preflight" && mode !== "replay" && mode !== "selftest" && mode !== "startup") throw new Error("--mode must be preflight, capture, diagnose, replay, selftest, or startup");
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]{0,99}$/.test(candidateId)) throw new Error("--candidate-id must be a safe identifier");
  if (!path.isAbsolute(evidenceRoot)) throw new Error("--evidence-root must be absolute");
  if (mode === "replay" && !path.isAbsolute(inputRoot)) throw new Error("replay requires absolute --input-root");
  if (mode !== "replay" && inputRoot !== "") throw new Error(`${mode} does not accept --input-root`);
  if (runtimeUrl !== "") {
    let parsed: URL;
    try {
      parsed = new URL(runtimeUrl);
    } catch {
      throw new Error("--runtime-url must be a loopback http URL");
    }
    if (parsed.protocol !== "http:" || (parsed.hostname !== "127.0.0.1" && parsed.hostname !== "localhost" && parsed.hostname !== "[::1]")) {
      throw new Error("--runtime-url must be a loopback http URL");
    }
    if (mode !== "diagnose" && mode !== "capture") throw new Error("only diagnose and capture accept --runtime-url");
  }
  return {
    candidateId,
    evidenceRoot: path.resolve(evidenceRoot),
    help: false,
    inputRoot: inputRoot === "" ? null : path.resolve(inputRoot),
    mode,
    profile,
    runtimeUrl: runtimeUrl === "" ? null : runtimeUrl,
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

function record(value: unknown): Record<string, unknown> | null {
  return value != null && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null;
}

function writeNew(file: string, content: string): void {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content, { encoding: "utf8", flag: "wx" });
}

function hash(file: string): string {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

function redact(text: string, replacements: Array<[string, string]>): string {
  return replacements.reduce((result, [value, placeholder]) => result
    .replaceAll(value, placeholder)
    .replaceAll(value.replaceAll("\\", "/"), placeholder)
    .replaceAll(value.replaceAll("\\", "\\\\"), placeholder), text);
}

function redactValue(value: unknown, replacements: Array<[string, string]>): unknown {
  if (typeof value === "string") return redact(value, replacements);
  if (Array.isArray(value)) return value.map((item) => redactValue(item, replacements));
  if (value != null && typeof value === "object") {
    return Object.fromEntries(Object.entries(value as Record<string, unknown>).map(([key, item]) => [key, redactValue(item, replacements)]));
  }
  return value;
}

async function freePort(): Promise<number> {
  return await new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      const port = typeof address === "object" && address != null ? address.port : 0;
      server.close((error) => error == null ? resolve(port) : reject(error));
    });
  });
}

function copy(source: string, destination: string): void {
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.copyFileSync(source, destination);
}

function writeConfig(configDir: string, runtimeRoot: string, model: string, variant: string): void {
  copy(path.join(sourceRoot, "global", "agents", "session-completion-arbiter.md"), path.join(configDir, "agents", "session-completion-arbiter.md"));
  for (const command of ["opsx-apply", "opsx-archive", "opsx-propose"]) {
    copy(path.join(sourceRoot, "global", "commands", `${command}.md`), path.join(configDir, "commands", `${command}.md`));
  }
  for (const skill of ["change-ready-sdlc", "openspec-apply-change", "openspec-archive-change", "openspec-propose"]) {
    copy(path.join(sourceRoot, "global", "skills", skill, "SKILL.md"), path.join(configDir, "skills", skill, "SKILL.md"));
  }
  copy(
    path.join(sourceRoot, "global", "bin", "openspec-operation-gate.ts"),
    path.join(configDir, "bin", "openspec-operation-gate.ts"),
  );
  fs.cpSync(
    path.join(sourceRoot, "global", "bin", "openspec-change"),
    path.join(configDir, "bin", "openspec-change"),
    { recursive: true },
  );
  const bridge = pathToFileURL(path.join(sourceRoot, "global", "extensions", "opencode-pty-bridge.ts")).href;
  const guard = pathToFileURL(path.join(sourceRoot, "global", "extensions", "session-completion-guard.ts")).href;
  const launcher = pathToFileURL(path.join(sourceRoot, "global", "extensions", "roadmap-mission-launcher.ts")).href;
  const models = path.join(os.homedir(), ".cache", "opencode", "models.json");
  if (!fs.existsSync(models)) throw new Error("Installed OpenCode models catalog is unavailable for an offline proof server");
  const modelCatalog = JSON.parse(fs.readFileSync(models, "utf8")) as unknown;
  if (modelCatalog == null || typeof modelCatalog !== "object" || Array.isArray(modelCatalog)) {
    throw new Error("Installed OpenCode models catalog is malformed");
  }
  const catalog = modelCatalog as Record<string, unknown>;
  const providerIds = Object.keys(catalog).sort();
  if (!providerIds.includes("openai")) throw new Error("Installed OpenCode models catalog does not contain openai");
  const configuredModel = model.split("/");
  const openai = catalog.openai;
  const openaiModels = openai != null && typeof openai === "object" && !Array.isArray(openai)
    ? (openai as Record<string, unknown>).models
    : null;
  if (configuredModel[0] !== "openai" || configuredModel.length < 2) {
    throw new Error(`Integrated proof requires an openai model, received ${model}`);
  }
  if (openaiModels == null || typeof openaiModels !== "object" || Array.isArray(openaiModels)
    || !Object.hasOwn(openaiModels, configuredModel.slice(1).join("/"))) {
    throw new Error(`Installed OpenCode models catalog does not contain ${model}`);
  }
  writeNew(path.join(configDir, "opencode.json"), json({
    $schema: "https://opencode.ai/config.json",
    disabled_providers: providerIds.filter((providerId) => providerId !== "openai"),
    enabled_providers: ["openai"],
    agent: {
      build: { model, steps: 100, variant },
      "session-completion-arbiter": { hidden: true, mode: "subagent", model },
    },
    model,
    permission: {
      "*": "deny",
      apply_patch: "allow",
      bash: {
        "*": "deny",
        "git diff*": "allow",
        "git status*": "allow",
        "node *openspec-operation-gate.ts*": "allow",
        "node tools/validate.mjs*": "allow",
        "openspec *": "allow",
        "openspec.cmd *": "allow",
        "*&&*": "deny",
        "*|*": "deny",
        "*>*": "deny",
        "*<*": "deny",
      },
      edit: "allow",
      external_directory: "deny",
      glob: "allow",
      grep: "allow",
      question: "deny",
      read: "allow",
      skill: "allow",
      task: "deny",
      todowrite: "allow",
      webfetch: "deny",
      write: "allow",
    },
    plugin: [
      bridge,
      [guard, {
        arbiterAgent: "session-completion-arbiter",
        arbiterPromptTimeoutMs: 120_000,
        auditWindow: { enabled: false, mode: "read-only-monitor", scope: "per-root", terminal: "powershell-shell" },
        certificateIssuers: [ROADMAP_MISSION_CERTIFICATE_ISSUER],
        certificateWaitMs: 5_000,
        enabled: true,
        initialDelayMs: 100,
        maxCycles: 3,
        maxDelayMs: 5_000,
        maxRequestBytes: 200_000,
        maxRetryAttempts: 1,
        maxWaitRechecks: 3,
        retainAuditSessions: 2,
        retryMultiplier: 1,
        settleMs: 100,
        statusToasts: false,
        strategyFallback: "docs/session-strategy-history",
        waitRecheckMs: 250,
      }],
      [launcher, { scriptRuntime: process.execPath }],
    ],
    tool_output: { max_bytes: 30_000, max_lines: 800 },
  }));
  seedProofConfigDependencies(configDir, path.join(sourceRoot, "global"));
  const auth = path.join(os.homedir(), ".local", "share", "opencode", "auth.json");
  if (!fs.existsSync(auth)) throw new Error("Configured OpenCode credential store is unavailable");
  copy(auth, path.join(runtimeRoot, "data", "opencode", "auth.json"));
  copy(auth, path.join(runtimeRoot, "home", ".local", "share", "opencode", "auth.json"));
  copy(models, path.join(runtimeRoot, "cache", "opencode", "models.json"));
}

function git(root: string, args: string[], env: NodeJS.ProcessEnv = process.env): string {
  const result = runPortableCommand(root, ["git", ...args], { capture: true, env });
  if (result.status !== 0) throw new Error(`git ${args.join(" ")} failed: ${result.stderr || result.stdout}`);
  return result.stdout.trim();
}

function writeProject(project: string): void {
  writeNew(path.join(project, "AGENTS.md"), [
    "# Disposable Integrated Mission Proof",
    "",
    "## Runtime Authority",
    "",
    "This is an effect-contained synthetic project. Implement only the active `change-a` marker change.",
    "Write `src/alpha.txt` with exact text `alpha` plus one newline, update only that change's task, and run `node tools/validate.mjs`.",
    "The verified active global source is the project-local `.proof-config` directory; use its operation gate directly and do not probe other config locations.",
    "Do not access network, credentials, remote state, installations, releases, deployments, questions, or nested agents.",
    "",
  ].join("\n"));
  writeNew(path.join(project, ".gitignore"), ".proof-config/\n");
  writeNew(path.join(project, "docs", "roadmap.md"), "# Disposable Integrated Roadmap\n");
  writeNew(path.join(project, "opencode-dev-kit", "missions", "integrated-proof.json"), json({
    allowedEffects: ["local-commit", "local-read", "local-write", "provider-inference"],
    authorizationRefs: {
      "local-commit": "disposable-proof-local-checkpoint",
      "provider-inference": "configured-provider-proof-standing-authorization",
    },
    checkpoint: { localCommitAuthorized: true, mode: "local-commit", workspace: "disposable" },
    evidencePath: "evidence/mission",
    missionId: "integrated-proof",
    roadmapPath: "docs/roadmap.md",
    schemaVersion: 1,
    slices: [{
      changeId: "change-a",
      dependsOn: [],
      effectClasses: ["local-commit", "local-read", "local-write", "provider-inference"],
      id: "slice-a",
      operation: "continue",
      outcome: "Create and validate the exact disposable alpha marker.",
      ownedPaths: ["openspec/changes/change-a", "openspec/specs/synthetic-alpha", "src/alpha.txt"],
    }],
    stopPolicy: { onExternalBlocked: true, onOwnerRequired: true, onUnknown: true },
    validationArgv: ["node", "tools/validate.mjs"],
    workflowOwner: { mode: "global-canonical" },
  }));
  writeNew(path.join(project, "opencode-dev-kit", "controller-adapter.json"), json({
    executorArgv: [
      process.execPath,
      "{globalSource}/bin/roadmap-mission-session-executor.ts",
      "execute",
      "--root",
      "{root}",
      "--mission",
      "{missionPath}",
      "--slice",
      "{sliceId}",
      "--attempt",
      "{attempt}",
      "--result",
      "{resultPath}",
      "--timeout-ms",
      "300000",
    ],
    maxAttemptsPerSlice: 1,
    maxWallClockMsPerSlice: 600_000,
    schemaVersion: 1,
  }));
  writeNew(path.join(project, "opencode-dev-kit", "adapter.json"), json({
    schemaVersion: 1,
    validation: {
      build: "node tools/validate.mjs",
      focusedTest: "node tools/validate.mjs",
      lint: "node tools/validate.mjs",
      test: "node tools/validate.mjs",
      typecheck: "node tools/validate.mjs",
    },
  }));
  writeNew(path.join(project, "openspec", "config.yaml"), "schema: spec-driven\n\ncontext: |\n  Disposable exact-marker proof; no external effects.\n");
  const change = path.join(project, "openspec", "changes", "change-a");
  writeNew(path.join(change, ".openspec.yaml"), "schema: spec-driven\ncreated: 2026-08-17\n");
  writeNew(path.join(change, "proposal.md"), [
    "## Why", "", "The disposable integrated proof needs one exact marker.", "", "## What Changes", "", "- Create `src/alpha.txt` with exact synthetic content.", "",
    "### Outcome Capsule", "", "- **Outcome:** Create one deterministic local alpha marker.", "- **Operating Envelope:** Disposable local project only.", "- **Non-Goals:** Network, credentials, remote state, deployment, release, or unrelated files.", "- **Non-Deferrable Invariants:** Exact content and project containment.", "- **Observable Proof:** `node tools/validate.mjs` exits zero.", "- **Material Residual Risks:** None in the synthetic fixture.", "- **Stop Line:** Stop after marker validation and task completion.", "", "## Capabilities", "", "### New Capabilities", "", "- `synthetic-alpha`: One deterministic disposable marker.", "", "## Impact", "", "- `src/alpha.txt` only.", "",
  ].join("\n"));
  writeNew(path.join(change, "design.md"), "## Context\n\nCreate one exact local marker.\n\n## Goals / Non-Goals\n\nOnly `src/alpha.txt`; no external effects.\n\n## Decisions\n\nUse exact UTF-8 text `alpha\\n`.\n\n## Risks / Trade-offs\n\nNone in the disposable fixture.\n");
  writeNew(path.join(change, "history.md"), "# Strategy History\n\nNo failed strategy exists.\n");
  writeNew(path.join(change, "tasks.md"), "## 1. Alpha Marker\n\n- [ ] 1.1 Create and validate `src/alpha.txt`.\n");
  writeNew(path.join(change, "specs", "synthetic-alpha", "spec.md"), "## ADDED Requirements\n\n### Requirement: Alpha marker is deterministic\nThe disposable project SHALL contain `src/alpha.txt` with exact text `alpha` and one trailing newline.\n\n#### Scenario: Alpha marker validates\n- **WHEN** project validation runs\n- **THEN** it exits zero only for the exact marker content\n");
  writeNew(path.join(project, "tools", "validate.mjs"), [
    "import fs from 'node:fs';",
    "import path from 'node:path';",
    "const marker = path.join('src', 'alpha.txt');",
    "const tasks = path.join('openspec', 'changes', 'change-a', 'tasks.md');",
    "if (!fs.existsSync(marker) || fs.readFileSync(marker, 'utf8') !== 'alpha\\n') process.exit(1);",
    "if (!fs.readFileSync(tasks, 'utf8').includes('- [x] 1.1')) process.exit(1);",
    "process.exit(0);",
    "",
  ].join("\n"));
  writeNew(path.join(project, "opencode.json"), json({
    $schema: "https://opencode.ai/config.json",
    mcp: {
      "codebase-memory-mcp": { enabled: false },
      serena: { enabled: false },
    },
  }));
  git(project, ["init"]);
  git(project, ["config", "user.email", "roadmap-integrated-proof@example.invalid"]);
  git(project, ["config", "user.name", "Roadmap Integrated Proof"]);
  git(project, ["add", "--", "."]);
  git(project, ["commit", "-m", "integrated proof fixture"]);
}

function streamTail(chunks: string[]): string {
  return chunks.join("").slice(-8_000);
}

function durableIntegratedCacheHome(): string {
  const root = path.join(os.tmpdir(), "opencode-kit-roadmap-integrated-xdg-cache");
  fs.mkdirSync(root, { recursive: true });
  return root;
}

function startupFailure(
  message: string,
  extras: {
    childExitCode: number | null;
    elapsedMs: number;
    listenObserved?: boolean;
    probes?: Array<{ error?: string; route: string; status?: number }>;
    startup?: Record<string, unknown>;
    stderrTail: string;
    stdoutTail: string;
  },
): Error & typeof extras {
  return Object.assign(new Error(message), extras);
}

async function startOpenCode(configDir: string, runtimeRoot: string, project: string): Promise<ServerProcess> {
  const startedAt = Date.now();
  const httpReady = await startOpenCodeHttp(configDir, runtimeRoot, project);
  const client = proofClient(httpReady.url, project);
  const inventoryDeadline = startedAt + PROOF_SERVER_READINESS_MS;
  let lastError: unknown = null;
  let commandNames: string[] = [];
  while (Date.now() < inventoryDeadline) {
    if (httpReady.child.exitCode != null) {
      await stopProofProcessTree(httpReady.child);
      throw startupFailure(`OpenCode server exited ${httpReady.child.exitCode} after HTTP readiness: ${httpReady.stderr.join("").slice(-1_000)}`, {
        childExitCode: httpReady.child.exitCode,
        elapsedMs: Date.now() - (Date.now() - httpReady.readyMs),
        listenObserved: httpReady.listenObserved,
        probes: httpReady.probes,
        stderrTail: streamTail(httpReady.stderr),
        stdoutTail: streamTail(httpReady.stdout),
      });
    }
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(new Error("Integrated command inventory timed out")), 5_000);
      try {
        const commands = await requestData<Array<{ id?: string; name?: string }>>(
          client.command.list({ directory: project }, { signal: controller.signal }) as Promise<unknown>,
          "integrated command inventory",
        );
        commandNames = commands.flatMap((row) => typeof row.name === "string" ? [row.name] : typeof row.id === "string" ? [row.id] : []).sort();
      } finally {
        clearTimeout(timer);
      }
      if (["disable-grind", "enable-grind", "mission-run", "mission-status", "mission-stop", "opsx-apply"].every((name) => commandNames.includes(name))) {
        return { ...httpReady, attached: false, commandNames, readyMs: Date.now() - startedAt };
      }
      lastError = new Error("Integrated commands are not loaded yet");
    } catch (error) {
      lastError = error;
    }
    await Bun.sleep(100);
  }
  const diagnostics = {
    commandNames,
    errorChain: proofErrorFacts(lastError),
    listenObserved: httpReady.listenObserved,
    probes: httpReady.probes,
    startup: proofServerStartupFacts(httpReady.stdout.join(""), httpReady.stderr.join(""), configDir),
  };
  await stopProofProcessTree(httpReady.child);
  throw startupFailure(`Integrated OpenCode server was not ready after HTTP: ${JSON.stringify(diagnostics)}`, {
    childExitCode: httpReady.child.exitCode,
    elapsedMs: httpReady.readyMs,
    listenObserved: httpReady.listenObserved,
    probes: httpReady.probes,
    startup: diagnostics.startup,
    stderrTail: streamTail(httpReady.stderr),
    stdoutTail: streamTail(httpReady.stdout),
  });
}

async function startOpenCodeHttp(configDir: string, runtimeRoot: string, project: string): Promise<ServerProcess> {
  const startedAt = Date.now();
  const port = await freePort();
  const environment = isolatedProofServerEnvironment(process.env, configDir, runtimeRoot);
  delete environment.OPENCODE_DISABLE_DEFAULT_PLUGINS;
  const child = spawn("opencode", ["serve", "--hostname", "127.0.0.1", "--port", String(port), "--print-logs", "--log-level", "INFO"], {
    cwd: project,
    env: environment,
    shell: false,
    stdio: "pipe",
  });
  const stdout: string[] = [];
  const stderr: string[] = [];
  child.stdout.on("data", (chunk) => stdout.push(String(chunk)));
  child.stderr.on("data", (chunk) => stderr.push(String(chunk)));
  let handedOff = false;
  try {
  const url = `http://127.0.0.1:${port}`;
  const listenDeadline = startedAt + PROOF_SERVER_CONFIG_LOAD_MS;
  const readyDeadline = startedAt + PROOF_SERVER_READINESS_MS;
  let lastError: unknown = null;
  let probes: Array<{ error?: string; route: string; status?: number }> = [];
  while (true) {
    const now = Date.now();
    const logs = `${stdout.join("")}\n${stderr.join("")}`;
    const startup = proofServerStartupFacts(stdout.join(""), stderr.join(""), configDir);
    const listenObserved = logs.includes("opencode server listening");
    if ((!listenObserved && now >= listenDeadline) || now >= readyDeadline) break;
    if (child.exitCode != null) throw startupFailure(`OpenCode server exited ${child.exitCode}: ${stderr.join("").slice(-1_000)}`, {
      childExitCode: child.exitCode,
      elapsedMs: Date.now() - startedAt,
      listenObserved,
      probes,
      startup,
      stderrTail: streamTail(stderr),
      stdoutTail: streamTail(stdout),
    });
    if (!listenObserved) {
      await Bun.sleep(100);
      continue;
    }
    const remaining = Math.max(1, readyDeadline - now);
    try {
      const pathController = new AbortController();
      const pathTimer = setTimeout(() => pathController.abort(new Error("Integrated HTTP /path timed out")), remaining);
      try {
        const pathResponse = await fetch(new URL("/path", url), { signal: pathController.signal });
        await pathResponse.body?.cancel();
        probes = [{ route: "/path", status: pathResponse.status }];
      } finally {
        clearTimeout(pathTimer);
      }
      const statusRemaining = Math.max(1, readyDeadline - Date.now());
      const statusController = new AbortController();
      const statusTimer = setTimeout(() => statusController.abort(new Error("Integrated HTTP /session/status timed out")), statusRemaining);
      try {
        const statusResponse = await fetch(new URL("/session/status", url), { signal: statusController.signal });
        await statusResponse.body?.cancel();
        probes = [...probes, { route: "/session/status", status: statusResponse.status }];
      } finally {
        clearTimeout(statusTimer);
      }
      if (probes.every((probe) => typeof probe.status === "number")) {
        handedOff = true;
        return { attached: false, child, commandNames: [], listenObserved: true, probes, readyMs: Date.now() - startedAt, stderr, stdout, url };
      }
    } catch (error) {
      lastError = error;
      probes = await probeProofServer(url);
    }
    await Bun.sleep(250);
  }
  const diagnostics = {
    commandNames: [],
    errorChain: proofErrorFacts(lastError),
    listenObserved: `${stdout.join("")}\n${stderr.join("")}`.includes("opencode server listening"),
    probes,
    startup: proofServerStartupFacts(stdout.join(""), stderr.join(""), configDir),
  };
  throw startupFailure(`Integrated OpenCode HTTP readiness failed: ${JSON.stringify(diagnostics)}`, {
    childExitCode: child.exitCode,
    elapsedMs: Date.now() - startedAt,
    listenObserved: diagnostics.listenObserved,
    probes,
    startup: diagnostics.startup,
    stderrTail: streamTail(stderr),
    stdoutTail: streamTail(stdout),
  });
  } finally {
    if (!handedOff) await stopProofProcessTree(child);
  }
}

async function messageText(server: ServerProcess, project: string, sessionID: string): Promise<string> {
  const messages = await requestData<Array<Record<string, unknown>>>(proofClient(server.url, project).session.messages({
    directory: project,
    limit: 100,
    sessionID,
  }) as Promise<unknown>, "integrated root messages");
  const rows = Array.isArray(messages) ? messages : Array.isArray(record(messages)?.data) ? record(messages)?.data as unknown[] : [];
  return rows.flatMap((message) => {
    const value = record(message);
    const parts = Array.isArray(value?.parts) ? value.parts : Array.isArray(record(value?.info)?.parts) ? record(value?.info)?.parts as unknown[] : [];
    return parts.flatMap((part) => {
      const text = record(part)?.text;
      if (typeof text === "string") return [text];
      const nested = record(text)?.text;
      return typeof nested === "string" ? [nested] : [];
    });
  }).join("\n");
}

async function providerExecutionFacts(server: ServerProcess, project: string, sessionID: string): Promise<Record<string, unknown>> {
  const client = proofClient(server.url, project);
  const children = await requestData<Array<Record<string, unknown>>>(client.session.children({
    directory: project,
    sessionID,
  }) as Promise<unknown>, "integrated provider execution children");
  const sessionIDs = [...new Set([sessionID, ...children.flatMap((child) => typeof child.id === "string" ? [child.id] : [])])];
  const sessions = await Promise.all(sessionIDs.map(async (id) => {
    const detail = await requestData<Record<string, unknown>>(client.session.get({
      directory: project,
      sessionID: id,
    }) as Promise<unknown>, "integrated provider execution session");
    const messages = await requestData<Array<Record<string, unknown>>>(client.session.messages({
      limit: 500,
      directory: project,
      sessionID: id,
    }) as Promise<unknown>, "integrated provider execution messages");
    return {
      guard: record(record(detail.metadata)?.completionGuard),
      id,
      messages: messages.flatMap((message) => {
        const info = record(message.info);
        if (info?.role !== "assistant") return [];
        const parts = Array.isArray(message.parts) ? message.parts : [];
        return [{
          error: info.error == null ? null : proofErrorFacts(info.error),
          finish: typeof info.finish === "string" ? info.finish : null,
          modelID: typeof info.modelID === "string" ? info.modelID : null,
          parts: parts.map((part) => {
            const value = record(part) ?? {};
            const state = record(value.state);
            return {
              error: state?.error == null ? null : proofErrorFacts(state.error),
              input: state?.input ?? null,
              output: typeof state?.output === "string" ? state.output.slice(-2_000) : null,
              status: typeof state?.status === "string" ? state.status : null,
              text: value.type === "text" && typeof value.text === "string" ? value.text.slice(-2_000) : null,
              tool: typeof value.tool === "string" ? value.tool : null,
              type: typeof value.type === "string" ? value.type : null,
            };
          }),
          providerID: typeof info.providerID === "string" ? info.providerID : null,
          tokenReport: info.tokens != null && typeof info.tokens === "object",
        }];
      }),
    };
  }));
  const assistant = sessions.flatMap((session) => session.messages);
  const routes = [...new Set(assistant.flatMap((info) =>
    typeof info.providerID === "string" && typeof info.modelID === "string"
      ? [`${info.providerID}/${info.modelID}`]
      : []
  ))].sort();
  return {
    assistantMessages: assistant.length,
    completedResponses: assistant.filter((info) => typeof info.finish === "string" && info.error == null).length,
    errorResponses: assistant.filter((info) => info.error != null).length,
    routes,
    sessions,
    tokenReports: assistant.filter((info) => info.tokenReport).length,
  };
}

async function ptyServerUrl(server: ServerProcess, project: string, sessionID: string): Promise<string> {
  await proofClient(server.url, project).session.command({
    arguments: "",
    command: "pty-show-server-url",
    directory: project,
    sessionID,
  });
  const deadline = Date.now() + 2_000;
  let text = "";
  while (Date.now() <= deadline) {
    text = await messageText(server, project, sessionID);
    const match = text.match(/PTY Sessions Web Interface URL:\s*(http:\/\/(?:127\.0\.0\.1|\[::1\]):\d+)/);
    if (match != null) return match[1];
    await Bun.sleep(100);
  }
  throw Object.assign(new Error("PTY Sessions Web Interface URL was not delivered"), { observed: text.slice(0, 2_000) });
}

async function ptyFacts(baseUrl: string): Promise<Record<string, unknown>> {
  const response = await fetch(new URL("/api/sessions", baseUrl));
  if (!response.ok) throw new Error(`PTY session inventory failed with ${response.status}`);
  const sessions = await response.json() as Array<Record<string, unknown>>;
  const mission = sessions.find((session) => session.title === "Roadmap mission: integrated-proof");
  if (mission == null || typeof mission.id !== "string") return { mission: null, totalSessions: sessions.length };
  const bufferResponse = await fetch(new URL(`/api/sessions/${encodeURIComponent(mission.id)}/buffer/plain`, baseUrl));
  if (!bufferResponse.ok) throw new Error(`PTY controller buffer read failed with ${bufferResponse.status}`);
  const buffer = await bufferResponse.json() as Record<string, unknown>;
  return {
    mission: {
      buffer: typeof buffer.plain === "string" ? buffer.plain.slice(-20_000) : "",
      exitCode: mission.exitCode ?? null,
      notifyOnExit: mission.notifyOnExit ?? null,
      status: mission.status ?? null,
    },
    totalSessions: sessions.length,
  };
}

function projectFacts(project: string): Record<string, unknown> {
  const resultPath = path.join(project, "evidence", "mission", "slice-a", "attempt-1", "result.json");
  const markerPath = path.join(project, "src", "alpha.txt");
  const statePath = path.join(project, ".opencode-dev-kit", "runtime", "roadmap-missions", "integrated-proof", "state.json");
  let result: Record<string, unknown> | null = null;
  if (fs.existsSync(resultPath)) {
    result = JSON.parse(fs.readFileSync(resultPath, "utf8")) as Record<string, unknown>;
    if (typeof result.rootSessionRef === "string") {
      result.rootSessionRef = `session:${crypto.createHash("sha256").update(result.rootSessionRef).digest("hex").slice(0, 16)}`;
    }
  }
  let state: Record<string, unknown> | null = null;
  if (fs.existsSync(statePath)) {
    state = JSON.parse(fs.readFileSync(statePath, "utf8")) as Record<string, unknown>;
  }
  const status = runPortableCommand(project, ["git", "status", "--short"], { capture: true, timeoutMs: 30_000 });
  const attemptDir = path.join(project, "evidence", "mission", "slice-a", "attempt-1");
  const phases = fs.existsSync(attemptDir)
    ? fs.readdirSync(attemptDir).filter((name) => name.startsWith("result.") && name.endsWith(".json") && name !== "result.json").sort().map((name) => {
      const value = JSON.parse(fs.readFileSync(path.join(attemptDir, name), "utf8")) as Record<string, unknown>;
      return { name, value };
    })
    : [];
  return {
    marker: fs.existsSync(markerPath) ? fs.readFileSync(markerPath, "utf8") : null,
    phases,
    result,
    state,
    tasks: fs.existsSync(path.join(project, "openspec", "changes", "change-a", "tasks.md"))
      ? fs.readFileSync(path.join(project, "openspec", "changes", "change-a", "tasks.md"), "utf8").slice(0, 10_000)
      : null,
    worktree: status.status === 0 ? status.stdout : `git-status-exit-${String(status.status)}`,
  };
}

async function waitForStatus(
  server: ServerProcess,
  project: string,
  sessionID: string,
  predicate: (text: string) => boolean,
  timeoutMs: number,
): Promise<string> {
  const deadline = Date.now() + timeoutMs;
  let text = "";
  do {
    await proofClient(server.url, project).session.command({
      arguments: "integrated-proof",
      command: "mission-status",
      directory: project,
      sessionID,
    });
    text = await messageText(server, project, sessionID);
    if (predicate(text)) return text;
    await Bun.sleep(1_000);
  } while (Date.now() < deadline);
  const error = new Error(`Integrated mission status timed out after observing ${text.length} characters`) as Error & { observed?: string };
  error.observed = text.slice(-8_000);
  throw error;
}

async function cleanupSessions(server: ServerProcess, project: string): Promise<number> {
  const client = proofClient(server.url, project);
  const listed = await requestData<unknown>(client.v2.session.list({ directory: project, roots: true, limit: 500 }) as Promise<unknown>, "integrated cleanup roots");
  const value = record(listed);
  const rows = Array.isArray(listed) ? listed : Array.isArray(value?.data) ? value.data : [];
  const ids = rows.map(record).flatMap((row) => typeof row?.id === "string" ? [row.id] : []);
  for (const id of ids) {
    const children = await requestData<Array<Record<string, unknown>>>(client.session.children({ directory: project, sessionID: id }) as Promise<unknown>, "integrated cleanup children");
    for (const child of children) {
      if (typeof child.id === "string") await requestData(client.session.delete({ directory: project, sessionID: child.id }) as Promise<unknown>, "integrated child delete");
    }
    await requestData(client.session.delete({ directory: project, sessionID: id }) as Promise<unknown>, "integrated root delete");
  }
  return ids.length;
}

function evaluateStartup(raw: Record<string, unknown>, candidateId: string): Record<string, unknown> {
  const server = record(raw.server);
  const startup = record(server?.startup);
  const probes = Array.isArray(server?.probes) ? server.probes as Array<Record<string, unknown>> : [];
  const pathProbe = probes.find((probe) => probe.route === "/path");
  const statusProbe = probes.find((probe) => probe.route === "/session/status");
  const checks = {
    candidateMatched: raw.candidateId === candidateId,
    cleanupComplete: raw.cleanup === "complete",
    hostConfigAbsent: startup?.hostConfigLoaded === false,
    httpPathAnswered: typeof pathProbe?.status === "number",
    httpStatusAnswered: typeof statusProbe?.status === "number",
    isolatedConfigLoaded: startup?.isolatedConfigLoaded === true,
    listenObserved: server?.listenObserved === true,
    noCommandInventory: Array.isArray(server?.commandNames) && server.commandNames.length === 0,
    noRipgrepDownload: startup?.ripgrepDownloadRequested === false,
    noSessionsCreated: raw.deletedRootSessions === 0,
  };
  return {
    candidateId,
    checks,
    liveCalls: 0,
    proof: false,
    schemaVersion: 1,
    status: Object.values(checks).every(Boolean) ? "complete" : "blocked",
  };
}

function evaluate(raw: Record<string, unknown>, candidateId: string): Record<string, unknown> {
  const result = record(raw.executorResult);
  const providerExecution = record(raw.providerExecution);
  const repository = record(raw.repository);
  const server = record(raw.server);
  const terminal = String(raw.terminalStatus ?? "");
  const providerRoutes = Array.isArray(providerExecution?.routes) ? providerExecution.routes : [];
  const completedProviderResponses = Number(providerExecution?.completedResponses ?? 0);
  const checks = {
    archiveReadback: repository?.activeChanges === 0 && repository?.archiveExists === true,
    candidateMatched: raw.candidateId === candidateId,
    cleanupComplete: raw.cleanup === "complete",
    controllerTerminal: terminal.includes('"durableDisposition": "complete"') && terminal.includes('"status": "exited"'),
    executorTerminalClear: result?.disposition === "completed" && result?.guardState === "passed" && result?.writerClosure === "terminal" && result?.cleanup === "complete",
    localCheckpoint: repository?.checkpointSubject === "roadmap-mission(integrated-proof): checkpoint slice-a",
    markerValidated: repository?.marker === "alpha\n" && repository?.validationExit === 0,
    noRemote: repository?.remotes === "",
    providerExecution: completedProviderResponses > 0
      && Number(providerExecution?.tokenReports ?? 0) > 0
      && providerRoutes.includes("openai/gpt-5.6-sol"),
    serverIsolated: record(server?.startup)?.isolatedConfigLoaded === true && record(server?.startup)?.hostConfigLoaded === false,
    sessionCleanup: Number(raw.deletedRootSessions) >= 2,
    visibleController: String(raw.runningStatus ?? "").includes('"visibility": "opened"') && String(raw.runningStatus ?? "").includes('"notifyOnExit": false'),
  };
  return {
    candidateId,
    checks,
    liveCalls: completedProviderResponses,
    liveCallBasis: "completed-assistant-responses",
    schemaVersion: 1,
    status: Object.values(checks).every(Boolean) ? "complete" : "blocked",
  };
}

function evaluateDiagnostic(raw: Record<string, unknown>, candidateId: string): Record<string, unknown> {
  const project = record(raw.projectFacts);
  const mission = record(record(raw.ptyFacts)?.mission);
  const productOutcome = evaluate(raw, candidateId);
  const checks = {
    candidateMatched: raw.candidateId === candidateId,
    cleanupComplete: raw.cleanup === "complete",
    controllerBufferCaptured: typeof mission?.buffer === "string" && mission.buffer.length > 0,
    executorResultCaptured: record(project?.result) != null,
    sessionCleanup: Number(raw.deletedRootSessions) >= 2,
    stateCaptured: record(project?.state)?.disposition != null,
  };
  return {
    candidateId,
    checks,
    liveCalls: productOutcome.liveCalls,
    liveCallBasis: productOutcome.liveCallBasis,
    productOutcome,
    proof: false,
    schemaVersion: 1,
    status: Object.values(checks).every(Boolean) ? "complete" : "blocked",
  };
}

async function run(opts: Options): Promise<void> {
  if (fs.existsSync(opts.evidenceRoot)) throw new Error("Evidence root already exists");
  fs.mkdirSync(opts.evidenceRoot, { recursive: false });
  const fixture = fs.mkdtempSync(path.join(os.tmpdir(), "roadmap-integrated-proof-"));
  const project = path.join(fixture, "project");
  const configDir = path.join(project, ".proof-config");
  const runtimeRoot = path.join(fixture, "runtime");
  const loaded = loadModelProfile(sourceRoot, opts.profile);
  const route = loaded.profile.agent.build;
  let server: ServerProcess | null = null;
  let cleanup = "pending";
  let failure: unknown = null;
  let ptyUrl: string | null = null;
  let rootID: string | null = null;
  let raw: Record<string, unknown> = {
    candidateId: opts.candidateId,
    cleanup: "pending",
    deletedRootSessions: 0,
    failure: null,
    mode: opts.mode,
    route: `${route.model}/${route.variant}`,
    schemaVersion: 1,
  };
  try {
    writeProject(project);
    if (opts.runtimeUrl != null) {
      const probes = await probeProofServer(opts.runtimeUrl);
      if (!probes.every((probe) => typeof probe.status === "number")) {
        throw new Error(`Attached runtime did not answer HTTP: ${JSON.stringify(probes)}`);
      }
      server = {
        attached: true,
        child: null,
        commandNames: [],
        listenObserved: true,
        probes,
        readyMs: 0,
        stderr: [],
        stdout: [],
        url: opts.runtimeUrl,
      };
      raw.server = {
        attached: true,
        commandNames: [],
        listenObserved: true,
        probes,
        readyMs: 0,
        startup: { hostConfigLoaded: null, isolatedConfigLoaded: false, ripgrepDownloadRequested: false },
      };
    } else {
    writeConfig(configDir, runtimeRoot, route.model, route.variant);
    const xdgAuth = path.join(runtimeRoot, "data", "opencode", "auth.json");
    const testHomeAuth = path.join(runtimeRoot, "home", ".local", "share", "opencode", "auth.json");
    const modelsCatalog = path.join(runtimeRoot, "cache", "opencode", "models.json");
    raw.authPlacement = {
      modelsBytes: fs.existsSync(modelsCatalog) ? fs.statSync(modelsCatalog).size : 0,
      testHomeBytes: fs.existsSync(testHomeAuth) ? fs.statSync(testHomeAuth).size : 0,
      xdgBytes: fs.existsSync(xdgAuth) ? fs.statSync(xdgAuth).size : 0,
    };
    raw.providerMechanism = { builtInProvider: true, defaultPlugins: "enabled", modelDiscovery: "cached-only", providerScope: "openai-only" };
    server = opts.mode === "startup"
      ? await startOpenCodeHttp(configDir, runtimeRoot, project)
      : await startOpenCode(configDir, runtimeRoot, project);
    const startup = proofServerStartupFacts(server.stdout.join(""), server.stderr.join(""), configDir);
    raw.server = {
      commandNames: server.commandNames,
      listenObserved: server.listenObserved,
      probes: server.probes,
      readyMs: server.readyMs,
      startup,
    };
    }
    if (opts.mode === "startup") {
      raw.deletedRootSessions = 0;
      try {
        const listed = await requestData<{ all?: Array<Record<string, unknown>>; connected?: string[] }>(
          proofClient(server.url, project).provider.list({ directory: project }) as Promise<unknown>,
          "startup provider list",
        );
        const all = Array.isArray(listed.all) ? listed.all : [];
        const openai = all.find((row) => row.id === "openai");
        raw.providers = {
          connected: Array.isArray(listed.connected) ? listed.connected.filter((id) => typeof id === "string").sort() : [],
          openaiConnected: Array.isArray(listed.connected) && listed.connected.includes("openai"),
          openaiModelPresent: record(openai?.models)?.["gpt-5.6-sol"] != null,
          openaiPresent: openai != null,
        };
      } catch (error) {
        raw.providers = { error: error instanceof Error ? error.message.slice(0, 500) : String(error).slice(0, 500) };
      }
    } else if (opts.mode === "preflight") {
      const env = isolatedProofServerEnvironment(process.env, configDir, runtimeRoot);
      env.OPENSPEC_TELEMETRY = "0";
      const definition = loadMissionDefinition(project, "opencode-dev-kit/missions/integrated-proof.json");
      recordMissionStopIntent(project, definition, { controllerPtyRef: null, rootSessionRef: null, source: "signal" });
      const client = proofClient(server.url, project);
      const operatorRoute = await waitForProofRoute(client, project, "build");
      raw.operatorRoute = operatorRoute;
      const commandModel = `${operatorRoute.model.providerID}/${operatorRoute.model.modelID}`;
      raw.commandRoute = { agent: operatorRoute.agent, model: commandModel, variant: operatorRoute.variant };
      const root = await requestData<Record<string, unknown>>(client.session.create({
        agent: operatorRoute.agent,
        directory: project,
        model: {
          id: operatorRoute.model.modelID,
          providerID: operatorRoute.model.providerID,
          ...(operatorRoute.variant == null ? {} : { variant: operatorRoute.variant }),
        },
        title: "integrated preflight operator root",
      }) as Promise<unknown>, "integrated preflight root create");
      rootID = String(root.id);
      const runCommand = await client.session.command({
        agent: operatorRoute.agent,
        arguments: "integrated-proof",
        command: "mission-run",
        directory: project,
        model: commandModel,
        sessionID: rootID,
        ...(operatorRoute.variant == null ? {} : { variant: operatorRoute.variant }),
      }) as unknown;
      raw.runCommand = runCommand;
      raw.preflightStatus = await waitForStatus(server, project, rootID, (text) => text.includes('"status": "exited"') && text.includes('"durableDisposition": "paused"'), 60_000);
      try {
        ptyUrl = await ptyServerUrl(server, project, rootID);
      } catch (error) {
        raw.ptyUrlError = error instanceof Error ? error.message.slice(0, 500) : String(error).slice(0, 500);
      }
      raw.modelRootCreated = fs.existsSync(path.join(project, "evidence", "mission", "slice-a", "attempt-1", "result.runtime-inspection.json"));
      const openSpec = runPortableCommand(project, ["openspec", "list", "--json"], { capture: true, env, timeoutMs: 120_000 });
      raw.openSpec = {
        exitCode: openSpec.status,
        stderr: openSpec.stderr.slice(-4_000),
        stdout: openSpec.stdout.slice(-8_000),
      };
      const preflight = runPortableCommand(project, [
        process.execPath,
        path.join(sourceRoot, "global", "bin", "roadmap-mission.ts"),
        "preflight",
        "--root",
        project,
        "--global-source",
        path.join(sourceRoot, "global"),
        "--mission",
        "opencode-dev-kit/missions/integrated-proof.json",
      ], { capture: true, env, timeoutMs: 120_000 });
      const parsed = JSON.parse(preflight.stdout) as Record<string, unknown>;
      raw.preflight = { exitCode: preflight.status, status: parsed.status };
      if (preflight.status !== 0 || parsed.status !== "eligible") throw new Error(`Integrated mission preflight blocked: ${preflight.stderr || preflight.stdout}`);
    } else {
      const client = proofClient(server.url, project);
      const operatorRoute = await waitForProofRoute(client, project, "build");
      raw.operatorRoute = operatorRoute;
      const commandModel = `${operatorRoute.model.providerID}/${operatorRoute.model.modelID}`;
      raw.commandRoute = { agent: operatorRoute.agent, model: commandModel, variant: operatorRoute.variant };
      const root = await requestData<Record<string, unknown>>(client.session.create({
        agent: operatorRoute.agent,
        directory: project,
        model: {
          id: operatorRoute.model.modelID,
          providerID: operatorRoute.model.providerID,
          ...(operatorRoute.variant == null ? {} : { variant: operatorRoute.variant }),
        },
        title: "integrated mission operator root",
      }) as Promise<unknown>, "integrated operator root create");
      rootID = String(root.id);
      raw.runCommand = await client.session.command({
        agent: operatorRoute.agent,
        arguments: "integrated-proof",
        command: "mission-run",
        directory: project,
        model: commandModel,
        sessionID: rootID,
        ...(operatorRoute.variant == null ? {} : { variant: operatorRoute.variant }),
      }) as unknown;
      raw.runningStatus = await waitForStatus(server, project, rootID, (text) => text.includes('"status": "running"') && text.includes('"visibility": "opened"'), 60_000);
      try {
        ptyUrl = await ptyServerUrl(server, project, rootID);
      } catch (error) {
        raw.ptyUrlError = error instanceof Error ? error.message.slice(0, 500) : String(error).slice(0, 500);
      }
      const resultPath = path.join(project, "evidence", "mission", "slice-a", "attempt-1", "result.json");
      const statePath = path.join(project, ".opencode-dev-kit", "runtime", "roadmap-missions", "integrated-proof", "state.json");
      raw.terminalStatus = await waitForStatus(
        server,
        project,
        rootID,
        opts.mode === "diagnose"
          ? (text) => fs.existsSync(resultPath) || (text.includes('"status": "exited"') && text.includes('"durableDisposition":'))
          : (text) => text.includes('"durableDisposition": "complete"') && text.includes('"status": "exited"') && text.includes('"terminalToast": "sent"'),
        600_000,
      );
      raw.durableFiles = { result: fs.existsSync(resultPath), state: fs.existsSync(statePath) };
      if (opts.mode === "capture") {
        const resultPath = path.join(project, "evidence", "mission", "slice-a", "attempt-1", "result.json");
        raw.executorResult = JSON.parse(fs.readFileSync(resultPath, "utf8"));
        const executorSessionRef = record(raw.executorResult)?.rootSessionRef;
        if (typeof executorSessionRef !== "string") throw new Error("Integrated executor result has no root session reference");
        raw.providerExecution = await providerExecutionFacts(server, project, executorSessionRef);
        const validation = runPortableCommand(project, ["node", "tools/validate.mjs"], { capture: true, timeoutMs: 120_000 });
        const active = runPortableCommand(project, ["openspec", "list", "--json"], { capture: true, timeoutMs: 120_000 });
        const activeJson = JSON.parse(active.stdout) as { changes?: unknown[] };
        const archiveRoot = path.join(project, "openspec", "changes", "archive");
        raw.repository = {
          activeChanges: activeJson.changes?.length ?? -1,
          archiveExists: fs.existsSync(archiveRoot) && fs.readdirSync(archiveRoot).length === 1,
          checkpoint: git(project, ["rev-parse", "HEAD"]),
          checkpointSubject: git(project, ["log", "-1", "--pretty=%s"]),
          marker: fs.readFileSync(path.join(project, "src", "alpha.txt"), "utf8"),
          remotes: git(project, ["remote"]),
          validationExit: validation.status,
        };
        raw.sources = [
          "global/bin/roadmap-mission/controller.ts",
          "global/bin/roadmap-mission/controller-result.ts",
          "global/bin/roadmap-mission/session-executor.ts",
          "global/extensions/roadmap-mission-launcher.ts",
        ].map((relative) => ({ path: relative, sha256: hash(path.join(sourceRoot, relative)) }));
      }
    }
  } catch (error) {
    failure = error;
    const observed = error instanceof Error && "observed" in error ? String((error as Error & { observed?: string }).observed ?? "") : "";
    const startup = error instanceof Error ? error as Error & {
      childExitCode?: number | null;
      elapsedMs?: number;
      listenObserved?: boolean;
      probes?: Array<{ error?: string; route: string; status?: number }>;
      startup?: Record<string, unknown>;
      stderrTail?: string;
      stdoutTail?: string;
    } : null;
    raw.failure = {
      childExitCode: startup?.childExitCode ?? null,
      elapsedMs: startup?.elapsedMs ?? null,
      error: error instanceof Error ? error.message.slice(0, 4_000) : String(error).slice(0, 4_000),
      observedStatus: observed,
      stderrTail: typeof startup?.stderrTail === "string" ? startup.stderrTail : "",
      stdoutTail: typeof startup?.stdoutTail === "string" ? startup.stdoutTail : "",
    };
    if (raw.server == null && startup != null && (startup.listenObserved != null || startup.probes != null || startup.startup != null)) {
      raw.server = {
        commandNames: [],
        listenObserved: startup.listenObserved === true,
        probes: Array.isArray(startup.probes) ? startup.probes : [],
        readyMs: typeof startup.elapsedMs === "number" ? startup.elapsedMs : null,
        startup: startup.startup ?? null,
      };
    }
  } finally {
    const replacements: Array<[string, string]> = [
      [fixture, "<fixture>"],
      [sourceRoot, "<source-root>"],
      [os.homedir(), "<home>"],
      [durableIntegratedCacheHome(), "<integrated-cache>"],
    ];
    if (opts.runtimeUrl != null) replacements.push([opts.runtimeUrl, "<runtime-url>"]);
    if (process.env.OPENCODE_SERVER_PASSWORD) replacements.push([process.env.OPENCODE_SERVER_PASSWORD, "<server-password>"]);
    try {
      if (server != null) {
        const executorResultPath = path.join(project, "evidence", "mission", "slice-a", "attempt-1", "result.json");
        const liveExecutorResult = fs.existsSync(executorResultPath)
          ? JSON.parse(fs.readFileSync(executorResultPath, "utf8")) as Record<string, unknown>
          : null;
        const liveExecutorSessionRef = record(raw.executorResult)?.rootSessionRef ?? liveExecutorResult?.rootSessionRef;
        const snapshot = projectFacts(project);
        raw.projectFacts = snapshot;
        if (raw.executorResult == null && record(snapshot.result) != null) raw.executorResult = snapshot.result;
        if (raw.providerExecution == null && typeof liveExecutorSessionRef === "string") {
          try {
            raw.providerExecution = await providerExecutionFacts(server, project, liveExecutorSessionRef);
          } catch (error) {
            raw.providerExecution = { observationError: error instanceof Error ? error.message.slice(0, 500) : String(error).slice(0, 500) };
          }
        }
        if (ptyUrl == null && rootID != null) {
          try {
            ptyUrl = await ptyServerUrl(server, project, rootID);
          } catch (error) {
            raw.ptyUrlError = error instanceof Error ? error.message.slice(0, 500) : String(error).slice(0, 500);
          }
        }
        if (ptyUrl != null) raw.ptyFacts = await ptyFacts(ptyUrl);
        const diagnosticText = `${server.stderr.join("")}\n${server.stdout.join("")}`.split(/\r?\n/)
          .filter((line) => /\b(?:error|failed|mission|pty|err_[A-Za-z0-9]+)\b/i.test(line) && !line.includes("Command handled by roadmap mission launcher"))
          .slice(-100)
          .join("\n");
        raw.serverDiagnostics = diagnosticText.slice(-20_000);
        raw.deletedRootSessions = opts.mode === "startup" ? 0 : await cleanupSessions(server, project);
        if (server.child != null && server.attached !== true) await stopProofProcessTree(server.child);
      }
      removeProofFixture(fixture);
      cleanup = "complete";
    } catch (error) {
      cleanup = "failed";
      failure ??= error;
    }
    raw.cleanup = cleanup;
    raw = redactValue(raw, replacements) as Record<string, unknown>;
    writeNew(path.join(opts.evidenceRoot, "raw.json"), json(raw));
  }
  if (opts.mode === "startup") {
    const evaluation = evaluateStartup(raw, opts.candidateId);
    writeNew(path.join(opts.evidenceRoot, "evaluation.json"), json(evaluation));
    console.log(json({ candidateId: opts.candidateId, evidenceRoot: "<evidence-root>", mode: "startup", status: evaluation.status }).trimEnd());
    if (failure != null || evaluation.status !== "complete") process.exitCode = 1;
    return;
  }
  if (opts.mode === "preflight") {
    const checks = {
      cleanupComplete: cleanup === "complete",
      commandsLoaded: ["disable-grind", "enable-grind", "mission-run", "mission-status", "mission-stop", "opsx-apply"].every((name) => (record(raw.server)?.commandNames as unknown[] | undefined)?.includes(name)),
      missionEligible: record(raw.preflight)?.status === "eligible",
      noModelCall: raw.modelRootCreated === false,
      ptyFinalization: typeof record(record(raw.ptyFacts)?.mission)?.buffer === "string",
      slashBoundary: typeof raw.preflightStatus === "string" && raw.preflightStatus.includes('"durableDisposition": "paused"'),
      serverIsolated: record(record(raw.server)?.startup)?.isolatedConfigLoaded === true && record(record(raw.server)?.startup)?.hostConfigLoaded === false,
    };
    const evaluation = { candidateId: opts.candidateId, checks, liveCalls: 0, schemaVersion: 1, status: Object.values(checks).every(Boolean) ? "complete" : "blocked" };
    writeNew(path.join(opts.evidenceRoot, "evaluation.json"), json(evaluation));
    console.log(json({ candidateId: opts.candidateId, evidenceRoot: "<evidence-root>", mode: "preflight", status: evaluation.status }).trimEnd());
    if (failure != null || evaluation.status !== "complete") process.exitCode = 1;
    return;
  }
  const evaluation = opts.mode === "diagnose" ? evaluateDiagnostic(raw, opts.candidateId) : evaluate(raw, opts.candidateId);
  writeNew(path.join(opts.evidenceRoot, "evaluation.json"), json(evaluation));
  console.log(json({ candidateId: opts.candidateId, evidenceRoot: "<evidence-root>", mode: opts.mode, status: evaluation.status }).trimEnd());
  if (failure != null || evaluation.status !== "complete") process.exitCode = 1;
}

function replay(opts: Options): void {
  if (opts.inputRoot == null) throw new Error("replay requires --input-root");
  if (fs.existsSync(opts.evidenceRoot)) throw new Error("Evidence root already exists");
  const raw = JSON.parse(fs.readFileSync(path.join(opts.inputRoot, "raw.json"), "utf8")) as Record<string, unknown>;
  const evaluation = raw.mode === "diagnose"
    ? evaluateDiagnostic(raw, opts.candidateId)
    : raw.mode === "startup"
      ? evaluateStartup(raw, opts.candidateId)
      : evaluate(raw, opts.candidateId);
  fs.mkdirSync(opts.evidenceRoot, { recursive: false });
  writeNew(path.join(opts.evidenceRoot, "evaluation.json"), json(evaluation));
  console.log(json({ candidateId: opts.candidateId, evidenceRoot: "<evidence-root>", liveCalls: 0, mode: "replay", status: evaluation.status }).trimEnd());
  if (evaluation.status !== "complete") process.exitCode = 1;
}

async function selftest(opts: Options): Promise<void> {
  if (fs.existsSync(opts.evidenceRoot)) throw new Error("Evidence root already exists");
  const fixture = fs.mkdtempSync(path.join(os.tmpdir(), "roadmap-integrated-finalizer-"));
  const project = path.join(fixture, "project");
  let cleanup = "pending";
  let failure: unknown = null;
  let raw: Record<string, unknown> | null = null;
  const server = Bun.serve({
    hostname: "127.0.0.1",
    port: 0,
    fetch(request) {
      const url = new URL(request.url);
      if (url.pathname === "/api/sessions") {
        return Response.json([{ id: "pty-proof", title: "Roadmap mission: integrated-proof", status: "exited", exitCode: 1, notifyOnExit: false }]);
      }
      if (url.pathname === "/api/sessions/pty-proof/buffer/plain") {
        return Response.json({ byteLength: 27, plain: "synthetic controller terminal\n" });
      }
      return new Response("not found", { status: 404 });
    },
  });
  try {
    writeProject(project);
    const loaded = loadModelProfile(sourceRoot, opts.profile);
    const route = loaded.profile.agent.build;
    const configDir = path.join(project, ".proof-config");
    writeConfig(configDir, path.join(fixture, "runtime"), route.model, route.variant);
    const generatedConfig = JSON.parse(fs.readFileSync(path.join(configDir, "opencode.json"), "utf8")) as Record<string, unknown>;
    const guardPlugin = (Array.isArray(generatedConfig.plugin) ? generatedConfig.plugin : []).find((plugin) =>
      Array.isArray(plugin) && typeof plugin[0] === "string" && plugin[0].includes("session-completion-guard")
    );
    const guardOptions = Array.isArray(guardPlugin) ? record(guardPlugin[1]) : null;
    const gate = runPortableCommand(project, [
      process.execPath,
      path.join(configDir, "bin", "openspec-operation-gate.ts"),
      "--root",
      project,
      "--operation",
      "apply",
      "--change",
      "change-a",
    ], { capture: true, timeoutMs: 120_000 });
    const resultPath = path.join(project, "evidence", "mission", "slice-a", "attempt-1", "result.json");
    writeNew(resultPath, json({
      cleanup: "complete",
      disposition: "terminal",
      errorClass: "terminal",
      errorMessage: "synthetic finalizer probe",
      rootSessionRef: "synthetic-session",
      writerClosure: "terminal",
    }));
    writeNew(path.join(project, ".opencode-dev-kit", "runtime", "roadmap-missions", "integrated-proof", "state.json"), json({
      activeOperation: null,
      cursor: 0,
      disposition: "blocked",
    }));
    writeNew(path.join(project, "src", "alpha.txt"), "alpha\n");
    raw = {
      candidateId: opts.candidateId,
      certificateIssuerConfigured: Array.isArray(guardOptions?.certificateIssuers)
        && guardOptions.certificateIssuers.includes(ROADMAP_MISSION_CERTIFICATE_ISSUER),
      cleanup: "pending",
      gateStatus: gate.status,
      projectFacts: projectFacts(project),
      ptyFacts: await ptyFacts(server.url.href),
      schemaVersion: 1,
    };
  } catch (error) {
    failure = error;
  } finally {
    server.stop(true);
    try {
      removeProofFixture(fixture);
      cleanup = "complete";
    } catch (error) {
      cleanup = "failed";
      failure ??= error;
    }
  }
  fs.mkdirSync(opts.evidenceRoot, { recursive: false });
  const projectSnapshot = record(raw?.projectFacts);
  const result = record(projectSnapshot?.result);
  const state = record(projectSnapshot?.state);
  const mission = record(record(raw?.ptyFacts)?.mission);
  const checks = {
    certificateIssuerConfigured: raw?.certificateIssuerConfigured === true,
    cleanupComplete: cleanup === "complete",
    controllerBufferPreserved: mission?.buffer === "synthetic controller terminal\n",
    gateExecutable: raw?.gateStatus === 0,
    markerPreserved: projectSnapshot?.marker === "alpha\n",
    resultPreserved: result?.disposition === "terminal" && result?.rootSessionRef === `session:${crypto.createHash("sha256").update("synthetic-session").digest("hex").slice(0, 16)}`,
    statePreserved: state?.disposition === "blocked" && state?.activeOperation === null,
  };
  const evaluation = { candidateId: opts.candidateId, checks, liveCalls: 0, schemaVersion: 1, status: Object.values(checks).every(Boolean) ? "complete" : "blocked" };
  writeNew(path.join(opts.evidenceRoot, "raw.json"), json({ ...(raw ?? {}), cleanup }));
  writeNew(path.join(opts.evidenceRoot, "evaluation.json"), json(evaluation));
  console.log(json({ candidateId: opts.candidateId, evidenceRoot: "<evidence-root>", liveCalls: 0, mode: "selftest", status: evaluation.status }).trimEnd());
  if (failure != null || evaluation.status !== "complete") process.exitCode = 1;
}

const parsed = options(process.argv.slice(2));
const execution = parsed.help
  ? Promise.resolve().then(() => console.log(usage()))
  : parsed.mode === "replay"
    ? Promise.resolve().then(() => replay(parsed))
    : parsed.mode === "selftest"
      ? selftest(parsed)
    : run(parsed);
execution.catch((error) => {
  console.error(json({ error: error instanceof Error ? error.message : String(error), status: "blocked" }).trimEnd());
  process.exitCode = 1;
});
