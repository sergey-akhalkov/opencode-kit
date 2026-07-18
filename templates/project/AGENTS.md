# Project Agent Instructions

This project follows the portable Change-Ready process for AI-assisted development.

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
- `unknown`, blank, bare `N/A`, `TBD`/`TODO`, replace-me placeholders, or otherwise unresolved validation procedures must be discovered before qualification. An explicit reasoned `N/A` (`N/A - <reason>`, or validation.md Command `N/A` plus nonempty non-placeholder Notes) is a recorded decision, not unknown. Applicable unresolved or skipped validation keeps `Change-Ready: no`.

## Autonomy

- Continue autonomously when local evidence or a safe reversible default is enough.
- Ask the user only for real blockers: credentials, missing external systems, destructive or remote actions, owner/product/security/legal decisions, unrequested scope expansion, or MR/PR outcomes.
- Do not commit, push, merge, delete source artifacts, or alter remote state unless explicitly requested and allowed by repository policy.
- Preserve user and teammate changes. Never revert files you did not change unless explicitly requested.

## Process Control

- Ordinary Small is the default: clear, bounded, local, reversible work with known focused validation. Main may implement directly, prove the happy path, run focused validation, and author the smallest focused regression test after proof when useful.
- Do not load `change-ready-sdlc` merely because code or config behavior changes. Load it before mutation only for explicit Change-Ready, project-required qualification, or concrete Material risk.
- For delegated Material/qualification production slices, dispatch a discovered conforming production author. In this kit, `implementation-worker` is the optional default for production-only bounded slices with exact non-overlapping write scope, clear Acceptance Criteria, and a focused validation gate.
- When delegating to `implementation-worker`, pass a Universal Task Briefing Contract production brief (proportional for Ordinary Small; complete for Material/cold handoff) with exact read/write scope, forbidden actions, Acceptance Criteria, and Verification.
- After applicable proof on Material/explicit qualification work, dispatch a fresh discovered conforming SDET session for systematic test-only risk assessment and automated-test authorship; never assign testing ownership to a production author. In this kit, `sdet-quality-engineer` is the optional default SDET adapter only.
- If the preferred production adapter is unavailable on the qualification path, use another conforming production author or block. Keep writers serial when scope is unclear, write targets overlap, or integration outweighs fan-out.
- Use prompt-only orchestration only for broad work with independent bounded tracks where coordinated fan-out, fan-in, validation gates, or isolation is worth the overhead.
- Keep task tracking, integration, validation, reviewer gates, cleanup, and final synthesis in the main session.
- For Material work, always run the discovered conforming delivery/readiness gate (this kit's optional default is `session-delivery-reviewer`) with current requirements, candidate continuity, proof, SDET, validation, review, and residual-risk evidence; missing conforming capability blocks. Material `Change-Ready: yes` requires an explicitly accepted conforming delivery result. Ordinary Small uses proportional evidence and invokes that gate only when project policy, risk, or the owner requires it.
- Treat `session-delivery-reviewer` blocking output as binding for mandatory-gate or qualifying P0/P1 serious blockers: every `Change-Ready: no`, `Verdict: material deviations`, `Verdict: not enough evidence`, `Blocking for Acceptance: yes`, `Verdict: blocked`, qualifying P0/P1 serious blocker, or non-empty `Required Next Actions` (restricted to those classes) keeps readiness blocked; do not present the session as complete or ready-to-land. Negative delivery verdict or `Change-Ready: no` must not coexist with `Blocking for Acceptance: no` and `Required Next Actions: none`. P2/note polish must not enter Required Next Actions; full anti-polishing detail lives in active global `change-ready-sdlc`. Continue autonomous work when safe, or ask/escalate only the exact user-owned blocker; partial slice handoff must not end an unfinished root goal.

## Quality

- Treat source, tests, schemas, scripts, generated artifacts, and live output as primary evidence.
- Implement and observably prove the smallest complete happy path before edge-case testing.
- Ordinary Small: after happy-path proof, main may create or update the smallest focused regression test when useful. Prefer existing tests when sufficient.
- Material/explicit qualification: only a fresh discovered conforming SDET context that did not author production code may create or modify automated test artifacts after applicable proof. In this kit, `sdet-quality-engineer` is the optional default SDET adapter only. It must derive a realistic risk matrix from the original requirements and prioritize end-to-end behavior at real system boundaries over coverage percentages.
- When Headroom MCP tools are available and a log, search result, JSON payload, validation output, or repeated tool output is likely to be reused and exceeds about 300 lines or 10 KB, call `headroom_compress`, keep the returned hash in working notes or final evidence when relevant, and call `headroom_retrieve` before exact claims.
- Do not use Headroom MCP for small outputs, exact code under active edit, short errors already visible, or safety-critical details that must be quoted exactly.
- Prefer deterministic helpers, validators, fixtures, or generated reports over repeated manual inspection.
- Reviewer agents are read-only leaf validators by default, except feedback-ledger appends under `docs/feedbacks/**` through `complain` when permission allows it.

## Feedback Ledger

- When current-session workflow friction, instruction conflict, tooling pain, missing automation, confusing handoff, validation noise, or reusable improvement opportunity appears, use the `complain` skill and append a structured entry to `docs/feedbacks/<agent-or-skill-name>.md`.
- Do not wait for proof that it repeats. If recurrence is unknown, write `Recurrence: unknown`.
- OpenCode permissions enforce the feedback path boundary; `complain` is the required model contract for entry shape and privacy checks.
- Keep entries privacy-safe and focused on workflow/tooling/instructions, not personal blame. If writing is blocked, return a `Feedback Candidate`.
