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
] as const;

/** Closed-world markers required in the canonical Change-Ready skill body. */
export const CHANGE_READY_SDLC_CLOSED_WORLD_MARKERS: readonly string[] = [
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

/** Closed-world markers required in always-loaded global AGENTS routing. */
export const GLOBAL_AGENTS_CLOSED_WORLD_MARKERS: readonly string[] = [
  "post-freeze scope may only shrink",
  "new revision or separate change",
  "never authorize scope expansion",
  "Blocking Evidence",
  "Follow-up Candidates",
  "one correction wave",
  "approved | approved_with_notes | rejected | blocked",
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
