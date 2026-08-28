## ADDED Requirements

### Requirement: Default runtime surfaces contain the common complexity workflow

The default `core` and compatibility `all` profiles SHALL include the
`complexity-management` skill and the exact self-contained portable
complexity-foraging helper import closure. Existing `code-quality-audit`,
`codebase-audit-loop`, and `codebase-audit-ledger` SHALL remain `all`-only because they
retain changed-code or exhaustive responsibilities outside ordinary core operation.
Profile generation, catalogs, doctor readback, installed-source identity, discovery
metadata, on-demand body, context quality, and loaded behavior SHALL remain valid.
Inventory size and token-proxy measurements SHALL remain diagnostics rather than
acceptance ceilings.

#### Scenario: Default core project requests focused complexity assessment

- **WHEN** a default `core` session receives an explicit project-complexity or useful-interface assessment request
- **THEN** the discovered catalog contains `complexity-management` and its exact helper is present under the resolved active global source
- **AND** the session does not route to a missing `all`-only skill or guess a parent source.

#### Scenario: Default core project requests exhaustive assessment

- **WHEN** a default `core` session receives an explicit whole-project exhaustive complexity request
- **THEN** the focused skill reports project mode unavailable because the exhaustive skill/ledger is not discovered
- **AND** it neither approximates complete coverage nor creates a sibling exhaustive workflow.

#### Scenario: All-profile project requests exhaustive assessment

- **WHEN** an `all` session receives an explicit whole-project exhaustive complexity request
- **THEN** `codebase-audit-loop` and `codebase-audit-ledger` are discoverable
- **AND** the focused skill routes to those existing owners rather than duplicating exhaustive coverage.

#### Scenario: Custom profile omits the focused workflow

- **WHEN** an explicitly selected custom profile does not contain the focused skill or helper
- **THEN** the existing main-owned delta check remains available and the focused capability is reported unavailable
- **AND** no instruction claims that the omitted helper ran or silently substitutes another source.
