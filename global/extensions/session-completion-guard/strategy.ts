import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import type { CompletionVerdict } from "./types.ts";

type StrategyContext = {
  background: Array<{ agent: string | null; failureChain: string | null; status: string }>;
  humanMessages: Array<{ text: string }>;
};

export type StrategyJournal = {
  absolutePath: string;
  digest: string;
  relativePath: string;
  source: "docs_fallback" | "openspec_history";
};

function digest(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function activeChanges(directory: string): string[] {
  const changes = path.join(directory, "openspec", "changes");
  if (!fs.existsSync(changes)) return [];
  return fs.readdirSync(changes, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name !== "archive")
    .map((entry) => entry.name)
    .sort((left, right) => left.localeCompare(right));
}

function mentionedChanges(context: StrategyContext, candidates: string[]): string[] {
  const human = context.humanMessages.map((message) => message.text.toLowerCase()).join("\n");
  return candidates.filter((candidate) => human.includes(candidate.toLowerCase()));
}

function safeFallbackRoot(directory: string, configured: string): string {
  const resolved = path.resolve(directory, configured);
  const project = path.resolve(directory);
  const relative = path.relative(project, resolved);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error("Completion guard strategyFallback must remain inside the project directory");
  }
  return resolved;
}

export function discoverStrategyJournal(
  directory: string,
  rootRef: string,
  context: StrategyContext,
  configuredFallback: string,
): StrategyJournal {
  const candidates = activeChanges(directory);
  const mentioned = mentionedChanges(context, candidates);
  const humanMentionsOpenSpec = context.humanMessages.some((message) => /\bopenspec\b/iu.test(message.text));
  const selected = mentioned.length === 1
    ? mentioned[0]
    : mentioned.length === 0 && candidates.length === 1 && humanMentionsOpenSpec
      ? candidates[0]
      : null;
  const absolutePath = selected == null
    ? path.join(safeFallbackRoot(directory, configuredFallback), `${rootRef}.md`)
    : path.join(directory, "openspec", "changes", selected, "history.md");
  const relativePath = path.relative(directory, absolutePath).replaceAll("\\", "/");
  const content = fs.existsSync(absolutePath) ? fs.readFileSync(absolutePath, "utf8") : "";
  return {
    absolutePath,
    digest: digest(content),
    relativePath,
    source: selected == null ? "docs_fallback" : "openspec_history",
  };
}

export function strategyFingerprint(verdict: CompletionVerdict): string {
  const material = {
    frontierGeneration: verdict.frontierGeneration,
    selectedItemRef: verdict.selectedItemRef,
    supplied: verdict.strategyAssessment.fingerprint,
    unresolved: verdict.unresolved.map((item) => ({
      requirementRef: item.requirementRef,
      evidenceGap: item.evidenceGap,
      nextAction: item.nextAction,
      stopCondition: item.stopCondition,
    })),
  };
  return digest(JSON.stringify(material));
}

export function hasVerifiedTroubleshooter(context: StrategyContext, failureChain: string): boolean {
  return context.background.some(
    (item) =>
      item.agent === "troubleshooter" &&
      item.status === "completed" &&
      item.failureChain === failureChain,
  );
}

export function executionEpochDisposition(input: {
  continuationCycles: number;
  maxCycles: number;
  repeated: boolean;
}): "continue" | "rollover" | "wait-budget" {
  if (input.maxCycles < 0 || input.continuationCycles < input.maxCycles) return "continue";
  return input.repeated ? "wait-budget" : "rollover";
}

export function isJournalOnlyPath(file: string): boolean {
  const normalized = file.replaceAll("\\", "/");
  return (
    /^openspec\/changes\/[^/]+\/history\.md$/i.test(normalized) ||
    /^docs\/session-strategy-history\/[^/]+\.md$/i.test(normalized)
  );
}
