# Reusable Project Agent Instructions

Use this template as a starting point for a project-level `AGENTS.md`. Keep only rules that are durable for the repository.

## Runtime Authority And Development Loop

Shared runtime lifecycle authority must come from one coherent kit source containing `AGENTS.md` and the conditional `change-ready-sdlc` skill. Resolve the kit custom directory to `OPENCODE_CONFIG_DIR` when set; otherwise inspect the host default global directory. Do not infer that setting a custom directory unloads every host-default or project source; detect same-name collisions before qualification. Missing kit `AGENTS.md` blocks Material/qualification work that requires it. Missing `change-ready-sdlc` blocks only when Material/explicit qualification requires the skill. Do not invent a partial process or foreign stack default.

The conceptual Universal Development Loop is optional guidance only when it stays consistent with those active global contracts. Do not depend on a target-relative kit path such as `instructions/universal-development-loop.md` for runtime authority, and do not restate a competing step list in this template.

- Technology-specific commands and constraints adapt the loop; they do not create separate workflows.
- Start broad work with a deterministic project inventory, targeted search, or repository-native command before reading large file sets.
- Ordinary Small default: implement and prove the smallest complete happy path to reach MVP, complete accepted scope, run focused validation, then freeze RC and finish stable handoff when no known critical/non-deferrable defect remains.
- Do not load `change-ready-sdlc` merely because code or config behavior changes. Load it before mutation only for explicit stable/full qualification, project-required qualification, or concrete Material risk.
- Run focused validation first, then broaden validation when boundaries, APIs, data, deployment, or compatibility are affected.
- Use read-only reviewer gates only when the risk justifies them, and report skipped gates with the reason. Reviewer feedback-ledger writes under `docs/feedbacks/**` are the only default write exception.

## Sources Of Truth

- Treat source code, tests, schemas, scripts, generated artifacts, and live command output as primary evidence.
- Treat docs, comments, issue text, summaries, and user claims as navigation until verified.
- If prose and implementation disagree, surface the conflict and trust executable/source evidence until resolved.
- Put product requirements in the project's spec or docs system, not in agent instructions.

## Work Style

- Prefer the next useful working increment inside a technically enforced operating envelope; remove/narrow/reuse/local guard before new mechanisms.
- Minimize time-to-first-real-signal per behavior dependency chain: execute the earliest safely reachable real boundary before dependent expansion, or record the exact blocker, earliest unblocking task, authorization, independent effect suppression, restoration/cleanup, expected evidence, and stop condition. Shift-left sequencing does not authorize external operations or weaken protected gates.
- No unrelated cleanup/refactors. Scope expansion (changed accepted outcome, out-of-envelope behavior, weakened invariant, protected-boundary crossing) needs explicit user approval; necessary local reversible dependency closure does not.
- Keep touched human-written code locally understandable. Line count is a navigation signal, not a quota; adding a responsibility to an already mixed file requires one cohesive extraction or a `split-or-justify` decision, not wrapper-only fragmentation or a broad cleanup.
- At meaningful failure boundaries, use existing project diagnostics, preserve the original exception cause/stack, and add structured safe operation/correlation context without duplicate or routine-noise logging. Real-boundary proof retains exit status, stdout/stderr, relevant logs/exceptions, and artifact paths for inspection before mutation or rerun.
- Preserve user and teammate changes. Never revert files you did not change unless explicitly requested.
- Ordinary Small: after happy-path proof, main may create or modify the smallest focused regression test when useful. Prefer existing tests when sufficient.
- Material/explicit qualification: only a separate fresh-context testing subagent that did not author production code may create or modify automated test artifacts. Give it test-only write scope, forbid production paths, and require an independent realistic risk matrix.
- Prioritize end-to-end behavior at real system boundaries and high-impact negative scenarios over coverage percentages. Record justified mock exceptions, failures fed back into production hardening, and residual risks.
- After edits, run the closest relevant validation command or state why validation was skipped.

## Token Efficiency

- Prefer targeted search/reads. Keep routine handoffs compact, but never shorten context required for an owner decision. Preserve exact commands, paths, errors. On native Windows use `rtk <command>` explicitly.

## Autonomy

- Follow active global quality/safety -> autonomy -> speed without copying it. Continue within the goal while safe, useful work remains.
- Ask the user only for exact user-owned blockers: credentials/elevation, hardware/manual gate, destructive/remote authorization, product/legal/security decision, protected-boundary semantic expansion, missing external capability, material residual-risk acceptance, or mode that forbids the action. Never ask solely to approve an internal revision or process counter. Every owner question must satisfy the Owner Decision Handoff contract below.
- No routine questions when local evidence or a safe reversible default exists.
- Necessary local reversible work for the accepted outcome may be added with traceability; optional improvements stay residual.

## Owner Decision Handoff

- Follow the active global self-contained owner-handoff contract; this template defines no competing field list.
- Before a real owner blocker, provide one self-contained chat message with goal/state, evidence/unknowns, attempts, authority need, options/consequences, risks/cost, recommendation, exact reply, preserved state, and next action; assume the user will not open earlier chat, code, documents, logs, or links.
- References and internal IDs are optional supporting evidence only. Present 2-4 options only for real alternatives, recommend one, and mentally remove every reference to verify the message stands alone.

## Process Control

- Main is the default production author for Ordinary Small and Material. Optional `implementation-worker` only for evidenced isolated production-only slices with non-overlapping write scope, representative proof boundary, clear Acceptance Criteria, Verification, and evidenced benefit.
- When delegating to `implementation-worker`, pass a Universal Task Briefing Contract production brief (proportional for Ordinary Small; complete for Material/cold handoff) with exact read/write scope, forbidden actions, Acceptance Criteria, and Verification.
- After MVP on Material behavior work, complete accepted scope and use fresh critical-only `sdet-quality-engineer`; optional reviewers never become mandatory gates. Never assign Material test authorship to a production author.
- If `implementation-worker` is unavailable, main retains production authorship or uses another conforming author; block only when no conforming path exists. Keep writers serial when scope is unclear, write targets overlap, work is coupled, or integration outweighs fan-out.
- Use prompt-only orchestration only for broad work with independent bounded tracks where coordinated fan-out, fan-in, validation gates, or isolation is worth the overhead.
- Keep task tracking, integration, validation, reviewer gates, cleanup, and final synthesis in the main session.
- User-owned scope is accepted outcome and protected-boundary decisions. Necessary local reversible dependency closure is autonomous; optional cleanup is not. Reviewer/SDET/delivery evidence must never authorize mutation.
- Optional final-candidate, delivery, code-quality, and domain reviewers may run after MVP when concrete risk, project policy, or the owner requires them. Each returns a risk matrix tied to the inspected-RC for main disposition; missing or unusable optional output is not itself a stage blocker.
- Fresh Material SDET returns exactly `critical-risks-reported | no-critical-risk | blocked`; continue only after an immediately-prior main-confirmed critical defect, production fix, and new proof, and permanently stop otherwise. Non-critical findings are parked and never prolong the loop.
- Handoff reports `Development-Stage: development | MVP | RC<n> | stable` and `Stable Candidate: RC<n>` when stable.

## Review And Evidence

- Risk rows require a stable Risk ID, requirement/invariant, reachability/envelope, evidence, business consequence, likelihood, confidence, reproduction procedure when feasible, and smallest mitigation note.
- Missing evidence for critical behavior is an evidence-gap row for main disposition.
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
