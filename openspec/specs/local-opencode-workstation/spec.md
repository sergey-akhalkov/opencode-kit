# local-opencode-workstation Specification

## Purpose
Provide one safe, predictable Windows operator workflow for stable PowerShell terminals and elevated OpenCode clients that reuse a manually managed local server across the selected repositories.
## Requirements
### Requirement: Alacritty uses the current stable PowerShell
The workstation SHALL configure ordinary Alacritty sessions to launch `pwsh.exe`, SHALL resolve the stable PowerShell command rather than Windows PowerShell 5.1 or PowerShell Preview, and SHALL preserve unrelated Alacritty configuration.

#### Scenario: Ordinary Alacritty starts stable PowerShell
- **WHEN** the operator launches Alacritty without a project launcher
- **THEN** the initial shell reports PowerShell Core from the current stable `pwsh.exe` alias
- **AND** the shell does not report Windows PowerShell 5.1 or a Preview edition

#### Scenario: Existing unrelated terminal settings survive setup
- **WHEN** workstation setup adds the managed shell selection to an existing compatible Alacritty configuration
- **THEN** settings unrelated to terminal shell selection remain unchanged
- **AND** rollback can restore the exact pre-change configuration

### Requirement: One authenticated elevated server is manually managed
The workstation SHALL expose manual Start and Restart entry points for exactly one elevated OpenCode server bound to `127.0.0.1:4096`. The server SHALL require authentication, SHALL NOT have an automatic logon trigger, and SHALL use the configured kit global source.

#### Scenario: Start creates a healthy protected server
- **WHEN** no managed server or other listener owns port `4096` and the operator invokes Start
- **THEN** one elevated OpenCode server becomes healthy at `127.0.0.1:4096`
- **AND** authenticated requests succeed
- **AND** unauthenticated requests are rejected

#### Scenario: Repeated Start reuses the server
- **WHEN** the managed authenticated server is already healthy and the operator invokes Start again
- **THEN** the existing server process identity remains active
- **AND** no additional OpenCode server is created

#### Scenario: Start remains manual
- **WHEN** the user signs in to Windows or the workstation is restarted
- **THEN** this change does not automatically launch the shared OpenCode server

### Requirement: Restart is ownership-safe and complete
Restart SHALL terminate only a positively identified managed server process tree, SHALL prove that the prior tree and listener are gone before replacement, and SHALL restore an authenticated healthy server or report a cause-preserving failure.

#### Scenario: Managed server restarts cleanly
- **WHEN** the managed server is healthy and the operator invokes Restart
- **THEN** the prior managed process tree terminates
- **AND** no prior descendant continues listening or running as the managed server
- **AND** a different elevated managed process identity becomes healthy on `127.0.0.1:4096`

#### Scenario: Unrelated listener fails closed
- **WHEN** port `4096` is owned by a process that cannot be positively matched to the managed server identity
- **THEN** Start and Restart refuse to terminate or replace that process
- **AND** the operator receives the safe listener and ownership diagnostics needed to resolve the conflict

#### Scenario: Stale state cannot authorize process termination
- **WHEN** persisted process state does not match current process identity, creation time, command, task ownership, or endpoint ownership
- **THEN** Restart performs no destructive process action
- **AND** reports the exact identity check that failed

### Requirement: Privileged runtime material is protected
Every script, manifest, state record, and credential consumed by a highest-privilege task or elevated launcher SHALL be stored so an unelevated process cannot modify it. The server password SHALL be generated locally and SHALL NOT appear in repository files, Desktop artifacts, process arguments, or logs.

#### Scenario: Unelevated mutation is denied
- **WHEN** an unelevated process attempts to modify installed privileged runtime material or the server credential
- **THEN** Windows access control denies the write
- **AND** the installed elevated task continues to reference only protected material

#### Scenario: Credential remains out of observable arguments and logs
- **WHEN** the server and any project client are running
- **THEN** their command lines, Desktop shortcut arguments, repository diff, and bounded diagnostics contain no server password
- **AND** authentication is supplied to OpenCode through its supported environment mechanism

### Requirement: Project launchers attach to the shared server
The Desktop SHALL contain elevated launchers for `opencode-kit`, `pmac-emulator`, `controller-gateway-service`, and `windows-ui-automation`. Each launcher SHALL validate its configured Git worktree, verify the authenticated shared server, start Alacritty with stable PowerShell, and invoke `opencode attach` with that repository as `--dir`.

#### Scenario: Each selected repository opens through the shared server
- **WHEN** the shared server is healthy and the operator invokes any selected project launcher
- **THEN** Alacritty and its client process run elevated
- **AND** the client attaches to `http://127.0.0.1:4096`
- **AND** OpenCode reports the repository associated with that launcher as its current directory
- **AND** no per-client OpenCode server is started

#### Scenario: Multiple project clients stay attached concurrently
- **WHEN** one project shortcut has an active attached client and the operator launches a different project shortcut
- **THEN** both elevated Alacritty/OpenCode client trees remain active with their own exact mapped directories
- **AND** both use the same authenticated endpoint and the same single managed listener
- **AND** launching or closing either client does not replace the managed server or terminate the other client

#### Scenario: Missing server does not create an implicit server
- **WHEN** the shared server is unavailable and the operator invokes a project launcher
- **THEN** the launcher reports that the server must be started
- **AND** it does not invoke ordinary `opencode` TUI startup or create another server

#### Scenario: Invalid repository mapping fails before elevation-dependent work
- **WHEN** a configured repository is missing, is not a Git worktree, or differs from its protected launcher mapping
- **THEN** the launcher does not start OpenCode
- **AND** reports the affected repository identifier and validation failure without exposing credentials

#### Scenario: Arbitrary directory requests are rejected
- **WHEN** a launcher invocation supplies an unknown repository identifier or an unlisted path
- **THEN** the protected controller refuses the request
- **AND** no elevated Alacritty or OpenCode process is created for that directory

### Requirement: Operator diagnostics and rollback are available
The workstation SHALL retain bounded, secret-free lifecycle diagnostics and SHALL provide a rollback path that removes only managed artifacts, restores pre-change Alacritty configuration, and safely stops the managed server.

#### Scenario: Startup failure is actionable
- **WHEN** the server task, authentication probe, executable resolution, repository validation, or process cleanup fails
- **THEN** the operator receives the owning operation, safe resource identity, original failure cause, and diagnostics location
- **AND** the failure does not expose the server password

#### Scenario: Rollback restores the prior workstation state
- **WHEN** rollback is invoked against unchanged managed artifacts
- **THEN** the managed server process tree is safely stopped
- **AND** the scheduled task, six Desktop entry points, protected runtime material, and managed terminal configuration are removed or restored from their recorded pre-change state
- **AND** unrelated Desktop items, terminal settings, processes, repository files, and user data remain unchanged

#### Scenario: Drift blocks destructive rollback
- **WHEN** a managed file, shortcut, task, or process no longer matches its recorded installed identity
- **THEN** rollback preserves the drifted artifact
- **AND** reports the exact item requiring manual disposition instead of deleting or overwriting it

### Requirement: Setup is reproducible from the repository
The complete non-secret workstation source, strict repository-path configuration schema, install invocation, operator workflow, validation commands, and rollback invocation SHALL be maintained in `opencode-kit`. Files under the protected runtime root, the Scheduled Task, Alacritty configuration, and all six Desktop shortcuts SHALL be derived installation artifacts rather than the sole source of behavior.

#### Scenario: Compatible workstation can render the same installation
- **WHEN** an operator checks out `opencode-kit` on a compatible Windows workstation, supplies a schema-valid configuration containing the exact four local Git worktrees, and runs repository-documented preflight
- **THEN** preflight renders the protected root, task, endpoint, configuration identity, stable tool identities, four mappings, and six shortcuts without host mutation
- **AND** install can materialize those artifacts without copying a secret or host-only script from the original workstation

#### Scenario: Invalid machine configuration fails before mutation
- **WHEN** the configuration has an unsupported schema, unknown or missing key, duplicate or missing repository ID, non-string path, absent directory, or mismatched Git root
- **THEN** preflight and install reject it with the affected configuration path and field
- **AND** no protected file, task, shortcut, credential, process, or terminal configuration is changed

#### Scenario: Installed mappings do not hot reload
- **WHEN** the repository configuration changes after installation
- **THEN** existing runtime entry points continue using the protected manifest
- **AND** the changed configuration takes effect only through an explicit stopped repair or rollback and reinstall
