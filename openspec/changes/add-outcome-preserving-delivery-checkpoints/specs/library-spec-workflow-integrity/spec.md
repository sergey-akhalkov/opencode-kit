## ADDED Requirements

### Requirement: OpenSpec apply reconciles outcome-preserving delivery route changes
When an evidence-backed delivery checkpoint changes the route for an active OpenSpec dependency lane, apply SHALL preserve the accepted outcome and autonomously update the smallest coherent set of design, tasks, strategy history, attempt controls, stop lines, and evidence dependencies before dependent implementation continues. It SHALL record the superseded route, evidence, do-not-repeat condition, selected route, next observable boundary, and evidence-based suppression or retry condition. It SHALL not require owner approval for those process-control changes when accepted product and proof semantics remain unchanged.

Apply SHALL create no artifact update for a checkpoint that confirms the current route unless a current factual inconsistency must be corrected. A proposed route that narrows accepted population, changes an oracle, weakens an invariant, accepts material risk, or crosses protected semantics SHALL remain parked under existing owner authority while every independent accepted task continues.

#### Scenario: Shift-left canary changes task order
- **WHEN** a delivery checkpoint establishes that a cheaper sufficient canary must precede an existing costly proof task without changing its accepted oracle
- **THEN** apply records the prior route in history and updates the dependency-valid task order and proof boundary
- **AND** continues without asking whether agent-authored planning may change.

#### Scenario: Route isolation narrows evidence invalidation
- **WHEN** current dependency evidence establishes that a volatile evaluator or runner identity can be isolated from unchanged prerequisite captures without altering driven behavior or recorded facts
- **THEN** apply updates the design and evidence dependencies to invalidate only affected lanes
- **AND** any replay or caching equivalence claim remains governed by its existing qualification owner.

#### Scenario: Current route is already minimal
- **WHEN** a checkpoint finds no safe outcome-preserving improvement and current planning remains factually coherent
- **THEN** apply resumes the current route without changing proposal, design, specs, tasks, or history solely to document reflection
- **AND** no optional optimization task blocks implementation or archive.

#### Scenario: Faster proposal changes proof scope
- **WHEN** an optimization would remove accepted population members or replace a required real boundary with a weaker oracle
- **THEN** apply does not adopt or encode that route as accepted work without the exact owner decision
- **AND** continues every option-invariant task before any eligible product question.
