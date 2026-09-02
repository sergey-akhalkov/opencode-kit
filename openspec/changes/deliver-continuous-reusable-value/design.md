## Context

See `proposal.md` for motivation and the `CRVD-001` claim boundary. The current kit already owns semantic-owner selection, `reuse | extend | build-minimal`, direct capability proof, parent integration proof, project inventory, deterministic repository validation, and matched installed behavior evaluation. It does not yet connect those owners into a value lifecycle or distinguish production reachability from test-only references.

The current TypeScript tooling is executed directly by Node 24 without a repository `tsconfig`. `tools/project-inventory.ts` classifies source and test roots but is not a symbol reachability analyzer. `tools/validate-library.ts` is the strict-validation orchestrator, `tools/pre-push-validate.ts` composes the pre-push boundary, and the existing consumer-outcome and capability-composition proof families own installed behavior evidence. The implementation must preserve those owners rather than add a registry, second proof runner, or generic inventory framework.

The selected analyzer is Knip in production mode. Its package metadata and source support Node 24, explicit entry/project patterns, unused file/export findings, test exclusion in production mode, and machine-readable output. Runtime fit, the complete production-root set, pre-existing findings, and local unexported declaration coverage remain implementation preflight observations rather than assumed facts.

## Goals / Non-Goals

**Goals:**

- Give product, foundation, and knowledge value one bounded lifecycle that composes existing semantic-owner, proof, reuse, integration, validation, and completion contracts.
- Make the first real production consumer the readiness boundary for foundation value and a later real consumer evidence of observed reuse.
- Reject new and newly orphaned supported TypeScript module/export dead code from reviewed production roots while excluding tests and proof fixtures as liveness evidence.
- Preserve exact diagnostics, explicit unknowns, and a narrow maximum claim when static analysis cannot resolve a consumer.
- Reuse current validation and installed-proof owners with one new reachability domain owner.

**Non-Goals:**

- A capability registry, demand ledger, value score, per-change search report, universal language analyzer, or public helper catalog.
- Treating every task, function, file, or progress statement as a value unit.
- Proving semantic documentation correctness or every dynamic/external consumer through static analysis.
- Clearing unrelated pre-existing dead-code debt or restructuring the repository merely to satisfy an analyzer.
- Installing the kit into a user profile, restarting OpenCode, mutating another project, or performing remote/release work during this change.

## Decisions

### 1. Extend the existing semantic-owner lifecycle instead of adding a value subsystem

A value unit remains owned by the current product or semantic owner. The lifecycle adds states to the existing evidence topology rather than creating another service, registry, or retained ledger:

1. A product result is delivered when the accepted effect is observed at its real consumer boundary.
2. A foundation capability is `Value Ready` only after its bounded contract and owner are current, its direct oracle passes when truthful, one production consumer uses it, the parent integration passes, supported production reachability passes, discovery is possible through ordinary source/foraging routes, and a retirement rule is explicit.
3. A later distinct production consumer is `observed reuse`; it does not promote the capability to a new lifecycle or require a central record.
4. Knowledge value is current only to the boundary established by its executable example, source/owner link, or validated fingerprint. Structure alone cannot claim semantic freshness.
5. A value unit whose consumer, source identity, or proof becomes invalid returns to incomplete/unknown until re-proved or retired.

The ordinary progress update or final handoff is the visibility surface. One bounded value progress fact is emitted only when a reusable unit reaches its own consumer and oracle inside a larger unfinished outcome. It does not create or reuse `Delivery Checkpoint State`, does not become a process gate, and does not complete a parent, root task, OpenSpec task, or lifecycle stage. It creates no mandatory file, identity, suppression rule, or continuation state.

Alternatives rejected:

- A central capability registry or demand ledger duplicates source authority, creates stale synchronization work, and revives the previously abandoned private-registry pattern.
- Declaring value at helper creation or direct test success substitutes output for a real consumer and parent integration.
- Requiring value progress facts for trivial owner-local fixes optimizes ceremony rather than outcome.

### 2. Federated discovery stays inside existing Facts foraging and reuse routing

The compact loaded rule will require ordinary foraging to inspect current owner/source/dependency candidates before building a new mechanism. A source-verified fitting candidate cannot be duplicated without an explicit contract or total-lifecycle-cost reason. The existing `reuse-discovery` trigger remains limited to new dependencies, mechanisms, APIs, owners, abstractions, siblings, or same-versus-new uncertainty; no separate value-search step, receipt, or skill is added.

Discoverability is therefore federated across source definitions and references, package/config entrypoints, current documentation links, OpenSpec capabilities, and configured code-intelligence tools. Each source keeps its own authority and freshness ceiling. Unavailable cross-project discovery remains `degraded`; unavailable automatic reachability remains `unknown`.

Alternatives rejected:

- Mandatory repository-wide search before every edit would repeat existing foraging and penalize trivial work.
- A generated capability catalog would become another semantic owner and could not prove current use.
- Default-on memory would treat an optional index as stronger than current source.

### 3. One production-reachability validator owns Knip invocation and findings

Add `tools/validators/production-reachability.ts` as the sole owner of analyzer invocation, root/config validation, stable finding normalization, optional baseline comparison, and cause-preserving diagnostics. Its validation API is read-only. It will invoke the locally pinned Knip package without shell interpolation, force production mode and JSON output, apply a bounded timeout, close the child before returning, and remove disposable analyzer configuration in `finally` on success, finding failure, process failure, and timeout. `tools/validate-library.ts` will only dispatch the read-only domain check and aggregate its result.

If an accepted legacy baseline is needed, `tools/production-reachability.ts` will be a thin explicit CLI adapter over the same owner and expose a guarded materialization mode. Strict validation, pre-push, CI, default invocation, and focused check mode cannot reach that write path. Materialization writes only an explicitly named baseline target after schema/readback and never runs concurrently with validation.

The reviewed seed will live at `config/production-reachability.json` and contain only semantic inputs that cannot be safely inferred:

- schema version;
- exact project patterns for maintained analyzable production files;
- exact production roots with root kind and source reference;
- explicit unsupported root/edge notes that cap the claim at `unknown`;
- explicit file families excluded because they are tests, proof fixtures, generated output, evidence, dependencies, or archives.

Allowed root kinds are package script, CLI, plugin, extension, public export, generated-profile consumer, and reviewed dynamic root. Every root must exist and point to a current package/config/runtime source reference. Test, fixture, evidence, archive, and dependency paths cannot be roots. Broad wildcard roots, undocumented ignores, and speculative future consumers fail validation.

The analyzer output is normalized to stable rows containing finding kind, project-relative file, and symbol/export identity when supplied. Absolute paths, timestamps, and analyzer-specific display order are removed. A non-zero analyzer process status, malformed JSON, unsupported finding shape, missing root, stale source reference, unreadable config, timeout, nonterminal child, or temporary cleanup failure fails with the original cause and captured status/stdout/stderr.

Alternatives rejected:

- A custom regex or AST graph would reproduce mature TypeScript resolution behavior and add a permanent parser owner.
- Extending `project-inventory.ts` into symbol analysis would mix project classification with a different contract and evidence boundary.
- Calling Knip independently from scripts, tests, pre-push, and CI would duplicate argv, parsing, and failure policy.

### 4. Production roots and accepted legacy findings are exact reviewed data

The implementation begins with a provider-free repository characterization before loaded instruction edits. It must establish pinned analyzer runtime fit, exact project patterns and exclusions, package-script and inspected CLI/plugin/extension/public/dynamic roots, unsupported edges, test-only behavior, current findings, baseline need, process timeout/terminal cleanup, and local compiler feasibility. The root seed is then reviewed against those current source/config facts. Any unsupported observation updates the proposal/spec maximum claim before dependent instruction mutation; a failed or incomplete characterization blocks reachability wiring and loaded reachability claims but not unrelated planning correction.

No baseline file is created when the characterized repository has no accepted pre-existing findings. If unrelated pre-existing findings remain outside this change, `config/production-reachability-baseline.json` may contain only exact normalized findings, one concrete reason and evidence reference per row, and an identity materialized by the reachability owner from the pinned analyzer version plus reviewed root/config seed. The thin explicit CLI adapter will expose the guarded baseline materialization mode; the validation API will remain read-only and neither path will infer reasons or select findings.

Normal validation computes exact set difference:

- a current finding absent from the accepted baseline is new and fails;
- an accepted row absent from current findings is stale and fails until removed;
- analyzer or reviewed-config identity drift fails before comparison;
- count budgets, prefix ignores, wildcard suppressions, and reason-free rows are invalid.

This permits the first increment to reject new debt without claiming legacy cleanup. Baseline rows remain visible debt, not proof that the code is live.

Alternatives rejected:

- A numeric budget allows one finding to replace another and hides the affected capability.
- A blanket ignore makes last-consumer removal invisible.
- Requiring whole-repository cleanup before the gate is useful expands scope and delays feedback.

### 5. Local declaration coverage is characterized before it becomes part of the gate

Knip owns the supported module/export surface. A first implementation leaf will also test whether the current Node 24 TypeScript sources can be checked with pinned TypeScript `noEmit`, `noUnusedLocals`, and `noUnusedParameters` under a narrow repository configuration without broad source rewrites or false failures from executable script conventions.

If that characterization passes, the same reachability validation owner composes the compiler check and the claim can include supported local declaration coverage. If it does not pass within the accepted implementation envelope, the implementation must retain the module/export claim, record local declarations as `unknown`, and update the proposal/spec maximum claim before dependent instruction mutation. It must not add a second compiler framework or broad cleanup solely to widen the claim.

### 6. Last-consumer removal is a production integration invariant

A changed capability with no remaining supported production path must be removed in the same accepted change or preserved by a truthful reviewed root. A test-only import, direct component fixture, documentation mention, baseline suppression, or future-consumer assertion cannot keep it alive. Removal retains consumer checks for explicit public, CLI, plugin, extension, generated, reflective, or external boundaries; unsupported dynamic resolution blocks deletion and reports `unknown` rather than fabricating absence.

The reachability gate supplies structural evidence only. Main still decides whether a finding belongs to the accepted change and whether deletion is safe under current semantic, compatibility, and dynamic-consumer evidence. Existing direct capability and parent integration proofs remain distinct.

### 7. Knowledge value uses owner-local freshness evidence, not semantic scoring

Knowledge value is delivered only when it resolves a current consumer question and identifies its semantic owner plus the strongest available freshness boundary. Existing executable examples, source/config references, fingerprints, schema/readback checks, and maintained mirror validation are reused. A changed linked source fingerprint or failing example invalidates the bounded claim.

No generic documentation registry or semantic Markdown evaluator is added. When only prose structure or a path exists, the workflow reports structural validation separately and semantic freshness as `unknown`.

### 8. Portable projects use their native mechanism or an honest unknown

The reusable project instruction will not install Knip or impose TypeScript. It will ask whether the project already has a fitting native dead-code or documentation-freshness mechanism and use that project-native gate when its contract and coverage are verified. If no applicable mechanism is available, main retains literal/source/config/runtime consumer checks, preserves unsupported cases, and reports automatic assurance `unknown`.

The kit-specific analyzer remains repository-maintenance tooling and is not represented as a universal public tool. No consumer project is mutated during proof.

### 9. Structural and installed behavior evidence remain separate

Provider-free disposable fixtures under the focused reachability test will exercise every finite analyzer/root/baseline row in `CRVD-001`, including reachable, second-consumer, unused, test-only, transitive-unreachable, last-consumer, malformed, stale, and unsupported controls. Fixtures are created in a process-owned temporary directory and removed after each run.

Loaded behavior will extend the current reuse-discovery, composable-capability, and consumer-outcome proof families rather than add a new runner. Matched same-model scenarios will verify first-consumer readiness, second-consumer reuse, retirement after last-consumer removal, cohesive direct implementation, trivial-fix proportionality, knowledge freshness ceilings, and analyzer-or-unknown portability. Deterministic marker checks prove only structural ownership and routing; installed observations own the behavioral claim.

## Risks / Trade-offs

- [A reviewed production root can be false or incomplete] -> Validate every root against a current source reference, include negative fixtures, preserve unresolved dynamic consumers as `unknown`, and keep deletion main-owned.
- [A baseline can normalize legacy debt] -> Permit only exact justified rows, fail stale rows and identity drift, forbid budgets/wildcards, and omit the file when no debt needs preservation.
- [Knip or TypeScript version changes can alter findings] -> Pin development dependencies and package lock, bind baseline identity to the pinned version, and require explicit re-characterization on drift.
- [Production mode can miss externally activated or reflective code] -> Require explicit reviewed root kinds and source references; unsupported resolution narrows the claim and blocks deletion.
- [TypeScript compiler checks can force unrelated cleanup] -> Characterize them before instruction mutation and keep local declaration coverage out of the claim if it cannot be added narrowly.
- [Value progress facts can become progress theater or collide with delivery checkpoints] -> Emit only for a completed reusable unit inside a larger unfinished outcome, use ordinary progress/handoff surfaces, explicitly avoid `Delivery Checkpoint State`, and create no required artifact, identity, process gate, or metric.
- [Documentation can pass structural checks while being wrong] -> State semantic freshness separately and retain `unknown` unless an executable/source-linked oracle supports it.
- [Concurrent dirty changes can invalidate roots or owners] -> Re-read current worktree inputs before each implementation leaf, avoid broad rewrites, and stop only on direct overlap that makes the candidate unsafe.

## Migration Plan

1. Characterize the current worktree with the pinned analyzer in a disposable configuration; enumerate exact roots, unsupported edges, findings, baseline need, compiler-check feasibility, timeout/terminal-process diagnostics, and cleanup before gate wiring or loaded instruction edits. Narrow the proposal/spec claim first if any supported row is disproved.
2. Add the reviewed root seed, focused reachability owner, provider-free fixture suite, pinned development dependencies, and an exact generated baseline only if current legacy findings require one.
3. Prove the reachability capability directly, then compose it into focused strict validation, full repository validation, pre-push, and CI and observe each affected boundary.
4. Update the canonical philosophy and compact loaded/project mirrors, then extend existing proof manifests and installed scenarios.
5. Run current strict validation, tests, OpenSpec validation, provider-free fixtures, installed matched behavior proof, package-lock/readback checks, and cleanup inspection.

Rollback removes the instruction additions, proof scenarios, reachability validator/config, scripts, and development dependencies together. No persisted user data, public API, installed profile, remote state, or migration format is changed. An accepted legacy baseline must not be left without its consuming gate.
