#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

type TestCase = { name: string; run: () => void };

const root = path.resolve(import.meta.dirname, "..");
const skillPath = path.join(root, "global/skills/roadmap-delivery-trajectory/SKILL.md");

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function includesAll(text: string, values: readonly string[], scope: string): void {
  for (const value of values) assert(text.includes(value), `${scope} missing '${value}'`);
}

function parseSkill(): { body: string; description: string; name: string; text: string } {
  const text = fs.readFileSync(skillPath, "utf8").replaceAll("\r\n", "\n");
  const match = /^---\n([\s\S]*?)\n---\n([\s\S]+)$/u.exec(text);
  assert(match != null, "skill must have bounded YAML frontmatter and a body");
  const fields = new Map(
    (match[1] ?? "").split("\n").map((line) => {
      const separator = line.indexOf(":");
      assert(separator > 0, `invalid frontmatter line '${line}'`);
      return [line.slice(0, separator).trim(), line.slice(separator + 1).trim()];
    }),
  );
  return {
    body: match[2] ?? "",
    description: fields.get("description") ?? "",
    name: fields.get("name") ?? "",
    text,
  };
}

const tests: TestCase[] = [
  {
    name: "frontmatter discovers only explicit post-archive roadmap trajectory triggers",
    run() {
      const skill = parseSkill();
      assert(skill.name === "roadmap-delivery-trajectory", "frontmatter name must match directory");
      assert(skill.description.startsWith("Use ONLY"), "description must be precisely gated");
      assert(skill.description.length <= 1_024, "description length bound");
      includesAll(skill.description.toLowerCase(), [
        "roadmap or phase",
        "delivery trajectory",
        "post-archive",
        "forecast",
        "bottleneck",
        "unit-of-work",
        "ordinary retrospective",
        "cohesive local work",
        "changed-code review",
        "complexity",
        "next-step",
        "exhaustive audit",
        "campaign",
      ], "description");
    },
  },
  {
    name: "skill binds explicit inputs and emits one compact evidence-bounded signal",
    run() {
      const { body } = parseSkill();
      includesAll(body, [
        "## Trigger",
        "## Stay Quiet",
        "## Required Inputs",
        "## Compact Signal",
        "successful linked archive",
        "normalized fact-helper output",
        "accepted outcome",
        "exit predicates",
        "non-deferrable invariants",
        "non-goals",
        "within-window | at-risk | outside-window | unknown",
        "none | review-required | unknown",
        "next discriminating read",
        "archive: archived",
        "trajectory: review-required | unknown",
      ], "input and signal contract");
      assert(!body.includes("infer a horizon"), "skill must not infer Horizon membership");
    },
  },
  {
    name: "review separates cost axes population evidence forecast and closed dispositions",
    run() {
      const { body } = parseSkill();
      includesAll(body, [
        "## Deep Review",
        "engineering/setup",
        "proof/validation",
        "external/runtime execution",
        "coordination/recovery",
        "context/comprehension",
        "item count `N`",
        "owner/mechanism count `K`",
        "automated per-item processing",
        "irreducible per-item evidence",
        "continue | measure-next-boundary | replan-outcome-preserving | owner-required | unknown",
        "observed measurements",
        "bounded assumptions",
        "forecast-invalidating",
        "calendar forecast is `unknown`",
      ], "deep-review contract");
      includesAll(body.toLowerCase(), [
        "do not aggregate",
        "counts are facts",
        "one slow change",
        "task count",
        "line count",
        "token",
      ], "anti-metric boundary");
    },
  },
  {
    name: "receipt duplicate authority and successor rules preserve archive and owner boundaries",
    run() {
      const { body } = parseSkill();
      includesAll(body, [
        "## Duplicate Suppression",
        "## Disposition And Authority",
        "## Output",
        "decision-context digest",
        "trigger-evidence digest",
        "archive identity is non-key metadata",
        "reviewedAt",
        "do-not-repeat condition",
        "retry condition",
        "measure-next-boundary",
        "replan-outcome-preserving",
        "materializeTrajectoryReviewReceipt",
        "reviews/<receipt-key>.json",
        "canonical OpenSpec propose workflow",
        "owner-required",
        "Receipt Seed",
        "Successor",
      ], "receipt and authority contract");
      includesAll(body.toLowerCase(), [
        "no no-trigger receipt",
        "do not repeat",
        "after every valid triggered review",
        "persist the receipt but do not invent a successor",
        "archived change remains immutable",
        "do not add a final-history task",
        "no reviewer",
        "main retains",
        "capability unavailable",
        "no adjacent-skill fallback",
      ], "authority safeguards");
    },
  },
];

let failed = 0;
for (const test of tests) {
  try {
    test.run();
    console.log(`PASS ${test.name}`);
  } catch (error) {
    failed++;
    console.error(`FAIL ${test.name}`);
    console.error(error instanceof Error ? error.stack ?? error.message : String(error));
  }
}

if (failed > 0) throw new Error(`${failed} roadmap delivery trajectory test(s) failed.`);
console.log(`OK: roadmap delivery trajectory tests=${tests.length}`);
