# library-tools-architecture Specification

## Purpose
TBD - created by archiving change refactor-tools-split-candidate. Update Purpose after archive.
## Requirements
### Requirement: Module split contract

The library SHALL organize executable tools under `tools/` with the following directory shape when more than one concern is present in a single file:

- `tools/validators/<domain>.ts` — one file per validation domain (frontmatter, skills, agents, profiles, opencode-config, markdown, devkit-contract, permission-policy, routing, binding).
- `tools/test-helpers/{fixture-builder,assert-helpers,runner}.ts` — shared test helpers.
- `tools/delivery-context/` is no longer canonical; the OpenCode session-delivery-context reader now lives next to its consumer under `global/plugin/session-delivery-context/{db,requirements,redaction,projection,index}.ts`. `tools/session-delivery-context.ts` is kept as a thin CLI shim that re-exports the public API from the plugin module.
- `tools/contracts/<domain>.ts` — declarative required-text and permission-rule lists consumed by validators and tests.

#### Scenario: monolithic file detected

- **WHEN** `tools/code-quality-inventory` reports a code file in the split-candidate band (`>= 800` lines)
- **THEN** the change that introduces or extends the file SHALL include a task that splits it into the appropriate module above OR records an explicit justification (cohesive lookup table, generated code, one-off emergency) with reviewer acceptance.

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

### Requirement: Test runner contract

All executable tests in `tools/` SHALL run through `node --test` (Node >=22 stable, >=24 required by the repo). Each `tools/test-*.ts` file SHALL be self-discoverable: it imports from `node:test` and `node:assert` and exports a `test(...)` or `suite(...)` tree.

The hand-rolled `TestCase` type, `assert*` functions, and `withTemp*` helpers SHALL NOT appear in any new `tools/test-*.ts` file. Existing files MAY keep them during the migration; each file SHALL be migrated when it is next edited.

#### Scenario: test command runs in parallel

- **WHEN** `npm test` runs
- **THEN** Node SHALL execute each `tools/test-*.ts` file as a separate test runner
- **AND** a failure in one file SHALL NOT abort the others
- **AND** aggregate results SHALL be reported via `node --test`'s default reporter.

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

