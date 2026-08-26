## ADDED Requirements

### Requirement: Core runtime profiles include foundation integrity and recovery within existing budgets
Every maintained profile that selects the core Practice Ownership runtime SHALL
include exactly one `foundation-integrity-reviewer` agent and the on-demand
`foundation-integrity-recovery` skill from the same verified source as the other core
artifacts. Profile resolution SHALL fail before mutation when the registered owner
or recovery skill is absent, duplicated, stale, conflicting, or omitted from the
effective manifest.

The added owner description, skill discovery metadata, compact routing, and profile
catalog changes SHALL fit the existing core discovery and combined startup budgets.
The implementation MUST NOT raise those budgets, remove another required core
owner, or weaken an existing trigger merely to admit the new artifacts.

#### Scenario: Core profile resolves the new practice
- **WHEN** strict profile resolution loads the maintained core runtime
- **THEN** the exact registered foundation owner and recovery skill are loader-visible once with matching source identities
- **AND** all previously required core owners and skills remain present.

#### Scenario: New metadata exceeds a maintained budget
- **WHEN** the candidate owner, skill, catalog, or routing metadata would exceed an existing discovery or startup ceiling
- **THEN** implementation compresses or replaces overlapping text before acceptance
- **AND** validation does not raise the ceiling or silently omit an existing artifact.

#### Scenario: Runtime profile omits the registered owner
- **WHEN** a selected profile includes the foundation practice binding but lacks the exact owner agent or recovery skill
- **THEN** profile resolution fails with the missing artifact identity before project mutation
- **AND** no fallback owner or top-level default-primary agent is inferred.
