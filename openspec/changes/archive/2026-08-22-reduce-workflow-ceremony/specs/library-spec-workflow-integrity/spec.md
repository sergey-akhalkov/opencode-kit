## MODIFIED Requirements

### Requirement: Spec Capsule is injected at artifact generation
The kit SHALL provide portable OpenSpec context and per-artifact rules that require every behavior-changing current increment to identify `Outcome`, `Operating Envelope`, `Non-Goals`, `Non-Deferrable Invariants`, `Observable Proof`, `Material Residual Risks`, and `Stop Line` once in a change-level capsule or explicit project-native equivalent. Proposal, design, specs, and tasks SHALL consume that shared capsule and add only responsibility-specific deltas. The rules SHALL reject vague actionable placeholders and keep unreachable future behavior outside current acceptance.

#### Scenario: Proposal establishes the shared envelope
- **WHEN** OpenSpec resolves proposal instructions for a behavior-changing change
- **THEN** proposal authoring requires the complete current-increment capsule
- **AND** later artifact instructions reference that envelope rather than restating all seven fields.

#### Scenario: Task has no boundary delta
- **WHEN** an implementation task inherits the shared authorization, safeguards, cleanup, and evidence contract unchanged
- **THEN** the task states only its dependency, observable result, and focused validation
- **AND** omission of repeated unchanged fields is not an implementation-readiness failure.

#### Scenario: Proposal instructions expose current-increment constraints
- **WHEN** OpenSpec resolves proposal instructions for a repository using the kit rules
- **THEN** the returned context or rules contain the Spec Capsule field requirements
- **AND** they require the next useful working increment rather than exhaustive future design.

#### Scenario: Future behavior remains non-blocking
- **WHEN** a proposed capability includes future scale or compatibility behavior unreachable inside the enforced current envelope
- **THEN** the artifacts record that behavior as non-goal or future scope
- **AND** implementation readiness does not require resolving it.

### Requirement: Task completion is evidence-bound
An OpenSpec implementation task SHALL remain unchecked until its stated observable result and applicable focused validation have run successfully, or an exact reasoned manual or external gate is recorded. Source edits, code inspection, compilation alone, an agent completion statement, workflow reflection, or optional improvement evidence SHALL NOT satisfy a task whose acceptance requires runtime behavior.

On failed proof or validation, apply SHALL preserve the command, exit status, relevant stdout/stderr and diagnostics, leave the task unchecked, and continue autonomous diagnosis when locally resolvable. Apply SHALL select the smallest dependency-valid next slice that reaches the earliest safe real boundary. Several valid batch sizes, reviewer choices, or cycle lengths SHALL NOT by themselves create an owner question.

#### Scenario: Edit without proof remains incomplete
- **WHEN** apply changes requested files but has not run the task's required observable proof
- **THEN** the task remains unchecked
- **AND** the session reports the missing proof rather than archive readiness.

#### Scenario: Successful task evidence permits completion
- **WHEN** the task's observable result and applicable focused validation pass on the current candidate
- **THEN** apply records the evidence reference and checks the task
- **AND** it may continue to the next unblocked task without a routine user question.

#### Scenario: Optional process observation does not become scope
- **WHEN** implementation reveals a workflow improvement that is not required by the accepted outcome or a non-deferrable invariant
- **THEN** apply leaves current task scope unchanged
- **AND** may route the observation to explicit feedback or a separate proposal.

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
The normal OpenSpec archive path SHALL refuse to archive a change as complete when required artifacts are incomplete, accepted product tasks remain unchecked, delta specs require synchronization, or applicable validation evidence is absent or red. A confirmation prompt SHALL NOT waive these completion conditions. Optional workflow reflections, deferred ideas, absent final-history analysis, and uncreated process-improvement tasks SHALL NOT block complete archive.

The kit MAY preserve intentionally incomplete work through a distinct abandoned or incomplete disposition. That disposition SHALL retain the reason and residual state, SHALL NOT claim all artifacts or tasks are complete, and SHALL NOT synchronize undelivered requirements into main specs.

#### Scenario: Unchecked accepted task blocks complete archive
- **WHEN** normal archive is requested for a change with an unchecked accepted product task
- **THEN** the operation exits non-zero without moving the change into a complete archive
- **AND** the diagnostic identifies the unchecked count.

#### Scenario: No retrospective exists
- **WHEN** accepted tasks and artifacts are complete and validation is green but no final-history retrospective was created
- **THEN** complete archive remains available
- **AND** no confirmation or process-improvement record is required.

#### Scenario: Unchecked task blocks complete archive
- **WHEN** normal archive is requested for a change with an unchecked task
- **THEN** the operation exits non-zero without moving the change into a complete archive
- **AND** the diagnostic identifies the unchecked count.

#### Scenario: Unpersisted admitted improvement blocks archive
- **WHEN** current continuation evidence contains an admitted improvement not yet represented in the active `tasks.md`
- **THEN** the archive path does not invoke complete archive
- **AND** it persists the owned improvement as an unchecked task or reports the exact owner/target blocker.

#### Scenario: Incomplete work is preserved honestly
- **WHEN** the owner explicitly chooses the supported incomplete-preservation disposition
- **THEN** the retained change is labeled incomplete or abandoned with its reason
- **AND** no output claims implementation or spec synchronization completed.

## REMOVED Requirements

### Requirement: Final history retrospective is an evidence-bound completion task
**Reason**: Product completion must not depend on a second analysis that can manufacture new process scope after validation.
**Migration**: Existing retrospective task text may be removed from active changes when it has no user-owned product requirement; archived records remain historical evidence.
