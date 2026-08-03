## MODIFIED Requirements

### Requirement: Module split contract

The library SHALL organize executable tools under `tools/` with the following directory shape when more than one concern is present in a single file:

- `tools/validators/<domain>.ts` — one file per validation domain (frontmatter, skills, agents, profiles, opencode-config, active-authority, markdown, devkit-contract, permission-policy, routing, binding).
- `tools/test-helpers/library.ts` — canonical shared test-helper facade used by extracted modules and suite
  entrypoints. Responsibilities include the shared `TestCase` type, assertion helpers, temporary-directory and
  filesystem fixture helpers, and process spawn/command-result helpers consumed by legacy aggregate suites and
  non-executable extracted modules.
- `tools/test-helpers/{temp,process}.ts` — retained internal/available migration helper modules only. They are
  not the canonical direct import surface for current suites unless a production consumer actually imports them;
  new shared-helper consumption SHOULD go through `library.ts`.
- Deleted names such as `fixture-builder`, absent assert-helper modules, and absent hand-rolled runner modules SHALL NOT be treated as the current required topology.
- `tools/delivery-context/` is no longer canonical; the OpenCode session-delivery-context reader now lives next to its consumer under `global/plugin/session-delivery-context/{db,requirements,redaction,projection,index}.ts`. `tools/session-delivery-context.ts` is kept as a thin CLI shim that re-exports the public API from the plugin module.
- `tools/contracts/<domain>.ts` — declarative required-text and permission-rule lists consumed by validators and tests.

#### Scenario: monolithic file detected

- **WHEN** `tools/code-quality-inventory` reports a code file in the split-candidate band (`>= 800` lines)
- **THEN** the change that introduces or extends the file SHALL include a task that splits it into the appropriate module above OR records an explicit justification (cohesive lookup table, generated code, one-off emergency) with reviewer acceptance.

### Requirement: Test runner contract

All **new standalone executable** test entrypoints in `tools/` SHALL run through `node --test` (Node >=22 stable, >=24 required by the repo). Each new standalone `tools/test-*.ts` executable entrypoint SHALL be self-discoverable: it imports from `node:test` and `node:assert` and exports a `test(...)` or `suite(...)` tree.

Existing legacy aggregate entrypoints (for example `tools/test-contracts.ts` and other pre-migration aggregate runners) MAY remain during migration. Editing a legacy aggregate solely to import/register cohesive extracted modules SHALL NOT force an unrelated full-runner migration of that aggregate or of sibling legacy files.

Non-executable extracted modules that are imported only by an existing legacy aggregate MAY export test arrays and SHALL reuse the shared `TestCase` type and assertions from the canonical test helper (`tools/test-helpers/library.ts` and related shared helpers). They SHALL NOT duplicate local test harness types or assertion implementations.

The hand-rolled `TestCase` type, `assert*` functions, and `withTemp*` helpers SHALL NOT appear as a **new** local harness inside any new standalone executable `tools/test-*.ts` entrypoint. No new standalone hand-rolled test runner is allowed.

#### Scenario: new standalone executable test uses node:test

- **WHEN** a new standalone executable `tools/test-*.ts` entrypoint is added
- **THEN** it SHALL import from `node:test` and `node:assert`
- **AND** it SHALL NOT introduce a new hand-rolled runner or local duplicate harness types.

#### Scenario: legacy aggregate registers extracted modules

- **WHEN** an existing legacy aggregate entrypoint is edited only to import and register cohesive extracted non-executable modules
- **THEN** those modules MAY export test arrays that reuse canonical shared helpers
- **AND** the edit SHALL NOT force unrelated full migration of that aggregate or sibling legacy entrypoints to `node:test`
- **AND** no new standalone hand-rolled runner SHALL be introduced.

#### Scenario: test command runs in parallel for node:test entrypoints

- **WHEN** `npm test` runs entrypoints that use `node:test`
- **THEN** Node SHALL execute each such `tools/test-*.ts` file as a separate test runner
- **AND** a failure in one file SHALL NOT abort the others
- **AND** aggregate results SHALL be reported via `node --test`'s default reporter.

### Requirement: Contract source-of-truth

Every list of required text, required permission keys, or required frontmatter tokens that a validator checks SHALL live in `tools/contracts/<domain>.ts`. Inline `for (const required of [...])` blocks inside the orchestrator or its private helpers SHALL NOT be added in new code. Existing validator token lists that move into contracts SHALL be imported from the contract file rather than redefined inline.

#### Scenario: contract is updated

- **WHEN** a new reviewer contract token is added (e.g. a new field in `## Prevention Feedback`)
- **THEN** the token SHALL be added to `tools/contracts/reviewer-binding.ts`
- **AND** the validator SHALL import it from that file
- **AND** tests SHALL reference the same exported symbol.

#### Scenario: routing token lists live in contracts

- **WHEN** lifecycle role routes, maintenance routing files, forbidden production-routing patterns, or global AGENTS trigger tokens are validated
- **THEN** those lists SHALL be defined in `tools/contracts/skills.ts` (or the smallest existing appropriate contract file)
- **AND** `tools/validators/routing.ts` SHALL import them
- **AND** a new production contract file SHALL NOT be created solely for those lists.

### Requirement: Shared OpenCode config policy ownership (kit-local)

This kit's OpenCode JSON/JSONC root-shape and unsupported-`machineOverride` policy SHALL be owned by a single pure
API in `tools/validators/opencode-config.ts`. The repository validator, `tools/doctor.ts`, and
`tools/install-opencode-global.ts` SHALL consume that API for parse/root-shape/`machineOverride` decisions and for
platform-aware config-path equality. The pure inspection API SHALL NOT perform IO. Non-object roots (scalar,
array, null) SHALL be rejected consistently by all three consumers. Permission-warning mapping and consumer
diagnostics remain consumer-local. This shared module is kit-local support ownership only and SHALL NOT be
prescribed as a portable target-project dependency.

#### Scenario: non-object OpenCode config root is rejected consistently

- **WHEN** an `opencode.json` / `opencode.jsonc` text parses to a scalar, array, or null root
- **THEN** the pure inspection API SHALL return a stable non-object-root problem code
- **AND** the repository validator, doctor, and kit activation installer SHALL treat that root as invalid rather
  than silently accepting it.

#### Scenario: doctor/installer reuse path equality from the shared policy module

- **WHEN** doctor or the kit activation installer compare config directory paths
- **THEN** they SHALL use the exported platform-aware path-equality helper from `tools/validators/opencode-config.ts`
- **AND** they SHALL NOT retain independent duplicate `samePath` implementations for that policy.

### Requirement: Doctor active-authority structural conformance (kit-local)

This kit's pure AGENTS.md / change-ready-sdlc SKILL.md active-authority structural policy SHALL be owned by
`tools/validators/active-authority.ts`. That pure API SHALL NOT perform filesystem, process, environment, or
logging side effects. `tools/doctor.ts` remains the sole file IO / report / qualification owner and SHALL consume
the pure API after reading required authority files. Required active authority checks SHALL reject token-packed
one-line stubs and unloadable authority. `AGENTS.md` SHALL require distinct Markdown heading/section structure,
including exact `## Change-Ready SDLC Routing` with a pre-mutation instruction inside that section, exact
`## Universal Task Briefing Contract`, and nonempty runtime/owner/delivery section headings sufficient for active
global authority. `skills/change-ready-sdlc/SKILL.md` SHALL parse leading frontmatter with `js-yaml` semantics as a
YAML mapping, require exact scalar `name: change-ready-sdlc` and nonempty scalar `description`, and require an
ordered lifecycle heading skeleton through title, When To Load, Profile, Adapter Discovery, Authoritative Brief,
authoring/gate sequence, Candidate Freeze, Applicable Proof, Fresh SDET, Project-Native Validation, failure-rules /
correction routing, Final Candidate Review, Change-Ready Decision, and handoff/delivery output. Malformed YAML,
duplicate mapping keys, non-scalar name/description, missing frontmatter, or lifecycle-incomplete bodies SHALL block
qualification. Independent structurally complete copied/default authority MAY pass without source-byte equality.
Diagnostics SHALL identify missing/malformed structure without leaking file contents. This pure module is kit-local
support ownership only and SHALL NOT be prescribed as a portable target-project dependency.

#### Scenario: token-packed AGENTS stub fails authority

- **WHEN** active `AGENTS.md` is a one-line file that only co-mentions required tokens without distinct headings
- **THEN** doctor required-authority SHALL fail closed and block qualification

#### Scenario: malformed or incomplete SKILL authority fails

- **WHEN** active `SKILL.md` has missing/malformed frontmatter, non-scalar or conflicting name/description, or an
  incomplete/out-of-order lifecycle heading skeleton
- **THEN** doctor required-authority SHALL fail closed and block qualification

### Requirement: Kit activation installer profile and setx safety (kit-local)

`tools/install-opencode-global.ts` is this kit's activation installer only. Explicit modes
(`--check`/`--audit`, `--print`, `--unset`, `--persist-script`, `--unset-script`) SHALL be mutually exclusive
including aliases and repeats; more than one mode occurrence SHALL fail before validation, temp creation, process
calls, or profile/config/environment mutation. `--dry-run` remains allowed only with implicit default set mode.
Profile mutation via `--persist-script` / `--unset-script` SHALL preserve existing line-record/quoting/ambiguity/
idempotency behavior and SHALL replace the target only through same-directory exclusive temp create, complete write,
fsync, close, raw-byte preimage re-check, and atomic rename. Existing profile bytes SHALL be read as a Buffer and
decoded with fatal UTF-8; invalid UTF-8 SHALL fail before temp creation or target mutation. Existing symlink or
non-regular targets SHALL fail closed before mutation. Failed write/fsync/rename/preimage checks SHALL preserve
original target bytes and clean up temp artifacts when cleanup is possible. The same atomic replacement primitive
SHALL provision `global/opencode.json` from template with expected preimage null and absence re-check so a
concurrently appeared destination is preserved and the operation fails. Template bytes SHALL be strict-UTF-8 decoded
and validated with shared `inspectOpenCodeConfigText` before temp creation; parse_error, non_object_root, and
`machineOverride` SHALL fail before local config or environment mutation without leaking template content. The
unavoidable narrow race between final preimage/absence check and rename is an accepted residual and does not require
a durable lock or coordinator. Windows over-limit values (measured `OPENCODE_CONFIG_DIR=<value>` beyond the
documented safety limit) SHALL fail before `setx` and SHALL NOT recommend manual `setx` or present `--print` as a
safe recovery path; guidance SHALL direct relocating/cloning to a shorter path, re-running install, and verifying
with `--check`. Default mode semantics SHALL be truthful: Windows may persist via `setx` within the limit;
macOS/Linux default prints a safe export and does not persist; explicit `--persist-script <file>` performs profile
convergence.

#### Scenario: over-limit Windows path fails closed without manual setx recovery advice

- **WHEN** the measured Windows setx value exceeds the safety limit
- **THEN** the installer SHALL refuse before invoking `setx`
- **AND** diagnostics SHALL direct a shorter kit path plus re-run and `--check`
- **AND** diagnostics SHALL NOT recommend manual `setx` or treat `--print` as safe recovery.

#### Scenario: profile append/remove is failure-atomic with raw-byte preimage and symlink policy

- **WHEN** `--persist-script` or `--unset-script` mutates a shell profile
- **THEN** the installer SHALL NOT write the target path in place
- **AND** it SHALL reject symlink/non-regular targets and invalid UTF-8 before mutation
- **AND** it SHALL retain exact current Buffer bytes as the expected preimage, write complete next bytes to a
  same-directory exclusive temp file, fsync and close the temp file, re-check raw preimage bytes, then rename
- **AND** on failure it SHALL preserve original target bytes and clean up the temp artifact when possible.

#### Scenario: conflicting installer modes fail before side effects

- **WHEN** more than one explicit mode flag is present (including aliases or repeats)
- **THEN** the installer SHALL fail before validation, temp creation, process calls, or any profile/config/environment mutation

#### Scenario: invalid template and concurrent local config appearance fail closed

- **WHEN** `opencode.json.template` is malformed, non-object, contains `machineOverride`, or is not valid UTF-8
- **THEN** the installer SHALL refuse before writing local config or mutating environment
- **WHEN** a local `opencode.json` appears after template preflight but before atomic rename
- **THEN** the installer SHALL preserve that destination, fail, and clean up the temp artifact when possible
