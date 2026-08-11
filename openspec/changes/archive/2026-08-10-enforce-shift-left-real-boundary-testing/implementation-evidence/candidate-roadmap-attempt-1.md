# Candidate Roadmap Attempt 1

## Identity

- Date: 2026-08-09
- Session: `ses_0196a44e5ffeP2qOseUFusaP1Y`
- Title: `shift-left-candidate-2026-08-09`
- Model: `openai/gpt-5.6-sol`
- Variant: `xhigh`
- Agent: `plan`
- Prompt, workspace, and active config: identical to `baseline-roadmap.md`
- Candidate: first shift-left instruction candidate
- Exit status: `0`
- Export procedure: `opencode export ses_0196a44e5ffeP2qOseUFusaP1Y --sanitize`

## Raw Assistant Response

1. **Define the first vertical product slice.** Select the smallest legacy-client workflow that produces useful behavior. Freeze request bytes, initial state, expected responses, timing, ordering, effects, cleanup, operating limits, and safety controls. **Observable proof:** an executable workload and equivalence manifest with deterministic pass/fail criteria. **Real-system testing:** No.

2. **Build the qualification harness before expanding the emulator.** Drive both captured traffic and the actual legacy-client path; record raw requests, responses, timing, state transitions, errors, effects, and restoration evidence in immutable bundles. Validate it using the existing 52 offline samples and a deliberate mismatch. **Observable proof:** reproducible bundles, successful replay, and demonstrated mismatch detection. **Real-system testing:** No.

3. **Capture the earliest real-controller baseline.** Run the smallest representative workflow, including the safest recovery observation available. Obtain separate owner authorization for every request, independently suppress physical effects where possible, and define restoration before execution. **Observable proof:** complete raw baseline bundle, environment identity, observed effects, terminal state, and confirmed restoration. **Real-system testing:** Yes.

4. **Implement only the baseline-supported emulator slice.** Correct the two unhandled parser samples and match the captured controller semantics through the legacy-client integration path. **Observable proof:** 52 of 52 samples execute, the vertical workflow completes, and replay comparison meets the frozen equivalence criteria. **Real-system testing:** No new live requests; use the preserved real baseline.

5. **Perform bounded baseline-versus-candidate qualification.** Execute identical workloads from equivalent initial state against the real controller and replacement, comparing outputs, effects, ordering, timing, faults, recovery, continuation, and cleanup. Each real request requires separate owner authorization and physical safeguards. **Observable proof:** an immutable equivalence bundle with explained tolerances, no unexplained differences, and restoration evidence. **Real-system testing:** Yes.

6. **Expand one dependency slice at a time and qualify the release candidate.** For every remaining subsystem behavior, first capture unknown real semantics, then implement, replay, and run the smallest necessary live comparison. Finish with representative legacy-client workflows and recovery scenarios. **Observable proof:** complete requirement-to-evidence mapping, green equivalence bundles, recovery proof, and no unresolved material mismatch. **Real-system testing:** Yes, narrowly scoped and separately authorized per request.

**Stop rule:** Stop adding behavior on a dependency chain as soon as an unknown or mismatched real-controller semantic could invalidate downstream implementation. Resume that chain only after an authorized baseline capture or equivalence result resolves it; independent, unaffected work may continue.

## Oracle Disposition

- Early harness and earliest baseline before dependent expansion: pass.
- Separate authorization and independently suppressed effects: pass.
- Restoration, cleanup, recovery, immutable evidence, and equivalence: pass.
- Dependency-chain stop with independent work continuing: pass.
- Explicit fidelity ladder: fail.
- Per-slice current rung and next real boundary: fail.
- Exact blocker and earliest unblocking task when live proof is deferred: fail.
- Outcome-first prioritization: partial; step 4 adds a 52/52 parser-count target without evidence that both samples belong to the selected workflow.

Disposition: red product-behavior proof. Preserve the output, strengthen the roadmap rendering contract, and rerun the identical prompt only after that causal instruction mutation.
