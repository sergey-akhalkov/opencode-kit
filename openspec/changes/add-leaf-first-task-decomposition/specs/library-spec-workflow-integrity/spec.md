## ADDED Requirements

### Requirement: OpenSpec authoring and apply preserve leaf-first task dependencies
Canonical OpenSpec propose SHALL author the smallest dependency-bearing tasks needed to isolate independently falsifiable prerequisites before a costly or integration boundary. Canonical apply SHALL re-evaluate task granularity when current evidence exposes a required hidden prerequisite, distinguish a local same-leaf defect from an independent child or integration failure, and autonomously add, reopen, or reorder only the affected task and dependency controls while accepted semantics remain unchanged.

A parent task SHALL remain unchecked and unselectable until every required child has current evidence. Checked child tasks SHALL NOT supply parent completion evidence. Task authoring SHALL keep grouped mechanical edits with one owner and oracle together and SHALL NOT impose per-file tasks or numeric granularity rules. Archive and completion checks SHALL treat a still-unresolved child or missing parent integration oracle as incomplete even when the earlier coarse parent checkbox was checked.

#### Scenario: Propose receives compound implementation work
- **WHEN** proposal and design evidence identify two independently testable prerequisites before one integration result
- **THEN** tasks represent those prerequisites as leaves and the integration task as their dependent parent
- **AND** implementation readiness does not rely on one coarse checklist item.

#### Scenario: Apply discovers an independent prerequisite
- **WHEN** an existing task cannot reach its oracle because current evidence exposes a distinct required prerequisite
- **THEN** apply creates the smallest child task, updates the affected dependency, leaves the parent unchecked, and continues from the child
- **AND** does not request process approval or alter unrelated accepted tasks.

#### Scenario: Same-leaf defect avoids planning churn
- **WHEN** task proof fails with a local actionable cause inside its existing owner and boundary
- **THEN** apply keeps the current task shape and performs ordinary local correction
- **AND** does not add a child merely because one attempt failed.

#### Scenario: Checked coarse parent is no longer truthful
- **WHEN** current evidence proves that a checked parent omitted an unresolved required child or never ran its own integration oracle
- **THEN** apply or archive reopens the parent and adds the smallest required dependency closure
- **AND** preserves prior evidence at its narrower truthful leaf ceiling.
