# Repository Maintainer Instructions

This file (`REPO_AGENTS.md`) holds contributor-facing maintenance rules for the `opencode-dev-kit` library. It is not the runtime instruction file; OpenCode loads the runtime instructions from `global/AGENTS.md` once `OPENCODE_CONFIG_DIR` points at `global/`. The two files serve different audiences and live under different filenames by design.

This repository stores reusable OpenCode skills, subagents, and instruction templates.

- Keep artifacts project-neutral: do not hardcode repository names, company-internal paths, issue trackers, services, hardware, or validation commands unless the artifact is explicitly scoped to that ecosystem.
- Prefer evidence-backed workflow contracts over reminders. If a check can be automated, document the command shape or validation hook instead of adding vague prose.
- For retros, audits, reviewer gates, and follow-up backlogs, distinguish symptoms from likely root causes. Prefer fixes that remove or reduce the recurrence path; when evidence cannot identify the cause, route an investigation or instrumentation task instead of guessing.
- Ordinary Small is the default for clear, bounded, local, reversible work: understand accepted behavior inside a technically enforced operating envelope, implement and observably prove the smallest complete happy path, run focused validation, then inspect only realistic requirement-linked edge cases. After happy-path proof, the main session may author the smallest focused regression test when useful. Handoff may include `Pilot-Ready: yes | no | not requested` (not a third profile).
- Material/explicit Change-Ready work loads `change-ready-sdlc` and uses independent fresh-context SDET for systematic risk testing and automated-test authorship after applicable proof.
- Optimize tests for realistic production failure discovery rather than coverage percentages. Prioritize real-boundary end-to-end scenarios, record justified mock exceptions, and continue until identified high-impact risks are covered or an exact blocker and residual risk are documented.
- Skills and agents must be safe to reuse in unrelated repositories. Use placeholders such as `<project>`, `<change>`, `<service>`, `<legacy-source>`, and `<validation-command>` where local projects differ.
- Reviewer agents are leaf validators by default: read-only except feedback-ledger appends under `docs/feedbacks/**`, no source/config/instruction edits, no commits, no pushes, no nested agents, no user questions.
- Keep each artifact cohesive. Split artifacts when triggers, permissions, or output contracts differ materially.
- Preserve OpenCode compatibility: skill folders must match `name` in `SKILL.md`; agent files must use valid frontmatter and least-privilege permissions.

## TypeScript Development

- Use TypeScript for all repository automation and implementation code.
- Do not add or keep PowerShell, Python, or JavaScript source/tooling files; rewrite any such code to TypeScript instead.
- Run library tooling through `npm run validate`, `npm test`, and `npm run install:global -- ...`; do not introduce `.ps1`, `.py`, or `.js` entrypoints.
- JSON, Markdown, YAML, and other config/data files are allowed when they are not implementation code.

## Deterministic Helper Automation

- Prefer small deterministic helpers for repetitive, evidence-heavy work: explicit inputs, explicit outputs, schemas/fixtures, stable ordering, privacy-safe output, and no hidden heuristics, fuzzy scoring, or model-like summarization.
- If inputs cannot answer, report `unknown`/`unreadable`/`unsupported`/`blocked`. Judgment stays in the agent/reviewer layer.

## Feedback Ledger

- On current-session workflow friction, use `complain` and append to `docs/feedbacks/<agent-or-skill-name>.md`. `Recurrence: unknown` is fine. Privacy-safe only. Reviewers write only under `docs/feedbacks/**`. Prevention via `npm run instruction:feedback -- --add ...` closes only after `applied -> replayed -> resolved`. If write is blocked, return a `Feedback Candidate`.

## Token Efficiency

- Compact by default: outcome, changed files, validation, blockers, necessary rationale. Prefer targeted search/reads. On native Windows use `rtk <command>` explicitly. Headroom MCP: compress large reusable tool output (>~300 lines/10 KB); do not compress exact edit targets or short errors. Preserve exact commands, paths, errors, and safety warnings.

## Autonomous Work Contract

- The main session owns skill selection, decomposition, validation, reviewer gates, MR/PR-ready handoff, and final synthesis.
- Ask the user only for real blockers: scope or risk decisions, credentials/provider access, missing owner/product/security/legal decisions, destructive operations, remote-state actions, unrequested scope expansion, and MR/PR review outcomes.
- Continue autonomously when local evidence, repository policy, or a safe reversible default is enough; do not ask routine preference or progress questions.
- Subagents and read-only reviewer gates never ask the user directly; they return evidence-only reports using `Blocking Evidence`, `Residual Risks`, and non-authorizing `Follow-up Candidates` for the main session. `Follow-up Candidates` never authorize current-candidate work. After freeze, post-freeze scope may only shrink; only explicit user approval may expand via a new revision or separate change. Findings may bind readiness but never authorize scope expansion. Qualification allows one correction wave only for a candidate-attributable frozen acceptance criterion violation fully inside frozen paths; otherwise stop.
- For Material work, always run the discovered conforming delivery/readiness gate (this kit's optional default is `session-delivery-reviewer`) with current requirements, candidate continuity, proof, SDET, validation, review, residual-risk evidence, and bundle: goal/constraints, transcript/summary plus compaction state, files/diffstat, validation, reviewer fixes, risks; missing conforming capability blocks. Material `Change-Ready: yes` requires an explicitly accepted conforming delivery result. Missing required Material evidence produces blocked/not-enough-evidence, never skip/not-applicable solely because an optional input is unavailable. Ordinary Small uses proportional evidence and invokes that gate only when project policy, risk, or the owner requires it.
- Treat session-delivery-reviewer blocking output as binding readiness rejection that never authorize scope expansion: every `Change-Ready: no`, `Verdict: material deviations`, `Verdict: not enough evidence`, `Blocking for Acceptance: yes`, `Verdict: blocked`, or non-empty `Blocking Evidence` keeps readiness blocked; do not present the session as complete or ready-to-land. Negative delivery verdict or `Change-Ready: no` must not coexist with `Blocking for Acceptance: no` and empty `Blocking Evidence`. P2/note, coverage-only gaps, and optional evidence polish route to Residual Risks or non-authorizing `Follow-up Candidates` only. Delivery rejection is terminal and never authorizes mutation or gate replay. Full closed-world policy lives in `change-ready-sdlc`. Continue autonomous work when safe, or ask/escalate only the exact user-owned blocker; partial slice handoff must not end an unfinished root goal.

## Delegation ROI

- Ordinary Small production work may be implemented directly by the main session. Optional `implementation-worker` remains the production-only adapter for delegated bounded edit-mode slices with exact non-overlapping write scope, clear Acceptance Criteria, and a focused validation gate.
- When delegating to `implementation-worker`, pass a Universal Task Briefing Contract production brief (proportional for Ordinary Small; complete for Material/cold handoff) with exact read/write scope, forbidden actions, Acceptance Criteria, and Verification.
- After applicable proof on Material/explicit qualification work, dispatch a fresh discovered conforming SDET session for systematic test-only risk assessment and automated-test authorship; never assign testing ownership to a production author. In this kit, `sdet-quality-engineer` is the optional default SDET adapter only.
- If `implementation-worker` is unavailable on the qualification path, use another conforming production author or block. Keep writers serial when scope is unclear, write targets overlap, or integration outweighs fan-out.
- Direct main-session work remains allowed for Ordinary Small production, research, questions, ordinary review-only work, proven-inert content, and focused post-proof regression tests.
- The main session owns decomposition, worker prompts, integration, validation, reviewer gates, and final synthesis; workers return reports and never ask the user directly.

## Completion Handoff

- On real blockers, main offers 2-4 self-contained next actions via `question` when available; recommended option first with `(Recommended)`.
- Read-only/no-question/reviewer/subagent contexts never ask the user; return `Blocking Evidence`, `Residual Risks`, or non-authorizing `Follow-up Candidates`.
- Several out-of-scope session tasks → group into OpenSpec follow-ups when available/approved; no ceremony for nits or one obvious next step.
- If the user selects an option, continue immediately.
- If no blocker remains, report completed work, validation, residual risks, `Pilot-Ready: yes | no | not requested` when relevant, and either `Change-Ready: not requested` (Ordinary Small) or qualification readiness.

After changing skills or agents, review `README.md` and the relevant artifact frontmatter so the library remains discoverable.
