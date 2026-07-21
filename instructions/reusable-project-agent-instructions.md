# Reusable Project Agent Instructions

Use this template as a starting point for a project-level `AGENTS.md`. Keep only rules that are durable for the repository.

## Runtime Authority And Development Loop

Shared runtime lifecycle authority lives in the active global OpenCode config: always-loaded `AGENTS.md` and the conditional `change-ready-sdlc` skill. Resolve the active global config directory to `OPENCODE_CONFIG_DIR` when set; otherwise use the host default global config directory. When `OPENCODE_CONFIG_DIR` is set, the default global directory is bypassed and not loaded. Missing active global `AGENTS.md` blocks Material/qualification work that requires it. Missing `change-ready-sdlc` blocks only when Material/explicit qualification requires the skill. Do not invent a partial process or foreign stack default.

The conceptual Universal Development Loop is optional guidance only when it stays consistent with those active global contracts. Do not depend on a target-relative kit path such as `instructions/universal-development-loop.md` for runtime authority, and do not restate a competing step list in this template.

- Technology-specific commands and constraints adapt the loop; they do not create separate workflows.
- Start broad work with a deterministic project inventory, targeted search, or repository-native command before reading large file sets.
- Ordinary Small default: study the original requirements, implement the smallest complete happy path, prove it through observable execution, run focused validation, then inspect only realistic requirement-linked edge cases.
- Do not load `change-ready-sdlc` merely because code or config behavior changes. Load it before mutation only for explicit Change-Ready, project-required qualification, or concrete Material risk.
- Run focused validation first, then broaden validation when boundaries, APIs, data, deployment, or compatibility are affected.
- Use read-only reviewer gates only when the risk justifies them, and report skipped gates with the reason. Reviewer feedback-ledger writes under `docs/feedbacks/**` are the only default write exception.

## Sources Of Truth

- Treat source code, tests, schemas, scripts, generated artifacts, and live command output as primary evidence.
- Treat docs, comments, issue text, summaries, and user claims as navigation until verified.
- If prose and implementation disagree, surface the conflict and trust executable/source evidence until resolved.
- Put product requirements in the project's spec or docs system, not in agent instructions.

## Work Style

- Prefer the next useful working increment inside a technically enforced operating envelope; remove/narrow/reuse/local guard before new mechanisms.
- No unrelated cleanup/refactors. Scope expansion (changed accepted outcome, out-of-envelope behavior, weakened invariant, protected-boundary crossing) needs explicit user approval; necessary local reversible dependency closure does not.
- Preserve user and teammate changes. Never revert files you did not change unless explicitly requested.
- Ordinary Small: after happy-path proof, main may create or modify the smallest focused regression test when useful. Prefer existing tests when sufficient.
- Material/explicit qualification: only a separate fresh-context testing subagent that did not author production code may create or modify automated test artifacts. Give it test-only write scope, forbid production paths, and require an independent realistic risk matrix.
- Prioritize end-to-end behavior at real system boundaries and high-impact negative scenarios over coverage percentages. Record justified mock exceptions, failures fed back into production hardening, and residual risks.
- After edits, run the closest relevant validation command or state why validation was skipped.

## Token Efficiency

- Prefer targeted search/reads. Compact handoffs; preserve exact commands, paths, errors. On native Windows use `rtk <command>` explicitly.

## Autonomy

- Continue autonomously within the selected goal while safe, useful work remains.
- Ask the user only for exact user-owned blockers: credentials/elevation, hardware/manual gate, destructive/remote authorization, product/legal/security decision, protected-boundary semantic expansion, missing external capability, material residual-risk acceptance, or mode that forbids the action. Never ask solely to approve an internal revision or process counter. Decision-ready handoff: outcome status, failure/evidence, root cause, attempted paths, exact ask, alternatives, residual risk, preserved state.
- No routine questions when local evidence or a safe reversible default exists.
- Necessary local reversible work for the accepted outcome may be added with traceability; optional improvements stay residual.

## Process Control

- Ordinary Small production may be implemented directly by the main session.
- For delegated Material/qualification production slices, dispatch a discovered conforming production author. In this kit, `implementation-worker` is the optional default adapter for exact bounded production-only slices with non-overlapping write scope, clear Acceptance Criteria, and a focused validation gate.
- When delegating to `implementation-worker`, pass a Universal Task Briefing Contract production brief (proportional for Ordinary Small; complete for Material/cold handoff) with exact read/write scope, forbidden actions, Acceptance Criteria, and Verification.
- After applicable proof on Material/explicit qualification work, dispatch a fresh discovered conforming SDET session for systematic test-only risk assessment and automated-test authorship; never assign testing ownership to a production author. In this kit, `sdet-quality-engineer` is the optional default SDET adapter only.
- If `implementation-worker` is unavailable on the qualification path, use another conforming production author or block. Keep writers serial when scope is unclear, write targets overlap, work is coupled, or integration outweighs fan-out.
- Use prompt-only orchestration only for broad work with independent bounded tracks where coordinated fan-out, fan-in, validation gates, or isolation is worth the overhead.
- Keep task tracking, integration, validation, reviewer gates, cleanup, and final synthesis in the main session.
- For Material work, always run the discovered conforming delivery/readiness gate (this kit's optional default is `session-delivery-reviewer`) with current requirements, candidate continuity, proof, SDET, validation, review, residual-risk evidence, and bundle: goal/constraints, transcript/summary plus compaction state, files/diffstat, validation, reviewer fixes, risks; missing conforming capability blocks. Material `Change-Ready: yes` requires an explicitly accepted conforming delivery result. Missing required Material evidence produces blocked/not-enough-evidence, never skip/not-applicable solely because an optional input is unavailable. Ordinary Small uses proportional evidence and invokes that gate only when project policy, risk, or the owner requires it.
- User-owned scope is accepted outcome and protected boundaries. Necessary local reversible dependency closure is autonomous; optional cleanup is not. Reviewer/SDET/delivery findings may bind readiness via `Blocking Evidence` but never authorize mutation. One in-attempt correction wave for candidate-attributable outcome/invariant defects with authorized local reversible fit; else stop that attempt. Persistent evidence infrastructure is a separate prerequisite unless dependency-closure applies. Final/delivery rejection is terminal for the inspected attempt only and does not automatically end the root goal or require internal-revision approval.
- Session-delivery-reviewer blockers bind the inspected candidate: every `Change-Ready: no`, `Verdict: material deviations`, `Verdict: not enough evidence`, `Blocking for Acceptance: yes`, `Verdict: blocked`, or non-empty `Blocking Evidence` keeps readiness blocked; do not present the session as complete or ready-to-land. Negative delivery/`Change-Ready: no` must not pair with `Blocking for Acceptance: no` and empty `Blocking Evidence`. P2/note → Residual Risks or non-authorizing `Follow-up Candidates`. Detail: active global `change-ready-sdlc`. Continue when safe, or ask only the exact user-owned blocker; partial slice handoff must not end an unfinished root goal.

## Review And Evidence

- Findings require evidence, impact, recommendation, and confidence.
- Missing evidence for critical behavior is a finding, blocker, or accepted risk.
- Reviewer agents should be leaf validators: read-only except feedback-ledger appends under `docs/feedbacks/**`, no source/config/instruction edits, no commits, no pushes, no nested agents, no user questions.

## Feedback Ledger

- On current-session workflow friction, use `complain` and append to `docs/feedbacks/<agent-or-skill-name>.md`. `Recurrence: unknown` is fine. Privacy-safe only. If write is blocked, return a `Feedback Candidate`.

## Deterministic Helper Automation

- Prefer small deterministic helpers: explicit inputs/outputs, schemas/fixtures, stable ordering, privacy-safe output, no hidden heuristics or fuzzy scoring.

## Git And Remote State

- Do not commit, push, merge, delete source artifacts, or alter remote state unless explicitly requested and allowed by repository policy.
- Before committing, inspect status, diff, and recent log; stage only intended files.
- Before creating or updating a PR/MR, inspect status, diff, remote tracking, included commits, validation evidence, and linked issues.

## Documentation

- Keep README/docs/specs synchronized with public behavior.
- Prefer one canonical source of truth over duplicated status or requirement prose.
- Behavior-changing requirements should be represented in the project's normative spec system when one exists.
