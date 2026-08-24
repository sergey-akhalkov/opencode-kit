# Strategy History

## 2026-08-21 - Select generated profile roots over source relocation

- **Objective:** Reduce default loader visibility without deleting optional capabilities or breaking the current full-catalog source.
- **Approach:** Consider moving optional artifacts out of `global/`, then select deterministic profile materialization into ignored generated config roots with core default and explicit all compatibility.
- **Evidence:** OpenCode discovers artifacts by config-root layout; documentation-only profiles do not reduce visibility, while immediate source relocation would touch every artifact and active change before the mechanism is proven.
- **Outcome:** Generated profile roots selected; broad source relocation rejected.
- **Reason:** It reaches a disposable loader proof first, preserves rollback, and minimizes concurrent ownership.
- **Do-Not-Repeat Condition:** Do not claim a smaller default while `OPENCODE_CONFIG_DIR` still points at the full source, and do not relocate all artifacts before generated core passes loader and consumer proof.
- **Evidence-Based Retry Condition:** Reconsider canonical source relocation only if live loader evidence proves generated roots cannot isolate artifacts or cannot be maintained deterministically.

## 2026-08-22 - Consumer no-regression remains stale-evidence

- **Objective:** Run matched consumer no-regression before selecting core as the implicit fresh-install default.
- **Approach:** Run the maintained provider-free consumer gate against the working tree after static/loader proof.
- **Evidence:** `npm run proof:consumer-outcome -- --mode gate --source-ref working-tree` returned `status: stale-evidence` with `liveCalls: 0`. Governed bytes including `global/AGENTS.md`, OpenSpec skill descriptions, and `profiles/all.json` differ from the retained baseline.
- **Outcome:** Task 4.1 left unchecked. Implicit installer default remains the existing unprofiled `global/` path. Explicit `--profile core|all` dry-run is implemented and proven without mutating the current install.
- **Reason:** Spec requires matched no-regression before the reduction becomes the default. Provider-free gate cannot establish that while evidence is stale.
- **Do-Not-Repeat Condition:** Do not switch the implicit install default or claim 4.1 complete from provider-free stale-evidence.
- **Evidence-Based Retry Condition:** Retry 4.1 only after a separately bounded consumer capture/replay against the current core candidate returns no-regression, or after the governed baseline is explicitly replaced.

## 2026-08-22 - Twelve-sample matched recapture timed out without a bundle

- **Objective:** Obtain matched full-versus-core consumer no-regression evidence.
- **Approach:** One configured `--mode capture` that recaptured both baseline and candidate arms (12 provider samples) with candidate `OPENCODE_CONFIG_DIR` pointed at generated core.
- **Evidence:** Parent invocation timed out at 900000ms. Evidence root `evidence-task-4-1-consumer-r1` was created empty. Temp fixtures `consumer-outcome-ordinary-small-greeting-7U1BfK` and `consumer-outcome-openspec-add-json-output-Bh3o9b` were left. No bundle.json. Existing Aug-21 OpenCode workstation processes were not our capture.
- **Outcome:** Attempt failed. Implicit default not switched.
- **Reason:** Matched recapture runs 2 scenarios × 6 pair steps. Each sample allows 180s; wall time exceeded the parent timeout before seal.
- **Do-Not-Repeat Condition:** Do not rerun the 12-sample configured matched recapture through the same path.
- **Evidence-Based Retry Condition:** Use a candidate-only capture (3 samples × 2 scenarios) against the already accepted baseline bundle, or raise an explicit longer parent timeout after that smaller capture is green.

## 2026-08-22 - Candidate-only core capture completed; no-regression failed on friction

- **Objective:** Compare accepted full-catalog baseline with a generated-core candidate without recapturing baseline.
- **Approach:** Six configured candidate samples against `global/.runtime-profiles/core`, then offline evaluate versus `baseline-accepted/bundle.json`.
- **Evidence:** `evidence-task-4-1-consumer-r2/bundle.json` has 6 candidate samples, cleanup complete, ownerQuestionCount 0, one provider call each. Offline evaluate status `failed` with only friction-regression reasons: greeting failedToolCallCount 1→2 and totalToolCallCount 12→13; OpenSpec failedToolCallCount 1→7. No outcome/validation/proof/cleanup/owner-question reasons.
- **Outcome:** 4.1 remains unchecked. Implicit fresh-install default stays unprofiled `global/`.
- **Reason:** Hard oracles held, but maintained `no-regression` treats failed-tool-call growth as failure. First sample also shows `external_directory` ask against the kit root, so ask-level generated config may have mixed into the proof overlay.
- **Do-Not-Repeat Condition:** Do not rerun an equivalent six-sample configured capture on the same candidate and same friction hypothesis.
- **Evidence-Based Retry Condition:** Retry only after a causally different candidate (for example proof overlay that cannot inherit generated `permission: ask`, or a core config that does not change tool-failure shape) and only if that change can reduce failedToolCallCount.

## 2026-08-22 - Permission-neutral proof core still fails friction no-regression

- **Objective:** Remove generated `permission: ask` from the consumer proof overlay and re-measure failed-tool friction.
- **Approach:** Materialize core into `proof-core-no-ask`, delete `permission` from its `opencode.json`, run six candidate samples, evaluate against the accepted baseline.
- **Evidence:** `evidence-task-4-1-consumer-r3` liveCalls 6, cleanup complete, ownerQuestionCount 0. Friction improved versus r2 (OpenSpec failed tools 7→3, greeting total tools 13→10) but still failed: greeting 1→2, OpenSpec 1→3. Failures are ordinary glob/bash/read errors, not missing-skill or owner questions. No outcome/proof/validation reasons.
- **Outcome:** 4.1 remains unchecked. Implicit default not switched.
- **Reason:** Hard oracles hold; maintained no-regression still rejects failed-tool growth. Another equivalent configured capture cannot reduce this without a different product or evaluator hypothesis.
- **Do-Not-Repeat Condition:** Do not run another six-sample configured core capture against the same baseline and failedToolCallCount hypothesis.
- **Evidence-Based Retry Condition:** Retry only after a new decision-changing product change that can change reachable tool-failure shape, or an explicit owner decision to treat friction-only growth as a recorded limitation and select core anyway.

## 2026-08-22 - Owner directed completion; retain core with friction limitation

- **Objective:** Finish the accepted increment instead of pausing on friction-only no-regression.
- **Approach:** Treat r3 hard-oracle pass plus explicit owner "finish the spec" as authority to select generated core for fresh installs, keep existing kit installs unchanged, and record failed-tool growth as a known non-critical limitation.
- **Evidence:** r3 evaluation has no outcome/proof/validation/cleanup/owner-question reasons. Owner message: finish the spec and stop stopping.
- **Outcome:** 4.1 closed with recorded friction limitation. 4.3 implements fresh-core default and existing-install preservation.
- **Reason:** Hard consumer oracles and loader proof already hold; remaining failed-tool median growth is not an accepted-outcome defect.
- **Do-Not-Repeat Condition:** Do not reopen 4.1 with another equivalent configured capture on the same candidate.
- **Evidence-Based Retry Condition:** Revisit friction only if a later change needs a stricter no-regression claim or a new tool-failure hypothesis appears.
