---
name: next-step
description: Use when the user asks "what next?", "what should I do next?", or "что дальше?" in an OpenSpec/spec-first workflow; inventory available work and recommend the next bounded Universal Development Loop slice.
license: MIT
---

# Next Step Planner

Use this skill when the user asks "what next?", "what should I do next?", "что дальше?", how to continue a change, or how to choose the next reviewable slice in a spec/doc-first workflow.

This skill is an entrypoint, not an implementation skill. It inventories OpenSpec-backed work and chooses the next bounded Universal Development Loop slice.

For a new broad task that is not yet tied to existing OpenSpec work, do not infer an implementation backlog from source alone. If the current session already produced OpenSpec follow-up changes from an audit, retro, reviewer gate, or validation failure, include those changes in the inventory.

## Routing

- If the repository has OpenSpec artifacts or the user mentions OpenSpec/spec-first/spec changes, inspect all active OpenSpec work before recommending a next step.
- If there is no OpenSpec evidence, or only one concrete next action is available, stay serial and use the single-step output contract below.
- If two or more independent OpenSpec-backed workstreams are visible, summarize the options and recommend the first safe serial slice unless the user explicitly asked to run multiple tracks.
- Do not infer a backlog from source code alone. Source, tests, diffs, and validation output are evidence only when connected to OpenSpec changes, specs, tasks, or acceptance criteria.
- Treat backlog-style OpenSpec follow-up changes as valid workstreams only when they have session evidence, a coherent outcome, and bounded tasks; loose final-response bullets should be grouped into concrete continuation candidates before any work starts.

## Workflow

- Start with `openspec list --json`. Do not glob `openspec/changes/archive`, main specs, or the repository.
- When exactly one active change exists, run `openspec status --change <id> --json` and `openspec instructions apply --change <id> --json`. Those three OpenSpec calls are the complete default evidence budget; do not also read proposal/design/specs/tasks or run git status/diff unless a returned error makes one exact read necessary.
- When several active changes exist, use list output to recommend one serial change. Read status for only the recommended change unless the list lacks enough information to distinguish a dependency or blocker.
- When no active change exists, report that fact. Inspect archived changes or main specs only when the user explicitly asks for historical, proposal, or broad discovery work.
- Derive the next action from the first pending task whose dependencies are satisfied, current apply instruction, or archive checks when every task is complete.
- Keep the user-facing response high-level. Do not include file-by-file plans, worker prompts, implementation steps, or test matrices.
- Prefer steps that reduce uncertainty, unblock the next useful working increment inside an enforced envelope, or produce a reviewable slice.
- Avoid speculative polish, unreachable future design, and unrelated cleanup.


## Multi-Workstream Recommendation

When two or more independent OpenSpec-backed workstreams are available:

- Show `Available OpenSpec Workstreams` with concise, high-level descriptions only.
- Recommend one serial next step by default, or a clearly bounded subset if the user explicitly requested parallel execution.
- Do not launch planning, implementation, testing, review, or parallel work from this skill. The user asked for a recommendation, not execution.
- If execution would cross a protected boundary, identify the exact later owner decision without asking it during recommendation-only output.
- Offer at most two lower-priority alternatives only when live active-change evidence supports them.
- An explicit later execution request starts a separate implementation or planning workflow with fresh scope and current repository evidence.

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

