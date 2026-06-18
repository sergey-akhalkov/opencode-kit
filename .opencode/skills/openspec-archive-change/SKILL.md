---
name: openspec-archive-change
description: Archive a completed OpenSpec change after verifying tasks, specs, tests, validation, retro.md retrospective follow-ups, and residual risks.
license: MIT
---

# OpenSpec Archive Change

Use this skill when the user wants to finalize/archive a completed OpenSpec change.

Do not archive on task checkboxes alone. Archive only when implementation and validation evidence support the final spec state.

## Archive Gate

- All scoped tasks are completed or explicitly moved to follow-up with reason.
- `openspec/changes/<change-id>/retro.md` exists and records a passed archive gate, `No findings` with evidence reviewed, or an approved skip with reason and approver.
- Actionable `retro.md` problem rows include root cause evidence or an explicit `unknown` cause that is routed as an investigation, not a guessed remediation.
- If `retro.md` has actionable problem rows with writable in-repository targets, the repository-configured retrospective follow-up command, e.g. `npm run openspec:retro-followups -- <change-id>`, has created/updated the required follow-up OpenSpec changes and updated follow-up ids in the Markdown table and `Outputs`; cross-repository follow-ups require explicit approved write scope.
- The repository-configured retrospective gate, e.g. `npm run openspec:retro-gate -- <change-id>`, passes when available; if unavailable, perform the same checks manually and lower confidence.
- Stable specs reflect the accepted behavior.
- Proposal/design/tasks do not contain unresolved blockers hidden as done.
- Tests, benchmarks, manual gates, or reviewer evidence cover acceptance criteria.
- Behavior-changing implementation has test-first/TDD evidence or an explicit exception; do not infer chronology when evidence is unavailable.
- Docs and README do not contradict the archived behavior.
- Validation passes or failures are explicitly triaged.
- Missing or incomplete retrospective evidence blocks archive; do not archive on an unapproved skip.

## Workflow

- Run `openspec-consistency-review` first for material changes.
- Run or manually apply retrospective follow-up generation before the archive gate using the repository-configured command when available; otherwise create/update only in-scope follow-up OpenSpec changes by hand from actionable `retro.md` `Problems Found` rows and return out-of-scope follow-ups as `Actionable Continuation Items`.
- Run or manually apply the retrospective gate before archive: check `tasks.md` ends with `Retrospective Before Archive`, `retro.md` exists, actionable findings include root causes and reference existing follow-up changes, and any approved skip names the approver.
- Execute the repository's OpenSpec validation command if available.
- Archive using the repository's standard OpenSpec CLI/process.
- Re-run validation after archive.
- Update docs only when the archived change affects public behavior or navigation.

## Output

Return archived change id, changed files, validation results, evidence summary, follow-up items, and residual risks.
