# Repository Maintainer Instructions

This file (`REPO_AGENTS.md`) holds contributor-facing maintenance rules for the `opencode-dev-kit` library. It is not a runtime instruction file; OpenCode loads the working philosophy from `global/principles-of-work.md` and operational instructions from `global/AGENTS.md` once `OPENCODE_CONFIG_DIR` points at `global/`. The files serve different owners by design.

Apply the global working philosophy in every relevant maintenance decision: quality without proxy substitution, the shortest verified path, autonomy until a real owner boundary, maximum token economy, and evidence-backed continuous improvement. Fix, narrow, or remove concrete workflow impediments at the smallest authorized layer; never weaken safety, protected boundaries, accepted scope, or unrelated work.

This repository stores reusable OpenCode skills, subagents, and instruction templates.

- Keep artifacts project-neutral: do not hardcode repository names, company-internal paths, issue trackers, services, hardware, or validation commands unless the artifact is explicitly scoped to that ecosystem.
- Prefer evidence-backed workflow contracts over reminders. If a check can be automated, document the command shape or validation hook instead of adding vague prose.
- For retros, audits, reviewer gates, and follow-up backlogs, distinguish symptoms from likely root causes. Prefer fixes that remove or reduce the recurrence path; when evidence cannot identify the cause, route an investigation or instrumentation task instead of guessing.
- Ordinary Small default: main implements and proves the smallest complete happy path, completes accepted scope and focused validation, then reports `Outcome: working | blocked | unknown` without RC/stable ceremony.
- Material/explicit stable loads `change-ready-sdlc`; qualification stages and fresh critical-only SDET apply only for explicit/project-required qualification or a reachable named critical consequence.
- Optimize tests for realistic critical production incidents rather than coverage percentages. Prioritize real-boundary scenarios and record justified mock confidence gaps.
- Optimize roadmaps and behavior slices for time-to-first-real-signal: run the first safely reachable real boundary sufficient to observe the accepted effect, or record its blocker, unblocker, safeguards, cleanup, evidence, and stop condition. Shift-left sequencing does not authorize external operations; owner-controlled and physical-effect gates remain controlling.
- Keep human-written source locally understandable. Line count is a navigation signal, not a quota; a change that adds a responsibility to an already mixed file must extract one cohesive owner or record `split-or-justify`, without broad unrelated refactoring or wrapper-only fragmentation.
- Design useful diagnostics with behavior changes. Preserve the original exception cause/stack at the owning boundary, prefer structured safe context and correlation over noisy logs, and make real-boundary proof retain exit status, stdout/stderr, relevant logs, and artifact paths.
- Skills and agents must be safe to reuse in unrelated repositories. Use placeholders such as `<project>`, `<change>`, `<service>`, `<legacy-source>`, and `<validation-command>` where local projects differ.
- Reviewer agents are leaf validators by default: read-only except feedback-ledger appends under `docs/feedbacks/**`, no source/config/instruction edits, no commits, no pushes, no nested agents, no user questions.
- Keep each artifact cohesive. Split artifacts when triggers, permissions, or output contracts differ materially.
- Preserve OpenCode compatibility: skill folders must match `name` in `SKILL.md`; agent files must use valid frontmatter and least-privilege permissions.

## Portability Contract

- Every workflow tool shipped into project context SHALL have a project-neutral reusable core. Core inputs include an explicit project root plus explicit config or command argv; core behavior must not derive from this repository's checkout identity.
- Keep package managers, shells, repository names, maintainer paths, issue trackers, services, hardware, and validation commands in thin project adapters. Reusable cores must not hardcode npm, PowerShell, Windows-only paths, this repository name, or another project-specific command.
- A project adapter may bind a reusable core to one ecosystem, but it must remain thin, visibly scoped, and replaceable without changing the core algorithm or safety invariants.
- Before calling a new or materially changed workflow tool reusable, run it in an unrelated disposable project with different project identity and explicit adapter argv. Repository-local helper output alone is not portability proof.
- Reusable tools must preserve target-project work: explicit write envelope, preview/dry-run when applicable, original child exit/stdout/stderr, fail-closed cleanup, and no credential, remote, install, release, or destructive behavior without separate owner authority.
- Repository-maintenance-only validators may target the documented kit schema when they are not installed or described as generic project tools. Their names and docs must state that boundary; this exception does not permit project-specific assumptions in tools shipped to target projects.
- New or modified tools that violate this contract are incomplete even when this repository's own tests pass.

## TypeScript Development

- Use TypeScript for all repository automation and implementation code.
- Do not add or keep PowerShell, Python, or JavaScript source/tooling files; rewrite any such code to TypeScript instead.
- Run library tooling through `npm run validate`, `npm test`, and `npm run install:global -- ...`; do not introduce `.ps1`, `.py`, or `.js` entrypoints.
- JSON, Markdown, YAML, and other config/data files are allowed when they are not implementation code.

## Deterministic Helper Automation

- Prefer small deterministic helpers for repetitive, evidence-heavy work: explicit inputs, explicit outputs, schemas/fixtures, stable ordering, privacy-safe output, and no hidden heuristics, fuzzy scoring, or model-like summarization.
- If inputs cannot answer, report `unknown`/`unreadable`/`unsupported`/`blocked`. Judgment stays in the agent/reviewer layer.
- Deterministic helpers may validate strategy-history structure, but they must not infer whether a strategy is effective or semantically distinct. That judgment remains in the agent layer and must cite observed progress evidence.

## Token Efficiency

- Compact by default: outcome, changed files, validation, blockers, necessary rationale. Prefer targeted search/reads and OpenCode's bounded tool output. Preserve exact commands, paths, errors, and safety warnings.

## Autonomous Work Contract

- Main owns skill selection, decomposition, validation, reviewer gates, MR/PR-ready handoff, and final synthesis.
- Ask the user only for exact user-owned blockers: credentials/elevation; destructive/irreversible/remote authorization; owner/product/security/legal decisions; protected-boundary semantic expansion; missing external capability; material residual-risk acceptance; MR/PR outcomes. Plans, OpenSpec artifacts, tasks, revisions, attempt limits, and stop lines adapt autonomously when accepted semantics remain unchanged. Never ask solely to approve an internal revision. Never ask solely to approve those controls, a successor attempt, correction exhaustion, or process continuation; separately gate the underlying protected action. Every owner question must satisfy the Completion Handoff contract below.
- Preserve the active global working philosophy without copying it. Continue on local evidence or a safe reversible default, minimize token and process cost, and correct concrete impediments within authority; no routine questions and no weaker quality or safety.
- Subagents/reviewers never ask the user. User-owned scope is accepted outcome and protected-boundary decisions; necessary local reversible dependency closure is autonomous. Reviewer/SDET/delivery evidence must never authorize mutation.
- Optional final-candidate, delivery, code-quality, and domain reviewers may run after current proof only for concrete risk, project policy, or owner request. Each returns a risk matrix tied to the inspected candidate/RC when one exists; absence or unusable output is not itself a stage blocker.
- Triggered fresh SDET returns exactly `critical-risks-reported | no-critical-risk | blocked`; main independently dispositions every row. Non-critical findings are parked.

## Delegation ROI

- Main is the default production author for Ordinary Small and Material. Optional `implementation-worker` remains the production-only adapter for evidenced isolated delegated slices with exact non-overlapping write scope, representative proof boundary, clear Acceptance Criteria, evidenced benefit, and a focused validation gate.
- When delegating to `implementation-worker`, pass a Universal Task Briefing Contract production brief (proportional for Ordinary Small; complete for Material/cold handoff) with exact read/write scope, forbidden actions, Acceptance Criteria, and Verification.
- After current proof, main may add the smallest focused regression; use fresh critical-only `sdet-quality-engineer` only for a reachable named critical consequence or explicit project/owner requirement. Optional reviewers never become mandatory gates.
- If `implementation-worker` is unavailable, main retains production authorship or uses another conforming author; block only when no conforming path exists. Keep writers serial when scope is unclear, write targets overlap, or integration outweighs fan-out.
- Direct main-session work remains allowed for Ordinary Small and Material production, research, questions, ordinary review-only work, proven-inert content, and focused post-proof regression tests.
- The main session owns decomposition, worker prompts, integration, validation, reviewer gates, and final synthesis; workers return reports and never ask the user directly.

## Completion Handoff

- Follow the active global Decision-ready handoff contract. Before a real owner blocker, provide one self-contained decision packet with goal/state, evidence/unknowns, attempts, authority need, options/consequences, risks/cost, recommendation, exact reply, preserved state, and next action; assume the user decides without opening earlier chat, code, documents, logs, or links.
- Links, paths, symbols, logs, candidate/blocker IDs, and lifecycle terms are optional supporting evidence only. Before `question`, mentally remove all references and verify the packet still stands alone; put `(Recommended)` first and continue after selection.
- Read-only/no-question/reviewer/subagent contexts return their risk matrix/report, evidence gaps, and `Residual Risks`; completed work reports validation, limitations, ordinary `Outcome`, or qualification-only `Development-Stage` and `Stable Candidate: RC<n>`.

After changing skills or agents, review `README.md` and the relevant artifact frontmatter so the library remains discoverable.
