#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import {
  assertFailure,
  assertOutputContains,
  assertOutputExcludes,
  assertSuccess,
  invokeInstructionInventory,
  invokeProcessCapture,
  libraryRoot,
  lines,
  newLibraryFixture,
  newTempDir,
  validator,
  writeText,
} from "./test-helpers/library.ts";

type TestCase = {
  name: string;
  run: () => void;
};

function sha256(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

const canonicalizer = path.join(libraryRoot, "tools", "instruction-context-quality.ts");
const maintainedSeed = path.join(libraryRoot, "config", "instruction-context-quality.json");

function invokePackage(args: string[]) {
  return process.platform === "win32"
    ? invokeProcessCapture("cmd.exe", ["/d", "/s", "/c", "npm.cmd", ...args], libraryRoot)
    : invokeProcessCapture("npm", args, libraryRoot);
}

function withFixture(name: string, run: (fixture: string) => void): void {
  const fixture = newTempDir(name);
  try {
    run(fixture);
  } finally {
    fs.rmSync(fixture, { force: true, recursive: true });
  }
  if (fs.existsSync(fixture)) throw new Error(`Fixture cleanup failed: ${name}`);
}

function installSeed(fixture: string): string {
  return writeSeed(fixture);
}

function writeSeed(
  fixture: string,
  duplicateExceptions: unknown[] = [],
  rules: unknown[] = JSON.parse(fs.readFileSync(maintainedSeed, "utf8")).rules,
): string {
  const seed = path.join(fixture, "config", "instruction-context-quality.json");
  writeText(seed, `${JSON.stringify({ schemaVersion: 1, rules, duplicateExceptions }, null, 2)}\n`);
  return seed;
}

function sharedException(consumers: { heading: string; path: string }[] = [{ heading: "Shared", path: "instructions/consumer.md" }]) {
  return {
    id: "independent-loader-shared",
    owner: { heading: "Shared", path: "global/AGENTS.md" },
    consumers,
    reason: "The maintained sources load independently and each requires the local instruction.",
  };
}

function invoke(fixture: string, args: string[]) {
  return invokePackage(["run", "instruction:canonicalize", "--", "--root", fixture, ...args]);
}

function invokeDirect(fixture: string, args: string[]) {
  return invokeProcessCapture("node", [canonicalizer, "--root", fixture, ...args], libraryRoot);
}

const tests: TestCase[] = [
  {
    name: "provides effect-free help aliases",
    run: () => {
      withFixture("instruction-context-help", (fixture) => {
        const sentinel = path.join(fixture, "source.md");
        writeText(sentinel, "unchanged\n");
        const before = fs.readFileSync(sentinel, "utf8");
        for (const flag of ["--help", "-h"]) {
          const result = invokePackage(["run", "instruction:canonicalize", "--", flag, "--root", path.join(fixture, "missing")]);
          assertSuccess(result, `${flag} should not require a readable root or seed.`);
          assertOutputContains(result, "Usage:", `${flag} should print usage.`);
        }
        if (fs.readFileSync(sentinel, "utf8") !== before) throw new Error("Help changed source bytes.");
      });
    },
  },
  {
    name: "fails malformed seed without source drift",
    run: () => {
      withFixture("instruction-context-malformed", (fixture) => {
        const source = path.join(fixture, "global", "AGENTS.md");
        const seed = path.join(fixture, "config", "instruction-context-quality.json");
        writeText(source, lines(["# Instructions", "", "Act in order to verify the result.", ""]));
        writeText(seed, '{"schemaVersion":1,"rules":"invalid","duplicateExceptions":[]}\n');
        const before = fs.readFileSync(source, "utf8");
        const result = invokeDirect(fixture, ["--write", fixture]);
        assertFailure(result, "Malformed seed should fail closed.");
        assertOutputContains(result, "Context-quality seed.rules must be an array", "Failure should retain the seed cause.");
        assertOutputExcludes(result, fixture, "Failure should redact the fixture root.");
        if (fs.readFileSync(source, "utf8") !== before) throw new Error("Malformed seed changed source bytes.");
      });
    },
  },
  {
    name: "keeps protected Markdown unchanged",
    run: () => {
      withFixture("instruction-context-protected", (fixture) => {
        installSeed(fixture);
        const source = path.join(fixture, "global", "AGENTS.md");
        writeText(source, lines([
          "# Instructions",
          "",
          "Keep `in order to` exact.",
          "",
          'Keep the quoted requirement "in order to" exact.',
          "",
          "Use [in order to](https://example.test/in-order-to) as written.",
          "",
          "```text",
          "in order to",
          "```",
          "",
        ]));
        const before = fs.readFileSync(source, "utf8");
        const result = invoke(fixture, ["--write", fixture, "--format", "json"]);
        assertSuccess(result, "Protected spans should remain valid and unchanged.");
        assertOutputContains(result, '"changedFiles": []', "Protected spans should not produce writes.");
        const after = fs.readFileSync(source, "utf8");
        if (after !== before) throw new Error("Protected Markdown changed.");
        console.log(`PROOF: protected-sha256=${sha256(after)}`);
      });
    },
  },
  {
    name: "reaches a fixed point through check and write modes",
    run: () => {
      withFixture("instruction-context-fixed-point", (fixture) => {
        installSeed(fixture);
        const source = path.join(fixture, "global", "AGENTS.md");
        writeText(source, lines(["# Instructions", "", "Act in order to verify the result.", ""]));
        const before = fs.readFileSync(source, "utf8");

        const check = invoke(fixture, ["--check", fixture, "--format", "json"]);
        assertFailure(check, "Check should report the pending reviewed fix.");
        assertOutputContains(check, '"status": "needs-fixes"', "Check should distinguish fixable content from deterministic failure.");
        assertOutputContains(check, '"ruleId": "replace-in-order-to"', "Check should report the applied rule identity.");
        if (fs.readFileSync(source, "utf8") !== before) throw new Error("Check mode changed source bytes.");

        const write = invoke(fixture, ["--write", fixture, "--format", "json"]);
        assertSuccess(write, "Write should apply the staged fixed-point candidate.");
        assertOutputContains(write, '"changedFiles": [', "Write should report a changed file.");
        assertOutputContains(write, '"beforeChars":', "Write should report the preimage measurement.");
        assertOutputContains(write, '"afterChars":', "Write should report the candidate measurement.");
        const after = fs.readFileSync(source, "utf8");
        if (!after.includes("Act to verify the result.")) throw new Error("Reviewed phrase was not canonicalized.");

        const secondCheck = invoke(fixture, ["--check", fixture, "--format", "json"]);
        assertSuccess(secondCheck, "The immediate second check should be byte-stable.");
        assertOutputContains(secondCheck, '"status": "passed"', "Second check should pass.");
        assertOutputContains(secondCheck, '"safeFixes": []', "Second check should report no remaining fixes.");
        if (fs.readFileSync(source, "utf8") !== after) throw new Error("Second check changed canonical bytes.");
        console.log(`PROOF: fixed-point-before-sha256=${sha256(before)} after-sha256=${sha256(after)}`);
      });
    },
  },
  {
    name: "enumerates the explicit model-facing category set",
    run: () => {
      withFixture("instruction-context-categories", (fixture) => {
        installSeed(fixture);
        const sources = new Map([
          ["global/AGENTS.md", "Global authority is unique."],
          ["REPO_AGENTS.md", "Repository authority is unique."],
          ["global/agents/example.md", "Agent body is unique."],
          ["global/commands/example.md", "Command body is unique."],
          ["global/skills/example/SKILL.md", "Skill body is unique."],
          ["instructions/example.md", "Instruction body is unique."],
          ["templates/example.md", "Template body is unique."],
          ["openspec/project.md", "OpenSpec instruction body is unique."],
          [".opencode/agents/project.md", "Project agent body is unique."],
          [".opencode/commands/project.md", "Project command body is unique."],
          [".opencode/skills/project/SKILL.md", "Project skill body is unique."],
        ]);
        for (const [relative, body] of sources) writeText(path.join(fixture, relative), `# ${relative}\n\n${body}\n`);
        writeText(path.join(fixture, "README.md"), "# General documentation\n\nThis is not a model-facing instruction category.\n");

        const result = invokeInstructionInventory(["--root", fixture, "--format", "json"]);
        assertSuccess(result, "Explicit maintained instruction categories should produce a clean inventory.");
        assertOutputContains(result, '"version": 3', "Catalog schema should expose the context-quality report version.");
        assertOutputContains(result, '"sourceScope": "catalog"', "Catalog scope should be explicit.");
        for (const relative of sources.keys()) assertOutputContains(result, `"path": "${relative}"`, `Inventory should include ${relative}.`);
        assertOutputExcludes(result, '"path": "README.md"', "General README documentation should be outside duplicate enforcement.");
        assertOutputExcludes(result, '"repeatedLines"', "The line-count duplicate proxy should be removed.");
      });
    },
  },
  {
    name: "rejects same-file and cross-file exact operative duplicates",
    run: () => {
      withFixture("instruction-context-duplicates", (fixture) => {
        installSeed(fixture);
        writeText(path.join(fixture, "global", "AGENTS.md"), lines([
          "# First",
          "",
          "Keep this exact operative instruction.",
          "",
          "# Second",
          "",
          "Keep this exact operative instruction.",
          "",
        ]));
        writeText(path.join(fixture, "instructions", "consumer.md"), lines([
          "# Consumer",
          "",
          "Keep this exact operative instruction.",
          "",
        ]));
        const result = invokeInstructionInventory(["--root", fixture, "--format", "json"]);
        assertFailure(result, "Unowned exact duplicates should fail inventory.");
        assertOutputContains(result, '"code": "same-file-duplicate"', "Both same-file locations should be diagnosed.");
        assertOutputContains(result, '"code": "cross-file-duplicate"', "Every cross-file occurrence should be diagnosed.");
        assertOutputContains(result, '"heading": "First"', "First heading path should be retained.");
        assertOutputContains(result, '"heading": "Second"', "Second heading path should be retained.");
        assertOutputContains(result, '"path": "instructions/consumer.md"', "Consumer location should be retained.");
        assertOutputExcludes(result, fixture, "Duplicate diagnostics should redact the fixture root.");
      });
    },
  },
  {
    name: "excludes protected and structural-only paragraphs without hiding bold instructions",
    run: () => {
      withFixture("instruction-context-structural-blocks", (fixture) => {
        installSeed(fixture);
        const first = path.join(fixture, "global", "AGENTS.md");
        const second = path.join(fixture, "instructions", "consumer.md");
        const structural = lines([
          "# Output",
          "",
          "`instructions/shared-contract.md`",
          "",
          "[Shared contract](https://example.test/shared-contract)",
          "",
          "Return:",
          "",
          "**Steps**",
          "",
          "**Guardrails**",
          "",
        ]);
        writeText(first, structural);
        writeText(second, structural);
        const clean = invokeInstructionInventory(["--root", fixture, "--format", "json"]);
        assertSuccess(clean, "Protected and structural-only paragraphs should stay outside operative duplicate ownership.");

        const operative = "**Main must retain this exact operative instruction.**\n";
        writeText(first, `${structural}\n${operative}`);
        writeText(second, `${structural}\n${operative}`);
        const failed = invokeInstructionInventory(["--root", fixture, "--format", "json"]);
        assertFailure(failed, "Bold formatting must not hide an operative duplicate.");
        assertOutputContains(failed, '"code": "cross-file-duplicate"', "The bold operative instruction should remain enforced.");
      });
    },
  },
  {
    name: "accepts one exact reviewed independent-loader exception",
    run: () => {
      withFixture("instruction-context-exception", (fixture) => {
        writeSeed(fixture, [sharedException()]);
        writeText(path.join(fixture, "global", "AGENTS.md"), "# Shared\n\nKeep one shared operative instruction.\n");
        writeText(path.join(fixture, "instructions", "consumer.md"), "# Shared\n\nKeep one shared operative instruction.\n");
        const args = ["--root", fixture, "--format", "json"];
        const first = invokeInstructionInventory(args);
        const second = invokeInstructionInventory(args);
        assertSuccess(first, "An exact reviewed independent-loader exception should pass.");
        assertSuccess(second, "Repeated exception evaluation should pass.");
        if (first.output !== second.output) throw new Error("Inventory output was not byte-stable across identical checks.");
        assertOutputContains(first, '"active": 1', "The report should identify the active exception.");
        assertOutputContains(first, '"status": "passed"', "The context-quality result should pass.");
      });
    },
  },
  {
    name: "resolves same-section exceptions by their complete occurrence sets",
    run: () => {
      withFixture("instruction-context-exception-populations", (fixture) => {
        writeSeed(fixture, [
          {
            id: "independent-loader-broader",
            owner: { heading: "Shared", path: "global/AGENTS.md" },
            consumers: [
              { heading: "Shared", path: "instructions/consumer.md" },
              { heading: "Shared", path: "instructions/third.md" },
            ],
            reason: "Three maintained sources load independently and require the broader local instruction.",
          },
          sharedException(),
        ]);
        const shared = "Keep one shared operative instruction.";
        const broader = "Keep one broader operative instruction.";
        writeText(path.join(fixture, "global", "AGENTS.md"), `# Shared\n\n${shared}\n\n${broader}\n`);
        writeText(path.join(fixture, "instructions", "consumer.md"), `# Shared\n\n${shared}\n\n${broader}\n`);
        writeText(path.join(fixture, "instructions", "third.md"), `# Shared\n\n${broader}\n`);
        const result = invokeInstructionInventory(["--root", fixture, "--format", "json"]);
        assertSuccess(result, "Occurrence-complete exceptions should disambiguate several shared blocks under the same headings.");
        assertOutputContains(result, '"active": 2', "Both exact occurrence populations should be active.");
      });
    },
  },
  {
    name: "rejects stale ambiguous orphaned and over-broad exceptions",
    run: () => {
      const cases: { code: string; name: string; prepare: (fixture: string) => void }[] = [
        {
          code: "stale-duplicate-exception",
          name: "stale",
          prepare: (fixture) => {
            writeSeed(fixture, [sharedException()]);
            writeText(path.join(fixture, "global", "AGENTS.md"), "# Shared\n\nOwner wording.\n");
            writeText(path.join(fixture, "instructions", "consumer.md"), "# Shared\n\nChanged consumer wording.\n");
          },
        },
        {
          code: "ambiguous-exception-heading",
          name: "ambiguous",
          prepare: (fixture) => {
            writeSeed(fixture, [sharedException()]);
            writeText(path.join(fixture, "global", "AGENTS.md"), "# Shared\n\nKeep one shared operative instruction.\n\n# Shared\n\nAnother owner instruction.\n");
            writeText(path.join(fixture, "instructions", "consumer.md"), "# Shared\n\nKeep one shared operative instruction.\n");
          },
        },
        {
          code: "orphaned-duplicate-exception",
          name: "orphaned",
          prepare: (fixture) => {
            writeSeed(fixture, [sharedException()]);
            writeText(path.join(fixture, "global", "AGENTS.md"), "# Shared\n\nKeep one shared operative instruction.\n");
          },
        },
        {
          code: "broad-duplicate-exception",
          name: "broad",
          prepare: (fixture) => {
            writeSeed(fixture, [sharedException()]);
            writeText(path.join(fixture, "global", "AGENTS.md"), "# Shared\n\nKeep one shared operative instruction.\n");
            writeText(path.join(fixture, "instructions", "consumer.md"), "# Shared\n\nKeep one shared operative instruction.\n");
            writeText(path.join(fixture, "instructions", "third.md"), "# Third\n\nKeep one shared operative instruction.\n");
          },
        },
      ];
      for (const testCase of cases) {
        withFixture(`instruction-context-${testCase.name}`, (fixture) => {
          testCase.prepare(fixture);
          const result = invokeInstructionInventory(["--root", fixture, "--format", "json"]);
          assertFailure(result, `${testCase.name} exception should fail closed.`);
          assertOutputContains(result, `"code": "${testCase.code}"`, `${testCase.name} exception should preserve its cause.`);
        });
      }
    },
  },
  {
    name: "fails cyclic overlapping and non-idempotent rules without writes",
    run: () => {
      const cases: { code: string; name: string; rules: unknown[]; text: string }[] = [
        {
          code: "Canonicalization rule cycle",
          name: "cycle",
          rules: [
            { id: "first-to-second", source: "first form", canonical: "second form", scope: "prose", rationale: "Cycle fixture first edge." },
            { id: "second-to-first", source: "second form", canonical: "first form", scope: "prose", rationale: "Cycle fixture second edge." },
          ],
          text: "Use first form now.",
        },
        {
          code: '"code": "overlapping-fixes"',
          name: "overlap",
          rules: [
            { id: "replace-in-order", source: "in order", canonical: "to", scope: "prose", rationale: "Overlap fixture first range." },
            { id: "replace-order-to", source: "order to", canonical: "to", scope: "prose", rationale: "Overlap fixture second range." },
          ],
          text: "Act in order to verify.",
        },
        {
          code: '"code": "non-idempotent-output"',
          name: "non-idempotent",
          rules: [
            { id: "first-to-second", source: "first form", canonical: "second form", scope: "prose", rationale: "Non-idempotence fixture first pass." },
            { id: "second-to-final", source: "second form", canonical: "final form", scope: "prose", rationale: "Non-idempotence fixture second pass." },
          ],
          text: "Use first form now.",
        },
      ];
      for (const testCase of cases) {
        withFixture(`instruction-context-${testCase.name}`, (fixture) => {
          writeSeed(fixture, [], testCase.rules);
          const source = path.join(fixture, "global", "AGENTS.md");
          writeText(source, `# Rule fixture\n\n${testCase.text}\n`);
          const before = fs.readFileSync(source, "utf8");
          const result = invokeDirect(fixture, ["--write", fixture, "--format", "json"]);
          assertFailure(result, `${testCase.name} rules should fail closed.`);
          assertOutputContains(result, testCase.code, `${testCase.name} failure should retain its cause.`);
          if (fs.readFileSync(source, "utf8") !== before) throw new Error(`${testCase.name} failure changed source bytes.`);
        });
      }
    },
  },
  {
    name: "protects every normative and literal span class",
    run: () => {
      withFixture("instruction-context-all-protected", (fixture) => {
        const rules = [
          { id: "protect-command", source: "--help", canonical: "--write", scope: "prose", rationale: "Protected command fixture." },
          { id: "protect-condition", source: "if", canonical: "when", scope: "prose", rationale: "Protected condition fixture." },
          { id: "protect-exception", source: "except", canonical: "including", scope: "prose", rationale: "Protected exception fixture." },
          { id: "protect-frontmatter", source: "in order to", canonical: "to", scope: "prose", rationale: "Protected frontmatter fixture." },
          { id: "protect-identifier", source: "camelCase", canonical: "snake_case", scope: "prose", rationale: "Protected identifier fixture." },
          { id: "protect-modal", source: "MUST", canonical: "MAY", scope: "prose", rationale: "Protected modal fixture." },
          { id: "protect-negation", source: "never", canonical: "always", scope: "prose", rationale: "Protected negation fixture." },
          { id: "protect-number", source: "123", canonical: "456", scope: "prose", rationale: "Protected number fixture." },
          { id: "protect-path", source: "config/file.md", canonical: "config/other.md", scope: "prose", rationale: "Protected path fixture." },
          { id: "protect-quote", source: "quoted phrase", canonical: "short phrase", scope: "prose", rationale: "Protected quote fixture." },
          { id: "protect-url", source: "https://example.test/path", canonical: "https://example.test/other", scope: "prose", rationale: "Protected URL fixture." },
        ];
        writeSeed(fixture, [], rules);
        const source = path.join(fixture, "global", "AGENTS.md");
        writeText(source, lines([
          "---",
          "description: Use in order to verify protected frontmatter.",
          "---",
          "",
          "# Protected values",
          "",
          "Use --help at config/file.md with camelCase and 123 if operators MUST never alter it except during review.",
          "",
          'Keep the "quoted phrase" exact and retain https://example.test/path.',
          "",
          "Keep `in order to` exact.",
          "",
          "```text",
          "in order to",
          "```",
          "",
        ]));
        const before = fs.readFileSync(source, "utf8");
        const first = invokeDirect(fixture, ["--write", fixture, "--format", "json"]);
        const second = invokeDirect(fixture, ["--write", fixture, "--format", "json"]);
        assertSuccess(first, "Protected values should remain review-only rather than block clean source.");
        assertSuccess(second, "Repeated protected evaluation should remain stable.");
        if (first.output !== second.output) throw new Error("Protected review-only output was not byte-stable.");
        assertOutputContains(first, '"code": "protected-approved-form"', "Protected rule intersections should be review-only.");
        assertOutputContains(first, '"safeFixes": []', "Protected values should produce no safe fix.");
        if (fs.readFileSync(source, "utf8") !== before) throw new Error("Protected literal or normative value changed.");
      });
    },
  },
  {
    name: "preserves parse failure cause and preimage",
    run: () => {
      withFixture("instruction-context-parse-failure", (fixture) => {
        installSeed(fixture);
        const source = path.join(fixture, "global", "AGENTS.md");
        writeText(source, "---\ndescription: Unterminated frontmatter\n\nAct in order to verify.\n");
        const before = fs.readFileSync(source, "utf8");
        const result = invokeDirect(fixture, ["--write", fixture]);
        assertFailure(result, "Unterminated frontmatter should fail before write.");
        assertOutputContains(result, "Markdown frontmatter is not terminated", "Parse failure should retain its cause.");
        if (fs.readFileSync(source, "utf8") !== before) throw new Error("Parse failure changed source bytes.");
      });
    },
  },
  {
    name: "does not infer semantic equivalence from similar prose",
    run: () => {
      withFixture("instruction-context-semantic-unknown", (fixture) => {
        installSeed(fixture);
        const firstPath = path.join(fixture, "global", "AGENTS.md");
        const secondPath = path.join(fixture, "instructions", "consumer.md");
        writeText(firstPath, "# First\n\nMain must stop only the affected action when authorization is absent.\n");
        writeText(secondPath, "# Second\n\nThe active operation pauses if its required authority is unavailable.\n");
        const firstBefore = fs.readFileSync(firstPath, "utf8");
        const secondBefore = fs.readFileSync(secondPath, "utf8");
        const result = invokeInstructionInventory(["--root", fixture, "--format", "json"]);
        assertSuccess(result, "Similar but behaviorally distinct prose should not be classified as an exact duplicate.");
        assertOutputExcludes(result, '"code": "cross-file-duplicate"', "Lexical similarity should not become semantic inference.");
        assertOutputContains(result, '"reviewOnly": []', "No heuristic semantic score or ranking should be emitted.");
        if (fs.readFileSync(firstPath, "utf8") !== firstBefore || fs.readFileSync(secondPath, "utf8") !== secondBefore) {
          throw new Error("Semantic-near fixture changed source bytes.");
        }
      });
    },
  },
  {
    name: "integrates read-only checks into strict library validation",
    run: () => {
      const fixture = newLibraryFixture("instruction-context-validator");
      try {
        writeSeed(fixture, [
          {
            id: "fixture-independent-project-template",
            owner: { heading: "Reusable Project Agent Instructions > Git And Remote State", path: "instructions/reusable-project-agent-instructions.md" },
            consumers: [{ heading: "Project Agent Instructions > Universal Development Loop", path: "templates/project/AGENTS.md" }],
            reason: "The reusable instruction source and generated project template load independently in this fixture.",
          },
        ]);
        const reviewer = path.join(fixture, "global", "agents", "demo-reviewer.md");
        const reviewerText = fs.readFileSync(reviewer, "utf8")
          .replace("- `Candidate Reference / RC`: exact candidate inspected.", "- `Candidate Reference / RC`: exact demo fixture candidate inspected.")
          .replace("- `Effective Model`: effective model id or `unknown`.", "- `Effective Model`: effective demo fixture model id or `unknown`.");
        writeText(reviewer, reviewerText);
        const source = path.join(fixture, "global", "skills", "demo-skill", "SKILL.md");
        const original = fs.readFileSync(source, "utf8");
        writeText(source, `${original}\nA unique growth instruction remains valid without a numeric quality verdict.\n`);
        const grown = fs.readFileSync(source, "utf8");
        const clean = invokeProcessCapture("node", [validator, "--root", fixture, "--fail-on-warnings"], libraryRoot);
        assertSuccess(clean, "Strict validation should accept unique context growth when quality checks pass.");
        if (fs.readFileSync(source, "utf8") !== grown) throw new Error("Strict clean validation mutated source.");

        const duplicate = "A duplicated validator instruction must fail at both exact locations.";
        const first = path.join(fixture, "global", "AGENTS.md");
        const second = path.join(fixture, "instructions", "example.md");
        writeText(first, `# Global fixture\n\n${duplicate}\n`);
        writeText(second, `# Instruction fixture\n\n${duplicate}\n`);
        const firstBefore = fs.readFileSync(first, "utf8");
        const secondBefore = fs.readFileSync(second, "utf8");
        const failed = invokeProcessCapture("node", [validator, "--root", fixture, "--fail-on-warnings"], libraryRoot);
        assertFailure(failed, "Strict validation should reject an exact duplicate.");
        assertOutputContains(failed, "Instruction context quality failed: cross-file-duplicate", "Strict diagnostics should retain the evaluator cause.");
        if (fs.readFileSync(first, "utf8") !== firstBefore || fs.readFileSync(second, "utf8") !== secondBefore) {
          throw new Error("Strict failed validation mutated source.");
        }

        writeText(path.join(fixture, "config", "instruction-context-quality.json"), '{"schemaVersion":1,"rules":"invalid","duplicateExceptions":[]}\n');
        const malformed = invokeProcessCapture("node", [validator, "--root", fixture, "--fail-on-warnings"], libraryRoot);
        assertFailure(malformed, "Strict validation should fail a malformed context-quality seed.");
        assertOutputContains(malformed, "Context-quality seed.rules must be an array", "Strict malformed-seed diagnostics should preserve the cause.");
        if (fs.readFileSync(first, "utf8") !== firstBefore || fs.readFileSync(second, "utf8") !== secondBefore) {
          throw new Error("Strict malformed-seed validation mutated source.");
        }
      } finally {
        fs.rmSync(fixture, { force: true, recursive: true });
      }
      if (fs.existsSync(fixture)) throw new Error("Strict-validation fixture cleanup failed.");
    },
  },
];

let failed = 0;
for (const test of tests) {
  try {
    test.run();
    console.log(`PASS: instruction context quality ${test.name}`);
  } catch (error) {
    failed++;
    console.error(`FAIL: instruction context quality ${test.name}`);
    console.error(error instanceof Error ? error.stack ?? error.message : error);
  }
}

if (failed > 0) throw new Error(`${failed} instruction context quality test(s) failed.`);
console.log(`OK: instruction context quality tests=${tests.length}`);
