import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";
import {
  KAIZEN_ENVELOPE_CLOSE,
  KAIZEN_ENVELOPE_OPEN,
  createKaizenFeature,
  createKaizenPluginHooks,
  parseKaizenEnvelope,
} from "../global/plugin/kaizen/index.ts";
import { parseLegacyFeedbackEntry } from "../global/plugin/kaizen/legacy-feedback.ts";
import {
  KAIZEN_LIFECYCLE_BYTES,
  KAIZEN_LIFECYCLE_LIMIT,
  KAIZEN_SIGNAL_BYTES,
  KAIZEN_SIGNAL_LIMIT,
  KaizenError,
  readKaizenInbox,
  resolveKaizenStore,
  type KaizenEnvironment,
  type KaizenSignalInput,
} from "../global/plugin/kaizen/store.ts";

type TestCase = { name: string; run(): Promise<void> | void };

const currentFile = fileURLToPath(import.meta.url);
const tests: TestCase[] = [];
const fixedSignal: KaizenSignalInput = {
  kind: "repetition",
  summary: "Repeated manual proof setup wastes time",
  observedEvidence: "The same setup steps were required in multiple proof runs.",
  impact: "Repeated setup delays the first real signal.",
  likelyCause: "The proof setup has no shared bounded helper.",
  doNotRepeat: "Do not rebuild the same disposable setup manually.",
  scopeHint: "opencode-kit",
  evidenceRefs: ["tools/test-cross-project-kaizen.ts"],
};
const legacyFeedback = `## FB-2026-08-29-stale-open-fixture

Source: main-agent
Role: main-agent
Type: tooling-friction
Severity: medium
Recurrence: unknown
Status: open

### Complaint
Legacy setup still appears to require repeated manual work.

### Context
A historical workflow recorded this before the current candidate changed.

### Evidence From Current Session
The maintained Markdown ledger contains one bounded open entry.

### Impact
Treating written status as current could revive completed work.

### Desired Future
Require current evidence before assigning a terminal or promotion decision.

### Proposed Direction
Import by stable feedback id and leave disposition to explicit triage.

### OpenSpec Follow-Up
maybe`;

function test(name: string, run: TestCase["run"]): void {
  tests.push({ name, run });
}

function fixture(): { root: string; projectA: string; projectB: string; data: string; environment: KaizenEnvironment } {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "cross-project-kaizen-test-"));
  const projectA = path.join(root, "project-a");
  const projectB = path.join(root, "project-b");
  const data = path.join(root, "data");
  fs.mkdirSync(projectA, { recursive: true });
  fs.mkdirSync(projectB, { recursive: true });
  return { root, projectA, projectB, data, environment: { OPENCODE_DATA_DIR: data } };
}

function feature(project: string, environment: KaizenEnvironment) {
  const result = createKaizenFeature({ worktree: project, environment });
  assert(result != null, "Kaizen feature should be enabled by default");
  return result;
}

function envelope(input: KaizenSignalInput | KaizenSignalInput[] | null): string {
  const signals = input == null ? [] : Array.isArray(input) ? input : [input];
  return `${KAIZEN_ENVELOPE_OPEN}\n${JSON.stringify({ schemaVersion: 1, signals })}\n${KAIZEN_ENVELOPE_CLOSE}`;
}

function hasCode(code: string): (error: unknown) => boolean {
  return (error) => error instanceof KaizenError && error.code === code;
}

function captureContext(sourceEventRef: string, session = sourceEventRef) {
  return {
    sourceEventRef,
    sessionRef: `session_${crypto.createHash("sha256").update(session).digest("hex").slice(0, 32)}`,
  };
}

function worker(project: string, data: string, index: string, sourceRef = `explicit:worker-${index}`): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [currentFile, "--worker", project, data, index, sourceRef], {
      cwd: path.dirname(currentFile),
      env: process.env,
      shell: false,
      stdio: ["ignore", "pipe", "pipe"],
      windowsHide: true,
    });
    const stderr: Buffer[] = [];
    child.stderr.on("data", (chunk: Buffer) => stderr.push(chunk));
    child.once("error", reject);
    child.once("close", (status) => status === 0 ? resolve() : reject(new Error(`Kaizen worker ${index} failed (${status}): ${Buffer.concat(stderr).toString("utf8")}`)));
  });
}

async function runWorker(): Promise<void> {
  const [, project, data, index, sourceRef] = process.argv.slice(2);
  if (project == null || data == null || index == null || sourceRef == null) throw new Error("Kaizen worker arguments are incomplete");
  await feature(project, { OPENCODE_DATA_DIR: data }).capture(fixedSignal, "explicit", captureContext(sourceRef, `worker-${index}`), new Date(`2026-08-29T10:00:${String(Number(index)).padStart(2, "0")}.000Z`));
}

test("disabled mode exposes no feature, hooks, or writes", () => {
  const item = fixture();
  try {
    const environment = { OPENCODE_DATA_DIR: item.data, OPENCODE_KAIZEN: "0" };
    assert.equal(createKaizenFeature({ worktree: item.projectA, environment }), null);
    assert.deepEqual(createKaizenPluginHooks({}, environment), {});
    assert.equal(fs.existsSync(item.data), false);
  } finally {
    fs.rmSync(item.root, { recursive: true, force: true });
  }
});

test("explicit capture redacts the project root and folds lifecycle state", async () => {
  const item = fixture();
  try {
    const current = feature(item.projectA, item.environment);
    const captured = await current.capture({
      ...fixedSignal,
      summary: `Repeated setup under ${item.projectA}`,
      observedEvidence: `Absolute root ${item.projectA} was copied into notes.`,
    }, "explicit", captureContext("explicit:redaction-r1"), new Date("2026-08-29T10:00:00.000Z"));
    assert.equal(captured.action, "captured");
    const before = await current.status();
    assert.equal(before.signals.length, 1);
    assert.match(before.signals[0]!.summary, /<project-root>/u);
    assert.match(before.signals[0]!.observedEvidence, /<project-root>/u);
    assert.equal(before.signals[0]!.impact, fixedSignal.impact);
    assert.equal(before.signals[0]!.likelyCause, fixedSignal.likelyCause);
    assert.equal(before.signals[0]!.doNotRepeat, fixedSignal.doNotRepeat);
    assert.equal(before.signals[0]!.scopeHint, fixedSignal.scopeHint);
    assert.match(before.signals[0]!.projectRef, /^project_[a-f0-9]{32}$/u);
    assert.match(before.signals[0]!.sessionRef, /^session_[a-f0-9]{32}$/u);
    assert.equal(JSON.stringify(before).includes(item.projectA), false);
    const transitioned = await current.transition({ signalRef: captured.signalRef, status: "triaged", note: "Assigned for review." }, new Date("2026-08-29T10:01:00.000Z"));
    assert.equal(transitioned.status, "triaged");
    const after = await current.status({ statuses: ["triaged"] });
    assert.equal(after.counts.triaged, 1);
    assert.equal(after.signals[0]!.status, "triaged");
  } finally {
    fs.rmSync(item.root, { recursive: true, force: true });
  }
});

test("strict input bounds reject unsafe references, extras, and overlong summaries", async () => {
  const item = fixture();
  try {
    const current = feature(item.projectA, item.environment);
    await assert.rejects(current.capture({ ...fixedSignal, evidenceRefs: ["C:/Users/private/evidence.txt"] }, "explicit", captureContext("explicit:unsafe-ref")), hasCode("unsafe-reference"));
    await assert.rejects(current.capture({ ...fixedSignal, summary: "x".repeat(2_000) }, "explicit", captureContext("explicit:long-summary")), hasCode("record-too-large"));
    await assert.rejects(current.capture({ ...fixedSignal, extra: "no" } as KaizenSignalInput, "explicit", captureContext("explicit:extra-field")), hasCode("malformed-record"));
    assert.equal(fs.existsSync(item.data), false);
    await current.capture({
      ...fixedSignal,
      summary: "s".repeat(1_000),
      observedEvidence: "e".repeat(2_000),
      impact: "i".repeat(1_000),
      likelyCause: "c".repeat(1_000),
      doNotRepeat: "d".repeat(1_000),
      evidenceRefs: Array.from({ length: 8 }, (_, index) => `evidence/ref-${index}-${"r".repeat(120)}`),
    }, "explicit", captureContext("explicit:near-limit"));
    const store = resolveKaizenStore({ worktree: item.projectA, environment: item.environment });
    assert(store != null);
    const signalFile = path.join(store.storeRoot, "signals", "signal-0000.json");
    assert.equal(fs.statSync(signalFile).size <= KAIZEN_SIGNAL_BYTES, true);
  } finally {
    fs.rmSync(item.root, { recursive: true, force: true });
  }
});

test("cross-project concurrent append deduplicates by normalized fingerprint", async () => {
  const item = fixture();
  try {
    const first = feature(item.projectA, item.environment);
    const second = feature(item.projectB, item.environment);
    await Promise.all([
      first.capture(fixedSignal, "explicit", captureContext("explicit:project-a"), new Date("2026-08-29T10:00:00.000Z")),
      second.capture({ ...fixedSignal, summary: "  repeated manual proof setup   wastes time  " }, "explicit", captureContext("explicit:project-b"), new Date("2026-08-29T10:00:01.000Z")),
    ]);
    const status = await first.status();
    assert.equal(status.signals.length, 1);
    assert.equal(status.signals[0]!.occurrenceCount, 2);
    assert.equal(status.signals[0]!.projectRefs.length, 2);
    assert.equal(status.counts.events, 2);
  } finally {
    fs.rmSync(item.root, { recursive: true, force: true });
  }
});

test("multi-process append preserves every fixed-slot event", async () => {
  const item = fixture();
  try {
    await Promise.all(Array.from({ length: 8 }, (_, index) => worker(index % 2 === 0 ? item.projectA : item.projectB, item.data, String(index))));
    const status = await feature(item.projectA, item.environment).status();
    assert.equal(status.counts.events, 8);
    assert.equal(status.signals.length, 1);
    assert.equal(status.signals[0]!.occurrenceCount, 8);
    assert.equal(status.signals[0]!.projectRefs.length, 2);
  } finally {
    fs.rmSync(item.root, { recursive: true, force: true });
  }
});

test("multi-process replay of one source creates one signal record", async () => {
  const item = fixture();
  try {
    await Promise.all(Array.from({ length: 8 }, (_, index) => worker(item.projectA, item.data, String(index), "explicit:shared-replay")));
    const status = await feature(item.projectA, item.environment).status();
    assert.equal(status.counts.signalRecords, 1);
    assert.equal(status.signals.length, 1);
    assert.equal(status.signals[0]!.occurrenceCount, 1);
  } finally {
    fs.rmSync(item.root, { recursive: true, force: true });
  }
});

test("legacy feedback source refs are idempotent while distinct recurrence increments", async () => {
  const item = fixture();
  try {
    const current = feature(item.projectA, item.environment);
    const first = await current.capture(fixedSignal, "legacy-feedback", captureContext("legacy-feedback:feedback-1"), new Date("2026-08-29T10:00:00.000Z"));
    const duplicate = await current.capture(fixedSignal, "legacy-feedback", captureContext("legacy-feedback:feedback-1"), new Date("2026-08-29T10:00:01.000Z"));
    const recurrence = await current.capture(fixedSignal, "explicit", captureContext("explicit:recurrence"), new Date("2026-08-29T10:00:02.000Z"));
    assert.equal(first.action, "captured");
    assert.equal(duplicate.action, "deduplicated");
    assert.equal(duplicate.occurrenceCount, 1);
    assert.equal(recurrence.occurrenceCount, 2);
    assert.equal((await current.status()).counts.events, 2);
  } finally {
    fs.rmSync(item.root, { recursive: true, force: true });
  }
});

test("diagnostics are append-only, idempotent, and bounded in status", async () => {
  const item = fixture();
  try {
    const current = feature(item.projectA, item.environment);
    await current.diagnostic("compaction", "compaction:event-1:invalid", "compaction-envelope-invalid", new Date("2026-08-29T10:00:00.000Z"));
    await current.diagnostic("compaction", "compaction:event-1:invalid", "compaction-envelope-invalid", new Date("2026-08-29T10:00:01.000Z"));
    const status = await current.status();
    assert.equal(status.counts.diagnostics, 1);
    assert.equal(status.counts.events, 1);
    assert.equal(status.diagnostics[0]!.code, "compaction-envelope-invalid");
  } finally {
    fs.rmSync(item.root, { recursive: true, force: true });
  }
});

test("status ordering and truncation are deterministic", async () => {
  const item = fixture();
  try {
    const current = feature(item.projectA, item.environment);
    for (let index = 0; index < 3; index += 1) {
      await current.capture({ ...fixedSignal, summary: `Distinct signal ${index}` }, "explicit", captureContext(`explicit:distinct-${index}`), new Date(`2026-08-29T10:00:0${index}.000Z`));
    }
    const status = await current.status({ limit: 2 });
    assert.equal(status.totalSignals, 3);
    assert.equal(status.signals.length, 2);
    assert.equal(status.truncated, true);
    assert.equal(status.truncation.signals, true);
    assert.equal(status.truncation.checkpoints, false);
    assert.equal(status.signals[0]!.summary, "Distinct signal 0");
  } finally {
    fs.rmSync(item.root, { recursive: true, force: true });
  }
});

test("malformed and partial persisted state stays quarantined and blocks append", async () => {
  const item = fixture();
  try {
    const store = resolveKaizenStore({ worktree: item.projectA, environment: item.environment });
    assert(store != null);
    const signalRoot = path.join(store.storeRoot, "signals");
    fs.mkdirSync(signalRoot, { recursive: true });
    const malformedFile = path.join(signalRoot, "signal-0000.json");
    fs.writeFileSync(malformedFile, "{not-json", "utf8");
    await assert.rejects(readKaizenInbox(store), hasCode("store-read"));
    await assert.rejects(feature(item.projectA, item.environment).capture(fixedSignal, "explicit", captureContext("explicit:blocked-by-partial")), hasCode("store-read"));
    assert.equal(fs.readFileSync(malformedFile, "utf8"), "{not-json");
    assert.deepEqual(fs.readdirSync(signalRoot), ["signal-0000.json"]);
  } finally {
    fs.rmSync(item.root, { recursive: true, force: true });
  }
});

test("fixed 2,000-signal capacity rejects another signal without overwrite", async () => {
  const item = fixture();
  try {
    const store = resolveKaizenStore({ worktree: item.projectA, environment: item.environment });
    assert(store != null);
    assert.equal(KAIZEN_SIGNAL_LIMIT, 2_000);
    assert.equal(KAIZEN_SIGNAL_BYTES, 16 * 1024);
    const signalRoot = path.join(store.storeRoot, "signals");
    fs.mkdirSync(signalRoot, { recursive: true });
    const fingerprint = crypto.createHash("sha256").update("repetition\0capacity signal").digest("hex");
    for (let index = 0; index < KAIZEN_SIGNAL_LIMIT; index += 1) {
      const record = {
        schemaVersion: 1,
        event: "capture",
        eventRef: `event_${String(index).padStart(32, "0")}`,
        signalRef: `signal_${fingerprint.slice(0, 32)}`,
        sourceEventRef: `explicit:capacity-${index}`,
        dedupFingerprint: fingerprint,
        source: "explicit",
        projectRef: store.projectRef,
        sessionRef: captureContext(`explicit:capacity-${index}`).sessionRef,
        kind: "repetition",
        summary: "Capacity signal",
        observedEvidence: "Capacity fixture",
        impact: "Capacity fixture",
        likelyCause: "Capacity fixture",
        doNotRepeat: "Capacity fixture",
        scopeHint: "opencode-kit",
        evidenceRefs: ["tools/test-cross-project-kaizen.ts"],
        createdAt: "2026-08-29T10:00:00.000Z",
      };
      fs.writeFileSync(path.join(signalRoot, `signal-${String(index).padStart(4, "0")}.json`), `${JSON.stringify(record)}\n`, { flag: "wx" });
    }
    await assert.rejects(feature(item.projectA, item.environment).capture(fixedSignal, "explicit", captureContext("explicit:over-capacity")), hasCode("capacity"));
    assert.equal(fs.readdirSync(signalRoot).length, KAIZEN_SIGNAL_LIMIT);
  } finally {
    fs.rmSync(item.root, { recursive: true, force: true });
  }
});

test("fixed 8,000-lifecycle capacity rejects another event without overwrite", async () => {
  const item = fixture();
  try {
    const current = feature(item.projectA, item.environment);
    const captured = await current.capture(fixedSignal, "explicit", captureContext("explicit:lifecycle-capacity"));
    const store = resolveKaizenStore({ worktree: item.projectA, environment: item.environment });
    assert(store != null);
    assert.equal(KAIZEN_LIFECYCLE_LIMIT, 8_000);
    assert.equal(KAIZEN_LIFECYCLE_BYTES, 4 * 1024);
    const eventRoot = path.join(store.storeRoot, "events");
    fs.mkdirSync(eventRoot, { recursive: true });
    for (let index = 0; index < KAIZEN_LIFECYCLE_LIMIT; index += 1) {
      const record = {
        schemaVersion: 1,
        event: "diagnostic",
        eventRef: `event_${String(index).padStart(32, "0")}`,
        diagnosticRef: `diagnostic_${String(index).padStart(32, "0")}`,
        sourceEventRef: `explicit:lifecycle-capacity-${index}`,
        source: "explicit",
        projectRef: store.projectRef,
        code: "capacity-probe",
        createdAt: "2026-08-29T10:00:00.000Z",
      };
      fs.writeFileSync(path.join(eventRoot, `event-${String(index).padStart(6, "0")}.json`), `${JSON.stringify(record)}\n`, { flag: "wx" });
    }
    await assert.rejects(current.transition({ signalRef: captured.signalRef, status: "triaged" }), hasCode("capacity"));
    assert.equal(fs.readdirSync(eventRoot).length, KAIZEN_LIFECYCLE_LIMIT);
  } finally {
    fs.rmSync(item.root, { recursive: true, force: true });
  }
});

test("compaction envelope accepts exactly zero to three signals", () => {
  assert.deepEqual(parseKaizenEnvelope(envelope(fixedSignal)), [fixedSignal]);
  assert.deepEqual(parseKaizenEnvelope(envelope(null)), []);
  assert.equal(parseKaizenEnvelope(envelope([fixedSignal, fixedSignal, fixedSignal])).length, 3);
  assert.throws(() => parseKaizenEnvelope(envelope([fixedSignal, fixedSignal, fixedSignal, fixedSignal])), /schema is invalid/u);
  assert.throws(() => parseKaizenEnvelope("no envelope"), /exactly one/u);
  assert.throws(() => parseKaizenEnvelope(`${envelope(null)}\n${envelope(null)}`), /exactly one/u);
  assert.throws(() => parseKaizenEnvelope(`${KAIZEN_ENVELOPE_OPEN}{bad${KAIZEN_ENVELOPE_CLOSE}`), /valid JSON/u);
  assert.throws(() => parseKaizenEnvelope(`${KAIZEN_ENVELOPE_OPEN}${JSON.stringify({ schemaVersion: 1, signal: null, extra: true })}${KAIZEN_ENVELOPE_CLOSE}`), /unsupported keys/u);
});

test("compaction hook appends one strict Kaizen contract without replacing the prompt", async () => {
  const item = fixture();
  try {
    const hooks = createKaizenPluginHooks({
      directory: item.projectA,
      project: { worktree: item.projectA },
      client: { session: {
        async get() { return { data: { id: "session_compaction_context", directory: item.projectA } }; },
        async messages() { return { data: [] }; },
      } },
    }, item.environment) as Record<string, unknown>;
    const compacting = hooks["experimental.session.compacting"] as (input: unknown, output: { context: string[]; prompt?: string }) => Promise<void>;
    assert.equal(typeof compacting, "function");
    const output = { context: ["existing compaction context"], prompt: "keep the configured prompt" };
    await compacting({ sessionID: "session_compaction_context" }, output);
    assert.equal(output.prompt, "keep the configured prompt");
    assert.equal(output.context[0], "existing compaction context");
    assert.equal(output.context.length, 2);
    const contract = output.context[1] ?? "";
    assert.equal(contract.split(KAIZEN_ENVELOPE_OPEN).length - 1, 1);
    assert.equal(contract.split(KAIZEN_ENVELOPE_CLOSE).length - 1, 1);
    assert.match(contract, /"schemaVersion":1,"signals":\[\]/u);
    assert.match(contract, /kind, summary, observedEvidence, impact, likelyCause, doNotRepeat, scopeHint, evidenceRefs/u);
    assert.match(contract, /signals: \[\]/u);
    assert.equal(contract.includes("```"), false);
  } finally {
    fs.rmSync(item.root, { recursive: true, force: true });
  }
});

test("compaction capture accepts MSBuild property switches without weakening path rejection", async () => {
  const item = fixture();
  try {
    const sessionID = "session_kaizen_msbuild_switch";
    const signals: KaizenSignalInput[] = [
      {
        kind: "process-gap",
        summary: "Delphi 2010 documented Rebuild reads EnvOptions.proj Win32LibraryPath, not HKCU Library Search Path",
        observedEvidence: "Registry already listed TMS/Alpha/Raize; msbuild dcc32 -U still only RC5 until EnvOptions.proj was edited",
        impact: "False install completion caused extra Rebuild cycles.",
        likelyCause: "Assumed the BDS registry was the MSBuild unit-path owner.",
        doNotRepeat: "Read EnvOptions.proj before changing the registry search path.",
        scopeHint: "current-project",
        evidenceRefs: ["AGENTS.md", "cnc_m.dproj"],
      },
      {
        kind: "tooling-gap",
        summary: "MSBuild 2.0 splits semicolon /p:DCC_UnitSearchPath as another switch (MSB1006)",
        observedEvidence: "The licensed cnc_m Rebuild failed immediately with MSB1006.",
        impact: "The intended one-shot path override was blocked.",
        likelyCause: "MSBuild 2.0 property parsing conflicts with Delphi semicolon unit paths.",
        doNotRepeat: "Do not pass semicolon-delimited Delphi unit paths via /p: to this MSBuild 2.0.",
        scopeHint: "current-project",
        evidenceRefs: ["cnc_m.dproj"],
      },
    ];
    const hooks = createKaizenPluginHooks({
      directory: item.projectA,
      project: { worktree: item.projectA },
      client: { session: {
        async get() { return { data: { id: sessionID, directory: item.projectA } }; },
        async messages() {
          return { data: [{ info: { id: "message_summary_msbuild_switch", role: "assistant", sessionID, summary: true, time: { created: 1 } }, parts: [{ type: "text", text: envelope(signals) }] }] };
        },
      } },
    }, item.environment) as Record<string, unknown>;
    const warnings: string[] = [];
    const previous = console.warn;
    console.warn = (...args: unknown[]) => { warnings.push(args.join(" ")); };
    try {
      await (hooks.event as (input: unknown) => Promise<void>)({ event: { id: "event_msbuild_switch", type: "session.compacted", properties: { sessionID } } });
    } finally {
      console.warn = previous;
    }
    const status = await feature(item.projectA, item.environment).status();
    assert.equal(status.counts.signals, 2);
    assert.equal(status.counts.diagnostics, 0);
    assert.equal(status.signals.every((signal) => signal.sources.includes("compaction")), true);
    assert.deepEqual(warnings, []);
  } finally {
    fs.rmSync(item.root, { recursive: true, force: true });
  }
});

test("legacy feedback parser accepts only the maintained bounded entry format", () => {
  const parsed = parseLegacyFeedbackEntry(legacyFeedback, "docs/feedbacks/main-agent.md");
  assert.equal(parsed.feedbackId, "FB-2026-08-29-stale-open-fixture");
  assert.equal(parsed.legacyStatus, "open");
  assert.equal(parsed.signal.kind, "tooling-gap");
  assert.equal(parsed.signal.scopeHint, "unknown");
  assert.deepEqual(parsed.signal.evidenceRefs, ["docs/feedbacks/main-agent.md"]);
  assert.match(parsed.signal.observedEvidence, /written status open/u);
  assert.equal(parsed.signal.observedEvidence.includes("Status: open"), false);
  assert.throws(() => parseLegacyFeedbackEntry(`${legacyFeedback}\n\n### Unexpected\nvalue`, "docs/feedbacks/main-agent.md"), /unsupported trailing section/u);
  assert.throws(() => parseLegacyFeedbackEntry(legacyFeedback, "../private.md"), /repository-relative/u);
});

test("plugin report, status, decision, checkpoint, and compaction share one bounded store", async () => {
  const item = fixture();
  try {
    const sessionID = "session_kaizen_root_valid";
    const hooks = createKaizenPluginHooks({
      directory: item.projectA,
      project: { worktree: item.projectA },
      client: { session: {
        async get() { return { data: { id: sessionID, directory: item.projectA } }; },
        async messages() {
          return { data: [{ info: { id: "message_summary_valid", role: "assistant", sessionID, summary: true, time: { created: 1 } }, parts: [{ type: "text", text: envelope(fixedSignal) }] }] };
        },
      } },
    }, item.environment) as Record<string, unknown>;
    const tools = hooks.tool as Record<string, { execute(args: unknown, context: unknown): Promise<unknown> }>;
    assert.deepEqual(Object.keys(tools).sort(), ["kaizen_checkpoint", "kaizen_decision", "kaizen_import_feedback", "kaizen_report", "kaizen_status"]);
    const toolContext = (messageID: string) => ({
      directory: item.projectA,
      sessionID,
      messageID,
      metadata(_value: unknown) {},
    });
    const report = await tools.kaizen_report!.execute(
      { input: { ...fixedSignal, summary: "Explicit companion signal" } },
      toolContext("message_explicit_valid"),
    ) as { output: string };
    const signalRef = (JSON.parse(report.output) as { signalRef: string }).signalRef;
    const decision = await tools.kaizen_decision!.execute({ input: {
      signalRef,
      decision: "needs-investigation",
      evidenceRefs: ["tools/test-cross-project-kaizen.ts"],
      ownerClass: "unknown",
      nextBoundaryOrTerminalReason: "Inspect the copied-plugin boundary.",
    } }, toolContext("message_decision_valid")) as { output: string };
    assert.match((JSON.parse(decision.output) as { decisionRef: string }).decisionRef, /^decision_[a-f0-9]{32}$/u);
    await assert.rejects(tools.kaizen_decision!.execute({ input: {
      signalRef,
      decision: "kit-candidate",
      evidenceRefs: ["tools/test-cross-project-kaizen.ts"],
      ownerClass: "unknown",
      nextBoundaryOrTerminalReason: "Owner is still unknown.",
    } }, toolContext("message_decision_unknown_owner")), /requires a needs-investigation decision/u);
    const pendingResult = await tools.kaizen_checkpoint!.execute({ input: {
      changeRef: "add-cross-project-kaizen-loop",
      status: "harvest-pending",
    } }, toolContext("message_checkpoint_pending")) as { output: string };
    const checkpointRef = (JSON.parse(pendingResult.output) as { checkpointRef: string }).checkpointRef;
    const repeatedPending = await tools.kaizen_checkpoint!.execute({ input: {
      changeRef: "add-cross-project-kaizen-loop",
      status: "harvest-pending",
    } }, toolContext("message_checkpoint_pending_repeated")) as { output: string };
    assert.equal((JSON.parse(repeatedPending.output) as { checkpointRef: string }).checkpointRef, checkpointRef);
    await tools.kaizen_checkpoint!.execute({ input: {
      changeRef: "add-cross-project-kaizen-loop",
      checkpointRef,
      status: "no-signal",
    } }, toolContext("message_checkpoint_closed"));
    const archivePending = await tools.kaizen_checkpoint!.execute({ input: {
      changeRef: "add-cross-project-kaizen-loop",
      status: "harvest-pending",
    } }, toolContext("message_archive_pending")) as { output: string };
    const archiveCheckpointRef = (JSON.parse(archivePending.output) as { checkpointRef: string }).checkpointRef;
    await tools.kaizen_checkpoint!.execute({ input: {
      changeRef: "add-cross-project-kaizen-loop",
      checkpointRef: archiveCheckpointRef,
      status: "captured",
      signals: [{ ...fixedSignal, summary: "Archive reflection found repeated setup" }],
    } }, toolContext("message_archive_captured"));
    await (hooks.event as (input: unknown) => Promise<void>)({ event: { id: "event_compacted_valid", type: "session.compacted", properties: { sessionID } } });
    await (hooks.event as (input: unknown) => Promise<void>)({ event: { id: "event_compacted_valid", type: "session.compacted", properties: { sessionID } } });
    const status = await feature(item.projectA, item.environment).status();
    assert.equal(status.counts.signals, 3);
    assert.equal(status.counts.signalRecords, 3);
    assert.equal(status.counts.decisions, 1);
    assert.equal(status.counts.checkpoints, 2);
    assert.equal(status.checkpoints.some((checkpoint) => checkpoint.status === "no-signal"), true);
    assert.equal(status.checkpoints.some((checkpoint) => checkpoint.status === "captured"), true);
    assert.equal(status.signals.some((signal) => signal.sources.includes("compaction")), true);
    assert.equal(status.signals.some((signal) => signal.sources.includes("archive")), true);
    const statusResult = await tools.kaizen_status!.execute({ limit: 25 }, toolContext("message_status_valid")) as { output: string };
    assert.equal(statusResult.output.includes(fixedSignal.summary), false);
    assert.equal(statusResult.output.includes(fixedSignal.observedEvidence), false);
    assert.equal(statusResult.output.includes(fixedSignal.impact), false);
    assert.equal(statusResult.output.includes(fixedSignal.likelyCause), false);
    assert.equal(statusResult.output.includes(fixedSignal.doNotRepeat), false);
    for (const evidenceRef of fixedSignal.evidenceRefs) assert.equal(statusResult.output.includes(evidenceRef), false);
    const projection = JSON.parse(statusResult.output) as { activation: string; counts: { signals: number }; ordering: string; proposalOwner: { proposalCreationAllowed: boolean; state: string }; checkpoints: Array<{ status: string }>; repairGaps: unknown[]; signals: Array<{ scopeHint: string }>; truncation: { signals: boolean } };
    assert.equal(projection.activation, "enabled");
    assert.equal(projection.counts.signals, 3);
    assert.equal(projection.ordering, "oldest-createdAt-then-signalRef");
    assert.deepEqual(projection.proposalOwner, { proposalCreationAllowed: false, state: "unconfigured" });
    assert.equal(projection.checkpoints.some((checkpoint) => checkpoint.status === "no-signal"), true);
    assert.deepEqual(projection.repairGaps, []);
    assert.equal(projection.truncation.signals, false);
    assert.equal(projection.signals[0]!.scopeHint, fixedSignal.scopeHint);
    await assert.rejects(tools.kaizen_status!.execute({ limit: 26 }, toolContext("message_status_over_limit")), /between 1 and 25/u);
  } finally {
    fs.rmSync(item.root, { recursive: true, force: true });
  }
});

test("detailed triage is contained to the configured proposal-owner root or the current signal origin", async () => {
  const item = fixture();
  try {
    const environment = { ...item.environment, OPENCODE_KAIZEN_PROPOSAL_OWNER_ROOT: item.projectA };
    await feature(item.projectA, environment).capture(
      { ...fixedSignal, summary: "Owner-root Kaizen proposal candidate" },
      "explicit",
      captureContext("explicit:proposal-owner"),
      new Date("2026-08-29T12:00:00.000Z"),
    );
    await feature(item.projectB, environment).capture(
      { ...fixedSignal, summary: "Consumer-local Kaizen investigation" },
      "explicit",
      captureContext("explicit:proposal-consumer"),
      new Date("2026-08-29T12:00:01.000Z"),
    );
    const hooks = (project: string, configuredEnvironment: KaizenEnvironment) => createKaizenPluginHooks({
      directory: project,
      project: { worktree: project },
      client: { session: {
        async get() { return { data: null }; },
        async messages() { return { data: [] }; },
      } },
    }, configuredEnvironment) as Record<string, unknown>;
    const tools = (project: string, configuredEnvironment: KaizenEnvironment) => hooks(project, configuredEnvironment).tool as Record<string, { execute(args: unknown, context: unknown): Promise<{ output: string }> }>;
    const context = (project: string, messageID: string) => ({ directory: project, sessionID: "session_kaizen_proposal_boundary", messageID, metadata(_value: unknown) {} });

    const ownerTools = tools(item.projectA, environment);
    const ownerDefault = JSON.parse((await ownerTools.kaizen_status!.execute({ details: false, limit: 25 }, context(item.projectA, "message_owner_default"))).output) as { proposalOwner: { state: string }; signals: unknown[] };
    assert.equal(ownerDefault.proposalOwner.state, "current-root");
    assert.equal(JSON.stringify(ownerDefault).includes("Owner-root Kaizen proposal candidate"), false);
    const ownerDetails = JSON.parse((await ownerTools.kaizen_status!.execute({ details: true, limit: 25, scope: "cross-project", statuses: ["pending"] }, context(item.projectA, "message_owner_details"))).output) as { proposalOwner: { proposalCreationAllowed: boolean }; selection: { details: boolean; scope: string; totalSignals: number }; signals: Array<{ summary: string }> };
    assert.equal(ownerDetails.proposalOwner.proposalCreationAllowed, true);
    assert.deepEqual(ownerDetails.selection, { details: true, scope: "cross-project", totalSignals: 2 });
    assert.deepEqual(ownerDetails.signals.map((signal) => signal.summary), ["Owner-root Kaizen proposal candidate", "Consumer-local Kaizen investigation"]);

    const consumerTools = tools(item.projectB, environment);
    await assert.rejects(
      consumerTools.kaizen_status!.execute({ details: true, limit: 25, scope: "cross-project" }, context(item.projectB, "message_consumer_cross_project")),
      /configured proposal-owner root/u,
    );
    const consumerDetails = JSON.parse((await consumerTools.kaizen_status!.execute({ details: true, limit: 25, scope: "current-project" }, context(item.projectB, "message_consumer_details"))).output) as { proposalOwner: { state: string }; selection: { totalSignals: number }; signals: Array<{ summary: string }> };
    assert.equal(consumerDetails.proposalOwner.state, "different-root");
    assert.equal(consumerDetails.selection.totalSignals, 1);
    assert.deepEqual(consumerDetails.signals.map((signal) => signal.summary), ["Consumer-local Kaizen investigation"]);

    const invalidTools = tools(item.projectB, { ...item.environment, OPENCODE_KAIZEN_PROPOSAL_OWNER_ROOT: "relative-owner" });
    const invalid = JSON.parse((await invalidTools.kaizen_status!.execute({ limit: 25 }, context(item.projectB, "message_invalid_owner"))).output) as { proposalOwner: { state: string } };
    assert.equal(invalid.proposalOwner.state, "invalid");
  } finally {
    fs.rmSync(item.root, { recursive: true, force: true });
  }
});

test("global Kaizen commands preserve bounded manual triage and owner-root proposal containment", () => {
  const repositoryRoot = path.resolve(path.dirname(currentFile), "..");
  const statusCommand = fs.readFileSync(path.join(repositoryRoot, "global", "commands", "kaizen-status.md"), "utf8");
  const triageCommand = fs.readFileSync(path.join(repositoryRoot, "global", "commands", "kaizen-triage.md"), "utf8");
  assert.match(statusCommand, /`limit: 25`, `details: false`/u);
  assert.match(statusCommand, /Do not request triage details, append a decision, create a proposal/u);
  assert.match(triageCommand, /at most 25/u);
  assert.match(triageCommand, /proposal-owner state is `current-root`/u);
  assert.match(triageCommand, /never request cross-project details outside the configured owner root/u);
  assert.match(triageCommand, /Unknown ownership permits only `needs-investigation`/u);
  assert.match(triageCommand, /Load `openspec-propose` and follow its complete workflow/u);
  assert.match(triageCommand, /create at most one ordinary OpenSpec proposal/u);
  assert.match(triageCommand, /perform no cross-repository mutation/u);
  assert.match(triageCommand, /Do not auto-apply, archive, commit, push, open a remote issue/u);
});

test("synthetic credentials and private paths are absent from bounded status output", async () => {
  const item = fixture();
  try {
    const credential = "sk-proj-abcdefghijklmnopqrstuvwxyz";
    const environment = { ...item.environment, OPENCODE_KAIZEN_PROPOSAL_OWNER_ROOT: item.projectA };
    const current = feature(item.projectA, environment);
    for (const [sourceEventRef, observedEvidence] of [
      ["explicit:privacy-delimited-drive", "notes=D:\\private\\other\\secrets.env"],
      ["explicit:privacy-drive-switch-segment", "notes=C:/p:Users"],
      ["explicit:privacy-delimited-posix", "notes=/private/other/secrets.env"],
      ["explicit:privacy-delimited-unc", "notes=\\\\private-host\\share\\secrets.env"],
      ["explicit:privacy-delimited-forward-unc", "notes=//private-host/share/secrets.env"],
      ["explicit:privacy-json-forward-unc", "{\"path\":\"//private-host/share/secrets.env\"}"],
      ["explicit:privacy-backtick-drive", "`D:\\private\\other\\secrets.env`"],
      ["explicit:privacy-colon-backslash-unc", "notes:\\\\private-host\\share\\secrets.env"],
      ["explicit:privacy-rooted-backslash", "notes=/p:Foo \\Users\\synthetic-user\\secrets.env"],
      ["explicit:privacy-rooted-backslash-space", "notes=/p:Foo \\Program Files\\Vendor\\secrets.env"],
      ["explicit:privacy-file-uri", "notes=file:///private/other/secrets.env"],
    ]) {
      await assert.rejects(
        current.capture({ ...fixedSignal, observedEvidence }, "explicit", captureContext(sourceEventRef)),
        hasCode("privacy"),
      );
    }
    await current.capture({
      ...fixedSignal,
      summary: "Public documentation URL remains valid evidence",
      observedEvidence: "See https://example.invalid/home/guide for the synthetic public reference.",
    }, "explicit", captureContext("explicit:privacy-url-control"));
    await current.capture({
      ...fixedSignal,
      summary: `api_key=${credential} root=${item.projectA}`,
      observedEvidence: `home=${os.homedir()} token=${credential}`,
    }, "explicit", captureContext("explicit:privacy-output"));
    const stored = await current.status();
    const storedText = JSON.stringify(stored);
    assert.equal(storedText.includes(credential), false);
    assert.equal(storedText.includes(item.projectA), false);
    assert.equal(storedText.includes(os.homedir()), false);
    assert.match(storedText, /<redacted/u);
    const hooks = createKaizenPluginHooks({
      directory: item.projectA,
      project: { worktree: item.projectA },
      client: { session: { async get() { return { data: null }; }, async messages() { return { data: [] }; } } },
    }, environment) as Record<string, unknown>;
    const tools = hooks.tool as Record<string, { execute(args: unknown, context: unknown): Promise<{ output: string }> }>;
    const context = { directory: item.projectA, sessionID: "session_privacy_output", messageID: "message_privacy_output", metadata(_value: unknown) {} };
    const plain = await tools.kaizen_status!.execute({ details: false, limit: 25 }, context);
    const detailed = await tools.kaizen_status!.execute({ details: true, limit: 25, scope: "cross-project" }, { ...context, messageID: "message_privacy_details" });
    for (const output of [plain.output, detailed.output]) {
      assert.equal(Buffer.byteLength(output, "utf8") <= 16 * 1024, true);
      assert.equal(output.includes(credential), false);
      assert.equal(output.includes(item.projectA), false);
      assert.equal(output.includes(os.homedir()), false);
    }
  } finally {
    fs.rmSync(item.root, { recursive: true, force: true });
  }
});

test("explicit store failure exposes the original filesystem cause without a partial record", async () => {
  const item = fixture();
  try {
    fs.writeFileSync(item.data, "blocked", { encoding: "utf8", flag: "wx" });
    const hooks = createKaizenPluginHooks({
      directory: item.projectA,
      project: { worktree: item.projectA },
      client: { session: { async get() { return { data: null }; }, async messages() { return { data: [] }; } } },
    }, item.environment) as Record<string, unknown>;
    const tools = hooks.tool as Record<string, { execute(args: unknown, context: unknown): Promise<unknown> }>;
    await assert.rejects(
      tools.kaizen_report!.execute({ input: fixedSignal }, { directory: item.projectA, sessionID: "session_store_cause", messageID: "message_store_cause", metadata(_value: unknown) {} }),
      (error: unknown) => error instanceof Error && typeof (error as Error & { code?: unknown }).code === "string",
    );
    assert.equal(fs.readFileSync(item.data, "utf8"), "blocked");
  } finally {
    fs.rmSync(item.root, { recursive: true, force: true });
  }
});

test("complain keeps the loaded inbox authoritative and Markdown as unavailable fallback only", () => {
  const repositoryRoot = path.resolve(path.dirname(currentFile), "..");
  const skill = fs.readFileSync(path.join(repositoryRoot, "global", "skills", "complain", "SKILL.md"), "utf8");
  assert.match(skill, /When `kaizen_report` is available, call it once/u);
  assert.match(skill, /A successful tool result is authoritative: do not create or edit `docs\/feedbacks\/\*\*`/u);
  assert.match(skill, /Use Markdown fallback only when `kaizen_report` is absent or definitively unavailable before persistence/u);
  assert.match(skill, /`Feedback: capture-unknown`/u);
  assert.match(skill, /do not create a second record or return a Markdown candidate/u);
});

test("archive failure closes its checkpoint while disabled harvest stays unavailable and unpersisted", async () => {
  const item = fixture();
  try {
    const sessionID = "session_archive_failure_boundary";
    const hooks = createKaizenPluginHooks({
      directory: item.projectA,
      project: { worktree: item.projectA },
      client: { session: {
        async get() { return { data: null }; },
        async messages() { return { data: [] }; },
      } },
    }, item.environment) as Record<string, unknown>;
    const tools = hooks.tool as Record<string, { execute(args: unknown, context: unknown): Promise<{ output: string }> }>;
    const context = (messageID: string) => ({ directory: item.projectA, sessionID, messageID, metadata(_value: unknown) {} });
    const pending = JSON.parse((await tools.kaizen_checkpoint!.execute({ input: { changeRef: "archive-failure-fixture", status: "harvest-pending" } }, context("message_archive_failure_pending"))).output) as { checkpointRef: string };
    await tools.kaizen_checkpoint!.execute({ input: { changeRef: "archive-failure-fixture", checkpointRef: pending.checkpointRef, status: "archive-failed" } }, context("message_archive_failure_close"));
    const status = await feature(item.projectA, item.environment).status();
    assert.equal(status.checkpoints.find((checkpoint) => checkpoint.checkpointRef === pending.checkpointRef)?.status, "archive-failed");
    assert.deepEqual(await feature(item.projectA, item.environment).repairGaps(status.checkpoints), []);
    assert.deepEqual(createKaizenPluginHooks({ directory: item.projectB, project: { worktree: item.projectB } }, { ...item.environment, OPENCODE_KAIZEN: "0" }), {});
    assert.equal((await feature(item.projectA, item.environment).status()).counts.checkpoints, 1);
  } finally {
    fs.rmSync(item.root, { recursive: true, force: true });
  }
});

test("status derives current-root repair gaps without persisting a repair-gap state", async () => {
  const item = fixture();
  try {
    const sessionID = "session_repair_gap_status";
    const hooks = createKaizenPluginHooks({
      directory: item.projectA,
      project: { worktree: item.projectA },
      client: { session: {
        async get() { return { data: { id: sessionID, directory: item.projectA } }; },
        async messages() { return { data: [] }; },
      } },
    }, item.environment) as Record<string, unknown>;
    const tools = hooks.tool as Record<string, { execute(args: unknown, context: unknown): Promise<{ output: string }> }>;
    const context = (messageID: string) => ({ directory: item.projectA, sessionID, messageID, metadata(_value: unknown) {} });
    const changeRef = "repair-gap-fixture";
    const active = path.join(item.projectA, "openspec", "changes", changeRef);
    const archived = path.join(item.projectA, "openspec", "changes", "archive", `2026-08-29-${changeRef}`);
    fs.mkdirSync(active, { recursive: true });
    const pending = JSON.parse((await tools.kaizen_checkpoint!.execute({ input: { changeRef, status: "harvest-pending" } }, context("message_repair_pending"))).output) as { checkpointRef: string };
    const before = JSON.parse((await tools.kaizen_status!.execute({ limit: 25 }, context("message_repair_before"))).output) as { repairGaps: unknown[] };
    assert.deepEqual(before.repairGaps, []);
    fs.mkdirSync(path.dirname(archived), { recursive: true });
    fs.renameSync(active, archived);
    const interrupted = JSON.parse((await tools.kaizen_status!.execute({ limit: 25 }, context("message_repair_interrupted"))).output) as { repairGaps: Array<{ changeRef: string; checkpointRef: string; createdAt: string; status: string }> };
    assert.equal(interrupted.repairGaps.length, 1);
    assert.equal(interrupted.repairGaps[0]!.changeRef, changeRef);
    assert.equal(interrupted.repairGaps[0]!.checkpointRef, pending.checkpointRef);
    assert.equal(interrupted.repairGaps[0]!.status, "repair-gap");
    await tools.kaizen_checkpoint!.execute({ input: { changeRef, checkpointRef: pending.checkpointRef, status: "no-signal" } }, context("message_repair_closed"));
    const repaired = JSON.parse((await tools.kaizen_status!.execute({ limit: 25 }, context("message_repair_after"))).output) as { repairGaps: unknown[]; checkpoints: Array<{ status: string }> };
    assert.deepEqual(repaired.repairGaps, []);
    assert.equal(repaired.checkpoints.some((checkpoint) => checkpoint.status === "repair-gap"), false);
  } finally {
    fs.rmSync(item.root, { recursive: true, force: true });
  }
});

test("legacy feedback import is idempotent and written status never resolves the signal", async () => {
  const item = fixture();
  try {
    const sessionID = "session_legacy_feedback_valid";
    const hooks = createKaizenPluginHooks({
      directory: item.projectA,
      project: { worktree: item.projectA },
      client: { session: {
        async get() { return { data: { id: sessionID, directory: item.projectA } }; },
        async messages() { return { data: [] }; },
      } },
    }, item.environment) as Record<string, unknown>;
    const tools = hooks.tool as Record<string, { execute(args: unknown, context: unknown): Promise<{ output: string }> }>;
    const context = (messageID: string) => ({ directory: item.projectA, sessionID, messageID, metadata(_value: unknown) {} });
    const input = { input: { entry: legacyFeedback, evidenceRef: "docs/feedbacks/main-agent.md" } };
    const first = JSON.parse((await tools.kaizen_import_feedback!.execute(input, context("message_legacy_first"))).output) as { action: string; legacyStatus: string; requiresCurrentEvidence: boolean; signalRef: string };
    const repeated = JSON.parse((await tools.kaizen_import_feedback!.execute(input, context("message_legacy_repeated"))).output) as { action: string; signalRef: string };
    assert.equal(first.action, "captured");
    assert.equal(repeated.action, "deduplicated");
    assert.equal(repeated.signalRef, first.signalRef);
    assert.equal(first.legacyStatus, "open");
    assert.equal(first.requiresCurrentEvidence, true);
    let status = await feature(item.projectA, item.environment).status();
    const imported = status.signals.find((signal) => signal.signalRef === first.signalRef);
    assert.equal(imported?.status, "pending");
    assert.deepEqual(imported?.sources, ["legacy-feedback"]);
    await tools.kaizen_decision!.execute({ input: {
      signalRef: first.signalRef,
      decision: "needs-investigation",
      evidenceRefs: ["tools/test-cross-project-kaizen.ts"],
      ownerClass: "unknown",
      nextBoundaryOrTerminalReason: "Current evidence is required before disposition.",
    } }, context("message_legacy_decision"));
    status = await feature(item.projectA, item.environment).status();
    const triaged = status.signals.find((signal) => signal.signalRef === first.signalRef);
    assert.equal(triaged?.status, "triaged");
    assert.equal(triaged?.decision?.decision, "needs-investigation");
    assert.equal(fs.existsSync(path.join(item.projectA, "docs", "feedbacks")), false);
  } finally {
    fs.rmSync(item.root, { recursive: true, force: true });
  }
});

test("copied session-env composes and executes Kaizen report and status", async () => {
  const item = fixture();
  const previousDataRoot = process.env.OPENCODE_DATA_DIR;
  const previousKaizen = process.env.OPENCODE_KAIZEN;
  try {
    const copiedPlugin = path.join(item.root, "copied-plugin");
    fs.cpSync(path.resolve(path.dirname(currentFile), "..", "global", "plugin"), copiedPlugin, { recursive: true });
    process.env.OPENCODE_DATA_DIR = item.data;
    delete process.env.OPENCODE_KAIZEN;
    const sessionID = "session_copied_kaizen_valid";
    const loaded = await import(`${pathToFileURL(path.join(copiedPlugin, "session-env.ts")).href}?copy=${Date.now()}`) as { default: { server(input: unknown): Promise<Record<string, unknown>> } };
    const hooks = await loaded.default.server({
      directory: item.projectA,
      project: { worktree: item.projectA },
      client: { session: {
        async get() { return { data: { id: sessionID, directory: item.projectA } }; },
        async messages() { return { data: [] }; },
      } },
    });
    const tools = hooks.tool as Record<string, { execute(args: unknown, context: unknown): Promise<unknown> }>;
    for (const name of ["kaizen_report", "kaizen_status", "kaizen_decision", "kaizen_checkpoint", "kaizen_import_feedback"]) assert(tools[name] != null, `${name} must load from the copied plugin`);
    const context = {
      directory: item.projectA,
      worktree: item.projectA,
      sessionID,
      messageID: "message_copied_kaizen_valid",
      metadata(_value: unknown) {},
    };
    const report = await tools.kaizen_report!.execute({ input: fixedSignal }, context) as { output: string };
    const signalRef = (JSON.parse(report.output) as { signalRef: string }).signalRef;
    assert.match(signalRef, /^signal_[a-f0-9]{32}$/u);
    const imported = await tools.kaizen_import_feedback!.execute({ input: { entry: legacyFeedback, evidenceRef: "docs/feedbacks/main-agent.md" } }, { ...context, messageID: "message_copied_import_valid" }) as { output: string };
    const importedSignalRef = (JSON.parse(imported.output) as { signalRef: string }).signalRef;
    assert.match(importedSignalRef, /^signal_[a-f0-9]{32}$/u);
    assert.notEqual(importedSignalRef, signalRef);
    const status = await tools.kaizen_status!.execute({ limit: 25 }, { ...context, messageID: "message_copied_status_valid" }) as { output: string };
    const projection = JSON.parse(status.output) as { counts: { signals: number }; signals: Array<{ signalRef: string }> };
    assert.equal(projection.counts.signals, 2);
    assert.equal(projection.signals.some((signal) => signal.signalRef === signalRef), true);
    assert.equal(projection.signals.some((signal) => signal.signalRef === importedSignalRef), true);
    assert.equal(status.output.includes(fixedSignal.summary), false);
    assert.equal(fs.existsSync(path.join(item.projectA, "docs", "feedbacks")), false);
    await (hooks.dispose as () => Promise<void>)();
  } finally {
    if (previousDataRoot == null) delete process.env.OPENCODE_DATA_DIR;
    else process.env.OPENCODE_DATA_DIR = previousDataRoot;
    if (previousKaizen == null) delete process.env.OPENCODE_KAIZEN;
    else process.env.OPENCODE_KAIZEN = previousKaizen;
    fs.rmSync(item.root, { recursive: true, force: true });
  }
});

test("plugin empty summary records no-signal while invalid roots, output, and timeout emit diagnostics", async () => {
  const item = fixture();
  try {
    const sessionID = "session_kaizen_root_failures";
    let mode: "child" | "missing" | "malformed" | "directory" | "empty" | "timeout" = "child";
    const hooks = createKaizenPluginHooks({
      directory: item.projectA,
      project: { worktree: item.projectA },
      client: { session: {
        async get() {
          if (mode === "timeout") return await new Promise<never>(() => {});
          if (mode === "child") return { data: { id: sessionID, parentID: "session_parent", directory: item.projectA } };
          if (mode === "directory") return { data: { id: sessionID, directory: item.projectB } };
          return { data: { id: sessionID, directory: item.projectA } };
        },
        async messages() {
          if (mode === "missing") return { data: [] };
          if (mode === "empty") return { data: [{ info: { id: "message_summary_empty", role: "assistant", sessionID, summary: true, time: { created: 2 } }, parts: [{ type: "text", text: envelope(null) }] }] };
          return { data: [{ info: { id: "message_summary_failure", role: "assistant", sessionID, summary: true, time: { created: 1 } }, parts: [{ type: "text", text: "malformed" }] }] };
        },
      } },
    }, item.environment) as Record<string, unknown>;
    const warnings: unknown[][] = [];
    const previous = console.warn;
    console.warn = (...args: unknown[]) => { warnings.push(args); };
    try {
      for (const current of ["child", "missing", "malformed", "directory", "empty", "timeout"] as const) {
        mode = current;
        await (hooks.event as (input: unknown) => Promise<void>)({ event: { id: `event_${current}`, type: "session.compacted", properties: { sessionID } } });
      }
    } finally {
      console.warn = previous;
    }
    const status = await feature(item.projectA, item.environment).status();
    assert.deepEqual(status.diagnostics.map((item) => item.code).sort(), [
      "compaction-capture-failed",
      "compaction-directory-mismatch",
      "compaction-envelope-invalid",
      "compaction-root-invalid",
      "compaction-summary-missing",
    ]);
    assert.equal(warnings.length, 5);
    assert.equal(status.counts.observations, 1);
    assert.equal(status.observations[0]!.outcome, "no-signal");
    assert.equal(status.counts.signals, 0);
  } finally {
    fs.rmSync(item.root, { recursive: true, force: true });
  }
});

test("automatic compaction store failure stays non-blocking and preserves one warning chain", async () => {
  const item = fixture();
  try {
    fs.writeFileSync(item.data, "blocked", { encoding: "utf8", flag: "wx" });
    const sessionID = "session_kaizen_store_failure";
    const hooks = createKaizenPluginHooks({
      directory: item.projectA,
      project: { worktree: item.projectA },
      client: { session: {
        async get() { return { data: { id: sessionID, directory: item.projectA } }; },
        async messages() {
          return { data: [{ info: { id: "message_summary_store_failure", role: "assistant", sessionID, summary: true, time: { created: 1 } }, parts: [{ type: "text", text: envelope(fixedSignal) }] }] };
        },
      } },
    }, item.environment) as Record<string, unknown>;
    const warnings: string[] = [];
    const previous = console.warn;
    console.warn = (...args: unknown[]) => { warnings.push(args.join(" ")); };
    try {
      await (hooks.event as (input: unknown) => Promise<void>)({ event: { id: "event_store_failure", type: "session.compacted", properties: { sessionID } } });
    } finally {
      console.warn = previous;
    }
    assert.equal(fs.readFileSync(item.data, "utf8"), "blocked");
    assert.equal(warnings.filter((value) => value.includes("compaction-capture-failed")).length, 1);
    assert.equal(warnings.filter((value) => value.includes("diagnostic-store-failed")).length, 1);
  } finally {
    fs.rmSync(item.root, { recursive: true, force: true });
  }
});

async function main(): Promise<void> {
  if (process.argv[2] === "--worker") {
    await runWorker();
    return;
  }
  const json = process.argv.includes("--json");
  let passed = 0;
  const passedNames: string[] = [];
  for (const item of tests) {
    try {
      await item.run();
      passed += 1;
      passedNames.push(item.name);
      if (!json) console.log(`ok ${passed} - ${item.name}`);
    } catch (error) {
      if (!json) console.error(`not ok ${passed + 1} - ${item.name}`);
      throw error;
    }
  }
  if (json) console.log(JSON.stringify({ schemaVersion: 1, status: "passed", tests: passedNames }));
  else console.log(`${passed} cross-project Kaizen tests passed`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack ?? error.message : String(error));
  process.exitCode = 1;
});
