import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createGraphifyProjectContextHooks } from "../global/plugin/graphify-project-context.ts";

type TestCase = {
  name: string;
  run: () => Promise<void> | void;
};

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

function managedGraphifyConfig(authorization = "Bearer "): Record<string, any> {
  return {
    mcp: {
      "graphify-global": {
        type: "remote",
        url: "http://127.0.0.1:4097/mcp",
        enabled: true,
        timeout: 30000,
        oauth: false,
        headers: { Authorization: authorization },
      },
      sibling: { type: "local", command: ["sibling"] },
    },
  };
}

function writeGraphifyManifest(dir: string): { graph: string; manifest: string; python: string } {
  const python = path.join(dir, "python.exe");
  const graph = path.join(dir, "graph.json");
  const manifest = path.join(dir, "manifest.json");
  fs.writeFileSync(python, "fixture");
  fs.writeFileSync(graph, "{}\n");
  fs.writeFileSync(manifest, `${JSON.stringify({
    schemaVersion: 2,
    graphify: {
      endpoint: "http://127.0.0.1:4097/mcp",
      configuration: {
        python: { path: python },
        module: { name: "graphify.serve" },
        graph: { path: graph },
      },
    },
  }, null, 2)}\n`);
  return { graph, manifest, python };
}

function graphifyHooks(runtime: { credential: string | undefined; manifestPath: string }, logs: unknown[]) {
  return createGraphifyProjectContextHooks({
    client: {
      app: {
        log: async (entry: unknown) => { logs.push(entry); },
      },
    },
  } as never, { ...runtime, platform: "win32" });
}

async function withTempDir(name: string, run: (dir: string) => Promise<void> | void): Promise<void> {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), `graphify-project-context-${name}-`));
  try {
    await run(dir);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

export const graphifyProjectContextTests: TestCase[] = [
  {
    name: "keeps managed remote Graphify without reading the manifest when credential is present",
    run: async () => withTempDir("credential-present", async (dir) => {
      const logs: unknown[] = [];
      const config = managedGraphifyConfig("Bearer synthetic-credential");
      const before = JSON.stringify(config);
      const hooks = graphifyHooks({ credential: "synthetic-credential", manifestPath: path.join(dir, "missing.json") }, logs);
      await hooks.config(config as never);
      assert(JSON.stringify(config) === before, "Credential-present Graphify configuration must remain remote and unchanged.");
      assert(logs.length === 0, "Credential-present Graphify path must not attempt manifest fallback or log a warning.");
    }),
  },
  {
    name: "synthesizes local Graphify from the Workstation manifest when credential is absent",
    run: async () => withTempDir("local-fallback", async (dir) => {
      const logs: unknown[] = [];
      const identity = writeGraphifyManifest(dir);
      const config = managedGraphifyConfig();
      const siblingBefore = JSON.stringify(config.mcp.sibling);
      const hooks = graphifyHooks({ credential: undefined, manifestPath: identity.manifest }, logs);
      await hooks.config(config as never);
      const graphify = config.mcp["graphify-global"];
      assert(graphify.type === "local", "Credential-absent Graphify entry must become local stdio.");
      assert(JSON.stringify(graphify.command) === JSON.stringify([identity.python, "-u", "-m", "graphify.serve", "--graph", identity.graph]), "Local Graphify command must use manifest Python and graph paths.");
      assert(graphify.cwd === "." && graphify.enabled === true && graphify.timeout === 30000, "Local Graphify entry must preserve the managed runtime contract.");
      assert(JSON.stringify(graphify.environment) === JSON.stringify({ PYTHONUNBUFFERED: "1", PYTHONIOENCODING: "utf-8", PYTHONUTF8: "1" }), "Local Graphify entry must set deterministic Python environment.");
      assert(JSON.stringify(config.mcp.sibling) === siblingBefore, "Graphify fallback must not alter sibling MCP entries.");
      assert(logs.length === 0, "Successful Graphify fallback must not log a warning.");
    }),
  },
  {
    name: "fails closed with sanitized warnings for mismatched config and invalid manifest",
    run: async () => withTempDir("fail-closed", async (dir) => {
      const logs: unknown[] = [];
      const mismatchMarker = "unexpected-sensitive-marker";
      const mismatch = managedGraphifyConfig(`Bearer ${mismatchMarker}`);
      const mismatchBefore = JSON.stringify(mismatch);
      await graphifyHooks({ credential: undefined, manifestPath: path.join(dir, "missing.json") }, logs).config(mismatch as never);
      assert(JSON.stringify(mismatch) === mismatchBefore, "Mismatched Graphify entry must remain unchanged.");

      const invalidMarker = "manifest-sensitive-marker";
      const invalidManifest = path.join(dir, "invalid-manifest.json");
      fs.writeFileSync(invalidManifest, `{ "marker": "${invalidMarker}"`);
      const invalid = managedGraphifyConfig();
      const invalidBefore = JSON.stringify(invalid);
      await graphifyHooks({ credential: undefined, manifestPath: invalidManifest }, logs).config(invalid as never);
      assert(JSON.stringify(invalid) === invalidBefore, "Invalid-manifest Graphify entry must remain unchanged.");
      assert(logs.length === 2, `Each failed fallback boundary must log once, got ${logs.length}.`);
      const rendered = JSON.stringify(logs);
      assert(!rendered.includes(mismatchMarker) && !rendered.includes(invalidMarker), "Graphify warnings must not include config or manifest values.");
      assert(logs.every((entry: any) => entry?.body?.level === "warn" && entry?.body?.message === "Graphify direct-terminal fallback was not applied."), "Graphify fallback diagnostics must be warning-level and bounded.");
    }),
  },
];
