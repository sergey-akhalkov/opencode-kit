## ADDED Requirements

### Requirement: Complete archive reports Kaizen harvest independently
The canonical agent-driven complete-archive workflow SHALL attempt a bounded Kaizen harvest checkpoint without adding that checkpoint, its reflection, or any derived improvement to the accepted task graph. The deterministic archive helper SHALL remain the owner of completion validation, official movement, post-archive validation, and `archived` status. Kaizen lifecycle state SHALL be reported separately and SHALL NOT waive, replace, repeat, roll back, or relabel any archive gate or result.

#### Scenario: Archive and harvest both complete
- **WHEN** deterministic complete archive returns `archived` and the separate harvest checkpoint closes as `captured` or `no-signal`
- **THEN** handoff reports both states with their own evidence refs
- **AND** no retrospective artifact or additional archive gate is introduced.

#### Scenario: Harvest remains a repair gap
- **WHEN** deterministic complete archive returns `archived` but an opened harvest checkpoint has no valid closure
- **THEN** handoff reports archive success and the harvest repair gap separately
- **AND** no repair-gap closure is written and later repair closes only the Kaizen checkpoint as `captured` or `no-signal` without repeating archive.

#### Scenario: Archive fails after harvest checkpoint opens
- **WHEN** a harvest checkpoint is open but deterministic complete archive does not return `archived`
- **THEN** the checkpoint closes as `archive-failed` when its store remains available
- **AND** handoff neither projects a repair gap nor claims archive success.

#### Scenario: Kaizen capture is unavailable
- **WHEN** the canonical archive workflow cannot open a Kaizen checkpoint
- **THEN** existing complete-archive gates determine whether archive may proceed
- **AND** handoff reports harvest `unavailable` without inventing a persisted repair gap.
