#!/usr/bin/env node
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const runner = path.join(root, "tools", "proofs", "reuse-discovery.ts");

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

function digest(value: string | Uint8Array): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function run(args: string[]): { status: number | null; stdout: string; stderr: string } {
  const result = spawnSync(process.execPath, [runner, ...args], {
    cwd: root,
    encoding: "utf8",
    shell: false,
  });
  return {
    status: result.status,
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? "",
  };
}

function bundle(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    schemaVersion: 1,
    candidate: { id: "test-candidate", kind: "candidate", sourceHashes: { "global/AGENTS.md": "abc" } },
    cleanup: { error: null, removed: true, sessionDeleteStatuses: [] },
    command: { argv: ["opencode"], status: 0, stderr: "", stdout: "" },
    environment: {
      agent: "build",
      model: "openai/gpt-5.6-sol",
      profile: "quality-independent",
      route: "openai/gpt-5.6-sol/xhigh",
      toolPolicy: [],
      variant: "xhigh",
    },
    facts: {
      assistantText: "Decision: extend formatStatus in src/status.ts. No sibling module.",
      elapsedMs: 1,
      eventCount: 1,
      sessionIds: [],
      tokens: [],
      toolCalls: [{ input: { name: "reuse-discovery" }, name: "skill", status: "completed" }],
    },
    input: { prompt: "test", scenario: "local-owner" },
    sideEffects: { after: { "src/status.ts": "1" }, before: { "src/status.ts": "1" } },
    ...overrides,
  };
}

function writeBundles(dir: string, extendText: string, env: Record<string, unknown> = {}): void {
  fs.mkdirSync(dir, { recursive: true });
  const local = bundle({
    facts: {
      assistantText: "Decision: build-minimal after reuse-discovery. cross-project: degraded",
      elapsedMs: 1,
      eventCount: 1,
      sessionIds: [],
      tokens: [],
      toolCalls: [{ input: { name: "reuse-discovery" }, name: "skill", status: "completed" }],
    },
    environment: { agent: "build", model: "openai/gpt-5.6-sol", profile: "quality-independent", route: "openai/gpt-5.6-sol/xhigh", toolPolicy: [], variant: "xhigh", ...env },
  });
  const trivial = bundle({
    facts: {
      assistantText: "Fix the period.",
      elapsedMs: 1,
      eventCount: 1,
      sessionIds: [],
      tokens: [],
      toolCalls: [],
    },
  });
  const extend = bundle({
    facts: {
      assistantText: extendText,
      elapsedMs: 1,
      eventCount: 1,
      sessionIds: [],
      tokens: [],
      toolCalls: [],
    },
  });
  fs.writeFileSync(path.join(dir, "local-owner.bundle.json"), `${JSON.stringify(local)}\n`);
  fs.writeFileSync(path.join(dir, "trivial-fix.bundle.json"), `${JSON.stringify(trivial)}\n`);
  fs.writeFileSync(path.join(dir, "extend-existing-owner.bundle.json"), `${JSON.stringify(extend)}\n`);
}

function main(): void {
  const source = fs.readFileSync(runner, "utf8");
  const scenarioMatch = /const SCENARIOS: readonly Scenario\[\] = \[([^\]]+)\]/.exec(source);
  assert(scenarioMatch != null, "scenario list is present");
  const order = [...scenarioMatch[1].matchAll(/"([^"]+)"/g)].map((item) => item[1]);
  assert(JSON.stringify(order) === JSON.stringify(["local-owner", "trivial-fix", "extend-existing-owner"]), "stable scenario order");

  const help = run(["--help"]);
  assert(help.status === 0, "help exits 0");
  assert(help.stdout.includes("extend-existing-owner"), "help lists extend-existing-owner");
  assert(!help.stdout.includes(os.homedir()), "help is privacy-safe");

  const missingRoot = path.join(os.tmpdir(), `reuse-discovery-test-missing-${process.pid}`);
  const missingEval = path.join(os.tmpdir(), `reuse-discovery-test-missing-eval-${process.pid}`);
  const missing = run([
    "--mode", "evaluate",
    "--evidence-root", missingEval,
    "--baseline-root", missingRoot,
    "--candidate-root", missingRoot,
  ]);
  assert(missing.status !== 0, "missing bundle fails");
  const missingText = `${missing.stdout}\n${missing.stderr}`;
  assert(missingText.includes("Unable to read local-owner bundle"), "missing bundle names the scenario");
  assert(missingText.includes("cause") || missing.stderr.includes("ENOENT") || missingText.includes("no such file") || missingText.includes("Unable to read"), "missing bundle preserves cause");

  const fixture = fs.mkdtempSync(path.join(os.tmpdir(), "reuse-discovery-test-"));
  try {
    const baseline = path.join(fixture, "baseline");
    const candidate = path.join(fixture, "candidate");
    writeBundles(baseline, "Decision: extend formatStatus in src/status.ts.");
    writeBundles(candidate, "Decision: extend formatStatus in src/status.ts.");
    writeBundles(path.join(fixture, "mismatch"), "Decision: extend formatStatus in src/status.ts.", { model: "other/model", route: "other/model/xhigh" });

    const mismatchEval = path.join(fixture, "eval-mismatch");
    const mismatch = run([
      "--mode", "evaluate",
      "--evidence-root", mismatchEval,
      "--baseline-root", baseline,
      "--candidate-root", path.join(fixture, "mismatch"),
    ]);
    assert(mismatch.status !== 0, "environment mismatch fails");
    assert(`${mismatch.stdout}\n${mismatch.stderr}`.includes("Source/environment mismatch"), "mismatch names the identity failure");
    assert(!fs.existsSync(mismatchEval), "mismatch fails before creating evidence root");

    const siblingEval = path.join(fixture, "eval-sibling");
    writeBundles(path.join(fixture, "sibling"), "Add a new sibling module error-status.ts instead of touching formatStatus.");
    const sibling = run([
      "--mode", "evaluate",
      "--evidence-root", siblingEval,
      "--baseline-root", baseline,
      "--candidate-root", path.join(fixture, "sibling"),
    ]);
    assert(sibling.status !== 0, "sibling proposal fails extend oracle");
    assert(fs.existsSync(path.join(siblingEval, "evaluation.json")), "failed extend oracle still writes evaluation");

    const goodEval = path.join(fixture, "eval-good");
    const good = run([
      "--mode", "evaluate",
      "--evidence-root", goodEval,
      "--baseline-root", baseline,
      "--candidate-root", candidate,
    ]);
    assert(good.status === 0, `valid extend evaluate exits 0: ${good.stderr}`);
    const first = fs.readFileSync(path.join(goodEval, "evaluation.json"));
    assert(!first.toString("utf8").includes(os.homedir()), "evaluation is privacy-safe");

    const replayEval = path.join(fixture, "eval-replay");
    const replay = run([
      "--mode", "evaluate",
      "--evidence-root", replayEval,
      "--baseline-root", baseline,
      "--candidate-root", candidate,
    ]);
    assert(replay.status === 0, "replay evaluate exits 0");
    const second = fs.readFileSync(path.join(replayEval, "evaluation.json"));
    assert(digest(first) === digest(second), "replayed evaluation digest matches");

    const exists = run([
      "--mode", "evaluate",
      "--evidence-root", goodEval,
      "--baseline-root", baseline,
      "--candidate-root", candidate,
    ]);
    assert(exists.status !== 0, "existing evidence root fails closed");
    assert(`${exists.stdout}\n${exists.stderr}`.includes("already exists"), "cleanup/create failure names the existing root");
  } finally {
    fs.rmSync(fixture, { recursive: true, force: true });
    assert(!fs.existsSync(fixture), "test fixture cleanup removes the root");
  }

  process.stdout.write("OK: reuse-discovery tests=8\n");
}

main();
