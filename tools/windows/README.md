# OpenCode Windows Workstation

This directory is the source of truth for the local Windows OpenCode workstation setup. The installer derives the protected controller/shared-tool module, Scheduled Task, Alacritty configuration, OpenCode and Graphify credentials, exact OpenCode-config backup/edit, manifest, state, logs, and six Desktop shortcuts from the reviewed repository files. Do not treat files under `C:\ProgramData\OpenCodeWorkstation` as source.

## Prerequisites

- Windows with an interactive administrator account
- Node.js with built-in TypeScript execution support
- `git.exe`, `alacritty.exe`, stable `pwsh.exe`, and `opencode.exe` on `PATH`
- A valid `OPENCODE_CONFIG_DIR` user environment variable
- The four configured repositories checked out as exact Git worktree roots
- The configured Graphify Python/module and fixed read-only graph

The setup installs no package, Windows service, firewall rule, or remote listener. The tray host has an owner AtLogon trigger; the shared server task stays demand-start and is started by the tray at logon. While the tray is running, an unexpected non-zero server exit is recovered through the protected Start path at most three times, one minute apart. Explicit operator Stop records `stopped` and remains stopped.

## Machine Configuration

Tracked `opencode-workstation.config.example.json` is a schema-valid placeholder: repository ids and relative stubs, no absolute host paths. Copy it to gitignored `opencode-workstation.config.json` and replace placeholders with this machine's mappings. Tools require that local file or an explicit `--config <path>` and never load the example as the live default.

`opencode-workstation.config.json` has schema version `2`, exactly four repository mappings, and a `graphify` object containing Python, graph, and fixed port `4097`. Paths may be absolute or relative to the configuration file. Do not add credentials or extra fields.

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

Install self-elevates when required. It creates one highest-privilege demand-start supervisor task, a highest-privilege AtLogon tray host, protects the runtime root, generates separate OpenCode and Graphify credentials, atomically replaces only `mcp.graphify-global` with an env-referenced remote entry, configures ordinary Alacritty to use stable `pwsh.exe`, maximizes project Alacritty, hides Desktop controller consoles, and creates these Desktop shortcuts:

- `OpenCode Server - Start`
- `OpenCode Server - Restart`
- `OpenCode - opencode-kit`
- `OpenCode - pmac-emulator`
- `OpenCode - controller-gateway-service`
- `OpenCode - windows-ui-automation`

## Operate

At interactive logon the tray host starts Graphify on `http://127.0.0.1:4097/mcp` before OpenCode on `http://127.0.0.1:4096`. The `opencode-server` lamp is green only when both recorded listener identities are running, startup readiness succeeded, fresh credential-free probes confirm that both endpoints respond with the expected authentication challenge, and a recent protected-controller child authenticated the OpenCode health endpoint. The child performs all listener and network probes and reads the protected credential; the tray UI thread only consumes its exit status, so the menu remains responsive while health IO is slow. The tray never receives either credential. It blinks red/amber during Restart. Right-click **Restart** replaces both managed sibling identities. Right-click **Exit** stops both and closes the tray until the next logon. Exit does not disable autostart.

| Component | Ownership |
|---|---|
| OpenCode server | One workstation process serves multiple exact `--dir` clients |
| Graphify | One authenticated stateless service shared by all projects |
| Codebase Memory | Existing shared daemon, with project-scoped frontends |
| Serena and OpenCode LSP | Project-scoped; intentionally not pooled |

Graphify PR/repository tools require an explicit non-empty `repo`; graph-only tools keep the fixed graph and optional explicit `project_path`. If Graphify exits after readiness, OpenCode remains available for existing clients, Status/tray become degraded/red, and new launches fail with a Restart diagnostic.

Start still raises a stopped server. Repeated Start reuses the healthy managed server. Each project shortcut validates the running protected process and listener identities, opens exactly one maximized elevated Alacritty, starts stable PowerShell, and runs the authenticated `opencode attach http://127.0.0.1:4096 --dir <configured-path>`. A temporarily busy authenticated health route does not create a false launcher failure; the tray remains the strict current-health indicator. The launcher never falls back to a second server and does not leave a controller console.

After leaving the TUI, the elevated PowerShell window remains open. To attach a different folder manually from that elevated shell without putting the password in process arguments:

```powershell
$env:OPENCODE_SERVER_PASSWORD = (Get-Content -LiteralPath 'C:\ProgramData\OpenCodeWorkstation\server-password' -Raw).Trim()
opencode attach http://127.0.0.1:4096 --dir 'D:\path\to\folder'
Remove-Item Env:OPENCODE_SERVER_PASSWORD -ErrorAction SilentlyContinue
```

Restart replaces only a positively identified managed server tree. Existing clients are not expected to reconnect automatically; reopen their shortcuts afterward.

Multiple project shortcuts may stay open concurrently; they attach independent working directories to the same managed listener. Controller failures from Start, Restart, Status, install/rollback, or any project launcher are appended as secret-free JSON lines to `C:\ProgramData\OpenCodeWorkstation\logs\controller-errors.log`. Before a replacement server run opens its four service output logs, it rotates the prior files to the corresponding `*.previous` paths so the triggering run is not erased.

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

Rollback safely stops both managed siblings, restores the exact previous OpenCode config bytes/ACL and Alacritty configuration, removes matching tasks/shortcuts/protected runtime, and refuses any drift. Reinstall by repeating repository preflight and install.

## Campaign Supervisor Plans

Campaign auto-resume has a separate explicit lifecycle and independent protected sibling root. It
does not activate from workstation install, doctor, project init, or OpenCode startup. Before any
host mutation, inspect the source-derived plan with a schema-valid portable registry:

```powershell
node tools/windows/work-campaign-supervisor.ts --help
node tools/windows/work-campaign-supervisor.ts preview --kit-root <absolute-kit-root> --registry <absolute-registry.json> --workstation-manifest C:\ProgramData\OpenCodeWorkstation\manifest.json
```

Task 6.3 also exposes `check`, `repair-plan`, and `rollback-plan` against an explicit read-only
observation JSON. These operations create no directory, copy no file, change no ACL, register no
task, read no credential value, and start no process. The plan derives one owner-logon
`OpenCode Work Campaign Supervisor` task under
`C:\ProgramData\OpenCodeWorkCampaignSupervisor`, copies the complete portable workflow runtime
closure while preserving its `global/` layout, and binds source/installed identities in a protected
manifest. The portable campaign registry remains command-free and secret-free.

Live install, Scheduled Task action, stop, repair, and rollback remain a separate authorized host
operation. Campaign rollback must never remove shared workstation files, credentials, server/tray
tasks, Graphify state, or project/campaign/mission evidence.

## Repository Validation

```powershell
node --check tools/windows/opencode-workstation.ts
node --check tools/windows/opencode-shared-tools.ts
npm.cmd run validate:strict
openspec.cmd validate optimize-shared-opencode-runtime-resources --strict
```

Both passwords are generated during installation and remain only in protected runtime state or process memory. Global config contains only `{env:OPENCODE_GRAPHIFY_API_KEY}`. Never place either value in config bytes, argv, shortcuts, logs, or evidence. Node-to-Bun/runtime consolidation is intentionally outside this resource optimization.
