#!/usr/bin/env bun
import type { Session } from "../../global/node_modules/@opencode-ai/sdk/dist/v2/index.js";
import { SessionCompletionController } from "../../global/extensions/session-completion-guard/controller.ts";
import {
  initialRootState,
  stableDigest,
} from "../../global/extensions/session-completion-guard/runtime-support.ts";
import { discoverStrategyJournal } from "../../global/extensions/session-completion-guard/strategy.ts";
import type {
  AuditEpoch,
  CompletionVerdict,
  RootState,
} from "../../global/extensions/session-completion-guard/types.ts";
import { parseCompletionVerdict } from "../../global/extensions/session-completion-guard/verdict.ts";

const rootID = "session_owner_question_proof_root";
const childID = "session_owner_question_proof_child";
const rootRef = "session_owner_question_proof_ref";
const requestID = "question_owner_question_proof";
const rootDirectory = "C:/Users/Sergey/AppData/Local/Temp/opencode/grind-owner-question-proof";
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
  projectID: "project_owner_question_proof",
  directory: rootDirectory,
  title: "owner question proof root",
  version: "1",
  time: { created: 0, updated: 0 },
} as Session;
let child = {
  ...root,
  id: childID,
  parentID: rootID,
  title: "owner question proof child",
} as Session;
let questionRejectCalls = 0;
let rootPromptCalls = 0;

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
    messages: async () => ({ data: [] }),
    todo: async () => ({ data: [] }),
    diff: async () => ({ data: [] }),
    promptAsync: async () => {
      rootPromptCalls += 1;
      return { data: true };
    },
  },
  question: {
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
const epoch: AuditEpoch = {
  auditID: "audit_owner_question_proof",
  attempt: 1,
  childSessionID: childID,
  completionEvidence: null,
  inspected: revision,
  kind: "question",
  questionRequestID: requestID,
  rootRef,
  rootSessionID: rootID,
};
const state: RootState = {
  ...initialRootState(root),
  activeAudit: epoch,
  auditAbort: new AbortController(),
  grindEnabled: true,
  state: "question-auditing",
};
state.questions.set(requestID, {
  auditID: epoch.auditID,
  requestID,
  state: "open",
});

const verdict: CompletionVerdict = parseCompletionVerdict({
  schemaVersion: 1,
  auditID: epoch.auditID,
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
  ownerBoundary: {
    decision: "Owner selects the protected action",
    reason: "The action requires owner authority",
    evidenceRefs: ["evidence_owner_boundary"],
  },
  evidenceRefs: ["evidence_owner_boundary"],
  evidenceGaps: [],
  confidence: "high",
}, epoch);

const probe = controller as unknown as {
  applyVerdict(state: RootState, epoch: AuditEpoch, verdict: CompletionVerdict): Promise<void>;
};
await probe.applyVerdict(state, epoch, verdict);

const question = state.questions.get(requestID);
const result = {
  finalState: state.state,
  ownerBoundaryDecisionChars: verdict.ownerBoundary?.decision.length ?? 0,
  questionRejectCalls,
  questionState: question?.state ?? null,
  rootPromptCalls,
};
console.log(JSON.stringify(result));
await controller.dispose();
if (
  result.finalState !== "owner-required" ||
  result.questionState !== "owner-required" ||
  result.ownerBoundaryDecisionChars === 0 ||
  result.questionRejectCalls !== 0 ||
  result.rootPromptCalls !== 0
) throw new Error(`Owner-question proof failed: ${JSON.stringify(result)}`);
