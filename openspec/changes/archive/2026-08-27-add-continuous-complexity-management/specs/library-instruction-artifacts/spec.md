## ADDED Requirements

### Requirement: Complexity workflow stays discoverable, proportional, and cohesive

The maintained instruction library SHALL implement the project-neutral complexity
workflow through one thin main-executed `complexity-management` skill, one consolidated
always-loaded trigger, and project-facing role deltas. That skill SHALL own only focused
Architecture Comprehension Map, Change Rehearsal, abstraction value, admission, and
before/after refactor outputs. Existing `code-quality-audit` SHALL retain changed-code
maintainability/smell ownership, `service-architecture-design` SHALL retain new service
architecture ownership, and the existing codebase audit and ledger SHALL retain
review-only exhaustive coverage ownership by default while adding only the exact
`Complexity Pressure Matrix` fields from `library-complexity-management`. Maintained
surfaces SHALL point to the canonical contract or state only their role-specific delta.
They SHALL preserve canonical ownership, exact-duplicate handling, context quality, and
loaded behavior; size and token-proxy inventory measurements remain diagnostics.

The maintained skill descriptions and routing catalog SHALL be mutually exclusive:
`code-quality-audit` SHALL stay quiet for pre-expansion Architecture Comprehension Map or
Change Rehearsal requests, `service-architecture-design` SHALL stay quiet for assessment
of an existing project's comprehension pressure unless new service design is primary,
and `complexity-management` SHALL stay quiet for changed-code smell review, new service
design, seam-only Practice Owner routing, and explicit exhaustive coverage.

#### Scenario: User asks how hard a project is to develop

- **WHEN** a user asks about project complexity, architecture comprehensibility, useful abstraction, or refactoring for change locality without requesting an exhaustive audit
- **THEN** the focused `complexity-management` workflow is discoverable and produces the map/rehearsal contract
- **AND** it does not require the exhaustive ledger or invent a new architecture agent.

#### Scenario: User asks for exhaustive coverage

- **WHEN** the request explicitly requires whole-codebase exhaustive complexity coverage
- **THEN** routing uses the existing codebase audit and ledger with the complexity output delta when discovered, otherwise reports project mode unavailable
- **AND** no sibling exhaustive skill is loaded or complete coverage approximated.

#### Scenario: User asks to design a new service

- **WHEN** the primary request is to shape a new service's state, concurrency, protocol, failure, deployment, and observability architecture rather than assess current comprehension pressure
- **THEN** routing uses `service-architecture-design`
- **AND** the focused complexity skill remains quiet unless a separate current-project comprehension request or pressure is present.

#### Scenario: User asks for changed-code maintainability review

- **WHEN** the primary request is a post-change smell, readability, duplication, or maintainability review
- **THEN** routing uses `code-quality-audit`
- **AND** it does not require the focused map/rehearsal output.

### Requirement: Complexity instruction behavior receives structural and loaded proof

Deterministic validation SHALL verify exact skill identity, concise global routing,
maintained output markers, owner separation, forbidden score/mandatory-review language,
portable inventory entrypoint, profile/catalog integrity, and context quality.
It SHALL NOT infer whether an architecture or abstraction is good. Matched configured
OpenCode baseline/candidate evaluation SHALL cover `cohesive-small-project`,
`modular-multi-component-project`, `noisy-corpus-or-evidence-project`,
`mixed-owner-module`, `useful-current-consumer-facade`,
`frozen-compatibility-and-current-extension`, `redundant-wrapper-chain`,
`speculative-generic-abstraction`, `explicit-review-only-project-assessment`,
`default-core-availability`, `unreadable-root`, and `unsupported-ecosystem`.
The same prompt, model, variant, permissions, environment, and fixtures SHALL be used for
each baseline/candidate comparison.

#### Scenario: Candidate adds an architecture score

- **WHEN** a maintained instruction, helper contract, or behavior result ranks a project or abstraction with a numeric or inferred architecture-quality score
- **THEN** structural or semantic evaluation rejects the candidate
- **AND** preserves the explicit facts and evidence-backed prose disposition separately.

#### Scenario: Candidate adds ceremony to a cohesive fix

- **WHEN** the cohesive direct-change negative control gains a persistent map, new abstraction, or mandatory Practice Owner call without a concrete trigger
- **THEN** loaded behavior evaluation rejects that candidate outcome
- **AND** the ordinary direct implementation path remains the expected behavior.

#### Scenario: Candidate localizes a useful facade

- **WHEN** the facade fixture has a current consumer coordinating several stable internals
- **THEN** loaded evidence shows the candidate maps the boundary, preserves explicit effects/failures, and replays the consumer scenario through the narrower interface
- **AND** the maximum claim remains limited to the reviewed fixture population and model/environment.
