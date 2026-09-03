#!/usr/bin/env node
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import assert from "node:assert/strict";

import { runPortableCommand } from "../global/bin/portable-process.ts";
import { loadBeadsReleaseManifest } from "../global/bin/beads-portfolio-bridge/beads-release.ts";
import {
  BeadsAdapterError,
  buildBeadsAdapterInvocation,
  runBeadsAdapter,
} from "../global/bin/beads-portfolio-bridge/beads-vendor-adapter.ts";
import type { BeadsAdapterDependencies, BeadsAdapterRequest } from "../global/bin/beads-portfolio-bridge/beads-vendor-adapter.ts";

const executableSha256 = "b1f3609fea1d9f0f19b2ed49098b3628acfa6ca115aa28b01a1ee178c3a214de";
const bridgeMetadata = {
  bridgeSchemaVersion: 1 as const,
  kaizenSignalRef: "signal:KS-001",
  decisionRef: "decision:KD-001",
  projectRef: "project:KP-001",
  ownerClass: "opencode-kit" as const,
};

type Fixture = {
  dependencies: BeadsAdapterDependencies;
  executable: string;
  log: string;
  marker: string;
  root: string;
  setMode: (mode: string) => void;
};

function fixture(): Fixture {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "beads-adapter-test-"));
  fs.mkdirSync(path.join(root, ".git"));
  fs.mkdirSync(path.join(root, ".beads"));
  const executable = path.join(root, "bd.exe");
  const script = path.join(root, "fake-bd.mjs");
  const log = path.join(root, "argv.jsonl");
  const marker = path.join(root, "write.marker");
  fs.writeFileSync(executable, "fixture", "utf8");
  fs.writeFileSync(script, `
import fs from "node:fs";
const argv = process.argv.slice(2);
fs.appendFileSync(process.env.FAKE_BD_LOG, JSON.stringify(argv) + "\\n");
const commands = new Set(["init", "where", "status", "list", "ready", "show", "create", "dep", "update", "close"]);
const command = argv.find((value) => commands.has(value));
const metadata = {
  bridgeSchemaVersion: 1,
  kaizenSignalRef: "signal:KS-001",
  decisionRef: "decision:KD-001",
  projectRef: "project:KP-001",
  ownerClass: "opencode-kit",
  changeRef: "change:OC-001",
  taskRef: "task:OT-001",
  sessionRef: "session:OS-001"
};
const issue = {
  id: "BPB-abc",
  title: "must-not-pass-through",
  description: "raw-secret-payload",
  status: command === "close" ? "closed" : "open",
  close_reason: command === "close" ? argv[argv.indexOf("--reason") + 1] : "",
  priority: 2,
  issue_type: "feature",
  assignee: command === "update" ? "agent:OA-001" : "",
  external_ref: "signal:KS-001",
  spec_id: command === "update" ? "spec:OC-001" : "",
  metadata,
  dependency_count: 1,
  dependent_count: 2,
  dependencies: command === "ready"
    ? [{ issue_id: "BPB-abc", depends_on_id: "BPB-dep", type: "blocks" }]
    : [{ id: "BPB-dep", status: "closed", issue_type: "feature", dependency_type: "blocks", title: "not-returned" }]
};
if (process.env.FAKE_BD_MODE === "failure") {
  process.stderr.write("project=" + process.cwd() + " token=private-value\\n");
  process.exit(7);
}
if (process.env.FAKE_BD_MODE === "invalid-json") {
  process.stdout.write("{invalid\\n");
  process.exit(0);
}
if (process.env.FAKE_BD_MODE === "oversized") {
  process.stdout.write("x".repeat(250001));
  process.exit(0);
}
if (process.env.FAKE_BD_MODE === "timeout") {
  setTimeout(() => {}, 60_000);
} else if (command === "init") {
  fs.mkdirSync(process.env.BEADS_DIR);
  process.stdout.write("  Repository ID: fixture\\n\\n✓ bd initialized successfully!\\n\\n  Backend: dolt\\n  Mode: embedded\\n  Database: BPB\\n  Issue prefix: BPB\\n");
  process.stderr.write("No Dolt remote configured\\n");
} else if (command === "where") {
  process.stdout.write(JSON.stringify({ path: process.env.BEADS_DIR, prefix: "BPB" }));
} else if (command === "status") {
  process.stdout.write(JSON.stringify({ summary: { total_issues: 4, open_issues: 1, in_progress_issues: 0, blocked_issues: 1, deferred_issues: 0, closed_issues: 2, ready_issues: 1 } }));
} else {
  if (command === "create" || command === "dep" || command === "update" || command === "close") fs.writeFileSync(process.env.FAKE_BD_MARKER, command);
  if (command === "dep") process.stdout.write(JSON.stringify({ issue_id: "BPB-abc", depends_on_id: "BPB-dep", type: "blocks", status: "added", schema_version: 1 }));
  else if (command === "create") process.stdout.write(JSON.stringify(issue));
  else process.stdout.write(JSON.stringify([issue]));
  if (command === "list") process.stderr.write("Showing 1 of 2 issues.\\n");
}
`, "utf8");
  let mode = "success";
  return {
    root,
    executable,
    log,
    marker,
    setMode: (value) => { mode = value; },
    dependencies: {
      inspectExecutable: () => ({ bytes: 145740800, sha256: executableSha256 }),
      runCommand: (cwd, argv, options) => {
        assert.equal(argv[0], executable);
        return runPortableCommand(cwd, [process.execPath, script, ...argv.slice(1)], {
          ...options,
          env: {
            ...options.env,
            FAKE_BD_LOG: log,
            FAKE_BD_MARKER: marker,
            FAKE_BD_MODE: mode,
          },
        });
      },
    },
  };
}

function common(item: Fixture): Pick<BeadsAdapterRequest, "executablePath" | "projectRoot"> {
  return { executablePath: item.executable, projectRoot: item.root };
}

function errorFrom(run: () => unknown): BeadsAdapterError {
  let thrown: unknown;
  try {
    run();
  } catch (error) {
    thrown = error;
  }
  assert.ok(thrown instanceof BeadsAdapterError);
  return thrown as BeadsAdapterError;
}

test("builds only the reviewed closed command surface", () => {
  const root = path.resolve(os.tmpdir(), "beads-plan");
  const executablePath = path.join(root, "bd.exe");
  const base = { executablePath, projectRoot: root };
  const enable = buildBeadsAdapterInvocation({ ...base, operation: "project-enable", prefix: "BPB" });
  assert.deepEqual(enable.argv, [
    "init", "--prefix", "BPB", "--non-interactive", "--skip-agents", "--skip-hooks", "--setup-exclude", "--json", "--sandbox",
  ]);
  const list = buildBeadsAdapterInvocation({ ...base, operation: "list", limit: 5, correlation: { projectRef: "project:KP-001" } });
  assert.deepEqual(list.argv, [
    "--json", "--sandbox", "--readonly", "--quiet", "list", "--type", "feature", "--all", "--limit", "5", "--sort", "id",
    "--metadata-field", "bridgeSchemaVersion=1", "--metadata-field", "projectRef=project:KP-001",
  ]);
  const update = buildBeadsAdapterInvocation({ ...base, operation: "update-feature", id: "BPB-abc", specId: "spec:OC-001", changeRef: "change:OC-001" });
  assert.equal(update.capability, "featureUpdateExact");
  assert.deepEqual(update.argv, [
    "--json", "--sandbox", "--quiet", "update", "BPB-abc", "--spec-id", "spec:OC-001", "--set-metadata", "changeRef=change:OC-001",
  ]);
  const dependency = buildBeadsAdapterInvocation({ ...base, operation: "add-dependency", id: "BPB-abc", dependsOnId: "BPB-dep", relationType: "blocks" });
  assert.equal(dependency.capability, "dependencyAdd");
  assert.deepEqual(dependency.argv, ["--json", "--sandbox", "--quiet", "dep", "add", "BPB-abc", "BPB-dep", "--type", "blocks"]);
  assert.equal(errorFrom(() => buildBeadsAdapterInvocation({ ...base, operation: "prime" })).code, "unsupported-operation");
  assert.throws(() => buildBeadsAdapterInvocation({ ...base, operation: "ready", limit: 1, correlation: {}, argv: ["setup"] }), /fields are invalid/u);
  assert.throws(() => buildBeadsAdapterInvocation({ ...base, operation: "show", id: "--help" }), /bounded Beads identifier/u);
  assert.throws(() => buildBeadsAdapterInvocation({ ...base, operation: "add-dependency", id: "BPB-abc", dependsOnId: "BPB-dep", relationType: "related" }), /closed Beads relation set/u);
  assert.throws(
    () => buildBeadsAdapterInvocation({ ...base, operation: "create-feature", title: "feature", externalRef: "https://unsafe.invalid", metadata: bridgeMetadata }),
    /privacy-safe reference/u,
  );
});

test("invokes the production adapter through the non-shell process owner and returns bounded facts", () => {
  const item = fixture();
  try {
    const readRequests: BeadsAdapterRequest[] = [
      { ...common(item), operation: "project-check" },
      { ...common(item), operation: "project-disable" },
      { ...common(item), operation: "list", limit: 1, correlation: { projectRef: "project:KP-001" } },
      { ...common(item), operation: "ready", limit: 5, correlation: {} },
      { ...common(item), operation: "show", id: "BPB-abc" },
    ];
    for (const request of readRequests) {
      const response = runBeadsAdapter(request, item.dependencies);
      assert.equal(response.schemaVersion, 1);
      assert.equal(response.release.executableSha256, executableSha256);
      assert.equal(response.process.exitCode, 0);
      assert.equal(response.sideEffects.kind, "none");
      assert.equal(response.sideEffects.remote, false);
      assert.equal(response.streams.stdout.truncated, false);
      assert.doesNotMatch(JSON.stringify(response), /raw-secret-payload|must-not-pass-through/u);
    }
    assert.equal(fs.existsSync(item.marker), false, "read-only operations must not invoke the fixture write path");
    const lines = fs.readFileSync(item.log, "utf8").trim().split(/\r?\n/u).map((line) => JSON.parse(line) as string[]);
    assert.deepEqual(lines, readRequests.map((request) => buildBeadsAdapterInvocation(request).argv));
    assert.ok(lines.every((argv) => argv.includes("--readonly")));
    assert.ok(lines.every((argv) => argv.includes("--sandbox")));
    const list = runBeadsAdapter({ ...common(item), operation: "list", limit: 1, correlation: {} }, item.dependencies);
    assert.deepEqual(list.result.kind === "issues" ? list.result.items[0].dependencies : [], [{
      id: "BPB-dep", status: "closed", issueType: "feature", dependencyType: "blocks",
    }]);
    assert.equal(list.result.kind === "issues" && list.result.truncated, true);
  } finally {
    fs.rmSync(item.root, { recursive: true, force: true });
  }
});

test("accepts the pinned init text only with the reviewed tracked block and a direct store", () => {
  const item = fixture();
  try {
    fs.rmSync(path.join(item.root, ".beads"), { recursive: true });
    fs.writeFileSync(path.join(item.root, ".gitignore"), "existing-rule\n", "utf8");
    const rejected = errorFrom(() => runBeadsAdapter({ ...common(item), operation: "project-enable", prefix: "BPB" }, item.dependencies));
    assert.equal(rejected.code, "identity-mismatch");
    const required = loadBeadsReleaseManifest().initialization.requiredTrackedFiles[0]!.content;
    assert.notEqual(required, null);
    fs.appendFileSync(path.join(item.root, ".gitignore"), required!, "utf8");
    const enabled = runBeadsAdapter({ ...common(item), operation: "project-enable", prefix: "BPB" }, item.dependencies);
    assert.deepEqual(enabled.result, { kind: "project", initialized: true, prefix: "BPB" });
    assert.equal(enabled.process.exitCode, 0);
    assert.equal(enabled.streams.stdout.truncated, false);
    assert.match(enabled.diagnostics.messages.join("\n"), /No Dolt remote configured/u);
    assert.equal(fs.lstatSync(path.join(item.root, ".beads")).isDirectory(), true);
  } finally {
    fs.rmSync(item.root, { recursive: true, force: true });
  }
});

test("executes only fixed project-local feature mutations", () => {
  const item = fixture();
  try {
    const requests: BeadsAdapterRequest[] = [
      { ...common(item), operation: "create-feature", title: "Bounded feature", externalRef: "signal:KS-001", metadata: bridgeMetadata },
      { ...common(item), operation: "add-dependency", id: "BPB-abc", dependsOnId: "BPB-dep", relationType: "blocks" },
      { ...common(item), operation: "update-feature", id: "BPB-abc", specId: "spec:OC-001", changeRef: "change:OC-001" },
      { ...common(item), operation: "assign-feature", id: "BPB-abc", assignee: "agent:OA-001", taskRef: "task:OT-001", sessionRef: "session:OS-001" },
      { ...common(item), operation: "close-feature", id: "BPB-abc", reason: "terminal evidence verified" },
    ];
    for (const request of requests) {
      const response = runBeadsAdapter(request, item.dependencies);
      assert.equal(response.sideEffects.kind, "beads-write");
      if (request.operation === "add-dependency") {
        assert.deepEqual(response.result, { kind: "dependency", issueId: "BPB-abc", dependsOnId: "BPB-dep", relationType: "blocks", status: "added" });
      } else {
        assert.equal(response.result.kind, "issues");
        assert.equal(response.result.kind === "issues" ? response.result.items[0].id : null, "BPB-abc");
        if (request.operation === "close-feature") {
          assert.equal(response.result.kind === "issues" ? response.result.items[0].closeReason : null, "terminal evidence verified");
        }
      }
    }
    const lines = fs.readFileSync(item.log, "utf8").trim().split(/\r?\n/u).map((line) => JSON.parse(line) as string[]);
    assert.deepEqual(lines, requests.map((request) => buildBeadsAdapterInvocation(request).argv));
    assert.ok(lines.every((argv) => !argv.includes("--readonly")));
    assert.ok(lines.every((argv) => argv.includes("--sandbox")));
    assert.ok(lines.some((argv) => argv.includes("--repo") && argv.includes(".")));
    assert.ok(lines.every((argv) => !argv.includes("--ignore-schema-skew") && !argv.includes("--stealth")));
  } finally {
    fs.rmSync(item.root, { recursive: true, force: true });
  }
});

test("preserves bounded vendor failures without leaking roots or credentials", () => {
  const item = fixture();
  try {
    item.setMode("failure");
    const failure = errorFrom(() => runBeadsAdapter({ ...common(item), operation: "ready", limit: 1, correlation: {} }, item.dependencies));
    assert.equal(failure.code, "vendor-failed");
    assert.equal(failure.failure?.process.exitCode, 7);
    const serialized = JSON.stringify(failure.failure);
    assert.doesNotMatch(serialized, new RegExp(item.root.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&"), "iu"));
    assert.doesNotMatch(serialized, /private-value/u);
    assert.match(serialized, /token=<redacted>/u);

    item.setMode("invalid-json");
    const invalid = errorFrom(() => runBeadsAdapter({ ...common(item), operation: "show", id: "BPB-abc" }, item.dependencies));
    assert.equal(invalid.code, "invalid-vendor-json");
    assert.equal(invalid.failure?.process.exitCode, 0);

    item.setMode("oversized");
    const oversized = errorFrom(() => runBeadsAdapter({ ...common(item), operation: "ready", limit: 1, correlation: {} }, item.dependencies));
    assert.equal(oversized.code, "output-too-large");
    assert.equal(oversized.failure?.streams.stdout.bytes, 250001);
  } finally {
    fs.rmSync(item.root, { recursive: true, force: true });
  }
});

test("uses owned-tree timeout cleanup and fails closed on unknown liveness", () => {
  const item = fixture();
  try {
    item.setMode("timeout");
    const timedOut = errorFrom(() => runBeadsAdapter({ ...common(item), operation: "ready", limit: 1, correlation: {}, timeoutMs: 1_000 }, item.dependencies));
    assert.equal(timedOut.code, "timeout");
    assert.equal(timedOut.failure?.process.timedOut, true);
    assert.equal(timedOut.failure?.process.cleanupState, "terminal");

    const unknown = errorFrom(() => runBeadsAdapter(
      { ...common(item), operation: "ready", limit: 1, correlation: {} },
      {
        ...item.dependencies,
        runCommand: () => ({
          status: null,
          signal: null,
          cleanupState: "unknown",
          timedOut: true,
          error: new Error("timeout"),
          stdout: "",
          stderr: "",
        }),
      },
    ));
    assert.equal(unknown.code, "writer-liveness-unknown");
  } finally {
    fs.rmSync(item.root, { recursive: true, force: true });
  }
});

test("rejects drifted executable and project identities before starting bd", () => {
  const item = fixture();
  try {
    let started = false;
    const identity = errorFrom(() => runBeadsAdapter(
      { ...common(item), operation: "ready", limit: 1, correlation: {} },
      { runCommand: () => { started = true; throw new Error("must not run"); } },
    ));
    assert.equal(identity.code, "identity-mismatch");
    assert.equal(started, false);
    fs.rmSync(path.join(item.root, ".beads"), { recursive: true, force: true });
    fs.writeFileSync(path.join(item.root, ".gitignore"), "unreviewed\n", "utf8");
    const enable = errorFrom(() => runBeadsAdapter(
      { ...common(item), operation: "project-enable", prefix: "BPB" },
      { ...item.dependencies, runCommand: () => { started = true; throw new Error("must not run"); } },
    ));
    assert.equal(enable.code, "identity-mismatch");
    assert.equal(started, false);
    const project = errorFrom(() => runBeadsAdapter(
      { ...common(item), operation: "show", id: "BPB-abc" },
      { ...item.dependencies, runCommand: () => { started = true; throw new Error("must not run"); } },
    ));
    assert.equal(project.code, "identity-mismatch");
    assert.equal(started, false);
  } finally {
    fs.rmSync(item.root, { recursive: true, force: true });
  }
});
