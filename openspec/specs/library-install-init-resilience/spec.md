# library-install-init-resilience Specification

## Purpose
TBD - created by archiving change install-init-hardening. Update Purpose after archive.
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
