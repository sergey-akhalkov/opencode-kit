## MODIFIED Requirements

### Requirement: Every behavior dependency chain gets the earliest safe real signal

For every behavior-changing slice, the active runtime authority SHALL identify and execute the first safely reachable real boundary sufficient to observe the still-current accepted effect rather than defer all real-system feedback to phase completion or climb merely because a higher rung is authorized. Authority SHALL remain a ceiling, not a fidelity target. A higher rung SHALL become required only when a current accepted requirement, non-deferrable invariant, or unresolved equivalence risk cannot be observed at the lower real boundary.

The proof ladder SHALL distinguish deterministic offline or preserved replay, local integration or simulator, shadow/read-only real dependency, bounded live effects, and end-to-end user or operator workflow. Offline, unit, mock, replay, and simulator evidence SHALL remain useful fast feedback but SHALL NOT be represented as proof of a reachable real boundary or behavior that depends on a higher rung.

The roadmap SHALL optimize time-to-first-real-signal. When a harness, identity check, independent effect suppression, capture schema, restoration procedure, or owner authorization packet is the smallest prerequisite for sufficient real feedback, that prerequisite SHALL precede more behavior that depends on the unverified real-system model.

#### Scenario: Read-only real characterization is safely reachable

- **WHEN** a feature can be exercised against a real dependency in an independently enforced read-only or no-effect envelope after separate owner authorization and that boundary observes the accepted effect
- **THEN** the roadmap places the minimal harness and authorization gate before further dependent model expansion
- **AND** the authorized characterization records exact input, environment and initial state, output and state transitions, ordering, timing, failures, recovery, cleanup, and restoration.

#### Scenario: An authorized higher rung is unnecessary for the accepted effect

- **WHEN** a lower real boundary observes the still-current accepted effect and a higher end-to-end rung introduces protected prerequisites that belong only to behavior excluded by the accepted non-goals
- **THEN** main proves the accepted effect at the lower boundary and does not treat authority for the higher rung as a requirement to climb
- **AND** it records the narrower claim ceiling and neither bypasses the protected prerequisites nor claims the excluded end-to-end behavior.

#### Scenario: A higher rung is necessary for an accepted requirement

- **WHEN** the accepted observable proof, non-deferrable invariant, or equivalence contract depends on behavior that the lower boundary cannot observe
- **THEN** the higher rung remains the next required real boundary with its exact authorization, safeguards, restoration, cleanup, and evidence gate
- **AND** lower-rung success does not complete or waive that requirement.

#### Scenario: Only offline evidence is currently reachable

- **WHEN** the first sufficient real boundary is unavailable, unauthorized, unsafe, or blocked by a path-scoped live-attempt gate
- **THEN** the current slice executes the highest-fidelity safe offline or local boundary as support evidence without claiming the real effect
- **AND** records the exact blocked path, earliest unblocking or goal-preserving replan task, required authorization and safeguards, restoration procedure, and expected real evidence.

### Requirement: Unknown real behavior stops only dependent expansion

When missing, unobservable, or mismatched real behavior can invalidate planned downstream behavior required by the still-current accepted outcome, the main session SHALL stop adding behavior in that dependency chain until characterization or equivalence evidence resolves the uncertainty. Independent work that does not rely on that uncertainty MAY continue.

When the unknown behavior or protected prerequisite belongs only to an agent-chosen path and the accepted outcome admits another safe real route, main SHALL keep the affected path and its Live-Attempt Gate blocked, autonomously reconcile planning controls, and continue through the goal-preserving route without representing it as proof of the blocked path. If the original accepted outcome itself requires owner authorization or unavailable external capability and no safe real substitute remains, main SHALL raise the decision at the first safe, decision-ready gate rather than defer it to final qualification.

#### Scenario: Emulator behavior relies on an uncharacterized state transition

- **WHEN** the next emulator layer depends on a real-system state transition whose output, ordering, side effects, or recovery semantics are unknown
- **THEN** dependent emulator expansion stops before that layer
- **AND** independent parser, diagnostics, or harness work MAY continue when it does not assume the unknown transition.

#### Scenario: Blocked live path is not the root outcome

- **WHEN** a live-attempt gate blocks repetition of one proof path but another safe real route can observe the accepted effect without weakening an invariant or protected boundary
- **THEN** main scopes the blocked gate to that exact path, reconciles the plan, and continues the original outcome through the alternate route
- **AND** evidence from the alternate route does not clear, waive, or claim the blocked path.

#### Scenario: Every sufficient route requires the protected action

- **WHEN** the original accepted outcome requires an effect that no safe real route can observe without an exact protected owner action
- **THEN** main stops the affected outcome at the decision-ready owner boundary
- **AND** no lower-fidelity support evidence, artifact rewrite, or process-control update substitutes for that action.
