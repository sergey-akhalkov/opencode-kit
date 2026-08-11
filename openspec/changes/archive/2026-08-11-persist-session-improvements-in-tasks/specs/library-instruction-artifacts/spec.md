## MODIFIED Requirements

### Requirement: Compaction analyzes improvement across three directions and two targets
Every compaction summary SHALL evaluate quality, cycle speed, and token economy for both the active working repository and `opencode-kit`. Each of the six cells SHALL record observed session evidence, the smallest cheap improvement, expected benefit, cost/risk, or `none` when the session supplies no supporting evidence.

An improvement candidate SHALL be admitted only when it is local, reversible, low-cost, causally linked to an observed loss or opportunity and the original user goal, and does not expand accepted scope. The summary SHALL NOT invent timing, recurrence, savings, or root cause.

When an identifiable writable active OpenSpec change owns an admitted improvement, the main session SHALL immediately append an unchecked item under `## Session-Derived Improvements` in that change's `tasks.md`. The item SHALL state `Trigger/Evidence`, `Why`, `Prerequisites`, `Scope/Non-Goals`, `Implementation`, `Observable Proof`, and `Validation`, plus `Owner Blocker` only when applicable. It SHALL remain unchecked until implementation and its stated proof and validation are complete.

Automatic compaction SHALL emit every not-yet-persisted admitted candidate under `Pending Improvement Tasks` because compaction cannot call tools. The next session SHALL reconcile all such entries against `Original User Goal` and persist every still-admissible entry before substantial work. It SHALL NOT silently select one candidate and discard the remainder.

An improvement that belongs to another repository, expands outcome, or crosses a protected boundary SHALL NOT be silently implemented in the active change. The entry SHALL identify the exact target or owner blocker, and normal completion SHALL wait for an authorized scoped implementation path or an explicit owner change to accepted scope.

#### Scenario: Session provides evidence in every direction
- **WHEN** a session observes multiple distinct working-repository improvements and each passes the admission gate
- **THEN** every admitted improvement is appended to the owning active change's `tasks.md` with the required evidence and completion fields
- **AND** no candidate is dropped merely because another candidate has higher ROI.

#### Scenario: Session provides no evidence for a cell
- **WHEN** the session contains no observation supporting an improvement in one target and direction
- **THEN** that cell reports `none`
- **AND** it does not manufacture a generic best practice or task.

#### Scenario: Kit improvement would distract from incomplete project work
- **WHEN** the original project goal remains incomplete and a non-blocking kit improvement is available
- **THEN** the next action remains the highest-value project-goal action
- **AND** the kit candidate stays recorded without mutation.

#### Scenario: Compaction cannot write the active task file
- **WHEN** automatic compaction admits one or more improvements but cannot call file tools
- **THEN** it emits each complete task record under `Pending Improvement Tasks`
- **AND** the next active session persists every still-admissible entry before substantial work.

#### Scenario: Kit improvement does not belong to the working change
- **WHEN** an `opencode-kit` candidate is observed while an unrelated project change is active
- **THEN** the agent does not mutate kit files or pretend the project change owns that implementation
- **AND** the active task record identifies the target/owner blocker that must be resolved before normal completion or explicit scope change.

### Requirement: Continuous improvement serves the operating priorities
Continuous learning, workflow feedback, and deterministic automation SHALL remain mechanisms serving quality, autonomy, and speed rather than a mandatory fourth stage or peer priority. A candidate that fails the improvement admission gate SHALL NOT delay the accepted outcome. A candidate that passes that gate during an active OpenSpec change becomes accepted completion scope through its evidence-rich task and SHALL be implemented before normal completion unless an exact protected-boundary or target-ownership blocker requires owner resolution.

#### Scenario: Repeated manual step is locally replaceable
- **WHEN** a small deterministic helper is necessary for the accepted outcome or directly replaces repeated in-scope manual work and passes the admission gate
- **THEN** the agent SHALL add and implement the corresponding session-derived task within the smallest sufficient dependency closure
- **AND** SHALL verify its explicit inputs, outputs, stable ordering, and failure behavior before checking the task.

#### Scenario: Broader reusable improvement is outside scope
- **WHEN** an improvement is useful but fails the no-scope-expansion or target-ownership admission condition
- **THEN** it SHALL NOT silently expand the product candidate or disappear as advisory prose
- **AND** its task record SHALL name the exact owner disposition needed before normal completion or an explicit change to accepted scope.
