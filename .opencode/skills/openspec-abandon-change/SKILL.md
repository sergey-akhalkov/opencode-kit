---
name: openspec-abandon-change
description: Preserve an intentionally incomplete OpenSpec change without claiming completion or syncing specs.
license: MIT
---

# OpenSpec Abandon Change

Use this skill only when the owner explicitly chooses to preserve an incomplete OpenSpec change instead of completing it.

## Input

Require a safe change name and a non-empty plain-language reason. The request authorizes only a local archive move. It does not authorize deletion, spec synchronization, commit, push, or remote mutation.

## Workflow

1. Run `openspec status --change "<name>" --json` and use its resolved `changeRoot` and `planningHome.changesDir`.
2. Stop if the change is missing, already archived, or the target `<changesDir>/archive/<YYYY-MM-DD>-abandoned-<name>` exists.
3. Read proposal, tasks, and existing evidence. Count incomplete artifacts and unchecked tasks without treating them as delivered.
4. Create `ABANDONED.md` inside `changeRoot` with `Status: abandoned-incomplete`, date, change name, owner reason, incomplete counts, known proof/validation state, and `Main specs synchronized: no`.
5. Move the whole change directory to the target. Do not run `openspec archive`, synchronize delta specs, or delete files.
6. Report `Preserved as abandoned-incomplete`, target, reason, remaining tasks, and unsynchronized main specs.

## Guardrails

- Never emit `all complete`, `ready`, `implemented`, or an RC/stable claim.
- Never use this path as a workaround for a failed complete-archive gate when the owner still expects delivery.
- Preserve all source artifacts and failure evidence in the moved directory.
