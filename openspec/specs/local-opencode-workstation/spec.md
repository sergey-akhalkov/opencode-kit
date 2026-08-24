# local-opencode-workstation Specification

## Purpose
Provide one safe, predictable Windows operator workflow for stable PowerShell terminals and elevated OpenCode clients that reuse one logon-started, tray-visible local server across the selected repositories.

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
The workstation SHALL expose Start, Restart, and Stop entry points for exactly one elevated OpenCode server bound to `127.0.0.1:4096` and one required authenticated Graphify service bound to `127.0.0.1:4097`. The OpenCode server SHALL require its own authentication, SHALL start automatically with Graphify at the owner interactive Windows logon, SHALL run without a visible console window, and SHALL use the configured kit global source. Managed state SHALL report running only after both services satisfy their identity, listener, and authenticated-readiness contracts.

#### Scenario: Start creates a healthy protected server
- **WHEN** no managed service or other listener owns ports `4096` and `4097` and the operator invokes Start
- **THEN** one elevated OpenCode server becomes healthy at `127.0.0.1:4096`
- **AND** one authenticated Graphify service becomes healthy at `127.0.0.1:4097`
- **AND** authenticated requests to each service succeed while unauthenticated requests are rejected
- **AND** the Start entry point does not leave a visible controller or server console

#### Scenario: Repeated Start reuses the server
- **WHEN** the managed OpenCode and Graphify services are already healthy and the operator invokes Start again
- **THEN** the existing service process and listener identities remain active
- **AND** no additional OpenCode or Graphify service is created
- **AND** no additional console window is created

#### Scenario: Start remains manual
- **WHEN** the managed runtime is stopped during an interactive session and the operator invokes Start
- **THEN** the shared elevated OpenCode and Graphify services become healthy on their configured loopback endpoints
- **AND** the operator does not have to sign out and back in

#### Scenario: Logon starts the shared server
- **WHEN** the owner signs in to an interactive Windows session on the installed workstation
- **THEN** the shared elevated OpenCode and Graphify services become healthy without a visible console
- **AND** the operator does not have to invoke Start first

### Requirement: Restart is ownership-safe and complete
Restart SHALL terminate only positively identified managed OpenCode, Graphify, supervisor, server-root, and listener identities, SHALL prove that the prior managed listeners are gone before replacement, and SHALL restore both authenticated services or report a cause-preserving failure. Restart invoked from the Desktop entry point or from the tray menu SHALL have the same ownership and replacement contract.

#### Scenario: Managed server restarts cleanly
- **WHEN** the managed runtime is healthy and the operator invokes Restart
- **THEN** the prior managed process identities and both listeners terminate
- **AND** no prior managed descendant continues listening or running as either service
- **AND** different elevated managed identities become healthy on `127.0.0.1:4096` and `127.0.0.1:4097`

#### Scenario: Unrelated listener fails closed
- **WHEN** either managed port is owned by a process that cannot be positively matched to its recorded service identity
- **THEN** Start, Restart, and Stop refuse to terminate or replace that process
- **AND** the operator receives the safe listener and ownership diagnostics needed to resolve the conflict

#### Scenario: Stale state cannot authorize process termination
- **WHEN** persisted process state does not match current process identity, creation time, command, task ownership, parentage, or listener ownership
- **THEN** Restart and Stop perform no destructive action against the mismatched process
- **AND** report the exact identity check that failed

### Requirement: Privileged runtime material is protected
Every script, manifest, state record, and credential consumed by a highest-privilege task or elevated launcher SHALL be stored so an unelevated process cannot modify it. The server password SHALL be generated locally and SHALL NOT appear in repository files, Desktop artifacts, process arguments, tray helper arguments, or logs.

#### Scenario: Unelevated mutation is denied
- **WHEN** an unelevated process attempts to modify installed privileged runtime material or the server credential
- **THEN** Windows access control denies the write
- **AND** the installed elevated task continues to reference only protected material

#### Scenario: Credential remains out of observable arguments and logs
- **WHEN** the server, tray helper, and any project client are running
- **THEN** their command lines, Desktop shortcut arguments, tray helper arguments, repository diff, and bounded diagnostics contain no server password
- **AND** authentication is supplied to OpenCode through its supported environment mechanism

### Requirement: Project launchers attach to the shared server
The Desktop SHALL contain elevated launchers for `opencode-kit`, `pmac-emulator`, `controller-gateway-service`, and `windows-ui-automation`. Each launcher SHALL validate its configured Git worktree, verify the complete authenticated shared runtime, start exactly one maximized Alacritty with stable PowerShell, invoke `opencode attach` with that repository as `--dir`, and release all launch-owned hidden invocation/elevation processes after the direct elevated controller completes.

#### Scenario: Each selected repository opens through the shared server
- **WHEN** the shared runtime is healthy and the operator invokes any selected project launcher
- **THEN** Alacritty and its client process run elevated
- **AND** the client attaches to `http://127.0.0.1:4096`
- **AND** OpenCode reports the repository associated with that launcher as its current directory
- **AND** no per-client OpenCode server or local Graphify service is started
- **AND** exactly one Alacritty window is created and it is maximized
- **AND** no visible or hidden launch-owned controller/elevation process remains after bounded handoff

#### Scenario: Multiple project clients stay attached concurrently
- **WHEN** one project shortcut has an active attached client and the operator launches a different project shortcut
- **THEN** both elevated Alacritty/OpenCode client trees remain active with their own exact mapped directories
- **AND** both use the same authenticated OpenCode and Graphify endpoints
- **AND** launching or closing either client does not replace the managed services or terminate the other client

#### Scenario: Missing server does not create an implicit server
- **WHEN** OpenCode or Graphify is unavailable and the operator invokes a project launcher
- **THEN** the launcher reports the unavailable managed service and required recovery action
- **AND** it does not invoke ordinary `opencode` startup, create another server, or start a local Graphify process
- **AND** it does not leave a visible or hidden controller/elevation chain

#### Scenario: Invalid repository mapping fails before elevation-dependent work
- **WHEN** a configured repository is missing, is not a Git worktree, or differs from its protected launcher mapping
- **THEN** the launcher does not start OpenCode
- **AND** reports the affected repository identifier and validation failure without exposing credentials

#### Scenario: Arbitrary directory requests are rejected
- **WHEN** a launcher invocation supplies an unknown repository identifier or an unlisted path
- **THEN** the protected controller refuses the request
- **AND** no elevated Alacritty or OpenCode process is created for that directory

#### Scenario: Post-elevation launch failure remains visible
- **WHEN** an elevated launcher validation fails after UAC but before Alacritty handoff
- **THEN** the launch exits non-zero through the direct elevated controller result
- **AND** the hidden Desktop invoker presents the existing secret-free diagnostics popup
- **AND** no launch-owned process remains after the popup is dismissed

### Requirement: Operator diagnostics and rollback are available
The workstation SHALL retain bounded, secret-free lifecycle diagnostics for OpenCode, Graphify, the tray, and project launchers. It SHALL provide a rollback path that stops only positively identified managed processes/listeners, restores the exact pre-change Graphify MCP configuration and Alacritty configuration when their managed identities still match, and removes only managed protected artifacts.

#### Scenario: Startup failure is actionable
- **WHEN** either service task, process, listener, authentication probe, executable resolution, graph/config validation, repository validation, or process cleanup fails
- **THEN** the operator receives the owning operation, safe resource identity, original failure cause, and diagnostics location
- **AND** a hidden Desktop launcher failure presents a secret-free dialog that names the diagnostics location
- **AND** the failure does not expose either service credential

#### Scenario: Rollback restores the prior workstation state
- **WHEN** rollback is invoked against unchanged managed artifacts and config identity
- **THEN** the managed OpenCode and Graphify process trees/listeners are safely stopped
- **AND** the exact prior Graphify MCP config bytes and pre-change Alacritty configuration are restored
- **AND** managed tasks, Desktop entry points, tray presence, protected credentials/state/modules, and derived configuration are removed or restored from their recorded pre-change state
- **AND** unrelated config, Desktop items, terminal settings, processes, repository files, and user data remain unchanged

#### Scenario: Drift blocks destructive rollback
- **WHEN** a managed config file, module, shortcut, task, credential, or process no longer matches its recorded installed identity
- **THEN** rollback preserves the drifted artifact
- **AND** reports the exact item requiring manual disposition instead of deleting or overwriting it

### Requirement: Setup is reproducible from the repository
The complete non-secret workstation source, strict repository-path configuration schema, install invocation, operator workflow, validation commands, and rollback invocation SHALL be maintained in `opencode-kit`. Files under the protected runtime root, the Scheduled Tasks, Alacritty configuration, tray helper, hidden invoker, and all six Desktop shortcuts SHALL be derived installation artifacts rather than the sole source of behavior.

#### Scenario: Compatible workstation can render the same installation
- **WHEN** an operator checks out `opencode-kit` on a compatible Windows workstation, supplies a schema-valid configuration containing the exact four local Git worktrees, and runs repository-documented preflight
- **THEN** preflight renders the protected root, server task, tray task, endpoint, configuration identity, stable tool identities, four mappings, and six shortcuts without host mutation
- **AND** install can materialize those artifacts without copying a secret or host-only script from the original workstation

#### Scenario: Invalid machine configuration fails before mutation
- **WHEN** the configuration has an unsupported schema, unknown or missing key, duplicate or missing repository ID, non-string path, absent directory, or mismatched Git root
- **THEN** preflight and install reject it with the affected configuration path and field
- **AND** no protected file, task, shortcut, credential, process, or terminal configuration is changed

#### Scenario: Installed mappings do not hot reload
- **WHEN** the repository configuration changes after installation
- **THEN** existing runtime entry points continue using the protected manifest
- **AND** the changed configuration takes effect only through an explicit stopped repair or rollback and reinstall

### Requirement: Persistent tray lamp reports server liveness
The workstation SHALL show one notification-area icon labeled `opencode-server` after interactive logon until the operator chooses Exit. The icon SHALL be green only when the managed OpenCode and Graphify services are both healthy, SHALL blink a red restarting state while tray Restart is replacing the runtime, and SHALL be red when either required service is stopped, failed, or degraded while the tray host is running. The tray host SHALL NOT receive either service credential.

#### Scenario: Healthy server shows a green lamp
- **WHEN** the managed OpenCode and Graphify services are healthy during an interactive owner session
- **THEN** the notification area shows one `opencode-server` icon
- **AND** that icon is green

#### Scenario: Graphify degradation shows red without stopping clients
- **WHEN** OpenCode remains healthy but the managed Graphify service exits or fails readiness
- **THEN** the notification icon becomes red and identifies degraded shared tools without a credential
- **AND** existing attached client processes are not terminated by the status transition

#### Scenario: Tray Restart shows a restarting lamp then green
- **WHEN** the operator chooses Restart from a healthy or degraded managed runtime
- **THEN** the icon leaves its steady state and blinks in a restarting state until replacement finishes
- **AND** the icon returns to steady green only when both replacement services are healthy

### Requirement: Tray Restart and Exit use the same ownership-safe controller
The tray icon SHALL expose a right-click menu with exactly Restart and Exit. Restart SHALL perform the same ownership-safe replacement as the Desktop Restart entry point. Exit SHALL perform an ownership-safe stop of only the managed server tree, SHALL close the tray host, and SHALL NOT disable logon autostart.

#### Scenario: Tray Restart replaces the managed server
- **WHEN** the managed server is healthy and the operator chooses Restart from the tray menu
- **THEN** the prior managed server process identity is gone
- **AND** a different elevated managed process identity becomes healthy
- **AND** the tray icon remains visible and returns to green after the restarting state

#### Scenario: Tray Exit stops the server and closes the tray
- **WHEN** the managed server is healthy and the operator chooses Exit from the tray menu
- **THEN** the managed server process tree and listener are gone
- **AND** the `opencode-server` tray icon is no longer visible
- **AND** the next owner interactive logon starts the shared server and tray again without a further Start invocation

#### Scenario: Stop is available without a Desktop Stop shortcut
- **WHEN** the operator invokes the protected controller Stop mode
- **THEN** only a positively identified managed server tree is stopped
- **AND** no Desktop Stop shortcut is created
