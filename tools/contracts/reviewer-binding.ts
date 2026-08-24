import type { TextContract } from "./types.ts";
import { CODE_QUALITY_REVIEWER_FILE } from "./agents.ts";

export const PREVENTION_FEEDBACK_REVIEWER_FILES: readonly string[] = [
  "code-quality-reviewer.md",
  "deployment-config-reviewer.md",
  "evidence-sufficiency-reviewer.md",
  "execution-safety-reviewer.md",
  "implementation-readiness-reviewer.md",
  "instruction-artifact-reviewer.md",
  "legacy-client-compatibility-reviewer.md",
  "legacy-evidence-reviewer.md",
  "openspec-architecture-reviewer.md",
  "performance-reliability-reviewer.md",
  "protocol-api-reviewer.md",
  "rust-concurrency-reviewer.md",
  "test-coverage-reviewer.md",
  "wire-protocol-reviewer.md",
];

export const REVIEWER_CONTRACT_REFERENCE_TEXT: readonly string[] = [
  "## Contract Reference",
  "`instructions/leaf-reviewer-agent-contract.md`",
];

/** Closed-world output fields required on exact registered read-only reviewers only. */
export const REGISTERED_REVIEWER_OUTPUT_FIELD_TEXT: readonly string[] = [
  "Candidate Reference / RC",
  "Effective Model",
  "Risk Matrix",
  "Evidence Gaps And Residual Risks",
  "Do not return an acceptance",
];

export const REVIEWER_CONTRACT_REFERENCE_CONTRACTS: readonly TextContract[] = PREVENTION_FEEDBACK_REVIEWER_FILES.map((fileName) => ({
  fileName,
  label: `${fileName} must reference the shared reviewer contract via ## Contract Reference`,
  requiredText: [
    ...REVIEWER_CONTRACT_REFERENCE_TEXT,
    ...(fileName === CODE_QUALITY_REVIEWER_FILE
      ? ["Candidate Reference / RC", "Effective Model", "Reduction Matrix", "Evidence Gaps"]
      : REGISTERED_REVIEWER_OUTPUT_FIELD_TEXT),
  ],
}));

export const TEST_COVERAGE_REVIEWER_CONTRACT: TextContract = {
  fileName: "test-coverage-reviewer.md",
  label: "test-coverage-reviewer must require task/repro/runtime-envelope coverage",
  requiredText: [
    "## Review Inputs And Baseline Scenario",
    "user task, acceptance criteria, logs, and reproduction",
    "actual runtime envelope",
    "fresh-session behavior",
    "Task/Repro Coverage Matrix",
    "After Runtime Proof",
    "do not demand systematic tests before the production happy path and Runtime Proof",
    "do not invent acceptance scope",
  ],
};

/**
 * Exact outcome-authority markers required on loaded authority surfaces.
 * Deterministic substring checks only — no fuzzy severity/scope classification.
 * Shared intersection only: every configured surface must carry these exact substrings.
 */
export const OUTCOME_AUTHORITY_SCOPE_MARKERS: readonly string[] = [
  "accepted outcome",
  "protected-boundary",
  "dependency closure",
  "never authorize mutation",
  "critical-risks-reported",
];

/** Surfaces that must retain outcome-authority markers. */
export const OUTCOME_AUTHORITY_SCOPE_SURFACES: readonly string[] = [
  "REPO_AGENTS.md",
  "global/AGENTS.md",
  "global/skills/change-ready-sdlc/SKILL.md",
  "instructions/reusable-project-agent-instructions.md",
  "instructions/universal-development-loop.md",
  "templates/project/AGENTS.md",
];

/**
 * Exact superseded authority phrases that must not appear on loaded outcome-authority surfaces.
 * Match whole unsafe sentences/phrases only.
 */
export const OUTCOME_AUTHORITY_FORBIDDEN_PATTERNS = [
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
    needle:
      "new blocking corrections or acceptance criteria require explicit owner approval or a reproducible P0/P1 defect",
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
    needle:
      "Evidence tooling must not become a second product; it MAY be added only when a mandatory gate cannot be reproduced without it",
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
] as const;

export const AGENT_TEXT_CONTRACTS: readonly TextContract[] = [
  ...REVIEWER_CONTRACT_REFERENCE_CONTRACTS,
  TEST_COVERAGE_REVIEWER_CONTRACT,
];
