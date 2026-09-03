# local-opencode-workstation Specification

## Purpose
Provide one safe, predictable Windows operator workflow for stable PowerShell terminals and elevated OpenCode clients that reuse one logon-started, tray-visible local server across the selected repositories.

## Requirements

### Requirement: Alacritty uses the current stable PowerShell
The workstation SHALL configure ordinary Alacritty sessions to launch `pwsh.exe`, SHALL resolve the stable PowerShell command rather than Windows PowerShell 5.1 or PowerShell Preview, and SHALL preserve unrelated Alacritty configuration.

#### Scenario: Ordinary Alacritty starts stable PowerShell
- **WHEN** the operator launches Alacritty without a project launcher
- **THEN** the initial shell reports PowerShell Core from the current stable `pwsh.exe` alias
- **AND** the shell does not report Windows PowerShell 5.1 or a Preview edition

#### Scenario: Existing unrelated terminal settings survive setup
- **WHEN** workstation setup adds the managed shell selection to an existing compatible Alacritty configuration
- **THEN** settings unrelated to terminal shell selection remain unchanged
- **AND** rollback can restore the exact pre-change configuration

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

#### Scenario: Unexpected server failure receives bounded recovery
- **WHEN** the tray observes a managed `exited` state with a non-zero exit while no operator lifecycle command is active
- **THEN** the tray invokes the existing protected Start path at most three times, one minute apart
- **AND** a replacement run preserves the prior OpenCode and Graphify stdout and stderr generation under fixed `*.previous` paths before opening new current logs
- **AND** project launchers continue to fail closed rather than starting an implicit server while recovery is incomplete
- **AND** explicit operator Stop records `stopped` and does not trigger automatic recovery

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
- **WHEN** the managed runtime identities match and Restart terminates them, and at least one validated identity has already exited
- **THEN** Restart does not fail merely because the terminator reported that the process was already gone
- **AND** Restart still refuses to start a replacement while any validated identity or either managed listener remains

#### Scenario: Unmatched descendants are not a Restart failure
- **WHEN** the managed runtime identities match and unmatched descendant processes exist beside the validated identities
- **THEN** Restart does not terminate those unmatched processes
- **AND** Restart still replaces the validated managed identities and restores both authenticated services

#### Scenario: Restart replaces a matching starting server
- **WHEN** the managed task is Running, persisted state is `starting`, and the recorded supervisor and server-root identities still match
- **THEN** Restart terminates those matching identities and any matching listener
- **AND** different elevated managed identities become healthy on `127.0.0.1:4096` and `127.0.0.1:4097`

#### Scenario: Stopping serve does not show the operator command dialog
- **WHEN** Restart or Stop terminates the managed serve task
- **THEN** the hidden serve invoker does not present the operator command-failed dialog
- **AND** Desktop Start or Restart still presents that dialog when those operator commands themselves exit non-zero

### Requirement: Privileged runtime material is protected
Every script, manifest, state record, and credential consumed by a highest-privilege task or elevated launcher SHALL be stored so an unelevated process cannot modify it. The server password SHALL be generated locally and SHALL NOT appear in repository files, Desktop artifacts, process arguments, tray helper arguments, or logs.

#### Scenario: Unelevated mutation is denied
- **WHEN** an unelevated process attempts to modify installed privileged runtime material or the server credential
- **THEN** Windows access control denies the write
- **AND** the installed elevated task continues to reference only protected material

#### Scenario: Credential remains out of observable arguments and logs
- **WHEN** the server, tray helper, and any project client are running
- **THEN** their command lines, Desktop shortcut arguments, tray helper arguments, repository diff, and bounded diagnostics contain no server password
- **AND** authentication is supplied to OpenCode through its supported environment mechanism

### Requirement: Project launchers attach to the shared server
The Desktop SHALL contain elevated launchers for `opencode-kit`, `pmac-emulator`, `controller-gateway-service`, and `windows-ui-automation`. Each launcher SHALL validate its configured Git worktree, verify the complete protected shared runtime identities and credential availability, start exactly one maximized Alacritty with stable PowerShell, invoke authenticated `opencode attach` with that repository as `--dir`, and release all launch-owned hidden invocation/elevation processes after the direct elevated controller completes.

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

#### Scenario: Busy authenticated health does not reject attach handoff
- **WHEN** the protected running identities and listeners remain valid while the authenticated health route is temporarily busy under existing client load
- **THEN** a project launcher starts its authenticated attach client without reporting the managed server as unavailable
- **AND** the tray remains responsible for showing red until a current authenticated health probe succeeds
- **AND** the launcher does not start or replace either shared service

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

### Requirement: Setup is reproducible from the repository
The complete non-secret workstation source, strict repository-path configuration schema, install invocation, operator workflow, validation commands, and rollback invocation SHALL be maintained in `opencode-kit`. Files under the protected runtime root, the Scheduled Tasks, Alacritty configuration, tray helper, hidden invoker, and all six Desktop shortcuts SHALL be derived installation artifacts rather than the sole source of behavior.

#### Scenario: Compatible workstation can render the same installation
- **WHEN** an operator checks out `opencode-kit` on a compatible Windows workstation, supplies a schema-valid configuration containing the exact four local Git worktrees, and runs repository-documented preflight
- **THEN** preflight renders the protected root, server task, tray task, endpoint, configuration identity, stable tool identities, four mappings, and six shortcuts without host mutation
- **AND** install can materialize those artifacts without copying a secret or host-only script from the original workstation

#### Scenario: Invalid machine configuration fails before mutation
- **WHEN** the configuration has an unsupported schema, unknown or missing key, duplicate or missing repository ID, non-string path, absent directory, or mismatched Git root
- **THEN** preflight and install reject it with the affected configuration path and field
- **AND** no protected file, task, shortcut, credential, process, or terminal configuration is changed

#### Scenario: Installed mappings do not hot reload
- **WHEN** the repository configuration changes after installation
- **THEN** existing runtime entry points continue using the protected manifest
- **AND** the changed configuration takes effect only through an explicit stopped repair or rollback and reinstall

### Requirement: Persistent tray lamp reports server liveness
The workstation SHALL show one notification-area icon labeled `opencode-server` after interactive logon until the operator chooses Exit. The icon SHALL be green only when the managed OpenCode and Graphify services are both healthy, SHALL blink a red restarting state while tray Restart is replacing the runtime, SHALL be red when either required service is stopped, failed, or degraded while the tray host is running, and SHALL stay red after a failed tray Restart until a later successful Start or Restart. Listener, process, and endpoint health IO SHALL run outside the tray UI thread. The tray host SHALL NOT receive either service credential.

#### Scenario: Healthy server shows a green lamp
- **WHEN** the managed OpenCode and Graphify services are healthy during an interactive owner session
- **THEN** the notification area shows one `opencode-server` icon
- **AND** that icon is green

#### Scenario: Authenticated OpenCode health stalls behind a live port
- **WHEN** the recorded OpenCode listener still returns an unauthenticated challenge but a recent protected-controller authenticated health probe does not succeed
- **THEN** the notification icon is red rather than green
- **AND** the probe child reads the protected credential without passing it to the tray process, command arguments, tray state, or logs

#### Scenario: Slow health probe does not block the tray menu
- **WHEN** listener discovery or either endpoint health request is slow or stalled
- **THEN** the tray context menu remains responsive to operator input
- **AND** Restart and Exit clicks are processed without waiting for the health request to finish
- **AND** a probe result from before a lifecycle replacement cannot turn the replacement runtime green

#### Scenario: Graphify degradation shows red without stopping clients
- **WHEN** OpenCode remains healthy but the managed Graphify service exits or fails readiness
- **THEN** the notification icon becomes red and identifies degraded shared tools without a credential
- **AND** existing attached client processes are not terminated by the status transition

#### Scenario: Tray Restart shows a restarting lamp then green
- **WHEN** the operator chooses Restart from a healthy or degraded managed runtime
- **THEN** the icon leaves its steady state and blinks in a restarting state until replacement finishes
- **AND** the icon returns to steady green only when both replacement services are healthy

#### Scenario: Failed tray Restart stays red
- **WHEN** tray Restart fails to restore both authenticated services
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
- **THEN** only the positively identified managed runtime identity set is stopped
- **AND** no Desktop Stop shortcut is created

#### Scenario: In-flight tray Restart ignores a second click
- **WHEN** tray Restart is already replacing the managed runtime and the operator chooses Restart again
- **THEN** the tray does not start a second controller process
- **AND** the in-flight replacement continues

#### Scenario: Failed tray Restart names the diagnostics log
- **WHEN** tray Restart fails
- **THEN** the tray shows a secret-free balloon that names `controller-errors.log`
- **AND** the balloon and tray state contain neither service credential
- **AND** the tray does not start an implicit second Start merely because the first Restart failed

#### Scenario: Successful tray Restart does not show the serve-task dialog
- **WHEN** tray Restart restores both authenticated services
- **THEN** the operator does not receive the hidden serve-task command-failed dialog
- **AND** the lamp returns to green after the restarting state

### Requirement: Campaign supervisor installation is explicit and protected
The Windows workstation SHALL provide an explicit preview/install/check/repair/
rollback lifecycle for one campaign supervisor derived from version-controlled kit
source and a schema-valid machine-local registry. The registry SHALL identify each
enabled campaign by safe id, canonical Git root, contained definition/adapter paths,
and resume policy. A separate protected installation manifest SHALL identify the
expected kit source and exact source/installed runtime closure. Neither record SHALL
accept arbitrary command argv, free-form prompts, secrets, unvalidated directories,
or effect authority.

Installed supervisor executables, manifests, registry, state ownership metadata, and
Scheduled Task actions SHALL live in an independently reversible protected sibling root
under the workstation lifecycle owner and be unmodifiable by unelevated processes. The
existing workstation rollback SHALL NOT recursively remove that sibling root or leave
its separately named task pointing at removed material. Installation/activation SHALL be a separate
maintainer operation and SHALL NOT occur from campaign definition, model output,
doctor, OpenCode plugin load, or ordinary project bootstrap.

#### Scenario: Supervisor install preview is safe
- **WHEN** a maintainer runs preview for a valid registry, installation manifest input, and kit source
- **THEN** output identifies the derived protected files, task, campaigns, runtime endpoint, and rollback plan without host mutation
- **AND** it contains no credential value, arbitrary argv, or unredacted maintainer path outside required local diagnostics.

#### Scenario: Registry contains an untrusted project root
- **WHEN** a campaign registration path is absent, not a canonical Git root, mismatches its recorded root, or resolves through a symbolic escape
- **THEN** preview/install/check rejects that registration before protected or task mutation
- **AND** it does not launch OpenCode, the campaign controller, or a project process.

### Requirement: Logon and process recovery resume only safe campaigns
After owner interactive Windows logon, the installed campaign supervisor SHALL wait
for the positively identified authenticated managed OpenCode runtime required by each
enabled campaign, reconcile its protected registration with current project,
campaign, mission, process, session, writer, checkpoint, stop, budget, authority, and
definition evidence, and invoke the portable campaign resume boundary only for a
campaign whose next transition is safe.

If an owned campaign-controller process exits unexpectedly, the supervisor SHALL
retain its cause-preserving stdout/stderr generation and apply finite configured
process restart/backoff only after the same reconciliation. Explicit stop,
owner-required, protected/external block, budget pause, definition drift, project
drift, or unknown process/writer/session/cleanup state SHALL suppress automatic resume
until a later check proves its exact condition cleared. Supervisor recovery SHALL NOT
raise campaign budgets, answer questions, alter campaign state directly, launch a
replacement mission, edit project files, or clear unknown ownership from elapsed time.

#### Scenario: Logon finds a safely resumable campaign
- **WHEN** the managed OpenCode runtime is authenticated and healthy and campaign reconciliation proves current identities, authority, checkpoint, and terminal prior ownership
- **THEN** the supervisor starts one controller process for the exact registered campaign resume operation
- **AND** no second controller or mission is created for that campaign.

#### Scenario: Host restarts during an unknown writer interval
- **WHEN** persisted campaign/mission state says mutation may be active and current evidence cannot prove the prior writer terminal or isolated
- **THEN** supervisor status reports `paused-unknown` and starts no controller or replacement writer
- **AND** reboot or absent PID alone does not clear the ownership gate.

#### Scenario: Operator stopped the campaign before logoff
- **WHEN** the campaign has a current explicit stop disposition and the owner later logs on
- **THEN** the supervisor preserves the stopped state and performs no resume
- **AND** a later explicit campaign resume remains necessary.

### Requirement: Supervisor status and stop are observable and ownership-safe
The workstation SHALL expose read-only status and graceful stop entry points for each
registered campaign without requiring a model call. Status SHALL report privacy-safe
campaign/phase/wave/mission/process refs, current disposition, budget state, last
transition time, writer/liveness classification, and exact manual/resume condition.
Graceful stop SHALL record one correlated intent through the portable campaign
boundary and SHALL report paused only after active semantic roots and mutation writers
are terminal or isolated.

Emergency termination of a protected supervisor/controller process MAY remain an
operator action, but the next check/recovery SHALL report `paused-unknown` until
reconciliation proves closure. The tray MAY display aggregate campaign health and
open status/stop entry points, but it SHALL NOT receive provider credentials, campaign
prompts, finding content, source-mutation tools, or lifecycle decision authority.

#### Scenario: Operator requests graceful campaign stop
- **WHEN** one registered campaign is active and the operator invokes its stop entry point
- **THEN** the supervisor records the exact stop request and prevents another phase or wave launch
- **AND** it waits for attributable active ownership closure before reporting a safe pause.

#### Scenario: Status is requested while OpenCode is unavailable
- **WHEN** the managed OpenCode endpoint is unavailable but campaign state is readable
- **THEN** status reports the durable last state and current runtime unavailability separately
- **AND** it does not infer campaign failure or completion from endpoint absence.

### Requirement: Campaign supervisor rollback preserves project and mission evidence
Rollback SHALL disable and remove only installed campaign-supervisor task/actions,
protected derived binaries/manifests/registry, and attributable runtime process
ownership after verifying their installed identities. It SHALL preserve project
source, OpenSpec changes/specs, campaign definitions, immutable campaign/mission
transitions, checkpoints, evidence, reports, model credentials, shared OpenCode/
Graphify services, unrelated tasks, and workstation configuration.

If installed supervisor material or process identity drifted, rollback SHALL fail
closed for that item and retain exact diagnostics rather than terminate, overwrite, or
delete it. Campaigns remain resumable through a later compatible supervisor install
or explicit portable manual resume after identity reconciliation.

#### Scenario: Supervisor rollback runs against matching installed material
- **WHEN** the protected supervisor task, files, registry, and process identities match their install manifest
- **THEN** rollback stops only the matching supervisor/controller ownership and removes only derived supervisor installation artifacts
- **AND** campaign/mission/project evidence and the shared workstation runtime remain unchanged.

### Requirement: The workstation exposes pinned local Windows desktop control to OpenCode
The workstation SHALL install the reviewed Nuphus MCP version and its matching Windows x64 runtime package into the current global Node.js tool prefix, SHALL load it as an enabled local stdio MCP from the gitignored machine-local OpenCode configuration, and SHALL make its screen, window, mouse, keyboard, perception, and browser tools available only to new OpenCode processes. The machine-local installation SHALL grant Nuphus write operations without per-action strict confirmation, as explicitly selected by the operator, while retaining the higher-level authorization boundaries of the active OpenCode instructions. The portable template, generated profiles, shared code-intelligence installer, remote MCP endpoints, and cloud vision credentials SHALL remain unchanged.

#### Scenario: Restarted OpenCode loads desktop tools
- **WHEN** the exact Nuphus package is installed, the machine-local MCP entry is enabled, and a new OpenCode process starts from the active custom source
- **THEN** an ephemeral-loopback proof server with isolated database, data, cache, state, and home roots reports the `nuphus` MCP as connected
- **AND** the proof server records the active custom config digest and proves its resolved Nuphus entry matches that file
- **AND** a proof-only overlay disables existing sibling MCP entries without defining or changing the Nuphus entry
- **AND** its tool inventory includes screen size, screenshot, window list and activation, mouse, keyboard input, and local perception operations
- **AND** Nuphus write operations do not require a `confirm: true` argument
- **AND** managed listeners and process identities on ports 4096 and 4097 remain unchanged

#### Scenario: Existing OpenCode process remains unchanged until restart
- **WHEN** the package and machine-local configuration are updated while an OpenCode process is already running
- **THEN** that process is not claimed to have loaded Nuphus
- **AND** installation validation uses an ephemeral-port proof-owned OpenCode process with isolated runtime state before the operator restarts or replaces any existing session
- **AND** validation does not attach to, stop, restart, or reconfigure the managed server or launch duplicate sibling MCP processes

#### Scenario: Missing or mismatched installation fails visibly
- **WHEN** the Nuphus command is missing, the meta and Windows packages differ in version, the stdio handshake fails, or OpenCode cannot load the configured MCP
- **THEN** validation reports the exact package, command, protocol, or connection failure
- **AND** no successful desktop-control capability is claimed

### Requirement: Desktop operation follows an observable target-act-confirm loop
The workstation SHALL provide a model-usable observation path that does not treat an inline base64 text response as visible image evidence. The primary path SHALL identify the target window, activate or otherwise positively target it, obtain local perception data or save a proof-owned screenshot and inspect that PNG through OpenCode's image-capable Read tool, perform the minimum required input, and obtain a fresh observation that confirms the intended visible state. A successful click, key, input, or MCP response alone SHALL NOT satisfy the outcome oracle.

#### Scenario: OpenCode inspects actual screen pixels
- **WHEN** the primary agent needs visual information that window metadata or local perception does not supply
- **THEN** Nuphus saves a screenshot to a proof-owned temporary PNG
- **AND** OpenCode reads that PNG as an image rather than consuming the inline base64 string as visual evidence
- **AND** the temporary file is removed after the required privacy-safe evidence is preserved

#### Scenario: Proof-owned Notepad input is confirmed
- **WHEN** validation launches a new proof-owned Notepad instance and positively records its PID and window handle
- **THEN** Nuphus targets that exact window and enters a unique non-sensitive marker
- **AND** a fresh screenshot or local perception result confirms the marker in that window
- **AND** cleanup closes only the proof-owned Notepad instance

#### Scenario: Target identity becomes stale
- **WHEN** the intended window closes, changes identity, loses its expected title or process association, or cannot be activated before input
- **THEN** the agent re-observes and re-resolves the target before acting
- **AND** it does not type or click based only on stale coordinates or a prior successful response

#### Scenario: UI development or debugging requires visible-state evidence
- **WHEN** a UI development or debugging task depends on a fact or effect that is visible only in the running interface
- **THEN** the globally loaded machine-local instruction explicitly positions Nuphus as the available desktop observation and input route
- **AND** the agent identifies and observes the target, performs only the minimum required input, and confirms the visible result through a fresh observation
- **AND** source, logs, tests, and application-native diagnostics remain primary when they directly establish the required non-visual fact
- **AND** the positioning is loaded across projects that use the active custom OpenCode source without duplicating it into project, skill, or agent prompts

### Requirement: Desktop-control installation is diagnosable and exactly reversible
The workstation SHALL preserve the exact pre-change machine-local OpenCode configuration and local-instruction bytes, package state, relevant environment state, and proof-process baseline before mutation. Rollback SHALL remove only the Nuphus MCP entry and exact package installation created by this change, restore prior local instruction content, preserve unrelated configuration and processes, and require a new OpenCode process before absence is claimed. Optional model-cache removal SHALL apply only to model files positively attributed to this installation.

#### Scenario: Installation preserves unrelated local configuration
- **WHEN** the Nuphus entry and usage guidance are added to existing machine-local OpenCode files
- **THEN** all unrelated provider, MCP, plugin, model, permission, compaction, watcher, and local-instruction content remains unchanged
- **AND** the portable `global/opencode.json.template` and generated runtime profiles remain unchanged

#### Scenario: Exact rollback removes the capability
- **WHEN** rollback runs against unchanged Nuphus-managed package and configuration identities
- **THEN** the prior machine-local OpenCode and local-instruction bytes are restored
- **AND** the exact global Nuphus package installation is removed
- **AND** the same isolated ephemeral-port proof route no longer reports the `nuphus` MCP from the restored active-config digest
- **AND** unrelated packages, MCP entries, configuration, user applications, and worktree changes remain untouched

#### Scenario: Drift blocks destructive rollback
- **WHEN** a Nuphus-managed configuration section, instruction section, package identity, model file, or proof artifact no longer matches the recorded installed identity
- **THEN** rollback preserves the drifted item
- **AND** reports the exact identity that requires manual disposition instead of deleting or overwriting it

### Requirement: Screen and model-data effects remain explicit
The workstation SHALL configure no separate Nuphus cloud vision provider or vision credential in this increment. Local OCR or icon models MAY be downloaded only by an explicit exercised perception step, and validation SHALL record the source, resulting file identities, and whether icon detection is available. Any screenshot inspected by the OpenCode model SHALL be treated as model-provider input under the active provider's privacy boundary.

#### Scenario: Screen inspection uses the active OpenCode provider only
- **WHEN** the primary agent reads a screenshot PNG through OpenCode
- **THEN** no Nuphus-specific vision API key or second cloud vision request is required
- **AND** evidence reports that the screenshot entered the active OpenCode model context

#### Scenario: Local perception model bootstrap is observable
- **WHEN** `desktop_perceive` is exercised without complete local models
- **THEN** any model download and resulting cache path are reported
- **AND** OCR failure remains visible rather than silently substituting guessed coordinates
- **AND** optional icon-model failure is reported as degraded perception rather than full perception success

### Requirement: Beads installation is pinned, explicit, protected, and reversible
The Windows workstation SHALL provide preview, disposable-spike, install, check, and rollback operations for the reviewed Beads `v1.2.2` Windows amd64 archive and exact checksum. Preview SHALL show source URL, version, platform, digests, protected destination, profile/config effects, project-registration envelope, rollback ownership, and required restart boundary without downloading, executing, installing, or activating the tool. The disposable spike SHALL use a proof-owned temporary root and isolated environment before protected installation is eligible.

Installed executable, release manifest, registration, adapter closure, bridge-lock artifact, and rollback metadata SHALL be derived from version-controlled kit source and stored under the existing protected workstation lifecycle so unelevated processes cannot replace them. The workstation lifecycle SHALL own the protected bridge-lock artifact's storage, identity, and deletion. Install SHALL NOT initialize a project, edit OpenCode configuration directly, enable a runtime profile, restart OpenCode, install a task/service/hook, configure a remote, or start a persistent process. Check and rollback SHALL verify exact installed identities and preserve drift, project data, and unrelated workstation state. Before rollback removes or revokes managed material referenced by a project registration, it SHALL acquire the same bridge-writer lease used by project mutations and prove every child `bd`/Dolt writer terminal or write-isolated. A held lease or unknown writer liveness SHALL preserve the lock and every referenced managed item and return a partial unknown result.

#### Scenario: Preview inspects the selected release
- **WHEN** a maintainer invokes Beads install preview from current kit source
- **THEN** it reports the pinned archive identity, protected destination, expected derived artifacts, activation prerequisites, and rollback plan without host mutation
- **AND** it does not download, execute, initialize, configure, or start Beads.

#### Scenario: Disposable spike fails
- **WHEN** version, checksum, command capability, embedded Dolt, concurrency, recovery, Git-effect, or cleanup proof fails in the isolated root
- **THEN** protected install and project activation remain ineligible
- **AND** diagnostics preserve the exact failed invocation, effects, process state, and cleanup result.

#### Scenario: Protected installation succeeds
- **WHEN** the disposable spike is green and the maintainer invokes install with the exact reviewed asset
- **THEN** only the matching executable and derived protected manifest/adapter material are installed and read back
- **AND** no OpenCode process, project, profile, hook, task, service, remote, or unrelated package is changed.

#### Scenario: Installed identity drifts before rollback
- **WHEN** rollback finds a managed executable, manifest, registration, adapter, or profile artifact whose current identity differs from its install record
- **THEN** it preserves that item and reports the drift
- **AND** removes no project evidence or unrelated machine material to force completion.

#### Scenario: Writer closure is unknown before rollback
- **WHEN** rollback targets registration-referenced managed material and the bridge lease is held or child writer closure cannot be proven
- **THEN** it preserves the lock and all referenced binary, profile, adapter, config, and registration material and reports rollback as partial and unknown
- **AND** it does not infer safety from timeout, cancellation acknowledgement, elapsed time, or an absent process identifier.

### Requirement: Project activation is separate from workstation installation
The workstation SHALL keep binary installation, exact full `core-beads` profile materialization, and project registration/activation as three explicit operations with independent current status. A successful binary install SHALL not imply that a running OpenCode process discovered the bridge or that any project contains a Beads store. A successful profile materialization SHALL require a fresh OpenCode process before loader availability is claimed. A successful project enablement SHALL remain confined to the one registered pilot root.

#### Scenario: Binary is installed but profile is absent
- **WHEN** the protected executable passes check while the optional Beads profile is not selected
- **THEN** workstation status reports the binary available and the OpenCode bridge unavailable
- **AND** no project activation or always-loaded instruction is inferred.

#### Scenario: Profile changes while OpenCode is running
- **WHEN** the full `core-beads` profile is materialized after an OpenCode process has started
- **THEN** that existing process is not claimed to have discovered the bridge
- **AND** validation uses a fresh proof-owned OpenCode process without stopping or reconfiguring user-owned processes.
