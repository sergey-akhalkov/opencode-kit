## ADDED Requirements

### Requirement: Accepted outcome completion is evidence-bound above task count

OpenSpec apply and archive workflows SHALL reconcile current task status with the
accepted outcome and its required observable proof before describing a change as
complete. An all-checked task list, terminal handoff task, finalized failed
attempt, or `Development-Stage: development` report SHALL NOT complete a
success-oriented change when a required receipt, effect, or acceptance observation
is absent.

When the outcome remains unfinished and a safe causally distinct route exists,
apply SHALL update or reopen the smallest coherent artifact/task set and continue.
When only an exact owner/external boundary remains, the change SHALL remain
incomplete at that boundary. Only explicit user abandonment or a user-approved
outcome change may convert the unfinished goal into a supported incomplete or
abandoned disposition.

#### Scenario: Checked tasks lack required receipt

- **WHEN** every current task is checked but the proposal requires a receipt, current evidence says the receipt is absent, and Development-Stage remains `development`
- **THEN** apply and archive treat the change as unfinished and restore pending outcome work
- **AND** they do not report implementation completion from checkbox count.

#### Scenario: Failed attempt has a safe causal successor

- **WHEN** the latest attempt is finalized, its evidence identifies a correctable proof-runner or environment defect, and a safe authorized successor can advance the same accepted outcome
- **THEN** apply preserves the attempt, revises process controls, and continues through the successor
- **AND** a terminal attempt record SHALL NOT become a terminal change result.

#### Scenario: Owner explicitly abandons the outcome

- **WHEN** the owner explicitly selects the supported incomplete or abandoned disposition
- **THEN** the change may be preserved with the unmet outcome and exact reason
- **AND** no artifact claims the original outcome was implemented or proven.

### Requirement: Portable operation helpers resolve the active global source deterministically

Canonical propose, apply, and archive guidance SHALL resolve the active kit global
source before constructing a helper path. When `OPENCODE_CONFIG_DIR` is set and
contains the required `bin` helper, that exact directory SHALL be used as the
global source. The workflow SHALL NOT strip the final `global` segment or derive a
sibling repository-root `bin` path.

If the configured source lacks the helper, the workflow SHALL inspect only the
documented supported fallback source and any already trusted project adapter. It
SHALL preserve every attempted path and fail actionably only after supported
resolution is exhausted. It SHALL NOT convert one guessed missing path into an
owner blocker.

#### Scenario: Config directory is the global source

- **WHEN** `OPENCODE_CONFIG_DIR` is `D:/kit/global` and `D:/kit/global/bin/openspec-operation-gate.ts` exists
- **THEN** propose/apply invokes that helper with the explicit target project root and change id
- **AND** it does not probe `D:/kit/bin/openspec-operation-gate.ts` first.

#### Scenario: First guessed path is absent

- **WHEN** a workflow-generated helper path is absent but a supported active-source resolution remains available
- **THEN** the workflow resolves and invokes the supported helper without asking the owner
- **AND** the missing guessed path is retained only as a local diagnostic.

## REMOVED Requirements

### Requirement: Final history retrospective is an evidence-bound completion task

**Reason:** A mandatory final retrospective is process analysis rather than product
acceptance and can block or self-expand an otherwise complete change.

**Migration:** Future changes omit this task. Existing checked retrospective
evidence remains historical; unstarted agent-authored retrospective tasks may be
removed through ordinary outcome-preserving artifact reconciliation.
