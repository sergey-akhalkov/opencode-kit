## ADDED Requirements

### Requirement: Main owns evidence-triggered next-change locality

The main session SHALL remain accountable for both the smallest complete current implementation and the concrete design and integration result that keeps the next plausible change local. The registered `architecture-and-change-locality` Practice Owner SHALL be responsible for the practice's trigger applicability, bounded observation, and maintenance semantics. A plausible change axis MUST be supported by an accepted requirement, an existing or explicitly planned variant, an inspected external or system boundary, a non-trivial state transition, an important invariant, or current source evidence. Hypothetical extensibility without one of those triggers SHALL NOT justify an abstraction or an owner call.

When a supported change axis exists, main SHALL name the responsibility or volatility being contained and select the smallest design seam that both isolates it and improves current comprehension, testability, safety, or change locality. When no supported axis exists, direct cohesive code SHALL remain the default. SOLID and Gang of Four patterns MAY describe a selected solution, but pattern use, pattern count, and formal pattern conformance SHALL NOT be acceptance criteria.

When a supported change axis exists, main SHALL obtain one bounded read-only observation from the registered `architecture-and-change-locality` Practice Owner before finalizing the owning design decision. Main SHALL retain that decision, implementation and integration responsibility when production work is delegated and SHALL communicate the applicable responsibility boundary, named change axis, and forbidden speculative structure through the existing production brief. The Practice Owner SHALL remain non-authorizing and SHALL NOT select the design, edit the candidate, dispatch another agent, or become a completion gate. `code-quality-reviewer` SHALL remain within the separate `simplicity-and-reuse` practice. When no supported change axis exists, no architecture Practice Owner launch SHALL be required solely for compliance.

#### Scenario: One-off owner-local defect remains direct

- **WHEN** inspected evidence shows one cohesive owner-local defect and no requirement-backed variant, system boundary, state transition, or invariant needs isolation
- **THEN** main selects the smallest direct correction and nearest representative proof
- **AND** it does not add an interface, factory, strategy, wrapper layer, plugin point, or mandatory architecture review.

#### Scenario: A second behavior variant is already accepted

- **WHEN** the current increment implements one behavior and an accepted requirement identifies a second behavior that changes along the same axis
- **THEN** main names that axis and chooses the smallest seam that keeps both behaviors under one cohesive owner or narrow interchangeable boundary
- **AND** the seam provides current comprehension or testability value rather than only hypothetical extensibility.

#### Scenario: Material change axis receives one practice observation

- **WHEN** accepted variation, a mixed responsibility, an inspected external/system boundary, a non-trivial state transition, or an important invariant makes change locality material
- **THEN** main invokes only the registered `architecture-and-change-locality` Practice Owner for a bounded practice observation
- **AND** main independently selects, integrates, and proves the concrete direct implementation or smallest useful seam.

#### Scenario: External dependency is an inspected volatility boundary

- **WHEN** accepted behavior depends on an external service, process, storage mechanism, protocol, or platform API whose failure and replacement semantics differ from domain policy
- **THEN** main keeps the external effect at a narrow cause-preserving boundary and keeps the policy locally testable
- **AND** it does not introduce a general plugin framework or unrelated infrastructure owner.

#### Scenario: Hypothetical plugin ecosystem is rejected

- **WHEN** the current requirement has one implementation and no evidence identifies another implementation, consumer, or compatibility obligation
- **THEN** main keeps the implementation direct and records no speculative extension mechanism
- **AND** future plugin support remains a separate change if evidence later makes it reachable.

#### Scenario: Delegated production slice preserves the decision

- **WHEN** main delegates a bounded production slice that contains a supported change axis or responsibility boundary
- **THEN** the production brief carries that exact boundary and the worker implements within it or returns a scoped conflict
- **AND** main verifies the integrated result's current behavior and change locality rather than treating the worker report as architecture approval.

#### Scenario: Pattern label does not prove quality

- **WHEN** a candidate uses a named SOLID principle or Gang of Four pattern
- **THEN** main evaluates the concrete responsibilities, dependencies, navigation cost, current payoff, and representative proof
- **AND** the label alone neither requires nor accepts the structure.
