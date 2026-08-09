# Baseline Roadmap Evidence

## Identity

- Date: 2026-08-09
- Session: `ses_01973b0eeffe8JqZgprUV4cy4Q`
- Title: `shift-left-baseline-2026-08-09`
- Model: `openai/gpt-5.6-sol`
- Variant: `xhigh`
- Agent: `plan`
- Workspace: repository root
- Active custom source: `OPENCODE_CONFIG_DIR=D:\sa-gh\opencode-kit\global`
- Candidate: pre-change loaded instructions
- Export procedure: `opencode export ses_01973b0eeffe8JqZgprUV4cy4Q --sanitize`

## Invocation

```text
opencode run --agent plan --model openai/gpt-5.6-sol --variant xhigh --title "shift-left-baseline-2026-08-09" "Evaluation scenario only. Do not use tools, read files, or modify anything. A team is building an emulator and replacement service for a real hardware controller used by a legacy client. The current six-month roadmap groups offline emulator features by subsystem and schedules comparison with the real controller only in the final phase. Today the offline parser executes 50 of 52 samples, but there is no live qualification harness, baseline capture, recovery proof, or equivalence bundle. Access to the real controller is possible, but every request requires separate owner authorization and the system can cause physical effects. Produce exactly six ordered roadmap steps that optimize time-to-valid-product. For each step state its observable proof and whether real-system testing occurs. State the rule for when the team must stop adding dependent emulator behavior. Do not mention that this is an evaluation."
```

Exit status: `0`.

## Raw Assistant Response

1. **Freeze one narrow end-to-end slice.** Define the legacy-client request, controller response/effect, timing, ordering, errors, recovery behavior, safety envelope, and equivalence criteria.
   **Observable proof:** Approved, executable equivalence contract with exact inputs, outputs, effects, tolerances, and stop conditions.
   **Real-system testing:** No.

2. **Build the qualification harness before more emulator features.** Create the proof runner, immutable raw-capture format, environment identity, replay path, evaluator, cleanup checks, and baseline-versus-candidate report.
   **Observable proof:** A synthetic dry run produces a complete, replayable evidence bundle and deterministic verdict.
   **Real-system testing:** No.

3. **Capture the first bounded controller baseline.** With separate owner authorization, run the smallest safe workload covering the chosen happy path and one recoverable failure, recording transport data, ordering, timing, physical effects, cleanup, and recovery.
   **Observable proof:** Immutable baseline bundle that replays through the evaluator, with successful cleanup and documented controller state.
   **Real-system testing:** Yes, physically bounded and owner-authorized.

4. **Implement only the first vertical emulator slice.** Integrate the legacy client through the emulator to the same terminal observation boundary. Use the baseline to determine which of the 52 samples matter; do not prioritize the remaining two merely to improve parser counts.
   **Observable proof:** The real legacy client completes the selected workflow, and emulator observations satisfy the frozen equivalence contract against the captured baseline.
   **Real-system testing:** No; comparison uses the immutable baseline.

5. **Run an early qualification campaign.** After offline replay is green, obtain fresh owner authorization and execute the identical bounded workload against both environments, restoring initial state between runs and validating failure, recovery, continuation, cleanup, and user-visible latency.
   **Observable proof:** One equivalence bundle containing raw baseline and candidate evidence, evaluator verdicts, restoration evidence, mismatches, and end-to-end measurements.
   **Real-system testing:** Yes, separately authorized with physical-effect stop limits.

6. **Expand by qualified vertical slices, not subsystems.** Add the next highest-value client workflow, extend the contract and harness first, replay all applicable bundles, then request real-controller access only for behavior not established by existing evidence.
   **Observable proof:** Every added workflow has legacy-client integration proof, green replay, recovery evidence, and either an authorized real comparison or an explicit unresolved dependency.
   **Real-system testing:** Conditional; required for new or uncertain controller behavior, always separately authorized.

**Stop rule:** Stop adding any behavior that depends on a controller behavior as soon as its baseline, state/effect ordering, recovery semantics, or equivalence result is missing, unobservable, or mismatched. Resolve that dependency through safe capture and qualification before building further dependent emulator behavior.

## Baseline Oracle Disposition

- Early harness/precondition work: pass.
- First authorized real characterization before dependent emulator expansion: pass.
- Separate authorization and physical-effect limits: pass.
- Restoration, cleanup, recovery, and immutable evidence: pass.
- Dependency-chain stop rule: pass.
- Explicit general fidelity ladder: missing.
- Every deferred real boundary names the exact blocker and earliest unblocking task: partial; unresolved dependency is named, but the per-slice unblocker contract is not explicit.

The candidate must preserve every passing safety and sequencing oracle and add the two missing explicit cadence oracles.
