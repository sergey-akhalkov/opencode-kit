## ADDED Requirements

### Requirement: Doctor SHALL expose explicit automation gates

Doctor SHALL accept exactly one optional automation gate selector with the values
`structural`, `qualification`, or `unattended`. When a gate is selected, process
exit `0` SHALL mean that selected gate passed, process exit `2` SHALL mean that
selected gate is blocked, and process exit `1` SHALL remain reserved for invalid
arguments or diagnostic execution failure. Without an explicit selector, doctor
SHALL preserve its existing informational report and structural-exit behavior.

#### Scenario: Qualification automation is blocked
- **WHEN** doctor reports `qualificationStatus: blocked` under `--require qualification`
- **THEN** it exits `2` and identifies every qualification-blocking check in stable order

#### Scenario: Unattended automation passes independently
- **WHEN** doctor reports `unattendedMissionStatus: pass` under `--require unattended`
- **THEN** it exits `0` regardless of advisory structural warnings

#### Scenario: Default diagnostic remains informational
- **WHEN** doctor runs without `--require`
- **THEN** it retains the existing structural process-exit contract and still reports all three statuses

### Requirement: Doctor SHALL make blocking reasons explicit

Doctor SHALL derive named structural, qualification, and unattended blocker lists
from the same check records that derive the corresponding top-level statuses. JSON
output SHALL expose those lists as structured data, and Markdown output SHALL place
the selected gate's blockers next to its result. A check that blocks qualification
SHALL use blocking wording rather than an advisory `should` message.

#### Scenario: Blocking project authority is reported consistently
- **WHEN** a project instruction-authority check blocks qualification
- **THEN** its status, wording, blocker list membership, and top-level qualification status all describe the same blocking result

#### Scenario: Multiple blockers are retained
- **WHEN** validation authority and canonical workflow identity are both unresolved
- **THEN** doctor reports both blockers without truncating the result to the first reason
