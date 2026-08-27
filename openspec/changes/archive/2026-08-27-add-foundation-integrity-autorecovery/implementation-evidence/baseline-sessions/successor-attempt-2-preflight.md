# Foundation Baseline Successor Attempt 2 Preflight

Date: 2026-08-26

Lane: unchanged-instruction configured baseline

## Causal Change

Each reviewed case now contains one exact `fallbackDecision`, and each scenario request directs an unavailable baseline to copy it without alternate values. This changes the mechanism that failed in attempt 1: the model no longer has to infer nullable/string enum values or terminal-row field names from prose. No loaded owner/recovery behavior or expected candidate semantics changed.

New scenario digest: `3e20233bebd90640a03ff734a5d10f2e44be0694938924f439b828d276cf8129`

Governed source digest: `98c9db0db053ee2f072ee93084fcdece0d85d49138e935e465cbe6b251713468`

## Preserved Failure Chain

- Raw attempt 1: `foundation-integrity-baseline-r1/bundle.json`
- Capture-time evaluator: `foundation-integrity-baseline-r1/evaluation.json`
- Complete provider-free terminal replay: `foundation-integrity-baseline-r1/terminal-replay-attempt-1.json`
- Replay result: failed with the same terminal digest `52becb89da872aa3265e8ad09b2f2c30caf2e425fa96370a67370bce7351e829`, seven malformed checker observations, zero live calls, and complete cleanup evidence.

## Offline Validation

- `npm run proof:consumer-outcome -- --mode preflight --pack foundation-integrity --source-ref working-tree` -> ready, zero model calls, seven scenarios, twelve terminal rows.
- `npm run test:focused:consumer-outcome` -> `OK: consumer outcome tests=26`; exact fallback objects equal the reviewed baseline expectations and all fixture checker/evaluator/replay paths are green.
- `node --check tools/proofs/fixtures/consumer-outcome/foundation-integrity-v1/check-decision.ts` -> exit `0`.
- `git diff --check` -> exit `0` with existing line-ending notices only.

## Unlock And Bound

Attempt 1 identified the exact missing raw observation: a schema-valid checker result for each otherwise terminal unavailable decision. That observation can only be acquired by a new configured session after the prompt-schema correction. Attempt 2 is therefore bounded evidence capture, not unchanged repetition and not candidate recovery proof. It permits at most seven primary configured calls, one per scenario, with the same model/profile/permissions, disposable fixture containment, and terminal cleanup requirements.

Live-Attempt Gate: `clear` only for successor attempt 2 under scenario digest `3e20233bebd90640a03ff734a5d10f2e44be0694938924f439b828d276cf8129`; attempt 1 remains finalized and failed.
