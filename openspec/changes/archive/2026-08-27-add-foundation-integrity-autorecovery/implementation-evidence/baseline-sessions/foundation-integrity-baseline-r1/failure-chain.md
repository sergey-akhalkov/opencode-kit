# Foundation Baseline Attempt 1 Failure Chain

Candidate: `foundation-integrity-baseline-r1`

Lane: unchanged-instruction configured baseline

## Observed Facts

- The bounded invocation made seven primary configured-provider calls, one for each reviewed scenario.
- Every OpenCode command exited `0` and wrote `decision.json` inside its disposable fixture.
- Recorded tool traces contain only fixture reads and one `apply_patch` for `decision.json`; no `task` or `skill` call occurred and no named state/archive/unrelated artifact was mutated.
- Every sample reports terminal cleanup with fixture, process, and session removal complete.
- Every post-session checker exited `1`; terminal evaluation status is `failed` with digest `52becb89da872aa3265e8ad09b2f2c30caf2e425fa96370a67370bce7351e829`.

## Classification

Affected layer: Proof Runner fixture prompt/checker contract.

The request named output fields but did not enumerate fallback values. The seven unavailable-baseline decisions therefore used combinations of `ownerAgent: "unavailable" | null`, `reproductionDisposition: "unknown"`, candidate-shaped incident IDs, and two alternate terminal-row keys. The checker required `ownerAgent: "none"`, `reproductionDisposition: "not-run"`, baseline incident `"none"`, and terminal rows with exactly `memberId` plus `status`. This is not evidence that loaded candidate behavior failed; the candidate owner and recovery skill do not exist yet.

## Preserved Raw Bundles

- `bundle.json`: immutable seven-sample raw capture, comparison identity `6a43f7c8c85ca49c921a118ada128a605d0c4523bc8c5d05755f40d769d73c25`, capture evaluator `ca4e149a7140617aa0298e59da73e50b625352c69b4d9772886ef4507819ecac`.
- `evaluation.json`: capture-time terminal evaluator output.
- `terminal-replay-attempt-1.json`: provider-free replay of the complete preserved bundle through the unchanged evaluator; `liveCalls: 0`, same failed terminal digest and complete seven-scenario/12-member failure rows.

## Unlock Condition

Do not repeat the unchanged invocation. A causally distinct evidence recapture is eligible only after the fixture makes the unavailable fallback object and allowed field values explicit, the focused checker/evaluator suite is green, and the preserved attempt remains terminally replayed. The successor is bounded evidence capture for the exact previously missing valid checker observations; it is not reuse of attempt 1 or proof that candidate recovery behavior works.

Live-Attempt Gate: `blocked` for unchanged foundation baseline attempt 1; the exact prompt-schema correction plus green offline validation unlocks only a new evidence-capture successor.
