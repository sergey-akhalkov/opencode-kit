import { ALLOWED_TROUBLESHOOTER_EDIT_RULES } from "../contracts/troubleshooter.ts";
import {
  assertEqual,
  type TestCase,
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
