# Candidate Roadmap Attempt 2

## Identity

- Date: 2026-08-09
- Session: `ses_01964d1e5ffeAEGnKbN4Dhr1c7`
- Title: `shift-left-candidate-2-2026-08-09`
- Model: `openai/gpt-5.6-sol`
- Variant: `xhigh`
- Agent: `plan`
- Prompt, workspace, and active config: identical to `baseline-roadmap.md`
- Candidate: roadmap-rendering candidate after attempt 1
- Exit status: `0`
- Export procedure: `opencode export ses_01964d1e5ffeAEGnKbN4Dhr1c7 --sanitize`

## Raw Assistant Response

1. **Build the minimum qualification harness.** Define one representative legacy-client workflow, environment identity, initial state, expected cleanup, and equivalence fields. Make the harness fail closed unless each real-controller request has explicit owner authorization and physical effects are independently suppressed or safely bounded. **Observable proof:** an offline dry run records an immutable bundle and rejects unauthorized requests. **Real-system testing:** No.

2. **Capture the first real baseline immediately.** Execute only the minimum representative workflow, with separate authorization for every request, recording exact inputs, responses, state changes, effects, ordering, timing, faults, and cleanup. **Observable proof:** a complete baseline bundle showing controller identity, raw observations, terminal state, and successful restoration. **Real-system testing:** Yes.

3. **Prove one end-to-end emulator slice.** Drive the emulator through the actual legacy-client path using the captured workload; fix only parser behavior required by that slice. Compare client-visible output, state, ordering, and timing against the baseline using explicit tolerances. **Observable proof:** deterministic replay passes at the caller and representative downstream boundary. **Real-system testing:** No; preserved baseline replay only.

4. **Characterize recovery before implementing it.** Use separately authorized, safely contained requests to observe the real controller's behavior for the smallest relevant failures, such as timeout, disconnect, invalid input, restart, and continuation. **Observable proof:** immutable recovery bundles capture the fault, response, client continuation, controller state, cleanup, and terminal observation. **Real-system testing:** Yes.

5. **Expand by validated vertical slices, not subsystems.** Add the next user-visible behavior only when its normal and recovery semantics are represented in the baseline corpus, then run it through the integrated legacy-client path. **Observable proof:** each slice has a traceable equivalence manifest and passes normal, fault, continuation, and cleanup comparisons. **Real-system testing:** No by default; unknown semantics require a new separately authorized baseline capture first.

6. **Run bounded live qualification of the complete candidate.** First replay the evaluator through all preserved bundles without live effects. Once green, compare the same workload, actor, initial state, environment, and tolerances across separately authorized real-controller runs and the replacement service. **Observable proof:** one immutable equivalence bundle contains raw baseline and candidate observations, evaluator results, user-visible outcomes, effects, timing, recovery, cleanup, and terminal state. **Real-system testing:** Yes.

**Stop rule:** Stop adding behavior in any dependency chain as soon as it relies on unobserved real-controller semantics or a baseline mismatch. Resume that chain only after a separately authorized, safely contained real capture resolves the uncertainty and the integrated candidate matches it; independent chains may continue.

## Oracle Disposition

- Early harness and immediate real baseline before dependent expansion: pass.
- Separate authorization, fail-closed request rejection, and effect suppression: pass.
- Restoration, cleanup, recovery, immutable evidence, and equivalence: pass.
- Dependency-chain stop with independent work continuing: pass.
- Outcome-first prioritization: pass; only parser behavior required by the vertical slice is fixed.
- Recovery characterization before implementation: pass and improves over baseline.
- Explicit fidelity ladder: fail.
- Exact per-slice `Current Rung`, `Next Real Boundary`, and `Blocker/Unblocker`: fail, although equivalent sequencing is visible in prose.

Disposition: material behavioral improvement with a red exact-output oracle. Make the roadmap fields normative within each item, then perform one final unchanged-prompt attempt; do not continue retrying if model output still compresses equivalent facts into prose.
