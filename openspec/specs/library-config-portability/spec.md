# library-config-portability Specification

## Purpose
TBD - created by archiving change kit-config-hygiene. Update Purpose after archive.
## Requirements
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

### Requirement: No hardcoded user paths in shipped config

The committed `global/opencode.json` SHALL NOT contain absolute user paths. The committed file SHALL either omit machine-specific providers/MCPs or reference them via documented placeholder values.

#### Scenario: working tree before change

- **WHEN** `global/opencode.json` currently contains `C:/Users/Sergey/.local/bin/codebase-memory-mcp.exe`
- **THEN** this change SHALL remove that path
- **AND** the README SHALL document how to add the path back via `global/opencode.local.json`.

#### Scenario: overlay example

- **WHEN** `global/opencode.local.json.example` exists in the repo
- **THEN** it SHALL contain only official OpenCode schema fields
- **AND** README SHALL state that `OPENCODE_CONFIG` must explicitly load the copied overlay
- **AND** `.gitignore` SHALL ignore `global/opencode.local.json`.

### Requirement: Portable global code-intelligence MCP setup

`global/opencode.json.template` SHALL enable Serena and Codebase Memory as local MCP servers through commands resolved from `PATH`, without absolute user paths. The repository SHALL expose a TypeScript installer that installs only missing executables, preserves working existing versions, and supports non-mutating `--check` and `--dry-run` modes.

#### Scenario: global MCP launch commands

- **WHEN** OpenCode loads the provisioned global config from a project workspace
- **THEN** Codebase Memory SHALL launch through `codebase-memory-mcp`
- **AND** Serena SHALL launch through `serena start-mcp-server --context ide --project-from-cwd`.

#### Scenario: existing MCP installations

- **WHEN** both executable version probes succeed
- **THEN** `npm run install:mcps` SHALL NOT run either package installation command
- **AND** SHALL report both executables as configured.

#### Scenario: missing MCP installations

- **WHEN** an executable version probe reports that Serena or Codebase Memory is missing
- **THEN** default `npm run install:mcps` SHALL use the documented official package-manager command for that executable
- **AND** `--dry-run` SHALL print the command without installing or initializing anything
- **AND** `--check` SHALL exit non-zero without installing or initializing anything.

### Requirement: global/.gitignore consistency

The file `global/.gitignore` SHALL NOT ignore files that are intentionally tracked in `global/`. The dependencies in `global/package.json` and `global/package-lock.json` SHALL be either both tracked or both ignored, not mismatched.

#### Scenario: tracked dependency files

- **WHEN** `git ls-files global/package.json global/package-lock.json` reports them as tracked
- **THEN** `global/.gitignore` SHALL NOT list `package.json` or `package-lock.json`
- **AND** the change SHALL include a task confirming the `git ls-files` result.

#### Scenario: ignored dependency files

- **WHEN** the dependency files are NOT tracked
- **THEN** this change SHALL either remove `global/package.json` and `global/package-lock.json` from the working tree, OR hoist the dependency into the root `package.json` and remove the files from `global/`.

### Requirement: validator recognizes machine-local path

The validator SHALL recognize `global/opencode.json` as the machine-local layer by path and SHALL downgrade specific broad-permission warnings accordingly. It SHALL reject unsupported marker fields. Both behaviors SHALL be covered by regression tests.

#### Scenario: regression test for local-path behavior

- **WHEN** the fixture repo is constructed with a `global/opencode.json` containing `"permission": "allow"`
- **THEN** `npm run validate:strict` SHALL pass
- **AND** the output SHALL include an `INFO:` line referencing the broad local permission.

#### Scenario: regression test for unsupported marker

- **WHEN** a fixture OpenCode config contains an unsupported local-override marker field
- **THEN** validation SHALL fail with a diagnostic that the field can prevent OpenCode startup.
