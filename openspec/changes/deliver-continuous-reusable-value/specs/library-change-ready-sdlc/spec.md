## ADDED Requirements

### Requirement: Foundation value extends capability proof through production consumption and reachability

When a current independent capability is intended to provide reusable foundation value, Change-Ready SHALL keep the current direct-capability and parent-integration evidence boundaries and SHALL additionally require one real production consumer, supported production reachability, federated discoverability, and an explicit retirement path before reporting the capability `Value Ready`. A second observed production consumer SHALL confirm reuse but SHALL NOT be required for first-consumer readiness.

This evidence topology SHALL NOT select a source boundary, require extraction, create a public API, or turn a cohesive parent-only implementation into a fake capability.

#### Scenario: Direct and parent proof have a production consumer

- **WHEN** an owner-local capability has a truthful direct oracle, one accepted production consumer, and a passing composed parent observation
- **THEN** Change-Ready SHALL add current reachability, discoverability, and retirement facts before reporting foundation value ready
- **AND** it preserves the direct and parent evidence identities separately.

#### Scenario: Component passes without parent integration

- **WHEN** a capability's direct check and reachability analysis pass but its production parent path has not run or fails
- **THEN** the capability SHALL remain incomplete as delivered foundation value
- **AND** reachability does not substitute for integration.

#### Scenario: Cohesive behavior has no independent capability boundary

- **WHEN** accepted behavior has no truthful direct oracle below one cohesive parent boundary
- **THEN** Change-Ready SHALL keep the direct implementation and prove the product boundary
- **AND** it does not create a foundation value unit merely to increase reusable output.

### Requirement: Last-consumer changes close the supported capability dependency

When accepted work removes or replaces a production consumer, the dependency plan SHALL determine whether a supported internal capability loses its last production path. If it does, retirement of that capability SHALL be a required child of the same accepted change unless a truthful current production root and consumer obligation preserve it. Test-only use, documentation mention, proof fixtures, exact-debt baselines, and hypothetical future consumers SHALL NOT satisfy the dependency.

Unsupported public, reflective, plugin, CLI, external, or dynamic consumers SHALL remain explicit `unknown` evidence and SHALL block only unsafe deletion or the dependent claim.

#### Scenario: Last consumer is removed

- **WHEN** a changed production path was the final supported consumer of one internal capability
- **THEN** the dependency plan SHALL require retirement of the orphan before the parent change completes
- **AND** focused and parent validation run on the integrated removal.

#### Scenario: Another current production root remains

- **WHEN** current package/config/runtime evidence proves a distinct supported production consumer remains after the change
- **THEN** the capability MAY remain under that current owner and root
- **AND** the removed consumer does not force retirement of still-used behavior.

#### Scenario: Reflective consumer is unresolved

- **WHEN** static analysis cannot establish whether a current reflective or external activation path consumes the capability
- **THEN** deletion safety and the dependent absence claim SHALL remain `unknown`
- **AND** main does not broaden the unknown into a root-wide blocker or infer safe deletion.

### Requirement: Value progress facts preserve evidence topology and root incompleteness

Change-Ready SHALL treat a value progress fact as an ordinary progress or handoff observation for one value unit that reached its own consumer and oracle. It SHALL identify the capability or knowledge unit, current consumer, evidence boundary, and unresolved parent dependency. It SHALL NOT create or reuse `Delivery Checkpoint State`, a process gate, retained checkpoint identity, suppression rule, or continuation protocol. It SHALL NOT act as parent integration proof, root completion, task completion, lifecycle qualification, or authority for another action.

#### Scenario: Reusable leaf passes before integration parent

- **WHEN** a reusable leaf reaches its direct and consumer boundary but its dependent parent integration remains pending
- **THEN** main SHALL report the bounded value progress fact while preserving the parent dependency
- **AND** the parent remains unavailable for completion until its distinct oracle passes.

#### Scenario: Progress evidence becomes stale

- **WHEN** the capability candidate, consumer, root identity, source fingerprint, or direct contract changes after a value progress fact
- **THEN** dependent progress evidence SHALL become stale under current invalidation rules
- **AND** later completion requires current proof rather than the historical progress statement.

### Requirement: Portable reachability assurance is scoped to project capability

For a project outside the kit, Change-Ready SHALL use an existing fitting project-native reachability or freshness mechanism only after verifying its relevant contract, roots, exclusions, and failure boundary. If no applicable mechanism exists, main SHALL preserve manual source/config/runtime consumer evidence and report automatic assurance `unknown`. It SHALL NOT install a universal analyzer or claim unsupported enforcement solely to satisfy value readiness.

#### Scenario: Native mechanism is available

- **WHEN** current project evidence identifies a maintained analyzer that covers the changed production surface
- **THEN** the proof plan SHALL use that analyzer at its project-native boundary
- **AND** records its exact coverage and unsupported edges.

#### Scenario: Native mechanism is unavailable

- **WHEN** no verified mechanism covers the changed language or activation path
- **THEN** the proof plan SHALL keep automatic assurance `unknown` and continue every independently provable accepted result
- **AND** it does not represent manual search as universal reachability proof.
