## ADDED Requirements

### Requirement: Doctor reports autonomous campaign readiness separately
Doctor SHALL report a distinct autonomous-campaign readiness status in addition to
structural, qualification, and unattended-mission status. Campaign readiness SHALL
cover canonical project/runtime/global-workflow identity, current active-change and
worktree ownership, schema-valid campaign definition and adapter, contained state/
evidence/report paths, complete validation argv, checkpoint support, configured model
and finite budget authority, campaign/mission writer liveness, required installed
campaign binaries, and selected Windows supervisor registration/protected-material/
runtime readiness.

Ordinary, qualification, unattended-mission, and campaign statuses SHALL remain
independent. A project MAY pass static unattended-mission readiness while campaign
readiness is blocked by a missing definition, semantic-root route, report path, budget,
or host supervisor. Doctor SHALL NOT install, register, start, resume, repair, or
rewrite a campaign while diagnosing it.

#### Scenario: Static mission is ready but campaign supervisor is absent
- **WHEN** canonical workflow, validation, checkpoint, and mission requirements pass but the selected campaign requires unregistered Windows host recovery
- **THEN** unattended-mission readiness remains pass and campaign readiness is blocked
- **AND** doctor names the missing supervisor prerequisite without registering a task.

#### Scenario: Campaign paths are not contained
- **WHEN** a campaign definition, adapter, state, evidence, or report path escapes its required project or protected runtime owner
- **THEN** campaign readiness is blocked with the affected safe path field
- **AND** ordinary and unrelated project files remain unchanged.

## MODIFIED Requirements

### Requirement: Doctor SHALL expose explicit automation gates

Doctor SHALL accept exactly one optional automation gate selector with the values
`structural`, `qualification`, `unattended`, or `campaign`. When a gate is selected,
process exit `0` SHALL mean that selected gate passed, process exit `2` SHALL mean
that selected gate is blocked, and process exit `1` SHALL remain reserved for invalid
arguments or diagnostic execution failure. Without an explicit selector, doctor SHALL
preserve its existing informational report and structural-exit behavior.

#### Scenario: Qualification automation is blocked
- **WHEN** doctor reports `qualificationStatus: blocked` under `--require qualification`
- **THEN** it exits `2` and identifies every qualification-blocking check in stable order

#### Scenario: Unattended automation passes independently
- **WHEN** doctor reports `unattendedMissionStatus: pass` under `--require unattended`
- **THEN** it exits `0` regardless of advisory structural warnings

#### Scenario: Campaign automation is blocked independently
- **WHEN** doctor reports `campaignStatus: blocked` under `--require campaign`
- **THEN** it exits `2` and identifies every campaign-blocking check in stable order
- **AND** it does not start or resume a campaign to test readiness.

#### Scenario: Default diagnostic remains informational
- **WHEN** doctor runs without `--require`
- **THEN** it retains the existing structural process-exit contract and still reports all four statuses
