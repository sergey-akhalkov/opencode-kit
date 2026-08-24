## MODIFIED Requirements

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

## ADDED Requirements

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
