## Why

The shared OpenCode server currently starts one local Graphify MCP service tree for every active project even though every instance loads the same graph, and each Desktop project launch leaves a hidden `wscript -> node -> powershell` chain alive for the lifetime of the terminal. With two attached projects, live measurement found two Graphify instances at about 465 MiB private bytes each and about 105 MiB private bytes per retained launcher chain, while the persistent Node supervisor itself used only about 39 MiB private bytes; the useful optimization is therefore safe service sharing and lifecycle closure rather than replacing Node with Bun.

## Outcome Capsule

- **Outcome**: On the current Windows workstation, all selected projects retain Graphify, Codebase Memory, Serena, and OpenCode LSP capability while concurrent clients use one authenticated loopback Graphify service tree and the existing shared Codebase Memory daemon; Serena and LSP remain correctly isolated per project, and each successful project launcher releases its hidden invocation/elevation chain after handing off one attached Alacritty client.
- **Operating Envelope**: The repository-managed elevated OpenCode `1.18.18` workstation on Windows, four protected repository mappings, one authenticated OpenCode listener on `127.0.0.1:4096`, the installed Graphify Streamable HTTP implementation and fixed global graph, the current Codebase Memory daemon architecture, project-scoped Serena/LSP processes, and up to four simultaneous Desktop project clients. The shared Graphify endpoint is loopback-only, authenticated, stateless, and installed/repaired through the existing protected workstation owner.
- **Non-Goals**: Removing or disabling Graphify, Codebase Memory, Serena, or LSP; sharing one ordinary Serena agent across projects; multiplexing one LSP process across workspaces or between OpenCode and Serena; replacing Node with Bun; bypassing the supported OpenCode or Codebase Memory launch shims; removing stable PowerShell from project terminals; changing providers, models, graph extraction, repository mappings, or OpenCode session semantics; LAN/remote exposure; fleet installation; commit, push, release, or deployment.
- **Non-Deferrable Invariants**: Every client keeps its exact protected `--dir`; Graphify exposes the same tool/resource inventory and graph results through one positively identified service tree; repo-relative Graphify operations never silently use another project's cwd; Graphify and OpenCode credentials never appear in repository files, arguments, shortcuts, tray state, or logs; unrelated loopback listeners fail closed; Start/Restart/Stop/Exit and rollback terminate only positively identified managed processes; launcher failure still produces the required secret-free diagnostics popup; Serena and LSP project isolation remains intact; unrelated machine-local OpenCode config bytes are preserved.
- **Observable Proof**: Capture the same idle, one-client, and two-concurrent-client process/memory workload before and after the change. Through the actual `pmac-emulator` and `opencode-kit` shortcuts, observe one OpenCode listener, one Graphify service tree, one shared Codebase Memory daemon, two project-scoped Serena/LSP sets, identical Graphify tool inventory and representative graph results from both projects, explicit rejection of a repo-relative Graphify call without project/repo authority, and no launch-owned `wscript`, Node controller, or elevation PowerShell process after bounded handoff. Closing one client leaves the other and both shared services healthy. Candidate Graphify private bytes for the two-client workload are at least 35% below the preserved baseline without a material attach-readiness regression.
- **Material Residual Risks**: One Graphify failure affects every attached project; its HTTP transport adds a second authenticated local endpoint and service identity to workstation lifecycle; Graphify PR tools previously inherited each local MCP process cwd and now require explicit repo authority; memory working set varies with paging, graph cache, LSP indexing, and session history; the active `fix-workstation-restart-reliability` change overlaps the same controller and must be reconciled before production mutation.
- **Stop Line**: Finish when the Graphify baseline, authenticated singleton lifecycle, remote MCP configuration, explicit repo routing guard, Codebase Memory shared-daemon preservation, Serena/LSP non-regression, launcher-chain closure, rollback, actual two-client proof, focused resource comparison, fresh critical-only SDET, and project-native validation are complete. Do not pool Serena/LSP, replace runtimes, remove tools/shells, build a generic MCP broker, or optimize unrelated OpenCode/TUI memory in this increment.

## What Changes

- Extend the protected workstation supervisor to own one authenticated stateless Graphify Streamable HTTP service alongside the shared OpenCode server, with exact process/listener identity, health, bounded diagnostics, Start/Restart/Stop/Exit integration, collision refusal, and rollback.
- Replace the machine-local per-project `graphify-global` local MCP entry with one same-named remote MCP entry while preserving unrelated config bytes and keeping its credential in protected runtime state and inherited environment only.
- Require explicit repository authority for Graphify PR/repository-relative tools so a shared service cannot silently resolve against its fixed process cwd; preserve the existing fixed default graph and optional explicit `project_path` behavior.
- Preserve Codebase Memory's current single daemon with project-specific stdio frontends; do not add a second broker merely to remove the small frontends.
- Keep Serena and OpenCode LSP project-scoped because their active-project/workspace state is not safely shareable through the current supported interfaces.
- Change only the project-launch elevation/handoff path so hidden launcher processes terminate after successful Alacritty attach while post-elevation failures still produce the existing secret-free popup. Start, Restart, Stop, install, and rollback retain synchronous completion behavior.
- Add repeatable, privacy-safe process/memory capture and evaluator tooling for identical baseline/candidate idle, one-client, and two-client workloads, including cleanup and project/tool identity checks.

## Capabilities

### New Capabilities

- `shared-code-intelligence-runtime`: Defines which code-intelligence services are safely shared or project-scoped, the authenticated Graphify singleton and routing contract, Codebase Memory daemon preservation, and measurable resource/non-regression proof.

### Modified Capabilities

- `local-opencode-workstation`: Adds managed Graphify lifecycle/configuration and requires project launcher invocation/elevation processes to close after client handoff without losing diagnostics or weakening process ownership.

## Impact

- Primary source owner: `tools/windows/opencode-workstation.ts`; implementation must reconcile the current `fix-workstation-restart-reliability` candidate before editing overlapping lifecycle functions.
- Likely cohesive additions under `tools/windows/` for Graphify configuration/routing ownership and under `tools/proofs/` for reusable process/resource evidence; avoid adding another responsibility to the already mixed controller without a split-or-justify decision.
- Machine-local inputs: `tools/windows/opencode-workstation.config.json`, gitignored `global/opencode.json`, protected ProgramData manifest/state/credential/logs, derived task/shortcut/config artifacts, and one additional loopback port.
- OpenCode behavior: `graphify-global` changes from local stdio to authenticated remote MCP without changing its tool prefix; Serena, Codebase Memory, LSP, providers, plugins, and project mappings remain present.
- Existing specifications: `local-opencode-workstation` is modified; one new `shared-code-intelligence-runtime` capability is added. No public application API, persisted product data, provider call, target-repository write, remote deployment, or release is included.
