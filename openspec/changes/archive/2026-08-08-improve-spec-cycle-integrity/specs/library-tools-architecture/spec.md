## MODIFIED Requirements

### Requirement: Test runner supports focused iteration and complete freeze validation

Executable tests under `tools/` SHALL support both focused domain execution during implementation and one complete repository execution for the freeze candidate. The runner SHALL preserve every unique critical, compatibility, and structural oracle during migration from custom harnesses.

Green focused and complete runs SHALL emit concise suite/count summaries without one success line per case. Failed runs SHALL retain the exact failing case, command, exit status, stdout/stderr, and relevant diagnostics. A failure in one independently executable suite SHOULD NOT prevent collection of other suite failures when safe isolation is available.

Concurrency SHALL NOT be mandatory. The repository SHALL select serial or bounded-concurrent execution only from same-candidate wall-time and reliability evidence; resource contention, flakes, or degraded diagnostics SHALL prefer serial execution.

#### Scenario: Focused instruction validation during an edit loop

- **WHEN** a change affects only OpenSpec operation-gate behavior
- **THEN** the repository exposes a focused command for the operation-gate suite
- **AND** the full repository suite is deferred until the candidate freeze boundary.

#### Scenario: Complete green run stays concise

- **WHEN** every repository test passes
- **THEN** output reports stable suite and test counts with exit zero
- **AND** it does not emit one `PASS` line for every successful case.

#### Scenario: Concurrent run shows contention

- **WHEN** bounded concurrency is slower, times out, flakes, or loses diagnostics relative to the same serial workload
- **THEN** the default remains or returns to serial execution
- **AND** no speed claim is recorded from the failed comparison.

## ADDED Requirements

### Requirement: Operation gate checks completion facts at each caller boundary
`tools/openspec-operation-gate.ts` SHALL expose operation-specific deterministic checks consumed by the repository-shipped propose, apply, and complete-archive entrypoints. Registry operations without shipped callers SHALL NOT be represented as integrated. Archive checks SHALL fail on unchecked tasks and other explicit incomplete state. The prepush plan SHALL run repository validation, tests, and OpenSpec validation directly; it SHALL NOT retain an operation check that passes solely because `openspec/` exists.

#### Scenario: Archive gate sees unchecked tasks
- **WHEN** the archive gate reads a tasks file with one or more unchecked items
- **THEN** it returns non-zero with a blocking check and exact unchecked count
- **AND** it does not classify that state as a non-blocking summary.

#### Scenario: Prepush gate has no meaningful check
- **WHEN** all useful prepush facts are already enforced by repository validation and OpenSpec validation
- **THEN** the redundant no-op gate is removed from the prepush plan
- **AND** CI and documentation no longer invoke the removed operation.

### Requirement: Generated OpenSpec mirrors remain one behavior surface
Repository-local OpenSpec command and skill variants for the same operation SHALL have one declared ownership or regeneration strategy. Until one surface can safely replace the other, their operation policy, gate invocation, completion semantics, and generator version expectations SHALL remain synchronized and deterministically checked.

#### Scenario: Apply policy changes
- **WHEN** proof-before-checkbox behavior changes in the apply skill
- **THEN** the matching command receives the same behavior in the same change
- **AND** validation fails if the maintained policy blocks drift.
