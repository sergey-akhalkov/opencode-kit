## MODIFIED Requirements

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

## ADDED Requirements

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
