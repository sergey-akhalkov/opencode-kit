## ADDED Requirements

### Requirement: Mission continuation is evidence-gated rather than count-limited

The main session SHALL distinguish a finite execution invocation from the accepted
mission that invocation serves. An invocation authorization, process identity, or
output root MAY be one-shot and non-reusable, but an agent-authored attempt count,
`zero retries`, `no successor`, checked task list, or process stop line SHALL NOT
place a fixed total limit on causally distinct successors while the accepted
outcome remains unfinished.

A successor SHALL require a decision-changing causal delta, preservation and
offline evaluation of prior evidence where applicable, current authority for the
underlying action, known ownership and cleanup, and every current safety,
restoration, identity, liveness, and live-attempt prerequisite. Without those
facts, only the affected action SHALL remain blocked. With those facts, main SHALL
update process controls and continue without asking the owner to approve another
attempt number.

#### Scenario: One-shot invocation does not terminate the mission

- **WHEN** one bounded live invocation is finalized without the accepted outcome
- **AND** diagnosis proves a causally distinct correction, preserved replay is terminal, and existing authority and safety prerequisites cover a successor
- **THEN** the original invocation identity and root remain non-reusable
- **AND** main creates the next bounded successor and continues without a fixed mission-wide attempt ceiling or owner process question.

#### Scenario: Unchanged live repetition remains blocked

- **WHEN** a proposed live repetition changes only its attempt number, timeout, wording, or output identity and supplies no decision-changing causal delta
- **THEN** main SHALL NOT execute that repetition
- **AND** it SHALL diagnose or select a materially different mechanism rather than treating a larger attempt budget as progress.

#### Scenario: Exact protected prerequisite remains owner-owned

- **WHEN** every credible goal-preserving route requires one exact unauthorized protected action or unavailable external capability
- **THEN** the mission stops only at that action with a self-contained owner handoff
- **AND** changing an attempt count or stop line SHALL NOT simulate or authorize the protected prerequisite.

## MODIFIED Requirements

### Requirement: Material SDET is critical-only and convergent

For Material behavior changes, fresh test-only SDET SHALL run after current MVP
proof and accepted-scope completion. It SHALL return exactly
`critical-risks-reported | no-critical-risk | blocked` and author only the
smallest critical reproducer/regression oracle.

An unchanged candidate and unchanged critical-risk hypothesis SHALL NOT receive
another SDET attempt merely to seek a different verdict. A fresh attempt MAY run
after a main-confirmed critical defect and production fix, after another
production mutation that materially changes reachable critical behavior, or after
new decision-changing evidence identifies a distinct reachable critical
hypothesis. No SDET attempt count SHALL permanently prohibit future risk
assessment of a materially changed candidate, and SDET convergence SHALL NOT stop
unfinished production work.

#### Scenario: No new critical evidence stops unchanged SDET repetition

- **WHEN** a precondition-valid Material SDET attempt yields no main-confirmed critical defect and the candidate and reachable critical hypotheses remain unchanged
- **THEN** another equivalent SDET attempt SHALL NOT run
- **AND** non-critical findings SHALL be parked without blocking the product outcome.

#### Scenario: Materially changed candidate permits fresh critical assessment

- **WHEN** later authorized production work materially changes reachable critical behavior or new evidence identifies a distinct critical hypothesis
- **THEN** one fresh SDET attempt MAY assess that changed risk after current proof and accepted-scope completion
- **AND** the prior no-critical result SHALL remain attributable to its inspected candidate rather than acting as a permanent root-wide ban.
