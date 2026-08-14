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

### Requirement: Shipped workflow tools use portable cores and thin project adapters

Every workflow tool made available to target projects SHALL accept explicit project identity and behavior inputs rather than embedding this repository's path, name, package manager, shell, service, or validation commands. Project-specific convenience commands MAY be thin adapters, but reusable core behavior SHALL remain independently invocable in an unrelated project.

Repository-maintenance-only validators MAY target the documented kit schema when they are not installed or represented as generic project workflow tools.

#### Scenario: Another project uses a different build system

- **WHEN** a target project supplies a native validation executable instead of npm
- **THEN** the reusable workflow core invokes the explicit argv without requiring npm
- **AND** only that project's thin adapter contains its technology-specific command.

#### Scenario: Reusable core contains checkout identity

- **WHEN** a shipped project workflow core embeds this repository name, an absolute maintainer path, or an implicit current-checkout validation command
- **THEN** deterministic repository validation fails
- **AND** the behavior is moved behind an explicit root/config/argv adapter before delivery.

### Requirement: Complete archive delegates spec merge and movement to official OpenSpec

The shipped complete-archive path SHALL run a deterministic completion gate and applicable project validation before invoking the installed official OpenSpec archive command in machine-readable non-interactive mode. It SHALL NOT ask a model to edit main specs, reimplement delta parsing, or move the change directory manually.

The path SHALL preserve the official archive result, run post-archive validation, and refuse a success claim when any gate, official operation, or post-validation is red.

#### Scenario: Complete delta is archived

- **WHEN** all artifacts and tasks are complete, strict delta validation passes, and project validation exits zero
- **THEN** the official OpenSpec command applies and validates the delta and moves the change
- **AND** the portable wrapper reports the machine archive identity and operation totals.

#### Scenario: Incomplete task with non-interactive archive

- **WHEN** a change contains an unchecked task
- **THEN** the portable gate exits non-zero before invoking `openspec archive --yes`
- **AND** neither main specs nor the active change location changes.

#### Scenario: Partial modified delta is unsupported

- **WHEN** official deterministic OpenSpec merge rejects a partial `MODIFIED` delta
- **THEN** the wrapper preserves the official diagnostic and exits non-zero
- **AND** it does not fall back to agent-authored merge behavior.

### Requirement: Staged validation executes the exact Git index candidate

The shipped staged-validation tool SHALL materialize the current Git index into an isolated disposable worktree and run an explicit project validation argv there. It SHALL NOT validate unstaged source as candidate content, modify the source worktree, guess dependency preparation, or hardcode a project package manager.

Explicit reused paths SHALL be relative, ignored, existing, absent from the staged tree, and attached only for the validation lifetime. The tool SHALL remove its links and disposable worktree on success or failure; unknown cleanup state SHALL return non-zero with the preserved path.

#### Scenario: Worktree conflicts with staged candidate

- **WHEN** a tracked file has green staged content and red unstaged content
- **THEN** staged validation observes only the green indexed content
- **AND** the source worktree bytes remain unchanged.

#### Scenario: Validation command fails

- **WHEN** the explicit validation argv exits non-zero
- **THEN** stdout, stderr, signal, and exit status remain visible
- **AND** the disposable worktree is still removed before the wrapper exits non-zero.

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

