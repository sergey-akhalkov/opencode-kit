## MODIFIED Requirements

### Requirement: SDET has least-privilege test-only authority

SDET SHALL receive scalar tool-level edit authorization without a runtime approval
prompt, remain contractually prohibited from production edits, accept an exact
test-only write scope, and return blocked when that scope or execution route is
unavailable. SDET output SHALL use the critical-only action enum and SHALL NOT
approve RC or stable. Its other explicit denied permissions SHALL remain denied.

#### Scenario: Authorized test edit is unattended

- **WHEN** a fresh SDET attempt receives current Runtime Proof and an exact local
  test-only write scope
- **THEN** its effective `edit` permission SHALL resolve to `allow`
- **AND** it SHALL be able to write within that scope without an operator permission
  reply.

#### Scenario: SDET cannot edit production

- **WHEN** an SDET attempt requests a production-path edit or lacks an exact
  test-only write scope
- **THEN** the attempt SHALL return blocked without modifying production.
