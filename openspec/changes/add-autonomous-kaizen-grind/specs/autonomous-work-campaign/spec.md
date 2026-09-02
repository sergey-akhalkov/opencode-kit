## MODIFIED Requirements

### Requirement: Campaign definitions are explicit, versioned, and bounded
The kit SHALL accept an autonomous work campaign only from a versioned project-contained definition that declares a safe campaign id, accepted outcome, scope roots and exclusions, playbook id, evidence and report paths, aggregate validation argv, checkpoint policy, allowed effect classes and authorization references, finite model-call/wall-clock/evidence-byte/wave budgets, host-resume policy, and terminal stop policy. The current increment SHALL accept exactly the `audit-remediate` and `kaizen-remediate` playbooks and SHALL reject an unknown playbook before a session, provider call, or mutation.

The accepted outcome, scope, exclusions, playbook, effect authority, and protected-decision boundary SHALL remain immutable for one campaign identity. Attempt, time, evidence, and wave budgets are revisable process controls, but raising them SHALL NOT add effect authority, change accepted semantics, or convert a protected boundary into an autonomous action.

#### Scenario: Valid audit-remediation campaign is accepted
- **WHEN** a contained definition supplies every required field, a canonical single Git worktree, finite supported budgets, and the `audit-remediate` playbook
- **THEN** provider-free preflight returns the normalized campaign digest and first `inventory` phase
- **AND** it performs no provider call, source mutation, OpenSpec proposal, or host installation.

#### Scenario: Valid Kaizen-remediation campaign is accepted
- **WHEN** a contained definition supplies every required field, one canonical registered Git worktree, exact frozen Kaizen execution-record correlation, finite supported budgets, and the `kaizen-remediate` playbook
- **THEN** provider-free preflight returns the normalized campaign digest and first evidence-confirmation phase
- **AND** it performs no provider call, source mutation, OpenSpec proposal, or host installation.

#### Scenario: Campaign requests an unsupported playbook
- **WHEN** a definition names a playbook other than `audit-remediate` or `kaizen-remediate`
- **THEN** preflight rejects the definition with the unsupported playbook id
- **AND** it does not infer phase behavior from free-form outcome, signal, or roadmap text.

#### Scenario: Process budget is revised
- **WHEN** a paused campaign receives a valid larger finite attempt, time, or wave budget while outcome, scope, effects, and protected boundaries remain unchanged
- **THEN** resume records the revised process-control digest and may continue from the current safe phase
- **AND** the revision grants no new source, provider, checkpoint, protected, remote, or destructive authority.

## ADDED Requirements

### Requirement: Kaizen remediation consumes one frozen owner-project campaign input
The `kaizen-remediate` playbook SHALL accept only one controller-correlated frozen campaign input. That input SHALL reference one exact execution-record projection containing only the execution ref, Grind run/cycle and source-decision refs, owner project ref and registration/candidate digests, optional canonical Beads ID, exact execution-prerequisite refs, route/gate/retry facts, Campaign/Mission/session refs, and current execution handoff. The campaign input MAY separately carry current owner-supplied accepted outcome, ordered source signal refs, evidence refs, affected/owned paths, required effect classes, and candidate base required for Work Campaign confirmation; those facts SHALL NOT become fields of `execution_records`. The referenced record SHALL contain no portfolio status, dependency graph, priority, assignment, duplicate relations, or independent terminal authority. When the separately enabled Beads bridge owns the selected project's portfolio, the canonical Beads ID SHALL be present and current; another registration SHALL not infer one. Each enabled Grind registration SHALL reference one standing onboarding-owned, project-contained `kaizen-remediate` campaign definition and digest; the Grind controller SHALL pass the frozen campaign input as correlated runtime input and SHALL never materialize or edit that definition in the project. Campaign preflight SHALL verify the current registered root, standing definition, Kaizen-specific provider/local-commit/effect policy, signal/execution-record state, project-scoped writer lease, clean attributed worktree, and controller lease before semantic work.

The playbook SHALL confirm or falsify current evidence, split only independently owned or dependency-valid work without changing the accepted outcome, and freeze admitted project work into the existing Roadmap Mission boundary. It SHALL NOT scan another project, alter controller state directly, create an uncorrelated proposal, or treat source signal recurrence as severity or authority.

#### Scenario: Frozen campaign input matches the project
- **WHEN** controller, registration, project, candidate, signal, effect, and execution-record digests are current and evidence confirms one owner-local change
- **THEN** the campaign may freeze one correlated mission wave for that project
- **AND** Roadmap Mission remains the sole source/OpenSpec writer for the wave.

#### Scenario: Campaign input owner differs from the campaign root
- **WHEN** the project ref, canonical root, registration digest, or candidate base differs from the frozen campaign input
- **THEN** preflight blocks before semantic work, session creation, proposal, or mutation
- **AND** neither campaign nor controller rewrites the campaign input or referenced execution record to fit the observed root.

#### Scenario: Standing Kaizen definition is absent or stale
- **WHEN** a Grind registration lacks the project-contained `kaizen-remediate` definition or its digest/policy differs from current source
- **THEN** campaign preflight blocks before provider use, session creation, proposal, or mutation
- **AND** the controller does not create or repair project files from the central queue.

### Requirement: Kaizen campaigns have one resume host
Kaizen-remediation campaign definitions SHALL select Grind-owned host resume and SHALL not be registered with or resumed by the existing logon campaign supervisor. The protected Grind task SHALL be the only automatic host permitted to reconcile and resume a Kaizen campaign; campaign and mission leases SHALL still reject duplicate invocations.

#### Scenario: Logon supervisor observes a Kaizen definition
- **WHEN** the existing campaign-supervisor registry or runtime encounters a `kaizen-remediate` definition
- **THEN** it rejects or ignores that definition as not owned by its registry
- **AND** does not compete with the Grind task for campaign or project writer ownership.

### Requirement: Kaizen campaign result is correlated back to the controller
For each Kaizen execution record, the campaign SHALL emit a bounded correlated component handoff containing controller/cycle/execution-record refs, campaign and mission digests, source signal refs, project/change/session refs, proof/validation/archive/checkpoint/local-commit evidence, writer and cleanup closure, disposition, gate, and resume condition. Campaign completion SHALL advance the execution record only to `awaiting-terminal`; it is not a portfolio or signal terminal result. The controller SHALL NOT resolve a signal, enter `handoff-complete`, or schedule dependent work while any required identity, effect, proof, writer, cleanup, correlation, or selected portfolio-owner terminal fact is unknown.

#### Scenario: Kaizen campaign completes its project change
- **WHEN** the correlated mission completes propose/apply, proof, validation, archive, checkpoint, and authorized local commit with terminal ownership
- **THEN** campaign emits one verified component handoff and the Grind controller records `awaiting-terminal`
- **AND** for the BPB-enabled project only the Kaizen bridge's ordered Beads-close-then-signal-resolve result permits `handoff-complete`; for another registration only the existing Kaizen terminal transition permits it.

#### Scenario: Campaign pauses on a protected decision
- **WHEN** all authorized independent work is exhausted and the remaining correction requires one protected product decision
- **THEN** campaign returns the exact owner-blocked handoff and terminal writer closure
- **AND** controller preserves that gate without treating the proposal or partial implementation as resolved.
