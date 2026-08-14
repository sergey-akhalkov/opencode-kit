# Strategy History

## 2026-08-14 - Baseline capture through bare `npm` spawn

- **Objective:** Capture JSON, Markdown, and invalid-root instruction-inventory baselines through the package entry point before Product Candidate mutation.
- **Approach:** Use a Node evaluator with `spawnSync("npm", ...)`, hash stdout/stderr, and extract stable output facts.
- **Evidence:** All three evaluator lanes failed before inventory execution because Windows returned no stdout for the bare `npm` executable; the evaluators raised `TypeError` while reading or hashing `undefined`. The scoped target diff remained empty.
- **Outcome:** No baseline was captured and no Product Candidate file changed.
- **Reason:** The synchronous Windows process boundary requires the platform command shim (`npm.cmd`) when `shell: false`.
- **Do Not Repeat:** Do not use bare `npm` with `spawnSync(..., { shell: false })` on this Windows host.
- **Retry Condition:** Retry once with `npm.cmd`, preserving the same argv, working directory, evaluator facts, and missing-root precondition.

## 2026-08-14 - Baseline capture through `npm.cmd` spawn

- **Objective:** Satisfy the baseline capture after the bare-executable Windows resolution failure.
- **Approach:** Repeat the same three Node evaluator lanes with `spawnSync("npm.cmd", ..., { shell: false })`.
- **Evidence:** Every lane failed before inventory execution with `spawnSync npm.cmd EINVAL`; the scoped Product Candidate diff remained empty.
- **Outcome:** No baseline was captured and no Product Candidate file changed.
- **Reason:** This Node runtime does not accept the Windows command shim through the selected direct synchronous spawn path.
- **Do Not Repeat:** Do not retry Node `spawnSync` with either `npm` or `npm.cmd`, and do not vary only quoting, timeout, or output formatting.
- **Retry Condition:** Use a materially different host-native process mechanism that resolves the installed `npm` entry point, captures both streams in memory, and exposes the real exit code before Product Candidate mutation.

## 2026-08-14 - Host-native baseline and walker reduction

- **Objective:** Remove the private Markdown walker while preserving the complete instruction-inventory contract.
- **Approach:** Invoke the installed `npm run instruction:inventory` entry point directly from PowerShell for JSON, Markdown, and invalid-root lanes; capture raw output plus normalized in-memory SHA-256; replace only the private walker with `walkMarkdownFiles`; immediately replay all lanes.
- **Evidence:** Baseline and candidate matched exactly: JSON exit `0`, 530 normalized lines, SHA-256 `d802a84bc4e70c0931d6e222ed18257362acf3f47e04e054cd67ec09d3b9d647`; Markdown exit `0`, 62 lines, SHA-256 `a4318cbc4705527eca61099368c2894c7337811de679588362980bbe5eda909b`; invalid-root exit `1`, 5 lines, SHA-256 `c5b26d266dbd1d6666a52af222df41103840dd832a26e0d60af80f15c6c91d25`, with `Root is not a directory: <redacted>`. The JSON remained version `1`, root `<redacted>`, 58 artifacts, 4,747 lines, 401,996 characters, and token proxy 100,519. The scoped diff was 2 insertions and 17 deletions.
- **Outcome:** Task 1.1 passed at the installed package boundary with no inventory drift.
- **Reason:** The existing validator walker is behaviorally equivalent for sorted Markdown traversal and exclusions.
- **Do Not Repeat:** Do not restore or fork the private walker while `walkMarkdownFiles` retains this contract.
- **Retry Condition:** Replay the three lanes if `tools/instruction-artifacts-inventory.ts`, `tools/validators/context.ts`, or relevant scanned Markdown inputs change before handoff.

## 2026-08-14 - Shared focused-test harness reduction

- **Objective:** Remove the private code-quality inventory fixture, process, and assertion harness without losing a scenario or oracle.
- **Approach:** Run `npm run test:focused:code-quality` as baseline, import the existing library temp, text, line, process-capture, and assertion owners, keep command argv in the scenario owner, and rerun the same package entry point.
- **Evidence:** Baseline and candidate each reported `OK: code-quality inventory tests=4`. Attention filtering, split-candidate failure, default-root redaction, and invalid-root redaction scenarios and assertions remain in `tools/test-code-quality-inventory.ts`. `tools/test-helpers/library.ts` did not change. The combined Product Candidate diff is 18 insertions and 89 deletions, net `-71` lines across the two exact duplicate concepts.
- **Outcome:** Task 2.1 passed through the maintained focused test entry point with one shared harness owner and no new helper API.
- **Reason:** `invokeProcessCapture` and the existing fixture/assertion exports already cover the required behavior; a specialized shared invocation wrapper was unnecessary.
- **Do Not Repeat:** Do not recreate local temp, process-capture, or assertion helpers in this test.
- **Retry Condition:** Replay the focused entry point if the test file, shared helper behavior, code-quality inventory executable, or package script changes before handoff.

## 2026-08-14 - Complete validation and read-only reduction review

- **Objective:** Validate the complete two-concept reduction and obtain the required independent reduction readback.
- **Approach:** Run focused library and code-quality entries, strict library validation, the full configured test suite, strict selected OpenSpec validation, and diff whitespace validation; freeze file SHA-256 identities; then dispatch one bounded read-only `code-quality-reviewer` against those identities.
- **Evidence:** Focused library passed 150 tests; focused code-quality passed 4 tests; strict library validation reported 29 skills, 18 agents, 409 Markdown files, zero warnings, and two infos; all 11 full-test entry files passed; strict selected OpenSpec validation passed; `git diff --check` was clean. Reviewer session `ses_fff3638adffe9mx21i2ADvWcqi` with effective model `xai/grok-4.6` matched both file SHA-256 identities, reported high confidence for both reductions, retained all four unique oracles, and found no additional in-scope runtime deletion. Exact evidence and rollback are published in `handoff.md`.
- **Outcome:** Task 3.1 validation and review requirements are green on the referenced candidate.
- **Reason:** The candidate delegates to source-equivalent existing owners and preserves the installed runtime outputs and focused test boundary.
- **Do Not Repeat:** Do not rerun the optional reduction reviewer for this unchanged candidate; replay only validation lanes invalidated by a later candidate, runner, evaluator, or environment mutation.
- **Retry Condition:** Rerun affected validation and update Candidate Reference if either Product Candidate file or a directly consumed shared owner changes.

## Deferred Improvement Candidate DIC-1 - Consolidate remaining local `TestCase` aliases

- **Impact Horizon:** Working Repository.
- **Concrete Consumers:** `tools/test-code-quality-inventory.ts` retains a local `TestCase` alias; `tools/test-helpers/library.ts` owns the equivalent shared type; `tools/test-library/inventory.ts` and other `tools/test-library/*.ts` modules already consume that shared owner, while several standalone focused tests retain local aliases.
- **Execution Class:** separate-change.
- **Earliest Safe Point:** A separately scoped test-harness consolidation change, or a future accepted edit that already touches the affected standalone test owners.
- **Invalidated Evidence:** Any implementation would invalidate focused tests for each changed standalone test file and the full test-suite lane; it would not invalidate production instruction-inventory proof.
- **Observable Payback:** One local type alias can be removed from the current focused test, with broader repository payback only if the other evidenced standalone aliases are consolidated under an explicitly accepted scope.
- **Trigger/Evidence:** The read-only reduction reviewer identified the equivalent local alias at `tools/test-code-quality-inventory.ts:15-18`; repository search found the shared owner at `tools/test-helpers/library.ts:13-16`, existing shared consumers, and multiple other standalone local aliases.
- **Why:** The alias is exact type-only duplication, but it is not one of the two accepted runtime/harness concepts and has no remaining consumer needed to complete this change.
- **Prerequisites:** Define the bounded standalone-test owner set and preserve each test entry point without mixing runtime harness behavior.
- **Scope/Non-Goals:** Do not broaden this change, refactor test runners, alter scenario ownership, or treat line-count reduction as behavior proof.
- **Implementation:** In a separate accepted change, import the shared `TestCase` type in the selected standalone test owners and delete only equivalent local aliases.
- **Observable Proof:** The selected focused test entries retain the same scenario counts and outputs.
- **Validation:** Run every changed focused entry point plus `npm test` and `git diff --check`.

## Deferred Improvement Candidate DIC-2 - Reuse portable process capture for inventory proof runners

- **Impact Horizon:** opencode-kit.
- **Concrete Consumers:** The failed baseline evaluators in this change demonstrate the boundary; `openspec/changes/measure-loader-visible-instruction-budget/tasks.md` tasks 1.1, 1.2, and 3.1 require installed inventory calls and immutable proof bundles; existing proof runners such as `tools/proofs/agent-tooling-ergonomics.ts` already consume `global/bin/portable-process.ts::runPortableCommand`.
- **Execution Class:** separate-change.
- **Earliest Safe Point:** Before `measure-loader-visible-instruction-budget` implements its maintained provider-free proof runner, without mutating that change from this completed reduction.
- **Invalidated Evidence:** A runner-only implementation would invalidate only captures driven through that runner; Product Candidate behavior remains valid unless inventory production code also changes. Evaluator-only summary changes require replay against preserved raw stdout/stderr rather than another live effect.
- **Observable Payback:** The next installed inventory proof resolves Windows command shims on its first process attempt, preserves distinct stdout/stderr and exit status, and emits concise hashes/facts to the operator while retaining complete raw evidence in its owned bundle.
- **Trigger/Evidence:** Two Node `spawnSync` baseline attempts failed before inventory execution (`npm` returned undefined streams; `npm.cmd` returned `EINVAL`). Host-native PowerShell then succeeded. Local discovery found the maintained `runPortableCommand` owner at `global/bin/portable-process.ts:51-91`, including the Windows `cmd.exe` path at lines 67-82, and multiple current proof-runner consumers.
- **Why:** Reusing the existing portable owner removes the observed process-resolution retry loop and avoids sending a 530-line JSON inventory to chat when stable facts and hashes suffice, while still preserving raw evidence outside the summary.
- **Prerequisites:** The owning future change must inventory its existing proof tooling, define its raw bundle path and normalization schema, and keep exact argv, stdout, stderr, exit, environment, and cleanup evidence.
- **Scope/Non-Goals:** Do not add another process abstraction, change `runPortableCommand`, retrofit this completed one-shot proof, suppress raw evidence, or mutate `measure-loader-visible-instruction-budget` from this change.
- **Implementation:** In the future inventory proof runner, call the existing `runPortableCommand` with capture enabled, persist complete privacy-safe raw streams in the proof bundle, and derive stable concise hashes and contract facts in a separate evaluator step.
- **Observable Proof:** On Windows, the installed package entry reaches inventory through the portable owner on the first attempt; raw output and concise evaluation agree for success and invalid-root exits, and deterministic replay does not rerun external effects.
- **Validation:** Existing portable-process focused coverage, the future maintained inventory proof over catalog and disposable-consumer lanes, raw-bundle evaluator replay, cleanup verification, and `git diff --check`.

## 2026-08-14 - Final history retrospective (completed once)

**Original User Goal:** Reuse the existing matching production walker and shared focused-test harness while preserving every inventory CLI behavior and unique test oracle.

| Dimension | Working Repository | opencode-kit |
| --- | --- | --- |
| Quality | Evidence: the read-only reviewer found the exact local `TestCase` alias after both accepted runtime concepts were removed. Smallest cheap improvement: DIC-1, separately import the existing shared type only under a bounded standalone-test scope. Expected benefit: remove one type-only duplicate locally and potentially align other explicitly selected standalone tests. Cost/risk: broadening now would violate the two-concept stop line and invalidate extra focused-test lanes. | Evidence: the working repository is opencode-kit, so the same alias inventory supplies no distinct kit-level quality candidate beyond DIC-1. Smallest cheap improvement: none. Expected benefit: none beyond DIC-1. Cost/risk: inventing a second candidate would duplicate scope without new evidence. |
| Cycle Speed | Evidence: two materially similar Node spawn attempts failed before the baseline reached `npm`; host-native PowerShell then succeeded. Smallest cheap improvement: DIC-2, use the existing portable process owner in the next maintained inventory proof runner. Expected benefit: first-attempt Windows package-entry capture. Cost/risk: no remaining current-change consumer, so implementing it here would add proof infrastructure after the boundary is already complete. | Evidence: `runPortableCommand` already handles Windows command shims and is consumed by multiple kit proof runners; `measure-loader-visible-instruction-budget` has exact future installed-inventory proof consumers. Smallest cheap improvement: DIC-2 reuse, not a new abstraction. Expected benefit: avoid the reproduced executable-resolution loop in that owning change. Cost/risk: runner mutation invalidates captures it drives and must remain owned by the future change. |
| Token Economy | Evidence: raw JSON capture produced 530 lines, while normalized hash/fact output proved identity in a few lines. Smallest cheap improvement: the concise evaluator portion of DIC-2, with complete raw streams retained in an owned evidence bundle. Expected benefit: preserve exact evidence without repeatedly placing the complete inventory in operator context. Cost/risk: summaries cannot replace raw evidence and require deterministic readback. | Evidence: no second token-specific mechanism is justified beyond DIC-2 because the same future proof runner owns capture and evaluation. Smallest cheap improvement: none additional. Expected benefit: none beyond DIC-2. Cost/risk: a separate summarization framework would duplicate ownership. |

- **Admitted generated task IDs:** none; every accepted-scope implementation and proof consumer is already complete.
- **Deferred record IDs:** DIC-1 and DIC-2.
- **Result:** No evidence-backed candidate has an exact remaining current-change consumer. No `## Session-Derived Improvements` checkbox is added. This final-history analysis is complete and MUST NOT be rerun after deferred or future work.
