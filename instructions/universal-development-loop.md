# Universal Development Loop

Use this loop for AI-assisted development in any project. Technology adapters may change commands, file locations, and domain gates, but they must not create a separate process.

## Contract

1. `Intake`: restate the next-increment `Outcome`, enforced `Operating Envelope`, `Non-Goals`, non-deferrable invariants, observable happy path, material residual risks, stop line, and likely validation boundary in the smallest useful form.
2. `Evidence`: inspect source, existing tests, schemas, scripts, generated artifacts, config, and live command output before trusting docs, comments, summaries, or user recollection.
3. `Baseline Proof`: reproduce the bug or capture current observable behavior before changing it when feasible. Existing tests may be run; new automated tests are optional until after happy-path proof.
4. `Small Slice`: one reviewable next increment inside a technically enforced operating envelope. Prefer remove/narrow/reuse/local guard. No unrelated cleanup/speculative abstractions. Scope expansion (changed accepted outcome, out-of-envelope behavior, weakened invariant, protected-boundary crossing) needs explicit user approval; necessary local reversible dependency closure does not.
5. `Happy Path`: implement the smallest complete production path that satisfies the primary requirement. Ordinary Small work may be authored directly by the main session. Preserve existing user/team changes and do not widen scope silently.
6. `Happy-Path Proof`: demonstrate the behavior through observable execution at the relevant user-facing or system boundary. Compilation, code inspection, a mocked helper, or a plausible explanation is not sufficient proof.
7. `Focused Validation`: run the closest relevant focused checks. Prefer existing tests when sufficient. Ordinary Small may add the smallest focused regression test after proof when useful.
8. `Edge Inspection`: inspect only realistic requirement-linked edge cases inside the accepted boundary. Do not invent theoretical acceptance scope.
9. `Risk Discovery` (Material/explicit qualification): after happy-path proof, start a separate fresh-context testing subagent that did not author production code. Give it the original requirements, runtime constraints, implementation, and proof evidence; require an independent matrix of realistic business, boundary, dependency, data, security, concurrency, recovery, resource, and observability risks.
10. `Negative Tests` (Material/explicit qualification): only the testing subagent creates or modifies systematic automated tests, fixtures, snapshots, fake services, or test harnesses. Prioritize end-to-end tests with real processes, protocols, persistence, and integrations in isolated production-like environments. Use mocks only when the real dependency is unavailable, unsafe, non-deterministic, or impractical, and record the confidence gap.
11. `Harden` (qualification): at most one in-attempt correction wave when the finding refs the accepted outcome or a non-deferrable invariant, has a candidate-attributable reproducer, is authorized local reversible dependency closure without persistent evidence infrastructure, and the wave is unused. Eligible production correction invalidates SDET and needs one fresh corrected-candidate testing context in that wave. Protected-boundary needs/unknowns/missing capabilities bind `Change-Ready: no` via `Blocking Evidence` but never authorize mutation; main diagnoses. Cover high-impact accepted-risk cases or record exact blocker/residual risk.
12. `Review Gate`: optional domain review when risk justifies it—not a Final Candidate Review substitute; no unbounded polish loops; deferrable debt batches after working proof.
13. `Final Validation` (qualification): focused + broader validation. Replay only after an eligible in-attempt correction inside the single correction wave.
14. `Final Candidate Review` (qualification): after Final Validation, fresh read-only final reviewer (authored neither production nor tests). Verdicts `approved | approved_with_notes | rejected | blocked`. Rejection/block ends the inspected attempt—no autonomous correction/replay of that attempt; main owns post-closure root-goal routing. Ordinary Small completion does not require this gate.
15. `Handoff`: Ordinary Small → proof, validation, residual risks, `Pilot-Ready: yes | no | not requested` when relevant, `Change-Ready: not requested`. Profiles `Ordinary Small | Material`; neither disposition authorizes external ops. For Material work, always run the discovered conforming delivery/readiness gate (this kit's optional default is `session-delivery-reviewer`) with requirements, candidate continuity, proof, SDET, validation, Final Candidate Review, residual-risk evidence, and bundle (requirements, happy-path proof, testing session, risk matrix, files/diffstat, mock exceptions, failures fed back, final validation, reviewer fixes, risks); missing conforming capability blocks readiness and is never a skip due to unavailable inputs. Material `Change-Ready: yes` requires an explicitly accepted conforming delivery result. Ordinary Small uses proportional evidence and invokes that gate only when project policy, risk, or the owner requires it. Diagnostic scale (trivial/bounded/material/complex) does not override the Portable Ordinary Small/Material profile. Delivery blockers bind the inspected candidate and never authorize mutation: every `Change-Ready: no`, `Verdict: material deviations`, `Verdict: not enough evidence`, `Blocking for Acceptance: yes`, `Verdict: blocked`, final `rejected`/`blocked`, or non-empty `Blocking Evidence` keeps readiness blocked; do not present the session as complete or ready-to-land. Negative delivery/`Change-Ready: no` must not pair with `Blocking for Acceptance: no` and empty `Blocking Evidence`. P2/note → Residual Risks or non-authorizing `Follow-up Candidates`. Delivery rejection is terminal for the inspected attempt and does not erase independently proven Pilot-Ready evidence or end the unfinished root goal. Detail: active global `change-ready-sdlc`. Continue when safe, or ask only the exact user-owned blocker; partial slice handoff must not end an unfinished root goal.
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
