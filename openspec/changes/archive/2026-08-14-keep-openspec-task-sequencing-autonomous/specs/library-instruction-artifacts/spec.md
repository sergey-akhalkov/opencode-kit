## MODIFIED Requirements

### Requirement: Loaded authority rejects process-only owner questions

The loaded global authority, Material qualification skill, OpenSpec author/apply/archive surfaces, portable project templates, and completion arbiter SHALL distinguish orchestrator-owned process controls from owner-owned outcome and protected-action decisions. They SHALL explicitly classify plan changes, task and path additions, OpenSpec artifact updates, candidate or revision creation, attempt-limit changes, process stop-line changes, task ordering, task-range batching, implementation/reviewer choice, and current-cycle size as autonomous when accepted semantics remain unchanged.

For one already selected active OpenSpec change, pending ordinary tasks and admitted improvement tasks SHALL be treated as accepted implementation work unless the user explicitly bounded the current request to a smaller task set. The main session SHALL choose the smallest dependency-valid next slice that reaches the earliest safe real boundary, using declared dependencies and safety/proof gates before file order, and SHALL continue after current proof and validation instead of asking the owner to select a task range or optional review detour.

Deterministic contracts SHALL require both the positive autonomy marker and the separate protected-action-authority marker on canonical surfaces. The completion arbiter SHALL classify a question asking only whether to modify those process controls or which in-scope task batch to execute as autonomous and SHALL return `continue`, not `owner_required`, while a bounded safe continuation exists.

#### Scenario: Fake choice between spec expansion and stopping is rejected

- **WHEN** a pending question asks the owner to choose between extending an OpenSpec change for a corrected successor attempt and stopping an unfinished accepted goal
- **AND** the successor remains inside accepted semantics and existing action authority
- **THEN** loaded authority treats the question as process-only and continues autonomously
- **AND** the owner is not presented with a choice that has no meaningful product or risk alternative.

#### Scenario: Task-range menu is rejected

- **WHEN** an apply session has multiple pending in-scope task ranges and an optional read-only review path
- **AND** the user did not bound the current request more narrowly and no next-slice action crosses an owner boundary
- **THEN** main selects the smallest dependency-valid slice that reaches the earliest safe real boundary
- **AND** it does not ask the owner to choose the batch, review detour, or amount of work for the current cycle.

#### Scenario: Completion arbiter preserves the exact action boundary

- **WHEN** artifact updates and task sequencing are autonomous but the next underlying action still needs credentials, physical/manual participation, remote/destructive authority, cost, release, or another protected decision
- **THEN** the arbiter permits autonomous preparation
- **AND** returns `owner_required` only for that exact action or decision.

#### Scenario: Explicit user task limit is preserved

- **WHEN** the user explicitly asks to stop after a named task or bounded task range
- **THEN** that current-request limit controls execution
- **AND** the autonomy rule does not silently continue into later tasks.

#### Scenario: Historical records remain evidence

- **WHEN** archived changes contain earlier closed-world attempt or scope wording
- **THEN** validators and runtime routing SHALL treat those files as historical evidence rather than active authority
- **AND** this change SHALL NOT rewrite them merely to remove textual contradictions.
