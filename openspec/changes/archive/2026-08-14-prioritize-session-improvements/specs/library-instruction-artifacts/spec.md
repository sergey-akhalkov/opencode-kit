## MODIFIED Requirements

### Requirement: Compaction analyzes improvement across three directions and two targets
Every compaction summary SHALL evaluate quality, cycle speed, and token economy for both the active working repository and `opencode-kit`. Each of the six cells SHALL record observed session evidence, the smallest cheap improvement, expected benefit, cost/risk, or `none` when the session supplies no supporting evidence.

An improvement candidate SHALL be considered only when it is local, reversible, low-cost, causally linked to an observed loss or opportunity, and does not expand accepted outcome. Every evidence-backed candidate SHALL identify `Impact Horizon`, `Concrete Consumers`, `Execution Class`, `Earliest Safe Point`, `Invalidated Evidence`, and `Observable Payback`; the summary SHALL NOT invent timing, recurrence, savings, consumers, or root cause.

A candidate SHALL be admitted into the active change only when it has an exact remaining current-change consumer and directly accelerates or protects the accepted outcome. `Impact Horizon: Working Repository` SHALL additionally require at least one other exact repository consumer from source or active artifacts, reuse or extension of an existing shared owner, and current-change proof of that shared behavior. Other consumers SHALL NOT be silently implemented by the current change.

When an identifiable writable active OpenSpec change owns an admitted improvement, the main session SHALL immediately append an unchecked item under `## Session-Derived Improvements` in that change's `tasks.md`. The item SHALL state `Trigger/Evidence`, `Why`, `Prerequisites`, `Scope/Non-Goals`, `Implementation`, `Observable Proof`, and `Validation`, the six classification fields, plus `Owner Blocker` only when applicable. It SHALL remain unchecked until implementation and its stated proof and validation are complete.

An evidence-backed candidate with no exact remaining current-change consumer SHALL be deferred rather than admitted. Automatic compaction SHALL emit it under `Deferred Improvement Candidates`; the next session SHALL persist it as a non-checkbox record in the active change `history.md` with its evidence, target, why it was not admitted, and exact re-evaluation condition. A deferred record SHALL NOT become accepted scope or block RC, stable, or complete archive.

Automatic compaction SHALL emit every not-yet-persisted admitted candidate under `Pending Improvement Tasks` because compaction cannot call tools. The next session SHALL reconcile all admitted and deferred entries against `Original User Goal`, persist every still-valid entry before substantial work, and SHALL NOT silently select one candidate and discard the remainder.

An improvement targeting another repository or crossing a protected boundary SHALL NOT be silently implemented in the active change. If it is required by the current accepted outcome, the entry SHALL identify the exact target or `Owner Blocker` and the affected chain SHALL wait for an authorized scoped implementation path. If it has no current consumer, it SHALL remain a non-blocking deferred record rather than blocking normal completion.

#### Scenario: Current-path improvement executes before its consumer
- **WHEN** observed evidence supports an improvement consumed by remaining current-change tasks
- **THEN** the admitted task identifies those exact consumers and the earliest safe execution point
- **AND** its execution class places it before the first consumer rather than merely at the physical end of `tasks.md`.

#### Scenario: Repository multiplier has concrete reuse
- **WHEN** an existing shared owner can serve one remaining current-change task and at least one additional exact repository consumer
- **THEN** the candidate uses `Impact Horizon: Working Repository`, names every evidenced consumer, and is admitted for current-change implementation and proof
- **AND** the current change does not silently implement the additional consumers.

#### Scenario: Evidence-backed future work has no current consumer
- **WHEN** a local reversible candidate has observed evidence but no exact remaining current-change consumer
- **THEN** compaction emits a non-blocking deferred record with `Execution Class: separate-change` and a re-evaluation condition
- **AND** it does not append an unchecked current-change task or block completion.

#### Scenario: Session provides no evidence for a cell
- **WHEN** the session contains no observation supporting an improvement in one target and direction
- **THEN** that cell reports `none`
- **AND** it does not manufacture a generic best practice, consumer, or task.

#### Scenario: Compaction cannot write active files
- **WHEN** automatic compaction classifies admitted and deferred improvements but cannot call file tools
- **THEN** it emits complete admitted records under `Pending Improvement Tasks` and complete deferred records under `Deferred Improvement Candidates`
- **AND** the next active session persists each record in its correct owning artifact before substantial work.

#### Scenario: Kit improvement does not belong to the working change
- **WHEN** an `opencode-kit` candidate is observed while an unrelated project change is active
- **THEN** the agent does not mutate kit files or pretend the project change owns that implementation
- **AND** it blocks only a current dependency chain that requires the kit correction, otherwise preserving the candidate as non-blocking deferred evidence.
