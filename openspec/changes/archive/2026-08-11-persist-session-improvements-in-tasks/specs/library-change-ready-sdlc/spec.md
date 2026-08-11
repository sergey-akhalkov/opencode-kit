## MODIFIED Requirements

### Requirement: Post-MVP work stops at critical boundaries

After MVP, mandatory work SHALL be limited to incomplete accepted scope, evidence-backed session improvements admitted into the active OpenSpec `tasks.md` under the owner-approved persistence contract, and reproduced accepted-outcome, critical, or non-deferrable defects. An admitted improvement task becomes accepted scope and SHALL remain required until its stated implementation, observable proof, and validation pass or the owner explicitly changes accepted scope.

Current-change architecture and diagnostic non-degradation obligations SHALL be accepted-scope implementation rather than post-MVP cleanup. Known non-critical bugs, optional coverage, pre-existing maintainability debt, style, wording, evidence formatting, diagnostic polish, optimization, and future-scale work that did not pass the improvement admission gate SHALL be documented and parked and SHALL NOT block RC or stable.

#### Scenario: Non-critical post-MVP finding is parked
- **WHEN** main confirms a reachable non-critical limitation after MVP and it does not pass the session-improvement admission gate
- **THEN** the limitation SHALL be documented and parked
- **AND** it SHALL NOT authorize mandatory candidate mutation or block RC/stable.

#### Scenario: Admitted improvement becomes accepted scope
- **WHEN** an evidence-backed local reversible low-cost improvement is causally linked to the original goal, does not expand scope, and is appended to the active `tasks.md`
- **THEN** it SHALL be implemented and proven before RC/stable or normal complete archive
- **AND** it SHALL NOT be reclassified as optional polish merely because MVP already exists.
