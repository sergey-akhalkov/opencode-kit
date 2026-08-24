# Strategy History

No implementation, configured-model, or proof attempt has been executed for this change. The entries below record only materially distinct design strategies considered during proposal preparation.

## 2026-08-24 - Add another dedicated loaded-instruction runner

- **Objective:** Obtain direct configured-model evidence for the two shift-left sequencing decisions.
- **Approach:** Create a new proof CLI, source staging path, scenario schema, capture format, evaluator, replay path, cleanup implementation, package command, and proof inventory entry dedicated to shift-left behavior.
- **Evidence:** `tools/proofs/consumer-outcome-regression.ts` and `tools/proofs/consumer-outcome/` already own matched source staging, installed configured capture, environment correlation, focused decision packs, evidence bounds, cleanup, and provider-free replay.
- **Outcome:** Rejected during design; no files or live calls were attempted through this strategy.
- **Reason:** It duplicates the most safety-sensitive and costly mechanisms while adding no distinct accepted behavior.
- **Do-Not-Repeat Condition:** Do not create a second runner while the existing consumer-outcome focused-pack owner can express the reviewed cases and hard oracles without weakening its contracts.
- **Evidence-Based Retry Condition:** Reconsider only if implementation proves an exact required observation cannot be represented or captured by the existing owner and the missing capability cannot be added locally without changing the general baseline or another focused pack.

## 2026-08-24 - Append shift-left cases to the claim-evidence pack

- **Objective:** Reuse the current focused-pack implementation with the smallest apparent data-only addition.
- **Approach:** Add the two shift-left cases to `claim-evidence-decision-gap-r1` and extend its existing decision checker and maximum claim.
- **Evidence:** `openspec/specs/library-consumer-outcome-regression/spec.md` fixes that pack to four claim-evidence decisions and requires focused packs to retain their own scenarios and maximum claim without altering unrelated decision gaps.
- **Outcome:** Rejected during design; the existing pack remains unchanged.
- **Reason:** Shift-left sequencing and claim-evidence closure are different decision populations. Combining them would blur both claim ceilings and make future invalidation broader than necessary.
- **Do-Not-Repeat Condition:** Do not modify the claim-evidence pack for shift-left behavior while a separate versioned focused pack can reuse the same runner.
- **Evidence-Based Retry Condition:** Reconsider only if the canonical consumer-outcome contract intentionally adopts one reviewed multi-domain focused population with a single coherent maximum claim and migration plan.

## 2026-08-24 - Strengthen principles and marker repetition

- **Objective:** Make shift-left behavior more reliable by increasing instruction emphasis.
- **Approach:** Add `Shift Left` as another canonical principle or repeat more cadence wording across maintained global and project surfaces before obtaining direct behavior evidence.
- **Evidence:** `global/principles-of-work.md` already owns Fast Feedback, first-real-signal, scientific-method, Gall's Law, and fail-fast semantics; exact shift-left markers are enforced across six maintained surfaces by `tools/contracts/skills.ts`, `tools/validators/routing.ts`, and focused contract tests. The identified gap is semantic loaded behavior, not missing text.
- **Outcome:** Rejected during design; no principle or instruction wording change is planned without a qualified baseline defect.
- **Reason:** More text cannot prove model behavior, risks startup-context growth and semantic duplication, and may weaken the existing concise owner structure.
- **Do-Not-Repeat Condition:** Do not add or repeat shift-left wording solely because the new behavior pack is absent or a proof runner/evaluator fails.
- **Evidence-Based Retry Condition:** Reconsider only after complete matched evidence isolates a reproducible Product Candidate instruction defect while runner, evaluator, environment, observation path, and cleanup are qualified.
