---
name: merge-request-author
description: Create or update a reviewer-friendly merge request or pull request title, description, validation section, risk notes, and review focus for any repository/provider.
license: MIT
---

# Merge Request Author

Use this skill when the user asks to create, update, polish, or prepare a merge request or pull request.

This skill is only a PR/MR rendering adapter for projects that use that delivery model. It does not own lifecycle orchestration, readiness decisions, SDET, final review, or Change-Ready authority. Consume the generic local change-handoff package supplied by the orchestrator/canonical process when available.

For an existing MR/PR with reviewer feedback, failing checks, approvals, or review outcome handling, inspect the remote state, review comments, checks, and local diff before updating the MR/PR description.

Do not commit, push, create/update remote state, or merge unless the user explicitly requested that action and repository rules allow it. Local `Change-Ready` may render as a provider-native label such as `PR-Ready` or `MR-Ready` when the handoff package supports it; that label does not authorize remote operations.

## Workflow

- Prefer the orchestrator-supplied local handoff package (context, requirements, scope, non-goals, main changes, proof, SDET/testing evidence, validation, review results, risks, residual blockers, external-operations state) as the primary source for body sections.
- Inspect local status, diff, recent commits, base branch assumptions, and validation evidence when needed to fill gaps or verify the package against the current candidate.
- Review linked issue/task context when available, including readable attachments and comments.
- If provider access, credentials, network, attachments, or comments are unavailable, use supplied issue/MR text, the local handoff package, and local diff evidence; report the remote evidence gap. Treat issue/task comments as hypotheses until checked against diff/source/tests/validation.
- Write for a reviewer who sees the project and change for the first time.
- Avoid file-list-only summaries and latest-commit changelogs.
- Clearly separate scope, non-goals, validation, risks, and follow-up work.
- If using a provider CLI, prefer the repository's configured provider and obey local remote-operation rules.
- Do not restate or execute the full SDLC lifecycle; only render the current handoff package for PR/MR consumers.

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
- Change-Ready: <yes|no from local handoff, or unknown>
- Native label: <PR-Ready|MR-Ready|Ready To Land|none>
- External Operations: <not performed|...>
```

## Output

Return changed remote/local artifacts, validation evidence, known blockers, and exact next step. If remote operations were not performed, state that explicitly. Never claim lifecycle completion solely because an MR/PR body was rendered.
