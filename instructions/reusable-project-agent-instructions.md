# Reusable Project Agent Instructions

Use this template as a starting point for a project-level `AGENTS.md`. Keep only rules that are durable for the repository.

## Runtime Authority And Development Loop

Shared runtime authority must come from one coherent kit source containing `principles-of-work.md`, operational `AGENTS.md`, and the conditional `change-ready-sdlc` skill. Resolve the kit custom directory to `OPENCODE_CONFIG_DIR` when set; otherwise inspect the host default global directory. Do not infer that setting a custom directory unloads every host-default or project source; detect same-name collisions before qualification. Missing kit principles or `AGENTS.md` blocks Material/qualification work that requires the shared authority. Missing `change-ready-sdlc` blocks only when Material/explicit qualification requires the skill. Do not invent a partial process or foreign stack default.

The conceptual Universal Development Loop is optional guidance only when it stays consistent with those active global contracts. Do not depend on a target-relative kit path such as `instructions/universal-development-loop.md` for runtime authority, and do not restate a competing step list in this template.

- Technology-specific commands and constraints adapt the loop; they do not create separate workflows.
- Start broad work with a deterministic project inventory, targeted search, or repository-native command before reading large file sets.
- Ordinary Small default: implement and prove the smallest complete happy path, complete accepted scope, run focused validation, then report `Outcome: working | blocked | unknown` with proof and limitations without RC/stable ceremony.
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
- Minimize time-to-first-real-signal per behavior dependency chain: execute the first safely reachable real boundary sufficient to observe the accepted effect before dependent expansion, or record the exact blocker/unblocking or replan task, authorization, effect suppression, restoration/cleanup, evidence, and path-scoped stop condition. Shift-left sequencing does not authorize external operations or weaken protected gates.
- For current non-trivial compound work, follow the active global leaf-first dependency contract: plan parent-to-leaf, execute and prove dependency-valid leaves before their parent, retain a distinct parent integration oracle, and keep cohesive Ordinary Small and same-oracle mechanical work direct. This mirror adds no numeric granularity rule, semantic inference, or owner-question step and never weakens exact gates or accepted proof.
- Delivery-drag handling uses the active global outcome-preserving delivery-checkpoint contract. This reusable template adds no trigger, timer, scorer, scheduler, or owner-question rule.
- No unrelated cleanup/refactors. Scope expansion (changed accepted outcome, out-of-envelope behavior, weakened invariant, protected-boundary crossing) needs explicit user approval; necessary local reversible dependency closure does not. Plans, OpenSpec artifacts, tasks, revisions, attempt limits, and stop lines are autonomous process controls when accepted semantics remain unchanged; update them and continue instead of asking for process approval, while separately gating the underlying protected action.
- OpenSpec changes consume the active global artifact-profile/risk-disposition contract. Project instructions do not infer compact/full/legacy eligibility, equate artifact shape with risk, or recreate omitted compact no-op records; loaded OpenSpec skills and operation gates own the detailed contract.
- Keep touched human-written code locally understandable; line count is a navigation signal, not a quota. One semantic owner may delegate to a private capability with a current contract and direct oracle when the old path delegates or is removed; the physical file alone creates no sibling owner, and capability proof does not replace parent integration. Zero-pressure work stays direct. A new-axis or mixed-responsibility question retains the exact global Practice Owner route. If an explicit focused existing-project assessment or unresolved current comprehension pressure remains after targeted foraging and owner routing, use discovered `complexity-management` before dependent expansion; if unavailable, report focused mode unavailable without guessing a source. Explicit exhaustive complexity coverage uses the discovered audit/ledger owners or reports project mode unavailable without approximation. Adding responsibility to mixed code still requires one cohesive owner extraction or `split-or-justify`, not a mixed coordinator, wrapper-only fragmentation, or broad cleanup.
- At meaningful failure boundaries, use existing project diagnostics, preserve the original exception cause/stack, and add structured safe operation/correlation context without duplicate or routine-noise logging. Real-boundary proof retains exit status, stdout/stderr, relevant logs/exceptions, and artifact paths for inspection before mutation or rerun.
- Preserve user and teammate changes. Never revert files you did not change unless explicitly requested.
- Ordinary Small: after happy-path proof, main may create or modify the smallest focused regression test when useful. Prefer existing tests when sufficient.
- After happy-path proof, main may author the smallest focused requirement-linked regression. A separate fresh-context testing subagent is required only for a reachable named critical consequence or explicit project/owner requirement; give it test-only scope and forbid production paths.
- Prioritize end-to-end behavior at real system boundaries and high-impact negative scenarios over coverage percentages. Record justified mock exceptions, failures fed back into production hardening, and residual risks.
- After edits, run the closest relevant validation command or state why validation was skipped.

## Token Efficiency

- Prefer targeted search/reads. Keep routine handoffs compact, but never shorten context required for an owner decision. Preserve exact commands, paths, errors.

## Autonomy

- Follow the active global working philosophy without copying it: quality without proxy substitution, shortest verified path, autonomy until a real owner boundary, maximum token economy, and evidence-backed continuous improvement. Fix, narrow, or remove concrete impediments at the smallest authorized layer without weakening safety, scope, protected boundaries, or unrelated work.
- Ask the user only for exact user-owned blockers: credentials/elevation, hardware/manual gate, destructive/remote authorization, product/legal/security decision, protected-boundary semantic expansion, missing external capability, material residual-risk acceptance, or mode that forbids the action. Never ask solely to approve an internal revision, plan/spec/task update, successor attempt, attempt-limit change, stop-line change, or process counter. Every owner question must satisfy the Owner Decision Handoff contract below.
- Before a blocker question, follow the active global pre-escalation recovery contract; this template defines no competing fields.
- A progress checkpoint, long work cycle, green validation, still-open task, locally resolvable failure, or blocked live/external gate does not justify asking whether to continue. Continue safe local/offline required work and stop only the affected action at its exact owner boundary.
- For explicitly grind-enabled roots, use the active global task-scoped frontier contract rather than this reusable pointer: drain every runnable accepted item before a product decision or non-product waiting, and preserve separate protected-action authority. Outside grind, retain the ordinary self-contained owner handoff.
- Necessary local reversible work for the accepted outcome may be added with traceability; optional improvements stay residual.

## Owner Decision Handoff

- Follow the active global self-contained owner-handoff contract; this template defines no competing field list.
- Before a real owner blocker, provide one self-contained chat message with goal/state, evidence/unknowns, attempts, authority need, options/consequences, risks/cost, recommendation, exact reply, preserved state, and next action; assume the user will not open earlier chat, code, documents, logs, or links.
- References and internal IDs are optional supporting evidence only. Present 2-4 options only for real alternatives, recommend one, and mentally remove every reference to verify the message stands alone.

## Process Control

- Main is the default production author for Ordinary Small and Material. Optional `implementation-worker` only for evidenced isolated production-only slices with non-overlapping write scope, representative proof boundary, clear Acceptance Criteria, Verification, and evidenced benefit.
- When delegating to `implementation-worker`, pass a Universal Task Briefing Contract production brief (proportional for Ordinary Small; complete for Material/cold handoff) with exact read/write scope, forbidden actions, Acceptance Criteria, and Verification.
- After current proof, complete accepted scope and use fresh critical-only `sdet-quality-engineer` only when a reachable named critical consequence or explicit project/owner requirement triggers it; optional reviewers never become mandatory gates.
- If `implementation-worker` is unavailable, main retains production authorship or uses another conforming author; block only when no conforming path exists. Keep writers serial when scope is unclear, write targets overlap, work is coupled, or integration outweighs fan-out.

### Coordinated Orchestration

- Use prompt-only orchestration only for broad work with independent bounded tracks where coordinated fan-out, fan-in, validation gates, or isolation is worth the overhead.

### Main Ownership

- Keep task tracking, integration, validation, reviewer gates, cleanup, and final synthesis in the main session.

### Scope And Evidence

- User-owned scope is accepted outcome and protected-boundary decisions. Necessary local reversible dependency closure is autonomous; optional cleanup is not. Reviewer/SDET/delivery evidence must never authorize mutation.

### Optional Reviewers

- Optional final-candidate, delivery, code-quality, and domain reviewers may run after current proof when concrete risk, project policy, or the owner requires them. Each returns a risk matrix tied to the inspected candidate/RC when one exists; missing or unusable optional output is not itself a stage blocker.

### Critical SDET

- Triggered fresh SDET returns exactly `critical-risks-reported | no-critical-risk | blocked`; main independently dispositions every row. Non-critical findings are parked.
- Handoff reports ordinary `Outcome` or qualification-only `Development-Stage: development | MVP | RC<n> | stable`; `Stable Candidate: RC<n>` appears only inside qualification.

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
