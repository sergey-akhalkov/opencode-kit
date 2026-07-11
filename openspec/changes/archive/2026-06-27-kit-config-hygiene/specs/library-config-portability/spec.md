> Superseded correction (2026-07-11): marker requirements below are archived history, not current normative behavior. The field is unsupported by OpenCode and current active specs prohibit it.

## ADDED Requirements

### Requirement: Three-layer config layering

The repository SHALL maintain exactly three OpenCode configuration files with distinct audiences:

- `opencode.json` (repo root) — the workspace configuration used when a developer runs OpenCode inside this repository.
- `global/opencode.json.template` — the portable safe default shipped with the kit, used as the source for first-time provisioning.
- `global/opencode.json` (gitignored) — the machine-local override; populated by the installer on first run and editable per-machine.

#### Scenario: contributor identifies the right file

- **WHEN** a contributor needs to change default OpenCode behavior (provider, MCP, permission, compaction)
- **THEN** the README SHALL name which of the three files to edit
- **AND** the validator SHALL report which layer is currently active when run.

#### Scenario: template seeds the override

- **WHEN** `tools/install-opencode-global.ts` runs in default mode and `global/opencode.json` does not exist
- **THEN** the installer SHALL copy `global/opencode.json.template` to `global/opencode.json`
- **AND** the new file SHALL include `"machineOverride": true`.

### Requirement: machineOverride marker

A `global/opencode.json` file SHALL set `"machineOverride": true` to indicate it is a deliberate machine-local override. The validator SHALL recognize this marker and downgrade specific warnings (wildcard allow, tool-wide allow) to info-level diagnostics when the marker is present.

#### Scenario: marker present, permission: allow

- **WHEN** `global/opencode.json` contains both `"machineOverride": true` and `"permission": "allow"`
- **THEN** `npm run validate` SHALL emit an `INFO:` line instead of a `WARN:` line
- **AND** `npm run validate:strict` SHALL NOT fail.

#### Scenario: marker missing, permission: allow

- **WHEN** `global/opencode.json` does not contain `"machineOverride": true`
- **THEN** the existing warning behavior SHALL apply (WARN under default mode, ERROR under strict mode).

### Requirement: No hardcoded user paths in shipped config

The committed `global/opencode.json` SHALL NOT contain absolute user paths. The committed file SHALL either omit machine-specific providers/MCPs or reference them via documented placeholder values.

#### Scenario: working tree before change

- **WHEN** `global/opencode.json` currently contains `C:/Users/Sergey/.local/bin/codebase-memory-mcp.exe`
- **THEN** this change SHALL remove that path
- **AND** the README SHALL document how to add the path back via `global/opencode.local.json`.

#### Scenario: overlay example

- **WHEN** `global/opencode.local.json.example` exists in the repo
- **THEN** it SHALL show a documented overlay snippet
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

### Requirement: validator recognizes machineOverride

The validator SHALL read the `machineOverride` field from any `global/opencode.json` it encounters and SHALL downgrade specific warnings accordingly. The downgrade behavior SHALL be covered by a regression test.

#### Scenario: regression test for marker behavior

- **WHEN** the fixture repo is constructed with a `global/opencode.json` containing `"permission": "allow"` and `"machineOverride": true`
- **THEN** `npm run validate:strict` SHALL pass
- **AND** the output SHALL include an `INFO:` line referencing the override.

#### Scenario: regression test for missing marker

- **WHEN** the fixture repo is constructed with `global/opencode.json` containing `"permission": "allow"` but no `machineOverride` field
- **THEN** `npm run validate:strict` SHALL fail.
