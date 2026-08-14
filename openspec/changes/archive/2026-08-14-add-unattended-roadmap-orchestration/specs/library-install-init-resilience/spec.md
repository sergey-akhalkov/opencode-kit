## ADDED Requirements

### Requirement: Project bootstrap provisions mission-compatible adapters without workflow copies
Project bootstrap SHALL provision runtime-authority guidance and a validation adapter template but SHALL NOT install project-local copies of canonical OpenSpec propose/apply/archive skills or commands. Existing project constraints and same-name overlays SHALL be reported and preserved unless an explicit overwrite/migration mode is selected.

#### Scenario: New project is initialized
- **WHEN** `init-project` writes into a project without prior kit artifacts
- **THEN** it creates runtime-authority guidance and adapter/validation templates
- **AND** standard OpenSpec workflow names remain owned by the global source.

#### Scenario: Existing project has legacy overlays
- **WHEN** preview or doctor finds same-name project OpenSpec workflows
- **THEN** it reports unattended incompatibility and exact safe paths
- **AND** it does not delete or replace them automatically.

### Requirement: Doctor reports unattended mission readiness separately
Doctor SHALL report a distinct unattended-mission readiness status covering active runtime authority, complete validation argv, canonical workflow identity/collisions, mission definition validity when selected, checkpoint support, required installed binaries, and long-run guard options. Ordinary project usability and unattended readiness SHALL remain separate results.

#### Scenario: Project is usable but not unattended-compatible
- **WHEN** ordinary OpenCode config is valid but validation argv or canonical workflow identity is unresolved
- **THEN** doctor may retain ordinary warning/pass information while unattended readiness is blocked
- **AND** it names the exact missing or colliding prerequisite.
