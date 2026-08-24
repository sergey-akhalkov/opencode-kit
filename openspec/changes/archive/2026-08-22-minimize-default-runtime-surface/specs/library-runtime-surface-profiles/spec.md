## Purpose

Defines selectable loader-visible runtime surfaces so unrelated projects receive a small safe core while domain-specific agents and skills remain explicitly available.

## ADDED Requirements

### Requirement: Core is the default runtime surface
New global installation SHALL select a versioned `core` surface unless the operator explicitly selects another maintained profile. Core SHALL include the working principles, portable operational authority, ordinary implementation/proof routing, OpenSpec lifecycle entrypoints, reuse discovery, feedback, and only agents required by those paths. It SHALL exclude Windows, COM, protocol, legacy, Rust, benchmark, and other domain artifacts from loader-visible skill/agent discovery.

#### Scenario: Unrelated project uses default install
- **WHEN** a fresh install is created without a profile argument
- **THEN** runtime inventory identifies `core` as selected
- **AND** domain artifacts excluded from core are not loader-visible

#### Scenario: Core artifact is requested explicitly
- **WHEN** a user request matches an artifact not installed in core
- **THEN** the runtime reports that the relevant optional profile is not enabled
- **AND** does not silently load a hidden copy from the kit checkout

### Requirement: Optional profiles are explicit and composable
The kit SHALL retain `all` as an explicit compatibility profile and MAY define domain profiles with exact artifact manifests. Profile resolution SHALL be stable ordered, reject unknown/duplicate/conflicting artifacts, and materialize one reviewable effective manifest before config or instruction files are written.

#### Scenario: Full compatibility profile is selected
- **WHEN** the operator explicitly selects `all`
- **THEN** the effective manifest contains the maintained full catalog
- **AND** its inventory is equivalent to the pre-core catalog except for separately reviewed personal-authority removal

#### Scenario: Profile contains conflicting owners
- **WHEN** two selected profiles expose the same skill, agent, command, or config owner with different bytes
- **THEN** installation fails before mutation
- **AND** names both portable source identities

### Requirement: Core context has enforced ceilings
The maintained core surface SHALL remain at or below 12,000 startup token-proxy and 1,200 discovery metadata token-proxy under the loader-visible inventory. The full catalog SHALL retain separate reporting and SHALL NOT consume the core budget. A reduction SHALL preserve required safety markers and pass the maintained consumer no-regression expectation before becoming the default.

#### Scenario: Core grows beyond its ceiling
- **WHEN** loader-visible core inventory exceeds either ceiling
- **THEN** strict validation fails with actual and allowed values
- **AND** a larger `all` profile does not excuse the core regression

#### Scenario: Smaller core drops a safety oracle
- **WHEN** a candidate is under budget but the consumer outcome gate loses a required authority/proof/safety result
- **THEN** the candidate is rejected
- **AND** the previous default remains selected

### Requirement: Existing installations are not silently migrated
Profile-aware installation SHALL preview exact additions/removals and preserve an existing machine-local config and installed catalog unless the operator explicitly selects a migration mode. Migration SHALL create a recoverable backup and verify the effective loader-visible surface before reporting success.

#### Scenario: Existing broad installation is inspected
- **WHEN** profile-aware install finds an existing unprofiled or `all` installation without migration authorization
- **THEN** it reports the current and proposed manifests
- **AND** changes no file or environment value

#### Scenario: Explicit core migration succeeds
- **WHEN** an operator selects core migration and all preflight checks pass
- **THEN** the installed source matches the reviewed core manifest
- **AND** rollback restores the prior installed bytes and machine-local config
