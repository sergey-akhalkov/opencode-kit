import fs from "node:fs";
import path from "node:path";
import {
  addImplementationWorkerFixture,
  addSessionDeliveryBindingFixture,
  appendReadmeAgentCatalogEntry,
  assertFailure,
  assertOutputContains,
  assertOutputExcludes,
  assertSuccess,
  invokeValidator,
  newLibraryFixture,
  sessionDeliveryBindingTokens,
  type TestCase,
  writeText,
  lines,
  libraryRoot,
} from "../test-helpers/library.ts";
import { changeReadyValidatorTests } from "./validator-change-ready.ts";

const root = libraryRoot;

function addTroubleshooterFixture(fixture: string): string {
  const troubleshooterPath = path.join(fixture, "global", "agents", "troubleshooter.md");
  writeText(troubleshooterPath, fs.readFileSync(path.join(root, "global", "agents", "troubleshooter.md"), "utf8"));

  const profilePath = path.join(fixture, "profiles", "all.json");
  const profile = fs.readFileSync(profilePath, "utf8");
  writeText(profilePath, profile.replace('"demo-reviewer"]', '"demo-reviewer", "troubleshooter"]'));
  appendReadmeAgentCatalogEntry(fixture, "- `troubleshooter`: Escalation-only troubleshooting agent.");
  return troubleshooterPath;
}

function replaceTroubleshooterText(text: string, original: string, replacement: string): string {
  const lineEnding = text.includes("\r\n") ? "\r\n" : "\n";
  const normalizeLineEndings = (value: string) => value.replace(/\n/g, lineEnding);
  const updated = text.replaceAll(normalizeLineEndings(original), normalizeLineEndings(replacement));
  if (updated === text) {
    throw new Error(`Troubleshooter fixture did not contain expected text: ${original}`);
  }
  return updated;
}

export const validatorTests1: TestCase[] = [
  {
    name: "validator accepts valid fixture",
    run: () => {
      const fixture = newLibraryFixture("valid");
      assertSuccess(invokeValidator(fixture), "Valid fixture should pass validation.");
    },
  },
  {
    name: "validator rejects inline UDL step list outside canonical file",
    run: () => {
      const fixture = newLibraryFixture("inline-udl-step-list");
      writeText(path.join(fixture, "templates", "project", "AGENTS.md"), lines([
        "# Project Agent Instructions",
        "",
        "## Universal Development Loop",
        "",
        "1. `Intake`: clarify goal.",
        "2. `Evidence`: inspect source.",
        "3. `Baseline Proof`: reproduce or characterize current behavior before behavior changes when feasible.",
        "4. `Small Slice`: choose the smallest reviewable change that proves value.",
        "5. `Happy Path`: implement the smallest complete production path.",
        "6. `Happy-Path Proof`: demonstrate observable behavior at the relevant boundary.",
        "7. `Risk Discovery`: use an independent fresh-context testing subagent.",
        "8. `Negative Tests`: exercise realistic failure scenarios.",
        "9. `Harden`: feed failures back into production fixes.",
        "10. `Review Gate`: use relevant read-only reviewers only when risk justifies them.",
        "11. `Final Validation`: broaden validation when boundaries are affected.",
        "12. `Final Candidate Review`: run the mandatory independent post-validation review.",
        "13. `Handoff`: report changed files and evidence.",
        "14. `Process Improvement`: capture friction with `complain`.",
        "",
      ]));
      const result = invokeValidator(fixture);
      assertFailure(result, "Inline UDL step list outside canonical file should fail validation.");
      assertOutputContains(result, "Universal Development Loop step list must only appear in", "Validation output should name the canonical-source rule.");
    },
  },
  {
    name: "validator rejects inline UDL arrow chain outside canonical file",
    run: () => {
      const fixture = newLibraryFixture("inline-udl-arrow-chain");
      writeText(path.join(fixture, "templates", "project", "AGENTS.md"), lines([
        "# Project Agent Instructions",
        "",
        "## Universal Development Loop",
        "",
        "Intake -> Evidence -> Baseline Proof -> Small Slice -> Happy Path -> Happy-Path Proof -> Risk Discovery -> Negative Tests -> Harden -> Review Gate -> Final Validation -> Final Candidate Review -> Handoff -> Process Improvement",
        "",
      ]));
      const result = invokeValidator(fixture);
      assertFailure(result, "Inline UDL arrow chain outside canonical file should fail validation.");
      assertOutputContains(result, "Universal Development Loop inline chain must only appear in", "Validation output should name the canonical-source rule.");
    },
  },
  {
    name: "validator rejects weakened complain feedback contract",
    run: () => {
      const fixture = newLibraryFixture("complain-contract");
      const skillPath = path.join(fixture, "global", "skills", "complain", "SKILL.md");
      const readmePath = path.join(fixture, "docs", "feedbacks", "README.md");
      writeText(readmePath, fs.readFileSync(path.join(root, "docs", "feedbacks", "README.md"), "utf8"));
      const skill = fs.readFileSync(skillPath, "utf8");
      writeText(skillPath, skill.replace("raw private prompts", "private prompt details"));
      const result = invokeValidator(fixture);
      assertFailure(result, "Weakened complain privacy contract should fail validation.");
      assertOutputContains(result, "raw private prompts", "Complain contract validation should name missing privacy guard.");
    },
  },
  {
    name: "validator accepts bounded implementation worker",
    run: () => {
      const fixture = newLibraryFixture("bounded-implementation-worker");
      addImplementationWorkerFixture(fixture);
      assertSuccess(invokeValidator(fixture), "Bounded implementation worker should pass validation.");
    },
  },
  ...changeReadyValidatorTests,
  {
    name: "validator rejects unsupported implementation worker bash allow",
    run: () => {
      const fixture = newLibraryFixture("implementation-worker-extra-bash");
      const workerPath = addImplementationWorkerFixture(fixture);
      const worker = fs.readFileSync(workerPath, "utf8");
      writeText(workerPath, worker.replace("  bash: deny", "  bash:\n    \"*\": deny\n    \"git push*\": allow"));
      const result = invokeValidator(fixture);
      assertFailure(result, "Implementation worker must reject unsupported bash allow rules.");
      assertOutputContains(result, "unsupported bash permission", "Implementation worker permission failure should name unsupported bash permission.");
    },
  },
  {
    name: "validator rejects session delivery context tool on implementation worker",
    run: () => {
      const fixture = newLibraryFixture("implementation-worker-session-delivery-tool");
      const workerPath = addImplementationWorkerFixture(fixture);
      const worker = fs.readFileSync(workerPath, "utf8");
      writeText(workerPath, worker.replace("  edit: allow", "  edit: allow\n  session_delivery_context: allow"));
      const result = invokeValidator(fixture);
      assertFailure(result, "Implementation worker must not allow session_delivery_context.");
      assertOutputContains(result, "Only session-delivery-reviewer", "Custom-tool permission exception should include implementation-worker.");
    },
  },
  {
    name: "validator rejects missing implementation worker base routing",
    run: () => {
      const fixture = newLibraryFixture("implementation-worker-missing-routing");
      const workerPath = path.join(fixture, "global", "agents", "implementation-worker.md");
      const sourcePath = path.join(root, "global", "agents", "implementation-worker.md");
      writeText(workerPath, fs.readFileSync(sourcePath, "utf8"));
      const readmePath = path.join(fixture, "README.md");
      const readme = fs.readFileSync(readmePath, "utf8");
      writeText(readmePath, readme.replace("- `demo-reviewer`: Demo reviewer.", "- `demo-reviewer`: Demo reviewer.\n- `implementation-worker`: Bounded production or independent testing implementation worker."));
      const result = invokeValidator(fixture);
      assertFailure(result, "Implementation worker without base routing should fail validation.");
      assertOutputContains(result, "implementation-worker routing", "Routing failure should name implementation-worker routing.");
    },
  },
  {
    name: "validator accepts the complete hardened troubleshooter fixture",
    run: () => {
      const fixture = newLibraryFixture("valid-troubleshooter");
      addTroubleshooterFixture(fixture);
      assertSuccess(invokeValidator(fixture), "Complete hardened troubleshooter fixture should pass validation.");
    },
  },
  ...[
    {
      name: "bash",
      original: "  bash:\n    \"*\": ask\n    \"git add*\": deny",
      replacement: "  bash:\n    \"git add*\": deny\n    \"*\": ask",
      diagnostic: "Troubleshooter bash permission rule order drifted",
    },
    {
      name: "edit",
      original: "  edit:\n    \"*\": ask\n    \"*.test.*\": deny",
      replacement: "  edit:\n    \"*.test.*\": deny\n    \"*\": ask",
      diagnostic: "Troubleshooter edit permission rule order drifted",
    },
    {
      name: "skill",
      original: "  skill:\n    \"*\": deny\n    complain: allow",
      replacement: "  skill:\n    complain: allow\n    \"*\": deny",
      diagnostic: "Troubleshooter skill permission rule order drifted",
    },
  ].map((testCase): TestCase => ({
    name: `validator rejects reordered troubleshooter ${testCase.name} rules with a last-match-wins diagnostic`,
    run: () => {
      const fixture = newLibraryFixture(`troubleshooter-${testCase.name}-order`);
      const troubleshooterPath = addTroubleshooterFixture(fixture);
      const troubleshooter = fs.readFileSync(troubleshooterPath, "utf8");
      writeText(troubleshooterPath, replaceTroubleshooterText(troubleshooter, testCase.original, testCase.replacement));
      const result = invokeValidator(fixture);
      assertFailure(result, `Reordered troubleshooter ${testCase.name} rules should fail validation.`);
      assertOutputContains(result, testCase.diagnostic, `Troubleshooter ${testCase.name} order failure should be explicit.`);
      assertOutputContains(result, "OpenCode resolves rules last-match-wins", "Troubleshooter order failure should explain OpenCode rule semantics.");
    },
  })),
  ...[
    {
      name: "model",
      original: "model: openai/gpt-5.6-sol",
      replacement: "model: openai/gpt-5.5",
      diagnostic: "Troubleshooter must use model: openai/gpt-5.6-sol",
    },
    {
      name: "variant",
      original: "variant: xhigh",
      replacement: "variant: high",
      diagnostic: "Troubleshooter must use variant: xhigh",
    },
  ].map((testCase): TestCase => ({
    name: `validator rejects troubleshooter ${testCase.name} drift`,
    run: () => {
      const fixture = newLibraryFixture(`troubleshooter-${testCase.name}-drift`);
      const troubleshooterPath = addTroubleshooterFixture(fixture);
      const troubleshooter = fs.readFileSync(troubleshooterPath, "utf8");
      writeText(troubleshooterPath, replaceTroubleshooterText(troubleshooter, testCase.original, testCase.replacement));
      const result = invokeValidator(fixture);
      assertFailure(result, `Troubleshooter ${testCase.name} drift should fail validation.`);
      assertOutputContains(result, testCase.diagnostic, `Troubleshooter ${testCase.name} failure should name the required value.`);
    },
  })),
  {
    name: "validator rejects a troubleshooter without explicit nested Dream Team denial",
    run: () => {
      const fixture = newLibraryFixture("troubleshooter-missing-dream-team-deny");
      const troubleshooterPath = addTroubleshooterFixture(fixture);
      const troubleshooter = fs.readFileSync(troubleshooterPath, "utf8");
      writeText(troubleshooterPath, replaceTroubleshooterText(troubleshooter, "  dream_team_*: deny\n", ""));
      const result = invokeValidator(fixture);
      assertFailure(result, "Troubleshooter without explicit nested Dream Team denial should fail validation.");
      assertOutputContains(result, "Troubleshooter must set dream_team_*: deny", "Troubleshooter Dream Team denial failure should be explicit.");
    },
  },
  ...[
    {
      name: "bash",
      original: "    \"git clean*\": deny",
      replacement: "    \"git clean*\": deny\n    \"git cherry-pick*\": deny",
      diagnostic: "Troubleshooter has unsupported bash permission 'git cherry-pick*: deny'",
    },
    {
      name: "edit",
      original: "    \"**/test_*.*\": deny",
      replacement: "    \"**/test_*.*\": deny\n    \"scratch/**\": deny",
      diagnostic: "Troubleshooter has unsupported edit permission 'scratch/**: deny'",
    },
  ].map((testCase): TestCase => ({
    name: `validator rejects unsupported troubleshooter ${testCase.name} rule`,
    run: () => {
      const fixture = newLibraryFixture(`troubleshooter-unsupported-${testCase.name}`);
      const troubleshooterPath = addTroubleshooterFixture(fixture);
      const troubleshooter = fs.readFileSync(troubleshooterPath, "utf8");
      writeText(troubleshooterPath, replaceTroubleshooterText(troubleshooter, testCase.original, testCase.replacement));
      const result = invokeValidator(fixture);
      assertFailure(result, `Unsupported troubleshooter ${testCase.name} rule should fail validation.`);
      assertOutputContains(result, testCase.diagnostic, `Unsupported troubleshooter ${testCase.name} rule failure should be explicit.`);
    },
  })),
  {
    name: "validator rejects a troubleshooter missing required escalation contract text",
    run: () => {
      const fixture = newLibraryFixture("troubleshooter-missing-contract-text");
      const troubleshooterPath = addTroubleshooterFixture(fixture);
      const troubleshooter = fs.readFileSync(troubleshooterPath, "utf8");
      writeText(troubleshooterPath, replaceTroubleshooterText(troubleshooter, "TROUBLESHOOTER_REPORT", "ESCALATION_REPORT"));
      const result = invokeValidator(fixture);
      assertFailure(result, "Troubleshooter missing required escalation contract text should fail validation.");
      assertOutputContains(result, "Troubleshooter contract must include 'TROUBLESHOOTER_REPORT'", "Missing contract text failure should name the required escalation-report token.");
    },
  },
  {
    name: "validator rejects invalid YAML-like frontmatter",
    run: () => {
      const fixture = newLibraryFixture("invalid-frontmatter");
      writeText(path.join(fixture, "global", "skills", "demo-skill", "SKILL.md"), lines([
        "---",
        "name: demo-skill",
        "description: Invalid: unquoted colon-space scalar.",
        "license: MIT",
        "---",
        "",
        "# Demo Skill",
        "",
      ]));
      assertFailure(invokeValidator(fixture), "Invalid frontmatter should fail validation.");
    },
  },
  {
    name: "validator ignores body-only metadata",
    run: () => {
      const fixture = newLibraryFixture("body-metadata");
      writeText(path.join(fixture, "global", "skills", "demo-skill", "SKILL.md"), lines([
        "# Demo Skill",
        "",
        "name: demo-skill",
        "description: Body metadata must not count as frontmatter.",
        "",
      ]));
      assertFailure(invokeValidator(fixture), "Body-only metadata should not satisfy frontmatter requirements.");
    },
  },
  {
    name: "validator rejects bare required scalars",
    run: () => {
      const fixture = newLibraryFixture("bare-description");
      writeText(path.join(fixture, "global", "skills", "demo-skill", "SKILL.md"), lines([
        "---",
        "name: demo-skill",
        "description:",
        "license: MIT",
        "---",
        "",
        "# Demo Skill",
        "",
      ]));
      assertFailure(invokeValidator(fixture), "Bare required scalar fields should fail validation.");
    },
  },
  {
    name: "validator rejects unsafe reviewer permissions",
    run: () => {
      const fixture = newLibraryFixture("unsafe-permissions");
      writeText(path.join(fixture, "global", "agents", "demo-reviewer.md"), lines([
        "---",
        "description: Reviews demo fixture behavior.",
        "mode: subagent",
        "permission:",
        "  read: allow",
        "  glob: allow",
        "  grep: allow",
        "  bash: ask",
        "  edit: deny",
        "  task: deny",
        "  question: deny",
        "  skill: allow",
        "---",
        "",
        "You are a read-only demo reviewer.",
        "",
      ]));
      assertFailure(invokeValidator(fixture), "Unsafe reviewer permissions should fail validation.");
    },
  },
  {
    name: "validator rejects incomplete reviewer permissions",
    run: () => {
      const fixture = newLibraryFixture("incomplete-reviewer-permissions");
      writeText(path.join(fixture, "global", "agents", "demo-reviewer.md"), lines([
        "---",
        "description: Reviews demo fixture behavior.",
        "mode: subagent",
        "permission:",
        "  read: allow",
        "  glob: allow",
        "  grep: allow",
        "  bash: deny",
        "  edit:",
        "    \"*\": deny",
        "    \"docs/feedbacks/**\": allow",
        "  task: deny",
        "  question: deny",
        "  dream_team_*: deny",
        "  skill:",
        "    \"*\": deny",
        "    complain: allow",
        "---",
        "",
        "You are a read-only demo reviewer.",
        "",
      ]));
      const result = invokeValidator(fixture);
      assertFailure(result, "Incomplete reviewer permissions should fail validation.");
      assertOutputContains(result, "webfetch: deny", "Incomplete reviewer permissions should name the missing deny key.");
    },
  },
  {
    name: "validator accepts reviewer permissions without obsolete list key",
    run: () => {
      const fixture = newLibraryFixture("reviewer-without-list-permission");
      writeText(path.join(fixture, "global", "agents", "demo-reviewer.md"), lines([
        "---",
        "description: Reviews demo fixture behavior.",
        "mode: subagent",
        "permission:",
        "  read: allow",
        "  glob: allow",
        "  grep: allow",
        "  bash: deny",
        "  edit:",
        "    \"*\": deny",
        "    \"docs/feedbacks/**\": allow",
        "  task: deny",
        "  question: deny",
        "  dream_team_*: deny",
        "  skill:",
        "    \"*\": deny",
        "    complain: allow",
        "  webfetch: deny",
        "  websearch: deny",
        "  todowrite: deny",
        "  external_directory: deny",
        "  lsp: deny",
        "  doom_loop: deny",
        "---",
        "",
        "You are a read-only demo reviewer.",
        "",
        "## Contract Reference",
        "",
        "`instructions/leaf-reviewer-agent-contract.md`",
        "",
        "## Output",
        "",
        "Return:",
        "",
        "- `Findings`: ordered by severity. Each finding includes `Severity`, `Evidence`, `Evidence Type`, `Impact`, `Likely Root Cause`, `Recommendation`, `Confidence`, `Needs external reviewer`.",
        "- `Residual Risks`: known low-confidence gaps, missing evidence, or `none`.",
        "- `Blocking Evidence`: readiness-rejecting facts or `none`.",
        "- `Follow-up Candidates`: non-authorizing separate work or `none`.",
        "",
      ]));
      assertSuccess(invokeValidator(fixture), "Reviewer permissions should not require obsolete list permission.");
    },
  },
  {
    name: "validator rejects reviewer bash allow outside session delivery reviewer",
    run: () => {
      const fixture = newLibraryFixture("reviewer-bash-exception-scope");
      writeText(path.join(fixture, "global", "agents", "demo-reviewer.md"), lines([
        "---",
        "description: Reviews demo fixture behavior.",
        "mode: subagent",
        "permission:",
        "  read: allow",
        "  glob: allow",
        "  grep: allow",
        "  bash:",
        "    \"*\": deny",
        "    \"npm run validate*\": allow",
        "  edit:",
        "    \"*\": deny",
        "    \"docs/feedbacks/**\": allow",
        "  task: deny",
        "  question: deny",
        "  skill:",
        "    \"*\": deny",
        "    complain: allow",
        "  webfetch: deny",
        "  websearch: deny",
        "  todowrite: deny",
        "  external_directory: deny",
        "  lsp: deny",
        "  doom_loop: deny",
        "---",
        "",
        "You are a read-only demo reviewer.",
        "",
        "## Contract Reference",
        "",
        "`instructions/leaf-reviewer-agent-contract.md`",
        "",
        "## Output",
        "",
        "Return:",
        "",
        "- `Findings`: ordered by severity. Each finding includes `Severity`, `Evidence`, `Evidence Type`, `Impact`, `Likely Root Cause`, `Recommendation`, `Confidence`, `Needs external reviewer`.",
        "- `Residual Risks`: known low-confidence gaps, missing evidence, or `none`.",
        "- `Blocking Evidence`: readiness-rejecting facts or `none`.",
        "- `Follow-up Candidates`: non-authorizing separate work or `none`.",
        "",
      ]));
      const result = invokeValidator(fixture);
      assertFailure(result, "Only session-delivery-reviewer should be allowed to run delivery-context.");
      assertOutputContains(result, "bash: deny", "Unauthorized reviewer bash exception should explain expected deny policy.");
      assertOutputExcludes(result, "Unsupported frontmatter syntax", "Validator should parse nested bash permission objects.");
    },
  },
  {
    name: "validator rejects session delivery context tool outside session delivery reviewer",
    run: () => {
      const fixture = newLibraryFixture("reviewer-custom-tool-exception-scope");
      writeText(path.join(fixture, "global", "agents", "demo-reviewer.md"), lines([
        "---",
        "description: Reviews demo fixture behavior.",
        "mode: subagent",
        "permission:",
        "  read: allow",
        "  glob: allow",
        "  grep: allow",
        "  bash: deny",
        "  session_delivery_context: allow",
        "  edit:",
        "    \"*\": deny",
        "    \"docs/feedbacks/**\": allow",
        "  task: deny",
        "  question: deny",
        "  skill:",
        "    \"*\": deny",
        "    complain: allow",
        "  webfetch: deny",
        "  websearch: deny",
        "  todowrite: deny",
        "  external_directory: deny",
        "  lsp: deny",
        "  doom_loop: deny",
        "---",
        "",
        "You are a read-only demo reviewer.",
        "",
        "## Contract Reference",
        "",
        "`instructions/leaf-reviewer-agent-contract.md`",
        "",
        "## Output",
        "",
        "Return:",
        "",
        "- `Findings`: ordered by severity. Each finding includes `Severity`, `Evidence`, `Evidence Type`, `Impact`, `Likely Root Cause`, `Recommendation`, `Confidence`, `Needs external reviewer`.",
        "- `Residual Risks`: known low-confidence gaps, missing evidence, or `none`.",
        "- `Blocking Evidence`: readiness-rejecting facts or `none`.",
        "- `Follow-up Candidates`: non-authorizing separate work or `none`.",
        "",
      ]));
      const result = invokeValidator(fixture);
      assertFailure(result, "Only session-delivery-reviewer should be allowed to use session_delivery_context.");
      assertOutputContains(result, "Only session-delivery-reviewer", "Custom-tool permission exception should be exclusive.");
    },
  },
  {
    name: "validator rejects obsolete reviewer list permission",
    run: () => {
      const fixture = newLibraryFixture("obsolete-list-permission");
      writeText(path.join(fixture, "global", "agents", "demo-reviewer.md"), lines([
        "---",
        "description: Reviews demo fixture behavior.",
        "mode: subagent",
        "permission:",
        "  read: allow",
        "  glob: allow",
        "  grep: allow",
        "  list: allow",
        "  bash: deny",
        "  edit: deny",
        "  task: deny",
        "  question: deny",
        "  skill: deny",
        "  webfetch: deny",
        "  websearch: deny",
        "  todowrite: deny",
        "  external_directory: deny",
        "  lsp: deny",
        "  doom_loop: deny",
        "---",
        "",
        "You are a read-only demo reviewer.",
        "",
      ]));
      const result = invokeValidator(fixture);
      assertFailure(result, "Reviewer permissions should reject obsolete list permission.");
      assertOutputContains(result, "permission.list", "Validation output should name obsolete list permission.");
    },
  },
  {
    name: "validator rejects missing test-coverage reviewer task context contract",
    run: () => {
      const fixture = newLibraryFixture("test-coverage-context-contract");
      writeText(path.join(fixture, "global", "agents", "test-coverage-reviewer.md"), lines([
        "---",
        "description: Reviews acceptance and test coverage.",
        "mode: subagent",
        "permission:",
        "  read: allow",
        "  glob: allow",
        "  grep: allow",
        "  bash: deny",
        "  edit: deny",
        "  task: deny",
        "  question: deny",
        "  skill: deny",
        "  webfetch: deny",
        "  websearch: deny",
        "  todowrite: deny",
        "  external_directory: deny",
        "  lsp: deny",
        "  doom_loop: deny",
        "---",
        "",
        "You are a read-only reviewer for test coverage.",
        "",
        "## Checks",
        "",
        "- Map requirements to tests.",
        "",
      ]));
      appendReadmeAgentCatalogEntry(fixture, "- `test-coverage-reviewer`: Test coverage reviewer.");
      const result = invokeValidator(fixture);
      assertFailure(result, "Missing test-coverage reviewer task context contract should fail validation.");
      assertOutputContains(result, "test-coverage-reviewer must require task/repro/runtime-envelope coverage", "Validation output should name the missing reviewer contract.");
    },
  },
  {
    name: "validator rejects missing session-delivery reviewer control contract",
    run: () => {
      const fixture = newLibraryFixture("session-delivery-control-contract");
      writeText(path.join(fixture, "global", "agents", "session-delivery-reviewer.md"), lines([
        "---",
        "description: Reviews OpenCode session delivery.",
        "mode: subagent",
        "permission:",
        "  read: allow",
        "  glob: allow",
        "  grep: allow",
        "  bash: deny",
        "  edit: deny",
        "  task: deny",
        "  question: deny",
        "  skill: deny",
        "  webfetch: deny",
        "  websearch: deny",
        "  todowrite: deny",
        "  external_directory: deny",
        "  lsp: deny",
        "  doom_loop: deny",
        "---",
        "",
        "You are a read-only session delivery reviewer.",
        "",
        "## Checks",
        "",
        "- Verify goal alignment.",
        "",
      ]));
      appendReadmeAgentCatalogEntry(fixture, "- `session-delivery-reviewer`: Session delivery reviewer.");
      const result = invokeValidator(fixture);
      assertFailure(result, "Missing session-delivery reviewer control contract should fail validation.");
      assertOutputContains(result, "session-delivery-reviewer must require delivery-control safeguards", "Validation output should name the missing reviewer contract.");
    },
  },
  {
    name: "validator rejects missing session delivery binding handoff",
    run: () => {
      const fixture = newLibraryFixture("session-delivery-binding-handoff");
      addSessionDeliveryBindingFixture(fixture);
      assertSuccess(invokeValidator(fixture), "Session delivery binding fixture should pass before token removal.");
      const agentsPath = path.join(fixture, "REPO_AGENTS.md");
      writeText(agentsPath, fs.readFileSync(agentsPath, "utf8").replace("Blocking for Acceptance: yes", "Blocking for Acceptance: missing"));
      const result = invokeValidator(fixture);
      assertFailure(result, "Missing binding session-delivery handoff instructions should fail validation.");
      assertOutputContains(result, "session-delivery-reviewer binding handoff", "Validation output should name binding handoff contract.");
      assertOutputContains(result, "Blocking for Acceptance: yes", "Validation output should name missing binding token.");
    },
  },
  ...sessionDeliveryBindingTokens.map((token): TestCase => ({
    name: `validator rejects missing session delivery binding token: ${token}`,
    run: () => {
      const fixture = newLibraryFixture(`session-delivery-binding-${token.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}`);
      addSessionDeliveryBindingFixture(fixture);
      const agentsPath = path.join(fixture, "REPO_AGENTS.md");
      writeText(agentsPath, fs.readFileSync(agentsPath, "utf8").replaceAll(token, "[missing-binding-token]"));
      const result = invokeValidator(fixture);
      assertFailure(result, `Missing binding token should fail validation: ${token}`);
      assertOutputContains(result, token, `Validation output should name missing binding token: ${token}`);
    },
  })),
  {
    name: "validator rejects reviewer that inlines Prevention Feedback block",
    run: () => {
      const fixture = newLibraryFixture("reviewer-prevention-feedback-contract");
      const profilePath = path.join(fixture, "profiles", "all.json");
      const profile = fs.readFileSync(profilePath, "utf8");
      writeText(profilePath, profile.replace("\"demo-reviewer\"]", "\"demo-reviewer\", \"code-quality-reviewer\"]"));
      writeText(path.join(fixture, "global", "agents", "code-quality-reviewer.md"), lines([
        "---",
        "description: Reviews changed code quality.",
        "mode: subagent",
        "permission:",
        "  read: allow",
        "  glob: allow",
        "  grep: allow",
        "  bash: deny",
        "  edit:",
        "    \"*\": deny",
        "    \"docs/feedbacks/**\": allow",
        "  task: deny",
        "  question: deny",
        "  skill:",
        "    \"*\": deny",
        "    complain: allow",
        "  webfetch: deny",
        "  websearch: deny",
        "  todowrite: deny",
        "  external_directory: deny",
        "  lsp: deny",
        "  doom_loop: deny",
        "---",
        "",
        "You are a read-only code quality reviewer.",
        "",
        "## Contract Reference",
        "",
        "`instructions/leaf-reviewer-agent-contract.md`",
        "",
        "## Prevention Feedback",
        "",
        "For each P0/P1 finding with non-`unknown` `Likely Root Cause`, include `Prevention Feedback`:",
        "",
        "- `Severity`: P0 | P1.",
        "- `Recurrence Path`: existing instruction, skill, or agent that should have prevented recurrence, and why it missed.",
        "- `Prevention Target`: `AGENTS.md` | `skill:<name>` | `agent:<name>` | `new-skill-required`.",
        "- `Prevention Cost`: cheap | medium | expensive.",
        "- `Draft Rule`: proposed rule text for main-session review, not a finalized edit.",
        "- `Replay Evidence`: exact diff, fixture, command, or session context that should fail to reproduce after the rule is applied.",
        "",
        "## Output",
        "",
        "Return:",
        "",
        "- `Findings`: ordered by severity. Each finding includes `Severity`, `Evidence`, `Evidence Type`, `Impact`, `Likely Root Cause`, `Recommendation`, `Confidence`, `Needs external reviewer`.",
        "- `Residual Risks`: known low-confidence gaps, missing evidence, or `none`.",
        "- `Blocking Evidence`: readiness-rejecting facts or `none`.",
        "- `Follow-up Candidates`: non-authorizing separate work or `none`.",
        "",
      ]));
      appendReadmeAgentCatalogEntry(fixture, "- `code-quality-reviewer`: Code quality reviewer.");
      const result = invokeValidator(fixture);
      assertFailure(result, "Inline Prevention Feedback block in reviewer should fail validation.");
      assertOutputContains(result, "Prevention Feedback", "Validation output should name the inline Prevention Feedback block.");
    },
  },
  {
    name: "validator rejects catalog drift",
    run: () => {
      const fixture = newLibraryFixture("catalog-drift");
      writeText(path.join(fixture, "README.md"), lines([
        "# Fixture",
        "",
        "## Routing Map",
        "",
        "- Demo work -> `demo-skill`.",
        "",
        "## Reviewer Gate Map",
        "",
        "- Instruction artifacts -> `instruction-artifact-reviewer`.",
        "",
        "## Skill Catalog",
        "",
        "## Agent Catalog",
        "",
        "- `demo-reviewer`: Demo reviewer.",
        "",
        "## Instruction Templates",
        "",
        "- `example.md`: Demo instruction.",
        "",
        "## Porting Notes",
        "",
      ]));
      assertFailure(invokeValidator(fixture), "README catalog drift should fail validation.");
    },
  },
  {
    name: "validator rejects duplicate catalog entries",
    run: () => {
      const fixture = newLibraryFixture("duplicate-catalog-entry");
      const readmePath = path.join(fixture, "README.md");
      const readme = fs.readFileSync(readmePath, "utf8");
      writeText(readmePath, readme.replace("- `demo-skill`: Demo skill.", "- `demo-skill`: Demo skill.\n- `demo-skill`: Duplicate demo skill."));
      const result = invokeValidator(fixture);
      assertFailure(result, "Duplicate catalog entries should fail validation.");
      assertOutputContains(result, "catalog has duplicate 'demo-skill'", "Duplicate catalog failure should name the duplicate entry.");
    },
  },
  {
    name: "validator rejects shared-policy non-object roots and machineOverride without leaking content",
    run: () => {
      const secret = "private-config-value-must-not-leak";
      for (const [name, content, diagnostic] of [
        ["scalar", `"${secret}"\n`, "Invalid OpenCode config root"], ["array", `["${secret}"]\n`, "Invalid OpenCode config root"],
        ["null", "null\n", "Invalid OpenCode config root"], ...[true, false, null].map((value) => [`machine-override-${String(value)}`, `{ "machineOverride": ${String(value)}, "provider": "${secret}" }\n`, "Unsupported OpenCode config field 'machineOverride'"]),
      ]) {
        const fixture = newLibraryFixture(`config-root-${name}`);
        writeText(path.join(fixture, "opencode.json"), content);
        const result = invokeValidator(fixture);
        assertFailure(result, `${name} OpenCode config must fail closed.`);
        assertOutputContains(result, diagnostic, `${name} must report the shared policy problem class.`);
        assertOutputExcludes(result, secret, `${name} diagnostics must not expose config content.`);
      }
    },
  },
];
