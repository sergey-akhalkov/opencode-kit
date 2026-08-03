# Repository Maintainer Instructions

This file (`REPO_AGENTS.md`) holds contributor-facing maintenance rules for the `opencode-dev-kit` library. It is not the runtime instruction file; OpenCode loads the runtime instructions from `global/AGENTS.md` once `OPENCODE_CONFIG_DIR` points at `global/`. The two files serve different audiences and live under different filenames by design.

This repository stores reusable OpenCode skills, subagents, and instruction templates.

- Keep artifacts project-neutral: do not hardcode repository names, company-internal paths, issue trackers, services, hardware, or validation commands unless the artifact is explicitly scoped to that ecosystem.
- Prefer evidence-backed workflow contracts over reminders. If a check can be automated, document the command shape or validation hook instead of adding vague prose.
- For retros, audits, reviewer gates, and follow-up backlogs, distinguish symptoms from likely root causes. Prefer fixes that remove or reduce the recurrence path; when evidence cannot identify the cause, route an investigation or instrumentation task instead of guessing.
- Ordinary Small default: main implements and proves the smallest complete happy path, reaching `MVP`; after accepted scope and focused validation, no known critical/non-deferrable defect permits RC and local handoff permits stable.
- Material/explicit stable loads `change-ready-sdlc`; after MVP and accepted-scope completion it uses fresh critical-only SDET and complete validation before RC.
- Optimize tests for realistic critical production incidents rather than coverage percentages. Prioritize real-boundary scenarios and record justified mock confidence gaps.
- Keep human-written source locally understandable. Line count is a navigation signal, not a quota; a change that adds a responsibility to an already mixed file must extract one cohesive owner or record `split-or-justify`, without broad unrelated refactoring or wrapper-only fragmentation.
- Design useful diagnostics with behavior changes. Preserve the original exception cause/stack at the owning boundary, prefer structured safe context and correlation over noisy logs, and make real-boundary proof retain exit status, stdout/stderr, relevant logs, and artifact paths.
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

- Compact by default: outcome, changed files, validation, blockers, necessary rationale. Prefer targeted search/reads and OpenCode's bounded tool output. On native Windows use `rtk <command>` explicitly. Preserve exact commands, paths, errors, and safety warnings.

## Autonomous Work Contract

- Main owns skill selection, decomposition, validation, reviewer gates, MR/PR-ready handoff, and final synthesis.
- Ask the user only for exact user-owned blockers: credentials/elevation; destructive/irreversible/remote authorization; owner/product/security/legal decisions; protected-boundary semantic expansion; missing external capability; material residual-risk acceptance; MR/PR outcomes. Never ask solely to approve an internal revision, correction exhaustion, or process continuation. Every owner question must satisfy the Completion Handoff contract below.
- Preserve the active global quality/safety -> autonomy -> speed order without copying it. Continue on local evidence or a safe reversible default; no routine questions.
- Subagents/reviewers never ask the user. User-owned scope is accepted outcome and protected-boundary decisions; necessary local reversible dependency closure is autonomous. Reviewer/SDET/delivery evidence must never authorize mutation.
- Optional final-candidate, delivery, code-quality, and domain reviewers may run after MVP only for concrete risk, project policy, or owner request. Each returns a risk matrix tied to the inspected-RC for main disposition; absence or unusable output is not itself a stage blocker.
- Fresh Material SDET returns exactly `critical-risks-reported | no-critical-risk | blocked`; continue only after an immediately-prior main-confirmed critical defect, production fix, and new proof, and permanently stop otherwise. Non-critical findings are parked.

## Delegation ROI

- Main is the default production author for Ordinary Small and Material. Optional `implementation-worker` remains the production-only adapter for evidenced isolated delegated slices with exact non-overlapping write scope, representative proof boundary, clear Acceptance Criteria, evidenced benefit, and a focused validation gate.
- When delegating to `implementation-worker`, pass a Universal Task Briefing Contract production brief (proportional for Ordinary Small; complete for Material/cold handoff) with exact read/write scope, forbidden actions, Acceptance Criteria, and Verification.
- After MVP on Material behavior work, complete accepted scope and use fresh critical-only `sdet-quality-engineer`; optional reviewers never become mandatory gates. Never assign Material test authorship to a production author.
- If `implementation-worker` is unavailable, main retains production authorship or uses another conforming author; block only when no conforming path exists. Keep writers serial when scope is unclear, write targets overlap, or integration outweighs fan-out.
- Direct main-session work remains allowed for Ordinary Small and Material production, research, questions, ordinary review-only work, proven-inert content, and focused post-proof regression tests.
- The main session owns decomposition, worker prompts, integration, validation, reviewer gates, and final synthesis; workers return reports and never ask the user directly.

## Completion Handoff

- Follow the active global Decision-ready handoff contract. Before a real owner blocker, provide one self-contained decision packet with goal/state, evidence/unknowns, attempts, authority need, options/consequences, risks/cost, recommendation, exact reply, preserved state, and next action; assume the user decides without opening earlier chat, code, documents, logs, or links.
- Links, paths, symbols, logs, candidate/blocker IDs, and lifecycle terms are optional supporting evidence only. Before `question`, mentally remove all references and verify the packet still stands alone; put `(Recommended)` first and continue after selection.
- Read-only/no-question/reviewer/subagent contexts return their risk matrix/report, evidence gaps, and `Residual Risks`; completed work reports validation, limitations, `Development-Stage`, and `Stable Candidate: RC<n>` when stable.

After changing skills or agents, review `README.md` and the relevant artifact frontmatter so the library remains discoverable.
