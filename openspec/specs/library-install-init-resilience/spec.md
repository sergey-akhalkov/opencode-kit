# library-install-init-resilience Specification

## Purpose
Defines safe global-config activation, platform-specific persistence, project bootstrap behavior, rollback, and failure-atomic installer diagnostics.
## Requirements
### Requirement: setx truncation guard

`tools/install-opencode-global.ts` SHALL measure the configured `OPENCODE_CONFIG_DIR` value before calling `setx` on Windows. If the value exceeds 900 characters, the installer SHALL print a warning that names the `setx` 1024-char limit, print the suggested `--print` command for manual setup, and exit non-zero without calling `setx`.

#### Scenario: long Windows path

- **WHEN** `globalDir.length + ENV_VAR.length + 1 > 900` on Windows
- **THEN** the installer SHALL print a warning that the configured value would be truncated by `setx`
- **AND** SHALL print the `--print` command so the user can run `setx` manually with the value in hand
- **AND** SHALL exit non-zero without modifying the user environment.

#### Scenario: short Windows path

- **WHEN** `globalDir.length + ENV_VAR.length + 1 <= 900` on Windows
- **THEN** the installer SHALL call `setx` as before
- **AND** the existing behavior SHALL be unchanged.

### Requirement: POSIX persistence helper

`tools/install-opencode-global.ts` SHALL accept `--persist-script <file>` and `--unset-script <file>` modes that append or remove the `export OPENCODE_CONFIG_DIR=<path>` line from the named file. The append SHALL be idempotent: re-running with the same file SHALL NOT duplicate the line.

#### Scenario: idempotent append

- **WHEN** `--persist-script ~/.bashrc` is run twice
- **THEN** `~/.bashrc` SHALL contain exactly one `export OPENCODE_CONFIG_DIR=...` line
- **AND** the second run SHALL exit zero without modifying the file.

#### Scenario: idempotent unset

- **WHEN** `--unset-script ~/.bashrc` is run after a `--persist-script ~/.bashrc`
- **THEN** `~/.bashrc` SHALL no longer contain the `export OPENCODE_CONFIG_DIR=...` line
- **AND** the unset run SHALL exit zero.

#### Scenario: default POSIX mode unchanged

- **WHEN** the installer is run on POSIX without `--persist-script`
- **THEN** the installer SHALL print the `export` line for the user to add manually
- **AND** SHALL NOT modify any file.

### Requirement: Backup stamp collision resistance

`tools/init-project.ts` SHALL generate backup directory names that do not collide within one second. The stamp SHALL include at least 8 hexadecimal random characters in addition to the timestamp.

#### Scenario: two overwrites in same second

- **WHEN** the user runs `init-project --overwrite` twice within one second
- **THEN** the two backup directories SHALL have different names
- **AND** neither backup SHALL overwrite the other.

#### Scenario: existing backups preserved

- **WHEN** an old backup directory (without the random suffix) exists
- **THEN** it SHALL remain untouched
- **AND** new backups SHALL use the suffix format.

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

### Requirement: Doctor SHALL expose explicit automation gates

Doctor SHALL accept exactly one optional automation gate selector with the values
`structural`, `qualification`, or `unattended`. When a gate is selected, process
exit `0` SHALL mean that selected gate passed, process exit `2` SHALL mean that
selected gate is blocked, and process exit `1` SHALL remain reserved for invalid
arguments or diagnostic execution failure. Without an explicit selector, doctor
SHALL preserve its existing informational report and structural-exit behavior.

#### Scenario: Qualification automation is blocked
- **WHEN** doctor reports `qualificationStatus: blocked` under `--require qualification`
- **THEN** it exits `2` and identifies every qualification-blocking check in stable order

#### Scenario: Unattended automation passes independently
- **WHEN** doctor reports `unattendedMissionStatus: pass` under `--require unattended`
- **THEN** it exits `0` regardless of advisory structural warnings

#### Scenario: Default diagnostic remains informational
- **WHEN** doctor runs without `--require`
- **THEN** it retains the existing structural process-exit contract and still reports all three statuses

### Requirement: Doctor SHALL make blocking reasons explicit

Doctor SHALL derive named structural, qualification, and unattended blocker lists
from the same check records that derive the corresponding top-level statuses. JSON
output SHALL expose those lists as structured data, and Markdown output SHALL place
the selected gate's blockers next to its result. A check that blocks qualification
SHALL use blocking wording rather than an advisory `should` message.

#### Scenario: Blocking project authority is reported consistently
- **WHEN** a project instruction-authority check blocks qualification
- **THEN** its status, wording, blocker list membership, and top-level qualification status all describe the same blocking result

#### Scenario: Multiple blockers are retained
- **WHEN** validation authority and canonical workflow identity are both unresolved
- **THEN** doctor reports both blockers without truncating the result to the first reason

