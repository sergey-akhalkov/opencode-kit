## Purpose

Defines trustworthy matched consumer-workflow evidence so workflow changes can prove exact no-regression or improvement without substituting structural proxies for user outcomes.

## ADDED Requirements

### Requirement: Consumer scenarios are explicit reviewed inputs
The capability SHALL use a versioned, repository-owned scenario manifest whose stable ordered records define exactly two current-increment disposable consumer workflows: one Ordinary Small repository without OpenSpec workflow ownership and one OpenSpec-backed repository. Each current scenario SHALL declare three matched samples per baseline/candidate arm. Each record SHALL define its fixture identity, initial manifest, synthetic user request, allowed local effects, forbidden effects, expected observable outcome, validation argv, proof expectations, sample count, configured-provider request bound, evidence byte bound, friction fields, and cleanup oracle. Helper code SHALL NOT infer scenarios, expected semantics, or acceptance thresholds from repository content.

#### Scenario: Reviewed scenarios load deterministically
- **WHEN** the maintained manifest contains both required scenario records with exact schema fields and contained fixture paths
- **THEN** repeated reads produce the same normalized scenario order and digest
- **AND** no helper-generated semantic field is added to the manifest

#### Scenario: Incomplete scenario fails before capture
- **WHEN** a scenario omits an outcome, validation, permission, effect, provider-call, evidence-size, or cleanup field
- **THEN** preflight fails before creating an OpenCode session or modifying a fixture
- **AND** reports the exact scenario and missing field

#### Scenario: Non-disposable project is rejected
- **WHEN** a capture request resolves a scenario root outside its newly created proof root or inside the kit, a consumer repository, or another existing worktree
- **THEN** capture performs no model call or project mutation
- **AND** reports the containment failure without emitting the private path

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
