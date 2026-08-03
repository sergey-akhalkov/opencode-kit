## MODIFIED Requirements

### Requirement: Three-layer config layering

The repository SHALL maintain exactly three automatically loaded OpenCode base configuration files with distinct audiences:

- `opencode.json` (repo root) - the workspace configuration used when a developer runs OpenCode inside this repository, retaining its separate `permission: "ask"` policy.
- `global/opencode.json.template` - the portable autonomy-first default shipped with the kit, using `permission: "allow"` and serving as the source for first-time provisioning.
- `global/opencode.json` (gitignored) - the machine-local config; populated by the installer on first run and editable per-machine.

The global `allow` default SHALL be documented as permissive tool configuration rather than an OS sandbox or managed safety boundary. Instruction-level protected-boundary rules remain required but SHALL NOT be described as hard permission enforcement.

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
- **AND** the new file SHALL be byte-equivalent to the template, retain `permission: "allow"`, and contain only fields supported by the official OpenCode schema.

#### Scenario: existing legacy config

- **WHEN** installer or doctor encounters an existing `global/opencode.json` containing the previously generated unsupported marker field
- **THEN** it SHALL report a blocking diagnostic that instructs the user to remove the field
- **AND** it SHALL NOT print, rewrite, or discard the user's remaining machine-local configuration.

#### Scenario: explicit model profile overlay

- **WHEN** the owner selects a valid model profile through the launcher
- **THEN** only the child OpenCode process SHALL receive the profile as inline configuration
- **AND** no repository, project, global, machine-local, shell-profile, or managed configuration file SHALL be modified.

### Requirement: Schema-valid machine-local config

The installer, validator, examples, and documentation SHALL NOT add or require fields absent from the official OpenCode schema. The validator SHALL identify only the exact root-relative `global/opencode.json.template` and gitignored `global/opencode.json` layers by path and downgrade broad-permission diagnostics for those intentional global defaults to info level. Other configs with broad mutation-capable permissions SHALL retain warning severity.

#### Scenario: portable global template permission allow

- **WHEN** the exact root-relative `global/opencode.json.template` contains `"permission": "allow"`
- **THEN** `npm run validate` SHALL emit an `INFO:` line instead of a `WARN:` line
- **AND** `npm run validate:strict` SHALL NOT fail.

#### Scenario: machine-local permission allow

- **WHEN** the exact root-relative gitignored `global/opencode.json` contains `"permission": "allow"`
- **THEN** `npm run validate` SHALL emit an `INFO:` line instead of a `WARN:` line
- **AND** `npm run validate:strict` SHALL NOT fail.

#### Scenario: near-miss path remains strict

- **WHEN** a config such as `nested/global/opencode.json`, `nested/global/opencode.json.template`, or repo-root `opencode.json` contains `"permission": "allow"`
- **THEN** validation SHALL emit a warning
- **AND** strict validation SHALL fail.

#### Scenario: unsupported field

- **WHEN** any OpenCode config contains a field that this repository previously invented as a local-override marker
- **THEN** validation SHALL reject the config and instruct the contributor to remove the unsupported field.
