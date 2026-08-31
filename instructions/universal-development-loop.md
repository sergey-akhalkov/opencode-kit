# Universal Development Loop

Use this loop for AI-assisted development in any project. Technology adapters may change commands and files, not the lifecycle.

## Contract

1. `Intake`: state the accepted `Outcome`, technically enforced operating envelope, `Non-Goals`, non-deferrable invariants, happy path, validation boundary, touched ownership, and meaningful failure boundaries.
2. `Facts`: inspect source, tests, schemas, config, and current-run stdout/stderr, logs, and exceptions before trusting summaries.
3. `Baseline Proof`: reproduce current behavior at the first safely reachable real boundary sufficient to observe the accepted effect; when deferred, name the exact blocker and earliest unblocking or goal-preserving replan task.
4. `Small Slice`: implement the smallest useful increment as a vertical slice that minimizes time-to-first-real-signal; prefer remove/narrow/reuse/local guard, preserve unrelated work, and use `split-or-justify` rather than adding a responsibility to an already mixed file.
5. `Happy Path`: main is the default production author for Ordinary Small and Material.
6. `Runtime Proof`: run-observe-correct at the first safely reachable real boundary sufficient to observe the accepted effect; inspect invocation/input, identity, exit status, stdout/stderr, relevant logs/exceptions, side effects, and cleanup from the current run. Climb from integration/simulator to bounded live or end-to-end only for a current requirement, invariant, or unresolved equivalence risk. Compilation or unit checks alone are not proof.
7. `Accepted Scope`: complete required scope without optional polishing. Product Candidate or relevant environment mutation invalidates dependent proof.
8. `Optional Risk Discovery`: Optional final-candidate, delivery, code-quality, or domain review may run after current proof only for concrete risk, project policy, or the owner. Missing or unusable optional evidence is not itself a stage blocker; reviewers never authorize mutation.
9. `Critical SDET`: use fresh test-only SDET returning `critical-risks-reported | no-critical-risk | blocked` only for a reachable named critical consequence or explicit project/owner requirement. Main may add the smallest focused regression after proof without labeling it independent SDET evidence.
10. `Validation And RC`: complete applicable project-native validation. Ordinary work reports verified outcome; explicit/project-required or critical-risk qualification may freeze the next `RC<n>` after its triggered SDET and safety gates.
11. `Stable Handoff`: inside qualification only, promote the same RC to stable after local handoff. `Stable Candidate: RC<n>` identifies it; external operations remain separately authorized.
Optional workflow feedback is routed through `complain` or a separately accepted change and never becomes a completion stage.

Trade-offs follow the global working philosophy: quality and honest outcome semantics first, the shortest verified path, autonomy until a real owner boundary, maximum token economy, and evidence-backed continuous improvement. Fix, narrow, or remove concrete workflow impediments at the smallest authorized layer; never weaken proof, safety, protected boundaries, accepted scope, or unrelated work. User-owned scope remains the accepted outcome and protected-boundary decisions; necessary local reversible dependency closure is autonomous. Profiles remain `Ordinary Small | Material`. Reviewer/SDET evidence must never authorize mutation. A partial slice handoff must not end an unfinished root goal.

Shift-left sequencing does not authorize external operations. A deferred rung records authorization, safeguards, restoration/cleanup, and its path-scoped stop condition. A path-only gate remains blocked and unclaimed while an alternate sufficient route continues; only outcome-required owner action stops the outcome.

## Quality Defaults

- Verified outcome requires real happy-path execution.
- Current work must preserve local comprehensibility: line count is a signal rather than a quota, existing unrelated debt may remain, and new responsibility in mixed code requires cohesive extraction or `split-or-justify`.
- Current work must preserve the original exception cause/stack and sufficient safe diagnostic context at meaningful failure boundaries; duplicate/noisy logging and optional observability polish are not required.
- Ordinary Small and non-qualifying Material work report `Outcome: working | blocked | unknown`, proof, validation, and limitations without RC/stable.
- Qualification RC requires completed accepted scope, green applicable validation, and usable terminal critical-SDET evidence when triggered.
- Known non-critical bugs, limitations, coverage gaps, and optimization opportunities are recorded but do not block RC or stable.
- No hard bug-count, coverage, or soak-time threshold is required.

## Output Shape

- `Outcome`: working | blocked | unknown.
- `Candidate Reference`: readable Product Candidate plus runner/evaluator/environment identities when applicable, or none.
- `Earliest Real Signal`: fidelity ladder, current rung, next real boundary, blocker/unblocker, and dependency-chain stop condition.
- `Runtime Proof`: boundary, input, expected/actual observation, exit status, stdout/stderr, logs/exceptions, side effects, and cleanup.
- `Architecture`: touched responsibilities and `split-or-justify` decisions, or N/A with reason.
- `Diagnostics`: current-run facts and smallest instrumentation decision, or N/A with reason.
- `Critical SDET`: terminal state when triggered, otherwise N/A with reason.
- `Validation`: commands and outcomes.
- `Known Non-Critical Limitations`: list or none.
- `Development-Stage: development | MVP | RC<n> | stable`: qualification only.
- `Stable Candidate: RC<n>`: only when qualification reaches stable.
- `External Operations`: not performed unless separately authorized.
