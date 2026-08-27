# Task 2.4 Offline Facade Gate

## Scope

- **Task state:** incomplete. This record prepares the disposable configured lane but
  does not substitute for task 2.4's configured semantic observation.
- **Product Candidate:** `continuous-complexity-management-routing-r1`.
- **Proof Runner:** `consumer-outcome-complexity-facade-r1` in the existing
  `tools/proofs/consumer-outcome*` owner.
- **Evaluator:** current `tools/proofs/consumer-outcome/evaluate.ts` exact reviewed-fact
  comparison; no architecture score or semantic classifier.
- **Prepared member:** `useful-current-consumer-facade` only.
- **Configured calls made:** `0`.

## Prepared Envelope

- One configured diagnostic request maximum, only through `--mode diagnose --pack
  complexity` after a current explicit live-attempt clearance.
- Allowed effects: local read and fixture-local write.
- Forbidden effects: commit, credential read, destructive action, install, protected
  action, and remote action.
- Allowed tools: `bash` limited by the existing Node-only configured permission,
  `edit`, `read`, and `skill:complexity-management`.
- Denied tools: external directory, Glob, Grep, question, task, and web fetch.
- Evidence bound: 524288 bytes per sample; capture bound: 8388608 bytes.
- Cleanup requires fixture, process, and session removal. Any uncertainty remains
  blocking.
- Maximum claim: fixture/effect/bound/cleanup readiness under recorded identities;
  configured semantic behavior and population support remain unsupported.

## Real Offline Boundary

Initial fixture invocation:

`node test/scenario.test.ts`

- Exit: `0`
- Stdout: `OK: order scenario effects=3 failure=PaymentDeclinedError`
- Observed success effects: inventory reservation, payment charge, receipt record.
- Observed failure: exit `2`, original `PaymentDeclinedError: payment declined`, and
  the two effects reached before failure.
- Side effects: child processes only; fixture source remained unchanged.

Preflight invocation:

`node tools/proofs/consumer-outcome-regression.ts --mode preflight --pack complexity --source-ref working-tree`

- Exit: `0`
- `modelCalls=0`, `status=ready`, `configuredProviderRequestBound=1`.
- `configuredCapture.liveAttemptGate=requires-current-explicit-clearance`.
- Scenario digest: `6cbbdf4c8144fe43986ac88cba04cda54cacd00083377f02f090f021a9078232`.
- Reviewed apply-seed digests: baseline
  `e54b189cef3d478ff042fac0c09486a4eabf110141ea84001a86fbdd61d7c2de`;
  candidate
  `ccdacdeec58fe49e20b6d6d36e6c6ceea0e95b3e55ddf7127f1589c09e981abc`.

## Failure Chain And Replay

The first create-new baseline bundle is preserved at
`implementation-evidence/task-2-4-offline-baseline-r1/bundle.json`. Capture, runtime
proof, and cleanup completed, but the CLI routed the new pack through its legacy matched
branch and the derived evaluation incorrectly expected a candidate arm. The raw bundle
was not overwritten or recaptured.

After routing `complexity` with the existing separate-arm packs, provider-free terminal
replay of baseline r1 returned `baseline-established`, no reasons, and `liveCalls=0`.
The corrected current-source pair is retained at:

- `implementation-evidence/task-2-4-offline-baseline-r2/bundle.json`
- `implementation-evidence/task-2-4-offline-candidate-r2/bundle.json`
- `implementation-evidence/task-2-4-offline-candidate-r2/replay-1.json`
- `implementation-evidence/task-2-4-offline-candidate-r2/replay-2.json`

Both terminal replays returned `passed-no-regression`, two passing reviewed oracles,
`liveCalls=0`, no reasons, and the same evaluation digest
`1b698a30cc54ebe635dbeb7712d8f8ab2bd27bea221b9b3729ac6ef12b85f144`.
The before/after file hashes differ for `src/order-service.ts` and `src/run-order.ts`,
while the same validation stdout preserves the success, effects, and failure scenario.
Every r2 sample reports complete cleanup.

## Live-Attempt Gate

- **Configured facade lane:** `unknown` and therefore blocked.
- **Failure chain:** no configured/model capture exists; provider-free preparation cannot
  establish the skill's semantic decision or one population member.
- **Preserved raw bundles:** baseline r1, baseline r2, candidate r2, and two terminal r2
  replays listed above.
- **Offline replay coverage:** baseline fallback, reviewed facade materialization,
  before/after source fact diff, runtime success/effects/failure, exact map/rehearsal
  records, bounds, permissions, and cleanup.
- **Terminal replay result:** green provider-free only.
- **Unlock condition:** a later session must independently establish a current explicit
  live-attempt clearance for this exact member/effect/bound/cleanup tuple. Only then may
  it invoke one configured `diagnose` request. That invocation is bounded evidence
  capture, not proof or population closure.

## Current Explicit Clearance

- The user explicitly authorized one configured CCM diagnose after receiving the current
  goal, gate, preserved-bundle, replay, effect, cleanup, and risk summary.
- **Live-Attempt Gate:** clear for exactly one current-source `--mode diagnose --pack
  complexity` invocation at `useful-current-consumer-facade`.
- **Causal change:** the prior explicit do-not-invoke constraint was lifted for this one
  call after terminal provider-free replay and evidence materialization.
- **Preserved corpus:** baseline r1, baseline r2, candidate r2, and both r2 terminal
  replays remain immutable.
- **Offline replay terminal result:** `passed-no-regression`, no reasons, no oracle
  failures, `liveCalls=0`, matching digest, and complete cleanup.
- **Why this call can reach farther:** provider-free capture/evaluator/cleanup failures
  are closed; the configured loaded semantic response is the sole remaining unobserved
  boundary.
- This clearance does not authorize a second call, baseline/capture mode, another member,
  or a configured proof/population claim.
