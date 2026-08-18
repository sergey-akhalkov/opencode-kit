## Why

Each OpenCode TUI currently starts its own server and repeats server and MCP initialization, while Alacritty defaults to Windows PowerShell 5.1 even though the current stable PowerShell is installed. This workstation needs one explicit, safely managed elevated OpenCode server and predictable elevated project launchers so the operator can reuse that server across the four active repositories without manually reconstructing commands.

## Outcome Capsule

- **Outcome**: On the current Windows workstation, the operator can manually start or restart one authenticated elevated OpenCode server from Desktop entry points and launch elevated Alacritty/OpenCode clients for `opencode-kit`, `pmac-emulator`, `controller-gateway-service`, and `windows-ui-automation`; every client attaches to that server with its exact repository directory, ordinary Alacritty sessions use the current stable `pwsh.exe` alias instead of Windows PowerShell 5.1, and the complete non-secret setup can be reproduced from `opencode-kit` on another compatible workstation by supplying its repository paths.
- **Operating Envelope**: Windows user `NEURO\noilw`; Alacritty `0.17.0`; stable Microsoft Store PowerShell exposed as `pwsh.exe` and currently version `7.6.5`; OpenCode `1.18.18`; loopback endpoint `127.0.0.1:4096`; active kit source from `OPENCODE_CONFIG_DIR`; manual operation during the interactive user session; Desktop resolved through the Windows known-folder API and currently backed by OneDrive; the four locally verified Git worktrees selected during discovery.
- **Non-Goals**: Starting the server at logon; installing a Windows service; enabling remote or LAN access; selecting PowerShell Preview; upgrading or reinstalling Alacritty, PowerShell, or OpenCode; changing any of the four target repositories; making every non-shortcut Alacritty launch elevated; guaranteeing that already attached clients reconnect across server restart; adding a general multi-user workstation installer; or committing, pushing, deploying, releasing, or publishing anything.
- **Non-Deferrable Invariants**: The elevated HTTP automation endpoint binds only to loopback and requires authentication; credentials never appear in repository files, Desktop artifacts, command lines, or logs; unelevated processes cannot modify a script or credential later executed by the elevated server task; Start is idempotent; Restart terminates only the positively identified managed server process tree and proves the old tree is gone; an unrelated listener on port `4096` fails closed; project launchers never fall back to an implicit per-TUI server; exact repository paths are validated before launch; existing host configuration and unrelated worktree changes are preserved.
- **Observable Proof**: Invoke the actual Desktop entry points on the current machine. Observe a default Alacritty shell report PowerShell Core `7.6.5`; Start produce one authenticated healthy elevated server on `127.0.0.1:4096`; a second Start preserve the same managed process identity; each project launcher open elevated Alacritty and attach with the expected `--dir`; unauthenticated health access fail while the protected client route succeeds; Restart replace the managed process identity, leave no old descendant or listener, restore health, and permit every launcher to attach again. Preserve exact commands, process/token identities, endpoint observations, exits, bounded logs, and cleanup or rollback results.
- **Material Residual Risks**: A shared elevated OpenCode server is a privileged automation boundary and executes against user-writable configuration and repositories; one server is a shared failure domain for all clients; server restart can disconnect active TUI clients; future Alacritty, PowerShell, OpenCode, Windows Task Scheduler, or App Execution Alias changes can invalidate launcher assumptions; process-tree shutdown must be demonstrated because orphaned OpenCode descendants have occurred in prior local proof work.
- **Stop Line**: Finish when the PowerShell selection, protected server lifecycle, authentication, six Desktop entry points, exact four-repository attachment, repository-owned reproducible setup instructions/configuration, diagnostics, rollback, and current-machine runtime proof are complete. Do not add auto-start, remote access, a Stop shortcut, Windows service packaging, a tray application, fleet deployment UX, repository-specific behavior beyond the four path mappings, automatic TUI reconnection, software upgrades, or optional appearance customization.

## What Changes

- Configure Alacritty to launch the stable `pwsh.exe` alias with a minimal shell configuration while preserving unrelated Alacritty settings.
- Add a protected, manually triggered, highest-privilege OpenCode server owner with explicit loopback address, port, authentication, bounded diagnostics, idempotent Start, and ownership-safe Restart behavior.
- Add elevated Desktop Start and Restart entry points for the shared server.
- Add four elevated Desktop project entry points that launch Alacritty and use `opencode attach http://127.0.0.1:4096 --dir <verified-repository>` without creating another server.
- Add a strict non-secret repository-path configuration and repository-owned operator instructions so the protected installation and all six shortcuts can be recreated from this repository on a compatible Windows host.
- Add reversible setup/rollback controls and focused proof of stable PowerShell resolution, elevation, authentication, reuse, directory selection, restart cleanup, and fail-closed port handling.

## Capabilities

### New Capabilities

- `local-opencode-workstation`: Machine-local Windows terminal, privileged shared-server lifecycle, and repository-specific attached-client behavior for the selected operator workstation.

### Modified Capabilities

None.

## Impact

- Machine-local Alacritty configuration under the Windows roaming configuration directory.
- Protected local runtime files, generated server credential, one manually triggered highest-privilege scheduled task or equivalent verified Windows lifecycle owner, and bounded local logs/state.
- Six Desktop entry points in the user's resolved OneDrive-backed Desktop known folder.
- A maintainable TypeScript setup/runtime source, strict machine-path configuration, and operator instructions under the repository's existing tooling ownership; no new package dependency or public API.
- OpenCode global source resolution continues to use the existing user-level `OPENCODE_CONFIG_DIR`; target repository contents remain unchanged.
- No remote state, firewall rule, public network interface, persisted product data, software installation, release, or deployment is changed.
