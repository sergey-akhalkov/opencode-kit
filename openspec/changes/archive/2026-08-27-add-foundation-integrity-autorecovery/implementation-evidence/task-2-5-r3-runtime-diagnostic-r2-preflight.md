# Task 2.5 R3 Runtime Diagnostic R2 Preflight

- Purpose and claim ceiling: diagnostic-only successor to R1; classify the configured runtime termination and preserve safe evidence. It is not task 2.5 acceptance proof.
- Causal difference from R1: every diagnostic string is sanitized against all four privacy marker classes before serialization; only marker-class counts remain; the digest is computed after sanitization; the final fail-closed privacy assertion is retained.
- Provider-free oracle: consumer-outcome tests 28 exercise structured prompt-error readback, recursive marker removal, marker counts, sanitized digest ordering, and final privacy acceptance. Contracts tests 71 remain green.
- Scope: one selected `mismatch-unique-recovery` session and one configured primary prompt under governed digest `231a2c5b1f1d0058f3e3a427479350a0e3fc1dad2ba64b6d34e50db540785e93` and scenario digest `6cfcbecbeacfe352c4e5884cb3ae1f1f6a5c59e0f8b27b5a81c016990abaadf9`.
- Instrumentation and permissions: unchanged from R1 preflight. Preserve structured session/provider/server/process/outcome/cleanup facts through the server/SDK path; fixture-only read/edit/named owner/named recovery; no protected or external effect.
- Stop line: stop after the first structured completion, provider/runtime error, process exit, or timeout. Seal `diagnostic.json`; do not run an equivalent diagnostic again or infer acceptance from it.
