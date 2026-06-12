# Autopilot Contract Validation Spec

## ADDED Requirements

### Requirement: Layered Autopilot Validation Checks

Autopilot SHALL provide deterministic local validation checks that can run at cheap, standard, pre-push, and final strictness levels.

#### Scenario: Cheap check validates affected ledgers without heavy commands

- **GIVEN** one or more active Autopilot task ledgers exist
- **WHEN** the cheap Autopilot check runs
- **THEN** it validates scoped or affected ledgers against the Autopilot ledger contract
- **AND** it reports task status and actionability summaries when available
- **AND** it does not run the full repository test suite or mutate protected Autopilot paths

#### Scenario: No active ledgers exist

- **GIVEN** no active Autopilot task ledgers exist
- **WHEN** an unscoped cheap, standard, or pre-push Autopilot check runs
- **THEN** the ledger check is reported as not-applicable or passed with an explicit no-ledgers summary
- **AND** the absence of ledgers does not fail the gate by itself

#### Scenario: Explicitly scoped ledger is missing

- **GIVEN** the caller scopes an Autopilot check to a specific task ledger path
- **WHEN** that path is missing, outside the repository, archived unexpectedly, or unreadable
- **THEN** the check fails with a clear blocking error

### Requirement: Pre-Push Gate Includes Autopilot Ledger Coverage

The repository pre-push validation SHALL include active Autopilot task ledger validation when active ledgers are discovered.

#### Scenario: Active ledger is invalid before push

- **GIVEN** an active `openspec/changes/*/automation/task.json` ledger exists
- **AND** the ledger violates the Autopilot ledger contract
- **WHEN** the pre-push validation plan runs
- **THEN** the `Autopilot ledger validation` gate fails with the ledger validation errors
- **AND** later gates do not hide the failure

#### Scenario: Multiple active ledgers are present

- **GIVEN** multiple active Autopilot task ledgers exist
- **WHEN** the pre-push validation plan runs
- **THEN** it validates every discovered active ledger in a deterministic order
- **AND** archived ledgers under `openspec/changes/archive/**` are excluded from active pre-push ledger coverage

### Requirement: Validation Plans Are Deduplicated And Cost-Aware

Autopilot validation planning SHALL avoid duplicated heavy commands while preserving blocking safety.

#### Scenario: Evidence validation and pre-push both require repository tests

- **GIVEN** a pre-push plan already includes `npm test`
- **AND** an Autopilot evidence plan for an active change also lists `npm test`
- **WHEN** the combined pre-push Autopilot validation plan is built
- **THEN** the command is executed at most once for the same working directory and arguments
- **AND** both evidence records can reference the shared result

#### Scenario: Frequent checkpoint uses cheap mode

- **GIVEN** an agent just completed a phase transition or collected a worker report
- **WHEN** it runs the cheap Autopilot check
- **THEN** only cheap ledger/status/freshness-advisory checks run
- **AND** expensive repository-wide gates are reserved for standard, pre-push, or final checks

### Requirement: Evidence Freshness Is Checked Before Final Claims

Autopilot validation SHALL check report, checklist, and ledger freshness before MR handoff, ready-to-land, release, or archive claims.

#### Scenario: Report claims completion while task state disagrees

- **GIVEN** an Autopilot report says a change is complete, ready-to-land, or archive-ready
- **AND** `tasks.md`, active ledger status, or current tool output contradicts that claim
- **WHEN** a standard, pre-push, or final Autopilot check evaluates the change
- **THEN** it reports a freshness or consistency error according to the gate level
- **AND** final/archive gates block until the mismatch is corrected or explicitly justified

#### Scenario: Freshness evidence is unsupported

- **GIVEN** an active change contains prose that cannot be tied to a stable fixture, task checklist, report output, ledger, or validation result
- **WHEN** the Autopilot check evaluates freshness
- **THEN** it reports `unknown` or `unsupported` instead of guessing pass or fail
- **AND** the unknown status becomes blocking only when a final claim depends on that evidence

### Requirement: Final Checks Include Retrospective Archive Gates

Autopilot final validation SHALL include retrospective follow-up generation and the retrospective archive gate when a scoped change is being archived or claimed archive-ready.

#### Scenario: Final check runs before archive

- **GIVEN** a completed OpenSpec change is scoped for final Autopilot validation
- **WHEN** the final check runs
- **THEN** it runs or plans `npm run openspec:retro-followups -- <change-id>` before the retrospective gate when available
- **AND** it runs or plans `npm run openspec:retro-gate -- <change-id>`
- **AND** archive readiness is blocked when the retro gate fails or actionable findings lack generated follow-up changes

### Requirement: Autopilot Check Output Is Machine-Readable

Autopilot validation checks SHALL emit stable machine-readable output suitable for agents, hooks, and future plugin wrappers.

#### Scenario: Blocking check fails

- **GIVEN** a blocking Autopilot check fails
- **WHEN** the checker exits
- **THEN** it returns a non-zero exit code
- **AND** the output includes the failed check id, label, source, summary, blocking flag, and suggested next action

#### Scenario: Warning is non-blocking by default

- **GIVEN** an Autopilot check produces warning-only findings
- **WHEN** the checker runs without strict warning mode
- **THEN** it exits successfully while reporting the warnings
- **AND** strict warning mode can convert warnings into a non-zero exit when repository policy requires it
