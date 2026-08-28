#!/usr/bin/env node

import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { runPortableCommand } from "../../global/bin/portable-process.ts";
import { stableJson } from "../../global/bin/roadmap-mission/contracts.ts";
import { campaignDigest, loadWorkCampaignDefinition } from "../../global/bin/work-campaign/contracts.ts";
import { loadModelProfile } from "../model-profile.ts";
import {
  assertProofRouteAvailable,
  configuredProofServerEnvironment,
  installedOpenCodeIdentity,
  proofClient,
  proofRuntimeSurface,
  proofServerLogs,
  proofServerStartupFacts,
  seedProofModelsCatalog,
  startProofServer,
  stopProofServer,
  waitForProofRoute,
  writeIsolatedProofConfig,
  type ProofServerHandle,
  type ProofRuntimeSurface,
} from "./lib/opencode-proof-client.ts";
import { removeProofFixture } from "./lib/proof-process-cleanup.ts";

type JsonRecord = Record<string, unknown>;
type Mode = "capture" | "preflight" | "replay";
type Options = {
  candidateId: string;
  environmentId: string;
  evidenceRoot: string;
  inputRoot: string | null;
  mode: Mode;
  opencode: string | null;
  profile: string;
};

const sourceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");

function usage(): string {
  return `Usage:
  node tools/proofs/work-campaign-semantic.ts --mode preflight --candidate-id <id> --environment-id <id> --evidence-root <absolute-new-path>
  node tools/proofs/work-campaign-semantic.ts --mode capture --candidate-id <id> --environment-id <id> --evidence-root <absolute-new-path> --opencode <absolute-file> [--profile quality-independent]
  node tools/proofs/work-campaign-semantic.ts --mode replay --candidate-id <id> --environment-id <id> --input-root <capture> --evidence-root <absolute-new-path>

Capture starts one explicit disposable loopback OpenCode proof server, invokes the
production semantic executor once, verifies read-only ownership, terminates the server,
and deletes the fixture. Preflight and replay perform zero configured model calls.`;
}

function required(args: string[], index: number, option: string): string {
  const result = args[index + 1];
  if (result == null || result.trim() === "" || result.startsWith("--")) throw new Error(`Missing value for ${option}`);
  return result;
}

function parseArgs(args: string[]): Options {
  let candidateId = "";
  let environmentId = "";
  let evidenceRoot = "";
  let inputRoot: string | null = null;
  let mode: Mode | null = null;
  let opencode: string | null = null;
  let profile = "quality-independent";
  for (let index = 0; index < args.length; index++) {
    const arg = args[index];
    if (arg === "--candidate-id") candidateId = required(args, index++, arg);
    else if (arg === "--environment-id") environmentId = required(args, index++, arg);
    else if (arg === "--evidence-root") evidenceRoot = required(args, index++, arg);
    else if (arg === "--input-root") inputRoot = path.resolve(required(args, index++, arg));
    else if (arg === "--opencode") opencode = path.resolve(required(args, index++, arg));
    else if (arg === "--profile") profile = required(args, index++, arg);
    else if (arg === "--mode") {
      const value = required(args, index++, arg);
      if (value !== "capture" && value !== "preflight" && value !== "replay") throw new Error("--mode must be capture, preflight, or replay");
      mode = value;
    } else throw new Error(`Unknown option: ${arg}`);
  }
  if (mode == null) throw new Error("--mode is required");
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]{0,99}$/u.test(candidateId)) throw new Error("--candidate-id must be a safe identifier");
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]{0,199}$/u.test(environmentId)) throw new Error("--environment-id must be a safe identifier");
  if (!path.isAbsolute(evidenceRoot)) throw new Error("--evidence-root must be absolute");
  if (mode === "capture" && (opencode == null || !fs.statSync(opencode).isFile())) throw new Error("capture requires --opencode as an absolute existing file");
  if (mode === "replay" && inputRoot == null) throw new Error("replay requires --input-root");
  return { candidateId, environmentId, evidenceRoot: path.resolve(evidenceRoot), inputRoot, mode, opencode, profile };
}

function writeNew(file: string, value: unknown): void {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, stableJson(value), { encoding: "utf8", flag: "wx" });
}

function sha256(value: string | Buffer): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function safeError(error: unknown): string {
  return (error instanceof Error ? error.message : String(error)).replace(/[\r\n\0]+/gu, " ").slice(0, 1_000);
}

function sourceDigest(root: string): string {
  return sha256(fs.readFileSync(path.join(root, "src", "main.ts")));
}

function worktreeStatus(root: string): string[] {
  const result = runPortableCommand(root, ["git", "status", "--porcelain=v1", "--untracked-files=all"], { capture: true, timeoutMs: 30_000 });
  if (result.status !== 0) throw new Error(`git status failed (${String(result.status)}): ${result.stderr.slice(0, 1_000)}`);
  return result.stdout.split(/\r?\n/u).filter(Boolean).sort();
}

function createFixture(root: string): { assignmentDigest: string; definitionDigest: string } {
  fs.mkdirSync(path.join(root, "src"), { recursive: true });
  fs.mkdirSync(path.join(root, ".work", "evidence"), { recursive: true });
  fs.writeFileSync(path.join(root, "src", "main.ts"), "export const stableValue = 1;\n", "utf8");
  fs.writeFileSync(path.join(root, ".gitignore"), ".runtime/\n.work/\n", "utf8");
  writeNew(path.join(root, "adapter.json"), {
    adapterId: "semantic-proof-adapter",
    inventoryArgv: ["node", "inventory.mjs"],
    realBoundaryProofArgv: ["node", "proof.mjs"],
    schemaVersion: 1,
  });
  writeNew(path.join(root, "definition.json"), {
    adapterPath: "adapter.json",
    allowedEffects: ["local-read", "provider-inference"],
    authorizationRefs: { "provider-inference": "authorization:configured-synthetic-proof" },
    budgets: { evidenceBytes: 1_048_576, modelCalls: 1, processAttempts: 2, wallClockSeconds: 300, waves: 1 },
    campaignId: "semantic-proof-campaign",
    checkpoint: { localCommitAuthorized: false, mode: "evidence-only", workspace: "disposable" },
    evidencePath: ".work/evidence",
    exclusions: [],
    hostResume: { enabled: false, supervisorRequired: false },
    outcome: "Inspect one synthetic source block without modifying the project.",
    playbook: "audit-remediate",
    protectedDecisionPolicy: "owner-required",
    reportPath: ".work/report.md",
    schemaVersion: 1,
    scopeRoots: ["src"],
    statePath: ".runtime/campaign",
    stopPolicy: {
      onBudgetExhausted: true,
      onExplicitStop: true,
      onOwnerRequired: true,
      onProtected: true,
      onUnknown: true,
    },
    validationArgv: ["node", "--check", "src/main.ts"],
  });
  const { definitionDigest } = loadWorkCampaignDefinition(root, "definition.json");
  const candidateDigest = sourceDigest(root);
  const blocks = [{
    classification: "maintained",
    digest: candidateDigest,
    exclusionReason: null,
    id: "block-a",
    kind: "file",
    path: "src/main.ts",
    recordType: "inventory-block",
    reviewStatus: "pending",
    schemaVersion: 1,
  }];
  const assignment = {
    assignmentId: "partition-a",
    assignmentType: "discovery",
    budgets: { modelCalls: 1, outputBytes: 16_384, wallClockSeconds: 240 },
    campaignId: "semantic-proof-campaign",
    candidateDigest,
    definitionDigest,
    evidenceRefs: ["file:src/main.ts"],
    phase: "discover",
    request: [
      "Use the read tool to inspect src/main.ts. It is an intentionally complete synthetic no-finding block.",
      "Return payload.partition with assignmentId partition-a, blockIds [block-a], candidateDigest equal to the supplied assignment candidateDigest, evidenceRefs [file:src/main.ts], id partition-result-a, inventoryDigest " + campaignDigest(blocks) + ", producerSessionRef equal to the executor-supplied required producerSessionRef, recordType partition-result, schemaVersion 1, status complete, and empty workItemIds.",
      "Return payload.workItems as an empty array. Do not return prose or infer any additional finding.",
    ].join(" "),
    schemaVersion: 1,
    sourceBlockIds: ["block-a"],
  };
  writeNew(path.join(root, ".work", "evidence", "assignment.json"), assignment);
  for (const argv of [
    ["git", "init", "-b", "main"],
    ["git", "add", "--all"],
    ["git", "-c", "user.name=Campaign Proof", "-c", "user.email=campaign-proof@example.invalid", "-c", "commit.gpgsign=false", "commit", "-m", "semantic fixture"],
  ]) {
    const result = runPortableCommand(root, argv, { capture: true, timeoutMs: 30_000 });
    if (result.status !== 0) throw new Error(`${argv[0]} failed (${String(result.status)}): ${result.stderr.slice(0, 1_000)}`);
  }
  return { assignmentDigest: sha256(stableJson(assignment)), definitionDigest };
}

function redactResult(value: unknown): unknown {
  if (typeof value === "string" && value.startsWith("session:")) return `session:${sha256(value)}`;
  if (Array.isArray(value)) return value.map(redactResult);
  if (value != null && typeof value === "object") {
    return Object.fromEntries(Object.entries(value as JsonRecord).map(([key, item]) => [key, redactResult(item)]));
  }
  return value;
}

function evaluate(raw: JsonRecord, candidateId: string, environmentId: string): JsonRecord {
  const result = raw.result as JsonRecord | undefined;
  const verification = result?.verification as JsonRecord | undefined;
  const model = result?.model as JsonRecord | undefined;
  const surface = raw.runtimeSurface as JsonRecord | undefined;
  const checks = {
    assignmentBound: typeof raw.assignmentDigest === "string" && raw.assignmentDigest === result?.assignmentDigest,
    candidateMatched: raw.candidateId === candidateId,
    cleanupComplete: result?.cleanup === "complete" && raw.fixtureRemoved === true && raw.serverTerminal === true,
    environmentMatched: raw.environmentId === environmentId,
    exactlyOneModelCall: result?.modelCalls === 1,
    noChildren: verification?.children === 0 && verification?.parentless === true,
    noPermissionOrQuestion: verification?.permissionRequests === 0 && verification?.questions === 0,
    noSourceWrite: verification?.fileDiffs === 0 && raw.sourceBefore === raw.sourceAfter
      && Array.isArray(raw.worktreeBefore) && raw.worktreeBefore.length === 0
      && Array.isArray(raw.worktreeAfter) && raw.worktreeAfter.length === 0,
    outputBound: typeof result?.outputBytes === "number" && result.outputBytes > 0 && result.outputBytes <= 16_384,
    processExited: (raw.command as JsonRecord | undefined)?.exitCode === 0,
    resultComplete: result?.status === "complete" && result?.errorClass === "none",
    routeMatched: typeof raw.expectedModel === "string" && `${model?.providerID}/${model?.modelID}` === raw.expectedModel,
    serverExplicit: raw.hiddenServer === false && raw.loopback === true,
    surfaceExtensionFree: typeof surface?.configDigest === "string"
      && Array.isArray(surface.mcpIds) && surface.mcpIds.length === 0
      && Array.isArray(surface.pluginIds) && surface.pluginIds.length === 0,
    structuredOutputObserved: Array.isArray(result?.toolCalls) && result.toolCalls.some((call) => (call as JsonRecord).name === "StructuredOutput" && (call as JsonRecord).status === "completed"),
  };
  return {
    candidateId,
    checks,
    environmentId,
    liveCalls: raw.captureMode === "configured" && typeof result?.modelCalls === "number" ? result.modelCalls : 0,
    proofKind: "campaign-semantic-root",
    schemaVersion: 1,
    status: Object.values(checks).every(Boolean) ? "complete" : "blocked",
  };
}

async function preflight(options: Options): Promise<void> {
  const fixture = fs.mkdtempSync(path.join(os.tmpdir(), "work-campaign-semantic-preflight-"));
  try {
    const identity = createFixture(fixture);
    const raw = {
      assignmentDigest: identity.assignmentDigest,
      candidateId: options.candidateId,
      environmentId: options.environmentId,
      fixtureCreated: true,
      liveCalls: 0,
      mode: "preflight",
      schemaVersion: 1,
    };
    writeNew(path.join(options.evidenceRoot, "raw.json"), raw);
    writeNew(path.join(options.evidenceRoot, "evaluation.json"), { candidateId: options.candidateId, environmentId: options.environmentId, liveCalls: 0, schemaVersion: 1, status: "complete" });
  } finally {
    removeProofFixture(fixture);
  }
  console.log(JSON.stringify({ candidateId: options.candidateId, liveCalls: 0, mode: "preflight", status: "complete" }));
}

async function capture(options: Options): Promise<void> {
  const proofRoot = fs.mkdtempSync(path.join(os.tmpdir(), "work-campaign-semantic-capture-"));
  const fixture = path.join(proofRoot, "fixture");
  const runtimeRoot = path.join(proofRoot, "runtime");
  const profile = loadModelProfile(sourceRoot, options.profile).profile;
  const configured = profile.agent?.general as { model?: string; variant?: string } | undefined;
  if (typeof configured?.model !== "string") throw new Error("Configured general model route is unavailable");
  for (const relative of ["cache", "config-home", "data/opencode", "state"]) fs.mkdirSync(path.join(runtimeRoot, relative), { recursive: true });
  seedProofModelsCatalog(runtimeRoot, [configured.model]);
  const configDir = path.join(runtimeRoot, "config-source");
  writeIsolatedProofConfig(configDir, profile);
  const environment = configuredProofServerEnvironment(process.env, configDir, runtimeRoot, profile);
  let server: ProofServerHandle | null = null;
  let serverTerminal = false;
  let captureError: unknown = null;
  let command: JsonRecord = { exitCode: null };
  let result: JsonRecord | null = null;
  let startup: JsonRecord = {};
  let runtimeSurface: ProofRuntimeSurface | null = null;
  let identity: { assignmentDigest: string; definitionDigest: string } | null = null;
  let sourceBefore: string | null = null;
  let sourceAfter: string | null = null;
  let worktreeBefore: string[] | null = null;
  let worktreeAfter: string[] | null = null;
  try {
    fs.mkdirSync(fixture, { recursive: true });
    identity = createFixture(fixture);
    sourceBefore = sourceDigest(fixture);
    worktreeBefore = worktreeStatus(fixture);
    server = await startProofServer(options.opencode!, fixture, environment);
    const client = proofClient(server.url, fixture);
    const route = await waitForProofRoute(client, fixture, "general", 15_000);
    await assertProofRouteAvailable(client, fixture, route);
    if (`${route.model.providerID}/${route.model.modelID}` !== configured.model) {
      throw new Error("Configured semantic route differs from the selected profile");
    }
    runtimeSurface = await proofRuntimeSurface(client, fixture);
    if (runtimeSurface.mcpIds.length !== 0 || runtimeSurface.pluginIds.length !== 0) throw new Error("configured semantic proof surface is not extension-free");
    const execution = runPortableCommand(fixture, [
        process.execPath,
        path.join(sourceRoot, "global", "bin", "work-campaign-semantic-executor.ts"),
        "execute",
        "--root", fixture,
        "--definition", "definition.json",
        "--assignment", ".work/evidence/assignment.json",
        "--result", ".work/evidence/result.json",
        "--server-url", server.url,
        "--agent", "general",
      ], {
      capture: true,
      env: process.env,
      timeoutMs: 300_000,
    });
    command = { exitCode: execution.status, stderr: execution.stderr.slice(0, 2_000), stdout: execution.stdout.slice(0, 2_000), timedOut: execution.timedOut === true };
    result = JSON.parse(fs.readFileSync(path.join(fixture, ".work", "evidence", "result.json"), "utf8")) as JsonRecord;
    sourceAfter = sourceDigest(fixture);
    worktreeAfter = worktreeStatus(fixture);
  } catch (error) {
    captureError = error;
    if (fs.existsSync(path.join(fixture, "src", "main.ts"))) {
      sourceAfter = sourceDigest(fixture);
      worktreeAfter = worktreeStatus(fixture);
    }
  } finally {
    if (server != null) {
      const logs = proofServerLogs(server);
      startup = proofServerStartupFacts(logs.stdout, logs.stderr, configDir, [runtimeRoot]);
      try {
        await stopProofServer(server);
        serverTerminal = true;
      } catch (error) {
        captureError ??= error;
      }
    }
    try {
      removeProofFixture(proofRoot);
    } catch (error) {
      captureError ??= error;
    }
  }
  const raw: JsonRecord = {
    assignmentDigest: identity?.assignmentDigest ?? null,
    candidateId: options.candidateId,
    captureError: captureError == null ? null : safeError(captureError),
    captureMode: "configured",
    command,
    environmentId: options.environmentId,
    expectedModel: configured.model,
    fixtureRemoved: !fs.existsSync(proofRoot),
    hiddenServer: false,
    installedOpenCode: installedOpenCodeIdentity(options.opencode!),
    loopback: true,
    profile: options.profile,
    result: result == null ? null : redactResult(result),
    runtimeSurface,
    schemaVersion: 1,
    serverStartup: startup,
    serverTerminal,
    sourceAfter,
    sourceBefore,
    worktreeAfter,
    worktreeBefore,
  };
  const evaluation = evaluate(raw, options.candidateId, options.environmentId);
  writeNew(path.join(options.evidenceRoot, "raw.json"), raw);
  writeNew(path.join(options.evidenceRoot, "evaluation.json"), evaluation);
  console.log(JSON.stringify({ candidateId: options.candidateId, liveCalls: 1, mode: "capture", status: evaluation.status }));
  if (evaluation.status !== "complete") process.exitCode = 1;
}

function replay(options: Options): void {
  const raw = JSON.parse(fs.readFileSync(path.join(options.inputRoot!, "raw.json"), "utf8")) as JsonRecord;
  const evaluation = evaluate({ ...raw, captureMode: "replay" }, options.candidateId, options.environmentId);
  evaluation.liveCalls = 0;
  writeNew(path.join(options.evidenceRoot, "evaluation.json"), evaluation);
  console.log(JSON.stringify({ candidateId: options.candidateId, liveCalls: 0, mode: "replay", status: evaluation.status }));
  if (evaluation.status !== "complete") process.exitCode = 1;
}

async function main(): Promise<void> {
  if (process.argv.includes("--help") || process.argv.includes("-h")) {
    console.log(usage());
    return;
  }
  const options = parseArgs(process.argv.slice(2));
  if (fs.existsSync(options.evidenceRoot)) throw new Error("--evidence-root must be create-new");
  if (options.mode === "preflight") await preflight(options);
  else if (options.mode === "capture") await capture(options);
  else replay(options);
}

main().catch((error) => {
  console.error(safeError(error));
  process.exitCode = 1;
});
