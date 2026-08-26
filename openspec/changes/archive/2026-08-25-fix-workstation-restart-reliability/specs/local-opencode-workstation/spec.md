## MODIFIED Requirements

### Requirement: Restart is ownership-safe and complete
Restart SHALL terminate only positively identified managed OpenCode, Graphify, supervisor, server-root, and listener identities, SHALL prove that the prior managed listeners are gone before replacement, and SHALL restore both authenticated services or report a cause-preserving failure. Restart SHALL NOT terminate a process that is not one of those validated identities. An already-exited validated identity SHALL count as stopped, not as a controller failure. Restart invoked from the Desktop entry point or from the tray menu SHALL have the same ownership and replacement contract. One operator Restart SHALL perform one replacement attempt; completing that attempt SHALL NOT require a second Restart click.

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
- **AND** reports the exact identity check that failed

#### Scenario: Already-exited validated identity is not a Restart failure
- **WHEN** the managed server identities match and Restart terminates them, and at least one validated identity has already exited
- **THEN** Restart does not fail merely because the terminator reported that the process was already gone
- **AND** Restart still refuses to start a replacement while any validated identity or the managed listener remains

#### Scenario: Unmatched descendants are not a Restart failure
- **WHEN** the managed server identities match and unmatched descendant processes exist beside the validated supervisor, server-root, and listener
- **THEN** Restart does not terminate those unmatched processes
- **AND** Restart still replaces the validated managed identities and restores a healthy authenticated listener

#### Scenario: Restart replaces a matching starting server
- **WHEN** the managed task is Running, persisted state is `starting`, and the recorded supervisor and server-root identities still match
- **THEN** Restart terminates those matching identities and any matching listener
- **AND** a different elevated managed process identity becomes healthy on `127.0.0.1:4096`

#### Scenario: Stopping serve does not show the operator command dialog
- **WHEN** Restart or Stop terminates the managed serve task
- **THEN** the hidden serve invoker does not present the operator command-failed dialog
- **AND** Desktop Start or Restart still presents that dialog when those operator commands themselves exit non-zero

### Requirement: Persistent tray lamp reports server liveness
The workstation SHALL show one notification-area icon labeled `opencode-server` after interactive logon until the operator chooses Exit. The icon SHALL be green only when the managed OpenCode and Graphify services are both healthy, SHALL blink a red restarting state while tray Restart is replacing the runtime, SHALL be red when either required service is stopped, failed, or degraded while the tray host is running, and SHALL stay red after a failed tray Restart until a later successful Start or Restart. The tray host SHALL NOT receive either service credential.

#### Scenario: Healthy server shows a green lamp
- **WHEN** the managed authenticated server is healthy during an interactive owner session
- **THEN** the notification area shows one `opencode-server` icon
- **AND** that icon is green

#### Scenario: Graphify degradation shows red without stopping clients
- **WHEN** OpenCode remains healthy but the managed Graphify service exits or fails readiness
- **THEN** the notification icon becomes red and identifies degraded shared tools without a credential
- **AND** existing attached client processes are not terminated by the status transition

#### Scenario: Tray Restart shows a restarting lamp then green
- **WHEN** the operator chooses Restart from a healthy or degraded managed runtime
- **THEN** the icon leaves the steady green healthy state and blinks in a restarting state until replacement finishes
- **AND** the icon returns to steady green only when both replacement services are healthy

#### Scenario: Failed tray Restart stays red
- **WHEN** tray Restart fails to restore a healthy managed server
- **THEN** the icon does not return to green
- **AND** the icon is red
- **AND** the icon tooltip reports that Restart failed

### Requirement: Tray Restart and Exit use the same ownership-safe controller
The tray icon SHALL expose a right-click menu with exactly Restart and Exit. Restart SHALL perform the same ownership-safe replacement as the Desktop Restart entry point. Exit SHALL perform an ownership-safe stop of only the positively identified managed OpenCode and Graphify identities, SHALL close the tray host, and SHALL NOT disable logon autostart. While a tray Restart attempt is in flight, a further Restart click SHALL NOT start a second controller. A failed tray Restart SHALL present a secret-free balloon that names the controller-error log and SHALL NOT treat a leftover listener as success.

#### Scenario: Tray Restart replaces the managed server
- **WHEN** the managed runtime is healthy and the operator chooses Restart from the tray menu
- **THEN** the prior managed OpenCode and Graphify process identities are gone
- **AND** different elevated managed identities become healthy for both services
- **AND** the tray icon remains visible and returns to green after the restarting state

#### Scenario: Tray Exit stops the server and closes the tray
- **WHEN** the managed runtime is healthy and the operator chooses Exit from the tray menu
- **THEN** the managed runtime process identities and listeners are gone
- **AND** the `opencode-server` tray icon is no longer visible
- **AND** the next owner interactive logon starts the shared server and tray again without a further Start invocation

#### Scenario: Stop is available without a Desktop Stop shortcut
- **WHEN** the operator invokes the protected controller Stop mode
- **THEN** only a positively identified managed server identity set is stopped
- **AND** no Desktop Stop shortcut is created

#### Scenario: In-flight tray Restart ignores a second click
- **WHEN** tray Restart is already replacing the managed server and the operator chooses Restart again
- **THEN** the tray does not start a second controller process
- **AND** the in-flight replacement continues

#### Scenario: Failed tray Restart names the diagnostics log
- **WHEN** tray Restart fails
- **THEN** the tray shows a secret-free balloon that names `controller-errors.log`
- **AND** the balloon and tray state contain no server password
- **AND** the tray does not start an implicit second Start merely because the first Restart failed

#### Scenario: Successful tray Restart does not show the serve-task dialog
- **WHEN** tray Restart restores a healthy managed server
- **THEN** the operator does not receive the hidden serve-task command-failed dialog
- **AND** the lamp returns to green after the restarting state
