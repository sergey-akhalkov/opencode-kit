#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const workflowPath = path.join(root, ".github", "workflows", "validate.yml");

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

const tests = [
  {
    name: "Windows job exists with cmd shell and non-mutating envelope",
    run: () => {
      const text = fs.readFileSync(workflowPath, "utf8");
      assert(text.includes("windows-latest"), "Workflow must include windows-latest.");
      assert(text.includes("validate-windows"), "Workflow must define a dedicated Windows job.");
      const windowsIndex = text.indexOf("validate-windows:");
      assert(windowsIndex >= 0, "Windows job header must be present.");
      const windowsBlock = text.slice(windowsIndex);
      assert(/shell:\s*cmd/.test(windowsBlock), "Windows job must use cmd to avoid PowerShell .ps1 shim policy.");
      assert(windowsBlock.includes("npm run validate:strict"), "Windows job must run strict validation.");
      assert(windowsBlock.includes("npm test"), "Windows job must run tests.");
      assert(windowsBlock.includes("npm run openspec:validate"), "Windows job must run OpenSpec validation.");
      assert(windowsBlock.includes("tools/test-portable-process.ts"), "Windows job must run invocation fixtures.");
      assert(windowsBlock.includes("install-code-intelligence-mcps.ts --dry-run"), "Windows job must run MCP dry-run.");
      assert(windowsBlock.includes("install-opencode-global.ts --dry-run"), "Windows job must run bootstrap dry-run.");
      const forbidden = [
        /\bsetx\b/i,
        /install:mcps(?![\s\S]{0,80}--(help|dry-run|check))/i,
        /install:global(?![\s\S]{0,80}--(help|dry-run|check|print))/i,
        /Start-Process/i,
        /\bschtasks\b/i,
        /\belevat/i,
        /\bmsiexec\b/i,
        /provider/i,
      ];
      for (const pattern of forbidden) {
        assert(!pattern.test(windowsBlock), `Windows job must not invoke blocked effect class matching ${pattern}.`);
      }
    },
  },
  {
    name: "Ubuntu job remains present and is not rewritten by the Windows job",
    run: () => {
      const text = fs.readFileSync(workflowPath, "utf8");
      assert(text.includes("ubuntu-latest"), "Ubuntu job must remain.");
      assert(text.includes("code-quality:inventory"), "Existing Ubuntu inventory step must remain.");
    },
  },
];

let failed = 0;
for (const test of tests) {
  try {
    test.run();
    console.log(`PASS ${test.name}`);
  } catch (error) {
    failed += 1;
    console.error(`FAIL ${test.name}`);
    console.error(error instanceof Error ? error.message : String(error));
  }
}

if (failed > 0) {
  process.exit(1);
}

console.log(`OK: windows ci envelope tests=${tests.length}`);
