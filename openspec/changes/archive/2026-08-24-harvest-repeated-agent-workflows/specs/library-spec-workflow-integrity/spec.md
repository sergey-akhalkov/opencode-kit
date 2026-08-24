## MODIFIED Requirements

### Requirement: Task completion is evidence-bound
An OpenSpec implementation task SHALL remain unchecked until its stated observable result and applicable focused validation have run successfully, or an exact reasoned manual or external gate is recorded. Source edits, code inspection, compilation alone, an agent completion statement, workflow reflection, or optional improvement evidence SHALL NOT satisfy a task whose acceptance requires runtime behavior.

On failed proof or validation, apply SHALL preserve the command, exit status, relevant stdout/stderr and diagnostics, leave the task unchecked, and continue autonomous diagnosis when locally resolvable. Apply SHALL select the smallest dependency-valid next slice that reaches the earliest safe real boundary. Several valid batch sizes, reviewer choices, or cycle lengths SHALL NOT by themselves create an owner question.

A proposal-declared required automation dividend SHALL be represented by exactly one `[automation-dividend]` task. Apply SHALL validate its recurrence source and `reuse`, `extend`, or `build-minimal` disposition, place it before its first remaining current consumer, and require candidate-correlated real-entrypoint evidence. The dividend task SHALL NOT satisfy or replace product behavior, proof, safety, validation, cleanup, or qualification tasks.

#### Scenario: Edit without proof remains incomplete
- **WHEN** apply changes requested files but has not run the task's required observable proof
- **THEN** the task remains unchecked
- **AND** the session reports the missing proof rather than archive readiness.

#### Scenario: Successful task evidence permits completion
- **WHEN** the task's observable result and applicable focused validation pass on the current candidate
- **THEN** apply records the evidence reference and checks the task
- **AND** it may continue to the next unblocked task without a routine user question.

#### Scenario: Optional process observation does not become scope
- **WHEN** implementation reveals a workflow improvement that is neither the proposal-declared dividend nor required by the accepted outcome or a non-deferrable invariant
- **THEN** apply leaves current task scope unchanged
- **AND** may route the observation to explicit feedback or a separate proposal.

#### Scenario: Required dividend precedes its consumer
- **WHEN** attributable evidence confirms the declared repeated sequence and a remaining accepted task will next consume it
- **THEN** apply completes and proves the `[automation-dividend]` task before that consumer
- **AND** records only the selected dividend as additional current scope.

#### Scenario: Apply chooses the next accepted slice
- **WHEN** several pending task ranges are valid and differ only in implementation batch size or optional review timing
- **THEN** apply starts the smallest dependency-valid slice that reaches the earliest safe real boundary
- **AND** it continues after that slice's proof and validation without asking the owner to choose a batch.

#### Scenario: Explicitly bounded apply request stops at its limit
- **WHEN** the user requested only one named task or task range from the active change
- **THEN** apply completes and reports that bounded request
- **AND** it does not infer authority to continue through the rest of the change.

#### Scenario: Continuation carries pending improvements
- **WHEN** an apply session receives still-valid `Pending Improvement Tasks` and `Deferred Improvement Candidates`
- **THEN** it persists every record in the correct owning artifact before substantial implementation work
- **AND** only admitted task entries become unchecked completion scope.

#### Scenario: Improvement precedes first consumer
- **WHEN** an admitted improvement names current task 4.2 as its first consumer and its prerequisites are satisfied
- **THEN** apply implements and proves that improvement before starting task 4.2
- **AND** later task-list position does not postpone it.

#### Scenario: Repository multiplier does not expand consumer scope
- **WHEN** the current change proves a shared owner also named by another active change or repository workflow
- **THEN** apply completes the shared implementation needed by the current consumer
- **AND** leaves mutation of the additional consumer to its own owning path.

### Requirement: Complete archive fails closed
The normal OpenSpec archive path SHALL refuse to archive a change as complete when required artifacts are incomplete, accepted product tasks remain unchecked, delta specs require synchronization, applicable validation evidence is absent or red, or a proposal-declared required automation dividend lacks one checked candidate-correlated task and current evidence row. A confirmation prompt SHALL NOT waive these completion conditions. Optional workflow reflections, deferred ideas, absent final-history analysis, and uncreated process-improvement tasks outside the one declared dividend SHALL NOT block complete archive.

The kit MAY preserve intentionally incomplete work through a distinct abandoned or incomplete disposition. That disposition SHALL retain the reason and residual state, SHALL NOT claim all artifacts or tasks are complete, and SHALL NOT synchronize undelivered requirements into main specs.

#### Scenario: Unchecked accepted task blocks complete archive
- **WHEN** normal archive is requested for a change with an unchecked accepted product task
- **THEN** the operation exits non-zero without moving the change into a complete archive
- **AND** the diagnostic identifies the unchecked count.

#### Scenario: No retrospective exists
- **WHEN** accepted tasks and artifacts are complete, validation is green, an exempt proposal or completed required dividend is current, and no final-history retrospective was created
- **THEN** complete archive remains available
- **AND** no confirmation or additional process-improvement record is required.

#### Scenario: Unchecked task blocks complete archive
- **WHEN** normal archive is requested for a change with an unchecked task
- **THEN** the operation exits non-zero without moving the change into a complete archive
- **AND** the diagnostic identifies the unchecked count.

#### Scenario: Required dividend evidence is missing
- **WHEN** a proposal declares the dividend required but its tagged task, checkbox, task digest, helper identity, consumer invocation, or evidence-index row is missing or stale
- **THEN** complete archive exits non-zero without moving the change
- **AND** reports the exact dividend fact that is incomplete.

#### Scenario: Exempt change has no automation task
- **WHEN** a proposal contains a valid concrete automation exemption and every accepted product gate is green
- **THEN** complete archive does not require an automation task or evidence row
- **AND** preserves the recorded exemption in the archived proposal.

#### Scenario: Unpersisted admitted improvement blocks archive
- **WHEN** current continuation evidence contains an admitted improvement not yet represented in the active `tasks.md`
- **THEN** the archive path does not invoke complete archive
- **AND** it persists the owned improvement as an unchecked task or reports the exact owner/target blocker.

#### Scenario: Incomplete work is preserved honestly
- **WHEN** the owner explicitly chooses the supported incomplete-preservation disposition
- **THEN** the retained change is labeled incomplete or abandoned with its reason
- **AND** no output claims implementation or spec synchronization completed.

### Requirement: Operation gates run on the operation path
Every repository-shipped propose, apply, and complete-archive entrypoint SHALL invoke its matching deterministic operation check. A registry operation without a shipped caller SHALL NOT be described as integrated. Failed, blocked, or unknown safety/completion checks SHALL stop the affected operation; warnings SHALL remain non-blocking only when they cannot represent false completion or a non-deferrable risk.

Checks SHALL report only explicit facts available from their inputs and SHALL return `unknown` for unsupported evidence rather than inferring semantic quality. Propose SHALL validate the automation-dividend declaration shape. Apply and archive SHALL correlate a required declaration with exactly one tagged task and its available evidence state; complete archive SHALL require the current checked task and candidate-correlated evidence. No gate SHALL infer Material profile, recurrence, helper value, or exemption validity from unstructured prose.

#### Scenario: Apply executes its gate before mutation
- **WHEN** an apply entrypoint is invoked for a change
- **THEN** its apply gate runs before implementation mutation
- **AND** a missing required artifact blocks the apply loop.

#### Scenario: Archive gate observes checklist state
- **WHEN** archive checks a change with incomplete tasks
- **THEN** the gate reports a blocking failure
- **AND** the archive caller does not downgrade it to a confirmation-only warning.

#### Scenario: Propose gate sees a malformed dividend declaration
- **WHEN** proposal readiness is checked with a missing, duplicate, or unsupported automation-dividend declaration
- **THEN** the gate returns non-zero and identifies the declaration source
- **AND** does not select required or exempt on the author's behalf.

#### Scenario: Archive gate correlates required dividend evidence
- **WHEN** archive checks a required dividend task against the current task digest, helper identity, candidate, and evidence-index row
- **THEN** it passes only when every explicit correlation fact matches and the result is green
- **AND** leaves semantic usefulness and accepted product correctness to their owning reviewed declaration and product gates.
