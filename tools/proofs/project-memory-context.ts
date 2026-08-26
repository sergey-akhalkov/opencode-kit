#!/usr/bin/env node
import { spawn, spawnSync, type ChildProcessWithoutNullStreams } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import http from "node:http";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createProjectMemoryFeature, createProjectMemoryPluginHooks } from "../../global/plugin/project-memory/index.ts";
import { candidateMarkdown, invalidationMarkdown, promotionMarkdown } from "../../global/plugin/project-memory/records.ts";
import {
  readProjectMemoryPopulation,
  resolveProjectMemoryStore,
  type ProjectMemoryCandidate,
  type ProjectMemoryInvalidation,
  type ProjectMemoryPromotion,
} from "../../global/plugin/project-memory/store.ts";
import { sanitizeText } from "../../global/plugin/session-delivery-context/redaction.ts";
import { proofClient, requestData } from "./lib/opencode-proof-client.ts";

type LoadedOptions = {
  evidenceDir: string;
  expectedVersion: string;
  mode: "loaded" | "preflight";
  opencode: string;
  pluginRuntime: string;
  ripgrep: string;
};

type CorpusOptions = {
  evidenceDir: string;
  fixture: string;
  mode: "corpus";
};

type BoundaryOptions = {
  evidenceDir: string;
  mode: "boundary";
};

type Options = BoundaryOptions | CorpusOptions | LoadedOptions;

type CommandResult = {
  status: number | null;
  signal: NodeJS.Signals | null;
  stderr: string;
  stdout: string;
  timedOut: boolean;
};

type ProviderCapture = {
  close(): Promise<void>;
  egressTrapCount(): number;
  requests(): unknown[];
  url: string;
};

type ServerHandle = {
  child: ChildProcessWithoutNullStreams;
  completion: Promise<{ signal: NodeJS.Signals | null; status: number | null }>;
  stderr: Buffer[];
  stdout: Buffer[];
  url: string;
};

const sourceRoot = path.resolve(fileURLToPath(new URL("../..", import.meta.url)));
const HELP = `Usage:
  node tools/proofs/project-memory-context.ts --mode corpus --fixture <path> --evidence-dir <path>
  node tools/proofs/project-memory-context.ts --mode boundary --evidence-dir <path>
  node tools/proofs/project-memory-context.ts --mode <preflight|loaded> --opencode <path> --expected-version <version> --plugin-runtime <path> --ripgrep <path> --evidence-dir <path>

Corpus mode materializes the reviewed PMC-001 seed through the production store,
recall, renderer, tools, and hooks, then runs the focused provider-free process
oracles. Loaded modes use a disposable Git project, copied session-env plugin,
isolated OpenCode roots, and a loopback fake provider. Every mode writes redacted
raw.json and evaluation.json under a create-new --evidence-dir.

Inputs: --fixture is the reviewed repository-local corpus seed. --evidence-dir is
a repository-local path that must not exist. Project and data inputs are always
new runner-created temporary roots; existing project/data roots are not accepted.

Effects: creates only local temporary files and proof-owned processes; loaded mode
also creates one local OpenCode database and loopback listener. No mode performs a
remote call. Cleanup stops proof-owned processes/listeners and removes fixtures.
Evidence: redacted raw.json plus evaluation.json with source/environment identity,
observations, checks, and cleanup status. --help performs no writes, process
launches, or network access.
`;

function usageError(message: string): never {
  throw new Error(`${message}\n\n${HELP}`);
}

function parseArgs(argv: string[]): Options | null {
  if (argv.includes("--help") || argv.includes("-h")) return null;
  const values = new Map<string, string>();
  for (let index = 0; index < argv.length; index += 2) {
    const key = argv[index];
    const value = argv[index + 1];
    if (key == null || value == null || !key.startsWith("--")) usageError("Arguments must be --name value pairs.");
    values.set(key, value);
  }
  const opencode = values.get("--opencode");
  const expectedVersion = values.get("--expected-version");
  const evidence = values.get("--evidence-dir");
  const mode = values.get("--mode");
  const pluginRuntime = values.get("--plugin-runtime");
  const ripgrep = values.get("--ripgrep");
  const fixture = values.get("--fixture");
  if (evidence == null || mode == null) usageError("--mode and --evidence-dir are required.");
  const evidenceDir = path.resolve(sourceRoot, evidence);
  if (path.relative(sourceRoot, evidenceDir).startsWith("..")) usageError("--evidence-dir must stay inside the repository.");
  if (mode === "corpus") {
    if (fixture == null) usageError("Corpus mode requires --fixture.");
    const fixturePath = path.resolve(sourceRoot, fixture);
    if (path.relative(sourceRoot, fixturePath).startsWith("..")) usageError("--fixture must stay inside the repository.");
    return { evidenceDir, fixture: fixturePath, mode };
  }
  if (mode === "boundary") return { evidenceDir, mode };
  if (mode !== "preflight" && mode !== "loaded") usageError("--mode must be boundary, corpus, preflight, or loaded.");
  if (opencode == null || expectedVersion == null || pluginRuntime == null || ripgrep == null) usageError("Loaded modes require --opencode, --expected-version, --plugin-runtime, and --ripgrep.");
  return {
    evidenceDir,
    expectedVersion,
    mode,
    opencode: path.resolve(opencode),
    pluginRuntime: path.resolve(pluginRuntime),
    ripgrep: path.resolve(ripgrep),
  };
}

function sha256(value: string | Buffer): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function stableJson(value: unknown): string {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function writeNew(file: string, value: unknown): void {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, stableJson(value), { encoding: "utf8", flag: "wx" });
}

function redact(value: string, fixtureRoot: string): string {
  const replaced = value
    .replaceAll(fixtureRoot, "<fixture-root>")
    .replaceAll(fixtureRoot.replaceAll("\\", "\\\\"), "<fixture-root>")
    .replaceAll(fixtureRoot.replaceAll("\\", "/"), "<fixture-root>")
    .replaceAll(sourceRoot, "<source-root>")
    .replaceAll(sourceRoot.replaceAll("\\", "\\\\"), "<source-root>")
    .replaceAll(sourceRoot.replaceAll("\\", "/"), "<source-root>");
  return sanitizeText(replaced, "project-memory-proof-session");
}

function redactValue(value: unknown, fixtureRoot: string): unknown {
  if (typeof value === "string") return redact(value, fixtureRoot);
  if (Array.isArray(value)) return value.map((item) => redactValue(item, fixtureRoot));
  if (value != null && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, redactValue(item, fixtureRoot)]));
  }
  return value;
}

function sourceIdentity(): Array<{ path: string; sha256: string }> {
  return [
    "global/plugin/session-env.ts",
    "global/plugin/project-memory/index.ts",
    "global/plugin/project-memory/recall.ts",
    "global/plugin/project-memory/records.ts",
    "global/plugin/project-memory/store.ts",
    "tools/proofs/project-memory-context.ts",
  ].map((relative) => ({
    path: relative,
    sha256: sha256(fs.readFileSync(path.join(sourceRoot, relative))),
  }));
}

function gitStatus(projectRoot: string): string {
  const result = spawnSync("git", ["status", "--porcelain"], { cwd: projectRoot, encoding: "utf8", windowsHide: true });
  if (result.status !== 0) throw new Error("Disposable-project git status failed.", { cause: result.error ?? result.stderr });
  return result.stdout;
}

function initializeProject(projectRoot: string): void {
  fs.mkdirSync(path.join(projectRoot, "src"), { recursive: true });
  fs.writeFileSync(path.join(projectRoot, "src", "config.ts"), "export const restartDeadline = 120_000;\n", "utf8");
  const result = spawnSync("git", ["init", "--quiet"], { cwd: projectRoot, encoding: "utf8", windowsHide: true });
  if (result.status !== 0) throw new Error("Disposable-project git init failed.", { cause: result.error ?? result.stderr });
}

type CorpusSeed = {
  schemaVersion: number;
  claimId: string;
  fixedNow: string;
  supportedCredential: string;
  defaults: Record<string, unknown>;
  cards: Array<Record<string, unknown>>;
  series: Array<Record<string, unknown>>;
  curated: Array<{ path: string; content: string }>;
  queries: Array<Record<string, unknown>>;
  processOracles: Array<{ command: string; expectedPasses: string[] }>;
  members: string[];
  memberChecks: Record<string, string[]>;
};

function readCorpusSeed(file: string): { canonical: string; seed: CorpusSeed } {
  const raw = fs.readFileSync(file, "utf8");
  const seed = JSON.parse(raw) as CorpusSeed;
  if (seed.schemaVersion !== 1 || seed.claimId !== "PMC-001") throw new Error("Unsupported project-memory corpus seed identity.");
  if (!Array.isArray(seed.cards) || !Array.isArray(seed.series) || !Array.isArray(seed.queries) || !Array.isArray(seed.processOracles)) {
    throw new Error("Project-memory corpus seed arrays are missing.");
  }
  if (seed.members.length !== 22 || new Set(seed.members).size !== seed.members.length) throw new Error("Project-memory corpus members must contain 22 unique reviewed ids.");
  if (Object.keys(seed.memberChecks).sort().join("\n") !== [...seed.members].sort().join("\n")) throw new Error("Project-memory corpus member checks do not cover the reviewed population exactly.");
  const canonical = stableJson(seed);
  if (stableJson(JSON.parse(canonical)) !== canonical) throw new Error("Project-memory corpus seed cannot be read back in stable JSON form.");
  return { canonical, seed };
}

function expandSeedCards(seed: CorpusSeed): Array<Record<string, unknown>> {
  const cards = seed.cards.map((card) => ({ ...seed.defaults, ...card }));
  for (const series of seed.series) {
    const count = Number(series.count);
    const idPrefix = String(series.idPrefix);
    const titlePrefix = String(series.titlePrefix);
    if (!Number.isInteger(count) || count < 1 || count > 100) throw new Error("Project-memory seed series count is invalid.");
    for (let index = 1; index <= count; index += 1) {
      cards.push({
        ...seed.defaults,
        ...series,
        count: undefined,
        id: `${idPrefix}${index}`,
        idPrefix: undefined,
        title: `${titlePrefix}${index}`,
        titlePrefix: undefined,
      });
    }
  }
  return cards.map((card) => Object.fromEntries(Object.entries(card).filter(([, value]) => value !== undefined)));
}

function substituteSeedText(value: unknown, replacements: Record<string, string>): unknown {
  if (typeof value === "string") return Object.entries(replacements).reduce((current, [marker, replacement]) => current.replaceAll(marker, replacement), value);
  if (Array.isArray(value)) return value.map((item) => substituteSeedText(item, replacements));
  if (value != null && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, substituteSeedText(item, replacements)]));
  return value;
}

function runCorpusProcessOracle(oracle: { command: string; expectedPasses: string[] }): Record<string, unknown> {
  const [runtime, relative, ...extra] = oracle.command.split(" ");
  if (runtime !== "node" || relative == null || extra.length > 0 || !relative.startsWith("tools/test-project-memory")) {
    throw new Error("Project-memory corpus process oracle command is outside the reviewed envelope.");
  }
  const command = spawnSync(process.execPath, [path.join(sourceRoot, relative)], {
    cwd: sourceRoot,
    encoding: "utf8",
    env: { ...process.env },
    timeout: 120_000,
    windowsHide: true,
  });
  const observedPasses = command.stdout.split(/\r?\n/).filter((line) => line.startsWith("PASS ")).map((line) => line.slice(5));
  return {
    command: oracle.command,
    expectedPasses: oracle.expectedPasses,
    observedPasses,
    status: command.status,
    stderrSha256: sha256(command.stderr),
    stdoutSha256: sha256(command.stdout),
    supported: command.status === 0 && stableJson(observedPasses) === stableJson(oracle.expectedPasses),
  };
}

async function runCorpus(options: CorpusOptions): Promise<void> {
  if (fs.existsSync(options.evidenceDir)) throw new Error(`Evidence directory already exists: ${options.evidenceDir}`);
  const { canonical, seed } = readCorpusSeed(options.fixture);
  const fixtureRoot = fs.mkdtempSync(path.join(os.tmpdir(), "project-memory-corpus-"));
  const projectRoot = path.join(fixtureRoot, "project");
  const otherProjectRoot = path.join(fixtureRoot, "other-project");
  const dataRoot = path.join(fixtureRoot, "data");
  const memoriesRoot = path.join(projectRoot, ".serena", "memories");
  const fixedNow = new Date(seed.fixedNow);
  const checks: Record<string, boolean> = {
    "seed-schema": true,
    "seed-readback": stableJson(JSON.parse(canonical)) === canonical,
  };
  let networkCalls = 0;
  const previousFetch = globalThis.fetch;
  globalThis.fetch = (async () => {
    networkCalls += 1;
    throw new Error("External egress is forbidden in project-memory corpus mode.");
  }) as typeof fetch;
  try {
    fs.mkdirSync(projectRoot, { recursive: true });
    fs.mkdirSync(otherProjectRoot, { recursive: true });
    initializeProject(projectRoot);
    initializeProject(otherProjectRoot);
    fs.writeFileSync(path.join(projectRoot, "src", "mismatch.ts"), "export const fingerprint = 'before';\n");
    fs.mkdirSync(memoriesRoot, { recursive: true });
    for (const curated of seed.curated) {
      const curatedPath = path.join(memoriesRoot, curated.path);
      fs.writeFileSync(curatedPath, curated.content, "utf8");
      fs.utimesSync(curatedPath, fixedNow, fixedNow);
    }
    const serenaBefore = seed.curated.map((item) => ({ path: item.path, sha256: sha256(fs.readFileSync(path.join(memoriesRoot, item.path))) }));
    const projectStatusBefore = gitStatus(projectRoot);
    const environment = { OPENCODE_PROJECT_MEMORY: "1", OPENCODE_DATA_DIR: dataRoot };
    const feature = createProjectMemoryFeature({ worktree: projectRoot, environment });
    if (feature == null) throw new Error("Project-memory corpus feature did not enable.");
    const refsById = new Map<string, string>();
    const idsByRef = new Map<string, string>();
    const replacements = {
      "$HOME_PATH": os.homedir(),
      "$PROJECT_ROOT": projectRoot,
      "$PROJECT_ROOT_SLASH": projectRoot.replaceAll("\\", "/"),
      "$SUPPORTED_CREDENTIAL": seed.supportedCredential,
    };
    const expandedA = expandSeedCards(seed);
    const expandedB = expandSeedCards(JSON.parse(canonical) as CorpusSeed);
    checks["regeneration-stable"] = stableJson(expandedA) === stableJson(expandedB);
    for (const [index, rawCard] of expandedA.entries()) {
      const card = substituteSeedText(rawCard, replacements) as Record<string, unknown>;
      const id = String(card.id);
      const state = String(card.state);
      const verifiedAt = card.verifiedAt == null
        ? new Date(fixedNow.getTime() + index * 1_000).toISOString()
        : String(card.verifiedAt);
      const candidateInput = { ...card, action: "candidate" };
      delete candidateInput.id;
      delete candidateInput.state;
      delete candidateInput.verifiedAt;
      const created = await feature.manage(candidateInput as never, new Date(fixedNow.getTime() + index * 1_000));
      refsById.set(id, created.cardRef);
      idsByRef.set(created.cardRef, id);
      if (state !== "candidate") {
        await feature.manage({ action: "promote", cardRef: created.cardRef, evidence: "PMC-001 reviewed promotion.", verifiedAt }, new Date(verifiedAt));
      }
      if (state === "invalidated") {
        await feature.manage({ action: "invalidate", cardRef: created.cardRef, reason: "PMC-001 reviewed terminal invalidation." }, new Date(fixedNow.getTime() + (index + 100) * 1_000));
      }
    }
    fs.writeFileSync(path.join(projectRoot, "src", "mismatch.ts"), "export const fingerprint = 'after';\n");
    const store = resolveProjectMemoryStore({ worktree: projectRoot, environment });
    if (store == null) throw new Error("Project-memory corpus store did not resolve.");
    fs.writeFileSync(path.join(store.storeRoot, "cards", "card-1999.md"), "# malformed reviewed corpus record\n", { flag: "wx" });

    const queryObservations: Array<Record<string, unknown>> = [];
    for (const query of seed.queries) {
      const result = await feature.recall(query.input as never, { automatic: query.automatic === true, now: fixedNow });
      const order = result.results.map((item) => idsByRef.get(item.ref) ?? `serena:${item.ref}`);
      const expectedFirst = query.expectedFirst == null ? null : String(query.expectedFirst);
      const expectedOrder = Array.isArray(query.expectedOrder) ? query.expectedOrder.map(String) : null;
      const expectedContains = Array.isArray(query.expectedContains) ? query.expectedContains.map(String) : [];
      const expectedPrefix = Array.isArray(query.expectedPrefix) ? query.expectedPrefix.map(String) : null;
      const first = result.results[0];
      const supported = (expectedFirst == null || order[0] === expectedFirst)
        && (expectedOrder == null || stableJson(order) === stableJson(expectedOrder))
        && expectedContains.every((id) => order.includes(id))
        && (expectedPrefix == null || stableJson(order.slice(0, expectedPrefix.length)) === stableJson(expectedPrefix))
        && (query.expectedExclusion == null || first?.exclusionReason === query.expectedExclusion)
        && (query.expectedExactPath == null || first?.scoreEvidence.exactPath === query.expectedExactPath)
        && (query.expectedExactSymbol == null || first?.scoreEvidence.exactSymbol === query.expectedExactSymbol)
        && (query.expectedFirstScore == null || first?.score === query.expectedFirstScore)
        && (query.expectedFirstBm25 == null || first?.scoreEvidence.bm25 === query.expectedFirstBm25)
        && (query.expectedFirstMatchedTerms == null || first?.scoreEvidence.matchedTerms === query.expectedFirstMatchedTerms)
        && (query.expectedTruncated == null || result.truncated === query.expectedTruncated)
        && (query.expectedOmittedMinimum == null || result.omitted >= Number(query.expectedOmittedMinimum));
      checks[String(query.id)] = supported;
      const normalizedCapsule = [...idsByRef].reduce((current, [ref, id]) => current.replaceAll(ref, `<${id}>`), result.capsule);
      queryObservations.push({
        id: query.id,
        capsuleBytes: Buffer.byteLength(normalizedCapsule, "utf8"),
        capsuleSha256: sha256(normalizedCapsule),
        omitted: result.omitted,
        order,
        scores: result.results.map((item) => ({ id: idsByRef.get(item.ref) ?? `serena:${item.ref}`, score: item.score, scoreEvidence: item.scoreEvidence })),
        supported,
        truncated: result.truncated,
        warnings: result.warnings,
      });
    }
    checks["malformed-quarantine"] = queryObservations.every((observation) => Array.isArray(observation.warnings)
      && observation.warnings.some((warning) => typeof warning === "string" && warning.startsWith("malformed:malformed-record:record_")));

    let parentID: string | null = null;
    const hooks = createProjectMemoryPluginHooks({
      client: { session: { async get(input: { path?: { id?: string } }) {
        return { data: { id: input.path?.id, parentID, directory: projectRoot } };
      } } },
      directory: projectRoot,
      project: { worktree: projectRoot },
      worktree: projectRoot,
    }, environment);
    const systemBefore: string[] = [];
    await hooks["experimental.chat.system.transform"]?.({ sessionID: "session-root", model: { providerID: "proof", modelID: "proof" } } as never, { system: systemBefore });
    await hooks["chat.message"]?.(
      { sessionID: "session-root", agent: "build", model: { providerID: "proof", modelID: "proof" }, messageID: "message-root" } as never,
      { message: {} as never, parts: [{ type: "text", text: "How should I restart supervisor safely?" }] as never },
    );
    const rootSystem: string[] = [];
    await hooks["experimental.chat.system.transform"]?.({ sessionID: "session-root", model: { providerID: "proof", modelID: "proof" } } as never, { system: rootSystem });
    checks["primary-root-injection"] = systemBefore.length === 0 && rootSystem.length === 1 && rootSystem[0]!.includes("Restart the shared supervisor");
    checks["privacy-redaction"] = !rootSystem.join("\n").toLowerCase().includes(projectRoot.toLowerCase())
      && !rootSystem.join("\n").includes(seed.supportedCredential)
      && !rootSystem.join("\n").toLowerCase().includes(os.homedir().toLowerCase());

    if (hooks.tool == null) throw new Error("Project-memory corpus tools are missing.");
    let recallMetadata: unknown = null;
    const recallTool = await hooks.tool.project_memory_recall.execute(
      { input: { query: "privacy redaction" } },
      { directory: projectRoot, metadata(value: unknown) { recallMetadata = value; } } as never,
    );
    const manageTool = await hooks.tool.project_memory_manage.execute(
      { input: {
        action: "candidate",
        title: "Tool output boundary",
        kind: "tip",
        confidence: "low",
        triggers: ["tool output boundary"],
        technique: "Return refs, status, and bounded diagnostics.",
        why: "The tool contract is reviewed.",
        evidence: "PMC-001 tool fixture.",
        invalidatedWhen: "The tool output contract changes.",
      } },
      { directory: projectRoot, metadata() {} } as never,
    );
    checks["tools-bounded"] = Buffer.byteLength(recallTool.output, "utf8") <= 16 * 1024
      && Buffer.byteLength(manageTool.output, "utf8") <= 4 * 1024
      && recallMetadata != null;

    const otherFeature = createProjectMemoryFeature({ worktree: otherProjectRoot, environment });
    checks["root-identity-isolation"] = otherFeature != null && otherFeature.projectRef !== feature.projectRef;
    checks["disabled-mode"] = Object.keys(createProjectMemoryPluginHooks({}, { OPENCODE_PROJECT_MEMORY: "0" })).length === 0;
    parentID = "session-root";
    await hooks["chat.message"]?.(
      { sessionID: "session-child", agent: "build", model: { providerID: "proof", modelID: "proof" }, messageID: "message-child" } as never,
      { message: {} as never, parts: [{ type: "text", text: "How should I restart supervisor safely?" }] as never },
    );
    const childSystem: string[] = [];
    await hooks["experimental.chat.system.transform"]?.({ sessionID: "session-child", model: { providerID: "proof", modelID: "proof" } } as never, { system: childSystem });
    checks["subagent-exclusion-direct"] = childSystem.length === 0;
    await hooks.dispose?.();

    const processOracles = seed.processOracles.map(runCorpusProcessOracle);
    checks["process-direct"] = processOracles[0]?.supported === true;
    checks["process-hooks"] = processOracles[1]?.supported === true;
    const serenaAfter = seed.curated.map((item) => ({ path: item.path, sha256: sha256(fs.readFileSync(path.join(memoriesRoot, item.path))) }));
    checks["serena-read-only"] = stableJson(serenaAfter) === stableJson(serenaBefore);
    const persisted = [
      ...fs.readdirSync(path.join(store.storeRoot, "cards")).map((name) => fs.readFileSync(path.join(store.storeRoot, "cards", name), "utf8")),
      ...fs.readdirSync(path.join(store.storeRoot, "events")).map((name) => fs.readFileSync(path.join(store.storeRoot, "events", name), "utf8")),
    ].join("\n");
    checks["privacy-redaction"] = checks["privacy-redaction"] === true
      && !persisted.toLowerCase().includes(projectRoot.toLowerCase())
      && !persisted.includes(seed.supportedCredential)
      && !persisted.toLowerCase().includes(os.homedir().toLowerCase());
    checks["no-side-effects"] = networkCalls === 0 && gitStatus(projectRoot) === projectStatusBefore;
    const memberObservations = seed.members.map((memberId) => ({
      memberId,
      checkIds: seed.memberChecks[memberId],
      status: seed.memberChecks[memberId]!.every((checkId) => checks[checkId] === true) ? "supported" : "failed",
    }));
    checks["all-members-supported"] = memberObservations.every((row) => row.status === "supported");
    const normalizedOutput = {
      memberObservations,
      queryObservations,
      processOracles,
      projectRefsDistinct: checks["root-identity-isolation"],
      toolBytes: { manage: Buffer.byteLength(manageTool.output, "utf8"), recall: Buffer.byteLength(recallTool.output, "utf8") },
    };
    fs.rmSync(fixtureRoot, { recursive: true, force: true });
    checks["cleanup-complete"] = !fs.existsSync(fixtureRoot);
    writeNew(path.join(options.evidenceDir, "raw.json"), {
      candidate: { sourceIdentity: sourceIdentity() },
      checks,
      cleanup: "complete",
      environment: { externalNetworkAllowed: false, node: process.version, platform: process.platform },
      fixture: { path: path.relative(sourceRoot, options.fixture).replaceAll("\\", "/"), sha256: sha256(canonical) },
      normalizedOutput,
      normalizedOutputSha256: sha256(stableJson(normalizedOutput)),
      schemaVersion: 1,
    });
    const failed = Object.entries(checks).filter(([, passed]) => !passed).map(([id]) => id);
    writeNew(path.join(options.evidenceDir, "evaluation.json"), {
      checks,
      failed,
      maximumSupportedClaim: failed.length === 0
        ? "The reviewed provider-free PMC-001 corpus is supported through the production store, recall, renderer, tool, hook, process, privacy, and side-effect boundaries."
        : "The reviewed provider-free PMC-001 corpus did not reach every declared oracle.",
      status: failed.length === 0 ? "complete" : "failed",
    });
    console.log(stableJson({ evidenceDir: path.relative(sourceRoot, options.evidenceDir).replaceAll("\\", "/"), failed, status: failed.length === 0 ? "complete" : "failed" }).trim());
    if (failed.length > 0) process.exitCode = 1;
  } finally {
    globalThis.fetch = previousFetch;
    fs.rmSync(fixtureRoot, { recursive: true, force: true });
  }
}

function fixedRef(prefix: "card" | "event", index: number): string {
  return `${prefix}_${index.toString(16).padStart(32, "0")}`;
}

async function runBoundary(options: BoundaryOptions): Promise<void> {
  if (fs.existsSync(options.evidenceDir)) throw new Error(`Evidence directory already exists: ${options.evidenceDir}`);
  const fixtureRoot = fs.mkdtempSync(path.join(os.tmpdir(), "project-memory-boundary-"));
  const projectRoot = path.join(fixtureRoot, "project");
  const dataRoot = path.join(fixtureRoot, "data");
  const environment = { OPENCODE_PROJECT_MEMORY: "1", OPENCODE_DATA_DIR: dataRoot };
  const fixedNow = new Date("2026-08-25T18:00:00.000Z");
  const previousFetch = globalThis.fetch;
  let networkCalls = 0;
  globalThis.fetch = (async () => {
    networkCalls += 1;
    throw new Error("External egress is forbidden in project-memory boundary mode.");
  }) as typeof fetch;
  try {
    fs.mkdirSync(projectRoot, { recursive: true });
    initializeProject(projectRoot);
    const projectStatusBefore = gitStatus(projectRoot);
    const store = resolveProjectMemoryStore({ worktree: projectRoot, environment });
    const feature = createProjectMemoryFeature({ worktree: projectRoot, environment });
    if (store == null || feature == null) throw new Error("Project-memory boundary store did not resolve.");
    const cardsRoot = path.join(store.storeRoot, "cards");
    const eventsRoot = path.join(store.storeRoot, "events");
    fs.mkdirSync(cardsRoot, { recursive: true });
    fs.mkdirSync(eventsRoot, { recursive: true });
    const fixtureHash = crypto.createHash("sha256");
    let candidateBytes = 0;
    let promotionBytes = 0;
    let invalidationBytes = 0;
    for (let index = 0; index < 2_000; index += 1) {
      const createdAt = new Date(fixedNow.getTime() + index).toISOString();
      const candidate: ProjectMemoryCandidate = {
        schemaVersion: 1,
        event: "candidate",
        eventRef: fixedRef("event", 8_000 + index),
        cardRef: fixedRef("card", index + 1),
        title: index === 0 ? "Boundary direct scan current" : `Boundary direct scan invalidated ${index}`,
        kind: "procedure",
        createdAt,
        confidence: "high",
        triggers: ["boundary direct scan"],
        appliesTo: { paths: [], symbols: [] },
        evidencePaths: [],
        technique: `${index === 0 ? "current" : "invalidated"}:${"x".repeat(15_000)}`,
        why: "Exercise the complete declared direct-scan population.",
        evidence: "Task 3.2 reviewed boundary fixture.",
        invalidatedWhen: "The direct-scan operating envelope changes.",
      };
      const content = candidateMarkdown(candidate);
      candidateBytes = Buffer.byteLength(content, "utf8");
      const name = `card-${String(index).padStart(4, "0")}.md`;
      fs.writeFileSync(path.join(cardsRoot, name), content, { flag: "wx" });
      fixtureHash.update(`${name}\n${sha256(content)}\n`);
    }
    for (let index = 0; index < 6_001; index += 1) {
      const cardIndex = index === 6_000 ? 0 : index % 2_000;
      const createdAt = new Date(fixedNow.getTime() + 10_000 + index).toISOString();
      const promotion: ProjectMemoryPromotion = {
        schemaVersion: 1,
        event: "promote",
        eventRef: fixedRef("event", index),
        cardRef: fixedRef("card", cardIndex + 1),
        createdAt,
        verifiedAt: createdAt,
        fingerprints: [],
        evidence: `promotion-${index}:${"p".repeat(3_500)}`,
      };
      const content = promotionMarkdown(promotion);
      promotionBytes = Buffer.byteLength(content, "utf8");
      const name = `event-${String(index).padStart(6, "0")}.md`;
      fs.writeFileSync(path.join(eventsRoot, name), content, { flag: "wx" });
      fixtureHash.update(`${name}\n${sha256(content)}\n`);
    }
    for (let cardIndex = 1; cardIndex < 2_000; cardIndex += 1) {
      const eventIndex = 6_000 + cardIndex;
      const invalidation: ProjectMemoryInvalidation = {
        schemaVersion: 1,
        event: "invalidate",
        eventRef: fixedRef("event", eventIndex),
        cardRef: fixedRef("card", cardIndex + 1),
        createdAt: new Date(fixedNow.getTime() + 20_000 + cardIndex).toISOString(),
        reason: `invalidation-${cardIndex}:${"i".repeat(3_500)}`,
      };
      const content = invalidationMarkdown(invalidation);
      invalidationBytes = Buffer.byteLength(content, "utf8");
      const name = `event-${String(eventIndex).padStart(6, "0")}.md`;
      fs.writeFileSync(path.join(eventsRoot, name), content, { flag: "wx" });
      fixtureHash.update(`${name}\n${sha256(content)}\n`);
    }
    const memoryBefore = process.memoryUsage();
    const scanStarted = performance.now();
    const population = await readProjectMemoryPopulation(store);
    const scanElapsedMs = performance.now() - scanStarted;
    const memoryAfterScan = process.memoryUsage();
    const recallStarted = performance.now();
    const recalled = await feature.recall({ query: "boundary direct scan" }, { automatic: true, now: new Date(fixedNow.getTime() + 30_000) });
    const recallElapsedMs = performance.now() - recallStarted;
    const memoryAfterRecall = process.memoryUsage();
    const cardFiles = fs.readdirSync(cardsRoot).length;
    const eventFiles = fs.readdirSync(eventsRoot).length;
    const statusCounts = Object.fromEntries(["active", "candidate", "invalidated"].map((status) => [status, population.cards.filter((card) => card.status === status).length]));
    const projection = {
      capsuleBytes: Buffer.byteLength(recalled.capsule, "utf8"),
      capsuleSha256: sha256(recalled.capsule),
      cardFiles,
      eventFiles,
      firstResult: recalled.results[0] == null ? null : {
        ref: recalled.results[0].ref,
        score: recalled.results[0].score,
        scoreEvidence: recalled.results[0].scoreEvidence,
        source: recalled.results[0].source,
      },
      omitted: recalled.omitted,
      resultCount: recalled.results.length,
      statusCounts,
      truncated: recalled.truncated,
      warnings: recalled.warnings,
    };
    const checks = {
      candidateNearMaximum: candidateBytes >= 15 * 1024 && candidateBytes <= 16 * 1024,
      cleanupComplete: false,
      deterministicProjection: projection.firstResult?.ref === fixedRef("card", 1),
      exactCardCount: cardFiles === 2_000 && population.cards.length === 2_000,
      exactEventCount: eventFiles === 8_000,
      invalidationFolded: statusCounts.active === 1 && statusCounts.invalidated === 1_999 && statusCounts.candidate === 0,
      lifecycleNearMaximum: promotionBytes >= 3_500 && promotionBytes <= 4 * 1024 && invalidationBytes >= 3_500 && invalidationBytes <= 4 * 1024,
      noExternalEgress: networkCalls === 0,
      noWarnings: population.warnings.length === 0 && recalled.warnings.length === 0,
      projectUnchanged: gitStatus(projectRoot) === projectStatusBefore,
      renderBounded: recalled.results.length === 1 && Buffer.byteLength(recalled.capsule, "utf8") <= 8 * 1024,
    };
    const observations = {
      bytes: { candidate: candidateBytes, invalidation: invalidationBytes, promotion: promotionBytes },
      elapsedMs: { recall: recallElapsedMs, scan: scanElapsedMs },
      fixtureSha256: fixtureHash.digest("hex"),
      memoryBytes: {
        afterRecall: memoryAfterRecall,
        afterScan: memoryAfterScan,
        before: memoryBefore,
      },
      projection,
      projectionSha256: sha256(stableJson(projection)),
    };
    fs.rmSync(fixtureRoot, { recursive: true, force: true });
    checks.cleanupComplete = !fs.existsSync(fixtureRoot);
    const failed = Object.entries(checks).filter(([, passed]) => !passed).map(([id]) => id);
    writeNew(path.join(options.evidenceDir, "raw.json"), {
      candidate: { sourceIdentity: sourceIdentity() },
      checks,
      cleanup: "complete",
      environment: { externalNetworkAllowed: false, node: process.version, platform: process.platform },
      observations,
      schemaVersion: 1,
    });
    writeNew(path.join(options.evidenceDir, "evaluation.json"), {
      checks,
      failed,
      maximumSupportedClaim: failed.length === 0
        ? "The production direct scan enumerates and renders the complete 2,000-card/10,000-event near-limit local population with deterministic bounded output on the captured environment."
        : "The production direct scan did not complete the declared local operating boundary.",
      status: failed.length === 0 ? "complete" : "failed",
    });
    console.log(stableJson({ evidenceDir: path.relative(sourceRoot, options.evidenceDir).replaceAll("\\", "/"), failed, status: failed.length === 0 ? "complete" : "failed" }).trim());
    if (failed.length > 0) process.exitCode = 1;
  } finally {
    globalThis.fetch = previousFetch;
    fs.rmSync(fixtureRoot, { recursive: true, force: true });
  }
}

function startProvider(): Promise<ProviderCapture> {
  const captured: unknown[] = [];
  let trapped = 0;
  let managedCardRef: string | null = null;
  const server = http.createServer((request, response) => {
    const url = request.url ?? "";
    if (url.endsWith("/models")) {
      response.writeHead(200, { "content-type": "application/json" });
      response.end(JSON.stringify({ object: "list", data: [{ id: "proof-model", object: "model", owned_by: "proof" }] }));
      return;
    }
    if (!url.endsWith("/chat/completions")) {
      trapped += 1;
      response.writeHead(502, { "content-type": "application/json" });
      response.end(JSON.stringify({ error: { message: "external egress blocked by project-memory proof" } }));
      return;
    }
    const chunks: Buffer[] = [];
    let bytes = 0;
    request.on("data", (chunk: Buffer) => {
      bytes += chunk.length;
      if (bytes <= 512 * 1024) chunks.push(chunk);
    });
    request.on("end", () => {
      if (bytes > 512 * 1024) {
        response.writeHead(413);
        response.end();
        return;
      }
      try {
        captured.push(JSON.parse(Buffer.concat(chunks).toString("utf8")));
      } catch {
        captured.push({ malformedRequest: true });
      }
      const parsed = captured.at(-1) as Record<string, unknown> | undefined;
      const messages = Array.isArray(parsed?.messages) ? parsed.messages as Array<Record<string, unknown>> : [];
      const lastMessage = messages.at(-1);
      const messageContents = messages.map((message) => typeof message.content === "string" ? message.content : JSON.stringify(message.content ?? "")).join("\n");
      const observedCardRefs = [...messageContents.matchAll(/"cardRef"\s*:\s*"(card_[a-f0-9]{32})"/g)];
      if (observedCardRefs.length > 0) managedCardRef = observedCardRefs.at(-1)?.[1] ?? managedCardRef;
      const userMessage = [...messages].reverse().find((message) => message.role === "user");
      const userText = typeof userMessage?.content === "string"
        ? userMessage.content
        : JSON.stringify(userMessage?.content ?? "");
      let toolCall: { name: string; input: Record<string, unknown> } | null = null;
      if (lastMessage?.role !== "tool") {
        if (userText.includes("PMC_TOOL_CANDIDATE")) {
          toolCall = { name: "project_memory_manage", input: {
            action: "candidate",
            title: "Loaded lifecycle procedure",
            kind: "procedure",
            confidence: "high",
            triggers: ["loaded lifecycle procedure"],
            appliesTo: { paths: ["src/config.ts"], symbols: ["restartDeadline"] },
            evidencePaths: ["src/config.ts"],
            technique: "Use the loaded project-memory tool lifecycle.",
            why: "The installed tool boundary must preserve explicit state.",
            evidence: "Task 4.1 loopback tool call.",
            invalidatedWhen: "The loaded tool contract changes.",
          } };
        } else if (userText.includes("PMC_TOOL_PROMOTE") && managedCardRef != null) {
          toolCall = { name: "project_memory_manage", input: {
            action: "promote",
            cardRef: managedCardRef,
            evidence: "Verified through the loaded tool boundary.",
            verifiedAt: "2026-08-25T18:00:00.000Z",
          } };
        } else if (userText.includes("PMC_TOOL_INVALIDATE") && managedCardRef != null) {
          toolCall = { name: "project_memory_manage", input: {
            action: "invalidate",
            cardRef: managedCardRef,
            reason: "Loaded lifecycle terminal invalidation.",
          } };
        } else if (userText.includes("PMC_TOOL_RECALL_INVALIDATED")) {
          toolCall = { name: "project_memory_recall", input: {
            query: "loaded lifecycle procedure",
            statuses: ["invalidated"],
          } };
        } else if (userText.includes("PMC_TOOL_RECALL_STALE")) {
          toolCall = { name: "project_memory_recall", input: {
            query: "loaded stale fingerprint",
            statuses: ["active"],
          } };
        } else if (userText.includes("PMC_TOOL_RECALL_ACTIVE")) {
          toolCall = { name: "project_memory_recall", input: {
            query: "loaded lifecycle procedure",
            path: "src/config.ts",
            symbol: "restartDeadline",
            statuses: ["active"],
          } };
        }
      }
      if (parsed?.stream === true) {
        const callId = `call_project_memory_${captured.length}`;
        const completionChunks = toolCall == null
          ? [
              { id: "chatcmpl_project_memory_proof", object: "chat.completion.chunk", created: 0, model: "proof-model", choices: [{ index: 0, delta: { role: "assistant", content: "Loopback project-memory proof complete." }, finish_reason: null }] },
              { id: "chatcmpl_project_memory_proof", object: "chat.completion.chunk", created: 0, model: "proof-model", choices: [{ index: 0, delta: {}, finish_reason: "stop" }] },
            ]
          : [
              { id: "chatcmpl_project_memory_proof", object: "chat.completion.chunk", created: 0, model: "proof-model", choices: [{ index: 0, delta: { role: "assistant", tool_calls: [{ index: 0, id: callId, type: "function", function: { name: toolCall.name, arguments: JSON.stringify({ input: toolCall.input }) } }] }, finish_reason: null }] },
              { id: "chatcmpl_project_memory_proof", object: "chat.completion.chunk", created: 0, model: "proof-model", choices: [{ index: 0, delta: {}, finish_reason: "tool_calls" }] },
            ];
        response.writeHead(200, { "content-type": "text/event-stream" });
        response.end(`${completionChunks.map((chunk) => `data: ${JSON.stringify(chunk)}\n\n`).join("")}data: [DONE]\n\n`);
      } else {
        response.writeHead(200, { "content-type": "application/json" });
        response.end(JSON.stringify({
          choices: [{ finish_reason: "stop", index: 0, message: { content: "Loopback project-memory proof complete.", role: "assistant" } }],
          created: 0,
          id: "chatcmpl_project_memory_proof",
          model: "proof-model",
          object: "chat.completion",
          usage: { completion_tokens: 1, prompt_tokens: 1, total_tokens: 2 },
        }));
      }
    });
  });
  return new Promise((resolve, reject) => {
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (address == null || typeof address === "string") {
        reject(new Error("Loopback provider did not expose a TCP port."));
        return;
      }
      resolve({
        close: () => new Promise((done, fail) => {
          server.closeAllConnections();
          server.close((error) => error == null ? done() : fail(error));
        }),
        egressTrapCount: () => trapped,
        requests: () => [...captured],
        url: `http://127.0.0.1:${address.port}`,
      });
    });
    server.once("error", reject);
  });
}

function writeTracedPlugin(configDir: string, traceFile: string, gateRoot: string): string {
  const runtimeRoot = path.join(configDir, "runtime");
  const pluginRoot = path.join(runtimeRoot, "plugin");
  fs.cpSync(path.join(sourceRoot, "global", "plugin"), pluginRoot, { recursive: true });
  const source = pathToFileURL(path.join(pluginRoot, "session-env.ts")).href;
  const wrapper = path.join(runtimeRoot, "project-memory-proof-plugin.ts");
  fs.writeFileSync(wrapper, `import fs from "node:fs";
import path from "node:path";
import source from ${JSON.stringify(source)};
const traceFile = ${JSON.stringify(traceFile)};
const gateRoot = ${JSON.stringify(gateRoot)};
const trace = (phase, detail = {}) => fs.appendFileSync(traceFile, JSON.stringify({ at: new Date().toISOString(), phase, ...detail }) + "\\n", "utf8");
const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));
const gate = async (phase) => {
  const request = path.join(gateRoot, phase + ".request");
  if (!fs.existsSync(request)) return;
  const arrived = path.join(gateRoot, phase + ".arrived");
  const release = path.join(gateRoot, phase + ".release");
  fs.writeFileSync(arrived, "arrived", { flag: "wx" });
  trace(phase + "-gate-arrived");
  const deadline = Date.now() + 10_000;
  while (!fs.existsSync(release) && Date.now() < deadline) await wait(25);
  if (!fs.existsSync(release)) throw new Error("Project-memory proof gate timed out: " + phase);
  for (const file of [request, arrived, release]) fs.rmSync(file, { force: true });
  trace(phase + "-gate-released");
};
export default {
  id: "project-memory-proof-wrapper",
  async server(input) {
    trace("factory-enter");
    const wrappedClient = input.client == null ? input.client : new Proxy(input.client, {
      get(target, property, receiver) {
        if (property !== "session" || target.session == null) return Reflect.get(target, property, receiver);
        return new Proxy(target.session, {
          get(session, sessionProperty, sessionReceiver) {
            if (sessionProperty !== "get" || typeof session.get !== "function") return Reflect.get(session, sessionProperty, sessionReceiver);
            return async (...args) => {
              const timeoutRequest = path.join(gateRoot, "root-timeout.request");
              if (fs.existsSync(timeoutRequest)) {
                fs.rmSync(timeoutRequest, { force: true });
                trace("root-timeout-enter");
                await wait(1_500);
                trace("root-timeout-exit");
              }
              return session.get.apply(session, args);
            };
          },
        });
      },
    });
    const hooks = await source.server({ ...input, client: wrappedClient });
    trace("factory-exit", { hooks: Object.keys(hooks).sort() });
    const wrapped = { ...hooks };
    for (const [name, phase] of [["chat.message", "message"], ["experimental.chat.system.transform", "system"], ["experimental.session.compacting", "compact"]]) {
      const hook = hooks[name];
      if (typeof hook !== "function") continue;
      wrapped[name] = async (...args) => {
        trace(phase + "-enter");
        try {
          await gate(phase);
          const result = await hook(...args);
          trace(phase + "-exit");
          return result;
        } catch (error) {
          trace(phase + "-error", { name: error instanceof Error ? error.name : "unknown" });
          throw error;
        }
      };
    }
    return wrapped;
  },
};
`, "utf8");
  return pathToFileURL(wrapper).href;
}

function seedPluginRuntime(target: string, source: string, expectedVersion: string): void {
  const sourcePackage = path.join(source, "package.json");
  const sourceLock = path.join(source, "package-lock.json");
  const sourceModules = path.join(source, "node_modules");
  const pluginPackage = path.join(sourceModules, "@opencode-ai", "plugin", "package.json");
  for (const required of [sourcePackage, sourceLock, sourceModules, pluginPackage]) {
    if (!fs.existsSync(required)) throw new Error(`Pinned plugin runtime is incomplete: ${path.basename(required)}`);
  }
  const declared = JSON.parse(fs.readFileSync(sourcePackage, "utf8")) as { dependencies?: Record<string, string> };
  const installed = JSON.parse(fs.readFileSync(pluginPackage, "utf8")) as { version?: string };
  if (declared.dependencies?.["@opencode-ai/plugin"] !== expectedVersion || installed.version !== expectedVersion) {
    throw new Error(`Pinned plugin runtime mismatch: expected=${expectedVersion} declared=${declared.dependencies?.["@opencode-ai/plugin"] ?? "missing"} installed=${installed.version ?? "missing"}`);
  }
  fs.mkdirSync(target, { recursive: true });
  fs.copyFileSync(sourcePackage, path.join(target, "package.json"));
  fs.copyFileSync(sourceLock, path.join(target, "package-lock.json"));
  fs.symlinkSync(sourceModules, path.join(target, "node_modules"), process.platform === "win32" ? "junction" : "dir");
}

function pluginRuntimeIdentity(runtime: string): Record<string, unknown> {
  const pluginPackage = path.join(runtime, "node_modules", "@opencode-ai", "plugin", "package.json");
  return {
    lockSha256: sha256(fs.readFileSync(path.join(runtime, "package-lock.json"))),
    packageSha256: sha256(fs.readFileSync(path.join(runtime, "package.json"))),
    pluginPackageSha256: sha256(fs.readFileSync(pluginPackage)),
    pluginVersion: (JSON.parse(fs.readFileSync(pluginPackage, "utf8")) as { version?: string }).version ?? null,
  };
}

function writeConfig(configDir: string, plugin: string, providerUrl?: string): void {
  const providerConfig = providerUrl == null ? {} : {
    model: "proof/proof-model",
    small_model: "proof/proof-model",
    provider: {
      proof: {
        npm: "@ai-sdk/openai-compatible",
        name: "Project Memory Proof",
        options: { apiKey: "proof-not-secret", baseURL: `${providerUrl}/v1`, maxRetries: 0 },
        models: {
          "proof-model": {
            name: "Proof Model",
            tool_call: true,
            limit: { context: 100_000, output: 10_000 },
          },
        },
      },
    },
  };
  fs.writeFileSync(path.join(configDir, "opencode.json"), stableJson({
    $schema: "https://opencode.ai/config.json",
    permission: {
      "*": "deny",
      project_memory_manage: "allow",
      project_memory_recall: "allow",
      session_delivery_context: "allow",
    },
    ...providerConfig,
    plugin: [plugin],
  }), "utf8");
}

function proofEnvironment(configDir: string, fixtureRoot: string, providerUrl: string, ripgrep: string): NodeJS.ProcessEnv {
  if (!fs.existsSync(ripgrep)) throw new Error("Explicit --ripgrep executable is unavailable.");
  const isolatedRipgrep = path.join(fixtureRoot, "cache", "opencode", "bin", process.platform === "win32" ? "rg.exe" : "rg");
  fs.mkdirSync(path.dirname(isolatedRipgrep), { recursive: true });
  fs.copyFileSync(ripgrep, isolatedRipgrep);
  const environment: NodeJS.ProcessEnv = {
    ...process.env,
    ALL_PROXY: providerUrl,
    HOME: path.join(fixtureRoot, "home"),
    HTTP_PROXY: providerUrl,
    HTTPS_PROXY: providerUrl,
    NO_PROXY: "127.0.0.1,localhost",
    OPENCODE_CONFIG_DIR: configDir,
    OPENCODE_DATA_DIR: path.join(fixtureRoot, "project-memory-data"),
    OPENCODE_DB: path.join(fixtureRoot, "opencode.db"),
    OPENCODE_DISABLE_AUTOUPDATE: "1",
    OPENCODE_DISABLE_DEFAULT_PLUGINS: "1",
    OPENCODE_DISABLE_EMBEDDED_WEB_UI: "1",
    OPENCODE_DISABLE_EXTERNAL_SKILLS: "1",
    OPENCODE_DISABLE_LSP_DOWNLOAD: "1",
    OPENCODE_DISABLE_MODELS_FETCH: "1",
    OPENCODE_DISABLE_PROJECT_CONFIG: "1",
    OPENCODE_EXPERIMENTAL_DISABLE_FILEWATCHER: "1",
    OPENCODE_PROJECT_MEMORY: "1",
    OPENCODE_PURE: "0",
    PATH: `${path.dirname(isolatedRipgrep)}${path.delimiter}${process.env.PATH ?? ""}`,
    USERPROFILE: path.join(fixtureRoot, "home"),
    XDG_CACHE_HOME: path.join(fixtureRoot, "cache"),
    XDG_CONFIG_HOME: path.join(fixtureRoot, "config-home"),
    XDG_DATA_HOME: path.join(fixtureRoot, "data"),
    XDG_STATE_HOME: path.join(fixtureRoot, "state"),
  };
  delete environment.OPENCODE_CONFIG;
  delete environment.OPENCODE_CONFIG_CONTENT;
  delete environment.OPENCODE_PID;
  delete environment.OPENCODE_SERVER_PASSWORD;
  delete environment.OPENCODE_SERVER_USERNAME;
  delete environment.OPENCODE_SESSION_ID;
  return environment;
}

async function runProcess(
  executable: string,
  args: string[],
  projectRoot: string,
  environment: NodeJS.ProcessEnv,
  timeoutMs: number,
): Promise<CommandResult> {
  return await new Promise((resolve, reject) => {
    const child = spawn(executable, args, {
      cwd: projectRoot,
      env: environment,
      shell: false,
      windowsHide: true,
    });
    const stdout: Buffer[] = [];
    const stderr: Buffer[] = [];
    let stdoutBytes = 0;
    let stderrBytes = 0;
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      if (child.pid == null) return;
      if (process.platform === "win32") {
        const stopper = spawn("pwsh", [
          "-NoLogo",
          "-NoProfile",
          "-NonInteractive",
          "-Command",
          `Stop-Process -Id ${child.pid} -Force -ErrorAction SilentlyContinue`,
        ], { stdio: "ignore", windowsHide: true });
        stopper.once("error", reject);
      } else {
        child.kill("SIGKILL");
      }
    }, timeoutMs);
    child.stdout.on("data", (chunk: Buffer) => {
      if (stdoutBytes < 1024 * 1024) {
        stdout.push(chunk);
        stdoutBytes += chunk.length;
      }
    });
    child.stderr.on("data", (chunk: Buffer) => {
      if (stderrBytes < 1024 * 1024) {
        stderr.push(chunk);
        stderrBytes += chunk.length;
      }
    });
    child.once("error", (error) => {
      clearTimeout(timer);
      reject(new Error("Pinned OpenCode process could not start.", { cause: error }));
    });
    child.once("close", (status, signal) => {
      clearTimeout(timer);
      resolve({
        status,
        signal,
        stderr: Buffer.concat(stderr).toString("utf8"),
        stdout: Buffer.concat(stdout).toString("utf8"),
        timedOut,
      });
    });
  });
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

async function startProofServer(executable: string, projectRoot: string, environment: NodeJS.ProcessEnv): Promise<ServerHandle> {
  const port = await freePort();
  const child = spawn(executable, [
    "serve",
    "--hostname", "127.0.0.1",
    "--port", String(port),
    "--print-logs",
    "--log-level", "INFO",
  ], {
    cwd: projectRoot,
    env: environment,
    shell: false,
    windowsHide: true,
  });
  const stderr: Buffer[] = [];
  const stdout: Buffer[] = [];
  child.stderr.on("data", (chunk: Buffer) => stderr.push(chunk));
  child.stdout.on("data", (chunk: Buffer) => stdout.push(chunk));
  const completion = new Promise<{ signal: NodeJS.Signals | null; status: number | null }>((resolve, reject) => {
    child.once("error", reject);
    child.once("close", (status, signal) => resolve({ signal, status }));
  });
  const handle = { child, completion, stderr, stdout, url: `http://127.0.0.1:${port}` };
  const deadline = Date.now() + 60_000;
  try {
    while (Date.now() < deadline) {
      if (child.exitCode != null) throw new Error(`Pinned OpenCode proof server exited during readiness: ${child.exitCode}`);
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 1_000);
      try {
        const response = await fetch(new URL("/session/status", handle.url), { signal: controller.signal });
        await response.body?.cancel();
        if (response.ok) return handle;
      } catch {
        // Readiness failures are expected while the isolated server loads the plugin.
      } finally {
        clearTimeout(timer);
      }
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    throw new Error("Pinned OpenCode proof server did not become ready within 60000ms.");
  } catch (error) {
    await stopProofServer(handle);
    throw error;
  }
}

async function stopProofServer(server: ServerHandle): Promise<{ signal: NodeJS.Signals | null; status: number | null }> {
  if (server.child.exitCode == null && server.child.pid != null) {
    if (process.platform === "win32") {
      await new Promise<void>((resolve, reject) => {
        const stopper = spawn("pwsh", [
          "-NoLogo",
          "-NoProfile",
          "-NonInteractive",
          "-Command",
          `Stop-Process -Id ${server.child.pid} -Force -ErrorAction SilentlyContinue`,
        ], { stdio: "ignore", windowsHide: true });
        stopper.once("error", reject);
        stopper.once("close", () => resolve());
      });
    } else {
      server.child.kill("SIGKILL");
    }
  }
  const terminal = await Promise.race([
    server.completion,
    new Promise<never>((_resolve, reject) => setTimeout(() => reject(new Error("Pinned OpenCode proof server did not terminate within 10000ms.")), 10_000)),
  ]);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 1_000);
  try {
    await fetch(new URL("/session/status", server.url), { signal: controller.signal });
    throw new Error("Pinned OpenCode proof server listener remained reachable after termination.");
  } catch (error) {
    if (error instanceof Error && error.message.includes("remained reachable")) throw error;
  } finally {
    clearTimeout(timer);
  }
  return terminal;
}

async function withTimeout<T>(operation: Promise<T>, timeoutMs: number, label: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      operation,
      new Promise<never>((_resolve, reject) => {
        timer = setTimeout(() => reject(new Error(`${label} timed out after ${timeoutMs}ms.`)), timeoutMs);
      }),
    ]);
  } finally {
    if (timer != null) clearTimeout(timer);
  }
}

function requestText(value: unknown): string {
  return JSON.stringify(value);
}

function toolNames(value: unknown): string[] {
  const record = value != null && typeof value === "object" ? value as Record<string, unknown> : {};
  const tools = Array.isArray(record.tools) ? record.tools : [];
  return tools.flatMap((tool) => {
    const row = tool != null && typeof tool === "object" ? tool as Record<string, unknown> : {};
    const fn = row.function != null && typeof row.function === "object" ? row.function as Record<string, unknown> : {};
    return typeof fn.name === "string" ? [fn.name] : [];
  }).sort();
}

function latestToolResultText(requests: unknown[]): string {
  for (const request of [...requests].reverse()) {
    const row = request != null && typeof request === "object" ? request as Record<string, unknown> : {};
    const messages = Array.isArray(row.messages) ? row.messages as Array<Record<string, unknown>> : [];
    for (const message of [...messages].reverse()) {
      if (message.role !== "tool") continue;
      return typeof message.content === "string" ? message.content : JSON.stringify(message.content ?? "");
    }
  }
  return "";
}

async function waitForFile(file: string, label: string, timeoutMs = 10_000): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (!fs.existsSync(file) && Date.now() < deadline) await new Promise((resolve) => setTimeout(resolve, 25));
  if (!fs.existsSync(file)) throw new Error(`${label} did not reach its proof gate.`);
}

function traceRows(traceFile: string): Array<Record<string, unknown>> {
  return fs.existsSync(traceFile)
    ? fs.readFileSync(traceFile, "utf8").trim().split(/\r?\n/).filter(Boolean).map((line) => JSON.parse(line) as Record<string, unknown>)
    : [];
}

function tracePhases(trace: Array<Record<string, unknown>>): string[] {
  return trace.map((row) => row.phase).filter((phase): phase is string => typeof phase === "string");
}

async function main(options: LoadedOptions): Promise<void> {
  if (fs.existsSync(options.evidenceDir)) throw new Error(`Evidence directory already exists: ${options.evidenceDir}`);
  if (!fs.existsSync(options.pluginRuntime)) throw new Error(`Explicit plugin runtime is unavailable: ${options.pluginRuntime}`);
  if (!fs.existsSync(options.ripgrep)) throw new Error(`Explicit ripgrep identity is unavailable: ${options.ripgrep}`);
  const version = spawnSync(options.opencode, ["--version"], { encoding: "utf8", windowsHide: true });
  if (version.status !== 0 || version.stdout.trim() !== options.expectedVersion) {
    throw new Error(`Pinned OpenCode identity mismatch: expected=${options.expectedVersion} actual=${version.stdout.trim() || "unavailable"}`);
  }
  const fixtureRoot = fs.mkdtempSync(path.join(os.tmpdir(), "project-memory-loaded-"));
  const projectRoot = path.join(fixtureRoot, "project");
  const configDir = path.join(fixtureRoot, "config");
  const gateRoot = path.join(fixtureRoot, "gates");
  const traceFile = path.join(fixtureRoot, "plugin-trace.jsonl");
  let provider: ProviderCapture | null = null;
  let server: ServerHandle | null = null;
  let rawWritten = false;
  const preflights: Array<Record<string, unknown>> = [];
  try {
    fs.mkdirSync(projectRoot, { recursive: true });
    fs.mkdirSync(gateRoot, { recursive: true });
    initializeProject(projectRoot);
    const initialGitStatus = gitStatus(projectRoot);
    provider = await startProvider();
    seedPluginRuntime(configDir, options.pluginRuntime, options.expectedVersion);
    seedPluginRuntime(path.join(fixtureRoot, "config-home", "opencode"), options.pluginRuntime, options.expectedVersion);
    const plugin = writeTracedPlugin(configDir, traceFile, gateRoot);
    writeConfig(configDir, plugin);
    const environment = proofEnvironment(configDir, fixtureRoot, provider.url, options.ripgrep);
    for (const phase of ["plugin-only", "provider-added"] as const) {
      if (phase === "provider-added") writeConfig(configDir, plugin, provider.url);
      fs.writeFileSync(traceFile, "", "utf8");
      const command = await runProcess(options.opencode, ["debug", "config"], projectRoot, environment, 60_000);
      const trace = traceRows(traceFile);
      const phases = tracePhases(trace);
      const result = {
        phase,
        status: command.status,
        stderr: redact(command.stderr, fixtureRoot),
        stdoutSha256: sha256(command.stdout),
        timedOut: command.timedOut,
        trace: redactValue(trace, fixtureRoot),
        pluginRuntime: pluginRuntimeIdentity(path.join(fixtureRoot, "config-home", "opencode")),
        providerRequestCount: provider.requests().length,
      };
      preflights.push(result);
      if (command.status !== 0 || command.timedOut || !phases.includes("factory-enter") || !phases.includes("factory-exit") || provider.requests().length !== 0) {
        throw new Error(`Project-memory ${phase} config preflight failed.`);
      }
    }
    if (options.mode === "preflight") {
      const gitStatusAfter = gitStatus(projectRoot);
      const checks = {
        cleanProjectStatus: gitStatusAfter === initialGitStatus,
        noExternalEgress: provider.egressTrapCount() === 0,
        noProviderRequest: provider.requests().length === 0,
        phasesComplete: preflights.length === 2 && preflights.every((row) => row.status === 0 && row.timedOut === false),
      };
      const failed = Object.entries(checks).filter(([, passed]) => !passed).map(([name]) => name);
      writeNew(path.join(options.evidenceDir, "raw.json"), {
        candidate: { sourceIdentity: sourceIdentity() },
        environment: {
          externalNetworkAllowed: false,
          node: process.version,
          opencode: version.stdout.trim(),
          platform: process.platform,
          pluginRuntime: pluginRuntimeIdentity(options.pluginRuntime),
          ripgrepSha256: sha256(fs.readFileSync(options.ripgrep)),
        },
        observations: {
          egressTrapCount: provider.egressTrapCount(),
          gitStatusAfter,
          gitStatusBefore: initialGitStatus,
          providerRequestCount: provider.requests().length,
        },
        preflights,
        schemaVersion: 1,
      });
      rawWritten = true;
      writeNew(path.join(options.evidenceDir, "evaluation.json"), {
        checks,
        failed,
        maximumSupportedClaim: failed.length === 0
          ? "Pinned OpenCode resolved the copied plugin in isolated plugin-only and provider-added no-model configurations with no provider request, trapped egress, or worktree mutation."
          : "The isolated no-model config preflight did not reach its terminal oracle.",
        status: failed.length === 0 ? "complete" : "failed",
      });
      console.log(stableJson({ evidenceDir: path.relative(sourceRoot, options.evidenceDir).replaceAll("\\", "/"), failed, status: failed.length === 0 ? "complete" : "failed" }).trim());
      if (failed.length > 0) process.exitCode = 1;
      return;
    }
    fs.writeFileSync(traceFile, "", "utf8");
    const feature = createProjectMemoryFeature({ worktree: projectRoot, environment });
    const store = resolveProjectMemoryStore({ worktree: projectRoot, environment });
    if (feature == null || store == null) throw new Error("Enabled proof could not resolve the project-memory feature.");
    const rawSecret = "sk-proj-abcdefghijklmnopqrstuvwxyz";
    const rawHome = os.homedir();
    const memoriesRoot = path.join(projectRoot, ".serena", "memories");
    fs.mkdirSync(memoriesRoot, { recursive: true });
    fs.writeFileSync(path.join(memoriesRoot, "core.md"), "# Loaded Core\nCurrent loaded source outranks memory.\n", "utf8");
    fs.writeFileSync(path.join(memoriesRoot, "restart.md"), "# Curated Restart\nUse current curated restart guidance.\n", "utf8");
    fs.writeFileSync(path.join(projectRoot, "src", "mismatch.ts"), "export const fingerprint = 'before';\n", "utf8");
    const candidate = await feature.manage({
      action: "candidate",
      title: "Restart the shared supervisor",
      kind: "procedure",
      confidence: "high",
      triggers: ["restart supervisor"],
      appliesTo: { paths: ["src/config.ts"], symbols: ["restartDeadline"] },
      evidencePaths: ["src/config.ts"],
      technique: `Use ${projectRoot} or ${projectRoot.replaceAll("\\", "/")}; api_key=${rawSecret}; home=${rawHome}.`,
      why: "It preserves process ownership.",
      evidence: "Observed in the focused workstation proof.",
      invalidatedWhen: "The supervisor ownership contract changes.",
    });
    await feature.manage({ action: "promote", cardRef: candidate.cardRef, evidence: "Verified against src/config.ts." });
    const stale = await feature.manage({
      action: "candidate",
      title: "Loaded stale verification",
      kind: "tip",
      confidence: "high",
      triggers: ["loaded stale fingerprint"],
      technique: "Exclude old verification.",
      why: "Old guidance is advisory only.",
      evidence: "Loaded stale fixture.",
      invalidatedWhen: "The age boundary changes.",
    });
    await feature.manage({ action: "promote", cardRef: stale.cardRef, evidence: "Old loaded verification.", verifiedAt: "2025-01-01T00:00:00.000Z" });
    const mismatch = await feature.manage({
      action: "candidate",
      title: "Loaded fingerprint mismatch",
      kind: "pitfall",
      confidence: "high",
      triggers: ["loaded stale fingerprint"],
      appliesTo: { paths: ["src/mismatch.ts"], symbols: [] },
      evidencePaths: ["src/mismatch.ts"],
      technique: "Exclude changed evidence.",
      why: "Changed source contradicts the promoted snapshot.",
      evidence: "Loaded mismatch fixture.",
      invalidatedWhen: "The fingerprint contract changes.",
    });
    await feature.manage({ action: "promote", cardRef: mismatch.cardRef, evidence: "Current before mutation." });
    fs.writeFileSync(path.join(projectRoot, "src", "mismatch.ts"), "export const fingerprint = 'after';\n", "utf8");
    const systemGateCard = await feature.manage({
      action: "candidate",
      title: "System gate selected",
      kind: "procedure",
      confidence: "high",
      triggers: ["system gate selected"],
      technique: "Revalidate immediately before system injection.",
      why: "A second process can invalidate selected context.",
      evidence: "Loaded system gate.",
      invalidatedWhen: "The selected card is invalidated.",
    });
    await feature.manage({ action: "promote", cardRef: systemGateCard.cardRef, evidence: "Current loaded selection." });
    const compactGateCard = await feature.manage({
      action: "candidate",
      title: "Compaction gate selected",
      kind: "procedure",
      confidence: "high",
      triggers: ["compaction gate selected"],
      technique: "Revalidate immediately before compaction context.",
      why: "Invalidated context must not survive compaction.",
      evidence: "Loaded compaction gate.",
      invalidatedWhen: "The selected card is invalidated.",
    });
    await feature.manage({ action: "promote", cardRef: compactGateCard.cardRef, evidence: "Current loaded compaction selection." });
    fs.writeFileSync(path.join(store.storeRoot, "cards", "card-1999.md"), "# malformed loaded record\n", { flag: "wx" });

    const before = gitStatus(projectRoot);
    server = await startProofServer(options.opencode, projectRoot, environment);
    const client = proofClient(server.url, projectRoot);
    const sessions: string[] = [];
    const createSession = async (title: string, parentID?: string) => {
      const created = await withTimeout(requestData<Record<string, unknown>>(client.session.create({
        directory: projectRoot,
        ...(parentID == null ? {} : { parentID }),
        title,
      }), `project-memory session ${title}`), 30_000, `Project-memory session ${title}`);
      const id = String(created.id);
      sessions.push(id);
      return id;
    };
    const promptSession = async (sessionID: string, text: string, label: string) => {
      const requestStart = provider!.requests().length;
      const result = await withTimeout(requestData<Record<string, unknown>>(client.session.prompt({
        sessionID,
        directory: projectRoot,
        model: { providerID: "proof", modelID: "proof-model" },
        parts: [{ type: "text", text }],
      }), label), 30_000, label);
      return { requests: provider!.requests().slice(requestStart), result };
    };
    const rootID = await createSession("project-memory-loaded-entry-proof");
    const relevant = await promptSession(rootID, "How should I restart supervisor safely?", "Project-memory relevant root prompt");
    const irrelevant = await promptSession(rootID, "galaxy banana", "Project-memory irrelevant root prompt");
    const curated = await promptSession(rootID, "current curated restart guidance", "Project-memory curated root prompt");
    const toolCandidate = await promptSession(rootID, "PMC_TOOL_CANDIDATE", "Project-memory candidate tool prompt");
    const toolPromote = await promptSession(rootID, "PMC_TOOL_PROMOTE", "Project-memory promote tool prompt");
    const toolRecallActive = await promptSession(rootID, "PMC_TOOL_RECALL_ACTIVE", "Project-memory active recall tool prompt");
    const toolInvalidate = await promptSession(rootID, "PMC_TOOL_INVALIDATE", "Project-memory invalidate tool prompt");
    const toolRecallInvalidated = await promptSession(rootID, "PMC_TOOL_RECALL_INVALIDATED", "Project-memory invalidated recall tool prompt");
    const toolRecallStale = await promptSession(rootID, "PMC_TOOL_RECALL_STALE", "Project-memory stale recall tool prompt");

    const childID = await createSession("project-memory-loaded-child", rootID);
    const child = await promptSession(childID, "How should I restart supervisor safely?", "Project-memory child prompt");
    const timeoutID = await createSession("project-memory-loaded-timeout");
    fs.writeFileSync(path.join(gateRoot, "root-timeout.request"), "timeout", { flag: "wx" });
    const timeout = await promptSession(timeoutID, "How should I restart supervisor safely?", "Project-memory timeout prompt");

    const systemGateID = await createSession("project-memory-loaded-system-gate");
    fs.writeFileSync(path.join(gateRoot, "system.request"), "gate", { flag: "wx" });
    const systemRequestStart = provider.requests().length;
    const systemPrompt = withTimeout(requestData<Record<string, unknown>>(client.session.prompt({
      sessionID: systemGateID,
      directory: projectRoot,
      model: { providerID: "proof", modelID: "proof-model" },
      parts: [{ type: "text", text: "system gate selected" }],
    }), "Project-memory system gate prompt"), 30_000, "Project-memory system gate prompt");
    await waitForFile(path.join(gateRoot, "system.arrived"), "Project-memory system transform");
    await feature.manage({ action: "invalidate", cardRef: systemGateCard.cardRef, reason: "Second-process loaded system invalidation." });
    fs.writeFileSync(path.join(gateRoot, "system.release"), "release", { flag: "wx" });
    await systemPrompt;
    const systemGateRequests = provider.requests().slice(systemRequestStart);

    const compactGateID = await createSession("project-memory-loaded-compaction-gate");
    await promptSession(compactGateID, "compaction gate selected", "Project-memory compaction selection prompt");
    fs.writeFileSync(path.join(gateRoot, "compact.request"), "gate", { flag: "wx" });
    const compactRequestStart = provider.requests().length;
    const compactPrompt = withTimeout(requestData(client.session.summarize({
      sessionID: compactGateID,
      directory: projectRoot,
      providerID: "proof",
      modelID: "proof-model",
    }), "Project-memory compaction"), 30_000, "Project-memory compaction");
    await waitForFile(path.join(gateRoot, "compact.arrived"), "Project-memory compaction hook");
    await feature.manage({ action: "invalidate", cardRef: compactGateCard.cardRef, reason: "Second-process loaded compaction invalidation." });
    fs.writeFileSync(path.join(gateRoot, "compact.release"), "release", { flag: "wx" });
    await compactPrompt;
    const compactGateRequests = provider.requests().slice(compactRequestStart);

    const cardsRoot = path.join(store.storeRoot, "cards");
    for (let index = 3_000; index <= 5_000; index += 1) {
      fs.writeFileSync(path.join(cardsRoot, `card-${String(index)}.md`), "", { flag: "wx" });
    }
    const overLimitID = await createSession("project-memory-loaded-over-limit");
    const overLimit = await promptSession(overLimitID, "current curated restart guidance", "Project-memory over-limit curated prompt");

    const allRequests = provider.requests();
    const firstRequest = relevant.requests[0] ?? null;
    const relevantText = requestText(firstRequest);
    const irrelevantText = requestText(irrelevant.requests.at(-1));
    const curatedText = requestText(curated.requests.at(-1));
    const childText = requestText(child.requests.at(-1));
    const timeoutText = requestText(timeout.requests.at(-1));
    const systemGateText = requestText(systemGateRequests.at(-1));
    const compactGateText = requestText(compactGateRequests.at(-1));
    const overLimitText = requestText(overLimit.requests.at(-1));
    const toolCandidateText = latestToolResultText(toolCandidate.requests);
    const toolPromoteText = latestToolResultText(toolPromote.requests);
    const toolRecallActiveText = latestToolResultText(toolRecallActive.requests);
    const toolInvalidateText = latestToolResultText(toolInvalidate.requests);
    const toolRecallInvalidatedText = latestToolResultText(toolRecallInvalidated.requests);
    const toolRecallStaleText = latestToolResultText(toolRecallStale.requests);
    const names = toolNames(firstRequest);
    const capsuleMarker = "Current user instructions, source, specifications, and runtime evidence take precedence";
    const titleMarker = "Restart the shared supervisor";
    const capsuleOccurrences = relevantText.split(capsuleMarker).length - 1;
    const persisted = [
      ...fs.readdirSync(cardsRoot).map((name) => fs.readFileSync(path.join(cardsRoot, name), "utf8")),
      ...fs.readdirSync(path.join(store.storeRoot, "events")).map((name) => fs.readFileSync(path.join(store.storeRoot, "events", name), "utf8")),
    ].join("\n");
    const captureTrace = traceRows(traceFile);
    const requestProjection = {
      count: allRequests.length,
      maximumBytes: Math.max(...allRequests.map((request) => Buffer.byteLength(requestText(request), "utf8"))),
      sha256: allRequests.map((request) => sha256(requestText(redactValue(request, fixtureRoot)))),
    };
    writeNew(path.join(options.evidenceDir, "capture.json"), {
      candidate: { sourceIdentity: sourceIdentity() },
      environment: {
        externalNetworkAllowed: false,
        node: process.version,
        opencode: version.stdout.trim(),
        platform: process.platform,
        pluginRuntime: pluginRuntimeIdentity(options.pluginRuntime),
        projectMemoryEnabled: true,
        ripgrepSha256: sha256(fs.readFileSync(options.ripgrep)),
      },
      observations: {
        capsuleOccurrences,
        egressTrapCount: provider.egressTrapCount(),
        gitStatusBeforeCleanup: before,
        projectRef: feature.projectRef,
        providerRequests: requestProjection,
        toolNames: names,
        tracePhases: tracePhases(captureTrace),
      },
      pluginTrace: redactValue(captureTrace, fixtureRoot),
      preflights,
      providerRequests: redactValue(allRequests, fixtureRoot),
      schemaVersion: 1,
    });

    for (const sessionID of [...sessions].reverse()) {
      await withTimeout(requestData(client.session.delete({ sessionID, directory: projectRoot }), `delete ${sessionID}`), 15_000, "Project-memory session cleanup");
    }
    const terminal = await stopProofServer(server);
    const command = {
      status: terminal.status,
      signal: terminal.signal,
      stderr: Buffer.concat(server.stderr).toString("utf8"),
      stdout: Buffer.concat(server.stdout).toString("utf8"),
      timedOut: false,
    };
    server = null;
    const after = gitStatus(projectRoot);
    const trace = traceRows(traceFile);
    const phases = tracePhases(trace);
    const orderedPhases = ["factory-enter", "factory-exit", "message-enter", "message-exit", "system-enter", "system-exit"];
    const observedOrder = orderedPhases.every((phase, index) => phases.indexOf(phase) >= 0 && (index === 0 || phases.indexOf(phase) > phases.indexOf(orderedPhases[index - 1]!)));
    const checks = {
      capsuleAppearsExactlyOnce: capsuleOccurrences === 1,
      cleanProjectStatus: before === after,
      compactionRevalidation: compactGateRequests.length === 1 && !compactGateText.includes("Compaction gate selected") && phases.includes("compact-gate-released"),
      curatedSerenaObserved: curatedText.includes("Curated Restart"),
      explicitActiveRecall: toolRecallActive.requests.length === 2 && toolRecallActiveText.includes('"status": "active"') && toolRecallActiveText.includes('"exactPath": true') && toolRecallActiveText.includes('"exactSymbol": true'),
      explicitInvalidatedRecall: toolRecallInvalidated.requests.length === 2 && toolRecallInvalidatedText.includes('"exclusionReason": "invalidated"'),
      explicitStaleAndMismatch: toolRecallStale.requests.length === 2 && toolRecallStaleText.includes('"exclusionReason": "stale-verification"') && toolRecallStaleText.includes('"exclusionReason": "fingerprint-mismatch"'),
      hookTimeoutFailsClosed: timeout.requests.length === 1 && !timeoutText.includes(titleMarker) && phases.includes("root-timeout-enter"),
      irrelevantCardOmitted: irrelevant.requests.length === 1 && !irrelevantText.includes(titleMarker),
      loadedCandidateCreated: toolCandidate.requests.length === 2 && toolCandidateText.includes('"status": "candidate"'),
      loadedCandidateInvalidated: toolInvalidate.requests.length === 2 && toolInvalidateText.includes('"status": "invalidated"'),
      loadedCandidatePromoted: toolPromote.requests.length === 2 && toolPromoteText.includes('"status": "active"'),
      malformedWarningVisible: toolRecallActiveText.includes("malformed:malformed-record:record_"),
      messageBeforeSystemObserved: observedOrder,
      noExternalEgress: provider.egressTrapCount() === 0,
      overLimitFailsClosedWithCurated: overLimit.requests.length === 1 && overLimitText.includes("local:corpus-envelope") && overLimitText.includes("Curated Restart") && !overLimitText.includes(titleMarker),
      privacyRedacted: relevantText.includes("<project-root>") && !relevantText.includes(rawSecret) && !relevantText.toLowerCase().includes(rawHome.toLowerCase()) && !persisted.toLowerCase().includes(projectRoot.toLowerCase()) && !persisted.includes(rawSecret) && !persisted.toLowerCase().includes(rawHome.toLowerCase()),
      projectMemoryToolsAdvertised: names.includes("project_memory_manage") && names.includes("project_memory_recall"),
      requestsBounded: allRequests.length >= 20 && allRequests.every((request) => Buffer.byteLength(requestText(request), "utf8") <= 512 * 1024),
      rootSelectedProcedureObserved: relevant.requests.length === 1 && relevantText.includes(titleMarker),
      serverTerminallyStopped: terminal.status != null || terminal.signal != null,
      sessionDeliveryToolPreserved: names.includes("session_delivery_context"),
      subagentExcluded: child.requests.length === 1 && !childText.includes(titleMarker),
      systemRevalidation: systemGateRequests.length === 1 && !systemGateText.includes("System gate selected") && phases.includes("system-gate-released"),
    };
    await provider.close();
    provider = null;
    fs.rmSync(fixtureRoot, { force: true, recursive: true });
    checks.serverTerminallyStopped = checks.serverTerminallyStopped && !fs.existsSync(fixtureRoot);
    const raw = {
      candidate: { sourceIdentity: sourceIdentity() },
      command: {
        argv: ["<opencode>", "serve", "--hostname", "127.0.0.1", "--port", "<ephemeral>", "--print-logs", "--log-level", "INFO"],
        controlledStop: true,
        status: command.status,
        signal: command.signal,
        stderr: redact(command.stderr, fixtureRoot),
        stdout: redact(command.stdout, fixtureRoot),
        timedOut: command.timedOut,
      },
      environment: {
        externalNetworkAllowed: false,
        node: process.version,
        opencode: version.stdout.trim(),
        platform: process.platform,
        pluginRuntime: pluginRuntimeIdentity(options.pluginRuntime),
        projectMemoryEnabled: true,
        ripgrepSha256: sha256(fs.readFileSync(options.ripgrep)),
      },
      observations: {
        capsuleOccurrences,
        egressTrapCount: 0,
        gitStatusAfter: after,
        gitStatusBefore: before,
        projectRef: feature.projectRef,
        providerRequests: requestProjection,
        toolNames: names,
        toolResultHashes: {
          candidate: sha256(toolCandidateText),
          invalidate: sha256(toolInvalidateText),
          promote: sha256(toolPromoteText),
          recallActive: sha256(toolRecallActiveText),
          recallInvalidated: sha256(toolRecallInvalidatedText),
          recallStale: sha256(toolRecallStaleText),
        },
        tracePhases: phases,
      },
      pluginTrace: redactValue(trace, fixtureRoot),
      preflights,
      providerRequests: redactValue(allRequests, fixtureRoot),
      schemaVersion: 1,
    };
    writeNew(path.join(options.evidenceDir, "raw.json"), raw);
    rawWritten = true;
    const failed = Object.entries(checks).filter(([, passed]) => !passed).map(([name]) => name);
    writeNew(path.join(options.evidenceDir, "evaluation.json"), {
      checks,
      failed,
      maximumSupportedClaim: failed.length === 0
        ? "Pinned OpenCode loaded the current copied session-env plugin and completed the reviewed PMC-001 tool, root, selection, compaction, curated, failure, privacy, and side-effect scenarios against the loopback provider."
        : "Loaded-entry project-memory proof did not reach the complete reviewed PMC-001 terminal oracle.",
      status: failed.length === 0 ? "complete" : "failed",
    });
    console.log(stableJson({ evidenceDir: path.relative(sourceRoot, options.evidenceDir).replaceAll("\\", "/"), failed, status: failed.length === 0 ? "complete" : "failed" }).trim());
    if (failed.length > 0) process.exitCode = 1;
  } catch (error) {
    if (!rawWritten) {
      writeNew(path.join(options.evidenceDir, "raw.json"), {
        error: redact(error instanceof Error ? `${error.message}\n${error.stack ?? ""}` : String(error), fixtureRoot),
        pluginTrace: fs.existsSync(traceFile) ? redact(fs.readFileSync(traceFile, "utf8"), fixtureRoot) : "",
        preflights,
        schemaVersion: 1,
        sourceIdentity: sourceIdentity(),
      });
    }
    writeNew(path.join(options.evidenceDir, "evaluation.json"), {
      maximumSupportedClaim: "Loaded-entry project-memory proof did not reach its exact-case terminal oracle.",
      status: "failed",
    });
    throw error;
  } finally {
    if (server != null) await stopProofServer(server);
    if (provider != null) await provider.close();
    fs.rmSync(fixtureRoot, { force: true, recursive: true });
  }
}

const options = parseArgs(process.argv.slice(2));
if (options == null) {
  process.stdout.write(HELP);
} else {
  if (options.mode === "boundary") await runBoundary(options);
  else if (options.mode === "corpus") await runCorpus(options);
  else await main(options);
}
