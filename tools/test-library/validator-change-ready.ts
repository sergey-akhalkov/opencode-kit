import fs from "node:fs";
import path from "node:path";
import {
  addRegisteredReviewerFixture,
  appendReadmeAgentCatalogEntry,
  assertEqual,
  assertFailure,
  assertOutputContains,
  assertSuccess,
  invokeValidator,
  newLibraryFixture,
  invokeInitProject,
  newTempDir,
  sessionDeliveryBindingText,
  type TestCase,
  writeText,
  libraryRoot,
} from "../test-helpers/library.ts";

const root = libraryRoot;

const materialDeliveryRoutingText = "For Material work, always run the discovered conforming delivery/readiness gate with current requirements and evidence; missing conforming capability blocks. Material Change-Ready requires an explicitly accepted conforming delivery result. Small uses proportional evidence and invokes that gate only when project policy, risk, or the owner requires it.";

function addChangeReadySdlcFixture(fixture: string): void {
  writeText(path.join(fixture, "global", "AGENTS.md"), fs.readFileSync(path.join(root, "global", "AGENTS.md"), "utf8"));
  writeText(path.join(fixture, "global", "skills", "change-ready-sdlc", "SKILL.md"), fs.readFileSync(path.join(root, "global", "skills", "change-ready-sdlc", "SKILL.md"), "utf8"));
  for (const agent of ["implementation-worker", "sdet-quality-engineer", "final-candidate-reviewer", "session-delivery-reviewer"] as const) {
    writeText(path.join(fixture, "global", "agents", `${agent}.md`), fs.readFileSync(path.join(root, "global", "agents", `${agent}.md`), "utf8"));
  }

  writeText(path.join(fixture, "profiles", "all.json"), `{
  "name": "all",
  "description": "Fixture all profile.",
  "skills": ["change-ready-sdlc", "complain", "demo-skill"],
  "agents": ["demo-reviewer", "final-candidate-reviewer", "implementation-worker", "session-delivery-reviewer", "sdet-quality-engineer"]
}
`);

  const readmePath = path.join(fixture, "README.md");
  const readme = fs.readFileSync(readmePath, "utf8")
    .replace("- Demo work -> `demo-skill`.", "- Demo work -> `demo-skill`.\n- Behavior-changing work -> load `change-ready-sdlc` before mutation.\n- Production-only slices -> `implementation-worker`; post-proof test evidence -> `sdet-quality-engineer`; final review -> `final-candidate-reviewer`.")
    .replace("- `demo-skill`: Demo skill.", "- `change-ready-sdlc`: Portable Change-Ready orchestration topology.\n- `demo-skill`: Demo skill.")
    .replace("- `demo-reviewer`: Demo reviewer.", "- `demo-reviewer`: Demo reviewer.\n- `final-candidate-reviewer`: Final candidate reviewer.\n- `implementation-worker`: Production-only implementation worker.\n- `session-delivery-reviewer`: Session delivery reviewer.\n- `sdet-quality-engineer`: Test-only SDET quality engineer.")
    .replace("- `universal-development-loop.md`: Universal loop.", "- `reusable-project-agent-instructions.md`: Reusable project instructions.\n- `universal-development-loop.md`: Universal loop.");
  writeText(readmePath, readme);

  for (const relative of ["REPO_AGENTS.md", path.join("templates", "project", "AGENTS.md")]) {
    const file = path.join(fixture, relative);
    writeText(file, `${fs.readFileSync(file, "utf8")}\n- Use \`implementation-worker\` only for production-only bounded implementation slices with exact non-overlapping write scope and the complete Universal Task Briefing Contract; post-proof automated-test evidence routes to \`sdet-quality-engineer\`.\n- When delegating to \`implementation-worker\`, include Acceptance Criteria and Verification in the Universal Task Briefing Contract.\n`);
  }

  writeText(
    path.join(fixture, "instructions", "reusable-project-agent-instructions.md"),
    fs.readFileSync(path.join(root, "instructions", "reusable-project-agent-instructions.md"), "utf8"),
  );
  for (const relative of ["REPO_AGENTS.md", path.join("instructions", "universal-development-loop.md"), path.join("templates", "project", "AGENTS.md")]) {
    const file = path.join(fixture, relative);
    writeText(file, `${fs.readFileSync(file, "utf8")}\n${sessionDeliveryBindingText}\n${materialDeliveryRoutingText}\n`);
  }
}

function replaceRequiredText(filePath: string, original: string, replacement: string): void {
  const text = fs.readFileSync(filePath, "utf8");
  if (!text.includes(original)) {
    throw new Error(`Fixture file did not contain expected text: ${original}`);
  }
  writeText(filePath, text.replaceAll(original, replacement));
}

function assertSingleContractReferenceCardinalityError(result: { output: string }, fileName: string): void {
  const errors = result.output.split(/\r?\n/).filter((line) => line.startsWith("ERROR: "));
  assertEqual(errors.length, 1, `Duplicate Contract Reference fixture should emit exactly one error for ${fileName}.`);
  if (!errors[0]!.includes("Reusable reviewer agent must contain exactly one ## Contract Reference heading")) {
    throw new Error(`Duplicate Contract Reference fixture emitted the wrong diagnostic for ${fileName}:\n${errors[0]}`);
  }
  if (!errors[0]!.includes(fileName)) {
    throw new Error(`Duplicate Contract Reference diagnostic must identify ${fileName}:\n${errors[0]}`);
  }
}

export const changeReadyValidatorTests: TestCase[] = [
  {
    name: "validator accepts exact standalone Contract Reference for a registered reviewer",
    run: () => {
      const fixture = newLibraryFixture("registered-reviewer-standalone-reference");
      addRegisteredReviewerFixture(fixture, "code-quality-reviewer");
      assertSuccess(invokeValidator(fixture), "Exact standalone registered-reviewer Contract Reference should pass validation.");
    },
  },
  {
    name: "validator rejects verbose Contract Reference for a registered reviewer",
    run: () => {
      const fixture = newLibraryFixture("registered-reviewer-verbose-reference");
      const reviewerPath = addRegisteredReviewerFixture(fixture, "code-quality-reviewer");
      replaceRequiredText(
        reviewerPath,
        "`instructions/leaf-reviewer-agent-contract.md`",
        "This reviewer follows the shared contract at `instructions/leaf-reviewer-agent-contract.md`.",
      );
      const result = invokeValidator(fixture);
      assertFailure(result, "Verbose registered-reviewer Contract Reference should fail validation.");
      assertOutputContains(result, "no verbose explanatory sentence", "Diagnostic should reject explanatory Contract Reference prose.");
      assertOutputContains(result, "code-quality-reviewer.md", "Diagnostic should identify the registered reviewer.");
    },
  },
  {
    name: "validator rejects trailing Contract Reference content hidden after an extra blank line",
    run: () => {
      const fixture = newLibraryFixture("registered-reviewer-reference-extra-blank");
      const reviewerPath = addRegisteredReviewerFixture(fixture, "code-quality-reviewer");
      replaceRequiredText(
        reviewerPath,
        "`instructions/leaf-reviewer-agent-contract.md`",
        "`instructions/leaf-reviewer-agent-contract.md`\n\n\nUnexpected explanatory content.",
      );
      const result = invokeValidator(fixture);
      assertFailure(result, "Trailing Contract Reference content after an extra blank line should fail validation.");
      assertOutputContains(result, "next ## heading or EOF", "Diagnostic should enforce exact Contract Reference termination.");
      assertOutputContains(result, "code-quality-reviewer.md", "Diagnostic should identify the registered reviewer.");
    },
  },
  {
    name: "validator rejects duplicate valid Contract Reference headings before shape validation",
    run: () => {
      const fixture = newLibraryFixture("registered-reviewer-duplicate-valid-reference");
      const reviewerPath = addRegisteredReviewerFixture(fixture, "code-quality-reviewer");
      writeText(
        reviewerPath,
        `${fs.readFileSync(reviewerPath, "utf8")}\n## Contract Reference\n\n\`instructions/leaf-reviewer-agent-contract.md\`\n`,
      );
      const result = invokeValidator(fixture);
      assertFailure(result, "Duplicate valid registered-reviewer Contract Reference headings should fail validation.");
      assertSingleContractReferenceCardinalityError(result, "code-quality-reviewer.md");
    },
  },
  {
    name: "validator rejects a registered reviewer with zero Contract Reference headings",
    run: () => {
      const fixture = newLibraryFixture("registered-reviewer-zero-reference");
      const reviewerPath = addRegisteredReviewerFixture(fixture, "code-quality-reviewer");
      const reviewer = fs.readFileSync(reviewerPath, "utf8");
      writeText(
        reviewerPath,
        reviewer.replace(/^## Contract Reference\r?\n\r?\n`instructions\/leaf-reviewer-agent-contract\.md`\r?\n\r?\n/m, ""),
      );
      const result = invokeValidator(fixture);
      assertFailure(result, "A registered reviewer without a Contract Reference heading should fail validation.");
      assertOutputContains(result, "Reusable reviewer agent must contain exactly one ## Contract Reference heading", "Diagnostic should identify zero heading cardinality.");
      assertOutputContains(result, "code-quality-reviewer.md", "Zero-heading diagnostic should identify the registered reviewer.");
    },
  },
  {
    name: "validator accepts Change-Ready SDLC topology fixture",
    run: () => {
      const fixture = newLibraryFixture("change-ready-sdlc-valid");
      addChangeReadySdlcFixture(fixture);
      assertSuccess(invokeValidator(fixture), "Complete Change-Ready SDLC topology fixture should pass validation.");
    },
  },
  {
    name: "project bootstrap copies the current Change-Ready routing into a separate repository",
    run: () => {
      const target = newTempDir("change-ready-project-bootstrap");
      const result = invokeInitProject(["--target", target, "--mode", "write"]);
      assertSuccess(result, "Project bootstrap should copy the current project instruction template.");
      const source = fs.readFileSync(path.join(root, "templates", "project", "AGENTS.md"));
      const bootstrapped = fs.readFileSync(path.join(target, "AGENTS.md"));
      if (!bootstrapped.equals(source)) {
        throw new Error("Bootstrapped AGENTS.md must be byte-equivalent to the current project template.");
      }
      const text = bootstrapped.toString("utf8");
      for (const token of ["production author", "After applicable proof", "fresh discovered conforming SDET session", "`sdet-quality-engineer` is the optional default SDET adapter only", "Missing active global `AGENTS.md` or `change-ready-sdlc` blocks", "unresolved validation procedures must be discovered before qualification", "For Material work, always run", "missing conforming capability blocks"]) {
        if (!text.includes(token)) throw new Error(`Bootstrapped AGENTS.md missing Change-Ready routing token: ${token}`);
      }
      if (fs.existsSync(path.join(target, "instructions", "universal-development-loop.md"))) {
        throw new Error("Project bootstrap must not create a target-relative Universal Development Loop dependency.");
      }
    },
  },
  ...[
    {
      name: "UDL",
      fixtureName: "change-ready-sdlc-udl-missing-material-routing",
      relative: path.join("instructions", "universal-development-loop.md"),
      token: "explicitly accepted conforming delivery result",
    },
    {
      name: "project template",
      fixtureName: "change-ready-sdlc-template-missing-material-routing",
      relative: path.join("templates", "project", "AGENTS.md"),
      token: "Small uses proportional evidence and invokes that gate only when project policy, risk, or the owner requires it",
    },
  ].map((testCase): TestCase => ({
    name: `validator rejects ${testCase.name} missing a Material delivery routing token`,
    run: () => {
      const fixture = newLibraryFixture(testCase.fixtureName);
      addChangeReadySdlcFixture(fixture);
      const file = path.join(fixture, testCase.relative);
      replaceRequiredText(
        file,
        testCase.token,
        "Small delivery routing is conditional",
      );
      const result = invokeValidator(fixture);
      assertFailure(result, `${testCase.name} missing a Material delivery routing token should fail validation.`);
      assertOutputContains(result, "Material delivery routing", "Diagnostic should identify the Material delivery routing contract.");
      assertOutputContains(result, testCase.relative, `Diagnostic should identify the affected ${testCase.name} surface.`);
    },
  })),
  {
    name: "validator rejects Small behavior-changing direct-main production routing",
    run: () => {
      const fixture = newLibraryFixture("change-ready-sdlc-small-direct-main");
      addChangeReadySdlcFixture(fixture);
      const agentsPath = path.join(fixture, "templates", "project", "AGENTS.md");
      writeText(
        agentsPath,
        `${fs.readFileSync(agentsPath, "utf8")}\n- Small behavior-changing production work may be implemented directly by the main session when the change is local and reversible.\n`,
      );
      const result = invokeValidator(fixture);
      assertFailure(result, "Small behavior-changing direct-main production routing must fail validation.");
      assertOutputContains(
        result,
        "unsafe direct main-session behavior-changing production routing",
        "Diagnostic should identify the forbidden direct-main production route.",
      );
      assertOutputContains(
        result,
        path.join("templates", "project", "AGENTS.md"),
        "Diagnostic should identify the affected project template.",
      );
    },
  },
  {
    name: "validator rejects unavailable implementation worker fallback to main production editing",
    run: () => {
      const fixture = newLibraryFixture("change-ready-sdlc-unavailable-worker-main-fallback");
      addChangeReadySdlcFixture(fixture);
      const agentsPath = path.join(fixture, "REPO_AGENTS.md");
      writeText(
        agentsPath,
        `${fs.readFileSync(agentsPath, "utf8")}\n- If \`implementation-worker\` is unavailable, the main session may edit behavior-changing production directly to avoid blocking.\n`,
      );
      const result = invokeValidator(fixture);
      assertFailure(result, "Unavailable implementation-worker fallback to main production editing must fail validation.");
      assertOutputContains(
        result,
        "unsafe unavailable-worker main-session production fallback",
        "Diagnostic should identify the forbidden unavailable-worker fallback.",
      );
      assertOutputContains(result, "REPO_AGENTS.md", "Diagnostic should identify the affected repository instructions.");
    },
  },
  {
    name: "validator rejects Change-Ready skill missing a D13 lifecycle marker",
    run: () => {
      const fixture = newLibraryFixture("change-ready-sdlc-missing-marker");
      addChangeReadySdlcFixture(fixture);
      const skillPath = path.join(fixture, "global", "skills", "change-ready-sdlc", "SKILL.md");
      replaceRequiredText(skillPath, "SDET Provisional Report", "SDET provisional handoff");
      const result = invokeValidator(fixture);
      assertFailure(result, "Missing D13 lifecycle marker should fail validation.");
      assertOutputContains(result, "SDET Provisional Report", "Diagnostic should name the missing lifecycle marker.");
      assertOutputContains(result, "change-ready-sdlc", "Diagnostic should name the canonical skill.");
    },
  },
  {
    name: "validator rejects portable hardcode tokens in the canonical Change-Ready skill",
    run: () => {
      const fixture = newLibraryFixture("change-ready-sdlc-hardcode-token");
      addChangeReadySdlcFixture(fixture);
      const skillPath = path.join(fixture, "global", "skills", "change-ready-sdlc", "SKILL.md");
      writeText(skillPath, `${fs.readFileSync(skillPath, "utf8")}\nDo not add npm defaults here.\n`);
      const result = invokeValidator(fixture);
      assertFailure(result, "Portable hardcode token should fail validation.");
      assertOutputContains(result, "forbidden portable-hardcode token 'npm '", "Diagnostic should name the forbidden token.");
      assertOutputContains(result, "change-ready-sdlc", "Diagnostic should name the canonical skill file.");
    },
  },
  {
    name: "validator allows five duplicate lifecycle markers outside the canonical skill",
    run: () => {
      const fixture = newLibraryFixture("change-ready-sdlc-duplicate-marker-below-threshold");
      addChangeReadySdlcFixture(fixture);
      const reviewerPath = path.join(fixture, "global", "agents", "demo-reviewer.md");
      writeText(reviewerPath, `${fs.readFileSync(reviewerPath, "utf8")}\nAdapter Discovery\nProfile: Small | Material\nAuthoritative Brief\nApplicable Proof\nSDET Provisional Report\n`);
      assertSuccess(invokeValidator(fixture), "Five exact lifecycle markers should remain below the D13 duplicate threshold.");
    },
  },
  {
    name: "validator rejects six duplicate lifecycle markers outside the canonical skill",
    run: () => {
      const fixture = newLibraryFixture("change-ready-sdlc-duplicate-marker-threshold");
      addChangeReadySdlcFixture(fixture);
      const reviewerPath = path.join(fixture, "global", "agents", "demo-reviewer.md");
      writeText(reviewerPath, `${fs.readFileSync(reviewerPath, "utf8")}\nAdapter Discovery\nProfile: Small | Material\nAuthoritative Brief\nApplicable Proof\nSDET Provisional Report\nCandidate Freeze\n`);
      const result = invokeValidator(fixture);
      assertFailure(result, "Six exact lifecycle markers should fail the duplicate-orchestration drift check.");
      assertOutputContains(result, "global/agents/demo-reviewer.md", "Diagnostic should name the duplicate-marker file.");
      assertOutputContains(result, "threshold >=6", "Diagnostic should state the exact D13 threshold.");
    },
  },
  {
    name: "validator rejects missing global AGENTS pre-mutation trigger token",
    run: () => {
      const fixture = newLibraryFixture("change-ready-sdlc-missing-trigger");
      addChangeReadySdlcFixture(fixture);
      const agentsPath = path.join(fixture, "global", "AGENTS.md");
      replaceRequiredText(agentsPath, "Before the first mutation", "Before editing");
      const result = invokeValidator(fixture);
      assertFailure(result, "Missing mandatory trigger token should fail validation.");
      assertOutputContains(result, "global AGENTS Change-Ready trigger", "Diagnostic should name the trigger contract.");
      assertOutputContains(result, "Before the first mutation", "Diagnostic should name the missing trigger token.");
    },
  },
  {
    name: "validator rejects missing lifecycle role route in global AGENTS",
    run: () => {
      const fixture = newLibraryFixture("change-ready-sdlc-missing-role-route");
      addChangeReadySdlcFixture(fixture);
      const agentsPath = path.join(fixture, "global", "AGENTS.md");
      replaceRequiredText(agentsPath, "final-candidate-reviewer", "final candidate reviewer");
      const result = invokeValidator(fixture);
      assertFailure(result, "Missing final-review role route should fail validation.");
      assertOutputContains(result, "global AGENTS lifecycle role route", "Diagnostic should name the role-route contract.");
      assertOutputContains(result, "final-candidate-reviewer", "Diagnostic should name the missing route.");
    },
  },
  {
    name: "validator rejects Change-Ready skill missing a D15 continuation token",
    run: () => {
      const fixture = newLibraryFixture("change-ready-sdlc-missing-continuation-token");
      addChangeReadySdlcFixture(fixture);
      const skillPath = path.join(fixture, "global", "skills", "change-ready-sdlc", "SKILL.md");
      replaceRequiredText(skillPath, "same production-author context", "same production author context");
      const result = invokeValidator(fixture);
      assertFailure(result, "Missing D15 continuation token in canonical skill should fail validation.");
      assertOutputContains(result, "change-ready-sdlc missing continuation token 'same production-author context'", "Diagnostic should name the missing canonical skill continuation token.");
      assertOutputContains(result, path.join("global", "skills", "change-ready-sdlc", "SKILL.md"), "Diagnostic should name the canonical skill artifact path.");
    },
  },
  {
    name: "validator rejects Change-Ready skill missing universal writer attempt closure",
    run: () => {
      const fixture = newLibraryFixture("change-ready-sdlc-missing-universal-writer-closure");
      addChangeReadySdlcFixture(fixture);
      const skillPath = path.join(fixture, "global", "skills", "change-ready-sdlc", "SKILL.md");
      replaceRequiredText(skillPath, "Universal writer attempt closure", "General writer attempt closure");
      const result = invokeValidator(fixture);
      assertFailure(result, "Missing universal writer attempt closure should fail validation.");
      assertOutputContains(result, "change-ready-sdlc missing continuation token 'Universal writer attempt closure'", "Diagnostic should name the missing universal writer closure token.");
      assertOutputContains(result, path.join("global", "skills", "change-ready-sdlc", "SKILL.md"), "Diagnostic should identify the canonical skill artifact.");
    },
  },
  {
    name: "validator rejects Change-Ready skill missing the partial fan-out integration barrier",
    run: () => {
      const fixture = newLibraryFixture("change-ready-sdlc-missing-partial-fanout-barrier");
      addChangeReadySdlcFixture(fixture);
      const skillPath = path.join(fixture, "global", "skills", "change-ready-sdlc", "SKILL.md");
      replaceRequiredText(skillPath, "do not freeze, prove, or qualify", "do not continue qualification");
      const result = invokeValidator(fixture);
      assertFailure(result, "Missing partial fan-out integration barrier should fail validation.");
      assertOutputContains(result, "change-ready-sdlc missing continuation token 'do not freeze, prove, or qualify'", "Diagnostic should name the missing partial fan-out barrier token.");
      assertOutputContains(result, path.join("global", "skills", "change-ready-sdlc", "SKILL.md"), "Diagnostic should name the canonical skill artifact path.");
    },
  },
  {
    name: "validator rejects Change-Ready skill missing quiescence isolation closure text",
    run: () => {
      const fixture = newLibraryFixture("change-ready-sdlc-missing-isolation-closure");
      addChangeReadySdlcFixture(fixture);
      const skillPath = path.join(fixture, "global", "skills", "change-ready-sdlc", "SKILL.md");
      replaceRequiredText(skillPath, "workspace/write authority is isolated or revoked", "workspace/write authority is unavailable");
      const result = invokeValidator(fixture);
      assertFailure(result, "Missing quiescence isolation closure text should fail validation.");
      assertOutputContains(result, "change-ready-sdlc missing continuation token 'workspace/write authority is isolated or revoked'", "Diagnostic should name the missing isolation closure token.");
      assertOutputContains(result, path.join("global", "skills", "change-ready-sdlc", "SKILL.md"), "Diagnostic should name the canonical skill artifact path.");
    },
  },
  {
    name: "validator rejects global AGENTS missing a D15 fan-out identity token",
    run: () => {
      const fixture = newLibraryFixture("change-ready-sdlc-missing-global-fanout-identity-token");
      addChangeReadySdlcFixture(fixture);
      const agentsPath = path.join(fixture, "global", "AGENTS.md");
      replaceRequiredText(agentsPath, "runtime session/task identity", "runtime identity");
      const result = invokeValidator(fixture);
      assertFailure(result, "Missing D15 fan-out identity token in global AGENTS should fail validation.");
      assertOutputContains(result, "global AGENTS fan-out and specialist continuation", "Diagnostic should name the global AGENTS fan-out contract.");
      assertOutputContains(result, "runtime session/task identity", "Diagnostic should name the missing fan-out identity token.");
      assertOutputContains(result, path.join("global", "AGENTS.md"), "Diagnostic should name the global AGENTS artifact path.");
    },
  },
  ...[
    {
      fixture: "missing-proven-terminal-cessation",
      relative: path.join("global", "skills", "change-ready-sdlc", "SKILL.md"),
      original: "adapter-proven terminal cessation",
      replacement: "termination confirmation",
      diagnostic: "change-ready-sdlc missing continuation token",
    },
    {
      fixture: "missing-primary-parent-identity",
      relative: path.join("global", "skills", "change-ready-sdlc", "SKILL.md"),
      original: "active primary parent identity",
      replacement: "primary identity",
      diagnostic: "change-ready-sdlc missing continuation token",
    },
    {
      fixture: "missing-default-primary-rejection",
      relative: path.join("global", "AGENTS.md"),
      original: "Top-level/default-primary fallback is not specialist evidence",
      replacement: "Fallback is discouraged",
      diagnostic: "global AGENTS fan-out and specialist continuation",
    },
    {
      fixture: "worker-singular-continuation-identity",
      relative: path.join("global", "agents", "implementation-worker.md"),
      original: "exact current Semantic Candidate Identity, Package Identity, and Identity Recipe",
      replacement: "current candidate identity",
      diagnostic: "implementation-worker same-slice continuation",
    },
  ].map((testCase): TestCase => ({
    name: `validator rejects corrected runtime contract drift: ${testCase.fixture}`,
    run: () => {
      const fixture = newLibraryFixture(`change-ready-${testCase.fixture}`);
      addChangeReadySdlcFixture(fixture);
      const file = path.join(fixture, testCase.relative);
      replaceRequiredText(file, testCase.original, testCase.replacement);
      const result = invokeValidator(fixture);
      assertFailure(result, `Runtime contract drift must fail validation: ${testCase.original}`);
      assertOutputContains(result, testCase.diagnostic, "Diagnostic should name the affected runtime contract.");
      assertOutputContains(result, testCase.original, "Diagnostic should name the missing corrected token.");
      assertOutputContains(result, testCase.relative, "Diagnostic should identify the affected artifact.");
    },
  })),
  {
    name: "validator rejects global AGENTS missing the partial fan-out integration barrier",
    run: () => {
      const fixture = newLibraryFixture("change-ready-sdlc-missing-global-partial-fanout-barrier");
      addChangeReadySdlcFixture(fixture);
      const agentsPath = path.join(fixture, "global", "AGENTS.md");
      replaceRequiredText(agentsPath, "do not freeze, prove, or qualify", "do not continue qualification");
      const result = invokeValidator(fixture);
      assertFailure(result, "Missing global partial fan-out integration barrier should fail validation.");
      assertOutputContains(result, "global AGENTS fan-out and specialist continuation", "Diagnostic should name the global AGENTS fan-out contract.");
      assertOutputContains(result, "do not freeze, prove, or qualify", "Diagnostic should name the missing partial fan-out barrier token.");
      assertOutputContains(result, path.join("global", "AGENTS.md"), "Diagnostic should name the global AGENTS artifact path.");
    },
  },
  {
    name: "validator rejects implementation worker missing a same-slice continuation token",
    run: () => {
      const fixture = newLibraryFixture("implementation-worker-missing-continuation-token");
      addChangeReadySdlcFixture(fixture);
      const workerPath = path.join(fixture, "global", "agents", "implementation-worker.md");
      replaceRequiredText(workerPath, "prior Applicable Proof", "previous Applicable Proof");
      const result = invokeValidator(fixture);
      assertFailure(result, "Missing implementation-worker same-slice continuation token should fail validation.");
      assertOutputContains(result, "implementation-worker same-slice continuation", "Diagnostic should name the implementation-worker continuation contract.");
      assertOutputContains(result, "prior Applicable Proof", "Diagnostic should name the missing implementation-worker continuation token.");
      assertOutputContains(result, path.join("global", "agents", "implementation-worker.md"), "Diagnostic should name the implementation-worker artifact path.");
    },
  },
  {
    name: "validator rejects implementation worker missing objective-continuity continuation text",
    run: () => {
      const fixture = newLibraryFixture("implementation-worker-missing-objective-continuity");
      addChangeReadySdlcFixture(fixture);
      const workerPath = path.join(fixture, "global", "agents", "implementation-worker.md");
      replaceRequiredText(workerPath, "explicit objective text", "explicit mission text");
      const result = invokeValidator(fixture);
      assertFailure(result, "Missing implementation-worker objective-continuity text should fail validation.");
      assertOutputContains(result, "implementation-worker same-slice continuation", "Diagnostic should name the implementation-worker continuation contract.");
      assertOutputContains(result, "explicit objective text", "Diagnostic should name the missing objective-continuity token.");
      assertOutputContains(result, path.join("global", "agents", "implementation-worker.md"), "Diagnostic should name the implementation-worker artifact path.");
    },
  },
  {
    name: "validator rejects SDET fixed model drift",
    run: () => {
      const fixture = newLibraryFixture("sdet-fixed-model");
      addChangeReadySdlcFixture(fixture);
      const sdetPath = path.join(fixture, "global", "agents", "sdet-quality-engineer.md");
      replaceRequiredText(sdetPath, "mode: subagent", "mode: subagent\nmodel: xai/grok-4.5");
      const result = invokeValidator(fixture);
      assertFailure(result, "SDET must inherit the session model.");
      assertOutputContains(result, "must not set model or variant", "Diagnostic should name inherited-model policy.");
      assertOutputContains(result, "sdet-quality-engineer.md", "Diagnostic should name the SDET file.");
    },
  },
  {
    name: "validator rejects SDET missing same-model disclosure text",
    run: () => {
      const fixture = newLibraryFixture("sdet-missing-same-model-disclosure");
      addChangeReadySdlcFixture(fixture);
      const sdetPath = path.join(fixture, "global", "agents", "sdet-quality-engineer.md");
      replaceRequiredText(sdetPath, "same-model correlation risk", "model correlation risk");
      const result = invokeValidator(fixture);
      assertFailure(result, "SDET must retain same-model residual-risk disclosure text.");
      assertOutputContains(result, "SDET quality engineer contract", "Diagnostic should name the SDET contract.");
      assertOutputContains(result, "same-model correlation risk", "Diagnostic should name the missing same-model disclosure token.");
      assertOutputContains(result, "sdet-quality-engineer.md", "Diagnostic should name the SDET file.");
    },
  },
  {
    name: "validator rejects SDET missing model-independence report field",
    run: () => {
      const fixture = newLibraryFixture("sdet-missing-model-independence-field");
      addChangeReadySdlcFixture(fixture);
      const sdetPath = path.join(fixture, "global", "agents", "sdet-quality-engineer.md");
      replaceRequiredText(sdetPath, "Model Independence:", "Independence:");
      const result = invokeValidator(fixture);
      assertFailure(result, "SDET report must retain model-independence field.");
      assertOutputContains(result, "SDET quality engineer contract", "Diagnostic should name the SDET contract.");
      assertOutputContains(result, "Model Independence:", "Diagnostic should name the missing model-independence field.");
      assertOutputContains(result, "sdet-quality-engineer.md", "Diagnostic should name the SDET file.");
    },
  },
  {
    name: "validator rejects SDET missing an input identity report token",
    run: () => {
      const fixture = newLibraryFixture("sdet-missing-input-semantic-identity");
      addChangeReadySdlcFixture(fixture);
      const sdetPath = path.join(fixture, "global", "agents", "sdet-quality-engineer.md");
      replaceRequiredText(sdetPath, "Input Semantic Candidate Identity", "Pre-SDET Semantic Candidate Identity");
      const result = invokeValidator(fixture);
      assertFailure(result, "SDET missing Input Semantic Candidate Identity must fail validation.");
      assertOutputContains(result, "SDET quality engineer contract", "Diagnostic should name the SDET contract.");
      assertOutputContains(result, "Input Semantic Candidate Identity", "Diagnostic should name the missing input identity token.");
      assertOutputContains(result, "sdet-quality-engineer.md", "Diagnostic should identify the SDET artifact.");
    },
  },
  {
    name: "validator rejects SDET nested edit permissions",
    run: () => {
      const fixture = newLibraryFixture("sdet-nested-edit");
      addChangeReadySdlcFixture(fixture);
      const sdetPath = path.join(fixture, "global", "agents", "sdet-quality-engineer.md");
      replaceRequiredText(sdetPath, "  edit: allow", "  edit:\n    \"*\": allow");
      const result = invokeValidator(fixture);
      assertFailure(result, "SDET must use scalar edit allow rather than path heuristics.");
      assertOutputContains(result, "scalar edit: allow", "Diagnostic should name scalar edit policy.");
      assertOutputContains(result, "sdet-quality-engineer.md", "Diagnostic should name the SDET file.");
    },
  },
  {
    name: "validator rejects final reviewer that inlines Feedback Ledger block",
    run: () => {
      const fixture = newLibraryFixture("final-reviewer-inline-feedback-ledger");
      addChangeReadySdlcFixture(fixture);
      const finalPath = path.join(fixture, "global", "agents", "final-candidate-reviewer.md");
      writeText(
        finalPath,
        `${fs.readFileSync(finalPath, "utf8")}\n## Feedback Ledger\n\nRecord reviewer workflow friction in the shared feedback ledger.\n`,
      );
      const result = invokeValidator(fixture);
      assertFailure(result, "Inline Feedback Ledger block in final reviewer must fail validation.");
      assertOutputContains(result, "Feedback Ledger", "Diagnostic should name the inline Feedback Ledger block.");
      assertOutputContains(result, "final-candidate-reviewer.md", "Diagnostic should name the affected final reviewer file.");
    },
  },
  {
    name: "validator rejects verbose Contract Reference for final candidate reviewer",
    run: () => {
      const fixture = newLibraryFixture("final-reviewer-verbose-reference");
      addChangeReadySdlcFixture(fixture);
      const finalPath = path.join(fixture, "global", "agents", "final-candidate-reviewer.md");
      replaceRequiredText(
        finalPath,
        "`instructions/leaf-reviewer-agent-contract.md`",
        "This reviewer follows the shared contract at `instructions/leaf-reviewer-agent-contract.md`.",
      );
      const result = invokeValidator(fixture);
      assertFailure(result, "Verbose final-reviewer Contract Reference should fail validation.");
      assertOutputContains(result, "no verbose explanatory sentence", "Diagnostic should reject final-reviewer explanatory Contract Reference prose.");
      assertOutputContains(result, "final-candidate-reviewer.md", "Diagnostic should identify the final candidate reviewer.");
    },
  },
  {
    name: "validator rejects duplicate malformed Contract Reference headings before shape validation",
    run: () => {
      const fixture = newLibraryFixture("final-reviewer-duplicate-malformed-reference");
      addChangeReadySdlcFixture(fixture);
      const finalPath = path.join(fixture, "global", "agents", "final-candidate-reviewer.md");
      writeText(
        finalPath,
        `${fs.readFileSync(finalPath, "utf8")}\n## Contract Reference\n\nNot the standalone contract path.\n`,
      );
      const result = invokeValidator(fixture);
      assertFailure(result, "Duplicate malformed final-reviewer Contract Reference headings should fail validation.");
      assertSingleContractReferenceCardinalityError(result, "final-candidate-reviewer.md");
    },
  },
  {
    name: "validator rejects trailing-space Contract Reference duplicate before shape validation",
    run: () => {
      const fixture = newLibraryFixture("final-reviewer-trailing-space-reference-duplicate");
      addChangeReadySdlcFixture(fixture);
      const finalPath = path.join(fixture, "global", "agents", "final-candidate-reviewer.md");
      writeText(finalPath, `${fs.readFileSync(finalPath, "utf8")}\n## Contract Reference \n`);
      const result = invokeValidator(fixture);
      assertFailure(result, "Trailing-space Contract Reference duplicate should fail validation.");
      assertOutputContains(
        result,
        "Reusable reviewer agent must contain exactly one ## Contract Reference heading",
        "Diagnostic should reject the trailing-space heading as a Contract Reference duplicate.",
      );
      assertOutputContains(result, "final-candidate-reviewer.md", "Diagnostic should identify the final candidate reviewer.");
    },
  },
  {
    name: "validator rejects wrong-level Contract Reference duplicate before shape validation",
    run: () => {
      const fixture = newLibraryFixture("final-reviewer-wrong-level-reference-duplicate");
      addChangeReadySdlcFixture(fixture);
      const finalPath = path.join(fixture, "global", "agents", "final-candidate-reviewer.md");
      writeText(finalPath, `${fs.readFileSync(finalPath, "utf8")}\n### Contract Reference\n`);
      const result = invokeValidator(fixture);
      assertFailure(result, "Wrong-level Contract Reference duplicate should fail validation.");
      assertSingleContractReferenceCardinalityError(result, "final-candidate-reviewer.md");
    },
  },
  {
    name: "validator rejects three-space Contract Reference duplicate after a later section",
    run: () => {
      const fixture = newLibraryFixture("final-reviewer-indented-reference-duplicate");
      addChangeReadySdlcFixture(fixture);
      const finalPath = path.join(fixture, "global", "agents", "final-candidate-reviewer.md");
      writeText(
        finalPath,
        `${fs.readFileSync(finalPath, "utf8")}\n## Later Reviewer Section\n\nRole-specific content.\n\n   ## Contract Reference\n`,
      );
      const result = invokeValidator(fixture);
      assertFailure(result, "Three-space Contract Reference duplicate after a later section should fail validation.");
      assertOutputContains(
        result,
        "Reusable reviewer agent must contain exactly one ## Contract Reference heading",
        "Diagnostic should count the indented duplicate across the whole reviewer.",
      );
      assertOutputContains(result, "final-candidate-reviewer.md", "Diagnostic should identify the final candidate reviewer.");
    },
  },
  {
    name: "validator rejects sole one-space Contract Reference heading",
    run: () => {
      const fixture = newLibraryFixture("final-reviewer-one-space-reference");
      addChangeReadySdlcFixture(fixture);
      const finalPath = path.join(fixture, "global", "agents", "final-candidate-reviewer.md");
      replaceRequiredText(finalPath, "## Contract Reference", " ## Contract Reference");
      const result = invokeValidator(fixture);
      assertFailure(result, "Sole one-space Contract Reference heading should fail exact-syntax validation.");
      assertOutputContains(
        result,
        'Contract Reference heading must be exactly "## Contract Reference"',
        "Diagnostic should reject the indented heading before validating its body.",
      );
      assertOutputContains(result, "final-candidate-reviewer.md", "Diagnostic should identify the final candidate reviewer.");
    },
  },
  {
    name: "validator ignores four-space Contract Reference code block lines",
    run: () => {
      const fixture = newLibraryFixture("final-reviewer-four-space-reference-code-block");
      addChangeReadySdlcFixture(fixture);
      const finalPath = path.join(fixture, "global", "agents", "final-candidate-reviewer.md");
      writeText(
        finalPath,
        `${fs.readFileSync(finalPath, "utf8")}\n## CommonMark Code Block Boundary\n\n    ## Contract Reference\n`,
      );
      assertSuccess(
        invokeValidator(fixture),
        "Four-space Contract Reference code block line should not affect heading cardinality or exact syntax.",
      );
    },
  },
  {
    name: "validator rejects sole closing-hash Contract Reference heading before shape validation",
    run: () => {
      const fixture = newLibraryFixture("final-reviewer-closing-hash-reference");
      addChangeReadySdlcFixture(fixture);
      const finalPath = path.join(fixture, "global", "agents", "final-candidate-reviewer.md");
      replaceRequiredText(finalPath, "## Contract Reference", "## Contract Reference ##");
      const result = invokeValidator(fixture);
      assertFailure(result, "Sole closing-hash Contract Reference heading should fail exact-syntax validation.");
      assertOutputContains(
        result,
        'Contract Reference heading must be exactly "## Contract Reference"',
        "Diagnostic should reject the sole malformed heading before validating its body.",
      );
      assertOutputContains(result, "final-candidate-reviewer.md", "Diagnostic should identify the final candidate reviewer.");
    },
  },
  {
    name: "validator rejects final reviewer fixed model drift",
    run: () => {
      const fixture = newLibraryFixture("final-reviewer-fixed-model");
      addChangeReadySdlcFixture(fixture);
      const finalPath = path.join(fixture, "global", "agents", "final-candidate-reviewer.md");
      replaceRequiredText(finalPath, "mode: subagent", "mode: subagent\nvariant: high");
      const result = invokeValidator(fixture);
      assertFailure(result, "Final reviewer must inherit the session model.");
      assertOutputContains(result, "Final candidate reviewer must not set model or variant", "Diagnostic should name inherited-model policy.");
      assertOutputContains(result, "final-candidate-reviewer.md", "Diagnostic should name the final reviewer file.");
    },
  },
  {
    name: "validator rejects final reviewer missing structured report contract token",
    run: () => {
      const fixture = newLibraryFixture("final-reviewer-missing-report-token");
      addChangeReadySdlcFixture(fixture);
      const finalPath = path.join(fixture, "global", "agents", "final-candidate-reviewer.md");
      replaceRequiredText(finalPath, "FINAL_CANDIDATE_REVIEW_REPORT", "FINAL_REVIEW_REPORT");
      const result = invokeValidator(fixture);
      assertFailure(result, "Missing final reviewer structured-report token should fail validation.");
      assertOutputContains(result, "Final candidate reviewer contract", "Diagnostic should name the final reviewer contract.");
      assertOutputContains(result, "final-candidate-reviewer.md", "Diagnostic should name the final reviewer file.");
      assertOutputContains(result, "FINAL_CANDIDATE_REVIEW_REPORT", "Diagnostic should name the missing structured-report token.");
    },
  },
  {
    name: "validator rejects final reviewer missing directly-readable evidence token",
    run: () => {
      const fixture = newLibraryFixture("final-reviewer-missing-readable-token");
      addChangeReadySdlcFixture(fixture);
      const finalPath = path.join(fixture, "global", "agents", "final-candidate-reviewer.md");
      replaceRequiredText(finalPath, "directly readable", "readable");
      const result = invokeValidator(fixture);
      assertFailure(result, "Missing final reviewer directly-readable evidence token should fail validation.");
      assertOutputContains(result, "Final candidate reviewer contract", "Diagnostic should name the final reviewer contract.");
      assertOutputContains(result, "final-candidate-reviewer.md", "Diagnostic should name the final reviewer file.");
      assertOutputContains(result, "directly readable", "Diagnostic should name the missing readable evidence token.");
    },
  },
  ...[
    {
      label: "final reviewer",
      fixtureName: "final-reviewer-missing-identity-recipe-block",
      relative: path.join("global", "agents", "final-candidate-reviewer.md"),
      original: "Missing, incomplete, or unreproducible Identity Recipe blocks",
      replacement: "Missing identity framing blocks",
      contractLabel: "Final candidate reviewer contract",
    },
    {
      label: "final reviewer",
      fixtureName: "final-reviewer-missing-invalid-sdet-na-rejection",
      relative: path.join("global", "agents", "final-candidate-reviewer.md"),
      original: "behavior-changing or test-content",
      replacement: "some candidate work",
      contractLabel: "Final candidate reviewer contract",
    },
    {
      label: "session-delivery reviewer",
      fixtureName: "session-delivery-missing-identity-recipe-change-block",
      relative: path.join("global", "agents", "session-delivery-reviewer.md"),
      original: "unexplained recipe change",
      replacement: "unexplained framing change",
      contractLabel: "session-delivery-reviewer must require delivery-control safeguards",
    },
  ].map((testCase): TestCase => ({
    name: `validator rejects ${testCase.label} missing an Identity Recipe blocking token`,
    run: () => {
      const fixture = newLibraryFixture(testCase.fixtureName);
      addChangeReadySdlcFixture(fixture);
      const file = path.join(fixture, testCase.relative);
      replaceRequiredText(file, testCase.original, testCase.replacement);
      const result = invokeValidator(fixture);
      assertFailure(result, `${testCase.label} missing an Identity Recipe blocking token should fail validation.`);
      assertOutputContains(result, testCase.contractLabel, `Diagnostic should name the ${testCase.label} contract.`);
      assertOutputContains(result, testCase.original, "Diagnostic should name the missing Identity Recipe blocking token.");
      assertOutputContains(result, testCase.relative, `Diagnostic should identify the affected ${testCase.label} artifact.`);
    },
  })),
  {
    name: "validator rejects session-delivery reviewer missing isolated rollback evidence",
    run: () => {
      const fixture = newLibraryFixture("session-delivery-missing-isolated-rollback-evidence");
      addChangeReadySdlcFixture(fixture);
      const relative = path.join("global", "agents", "session-delivery-reviewer.md");
      const deliveryPath = path.join(fixture, relative);
      replaceRequiredText(deliveryPath, "isolated workspace or project-native snapshot", "isolated workspace or transaction");
      const result = invokeValidator(fixture);
      assertFailure(result, "Missing isolated rollback evidence should fail validation.");
      assertOutputContains(result, "session-delivery-reviewer must require delivery-control safeguards", "Diagnostic should name the session-delivery contract.");
      assertOutputContains(result, "isolated workspace or project-native snapshot", "Diagnostic should name the missing rollback token.");
      assertOutputContains(result, relative, "Diagnostic should identify the session-delivery artifact.");
    },
  },
];
