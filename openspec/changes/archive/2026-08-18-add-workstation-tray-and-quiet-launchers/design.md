## Context

See `proposal.md` for motivation. The installed workstation already has one TypeScript controller, one Highest Interactive server Scheduled Task with **no** triggers, six Desktop shortcuts that target visible `node.exe`, and `serve()` that redirects OpenCode stdio to ProgramData logs while leaving the supervisor console visible. `stopManagedServer()` and `restart()` already implement ownership-safe process termination. There is no tray owner, no public `stop` mode, and no maximize setting in the protected Alacritty config.

This increment changes lifecycle policy (manual start → owner AtLogon) and the privileged operator surface. It is Material. Host mutation is authorized for this machine by the standing local-admin grant plus the explicit operator request; re-verify the elevated token immediately before install/repair.

### Fidelity Ladder

`read-only current install identity -> effect-free --help/preflight of the new controller -> stopped repair of shortcuts/task/tray/config -> Start/stop/restart without consoles -> tray lamp green/red + Restart/Exit -> one maximized project attach -> AtLogon or equivalent tray-host start path -> fresh critical-only SDET -> complete local validation`.

Current rung: planning against the installed controller and main spec. Next real boundary: `node tools/windows/opencode-workstation.ts --help` listing `stop` with zero host mutation. Repair and tray/server process effects stay on this workstation, loopback only, no provider/model call, no target-repository write.

### Reuse Discovery

- **Requested capability / trigger**: persistent Windows tray host, windowless shortcut/task invoker, public stop mode, AtLogon autostart.
- **Sources reached**: current repository graph/search under `tools/windows` and workstation specs; platform WinForms `NotifyIcon`; existing controller `stopManagedServer`/`restart`/`start`.
- **Sources blocked**: no configured cross-project tray owner.
- **Candidates**: existing controller (extend); WSH/wscript hidden invoke; PowerShell WinForms NotifyIcon; second Highest AtLogon task vs folding tray into `serve()`.
- **Disposition**: `extend` the workstation controller; `build-minimal` derived protected `invoke.vbs` + tray helper. No new package.
- **Why not reuse-only**: no tray/hidden-launcher owner exists. Folding the lamp into `serve()` cannot show red after Exit because `stopManagedServer()` kills the supervisor tree.
- **Cross-project**: `not-applicable`.

## Goals / Non-Goals

**Goals:**

- Keep one controller as the only process killer and server starter.
- Keep the existing server task as the serve owner and demand-started by Start/Restart/tray.
- Give the lamp its own AtLogon host so red survives Exit.
- Hide every Desktop controller console and the serve supervisor console.
- Maximize only the protected project Alacritty config.

**Non-Goals:**

- Compiling a tray exe, adding a Windows service, or starting before the interactive desktop.
- Tray commands other than Restart and Exit.
- Changing credential storage, repository mappings, or attach URL/port.

## Decisions

### Decision 1: Tray host is a second Highest AtLogon task, not a child of `serve()`

Logon starts a protected windowless tray helper. That helper calls the installed controller `start` after the desktop session exists, then paints green/red from secret-free `state.json` plus listener/health facts it can observe without the password (process/state identity written by `serve()`, or an authenticated health call performed by the already-elevated controller rather than the helper). The helper never receives `OPENCODE_SERVER_PASSWORD`.

Right-click Restart invokes protected `restart`. Exit invokes protected `stop`. The tray process stays alive after Exit.

Alternative rejected: spawn the tray from `serve()` after healthy. Exit/`stopManagedServer()` uses `taskkill /T` on the supervisor, so the lamp cannot stay red. Alternative rejected: make `serve()` itself the idle supervisor after stop. That rewrites the current start/stop identity model and leaves a privileged node process running with no server. Alternative rejected: a Windows service. Out of envelope and unnecessary for an interactive lamp.

### Decision 2: Server task stays demand-start; only the tray task has AtLogon

The current server task action remains `node <protected-controller> serve`, but must be launched windowless (Decision 3). Adding AtLogon to both tasks would double-start. Tray-only AtLogon plus `start` from the tray gives one autostart path and leaves existing `triggerCount === 0` server-task identity almost intact.

Alternative rejected: AtLogon on the server task and a separate unelevated Startup-folder lamp. The lamp would need another elevation hop and could race the server. Alternative rejected: boot (`AtStartup`) trigger. No desktop/tray until logon.

### Decision 3: Windowless invoker for shortcuts and serve

Desktop shortcuts currently target `node.exe`, which always allocates a console. Install writes a protected `invoke.vbs` and points shortcuts at `wscript.exe //nologo <invoke.vbs> <mode...>`. The same invoker starts `serve` from the server task so the supervisor console disappears. `elevateInvocation` adds `-WindowStyle Hidden`. Non-zero hidden launcher exit shows a secret-free `MsgBox` naming `controller-errors.log`.

Alternative rejected: shortcut `WindowStyle = 7` only. That still flashes/minimizes consoles. Alternative rejected: `powershell -WindowStyle Hidden` as the only hide. Console-subsystem powershell often flashes from Explorer.

Repair MUST accept the previous node-targeted shortcut contract as non-drift, then rewrite to the invoker. Current repair compares live shortcuts to `expectedShortcut()` of the new source and would otherwise refuse the install as drifted.

### Decision 4: Public `stop` mode wraps `stopManagedServer()`

Help and `publicModes` gain `stop`. No Desktop Stop shortcut. Exit and any future caller use this mode so there is one ownership-safe killer.

### Decision 5: Maximize only protected project Alacritty

Protected `alacritty.toml` gains:

```toml
[window]
startup_mode = "Maximized"
```

Ordinary `%APPDATA%` Alacritty is unchanged beyond the already managed shell line. Repair must rewrite the protected file even when `manifest.alacritty` already exists.

### Decision 6: Tray observes secret-free state, never the credential

`serve()` already writes `state.json` with supervisor/server/listener identities and health. The tray helper polls that file and parent/server liveness. Green requires current running state plus healthy flag. Red is any successful stop or absent managed listener while the tray host is up. If state is unreadable, the lamp stays red and the helper logs a secret-free line; it does not call OpenCode with a password.

Icons are tiny derived `.ico` files written at install into the protected root and hashed in the manifest.

## Failure Boundaries And Diagnostics

- Hidden launcher/`stop`/`start`/`restart` failures append to `controller-errors.log` and, when launched from a Desktop shortcut, show a secret-free dialog.
- Tray Restart/Exit failures keep the last honest lamp color and do not kill unrelated processes.
- Unrelated listener on `4096` still fail-closes Start/Restart/Stop.
- Tray AtLogon before Explorer: retry NotifyIcon creation for a short bounded window, then stay running and retry; do not spawn a console.
- Repair refuses only true drift, not the known previous node-shortcut shape.

## Risks / Trade-offs

- **[Risk] Always-on elevated loopback after logon** → Keep bind/auth/ACL unchanged; tray has no password; residual local privileged window is accepted.
- **[Risk] NotifyIcon lost if the shell is not ready** → Bounded retry; red/green still recover when the icon appears.
- **[Risk] Two scheduled tasks increase rollback surface** → Manifest records both identities; rollback removes only matching tasks.
- **[Risk] Closing a leftover old node console from the previous install** → Repair/start proof closes only proof-owned windows; document that old consoles are pre-change leftovers.
- **[Risk] Restart/Exit disconnect TUIs** → Unchanged; operator relaunches project shortcuts.

## Migration Plan

1. Author controller/help/preflight/status changes with zero host mutation and prove `--help` lists `stop`.
2. Stop the managed server if running, then stopped repair: invoker, tray helper/icons, protected Alacritty maximize, rewritten shortcuts, tray task with AtLogon, windowless serve action.
3. Prove Start (no consoles, health), tray green, project maximized attach, Restart from tray, Exit to red, Start back to green.
4. Prove the tray AtLogon path with `Start-ScheduledTask` of the tray task after Exit, or a real logon if already in an interactive session that can observe the same entry point.
5. Fresh critical-only SDET, then project-native validation and local handoff.

Rollback remains identity-safe: stop managed server, remove matching tray/server tasks and shortcuts, restore Alacritty, remove protected root including derived helpers.

## Open Questions

None for this increment. Exit does not disable autostart. Tray menu is exactly Restart and Exit.
