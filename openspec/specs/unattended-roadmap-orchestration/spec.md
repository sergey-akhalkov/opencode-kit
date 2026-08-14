# unattended-roadmap-orchestration Specification

## Purpose
TBD - created by archiving change add-unattended-roadmap-orchestration. Update Purpose after archive.
## Requirements
### Requirement: Mission definition is explicit, versioned, and bounded
The kit SHALL accept unattended roadmap work only from a versioned project-contained mission definition with a safe mission id, contained roadmap/evidence paths, exact ordered slices, dependency ids, operation kind, accepted outcome summary, protected-effect classification, aggregate validation argv, workflow ownership policy, checkpoint policy, and terminal stop policy. It SHALL NOT derive executable slices, authority, or completion from arbitrary roadmap prose.

#### Scenario: Valid serial mission
- **WHEN** a mission definition contains unique slices whose dependencies form one acyclic serializable graph and every required path and argv is valid
- **THEN** provider-free preflight returns the normalized definition digest and first eligible slice
- **AND** it performs no provider call or repository mutation.

#### Scenario: Roadmap prose contains another unchecked item
- **WHEN** an unchecked roadmap item is not represented by an eligible mission slice
- **THEN** the controller does not execute or add that item
- **AND** it reports that the mission definition, not prose, owns executable scope.

### Requirement: Preflight fails closed before model or mutation
The mission controller SHALL complete provider-free preflight before creating an OpenCode session or mutating the project. Preflight SHALL validate definition schema and containment, dependency order, repository and checkpoint identity, writer liveness, dirty-path ownership, project validation argv, OpenSpec status/version, canonical workflow source and actual loader identity, project override collisions, next-slice effect authorization, and any declared live-attempt prerequisites. Missing, ambiguous, unsupported, or unreadable evidence SHALL be `unknown` and blocking.

#### Scenario: Project shadows canonical apply workflow
- **WHEN** the project exposes a same-name `openspec-apply-change` skill or `opsx-apply` command in addition to the canonical global owner
- **THEN** unattended preflight exits non-zero and identifies the safe colliding paths
- **AND** it does not invoke a model or edit either source.

#### Scenario: Validation argv is absent
- **WHEN** the mission or accepted project adapter has no complete aggregate validation argv
- **THEN** preflight blocks before propose, apply, or archive
- **AND** it does not guess a package manager or shell expression.

#### Scenario: Dirty path overlaps the next slice
- **WHEN** uncheckpointed worktree state overlaps a path owned by the next slice or cannot be attributed to the mission
- **THEN** preflight returns an exact overlap/unknown diagnostic
- **AND** no writer session starts.

### Requirement: Mission transitions are persisted and revision-correlated
The controller SHALL persist a versioned runtime state and immutable transition record for every preflight, session launch, session completion, proof/validation result, archive, checkpoint, successor activation, pause, and terminal stop. Each transition SHALL correlate mission definition digest, previous state digest, repository/kit/tool identities, slice id, active operation, session/process refs, evidence refs, and resulting disposition. Atomic projection replacement SHALL occur only after the immutable transition record is durable.

#### Scenario: Process stops after archive
- **WHEN** the archive helper succeeds and the controller process exits before successor activation
- **THEN** restart reconstruction observes the durable archive transition and does not archive the same change again
- **AND** it resumes at post-archive checkpoint/readback.

#### Scenario: State chain is inconsistent
- **WHEN** a projection references a missing transition or its previous-state digest does not match
- **THEN** resume fails closed as state integrity unknown
- **AND** it does not create a writer or infer the cursor from roadmap text.

### Requirement: OpenSpec lifecycle is serialized through existing owners
For each eligible slice the controller SHALL permit at most one mutation-capable OpenCode session, inspect machine-readable OpenSpec status and task evidence after it exits, invoke the existing complete-archive helper only when every completion and validation gate is satisfied, perform post-archive status/roadmap readback, and checkpoint before activating a successor. Model prose SHALL NOT authorize a lifecycle transition.

#### Scenario: Model reports completion with an unchecked task
- **WHEN** a slice session exits zero and claims completion while OpenSpec reports an unchecked task
- **THEN** the controller keeps the slice active and does not invoke archive
- **AND** bounded continuation or terminal failure follows the recorded mission recovery policy.

#### Scenario: Completed change archives successfully
- **WHEN** task evidence, strict OpenSpec validation, project validation, archive helper, post-validation, and roadmap readback are green
- **THEN** the controller persists an archived transition and required checkpoint
- **AND** only then may it activate a dependency-valid successor.

### Requirement: Checkpoint behavior is explicit and remote-free
Every multi-change mission SHALL select `local-commit` or `external` checkpoint policy. `evidence-only` SHALL be permitted only for one change in a disposable/isolated worktree. `local-commit` SHALL require explicit recorded owner authorization, exact mission-owned paths, scoped staging, green hooks, and no remote operation. `external` SHALL stop until an externally supplied checkpoint identity is verified.

#### Scenario: Multi-change mission lacks durable checkpoint
- **WHEN** a non-disposable mission contains multiple slices with `evidence-only` checkpoint policy
- **THEN** preflight blocks before the first writer
- **AND** it identifies the unsupported recovery envelope.

#### Scenario: Local checkpoint is authorized
- **WHEN** `local-commit` is explicitly authorized and every changed path belongs to the completed slice
- **THEN** the controller may create one local commit after archive/post-validation
- **AND** it never pushes or stages an unrelated path.

### Requirement: Protected and unavailable outcomes stop cleanly
The controller SHALL stop before any slice whose required effect class, owner decision, credential, remote system, external capability, live-attempt gate, or dependency is not currently satisfied. It SHALL persist the exact blocker, preserve prior completed slices, and SHALL NOT ask the completion arbiter to approve or simulate the missing boundary.

#### Scenario: Only external blocker remains
- **WHEN** all earlier slices are checkpointed and the next slice requires an unavailable external capability
- **THEN** the mission reaches terminal `owner-required` or `external-blocked` with the exact unblock condition
- **AND** it performs no attempt against that boundary.

### Requirement: Mission retry and writer recovery are bounded
The controller SHALL classify failures as stale/cancelled, retryable transient, locally correctable, terminal input/state, or owner/external. It SHALL apply finite per-slice attempt and wall-clock limits, require a materially changed mechanism after recorded stagnation, and SHALL NOT launch another writer while prior writer liveness or mutation authority is unknown.

#### Scenario: Prior writer state is unknown after restart
- **WHEN** persisted state says a mutation-capable session was active and runtime evidence cannot prove it terminal or isolated
- **THEN** resume remains blocked with writer liveness unknown
- **AND** it does not start another session for the slice.

#### Scenario: Provider outage is transient
- **WHEN** the OpenCode process exits with a classified transient provider error below the configured limit
- **THEN** the controller records the attempt and schedules bounded backoff
- **AND** exhaustion produces a resumable paused state rather than an infinite loop.

### Requirement: Installed disposable proof precedes target missions
The kit SHALL maintain a proof runner that exercises the actual installed mission preflight/controller, canonical OpenSpec workflow, OpenSpec CLI, archive helper, project validation adapter, and OpenCode boundary in disposable projects. The complete proof SHALL include two serialized completed changes, one recoverable local failure, one process restart, and one terminal blocked slice, with deterministic cleanup and no protected or remote effect.

#### Scenario: Provider-free preflight proof
- **WHEN** the proof runner creates valid and invalid disposable mission projects
- **THEN** the actual mission entrypoint returns stable expected eligible/blocking results and leaves project behavior unmodified
- **AND** exact invocation, exits, stdout/stderr, identities, and cleanup are preserved.

#### Scenario: Configured-provider mission proof
- **WHEN** provider preflight is green and the bounded live proof is separately authorized
- **THEN** installed OpenCode sessions complete the synthetic lifecycle through terminal blocked stop
- **AND** the evidence does not claim target-project, deployment, remote, or protected-action readiness.

