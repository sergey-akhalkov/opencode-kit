# Candidate Roadmap Attempt 3

## Identity

- Date: 2026-08-09
- Session: `ses_01961f60affeVTizBrwgcml7D2`
- Title: `shift-left-candidate-3-2026-08-09`
- Model: `openai/gpt-5.6-sol`
- Variant: `xhigh`
- Agent: `plan`
- Prompt, workspace, and active config: identical to `baseline-roadmap.md`
- Candidate: final normative roadmap-rendering candidate
- Exit status: `0`
- Export procedure: `opencode export ses_01961f60affeVTizBrwgcml7D2 --sanitize`

## Raw Assistant Response

Fidelity ladder: preserved replay -> local client integration -> effect-blocked/read-only controller access -> bounded authorized physical effects -> end-to-end legacy-client workflow.

1. **Define the first valid vertical slice.** Specify the exact legacy-client request, controller response, state transition, timing, error behavior, recovery expectation, and permitted physical effects. Build the proof runner and evaluator around the 52 preserved samples. **Observable proof:** an immutable dry-run bundle identifies the current 50 passes and two failures without contacting hardware. **Real-system testing:** No.

2. **Capture a real baseline immediately.** Exercise only the smallest representative request set for the first slice. Obtain separate owner authorization for every request; record controller identity, initial state, bytes, timing, outputs, physical effects, terminal state, and cleanup. Prefer independently effect-blocked or read-only access; otherwise use an approved safe fixture and bounded effects. **Observable proof:** immutable baseline bundles with exact invocations, raw observations, authorization, and verified restoration. **Real-system testing:** Yes.

3. **Make offline replay match observed semantics.** Correct the parser and minimum emulator behavior using the captured baseline, including the two failing samples when they are inside the enforced operating envelope. Replay evidence rather than making another live attempt. **Observable proof:** all in-envelope samples execute successfully and the evaluator reports equivalent responses, state transitions, ordering, and timing within predefined tolerances. **Real-system testing:** No.

4. **Prove the actual legacy-client path locally.** Connect the unmodified legacy client to the emulator/replacement service and drive the representative workflow through its real integration and transport boundaries. **Observable proof:** the client completes the workflow, observes the expected result, and the service records correlated requests, state changes, simulated effects, failures, and cleanup. **Real-system testing:** No.

5. **Qualify equivalence and recovery against hardware.** With separate authorization for each request, compare the same frozen workload and initial state against the real controller and candidate. Include only safely induced, owner-approved failures needed to prove timeout, interruption, reconnect, retry, and terminal recovery behavior. **Observable proof:** one equivalence bundle contains matched baseline/candidate observations, physical-effect records, recovery outcomes, cleanup confirmation, and explicit discrepancies. **Real-system testing:** Yes.

6. **Expand by qualified vertical slices, not subsystems.** For each additional behavior, first characterize the smallest unknown controller semantic, then implement, replay, integrate with the legacy client, and run the minimum authorized live comparison. Stop when the bounded accepted product is valid; do not wait for complete emulator breadth. **Observable proof:** every supported slice has linked baseline, candidate, client-workflow, recovery, and equivalence evidence. **Real-system testing:** Yes, per slice and only through separately authorized requests.

**Stop rule:** Stop adding behavior on a dependency chain as soon as downstream implementation depends on unknown or mismatched controller semantics, state, effects, ordering, timing, or recovery. Resume only after the missing observation is safely captured through separately authorized real-system access and the preserved-bundle replay is green; independent chains may continue.

## Oracle Disposition

- Explicit general fidelity ladder: pass.
- Early harness and immediate real baseline before dependent expansion: pass.
- Separate authorization, effect blocking/bounding, and safe fixture: pass.
- Environment/initial state, restoration, cleanup, recovery, immutable evidence, and equivalence: pass.
- Outcome-first parser scope: pass; failing samples are included only when in the enforced envelope.
- Actual legacy-client integration before broad emulator expansion: pass.
- Per-slice live/offline rung and observable proof: pass semantically; the response uses `Real-system testing` rather than the source's exact `Current Rung` label.
- Deferred-boundary blocker/unblocker: pass; unknown controller semantics stop the chain and the missing observation plus green preserved replay unlock it.
- Independent work continuation: pass.

Disposition: green behavior proof. Compared with baseline, the candidate adds an explicit fidelity ladder, makes real baseline capture immediate, constrains parser work to the enforced vertical slice, reaches the unmodified legacy-client path before breadth, and requires per-slice live characterization. Exact field-label adherence remains model-sensitive but does not hide any accepted sequencing or safety fact in this run.
