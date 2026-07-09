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

const root = libraryRoot;

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
        "5. `Test First`: add or update a focused failing, acceptance, or characterization test before behavior-changing implementation.",
        "6. `Implement`: make the smallest correct change.",
        "7. `Focused Validation`: run the nearest validation command first.",
        "8. `Review Gate`: use relevant read-only reviewers only when risk justifies them.",
        "9. `Final Validation`: broaden validation when boundaries are affected.",
        "10. `Handoff`: report changed files.",
        "11. `Process Improvement`: capture friction with `complain`.",
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
        "Intake -> Evidence -> Baseline Proof -> Small Slice -> Test First -> Implement -> Focused Validation -> Review Gate -> Final Validation -> Handoff -> Process Improvement",
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
  {
    name: "validator rejects unsupported implementation worker bash allow",
    run: () => {
      const fixture = newLibraryFixture("implementation-worker-extra-bash");
      const workerPath = addImplementationWorkerFixture(fixture);
      const worker = fs.readFileSync(workerPath, "utf8");
      writeText(workerPath, worker.replace("    \"git diff*\": allow", "    \"git diff*\": allow\n    \"git push*\": allow"));
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
      writeText(readmePath, readme.replace("- `demo-reviewer`: Demo reviewer.", "- `demo-reviewer`: Demo reviewer.\n- `implementation-worker`: Bounded TDD/test-first implementation worker."));
      const result = invokeValidator(fixture);
      assertFailure(result, "Implementation worker without base routing should fail validation.");
      assertOutputContains(result, "implementation-worker routing", "Routing failure should name implementation-worker routing.");
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
        "This reviewer follows the shared contract defined at `instructions/leaf-reviewer-agent-contract.md` (Leaf Contract, Feedback Ledger, Evidence Rules, Severity Scale, Prevention Feedback, Output Schema).",
        "",
        "## Output",
        "",
        "Return:",
        "",
        "- `Findings`: ordered by severity. Each finding includes `Severity`, `Evidence`, `Evidence Type`, `Impact`, `Likely Root Cause`, `Recommendation`, `Confidence`, `Needs external reviewer`.",
        "- `Residual Risks`: known low-confidence gaps, missing evidence, or `none`.",
        "- `Actionable Continuation Items`: concrete tasks for the main session, or `none`.",
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
        "This reviewer follows the shared contract defined at `instructions/leaf-reviewer-agent-contract.md` (Leaf Contract, Feedback Ledger, Evidence Rules, Severity Scale, Prevention Feedback, Output Schema).",
        "",
        "## Output",
        "",
        "Return:",
        "",
        "- `Findings`: ordered by severity. Each finding includes `Severity`, `Evidence`, `Evidence Type`, `Impact`, `Likely Root Cause`, `Recommendation`, `Confidence`, `Needs external reviewer`.",
        "- `Residual Risks`: known low-confidence gaps, missing evidence, or `none`.",
        "- `Actionable Continuation Items`: concrete tasks for the main session, or `none`.",
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
        "This reviewer follows the shared contract defined at `instructions/leaf-reviewer-agent-contract.md` (Leaf Contract, Feedback Ledger, Evidence Rules, Severity Scale, Prevention Feedback, Output Schema).",
        "",
        "## Output",
        "",
        "Return:",
        "",
        "- `Findings`: ordered by severity. Each finding includes `Severity`, `Evidence`, `Evidence Type`, `Impact`, `Likely Root Cause`, `Recommendation`, `Confidence`, `Needs external reviewer`.",
        "- `Residual Risks`: known low-confidence gaps, missing evidence, or `none`.",
        "- `Actionable Continuation Items`: concrete tasks for the main session, or `none`.",
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
      writeText(agentsPath, fs.readFileSync(agentsPath, "utf8").replace(token, "[missing-binding-token]"));
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
        "This reviewer follows the shared contract defined at `instructions/leaf-reviewer-agent-contract.md` (Leaf Contract, Feedback Ledger, Evidence Rules, Severity Scale, Prevention Feedback, Output Schema).",
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
        "- `Actionable Continuation Items`: concrete tasks for the main session, or `none`.",
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
];
