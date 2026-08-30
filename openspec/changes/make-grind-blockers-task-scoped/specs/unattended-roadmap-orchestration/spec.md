## ADDED Requirements

### Requirement: Roadmap missions SHALL continue dependency-valid slices around scoped gates
The mission controller SHALL evaluate a blocked slice against the declared dependency graph and current effect authority. It SHALL preserve that slice and its exact gate while launching every later declared slice that is dependency-valid, ownership-safe, authorized, and independent of the gate. Terminal product-decision state SHALL require that no such slice remains. External, technical, safety, access, capability, live-attempt, and budget conditions SHALL use non-product paused or waiting dispositions.

#### Scenario: Protected slice has an authorized independent successor
- **WHEN** one declared slice requires an unavailable protected effect and a later slice has no dependency on it, owns non-overlapping paths, and is authorized
- **THEN** the controller preserves the protected slice and executes the independent successor
- **AND** sibling completion neither clears the protected gate nor completes the mission.

#### Scenario: Immutable order makes successor dependent
- **WHEN** a later slice depends on the blocked slice or cannot execute without overlapping unknown writer ownership
- **THEN** the controller does not reorder or launch that slice
- **AND** records the exact non-product waiting or product-decision state supported by current evidence.

#### Scenario: Owner product choice is globally terminal
- **WHEN** every remaining declared slice depends on one unresolved material product choice and no independent slice is eligible
- **THEN** the controller returns terminal product-decision-required with the affected slice refs and resume condition
- **AND** closes active executor ownership without simulating an answer.

## MODIFIED Requirements

### Requirement: Protected and unavailable outcomes stop cleanly
The controller SHALL stop before any slice whose required effect class, product decision, credential, remote system, external capability, live-attempt gate, writer ownership, or dependency is not currently satisfied. It SHALL persist the exact blocker, preserve prior completed slices, and SHALL NOT ask the completion arbiter to approve or simulate the missing boundary. The blocked slice SHALL remain incomplete while the controller launches every declared dependency-valid, ownership-safe, authorized slice outside that gate's dependency cone. Only an exact material product decision may become terminal after no independent slice remains; every non-product prerequisite SHALL produce a resumable paused, waiting, or external-blocked state only after the runnable mission frontier is empty.

#### Scenario: External blocker has an independent sibling
- **WHEN** one declared slice requires an unavailable external capability and another declared slice is dependency-valid, ownership-safe, authorized, and independent of that capability
- **THEN** the controller preserves the blocked slice and launches the independent sibling
- **AND** sibling completion neither clears the external gate nor completes the mission.

#### Scenario: Only external blocker remains
- **WHEN** all runnable independent slices are checkpointed and every incomplete slice requires one unavailable external capability
- **THEN** the mission reaches non-terminal `external-blocked` or `waiting` with the exact unblock condition
- **AND** it performs no attempt against that boundary and emits no product question.

#### Scenario: Only material product decision remains
- **WHEN** every incomplete declared slice depends on one exact unresolved material product decision and no independent slice is eligible
- **THEN** the mission reaches terminal `product-decision-required` with the affected slice refs, consequences, and resume condition
- **AND** it closes executor ownership without answering or simulating the decision.

### Requirement: Each slice runs in a fresh grind root on the current runtime
The installed executor SHALL connect only to the launcher's current loopback OpenCode runtime, create one fresh parentless root for each slice attempt, enable grind in that root before its first command, invoke the canonical named propose and apply workflows for the declared change, and return one bounded structured result containing `completed`, `product-decision-required`, `waiting`, `paused`, `transient`, or `terminal` plus correlated session, frontier, gate, and evidence references. It SHALL NOT start a hidden nested OpenCode server or report lifecycle completion from model prose.

#### Scenario: Propose slice reaches controller verification
- **WHEN** an eligible `propose` slice starts against the current runtime
- **THEN** the executor creates a fresh grind-enabled root, invokes the canonical proposal workflow for the exact change and accepted outcome, then invokes the canonical apply workflow for that change
- **AND** `completed` only returns after the root is terminal-clear for deterministic controller verification.

#### Scenario: Continue slice uses a new root
- **WHEN** a later authorized attempt continues an existing declared change after product-decision or waiting state is resolved
- **THEN** the executor creates a new grind-enabled root and invokes apply for that exact change
- **AND** it does not resume the prior quiescent or interrupted root from transcript context.

#### Scenario: Current runtime identity is unsafe
- **WHEN** the supplied runtime URL is non-loopback, missing, stale, or cannot prove the expected project directory and installed kit capabilities
- **THEN** the executor returns a terminal or waiting structured result before session creation
- **AND** it does not start a replacement server or convert the identity failure into a product question.

### Requirement: Owner-required and interrupted roots do not remain live
When a slice reaches an exact material product decision after every independent declared slice has drained, the mission SHALL persist the bounded product-decision handoff, close the executor's active ownership, and return `product-decision-required` with no live question wait; later authorized resume SHALL use a fresh root. When a slice reaches a protected boundary, unavailable capability, or another non-product gate, the executor SHALL close that slice root and return a scoped waiting result while the mission continues any independent eligible sibling. Explicit stop, runtime loss, mid-slice crash, hard kill, and unknown child liveness SHALL remain fail-closed until reconciliation proves terminal cessation or isolation.

#### Scenario: Question requires owner authority
- **WHEN** the completion guard classifies a pending question as `product_decision_required` and the mission frontier has no independent eligible slice
- **THEN** the executor persists the bounded product-decision handoff, ends active slice ownership, and returns `product-decision-required`
- **AND** the controller retains no server wait for a future answer and resumes later only through a fresh root.

#### Scenario: Non-product gate blocks one slice
- **WHEN** the completion guard returns `waiting` for one slice and another declared slice is dependency-valid, ownership-safe, and authorized
- **THEN** the executor closes the blocked slice root and the controller launches the independent slice
- **AND** the waiting gate remains unresolved with its exact resume condition.

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
- **WHEN** a proof captures hard kill, mid-slice runtime loss, product-decision question, non-product waiting gate, unlisted active change, or local blocker evidence
- **THEN** the evaluator and non-side-effecting finalization chain can replay the preserved bundle without another provider or live attempt
- **AND** another high-cost attempt remains blocked until that replay is green or identifies the exact missing raw observation.
