# library-complexity-management Specification

## Purpose
Define a portable, evidence-backed development loop that keeps complex projects
understandable through cohesive owners and useful simple interfaces without rewarding
speculative abstraction or replacing semantic judgment with a score.

## Requirements

### Requirement: Complexity management is proportional to observed pressure

The kit SHALL provide one project-neutral complexity-management workflow with three
proportional modes: an ordinary change delta check, a focused comprehension/refactoring
assessment, and an explicit whole-project assessment. Ordinary work with no concrete
complexity signal SHALL remain direct and SHALL NOT require a durable report or reviewer.
A focused assessment SHALL begin on an explicit pre-expansion complexity or
current-scenario refactoring assessment or when,
after targeted foraging and existing Practice Owner routing, current evidence still shows
an ambiguous extension surface, unrelated context required to understand the changed
behavior, one concept scattered across unrelated owners, hidden material effects or
failures, or search noise that prevents the current change from reaching its maintained
owner. A proposed new seam by itself SHALL use the existing architecture Practice Owner
route and SHALL NOT automatically load the focused workflow for the same trigger. An
explicitly broad or exhaustive request SHALL reuse the maintained codebase audit and
ledger workflow in review-only mode unless the user separately accepts audit-and-fix.

#### Scenario: Cohesive local change stays direct

- **WHEN** one accepted change is understandable and testable through one cohesive owner and narrow neighbors and introduces no new seam
- **THEN** main records the ordinary architecture delta in its normal handoff without loading a whole-project complexity workflow
- **AND** no reviewer, persistent map, score, or refactoring task is created solely for compliance.

#### Scenario: Context pressure reaches a current change

- **WHEN** after exact Practice Owner routing is completed or shown not applicable, a developer still must load unrelated responsibilities or choose among competing extension surfaces to make the accepted change safely
- **THEN** main performs a focused Architecture Comprehension Map and Change Rehearsal before expanding the implementation
- **AND** the assessment remains scoped to the affected consumer, owner, and proof boundary without re-launching an owner for the same reviewed fact.

#### Scenario: User requests a project-wide assessment

- **WHEN** the user explicitly requests a whole-project or exhaustive complexity assessment
- **THEN** the workflow reuses `codebase-audit-loop` and its ledger for coverage when those owners are discovered, otherwise reports project mode unavailable
- **AND** does not approximate complete coverage, create a second exhaustive audit, automatically enter audit-and-fix, or require a map for every reviewed block.

### Requirement: Project mode records pressure on existing audit rows

Project mode SHALL add one `Complexity Pressure Matrix` to the existing audit output with
these fields: area or subsystem, current consumer/change scenario, observed context or
change pressure, source/test/runtime evidence, current owner or `unknown`, entrypoint,
admission class (`current-dependency`, `accepted-refactor`, `deferred-debt`, or
`unknown`), and focused-scenario reference or `none`. It SHALL reuse existing ledger
coverage and finding rows, SHALL remain review-only by default, and SHALL NOT create an
Architecture Comprehension Map or Change Rehearsal for every block.

#### Scenario: Exhaustive audit finds deferred complexity

- **WHEN** project-mode review finds valid mixed ownership that does not affect a current accepted change or separately accepted refactor
- **THEN** its matrix row records `deferred-debt`, evidence, owner, and `focused-scenario: none`
- **AND** the ledger does not admit mutation or require a focused map solely to close coverage.

#### Scenario: Project finding becomes an accepted refactor

- **WHEN** the user separately accepts one project-mode finding as a refactoring outcome
- **THEN** the row records `accepted-refactor` and links one named focused scenario
- **AND** that focused scenario owns the map, rehearsal, mutation, and same-boundary proof.

### Requirement: Focused Architecture Comprehension Map exposes the useful system boundary

A focused assessment SHALL produce an Architecture Comprehension Map that names the
accepted project or subsystem outcome, current cohesive owners, consumer
entrypoints, intended extension surfaces, internal details consumers need not know,
dependency and effect directions, material failure/lifecycle boundaries, representative
proof entrypoints, compatibility or non-extension surfaces, and unknown or unreadable
areas. The map SHALL reference current source, manifests, tests, schemas, runtime output,
or explicit decisions and SHALL distinguish those facts from inference. It SHALL use an
existing project-native architecture owner when one exists and SHALL NOT require one
fixed repository path, language, framework, or service topology.

#### Scenario: Existing facade hides a complex subsystem

- **WHEN** current consumers use one narrow facade while its subsystem contains several internal stages
- **THEN** the map identifies the facade as the consumer entrypoint and the stages as hidden internals
- **AND** it records material effects, failures, lifecycle, and proof paths that still cross the facade.

#### Scenario: Two extension surfaces compete

- **WHEN** current source and tests expose a frozen compatibility path and a different current semantic pipeline
- **THEN** the map labels each path, its consumers, and its extension status from evidence
- **AND** it does not recommend deletion or silently present both as interchangeable.

#### Scenario: Architecture evidence is incomplete

- **WHEN** a component, entrypoint, effect boundary, or source region is unreadable or unsupported
- **THEN** the map records that area as `unknown`, `unreadable`, `unsupported`, or `blocked`
- **AND** does not represent the project or affected subsystem as fully understood.

### Requirement: Change Rehearsal measures complexity through a real consumer task

Every focused refactoring assessment SHALL use one current accepted change or one
explicit realistic consumer scenario. Before refactoring, the Change Rehearsal SHALL
record the consumer-visible task, current entrypoint, essential files/symbols/documents
and concepts needed to reason about it, expected edit locations, material effects and
failures, and representative runtime/test proof. The workflow SHALL explain why each
context item is essential rather than use a raw file or token count as a quality score.

#### Scenario: Scenario requires unrelated context

- **WHEN** the same consumer task cannot be explained or changed without reading an unrelated subsystem or policy surface
- **THEN** the rehearsal records the exact context dependency and its impact on change safety
- **AND** identifies the responsible mixed boundary or records the owner as unknown.

#### Scenario: Large cohesive owner remains understandable

- **WHEN** a large owner exposes one clear entrypoint and the rehearsal needs only that owner and its narrow proof neighbor
- **THEN** the workflow records the navigation signal but does not require extraction from line count alone
- **AND** preserves the cohesive implementation when a split would add indirection without reducing consumer context.

### Requirement: Abstractions must earn a smaller consumer model

An abstraction candidate SHALL name its current consumer or evidence-backed change
axis, current owner, behavior and invariants hidden, public contract exposed, material
effects/errors/lifecycle retained at the boundary, and the before/after Change Rehearsal.
The workflow SHALL prefer remove, isolate irrelevant search noise, narrow public surface,
reuse, or reshape the current owner before extracting a facade or introducing a
multi-implementation abstraction. A facade MAY serve one current consumer when it hides
a cohesive complex subsystem and demonstrably reduces consumer knowledge. An interface,
strategy, plugin point, generic framework, or option matrix SHALL require current
variation or a named reachable change axis and SHALL NOT be justified by hypothetical
flexibility or a pattern name.

#### Scenario: Facade provides current encapsulation value

- **WHEN** a current consumer otherwise coordinates several stable internal stages and one narrow facade preserves behavior and explicit failure/effect semantics
- **THEN** the workflow may admit the facade even with one current implementation
- **AND** same-scenario evidence must show that the consumer no longer needs those internal stages.

#### Scenario: Wrapper only forwards calls

- **WHEN** a proposed layer forwards the same operations and types without hiding a cohesive responsibility, narrowing the contract, or localizing a named change
- **THEN** the workflow rejects the layer as added navigation cost
- **AND** retains the direct implementation or selects a smaller remove/narrow/reshape response.

#### Scenario: Generic framework has no current variation

- **WHEN** a proposed framework, factory, plugin point, or strategy exists only for imagined future implementations
- **THEN** the workflow rejects it from the current increment
- **AND** records the future idea as non-goal rather than adding extension machinery.

### Requirement: Refactor admission and completion use the same proof boundary

A complexity finding SHALL become current refactoring work only when it blocks the
accepted change, would make the current change add structural degradation, or has an
explicit separately accepted refactoring outcome. Other pre-existing project debt SHALL
remain visible but deferred. An admitted behavior-preserving refactor SHALL first capture
the current representative scenario, then implement the smallest cohesive correction,
and finally replay the same scenario and applicable project-native validation. Completion
SHALL require preserved consumer behavior and effects plus an evidence-backed reduction
or clarification in essential context, public surface, scattered edits, or ownership.
Moving unchanged complexity behind more files SHALL NOT satisfy the requirement.

#### Scenario: Current change would worsen a mixed owner

- **WHEN** the accepted behavior would add a second responsibility to an already mixed owner
- **THEN** one cohesive extraction or owner reshape is admitted inside the current dependency closure
- **AND** the original behavior and accepted change are proved through the same representative boundary.

#### Scenario: Finding is unrelated project debt

- **WHEN** a complexity finding does not affect the accepted change, a non-deferrable invariant, or a separately accepted refactoring outcome
- **THEN** the workflow records it as a limitation or follow-up candidate without mutating production
- **AND** it does not block completion or create an autonomous polishing loop.

#### Scenario: Refactor only redistributes code

- **WHEN** post-refactor evidence shows the consumer must understand the same internals and touch the same scattered owners through additional wrappers
- **THEN** the workflow does not claim a complexity improvement
- **AND** the candidate is corrected, reverted through an authorized safe path, or reported as not improved before handoff.

### Requirement: Existing practice ownership remains authoritative

The complexity workflow SHALL keep main responsible for semantic assessment, design,
mutation, runtime proof, and disposition. A named new seam, mixed responsibility, or
evidence-backed change axis SHALL route only to the existing
`architecture-and-change-locality` Practice Owner when its trigger applies. An explicit
sibling of a live owner or decision-changing same-versus-new uncertainty SHALL route only
to the existing `simplicity-and-reuse` Practice Owner. The workflow SHALL NOT add a new
Practice Owner, autonomous architect, every-task reviewer sequence, or reviewer-owned
refactoring authority.

#### Scenario: New seam is decision-changing

- **WHEN** an explicitly requested focused rehearsal identifies a materially distinct supported mixed-owner boundary or named change axis that has not already received its required Practice Owner observation
- **THEN** main obtains one bounded architecture Practice Owner observation
- **AND** main retains the design and refactoring decision.

#### Scenario: Same owner can absorb the change

- **WHEN** the accepted case has the same responsibility as an existing cohesive owner and no sibling or uncertainty trigger applies
- **THEN** main extends that owner directly
- **AND** no Practice Owner is launched solely because the complexity workflow ran.

#### Scenario: New seam already triggers architecture ownership

- **WHEN** a proposed new seam or mixed responsibility matches the registered architecture Practice Owner trigger and no separate comprehension assessment was requested
- **THEN** main obtains only that bounded Practice Owner observation for the design question
- **AND** does not load the focused complexity workflow solely for the same trigger.
