# library-consumer-outcome-regression Specification

## Purpose
Defines trustworthy matched consumer-workflow evidence so workflow changes can prove exact no-regression or improvement without substituting structural proxies for user outcomes.

## Requirements

### Requirement: Consumer scenarios are explicit reviewed inputs
The capability SHALL use a versioned, repository-owned general scenario manifest whose stable ordered records define exactly two maintained disposable consumer workflows: one Ordinary Small repository without OpenSpec workflow ownership and one OpenSpec-backed repository. Each maintained general scenario SHALL declare three matched samples per baseline/candidate arm. Each record SHALL define its fixture identity, initial manifest, synthetic user request, allowed local effects, forbidden effects, expected observable outcome, validation argv, proof expectations, sample count, configured-provider request bound, evidence byte bound, friction fields, and cleanup oracle. Helper code SHALL NOT infer scenarios, expected semantics, or acceptance thresholds from repository content.

The capability MAY additionally accept a separate versioned focused decision-gap manifest. A focused manifest SHALL declare its own scenarios, sample count, provider/evidence bounds, exact decision oracles, and maximum claim and SHALL NOT modify the maintained two-scenario general manifest, baseline pointer, friction expectation, or general consumer claim.

#### Scenario: Reviewed scenarios load deterministically
- **WHEN** the maintained general manifest contains both required scenario records with exact schema fields and contained fixture paths
- **THEN** repeated reads produce the same normalized scenario order and digest
- **AND** no helper-generated semantic field is added to the manifest.

#### Scenario: Incomplete scenario fails before capture
- **WHEN** a general or focused scenario omits an outcome, validation, permission, effect, provider-call, evidence-size, or cleanup field
- **THEN** preflight fails before creating an OpenCode session or modifying a fixture
- **AND** reports the exact manifest, scenario, and missing field.

#### Scenario: Non-disposable project is rejected
- **WHEN** a capture request resolves a scenario root outside its newly created proof root or inside the kit, a consumer repository, or another existing worktree
- **THEN** capture performs no model call or project mutation
- **AND** reports the containment failure without emitting the private path.

#### Scenario: Focused manifest remains separate
- **WHEN** a focused decision-gap manifest is selected
- **THEN** its records and sample count are evaluated independently from the maintained general scenarios
- **AND** it cannot replace or promote the accepted general baseline.

### Requirement: Baseline and candidate captures are comparable
For each scenario sample, capture SHALL run baseline and candidate from fresh isolated fixture and OpenCode session state using the same scenario manifest digest, sample index, synthetic request bytes, configured model and variant, OpenCode version, dependency identity, permission envelope, validation argv, operating-system class, and initial fixture manifest. The only permitted behavioral source difference SHALL be the explicit baseline versus candidate kit source identity. A complete matched capture SHALL use exactly the reviewed sample count, no more than one configured-primary request per sample, and SHALL reject any unrecorded environment difference as `blocked` rather than evaluating incomparable evidence.

#### Scenario: Matched capture records both arms
- **WHEN** baseline and candidate complete under identical governed environment fields
- **THEN** the raw bundle records both source identities, all three paired sample indexes, and their shared comparison identity
- **AND** each sample records exactly zero or one configured-primary request within its declared bound

#### Scenario: Environment mismatch blocks comparison
- **WHEN** model, variant, OpenCode version, scenario digest, permissions, validation argv, dependency identity, operating-system class, or initial fixture state differs between arms
- **THEN** evaluation returns `blocked` with the mismatched field names
- **AND** does not report no-regression or improvement

#### Scenario: Provider request bound is exceeded
- **WHEN** a scenario arm would issue a configured-provider request beyond its declared bound
- **THEN** the arm stops before that request
- **AND** the comparison remains blocked with attributable cleanup evidence

### Requirement: Outcome and safety equivalence are hard gates
Evaluation SHALL require every baseline and candidate arm to satisfy the scenario's exact output/state manifest, validation exit and expected output contract, representative proof contract, permission envelope, forbidden-effect assertions, failure visibility, and cleanup oracle. Candidate evidence SHALL fail if any accepted outcome or safety fact is weaker than baseline or unknown. A lower friction count SHALL NOT compensate for an outcome, proof, safety, diagnostics, or cleanup regression.

#### Scenario: Equivalent accepted outcome can proceed to friction evaluation
- **WHEN** both arms satisfy every scenario outcome, proof, validation, permission, forbidden-effect, diagnostics, and cleanup oracle
- **THEN** evaluation proceeds to the selected friction expectation

#### Scenario: Faster but incorrect candidate fails
- **WHEN** candidate friction counts are lower but its output manifest, validation, representative proof, or cleanup oracle fails
- **THEN** evaluation returns `failed`
- **AND** identifies the exact regressed invariant without assigning improvement credit

#### Scenario: Missing safety observation blocks
- **WHEN** a required permission, forbidden-effect, writer-liveness, or cleanup observation is absent or unreadable
- **THEN** evaluation returns `blocked`
- **AND** never treats absence as a passing zero

### Requirement: Friction evaluation is deterministic and expectation-specific
Each sample SHALL expose the exact non-negative friction vector `ownerQuestionCount`, `configuredProviderRequestCount`, `failedToolCallCount`, `duplicateFailedToolInvocationCount`, and `totalToolCallCount`. Duplicate failed invocation identity SHALL be the same normalized tool name plus canonical argument digest after an earlier non-successful invocation in that sample. Each scenario arm SHALL use the stable sorted median of its three sample values for every friction field while retaining all raw sample values. Under `no-regression`, every candidate median SHALL be less than or equal to its matched baseline median for every scenario. Under `improvement`, the no-regression rule SHALL hold and at least one candidate median SHALL be strictly lower across the complete scenario set. The maintained scenario manifest SHALL default controlled fixtures to `no-regression`; a real candidate comparison SHALL carry its expectation in a separate exact candidate-request record. Tooling SHALL NOT infer expectation from prose, changed files, or measurements. Elapsed time and token data MAY be reported when observed but SHALL NOT decide pass/fail in this increment.

#### Scenario: No-regression candidate passes without improvement claim
- **WHEN** all outcome and safety gates pass, expectation is `no-regression`, and every candidate friction field is no greater than baseline
- **THEN** evaluation returns `passed-no-regression`
- **AND** does not claim productivity improvement

#### Scenario: Improvement candidate passes on a Pareto improvement
- **WHEN** all outcome and safety gates pass, expectation is `improvement`, no friction field is greater in any scenario, and at least one field is strictly lower across the scenario set
- **THEN** evaluation returns `passed-improvement`
- **AND** reports the exact improved field and baseline/candidate counts

#### Scenario: Claimed optimization has no strict improvement
- **WHEN** expectation is `improvement` and every friction field equals baseline
- **THEN** evaluation returns `failed`
- **AND** reports `no-strict-friction-improvement`

#### Scenario: One friction field regresses
- **WHEN** any candidate friction field exceeds its matched baseline value
- **THEN** both expectation modes return `failed`
- **AND** report the scenario, field, baseline value, and candidate value

### Requirement: Baseline establishment and freshness are explicit
When no accepted baseline exists, the capability SHALL support `baseline-establishment` only after all scenario outcome, proof, safety, validation, and cleanup oracles pass. Establishment SHALL record a new immutable baseline version and SHALL NOT claim no-regression or improvement. A baseline SHALL identify the governed model-facing source manifest and environment. A current-candidate gate SHALL reject stale or mismatched baseline/candidate/evaluator identities. Replacing an accepted baseline SHALL require an explicit reviewed seed change that preserves the prior baseline reference and reason; capture or materialization tooling SHALL NOT silently overwrite or approve a new baseline.

#### Scenario: First accepted baseline is established honestly
- **WHEN** no baseline exists and the explicit accepted source passes both scenarios
- **THEN** the result is `baseline-established`
- **AND** no candidate comparison or improvement claim is emitted

#### Scenario: Governed source changes without candidate evidence
- **WHEN** the current governed source manifest differs from the accepted baseline and no matching candidate evaluation exists
- **THEN** the current-candidate gate fails as `stale-evidence`
- **AND** names only changed governed path identities and digests

#### Scenario: Baseline replacement is not automatic
- **WHEN** a passing candidate is available
- **THEN** evaluator and capture modes leave the accepted baseline bytes unchanged
- **AND** report the explicit reviewed promotion input required for a later baseline version

### Requirement: Evidence is bounded privacy-safe and replayable
Every capture SHALL write a create-new immutable bundle with schema version, candidate and environment identities, normalized scenario inputs, bounded redacted event facts, exact command argv, exit status, stdout and stderr bounds, output/state manifests, validation and proof facts, friction vectors, side effects, cleanup, and source hashes. The current manifest SHALL limit each sample bundle to 524288 bytes and one complete baseline or matched capture to 8388608 bytes. Evidence SHALL exclude credentials, provider options, private prompt content, absolute home paths, and unrelated session or repository content. Exceeding a byte or row bound SHALL produce an explicit truncation; truncation of an acceptance-critical field SHALL block evaluation. Capture SHALL clean only attributable sessions, processes, and fixtures and SHALL report cleanup failure as terminal evidence.

#### Scenario: Evidence remains within reviewed bounds
- **WHEN** a matched capture completes within every scenario evidence bound
- **THEN** its bundle is complete, stable ordered, privacy-safe, and replayable
- **AND** retained fields are sufficient to recompute every acceptance result

#### Scenario: Critical evidence is truncated
- **WHEN** a byte or row bound truncates an outcome, safety, friction, validation, proof, or cleanup field
- **THEN** evaluation returns `blocked`
- **AND** identifies the affected field and configured bound

#### Scenario: Cleanup fails
- **WHEN** an attributable session, process, or fixture cannot be proven terminal or removed
- **THEN** the bundle records cleanup as incomplete
- **AND** no later scenario arm starts through the same unisolated ownership

### Requirement: Replay and evaluation perform no live effects
Replay and evaluation SHALL read only explicit bounded evidence roots, verify their schemas and hashes, and produce stable ordered results without creating OpenCode sessions, calling configured providers, executing project validation, contacting endpoints, or mutating baseline, candidate, scenario, or raw bundle files. Evaluator-only changes SHALL be proven by replaying preserved bundles rather than repeating configured-provider capture.

#### Scenario: Preserved bundle replays deterministically
- **WHEN** the same valid baseline/candidate bundles and evaluator source are replayed twice
- **THEN** both evaluations have the same normalized result and digest
- **AND** configured-provider and session call counts remain zero

#### Scenario: Raw bundle was changed
- **WHEN** a preserved file does not match its recorded hash or schema
- **THEN** replay fails closed before evaluation
- **AND** does not repair or rewrite the bundle

### Requirement: Project validation distinguishes capture from the gate
The capability SHALL expose effect-free help and preflight, explicit baseline/candidate capture, provider-free replay, and provider-free current-candidate gate modes. Project-native tests and CI SHALL run schema, negative-oracle, deterministic replay, privacy, freshness, and cleanup fixtures without configured-provider calls. The current-candidate gate SHALL use the reviewed governed-source manifest: an unchanged accepted baseline MAY satisfy the gate, while changed governed sources SHALL require a matching evaluation with the explicitly selected expectation. Configured-provider capture SHALL remain a separately authorized maintainer operation and SHALL never run implicitly from CI, validation, install, bootstrap, or OpenSpec commands.

#### Scenario: CI verifies evidence without provider access
- **WHEN** project CI runs against current maintained evidence and unchanged governed sources
- **THEN** replay and the current-candidate gate terminate without provider, credential, session, install, or remote effects

#### Scenario: Changed governed source has passing candidate evidence
- **WHEN** governed source bytes changed and matching current-candidate evidence passes its explicit expectation
- **THEN** the provider-free current-candidate gate passes
- **AND** reports the baseline, candidate, evaluator, environment, and scenario identities

#### Scenario: Help has no effects
- **WHEN** any maintained CLI is invoked with `--help` or `-h`
- **THEN** it exits zero after printing modes, inputs, effects, evidence, and cleanup
- **AND** creates no file, session, process, network request, or provider call

### Requirement: Focused decision-gap packs do not alter the maintained baseline
The consumer-outcome regression capability SHALL allow a versioned focused decision-gap scenario pack to reuse the existing matched baseline/candidate source staging, installed OpenCode capture, environment correlation, hard outcome and safety gates, privacy bounds, cleanup, and provider-free replay. A focused pack SHALL declare its own scenarios, exact expected decisions, sample count, provider bound, evidence bound, and maximum claim and SHALL remain separate from the maintained general consumer baseline and friction expectation.

Focused-pack tooling SHALL NOT promote, replace, or rewrite the accepted baseline, add its scenarios to the general productivity claim, infer semantic expectations, or run implicitly from CI. This increment's claim-evidence pack SHALL use only generic disposable projects and synthetic facts and SHALL cover representative-only overclaim rejection, complete finite-population scoping, unavailable-real-oracle blocking, and unaffected Ordinary Small exact-case completion.

#### Scenario: Focused pack reuses matched capture safely
- **WHEN** a reviewed focused pack and candidate request declare identical baseline/candidate environment controls and bounded generic scenarios
- **THEN** capture and replay use the existing comparison and cleanup owners
- **AND** results are limited to the named decision gap rather than general workflow improvement.

#### Scenario: Focused pack cannot replace the baseline
- **WHEN** every focused claim-evidence scenario passes
- **THEN** the maintained consumer baseline pointer and general scenario manifest remain unchanged
- **AND** no productivity, universal-model, or unrelated project claim is emitted.

### Requirement: A separate shift-left decision pack proves bounded sequencing behavior

The consumer-outcome regression capability SHALL accept one versioned `shift-left` focused decision-gap pack that reuses the existing source staging, matched configured capture, environment correlation, hard outcome and safety gates, privacy bounds, cleanup, and provider-free replay owners. The pack SHALL remain separate from the maintained general scenarios and from every other focused pack, SHALL use generic disposable repositories and synthetic facts, and SHALL declare exactly two scenarios with one sample per baseline and candidate arm.

The first scenario SHALL require an already reachable safe real characterization to precede implementation that depends on its unknown result. The second scenario SHALL require selection of a lower real boundary that is sufficient for the accepted effect even when a higher protected rung is available. Each scenario SHALL produce an observable bounded plan decision whose current rung, selected next boundary, first action, deferred dependent work, protected-action disposition, and maximum claim are checked by reviewed deterministic oracles rather than inferred from prose.

#### Scenario: Reviewed shift-left pack loads deterministically

- **WHEN** preflight loads the versioned shift-left manifest and its contained fixture seed
- **THEN** it reports the stable ordered two-scenario identity, one sample per arm, configured-provider and evidence bounds, governed source paths, exact decision oracles, and maximum claim
- **AND** a missing, extra, malformed, non-contained, or helper-inferred semantic field fails before any OpenCode session, provider request, or fixture mutation.

#### Scenario: Reachable characterization precedes dependent expansion

- **WHEN** the reviewed case states that one safe real characterization is already reachable and its unknown result can invalidate several proposed dependent implementation steps
- **THEN** the accepted decision selects the characterization or its smallest necessary harness as the first action and leaves every behavior step that depends on the unknown result deferred
- **AND** it records the current rung, next sufficient real boundary, observable result, and claim ceiling without performing or claiming a protected effect.

#### Scenario: Lower sufficient rung wins over available higher authority

- **WHEN** the reviewed case states that a lower installed or local real boundary can observe the complete accepted effect while a higher protected end-to-end rung is also available
- **THEN** the accepted decision selects the lower sufficient boundary and leaves the higher rung unexecuted
- **AND** it does not treat available authority as a fidelity target or claim the unobserved higher-rung behavior.

#### Scenario: Dependent expansion or unnecessary climb fails the hard oracle

- **WHEN** either arm places dependent implementation before the reachable characterization, selects the higher rung without a requirement or unresolved equivalence risk, omits its claim ceiling, or weakens authorization, safety, restoration, cleanup, identity, or evidence facts
- **THEN** evaluation returns `failed` or `blocked` with the exact scenario, arm, sample, and missing or regressed oracle
- **AND** friction, marker presence, fluent rationale, or success in the other scenario cannot compensate for the failure.

#### Scenario: Shift-left evidence cannot alter another pack or baseline

- **WHEN** all shift-left scenarios pass configured capture and provider-free replay
- **THEN** the maintained general scenario manifest, accepted baseline pointer, friction expectation, and every other focused pack remain byte-unchanged
- **AND** the result claims only the two captured decisions for the recorded model, source, prompt, fixture, and environment.

#### Scenario: Evaluator-only correction reuses preserved evidence

- **WHEN** a shift-left evaluator or reporting defect is found after complete baseline or candidate capture
- **THEN** the corrected evaluator replays the immutable affected bundles through the terminal verdict without another configured-provider request
- **AND** a new live capture remains blocked until preserved-corpus replay is terminal or the exact missing raw observation is identified in advance.
