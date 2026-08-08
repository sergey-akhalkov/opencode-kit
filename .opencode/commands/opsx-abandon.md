---
description: Preserve an intentionally incomplete OpenSpec change without claiming completion
---

Preserve an intentionally incomplete OpenSpec change as abandoned.

**Input**: `/opsx-abandon <change-name> --reason <plain-language reason>`.

1. Require an explicit change name and non-empty reason. The command invocation authorizes only the local archive move; it does not authorize deletion, spec sync, commit, push, or remote mutation.
2. Run `openspec status --change "<name>" --json` and use its `changeRoot` and `planningHome.changesDir`. Stop if the change is missing or already archived.
3. Read proposal, tasks, and existing evidence. Summarize unchecked tasks, incomplete artifacts, and known validation state without describing them as delivered.
4. Create `ABANDONED.md` inside `changeRoot` with:
   - `Status: abandoned-incomplete`
   - change name and date
   - owner-provided reason
   - incomplete artifact/task counts
   - known validation/proof state
   - statement that delta specs were not synchronized by this operation
5. Move the complete change directory to `<changesDir>/archive/<YYYY-MM-DD>-abandoned-<name>`. Fail if the destination already exists. Do not run `openspec archive`, do not synchronize delta specs, and do not delete files.
6. Report `Preserved as abandoned-incomplete`, the destination, reason, remaining task count, and `Main specs synchronized: no`.

Never emit `all complete`, `ready`, `implemented`, or an RC/stable claim for this path.
