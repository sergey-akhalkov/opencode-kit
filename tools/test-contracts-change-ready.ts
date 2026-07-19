import fs from "node:fs";
import path from "node:path";

import {
  CHANGE_READY_SDLC_CLOSED_WORLD_MARKERS,
  CHANGE_READY_SDLC_CONTINUATION_TOKENS,
  CHANGE_READY_SDLC_DUPLICATE_MARKER_THRESHOLD,
  CHANGE_READY_SDLC_FORBIDDEN_TOKENS,
  CHANGE_READY_SDLC_LIFECYCLE_MARKERS,
  CHANGE_READY_SDLC_SKILL_NAME,
  FORBIDDEN_PRODUCTION_ROUTING_PATTERNS,
  FORBIDDEN_PRODUCTION_ROUTING_SCAN_FILES,
  GLOBAL_AGENTS_CLOSED_WORLD_MARKERS,
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
  REVIEWER_SDET_FORBIDDEN_ACTION_FIELDS,
} from "./contracts/agents.ts";
import {
  CLOSED_WORLD_FORBIDDEN_AUTHORITY_PATTERNS,
  CLOSED_WORLD_SCOPE_MARKERS,
  CLOSED_WORLD_SCOPE_SURFACES,
  REGISTERED_REVIEWER_OUTPUT_FIELD_TEXT,
} from "./contracts/reviewer-binding.ts";
import { IMPLEMENTATION_WORKER_CONTINUATION_REQUIRED_TEXT } from "./contracts/implementation-worker.ts";
import {
  assert,
  assertDeepEqual,
  assertEqual,
  libraryRoot,
  sectionBetween,
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
  "Never fix production",
  "Never self-approve",
  "run shell",
  "SDET_QUALITY_REPORT",
  "Action: authored-tests | assessed-existing-tests | blocked",
  "Candidate Reference",
  "distinct effective model",
  "same-model correlation risk",
  "Effective Model:",
  "Model Independence:",
  "Risk And Oracle Matrix",
  "Test Changes Or Existing Evidence",
  "Requested Validation Procedures",
  "Blockers",
  "Residual Risks",
  "Blocking Evidence",
  "Follow-up Candidates",
  "never authorize",
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
  "approved | approved_with_notes | rejected | blocked",
  "Candidate Reference",
  "qualification gate",
  "Findings",
  "Evidence Type",
  "Likely Root Cause",
  "Artifact Owner",
  "Recommendation",
  "Confidence",
  "Needs external reviewer",
  "Blockers",
  "Residual Risks",
  "Blocking Evidence",
  "Follow-up Candidates",
  "never authorize",
  "validation provenance only",
  "directly readable",
  "FINAL_CANDIDATE_REVIEW_REPORT",
];

const EXPECTED_CHANGE_READY_SDLC_LIFECYCLE_MARKERS = [
  "Adapter Discovery",
  "Profile: Ordinary Small | Material",
  "Authoritative Brief",
  "Applicable Proof",
  "Candidate Reference",
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
  "Candidate Reference",
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
  "mutation-capable",
  "serial or fan-out",
  "active primary parent identity",
  "child session/task identity",
  "expected child role/context",
  "Top-level/default-primary fallback is not specialist evidence",
  "Unavailable or unverifiable child",
  "directly readable under the reviewer's effective permissions",
  "External path references alone are insufficient",
  "Delivery/readiness gate",
  "explicitly accepted conforming delivery result",
  "Rollback plan",
  "executed only when separately authorized",
  "never required to claim Change-Ready",
];

const EXPECTED_GLOBAL_AGENTS_FANOUT_CONTINUATION_TOKENS = [
  "create or resume specialist sessions",
  "runtime session/task identity",
  "orchestrator-owned fan-out",
  "independent isolated or exact non-overlapping",
  "same production-author context",
  "discovered runtime continuation adapter",
  "Candidate Reference",
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
  "Candidate Reference",
  "reproducer",
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

const EXPECTED_FORBIDDEN_PRODUCTION_ROUTING_SCAN_FILES = [
  "REPO_AGENTS.md",
  "global/AGENTS.md",
  "instructions/reusable-project-agent-instructions.md",
  "templates/project/AGENTS.md",
  "global/skills/change-ready-sdlc/SKILL.md",
  "instructions/universal-development-loop.md",
  "global/agents/implementation-worker.md",
  "global/agents/sdet-quality-engineer.md",
  "global/agents/final-candidate-reviewer.md",
  "global/agents/session-delivery-reviewer.md",
  "global/agents/implementation-readiness-reviewer.md",
  "global/agents/test-coverage-reviewer.md",
];

const EXPECTED_GLOBAL_AGENTS_TRIGGER_TOKENS = [
  "change-ready-sdlc",
  "Ordinary Small",
  "Material",
  "Change-Ready: not requested",
  "explicit user approval",
  "sole orchestrator",
  "Before the first mutation",
  "If the skill is unavailable",
  "block behavior-changing mutation",
];

const EXPECTED_FORBIDDEN_PRODUCTION_ROUTING_PATTERNS = [
  {
    needle: "Any false or unknown condition selects Material",
    diagnostic: "old universal unknown-forces-Material routing",
  },
  {
    needle: "Every behavior change still receives fresh independent SDET assessment",
    diagnostic: "old universal fresh-SDET-for-every-behavior-change routing",
  },
  {
    needle: "Small behavior-changing production work may be implemented directly by the main session when the change is local and reversible.",
    diagnostic: "obsolete Small-label direct-main sentence; use Ordinary Small wording instead",
  },
  {
    needle: "If `implementation-worker` is unavailable, the main session may edit behavior-changing production directly to avoid blocking.",
    diagnostic: "unsafe unavailable-worker main-session production fallback for Material/qualification work",
  },
  {
    needle: "Main must not fall back to direct edit/write as the production author for behavior-changing candidate production or automated-test artifacts.",
    diagnostic: "old universal ban on main Ordinary Small production authorship",
  },
  {
    needle: "exact current Semantic Candidate Identity, Package Identity, and Identity Recipe",
    diagnostic: "old mandatory dual-identity Identity Recipe wording",
  },
  {
    needle: "Qualification gates bind to Semantic Candidate Identity",
    diagnostic: "old Semantic Candidate Identity binding wording",
  },
  {
    needle: "Actionable Continuation Items",
    diagnostic: "superseded action-list field Actionable Continuation Items on production-routing surface",
  },
  {
    needle: "Required Next Actions",
    diagnostic: "superseded action-list field Required Next Actions on production-routing surface",
  },
  {
    needle: "changes_requested",
    diagnostic: "superseded final-review verdict changes_requested on production-routing surface",
  },
  {
    needle: "new blocking corrections or acceptance criteria require explicit owner approval or a reproducible P0/P1 defect",
    diagnostic: "superseded P0/P1 post-mutation scope-expansion exception",
  },
  {
    needle: "a new blocking candidate correction or new acceptance criterion requires either:",
    diagnostic: "superseded P0/P1 post-mutation scope-expansion exception in skill",
  },
  {
    needle: "Evidence tooling must not become a second product; it MAY be added only when a mandatory gate cannot be reproduced without it",
    diagnostic: "superseded persistent evidence-tool exception on production-routing surface",
  },
];

const EXPECTED_REVIEWER_SDET_FORBIDDEN_ACTION_FIELDS = [
  "Missing Tests",
  "Missing Golden Tests",
  "Missing Golden/Integration Tests",
  "Missing Decisions",
  "Required Evidence",
  "Benchmark Suggestions",
  "Validation Gaps",
  "Manual Gates",
  "Suggested Next Options",
  "Required Next Actions",
  "Actionable Continuation Items",
  "changes_requested",
];

const EXPECTED_REGISTERED_REVIEWER_OUTPUT_FIELD_TEXT = [
  "Blocking Evidence",
  "Follow-up Candidates",
];

const EXPECTED_EVIDENCE_ONLY_HANDOFF_FIELDS = [
  "Blocking Evidence",
  "Residual Risks",
  "Follow-up Candidates",
];

const EXPECTED_CLOSED_WORLD_SCOPE_MARKERS = [
  "post-freeze scope may only shrink",
  "new revision or separate change",
  "never authorize scope expansion",
  "Blocking Evidence",
  "Follow-up Candidates",
  "one correction wave",
  "frozen acceptance criterion",
];

const EXPECTED_CLOSED_WORLD_SCOPE_SURFACES = [
  "REPO_AGENTS.md",
  "global/AGENTS.md",
  "global/skills/change-ready-sdlc/SKILL.md",
  "instructions/reusable-project-agent-instructions.md",
  "instructions/universal-development-loop.md",
  "templates/project/AGENTS.md",
];

const EXPECTED_CLOSED_WORLD_FORBIDDEN_AUTHORITY_PATTERNS = [
  {
    needle: "Actionable Continuation Items",
    diagnostic: "superseded reviewer/SDET action-list field Actionable Continuation Items",
  },
  {
    needle: "Required Next Actions",
    diagnostic: "superseded delivery/reviewer action-list field Required Next Actions",
  },
  {
    needle: "changes_requested",
    diagnostic: "superseded final-review verdict changes_requested",
  },
  {
    needle: "Suggested Next Options",
    diagnostic: "superseded reviewer/subagent action-list field Suggested Next Options",
  },
  {
    needle: "actionable continuation items",
    diagnostic: "superseded generic actionable continuation items on loaded closed-world surface",
  },
  {
    needle: "new blocking corrections or acceptance criteria require explicit owner approval or a reproducible P0/P1 defect",
    diagnostic: "superseded P0/P1 post-mutation scope-expansion exception",
  },
  {
    needle: "a new blocking candidate correction or new acceptance criterion requires either:",
    diagnostic: "superseded P0/P1 post-mutation scope-expansion exception in skill",
  },
  {
    needle: "Keep `Required Next Actions` and final-review `changes_requested`",
    diagnostic: "superseded action-list binding authority",
  },
  {
    needle: "Replay only gates invalidated by a qualifying P0/P1 correction or a failed mandatory gate",
    diagnostic: "superseded unbounded P0/P1 correction-replay authority",
  },
  {
    needle: "replay only gates invalidated by a qualifying P0/P1 correction or a failed mandatory gate",
    diagnostic: "superseded unbounded P0/P1 correction-replay authority",
  },
  {
    needle: "Evidence tooling must not become a second product; it MAY be added only when a mandatory gate cannot be reproduced without it",
    diagnostic: "superseded persistent evidence-tool exception",
  },
];

const EXPECTED_CHANGE_READY_SDLC_CLOSED_WORLD_MARKERS = [
  "post-freeze scope may only shrink",
  "new revision or separate change",
  "never authorize scope expansion",
  "Blocking Evidence",
  "Follow-up Candidates",
  "one correction wave",
  "frozen acceptance criterion",
  "approved | approved_with_notes | rejected | blocked",
  "persistent evidence infrastructure",
];

const EXPECTED_GLOBAL_AGENTS_CLOSED_WORLD_MARKERS = [
  "post-freeze scope may only shrink",
  "new revision or separate change",
  "never authorize scope expansion",
  "Blocking Evidence",
  "Follow-up Candidates",
  "one correction wave",
  "approved | approved_with_notes | rejected | blocked",
];

function assertTokens(text: string, tokens: readonly string[], message: string): void {
  for (const token of tokens) {
    assert(text.includes(token), `${message}: ${token}`);
  }
}

export const changeReadyContractTests: TestCase[] = [
  {
    name: "contracts: active SDET and final-review role contracts are byte-equal",
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
      assertEqual(FINAL_CANDIDATE_REVIEWER_FILE, "final-candidate-reviewer.md", "Final reviewer filename drifted.");
      assertDeepEqual(
        [...FINAL_CANDIDATE_REVIEWER_REQUIRED_TEXT],
        EXPECTED_FINAL_CANDIDATE_REVIEWER_REQUIRED_TEXT,
        "Final reviewer required text drifted.",
      );
    },
  },
  {
    name: "contracts: active Change-Ready static routing arrays are byte-equal",
    run: () => {
      assertEqual(CHANGE_READY_SDLC_SKILL_NAME, "change-ready-sdlc", "Change-Ready skill name drifted.");
      assertDeepEqual([...CHANGE_READY_SDLC_LIFECYCLE_MARKERS], EXPECTED_CHANGE_READY_SDLC_LIFECYCLE_MARKERS, "Change-Ready lifecycle markers drifted.");
      assertDeepEqual([...CHANGE_READY_SDLC_FORBIDDEN_TOKENS], EXPECTED_CHANGE_READY_SDLC_FORBIDDEN_TOKENS, "Change-Ready forbidden portable-hardcode tokens drifted.");
      assertEqual(CHANGE_READY_SDLC_DUPLICATE_MARKER_THRESHOLD, 6, "Change-Ready duplicate marker threshold drifted.");
      assertDeepEqual([...CHANGE_READY_SDLC_CONTINUATION_TOKENS], EXPECTED_CHANGE_READY_SDLC_CONTINUATION_TOKENS, "Change-Ready continuation tokens drifted.");
      assertDeepEqual([...GLOBAL_AGENTS_FANOUT_CONTINUATION_TOKENS], EXPECTED_GLOBAL_AGENTS_FANOUT_CONTINUATION_TOKENS, "Global fan-out tokens drifted.");
      assertDeepEqual([...IMPLEMENTATION_WORKER_CONTINUATION_REQUIRED_TEXT], EXPECTED_IMPLEMENTATION_WORKER_CONTINUATION_REQUIRED_TEXT, "Implementation-worker continuation tokens drifted.");
      assertDeepEqual([...LIFECYCLE_ROLE_ROUTES], EXPECTED_LIFECYCLE_ROLE_ROUTES, "Lifecycle role routes drifted.");
      assertDeepEqual([...MAINTENANCE_ROUTING_FILES], EXPECTED_MAINTENANCE_ROUTING_FILES, "Maintenance routing files drifted.");
      assertDeepEqual([...GLOBAL_AGENTS_TRIGGER_TOKENS], EXPECTED_GLOBAL_AGENTS_TRIGGER_TOKENS, "Global AGENTS trigger tokens drifted.");
      assertDeepEqual([...FORBIDDEN_PRODUCTION_ROUTING_PATTERNS], EXPECTED_FORBIDDEN_PRODUCTION_ROUTING_PATTERNS, "Forbidden old-policy patterns drifted.");
      assertDeepEqual([...REVIEWER_SDET_FORBIDDEN_ACTION_FIELDS], EXPECTED_REVIEWER_SDET_FORBIDDEN_ACTION_FIELDS, "Reviewer/SDET forbidden action fields drifted.");
      assertDeepEqual([...REGISTERED_REVIEWER_OUTPUT_FIELD_TEXT], EXPECTED_REGISTERED_REVIEWER_OUTPUT_FIELD_TEXT, "Registered reviewer output fields drifted.");
      assertDeepEqual([...CLOSED_WORLD_SCOPE_MARKERS], EXPECTED_CLOSED_WORLD_SCOPE_MARKERS, "Closed-world scope markers drifted.");
      assertDeepEqual([...CLOSED_WORLD_SCOPE_SURFACES], EXPECTED_CLOSED_WORLD_SCOPE_SURFACES, "Closed-world scope surfaces drifted.");
      assertDeepEqual([...CLOSED_WORLD_FORBIDDEN_AUTHORITY_PATTERNS], EXPECTED_CLOSED_WORLD_FORBIDDEN_AUTHORITY_PATTERNS, "Closed-world forbidden authority patterns drifted.");
      assertDeepEqual([...CHANGE_READY_SDLC_CLOSED_WORLD_MARKERS], EXPECTED_CHANGE_READY_SDLC_CLOSED_WORLD_MARKERS, "Canonical skill closed-world markers drifted.");
      assertDeepEqual([...GLOBAL_AGENTS_CLOSED_WORLD_MARKERS], EXPECTED_GLOBAL_AGENTS_CLOSED_WORLD_MARKERS, "Global AGENTS closed-world markers drifted.");
    },
  },
  {
    name: "contracts: registered reviewers and SDET expose evidence-only output while qwen remains outside that role registry",
    run: () => {
      const registeredRoleFiles = [
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
        "final-candidate-reviewer.md",
        "sdet-quality-engineer.md",
      ];
      for (const fileName of registeredRoleFiles) {
        const text = fs.readFileSync(path.join(root, "global", "agents", fileName), "utf8");
        assertTokens(text, EXPECTED_EVIDENCE_ONLY_HANDOFF_FIELDS, `${fileName} missing evidence-only output field`);
        for (const forbidden of EXPECTED_REVIEWER_SDET_FORBIDDEN_ACTION_FIELDS) {
          assert(!text.includes(forbidden), `${fileName} must not expose superseded action authority: ${forbidden}`);
        }
      }

      const leafContractPath = path.join(root, "instructions", "leaf-reviewer-agent-contract.md");
      const leafContract = fs.readFileSync(leafContractPath, "utf8");
      assertTokens(leafContract, EXPECTED_EVIDENCE_ONLY_HANDOFF_FIELDS, "Shared leaf-reviewer contract missing evidence-only output field");
      for (const forbidden of EXPECTED_REVIEWER_SDET_FORBIDDEN_ACTION_FIELDS) {
        assert(!leafContract.includes(forbidden), `Shared leaf-reviewer contract must not expose superseded action authority: ${forbidden}`);
      }

      const qwen = fs.readFileSync(path.join(root, "global", "agents", "qwen-local-worker.md"), "utf8");
      assert(qwen.includes("Actionable Continuation Items"), "qwen-local-worker must retain its non-registered-worker continuation field.");
      assert(!EXPECTED_EVIDENCE_ONLY_HANDOFF_FIELDS.every((field) => qwen.includes(field)), "qwen-local-worker must not be forced into registered-reviewer output fields.");
    },
  },
  {
    name: "contracts: loaded authority surfaces preserve every closed-world marker and exclude every superseded authority phrase",
    run: () => {
      for (const relative of CLOSED_WORLD_SCOPE_SURFACES) {
        const text = fs.readFileSync(path.join(root, relative), "utf8");
        assertTokens(text, CLOSED_WORLD_SCOPE_MARKERS, `${relative} missing closed-world authority marker`);
        if (relative === "global/AGENTS.md" || relative === "REPO_AGENTS.md") {
          assertTokens(text, EXPECTED_EVIDENCE_ONLY_HANDOFF_FIELDS, `${relative} missing evidence-only handoff field`);
        }
        for (const forbidden of CLOSED_WORLD_FORBIDDEN_AUTHORITY_PATTERNS) {
          assert(!text.includes(forbidden.needle), `${relative} retains ${forbidden.diagnostic}`);
        }
      }
    },
  },
  {
    name: "contracts: forbidden-routing scan surfaces are locked separately from worker handoff surfaces",
    run: () => {
      assertDeepEqual(
        [...FORBIDDEN_PRODUCTION_ROUTING_SCAN_FILES],
        EXPECTED_FORBIDDEN_PRODUCTION_ROUTING_SCAN_FILES,
        "Forbidden production-routing scan files drifted.",
      );
      assertDeepEqual(
        [...MAINTENANCE_ROUTING_FILES],
        EXPECTED_MAINTENANCE_ROUTING_FILES,
        "Worker handoff maintenance routing files must remain the original four surfaces.",
      );
    },
  },
  {
    name: "contracts: Ordinary Small is direct, proof-first, focused, and non-qualifying by default",
    run: () => {
      const globalAgents = fs.readFileSync(path.join(root, "global", "AGENTS.md"), "utf8");
      const routing = sectionBetween(globalAgents, "## Change-Ready SDLC Routing", "## Shared Reviewer Runtime Invariants");
      assertTokens(routing, [
        "### Ordinary Small (default)",
        "Do **not** load `change-ready-sdlc` merely because code, config, or generated-output behavior changes",
        "Main may directly author Ordinary Small production changes",
        "implement the smallest complete happy path",
        "prove it observably",
        "run focused validation",
        "Prefer existing tests when sufficient",
        "Change-Ready: not requested",
      ], "Ordinary Small routing missing positive oracle");
      for (const mandatory of ["fresh SDET", "Identity Recipe", "Final Candidate Review", "Delivery/readiness gate"]) {
        assert(!routing.includes(`Ordinary Small requires ${mandatory}`), `Ordinary Small must not mandate qualification ceremony: ${mandatory}`);
      }

      const workflow = fs.readFileSync(path.join(root, "instructions", "universal-development-loop.md"), "utf8");
      assertTokens(workflow, [
        "Ordinary Small work may be authored directly by the main session",
        "Prefer existing tests when sufficient",
        "inspect only realistic requirement-linked edge cases inside the accepted boundary",
        "Ordinary Small completion does not require this gate",
        "Change-Ready: not requested",
      ], "Universal Development Loop missing proportional Ordinary Small behavior");
    },
  },
  {
    name: "contracts: unrequested expansion and theoretical polish require owner scope",
    run: () => {
      const globalAgents = fs.readFileSync(path.join(root, "global", "AGENTS.md"), "utf8");
      assertTokens(globalAgents, [
        "Any unrequested feature, abstraction, compatibility behavior, configuration, tooling, hardening, adjacent cleanup, new acceptance criterion, or other scope expansion must be proposed to the user",
        "must not be implemented until explicit user approval",
        "P2/note/theoretical/coverage-only items remain residual or separately approved follow-up",
      ], "Global scope-expansion policy missing exact approval oracle");

      const skill = fs.readFileSync(path.join(root, "global", "skills", "change-ready-sdlc", "SKILL.md"), "utf8");
      const scopeLock = sectionBetween(skill, "## Closed-world scope firewall", "## Orchestrator ownership");
      assertTokens(scopeLock, [
        "post-freeze scope may only shrink",
        "explicit owner approval",
        "new revision or separate change",
        "never authorize scope expansion",
        "P2/note, coverage-only gaps, optional evidence, and wording polish",
        "Residual Risks or non-authorizing `Follow-up Candidates`",
      ], "Qualification scope firewall missing owner-authority oracle");

      const spec = fs.readFileSync(path.join(root, "openspec", "specs", "library-change-ready-sdlc", "spec.md"), "utf8");
      assertTokens(spec, [
        "explicit Change-Ready does not become the later default",
        "unrelated baseline validation debt stays attributed",
        "839-line split candidate",
        "SHALL NOT trigger unrelated fixes inside this change",
      ], "Accepted one-change qualification and baseline-debt scenarios drifted");
    },
  },
  {
    name: "contracts: frozen scope capsule, correction predicates, unknown handling, and finite stop line remain explicit",
    run: () => {
      const skill = fs.readFileSync(path.join(root, "global", "skills", "change-ready-sdlc", "SKILL.md"), "utf8");
      const firewall = sectionBetween(skill, "## Closed-world scope firewall", "## Orchestrator ownership");
      assertTokens(firewall, [
        "frozen acceptance criterion IDs and exact observable statements",
        "frozen task IDs",
        "allowed write roots and exact allowed additions",
        "mandatory gate IDs, exact procedures, trusted sources, and baseline outcomes",
        "new criterion, task, gate, path, or evidence-tool IDs are not part of the current revision",
        "The finding references a frozen acceptance criterion ID",
        "A concrete reproducer demonstrates the violation on the current candidate",
        "Baseline-versus-candidate evidence shows the candidate introduced, worsened, or newly reached the violation",
        "The complete minimal correction remains inside frozen write roots and exact allowed artifacts",
        "the single correction wave remains unused",
        "Unknown never becomes implementation authority by itself",
        "requires a separate prerequisite change",
        "The corrected-candidate SDET never authorizes a second correction",
        "A second serious failure after the correction wave terminates the attempt",
        "Final and delivery review are accept-or-reject gates and never initiate autonomous correction or replay",
      ], "Canonical closed-world authority is missing a frozen-scope or terminal-wave oracle");

      const correction = sectionBetween(skill, "### 7. Correction routing and replay", "### 8. Final Candidate Review");
      assertTokens(correction, [
        "any serious finding from corrected-candidate SDET",
        "terminates the attempt",
        "Final-review or delivery rejection",
        "Terminal for current attempt",
      ], "Correction routing must stop after corrected-candidate or final/delivery failure");
    },
  },
  {
    name: "contracts: named Material triggers retain proof, SDET, validation, final review, and delivery",
    run: () => {
      const globalAgents = fs.readFileSync(path.join(root, "global", "AGENTS.md"), "utf8");
      const routing = sectionBetween(globalAgents, "### Material and qualification triggers", "### Qualification path (when skill is loaded)");
      assertTokens(routing, [
        "explicit Change-Ready request",
        "project-required qualification",
        "public API/protocol/compatibility semantics",
        "persisted data or migration",
        "security/privacy/authorization",
        "destructive or remote action",
        "concurrency correctness",
        "deployment/release",
        "loaded instruction/configuration change that alters lifecycle or safety policy",
        "Unknown escalates only when it can materially change accepted behavior",
        "High-risk behavior must not be downgraded merely because the diff is small",
      ], "Global Material trigger set drifted");
      assert(
        globalAgents.includes("If ambiguity affects outcome, risk, scope, data, or public API, stop and ask one concise question"),
        "Ambiguous public semantics must stop for an owner decision before mutation.",
      );

      const skill = fs.readFileSync(path.join(root, "global", "skills", "change-ready-sdlc", "SKILL.md"), "utf8");
      assertTokens(skill, [
        "Applicable Proof",
        "Fresh independent SDET is required for Material/explicit qualification behavior changes",
        "Project-Native Validation",
        "Final Candidate Review",
        "Material work always supplies current task/evidence status to the discovered conforming delivery/readiness gate",
        "explicitly accepted conforming delivery result",
      ], "Material qualification gate set drifted");
    },
  },
  {
    name: "contracts: active qualification uses Candidate Reference and one SDET report",
    run: () => {
      const skill = fs.readFileSync(path.join(root, "global", "skills", "change-ready-sdlc", "SKILL.md"), "utf8");
      const candidateReference = sectionBetween(skill, "### 3. Candidate Reference", "### 4. Applicable Proof");
      assertTokens(candidateReference, [
        "readable scoped candidate evidence such as a diff, snapshot, manifest, revision, or equivalent",
        "Dual `Semantic Candidate Identity` / `Package Identity` / `Identity Recipe` are not portable requirements",
        "After test edits, recapture Candidate Reference before post-test proof and complete validation",
      ], "Candidate Reference lifecycle contract drifted");

      const sdet = fs.readFileSync(path.join(root, "global", "agents", "sdet-quality-engineer.md"), "utf8");
      const sdetOutput = sectionBetween(sdet, "## Output", "</SDET_QUALITY_REPORT>");
      assertTokens(sdetOutput, [
        "Action: authored-tests | assessed-existing-tests | blocked",
        "Candidate Reference:",
        "Risk And Oracle Matrix",
        "Requested Validation Procedures",
      ], "SDET single-report output drifted");
      for (const stale of ["Phase: provisional | final", "Input Semantic Candidate Identity", "Input Package Identity", "Identity Recipe:"]) {
        assert(!sdetOutput.includes(stale), `Active SDET output must not require old dual-identity handshake field: ${stale}`);
      }
      assert(sdet.includes("Return exactly one `SDET_QUALITY_REPORT` (no provisional/final dual-identity handshake)"), "SDET must use one report action.");
      assert(sdet.includes("Main owns post-test proof and complete validation"), "SDET must leave post-test proof and validation with main.");

      const finalReviewer = fs.readFileSync(path.join(root, "global", "agents", "final-candidate-reviewer.md"), "utf8");
      const finalOutput = sectionBetween(finalReviewer, "## Output", "</FINAL_CANDIDATE_REVIEW_REPORT>");
      const delivery = fs.readFileSync(path.join(root, "global", "agents", "session-delivery-reviewer.md"), "utf8");
      const deliveryOutput = delivery.slice(delivery.indexOf("## Output"));
      for (const [label, output] of [["final reviewer", finalOutput], ["delivery reviewer", deliveryOutput]] as const) {
        assert(output.includes("Candidate Reference"), `${label} output must expose Candidate Reference continuity.`);
        for (const stale of ["Semantic Candidate Identity:", "Package Identity:", "Identity Recipe:"]) {
          assert(!output.includes(stale), `${label} output must not require historical identity field: ${stale}`);
        }
      }
    },
  },
  {
    name: "contracts: invoked production, SDET, and final-review roles remain mutually exclusive",
    run: () => {
      const worker = fs.readFileSync(path.join(root, "global", "agents", "implementation-worker.md"), "utf8");
      const sdet = fs.readFileSync(path.join(root, "global", "agents", "sdet-quality-engineer.md"), "utf8");
      const finalReviewer = fs.readFileSync(path.join(root, "global", "agents", "final-candidate-reviewer.md"), "utf8");
      assertTokens(worker, [
        "Production-only",
        "Never create or modify automated tests",
        "Candidate Reference or reviewable diff, reproducer/outcome",
        "prior Applicable Proof",
      ], "Implementation worker role/continuation boundary drifted");
      assertTokens(sdet, ["test-only", "Never fix production", "Never self-approve"], "SDET role boundary drifted");
      assertTokens(finalReviewer, [
        "fresh read-only",
        "authored neither production nor tests",
        "qualification gate, not an ordinary Ordinary Small completion gate",
        "Missing dual identity or Identity Recipe must not universally block",
      ], "Final-review role boundary drifted");
    },
  },
  {
    name: "contracts: actual concurrent writers retain terminal-or-isolated closure without burdening synchronous edits",
    run: () => {
      const skill = fs.readFileSync(path.join(root, "global", "skills", "change-ready-sdlc", "SKILL.md"), "utf8");
      const globalAgents = fs.readFileSync(path.join(root, "global", "AGENTS.md"), "utf8");
      for (const [label, text] of [["skill", skill], ["global AGENTS", globalAgents]] as const) {
        assertTokens(text, [
          "Universal writer attempt closure",
          "actual asynchronous or concurrent mutation-capable executions",
          "terminal report is received",
          "adapter-proven terminal cessation",
          "workspace/write authority is isolated or revoked",
          "Recorded timeout, cancel, or missing report alone is not closure",
          "Unknown liveness or unisolated ownership blocks integration, freeze, proof, and qualification",
          "Late output or late mutation",
          "Ordinary synchronous direct edits do not require this full liveness protocol",
        ], `${label} missing concurrent-writer safety oracle`);
      }
    },
  },
  {
    name: "contracts: unrelated work and destructive or remote authority remain protected",
    run: () => {
      const globalAgents = fs.readFileSync(path.join(root, "global", "AGENTS.md"), "utf8");
      assertTokens(globalAgents, [
        "NEVER discard, revert, reset, delete",
        "Assume any unrecognized change is intentional user/teammate work",
        "Do not commit, push, merge, delete source artifacts, run destructive cleanup, or alter remote state unless explicitly requested",
        "destructive operations",
        "remote-state actions",
      ], "Unrelated-work or remote/destructive protection drifted");
    },
  },
  {
    name: "contracts: routing validator imports canonical policy lists without redeclaration",
    run: () => {
      const routing = fs.readFileSync(path.join(root, "tools", "validators", "routing.ts"), "utf8");
      const skillsImport = routing.match(/import\s*\{([^}]*)\}\s*from\s*"\.\.\/contracts\/skills\.ts";/)?.[1] ?? "";
      for (const symbol of [
        "LIFECYCLE_ROLE_ROUTES",
        "MAINTENANCE_ROUTING_FILES",
        "FORBIDDEN_PRODUCTION_ROUTING_PATTERNS",
        "FORBIDDEN_PRODUCTION_ROUTING_SCAN_FILES",
        "GLOBAL_AGENTS_TRIGGER_TOKENS",
      ]) {
        assert(skillsImport.includes(symbol), `routing.ts must import ${symbol} from contracts/skills.ts.`);
        assert(!new RegExp(`(?:const|let|var)\\s+${symbol}\\b`).test(routing), `routing.ts must not redeclare ${symbol}.`);
      }
    },
  },
  {
    name: "contracts: README exposes Ordinary Small default and conditional qualification routes",
    run: () => {
      const readme = fs.readFileSync(path.join(root, "README.md"), "utf8");
      assertTokens(readme, [
        "Ordinary Small clear/bounded/local/reversible work -> direct main implementation, observable proof, focused validation",
        "Report `Change-Ready: not requested`",
        "Material/explicit Change-Ready only: profile, brief, Candidate Reference, proof, SDET, validation, final review, Change-Ready decision",
        "Final post-SDET, post-validation candidate review of the complete current candidate -> `final-candidate-reviewer`",
        "independent final review and Portable Material delivery/readiness gates remain required only when Material/explicit qualification conditions apply",
      ], "README routing/catalog drifted");
    },
  },
];
