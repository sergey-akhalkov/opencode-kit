## ADDED Requirements

### Requirement: Current independent capabilities receive direct proof before parent integration
When current implementation evidence exposes a bounded capability with a distinct input/output/error/effect contract and an oracle that can directly falsify that capability without executing the complete parent scenario, main SHALL execute and observe that direct boundary before dependent parent integration. Direct evidence SHALL preserve the capability candidate and environment identity, representative input, exit or result status, output and diagnostics, effects, cleanup, and focused validation applicable to that boundary.

Capability success SHALL support only that capability. The semantic owner or parent SHALL remain incomplete until the composed path runs at its own representative boundary and obtains a distinct integration observation. A correction to the capability SHALL invalidate dependent parent evidence; an integration-only correction SHALL not invalidate unrelated current capability evidence unless its contract, candidate, or environment dependency changes.

#### Scenario: Capability proof precedes composition proof
- **WHEN** a parent behavior depends on one owner-local capability that can be invoked and falsified directly
- **THEN** main proves the capability at that boundary before running the dependent parent path
- **AND** separately observes the parent's integration result before reporting the accepted outcome working.

#### Scenario: Green component does not prove the owner
- **WHEN** the direct capability check passes but the parent composition has not run or fails
- **THEN** main keeps the parent outcome incomplete or failed
- **AND** does not substitute the component result for integration evidence.

#### Scenario: No truthful component boundary exists
- **WHEN** current evidence shows the behavior can only be observed and corrected at one inseparable integration boundary
- **THEN** main keeps the cohesive implementation and runs that boundary directly
- **AND** creates no fake component oracle or extraction solely to satisfy this requirement.

### Requirement: Current-owner reshape may improve physical capability locality
When the current architecture and reuse decision reshapes one semantic owner through a private capability, the proof plan SHALL identify that capability's bounded contract, diagnostics, direct oracle, and dependency on the parent's lifecycle, state, integration, and public-contract authority. Change-Ready SHALL preserve the capability and parent as distinct evidence boundaries without treating the private module as a second semantic owner.

The selected extraction SHALL stay inside the accepted implementation and proof scope, remove or delegate the superseded path, and expose only the narrowest contract required by current consumers. When no truthful direct capability oracle exists, direct owner reshape and parent-only proof SHALL remain valid. This requirement governs evidence topology; it SHALL NOT select a source boundary, authorize broad cleanup or a public framework, map tasks/functions to modules, or use file length, navigation frequency, or exercise breadth as an extraction proxy.

#### Scenario: Same semantic owner gains a private capability
- **WHEN** the current architecture decision keeps one owner responsible for the accepted behavior and selects one private capability with an independent current contract, diagnostics, and direct oracle
- **THEN** Change-Ready records the owner and capability as distinct dependent proof boundaries
- **AND** retains one lifecycle/state/public owner and proves both the capability and composed path.

#### Scenario: Existing capability is reused instead of rebuilt
- **WHEN** a source-verified current-repository or platform capability satisfies the accepted contract and effect envelope at lower total lifecycle cost
- **THEN** the proof plan identifies that selected capability through the current owner rather than treating another copy as a proof boundary
- **AND** focused proof covers the current use and the owner's composed behavior.

#### Scenario: Wrapper-only extraction is rejected
- **WHEN** a proposed file or module only forwards calls, has no current independent contract or oracle, and adds navigation without isolating behavior or failure
- **THEN** Change-Ready does not create a separate component-proof boundary for that wrapper
- **AND** keeps proof at the cohesive owner boundary or another architecture-selected truthful boundary.
