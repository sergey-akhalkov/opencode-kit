import fs from "node:fs";
import path from "node:path";
import {
  CHANGE_READY_SDLC_DUPLICATE_MARKER_THRESHOLD,
  CHANGE_READY_SDLC_LIFECYCLE_MARKERS,
  CHANGE_READY_SDLC_OUTCOME_AUTHORITY_MARKERS,
  CHANGE_READY_SDLC_PILOT_READY_MARKERS,
  FORBIDDEN_PRODUCTION_ROUTING_PATTERNS,
  GLOBAL_AGENTS_OUTCOME_AUTHORITY_MARKERS,
  GLOBAL_AGENTS_OUTCOME_FIRST_MARKERS,
  OUTCOME_FIRST_COMPLETE_POLICY_DUPLICATE_THRESHOLD,
  OUTCOME_FIRST_COMPLETE_POLICY_MARKERS,
} from "../contracts/skills.ts";
import {
  IMPLEMENTATION_WORKER_CONTINUATION_REQUIRED_TEXT,
  IMPLEMENTATION_WORKER_REQUIRED_TEXT,
} from "../contracts/implementation-worker.ts";
import {
  REUSABLE_REVIEWER_LEAF_CONTRACT_TEXT,
} from "../contracts/agents.ts";
import {
  AGENT_TEXT_CONTRACTS,
  OUTCOME_AUTHORITY_FORBIDDEN_PATTERNS,
  OUTCOME_AUTHORITY_SCOPE_MARKERS,
} from "../contracts/reviewer-binding.ts";
import {
  addQwenLocalWorkerFixture,
  addRegisteredReviewerFixture,
  appendReadmeAgentCatalogEntry,
  assert,
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
const expectedImplementationWorkerHandoffFields = [
  "Universal Task Briefing Contract",
  "Acceptance Criteria",
  "Verification",
] as const;

const materialDeliveryRoutingText = "For Material work, always run the discovered conforming delivery/readiness gate with current requirements and evidence; missing conforming capability blocks. Material Change-Ready requires an explicitly accepted conforming delivery result. Ordinary Small uses proportional evidence and invokes that gate only when project policy, risk, or the owner requires it.";
const operativeFenceCases = [
  { label: "closed-backtick", block: (body: string) => ["```markdown", body, "```", ""].join("\n") },
  { label: "closed-tilde", block: (body: string) => ["~~~ markdown", body, "~~~", ""].join("\n") },
  { label: "unclosed-backtick", block: (body: string) => ["```markdown", body, ""].join("\n") },
] as const;

function addChangeReadySdlcFixture(fixture: string): void {
  writeText(path.join(fixture, "global", "AGENTS.md"), fs.readFileSync(path.join(root, "global", "AGENTS.md"), "utf8"));
  writeText(path.join(fixture, "global", "skills", "change-ready-sdlc", "SKILL.md"), fs.readFileSync(path.join(root, "global", "skills", "change-ready-sdlc", "SKILL.md"), "utf8"));
  for (const agent of [
    "implementation-worker",
    "sdet-quality-engineer",
    "final-candidate-reviewer",
    "session-delivery-reviewer",
    "implementation-readiness-reviewer",
    "test-coverage-reviewer",
  ] as const) {
    writeText(path.join(fixture, "global", "agents", `${agent}.md`), fs.readFileSync(path.join(root, "global", "agents", `${agent}.md`), "utf8"));
  }

  writeText(path.join(fixture, "profiles", "all.json"), `{
  "name": "all",
  "description": "Fixture all profile.",
  "skills": ["change-ready-sdlc", "complain", "demo-skill"],
  "agents": ["demo-reviewer", "final-candidate-reviewer", "implementation-readiness-reviewer", "implementation-worker", "session-delivery-reviewer", "sdet-quality-engineer", "test-coverage-reviewer"]
}
`);

  const readmePath = path.join(fixture, "README.md");
  const readme = fs.readFileSync(readmePath, "utf8")
    .replace("- Demo work -> `demo-skill`.", "- Demo work -> `demo-skill`.\n- Ordinary Small -> direct main implementation and `Change-Ready: not requested`.\n- Material/explicit qualification -> load `change-ready-sdlc` before mutation; production-only slices -> `implementation-worker`; post-proof test evidence -> `sdet-quality-engineer`; final review -> `final-candidate-reviewer`.")
    .replace("- `demo-skill`: Demo skill.", "- `change-ready-sdlc`: Portable Change-Ready orchestration topology.\n- `demo-skill`: Demo skill.")
    .replace("- `demo-reviewer`: Demo reviewer.", "- `demo-reviewer`: Demo reviewer.\n- `final-candidate-reviewer`: Final candidate reviewer.\n- `implementation-readiness-reviewer`: Implementation readiness reviewer.\n- `implementation-worker`: Production-only implementation worker.\n- `session-delivery-reviewer`: Session delivery reviewer.\n- `sdet-quality-engineer`: Test-only SDET quality engineer.\n- `test-coverage-reviewer`: Test coverage reviewer.")
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
  writeText(
    path.join(fixture, "instructions", "leaf-reviewer-agent-contract.md"),
    fs.readFileSync(path.join(root, "instructions", "leaf-reviewer-agent-contract.md"), "utf8"),
  );
  replaceRequiredText(
    readmePath,
    "- `reusable-project-agent-instructions.md`: Reusable project instructions.",
    "- `leaf-reviewer-agent-contract.md`: Shared leaf-reviewer contract.\n- `reusable-project-agent-instructions.md`: Reusable project instructions.",
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
  ...GLOBAL_AGENTS_OUTCOME_AUTHORITY_MARKERS.map((marker): TestCase => ({
    name: `validator rejects missing global outcome-authority marker: ${marker}`,
    run: () => {
      const fixture = newLibraryFixture(`outcome-authority-global-${marker.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}`);
      addChangeReadySdlcFixture(fixture);
      const relative = path.join("global", "AGENTS.md");
      replaceRequiredText(path.join(fixture, relative), marker, "[removed-global-outcome-authority-marker]");
      const result = invokeValidator(fixture);
      assertFailure(result, `Missing global outcome-authority marker must fail validation: ${marker}`);
      assertOutputContains(result, "global AGENTS outcome-authority scope contract", "Diagnostic must name the global outcome-authority contract.");
      assertOutputContains(result, marker, "Diagnostic must name the missing global outcome-authority marker.");
      assertOutputContains(result, relative, "Diagnostic must identify global/AGENTS.md.");
    },
  })),
  ...CHANGE_READY_SDLC_OUTCOME_AUTHORITY_MARKERS.map((marker): TestCase => ({
    name: `validator rejects missing canonical outcome-authority marker: ${marker}`,
    run: () => {
      const fixture = newLibraryFixture(`outcome-authority-skill-${marker.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}`);
      addChangeReadySdlcFixture(fixture);
      const relative = path.join("global", "skills", "change-ready-sdlc", "SKILL.md");
      replaceRequiredText(path.join(fixture, relative), marker, "[removed-canonical-outcome-authority-marker]");
      const result = invokeValidator(fixture);
      assertFailure(result, `Missing canonical outcome-authority marker must fail validation: ${marker}`);
      assertOutputContains(result, "change-ready-sdlc outcome-authority scope contract", "Diagnostic must name the canonical outcome-authority contract.");
      assertOutputContains(result, marker, "Diagnostic must name the missing canonical outcome-authority marker.");
      assertOutputContains(result, relative, "Diagnostic must identify the canonical skill.");
    },
  })),
  ...([
    "technically enforced operating envelope",
    "prose-only",
    "remove, narrow, reuse, local guard, then deferral",
    "material residual-risk bundle",
    "cannot waive uncontrolled authorization",
    "Neither disposition authorizes",
    "bounded outcome and non-goals",
    "real-boundary happy-path proof",
    "focused project-native validation",
    "critical safety/data/authorization",
    "failure visibility",
    "disable/rollback/containment",
    "`Non-Deferrable Invariants`",
    "Pilot-Ready: yes | no | not requested",
  ] as const).map((marker): TestCase => ({
    name: `validator rejects missing global outcome-first marker: ${marker}`,
    run: () => {
      assert((GLOBAL_AGENTS_OUTCOME_FIRST_MARKERS as readonly string[]).includes(marker), `Negative fixture marker is not configured for global AGENTS: ${marker}`);
      const fixture = newLibraryFixture(`outcome-first-global-${marker.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}`);
      addChangeReadySdlcFixture(fixture);
      const relative = path.join("global", "AGENTS.md");
      const file = path.join(fixture, relative);
      replaceRequiredText(file, marker, "[removed-outcome-first-marker]");
      const result = invokeValidator(fixture);
      assertFailure(result, `Missing global outcome-first marker must fail validation: ${marker}`);
      assertOutputContains(result, "global AGENTS outcome-first and Pilot-Ready policy", "Diagnostic must name the global outcome-first contract.");
      assertOutputContains(result, marker, "Diagnostic must name the missing outcome-first marker.");
      assertOutputContains(result, relative, "Diagnostic must identify global/AGENTS.md.");
    },
  })),
  ...([
    "not a third lifecycle profile",
    "complete Pilot safety floor is authoritative only in always-loaded global",
    "Neither disposition authorizes",
    "does not automatically erase independently proven Pilot-Ready",
    "does not undermine candidate identity/scope, proof, containment, safety floor, validation, or material-risk acceptance",
  ] as const).map((marker): TestCase => ({
    name: `validator rejects missing canonical Pilot-Ready marker: ${marker}`,
    run: () => {
      assert((CHANGE_READY_SDLC_PILOT_READY_MARKERS as readonly string[]).includes(marker), `Negative fixture marker is not configured for the canonical skill: ${marker}`);
      const fixture = newLibraryFixture(`pilot-ready-skill-${marker.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}`);
      addChangeReadySdlcFixture(fixture);
      const relative = path.join("global", "skills", "change-ready-sdlc", "SKILL.md");
      const file = path.join(fixture, relative);
      replaceRequiredText(file, marker, "[removed-pilot-ready-marker]");
      const result = invokeValidator(fixture);
      assertFailure(result, `Missing canonical Pilot-Ready marker must fail validation: ${marker}`);
      assertOutputContains(result, "change-ready-sdlc Pilot-Ready qualification policy", "Diagnostic must name the canonical Pilot-Ready contract.");
      assertOutputContains(result, marker, "Diagnostic must name the missing canonical marker.");
      assertOutputContains(result, relative, "Diagnostic must identify the canonical skill.");
    },
  })),
  {
    name: "validator requires global and skill Pilot markers outside closed and unclosed fences",
    run: () => {
      const surfaces = [
        {
          label: "global-floor",
          relative: path.join("global", "AGENTS.md"),
          marker: "bounded outcome and non-goals",
          contract: "global AGENTS outcome-first and Pilot-Ready policy",
        },
        {
          label: "skill-pilot",
          relative: path.join("global", "skills", "change-ready-sdlc", "SKILL.md"),
          marker: "does not automatically erase independently proven Pilot-Ready",
          contract: "change-ready-sdlc Pilot-Ready qualification policy",
        },
      ] as const;

      for (const fence of operativeFenceCases) {
        const positiveFixture = newLibraryFixture(`operative-pilot-positive-${fence.label}`);
        addChangeReadySdlcFixture(positiveFixture);
        for (const surface of surfaces) {
          const file = path.join(positiveFixture, surface.relative);
          writeText(file, `${fs.readFileSync(file, "utf8")}\n${fence.block(surface.marker)}`);
        }
        assertSuccess(invokeValidator(positiveFixture), `${fence.label} examples must not corrupt operative Pilot markers outside fences.`);

        for (const surface of surfaces) {
          const fixture = newLibraryFixture(`operative-pilot-${fence.label}-${surface.label}`);
          addChangeReadySdlcFixture(fixture);
          const file = path.join(fixture, surface.relative);
          replaceRequiredText(file, surface.marker, `[removed-${surface.label}-operative-marker]`);
          writeText(file, `${fs.readFileSync(file, "utf8")}\n${fence.block(surface.marker)}`);
          const result = invokeValidator(fixture);
          assertFailure(result, `${fence.label} fenced-only ${surface.label} marker must fail operative validation.`);
          assertOutputContains(
            result,
            `${surface.contract} must include '${surface.marker}'`,
            `${fence.label} diagnostic must name the exact missing operative marker.`,
          );
          assertOutputContains(result, surface.relative, `${fence.label} diagnostic must identify the affected authority path.`);
        }
      }
    },
  },
  {
    name: "validator routing consumers report unsupported container-prefixed authority fences explicitly",
    run: () => {
      const cases = [
        {
          fixtureName: "operative-routing-unsupported-agents-blockquote",
          relative: path.join("global", "AGENTS.md"),
          unsupportedLine: "> ``` private-agents-container-content",
          privateSentinel: "private-agents-container-content",
        },
        {
          fixtureName: "operative-routing-unsupported-skill-list-container",
          relative: path.join("global", "skills", "change-ready-sdlc", "SKILL.md"),
          unsupportedLine: "> - ~~~ private-skill-container-content",
          privateSentinel: "private-skill-container-content",
        },
      ] as const;

      for (const item of cases) {
        const fixture = newLibraryFixture(item.fixtureName);
        addChangeReadySdlcFixture(fixture);
        const file = path.join(fixture, item.relative);
        const prefix = `${fs.readFileSync(file, "utf8")}\n`;
        const unsupportedLineNumber = prefix.split(/\r?\n/).length;
        writeText(file, `${prefix}${item.unsupportedLine}\n`);
        const result = invokeValidator(fixture);
        assertFailure(result, `${item.relative} unsupported container-prefixed fence syntax must fail routing validation.`);
        assertOutputContains(result, `unsupported non-top-level fenced-code syntax at line ${unsupportedLineNumber}`, "Routing diagnostic must report unsupported syntax rather than a synthetic missing marker.");
        assertOutputContains(result, item.relative, "Routing diagnostic must identify the affected active authority surface.");
        assert(!result.output.includes(item.privateSentinel), "Routing diagnostics must not expose unsupported source-line content.");
      }
    },
  },
  {
    name: "validator scans a later unsupported delimiter before raw handoff schema checks",
    run: () => {
      const fixture = newLibraryFixture("operative-routing-later-run-before-schema");
      addChangeReadySdlcFixture(fixture);
      const relative = path.join("global", "AGENTS.md");
      const file = path.join(fixture, relative);
      const current = fs.readFileSync(file, "utf8");
      for (const field of expectedImplementationWorkerHandoffFields) {
        assert(current.includes(field), `Multi-run maintenance fixture must contain raw handoff schema field: ${field}`);
      }
      const privateSentinel = "private-later-run-routing-content";
      const unsupportedLine = `\`\`\` invalid opener prose > \`\`\` ${privateSentinel}`;
      const prefix = `${current}\n`;
      const unsupportedLineNumber = prefix.split(/\r?\n/).length;
      writeText(file, `${prefix}${unsupportedLine}\n`);

      const result = invokeValidator(fixture);
      assertFailure(result, "A later unsupported delimiter run must fail aggregate validation even when all raw handoff fields exist.");
      const expectedDiagnostic = `unsupported non-top-level fenced-code syntax at line ${unsupportedLineNumber}`;
      assertOutputContains(result, expectedDiagnostic, "Aggregate routing must inspect every unmasked delimiter run.");
      assertOutputContains(result, relative, "Aggregate multi-run diagnostic must identify global/AGENTS.md.");
      const errors = result.output.split(/\r?\n/).filter((line) => line.startsWith("ERROR: "));
      assert(errors.length > 0 && errors[0]!.includes(expectedDiagnostic), "Unsupported syntax must be the first aggregate policy error before handoff schema validation.");
      assert(!result.output.includes(privateSentinel), "Aggregate multi-run diagnostic must not expose source-line content.");
    },
  },
  {
    name: "validator rejects unsupported role syntax before opposite-polarity policy duplication counts",
    run: () => {
      const fixture = newLibraryFixture("operative-role-unsupported-before-duplication");
      addChangeReadySdlcFixture(fixture);
      const relative = "global/agents/implementation-worker.md";
      const file = path.join(fixture, ...relative.split("/"));
      const policyCopy = OUTCOME_FIRST_COMPLETE_POLICY_MARKERS.join("\n");
      assert(
        OUTCOME_FIRST_COMPLETE_POLICY_MARKERS.filter((marker) => policyCopy.includes(marker)).length >= OUTCOME_FIRST_COMPLETE_POLICY_DUPLICATE_THRESHOLD,
        "Opposite-polarity fixture must contain at least the complete-policy duplication threshold.",
      );
      const privateSentinel = "private-role-duplication-content";
      const unsupportedLine = `\`\`\` invalid opener > \`\`\` ${privateSentinel}`;
      const prefix = `${fs.readFileSync(file, "utf8")}\n${policyCopy}\n`;
      const unsupportedLineNumber = prefix.split(/\r?\n/).length;
      writeText(file, `${prefix}${unsupportedLine}\n`);

      const result = invokeValidator(fixture);
      assertFailure(result, "Unsupported role syntax must not pass as zero duplicate-policy hits.");
      assertOutputContains(result, `unsupported non-top-level fenced-code syntax at line ${unsupportedLineNumber}`, "Role syntax diagnostic must precede opposite-polarity count logic.");
      assertOutputContains(result, path.join("global", "agents", "implementation-worker.md"), "Role syntax diagnostic must identify implementation-worker.md.");
      assert(!result.output.includes("outcome-first complete policy duplication"), "Duplicate-policy counting must not run on a surface rejected by the syntax gate.");
      assert(!result.output.includes(privateSentinel), "Role syntax diagnostic must not expose source-line content.");
    },
  },
  {
    name: "validator requires authority lifecycle and continuation markers outside supported fences",
    run: () => {
      const cases = [
        {
          label: "global-outcome-authority",
          relative: path.join("global", "AGENTS.md"),
          marker: "accepted outcome",
          fence: operativeFenceCases[0],
          diagnostic: "global AGENTS outcome-authority scope contract must include 'accepted outcome'",
        },
        {
          label: "skill-outcome-authority",
          relative: path.join("global", "skills", "change-ready-sdlc", "SKILL.md"),
          marker: "persistent evidence infrastructure",
          fence: operativeFenceCases[1],
          diagnostic: "change-ready-sdlc outcome-authority scope contract must include 'persistent evidence infrastructure'",
        },
        {
          label: "skill-lifecycle",
          relative: path.join("global", "skills", "change-ready-sdlc", "SKILL.md"),
          marker: "Adapter Discovery",
          fence: operativeFenceCases[2],
          diagnostic: "change-ready-sdlc missing lifecycle marker 'Adapter Discovery'",
        },
        {
          label: "skill-continuation",
          relative: path.join("global", "skills", "change-ready-sdlc", "SKILL.md"),
          marker: "External path references alone are insufficient",
          fence: operativeFenceCases[0],
          diagnostic: "change-ready-sdlc missing continuation token 'External path references alone are insufficient'",
        },
      ] as const;

      for (const item of cases) {
        const fixture = newLibraryFixture(`operative-required-${item.label}`);
        addChangeReadySdlcFixture(fixture);
        const file = path.join(fixture, item.relative);
        replaceRequiredText(file, item.marker, `[removed-${item.label}]`);
        writeText(file, `${fs.readFileSync(file, "utf8")}\n${item.fence.block(item.marker)}`);
        const result = invokeValidator(fixture);
        assertFailure(result, `${item.label} present only in a supported fence must fail aggregate validation.`);
        assertOutputContains(result, item.diagnostic, `${item.label} diagnostic must name the missing operative marker.`);
        assertOutputContains(result, item.relative, `${item.label} diagnostic must identify the affected authority path.`);
        assert(!result.output.includes("unsupported non-top-level fenced-code syntax"), `${item.label} supported fence must not be misclassified as unsupported syntax.`);
      }
    },
  },
  {
    name: "validator accepts Verification only in the normative fenced briefing schema",
    run: () => {
      const currentGlobal = fs.readFileSync(path.join(root, "global", "AGENTS.md"), "utf8");
      const briefingStart = currentGlobal.indexOf("## Universal Task Briefing Contract");
      const schemaStart = currentGlobal.indexOf("```text", briefingStart);
      const schemaEnd = currentGlobal.indexOf("```", schemaStart + "```text".length);
      assert(briefingStart >= 0 && schemaStart > briefingStart && schemaEnd > schemaStart, "Current global AGENTS must retain the normative fenced briefing schema.");
      const schema = currentGlobal.slice(schemaStart, schemaEnd);
      for (const field of expectedImplementationWorkerHandoffFields) {
        assert(currentGlobal.includes(field), `Current global AGENTS must contain handoff field: ${field}`);
      }
      assert(schema.includes("Acceptance Criteria"), "Normative fenced briefing schema must contain Acceptance Criteria.");
      assert(schema.includes("Verification"), "Normative fenced briefing schema must contain Verification.");
      const outsideSchema = `${currentGlobal.slice(0, schemaStart)}${currentGlobal.slice(schemaEnd + 3)}`;
      assert(!outsideSchema.includes("Verification"), "Current global AGENTS must exercise Verification only inside the normative supported fence.");

      assertSuccess(invokeValidator(root), "Current global AGENTS normative briefing schema must pass the real validator.");
      const fixture = newLibraryFixture("normative-fenced-briefing-schema");
      addChangeReadySdlcFixture(fixture);
      assertSuccess(invokeValidator(fixture), "A copied fixture with Verification only in the normative supported fence must pass all three handoff-field checks.");
    },
  },
  {
    name: "validator rejects handoff labels relocated from the normative schema to an arbitrary supported fence",
    run: () => {
      const fixture = newLibraryFixture("normative-briefing-schema-relocated-fields");
      addChangeReadySdlcFixture(fixture);
      const relative = path.join("global", "AGENTS.md");
      const file = path.join(fixture, relative);
      replaceRequiredText(file, "Verification:", "[removed-schema-field]:");
      writeText(
        file,
        `${fs.readFileSync(file, "utf8")}\n## Arbitrary Briefing Example\n\n${operativeFenceCases[0].block(expectedImplementationWorkerHandoffFields.join("\n"))}`,
      );

      const result = invokeValidator(fixture);
      assertFailure(result, "An arbitrary supported fence must not replace a missing normative Verification schema field.");
      assertOutputContains(
        result,
        "implementation-worker handoff fields must include 'Verification'",
        "Relocated handoff labels must retain the exact missing-field diagnostic.",
      );
      assertOutputContains(result, relative, "Relocated handoff diagnostic must identify global/AGENTS.md.");
      assert(!result.output.includes("unsupported non-top-level fenced-code syntax"), "The arbitrary top-level example must remain supported but non-normative.");
    },
  },
  {
    name: "validator rejects non-exact normative briefing schema shapes",
    run: () => {
      assertSuccess(
        invokeValidator(root),
        "Current root with the byte-exact normative briefing schema must pass before negative shape variants.",
      );
      const currentGlobal = fs.readFileSync(path.join(root, "global", "AGENTS.md"), "utf8");
      const briefingStart = currentGlobal.indexOf("## Universal Task Briefing Contract");
      const schemaStart = currentGlobal.indexOf("```text", briefingStart);
      const schemaEnd = currentGlobal.indexOf("```", schemaStart + "```text".length);
      assert(briefingStart >= 0 && schemaStart > briefingStart && schemaEnd > schemaStart, "Current global AGENTS must expose the exact normative schema fixture source.");
      const schema = currentGlobal.slice(schemaStart, schemaEnd + 3);
      assertEqual(schema.split(/\r?\n/).length, 20, "Normative schema fixture must contain one opener, 18 labels, and one closer.");

      const briefingOwnershipBoundaryCases = [
        { label: "one-space H1", boundary: " # Intervening Briefing Boundary" },
        { label: "two-space H2", boundary: "  ## Intervening Briefing Boundary" },
        { label: "three-space H1", boundary: "   # Intervening Briefing Boundary" },
        { label: "tab-separated H1", boundary: "#\tIntervening Briefing Boundary" },
        { label: "one-space tab-separated H2", boundary: " ##\tIntervening Briefing Boundary" },
      ] as const;

      const cases = [
        {
          label: "partial field list",
          mutate: (text: string, fixtureSchema: string) => text.replace(fixtureSchema, fixtureSchema.replace(/^Verification:\r?\n/m, "")),
        },
        {
          label: "reordered fields",
          mutate: (text: string, fixtureSchema: string) => text.replace(fixtureSchema, fixtureSchema.replace(/Acceptance Criteria:\r?\nVerification:/, "Verification:\nAcceptance Criteria:")),
        },
        {
          label: "duplicate field cardinality",
          mutate: (text: string, fixtureSchema: string) => text.replace(fixtureSchema, fixtureSchema.replace(/^Verification:/m, "Verification:\nVerification:")),
        },
        {
          label: "wrong fence info string",
          mutate: (text: string, fixtureSchema: string) => text.replace(fixtureSchema, fixtureSchema.replace(/^```text/m, "```markdown")),
        },
        {
          label: "second schema block under the exact H2",
          mutate: (text: string, fixtureSchema: string) => text.replace(fixtureSchema, `${fixtureSchema}\n\n${fixtureSchema}`),
        },
        {
          label: "duplicate exact H2 and schema block",
          mutate: (text: string, fixtureSchema: string) => `${text}\n## Universal Task Briefing Contract\n\n${fixtureSchema}\n`,
        },
        {
          label: "schema block moved under a different H2",
          mutate: (text: string, fixtureSchema: string) => `${text.replace(fixtureSchema, "")}\n## Briefing Schema Example\n\n${fixtureSchema}\n`,
        },
        {
          label: "target H2 leading whitespace drift",
          mutate: (text: string, _fixtureSchema: string) => text.replace("## Universal Task Briefing Contract", " ## Universal Task Briefing Contract"),
        },
        {
          label: "target H2 trailing whitespace drift",
          mutate: (text: string, _fixtureSchema: string) => text.replace("## Universal Task Briefing Contract", "## Universal Task Briefing Contract "),
        },
        {
          label: "target H2 internal whitespace drift",
          mutate: (text: string, _fixtureSchema: string) => text.replace("## Universal Task Briefing Contract", "## Universal  Task Briefing Contract"),
        },
        {
          label: "schema moved below an intervening unfenced H1",
          mutate: (text: string, fixtureSchema: string) => text.replace(fixtureSchema, `# Intervening Briefing Boundary\n\n${fixtureSchema}`),
        },
        ...briefingOwnershipBoundaryCases.map((item) => ({
          label: `schema moved below an intervening ${item.label}`,
          mutate: (text: string, fixtureSchema: string) => text.replace(
            fixtureSchema,
            `${item.boundary}\n\n${fixtureSchema}`,
          ),
        })),
        {
          label: "opener indentation drift",
          mutate: (text: string, fixtureSchema: string) => text.replace(fixtureSchema, fixtureSchema.replace(/^```text/m, " ```text")),
        },
        {
          label: "opener delimiter length drift",
          mutate: (text: string, fixtureSchema: string) => text.replace(fixtureSchema, fixtureSchema.replace(/^```text/m, "````text")),
        },
        {
          label: "opener trailing whitespace drift",
          mutate: (text: string, fixtureSchema: string) => text.replace(fixtureSchema, fixtureSchema.replace(/^```text/m, "```text ")),
        },
        {
          label: "closer indentation drift",
          mutate: (text: string, fixtureSchema: string) => text.replace(fixtureSchema, fixtureSchema.replace(/\r?\n```$/, "\n ```")),
        },
        {
          label: "closer delimiter length drift",
          mutate: (text: string, fixtureSchema: string) => text.replace(fixtureSchema, fixtureSchema.replace(/\r?\n```$/, "\n````")),
        },
        {
          label: "closer trailing whitespace drift",
          mutate: (text: string, fixtureSchema: string) => text.replace(fixtureSchema, fixtureSchema.replace(/\r?\n```$/, "\n``` ")),
        },
        {
          label: "blank line inserted among labels",
          mutate: (text: string, fixtureSchema: string) => text.replace(
            fixtureSchema,
            fixtureSchema.replace(/Verification:\r?\nReturn Contract:/, "Verification:\n\nReturn Contract:"),
          ),
        },
      ] as const;

      for (const item of cases) {
        const fixture = newLibraryFixture(`normative-schema-shape-${item.label.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}`);
        addChangeReadySdlcFixture(fixture);
        const relative = path.join("global", "AGENTS.md");
        const file = path.join(fixture, relative);
        const original = fs.readFileSync(file, "utf8");
        const fixtureBriefingStart = original.indexOf("## Universal Task Briefing Contract");
        const fixtureSchemaStart = original.indexOf("```text", fixtureBriefingStart);
        const fixtureSchemaEnd = original.indexOf("```", fixtureSchemaStart + "```text".length);
        assert(fixtureBriefingStart >= 0 && fixtureSchemaStart > fixtureBriefingStart && fixtureSchemaEnd > fixtureSchemaStart, `Fixture must retain its source schema before mutation: ${item.label}`);
        const fixtureSchema = original.slice(fixtureSchemaStart, fixtureSchemaEnd + 3);
        const mutated = item.mutate(original, fixtureSchema);
        assert(mutated !== original, `Schema-shape fixture must mutate global AGENTS: ${item.label}`);
        writeText(file, mutated);

        const result = invokeValidator(fixture);
        assertFailure(result, `Non-exact normative schema shape must fail: ${item.label}`);
        assertOutputContains(
          result,
          "implementation-worker handoff fields must include 'Verification'",
          `Non-exact schema shape must fail the externally visible Verification field: ${item.label}`,
        );
        assertOutputContains(result, relative, `Schema-shape diagnostic must identify global/AGENTS.md: ${item.label}`);
        assert(!result.output.includes("unsupported non-top-level fenced-code syntax"), `Supported but non-exact schema shape must not be misclassified as unsupported syntax: ${item.label}`);
      }
    },
  },
  {
    name: "validator accepts current YAML frontmatter maps and all four exact role report envelopes",
    run: () => {
      const reports = [
        {
          relative: path.join("global", "agents", "implementation-worker.md"),
          openTag: "<IMPLEMENTATION_WORKER_REPORT>",
          closeTag: "</IMPLEMENTATION_WORKER_REPORT>",
        },
        {
          relative: path.join("global", "agents", "sdet-quality-engineer.md"),
          openTag: "<SDET_QUALITY_REPORT>",
          closeTag: "</SDET_QUALITY_REPORT>",
        },
        {
          relative: path.join("global", "agents", "final-candidate-reviewer.md"),
          openTag: "<FINAL_CANDIDATE_REVIEW_REPORT>",
          closeTag: "</FINAL_CANDIDATE_REVIEW_REPORT>",
        },
        {
          relative: path.join("global", "agents", "troubleshooter.md"),
          openTag: "<TROUBLESHOOTER_REPORT>",
          closeTag: "</TROUBLESHOOTER_REPORT>",
        },
      ] as const;
      for (const report of reports) {
        const text = fs.readFileSync(path.join(root, report.relative), "utf8");
        assert(/^---\r?\n/.test(text), `Current role must retain leading YAML frontmatter: ${report.relative}`);
        assert(text.includes("## Output"), `Current role must retain its exact Output H2: ${report.relative}`);
        assert(text.includes(report.openTag), `Current role must retain report opener ${report.openTag}: ${report.relative}`);
        assert(text.includes(report.closeTag), `Current role must retain report closer ${report.closeTag}: ${report.relative}`);
      }
      assertSuccess(
        invokeValidator(root),
        "The real current-root validator must accept current frontmatter maps and all four exact role report envelopes.",
      );
    },
  },
  {
    name: "validator rejects an implementation-worker report envelope relocated outside exact Output ownership",
    run: () => {
      const fixture = newLibraryFixture("implementation-worker-relocated-report-envelope");
      addChangeReadySdlcFixture(fixture);
      const relative = path.join("global", "agents", "implementation-worker.md");
      const file = path.join(fixture, relative);
      const reportIntroduction = "Return exactly one final `IMPLEMENTATION_WORKER_REPORT` envelope:";
      replaceRequiredText(
        file,
        reportIntroduction,
        `${reportIntroduction}\n\n## Relocated Report Example`,
      );

      const result = invokeValidator(fixture);
      assertFailure(result, "A report fence moved below another H2 must fail exact Output ownership validation.");
      assertOutputContains(
        result,
        "Agent must contain exactly one exact ## Output top-level ```markdown report envelope (<IMPLEMENTATION_WORKER_REPORT>...</IMPLEMENTATION_WORKER_REPORT>)",
        "Relocated report diagnostic must name the exact implementation-worker envelope contract.",
      );
      assertOutputContains(result, relative, "Relocated report diagnostic must identify implementation-worker.md.");
    },
  },
  {
    name: "validator rejects report envelopes relocated below supported indented or tab-separated H1/H2 boundaries",
    run: () => {
      const boundaries = [
        { label: "one-space H1", line: " # Relocated Report Boundary" },
        { label: "two-space H2", line: "  ## Relocated Report Boundary" },
        { label: "three-space H1", line: "   # Relocated Report Boundary" },
        { label: "tab-separated H1", line: "#\tRelocated Report Boundary" },
        { label: "one-space tab-separated H2", line: " ##\tRelocated Report Boundary" },
      ] as const;

      for (const boundary of boundaries) {
        const fixture = newLibraryFixture(`implementation-worker-relocated-report-${boundary.label.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}`);
        addChangeReadySdlcFixture(fixture);
        const relative = path.join("global", "agents", "implementation-worker.md");
        const file = path.join(fixture, relative);
        const reportIntroduction = "Return exactly one final `IMPLEMENTATION_WORKER_REPORT` envelope:";
        replaceRequiredText(
          file,
          reportIntroduction,
          `${reportIntroduction}\n\n${boundary.line}`,
        );

        const result = invokeValidator(fixture);
        assertFailure(result, `${boundary.label} must end exact Output ownership before the otherwise exact report envelope.`);
        assertOutputContains(
          result,
          "Agent must contain exactly one exact ## Output top-level ```markdown report envelope (<IMPLEMENTATION_WORKER_REPORT>...</IMPLEMENTATION_WORKER_REPORT>)",
          `${boundary.label} diagnostic must name the exact implementation-worker envelope contract.`,
        );
        assertOutputContains(result, relative, `${boundary.label} diagnostic must identify implementation-worker.md.`);
        assert(
          !result.output.includes("unsupported non-top-level fenced-code syntax"),
          `${boundary.label} must be treated as a supported ownership boundary, not unsupported syntax.`,
        );
      }
    },
  },
  {
    name: "validator requires non-global implementation-worker handoff labels outside supported fences",
    run: () => {
      const surfaces = [
        "REPO_AGENTS.md",
        path.join("instructions", "reusable-project-agent-instructions.md"),
        path.join("templates", "project", "AGENTS.md"),
      ] as const;

      for (const relative of surfaces) {
        const fixture = newLibraryFixture(`operative-handoff-${relative.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}`);
        addChangeReadySdlcFixture(fixture);
        const file = path.join(fixture, relative);
        replaceRequiredText(file, "Verification", "[removed-operative-handoff-field]");
        writeText(file, `${fs.readFileSync(file, "utf8")}\n${operativeFenceCases[0].block(expectedImplementationWorkerHandoffFields.join("\n"))}`);

        const result = invokeValidator(fixture);
        assertFailure(result, `${relative} must not satisfy handoff labels from a supported fence.`);
        assertOutputContains(
          result,
          "implementation-worker handoff fields must include 'Verification'",
          `${relative} must retain the exact missing operative handoff-field diagnostic.`,
        );
        assertOutputContains(result, relative, `Handoff-field diagnostic must identify ${relative}.`);
        assert(!result.output.includes("unsupported non-top-level fenced-code syntax"), `${relative} supported fence must remain valid example syntax.`);
      }
    },
  },
  {
    name: "validator requires unique devkit instruction markers outside supported fences",
    run: () => {
      const cases = [
        {
          label: "UDL Intake stage",
          relative: path.join("instructions", "universal-development-loop.md"),
          marker: "Intake",
          diagnostic: "Universal Development Loop must include 'Intake'",
        },
        {
          label: "project template remote and destructive guard",
          relative: path.join("templates", "project", "AGENTS.md"),
          marker: "Do not commit, push, merge, delete source artifacts, or alter remote state unless explicitly requested",
          diagnostic: "project AGENTS.md remote/destructive guard must include 'Do not commit, push, merge, delete source artifacts, or alter remote state unless explicitly requested'",
        },
        {
          label: "project template readiness non-authorization",
          relative: path.join("templates", "project", "AGENTS.md"),
          marker: "neither Pilot-Ready nor Change-Ready authorizes external operations",
          diagnostic: "project AGENTS.md readiness non-authorization must include 'neither Pilot-Ready nor Change-Ready authorizes external operations'",
        },
        {
          label: "REPO autonomy marker",
          relative: "REPO_AGENTS.md",
          marker: "Ask the user only",
          diagnostic: "REPO_AGENTS.md autonomous work contract must include 'Ask the user only'",
        },
        {
          label: "REPO completion handoff marker",
          relative: "REPO_AGENTS.md",
          marker: "(Recommended)",
          diagnostic: "REPO_AGENTS.md completion handoff contract must include '(Recommended)'",
        },
        {
          label: "REPO deterministic helper marker",
          relative: "REPO_AGENTS.md",
          marker: "no hidden heuristics",
          diagnostic: "REPO_AGENTS.md deterministic helper automation policy must include 'no hidden heuristics'",
        },
      ] as const;

      for (const item of cases) {
        const fixture = newLibraryFixture(`operative-devkit-${item.label.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}`);
        addChangeReadySdlcFixture(fixture);
        const file = path.join(fixture, item.relative);
        replaceRequiredText(file, item.marker, `[removed-${item.label.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}]`);
        writeText(file, `${fs.readFileSync(file, "utf8")}\n${operativeFenceCases[0].block(item.marker)}`);

        const result = invokeValidator(fixture);
        assertFailure(result, `${item.label} present only in a supported fence must fail aggregate validation.`);
        assertOutputContains(result, item.diagnostic, `${item.label} diagnostic must name the exact devkit contract and marker.`);
        assertOutputContains(result, item.relative, `${item.label} diagnostic must identify the affected model-facing path.`);
        assert(!result.output.includes("unsupported non-top-level fenced-code syntax"), `${item.label} supported fence must not be classified as unsupported syntax.`);
      }
    },
  },
  {
    name: "validator rejects unsupported syntax before model-facing devkit marker checks",
    run: () => {
      const surfaces = [
        { label: "UDL", relative: path.join("instructions", "universal-development-loop.md") },
        { label: "project template", relative: path.join("templates", "project", "AGENTS.md") },
        { label: "REPO", relative: "REPO_AGENTS.md" },
      ] as const;

      for (const item of surfaces) {
        const fixture = newLibraryFixture(`unsupported-devkit-${item.label.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}`);
        addChangeReadySdlcFixture(fixture);
        const file = path.join(fixture, item.relative);
        const current = fs.readFileSync(file, "utf8");
        for (const marker of item.label === "UDL"
          ? ["Intake", "Process Improvement"]
          : item.label === "project template"
            ? ["Do not commit, push, merge, delete source artifacts, or alter remote state unless explicitly requested", "neither Pilot-Ready nor Change-Ready authorizes external operations"]
            : ["Ask the user only", "(Recommended)", "no hidden heuristics"]) {
          assert(current.includes(marker), `${item.label} unsupported-syntax control must begin with its raw required marker: ${marker}`);
        }
        const prefix = current.endsWith("\n") ? current : `${current}\n`;
        const unsupportedLineNumber = prefix.split(/\r?\n/).length;
        const privateSentinel = `private-${item.label.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-devkit-content`;
        writeText(file, `${prefix}> \`\`\` ${privateSentinel}\n`);

        const result = invokeValidator(fixture);
        assertFailure(result, `${item.label} unsupported non-top-level syntax must fail aggregate validation.`);
        const expectedDiagnostic = `unsupported non-top-level fenced-code syntax at line ${unsupportedLineNumber}`;
        assertOutputContains(result, expectedDiagnostic, `${item.label} diagnostic must report the exact unsupported line.`);
        assertOutputContains(result, item.relative, `${item.label} unsupported-syntax diagnostic must identify the model-facing path.`);
        const errors = result.output.split(/\r?\n/).filter((line) => line.startsWith("ERROR: "));
        assert(errors.length > 0 && errors[0]!.includes(expectedDiagnostic), `${item.label} unsupported syntax must be the first aggregate error before marker success.`);
        assert(!result.output.includes(privateSentinel), `${item.label} unsupported-syntax diagnostic must not expose source-line content.`);
      }
    },
  },
  {
    name: "validator permits role and planning deltas below the complete-policy threshold and rejects a complete policy copy",
    run: () => {
      for (const [surface, relative] of [
        ["role", "global/agents/implementation-worker.md"],
        ["planning", "global/skills/deep-task-planning/SKILL.md"],
      ] as const) {
        const fixture = newLibraryFixture(`outcome-first-${surface}-policy-duplication`);
        addChangeReadySdlcFixture(fixture);
        const file = path.join(fixture, ...relative.split("/"));
        if (!fs.existsSync(file)) {
          writeText(file, fs.readFileSync(path.join(root, ...relative.split("/")), "utf8"));
          const profilePath = path.join(fixture, "profiles", "all.json");
          const profile = JSON.parse(fs.readFileSync(profilePath, "utf8")) as { skills: string[] };
          profile.skills.push("deep-task-planning");
          writeText(profilePath, `${JSON.stringify(profile, null, 2)}\n`);
          replaceRequiredText(
            path.join(fixture, "README.md"),
            "- `demo-skill`: Demo skill.",
            "- `deep-task-planning`: Planning-surface duplication fixture.\n- `demo-skill`: Demo skill.",
          );
        }
        let text = fs.readFileSync(file, "utf8");
        const countHits = (value: string) => OUTCOME_FIRST_COMPLETE_POLICY_MARKERS.filter((marker) => value.includes(marker)).length;
        const missing = OUTCOME_FIRST_COMPLETE_POLICY_MARKERS.filter((marker) => !text.includes(marker));
        const initialHits = countHits(text);
        assert(initialHits < OUTCOME_FIRST_COMPLETE_POLICY_DUPLICATE_THRESHOLD, `${surface} fixture must begin below the role/planning delta duplicate threshold.`);
        const belowThresholdAdditions = OUTCOME_FIRST_COMPLETE_POLICY_DUPLICATE_THRESHOLD - 1 - initialHits;
        assert(missing.length > belowThresholdAdditions, `${surface} fixture must have enough absent policy markers to cross the duplicate threshold deterministically.`);
        text = `${text}\n${missing.slice(0, belowThresholdAdditions).join("\n")}\n`;
        writeText(file, text);
        assertEqual(countHits(text), OUTCOME_FIRST_COMPLETE_POLICY_DUPLICATE_THRESHOLD - 1, `${surface} delta fixture must exercise the exact below-threshold boundary.`);
        assertSuccess(invokeValidator(fixture), `A ${surface}-specific delta below the complete-policy threshold should pass validation.`);

        writeText(file, `${text}${missing[belowThresholdAdditions]}\n`);
        const result = invokeValidator(fixture);
        assertFailure(result, `A ${surface} surface reaching the complete-policy threshold must fail validation.`);
        assertOutputContains(result, "outcome-first complete policy duplication", "Diagnostic must name complete-policy duplication.");
        assertOutputContains(result, `threshold >=${OUTCOME_FIRST_COMPLETE_POLICY_DUPLICATE_THRESHOLD}`, "Diagnostic must state the exact duplicate threshold.");
        assertOutputContains(result, relative, `Diagnostic must identify the offending ${surface} surface.`);
      }
    },
  },
  {
    name: "validator ignores forbidden and duplicate-policy markers inside closed and unclosed role examples",
    run: () => {
      for (const fence of operativeFenceCases) {
        const fixture = newLibraryFixture(`outcome-first-role-fenced-${fence.label}`);
        addChangeReadySdlcFixture(fixture);
        const relative = "global/agents/implementation-worker.md";
        const file = path.join(fixture, ...relative.split("/"));
        const forbiddenPolicy = FORBIDDEN_PRODUCTION_ROUTING_PATTERNS[0];
        assert(forbiddenPolicy != null, "Supported-fence control requires a configured forbidden routing pattern.");
        // Fixture ownership: implementation-worker ends at ## Output, so a separate H2
        // keeps this arbitrary example outside the exact report-envelope section.
        writeText(
          file,
          `${fs.readFileSync(file, "utf8")}\n## Non-Operative Role Example\n\n${fence.block(`${OUTCOME_FIRST_COMPLETE_POLICY_MARKERS.join("\n")}\n${forbiddenPolicy.needle}`)}`,
        );
        assertSuccess(invokeValidator(fixture), `${fence.label} role example must not trigger forbidden-policy or complete-policy duplication checks.`);
      }
    },
  },
  {
    name: "validator treats reviewer action-list markers in fenced and indented code as non-operative",
    run: () => {
      const marker = "Actionable Continuation Items";
      const relative = path.join("global", "agents", "sdet-quality-engineer.md");

      const fencedFixture = newLibraryFixture("agent-action-marker-fenced-code");
      addChangeReadySdlcFixture(fencedFixture);
      const fencedFile = path.join(fencedFixture, relative);
      writeText(
        fencedFile,
        `${fs.readFileSync(fencedFile, "utf8")}\n## Non-Operative Example\n\n${operativeFenceCases[0].block(marker)}`,
      );
      assertSuccess(
        invokeValidator(fencedFixture),
        "A forbidden reviewer action-list marker inside a supported fence must remain non-operative.",
      );

      const indentedFixture = newLibraryFixture("agent-action-marker-indented-code");
      addChangeReadySdlcFixture(indentedFixture);
      const indentedFile = path.join(indentedFixture, relative);
      writeText(
        indentedFile,
        `${fs.readFileSync(indentedFile, "utf8")}\n## Non-Operative CommonMark Code\n\n    ${marker}\n`,
      );
      assertSuccess(
        invokeValidator(indentedFixture),
        "A forbidden reviewer action-list marker inside CommonMark indented code must remain non-operative.",
      );

      const tabIndentedFixture = newLibraryFixture("agent-action-marker-tab-indented-code");
      addChangeReadySdlcFixture(tabIndentedFixture);
      const tabIndentedFile = path.join(tabIndentedFixture, relative);
      writeText(
        tabIndentedFile,
        `${fs.readFileSync(tabIndentedFile, "utf8")}\n## Non-Operative Tab Code\n\n\t${marker}\n`,
      );
      assertSuccess(
        invokeValidator(tabIndentedFixture),
        "A forbidden reviewer action-list marker inside tab-indented code must remain non-operative.",
      );
    },
  },
  {
    name: "validator cannot certify implementation-worker behavior from fenced or indented role code",
    run: () => {
      const marker = "smallest complete happy path";
      assert(
        (IMPLEMENTATION_WORKER_REQUIRED_TEXT as readonly string[]).includes(marker),
        "Role-code boundary fixture marker must remain configured in the implementation-worker contract.",
      );
      const cases = [
        {
          label: "supported-fence",
          block: operativeFenceCases[0].block(marker),
        },
        {
          label: "four-space-indented",
          block: `    ${marker}\n`,
        },
        {
          label: "tab-indented",
          block: `\t${marker}\n`,
        },
        {
          label: "one-space-tab-indented",
          block: ` \t${marker}\n`,
        },
        {
          label: "two-space-tab-indented",
          block: `  \t${marker}\n`,
        },
        {
          label: "three-space-tab-indented",
          block: `   \t${marker}\n`,
        },
      ] as const;

      for (const item of cases) {
        const fixture = newLibraryFixture(`implementation-worker-marker-${item.label}`);
        addChangeReadySdlcFixture(fixture);
        const relative = path.join("global", "agents", "implementation-worker.md");
        const file = path.join(fixture, relative);
        replaceRequiredText(file, marker, `[removed-operative-${item.label}-marker]`);
        writeText(
          file,
          `${fs.readFileSync(file, "utf8")}\n## Non-Operative Behavioral Example\n\n${item.block}`,
        );

        const result = invokeValidator(fixture);
        assertFailure(result, `${item.label} role code must not certify implementation-worker behavior.`);
        assertOutputContains(
          result,
          `Implementation worker contract must include '${marker}'`,
          `${item.label} diagnostic must name the missing operative behavioral marker.`,
        );
        assertOutputContains(result, relative, `${item.label} diagnostic must identify implementation-worker.md.`);
        assert(
          !result.output.includes("Agent must contain exactly one exact ## Output"),
          `${item.label} example must remain outside and must not corrupt the exact report envelope.`,
        );
      }
    },
  },
  {
    name: "validator keeps one-to-three-space ordinary role text operative",
    run: () => {
      const marker = "smallest complete happy path";
      assert(
        (IMPLEMENTATION_WORKER_REQUIRED_TEXT as readonly string[]).includes(marker),
        "Ordinary-indentation control marker must remain configured in the implementation-worker contract.",
      );

      for (const spaces of [1, 2, 3] as const) {
        const fixture = newLibraryFixture(`implementation-worker-operative-${spaces}-space-text`);
        addChangeReadySdlcFixture(fixture);
        const relative = path.join("global", "agents", "implementation-worker.md");
        const file = path.join(fixture, relative);
        replaceRequiredText(file, marker, `[removed-operative-${spaces}-space-control]`);
        writeText(
          file,
          `${fs.readFileSync(file, "utf8")}\n## Operative Indented Prose Control\n\n${" ".repeat(spaces)}${marker}\n`,
        );

        assertSuccess(
          invokeValidator(fixture),
          `${spaces} leading space(s) before ordinary marker text must remain operative at the real role-validator boundary.`,
        );
      }
    },
  },
  {
    name: "validator cannot certify implementation-worker continuation from four-column indented role code",
    run: () => {
      const marker = "prior Applicable Proof";
      assert(
        (IMPLEMENTATION_WORKER_CONTINUATION_REQUIRED_TEXT as readonly string[]).includes(marker),
        "Indented continuation fixture marker must remain configured in the routing contract.",
      );
      const cases = [
        { label: "four-space", block: `    ${marker}\n` },
        { label: "two-space-tab", block: `  \t${marker}\n` },
      ] as const;

      for (const item of cases) {
        const fixture = newLibraryFixture(`implementation-worker-continuation-${item.label}-indented-only`);
        addChangeReadySdlcFixture(fixture);
        const relative = path.join("global", "agents", "implementation-worker.md");
        const file = path.join(fixture, relative);
        replaceRequiredText(file, marker, `[removed-operative-${item.label}-continuation-marker]`);
        writeText(
          file,
          `${fs.readFileSync(file, "utf8")}\n## Non-Operative Continuation Example\n\n${item.block}`,
        );

        const result = invokeValidator(fixture);
        assertFailure(result, `${item.label} indented-only continuation text must fail the routing positive contract.`);
        assertOutputContains(
          result,
          `implementation-worker same-slice continuation must include '${marker}'`,
          `${item.label} continuation diagnostic must name the missing operative marker.`,
        );
        assertOutputContains(result, relative, `${item.label} continuation diagnostic must identify implementation-worker.md.`);
        assert(
          !result.output.includes("unsupported non-top-level fenced-code syntax"),
          `${item.label} CommonMark indented role code is supported and non-operative, not unsupported fence syntax.`,
        );
      }
    },
  },
  {
    name: "validator excludes indented role examples from complete-policy and lifecycle duplication counts",
    run: () => {
      assert(
        OUTCOME_FIRST_COMPLETE_POLICY_MARKERS.length >= OUTCOME_FIRST_COMPLETE_POLICY_DUPLICATE_THRESHOLD,
        "Indented count fixture requires enough complete-policy markers to reach its configured threshold.",
      );
      assert(
        CHANGE_READY_SDLC_LIFECYCLE_MARKERS.length >= CHANGE_READY_SDLC_DUPLICATE_MARKER_THRESHOLD,
        "Indented count fixture requires enough lifecycle markers to reach its configured threshold.",
      );
      const fixture = newLibraryFixture("implementation-worker-indented-duplication-markers");
      addChangeReadySdlcFixture(fixture);
      const relative = path.join("global", "agents", "implementation-worker.md");
      const file = path.join(fixture, relative);
      const indentedPolicy = [
        ...OUTCOME_FIRST_COMPLETE_POLICY_MARKERS.map((marker) => `    ${marker}`),
        ...CHANGE_READY_SDLC_LIFECYCLE_MARKERS.map((marker) => `\t${marker}`),
      ].join("\n");
      writeText(
        file,
        `${fs.readFileSync(file, "utf8")}\n## Non-Operative Policy Examples\n\n${indentedPolicy}\n`,
      );

      assertSuccess(
        invokeValidator(fixture),
        "Indented role examples at both duplication thresholds must not trigger count-based policy failures.",
      );
    },
  },
  {
    name: "validator does not allow an exact report envelope to certify non-allowlisted role behavior",
    run: () => {
      const marker = "smallest complete happy path";
      assert(
        (IMPLEMENTATION_WORKER_REQUIRED_TEXT as readonly string[]).includes(marker),
        "Report-boundary fixture marker must remain a required implementation-worker behavior.",
      );
      const fixture = newLibraryFixture("implementation-worker-behavior-in-report-only");
      addChangeReadySdlcFixture(fixture);
      const relative = path.join("global", "agents", "implementation-worker.md");
      const file = path.join(fixture, relative);
      replaceRequiredText(file, marker, "[removed-operative-behavior-marker]");
      replaceRequiredText(
        file,
        "</IMPLEMENTATION_WORKER_REPORT>",
        `${marker}\n</IMPLEMENTATION_WORKER_REPORT>`,
      );

      const result = invokeValidator(fixture);
      assertFailure(result, "A non-allowlisted behavioral marker inside the exact report envelope must not certify the role contract.");
      assertOutputContains(
        result,
        `Implementation worker contract must include '${marker}'`,
        "Report-only behavior diagnostic must name the missing operative contract marker.",
      );
      assertOutputContains(result, relative, "Report-only behavior diagnostic must identify implementation-worker.md.");
      assert(
        !result.output.includes("Agent must contain exactly one exact ## Output"),
        "The negative control must retain an otherwise exact report envelope.",
      );
    },
  },
  {
    name: "validator cannot certify reusable-reviewer or configured agent text contracts from role code examples",
    run: () => {
      const genericMarker = "`Findings`: ordered by severity";
      assert(
        (REUSABLE_REVIEWER_LEAF_CONTRACT_TEXT as readonly string[]).includes(genericMarker),
        "Generic reviewer fixture marker must remain configured in the reusable leaf contract.",
      );
      const genericFixture = newLibraryFixture("generic-reviewer-marker-fenced-only");
      addChangeReadySdlcFixture(genericFixture);
      const genericRelative = path.join("global", "agents", "implementation-readiness-reviewer.md");
      const genericFile = path.join(genericFixture, genericRelative);
      replaceRequiredText(genericFile, genericMarker, "[removed-operative-generic-reviewer-marker]");
      writeText(
        genericFile,
        `${fs.readFileSync(genericFile, "utf8")}\n## Non-Operative Reviewer Example\n\n${operativeFenceCases[0].block(genericMarker)}`,
      );
      const genericResult = invokeValidator(genericFixture);
      assertFailure(genericResult, "A fenced-only reusable-reviewer marker must not certify the generic leaf contract.");
      assertOutputContains(
        genericResult,
        `Reusable reviewer leaf contract must include '${genericMarker}'`,
        "Generic reviewer diagnostic must name the missing operative marker.",
      );
      assertOutputContains(genericResult, genericRelative, "Generic reviewer diagnostic must identify its role file.");

      const configuredMarker = "actual runtime envelope";
      assert(
        AGENT_TEXT_CONTRACTS.some(
          (contract) => contract.fileName === "test-coverage-reviewer.md" && contract.requiredText.includes(configuredMarker),
        ),
        "Configured agent-text fixture marker must remain registered for test-coverage-reviewer.md.",
      );
      const configuredFixture = newLibraryFixture("configured-agent-text-marker-indented-only");
      addChangeReadySdlcFixture(configuredFixture);
      const configuredRelative = path.join("global", "agents", "test-coverage-reviewer.md");
      const configuredFile = path.join(configuredFixture, configuredRelative);
      replaceRequiredText(configuredFile, configuredMarker, "[removed-operative-configured-agent-text-marker]");
      writeText(
        configuredFile,
        `${fs.readFileSync(configuredFile, "utf8")}\n## Non-Operative Contract Example\n\n    ${configuredMarker}\n`,
      );
      const configuredResult = invokeValidator(configuredFixture);
      assertFailure(configuredResult, "An indented-only configured AGENT_TEXT_CONTRACTS marker must not certify the role contract.");
      assertOutputContains(
        configuredResult,
        `test-coverage-reviewer must require task/repro/runtime-envelope coverage must include '${configuredMarker}'`,
        "Configured agent-text diagnostic must name the missing operative marker.",
      );
      assertOutputContains(configuredResult, configuredRelative, "Configured agent-text diagnostic must identify test-coverage-reviewer.md.");
    },
  },
  {
    name: "validator does not classify arbitrary natural-language risk narratives",
    run: () => {
      const fixture = newLibraryFixture("outcome-first-no-fuzzy-risk-classifier");
      addChangeReadySdlcFixture(fixture);
      const reviewer = path.join(fixture, "global", "agents", "demo-reviewer.md");
      writeText(reviewer, `${fs.readFileSync(reviewer, "utf8")}\nA narrative finding says a risk may be reachable, severe, material, user-accepted, and contained.\n`);
      assertSuccess(invokeValidator(fixture), "Deterministic validation must not infer reachability, severity, materiality, containment, or acceptance from arbitrary prose.");
    },
  },
  {
    name: "validator rejects missing next-increment marker on the Universal Development Loop boundary",
    run: () => {
      const fixture = newLibraryFixture("outcome-first-udl-missing-envelope");
      const relative = path.join("instructions", "universal-development-loop.md");
      replaceRequiredText(path.join(fixture, relative), "technically enforced operating envelope", "documented operating envelope");
      const result = invokeValidator(fixture);
      assertFailure(result, "Universal Development Loop without an enforced-envelope marker must fail validation.");
      assertOutputContains(result, "Universal Development Loop", "Diagnostic must name the Universal Development Loop contract.");
      assertOutputContains(result, "technically enforced operating envelope", "Diagnostic must name the missing envelope marker.");
      assertOutputContains(result, relative, "Diagnostic must identify the UDL surface.");
    },
  },
  {
    name: "validator rejects project template missing readiness non-authorization",
    run: () => {
      const fixture = newLibraryFixture("outcome-first-template-missing-non-authorization");
      const relative = path.join("templates", "project", "AGENTS.md");
      replaceRequiredText(path.join(fixture, relative), "neither Pilot-Ready nor Change-Ready authorizes external operations", "readiness is reported separately");
      const result = invokeValidator(fixture);
      assertFailure(result, "Project template without readiness non-authorization must fail validation.");
      assertOutputContains(result, "project AGENTS.md readiness non-authorization", "Diagnostic must name the readiness non-authorization contract.");
      assertOutputContains(result, relative, "Diagnostic must identify the project template.");
    },
  },
  {
    name: "validator keeps qwen-local-worker outside the registered-reviewer evidence-only output contract",
    run: () => {
      const fixture = newLibraryFixture("change-ready-qwen-role-boundary");
      addChangeReadySdlcFixture(fixture);
      const qwenPath = addQwenLocalWorkerFixture(fixture);
      const qwen = fs.readFileSync(qwenPath, "utf8");
      if (!qwen.includes("Actionable Continuation Items")) {
        throw new Error("qwen-local-worker fixture must exercise its existing non-registered continuation field.");
      }
      assertSuccess(invokeValidator(fixture), "Outcome-authority validation must not apply registered-reviewer output fields to qwen-local-worker.");
    },
  },
  {
    name: "validator accepts current README reviewer field and rejects the stale action-list field",
    run: () => {
      const currentFixture = newLibraryFixture("readme-current-reviewer-field");
      const currentReadme = fs.readFileSync(path.join(currentFixture, "README.md"), "utf8");
      assert(currentReadme.includes("Follow-up Candidates"), "Current README fixture must expose Follow-up Candidates.");
      assert(!currentReadme.includes("Actionable Continuation Items"), "Current README fixture must not expose the stale reviewer field.");
      assertSuccess(invokeValidator(currentFixture), "README with Follow-up Candidates and no stale field should pass validation.");

      const staleFixture = newLibraryFixture("readme-stale-reviewer-field");
      const staleReadmePath = path.join(staleFixture, "README.md");
      writeText(staleReadmePath, `${fs.readFileSync(staleReadmePath, "utf8")}\nActionable Continuation Items\n`);
      const result = invokeValidator(staleFixture);
      assertFailure(result, "README with Actionable Continuation Items must fail validation.");
      assertOutputContains(
        result,
        "README must not prescribe superseded field 'Actionable Continuation Items' (use non-authorizing 'Follow-up Candidates')",
        "README diagnostic must identify the stale/current field contract.",
      );
      assertOutputContains(result, "README.md", "README stale-field diagnostic must identify README.md.");
    },
  },
  ...([
    ["accepted outcome", "REPO_AGENTS.md"],
    ["protected-boundary", path.join("instructions", "reusable-project-agent-instructions.md")],
    ["dependency closure", path.join("templates", "project", "AGENTS.md")],
    ["never authorize mutation", path.join("instructions", "universal-development-loop.md")],
    ["Blocking Evidence", path.join("instructions", "reusable-project-agent-instructions.md")],
    ["Follow-up Candidates", "REPO_AGENTS.md"],
    ["correction wave", path.join("templates", "project", "AGENTS.md")],
    ["root goal", path.join("instructions", "universal-development-loop.md")],
  ] as const).map(([marker, relative]): TestCase => ({
    name: `validator rejects missing shared outcome-authority marker: ${marker}`,
    run: () => {
      const fixture = newLibraryFixture(`outcome-authority-missing-${marker.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}`);
      addChangeReadySdlcFixture(fixture);
      if (!(OUTCOME_AUTHORITY_SCOPE_MARKERS as readonly string[]).includes(marker)) {
        throw new Error(`Test marker is not registered as outcome authority: ${marker}`);
      }
      const file = path.join(fixture, relative);
      replaceRequiredText(file, marker, "[removed-shared-outcome-authority-marker]");
      assert(!fs.readFileSync(file, "utf8").includes(marker), `Negative fixture must remove every occurrence of the shared outcome-authority marker: ${marker}`);
      const result = invokeValidator(fixture);
      assertFailure(result, `Missing shared outcome-authority marker must fail validation: ${marker}`);
      assertOutputContains(result, "outcome-authority scope contract", "Diagnostic must name the shared outcome-authority contract.");
      assertOutputContains(result, marker, "Diagnostic must name the missing outcome-authority marker.");
      assertOutputContains(result, relative, "Diagnostic must identify the affected authority surface.");
    },
  })),
  ...OUTCOME_AUTHORITY_FORBIDDEN_PATTERNS.map((pattern, index): TestCase => ({
    name: `validator rejects superseded outcome authority: ${pattern.diagnostic}`,
    run: () => {
      const fixture = newLibraryFixture(`outcome-authority-forbidden-${index}`);
      addChangeReadySdlcFixture(fixture);
      const relative = "REPO_AGENTS.md";
      const file = path.join(fixture, relative);
      writeText(file, `${fs.readFileSync(file, "utf8")}\n${pattern.needle}\n`);
      const result = invokeValidator(fixture);
      assertFailure(result, `Superseded authority must fail validation: ${pattern.needle}`);
      assertOutputContains(result, pattern.diagnostic, "Diagnostic must name the superseded authority class.");
      assertOutputContains(result, relative, "Diagnostic must identify the affected authority surface.");
    },
  })),
  {
    name: "validator excludes historical OpenSpec policy text from active outcome-authority scans",
    run: () => {
      const fixture = newLibraryFixture("outcome-authority-historical-openspec-exclusion");
      addChangeReadySdlcFixture(fixture);
      const historicalText = OUTCOME_AUTHORITY_FORBIDDEN_PATTERNS.map((pattern) => pattern.needle).join("\n");
      writeText(
        path.join(fixture, "openspec", "changes", "archive", "historical-closed-world-policy", "design.md"),
        `# Historical policy record\n\n${historicalText}\n`,
      );
      writeText(
        path.join(fixture, "openspec", "changes", "prior-policy-record", "proposal.md"),
        `# Prior active-change record\n\n${historicalText}\n`,
      );
      assertSuccess(
        invokeValidator(fixture),
        "Historical OpenSpec records must not be treated as current loaded or project-facing authority.",
      );
    },
  },
  ...([
    ["Missing Tests", path.join("global", "agents", "sdet-quality-engineer.md")],
    ["Missing Golden Tests", path.join("global", "agents", "test-coverage-reviewer.md")],
    ["Missing Golden/Integration Tests", path.join("instructions", "leaf-reviewer-agent-contract.md")],
    ["Missing Decisions", path.join("global", "agents", "implementation-readiness-reviewer.md")],
    ["Required Evidence", path.join("global", "agents", "implementation-readiness-reviewer.md")],
    ["Benchmark Suggestions", path.join("global", "agents", "test-coverage-reviewer.md")],
    ["Validation Gaps", path.join("global", "agents", "test-coverage-reviewer.md")],
    ["Manual Gates", path.join("global", "agents", "session-delivery-reviewer.md")],
    ["Suggested Next Options", path.join("global", "agents", "implementation-readiness-reviewer.md")],
    ["Required Next Actions", path.join("global", "agents", "session-delivery-reviewer.md")],
    ["Actionable Continuation Items", path.join("global", "agents", "sdet-quality-engineer.md")],
    ["changes_requested", path.join("global", "agents", "final-candidate-reviewer.md")],
  ] as const).map(([field, relative]): TestCase => ({
    name: `validator rejects ${field} on ${relative}`,
    run: () => {
      const fixture = newLibraryFixture(`outcome-authority-role-${relative}-${field}`.replace(/[^a-z0-9]+/gi, "-").toLowerCase());
      addChangeReadySdlcFixture(fixture);
      const file = path.join(fixture, relative);
      writeText(file, `${fs.readFileSync(file, "utf8")}\n${field}\n`);
      const result = invokeValidator(fixture);
      assertFailure(result, `${relative} must reject superseded output authority: ${field}`);
      assertOutputContains(result, `superseded reviewer/SDET action-list field ${field}`, "Diagnostic must name the forbidden output field.");
      assertOutputContains(result, relative, "Diagnostic must identify the affected registered role or shared leaf contract.");
    },
  })),
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
      for (const token of ["Ordinary Small is the default", "Main may implement directly", "After applicable proof on Material/explicit qualification work", "fresh discovered conforming SDET session", "`sdet-quality-engineer` is the optional default SDET adapter only", "Missing active global `AGENTS.md` blocks Material/qualification work", "Missing `change-ready-sdlc` blocks only when Material/explicit qualification requires the skill", "unresolved validation procedures must be discovered before qualification", "For Material work, always run", "missing conforming capability blocks", "accepted outcome and protected boundaries", "Necessary local reversible dependency closure is autonomous", "Never ask solely to approve an internal revision or process counter", "does not automatically end the root goal"]) {
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
      token: "Ordinary Small uses proportional evidence and invokes that gate only when project policy, risk, or the owner requires it",
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
  ...FORBIDDEN_PRODUCTION_ROUTING_PATTERNS.map((pattern, index): TestCase => ({
    name: `validator rejects old active-policy anti-pattern: ${pattern.diagnostic}`,
    run: () => {
      const fixture = newLibraryFixture(`change-ready-old-policy-${index}`);
      addChangeReadySdlcFixture(fixture);
      const relative = index % 2 === 0 ? "REPO_AGENTS.md" : path.join("templates", "project", "AGENTS.md");
      const file = path.join(fixture, relative);
      writeText(file, `${fs.readFileSync(file, "utf8")}\n${pattern.needle}\n`);
      const result = invokeValidator(fixture);
      assertFailure(result, `Old active-policy anti-pattern must fail validation: ${pattern.needle}`);
      assertOutputContains(result, pattern.diagnostic, "Diagnostic should identify the exact superseded policy class.");
      assertOutputContains(result, relative, "Diagnostic should identify the affected maintenance surface.");
    },
  })),
  ...([
    ["canonical Change-Ready skill", path.join("global", "skills", "change-ready-sdlc", "SKILL.md"), 0],
    ["Universal Development Loop", path.join("instructions", "universal-development-loop.md"), 1],
    ["implementation worker", path.join("global", "agents", "implementation-worker.md"), 2],
    ["SDET quality engineer", path.join("global", "agents", "sdet-quality-engineer.md"), 3],
    ["final candidate reviewer", path.join("global", "agents", "final-candidate-reviewer.md"), 4],
    ["session delivery reviewer", path.join("global", "agents", "session-delivery-reviewer.md"), 5],
    ["implementation readiness reviewer", path.join("global", "agents", "implementation-readiness-reviewer.md"), 6],
    ["test coverage reviewer", path.join("global", "agents", "test-coverage-reviewer.md"), 0],
  ] as const).map(([name, relative, patternIndex]): TestCase => ({
    name: `validator scans ${name} for forbidden production routing`,
    run: () => {
      const fixture = newLibraryFixture(
        `change-ready-forbidden-surface-${name.replace(/\s+/g, "-").toLowerCase()}`,
      );
      addChangeReadySdlcFixture(fixture);
      const pattern = FORBIDDEN_PRODUCTION_ROUTING_PATTERNS[patternIndex];
      if (pattern == null) throw new Error(`Missing forbidden routing fixture pattern ${patternIndex}.`);
      const file = path.join(fixture, relative);
      if (!fs.existsSync(file)) throw new Error(`Missing active routing fixture surface: ${relative}`);
      writeText(file, `${fs.readFileSync(file, "utf8")}\n${pattern.needle}\n`);
      const result = invokeValidator(fixture);
      assertFailure(result, `${name} must reject an injected old universal-routing sentence.`);
      assertOutputContains(result, pattern.diagnostic, `${name} diagnostic should identify the forbidden policy class.`);
      assertOutputContains(result, relative, `${name} diagnostic should identify the scanned path.`);
    },
  })),
  {
    name: "validator rejects Change-Ready skill missing Candidate Reference lifecycle marker",
    run: () => {
      const fixture = newLibraryFixture("change-ready-sdlc-missing-marker");
      addChangeReadySdlcFixture(fixture);
      const skillPath = path.join(fixture, "global", "skills", "change-ready-sdlc", "SKILL.md");
      replaceRequiredText(skillPath, "Candidate Reference", "Candidate Snapshot");
      const result = invokeValidator(fixture);
      assertFailure(result, "Missing Candidate Reference lifecycle marker should fail validation.");
      assertOutputContains(result, "Candidate Reference", "Diagnostic should name the missing lifecycle marker.");
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
    name: "validator enforces portable-hardcode token boundaries at the canonical skill subprocess",
    run: () => {
      const cases = [
        {
          label: "ordinary through suffix",
          appendedText: "Continue through the discovered adapter.",
          forbiddenToken: null,
        },
        {
          label: "standalone gh command",
          appendedText: "Invoke gh status through the discovered adapter.",
          forbiddenToken: "gh ",
        },
        {
          label: "dream team configured prefix",
          appendedText: "Invoke dream_team_review through the discovered adapter.",
          forbiddenToken: "dream_team_",
        },
        {
          label: "WindowsService identifier",
          appendedText: "Use the WindowsService adapter.",
          forbiddenToken: null,
        },
        {
          label: "standalone Windows name",
          appendedText: "Use the Windows adapter.",
          forbiddenToken: "Windows",
        },
        {
          label: "punctuation-led GitHub path",
          appendedText: "Read .github/workflows/validation.yml.",
          forbiddenToken: ".github/",
        },
      ] as const;

      for (const item of cases) {
        const fixture = newLibraryFixture(`change-ready-portable-boundary-${item.label.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}`);
        addChangeReadySdlcFixture(fixture);
        const skillPath = path.join(fixture, "global", "skills", "change-ready-sdlc", "SKILL.md");
        writeText(skillPath, `${fs.readFileSync(skillPath, "utf8")}\n${item.appendedText}\n`);

        const result = invokeValidator(fixture);
        if (item.forbiddenToken === null) {
          assertSuccess(result, `${item.label} must not trigger a portable-hardcode diagnostic.`);
          continue;
        }

        assertFailure(result, `${item.label} must trigger its configured portable-hardcode diagnostic.`);
        assertOutputContains(
          result,
          `change-ready-sdlc forbidden portable-hardcode token '${item.forbiddenToken}': ${skillPath}`,
          `${item.label} must emit the exact token-and-file diagnostic.`,
        );
      }
    },
  },
  {
    name: "validator allows five duplicate lifecycle markers outside the canonical skill",
    run: () => {
      const fixture = newLibraryFixture("change-ready-sdlc-duplicate-marker-below-threshold");
      addChangeReadySdlcFixture(fixture);
      const reviewerPath = path.join(fixture, "global", "agents", "demo-reviewer.md");
      writeText(reviewerPath, `${fs.readFileSync(reviewerPath, "utf8")}\nAdapter Discovery\nProfile: Ordinary Small | Material\nAuthoritative Brief\nApplicable Proof\nCandidate Reference\n`);
      assertSuccess(invokeValidator(fixture), "Five exact lifecycle markers should remain below the D13 duplicate threshold.");
    },
  },
  {
    name: "validator rejects six duplicate lifecycle markers outside the canonical skill",
    run: () => {
      const fixture = newLibraryFixture("change-ready-sdlc-duplicate-marker-threshold");
      addChangeReadySdlcFixture(fixture);
      const reviewerPath = path.join(fixture, "global", "agents", "demo-reviewer.md");
      writeText(reviewerPath, `${fs.readFileSync(reviewerPath, "utf8")}\nAdapter Discovery\nProfile: Ordinary Small | Material\nAuthoritative Brief\nApplicable Proof\nCandidate Reference\nProject-Native Validation\n`);
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
      fixture: "worker-missing-candidate-reference",
      relative: path.join("global", "agents", "implementation-worker.md"),
      original: "Candidate Reference",
      replacement: "candidate snapshot",
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
    name: "validator rejects SDET missing Candidate Reference report token",
    run: () => {
      const fixture = newLibraryFixture("sdet-missing-candidate-reference");
      addChangeReadySdlcFixture(fixture);
      const sdetPath = path.join(fixture, "global", "agents", "sdet-quality-engineer.md");
      replaceRequiredText(sdetPath, "Candidate Reference", "Candidate Snapshot");
      const result = invokeValidator(fixture);
      assertFailure(result, "SDET missing Candidate Reference must fail validation.");
      assertOutputContains(result, "SDET quality engineer contract", "Diagnostic should name the SDET contract.");
      assertOutputContains(result, "Candidate Reference", "Diagnostic should name the missing candidate-reference token.");
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
      fixtureName: "final-reviewer-missing-candidate-reference",
      relative: path.join("global", "agents", "final-candidate-reviewer.md"),
      original: "Candidate Reference",
      replacement: "Candidate Snapshot",
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
      fixtureName: "session-delivery-missing-readable-candidate",
      relative: path.join("global", "agents", "session-delivery-reviewer.md"),
      original: "readable scoped candidate",
      replacement: "candidate summary",
      contractLabel: "session-delivery-reviewer must require delivery-control safeguards",
    },
  ].map((testCase): TestCase => ({
    name: `validator rejects ${testCase.label} missing an active qualification token`,
    run: () => {
      const fixture = newLibraryFixture(testCase.fixtureName);
      addChangeReadySdlcFixture(fixture);
      const file = path.join(fixture, testCase.relative);
      replaceRequiredText(file, testCase.original, testCase.replacement);
      const result = invokeValidator(fixture);
      assertFailure(result, `${testCase.label} missing an active qualification token should fail validation.`);
      assertOutputContains(result, testCase.contractLabel, `Diagnostic should name the ${testCase.label} contract.`);
      assertOutputContains(result, testCase.original, "Diagnostic should name the missing active qualification token.");
      assertOutputContains(result, testCase.relative, `Diagnostic should identify the affected ${testCase.label} artifact.`);
    },
  })),
  {
    name: "validator accepts proportional delivery without old universal rollback ceremony",
    run: () => {
      const fixture = newLibraryFixture("session-delivery-proportional-rollback");
      addChangeReadySdlcFixture(fixture);
      const relative = path.join("global", "agents", "session-delivery-reviewer.md");
      const deliveryPath = path.join(fixture, relative);
      const delivery = fs.readFileSync(deliveryPath, "utf8");
      if (!delivery.includes("Rollback plan: proportional")) throw new Error("Delivery reviewer must require proportional rollback planning.");
      if (delivery.includes("isolated workspace or project-native snapshot")) throw new Error("Active delivery reviewer must not retain universal isolated-rollback ceremony.");
      assertSuccess(invokeValidator(fixture), "Current proportional delivery contract should pass without old universal rollback text.");
    },
  },
];
