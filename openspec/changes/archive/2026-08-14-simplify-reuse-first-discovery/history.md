# Strategy History

## 2026-08-14 - Complete the original private registry increment

- **Objective:** Decide whether to finish `adopt-reuse-first-capability-discovery` as originally designed.
- **Approach:** Compare its accepted outcome, implementation, task evidence, current Git history, recent archived workflow changes, current normative specs, configured runtime, and archive gates.
- **Evidence:** The original change retained 11 of 14 unchecked tasks; its loaded same-model happy path remained red; incremental refresh, cache fallback, `needs-review`, complete privacy/qualification lanes, SDET, final validation, and spec synchronization were incomplete. `OPENCODE_REUSE_CONFIG` is unset on the current machine. Current repository work uses bounded current-repository plus configured Graphify discovery and records registry impact as `not-applicable`.
- **Outcome:** Rejected. The original change was preserved as `abandoned-incomplete` without main-spec synchronization.
- **Reason:** Completing a broad unconfigured registry product would add substantial maintenance and proof cost without a current consumer, while the useful reuse-first behavior has a smaller existing path.
- **Do-Not-Repeat Condition:** Do not resume the archived registry task graph or represent its Rung 2 client proof as a complete loaded product outcome.
- **Evidence-Based Retry Condition:** Reconsider only through a new owner-approved change if a concrete current consumer requires curated named allowlists, durable registration/outbox, trusted promotion, and incremental committed-tree inventory that configured source intelligence cannot satisfy.

## 2026-08-14 - Abandon without reconciling shipped runtime surfaces

- **Objective:** Minimize current work by moving only the incomplete OpenSpec change to the abandoned archive.
- **Approach:** Preserve the original artifacts and leave its command, registry modules, template, skill wording, package entries, and proof runner active.
- **Evidence:** Those product surfaces were committed in `06833cf`, remain discoverable in README/profile/package catalogs, and are not owned by synchronized main requirements. A simple abandon would therefore leave unproved active behavior and misleading maintenance authority.
- **Outcome:** Rejected.
- **Reason:** Historical preservation alone does not reconcile already shipped runtime and instruction surfaces.
- **Do-Not-Repeat Condition:** Do not call the repository consistent while `/reuse-inventory` or `reuse:registry` remains active without an accepted owning change.
- **Evidence-Based Retry Condition:** None for this change; active surfaces must either be removed now or receive a separately accepted, fully proved normative owner.

## 2026-08-14 - Tool-neutral portable workflow with machine-local Graphify refinement

- **Objective:** Preserve cross-project reuse value without embedding current maintainer topology or requiring a new registry.
- **Approach:** Keep one portable lazy skill that requires an explicit configured cross-project source, bounded terms, current-source verification, and degraded behavior; let the ignored machine-local instruction layer select Graphify and its concrete refresh/query procedure.
- **Evidence:** `global/opencode.local.instructions.md` is ignored by Git and already contains the current Graphify-specific gate. Recent archived changes successfully use that layer while portable global artifacts remain project-neutral.
- **Outcome:** Selected for implementation.
- **Reason:** It reuses current operational ownership, preserves privacy and source verification, removes the unused parallel product, and remains portable when no graph provider exists.
- **Do-Not-Repeat Condition:** Do not copy machine paths, private project names, Graphify refresh commands, or one-provider assumptions into committed global instructions.
- **Evidence-Based Retry Condition:** Reconsider global provider-specific routing only if the portable kit explicitly adopts and provisions one provider for all supported users through a separately accepted config/install change.

## 2026-08-14 - Patterned bash deny in the proof envelope

- **Objective:** Prove the simplified loaded behavior under a technically enforced no-product-mutation tool envelope.
- **Approach:** Use the predecessor runner's nested bash permission map with broad deny, two narrow removed-registry allow patterns, and deny-last metacharacter patterns while recording exact config readback.
- **Evidence:** Candidate preflight r2 reported `permissionExact: true`, but `candidate-sessions-r1/local-owner.bundle.json` recorded a completed arbitrary `node --experimental-strip-types --input-type=module -e ...` bash call. The command was read-only, stayed in the disposable workspace, changed no tracked source, and correctly exposed a defective candidate; SDET reproduced no critical incident.
- **Outcome:** Product behavior proof advanced and remains trustworthy as an observation, but the claimed technically enforced bash restriction is rejected. Proof Runner/capture evidence is invalidated until a safer envelope is recaptured.
- **Reason:** The nested permission-map shape did not enforce the expected runtime denial for this command. The exact matcher/merge cause is unknown and is not needed for the smallest correction.
- **Do-Not-Repeat Condition:** Do not represent nested bash patterns as an independently enforced no-product-mutation boundary for this runner or retain the removed-registry sentinel allow rule.
- **Evidence-Based Retry Condition:** Replace bash policy with flat `deny`, prove exact loader readback in zero-provider preflight, then recapture both matched scenarios and replay the evaluator before qualification.

## 2026-08-14 - Evaluator r2 output-root poisoning

- **Objective:** Replay the preserved baseline and bash-denied candidate bundles through the terminal offline evaluator without another model call.
- **Approach:** Invoke evaluate mode first with an inferred `baseline-sessions-r1` path, then correct the path to the actual `baseline-sessions` directory while retaining the same output root.
- **Evidence:** Attempt 1 failed with `ENOENT` for `baseline-sessions-r1/local-owner.bundle.json` after creating `candidate-evaluation-r2`; attempt 2 found the correct input but failed closed because that output root already existed. `implementation-evidence/candidate-evaluation-r2/failure.md` preserves both exact commands and errors. Raw baseline and candidate bundles were not changed; both attempts made zero model calls.
- **Outcome:** No derived verdict was produced. Two materially similar cheap/local attempts in the same evaluator chain made no accepted-artifact progress, so the chain is stagnant and another same-mechanism retry is prohibited.
- **Reason:** The caller used one wrong input name, and `evaluate` created its immutable output directory before proving that all inputs were readable.
- **Do-Not-Repeat Condition:** Do not reuse a failed evaluator output root or create evaluator output before reading all immutable inputs.
- **Evidence-Based Retry Condition:** Move `createEvidenceRoot` after all four `readBundle` calls, use the verified `baseline-sessions` input and a fresh `candidate-evaluation-r3` root, then require terminal `candidateComplete: true` with zero model calls.

## Deferred Improvement Candidates

### DIC-1 - Robust patching for long Markdown rows

- **Impact Horizon:** `opencode-kit`
- **Concrete Consumers:** future kit authors changing long single-line rows in `tools/proofs/README.md` or wrapped OpenSpec scenarios
- **Execution Class:** `separate-change`
- **Earliest Safe Point:** a dedicated editor/tooling change after owner disposition
- **Invalidated Evidence:** none in this change; implementation would belong to the editor/tooling owner
- **Observable Payback:** a reproduced long-line change succeeds without temporary replacement scripts or repeated failed patch matching
- **Trigger/Evidence:** `apply_patch` could not match the long reuse proof inventory row or a wrapped instruction-artifact scenario; the current change required one temporary replacement helper that was deleted after use.
- **Why Not Admitted:** No remaining current-change consumer exists; the affected rows are already correct.
- **Scope/Non-Goals:** Do not alter reuse behavior or current evidence to work around editor implementation.
- **Implementation:** Unknown until a dedicated tooling owner diagnoses line matching.
- **Validation:** Reproduce the same long-row patch in a disposable fixture, then prove exact diff and unchanged adjacent text.
- **Owner Blocker:** The `apply_patch`/OpenCode tool implementation is outside this change's mutation authority.
- **Re-evaluation Condition:** Another required long single-line or wrapped-block edit reproduces the same failure.

### DIC-2 - Share proof process plumbing only after a second exact consumer

- **Impact Horizon:** Working Repository
- **Concrete Consumers:** current `tools/proofs/reuse-discovery.ts`; possible existing owners `tools/proofs/lib/opencode-proof-client.ts`, `tools/proofs/agent-tooling-ergonomics.ts`, and `tools/proofs/deduplication-audit.ts`
- **Execution Class:** `separate-change`
- **Earliest Safe Point:** after a second exact in-repository consumer demonstrates compatible fixture/redaction/session-cleanup needs
- **Invalidated Evidence:** reuse-discovery preflight/capture/evaluator evidence if its driven boundary or recorded facts change
- **Observable Payback:** demonstrated removal of duplicated process/env/redaction/session-delete code while preserving byte-equivalent raw facts and cleanup
- **Trigger/Evidence:** the standalone 614-line runner contains process environment, event parsing, redaction, session deletion, and cleanup concerns similar to other proof tooling.
- **Why Not Admitted:** The runner is green, cohesive, below the 800-line split threshold, and no remaining accepted-scope task consumes an extraction. Refactoring now would invalidate proof without improving the outcome.
- **Scope/Non-Goals:** No new scenario, registry revival, provider abstraction, or behavior change.
- **Implementation:** Unknown until exact shared contracts are compared against current source.
- **Validation:** Matched preflight/capture/evaluator bundles and cleanup before/after extraction.
- **Re-evaluation Condition:** A behavior-changing runner edit is required or a second exact consumer must share the same boundary.

### DIC-3 - Add help to the unchanged OpenSpec operation gate CLI

- **Impact Horizon:** `opencode-kit`
- **Concrete Consumers:** `package.json` script `openspec:gate`, `global/bin/openspec-operation-gate.ts`, and future local operators
- **Execution Class:** `separate-change`
- **Earliest Safe Point:** a dedicated CLI ergonomics change before that CLI is materially changed or newly documented for direct operator use
- **Invalidated Evidence:** operation-gate tests and any exact stderr contract for unknown options
- **Observable Payback:** `npm run openspec:gate -- --help` and `-h` exit `0`, print operations/required arguments, and create no report or other effect
- **Trigger/Evidence:** task 5.1 help probe exited non-zero with `Unknown option: --help`; source readback was required to identify supported operations.
- **Why Not Admitted:** This change neither added nor materially changed the gate, exact task 5.1 apply invocation is already proved, and no remaining current-change consumer needs help.
- **Scope/Non-Goals:** Do not change operation policy, persisted reports, lifecycle gates, or accepted reuse behavior.
- **Implementation:** Add effect-free help parsing and focused existing-owner tests in a separate change.
- **Validation:** Actual `--help` and `-h` entry points plus operation-gate test suite.
- **Re-evaluation Condition:** The operation gate is next materially changed or directly documented as an operator CLI.

## 2026-08-14 - Final history retrospective (one-time)

- **Original User Goal:** Decide whether the broad incomplete reuse-registry change should be finished after recent repository history, then execute the accepted smaller path without weakening reuse-first discovery.
- **Outcome:** The predecessor is preserved as `abandoned-incomplete`; the replacement removes the unused registry/inventory product, retains one compact trigger plus one lazy source-verified reuse workflow, and is proved/validated through the installed entry point.

| | Working Repository | `opencode-kit` |
|---|---|---|
| Quality | Patterned bash policy appeared exact in config but raw r1 capture executed arbitrary local bash -> completed flat deny plus no-bash evaluator oracles (`SDI-3` proof chain) -> technically enforced Rung 2 boundary -> one recapture/evaluator revision, no Product Candidate change | Unchanged operation gate lacks effect-free help -> deferred `DIC-3` -> future operator discoverability without guessed flags -> separate test/CLI change; no current benefit |
| Cycle Speed | Wrong inferred baseline path plus early output creation poisoned evaluator r2 -> completed transactional input read before output (`SDI-3`) -> corrected replay reached terminal verdict without model calls -> four-line evaluator reordering and one fresh output root | Long-line patch matching failed twice -> deferred `DIC-1` -> avoid temporary edit helpers in a future reproduced case -> tooling-owner cost/risk unknown |
| Token Economy | Compact retained skill is 58 lines/token proxy 949 and total inventory is 100,165; no remaining consumer needs another instruction reduction -> none -> avoids speculative wording churn -> no cost | Proof runner duplicates some process plumbing but is cohesive at 614 lines -> deferred `DIC-2` until a second exact consumer -> possible future source reduction without premature abstraction -> would invalidate proof if done now |

- **Previously Admitted Improvements:** `SDI-1`, `SDI-2`, and `SDI-3` are complete with their task-local observable proof.
- **New Current-Consumer Improvements:** none. Every accepted task after validation is handoff-only; no deferred item has an exact remaining consumer.
- **Deferred Records:** `DIC-1`, `DIC-2`, and `DIC-3` above are non-blocking and have explicit re-evaluation conditions.
- **Retrospective Stop:** This is the single final-history retrospective. Apply, archive, compaction, or later generated tasks must not rerun it.
- **RC Freeze:** `RC1`; no known reachable critical or non-deferrable defect remains, Runtime Proof is current, terminal SDET is `no-critical-risk`, and complete applicable validation is green.

## 2026-08-14 - Complete archive attempt 1 rejected duplicate ADDED requirements

- **Objective:** Complete-archive `simplify-reuse-first-discovery` through the canonical helper with strict spec merge and aggregate project validation.
- **Approach:** Run `openspec-archive.ts` with `npm.cmd run prepush:validate` after the archive operation gate reported 0/10 unchecked tasks.
- **Evidence:** Pre-archive strict validation and aggregate validation passed. Official `openspec archive simplify-reuse-first-discovery --yes --json` returned `archive_spec_update_failed`: `library-instruction-artifacts` header `Reuse discovery has one compact loaded owner and one lazy detail owner` was declared `ADDED` but already exists in the synchronized main spec. The official result states `No files were changed.` Raw terminal output is preserved in session `pty_ba69c3ac` until retry closure.
- **Outcome:** Archive failed closed before movement, post-archive validation, commit, or push. Product Candidate, main specs, Runtime Proof, SDET, RC1, and validation remain unchanged.
- **Reason:** Apply-time normative synchronization created the accepted main requirements, but two complete change deltas retained their pre-synchronization `ADDED` operation.
- **Do-Not-Repeat Condition:** Do not retry while a delta declares an already-existing complete accepted requirement as `ADDED`, and do not edit main specs or use `--skip-specs` to bypass the official merge.
- **Evidence-Based Retry Condition:** Convert the complete already-synchronized `library-instruction-artifacts` and `library-reuse-discovery` delta sections to `MODIFIED`, make the proof requirement byte-equivalent to current accepted main semantics, pass strict selected/all OpenSpec and aggregate project validation, then rerun the same canonical helper once.
