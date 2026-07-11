# Universal Development Loop

Use this loop for AI-assisted development in any project. Technology adapters may change commands, file locations, and domain gates, but they must not create a separate process.

## Contract

1. `Intake`: restate the original requirements, constraints, success criteria, non-goals, business invariants, observable happy path, and likely validation boundary in the smallest useful form.
2. `Evidence`: inspect source, existing tests, schemas, scripts, generated artifacts, config, and live command output before trusting docs, comments, summaries, or user recollection.
3. `Baseline Proof`: reproduce the bug or capture current observable behavior before changing it when feasible. Existing tests may be run, but new automated tests are not authored during this phase.
4. `Small Slice`: choose one reviewable slice that proves value with minimal surface area. Avoid unrelated cleanup and speculative abstractions.
5. `Happy Path`: implement the smallest complete production path that satisfies the primary requirement. Preserve existing user/team changes and do not widen scope silently.
6. `Happy-Path Proof`: demonstrate the behavior through observable execution at the relevant user-facing or system boundary. Compilation, code inspection, a mocked helper, or a plausible explanation is not sufficient proof.
7. `Risk Discovery`: after happy-path proof, start a separate fresh-context testing subagent that did not author production code. Give it the original requirements, runtime constraints, implementation, and proof evidence; require an independent matrix of realistic business, boundary, dependency, data, security, concurrency, recovery, resource, and observability risks.
8. `Negative Tests`: only the testing subagent creates or modifies automated tests, fixtures, snapshots, fake services, or test harnesses. Prioritize end-to-end tests with real processes, protocols, persistence, and integrations in isolated production-like environments. Use mocks only when the real dependency is unavailable, unsafe, non-deterministic, or impractical, and record the confidence gap.
9. `Harden`: feed failures found by the testing subagent back into production fixes, then let the testing subagent extend or adjust tests. Continue until identified realistic high-impact scenarios are covered or an exact blocker and residual risk are recorded.
10. `Review Gate`: run the relevant read-only reviewer when risk justifies it, such as code quality, test coverage, readiness, security, performance, deployment, protocol, or compatibility.
11. `Final Validation`: run focused and broader validation across affected module, API, deployment, data, protocol, and compatibility boundaries. Re-run the observable happy path and relevant negative suites.
12. `Handoff`: for material/complex sessions, run `session-delivery-reviewer` with bundle: original requirements, happy-path proof, testing subagent/session, risk matrix, files/diffstat, mock exceptions, failures fed back, final validation, reviewer fixes, and residual risks. Skip only for trivial/bounded work or unavailable inputs, and report why. Treat reviewer blocking output as binding: if it returns `Blocking for Acceptance: yes`, `Verdict: blocked`, any `P0 blocker`, or non-empty `Required Next Actions`, do not present the session as complete or ready-to-land. Continue autonomous work when safe, or ask/escalate only the exact user-owned blocker; partial slice handoff must not end an unfinished root goal.
13. `Process Improvement`: when current-session friction appears, use `complain` to capture it in `docs/feedbacks/**`; after patterns accumulate, prefer a deterministic helper, validator, fixture, report, or template over adding another prose reminder.

## Token And Time Rules

- Start with inventories, glob, grep, targeted reads, and repository-native commands before broad file reading.
- Load heavyweight skills and launch subagents only when they reduce total work through bounded evidence, independent coverage, or read-only review.
- Keep default context small. Link or reference rarely used domain guidance instead of always loading it.
- Use one canonical loop. Profiles and adapters choose artifacts and commands; they do not define new workflows.
- Keep the happy-path implementation minimal, but do not stop risk discovery at the first passing test. Cover all identified realistic high-impact failure scenarios or record the exact blocker and residual production risk.

## Quality Defaults

- Tests and executable validation outrank documentation-only confidence.
- Automated tests optimize for finding and preserving evidence of realistic business-logic and code failures, not for line, branch, or case-count coverage. Coverage metrics are diagnostic signals only.
- Production authors may run, inspect, and debug tests but must not create or modify automated test artifacts. Test authoring belongs only to a separate fresh-context testing subagent with test-only write scope and production paths forbidden.
- This ordering changes only when the user or repository explicitly requires a different workflow.
- Reviewers are leaf validators by default: read-only except feedback-ledger appends under `docs/feedbacks/**`, no source/config/instruction edits, no commits, no nested agents, no user questions.
- Deterministic helpers must have explicit inputs, outputs, stable ordering, privacy-safe output, and no hidden heuristics.
- Remote, destructive, credentialed, legal/security, product-owner, and MR/PR outcome decisions remain user-owned.

## Output Shape

Use a compact handoff unless the user requests more detail:

- `Outcome`: completed, partial, blocked, or review-only.
- `Changed Files`: paths or `none`.
- `Evidence`: source/tests/commands used.
- `Validation`: commands and results, or skipped reason.
- `Review Gate`: reviewer used or skipped reason.
- `Residual Risks`: remaining uncertainty.
- `Ready To Land`: yes/no with blocker if no.
