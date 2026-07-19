# Repository Maintainer Instructions

This file (`REPO_AGENTS.md`) holds contributor-facing maintenance rules for the `opencode-dev-kit` library. It is not the runtime instruction file; OpenCode loads the runtime instructions from `global/AGENTS.md` once `OPENCODE_CONFIG_DIR` points at `global/`. The two files serve different audiences and live under different filenames by design.

This repository stores reusable OpenCode skills, subagents, and instruction templates.

- Keep artifacts project-neutral: do not hardcode repository names, company-internal paths, issue trackers, services, hardware, or validation commands unless the artifact is explicitly scoped to that ecosystem.
- Prefer evidence-backed workflow contracts over reminders. If a check can be automated, document the command shape or validation hook instead of adding vague prose.
- For retros, audits, reviewer gates, and follow-up backlogs, distinguish symptoms from likely root causes. Prefer fixes that remove or reduce the recurrence path; when evidence cannot identify the cause, route an investigation or instrumentation task instead of guessing.
- Ordinary Small is the default for clear, bounded, local, reversible work: understand accepted behavior, implement and observably prove the smallest complete happy path, run focused validation, then inspect only realistic requirement-linked edge cases. After happy-path proof, the main session may author the smallest focused regression test when useful.
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

- For repetitive, evidence-heavy, or token-heavy work, first consider whether a small deterministic helper could gather, count, validate, redact, diff, inventory, or enforce explicit rules more efficiently than manual inspection.
- When writing helper code for agent workflow, make it deterministic and contract-driven: explicit inputs, explicit outputs, schemas or fixtures, stable ordering, and privacy-safe output.
- Helper code must have no hidden heuristics: do not encode fuzzy scoring, probabilistic classification, model-like summarization, or unstated inference as evidence.
- If deterministic helper code cannot answer something from its inputs, report `unknown`, `unreadable`, `unsupported`, or `blocked` instead of guessing.
- Keep judgment-heavy synthesis in the agent/reviewer layer; use helper code to gather, count, validate, redact, diff, inventory, or enforce explicit rules.
- Deterministic helper output may support root-cause analysis with evidence and missing-data signals, but root-cause judgment remains in the agent/reviewer layer.

## Feedback Ledger

- When current-session workflow friction, instruction conflict, tooling pain, missing automation, confusing handoff, validation noise, or reusable improvement opportunity appears, use the `complain` skill and append a structured entry to `docs/feedbacks/<agent-or-skill-name>.md`.
- Do not wait for proof that the issue is recurring. If recurrence is unknown, write `Recurrence: unknown`; prefer a compact useful signal over suppressing feedback.
- Keep entries privacy-safe and focused on workflow/tooling/instructions, not personal blame. Do not include secrets, raw private prompts, or large logs.
- Reviewer agents may edit only `docs/feedbacks/**` for feedback entries; they remain read-only for source, config, instructions, specs, and task artifacts.
- OpenCode permissions enforce the feedback path boundary; `complain` is the required model contract for entry shape and privacy checks, not a hard semantic enforcement layer.
- Prevention entries that use `npm run instruction:feedback -- --add ...` close only after `applied -> replayed -> resolved`; if replay is `still-failing`, reopen and route the applied rule as a new finding.
- If explicit read-only/no-edit mode or permissions block writing, return a `Feedback Candidate` for the main session instead of dropping the signal.

## Token Efficiency

- Keep responses compact by default: outcome, changed files, validation, blockers, and only necessary rationale.
- Remove filler and repeated caveats from responses, but preserve exact commands, paths, errors, code, safety warnings, and user-facing decisions.
- Prefer targeted searches, symbols, and bounded file reads over broad file or log dumps.
- On native Windows, `rtk` filters work only when invoked explicitly; use `rtk <command>` for shell-heavy read-only commands instead of relying on hook auto-rewrite.
- When Headroom MCP tools are available and a log, search result, JSON payload, validation output, or repeated tool output is likely to be reused and exceeds about 300 lines or 10 KB, call `headroom_compress`, keep the returned hash in working notes or final evidence when relevant, and call `headroom_retrieve` before exact claims.
- Do not use Headroom MCP for small outputs, exact code under active edit, short errors already visible, or safety-critical details that must be quoted exactly.
- For validation output, report summaries and failures first; read full saved tool output only when the preview lacks the cause.
- Preserve exact code, commands, paths, errors, protocol terms, and safety warnings; do not compress away meaning.

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

- When a real blocker or user-owned decision remains, the main session offers 2-4 self-contained next actions via `question` when available.
- Put the recommended option first and end its label with `(Recommended)`.
- In read-only, no-question, reviewer-agent, or subagent contexts, do not ask the user directly; return evidence-only reports using `Blocking Evidence`, `Residual Risks`, or non-authorizing `Follow-up Candidates` for the main session instead.
- When an audit, retro, reviewer gate, broad discovery, or validation failure produces several concrete tasks related to the current session but outside its approved scope, prefer grouping them into OpenSpec follow-up changes when the repository already uses OpenSpec or the user approved adding it; otherwise return grouped candidates instead of leaving a loose final-message backlog. Do not create OpenSpec ceremony for isolated nits, speculative polish, or one obvious next step.
- If the user selects an actionable option, continue immediately in the current context instead of asking them to restate the task.
- If no real blocker remains, report the completed work, validation, residual risks, and either `Change-Ready: not requested` (Ordinary Small) or qualification readiness without an interactive handoff.

After changing skills or agents, review `README.md` and the relevant artifact frontmatter so the library remains discoverable.
