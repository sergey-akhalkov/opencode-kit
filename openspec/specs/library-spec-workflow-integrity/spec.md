# library-spec-workflow-integrity Specification

## Purpose
Defines evidence-bound OpenSpec authoring, task completion, operation gates, complete archive integrity, live status, and proportional workflow routing.
## Requirements
### Requirement: OpenSpec controls remain mutable during outcome-preserving implementation

OpenSpec proposal, design, specs, tasks, strategy history, attempt counts, and stop lines SHALL remain mutable implementation controls until completion. When implementation evidence invalidates a process assumption while accepted product semantics remain clear, the main session SHALL update the smallest coherent artifact set, add or reopen required tasks, preserve traceability and prior evidence, and continue without requesting owner approval for the artifact mutation itself.

Apply and archive routing SHALL NOT treat an all-done task list, exhausted attempt count, or literal no-successor sentence as immutable owner scope. Archive SHALL return to apply for the required outcome-preserving artifact/task update. Owner approval SHALL remain required only when the update changes accepted outcome or crosses a protected boundary.

#### Scenario: Apply revises an exhausted attempt boundary

- **WHEN** current tasks prohibit another attempt but a diagnosed defect is corrected and the recorded retry/unlock evidence permits a materially changed successor
- **THEN** apply updates the affected proposal/design/spec/tasks/history and continues through the successor
- **AND** it does not emit an owner-action request solely for the changed attempt count.

#### Scenario: Archive returns incomplete outcome to apply

- **WHEN** archive reconciliation finds that checked tasks or a process stop line no longer represent the unfinished accepted outcome
- **THEN** archive remains incomplete and routes the smallest coherent artifact/task correction back to apply
- **AND** it does not require explicit owner scope expansion unless accepted semantics or a protected boundary changes.

#### Scenario: Prior evidence remains attributable

- **WHEN** a process-control artifact changes after an unsuccessful attempt
- **THEN** strategy history preserves the prior attempt and causal reason for the successor
- **AND** evidence invalidation remains dependency-scoped rather than erasing trustworthy raw observations.

### Requirement: Spec Capsule is injected at artifact generation
The kit SHALL provide portable OpenSpec context and per-artifact rules that require every behavior-changing current increment to identify `Outcome`, `Operating Envelope`, `Non-Goals`, `Non-Deferrable Invariants`, `Observable Proof`, `Material Residual Risks`, and `Stop Line`, directly or through an explicit project-native equivalent. Proposal, design, specs, and tasks SHALL each receive only the fields relevant to their responsibility.

The rules SHALL permit `none` only when a reason establishes genuine non-applicability. They SHALL reject vague actionable placeholders and SHALL keep unreachable future behavior outside current acceptance.

#### Scenario: Proposal instructions expose current-increment constraints
- **WHEN** OpenSpec resolves proposal instructions for a repository using the kit rules
- **THEN** the returned context or rules contain the Spec Capsule field requirements
- **AND** they require the next useful working increment rather than exhaustive future design.

#### Scenario: Future behavior remains non-blocking
- **WHEN** a proposed capability includes future scale or compatibility behavior unreachable inside the enforced current envelope
- **THEN** the artifacts record that behavior as non-goal or future scope
- **AND** implementation readiness does not require resolving it.

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

### Requirement: Final history retrospective is an evidence-bound completion task

For a change authored under the final-history-retrospective policy, the final analysis task SHALL remain unchecked until every other currently known task is complete and the full change `history.md` has been analyzed through the canonical compaction improvement contract. Its completion evidence SHALL identify the resulting admitted task IDs, deferred record IDs, or `none`.

If the analysis appends tasks, they SHALL become ordinary accepted completion scope and remain unchecked until their implementation, observable proof, and validation pass. Deferred non-checkbox records SHALL remain non-blocking. Apply SHALL continue without a routine user question. Complete archive SHALL remain unavailable while the analysis task or any generated admitted task is unchecked.

#### Scenario: Compaction adds work before final analysis

- **WHEN** session-derived improvement tasks are appended after initial proposal authoring but before the final history analysis runs
- **THEN** the final analysis remains ineligible until those tasks are complete
- **AND** it then analyzes the complete accumulated `history.md` once.

#### Scenario: Analysis creates executable work

- **WHEN** the final analysis persists one or more admitted improvements
- **THEN** it records the generated task IDs and apply immediately proceeds to the new unchecked work
- **AND** normal task proof and validation rules govern completion.

#### Scenario: Honest none completes the analysis

- **WHEN** the six-cell history analysis produces no admitted candidate
- **THEN** the task records `none` and may be checked
- **AND** no additional task or approval ceremony is required.

#### Scenario: Archive cannot bypass the retrospective

- **WHEN** complete archive is requested for a policy-authored change whose final history analysis or generated improvement task remains unchecked
- **THEN** archive stops and returns the change to apply
- **AND** confirmation cannot waive the incomplete task.

### Requirement: Complete archive fails closed
The normal OpenSpec archive path SHALL refuse to archive a change as complete when required artifacts are incomplete, tasks remain unchecked, admitted session-derived improvements are not reconciled into `tasks.md`, delta specs require synchronization, or applicable validation evidence is absent or red. A confirmation prompt SHALL NOT waive these completion conditions.

Immediately before invoking the deterministic archive helper, the archive path SHALL inspect the current session/continuation evidence for pending admitted and deferred improvements. It SHALL persist current-consumer owned items as unchecked tasks and return to apply, persist no-current-consumer evidence as non-checkbox history records, or stop only the required dependency chain on an exact owner/target blocker; it SHALL NOT archive first and leave a valid record only in a summary.

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

### Requirement: Operation gates run on the operation path
Every repository-shipped propose, apply, and complete-archive entrypoint SHALL invoke its matching deterministic operation check. A registry operation without a shipped caller SHALL NOT be described as integrated. Failed, blocked, or unknown safety/completion checks SHALL stop the affected operation; warnings SHALL remain non-blocking only when they cannot represent false completion or a non-deferrable risk.

Checks SHALL report only explicit facts available from their inputs and SHALL return `unknown` for unsupported evidence rather than inferring semantic quality.

#### Scenario: Apply executes its gate before mutation
- **WHEN** an apply entrypoint is invoked for a change
- **THEN** its apply gate runs before implementation mutation
- **AND** a missing required artifact blocks the apply loop.

#### Scenario: Archive gate observes checklist state
- **WHEN** archive checks a change with incomplete tasks
- **THEN** the gate reports a blocking failure
- **AND** the archive caller does not downgrade it to a confirmation-only warning.

### Requirement: Active status comes from live OpenSpec evidence
Durable project guidance SHALL NOT contain manually maintained active-change progress, execution waves, archive-candidate state, commit identities, CI run identities, or dependency order that can be derived from OpenSpec and repository commands. Active status SHALL come from `openspec list`, `openspec status`, current task checkboxes, and current validation evidence.

#### Scenario: No active changes exist
- **WHEN** `openspec list --json` returns no active changes
- **THEN** project guidance does not direct the agent to archived workstreams
- **AND** next-step discovery reports no active OpenSpec implementation work.

### Requirement: Spec workflow routing remains proportional
The default `next-step` response SHALL recommend one bounded serial action and SHALL NOT begin implementation, parallel planning, SDET, or optional review unless the user requested execution, multiple approved workstreams require coordination, or concrete risk or project policy requires the additional role.

Getting-started guidance SHALL teach Ordinary Small focused proof and validation separately from Material fresh critical-only SDET.

#### Scenario: What-next question remains recommendation-only
- **WHEN** the user asks what to do next without asking to execute or coordinate parallel work
- **THEN** the kit returns one recommended bounded action with success evidence
- **AND** it does not launch planning workers or implementation.

#### Scenario: Small first task avoids mandatory SDET
- **WHEN** a new project user requests a clear bounded local reversible first task without a named Material boundary
- **THEN** getting-started guidance routes main-owned happy-path proof and focused validation
- **AND** it does not require a fresh SDET or optional reviewer.

### Requirement: Unattended OpenSpec workflow has one runtime-resolved owner
The kit SHALL install one canonical global owner for the standard OpenSpec propose, apply, and complete-archive skill and command names. Project-specific requirements SHALL live in OpenSpec config, repository instructions, validation adapters, or differently named domain helpers. Unattended operation SHALL fail closed when a project-local same-name skill or command shadows or competes with the canonical owner.

#### Scenario: Canonical global workflow is loaded
- **WHEN** unattended preflight inspects the resolved runtime for an unrelated project with no same-name overrides
- **THEN** every standard propose/apply/archive command and skill resolves to the active kit global source
- **AND** the project context remains available without copying the lifecycle workflow.

#### Scenario: Legacy overlay remains
- **WHEN** a target project retains an older same-name OpenSpec overlay
- **THEN** ordinary manual use remains outside this capability's claim
- **AND** unattended preflight blocks with migration guidance instead of silently selecting either copy.

### Requirement: Canonical workflow entrypoints use portable deterministic gates
Canonical propose and apply entrypoints SHALL invoke the portable operation gate from the resolved global source with an explicit project root and change id. Canonical complete archive SHALL invoke the existing portable archive helper with explicit validation argv. They SHALL NOT require the target project to define an opencode-kit npm script.

#### Scenario: Rust project has no npm scripts
- **WHEN** a target project supplies explicit Rust validation argv and invokes canonical apply/archive
- **THEN** the global operation gate and archive helper run without a target npm dependency
- **AND** project-specific commands remain only in its adapter/mission definition.

