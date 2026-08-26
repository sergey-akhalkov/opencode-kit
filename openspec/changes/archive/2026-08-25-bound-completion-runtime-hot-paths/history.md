# Strategy History

## 2026-08-21 - Select boundary-first local bounds

- **Objective:** Prevent one root/database/process from starving shared OpenCode runtime work.
- **Approach:** Consider adding only later projection/request caps, then select query-before-materialization, finite convergence, one process-wide scheduler, and explicit child-process timeouts.
- **Evidence:** Audit traces show full session materialization occurs before request caps, status uses an unbounded loop, arbiter limits are per root, and production sync callers can omit timeouts.
- **Outcome:** Boundary-first bounds selected; output-only caps rejected.
- **Reason:** Later caps do not constrain database, CPU, queue, or hung-process work already incurred.
- **Do-Not-Repeat Condition:** Do not claim the hot paths are bounded solely because final JSON, retry count, or request bytes are finite.
- **Evidence-Based Retry Condition:** Revisit the selected mechanisms only if query-plan/load evidence proves the runtime schema lacks the required index/API or scheduler evidence shows a different bounded owner is necessary.

## 2026-08-23 - Transferred Shared Runtime Ownership To Claim Closure

- **Objective:** Preserve the planned hot-path work while the owner prioritizes universal claim-evidence closure.
- **Approach:** Set this change `mutationEnabled=false` and transfer only `global/plugins` to `enforce-claim-evidence-closure`; retain the bounded-query requirement and all planning artifacts for later resumption.
- **Evidence:** Owner decision on 2026-08-23 requires the claim-evidence change to complete before other active work. Process reconciliation found no non-shell process for this change, and no implementation task has started.
- **Outcome:** Planning-paused with an explicit incoming-owner transfer; no production or evidence bytes changed.
- **Reason:** One current mutation owner prevents runtime proof invalidation while preserving the later performance scope.
- **Do-Not-Repeat Condition:** Do not mutate `global/plugins` or start load evidence while the transferred owner is active.
- **Evidence-Based Retry Condition:** Resume after terminal claim-evidence handoff/archive and explicit ownership transfer back, then recapture query/runtime identities before task 1.1.

## 2026-08-24 - Resume query bounds after claim-evidence archive

- **Objective:** Resume the first unblocked production slice after `enforce-claim-evidence-closure` archived.
- **Approach:** Re-enable mutation for session-delivery and guard write roots, keep roadmap-mission planning-only, and implement indexed root/descendant acquisition without a full session scan.
- **Evidence:** Claim-evidence is archived. Active roadmap write root remains `global/bin/roadmap-mission.ts` and does not overlap. Host OpenCode schema already has `session_parent_idx`.
- **Outcome:** Selected. Production query/projection work proceeds; roadmap timeout tasks stay blocked.
- **Reason:** The pause existed only while claim-evidence owned shared semantics.
- **Do-Not-Repeat Condition:** Do not mutate `global/bin/roadmap-mission.ts` while the mission-runtime change is active.
- **Evidence-Based Retry Condition:** Implement roadmap process bounds only after that change archives or transfers those files.

## 2026-08-24 - Transfer direct OPENCODE_DB discovery for mission closure

- **Objective:** Unblock the active mission-runtime certificate boundary without starting this change's remaining roadmap or integration work.
- **Approach:** Temporarily transfer only `global/plugin/session-delivery-context/index.ts` direct `OPENCODE_DB` discovery to `add-autonomous-roadmap-mission-runtime`; retain bounded query/projection requirements and all other files here.
- **Evidence:** Configured mission capture r10 reached 16 completed model responses and exact task completion, then `captureArbiterEvidence` failed because OpenCode 1.18.22 used inherited `OPENCODE_DB` while delivery-context discovered only data directories. The current host runtime also defines `OPENCODE_DB`.
- **Outcome:** Exact dependency-closure transfer recorded. This change remains 6/11 and does not start task 4.1.
- **Reason:** The first change cannot prove its installed completion certificate while the shared database locator omits OpenCode's active direct database authority.
- **Do-Not-Repeat Condition:** Do not expand this transfer to roadmap timeout files, query semantics, projection caps, or task 4.x implementation.
- **Evidence-Based Retry Condition:** Return the file after the mission-runtime change archives; recapture source identity before resuming this change.

## 2026-08-25 - Resume roadmap process bounds after mission archive

- **Objective:** Resume task 4.1 without overlapping the mission-runtime writer or invalidating its archived evidence.
- **Approach:** Return `global/plugin/session-delivery-context` and roadmap process ownership to this change, classify synchronous commands as inspection, Git mutation, OpenSpec, or validation/finalization, and keep all proof provider-free.
- **Evidence:** `add-autonomous-roadmap-mission-runtime` archived through the deterministic complete-archive helper as `2026-08-25-add-autonomous-roadmap-mission-runtime`; post-archive project validation passed and the active apply gate for this change reports 5/11 tasks open.
- **Outcome:** Exact roadmap and delivery-context ownership is resumed; task 4.1 production work may proceed.
- **Reason:** The recorded archive-before-production-write condition is now terminal.
- **Do-Not-Repeat Condition:** Do not reopen mission-runtime proof or use an unbounded synchronous child command.
- **Evidence-Based Retry Condition:** If a command-class fixture disproves the reviewed defaults or cleanup contract, correct the shared portable-process boundary before integrated proof.

## 2026-08-25 - Bound synchronous command classes and owned process trees

- **Objective:** Complete tasks 4.1 and 4.2 without changing mission verdict or checkpoint semantics.
- **Approach:** Add reviewed inspection, Git mutation, OpenSpec, and validation/finalization timeout classes; allow only a 1..1800 second validation override; route bounded captured commands through one portable supervisor that terminates the exact owned process tree and reports terminal versus unknown cleanup.
- **Evidence:** `evidence/task-4-1-4-2-process-r3/evaluation.json` records all four command classes timing out with `ETIMEDOUT`, terminal parent/descendant cleanup, exact defaults 30/120/120/600 seconds, valid 1-second override, rejection at 999 and 1800001 milliseconds, no retry or mission-state advance, a real cleanup-attestation failure remaining `unknown`, provider calls 0, complete cleanup, and hashes for seven production sources. `evidence/task-4-2-roadmap-controller-r1/{raw,evaluation}.json` records the production controller campaign as terminal `complete` with two archives, bounded retries, source-bound checkpoint behavior, protected successor blocking, and complete cleanup.
- **Outcome:** Tasks 4.1 and 4.2 complete on `bound-completion-runtime-hot-paths-r1`.
- **Reason:** Every maintained synchronous roadmap caller now passes a finite reviewed timeout, timeout cause/argv/status/signal/output are retained, terminal cleanup is attested before return, and cleanup unknown is fail-closed.
- **Do-Not-Repeat Condition:** Do not bypass the supervisor with direct synchronous `spawnSync`, treat direct-child exit as process-tree closure, or retry cleanup-unknown work.
- **Evidence-Based Retry Condition:** Reopen only if integrated or installed proof finds an unclassified synchronous caller, surviving owned descendant, missing timeout cause, or checkpoint advance after timeout.

## 2026-08-25 - Correct referenced supervisor timer

- **Objective:** Close the first source-level roadmap integration attempt without hiding its timeout.
- **Approach:** Inspect exact process liveness and target evidence, identify the losing timeout promise as a referenced event-loop handle, unreference that timer, and rerun only after no matching proof process or disposable fixture remained.
- **Evidence:** The first `bound-completion-runtime-hot-paths-task-4-r1` campaign exceeded the 300-second shell window, wrote no target evidence root, left no matching process, and removed its `roadmap-mission-controller-proof-*` fixture. A bounded successful command then returned in 648 milliseconds after the correction. The current retained `task-4-r3` campaign completed with source hashes and cleanup `complete`.
- **Outcome:** Proof-runner defect corrected; no writer attempt remains open.
- **Reason:** Successful supervisors retained their losing 30/120-second timer, serially delaying the campaign despite terminal children.
- **Do-Not-Repeat Condition:** Do not increase the campaign timeout or repeat the pre-correction supervisor.
- **Evidence-Based Retry Condition:** Revisit only if a successful bounded command again remains alive after its child closes.

## 2026-08-25 - Close provider-free integrated reliability

- **Objective:** Complete task 5.1 on the current production candidate before installed proof.
- **Approach:** Run the maintained integrated large-database, scheduler, cancellation, timeout, cleanup-unknown, and process-tree evaluator with no provider calls.
- **Evidence:** `evidence/task-5-1-integrated-r1/evaluation.json` records 100,004 baseline rows versus 3 indexed candidate rows, heap delta 27,610,984 versus 22,264 bytes, elapsed 1,539 versus 1,073 ms, two active and 32 queued roots, terminal overload/cancellation, all four timeout classes with terminal descendant cleanup, and zero provider calls.
- **Outcome:** Task 5.1 complete on `bound-completion-runtime-hot-paths-r1`.
- **Reason:** The retained exact case establishes measurable query/memory improvement and bounded scheduler/process behavior without external effects.
- **Do-Not-Repeat Condition:** Do not replace indexed root/child lookup with whole-table session materialization or retry cleanup-unknown work.
- **Evidence-Based Retry Condition:** Reopen only if installed or full validation contradicts the retained query plan, scheduler bound, process cleanup, or mission-state oracle.

## 2026-08-25 - Diagnose installed multi-root proof envelope

- **Objective:** Obtain task 5.2 installed evidence without weakening scheduler, cleanup, or host-isolation requirements.
- **Approach:** Start with a 35-root full-drain workload, then add stable proof-listener cleanup and an aggregate-only progress pulse after opaque worker timeouts. A resolver-warmup alternative was also tested once.
- **Evidence:** The positive-control pulse localized the aggregate timeout: installed readiness consumed about 80 seconds, all 35 primary turns completed, two arbiters became active, 32 roots queued, and one root reached terminal overload before the whole-lifecycle 120-second parent limit. `opencode debug config` separately exceeded its 45-second warmup bound with `SIGTERM`. No failed attempt retained an evidence root or proof-owned process.
- **Outcome:** Proof Runner diagnosis complete; no Product Candidate deadlock was observed.
- **Reason:** The harness combined an existing readiness contract of up to 180 seconds with a smaller 120-second whole-worker ceiling and duplicated complete FIFO drain already covered provider-free.
- **Do-Not-Repeat Condition:** Do not retry full installed drain under one aggregate 120-second window, use the failed resolver warmup unchanged, leak a detached listener, or increase one opaque timeout to hide the phase boundary.
- **Evidence-Based Retry Condition:** Use separately enforced readiness/workload windows and retain only the installed saturation, cancellation, queued-healthy, diagnostics, and cleanup observations missing from provider-free proof.

## 2026-08-25 - Close installed multi-root and roadmap smoke proof

- **Objective:** Complete task 5.2 through the loaded OpenCode guard while preserving effect-blocked roadmap evidence and exact candidate semantics.
- **Approach:** Keep the existing 180-second readiness bound and a separate 120-second workload bound; observe full scheduler capacity; cancel 31 queued roots; release the saturated pair; retain one queued healthy root to completion; pair that installed lane with source-current integrated scheduler/process and roadmap-controller bundles.
- **Evidence:** `evidence/task-5-2-installed-guard-r1/{raw,evaluation}.json` records readiness 81,316 ms, workload 33,726 ms, 35 roots, two active, 32 queued, one terminal overload, 31 terminal cancellations, one retained queued healthy pass, maximum two arbiters in flight, zero external calls, and complete cleanup. `evidence/task-5-2-installed-paired-r1/evaluation.json` binds the exact installed case to `task-5-1-integrated-r1` and source-current `task-4-2-roadmap-controller-r1` (14/14 production hashes match). `evidence/task-5-3-summary-r1.md` records before/after metrics and the narrow claim ceiling.
- **Outcome:** Task 5.2 complete on `bound-completion-runtime-hot-paths-r1`.
- **Reason:** The loaded guard proves capacity, overload isolation, explicit cancellation, queued-root progress, bounded startup/workload, diagnostics, and cleanup; provider-free lanes retain complete FIFO/process and roadmap coordination oracles.
- **Do-Not-Repeat Condition:** Do not claim configured-provider population, cross-platform cleanup equivalence, or an installed multi-plugin workload from these exact cases.
- **Evidence-Based Retry Condition:** Reopen only if task 6.1 validation changes a source hash or contradicts a retained installed/provider-free oracle.

## 2026-08-25 - Complete validation

- **Objective:** Close task 6.1 and make the change archive-ready without hiding unrelated failures.
- **Approach:** Run focused plugin, guard, query/scheduler, and portable-process tests; run the full test suite, strict library validation, selected strict OpenSpec validation, and all-item OpenSpec validation.
- **Evidence:** `evidence/task-6-1-validation-r1.md` records 18 plugin, 45 guard, 23 bound-completion, and 9 portable-process focused tests; 19 full test files; strict library validation with 0 warnings; selected strict OpenSpec validation; and all 23 OpenSpec items passing. The first full/strict pass found only trailing whitespace in the new summary; correction and rerun were green.
- **Outcome:** Task 6.1 complete; all 11 tasks are checked.
- **Reason:** Production, installed proof, focused tests, full tests, strict validation, and OpenSpec validation agree on the candidate.
- **Do-Not-Repeat Condition:** Do not archive from the pre-correction formatting failure or omit the evidence-index retention/readback gate.
- **Evidence-Based Retry Condition:** Reopen only if evidence indexing, apply/archive gate, or archive prevalidation reports a current candidate defect.
