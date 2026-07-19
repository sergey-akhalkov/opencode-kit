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
  ALLOWED_TROUBLESHOOTER_BASH_RULES,
  ALLOWED_TROUBLESHOOTER_EDIT_RULES,
  TROUBLESHOOTER_ALLOWED_PERMISSION_KEYS,
  TROUBLESHOOTER_DENIED_PERMISSION_KEYS,
  TROUBLESHOOTER_FILE,
  TROUBLESHOOTER_REQUIRED_TEXT,
} from "./contracts/troubleshooter.ts";
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
import { changeReadyContractTests } from "./test-contracts-change-ready.ts";
import { identityRecipeContractTests } from "./test-contracts-change-ready-identity.ts";
import { changeReadyDeliveryContractTests } from "./test-contracts-change-ready-delivery.ts";

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
  "`instructions/leaf-reviewer-agent-contract.md`",
];

const EXPECTED_REGISTERED_REVIEWER_REQUIRED_TEXT = [
  ...EXPECTED_REVIEWER_CONTRACT_REFERENCE_TEXT,
  "Blocking Evidence",
  "Follow-up Candidates",
];

const EXPECTED_TEST_COVERAGE_REVIEWER_REQUIRED_TEXT = [
  "## Review Inputs And Baseline Scenario",
  "user task, acceptance criteria, logs, and reproduction",
  "actual runtime envelope",
  "fresh-session behavior",
  "Task/Repro Coverage Matrix",
  "After Applicable Proof",
  "do not demand systematic tests before the production happy path and Applicable Proof",
  "do not invent acceptance scope",
];

const EXPECTED_REUSABLE_REVIEWER_LEAF_CONTRACT_TEXT = [
  "## Contract Reference",
  "`instructions/leaf-reviewer-agent-contract.md`",
  "`Findings`: ordered by severity",
  "`Residual Risks`",
];

const EXPECTED_REVIEWER_DENIED_PERMISSION_KEYS = [
  "task",
  "question",
  "dream_team_*",
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
  "dream_team_*",
  "webfetch",
  "websearch",
  "todowrite",
  "external_directory",
  "lsp",
  "doom_loop",
];

const EXPECTED_IMPLEMENTATION_WORKER_REQUIRED_TEXT = [
  "## Worker Contract",
  "one bounded production work slice",
  "Universal Task Briefing Contract",
  "Write scope",
  "Do not edit outside the exact production write scope",
  "Do not ask the user questions",
  "No commits",
  "smallest complete happy path",
  "Never create or modify automated tests",
  "proof procedure",
  "Blockers",
  "Residual Risks",
  "## Feedback Ledger",
  "docs/feedbacks",
  "`complain`",
  "IMPLEMENTATION_WORKER_REPORT",
];

const EXPECTED_IMPLEMENTATION_WORKER_HANDOFF_FIELDS = [
  "Universal Task Briefing Contract",
  "Acceptance Criteria",
  "Verification",
];

const EXPECTED_IMPLEMENTATION_WORKER_ROUTING_REQUIRED_TEXT = [
  "implementation-worker",
  "production-only",
  "non-overlapping write scope",
  "Universal Task Briefing Contract",
  "sdet-quality-engineer",
];

const EXPECTED_TROUBLESHOOTER_BASH_RULES = [
  ["permission.bash.*", "ask"],
  ["permission.bash.git add*", "deny"],
  ["permission.bash.git commit*", "deny"],
  ["permission.bash.git merge*", "deny"],
  ["permission.bash.git rebase*", "deny"],
  ["permission.bash.git push*", "deny"],
  ["permission.bash.git pull*", "deny"],
  ["permission.bash.git fetch*", "deny"],
  ["permission.bash.git reset*", "deny"],
  ["permission.bash.git restore*", "deny"],
  ["permission.bash.git checkout*", "deny"],
  ["permission.bash.git switch*", "deny"],
  ["permission.bash.git clean*", "deny"],
  ["permission.bash.npm install*", "deny"],
  ["permission.bash.npm add*", "deny"],
  ["permission.bash.npm publish*", "deny"],
  ["permission.bash.pnpm install*", "deny"],
  ["permission.bash.pnpm add*", "deny"],
  ["permission.bash.pnpm publish*", "deny"],
  ["permission.bash.yarn install*", "deny"],
  ["permission.bash.yarn add*", "deny"],
  ["permission.bash.yarn publish*", "deny"],
  ["permission.bash.rm *", "deny"],
  ["permission.bash.Remove-Item *", "deny"],
  ["permission.bash.del *", "deny"],
  ["permission.bash.rmdir *", "deny"],
];

const EXPECTED_TROUBLESHOOTER_EDIT_RULES = [
  ["permission.edit.*", "ask"],
  ["permission.edit.*.test.*", "deny"],
  ["permission.edit.*.spec.*", "deny"],
  ["permission.edit.__tests__/**", "deny"],
  ["permission.edit.__snapshots__/**", "deny"],
  ["permission.edit.testdata/**", "deny"],
  ["permission.edit.__fixtures__/**", "deny"],
  ["permission.edit.golden/**", "deny"],
  ["permission.edit.*.golden", "deny"],
  ["permission.edit.*.snap", "deny"],
  ["permission.edit.*_test.*", "deny"],
  ["permission.edit.test_*.*", "deny"],
  ["permission.edit.test-*.*", "deny"],
  ["permission.edit.**/*.test.*", "deny"],
  ["permission.edit.**/*.spec.*", "deny"],
  ["permission.edit.**/__tests__/**", "deny"],
  ["permission.edit.**/__snapshots__/**", "deny"],
  ["permission.edit.**/testdata/**", "deny"],
  ["permission.edit.**/__fixtures__/**", "deny"],
  ["permission.edit.**/golden/**", "deny"],
  ["permission.edit.**/*.golden", "deny"],
  ["permission.edit.**/*.snap", "deny"],
  ["permission.edit.**/*_test.*", "deny"],
  ["permission.edit.**/test_*.*", "deny"],
  ["permission.edit.**/test/**", "deny"],
  ["permission.edit.**/tests/**", "deny"],
  ["permission.edit.**/e2e/**", "deny"],
  ["permission.edit.**/fixtures/**", "deny"],
  ["permission.edit.**/snapshots/**", "deny"],
  ["permission.edit.**/test-library/**", "deny"],
  ["permission.edit.**/test-helpers/**", "deny"],
  ["permission.edit.**/test-*.*", "deny"],
  ["permission.edit.test/**", "deny"],
  ["permission.edit.tests/**", "deny"],
  ["permission.edit.e2e/**", "deny"],
  ["permission.edit.fixtures/**", "deny"],
  ["permission.edit.snapshots/**", "deny"],
  ["permission.edit.docs/feedbacks/**", "allow"],
];

const EXPECTED_TROUBLESHOOTER_ALLOWED_PERMISSION_KEYS = [
  ["permission.webfetch", "allow"],
  ["permission.websearch", "allow"],
  ["permission.lsp", "allow"],
];

const EXPECTED_TROUBLESHOOTER_DENIED_PERMISSION_KEYS = [
  "task",
  "question",
  "dream_team_*",
  "todowrite",
  "external_directory",
  "doom_loop",
];

const EXPECTED_TROUBLESHOOTER_REQUIRED_TEXT = [
  "## Runtime Preconditions",
  "prior failed attempts",
  "Allowed write scope",
  "Forbidden paths",
  "Validation gate",
  "read-only triage",
  "not a general developer",
  "Do not write or modify tests",
  "Use web research only",
  "smallest targeted fix",
  "TROUBLESHOOTER_REPORT",
  "Continuation Items",
];

const EXPECTED_CANONICAL_WORKFLOW_STEPS = [
  "Intake",
  "Evidence",
  "Baseline Proof",
  "Small Slice",
  "Happy Path",
  "Happy-Path Proof",
  "Focused Validation",
  "Edge Inspection",
  "Harden",
  "Review Gate",
  "Handoff",
  "Process Improvement",
];

type TestCase = { name: string; run: () => void };

const tests: TestCase[] = [
  {
    name: "contracts: canonical workflow orders observable proof before independent risk-driven testing",
    run: () => {
      const workflow = fs.readFileSync(path.join(root, "instructions", "universal-development-loop.md"), "utf8");
      const actualSteps = [...workflow.matchAll(/^\d+\. `([^`]+)`:/gm)].map((match) => match[1]);
      assertDeepEqual(actualSteps, EXPECTED_CANONICAL_WORKFLOW_STEPS, "Canonical workflow step names or ordering drifted.");
      for (const evidence of [
        "smallest complete production path",
        "observable execution",
        "separate fresh-context testing subagent",
        "independent matrix of realistic",
        "Prioritize end-to-end tests",
        "Out-of-scope P0/P1, unknowns, and missing capabilities bind `Change-Ready: no` via `Blocking Evidence` but never authorize scope expansion",
        "This optional gate does not replace independent Final Candidate Review on the qualification path",
        "original requirements, happy-path proof, testing subagent/session, risk matrix",
      ]) {
        assert(workflow.includes(evidence), `Canonical workflow is missing required risk-driven evidence: ${evidence}`);
      }
    },
  },
  {
    name: "contracts: portable bootstrap, discovery, and manual rollback surfaces remain honest",
    run: () => {
      const projectTemplate = fs.readFileSync(path.join(root, "templates", "project", "AGENTS.md"), "utf8");
      for (const token of [
        "active global OpenCode config",
        "Missing active global `AGENTS.md` blocks Material/qualification work that requires it",
        "Missing `change-ready-sdlc` blocks only when Material/explicit qualification requires the skill",
        "fresh discovered conforming SDET session",
        "`sdet-quality-engineer` is the optional default SDET adapter only",
        "unresolved validation procedures must be discovered before qualification",
        "Applicable unresolved or skipped validation keeps `Change-Ready: no`",
      ]) {
        assert(projectTemplate.includes(token), `Project template missing self-contained bootstrap oracle: ${token}`);
      }
      assert(!projectTemplate.includes("Follow `instructions/universal-development-loop.md`"), "Project template must not require a target-relative UDL file.");
      assert(!projectTemplate.includes("fresh `sdet-quality-engineer`"), "Project template must discover a conforming SDET rather than require the kit-named adapter.");

      const delivery = fs.readFileSync(path.join(root, "global", "agents", "session-delivery-reviewer.md"), "utf8");
      const description = delivery.split(/\r?\n/).find((line) => line.startsWith("description:")) ?? "";
      assert(description.includes("Use always for Portable Material sessions"), "Delivery reviewer description must make Material discovery unconditional.");
      assert(description.includes("Portable Small sessions when project policy, risk, owner, or an explicit delivery-review request requires it"), "Delivery reviewer description must keep Small discovery conditional.");

      const globalAgents = fs.readFileSync(path.join(root, "global", "AGENTS.md"), "utf8");
      for (const token of [
        "If optional tooling or evidence helpers required by a skill are unavailable",
        "Absence of a mandatory Change-Ready capability or gate on the qualification path follows the canonical `change-ready-sdlc` skill and blocks qualification",
        "do not weaken mandatory gates with a generic unavailable-tool fallback",
      ]) {
        assert(globalAgents.includes(token), `Unavailable-tool carve-out missing mandatory-capability oracle: ${token}`);
      }

      const porting = fs.readFileSync(path.join(root, "instructions", "porting-checklist.md"), "utf8");
      assert(porting.includes("exactly one standalone `## Contract Reference` section whose sole path line is `` `instructions/leaf-reviewer-agent-contract.md` ``"), "Porting checklist must require the exact standalone Contract Reference.");
      assert(porting.includes("plus role-specific body content"), "Porting checklist must preserve the reviewer role body.");
      assert(porting.includes("MUST NOT inline shared `## Leaf Contract`, `## Feedback Ledger`, or `## Prevention Feedback`"), "Porting checklist must forbid copied shared sections.");
      assert(!/^## (?:Feedback Ledger|Prevention Feedback)$/m.test(porting), "Porting checklist must not inline shared Feedback/Prevention sections itself.");

      const readme = fs.readFileSync(path.join(root, "README.md"), "utf8");
      for (const token of [
        "record the exact prior `OPENCODE_CONFIG_DIR` state",
        "record the exact prior value",
        "installer does **not** persist prior state automatically",
        "Restore the exact prior `OPENCODE_CONFIG_DIR` value",
        "If the prior state was unset",
        "Restart or reload OpenCode",
        "Restore any backups created for pre-existing files",
        "Remove only files proven created by that bootstrap run",
        "Doctor is a structural diagnostic, not full lifecycle readiness certification",
        "Report version 2 separates structural severity",
        "`qualificationStatus: pass|blocked` and per-check `blocksQualification`",
        "Only `qualificationStatus: blocked` / checks with `blocksQualification: true` block Change-Ready qualification",
        "Advisory warnings alone",
        "Missing project bootstrap/AGENTS, neither validation adapter source complete",
      ]) {
        assert(readme.includes(token), `README missing manual activation/bootstrap rollback honesty: ${token}`);
      }
    },
  },
  {
    name: "contracts: production and SDET roles remain mutually exclusive",
    run: () => {
      const worker = fs.readFileSync(path.join(root, "global", "agents", "implementation-worker.md"), "utf8");
      const sdet = fs.readFileSync(path.join(root, "global", "agents", "sdet-quality-engineer.md"), "utf8");
      for (const evidence of [
        "Production-only",
        "Never create or modify automated tests",
        "smallest complete happy path",
        "proof procedure",
      ]) {
        assert(worker.includes(evidence), `Implementation worker is missing production-only evidence: ${evidence}`);
      }
      for (const evidence of [
        "fresh context",
        "test-only write scope",
        "risk/oracle matrix",
        "Prefer real boundaries",
        "Never fix production",
      ]) {
        assert(sdet.includes(evidence), `SDET quality engineer is missing test-only evidence: ${evidence}`);
      }
    },
  },
  {
    name: "contracts: implementation worker keeps owner-approved local model adapter",
    run: () => {
      const worker = fs.readFileSync(path.join(root, "global", "agents", "implementation-worker.md"), "utf8");
      assert(/^model: xai\/grok-4\.5$/m.test(worker), "Implementation worker source must retain model: xai/grok-4.5 for this local adapter.");
      assert(/^variant: high$/m.test(worker), "Implementation worker source must retain variant: high for this local adapter.");
    },
  },
  {
    name: "contracts: SDET co-located safety requires exact content blocks and unsafe attribution blocking",
    run: () => {
      const sdet = fs.readFileSync(path.join(root, "global", "agents", "sdet-quality-engineer.md"), "utf8");
      for (const evidence of [
        "For co-located tests, require exact content blocks that prevent production edits.",
        "If attribution is unsafe, return `Action: blocked`.",
      ]) {
        assert(sdet.includes(evidence), `SDET co-located safety contract missing exact evidence: ${evidence}`);
      }
    },
  },
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
    name: "contracts: test-coverage reviewer contract is byte-equal",
    run: () => {
      assertEqual(TEST_COVERAGE_REVIEWER_CONTRACT.fileName, "test-coverage-reviewer.md", "Test-coverage contract filename drifted.");
      assertDeepEqual(
        TEST_COVERAGE_REVIEWER_CONTRACT.requiredText,
        EXPECTED_TEST_COVERAGE_REVIEWER_REQUIRED_TEXT,
        "Test-coverage contract requiredText drifted.",
      );
      for (const required of [
        "After Applicable Proof",
        "do not demand systematic tests before the production happy path and Applicable Proof",
      ]) {
        assert(
          TEST_COVERAGE_REVIEWER_CONTRACT.requiredText.includes(required),
          `Test-coverage contract must preserve proof-before-SDET ordering: ${required}`,
        );
      }
    },
  },
  {
    name: "contracts: AGENT_TEXT_CONTRACTS aggregates reviewer contracts",
    run: () => {
      const expectedTotal = EXPECTED_PREVENTION_FEEDBACK_REVIEWER_FILES.length + 2;
      assertEqual(AGENT_TEXT_CONTRACTS.length, expectedTotal, "AGENT_TEXT_CONTRACTS must aggregate reviewer + binding + test-coverage contracts.");
      const registeredReviewerFiles = new Set(EXPECTED_PREVENTION_FEEDBACK_REVIEWER_FILES);
      const contractReference = AGENT_TEXT_CONTRACTS.filter(
        (c) => registeredReviewerFiles.has(c.fileName)
          && EXPECTED_REVIEWER_CONTRACT_REFERENCE_TEXT.every((required, index) => c.requiredText[index] === required),
      );
      assertEqual(contractReference.length, EXPECTED_PREVENTION_FEEDBACK_REVIEWER_FILES.length, "Reviewer contract reference contracts missing.");
      const contractFiles = contractReference.map((c) => c.fileName).sort();
      assertDeepEqual(
        contractFiles,
        [...EXPECTED_PREVENTION_FEEDBACK_REVIEWER_FILES].sort(),
        "Reviewer contract reference file list drifted.",
      );
      for (const contract of contractReference) {
        assertDeepEqual(
          contract.requiredText,
          EXPECTED_REGISTERED_REVIEWER_REQUIRED_TEXT,
          `Registered reviewer contract requiredText drifted: ${contract.fileName}`,
        );
      }
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
  ...changeReadyContractTests,
  ...identityRecipeContractTests,
  ...changeReadyDeliveryContractTests,
  {
    name: "contracts: troubleshooter file, denied keys, and required text are byte-equal",
    run: () => {
      assertEqual(TROUBLESHOOTER_FILE, "troubleshooter.md", "TROUBLESHOOTER_FILE drifted.");
      assertDeepEqual(
        [...TROUBLESHOOTER_DENIED_PERMISSION_KEYS],
        EXPECTED_TROUBLESHOOTER_DENIED_PERMISSION_KEYS,
        "TROUBLESHOOTER_DENIED_PERMISSION_KEYS drifted.",
      );
      assertDeepEqual(
        [...TROUBLESHOOTER_REQUIRED_TEXT],
        EXPECTED_TROUBLESHOOTER_REQUIRED_TEXT,
        "TROUBLESHOOTER_REQUIRED_TEXT drifted.",
      );
    },
  },
  {
    name: "contracts: troubleshooter bash rules preserve escalation safety gates",
    run: () => {
      assertDeepEqual(
        [...ALLOWED_TROUBLESHOOTER_BASH_RULES],
        EXPECTED_TROUBLESHOOTER_BASH_RULES,
        "ALLOWED_TROUBLESHOOTER_BASH_RULES drifted.",
      );
      assertEqual(ALLOWED_TROUBLESHOOTER_BASH_RULES.get("permission.bash.*"), "ask", "Troubleshooter unknown bash commands must ask.");
      assert(
        [...ALLOWED_TROUBLESHOOTER_BASH_RULES.values()].every((action) => action !== "allow"),
        "Troubleshooter must not auto-allow any Bash command.",
      );
      for (const key of [
        "permission.bash.npm install*",
        "permission.bash.npm add*",
        "permission.bash.pnpm install*",
        "permission.bash.pnpm add*",
        "permission.bash.yarn install*",
        "permission.bash.yarn add*",
        "permission.bash.rm *",
        "permission.bash.Remove-Item *",
        "permission.bash.del *",
        "permission.bash.rmdir *",
      ]) {
        assertEqual(ALLOWED_TROUBLESHOOTER_BASH_RULES.get(key), "deny", `Troubleshooter package/destructive command must deny: ${key}`);
      }
    },
  },
  {
    name: "contracts: troubleshooter edit and research rules preserve bounded troubleshooting",
    run: () => {
      assertDeepEqual(
        [...ALLOWED_TROUBLESHOOTER_EDIT_RULES],
        EXPECTED_TROUBLESHOOTER_EDIT_RULES,
        "ALLOWED_TROUBLESHOOTER_EDIT_RULES drifted.",
      );
      assertEqual(ALLOWED_TROUBLESHOOTER_EDIT_RULES.get("permission.edit.*"), "ask", "Troubleshooter unknown edits must ask.");
      for (const key of [
        "permission.edit.*.test.*",
        "permission.edit.*.spec.*",
        "permission.edit.__tests__/**",
        "permission.edit.__snapshots__/**",
        "permission.edit.testdata/**",
        "permission.edit.__fixtures__/**",
        "permission.edit.golden/**",
        "permission.edit.*.golden",
        "permission.edit.*.snap",
        "permission.edit.*_test.*",
        "permission.edit.test_*.*",
        "permission.edit.test-*.*",
        "permission.edit.**/*.test.*",
        "permission.edit.**/*.spec.*",
        "permission.edit.**/__tests__/**",
        "permission.edit.**/__snapshots__/**",
        "permission.edit.**/testdata/**",
        "permission.edit.**/__fixtures__/**",
        "permission.edit.**/golden/**",
        "permission.edit.**/*.golden",
        "permission.edit.**/*.snap",
        "permission.edit.**/*_test.*",
        "permission.edit.**/test_*.*",
        "permission.edit.**/test/**",
        "permission.edit.**/tests/**",
        "permission.edit.**/e2e/**",
        "permission.edit.fixtures/**",
        "permission.edit.snapshots/**",
        "permission.edit.**/fixtures/**",
        "permission.edit.**/snapshots/**",
        "permission.edit.**/test-library/**",
        "permission.edit.**/test-helpers/**",
        "permission.edit.**/test-*.*",
      ]) {
        assertEqual(ALLOWED_TROUBLESHOOTER_EDIT_RULES.get(key), "deny", `Troubleshooter test/fixture edit gate must deny: ${key}`);
      }
      assertEqual(ALLOWED_TROUBLESHOOTER_EDIT_RULES.get("permission.edit.docs/feedbacks/**"), "allow", "Troubleshooter feedback-ledger edit exception drifted.");
      assertEqual(
        [...ALLOWED_TROUBLESHOOTER_EDIT_RULES.keys()].at(-1),
        "permission.edit.docs/feedbacks/**",
        "Troubleshooter feedback-ledger exception must remain the final edit rule.",
      );
      assertDeepEqual(
        [...TROUBLESHOOTER_ALLOWED_PERMISSION_KEYS],
        EXPECTED_TROUBLESHOOTER_ALLOWED_PERMISSION_KEYS,
        "TROUBLESHOOTER_ALLOWED_PERMISSION_KEYS drifted.",
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
    name: "contracts: implementation-worker bash rules preserve production-author no-shell policy",
    run: () => {
      assertEqual(ALLOWED_IMPLEMENTATION_WORKER_BASH_RULES.get("permission.bash"), "deny", "Implementation worker scalar bash deny drifted.");
      assertEqual(ALLOWED_IMPLEMENTATION_WORKER_BASH_RULES.size, 1, "Implementation worker must not retain command-specific bash allowances.");
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
    name: "contracts: canonical library fixture helper remains unique",
    run: () => {
      assert(
        fs.existsSync(path.join(root, "tools", "test-helpers", "library.ts")),
        "Canonical tools/test-helpers/library.ts fixture helper must remain present.",
      );
      assert(
        !fs.existsSync(path.join(root, "tools", "test-helpers", "fixture-builder.ts")),
        "Drifted duplicate fixture-builder.ts must remain deleted.",
      );
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
      if (!result.output.includes("OK:")) {
        throw new Error(`Validator output should retain its machine-readable success summary.\nOutput:\n${result.output}`);
      }
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
