# Task 2.5 R3 Runtime Diagnostic R1 Failure Chain

- Invocation classification: diagnostic-only server/SDK probe; not task 2.5 acceptance proof.
- Observed result: the configured invocation and cleanup path returned to the runner, but final serialization failed closed because a bounded diagnostic string matched the privacy marker policy.
- Disclosure: no matched value, server log, session content, or diagnostic object was emitted or persisted. The evidence root contained no file before this failure record.
- Writer closure: the synchronous runner returned terminally. Its session deletion, server stop, and temporary-root removal execute before serialization; no mutation-capable attempt is known to remain. The absence of a sealed diagnostic prevents a stronger cleanup claim for this invocation.
- Layer classification: Proof Runner diagnostic-redaction defect. The live Product Candidate and provider/runtime cause remain unknown because the privacy gate correctly prevented unsafe preservation.
- Offline replay coverage: unavailable; no diagnostic object was sealed. Provider-free tests cover structured prompt-error readback and, after correction, privacy-marker value removal/counting.
- Causal correction: sanitize every diagnostic string value with the existing privacy marker classes before JSON serialization, preserve only marker class counts, recompute the digest after sanitization, and retain the final fail-closed privacy assertion.
- Live-Attempt Gate: blocked. Do not repeat this diagnostic mechanism until focused tests prove marker removal, class counts, digest ordering, and final privacy acceptance.
- Unlock condition: provider-free validation of the corrected redaction path, followed by one create-new diagnostic-only server/SDK probe. That successor remains diagnostic and must stop after its first structured completion/error/exit/timeout.
