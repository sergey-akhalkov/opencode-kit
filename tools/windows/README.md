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

## Optional Beads Portfolio Bridge

The bridge is disabled by default and supports one explicitly registered Git project. It accepts only Beads `v1.2.2` Windows amd64. The pinned archive SHA-256 is `1f00c29cd9599e182a4a4e829f5210daca2da14155920aee2836d8bc613b2feb`; the extracted `bd.exe` must be `145740800` bytes with SHA-256 `b1f3609fea1d9f0f19b2ed49098b3628acfa6ca115aa28b01a1ee178c3a214de`. Online documentation and vendor-generated instructions do not expand that supported surface.

Treat these as three independent states:

| State | Owner | What success means |
|---|---|---|
| Protected binary | Workstation lifecycle | Exact manifest, executable, adapter, and ACL identities pass readback |
| OpenCode discovery | One selected `core-beads`, `all`, or unprofiled full-source runtime | The on-demand skill and closed helper directory are discoverable once in a fresh process |
| Project activation | One exact registration and project lifecycle | One canonical root and project-local embedded store are enabled under a clear bridge writer |

No state implies another. `core` omits Beads. Installation does not select a profile or touch a project; profile selection does not install Beads or register a project; registration does not grant source-writer or remote authority.

### Preview, spike, install, and check

Run the effect-free source entrypoints first:

```powershell
node tools/windows/opencode-workstation.ts beads-preview
node tools/windows/opencode-workstation.ts beads-check
```

Preview reports the exact release, protected paths, non-effects, and rollback boundary. Check reports `status: "absent"` when no protected Beads installation exists; that is an unavailable optional capability, not a successful activation. The disposable release/Dolt spike is qualification evidence rather than a generic operator command. Re-run that bounded proof only when the version, platform, hashes, required command surface, or directly observed environment invalidates the recorded evidence; do not replace it with ad hoc `bd` commands.

After the spike is current, install only a local executable whose exact identity matches the preview:

```powershell
node tools/windows/opencode-workstation.ts beads-install --source <absolute-path-to-verified-bd.exe>
node C:\ProgramData\OpenCodeWorkstation\opencode-workstation.ts beads-check
node C:\ProgramData\OpenCodeWorkstation\opencode-workstation.ts beads-rollback --dry-run
```

Install self-elevates when necessary and performs no download, profile selection, project registration, project activation, process, service, task, hook, vendor setup, or remote operation. Stop on a hash, platform, manifest, ACL, path, capability, or drift mismatch. Do not use another release or pass arbitrary vendor arguments.

### Select the runtime surface

From the kit source, preview then select the complete concrete profile:

```powershell
npm.cmd run install:global -- --preview-profile --profile core-beads
npm.cmd run install:global -- --profile core-beads
npm.cmd run install:global -- --check --profile core-beads
```

`core-beads` is exactly current `core` plus the on-demand skill and closed helper closure. `all` and unprofiled full source expose that same capability once; `core` exposes none of it. Start a fresh OpenCode process after any profile change. Do not infer discovery in an already running process and do not add a Beads-only partial profile, always-loaded instruction, plugin, MCP, `bd prime`, or vendor-managed `AGENTS.md`.

### Register and operate one project

There is intentionally no raw-argument or thin-command passthrough. In the fresh process, explicitly ask the `beads-portfolio-bridge` skill to perform the semantic operation, for example:

```text
Check the Beads installation and report the exact optional project prerequisite.
Register and preview Beads for this canonical Git project with owner class current-project and prefix <safe-prefix>.
Enable the registered Beads project after the preview passes.
Show bounded Beads portfolio status for the enabled project.
Disable the registered Beads project and preserve its local store.
Roll back only the registered project's attributable enablement state after disablement.
```

Registration must be created from current protected install/profile/adapter identities for exactly one canonical Git root, owner class `current-project` or `opencode-kit`, and an unused safe prefix. The workstation lifecycle must then provision the exact protected writer-storage identity before enablement. Never hand-edit the protected registration or lock. Enablement requires the reviewed Beads/Dolt ignore block already present in tracked `.gitignore`; it fails before success on tracked bytes, index, worktree, hooks, remotes, relevant Git config, managed instructions, or external-path drift. Status remains provider-free and read-only. An absent or disabled registration is reported as the exact prerequisite and does not trigger project initialization.

For an enabled project, explicit portfolio requests route through the closed Kaizen-side operations:

```text
Promote the eligible triaged Kaizen signal <signal-ref> using decision <decision-ref>.
Show at most <1-100> ready Beads portfolio items.
Assign Beads feature <id> to <agent-ref> with task <task-ref> and session <session-ref>.
Link Beads feature <id> idempotently to OpenSpec change <change-ref> and spec <spec-id>.
Reconcile terminal state for <id> only from current archived OpenSpec evidence.
```

Promotion accepts only one evidence-triaged `project-change` matching the enabled current-project ref or one `kit-candidate` matching an enabled `opencode-kit` owner. Ready and assignment are advisory: they never authorize source mutation, clear a frontier gate, or grant a provider, protected action, deployment, cost, or remote capability. Relations are limited to `blocks`, `parent-child`, and explicitly identity-confirmed `supersedes`; no OpenSpec task or frontier mirroring occurs. Repeated signal occurrences and agent support are evidence, not votes, and never change admission, priority, readiness, assignment, or authority automatically.

OpenSpec linking is exact and idempotent. A repeated identical request may recover a lost response; a different or partial existing link fails closed. Terminal reconciliation requires the exact linked project/change, complete accepted tasks, canonical archive, current runtime proof and validation, declared external effects, and terminal source-writer and cleanup evidence for one candidate. It closes Beads before resolving Kaizen and may repair only the closed-item/unresolved-signal projection; it never reruns implementation or archive work.

### Repair, disable, and rollback

Stop on duplicate correlation, competing assignment or link, stale or truncated terminal evidence, registration/install drift, an existing unsafe lock, or active/unknown child writer liveness. Do not select one duplicate, overwrite a conflicting link, take over a lock by age or absent PID, delete project data, or run destructive vendor repair. Preserve the original bounded cause and resolve only from exact current identity, terminality, or write-isolation evidence.

Project disable/rollback and protected binary rollback are separate operations. Disable the registered project first through the skill. Project rollback restores only attributable enablement configuration after identity readback and always preserves `.beads`, Kaizen evidence, OpenSpec artifacts, source, and unrelated state. Then preview protected rollback and run it only when the writer is clear:

```powershell
node C:\ProgramData\OpenCodeWorkstation\opencode-workstation.ts beads-rollback --dry-run
node C:\ProgramData\OpenCodeWorkstation\opencode-workstation.ts beads-rollback
```

A held or unknown writer returns `partial-unknown` and preserves the lock plus every registration-referenced managed item. Drift is preserved for exact disposition. The stop line excludes a second project, shared server, federation, remotes, JSONL synchronization, cross-machine/team use, production claim leases, automatic priority/voting, source commits, push, merge, release, and deployment. The pinned recovery release does not support the accidentally published work leases, events journal, federation, or HTTP server; online documentation for those features is not runtime evidence.

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
