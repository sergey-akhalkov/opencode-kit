# Archive Command Runtime Proof

## Candidate Correction

- Mirrored the existing archive-skill `Reconcile Session-Derived Improvements` contract into `.opencode/commands/opsx-archive.md` before its helper invocation.
- Preserved portable helper argv, store resolution, aggregate validation, deterministic merge/move behavior, and external-operation restrictions.
- Did not invoke archive or mutate any active change.

## Static Proof

- `npm run test:focused:contracts`: exit `0`, `OK: contracts tests=65`; the extended SDET oracle is green across archive skill and slash command.
- `npm run validate:strict`: exit `0`, `OK: skills=26 agents=18 markdown=288 warnings=0 infos=2`.
- `openspec validate persist-session-improvements-in-tasks --strict`: exit `0`.
- `git diff --check`: exit `0`.

## Real Command-Loader Proof

- Entry point: installed `opencode run --command opsx-archive`.
- Route: `build · gpt-5.6-sol`, variant `xhigh`.
- Input: synthetic `demo-change` continuation with all on-disk tasks described as checked but admitted pending candidates A and B not yet persisted.
- Tool envelope: `edit`, `bash`, `task`, and `question` denied; prompt also prohibited tools/helper invocation.
- Exit: `0`.
- Effects: one configured-provider call; no archive helper, file mutation, remote operation, credential, or external state.

Observed output:

- Archive is forbidden despite all existing tasks being checked.
- A and B must be added as separate unchecked tasks under `## Session-Derived Improvements` with every standard field.
- Command must return to apply and implement/prove both tasks.
- It must recheck that no `Pending Improvement Tasks` remain.
- `Owner Blocker` is absent for the synthetic records, but helper invocation is explicitly not permitted now.

This closes confirmed defect `CR-PSI-02` and restores current `MVP` on the `/opsx-archive` command lane. Build-agent and hidden-compaction proof lanes remain current because this correction changed only the archive command prompt.
