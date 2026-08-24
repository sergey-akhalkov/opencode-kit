# library-claim-evidence-closure Specification

## Purpose
Defines universal evidence closure so completion and equivalence claims remain bounded by the cases, paths, environments, observations, and unresolved facts that were actually qualified.

## Requirements

### Requirement: Claim scope never exceeds evidence scope
Every triggered claim SHALL have one stable claim record that identifies the accepted outcome reference, claim statement and class, evidence population, coverage basis, production path, baseline and candidate paths when applicable, environment and observation boundary, evidence-lane references, material exclusions and unknowns, maximum supported claim, and disposition `supported | narrowed | blocked | unknown`.

Representative evidence SHALL support only its exercised case or reviewed partition unless the record contains current closure evidence for the broader population. A lifecycle label, checked task, green validation command, model statement, aggregate count, or evidence from a different path or environment SHALL NOT widen the maximum supported claim.

#### Scenario: Representative case cannot complete a population claim
- **WHEN** one real case passes and the current claim covers a larger finite population whose remaining members have no matching closure evidence
- **THEN** the population claim is `narrowed`, `blocked`, or `unknown` rather than `supported`
- **AND** the passing case remains attributable evidence for only its exercised identity and boundary.

#### Scenario: Exact-case result stays exact
- **WHEN** the accepted outcome names one exact input, path, environment, and observation boundary and current evidence proves that same case
- **THEN** the exact-case claim may be `supported`
- **AND** no population, compatibility, safety, or milestone meaning is inferred.

### Requirement: Finite and partitioned populations have explicit closure
A claim over a known finite population SHALL bind one versioned population identity and one terminal row for every member before it is supported. A member MAY be excluded only by an explicit reviewed non-applicability or accepted-scope decision that changes the claimed population before qualification; unsupported implementation, failed behavior, inconvenient cost, or missing evidence SHALL NOT be represented as non-applicable.

When exhaustive enumeration is impossible or not the accepted coverage basis, a partitioned-domain claim SHALL identify the reviewed partition rule, every material class and boundary, representative and negative oracles for each class, residual unrepresented space, and the resulting claim ceiling. Helper code SHALL validate reviewed identities, counts, uniqueness, terminal statuses, and references but SHALL NOT invent membership, semantic equivalence, partitions, exclusions, or thresholds.

#### Scenario: Known finite population closes exhaustively
- **WHEN** every member of the frozen finite population has one current terminal row against the required production path and oracle
- **THEN** the population coverage basis may be complete
- **AND** the supported claim remains bounded to that population, environment, and observation contract.

#### Scenario: One finite member is missing
- **WHEN** the frozen population contains a member with no row, a stale row, a weaker path, an unresolved material observation, or a non-terminal result
- **THEN** complete population closure fails
- **AND** the missing member remains visible rather than being replaced by a representative case or aggregate pass count.

#### Scenario: Partition semantics are not inferred
- **WHEN** a partitioned-domain record supplies test outputs but no reviewed semantic partition rule or residual-space statement
- **THEN** deterministic evaluation returns `unknown` or `blocked`
- **AND** tooling does not cluster inputs or infer equivalence from matching outputs.

### Requirement: Substitutions prove equivalence at the owning boundary
Before a claim says that skipped, omitted, suppressed, cached, replayed, emulated, replaced, or optimized behavior preserves an existing result, the closure record SHALL bind the unchanged baseline request, actor, production path, environment, initial state, candidate path, and applicable output, state, effect, order, timing, fault, recovery, cleanup, and terminal observations. The comparison SHALL reach the owning real boundary whenever the claim depends on real-system behavior.

Lower-fidelity offline, unit, mock, replay, simulator, or representative evidence MAY support design and early proof but SHALL NOT satisfy an available higher-fidelity equivalence dependency. An unobservable, stale, mismatched, or materially unknown dependency SHALL block or narrow the equivalence claim rather than be assumed irrelevant.

#### Scenario: Offline substitution has a reachable real dependency
- **WHEN** offline baseline and candidate outputs match but the accepted equivalence claim depends on a safely reachable real-system state or effect that was not observed
- **THEN** the real-system equivalence claim remains `blocked` or `unknown`
- **AND** the offline component result retains its narrower claim.

#### Scenario: Same-boundary equivalence passes
- **WHEN** baseline and candidate use the frozen actor request, production seam, environment, initial state, complete observation contract, and cleanup and every required comparison is current and equal under its reviewed oracle
- **THEN** the substitution claim may be `supported` for that exact envelope
- **AND** it does not establish another environment, population, deployment, compatibility, or safety claim.

### Requirement: Broad claims receive independent evidence challenge
Before a current result is represented as finite-population complete, partitioned-domain complete, real-system equivalent, compatible, interchangeable, safe, or phase or milestone complete, one fresh read-only evidence-sufficiency reviewer SHALL challenge whether the claim follows from the original accepted outcome and current closure record. The reviewer SHALL inspect population and path identity, coverage basis, real oracle, unresolved observations, evidence freshness, and claim ceiling and SHALL return evidence and gaps without an approval verdict or mutation authority.

Main SHALL independently disposition every material row. Missing or unusable independent challenge evidence SHALL keep only the triggered broad claim `blocked` or `unknown`; it SHALL NOT erase narrower trustworthy proof or require the reviewer for an Ordinary Small exact-case claim.

#### Scenario: Fresh challenge finds a path mismatch
- **WHEN** a broad completion claim composes exhaustive evidence from one implementation path with representative real evidence from another non-equivalent path
- **THEN** the challenge reports the unsupported composition and maximum narrower claims
- **AND** main cannot represent the broad claim as complete without matching closure evidence.

#### Scenario: Ordinary exact-case work remains proportional
- **WHEN** an Ordinary Small outcome and handoff make only one exact-case claim with matching real proof and no substitution or broad-completion trigger
- **THEN** independent claim-evidence review is not required
- **AND** existing focused validation and honest limitation reporting remain sufficient.

### Requirement: Unsupported closure narrows or blocks the claim
Claim-evidence disposition SHALL preserve useful narrower results while preventing unsupported promotion. `supported` SHALL require current evidence matching the complete declared claim. `narrowed` SHALL state the strongest supported subset and the excluded broader claim. `blocked` SHALL name the exact missing prerequisite or owner boundary. `unknown` SHALL name the observation or identity that prevents classification.

The words `safe`, `compatible`, `interchangeable`, `complete`, `all`, `equivalent`, or materially synonymous claims SHALL NOT be emitted beyond the corresponding supported closure and competent authority. User acceptance MAY narrow product scope or accept a contained material limitation, but SHALL NOT waive uncontrolled authorization, privacy, data-integrity, irreversible-action, physical-safety, or envelope-escape evidence.

#### Scenario: Useful narrower evidence survives
- **WHEN** one exact case is proven but the requested population claim is unresolved
- **THEN** the exact case remains `supported` and the population claim remains `blocked` or `unknown`
- **AND** handoff states both dispositions without calling the whole outcome complete.

#### Scenario: Safety language lacks safety authority
- **WHEN** functional evidence exists but the accepted safety assessment, environment, observations, or competent authority is absent
- **THEN** the functional claim may retain its exact ceiling while every safety claim remains blocked
- **AND** successful tests or real-system agreement cannot supply safety authority.
