## ADDED Requirements

### Requirement: Preserve the reviewed report route

The disposable fixture SHALL preserve all reviewed reports and the unchanged validation oracle while selecting an earlier canary.

#### Scenario: Route changes before compaction

- **WHEN** two different defects repeatedly reach the same costly late boundary
- **THEN** design, tasks, and history record one earlier canary route
- **AND** proposal, specification, population, and oracle remain unchanged.
