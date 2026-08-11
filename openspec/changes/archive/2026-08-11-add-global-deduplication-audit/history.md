# Strategy History

No materially distinct implementation or proof attempts are recorded yet.

## 2026-08-11 - First installed CLI proof used path-prefixed oracle

- **Objective**: Prove the installed `jscpd` v5 detects a controlled clone and completes a bounded repository scan without source mutation.
- **Approach**: Run the AI reporter on disposable `src` files and require output locations matching `src/one.ts` and `src/two.ts`; run the same reporter on `tools/validators` with explicit exclusions.
- **Evidence**: `implementation-evidence/cli-proof/cli-proof.json` records version `cpd 5.0.14`, both scans at status `0`, controlled output `one.ts:1-8 ~ two.ts:1-8`, three bounded repository candidates, byte-identical fixture source hashes, and cleanup `removed`.
- **Outcome**: Product observations were green, but the runner returned non-zero because its location evaluator expected a `src/` prefix that the AI reporter omits when the scan root itself is `src`.
- **Reason**: The evaluator assumed report paths were relative to the process working directory rather than the supplied scan root. The reporter also emitted an upstream promotional `dry-refactoring` installation tip that is irrelevant and untrusted.
- **Do-not-repeat condition**: Do not require the supplied scan-root prefix in AI reporter locations or preserve promotional tips in normal proof output.
- **Evidence-based retry condition**: Accept exact controlled filenames with optional path prefixes, add `--no-tips --no-colors`, preserve the first bundle, and run one new local disposable capture under a distinct evidence root.

## 2026-08-11 - First six-scenario candidate corpus exposed fixture mismatches

- **Objective**: Compare six identical baseline/candidate workflows and require a local-owner `reuse` decision plus a semantically different near-clone `keep separate` or `not proven` decision.
- **Approach**: Use a local-owner fixture with one canonical caller and one unused duplicate, and a near-clone fixture with four shared contiguous implementation lines; capture all candidate scenarios and run the terminal offline evaluator.
- **Evidence**: `implementation-evidence/behavior-evaluation/evaluation.json` is terminal and complete. All processes, source hashes, and cleanup are green. `local-owner.usesReuse=false` because the duplicate had no caller and `remove` was the correct observed recommendation. `semantic-near-clone.cautiousClassification=false` because real `jscpd` found no clone even at 20 tokens, so the workflow correctly declined to manufacture a candidate. Original raw bundles remain under `implementation-evidence/runtime-proof/`.
- **Outcome**: The Product Candidate behaved safely, but the synthetic workspaces could not produce the two observations named by the accepted evaluation matrix.
- **Reason**: The local-owner fixture modeled dead duplicate code rather than a second caller that should be redirected. The near-clone fixture did not meet the detector's accepted minimum contiguous-line shape.
- **Do-not-repeat condition**: Do not infer a `reuse` oracle from an unused copy or claim a near-clone classification when the real detector produced no candidate.
- **Evidence-based retry condition**: Add a real caller of the duplicate and an explicit canonical package export; create at least five contiguous near-clone lines while retaining different errors/effects/output; capture matching baseline and candidate overrides; sanitize both; and replay the complete corpus offline before any further live attempt.
