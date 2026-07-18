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

- Prefer the smallest correct change that satisfies the scoped task.
- Do not perform unrelated cleanup, formatting, or refactors. Unrequested scope expansion requires explicit user approval.
- Preserve user and teammate changes. Never revert files you did not change unless explicitly requested.
- Ordinary Small: after happy-path proof, main may create or modify the smallest focused regression test when useful. Prefer existing tests when sufficient.
- Material/explicit qualification: only a separate fresh-context testing subagent that did not author production code may create or modify automated test artifacts. Give it test-only write scope, forbid production paths, and require an independent realistic risk matrix.
- Prioritize end-to-end behavior at real system boundaries and high-impact negative scenarios over coverage percentages. Record justified mock exceptions, failures fed back into production hardening, and residual risks.
- After edits, run the closest relevant validation command or state why validation was skipped.

## Token Efficiency

- Prefer targeted search and bounded reads before loading broad file context.
- Keep responses compact: outcome, changed files, validation, blockers, and necessary rationale; preserve exact commands, paths, errors, code, and safety warnings.
- On native Windows, use `rtk <command>` explicitly for shell-heavy read-only commands; hook auto-rewrite is not supported there.
- Keep handoffs compact while preserving exact commands, paths, errors, and safety warnings.

## Autonomy

- Continue autonomously within the selected goal while safe, useful work remains.
- Ask the user only for serious blockers: missing credentials, hardware/manual gate, destructive permission, remote-state action, product-owner decision, legal/security approval, unrequested scope expansion, unavailable required artifact, or explicit user mode that forbids needed action.
- Do not ask routine questions when evidence can be gathered locally or a safe reversible default exists.
- Avoid scope creep. New tasks must directly advance the current goal or be recorded as future work.

## Process Control

- Ordinary Small production may be implemented directly by the main session.
- For delegated Material/qualification production slices, dispatch a discovered conforming production author. In this kit, `implementation-worker` is the optional default adapter for exact bounded production-only slices with non-overlapping write scope, clear Acceptance Criteria, and a focused validation gate.
- When delegating to `implementation-worker`, pass a Universal Task Briefing Contract production brief (proportional for Ordinary Small; complete for Material/cold handoff) with exact read/write scope, forbidden actions, Acceptance Criteria, and Verification.
- After applicable proof on Material/explicit qualification work, dispatch a fresh discovered conforming SDET session for systematic test-only risk assessment and automated-test authorship; never assign testing ownership to a production author. In this kit, `sdet-quality-engineer` is the optional default SDET adapter only.
- If `implementation-worker` is unavailable on the qualification path, use another conforming production author or block. Keep writers serial when scope is unclear, write targets overlap, work is coupled, or integration outweighs fan-out.
- Use prompt-only orchestration only for broad work with independent bounded tracks where coordinated fan-out, fan-in, validation gates, or isolation is worth the overhead.
- Keep task tracking, integration, validation, reviewer gates, cleanup, and final synthesis in the main session.
- For Material work, always run the discovered conforming delivery/readiness gate (this kit's optional default is `session-delivery-reviewer`) with current requirements, candidate continuity, proof, SDET, validation, review, residual-risk evidence, and bundle: goal/constraints, transcript/summary plus compaction state, files/diffstat, validation, reviewer fixes, risks; missing conforming capability blocks. Material `Change-Ready: yes` requires an explicitly accepted conforming delivery result. Missing required Material evidence produces blocked/not-enough-evidence, never skip/not-applicable solely because an optional input is unavailable. Ordinary Small uses proportional evidence and invokes that gate only when project policy, risk, or the owner requires it.
- Treat session-delivery-reviewer blocking output as binding for mandatory-gate or qualifying P0/P1 serious blockers: every `Change-Ready: no`, `Verdict: material deviations`, `Verdict: not enough evidence`, `Blocking for Acceptance: yes`, `Verdict: blocked`, qualifying P0/P1 serious blocker, or non-empty `Required Next Actions` (restricted to those classes) keeps readiness blocked; do not present the session as complete or ready-to-land. Negative delivery verdict or `Change-Ready: no` must not coexist with `Blocking for Acceptance: no` and `Required Next Actions: none`. P2/note polish must not enter Required Next Actions; full anti-polishing detail lives in active global `change-ready-sdlc`. Continue autonomous work when safe, or ask/escalate only the exact user-owned blocker; partial slice handoff must not end an unfinished root goal.

## Review And Evidence

- Findings require evidence, impact, recommendation, and confidence.
- Missing evidence for critical behavior is a finding, blocker, or accepted risk.
- Reviewer agents should be leaf validators: read-only except feedback-ledger appends under `docs/feedbacks/**`, no source/config/instruction edits, no commits, no pushes, no nested agents, no user questions.

## Feedback Ledger

- When current-session workflow friction, instruction conflict, tooling pain, missing automation, confusing handoff, validation noise, or reusable improvement opportunity appears, use the `complain` skill and append a structured entry to `docs/feedbacks/<agent-or-skill-name>.md`.
- Do not wait for proof that the issue is recurring. If recurrence is unknown, write `Recurrence: unknown`.
- OpenCode permissions enforce the feedback path boundary; `complain` is the required model contract for entry shape and privacy checks.
- Keep entries privacy-safe and focused on workflow/tooling/instructions, not personal blame. If writing is blocked, return a `Feedback Candidate`.

## Deterministic Helper Automation

- For repetitive, evidence-heavy, or token-heavy work, first consider whether a small deterministic helper could gather, count, validate, redact, diff, inventory, or enforce explicit rules more efficiently than manual inspection.
- When writing helper code for agent workflow, make it deterministic and contract-driven: explicit inputs, explicit outputs, schemas or fixtures, stable ordering, and privacy-safe output.
- Helper code must have no hidden heuristics: do not encode fuzzy scoring, probabilistic classification, model-like summarization, or unstated inference as evidence.
- If deterministic helper code cannot answer something from its inputs, report `unknown`, `unreadable`, `unsupported`, or `blocked` instead of guessing.
- Keep judgment-heavy synthesis in the agent/reviewer layer; use helper code to gather, count, validate, redact, diff, inventory, or enforce explicit rules.

## Git And Remote State

- Do not commit, push, merge, delete source artifacts, or alter remote state unless explicitly requested and allowed by repository policy.
- Before committing, inspect status, diff, and recent log; stage only intended files.
- Before creating or updating a PR/MR, inspect status, diff, remote tracking, included commits, validation evidence, and linked issues.

## Documentation

- Keep README/docs/specs synchronized with public behavior.
- Prefer one canonical source of truth over duplicated status or requirement prose.
- Behavior-changing requirements should be represented in the project's normative spec system when one exists.
