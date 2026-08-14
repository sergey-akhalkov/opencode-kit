## ADDED Requirements

### Requirement: Doctor SHALL compose canonical runtime-source collision evidence

Doctor SHALL reuse the maintained privacy-safe runtime-source inspector to evaluate
loader-visible collisions for canonical OpenSpec propose, apply, and archive skill
and command names. A same-name collision with unknown precedence SHALL block both
qualification and unattended readiness. Other additive instruction, config,
plugin, agent, command, or skill sources SHALL remain visible without becoming a
blocker unless an existing requirement identifies them as required authority.

#### Scenario: Canonical project overlay blocks lifecycle gates
- **WHEN** a project and global source both expose the same canonical OpenSpec apply skill or command and runtime precedence is unknown
- **THEN** doctor names both privacy-safe locations and blocks qualification and unattended readiness

#### Scenario: Ordinary additive instructions do not block
- **WHEN** global, parent, and project instruction sources are all loader-visible without competing canonical authority
- **THEN** doctor reports the sources and does not block a lifecycle gate solely because more than one instruction source exists

### Requirement: Runtime-source CLI help SHALL be effect-free

The runtime-source CLI SHALL parse `--help` and `-h` before resolving or walking
any source root. Help SHALL list every supported option, perform no inventory or
project effect, and exit `0`. An unknown option SHALL produce usage diagnostics and
exit `1` without running the inventory.

#### Scenario: Help performs no source scan
- **WHEN** an operator invokes `opencode:sources --help`
- **THEN** the CLI prints usage, exits `0`, and does not inspect host, custom, explicit, or project sources

#### Scenario: Unknown option fails before inventory
- **WHEN** an operator passes an unsupported runtime-source option
- **THEN** the CLI prints a cause-preserving usage error, exits `1`, and does not emit a runtime-source report
