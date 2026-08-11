## ADDED Requirements

### Requirement: Every behavior dependency chain gets the earliest safe real signal

For every behavior-changing slice, the active runtime authority SHALL identify and execute the earliest safely reachable real boundary rather than defer all real-system feedback to phase completion. The proof ladder SHALL distinguish deterministic offline or preserved replay, local integration or simulator, shadow/read-only real dependency, bounded live effects, and end-to-end user or operator workflow. Offline, unit, mock, replay, and simulator evidence SHALL remain useful fast feedback but SHALL NOT be represented as proof of a reachable real boundary.

The roadmap SHALL optimize time-to-first-real-signal. When a harness, identity check, independent effect suppression, capture schema, restoration procedure, or owner authorization packet is the smallest prerequisite for real feedback, that prerequisite SHALL precede more behavior that depends on the unverified real-system model.

#### Scenario: Read-only real characterization is safely reachable

- **WHEN** a feature can be exercised against a real dependency in an independently enforced read-only or no-effect envelope after separate owner authorization
- **THEN** the roadmap places the minimal harness and authorization gate before further dependent model expansion
- **AND** the authorized characterization records exact input, environment and initial state, output and state transitions, ordering, timing, failures, recovery, cleanup, and restoration.

#### Scenario: Only offline evidence is currently reachable

- **WHEN** the next real boundary is unavailable, unauthorized, unsafe, or blocked by a live-attempt gate
- **THEN** the current slice executes the highest-fidelity safe offline or local boundary
- **AND** records the exact blocker, earliest unblocking task, required authorization and safeguards, restoration procedure, and expected real evidence.

### Requirement: Unknown real behavior stops only dependent expansion

When missing, unobservable, or mismatched real behavior can invalidate planned downstream behavior, the main session SHALL stop adding behavior in that dependency chain until characterization or equivalence evidence resolves the uncertainty. Independent work that does not rely on that uncertainty MAY continue. If owner authorization or external capability is the remaining blocker, the main session SHALL raise the decision at the first safe, decision-ready gate rather than defer it to final qualification.

#### Scenario: Emulator behavior relies on an uncharacterized state transition

- **WHEN** the next emulator layer depends on a real-system state transition whose output, ordering, side effects, or recovery semantics are unknown
- **THEN** dependent emulator expansion stops before that layer
- **AND** independent parser, diagnostics, or harness work MAY continue when it does not assume the unknown transition.

### Requirement: Shift-left sequencing does not grant live authority

The shift-left contract SHALL NOT authorize credentials, remote or shared-environment access, physical effects, destructive or irreversible action, deployment, installation, activation, release, publication, or owner-controlled cost. Existing protected-boundary decisions, fail-closed safety and identity guards, restoration and cleanup, immutable evidence, equivalence requirements, and blocked-live-attempt offline replay SHALL remain controlling.

Early per-slice characterization and Runtime Proof SHALL remain production-author responsibilities, including the Proof Runner, capture/evaluator, and restoration tooling needed to obtain observations. Automated test harnesses, fixtures, simulators, goldens, and test-oracle artifacts SHALL remain SDET-owned. Material fresh critical-only SDET SHALL remain after current MVP proof and accepted-scope completion.

#### Scenario: A real boundary requires physical access

- **WHEN** the first useful real observation requires a physical, credentialed, shared, costly, or otherwise owner-controlled operation
- **THEN** local harness and safety preparation MAY proceed
- **AND** no live request occurs before exact owner authorization and all applicable fail-closed gates are green.
