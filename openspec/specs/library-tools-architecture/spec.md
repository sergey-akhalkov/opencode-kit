# library-tools-architecture Specification

## Purpose
Defines deterministic TypeScript tooling boundaries, focused and complete validation orchestration, stable machine-readable output, and maintainable source ownership.
## Requirements
### Requirement: Module split contract

The library SHALL organize executable tools under `tools/` with the following directory shape when more than one concern is present in a single file:

- `tools/validators/<domain>.ts` — one file per validation domain (frontmatter, skills, agents, profiles, opencode-config, markdown, devkit-contract, permission-policy, routing, binding).
- `tools/test-helpers/{fixture-builder,assert-helpers,runner}.ts` — shared test helpers.
- `tools/delivery-context/` is no longer canonical; the OpenCode session-delivery-context reader now lives next to its consumer under `global/plugin/session-delivery-context/{db,requirements,redaction,projection,index}.ts`. `tools/session-delivery-context.ts` is kept as a thin CLI shim that re-exports the public API from the plugin module.
- `tools/contracts/<domain>.ts` — declarative required-text and permission-rule lists consumed by validators and tests.

#### Scenario: monolithic file detected

- **WHEN** `tools/code-quality-inventory` reports a code file in the split-candidate band (`>= 800` lines)
- **THEN** the current change SHALL inspect the file's responsibilities and navigation cost
- **AND** a change that adds a responsibility to already mixed code SHALL split one cohesive owner into the appropriate module above or record an explicit main-owned `split-or-justify` disposition
- **AND** line count alone SHALL NOT fail the change when the file remains cohesive and locally understandable.

### Requirement: Validator orchestrator

`tools/validate-library.ts` SHALL remain a thin orchestrator whose only responsibilities are:

- Parsing CLI arguments.
- Discovering the relevant artifacts under the configured root.
- Dispatching each artifact class to a validator in `tools/validators/`.
- Aggregating `errors`, `warnings`, and `ok` output.

#### Scenario: new validator added

- **WHEN** a new validator is needed for a previously uncovered artifact class
- **THEN** the orchestrator SHALL gain only a `validate<Domain>(root)` call
- **AND** the new validator SHALL live under `tools/validators/`
- **AND** the orchestrator SHALL NOT exceed 400 lines.

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

### Requirement: Parser reuse

`tools/validators/frontmatter.ts` SHALL parse YAML frontmatter using the `js-yaml` package and SHALL validate the `name`, `description`, and `mode` scalar fields with a `zod` schema. Hand-written regex frontmatter parsing SHALL NOT be added to new code.

`tools/validators/opencode-config.ts` SHALL parse `opencode.jsonc` files using the `jsonc-parser` package. Hand-written `stripJsonComments` / `stripJsonTrailingCommas` SHALL NOT be added to new code.

#### Scenario: validator parses invalid YAML

- **WHEN** a skill folder contains `SKILL.md` with unterminated YAML frontmatter
- **THEN** `tools/validators/frontmatter.ts` SHALL report the error position returned by `js-yaml`
- **AND** the orchestrator SHALL exit non-zero.

### Requirement: Contract source-of-truth

Every list of required text, required permission keys, or required frontmatter tokens that a validator checks SHALL live in `tools/contracts/<domain>.ts`. Inline `for (const required of [...])` blocks inside the orchestrator or its private helpers SHALL NOT be added in new code.

#### Scenario: contract is updated

- **WHEN** a new reviewer contract token is added (e.g. a new field in `## Prevention Feedback`)
- **THEN** the token SHALL be added to `tools/contracts/reviewer-binding.ts`
- **AND** the validator SHALL import it from that file
- **AND** tests SHALL reference the same exported symbol.
