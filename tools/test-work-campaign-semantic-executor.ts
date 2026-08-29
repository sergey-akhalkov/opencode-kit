import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { stableJson } from "../global/bin/roadmap-mission/contracts.ts";
import { loadWorkCampaignDefinition } from "../global/bin/work-campaign/contracts.ts";
import {
  executeSemanticAssignment,
  type SemanticAssignment,
} from "../global/bin/work-campaign/semantic-executor.ts";
import { semanticPayloadSchema } from "../global/bin/work-campaign/semantic-schema.ts";

type JsonRecord = Record<string, unknown>;

const candidateDigest = "b".repeat(64);
const inventoryDigest = "c".repeat(64);
const sourceDigest = "d".repeat(64);

function writeJson(file: string, value: unknown): void {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, stableJson(value), "utf8");
}

function fixture(): { assignment: SemanticAssignment; definitionDigest: string; root: string } {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "work-campaign-semantic-"));
  fs.mkdirSync(path.join(root, "src"), { recursive: true });
  fs.mkdirSync(path.join(root, ".work", "evidence"), { recursive: true });
  fs.writeFileSync(path.join(root, "src", "main.ts"), "export const value = 1;\n", "utf8");
  writeJson(path.join(root, "adapter.json"), {
    adapterId: "fixture-adapter",
    inventoryArgv: ["node", "inventory.mjs"],
    realBoundaryProofArgv: ["node", "proof.mjs"],
    schemaVersion: 1,
  });
  writeJson(path.join(root, "definition.json"), {
    adapterPath: "adapter.json",
    allowedEffects: ["local-read", "local-write", "local-commit"],
    authorizationRefs: { "local-commit": "authorization:fixture" },
    budgets: { evidenceBytes: 1_048_576, modelCalls: 4, processAttempts: 4, wallClockSeconds: 300, waves: 2 },
    campaignId: "fixture-campaign",
    checkpoint: { localCommitAuthorized: true, mode: "local-commit", workspace: "disposable" },
    evidencePath: ".work/evidence",
    exclusions: [],
    hostResume: { enabled: false, supervisorRequired: false },
    outcome: "Review the declared fixture and report exact current evidence.",
    playbook: "audit-remediate",
    protectedDecisionPolicy: "owner-required",
    reportPath: ".work/report.md",
    schemaVersion: 1,
    scopeRoots: ["src"],
    statePath: ".runtime/campaign",
    stopPolicy: {
      onBudgetExhausted: true,
      onExplicitStop: true,
      onOwnerRequired: true,
      onProtected: true,
      onUnknown: true,
    },
    validationArgv: ["node", "validate.mjs"],
  });
  const { definitionDigest } = loadWorkCampaignDefinition(root, "definition.json");
  const assignment: SemanticAssignment = {
    assignmentId: "partition-a",
    assignmentType: "discovery",
    budgets: { modelCalls: 1, outputBytes: 16_384, wallClockSeconds: 5 },
    campaignId: "fixture-campaign",
    candidateDigest,
    definitionDigest,
    evidenceRefs: ["fixture:assignment"],
    phase: "discover",
    request: "Inspect src/main.ts and return the exact supplied synthetic finding shape.",
    schemaVersion: 1,
    sourceBlockIds: ["block-a"],
  };
  writeJson(path.join(root, ".work", "evidence", "assignment.json"), assignment);
  return { assignment, definitionDigest, root };
}

function discoveryEnvelope(candidate = candidateDigest): JsonRecord {
  return {
    assignmentId: "partition-a",
    payload: {
      partition: {
        assignmentId: "partition-a",
        blockIds: ["block-a"],
        candidateDigest: candidate,
        evidenceRefs: ["fixture:partition"],
        id: "partition-result-a",
        inventoryDigest,
        producerSessionRef: "session:ses-test",
        recordType: "partition-result",
        schemaVersion: 1,
        status: "complete",
        workItemIds: ["work-a"],
      },
      workItems: [{
        affectedPaths: ["src/main.ts"],
        candidateDigest: candidate,
        confidence: "high",
        effectClasses: ["local-write"],
        evidenceRefs: ["fixture:finding"],
        id: "work-a",
        impact: "The current fixture behavior is materially incorrect for its accepted outcome.",
        initialSeverity: "P1",
        likelyCause: "The maintained value is stale.",
        ownedPaths: ["src/main.ts"],
        principleRef: "principle:first-do-no-harm",
        producerSessionRef: "session:ses-test",
        proposedOutcome: "Update the maintained value and prove the fixture boundary.",
        recordType: "work-item",
        scenario: "A consumer reads the stale maintained value.",
        schemaVersion: 1,
        sourceBlockIds: ["block-a"],
        status: "candidate",
      }],
    },
    schemaVersion: 1,
  };
}

function fakeClient(options: {
  cleanupFails?: boolean;
  output?: string;
  timeout?: boolean;
} = {}): { client: JsonRecord; creates: JsonRecord[]; prompts: JsonRecord[] } {
  const creates: JsonRecord[] = [];
  const prompts: JsonRecord[] = [];
  const data = <T>(value: T) => Promise.resolve({ data: value });
  const client: JsonRecord = {
    path: { get: ({ directory }: { directory: string }) => data({ directory }) },
    provider: { list: () => data({ all: [{ id: "proof", models: { "proof-model": {} } }], connected: ["proof"] }) },
    permission: { list: () => data([]) },
    question: { list: () => data([]) },
    tool: { ids: () => data(["read", "glob", "grep", "lsp", "edit", "bash", "task", "question"]) },
    v2: { agent: { list: () => data({ data: [{ id: "general", model: { id: "proof-model", providerID: "proof" } }] }) } },
    session: {
      children: () => data([]),
      create: (input: JsonRecord) => {
        creates.push(input);
        return data({ directory: input.directory, id: "ses-test" });
      },
      delete: () => options.cleanupFails ? Promise.resolve({ error: new Error("cleanup failed") }) : data(true),
      diff: () => data([]),
      prompt: (input: JsonRecord, requestOptions: { signal: AbortSignal }) => {
        prompts.push(input);
        if (options.timeout) {
          return new Promise((_resolve, reject) => requestOptions.signal.addEventListener("abort", () => reject(requestOptions.signal.reason), { once: true }));
        }
        return data({
          info: options.output == null ? { structured: discoveryEnvelope() } : {},
          parts: [
            { state: { status: "completed" }, tool: "StructuredOutput", type: "tool" },
            ...(options.output == null ? [] : [{ type: "text", text: options.output }]),
          ],
        });
      },
    },
  };
  return { client, creates, prompts };
}

async function execute(root: string, client: JsonRecord, resultName: string) {
  return executeSemanticAssignment({
    agent: "general",
    assignmentPath: ".work/evidence/assignment.json",
    definitionPath: "definition.json",
    resultPath: `.work/evidence/${resultName}.json`,
    root,
    serverUrl: "http://127.0.0.1:4096",
  }, { client: client as never });
}

test("semantic executor authenticates the managed runtime without persisting the credential", async () => {
  const { root } = fixture();
  const fake = fakeClient();
  const password = "private-managed-runtime-password";
  let clientOptions: JsonRecord | null = null;
  try {
    const result = await executeSemanticAssignment({
      agent: "general",
      assignmentPath: ".work/evidence/assignment.json",
      definitionPath: "definition.json",
      resultPath: ".work/evidence/authenticated.json",
      root,
      serverUrl: "http://127.0.0.1:4096",
    }, {
      createClient: (options) => {
        clientOptions = options;
        return fake.client as never;
      },
      environment: {
        ...process.env,
        OPENCODE_SERVER_PASSWORD: password,
        OPENCODE_SERVER_USERNAME: "proof-user",
      },
    });
    assert.equal(result.status, "complete");
    assert.deepEqual(clientOptions, {
      baseUrl: "http://127.0.0.1:4096",
      directory: fs.realpathSync(root),
      headers: { Authorization: `Basic ${Buffer.from(`proof-user:${password}`).toString("base64")}` },
    });
    const retained = fs.readFileSync(path.join(root, ".work", "evidence", "authenticated.json"), "utf8");
    assert.equal(retained.includes(password), false);
    assert.equal(retained.includes(Buffer.from(`proof-user:${password}`).toString("base64")), false);
  } finally {
    fs.rmSync(root, { force: true, recursive: true });
  }
});

test("semantic executor enforces parentless deny-by-default read-only ownership", async () => {
  const { root } = fixture();
  const fake = fakeClient();
  try {
    const result = await execute(root, fake.client, "complete");
    assert.equal(result.status, "complete");
    assert.equal(result.cleanup, "complete");
    assert.equal(result.modelCalls, 1);
    assert.deepEqual(result.verification, { children: 0, fileDiffs: 0, parentless: true, permissionRequests: 0, questions: 0 });
    assert.equal(fake.creates[0].parentID, undefined);
    const permission = fake.creates[0].permission as JsonRecord[];
    assert.deepEqual(permission[0], { permission: "*", pattern: "*", action: "deny" });
    const tools = fake.prompts[0].tools as Record<string, boolean>;
    assert.equal(tools.read, true);
    assert.equal(tools.grep, true);
    assert.equal(tools.edit, false);
    assert.equal(tools.bash, false);
    assert.equal(tools.task, false);
    assert.equal(tools.question, false);
    const format = fake.prompts[0].format as JsonRecord;
    const schema = format.schema as JsonRecord;
    const properties = schema.properties as Record<string, JsonRecord>;
    const payload = properties.payload;
    assert.deepEqual(payload.required, ["partition", "workItems"]);
    const payloadProperties = payload.properties as Record<string, JsonRecord>;
    assert.equal(payloadProperties.partition.additionalProperties, false);
    assert.deepEqual((payloadProperties.partition.required as string[]).sort(), [
      "assignmentId", "blockIds", "candidateDigest", "evidenceRefs", "id", "inventoryDigest",
      "producerSessionRef", "recordType", "schemaVersion", "status", "workItemIds",
    ]);
    assert.equal(fs.existsSync(path.join(root, ".work", "evidence", "complete.json")), true);
  } finally {
    fs.rmSync(root, { force: true, recursive: true });
  }
});

test("semantic payload schemas constrain every assignment wrapper and exact record owner", () => {
  const { assignment, root } = fixture();
  const expected = {
    discovery: "partition",
    "final-challenge": "closure",
    investigation: "investigation",
    reconciliation: "reconciliation",
    synthesis: "wave",
  } as const;
  try {
    for (const [assignmentType, wrapper] of Object.entries(expected)) {
      const schema = semanticPayloadSchema({ ...assignment, assignmentType: assignmentType as SemanticAssignment["assignmentType"] }) as JsonRecord;
      assert.equal(schema.additionalProperties, false);
      assert.deepEqual(schema.required, assignmentType === "discovery" ? ["partition", "workItems"] : [wrapper]);
      const properties = schema.properties as Record<string, JsonRecord>;
      assert.equal(properties[wrapper].additionalProperties, false);
      assert.ok(Array.isArray(properties[wrapper].required));
    }
  } finally {
    fs.rmSync(root, { force: true, recursive: true });
  }
});

test("semantic executor preserves blocked evidence for malformed and stale results", async () => {
  const malformed = fixture();
  const stale = fixture();
  try {
    const malformedResult = await execute(malformed.root, fakeClient({ output: "not-json" }).client, "malformed");
    assert.equal(malformedResult.status, "blocked");
    assert.equal(malformedResult.errorClass, "invalid-result");
    assert.equal(malformedResult.cleanup, "complete");
    const staleResult = await execute(stale.root, fakeClient({ output: JSON.stringify(discoveryEnvelope("e".repeat(64))) }).client, "stale");
    assert.equal(staleResult.status, "blocked");
    assert.equal(staleResult.errorClass, "invalid-result");
    assert.match(staleResult.errorMessage ?? "", /differs/u);
  } finally {
    fs.rmSync(malformed.root, { force: true, recursive: true });
    fs.rmSync(stale.root, { force: true, recursive: true });
  }
});

test("semantic executor blocks oversize output and timeout without a second model call", async () => {
  const oversize = fixture();
  const timeout = fixture();
  try {
    const assignmentFile = path.join(oversize.root, ".work", "evidence", "assignment.json");
    const assignment = JSON.parse(fs.readFileSync(assignmentFile, "utf8")) as SemanticAssignment;
    assignment.budgets.outputBytes = 100;
    writeJson(assignmentFile, assignment);
    const oversizeResult = await execute(oversize.root, fakeClient().client, "oversize");
    assert.equal(oversizeResult.status, "blocked");
    assert.equal(oversizeResult.modelCalls, 1);
    assert.equal(oversizeResult.errorClass, "invalid-result");

    const assignmentTimeoutFile = path.join(timeout.root, ".work", "evidence", "assignment.json");
    const timeoutAssignment = JSON.parse(fs.readFileSync(assignmentTimeoutFile, "utf8")) as SemanticAssignment;
    timeoutAssignment.budgets.wallClockSeconds = 1;
    writeJson(assignmentTimeoutFile, timeoutAssignment);
    const timeoutResult = await execute(timeout.root, fakeClient({ timeout: true }).client, "timeout");
    assert.equal(timeoutResult.status, "blocked");
    assert.equal(timeoutResult.modelCalls, 1);
    assert.equal(timeoutResult.errorClass, "timeout");
    assert.equal(timeoutResult.cleanup, "complete");
  } finally {
    fs.rmSync(oversize.root, { force: true, recursive: true });
    fs.rmSync(timeout.root, { force: true, recursive: true });
  }
});

test("semantic executor reports cleanup-unknown without claiming terminal completion", async () => {
  const { root } = fixture();
  try {
    const result = await execute(root, fakeClient({ cleanupFails: true }).client, "cleanup-unknown");
    assert.equal(result.status, "unknown");
    assert.equal(result.cleanup, "unknown");
    assert.equal(result.errorClass, "cleanup-unknown");
  } finally {
    fs.rmSync(root, { force: true, recursive: true });
  }
});
