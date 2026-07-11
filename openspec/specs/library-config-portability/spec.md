# library-config-portability Specification

## Purpose
TBD - created by archiving change kit-config-hygiene. Update Purpose after archive.
## Requirements
### Requirement: Three-layer config layering

The repository SHALL maintain exactly three OpenCode configuration files with distinct audiences:

- `opencode.json` (repo root) — the workspace configuration used when a developer runs OpenCode inside this repository.
- `global/opencode.json.template` — the portable safe default shipped with the kit, used as the source for first-time provisioning.
- `global/opencode.json` (gitignored) — the machine-local override; populated by the installer on first run and editable per-machine.

#### Scenario: contributor identifies the right file

- **WHEN** a contributor needs to change default OpenCode behavior (provider, MCP, permission, compaction)
- **THEN** the README SHALL name which of the three files to edit
- **AND** `tools/doctor.ts` SHALL report which layer is currently active when run.

#### Scenario: template seeds the override

- **WHEN** `tools/install-opencode-global.ts` runs in default mode and `global/opencode.json` does not exist
- **THEN** the installer SHALL copy `global/opencode.json.template` to `global/opencode.json`
- **AND** provisioning SHALL use a temporary file plus atomic rename
- **AND** the new file SHALL be byte-equivalent to the template and contain only fields supported by the official OpenCode schema.

#### Scenario: existing legacy config

- **WHEN** installer or doctor encounters an existing `global/opencode.json` containing the previously generated unsupported marker field
- **THEN** it SHALL report a blocking diagnostic that instructs the user to remove the field
- **AND** it SHALL NOT print, rewrite, or discard the user's remaining machine-local configuration.

### Requirement: Schema-valid machine-local config

The installer, validator, examples, and documentation SHALL NOT add or require fields absent from the official OpenCode schema. The validator SHALL identify only the exact root-relative gitignored `global/opencode.json` layer by path and downgrade broad-permission diagnostics for that machine-local file to info level.

#### Scenario: machine-local permission allow

- **WHEN** the gitignored `global/opencode.json` contains `"permission": "allow"`
- **THEN** `npm run validate` SHALL emit an `INFO:` line instead of a `WARN:` line
- **AND** `npm run validate:strict` SHALL NOT fail.

#### Scenario: near-miss path remains strict

- **WHEN** a config such as `nested/global/opencode.json` contains `"permission": "allow"`
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
