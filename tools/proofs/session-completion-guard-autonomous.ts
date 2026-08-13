#!/usr/bin/env bun
import {
  proofClient,
  requestData,
} from "./lib/opencode-proof-client.ts";
import { readSessionDeliveryContext } from "../../global/plugin/session-delivery-context/index.ts";

type Arguments = {
  agent: string;
  directory: string;
  modelID: string;
  providerID: string;
  serverUrl: string;
  variant: string | null;
};

const runtime = globalThis as typeof globalThis & {
  process: {
    argv: string[];
    cwd(): string;
    env: Record<string, string | undefined>;
  };
};

function argumentValue(name: string): string | null {
  const index = runtime.process.argv.indexOf(name);
  return index < 0 ? null : runtime.process.argv[index + 1] ?? null;
}

function argumentsFromCli(): Arguments {
  const serverUrl = argumentValue("--server-url") ?? runtime.process.env.OPENCODE_PROOF_SERVER_URL ?? null;
  if (serverUrl == null) {
    throw new Error(
      "Usage: bun tools/proofs/session-completion-guard-autonomous.ts --server-url http://127.0.0.1:<port> [--directory <path>] [--agent <name>] [--provider <id>] [--model <id>] [--variant <name>]",
    );
  }
  return {
    agent: argumentValue("--agent") ?? "build",
    directory: argumentValue("--directory") ?? runtime.process.cwd(),
    modelID: argumentValue("--model") ?? "grok-4.6",
    providerID: argumentValue("--provider") ?? "xai",
    serverUrl,
    variant: argumentValue("--variant") ?? "high",
  };
}

function record(value: unknown): Record<string, unknown> | null {
  return value != null && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

function textParts(parts: unknown[]): string[] {
  return parts.flatMap((part) => {
    const value = record(part);
    return value?.type === "text" && typeof value.text === "string" ? [value.text] : [];
  });
}

function questionParts(messages: Array<{ parts: unknown[] }>): Array<Record<string, unknown>> {
  return messages.flatMap((message) => message.parts.flatMap((part) => {
    const value = record(part);
    return value?.type === "tool" && value.tool === "question" ? [value] : [];
  }));
}

async function waitForTerminalGuard(
  client: ReturnType<typeof proofClient>,
  sessionID: string,
  directory: string,
  timeoutMs = 420_000,
): Promise<Record<string, unknown>> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const root = await requestData<Record<string, unknown>>(client.session.get({ sessionID, directory }), "root status");
    const metadata = record(root.metadata);
    const guard = record(metadata?.completionGuard);
    const state = guard?.state;
    if (["error", "owner-required", "passed", "paused"].includes(String(state))) return guard ?? {};
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`Guard did not reach a terminal state within ${timeoutMs}ms`);
}

const args = argumentsFromCli();
const client = proofClient(args.serverUrl, args.directory);
const tools = Object.fromEntries(
  (await requestData<string[]>(client.tool.ids({ directory: args.directory }), "tool ids"))
    .map((id) => [id, id === "question"]),
);
if (tools.question !== true || Object.entries(tools).some(([id, enabled]) => id !== "question" && enabled)) {
  throw new Error("Autonomous question proof could not isolate the real question tool");
}

let rootID: string | null = null;
let proofError: unknown = null;
try {
  const root = await requestData<Record<string, unknown>>(client.session.create({
    directory: args.directory,
    title: "grind autonomous question proof",
    metadata: { completionGuard: { grindEnabled: true, state: "running" } },
  }), "proof root create");
  rootID = String(root.id);
  const promptResult = await requestData<{ info: Record<string, unknown>; parts: unknown[] }>(client.session.prompt({
    sessionID: rootID,
    directory: args.directory,
    agent: args.agent,
    model: { providerID: args.providerID, modelID: args.modelID },
    ...(args.variant == null ? {} : { variant: args.variant }),
    tools,
    system: "This is a deterministic boundary probe. Call the only enabled tool exactly once. Ask one single-select question with header Strategy, question Which safe local strategy should I use?, options Recommended described Safest reversible local choice and Alternative described Another reversible local choice. Recommended is the safe choice. After the tool returns, emit exactly QUESTION_PROBE_SELECTED=<selected label> and stop.",
    parts: [{ type: "text", text: "Start the required question probe." }],
  }), "question probe prompt");
  if (promptResult.info.error != null) throw new Error("Question probe returned an assistant error");

  const guard = await waitForTerminalGuard(client, rootID, args.directory);
  const messages = await requestData<Array<{ info: Record<string, unknown>; parts: unknown[] }>>(
    client.session.messages({ sessionID: rootID, directory: args.directory }),
    "proof messages",
  );
  const questions = questionParts(messages);
  const questionState = record(questions[0]?.state);
  const questionInput = record(questionState?.input);
  const inputQuestions = Array.isArray(questionInput?.questions) ? questionInput.questions.map(record) : [];
  const inputOptions = Array.isArray(inputQuestions[0]?.options) ? inputQuestions[0].options.map(record) : [];
  const offeredLabels = inputOptions.flatMap((option) => typeof option?.label === "string" ? [option.label] : []);
  const safeLabel = inputOptions.find(
    (option) => option?.description === "Safest reversible local choice" && typeof option.label === "string",
  )?.label ?? null;
  const questionMetadata = record(questionState?.metadata);
  const answers = Array.isArray(questionMetadata?.answers) ? questionMetadata.answers : [];
  const selectedAnswer = Array.isArray(answers[0]) && typeof answers[0][0] === "string" ? answers[0][0] : null;
  const assistantText = messages.flatMap((message) => textParts(message.parts));
  const projection = readSessionDeliveryContext({ resolveRoot: true, sessionId: rootID });
  const children = await requestData<Array<Record<string, unknown>>>(
    client.session.children({ sessionID: rootID, directory: args.directory }),
    "proof children",
  );
  const auditStatuses = children.flatMap((child) => {
    const metadata = record(child.metadata);
    const completionGuard = record(metadata?.completionGuard);
    return completionGuard == null ? [] : [String(completionGuard.status ?? "unknown")];
  });
  const result = {
    assistantMarker: selectedAnswer != null && assistantText.includes(`QUESTION_PROBE_SELECTED=${selectedAnswer}`),
    auditStatuses,
    autonomousRefs: Array.isArray(guard.autonomousQuestionRefs) ? guard.autonomousQuestionRefs.length : 0,
    cleanup: "pending",
    guardState: guard.state ?? null,
    humanQuestionReplies: projection.questionReplies.length,
    model: `${args.providerID}/${args.modelID}/${args.variant ?? "default"}`,
    openCodeVersion: root.version ?? null,
    offeredLabels,
    pendingRefs: Array.isArray(guard.pendingAutonomousQuestionRefs) ? guard.pendingAutonomousQuestionRefs.length : 0,
    projectedAnswer: projection.questionInterventions[0]?.answers[0]?.[0] ?? null,
    projectedStatus: projection.questionInterventions[0]?.status ?? null,
    questionCalls: questions.length,
    questionStatus: questionState?.status ?? null,
    safeLabel,
    selectedAnswer,
    toolOnlyQuestion: Object.entries(tools).filter(([, enabled]) => enabled).map(([id]) => id),
  };
  console.log(JSON.stringify(result));
  if (
    result.assistantMarker !== true ||
    result.auditStatuses[result.auditStatuses.length - 1] !== "passed" ||
    result.autonomousRefs !== 1 ||
    result.guardState !== "passed" ||
    result.humanQuestionReplies !== 0 ||
    result.pendingRefs !== 0 ||
    result.offeredLabels.length !== 2 ||
    !result.offeredLabels.includes(String(result.selectedAnswer)) ||
    result.projectedAnswer !== result.selectedAnswer ||
    result.projectedStatus !== "answered" ||
    result.questionCalls !== 1 ||
    result.questionStatus !== "completed" ||
    result.safeLabel == null ||
    result.selectedAnswer !== result.safeLabel
  ) throw new Error(`Installed autonomous question proof failed: ${JSON.stringify(result)}`);
} catch (error) {
  proofError = error;
  throw error;
} finally {
  if (rootID != null) {
    let cleanupError: unknown = null;
    try {
      const children = await requestData<Array<Record<string, unknown>>>(
        client.session.children({ sessionID: rootID, directory: args.directory }),
        "cleanup children",
      );
      for (const child of children) {
        const response = await client.session.delete({ sessionID: String(child.id), directory: args.directory }) as { error?: unknown };
        if (response.error != null) throw response.error;
      }
      const response = await client.session.delete({ sessionID: rootID, directory: args.directory }) as { error?: unknown };
      if (response.error != null) throw response.error;
      console.log(JSON.stringify({ cleanup: "complete", rootDeleted: true }));
    } catch (error) {
      cleanupError = error;
    }
    if (cleanupError != null && proofError == null) {
      const wrapped = new Error("Autonomous question proof cleanup failed") as Error & { cause?: unknown };
      wrapped.cause = cleanupError;
      throw wrapped;
    }
  }
}
