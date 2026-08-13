## MODIFIED Requirements

### Requirement: New OpenSpec changes schedule one final history retrospective

The loaded global authority and maintained OpenSpec propose skill and command SHALL require every newly authored change `tasks.md` to contain exactly one unchecked final-history analysis task as its initially last task. The task SHALL be created once during proposal authoring and SHALL NOT be added by apply, archive, compaction, or its own execution.

The task SHALL require the existing compaction improvement analysis without adding or changing its algorithm: the matrix rows are `Quality`, `Cycle Speed`, and `Token Economy`; the columns are `Working Repository` and `opencode-kit`; each cell contains evidence, the smallest cheap improvement, expected benefit, and cost/risk, or `none`; candidate admission and `Session-Derived Improvements` persistence use the existing canonical rules. The evidence input SHALL be the complete change `history.md` rather than the current session.

#### Scenario: Propose authors the final task once

- **WHEN** the maintained propose workflow creates a new change and finishes authoring `tasks.md`
- **THEN** exactly one unchecked final-history analysis task is present as the last initial task
- **AND** the task names `history.md` and the existing compaction improvement contract.

#### Scenario: Existing change is not retrofitted

- **WHEN** an active or archived change predates this creation rule and its task inventory lacks the final-history analysis task
- **THEN** the workflow does not synthesize the task during apply or archive
- **AND** no historical artifact is rewritten solely to add it.

#### Scenario: Compaction behavior remains unchanged

- **WHEN** automatic compaction analyzes the current session
- **THEN** it retains its existing summary, matrix, admission, and pending-task behavior
- **AND** it does not create or schedule the final `history.md` analysis task.

### Requirement: Final history analysis uses the existing improvement contract

When the final-history analysis task becomes eligible, the loaded apply workflow SHALL analyze the complete `history.md` using the same canonical matrix, admission gate, target ownership, authority rules, and task fields used by compaction. The accepted change outcome SHALL remain the original-goal anchor, while the journal SHALL be the evidence source.

Every admitted candidate SHALL be appended as an unchecked `Session-Derived Improvements` task with `Trigger/Evidence`, `Why`, `Prerequisites`, `Scope/Non-Goals`, `Implementation`, `Observable Proof`, and `Validation`, plus `Owner Blocker` only when applicable. Apply SHALL immediately continue through those generated tasks. If no candidate passes, the analysis SHALL record `none` and SHALL NOT manufacture work.

#### Scenario: Journal evidence admits improvements

- **WHEN** the complete `history.md` supplies one or more candidates that pass the existing compaction admission gate
- **THEN** apply persists every admitted candidate in the existing task format
- **AND** immediately continues normal implementation, proof, validation, and checkoff for those tasks.

#### Scenario: Journal supplies no admissible evidence

- **WHEN** every matrix cell lacks supporting journal evidence or every candidate fails the existing admission gate
- **THEN** the final analysis records `none`
- **AND** creates no generic improvement task.

#### Scenario: Final analysis does not recur

- **WHEN** the final analysis appends one or more ordinary improvement tasks
- **THEN** neither apply nor those tasks append another final-history analysis task
- **AND** the original analysis is not rerun after generated work.
