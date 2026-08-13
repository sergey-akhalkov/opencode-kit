# Stable Handoff

## Outcome

An explicitly grind-enabled local parentless root can now resolve a safely derivable bounded multiple-choice request without human availability. The hidden arbiter receives the exact bounded questions/options, returns one exact offered-label row per question, and the guard uses OpenCode's official `question.reply` API so the original tool call resumes. Guard answers are persisted and projected as synthetic interventions, never as human authority. Human replies win before guard success; owner-required questions remain open.

## Operating Envelope And Non-Goals

- Local OpenCode `1.18.18`-compatible processes loading this kit source, with the declared plugin/SDK package `1.18.15` and supported `question.list/reply/reject` capabilities.
- Explicit `/enable-grind` opt-in per root; new roots remain default-off.
- Bounded single- and multi-select questions with offered labels/descriptions. No free-form answer invention.
- No daemonization, reboot/process-survival guarantee, indefinite provider-outage guarantee, remote deployment, protected operation approval, arbitrary custom-text decision, installation, activation, release, or publication.
- Existing tool permission policy remains authoritative. Autonomous question selection does not grant new protected, remote, destructive, credential, security, privacy, migration, or product-policy authority.

## Candidate And Evidence

- Candidate Reference: `make-grind-questions-autonomous-RC1` on base `e19875444fe8d042255db18c5f30d0be142eb94d` plus the hashes in `final-validation.md`.
- Real boundary: fresh installed OpenCode server, real `question` tool, configured primary model and hidden arbiter, official reply, original tool continuation, downstream marker, terminal completion audit, session-delivery projection, and cleanup.
- Product matrix: `scenario-matrix.md`.
- Fresh terminal SDET: `critical-sdet.md`, action `no-critical-risk`.
- Qualification: `final-validation.md`.

## Known Non-Critical Limits

- The primary model may format offered labels differently while preserving their semantic descriptions. The final evaluator therefore proves exact selected-offered equality and derives the expected safe choice from the fixed description instead of assuming a literal label.
- A guard reply interrupted after provenance persistence remains pending/resolution-unknown rather than claiming a human or guard actor. This is intentional fail-closed evidence and can remain until later observation clarifies the result.
- Metadata keeps at most 1,024 non-evicting autonomous request refs and fails closed before another answer when full.
- The installed executable is `1.18.18` while the kit dependency declaration is `1.18.15`; startup capability checks, installed permission diagnostics, and repeated real-boundary proof are green for this supported combination.
- The installed proof isolates the disposable primary root to the real `question` tool. It does not claim that ordinary grind roots have the same narrow tool map; their existing agent/config permission policy still applies.

## Disable, Rollback, And Restart

- Immediate per-root stop: run `/disable-grind`. It cancels the active audit, aborts an in-flight guard reply through the SDK signal, prevents late continuation, clears live question state, and leaves ambiguous pre-recorded provenance fail closed.
- Source rollback: stop the affected OpenCode process, restore the prior coherent guard/arbiter/projection/proof source set, and start a new process. Already answered questions cannot be undone.
- Source edits do not hot-reload into this current chat or any already-running process. Future operator use requires a newly started OpenCode process after the owner separately chooses installation/activation. The fresh proof processes already exercised the actual source entry point without restarting this chat.

## External Operation State

No commit, push, merge, deployment, release, publication, installation, activation, or restart of the user's current OpenCode chat was performed. All provider calls were bounded synthetic local proof/SDET activity under the standing authorization. All disposable proof roots and children were deleted; all dedicated proof servers were stopped.

`Development-Stage: stable`

`Stable Candidate: RC1`
