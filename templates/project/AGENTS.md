# Project Agent Instructions

This project follows verified-outcome delivery with conditional Development/MVP/RC/stable qualification.

## Runtime Authority

- Shared runtime authority lives in the active global OpenCode config: `principles-of-work.md`, operational `AGENTS.md`, and the conditional `change-ready-sdlc` skill. This project file supplies adapters, routing, and project constraints only; it cannot substitute missing global contracts.
- Resolve the kit custom config directory to `OPENCODE_CONFIG_DIR` when set; otherwise inspect the host default global directory. A custom directory does not prove every host-default or project source is unloaded; detect authority collisions before qualification.
- Missing active global `principles-of-work.md` or `AGENTS.md` blocks Material/qualification work that requires the shared authority. Missing `change-ready-sdlc` blocks only when Material/explicit qualification requires the skill. Do not invent a partial process or foreign stack default.
- Apply the conceptual Universal Development Loop only as guidance consistent with the active global contracts; do not depend on a target-relative kit path for runtime authority.

## Project Adapter

- Keep project-specific commands in `opencode-dev-kit/adapter.json` and/or `opencode-dev-kit/validation.md`.
- Standard `openspec-propose`, `openspec-apply-change`, `openspec-archive-change`, and `opsx-*` lifecycle names are global-owned. Do not copy or customize those names under `.opencode`; keep domain helpers differently named.
- Use explicit reusable workflow cores from the resolved kit `global/bin/` with an explicit project root and project command argv. Keep package-manager, shell, service, and repository-specific behavior in this project's thin adapter rather than modifying the portable core.
- Before relying on a new or materially changed reusable tool, require proof from an unrelated disposable project; success only in the kit repository is component evidence.
- Either complete source is sufficient for doctor validation qualification: concrete `adapter.json` validation entries, or a complete `validation.md` Purpose/Command table for Focused test, Full test, Typecheck, Lint, and Build.
- Technology choices change commands and constraints, not the development loop.
- If validation commands are unknown, discover them from project files and report `unknown` rather than guessing.
- Unattended missions additionally require `unattended.validationArgv` as an argument array, `workflowOwner: global-canonical`, explicit supported checkpoint modes, and per-mission local-commit authorization. Shell command strings in `validation` remain human/ordinary-workflow adapters and do not substitute for aggregate argv.
- Autonomous campaigns use the explicit `opencode-dev-kit/work-campaign.json` and `opencode-dev-kit/work-campaign-adapter.json` templates. Resolve every placeholder and run `npm run doctor -- --project <root> --require campaign` before explicit supervisor installation; project init and doctor never register, start, or resume a campaign.
- `unknown`, blank, bare `N/A`, `TBD`/`TODO`, replace-me placeholders, or otherwise unresolved validation procedures must be discovered before qualification. An explicit reasoned `N/A` (`N/A - <reason>`, or validation.md Command `N/A` plus nonempty non-placeholder Notes) is a recorded decision, not unknown. Inside qualification, applicable unresolved or skipped validation leaves the candidate at MVP and blocks RC.

## Autonomy

- Apply the active global working philosophy and pre-escalation recovery contracts without copying them: quality without proxy substitution, shortest verified path, autonomy until a real owner boundary, maximum token economy, and evidence-backed continuous improvement. Fix, narrow, or remove concrete impediments at the smallest authorized layer without weakening safety, scope, or protected boundaries.
- Ask the user only for exact user-owned blockers: credentials/elevation, missing external systems, destructive/remote actions, owner/product/security/legal decisions, protected-boundary semantic expansion, material residual-risk acceptance, or MR/PR outcomes. Plans, OpenSpec artifacts, tasks, revisions, attempt limits, and stop lines adapt autonomously when accepted semantics remain unchanged; never ask solely to approve those controls, a successor attempt, or another process counter. The underlying protected action remains separately gated.
- A progress checkpoint, long work cycle, green validation, still-open task, locally resolvable failure, or blocked live/external gate does not justify asking whether to continue. Continue safe local/offline required work and stop only the affected action at its exact owner boundary.
- Delivery-drag handling follows the active global outcome-preserving delivery-checkpoint contract. This project adapter adds no trigger, timer, scorer, scheduler, or owner-question rule.
- For explicitly grind-enabled roots, follow the complete task-scoped frontier contract in active global authority: drain every runnable accepted item before a product decision or non-product waiting. This project adapter adds no product/gate semantics and grants no protected-action authority; outside grind its existing owner-handoff rules remain unchanged.
- Do not commit, push, merge, delete source artifacts, or alter remote state unless explicitly requested and allowed by repository policy.
- Preserve user and teammate changes. Never revert files you did not change unless explicitly requested.

## Owner Decision Handoff

- Follow the active global self-contained owner-handoff contract; this project defines no competing field list.
- Before a real owner blocker, provide one self-contained message with goal/state, evidence/unknowns, attempts, authority need, options/consequences, risks/cost, recommendation, exact reply, preserved state, and next action; assume the user will not open earlier chat, code, documents, logs, or links.
- Treat references and internal IDs as optional supporting evidence. Offer 2-4 options only for real alternatives, recommend one, and mentally remove every reference to verify the message stands alone.

## Process Control

- Ordinary Small default: main is the default production author and run-observe-corrects the smallest complete happy path, completes accepted scope, runs focused validation, and reports `Outcome: working | blocked | unknown` with proof and limitations. `Development-Stage: development | MVP | RC<n> | stable` applies only to explicit/project-required or named-critical-risk qualification; no stage authorizes external operations.
- OpenSpec proposals declare one `Automation Dividend`. Use `repo-candidate-snapshot` for Git inspection.
- Do not load `change-ready-sdlc` merely because code or config behavior changes. Load it before mutation only for explicit stable/full qualification, project-required qualification, or concrete Material risk.
- Optional `implementation-worker` only for evidenced isolated production-only bounded slices with exact non-overlapping write scope, representative proof boundary, clear Acceptance Criteria, evidenced benefit, and a focused validation gate.
- When delegating to `implementation-worker`, pass a Universal Task Briefing Contract production brief (proportional for Ordinary Small; complete for Material/cold handoff) with exact read/write scope, forbidden actions, Acceptance Criteria, and Verification.
- After current proof, main may author the smallest focused regression. Use fresh critical-only `sdet-quality-engineer` only for a reachable named critical consequence or explicit project/owner requirement; optional reviewers never become mandatory gates.
- If the preferred production adapter is unavailable, main retains production authorship or uses another conforming author; block only when no conforming path exists. Keep writers serial when scope is unclear, write targets overlap, or integration outweighs fan-out.

### Coordinated Orchestration

- Use prompt-only orchestration only for broad work with independent bounded tracks where coordinated fan-out, fan-in, validation gates, or isolation is worth the overhead.

### Main Ownership

- Keep task tracking, integration, validation, reviewer gates, cleanup, and final synthesis in the main session.

### Scope And Evidence

- User-owned scope is accepted outcome and protected-boundary decisions. Necessary local reversible dependency closure is autonomous; optional cleanup is not. Reviewer/SDET/delivery evidence must never authorize mutation.

### Optional Reviewers

- Optional final-candidate, delivery, code-quality, and domain reviewers may run after current proof when concrete risk, project policy, or the owner requires them. Each returns a risk matrix tied to the inspected candidate/RC when one exists; missing or unusable optional output is not itself a stage blocker.

### Critical SDET

- Triggered fresh SDET returns exactly `critical-risks-reported | no-critical-risk | blocked`; main dispositions its rows and never treats it as mutation or lifecycle authority. Non-critical findings are parked.

## Quality

- Treat source, tests, schemas, scripts, generated artifacts, and live output as primary evidence.
- Implement and observably prove the smallest complete happy path for the next working increment before edge-case testing. Prefer remove/narrow/reuse/local guard before new mechanisms.
- Minimize time-to-first-real-signal for each behavior dependency chain. Run the first safely reachable real boundary sufficient to observe the accepted effect; if deferred, record its blocker, unblocker, safeguards, cleanup, evidence, and stop condition. Shift-left sequencing does not authorize external operations or weaken owner-controlled gates.
- Keep touched human-written code locally understandable; line count is a navigation signal, not a quota. Keep zero-pressure work direct and seam-only questions on the exact global Practice Owner route. When an explicit focused existing-project assessment or unresolved current comprehension pressure remains after targeted foraging and owner routing, use discovered `complexity-management` before dependent expansion; if unavailable, report focused mode unavailable rather than guessing a source. Route explicit exhaustive complexity coverage only to discovered audit/ledger owners or report project mode unavailable without approximation. Do not add responsibility to mixed code without extracting one cohesive owner or recording `split-or-justify`, and do not replace a god file with wrapper-only micro-files.
- Use the project's existing error/logging mechanism at meaningful failure boundaries. Preserve the original exception cause/stack, add structured safe operation/correlation context when useful, and avoid duplicate or routine-noise logging.
- Runtime proof must retain exit status, stdout/stderr, relevant logs/exceptions, side effects, and artifact paths. Inspect that evidence before mutation or rerun; add only the smallest missing instrumentation needed to distinguish realistic causes.
- After happy-path proof in either profile, main may create or update the smallest focused requirement-linked regression test. Prefer existing tests when sufficient.
- When the critical-risk trigger applies, only a fresh conforming SDET that did not author production may create or modify the independent critical reproducer/regression artifact after proof and accepted-scope completion.
- Prefer deterministic helpers/validators over repeated manual inspection.
- Reviewers are read-only leaves except `docs/feedbacks/**` through `complain`.

## Feedback Ledger

- On current-session workflow friction, use `complain` and append to `docs/feedbacks/<agent-or-skill-name>.md`.
- Do not wait for proof that it repeats. If recurrence is unknown, write `Recurrence: unknown`.
- The feedback path boundary is a model contract, not runtime permission enforcement; `complain` remains the required contract for entry shape and privacy checks.
- Keep entries privacy-safe and focused on workflow/tooling/instructions, not personal blame. If writing is blocked, return a `Feedback Candidate`.
