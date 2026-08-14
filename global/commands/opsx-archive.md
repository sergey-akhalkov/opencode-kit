---
description: Deterministically validate, synchronize, and archive a completed OpenSpec change
---

Archive a completed OpenSpec change through the portable deterministic archive tool.

**Input**: Optionally specify a change name after `/opsx-archive` (for example, `/opsx-archive add-auth`). If omitted and more than one active change exists, run `openspec list --json` and ask the user to select. Never guess among multiple changes.

**Store selection**: If the user names a registered OpenSpec store or the work resolves to one, run `openspec store list --json` and retain its exact `--store <id>` selector. Otherwise use the nearest local OpenSpec root.

## Resolve Portable Inputs

1. Resolve the target project root explicitly.
2. Resolve the portable helper from the active kit global source as `<global-source>/bin/openspec-archive.ts`. If that file is unavailable, use an equivalent project-installed adapter only when its behavior is already trusted and documented; otherwise stop as blocked.
3. Resolve one existing trusted aggregate project-validation argv from project configuration such as `opencode-dev-kit/adapter.json`, `opencode-dev-kit/validation.md`, or a repository-native validation script. Do not guess a package manager or invent a shell expression. If project validation is genuinely not applicable, retain a concrete reason for `--validation-not-applicable`.

## Reconcile Session-Derived Improvements

- Before invoking the archive helper, inspect the current session and continuation for `Pending Improvement Tasks` and `Deferred Improvement Candidates`.
- Persist every still-admissible current-consumer item owned by the active change as an unchecked task under `## Session-Derived Improvements`, with the canonical classification and evidence fields; then stop archive and return to apply until all such tasks are implemented and proven at their earliest safe points.
- Persist every evidence-backed no-current-consumer item as a non-checkbox `Deferred Improvement Candidate` in `history.md`, with why it was not admitted and its re-evaluation condition. A persisted deferred record is not accepted scope and does not block complete archive.
- If a required current dependency targets another repository, expands accepted outcome, or crosses a protected boundary, record the exact `Owner Blocker` and stop only that dependency chain for an authorized path. Never drop another valid record or leave it only in summary prose.
- Invoke the deterministic archive helper only after this reconciliation finds no unpersisted record and every persisted admitted improvement task is checked with current evidence; deferred records need disposition, not implementation.
- If `tasks.md` contains the creation-authored final-history-retrospective task, invoke the helper only after that task and every improvement it generated are checked with current evidence. Return incomplete work to apply; archive never runs the history analysis, creates another copy, or retrofits a pre-policy change that lacks the task.
- If checked tasks, an exhausted attempt count, or a process stop line no longer represents the unfinished accepted outcome, update/reopen the smallest coherent artifacts and return to apply without asking for owner scope expansion. Stop only when accepted semantics change or the underlying protected action needs owner authority.

## Execute

Run exactly one portable archive invocation:

```text
node "<global-source>/bin/openspec-archive.ts" --root "<project-root>" --change "<name>" [--store "<id>"] -- <validation-executable> [validation-args...]
```

For a reasoned non-applicable validation boundary:

```text
node "<global-source>/bin/openspec-archive.ts" --root "<project-root>" --change "<name>" [--store "<id>"] --validation-not-applicable "<reason>"
```

The helper owns the complete operation:

- machine-readable OpenSpec status and all-artifact completion check;
- non-empty, all-checked task gate that cannot be waived by `--yes`;
- strict change validation and project validation before mutation;
- official `openspec archive <name> --yes --json` spec merge and archive move;
- post-archive OpenSpec and project validation;
- machine-readable archive identity and operation totals.

Stop on any non-zero result and preserve stdout, stderr, exit status, and any archive path reported. Never edit main specs manually, invoke an agent-driven sync skill, deep-import OpenSpec internals, use `--skip-specs`, or move the change directory yourself.

If the official deterministic merge rejects a partial `MODIFIED` delta, report that exact limitation and update the delta to the accepted complete requirement shape only when the intended semantics are already clear. Do not fall back to model-authored merge behavior.

## Success Output

Report the change, archived path, whether specs changed, operation totals, validation commands, and exact portable helper path. Success requires the helper's final `status: archived` output and zero exit.

## Guardrails

- Incomplete work uses the distinct abandoned-incomplete preservation flow; complete archive never confirms past a blocking gate.
- Project-specific commands belong in project adapters, not in this reusable command.
- No archive lifecycle result authorizes commit, push, merge, release, installation, or deployment.
