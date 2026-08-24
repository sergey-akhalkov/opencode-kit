## Purpose

Defines a resource-efficient multi-project code-intelligence runtime that shares only services with explicit multi-project contracts while preserving every required tool and project boundary.

## ADDED Requirements

### Requirement: Service sharing follows explicit state ownership
The managed OpenCode workstation SHALL expose Graphify, Codebase Memory, Serena, and OpenCode LSP capability to every selected project. It SHALL share only a service whose requests carry sufficient explicit project or graph authority and whose server supports concurrent clients without process-wide project switching. It SHALL keep Serena and OpenCode LSP state project-scoped under the current supported interfaces.

#### Scenario: Two projects retain the complete tool set
- **WHEN** two different selected project clients are attached concurrently
- **THEN** both clients expose the configured Graphify, Codebase Memory, Serena, and OpenCode LSP capabilities
- **AND** neither project loses a tool because another project attached

#### Scenario: Project-scoped services remain isolated
- **WHEN** both clients initialize Serena and language-server-backed operations
- **THEN** each project's Serena and LSP processes remain associated with that project's exact directory
- **AND** one client's project activation or exit does not switch or terminate the other project's project-scoped services

### Requirement: One authenticated Graphify service serves all projects
The managed runtime SHALL start exactly one Graphify service tree for the fixed configured graph, SHALL bind its Streamable HTTP endpoint only to `127.0.0.1:4097`, SHALL require a generated API key, and SHALL operate without retaining per-client protocol sessions. Every project instance SHALL connect to that service through the same remote MCP name and SHALL NOT start a local Graphify MCP process.

#### Scenario: Concurrent clients reuse Graphify
- **WHEN** the first selected project is Graphify-ready and a second selected project attaches
- **THEN** both clients use the same positively identified Graphify listener and service tree
- **AND** no additional process loads the fixed configured graph for the second client

#### Scenario: Graphify tool behavior is preserved
- **WHEN** each client lists Graphify tools and performs the same representative query against the fixed configured graph
- **THEN** each client observes the expected complete tool inventory
- **AND** the representative results are equivalent to the preserved local-MCP baseline

#### Scenario: Unauthenticated Graphify access is rejected
- **WHEN** a loopback caller requests the Graphify MCP endpoint without the generated credential or with a wrong credential
- **THEN** the endpoint returns an authentication failure
- **AND** no tool executes and no graph content is returned

#### Scenario: Unrelated listener fails closed
- **WHEN** `127.0.0.1:4097` is owned by a process that does not match the managed Graphify identity
- **THEN** Start and Restart do not send the Graphify credential to that listener
- **AND** no Graphify or OpenCode replacement starts until the collision is resolved

### Requirement: Shared Graphify never inherits implicit project authority
Graphify queries SHALL use the fixed configured default graph unless an explicit supported `project_path` is supplied. A Graphify tool whose omitted `repo` would otherwise infer repository context from the singleton process working directory SHALL reject the request before execution. Explicit `repo` and `project_path` arguments SHALL pass through unchanged.

#### Scenario: Missing repository authority is rejected
- **WHEN** a client invokes a Graphify repository-relative or PR tool without its required explicit `repo`
- **THEN** the call fails before Graphify performs repository or remote work
- **AND** the diagnostic names the missing argument without selecting another project

#### Scenario: Explicit repository authority is preserved
- **WHEN** a client invokes the same tool with an explicit supported repository identifier
- **THEN** the exact identifier is sent to Graphify unchanged
- **AND** the singleton process working directory does not override it

### Requirement: Graphify credentials and configuration remain protected
The Graphify API key SHALL be generated locally, stored only under the protected workstation root, and supplied to Graphify and OpenCode through inherited environment. The machine-local OpenCode configuration SHALL contain only an environment reference, SHALL preserve unrelated bytes during the managed MCP edit, and SHALL never contain the credential value.

#### Scenario: Installed configuration selects the remote service
- **WHEN** the managed workstation installation is current
- **THEN** the `graphify-global` MCP entry resolves to the authenticated loopback remote endpoint
- **AND** its prior local command is absent from the effective entry
- **AND** unrelated configuration bytes are unchanged

#### Scenario: Credential is not observable in persistent artifacts
- **WHEN** the services and two project clients are running
- **THEN** command lines, shortcuts, task definitions, machine-local config bytes, state, tray data, logs, and retained evidence contain no Graphify API-key value
- **AND** authenticated Graphify calls still succeed

#### Scenario: Config drift blocks replacement or rollback
- **WHEN** the machine-local Graphify MCP entry or managed result changes after installation
- **THEN** repair and rollback preserve the drifted file
- **AND** report the source path and identity mismatch instead of overwriting it

### Requirement: Codebase Memory retains one shared daemon
Concurrent project instances SHALL continue using Codebase Memory through its supported project frontends and one internal daemon. This increment SHALL NOT add another Codebase Memory broker or start one heavy daemon per client.

#### Scenario: Two projects use one Codebase Memory daemon
- **WHEN** two selected projects initialize Codebase Memory and query their respective indexed projects
- **THEN** both queries succeed through one internal daemon identity
- **AND** project-specific stdio frontends MAY remain separate

### Requirement: Required service degradation is visible without immediate session loss
If the managed Graphify service exits after the runtime became ready, the workstation SHALL preserve the healthy OpenCode listener and existing attached client processes, SHALL mark the managed runtime degraded, SHALL make the tray/status non-green, SHALL retain the original Graphify failure cause, and SHALL reject new project launches until an explicit successful Restart restores the complete runtime.

#### Scenario: Graphify exits while clients are attached
- **WHEN** the positively identified Graphify service exits while OpenCode and one or more clients remain healthy
- **THEN** the OpenCode listener and attached clients remain running
- **AND** managed status and the tray report degraded/red state
- **AND** a new launcher fails with a secret-free Graphify diagnostic

#### Scenario: Explicit Restart restores the complete runtime
- **WHEN** the operator invokes Restart from degraded state and all prior managed identities can be safely stopped
- **THEN** a new authenticated Graphify service and OpenCode listener become ready
- **AND** the tray returns to green only after both services pass their readiness contracts

### Requirement: Resource improvement is measured against equivalent behavior
The change SHALL compare baseline and candidate using the same workstation identity, fixed graph, selected project pair, launch order, readiness conditions, settle conditions, sample count, and cleanup. For the two-client workload, candidate median Graphify private bytes SHALL be at least 35 percent lower than baseline; candidate attach and Graphify-tool readiness SHALL be no more than 20 percent slower than baseline or 2 seconds slower, whichever allowance is larger.

#### Scenario: Candidate meets the resource threshold
- **WHEN** baseline and candidate complete the equivalent two-client workload with all behavior checks green
- **THEN** the evaluator reports attributed process groups and repeated raw memory/timing samples
- **AND** the Graphify private-byte and readiness thresholds pass

#### Scenario: Resource oracle fails after behavior succeeds
- **WHEN** behavior remains correct but the measured resource or readiness threshold fails
- **THEN** the evaluator preserves both raw bundles and reports that the optimization target was not met
- **AND** cleanup and the running managed services are not changed by that evaluator result
