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
9. `Harden`: feed qualifying failures (mandatory-gate or reproducible P0/P1 serious defects) found by the testing subagent back into production fixes. A qualifying production correction invalidates prior SDET qualification and requires a new fresh corrected-candidate testing subagent context; only provisional→final reporting on an unchanged candidate may reuse the same testing subagent context. Cover representative high-impact scenarios from the accepted risk matrix, or record an exact blocker and residual risk. Do not expand into exhaustive Cartesian products or evidence polish without owner approval or a new qualifying serious defect.
10. `Review Gate`: optional domain review when risk justifies it, such as code quality, test coverage, readiness, security, performance, deployment, protocol, or compatibility. This optional gate does not replace independent Final Candidate Review and must not open unbounded polish loops after mutation without owner expansion.
11. `Final Validation`: run focused and broader validation across affected module, API, deployment, data, protocol, and compatibility boundaries. Re-run the observable happy path and relevant negative suites once per planned validation wave; replay only after a qualifying correction or failed mandatory gate.
12. `Final Candidate Review`: after Final Validation, dispatch a fresh read-only final reviewer that authored neither production nor tests. Map native verdicts to `approved | approved_with_notes | changes_requested | blocked`. Qualifying actionable findings (mandatory-gate or P0/P1 serious defects) do not pass; P2/note polish alone does not produce `changes_requested`. Absence of a conforming reviewer blocks readiness. This mandatory gate is distinct from the optional domain Review Gate.
13. `Handoff`: For Material work, always run the discovered conforming delivery/readiness gate (this kit's optional default is `session-delivery-reviewer`) with current requirements, candidate continuity, proof, SDET, validation, Final Candidate Review, residual-risk evidence, and bundle: original requirements, happy-path proof, testing subagent/session, risk matrix, files/diffstat, mock exceptions, failures fed back, final validation, reviewer fixes, and residual risks; missing conforming capability blocks readiness and is never a skip due to unavailable inputs. Material `Change-Ready: yes` requires an explicitly accepted conforming delivery result. Small uses proportional evidence and invokes that gate only when project policy, risk, or the owner requires it. Diagnostic scale (trivial/bounded/material/complex) does not override the Portable Small/Material profile. Treat delivery/readiness blocking output as binding for mandatory-gate or qualifying P0/P1 serious blockers: every `Change-Ready: no`, `Verdict: material deviations`, `Verdict: not enough evidence`, `Blocking for Acceptance: yes`, `Verdict: blocked`, qualifying P0/P1 serious blocker, or non-empty `Required Next Actions` (restricted to those classes) keeps readiness blocked; do not present the session as complete or ready-to-land. Negative delivery verdict or `Change-Ready: no` must not coexist with `Blocking for Acceptance: no` and `Required Next Actions: none`. P2/note polish stays residual/follow-up. Full anti-polishing policy lives in active global `change-ready-sdlc`. Continue autonomous work when safe, or ask/escalate only the exact user-owned blocker; partial slice handoff must not end an unfinished root goal.
14. `Process Improvement`: when current-session friction appears, use `complain` to capture it in `docs/feedbacks/**`; after patterns accumulate, prefer a deterministic helper, validator, fixture, report, or template over adding another prose reminder.

## Token And Time Rules

- Start with inventories, glob, grep, targeted reads, and repository-native commands before broad file reading.
- Load heavyweight skills and launch subagents only when they reduce total work through bounded evidence, independent coverage, or read-only review.
- Keep default context small. Link or reference rarely used domain guidance instead of always loading it.
- Use one canonical loop. Profiles and adapters choose artifacts and commands; they do not define new workflows.
- Keep the happy-path implementation minimal, but do not stop risk discovery at the first passing test. Cover representative realistic high-impact failure scenarios from the accepted risk matrix, or record the exact blocker and residual production risk. Exhaustive Cartesian expansion needs a concrete high-impact risk, mandate, or owner approval.

## Quality Defaults

- Tests and executable validation outrank documentation-only confidence.
- Automated tests optimize for finding and preserving evidence of realistic business-logic and code failures, not for line, branch, or case-count coverage. Coverage metrics are diagnostic signals only.
- Production authors may run, inspect, and debug tests but must not create or modify automated test artifacts. Test authoring belongs only to a separate fresh-context testing subagent with test-only write scope and production paths forbidden.
- Adapters and owner/project constraints may change commands, artifacts, add stricter gates, or stop work, but they cannot weaken, reorder, or omit mandatory role separation, proof-before-SDET, corrected-candidate freshness, validation, independent final review, or applicable Material delivery while claiming Change-Ready. A conflicting requested workflow is a constraint or blocker, not proof.
- Reviewers are leaf validators by default: read-only except feedback-ledger appends under `docs/feedbacks/**`, no source/config/instruction edits, no commits, no nested agents, no user questions.
- Deterministic helpers must have explicit inputs, outputs, stable ordering, privacy-safe output, and no hidden heuristics.
- Remote, destructive, credentialed, legal/security, product-owner, and MR/PR outcome decisions remain user-owned.

## Output Shape

Use a compact handoff unless the user requests more detail:

- `Outcome`: completed, partial, blocked, or review-only.
- `Changed Files`: paths or `none`.
- `Evidence`: source/tests/commands used.
- `Validation`: commands and results, or skipped reason.
- `Review Gate`: optional domain reviewer used or skipped reason.
- `Final Candidate Review`: verdict or blocker when Final Validation completed; required for behavior-changing readiness.
- `Delivery/readiness`: accepted, blocked, or `N/A - Small <reason>` when applicable.
- `Residual Risks`: remaining uncertainty.
- `Ready To Land` / `Change-Ready`: yes/no with blocker if no.
