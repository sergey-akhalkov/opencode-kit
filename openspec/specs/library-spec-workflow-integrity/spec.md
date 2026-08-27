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

### Requirement: Active changes have one mutation owner
Every active change SHALL publish a stable ownership manifest for modified capability paths, requirement names, and planned write roots. Operation gates SHALL reject two active changes whose owners overlap unless one declares an acyclic dependency or explicit transfer and only one change is mutation-enabled. Presence of a dependency SHALL order work but SHALL NOT permit concurrent writers to the same owner.

#### Scenario: Two changes modify Restart
- **WHEN** active changes modify the same capability requirement with different content
- **THEN** propose/apply reports both changes and the overlapping requirement
- **AND** neither may mutate that owner until dependency or transfer is resolved

#### Scenario: Dependency orders shared owner work
- **WHEN** a later change declares that an earlier change must archive before it acquires the shared owner
- **THEN** the later change remains planning-only while the earlier owner is active
- **AND** becomes mutation-eligible only after current state confirms the transfer condition

### Requirement: Checked tasks have candidate-correlated evidence
Every checked behavior, proof, validation, manual, or external task SHALL have one versioned evidence-index row containing task ID, task text digest, candidate/environment identity, named entrypoint or manual gate, exact invocation/status, bounded artifact refs, cleanup, and result. A task whose evidence uses a weaker entrypoint/effect set than its text, references a stale candidate, is missing, or is red SHALL be reported incomplete regardless of checkbox state.

#### Scenario: Desktop Restart task has only helper proof
- **WHEN** a checked task names Desktop and tray Restart but evidence records only a direct helper invocation
- **THEN** completion and qualification gates reject the task as proof-envelope mismatch
- **AND** preserve the helper evidence as partial rather than deleting it

#### Scenario: Task evidence matches current candidate
- **WHEN** task digest, candidate, environment, named boundary, status, artifacts, and cleanup all match
- **THEN** the checkbox may contribute to completion
- **AND** later candidate mutation invalidates only dependent rows

### Requirement: Completed and qualification states compose current OpenSpec facts
A change SHALL NOT report complete, RC, qualification-pass, or archive-ready unless selected strict delta validation passes on the current bytes, required artifacts are current, all tasks are evidence-complete, active ownership is conflict-free, and applicable repository OpenSpec validation has no failure attributable to the candidate. Structural library validation alone SHALL NOT establish this state.

#### Scenario: Tasks are complete but delta is invalid
- **WHEN** every checkbox is checked but selected strict validation fails
- **THEN** status and qualification report incomplete/blocked
- **AND** identify the delta diagnostic rather than retaining an RC claim

#### Scenario: Unrelated active change is invalid
- **WHEN** selected strict validation passes but repository-wide validation fails only on another active owner
- **THEN** the selected change may report its local facts
- **AND** repository qualification/RC remains blocked with the unrelated change named

### Requirement: Active evidence is indexed and bounded
Every evidence-bearing active change SHALL maintain one stable `evidence-index.json` that classifies product, runner, evaluator, environment, raw bundle, replay, and terminal evidence by lane. Default active retention SHALL not exceed 64 files or 25 MiB. A proposal MAY declare a smaller limit or an explicit material exception with its own maximum, reason, cleanup/retention rule, and validation. Unindexed files, unknown size, or exceeded limits SHALL block new evidence capture and completion but SHALL NOT delete evidence automatically.

#### Scenario: Evidence tree exceeds default bounds
- **WHEN** an active change has more than 64 retained evidence files or 25 MiB without a validated exception
- **THEN** the gate blocks another capture and completion
- **AND** reports indexed, unindexed, retained, and excess facts

#### Scenario: Evaluator failure has preserved raw data
- **WHEN** raw capture is trustworthy and only evaluation fails
- **THEN** the index routes replay over the preserved bundle
- **AND** no duplicate live capture directory is created

### Requirement: Spec Capsule carries proportional claim-evidence scope
Every behavior-changing proposal SHALL add one `Claim And Evidence Scope` record or accepted project-native equivalent. For an exact-case Ordinary Small increment, the record MAY be one concise statement naming the exact claim and matching proof boundary. When a claim generalizes beyond exercised cases, composes evidence paths, substitutes behavior, depends on a real system, or asserts finite-population, partitioned-domain, compatibility, interchangeability, safety, or phase/milestone scope, the record SHALL identify the claim class, population, coverage basis, production and comparison paths, environment, real oracle, unresolved observations, and maximum claim.

Triggered evidence-bearing changes SHALL store the structured claim records in the existing bounded evidence index and reference existing evidence lanes rather than duplicate hashes, raw facts, or semantic records. OpenSpec artifact instructions SHALL preserve one owner for the complete record and SHALL NOT require each task to repeat unchanged claim fields.

#### Scenario: Ordinary proposal remains concise
- **WHEN** a behavior change makes one exact-case claim with one matching local real boundary and no broad trigger
- **THEN** its Spec Capsule records the exact claim and boundary without a population matrix or independent assurance task
- **AND** proposal readiness remains proportional.

#### Scenario: Broad proposal declares closure before implementation
- **WHEN** a proposal claims a finite population, substitution, compatibility, safety, or phase/milestone result
- **THEN** its Claim And Evidence Scope names the population, paths, coverage basis, real oracle, unknown handling, and claim ceiling before production mutation
- **AND** later tasks reference that record rather than inventing completion from validation output.

### Requirement: Complete archive requires current claim-evidence closure
The complete-archive path SHALL reject a triggered broad claim when its current structured claim record is absent, stale, references a weaker production path or environment, lacks required population or partition closure, omits the real oracle, has unresolved material observations, lacks the required independent challenge, or has disposition `blocked | unknown`. A `narrowed` disposition MAY support archive only when the accepted outcome itself names that narrower result or a current owner decision has explicitly changed the accepted product scope; archive output SHALL state the narrower ceiling.

Operation helpers SHALL evaluate only explicit reviewed fields, evidence-index references, identities, counts, and terminal statuses. They SHALL return `unknown` for unsupported semantic closure and SHALL NOT infer equivalence, non-applicability, safety, compatibility, or claim class from prose, filenames, tests, or aggregate counts.

#### Scenario: All tasks pass but broad closure is missing
- **WHEN** every task is checked and project validation is green but a triggered population or real-system claim lacks matching closure
- **THEN** complete archive exits non-zero with the exact claim and evidence gap
- **AND** narrower trustworthy task evidence remains preserved.

#### Scenario: Narrowed accepted result archives honestly
- **WHEN** the current accepted outcome explicitly permits an exact narrower claim and its closure is supported while a broader future claim is excluded
- **THEN** complete archive may proceed for the narrower outcome
- **AND** archive and handoff do not call the excluded broader claim complete.

### Requirement: Foundation invalidation propagates through current planning without rewriting history
After main confirms a foundation defect, the workflow SHALL enumerate every active
change, current canonical specification, and active structured claim record and
classify its material dependence on the invalidated relation before mutation.
Dependence SHALL require a current workload, profile/configuration, environment,
oracle, production/comparison path, or claim binding; a historical-only mention
SHALL remain unaffected.

Main SHALL update the smallest coherent proposal/design/spec/tasks/history and claim
set for each dependent active change, reopen or add only outcome-required tasks,
and serialize corrections under existing ownership and overlap rules. Unrelated
active artifacts SHALL remain untouched. Canonical OpenSpec behavior SHALL change
through a corrective active delta and normal synchronization rather than an
agent-driven direct main-spec edit.

Completed and archived evidence SHALL remain immutable. Current records SHALL
preserve each prior result at its strongest truthful narrower ceiling and SHALL NOT
represent a historical, cross-profile, component, regression, or different-
environment result as current foundation proof.

#### Scenario: Sweep finds dependent and unrelated active changes
- **WHEN** the complete active inventory contains one change that binds the invalid identity and one that does not
- **THEN** only the dependent change and its current claim/spec dependencies are corrected
- **AND** the unrelated change is classified `not-dependent` and remains unchanged.

#### Scenario: Main requirement contains the invalid current relation
- **WHEN** a canonical specification asserts the invalid identity as current
- **THEN** recovery creates or uses an active corrective delta owned by one change
- **AND** direct ad hoc mutation of the main specification is not the recovery mechanism.

#### Scenario: Prior evidence remains useful below a narrower ceiling
- **WHEN** preserved proof remains valid for exact bytes on the exercised historical path but cannot support the corrected current outcome
- **THEN** current claim records retain that proof with its narrower historical or component ceiling
- **AND** archived evidence bytes and history remain unchanged.

### Requirement: Foundation recovery episodes have explicit terminal state
Each confirmed foundation recovery SHALL record one stable incident identity, the
reproduced contradiction, affected relation and candidate, complete dependent active
artifact inventory, corrections, evidence narrowing, fresh re-review identity, and
one terminal state `falsified | owner-boundary | closed`. The same incident,
candidate, and evidence SHALL NOT create a second recovery change or equivalent
review. A closed incident MAY reopen only for a new candidate identity or new
decision-changing evidence that establishes a distinct current relation.

#### Scenario: Same finding repeats after correction
- **WHEN** fresh corrected-candidate review repeats the same relation finding without new candidate or evidence identity
- **THEN** the workflow does not create another incident or successor change
- **AND** main treats any reproduced remaining gap as a correction defect inside the current recovery episode.

#### Scenario: New evidence changes the current relation
- **WHEN** a closed incident receives new decision-changing source or runtime evidence that binds a materially different current foundation identity
- **THEN** a distinct incident may be opened with the new identities and evidence
- **AND** the prior incident and its evidence remain preserved.

### Requirement: Propose separates structural and semantic readiness

Every behavior-changing OpenSpec proposal SHALL declare bounded falsification as
`required - <decision surface>` or `exempt - <Ordinary Small reason>`. The declaration is
a reviewed semantic input; deterministic tooling SHALL validate only its shape and SHALL
NOT infer profile, materiality, task-fit, or exemption correctness from prose or counts.

Canonical propose SHALL build all required artifacts, run deterministic operation and
strict OpenSpec checks, and describe their result as structural artifact readiness. When
falsification is required, propose SHALL supply the original accepted request separately,
launch one fresh bounded challenge, let main disposition admitted rows, update affected
artifacts, and preserve a candidate-correlated record before emitting semantic
implementation readiness. An absent, stale, or unusable required challenge SHALL leave
semantic readiness `unknown` without inventing defects or calling structural validation
failed.

#### Scenario: Structural gates pass but required challenge is absent

- **WHEN** proposal, design, specifications, tasks, operation gates, and strict validation pass but the required falsification record is missing or stale
- **THEN** propose reports structural artifact readiness and semantic readiness `unknown`
- **AND** it does not emit an unqualified `Ready for implementation` statement.

#### Scenario: Required challenge terminates with no material finding

- **WHEN** current artifacts pass structural checks and one fresh challenge returns `no-material-finding` with a current main disposition
- **THEN** propose may report the change semantically ready for implementation
- **AND** it does not add another review or correction task.

#### Scenario: Ordinary Small exemption applies

- **WHEN** main records a reviewed exemption for an exact owner-local reversible change with no decision-material surface
- **THEN** structural readiness is sufficient for the bounded change's implementation handoff
- **AND** no empty reviewer artifact is manufactured.

### Requirement: Apply consumes current review state without reopening a loop

Apply SHALL read the proposal declaration and candidate-correlated falsification state
before substantial implementation. A current terminal episode or reviewed exemption
SHALL satisfy this pre-investment boundary. Apply SHALL NOT relaunch an equivalent review
for the unchanged candidate, and implementation that stays within the challenged decision
surface SHALL NOT require a duplicate generic post-proof review.

#### Scenario: Apply sees a current terminal episode

- **WHEN** the original request, candidate, decision surface, and terminal falsification record are current
- **THEN** apply proceeds to the earliest real implementation boundary without asking for or launching another generic review.

#### Scenario: Implementation planning changes a challenged decision

- **WHEN** apply must change the challenged outcome, envelope, invariant, proof boundary, owner decision, or material-risk surface before implementation can continue
- **THEN** it marks the affected review state stale and uses only the remaining episode budget or exact owner evidence
- **AND** it does not reset an exhausted episode on the same accepted outcome.
