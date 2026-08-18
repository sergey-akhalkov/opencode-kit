# OpenCode Windows Workstation

This directory is the source of truth for the local Windows OpenCode workstation setup. The installer derives the protected controller, Scheduled Task, Alacritty configuration, generated credential, manifest, state, logs, and six Desktop shortcuts from the reviewed repository files. Do not treat files under `C:\ProgramData\OpenCodeWorkstation` as source.

## Prerequisites

- Windows with an interactive administrator account
- Node.js with built-in TypeScript execution support
- `git.exe`, `alacritty.exe`, stable `pwsh.exe`, and `opencode.exe` on `PATH`
- A valid `OPENCODE_CONFIG_DIR` user environment variable
- The four configured repositories checked out as exact Git worktree roots

The setup installs no package, Windows service, firewall rule, or remote listener. The tray host has an owner AtLogon trigger; the shared server task stays demand-start and is started by the tray at logon.

## Machine Configuration

`opencode-workstation.config.json` has schema version `1` and exactly four repository mappings. Paths may be absolute or relative to the configuration file. Change only these paths for a different workstation; do not add credentials or extra fields.

An alternate configuration can remain outside the checkout and be supplied with `--config <path>`. The installed manifest stores the configuration identity and resolved paths. Later source-configuration edits do not hot reload into the protected runtime.

## Install

Run the effect-free checks from the repository first:

```powershell
node tools/windows/opencode-workstation.ts --help
node tools/windows/opencode-workstation.ts preflight --config tools/windows/opencode-workstation.config.json
```

When preflight reports `status: "ready"`, install from the same reviewed source and configuration:

```powershell
node tools/windows/opencode-workstation.ts install --config tools/windows/opencode-workstation.config.json
```

Install self-elevates when required. It creates a highest-privilege demand-start server task, a highest-privilege AtLogon tray host, protects the runtime root, generates a local password, configures ordinary Alacritty to use stable `pwsh.exe`, maximizes project Alacritty, hides Desktop controller consoles, and creates these Desktop shortcuts:

- `OpenCode Server - Start`
- `OpenCode Server - Restart`
- `OpenCode - opencode-kit`
- `OpenCode - pmac-emulator`
- `OpenCode - controller-gateway-service`
- `OpenCode - windows-ui-automation`

## Operate

At interactive logon the tray host starts the shared server with no console and shows an `opencode-server` lamp: green when healthy, blinking red/amber while Restart is replacing the server. Right-click **Restart** replaces the managed server and returns to green. Right-click **Exit** stops the server and closes the tray until the next logon. Exit does not disable autostart.

Start still raises a stopped server. Repeated Start reuses the healthy managed server. Each project shortcut opens exactly one maximized elevated Alacritty, starts stable PowerShell, and runs `opencode attach http://127.0.0.1:4096 --dir <configured-path>`. It never falls back to a second server and does not leave a controller console.

After leaving the TUI, the elevated PowerShell window remains open. To attach a different folder manually from that elevated shell without putting the password in process arguments:

```powershell
$env:OPENCODE_SERVER_PASSWORD = (Get-Content -LiteralPath 'C:\ProgramData\OpenCodeWorkstation\server-password' -Raw).Trim()
opencode attach http://127.0.0.1:4096 --dir 'D:\path\to\folder'
Remove-Item Env:OPENCODE_SERVER_PASSWORD -ErrorAction SilentlyContinue
```

Restart replaces only a positively identified managed server tree. Existing clients are not expected to reconnect automatically; reopen their shortcuts afterward.

Multiple project shortcuts may stay open concurrently; they attach independent working directories to the same managed listener. Controller failures from Start, Restart, Status, install/rollback, or any project launcher are appended as secret-free JSON lines to `C:\ProgramData\OpenCodeWorkstation\logs\controller-errors.log`.

Read-only status and rollback planning are available from the protected controller:

```powershell
node C:\ProgramData\OpenCodeWorkstation\opencode-workstation.ts status
node C:\ProgramData\OpenCodeWorkstation\opencode-workstation.ts rollback --dry-run
```

## Rollback And Reinstall

Review the dry-run result first. Rollback proceeds only when the protected controller, task, shortcuts, and Alacritty configuration still match their recorded identities:

```powershell
node C:\ProgramData\OpenCodeWorkstation\opencode-workstation.ts rollback --dry-run
node C:\ProgramData\OpenCodeWorkstation\opencode-workstation.ts rollback
```

Rollback safely stops the managed server, removes the matching server and tray tasks and six shortcuts, restores the exact previous Alacritty configuration, and removes the protected runtime root. It preserves drifted and unrelated artifacts. Reinstall by repeating the repository preflight and install commands.

## Repository Validation

```powershell
node --check tools/windows/opencode-workstation.ts
npm.cmd run validate:strict
openspec.cmd validate configure-local-opencode-workstation --strict
```

The server password is generated during installation and must remain only in protected local runtime state or process memory. Never add it to the configuration, repository, shortcut arguments, logs, or evidence.
