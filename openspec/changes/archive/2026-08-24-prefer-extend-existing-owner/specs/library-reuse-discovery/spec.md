## MODIFIED Requirements

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

## ADDED Requirements

### Requirement: Extend means reshape the current owner

`extend` SHALL mean changing the current same-responsibility owner's contract, shape, or cases so the accepted feature becomes a case of that owner. It SHALL NOT mean adding a sibling file, function, or module that copies or nearly copies that owner while leaving the original unchanged.

`reuse` SHALL mean calling the current owner without a contract change. `build-minimal` SHALL be selected only when the accepted behavior is a genuinely new responsibility or no reached verified owner can absorb the case at lower total lifecycle cost. Hypothetical future callers SHALL NOT justify `build-minimal` or a new shared framework.

Same-responsibility reshape SHALL remain inside `simplicity-and-reuse`. Mixed-file second responsibility, a named new change axis, or a new seam decision SHALL remain inside `architecture-and-change-locality`. The two practices SHALL NOT launch for each other's primary trigger.

#### Scenario: New case is absorbed by the current owner

- **WHEN** an accepted feature is a new case of a verified current owner
- **THEN** the disposition records `extend` and names that owner
- **AND** the implementation changes that owner rather than adding a sibling implementation.

#### Scenario: New responsibility is not forced into the current owner

- **WHEN** inspected evidence shows the accepted behavior is a different responsibility from the touched owner
- **THEN** the author does not record `extend` against that owner
- **AND** routes mixed-file or change-axis questions to `architecture-and-change-locality` instead of inventing a shared abstraction.

#### Scenario: Third similar copy still follows Rule of Three

- **WHEN** two existing implementations already exist and a third similar case is accepted
- **THEN** discovery may select `extend` or extract only after the stable common shape is evident
- **AND** a second similar case alone SHALL NOT require a new generic framework.
