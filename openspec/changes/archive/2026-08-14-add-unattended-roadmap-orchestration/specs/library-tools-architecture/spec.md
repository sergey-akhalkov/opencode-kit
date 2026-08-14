## ADDED Requirements

### Requirement: Roadmap mission tooling has a portable deterministic core
The roadmap mission entrypoint SHALL live under `global/bin/`, accept explicit project/global-source/mission inputs, emit stable machine-readable output, use argument-vector process invocation without a shell, and contain no checkout name, absolute maintainer path, package manager, project validation command, product roadmap rule, or provider credential. Project-specific configuration SHALL remain in a contained mission definition or adapter.

The production implementation and maintained disposable fixtures SHALL NOT contain a consumer project's product name, path, domain gate, hardware rule, roadmap label, or validation command. A target repository MAY supply those values only through its own instructions, OpenSpec context, adapter, and mission definition.

#### Scenario: Unrelated project runs preflight
- **WHEN** an unrelated disposable project supplies a valid mission definition and explicit global source
- **THEN** the same entrypoint validates it and returns the eligible slice
- **AND** no opencode-kit repository-relative command is required.

#### Scenario: Audit reproducer uses a domain-specific project
- **WHEN** a workflow defect was discovered in a domain-specific consumer repository
- **THEN** the reusable implementation and disposable proof fixtures express only generic lifecycle inputs and observations
- **AND** the consumer identity remains evidence metadata rather than production behavior.

### Requirement: Mission helper facts are explicit and non-inferential
Deterministic mission helpers SHALL validate schema, paths, digests, DAG order, live command output, task counts, process state, and exact configured effect classes only. They SHALL report `unknown`, `unsupported`, or `blocked` when an input cannot prove a fact and SHALL NOT score roadmap priority, infer semantic completion, summarize model output, or choose a product outcome.

#### Scenario: Two dependency-valid successors exist
- **WHEN** a mission definition makes two successors eligible without a unique declared order
- **THEN** deterministic preflight rejects the ambiguous mission
- **AND** it does not rank the successors.

### Requirement: Mission proof tooling is maintained and discoverable
Reusable mission proof runners and shared libraries SHALL live under `tools/proofs/`, have stable explicit modes and cleanup, and be listed in `tools/proofs/README.md` with exact invocation, inputs, provider/external effects, evidence, restoration, and known limits.

#### Scenario: New mission proof runner is added
- **WHEN** the repository validates proof inventory
- **THEN** the runner has one documented inventory row and import-safe reusable helpers
- **AND** no only source copy exists in temporary output.

## MODIFIED Requirements

### Requirement: Operation gate checks completion facts at each caller boundary
`global/bin/openspec-operation-gate.ts` SHALL expose project-neutral operation-specific deterministic checks consumed by the globally installed propose, apply, and complete-archive entrypoints. It SHALL require an explicit project root and change identity and SHALL NOT depend on a target project's package manager or scripts. A repository-maintenance compatibility shim MAY re-export the portable core for existing local tests and callers but SHALL NOT own behavior.

Registry operations without shipped callers SHALL NOT be represented as integrated. Archive checks SHALL fail on unchecked tasks and other explicit incomplete state. The prepush plan SHALL run repository validation, tests, and OpenSpec validation directly; it SHALL NOT retain an operation check that passes solely because `openspec/` exists.

#### Scenario: Archive gate sees unchecked tasks
- **WHEN** the archive gate reads a tasks file with one or more unchecked items
- **THEN** it returns non-zero with a blocking check and exact unchecked count
- **AND** it does not classify that state as a non-blocking summary.

#### Scenario: Unrelated project invokes apply gate
- **WHEN** a target project invokes the global operation gate with explicit `--root`, operation, and change id
- **THEN** the same completion checks run without a target npm script
- **AND** diagnostics use project-relative sources rather than a maintainer checkout path.

#### Scenario: Prepush gate has no meaningful check
- **WHEN** all useful prepush facts are already enforced by repository validation and OpenSpec validation
- **THEN** the redundant no-op gate is removed from the prepush plan
- **AND** CI and documentation no longer invoke the removed operation.
