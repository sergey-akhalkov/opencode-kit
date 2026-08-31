## ADDED Requirements

### Requirement: OpenSpec apply SHALL maintain a dependency-valid grind frontier
For grind-enabled apply, current accepted tasks SHALL be reconciled into stable pending, running, complete, deferred, or blocked work items with explicit dependencies and scoped gate refs sufficient to identify the next dependency-valid task. A product decision SHALL park only its affected tasks. Apply SHALL continue every unblocked accepted task before presenting that decision and SHALL keep task, proof, and validation status honest.

#### Scenario: Blocked task has an independent sibling
- **WHEN** task 5.2 is blocked by a current product, access, process, capability, safety, or proof gate and task 5.3 has no dependency on task 5.2 or that gate
- **THEN** apply keeps task 5.2 unchecked with its resume condition and starts task 5.3
- **AND** does not ask whether to continue, check task 5.2, or claim the blocked evidence lane.

#### Scenario: Artifact order is stricter than accepted dependencies
- **WHEN** an agent-authored task order or stop-line serializes two tasks but current accepted semantics and evidence show that the later task is independent
- **THEN** apply reconciles the planning controls and executes the independent task
- **AND** preserves the prior artifact and attempt evidence without requesting process approval.

#### Scenario: Product decision affects all pending tasks
- **WHEN** every pending accepted task explicitly depends on one unresolved material product decision and no option-invariant task remains
- **THEN** apply preserves one consolidated product-decision handoff and the exact affected task set
- **AND** performs no decision-dependent implementation until a human answer updates the frontier.
