## MODIFIED Requirements

### Requirement: SDLC-012 Outcome-first slices minimize sufficient lifecycle complexity
The portable runtime instructions SHALL optimize for the earliest useful working increment that satisfies the accepted outcome and non-deferrable invariants inside an explicitly enforced operating envelope. Simplicity SHALL mean the fewest capabilities, reachable modes, states, configuration dimensions, recovery paths, compatibility paths, owner boundaries, and abstractions sufficient for that increment, not merely the fewest lines of code.

Before adding a new mechanism or abstraction, the main session and implementation roles SHALL consider, in order: removing an unnecessary capability; narrowing users, data, interfaces, modes, load, concurrency, persistence, or side effects; reusing an existing project/platform mechanism; and adding a local guard, validation, or focused test. Multiple new coordination, recovery, compatibility, policy, or evidence mechanisms SHALL require presenting a narrower slice or explicit evidence that the simpler options cannot satisfy the accepted increment.

A new package dependency; top-level module, service, executable tool, or reusable API; parser, serializer, validator, adapter, client/protocol, cache, queue, retry, scheduler, simulator, or proof harness outside an existing owner; interface, factory, plugin point, or multi-implementation abstraction; or another implementation of repeated behavior SHALL trigger bounded reuse discovery before production code. The discovery SHALL follow the active `library-reuse-discovery` source order and SHALL record one compact `reuse | extend | build-minimal` disposition based on current contract fit and total lifecycle cost.

An owner-local bug fix, data/config edit, generated-output change, mechanical edit, or glue under an already selected API SHALL NOT trigger registry or ecosystem discovery unless it independently adds a triggered mechanism. A registry/cache outage SHALL be explicit degraded evidence rather than a silent skip; it SHALL not block minimal local code completion, authorize a portability claim, or justify speculative abstractions.

Risk classification SHALL evaluate behavior reachable inside the proposed operating envelope. A relied-upon envelope limit SHALL remove a risk from current reachability only when the candidate or an accepted existing project mechanism enforces that limit. A prose-only, ambiguous, or bypassable limit SHALL NOT reduce risk classification.

#### Scenario: Scope reduction removes unnecessary concurrency
- **WHEN** the first useful increment can be restricted by an enforced single-worker or single-user boundary
- **THEN** the agent SHALL prefer that bounded slice over adding locks, distributed coordination, retries, and recovery state for unreachable concurrent use
- **AND** future concurrency SHALL remain explicit non-goal or follow-up scope.

#### Scenario: Prose-only containment does not reduce risk
- **WHEN** a proposed pilot says "single tenant only" but no accepted mechanism prevents another tenant from reaching the behavior
- **THEN** multi-tenant effects SHALL remain reachable for risk classification
- **AND** the candidate SHALL NOT receive a simplified disposition based on prose alone.

#### Scenario: Existing mechanism is preferred
- **WHEN** an existing feature flag, allowlist, read-only mode, queue, transaction, or project-native boundary can enforce the accepted slice
- **THEN** the implementation SHALL reuse it unless evidence shows it cannot meet the current outcome
- **AND** SHALL NOT add a parallel mechanism for hypothetical future flexibility.

#### Scenario: New parser triggers discovery
- **WHEN** a task would introduce a parser not already owned by the touched subsystem
- **THEN** the author SHALL complete bounded reuse discovery before parser production code
- **AND** the disposition SHALL select reuse, extension, or the smallest concrete custom owner.

#### Scenario: Owner-local correction remains proportional
- **WHEN** a defect correction changes only an existing cohesive owner and adds no triggered mechanism
- **THEN** the author SHALL use targeted local evidence without loading reuse-discovery detail or querying the central registry
- **AND** the change SHALL retain Ordinary Small routing when no other Material trigger applies.

#### Scenario: Registry discovery is degraded
- **WHEN** triggered work has neither a readable registry nor a matching validated cache
- **THEN** the author SHALL record the blocked cross-project layer and continue through safe local and applicable ecosystem sources
- **AND** any custom implementation SHALL remain minimal and SHALL NOT be called reusable or portable until later verification.
