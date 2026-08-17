# Task 1.2 - Installed Baseline

## Primary Route

- Candidate identity: `outcome-continuation-baseline-r1`.
- Installed route: `openai/gpt-5.6-sol`, profile `quality-independent`.
- Raw bundle: `task-1-2-primary-baseline-r1`.
- Provider-free evaluation: `task-1-2-primary-baseline-evaluation-r1`.
- Result: `baselineComplete=true` for `checked-unmet`, `outcome-achieved`,
  `explicit-pause`, `unchanged-live-repetition`, and `owner-only`.
- Observed controls: achieved outcome returned `OUTCOME_COMPLETE`; explicit pause
  returned `USER_PAUSED`; true owner-only returned `OWNER_REQUIRED`; unchanged
  live repetition returned `DIAGNOSE_NO_RETRY` with its live gate blocked.
- Observed checked-but-unmet route: `CONTINUE_OUTCOME`, no user question, task
  reconciliation and configured-global helper resolution executed, and cleanup
  completed.

## Completion-Guard Route

- Installed route: root `openai/gpt-5.6-sol/xhigh`, OpenCode `1.18.18`, with
  the configured hidden completion arbiter.
- Successful raw bundle: `task-1-2-guard-baseline-r3/raw.json`.
- Provider-free evaluation:
  `task-1-2-guard-baseline-r3-replay-r1/evaluation.json`.
- Result: correlated audit status `continued`, one synthetic guard message, zero
  question calls, no human replies, no failure, and schema version `1`.
- Cleanup: the continued root was aborted after the first disposition, terminal
  non-busy liveness was confirmed, child/root session records were deleted, and
  the isolated local server was terminated.
- Replay: `modelCalls=0`, `replayComplete=true`, `livenessClosed=true`, and
  `terminalResult=captured-result-clean`.

## Failed Attempts Preserved

- `task-1-2-guard-baseline-r1` failed before model behavior because full XDG data
  isolation hid the configured credential store.
- `task-1-2-guard-baseline-r2` reached a correlated continuation but exposed a
  proof-runner defect: deletion occurred while the continued root remained active.
- Both failures have create-new provider-free replay evaluations. Their causes,
  do-not-repeat conditions, and retry gates are recorded in `history.md`.

## Boundary

This evidence freezes current installed behavior before loaded instruction,
workflow, or arbiter mutation. It performs no PMAC, controller, packet-capture,
installation, activation, remote, destructive, or target-repository action.
