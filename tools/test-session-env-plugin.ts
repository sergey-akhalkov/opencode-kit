#!/usr/bin/env node
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import plugin, { applyLocalLlamaSessionReviewerConfig, discoverLocalLlamaModel, LOCAL_LLAMA_BASE_URL, LOCAL_LLAMA_PROVIDER_ID, SESSION_DELIVERY_CONTEXT_TOOL, SESSION_DELIVERY_REVIEWER_AGENT } from "../.opencode/plugin/session-env.ts";

type TestCase = {
  name: string;
  run: () => Promise<void> | void;
};

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

async function withTempDataDir(name: string, run: (dir: string) => Promise<void> | void): Promise<void> {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), `session-env-plugin-${name}-`));
  try {
    await run(dir);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

function createDeliveryContextDb(dbPath: string, rawSessionId: string): void {
  const db = new DatabaseSync(dbPath);
  try {
    db.exec([
      "create table session (id text primary key, time_created integer, time_updated integer);",
      "create table session_input (id text primary key, session_id text not null, prompt text, time_created integer);",
      "create table message (id text primary key, session_id text not null, time_created integer, data text);",
      "create table todo (session_id text not null, content text, status text, priority text, position integer, time_created integer);",
      "create table event (id text primary key, session_id text not null, time_created integer, type text, properties text);",
    ].join("\n"));
    db.prepare("insert into session (id, time_created, time_updated) values (?, ?, ?)").run(rawSessionId, 1700000000000, 1700000001000);
    db.prepare("insert into session_input (id, session_id, prompt, time_created) values (?, ?, ?, ?)").run("input-secret", rawSessionId, `user request ${rawSessionId}`, 1700000000001);
    db.prepare("insert into message (id, session_id, time_created, data) values (?, ?, ?, ?)").run("message-secret", rawSessionId, 1700000000002, JSON.stringify({ role: "user", content: `message request ${rawSessionId}` }));
    db.prepare("insert into todo (session_id, content, status, priority, position, time_created) values (?, ?, ?, ?, ?, ?)").run(rawSessionId, `todo ${rawSessionId}`, "pending", "high", 1, 1700000000003);
    db.prepare("insert into event (id, session_id, time_created, type, properties) values (?, ?, ?, ?, ?)").run("question-asked-secret", rawSessionId, 1700000000004, "question.asked", JSON.stringify({ id: "question-secret", questions: [{ question: "Choose scope" }] }));
    db.prepare("insert into event (id, session_id, time_created, type, properties) values (?, ?, ?, ?, ?)").run("question-replied-secret", rawSessionId, 1700000000005, "question.replied", JSON.stringify({ requestID: "question-secret", answers: [[`Chosen ${rawSessionId}`]] }));
  } finally {
    db.close();
  }
}

const tests: TestCase[] = [
  {
    name: "injects current session id into shell env",
    run: async () => {
      const hooks = await plugin({} as never);
      const output = { env: { EXISTING: "1" } };
      await hooks["shell.env"]?.({ callID: "call_fixture", cwd: process.cwd(), sessionID: "session_fixture" }, output);
      assert(output.env.EXISTING === "1", "shell.env hook must preserve existing env entries.");
      assert(output.env.OPENCODE_SESSION_ID === "session_fixture", "shell.env hook must inject OPENCODE_SESSION_ID.");
    },
  },
  {
    name: "registers session delivery context custom tool",
    run: async () => {
      const hooks = await plugin({} as never);
      assert(hooks.tool?.[SESSION_DELIVERY_CONTEXT_TOOL] != null, "Plugin must register session_delivery_context tool.");
      assert(hooks.tool?.[SESSION_DELIVERY_CONTEXT_TOOL]?.description.includes("current OpenCode session"), "Custom tool description should scope evidence to current session.");
    },
  },
  {
    name: "session delivery context custom tool executes for current session",
    run: async () => withTempDataDir("tool-execute", async (dataDir) => {
      const rawSessionId = "session_plugin_secret";
      createDeliveryContextDb(path.join(dataDir, "opencode.db"), rawSessionId);
      const previousDataDir = process.env.OPENCODE_DATA_DIR;
      process.env.OPENCODE_DATA_DIR = dataDir;
      try {
        const hooks = await plugin({} as never);
        const metadataCalls: unknown[] = [];
        const result = await hooks.tool?.[SESSION_DELIVERY_CONTEXT_TOOL]?.execute({}, {
          abort: new AbortController().signal,
          agent: SESSION_DELIVERY_REVIEWER_AGENT,
          ask: async () => undefined,
          directory: dataDir,
          messageID: "message_fixture",
          metadata: (input: unknown) => { metadataCalls.push(input); },
          sessionID: rawSessionId,
          worktree: dataDir,
        });
        const output = typeof result === "string" ? result : result?.output;
        assert(typeof output === "string", "Custom tool should return JSON output string.");
        const parsed = JSON.parse(output) as { questionReplies?: unknown[]; session?: { counts?: Record<string, number>; sessionRef?: string }; todos?: { open?: unknown[] }; userMessages?: unknown[] };
        assert(parsed.session?.counts?.openTodos === 1, `Custom tool should report open todo, got ${output}`);
        assert(parsed.session?.counts?.userMessages === 2, `Custom tool should report user messages, got ${output}`);
        assert(parsed.questionReplies?.length === 1, `Custom tool should report question reply, got ${output}`);
        assert(metadataCalls.length === 1, "Custom tool should publish metadata once.");
        assert(!output.includes(rawSessionId), "Custom tool output must redact raw session id.");
      } finally {
        if (previousDataDir == null) {
          delete process.env.OPENCODE_DATA_DIR;
        } else {
          process.env.OPENCODE_DATA_DIR = previousDataDir;
        }
      }
    }),
  },
  {
    name: "configures local llama only with discovered model",
    run: () => {
      const config: { agent?: Record<string, Record<string, unknown>>; provider?: Record<string, Record<string, unknown>> } = {
        agent: {
          [SESSION_DELIVERY_REVIEWER_AGENT]: { description: "Reviewer fixture" },
        },
        provider: {
          openai: { options: { setCacheKey: true } },
        },
      };
      assert(applyLocalLlamaSessionReviewerConfig(config, "llama-fixture") === true, "Config helper should report applied config for non-empty model id.");
      const provider = config.provider?.[LOCAL_LLAMA_PROVIDER_ID] as { models?: Record<string, unknown>; npm?: string; options?: { baseURL?: string } } | undefined;
      const agent = config.agent?.[SESSION_DELIVERY_REVIEWER_AGENT];
      assert(provider?.npm === "@ai-sdk/openai-compatible", "Local llama provider must use OpenAI-compatible AI SDK package.");
      assert(provider.options?.baseURL === LOCAL_LLAMA_BASE_URL, "Local llama provider must point to localhost /v1 endpoint.");
      assert(provider.models?.["llama-fixture"] != null, "Local llama provider must include discovered model id.");
      assert(agent?.model === `${LOCAL_LLAMA_PROVIDER_ID}/llama-fixture`, "Session delivery reviewer should use discovered local llama model.");
      assert(config.provider?.openai?.options != null, "Config helper must preserve unrelated providers.");
    },
  },
  {
    name: "config hook leaves reviewer model unchanged when local llama discovery fails",
    run: async () => {
      const hooks = await plugin({} as never);
      const previousFetch = globalThis.fetch;
      const config: { agent?: Record<string, Record<string, unknown>>; provider?: Record<string, Record<string, unknown>> } = {
        agent: {
          [SESSION_DELIVERY_REVIEWER_AGENT]: { model: "openai/gpt-5.5" },
        },
        provider: {
          openai: { options: { setCacheKey: true } },
        },
      };
      globalThis.fetch = (async () => ({ ok: false, json: async () => ({ data: [{ id: "llama-fixture" }] }) }) as Response) as typeof fetch;
      try {
        await hooks.config?.(config as never);
      } finally {
        globalThis.fetch = previousFetch;
      }
      assert(config.provider?.[LOCAL_LLAMA_PROVIDER_ID] == null, "Failed discovery must not register local llama provider.");
      assert(config.agent?.[SESSION_DELIVERY_REVIEWER_AGENT]?.model === "openai/gpt-5.5", "Failed discovery must preserve existing reviewer model.");
      assert(config.provider?.openai?.options != null, "Failed discovery must preserve unrelated provider config.");
    },
  },
  {
    name: "skips empty local llama model id",
    run: () => {
      const config = {};
      assert(applyLocalLlamaSessionReviewerConfig(config, " ") === false, "Empty model id should not mutate config.");
      assert(Object.keys(config).length === 0, "Empty model id must leave config untouched.");
    },
  },
  {
    name: "discovers local llama model only from valid models response",
    run: async () => {
      const validFetch = async () => ({ ok: true, json: async () => ({ data: [{ id: "" }, { id: "llama-fixture" }] }) }) as Response;
      const nonOkFetch = async () => ({ ok: false, json: async () => ({ data: [{ id: "llama-fixture" }] }) }) as Response;
      const malformedFetch = async () => ({ ok: true, json: async () => { throw new Error("bad json"); } }) as Response;
      const throwingFetch = async () => { throw new Error("offline"); };

      assert(await discoverLocalLlamaModel(validFetch as typeof fetch) === "llama-fixture", "Discovery should return first non-empty model id.");
      assert(await discoverLocalLlamaModel(nonOkFetch as typeof fetch) === null, "Discovery should ignore non-OK responses.");
      assert(await discoverLocalLlamaModel(malformedFetch as typeof fetch) === null, "Discovery should ignore malformed JSON.");
      assert(await discoverLocalLlamaModel(throwingFetch as typeof fetch) === null, "Discovery should ignore network failures.");
    },
  },
];

let failed = 0;
for (const test of tests) {
  try {
    await test.run();
    console.log(`PASS ${test.name}`);
  } catch (error) {
    failed++;
    const message = error instanceof Error ? error.message : String(error);
    console.error(`FAIL ${test.name}`);
    console.error(message);
  }
}

if (failed > 0) {
  process.exit(1);
}

console.log(`OK: session env plugin tests=${tests.length}`);
