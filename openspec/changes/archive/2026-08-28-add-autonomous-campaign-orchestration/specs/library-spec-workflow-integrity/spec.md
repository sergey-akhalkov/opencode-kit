## MODIFIED Requirements

### Requirement: Checked tasks have candidate-correlated evidence

Every checked behavior, proof, validation, manual, or external task SHALL have one versioned evidence-index row containing task ID, task text digest, candidate/environment identity, named entrypoint or manual gate, exact invocation/status, bounded artifact refs, cleanup, and result. A task whose evidence uses a weaker entrypoint/effect set than its text, references a stale candidate, is missing, or is red SHALL be reported incomplete regardless of checkbox state. Schema-v2 task rows MAY omit `candidateId` and `environmentId` only to inherit the required top-level index identities, MAY omit `requiredBoundary` only to inherit the same row's explicit `boundary`, and MAY omit `artifacts` only to represent an empty reference list. Readers SHALL materialize those inherited values before stale/envelope evaluation; explicit row values remain supported and any explicit mismatch remains stale or mismatched. Compact inheritance SHALL NOT infer task meaning, effects, completion, or identity from prose, filenames, or aggregate counts.

#### Scenario: Desktop Restart task has only helper proof
- **WHEN** a checked task names Desktop and tray Restart but evidence records only a direct helper invocation
- **THEN** completion and qualification gates reject the task as proof-envelope mismatch
- **AND** preserve the helper evidence as partial rather than deleting it

#### Scenario: Task evidence matches current candidate
- **WHEN** task digest, candidate, environment, named boundary, status, artifacts, and cleanup all match
- **THEN** the checkbox may contribute to completion
- **AND** later candidate mutation invalidates only dependent rows

#### Scenario: Redundant task evidence uses compact inheritance
- **WHEN** a schema-v2 index contains top-level candidate/environment identities and a task row omits its identical row identities and `requiredBoundary`
- **THEN** the reader resolves the top-level identities and the row's explicit boundary and performs the same digest/currentness/effect checks as the expanded form

#### Scenario: Explicit mismatches remain visible
- **WHEN** a task row explicitly records a different candidate, environment, or required boundary from the current top-level/observed values
- **THEN** the reader preserves the explicit value and reports the existing stale or envelope-mismatch result rather than inheriting over it

### Requirement: Spec Capsule carries proportional claim-evidence scope

Every behavior-changing proposal SHALL add one `Claim And Evidence Scope` record or accepted project-native equivalent. For an exact-case Ordinary Small increment, the record MAY be one concise statement naming the exact claim and matching proof boundary. When a claim generalizes beyond exercised cases, composes evidence paths, substitutes behavior, depends on a real system, or asserts finite-population, partitioned-domain, compatibility, interchangeability, safety, or phase/milestone scope, the record SHALL identify the claim class, population, coverage basis, production and comparison paths, environment, real oracle, unresolved observations, and maximum claim.

Triggered evidence-bearing changes SHALL store the structured claim records in the existing bounded evidence index and reference existing evidence lanes rather than duplicate hashes, raw facts, or semantic records. OpenSpec artifact instructions SHALL preserve one owner for the complete record and SHALL NOT require each task to repeat unchanged claim fields. A schema-v2 partition population MAY omit `materialClasses` only to inherit an exact copy of its explicit `members`; readers SHALL materialize that list before claim evaluation, while any explicit mismatch remains visible.

#### Scenario: Ordinary proposal remains concise
- **WHEN** a behavior change makes one exact-case claim with one matching local real boundary and no broad trigger
- **THEN** its Spec Capsule records the exact claim and boundary without a population matrix or independent assurance task
- **AND** proposal readiness remains proportional.

#### Scenario: Broad proposal declares closure before implementation
- **WHEN** a proposal claims a finite population, substitution, compatibility, safety, or phase/milestone result
- **THEN** its Claim And Evidence Scope names the population, paths, coverage basis, real oracle, unknown handling, and claim ceiling before production mutation
- **AND** later tasks reference that record rather than inventing completion from validation output.

#### Scenario: Partition member classes use compact inheritance
- **WHEN** a schema-v2 partition population omits `materialClasses` while retaining its explicit ordered `members`
- **THEN** the reader resolves material classes to the exact member list before completeness and mismatch evaluation

## ADDED Requirements

### Requirement: Schema-v2 evidence records remain exact under compact storage

Schema-v2 evidence readers SHALL accept a lane file as either the existing object with `path`, `bytes`, and `digest` fields or the exact compact tuple `[path, bytes, digest]`. They SHALL accept a named-entrypoint task as either its existing expanded object or `["entrypoint", taskId, taskTextDigest, result, boundaryName, effects, command, status, recordedAt, cleanup]`; the compact form explicitly represents a named-entrypoint boundary, an identical required boundary, top-level candidate/environment identity, empty artifacts, and no manual gate. They SHALL accept a claim observation as either its existing expanded object or `["observation", memberId, status, terminal, evidenceRefs]`; the compact form inherits exact candidate/environment, paths, and observation-boundary copies from its containing claim and represents an empty unresolved-observation list. All forms SHALL resolve to the same internal records before containment, uniqueness, retention, hash, task, lane, or claim evaluation. Existing expanded forms SHALL remain readable and preserve explicit mismatches. The deterministic evidence materializer SHALL refresh each file from disk and write eligible compact records in stable existing order. Compact storage SHALL NOT omit or infer a unique path, byte count, digest, file, lane, identity, boundary, invocation, status, cleanup, evidence reference, or semantic fact, and SHALL NOT weaken the existing 65,536-byte index ceiling.

#### Scenario: Compact and expanded lane files resolve identically
- **WHEN** one schema-v2 index uses expanded lane file objects and an otherwise identical index uses exact compact tuples
- **THEN** both readers resolve the same paths, byte counts, digests, lane membership, retention totals, and currentness results

#### Scenario: Malformed compact lane file remains invalid
- **WHEN** a compact lane file has another length or order, an unsafe path, a non-integer byte count, or a non-SHA-256 digest
- **THEN** the reader rejects that exact row without inferring or repairing the missing fact

#### Scenario: Compact task and observation rows preserve exact expanded facts
- **WHEN** a named-entrypoint task or claim observation contains only the facts represented by its exact compact tuple and exact inherited copies
- **THEN** the reader resolves the same task or observation as the expanded object before currentness and claim evaluation

#### Scenario: Explicit compact-row mismatches stay expanded and visible
- **WHEN** a task or observation explicitly differs from its top-level or containing-claim identity, boundary, or path facts
- **THEN** the expanded record remains supported and the existing stale, mismatch, blocked, or unknown result remains visible rather than being compacted away
