---
name: merge-request-author
description: Create or update a reviewer-friendly merge request or pull request title, description, validation section, risk notes, and review focus for any repository/provider.
license: MIT
---

# Merge Request Author

Use this skill when the user asks to create, update, polish, or prepare a merge request or pull request.

This skill is only a PR/MR rendering adapter. It does not own lifecycle orchestration, Development-Stage decisions, SDET, final review, or stable authority.

For an existing MR/PR with reviewer feedback, failing checks, approvals, or review outcome handling, inspect the remote state, review comments, checks, and local diff before updating the MR/PR description.

Do not commit, push, create/update remote state, or merge unless explicitly requested. Local `Development-Stage: stable` may render as `PR-Ready` or `MR-Ready`; that label does not authorize remote operations.

## Workflow

- Prefer the orchestrator-supplied local handoff package (context, requirements, scope, non-goals, main changes, proof, specialist risk/reduction matrices, critical-SDET evidence, main disposition, validation, residual risks, external-operations state).
- Inspect local status/diff/commits/validation when needed; use issue/MR text when remote access is unavailable and report the gap.
- Write for a first-time reviewer; avoid file-list-only summaries; separate scope, non-goals, validation, risks, follow-up. Do not restate or execute the full SDLC lifecycle—only render the handoff package.

## Completion Handoff

- If creating/updating remote state, merge actions, scope changes, high-risk follow-up, or MR/PR review outcomes need user ownership, offer 2-4 self-contained next options via `question` when available.
- Put the recommended option first and end its label with `(Recommended)`.
- Reserve user decisions for creating/updating remote state, merge actions, scope changes, high-risk follow-up, and MR/PR review outcomes.
- In read-only or no-question mode, return `Suggested Next Options` instead of asking directly.
- If no user-owned decision remains, finish with local artifacts, validation evidence, blockers, and exact next step without interactive handoff.

## MR/PR Body Template

```markdown
## Context
<Plain-language problem and why this change exists.>

## Scope
<What this MR/PR changes.>

## Non-goals
<Important adjacent work intentionally excluded.>

## Main Changes
- <Behavior, architecture, tests, docs, or tooling change.>

## Validation
- `<command>`: <result>
- <manual/reviewer gate>: <result or skipped reason>

## Risks And Follow-up
- <Residual risk, blocker, or follow-up task.>

## Review Focus
- <Files/flows/decisions that deserve reviewer attention.>

## Readiness
- Development-Stage: <development|MVP|RC<n>|stable from local handoff, or unknown>
- Stable Candidate: <RC<n> when stable, or none>
- Native label: <PR-Ready|MR-Ready|Ready To Land|none>
- External Operations: <not performed|...>
```

## Output

Return changed remote/local artifacts, validation evidence, known blockers, and exact next step. If remote operations were not performed, state that explicitly. Never claim lifecycle completion solely because an MR/PR body was rendered.
