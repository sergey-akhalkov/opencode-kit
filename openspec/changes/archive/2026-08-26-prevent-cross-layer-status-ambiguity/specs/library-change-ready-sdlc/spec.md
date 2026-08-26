## ADDED Requirements

### Requirement: Live-Attempt Gate reporting remains path-scoped

Every reported `Live-Attempt Gate: clear | blocked | unknown` SHALL name the exact governed invocation or proof path. A non-clear classification SHALL state its missing or failing gate evidence and SHALL state the operational consequence separately. The gate classification SHALL NOT imply resource availability, action authority, environment readiness, or accepted-outcome state; those facts SHALL be reported independently when material and SHALL remain `unknown` only when their own evidence is missing. A clear gate SHALL remain evidence about repeat eligibility for the named path and SHALL NOT grant authority for the underlying protected action.

#### Scenario: Gate evidence is unknown while the resource is available
- **WHEN** a controller, service, or other resource is known available and authorized but terminal replay evidence for one named live proof path is incomplete
- **THEN** the report states `Live-Attempt Gate: unknown` for that path and separately preserves the known resource and authority facts
- **AND** it states that another high-cost live attempt through only that path remains blocked until the named unlock condition is satisfied.

#### Scenario: Resource availability and gate state are both unknown
- **WHEN** current evidence establishes neither resource availability nor the replay state of the named live proof path
- **THEN** the report records both unknowns as separate facts with their respective missing evidence
- **AND** it does not collapse them into one unsupported resource, path, authority, or outcome assertion.

#### Scenario: Path-only gate does not block the accepted outcome
- **WHEN** one live proof path is blocked or unknown and a safe dependency-valid offline or alternate sufficient route can still advance the accepted outcome
- **THEN** the report keeps the named path blocked and states the available next route
- **AND** it does not report the accepted outcome as blocked or ask the owner to restore an already known available resource.

#### Scenario: Clear gate does not authorize the underlying action
- **WHEN** preserved-corpus replay clears the Live-Attempt Gate for a named path but the underlying live action still requires separate authorization or safeguards
- **THEN** the report states the clear path gate and the separate unresolved authority or safeguard state
- **AND** no live action is performed or described as authorized solely because the gate is clear.
