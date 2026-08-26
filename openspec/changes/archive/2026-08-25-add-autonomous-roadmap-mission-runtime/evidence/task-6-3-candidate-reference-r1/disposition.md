# Task 6.3 Main Disposition

## Candidate

- Candidate Reference: `add-autonomous-roadmap-mission-runtime-task-6-3-r1`
- Development Stage: `MVP`
- Controller SHA-256: `91dfa43b9994634d5503cc4f82702d8f9201eaa3b3e067ee5003d09e9e360d29`
- Controller-proof SHA-256: `ed5d2cd52a2c8b1b65067a23b43af7fbde6c6864c80bd34a46eecbb0296668c1`
- State SHA-256: `58a99828bd83117a0d9a5f859e2df7f11f5fcf38b5c5bf4057390475ac4094f3`
- Preflight SHA-256: `144d236c7bce3fbc272b94b80ef67be530910067c49f5b177f404a975f534d07`

## RM-WRITER-001

- Invariant: no new writer may start while mission disposition is `paused-unknown`, including when operation metadata is null.
- Main reproduction: with only the correction guard temporarily absent, the maintained provider-free controller proof created a clear stopped state through the production entry point, persisted `paused-unknown` through `recordMissionUnknownPause`, cleared the stop intent, and called production `resume`. The proof failed with `Paused-unknown resume did not fail closed before executor launch`; controller output reported `attempts: 1`, and process evidence recorded `node tools/executor.mjs ...` exiting `0`.
- Classification: reproduced non-deferrable writer-liveness defect.
- Correction: `global/bin/roadmap-mission/controller.ts` now rejects every `paused-unknown` projection after replay/readback and before preflight, lease acquisition, or executor launch. Existing rejection for non-null active operations remains unchanged.
- Regression oracle: `tools/proofs/roadmap-mission-controller.ts` constructs the state through production stop/reconciliation APIs and requires nonzero resume, the owning diagnostic, no executor-count file, and unchanged transition digest.
- Current proof: `evidence/task-6-3-controller-fixed-r1/evaluation.json` is `complete`, cleanup is `complete`, and `pausedUnknownResume` is `blocked-before-executor`. Raw evidence records `activeOperation=null`, `disposition=paused-unknown`, `executorStarted=false`, `exitCode=1`, and `stateUnchanged=true`.
- Offline evaluator: `evidence/task-6-3-controller-fixed-replay-r1/evaluation.json` is `complete` with `liveCalls=0`.
- Disposition: corrected and re-proven at the affected actual provider-free controller boundary.

## Corrected-Candidate SDET

`evidence/task-6-3-sdet-r1/report.md` records the required fresh corrected-candidate SDET as terminal `blocked`: its shell was unavailable, it made no edits, created no fixture, and returned no critical matrix. The unchanged corrected candidate receives no equivalent verdict-seeking SDET rerun.

## Residual Source Questions

| Question | Main disposition |
|---|---|
| Launcher starts a controller PTY before the guard | Not a mutation-authority escape. Both `run` and `resume` reach the shared guard before preflight, writer lease, executor, or archive work; the current proof observes no executor and unchanged state. |
| Hard-kill unknown-pause recording can fail | Contained fail-closed path. The launcher sets reconciliation to `blocked`; an existing active operation remains rejected by the controller. No evidence supports a new writer from that failure path. |
| Restart reconciliation preserves `paused-unknown` | Availability limitation only at this boundary. The preserved disposition continues to hit the shared guard and cannot start an executor. |

No additional reachable critical or non-deferrable row remains known after the correction. Independent SDET runtime execution remains unavailable, so task 7.1 must not infer a `no-critical-risk` SDET verdict or freeze an RC solely from this disposition.
