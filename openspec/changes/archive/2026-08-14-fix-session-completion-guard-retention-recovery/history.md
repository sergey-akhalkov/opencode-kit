# Strategy History

## 2026-08-14 - Preserved production-log diagnosis

- **Objective:** Identify why the completion guard emits the same `input-state` toast whenever this project opens.
- **Approach:** Trace the toast text to its owning plugin, inspect its error classification and startup reconciliation, then correlate the hashed root reference with preserved OpenCode logs and retained-child lifecycle code.
- **Evidence:** `opencode.log` repeatedly records `Retained completion arbiter child limit reached with no eligible terminal child` for root ref `session_229ed091dd35`. Two guard-owned children were created with metadata status `auditing`; the newer provider process ended `Aborted`. Configuration limits retained audit sessions to two, and current retention accepts only explicitly terminal idle children.
- **Outcome:** Root cause confirmed without mutating source or session state. Startup reconciliation schedules the persisted grind-enabled root, but neither interrupted child can become terminal, so every new epoch fails before child creation.
- **Reason:** The retained-child owner has no bounded transition from old, explicitly idle interrupted `auditing` metadata to terminal `stale`.
- **Do-Not-Repeat Condition:** Do not investigate provider routing, prompt shape, or retry count as the primary cause while the exact retention conflict remains reproducible.
- **Evidence-Based Retry Condition:** Revisit this diagnosis only if a corrected candidate still emits the same error while fewer than two exact-root guard children exist or while an eligible terminal idle child is present.

## 2026-08-14 - Provider-free retention baseline

- **Objective:** Reproduce the exact retention deadlock before production mutation and bound protected negative controls.
- **Approach:** Add a maintained provider-free proof runner that invokes the real retained-child owner with synthetic in-memory SDK state for old-idle, busy, unknown, recent, current, ownership-invalid, and unrelated children.
- **Evidence:** `npm run proof:guard-retention-recovery -- --mode baseline --candidate-id baseline-b8bb815-r1 --evidence-root .../evidence/baseline-r1` exited zero. `raw.json` records the exact retention error and zero updates/deletes/creates for old-idle, busy, unknown, recent, and ownership controls; only the current epoch received its existing scoped `auditing` metadata refresh. `evaluation.json` is `passed`, production hashes are captured, and cleanup is complete.
- **Outcome:** The preserved component baseline matches the production log and proves the protected controls before mutation.
- **Reason:** The runner supplies the smallest deterministic real-module boundary while avoiding providers and live session state.
- **Do-Not-Repeat Condition:** Do not rerun baseline against a product-mutated candidate; the immutable R1 bundle owns the pre-fix facts.
- **Evidence-Based Retry Condition:** Create a new baseline bundle only if the original source hash or runner facts are unreadable or the accepted failure scenario changes.

## 2026-08-14 - Timeout-aged idle quarantine component correction

- **Objective:** Restore retention progress without deleting active, unknown, current, recent, foreign, or unrelated children.
- **Approach:** Reuse the existing retained-child owner. When terminal children cannot free enough slots, select only timeout-aged exact-root `auditing` children with explicit idle status, re-fetch child metadata and runtime status, mark the minimum required oldest candidates terminal `stale`, then use the unchanged terminal rotation path.
- **Evidence:** `npm run proof:guard-retention-recovery -- --mode candidate --candidate-id candidate-working-r1 --evidence-root .../evidence/candidate-component-r1` exited zero. The old-idle scenario records one `stale` update, deletion of only the oldest eligible child, and one replacement creation. Busy, unknown, recent, ownership-invalid, and unrelated controls record no mutation; the current epoch is reused. Serena reports no diagnostics in the two production files.
- **Outcome:** Component candidate recovered the exact deadlock while preserving every specified fail-closed boundary. Product mutation invalidates runtime proof and remains `development` until the loaded-plugin lane passes.
- **Reason:** Timeout age plus immediate status/ownership rechecks are the smallest available cross-process race guard without adding a lease service or configuration surface.
- **Do-Not-Repeat Condition:** Do not broaden eligibility to all idle `auditing` children or direct-delete non-terminal children.
- **Evidence-Based Retry Condition:** Change the quarantine predicate only if the loaded-plugin lane proves an exact runtime field or timing assumption differs from the component boundary.

## 2026-08-14 - Loaded restart with never-run child seeds

- **Objective:** Prove retention recovery through the installed OpenCode loader and two persisted restarts.
- **Approach:** Seed two guard-owned child records with `auditing` metadata under a disabled disposable root, enable the root immediately before shutdown, then load the corrected plugin after the timeout grace.
- **Evidence:** `candidate-working-retention-r1` exited `1`. Server 2 reached `Retained completion arbiter child limit reached with no eligible terminal child`; the local simulator received zero calls. Cleanup completed. Preserved summary: `evidence/candidate-runtime-r1-failure.md`.
- **Outcome:** Runtime proof failed before quarantine. The candidate correctly remained fail-closed, but the fixture did not establish explicit idle status for never-prompted child records.
- **Reason:** Production incidents involved child sessions that had run provider prompts; the R1 fixture created metadata-only sessions. The real status API did not make those seed records eligible under the explicit-idle contract.
- **Do-Not-Repeat Condition:** Do not retry with metadata-only child records or weaken unknown status to idle.
- **Evidence-Based Retry Condition:** Drive each seed child through a completed local simulator prompt and assert explicit idle status before enabling/restarting the root; preserve that status in R2 raw evidence.

## 2026-08-14 - Loaded status-semantics capture

- **Objective:** Acquire the exact missing idle-status observation without attempting retention recovery.
- **Approach:** Drive both interrupted child seeds through completed local simulator prompts, query the actual installed `session.status` endpoint, and stop before enabling the root.
- **Evidence:** `candidate-working-status-r2` exited `1` only because the old evaluator required explicit map entries. Both prompts completed (`primaryCalls=2`), but both ids were absent from the status map. Current OpenCode `v1.18.18` source confirms idle is represented by deletion from the listed active-status map and `get` maps absence to idle. Preserved summary: `evidence/candidate-runtime-status-r2-failure.md`.
- **Outcome:** The missing runtime fact is resolved: map absence is canonical idle for a successfully re-fetched session. The SDK endpoint description is misleading for list semantics.
- **Reason:** The guard and proof mocks incorrectly treated absence as unknown, making real terminal rotation and interrupted recovery unreachable.
- **Do-Not-Repeat Condition:** Do not require an explicit `idle` list entry and do not repeat another runtime capture before correcting the production/mock interpretation.
- **Evidence-Based Retry Condition:** Replay only after production accepts absent-from-active-map as idle behind successful child re-fetch, timeout-plus-settle age, exact ownership/non-current checks, and status-request failure remains terminal.

## 2026-08-14 - Canonical idle component correction

- **Objective:** Align retention liveness with the observed and source-verified OpenCode status-list contract while preserving unknown-state safety.
- **Approach:** Treat an existing re-fetched child absent from a successfully read active-status map as idle, retain explicit idle compatibility, block explicit busy/retry and status-request failure, and expand stale age to prompt timeout plus `max(settleMs, 1000)`.
- **Evidence:** `candidate-status-semantics-r2` component evidence is green at `evidence/candidate-component-r2`. Old absent-idle children rotate through `stale`; busy, recent, current, foreign, and unrelated controls are preserved; a failed status request returns its owning error with zero mutation. Strict OpenSpec validation and production-file diagnostics are green.
- **Outcome:** The corrected component now models the actual runtime contract and restores both interrupted and already-terminal retention eligibility. Product mutation invalidates the prior loaded lane and remains `development`.
- **Reason:** Runtime source and two completed prompt captures prove absence is idle, while request failure remains the actual unknown condition.
- **Do-Not-Repeat Condition:** Do not restore explicit-entry-only idle checks or reinterpret a failed status request as idle.
- **Evidence-Based Retry Condition:** Change this interpretation only if a newer selected runtime source and loaded capture both demonstrate different status-list semantics.

## 2026-08-14 - Full loaded-retention attempt unlock

- **Objective:** Establish whether another full loaded restart attempt can now reach beyond the prior retention failure.
- **Approach:** Replay the corrected component corpus, then run a capture-only installed-server lane that creates two realistically prompted interrupted children and terminates before root enablement.
- **Evidence:** Preserved failures are `candidate-runtime-r1-failure.md` and `candidate-runtime-status-r2-failure.md`. Component replay `candidate-component-r2` is terminal green. Installed capture `candidate-runtime-status-r3` records OpenCode `1.18.18`, two completed local primary calls, both seed ids as `absent-idle`, zero arbiter calls, complete cleanup, and a green offline evaluation.
- **Outcome:** Live-attempt gate is clear for one full local effect-free retention/restart attempt. The corrected predicate now receives the exact runtime representation that blocked R1.
- **Reason:** The causal mechanism changed from explicit-entry idle to source-verified absent-from-active-map idle, while status-request failure and active entries remain protected.
- **Do-Not-Repeat Condition:** Do not run another full retention attempt if R4 fails in the same corrected predicate/evaluator chain without first replaying its preserved raw bundle through terminal evaluation.
- **Evidence-Based Retry Condition:** R4 is unlocked once because component replay and capture-only runtime semantics are both green; any later retry requires a new causal correction and preserved-corpus replay.

## 2026-08-14 - Loaded retention recovery with invalid single-call oracle

- **Objective:** Prove old-idle recovery and a second repeat-safe loaded restart.
- **Approach:** Run the corrected full retention scenario with two realistically prompted interrupted children, finite limit two, unrelated child, local simulator, and three OpenCode process lifetimes.
- **Evidence:** R4 reached `passed` after recovery, retained exactly two guard children, left exactly one original interrupted child, created a passed replacement, and preserved the unrelated child. The runner then failed before the third process because it required exactly one arbiter call; the proof-only 200 ms prompt timeout caused one supported transient retry (`arbiterCalls=2`). Cleanup completed. Preserved partial raw/evaluation: `evidence/candidate-runtime-r4-partial/`.
- **Outcome:** Product recovery boundary passed; repeat-restart boundary was not reached. Failure is an evaluator/runner-envelope defect, not a product failure.
- **Reason:** Exact provider-call cardinality is not an accepted retention invariant, and 200 ms is below observed cold loaded-plugin completion latency.
- **Do-Not-Repeat Condition:** Do not rerun with 200 ms timeout or an exact-one-call oracle; do not claim full runtime proof from the partial bundle.
- **Evidence-Based Retry Condition:** Offline replay must confirm all reachable recovery assertions and cleanup are green, then the runner may use a 2000 ms proof timeout, sufficient age wait, and require only that each loaded audit makes forward provider progress before checking terminal root state.

## 2026-08-14 - R5 loaded-retention unlock

- **Objective:** Verify the partial R4 corpus through its terminal reachable boundary before another loaded attempt.
- **Approach:** Parse the preserved R4 raw/evaluation without live effects and assert cleanup, passed recovery state, finite capacity, one rotated interrupted child, passed replacement, unrelated preservation, and the explicitly not-reached repeat boundary.
- **Evidence:** Offline replay exited zero with `status=replay-passed`, `recoveryBoundary=passed`, `repeatRestartBoundary=not-reached`, and `cleanup=complete`. Runner help exits zero after the proof timeout/oracle correction.
- **Outcome:** R5 is unlocked to exercise only the previously unreachable repeat-restart boundary; no prior live effect is repeated for diagnosis.
- **Reason:** The runner now removes the unrelated single-call oracle and uses a 2000 ms local timeout plus sufficient age wait, while product code is unchanged from the R4 recovery pass.
- **Do-Not-Repeat Condition:** Do not run R6 through this path after another evidence-only failure until R4 and R5 bundles replay through every reachable terminal evaluator stage.
- **Evidence-Based Retry Condition:** One R5 attempt is allowed because R4's product recovery and offline replay are green and only the repeat-restart boundary remains unobserved.

## 2026-08-14 - R5 supervisor timeout with unbounded SDK request

- **Objective:** Reach the repeat-restart boundary with corrected proof timeout and forward-progress oracle.
- **Approach:** Run the full isolated three-process retention scenario after R4 offline replay.
- **Evidence:** The runner emitted `retention-server-1-ready` and `retention-server-2-ready`, then the supervisor terminated it at 120000 ms. No worker bundle was published. Post-run checks prove fixture removal and no remaining proof process. Preserved summary: `evidence/candidate-runtime-r5-failure.md`.
- **Outcome:** R5 product state is unknown; repeat restart remains unproved. The full live path is blocked pending a different diagnostic mechanism.
- **Reason:** Loop deadlines did not bound individual SDK requests, graceful-stop fallback was incomplete, and failure evidence was published only after successful terminal assertions.
- **Do-Not-Repeat Condition:** Do not run the same full scenario with unbounded requests or no failure bundle; do not infer product failure from the supervisor timeout.
- **Evidence-Based Retry Condition:** Bound SDK requests, force-stop stalled proof servers, add stage markers around recovery and verification, publish cleanup-updated failure facts, and run one bounded diagnostic capture before any further full proof.

## 2026-08-14 - R6 diagnostic timeout before first stage

- **Objective:** Capture the first loaded recovery with bounded operational diagnostics after R5.
- **Approach:** Stop after server 2 recovery and use the newly bounded guard/status/cleanup requests plus failure-bundle path.
- **Evidence:** The supervisor reached 120000 ms without any worker stage. Post-run checks prove no fixture/evidence directory and no correlated process. Preserved summary: `evidence/candidate-runtime-diagnostic-r6-failure.md`.
- **Outcome:** No product boundary was reached. The remaining hang is localized before `retention-server-1-ready`.
- **Reason:** `startOpenCode` readiness still used a direct unbounded SDK request, outside the timeout wrapper and before run-level failure publication could record server logs.
- **Do-Not-Repeat Condition:** Do not launch another server scenario with unbounded readiness or deadline cleanup that only calls `child.kill()`.
- **Evidence-Based Retry Condition:** Wrap readiness requests with the bounded helper, force-stop on readiness deadline, run provider-free help/static checks, then one fresh capture may verify startup and publish either raw success or bounded failure evidence.

## 2026-08-14 - R7 bounded startup capture

- **Objective:** Verify that the corrected runner can start and publish bounded facts before any retention mutation.
- **Approach:** Run only `retention-preflight` with bounded readiness and operation requests.
- **Evidence:** The worker reached `retention-server-1-ready` and then published `failure.json`: `retention root create timed out after 5000ms`, zero provider calls, startup log still inside instance/config bootstrap, cleanup complete. Offline replay confirmed the product boundary was not reached and all facts/cleanup correlate. Bundle: `evidence/candidate-runtime-startup-r7/`.
- **Outcome:** Failure capture and cleanup now work. The shallow agent-list readiness check returned before the session instance finished bootstrapping.
- **Reason:** The generic 5000 ms operation bound started while the first session request was still performing cold instance/config initialization.
- **Do-Not-Repeat Condition:** Do not use agent-list alone as server readiness or a 5000 ms bound for the first session operation.
- **Evidence-Based Retry Condition:** Read `session.status` through a 15000 ms bound before declaring readiness, allow 15000 ms for bounded session operations, preserve the 30000 ms overall readiness deadline, and replay help/static checks before one new preflight capture.

## 2026-08-14 - R8 startup-capture unlock

- **Objective:** Confirm the next startup capture uses a causally different readiness boundary.
- **Approach:** Add bounded session-status readiness after agent readiness, increase only proof operation bounds to 15000 ms, and retain forced shutdown plus immutable failure publication.
- **Evidence:** R7 offline replay is terminal green for its reachable failure path; no fixture/process remains. Production code and prior component/runtime recovery evidence are unchanged.
- **Outcome:** One R8 preflight capture is unlocked. It may prove only startup, canonical idle seed status, and cleanup.
- **Reason:** Session-status readiness forces the same instance/bootstrap path needed by root creation instead of relying on an unrelated loaded agent list.
- **Do-Not-Repeat Condition:** Do not proceed to retention recovery if R8 is red or cleanup is unknown.
- **Evidence-Based Retry Condition:** A green R8 raw/evaluation bundle with canonical idle seeds and complete cleanup unlocks the previously required one-recovery diagnostic lane.

## 2026-08-14 - R8 startup and seed capture passed

- **Objective:** Validate the corrected cold-start readiness and canonical idle fixture before retention mutation.
- **Approach:** Run the installed-server `retention-preflight` lane with session-status readiness and bounded operations.
- **Evidence:** `evidence/candidate-runtime-startup-r8/` records OpenCode `1.18.18`, two completed local primary calls, both interrupted seeds as `absent-idle`, zero arbiter calls, green offline evaluation, complete cleanup, and no remaining fixture.
- **Outcome:** Startup/seed capture is terminal green. One `retention-recovery` diagnostic is unlocked; full repeat proof remains blocked until that lane passes.
- **Reason:** The readiness boundary now exercises the same session instance needed by subsequent API operations.
- **Do-Not-Repeat Condition:** Do not rerun startup capture unless the runner startup/readiness code or environment identity changes.
- **Evidence-Based Retry Condition:** Run one bounded recovery capture; proceed to full repeat proof only if it reaches passed, finite capacity two, one interrupted child remaining, unrelated preservation, no original retention error, and complete cleanup.

## 2026-08-14 - R9 loaded recovery capture passed

- **Objective:** Re-prove the exact retention recovery boundary with bounded requests and immutable diagnostics before a repeat restart.
- **Approach:** Run `retention-recovery` through two installed OpenCode process lifetimes and stop before server 3.
- **Evidence:** `evidence/candidate-runtime-recovery-r9/` records one arbiter call, root `passed`, exactly two guard children, exactly one original interrupted child remaining, unrelated child preserved, no original retention error in either server log, green evaluation, complete cleanup, and no fixture.
- **Outcome:** Recovery is current and terminal green. The full R10 repeat-restart attempt is unlocked to exercise only server 3 and verify the issue does not recur.
- **Reason:** R9 satisfies every R8 unlock condition with the corrected runner and unchanged production candidate.
- **Do-Not-Repeat Condition:** Do not repeat recovery-only capture unless production code, runtime identity, or its runner boundary changes.
- **Evidence-Based Retry Condition:** Run one full three-process lane; any failure requires preserving/replaying its now-bounded raw or failure bundle before another live attempt.

## 2026-08-14 - R10 repeat-safe loaded runtime proof passed

- **Objective:** Prove the original retention failure does not recur on the next project load.
- **Approach:** Run the full isolated three-process lane with realistically prompted interrupted children, finite capacity two, unrelated child, corrected production source, bounded SDK operations, and local effect-free simulator.
- **Evidence:** `evidence/candidate-runtime-repeat-r10/` records OpenCode `1.18.18`, both seeds as `absent-idle`, recovery and verification root states `passed`, guard-child count exactly two after each load, exactly one interrupted child after first recovery, unrelated preservation after both loads, two arbiter calls total, no original retention error in any of three server logs, green evaluator, complete cleanup, no fixture, and no correlated process.
- **Outcome:** Current production candidate has representative loaded-plugin Runtime Proof and reaches `MVP`. The affected local root repair remains accepted scope before SDET/qualification.
- **Reason:** The proof now exercises the exact persisted restart and retention boundary that caused the user's repeated banner.
- **Do-Not-Repeat Condition:** Do not rerun disposable full proof unless production behavior, loaded runtime identity, or the driven boundary changes.
- **Evidence-Based Retry Condition:** A later run is required only after a dependent product/runner/environment mutation invalidates this lane.

## 2026-08-14 - Affected local root repaired and reload verified

- **Objective:** Eliminate the user's recurring project-entry banner in the actual local session store without changing unrelated sessions.
- **Approach:** Capture a privacy-safe read-only database inventory, start one current-source OpenCode server against the actual local store, bootstrap the lazy project instance through read-only `session.status`, wait for the affected root to pass, stop it, then repeat the same project load once and compare state/log/session counts.
- **Evidence:** `local-repair-before.json` records root `error`, one `passed` plus one `auditing` guard child, directory/project counts 683/704, and 13 strict matching historical errors. `local-repair-after.json` records two consecutive loaded runs reaching `passed`, no matching error in either process output, strict historical error count still 13, counts still 683/704, and both servers closed by Ctrl+C. The final child set is one old `auditing` plus one current `passed`; finite rotation is therefore available on every load, while the two-interrupted fallback is independently proven by R10.
- **Outcome:** Accepted local repair scope is complete. No unrelated session-count change or new retention failure was observed.
- **Reason:** The corrected runtime interprets absent active status canonically, rotates an eligible terminal child immediately, and retains the old interrupted child until rotation actually requires quarantining it.
- **Do-Not-Repeat Condition:** Do not manually delete the remaining interrupted child or rerun the local repair absent a new product mutation or reproduced banner.
- **Evidence-Based Retry Condition:** Reopen only if the strict error count increases for this root or a future loaded root returns to the same retention error.

## 2026-08-14 - Terminal fresh critical SDET

- **Objective:** Independently challenge reachable ownership/data-loss/restart-loop incidents after current Runtime Proof and accepted-scope completion.
- **Approach:** Dispatch fresh test-only `sdet-quality-engineer` session `ses_fff8e95b1ffeO5iaJ35XdcunZJ` against exact production hashes, with write scope limited to `tools/test-session-completion-guard.ts`.
- **Evidence:** Effective Model `xai/grok-4.6`; terminal `Action: no-critical-risk`; no critical risk rows. SDET added two focused oracles: old absent-idle rotation preserves foreign/unrelated ownership and marks stale before deletion; a child becoming busy on immediate re-check is preserved while the still-idle sibling rotates. SDET and main each ran `npm run test:focused:session-completion-guard`; main result: exit 0, `OK: session completion guard tests=30`. Production hashes remained `ced226bd...` and `977dc201...`.
- **Outcome:** Critical SDET terminal state is `no-critical-risk`; by root policy no further SDET attempt is permitted or required. No confirmed critical/non-deferrable defect remains.
- **Reason:** The independent highest-value oracles directly cover the destructive ownership boundary that component/runtime proof alone could miss.
- **Do-Not-Repeat Condition:** Do not launch another SDET for this root absent an invalid-order finding; non-critical coverage ideas do not reopen it.
- **Evidence-Based Retry Condition:** None; the first precondition-valid attempt had no main-confirmed critical defect and permanently terminates SDET for this root.

## 2026-08-14 - Complete validation and code-health disposition

- **Objective:** Qualify the current candidate without regressing existing retry, long-run, loader, or repository behavior.
- **Approach:** Run focused and complete tests, strict/project-native validators, all OpenSpec validation, old retry restart proof, long-run proof, loader/source diagnostics, deterministic code-quality inventory, and one read-only reduction review.
- **Evidence:** `npm run test:focused:session-completion-guard` -> `OK: ... tests=30`; `npm test` -> 11 suites green; `npm run validate:strict` -> `warnings=0`; `npm run prepush:validate` -> passed repository validation/tests and OpenSpec `16 passed, 0 failed`; strict scoped OpenSpec -> valid. `candidate-retry-final-r1` preserves same child/audit and attempt 1 -> 2; `candidate-long-run-final-r1` preserves overflow, terminal retention, retry conflict, fallback, and wait policies; both clean up. `npm run opencode:sources` identifies the guard origin as `global/extensions/session-completion-guard.ts` with finite limits. No PTY remains after cleanup.
- **Outcome:** Validation is green and no known reachable critical/non-deferrable defect remains. RC freeze waits only for the mandatory final history retrospective and its document-only validation.
- **Reason:** Compatibility proof directly covers the existing bounded-retry path most likely to be affected by the added grace argument.
- **Do-Not-Repeat Condition:** Do not rerun behavior validation absent product/runner/environment mutation; test-only SDET additions were included in the complete suite and do not invalidate Runtime Proof.
- **Evidence-Based Retry Condition:** Repeat only the lane invalidated by a later mutation.

### Code Health Disposition

- **Inventory:** `tools/proofs/session-completion-guard-restart.ts` is 903 lines and crossed the split-candidate band in this change; `controller.ts` and the guard test were already split-candidates.
- **Split-or-justify:** Keep the restart runner cohesive. Its four modes are sequential fidelity rungs with one process/config/simulator/cleanup/evaluator owner; splitting adds a file/concept and does not remove behavior. Prefix modes own preserved failure/status/recovery replay and are not dead. The controller change adds no responsibility. The SDET additions remain in the existing cohesive flat guard suite; main will not mutate terminal SDET tests.
- **Reduction review:** Read-only `code-quality-reviewer` session `ses_fff82137effekX28IjW7OO0DGS`, Effective Model `xai/grok-4.6`, returned `Reduction Matrix: none`. It identified no safe deletion/reuse and required retention of the two critical SDET oracles plus component, repeat-runtime, retry, and long-run lanes.
- **Code Health Delta:** Neutral for production ownership; proof navigation grows but is justified by retained bounded diagnostics and cleanup rather than duplicate capability.

## Final History Retrospective

- **Original User Goal:** Fix the repeated `Session completion guard` / `Completion audit stopped (input-state)` project-entry message, ensure it cannot recur under the same retention/restart conditions, and preserve all existing functionality.
- **Analysis Scope:** Complete strategy history, production candidate, proof/evaluator bundles, affected local-state repair, terminal SDET, compatibility validation, and code-health disposition.

| Improvement Dimension | Working Repository | opencode-kit |
|---|---|---|
| Quality | none | none |
| Cycle Speed | none | none |
| Token Economy | none | none |

- **Analysis Result:** Every evidence-backed current-goal improvement discovered in history was already implemented and consumed before this retrospective: canonical idle semantics, timeout-plus-settle safety, bounded proof requests, session-instance readiness, staged preflight/recovery modes, failure bundles, forced cleanup, focused critical tests, and compatibility proofs. No exact remaining current-change consumer exists.
- **Admitted Session-Derived Improvements:** none.
- **Deferred Improvement Candidates:** none. The large proof/test/controller files were reviewed; no evidence-backed net reduction or separate current-goal consumer passed the admission/deferral contract.
- **Generated Task IDs:** none.
- **Invalidated Evidence:** none; this retrospective changes only history interpretation and task bookkeeping.
- **Observable Payback:** All accepted behavior and qualification gates remain represented by current immutable evidence without adding optional work.
- **Rerun Rule:** This is the single final-history retrospective for the change. Apply, archive, compaction, and generated tasks must not rerun it or create a successor analysis.

## RC1 Stable Handoff

- **Profile:** Material.
- **Outcome:** Working. Interrupted/terminal retained children no longer deadlock a finite guard slot under OpenCode's active-only status map, and the affected local root survives a repeat project load without a new banner.
- **Scope / Non-Goals:** Exact local retained-child recovery only. No model routing, public API, retention limit, grind enablement, unrelated session, install, release, or remote-state semantics changed.
- **Product Candidate:** `arbiter-child.ts` SHA-256 `ced226bd4ae1c7809e721bf458f1ee1b7d30eef047bf18382fb6f9e2eb6ae030`; `controller.ts` SHA-256 `977dc201a073a557510f447d20a6cf2e8194495edef127c4b2b54532970bc0cf`.
- **Proof / Test Candidate:** component runner SHA-256 `1bbc6eb0ed61bef3268bcd8a2984af3e7c77954e382830d8170edf22a3f8a164`; restart runner SHA-256 `1664f591c3a6464e316fae2c0a1c92aa347120810dde42978472e32444c7d538`; guard test SHA-256 `754ebd2c83b63b4c34a716ce1df5de67751f8bf02be4e5368155c1ca14a48b11`.
- **Runtime Proof:** `candidate-runtime-repeat-r10` on OpenCode 1.18.18/Windows completed three loaded process lifetimes, two canonical-idle interrupted seeds, finite capacity two, recovery and verification `passed`, unrelated preservation, zero original retention errors, and complete cleanup. `local-repair-after.json` records two passed loads of root ref `session_229ed091dd35`, unchanged strict historical error count 13, and unchanged directory/project session counts 683/704.
- **Compatibility Proof:** `candidate-retry-final-r1` preserves same child/audit bounded retry attempt 1 -> 2; `candidate-long-run-final-r1` preserves overflow, terminal rotation, retry conflict, fallback, and wait policies.
- **Critical SDET:** Terminal `no-critical-risk`; no confirmed critical corrections. Two focused destructive-boundary regression oracles retained; main rerun passed 30 tests.
- **Validation:** Focused guard tests, complete `npm test`, `validate:strict`, scoped strict OpenSpec, `prepush:validate`, OpenSpec all 16/16, loader/source diagnostics, diff check, code-quality inventory, and read-only reduction disposition are green.
- **Architecture / Diagnostics:** Retention remains in its existing child-lifecycle owner; controller adds only grace calculation. Failed child/status reads preserve causes; runtime owns one structured terminal log. Restart proof runner is a justified cohesive split-candidate with bounded requests, stage diagnostics, failure bundles, forced cleanup, and replayable evaluators.
- **Known Non-Critical Limitations:** One historical `auditing` child remains intentionally until rotation needs its slot; a terminal `passed` child keeps the root recoverable. Current semantics are proven on OpenCode 1.18.18; explicit future `idle` entries remain supported. No optional code reduction was safe.
- **Rollback / Disable:** Source rollback would reintroduce the active-map absence bug and is not a safe operational rollback while grind remains enabled. Emergency containment is to disable grind for the affected root or disable the guard explicitly, accepting loss of unattended completion auditing.
- **Live-Attempt Gate:** clear. R10 and local repeat-load evidence are terminal green; all proof/local processes and fixtures are closed.
- **RC History:** RC1 is the first and only frozen candidate for this root.
- **External Operations:** No commit, push, install, deployment, release, publication, credential change, or remote repository mutation performed. Configured model calls were bounded to disposable proof and the requested local repair.
- **Development-Stage:** stable.
- **Stable Candidate:** RC1.

## Post-Handoff Archive Attempt

- **Objective:** Deterministically synchronize and archive the completed RC1 change at the owner's request.
- **Approach:** Run `global/bin/openspec-archive.ts` with trusted aggregate validation `npm run prepush:validate`.
- **Evidence:** Completion gate passed with 4 artifacts and 7/7 tasks; strict scoped OpenSpec validation passed. Pre-archive project validation exited `1` because concurrent unrelated doctor changes import `tools/opencode-runtime-sources.ts` but the doctor test fixtures do not copy that module, producing 36 `ERR_MODULE_NOT_FOUND` failures. Full raw output was inspected in the local OpenCode tool-output store; its machine-local path is intentionally omitted from repository evidence.
- **Outcome:** Archive helper stopped before mutation. The active change still exists, no dated archive path exists, and the main spec was not synchronized.
- **Reason:** Current aggregate project validation is red from unrelated in-progress work; archive cannot waive or narrow that gate autonomously.
- **Do-Not-Repeat Condition:** Do not rerun archive while `npm run prepush:validate` fails in the same unrelated doctor fixture chain.
- **Evidence-Based Retry Condition:** Retry the same deterministic archive command only after the parallel doctor work reaches terminal ownership and `npm run prepush:validate` is green, or after the owner explicitly authorizes this session to take over that unrelated repair.
