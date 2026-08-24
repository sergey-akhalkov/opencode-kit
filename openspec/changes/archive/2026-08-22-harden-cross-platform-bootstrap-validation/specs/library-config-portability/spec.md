## ADDED Requirements

### Requirement: MCP installer behavior is completely fixture-tested
The code-intelligence MCP installer SHALL expose effect-free help, `--check`, and `--dry-run`; probe Serena and Codebase Memory independently; install only missing tools in default mode; preserve working versions; stop on package-manager failure; and report stable privacy-safe executable/result facts. Maintained tests SHALL cover both present, both missing, each partial state, failed probe, failed install, invalid option, check, dry-run, and path-with-spaces behavior.

#### Scenario: One MCP is missing
- **WHEN** one executable probe succeeds and the other reports missing
- **THEN** default mode invokes only the documented installer for the missing executable
- **AND** re-probes it before success

#### Scenario: Check mode finds a missing MCP
- **WHEN** `--check` observes either executable missing
- **THEN** it exits non-zero without running a package manager
- **AND** reports each executable state independently

#### Scenario: Dry-run observes missing MCPs
- **WHEN** `--dry-run` observes missing executables
- **THEN** it prints normalized planned argv without installing or initializing anything
- **AND** exits according to the documented dry-run contract

### Requirement: Workstation path configuration has portable and machine-local owners
The repository SHALL track a schema-valid workstation configuration example containing placeholders or repository IDs but no absolute maintainer paths. The concrete host mapping SHALL live in a gitignored machine-local file. Tools SHALL require an explicit config path or documented local default and SHALL never infer the maintainer's repositories from the tracked example.

#### Scenario: Clean checkout on another machine
- **WHEN** the tracked workstation example is inspected after clone
- **THEN** it contains no absolute user or repository path
- **AND** preflight explains how to create the ignored local config

#### Scenario: Local config is absent
- **WHEN** a workstation command requiring repository mappings runs without the machine-local config
- **THEN** it fails before elevation or host mutation
- **AND** names the expected safe local path and example
