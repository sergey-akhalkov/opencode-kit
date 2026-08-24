## ADDED Requirements

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

### Requirement: Core includes core Practice Owners within existing budgets

The default `core` surface SHALL include every owner for the registered core practices that govern portable outcome readiness, verification and tests, claim evidence, simplicity and reuse, architecture and change locality, execution safety, instruction governance, and blocker recovery. The candidate core manifest SHALL add `openspec-architecture-reviewer`, `instruction-artifact-reviewer`, and `execution-safety-reviewer`, and SHALL move the optional non-owner `final-candidate-reviewer` to `all` while preserving its explicit optional route. It SHALL preserve the existing core maximum of 12,000 startup token proxy and 1,200 discovery-metadata token proxy, the separate 13,279 committed global-authority maximum, and the matched consumer no-regression contract.

#### Scenario: Core owner additions fit the budget

- **WHEN** the candidate core manifest includes all registered core owners
- **THEN** loader-visible inventory remains within both existing core ceilings
- **AND** matched consumer and practice-routing scenarios preserve outcome, safety, proof, and cleanup.

#### Scenario: Core cannot fit an owner by adding metadata

- **WHEN** adding a required core owner would exceed a reviewed discovery boundary
- **THEN** implementation first compresses redundant descriptions or removes a proven optional non-owner surface without weakening required behavior
- **AND** does not raise the budget or omit the owner automatically.

#### Scenario: Optional final review remains available outside core

- **WHEN** a core consumer needs the optional post-MVP final candidate reviewer
- **THEN** runtime reports that the relevant optional profile or `all` surface is required
- **AND** practice ownership does not silently load a checkout or compatibility alias.

#### Scenario: Core practice owner is unavailable at runtime

- **WHEN** a resolved core manifest names an owner but live loader evidence cannot discover it
- **THEN** runtime readiness reports the exact profile/loader mismatch
- **AND** the practice does not silently fall back to an unregistered agent.
