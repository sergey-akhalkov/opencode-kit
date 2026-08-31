## MODIFIED Requirements

### Requirement: Spec Capsule is injected at artifact generation

The kit SHALL support one reviewed machine-readable change profile in `.openspec.yaml`: `ordinary-small` or `material`. A new `ordinary-small` proposal SHALL identify its accepted outcome, observable proof, and stop line once; its normal proposal sections and the standard Ordinary Small contract SHALL provide the project-native operating envelope, non-goals, and non-deferrable invariants. A `material` proposal SHALL identify `Outcome`, `Operating Envelope`, `Non-Goals`, `Non-Deferrable Invariants`, `Observable Proof`, `Material Residual Risks`, and `Stop Line` in the complete change-level capsule. Missing profile metadata SHALL retain compatible legacy strict behavior. Proposal, design, specs, and tasks SHALL consume the selected shared contract and add only responsibility-specific deltas. The rules SHALL reject vague actionable placeholders and keep unreachable future behavior outside current acceptance.

#### Scenario: Ordinary Small proposal establishes a compact envelope

- **WHEN** OpenSpec resolves proposal instructions for a new `ordinary-small` change
- **THEN** proposal authoring requires the accepted outcome, observable proof, and stop line without requiring duplicate explicit no-op fields
- **AND** later artifacts consume the standard Ordinary Small envelope and any task-specific stronger boundary.

#### Scenario: Proposal establishes the shared envelope

- **WHEN** OpenSpec resolves proposal instructions for a `material` change
- **THEN** proposal authoring requires the complete current-increment capsule
- **AND** later artifact instructions reference that envelope rather than restating all seven fields.

#### Scenario: Missing profile remains strict

- **WHEN** a current or legacy change has no readable profile metadata
- **THEN** operation checks retain the existing complete capsule behavior
- **AND** do not infer Ordinary Small from prose, paths, size, or task count.

#### Scenario: Task has no boundary delta

- **WHEN** an implementation task inherits the selected shared authorization, safeguards, cleanup, and evidence contract unchanged
- **THEN** the task states only its dependency, observable result, and focused validation
- **AND** omission of repeated unchanged fields is not an implementation-readiness failure.

#### Scenario: Proposal instructions expose current-increment constraints

- **WHEN** OpenSpec resolves proposal instructions for a repository using the kit rules
- **THEN** the returned context or rules contain the selected profile's capsule requirements
- **AND** they require the next useful working increment rather than exhaustive future design.

#### Scenario: Future behavior remains non-blocking

- **WHEN** a proposed capability includes future scale or compatibility behavior unreachable inside the enforced current envelope
- **THEN** the artifacts record that behavior as non-goal or future scope
- **AND** implementation readiness does not require resolving it.

### Requirement: Operation gates run on the operation path

Every repository-shipped propose, apply, and complete-archive entrypoint SHALL invoke its matching deterministic operation check. A registry operation without a shipped caller SHALL NOT be described as integrated. Failed, blocked, or unknown safety/completion checks SHALL stop the affected operation; warnings SHALL remain non-blocking only when they cannot represent false completion or a non-deferrable risk.

Checks SHALL report only explicit facts available from their inputs and SHALL return `unknown` for unsupported facts rather than inferring semantic quality. For a `material` or legacy-strict proposal, propose SHALL retain current declaration checks. For an `ordinary-small` proposal, omission SHALL mean no horizon link, no automation dividend, and no bounded-falsification episode; an explicitly present linked horizon, required dividend, or required review SHALL still be validated and correlated through its existing gate. No gate SHALL infer profile, recurrence, helper value, or exemption validity from unstructured prose.

#### Scenario: Apply executes its gate before mutation

- **WHEN** an apply entrypoint is invoked for a change
- **THEN** its apply gate runs before implementation mutation
- **AND** a missing profile-required artifact blocks the apply loop.

#### Scenario: Archive gate observes checklist state

- **WHEN** archive checks a change with incomplete accepted tasks
- **THEN** the gate reports a blocking failure
- **AND** the archive caller does not downgrade it to a confirmation-only warning.

#### Scenario: Ordinary omission is not a malformed exemption

- **WHEN** proposal readiness checks a valid `ordinary-small` proposal with no horizon, dividend, or falsification declaration
- **THEN** the gate treats each omitted optional mechanism as not applicable
- **AND** creates no synthetic exemption record or task.

#### Scenario: Propose gate sees a malformed dividend declaration

- **WHEN** proposal readiness checks a `material` or legacy-strict proposal with a missing, duplicate, or unsupported currently required declaration
- **THEN** the gate returns non-zero and identifies the declaration source
- **AND** does not select required, exempt, or not-applicable on the author's behalf.

#### Scenario: Archive gate correlates the required dividend task

- **WHEN** archive checks a required dividend declaration and its tagged task under either profile
- **THEN** it passes only when exactly one tagged task exists and is checked
- **AND** leaves semantic usefulness and accepted product correctness to their owning reviewed declaration and product gates.

### Requirement: Complete archive fails closed

The normal OpenSpec archive path SHALL refuse to archive a change as complete when profile-required artifacts are incomplete, accepted product tasks remain unchecked, delta specs require synchronization, applicable validation evidence is absent or red, or a proposal-declared required automation dividend lacks one checked candidate-correlated task and current evidence row. A confirmation prompt SHALL NOT waive these completion conditions. Optional workflow reflections, deferred ideas, absent final-history analysis, omitted non-applicable Ordinary Small mechanisms, and uncreated process-improvement tasks outside a declared required dividend SHALL NOT block complete archive.

The kit MAY preserve intentionally incomplete work through a distinct abandoned or incomplete disposition. That disposition SHALL retain the reason and residual state, SHALL NOT claim all artifacts or tasks are complete, and SHALL NOT synchronize undelivered requirements into main specs.

#### Scenario: Unchecked accepted task blocks complete archive

- **WHEN** normal archive is requested for a change with an unchecked accepted product task
- **THEN** the operation exits non-zero without moving the change into a complete archive
- **AND** the diagnostic identifies the unchecked count.

#### Scenario: No retrospective exists

- **WHEN** accepted profile-required artifacts and tasks are complete, validation is green, any required dividend is complete, and no final-history retrospective exists
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

- **WHEN** a valid `ordinary-small` proposal omits the dividend and every accepted product gate is green
- **THEN** complete archive does not require an automation task or exemption declaration
- **AND** preserves the selected profile in the archived change.

#### Scenario: Unpersisted admitted improvement blocks archive

- **WHEN** current continuation evidence contains an admitted required improvement not yet represented in the active `tasks.md`
- **THEN** the archive path does not invoke complete archive
- **AND** it persists the owned improvement as an unchecked task or reports the exact owner/target blocker.

#### Scenario: Incomplete work is preserved honestly

- **WHEN** the owner explicitly chooses the supported incomplete-preservation disposition
- **THEN** the retained change is labeled incomplete or abandoned with its reason
- **AND** no output claims implementation or spec synchronization completed.

### Requirement: Spec Capsule carries proportional claim scope

A `material` or legacy-strict behavior-changing proposal SHALL add one `Claim And Evidence Scope` record or accepted project-native equivalent. An `ordinary-small` exact-case proposal SHALL use its `Observable Proof` as the exact claim and matching proof boundary and SHALL NOT require a separate claim-scope declaration. When any profile makes a claim that generalizes beyond exercised cases, composes evidence paths, substitutes behavior, depends on a real system, or asserts finite-population, partitioned-domain, compatibility, interchangeability, safety, or phase/milestone scope, the proposal SHALL use the broad record and identify the claim class, population, coverage basis, production and comparison paths, environment, real oracle, unresolved observations, and maximum claim.

Broad changes SHALL state the maximum supported claim directly in the proposal and final handoff. OpenSpec artifact instructions SHALL NOT create a claim ledger, evidence index, or retained review report.

#### Scenario: Ordinary proposal remains concise

- **WHEN** an `ordinary-small` behavior change makes one exact-case claim with one matching local real boundary and no broad trigger
- **THEN** its Observable Proof records the exact claim and boundary without a separate claim-scope record, population matrix, or independent assurance task
- **AND** proposal readiness remains proportional.

#### Scenario: Broad proposal declares closure before implementation

- **WHEN** a proposal under either profile claims a finite population, substitution, compatibility, safety, or phase/milestone result
- **THEN** its Claim And Evidence Scope names the population, paths, coverage basis, real oracle, unknown handling, and claim ceiling before production mutation
- **AND** later tasks reference that record rather than inventing completion from validation output.

#### Scenario: Partition member classes use compact inheritance

- **WHEN** a schema-v2 partition population omits `materialClasses` while retaining its explicit ordered `members`
- **THEN** the reader resolves material classes to the exact member list before completeness and mismatch evaluation.

### Requirement: Propose separates structural and semantic readiness

A `material` or legacy-strict behavior-changing proposal SHALL declare bounded falsification as `required - <decision surface>` or use its existing reviewed legacy exemption. A new `ordinary-small` exact proposal SHALL omit the declaration and SHALL be structurally eligible only when its profile, bounded local envelope, proof boundary, and absence of a Material trigger are reviewed main-owned inputs. Deterministic tooling SHALL validate only profile and artifact shape and SHALL NOT infer profile, materiality, task-fit, or exemption correctness from prose or counts.

Canonical propose SHALL build all profile-required artifacts, run deterministic operation and strict OpenSpec checks, and describe their result as structural artifact readiness. When falsification is required, propose SHALL supply the original accepted request separately, launch one fresh bounded challenge, let main disposition admitted rows, update affected artifacts, and preserve a candidate-correlated record before emitting semantic implementation readiness. An absent, stale, or unusable required challenge SHALL leave semantic readiness `unknown` without inventing defects or calling structural validation failed.

#### Scenario: Structural gates pass but required challenge is absent

- **WHEN** a Material proposal's required artifacts and structural gates pass but the required falsification record is missing or stale
- **THEN** propose reports structural artifact readiness and semantic readiness `unknown`
- **AND** it does not emit an unqualified `Ready for implementation` statement.

#### Scenario: Required challenge terminates with no material finding

- **WHEN** current artifacts pass structural checks and one fresh required challenge returns `no-material-finding` with a current main disposition
- **THEN** propose may report the change semantically ready for implementation
- **AND** it does not add another review or correction task.

#### Scenario: Ordinary Small exemption applies

- **WHEN** main records `ordinary-small` for an exact owner-local reversible change with no decision-material surface and structural checks pass
- **THEN** propose may report the bounded change semantically ready for implementation
- **AND** no exemption declaration or empty reviewer artifact is manufactured.

### Requirement: Apply consumes current review state without reopening a loop

Apply SHALL read the selected change profile and operation-gate result before substantial implementation. For `material` or legacy-strict behavior, a current terminal falsification episode or current reviewed legacy exemption SHALL satisfy this pre-investment boundary. For `ordinary-small`, the reviewed profile, bounded exact-case envelope, and successful structural gate SHALL satisfy the boundary without a proposal declaration or reviewer artifact. Apply SHALL stop and correct the profile when current evidence exposes a Material trigger or decision surface. Apply SHALL NOT relaunch an equivalent review for the unchanged candidate, and implementation that stays within the challenged decision surface SHALL NOT require a duplicate generic post-proof review.

#### Scenario: Apply sees a current terminal episode

- **WHEN** the original request, candidate, decision surface, and terminal falsification record are current for a Material change
- **THEN** apply proceeds to the earliest real implementation boundary without asking for or launching another generic review.

#### Scenario: Apply sees a reviewed Ordinary Small profile

- **WHEN** an exact owner-local reversible change has `profile: ordinary-small`, no current Material trigger, and a passing operation gate
- **THEN** apply proceeds without requiring an exempt declaration or falsification record
- **AND** retains normal runtime proof, validation, safety, and owner-trigger obligations.

#### Scenario: Implementation planning changes a challenged decision

- **WHEN** apply must change the challenged outcome, envelope, invariant, proof boundary, owner decision, or material-risk surface before implementation can continue
- **THEN** it marks the affected review state stale, corrects an invalid Ordinary Small profile when applicable, and uses only the remaining episode budget or exact owner evidence
- **AND** it does not reset an exhausted episode on the same accepted outcome.

### Requirement: OpenSpec changes SHALL link delivery horizons explicitly

A new `material` or legacy-strict proposal SHALL retain one exact `Delivery Horizon` declaration: a valid project-contained horizon id, or `none` with a concrete reason. A new `ordinary-small` proposal SHALL omit the declaration when unlinked and SHALL provide an exact valid horizon id only when the change is explicitly part of an existing project Delivery Horizon. Deterministic checks SHALL validate only profile and declaration shape, horizon existence, exact id, and contained schema references. They SHALL NOT infer roadmap membership, materiality, progress, forecast, or trigger state from proposal prose, tasks, changed files, or capability names. Legacy active and archived changes SHALL remain readable without retroactive profile or linkage.

#### Scenario: Unrelated ordinary change declares none

- **WHEN** a new `ordinary-small` change is not an implementation or evidence slice for an explicit project Delivery Horizon
- **THEN** its proposal contains no Delivery Horizon declaration
- **AND** proposal/apply/archive remain proportional without a trajectory signal or invented project-level association.

#### Scenario: Material change declares none

- **WHEN** a new `material` change is not linked to an explicit project Delivery Horizon
- **THEN** its proposal declares `Delivery Horizon: none` with the reason
- **AND** no trajectory signal is invented.

#### Scenario: Link names an unknown horizon

- **WHEN** a new proposal under either profile declares a horizon id absent from the explicit project record
- **THEN** proposal readiness reports the exact missing horizon before implementation
- **AND** the gate does not create, select, or infer a replacement horizon.

## ADDED Requirements

### Requirement: Strategy history exists only for material strategy continuity

A new OpenSpec change SHALL create `history.md` only after one or more materially distinct approaches were considered, attempted, rejected, superseded, or preserved for retry continuity. A change with no such strategy event SHALL omit the file. Once created, history SHALL remain attributable and SHALL contain only objective, approach, evidence, outcome, reason, do-not-repeat condition, and evidence-based retry condition for actual strategies.

#### Scenario: First direct strategy has no history artifact

- **WHEN** proposal authoring selects one direct approach and no distinct alternative or failed attempt exists
- **THEN** the change contains no `history.md`
- **AND** structural readiness does not require an empty heading or no-attempt statement.

#### Scenario: Distinct strategy is rejected

- **WHEN** current evidence causes a materially distinct approach to be rejected or superseded
- **THEN** the change creates or appends one attributable strategy-history entry
- **AND** later retries obey its do-not-repeat and evidence-based retry conditions.
