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
        "- In read-only, no-question, or subagent contexts, return `Blocking Evidence`, `Residual Risks`, or non-authorizing `Follow-up Candidates` instead of asking the user directly.",
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
        "- In read-only, no-question, or subagent contexts, return `Blocking Evidence`, `Residual Risks`, or non-authorizing `Follow-up Candidates` instead of asking the user directly.",
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
        "- In read-only, no-question, or subagent contexts, return `Blocking Evidence`, `Residual Risks`, or non-authorizing `Follow-up Candidates` instead of asking the user directly.",
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
    name: "validator warns when implementation guidance omits happy-path and risk-driven testing",
    run: () => {
      const fixture = newLibraryFixture("missing-risk-driven-guidance");
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
      assertSuccess(result, "Missing risk-driven guidance should remain warning-only.");
      assertOutputContains(result, "WARN:", "Missing risk-driven guidance warning should be visible.");
      assertOutputContains(result, "happy-path-first risk-driven testing guidance", "Warning should identify the missing workflow contract.");
    },
  },
  {
    name: "validator exempts generated OpenSpec skills only from missing risk-driven guidance",
    run: () => {
      const fixture = newLibraryFixture("generated-openspec-risk-guidance-exemption");
      const skillPath = path.join(fixture, ".opencode", "skills", "openspec-generated-fixture", "SKILL.md");
      const generatedSkill = lines([
        "---",
        "name: openspec-generated-fixture",
        "description: Use when testing generated OpenSpec validation.",
        "metadata:",
        "  author: openspec",
        "  generatedBy: \"1.6.0\"",
        "---",
        "",
        "# Generated OpenSpec Fixture",
        "",
        "This skill can implement code changes.",
        "",
        "## Output",
        "",
        "Return implementation notes.",
        "",
      ]);
      writeText(skillPath, generatedSkill);

      const exemptResult = invokeValidator(fixture);
      assertSuccess(exemptResult, "Generated OpenSpec implementation guidance should pass without repository-owned workflow guidance.");
      assertOutputContains(exemptResult, "warnings=0", "Generated OpenSpec implementation guidance should not emit warnings.");
      assertOutputExcludes(exemptResult, "happy-path-first risk-driven testing guidance", "Generated OpenSpec skills should omit only the foreign workflow warning.");

      const nonExemptGeneratedMarkers = [
        {
          name: "body-only generatedBy",
          frontmatter: [],
          body: ["generatedBy: \"1.6.0\"", ""],
        },
        {
          name: "top-level generatedBy",
          frontmatter: ["generatedBy: \"1.6.0\""],
          body: [],
        },
        {
          name: "literal dotted top-level metadata.generatedBy",
          frontmatter: ["metadata.generatedBy: \"1.6.0\""],
          body: [],
        },
        {
          name: "blank metadata.generatedBy",
          frontmatter: ["metadata:", "  generatedBy: \"   \""],
          body: [],
        },
      ];
      for (const markerCase of nonExemptGeneratedMarkers) {
        writeText(skillPath, lines([
          "---",
          "name: openspec-generated-fixture",
          "description: Use when testing generated OpenSpec validation.",
          ...markerCase.frontmatter,
          "---",
          "",
          "# Generated OpenSpec Fixture",
          "",
          ...markerCase.body,
          "This skill can implement code changes.",
          "",
          "## Output",
          "",
          "Return implementation notes.",
          "",
        ]));
        const nonExemptResult = invokeValidator(fixture);
        assertSuccess(nonExemptResult, `${markerCase.name} should remain warning-only.`);
        assertOutputContains(nonExemptResult, "WARN:", `${markerCase.name} should emit a visible warning.`);
        assertOutputContains(nonExemptResult, "happy-path-first risk-driven testing guidance", `${markerCase.name} should not qualify for the generated workflow-warning exemption.`);
      }

      writeText(skillPath, `${generatedSkill}Trailing whitespace remains invalid. \n`);
      const invalidResult = invokeValidator(fixture);
      assertFailure(invalidResult, "Generated OpenSpec skills should remain subject to unrelated Markdown validation.");
      assertOutputContains(invalidResult, "Trailing whitespace:", "Generated OpenSpec skills should retain trailing-whitespace diagnostics.");
      assertOutputExcludes(invalidResult, "happy-path-first risk-driven testing guidance", "Unrelated failures should not restore the exempt workflow warning.");
    },
  },
  {
    name: "validator accepts implementation guidance with observable proof and independent risk discovery",
    run: () => {
      const fixture = newLibraryFixture("compliant-risk-driven-guidance");
      writeText(path.join(fixture, "global", "skills", "demo-skill", "SKILL.md"), lines([
        "---",
        "name: demo-skill",
        "description: Use when testing compliant implementation guidance.",
        "---",
        "",
        "# Demo Skill",
        "",
        "Use this skill when implementing a bounded behavior change.",
        "",
        "This skill can implement code changes.",
        "",
        "Prove the observable happy path, then give a fresh-context testing subagent the original requirements for risk discovery, negative tests, and hardening.",
        "",
        "## Output",
        "",
        "Return implementation and validation evidence.",
        "",
      ]));
      const result = invokeValidator(fixture);
      assertSuccess(result, "Compliant risk-driven implementation guidance should pass.");
      assertOutputContains(result, "warnings=0", "Compliant implementation guidance should not warn.");
    },
  },
  {
    name: "validator rejects stale test ordering even when current happy-path guidance is present",
    run: () => {
      const fixture = newLibraryFixture("mixed-current-and-stale-test-ordering");
      writeText(path.join(fixture, "global", "skills", "demo-skill", "SKILL.md"), lines([
        "---",
        "name: demo-skill",
        "description: Use when checking mixed workflow guidance.",
        "---",
        "",
        "# Demo Skill",
        "",
        "Use this skill when implementing a bounded behavior change.",
        "",
        "Implement and observably prove the smallest complete happy path, then delegate risk discovery to a fresh-context testing subagent.",
        "Automated tests are authored before implementation begins.",
        "",
        "## Output",
        "",
        "Return implementation and validation evidence.",
        "",
      ]));
      const result = invokeValidator(fixture);
      assertFailure(result, "Current happy-path language must not mask stale automated-test ordering.");
      assertOutputContains(result, "requires automated test work before observable happy-path proof", "Diagnostic should identify the unsafe ordering rather than a generic workflow warning.");
    },
  },
  ...[
    "global/AGENTS.md",
    "templates/project/AGENTS.md",
  ].map((relativePath): TestCase => ({
    name: `validator rejects stale automated-test ordering in ${relativePath}`,
    run: () => {
      const fixture = newLibraryFixture(`stale-order-${relativePath.replace(/[^a-z0-9]+/gi, "-")}`);
      const file = path.join(fixture, ...relativePath.split("/"));
      const existing = fs.existsSync(file) ? fs.readFileSync(file, "utf8") : "# Agent Instructions\n\nFollow the Universal Development Loop and prove the observable happy path.\n";
      writeText(file, `${existing}\nAutomated test scenarios are authored before implementation begins.\n`);
      const result = invokeValidator(fixture);
      assertFailure(result, `Stale automated-test ordering in ${relativePath} must fail validation.`);
      assertOutputContains(result, "requires automated test work before observable happy-path proof", `Diagnostic should identify stale ordering in ${relativePath}.`);
    },
  })),
  ...[
    "global/AGENTS.md",
    "templates/project/AGENTS.md",
  ].map((relativePath): TestCase => ({
    name: `validator accepts a superseding negative explanation in ${relativePath}`,
    run: () => {
      const fixture = newLibraryFixture(`superseded-order-${relativePath.replace(/[^a-z0-9]+/gi, "-")}`);
      const file = path.join(fixture, ...relativePath.split("/"));
      const existing = fs.existsSync(file) ? fs.readFileSync(file, "utf8") : "# Agent Instructions\n\nFollow the Universal Development Loop and prove the observable happy path.\n";
      writeText(file, `${existing}\nThe old rule \"automated tests are authored before implementation\" is superseded and must not be followed.\n`);
      const result = invokeValidator(fixture);
      assertSuccess(result, `A clearly superseded negative explanation in ${relativePath} must not fail validation.`);
      assertOutputExcludes(result, "requires automated test work before observable happy-path proof", `Superseding language in ${relativePath} must not trigger stale-order diagnostics.`);
    },
  })),
  {
    name: "validator rejects prohibitive wording that still requires stale test ordering",
    run: () => {
      const fixture = newLibraryFixture("prohibitive-active-stale-order");
      const file = path.join(fixture, "global", "AGENTS.md");
      writeText(file, lines([
        "# Agent Instructions",
        "",
        "Follow the Universal Development Loop and prove the observable happy path.",
        "Do not proceed until automated tests are authored before implementation.",
        "",
      ]));
      const result = invokeValidator(fixture);
      assertFailure(result, "A prohibition on proceeding still actively requires stale test ordering.");
      assertOutputContains(result, "requires automated test work before observable happy-path proof", "Broad negation must not exempt an active ordering requirement.");
    },
  },
  ...[
    {
      fixtureName: "semicolon-separated-historical-bypass",
      sentence: "Historical context is documented; automated tests are authored before implementation.",
    },
    {
      fixtureName: "comma-separated-historical-bypass",
      sentence: "Historical context is documented, automated tests are authored before implementation.",
    },
    {
      fixtureName: "contrast-separated-historical-bypass",
      sentence: "This guidance is historical but automated tests are authored before implementation.",
    },
  ].map(({ fixtureName, sentence }): TestCase => ({
    name: `validator rejects detached historical-context bypass: ${fixtureName}`,
    run: () => {
      const fixture = newLibraryFixture(fixtureName);
      const file = path.join(fixture, "global", "AGENTS.md");
      writeText(file, lines(["# Agent Instructions", "", "Follow the Universal Development Loop and prove the observable happy path.", sentence, ""]));
      const result = invokeValidator(fixture);
      assertFailure(result, "Historical language in a separate clause must not exempt an active stale-order requirement.");
      assertOutputContains(result, "requires automated test work before observable happy-path proof", "Clause-local supersession must preserve the active stale-order diagnostic.");
    },
  })),
  ...[
    {
      fixtureName: "historical-stale-order-explanation",
      sentence: "Historical note: automated tests were authored before implementation in the retired workflow.",
    },
    {
      fixtureName: "inactive-stale-order-explanation",
      sentence: "Automated tests authored before implementation is not an active rule.",
    },
    {
      fixtureName: "direct-historical-superseded-explanation",
      sentence: "The historical rule \"automated tests are authored before implementation\" is superseded and must not be followed.",
    },
  ].map(({ fixtureName, sentence }): TestCase => ({
    name: `validator accepts explicit safe stale-order explanation: ${fixtureName}`,
    run: () => {
      const fixture = newLibraryFixture(fixtureName);
      const file = path.join(fixture, "global", "AGENTS.md");
      writeText(file, lines([
        "# Agent Instructions",
        "",
        "Follow the Universal Development Loop and prove the observable happy path.",
        sentence,
        "",
      ]));
      const result = invokeValidator(fixture);
      assertSuccess(result, "Explicit historical or inactive-rule language must not fail validation.");
      assertOutputExcludes(result, "requires automated test work before observable happy-path proof", "Explicit safe explanatory predicates must suppress only their own stale-order match.");
    },
  })),
  {
    name: "validator accepts neutral implementation discussion in a read-only reviewer",
    run: () => {
      const fixture = newLibraryFixture("read-only-reviewer-language");
      const reviewerPath = path.join(fixture, "global", "agents", "demo-reviewer.md");
      const reviewer = fs.readFileSync(reviewerPath, "utf8");
      writeText(reviewerPath, `${reviewer}\nThis read-only reviewer evaluates implementation choices and reports evidence without changing files.\n`);
      const result = invokeValidator(fixture);
      assertSuccess(result, "Neutral implementation discussion in a read-only reviewer should pass.");
      assertOutputContains(result, "warnings=0", "Neutral read-only reviewer language should not emit implementation workflow warnings.");
      assertOutputExcludes(result, "requires automated test work before observable happy-path proof", "Neutral reviewer discussion must not trigger stale-order diagnostics.");
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
  ...[
    "opencode.json",
    path.join("nested", "opencode.jsonc"),
    path.join("global", "opencode.json"),
  ].map((relativeConfig): TestCase => ({
    name: `validator rejects unsupported machineOverride in ${relativeConfig}`,
    run: () => {
      const fixture = newLibraryFixture(`unsupported-marker-${relativeConfig.replace(/[^a-z0-9]+/gi, "-")}`);
      writeText(path.join(fixture, relativeConfig), lines([
        "{",
        "  \"$schema\": \"https://opencode.ai/config.json\",",
        "  \"machineOverride\": true",
        "}",
      ]));
      const result = invokeValidator(fixture);
      assertFailure(result, "Unsupported OpenCode fields must fail validation in every config layer.");
      assertOutputContains(result, "Unsupported OpenCode config field 'machineOverride'", "Diagnostic should name the unsupported field.");
      assertOutputContains(result, "can prevent OpenCode startup", "Diagnostic should explain the user-visible startup risk.");
    },
  })),
  {
    name: "validator reports broad permission in global/opencode.json as info and passes strict mode",
    run: () => {
      const fixture = newLibraryFixture("machine-local-permission-info");
      writeText(path.join(fixture, "global", "opencode.json"), lines([
        "{",
        "  \"$schema\": \"https://opencode.ai/config.json\",",
        "  \"permission\": {",
        "    \"*\": \"allow\",",
        "    \"bash\": { \"*\": \"allow\" }",
        "  }",
        "}",
      ]));
      const result = invokeProcessCapture("node", [validator, "--root", fixture, "--fail-on-warnings"], root);
      assertSuccess(result, "Strict mode should accept informational diagnostics for the path-defined machine-local layer.");
      assertOutputContains(result, "INFO: OpenCode permission config", "Machine-local broad permissions should remain visible as info.");
      assertOutputContains(result, "warnings=0", "Machine-local broad permissions must not become strict-mode warnings.");
      assertOutputContains(result, "infos=2", "Both realistic broad permission risks should be counted as informational diagnostics.");
      assertOutputExcludes(result, "WARN: OpenCode permission config", "Machine-local permission diagnostics must not be warnings.");
    },
  },
  {
    name: "validator treats nested/global/opencode.json as a workspace warning in strict mode",
    run: () => {
      const fixture = newLibraryFixture("nested-global-permission-strict");
      writeText(path.join(fixture, "nested", "global", "opencode.json"), lines([
        "{",
        "  \"$schema\": \"https://opencode.ai/config.json\",",
        "  \"permission\": \"allow\"",
        "}",
      ]));
      const result = invokeProcessCapture("node", [validator, "--root", fixture, "--fail-on-warnings"], root);
      assertFailure(result, "A near-miss nested global path must not receive machine-local INFO treatment.");
      assertOutputContains(result, "WARN: OpenCode permission config uses top-level allow", "Nested global config should retain workspace warning severity.");
      assertOutputContains(result, "Warnings are not allowed", "Strict mode should fail on the near-miss path warning.");
      assertOutputExcludes(result, "INFO: OpenCode permission config uses top-level allow", "Near-miss path must not be downgraded to INFO.");
    },
  },
  {
    name: "validator strict mode fails for broad permission in workspace opencode.json",
    run: () => {
      const fixture = newLibraryFixture("workspace-permission-strict");
      writeText(path.join(fixture, "opencode.json"), lines([
        "{",
        "  \"$schema\": \"https://opencode.ai/config.json\",",
        "  \"permission\": \"allow\"",
        "}",
      ]));
      const result = invokeProcessCapture("node", [validator, "--root", fixture, "--fail-on-warnings"], root);
      assertFailure(result, "Strict mode should reject broad workspace permissions.");
      assertOutputContains(result, "WARN: OpenCode permission config uses top-level allow", "Workspace diagnostic should remain a warning.");
      assertOutputContains(result, "Warnings are not allowed", "Strict-mode failure should explain the gate.");
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
