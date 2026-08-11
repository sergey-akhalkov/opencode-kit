# Hidden Compaction Runtime Proof

## Candidate Correction

- Updated only the `Improvement Matrix` tail of `agent.compaction.prompt` in `global/opencode.json.template` and active `global/opencode.json`.
- Preserved each prompt's existing model, variant, stagnation, strategy-history, Live-Attempt Gate, privacy, and surrounding config bytes.
- Removed the single-highest-ROI disposition.
- Added all-candidate `Pending Improvement Tasks`, standard evidence fields, target/`Owner Blocker`, next-session `Session-Derived Improvements` persistence, one safety-ordering `Next-Session Action`, and pre-archive completion.

## Static Correction Proof

- `npm run test:focused:contracts`: exit `0`, `OK: contracts tests=65`; the SDET critical oracle is green.
- `npm run validate:strict`: exit `0`, `OK: skills=26 agents=18 markdown=287 warnings=0 infos=2`.
- `openspec validate persist-session-improvements-in-tasks --strict`: exit `0`.
- `git diff --check`: exit `0`.
- Structured prompt inspection: template and active config both contain `Pending Improvement Tasks`, `Session-Derived Improvements`, `Owner Blocker`, `Next-Session Action`, and `Live-Attempt Gate`; neither retains `select only one highest-ROI`.

## Real Entry-Point Proof

- Entry point: installed `opencode run --agent compaction`.
- Effective route observed by the CLI: `compaction · grok-4.5`.
- Input: one synthetic active change with two admitted Working Repository candidates, full evidence fields, `Live-Attempt Gate: clear`, no blockers, and no mutation authorization.
- Exit: `0`.
- Effects: one configured-provider call; no tools, repository mutation, remote action, credentials, or external state.

Observed output:

- `Pending Improvement Tasks` contains separate A and B records.
- Each record contains `Trigger/Evidence`, `Why`, `Prerequisites`, `Scope/Non-Goals`, `Implementation`, `Observable Proof`, `Validation`, and `Owner Blocker: none`.
- The next session is required to persist both under `## Session-Derived Improvements` before substantial work.
- Both remain mandatory before normal complete archive; neither may remain summary-only.
- One `Next-Session Action` preserves execution order, and `Live-Attempt Gate: clear` remains explicit.

This closes confirmed defect `CR-PSI-01` and restores current `MVP` on the corrected compaction lane. The earlier build-agent all-candidate lane remains current because only the dedicated compaction prompt changed.
