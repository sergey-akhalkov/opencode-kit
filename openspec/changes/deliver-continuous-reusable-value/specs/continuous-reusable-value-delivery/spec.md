## Purpose

Defines how finished product, foundation, and knowledge units become visible reusable value while preserving outcome authority, production reachability, and honest evidence limits.

## ADDED Requirements

### Requirement: Value readiness is grounded in a real consumer boundary

The workflow SHALL treat product value as delivered only when the accepted effect is observed at its real consumer boundary. It SHALL treat an owner-local foundation capability as `Value Ready` only when the capability has one current semantic owner, a bounded contract, direct proof when a truthful direct oracle exists, at least one real production consumer, distinct parent integration proof, supported production reachability, federated discoverability, and an explicit retirement path. It SHALL treat knowledge value as current only to the boundary established by its current owner/source link and executable or fingerprint evidence.

A helper, document, test, task, function, file, module, component check, or artifact SHALL NOT prove delivered value by existence or completion alone.

#### Scenario: Product behavior reaches its consumer

- **WHEN** the accepted product effect is observed through the current real consumer entrypoint with representative input, diagnostics, effects, and cleanup
- **THEN** the workflow MAY report that product value as delivered within the exercised boundary
- **AND** the report does not broaden the result to unexercised consumers or environments.

#### Scenario: Foundation capability has a first production consumer

- **WHEN** one current semantic owner delegates to a bounded capability, its direct oracle passes, one production consumer uses it, and the composed parent path passes
- **THEN** the workflow SHALL recognize the capability as `Value Ready` when its supported reachability, discoverability, and retirement facts are also current
- **AND** it preserves the capability and parent observations as distinct evidence.

#### Scenario: Isolated helper has no consumer

- **WHEN** a helper or document passes its component checks but no current accepted consumer uses it
- **THEN** the workflow SHALL keep it incomplete, speculative, or removable rather than reporting delivered foundation or knowledge value
- **AND** output volume or green isolated tests do not change that result.

### Requirement: The first consumer creates foundation value and later consumers confirm reuse

The first observed production consumer SHALL establish the demand needed for foundation value. A later distinct observed production consumer SHALL confirm reuse of the same capability and SHALL NOT create another semantic owner, copy, promotion lifecycle, registry row, or mandatory report. Speculative future consumers SHALL NOT justify creating or retaining a capability.

#### Scenario: First consumer establishes current demand

- **WHEN** accepted work needs a capability that has no existing production consumer and the smallest owner-local implementation reaches direct and parent proof
- **THEN** that first production integration SHALL establish the capability's current demand
- **AND** no second hypothetical use is required before the capability can be Value Ready.

#### Scenario: Second consumer reuses the existing capability

- **WHEN** a later accepted production path needs the same source-verified contract and effect envelope
- **THEN** the workflow SHALL reuse the existing capability through its semantic owner when that remains the lowest total-cost fit
- **AND** the second consumer is observed reuse rather than authority for a sibling implementation.

#### Scenario: Future demand is only hypothetical

- **WHEN** no current accepted production path consumes a proposed helper and only a possible future use is named
- **THEN** the workflow SHALL keep the implementation direct or omit the helper
- **AND** it does not manufacture a foundation value unit to satisfy a reuse goal.

### Requirement: Discovery remains federated and proportional

Candidate discovery SHALL use ordinary source, reference, package/config, OpenSpec, documentation, dependency, and configured code-intelligence foraging under their current authority and freshness limits. Existing `reuse-discovery` routing SHALL remain triggered only by a new dependency, mechanism, API, owner, abstraction, sibling, or same-versus-new uncertainty. A found source-verified fit SHALL NOT be duplicated without an explicit contract mismatch or lower-total-cost reason.

The workflow SHALL NOT require a central registry, capability inventory, demand ledger, universal pre-edit search, per-leaf search receipt, or default-on memory solely to discover value.

#### Scenario: New mechanism triggers existing reuse routing

- **WHEN** accepted work proposes a new mechanism and current-repository foraging does not already resolve the same-versus-new decision
- **THEN** loaded main SHALL use the existing `reuse-discovery` route once and preserve its verified, degraded, or unavailable evidence
- **AND** it creates no separate value-discovery procedure.

#### Scenario: Source foraging finds a fitting owner

- **WHEN** current source and references identify an existing owner whose contract and effect envelope fit the accepted case
- **THEN** main SHALL record `reuse` or `extend` against that owner
- **AND** it does not add a sibling without an exact contract or total-cost reason.

#### Scenario: Trivial owner-local correction needs no discovery ceremony

- **WHEN** a bounded correction has a known current owner and no reuse trigger
- **THEN** main SHALL use targeted local evidence and direct proof
- **AND** it creates no registry lookup, search report, skill load, or value progress fact solely for compliance.

### Requirement: Value progress facts expose delivery without creating a checkpoint protocol

When a reusable unit reaches its own current oracle and production consumer boundary inside a larger unfinished accepted outcome, main SHALL make that result visible through one bounded ordinary progress update or handoff fact. The fact SHALL name the value unit, consumer, proof boundary, and remaining parent dependency. It SHALL NOT create or reuse `Delivery Checkpoint State`, a process gate, a retained checkpoint identity, a suppression rule, or a continuation protocol. It SHALL NOT complete the parent, root goal, OpenSpec task, Development-Stage, or lifecycle state and SHALL NOT require a retained artifact.

#### Scenario: Capability completes before its parent outcome

- **WHEN** one owner-local capability is Value Ready but its parent integration or another required sibling remains incomplete
- **THEN** main SHALL report the completed capability boundary and the still-open parent dependency separately
- **AND** it does not represent the root outcome as working or complete.

#### Scenario: No distinct reusable unit exists

- **WHEN** one cohesive accepted correction has no truthful independent capability or knowledge boundary
- **THEN** main SHALL continue direct run-observe-correct and report the final outcome normally
- **AND** it emits no synthetic value progress fact.

### Requirement: Supported reachability is production-scoped and last-consumer removal retires dead code

For a supported internal capability, automatic reachability SHALL start from explicit reviewed production roots and SHALL exclude tests, proof fixtures, examples, documentation mentions, archives, evidence, generated output, and speculative consumers as liveness evidence. A changed capability that loses its last supported production consumer SHALL be removed in the same accepted change or preserved through a truthful current root and current evidence.

A test-only reference, component fixture, accepted-debt baseline, wildcard ignore, finding budget, or future-consumer assertion SHALL NOT keep production code alive.

#### Scenario: Production root reaches a capability

- **WHEN** the supported production graph reaches an internal module or export from a current reviewed package, CLI, plugin, extension, public, generated-profile, or dynamic root
- **THEN** the reachability gate SHALL accept that path within the analyzer's stated coverage
- **AND** the root and source reference remain inspectable.

#### Scenario: Tests are the only consumer

- **WHEN** an internal module or export is imported only by tests or proof fixtures
- **THEN** the production-reachability gate SHALL report it as unused within the supported surface
- **AND** the passing test cannot satisfy production liveness.

#### Scenario: Last production consumer is removed

- **WHEN** accepted work removes the last supported production path to an internal capability
- **THEN** the same change SHALL retire the newly orphaned capability or establish a truthful current root before validation passes
- **AND** an exact baseline or ignore cannot conceal the orphan.

#### Scenario: Dynamic consumer cannot be resolved

- **WHEN** current evidence identifies reflective, external, or dynamic activation outside the analyzer's supported resolution
- **THEN** reachability and deletion safety SHALL remain `unknown` for that capability
- **AND** the workflow does not infer absence or delete the capability from static silence.

### Requirement: Reachability configuration and legacy findings are exact and fail closed

The kit reachability gate SHALL validate exact reviewed project patterns, production roots, source references, exclusions, analyzer identity, normalized findings, and any accepted legacy rows. It SHALL fail on malformed input, missing or false roots, analyzer failure, unsupported finding shape, stale analyzer/config identity, new findings, or accepted rows no longer present. Accepted legacy rows SHALL be exact, individually justified, visible, and ineligible to act as liveness evidence.

Count budgets, broad wildcards, reason-free rows, blanket ignores, and speculative roots SHALL be invalid.

#### Scenario: New unused export appears

- **WHEN** the analyzer reports one normalized supported finding that is absent from exact accepted legacy rows
- **THEN** the gate SHALL fail and name the finding kind, relative file, and symbol identity when available
- **AND** it does not accept the finding because a numeric budget remains unchanged.

#### Scenario: Accepted legacy row becomes stale

- **WHEN** a previously accepted exact finding no longer appears under the same current analyzer and root identity
- **THEN** the gate SHALL fail until the stale row is removed
- **AND** it does not preserve obsolete debt metadata silently.

#### Scenario: Analyzer process fails

- **WHEN** analyzer invocation exits unsuccessfully, emits malformed machine output, or cannot read reviewed configuration
- **THEN** the validation owner SHALL fail with process status and cause-preserving diagnostics
- **AND** it does not reinterpret absence of findings as success.

### Requirement: Knowledge-value freshness has a bounded observable ceiling

Knowledge value SHALL identify a current semantic owner or source and SHALL use the strongest available executable example, schema/readback validation, maintained mirror check, or source fingerprint. A changed linked source identity, failing executable example, unreadable source, or stale generated mirror SHALL invalidate the corresponding freshness claim.

Path existence, link syntax, headings, or prose structure alone SHALL establish only structural validity and SHALL NOT prove semantic correctness.

#### Scenario: Executable knowledge remains current

- **WHEN** current guidance links to its owning source and its representative executable example or readback passes against that source
- **THEN** the workflow MAY report the knowledge current within that exercised contract
- **AND** it names the unexercised semantic limits.

#### Scenario: Linked source changes

- **WHEN** a maintained source fingerprint changes without successful regeneration, review, or executable revalidation of dependent knowledge
- **THEN** the knowledge freshness check SHALL fail or report the dependent claim stale
- **AND** a still-valid Markdown link does not override the mismatch.

#### Scenario: Only prose structure is validated

- **WHEN** validation proves only readable Markdown, headings, or links
- **THEN** structural validity SHALL be reported separately and semantic freshness SHALL remain `unknown`
- **AND** no deterministic helper scores or infers documentation truth.

### Requirement: Portable automatic assurance uses a verified native mechanism or remains unknown

Portable project instructions SHALL use a fitting existing project-native dead-code or documentation-freshness mechanism when its contract and coverage are verified. They SHALL NOT require the kit's TypeScript analyzer, install a universal dependency, or claim enforcement across unsupported languages or runtimes. When no applicable native mechanism exists, main SHALL retain source/config/runtime consumer checks and report automatic assurance `unknown` with the unsupported boundary.

#### Scenario: Project has a fitting native analyzer

- **WHEN** an unrelated project already provides a maintained analyzer whose production roots, exclusions, and failure semantics cover the changed capability
- **THEN** main SHALL use that project-native validation boundary
- **AND** it does not install or substitute the kit-specific TypeScript gate.

#### Scenario: Project has no applicable analyzer

- **WHEN** no verified native mechanism covers the changed language or runtime activation path
- **THEN** main SHALL report automatic reachability assurance `unknown` and preserve manual source/config/runtime evidence
- **AND** it does not claim universal dead-code absence or block unrelated accepted work solely to add an analyzer.

### Requirement: Structural and installed evidence prove different claims

Deterministic validation SHALL prove only explicit root, graph, finding, baseline, fingerprint, schema, ownership, and routing facts. Loaded workflow behavior SHALL be retained only through matched installed scenarios that observe first-consumer readiness, second-consumer reuse, last-consumer retirement, cohesive direct implementation, trivial-work proportionality, knowledge-freshness ceilings, and native-analyzer-or-unknown portability.

Neither evidence class SHALL authorize protected action, semantic value judgment, completion, or a broader claim than its exercised population.

#### Scenario: Structural checks pass without installed behavior evidence

- **WHEN** all reachability and instruction-marker checks pass but the matched installed scenarios have not run or fail
- **THEN** the kit SHALL report structural conformance only
- **AND** it does not claim the `CRVD-001` loaded workflow behavior.

#### Scenario: Installed scenario reports unsupported portability honestly

- **WHEN** a matched unrelated-project scenario has no applicable native analyzer
- **THEN** the candidate SHALL preserve source evidence and report automatic assurance `unknown`
- **AND** the scenario fails if it invents enforcement, installs an unrequested analyzer, or claims universal coverage.
