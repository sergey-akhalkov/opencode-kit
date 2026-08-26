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

type Mode = "capture" | "diagnose" | "idle-api" | "preflight" | "replay" | "selftest" | "startup";
type Scenario = "one-slice" | "two-slice";
type Options = {
  candidateId: string;
  evidenceRoot: string;
  help: boolean;
  inputRoot: string | null;
  mode: Mode;
  profile: string;
  runtimeUrl: string | null;
  scenario: Scenario;
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
    "  bun tools/proofs/roadmap-mission-integrated.ts --mode preflight --profile <name> --candidate-id <id> --evidence-root <absolute-new-path> [--scenario one-slice|two-slice]",
    "  bun tools/proofs/roadmap-mission-integrated.ts --mode capture --profile <name> --candidate-id <id> --evidence-root <absolute-new-path> [--scenario one-slice|two-slice]",
    "  bun tools/proofs/roadmap-mission-integrated.ts --mode diagnose --profile <name> --candidate-id <id> --evidence-root <absolute-new-path> [--runtime-url <loopback-url>]",
    "  bun tools/proofs/roadmap-mission-integrated.ts --mode idle-api --profile <name> --candidate-id <id> --evidence-root <absolute-new-path>",
    "  bun tools/proofs/roadmap-mission-integrated.ts --mode startup --profile <name> --candidate-id <id> --evidence-root <absolute-new-path>",
    "  bun tools/proofs/roadmap-mission-integrated.ts --mode replay --candidate-id <id> --input-root <capture-path> --evidence-root <absolute-new-path>",
    "  bun tools/proofs/roadmap-mission-integrated.ts --mode selftest --candidate-id <id> --evidence-root <absolute-new-path> [--scenario one-slice|two-slice]",
  ].join("\n");
}

function required(args: string[], index: number, option: string): string {
  const value = args[index + 1];
  if (value == null || value.trim() === "" || value.startsWith("--")) throw new Error(`Missing value for ${option}`);
  return value;
}

function options(args: string[]): Options {
  if (args.length === 1 && (args[0] === "--help" || args[0] === "-h")) {
    return { candidateId: "help", evidenceRoot: sourceRoot, help: true, inputRoot: null, mode: "preflight", profile: "quality-independent", runtimeUrl: null, scenario: "one-slice" };
  }
  let candidateId = "";
  let evidenceRoot = "";
  let inputRoot = "";
  let mode = "";
  let profile = "quality-independent";
  let runtimeUrl = "";
  let scenario: Scenario = "one-slice";
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
    } else if (arg === "--scenario") {
      const value = required(args, index, arg);
      if (value !== "one-slice" && value !== "two-slice") throw new Error("--scenario must be one-slice or two-slice");
      scenario = value;
      index++;
    } else {
      throw new Error(`Unknown option: ${arg}`);
    }
  }
  if (mode !== "capture" && mode !== "diagnose" && mode !== "idle-api" && mode !== "preflight" && mode !== "replay" && mode !== "selftest" && mode !== "startup") throw new Error("--mode must be preflight, capture, diagnose, idle-api, replay, selftest, or startup");
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
    scenario,
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

function writeProject(project: string, scenario: Scenario): void {
  const alphaSlice = {
    changeId: "change-a",
    dependsOn: scenario === "two-slice" ? ["slice-b"] : [],
    effectClasses: ["local-commit", "local-read", "local-write", "provider-inference"],
    id: "slice-a",
    operation: "continue",
    outcome: "Create and validate the exact disposable alpha marker.",
    ownedPaths: ["openspec/changes/change-a", "openspec/specs/synthetic-alpha", "src/alpha.txt"],
  };
  const betaSlice = {
    changeId: "change-b",
    dependsOn: [],
    effectClasses: ["local-commit", "local-read", "local-write", "provider-inference"],
    id: "slice-b",
    operation: "propose",
    outcome: "Use the configured proof-minimal single-instruction workflow to create only the complete change-b planning set: proposal.md, specs/synthetic-beta/spec.md, design.md, tasks.md, and history.md for the exact disposable beta marker, then stop when all four configured OpenSpec artifacts are complete and apply-ready.",
    ownedPaths: ["openspec/changes/change-b", "openspec/specs/synthetic-beta", "src/beta.txt"],
  };
  writeNew(path.join(project, "AGENTS.md"), [
    "# Disposable Integrated Mission Proof",
    "",
    "## Runtime Authority",
    "",
    ...(scenario === "two-slice" ? [
      "This is an effect-contained synthetic project. Implement only the exact mission-selected marker change.",
      "For `change-b`, create `src/beta.txt` with exact text `beta` plus one newline. For `change-a`, create `src/alpha.txt` with exact text `alpha` plus one newline.",
      "Update only the selected change's task and run `node tools/validate.mjs`. Do not alter or activate another slice.",
    ] : [
      "This is an effect-contained synthetic project. Implement only the active `change-a` marker change.",
      "Write `src/alpha.txt` with exact text `alpha` plus one newline, update only that change's task, and run `node tools/validate.mjs`.",
    ]),
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
    slices: scenario === "two-slice" ? [betaSlice, alphaSlice] : [alphaSlice],
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
  writeNew(path.join(project, "openspec", "config.yaml"), `schema: ${scenario === "two-slice" ? "proof-minimal" : "spec-driven"}\n\ncontext: |\n  Disposable exact-marker proof; no external effects.\n`);
  if (scenario === "two-slice") {
    const schemaRoot = path.join(project, "openspec", "schemas", "proof-minimal");
    writeNew(path.join(schemaRoot, "schema.yaml"), [
      "name: proof-minimal",
      "version: 1",
      "description: Single-plan workflow for the disposable exact-marker proof",
      "artifacts:",
      "  - id: tasks",
      "    generates: tasks.md",
      "    description: Complete disposable beta planning set",
      "    template: plan.md",
      "    instruction: |",
      "      Create the complete change-b planning set in one concise edit and do not add other artifacts:",
      "      - proposal.md with Why, What Changes, all seven Outcome Capsule fields, one concise Claim And Evidence Scope, synthetic-beta as a new capability, and src/beta.txt impact.",
      "      - specs/synthetic-beta/spec.md with a 50+ character Purpose and one ADDED deterministic beta-marker requirement with a WHEN/THEN scenario.",
      "      - design.md with concise context, exact-marker goal/non-goals, direct-file decision, and content-drift mitigation.",
      "      - tasks.md with exactly one unchecked task 1.1 to create src/beta.txt as exact beta plus one trailing newline and run node tools/validate.mjs.",
      "      - history.md with one concise rejected-helper strategy, do-not-repeat condition, and evidence-based retry condition.",
      "      This is one exact local marker with no broad claim, ownership manifest, evidence index, external effect, or unrelated change.",
      "    requires: []",
      "  - id: proposal",
      "    generates: proposal.md",
      "    description: Conventional proposal identity completed by the single tasks instruction",
      "    template: proposal.md",
      "    requires: []",
      "  - id: specs",
      "    generates: specs/**/*.md",
      "    description: Conventional spec identity completed by the single tasks instruction",
      "    template: spec.md",
      "    requires: []",
      "  - id: design",
      "    generates: design.md",
      "    description: Conventional design identity completed by the single tasks instruction",
      "    template: design.md",
      "    requires: []",
      "apply:",
      "  requires: [tasks]",
      "  tracks: tasks.md",
      "  instruction: |",
      "    Create src/beta.txt with exact text beta and one trailing newline, run node tools/validate.mjs, and check task 1.1 only after validation exits zero.",
      "",
    ].join("\n"));
    writeNew(path.join(schemaRoot, "templates", "plan.md"), "## 1. Beta Marker\n\n- [ ] 1.1 Create `src/beta.txt` with exact text `beta` and one trailing newline, then verify `node tools/validate.mjs` exits zero.\n");
    writeNew(path.join(schemaRoot, "templates", "proposal.md"), "## Why\n\nDescribe the exact local beta marker.\n");
    writeNew(path.join(schemaRoot, "templates", "spec.md"), "## ADDED Requirements\n\n### Requirement: Beta marker is deterministic\n\n#### Scenario: Exact marker\n- **WHEN** validation runs\n- **THEN** exact beta content is required\n");
    writeNew(path.join(schemaRoot, "templates", "design.md"), "## Context\n\nUse one direct exact marker file.\n");
  }
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
    `const twoSlice = ${scenario === "two-slice" ? "true" : "false"};`,
    "const changesRoot = path.join('openspec', 'changes');",
    "const archiveRoot = path.join(changesRoot, 'archive');",
    "const taskFiles = (change) => {",
    "  const active = path.join(changesRoot, change, 'tasks.md');",
    "  const archived = fs.existsSync(archiveRoot) ? fs.readdirSync(archiveRoot, { withFileTypes: true })",
    "    .filter((entry) => entry.isDirectory() && (entry.name === change || entry.name.endsWith(`-${change}`)))",
    "    .map((entry) => path.join(archiveRoot, entry.name, 'tasks.md')).filter((file) => fs.existsSync(file)) : [];",
    "  return fs.existsSync(active) ? [active] : archived;",
    "};",
    "const validateChange = (change, marker, content, required, allowUnchecked = false) => {",
    "  const tasks = taskFiles(change);",
    "  if ((required && tasks.length !== 1) || tasks.length > 1) process.exit(1);",
    "  if (tasks.length === 0) return;",
    "  if (!fs.readFileSync(tasks[0], 'utf8').includes('- [x] 1.1')) { if (allowUnchecked) return; process.exit(1); }",
    "  if (!fs.existsSync(marker) || fs.readFileSync(marker, 'utf8') !== content) process.exit(1);",
    "};",
    "validateChange('change-a', path.join('src', 'alpha.txt'), 'alpha\\n', true, twoSlice);",
    "validateChange('change-b', path.join('src', 'beta.txt'), 'beta\\n', false);",
    "if (!twoSlice && taskFiles('change-b').length !== 0) process.exit(1);",
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

async function startOpenCodeHttp(
  configDir: string,
  runtimeRoot: string,
  project: string,
  defaultPlugins = true,
): Promise<ServerProcess> {
  const startedAt = Date.now();
  const port = await freePort();
  const environment = isolatedProofServerEnvironment(process.env, configDir, runtimeRoot);
  if (defaultPlugins) delete environment.OPENCODE_DISABLE_DEFAULT_PLUGINS;
  environment.OPENCODE_PROOF_TERMINAL_STAGE_STDERR = "1";
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
    const metadata = record(detail.metadata);
    const mission = record(metadata?.roadmapMission);
    const messages = await requestData<Array<Record<string, unknown>>>(client.session.messages({
      limit: 500,
      directory: project,
      sessionID: id,
    }) as Promise<unknown>, "integrated provider execution messages");
    return {
      guard: record(metadata?.completionGuard),
      id,
      mission: mission == null ? null : {
        certificateReason: typeof mission.certificateReason === "string" ? mission.certificateReason : null,
        certificateStatus: typeof mission.certificateStatus === "string" ? mission.certificateStatus : null,
        missionId: typeof mission.missionId === "string" ? mission.missionId : null,
        sliceId: typeof mission.sliceId === "string" ? mission.sliceId : null,
        terminalCertificate: record(mission.terminalCertificate),
      },
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

async function missionSessionFacts(server: ServerProcess, project: string, missionId: string): Promise<Array<Record<string, unknown>>> {
  const client = proofClient(server.url, project);
  const listed = await requestData<unknown>(client.v2.session.list({ directory: project, roots: true, limit: 500 }) as Promise<unknown>, "integrated mission roots");
  const value = record(listed);
  const rows = Array.isArray(listed) ? listed : Array.isArray(value?.data) ? value.data : [];
  const facts: Array<Record<string, unknown>> = [];
  for (const row of rows.map(record)) {
    if (typeof row?.id !== "string") continue;
    const detail = await requestData<Record<string, unknown>>(client.session.get({
      directory: project,
      sessionID: row.id,
    }) as Promise<unknown>, "integrated mission root detail");
    const mission = record(record(detail.metadata)?.roadmapMission);
    if (mission?.missionId !== missionId || typeof mission.sliceId !== "string") continue;
    facts.push({
      facts: await providerExecutionFacts(server, project, row.id),
      sliceId: mission.sliceId,
    });
  }
  return facts;
}

async function guardIdleApiFacts(
  client: ReturnType<typeof proofClient>,
  project: string,
  sessionID: string,
): Promise<Array<Record<string, unknown>>> {
  const facts: Array<Record<string, unknown>> = [];
  const probe = async (label: string, expected: "array" | "object", request: Promise<unknown>): Promise<void> => {
    try {
      const data = await requestData<unknown>(request, `guard idle ${label}`);
      const actual = Array.isArray(data) ? "array" : data != null && typeof data === "object" ? "object" : typeof data;
      facts.push({ actual, expected, label, ok: actual === expected });
    } catch (error) {
      facts.push({ error: proofErrorFacts(error), expected, label, ok: false });
    }
  };
  await probe("status", "object", client.session.status({ directory: project }) as Promise<unknown>);
  await probe("children", "array", client.session.children({ directory: project, sessionID }) as Promise<unknown>);
  await probe("messages", "array", client.session.messages({ directory: project, limit: 200, sessionID }) as Promise<unknown>);
  await probe("todo", "array", client.session.todo({ directory: project, sessionID }) as Promise<unknown>);
  await probe("diff", "array", client.session.diff({ directory: project, sessionID }) as Promise<unknown>);
  await probe("get", "object", client.session.get({ directory: project, sessionID }) as Promise<unknown>);
  return facts;
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

function projectFacts(project: string, scenario: Scenario): Record<string, unknown> {
  const statePath = path.join(project, ".opencode-dev-kit", "runtime", "roadmap-missions", "integrated-proof", "state.json");
  let state: Record<string, unknown> | null = null;
  if (fs.existsSync(statePath)) {
    state = JSON.parse(fs.readFileSync(statePath, "utf8")) as Record<string, unknown>;
  }
  const status = runPortableCommand(project, ["git", "status", "--short"], { capture: true, timeoutMs: 30_000 });
  const sliceIds = scenario === "two-slice" ? ["slice-b", "slice-a"] : ["slice-a"];
  const results = sliceIds.map((sliceId) => {
    const attemptDir = path.join(project, "evidence", "mission", sliceId, "attempt-1");
    const resultPath = path.join(attemptDir, "result.json");
    let result: Record<string, unknown> | null = null;
    if (fs.existsSync(resultPath)) {
      result = JSON.parse(fs.readFileSync(resultPath, "utf8")) as Record<string, unknown>;
      if (typeof result.rootSessionRef === "string") {
        result.rootSessionRef = `session:${crypto.createHash("sha256").update(result.rootSessionRef).digest("hex").slice(0, 16)}`;
      }
    }
    const phases = fs.existsSync(attemptDir)
      ? fs.readdirSync(attemptDir).filter((name) => name.startsWith("result.") && name.endsWith(".json") && name !== "result.json").sort().map((name) => ({
          name,
          value: JSON.parse(fs.readFileSync(path.join(attemptDir, name), "utf8")) as Record<string, unknown>,
        }))
      : [];
    return { phases, result, sliceId };
  });
  const alpha = results.find((entry) => entry.sliceId === "slice-a") ?? { phases: [], result: null };
  const taskText = (changeId: string): string | null => {
    const active = path.join(project, "openspec", "changes", changeId, "tasks.md");
    const archiveRoot = path.join(project, "openspec", "changes", "archive");
    const archived = fs.existsSync(archiveRoot)
      ? fs.readdirSync(archiveRoot, { withFileTypes: true })
          .filter((entry) => entry.isDirectory() && (entry.name === changeId || entry.name.endsWith(`-${changeId}`)))
          .map((entry) => path.join(archiveRoot, entry.name, "tasks.md"))
          .filter((file) => fs.existsSync(file))
      : [];
    const files = fs.existsSync(active) ? [active] : archived;
    return files.length === 1 ? fs.readFileSync(files[0], "utf8").slice(0, 10_000) : null;
  };
  const transitionRoot = path.join(project, ".opencode-dev-kit", "runtime", "roadmap-missions", "integrated-proof", "transitions");
  const transitions = fs.existsSync(transitionRoot)
    ? fs.readdirSync(transitionRoot).sort().map((name) => {
        const transition = JSON.parse(fs.readFileSync(path.join(transitionRoot, name), "utf8")) as Record<string, unknown>;
        return {
          checkpointIdentity: transition.checkpointIdentity ?? null,
          cursor: transition.cursor ?? null,
          kind: transition.kind ?? null,
          sequence: transition.sequence ?? null,
          sliceId: transition.sliceId ?? null,
        };
      })
    : [];
  return {
    marker: fs.existsSync(path.join(project, "src", "alpha.txt")) ? fs.readFileSync(path.join(project, "src", "alpha.txt"), "utf8") : null,
    markers: {
      alpha: fs.existsSync(path.join(project, "src", "alpha.txt")) ? fs.readFileSync(path.join(project, "src", "alpha.txt"), "utf8") : null,
      beta: fs.existsSync(path.join(project, "src", "beta.txt")) ? fs.readFileSync(path.join(project, "src", "beta.txt"), "utf8") : null,
    },
    phases: alpha.phases,
    result: alpha.result,
    results,
    scenario,
    state,
    tasks: taskText("change-a"),
    taskEvidence: { "change-a": taskText("change-a"), "change-b": taskText("change-b") },
    transitions,
    worktree: status.status === 0 ? status.stdout : `git-status-exit-${String(status.status)}`,
  };
}

function existingExecutorResults(project: string, sliceIds: string[]): Array<{ result: Record<string, unknown>; sliceId: string }> {
  return sliceIds.flatMap((sliceId) => {
    const resultPath = path.join(project, "evidence", "mission", sliceId, "attempt-1", "result.json");
    return fs.existsSync(resultPath)
      ? [{ result: JSON.parse(fs.readFileSync(resultPath, "utf8")) as Record<string, unknown>, sliceId }]
      : [];
  });
}

function captureRepositoryFacts(project: string, sliceIds: string[]): Record<string, unknown> {
  const validation = runPortableCommand(project, ["node", "tools/validate.mjs"], { capture: true, timeoutMs: 120_000 });
  const active = runPortableCommand(project, ["openspec", "list", "--json"], { capture: true, timeoutMs: 120_000 });
  const activeJson = active.status === 0 ? JSON.parse(active.stdout) as { changes?: unknown[] } : { changes: undefined };
  const archiveRoot = path.join(project, "openspec", "changes", "archive");
  const archives = fs.existsSync(archiveRoot) ? fs.readdirSync(archiveRoot).sort() : [];
  const alphaPath = path.join(project, "src", "alpha.txt");
  const betaPath = path.join(project, "src", "beta.txt");
  return {
    activeChanges: activeJson.changes?.length ?? -1,
    archiveExists: archives.length === sliceIds.length,
    archives,
    checkpoint: git(project, ["rev-parse", "HEAD"]),
    checkpointSubject: git(project, ["log", "-1", "--pretty=%s"]),
    checkpointSubjects: git(project, ["log", `-${String(sliceIds.length)}`, "--pretty=%s"]).split(/\r?\n/).filter(Boolean),
    marker: fs.existsSync(alphaPath) ? fs.readFileSync(alphaPath, "utf8") : null,
    markers: {
      alpha: fs.existsSync(alphaPath) ? fs.readFileSync(alphaPath, "utf8") : null,
      beta: fs.existsSync(betaPath) ? fs.readFileSync(betaPath, "utf8") : null,
    },
    remotes: git(project, ["remote"]),
    validation: {
      error: validation.error?.message ?? null,
      exitCode: validation.status,
      signal: validation.signal,
      stderr: validation.stderr.slice(-4_000),
      stdout: validation.stdout.slice(-4_000),
    },
    validationExit: validation.status,
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

async function waitForMissionState(
  statePath: string,
  predicate: (state: Record<string, unknown>) => boolean,
  timeoutMs: number,
): Promise<Record<string, unknown>> {
  const deadline = Date.now() + timeoutMs;
  let state: Record<string, unknown> | null = null;
  do {
    if (fs.existsSync(statePath)) {
      state = JSON.parse(fs.readFileSync(statePath, "utf8")) as Record<string, unknown>;
      if (predicate(state)) return state;
    }
    await Bun.sleep(500);
  } while (Date.now() < deadline);
  throw new Error(`Integrated durable mission state timed out: ${JSON.stringify(state)}`);
}

async function waitForPtyTerminal(baseUrl: string, timeoutMs: number): Promise<Record<string, unknown>> {
  const deadline = Date.now() + timeoutMs;
  let facts: Record<string, unknown> = {};
  do {
    facts = await ptyFacts(baseUrl);
    if (record(facts.mission)?.status === "exited") return facts;
    await Bun.sleep(500);
  } while (Date.now() < deadline);
  throw new Error(`Integrated mission PTY terminal wait timed out: ${JSON.stringify(facts)}`);
}

async function readMissionStatus(server: ServerProcess, project: string, sessionID: string): Promise<string> {
  await proofClient(server.url, project).session.command({
    arguments: "integrated-proof",
    command: "mission-status",
    directory: project,
    sessionID,
  });
  return await messageText(server, project, sessionID);
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

function evaluateIdleApi(raw: Record<string, unknown>, candidateId: string): Record<string, unknown> {
  const server = record(raw.server);
  const startup = record(server?.startup);
  const probes = Array.isArray(raw.idleApiProbe) ? raw.idleApiProbe : [];
  const checks = {
    candidateMatched: raw.candidateId === candidateId,
    cleanupComplete: raw.cleanup === "complete",
    idleApis: probes.length === 6 && probes.every((fact) => record(fact)?.ok === true),
    noModelCall: raw.modelRootCreated === false,
    serverIsolated: startup?.isolatedConfigLoaded === true && startup?.hostConfigLoaded === false,
    sessionCleanup: raw.deletedRootSessions === 1,
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

function hasTwoSliceTransitionOrder(value: unknown): boolean {
  const transitions = Array.isArray(value) ? value.map(record).filter((entry): entry is Record<string, unknown> => entry != null) : [];
  const expected = [
    ["archive", "slice-b"],
    ["checkpoint", "slice-b"],
    ["successor-activation", "slice-a"],
    ["archive", "slice-a"],
    ["checkpoint", "slice-a"],
    ["terminal-stop", "slice-a"],
  ];
  let cursor = -1;
  for (const [kind, sliceId] of expected) {
    cursor = transitions.findIndex((transition, index) => index > cursor && transition.kind === kind && transition.sliceId === sliceId);
    if (cursor < 0) return false;
  }
  return transitions.filter((transition) => transition.kind === "successor-activation").length === 1;
}

function hasCompleteProposalOutcome(value: unknown): boolean {
  return typeof value === "string"
    && ["proposal.md", "specs/synthetic-beta/spec.md", "design.md", "tasks.md", "history.md"].every((artifact) => value.includes(artifact));
}

function hasMissionSessionPositiveControl(raw: Record<string, unknown>): boolean {
  const rows = Array.isArray(raw.missionSessionFacts) ? raw.missionSessionFacts.map(record) : [];
  const observation = record(rows.find((row) => row?.sliceId === "slice-b")?.facts);
  const sessions = Array.isArray(observation?.sessions) ? observation.sessions.map(record) : [];
  return raw.missionSessionObservationCanary === true
    && observation?.completedResponses === 0
    && sessions.some((session) => {
      const mission = record(session?.mission);
      return record(session?.guard)?.state === "paused"
        && mission?.certificateStatus === "declined"
        && mission?.certificateReason === "preflight-canary"
        && mission?.terminalCertificate == null;
    });
}

function evaluatePreflight(raw: Record<string, unknown>, candidateId: string): Record<string, unknown> {
  const preflight = record(raw.preflight);
  const eligibleSlice = record(preflight?.eligibleSlice);
  const preflightChecks = Array.isArray(preflight?.checks) ? preflight.checks.map(record).filter((entry): entry is Record<string, unknown> => entry != null) : [];
  const openSpecCheck = preflightChecks.find((check) => check.id === "project:openspec-state");
  const twoSlice = raw.scenario === "two-slice";
  const checks = {
    candidateMatched: raw.candidateId === candidateId,
    cleanupComplete: raw.cleanup === "complete",
    commandsLoaded: ["disable-grind", "enable-grind", "mission-run", "mission-status", "mission-stop", "opsx-apply", "opsx-propose"].every((name) => (record(raw.server)?.commandNames as unknown[] | undefined)?.includes(name)),
    idleApis: Array.isArray(raw.idleApiProbe) && raw.idleApiProbe.length === 6 && raw.idleApiProbe.every((fact) => record(fact)?.ok === true),
    missionEligible: preflight?.status === "eligible",
    missionSessionObservation: !twoSlice || hasMissionSessionPositiveControl(raw),
    noModelCall: raw.modelRootCreated === false,
    ptyFinalization: typeof record(record(raw.ptyFacts)?.mission)?.buffer === "string",
    proposalOutcomeComplete: !twoSlice || hasCompleteProposalOutcome(raw.proposalOutcome),
    queuedActive: !twoSlice || (
      eligibleSlice?.changeId === "change-b"
      && eligibleSlice.operation === "propose"
      && openSpecCheck?.status === "passed"
      && String(openSpecCheck.summary ?? "").includes("exact queued active set is change-a")
    ),
    schemaResolved: !twoSlice || (
      record(record(raw.proofSchema)?.resolution)?.name === "proof-minimal"
      && record(record(raw.proofSchema)?.resolution)?.source === "project"
      && record(record(raw.proofSchema)?.validation)?.valid === true
      && record(raw.proofSchema)?.resolutionStatus === 0
      && record(raw.proofSchema)?.validationStatus === 0
    ),
    serverIsolated: record(record(raw.server)?.startup)?.isolatedConfigLoaded === true && record(record(raw.server)?.startup)?.hostConfigLoaded === false,
    slashBoundary: typeof raw.preflightStatus === "string" && raw.preflightStatus.includes('"durableDisposition": "paused"'),
  };
  return { candidateId, checks, liveCalls: 0, schemaVersion: 1, status: Object.values(checks).every(Boolean) ? "complete" : "blocked" };
}

function evaluateSelftest(raw: Record<string, unknown>, candidateId: string): Record<string, unknown> {
  const projectSnapshot = record(raw.projectFacts);
  const result = record(projectSnapshot?.result);
  const resultRows = Array.isArray(projectSnapshot?.results) ? projectSnapshot.results.map(record).filter((entry): entry is Record<string, unknown> => entry != null) : [];
  const resultFor = (sliceId: string): Record<string, unknown> | null => record(resultRows.find((entry) => entry.sliceId === sliceId)?.result);
  const state = record(projectSnapshot?.state);
  const mission = record(record(raw.ptyFacts)?.mission);
  const observer = record(raw.observerFacts);
  const markers = record(projectSnapshot?.markers);
  const taskEvidence = record(projectSnapshot?.taskEvidence);
  const validation = record(raw.validationAcrossArchive);
  const twoSlice = raw.scenario === "two-slice";
  const twoSliceResults = resultFor("slice-b")?.disposition === "completed"
    && resultFor("slice-a")?.disposition === "completed"
    && resultFor("slice-b")?.rootSessionRef === `session:${crypto.createHash("sha256").update("synthetic-beta-session").digest("hex").slice(0, 16)}`
    && resultFor("slice-a")?.rootSessionRef === `session:${crypto.createHash("sha256").update("synthetic-alpha-session").digest("hex").slice(0, 16)}`;
  const checks = {
    candidateMatched: raw.candidateId === candidateId,
    captureEvaluator: !twoSlice || record(raw.captureEvaluation)?.status === "complete",
    certificateIssuerConfigured: raw.certificateIssuerConfigured === true,
    cleanupComplete: raw.cleanup === "complete",
    controllerBufferPreserved: mission?.buffer === "synthetic controller terminal\n",
    gateExecutable: raw.gateStatus === 0,
    markerPreserved: markers?.alpha === "alpha\n" && (!twoSlice || markers?.beta === "beta\n"),
    minimalSchema: !twoSlice || (
      record(raw.minimalSchema)?.applyGate === 0
      && record(raw.minimalSchema)?.artifactCount === 4
      && record(raw.minimalSchema)?.applyRequires === "tasks"
      && record(raw.minimalSchema)?.proposeGate === 0
      && record(raw.minimalSchema)?.schemaName === "proof-minimal"
      && record(raw.minimalSchema)?.strictValidation === 0
    ),
    missionSessionObservation: !twoSlice || hasMissionSessionPositiveControl(raw),
    proposalOutcomeComplete: !twoSlice || hasCompleteProposalOutcome(raw.proposalOutcome),
    observerTerminal: observer?.durableDisposition === (twoSlice ? "complete" : "blocked") && observer?.ptyStatus === "exited",
    partialCapturePreserved: !twoSlice || (
      Array.isArray(record(raw.partialCapture)?.sliceIds)
      && json(record(raw.partialCapture)?.sliceIds) === json(["slice-b"])
      && record(record(raw.partialCapture)?.repository)?.marker === null
      && record(record(raw.partialCapture)?.repository)?.validationExit === 1
    ),
    resultPreserved: twoSlice
      ? twoSliceResults
      : result?.disposition === "terminal" && result?.rootSessionRef === `session:${crypto.createHash("sha256").update("synthetic-session").digest("hex").slice(0, 16)}`,
    statePreserved: state?.disposition === (twoSlice ? "complete" : "blocked")
      && state?.activeOperation === null
      && state?.cursor === (twoSlice ? 1 : 0),
    twoSliceTaskEvidence: !twoSlice || (
      String(taskEvidence?.["change-a"] ?? "").includes("- [x] 1.1")
      && String(taskEvidence?.["change-b"] ?? "").includes("- [x] 1.1")
    ),
    twoSliceTransitionOrder: !twoSlice || hasTwoSliceTransitionOrder(projectSnapshot?.transitions),
    validationAcrossArchive: validation?.active === 0
      && validation.archived === 0
      && validation.checkpoint === 0
      && (!twoSlice || (
        validation.betaActive === 0
        && validation.betaArchive === 0
        && validation.betaArchived === 0
        && validation.betaCheckpoint === 0
      )),
  };
  return { candidateId, checks, liveCalls: 0, schemaVersion: 1, status: Object.values(checks).every(Boolean) ? "complete" : "blocked" };
}

function evaluateTwoSlice(raw: Record<string, unknown>, candidateId: string): Record<string, unknown> {
  const durableState = record(raw.durableTerminalState);
  const project = record(raw.projectFacts);
  const repository = record(raw.repository);
  const server = record(raw.server);
  const terminal = String(raw.terminalStatus ?? "");
  const resultRows = Array.isArray(raw.executorResults) ? raw.executorResults.map(record).filter((entry): entry is Record<string, unknown> => entry != null) : [];
  const providerRows = Array.isArray(raw.providerExecutions) ? raw.providerExecutions.map(record).filter((entry): entry is Record<string, unknown> => entry != null) : [];
  const projectRows = Array.isArray(project?.results) ? project.results.map(record).filter((entry): entry is Record<string, unknown> => entry != null) : [];
  const resultFor = (sliceId: string): Record<string, unknown> | null => record(resultRows.find((entry) => entry.sliceId === sliceId)?.result);
  const projectFor = (sliceId: string): Record<string, unknown> | null => projectRows.find((entry) => entry.sliceId === sliceId) ?? null;
  const providerFor = (sliceId: string): Record<string, unknown> | null => record(providerRows.find((entry) => entry.sliceId === sliceId)?.facts);
  const commands = (result: Record<string, unknown> | null): string[] => Array.isArray(result?.phases)
    ? result.phases.map(record).flatMap((phase) => typeof phase?.command === "string" ? [phase.command] : [])
    : [];
  const verificationStatus = (sliceId: string): unknown => {
    const phases = Array.isArray(projectFor(sliceId)?.phases) ? projectFor(sliceId)?.phases as unknown[] : [];
    const verification = phases.map(record).find((phase) => phase?.name === "result.opsx-apply.verification.json");
    return record(record(record(verification)?.value)?.facts)?.validationStatus;
  };
  const proposalVerification = (() => {
    const phases = Array.isArray(projectFor("slice-b")?.phases) ? projectFor("slice-b")?.phases as unknown[] : [];
    return record(phases.map(record).find((phase) => phase?.name === "result.opsx-propose.verification.json")?.value);
  })();
  const runtimeInspection = (() => {
    const phases = Array.isArray(projectFor("slice-b")?.phases) ? projectFor("slice-b")?.phases as unknown[] : [];
    return record(phases.map(record).find((phase) => phase?.name === "result.runtime-inspection.json")?.value);
  })();
  const terminalClear = (result: Record<string, unknown> | null): boolean => result?.disposition === "completed"
    && result.guardState === "passed"
    && result.writerClosure === "terminal"
    && result.cleanup === "complete";
  const providerComplete = (facts: Record<string, unknown> | null): boolean => Number(facts?.completedResponses ?? 0) > 0
    && Number(facts?.tokenReports ?? 0) > 0
    && Array.isArray(facts?.routes)
    && facts.routes.includes("openai/gpt-5.6-sol");
  const beta = resultFor("slice-b");
  const alpha = resultFor("slice-a");
  const rootRefs = [beta?.rootSessionRef, alpha?.rootSessionRef].filter((value): value is string => typeof value === "string");
  const markers = record(project?.markers);
  const taskEvidence = record(project?.taskEvidence);
  const archives = Array.isArray(repository?.archives) ? repository.archives as unknown[] : [];
  const checkpointSubjects = Array.isArray(repository?.checkpointSubjects) ? repository.checkpointSubjects as unknown[] : [];
  const composedValidation = durableState?.disposition === "complete"
    && verificationStatus("slice-b") === 0
    && verificationStatus("slice-a") === 0
    && archives.length === 2
    && checkpointSubjects[0] === "roadmap-mission(integrated-proof): checkpoint slice-a"
    && checkpointSubjects[1] === "roadmap-mission(integrated-proof): checkpoint slice-b";
  const completedProviderResponses = providerRows.reduce((total, row) => total + Number(record(row.facts)?.completedResponses ?? 0), 0);
  const expectedQueued = Array.isArray(runtimeInspection?.expectedActiveChanges) ? runtimeInspection.expectedActiveChanges : [];
  const checks = {
    archiveReadback: repository?.activeChanges === 0
      && archives.length === 2
      && archives.some((name) => typeof name === "string" && name.endsWith("-change-a"))
      && archives.some((name) => typeof name === "string" && name.endsWith("-change-b")),
    candidateMatched: raw.candidateId === candidateId,
    cleanupComplete: raw.cleanup === "complete",
    controllerTerminal: terminal.includes('"durableDisposition": "complete"') && terminal.includes('"status": "exited"'),
    executorTerminalClear: terminalClear(beta) && terminalClear(alpha)
      && json(commands(beta)) === json(["opsx-propose", "opsx-apply"])
      && json(commands(alpha)) === json(["opsx-apply"]),
    freshRoots: rootRefs.length === 2 && new Set(rootRefs).size === 2,
    localCheckpoints: checkpointSubjects[0] === "roadmap-mission(integrated-proof): checkpoint slice-a"
      && checkpointSubjects[1] === "roadmap-mission(integrated-proof): checkpoint slice-b",
    markerValidated: markers?.alpha === "alpha\n" && markers?.beta === "beta\n"
      && (repository?.validationExit === 0 || composedValidation),
    noRemote: repository?.remotes === "",
    noThirdOutcome: resultRows.length === 2 && projectRows.length === 2 && archives.length === 2,
    orderedAutoChain: hasTwoSliceTransitionOrder(project?.transitions),
    providerExecution: providerRows.length === 2 && providerComplete(providerFor("slice-b")) && providerComplete(providerFor("slice-a")),
    proposalVerified: proposalVerification?.eligible === true
      && record(proposalVerification?.facts)?.artifactsComplete === true
      && record(proposalVerification?.facts)?.validationStatus === 0,
    queuedRuntimeClear: runtimeInspection?.status === "clear" && expectedQueued.length === 1 && expectedQueued[0] === "change-a",
    serverIsolated: record(server?.startup)?.isolatedConfigLoaded === true && record(server?.startup)?.hostConfigLoaded === false,
    sessionCleanup: Number(raw.deletedRootSessions) >= 3,
    taskArtifacts: String(taskEvidence?.["change-a"] ?? "").includes("- [x] 1.1")
      && String(taskEvidence?.["change-b"] ?? "").includes("- [x] 1.1"),
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

function evaluate(raw: Record<string, unknown>, candidateId: string): Record<string, unknown> {
  if (raw.scenario === "two-slice") return evaluateTwoSlice(raw, candidateId);
  const result = record(raw.executorResult);
  const durableState = record(raw.durableTerminalState);
  const providerExecution = record(raw.providerExecution);
  const projectFactsValue = record(raw.projectFacts);
  const repository = record(raw.repository);
  const server = record(raw.server);
  const terminal = String(raw.terminalStatus ?? "");
  const providerRoutes = Array.isArray(providerExecution?.routes) ? providerExecution.routes : [];
  const completedProviderResponses = Number(providerExecution?.completedResponses ?? 0);
  const phases = Array.isArray(projectFactsValue?.phases) ? projectFactsValue.phases : [];
  const applyVerification = phases.find((phase) => record(phase)?.name === "result.opsx-apply.verification.json");
  const applyValidation = record(record(record(applyVerification)?.value)?.facts)?.validationStatus;
  const composedValidation = durableState?.disposition === "complete"
    && repository?.activeChanges === 0
    && repository?.archiveExists === true
    && repository?.checkpointSubject === "roadmap-mission(integrated-proof): checkpoint slice-a"
    && applyValidation === 0;
  const checks = {
    archiveReadback: repository?.activeChanges === 0 && repository?.archiveExists === true,
    candidateMatched: raw.candidateId === candidateId,
    cleanupComplete: raw.cleanup === "complete",
    controllerTerminal: terminal.includes('"durableDisposition": "complete"') && terminal.includes('"status": "exited"'),
    executorTerminalClear: result?.disposition === "completed" && result?.guardState === "passed" && result?.writerClosure === "terminal" && result?.cleanup === "complete",
    localCheckpoint: repository?.checkpointSubject === "roadmap-mission(integrated-proof): checkpoint slice-a",
    markerValidated: repository?.marker === "alpha\n" && (repository?.validationExit === 0 || composedValidation),
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
  const sliceIds = opts.scenario === "two-slice" ? ["slice-b", "slice-a"] : ["slice-a"];
  const firstSliceId = sliceIds[0];
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
    scenario: opts.scenario,
    schemaVersion: 1,
  };
  try {
    writeProject(project, opts.scenario);
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
    raw.providerMechanism = {
      builtInProvider: true,
      defaultPlugins: opts.mode === "idle-api" ? "disabled-diagnostic" : "enabled",
      modelDiscovery: "cached-only",
      providerScope: "openai-only",
    };
    server = opts.mode === "startup" || opts.mode === "idle-api"
      ? await startOpenCodeHttp(configDir, runtimeRoot, project, opts.mode !== "idle-api")
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
    } else if (opts.mode === "idle-api") {
      const client = proofClient(server.url, project);
      const root = await requestData<Record<string, unknown>>(client.session.create({
        directory: project,
        title: "integrated guard idle API diagnostic",
      }) as Promise<unknown>, "integrated idle API root create");
      rootID = String(root.id);
      raw.idleApiProbe = await guardIdleApiFacts(client, project, rootID);
      raw.modelRootCreated = false;
    } else if (opts.mode === "preflight") {
      const env = isolatedProofServerEnvironment(process.env, configDir, runtimeRoot);
      env.OPENSPEC_TELEMETRY = "0";
      const definition = loadMissionDefinition(project, "opencode-dev-kit/missions/integrated-proof.json");
      raw.proposalOutcome = opts.scenario === "two-slice"
        ? definition.slices.find((slice) => slice.id === "slice-b")?.outcome ?? null
        : null;
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
      raw.idleApiProbe = await guardIdleApiFacts(client, project, rootID);
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
      try {
        ptyUrl = await ptyServerUrl(server, project, rootID);
      } catch (error) {
        raw.ptyUrlError = error instanceof Error ? error.message.slice(0, 500) : String(error).slice(0, 500);
      }
      const statePath = path.join(project, ".opencode-dev-kit", "runtime", "roadmap-missions", "integrated-proof", "state.json");
      raw.durableTerminalState = await waitForMissionState(
        statePath,
        (state) => state.activeOperation == null && state.disposition === "paused",
        60_000,
      );
      if (ptyUrl != null) raw.terminalPty = await waitForPtyTerminal(ptyUrl, 60_000);
      raw.preflightStatus = await readMissionStatus(server, project, rootID);
      raw.modelRootCreated = fs.existsSync(path.join(project, "evidence", "mission", firstSliceId, "attempt-1", "result.runtime-inspection.json"));
      const openSpec = runPortableCommand(project, ["openspec", "list", "--json"], { capture: true, env, timeoutMs: 120_000 });
      raw.openSpec = {
        exitCode: openSpec.status,
        stderr: openSpec.stderr.slice(-4_000),
        stdout: openSpec.stdout.slice(-8_000),
      };
      if (opts.scenario === "two-slice") {
        const schemaResolution = runPortableCommand(project, ["openspec", "schema", "which", "proof-minimal", "--json"], { capture: true, env, timeoutMs: 120_000 });
        const schemaValidation = runPortableCommand(project, ["openspec", "schema", "validate", "proof-minimal", "--json"], { capture: true, env, timeoutMs: 120_000 });
        raw.proofSchema = {
          resolution: schemaResolution.status === 0 ? JSON.parse(schemaResolution.stdout) : null,
          resolutionStatus: schemaResolution.status,
          validation: schemaValidation.status === 0 ? JSON.parse(schemaValidation.stdout) : null,
          validationStatus: schemaValidation.status,
        };
      }
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
      raw.preflight = { ...parsed, exitCode: preflight.status };
      if (preflight.status !== 0 || parsed.status !== "eligible") throw new Error(`Integrated mission preflight blocked: ${preflight.stderr || preflight.stdout}`);
      if (opts.scenario === "two-slice") {
        await requestData<Record<string, unknown>>(client.session.create({
          directory: project,
          metadata: {
            completionGuard: { grindEnabled: false, state: "paused" },
            roadmapMission: {
              certificateReason: "preflight-canary",
              certificateStatus: "declined",
              missionId: definition.missionId,
              sliceId: "slice-b",
              terminalCertificate: null,
            },
          },
          title: "integrated mission observation canary",
        }) as Promise<unknown>, "integrated mission observation canary");
        raw.missionSessionObservationCanary = true;
      }
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
      const statePath = path.join(project, ".opencode-dev-kit", "runtime", "roadmap-missions", "integrated-proof", "state.json");
      raw.durableTerminalState = await waitForMissionState(
        statePath,
        (state) => state.activeOperation == null
          && ["blocked", "complete", "owner-required", "paused", "terminal"].includes(String(state.disposition ?? "")),
        600_000,
      );
      if (ptyUrl != null) raw.terminalPty = await waitForPtyTerminal(ptyUrl, 60_000);
      raw.terminalStatus = await readMissionStatus(server, project, rootID);
      raw.durableFiles = {
        result: sliceIds.every((sliceId) => fs.existsSync(path.join(project, "evidence", "mission", sliceId, "attempt-1", "result.json"))),
        state: fs.existsSync(statePath),
      };
      if (opts.mode === "capture") {
        const executorResults = existingExecutorResults(project, sliceIds);
        raw.executorResults = executorResults;
        if (opts.scenario === "one-slice" && executorResults[0] != null) raw.executorResult = executorResults[0].result;
        raw.providerExecutions = [];
        for (const entry of executorResults) {
          const executorSessionRef = entry.result.rootSessionRef;
          if (typeof executorSessionRef !== "string") throw new Error(`Integrated executor result for ${entry.sliceId} has no root session reference`);
          (raw.providerExecutions as Array<Record<string, unknown>>).push({
            facts: await providerExecutionFacts(server, project, executorSessionRef),
            sliceId: entry.sliceId,
          });
        }
        if (opts.scenario === "one-slice") raw.providerExecution = record((raw.providerExecutions as unknown[])[0])?.facts;
        raw.repository = captureRepositoryFacts(project, sliceIds);
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
        const liveExecutorResults = existingExecutorResults(project, sliceIds);
        const snapshot = projectFacts(project, opts.scenario);
        raw.projectFacts = snapshot;
        if (opts.mode === "capture" && raw.repository == null) raw.repository = { remotes: git(project, ["remote"]) };
        if (raw.executorResults == null) raw.executorResults = liveExecutorResults;
        if (opts.scenario === "one-slice" && raw.executorResult == null && liveExecutorResults[0] != null) {
          raw.executorResult = liveExecutorResults[0].result;
        }
        if (raw.providerExecutions == null) {
          raw.providerExecutions = [];
          for (const entry of liveExecutorResults) {
            const sessionRef = entry.result.rootSessionRef;
            if (typeof sessionRef !== "string") continue;
            try {
              (raw.providerExecutions as Array<Record<string, unknown>>).push({
                facts: await providerExecutionFacts(server, project, sessionRef),
                sliceId: entry.sliceId,
              });
            } catch (error) {
              (raw.providerExecutions as Array<Record<string, unknown>>).push({
                facts: { observationError: error instanceof Error ? error.message.slice(0, 500) : String(error).slice(0, 500) },
                sliceId: entry.sliceId,
              });
            }
          }
        }
        if (opts.mode === "preflight" || !Array.isArray(raw.providerExecutions) || raw.providerExecutions.length === 0) {
          try {
            const observations = await missionSessionFacts(server, project, "integrated-proof");
            raw.missionSessionFacts = observations;
            if (!Array.isArray(raw.providerExecutions) || raw.providerExecutions.length === 0) raw.providerExecutions = observations;
          } catch (error) {
            raw.missionSessionObservationError = proofErrorFacts(error);
          }
        }
        if (opts.scenario === "one-slice" && raw.providerExecution == null) {
          raw.providerExecution = record((raw.providerExecutions as unknown[])[0])?.facts ?? null;
        }
        if (ptyUrl == null && rootID != null && opts.mode !== "idle-api") {
          try {
            ptyUrl = await ptyServerUrl(server, project, rootID);
          } catch (error) {
            raw.ptyUrlError = error instanceof Error ? error.message.slice(0, 500) : String(error).slice(0, 500);
          }
        }
        if (ptyUrl != null) raw.ptyFacts = await ptyFacts(ptyUrl);
        const diagnosticLines = `${server.stderr.join("")}\n${server.stdout.join("")}`.split(/\r?\n/);
        const criticalLines = diagnosticLines.filter((line) =>
          /\b(?:level=(?:ERROR|WARN)|error|failed|err_[A-Za-z0-9]+)\b/i.test(line)
          && !line.includes("Command handled by roadmap mission launcher")
          && !line.includes("Command handled by PTY plugin")
        );
        const boundaryLines = diagnosticLines.filter((line) =>
          (/\b(?:mission|pty)\b/i.test(line) || line.includes("[session-completion-guard:terminal-stage]"))
          && !line.includes("command=mission-status")
          && !line.includes("Command handled by roadmap mission launcher")
        );
        const diagnosticText = [...new Set([...criticalLines.slice(-100), ...boundaryLines.slice(-100)])].join("\n");
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
  if (opts.mode === "idle-api") {
    const evaluation = evaluateIdleApi(raw, opts.candidateId);
    writeNew(path.join(opts.evidenceRoot, "evaluation.json"), json(evaluation));
    console.log(json({ candidateId: opts.candidateId, evidenceRoot: "<evidence-root>", mode: "idle-api", status: evaluation.status }).trimEnd());
    if (failure != null || evaluation.status !== "complete") process.exitCode = 1;
    return;
  }
  if (opts.mode === "preflight") {
    const evaluation = evaluatePreflight(raw, opts.candidateId);
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
      : raw.mode === "preflight"
        ? evaluatePreflight(raw, opts.candidateId)
        : raw.mode === "selftest" || (raw.certificateIssuerConfigured != null && raw.observerFacts != null && raw.validationAcrossArchive != null && raw.server == null)
          ? evaluateSelftest(raw, opts.candidateId)
          : evaluate(raw, opts.candidateId);
  fs.mkdirSync(opts.evidenceRoot, { recursive: false });
  writeNew(path.join(opts.evidenceRoot, "evaluation.json"), json({
    ...evaluation,
    replay: {
      liveCalls: 0,
      sourceCandidateId: raw.candidateId,
    },
  }));
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
        return Response.json([{ id: "pty-proof", title: "Roadmap mission: integrated-proof", status: "exited", exitCode: opts.scenario === "two-slice" ? 0 : 1, notifyOnExit: false }]);
      }
      if (url.pathname === "/api/sessions/pty-proof/buffer/plain") {
        return Response.json({ byteLength: 27, plain: "synthetic controller terminal\n" });
      }
      return new Response("not found", { status: 404 });
    },
  });
  try {
    writeProject(project, opts.scenario);
    const definition = loadMissionDefinition(project, "opencode-dev-kit/missions/integrated-proof.json");
    const proposalOutcome = opts.scenario === "two-slice"
      ? definition.slices.find((slice) => slice.id === "slice-b")?.outcome ?? null
      : null;
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
    const activeChange = path.join(project, "openspec", "changes", "change-a");
    const activeTasks = path.join(activeChange, "tasks.md");
    const validationAcrossArchive: Record<string, number | null> = {};
    let minimalSchema: Record<string, unknown> | null = null;
    let partialCapture: Record<string, unknown> | null = null;
    if (opts.scenario === "two-slice") {
      const betaChange = path.join(project, "openspec", "changes", "change-b");
      writeNew(path.join(betaChange, ".openspec.yaml"), "schema: proof-minimal\ncreated: 2026-08-25\n");
      writeNew(path.join(betaChange, "proposal.md"), [
        "## Why", "", "The disposable integrated proof needs one exact beta marker.", "", "## What Changes", "", "- Create `src/beta.txt` with exact text `beta` and one trailing newline.", "",
        "### Outcome Capsule", "", "- **Outcome:** Create one deterministic local beta marker.", "- **Operating Envelope:** Disposable local project only.", "- **Non-Goals:** Network, credentials, remote state, deployment, release, or unrelated files.", "- **Non-Deferrable Invariants:** Only change-b changes and marker content is exact.", "- **Observable Proof:** `node tools/validate.mjs` exits zero after task completion.", "- **Material Residual Risks:** None in the synthetic fixture.", "- **Stop Line:** Stop after exact marker validation and task completion.", "- **Automation Dividend**: exempt - Existing validation covers the exact marker.", "",
        "### Claim And Evidence Scope", "", "The claim is limited to exact bytes `beta\\n` in `src/beta.txt`; proof is limited to project validation in this disposable project.", "", "## Capabilities", "", "### New Capabilities", "", "- `synthetic-beta`: One deterministic disposable beta marker.", "", "### Modified Capabilities", "", "None.", "", "## Impact", "", "- `src/beta.txt` only; no API, dependency, or external system changes.", "",
      ].join("\n"));
      writeNew(path.join(betaChange, "specs", "synthetic-beta", "spec.md"), "## Purpose\n\nThis capability provides a deterministic beta marker for disposable local validation without any external effect.\n\n## ADDED Requirements\n\n### Requirement: Beta marker is deterministic\nThe disposable project SHALL contain `src/beta.txt` with exact text `beta` and one trailing newline.\n\n#### Scenario: Beta marker validates\n- **WHEN** project validation runs after task completion\n- **THEN** it exits zero only for the exact marker content\n");
      writeNew(path.join(betaChange, "design.md"), "## Context\n\nThe disposable proof needs one exact local marker.\n\n## Goals / Non-Goals\n\nCreate only `src/beta.txt`; no external effects.\n\n## Decisions\n\nWrite exact UTF-8 text `beta\\n` directly.\n\n## Risks / Trade-offs\n\nContent drift -> run project validation before completion.\n");
      writeNew(path.join(betaChange, "tasks.md"), "## 1. Beta Marker\n\n- [x] 1.1 Create `src/beta.txt` with exact text `beta` and one trailing newline, then verify `node tools/validate.mjs` exits zero.\n");
      writeNew(path.join(betaChange, "history.md"), "# Strategy History\n\n## Generated Marker Helper\n\n- **Objective:** Produce the exact beta marker.\n- **Approach:** Add a generator instead of the static file.\n- **Evidence:** Existing validation covers the one fixed marker.\n- **Outcome:** Rejected.\n- **Reason:** Additional machinery adds no proof value.\n- **Do-Not-Repeat Condition:** Do not reconsider for one fixed marker.\n- **Evidence-Based Retry Condition:** Reconsider only if repeated generation becomes required.\n");
      writeNew(path.join(project, "src", "beta.txt"), "beta\n");
      const betaStatusCommand = runPortableCommand(project, ["openspec", "status", "--change", "change-b", "--json"], { capture: true, timeoutMs: 120_000 });
      const betaStatus = betaStatusCommand.status === 0 ? JSON.parse(betaStatusCommand.stdout) as Record<string, unknown> : {};
      const betaArtifacts = Array.isArray(betaStatus.artifacts) ? betaStatus.artifacts : [];
      const proposeGate = runPortableCommand(project, [process.execPath, path.join(configDir, "bin", "openspec-operation-gate.ts"), "--root", project, "--operation", "propose", "--change", "change-b"], { capture: true, timeoutMs: 120_000 });
      const strictValidation = runPortableCommand(project, ["openspec", "validate", "change-b", "--strict"], { capture: true, timeoutMs: 120_000 });
      const applyGate = runPortableCommand(project, [process.execPath, path.join(configDir, "bin", "openspec-operation-gate.ts"), "--root", project, "--operation", "apply", "--change", "change-b"], { capture: true, timeoutMs: 120_000 });
      minimalSchema = {
        applyGate: applyGate.status,
        applyRequires: Array.isArray(betaStatus.applyRequires) ? betaStatus.applyRequires.join(",") : null,
        artifactCount: betaArtifacts.length,
        proposeGate: proposeGate.status,
        schemaName: betaStatus.schemaName,
        status: betaStatusCommand.status,
        strictValidation: strictValidation.status,
      };
      validationAcrossArchive.betaActive = runPortableCommand(project, ["node", "tools/validate.mjs"], { capture: true, timeoutMs: 120_000 }).status;
      const betaArchive = runPortableCommand(project, [
        process.execPath,
        path.join(sourceRoot, "global", "bin", "openspec-archive.ts"),
        "--root",
        project,
        "--change",
        "change-b",
        "--",
        "node",
        "tools/validate.mjs",
      ], { capture: true, timeoutMs: 120_000 });
      validationAcrossArchive.betaArchive = betaArchive.status;
      validationAcrossArchive.betaArchived = runPortableCommand(project, ["node", "tools/validate.mjs"], { capture: true, timeoutMs: 120_000 }).status;
      git(project, ["add", "-A", "--", "."]);
      git(project, ["commit", "-m", "roadmap-mission(integrated-proof): checkpoint slice-b"]);
      validationAcrossArchive.betaCheckpoint = runPortableCommand(project, ["node", "tools/validate.mjs"], { capture: true, timeoutMs: 120_000 }).status;
    }
    fs.writeFileSync(activeTasks, fs.readFileSync(activeTasks, "utf8").replace("- [ ] 1.1", "- [x] 1.1"), "utf8");
    writeNew(path.join(project, "src", "alpha.txt"), "alpha\n");
    validationAcrossArchive.active = runPortableCommand(project, ["node", "tools/validate.mjs"], { capture: true, timeoutMs: 120_000 }).status;
    const archivedChange = path.join(project, "openspec", "changes", "archive", "2026-08-25-change-a");
    fs.mkdirSync(path.dirname(archivedChange), { recursive: true });
    fs.renameSync(activeChange, archivedChange);
    validationAcrossArchive.archived = runPortableCommand(project, ["node", "tools/validate.mjs"], { capture: true, timeoutMs: 120_000 }).status;
    git(project, ["add", "-A", "--", "."]);
    git(project, ["commit", "-m", "roadmap-mission(integrated-proof): checkpoint slice-a"]);
    validationAcrossArchive.checkpoint = runPortableCommand(project, ["node", "tools/validate.mjs"], { capture: true, timeoutMs: 120_000 }).status;
    const writeSyntheticResult = (sliceId: string, rootSessionRef: string, commands: string[]): void => {
      const attemptDir = path.join(project, "evidence", "mission", sliceId, "attempt-1");
      writeNew(path.join(attemptDir, "result.json"), json({
        cleanup: "complete",
        disposition: "completed",
        guardState: "passed",
        phases: commands.map((command) => ({ command, status: "completed" })),
        rootSessionRef,
        sliceId,
        writerClosure: "terminal",
      }));
      writeNew(path.join(attemptDir, "result.opsx-apply.verification.json"), json({ facts: { validationStatus: 0 } }));
      if (commands.includes("opsx-propose")) {
        writeNew(path.join(attemptDir, "result.opsx-propose.verification.json"), json({
          eligible: true,
          facts: { artifactCount: 4, artifactsComplete: true, validationStatus: 0 },
        }));
      }
      writeNew(path.join(attemptDir, "result.runtime-inspection.json"), json({
        expectedActiveChanges: ["change-a"],
        status: "clear",
      }));
    };
    if (opts.scenario === "two-slice") {
      writeSyntheticResult("slice-b", "synthetic-beta-session", ["opsx-propose", "opsx-apply"]);
      writeSyntheticResult("slice-a", "synthetic-alpha-session", ["opsx-apply"]);
      const transitionRoot = path.join(project, ".opencode-dev-kit", "runtime", "roadmap-missions", "integrated-proof", "transitions");
      const transitions = [
        { kind: "archive", sequence: 1, sliceId: "slice-b" },
        { kind: "checkpoint", sequence: 2, sliceId: "slice-b" },
        { kind: "successor-activation", sequence: 3, sliceId: "slice-a" },
        { kind: "archive", sequence: 4, sliceId: "slice-a" },
        { kind: "checkpoint", sequence: 5, sliceId: "slice-a" },
        { kind: "terminal-stop", sequence: 6, sliceId: "slice-a" },
      ];
      for (const transition of transitions) {
        writeNew(path.join(transitionRoot, `${String(transition.sequence).padStart(8, "0")}.json`), json(transition));
      }
      const alphaResult = path.join(project, "evidence", "mission", "slice-a", "attempt-1", "result.json");
      const heldAlphaResult = `${alphaResult}.held`;
      const alphaMarker = path.join(project, "src", "alpha.txt");
      const heldAlphaMarker = `${alphaMarker}.held`;
      fs.renameSync(alphaResult, heldAlphaResult);
      fs.renameSync(alphaMarker, heldAlphaMarker);
      try {
        const partialResults = existingExecutorResults(project, ["slice-b", "slice-a"]);
        partialCapture = {
          repository: captureRepositoryFacts(project, ["slice-b", "slice-a"]),
          sliceIds: partialResults.map((entry) => entry.sliceId),
        };
      } finally {
        fs.renameSync(heldAlphaResult, alphaResult);
        fs.renameSync(heldAlphaMarker, alphaMarker);
      }
    } else {
      const resultPath = path.join(project, "evidence", "mission", "slice-a", "attempt-1", "result.json");
      writeNew(resultPath, json({
        cleanup: "complete",
        disposition: "terminal",
        errorClass: "terminal",
        errorMessage: "synthetic finalizer probe",
        rootSessionRef: "synthetic-session",
        writerClosure: "terminal",
      }));
    }
    const statePath = path.join(project, ".opencode-dev-kit", "runtime", "roadmap-missions", "integrated-proof", "state.json");
    writeNew(statePath, json({
      activeOperation: null,
      cursor: opts.scenario === "two-slice" ? 1 : 0,
      disposition: opts.scenario === "two-slice" ? "complete" : "blocked",
    }));
    const durableState = await waitForMissionState(statePath, (state) => state.disposition === (opts.scenario === "two-slice" ? "complete" : "blocked"), 1_000);
    const terminalPty = await waitForPtyTerminal(server.url.href, 1_000);
    const snapshot = projectFacts(project, opts.scenario);
    const captureEvaluation = opts.scenario === "two-slice" ? evaluateTwoSlice({
      candidateId: opts.candidateId,
      cleanup: "complete",
      deletedRootSessions: 3,
      durableTerminalState: durableState,
      executorResults: snapshot.results,
      projectFacts: snapshot,
      providerExecutions: ["slice-b", "slice-a"].map((sliceId) => ({
        facts: { completedResponses: 1, routes: ["openai/gpt-5.6-sol"], tokenReports: 1 },
        sliceId,
      })),
      repository: {
        activeChanges: 0,
        archives: ["2026-08-25-change-a", "2026-08-25-change-b"],
        checkpointSubjects: [
          "roadmap-mission(integrated-proof): checkpoint slice-a",
          "roadmap-mission(integrated-proof): checkpoint slice-b",
        ],
        remotes: "",
        validationExit: 0,
      },
      runningStatus: '{"visibility": "opened", "notifyOnExit": false}',
      scenario: "two-slice",
      server: { startup: { hostConfigLoaded: false, isolatedConfigLoaded: true } },
      terminalStatus: '{"durableDisposition": "complete", "status": "exited"}',
    }, opts.candidateId) : null;
    raw = {
      candidateId: opts.candidateId,
      captureEvaluation,
      certificateIssuerConfigured: Array.isArray(guardOptions?.certificateIssuers)
        && guardOptions.certificateIssuers.includes(ROADMAP_MISSION_CERTIFICATE_ISSUER),
      cleanup: "pending",
      gateStatus: gate.status,
      mode: "selftest",
      minimalSchema,
      missionSessionFacts: opts.scenario === "two-slice" ? [{
        facts: {
          completedResponses: 0,
          sessions: [{
            guard: { state: "paused" },
            mission: {
              certificateReason: "preflight-canary",
              certificateStatus: "declined",
              missionId: "integrated-proof",
              sliceId: "slice-b",
              terminalCertificate: null,
            },
          }],
        },
        sliceId: "slice-b",
      }] : [],
      missionSessionObservationCanary: opts.scenario === "two-slice",
      validationAcrossArchive,
      observerFacts: {
        durableDisposition: durableState.disposition,
        ptyStatus: record(terminalPty.mission)?.status,
      },
      partialCapture,
      proposalOutcome,
      projectFacts: snapshot,
      ptyFacts: await ptyFacts(server.url.href),
      scenario: opts.scenario,
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
  const replayableRaw = { ...(raw ?? {}), cleanup };
  const evaluation = evaluateSelftest(replayableRaw, opts.candidateId);
  writeNew(path.join(opts.evidenceRoot, "raw.json"), json(replayableRaw));
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
