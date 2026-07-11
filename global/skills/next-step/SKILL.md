---
name: next-step
description: Discover OpenSpec-backed available work and choose the next bounded Universal Development Loop slice.
license: MIT
---

# Next Step Planner

Use this skill when the user asks what to do next, how to continue a change, or how to choose the next reviewable slice in a spec/doc-first workflow.

This skill is an entrypoint, not an implementation skill. It inventories OpenSpec-backed work and chooses the next bounded Universal Development Loop slice.

For a new broad task that is not yet tied to existing OpenSpec work, do not infer an implementation backlog from source alone. If the current session already produced OpenSpec follow-up changes from an audit, retro, reviewer gate, or validation failure, include those changes in the inventory.

## Routing

- If the repository has OpenSpec artifacts or the user mentions OpenSpec/spec-first/spec changes, inspect all active OpenSpec work before recommending a next step.
- If there is no OpenSpec evidence, or only one concrete next action is available, stay serial and use the single-step output contract below.
- If two or more independent OpenSpec-backed workstreams are visible, summarize the options and recommend the first safe serial slice unless the user explicitly asked to run multiple tracks.
- Do not infer a backlog from source code alone. Source, tests, diffs, and validation output are evidence only when connected to OpenSpec changes, specs, tasks, or acceptance criteria.
- Treat backlog-style OpenSpec follow-up changes as valid workstreams only when they have session evidence, a coherent outcome, and bounded tasks; loose final-response bullets should be grouped into concrete continuation candidates before any work starts.

## Workflow

- Inspect the current repository state, OpenSpec change directories, specs, tasks, proposal/design files, archive candidates, recent diffs, and validation evidence if available.
- Prefer the repository's OpenSpec commands when available, such as `openspec list`, `openspec list --specs`, and `openspec validate --all`; otherwise inspect the OpenSpec files directly.
- Inventory all available OpenSpec-backed work, including incomplete implementation tasks, missing tests, spec/doc synchronization, consistency reviews, validation failures, proposal/exploration gaps, and archive-ready completed changes.
- Surface archive-ready OpenSpec changes when implementation tasks are done but spec sync, validation evidence, reviewer evidence, or archive movement is missing.
- Include lightweight follow-up changes whose primary artifact is `tasks.md`, especially changes created from audits, retros, reviewer gates, or validation failure triage.
- Group items into independent workstreams, not low-level task lists. Each workstream should have a clear outcome, bounded scope, readiness state, and likely validation evidence.
- Keep the user-facing discovery summary high-level. Do not include detailed file-by-file plans, worker prompts, implementation steps, or test matrices until parallel coordination is approved.
- Prefer steps that reduce uncertainty, unblock implementation, or produce a reviewable slice.
- Avoid speculative polish and unrelated cleanup.

## Multi-Workstream Decision Gate

When two or more independent OpenSpec-backed workstreams are available:

- Show `Available OpenSpec Workstreams` with concise, high-level descriptions only.
- Recommend one serial next step by default, or a clearly bounded subset if the user explicitly requested parallel execution.
- Ask the user for approval before launching parallel work when scope, risk, destructive/remote actions, dirty-state preservation, or acceptance policy is user-owned. Use `question` when available.
- If the user forbids questions and approval is genuinely required, return `Suggested Next Options` and do not launch parallel work until the user explicitly approves.
- Offer 2-4 self-contained options. Put the recommended option first and end its label with `(Recommended)`.
- Include a stop/serial option when parallel work may be too broad, risky, or not what the user wants.
- Limit one parallel batch to 2-6 approved workstreams. If more than 6 workstreams are available, show all of them at a high level, recommend the first prioritized batch of at most 6, and require separate approval for later batches.
- Treat approval, when required, as permission to coordinate only the approved streams and approved mode. If later detailed planning exposes overlapping write scopes, unstable acceptance criteria, missing dependencies, or unsafe ambiguity, pause that stream and report the blocker instead of widening scope silently.

Example approval options:

- `Start recommended step (Recommended)`: execute the single highest-priority serial slice.
- `Run selected streams`: ask the user to name the workstreams, then coordinate only those.
- `Plan first only`: run read-only detailed planning workers and stop before implementation.
- `Stay discovery-only`: return the inventory without starting work.

## Worker Handoff

After approval when required, or after the safe autonomous decision gate passes:

- Keep this skill's OpenSpec inventory as the master intake evidence.
- Carry the approved mode into the handoff. If the user chose plan-first only, run read-only planning workers, synthesize their reports, and stop before implementation until the user explicitly approves execution.
- Start with parallel detailed planning workers, one per approved workstream, unless two streams are too coupled to plan independently.
- Each planning worker should load/use `deep-task-planning` before doing planning work. If the worker cannot load that skill because the tool is unavailable, the worker uses the planning contract from the prompt, reports `Planning Skill: deep-task-planning unavailable; fallback contract used`, and lowers confidence instead of blocking solely on the missing skill.
- Each planning worker receives one high-level workstream, exact OpenSpec artifacts to inspect, write scope `none`, expected planning evidence, relevant OpenSpec skill rules, and an explicit instruction to report `Planning Skill: deep-task-planning loaded` in its final report.
- Synthesize planning reports into bounded implementation/review/test workers with non-overlapping write scopes and focused validation.
- Assign each implementation worker an explicit `production` or `testing` role. Production workers implement and prove the happy path without editing test artifacts; testing workers start in fresh sessions, use test-only write scopes, and independently cover realistic negative/end-to-end risks.
- Continue through execution, integration, focused validation, final validation, relevant read-only reviewer gates including `code-quality-reviewer` for non-trivial code changes, cleanup, and final user-facing status.
- The master session owns task tracking, integration decisions, validation, reviewer gates, residual risks, and final synthesis.
- Workers must not ask the user questions, launch nested parallel coordination, commit, push, merge, delete worktrees, or edit outside assigned scope.

## Single-Step Output

Use this when parallel coordination is not appropriate or the user chooses serial mode.

Return:

- `Recommended Next Step`: one action with why it is best now.
- `Scope`: files, specs, tests, or commands likely involved.
- `Success Criteria`: observable completion signal.
- `Validation`: commands or reviewer gates to run.
- `Alternatives`: 1-3 lower-priority options with trade-offs.
- `Do Not Start Yet`: adjacent work that should remain out of scope.

## Discovery Output

Use this before parallel coordination approval.

Return:

- `Available OpenSpec Workstreams`: high-level workstreams, each with status and outcome.
- `Recommended Coordination`: whether to run one serial slice, run a subset, stay discovery-only, or block.
- `Approval Needed`: the exact approval request and options.
- `Not Starting Yet`: details intentionally withheld until approval, such as worker prompts, file-level plans, and implementation steps.

## Approved Worker Output

Use this after the user approves parallel worker planning and work begins.

Return progress and final status, plus:

- `Approved Workstreams`: names from the user's approval.
- `Planning Evidence`: worker reports or blockers.
- `Execution Status`: completed, in progress, blocked, or intentionally deferred per workstream.
