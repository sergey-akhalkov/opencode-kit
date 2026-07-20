# Universal Development Loop

Use this loop for AI-assisted development in any project. Technology adapters may change commands, file locations, and domain gates, but they must not create a separate process.

## Contract

1. `Intake`: restate the next-increment `Outcome`, enforced `Operating Envelope`, `Non-Goals`, non-deferrable invariants, observable happy path, material residual risks, stop line, and likely validation boundary in the smallest useful form.
2. `Evidence`: inspect source, existing tests, schemas, scripts, generated artifacts, config, and live command output before trusting docs, comments, summaries, or user recollection.
3. `Baseline Proof`: reproduce the bug or capture current observable behavior before changing it when feasible. Existing tests may be run; new automated tests are optional until after happy-path proof.
4. `Small Slice`: choose one reviewable next working increment inside a technically enforced operating envelope. Prefer remove/narrow/reuse/local guard before new mechanisms. Avoid unrelated cleanup and speculative abstractions. Unrequested scope expansion requires explicit user approval.
5. `Happy Path`: implement the smallest complete production path that satisfies the primary requirement. Ordinary Small work may be authored directly by the main session. Preserve existing user/team changes and do not widen scope silently.
6. `Happy-Path Proof`: demonstrate the behavior through observable execution at the relevant user-facing or system boundary. Compilation, code inspection, a mocked helper, or a plausible explanation is not sufficient proof.
7. `Focused Validation`: run the closest relevant focused checks. Prefer existing tests when sufficient. Ordinary Small may add the smallest focused regression test after proof when useful.
8. `Edge Inspection`: inspect only realistic requirement-linked edge cases inside the accepted boundary. Do not invent theoretical acceptance scope.
9. `Risk Discovery` (Material/explicit qualification): after happy-path proof, start a separate fresh-context testing subagent that did not author production code. Give it the original requirements, runtime constraints, implementation, and proof evidence; require an independent matrix of realistic business, boundary, dependency, data, security, concurrency, recovery, resource, and observability risks.
10. `Negative Tests` (Material/explicit qualification): only the testing subagent creates or modifies systematic automated tests, fixtures, snapshots, fake services, or test harnesses. Prioritize end-to-end tests with real processes, protocols, persistence, and integrations in isolated production-like environments. Use mocks only when the real dependency is unavailable, unsafe, non-deterministic, or impractical, and record the confidence gap.
11. `Harden`: on the qualification path, after freeze, post-freeze scope may only shrink. Apply at most one correction wave only when a finding references a frozen acceptance criterion, has a concrete candidate-attributable reproducer, fits completely in frozen paths without persistent evidence infrastructure, and the wave is unused. Eligible production correction invalidates prior SDET qualification and requires one new fresh corrected-candidate testing subagent context inside that wave. Out-of-scope P0/P1, unknowns, and missing capabilities bind `Change-Ready: no` via `Blocking Evidence` but never authorize scope expansion. Cover representative high-impact scenarios from the accepted risk matrix, or record an exact blocker and residual risk.
12. `Review Gate`: optional domain review when risk justifies it. This optional gate does not replace independent Final Candidate Review on the qualification path and must not open unbounded polish loops after mutation without explicit owner approval via a new revision or separate change.
13. `Final Validation` (qualification path): run focused and broader validation across affected boundaries. Replay only after an eligible frozen-criterion correction inside the single correction wave.
14. `Final Candidate Review` (qualification path): after Final Validation, dispatch a fresh read-only final reviewer that authored neither production nor tests. Map native verdicts to `approved | approved_with_notes | rejected | blocked`. Rejection or block terminates the attempt and never authorizes autonomous correction or replay. Ordinary Small completion does not require this gate.
15. `Handoff`: Ordinary Small reports proof, validation, residual risks, `Pilot-Ready: yes | no | not requested` when relevant, and `Change-Ready: not requested`. Profiles stay `Ordinary Small | Material`; neither disposition authorizes external ops. For Material work, always run the discovered conforming delivery/readiness gate (this kit's optional default is `session-delivery-reviewer`) with current requirements, candidate continuity, proof, SDET, validation, Final Candidate Review, residual-risk evidence, and bundle: original requirements, happy-path proof, testing subagent/session, risk matrix, files/diffstat, mock exceptions, failures fed back, final validation, reviewer fixes, and residual risks; missing conforming capability blocks readiness and is never a skip due to unavailable inputs. Material `Change-Ready: yes` requires an explicitly accepted conforming delivery result. Ordinary Small uses proportional evidence and invokes that gate only when project policy, risk, or the owner requires it. Diagnostic scale (trivial/bounded/material/complex) does not override the Portable Ordinary Small/Material profile. Treat delivery/readiness blocking output as binding readiness rejection that never authorize scope expansion: every `Change-Ready: no`, `Verdict: material deviations`, `Verdict: not enough evidence`, `Blocking for Acceptance: yes`, `Verdict: blocked`, final `rejected`/`blocked`, or non-empty `Blocking Evidence` keeps readiness blocked; do not present the session as complete or ready-to-land. Negative delivery verdict or `Change-Ready: no` must not coexist with `Blocking for Acceptance: no` and empty `Blocking Evidence`. P2/note polish stays residual or non-authorizing `Follow-up Candidates`. Delivery rejection is terminal for Change-Ready and does not automatically erase independently proven Pilot-Ready evidence. Full closed-world policy lives in active global `change-ready-sdlc`. Continue autonomous work when safe, or ask/escalate only the exact user-owned blocker; partial slice handoff must not end an unfinished root goal.
16. `Process Improvement`: when current-session friction appears, use `complain` to capture it in `docs/feedbacks/**`; after patterns accumulate, prefer a deterministic helper, validator, fixture, report, or template over adding another prose reminder.

## Token And Time Rules

- Prefer inventories, targeted search/reads, and repository-native commands before broad dumps.
- Load heavy skills/subagents only when they reduce total work. Do not load `change-ready-sdlc` for Ordinary Small work.
- One canonical loop; adapters change commands/artifacts, not the process.
- Keep happy-path minimal. Ordinary Small stops after focused validation and realistic edge inspection.

## Quality Defaults

- Executable validation outranks docs-only confidence. Coverage metrics are diagnostic only.
- Qualification path: production authors do not author automated tests; only a fresh testing subagent with test-only scope does. Ordinary Small main may author the smallest focused post-proof regression test.
- Adapters cannot weaken Material role separation, proof-before-SDET, corrected-candidate freshness, validation, independent final review, or Material delivery while claiming Change-Ready.
- Reviewers are read-only leaves except `docs/feedbacks/**`. Helpers stay deterministic with no hidden heuristics.
- Remote, destructive, credentialed, legal/security, product-owner, and MR/PR outcomes remain user-owned.

## Output Shape

Use a compact handoff unless the user requests more detail:

- `Outcome`: completed, partial, blocked, or review-only.
- `Changed Files`: paths or `none`.
- `Evidence`: source/tests/commands used.
- `Validation`: commands and results, or skipped reason.
- `Review Gate`: optional domain reviewer used or skipped reason.
- `Final Candidate Review`: verdict, blocker, or `N/A - Ordinary Small` when qualification did not run.
- `Delivery/readiness`: accepted, blocked, or `N/A - Ordinary Small <reason>` when applicable.
- `Residual Risks`: remaining uncertainty.
- `Pilot-Ready`: `yes | no | not requested` when a limited-use disposition is relevant.
- `Change-Ready`: `not requested` for Ordinary Small; `yes|no` on the qualification path with blocker if no.
