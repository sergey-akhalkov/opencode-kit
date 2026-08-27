# library-runtime-surface-profiles Specification

## Purpose
Defines selectable loader-visible runtime surfaces so unrelated projects receive a small safe core while domain-specific agents and skills remain explicitly available.

## Requirements

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

### Requirement: Selected practices and owners are installed atomically

Every runtime-surface profile SHALL resolve its maintained practice bindings against the reviewed Practice Ownership Registry. If a profile selects a canonical practice skill, command, control surface, or other registered practice artifact, its effective manifest SHALL include that practice's exact owner agent. Profile resolution SHALL fail before mutation when a selected practice has no owner, the owner is not in the effective manifest, or another selected profile supplies conflicting owner bytes.

Owner agents SHALL remain loader-visible through concise discovery metadata while their complete bodies remain on demand. Profile composition SHALL NOT inject all owner bodies into main startup context.

#### Scenario: Profile selects a practice without its owner

- **WHEN** profile resolution includes a registered practice artifact but omits its exact owner agent
- **THEN** resolution fails before installation or config mutation
- **AND** names the practice, expected owner, and selecting profile.

#### Scenario: Domain practice is not selected

- **WHEN** `core` excludes an optional protocol, wire, Rust, legacy, deployment, or performance practice
- **THEN** its paired domain owner MAY remain absent from the effective manifest
- **AND** main reports the optional profile requirement rather than silently loading a checkout copy.

#### Scenario: Full profile is selected

- **WHEN** the `all` compatibility profile is resolved
- **THEN** every initial core and domain Practice Owner is loader-visible exactly once
- **AND** execution, optional cross-cutting, helper, and control-plane roles retain their separate classifications.

### Requirement: Core context is governed by complete ownership and observable behavior

The maintained `core` surface SHALL include every owner for the registered core practices that govern portable outcome readiness, verification and tests, claim evidence, simplicity and reuse, architecture and change locality, execution safety, instruction governance, and blocker recovery. It SHALL retain `openspec-architecture-reviewer`, `instruction-artifact-reviewer`, and `execution-safety-reviewer` in core and SHALL retain the optional non-owner `final-candidate-reviewer` outside core while preserving its explicit optional route.

Loader-visible inventory SHALL report core startup authority, discovery metadata, and on-demand bodies separately with source/profile identity and unknown-source status. Core selection and validation SHALL NOT impose a numeric token-proxy ceiling or frozen-size baseline. A core candidate SHALL instead preserve every required owner and profile invariant, pass canonical ownership, exact-duplicate, canonicalization, privacy, and source-collision checks, and satisfy the maintained matched consumer no-regression contract.

#### Scenario: Required core owner adds unique discovery metadata

- **WHEN** a required registered core owner adds unique trigger-complete discovery metadata and all context-quality and matched behavior checks pass
- **THEN** inventory reports the discovery delta without rejecting the owner because of a numeric ceiling
- **AND** core retains every required owner and prior behavior oracle.

#### Scenario: Smaller core drops a safety oracle

- **WHEN** a candidate reduces startup or discovery measurements but loses a required authority, proof, routing, safety, permission, or cleanup result
- **THEN** the candidate is rejected by the maintained consumer outcome gate
- **AND** the previous default remains selected regardless of the measured reduction.

#### Scenario: Full catalog remains separately visible

- **WHEN** the `all` compatibility profile contains more artifacts or larger on-demand bodies than core
- **THEN** inventory reports each profile and category separately
- **AND** neither profile's complete catalog total is represented as one startup prompt size.

#### Scenario: Core practice owner is unavailable at runtime

- **WHEN** a resolved core manifest names an owner but live loader evidence cannot discover it
- **THEN** runtime readiness reports the exact profile and loader mismatch
- **AND** the practice does not silently fall back to an unregistered agent or pass because context measurements are small.

#### Scenario: Exact routing text is duplicated across core artifacts

- **WHEN** core model-facing artifacts contain an exact repeated operative prose block without one reviewed canonical owner and loader-boundary exception
- **THEN** strict validation rejects the profile candidate with every maintained source location
- **AND** no numeric measurement or `all` profile behavior excuses the duplicate authority.

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
