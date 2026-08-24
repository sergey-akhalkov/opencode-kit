## ADDED Requirements

### Requirement: Spec Capsule carries proportional claim-evidence scope
Every behavior-changing proposal SHALL add one `Claim And Evidence Scope` record or accepted project-native equivalent. For an exact-case Ordinary Small increment, the record MAY be one concise statement naming the exact claim and matching proof boundary. When a claim generalizes beyond exercised cases, composes evidence paths, substitutes behavior, depends on a real system, or asserts finite-population, partitioned-domain, compatibility, interchangeability, safety, or phase/milestone scope, the record SHALL identify the claim class, population, coverage basis, production and comparison paths, environment, real oracle, unresolved observations, and maximum claim.

Triggered evidence-bearing changes SHALL store the structured claim records in the existing bounded evidence index and reference existing evidence lanes rather than duplicate hashes, raw facts, or semantic records. OpenSpec artifact instructions SHALL preserve one owner for the complete record and SHALL NOT require each task to repeat unchanged claim fields.

#### Scenario: Ordinary proposal remains concise
- **WHEN** a behavior change makes one exact-case claim with one matching local real boundary and no broad trigger
- **THEN** its Spec Capsule records the exact claim and boundary without a population matrix or independent assurance task
- **AND** proposal readiness remains proportional.

#### Scenario: Broad proposal declares closure before implementation
- **WHEN** a proposal claims a finite population, substitution, compatibility, safety, or phase/milestone result
- **THEN** its Claim And Evidence Scope names the population, paths, coverage basis, real oracle, unknown handling, and claim ceiling before production mutation
- **AND** later tasks reference that record rather than inventing completion from validation output.

### Requirement: Complete archive requires current claim-evidence closure
The complete-archive path SHALL reject a triggered broad claim when its current structured claim record is absent, stale, references a weaker production path or environment, lacks required population or partition closure, omits the real oracle, has unresolved material observations, lacks the required independent challenge, or has disposition `blocked | unknown`. A `narrowed` disposition MAY support archive only when the accepted outcome itself names that narrower result or a current owner decision has explicitly changed the accepted product scope; archive output SHALL state the narrower ceiling.

Operation helpers SHALL evaluate only explicit reviewed fields, evidence-index references, identities, counts, and terminal statuses. They SHALL return `unknown` for unsupported semantic closure and SHALL NOT infer equivalence, non-applicability, safety, compatibility, or claim class from prose, filenames, tests, or aggregate counts.

#### Scenario: All tasks pass but broad closure is missing
- **WHEN** every task is checked and project validation is green but a triggered population or real-system claim lacks matching closure
- **THEN** complete archive exits non-zero with the exact claim and evidence gap
- **AND** narrower trustworthy task evidence remains preserved.

#### Scenario: Narrowed accepted result archives honestly
- **WHEN** the current accepted outcome explicitly permits an exact narrower claim and its closure is supported while a broader future claim is excluded
- **THEN** complete archive may proceed for the narrower outcome
- **AND** archive and handoff do not call the excluded broader claim complete.
