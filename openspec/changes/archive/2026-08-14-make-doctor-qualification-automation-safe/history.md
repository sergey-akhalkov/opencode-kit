# Strategy History

Initial state: no implementation or proof strategy had been attempted.

## Attempt 1 - Focused doctor suite after inspector composition

- **Objective:** Validate doctor gate and runtime-source composition through the existing focused library suite.
- **Approach:** Ran `npm run test:focused:library` after `doctor.ts` imported the effect-limited inventory API from `tools/opencode-runtime-sources.ts`.
- **Evidence:** The suite reported 36 doctor failures. The first and repeated cause was `ERR_MODULE_NOT_FOUND` for `<fixture>/tools/opencode-runtime-sources.ts`; `newIsolatedDoctorFixture` copied `doctor.ts` and its validator dependencies but not the newly composed inspector. `node --check` passed for both production entrypoints.
- **Outcome:** Focused validation is red; the production CLI remains available for direct disposable-boundary proof.
- **Reason:** The isolated test fixture dependency manifest predates the required production import.
- **Do Not Repeat:** Do not rerun the focused library suite against the same fixture copier; every doctor case will fail before behavior is exercised.
- **Retry Condition:** A fresh test-only owner updates the isolated fixture to include the real runtime-source module and required package resolution, then the suite may be rerun once.

## Attempt 2 - Maintained installed-CLI runtime proof

- **Objective:** Prove the complete automation-safe doctor outcome through the package-script entrypoints used by operators.
- **Approach:** Added the provider-free `tools/proofs/doctor-qualification.ts` runner and invoked `npm run doctor` plus `npm run opencode:sources` over controlled custom-global, host-default, ready, blocked, missing, and canonical-collision layouts.
- **Evidence:** `evidence/runtime-proof-r1/raw.json` records 11 exact argv/exits/stdout/stderr lanes, source and runner hashes, unchanged before/after project manifests, no private sentinel or fixture-path disclosure, and zero validation-command markers. `evaluation.json` records `status: complete` and `cleanup: complete`.
- **Outcome:** Structural warning pass, structural block, qualification pass/block, unattended collision block, multiple blocker retention, default exit compatibility, help/invalid-option behavior, additive layering, canonical collision locations, effect freedom, and cleanup all passed.
- **Reason:** The maintained runner reaches the installed package-script boundary while keeping effects local, disposable, provider-free, and replayable from preserved evidence.
- **Do Not Repeat:** Do not rerun the live fixture capture against the unchanged Product Candidate; use the immutable bundle unless product, runner, or dependent environment identity changes.
- **Retry Condition:** A dependent Product Candidate, Proof Runner, or relevant environment mutation invalidates the affected lane and requires a new evidence root and candidate id.

## Critical SDET - Terminal no-critical-risk

- **Objective:** Independently challenge fail-open selected gates, canonical-collision acceptance, private-content disclosure, and unintended project validation execution.
- **Approach:** Fresh test-only SDET `ses_fff728faaffe7pkTRY5bB7JpbZ` updated only `tools/test-library/doctor.ts`, copied the real runtime-source dependency into isolated doctor fixtures, and added two critical regression oracles.
- **Evidence:** Effective Model `xai/grok-4.6`; terminal `Action: no-critical-risk`; `node tools/run-focused-test.ts tools/test-library.ts` exited `0` with `OK: library tests=150`. Product hashes remained doctor `0971266478f28fcd14c4c368b1485ebb960a0a991b2ab8bbb7cba52316042348`, runtime sources `db79a48df05734a79d68a84d0371bc942f9041051b50fa8440216b91d963dc98`, and package `ced3868f841c41cc57ccd8375770f89f8b2b292a576bd516e93543e5559a792e`.
- **Outcome:** No critical production defect was reproduced. The first precondition-valid no-confirmed-critical attempt permanently stops SDET for this root.
- **Reason:** The critical oracles agree with the independent installed-boundary runtime proof and detect fail-open exits, truncated blockers, accepted canonical collisions, sentinel leakage, and validation marker creation.
- **Do Not Repeat:** Do not launch another SDET attempt for this root without violating the permanent stop condition.
- **Retry Condition:** None; terminal SDET state is `no-critical-risk` for this root.

## Attempt 3 - Complete validation exposed README contract drift

- **Objective:** Run complete project-native validation before candidate readback and handoff.
- **Approach:** Ran `npm run validate:strict`, full `npm test`, scoped strict OpenSpec validation, and `git diff --check` in parallel after terminal SDET.
- **Evidence:** Strict validation passed with zero warnings; scoped OpenSpec validation passed; diff check passed. Full tests reached `OK: library tests=150` and then one contract failed: `README missing manual activation/bootstrap rollback honesty: Doctor is a structural diagnostic, not lifecycle readiness certification`.
- **Outcome:** Task 4.2 remains open. The failure is candidate-attributable documentation wording drift, not a production, proof, or test-oracle failure.
- **Reason:** The doctor documentation replacement omitted a repository-enforced exact non-certification sentence while describing explicit diagnostic gates.
- **Do Not Repeat:** Do not rerun the complete suite until the exact truthful non-certification boundary is restored in README.
- **Retry Condition:** Restore that sentence without weakening explicit gate semantics, run the focused contract suite, then rerun invalidated complete validation lanes.

## Attempt 4 - Partial README marker correction remained red

- **Objective:** Confirm the README contract after restoring the first exact non-certification boundary.
- **Approach:** Restored the first reported sentence and ran `npm run test:focused:contracts`.
- **Evidence:** The same contract advanced to another missing required marker: `` `qualificationStatus: pass|blocked` and per-check `blocksQualification` ``. All preceding contract checks passed.
- **Outcome:** No green validation progress; task 4.2 remains open.
- **Reason:** The initial correction followed only the first failure message instead of the complete contract inventory.
- **Do Not Repeat:** Do not continue restoring README markers one failure at a time.
- **Retry Condition:** Inspect the full README token array in `tools/test-contracts.ts`, restore every still-applicable qualification-honesty marker in one coherent paragraph, then rerun the focused contracts once.

## Attempt 5 - Corrected complete validation

- **Objective:** Requalify every validation lane invalidated by the README correction and prepare the local apply handoff.
- **Approach:** Inspected the complete contract token array, restored all applicable qualification-honesty markers in one paragraph, ran focused contracts, then reran strict validation, full tests, scoped strict OpenSpec validation, and diff hygiene.
- **Evidence:** `npm run test:focused:contracts` exited `0` with 67 tests; `npm run validate:strict` exited `0` with zero warnings; `npm test` passed all 11 suites; scoped strict OpenSpec validation reported valid; `git diff --check` exited `0`.
- **Outcome:** All applicable validation is green. `evidence/local-handoff.md` records Candidate Reference, Runtime Proof, SDET, compatibility, limits, rollback, external-operation state, and `Development-Stage: MVP`.
- **Reason:** The full contract inventory removed the same-chain one-marker-at-a-time failure mode.
- **Do Not Repeat:** Do not rerun validation against this unchanged candidate before the final one-shot history retrospective; replay only lanes invalidated by subsequent artifact changes.
- **Retry Condition:** A Product Candidate, test, validator, or accepted-semantics mutation invalidates its dependent lanes.

## Final History Retrospective

Original User Goal: Implement every task in `make-doctor-qualification-automation-safe` so doctor automation uses explicit, matching gates and canonical runtime-source collisions fail closed without leaking private content or changing the default informational contract.

Analysis Status: complete

Generated Task IDs: none

Deferred Record IDs: `DI-001`

| Dimension | Working Repository | opencode-kit |
| --- | --- | --- |
| Quality | none (Attempt 1's isolated-fixture dependency gap was corrected by the fresh SDET and is covered by the green 150-test library suite; no remaining deficiency has an exact current-change consumer) | none |
| Cycle Speed | none | Attempts 3 and 4 showed two serial focused-test failures because the README token loop reported only the first missing token -> aggregate all missing tokens in that one contract diagnostic -> one focused run can expose the complete drift set -> small test-only change, but it invalidates contract-test evidence and has no remaining current-change consumer |
| Token Economy | none | none (the verbose diagnostic fallback and complete raw doctor reports were decision-relevant evidence; no smaller retained output was shown to preserve the same oracles) |

Retrospective Result: no improvement was admitted into current completion scope. `DI-001` is preserved below as a non-blocking separate-change candidate. This analysis MUST NOT be rerun after task completion or by apply/archive/compaction.

## Deferred Improvement Candidate DI-001 - Aggregate README Contract Drift

- **Impact Horizon:** opencode-kit
- **Concrete Consumers:** `tools/test-contracts.ts` lines 411-429 and future edits to the README rollback/doctor contract text governed by that exact token array; there is no remaining consumer in this change.
- **Execution Class:** separate-change
- **Earliest Safe Point:** before the next change that edits a README token governed by the portable bootstrap/discovery/manual rollback contract.
- **Invalidated Evidence:** focused contract-suite and full-suite results for any candidate that changes `tools/test-contracts.ts`; current Runtime Proof and Product Candidate evidence are unaffected.
- **Observable Payback:** a fixture or temporary mutation removing two governed README tokens reports both missing tokens in one focused contract run, while the unchanged repository still passes all contract tests.
- **Trigger/Evidence:** Attempt 3 reported the first missing README token; after its isolated correction, Attempt 4 reported a second token from the same loop. The first-error diagnostic required two serial edit/run cycles.
- **Why:** Aggregating the loop's missing-token diagnostics would preserve exact causes while reducing repeated validation cycles for the same contract owner.
- **Prerequisites:** Confirm the contract helper can aggregate failures without suppressing unrelated test cases or changing token semantics.
- **Scope/Non-Goals:** Change only diagnostic aggregation for this README token loop. Do not weaken, infer, reorder, or remove required tokens; do not alter doctor behavior or README policy.
- **Implementation:** Collect every absent token in stable array order and throw one cause-preserving error listing the complete missing set after the loop.
- **Observable Proof:** A controlled two-token omission produces one failure naming both exact tokens in stable order; restoring the source returns `npm run test:focused:contracts` to green.
- **Validation:** Focused contracts, complete `npm test`, `npm run validate:strict`, and `git diff --check`.
