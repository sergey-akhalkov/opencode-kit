## MODIFIED Requirements

### Requirement: Three-layer config layering

The repository SHALL maintain exactly three automatically loaded OpenCode base configuration files with distinct audiences:

- `opencode.json` (repo root) - the workspace configuration used when a developer runs OpenCode inside this repository.
- `global/opencode.json.template` - the portable safe default shipped with the kit, used as the source for first-time provisioning.
- `global/opencode.json` (gitignored) - the machine-local override; populated by the installer on first run and editable per-machine.

The repository MAY additionally ship restricted schema-valid model profile fragments under `global/model-profiles/`. These fragments SHALL NOT be treated as automatically loaded base layers, SHALL contain only model-routing fields, and SHALL take effect only when explicitly supplied as ephemeral `OPENCODE_CONFIG_CONTENT` by the model-profile launcher.

#### Scenario: contributor identifies the right file

- **WHEN** a contributor needs to change default OpenCode behavior other than launch-time model routing (provider, MCP, permission, compaction)
- **THEN** the README SHALL name which of the three base files to edit
- **AND** `tools/doctor.ts` SHALL report which base layer is currently active when run.

#### Scenario: contributor changes model routing

- **WHEN** a contributor needs a reusable launch-time model matrix
- **THEN** the README SHALL direct them to a committed or `local:` model profile rather than agent frontmatter or a fourth implicit config layer
- **AND** it SHALL explain that profile selection starts a new OpenCode process and does not rewrite the three base files.

#### Scenario: template seeds the override

- **WHEN** `tools/install-opencode-global.ts` runs in default mode and `global/opencode.json` does not exist
- **THEN** the installer SHALL copy `global/opencode.json.template` to `global/opencode.json`
- **AND** provisioning SHALL use a temporary file plus atomic rename
- **AND** the new file SHALL be byte-equivalent to the template and contain only fields supported by the official OpenCode schema.

#### Scenario: existing legacy config

- **WHEN** installer or doctor encounters an existing `global/opencode.json` containing the previously generated unsupported marker field
- **THEN** it SHALL report a blocking diagnostic that instructs the user to remove the field
- **AND** it SHALL NOT print, rewrite, or discard the user's remaining machine-local configuration.

#### Scenario: explicit model profile overlay

- **WHEN** the owner selects a valid model profile through the launcher
- **THEN** only the child OpenCode process SHALL receive the profile as inline configuration
- **AND** no repository, project, global, machine-local, shell-profile, or managed configuration file SHALL be modified.
