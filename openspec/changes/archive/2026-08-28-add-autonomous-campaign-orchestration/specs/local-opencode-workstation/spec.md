## ADDED Requirements

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
