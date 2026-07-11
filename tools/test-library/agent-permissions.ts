import fs from "node:fs";
import path from "node:path";
import { ALLOWED_TROUBLESHOOTER_EDIT_RULES } from "../contracts/troubleshooter.ts";
import {
  addImplementationWorkerFixture,
  assertEqual,
  assertFailure,
  assertOutputContains,
  invokeValidator,
  newLibraryFixture,
  type TestCase,
  writeText,
} from "../test-helpers/library.ts";

function matchesSimpleWildcard(pattern: string, value: string): boolean {
  let expression = "^";
  for (const character of pattern) {
    if (character === "*") {
      expression += ".*";
    } else if (character === "?") {
      expression += ".";
    } else {
      expression += /[\\^$.*+?()[\]{}|]/.test(character) ? `\\${character}` : character;
    }
  }
  return new RegExp(`${expression}$`).test(value);
}

function resolveTroubleshooterEditPermission(filePath: string): string | undefined {
  let action: string | undefined;
  for (const [key, value] of ALLOWED_TROUBLESHOOTER_EDIT_RULES) {
    const pattern = key.replace("permission.edit.", "");
    if (matchesSimpleWildcard(pattern, filePath)) {
      action = value;
    }
  }
  return action;
}

export const agentPermissionTests: TestCase[] = [
  {
    name: "validator rejects reusable reviewer missing explicit Dream Team denial",
    run: () => {
      const fixture = newLibraryFixture("reviewer-missing-dream-team-deny");
      const reviewerPath = path.join(fixture, "global", "agents", "demo-reviewer.md");
      const reviewer = fs.readFileSync(reviewerPath, "utf8");
      writeText(reviewerPath, reviewer.replace(/^  dream_team_\*: deny\r?\n/m, ""));
      const result = invokeValidator(fixture);
      assertFailure(result, "A reusable reviewer without Dream Team denial should fail validation.");
      assertOutputContains(result, "Agent permission must set dream_team_*: deny", "Reviewer recursion-deny failure should be explicit.");
      assertOutputContains(result, "demo-reviewer.md", "Reviewer recursion-deny failure should name the invalid reusable agent.");
    },
  },
  {
    name: "validator rejects implementation worker missing explicit Dream Team denial",
    run: () => {
      const fixture = newLibraryFixture("implementation-worker-missing-dream-team-deny");
      const workerPath = addImplementationWorkerFixture(fixture);
      const worker = fs.readFileSync(workerPath, "utf8");
      writeText(workerPath, worker.replace(/^  dream_team_\*: deny\r?\n/m, ""));
      const result = invokeValidator(fixture);
      assertFailure(result, "An implementation worker without Dream Team denial should fail validation.");
      assertOutputContains(result, "Implementation worker must set dream_team_*: deny", "Implementation-worker recursion-deny failure should be explicit.");
      assertOutputContains(result, "implementation-worker.md", "Implementation-worker recursion-deny failure should name the invalid agent.");
    },
  },
  {
    name: "troubleshooter edit permissions hard-deny root and nested test evidence last-match-wins",
    run: () => {
      // OpenCode exposes no reusable matcher in this repository; this test models only documented simple * and ? matching.
      assertEqual(matchesSimpleWildcard("file?.ts", "file1.ts"), true, "Test-only matcher must support ? wildcard semantics.");
      assertEqual(matchesSimpleWildcard("file?.ts", "file10.ts"), false, "Test-only matcher must not overmatch ? wildcard semantics.");
      const cases: Array<[string, string]> = [
        ["widget.test.ts", "deny"],
        ["contract.spec.ts", "deny"],
        ["test-contracts.ts", "deny"],
        ["vector.snap", "deny"],
        ["golden/vector.bin", "deny"],
        ["testdata/input.json", "deny"],
        ["__tests__/case.ts", "deny"],
        ["service.ts", "ask"],
        ["tools/test-contracts.ts", "deny"],
        ["tools/test-library/validator-1.ts", "deny"],
        ["tools/test-helpers/library.ts", "deny"],
        ["packages/api/tests/case.json", "deny"],
        ["crates/core/tests/integration.rs", "deny"],
        ["src/fixtures/sample.json", "deny"],
        ["docs/feedbacks/implementation-worker.md", "allow"],
      ];
      for (const [filePath, expectedAction] of cases) {
        assertEqual(
          resolveTroubleshooterEditPermission(filePath),
          expectedAction,
          `Troubleshooter edit permission must resolve ${filePath} to ${expectedAction}.`,
        );
      }
      assertEqual(
        [...ALLOWED_TROUBLESHOOTER_EDIT_RULES.keys()].at(-1),
        "permission.edit.docs/feedbacks/**",
        "Troubleshooter feedback allow must remain the final edit rule.",
      );
    },
  },
];
