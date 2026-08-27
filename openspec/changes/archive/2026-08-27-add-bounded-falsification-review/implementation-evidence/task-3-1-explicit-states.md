# Task 3.1 Explicit-State Evidence

- Candidate source identity: governed loaded-instruction digest `d6d7dcfba687a51f38b5df249de4a32e1be1ba11379cd6f7c9629d17ec8cb80f`; task 3.1 changed only the provider-free structural parser, focused tests, this evidence record, and task status.
- Production behavior: `global/bin/openspec-change/bounded-falsification.ts` now rejects explicit impossible transitions for confirmed findings, corrections, invalidated surfaces, a second generic challenge, zero-challenge work state, and unresolved terminal state. It still returns semantic readiness `unknown` and does not classify materiality or task fit.
- Existing owners retained: `implementation-readiness-reviewer` owns the six material-row admission facts; OpenSpec propose/apply own durable episode creation and reuse; the always-loaded main route owns the non-OpenSpec Material inline frame. No third runner, reviewer, router, ledger, or semantic classifier was added.
- Regression coverage: no-material-finding closure; falsified, unreachable, optional, and polish rows without work; first-correction invalidation; one corrected-candidate re-review; unchanged record reuse; reviewer-unavailable `unknown`; challenge ceiling; stale candidate correlation; and exact cause-preserving impossible-transition errors.

## Validation

- `npm run test:focused:openspec-gate` -> exit 0, `OK: OpenSpec operation gate tests=23`.
- `npm run test:focused:contracts` -> exit 0, `OK: contracts tests=71`.
- `npm run test:focused:validation` -> exit 0, `OK: library validation script tests=3`.
- `npm run test:focused:consumer-outcome` -> exit 0, `OK: consumer outcome tests=32`.
- `openspec validate add-bounded-falsification-review --strict` -> exit 0, change valid.
- `node global/bin/openspec-operation-gate.ts --root D:\home\sergey-akhalkov\opencode-kit --operation apply --change add-bounded-falsification-review` -> exit 0 with the expected warning that the change's own `falsification-review.md` is absent and semantic readiness remains `unknown`.
- `node tools/proofs/consumer-outcome-regression.ts --mode preflight --pack bounded-falsification --source-ref working-tree` -> exit 0, `status: ready`, scenario digest `98a171c2db43a23fc769ae10621325a6c826bb5b5b7815265dc19c06a12bef36`, twelve scenario members, and `modelCalls: 0`.

## Diagnostics

- An obsolete provider-free command form using `--mode candidate --phase preflight` was rejected before execution with `Unknown mode`; the exact non-zero status was not exposed by the shell adapter. `--help` showed the maintained effect-free form, and the corrected preflight above passed without a session, process, network, or provider call.
- Temporary operation-gate fixtures were deleted by their test harness. Preserved task 2.4 raw bundles were not modified or reused.
