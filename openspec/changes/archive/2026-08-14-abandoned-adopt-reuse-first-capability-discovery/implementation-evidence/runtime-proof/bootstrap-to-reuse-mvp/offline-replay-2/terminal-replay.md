# Registered-Peer Stagnation Replay

## Failure Chain

1. `../registered-peer/registered-peer.bundle.json`: unsupported `--terms`; no query result.
2. `../registered-peer-retry-1/registered-peer.bundle.json`: accepted `--need`, but unset invented group environment produced dangling `--groups`; no query result.

Both sessions exited, were deleted with status `0`, removed disposable roots, and produced no project/dependency/remote mutation. Both preserved bundle roots were sanitized. The offline evaluator emitted all eight baseline rows and the present candidate row; candidate completeness is intentionally false because each task-2.2 root contains one lane.

## Distinct Mechanism

The client now treats omitted/dangling query group input as recoverable only when validated private config enables exactly one group. It resolves that one configured authority. Zero or multiple enabled groups remain fail-closed and require explicit caller selection. This is executable containment, not another prompt-only retry.

`../exact-failed-argv-replay/client-proof.json` invokes the retry's exact post-expansion shape:

`query --need jsonc-parser --groups --limit 10`

Observed facts:

- command exit `0`;
- resolved group exactly `personal`;
- one result, `text/jsonc-parse`, owner `shared/alpha`;
- committed-source `verification.status: verified`;
- unselected sentinel absent;
- complete registry validation green;
- ten-command lane and cleanup green;
- model calls `0`.

Corrected-candidate strict validation is green. `../preflight-single-group-contained/preflight.json` confirms current source hashes, exact model/profile, 12-step envelope, final permission map, credential-store availability, loader statuses, and removed cleanup without a provider call.

## Terminal Result

- Preserved failed candidates: semantic red, complete diagnostics, no missing observations.
- Exact failed argv against corrected executable boundary: green through query, source verification, privacy, validation, and cleanup.
- Stagnation response: materially different local executable mechanism completed before another provider attempt.
- Live-Attempt Gate: `clear` for one final fresh registered-peer call only.
- Unlock condition after that call: green semantic reuse/source-verification/cleanup evidence; any failure blocks further provider attempts for this task pending a new distinct mechanism and complete offline replay.
