# OpenSpec Retrospective Spec

## ADDED Requirements

### Requirement: Retrospective Required Before Archive

An OpenSpec change SHALL NOT be archived until a change-specific retrospective is completed or an explicit approved skip reason is recorded.

#### Scenario: Change is ready for archive

- **GIVEN** an OpenSpec change has completed implementation, validation, review, and acceptance work
- **WHEN** archive is requested
- **THEN** the archive workflow checks for `retrospective.md`
- **AND** archive proceeds only if the retrospective records a passed archive gate or an approved skip reason

#### Scenario: Retrospective is missing

- **GIVEN** an OpenSpec change has no `retrospective.md`
- **WHEN** archive is requested
- **THEN** archive is blocked
- **AND** the user is told to run the change-specific retrospective first

### Requirement: Retrospective Task Is Final In Task Lists

Every new OpenSpec change task list SHALL include a final retrospective section before archive.

#### Scenario: New change is proposed

- **GIVEN** a new OpenSpec change is created
- **WHEN** `tasks.md` is written
- **THEN** the final task section requires reviewing completed context, writing `retrospective.md`, routing findings, and confirming the archive gate

### Requirement: Retrospective Reviews Full Work Context

The retrospective SHALL inspect the full reachable work context proportionally to the change scope.

#### Scenario: Retrospective is performed

- **GIVEN** a change has artifacts, validation results, reviewer outputs, tool outputs, blockers, reports, or MR context
- **WHEN** the retrospective is written
- **THEN** it records which evidence sources were reviewed
- **AND** it records unavailable sources as `unknown`, `unavailable`, or blocked with reason
- **AND** it does not invent evidence

### Requirement: Retrospective Searches For Workflow And Token Waste

The retrospective SHALL look for process problems that reduce quality or speed or waste tokens.

#### Scenario: Workflow friction exists

- **GIVEN** repeated commands, repeated context reconstruction, manual report synthesis, large outputs, long waits, weak gates, or unclear tool output occurred
- **WHEN** the retrospective evaluates the change
- **THEN** it records the problem with evidence, impact, recommendation, confidence, and target owner

### Requirement: Findings Become Durable Follow-Ups

Retrospective findings SHALL become durable follow-up artifacts unless explicitly dismissed with reason.

#### Scenario: Project-local finding is confirmed

- **GIVEN** a retrospective finding applies to the current project only
- **WHEN** the finding is not fixed immediately in approved scope
- **THEN** the retrospective creates or references a current-project OpenSpec follow-up change

#### Scenario: Reusable workflow finding is confirmed

- **GIVEN** a retrospective finding applies to Autopilot, reusable skills, agents, instructions, validators, evidence packs, or shared OpenCode workflow
- **WHEN** the finding is not fixed immediately in approved scope
- **THEN** the retrospective creates or references an `opencode-dev-kit` OpenSpec proposal/change or a local handoff artifact for one

#### Scenario: No findings are found

- **GIVEN** the retrospective finds no actionable problems
- **WHEN** archive is requested
- **THEN** `retrospective.md` records `No findings` with evidence reviewed
- **AND** archive may proceed

### Requirement: Retro Gate Is Machine-Checkable

The retrospective gate SHALL be enforceable by deterministic validation once the gate implementation is approved.

#### Scenario: Retro gate helper runs

- **GIVEN** a change id
- **WHEN** the retro gate helper runs
- **THEN** it reports whether `tasks.md` includes a final retro task
- **AND** whether `retrospective.md` exists and includes evidence, outputs, and archive decision
- **AND** whether archive is allowed
- **AND** it returns stable JSON without model-like summarization
