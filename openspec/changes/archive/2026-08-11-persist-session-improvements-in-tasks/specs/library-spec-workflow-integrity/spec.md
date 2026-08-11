## MODIFIED Requirements

### Requirement: Task completion is evidence-bound
An OpenSpec implementation task, including a session-derived improvement task, SHALL remain unchecked until its stated observable result and applicable focused validation have run successfully, or an exact reasoned manual/external gate is recorded. Source edits, code inspection, compilation alone, or an agent completion statement SHALL NOT satisfy a task whose acceptance requires runtime behavior.

On failed proof or validation, the apply path SHALL preserve the command, exit status, relevant stdout/stderr and diagnostics, leave the task unchecked, and continue autonomous diagnosis when the failure is locally resolvable.

Before reporting all implementation tasks complete, the apply path SHALL reconcile admitted improvements from the current session and any `Pending Improvement Tasks` continuation section into the active `tasks.md`. Every record SHALL identify its trigger/evidence, causal reason, prerequisites, scope/non-goals, implementation outcome, observable proof, and validation so a later session can execute it without reconstructing prior chat.

#### Scenario: Edit without proof remains incomplete
- **WHEN** an apply session changes the requested files but has not run the task's required observable proof
- **THEN** the task checkbox remains unchecked
- **AND** the session reports the missing proof instead of archive readiness.

#### Scenario: Successful task evidence permits completion
- **WHEN** the task's observable result and applicable focused validation pass on the current candidate
- **THEN** the apply path records the evidence reference and checks the task
- **AND** it may continue to the next unblocked task without a routine user question.

#### Scenario: Continuation carries pending improvements
- **WHEN** an apply session receives one or more still-admissible `Pending Improvement Tasks`
- **THEN** it appends every entry to the active `tasks.md` before substantial implementation work
- **AND** each entry remains unchecked until its implementation, proof, and validation are complete.

### Requirement: Complete archive fails closed
The normal OpenSpec archive path SHALL refuse to archive a change as complete when required artifacts are incomplete, tasks remain unchecked, admitted session-derived improvements are not reconciled into `tasks.md`, delta specs require synchronization, or applicable validation evidence is absent or red. A confirmation prompt SHALL NOT waive these completion conditions.

Immediately before invoking the deterministic archive helper, the archive path SHALL inspect the current session/continuation evidence for pending admitted improvements. It SHALL persist still-admissible owned items as unchecked tasks and return to apply, or stop on the exact owner/target blocker; it SHALL NOT archive first and leave the improvement only in a summary.

The kit MAY preserve intentionally incomplete work through a distinct abandoned or incomplete disposition. That disposition SHALL retain the reason and residual state, SHALL NOT claim all artifacts or tasks are complete, and SHALL NOT synchronize undelivered requirements into main specs.

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
