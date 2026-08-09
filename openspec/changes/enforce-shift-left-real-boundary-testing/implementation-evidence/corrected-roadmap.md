# Corrected Roadmap Proof

## Identity

- Date: 2026-08-09
- Session: `ses_0194419ddffeuozMbA8I6URdMC`
- Title: `shift-left-corrected-2026-08-09`
- Model: `openai/gpt-5.6-sol`
- Variant: `xhigh`
- Agent: `plan`
- Prompt, workspace, and active config: identical to `baseline-roadmap.md`
- Candidate: post-review Proof Runner ownership correction
- Exit status: `0`
- Export procedure: `opencode export ses_0194419ddffeuozMbA8I6URdMC --sanitize`

## Raw Assistant Response

Fidelity ladder: preserved offline replay -> local integration -> effect-blocked real controller -> bounded physical effects -> end-to-end legacy workflow.

1. **Freeze one vertical product slice.** Define one representative legacy-client request, expected outputs/state, timing tolerance, side-effect envelope, and non-goals. Current rung: offline samples. Next real boundary: the same request against the controller. Observable proof: versioned workload and acceptance manifest recording the current 50/52 parser result. Real-system testing: **No**.

2. **Build the qualification harness before more emulator features.** Capture exact requests, responses, ordering, timing, controller identity, state, errors, physical effects, and cleanup results; keep raw evidence separate from the evaluator. Current rung: deterministic offline replay. Next real boundary: effect-blocked controller invocation. Observable proof: a dry run produces an immutable, replayable evidence bundle and terminal verdict without contacting hardware. Real-system testing: **No**.

3. **Capture the first real baseline immediately.** Obtain separate owner authorization for the exact request; prefer independently effect-blocked or read-only operation, otherwise use tightly bounded effects, abort controls, and verified restoration. Current rung: effect-blocked or bounded real dependency. Observable proof: raw controller transcript, initial/final state, effects, timing, recovery observations, environment identity, and successful cleanup. Real-system testing: **Yes, only after per-request owner authorization**.

4. **Implement and compare the minimum end-to-end replacement path.** Drive the emulator and replacement service through the actual legacy-client integration point using the frozen request; fix the two parser gaps only where evidence shows they matter. Current rung: local integration using preserved real evidence. Next real boundary: confirmation of any unresolved mismatch. Observable proof: candidate output, state, ordering, errors, and timing match the captured baseline within explicit tolerances. Real-system testing: **No**.

5. **Expand one evidence-backed behavior slice at a time.** Before implementing each dependent behavior, characterize its smallest representative request on the real controller, with separate authorization, effect containment, cleanup, and immutable capture; then implement and replay locally. Current rung: alternating bounded real characterization and offline comparison. Observable proof: one baseline-versus-candidate equivalence bundle per slice. Real-system testing: **Yes, separately authorized for every real request**.

6. **Qualify recovery and the complete workflow.** Compare baseline and replacement under identical startup, timeout, disconnect, cancellation, restart, and restoration scenarios, ending with the actual legacy-client workflow. Current rung: bounded live effects progressing to end-to-end operation. Observable proof: a final immutable bundle containing candidate/environment identities, raw transcripts, state/effects, recovery behavior, cleanup, evaluator verdicts, and user-visible timing. Real-system testing: **Yes, with separate authorization and safeguards for each invocation**.

**Stop rule:** Stop adding behavior on any dependency chain as soon as it relies on unknown real-controller semantics, unbounded physical effects, unproven restoration, missing authorization, absent baseline evidence, or an unresolved equivalence mismatch. Continue only independent evidence-backed work; resume that chain after a safe owner-authorized capture resolves the uncertainty.

## Oracle Disposition

- Fidelity ladder and per-slice current rung/next boundary/proof: pass.
- Proof Runner/qualification harness before emulator breadth and before any SDET: pass.
- Immediate real baseline after local dry-run proof: pass.
- Separate authorization, independent effect blocking or bounded effects, abort controls, restoration, and cleanup: pass.
- Real baseline determines parser scope and unresolved mismatch confirmation: pass.
- Per-slice real characterization before dependent implementation: pass.
- Recovery and actual legacy-client end-to-end workflow: pass.
- Dependency-chain-only stop and independent-work continuation: pass.

Disposition: green corrected Runtime Proof. The confirmed harness-ownership defect is no longer reachable in the observed plan, and no safety or shift-left oracle regressed.
