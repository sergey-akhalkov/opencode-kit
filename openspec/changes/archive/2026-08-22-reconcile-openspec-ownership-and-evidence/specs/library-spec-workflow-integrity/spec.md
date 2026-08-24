## ADDED Requirements

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
