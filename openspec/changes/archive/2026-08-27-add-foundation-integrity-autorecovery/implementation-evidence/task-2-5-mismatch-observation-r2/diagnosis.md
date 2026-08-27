# Task 2.5 Mismatch Observation R2 Diagnosis

## Classification

- Invocation: bounded diagnostic evidence capture declared in `../task-2-5-mismatch-candidate-r1/evidence-capture-2-preflight.md`; not acceptance proof.
- Product Candidate: failed at the selected happy-path terminal boundary.
- Proof Runner: corrected before this invocation; it sealed the negative sample and terminal evaluator result instead of throwing.
- Writer closure: terminal. The configured command returned, the session was deleted, the fixture/process cleanup completed, and no mutation-capable attempt remains open.

## Preserved Facts

- `bundle.json` contains one candidate sample, one configured-provider request, ten completed tool calls, no permission violation, no forbidden effect, and complete cleanup.
- The loaded owner was called once, main independently confirmed the mismatch, the recovery skill was loaded once, and only `state/mismatch-unique-recovery.json` was edited.
- The archived and unrelated artifacts remained at their recorded hashes. The corrected artifact was re-read in main together with both preserved artifacts.
- The final assistant text said it was launching the one permitted corrected-candidate review, but no second `task` call occurred and no `decision.json` was written.
- Validation of `check-decision.ts` passed; the actual proof failed because `decision.json` was absent.
- `evaluation.json` terminally failed all three candidate members with missing state, non-zero proof exit, and malformed-observation reasons. `liveCalls` is 1.

## Root Cause And Correction

The loaded recovery contract required a corrected-candidate review but did not make the call boundary explicit enough to prevent narration followed by termination after redundant main readback. The smallest causal candidate correction changes the `swept -> re-reviewed` instruction to require an immediate actual owner call, prohibits narration or redundant main-only readback before it, uses the fresh review's direct artifact reads as readback, and states that an unissued narrated call cannot advance incident state.

This correction does not change the accepted outcome, expected decision, owner identity, skill count, incident identity, artifact scope, archive policy, or protected-action envelope.

## Claim Ceiling And Next Gate

Observation R2 proves only the pre-correction failure and the corrected Proof Runner's ability to preserve it. It is not task 2.5 acceptance evidence. Before another configured call, provider-free validation must freeze the new governed source identity and keep the selected scenario, three members, permissions, and request bound unchanged. A later configured happy-path call is an acceptance attempt for the causally changed candidate, not a retry of the unchanged candidate.
