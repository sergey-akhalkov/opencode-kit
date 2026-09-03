#!/usr/bin/env node
import assert from "node:assert/strict";
import crypto from "node:crypto";

import specialistCatalogPlugin from "../global/extensions/specialist-catalog.ts";

type JsonRecord = Record<string, unknown>;
type FakeClient = {
  app?: {
    agents?: (input: { directory: string }) => Promise<{ data?: unknown; error?: unknown }>;
    skills?: (input: { directory: string }) => Promise<{ data?: unknown; error?: unknown }>;
  };
  session?: { get?: (input: { directory: string; sessionID: string }) => Promise<{ data?: unknown; error?: unknown }> };
};

function context(agent: string, sessionID: string): JsonRecord {
  return {
    abort: new AbortController().signal,
    agent,
    ask: async () => {},
    directory: "C:\\private\\project",
    messageID: "message-private",
    metadata: () => {},
    sessionID,
    worktree: "C:\\private\\project",
  };
}

async function loadTool(client: FakeClient): Promise<(args: JsonRecord, context: JsonRecord) => Promise<unknown>> {
  const hooks = await specialistCatalogPlugin({ client } as never);
  const definition = (hooks.tool as JsonRecord).specialist_catalog as JsonRecord;
  assert.equal(typeof definition.execute, "function");
  return definition.execute as (args: JsonRecord, context: JsonRecord) => Promise<unknown>;
}

function output(value: unknown): JsonRecord {
  assert.ok(value != null && typeof value === "object" && !Array.isArray(value));
  const raw = (value as JsonRecord).output;
  assert.equal(typeof raw, "string");
  const parsed = JSON.parse(raw) as unknown;
  assert.ok(parsed != null && typeof parsed === "object" && !Array.isArray(parsed));
  return parsed as JsonRecord;
}

function ids(value: unknown): string[] {
  assert.ok(Array.isArray(value));
  return value.map((item) => {
    assert.ok(item != null && typeof item === "object" && !Array.isArray(item));
    assert.equal(typeof (item as JsonRecord).id, "string");
    return (item as JsonRecord).id as string;
  });
}

async function main(): Promise<void> {
  let apiReads = 0;
  const inertClient = {
    get session(): never {
      apiReads += 1;
      throw new Error("initialization must be inert");
    },
    get v2(): never {
      apiReads += 1;
      throw new Error("initialization must be inert");
    },
  };
  const inertHooks = await specialistCatalogPlugin({ client: inertClient } as never);
  assert.equal(apiReads, 0);
  assert.ok((inertHooks.tool as JsonRecord).specialist_catalog != null);

  let deniedReads = 0;
  const deniedTool = await loadTool({
    app: {
      agents: async () => { deniedReads += 1; throw new Error("must not read"); },
      skills: async () => { deniedReads += 1; throw new Error("must not read"); },
    },
    session: { get: async () => { deniedReads += 1; throw new Error("must not read"); } },
  });
  const denied = output(await deniedTool({}, context("build", "raw-main-session")));
  assert.equal(denied.status, "denied");
  assert.deepEqual(denied.agents, []);
  assert.deepEqual(denied.skills, []);
  assert.equal(deniedReads, 0);
  assert.equal(JSON.stringify(denied).includes("raw-main-session"), false);

  const missingTool = await loadTool({ app: {} });
  const missing = output(await missingTool({}, context("specialist-team-advisor", "missing-api-session")));
  assert.equal(missing.status, "unknown");
  assert.deepEqual(missing.agents, []);
  assert.deepEqual(missing.skills, []);
  assert.equal((missing.warnings as JsonRecord[])[0]?.cause, "catalog-api-unavailable");

  const sessions: Record<string, JsonRecord> = {
    "advisor-session-private": {
      agent: "specialist-team-advisor",
      directory: "C:\\private\\project",
      id: "advisor-session-private",
      parentID: "root-session-private",
      projectID: "project-private",
      version: "1.18.25",
    },
    "root-session-private": {
      directory: "C:\\private\\project",
      id: "root-session-private",
      projectID: "project-private",
      version: "1.18.25",
    },
  };
  let agentReads = 0;
  let skillReads = 0;
  const client: FakeClient = {
    app: {
      agents: async ({ directory }) => {
        agentReads += 1;
        assert.equal(directory, "C:\\private\\project");
        return {
          data: [
            { description: "Zed worker", hidden: false, mode: "subagent", name: "z-worker" },
            { description: "Path C:\\private\\secret token=do-not-leak PRIVATE_AGENT_SENTINEL", hidden: false, mode: "all", name: "a-worker" },
            { description: "self", hidden: false, mode: "subagent", name: "specialist-team-advisor" },
            { description: "guard", hidden: false, mode: "subagent", name: "session-completion-arbiter" },
            { description: "hidden", hidden: true, mode: "subagent", name: "hidden-worker" },
            { description: "primary", hidden: false, mode: "primary", name: "build" },
            { description: "unsafe", hidden: false, mode: "subagent", name: "unsafe id" },
          ],
        };
      },
      skills: async ({ directory }) => {
        skillReads += 1;
        return {
          data: [
            { content: "PRIVATE_SKILL_BODY", description: "Second skill", location: `${directory}\\skill.md`, name: "z-skill" },
            { content: "PRIVATE_SKILL_BODY", description: `${"long ".repeat(40)}password=private`, location: `${directory}\\skill.md`, name: "a-skill" },
          ],
        };
      },
    },
    session: {
      get: async ({ sessionID }) => ({ data: sessions[sessionID] }),
    },
  };
  const tool = await loadTool(client);
  const positive = output(await tool({}, context("specialist-team-advisor", "advisor-session-private")));
  assert.equal(positive.status, "ok");
  assert.equal(positive.schemaVersion, 1);
  assert.equal(agentReads, 1);
  assert.equal(skillReads, 1);
  assert.deepEqual(ids(positive.agents), ["a-worker", "z-worker"]);
  assert.deepEqual(ids(positive.skills), ["a-skill", "z-skill"]);
  assert.match(String(positive.catalogRef), /^[a-f0-9]{64}$/);
  assert.equal(positive.rootSessionRef, crypto.createHash("sha256").update("root-session-private").digest("hex").slice(0, 16));
  const text = JSON.stringify(positive);
  for (const forbidden of [
    "advisor-session-private",
    "root-session-private",
    "project-private",
    "C:\\private",
    "do-not-leak",
    "PRIVATE_AGENT_SENTINEL",
    "PRIVATE_SKILL_BODY",
    "session-completion-arbiter",
    "specialist-team-advisor",
    "unsafe id",
  ]) assert.equal(text.includes(forbidden), false, `Catalog disclosed ${forbidden}`);
  assert.ok(Array.isArray(positive.warnings) && positive.warnings.length >= 3);
  assert.ok((positive.agents as JsonRecord[]).every((entry) => String(entry.description).length <= 160));
  assert.ok((positive.skills as JsonRecord[]).every((entry) => String(entry.description).length <= 160));

  const unattributedClient: FakeClient = {
    ...client,
    session: { get: async ({ sessionID }) => ({ data: { ...sessions[sessionID], agent: "build" } }) },
  };
  const unattributed = output(await (await loadTool(unattributedClient))({}, context("specialist-team-advisor", "advisor-session-private")));
  assert.equal(unattributed.status, "denied");
  assert.deepEqual(unattributed.agents, []);

  let parentlessReads = 0;
  const parentlessClient: FakeClient = {
    app: {
      agents: async () => { parentlessReads += 1; throw new Error("must not read"); },
      skills: async () => { parentlessReads += 1; throw new Error("must not read"); },
    },
    session: {
      get: async ({ sessionID }) => ({
        data: {
          agent: "specialist-team-advisor",
          directory: "C:\\private\\project",
          id: sessionID,
          projectID: "project-private",
          version: "1.18.25",
        },
      }),
    },
  };
  const parentless = output(await (await loadTool(parentlessClient))({}, context("specialist-team-advisor", "advisor-session-private")));
  assert.equal(parentless.status, "denied");
  assert.deepEqual(parentless.agents, []);
  assert.deepEqual(parentless.skills, []);
  assert.equal(parentlessReads, 0);
  assert.equal((parentless.warnings as JsonRecord[])[0]?.cause, "caller-attribution-mismatch");
  assert.equal(JSON.stringify(parentless).includes("advisor-session-private"), false);
  assert.equal(JSON.stringify(parentless).includes("C:\\private"), false);

  let unresolvedRootReads = 0;
  const unresolvedRootClient: FakeClient = {
    app: {
      agents: async () => { unresolvedRootReads += 1; throw new Error("must not read"); },
      skills: async () => { unresolvedRootReads += 1; throw new Error("must not read"); },
    },
    session: {
      get: async ({ sessionID }) => (
        sessionID === "advisor-session-private"
          ? { data: sessions[sessionID] }
          : { data: undefined }
      ),
    },
  };
  const unresolvedRoot = output(await (await loadTool(unresolvedRootClient))({}, context("specialist-team-advisor", "advisor-session-private")));
  assert.equal(unresolvedRoot.status, "unknown");
  assert.deepEqual(unresolvedRoot.agents, []);
  assert.deepEqual(unresolvedRoot.skills, []);
  assert.equal(unresolvedRootReads, 0);
  assert.equal(JSON.stringify(unresolvedRoot).includes("root-session-private"), false);
  assert.equal(JSON.stringify(unresolvedRoot).includes("C:\\private"), false);

  const cycleClient: FakeClient = {
    ...client,
    session: {
      get: async ({ sessionID }) => ({
        data: sessionID === "advisor-session-private"
          ? sessions[sessionID]
          : { directory: "C:\\private\\project", id: "root-session-private", parentID: "root-session-private" },
      }),
    },
  };
  const cycle = output(await (await loadTool(cycleClient))({}, context("specialist-team-advisor", "advisor-session-private")));
  assert.equal(cycle.status, "unknown");
  assert.equal((cycle.warnings as JsonRecord[])[0]?.cause, "session-parent-cycle");

  const failedClient: FakeClient = {
    ...client,
    app: {
      ...client.app,
      agents: async () => ({ error: { name: "CatalogApiFailure" } }),
    },
  };
  const failed = output(await (await loadTool(failedClient))({}, context("specialist-team-advisor", "advisor-session-private")));
  assert.equal(failed.status, "unknown");
  assert.equal((failed.warnings as JsonRecord[])[0]?.cause, "CatalogApiFailure");
  assert.deepEqual(failed.agents, []);
  assert.deepEqual(failed.skills, []);

  process.stdout.write("OK: specialist catalog plugin tests=9\n");
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.stack ?? error.message : String(error)}\n`);
  process.exitCode = 1;
});
