#!/usr/bin/env bun
import { buildArbiterAuditRequest, buildArbiterRetryRequest } from "../../global/extensions/session-completion-guard/arbiter-evidence.ts";
import { parseCompletionVerdictText } from "../../global/extensions/session-completion-guard/verdict.ts";
import type { AuditEpoch } from "../../global/extensions/session-completion-guard/types.ts";
import {
  createRoutedProofSessions,
  deleteProofSessions,
  disabledToolMap,
  proofClient,
  requestData,
  waitForProofRoute,
  type RoutedProofSessions,
} from "./lib/opencode-proof-client.ts";

type ProofMode = "live" | "preflight";

type Arguments = {
  agent: string;
  directory: string;
  mode: ProofMode;
  serverUrl: string;
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
  const mode = argumentValue("--mode");
  const serverUrl = argumentValue("--server-url") ?? runtime.process.env.OPENCODE_PROOF_SERVER_URL ?? null;
  if ((mode !== "preflight" && mode !== "live") || serverUrl == null) {
    throw new Error(
      "Usage: bun tools/proofs/session-completion-guard-retry.ts --mode preflight|live --server-url http://127.0.0.1:<port> [--directory <path>] [--agent <name>]",
    );
  }
  return {
    agent: argumentValue("--agent") ?? "session-completion-arbiter",
    directory: argumentValue("--directory") ?? runtime.process.cwd(),
    mode,
    serverUrl,
  };
}

function safeVerdictDiagnostic(text: string, error: unknown, epoch: AuditEpoch) {
  let value: Record<string, unknown> | null = null;
  try {
    const parsed = JSON.parse(text);
    if (parsed != null && typeof parsed === "object" && !Array.isArray(parsed)) value = parsed as Record<string, unknown>;
  } catch {
    // Emit only structural facts; never echo evidence-bearing model text.
  }
  return {
    correlation: {
      auditID: value?.auditID === epoch.auditID,
      inspectedRevision: value?.inspectedRevision === epoch.inspected.revisionDigest,
      rootSessionRef: value?.rootSessionRef === epoch.rootRef,
    },
    keys: value == null ? [] : Object.keys(value).sort(),
    ownerBoundaryKind: value?.ownerBoundary === null ? "null" : typeof value?.ownerBoundary,
    parseError: error instanceof Error ? error.message : String(error),
    schemaVersion: value?.schemaVersion ?? null,
    textChars: text.length,
    verdict: typeof value?.verdict === "string" ? value.verdict.slice(0, 80) : typeof value?.verdict,
  };
}

function textOf(parts: unknown[]): string {
  return parts.flatMap((part) => {
    const value = part as { type?: string; text?: string };
    return value.type === "text" && typeof value.text === "string" ? [value.text] : [];
  }).join("");
}

const args = argumentsFromCli();
const client = proofClient(args.serverUrl, args.directory);
const route = await waitForProofRoute(client, args.directory, args.agent);
if (!route.hidden) throw new Error(`Completion arbiter must remain hidden: ${route.agent}`);
const tools = await disabledToolMap(client, args.directory);
let sessions: RoutedProofSessions | null = null;

try {
  sessions = await createRoutedProofSessions(client, args.directory, route, "grind bounded retry proof");
  const readback = await requestData<Record<string, unknown>>(client.session.get({
    directory: args.directory,
    sessionID: sessions.child.id,
  }) as Promise<unknown>, "proof child readback");
  const readbackModel = readback.model as { id?: unknown; providerID?: unknown; variant?: unknown } | undefined;
  const routeEvidence = {
    agent: readback.agent,
    childParent: readback.parentID === sessions.root.id,
    hidden: route.hidden,
    model: `${readbackModel?.providerID}/${readbackModel?.id}/${readbackModel?.variant ?? "default"}`,
    serverUrl: new URL(args.serverUrl).origin,
  };
  if (
    routeEvidence.agent !== route.agent ||
    routeEvidence.childParent !== true ||
    readbackModel?.providerID !== route.model.providerID ||
    readbackModel.id !== route.model.modelID ||
    (readbackModel.variant ?? null) !== route.variant
  ) throw new Error(`Proof child route readback failed: ${JSON.stringify(routeEvidence)}`);

  if (args.mode === "preflight") {
    console.log(JSON.stringify({ ...routeEvidence, modelCalls: 0 }));
  } else {
    const revision = {
      assistantRef: "assistant_proof",
      diffDigest: "diff_proof",
      humanRef: "human_proof",
      journalDigest: "journal_proof",
      leaseGeneration: 0,
      revisionDigest: "revision_proof",
      todoDigest: "todo_proof",
    };
    const epoch: AuditEpoch = {
      auditID: "audit_bounded_retry_proof",
      attempt: 1,
      childSessionID: sessions.child.id,
      completionEvidence: null,
      inspected: revision,
      kind: "completion",
      questionRequestID: null,
      rootRef: "session_bounded_retry_proof",
      rootSessionID: sessions.root.id,
    };
    const first = buildArbiterAuditRequest(epoch, {
      context: { assistantEvidence: [], background: [], humanMessages: [] },
      journal: {
        absolutePath: "history.md",
        digest: revision.journalDigest,
        relativePath: "history.md",
        source: "docs_fallback",
      },
      revision,
    }, {
      schemaVersion: 2,
      session: { sessionRef: epoch.rootRef },
      humanMessages: [{ eventRef: "message_proof", text: "The bounded synthetic transport proof is complete." }],
      requirementSignals: [],
      todos: { current: [], ever: [], history: { entries: [], toolCalls: 0 }, open: [], unresolved: [] },
      validationEvidence: [{ eventRef: "evidence_proof", status: "passed" }],
    } as never);
    const prompt = (text: string) => requestData<{ info: Record<string, unknown>; parts: unknown[] }>(
      client.session.prompt({
        agent: route.agent,
        directory: args.directory,
        model: route.model,
        parts: [{ type: "text", text, synthetic: true }],
        sessionID: sessions!.child.id,
        tools,
        ...(route.variant == null ? {} : { variant: route.variant }),
      }) as Promise<unknown>,
      "arbiter prompt",
    );
    const firstResult = await prompt(first);
    if (firstResult.info.error != null) throw new Error("Initial hidden arbiter call returned an assistant error");
    epoch.attempt = 2;
    const retry = buildArbiterRetryRequest(epoch, "An owner_required verdict requires ownerBoundary");
    const retryResult = await prompt(retry);
    if (retryResult.info.error != null) throw new Error("Bounded hidden arbiter retry returned an assistant error");
    try {
      const verdict = parseCompletionVerdictText(retryResult.parts, epoch);
      console.log(JSON.stringify({
        ...routeEvidence,
        firstChars: first.length,
        retryChars: retry.length,
        retryHasEvidence: retry.includes("completionEvidence"),
        validCorrelation: true,
        verdict: verdict.verdict,
      }));
    } catch (error) {
      console.log(JSON.stringify({ ...routeEvidence, ...safeVerdictDiagnostic(textOf(retryResult.parts), error, epoch) }));
      throw error;
    }
  }
} finally {
  if (sessions != null) await deleteProofSessions(client, args.directory, sessions);
}
