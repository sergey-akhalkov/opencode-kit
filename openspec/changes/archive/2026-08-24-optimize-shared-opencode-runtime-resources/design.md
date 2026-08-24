## Context

See `proposal.md` for motivation and the capability deltas for observable behavior. The current workstation has one elevated OpenCode server but OpenCode owns local MCP and LSP lifecycles per project instance. With `opencode-kit` and `pmac-emulator` attached concurrently, live inspection found two Graphify service trees loading the same configured graph, one Codebase Memory internal daemon behind two small stdio frontends, two project-scoped Serena agents, and project-scoped OpenCode/Serena language servers. The same inspection found that the supported Bun-compiled OpenCode server and clients dominate product memory, while the persistent Node workstation supervisor is small; changing runtimes is not the causal optimization.

Graphify's installed implementation already supports authenticated Streamable HTTP, stateless operation, a pinned default graph, a bounded LRU of explicit `project_path` graphs, and one shared process for multiple clients. OpenCode supports remote MCP endpoints. Serena's ordinary HTTP MCP instead retains one process-wide `SerenaAgent`; activating another project shuts down the previous project's language services. Serena's separate multi-project ProjectServer caches projects but exposes read-only queries only. OpenCode LSP commands are stdio processes initialized for one workspace and expose no supported shared-daemon transport. These contracts define the hybrid sharing boundary.

The existing `tools/windows/opencode-workstation.ts` is already a large mixed Windows lifecycle owner and is concurrently touched by `fix-workstation-restart-reliability`. This change must reconcile that active candidate before production mutation and must not add Graphify protocol/config behavior directly into the controller body. A cohesive shared-tool module owns that responsibility; the controller remains the lifecycle orchestrator.

### Fidelity Ladder

`preserved current two-client process/memory baseline -> provider-free disposable Graphify HTTP plus isolated OpenCode remote-MCP connection -> effect-free repository help/preflight and config transformation -> authorized stopped ProgramData repair -> actual one-client launch/handoff -> actual two-client shared-service and resource proof -> failure/collision/rollback proof -> fresh critical-only SDET -> project-native validation`. The current rung is planning from read-only source and live process observations. The next real boundary after implementation begins is a disposable loopback Graphify/OpenCode integration using the installed binaries, fixed graph, synthetic project directories, no provider/model request, and deterministic process/temp cleanup.

The disposable rung needs no further authorization. ProgramData repair, protected credential creation, machine-local config mutation, scheduled process replacement, and actual Desktop launches use the standing local-machine authorization, exact current identities, loopback-only binds, one writer, no target-repository content mutation, no provider call, recorded pre-change hashes/ACLs/config bytes, and restoration of only candidate-owned artifacts. Existing owner terminals are never terminated; proof cleanup closes only attributed proof clients. The Raw Evidence Bundle records exact redacted invocations, candidate/environment hashes and versions, process/listener trees, tool inventories/results, exits/stdout/stderr, resource samples, configuration hashes, popup/log observations, and cleanup.

## Goals / Non-Goals

**Goals:**

- Reuse one Graphify graph cache/service across every active OpenCode project without changing Graphify tool names or silently changing repository context.
- Retain the already shared Codebase Memory daemon and the correctness-required per-project Serena/LSP ownership.
- Release launch-only invocation/elevation processes after the elevated controller exits while preserving the existing synchronous failure popup.
- Make the resource claim reproducible against identical workloads and attributable process groups rather than a single Task Manager snapshot.
- Keep shared-tool configuration, auth, process identity, rollback, and diagnostics under the existing protected workstation owner.

**Non-Goals:**

- A general-purpose MCP gateway, remote service manager, or multi-user daemon.
- Serena agent multiplexing, read-only substitution for full Serena, or LSP protocol multiplexing.
- TUI/session memory optimization, OpenCode/Bun changes, Codebase Memory upstream changes, or removal of stable PowerShell.
- Automatic graph extraction/rebuild, Graphify source modification, or changing the fixed default graph.

## Decisions

### Decision 1: Share only services whose state contract is project-explicit

Classify runtime services by state ownership, not executable language:

- Graphify becomes one shared remote MCP because its graph is fixed, its HTTP transport is supported, and optional project selection is an explicit tool argument.
- Codebase Memory keeps one internal daemon and project stdio frontends; the daemon already owns the heavy multi-project graph state and every tool names a project explicitly.
- Serena remains one full MCP agent per active project because its active project is process-wide and write/refactoring tools are not available through its multi-project read-only ProjectServer.
- OpenCode and Serena LSP processes remain per workspace because their stdio/root/configuration/diagnostic state has no supported multi-client broker.

Alternative rejected: move every tool behind one HTTP endpoint. Transport sharing does not isolate global active-project or workspace state and can route edits/diagnostics to the wrong repository. Alternative rejected: add a Codebase Memory HTTP relay. It introduces another resident owner for only the small frontends while the heavy daemon is already shared.

### Decision 2: Run one stateless authenticated Graphify sibling under the existing supervisor

Extend the current Node supervisor to spawn Graphify before OpenCode with the configured Python executable and graph path, `--transport http`, `--host 127.0.0.1`, fixed port `4097`, path `/mcp`, and `--stateless`. Generate a separate Graphify API key with the OS cryptographic RNG, store it under the protected root with the same ACL class as the OpenCode credential, and pass it to Graphify as `GRAPHIFY_API_KEY` and to OpenCode as `OPENCODE_GRAPHIFY_API_KEY` through inherited environment only. No key appears in argv, config bytes, task XML, state, logs, or evidence.

The supervisor records Graphify launcher/root/listener executable path, command digest, creation time, parentage, configured graph path/hash, and loopback endpoint beside the current OpenCode identities. Readiness requires: the configured port was free before spawn; exactly one listener descends from the Graphify root; an unauthenticated MCP request returns `401`; an authenticated MCP initialize/list-tools request returns the expected inventory; and then OpenCode starts and loads the remote MCP. State is `running` only when both services are ready.

If Graphify exits after readiness, preserve OpenCode and attached sessions, mark managed state `degraded`, append one cause-preserving secret-free diagnostic, and make the tray/status red rather than falsely healthy. New project launches fail with the Graphify diagnostic. Restart replaces the complete positively identified runtime; Stop/Exit/rollback stop both service identities and listeners. This avoids turning a code-intelligence service crash into immediate session loss while keeping missing required tools visible.

Alternative rejected: a second Scheduled Task/service. It duplicates task, ACL, lifecycle, rollback, and owner state for one workstation runtime. Alternative rejected: make Graphify a local MCP and rely on OpenCode to deduplicate it; OpenCode project instances intentionally own local MCP commands independently. Alternative rejected: restart Graphify autonomously inside the supervisor. A new recovery loop adds retry policy and ambiguous state beyond this bounded increment; the existing explicit Restart is sufficient.

### Decision 3: Replace only the managed server's Graphify config entry and preserve its source bytes

Keep the MCP name `graphify-global` so tool names and instruction references do not change. During an explicit stopped install/repair, use the repository's existing `jsonc-parser` dependency to compute a minimal source edit that replaces only `mcp.graphify-global` in the machine-local `global/opencode.json`/JSONC source:

- from the exact validated local stdio command that loads the configured graph;
- to a schema-valid remote MCP at `http://127.0.0.1:4097/mcp`, `oauth: false`, the existing timeout, and `Authorization: Bearer {env:OPENCODE_GRAPHIFY_API_KEY}`.

Preflight reports the source path/hash and proposed edit without writing. Install refuses an absent, already divergent, duplicate, or non-local entry rather than guessing. It records the exact original bytes/ACL/hash in protected backup metadata, writes through temp plus atomic rename, and records the managed result hash. Rollback restores the exact original bytes only when the live file still matches the managed result; drift is preserved and reported. Unrelated formatting, comments, fields, plugins, providers, MCPs, and permissions remain byte-identical.

The edit runs only from the reviewed repository install path where `jsonc-parser` is available. Installed Start/Status/Restart do not import repository dependencies; they validate the recorded managed config hash and use the protected manifest. This reuses an existing dependency without copying a package tree into ProgramData.

Alternative rejected: an inline or explicit overlay. Deep merge cannot reliably remove the old local MCP `command`, and a second MCP name would change the public tool prefix and leave the duplicate local server configured. Alternative rejected: a plugin config hook containing the API key. Plugin hooks run after config variable substitution and can leave the resolved credential in inspectable runtime config.

### Decision 4: Fail closed on implicit repository context in shared Graphify

Graph queries continue using the fixed configured default graph unless the caller explicitly supplies Graphify's existing `project_path`. Repository/PR tools whose omitted `repo` previously inherited the per-project local MCP cwd MUST reject a missing `repo` before the MCP call. Add a small project-loaded OpenCode tool hook that recognizes only the `graphify-global` repo-context tool names and rejects missing repository authority with an actionable, secret-free error. It never invents a remote, runs Git, rewrites explicit arguments, or affects graph-only tools.

This preserves tool availability while preventing the singleton process cwd from becoming hidden authority. The agent can obtain and pass the explicit repository through existing project evidence and tools.

Alternative rejected: start the singleton in one selected repository and keep implicit defaults. Other clients would silently target that repository. Alternative rejected: modify installed Graphify source or add an MCP JSON-RPC reverse proxy. Both create an out-of-repository compatibility owner when a narrow argument guard is sufficient.

### Decision 5: Close the direct elevated controller, not its detached GUI descendants

The current launch path uses PowerShell `Start-Process -Verb RunAs -Wait -PassThru`; on Windows, `-Wait` follows the detached Alacritty descendant tree. For project `launch` only, start the elevated controller with `-PassThru`, call the returned direct process object's `WaitForExit()`, and read that process's exit code. The elevated controller still validates the manifest/server/services, spawns exactly one detached Alacritty, and exits. `invoke.vbs` continues waiting for the unelevated controller and shows its existing popup on a non-zero result.

Start, Restart, Stop, install, and rollback keep their current synchronous completion semantics. A bounded process-tree check requires the launch-owned `wscript`, unelevated Node, and elevation PowerShell to exit after the direct elevated controller returns; the Alacritty, stable PowerShell, OpenCode attach shim/client, shared services, and other project clients remain alive.

Alternative rejected: remove waiting entirely. The hidden launcher would report success before post-UAC validation and lose the required popup. Alternative rejected: mark every Alacritty shortcut globally elevated or remove PowerShell. Both change accepted operator behavior beyond the leak.

### Decision 6: Separate shared-tool ownership from workstation orchestration

Create one cohesive `tools/windows/` shared-tool module for Graphify config validation/edit planning, process identity, health probes, and redacted state projection. The existing controller imports it for preflight/install/serve/status/stop/rollback orchestration and installs/hash-validates that module under ProgramData. The repo-context hook remains under `global/plugin/` because it owns OpenCode tool-call policy, not Windows lifecycle. Keep scenario orchestration and evidence capture in the existing `tools/proofs/` convention and update its inventory.

This is `extend + reuse`: reuse Graphify's HTTP/auth/stateless implementation, OpenCode remote MCP/env substitution, the current protected supervisor/state/credential/rollback patterns, `jsonc-parser`, and existing proof process attribution. Cross-project discovery is `not-applicable` for the machine-local lifecycle; the selected installed Graphify and Serena sources supplied the relevant service contracts.

### Decision 7: Compare identical workloads with lane-specific memory oracles

The Proof Runner captures three ordered workloads against the same environment and initial state: managed services with no proof clients; one proof-owned project client after tool readiness; two different proof-owned clients concurrently after tool readiness. For each, take at least three samples after a fixed readiness/settle condition and record process identity, parentage, working set, private bytes, CPU, listener, command class, and service/project attribution. Do not sum transient proof commands or unrelated owner processes.

The Evaluator checks behavior first, then resources:

- one Graphify service tree and identical representative graph/tool results from both clients;
- one Codebase Memory internal daemon, with project frontends allowed;
- one Serena/LSP set per active project;
- no launch-owned hidden invocation/elevation chain after handoff;
- unchanged exact `--dir`, one OpenCode listener, first-client survival after second-client cleanup, diagnostics, and rollback;
- median two-client Graphify private bytes at least 35% below the preserved baseline, with candidate attach/tool readiness no more than 20% slower than baseline or 2 seconds slower, whichever allowance is larger.

Working-set change is reported but is not the pass/fail oracle because Windows paging can trim inactive Python processes. Failure to meet the resource threshold preserves both evidence sets and blocks the optimization claim without changing cleanup or service state.

Alternative rejected: compare Task Manager screenshots or unrelated sessions. They cannot attribute paging, caches, clients, or transient launchers and cannot prove equivalent functionality.

### Decision 8: Serialize with the active Restart correction

Before editing production, read `fix-workstation-restart-reliability/history.md`, reconcile its current source/candidate, and treat its targeted stop/restart behavior as the base if still active. Do not independently restore or overwrite its controller edits. This change extends its validated identity set with Graphify only after the Restart change's overlapping writer is terminal or its exact mutations are integrated in the current working tree.

Attempt limits and stop lines in either change remain revisable process controls; they do not authorize ProgramData repair or process termination. A Graphify-specific failure invalidates only this change's service/config/resource lanes unless it also changes the shared Restart behavior.

## Risks / Trade-offs

- **[Risk] Shared Graphify is a common failure/latency domain** -> expose degraded state, reject new launches, retain current sessions, preserve exact cause, and require explicit Restart rather than hidden retries.
- **[Risk] A wrong Graphify listener receives the API key** -> validate task/supervisor/root/listener parentage and command identity before every credential-bearing readiness request; unrelated listeners fail before auth.
- **[Risk] Remote MCP config exposes the key through diagnostics** -> persist only `{env:OPENCODE_GRAPHIFY_API_KEY}`, pass the value in inherited environment, and scan process argv, config bytes, state, logs, and evidence for the generated sentinel/value pattern.
- **[Risk] Global config drift is overwritten** -> apply a minimal exact-entry edit only from the recorded source hash; rollback requires the managed result hash and otherwise preserves drift.
- **[Risk] Explicit `repo` guard reduces convenience** -> return one actionable error naming the missing argument; do not silently choose a repository.
- **[Risk] Direct-process waiting behaves differently under UAC** -> prove one success and one post-elevation failure through the actual `.lnk`; retain the old path until both exit-code and popup behavior are observed.
- **[Risk] Resource result depends on caches/paging** -> compare same workload/environment with repeated private-byte samples and preserve raw process facts; report working set separately.
- **[Risk] Overlap with Restart work corrupts lifecycle ownership** -> serialize writers and integrate the current active change before this candidate is frozen or installed.

## Migration Plan

1. Capture and evaluate the current idle/one/two-client baseline without changing configuration or terminating owner windows.
2. Implement the shared-tool module, repo-context hook, launch direct-process wait, deterministic config transformation, and proof runner; prove Graphify HTTP/auth and OpenCode remote MCP in a disposable environment.
3. Reconcile the current Restart candidate, run effect-free help/preflight/status, verify elevation, stop only the positively identified managed runtime, and record protected/config hashes and ACLs.
4. Install the shared-tool module/credential/state changes and atomically replace only the validated Graphify MCP entry. Start one managed Graphify plus OpenCode runtime and verify authenticated/unauthenticated endpoints and exact identities.
5. Exercise actual one-client and two-client Desktop workflows, Graphify tool/routing behavior, launcher-chain absence, shared-daemon/project-scoped-process inventory, degraded/collision behavior, and proof-owned cleanup.
6. Exercise identity-matched rollback and reinstall, then fresh critical-only SDET and complete project-native validation.

Rollback restores the exact prior Graphify config bytes and protected artifacts only when identities match, removes the managed Graphify credential/state/module, stops only validated Graphify/OpenCode processes/listeners, and reinstalls or restarts the prior workstation candidate as recorded. No commit, push, release, deployment, provider call, or target-project write is part of migration.

## Open Questions

None for this increment.
