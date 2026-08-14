#!/usr/bin/env node
import path from "node:path";
import {
  assertFailure,
  assertOutputContains,
  assertOutputExcludes,
  assertSuccess,
  invokeProcessCapture,
  libraryRoot,
  lines,
  newTempDir,
  writeText,
} from "./test-helpers/library.ts";

type TestCase = {
  name: string;
  run: () => void;
};

const codeQualityInventory = path.join(libraryRoot, "tools", "code-quality-inventory.ts");

const tests: TestCase[] = [
  {
    name: "reports attention-band code files",
    run: () => {
      const fixture = newTempDir("quality-inventory");
      writeText(path.join(fixture, "src", "small.ts"), lines(["export const ok = 1;", ""]));
      writeText(path.join(fixture, "src", "large.ts"), lines([
        "export function large() {",
        "  return [",
        "    1,",
        "    2,",
        "  ];",
        "}",
        "",
      ]));
      writeText(path.join(fixture, "node_modules", "ignored.ts"), lines([
        "export const ignored = [",
        "  1,",
        "  2,",
        "  3,",
        "];",
        "",
      ]));

      const result = invokeProcessCapture("node", [codeQualityInventory, "--root", fixture, "--attention-lines", "5", "--split-lines", "10", "--format", "json"], libraryRoot);
      assertSuccess(result, "Attention-band inventory should be informational.");
      assertOutputContains(result, '"status": "attention"', "Inventory should mark attention-band files.");
      assertOutputContains(result, '"path": "src/large.ts"', "Inventory should report source files in the attention band.");
      assertOutputContains(result, '"band": "attention"', "Inventory should name the attention band explicitly.");
      assertOutputExcludes(result, "ignored.ts", "Inventory should skip files inside ignored dependency directories.");
    },
  },
  {
    name: "can fail on split-candidate code files",
    run: () => {
      const fixture = newTempDir("quality-inventory-fail");
      writeText(path.join(fixture, "src", "large.ts"), lines([
        "export function large() {",
        "  return 1;",
        "}",
        "",
      ]));

      const result = invokeProcessCapture("node", [codeQualityInventory, "--root", fixture, "--attention-lines", "2", "--split-lines", "2", "--fail-on-split-candidates"], libraryRoot);
      assertFailure(result, "Fail flag should reject split-candidate code files.");
      assertOutputContains(result, "src/large.ts", "Failing inventory should name the split-candidate file.");
    },
  },
  {
    name: "redacts absolute root path by default",
    run: () => {
      const fixture = newTempDir("quality-inventory-redaction");
      writeText(path.join(fixture, "src", "small.ts"), lines(["export const ok = 1;", ""]));

      const result = invokeProcessCapture("node", [codeQualityInventory, "--root", fixture, "--format", "json"], libraryRoot);
      assertSuccess(result, "Inventory should succeed with default privacy-safe output.");
      assertOutputContains(result, '"root": "<redacted>"', "Inventory should redact absolute root by default.");
      assertOutputExcludes(result, fixture, "Inventory should not print the absolute root path by default.");
    },
  },
  {
    name: "redacts invalid root diagnostics by default",
    run: () => {
      const missingRoot = path.join(newTempDir("quality-inventory-missing-parent"), "missing-root");

      const result = invokeProcessCapture("node", [codeQualityInventory, "--root", missingRoot, "--format", "json"], libraryRoot);
      assertFailure(result, "Inventory should fail for a missing root.");
      assertOutputContains(result, "Root is not a directory: <redacted>", "Inventory should redact missing root diagnostics by default.");
      assertOutputExcludes(result, missingRoot, "Inventory should not print the missing absolute root by default.");
    },
  },
];

let failed = 0;
for (const test of tests) {
  try {
    test.run();
    console.log(`PASS: code-quality inventory ${test.name}`);
  } catch (error) {
    failed++;
    console.error(`FAIL: code-quality inventory ${test.name}`);
    console.error(error instanceof Error ? error.message : error);
  }
}

if (failed > 0) {
  throw new Error(`${failed} code-quality inventory test(s) failed.`);
}

console.log(`OK: code-quality inventory tests=${tests.length}`);
