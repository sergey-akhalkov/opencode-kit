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

#### Scenario: Required dividend completion is missing
- **WHEN** a proposal declares the dividend required but its tagged task is absent or unchecked
- **THEN** complete archive exits non-zero without moving the change
- **AND** reports the exact task fact that is incomplete.

#### Scenario: Exempt change has no automation task
- **WHEN** a proposal contains a valid concrete automation exemption and every accepted product gate is green
- **THEN** complete archive does not require an automation task
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

Checks SHALL report only explicit facts available from their inputs and SHALL return `unknown` for unsupported facts rather than inferring semantic quality. Propose SHALL validate the automation-dividend declaration shape. Apply and archive SHALL correlate a required declaration with exactly one tagged task; complete archive SHALL require that task to be checked. No gate SHALL infer Material profile, recurrence, helper value, or exemption validity from unstructured prose.

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

#### Scenario: Archive gate correlates the required dividend task
- **WHEN** archive checks a required dividend declaration and its tagged task
- **THEN** it passes only when exactly one tagged task exists and is checked
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

### Requirement: Checked tasks do not replace current proof

A checked task SHALL report implementation progress only. Completion and qualification SHALL use the current selected strict validation, repository validation, actual entrypoint result, and required cleanup. OpenSpec SHALL NOT require or generate task evidence rows, evidence indexes, retained proof bundles, or replay lanes.

#### Scenario: Desktop Restart task has only helper proof
- **WHEN** a checked task names Desktop and tray Restart but only a direct helper was exercised
- **THEN** the current completion handoff reports the real boundary as unproved
- **AND** no evidence file is created to make the checkbox appear sufficient

### Requirement: Completed and qualification states compose current OpenSpec facts
A change SHALL NOT report complete, RC, qualification-pass, or archive-ready unless selected strict delta validation passes on the current bytes, required artifacts are current, all tasks are checked, the accepted outcome has current real-boundary proof, active ownership is conflict-free, and applicable repository OpenSpec validation has no failure attributable to the candidate. Structural library validation alone SHALL NOT establish this state.

#### Scenario: Tasks are complete but delta is invalid
- **WHEN** every checkbox is checked but selected strict validation fails
- **THEN** status and qualification report incomplete/blocked
- **AND** identify the delta diagnostic rather than retaining an RC claim

#### Scenario: Unrelated active change is invalid
- **WHEN** selected strict validation passes but repository-wide validation fails only on another active owner
- **THEN** the selected change may report its local facts
- **AND** repository qualification/RC remains blocked with the unrelated change named

### Requirement: Active changes retain no proof archive

Active changes SHALL NOT create repository `evidence/` directories, `evidence-index.json`, raw/evaluation/replay bundles, or separate proof reports. Tests MAY use automatically cleaned temporary output. The handoff SHALL state only the current invocation, observed result, validation outcome, cleanup, and limitations needed to understand the result.

### Requirement: Spec Capsule carries proportional claim scope

Every behavior-changing proposal SHALL add one `Claim And Evidence Scope` record or accepted project-native equivalent. For an exact-case Ordinary Small increment, the record MAY be one concise statement naming the exact claim and matching proof boundary. When a claim generalizes beyond exercised cases, composes evidence paths, substitutes behavior, depends on a real system, or asserts finite-population, partitioned-domain, compatibility, interchangeability, safety, or phase/milestone scope, the record SHALL identify the claim class, population, coverage basis, production and comparison paths, environment, real oracle, unresolved observations, and maximum claim.

Broad changes SHALL state the maximum supported claim directly in the proposal and final handoff. OpenSpec artifact instructions SHALL NOT create a claim ledger, evidence index, or retained review report.

#### Scenario: Ordinary proposal remains concise
- **WHEN** a behavior change makes one exact-case claim with one matching local real boundary and no broad trigger
- **THEN** its Spec Capsule records the exact claim and boundary without a population matrix or independent assurance task
- **AND** proposal readiness remains proportional.

#### Scenario: Broad proposal declares closure before implementation
- **WHEN** a proposal claims a finite population, substitution, compatibility, safety, or phase/milestone result
- **THEN** its Claim And Evidence Scope names the population, paths, coverage basis, real oracle, unknown handling, and claim ceiling before production mutation
- **AND** later tasks reference that record rather than inventing completion from validation output.

#### Scenario: Partition member classes use compact inheritance
- **WHEN** a schema-v2 partition population omits `materialClasses` while retaining its explicit ordered `members`
- **THEN** the reader resolves material classes to the exact member list before completeness and mismatch evaluation

### Requirement: Complete archive states the current claim ceiling
The complete-archive path SHALL reject a broad completion claim when current real-boundary proof and project validation support only a narrower result. Archive output SHALL state that narrower ceiling. Operation helpers SHALL NOT infer equivalence, non-applicability, safety, compatibility, or completeness from prose, filenames, checkboxes, or aggregate counts, and SHALL NOT require a retained claim record.

#### Scenario: All tasks pass but broad closure is missing
- **WHEN** every task is checked and project validation is green but a triggered population or real-system claim lacks matching closure
- **THEN** complete archive exits non-zero with the exact unsupported claim
- **AND** the current narrower observed result remains reportable.

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

### Requirement: Schema-v2 evidence records remain exact under compact storage

Schema-v2 evidence readers SHALL accept a lane file as either the existing object with `path`, `bytes`, and `digest` fields or the exact compact tuple `[path, bytes, digest]`. They SHALL accept a named-entrypoint task as either its existing expanded object or `["entrypoint", taskId, taskTextDigest, result, boundaryName, effects, command, status, recordedAt, cleanup]`; the compact form explicitly represents a named-entrypoint boundary, an identical required boundary, top-level candidate/environment identity, empty artifacts, and no manual gate. They SHALL accept a claim observation as either its existing expanded object or `["observation", memberId, status, terminal, evidenceRefs]`; the compact form inherits exact candidate/environment, paths, and observation-boundary copies from its containing claim and represents an empty unresolved-observation list. All forms SHALL resolve to the same internal records before containment, uniqueness, retention, hash, task, lane, or claim evaluation. Existing expanded forms SHALL remain readable and preserve explicit mismatches. The deterministic evidence materializer SHALL refresh each file from disk and write eligible compact records in stable existing order. Compact storage SHALL NOT omit or infer a unique path, byte count, digest, file, lane, identity, boundary, invocation, status, cleanup, evidence reference, or semantic fact, and SHALL NOT weaken the existing 65,536-byte index ceiling.

#### Scenario: Compact and expanded lane files resolve identically
- **WHEN** one schema-v2 index uses expanded lane file objects and an otherwise identical index uses exact compact tuples
- **THEN** both readers resolve the same paths, byte counts, digests, lane membership, retention totals, and currentness results

#### Scenario: Malformed compact lane file remains invalid
- **WHEN** a compact lane file has another length or order, an unsafe path, a non-integer byte count, or a non-SHA-256 digest
- **THEN** the reader rejects that exact row without inferring or repairing the missing fact

#### Scenario: Compact task and observation rows preserve exact expanded facts
- **WHEN** a named-entrypoint task or claim observation contains only the facts represented by its exact compact tuple and exact inherited copies
- **THEN** the reader resolves the same task or observation as the expanded object before currentness and claim evaluation

#### Scenario: Explicit compact-row mismatches stay expanded and visible
- **WHEN** a task or observation explicitly differs from its top-level or containing-claim identity, boundary, or path facts
- **THEN** the expanded record remains supported and the existing stale, mismatch, blocked, or unknown result remains visible rather than being compacted away

### Requirement: OpenSpec changes SHALL link delivery horizons explicitly

The proposal workflow SHALL require one exact `Delivery Horizon` declaration for newly
authored changes: a valid project-contained horizon id, or `none` with a concrete reason.
Deterministic checks SHALL validate only declaration shape, horizon existence, exact id,
and contained schema references. They SHALL NOT infer roadmap membership, materiality,
progress, forecast, or trigger state from proposal prose, tasks, changed files, or
capability names. Legacy active and archived changes SHALL remain readable without
retroactive linkage.

#### Scenario: Unrelated ordinary change declares none

- **WHEN** a new change is not an implementation or evidence slice for an explicit
  project Delivery Horizon
- **THEN** its proposal declares `Delivery Horizon: none` with the reason
- **AND** proposal/apply/archive remain proportional without a trajectory signal or
  invented project-level association.

#### Scenario: Link names an unknown horizon

- **WHEN** a new proposal declares a horizon id absent from the explicit project record
- **THEN** proposal readiness reports the exact missing horizon before implementation
- **AND** the gate does not create, select, or infer a replacement horizon.

### Requirement: Complete archive SHALL remain independent of trajectory review

The canonical complete-archive path SHALL finish accepted completion, official spec
merge/movement, and post-archive validation before any delivery-trajectory signal. A
successful archive result SHALL remain successful when the later signal is `none`,
`review-required`, `unknown`, unavailable, or fails. Trajectory work SHALL NOT become an
unchecked task, claim-closure member, automation-dividend substitute, final-history
analysis, or additional complete-archive gate for the archived change.

After success, the archive workflow SHALL route a horizon-linked archive to the compact
signal and SHALL report signal state separately from archive state. An unlinked archive
SHALL report trajectory `not-applicable` without semantic inference. Failed archive or
post-validation SHALL retain ordinary archive failure and SHALL NOT emit a success-based
trajectory signal.

#### Scenario: Archive succeeds and deep review is required

- **WHEN** every product/archive gate succeeds and the post-archive signal later reports
  `review-required`
- **THEN** the operation remains `archived` and the review is future-horizon planning
- **AND** no archived artifact or completion result is rewritten or downgraded.

#### Scenario: Archive itself fails

- **WHEN** completion, official archive, or post-archive validation exits non-zero
- **THEN** ordinary archive diagnostics and state remain controlling
- **AND** no trajectory signal represents the change as successfully archived.

### Requirement: Horizon-dependent propose and apply SHALL consume current trajectory disposition

Before substantial work for a horizon-linked proposal, the propose/apply workflow SHALL
evaluate the latest successful linked archive and consume a matching current review
receipt when its semantic signal is `review-required`. This check SHALL be scoped to the
same horizon and dependency path. It SHALL permit unrelated or evidence-only work and
SHALL NOT infer a no-trigger result from missing evidence.

#### Scenario: Current receipt permits the successor

- **WHEN** the latest context and trigger tuple matches a terminal receipt that names the
  current outcome-preserving successor
- **THEN** ordinary propose/apply work may continue for that successor
- **AND** all existing artifact, proof, safety, validation, and owner-boundary gates still
  apply independently.

#### Scenario: Decision evidence changed after the receipt

- **WHEN** reviewed horizon intent or decision-material trigger evidence changes the
  receipt tuple before dependent implementation
- **THEN** the old receipt remains historical for the changed evidence and main first
  recomputes the compact signal
- **AND** main performs another deep review only for a materially distinct current trigger
  or when the changed evidence satisfies the prior receipt's retry condition; changed
  archive identity or other non-key operational metadata alone does not invalidate it.

### Requirement: OpenSpec apply SHALL maintain a dependency-valid grind frontier
For grind-enabled apply, current accepted tasks SHALL be reconciled into stable pending, running, complete, deferred, or blocked work items with explicit dependencies and scoped gate refs sufficient to identify the next dependency-valid task. A product decision SHALL park only its affected tasks. Apply SHALL continue every unblocked accepted task before presenting that decision and SHALL keep task, proof, and validation status honest.

#### Scenario: Blocked task has an independent sibling
- **WHEN** task 5.2 is blocked by a current product, access, process, capability, safety, or proof gate and task 5.3 has no dependency on task 5.2 or that gate
- **THEN** apply keeps task 5.2 unchecked with its resume condition and starts task 5.3
- **AND** does not ask whether to continue, check task 5.2, or claim the blocked evidence lane.

#### Scenario: Artifact order is stricter than accepted dependencies
- **WHEN** an agent-authored task order or stop-line serializes two tasks but current accepted semantics and evidence show that the later task is independent
- **THEN** apply reconciles the planning controls and executes the independent task
- **AND** preserves the prior artifact and attempt evidence without requesting process approval.

#### Scenario: Product decision affects all pending tasks
- **WHEN** every pending accepted task explicitly depends on one unresolved material product decision and no option-invariant task remains
- **THEN** apply preserves one consolidated product-decision handoff and the exact affected task set
- **AND** performs no decision-dependent implementation until a human answer updates the frontier.

### Requirement: Complete archive reports Kaizen harvest independently
The canonical agent-driven complete-archive workflow SHALL attempt a bounded Kaizen harvest checkpoint without adding that checkpoint, its reflection, or any derived improvement to the accepted task graph. The deterministic archive helper SHALL remain the owner of completion validation, official movement, post-archive validation, and `archived` status. Kaizen lifecycle state SHALL be reported separately and SHALL NOT waive, replace, repeat, roll back, or relabel any archive gate or result.

#### Scenario: Archive and harvest both complete
- **WHEN** deterministic complete archive returns `archived` and the separate harvest checkpoint closes as `captured` or `no-signal`
- **THEN** handoff reports both states with their own evidence refs
- **AND** no retrospective artifact or additional archive gate is introduced.

#### Scenario: Harvest remains a repair gap
- **WHEN** deterministic complete archive returns `archived` but an opened harvest checkpoint has no valid closure
- **THEN** handoff reports archive success and the harvest repair gap separately
- **AND** no repair-gap closure is written and later repair closes only the Kaizen checkpoint as `captured` or `no-signal` without repeating archive.

#### Scenario: Archive fails after harvest checkpoint opens
- **WHEN** a harvest checkpoint is open but deterministic complete archive does not return `archived`
- **THEN** the checkpoint closes as `archive-failed` when its store remains available
- **AND** handoff neither projects a repair gap nor claims archive success.

#### Scenario: Kaizen capture is unavailable
- **WHEN** the canonical archive workflow cannot open a Kaizen checkpoint
- **THEN** existing complete-archive gates determine whether archive may proceed
- **AND** handoff reports harvest `unavailable` without inventing a persisted repair gap.
