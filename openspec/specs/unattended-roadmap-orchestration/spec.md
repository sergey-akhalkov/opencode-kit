# unattended-roadmap-orchestration Specification

## Purpose
Define a bounded persisted mission controller that serially executes explicit OpenSpec
slices through validated local OpenCode sessions, checkpoints each completed slice, and
fails closed on unknown ownership, protected boundaries, or incomplete cleanup.

## Requirements

### Requirement: Mission definition is explicit, versioned, and bounded
The kit SHALL accept unattended roadmap work only from a versioned project-contained mission definition with a safe mission id, contained roadmap/evidence paths, between one and 100 exact ordered slices, dependency ids, operation kind, accepted outcome summary, protected-effect classification, aggregate validation argv, workflow ownership policy, checkpoint policy, and terminal stop policy. It SHALL NOT derive executable slices, authority, completion, or a successor campaign from arbitrary roadmap prose or model output.

#### Scenario: Valid serial mission
- **WHEN** a mission definition contains between one and 100 unique slices whose dependencies form one acyclic serializable graph and every required path and argv is valid
- **THEN** provider-free preflight returns the normalized definition digest and first eligible slice
- **AND** it performs no provider call or repository mutation.

#### Scenario: Roadmap prose contains another unchecked item
- **WHEN** an unchecked roadmap item is not represented by an eligible mission slice
- **THEN** the controller does not execute or add that item
- **AND** it reports that the mission definition, not prose, owns executable scope.

#### Scenario: Mission exceeds the campaign bound
- **WHEN** a mission definition contains more than 100 slices
- **THEN** provider-free preflight rejects the definition before a model or writer starts
- **AND** it does not split or replace the rejected mission automatically.

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

### Requirement: Declared slices auto-chain without inventing scope
After a slice is archived, validated, and checkpointed, the controller SHALL activate the next dependency-valid declared slice without requiring operator confirmation. It SHALL allow a model to author only the named `propose` change and necessary dependency closure within that slice's accepted outcome; it SHALL NOT add another product outcome, reorder the immutable campaign, or generate or launch a successor campaign after the declared slices are exhausted.

#### Scenario: Two declared slices complete
- **WHEN** the first of two dependency-ordered slices reaches its durable checkpoint and the second slice remains eligible
- **THEN** the controller starts the second slice without an operator confirmation prompt
- **AND** terminal completion follows only after the second slice reaches its checkpoint.

#### Scenario: Campaign queue is exhausted
- **WHEN** every declared slice is durably archived and checkpointed
- **THEN** the mission records terminal `complete`
- **AND** neither roadmap prose nor a model response can create or launch another campaign.

### Requirement: Queued active changes are exact, clean, and dormant
Preflight SHALL permit multiple active OpenSpec changes only when their identifiers equal the remaining mission slices whose operation is `continue`, their artifact paths are clean against the accepted checkpoint, and runtime evidence proves no writer, question wait, session, process, or lease owns them. An unlisted active change, a missing declared `continue` change, overlapping dirt, live ownership, ambiguous ownership, or unreadable evidence SHALL block before a model or mutation.

#### Scenario: Listed dormant changes await later slices
- **WHEN** OpenSpec reports exactly the active changes named by the remaining `continue` slices, their paths are checkpoint-clean, and all writer and runtime ownership checks are terminal-clear
- **THEN** preflight accepts the queued changes
- **AND** the controller activates only the first dependency-valid slice.

#### Scenario: Unlisted active change exists
- **WHEN** OpenSpec reports an active change not named by a remaining `continue` slice
- **THEN** preflight identifies the unlisted change and exits non-zero
- **AND** no session or writer starts.

#### Scenario: Dormancy cannot be proven
- **WHEN** a listed change has an unreadable session status, unresolved writer lease, pending question, or unknown process liveness
- **THEN** preflight classifies dormancy as unknown and blocks
- **AND** it does not infer safety from Git cleanliness or transcript prose.

### Requirement: Each slice runs in a fresh grind root on the current runtime
The installed executor SHALL connect only to the launcher's current loopback OpenCode runtime, create one fresh parentless root for each slice attempt, enable grind in that root before its first command, invoke the canonical named propose and apply workflows for the declared change, and return one bounded structured result containing `completed`, `owner-required`, `paused`, `transient`, or `terminal` plus correlated session and evidence references. It SHALL NOT start a hidden nested OpenCode server or report lifecycle completion from model prose.

#### Scenario: Propose slice reaches controller verification
- **WHEN** an eligible `propose` slice starts against the current runtime
- **THEN** the executor creates a fresh grind-enabled root, invokes the canonical proposal workflow for the exact change and accepted outcome, then invokes the canonical apply workflow for that change
- **AND** `completed` only returns after the root is terminal-clear for deterministic controller verification.

#### Scenario: Continue slice uses a new root
- **WHEN** a later attempt continues an existing declared change
- **THEN** the executor creates a new grind-enabled root and invokes apply for that exact change
- **AND** it does not resume an owner-required or interrupted root from transcript context.

#### Scenario: Current runtime identity is unsafe
- **WHEN** the supplied runtime URL is non-loopback, missing, stale, or cannot prove the expected project directory and installed kit capabilities
- **THEN** the executor returns a terminal or paused structured result before session creation
- **AND** it does not start a replacement server.

### Requirement: Interactive mission control exposes live work and emergency stop
The installed launcher SHALL provide run, resume, status, and stop slash commands that accept only a safe mission id and derive fixed project-contained paths and kit-owned argv. Before interactive run or resume starts mutation, it SHALL open the existing shared PTY cockpit and create one named controller PTY in that same manager. Every PTY created by a slice root SHALL appear in that cockpit, and every non-PTY child process owned by the mission SHALL stream prefixed stdout and stderr into the controller PTY while preserving full bounded diagnostics in evidence. The launcher SHALL NOT implement scheduling, create a second dashboard, or execute arbitrary user argv.

#### Scenario: Operator launches a visible mission
- **WHEN** the operator runs the mission command for a valid safe id in a supported interactive runtime
- **THEN** the existing PTY cockpit opens before the controller starts and lists the named controller PTY
- **AND** later slice PTYs and controller child streams remain observable without polling the model.

#### Scenario: Cockpit cannot be established
- **WHEN** interactive cockpit opening fails or the shared manager identity is unavailable
- **THEN** run or resume exits without launching the controller
- **AND** status reports the visibility prerequisite failure.

#### Scenario: Operator requests graceful stop
- **WHEN** the operator invokes the stop command for the running mission
- **THEN** the launcher sends one correlated stop request and the controller stops before another slice begins
- **AND** it records `paused` only after the active writer is terminal or isolated.

#### Scenario: Operator uses emergency cockpit kill
- **WHEN** the operator kills the controller PTY from the cockpit before a graceful terminal transition is durable
- **THEN** the next status or resume reconciliation reports `paused-unknown` with the last active operation and liveness evidence
- **AND** no new writer starts until prior mutation authority is proven terminal or isolated.

### Requirement: Owner-required and interrupted roots do not remain live
When a slice reaches an owner-only decision, protected boundary, pending question that cannot be answered within accepted authority, explicit stop, runtime loss, or executor interruption, the mission SHALL persist the exact handoff and stop the campaign. Owner-required handling SHALL close the executor's active ownership and leave no live question wait; a later authorized resume SHALL use a fresh root. Mid-slice crash, hard kill, and unknown child liveness SHALL remain fail-closed until reconciliation proves terminal cessation or isolation.

#### Scenario: Question requires owner authority
- **WHEN** the completion guard classifies a pending question as owner-required
- **THEN** the executor persists the bounded question handoff, ends the active slice ownership, and returns `owner-required`
- **AND** the controller does not continue the campaign or retain a server wait for a future answer.

#### Scenario: Runtime disappears during a slice
- **WHEN** the current OpenCode runtime becomes unavailable while a mutation-capable root may still own work
- **THEN** the controller records the interruption and leaves the mission paused with liveness unknown
- **AND** resume cannot create a fresh root until runtime and writer reconciliation is green.

### Requirement: Installed runtime proof covers the operator path
The kit SHALL maintain a disposable project-neutral proof runner that exercises the installed slash launcher, shared PTY cockpit, same-runtime grind executor, mission controller, OpenSpec lifecycle, checkpoint, interruption, and evaluator paths without remote or protected effects. The raw bundle SHALL distinguish Product Candidate, Proof Runner, Evaluator, Environment Identity, controller and root session references, PTY inventory, exact invocations, stdout/stderr, state transitions, repository effects, cleanup, and terminal verdicts.

#### Scenario: Visible two-slice mission completes
- **WHEN** a separately authorized bounded configured-provider proof launches a disposable two-slice mission through the installed slash command
- **THEN** the cockpit evidence contains the controller and any slice PTYs, both changes pass propose/apply/archive/local-commit readback, and the evaluator reaches terminal complete
- **AND** the proof makes no target-project or remote-readiness claim.

#### Scenario: Preserved interruption corpus is replayed
- **WHEN** a proof captures hard kill, mid-slice runtime loss, owner-required question, unlisted active change, or local blocker evidence
- **THEN** the evaluator and non-side-effecting finalization chain can replay the preserved bundle without another provider or live attempt
- **AND** another high-cost attempt remains blocked until that replay is green or identifies the exact missing raw observation.

### Requirement: Every synchronous mission command has a finite timeout
Every synchronous child process invoked by roadmap preflight, checkpoint, Git/OpenSpec inspection, validation, or finalization SHALL receive an explicit finite timeout from a reviewed command class. Defaults SHALL be 30 seconds for read-only inspection, 120 seconds for Git mutation and OpenSpec operations, and 600 seconds for project validation/finalization. A project adapter MAY set validation/finalization from 1 second through 1800 seconds. No production caller SHALL pass an undefined or infinite timeout. Timeout SHALL terminate only the owned process tree, preserve argv identity, signal/status, bounded stdout/stderr, original timeout cause, and cleanup state, then pause or block the affected mission without retrying an unchanged command automatically.

#### Scenario: Git inspection hangs
- **WHEN** a Git inspection fixture exceeds its command-class timeout
- **THEN** the owned process tree is terminal before the controller returns
- **AND** the mission records a timeout failure without advancing state

#### Scenario: Validation needs a longer bound
- **WHEN** an adapter declares a valid validation timeout within the supported maximum
- **THEN** the controller applies that explicit value
- **AND** all other command classes retain their reviewed defaults

#### Scenario: Timeout cleanup is unknown
- **WHEN** the runner cannot prove the timed-out process tree is terminal
- **THEN** writer ownership remains blocked
- **AND** no checkpoint, retry, proof, or qualification proceeds
