# Task 1.2 Current Proof-Owner Validation

## Reviewed Fixture

- The fixture retains the reviewed maximum cardinalities and four ordinary bounded claims without combining unrelated maximum text lengths.
- The unchanged pretty request is exactly `254687` bytes, inside the observed `214535-254691` range and above the configured `200000` limit.
- Independent captures r7 and r8 are byte-identical: raw SHA-256 `b1be17257597df2dad8f8387be879a8f4ad138935e92ee4fcb03fd3d9b637f62`; evaluation SHA-256 `b8d85166eb20afb53d8c6714875ac22e30680567118b3148689e903db82c4e34`.
- The controller recorded the exact built request bytes, terminal `input-state`, zero child creates, zero model calls, and complete fixture cleanup.

## Incident And Replay

- Query-only incident capture found the exact eight terminal roots from `214535` through `254691` bytes, with no raw ids, metadata text, or database path retained.
- The database opened read-only, `PRAGMA query_only=ON` read back true, the handle closed, and zero writes/children/model calls occurred.
- Replay A and B produced identical evaluation SHA-256 `474707546438e29c269511a196f8ea52755f4a7880cc265a7867bb41f5d8bf7c`.
- No `guard-long-run-reviewed-*` or `guard-long-run-proof-*` disposable directory remained.

## Commands

```text
bun tools/proofs/session-completion-guard-long-run.ts --help
bun tools/proofs/session-completion-guard-long-run.ts --mode fixture --candidate-id completion-arbiter-budget-baseline-r2 --evidence-root <new-root>
bun tools/proofs/session-completion-guard-long-run.ts --mode incidents --candidate-id completion-arbiter-budget-baseline-r2 --database <OPENCODE_DB> --evidence-root <new-root>
bun tools/proofs/session-completion-guard-long-run.ts --mode replay --candidate-id completion-arbiter-budget-baseline-r2 --input <baseline-raw> --evidence-root <new-root-a>
bun tools/proofs/session-completion-guard-long-run.ts --mode replay --candidate-id completion-arbiter-budget-baseline-r2 --input <baseline-raw> --evidence-root <new-root-b>
```

All commands exited `0`. The earlier 736473-byte bundle remains indexed diagnostic evidence for the rejected maximum-cardinality-plus-maximum-text fixture and is not the candidate-fit oracle.
