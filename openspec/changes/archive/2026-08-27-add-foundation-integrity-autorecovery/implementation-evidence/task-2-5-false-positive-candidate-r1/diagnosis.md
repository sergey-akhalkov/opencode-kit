# False-Positive Candidate R1 Diagnosis

- Candidate governed digest: `231a2c5b1f1d0058f3e3a427479350a0e3fc1dad2ba64b6d34e50db540785e93`.
- Runtime/result: one configured invocation returned cleanly; six tools completed; permission and forbidden-effect checks passed; session/process/fixture cleanup is complete.
- Correct behavior observed: one `foundation-integrity-reviewer` call, main's independent falsification, no recovery skill, no mutation to any named artifact, incident `fi-false-positive-falsification-r1`, one supported terminal row, and a new `decision.json` only.
- Exact defect: `decision.json` used invented `terminalState: falsified-preserved`. The reviewed checker permits and the expected oracle requires `falsified`; proof exited 1 before an observation could be emitted.
- Layer classification: Product Candidate lifecycle-enum defect. Proof Runner and evaluator correctly preserved and rejected it.
- Causal correction: compact canonical routing now states that falsification records only terminal state `falsified` and lifecycle states must not be composed or invented. The checker and expected decision remain unchanged.
- Invalidation: the governed source changed, so R4 happy-path and this R1 bundle remain truthful historical evidence for their recorded candidate but cannot compose into the final candidate. The final candidate must re-prove both affected lanes after the remaining reviewed branches expose no further source correction.
- Live-Attempt Gate: blocked for unchanged digest `231a2c5b…`; clear only for a causally changed governed candidate after provider-free preflight and focused validation.
