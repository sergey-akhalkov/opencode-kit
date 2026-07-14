import fs from "node:fs";
import path from "node:path";

import {
  CHANGE_READY_SDLC_CONTINUATION_TOKENS,
  CHANGE_READY_SDLC_DUPLICATE_MARKER_THRESHOLD,
  CHANGE_READY_SDLC_FORBIDDEN_TOKENS,
  CHANGE_READY_SDLC_LIFECYCLE_MARKERS,
  CHANGE_READY_SDLC_SKILL_NAME,
  FORBIDDEN_PRODUCTION_ROUTING_PATTERNS,
  GLOBAL_AGENTS_FANOUT_CONTINUATION_TOKENS,
  GLOBAL_AGENTS_TRIGGER_TOKENS,
  LIFECYCLE_ROLE_ROUTES,
  MAINTENANCE_ROUTING_FILES,
} from "./contracts/skills.ts";
import {
  ALLOWED_SDET_QUALITY_ENGINEER_BASH_RULES,
  ALLOWED_SDET_QUALITY_ENGINEER_EDIT_RULES,
  SDET_QUALITY_ENGINEER_DENIED_PERMISSION_KEYS,
  SDET_QUALITY_ENGINEER_FILE,
  SDET_QUALITY_ENGINEER_REQUIRED_TEXT,
} from "./contracts/sdet-quality-engineer.ts";
import {
  FINAL_CANDIDATE_REVIEWER_FILE,
  FINAL_CANDIDATE_REVIEWER_REQUIRED_TEXT,
} from "./contracts/agents.ts";
import { IMPLEMENTATION_WORKER_CONTINUATION_REQUIRED_TEXT } from "./contracts/implementation-worker.ts";
import {
  assert,
  assertDeepEqual,
  assertEqual,
  libraryRoot,
  sectionBetween,
  taskSectionBetween,
  type TestCase,
} from "./test-helpers/library.ts";

const root = libraryRoot;

const EXPECTED_SDET_QUALITY_ENGINEER_DENIED_PERMISSION_KEYS = [
  "task",
  "question",
  "dream_team_*",
  "skill",
  "webfetch",
  "websearch",
  "todowrite",
  "external_directory",
  "lsp",
  "doom_loop",
];

const EXPECTED_SDET_QUALITY_ENGINEER_REQUIRED_TEXT = [
  "fresh context",
  "test-only write scope",
  "co-located",
  "risk/oracle matrix",
  "Prefer real boundaries",
  "mock",
  "authored-tests",
  "assessed-existing-tests",
  "blocked",
  "provisional",
  "final",
  "same SDET context",
  "Never fix production",
  "Never self-approve",
  "run shell",
  "SDET_QUALITY_REPORT",
  "Phase: provisional | final",
  "Action: authored-tests | assessed-existing-tests | blocked",
  "Input Semantic Candidate Identity",
  "Input Package Identity",
  "Semantic Candidate Identity",
  "Package Identity",
  "Identity Recipe",
  "pending orchestrator recapture after test edits",
  "Qualification gates bind to Semantic Candidate Identity",
  "distinct effective model",
  "same-model correlation risk",
  "Effective Model:",
  "Model Independence:",
  "Risk And Oracle Matrix",
  "Test Changes Or Existing Evidence",
  "Requested Validation Procedures",
  "Validation Outcomes Received",
  "Blockers",
  "Residual Risks",
  "Actionable Continuation Items",
];

const EXPECTED_FINAL_CANDIDATE_REVIEWER_REQUIRED_TEXT = [
  "## Contract Reference",
  "`instructions/leaf-reviewer-agent-contract.md`",
  "fresh read-only",
  "post-SDET",
  "post-validation",
  "complete current candidate",
  "final SDET",
  "evidence-backed SDET `N/A`",
  "proven non-behavioral",
  "behavior-changing or test-content",
  "project-native validation",
  "approved | approved_with_notes | changes_requested | blocked",
  "Semantic Candidate Identity",
  "Package Identity",
  "Identity Recipe",
  "Qualification gates bind to Semantic Candidate Identity",
  "Missing, incomplete, or unreproducible Identity Recipe blocks",
  "post-test Applicable Proof",
  "missing post-test Applicable Proof replay",
  "Findings",
  "Evidence Type",
  "Likely Root Cause",
  "Artifact Owner",
  "Recommendation",
  "Confidence",
  "Needs external reviewer",
  "Blockers",
  "Residual Risks",
  "Actionable Continuation Items",
  "validation provenance only",
  "directly readable",
  "FINAL_CANDIDATE_REVIEW_REPORT",
];

const EXPECTED_CHANGE_READY_SDLC_LIFECYCLE_MARKERS = [
  "Adapter Discovery",
  "Profile: Small | Material",
  "Authoritative Brief",
  "Applicable Proof",
  "SDET Provisional Report",
  "Candidate Freeze",
  "Project-Native Validation",
  "Final Candidate Review",
  "Change-Ready Decision",
];

const EXPECTED_CHANGE_READY_SDLC_FORBIDDEN_TOKENS = [
  "npm ",
  "pnpm ",
  "yarn ",
  "node ",
  "cargo ",
  "go test",
  "dotnet ",
  "git ",
  "gh ",
  "openspec ",
  "dream_team_",
  "session_delivery_context",
  ".github/",
  "Windows",
  "Linux",
  "macOS",
];

const EXPECTED_CHANGE_READY_SDLC_CONTINUATION_TOKENS = [
  "create or resume specialist sessions",
  "runtime session/task identity",
  "orchestrator-owned fan-out",
  "independent isolated or exact non-overlapping",
  "same production-author context",
  "discovered runtime continuation adapter",
  "exact current Semantic Candidate Identity, Package Identity, and Identity Recipe",
  "explicit objective text",
  "explicit brief delta",
  "unchanged forbidden actions",
  "blocks, times out, is cancelled",
  "missing report",
  "partial mutation",
  "do not freeze, prove, or qualify",
  "Corrected-candidate SDET",
  "does not preserve Applicable Proof",
  "fresh and read-only",
  "terminal report is received",
  "adapter-proven terminal cessation",
  "Cancellation request or acknowledgement alone is not closure",
  "workspace/write authority is isolated or revoked",
  "Recorded timeout, cancel, or missing report alone is not closure",
  "Unknown liveness or unisolated ownership",
  "Late output or late mutation",
  "Universal writer attempt closure",
  "every writer dispatch/attempt",
  "mutation-capable",
  "serial or fan-out",
  "active primary parent identity",
  "child session/task identity",
  "expected child role/context",
  "Top-level/default-primary fallback is not specialist evidence",
  "Unavailable or unverifiable child",
  "Semantic Candidate Identity",
  "Package Identity",
  "Identity Recipe",
  "Qualification gates bind to Semantic Candidate Identity",
  "deterministic candidate identity-generation capability",
  "adapter-owned",
  "adapter-enumerated",
  "directly readable under the reviewer's effective permissions",
  "External path references alone are insufficient",
  "Input Semantic Candidate Identity",
  "Input Package Identity",
  "pending orchestrator recapture after test edits",
  "Authored-tests identity handshake",
  "post-test Applicable Proof",
  "missing post-test proof continuity after authored-tests",
  "do not replay proof solely for SDET assessment",
  "Rollback plan and evidence",
  "executed only when separately authorized",
  "never required to claim Change-Ready",
  "entire authoritative scoped candidate manifest",
  "unjournaled sequential in-place rollback",
  "isolated workspace or project-native snapshot",
  "failure-atomic",
  "journaled",
  "never substitutes for",
  "Runtime activation rollback",
  "does not count as full change rollback",
  "Delivery/readiness gate",
  "explicitly accepted conforming delivery result",
];
const EXPECTED_GLOBAL_AGENTS_FANOUT_CONTINUATION_TOKENS = [
  "create or resume specialist sessions",
  "runtime session/task identity",
  "orchestrator-owned fan-out",
  "independent isolated or exact non-overlapping",
  "same production-author context",
  "discovered runtime continuation adapter",
  "exact current Semantic Candidate Identity, Package Identity, and Identity Recipe",
  "explicit objective text",
  "explicit brief delta",
  "unchanged forbidden actions",
  "blocks, times out, is cancelled",
  "missing report",
  "partial mutation",
  "do not freeze, prove, or qualify",
  "Corrected-candidate SDET",
  "never preserves Applicable Proof",
  "fresh read-only context",
  "terminal report is received",
  "adapter-proven terminal cessation",
  "Cancellation request or acknowledgement alone is not closure",
  "workspace/write authority is isolated or revoked",
  "Recorded timeout, cancel, or missing report alone is not closure",
  "Unknown liveness or unisolated ownership",
  "Late output or late mutation",
  "Universal writer attempt closure",
  "every writer dispatch/attempt",
  "mutation-capable",
  "serial or fan-out",
  "active primary parent identity",
  "child session/task identity",
  "expected child role/context",
  "Top-level/default-primary fallback is not specialist evidence",
  "Unavailable or unverifiable child",
];
const EXPECTED_IMPLEMENTATION_WORKER_CONTINUATION_REQUIRED_TEXT = [
  "## Same-Slice Continuation",
  "Only the main-session orchestrator may resume",
  "Never self-resume",
  "never nest agents",
  "create or resume specialist sessions",
  "complete continuation brief",
  "exact current Semantic Candidate Identity, Package Identity, and Identity Recipe",
  "explicit objective text",
  "explicit brief delta",
  "unchanged forbidden actions",
  "original exact production ownership/write scope",
  "role, objective, and original exact production ownership/write scope",
  "role, objective, ownership, or material scope",
  "prior Applicable Proof",
];

const EXPECTED_LIFECYCLE_ROLE_ROUTES = [
  "implementation-worker",
  "sdet-quality-engineer",
  "final-candidate-reviewer",
];
const EXPECTED_MAINTENANCE_ROUTING_FILES = [
  "REPO_AGENTS.md",
  "global/AGENTS.md",
  "instructions/reusable-project-agent-instructions.md",
  "templates/project/AGENTS.md",
];
const EXPECTED_GLOBAL_AGENTS_TRIGGER_TOKENS = [
  "change-ready-sdlc",
  "Before the first mutation",
  "sole orchestrator",
  "Authoritative Brief",
  "Small",
  "Material",
  "If the skill is unavailable",
  "block behavior-changing mutation",
];
const EXPECTED_FORBIDDEN_PRODUCTION_ROUTING_PATTERNS = [
  {
    needle: "Small behavior-changing production work may be implemented directly by the main session when the change is local and reversible.",
    diagnostic: "unsafe direct main-session behavior-changing production routing",
  },
  {
    needle: "If `implementation-worker` is unavailable, the main session may edit behavior-changing production directly to avoid blocking.",
    diagnostic: "unsafe unavailable-worker main-session production fallback",
  },
];

export const changeReadyContractTests: TestCase[] = [
  {
    name: "contracts: SDET agent permission and text contracts are byte-equal",
    run: () => {
      assertEqual(SDET_QUALITY_ENGINEER_FILE, "sdet-quality-engineer.md", "SDET filename drifted.");
      assertDeepEqual(
        [...SDET_QUALITY_ENGINEER_DENIED_PERMISSION_KEYS],
        EXPECTED_SDET_QUALITY_ENGINEER_DENIED_PERMISSION_KEYS,
        "SDET denied permission keys drifted.",
      );
      assertDeepEqual(
        [...SDET_QUALITY_ENGINEER_REQUIRED_TEXT],
        EXPECTED_SDET_QUALITY_ENGINEER_REQUIRED_TEXT,
        "SDET required text drifted.",
      );
      assertEqual(ALLOWED_SDET_QUALITY_ENGINEER_BASH_RULES.get("permission.bash"), "deny", "SDET bash deny policy drifted.");
      assertEqual(ALLOWED_SDET_QUALITY_ENGINEER_EDIT_RULES.get("permission.edit"), "allow", "SDET edit allow policy drifted.");
    },
  },
  {
    name: "contracts: final candidate reviewer structured-report text is byte-equal",
    run: () => {
      assertEqual(FINAL_CANDIDATE_REVIEWER_FILE, "final-candidate-reviewer.md", "Final reviewer filename drifted.");
      assertDeepEqual(
        [...FINAL_CANDIDATE_REVIEWER_REQUIRED_TEXT],
        EXPECTED_FINAL_CANDIDATE_REVIEWER_REQUIRED_TEXT,
        "Final reviewer required text drifted.",
      );
    },
  },
  {
    name: "contracts: final-review instruction accepts complete non-behavioral SDET N/A evidence and rejects behavior or test-content use",
    run: () => {
      const reviewer = fs.readFileSync(path.join(root, "global", "agents", "final-candidate-reviewer.md"), "utf8");
      const preconditions = sectionBetween(reviewer, "## Runtime Preconditions", "## Leaf Boundaries");
      const checks = sectionBetween(reviewer, "## Checks", "## Verdict Rules");
      for (const token of [
        "evidence-backed SDET `N/A` with rationale, current identities and Identity Recipe, proof boundary, and validation",
        "allowed only for proven non-behavioral work",
        "behavior-changing or test-content work cannot use `N/A`",
      ]) {
        assert(preconditions.includes(token), `Final-review SDET N/A precondition missing positive/negative oracle: ${token}`);
      }
      for (const token of [
        "evidence-backed SDET `N/A` is present only for proven non-behavioral work",
        "includes rationale, current identities and Identity Recipe, proof boundary, and validation",
        "reject `N/A` for behavior-changing or test-content work",
      ]) {
        assert(checks.includes(token), `Final-review SDET N/A check missing positive/negative oracle: ${token}`);
      }
      const globalAgents = fs.readFileSync(path.join(root, "global", "AGENTS.md"), "utf8");
      assert(
        globalAgents.includes("Evidence-backed SDET `N/A` is allowed only for proven non-behavioral work; reject `N/A` for behavior-changing or test-content candidates"),
        "Global final-review routing must reject SDET N/A for behavior-changing or test-content candidates.",
      );
    },
  },
  {
    name: "contracts: Change-Ready skill D13 static contract is byte-equal",
    run: () => {
      assertEqual(CHANGE_READY_SDLC_SKILL_NAME, "change-ready-sdlc", "Change-Ready skill name drifted.");
      assertDeepEqual(
        [...CHANGE_READY_SDLC_LIFECYCLE_MARKERS],
        EXPECTED_CHANGE_READY_SDLC_LIFECYCLE_MARKERS,
        "Change-Ready lifecycle markers drifted.",
      );
      assertDeepEqual(
        [...CHANGE_READY_SDLC_FORBIDDEN_TOKENS],
        EXPECTED_CHANGE_READY_SDLC_FORBIDDEN_TOKENS,
        "Change-Ready forbidden portable-hardcode tokens drifted.",
      );
      assertEqual(CHANGE_READY_SDLC_DUPLICATE_MARKER_THRESHOLD, 6, "Change-Ready duplicate marker threshold drifted.");
    },
  },
  {
    name: "contracts: routing validator imports canonical routing lists without local redeclaration",
    run: () => {
      assertDeepEqual([...LIFECYCLE_ROLE_ROUTES], EXPECTED_LIFECYCLE_ROLE_ROUTES, "Lifecycle role routes drifted.");
      assertDeepEqual([...MAINTENANCE_ROUTING_FILES], EXPECTED_MAINTENANCE_ROUTING_FILES, "Maintenance routing files drifted.");
      assertDeepEqual([...GLOBAL_AGENTS_TRIGGER_TOKENS], EXPECTED_GLOBAL_AGENTS_TRIGGER_TOKENS, "Global AGENTS trigger tokens drifted.");
      assertDeepEqual([...FORBIDDEN_PRODUCTION_ROUTING_PATTERNS], EXPECTED_FORBIDDEN_PRODUCTION_ROUTING_PATTERNS, "Forbidden production routing patterns drifted.");

      const routing = fs.readFileSync(path.join(root, "tools", "validators", "routing.ts"), "utf8");
      const skillsImport = routing.match(/import\s*\{([^}]*)\}\s*from\s*"\.\.\/contracts\/skills\.ts";/)?.[1] ?? "";
      for (const symbol of [
        "LIFECYCLE_ROLE_ROUTES",
        "MAINTENANCE_ROUTING_FILES",
        "FORBIDDEN_PRODUCTION_ROUTING_PATTERNS",
        "GLOBAL_AGENTS_TRIGGER_TOKENS",
      ]) {
        assert(skillsImport.includes(symbol), `routing.ts must import ${symbol} from contracts/skills.ts.`);
        assert(!new RegExp(`(?:const|let|var)\\s+${symbol}\\b`).test(routing), `routing.ts must not redeclare ${symbol}.`);
      }
    },
  },
  {
    name: "contracts: Small and Material classification keeps conservative routing",
    run: () => {
      const skill = fs.readFileSync(path.join(root, "global", "skills", "change-ready-sdlc", "SKILL.md"), "utf8");
      const profile = sectionBetween(skill, "## Profile: Small | Material", "## Adapter Discovery");
      for (const token of [
        "Initially classify exactly as `Small` or `Material`",
        "may escalate only from Small to Material",
        "never downgrade Material to Small",
        "clear requirements",
        "local reversible scope",
        "one affected boundary",
        "known focused validation",
        "no public-contract, persisted-data, migration, security, concurrency, deployment, or compatibility risk",
        "Any false or unknown condition selects Material",
        "Every behavior change still receives fresh independent SDET assessment",
        "SDET `N/A` is allowed only for evidence-backed non-behavioral work",
      ]) assert(profile.includes(token), `Change-Ready profile contract missing conservative-routing oracle: ${token}`);
    },
  },
  {
    name: "contracts: D15 fan-out and continuation token arrays are byte-equal",
    run: () => {
      assertDeepEqual(
        [...CHANGE_READY_SDLC_CONTINUATION_TOKENS],
        EXPECTED_CHANGE_READY_SDLC_CONTINUATION_TOKENS,
        "CHANGE_READY_SDLC_CONTINUATION_TOKENS drifted.",
      );
      assertDeepEqual(
        [...GLOBAL_AGENTS_FANOUT_CONTINUATION_TOKENS],
        EXPECTED_GLOBAL_AGENTS_FANOUT_CONTINUATION_TOKENS,
        "GLOBAL_AGENTS_FANOUT_CONTINUATION_TOKENS drifted.",
      );
      assertDeepEqual(
        [...IMPLEMENTATION_WORKER_CONTINUATION_REQUIRED_TEXT],
        EXPECTED_IMPLEMENTATION_WORKER_CONTINUATION_REQUIRED_TEXT,
        "IMPLEMENTATION_WORKER_CONTINUATION_REQUIRED_TEXT drifted.",
      );
    },
  },
  {
    name: "contracts: D15 live artifacts retain fan-out and safe-continuation text",
    run: () => {
      const skill = fs.readFileSync(path.join(root, "global", "skills", "change-ready-sdlc", "SKILL.md"), "utf8");
      const globalAgents = fs.readFileSync(path.join(root, "global", "AGENTS.md"), "utf8");
      const worker = fs.readFileSync(path.join(root, "global", "agents", "implementation-worker.md"), "utf8");
      for (const token of CHANGE_READY_SDLC_CONTINUATION_TOKENS) {
        assert(skill.includes(token), `Change-Ready skill live artifact missing D15 token: ${token}`);
      }
      for (const token of GLOBAL_AGENTS_FANOUT_CONTINUATION_TOKENS) {
        assert(globalAgents.includes(token), `global/AGENTS.md live artifact missing D15 token: ${token}`);
      }
      for (const token of IMPLEMENTATION_WORKER_CONTINUATION_REQUIRED_TEXT) {
        assert(worker.includes(token), `implementation-worker live artifact missing D15 token: ${token}`);
      }
    },
  },
  {
    name: "contracts: README manual installs retain shared runtime prerequisites and mandatory gates",
    run: () => {
      const readme = fs.readFileSync(path.join(root, "README.md"), "utf8");
      const manualSkills = sectionBetween(readme, "### Manual Skills", "### Manual Agents");
      const manualAgents = sectionBetween(readme, "### Manual Agents", "### Manual Commands");
      for (const [section, text] of [["Manual Skills", manualSkills], ["Manual Agents", manualAgents]]) {
        assert(text.includes("<active-global-config-dir>/AGENTS.md"), `README ${section} must require the active global AGENTS.md contracts.`);
        assert(text.includes("OPENCODE_CONFIG_DIR"), `README ${section} must resolve the active global config directory from OPENCODE_CONFIG_DIR.`);
        const hasExplicitDefaultFallback = text.includes("otherwise use `~/.config/opencode`")
          || text.includes("otherwise `~/.config/opencode`");
        assert(hasExplicitDefaultFallback, `README ${section} must use the default global config directory only when the override is unset.`);
        assert(text.includes("bypass"), `README ${section} must warn that OPENCODE_CONFIG_DIR bypasses the default global config directory.`);
        assert(text.includes("Prefer full-kit install"), `README ${section} must prefer full-kit install.`);
        assert(text.includes("Project-local `.opencode`"), `README ${section} must distinguish project-local paths from global install paths.`);
        assert(text.includes("do not replace the active global shared contracts"), `README ${section} must not treat project-local copies as shared-contract substitutes.`);
        assert(!text.includes("equivalent project-level contract"), `README ${section} must not allow a project-level substitute for shared global AGENTS.md.`);
        assert(!text.includes("project-level-equivalent substitute"), `README ${section} must not define a project-level-equivalent substitute.`);
      }
      assert(manualSkills.includes("- Project: `.opencode/skills/<name>/SKILL.md`"), "README Manual Skills must retain the project-local skill path.");
      assert(manualSkills.includes("- Global: `<active-global-config-dir>/skills/<name>/SKILL.md`"), "README Manual Skills must target the active global skill path.");
      assert(!manualSkills.includes("- Global: `~/.config/opencode/skills/"), "README Manual Skills must not unconditionally target the default global directory.");
      assert(manualAgents.includes("- Project: `.opencode/agents/<name>.md`"), "README Manual Agents must retain the project-local agent path.");
      assert(manualAgents.includes("- Global: `<active-global-config-dir>/agents/<name>.md`"), "README Manual Agents must target the active global agent path.");
      assert(!manualAgents.includes("- Global: `~/.config/opencode/agents/"), "README Manual Agents must not unconditionally target the default global directory.");
      for (const token of [
        "For optional domain reviewers",
        "one relevant gate by risk",
        "mandatory independent final review",
        "Portable Material delivery/readiness gates remain required",
      ]) {
        assert(readme.includes(token), `README optional-domain reviewer guidance missing mandatory-gate token: ${token}`);
      }
    },
  },
  {
    name: "contracts: UDL requires fresh corrected-candidate SDET and non-weakenable gate ordering",
    run: () => {
      const workflow = fs.readFileSync(path.join(root, "instructions", "universal-development-loop.md"), "utf8");
      const harden = sectionBetween(workflow, "9. `Harden`:", "10. `Review Gate`:");
      for (const token of [
        "A qualifying production correction invalidates prior SDET qualification",
        "requires a new fresh corrected-candidate testing subagent context",
        "only provisional→final reporting on an unchanged candidate may reuse the same testing subagent context",
      ]) {
        assert(harden.includes(token), `Universal Development Loop Harden stage missing corrected-candidate SDET token: ${token}`);
      }
      for (const stale of [
        "continue with the testing subagent",
        "continue with the same testing subagent",
        "This ordering changes only when the user or repository explicitly requires a different workflow.",
      ]) {
        assert(!workflow.includes(stale), `Universal Development Loop must not permit stale SDET reuse or ordering bypass: ${stale}`);
      }
      for (const token of [
        "Adapters and owner/project constraints may change commands, artifacts, add stricter gates, or stop work",
        "cannot weaken, reorder, or omit mandatory role separation, proof-before-SDET, corrected-candidate freshness, validation, independent final review, or applicable Material delivery while claiming Change-Ready",
        "A conflicting requested workflow is a constraint or blocker, not proof.",
      ]) {
        assert(workflow.includes(token), `Universal Development Loop missing non-weakenable lifecycle token: ${token}`);
      }
    },
  },
  {
    name: "contracts: serial production fallback never transfers authorship to main",
    run: () => {
      const globalAgents = fs.readFileSync(path.join(root, "global", "AGENTS.md"), "utf8");
      for (const token of [
        "sequential conforming-author dispatch",
        "Do not treat serial dispatch as permission for the main session to author behavior-changing production or automated-test artifacts",
        "Main must not fall back to direct edit/write as the production author",
      ]) {
        assert(globalAgents.includes(token), `global/AGENTS.md missing no-direct-main serial fallback contract: ${token}`);
      }
    },
  },
  {
    name: "contracts: SDLC-010 live artifacts retain fan-out barriers without concrete API mechanics",
    run: () => {
      const spec = fs.readFileSync(path.join(root, "openspec", "changes", "add-lightweight-sdet-pr-ready-sdlc", "specs", "library-change-ready-sdlc", "spec.md"), "utf8");
      const skill = fs.readFileSync(path.join(root, "global", "skills", "change-ready-sdlc", "SKILL.md"), "utf8");
      const globalAgents = fs.readFileSync(path.join(root, "global", "AGENTS.md"), "utf8");
      const fanoutSection = sectionBetween(globalAgents, "## Parallel Work And Delegation", "## Mode And Tool Precedence");

      for (const token of [
        "### Requirement: SDLC-010 The main orchestrator owns safe fan-out and specialist continuation",
        "discovered runtime fan-out adapter",
        "SHALL NOT invent a portable tool or API name",
        "SHALL NOT freeze, prove, or qualify",
        "explicit objective text continuous with the original production objective",
      ]) {
        assert(spec.includes(token), `SDLC-010 spec missing trace token: ${token}`);
      }
      for (const token of [
        "discovered runtime fan-out adapter",
        "do not freeze, prove, or qualify",
        "explicit objective text continuous with the original production objective",
      ]) {
        assert(skill.includes(token), `Change-Ready skill missing SDLC-010 runtime token: ${token}`);
      }
      for (const token of [
        "discovered runtime fan-out adapter",
        "do not treat serial blocking dispatch as background parallelism",
        "do not freeze, prove, or qualify",
        "explicit objective text continuous with the original production objective",
      ]) {
        assert(fanoutSection.includes(token), `global/AGENTS.md fan-out section missing adapter-neutral token: ${token}`);
      }
      for (const forbidden of ["Classify exactly once", "Task tool", "subagent_type", "dream_team_implement", "dream_team_review"]) {
        assert(!skill.includes(forbidden), `Change-Ready skill must not reintroduce forbidden concrete/obsolete wording: ${forbidden}`);
        assert(!fanoutSection.includes(forbidden), `global/AGENTS.md fan-out section must not prescribe concrete fan-out mechanics: ${forbidden}`);
      }
    },
  },
  {
    name: "contracts: SDLC-010 support scope includes reviewer-binding self-gate path",
    run: () => {
      const tasks = fs.readFileSync(path.join(root, "openspec", "changes", "add-lightweight-sdet-pr-ready-sdlc", "tasks.md"), "utf8");
      assert(tasks.includes("`tools/contracts/reviewer-binding.ts`"), "D13/support scope must retain exact reviewer-binding contract path.");
    },
  },
  {
    name: "contracts: one full named writer-closure definition covers writers, validation, generators, formatters, and live-mutator failures",
    run: () => {
      const skill = fs.readFileSync(path.join(root, "global", "skills", "change-ready-sdlc", "SKILL.md"), "utf8");
      const globalAgents = fs.readFileSync(path.join(root, "global", "AGENTS.md"), "utf8");
      for (const [artifact, text] of [["Change-Ready skill", skill], ["global/AGENTS.md", globalAgents]] as const) {
        for (const token of [
          "Universal writer attempt closure",
          "every mutation-capable execution—including every writer dispatch/attempt and every mutation-capable validation, generator, or formatter command—remains open after timeout, cancel, missing report, partial mutation, or unknown liveness",
          "adapter-proven terminal cessation is established (cancellation counts only after the writer or execution can no longer execute or mutate)",
          "Recorded timeout, cancel, or missing report alone is not closure",
          "Cancellation request or acknowledgement alone is not closure",
          "Unknown liveness or unisolated ownership blocks integration, freeze, proof, and qualification",
          "Late output or late mutation after the attempt boundary invalidates the qualification attempt and does not close a still-live mutator",
          "orchestrator-owned fan-out",
          "independent isolated or exact non-overlapping",
          "discovered runtime fan-out adapter",
          "do not freeze, prove, or qualify",
        ]) {
          assert(text.includes(token), `${artifact} missing universal writer/fan-out closure token: ${token}`);
        }
      }
      assertEqual(
        skill.split("**Universal writer attempt closure (serial or fan-out):**").length - 1,
        1,
        "Canonical skill must contain exactly one full named Universal writer attempt closure definition.",
      );
      assertEqual(
        skill.split("Universal writer attempt closure").length - 1,
        3,
        "Canonical skill must retain one full definition and two concise non-weakened references.",
      );
      assert(
        skill.includes("Any mutation, including late writer mutation after the attempt boundary, invalidates and abandons the current qualification attempt and affected evidence, but does not close a still-live mutation-capable execution"),
        "Canonical skill must separate qualification invalidation from live-mutator closure.",
      );
      assert(
        globalAgents.includes("Mutation invalidates qualification evidence but never closes a still-live mutation-capable execution"),
        "Always-loaded instructions must not treat mutation as closure of a live execution.",
      );

      const changeRoot = path.join(root, "openspec", "changes", "add-lightweight-sdet-pr-ready-sdlc");
      const spec = fs.readFileSync(path.join(changeRoot, "specs", "library-change-ready-sdlc", "spec.md"), "utf8");
      const tasks = fs.readFileSync(path.join(changeRoot, "tasks.md"), "utf8");
      assert(!spec.includes("Any mutation closes the attempt"), "Full SDLC spec must reject the stale live-mutator closure phrase.");
      const sdlc005 = sectionBetween(spec, "### Requirement: SDLC-005", "#### Scenario: agent-proposed command is not authority").replace(/\s+/g, " ");
      assert(
        sdlc005.includes("Any mutation SHALL invalidate and abandon the current qualification attempt and affected evidence, but SHALL NOT close a still-live mutation-capable execution"),
        "SDLC-005 must distinguish qualification invalidation from closure of a still-live mutation-capable execution.",
      );
      const normativeClosure = sectionBetween(spec, "Universal writer attempt closure applies", "For every dispatched specialist").replace(/\s+/g, " ");
      for (const token of [
        "every mutation-capable execution",
        "every writer dispatch/attempt",
        "every mutation-capable validation, generator, or formatter command",
        "Mutation SHALL invalidate qualification evidence but SHALL NOT close a still-live mutation-capable execution",
      ]) {
        assert(normativeClosure.includes(token), `SDLC-010 normative closure missing mutation-capable execution oracle: ${token}`);
      }
      assert(normativeClosure.includes("Late output or late mutation"), "Normative closure must retain the late-mutation invalidation oracle.");
      const fanoutScenario = sectionBetween(spec, "#### Scenario: overlapping, coupled, or partial fan-out failure stays serial or blocked", "#### Scenario: serial writer timeout, cancel, or missing report stays open until terminal-or-isolated closure");
      const serialScenario = sectionBetween(spec, "#### Scenario: serial writer timeout, cancel, or missing report stays open until terminal-or-isolated closure", "#### Scenario: original production author corrects its own bounded defect");
      for (const token of ["overlapping or coupled work serial or blocked", "every slice is closed", "unknown liveness or unisolated ownership SHALL block", "late output or late mutation"]) {
        assert(fanoutScenario.includes(token), `SDLC-010 fan-out scenario missing closure token: ${token}`);
      }
      for (const token of ["single serial writer dispatch", "writer attempt SHALL remain open", "integration, freeze, proof, and qualification", "late output or late mutation"]) {
        assert(serialScenario.includes(token), `SDLC-010 serial-writer scenario missing closure token: ${token}`);
      }
      const task71 = taskSectionBetween(tasks, "7.1 Capture the complete scoped global instruction candidate", "7.3 Run `final-candidate-reviewer`").replace(/\s+/g, " ");
      assert(
        task71.includes("universal serial/fan-out writer attempt closure"),
        "Current OpenSpec task 7.1 missing universal serial/fan-out writer-closure trace.",
      );
    },
  },
  {
    name: "contracts: validation authority, mutation recapture, and unchanged-candidate failures remain blocking",
    run: () => {
      const skill = fs.readFileSync(path.join(root, "global", "skills", "change-ready-sdlc", "SKILL.md"), "utf8");
      const validation = sectionBetween(skill, "### 6. Project-Native Validation", "### 7. Correction routing and replay");
      for (const token of [
        "Record each exact authorized procedure and its trusted source before execution",
        "Agent suggestions do not expand authority",
        "If the candidate changes a validation definition or directly invoked tool/script, re-derive authorization from trusted project or owner evidence first",
        "After any procedure that may mutate artifacts, recapture the candidate",
        "Scoped mutation invalidates prior candidate-bound proof and gates",
      ]) {
        assert(validation.includes(token), `Project-Native Validation missing authority/recapture oracle: ${token}`);
      }

      const correction = sectionBetween(skill, "### 7. Correction routing and replay", "### 8. Final Candidate Review");
      for (const token of [
        "Unexplained fail/pass on an unchanged candidate remains blocked",
        "the same failure repeats without new root-cause evidence",
        "No universal numeric cycle cap",
      ]) {
        assert(correction.includes(token), `Correction replay missing retry-until-green blocking oracle: ${token}`);
      }
    },
  },
  {
    name: "contracts: profile, README routing, and catalogs register Change-Ready roles",
    run: () => {
      const profile = JSON.parse(fs.readFileSync(path.join(root, "profiles", "all.json"), "utf8")) as { skills: string[]; agents: string[] };
      for (const skill of ["change-ready-sdlc"] as const) {
        assert(profile.skills.includes(skill), `Profile must include skill: ${skill}`);
      }
      for (const agent of ["implementation-worker", "sdet-quality-engineer", "final-candidate-reviewer"] as const) {
        assert(profile.agents.includes(agent), `Profile must include agent: ${agent}`);
      }
      const readme = fs.readFileSync(path.join(root, "README.md"), "utf8");
      for (const token of [
        "UDL is conceptual guidance, not the sole operational authority",
        "Behavior-changing work -> load `change-ready-sdlc` before the first mutation",
        "Post-proof test risk/evidence and automated-test authorship -> fresh `sdet-quality-engineer`",
        "Final post-validation candidate review -> `final-candidate-reviewer`",
        "`change-ready-sdlc`: global instruction artifact",
        "`sdet-quality-engineer`: write-capable test-only SDET",
        "`final-candidate-reviewer`: fresh read-only final-candidate reviewer",
        "uses `session_delivery_context` when available",
      ]) {
        assert(readme.includes(token), `README must register Change-Ready route/catalog token: ${token}`);
      }
      const deliveryReviewer = fs.readFileSync(path.join(root, "global", "agents", "session-delivery-reviewer.md"), "utf8");
      assert(
        deliveryReviewer.includes("`session_delivery_context` is optional evidence when available, not a mandatory portable plugin dependency"),
        "Session delivery reviewer must keep session_delivery_context optional for portable operation.",
      );
    },
  },
  {
    name: "contracts: reusable routes discover a conforming SDET and README maps the independent final gate",
    run: () => {
      for (const relative of [
        "REPO_AGENTS.md",
        "instructions/reusable-project-agent-instructions.md",
        "templates/project/AGENTS.md",
      ]) {
        const text = fs.readFileSync(path.join(root, relative), "utf8");
        for (const token of [
          "fresh discovered conforming SDET session",
          "`sdet-quality-engineer` is the optional default SDET adapter only",
        ]) {
          assert(text.includes(token), `${relative} missing discovered-SDET routing oracle: ${token}`);
        }
        assert(!text.includes("dispatch a fresh `sdet-quality-engineer`"), `${relative} must not make the kit-named SDET a portable requirement.`);
      }

      const globalAgents = fs.readFileSync(path.join(root, "global", "AGENTS.md"), "utf8");
      assert(globalAgents.includes("Discover the project's production author, SDET, validation, and final-review adapters before dispatch"), "Global routing must discover the project SDET adapter.");
      assert(globalAgents.includes("`sdet-quality-engineer` is an optional default SDET adapter"), "Global routing must label the kit SDET as optional default only.");

      const readme = fs.readFileSync(path.join(root, "README.md"), "utf8");
      const reviewerMap = sectionBetween(readme, "## Reviewer Gate Map", "## OpenSpec Follow-Up Tracking");
      assert(
        reviewerMap.includes("Final post-SDET, post-validation candidate review of the complete current candidate -> `final-candidate-reviewer`"),
        "README Reviewer Gate Map must expose the independent final-candidate reviewer.",
      );
    },
  },
  {
    name: "contracts: runtime self-containment uses shared safety plus role-specific non-cross-satisfiable oracles",
    run: () => {
      const globalAgents = fs.readFileSync(path.join(root, "global", "AGENTS.md"), "utf8");
      const sdet = fs.readFileSync(path.join(root, "global", "agents", "sdet-quality-engineer.md"), "utf8");
      const finalReviewer = fs.readFileSync(path.join(root, "global", "agents", "final-candidate-reviewer.md"), "utf8");
      const delivery = fs.readFileSync(path.join(root, "global", "agents", "session-delivery-reviewer.md"), "utf8");
      for (const token of [
        "Read-only leaf",
        "No user questions, nested orchestration",
        "evidence-backed",
        "report-only",
      ]) {
        assert(globalAgents.includes(token), `Shared global reviewer safety missing token: ${token}`);
      }
      for (const token of [
        "SDET_QUALITY_REPORT",
        "Phase: provisional | final",
        "Action: authored-tests | assessed-existing-tests | blocked",
        "Input Semantic Candidate Identity",
        "Input Package Identity",
        "Never fix production",
        "Actionable Continuation Items",
      ]) {
        assert(sdet.includes(token), `SDET role body missing self-contained token: ${token}`);
      }
      for (const token of [
        "FINAL_CANDIDATE_REVIEW_REPORT",
        "Verdict: approved | approved_with_notes | changes_requested | blocked",
        "Semantic Candidate Identity",
        "Package Identity",
        "Identity Recipe",
        "Actionable Continuation Items",
      ]) {
        assert(finalReviewer.includes(token), `Final-review role body missing self-contained token: ${token}`);
      }
      for (const token of [
        "You are a read-only session delivery reviewer",
        "`Change-Ready`: yes | no",
        "`Semantic Candidate Identity`",
        "`Package Identity`",
        "`Identity Recipe`",
        "`Required Next Actions`",
        "`Actionable Continuation Items`",
      ]) {
        assert(delivery.includes(token), `Session-delivery role body missing self-contained token: ${token}`);
      }
      for (const [label, text] of [["global safety", globalAgents], ["SDET", sdet], ["final reviewer", finalReviewer], ["delivery reviewer", delivery]] as const) {
        assert(!text.includes("## Leaf Contract\n"), `${label} must not depend on an inlined external Leaf Contract body.`);
      }
    },
  },
];
