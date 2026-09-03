## ADDED Requirements

### Requirement: Optional portfolio projection preserves Kaizen evidence authority
When the separately installed and explicitly enabled Beads portfolio bridge is current for the signal's registered project, explicit triage MAY project one evidence-confirmed `project-change` or `kit-candidate` decision to one correlated Beads feature. A `project-change` SHALL match the enabled registration's derived project ref against the signal's recorded project refs; a `kit-candidate` SHALL match an enabled `opencode-kit` semantic owner registration and SHALL not require the consumer or triage-session project ref to equal the kit ref. Kaizen SHALL remain the sole owner of raw signal payload, occurrence identity/count, privacy filtering, decision evidence, archive checkpoints, and signal lifecycle. The projection SHALL store only privacy-safe refs and bounded reviewed feature context in Beads and SHALL not migrate or duplicate the Kaizen signal store.

When the bridge is absent, disabled, unsupported, unregistered, busy, or inconsistent, current Kaizen capture, status, triage, decision, and direct kit-rooted proposal behavior SHALL remain available under their existing contracts. No Kaizen controller SHALL persist a second admitted portfolio identity, status graph, dependency graph, priority, assignment, or terminal authority while Beads is selected as that project's portfolio owner. For that one explicitly enabled project, a Grind-local execution/routing record SHALL reference the canonical Beads ID and MAY retain only its execution ref, run/cycle and source-decision refs, project/registration/candidate digests, exact execution-prerequisite refs, route, gate/retry, Campaign/Mission/session refs, and resulting execution handoff. It SHALL not become another portfolio item, copy Beads-owned state, or independently assert terminal closure. No Beads identity or ownership SHALL be inferred for another Grind registration.

#### Scenario: Eligible decision uses the enabled portfolio bridge
- **WHEN** explicit triage establishes one eligible known owner and the matching project registration selects a current Beads bridge
- **THEN** one privacy-safe correlation may be created to the canonical Beads feature
- **AND** Kaizen retains its original signal, occurrences, decision, and lifecycle events as evidence.

#### Scenario: Portfolio bridge is unavailable
- **WHEN** capture or triage runs while the Beads bridge is absent, disabled, unsupported, or gated
- **THEN** Kaizen records and reports its current evidence and exact bridge gate without data loss
- **AND** it neither acknowledges a Beads feature nor disables ordinary Kaizen behavior.

#### Scenario: Repeated signals look like votes
- **WHEN** one signal accumulates repeated occurrences or multiple agent/session refs
- **THEN** status may present those current counts and refs as bounded evidence
- **AND** neither Kaizen nor Beads automatically changes admission, priority, readiness, assignment, or implementation authority.

#### Scenario: Another queue claims admitted work ownership
- **WHEN** current planning or runtime state would persist the same admitted improvement as both a Beads feature and a separate Kaizen portfolio identity/status graph
- **THEN** promotion fails before creating either competing identity
- **AND** requires one explicit current admitted-work owner while preserving the raw Kaizen signal and decision.

#### Scenario: Grind dispatches an admitted Beads feature
- **WHEN** a Grind cycle routes one canonical Beads feature into Campaign/Mission execution
- **THEN** its execution record references the Beads ID and retains only controller-owned execution identity, routing, gate, retry, campaign, mission, session, prerequisite, and execution-handoff facts
- **AND** reads portfolio status/dependencies/priority/assignment/duplicates/terminal result from Beads and the Kaizen bridge rather than persisting competing copies or closure authority.
