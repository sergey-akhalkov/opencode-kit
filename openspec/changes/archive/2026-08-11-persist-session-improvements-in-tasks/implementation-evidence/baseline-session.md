# Baseline Fresh-Session Evidence

## Environment

- Date: 2026-08-11
- Entry point: installed `opencode run`
- OpenCode version: `1.18.16`
- Route: `openai/gpt-5.6-sol`, variant `xhigh`, agent `build`
- Tool envelope: `edit`, `bash`, `task`, and `question` denied through `OPENCODE_CONFIG_CONTENT`
- Effects: two configured-provider calls; no repository, remote, credential, or fixture mutation

## Instruction Inventory

- `global/AGENTS.md`: 61,974 chars, 324 lines, token proxy 15,494
- Complete inventory: 363,555 chars, 4,330 lines, token proxy 90,908
- This inventory includes unrelated dirty-worktree edits that were present before this change and were not reverted.

## Single-Candidate Calibration

The first fresh session exited `0` and required the one supplied improvement to be added to `tasks.md`, implemented, proven, and checked before archive. This established that the defect was not total absence of task persistence.

## Two-Candidate Baseline

The second fresh session used the preserved two-candidate prompt from task 1.1 and exited `0`.

Observed baseline disposition:

- Candidate A: add an unchecked `tasks.md` item, implement and prove it before archive.
- Candidate B: `tasks.md` update not required, implementation not mandatory, and the candidate may remain only in the continuation summary.
- Explicit rationale: loaded instructions required exactly one `Next-Session Action`; Candidate B could not preempt the gate-closing Candidate A.

This reproduces the user-reported process defect: an admitted evidence-backed candidate can remain advisory and never enter the archive-enforced execution owner.

## Candidate Oracle

The identical candidate prompt must require both Candidate A and Candidate B to be persisted as structured unchecked tasks, neither to remain only in summary, and both to be implemented and proven before normal complete archive. Safety ordering may still execute Candidate A first.
