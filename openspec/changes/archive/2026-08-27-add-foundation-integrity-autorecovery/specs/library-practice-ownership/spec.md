## MODIFIED Requirements

### Requirement: The initial roster covers core and maintained domain practices

The initial registry SHALL contain these core practice-to-owner bindings:
`outcome-readiness` to `implementation-readiness-reviewer`;
`verification-and-tests` to `test-coverage-reviewer`; `claim-evidence` to
`evidence-sufficiency-reviewer`; `foundation-integrity` to
`foundation-integrity-reviewer`; `simplicity-and-reuse` to
`code-quality-reviewer`; `architecture-and-change-locality` to
`openspec-architecture-reviewer`; `execution-safety` to
`execution-safety-reviewer`; `instruction-governance` to
`instruction-artifact-reviewer`; and `blocker-recovery` to `troubleshooter`.

The initial registry SHALL contain these optional domain bindings:
`configuration-and-deployment` to `deployment-config-reviewer`;
`performance-and-reliability` to `performance-reliability-reviewer`;
`rust-concurrency` to `rust-concurrency-reviewer`; `protocol-api-semantics` to
`protocol-api-reviewer`; `wire-format-and-transport` to
`wire-protocol-reviewer`; `legacy-contract-evidence` to
`legacy-evidence-reviewer`; and `legacy-client-compatibility` to
`legacy-client-compatibility-reviewer`.

`implementation-worker`, `sdet-quality-engineer`, `final-candidate-reviewer`,
`qwen-local-worker`, and `session-completion-arbiter` SHALL remain execution,
optional cross-cutting review, helper, or control-plane roles rather than primary
Practice Owners. Their governing rules SHALL map to the appropriate registered
core practice. `foundation-integrity-reviewer` SHALL own only current foundation-
relation applicability and observation; main SHALL remain the sole recovery and
outcome owner.

#### Scenario: Initial registry is validated

- **WHEN** strict validation inspects the initial roster
- **THEN** all sixteen practice IDs resolve to the exact named agents and maintained rule anchors
- **AND** no excluded execution, optional cross-cutting, helper, or control-plane role is promoted implicitly.

#### Scenario: Protocol and wire concerns are separated

- **WHEN** a change affects schema evolution and request correlation without changing framing bytes
- **THEN** `protocol-api-reviewer` owns the practice observation and `wire-protocol-reviewer` is not invoked solely for that concern
- **AND** byte order, framing lengths, binary safety, and golden transport vectors remain owned by `wire-protocol-reviewer`.

#### Scenario: Test coverage observes a domain test gap

- **WHEN** `test-coverage-reviewer` finds missing requirement-to-test traceability for protocol behavior
- **THEN** it owns only the verification gap and refers the protocol semantic evidence to main
- **AND** it does not become a second owner of protocol correctness.

#### Scenario: Foundation owner detects a current identity contradiction

- **WHEN** a reviewed material trigger binds a current outcome to mismatched workload/profile/oracle identities
- **THEN** only `foundation-integrity-reviewer` owns the foundation practice observation
- **AND** main independently reproduces, corrects, and sweeps the result without transferring outcome ownership to the reviewer.
