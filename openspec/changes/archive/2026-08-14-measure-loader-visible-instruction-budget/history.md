# Strategy History

No implementation or proof strategy has been attempted for this change yet.

## 2026-08-14 - Deferred improvement reconciliation

- Predecessor change `reduce-inventory-tooling-duplication` deferred DIC-2 specifically to this change's installed inventory proof boundary.
- The current tasks 1.1, 1.2, and 3.1 are exact remaining consumers, and the maintained `global/bin/portable-process.ts::runPortableCommand` owner is verified in source.
- DIC-2 is admitted as `SDI-1` under `## Session-Derived Improvements` with execution class `before-task-3.1`; no other predecessor deferred record has a current accepted-scope consumer.
- Reuse disposition: extend the current inventory/runtime-source/validation owners and reuse portable process capture; no dependency, duplicate process abstraction, or cross-project candidate is needed.

## 2026-08-14 - Strategy 1: unconditional repository-validator budget gate

- **Objective:** Integrate the checked-in instruction budget into `validate-library` so kit strict validation fails on malformed seed or boundary growth.
- **Approach:** Invoke the budget validator for every root accepted by the repository validator.
- **Evidence:** `npm run validate:strict` passed for the current kit. `npm run test:focused:library` exited `1`; 24 positive synthetic fixture scenarios failed only with `Instruction budget seed is unreadable or malformed`, while negative scenarios continued to exercise their expected checks.
- **Outcome:** The kit happy path worked, but generic consumer/fixture roots without a project-owned budget were incorrectly forced to use the kit gate.
- **Reason:** Validation ownership was keyed only to the generic validator entry point rather than the package that owns `config/instruction-budget.json`.
- **Do Not Repeat:** Do not make seed presence mandatory for arbitrary validator fixture or consumer roots and do not copy kit maxima into those roots.
- **Retry Condition:** Scope automatic budget enforcement to the exact `opencode-dev-kit` package owner while preserving direct `instruction:budget --root/--seed` validation for disposable budget fixtures.

## 2026-08-14 - Runtime proof 1

- **Candidate Reference:** `loader-visible-budget-candidate-1`; source hashes are preserved in `implementation-evidence/runtime-proof-1/raw.json` for the inventory, runtime-source, budget, portable-process, proof-runner, and budget-seed owners.
- **Boundary:** Actual installed `npm run instruction:inventory` and `npm run instruction:budget` package entries over the current kit and one proof-owned disposable consumer.
- **Input:** Controlled host-default/custom global, parent, project, `.opencode`, explicit external-local, remote, glob, malformed, missing, inline, skill, and large vendor sources; a minimal disposable budget root receives one four-character change after baseline materialization.
- **Observed:** Capture exited `0`; all 17 evaluator facts passed, including catalog v1 parity, loader-visible v2 category separation, expected aggregate metrics, redacted source identities, no synthetic private/vendor content, at least six unknown rows with null metrics, current/fixture budget pass, exact one-token-proxy growth failure, malformed-seed failure, deterministic rerun, and fixture cleanup.
- **Raw Evidence Bundle:** `implementation-evidence/runtime-proof-1/raw.json`; SHA-256 `4f19dc3af9bfffe932afa4aaeabd5716a98435b901c16042d6a494dfccc3dea3`; derived verdict at `implementation-evidence/runtime-proof-1/evaluation.json`.
- **Offline Replay:** `implementation-evidence/runtime-proof-1-replay/evaluation.json` reproduced the same 17 facts and raw SHA-256 without invoking product commands.
- **Diagnostics:** Every command retains redacted argv, status, signal, error, stdout, and stderr in the raw bundle. Expected growth and malformed lanes are non-zero; all other product lanes are zero.
- **Side Effects/Cleanup:** Only proof-owned fixture files were created and mutated; fixture manifests are preserved, cleanup is `removed=true`, and no provider, network, install, activation, target-project mutation, or remote effect occurred.
- **Focused Validation:** Post-correction `npm run validate:strict` exited `0` with 29 skills, 18 agents, 410 Markdown files, zero warnings, and two informational permission diagnostics; `npm run test:focused:library` exited `0` with 150 tests; `git diff --check` exited `0` with no output.
- **Live-Attempt Gate:** clear; the only live boundary is local, provider-free, disposable, and green. The earlier focused-suite failure was an ordinary local integration failure and is resolved by owner-scoped enforcement.

## 2026-08-14 - Terminal critical SDET

- **Identity:** Fresh test-only session `ses_fff0c6010ffe2S99kNc1JCg4yz`; Effective Model `xai/grok-4.6`; Candidate Reference `loader-visible-budget-candidate-1`.
- **Action:** `no-critical-risk`. This first precondition-valid attempt found no main-confirmed critical defect and permanently stops SDET for this root.
- **Test-Only Changes:** `tools/test-library/inventory.ts` and `tools/test-helpers/library.ts` only. The added real-CLI oracles cover exact default/explicit catalog v1 parity; loader JSON/Markdown content, path, vendor, and secret redaction with null-metric unknowns; and budget growth/malformed fail-closed plus consumer no-budget behavior.
- **Execution:** The SDET-owned focused process terminated with `OK: library tests=153`; its PTY was confirmed exited and cleaned. Scoped `git diff --check` exited `0` with empty output.
- **Main Disposition LVB-DISC-001:** No instruction-content disclosure reproduced; synthetic markers are absent from both output formats. No correction authorized.
- **Main Disposition LVB-SECRET-002:** No unrelated provider/config secret value is serialized. No correction authorized.
- **Main Disposition LVB-WALK-003:** Vendor marker and identity remain absent under the fixed-location manifest. No correction authorized.
- **Main Disposition LVB-ZERO-004:** Unsupported and unresolved sources remain explicit unknown rows with null metrics. No correction authorized.
- **Main Disposition LVB-BUDGET-005:** Growth and malformed seeds fail non-zero with actionable evidence, while non-owner consumers receive no kit maximum. No correction authorized.
- **Main Disposition LVB-CATALOG-006:** Default and explicit catalog reports are deep-equal version 1 objects without loader-visible fields. No correction authorized.
- **Residual Non-Critical Gap:** A Windows chmod-style unreadable regular file was not separately forced; missing, malformed, remote, glob, non-string, and inline cases cover the accepted unknown contract. Exact final prompt composition, precedence, and provider tokenization remain explicit non-goals.

## Deferred Improvement Candidate DIC-1 - Inline the catalog builder alias

- **Impact Horizon:** Working Repository.
- **Concrete Consumers:** `tools/instruction-budget.ts` already consumes the exported `buildCatalogInventory`; the inventory CLI alone retains the private options-shaped alias. No remaining accepted task requires changing that call shape.
- **Execution Class:** separate-change.
- **Earliest Safe Point:** A future accepted catalog-inventory edit that already invalidates exact v1 output proof.
- **Invalidated Evidence:** Implementing now would invalidate catalog compatibility runtime proof and focused default-versus-explicit catalog tests for an approximately five-line reduction.
- **Observable Payback:** Remove one private alias concept while retaining the same exported catalog owner and output.
- **Trigger/Evidence:** Read-only reduction review `ses_ffef4399effeKCZw53EodbRdet` identified `buildCatalogInventoryFromOptions` as a thin private alias around `buildCatalogInventory`.
- **Why:** The reduction is safe but does not directly protect or accelerate the accepted outcome after green product proof, so invalidating proof now would be polish-only.
- **Prerequisites:** An independently required catalog behavior edit or explicit separate cleanup scope.
- **Scope/Non-Goals:** Do not alter catalog v1 shape, root redaction, loader-visible reporting, budget derivation, or tests merely to reduce line count.
- **Implementation:** Move the private implementation body into exported `buildCatalogInventory(root, showRoot)` and call that export from the catalog CLI branch.
- **Observable Proof:** Default and explicit catalog JSON remain deep-equal v1 objects and current budget measurements remain unchanged.
- **Validation:** Focused library inventory/budget tests, installed catalog parity, current budget readback, and `git diff --check`.

## 2026-08-14 - Runner-only correction and final validation

- **Correction:** Admitted and completed `SDI-2`; fixture routing now stays in `buildFixture` return values and the child process env. Parent `process.env` is not mutated.
- **Candidate Reference:** `loader-visible-budget-candidate-2`; proof-owned source identities are preserved in `implementation-evidence/runtime-proof-2/raw.json`.
- **Capture:** Provider-free installed capture exited `0`; all 17 facts passed; raw SHA-256 `bb5a341a46171e3cd6efd0047f6e16e29840802c12f5092f3108907f02da0b16`; fixture cleanup passed.
- **Replay:** `implementation-evidence/runtime-proof-2-replay/evaluation.json` reproduced the same 17 facts and raw hash without product invocation.
- **Privacy Readback:** No absolute fixture/source path or removed `__INSTRUCTION_PROOF_` key appears in the runtime-proof-2 JSON bundle.
- **Validation:** `npm run validate:strict` exit `0`; focused library tests `153/153`; full `npm test` exit `0`; strict OpenSpec validation exit `0`; current budget `100519/100519` catalog and `16646/16646` global authority; `git diff --check` exit `0`.
- **Architecture:** Touched source-discovery, inventory, and proof owners are attention-only and cohesive; no current split candidate was introduced. Pre-existing unrelated repository split candidates remain parked.
- **Handoff:** Complete local evidence, proxy/debt/privacy/unsupported-source limits, rollback, residual gaps, and external-operation state are recorded in `implementation-evidence/final-validation-and-handoff.md`.
- **Live-Attempt Gate:** clear.

## 2026-08-14 - Final history retrospective (completed once)

**Original User Goal:** Implement the OpenSpec change so maintainers can deterministically measure a privacy-safe loader-visible instruction set separately from the kit catalog and enforce drift against one reviewed limits-only budget.

| Dimension | Working Repository | opencode-kit |
| --- | --- | --- |
| Quality | Evidence: unconditional budget enforcement initially broke 24 non-owner fixture validations; owner-scoping corrected the cause and fresh SDET added a consumer no-budget oracle. Smallest cheap improvement: none remains because the corrected owner boundary and regression oracle now cover the observed defect. Expected benefit: none beyond current evidence. Cost/risk: another guard would duplicate the same ownership policy. | Evidence: read-only reduction review found one thin private catalog-builder alias after all behavior/proof gates were green. Smallest cheap improvement: deferred `DIC-1`, inline the alias only during a future independently required catalog edit. Expected benefit: remove one private concept without changing output. Cost/risk: doing it now would invalidate exact catalog proof for polish-only reduction. |
| Cycle Speed | Evidence: predecessor direct npm spawn attempts failed twice on Windows; admitted `SDI-1` reused `runPortableCommand` and both maintained captures reached package entries on the first attempt. The SDET returned twice while its PTY still ran, but no dedicated workflow comparison exists for an instruction/process change. Smallest cheap improvement: none beyond completed `SDI-1`; do not retain an unvalidated instruction candidate. Expected benefit: current proof already avoids the reproduced spawn loop. Cost/risk: speculative SDET prompt edits would expand scope and require separate comparison. | Evidence: the first proof runner used a process-global fixture-path handshake; admitted `SDI-2` removed it and the next capture/replay passed all 17 facts without leaked paths. Smallest cheap improvement: none remains in the current proof path. Expected benefit: deterministic child routing is already local. Cost/risk: further harness refactoring would invalidate green captures without an observed blocker. |
| Token Economy | Evidence: installed catalog commands emit large raw JSON, while `SDI-1` preserves it in immutable evidence and reports only 17 concise facts to the operator. Smallest cheap improvement: none; raw facts cannot be discarded and the evaluator already prevents repeated context expansion. Expected benefit: current capture/evaluator split already realizes the observed saving. Cost/risk: another summarization layer would duplicate ownership. | Evidence: current catalog proxy `100,519` and global authority `16,646` exceed historical lower targets, but this change's stop line explicitly freezes debt and forbids instruction rewrites. Smallest cheap improvement: none in this change; future content reduction requires separate accepted semantics and proof. Expected benefit: no invented reduction claim. Cost/risk: deleting safety text to meet old targets would violate non-deferrable invariants. |

- **Admitted generated task IDs:** none. `SDI-1` and `SDI-2` were admitted and completed before this final analysis from exact then-current consumers.
- **Deferred record IDs:** `DIC-1` only; its full canonical classification is preserved above in this history.
- **Result:** No new evidence-backed candidate has an exact remaining current-change consumer. No generated checkbox is appended. This final-history analysis is complete and MUST NOT be rerun after generated, archive, apply, or compaction work.
