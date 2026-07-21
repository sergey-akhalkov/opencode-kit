import fs from "node:fs";
import path from "node:path";

import {
  CHANGE_READY_SDLC_CONTINUATION_TOKENS,
  CHANGE_READY_SDLC_DUPLICATE_MARKER_THRESHOLD,
  CHANGE_READY_SDLC_FORBIDDEN_TOKENS,
  CHANGE_READY_SDLC_LIFECYCLE_MARKERS,
  CHANGE_READY_SDLC_OUTCOME_AUTHORITY_MARKERS,
  CHANGE_READY_SDLC_PILOT_READY_MARKERS,
  CHANGE_READY_SDLC_SKILL_NAME,
  FORBIDDEN_PRODUCTION_ROUTING_PATTERNS,
  FORBIDDEN_PRODUCTION_ROUTING_SCAN_FILES,
  GLOBAL_AGENTS_DECISION_READY_HANDOFF_FIELDS,
  GLOBAL_AGENTS_FANOUT_CONTINUATION_TOKENS,
  GLOBAL_AGENTS_NON_WAIVABLE_RISK_CLAUSE,
  GLOBAL_AGENTS_OUTCOME_AUTHORITY_MARKERS,
  GLOBAL_AGENTS_OUTCOME_FIRST_MARKERS,
  GLOBAL_AGENTS_PROTECTED_BOUNDARY_CATEGORIES,
  GLOBAL_AGENTS_TRIGGER_TOKENS,
  LIFECYCLE_ROLE_ROUTES,
  MAINTENANCE_ROUTING_FILES,
  OUTCOME_FIRST_COMPLETE_POLICY_DUPLICATE_THRESHOLD,
  OUTCOME_FIRST_COMPLETE_POLICY_MARKERS,
  OUTCOME_FIRST_ROLE_DELTA_SURFACES,
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
  OUTCOME_AUTHORITY_FORBIDDEN_PATTERNS,
  OUTCOME_AUTHORITY_SCOPE_MARKERS,
  OUTCOME_AUTHORITY_SCOPE_SURFACES,
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
import {
  operativeTextOutsideFences,
  scanModelFacingMarkdownBody,
} from "./validators/active-authority.ts";

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
  "Keep Change-Ready and Pilot-Ready evidence separate",
  "does not automatically erase independently proven Pilot-Ready",
  "remove, narrow, reuse, local guard",
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
  {
    needle: "as detailed and unambiguous as possible",
    diagnostic: "superseded maximal OpenSpec pre-resolution wording",
  },
  {
    needle: "Pre-resolve every decision the implementer would otherwise have to make",
    diagnostic: "superseded maximal OpenSpec pre-resolve-every-decision wording",
  },
  {
    needle: "Pilot-Ready: yes` authorizes deployment",
    diagnostic: "Pilot-Ready must not authorize deployment",
  },
  {
    needle: "Pilot-Ready: yes authorizes deployment",
    diagnostic: "Pilot-Ready must not authorize deployment",
  },
  {
    needle: "Profile: Ordinary Small | Material | Pilot",
    diagnostic: "Pilot must not appear as a third lifecycle profile",
  },
  {
    needle: "add a third lifecycle profile",
    diagnostic: "third lifecycle profile is forbidden; profiles remain Ordinary Small | Material",
  },
  {
    needle: "evidence-format polish alone blocks Pilot-Ready",
    diagnostic: "evidence-format polish must not be an unconditional Pilot-Ready blocker",
  },
];

const EXPECTED_GLOBAL_AGENTS_OUTCOME_FIRST_MARKERS = [
  "technically enforced operating envelope",
  "Pilot-Ready: yes | no | not requested",
  "Ordinary Small | Material",
  "prose-only",
  "not containment",
  "remove unnecessary capability",
  "narrow users/data/interfaces",
  "reuse an existing platform/project mechanism",
  "local guard",
  "Neither disposition authorizes",
  "material residual-risk bundle",
  "cannot waive uncontrolled authorization",
  "bounded outcome and non-goals",
  "real-boundary happy-path proof",
  "focused project-native validation",
  "critical safety/data/authorization",
  "failure visibility",
  "disable/rollback/containment",
  "`Outcome`",
  "`Operating Envelope`",
  "`Non-Goals`",
  "`Non-Deferrable Invariants`",
  "`Observable Proof`",
  "`Material Residual Risks`",
  "`Stop Line`",
  "remove, narrow, reuse, local guard, then deferral",
];

const EXPECTED_CHANGE_READY_SDLC_PILOT_READY_MARKERS = [
  "Pilot-Ready Decision",
  "Pilot-Ready: yes | no | not requested",
  "not a third lifecycle profile",
  "Ordinary Small | Material",
  "complete Pilot safety floor is authoritative only in always-loaded global",
  "Neither disposition authorizes",
  "does not automatically erase independently proven Pilot-Ready",
  "does not undermine candidate identity/scope, proof, containment, safety floor, validation, or material-risk acceptance",
];

const EXPECTED_OUTCOME_FIRST_ROLE_DELTA_SURFACES = [
  "global/agents/implementation-worker.md",
  "global/agents/sdet-quality-engineer.md",
  "global/agents/implementation-readiness-reviewer.md",
  "global/agents/openspec-architecture-reviewer.md",
  "global/agents/final-candidate-reviewer.md",
  "global/agents/session-delivery-reviewer.md",
  "global/skills/deep-task-planning/SKILL.md",
  "global/skills/next-step/SKILL.md",
  "global/skills/service-architecture-design/SKILL.md",
  "global/skills/openspec-consistency-review/SKILL.md",
];

const EXPECTED_OUTCOME_FIRST_COMPLETE_POLICY_MARKERS = [
  "cannot waive uncontrolled authorization",
  "material residual-risk bundle",
  "Neither disposition authorizes",
  "prose-only limits are not containment",
  "Pilot-Ready Decision",
  "`Non-Deferrable Invariants`",
  "remove unnecessary capability",
  "not a third lifecycle profile",
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

const EXPECTED_OUTCOME_AUTHORITY_SCOPE_MARKERS = [
  "accepted outcome",
  "protected-boundary",
  "dependency closure",
  "never authorize mutation",
  "Blocking Evidence",
  "Follow-up Candidates",
  "correction wave",
  "root goal",
];

const EXPECTED_OUTCOME_AUTHORITY_SCOPE_SURFACES = [
  "REPO_AGENTS.md",
  "global/AGENTS.md",
  "global/skills/change-ready-sdlc/SKILL.md",
  "instructions/reusable-project-agent-instructions.md",
  "instructions/universal-development-loop.md",
  "templates/project/AGENTS.md",
];

const EXPECTED_OUTCOME_AUTHORITY_FORBIDDEN_PATTERNS = [
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
    diagnostic: "superseded generic actionable continuation items on loaded outcome-authority surface",
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
  {
    needle: "post-freeze scope may only shrink",
    diagnostic: "superseded closed-world post-freeze shrink rule on loaded outcome-authority surface",
  },
  {
    needle: "expansion requires a new revision or separate change",
    diagnostic: "superseded closed-world revision-only expansion authority on loaded outcome-authority surface",
  },
];

const EXPECTED_CHANGE_READY_SDLC_OUTCOME_AUTHORITY_MARKERS = [
  "accepted outcome",
  "protected boundaries",
  "smallest sufficient dependency closure",
  "never authorize mutation",
  "Blocking Evidence",
  "Follow-up Candidates",
  "one correction wave",
  "does not automatically end the unfinished root goal",
  "Never retry an unchanged candidate",
  "Never ask the user solely to approve an internal revision",
  "approved | approved_with_notes | rejected | blocked",
  "persistent evidence infrastructure",
];

const EXPECTED_GLOBAL_AGENTS_OUTCOME_AUTHORITY_MARKERS = [
  "accepted outcome",
  "protected boundaries",
  "smallest sufficient dependency closure",
  "never authorize mutation",
  "Blocking Evidence",
  "Follow-up Candidates",
  "one correction wave",
  "does not automatically end the unfinished root goal",
  "Never ask solely to approve an internal revision",
  "unchanged-candidate",
  "decision-ready",
  "approved | approved_with_notes | rejected | blocked",
];

const EXPECTED_GLOBAL_AGENTS_PROTECTED_BOUNDARY_CATEGORIES = [
  { label: "credentials/elevation", marker: "credentials/elevation" },
  { label: "destructive/irreversible/remote action", marker: "destructive, irreversible, or remote action" },
  { label: "deployment/install/activation/release/publication", marker: "deployment/install/activation/release/publication" },
  { label: "owner-controlled cost/external commitment", marker: "owner-controlled cost/external commitment" },
  { label: "public API/protocol/compatibility semantics", marker: "changed public API/protocol/compatibility semantics" },
  { label: "persisted-data/migration semantics", marker: "persisted-data/migration semantics" },
  { label: "security/privacy/authorization semantics", marker: "security/privacy/authorization semantics" },
  { label: "product/legal/policy decisions", marker: "product/legal/policy decisions" },
];

const EXPECTED_GLOBAL_AGENTS_NON_WAIVABLE_RISK_CLAUSE =
  "User acceptance cannot waive uncontrolled authorization, privacy, data-integrity, irreversible-action, or envelope-escape risk.";

const EXPECTED_GLOBAL_AGENTS_DECISION_READY_HANDOFF_FIELDS = [
  "outcome working status",
  "exact failure/evidence",
  "root-cause status/confidence",
  "attempted paths",
  "why no authorized path remains",
  "exact requested action",
  "real alternatives/consequences if any",
  "residual risk",
  "preserved state",
];

type FreshTestingSurfaceClass = "profile-conditioned" | "exact-trigger-material" | "role-ownership";

type ProfileRouteRules = {
  ordinaryMarkers: readonly string[];
  routeLineMarkers?: readonly string[];
  qualificationLineMarkers?: readonly string[];
  qualificationArtifactMarkers?: readonly string[];
};

type FreshTestingSurfaceClassification = {
  relativePath: string;
  classification: FreshTestingSurfaceClass;
  freshTestingMarkers: readonly string[];
  classMarkers: readonly string[];
  profileRoute?: ProfileRouteRules;
};

const STANDARD_ORDINARY_FRESH_TESTING_ROUTE_MARKERS = [
  "Ordinary Small",
  "focused validation",
  "optional",
  "post-proof regression",
] as const;

const FRESH_TESTING_LANGUAGE_PATTERN = /\bfresh-context\b|\bfresh(?: independent)? SDET\b/i;

function installedFreshTestingOperativeText(relativePath: string, text: string): string {
  return relativePath.startsWith("global/agents/")
    ? scanModelFacingMarkdownBody(text).operativeBody
    : operativeTextOutsideFences(text);
}

const FRESH_TESTING_SURFACE_CLASSIFICATION: readonly FreshTestingSurfaceClassification[] = [
  {
    relativePath: "global/skills/change-ready-sdlc/SKILL.md",
    classification: "profile-conditioned",
    freshTestingMarkers: ["Fresh independent SDET is required for Material/explicit qualification behavior changes"],
    classMarkers: ["Canonical portable orchestration adapter for **full qualification** work", "Ordinary Small work does **not** load this skill"],
    profileRoute: {
      ordinaryMarkers: ["Ordinary Small work does **not** load this skill", "known focused validation"],
      qualificationArtifactMarkers: [
        "Material/qualification work uses this skill end-to-end",
        "Profile controls planning and delivery ceremony. Fresh independent SDET is required for Material/explicit qualification behavior changes",
      ],
    },
  },
  {
    relativePath: "global/skills/deep-task-planning/SKILL.md",
    classification: "profile-conditioned",
    freshTestingMarkers: ["fresh-context SDET/risk discovery", "fresh-context SDET/test-only authoring"],
    classMarkers: ["Material/explicit qualification", "Ordinary Small"],
    profileRoute: {
      ordinaryMarkers: STANDARD_ORDINARY_FRESH_TESTING_ROUTE_MARKERS,
      routeLineMarkers: ["Material/explicit qualification behavior-changing slices:", "`Implementation Slices`:"],
    },
  },
  {
    relativePath: "global/skills/next-step/SKILL.md",
    classification: "profile-conditioned",
    freshTestingMarkers: ["Fresh-context testing/SDET workers"],
    classMarkers: ["required for Material/explicit qualification after proof", "Ordinary Small reuses focused validation"],
    profileRoute: {
      ordinaryMarkers: STANDARD_ORDINARY_FRESH_TESTING_ROUTE_MARKERS,
      routeLineMarkers: ["Assign each implementation worker an explicit `production` or `testing` role"],
    },
  },
  {
    relativePath: "global/skills/service-architecture-design/SKILL.md",
    classification: "profile-conditioned",
    freshTestingMarkers: ["fresh-context SDET/testing subagent"],
    classMarkers: ["Material/explicit qualification", "Ordinary Small may add only the smallest optional post-proof regression test"],
    profileRoute: {
      ordinaryMarkers: STANDARD_ORDINARY_FRESH_TESTING_ROUTE_MARKERS,
      routeLineMarkers: ["Implementation slices define the contract and observable happy path"],
    },
  },
  {
    relativePath: "global/skills/openspec-consistency-review/SKILL.md",
    classification: "profile-conditioned",
    freshTestingMarkers: ["fresh-context SDET/risk discovery"],
    classMarkers: ["Material/explicit qualification", "Ordinary Small reuses focused validation"],
    profileRoute: {
      ordinaryMarkers: STANDARD_ORDINARY_FRESH_TESTING_ROUTE_MARKERS,
      routeLineMarkers: ["Behavior-changing tasks order minimal happy-path implementation and observable proof first"],
    },
  },
  {
    relativePath: "global/skills/code-quality-audit/SKILL.md",
    classification: "profile-conditioned",
    freshTestingMarkers: ["fresh-context risk testing", "fresh-context testing subagent"],
    classMarkers: ["Material/explicit qualification", "Ordinary Small uses focused validation"],
    profileRoute: {
      ordinaryMarkers: STANDARD_ORDINARY_FRESH_TESTING_ROUTE_MARKERS,
      routeLineMarkers: ["For behavior-changing fixes", "If a refactor changes behavior"],
    },
  },
  {
    relativePath: "global/skills/rust-workspace-bootstrap/SKILL.md",
    classification: "profile-conditioned",
    freshTestingMarkers: ["fresh-context testing subagent"],
    classMarkers: ["Material/explicit qualification", "Ordinary Small uses focused validation"],
    profileRoute: {
      ordinaryMarkers: STANDARD_ORDINARY_FRESH_TESTING_ROUTE_MARKERS,
      routeLineMarkers: ["After happy-path proof"],
    },
  },
  {
    relativePath: "global/skills/config-schema-validation/SKILL.md",
    classification: "profile-conditioned",
    freshTestingMarkers: ["fresh-context testing subagent"],
    classMarkers: ["Material/explicit qualification", "Ordinary Small uses focused validation"],
    profileRoute: {
      ordinaryMarkers: STANDARD_ORDINARY_FRESH_TESTING_ROUTE_MARKERS,
      routeLineMarkers: ["Implement and observably prove the smallest schema-valid happy path first"],
    },
  },
  {
    relativePath: "global/skills/external-service-simulator-harness/SKILL.md",
    classification: "profile-conditioned",
    freshTestingMarkers: ["fresh-context testing subagent"],
    classMarkers: ["Material/explicit qualification", "Ordinary Small uses focused validation"],
    profileRoute: {
      ordinaryMarkers: STANDARD_ORDINARY_FRESH_TESTING_ROUTE_MARKERS,
      routeLineMarkers: ["Implement and observably prove the smallest simulator happy path first"],
    },
  },
  {
    relativePath: "global/skills/latency-benchmark-pack/SKILL.md",
    classification: "profile-conditioned",
    freshTestingMarkers: ["fresh-context testing subagent"],
    classMarkers: ["Material/explicit qualification", "Ordinary Small uses focused validation"],
    profileRoute: {
      ordinaryMarkers: STANDARD_ORDINARY_FRESH_TESTING_ROUTE_MARKERS,
      routeLineMarkers: ["If benchmark tooling changes behavior"],
    },
  },
  {
    relativePath: "global/skills/documentation-hardening-loop/SKILL.md",
    classification: "profile-conditioned",
    freshTestingMarkers: ["fresh-context risk discovery"],
    classMarkers: ["Material/explicit qualification", "Ordinary Small uses focused validation"],
    profileRoute: {
      ordinaryMarkers: STANDARD_ORDINARY_FRESH_TESTING_ROUTE_MARKERS,
      routeLineMarkers: ["When doc/spec hardening creates behavior-changing tasks"],
    },
  },
  {
    relativePath: "global/skills/instruction-artifact-tuning/SKILL.md",
    classification: "profile-conditioned",
    freshTestingMarkers: ["fresh-context test authoring"],
    classMarkers: ["Material/explicit qualification", "Ordinary Small uses focused validation"],
    profileRoute: {
      ordinaryMarkers: STANDARD_ORDINARY_FRESH_TESTING_ROUTE_MARKERS,
      routeLineMarkers: ["Risk-driven test discipline:"],
    },
  },
  {
    relativePath: "global/agents/openspec-architecture-reviewer.md",
    classification: "profile-conditioned",
    freshTestingMarkers: ["fresh-context SDET/testing"],
    classMarkers: ["Material/explicit qualification", "do not treat qualification SDET as mandatory for Ordinary Small"],
    profileRoute: {
      ordinaryMarkers: STANDARD_ORDINARY_FRESH_TESTING_ROUTE_MARKERS,
      routeLineMarkers: ["Behavior-changing requirements define the observable happy path"],
    },
  },
  {
    relativePath: "global/agents/instruction-artifact-reviewer.md",
    classification: "profile-conditioned",
    freshTestingMarkers: ["fresh-context risk testing"],
    classMarkers: ["Material/explicit qualification", "Ordinary Small uses focused validation"],
    profileRoute: {
      ordinaryMarkers: STANDARD_ORDINARY_FRESH_TESTING_ROUTE_MARKERS,
      routeLineMarkers: ["Verification workflow: behavior-changing work requires original-requirement evidence"],
    },
  },
  {
    relativePath: "global/agents/deployment-config-reviewer.md",
    classification: "profile-conditioned",
    freshTestingMarkers: ["fresh-context risk discovery"],
    classMarkers: ["Material/explicit qualification", "Ordinary Small uses focused validation"],
    profileRoute: {
      ordinaryMarkers: STANDARD_ORDINARY_FRESH_TESTING_ROUTE_MARKERS,
      routeLineMarkers: ["Schema, default, reload, limit, or deployment changes show observable happy-path proof first"],
    },
  },
  {
    relativePath: "global/agents/performance-reliability-reviewer.md",
    classification: "profile-conditioned",
    freshTestingMarkers: ["fresh-context testing subagent"],
    classMarkers: ["Material/explicit qualification", "Ordinary Small uses focused validation"],
    profileRoute: {
      ordinaryMarkers: STANDARD_ORDINARY_FRESH_TESTING_ROUTE_MARKERS,
      routeLineMarkers: ["Latency/reliability-affecting changes require observable happy-path proof first"],
    },
  },
  {
    relativePath: "global/agents/session-delivery-reviewer.md",
    classification: "profile-conditioned",
    freshTestingMarkers: ["fresh SDET evidence", "fresh-context testing subagent acting as SDET"],
    classMarkers: ["Map delivery evidence to the portable profile first", "cannot escalate the portable profile by itself"],
    profileRoute: {
      ordinaryMarkers: STANDARD_ORDINARY_FRESH_TESTING_ROUTE_MARKERS,
      routeLineMarkers: ["Portable profile `Material`:", "- `material`:"],
      qualificationLineMarkers: ["Portable profile `Material`", "Material/explicit qualification"],
    },
  },
  {
    relativePath: "global/agents/test-coverage-reviewer.md",
    classification: "profile-conditioned",
    freshTestingMarkers: ["fresh-context SDET"],
    classMarkers: ["Material/explicit qualification post-happy-path review", "for Ordinary Small, report residual risk rather than inventing mandatory SDET scope"],
    profileRoute: {
      ordinaryMarkers: ["Ordinary Small may rely on existing focused tests or the smallest post-proof regression test"],
      routeLineMarkers: ["For Material/explicit qualification post-happy-path review", "After Applicable Proof"],
      qualificationLineMarkers: ["Material/explicit qualification", "Material/qualification applies"],
    },
  },
  {
    relativePath: "global/skills/com-activex-adapter-implementation/SKILL.md",
    classification: "exact-trigger-material",
    freshTestingMarkers: ["fresh-context testing subagent"],
    classMarkers: ["public compatibility contracts"],
  },
  {
    relativePath: "global/skills/codebase-audit-loop/SKILL.md",
    classification: "exact-trigger-material",
    freshTestingMarkers: ["only a separate fresh-context testing subagent", "a separate fresh-context testing subagent before final hardening"],
    classMarkers: ["Use this skill only for broad, high-risk, or explicitly exhaustive audits"],
  },
  {
    relativePath: "global/skills/framed-protocol-implementation/SKILL.md",
    classification: "exact-trigger-material",
    freshTestingMarkers: ["fresh-context testing subagent"],
    classMarkers: ["complete protocol happy path over the real transport"],
  },
  {
    relativePath: "global/skills/legacy-contract-extract/SKILL.md",
    classification: "exact-trigger-material",
    freshTestingMarkers: ["fresh-context testing subagent"],
    classMarkers: ["proposed migration tasks route characterization and compatibility test authoring"],
  },
  {
    relativePath: "global/skills/windows-service-packaging/SKILL.md",
    classification: "exact-trigger-material",
    freshTestingMarkers: ["fresh-context testing subagent"],
    classMarkers: ["Use this skill when work touches Windows service deployment", "service/installer happy path"],
  },
  {
    relativePath: "global/agents/legacy-client-compatibility-reviewer.md",
    classification: "exact-trigger-material",
    freshTestingMarkers: ["fresh-context workflow, negative, timing, and recovery test authoring"],
    classMarkers: ["Compatibility-critical changes require observable happy-path proof"],
  },
  {
    relativePath: "global/agents/legacy-evidence-reviewer.md",
    classification: "exact-trigger-material",
    freshTestingMarkers: ["fresh-context compatibility test authoring"],
    classMarkers: ["Modern compatibility requirements map to an observable happy path"],
  },
  {
    relativePath: "global/agents/protocol-api-reviewer.md",
    classification: "exact-trigger-material",
    freshTestingMarkers: ["fresh-context testing subagent"],
    classMarkers: ["Protocol/API changes require observable happy-path proof first"],
  },
  {
    relativePath: "global/agents/rust-concurrency-reviewer.md",
    classification: "exact-trigger-material",
    freshTestingMarkers: ["fresh-context test/harness authoring"],
    classMarkers: ["Concurrency-affecting changes require observable happy-path proof first"],
  },
  {
    relativePath: "global/agents/wire-protocol-reviewer.md",
    classification: "exact-trigger-material",
    freshTestingMarkers: ["fresh-context testing subagent"],
    classMarkers: ["Changed wire formats require an observably proven codec/transport happy path"],
  },
  {
    relativePath: "global/agents/implementation-worker.md",
    classification: "role-ownership",
    freshTestingMarkers: ["test-only authorship (owned by fresh SDET)"],
    classMarkers: ["Never create or modify automated tests", "bounded production implementation worker"],
  },
  {
    relativePath: "global/agents/sdet-quality-engineer.md",
    classification: "role-ownership",
    freshTestingMarkers: ["You are a fresh-context SDET quality engineer"],
    classMarkers: ["You own independent risk assessment and test-artifact evidence only", "You are not a production author"],
  },
  {
    relativePath: "global/agents/troubleshooter.md",
    classification: "role-ownership",
    freshTestingMarkers: ["Route all automated-test authorship to a new fresh SDET"],
    classMarkers: ["Do not write or modify tests", "Troubleshooter does not perform either step"],
  },
];

function assertTokens(text: string, tokens: readonly string[], message: string): void {
  for (const token of tokens) {
    assert(text.includes(token), `${message}: ${token}`);
  }
}

function assertOrderedTokens(text: string, tokens: readonly string[], message: string): void {
  let cursor = -1;
  for (const token of tokens) {
    const index = text.indexOf(token, cursor + 1);
    assert(index > cursor, `${message}: ${token}`);
    cursor = index;
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
      assertDeepEqual([...OUTCOME_AUTHORITY_SCOPE_MARKERS], EXPECTED_OUTCOME_AUTHORITY_SCOPE_MARKERS, "Outcome-authority scope markers drifted.");
      assertDeepEqual([...OUTCOME_AUTHORITY_SCOPE_SURFACES], EXPECTED_OUTCOME_AUTHORITY_SCOPE_SURFACES, "Outcome-authority scope surfaces drifted.");
      assertDeepEqual([...OUTCOME_AUTHORITY_FORBIDDEN_PATTERNS], EXPECTED_OUTCOME_AUTHORITY_FORBIDDEN_PATTERNS, "Outcome-authority forbidden patterns drifted.");
      assertDeepEqual([...CHANGE_READY_SDLC_OUTCOME_AUTHORITY_MARKERS], EXPECTED_CHANGE_READY_SDLC_OUTCOME_AUTHORITY_MARKERS, "Canonical skill outcome-authority markers drifted.");
      assertDeepEqual([...GLOBAL_AGENTS_OUTCOME_AUTHORITY_MARKERS], EXPECTED_GLOBAL_AGENTS_OUTCOME_AUTHORITY_MARKERS, "Global AGENTS outcome-authority markers drifted.");
      assertDeepEqual([...GLOBAL_AGENTS_PROTECTED_BOUNDARY_CATEGORIES], EXPECTED_GLOBAL_AGENTS_PROTECTED_BOUNDARY_CATEGORIES, "Global AGENTS protected-boundary categories drifted.");
      assertEqual(GLOBAL_AGENTS_NON_WAIVABLE_RISK_CLAUSE, EXPECTED_GLOBAL_AGENTS_NON_WAIVABLE_RISK_CLAUSE, "Global AGENTS non-waivable critical-risk clause drifted.");
      assertDeepEqual([...GLOBAL_AGENTS_DECISION_READY_HANDOFF_FIELDS], EXPECTED_GLOBAL_AGENTS_DECISION_READY_HANDOFF_FIELDS, "Global AGENTS decision-ready handoff fields drifted.");
      assertDeepEqual([...GLOBAL_AGENTS_OUTCOME_FIRST_MARKERS], EXPECTED_GLOBAL_AGENTS_OUTCOME_FIRST_MARKERS, "Global AGENTS outcome-first markers drifted.");
      assertDeepEqual([...CHANGE_READY_SDLC_PILOT_READY_MARKERS], EXPECTED_CHANGE_READY_SDLC_PILOT_READY_MARKERS, "Change-Ready Pilot-Ready markers drifted.");
      assertDeepEqual([...OUTCOME_FIRST_ROLE_DELTA_SURFACES], EXPECTED_OUTCOME_FIRST_ROLE_DELTA_SURFACES, "Outcome-first role/planning delta surfaces drifted.");
      assertDeepEqual([...OUTCOME_FIRST_COMPLETE_POLICY_MARKERS], EXPECTED_OUTCOME_FIRST_COMPLETE_POLICY_MARKERS, "Outcome-first complete-policy markers drifted.");
      assertEqual(OUTCOME_FIRST_COMPLETE_POLICY_DUPLICATE_THRESHOLD, 5, "Outcome-first complete-policy duplicate threshold drifted.");
    },
  },
  {
    name: "contracts: outcome-first policy preserves reachable-risk, reviewer, and next-increment oracles",
    run: () => {
      const globalAgents = fs.readFileSync(path.join(root, "global", "AGENTS.md"), "utf8");
      const reviewer = sectionBetween(globalAgents, "## Shared Reviewer Runtime Invariants", "## Core Golden Rules");
      assertTokens(reviewer, [
        "future-scope validity",
        "A finding blocks Pilot-Ready only when reachable there",
        "Evidence-format polish alone is non-blocking when semantic evidence remains trustworthy",
        "Missing evidence → `Blocking Evidence` or residual risk",
      ], "Shared reviewer policy missing reachability or semantic-evidence oracle");
      assertOrderedTokens(reviewer, [
        "remove, narrow, reuse, local guard, then deferral",
        "larger mechanisms only with evidence earlier options cannot make the current slice safe",
      ], "Shared reviewer policy missing minimum-remedy order");

      const autonomy = sectionBetween(globalAgents, "## Autonomous Work Contract", "## Interactive Next-Step Handoff");
      assertTokens(autonomy, [
        "Lifecycle profiles remain exactly `Ordinary Small | Material`",
        "Pilot-Ready is a limited-use disposition, not a third profile or Change-Ready substitute",
        "one bounded outcome and non-goals",
        "a technically enforced operating envelope (prose-only limits are not containment)",
        "real-boundary happy-path proof",
        "focused project-native validation",
        "protection of applicable critical safety/data/authorization invariants",
        "sufficient material failure visibility",
        "proportional disable/rollback/containment for persistent or spreading effects",
        "one compact material residual-risk bundle",
        "explicit user acceptance for every material risk reachable inside the enforced pilot envelope",
        "no uncontrolled authorization, privacy, data-integrity, irreversible-action, or envelope-escape risk",
        "cannot waive uncontrolled authorization, privacy, data-integrity, irreversible-action, or envelope-escape risk",
        "Neither disposition authorizes deployment, release, installation, activation, credentials, or remote-state mutation",
      ], "Autonomous work policy missing Pilot-Ready separation or non-waivable-risk oracle");

      const openSpec = sectionBetween(globalAgents, "## OpenSpec Change Authoring", "## Task Completion Honesty");
      assertTokens(openSpec, [
        ...EXPECTED_GLOBAL_AGENTS_OUTCOME_FIRST_MARKERS.slice(18, 25),
        "Group mechanical mirror edits that share one owner and one validation result",
        "Specification review stops when remaining findings are future-scope, unreachable, optional, or polish-only",
      ], "OpenSpec policy missing next-increment contract or stop condition");

      const skill = fs.readFileSync(path.join(root, "global", "skills", "change-ready-sdlc", "SKILL.md"), "utf8");
      const pilot = sectionBetween(skill, "### 10. Pilot-Ready Decision", "### Rollback plan");
      assertTokens(pilot, [
        "complete Pilot safety floor is authoritative only in always-loaded global `AGENTS.md`",
        "this skill does not restate that floor",
        "does not undermine candidate identity/scope, proof, containment, safety floor, validation, or material-risk acceptance",
        "Final/delivery rejection stays terminal for Change-Ready and never authorizes mutation/replay",
        "does not automatically erase independently proven Pilot-Ready evidence unless pilot facts become unreadable or untrustworthy",
        "Neither disposition authorizes deployment, release, installation, activation, credentials, or remote-state mutation",
      ], "Canonical skill missing qualification-specific Pilot coexistence or global-floor authority oracle");
      const skillOperative = operativeTextOutsideFences(skill);
      const skillCompletePolicyHits = OUTCOME_FIRST_COMPLETE_POLICY_MARKERS.filter((marker) => skillOperative.includes(marker)).length;
      assert(
        skillCompletePolicyHits < OUTCOME_FIRST_COMPLETE_POLICY_DUPLICATE_THRESHOLD,
        `Conditional Change-Ready skill must not copy the complete Pilot safety floor; found ${skillCompletePolicyHits} complete-policy markers.`,
      );
    },
  },
  {
    name: "contracts: outcome-first validators remain configured deterministic checks without semantic risk inference",
    run: () => {
      const supportPaths = [
        "tools/contracts/agents.ts",
        "tools/contracts/reviewer-binding.ts",
        "tools/contracts/skills.ts",
        "tools/validators/active-authority.ts",
        "tools/validators/devkit-contract.ts",
        "tools/validators/routing.ts",
      ];
      const routing = fs.readFileSync(path.join(root, "tools", "validators", "routing.ts"), "utf8");
      assertTokens(routing, [
        "GLOBAL_AGENTS_OUTCOME_FIRST_MARKERS",
        "CHANGE_READY_SDLC_PILOT_READY_MARKERS",
        "OUTCOME_FIRST_ROLE_DELTA_SURFACES",
        "OUTCOME_FIRST_COMPLETE_POLICY_MARKERS",
        "requireTextContains",
        "text.includes(marker)",
      ], "Routing validator must use configured exact paths and markers");
      const semanticClassifierPatterns = [
        /\b(?:classify|infer|score)(?:Risk|Reachability|Severity|Materiality|Containment|Acceptance)\b/i,
        /\b(?:risk|reachability|severity|materiality|containment|acceptance)(?:Classifier|Scorer)\b/i,
      ];
      for (const relative of supportPaths) {
        const source = fs.readFileSync(path.join(root, relative), "utf8");
        for (const forbidden of semanticClassifierPatterns) {
          assert(!forbidden.test(source), `${relative} must not classify arbitrary natural-language risk semantics: ${forbidden}`);
        }
      }
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
    name: "contracts: loaded authority surfaces preserve outcome authority and exclude superseded authority phrases",
    run: () => {
      for (const relative of OUTCOME_AUTHORITY_SCOPE_SURFACES) {
        const text = fs.readFileSync(path.join(root, relative), "utf8");
        assertTokens(text, OUTCOME_AUTHORITY_SCOPE_MARKERS, `${relative} missing outcome-authority marker`);
        if (relative === "global/AGENTS.md" || relative === "REPO_AGENTS.md") {
          assertTokens(text, EXPECTED_EVIDENCE_ONLY_HANDOFF_FIELDS, `${relative} missing evidence-only handoff field`);
        }
        for (const forbidden of OUTCOME_AUTHORITY_FORBIDDEN_PATTERNS) {
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
    name: "contracts: installed fresh-testing surfaces are catalog-classified and profile-conditioned routes stay line-locked",
    run: () => {
      const profile = JSON.parse(fs.readFileSync(path.join(root, "profiles", "all.json"), "utf8")) as {
        skills?: unknown;
        agents?: unknown;
      };
      if (!Array.isArray(profile.skills) || !Array.isArray(profile.agents)) {
        throw new Error("profiles/all.json must expose skills[] and agents[] as the installed catalog.");
      }

      const installedPaths = [
        ...profile.skills.map((name) => {
          assert(typeof name === "string", "profiles/all.json skill names must be strings.");
          return `global/skills/${String(name)}/SKILL.md`;
        }),
        ...profile.agents.map((name) => {
          assert(typeof name === "string", "profiles/all.json agent names must be strings.");
          return `global/agents/${String(name)}.md`;
        }),
      ];
      assertEqual(new Set(installedPaths).size, installedPaths.length, "profiles/all.json must not install a skill or agent path twice.");

      const installedOperativeText = new Map<string, string>();
      for (const relative of installedPaths) {
        const text = fs.readFileSync(path.join(root, relative), "utf8");
        installedOperativeText.set(relative, installedFreshTestingOperativeText(relative, text));
      }

      const implementationWorkerPath = "global/agents/implementation-worker.md";
      const implementationWorkerMarker = "- Automated tests, fixtures, snapshots, fake services, simulators, harnesses, goldens, or any test-only authorship (owned by fresh SDET).";
      const implementationWorker = fs.readFileSync(path.join(root, implementationWorkerPath), "utf8");
      assertEqual(
        implementationWorker.split(implementationWorkerMarker).length - 1,
        1,
        "Implementation-worker seeded role marker must remain unique.",
      );
      assert(
        FRESH_TESTING_LANGUAGE_PATTERN.test(installedFreshTestingOperativeText(implementationWorkerPath, implementationWorker)),
        "Unmodified implementation-worker role marker must remain operative for fresh-testing classification.",
      );
      for (const indentation of ["    ", " \t"]) {
        const indentedImplementationWorker = implementationWorker.replace(
          implementationWorkerMarker,
          `${indentation}${implementationWorkerMarker}`,
        );
        assert(
          FRESH_TESTING_LANGUAGE_PATTERN.test(operativeTextOutsideFences(indentedImplementationWorker)),
          "Seeded indented role marker must reproduce the fence-only classifier gap.",
        );
        assert(
          !FRESH_TESTING_LANGUAGE_PATTERN.test(installedFreshTestingOperativeText(implementationWorkerPath, indentedImplementationWorker)),
          "CommonMark indented role marker must not certify installed fresh-testing classification.",
        );
      }

      const discoveredFreshTestingPaths = installedPaths
        .filter((relative) => FRESH_TESTING_LANGUAGE_PATTERN.test(installedOperativeText.get(relative) ?? ""))
        .sort();
      const classifiedPaths = FRESH_TESTING_SURFACE_CLASSIFICATION.map((entry) => entry.relativePath);
      assertEqual(new Set(classifiedPaths).size, classifiedPaths.length, "Fresh-testing classification table must classify each path exactly once.");
      assertDeepEqual(
        discoveredFreshTestingPaths,
        [...classifiedPaths].sort(),
        "Every installed operative surface with explicit fresh-context/fresh-SDET language must be classified, with no uninstalled table entries.",
      );
      assertEqual(FRESH_TESTING_SURFACE_CLASSIFICATION.filter((entry) => entry.classification === "profile-conditioned").length, 18, "Profile-conditioned fresh-testing inventory drifted.");
      assertEqual(FRESH_TESTING_SURFACE_CLASSIFICATION.filter((entry) => entry.classification === "exact-trigger-material").length, 10, "Exact-trigger Material fresh-testing inventory drifted.");
      assertEqual(FRESH_TESTING_SURFACE_CLASSIFICATION.filter((entry) => entry.classification === "role-ownership").length, 3, "Role-ownership fresh-testing inventory drifted.");

      for (const entry of FRESH_TESTING_SURFACE_CLASSIFICATION) {
        const operative = installedOperativeText.get(entry.relativePath);
        assert(operative !== undefined, `${entry.relativePath} is classified but not installed by profiles/all.json.`);
        if (operative === undefined) continue;
        assert(FRESH_TESTING_LANGUAGE_PATTERN.test(operative), `${entry.relativePath} lost explicit fresh-context/fresh-SDET language.`);
        assertTokens(operative, entry.freshTestingMarkers, `${entry.relativePath} lost expected fresh-testing language`);
        assertTokens(operative, entry.classMarkers, `${entry.relativePath} lost direct ${entry.classification} source markers`);

        if (entry.classification !== "profile-conditioned") continue;
        const profileRoute = entry.profileRoute;
        assert(profileRoute !== undefined, `${entry.relativePath} lacks profile-route assertions.`);
        if (profileRoute === undefined) continue;
        assertTokens(operative, profileRoute.ordinaryMarkers, `${entry.relativePath} lost its direct Ordinary Small route`);

        if (profileRoute.qualificationArtifactMarkers !== undefined) {
          assertTokens(
            operative,
            profileRoute.qualificationArtifactMarkers,
            `${entry.relativePath} must remain qualification-only by its direct artifact trigger`,
          );
        } else {
          const routeLineMarkers = profileRoute.routeLineMarkers ?? [];
          const qualificationLineMarkers = profileRoute.qualificationLineMarkers ?? ["Material/explicit qualification"];
          const freshTestingLines = operative
            .split(/\r?\n/)
            .filter((line) => FRESH_TESTING_LANGUAGE_PATTERN.test(line));
          assertEqual(
            freshTestingLines.length,
            routeLineMarkers.length,
            `${entry.relativePath} fresh-testing lines must stay explicitly represented in the static route table.`,
          );
          const coveredLineIndexes = new Set<number>();
          for (const routeLineMarker of routeLineMarkers) {
            const matchingIndexes = freshTestingLines
              .map((line, index) => line.includes(routeLineMarker) ? index : -1)
              .filter((index) => index >= 0);
            assertEqual(matchingIndexes.length, 1, `${entry.relativePath} route marker must identify exactly one fresh-testing line: ${routeLineMarker}`);
            coveredLineIndexes.add(matchingIndexes[0]);
          }
          assertEqual(coveredLineIndexes.size, freshTestingLines.length, `${entry.relativePath} has a fresh-testing line not covered by its static route markers.`);

          for (const line of freshTestingLines) {
            const freshMatch = line.match(FRESH_TESTING_LANGUAGE_PATTERN);
            const freshIndex = freshMatch?.index ?? -1;
            assert(freshIndex >= 0, `${entry.relativePath} fresh-testing line scan lost its exact marker: ${line}`);
            assert(
              /\b(?:proof|prove(?:d|s)?|proven|post-happy-path)\b/i.test(line.slice(0, freshIndex)),
              `${entry.relativePath} must place direct proof/happy-path evidence before fresh testing: ${line}`,
            );
            assert(
              qualificationLineMarkers.some((marker) => line.includes(marker)),
              `${entry.relativePath} fresh testing must be directly bound to its Material/qualification route: ${line}`,
            );
          }
        }

        assert(
          !/Ordinary Small[^\n]*(?:requires?|must use)[^\n]*(?:fresh-context|fresh SDET)/i.test(operative),
          `${entry.relativePath} must not make fresh testing mandatory for Ordinary Small.`,
        );
      }

      const readme = fs.readFileSync(path.join(root, "README.md"), "utf8");
      assertTokens(readme, [
        "Material/explicit qualification",
        "Ordinary Small",
        "focused validation",
        "optional smallest post-proof regression",
      ], "README.md missing direct profile-conditioned curation route");
      const readmeFreshTestingLines = readme
        .split(/\r?\n/)
        .filter((line) => /^\s*-\s/.test(line) && /fresh-context/i.test(line) && /\b(?:SDET|testing|test authoring)\b/i.test(line));
      assertEqual(readmeFreshTestingLines.length, 1, "README.md must retain exactly one direct profile-conditioned curation rule.");
      for (const line of readmeFreshTestingLines) {
        const freshContextIndex = line.search(/fresh-context/i);
        assert(/\b(?:proof|prove(?:d|s)?)\b/i.test(line.slice(0, freshContextIndex)), `README.md must place observable proof before fresh-context testing: ${line}`);
        assert(line.includes("Material/explicit qualification"), `README.md must bind fresh-context testing to Material/explicit qualification: ${line}`);
      }
    },
  },
  {
    name: "contracts: outcome authority permits only necessary local reversible dependency closure",
    run: () => {
      const globalAgents = fs.readFileSync(path.join(root, "global", "AGENTS.md"), "utf8");
      assertTokens(globalAgents, [
        "User-owned scope is the accepted outcome, operating envelope, non-goals, non-deferrable invariants, and protected boundaries—not the initial path/task inventory",
        "Scope expansion = changing that outcome, adding out-of-envelope user-visible behavior, weakening a non-deferrable invariant, or a protected-boundary crossing—requires explicit user approval",
        "smallest sufficient dependency closure",
        "unrelated work preserved",
        "Optional features, abstractions, compatibility, tooling, hardening, cleanup, or evidence infrastructure not necessary for the accepted outcome stay residual or separately approved",
      ], "Global outcome-authority policy missing dependency-closure or protected-boundary oracle");

      const skill = fs.readFileSync(path.join(root, "global", "skills", "change-ready-sdlc", "SKILL.md"), "utf8");
      const authority = sectionBetween(skill, "## Outcome authority and qualification attempts", "## Orchestrator ownership");
      assertTokens(authority, [
        "Tasks/paths/artifacts are mutable footprint under that capsule",
        "Scope expansion (changed accepted outcome, out-of-envelope behavior, weakened invariant, protected-boundary crossing)",
        "explicit owner approval",
        "smallest sufficient dependency closure",
        "necessary for accepted outcome/invariant, local, reversible, no protected boundary, unrelated work preserved",
        "Optional cleanup/tooling/hardening stays residual",
        "Findings may bind `Change-Ready: no` but never authorize mutation",
      ], "Qualification outcome-authority policy missing protected-boundary or dependency-closure oracle");

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
    name: "contracts: outcome capsule, correction predicates, progress gate, and finite attempt remain explicit",
    run: () => {
      const skill = fs.readFileSync(path.join(root, "global", "skills", "change-ready-sdlc", "SKILL.md"), "utf8");
      const authority = sectionBetween(skill, "## Outcome authority and qualification attempts", "## Orchestrator ownership");
      assertTokens(authority, [
        "outcome authority capsule: accepted outcome; envelope; non-goals; non-deferrable invariants; proof intent; protected boundaries",
        "Tasks/paths/artifacts are mutable footprint under that capsule",
        "Record traceability, update brief, invalidate affected evidence",
        "accepted outcome or non-deferrable invariant ref",
        "concrete candidate reproducer",
        "candidate-vs-baseline attribution",
        "authorized local reversible dependency closure without persistent evidence infrastructure and unused single correction wave",
        "Unknown → bounded read-only investigation, residual, authorized defect, or exact blocker—never solo implementation authority",
        "outcome blocker; non-deferrable blocker (never debt, including at budget stop); contained material limitation (post-proof acceptance before `Pilot-Ready: yes`); deferrable technical debt (batch after working proof; never a post-green new attempt)",
        "ends only that attempt with `Change-Ready: no`",
        "does not automatically end the unfinished root goal, require internal-revision approval, or bar read-only diagnosis",
      ], "Canonical outcome authority is missing capsule, correction, debt, or finite-attempt oracles");

      const correction = sectionBetween(skill, "### 7. Correction routing and replay", "### 8. Final Candidate Review");
      assertTokens(correction, [
        "Final/delivery rejection | Terminal for inspected attempt",
        "Second serious failure after the correction wave ends the attempt with `Change-Ready: no`",
        "Start a new post-green cycle without user approval only when",
        "authorized local reversible repair",
        "concrete current accepted-outcome or non-deferrable defect (not polish)",
        "root stop budget has a free slot if floor already reached and no cycle is open",
        "Needs new root-cause evidence plus repair, narrower useful envelope, or environment/evidence fix unblocking a current defect",
        "Never retry an unchanged candidate until green",
        "Never ask the user solely to approve an internal revision, correction counter, continuation, or stop-budget extension",
      ], "Correction routing must keep attempts finite while progress-gating root-goal continuation");
    },
  },
  {
    name: "contracts: root working-result stop budget is bounded and honest on both authority surfaces",
    run: () => {
      const globalAgents = fs.readFileSync(path.join(root, "global", "AGENTS.md"), "utf8");
      const skill = fs.readFileSync(path.join(root, "global", "skills", "change-ready-sdlc", "SKILL.md"), "utf8");
      const globalContract = sectionBetween(globalAgents, "### Working result and root stop budget", "## Shared Reviewer Runtime Invariants");
      assertTokens(globalContract, [
        "Root authority; not reset by attempt/revision/Candidate Reference/reviewer/compaction",
        "Record used/remaining in brief/handoff",
        "**Working result** floor (not exhaustive hardening)",
        "real-boundary accepted happy path",
        "applicable current-envelope non-deferrable safety/data/authorization invariants",
        "green project-native validation",
        "no known current outcome defect",
        "**Working-result stop budget**: max two **post-green correction cycles**/root",
        "Cycle starts at first post-floor mutation for a concrete current accepted-outcome/non-deferrable defect with current consequence",
        "After floor: 1 initial review sequence + ≤1 review-driven replay",
        "no second replay",
        "no unbounded new-cycle chain",
        "stays open through attributable production/test/instruction/evidence fixes + affected replays until green or abandoned",
        "not severity/speculation/gate-status alone",
        "Residual-only after floor (cannot start a cycle)",
        "coverage/test gaps without current defect",
        "validator/parser/format",
        "diagnostic noise",
        "evidence/review-package/provenance polish",
        "speculative drift",
        "architecture/maintainability polish",
        "On stop with no authorized local path: stop mutation/reviews",
        "preserve candidate/evidence",
        "report working outcome separately from `Change-Ready: no`",
        "hand off",
        "never bare continue/retry/budget extension",
        "else new explicit request",
        "Red in-flight or happy-path/non-deferrable defect at stop ≠ working/`Pilot-Ready: yes`—blocker + `Change-Ready: no`",
        "Attempt end does not automatically authorize another attempt",
        "Mandatory gates stay mandatory for `Change-Ready: yes`",
        "hard stop may be working with `Change-Ready: no`, never false qualification",
      ], "always-loaded global authority missing root working-result stop-budget oracle");

      const skillAuthority = sectionBetween(skill, "## Outcome authority and qualification attempts", "## Orchestrator ownership");
      assertTokens(skillAuthority, [
        "Canonical floor, two-cycle post-green budget, cycle start/slot/in-flight closure, progress gate, residual polish classes, exhaustion handoff, and mandatory-gate honesty live only in always-loaded global `AGENTS.md` (Working result and root stop budget)",
        "record used/remaining budget and open-cycle state in brief/handoff/capsule/output",
        "in-attempt **one correction wave** remains and the root budget is an additional stricter cross-attempt cap",
        "starting a new post-green cycle needs remaining capacity + concrete current consequence",
        "remaining root stop-budget capacity and a concrete current consequence",
        "Second serious failure after the correction wave, or final/delivery rejection, ends only that attempt with `Change-Ready: no`",
        "does not automatically authorize another attempt",
        "Final/delivery never authorize mutation of that attempt",
      ], "canonical Change-Ready skill missing global-authority pointer or qualification-specific stop-budget mechanics");

      assertTokens(skill, [
        "Final/delivery rejection | Terminal for inspected attempt; new candidate only under global AGENTS root stop budget",
        "open-cycle stop or ineligible rejection: global AGENTS stop-line handoff",
        "New candidate and exhaustion handoff follow global AGENTS Working result and root stop budget",
        "Continuity uncertainty never resets prior failures or the root working-result stop budget (global AGENTS)",
        "`Working-result stop budget`: used/remaining post-green cycles; floor reached yes/no",
        "`Outcome working status`: working | not working | unknown (separate from readiness)",
      ], "canonical Change-Ready skill missing correction, delivery, restart, or output stop-budget mechanics");

      const supersededUnlimitedContinuationForms = [
        "Replay only gates invalidated by a qualifying P0/P1 correction or a failed mandatory gate",
        "replay only gates invalidated by a qualifying P0/P1 correction or a failed mandatory gate",
      ];
      for (const [label, source] of [
        ["always-loaded global authority", globalAgents],
        ["canonical Change-Ready skill", skill],
      ] as const) {
        for (const forbidden of supersededUnlimitedContinuationForms) {
          assert(!source.includes(forbidden), `${label} retains superseded unlimited continuation authority: ${forbidden}`);
        }
      }
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
    name: "contracts: blocker classes and decision-ready handoff stay outcome-linked and leaf-non-authorizing",
    run: () => {
      const globalAgents = fs.readFileSync(path.join(root, "global", "AGENTS.md"), "utf8");
      const autonomy = operativeTextOutsideFences(sectionBetween(globalAgents, "## Autonomous Work Contract", "## Interactive Next-Step Handoff"));
      assertTokens(autonomy, [
        "outcome blocker (broken happy path—authorized repair; not debt)",
        "non-deferrable blocker (uncontrolled authorization/privacy/data-integrity/irreversible/envelope-escape—remove, contain, narrow, or request protected-boundary authority; never debt)",
        "contained material limitation (one post-proof acceptance bundle before `Pilot-Ready: yes`)",
        "deferrable technical debt (batch after working proof)",
        "honor Working result and root stop budget",
        "Never ask solely to approve an internal revision, correction-wave exhaustion, candidate rejection, `Change-Ready: no`, process continuation, or budget extension",
        "Decision-ready handoff: outcome working status; exact failure/evidence; root-cause status/confidence; attempted paths; why no authorized path remains; exact requested action; real alternatives/consequences if any; residual risk; preserved state",
        "State every listed field explicitly; when evidence absent, write `unknown` or `none`—do not omit or invent",
      ], "Global autonomy contract missing distinct blocker/debt or decision-ready fields");

      const interactive = sectionBetween(globalAgents, "## Interactive Next-Step Handoff", "## OpenCode Feature Work");
      assertTokens(interactive, [
        "On a real user-owned blocker (not process counters)",
        "never bare revision/retry/continue",
        "Reviewer subagents: no `question`",
      ], "Interactive handoff must reject process-only questions and preserve leaf non-authorization");

      const leaf = fs.readFileSync(path.join(root, "instructions", "leaf-reviewer-agent-contract.md"), "utf8");
      assertTokens(leaf, [
        "No source/config/instruction edits",
        "question",
        "never authorize mutation, protected-boundary expansion, or current-candidate work",
        "main owns diagnosis/routing",
      ], "Leaf reviewer contract must remain evidence-only and non-authorizing");
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
        "GLOBAL_AGENTS_OUTCOME_AUTHORITY_MARKERS",
        "CHANGE_READY_SDLC_OUTCOME_AUTHORITY_MARKERS",
        "GLOBAL_AGENTS_OUTCOME_FIRST_MARKERS",
        "CHANGE_READY_SDLC_PILOT_READY_MARKERS",
        "OUTCOME_FIRST_ROLE_DELTA_SURFACES",
        "OUTCOME_FIRST_COMPLETE_POLICY_MARKERS",
        "OUTCOME_FIRST_COMPLETE_POLICY_DUPLICATE_THRESHOLD",
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
        "Follow-up Candidates",
      ], "README routing/catalog drifted");
      assert(!readme.includes("Actionable Continuation Items"), "README must not prescribe the superseded reviewer action-list field Actionable Continuation Items.");
    },
  },
];
