## Why

The current Change-Ready policy can turn exhaustion of an internal correction or review budget into a user-facing process blocker even when the accepted outcome is unfinished and safe local reversible diagnosis or repair remains available. This produces decision-poor handoffs that ask the user to approve an internal revision instead of delivering a working result, recording deferrable debt, or naming the exact protected boundary that requires owner authority.

## What Changes

- Separate root-outcome completion from candidate qualification so a failed or exhausted qualification attempt can reject `Change-Ready` without automatically blocking the unfinished user goal.
- **BREAKING** Replace the post-mutation closed-world file/task lock with an outcome-and-protected-boundary lock: necessary local reversible dependency closure remains autonomous, while changes to the accepted outcome, public contract, persisted-data semantics, security/privacy/authorization semantics, destructive or remote actions, deployment/activation, credentials/elevation, and other owner-controlled boundaries still require explicit approval.
- Treat revision and qualification-attempt identifiers as internal evidence bookkeeping rather than user decisions when outcome, non-goals, and protected boundaries are unchanged.
- Route serious proof, SDET, validation, final-review, and delivery failures back to bounded diagnosis and the correct owner when an authorized repair path exists; retain finite per-candidate qualification waves and forbid unchanged-candidate retry loops.
- Classify unresolved findings as outcome blockers, non-deferrable safety/integrity blockers, contained material limitations, or deferrable technical debt so only the first two prevent a working-result handoff inside the enforced operating envelope.
- Require a decision-ready blocker handoff before asking the user: current outcome status, exact failure and evidence, known or unknown root cause, attempted autonomous paths, why user action is uniquely required, concrete options and trade-offs, and preserved candidate state.
- Add deterministic instruction-contract checks and fresh-session behavioral evaluations for process-only blocking, autonomous local repair, residual-debt handoff, protected-boundary escalation, and no-progress technical blockers.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `library-change-ready-sdlc`: Redefine scope authority, qualification-attempt termination, correction routing, technical-debt disposition, and blocker handoff around the accepted outcome and protected boundaries.
- `library-instruction-artifacts`: Require one non-contradictory outcome-first autonomy contract across loaded and project-facing instruction surfaces, with deterministic anti-regression checks and bounded behavioral evaluations.

## Impact

- Loaded runtime policy in `global/AGENTS.md` and qualification detail in `global/skills/change-ready-sdlc/SKILL.md`.
- Project-facing mirrors and maintenance guidance, including `REPO_AGENTS.md`, reusable project instructions, the Universal Development Loop, and project templates where they currently encode closed-world scope or terminal correction semantics.
- Qualification and delivery role prompts only where their report or routing contract must distinguish attempt rejection from root-goal blocking; leaf roles remain non-authorizing.
- Existing contract and validator modules under `tools/contracts/` and `tools/validators/`, plus focused contract and fresh-session behavioral tests.
- No new runtime service, persistent lifecycle store, automatic remote/destructive action, deployment authority, security waiver, or reusable evidence framework.
