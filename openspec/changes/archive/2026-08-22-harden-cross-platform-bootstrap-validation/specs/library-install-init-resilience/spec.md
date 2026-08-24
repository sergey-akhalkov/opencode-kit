## ADDED Requirements

### Requirement: Windows command entrypoints avoid PowerShell shim policy failures
Documented and automated Windows repository commands SHALL invoke platform-correct executable entrypoints. When PowerShell script execution policy prevents npm/OpenSpec `.ps1` shims, maintained commands SHALL use `.cmd` shims or direct Node argv without changing execution policy, invoking a shell string, or suppressing the original failure.

#### Scenario: PowerShell blocks script shims
- **WHEN** Windows PowerShell resolves `npm` or `openspec` to a blocked `.ps1` shim
- **THEN** the maintained Windows invocation uses the corresponding `.cmd` or direct Node entrypoint
- **AND** repository validation runs without policy bypass or profile mutation

#### Scenario: Required executable is absent
- **WHEN** neither a platform-correct shim nor direct executable can be resolved
- **THEN** bootstrap fails before mutation with the command identity and PATH-safe diagnostic
- **AND** does not fall back to a shell-evaluated command string

### Requirement: Native Windows CI validates non-mutating bootstrap behavior
Repository CI SHALL run strict validation, tests, selected strict OpenSpec validation, command-resolution fixtures, and installer/bootstrap dry-run/check scenarios on `windows-latest` in addition to Ubuntu. Windows CI SHALL NOT install MCPs, mutate user environment/profile, request elevation, register tasks, launch desktop UI, or call configured providers.

#### Scenario: Windows merge validation runs
- **WHEN** a pull request changes installer, bootstrap, portable process, config, or Windows tooling
- **THEN** the Windows job executes the maintained non-mutating matrix
- **AND** preserves exact failing command, exit status, stdout, and stderr

#### Scenario: Windows-only destructive path is reached
- **WHEN** a CI fixture would invoke `setx`, elevation, task registration, service/process control, or a real package install
- **THEN** the fixture fails before that effect
- **AND** records the blocked effect class

### Requirement: Cross-platform bootstrap fixtures preserve failure atomicity
Disposable Windows and Ubuntu fixtures SHALL cover fresh install, existing local config, invalid source, path with spaces, command failure, interrupted write, dry-run, check, and rollback readback. A failing fixture SHALL leave pre-existing bytes and environment unchanged and remove only attributable temporary files.

#### Scenario: Config path contains spaces
- **WHEN** a disposable global source and target path contain spaces
- **THEN** bootstrap passes exact argv and materializes the expected config
- **AND** no argument is split or shell-expanded

#### Scenario: Atomic replacement fails
- **WHEN** replacement is injected to fail after temporary output is written
- **THEN** the prior target bytes remain unchanged
- **AND** the temporary artifact and original cause are reported and cleaned
