## ADDED Requirements

### Requirement: Propose separates structural and semantic readiness

Every behavior-changing OpenSpec proposal SHALL declare bounded falsification as
`required - <decision surface>` or `exempt - <Ordinary Small reason>`. The declaration is
a reviewed semantic input; deterministic tooling SHALL validate only its shape and SHALL
NOT infer profile, materiality, task-fit, or exemption correctness from prose or counts.

Canonical propose SHALL build all required artifacts, run deterministic operation and
strict OpenSpec checks, and describe their result as structural artifact readiness. When
falsification is required, propose SHALL supply the original accepted request separately,
launch one fresh bounded challenge, let main disposition admitted rows, update affected
artifacts, and preserve a candidate-correlated record before emitting semantic
implementation readiness. An absent, stale, or unusable required challenge SHALL leave
semantic readiness `unknown` without inventing defects or calling structural validation
failed.

#### Scenario: Structural gates pass but required challenge is absent

- **WHEN** proposal, design, specifications, tasks, operation gates, and strict validation pass but the required falsification record is missing or stale
- **THEN** propose reports structural artifact readiness and semantic readiness `unknown`
- **AND** it does not emit an unqualified `Ready for implementation` statement.

#### Scenario: Required challenge terminates with no material finding

- **WHEN** current artifacts pass structural checks and one fresh challenge returns `no-material-finding` with a current main disposition
- **THEN** propose may report the change semantically ready for implementation
- **AND** it does not add another review or correction task.

#### Scenario: Ordinary Small exemption applies

- **WHEN** main records a reviewed exemption for an exact owner-local reversible change with no decision-material surface
- **THEN** structural readiness is sufficient for the bounded change's implementation handoff
- **AND** no empty reviewer artifact is manufactured.

### Requirement: Apply consumes current review state without reopening a loop

Apply SHALL read the proposal declaration and candidate-correlated falsification state
before substantial implementation. A current terminal episode or reviewed exemption
SHALL satisfy this pre-investment boundary. Apply SHALL NOT relaunch an equivalent review
for the unchanged candidate, and implementation that stays within the challenged decision
surface SHALL NOT require a duplicate generic post-proof review.

#### Scenario: Apply sees a current terminal episode

- **WHEN** the original request, candidate, decision surface, and terminal falsification record are current
- **THEN** apply proceeds to the earliest real implementation boundary without asking for or launching another generic review.

#### Scenario: Implementation planning changes a challenged decision

- **WHEN** apply must change the challenged outcome, envelope, invariant, proof boundary, owner decision, or material-risk surface before implementation can continue
- **THEN** it marks the affected review state stale and uses only the remaining episode budget or exact owner evidence
- **AND** it does not reset an exhausted episode on the same accepted outcome.
