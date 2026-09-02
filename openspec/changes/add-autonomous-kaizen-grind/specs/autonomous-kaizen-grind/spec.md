## Purpose

Provides one reversible machine-local controller that continually turns bounded Kaizen signal snapshots into visible, project-owned, fully implemented OpenSpec improvements without unattended authority expansion.

## ADDED Requirements

### Requirement: Kaizen uses one dedicated D-drive lifecycle root
The installed Kaizen capture and Grind surfaces SHALL use `D:\OpenCode\data\kaizen` as their sole writable lifecycle root after successful enablement. Protected configuration `dataRoot` and the managed serve/attach launcher's dedicated absolute `OPENCODE_KAIZEN_DATA_DIR` SHALL both equal that complete root; the Kaizen capture/lifecycle resolver SHALL use it directly, append no additional `kaizen` segment, and SHALL not use `OPENCODE_DATA_DIR` for v2 location or move project-memory/application data. `kaizen.db` SHALL be directly beneath that root. A managed process lacking the activated dedicated value SHALL expose capture as unavailable and SHALL not fall back to a writable v1 C: store. The root SHALL contain no credential value, SHALL remain outside every registered project worktree, and SHALL NOT reuse or overwrite the existing OpenCode application database. Changing the configured Kaizen root SHALL require validated migration and an OpenCode restart; controller-only schedule or budget changes MAY take effect at the next task invocation.

#### Scenario: Grind is enabled on a fresh workstation
- **WHEN** the operator invokes `/enable-kaizen-grind` with no existing Kaizen lifecycle
- **THEN** capture and controller state resolve beneath `D:\OpenCode\data\kaizen`
- **AND** no Kaizen file is created under the Windows system-drive OpenCode data root or a project worktree.

#### Scenario: Configured root is relative or differs from the accepted target
- **WHEN** enablement receives a relative, symbolic-escape, or non-target Kaizen data root
- **THEN** preflight rejects the configuration before migration, task registration, restart, or capture cutover
- **AND** reports the invalid field and accepted absolute target without changing either store.

### Requirement: Legacy Kaizen state migrates without loss or split authority
Enablement SHALL first resolve and durably record the exact canonical JSON v1 source path selected by the current capture owner, then import every valid signal and lifecycle record from that source into one transactional versioned store, preserving stable refs, source identities, project/session refs, timestamps, payloads, decision/checkpoint relationships, deduplication, and folded lifecycle state. Import SHALL be idempotent. The D: store SHALL become authoritative only after every managed or otherwise detected OpenCode process is classified, every process that could use the recorded source is terminal or write-isolated, complete source-to-target identity and count readback succeeds, a target capture/read canary succeeds, and newly started managed OpenCode processes expose the dedicated target root. Any unclassified OpenCode process SHALL keep cutover blocked.

If any prerequisite or readback is missing, corrupt, contradictory, or unknown, enablement SHALL leave Grind disabled and the source authoritative. After successful cutover, the lifecycle SHALL retain a rollback-capable target backup and remove only the proven legacy Kaizen source from C:, never a sibling OpenCode file or directory.

#### Scenario: Existing populated store is migrated
- **WHEN** the v1 source contains duplicate occurrences, pending signals, decisions, diagnostics, checkpoints, and resolved signals
- **THEN** one idempotent migration preserves every valid record identity and the exact folded state in the target
- **AND** target authority is not published until counts, refs, relationships, and canary readback match.

#### Scenario: A legacy writer may still append
- **WHEN** process/session evidence cannot prove every process using the v1 root terminal or isolated
- **THEN** migration remains pre-cutover and Grind launches no semantic processor or project writer
- **AND** neither elapsed time nor an unchanged file timestamp is accepted as writer closure.

#### Scenario: Target validation fails
- **WHEN** import, integrity readback, or the target capture canary fails
- **THEN** the source remains authoritative and readable, the target candidate is not activated, and the original cause is reported
- **AND** no C:-root deletion, Scheduled Task activation, or project mutation occurs.

### Requirement: Enable is one idempotent operational entry point
`/enable-kaizen-grind` SHALL be a thin deterministic caller of the protected Grind control host. The protected host SHALL run provider-free preflight, validate the machine-local configuration and registered-project closure, complete or safely resume migration, install or repair the exact protected controller closure and Scheduled Task, activate capture/controller root configuration, reconcile every current user/campaign/mission/session/PTY/writer owner on the managed OpenCode runtime, and request one immediate run-now of the same task. The invoking chat session SHALL not perform semantic triage, provider calls, migration writes, project mutation, or campaign/mission work. Repeating enable against the same current installation SHALL return current status without duplicating a task, controller, migration, cycle, or project execution record.

The command SHALL distinguish `enabled`, `enabling`, `pending-restart`, `blocked`, and `failed` outcomes. A managed runtime MAY be restarted only through its existing positively identified workstation lifecycle after durable handoff to the protected host and after every unrelated mutation-capable owner is terminal or write-isolated; an unmanaged, active, or ambiguously owned runtime SHALL produce `pending-restart` without termination. Enable, run-now, or repair SHALL remain ineligible while installation status is `stopping-unknown`, any writer tuple is unknown, or cutover is `pending-restart`; provider-free status and graceful disable remain available.

#### Scenario: Enable succeeds through the managed workstation
- **WHEN** migration, registry, protected installation, runtime ownership, provider budget, and task prerequisites are current
- **THEN** enablement activates exactly one daily task and one immediate catch-up cycle
- **AND** returns data-root, installation, runtime, cycle, and cleanup identities without exposing credentials or signal payloads.

#### Scenario: Enable is repeated
- **WHEN** the installed manifest, task, configuration, data authority, and active cycle already match
- **THEN** the command reports the existing enabled state
- **AND** creates no duplicate task, migration, run, session, campaign, or writer.

### Requirement: Each cycle drains its complete captured watermark
At cycle start the controller SHALL durably capture the highest eligible signal sequence and stable pending population. It SHALL process semantic batches of at most 25 in age/ref order, persist a decision, correlated execution record, or exact gate for every member, and automatically continue until the watermark is exhausted. Signals captured after the watermark SHALL remain eligible for the next cycle and SHALL NOT make the current cycle unbounded.

One invocation SHALL use finite configured budgets. The maintained defaults SHALL permit at most 32 model calls and four wall-clock hours per invocation, one active project writer, and two causally distinct retries per failing operation, under one durable daily budget of at most 96 model calls and eight semantic wall-clock hours beginning at the 03:00 local schedule boundary. The protected task SHALL own wake-up: its 15-minute repetition reads `nextEligibleAt` and daily consumption, starts the same controller only when eligible, and exits provider-free otherwise. When an invocation budget is exhausted with watermark work remaining, the controller SHALL persist its cursor and `nextEligibleAt`; daily exhaustion SHALL defer eligibility to the next 03:00 budget window. Budget revision SHALL remain a process control and SHALL grant no new effect authority.

Each cycle SHALL use one visible read-only triage root session on the managed server to produce semantic decisions for transactionally claimed batches. Eligibility SHALL include pending signals and actionable triaged/promoted signals without a correlated terminal execution handoff whose first automatic admission or evidence-based retry condition is due. Manual triage SHALL reject claimed members. The triage session SHALL write decisions and proposed execution-record seeds only through bounded Kaizen tools; the controller SHALL persist an execution record only after current owner, registration, and optional portfolio-bridge checks pass. The triage session SHALL have no project source, OpenSpec, commit, or protected-host mutation authority.

#### Scenario: Backlog exceeds one triage page
- **WHEN** a cycle watermark contains more than 25 pending signals
- **THEN** the controller processes successive bounded pages until every watermark member has a durable disposition, execution record, or gate
- **AND** no page, model response, or status truncation is represented as complete population closure.

#### Scenario: Signals arrive during a cycle
- **WHEN** capture appends new signals after the current high-water mark
- **THEN** the current cycle can terminate after its original population closes
- **AND** the new signals remain pending for a later cycle without being lost or silently folded into the current claim.

#### Scenario: Invocation budget expires
- **WHEN** finite time or model-call budget is exhausted before watermark closure
- **THEN** the cycle persists its exact cursor, consumed budget, open work, and next eligible continuation
- **AND** requires no manual triage command or budget increase to continue within the accepted recurring policy.

#### Scenario: Daily budget is exhausted
- **WHEN** current daily model-call or semantic wall-clock consumption reaches its configured ceiling
- **THEN** the controller persists the cursor and sets `nextEligibleAt` to the next 03:00 local budget boundary
- **AND** each intervening task repetition exits provider-free without reopening spend.

### Requirement: Project routing is explicit and privacy-separated
The controller SHALL route source-project work only through a distinct enabled protected Kaizen Grind registration containing a safe id, canonical Git root, privacy-safe project ref, standing project-contained `kaizen-remediate` definition path/digest, and an explicit Kaizen provider/local-commit/effect policy. Project validation, adapters, paths, budgets, and hook policy SHALL come from that standing definition. The existing campaign-supervisor v1 registry SHALL remain unchanged and SHALL not parse or resume Grind registrations. The protected Grind registration MAY retain the root needed for execution, but the shared inbox and ordinary status output SHALL retain only privacy-safe project refs and SHALL NOT become an absolute-root reverse map.

Kit-owned work SHALL route to the registered `opencode-kit` owner. A signal affecting multiple project owners SHALL create separate correlated execution records and separate project writers. Missing, stale, ambiguous, disabled, or mismatched registration SHALL produce an `unregistered` or `owner-unknown` gate and no repository mutation.

Each execution record SHALL contain only an execution ref, run/cycle and source-decision refs, owner project ref, registration/candidate digests, optional canonical Beads ID, exact execution-prerequisite refs, route, gate/retry, Campaign/Mission/session refs, and resulting execution handoff. It SHALL NOT contain portfolio status, dependency graph, priority, assignment, duplicate relations, or independent terminal authority. When the separately enabled Beads bridge owns the selected project's portfolio, dispatch SHALL require the canonical Beads ID and current bounded bridge observation; Grind SHALL read Beads-owned readiness and terminal facts without copying them. When that bridge is absent for another registration, the current Kaizen decision remains admission evidence and no Beads identity or ownership SHALL be inferred.

#### Scenario: Registered project owns the improvement
- **WHEN** current evidence identifies one enabled project registration whose derived project ref and policy match the signal owner
- **THEN** the controller creates one owner-project execution record correlated to the source signals
- **AND** no other repository receives the execution record or unredacted payload.

#### Scenario: Signal spans project and kit behavior
- **WHEN** one accepted outcome requires independently owned changes in a consumer project and `opencode-kit`
- **THEN** the controller creates separate execution records with only the exact execution-prerequisite refs needed to serialize the current outcome and one writer at a time per owner
- **AND** no session or OpenSpec change mutates both repositories.

#### Scenario: The selected project uses the Beads portfolio bridge
- **WHEN** the separately enabled bridge reports one canonical Beads feature for the selected project and the controller admits its execution
- **THEN** the execution record references that Beads ID and retains only controller routing, gate, retry, Campaign, Mission, session, and execution-handoff facts
- **AND** portfolio status, dependencies, priority, assignment, duplicate relations, and terminal authority remain in Beads and the Kaizen bridge.

#### Scenario: Another registration has no Beads portfolio bridge
- **WHEN** a current Kaizen decision is admitted for a registered project without the separately enabled bridge
- **THEN** the controller creates its non-portfolio execution record with no Beads ID
- **AND** neither the one-project Beads ownership claim nor any Beads state is generalized to that registration.

#### Scenario: Project is not registered
- **WHEN** a signal's project ref has no current enabled registration
- **THEN** the signal receives a durable `unregistered` gate with its exact resume condition
- **AND** the controller performs no drive scan, path guess, project initialization, or source mutation.

### Requirement: Admitted improvements complete in the owner project
For each evidence-confirmed authorized owner-project execution record, the controller SHALL launch the existing campaign and roadmap lifecycle from that project's canonical root. The project-local lifecycle SHALL acquire the project-scoped mutation lease and use the project's current instructions, OpenSpec source, standing Kaizen campaign definition, adapters, proof boundaries, validation argv, checkpoint policy, and explicit Kaizen effect authority. It SHALL create one project-local OpenSpec change, immediately execute proposal then apply in the same root development session, run required real-boundary proof and validation, archive through the canonical helper, and create an explicitly authorized scoped local commit before recording an execution handoff. For a project whose portfolio is owned by the separately enabled Beads bridge, the controller SHALL wait for the Kaizen bridge's ordered Beads-close-then-signal-resolve result and SHALL only record that result; for another registration, the existing Kaizen lifecycle remains the signal terminal owner.

Local-commit preflight SHALL inspect the effective hooks path and executable commit hooks. A registration SHALL either prove no active commit hook or bind an exact reviewed local-only hook manifest/digest; an absent, stale, or unknown hook policy SHALL gate commit. Any observed network or remote effect during a commit SHALL remain a non-deferrable failure and SHALL not resolve the execution record; automation SHALL never disable hooks to satisfy the commit.

A created proposal, completed model response, checked task list, green unit test, or archive alone SHALL NOT complete the execution handoff. Dirty or unattributed paths, overlapping active changes, stale base identity, missing proof, failed validation, unknown writer/cleanup, or unavailable local-commit authority SHALL persist an exact gate and prevent lifecycle closure.

#### Scenario: Project improvement completes
- **WHEN** one admitted execution record has a clean current registered project, supported adapters, finite provider authority, and explicit local-commit effects
- **THEN** its visible project session proposes and applies the change and the owning lifecycle proves, validates, archives, and locally commits it
- **AND** only the resulting correlated terminal evidence permits an execution-handoff completion, while the selected portfolio owner controls any portfolio and signal terminal projection.

#### Scenario: Proposal is created but apply fails
- **WHEN** project-local proposal succeeds and apply, proof, validation, archive, or checkpoint fails
- **THEN** the execution record remains active or resumably gated at that exact boundary
- **AND** the controller does not mark the signal resolved, create a duplicate change, or skip directly to another lifecycle phase.

### Requirement: Development sessions are visible and safely transferable
Each project implementation SHALL use one ordinary root OpenCode session created on the same authenticated managed server and session store used by the user's normal UI. Its project directory, bounded title, and metadata SHALL expose privacy-safe run, execution-record, signal, change, phase, attempt, and writer identities. Proposal and apply commands for one change SHALL execute in that same root session; review sessions MAY be correlated children.

Opening a session SHALL not change ownership. An explicit takeover, or detected submitted user input into an automation-owned active session, SHALL prevent another automatic command, immediately abort or write-isolate any in-flight executor request, request mission/session stop, and transfer ownership only after automation process tree, writer, request, and cleanup closure are terminal or the worktree write authority is isolated. Session abort acknowledgement, non-busy status, timeout, cancellation acknowledgement, or missing PID alone SHALL remain unknown. Unknown closure SHALL pause both user mutation through the automation path and automatic resume.

#### Scenario: User opens an active development session
- **WHEN** the user views the session from the target project's normal session list without submitting input
- **THEN** current conversation, phase, status, and correlation metadata remain visible
- **AND** the existing automation writer continues without creating another session.

#### Scenario: User takes over development
- **WHEN** takeover is requested for an active automation-owned project session
- **THEN** the controller prevents another automatic command and transfers writer ownership only after terminal or isolated automation closure
- **AND** the user may continue the same project session without a competing automated writer.

### Requirement: Disable stops future work and closes current ownership
`/disable-kaizen-grind` SHALL be a thin deterministic caller of the protected host and SHALL atomically advance the disabled generation, disable the same repeating task, and prevent new cycles, claims, continuations, triage/project sessions, campaigns, and missions before requesting graceful stop for active controller and writer ownership. It SHALL report `disabled` only after every attributable mutation-capable process/session/request/writer/cleanup owner is terminal or isolated and the Scheduled Task cannot launch another run. Unknown ownership SHALL remain visible as `stopping-unknown` and SHALL NOT be cleared by task removal, abort/cancellation acknowledgement, non-busy API status, process absence, timeout, or elapsed time.

Disable SHALL leave Kaizen capture enabled, preserve the D: database, lifecycle, project changes, sessions, archives, commits, and diagnostics, and perform no rollback or remote operation. Repeated disable SHALL be idempotent.

#### Scenario: Disable is invoked while idle
- **WHEN** no controller or project writer is active
- **THEN** future task launches and continuations are disabled and status becomes `disabled`
- **AND** signal capture and existing lifecycle data remain available.

#### Scenario: Disable is invoked during implementation
- **WHEN** a project mission session owns source mutation
- **THEN** disable records one correlated stop intent and waits for terminal or isolated writer and cleanup evidence
- **AND** no successor project, campaign, mission, or session starts.

### Requirement: Scheduling and recovery are finite and observable
The protected Windows task SHALL use the current owner's interactive token, run once immediately after enablement, start its daily window at 03:00 local time, repeat every 15 minutes for 24 hours, and use `StartWhenAvailable` only after owner logon/resume. It SHALL not wake the machine or start the shared managed server. It SHALL reject overlapping instances, check disabled generation and `nextEligibleAt`, and invoke a finite controller that exits after cycle completion, persisted continuation, safe pause, or failure. The four-hour graceful budget SHALL precede a five-hour task execution limit; forced timeout SHALL leave current ownership unknown for reconciliation. Controller, task, migration, database, runtime, triage session, project, campaign, mission, development session, budget, stop, and cleanup states SHALL remain independently observable through `/kaizen-grind-status` without a model call.

Unexpected exit or host restart SHALL reconstruct only from immutable current state and validated projections. Automatic recovery SHALL use finite backoff and SHALL NOT repeat an unchanged failed live/costly action, clear unknown writer state, raise budgets, answer a protected decision, or infer success from process absence.

#### Scenario: Workstation misses the daily start
- **WHEN** the owner logs on or resumes an interactive session after 03:00 and the existing managed runtime becomes healthy
- **THEN** the protected task starts one catch-up controller when its runtime prerequisites are available
- **AND** no second daily or manual instance overlaps it.

#### Scenario: Controller crashes after launching a mission
- **WHEN** durable state says a project mission may own mutation and controller liveness is lost
- **THEN** recovery reconciles the exact campaign, mission, session, process, checkpoint, and cleanup identities before another action
- **AND** starts no replacement writer while any ownership dimension is unknown.

### Requirement: Autonomous authority remains explicit and local
The controller SHALL admit semantic/model work only while the explicit Kaizen registration/provider route and finite invocation plus daily budgets are current, and SHALL admit project mutation/local commit only when the exact Kaizen registration/standing-definition policy, project-scoped lease, hook policy, and current project preflight authorize those effect classes. Existing `audit-remediate` provider/local-commit authority SHALL not be inherited by Grind. No signal, recurrence count, model output, generated proposal, task state, reviewer finding, schedule, or enablement flag SHALL authorize push, merge, release, deployment, destructive cleanup, purchase, quota increase, credential disclosure, or a protected product/security/privacy/persisted-data/legal decision.

Every unsupported effect or decision SHALL produce a durable scoped gate while independent registered work remains eligible. Diagnostics SHALL preserve the original cause and safe correlation context without signal payloads, credentials, absolute consumer roots in shared output, or duplicate catch-and-rethrow logging.

#### Scenario: Proposed fix needs a protected decision
- **WHEN** an admitted signal requires a material product, security, privacy, migration, or legal-policy choice with no accepted reversible default
- **THEN** the affected execution record becomes owner-blocked after independent eligible work drains
- **AND** automation neither chooses an option nor weakens the accepted proof or safety envelope.

#### Scenario: Model budget is unavailable
- **WHEN** configured provider or finite budget authority is absent or exhausted
- **THEN** semantic work pauses with the exact next eligible budget/runtime condition
- **AND** capture, status, disable, deterministic migration, and unrelated safe local work remain available.
