## Purpose

Defines durable autonomous work campaigns that discover bounded in-scope work,
freeze traceable execution waves, delegate mutations to the existing roadmap mission,
recover after interruption, and prove aggregate closure without using transcript or
report prose as lifecycle authority.

## ADDED Requirements

### Requirement: Campaign definitions are explicit, versioned, and bounded
The kit SHALL accept an autonomous work campaign only from a versioned project-
contained definition that declares a safe campaign id, accepted outcome, scope roots
and exclusions, playbook id, evidence and report paths, aggregate validation argv,
checkpoint policy, allowed effect classes and authorization references, finite model-
call/wall-clock/evidence-byte/wave budgets, host-resume policy, and terminal stop
policy. The current increment SHALL accept exactly the `audit-remediate` playbook and
SHALL reject an unknown playbook before a session, provider call, or mutation.

The accepted outcome, scope, exclusions, playbook, effect authority, and protected-
decision boundary SHALL remain immutable for one campaign identity. Attempt, time,
evidence, and wave budgets are revisable process controls, but raising them SHALL NOT
add effect authority, change accepted semantics, or convert a protected boundary into
an autonomous action.

#### Scenario: Valid audit-remediation campaign is accepted
- **WHEN** a contained definition supplies every required field, a canonical single Git worktree, finite supported budgets, and the `audit-remediate` playbook
- **THEN** provider-free preflight returns the normalized campaign digest and first `inventory` phase
- **AND** it performs no provider call, source mutation, OpenSpec proposal, or host installation.

#### Scenario: Campaign requests an unsupported playbook
- **WHEN** a definition names a playbook other than `audit-remediate`
- **THEN** preflight rejects the definition with the unsupported playbook id
- **AND** it does not infer phase behavior from free-form outcome or roadmap text.

#### Scenario: Process budget is revised
- **WHEN** a paused campaign receives a valid larger finite attempt, time, evidence, or wave budget while outcome, scope, effects, and protected boundaries remain unchanged
- **THEN** resume records the revised process-control digest and may continue from the current safe phase
- **AND** the revision grants no new source, provider, checkpoint, protected, remote, or destructive authority.

### Requirement: Campaign preflight fails closed before semantic work or mutation
Campaign preflight SHALL verify the definition and path containment, canonical Git
root and checkpoint identity, worktree and active-change ownership, selected global
workflow and installed runtime identity, complete project validation argv, campaign
and mission writer liveness, evidence/report create-new or current correlated state,
configured provider and cost authority when inference is required, supported
checkpoint behavior, and every host-resume prerequisite selected by the definition.
Missing, stale, contradictory, unreadable, ambiguous, or unsupported evidence SHALL
be `unknown` and blocking for the affected phase.

The first increment SHALL require a clean target worktree with no active OpenSpec
change except exact changes already owned and checkpointed by the same resumed
campaign. This kit checkout SHALL remain outside campaign execution while
`add-foundation-integrity-autorecovery`, unattributed workstation edits, or another
overlapping active change remains.

#### Scenario: Target has an unrelated active change
- **WHEN** OpenSpec reports an active change that is not an exact campaign-owned resumed wave member
- **THEN** campaign preflight identifies the active change and exits before inventory or model work
- **AND** it does not adopt, edit, archive, or infer non-dependence for that change.

#### Scenario: Configured inference authority is unavailable after restart
- **WHEN** the next phase requires a provider call but current non-interactive runtime evidence cannot prove the configured route and cost authority
- **THEN** the campaign enters `paused-external` with the exact missing prerequisite
- **AND** host recovery does not retry provider calls until a later preflight proves the prerequisite.

### Requirement: Campaign transitions are append-only and reconstruction-safe
The campaign SHALL persist an immutable transition record before atomically replacing
its current projection for every preflight, phase start/completion, partition launch/
completion, findings freeze, investigation result, wave admission, mission launch/
terminal result, checkpoint, verification, re-review, report materialization, pause,
owner-required state, and terminal completion. Each record SHALL correlate the
definition digest, prior transition and state digests, sequence, campaign/phase/wave
ids, candidate and environment identities, process/session/mission references,
budget consumption, writer status, and evidence references.

Restart reconstruction SHALL replay the immutable chain rather than infer the cursor
from transcript, task checkboxes, report Markdown, model prose, process exit alone, or
the presence of generated files. A missing/corrupt record, stale projection, unknown
process or writer, or changed definition digest SHALL remain fail-closed.

#### Scenario: Controller stops after wave mission completion
- **WHEN** the child mission reaches a durable terminal result and the campaign process exits before recording verification start
- **THEN** reconstruction consumes the existing correlated mission result exactly once and resumes at verification
- **AND** it does not launch, archive, checkpoint, or charge the completed wave again.

#### Scenario: Projection does not match the transition chain
- **WHEN** the current projection digest or prior transition link differs from durable transition records
- **THEN** resume reports state integrity `unknown` and starts no semantic root or source writer
- **AND** repair requires deterministic replay or an explicit preserved-state recovery, not transcript inference.

### Requirement: Inventory and discovery prove scoped coverage without source mutation
The `audit-remediate` playbook SHALL create a deterministic inventory snapshot for the
declared candidate and partition every included ordinary file or explicit logical
block into stable ids with source digests, kind, maintained/generated/vendor/evidence
classification, exclusion reason, and review status. Unreadable, unsupported, or
partially indexed regions SHALL remain explicit coverage rows and SHALL NOT be omitted
from totals or represented as reviewed.

Discovery MAY use bounded concurrent fresh roots only when each root is read-only for
the project source, receives exact non-overlapping partition ids, writes only its own
isolated create-new result path, and has terminal session/process ownership. Discovery
roots SHALL NOT use the mutation mission executor, issue terminal completion
certificates, dispatch children, edit OpenSpec/source, answer owner questions, or
share a mutable result file.

#### Scenario: Two independent partitions are reviewed concurrently
- **WHEN** two partitions have disjoint ids and isolated result paths and campaign policy permits read-only fan-out
- **THEN** two attributed read-only roots may review them concurrently
- **AND** campaign reconciliation begins only after both roots are terminal and both schema-valid results correlate to the inventory snapshot.

#### Scenario: A file cannot be read
- **WHEN** an included inventory path is unreadable or its required parser/index coverage is partial
- **THEN** the corresponding block remains `blocked` or `needs-direct-review` with the source and coverage evidence
- **AND** campaign coverage cannot reach complete by dropping the path or relying on an aggregate reviewed count.

### Requirement: Work items have explicit evidence, severity, and confirmation
Each discovered candidate work item SHALL have a stable id, source block and candidate
digests, principle/rubric reference, current reachable scenario, evidence references,
impact, likely cause or `unknown`, proposed outcome, affected/owned paths, required
effect classes, confidence, initial severity, producer session reference, and status.
A separate fresh reconciliation root SHALL inspect each candidate against current
source and evidence and return `confirmed | falsified | duplicate | unknown` plus the
strongest supported severity `P0 | P1 | P2 | P3 | unknown`.

`P0` SHALL require a confirmed reachable critical or non-deferrable correctness,
safety, authorization, privacy, data-integrity, irreversible-action, financial/legal,
or mission-critical consequence. `P1` SHALL require a confirmed current issue with a
named present change axis, reachable consequence, evidence-backed material impact to
the accepted outcome or current architecture/maintainability/testability/reliability,
and a correction inside campaign scope. Style preference, optional module polish,
hypothetical extensibility, coverage percentage alone, and unrelated debt SHALL be
`P2`, `P3`, or falsified rather than P1.

Only confirmed P0/P1 items MAY enter remediation. Confirmed P2/P3 items SHALL remain
report-only. Deterministic helpers MAY validate fields, refs, digests, enums, and
traceability but SHALL NOT infer scenario reachability, severity, confidence,
materiality, cause, grouping, or confirmation.

#### Scenario: Material mixed-responsibility defect is confirmed P1
- **WHEN** current evidence shows an existing mixed owner now blocks a required change, causes a reachable material correctness/testability risk, and has one bounded in-scope correction
- **THEN** reconciliation may confirm the work item as P1 with the named change axis and impact evidence
- **AND** admission does not rely on file length, reviewer preference, or future extensibility alone.

#### Scenario: Optional architecture polish is discovered
- **WHEN** the current behavior and required change remain correct and locally testable and the observation only prefers another split, abstraction, naming scheme, or future test
- **THEN** reconciliation does not confirm the item as P0/P1
- **AND** no remediation change, mission slice, task, or completion blocker is created from it.

#### Scenario: P2 or P3 finding is retained
- **WHEN** reconciliation confirms a real but non-material P2/P3 observation
- **THEN** the item appears in the current report with evidence and disposition `report-only`
- **AND** it is excluded from every remediation wave and aggregate unresolved-P0/P1 count.

### Requirement: Credible unknown P0/P1 hypotheses receive bounded investigation
A candidate whose current evidence supports a credible P0/P1 consequence but cannot
establish severity, reachability, cause, or correction SHALL remain `unknown-material`
and SHALL NOT be downgraded, admitted to a mutation wave, or ignored. The campaign
SHALL create one bounded read-only investigation assignment with an exact falsifiable
question, allowed observations, time/model budget, source partitions, and terminal
output `confirmed | falsified | still-unknown | owner-required`.

Investigation SHALL use the read-only semantic-root boundary rather than add a new
roadmap mission operation. `still-unknown` consumes the declared investigation budget
and leaves only that item blocking campaign completion; it does not authorize repeated
unchanged investigation or source mutation.

#### Scenario: Unknown P1 cause can be falsified locally
- **WHEN** reconciliation identifies a credible material failure but current evidence cannot distinguish two local causes
- **THEN** one investigation root runs the smallest safe discriminating observation and records its result
- **AND** only a confirmed current cause may proceed to wave synthesis.

#### Scenario: Investigation remains unknown at budget exhaustion
- **WHEN** the bounded investigation reaches its finite budget without confirmation or falsification
- **THEN** the item remains `unknown-material` and the campaign pauses with its exact evidence gap
- **AND** it is not relabeled P2/P3 and terminal completion is not emitted.

### Requirement: Remediation waves are frozen, traceable, and effect-bounded
After every inventory block and candidate work item is terminally dispositioned, a
fresh synthesis root MAY group only confirmed unresolved P0/P1 items into one ordered
wave of between one and 100 proposed OpenSpec changes. Each proposed slice SHALL name
one bounded accepted outcome, exact work-item refs, dependency ids, owned paths,
effect classes, expected proof, and validation boundary. Grouping SHALL follow current
cohesive ownership and shared proof; unrelated outcomes SHALL remain separate.

The deterministic admission gate SHALL verify complete P0/P1 assignment, no P2/P3 or
unknown item, exact refs and digests, acyclic unique order, non-overlapping or declared
serial ownership, supported effect authority, no unlisted active change, and a mission
definition whose slices match the admitted wave. The gate SHALL persist the frozen
wave and mission digests before execution. A later model response SHALL NOT add,
remove, reorder, regroup, or mutate that frozen wave.

#### Scenario: All confirmed P0/P1 items fit one wave
- **WHEN** synthesis produces an acyclic wave whose slices each trace to current confirmed P0/P1 items and declared owned paths/effects
- **THEN** admission freezes the wave and one matching mission definition
- **AND** the campaign proceeds without asking the owner to approve planning controls.

#### Scenario: Wave contains a P2 item
- **WHEN** a proposed slice references a P2/P3, falsified, duplicate, or unknown item
- **THEN** admission rejects the entire wave before mission launch
- **AND** the item retains its prior disposition and no source writer starts.

#### Scenario: Confirmed item needs a protected effect
- **WHEN** a confirmed P0/P1 correction requires an effect or owner decision absent from current campaign authority
- **THEN** the item becomes `owner-required` with the exact decision/effect and no admitted mutation slice
- **AND** unrelated authorized P0/P1 items may be frozen in a separate wave without clearing that blocker.

### Requirement: The roadmap mission remains the sole frozen-wave source writer
For an admitted wave, the campaign SHALL invoke the existing roadmap mission with the
exact frozen definition and SHALL derive wave progress only from correlated mission
state, OpenSpec readback, checkpoints, and terminal evidence. The campaign controller,
semantic roots, report materializer, host supervisor, and tray SHALL NOT edit project
source, tests, OpenSpec change content, mission state, or checkpoints while the child
mission writer owns the wave.

The campaign MAY persist parent observation transitions and bounded diagnostics in a
separate non-overlapping runtime tree while a mission is active. It SHALL NOT hold or
acquire project source-mutation authority concurrently. Unknown mission writer,
cleanup, session, process, checkpoint, or terminal state SHALL block verification,
retry, replacement, and next-wave admission.

#### Scenario: Mission executes a frozen wave
- **WHEN** admission is durable, campaign and mission digests correlate, and no prior writer is live
- **THEN** the existing mission serially proposes, applies, validates, archives, and checkpoints the wave slices
- **AND** no other campaign component mutates the target worktree during that ownership interval.

#### Scenario: Mission liveness is unknown after interruption
- **WHEN** runtime loss leaves a mutation-capable mission/session/process without terminal or isolated ownership evidence
- **THEN** the campaign records `paused-unknown` and starts no replacement mission, semantic writer, verification, or report completion
- **AND** host restart does not clear the state from process absence or elapsed time alone.

### Requirement: Verification reopens changed coverage and converges by evidence
After each completed/checkpointed wave, the campaign SHALL run aggregate project
validation and the declared real-boundary proofs for the affected outcomes, compare
the current candidate with the inventory baseline, mark every changed or materially
impacted block `needs-rereview`, and execute read-only re-review before closing the
wave. A fixed test count, green aggregate command, checked task list, or model summary
SHALL NOT substitute for changed-block and finding closure.

Newly confirmed P0/P1 items discovered during re-review SHALL enter a new unfrozen
wave under the same admission rules. Repeated items SHALL retain stable identities and
current status rather than creating duplicate work. P2/P3 remain report-only. A P0
whose accepted consequence triggers critical SDET under the active Change-Ready
contract SHALL receive fresh test-only critical evidence after current proof and
accepted-scope completion before the affected wave closes.

#### Scenario: Fix changes a previously reviewed block
- **WHEN** a completed wave changes a source block whose prior review digest differs from the current candidate
- **THEN** the block becomes `needs-rereview` and wave closure waits for a current read-only verdict
- **AND** its old `reviewed-no-finding` state cannot satisfy current campaign coverage.

#### Scenario: Re-review finds another P1
- **WHEN** current changed-block review confirms a new material P1 inside the original scope
- **THEN** the campaign returns to synthesis and may admit a new wave after the current checkpoint
- **AND** completion is not inferred from the prior wave's green validation.

### Requirement: Terminal completion requires aggregate closure and fresh challenge
The campaign SHALL emit terminal `complete` only when the current definition and
candidate digests match; every included inventory block has a current terminal review
status; no block is unreviewed, blocked, or `needs-rereview`; every work item is
falsified, duplicate, fixed-and-verified, report-only P2/P3, or explicitly outside an
unreachable non-material path; unresolved/unknown/owner-required P0/P1 count is zero;
every admitted wave is archived and checkpointed; aggregate validation and required
real-boundary proof are green; all semantic/writer/process ownership is terminal; and
one fresh read-only evidence-sufficiency challenge has no unresolved row capable of
invalidating the maximum campaign claim.

No bounded audit can claim undiscovered defects are impossible. Terminal output SHALL
state the exercised scope, rubric, environment, coverage, excluded paths, P0/P1
closure, P2/P3 report-only rows, limitations, and maximum supported claim.

#### Scenario: All declared closure facts are current
- **WHEN** every closure predicate is current for one candidate and the fresh challenge has no unresolved claim-invalidating row
- **THEN** the campaign records one terminal `complete` transition and final checkpoint identity
- **AND** neither the model nor supervisor generates another campaign or optional-polish wave.

#### Scenario: One owner-required P1 remains
- **WHEN** all other work is verified but one P1 needs a protected product decision
- **THEN** terminal state is `owner-required`, not `complete`
- **AND** the handoff preserves completed waves and names the exact decision and safe resume condition.

### Requirement: Human reports are deterministic views of current ledger state
The campaign SHALL materialize its audit/work report from schema-valid current
inventory, work-item, wave, validation, challenge, and closure records in stable order.
The report SHALL include scope and exclusions, block coverage, P0-P3 findings and
dispositions, remediation/change traceability, test and failure-mode gaps, wave and
checkpoint history, validation/proof evidence, blockers, limitations, and final claim
ceiling. A report write SHALL read back to the same source digests and totals before it
can be referenced by a completion transition.

Manual edits, stale resolution paragraphs, transcript summaries, or generated prose
SHALL NOT change campaign status. Regeneration SHALL replace the derived report while
preserving immutable source records and prior report evidence when retained.

#### Scenario: Finding status changes after remediation
- **WHEN** a P1 moves from confirmed to fixed-and-verified in current ledger records
- **THEN** report regeneration shows the new status and matching wave/evidence refs in every derived section
- **AND** no stale residual-risk or backlog row continues to represent it as unresolved.

#### Scenario: Report totals do not match the ledger
- **WHEN** report readback differs from current block, severity, disposition, wave, or closure totals
- **THEN** materialization exits non-zero and campaign completion remains blocked
- **AND** no semantic inference is used to choose which representation is correct.

### Requirement: Recovery and budgets stop safely without false completion
The campaign SHALL classify interruption and failure as transient provider/runtime,
locally correctable, immutable input/state, budget exhausted, owner/protected,
explicit stop, or unknown ownership. It SHALL apply finite configured retries and
causally distinct strategy requirements, persist budget consumption and next eligible
retry, and never repeat an unchanged governed attempt while its live-attempt gate is
blocked or unknown.

Explicit stop SHALL prevent another phase/wave launch and become durable only after
active semantic roots and mutation writers are terminal or isolated. Budget
exhaustion SHALL produce resumable `paused-budget` with remaining work and evidence;
it SHALL NOT narrow scope, downgrade findings, skip verification, or emit completion.

#### Scenario: Transient provider failure remains within budget
- **WHEN** a semantic root returns a classified transient provider failure and no writer/effect state is unknown
- **THEN** the controller records the failed attempt and schedules bounded persisted backoff
- **AND** a later retry uses the same immutable assignment or a recorded causally distinct correction.

#### Scenario: Campaign reaches its wall-clock budget
- **WHEN** current elapsed campaign time reaches the configured finite budget before closure
- **THEN** the campaign records `paused-budget` with current phase, open work items, consumed budgets, and resume condition
- **AND** host supervision does not treat the pause as a crash or automatically raise the budget.
