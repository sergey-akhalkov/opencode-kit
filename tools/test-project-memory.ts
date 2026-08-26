#!/usr/bin/env node
import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createProjectMemoryFeature, createProjectMemoryPluginHooks } from "../global/plugin/project-memory/index.ts";
import {
  candidateMarkdown,
  invalidationMarkdown,
  parseCandidateMarkdown,
  parseLifecycleMarkdown,
  promotionMarkdown,
} from "../global/plugin/project-memory/records.ts";
import {
  ProjectMemoryError,
  readProjectMemoryPopulation,
  resolveProjectMemoryStore,
  type ProjectMemoryCandidate,
  type ProjectMemoryInvalidation,
  type ProjectMemoryManageResult,
  type ProjectMemoryPromotion,
} from "../global/plugin/project-memory/store.ts";

type TestCase = {
  name: string;
  run: () => Promise<void> | void;
};

type WorkerSpec = {
  action: "candidate" | "promote" | "invalidate";
  barrierPath: string;
  cardRef?: string;
  dataRoot: string;
  projectRoot: string;
};

type WorkerResult = {
  ok: boolean;
  code?: string;
  result?: ProjectMemoryManageResult;
};

function gitStatus(projectRoot: string): string {
  const result = spawnSync("git", ["status", "--porcelain"], { cwd: projectRoot, encoding: "utf8" });
  if (result.status !== 0) throw new Error(`git status failed: ${result.stderr}`);
  return result.stdout;
}

function initializeProject(projectRoot: string): void {
  const result = spawnSync("git", ["init", "--quiet"], { cwd: projectRoot, encoding: "utf8" });
  if (result.status !== 0) throw new Error(`git init failed: ${result.stderr}`);
  fs.mkdirSync(path.join(projectRoot, "src"));
  fs.writeFileSync(path.join(projectRoot, "src", "config.ts"), "export const restartDeadline = 120_000;\n");
}

function workerAction(spec: WorkerSpec): Record<string, unknown> {
  if (spec.action === "candidate") {
    return {
      action: "candidate",
      title: "Concurrent final-slot candidate",
      kind: "procedure",
      confidence: "high",
      triggers: ["concurrent final slot"],
      appliesTo: { paths: ["src/config.ts"], symbols: ["restartDeadline"] },
      evidencePaths: ["src/config.ts"],
      technique: "Use exclusive fixed-slot creation.",
      why: "Concurrent writers must not overwrite one another.",
      evidence: "Observed by the provider-free process race.",
      invalidatedWhen: "The fixed-slot storage contract changes.",
    };
  }
  if (spec.action === "promote") {
    return {
      action: "promote",
      cardRef: spec.cardRef,
      evidence: "Concurrent promotion evidence.",
      verifiedAt: "2026-08-25T18:00:00.000Z",
    };
  }
  return {
    action: "invalidate",
    cardRef: spec.cardRef,
    reason: "Concurrent invalidation evidence.",
  };
}

async function executeWorker(spec: WorkerSpec): Promise<void> {
  process.stdout.write("READY\n");
  while (!fs.existsSync(spec.barrierPath)) await new Promise((resolve) => setTimeout(resolve, 5));
  try {
    const feature = createProjectMemoryFeature({
      worktree: spec.projectRoot,
      environment: { OPENCODE_PROJECT_MEMORY: "1", OPENCODE_DATA_DIR: spec.dataRoot },
    });
    assert(feature != null);
    const result = await feature.manage(workerAction(spec) as never, new Date("2026-08-25T18:00:00.000Z"));
    console.log(JSON.stringify({ ok: true, result } satisfies WorkerResult));
  } catch (error) {
    console.log(JSON.stringify({
      ok: false,
      code: error instanceof ProjectMemoryError ? error.code : "worker-failure",
    } satisfies WorkerResult));
  }
}

function startWorker(spec: WorkerSpec): { ready: Promise<void>; done: Promise<WorkerResult> } {
  const child = spawn(process.execPath, [fileURLToPath(import.meta.url)], {
    env: { ...process.env, PROJECT_MEMORY_TEST_WORKER: JSON.stringify(spec) },
    stdio: ["ignore", "pipe", "pipe"],
  });
  let stdout = "";
  let stderr = "";
  let readyObserved = false;
  let resolveReady!: () => void;
  let rejectReady!: (error: Error) => void;
  const ready = new Promise<void>((resolve, reject) => {
    resolveReady = resolve;
    rejectReady = reject;
  });
  child.stdout.setEncoding("utf8");
  child.stderr.setEncoding("utf8");
  child.stdout.on("data", (chunk: string) => {
    stdout += chunk;
    if (!readyObserved && stdout.includes("READY\n")) {
      readyObserved = true;
      resolveReady();
    }
  });
  child.stderr.on("data", (chunk: string) => {
    stderr += chunk;
  });
  const done = new Promise<WorkerResult>((resolve, reject) => {
    child.once("error", reject);
    child.once("close", (status) => {
      if (!readyObserved) rejectReady(new Error(`Project-memory worker exited before ready: ${stderr || stdout}`));
      if (status !== 0) {
        reject(new Error(`Project-memory worker exited ${status}: ${stderr || stdout}`));
        return;
      }
      const line = stdout.trim().split(/\r?\n/).findLast((value) => value.startsWith("{"));
      if (line == null) {
        reject(new Error(`Project-memory worker returned no result: ${stderr || stdout}`));
        return;
      }
      try {
        resolve(JSON.parse(line) as WorkerResult);
      } catch (error) {
        reject(new Error(`Project-memory worker returned invalid JSON: ${line}`, { cause: error }));
      }
    });
  });
  return { ready, done };
}

async function raceWorkers(specs: [WorkerSpec, WorkerSpec]): Promise<[WorkerResult, WorkerResult]> {
  const workers = specs.map(startWorker) as ReturnType<typeof startWorker>[];
  await Promise.all(workers.map((worker) => worker.ready));
  fs.writeFileSync(specs[0].barrierPath, "go", { flag: "wx" });
  return Promise.all(workers.map((worker) => worker.done)) as Promise<[WorkerResult, WorkerResult]>;
}

function fillEmptySlots(directory: string, prefix: "card" | "event", width: number, count: number): void {
  fs.mkdirSync(directory, { recursive: true });
  for (let index = 0; index < count; index += 1) {
    fs.writeFileSync(path.join(directory, `${prefix}-${String(index).padStart(width, "0")}.md`), "", { flag: "wx" });
  }
}

function hasProjectMemoryCode(code: string): (error: unknown) => boolean {
  return (error) => error instanceof ProjectMemoryError && error.code === code;
}

const tests: TestCase[] = [
  {
    name: "disabled plugin input registers no project-memory surface",
    run: () => {
      const hooks = createProjectMemoryPluginHooks({}, { OPENCODE_PROJECT_MEMORY: "0" });
      assert.deepEqual(hooks, {});
    },
  },
  {
    name: "disabled mode performs no project-memory IO",
    run: () => {
      const fixtureRoot = fs.mkdtempSync(path.join(os.tmpdir(), "project-memory-disabled-"));
      const projectRoot = path.join(fixtureRoot, "project");
      const dataRoot = path.join(fixtureRoot, "data");
      fs.mkdirSync(projectRoot);
      try {
        const environment = { OPENCODE_PROJECT_MEMORY: "0", OPENCODE_DATA_DIR: dataRoot };
        const feature = createProjectMemoryFeature({ worktree: projectRoot, environment });
        environment.OPENCODE_PROJECT_MEMORY = "1";
        assert.equal(feature, null);
        assert.equal(fs.existsSync(path.join(dataRoot, "project-memory")), false);
      } finally {
        fs.rmSync(fixtureRoot, { recursive: true, force: true });
      }
    },
  },
  {
    name: "candidate promote and recall stays bounded redacted and outside the worktree",
    run: async () => {
      const fixtureRoot = fs.mkdtempSync(path.join(os.tmpdir(), "project-memory-happy-"));
      const projectRoot = path.join(fixtureRoot, "project");
      const dataRoot = path.join(fixtureRoot, "data");
      fs.mkdirSync(projectRoot);
      initializeProject(projectRoot);
      const statusBefore = gitStatus(projectRoot);
      const environment = { OPENCODE_PROJECT_MEMORY: "1", OPENCODE_DATA_DIR: dataRoot };
      const previousFetch = globalThis.fetch;
      let networkCalls = 0;
      globalThis.fetch = (async () => {
        networkCalls += 1;
        throw new Error("External egress is forbidden in project-memory tests.");
      }) as typeof fetch;
      try {
        const feature = createProjectMemoryFeature({ worktree: projectRoot, environment });
        assert(feature != null);
        environment.OPENCODE_PROJECT_MEMORY = "0";
         const now = new Date("2026-08-25T18:00:00.000Z");
         const rawSecret = "sk-proj-abcdefghijklmnopqrstuvwxyz";
         const rawHome = os.homedir();
        const candidate = await feature.manage({
          action: "candidate",
          title: "Restart the shared supervisor",
          kind: "procedure",
          confidence: "high",
          triggers: ["restart supervisor"],
          appliesTo: {
            paths: ["src/config.ts"],
            symbols: ["restartDeadline"],
          },
          evidencePaths: ["src/config.ts"],
           technique: `Use the validated restart path from ${projectRoot}; api_key=${rawSecret}; home=${rawHome}`,
          why: "It preserves validated process ownership.",
          evidence: "Observed in the focused workstation proof.",
          invalidatedWhen: "The supervisor ownership contract changes.",
        }, now);
        assert.equal(candidate.status, "candidate");
        const promotion = await feature.manage({
          action: "promote",
          cardRef: candidate.cardRef,
          evidence: `Verified against ${path.join(projectRoot, "src", "config.ts")}`,
          verifiedAt: now.toISOString(),
        }, now);
        assert.equal(promotion.status, "active");
        const recalled = await feature.recall({
          query: "How do I restart supervisor safely?",
          path: "src/config.ts",
          symbol: "restartDeadline",
        }, { automatic: true, now });
        assert.equal(recalled.results.length, 1);
        assert.equal(recalled.results[0]?.ref, candidate.cardRef);
        assert.equal(recalled.results[0]?.scoreEvidence.exactPath, true);
        assert.equal(Buffer.byteLength(recalled.capsule, "utf8") <= 8 * 1024, true);
        assert.match(recalled.capsule, /Current user instructions, source, specifications, and runtime evidence take precedence/);
        const storeRoot = path.join(dataRoot, "project-memory", "v1", feature.projectRef);
        const persisted = [
          ...fs.readdirSync(path.join(storeRoot, "cards")).map((name) => fs.readFileSync(path.join(storeRoot, "cards", name), "utf8")),
          ...fs.readdirSync(path.join(storeRoot, "events")).map((name) => fs.readFileSync(path.join(storeRoot, "events", name), "utf8")),
        ].join("\n");
        assert.equal(persisted.includes(projectRoot), false);
        assert.equal(persisted.includes(projectRoot.replaceAll("\\", "/")), false);
         assert.equal(persisted.includes(rawSecret), false);
         assert.equal(persisted.toLowerCase().includes(rawHome.toLowerCase()), false);
        assert.match(persisted, /<project-root>/);
        assert.match(persisted, /<redacted>/);
        assert.equal(path.relative(projectRoot, storeRoot).startsWith(".."), true);
        assert.equal(gitStatus(projectRoot), statusBefore);
        assert.equal(networkCalls, 0);
      } finally {
        globalThis.fetch = previousFetch;
        fs.rmSync(fixtureRoot, { recursive: true, force: true });
      }
    },
  },
  {
    name: "lifecycle actions are append-only idempotent and terminal",
    run: async () => {
      const fixtureRoot = fs.mkdtempSync(path.join(os.tmpdir(), "project-memory-lifecycle-"));
      const projectRoot = path.join(fixtureRoot, "project");
      const dataRoot = path.join(fixtureRoot, "data");
      fs.mkdirSync(projectRoot);
      initializeProject(projectRoot);
      try {
        const feature = createProjectMemoryFeature({
          worktree: projectRoot,
          environment: { OPENCODE_PROJECT_MEMORY: "1", OPENCODE_DATA_DIR: dataRoot },
        });
        assert(feature != null);
        const candidate = await feature.manage({
          action: "candidate",
          title: "Keep lifecycle append-only",
          kind: "procedure",
          confidence: "high",
          triggers: ["append only lifecycle"],
          appliesTo: { paths: ["src/config.ts"], symbols: ["restartDeadline"] },
          evidencePaths: ["src/config.ts"],
          technique: "Append immutable lifecycle events.",
          why: "Folded state must be deterministic.",
          evidence: "Observed in the lifecycle test.",
          invalidatedWhen: "The append-only contract changes.",
        }, new Date("2026-08-25T18:00:00.000Z"));
        const firstPromotion = await feature.manage({
          action: "promote",
          cardRef: candidate.cardRef,
          evidence: "Verified once.",
          verifiedAt: "2026-08-25T18:00:00.000Z",
        }, new Date("2026-08-25T18:00:01.000Z"));
        const duplicatePromotion = await feature.manage({
          action: "promote",
          cardRef: candidate.cardRef,
          evidence: "Duplicate promotion is idempotent.",
          verifiedAt: "2026-08-25T18:00:02.000Z",
        }, new Date("2026-08-25T18:00:02.000Z"));
        assert.equal(duplicatePromotion.eventRef, firstPromotion.eventRef);
        const store = resolveProjectMemoryStore({
          worktree: projectRoot,
          environment: { OPENCODE_DATA_DIR: dataRoot },
        });
        assert(store != null);
        const eventsRoot = path.join(store.storeRoot, "events");
        assert.equal(fs.readdirSync(eventsRoot).length, 1);

        const firstInvalidation = await feature.manage({
          action: "invalidate",
          cardRef: candidate.cardRef,
          reason: "The owning behavior changed.",
        }, new Date("2026-08-25T18:00:03.000Z"));
        const duplicateInvalidation = await feature.manage({
          action: "invalidate",
          cardRef: candidate.cardRef,
          reason: "Duplicate invalidation is idempotent.",
        }, new Date("2026-08-25T18:00:04.000Z"));
        assert.equal(duplicateInvalidation.eventRef, firstInvalidation.eventRef);
        assert.equal(fs.readdirSync(eventsRoot).length, 2);
        await assert.rejects(
          feature.manage({
            action: "promote",
            cardRef: candidate.cardRef,
            evidence: "A terminal invalidation cannot be reversed.",
          }),
          (error: unknown) => error instanceof ProjectMemoryError && error.code === "invalid-transition",
        );
        const population = await readProjectMemoryPopulation(store);
        assert.equal(population.cards[0]?.status, "invalidated");
        assert.equal(population.cards[0]?.invalidationReason, "The owning behavior changed.");
      } finally {
        fs.rmSync(fixtureRoot, { recursive: true, force: true });
      }
    },
  },
  {
    name: "schema envelope freshness and evidence exclusions fail closed visibly",
    run: async () => {
      const fixtureRoot = fs.mkdtempSync(path.join(os.tmpdir(), "project-memory-schema-"));
      const projectRoot = path.join(fixtureRoot, "project");
      const dataRoot = path.join(fixtureRoot, "data");
      fs.mkdirSync(projectRoot);
      initializeProject(projectRoot);
      const environment = { OPENCODE_PROJECT_MEMORY: "1", OPENCODE_DATA_DIR: dataRoot };
      const feature = createProjectMemoryFeature({ worktree: projectRoot, environment });
      assert(feature != null);
      const store = resolveProjectMemoryStore({ worktree: projectRoot, environment });
      assert(store != null);
      const verifiedAt = new Date("2026-01-01T00:00:00.000Z");
      const candidateInput = {
        action: "candidate" as const,
        title: "Verify repository evidence",
        kind: "procedure" as const,
        confidence: "high" as const,
        triggers: ["verify repository evidence"],
        appliesTo: { paths: ["src/config.ts"], symbols: ["restartDeadline"] },
        evidencePaths: ["src/config.ts"],
        technique: "Hash current repository evidence.",
        why: "Stale guidance must not be injected.",
        evidence: "Schema and evidence fixture.",
        invalidatedWhen: "The evidence file changes.",
      };
      try {
        for (const selector of ["../outside.md", "C:\\outside.md", "\\\\server\\share\\outside.md"]) {
          await assert.rejects(feature.manage({
            ...candidateInput,
            appliesTo: { paths: [selector], symbols: [] },
          }), (error) => error instanceof ProjectMemoryError
            && error.code === "unsafe-selector"
            && !error.message.includes(selector));
        }
        const candidate = await feature.manage(candidateInput, verifiedAt);
        const candidateFile = path.join(store.storeRoot, "cards", "card-0000.md");
        const candidateText = fs.readFileSync(candidateFile, "utf8");
        assert.throws(
          () => parseCandidateMarkdown(candidateText.replace('"schema_version": 1,', '"schema_version": 1,\n  "unexpected": true,')),
          hasProjectMemoryCode("malformed-record"),
        );
        assert.throws(
          () => parseCandidateMarkdown(candidateText.replace('"schema_version": 1', '"schema_version": 2')),
          hasProjectMemoryCode("unsupported-schema"),
        );
        const pending = await feature.recall({ query: "verify repository evidence", statuses: ["candidate"] }, { now: verifiedAt });
        assert.equal(pending.results[0]?.exclusionReason, "candidate");
        assert.equal((await feature.recall({ query: "verify repository evidence" }, { automatic: true, now: verifiedAt })).results.length, 0);

        await feature.manage({ action: "promote", cardRef: candidate.cardRef, evidence: "Verified.", verifiedAt: verifiedAt.toISOString() }, verifiedAt);
        const promotion = parseLifecycleMarkdown(fs.readFileSync(path.join(store.storeRoot, "events", "event-000000.md"), "utf8"));
        assert.equal(promotion.event, "promote");
        assert.equal(promotion.fingerprints[0]?.sha256, crypto.createHash("sha256").update(fs.readFileSync(path.join(projectRoot, "src", "config.ts"))).digest("hex"));
        const exactFreshness = new Date(verifiedAt.getTime() + 180 * 24 * 60 * 60 * 1_000);
        assert.equal((await feature.recall({ query: "verify repository evidence" }, { automatic: true, now: exactFreshness })).results.length, 1);
        const staleNow = new Date(exactFreshness.getTime() + 1);
        assert.equal((await feature.recall({ query: "verify repository evidence" }, { automatic: true, now: staleNow })).results.length, 0);
        assert.equal((await feature.recall({ query: "verify repository evidence" }, { now: staleNow })).results[0]?.exclusionReason, "stale-verification");

        fs.writeFileSync(path.join(projectRoot, "src", "config.ts"), "export const restartDeadline = 60_000;\n");
        assert.equal((await feature.recall({ query: "verify repository evidence" }, { now: verifiedAt })).results[0]?.exclusionReason, "fingerprint-mismatch");
        assert.equal((await feature.recall({ query: "verify repository evidence" }, { automatic: true, now: verifiedAt })).results.length, 0);
        fs.rmSync(path.join(projectRoot, "src", "config.ts"));
        assert.equal((await feature.recall({ query: "verify repository evidence" }, { now: verifiedAt })).results[0]?.exclusionReason, "missing-evidence");

        const eventsBeforeOversize = fs.readdirSync(path.join(store.storeRoot, "events")).length;
        const second = await feature.manage({ ...candidateInput, evidencePaths: [], title: "Lifecycle size limit" }, verifiedAt);
        await assert.rejects(feature.manage({ action: "promote", cardRef: second.cardRef, evidence: "x".repeat(5_000) }, verifiedAt), hasProjectMemoryCode("record-too-large"));
        assert.equal(fs.readdirSync(path.join(store.storeRoot, "events")).length, eventsBeforeOversize);
        const cardsBeforeOversize = fs.readdirSync(path.join(store.storeRoot, "cards")).length;
        await assert.rejects(feature.manage({ ...candidateInput, evidencePaths: [], technique: "x".repeat(17 * 1024) }, verifiedAt), hasProjectMemoryCode("record-too-large"));
        assert.equal(fs.readdirSync(path.join(store.storeRoot, "cards")).length, cardsBeforeOversize);

        fs.writeFileSync(path.join(store.storeRoot, "cards", "card-0002.md"), "# partial");
        fs.writeFileSync(path.join(store.storeRoot, "cards", "card-0003.md"), candidateText.replace('"schema_version": 1', '"schema_version": 2'));
        const malformed = await feature.recall({ query: "verify repository evidence", statuses: ["candidate", "active"] }, { now: verifiedAt });
        assert.equal(malformed.warnings.some((warning) => /^malformed:[a-z-]+:record_/.test(warning)), true);
        assert.equal(malformed.warnings.some((warning) => warning.includes(":unsupported-schema:")), true);
        assert.equal((await feature.recall({ query: "verify repository evidence" }, { automatic: true, now: verifiedAt })).results.length, 0);

        const overDataRoot = path.join(fixtureRoot, "over-data");
        const overEnvironment = { OPENCODE_PROJECT_MEMORY: "1", OPENCODE_DATA_DIR: overDataRoot };
        const overFeature = createProjectMemoryFeature({ worktree: projectRoot, environment: overEnvironment });
        const overStore = resolveProjectMemoryStore({ worktree: projectRoot, environment: overEnvironment });
        assert(overFeature != null && overStore != null);
        fillEmptySlots(path.join(overStore.storeRoot, "events"), "event", 6, 8_001);
        await assert.rejects(overFeature.manage({ ...candidateInput, evidencePaths: [] }, verifiedAt), hasProjectMemoryCode("corpus-envelope"));
        const overRecall = await overFeature.recall({ query: "anything" });
        assert.deepEqual(overRecall.results, []);
        assert.deepEqual(overRecall.warnings, ["local:corpus-envelope"]);
        await assert.rejects(overFeature.manage({ action: "promote", cardRef: `card_${"a".repeat(32)}`, evidence: "none" }, verifiedAt), hasProjectMemoryCode("corpus-envelope"));
        assert.equal(fs.existsSync(path.join(overStore.storeRoot, "cards")), false);

        const unreadEnvironment = { OPENCODE_PROJECT_MEMORY: "1", OPENCODE_DATA_DIR: path.join(fixtureRoot, "unread-data") };
        const unreadFeature = createProjectMemoryFeature({ worktree: projectRoot, environment: unreadEnvironment });
        const unreadStore = resolveProjectMemoryStore({ worktree: projectRoot, environment: unreadEnvironment });
        assert(unreadFeature != null && unreadStore != null);
        fs.mkdirSync(unreadStore.storeRoot, { recursive: true });
        fs.writeFileSync(path.join(unreadStore.storeRoot, "cards"), "not a directory");
        assert.equal((await unreadFeature.recall({ query: "anything" })).warnings.includes("local:store-read"), true);
      } finally {
        fs.rmSync(fixtureRoot, { recursive: true, force: true });
      }
    },
  },
  {
    name: "curated Serena recall is bounded redacted read-only and source-independent",
    run: async () => {
      const fixtureRoot = fs.mkdtempSync(path.join(os.tmpdir(), "project-memory-serena-"));
      const projectRoot = path.join(fixtureRoot, "project");
      const dataRoot = path.join(fixtureRoot, "data");
      const memoriesRoot = path.join(projectRoot, ".serena", "memories");
      const outsideRoot = path.join(fixtureRoot, "outside");
      fs.mkdirSync(memoriesRoot, { recursive: true });
      fs.mkdirSync(outsideRoot);
      initializeProject(projectRoot);
      const rawSecret = "sk-proj-abcdefghijklmnopqrstuvwxyz";
      const environment = { OPENCODE_PROJECT_MEMORY: "1", OPENCODE_DATA_DIR: dataRoot };
      const feature = createProjectMemoryFeature({ worktree: projectRoot, environment });
      const store = resolveProjectMemoryStore({ worktree: projectRoot, environment });
      assert(feature != null && store != null);
      try {
        fs.writeFileSync(path.join(memoriesRoot, "core.md"), `# Core\n${projectRoot} api_key=${rawSecret}\n${"x".repeat(3_000)}END-OF-CORE`);
        fs.writeFileSync(path.join(memoriesRoot, "restart.md"), `# Restart Supervisor\nUse current curated restart guidance from ${projectRoot}; token=${rawSecret}.\n`);
        fillEmptySlots(path.join(store.storeRoot, "events"), "event", 6, 8_001);
        const statusBefore = gitStatus(projectRoot);
        const curatedBefore = fs.readFileSync(path.join(memoriesRoot, "restart.md"), "utf8");
        const recalled = await feature.recall({ query: "current restart supervisor guidance" }, { automatic: true });
        assert.equal(recalled.coreIncluded, true);
        assert.equal(recalled.results[0]?.source, "serena");
        assert.equal(recalled.warnings.includes("local:corpus-envelope"), true);
        assert.equal(Buffer.byteLength(recalled.capsule, "utf8") <= 8 * 1024, true);
        assert.equal(recalled.capsule.includes(projectRoot), false);
        assert.equal(recalled.capsule.includes(projectRoot.replaceAll("\\", "/")), false);
        assert.equal(recalled.capsule.includes(rawSecret), false);
        assert.equal(recalled.capsule.includes("END-OF-CORE"), false);
        assert.match(recalled.capsule, /<project-root>/);
        assert.match(recalled.capsule, /<redacted>/);
        assert.equal(fs.readFileSync(path.join(memoriesRoot, "restart.md"), "utf8"), curatedBefore);
        assert.equal(gitStatus(projectRoot), statusBefore);
        fs.writeFileSync(path.join(memoriesRoot, "large-valid.md"), `# Large Valid Memory\nlarge valid memory\n${"z".repeat(20_000)}`);
        const explicitLarge = await feature.recall({ query: "large valid memory" });
        assert.equal(Buffer.byteLength(`${JSON.stringify(explicitLarge, null, 2)}\n`, "utf8") <= 16 * 1024, true);
        assert.equal(explicitLarge.truncated, true);
        assert.equal((await feature.recall({ query: "large valid memory" }, { automatic: true })).results.length, 1);

        for (let index = 0; index < 99; index += 1) fs.writeFileSync(path.join(memoriesRoot, `extra-${index}.md`), "# Extra\ntext\n");
        const fileOverLimit = await feature.recall({ query: "restart supervisor" });
        assert.equal(fileOverLimit.results.length, 0);
        assert.equal(fileOverLimit.warnings.includes("serena:over-limit"), true);

        fs.rmSync(memoriesRoot, { recursive: true, force: true });
        fs.mkdirSync(memoriesRoot, { recursive: true });
        fs.writeFileSync(path.join(memoriesRoot, "large.md"), "x".repeat(512 * 1024 + 1));
        assert.equal((await feature.recall({ query: "anything" })).warnings.includes("serena:over-limit"), true);

        fs.rmSync(memoriesRoot, { recursive: true, force: true });
        fs.mkdirSync(memoriesRoot, { recursive: true });
        fs.writeFileSync(path.join(outsideRoot, "escape.md"), "# Escape\nunsafe\n");
        fs.symlinkSync(outsideRoot, path.join(memoriesRoot, "escape"), "junction");
        const localFeature = createProjectMemoryFeature({ worktree: projectRoot, environment: { OPENCODE_PROJECT_MEMORY: "1", OPENCODE_DATA_DIR: path.join(fixtureRoot, "local-data") } });
        assert(localFeature != null);
        const localCard = await localFeature.manage(workerAction({ action: "candidate", barrierPath: "unused", dataRoot, projectRoot }) as never);
        await localFeature.manage({ action: "promote", cardRef: localCard.cardRef, evidence: "Current local evidence." });
        const unsafe = await localFeature.recall({ query: "concurrent final slot" }, { automatic: true });
        assert.equal(unsafe.results[0]?.source, "local");
        assert.equal(unsafe.warnings.includes("serena:unsafe-source"), true);
      } finally {
        fs.rmSync(fixtureRoot, { recursive: true, force: true });
      }
    },
  },
  {
    name: "every lifecycle fold permutation keeps invalidation terminal and partial files quarantined",
    run: async () => {
      const fixtureRoot = fs.mkdtempSync(path.join(os.tmpdir(), "project-memory-fold-"));
      const candidate: ProjectMemoryCandidate = {
        schemaVersion: 1,
        event: "candidate",
        eventRef: `event_${"1".repeat(32)}`,
        cardRef: `card_${"1".repeat(32)}`,
        title: "Terminal invalidation",
        kind: "procedure",
        createdAt: "2026-08-25T18:00:00.000Z",
        confidence: "high",
        triggers: ["terminal invalidation"],
        appliesTo: { paths: ["src/config.ts"], symbols: ["restartDeadline"] },
        evidencePaths: [],
        technique: "Fold every event before selecting status.",
        why: "File order must not reactivate invalidated memory.",
        evidence: "Permutation fixture.",
        invalidatedWhen: "Never reversed by promotion.",
      };
      const promotionA: ProjectMemoryPromotion = {
        schemaVersion: 1,
        event: "promote",
        eventRef: `event_${"2".repeat(32)}`,
        cardRef: candidate.cardRef,
        createdAt: "2026-08-25T18:00:01.000Z",
        verifiedAt: "2026-08-25T18:00:01.000Z",
        fingerprints: [],
        evidence: "First promotion.",
      };
      const promotionB: ProjectMemoryPromotion = {
        ...promotionA,
        eventRef: `event_${"3".repeat(32)}`,
        createdAt: "2026-08-25T18:00:03.000Z",
        verifiedAt: "2026-08-25T18:00:03.000Z",
        evidence: "Later promotion.",
      };
      const invalidation: ProjectMemoryInvalidation = {
        schemaVersion: 1,
        event: "invalidate",
        eventRef: `event_${"4".repeat(32)}`,
        cardRef: candidate.cardRef,
        createdAt: "2026-08-25T18:00:02.000Z",
        reason: "Terminal reason.",
      };
      const permutations = [
        [promotionA, promotionB, invalidation],
        [promotionA, invalidation, promotionB],
        [promotionB, promotionA, invalidation],
        [promotionB, invalidation, promotionA],
        [invalidation, promotionA, promotionB],
        [invalidation, promotionB, promotionA],
      ];
      try {
        for (const [caseIndex, events] of permutations.entries()) {
          const storeRoot = path.join(fixtureRoot, `case-${caseIndex}`);
          const cardsRoot = path.join(storeRoot, "cards");
          const eventsRoot = path.join(storeRoot, "events");
          fs.mkdirSync(cardsRoot, { recursive: true });
          fs.mkdirSync(eventsRoot, { recursive: true });
          fs.writeFileSync(path.join(cardsRoot, "card-0000.md"), candidateMarkdown(candidate));
          events.forEach((event, eventIndex) => {
            fs.writeFileSync(
              path.join(eventsRoot, `event-${String(eventIndex).padStart(6, "0")}.md`),
              event.event === "promote" ? promotionMarkdown(event) : invalidationMarkdown(event),
            );
          });
          const population = await readProjectMemoryPopulation({
            canonicalRoot: fixtureRoot,
            dataRoot: fixtureRoot,
            projectRef: "project_fold_permutation",
            storeRoot,
          });
          assert.equal(population.cards[0]?.status, "invalidated");
          assert.equal(population.cards[0]?.verifiedAt, promotionB.verifiedAt);
          assert.equal(population.cards[0]?.invalidationReason, invalidation.reason);
        }

        const partialStoreRoot = path.join(fixtureRoot, "partial");
        fillEmptySlots(path.join(partialStoreRoot, "cards"), "card", 4, 1);
        fillEmptySlots(path.join(partialStoreRoot, "events"), "event", 6, 1);
        fs.writeFileSync(path.join(partialStoreRoot, "cards", "card-0001.md"), candidateMarkdown(candidate));
        const partialPopulation = await readProjectMemoryPopulation({
          canonicalRoot: fixtureRoot,
          dataRoot: fixtureRoot,
          projectRef: "project_partial_records",
          storeRoot: partialStoreRoot,
        });
        assert.equal(partialPopulation.cards.length, 1);
        assert.equal(partialPopulation.warnings.length, 2);
        assert.equal(partialPopulation.warnings.every((warning) => /^malformed:[a-z-]+:record_/.test(warning)), true);
      } finally {
        fs.rmSync(fixtureRoot, { recursive: true, force: true });
      }
    },
  },
  {
    name: "distinct canonical git roots isolate stores and never recall each other",
    run: async () => {
      const fixtureRoot = fs.mkdtempSync(path.join(os.tmpdir(), "project-memory-isolation-"));
      const projectA = path.join(fixtureRoot, "alpha");
      const projectB = path.join(fixtureRoot, "beta");
      const dataRoot = path.join(fixtureRoot, "data");
      fs.mkdirSync(projectA);
      fs.mkdirSync(projectB);
      initializeProject(projectA);
      initializeProject(projectB);
      const environment = { OPENCODE_PROJECT_MEMORY: "1", OPENCODE_DATA_DIR: dataRoot };
      const now = new Date("2026-08-25T18:00:00.000Z");
      const record = async (
        feature: NonNullable<ReturnType<typeof createProjectMemoryFeature>>,
        projectRoot: string,
        title: string,
      ) => {
        const candidate = await feature.manage({
          action: "candidate",
          title,
          kind: "procedure",
          confidence: "high",
          triggers: ["restart supervisor"],
          appliesTo: { paths: ["src/config.ts"], symbols: ["restartDeadline"] },
          evidencePaths: ["src/config.ts"],
          technique: `Use the isolated restart path from ${projectRoot}.`,
          why: "Distinct canonical roots must not share memory.",
          evidence: "Cross-project isolation fixture.",
          invalidatedWhen: "The isolation contract changes.",
        }, now);
        await feature.manage({ action: "promote", cardRef: candidate.cardRef, evidence: "Verified in the owning project." }, now);
        return candidate.cardRef;
      };
      try {
        const featureA = createProjectMemoryFeature({ worktree: projectA, environment });
        const featureB = createProjectMemoryFeature({ worktree: projectB, environment });
        const storeA = resolveProjectMemoryStore({ worktree: projectA, environment });
        const storeB = resolveProjectMemoryStore({ worktree: projectB, environment });
        assert(featureA != null && featureB != null && storeA != null && storeB != null);
        assert.notEqual(featureA.projectRef, featureB.projectRef);
        assert.notEqual(storeA.storeRoot, storeB.storeRoot);
        assert.equal(storeA.storeRoot.includes(projectA), false);
        assert.equal(storeB.storeRoot.includes(projectB), false);
        assert.equal(path.relative(projectA, storeA.storeRoot).startsWith(".."), true);
        assert.equal(path.relative(projectB, storeB.storeRoot).startsWith(".."), true);

        const refA = await record(featureA, projectA, "Alpha isolated restart procedure");
        const refB = await record(featureB, projectB, "Beta isolated restart procedure");
        const query = { query: "How should I restart supervisor safely?", path: "src/config.ts", symbol: "restartDeadline" };
        const recalledA = await featureA.recall(query, { automatic: true, now });
        const recalledB = await featureB.recall(query, { automatic: true, now });
        assert.equal(recalledA.results.length, 1);
        assert.equal(recalledB.results.length, 1);
        assert.equal(recalledA.results[0]?.ref, refA);
        assert.equal(recalledB.results[0]?.ref, refB);
        assert.equal(recalledA.projectRef, featureA.projectRef);
        assert.equal(recalledB.projectRef, featureB.projectRef);
        assert.match(recalledA.capsule, /Alpha isolated restart procedure/);
        assert.doesNotMatch(recalledA.capsule, /Beta isolated restart procedure/);
        assert.match(recalledB.capsule, /Beta isolated restart procedure/);
        assert.doesNotMatch(recalledB.capsule, /Alpha isolated restart procedure/);

        const persisted = (storeRoot: string) => [
          ...fs.readdirSync(path.join(storeRoot, "cards")).map((name) => fs.readFileSync(path.join(storeRoot, "cards", name), "utf8")),
          ...fs.readdirSync(path.join(storeRoot, "events")).map((name) => fs.readFileSync(path.join(storeRoot, "events", name), "utf8")),
        ].join("\n");
        const persistedA = persisted(storeA.storeRoot);
        const persistedB = persisted(storeB.storeRoot);
        const bundles = [persistedA, persistedB, JSON.stringify(recalledA), JSON.stringify(recalledB), storeA.storeRoot, storeB.storeRoot, recalledA.warnings.join("\n"), recalledB.warnings.join("\n")];
        for (const bundle of bundles) {
          for (const sensitiveValue of [projectA, projectB, projectA.replaceAll("\\", "/"), projectB.replaceAll("\\", "/")]) {
            assert.equal(bundle.toLowerCase().includes(sensitiveValue.toLowerCase()), false);
          }
        }
        assert.match(persistedA, /<project-root>/);
        assert.match(persistedB, /<project-root>/);
        assert.doesNotMatch(persistedA, /Beta isolated restart procedure/);
        assert.doesNotMatch(persistedB, /Alpha isolated restart procedure/);
      } finally {
        fs.rmSync(fixtureRoot, { recursive: true, force: true });
      }
    },
  },
  {
    name: "concurrent processes exclusively claim the final card and lifecycle slots",
    run: async () => {
      const fixtureRoot = fs.mkdtempSync(path.join(os.tmpdir(), "project-memory-capacity-"));
      const projectRoot = path.join(fixtureRoot, "project");
      const dataRoot = path.join(fixtureRoot, "data");
      fs.mkdirSync(projectRoot);
      initializeProject(projectRoot);
      try {
        const store = resolveProjectMemoryStore({
          worktree: projectRoot,
          environment: { OPENCODE_DATA_DIR: dataRoot },
        });
        assert(store != null);
        const cardsRoot = path.join(store.storeRoot, "cards");
        fillEmptySlots(cardsRoot, "card", 4, 1_999);
        const cardBarrier = path.join(fixtureRoot, "card-barrier");
        const cardResults = await raceWorkers([
          { action: "candidate", barrierPath: cardBarrier, dataRoot, projectRoot },
          { action: "candidate", barrierPath: cardBarrier, dataRoot, projectRoot },
        ]);
        assert.deepEqual(cardResults.map((result) => result.ok).sort(), [false, true]);
        assert.equal(cardResults.find((result) => !result.ok)?.code, "capacity");
        assert.equal(fs.readdirSync(cardsRoot).length, 2_000);
        parseCandidateMarkdown(fs.readFileSync(path.join(cardsRoot, "card-1999.md"), "utf8"));
        assert.equal(fs.existsSync(path.join(cardsRoot, "card-2000.md")), false);

        const winner = cardResults.find((result) => result.ok)?.result;
        assert(winner != null);
        const eventsRoot = path.join(store.storeRoot, "events");
        fillEmptySlots(eventsRoot, "event", 6, 7_999);
        const eventBarrier = path.join(fixtureRoot, "event-barrier");
        const eventResults = await raceWorkers([
          { action: "promote", barrierPath: eventBarrier, cardRef: winner.cardRef, dataRoot, projectRoot },
          { action: "invalidate", barrierPath: eventBarrier, cardRef: winner.cardRef, dataRoot, projectRoot },
        ]);
        assert.deepEqual(eventResults.map((result) => result.ok).sort(), [false, true]);
        assert.equal(eventResults.find((result) => !result.ok)?.code, "capacity");
        assert.equal(fs.readdirSync(eventsRoot).length, 8_000);
        parseLifecycleMarkdown(fs.readFileSync(path.join(eventsRoot, "event-007999.md"), "utf8"));
        assert.equal(fs.existsSync(path.join(eventsRoot, "event-008000.md")), false);
      } finally {
        fs.rmSync(fixtureRoot, { recursive: true, force: true });
      }
    },
  },
];

const workerSpec = process.env.PROJECT_MEMORY_TEST_WORKER;
if (workerSpec != null) {
  await executeWorker(JSON.parse(workerSpec) as WorkerSpec);
} else {
  let failures = 0;
  for (const test of tests) {
    try {
      await test.run();
      console.log(`PASS ${test.name}`);
    } catch (error) {
      failures += 1;
      console.error(`FAIL ${test.name}`);
      console.error(error instanceof Error ? error.stack : String(error));
    }
  }

  if (failures > 0) process.exitCode = 1;
}
