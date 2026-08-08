## ADDED Requirements

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
An OpenSpec implementation task SHALL remain unchecked until its stated observable result and applicable focused validation have run successfully, or an exact reasoned manual/external gate is recorded. Source edits, code inspection, compilation alone, or an agent completion statement SHALL NOT satisfy a task whose acceptance requires runtime behavior.

On failed proof or validation, the apply path SHALL preserve the command, exit status, relevant stdout/stderr and diagnostics, leave the task unchecked, and continue autonomous diagnosis when the failure is locally resolvable.

#### Scenario: Edit without proof remains incomplete
- **WHEN** an apply session changes the requested files but has not run the task's required observable proof
- **THEN** the task checkbox remains unchecked
- **AND** the session reports the missing proof instead of archive readiness.

#### Scenario: Successful task evidence permits completion
- **WHEN** the task's observable result and applicable focused validation pass on the current candidate
- **THEN** the apply path records the evidence reference and checks the task
- **AND** it may continue to the next unblocked task without a routine user question.

### Requirement: Complete archive fails closed
The normal OpenSpec archive path SHALL refuse to archive a change as complete when required artifacts are incomplete, tasks remain unchecked, delta specs require synchronization, or applicable validation evidence is absent or red. A confirmation prompt SHALL NOT waive these completion conditions.

The kit MAY preserve intentionally incomplete work through a distinct abandoned or incomplete disposition. That disposition SHALL retain the reason and residual state, SHALL NOT claim all artifacts or tasks are complete, and SHALL NOT synchronize undelivered requirements into main specs.

#### Scenario: Unchecked task blocks complete archive
- **WHEN** normal archive is requested for a change with an unchecked task
- **THEN** the operation exits non-zero without moving the change into a complete archive
- **AND** the diagnostic identifies the unchecked count.

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
