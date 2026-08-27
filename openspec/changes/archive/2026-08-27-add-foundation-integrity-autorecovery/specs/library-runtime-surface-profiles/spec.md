## ADDED Requirements

### Requirement: Core runtime profiles include context-qualified foundation integrity and recovery
Every maintained profile that selects the core Practice Ownership runtime SHALL
include exactly one `foundation-integrity-reviewer` agent and the on-demand
`foundation-integrity-recovery` skill from the same verified source as the other core
artifacts. Profile resolution SHALL fail before mutation when the registered owner
or recovery skill is absent, duplicated, stale, conflicting, or omitted from the
effective manifest.

The added owner description, skill discovery metadata, compact routing, and profile
catalog changes SHALL preserve canonical ownership, exact-duplicate handling,
context quality, and loaded behavior. Inventory size and token-proxy measurements
SHALL remain diagnostics rather than acceptance ceilings. The implementation MUST NOT
remove another required core owner or weaken an existing trigger merely to reduce a
diagnostic measurement.

#### Scenario: Core profile resolves the new practice
- **WHEN** strict profile resolution loads the maintained core runtime
- **THEN** the exact registered foundation owner and recovery skill are loader-visible once with matching source identities
- **AND** all previously required core owners and skills remain present.

#### Scenario: Unique metadata changes an inventory diagnostic
- **WHEN** the candidate owner, skill, catalog, or routing metadata adds unique required behavior and increases a size or token-proxy measurement
- **THEN** inventory reports the changed diagnostic and context-quality plus loaded behavior checks remain authoritative
- **AND** validation neither introduces a replacement size ceiling nor silently omits an existing artifact.

#### Scenario: Runtime profile omits the registered owner
- **WHEN** a selected profile includes the foundation practice binding but lacks the exact owner agent or recovery skill
- **THEN** profile resolution fails with the missing artifact identity before project mutation
- **AND** no fallback owner or top-level default-primary agent is inferred.
