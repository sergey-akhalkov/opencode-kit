## ADDED Requirements

### Requirement: Independent accepted work SHALL continue under scoped blockers
When a prerequisite, uncertainty, protected action, product decision, technical failure, unavailable capability, or Live-Attempt Gate blocks one dependency cone, main SHALL preserve that cone and its evidence ceiling while executing every dependency-valid accepted-scope item outside it. A blocker SHALL become global only when the still-current accepted outcome has no runnable independent item and the remaining decision is an exact material product choice; non-product prerequisites SHALL remain scoped gates or honest waiting states.

#### Scenario: Live-attempt lane is blocked but implementation work remains
- **WHEN** one proof lane has a blocked or unknown Live-Attempt Gate and an implementation, diagnostic, documentation, harness, or alternate-proof item does not depend on that lane
- **THEN** main keeps the live lane blocked and completes the independent item
- **AND** does not claim that independent evidence clears the Live-Attempt Gate.

#### Scenario: Product semantics are unresolved for one component
- **WHEN** a material product choice blocks one component and another accepted component is invariant across all current options
- **THEN** main parks the decision for the affected component and continues the invariant component
- **AND** asks the product question only when no dependency-valid accepted item remains.

#### Scenario: No executable route exists
- **WHEN** all incomplete accepted work depends on an unavailable technical, capability, safety, access, or external prerequisite and no product decision is required
- **THEN** main reports the exact non-terminal waiting state and resume condition
- **AND** does not relabel the prerequisite as a product blocker, waive it, repeat blindly, or claim completion.

## MODIFIED Requirements

### Requirement: Unknown real behavior stops only dependent expansion

When missing, unobservable, or mismatched real behavior can invalidate planned downstream behavior required by the still-current accepted outcome, the main session SHALL stop adding behavior in that dependency chain until characterization or equivalence evidence resolves the uncertainty. Independent accepted work that does not rely on that uncertainty SHALL continue while it remains dependency-valid, authorized, and safe.

When the unknown behavior or protected prerequisite belongs only to an agent-chosen path and the accepted outcome admits another safe real route, main SHALL keep the affected path and its Live-Attempt Gate blocked, autonomously reconcile planning controls, and continue through the goal-preserving route without representing it as proof of the blocked path. When no runnable item remains, one exact material product decision with no accepted reversible default MAY be presented as `product_decision_required`; an unavailable external capability or exact protected action SHALL instead remain a non-product gate with an honest waiting state and resume condition.

The product-decision/waiting distinction in this requirement applies to explicitly grind-enabled roots. Outside grind, the existing decision-ready owner handoff remains unchanged.

#### Scenario: Emulator behavior relies on an uncharacterized state transition

- **WHEN** the next emulator layer depends on a real-system state transition whose output, ordering, side effects, or recovery semantics are unknown
- **THEN** dependent emulator expansion stops before that layer
- **AND** independent parser, diagnostics, or harness work SHALL continue when it does not assume the unknown transition.

#### Scenario: Blocked live path is not the root outcome

- **WHEN** a live-attempt gate blocks repetition of one proof path but another safe real route can observe the accepted effect without weakening an invariant or protected boundary
- **THEN** main scopes the blocked gate to that exact path, reconciles the plan, and continues the original outcome through the alternate route
- **AND** evidence from the alternate route does not clear, waive, or claim the blocked path.

#### Scenario: Every sufficient route requires the protected action

- **WHEN** the original accepted outcome requires an effect that no safe real route can observe without an exact protected owner action and no independent accepted item remains runnable
- **THEN** main preserves that action as a non-product gate and reports the exact waiting state and resume condition
- **AND** it neither asks a product question, substitutes lower-fidelity evidence, rewrites artifacts to waive the action, nor executes it without authority.

### Requirement: Technical blockers receive bounded self-diagnosis before escalation

Before main declares a technical or evidence blocker, treats a negative observation as product failure, repeats a governed attempt, or escalates an unresolved prerequisite, it SHALL perform one bounded self-diagnostic pass when the cause or ownership is not already proven. The pass SHALL preserve the accepted goal and envelope; classify the affected layer as Product Candidate, Proof Runner, Evaluator, Environment, Authority, or `unknown`; separate current observed facts from assumptions; inspect material contradictions; verify environment-dependent identities used by the blocker claim; state the narrowest supported claim ceiling; and select the smallest safe causally distinct probe that can falsify a live hypothesis.

An obvious evidenced local defect MAY proceed directly to its authorized correction. When the bounded pass cannot resolve a technical or uncertain failure chain, no unused safe route is known, and owner-only status remains unproven, main SHALL invoke at most one correctly briefed diagnosis-only `troubleshooter` for that failure chain and verify its route. Another equivalent pass or consultation SHALL require new decision-changing evidence or a causally distinct mechanism. In an explicitly grind-enabled root, a proven non-product protected action or unavailable capability SHALL remain a scoped gate: main SHALL continue every independent runnable item and then enter exact non-product waiting if the runnable frontier empties. It SHALL NOT convert that gate into `product_decision_required` or a user question. Outside grind, the existing decision-ready owner handoff remains unchanged.

#### Scenario: Contradictory evidence points to the proof path
- **WHEN** direct runtime facts show that an accepted operation occurred while an indirect mandatory observer reports no event and its canary also reports no event
- **THEN** main classifies the observer, runner, and environment as live hypotheses before claiming Product Candidate failure
- **AND** it performs the smallest safe identity, topology, or observation-path probe without asking the owner to waive the evidence requirement.

#### Scenario: Straightforward local defect is already proven
- **WHEN** current source or runtime evidence proves one authorized local defect and the correction does not cross a protected boundary
- **THEN** main applies the smallest correction through its normal production-author route
- **AND** it does not add a generic diagnostic ceremony or invoke `troubleshooter` merely to reconfirm the known cause.

#### Scenario: Owner-only action is already proven
- **WHEN** the accepted outcome requires an exact protected action and evidence proves that no unused safe goal-preserving route can advance the dependency chain
- **THEN** a grind-enabled root preserves that action as a scoped non-product gate, completes every independent runnable item, and enters exact waiting only after the runnable frontier is empty
- **AND** it neither asks a product question nor runs diagnostic probes or invokes `troubleshooter` merely to reconfirm the action boundary; outside grind, the existing self-contained owner handoff remains available.
