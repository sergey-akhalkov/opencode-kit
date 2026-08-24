## ADDED Requirements

### Requirement: Completion adjudication preserves claim-evidence closure
When a current human requirement or active OpenSpec outcome contains a triggered broad claim, the bounded completion evidence supplied to the arbiter SHALL include the current claim identifier, class, accepted outcome reference, population and coverage basis, production and comparison paths, environment and real-oracle status, unresolved material observations, evidence-lane references, independent-challenge status, disposition, and maximum supported claim. Missing or truncated closure evidence SHALL remain an explicit gap.

The arbiter SHALL return `continue` when the current root attempts to stop with a broader claim than the supplied closure supports and a bounded autonomous closure or honest artifact correction remains. It SHALL preserve a narrower supported result without representing the original broad requirement complete. It SHALL NOT infer semantic partitions, equivalence, non-applicability, compatibility, safety, or population closure from assistant prose, task checkboxes, aggregate test counts, or green validation.

#### Scenario: Representative completion is over-broad
- **WHEN** completion evidence contains a passing representative real case but the current finite-population or phase claim has incomplete matching rows
- **THEN** the arbiter returns `continue` with the exact claim-evidence gap and next bounded closure action
- **AND** it retains the representative case only at its supplied claim ceiling.

#### Scenario: Complete exact claim may stop
- **WHEN** every current human requirement has matching supported closure, current evidence, completed accepted scope, and no autonomous unresolved action
- **THEN** the arbiter may return `allow_stop`
- **AND** the verdict cannot widen the supplied maximum claim or approve lifecycle, release, deployment, or protected effects.

#### Scenario: Closure evidence is truncated
- **WHEN** bounded projection omits an acceptance-critical population, path, oracle, unresolved-observation, or disposition field
- **THEN** the arbiter cannot infer completion and returns a conservative evidence gap
- **AND** the guard does not retry by removing another required closure field.
