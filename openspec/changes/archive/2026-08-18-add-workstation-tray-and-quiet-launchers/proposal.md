## Why

Desktop Start/Restart/project shortcuts currently open several `node.exe` consoles, the managed serve task leaves a persistent empty console, and project Alacritty starts unrestored. The operator now needs a quiet workstation: no launcher consoles, one maximized project terminal, automatic server start at Windows logon, and a tray lamp with Restart/Exit.

## Outcome Capsule

- **Outcome**: On this Windows workstation, logon starts the shared elevated OpenCode server without a console; a tray lamp labeled `opencode-server` is green while that server is healthy and red while it is stopped; right-click Restart replaces the managed server and Exit stops it until the next logon without disabling autostart; Start/Restart/project Desktop shortcuts create no extra consoles; each project shortcut opens exactly one maximized Alacritty attached to the shared server.
- **Operating Envelope**: Same current machine and tools as the installed workstation (`NEURO\noilw`, Alacritty `0.17.0`, stable `pwsh.exe`, OpenCode `1.18.18`, loopback `127.0.0.1:4096`, OneDrive Desktop, four mapped Git worktrees). Autostart is an AtLogon trigger for the interactive owner session, not a boot-time service. Tray UI is a derived protected helper, not a compiled app or Windows service.
- **Non-Goals**: Windows service packaging; boot-before-logon start; remote/LAN bind; exclusive Alacritty fullscreen; ordinary (non-project) Alacritty maximize; tray menus beyond Restart/Exit; a Desktop Stop shortcut; disabling autostart from Exit; automatic TUI reconnect after Restart/Exit; changing repository mappings, authentication, or credential storage; committing, pushing, deploying, or publishing.
- **Non-Deferrable Invariants**: Loopback-only authenticated server; credential never appears in repository files, Desktop artifacts, shortcut/task/tray arguments, or logs; unelevated processes cannot modify privileged runtime material; Start remains idempotent; Restart and Exit terminate only a positively identified managed server tree; unrelated port-`4096` listeners fail closed; project launchers never start an implicit second server; tray does not receive the server password.
- **Observable Proof**: After install/repair, logon or the tray/server start path leaves zero new consoles, one `opencode-server` tray icon, and a healthy authenticated listener; the lamp is green when healthy and red after Exit; Restart replaces process identity and returns green; a project `.lnk` opens exactly one maximized Alacritty attached to that listener; Start after Exit restores green without extra consoles.
- **Material Residual Risks**: An always-on elevated loopback server after logon widens the local privileged window; tray-before-shell-ready can miss the first NotifyIcon paint; Exit stops the server until the next logon while leaving the red lamp visible; Restart still disconnects attached TUIs.
- **Stop Line**: Finish when quiet launchers, maximized project Alacritty, AtLogon server start, persistent tray lamp with Restart/Exit, ownership-safe stop, repair of the current install, and current-machine runtime proof are complete. Do not add a service, boot trigger, extra tray commands, or appearance work beyond the lamp and maximize.

## What Changes

- Hide Start, Restart, and project launcher consoles so those entry points no longer show `node.exe` windows.
- Make the managed `serve` task itself windowless; server output stays in the existing ProgramData logs.
- Start project Alacritty maximized through the protected config only.
- **BREAKING** for the installed workstation contract: add owner AtLogon autostart of the shared server. The current "Start remains manual / no logon trigger" requirement is replaced.
- Add a persistent tray presence labeled `opencode-server` with a green lamp when the managed server is healthy and a red lamp when it is stopped. The tray outlives Exit so red is observable.
- Add tray right-click **Restart** (existing ownership-safe restart) and **Exit** (ownership-safe stop; autostart remains armed for the next logon).
- Add a public controller `stop` mode that reuses `stopManagedServer()` so Exit does not invent a second killer.
- Repair the current stopped installation: rewrite shortcuts, protected Alacritty config, hidden invoker, tray helper, and the new tray task without treating the old node-targeted shortcuts as unrecoverable drift.

## Capabilities

### New Capabilities

None. Tray, autostart, quiet launchers, and maximize stay inside the existing workstation capability.

### Modified Capabilities

- `local-opencode-workstation`: Replace manual-only start with AtLogon autostart plus a persistent tray lamp; require zero extra consoles from Desktop entry points; require maximized project Alacritty; add ownership-safe `stop`/Exit that does not disable autostart.

## Impact

- `tools/windows/opencode-workstation.ts` and `tools/windows/README.md`.
- Installed `%ProgramData%\OpenCodeWorkstation` derived artifacts: hidden invoker, tray helper, icons, protected Alacritty config, manifest/task identities.
- Existing server Scheduled Task remains the serve owner and stays demand-start from Start/Restart/tray; a second Highest AtLogon tray task becomes the lamp and logon starter.
- Six Desktop shortcuts change target/arguments from visible `node.exe` to a windowless invoker.
- Main spec `openspec/specs/local-opencode-workstation/spec.md` after archive.
- No new package dependency. Reuse: extend the existing controller; WinForms `NotifyIcon` is the platform tray; `stopManagedServer`/`restart` stay the only process killers.
