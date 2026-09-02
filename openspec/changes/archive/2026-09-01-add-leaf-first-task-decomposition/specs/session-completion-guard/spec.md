## ADDED Requirements

### Requirement: Grind frontiers preserve leaf-first parent dependencies
For a grind-enabled root, main SHALL reconcile accepted leaf and parent work into the existing bounded frontier so each parent item depends on every required child item. A newly discovered independent prerequisite SHALL appear as a new or reopened child with current requirement and evidence refs before the affected parent can be selected again. The controller SHALL continue to derive readiness only from explicit status, dependency, and gate facts and SHALL NOT infer semantic decomposition quality, compoundness, or leaf completion from task prose.

The completion arbiter SHALL reject continuation or completion that selects a parent with an unresolved child, treats child evidence as parent proof, or stops while a dependency-valid child or independent sibling remains runnable. A due delivery checkpoint represented as a process item SHALL compose with the child dependency update and SHALL NOT create a second process gate for the same suppression identity.

#### Scenario: Parent is not runnable before every child
- **WHEN** a frontier parent depends on two children and only one child is complete
- **THEN** the controller excludes the parent from runnable refs and retains the incomplete child when its gates permit
- **AND** no arbiter verdict may select or complete the parent.

#### Scenario: New child replaces a coarse runnable parent
- **WHEN** current evidence shows that a previously runnable parent contains an unresolved independent prerequisite
- **THEN** main atomically reconciles the frontier with the new child and parent dependency under the current generation
- **AND** the parent remains unavailable until the child reaches complete with current evidence.

#### Scenario: Independent sibling remains runnable
- **WHEN** the new child is blocked by a scoped gate and another accepted item is outside its dependency cone
- **THEN** the controller keeps the independent item runnable and mandatory
- **AND** its success neither clears the child gate nor completes the parent.

#### Scenario: Frontier schema remains unchanged
- **WHEN** leaf-first state is projected through item ids, `dependsOn`, status, gate refs, requirement refs, and evidence refs
- **THEN** deterministic frontier validation and readiness derivation use the existing schema
- **AND** no hierarchy field, semantic task parser, or model-derived controller edge is required.
