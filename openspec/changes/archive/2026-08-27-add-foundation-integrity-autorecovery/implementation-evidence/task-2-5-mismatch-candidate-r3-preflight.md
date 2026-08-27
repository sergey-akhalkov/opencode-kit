# Task 2.5 Corrected Mismatch Candidate R3 Preflight

- Candidate class: acceptance attempt for a causally changed candidate, not repetition of the unchanged R2 observation.
- Causal change: the loaded recovery procedure now requires the actual corrected-candidate owner call immediately after `swept`, replaces redundant main-only readback with the fresh review's direct inspection, and rejects narrated-but-unissued calls as evidence.
- Governed working-tree digest: `231a2c5b1f1d0058f3e3a427479350a0e3fc1dad2ba64b6d34e50db540785e93`.
- Selected scenario digest: `6cfcbecbeacfe352c4e5884cb3ae1f1f6a5c59e0f8b27b5a81c016990abaadf9`.
- Scope: `mismatch-unique-recovery`; three explicit members; candidate arm sample 1; one configured primary-model call.
- Permissions: allow local `read`, `edit`, `task:foundation-integrity-reviewer`, and `skill:foundation-integrity-recovery`; deny shell, external directory, glob, grep, question, and web access. Fixture writes only; no external writes or protected effects.
- Provider-free gates: consumer-outcome tests 27, practice-owner tests 6, contracts 71, instruction-context tests 15, strict validation, and canonicalization all passed after the causal change.
- Stop line: preserve bundle and evaluation, inspect real tool calls/outcome/proof/cleanup, and do not start the other six scenarios unless this selected terminal evaluator passes.
