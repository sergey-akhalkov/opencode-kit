# library-reuse-discovery Specification

## Purpose
Define proportional reuse-first discovery for new mechanisms without requiring a private registry, while preserving explicit cross-project scope, current-source verification, degraded behavior, and trivial-work opt-out.

## Requirements

### Requirement: New mechanisms trigger proportional reuse discovery

Before production code, a change that adds a package dependency, top-level mechanism or reusable API, out-of-owner infrastructure capability, multi-implementation abstraction, or another implementation of repeated behavior SHALL load the reuse-discovery workflow. A change that is about to add a second implementation of a live same-responsibility owner, or whose same-versus-new responsibility classification is decision-changing and uncertain, SHALL also load it.

When local evidence already names a current same-responsibility owner for the accepted new case, the author SHALL select `extend` from always-loaded authority and SHALL NOT load the workflow solely for compliance. Owner-local fixes, data/config/generated/mechanical edits, and glue under an already selected API SHALL NOT trigger it unless they independently introduce one of those boundaries.

#### Scenario: New parser boundary triggers discovery

- **WHEN** a change proposes a parser not already owned by the touched subsystem
- **THEN** the author loads reuse discovery before production code
- **AND** records the final disposition.

#### Scenario: Trivial local correction remains ceremony-free

- **WHEN** a change only corrects punctuation in an existing owner and adds no mechanism
- **THEN** it proceeds without loading reuse discovery
- **AND** performs no cross-project search solely for compliance.

#### Scenario: Known same-responsibility owner stays on the compact path

- **WHEN** accepted new behavior is a new case of a named current same-responsibility owner
- **THEN** the author selects `extend` without loading reuse discovery solely for compliance
- **AND** does not add a sibling module for that case.

#### Scenario: Explicit sibling loads discovery

- **WHEN** the author is about to add a second implementation of a live same-responsibility owner
- **THEN** the author loads reuse discovery before production code
- **AND** records whether `extend` can absorb the case or `build-minimal` is required.

### Requirement: Discovery follows a bounded cheapest-first order

Triggered discovery SHALL first remove or narrow unnecessary capability, then search the current repository, platform/standard-library support and already installed dependencies, an explicitly configured and authorized cross-project source, and applicable bounded public ecosystem evidence. It SHALL stop when a verified candidate satisfies the current contract at lower total lifecycle cost or when the next layer is unavailable or costs more than its likely decision value. `build-minimal` SHALL be selected only after the reached layers provide no better verified fit.

#### Scenario: Current repository satisfies the contract

- **WHEN** a current repository owner satisfies the required input, output, error, effect, and constraint contract
- **THEN** discovery selects `reuse` or `extend` without querying broader sources
- **AND** identifies that current owner in the disposition.

#### Scenario: No verified source fits

- **WHEN** every safely reachable layer is searched and no candidate satisfies the current contract at lower total cost
- **THEN** the author selects the smallest concrete `build-minimal` owner
- **AND** does not add a speculative plugin point or reusable framework.

### Requirement: Cross-project discovery is explicit and source-verified

Cross-project discovery SHALL use only a repository or machine-local source whose project scope and authority are explicitly configured. Queries SHALL use bounded capability terms and SHALL NOT enumerate or disclose unrelated projects as a trust source. Before `reuse` or `extend`, the author SHALL inspect the selected candidate's current source and relevant evidence and verify the actual contract, effects, constraints, and integration ownership.

#### Scenario: Configured graph returns a promising peer

- **WHEN** an explicitly configured cross-project graph returns a candidate for the requested capability
- **THEN** the author opens the selected current source before choosing it
- **AND** treats graph metadata as discovery data rather than compatibility proof.

#### Scenario: Candidate source is stale or unreadable

- **WHEN** the selected entrypoint is missing, stale, ambiguous, or not readable in the current bound source
- **THEN** the author does not claim `reuse` or portability from the index record
- **AND** records the source-verification failure.

### Requirement: Unavailable cross-project discovery degrades explicitly

If no configured cross-project source is available, its index is stale without a safe refresh path, or explicit scope cannot be established, the workflow SHALL report that layer as `degraded`. It SHALL continue through current-repository, platform/dependency, and applicable bounded ecosystem evidence without claiming complete peer discovery.

#### Scenario: Cross-project graph is unavailable

- **WHEN** triggered discovery cannot reach an explicitly configured cross-project source
- **THEN** the disposition marks the cross-project layer `degraded`
- **AND** a minimal implementation remains permitted after the other required layers are exhausted.

### Requirement: Discovery records one compact disposition

Triggered work SHALL record the requested capability and trigger, sources reached and blocked, material candidates, one `reuse | extend | build-minimal` decision, the contract-fit and total-lifecycle-cost reason, and cross-project state `verified | degraded | not-applicable`. The disposition SHALL NOT include a private registry sync, inventory, cache, outbox, or promotion status.

#### Scenario: Verified peer is selected

- **WHEN** a source-verified peer candidate satisfies the current contract at lower total lifecycle cost
- **THEN** the disposition records `reuse` or `extend` and cross-project state `verified`
- **AND** names the selected source owner without copying a full search transcript.

### Requirement: Discovery never grants mutation authority

Discovery results SHALL NOT authorize dependency installation, source copying, package publication, remote repository mutation, credentials, or another protected action. Those actions SHALL retain their existing owner and project-native gates.

#### Scenario: Public package appears suitable

- **WHEN** bounded read-only ecosystem research identifies a suitable package
- **THEN** the workflow may recommend it with evidence
- **AND** SHALL NOT install or add it without the separately authorized product change.

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
