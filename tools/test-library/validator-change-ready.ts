import fs from "node:fs";
import path from "node:path";
import {
  CHANGE_READY_SDLC_PILOT_READY_MARKERS,
  FORBIDDEN_PRODUCTION_ROUTING_PATTERNS,
  GLOBAL_AGENTS_OUTCOME_FIRST_MARKERS,
  OUTCOME_FIRST_COMPLETE_POLICY_DUPLICATE_THRESHOLD,
  OUTCOME_FIRST_COMPLETE_POLICY_MARKERS,
} from "../contracts/skills.ts";
import {
  CLOSED_WORLD_FORBIDDEN_AUTHORITY_PATTERNS,
  CLOSED_WORLD_SCOPE_MARKERS,
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
    name: "validator ignores complete-policy duplicate markers inside closed and unclosed role examples",
    run: () => {
      for (const fence of operativeFenceCases) {
        const fixture = newLibraryFixture(`outcome-first-role-fenced-${fence.label}`);
        addChangeReadySdlcFixture(fixture);
        const relative = "global/agents/implementation-worker.md";
        const file = path.join(fixture, ...relative.split("/"));
        writeText(
          file,
          `${fs.readFileSync(file, "utf8")}\n${fence.block(OUTCOME_FIRST_COMPLETE_POLICY_MARKERS.join("\n"))}`,
        );
        assertSuccess(invokeValidator(fixture), `${fence.label} role example must not count toward complete-policy duplication.`);
      }
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
      assertSuccess(invokeValidator(fixture), "Closed-world validation must not apply registered-reviewer output fields to qwen-local-worker.");
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
    ["post-freeze scope may only shrink", "REPO_AGENTS.md"],
    ["new revision or separate change", path.join("instructions", "reusable-project-agent-instructions.md")],
    ["never authorize scope expansion", path.join("templates", "project", "AGENTS.md")],
    ["Blocking Evidence", path.join("instructions", "universal-development-loop.md")],
    ["Follow-up Candidates", "REPO_AGENTS.md"],
    ["one correction wave", path.join("global", "AGENTS.md")],
    ["frozen acceptance criterion", path.join("global", "skills", "change-ready-sdlc", "SKILL.md")],
  ] as const).map(([marker, relative]): TestCase => ({
    name: `validator rejects missing closed-world marker: ${marker}`,
    run: () => {
      const fixture = newLibraryFixture(`closed-world-missing-${marker.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}`);
      addChangeReadySdlcFixture(fixture);
      if (!(CLOSED_WORLD_SCOPE_MARKERS as readonly string[]).includes(marker)) {
        throw new Error(`Test marker is not registered as closed-world authority: ${marker}`);
      }
      const file = path.join(fixture, relative);
      replaceRequiredText(file, marker, `[removed-${marker.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}]`);
      const result = invokeValidator(fixture);
      assertFailure(result, `Missing closed-world marker must fail validation: ${marker}`);
      assertOutputContains(result, marker, "Diagnostic must name the missing closed-world marker.");
      assertOutputContains(result, relative, "Diagnostic must identify the affected authority surface.");
    },
  })),
  ...CLOSED_WORLD_FORBIDDEN_AUTHORITY_PATTERNS.map((pattern, index): TestCase => ({
    name: `validator rejects superseded closed-world authority: ${pattern.diagnostic}`,
    run: () => {
      const fixture = newLibraryFixture(`closed-world-forbidden-${index}`);
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
      const fixture = newLibraryFixture(`closed-world-role-${relative}-${field}`.replace(/[^a-z0-9]+/gi, "-").toLowerCase());
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
      for (const token of ["Ordinary Small is the default", "Main may implement directly", "After applicable proof on Material/explicit qualification work", "fresh discovered conforming SDET session", "`sdet-quality-engineer` is the optional default SDET adapter only", "Missing active global `AGENTS.md` blocks Material/qualification work", "Missing `change-ready-sdlc` blocks only when Material/explicit qualification requires the skill", "unresolved validation procedures must be discovered before qualification", "For Material work, always run", "missing conforming capability blocks"]) {
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
