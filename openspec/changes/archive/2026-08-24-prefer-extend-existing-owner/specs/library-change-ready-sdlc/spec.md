## ADDED Requirements

### Requirement: Same-responsibility new cases reshape the current owner

When an accepted increment adds behavior that is a new case of a current same-responsibility owner, the main session and production roles SHALL name that owner and implement the case by reshaping the owner. They SHALL NOT add a sibling file, function, or module for that case merely to keep the happy path additive or to avoid an "unrelated refactor".

Reshaping the current owner to absorb an accepted new case inside the existing write scope SHALL count as the smallest complete happy path for that increment. "Unrelated refactor" SHALL remain reserved for work outside the accepted case, named owner, or write scope. Hypothetical shared frameworks, third-copy extractions without a stable common shape, and new-responsibility seams SHALL stay forbidden or routed to `architecture-and-change-locality`.

Owner-local fixes, data/config/generated/mechanical edits, and selected-API glue SHALL remain exempt. A genuinely new responsibility with `no-current-owner` MAY use `build-minimal`. Mixed-file second responsibility or a named change axis SHALL still use the existing architecture practice, not this rule.

#### Scenario: Accepted new case is implemented on the current owner

- **WHEN** inspected source shows one current owner already responsible for the accepted capability and the increment adds another case of that capability
- **THEN** main or the production author changes that owner so both cases share it
- **AND** does not add a sibling implementation beside it.

#### Scenario: Additive sibling is rejected as the default happy path

- **WHEN** an implementation plan would add a new file or function that copies a live owner to deliver an accepted new case
- **THEN** the plan is not the smallest complete happy path
- **AND** the author records `extend` against the live owner or an exact reason that the responsibility is new.

#### Scenario: Architecture boundary stays separate

- **WHEN** the accepted behavior is a second responsibility in a mixed file or a named new change axis
- **THEN** main uses `architecture-and-change-locality` rather than forcing `extend` on the mixed owner
- **AND** `simplicity-and-reuse` is not launched solely for that seam decision.
