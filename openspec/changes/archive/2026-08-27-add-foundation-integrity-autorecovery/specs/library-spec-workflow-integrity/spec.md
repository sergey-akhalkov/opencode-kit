## ADDED Requirements

### Requirement: Foundation invalidation propagates through current planning without rewriting history
After main confirms a foundation defect, the workflow SHALL enumerate every active
change, current canonical specification, and active structured claim record and
classify its material dependence on the invalidated relation before mutation.
Dependence SHALL require a current workload, profile/configuration, environment,
oracle, production/comparison path, or claim binding; a historical-only mention
SHALL remain unaffected.

Main SHALL update the smallest coherent proposal/design/spec/tasks/history and claim
set for each dependent active change, reopen or add only outcome-required tasks,
and serialize corrections under existing ownership and overlap rules. Unrelated
active artifacts SHALL remain untouched. Canonical OpenSpec behavior SHALL change
through a corrective active delta and normal synchronization rather than an
agent-driven direct main-spec edit.

Completed and archived evidence SHALL remain immutable. Current records SHALL
preserve each prior result at its strongest truthful narrower ceiling and SHALL NOT
represent a historical, cross-profile, component, regression, or different-
environment result as current foundation proof.

#### Scenario: Sweep finds dependent and unrelated active changes
- **WHEN** the complete active inventory contains one change that binds the invalid identity and one that does not
- **THEN** only the dependent change and its current claim/spec dependencies are corrected
- **AND** the unrelated change is classified `not-dependent` and remains unchanged.

#### Scenario: Main requirement contains the invalid current relation
- **WHEN** a canonical specification asserts the invalid identity as current
- **THEN** recovery creates or uses an active corrective delta owned by one change
- **AND** direct ad hoc mutation of the main specification is not the recovery mechanism.

#### Scenario: Prior evidence remains useful below a narrower ceiling
- **WHEN** preserved proof remains valid for exact bytes on the exercised historical path but cannot support the corrected current outcome
- **THEN** current claim records retain that proof with its narrower historical or component ceiling
- **AND** archived evidence bytes and history remain unchanged.

### Requirement: Foundation recovery episodes have explicit terminal state
Each confirmed foundation recovery SHALL record one stable incident identity, the
reproduced contradiction, affected relation and candidate, complete dependent active
artifact inventory, corrections, evidence narrowing, fresh re-review identity, and
one terminal state `falsified | owner-boundary | closed`. The same incident,
candidate, and evidence SHALL NOT create a second recovery change or equivalent
review. A closed incident MAY reopen only for a new candidate identity or new
decision-changing evidence that establishes a distinct current relation.

#### Scenario: Same finding repeats after correction
- **WHEN** fresh corrected-candidate review repeats the same relation finding without new candidate or evidence identity
- **THEN** the workflow does not create another incident or successor change
- **AND** main treats any reproduced remaining gap as a correction defect inside the current recovery episode.

#### Scenario: New evidence changes the current relation
- **WHEN** a closed incident receives new decision-changing source or runtime evidence that binds a materially different current foundation identity
- **THEN** a distinct incident may be opened with the new identities and evidence
- **AND** the prior incident and its evidence remain preserved.
