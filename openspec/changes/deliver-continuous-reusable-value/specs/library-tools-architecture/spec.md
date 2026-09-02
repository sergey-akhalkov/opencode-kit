## ADDED Requirements

### Requirement: Production reachability has one deterministic validation owner

The repository SHALL provide one focused validator under `tools/validators/` that owns production-reachability configuration validation, pinned analyzer invocation, stable finding normalization, exact accepted-baseline comparison when needed, and cause-preserving diagnostics. Its validation API SHALL be read-only, SHALL apply a bounded process timeout, SHALL obtain terminal child closure, and SHALL remove temporary configuration on every success or failure path. `tools/validate-library.ts` SHALL only dispatch and aggregate that read-only domain result. Focused tests, strict validation, pre-push, and CI SHALL consume the same owner rather than duplicate analyzer arguments, parsing, or failure policy.

The validator SHALL establish structural reachability facts only and SHALL NOT infer semantic value, owner fit, deletion safety, documentation truth, portability, or completion.

#### Scenario: Strict validation runs reachability

- **WHEN** `npm run validate:strict` validates the kit repository
- **THEN** the orchestrator SHALL invoke the maintained production-reachability owner once and aggregate its normalized result
- **AND** no second caller reimplements analyzer parsing or baseline comparison.

#### Scenario: Analyzer returns a process failure

- **WHEN** the pinned analyzer exits unsuccessfully or emits malformed machine output
- **THEN** the owner SHALL return non-zero with the original process status and safe stdout/stderr diagnostics
- **AND** the orchestrator does not report an empty finding set as success.

#### Scenario: Analyzer times out during strict validation

- **WHEN** the analyzer does not reach terminal process status within the configured bound
- **THEN** the owner SHALL terminate the process, wait for terminal closure, fail with timeout diagnostics, and remove its temporary configuration
- **AND** strict validation does not hang, report success, or leave process-owned state.

#### Scenario: Validation cannot materialize a baseline

- **WHEN** strict validation, pre-push, CI, or default focused check mode invokes the reachability owner
- **THEN** only the read-only check path SHALL be reachable
- **AND** no baseline, reviewed seed, source file, or package artifact is created or modified.

#### Scenario: Structural result is consumed by semantic workflow

- **WHEN** the validator reports one supported unused export
- **THEN** the result SHALL remain exact structural evidence for main to disposition under the accepted change and consumer evidence
- **AND** the validator does not select deletion, create a task, or claim absent semantic value.

### Requirement: Production roots are explicit reviewed seed data

The reachability owner SHALL read one versioned reviewed seed containing exact maintained project patterns, production roots, root kinds, source references, exclusions, and unsupported edges. Every root SHALL exist and correlate to a current package, CLI, plugin, extension, public, generated-profile, or reviewed dynamic source reference. Tests, proof fixtures, examples, evidence, archives, dependencies, generated output, broad wildcard roots, and speculative future consumers SHALL NOT qualify as production roots.

The owner MAY materialize a disposable analyzer configuration from the reviewed seed in a process-owned temporary directory. Generated analyzer configuration SHALL NOT become a second semantic source.

#### Scenario: Package script is a production root

- **WHEN** the reviewed seed names an executable source path and correlates it to a current package script
- **THEN** the owner SHALL include that exact path as a production root
- **AND** a missing or changed script reference fails validation.

#### Scenario: Test path is proposed as a root

- **WHEN** reviewed configuration names a test or proof-fixture path as production liveness evidence
- **THEN** validation SHALL fail with the invalid root kind and relative path
- **AND** the analyzer is not allowed to hide test-only dead code through that root.

#### Scenario: Dynamic edge is unsupported

- **WHEN** a current reviewed root uses activation the analyzer cannot resolve
- **THEN** configuration SHALL expose the unsupported edge and its claim consequence as `unknown`
- **AND** the owner does not fabricate a static edge or suppress the capability globally.

### Requirement: Accepted reachability debt is exact, justified, and self-cleaning

If current characterization finds unrelated pre-existing supported issues that this increment does not remove, the repository MAY retain one generated exact baseline. Each row SHALL identify one normalized current finding plus a concrete reviewed reason and evidence reference. The baseline identity SHALL be materialized through a thin explicit CLI adapter over the reachability owner from the pinned analyzer and reviewed seed; deterministic tooling SHALL NOT infer reasons or choose accepted debt. The materialization mode SHALL require an explicit target and SHALL NOT be reachable from strict validation, pre-push, CI, or default check mode.

Validation SHALL fail when a current finding is absent from the baseline, an accepted row is no longer current, analyzer or reviewed-config identity changes, or a row uses a count budget, wildcard, broad ignore, missing reason, or speculative consumer. The repository SHALL omit the baseline when no accepted debt exists.

#### Scenario: New finding exceeds exact baseline

- **WHEN** the current normalized set contains a supported finding not present as one exact accepted row
- **THEN** validation SHALL fail and identify the new row
- **AND** an unchanged total count cannot make the result pass.

#### Scenario: Baseline row is no longer reported

- **WHEN** an accepted exact finding disappears under the same current identity
- **THEN** validation SHALL fail as stale until the row is removed through the guarded materialization path
- **AND** obsolete baseline data is not silently retained.

#### Scenario: Repository has no accepted debt

- **WHEN** current characterization produces no supported pre-existing findings requiring preservation
- **THEN** the repository SHALL use no reachability baseline file
- **AND** validation compares current findings directly to the empty accepted set.

### Requirement: Current repository enforcement begins only after complete characterization

Before the reachability gate is wired into strict validation, pre-push, or CI, and before loaded instructions claim current kit enforcement, one provider-free characterization SHALL establish pinned analyzer runtime fit, exact project patterns and exclusions, exact roots and source references, unsupported edges, production-versus-test behavior, current findings, baseline need, process timeout and cleanup behavior, and local declaration-check feasibility. The characterization SHALL preserve process status, stdout/stderr, normalized findings, temporary effects, and cleanup.

A failed, unsupported, or incomplete row SHALL update the proposal/spec maximum claim before dependent instruction mutation and SHALL block only gate wiring and loaded claims that depend on that row. It SHALL NOT be bypassed by a baseline, ignore, marker check, or documentation statement.

#### Scenario: Complete characterization supports the planned gate

- **WHEN** every required analyzer, root, exclusion, test-only, finding, timeout, cleanup, and baseline row passes at the provider-free boundary
- **THEN** implementation MAY wire the read-only owner into repository validation and proceed to loaded instruction mutation
- **AND** the maximum claim remains bounded to the observed surface.

#### Scenario: Root or analyzer fit is disproved

- **WHEN** the analyzer cannot resolve a required current root, test-only behavior differs from the contract, or process cleanup is nonterminal
- **THEN** implementation SHALL stop dependent gate wiring and loaded reachability claims until the design/spec claim is narrowed or the same accepted mechanism is corrected and re-characterized
- **AND** it does not defer the mismatch until installed behavior evaluation.

### Requirement: Production-reachability fixtures exercise the finite supported surface

One focused provider-free test owner SHALL create disposable TypeScript projects for reachable production use, a second production consumer, an unused file/export, test-only use, a transitively unreachable chain, last-consumer removal, reviewed root kinds, malformed configuration, analyzer failure, new findings, stale baseline identity, stale rows, and unsupported dynamic edges. The runner SHALL preserve exact invocation, status, normalized output, diagnostics, fixture identity, and cleanup and SHALL remove process-owned temporary fixtures after each case.

The fixture suite SHALL NOT claim universal TypeScript, language, runtime, dynamic-loader, or documentation coverage.

#### Scenario: Test-only import is analyzed

- **WHEN** a disposable project imports one production export only from its test fixture
- **THEN** the production-mode result SHALL report the export or module unused within the supported surface
- **AND** the focused oracle fails if the test import keeps it alive.

#### Scenario: Last consumer fixture changes

- **WHEN** the fixture removes the sole production import while retaining component tests
- **THEN** the normalized result SHALL change from reachable to unused
- **AND** the gate fails until the orphan is removed or a truthful reviewed root is added.

#### Scenario: Cleanup is incomplete

- **WHEN** a focused case leaves its temporary project, child process, or generated analyzer configuration live after completion
- **THEN** the suite SHALL fail cleanup inspection
- **AND** later cases do not treat leaked state as current evidence.

### Requirement: Local declaration coverage is added only after current characterization

Before representing local unexported TypeScript declarations as enforced, the implementation SHALL characterize whether a pinned project-native compiler check can apply `noEmit`, `noUnusedLocals`, and `noUnusedParameters` to the maintained source surface without broad unrelated rewrites or false failures from executable script conventions. If the check fits, the production-reachability owner SHALL compose it with module/export analysis. If it does not fit within the accepted envelope, the claim SHALL retain local declaration coverage as `unknown` and SHALL NOT add another framework or broad cleanup to force the result.

#### Scenario: Compiler check fits current sources

- **WHEN** the pinned compiler validates the maintained source surface with unused-local checks and current focused fixtures pass
- **THEN** the reachability owner MAY compose that check and expose its distinct diagnostics
- **AND** the claim names the covered source patterns and compiler identity.

#### Scenario: Compiler check requires broad unrelated change

- **WHEN** characterization shows unused-local enforcement would require restructuring unrelated scripts or clearing unrelated debt outside the accepted envelope
- **THEN** implementation SHALL keep local declaration assurance `unknown` and continue only the supported module/export gate
- **AND** planning and handoff narrow the maximum claim before loaded behavior mutation.
