## MODIFIED Requirements

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

## ADDED Requirements

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
