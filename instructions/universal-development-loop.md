# Universal Development Loop

Use this loop for AI-assisted development in any project. Technology adapters may change commands and files, not the lifecycle.

## Contract

1. `Intake`: state the accepted `Outcome`, technically enforced operating envelope, `Non-Goals`, non-deferrable invariants, happy path, validation boundary, touched ownership, and meaningful failure boundaries.
2. `Evidence`: inspect source, tests, schemas, config, preserved stdout/stderr, logs, exceptions, and artifacts before trusting summaries.
3. `Baseline Proof`: reproduce current behavior when feasible.
4. `Small Slice`: implement the smallest useful increment; prefer remove/narrow/reuse/local guard, preserve unrelated work, and use `split-or-justify` rather than adding a responsibility to an already mixed file.
5. `Happy Path`: main is the default production author for Ordinary Small and Material.
6. `Runtime Proof`: run-observe-correct at the nearest representative boundary and retain invocation/input, identity, exit status, stdout/stderr, relevant logs/exceptions, side effects, and artifact paths. Inspect preserved diagnostics before mutation or rerun. Compilation or unit checks alone are not proof. Current proof sets `Development-Stage: MVP`.
7. `Accepted Scope`: complete required scope without optional polishing. Product Candidate mutation returns to development and invalidates dependent proof; runner, evaluator, environment, and report changes invalidate only affected evidence. Current affected proof restores MVP.
8. `Optional Risk Discovery`: Optional final-candidate, delivery, code-quality, or domain review may run after MVP only for concrete risk, project policy, or the owner. Missing or unusable optional evidence is not itself a stage blocker; reviewers never authorize mutation.
9. `Critical SDET`: Material behavior uses fresh test-only critical SDET returning `critical-risks-reported | no-critical-risk | blocked`. Continue only after a main-confirmed critical defect, fix, and new proof; the first valid no-critical attempt permanently stops the loop. Non-critical findings are parked.
10. `Validation And RC`: complete applicable project-native validation. Accepted scope complete, green validation, and no known critical/non-deferrable defect freezes the next `RC<n>`.
11. `Stable Handoff`: promote the same RC to stable after local handoff. Known documented non-critical limitations are allowed. `Stable Candidate: RC<n>` identifies it; external operations remain separately authorized.
12. `Process Improvement`: record recurring workflow friction and prefer deterministic automation over more prose.

Profiles remain `Ordinary Small | Material`. User-owned scope is the accepted outcome and protected-boundary decisions; necessary local reversible dependency closure is autonomous. Reviewer/SDET evidence must never authorize mutation. A partial slice handoff must not end an unfinished root goal.

## Quality Defaults

- MVP requires real happy-path execution.
- Current work must preserve local comprehensibility: line count is a signal rather than a quota, existing unrelated debt may remain, and new responsibility in mixed code requires cohesive extraction or `split-or-justify`.
- Current work must preserve the original exception cause/stack and sufficient safe diagnostic context at meaningful failure boundaries; duplicate/noisy logging and optional observability polish are not required.
- RC requires completed accepted scope and green applicable validation.
- Material RC additionally requires usable terminal critical-SDET evidence.
- Known non-critical bugs, limitations, coverage gaps, and optimization opportunities are recorded but do not block RC or stable.
- No hard bug-count, coverage, or soak-time threshold is required.

## Output Shape

- `Outcome`: working | not working | unknown.
- `Candidate Reference`: readable Product Candidate plus runner/evaluator/environment identities when applicable, or none.
- `Raw Evidence Bundle`: immutable observations and lane status, or N/A with reason.
- `Runtime Proof`: boundary, input, expected/actual observation, exit status, stdout/stderr, logs/exceptions, side effects, and artifact paths.
- `Architecture`: touched responsibilities and `split-or-justify` decisions, or N/A with reason.
- `Diagnostics`: captured evidence and smallest instrumentation decision, or N/A with reason.
- `Critical SDET`: terminal state or N/A with reason.
- `Validation`: commands and outcomes.
- `Known Non-Critical Limitations`: list or none.
- `Development-Stage: development | MVP | RC<n> | stable`.
- `Stable Candidate: RC<n>`: only when stable.
- `External Operations`: not performed unless separately authorized.
