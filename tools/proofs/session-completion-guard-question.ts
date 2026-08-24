#!/usr/bin/env bun
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Database } from "bun:sqlite";
import type { Session } from "../../global/node_modules/@opencode-ai/sdk/dist/v2/index.js";
import { SessionCompletionController } from "../../global/extensions/session-completion-guard/controller.ts";
import { normalizeQuestionRequest } from "../../global/extensions/session-completion-guard/question.ts";
import {
  initialRootState,
  stableDigest,
} from "../../global/extensions/session-completion-guard/runtime-support.ts";
import {
  discoverStrategyJournal,
  strategyFingerprint,
} from "../../global/extensions/session-completion-guard/strategy.ts";
import type {
  AuditEpoch,
  CompletionVerdict,
  RootState,
} from "../../global/extensions/session-completion-guard/types.ts";
import { buildContinuation, parseCompletionVerdict } from "../../global/extensions/session-completion-guard/verdict.ts";
import { hashRef } from "../../global/plugin/session-delivery-context/index.ts";
import type { SessionDeliveryContextResult } from "../../global/plugin/session-delivery-context/projection.ts";
import { removeProofFixture } from "./lib/proof-process-cleanup.ts";

const projectionRunnerPath = fileURLToPath(new URL("./session-completion-guard-long-run.ts", import.meta.url));

function readProjectionInChild(dbPath: string, sessionID: string): SessionDeliveryContextResult {
  const result = spawnSync(process.execPath, [projectionRunnerPath, "--internal-project", dbPath, sessionID], {
    cwd: process.cwd(),
    encoding: "utf8",
    shell: false,
  });
  if (result.status !== 0) throw new Error(`Projection child failed with exit ${String(result.status)}: ${result.stderr}`);
  return JSON.parse(result.stdout) as SessionDeliveryContextResult;
}

const rootID = "session_autonomous_question_proof_root";
const childID = "session_autonomous_question_proof_child";
const rootRef = hashRef("session", rootID);
const requestID = "question_autonomous_question_proof";
const rootDirectory = "C:/Users/Sergey/AppData/Local/Temp/opencode/grind-autonomous-question-proof";
const request = normalizeQuestionRequest({
  id: requestID,
  tool: { callID: "call_autonomous_question_proof", messageID: "message_autonomous_question_proof" },
  questions: [{
    custom: true,
    header: "Strategy",
    multiple: false,
    options: [
      { label: "Recommended", description: "Safest reversible local choice" },
      { label: "Alternative", description: "Another reversible local choice" },
    ],
    question: "Which safe local strategy should I use?",
  }],
});
const journalDigest = discoverStrategyJournal(
  rootDirectory,
  rootRef,
  { background: [], humanMessages: [] },
  "docs/session-strategy-history",
).digest;
const revisionBase = {
  assistantRef: "none",
  diffDigest: stableDigest([]),
  humanRef: "none",
  journalDigest,
  leaseGeneration: 0,
  todoDigest: stableDigest([]),
};
const revision = { ...revisionBase, revisionDigest: stableDigest(revisionBase) };
let root = {
  id: rootID,
  projectID: "project_autonomous_question_proof",
  directory: rootDirectory,
  title: "autonomous question proof root",
  version: "1",
  time: { created: 0, updated: 0 },
} as Session;
let child = {
  ...root,
  id: childID,
  parentID: rootID,
  title: "autonomous question proof child",
} as Session;
const replies: string[][][] = [];
let questionRejectCalls = 0;
let rootPromptCalls = 0;
const rootPromptTexts: string[] = [];
let runtimeMessages: Array<{ info: Record<string, unknown>; parts: unknown[] }> = [];

const client = {
  session: {
    get: async ({ sessionID }: { sessionID: string }) => {
      if (sessionID === rootID) return { data: root };
      if (sessionID === childID) return { data: child };
      return { error: { name: "NotFoundError" } };
    },
    update: async (args: { sessionID: string; metadata?: Session["metadata"] }) => {
      if (args.sessionID === rootID) {
        root = { ...root, metadata: args.metadata };
        return { data: root };
      }
      child = { ...child, metadata: args.metadata };
      return { data: child };
    },
    messages: async () => ({ data: runtimeMessages }),
    todo: async () => ({ data: [] }),
    diff: async () => ({ data: [] }),
    promptAsync: async (args: { parts?: unknown[] }) => {
      rootPromptCalls += 1;
      const first = args.parts?.[0];
      rootPromptTexts.push(
        first != null && typeof first === "object" && typeof (first as { text?: unknown }).text === "string"
          ? (first as { text: string }).text
          : "",
      );
      return { data: true };
    },
  },
  question: {
    reply: async ({ answers }: { answers: string[][] }) => {
      replies.push(answers);
      return { data: true };
    },
    reject: async () => {
      questionRejectCalls += 1;
      return { data: true };
    },
  },
  tui: { showToast: async () => ({ data: true }) },
};

const controller = new SessionCompletionController(
  { client: { app: { log: async () => ({ data: true }) } }, directory: root.directory } as never,
  { auditWindow: { enabled: false }, statusToasts: false },
  client as never,
);
const probe = controller as unknown as {
  applyVerdict(state: RootState, epoch: AuditEpoch, verdict: CompletionVerdict): Promise<void>;
};

type QuestionScenario =
  | "capacity"
  | "disable-in-flight"
  | "human-before-reply"
  | "in-flight-event"
  | "interrupt-before-reply"
  | "not-found"
  | "stale-before-reply"
  | "success";

async function runQuestionScenario(
  name: string,
  scenarioRequest: ReturnType<typeof normalizeQuestionRequest>,
  answers: string[][],
  scenario: QuestionScenario,
): Promise<{
  appliedReplies: number;
  metadata: Session["metadata"];
  midReplyState: string | null;
  pendingRefs: number;
  questionState: string | null;
  replyCalls: number;
  rootState: string;
}> {
  let scenarioRoot = {
    ...root,
    metadata: { completionGuard: { grindEnabled: true, state: "running" } },
  } as Session;
  let scenarioChild = { ...child, metadata: undefined } as Session;
  let replyCalls = 0;
  let appliedReplies = 0;
  let midReplyState: string | null = null;
  let humanEventInjected = false;
  let scenarioProbe: {
    applyVerdict(state: RootState, epoch: AuditEpoch, verdict: CompletionVerdict): Promise<void>;
    onCommand(
      input: { command: string; sessionID: string; arguments: string },
      output: { parts: unknown[] },
    ): Promise<void>;
    onQuestionReplied(sessionID: string, requestID: string | null): Promise<void>;
    pause(sessionID: string, reason: string): Promise<void>;
    roots: Map<string, RootState>;
  };
  const scenarioClient = {
    session: {
      get: async ({ sessionID }: { sessionID: string }) => {
        if (sessionID === rootID) return { data: scenarioRoot };
        if (sessionID === childID) return { data: scenarioChild };
        return { error: { name: "NotFoundError" } };
      },
      update: async (args: { sessionID: string; metadata?: Session["metadata"] }) => {
        if (args.sessionID === rootID) {
          scenarioRoot = { ...scenarioRoot, metadata: args.metadata };
          const guard = args.metadata?.completionGuard as { state?: unknown } | undefined;
          if (scenario === "human-before-reply" && guard?.state === "question-answering" && !humanEventInjected) {
            humanEventInjected = true;
            await scenarioProbe.onQuestionReplied(rootID, scenarioRequest.requestID);
          }
          if (scenario === "stale-before-reply" && guard?.state === "question-answering" && !humanEventInjected) {
            humanEventInjected = true;
            const current = scenarioProbe.roots.get(rootID);
            if (current != null) {
              current.auditAbort?.abort();
              current.auditAbort = null;
              current.activeAudit = null;
              current.state = "stale";
            }
          }
          return { data: scenarioRoot };
        }
        scenarioChild = { ...scenarioChild, metadata: args.metadata };
        return { data: scenarioChild };
      },
      messages: async () => ({ data: [] }),
      todo: async () => ({ data: [] }),
      diff: async () => ({ data: [] }),
      promptAsync: async () => ({ data: true }),
    },
    question: {
      reply: async (_args: { answers: string[][] }, options?: { signal?: AbortSignal }) => {
        replyCalls += 1;
        if (scenario === "not-found") {
          const error = new Error("question resolved") as Error & { name: string };
          error.name = "QuestionNotFoundError";
          throw error;
        }
        if (scenario === "in-flight-event") {
          await scenarioProbe.onQuestionReplied(rootID, scenarioRequest.requestID);
        }
        if (scenario === "interrupt-before-reply") {
          await scenarioProbe.pause(rootID, "proof interrupt");
        }
        if (scenario === "disable-in-flight") {
          await scenarioProbe.onCommand(
            { arguments: "", command: "disable-grind", sessionID: rootID },
            { parts: [] },
          );
          midReplyState = scenarioProbe.roots.get(rootID)?.state ?? null;
        }
        if (options?.signal?.aborted) {
          const error = new Error("aborted") as Error & { name: string };
          error.name = "AbortError";
          throw error;
        }
        appliedReplies += 1;
        return { data: true };
      },
      reject: async () => ({ data: true }),
    },
    tui: { showToast: async () => ({ data: true }) },
  };
  const scenarioController = new SessionCompletionController(
    { client: { app: { log: async () => ({ data: true }) } }, directory: scenarioRoot.directory } as never,
    { auditWindow: { enabled: false }, statusToasts: false },
    scenarioClient as never,
  );
  scenarioProbe = scenarioController as unknown as typeof scenarioProbe;
  const scenarioEpoch: AuditEpoch = {
    ...epoch(`audit_${name}`),
    questionRequest: scenarioRequest,
  };
  const state: RootState = {
    ...initialRootState(scenarioRoot),
    activeAudit: scenarioEpoch,
    auditAbort: new AbortController(),
    grindEnabled: true,
    state: "question-auditing",
  };
  state.questions.set(scenarioRequest.requestID, {
    auditID: scenarioEpoch.auditID,
    replyObserved: false,
    request: scenarioRequest,
    state: "open",
  });
  if (scenario === "capacity") {
    for (let index = 0; index < 1_024; index += 1) {
      state.autonomousQuestionRefs.add(`question_capacity_${index}`);
    }
  }
  scenarioProbe.roots.set(rootID, state);
  const verdict = parseCompletionVerdict({
    schemaVersion: 1,
    auditID: scenarioEpoch.auditID,
    rootSessionRef: rootRef,
    inspectedRevision: revision.revisionDigest,
    verdict: "allow_stop",
    goalSummary: `Question scenario ${name}`,
    requirementMatrix: [{
      requirementRef: `requirement_${name}`,
      status: "complete",
      evidenceRefs: [`evidence_${name}`],
    }],
    unresolved: [],
    strategyAssessment: {
      fingerprint: `question-${name}`,
      repeated: false,
      prohibitedStrategies: [],
      requiredRetryEvidence: [],
    },
    questionAnswers: answers,
    ownerBoundary: null,
    evidenceRefs: [`evidence_${name}`],
    evidenceGaps: [],
    confidence: "high",
  }, scenarioEpoch);
  let expectedCapacityError = false;
  let outcome: {
    appliedReplies: number;
    metadata: Session["metadata"];
    midReplyState: string | null;
    pendingRefs: number;
    questionState: string | null;
    replyCalls: number;
    rootState: string;
  } | null = null;
  try {
    await scenarioProbe.applyVerdict(state, scenarioEpoch, verdict);
  } catch (error) {
    expectedCapacityError = scenario === "capacity" && error instanceof Error &&
      error.message === "Autonomous question provenance capacity is exhausted";
    if (!expectedCapacityError) throw error;
  } finally {
    outcome = {
      appliedReplies,
      metadata: scenarioRoot.metadata,
      midReplyState,
      pendingRefs: state.pendingAutonomousQuestionRefs.size,
      questionState: state.questions.get(scenarioRequest.requestID)?.state ?? null,
      replyCalls,
      rootState: state.state,
    };
    await scenarioController.dispose();
  }
  if (scenario === "capacity" && !expectedCapacityError) {
    throw new Error("Capacity scenario did not fail closed");
  }
  return outcome;
}

function questionState(epoch: AuditEpoch): RootState {
  const state: RootState = {
    ...initialRootState(root),
    activeAudit: epoch,
    auditAbort: new AbortController(),
    grindEnabled: true,
    state: "question-auditing",
  };
  state.questions.set(requestID, {
    auditID: epoch.auditID,
    replyObserved: false,
    request,
    state: "open",
  });
  return state;
}

function epoch(auditID: string): AuditEpoch {
  return {
    auditID,
    attempt: 1,
    childSessionID: childID,
    completionEvidence: null,
    inspected: revision,
    kind: "question",
    questionRequest: request,
    rootRef,
    rootSessionID: rootID,
  };
}

const autonomousEpoch = epoch("audit_autonomous_question_proof");
const autonomousState = questionState(autonomousEpoch);
const autonomousVerdict = parseCompletionVerdict({
  schemaVersion: 1,
  auditID: autonomousEpoch.auditID,
  rootSessionRef: rootRef,
  inspectedRevision: revision.revisionDigest,
  verdict: "allow_stop",
  goalSummary: "Select the recommended reversible strategy",
  requirementMatrix: [{
    requirementRef: "requirement_autonomous_decision",
    status: "complete",
    evidenceRefs: ["evidence_recommended_option"],
  }],
  unresolved: [],
  strategyAssessment: {
    fingerprint: "autonomous-question-proof",
    repeated: false,
    prohibitedStrategies: [],
    requiredRetryEvidence: [],
  },
  questionAnswers: [["Recommended"]],
  ownerBoundary: null,
  evidenceRefs: ["evidence_recommended_option"],
  evidenceGaps: [],
  confidence: "high",
}, autonomousEpoch);
await probe.applyVerdict(autonomousState, autonomousEpoch, autonomousVerdict);

const ownerEpoch = epoch("audit_owner_question_proof");
const ownerState = questionState(ownerEpoch);
const ownerVerdict = parseCompletionVerdict({
  schemaVersion: 1,
  auditID: ownerEpoch.auditID,
  rootSessionRef: rootRef,
  inspectedRevision: revision.revisionDigest,
  verdict: "owner_required",
  goalSummary: "A protected owner decision remains",
  requirementMatrix: [{
    requirementRef: "requirement_owner_decision",
    status: "owner_required",
    evidenceRefs: ["evidence_owner_boundary"],
  }],
  unresolved: [],
  strategyAssessment: {
    fingerprint: "owner-question-proof",
    repeated: false,
    prohibitedStrategies: [],
    requiredRetryEvidence: [],
  },
  questionAnswers: null,
  ownerBoundary: {
    decision: "Owner selects the protected action",
    reason: "The action requires owner authority",
    evidenceRefs: ["evidence_owner_boundary"],
  },
  evidenceRefs: ["evidence_owner_boundary"],
  evidenceGaps: [],
  confidence: "high",
}, ownerEpoch);
await probe.applyVerdict(ownerState, ownerEpoch, ownerVerdict);
const ownerRootAfterVerdict = root;

root = {
  ...root,
  metadata: { completionGuard: { grindEnabled: true, state: "running" } },
};
const repeatedEpoch: AuditEpoch = {
  ...epoch("audit_repeated_technical_proof"),
  kind: "completion",
  questionRequest: null,
};
const repeatedState: RootState = {
  ...initialRootState(root),
  activeAudit: repeatedEpoch,
  auditAbort: new AbortController(),
  grindEnabled: true,
  state: "auditing",
};
const repeatedVerdict = parseCompletionVerdict({
  schemaVersion: 1,
  auditID: repeatedEpoch.auditID,
  rootSessionRef: rootRef,
  inspectedRevision: revision.revisionDigest,
  verdict: "continue",
  goalSummary: "Resolve the repeated technical blocker",
  requirementMatrix: [{
    requirementRef: "requirement_repeated_technical",
    status: "unresolved",
    evidenceRefs: ["evidence_repeated_strategy"],
  }],
  unresolved: [{
    requirementRef: "requirement_repeated_technical",
    evidenceGap: "The repeated mechanism did not advance the task",
    nextAction: "Select a causally distinct mechanism",
    nextEvidence: "Observed advancement through a distinct mechanism",
    stopCondition: "The accepted technical outcome is observed",
  }],
  strategyAssessment: {
    fingerprint: "repeated-technical-proof",
    repeated: true,
    prohibitedStrategies: ["repeat the unchanged mechanism"],
    requiredRetryEvidence: ["decision-changing evidence"],
  },
  questionAnswers: null,
  ownerBoundary: null,
  evidenceRefs: ["evidence_repeated_strategy"],
  evidenceGaps: ["A distinct mechanism has not run"],
  confidence: "high",
}, repeatedEpoch);
await probe.applyVerdict(repeatedState, repeatedEpoch, repeatedVerdict);
const repeatedContinuation = rootPromptTexts[rootPromptTexts.length - 1] ?? "";

const completedTroubleshooterMessageID = "message_completed_troubleshooter_other_chain";
runtimeMessages = [{
  info: { id: completedTroubleshooterMessageID, role: "assistant" },
  parts: [{
    type: "tool",
    tool: "task",
    state: {
      status: "completed",
      input: {
        subagent_type: "troubleshooter",
        description: "Completed diagnosis for a different failure chain",
      },
    },
  }],
}];
const completedRevisionBase = {
  ...revisionBase,
  assistantRef: hashRef("assistant", completedTroubleshooterMessageID),
};
const completedRevision = {
  ...completedRevisionBase,
  revisionDigest: stableDigest(completedRevisionBase),
};
root = {
  ...ownerRootAfterVerdict,
  metadata: { completionGuard: { grindEnabled: true, state: "running" } },
};
const distinctEpoch: AuditEpoch = {
  ...epoch("audit_distinct_repeated_technical_proof"),
  inspected: completedRevision,
  kind: "completion",
  questionRequest: null,
};
const distinctState: RootState = {
  ...initialRootState(root),
  activeAudit: distinctEpoch,
  auditAbort: new AbortController(),
  grindEnabled: true,
  state: "auditing",
};
const distinctVerdict = parseCompletionVerdict({
  schemaVersion: 1,
  auditID: distinctEpoch.auditID,
  rootSessionRef: rootRef,
  inspectedRevision: completedRevision.revisionDigest,
  verdict: "continue",
  goalSummary: "Resolve a different repeated technical blocker",
  requirementMatrix: [{
    requirementRef: "requirement_distinct_repeated_technical",
    status: "unresolved",
    evidenceRefs: ["evidence_distinct_repeated_strategy"],
  }],
  unresolved: [{
    requirementRef: "requirement_distinct_repeated_technical",
    evidenceGap: "A different repeated mechanism did not advance the task",
    nextAction: "Diagnose this distinct failure chain",
    nextEvidence: "Observed advancement for this failure chain",
    stopCondition: "The distinct technical outcome is observed",
  }],
  strategyAssessment: {
    fingerprint: "distinct-repeated-technical-proof",
    repeated: true,
    prohibitedStrategies: ["repeat the different unchanged mechanism"],
    requiredRetryEvidence: ["decision-changing evidence for this chain"],
  },
  questionAnswers: null,
  ownerBoundary: null,
  evidenceRefs: ["evidence_distinct_repeated_strategy"],
  evidenceGaps: ["A distinct mechanism has not run for this chain"],
  confidence: "high",
}, distinctEpoch);
await probe.applyVerdict(distinctState, distinctEpoch, distinctVerdict);
const distinctContinuation = rootPromptTexts[rootPromptTexts.length - 1] ?? "";

const distinctFailureChain = strategyFingerprint(distinctVerdict);
const matchingTroubleshooterMessageID = "message_completed_troubleshooter_matching_chain";
runtimeMessages = [{
  info: { id: matchingTroubleshooterMessageID, role: "assistant" },
  parts: [{
    type: "tool",
    tool: "task",
    state: {
      status: "completed",
      input: {
        subagent_type: "troubleshooter",
        prompt: `Failure Chain: ${distinctFailureChain}\nMatched diagnosis case file`,
      },
    },
  }],
}];
const matchingRevisionBase = {
  ...revisionBase,
  assistantRef: hashRef("assistant", matchingTroubleshooterMessageID),
};
const matchingRevision = {
  ...matchingRevisionBase,
  revisionDigest: stableDigest(matchingRevisionBase),
};
root = {
  ...ownerRootAfterVerdict,
  metadata: { completionGuard: { grindEnabled: true, state: "running" } },
};
const matchingEpoch: AuditEpoch = {
  ...epoch("audit_matching_repeated_technical_proof"),
  inspected: matchingRevision,
  kind: "completion",
  questionRequest: null,
};
const matchingState: RootState = {
  ...initialRootState(root),
  activeAudit: matchingEpoch,
  auditAbort: new AbortController(),
  grindEnabled: true,
  state: "auditing",
};
const matchingVerdict: CompletionVerdict = {
  ...distinctVerdict,
  auditID: matchingEpoch.auditID,
  inspectedRevision: matchingRevision.revisionDigest,
};
await probe.applyVerdict(matchingState, matchingEpoch, matchingVerdict);
const matchingContinuation = rootPromptTexts[rootPromptTexts.length - 1] ?? "";
runtimeMessages = [];
root = ownerRootAfterVerdict;

const multiRequest = normalizeQuestionRequest({
  id: "question_multi_proof",
  tool: { callID: "call_multi_proof", messageID: "message_multi_proof" },
  questions: [
    {
      custom: false,
      header: "Primary",
      multiple: false,
      options: [
        { label: "Recommended", description: "Safest reversible local choice" },
        { label: "Alternative", description: "Another reversible local choice" },
      ],
      question: "Which primary strategy should I use?",
    },
    {
      custom: false,
      header: "Checks",
      multiple: true,
      options: [
        { label: "Static", description: "Run static validation" },
        { label: "Runtime", description: "Run disposable runtime proof" },
      ],
      question: "Which local checks should I run?",
    },
  ],
});
const multi = await runQuestionScenario(
  "multi",
  multiRequest,
  [["Recommended"], ["Static", "Runtime"]],
  "success",
);
const humanBeforeReply = await runQuestionScenario(
  "human_before_reply",
  request,
  [["Recommended"]],
  "human-before-reply",
);
const inFlightEvent = await runQuestionScenario(
  "in_flight_event",
  request,
  [["Recommended"]],
  "in-flight-event",
);
const disabledInFlight = await runQuestionScenario(
  "disable_in_flight",
  request,
  [["Recommended"]],
  "disable-in-flight",
);
const notFound = await runQuestionScenario(
  "not_found",
  request,
  [["Recommended"]],
  "not-found",
);
const interrupted = await runQuestionScenario(
  "interrupt_before_reply",
  request,
  [["Recommended"]],
  "interrupt-before-reply",
);
const stale = await runQuestionScenario(
  "stale_before_reply",
  request,
  [["Recommended"]],
  "stale-before-reply",
);
const capacity = await runQuestionScenario(
  "capacity",
  request,
  [["Recommended"]],
  "capacity",
);
let customOnlyRejected = false;
try {
  normalizeQuestionRequest({
    id: "question_custom_only",
    questions: [{ custom: true, header: "Custom", multiple: false, options: [], question: "Type a value" }],
  });
} catch {
  customOnlyRejected = true;
}
let unofferedRejected = false;
try {
  const invalidEpoch: AuditEpoch = { ...epoch("audit_unoffered"), questionRequest: request };
  parseCompletionVerdict({
    schemaVersion: 1,
    auditID: invalidEpoch.auditID,
    rootSessionRef: rootRef,
    inspectedRevision: revision.revisionDigest,
    verdict: "allow_stop",
    goalSummary: "Reject an unoffered answer",
    requirementMatrix: [],
    unresolved: [],
    strategyAssessment: {
      fingerprint: "question-unoffered",
      repeated: false,
      prohibitedStrategies: [],
      requiredRetryEvidence: [],
    },
    questionAnswers: [["Invented"]],
    ownerBoundary: null,
    evidenceRefs: [],
    evidenceGaps: [],
    confidence: "high",
  }, invalidEpoch);
} catch {
  unofferedRejected = true;
}
const continuationEpoch: AuditEpoch = { ...epoch("audit_continuation"), kind: "completion", questionRequest: null };
const continuationVerdict = parseCompletionVerdict({
  schemaVersion: 1,
  auditID: continuationEpoch.auditID,
  rootSessionRef: rootRef,
  inspectedRevision: revision.revisionDigest,
  verdict: "continue",
  goalSummary: "Continue one bounded local action",
  requirementMatrix: [{
    requirementRef: "requirement_continuation",
    status: "unresolved",
    evidenceRefs: [],
  }],
  unresolved: [{
    requirementRef: "requirement_continuation",
    evidenceGap: "The bounded local check has not run",
    nextAction: "Run the bounded local check",
    nextEvidence: "Capture its terminal output",
    stopCondition: "Stop when the terminal output is green",
  }],
  strategyAssessment: {
    fingerprint: "question-continuation",
    repeated: false,
    prohibitedStrategies: [],
    requiredRetryEvidence: [],
  },
  questionAnswers: null,
  ownerBoundary: null,
  evidenceRefs: [],
  evidenceGaps: [],
  confidence: "high",
}, continuationEpoch);
const continuation = buildContinuation(
  continuationVerdict,
  { agent: "build", model: null, tools: { question: true }, variant: null },
  "docs/session-strategy-history/root.md",
  false,
);
const idleController = new SessionCompletionController(
  { client: { app: { log: async () => ({ data: true }) } }, directory: root.directory } as never,
  { auditWindow: { enabled: false }, settleMs: 60_000, statusToasts: false },
  client as never,
);
const idleProbe = idleController as unknown as {
  roots: Map<string, RootState>;
  scheduleIdle(state: RootState): void;
};
const idleState = { ...initialRootState({ ...root, metadata: { completionGuard: { grindEnabled: true } } } as Session), grindEnabled: true };
idleProbe.roots.set(rootID, idleState);
idleProbe.scheduleIdle(idleState);
const firstIdleTimer = idleState.settleTimer;
idleProbe.scheduleIdle(idleState);
const duplicateIdleSuppressed = firstIdleTimer != null && idleState.settleTimer === firstIdleTimer;
await idleController.dispose();
const restoredPending = initialRootState({
  ...root,
  metadata: inFlightEvent.metadata,
} as Session);
const defaultOff = initialRootState({ ...root, metadata: undefined } as Session);
const matrix = {
  capacity: { replyCalls: capacity.replyCalls },
  customOnly: { rejected: customOnlyRejected },
  defaultOff: { grindEnabled: defaultOff.grindEnabled, state: defaultOff.state },
  duplicateIdle: { suppressed: duplicateIdleSuppressed },
  disable: {
    appliedReplies: disabledInFlight.appliedReplies,
    midReplyState: disabledInFlight.midReplyState,
    pendingRefs: disabledInFlight.pendingRefs,
    rootState: disabledInFlight.rootState,
  },
  humanBeforeReply: {
    pendingRefs: humanBeforeReply.pendingRefs,
    questionState: humanBeforeReply.questionState,
    replyCalls: humanBeforeReply.replyCalls,
    rootState: humanBeforeReply.rootState,
  },
  inFlightEvent: {
    appliedReplies: inFlightEvent.appliedReplies,
    pendingRefs: inFlightEvent.pendingRefs,
    questionState: inFlightEvent.questionState,
    restoredPendingRefs: restoredPending.pendingAutonomousQuestionRefs.size,
    rootState: inFlightEvent.rootState,
  },
  interrupt: {
    appliedReplies: interrupted.appliedReplies,
    pendingRefs: interrupted.pendingRefs,
    questionState: interrupted.questionState,
    replyCalls: interrupted.replyCalls,
    rootState: interrupted.rootState,
  },
  multi: {
    appliedReplies: multi.appliedReplies,
    pendingRefs: multi.pendingRefs,
    questionState: multi.questionState,
    replyCalls: multi.replyCalls,
  },
  notFound: {
    pendingRefs: notFound.pendingRefs,
    questionState: notFound.questionState,
    replyCalls: notFound.replyCalls,
  },
  stale: {
    pendingRefs: stale.pendingRefs,
    questionState: stale.questionState,
    replyCalls: stale.replyCalls,
    rootState: stale.rootState,
  },
  structuredContinuation: {
    questionAnswers: continuationVerdict.questionAnswers,
    synthetic: continuation.part.synthetic === true,
  },
  unoffered: { rejected: unofferedRejected },
};
console.log(JSON.stringify({ matrix }));
if (
  matrix.capacity.replyCalls !== 0 ||
  matrix.customOnly.rejected !== true ||
  matrix.defaultOff.grindEnabled !== false ||
  matrix.defaultOff.state !== "disabled" ||
  matrix.duplicateIdle.suppressed !== true ||
  matrix.disable.appliedReplies !== 0 ||
  matrix.disable.midReplyState !== "disabled" ||
  matrix.disable.pendingRefs !== 1 ||
  matrix.disable.rootState !== "disabled" ||
  matrix.humanBeforeReply.pendingRefs !== 0 ||
  matrix.humanBeforeReply.questionState !== "human-replied" ||
  matrix.humanBeforeReply.replyCalls !== 0 ||
  matrix.humanBeforeReply.rootState !== "running" ||
  matrix.inFlightEvent.appliedReplies !== 1 ||
  matrix.inFlightEvent.pendingRefs !== 1 ||
  matrix.inFlightEvent.questionState !== "resolution-unknown" ||
  matrix.inFlightEvent.restoredPendingRefs !== 1 ||
  matrix.inFlightEvent.rootState !== "running" ||
  matrix.interrupt.appliedReplies !== 0 ||
  matrix.interrupt.pendingRefs !== 1 ||
  matrix.interrupt.replyCalls !== 1 ||
  matrix.interrupt.rootState !== "paused" ||
  matrix.multi.appliedReplies !== 1 ||
  matrix.multi.pendingRefs !== 0 ||
  matrix.multi.questionState !== "guard-answered" ||
  matrix.multi.replyCalls !== 1 ||
  matrix.notFound.pendingRefs !== 0 ||
  matrix.notFound.questionState !== "human-replied" ||
  matrix.notFound.replyCalls !== 1 ||
  matrix.stale.pendingRefs !== 1 ||
  matrix.stale.replyCalls !== 0 ||
  matrix.stale.rootState !== "stale" ||
  matrix.structuredContinuation.questionAnswers !== null ||
  matrix.structuredContinuation.synthetic !== true ||
  matrix.unoffered.rejected !== true
) throw new Error(`Autonomous-question scenario matrix failed: ${JSON.stringify(matrix)}`);

const dbDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "grind-question-projection-"));
const dbPath = path.join(dbDirectory, "opencode.db");
try {
  const db = new Database(dbPath, { create: true });
  db.exec(`
    create table session (
      id text primary key,
      parent_id text,
      time_created integer,
      time_updated integer,
      metadata text
    );
    create table event (
      id text primary key,
      session_id text not null,
      time_created integer,
      type text,
      properties text
    );
    create table message (
      id text primary key,
      session_id text not null,
      time_created integer,
      data text
    );
    create table part (
      id text primary key,
      message_id text not null,
      session_id text not null,
      time_created integer,
      data text
    );
  `);
  db.run("insert into session values (?, null, ?, ?, ?)", [
    rootID,
    1_700_000_000_000,
    1_700_000_000_100,
    JSON.stringify(root.metadata),
  ]);
  db.run("insert into event values (?, ?, ?, ?, ?)", [
    "question-asked",
    rootID,
    1_700_000_000_010,
    "question.asked",
    JSON.stringify({ id: requestID, questions: request.questions }),
  ]);
  db.run("insert into event values (?, ?, ?, ?, ?)", [
    "question-replied",
    rootID,
    1_700_000_000_020,
    "question.replied",
    JSON.stringify({ requestID, answers: [["Recommended"]] }),
  ]);
  db.run("insert into message values (?, ?, ?, ?)", [
    "message_autonomous_question_proof",
    rootID,
    1_700_000_000_015,
    JSON.stringify({ role: "assistant" }),
  ]);
  db.run("insert into part values (?, ?, ?, ?, ?)", [
    "part_autonomous_question_proof",
    "message_autonomous_question_proof",
    rootID,
    1_700_000_000_020,
    JSON.stringify({
      type: "tool",
      tool: "question",
      callID: "call_autonomous_question_proof",
      state: {
        status: "completed",
        input: { questions: request.questions },
        metadata: { answers: [["Recommended"]] },
        title: "Asked 1 question",
      },
    }),
  ]);
  db.close();
  const projected = readProjectionInChild(dbPath, rootID);
  const result = {
    autonomousAnswer: replies[0]?.[0]?.[0] ?? null,
    autonomousFinalState: autonomousState.state,
    autonomousQuestionState: autonomousState.questions.get(requestID)?.state ?? null,
    ownerFinalState: ownerState.state,
    ownerQuestionState: ownerState.questions.get(requestID)?.state ?? null,
    projectedHumanReplies: projected.questionReplies.length,
    projectedInterventionAnswers: projected.questionInterventions[0]?.answers ?? [],
    projectedInterventionStatus: projected.questionInterventions[0]?.status ?? null,
    questionRejectCalls,
    distinctContinuationPending: distinctState.guardTurnPending,
    distinctRequiresTroubleshooter:
      distinctContinuation.includes('"requireTroubleshooter": true') &&
      distinctContinuation.includes("Invoke the diagnosis-only troubleshooter through the task adapter"),
    matchingContinuationPending: matchingState.guardTurnPending,
    matchingSuppressesTroubleshooter:
      matchingContinuation.includes('"requireTroubleshooter": false') &&
      !matchingContinuation.includes("Invoke the diagnosis-only troubleshooter through the task adapter"),
    repeatedContinuationPending: repeatedState.guardTurnPending,
    repeatedRequiresTroubleshooter:
      repeatedContinuation.includes('"requireTroubleshooter": true') &&
      repeatedContinuation.includes("Invoke the diagnosis-only troubleshooter through the task adapter"),
    replyCalls: replies.length,
    rootPromptCalls,
  };
  console.log(JSON.stringify(result));
  if (
    result.autonomousAnswer !== "Recommended" ||
    result.autonomousFinalState !== "running" ||
    result.autonomousQuestionState !== "guard-answered" ||
    result.ownerFinalState !== "owner-required" ||
    result.ownerQuestionState !== "owner-required" ||
    result.projectedHumanReplies !== 0 ||
    result.projectedInterventionAnswers[0]?.[0] !== "Recommended" ||
    result.projectedInterventionStatus !== "answered" ||
    result.questionRejectCalls !== 0 ||
    result.distinctContinuationPending !== true ||
    result.distinctRequiresTroubleshooter !== true ||
    result.matchingContinuationPending !== true ||
    result.matchingSuppressesTroubleshooter !== true ||
    result.repeatedContinuationPending !== true ||
    result.repeatedRequiresTroubleshooter !== true ||
    result.replyCalls !== 1 ||
    result.rootPromptCalls !== 3
  ) throw new Error(`Autonomous-question proof failed: ${JSON.stringify(result)}`);
} finally {
  await controller.dispose();
  removeProofFixture(dbDirectory);
}
