## ADDED Requirements

### Requirement: Portable workflow tools accompany the global kit source

Reusable project workflow entrypoints SHALL live under explicit non-loader `global/bin/` so the same resolved kit global source provides runtime instructions and their deterministic executables in unrelated project contexts. The tools SHALL use import-safe main guards and remain explicit invocations rather than auto-loaded OpenCode custom tools or plugins.

#### Scenario: Kit source is used from another project

- **WHEN** `OPENCODE_CONFIG_DIR` resolves to the kit global source and the current working directory is an unrelated project
- **THEN** the project can invoke the portable tools with its own explicit root and validation argv
- **AND** the tools do not derive behavior from the kit repository working directory.
