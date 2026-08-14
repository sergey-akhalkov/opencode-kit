## ADDED Requirements

### Requirement: Unattended OpenSpec workflow has one runtime-resolved owner
The kit SHALL install one canonical global owner for the standard OpenSpec propose, apply, and complete-archive skill and command names. Project-specific requirements SHALL live in OpenSpec config, repository instructions, validation adapters, or differently named domain helpers. Unattended operation SHALL fail closed when a project-local same-name skill or command shadows or competes with the canonical owner.

#### Scenario: Canonical global workflow is loaded
- **WHEN** unattended preflight inspects the resolved runtime for an unrelated project with no same-name overrides
- **THEN** every standard propose/apply/archive command and skill resolves to the active kit global source
- **AND** the project context remains available without copying the lifecycle workflow.

#### Scenario: Legacy overlay remains
- **WHEN** a target project retains an older same-name OpenSpec overlay
- **THEN** ordinary manual use remains outside this capability's claim
- **AND** unattended preflight blocks with migration guidance instead of silently selecting either copy.

### Requirement: Canonical workflow entrypoints use portable deterministic gates
Canonical propose and apply entrypoints SHALL invoke the portable operation gate from the resolved global source with an explicit project root and change id. Canonical complete archive SHALL invoke the existing portable archive helper with explicit validation argv. They SHALL NOT require the target project to define an opencode-kit npm script.

#### Scenario: Rust project has no npm scripts
- **WHEN** a target project supplies explicit Rust validation argv and invokes canonical apply/archive
- **THEN** the global operation gate and archive helper run without a target npm dependency
- **AND** project-specific commands remain only in its adapter/mission definition.
