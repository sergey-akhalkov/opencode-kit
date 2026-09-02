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

The kit SHALL read two independent structured facts for a new non-legacy change: `artifactProfile` with value `compact` or `full`, and `riskDisposition.kind` with value `ordinary-small-exact`, `material`, or `unknown`. The metadata reader SHALL normalize both fields absent to the internal `legacy` artifact profile and current legacy-strict behavior. Exactly one field present, an unsupported value, a non-object risk disposition, `compact` with `material`, or `compact` with `unknown` SHALL be invalid. Deterministic tooling SHALL validate explicit shape and correlation only; it SHALL NOT infer risk or artifact profile from prose, paths, changed files, counts, model output, or scores.

A compact proposal with current `ordinary-small-exact` disposition SHALL identify `Outcome`, `Operating Envelope`, `Non-Goals`, `Non-Deferrable Invariants`, `Observable Proof`, and `Stop Line` once. Its `Observable Proof` SHALL be the exact-case claim boundary. A full or legacy proposal SHALL retain `Outcome`, `Operating Envelope`, `Non-Goals`, `Non-Deferrable Invariants`, `Observable Proof`, `Material Residual Risks`, and `Stop Line` in the complete change-level capsule. Proposal, design, specs, and tasks SHALL consume the selected shared contract and add only responsibility-specific deltas. Vague actionable placeholders remain invalid and unreachable future behavior remains outside current acceptance.

#### Scenario: Compact exact proposal establishes a bounded envelope

- **WHEN** OpenSpec resolves proposal instructions for `artifactProfile: compact` with current `riskDisposition.kind: ordinary-small-exact`
- **THEN** authoring requires the six-field compact accepted contract without duplicate no-op declarations
- **AND** later artifacts consume that envelope and any task-specific stronger boundary.

#### Scenario: Proposal establishes the shared envelope

- **WHEN** OpenSpec resolves proposal instructions for a full change with any valid risk disposition
- **THEN** authoring requires the complete seven-field capsule
- **AND** later artifacts reference that envelope rather than restating all fields.

#### Scenario: Both metadata fields are absent

- **WHEN** a current or archived change has neither artifact-profile nor risk-disposition metadata
- **THEN** the reader normalizes the change to internal legacy-strict behavior
- **AND** does not infer Ordinary Small from prose, path, size, or task count.

#### Scenario: Only one metadata field is present

- **WHEN** a change supplies `artifactProfile` without `riskDisposition` or supplies `riskDisposition` without `artifactProfile`
- **THEN** proposal readiness exits non-zero with the exact missing counterpart
- **AND** does not reinterpret the record as legacy, compact, full, Material, or Ordinary Small.

#### Scenario: Compact conflicts with risk disposition

- **WHEN** a change supplies `artifactProfile: compact` with `riskDisposition.kind: material` or `unknown`
- **THEN** proposal readiness exits non-zero before implementation
- **AND** instructs the author to use full artifacts without selecting the final risk disposition.

#### Scenario: Full Ordinary Small remains valid

- **WHEN** an exact Ordinary Small change deliberately selects `artifactProfile: full`
- **THEN** the full artifact contract applies without reclassifying the change as Material
- **AND** all full declarations remain correlated through their existing owners.

#### Scenario: Task has no boundary delta

- **WHEN** an implementation task inherits the selected shared authorization, safeguards, cleanup, and evidence contract unchanged
- **THEN** the task states only its dependency, observable result, focused validation, and any changed fidelity boundary
- **AND** omission of repeated unchanged fields is not an implementation-readiness failure.

#### Scenario: Proposal instructions expose current-increment constraints

- **WHEN** OpenSpec resolves proposal instructions for a repository using the kit rules
- **THEN** the returned context or rules contain the selected artifact contract and explicit risk-disposition constraints
- **AND** they require the next useful working increment rather than exhaustive future design.

#### Scenario: Future behavior remains non-blocking

- **WHEN** a proposed capability includes scale or compatibility behavior unreachable inside the enforced current envelope
- **THEN** the artifacts record that behavior as a non-goal or future scope
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

The normal OpenSpec archive path SHALL refuse to archive a change as complete when artifact-profile-required files are incomplete, accepted product tasks remain unchecked, delta specs require synchronization, applicable validation is absent or red, risk disposition is unknown or stale, compact conflicts with risk, or a declared required automation dividend lacks one checked candidate-correlated task and current consumer proof. A confirmation prompt SHALL NOT waive these conditions. Optional workflow reflection, omitted non-applicable compact mechanisms, and absent no-event history SHALL NOT block complete archive.

The kit MAY preserve intentionally incomplete work through a distinct abandoned or incomplete disposition. That disposition SHALL retain the reason and residual state, SHALL NOT claim all artifacts or tasks are complete, and SHALL NOT synchronize undelivered requirements into main specs.

#### Scenario: Unchecked accepted task blocks complete archive

- **WHEN** normal archive is requested for a change with an unchecked accepted product task
- **THEN** the operation exits non-zero without moving the change into a complete archive
- **AND** the diagnostic identifies the unchecked count.

#### Scenario: Unknown or stale risk blocks complete archive

- **WHEN** normal archive sees `riskDisposition.kind: unknown` or current evidence that invalidates compact Ordinary Small disposition
- **THEN** the operation exits non-zero without moving the change
- **AND** reports the exact unresolved or stale risk fact rather than inferring a replacement.

#### Scenario: No retrospective exists

- **WHEN** valid compact exact artifacts and tasks are complete, validation is green, and no optional mechanism or distinct strategy event occurred
- **THEN** complete archive remains available without horizon-none, dividend-exempt, falsification-exempt, separate claim, or history artifacts
- **AND** no confirmation or process-improvement record is required.

#### Scenario: Unchecked task blocks complete archive

- **WHEN** normal archive is requested for a change with any unchecked accepted task
- **THEN** the operation exits non-zero without moving the change into a complete archive
- **AND** the diagnostic identifies the unchecked count.

#### Scenario: Exempt change has no automation task

- **WHEN** valid compact exact metadata omits the dividend and every accepted product gate is green
- **THEN** complete archive requires no automation task or exemption declaration
- **AND** preserves the structured metadata in the archived change.

#### Scenario: Unpersisted admitted improvement blocks archive

- **WHEN** current continuation evidence contains an admitted required improvement not represented in active tasks
- **THEN** the archive path does not invoke complete archive
- **AND** it persists the owned task or reports the exact owner and target blocker.

#### Scenario: Required dividend completion is missing

- **WHEN** a proposal declares the dividend required but its tagged task or current consumer proof is absent or incomplete
- **THEN** complete archive exits non-zero without moving the change
- **AND** reports the exact candidate-correlated fact that is missing.

#### Scenario: Incomplete work is preserved honestly

- **WHEN** the owner explicitly chooses the supported incomplete-preservation disposition
- **THEN** the retained change is labeled incomplete or abandoned with its reason
- **AND** no output claims implementation or spec synchronization completed.

### Requirement: Operation gates run on the operation path

Every repository-shipped propose, apply, and complete-archive entrypoint SHALL invoke its matching deterministic operation check. A registry operation without a shipped caller SHALL NOT be described as integrated. Failed, blocked, stale, or unknown safety/completion checks SHALL stop the affected operation; warnings SHALL remain non-blocking only when they cannot represent false completion or a non-deferrable risk.

Checks SHALL report only explicit facts available from their inputs and SHALL return `unknown` for unsupported facts rather than inferring semantic quality. Compact SHALL be structurally eligible only with current `ordinary-small-exact`. Material and unknown SHALL require full. Unknown SHALL keep semantic readiness and implementation mutation blocked until resolved. Legacy SHALL retain current declaration checks. Under valid compact exact metadata, omission SHALL mean no Horizon link, no automation dividend, no bounded-falsification episode, no separate exact-case claim record, and no materially distinct strategy event. An explicitly present mechanism SHALL retain its existing gate and correlation behavior.

#### Scenario: Apply executes its gate before mutation

- **WHEN** an apply entrypoint is invoked for a change
- **THEN** its apply gate reads current artifact and risk metadata before implementation mutation
- **AND** a missing, conflicting, stale, or profile-required artifact blocks the apply loop.

#### Scenario: Material trigger appears after compact selection

- **WHEN** current apply evidence identifies a named Material boundary or decision-material surface after compact metadata was reviewed
- **THEN** apply treats compact readiness as stale and stops before substantial mutation
- **AND** full artifacts and a current material or unknown disposition are required before continuation.

#### Scenario: Unknown risk uses full but cannot mutate

- **WHEN** a full change records `riskDisposition.kind: unknown`
- **THEN** structural full-artifact checks may complete while semantic readiness remains `unknown`
- **AND** apply performs no behavior mutation until the risk disposition is resolved.

#### Scenario: Compact omission is not a malformed exemption

- **WHEN** proposal readiness checks valid compact exact metadata with no horizon, dividend, falsification, separate claim record, or strategy history
- **THEN** the gate treats each absent mechanism as not applicable or not observed
- **AND** creates no synthetic exemption record, empty artifact, or task.

#### Scenario: Explicit compact mechanism is correlated

- **WHEN** a compact exact proposal explicitly declares a Horizon, required dividend, broad claim, falsification episode, or strategy-history event
- **THEN** the matching existing parser and correlation checks run
- **AND** compact selection does not waive their completion requirements.

#### Scenario: Propose gate sees a malformed dividend declaration

- **WHEN** proposal readiness checks a full or legacy-strict proposal with a missing, duplicate, or unsupported required declaration
- **THEN** the gate returns non-zero and identifies the declaration source
- **AND** does not select required, exempt, or not-applicable on the author's behalf.

#### Scenario: Archive gate correlates the required dividend task

- **WHEN** archive checks a declared required dividend under compact, full, or legacy behavior
- **THEN** it passes only when exactly one tagged task and its current consumer proof are complete
- **AND** leaves semantic usefulness and product correctness to their reviewed owners.

#### Scenario: Archive gate observes checklist state

- **WHEN** archive checks a change with incomplete accepted tasks
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

#### Scenario: Runtime proof remains temporary
- **WHEN** an active change runs a proof that needs structured intermediate output
- **THEN** the proof writes only to an automatically cleaned temporary directory
- **AND** the active change retains no evidence archive, replay bundle, or separate proof report

### Requirement: Spec Capsule carries proportional claim scope

A full or legacy-strict behavior-changing proposal SHALL add one `Claim And Evidence Scope` record or accepted project-native equivalent. A compact exact proposal SHALL use `Observable Proof` as its exact claim and matching proof boundary and SHALL NOT require a separate claim record. A claim that generalizes beyond exercised cases, composes evidence paths, substitutes behavior, depends on a real system, or asserts finite-population, compatibility, interchangeability, safety, or milestone scope SHALL use full artifacts and identify claim class, population, coverage basis, production and comparison paths, environment, real oracle, unresolved observations, and maximum claim.

Broad changes SHALL state the maximum supported claim directly in the proposal and final handoff. OpenSpec artifact instructions SHALL NOT create a claim ledger, evidence index, or retained review report.

#### Scenario: Ordinary proposal remains concise

- **WHEN** a compact Ordinary Small exact change makes one exact-case claim with one matching local real boundary and no broad trigger
- **THEN** its Observable Proof records the claim and boundary without a separate scope record or population matrix
- **AND** proposal readiness remains proportional.

#### Scenario: Broad proposal declares closure before implementation

- **WHEN** a proposal claims a finite population, substitution, compatibility, safety, or phase result
- **THEN** its artifact profile is full and its claim record names population, paths, coverage basis, real oracle, unknown handling, and ceiling before production mutation
- **AND** later tasks reference that record rather than inventing completion from validation output.

#### Scenario: Partition member classes use compact inheritance

- **WHEN** a schema-v2 partition population omits `materialClasses` while retaining its explicit ordered `members`
- **THEN** the reader resolves material classes to the exact member list before completeness and mismatch evaluation.

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

A full Material proposal SHALL declare bounded falsification as `required - <decision surface>`. A full unknown proposal SHALL leave semantic readiness `unknown` until risk and any resulting review boundary resolve. A full Ordinary Small proposal SHALL use the current full-contract reviewed requirement or compatible exemption. A compact exact proposal SHALL omit the declaration only when current reviewed evidence establishes no decision-material surface. Deterministic tooling SHALL validate profile, disposition, artifact shape, and explicit correlation only; it SHALL NOT infer materiality, task fit, or exemption correctness.

Canonical propose SHALL build all profile-required artifacts, run deterministic operation and strict OpenSpec checks, and describe their result as structural artifact readiness. When falsification is required, propose SHALL supply the original request separately, launch one bounded challenge, let main disposition admitted rows, update affected artifacts, and preserve a current candidate-correlated record before emitting semantic readiness. An absent, stale, unusable, or unknown required review SHALL leave semantic readiness `unknown` without calling structural validation failed.

#### Scenario: Structural gates pass but required challenge is absent

- **WHEN** a full Material proposal's structural checks pass but its required falsification record is missing or stale
- **THEN** propose reports structural artifact readiness and semantic readiness `unknown`
- **AND** does not emit an unqualified implementation-ready statement.

#### Scenario: Required challenge terminates with no material finding

- **WHEN** current full Material artifacts pass structural checks and one bounded challenge returns no material finding with a current main disposition
- **THEN** propose may report semantic readiness for the reviewed candidate
- **AND** it does not add another review or confidence-only correction task.

#### Scenario: Ordinary Small exemption applies

- **WHEN** current evidence records compact plus `ordinary-small-exact`, no decision-material surface exists, and structural checks pass
- **THEN** propose may report bounded semantic readiness without an exemption declaration or reviewer artifact
- **AND** normal runtime proof, validation, safety, and exact Practice Owner routes remain required.

#### Scenario: Unknown risk cannot become semantically ready

- **WHEN** a full proposal records `riskDisposition.kind: unknown`
- **THEN** propose reports semantic readiness `unknown` regardless of structural success
- **AND** does not ask deterministic tooling or a reviewer to choose the product risk disposition.

### Requirement: Apply consumes current review state without reopening a loop

Apply SHALL read current artifact profile, risk disposition, and operation-gate result before substantial implementation. A current full Material terminal falsification episode or current reviewed full-contract exemption SHALL satisfy its respective pre-investment boundary. Compact exact SHALL satisfy the boundary only while current evidence still supports Ordinary Small exact and no decision-material surface exists. Apply SHALL mark compact readiness stale and switch to full before mutation when current evidence exposes a Material trigger, unknown risk, broad claim, or decision-material surface. Apply SHALL NOT relaunch an equivalent review for an unchanged candidate.

#### Scenario: Apply sees a current terminal episode

- **WHEN** original request, candidate, decision surface, risk disposition, and terminal falsification record are current
- **THEN** apply proceeds to the earliest real implementation boundary without another generic review.

#### Scenario: Apply sees current compact exact metadata

- **WHEN** a bounded local reversible change has compact plus current `ordinary-small-exact`, no Material or decision-material trigger, and a passing operation gate
- **THEN** apply proceeds without an exemption declaration or falsification artifact
- **AND** retains normal proof, validation, safety, dependency, and owner-trigger obligations.

#### Scenario: Implementation planning changes a challenged decision

- **WHEN** implementation planning reveals a Material boundary, unresolved risk, broad claim, or decision-material surface
- **THEN** apply stops substantial mutation, changes the profile to full, updates risk disposition and required artifacts, and reruns affected readiness checks
- **AND** does not preserve compact eligibility through prose or previous structural success.

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

A full or legacy-strict proposal SHALL retain one exact `Delivery Horizon` declaration: a valid project-contained Horizon id, or `none` with a concrete reason. A compact exact proposal SHALL omit the declaration when unlinked and SHALL provide an exact valid id only when explicitly part of an existing Horizon. Deterministic checks SHALL validate only metadata and declaration shape, Horizon existence, exact id, and contained schema references. They SHALL NOT infer membership, materiality, progress, forecast, or trigger state from prose, tasks, changed files, or capability names. Legacy active and archived changes remain readable without retroactive metadata.

#### Scenario: Unrelated ordinary change declares none

- **WHEN** a compact exact change is not an implementation or evidence slice for an explicit project Horizon
- **THEN** its proposal contains no Delivery Horizon declaration
- **AND** proposal/apply/archive require no trajectory signal or invented association.

#### Scenario: Full change declares no Horizon

- **WHEN** a full change is not linked to an explicit project Horizon
- **THEN** its proposal declares `Delivery Horizon: none` with the reason
- **AND** no trajectory signal is invented.

#### Scenario: Link names an unknown horizon

- **WHEN** any structured proposal declares an id absent from the explicit project record
- **THEN** proposal readiness reports the exact missing Horizon before implementation
- **AND** the gate does not create, select, or infer a replacement.

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

### Requirement: OpenSpec apply reconciles outcome-preserving delivery route changes
When an evidence-backed delivery checkpoint changes the route for an active OpenSpec dependency lane, apply SHALL preserve the accepted outcome and autonomously update the smallest coherent set of design, tasks, strategy history, attempt controls, stop lines, and evidence dependencies before dependent implementation continues. It SHALL record the superseded route, evidence, do-not-repeat condition, selected route, next observable boundary, and evidence-based suppression or retry condition. It SHALL not require owner approval for those process-control changes when accepted product and proof semantics remain unchanged.

Apply SHALL create no artifact update for a checkpoint that confirms the current route unless a current factual inconsistency must be corrected. A proposed route that narrows accepted population, changes an oracle, weakens an invariant, accepts material risk, or crosses protected semantics SHALL remain parked under existing owner authority while every independent accepted task continues.

#### Scenario: Shift-left canary changes task order
- **WHEN** a delivery checkpoint establishes that a cheaper sufficient canary must precede an existing costly proof task without changing its accepted oracle
- **THEN** apply records the prior route in history and updates the dependency-valid task order and proof boundary
- **AND** continues without asking whether agent-authored planning may change.

#### Scenario: Route isolation narrows evidence invalidation
- **WHEN** current dependency evidence establishes that a volatile evaluator or runner identity can be isolated from unchanged prerequisite captures without altering driven behavior or recorded facts
- **THEN** apply updates the design and evidence dependencies to invalidate only affected lanes
- **AND** any replay or caching equivalence claim remains governed by its existing qualification owner.

#### Scenario: Current route is already minimal
- **WHEN** a checkpoint finds no safe outcome-preserving improvement and current planning remains factually coherent
- **THEN** apply resumes the current route without changing proposal, design, specs, tasks, or history solely to document reflection
- **AND** no optional optimization task blocks implementation or archive.

#### Scenario: Faster proposal changes proof scope
- **WHEN** an optimization would remove accepted population members or replace a required real boundary with a weaker oracle
- **THEN** apply does not adopt or encode that route as accepted work without the exact owner decision
- **AND** continues every option-invariant task before any eligible product question.

### Requirement: OpenSpec authoring and apply preserve leaf-first task dependencies
Canonical OpenSpec propose SHALL author the smallest dependency-bearing tasks needed to isolate independently falsifiable prerequisites before a costly or integration boundary. Canonical apply SHALL re-evaluate task granularity when current evidence exposes a required hidden prerequisite, distinguish a local same-leaf defect from an independent child or integration failure, and autonomously add, reopen, or reorder only the affected task and dependency controls while accepted semantics remain unchanged.

A parent task SHALL remain unchecked and unselectable until every required child has current evidence. Checked child tasks SHALL NOT supply parent completion evidence. Task authoring SHALL keep grouped mechanical edits with one owner and oracle together and SHALL NOT impose per-file tasks or numeric granularity rules. Archive and completion checks SHALL treat a still-unresolved child or missing parent integration oracle as incomplete even when the earlier coarse parent checkbox was checked.

#### Scenario: Propose receives compound implementation work
- **WHEN** proposal and design evidence identify two independently testable prerequisites before one integration result
- **THEN** tasks represent those prerequisites as leaves and the integration task as their dependent parent
- **AND** implementation readiness does not rely on one coarse checklist item.

#### Scenario: Apply discovers an independent prerequisite
- **WHEN** an existing task cannot reach its oracle because current evidence exposes a distinct required prerequisite
- **THEN** apply creates the smallest child task, updates the affected dependency, leaves the parent unchecked, and continues from the child
- **AND** does not request process approval or alter unrelated accepted tasks.

#### Scenario: Same-leaf defect avoids planning churn
- **WHEN** task proof fails with a local actionable cause inside its existing owner and boundary
- **THEN** apply keeps the current task shape and performs ordinary local correction
- **AND** does not add a child merely because one attempt failed.

#### Scenario: Checked coarse parent is no longer truthful
- **WHEN** current evidence proves that a checked parent omitted an unresolved required child or never ran its own integration oracle
- **THEN** apply or archive reopens the parent and adds the smallest required dependency closure
- **AND** preserves prior evidence at its narrower truthful leaf ceiling.

### Requirement: Strategy history exists only for material strategy continuity

A new OpenSpec change SHALL create `history.md` only after one or more materially distinct approaches were considered, attempted, rejected, superseded, or preserved for retry continuity. A change with no such strategy event SHALL omit the file. Once created, history SHALL remain attributable and contain only objective, approach, evidence, outcome, reason, do-not-repeat condition, and evidence-based retry condition for actual strategies. Full artifact selection alone SHALL NOT manufacture an empty history file.

#### Scenario: First direct compact strategy has no history artifact

- **WHEN** proposal authoring selects one direct approach and no distinct alternative or failed attempt exists
- **THEN** the change contains no `history.md`
- **AND** structural readiness does not require an empty heading or no-attempt statement.

#### Scenario: Distinct strategy is rejected

- **WHEN** current evidence causes a materially distinct approach to be rejected or superseded
- **THEN** the change creates or appends one attributable strategy-history entry
- **AND** later retries obey its do-not-repeat and evidence-based retry conditions.
