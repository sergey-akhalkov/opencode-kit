## ADDED Requirements

### Requirement: Default profiles SHALL include delivery trajectory capability

The maintained `core` and `all` profiles SHALL include the
`roadmap-delivery-trajectory` skill and the exact self-contained trajectory-context
helper import closure. Profile materialization, catalogs, doctor/readback, source
identity, canonical ownership, privacy, context quality, and loaded behavior checks
SHALL resolve each artifact exactly once. The profile SHALL NOT add complexity audit,
campaign execution, next-step recommendation, or another unrelated body solely to
provide trajectory behavior.

#### Scenario: Core profile handles a linked archive

- **WHEN** the current core profile is materialized and loaded for a disposable project
  with an explicit Delivery Horizon
- **THEN** archive can resolve the fact helper and on-demand trajectory skill exactly
  once from the selected candidate source
- **AND** deep skill content remains on demand rather than duplicated into startup
  authority.

#### Scenario: Custom profile omits one required artifact

- **WHEN** a custom profile omits the trajectory skill or any exact helper dependency
- **THEN** profile/readiness diagnostics report the missing capability and affected
  horizon route
- **AND** no parent directory, host-default collision, adjacent skill, or partial helper
  closure is guessed as a successful substitute.
