export const SKILL_NAME_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export const SKILL_DESCRIPTION_MAX_CHARS = 1024;

export const SKILL_TRIGGER_PATTERN = /\bUse this (skill|helper)\b/i;

export const SKILL_OUTPUT_CONTRACT_PATTERN = /(^## Output\b|^## Output Shapes\b|^## Minimal Ledger\b|^Workers return:|\bReturn:|\bReturn\s+)/m;

/** Canonical relative path of the portable Change-Ready skill. */
export const CHANGE_READY_SDLC_SKILL_NAME = "change-ready-sdlc";

export const CHANGE_READY_SDLC_SKILL_RELATIVE_PATH = "global/skills/change-ready-sdlc/SKILL.md";

/** Exact case-sensitive D13 lifecycle markers required in the canonical skill. */
export const CHANGE_READY_SDLC_LIFECYCLE_MARKERS: readonly string[] = [
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
 * Covers implementation, bug fix, refactor, loaded instruction, configuration change,
 * generated-output change, Change-Ready, review-only, research, inert content.
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
];

/** Duplicate-orchestration drift threshold: unique exact D13 markers per non-canonical global Markdown artifact. */
export const CHANGE_READY_SDLC_DUPLICATE_MARKER_THRESHOLD = 6;

/**
 * Exact D15/SDLC-010 fan-out and specialist-continuation tokens required in the canonical skill.
 * Diagnostics must name the missing token and affected artifact.
 */
export const CHANGE_READY_SDLC_CONTINUATION_TOKENS: readonly string[] = [
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

/** Lifecycle role routes required in always-loaded global AGENTS routing text. */
export const LIFECYCLE_ROLE_ROUTES = [
  "implementation-worker",
  "sdet-quality-engineer",
  "final-candidate-reviewer",
] as const;

/** Maintenance instruction files that must keep production-only lifecycle routing. */
export const MAINTENANCE_ROUTING_FILES = [
  "REPO_AGENTS.md",
  "global/AGENTS.md",
  "instructions/reusable-project-agent-instructions.md",
  "templates/project/AGENTS.md",
] as const;

/**
 * Exact forbidden production-routing anti-patterns for maintenance instruction files.
 * Match whole unsafe sentences only — never broad substrings that would hit valid negation.
 */
export const FORBIDDEN_PRODUCTION_ROUTING_PATTERNS = [
  {
    needle:
      "Small behavior-changing production work may be implemented directly by the main session when the change is local and reversible.",
    diagnostic: "unsafe direct main-session behavior-changing production routing",
  },
  {
    needle:
      "If `implementation-worker` is unavailable, the main session may edit behavior-changing production directly to avoid blocking.",
    diagnostic: "unsafe unavailable-worker main-session production fallback",
  },
] as const;

/** Mandatory pre-mutation trigger and orchestration topology tokens for global/AGENTS.md. */
export const GLOBAL_AGENTS_TRIGGER_TOKENS: readonly string[] = [
  "change-ready-sdlc",
  "Before the first mutation",
  "sole orchestrator",
  "Authoritative Brief",
  "Small",
  "Material",
  "If the skill is unavailable",
  "block behavior-changing mutation",
];

/**
 * Exact D15/SDLC-010 fan-out and specialist-continuation tokens required in global/AGENTS.md.
 * Diagnostics must name the missing token and affected artifact.
 */
export const GLOBAL_AGENTS_FANOUT_CONTINUATION_TOKENS: readonly string[] = [
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
