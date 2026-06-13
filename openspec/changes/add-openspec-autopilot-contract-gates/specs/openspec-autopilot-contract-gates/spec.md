# OpenSpec Autopilot Contract Gates Spec

## ADDED Requirements

### Requirement: Retrospective Status Is Finite And Read-Only

OpenSpec retrospective/archive readiness SHALL be exposed through a deterministic read-only status command.

#### Scenario: Retro status reports archive readiness

- **GIVEN** a change has completed tasks, valid `automation/retro.json`, required follow-up changes, and passing retro gate evidence
- **WHEN** `openspec:retro-status` runs for the change
- **THEN** it returns `state: "archive-ready"`
- **AND** `blockers[]` is empty
- **AND** `nextActions[]` is stable and deterministic

#### Scenario: Retro is missing

- **GIVEN** a change has no `automation/retro.json`
- **WHEN** retro status runs
- **THEN** it returns `state: "missing-retro"`
- **AND** it includes the minimal next action needed to create or migrate the JSON retrospective

#### Scenario: Follow-ups are stale or missing

- **GIVEN** actionable retrospective problems require follow-up changes
- **WHEN** retro status runs before follow-ups exist or after generated follow-up evidence drifts
- **THEN** it returns `followups-required` or `followups-stale`
- **AND** it lists required mutations without applying them

### Requirement: Legacy Retrospective Markdown Is Controlled

OpenSpec automation retrospective evidence SHALL be JSON-backed and legacy Markdown wrappers SHALL not be extended silently.

#### Scenario: New active retrospective Markdown wrapper is introduced

- **GIVEN** an active change contains `retrospective.md` as an automation retrospective wrapper
- **WHEN** repository validation runs
- **THEN** validation fails or warns according to the documented active/archive enforcement policy
- **AND** the output points to `automation/retro.json` as the canonical replacement

#### Scenario: Legacy retrospective is migrated explicitly

- **GIVEN** a supported legacy `retrospective.md` exists
- **WHEN** an explicit migration mode runs
- **THEN** it creates or updates `automation/retro.json` with schema version, evidence reviewed, problems, outputs, and archive gate decision
- **AND** unsupported or ambiguous legacy content is reported as `blocked` instead of guessed

### Requirement: Autopilot Documentation Fragments Track Source Contracts

Autopilot finite contracts SHALL be generated or checked from TypeScript source-level contracts.

#### Scenario: Reason code list is synchronized

- **GIVEN** source contracts define public Autopilot reason codes
- **WHEN** `autopilot:docs-check` runs
- **THEN** marked README and skill fragments list the same values in stable order

#### Scenario: Documentation fragment drifts

- **GIVEN** a marked Autopilot contract fragment omits or adds a finite enum value not present in source
- **WHEN** docs check runs
- **THEN** validation fails with the fragment id and expected content or hash

### Requirement: Skills Consume Status And Docs Checks

OpenSpec and Autopilot skills SHALL rely on deterministic status/docs checks for finite contracts instead of duplicating full checklist logic.

#### Scenario: Archive skill checks retrospective readiness

- **GIVEN** archive readiness is being evaluated
- **WHEN** the archive skill needs retrospective status
- **THEN** it calls or requests `openspec:retro-status` when available
- **AND** it treats status blockers as authoritative deterministic evidence

#### Scenario: Autopilot skill documents finite contracts

- **GIVEN** finite Autopilot enums or public tool names change
- **WHEN** validation runs
- **THEN** stale README/skill contract fragments are detected before merge
