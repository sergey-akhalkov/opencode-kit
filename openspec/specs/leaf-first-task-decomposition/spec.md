# leaf-first-task-decomposition Specification

## Purpose
Defines project-neutral recursive decomposition that turns compound accepted work into evidence-bearing leaves and proves those leaves before their dependent parent action.

## Requirements

### Requirement: Compound work is decomposed before dependent integration
The active primary session SHALL decompose a current accepted task before its next dependent costly or integration action when current evidence shows two or more required sub-results that can fail, be falsified, or be corrected independently, or when the task spans materially distinct owners, effect boundaries, observation oracles, or cleanup envelopes. Planning SHALL proceed from the accepted parent outcome toward its required leaves, while execution and proof SHALL proceed from runnable leaves back toward the parent.

A leaf SHALL name one bounded result, its required dependencies, one owning mechanism or effect boundary, the earliest sufficient real observation and oracle, its local failure/diagnostic envelope, and applicable cleanup. Several mechanical edits MAY remain one leaf when they share the same owner, can only be validated together by the same oracle, and do not expose independent failure or recovery paths. Deterministic tooling SHALL NOT infer semantic compoundness, leaf quality, or decomposition depth from prose, counts, elapsed time, file cardinality, or task numbering.

#### Scenario: Independent prerequisites precede integration
- **WHEN** one accepted parent scenario requires two prerequisites that can be launched, observed, and corrected independently
- **THEN** main represents each prerequisite as a dependency-bearing leaf before running the parent integration action
- **AND** neither prerequisite is diagnosed through repeated execution of the complete parent scenario.

#### Scenario: Cohesive Ordinary Small work remains direct
- **WHEN** one bounded local reversible task has one owner, one effect boundary, one observable result, and no independently failing required prerequisite
- **THEN** main executes the task directly through ordinary run-observe-correct
- **AND** creates no decomposition artifact or reflection ceremony solely to satisfy the leaf contract.

#### Scenario: Mechanical edits share one oracle
- **WHEN** several maintained mirrors require the same semantic edit under one owner and one exact validation result
- **THEN** main MAY retain them in one leaf
- **AND** does not create a separate task per file when those edits have no independent behavior or recovery path.

### Requirement: Required leaves are proved before their parent
Each parent action SHALL depend on every unresolved leaf required for that action. Main SHALL execute one dependency-valid leaf at its earliest sufficient real boundary, preserve its invocation, relevant identity, observation, result, diagnostics, effects, and cleanup, and mark it complete only after its stated oracle and focused validation pass. Parent execution and completion SHALL remain unavailable while any required leaf is pending, running, blocked, or lacks current evidence.

Leaf evidence SHALL support only that leaf. Success of one leaf SHALL NOT prove its parent, integration behavior, a sibling, or another evidence lane. After all required leaves pass, the parent SHALL run at its own integration boundary and obtain distinct parent evidence.

#### Scenario: Parent remains unavailable while a leaf is unresolved
- **WHEN** one required child has current passing evidence and another required child remains blocked or unproved
- **THEN** main preserves the parent as dependent and does not run or complete it
- **AND** continues any accepted dependency-valid work outside the blocked child's dependency cone.

#### Scenario: Green leaves do not prove integration
- **WHEN** every prerequisite leaf passes at its own boundary
- **THEN** the parent remains incomplete until its distinct integration oracle runs successfully
- **AND** completion evidence preserves separate leaf and parent identities.

#### Scenario: Integration fails after prerequisites pass
- **WHEN** every prerequisite leaf is current and the first parent integration action exposes a defect only at the composition boundary
- **THEN** main treats the integration boundary as the current failing leaf under the same accepted parent outcome
- **AND** does not reopen unrelated passing leaves unless the defect or correction invalidates their dependencies.

### Requirement: Hidden independent prerequisites create recursive child work
When execution exposes a required unresolved condition, main SHALL classify it as either a local failure inside the current leaf, an independent prerequisite, a parent integration failure, or an exact existing gate. A local failure SHALL remain ordinary run-observe-correct inside the current leaf. An independent prerequisite SHALL become the smallest new child task with its own boundary and oracle; the affected leaf or parent SHALL depend on that child before another equivalent parent attempt. An integration failure SHALL remain owned by the parent boundary. A protected action, unavailable capability, product decision, or live-attempt condition SHALL retain its exact existing gate rather than being disguised as decomposition.

OpenSpec tasks, agent-authored task order, and grind frontier state SHALL be corrected autonomously when accepted semantics remain unchanged. Prior attempts and evidence SHALL remain attributable, and evidence invalidation SHALL be limited to the dependency cone affected by the new child or its correction.

#### Scenario: New independent problem becomes a child
- **WHEN** a runnable leaf cannot reach its oracle because a newly observed prerequisite has a distinct owner, boundary, and independently testable result
- **THEN** main adds that prerequisite as a child, makes the affected work depend on it, and solves the child before retrying the affected parent
- **AND** does not continue broad parent execution while changing both problems at once.

#### Scenario: Local defect stays inside one leaf
- **WHEN** a leaf fails with a directly actionable cause inside its declared owner, boundary, and cleanup envelope
- **THEN** main performs the smallest local run-observe-correct cycle without creating another child
- **AND** decomposition does not replace ordinary diagnosis with task churn.

#### Scenario: Protected prerequisite remains gated
- **WHEN** the newly exposed condition requires an existing protected action or material product decision
- **THEN** main preserves the exact scoped gate and affected dependency cone
- **AND** leaf creation neither authorizes the action nor converts a non-product prerequisite into a product question.

### Requirement: Decomposition remains proportional and outcome preserving
Leaf-first decomposition SHALL preserve the accepted outcome, operating envelope, non-deferrable invariants, proof population and oracle, authorization, safety, restoration, cleanup, and maximum claim. Main SHALL prefer the smallest decomposition that isolates current independent failure and proof boundaries; it SHALL NOT decompose for hypothetical future variation, optional polish, style, per-file bookkeeping, or a numeric size target.

If no smaller task can expose an earlier sufficient observation because the behavior exists only at one inseparable integration boundary, main SHALL retain that integration task as a leaf and state the limiting evidence. Decomposition SHALL NOT become an infinite recursive process, a completion stage, or a reason to ask the owner to approve agent-owned task structure.

#### Scenario: Behavior exists only at integration
- **WHEN** current evidence shows the accepted behavior cannot be observed or corrected at a smaller truthful boundary
- **THEN** main retains the bounded integration task as one leaf and executes its existing safe route
- **AND** does not manufacture component tasks that cannot prove the required behavior.

#### Scenario: Proposed split changes proof semantics
- **WHEN** a decomposition proposal would replace an accepted integrated oracle with weaker component observations or reduce the accepted population
- **THEN** main rejects that split as outcome-changing or retains it behind the existing owner decision
- **AND** no task or frontier update treats the weaker observations as equivalent parent proof.

#### Scenario: Optional concern remains outside the tree
- **WHEN** leaf execution reveals unrelated cleanup, refactoring, diagnostic polish, or future-scale work that is not required by the accepted outcome or an invariant
- **THEN** current decomposition remains unchanged
- **AND** the observation may be parked or reported separately without becoming parent dependency closure.

### Requirement: Leaf-first state composes with current lifecycle owners
Ordinary roots SHALL keep leaf-first state in current session/task controls without creating a repository artifact solely for decomposition. Active OpenSpec changes SHALL update only affected tasks, design dependencies, and strategy history when a materially distinct failed parent route is superseded. Grind roots SHALL project leaves and parents as existing work items connected through `dependsOn`; deterministic frontier code SHALL validate refs, acyclicity, gates, and readiness without inferring semantic leaf quality. Compaction SHALL preserve the current runnable leaf, blocked parent, dependency refs, next oracle, and evidence refs when they remain unresolved.

A due outcome-preserving delivery checkpoint SHALL remain the owner of route reconsideration for established delivery drag. When its selected route is recursive decomposition, the resulting child and parent dependency update SHALL satisfy that process correction without creating a second reflection or duplicate strategy record. Proactive decomposition before delivery drag SHALL not manufacture a delivery checkpoint.

#### Scenario: OpenSpec task gains a hidden prerequisite
- **WHEN** an active OpenSpec task exposes an independent required prerequisite during apply
- **THEN** apply adds or reopens only the required child and dependency controls and continues from that leaf
- **AND** proposal outcome and unrelated tasks remain unchanged.

#### Scenario: Grind derives only the leaf as runnable
- **WHEN** a parent item depends on two leaf items, one leaf is complete, and the other is pending with satisfied gates
- **THEN** the controller derives only the pending leaf and other independent eligible items as runnable
- **AND** the parent cannot be selected until every dependency is complete.

#### Scenario: Delivery checkpoint selects decomposition
- **WHEN** current delivery-drag evidence produces one due checkpoint whose selected outcome-preserving route is to isolate a hidden prerequisite
- **THEN** main projects the selected child and parent dependency through existing task and frontier owners
- **AND** does not create another checkpoint or history entry for the unchanged suppression identity.
