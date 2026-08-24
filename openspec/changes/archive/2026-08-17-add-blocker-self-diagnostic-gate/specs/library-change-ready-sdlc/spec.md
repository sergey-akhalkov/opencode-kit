## ADDED Requirements

### Requirement: Technical blockers receive bounded self-diagnosis before escalation

Before main declares a technical or evidence blocker, treats a negative observation as product failure, repeats a governed attempt, or escalates an unresolved prerequisite to the owner, it SHALL perform one bounded self-diagnostic pass when the cause or ownership is not already proven. The pass SHALL preserve the accepted goal and envelope; classify the affected layer as Product Candidate, Proof Runner, Evaluator, Environment, Authority, or `unknown`; separate current observed facts from assumptions; inspect material contradictions; verify environment-dependent identities used by the blocker claim; state the narrowest supported claim ceiling; and select the smallest safe causally distinct probe that can falsify a live hypothesis.

An obvious evidenced local defect MAY proceed directly to its authorized correction. When the bounded pass cannot resolve a technical or uncertain failure chain, no unused safe route is known, and owner-only status remains unproven, main SHALL invoke at most one correctly briefed diagnosis-only `troubleshooter` for that failure chain and verify its route. Another equivalent pass or consultation SHALL require new decision-changing evidence or a causally distinct mechanism.

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
- **THEN** main preserves that action as the owner boundary and produces the existing self-contained handoff
- **AND** it does not run diagnostic probes or invoke `troubleshooter` merely to reconfirm owner authority.

### Requirement: Absence-based evidence is qualified before it supports a blocker

A mandatory evidence source used to claim that an event, state, packet, process, response, or side effect is absent SHALL establish its current identity, freshness, observation point and intersection with the expected execution path, expected observable phenomenon, and one safe positive control that demonstrates the source can observe that phenomenon. If a positive control is unavailable, unauthorized, unsafe, or fails, the source SHALL be `unqualified`; its zero, empty, timeout, or absence result SHALL NOT establish Product Candidate failure, completion failure, or owner-only status.

Missing observer qualification SHALL keep only the dependent evidence lane unknown. It SHALL NOT clear or waive safety, identity, liveness, authorization, data-integrity, restoration, cleanup, irreversible-action, envelope, or live-attempt gates, and it SHALL NOT authorize another live or costly attempt through the same blocked path.

#### Scenario: Positive control fails
- **WHEN** a mandatory observer reports no accepted event and a safe positive control also produces no observation
- **THEN** the observer is classified as unqualified and its negative result cannot support a product-failure claim
- **AND** the next action diagnoses observer identity, configuration, or observation-point relevance at a safe lower rung.

#### Scenario: Qualified observer reports absence
- **WHEN** current identity and path checks are green, a representative positive control is observed, and the expected correlated event remains absent
- **THEN** the negative observation may contribute to the scoped blocker evidence
- **AND** main still preserves its claim ceiling and any contradictory direct runtime facts rather than converting one source into broader lifecycle authority.

#### Scenario: Positive control requires a protected effect
- **WHEN** qualifying the observer would require an unauthorized physical, credentialed, remote, destructive, costly, deployed, or otherwise protected action
- **THEN** the observer remains unqualified and the exact qualification path remains owner-blocked
- **AND** main continues any independent safe diagnosis or sufficient alternate proof route without performing or simulating the protected effect.

### Requirement: Diagnostic disposition remains scoped to the affected lane

The self-diagnostic result SHALL distinguish a blocked proof path from a blocked accepted outcome. A Proof Runner, Evaluator, Environment, or unqualified-observer defect SHALL invalidate only dependent evidence and SHALL NOT erase trustworthy direct observations from the same unchanged Product Candidate. When another sufficient safe route can observe the accepted effect, main SHALL keep the defective path blocked and continue through that route without claiming that it clears the defective path.

#### Scenario: Network observer is invalid but direct startup evidence is trustworthy
- **WHEN** immutable direct controller and relay observations remain correlated and a separate packet observer fails qualification
- **THEN** main preserves the direct product observations and marks only the network-observation lane unknown
- **AND** it does not report that startup failed or that the owner must relax the proof contract solely because the packet observer is invalid.

#### Scenario: Accepted outcome requires the unavailable observation
- **WHEN** the accepted observable proof explicitly requires one observation, every safe qualification or sufficient alternate route is exhausted, and the remaining prerequisite crosses an exact protected boundary or unavailable external capability
- **THEN** main stops at that exact decision-ready boundary with the supported claim ceiling
- **AND** it does not substitute unqualified absence, lower-fidelity evidence, or an agent-authored process-control change for the missing observation.
