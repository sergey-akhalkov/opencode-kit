#!/usr/bin/env node
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

import {
  AGENT_TEXT_CONTRACTS,
  PREVENTION_FEEDBACK_REVIEWER_FILES,
  REVIEWER_CONTRACT_REFERENCE_CONTRACTS,
  REVIEWER_CONTRACT_REFERENCE_TEXT,
  SESSION_DELIVERY_BINDING_CONTRACT,
  SESSION_DELIVERY_BINDING_HANDOFF_TOKENS,
  SESSION_DELIVERY_BINDING_REQUIRED_TEXT,
  TEST_COVERAGE_REVIEWER_CONTRACT,
} from "./contracts/reviewer-binding.ts";
import {
  ALLOWED_COMPLAIN_SKILL_RULES,
  ALLOWED_REVIEWER_BASH_RULES,
  ALLOWED_REVIEWER_EDIT_RULES,
  REUSABLE_REVIEWER_LEAF_CONTRACT_TEXT,
  REVIEWER_DENIED_PERMISSION_KEYS,
  REVIEWER_OBSOLETE_PERMISSION_KEYS,
} from "./contracts/agents.ts";
import {
  ALLOWED_IMPLEMENTATION_WORKER_BASH_RULES,
  IMPLEMENTATION_WORKER_DENIED_PERMISSION_KEYS,
  IMPLEMENTATION_WORKER_FILE,
  IMPLEMENTATION_WORKER_HANDOFF_FIELDS,
  IMPLEMENTATION_WORKER_REQUIRED_TEXT,
  IMPLEMENTATION_WORKER_ROUTING_REQUIRED_TEXT,
} from "./contracts/implementation-worker.ts";
import {
  COMPLAIN_DIRECT_WRITE_CONTRACT_TEXT,
  COMPLAIN_SHARED_REQUIRED_TEXT,
} from "./contracts/complain.ts";
import {
  SKILL_DESCRIPTION_MAX_CHARS,
  SKILL_NAME_PATTERN,
  SKILL_OUTPUT_CONTRACT_PATTERN,
  SKILL_TRIGGER_PATTERN,
} from "./contracts/skills.ts";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function newTempDir(name: string): string {
  const parent = path.join(os.tmpdir(), "agents-and-skills-tests");
  fs.mkdirSync(parent, { recursive: true });
  const dir = path.join(parent, `${name}-${crypto.randomUUID().replace(/-/g, "")}`);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function writeText(filePath: string, content: string): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content.replace(/\r?\n/g, os.EOL), "utf8");
}

type ProcessResult = { exitCode: number; output: string };

function invokeProcessCapture(command: string, args: string[], workingDirectory: string): ProcessResult {
  const result = spawnSync(command, args, {
    cwd: workingDirectory,
    encoding: "utf8",
    shell: false,
  });
  if (result.error) throw result.error;
  return {
    exitCode: result.status ?? 0,
    output: `${result.stdout ?? ""}${result.stderr ?? ""}`,
  };
}

function assertSuccess(result: ProcessResult, message: string): void {
  if (result.exitCode !== 0) {
    throw new Error(`${message}\nExitCode: ${result.exitCode}\nOutput:\n${result.output}`);
  }
}

function assertFailure(result: ProcessResult, message: string): void {
  if (result.exitCode === 0) {
    throw new Error(`${message}\nExpected failure but command succeeded.\nOutput:\n${result.output}`);
  }
}

function assertEqual<T>(actual: T, expected: T, message: string): void {
  if (actual !== expected) {
    throw new Error(`${message}\nExpected: ${String(expected)}\nActual: ${String(actual)}`);
  }
}

function assertDeepEqual(actual: unknown, expected: unknown, message: string): void {
  const actualJson = JSON.stringify(actual, null, 2);
  const expectedJson = JSON.stringify(expected, null, 2);
  if (actualJson !== expectedJson) {
    throw new Error(`${message}\nExpected: ${expectedJson}\nActual: ${actualJson}`);
  }
}

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

const EXPECTED_PREVENTION_FEEDBACK_REVIEWER_FILES = [
  "code-quality-reviewer.md",
  "deployment-config-reviewer.md",
  "implementation-readiness-reviewer.md",
  "instruction-artifact-reviewer.md",
  "legacy-client-compatibility-reviewer.md",
  "legacy-evidence-reviewer.md",
  "openspec-architecture-reviewer.md",
  "performance-reliability-reviewer.md",
  "protocol-api-reviewer.md",
  "rust-concurrency-reviewer.md",
  "session-delivery-reviewer.md",
  "test-coverage-reviewer.md",
  "wire-protocol-reviewer.md",
];

const EXPECTED_REVIEWER_CONTRACT_REFERENCE_TEXT = [
  "## Contract Reference",
  "instructions/leaf-reviewer-agent-contract.md",
];

const EXPECTED_SESSION_DELIVERY_BINDING_REQUIRED_TEXT = [
  "Use after material or complex sessions",
  "## Minimal Evidence Bundle",
  "changed files or diffstat",
  "reviewer findings/fixes",
  "## Compaction Evidence Boundary",
  "every explicit delivery-review request",
  "Root causes must cite evidence; use `unknown`",
  "requirementSignals[]",
  "Root-session user messages, confirmed `requirementSignals[]`, and explicit `questionReplies[]` override supplied continuation summaries",
  "openspec_all_changes",
  "archive_when_complete",
  "push_after_archive",
  "blocker_escalation_gate",
  "new_change_approval_required",
  "push_all",
  "Missing evidence for a confirmed signaled requirement is a P0 blocker",
  "todos.ever[]",
  "todos.unresolved[]",
  "Changed-file scope",
  "Current-slice framing",
  "P0 blocker",
  "test-first evidence for behavior-changing work",
  "Keep matrices terse",
  "Required Next Actions",
  "Actionable Continuation Items",
];

const EXPECTED_SESSION_DELIVERY_BINDING_HANDOFF_TOKENS = [
  "Blocking for Acceptance: yes",
  "Verdict: blocked",
  "P0 blocker",
  "Required Next Actions",
  "do not present the session as complete",
  "partial slice handoff must not end an unfinished root goal",
];

const EXPECTED_TEST_COVERAGE_REVIEWER_REQUIRED_TEXT = [
  "## Review Inputs And Baseline Scenario",
  "user task, acceptance criteria, logs, and reproduction",
  "actual runtime envelope",
  "fresh-session behavior",
  "Task/Repro Coverage Matrix",
];

const EXPECTED_REUSABLE_REVIEWER_LEAF_CONTRACT_TEXT = [
  "## Contract Reference",
  "instructions/leaf-reviewer-agent-contract.md",
  "`Findings`: ordered by severity",
  "`Residual Risks`",
  "Actionable Continuation Items",
];

const EXPECTED_REVIEWER_DENIED_PERMISSION_KEYS = [
  "task",
  "question",
  "webfetch",
  "websearch",
  "todowrite",
  "external_directory",
  "lsp",
  "doom_loop",
];

const EXPECTED_REVIEWER_OBSOLETE_PERMISSION_KEYS = ["list"];

const EXPECTED_IMPLEMENTATION_WORKER_DENIED_PERMISSION_KEYS = [
  "task",
  "question",
  "webfetch",
  "websearch",
  "todowrite",
  "external_directory",
  "lsp",
  "doom_loop",
];

const EXPECTED_IMPLEMENTATION_WORKER_REQUIRED_TEXT = [
  "## Worker Contract",
  "one bounded work slice",
  "Write scope",
  "Do not edit outside write scope",
  "Do not ask the user questions",
  "No commits",
  "TDD/test-first",
  "main-session validation gate",
  "## Feedback Ledger",
  "docs/feedbacks",
  "`complain`",
  "IMPLEMENTATION_WORKER_REPORT",
  "Run:",
  "Worker:",
];

const EXPECTED_IMPLEMENTATION_WORKER_HANDOFF_FIELDS = [
  "Mission",
  "Read scope",
  "Write scope",
  "Forbidden",
  "Verification",
  "acceptance criteria",
];

const EXPECTED_IMPLEMENTATION_WORKER_ROUTING_REQUIRED_TEXT = [
  "implementation-worker",
  "non-overlapping write scope",
  "clear acceptance criteria",
  "focused validation gate",
];

type TestCase = { name: string; run: () => void };

const tests: TestCase[] = [
  {
    name: "contracts: prevention feedback reviewer file list is byte-equal",
    run: () => {
      assertDeepEqual(
        [...PREVENTION_FEEDBACK_REVIEWER_FILES],
        EXPECTED_PREVENTION_FEEDBACK_REVIEWER_FILES,
        "PREVENTION_FEEDBACK_REVIEWER_FILES drifted from the inline list it replaced.",
      );
    },
  },
  {
    name: "contracts: reviewer contract reference text is byte-equal",
    run: () => {
      assertDeepEqual(
        [...REVIEWER_CONTRACT_REFERENCE_TEXT],
        EXPECTED_REVIEWER_CONTRACT_REFERENCE_TEXT,
        "REVIEWER_CONTRACT_REFERENCE_TEXT drifted from the inline list it replaced.",
      );
    },
  },
  {
    name: "contracts: session-delivery reviewer binding required text is byte-equal",
    run: () => {
      assertDeepEqual(
        [...SESSION_DELIVERY_BINDING_REQUIRED_TEXT],
        EXPECTED_SESSION_DELIVERY_BINDING_REQUIRED_TEXT,
        "SESSION_DELIVERY_BINDING_REQUIRED_TEXT drifted from the inline list it replaced.",
      );
      assertEqual(SESSION_DELIVERY_BINDING_CONTRACT.fileName, "session-delivery-reviewer.md", "Binding contract filename drifted.");
      assertDeepEqual(
        SESSION_DELIVERY_BINDING_CONTRACT.requiredText,
        EXPECTED_SESSION_DELIVERY_BINDING_REQUIRED_TEXT,
        "Binding contract requiredText drifted.",
      );
    },
  },
  {
    name: "contracts: session-delivery binding handoff tokens are byte-equal",
    run: () => {
      assertDeepEqual(
        [...SESSION_DELIVERY_BINDING_HANDOFF_TOKENS],
        EXPECTED_SESSION_DELIVERY_BINDING_HANDOFF_TOKENS,
        "SESSION_DELIVERY_BINDING_HANDOFF_TOKENS drifted from the inline list it replaced.",
      );
    },
  },
  {
    name: "contracts: test-coverage reviewer contract is byte-equal",
    run: () => {
      assertEqual(TEST_COVERAGE_REVIEWER_CONTRACT.fileName, "test-coverage-reviewer.md", "Test-coverage contract filename drifted.");
      assertDeepEqual(
        TEST_COVERAGE_REVIEWER_CONTRACT.requiredText,
        EXPECTED_TEST_COVERAGE_REVIEWER_REQUIRED_TEXT,
        "Test-coverage contract requiredText drifted.",
      );
    },
  },
  {
    name: "contracts: AGENT_TEXT_CONTRACTS aggregates reviewer contracts",
    run: () => {
      const expectedTotal = EXPECTED_PREVENTION_FEEDBACK_REVIEWER_FILES.length + 2;
      assertEqual(AGENT_TEXT_CONTRACTS.length, expectedTotal, "AGENT_TEXT_CONTRACTS must aggregate reviewer + binding + test-coverage contracts.");
      const contractReference = AGENT_TEXT_CONTRACTS.filter(
        (c) => c.requiredText.length === EXPECTED_REVIEWER_CONTRACT_REFERENCE_TEXT.length
          && c.requiredText[0] === EXPECTED_REVIEWER_CONTRACT_REFERENCE_TEXT[0],
      );
      assertEqual(contractReference.length, EXPECTED_PREVENTION_FEEDBACK_REVIEWER_FILES.length, "Reviewer contract reference contracts missing.");
      const contractFiles = contractReference.map((c) => c.fileName).sort();
      assertDeepEqual(
        contractFiles,
        [...EXPECTED_PREVENTION_FEEDBACK_REVIEWER_FILES].sort(),
        "Reviewer contract reference file list drifted.",
      );
    },
  },
  {
    name: "contracts: reusable reviewer leaf contract text is byte-equal",
    run: () => {
      assertDeepEqual(
        [...REUSABLE_REVIEWER_LEAF_CONTRACT_TEXT],
        EXPECTED_REUSABLE_REVIEWER_LEAF_CONTRACT_TEXT,
        "REUSABLE_REVIEWER_LEAF_CONTRACT_TEXT drifted from the inline list it replaced.",
      );
    },
  },
  {
    name: "contracts: reviewer denied permission keys are byte-equal",
    run: () => {
      assertDeepEqual(
        [...REVIEWER_DENIED_PERMISSION_KEYS],
        EXPECTED_REVIEWER_DENIED_PERMISSION_KEYS,
        "REVIEWER_DENIED_PERMISSION_KEYS drifted from the inline list it replaced.",
      );
    },
  },
  {
    name: "contracts: reviewer obsolete permission keys are byte-equal",
    run: () => {
      assertDeepEqual(
        [...REVIEWER_OBSOLETE_PERMISSION_KEYS],
        EXPECTED_REVIEWER_OBSOLETE_PERMISSION_KEYS,
        "REVIEWER_OBSOLETE_PERMISSION_KEYS drifted from the inline list it replaced.",
      );
    },
  },
  {
    name: "contracts: implementation-worker file and denied keys are byte-equal",
    run: () => {
      assertEqual(IMPLEMENTATION_WORKER_FILE, "implementation-worker.md", "IMPLEMENTATION_WORKER_FILE drifted.");
      assertDeepEqual(
        [...IMPLEMENTATION_WORKER_DENIED_PERMISSION_KEYS],
        EXPECTED_IMPLEMENTATION_WORKER_DENIED_PERMISSION_KEYS,
        "IMPLEMENTATION_WORKER_DENIED_PERMISSION_KEYS drifted.",
      );
    },
  },
  {
    name: "contracts: implementation-worker required text is byte-equal",
    run: () => {
      assertDeepEqual(
        [...IMPLEMENTATION_WORKER_REQUIRED_TEXT],
        EXPECTED_IMPLEMENTATION_WORKER_REQUIRED_TEXT,
        "IMPLEMENTATION_WORKER_REQUIRED_TEXT drifted.",
      );
    },
  },
  {
    name: "contracts: implementation-worker handoff fields are byte-equal",
    run: () => {
      assertDeepEqual(
        [...IMPLEMENTATION_WORKER_HANDOFF_FIELDS],
        EXPECTED_IMPLEMENTATION_WORKER_HANDOFF_FIELDS,
        "IMPLEMENTATION_WORKER_HANDOFF_FIELDS drifted.",
      );
    },
  },
  {
    name: "contracts: implementation-worker routing required text is byte-equal",
    run: () => {
      assertDeepEqual(
        [...IMPLEMENTATION_WORKER_ROUTING_REQUIRED_TEXT],
        EXPECTED_IMPLEMENTATION_WORKER_ROUTING_REQUIRED_TEXT,
        "IMPLEMENTATION_WORKER_ROUTING_REQUIRED_TEXT drifted.",
      );
    },
  },
  {
    name: "contracts: reviewer bash rules map preserves deny policy",
    run: () => {
      assertEqual(ALLOWED_REVIEWER_BASH_RULES.get("permission.bash"), "deny", "Reviewer bash deny policy drifted.");
    },
  },
  {
    name: "contracts: reviewer edit rules map preserves feedback-ledger exception",
    run: () => {
      assertEqual(ALLOWED_REVIEWER_EDIT_RULES.get("permission.edit.*"), "deny", "Reviewer edit wildcard deny drifted.");
      assertEqual(ALLOWED_REVIEWER_EDIT_RULES.get("permission.edit.docs/feedbacks/**"), "allow", "Reviewer feedback-ledger allow drifted.");
    },
  },
  {
    name: "contracts: complain skill rules map preserves complain allow exception",
    run: () => {
      assertEqual(ALLOWED_COMPLAIN_SKILL_RULES.get("permission.skill.*"), "deny", "Skill wildcard deny drifted.");
      assertEqual(ALLOWED_COMPLAIN_SKILL_RULES.get("permission.skill.complain"), "allow", "Skill complain allow drifted.");
    },
  },
  {
    name: "contracts: implementation-worker bash rules preserves test/validate gates",
    run: () => {
      assertEqual(ALLOWED_IMPLEMENTATION_WORKER_BASH_RULES.get("permission.bash.*"), "deny", "Implementation worker bash wildcard deny drifted.");
      assertEqual(ALLOWED_IMPLEMENTATION_WORKER_BASH_RULES.get("permission.bash.git status*"), "allow", "git status allow drifted.");
      assertEqual(ALLOWED_IMPLEMENTATION_WORKER_BASH_RULES.get("permission.bash.git diff*"), "allow", "git diff allow drifted.");
      assertEqual(ALLOWED_IMPLEMENTATION_WORKER_BASH_RULES.get("permission.bash.npm test*"), "allow", "npm test allow drifted.");
      assertEqual(ALLOWED_IMPLEMENTATION_WORKER_BASH_RULES.get("permission.bash.npm run test*"), "allow", "npm run test allow drifted.");
      assertEqual(ALLOWED_IMPLEMENTATION_WORKER_BASH_RULES.get("permission.bash.npm run validate*"), "allow", "npm run validate allow drifted.");
      assertEqual(ALLOWED_IMPLEMENTATION_WORKER_BASH_RULES.get("permission.bash.node tools/test-*.ts"), "allow", "node tools/test allow drifted.");
    },
  },
  {
    name: "contracts: skill contract symbols are stable",
    run: () => {
      assert(SKILL_NAME_PATTERN.test("code-quality-audit"), "Skill name pattern should accept hyphenated lowercase.");
      assert(!SKILL_NAME_PATTERN.test("Code-Quality-Audit"), "Skill name pattern should reject uppercase.");
      assertEqual(SKILL_DESCRIPTION_MAX_CHARS, 1024, "SKILL_DESCRIPTION_MAX_CHARS drifted.");
      assert(SKILL_TRIGGER_PATTERN.test("Use this skill to validate."), "Skill trigger pattern should match.");
      assert(SKILL_OUTPUT_CONTRACT_PATTERN.test("## Output"), "Skill output contract should match leading heading.");
    },
  },
  {
    name: "contracts: complain contract text preserves shared + direct-write requirements",
    run: () => {
      assert(COMPLAIN_SHARED_REQUIRED_TEXT.includes("### Complaint"), "Complain shared text must include ### Complaint heading.");
      assert(COMPLAIN_SHARED_REQUIRED_TEXT.includes("Recurrence: unknown"), "Complain shared text must mention Recurrence: unknown.");
      assert(COMPLAIN_DIRECT_WRITE_CONTRACT_TEXT.includes("docs/feedbacks/<source>.md"), "Complain direct-write text must reference feedback file path.");
      assert(COMPLAIN_DIRECT_WRITE_CONTRACT_TEXT.includes("Do not edit source, config, instructions, specs, code, or task artifacts"), "Complain direct-write text must forbid source edits.");
    },
  },
  {
    name: "contracts: validator run on real repo still emits OK after refactor",
    run: () => {
      const result = invokeProcessCapture("node", ["tools/validate-library.ts"], root);
      assertSuccess(result, "Validator should still pass against the real repository after contract extraction.");
      if (!result.output.includes("warnings=0")) {
        throw new Error(`Validator output should report zero warnings after refactor.\nOutput:\n${result.output}`);
      }
    },
  },
  {
    name: "contracts: validator strict mode still passes on real repo after refactor",
    run: () => {
      const result = invokeProcessCapture("node", ["tools/validate-library.ts", "--fail-on-warnings"], root);
      assertSuccess(result, "Validator strict mode should still pass against the real repository after contract extraction.");
    },
  },
];

let failed = 0;
for (const test of tests) {
  try {
    test.run();
    console.log(`PASS: ${test.name}`);
  } catch (error) {
    failed++;
    const message = error instanceof Error ? error.message : String(error);
    console.log(`FAIL: ${test.name}`);
    console.log(message);
  }
}

if (failed > 0) {
  throw new Error(`${failed} contracts test(s) failed.`);
}

console.log(`OK: contracts tests=${tests.length}`);