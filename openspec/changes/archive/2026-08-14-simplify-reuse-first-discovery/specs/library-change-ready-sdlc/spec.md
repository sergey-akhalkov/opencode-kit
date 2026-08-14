## MODIFIED Requirements

### Requirement: SDLC-012 Outcome-first slices minimize sufficient lifecycle complexity
The portable runtime instructions SHALL optimize for the earliest useful working increment that satisfies the accepted outcome and non-deferrable invariants inside an explicitly enforced operating envelope. Simplicity SHALL mean the fewest capabilities, reachable modes, states, configuration dimensions, recovery paths, compatibility paths, owner boundaries, and abstractions sufficient for that increment, not merely the fewest lines of code.

Before adding a package dependency, top-level mechanism or reusable API, out-of-owner infrastructure capability, multi-implementation abstraction, or another implementation of repeated behavior, the main session and implementation roles SHALL load the active reuse-discovery workflow and consider, in order: removing an unnecessary capability; narrowing users, data, interfaces, modes, load, concurrency, persistence, or side effects; reusing an existing current-repository or platform/dependency mechanism; using an explicitly configured cross-project source with current-source verification; and adding the smallest concrete local guard, validation, or focused test only when no verified candidate fits at lower total lifecycle cost. Owner-local fixes, data/config/generated/mechanical edits, and selected-API glue SHALL remain exempt unless they independently introduce a trigger. Multiple new coordination, recovery, compatibility, policy, or evidence mechanisms SHALL require presenting a narrower slice or explicit evidence that the simpler options cannot satisfy the accepted increment.

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

#### Scenario: New mechanism searches configured peers proportionally
- **WHEN** current-repository and platform/dependency evidence do not satisfy a triggered mechanism contract and an authorized cross-project source is explicitly configured
- **THEN** the author performs one bounded capability search and verifies promising current source before `build-minimal`
- **AND** does not enumerate unrelated projects or require a private registry.

#### Scenario: Local fix stays outside the workflow
- **WHEN** a bounded owner-local fix introduces no dependency, mechanism, reusable API, infrastructure owner, abstraction, or duplicate behavior
- **THEN** the author proceeds with targeted local evidence
- **AND** does not load reuse discovery or query cross-project sources.
