import fs from "node:fs";
import path from "node:path";
import {
  assertFailure,
  assertOutputContains,
  assertOutputExcludes,
  assertSuccess,
  invokeProcessCapture,
  invokeValidator,
  newLibraryFixture,
  type TestCase,
  validator as validatorPath,
  writeText,
  lines,
  libraryRoot,
} from "../test-helpers/library.ts";

const root = libraryRoot;
const validator = validatorPath;

export const validatorTests2: TestCase[] = [
  {
    name: "validator rejects missing routing map",
    run: () => {
      const fixture = newLibraryFixture("missing-routing-map");
      writeText(path.join(fixture, "README.md"), lines([
        "# Fixture",
        "",
        "## Reviewer Gate Map",
        "",
        "- Instruction artifacts -> `instruction-artifact-reviewer`.",
        "",
        "## Skill Catalog",
        "",
        "- `demo-skill`: Demo skill.",
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
      const result = invokeValidator(fixture);
      assertFailure(result, "Missing routing map should fail validation.");
      assertOutputContains(result, "Missing README section 'Routing Map'", "Missing routing map should explain the section gap.");
    },
  },
  {
    name: "validator rejects empty reviewer gate map",
    run: () => {
      const fixture = newLibraryFixture("empty-reviewer-map");
      writeText(path.join(fixture, "README.md"), lines([
        "# Fixture",
        "",
        "## Routing Map",
        "",
        "- Demo work -> `demo-skill`.",
        "",
        "## Reviewer Gate Map",
        "",
        "## Skill Catalog",
        "",
        "- `demo-skill`: Demo skill.",
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
      const result = invokeValidator(fixture);
      assertFailure(result, "Empty reviewer gate map should fail validation.");
      assertOutputContains(result, "README reviewer gate map must include at least one bullet", "Empty reviewer gate map should explain the bullet gap.");
    },
  },
  {
    name: "validator rejects missing instruction audit route",
    run: () => {
      const fixture = newLibraryFixture("missing-instruction-audit-route");
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
        "- `demo-skill`: Demo skill.",
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
      const result = invokeValidator(fixture);
      assertFailure(result, "Missing instruction audit route should fail validation.");
      assertOutputContains(result, "instruction-artifact-audit-runbook.md", "Missing instruction audit route should explain the route gap.");
    },
  },
  {
    name: "validator rejects missing completion handoff",
    run: () => {
      const fixture = newLibraryFixture("missing-completion-handoff");
      writeText(path.join(fixture, "REPO_AGENTS.md"), lines([
        "# Repository Instructions",
        "",
        "- Keep artifacts reusable.",
        "",
      ]));
      assertFailure(invokeValidator(fixture), "Missing completion handoff should fail validation.");
    },
  },
  {
    name: "validator rejects missing TypeScript-only policy",
    run: () => {
      const fixture = newLibraryFixture("missing-typescript-policy");
      writeText(path.join(fixture, "REPO_AGENTS.md"), lines([
        "# Repository Instructions",
        "",
        "## Completion Handoff",
        "",
        "- Ask the user only for real blockers, remote/destructive actions, scope or risk decisions, credentials, and MR/PR outcomes.",
        "- When asking, offer 2-4 self-contained next actions via `question` when available.",
        "- Put the recommended option first and end its label with `(Recommended)`.",
        "- In read-only, no-question, or subagent contexts, return `Suggested Next Options` or `Actionable Continuation Items` instead of asking the user directly.",
        "",
        "## Autonomous Work Contract",
        "",
        "- The main session owns skill selection, decomposition, validation, reviewer gates, and ready-to-land handoff.",
        "- Ask the user only for real blockers.",
        "",
      ]));
      const result = invokeValidator(fixture);
      assertFailure(result, "Missing TypeScript-only policy should fail validation.");
      assertOutputContains(result, "TypeScript-only development policy", "Missing TypeScript policy should explain the section gap.");
    },
  },
  {
    name: "validator rejects missing deterministic helper automation policy",
    run: () => {
      const fixture = newLibraryFixture("missing-helper-automation-policy");
      writeText(path.join(fixture, "REPO_AGENTS.md"), lines([
        "# Repository Instructions",
        "",
        "## TypeScript Development",
        "",
        "- Use TypeScript for all repository automation and implementation code.",
        "- Do not add PowerShell, Python, or JavaScript source files; rewrite any such code to TypeScript instead.",
        "",
        "## Completion Handoff",
        "",
        "- Ask the user only for real blockers, remote/destructive actions, scope or risk decisions, credentials, and MR/PR outcomes.",
        "- When asking, offer 2-4 self-contained next actions via `question` when available.",
        "- Put the recommended option first and end its label with `(Recommended)`.",
        "- In read-only, no-question, or subagent contexts, return `Suggested Next Options` or `Actionable Continuation Items` instead of asking the user directly.",
        "",
        "## Autonomous Work Contract",
        "",
        "- The main session owns skill selection, decomposition, validation, reviewer gates, and ready-to-land handoff.",
        "- Ask the user only for real blockers.",
        "",
      ]));
      const result = invokeValidator(fixture);
      assertFailure(result, "Missing deterministic helper automation policy should fail validation.");
      assertOutputContains(result, "deterministic helper automation policy", "Missing helper automation policy should explain the section gap.");
    },
  },
  {
    name: "validator rejects non-TypeScript source files",
    run: () => {
      const fixture = newLibraryFixture("non-typescript-files");
      writeText(path.join(fixture, "tools", "legacy.ps1"), lines(["# legacy", ""]));
      writeText(path.join(fixture, "tools", "legacy.py"), lines(["print('legacy')", ""]));
      writeText(path.join(fixture, "tools", "legacy.js"), lines(["console.log('legacy');", ""]));
      const result = invokeValidator(fixture);
      assertFailure(result, "Non-TypeScript source/tooling files should fail validation.");
      assertOutputContains(result, "legacy.ps1", "PowerShell source file should be named.");
      assertOutputContains(result, "legacy.py", "Python source file should be named.");
      assertOutputContains(result, "legacy.js", "JavaScript source file should be named.");
    },
  },
  {
    name: "validator rejects legacy tooling references",
    run: () => {
      const fixture = newLibraryFixture("legacy-tooling-references");
      writeText(path.join(fixture, "README.md"), lines([
        "# Fixture",
        "",
        "## Validate",
        "",
        "Run `pwsh -NoProfile -File tools/validate-library.ps1`.",
        "",
        "## Routing Map",
        "",
        "- Demo work -> `demo-skill`.",
        "- Instruction artifacts -> `instruction-artifact-tuning`; broad audits -> `instruction-artifact-audit-runbook.md`.",
        "",
        "## Reviewer Gate Map",
        "",
        "- Instruction artifacts -> `instruction-artifact-reviewer`.",
        "",
        "## Skill Catalog",
        "",
        "- `demo-skill`: Demo skill.",
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
      const result = invokeValidator(fixture);
      assertFailure(result, "Legacy tooling references should fail validation.");
      assertOutputContains(result, "validate-library.ps1", "Legacy validator route should be named.");
    },
  },
  {
    name: "validator rejects legacy package scripts",
    run: () => {
      const fixture = newLibraryFixture("legacy-package-scripts");
      writeText(path.join(fixture, "package.json"), JSON.stringify({
        private: true,
        scripts: {
          validate: "pwsh -NoProfile -File tools/validate-library.ps1",
        },
      }, null, 2));
      const result = invokeValidator(fixture);
      assertFailure(result, "Legacy package scripts should fail validation.");
      assertOutputContains(result, "Package script 'validate'", "Legacy package script failure should name the script.");
    },
  },
  {
    name: "validator enforces installer config-dir pointing model",
    run: () => {
      const fixture = newLibraryFixture("installer-config-dir-model");
      const installerPath = path.join(fixture, "tools", "install-opencode-global.ts");
      writeText(installerPath, lines([
        "#!/usr/bin/env node",
        "// legacy copy/sync installer; does not point OPENCODE_CONFIG_DIR",
        "console.log('copying files');",
        "",
      ]));
      const result = invokeValidator(fixture);
      assertFailure(result, "Copy/sync installer without OPENCODE_CONFIG_DIR should fail validation.");
      assertOutputContains(result, "OPENCODE_CONFIG_DIR", "Validation should require the config-dir pointing model.");
    },
  },
  {
    name: "validator rejects routine question handoff",
    run: () => {
      const fixture = newLibraryFixture("routine-question-handoff");
      writeText(path.join(fixture, "REPO_AGENTS.md"), lines([
        "# Repository Instructions",
        "",
        "## TypeScript Development",
        "",
        "- Use TypeScript for all repository automation and implementation code.",
        "- Do not add PowerShell, Python, or JavaScript source files; rewrite any such code to TypeScript instead.",
        "",
        "## Completion Handoff",
        "",
        "- After non-trivial user-visible work, the main session offers 2-4 self-contained next actions via `question` when available.",
        "- Put the recommended option first and end its label with `(Recommended)`.",
        "- In read-only, no-question, or subagent contexts, return `Suggested Next Options` or `Actionable Continuation Items` instead of asking the user directly.",
        "",
        "## Autonomous Work Contract",
        "",
        "- Ask the user only for real blockers, remote/destructive actions, scope or risk decisions, credentials, and MR/PR outcomes.",
        "",
      ]));
      const result = invokeValidator(fixture);
      assertFailure(result, "Routine question handoff should fail validation.");
      assertOutputContains(result, "routine post-task question handoff", "Routine question handoff should explain the autonomy regression.");
    },
  },
  {
    name: "validator rejects self-improvement loops",
    run: () => {
      const fixture = newLibraryFixture("self-improvement-loop");
      writeText(path.join(fixture, "global", "skills", "demo-skill", "SKILL.md"), lines([
        "---",
        "name: demo-skill",
        "description: Use when testing a demo reusable skill.",
        "---",
        "",
        "# Demo Skill",
        "",
        "### Step 4 - Self-Improvement",
        "",
        "> Core principle - do not remove.",
        "",
        "Update this skill after every run.",
        "",
      ]));
      const result = invokeValidator(fixture);
      assertFailure(result, "Self-improvement loops should fail validation.");
      assertOutputContains(result, "automatic self-improvement/self-edit loops", "Self-improvement loop should explain the autonomy regression.");
    },
  },
  {
    name: "validator ignores deleted tracked markdown",
    run: () => {
      const fixture = newLibraryFixture("deleted-tracked-markdown");
      const stalePath = path.join(fixture, "notes", "stale.md");
      writeText(stalePath, lines(["# Stale", ""]));
      assertSuccess(invokeProcessCapture("git", ["init"], fixture), "Fixture git init should succeed.");
      assertSuccess(invokeProcessCapture("git", ["add", "."], fixture), "Fixture git add should succeed.");
      fs.unlinkSync(stalePath);
      assertSuccess(invokeValidator(fixture), "Deleted tracked markdown should not affect validation.");
    },
  },
  {
    name: "validator warns on implementation language without TDD",
    run: () => {
      const fixture = newLibraryFixture("tdd-warning");
      writeText(path.join(fixture, "global", "skills", "demo-skill", "SKILL.md"), lines([
        "---",
        "name: demo-skill",
        "description: Use when testing a demo reusable skill.",
        "---",
        "",
        "# Demo Skill",
        "",
        "Use this skill when testing implementation-language warnings.",
        "",
        "This skill can implement code changes.",
        "",
        "## Output",
        "",
        "Return implementation notes.",
        "",
      ]));
      const result = invokeValidator(fixture);
      assertSuccess(result, "TDD warning should not fail validation.");
      assertOutputContains(result, "WARN:", "TDD warning should be visible.");
    },
  },
  {
    name: "validator ignores non-goal implementation language",
    run: () => {
      const fixture = newLibraryFixture("non-goal-implementation-language");
      writeText(path.join(fixture, "global", "skills", "demo-skill", "SKILL.md"), lines([
        "---",
        "name: demo-skill",
        "description: Use when testing non-goal wording.",
        "---",
        "",
        "# Demo Skill",
        "",
        "Use this skill when testing instruction validation wording.",
        "",
        "Non-goals: plugin implementation is out of scope.",
        "",
        "## Output",
        "",
        "Return scope notes.",
        "",
      ]));
      const result = invokeValidator(fixture);
      assertSuccess(result, "Non-goal implementation wording should not warn.");
      assertOutputContains(result, "warnings=0", "Non-goal implementation wording should emit no warnings.");
    },
  },
  {
    name: "validator rejects forbidden anchors",
    run: () => {
      const fixture = newLibraryFixture("forbidden-anchor");
      writeText(path.join(fixture, "instructions", "example.md"), lines(["# Example", "OldProductName", ""]));
      const result = invokeProcessCapture("node", [validator, "--root", fixture, "--forbidden-anchor", "OldProductName"], root);
      assertFailure(result, "Forbidden anchors should fail validation.");
      assertOutputContains(result, "Forbidden anchor 'OldProductName'", "Forbidden anchor failure should name the anchor.");
    },
  },
  {
    name: "validator warns on broad permission wildcard allow",
    run: () => {
      const riskyFixture = newLibraryFixture("permission-wildcard-risk");
      writeText(path.join(riskyFixture, "opencode.jsonc"), lines([
        "{",
        "  \"$schema\": \"https://opencode.ai/config.json\",",
        "  \"permission\": {",
        "    \"*\": \"allow\",",
        "    \"bash\": {",
        "      \"git reset --hard*\": \"ask\",",
        "      \"*\": \"allow\"",
        "    },",
        "    \"read\": {",
        "      \"*\": \"allow\"",
        "    }",
        "  }",
        "}",
      ]));
      const riskyResult = invokeValidator(riskyFixture);
      assertSuccess(riskyResult, "Broad permission wildcard allow should be warning-only.");
      assertOutputContains(riskyResult, "WARN:", "Broad permission wildcard allow should emit a warning.");
      assertOutputContains(riskyResult, "permission.*", "Permission warning should identify top-level wildcard allow.");
      assertOutputContains(riskyResult, "permission.bash", "Permission warning should identify the affected permission key.");
      assertOutputContains(riskyResult, "wildcard allow", "Permission warning should explain the wildcard allow risk.");
      assertOutputExcludes(riskyResult, "permission.read", "Read wildcard allow should not warn as mutation-capable permission.");

      const safeFixture = newLibraryFixture("permission-wildcard-safe");
      writeText(path.join(safeFixture, "opencode.jsonc"), lines([
        "{",
        "  // JSONC comments are allowed by this validator subset.",
        "  \"$schema\": \"https://opencode.ai/config.json\",",
        "  \"permission\": {",
        "    \"*\": \"ask\",",
        "    \"bash\": {",
        "      \"*\": \"ask\",",
        "      \"git status*\": \"allow\",",
        "    },",
        "  },",
        "}",
      ]));
      const safeResult = invokeValidator(safeFixture);
      assertSuccess(safeResult, "Safe broad ask plus narrow allow should pass validation.");
      assertOutputContains(safeResult, "warnings=0", "Safe permission config should emit no validator warnings.");
      assertOutputExcludes(safeResult, "OpenCode permission config", "Safe permission config should not emit permission warnings.");
    },
  },
  {
    name: "validator downgrades top-level permission allow under machineOverride",
    run: () => {
      const fixture = newLibraryFixture("machine-override-top-allow");
      writeText(path.join(fixture, "opencode.jsonc"), lines([
        "{",
        "  \"$schema\": \"https://opencode.ai/config.json\",",
        "  \"machineOverride\": true,",
        "  \"permission\": \"allow\"",
        "}",
      ]));
      const result = invokeValidator(fixture);
      assertSuccess(result, "machineOverride + permission: allow should not warn.");
      assertOutputContains(result, "INFO:", "machineOverride + permission: allow should emit an info note.");
      assertOutputExcludes(result, "WARN: OpenCode permission config uses top-level allow", "machineOverride should not emit a WARN for top-level allow.");
    },
  },
  {
    name: "validator downgrades wildcard permission allow under machineOverride",
    run: () => {
      const fixture = newLibraryFixture("machine-override-wildcard-allow");
      writeText(path.join(fixture, "opencode.jsonc"), lines([
        "{",
        "  \"$schema\": \"https://opencode.ai/config.json\",",
        "  \"machineOverride\": true,",
        "  \"permission\": {",
        "    \"*\": \"allow\",",
        "    \"bash\": {",
        "      \"*\": \"allow\"",
        "    }",
        "  }",
        "}",
      ]));
      const result = invokeValidator(fixture);
      assertSuccess(result, "machineOverride + wildcard permission allow should not warn.");
      assertOutputContains(result, "INFO:", "machineOverride + wildcard allow should emit info notes.");
      assertOutputExcludes(result, "WARN: OpenCode permission config", "machineOverride should not emit WARN for wildcard allow.");
    },
  },
  {
    name: "validator strict mode passes for machineOverride + permission allow",
    run: () => {
      const fixture = newLibraryFixture("machine-override-strict");
      writeText(path.join(fixture, "opencode.jsonc"), lines([
        "{",
        "  \"$schema\": \"https://opencode.ai/config.json\",",
        "  \"machineOverride\": true,",
        "  \"permission\": \"allow\"",
        "}",
      ]));
      const result = invokeProcessCapture("node", [validator, "--root", fixture, "--fail-on-warnings"], root);
      assertSuccess(result, "Strict mode should pass with machineOverride + permission: allow.");
    },
  },
  {
    name: "validator strict mode fails for top-level permission allow without machineOverride",
    run: () => {
      const fixture = newLibraryFixture("permission-allow-no-override-strict");
      writeText(path.join(fixture, "opencode.jsonc"), lines([
        "{",
        "  \"$schema\": \"https://opencode.ai/config.json\",",
        "  \"permission\": \"allow\"",
        "}",
      ]));
      const result = invokeProcessCapture("node", [validator, "--root", fixture, "--fail-on-warnings"], root);
      assertFailure(result, "Strict mode should fail for permission: allow without machineOverride.");
      assertOutputContains(result, "OpenCode permission config uses top-level allow", "Validator should warn about top-level allow when marker is absent.");
    },
  },
  {
    name: "validator strict mode fails for wildcard permission allow without machineOverride",
    run: () => {
      const fixture = newLibraryFixture("permission-wildcard-no-override-strict");
      writeText(path.join(fixture, "opencode.jsonc"), lines([
        "{",
        "  \"$schema\": \"https://opencode.ai/config.json\",",
        "  \"permission\": {",
        "    \"*\": \"allow\",",
        "    \"bash\": {",
        "      \"*\": \"allow\"",
        "    }",
        "  }",
        "}",
      ]));
      const result = invokeProcessCapture("node", [validator, "--root", fixture, "--fail-on-warnings"], root);
      assertFailure(result, "Strict mode should fail for wildcard permission allow without machineOverride.");
    },
  },
  {
    name: "validator reports info count in summary",
    run: () => {
      const fixture = newLibraryFixture("machine-override-summary");
      writeText(path.join(fixture, "opencode.jsonc"), lines([
        "{",
        "  \"$schema\": \"https://opencode.ai/config.json\",",
        "  \"machineOverride\": true,",
        "  \"permission\": \"allow\"",
        "}",
      ]));
      const result = invokeValidator(fixture);
      assertSuccess(result, "machineOverride + permission: allow should pass validation.");
      assertOutputContains(result, "infos=", "Validator summary should report info count.");
    },
  },
  {
    name: "validator rejects unterminated JSONC comments",
    run: () => {
      const fixture = newLibraryFixture("unterminated-jsonc-comment");
      writeText(path.join(fixture, "opencode.jsonc"), lines([
        "{",
        "  \"$schema\": \"https://opencode.ai/config.json\"",
        "}",
        "/* not closed",
      ]));
      const result = invokeValidator(fixture);
      assertFailure(result, "Unterminated JSONC comments should fail validation.");
      assertOutputContains(
        result,
        "Invalid OpenCode config JSON",
        "JSONC failure should name invalid opencode config JSON.",
      );
    },
  },
  {
    name: "validator strict mode rejects warnings",
    run: () => {
      const fixture = newLibraryFixture("strict-warning");
      writeText(path.join(fixture, "global", "skills", "demo-skill", "SKILL.md"), lines([
        "---",
        "name: demo-skill",
        "description: Use when testing a demo reusable skill.",
        "---",
        "",
        "# Demo Skill",
        "",
        "Use this skill when testing strict implementation-language warnings.",
        "",
        "This skill can implement code changes.",
        "",
        "## Output",
        "",
        "Return implementation notes.",
        "",
      ]));
      const result = invokeProcessCapture("node", [validator, "--root", fixture, "--fail-on-warnings"], root);
      assertFailure(result, "Strict validation should reject warning-level drift.");
      assertOutputContains(result, "Warnings are not allowed", "Strict validation should explain warning failures.");
    },
  },
  {
    name: "validator rejects invalid profile contracts",
    run: () => {
      const fixture = newLibraryFixture("invalid-profile-contract");
      writeText(path.join(fixture, "profiles", "standard.json"), lines([
        "{",
        "  \"name\": \"standard\",",
        "  \"description\": \"Broken profile.\",",
        "  \"skills\": [\"missing-skill\"],",
        "  \"agents\": [\"demo-reviewer\"],",
        "  \"validation\": { \"failOnWarnings\": true }",
        "}",
        "",
      ]));
      const result = invokeValidator(fixture);
      assertFailure(result, "Invalid profile references and unsupported fields should fail validation.");
      assertOutputContains(result, "Unsupported profile field 'validation'", "Profile validation should reject unsupported semantic fields.");
      assertOutputContains(result, "Profile references missing skill 'missing-skill'", "Profile validation should reject missing skill refs.");
    },
  },
];
