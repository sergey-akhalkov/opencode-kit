## ADDED Requirements

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
