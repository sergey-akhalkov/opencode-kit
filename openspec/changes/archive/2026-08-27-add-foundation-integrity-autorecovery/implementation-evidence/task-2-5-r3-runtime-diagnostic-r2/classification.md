# Task 2.5 R3 Runtime Diagnostic R2 Classification

## Terminal Evidence

- `diagnostic.json` is diagnostic-only and uses governed source digest `231a2c5b1f1d0058f3e3a427479350a0e3fc1dad2ba64b6d34e50db540785e93`.
- The server route resolved to the configured `openai/gpt-5.6-sol/xhigh` build route and one configured prompt was attempted.
- The session completed seven tools before the final call: one initial read, one initial foundation-owner task, three independent reproduction/preservation reads, one recovery-skill load, and one correction write.
- The next tool row is the corrected-candidate `task` call with status `error`. The terminal assistant row has `MessageAbortedError`, no finish reason, and no text.
- The prompt request returned `AbortError` code 20 after the configured 180-second diagnostic bound. Elapsed diagnostic time was 200917 ms, including the 10-second server-stop failure path and surrounding work.
- No `decision.json` existed because the corrected review was aborted before terminal record creation. The checker therefore failed with `ENOENT`; this is downstream evidence, not an independent candidate defect.

## Layer Classification

- Product Candidate: unadjudicated. The corrected candidate reached and actually invoked the required second reviewer call; no clean model completion or product-authored termination was observed.
- Proof Runner: confirmed timeout defect. Both CLI capture and the first diagnostic path bounded the complete two-review workflow to 180 seconds; R2 directly observes that bound aborting the second review.
- Environment/provider: no independent provider failure is established. The observed provider-facing error is the runner-issued abort.
- Evaluator: functioning. It correctly rejects the incomplete diagnostic outcome but cannot turn it into a Product Candidate verdict.
- Cleanup: incomplete at seal time. The SDK session was deleted, but Windows single-process shutdown did not terminate the proof server and the temporary root remained locked.

## Cleanup Closure

After the outer shell timeout, a privacy-safe process inventory identified exactly two orphan `opencode serve` processes attributable to diagnostic R1 and R2: PIDs `14560` and `12656`, with dead parents and matching diagnostic start times. No other OpenCode process was modified. Both proof-owned PIDs were force-stopped, then only these exact temporary roots were removed:

- `consumer-outcome-diagnostic-mismatch-unique-recovery-X0x7TE`
- `consumer-outcome-diagnostic-mismatch-unique-recovery-i2iu6E`

Verification returned `LiveProofPids: 0` and `RemainingRoots: 0`. Both diagnostic writer attempts are therefore terminally closed.

## Causal Correction And Gate

- Foundation configured prompts receive a bounded 300-second timeout; all other existing configured scenarios retain 180 seconds.
- Proof-server shutdown reuses the maintained Windows-aware `stopProofProcessTree` helper, which terminates the full owned tree before listener verification and fixture removal.
- The next acceptance attempt is authorized only after provider-free tests prove timeout selection and Windows cleanup wiring. It is a causally different Proof Runner candidate, not an unchanged retry. No other foundation scenario may start until the happy-path evaluator and cleanup pass.
