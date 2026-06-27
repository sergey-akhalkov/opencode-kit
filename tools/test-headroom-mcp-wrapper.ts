#!/usr/bin/env node
import { strict as assert } from "node:assert";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { emptyPromptsListResponse, probeHeadroom, promptGetResponse, routeClientLine, routeServerLine } from "./headroom-mcp-wrapper.ts";

type TestCase = {
  name: string;
  run: () => void;
};

const tests: TestCase[] = [
  {
    name: "prompts/list returns Headroom usage policy prompt",
    run: () => {
      const routed = routeClientLine(JSON.stringify({ jsonrpc: "2.0", id: 7, method: "prompts/list", params: {} }));
      assert.equal(routed.kind, "reply");
      const parsed = JSON.parse(routed.line);
      assert.equal(parsed.jsonrpc, "2.0");
      assert.equal(parsed.id, 7);
      assert.equal(parsed.result.prompts.length, 1);
      assert.equal(parsed.result.prompts[0].name, "headroom_usage_policy");
    },
  },
  {
    name: "prompts/get returns usage policy text",
    run: () => {
      const routed = routeClientLine(JSON.stringify({ jsonrpc: "2.0", id: 8, method: "prompts/get", params: { name: "headroom_usage_policy" } }));
      assert.equal(routed.kind, "reply");
      const parsed = JSON.parse(routed.line);
      assert.equal(parsed.result.messages[0].role, "user");
      assert.match(parsed.result.messages[0].content.text, /Use Headroom MCP only/);
      assert.match(parsed.result.messages[0].content.text, /headroom_retrieve/);
    },
  },
  {
    name: "prompts/get rejects unknown prompts",
    run: () => {
      const parsed = JSON.parse(promptGetResponse(9, "unknown"));
      assert.equal(parsed.id, 9);
      assert.equal(parsed.error.code, -32602);
    },
  },
  {
    name: "notifications and normal requests forward unchanged",
    run: () => {
      const initialize = JSON.stringify({ jsonrpc: "2.0", id: 1, method: "initialize", params: {} });
      const initialized = JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized" });
      assert.deepEqual(routeClientLine(initialize), { kind: "forward", line: initialize });
      assert.deepEqual(routeClientLine(initialized), { kind: "forward", line: initialized });
    },
  },
  {
    name: "invalid and non-object lines are safe pass-through or drop",
    run: () => {
      assert.deepEqual(routeClientLine("not-json"), { kind: "forward", line: "not-json" });
      assert.deepEqual(routeClientLine(""), { kind: "drop" });
      assert.deepEqual(routeClientLine("[]"), { kind: "forward", line: "[]" });
    },
  },
  {
    name: "prompts response preserves request id shapes",
    run: () => {
      assert.equal(JSON.parse(emptyPromptsListResponse("abc")).id, "abc");
      assert.equal(JSON.parse(emptyPromptsListResponse(null)).id, null);
    },
  },
  {
    name: "initialize response advertises prompts capability",
    run: () => {
      const line = JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        result: {
          protocolVersion: "2024-11-05",
          capabilities: { experimental: {}, tools: { listChanged: false } },
          serverInfo: { name: "headroom", version: "1.27.2" },
        },
      });
      const parsed = JSON.parse(routeServerLine(line));
      assert.deepEqual(parsed.result.capabilities.prompts, { listChanged: false });
      assert.deepEqual(parsed.result.capabilities.tools, { listChanged: false });
    },
  },
  {
    name: "probeHeadroom reports available when binary exits 0",
    run: () => {
      const probe = probeHeadroom(process.execPath, ["-e", "process.exit(0)"]);
      assert.equal(probe.available, true, "Probe must report available=true for an exit-0 binary.");
      assert.equal(probe.exitCode, 0, "Probe must report exitCode=0 for an exit-0 binary.");
    },
  },
  {
    name: "probeHeadroom reports non-zero exit code without marking unavailable",
    run: () => {
      const probe = probeHeadroom(process.execPath, ["-e", "process.exit(7)"]);
      assert.equal(probe.available, true, "A binary that exists and runs is available even if it exits non-zero.");
      assert.equal(probe.exitCode, 7, "Probe must surface the non-zero exit code.");
    },
  },
  {
    name: "probeHeadroom reports unavailable when binary is missing",
    run: () => {
      const dir = fs.mkdtempSync(path.join(os.tmpdir(), "oc-headroom-test-"));
      try {
        const isolatedEnv = { ...process.env, PATH: dir };
        const probe = probeHeadroom("oc-headroom-no-such-binary", ["--version"], isolatedEnv);
        assert.equal(probe.available, false, "Probe must report available=false when the binary cannot be located.");
        assert.ok(probe.error != null, "Probe must include an error object describing the spawn failure.");
      } finally {
        fs.rmSync(dir, { recursive: true, force: true });
      }
    },
  },
  {
    name: "wrapper source calls probeHeadroom before spawn and exits 2 or 3 on probe failure",
    run: () => {
      const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
      const source = fs.readFileSync(path.join(root, "tools", "headroom-mcp-wrapper.ts"), "utf8");
      assert(source.includes("probeHeadroom"), "startHeadroomMcpWrapper must call probeHeadroom.");
      assert(source.includes("not found on PATH"), "Missing-binary path must print 'not found on PATH'.");
      assert(source.includes("not usable"), "Present-but-failing path must print 'not usable'.");
      assert(/process\.exit\(2\)/.test(source), "Wrapper must exit 2 on missing binary.");
      assert(/process\.exit\(3\)/.test(source), "Wrapper must exit 3 on failing binary.");
      const startMatch = source.match(/startHeadroomMcpWrapper\(\)[\s\S]{0,1500}/);
      assert(startMatch != null, "Wrapper must define startHeadroomMcpWrapper.");
      const spawnIdx = source.indexOf('spawn("headroom"');
      const probeIdx = source.indexOf("probeHeadroom()");
      assert(spawnIdx > -1, "startHeadroomMcpWrapper must spawn the headroom binary.");
      assert(probeIdx > -1, "startHeadroomMcpWrapper must call probeHeadroom().");
      assert(probeIdx < spawnIdx, "probeHeadroom must run before the spawn call.");
    },
  },
];

let passed = 0;
for (const test of tests) {
  test.run();
  passed += 1;
  console.log(`PASS ${test.name}`);
}

console.log(`OK: headroom MCP wrapper tests=${passed}`);
