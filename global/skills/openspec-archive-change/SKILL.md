---
name: openspec-archive-change
description: Deterministically validate, synchronize, and archive a completed OpenSpec change. Use when implementation and evidence are complete and the owner requests archive.
license: MIT
compatibility: Requires OpenSpec 1.6-compatible CLI, Node.js 24+, and the portable kit archive tool.
metadata:
  author: opencode-kit
  version: "2.0"
  generatedBy: opencode-kit
---

# Deterministic OpenSpec Archive

Archive a completed OpenSpec change through the portable deterministic archive tool.

Use this skill when implementation and evidence are complete and the user asks to archive one OpenSpec change through the canonical complete-archive path.

## Resolve Scope

- If the change name is missing and multiple active changes exist, run `openspec list --json` and ask the user to select. Never guess.
- Preserve an explicit registered `--store <id>` selector when applicable.
- Resolve the target project root and the active kit global source. The helper is `<global-source>/bin/openspec-archive.ts`.
- Resolve one trusted aggregate project-validation argv from the project adapter or repository-native validation entrypoint. Never guess npm, a shell, or a command. A genuinely non-applicable validation boundary requires a concrete reason.

## Reconcile Session-Derived Improvements

- Before invoking the archive helper, inspect the current session and continuation for `Pending Improvement Tasks` and `Deferred Improvement Candidates`.
- Persist every still-admissible current-consumer item owned by the active change as an unchecked task under `## Session-Derived Improvements`, with the canonical classification and evidence fields; then stop archive and return to apply until all such tasks are implemented and proven at their earliest safe points.
- Persist every evidence-backed no-current-consumer item as a non-checkbox `Deferred Improvement Candidate` in `history.md`, with why it was not admitted and its re-evaluation condition. A persisted deferred record is not accepted scope and does not block complete archive.
- If a required current dependency targets another repository, expands accepted outcome, or crosses a protected boundary, record the exact `Owner Blocker` and stop only that dependency chain for an authorized path. Never drop another valid record or leave it only in summary prose.
- Invoke complete archive only after this reconciliation finds no unpersisted record and every persisted admitted improvement task is checked with current evidence; deferred records need disposition, not implementation.
- If `tasks.md` contains the creation-authored final-history-retrospective task, invoke complete archive only after that task and every improvement it generated are checked with current evidence. Return incomplete work to apply; archive never runs the history analysis, creates another copy, or retrofits a pre-policy change that lacks the task.
- If checked tasks, an exhausted attempt count, or a process stop line no longer represents the unfinished accepted outcome, update/reopen the smallest coherent artifacts and return to apply without asking for owner scope expansion. Stop only when accepted semantics change or the underlying protected action needs owner authority.

## Execute One Owner

```text
node "<global-source>/bin/openspec-archive.ts" --root "<project-root>" --change "<name>" [--store "<id>"] -- <validation-executable> [validation-args...]
```

Or, only when project validation is genuinely not applicable:

```text
node "<global-source>/bin/openspec-archive.ts" --root "<project-root>" --change "<name>" [--store "<id>"] --validation-not-applicable "<reason>"
```

The helper checks machine-readable artifact status, requires a non-empty all-checked task file, runs strict and project validation, delegates spec merge and movement to `openspec archive <name> --yes --json`, and validates the archived result. `--yes` cannot waive the independent completion gate.

## Failure Contract

- Preserve raw stdout, stderr, exit status, and reported side effects.
- Never edit main specs manually, invoke agent-driven sync, deep-import OpenSpec `dist/`, pass `--skip-specs`, or move the change directory yourself.
- Official deterministic merge rejection is a fail-closed compatibility result. Update a partial `MODIFIED` delta to the complete accepted requirement only when semantics are already known; never substitute model judgment.
- If post-archive validation is red, report the archive path and red candidate; do not claim archive completion.
- Incomplete work uses the distinct abandoned-incomplete flow and never receives completion language.

## Success Contract

Success requires zero exit and final `status: archived`. Report change, archive path, spec-update status/totals, validation argv, and helper identity. Archive does not authorize commit, push, merge, release, installation, or deployment.

## Output Contract

Return the change and archive identities, operation totals, spec-update result, exact validation argv/outcomes, helper identity, remaining blocker or `none`, and external operations performed (`none` unless separately authorized).
