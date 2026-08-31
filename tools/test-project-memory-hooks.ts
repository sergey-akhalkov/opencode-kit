#!/usr/bin/env node
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import sessionEnvPlugin, { SESSION_DELIVERY_CONTEXT_TOOL } from "../global/plugin/session-env.ts";
import { createProjectMemoryFeature } from "../global/plugin/project-memory/index.ts";

type TestCase = {
  name: string;
  run: () => Promise<void> | void;
};

function initializeProject(projectRoot: string): void {
  const result = spawnSync("git", ["init", "--quiet"], { cwd: projectRoot, encoding: "utf8" });
  if (result.status !== 0) throw new Error(`git init failed: ${result.stderr}`);
  fs.mkdirSync(path.join(projectRoot, "src"));
  fs.writeFileSync(path.join(projectRoot, "src", "config.ts"), "export const restartDeadline = 120_000;\n");
}

function invalidateInSecondProcess(fixtureRoot: string, projectRoot: string, dataRoot: string, cardRef: string): void {
  const barrierPath = path.join(fixtureRoot, `invalidate-${cardRef}.barrier`);
  fs.writeFileSync(barrierPath, "go", { flag: "wx" });
  const result = spawnSync(process.execPath, [path.join(import.meta.dirname, "test-project-memory.ts")], {
    encoding: "utf8",
    env: {
      ...process.env,
      PROJECT_MEMORY_TEST_WORKER: JSON.stringify({ action: "invalidate", barrierPath, cardRef, dataRoot, projectRoot }),
    },
  });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  const line = result.stdout.trim().split(/\r?\n/).findLast((value) => value.startsWith("{"));
  assert(line != null);
  assert.equal((JSON.parse(line) as { ok?: boolean }).ok, true);
  fs.rmSync(barrierPath, { force: true });
}

const tests: TestCase[] = [
  {
    name: "session env composes root-only tools and message-before-transform context",
    run: async () => {
      const fixtureRoot = fs.mkdtempSync(path.join(os.tmpdir(), "project-memory-hooks-"));
      const projectRoot = path.join(fixtureRoot, "project");
      const outsideRoot = path.join(fixtureRoot, "outside");
      const dataRoot = path.join(fixtureRoot, "data");
      fs.mkdirSync(projectRoot);
      fs.mkdirSync(outsideRoot);
      initializeProject(projectRoot);
      const previousEnabled = process.env.OPENCODE_PROJECT_MEMORY;
      const previousKaizen = process.env.OPENCODE_KAIZEN;
      const previousDataRoot = process.env.OPENCODE_DATA_DIR;
      const previousWarn = console.warn;
      const warningLines: string[] = [];
      const rawSecret = "sk-proj-abcdefghijklmnopqrstuvwxyz";
      const rawHome = os.homedir();
      process.env.OPENCODE_PROJECT_MEMORY = "1";
      delete process.env.OPENCODE_KAIZEN;
      process.env.OPENCODE_DATA_DIR = dataRoot;
      console.warn = (...values: unknown[]) => warningLines.push(values.map(String).join(" "));
      let parentID: string | null = null;
      let responseID = "session-root";
      let sessionDirectory = projectRoot;
      let lookupTimeout = false;
      let lookupCalls = 0;
      let lookupInput: unknown = null;
      try {
        const feature = createProjectMemoryFeature({ worktree: projectRoot });
        assert(feature != null);
        const candidate = await feature.manage({
          action: "candidate",
          title: "Restart the shared supervisor",
          kind: "procedure",
          confidence: "high",
          triggers: ["restart supervisor"],
          appliesTo: { paths: ["src/config.ts"], symbols: ["restartDeadline"] },
          evidencePaths: ["src/config.ts"],
          technique: `Use ${projectRoot}, ${projectRoot.replaceAll("\\", "/")}, or ${projectRoot.toUpperCase()}; api_key=${rawSecret}; home=${rawHome}.`,
          why: "It preserves process ownership.",
          evidence: "Observed in the focused workstation proof.",
          invalidatedWhen: "The supervisor ownership contract changes.",
        });
        await feature.manage({ action: "promote", cardRef: candidate.cardRef, evidence: "Verified against src/config.ts." });
        const pluginInput = {
          client: { session: {
            async get(input: unknown) {
              lookupCalls += 1;
              lookupInput = input;
              if (lookupTimeout) return new Promise(() => {});
              return { data: { id: responseID, parentID, directory: sessionDirectory } };
            },
            async messages() { return { data: [] }; },
          } },
          directory: projectRoot,
          project: { worktree: projectRoot },
          worktree: projectRoot,
        };
        const hooks = await sessionEnvPlugin.server(pluginInput as never);
        assert(hooks.tool != null);
        assert.equal(Object.hasOwn(hooks.tool, SESSION_DELIVERY_CONTEXT_TOOL), true);
        assert.equal(Object.hasOwn(hooks.tool, "project_memory_recall"), true);
        assert.equal(Object.hasOwn(hooks.tool, "project_memory_manage"), true);
        assert.equal(typeof hooks["chat.message"], "function");
        assert.equal(typeof hooks["experimental.chat.system.transform"], "function");
        assert.equal(typeof hooks["experimental.session.compacting"], "function");

        const sendMessage = async (sessionID: string | undefined, text = "How should I restart supervisor safely?") => hooks["chat.message"]?.(
          { sessionID, agent: "build", model: { providerID: "fake", modelID: "fake" }, messageID: "message" } as never,
          { message: {} as never, parts: [{ type: "text", text }] as never },
        );
        const transformed = async (sessionID: string | undefined) => {
          const system: string[] = [];
          await hooks["experimental.chat.system.transform"]?.({ sessionID, model: { providerID: "fake", modelID: "fake" } } as never, { system });
          return system;
        };

        assert.deepEqual(await transformed("session-root"), []);
        const callsBeforeMissing = lookupCalls;
        await sendMessage(undefined);
        assert.equal(lookupCalls, callsBeforeMissing);
        responseID = "session-other";
        await sendMessage("session-root");
        assert.deepEqual(await transformed("session-root"), []);
        responseID = "session-root";
        sessionDirectory = outsideRoot;
        await sendMessage("session-root");
        assert.deepEqual(await transformed("session-root"), []);
        sessionDirectory = projectRoot;
        lookupTimeout = true;
        await sendMessage("session-root");
        await sendMessage("session-root");
        assert.deepEqual(await transformed("session-root"), []);
        assert.equal(warningLines.length, 1);
        assert.match(warningLines[0] ?? "", /session=session_[a-f0-9]{12}/);
        for (const sensitiveValue of [rawSecret, rawHome, projectRoot, "session-root"]) {
          assert.equal((warningLines[0] ?? "").toLowerCase().includes(sensitiveValue.toLowerCase()), false);
        }
        lookupTimeout = false;
        lookupCalls = 0;
        lookupInput = null;

        await sendMessage("session-root");
        const lateCandidate = await feature.manage({
          action: "candidate",
          title: "Late matching memory",
          kind: "tip",
          confidence: "high",
          triggers: ["restart supervisor"],
          technique: "Wait for the next human message.",
          why: "Selection refs are stable within one prompt.",
          evidence: "Hook fixture.",
          invalidatedWhen: "The next message starts.",
        });
        await feature.manage({ action: "promote", cardRef: lateCandidate.cardRef, evidence: "Current." });
        const system = ["base-system"];
        await hooks["experimental.chat.system.transform"]?.(
          { sessionID: "session-root", model: { providerID: "fake", modelID: "fake" } },
          { system },
        );
        assert.equal(lookupCalls, 1);
        assert.deepEqual(lookupInput, { path: { id: "session-root" }, query: { directory: projectRoot } });
        assert.equal(system.length, 2);
        assert.match(system[1] ?? "", /Restart the shared supervisor/);
        assert.doesNotMatch(system[1] ?? "", /Late matching memory/);
        for (const sensitiveValue of [rawSecret, rawHome, projectRoot, projectRoot.toUpperCase()]) {
          assert.equal((system[1] ?? "").toLowerCase().includes(sensitiveValue.toLowerCase()), false);
        }
        assert.deepEqual(await transformed("session-root"), [system[1]]);

        let recallMetadata: unknown = null;
        const recallToolResult = await hooks.tool.project_memory_recall.execute(
          { input: { query: "restart supervisor" } },
          { directory: projectRoot, metadata(value: unknown) { recallMetadata = value; } } as never,
        );
        assert.equal(Buffer.byteLength(recallToolResult.output, "utf8") <= 16 * 1024, true);
        assert.match(String(recallToolResult.metadata.projectRef), /^project_[a-f0-9]{32}$/);
        assert.deepEqual(recallToolResult.metadata, { bytes: Buffer.byteLength(recallToolResult.output, "utf8"), projectRef: recallToolResult.metadata.projectRef });
        assert.deepEqual(recallMetadata, { title: "Project memory recall", metadata: recallToolResult.metadata });
        for (const sensitiveValue of [rawSecret, rawHome, projectRoot]) {
          assert.equal(JSON.stringify(recallToolResult).toLowerCase().includes(sensitiveValue.toLowerCase()), false);
        }

        const context: string[] = [];
        const compactionOutput = { context, prompt: "keep-default" };
        await hooks["experimental.session.compacting"]?.(
          { sessionID: "session-root" },
          compactionOutput,
        );
        assert.equal(compactionOutput.prompt, "keep-default");
        assert.equal(context[0], system[1]);
        assert.equal(context.length, 2);
        assert.match(context[1] ?? "", /<kaizen_signal>/u);
        await assert.rejects(
          hooks.tool.project_memory_recall.execute({ input: { query: "restart supervisor" } }, { directory: outsideRoot, metadata() {} } as never),
          /does not match the configured project root/,
        );

        let manageMetadata: unknown = null;
        const manageToolResult = await hooks.tool.project_memory_manage.execute({ input: {
          action: "candidate",
          title: "Unrelated candidate",
          kind: "tip",
          confidence: "low",
          triggers: ["unrelated candidate"],
          technique: `Wait at ${projectRoot}; password=${rawSecret}; home=${rawHome}.`,
          why: "Manage actions clear cached context.",
          evidence: "Hook fixture.",
          invalidatedWhen: "Never selected.",
        } }, { directory: projectRoot, metadata(value: unknown) { manageMetadata = value; } } as never);
        assert.equal(Buffer.byteLength(manageToolResult.output, "utf8") <= 4 * 1024, true);
        assert.deepEqual(manageToolResult.metadata, { bytes: Buffer.byteLength(manageToolResult.output, "utf8"), projectRef: recallToolResult.metadata.projectRef });
        assert.deepEqual(manageMetadata, { title: "Project memory manage", metadata: manageToolResult.metadata });
        for (const sensitiveValue of [rawSecret, rawHome, projectRoot]) {
          assert.equal(JSON.stringify(manageToolResult).toLowerCase().includes(sensitiveValue.toLowerCase()), false);
        }
        assert.deepEqual(await transformed("session-root"), []);
        await sendMessage("session-root");
        assert.match((await transformed("session-root"))[0] ?? "", /Restart the shared supervisor/);
        fs.writeFileSync(path.join(projectRoot, "src", "config.ts"), "export const restartDeadline = 60_000;\n");
        const afterFingerprintMismatch = (await transformed("session-root"))[0] ?? "";
        assert.doesNotMatch(afterFingerprintMismatch, /Restart the shared supervisor/);
        assert.match(afterFingerprintMismatch, /Late matching memory/);
        fs.writeFileSync(path.join(projectRoot, "src", "config.ts"), "export const restartDeadline = 120_000;\n");
        assert.doesNotMatch((await transformed("session-root"))[0] ?? "", /Restart the shared supervisor/);
        await sendMessage("session-root");
        assert.match((await transformed("session-root"))[0] ?? "", /Restart the shared supervisor/);
        invalidateInSecondProcess(fixtureRoot, projectRoot, dataRoot, candidate.cardRef);
        const afterSecondProcessInvalidation = (await transformed("session-root"))[0] ?? "";
        assert.doesNotMatch(afterSecondProcessInvalidation, /Restart the shared supervisor/);
        assert.match(afterSecondProcessInvalidation, /Late matching memory/);

        const compactCandidate = await feature.manage({
          action: "candidate",
          title: "Compact current context",
          kind: "procedure",
          confidence: "high",
          triggers: ["compact current context"],
          technique: "Revalidate before compaction.",
          why: "Invalidated context must not survive.",
          evidence: "Hook fixture.",
          invalidatedWhen: "The card is invalidated.",
        });
        await feature.manage({ action: "promote", cardRef: compactCandidate.cardRef, evidence: "Current." });
        await sendMessage("session-root", "compact current context");
        invalidateInSecondProcess(fixtureRoot, projectRoot, dataRoot, compactCandidate.cardRef);
        const invalidatedCompaction = { context: [] as string[], prompt: "keep-default" };
        await hooks["experimental.session.compacting"]?.({ sessionID: "session-root" }, invalidatedCompaction as never);
        assert.equal(invalidatedCompaction.prompt, "keep-default");
        assert.equal(invalidatedCompaction.context.length, 1);
        assert.match(invalidatedCompaction.context[0] ?? "", /<kaizen_signal>/u);

        parentID = "session-root";
        responseID = "session-child";
        await sendMessage("session-child", "compact current context");
        assert.deepEqual(await transformed("session-child"), []);
        parentID = null;
        responseID = "session-root";

        const cleanupCandidate = await feature.manage({
          action: "candidate",
          title: "Cleanup selected context",
          kind: "tip",
          confidence: "high",
          triggers: ["cleanup selected context"],
          technique: "Clear session state.",
          why: "Deletion and disposal own cleanup.",
          evidence: "Hook fixture.",
          invalidatedWhen: "The session ends.",
        });
        await feature.manage({ action: "promote", cardRef: cleanupCandidate.cardRef, evidence: "Current." });
        await sendMessage("session-root", "cleanup selected context");

        await hooks.event?.({ event: { type: "session.deleted", properties: { info: { id: "session-root" } } } } as never);
        assert.deepEqual(await transformed("session-root"), []);
        await sendMessage("session-root", "cleanup selected context");
        await hooks.dispose?.();
        assert.deepEqual(await transformed("session-root"), []);
      } finally {
        console.warn = previousWarn;
        if (previousEnabled == null) delete process.env.OPENCODE_PROJECT_MEMORY;
        else process.env.OPENCODE_PROJECT_MEMORY = previousEnabled;
        if (previousKaizen == null) delete process.env.OPENCODE_KAIZEN;
        else process.env.OPENCODE_KAIZEN = previousKaizen;
        if (previousDataRoot == null) delete process.env.OPENCODE_DATA_DIR;
        else process.env.OPENCODE_DATA_DIR = previousDataRoot;
        fs.rmSync(fixtureRoot, { recursive: true, force: true });
      }
    },
  },
];

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
