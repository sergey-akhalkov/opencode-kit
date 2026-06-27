import { hashRef } from "./redaction.ts";

export type DeliveryContextRequirementSignalKind =
  | "archive_when_complete"
  | "blocker_escalation_gate"
  | "new_change_approval_required"
  | "openspec_all_changes"
  | "push_after_archive"
  | "push_all";

export type DeliveryContextUserMessageLike = {
  eventRef: string;
  text: string;
  time: string | null;
};

export type DeliveryContextRequirementSignal = {
  eventRef: string;
  kind: DeliveryContextRequirementSignalKind;
  messageRef: string;
  text: string;
  time: string | null;
};

const REQUIREMENT_PUSH_NEGATION_IN_MATCH_PATTERN =
  /(?:do\s+not|don't|dont|must\s+not|should\s+not|never|not|no|не|нельзя|не\s+надо|не\s+нужно)\s+[\s\S]{0,80}(?:push|пуш|запуш)/iu;

export const REQUIREMENT_SIGNAL_RULES: Array<{
  kind: DeliveryContextRequirementSignalKind;
  negationInMatch?: RegExp;
  pattern: RegExp;
  text: string;
}> = [
  {
    kind: "openspec_all_changes",
    pattern:
      /(?:реализ(?:уй|овать)|сдел[а-я]*|implement|complete|finish)[\s\S]{0,120}(?:все|all|every|кажд[а-я]*)[\s\S]{0,80}openspec[\s\S]{0,80}changes?/iu,
    text: "User requested all OpenSpec changes implemented in full.",
  },
  {
    kind: "archive_when_complete",
    pattern:
      /(?:как\s+закончишь[\s\S]{0,60}заархив|(?:потом|затем)[\s\S]{0,60}архив|archive[\s\S]{0,80}(?:when\s+(?:complete|done)|after\s+(?:completion|finishing)|once\s+complete)|(?:then|afterwards)[\s\S]{0,60}archive)/iu,
    text: "User requested archive after completion.",
  },
  {
    kind: "push_after_archive",
    negationInMatch: REQUIREMENT_PUSH_NEGATION_IN_MATCH_PATTERN,
    pattern:
      /(?:каждый\s+раз[\s\S]{0,80}архив[\s\S]{0,80}(?:пуш|запуш)|архив[\s\S]{0,80}(?:пуш|запуш)|(?:archive|archiving|archived)[\s\S]{0,80}(?:push|git)|(?:then|afterwards)[\s\S]{0,80}push)/iu,
    text: "User requested push after each archive.",
  },
  {
    kind: "blocker_escalation_gate",
    pattern: /(?:блокер[\s\S]{0,120}эскалир|escalat[\s\S]{0,80}blocker)/iu,
    text: "User allowed blocker escalation only under stated conditions.",
  },
  {
    kind: "new_change_approval_required",
    pattern:
      /(?:нов[а-я]*\s+change[\s\S]{0,120}соглас|create[\s\S]{0,40}new\s+change[\s\S]{0,80}(?:ask|approv|confirm))/iu,
    text: "User required approval before creating a new OpenSpec change.",
  },
  {
    kind: "push_all",
    pattern: /(?:запушь\s+все|push\s+all)/iu,
    text: "User requested pushing all completed work.",
  },
];

const REQUIREMENT_NEGATION_PREFIX_PATTERN =
  /(?:do\s+not|don't|dont|must\s+not|should\s+not|never|not|no|не|нельзя|не\s+надо|не\s+нужно)\s+[\s\S]{0,80}$/iu;

function lastClauseBoundary(text: string, index: number): number {
  return (
    Math.max(
      text.lastIndexOf(".", index),
      text.lastIndexOf("!", index),
      text.lastIndexOf("?", index),
      text.lastIndexOf(";", index),
      text.lastIndexOf("\n", index),
    ) + 1
  );
}

function requirementMatches(pattern: RegExp, text: string): RegExpMatchArray[] {
  const flags = pattern.flags.includes("g") ? pattern.flags : `${pattern.flags}g`;
  return [...text.matchAll(new RegExp(pattern.source, flags))];
}

function positiveRequirementSignal(
  rule: { negationInMatch?: RegExp; pattern: RegExp },
  text: string,
): boolean {
  for (const match of requirementMatches(rule.pattern, text)) {
    if (match.index == null) {
      continue;
    }
    const clauseStart = lastClauseBoundary(text, match.index);
    const prefix = text.slice(clauseStart, match.index);
    const span = match[0];
    if (
      !REQUIREMENT_NEGATION_PREFIX_PATTERN.test(prefix) &&
      rule.negationInMatch?.test(span) !== true
    ) {
      return true;
    }
  }
  return false;
}

export function detectRequirementSignals(
  userMessages: ReadonlyArray<DeliveryContextUserMessageLike>,
): DeliveryContextRequirementSignal[] {
  const signals: DeliveryContextRequirementSignal[] = [];
  const seen = new Set<string>();
  for (const message of userMessages) {
    for (const rule of REQUIREMENT_SIGNAL_RULES) {
      if (!positiveRequirementSignal(rule, message.text)) {
        continue;
      }
      const key = `${message.eventRef}:${rule.kind}`;
      if (seen.has(key)) {
        continue;
      }
      seen.add(key);
      signals.push({
        eventRef: hashRef("requirement", key),
        kind: rule.kind,
        messageRef: message.eventRef,
        text: rule.text,
        time: message.time,
      });
    }
  }
  return signals;
}
