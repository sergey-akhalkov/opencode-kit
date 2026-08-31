## ADDED Requirements

### Requirement: Campaigns SHALL drain authorized independent work before product-decision handoff
When one campaign item or proposed slice is blocked by a product decision, protected effect, external prerequisite, technical condition, or other scoped gate, the campaign SHALL admit and execute every confirmed authorized dependency-valid non-overlapping sibling permitted by the immutable campaign definition before entering terminal product-decision state. Blocked items SHALL retain their identity, evidence, severity, gate, and resume condition, and sibling success SHALL NOT remove them from aggregate closure.

#### Scenario: Owner-required item has an authorized sibling wave
- **WHEN** one confirmed item needs a material product decision and another confirmed item is independent, authorized, and safe to freeze in a separate wave
- **THEN** the campaign freezes and executes the authorized sibling wave before terminal product-decision handoff
- **AND** preserves the owner-required item as unresolved after sibling verification.

#### Scenario: Only non-product prerequisites remain
- **WHEN** every remaining campaign item is blocked by external, technical, access, capability, safety, writer-liveness, or budget state and no product decision is required
- **THEN** the campaign enters the matching resumable paused or waiting state
- **AND** does not report owner-required, complete, or a weakened closure claim.

#### Scenario: No independent item remains before product handoff
- **WHEN** all eligible sibling waves are verified or absent and one unresolved confirmed item still requires a material product decision
- **THEN** terminal state is product-decision-required with the exact item, decision, evidence, and resume condition
- **AND** completed waves and checkpoints remain durable and are not repeated after resume.

## MODIFIED Requirements

### Requirement: Campaign transitions are append-only and reconstruction-safe
The campaign SHALL persist an immutable transition record before atomically replacing
its current projection for every preflight, phase start/completion, partition launch/
completion, findings freeze, investigation result, wave admission, mission launch/
terminal result, checkpoint, verification, re-review, report materialization, waiting,
pause, product-decision-required state, and terminal completion. Each record SHALL
correlate the definition digest, prior transition and state digests, sequence, campaign/
phase/wave ids, candidate and environment identities, process/session/mission references,
budget consumption, writer status, frontier/gate refs, and evidence references.

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

### Requirement: Credible unknown P0/P1 hypotheses receive bounded investigation
A candidate whose current evidence supports a credible P0/P1 consequence but cannot
establish severity, reachability, cause, or correction SHALL remain `unknown-material`
and SHALL NOT be downgraded, admitted to a mutation wave, or ignored. The campaign
SHALL create one bounded read-only investigation assignment with an exact falsifiable
question, allowed observations, time/model budget, source partitions, and terminal
output `confirmed | falsified | still-unknown | product-decision-required | waiting`.

Investigation SHALL use the read-only semantic-root boundary rather than add a new
roadmap mission operation. `still-unknown` or `waiting` consumes the declared
investigation budget and leaves only that item unresolved; it does not authorize
repeated unchanged investigation, source mutation, or a product question. A
`product-decision-required` result SHALL identify one material product decision and
cannot become terminal while another confirmed authorized item remains eligible.

#### Scenario: Unknown P1 cause can be falsified locally
- **WHEN** reconciliation identifies a credible material failure but current evidence cannot distinguish two local causes
- **THEN** one investigation root runs the smallest safe discriminating observation and records its result
- **AND** only a confirmed current cause may proceed to wave synthesis.

#### Scenario: Investigation remains unknown at budget exhaustion
- **WHEN** the bounded investigation reaches its finite budget without confirmation or falsification
- **THEN** the item remains `unknown-material` and the campaign pauses with its exact evidence gap
- **AND** it is not relabeled P2/P3, product-decision-required, or complete.

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
remove, reorder, regroup, or mutate that frozen wave. A blocked item SHALL remain
outside an admitted wave while every confirmed authorized dependency-valid sibling
permitted by the immutable campaign definition is admitted before terminal product
decision handoff.

#### Scenario: All confirmed P0/P1 items fit one wave
- **WHEN** synthesis produces an acyclic wave whose slices each trace to current confirmed P0/P1 items and declared owned paths/effects
- **THEN** admission freezes the wave and one matching mission definition
- **AND** the campaign proceeds without asking the owner to approve planning controls.

#### Scenario: Wave contains a P2 item
- **WHEN** a proposed slice references a P2/P3, falsified, duplicate, or unknown item
- **THEN** admission rejects the entire wave before mission launch
- **AND** the item retains its prior disposition and no source writer starts.

#### Scenario: Confirmed item needs a protected effect
- **WHEN** a confirmed P0/P1 correction requires an effect absent from current campaign authority
- **THEN** the item remains unresolved with the exact scoped protected gate and no admitted mutation slice
- **AND** every unrelated authorized dependency-valid P0/P1 item SHALL be frozen and executed in a separate wave without clearing that gate.

#### Scenario: Confirmed item needs a material product decision
- **WHEN** a confirmed P0/P1 correction depends on one exact material product decision with no accepted reversible default
- **THEN** the campaign parks that decision and admits no decision-dependent mutation slice
- **AND** it reaches `product-decision-required` only after every eligible independent sibling wave is verified or absent.

### Requirement: Terminal completion requires aggregate closure and fresh challenge
The campaign SHALL emit terminal `complete` only when the current definition and
candidate digests match; every included inventory block has a current terminal review
status; no block is unreviewed, blocked, or `needs-rereview`; every work item is
falsified, duplicate, fixed-and-verified, report-only P2/P3, or explicitly outside an
unreachable non-material path; unresolved/unknown/product-decision-required/waiting
P0/P1 count is zero; every admitted wave is archived and checkpointed; aggregate
validation and required real-boundary proof are green; all semantic/writer/process
ownership is terminal; and one fresh read-only evidence-sufficiency challenge has no
unresolved row capable of invalidating the maximum campaign claim.

No bounded audit can claim undiscovered defects are impossible. Terminal output SHALL
state the exercised scope, rubric, environment, coverage, excluded paths, P0/P1
closure, P2/P3 report-only rows, limitations, and maximum supported claim.

#### Scenario: All declared closure facts are current
- **WHEN** every closure predicate is current for one candidate and the fresh challenge has no unresolved claim-invalidating row
- **THEN** the campaign records one terminal `complete` transition and final checkpoint identity
- **AND** neither the model nor supervisor generates another campaign or optional-polish wave.

#### Scenario: One owner-required P1 remains
- **WHEN** every independent authorized item is verified but one P1 still needs an exact material product decision
- **THEN** terminal state is `product-decision-required`, not `complete`
- **AND** the handoff preserves completed waves and names the exact decision and safe resume condition.

#### Scenario: One non-product-gated P1 remains
- **WHEN** every independent authorized item is verified but one P1 remains blocked by a protected, external, technical, capability, safety, writer-liveness, or budget gate
- **THEN** the campaign records the matching resumable waiting or paused state, not `product-decision-required` or `complete`
- **AND** the gate, evidence ceiling, completed waves, and resume condition remain durable.
