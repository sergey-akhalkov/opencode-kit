# Project Agent Instructions

This project follows the portable Development/MVP/RC/stable process for AI-assisted development.

## Runtime Authority

- Shared runtime lifecycle authority lives in the active global OpenCode config: always-loaded `AGENTS.md` and the conditional `change-ready-sdlc` skill. This project file supplies adapters, routing, and project constraints only; it cannot substitute missing global contracts.
- Resolve the active global config directory to `OPENCODE_CONFIG_DIR` when set; otherwise use the host default global config directory. When `OPENCODE_CONFIG_DIR` is set, the default global directory is bypassed and not loaded.
- Missing active global `AGENTS.md` blocks Material/qualification work that requires it. Missing `change-ready-sdlc` blocks only when Material/explicit qualification requires the skill. Do not invent a partial process or foreign stack default.
- Apply the conceptual Universal Development Loop only as guidance consistent with the active global contracts; do not depend on a target-relative kit path for runtime authority.

## Project Adapter

- Keep project-specific commands in `opencode-dev-kit/adapter.json` and/or `opencode-dev-kit/validation.md`.
- Either complete source is sufficient for doctor validation qualification: concrete `adapter.json` validation entries, or a complete `validation.md` Purpose/Command table for Focused test, Full test, Typecheck, Lint, and Build.
- Technology choices change commands and constraints, not the development loop.
- If validation commands are unknown, discover them from project files and report `unknown` rather than guessing.
- `unknown`, blank, bare `N/A`, `TBD`/`TODO`, replace-me placeholders, or otherwise unresolved validation procedures must be discovered before qualification. An explicit reasoned `N/A` (`N/A - <reason>`, or validation.md Command `N/A` plus nonempty non-placeholder Notes) is a recorded decision, not unknown. Applicable unresolved or skipped validation leaves the candidate at MVP and blocks RC.

## Autonomy

- Continue autonomously when local evidence or a safe reversible default is enough.
- Ask the user only for exact user-owned blockers: credentials/elevation, missing external systems, destructive/remote actions, owner/product/security/legal decisions, protected-boundary semantic expansion, material residual-risk acceptance, or MR/PR outcomes. Never ask solely to approve an internal revision or process counter.
- Do not commit, push, merge, delete source artifacts, or alter remote state unless explicitly requested and allowed by repository policy.
- Preserve user and teammate changes. Never revert files you did not change unless explicitly requested.

## Process Control

- Ordinary Small default: main is the default production author and run-observe-corrects the smallest complete happy path to MVP, completes accepted scope, runs focused validation, freezes RC when no known critical/non-deferrable defect remains, then finishes stable handoff. `Development-Stage: development | MVP | RC<n> | stable`; no stage authorizes external operations. Report `Stable Candidate: RC<n>` when stable.
- Do not load `change-ready-sdlc` merely because code or config behavior changes. Load it before mutation only for explicit stable/full qualification, project-required qualification, or concrete Material risk.
- Optional `implementation-worker` only for evidenced isolated production-only bounded slices with exact non-overlapping write scope, representative proof boundary, clear Acceptance Criteria, evidenced benefit, and a focused validation gate.
- When delegating to `implementation-worker`, pass a Universal Task Briefing Contract production brief (proportional for Ordinary Small; complete for Material/cold handoff) with exact read/write scope, forbidden actions, Acceptance Criteria, and Verification.
- After MVP on Material behavior work, complete accepted scope and use fresh critical-only `sdet-quality-engineer`; optional reviewers never become mandatory gates. Never assign Material test authorship to a production author.
- If the preferred production adapter is unavailable, main retains production authorship or uses another conforming author; block only when no conforming path exists. Keep writers serial when scope is unclear, write targets overlap, or integration outweighs fan-out.
- Use prompt-only orchestration only for broad work with independent bounded tracks where coordinated fan-out, fan-in, validation gates, or isolation is worth the overhead.
- Keep task tracking, integration, validation, reviewer gates, cleanup, and final synthesis in the main session.
- User-owned scope is accepted outcome and protected-boundary decisions. Necessary local reversible dependency closure is autonomous; optional cleanup is not. Reviewer/SDET/delivery evidence must never authorize mutation.
- Optional final-candidate, delivery, code-quality, and domain reviewers may run after MVP when concrete risk, project policy, or the owner requires them. Each returns a risk matrix tied to the inspected-RC for main disposition; missing or unusable optional output is not itself a stage blocker.
- Fresh Material SDET returns exactly `critical-risks-reported | no-critical-risk | blocked`; continue only after an immediately-prior main-confirmed critical defect, production fix, and new proof, and permanently stop otherwise. Non-critical findings are parked and never prolong the loop.

## Quality

- Treat source, tests, schemas, scripts, generated artifacts, and live output as primary evidence.
- Implement and observably prove the smallest complete happy path for the next working increment before edge-case testing. Prefer remove/narrow/reuse/local guard before new mechanisms.
- Ordinary Small: after happy-path proof, main may create or update the smallest focused regression test when useful. Prefer existing tests when sufficient.
- Material behavior: only a fresh conforming SDET that did not author production may create or modify the smallest critical reproducer/regression artifact after MVP and accepted-scope completion. It prioritizes reachable critical incidents at real boundaries over coverage percentages.
- Headroom MCP: compress large reusable tool output; do not compress exact edit targets or short errors.
- Prefer deterministic helpers/validators over repeated manual inspection.
- Reviewers are read-only leaves except `docs/feedbacks/**` through `complain`.

## Feedback Ledger

- On current-session workflow friction, use `complain` and append to `docs/feedbacks/<agent-or-skill-name>.md`.
- Do not wait for proof that it repeats. If recurrence is unknown, write `Recurrence: unknown`.
- OpenCode permissions enforce the feedback path boundary; `complain` is the required model contract for entry shape and privacy checks.
- Keep entries privacy-safe and focused on workflow/tooling/instructions, not personal blame. If writing is blocked, return a `Feedback Candidate`.
