## MODIFIED Requirements

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
