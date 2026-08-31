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
Before adding accepted behavior to a mixed, navigation-heavy, or broadly exercised current owner, main SHALL identify whether the current case contains one owner-local capability whose bounded contract, diagnostics, and direct oracle can be understood and changed without unrelated parent context. When it does, and reuse cannot satisfy the contract, the current-change architecture SHALL prefer one cohesive private extraction or minimal private capability over burying that behavior in the broad physical owner, provided the semantic owner retains lifecycle, state, integration, and public-contract authority.

The extraction SHALL stay inside the accepted implementation and proof scope, remove or delegate the superseded path, and expose only the narrowest contract required by current consumers. When those facts are absent, direct owner reshape SHALL remain valid. The requirement SHALL NOT authorize broad cleanup, a public framework, one module per task/function, or extraction based on file length alone.

#### Scenario: Same semantic owner gains a private capability
- **WHEN** a current owner remains responsible for the accepted behavior but one new case has an independent current contract, diagnostics, and direct oracle
- **THEN** main may reshape the owner into a coordinator plus one private cohesive capability
- **AND** retains one lifecycle/state/public owner and proves both the capability and composed path.

#### Scenario: Existing capability is reused instead of rebuilt
- **WHEN** a source-verified current-repository or platform capability satisfies the accepted contract and effect envelope at lower total lifecycle cost
- **THEN** main calls that capability through the current owner rather than implementing another copy
- **AND** focused proof covers the current use and the owner's composed behavior.

#### Scenario: Wrapper-only extraction is rejected
- **WHEN** a proposed file or module only forwards calls, has no current independent contract or oracle, and adds navigation without isolating behavior or failure
- **THEN** main keeps the cohesive direct owner shape or selects another evidenced boundary
- **AND** does not count the wrapper as modularity improvement.
