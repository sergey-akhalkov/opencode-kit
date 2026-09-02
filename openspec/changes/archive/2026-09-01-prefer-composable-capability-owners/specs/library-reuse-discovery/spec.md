## MODIFIED Requirements

### Requirement: Extend means reshape the current owner
`extend` SHALL mean changing the current same-responsibility owner's contract, internal shape, or cases so the accepted feature becomes a case of that owner. When current evidence defines a bounded private capability with its own contract and directly exercisable oracle, `extend` MAY reshape the owner by moving that capability into one cohesive private module while the current owner retains behavior, lifecycle, state, and public-contract authority and delegates to the module. It SHALL NOT mean adding a sibling file, function, or module that copies or nearly copies the owner while leaving the original path unchanged.

`reuse` SHALL mean calling a verified current capability without a contract change. `build-minimal` SHALL be selected only when the accepted behavior is a genuinely new responsibility or no reached verified owner or capability can absorb the case at lower total lifecycle cost. Hypothetical future callers SHALL NOT justify `build-minimal`, extraction, or a new shared framework.

Same-responsibility reshape SHALL remain inside `simplicity-and-reuse`. Mixed-file second responsibility, a named new change axis, or a new seam decision SHALL remain inside `architecture-and-change-locality`. The two practices SHALL NOT launch for each other's primary trigger. Physical extraction under a selected semantic owner SHALL NOT by itself create a second Practice Owner route.

#### Scenario: New case is absorbed by the current owner
- **WHEN** an accepted feature is a new case of a verified current owner and has no independently valuable capability boundary
- **THEN** the disposition records `extend` and names that owner
- **AND** the implementation changes that owner rather than adding a sibling implementation.

#### Scenario: Current owner reshapes through private extraction
- **WHEN** an accepted same-responsibility case contains a current bounded capability with a directly exercisable oracle
- **THEN** the disposition MAY record `extend` and reshape the owner through one private cohesive extraction
- **AND** the original path delegates or is removed so the extraction does not duplicate ownership.

#### Scenario: New responsibility is not forced into the current owner
- **WHEN** inspected evidence shows the accepted behavior is a different responsibility from the touched owner
- **THEN** the author does not record `extend` against that owner
- **AND** routes mixed-file or change-axis questions to `architecture-and-change-locality` instead of inventing a shared abstraction.

#### Scenario: Third similar copy still follows Rule of Three
- **WHEN** two existing implementations already exist and a third similar case is accepted
- **THEN** discovery may select `extend` or extract only after the stable common shape is evident
- **AND** a second similar case alone SHALL NOT require a new generic framework.

## ADDED Requirements

### Requirement: Established ecosystem evidence informs but does not decide selection
When bounded public-ecosystem research is applicable and authorized, discovery SHALL consider current contract fit, adaptation and runtime cost, provenance, maintenance, adoption evidence, license and security evidence, upgrade ownership, proof cost, and resulting code and context cost. Broad adoption or popularity SHALL count only as supporting maintenance and operational evidence and SHALL NOT override an input, output, error, effect, constraint, safety, license, or lifecycle mismatch.

An established verified candidate that satisfies the current contract at lower total lifecycle cost SHALL be preferred over `build-minimal`. A popular but unsuitable, stale, unverified, unsafe, or materially more expensive candidate SHALL be rejected or retained only as an unresolved candidate. Discovery SHALL not install or execute a candidate merely to establish popularity or compliance.

#### Scenario: Established verified candidate fits
- **WHEN** a maintained ecosystem capability has source-verifiable contract, provenance, effects, constraints, license/security evidence, and lower total lifecycle cost than a local implementation
- **THEN** discovery selects `reuse` or the smallest adaptation of that capability
- **AND** records the evidence that made it a better fit than `build-minimal`.

#### Scenario: Popular candidate conflicts with the contract
- **WHEN** a widely adopted candidate cannot satisfy a required error, effect, safety, license, or lifecycle constraint
- **THEN** discovery does not select it solely because it is popular
- **AND** continues the bounded search or records `build-minimal` only after reached candidates are exhausted.

#### Scenario: Ecosystem evidence is unavailable
- **WHEN** bounded public research is inapplicable, unauthorized, or unavailable
- **THEN** discovery records that stopped layer and continues with current-repository and platform/dependency evidence
- **AND** makes no claim that the selected option is the most popular or universally reusable.
