# Autopilot Evidence Pack Spec

## ADDED Requirements

### Requirement: Deterministic Evidence Pack

Autopilot SHALL provide a deterministic evidence-pack workflow for regression and task execution evidence.

#### Scenario: Evidence is collected without mutation

- **GIVEN** an OpenSpec change id
- **WHEN** the evidence workflow runs in collect mode
- **THEN** it reads available ledgers and OpenSpec artifacts
- **AND** it returns stable JSON with ledgers, validation plan, reviewer plan, scenarios, findings, and residual risks
- **AND** it does not mutate protected Autopilot paths

### Requirement: Validation Plan And Results Are Separate

The evidence-pack workflow SHALL separate planned validation from executed validation.

#### Scenario: Validation is planned before execution

- **GIVEN** a change has validation commands in policy or ledger metadata
- **WHEN** collect mode runs
- **THEN** the evidence pack lists the commands and reasons without executing them

#### Scenario: Validation is executed explicitly

- **GIVEN** the caller requests validate mode
- **WHEN** approved validation commands run
- **THEN** the evidence pack records exit status and compact summaries
- **AND** long raw output is not returned inline unless explicitly requested

### Requirement: Reviewer Plan Is Evidence-Backed

The evidence-pack workflow SHALL produce a reviewer plan from deterministic signals.

#### Scenario: Task type requires reviewers

- **GIVEN** a task type or changed-file signal maps to reviewer gates
- **WHEN** the reviewer plan is generated
- **THEN** each reviewer is marked required, not-applicable, or requiring an explicit skip reason
- **AND** the workflow does not claim that any reviewer passed

### Requirement: Report Rendering Is Stable

The evidence-pack workflow SHALL render report-ready Markdown from evidence without model-like summarization.

#### Scenario: Report output is requested

- **GIVEN** an evidence pack and approved report path
- **WHEN** report mode runs
- **THEN** the Markdown includes scenario matrix, findings, follow-up changes, validation, reviewer gates, residual risks, and ready-to-land status
- **AND** generated sections are stable across runs for the same evidence

### Requirement: Freshness And Retrospective Evidence Are Included

The evidence-pack workflow SHALL include deterministic freshness and retrospective-ready evidence without replacing reviewer judgment.

#### Scenario: Freshness evidence is collected

- **GIVEN** a change has Autopilot reports, task checklists, ledgers, or validation evidence
- **WHEN** the evidence workflow runs in collect mode
- **THEN** it records freshness or consistency items as passed, warning, error, unknown, unavailable, or blocked
- **AND** it does not infer completion from prose without stable evidence

#### Scenario: Retrospective handoff is prepared

- **GIVEN** evidence collection finds repeated commands, stale evidence, no-progress loops, reviewer gaps, or routing friction
- **WHEN** report or collect mode emits evidence
- **THEN** it includes a retrospective-ready checklist and candidate follow-up routing
- **AND** it does not claim the retrospective gate has passed
