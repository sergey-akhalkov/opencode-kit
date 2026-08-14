## MODIFIED Requirements

### Requirement: Task completion is evidence-bound
An OpenSpec implementation task, including a session-derived improvement task, SHALL remain unchecked until its stated observable result and applicable focused validation have run successfully, or an exact reasoned manual/external gate is recorded. Source edits, code inspection, compilation alone, or an agent completion statement SHALL NOT satisfy a task whose acceptance requires runtime behavior.

On failed proof or validation, the apply path SHALL preserve the command, exit status, relevant stdout/stderr and diagnostics, leave the task unchecked, and continue autonomous diagnosis when the failure is locally resolvable.

Before substantial implementation work, the apply path SHALL reconcile admitted improvements from the current session and any `Pending Improvement Tasks` continuation section into the active `tasks.md`, and SHALL persist `Deferred Improvement Candidates` as non-checkbox records in `history.md`. Every admitted record SHALL identify its trigger/evidence, causal reason, prerequisites, scope/non-goals, implementation outcome, observable proof, validation, impact horizon, concrete consumers, execution class, earliest safe point, invalidated evidence, and observable payback so a later session can execute it without reconstructing prior chat.

After safety and live-attempt blockers, apply SHALL execute each admitted improvement at its earliest safe point before the first named current-change consumer. Physical placement under `## Session-Derived Improvements` SHALL NOT postpone a `gate-closer`, `do-now`, or `before-task-<id>` task until the end of the original task list. `before-freeze` work SHALL complete before qualification freeze. `separate-change` records SHALL remain non-blocking deferred evidence until another owning change admits them.

For an already selected active change, pending ordinary tasks and admitted improvement tasks SHALL be accepted implementation work unless the user explicitly bounded the current request to a smaller task set. Apply SHALL select the smallest dependency-valid next slice that reaches the earliest safe real boundary, using declared dependencies and safety/proof gates before task-file order, and SHALL continue through later accepted work after current proof and validation. The existence of several valid task ranges, batch sizes, reviewer choices, or cycle lengths SHALL NOT by itself create an owner question.

#### Scenario: Edit without proof remains incomplete
- **WHEN** an apply session changes the requested files but has not run the task's required observable proof
- **THEN** the task checkbox remains unchecked
- **AND** the session reports the missing proof instead of archive readiness.

#### Scenario: Successful task evidence permits completion
- **WHEN** the task's observable result and applicable focused validation pass on the current candidate
- **THEN** the apply path records the evidence reference and checks the task
- **AND** it may continue to the next unblocked task without a routine user question.

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
