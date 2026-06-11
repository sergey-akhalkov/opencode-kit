# Autopilot Routing Spec

## ADDED Requirements

### Requirement: Autopilot Eligibility Is Explicit

Autopilot SHALL be used only when explicit user intent or OpenSpec task state makes the control plane the safest workflow.

#### Scenario: Explicit Autopilot command starts control-plane check

- **GIVEN** the user submits `/autopilot` or explicitly asks for Autopilot
- **WHEN** the skill and plugin tools are available
- **THEN** the agent calls `autopilot_run_next` as the first high-level control-plane action
- **AND** it treats plugin output as authoritative for process state unless local evidence conflicts

#### Scenario: Casual work stays out of Autopilot

- **GIVEN** the user asks a casual codebase question or requests one obvious small edit
- **WHEN** no active Autopilot context or ready task ledger requires control-plane handling
- **THEN** the agent uses direct search/edit workflow instead of loading Autopilot

#### Scenario: OpenSpec discovery without ready work uses next-step

- **GIVEN** the user asks what to do next
- **AND** no ready Autopilot task ledger or queue is known
- **WHEN** OpenSpec-backed discovery is appropriate
- **THEN** the agent routes to `next-step` rather than retrying Autopilot

#### Scenario: Single accepted change uses direct apply workflow

- **GIVEN** one accepted OpenSpec change can be completed directly without queue/runtime orchestration
- **WHEN** the task does not need Autopilot locks, worker dispatch, MR wait handling, or parallel workstream control
- **THEN** the agent routes to `openspec-apply-change` rather than Autopilot

### Requirement: Deferred Or Inapplicable Autopilot Has A Safe Handoff

Autopilot SHALL document and expose a safe stop or handoff path when the runtime cannot or should not continue.

#### Scenario: Runtime-deferred Ready work does not loop

- **GIVEN** `autopilot_run_next` returns `reasonCode` `ready_runtime_deferred`
- **WHEN** the agent considers the next step
- **THEN** it does not repeat an equivalent `autopilot_run_next` call unless `nextActions[]` explicitly says it is safe
- **AND** it reports a named handoff path such as manual direct work, `openspec-apply-change`, or a follow-up OpenSpec change

#### Scenario: No ledgers does not retry Autopilot indefinitely

- **GIVEN** Autopilot output reports no task ledgers
- **WHEN** the user still wants OpenSpec-backed work
- **THEN** the agent routes to discovery/proposal workflow instead of repeating the same no-progress Autopilot call

### Requirement: Evidence Conflicts Stop The Flow

Autopilot SHALL stop or hand off when local evidence conflicts with plugin output, task status, or report claims.

#### Scenario: Source and task checklist disagree

- **GIVEN** source/tests show a behavior is implemented
- **AND** the related OpenSpec `tasks.md` still marks the behavior unchecked
- **WHEN** Autopilot or an archive/release workflow evaluates readiness
- **THEN** the agent reports an evidence conflict or freshness gap
- **AND** it does not claim the change is complete until the mismatch is reconciled or explicitly justified

#### Scenario: Stale report output shape is used as current evidence

- **GIVEN** an Autopilot report contains an older output shape missing current required fields
- **WHEN** the report is used for archive, release, or readiness evidence
- **THEN** the agent runs or requests freshness validation and treats the report as stale until updated or justified

### Requirement: Routing Surfaces Stay Synchronized

Autopilot routing guidance SHALL stay synchronized across the skill, README routing, and `/autopilot` command wording when those surfaces describe eligibility, non-eligibility, or escape-hatch behavior.

#### Scenario: Routing wording drifts

- **GIVEN** one routing surface documents an Autopilot eligibility or escape-hatch rule
- **WHEN** repository validation runs
- **THEN** deterministic instruction/routing checks fail if another required surface omits or contradicts the rule
