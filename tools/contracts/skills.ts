export const SKILL_NAME_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export const SKILL_DESCRIPTION_MAX_CHARS = 1024;

export const SKILL_TRIGGER_PATTERN = /\bUse this (skill|helper)\b/i;

export const SKILL_OUTPUT_CONTRACT_PATTERN = /(^## Output\b|^## Output Shapes\b|^## Minimal Ledger\b|^Workers return:|\bReturn:|\bReturn\s+)/m;

/** Canonical relative path of the portable Change-Ready skill. */
export const CHANGE_READY_SDLC_SKILL_NAME = "change-ready-sdlc";

export const CHANGE_READY_SDLC_SKILL_RELATIVE_PATH = "global/skills/change-ready-sdlc/SKILL.md";

/** Exact case-sensitive lifecycle markers required in the canonical skill. */
export const CHANGE_READY_SDLC_LIFECYCLE_MARKERS: readonly string[] = [
  "Adapter Discovery",
  "Profile: Ordinary Small | Material",
  "Authoritative Brief",
  "Applicable Proof",
  "Candidate Reference",
  "Project-Native Validation",
  "Final Candidate Review",
  "Change-Ready Decision",
];

/**
 * Exact case-insensitive portable-hardcode tokens forbidden in the canonical skill.
 * Diagnostics must name file and token.
 */
export const CHANGE_READY_SDLC_FORBIDDEN_TOKENS: readonly string[] = [
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

/**
 * Exact discovery terms that must appear in the canonical skill frontmatter description.
 */
export const CHANGE_READY_SDLC_DESCRIPTION_TERMS: readonly string[] = [
  "implementation",
  "bug fix",
  "refactor",
  "loaded instruction",
  "configuration change",
  "generated-output change",
  "Change-Ready",
  "review-only",
  "research",
  "inert content",
  "Ordinary Small",
  "Material",
];

/** Duplicate-orchestration drift threshold: unique exact lifecycle markers per non-canonical global Markdown artifact. */
export const CHANGE_READY_SDLC_DUPLICATE_MARKER_THRESHOLD = 6;

/**
 * Qualification-path tokens required in the canonical skill (not ordinary-path ceremony).
 * Diagnostics must name the missing token and affected artifact.
 */
export const CHANGE_READY_SDLC_CONTINUATION_TOKENS: readonly string[] = [
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

/** Lifecycle role routes required in always-loaded global AGENTS routing text. */
export const LIFECYCLE_ROLE_ROUTES = [
  "implementation-worker",
  "sdet-quality-engineer",
  "final-candidate-reviewer",
] as const;

/** Maintenance instruction files that must keep production lifecycle routing. */
export const MAINTENANCE_ROUTING_FILES = [
  "REPO_AGENTS.md",
  "global/AGENTS.md",
  "instructions/reusable-project-agent-instructions.md",
  "templates/project/AGENTS.md",
] as const;

/**
 * Surfaces scanned for old universal-ceremony anti-patterns only.
 * Broader than MAINTENANCE_ROUTING_FILES so the canonical skill, UDL, and active
 * role prompts cannot reintroduce forbidden sentences without validator failure.
 * Do not use this list for implementation-worker handoff-field validation.
 */
export const FORBIDDEN_PRODUCTION_ROUTING_SCAN_FILES = [
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
] as const;

/**
 * Exact forbidden production-routing anti-patterns (old universal ceremony).
 * Match whole unsafe sentences only — never broad substrings that would hit valid negation.
 */
export const FORBIDDEN_PRODUCTION_ROUTING_PATTERNS = [
  {
    needle: "Any false or unknown condition selects Material",
    diagnostic: "old universal unknown-forces-Material routing",
  },
  {
    needle: "Every behavior change still receives fresh independent SDET assessment",
    diagnostic: "old universal fresh-SDET-for-every-behavior-change routing",
  },
  {
    needle:
      "Small behavior-changing production work may be implemented directly by the main session when the change is local and reversible.",
    diagnostic:
      "obsolete Small-label direct-main sentence; use Ordinary Small wording instead",
  },
  {
    needle:
      "If `implementation-worker` is unavailable, the main session may edit behavior-changing production directly to avoid blocking.",
    diagnostic: "unsafe unavailable-worker main-session production fallback for Material/qualification work",
  },
  {
    needle:
      "Main must not fall back to direct edit/write as the production author for behavior-changing candidate production or automated-test artifacts.",
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
    needle:
      "new blocking corrections or acceptance criteria require explicit owner approval or a reproducible P0/P1 defect",
    diagnostic: "superseded P0/P1 post-mutation scope-expansion exception",
  },
  {
    needle: "a new blocking candidate correction or new acceptance criterion requires either:",
    diagnostic: "superseded P0/P1 post-mutation scope-expansion exception in skill",
  },
  {
    needle:
      "Evidence tooling must not become a second product; it MAY be added only when a mandatory gate cannot be reproduced without it",
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
] as const;

/** Outcome-authority markers required in the canonical Change-Ready skill body. */
export const CHANGE_READY_SDLC_OUTCOME_AUTHORITY_MARKERS: readonly string[] = [
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

/** Outcome-authority markers required in always-loaded global AGENTS routing. */
export const GLOBAL_AGENTS_OUTCOME_AUTHORITY_MARKERS: readonly string[] = [
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

/**
 * Exact owner-authority protected-boundary categories required in always-loaded global AGENTS.
 * Labels are privacy-safe diagnostics; markers are deterministic substrings only.
 */
export const GLOBAL_AGENTS_PROTECTED_BOUNDARY_CATEGORIES: readonly {
  label: string;
  marker: string;
}[] = [
  { label: "credentials/elevation", marker: "credentials/elevation" },
  {
    label: "destructive/irreversible/remote action",
    marker: "destructive, irreversible, or remote action",
  },
  {
    label: "deployment/install/activation/release/publication",
    marker: "deployment/install/activation/release/publication",
  },
  {
    label: "owner-controlled cost/external commitment",
    marker: "owner-controlled cost/external commitment",
  },
  {
    label: "public API/protocol/compatibility semantics",
    marker: "changed public API/protocol/compatibility semantics",
  },
  {
    label: "persisted-data/migration semantics",
    marker: "persisted-data/migration semantics",
  },
  {
    label: "security/privacy/authorization semantics",
    marker: "security/privacy/authorization semantics",
  },
  {
    label: "product/legal/policy decisions",
    marker: "product/legal/policy decisions",
  },
];

/**
 * Exact non-waivable critical-risk clause required in always-loaded global AGENTS operative text.
 */
export const GLOBAL_AGENTS_NON_WAIVABLE_RISK_CLAUSE =
  "User acceptance cannot waive uncontrolled authorization, privacy, data-integrity, irreversible-action, or envelope-escape risk.";

/**
 * Exact decision-ready blocker handoff fields required in always-loaded global AGENTS operative text.
 */
export const GLOBAL_AGENTS_DECISION_READY_HANDOFF_FIELDS: readonly string[] = [
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

/** Mandatory ordinary-default and qualification-trigger tokens for global/AGENTS.md. */
export const GLOBAL_AGENTS_TRIGGER_TOKENS: readonly string[] = [
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

/**
 * Canonical outcome-first / Pilot-Ready markers required in always-loaded global/AGENTS.md.
 * Deterministic substring checks only — no fuzzy reachability or severity classification.
 */
export const GLOBAL_AGENTS_OUTCOME_FIRST_MARKERS: readonly string[] = [
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

/**
 * Qualification-specific Pilot-Ready markers required in the canonical Change-Ready skill.
 * Sole complete Pilot safety-floor owner is always-loaded global/AGENTS.md; this array requires
 * disposition/coexistence/terminal markers plus an explicit global-floor authority reference —
 * not a second complete floor enumeration.
 */
export const CHANGE_READY_SDLC_PILOT_READY_MARKERS: readonly string[] = [
  "Pilot-Ready Decision",
  "Pilot-Ready: yes | no | not requested",
  "not a third lifecycle profile",
  "Ordinary Small | Material",
  "complete Pilot safety floor is authoritative only in always-loaded global",
  "Neither disposition authorizes",
  "does not automatically erase independently proven Pilot-Ready",
  "does not undermine candidate identity/scope, proof, containment, safety floor, validation, or material-risk acceptance",
];

/**
 * Surfaces that must not restate the complete canonical outcome-first + Pilot-Ready policy block.
 * Role/planning files keep only role-specific deltas.
 */
export const OUTCOME_FIRST_ROLE_DELTA_SURFACES: readonly string[] = [
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

/**
 * Exact phrases that mark a complete policy copy when present together above threshold
 * on a role/planning delta surface (sole complete floor owner is always-loaded global AGENTS;
 * skill and role/planning files keep only deltas).
 */
export const OUTCOME_FIRST_COMPLETE_POLICY_MARKERS: readonly string[] = [
  "cannot waive uncontrolled authorization",
  "material residual-risk bundle",
  "Neither disposition authorizes",
  "prose-only limits are not containment",
  "Pilot-Ready Decision",
  "`Non-Deferrable Invariants`",
  "remove unnecessary capability",
  "not a third lifecycle profile",
];

/** How many complete-policy markers on a role/planning surface trigger duplication failure. */
export const OUTCOME_FIRST_COMPLETE_POLICY_DUPLICATE_THRESHOLD = 5;

/**
 * Fan-out and specialist-continuation tokens required in global/AGENTS.md when concurrent writers apply.
 */
export const GLOBAL_AGENTS_FANOUT_CONTINUATION_TOKENS: readonly string[] = [
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
