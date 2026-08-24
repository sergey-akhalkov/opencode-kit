## ADDED Requirements

### Requirement: Completion adjudication rejects premature technical-blocker stop

For a current unresolved technical or evidence blocker, the completion arbiter SHALL inspect supplied evidence for the bounded self-diagnostic disposition required by the loaded authority. When the blocker claim relies on contradictory, zero, empty, timeout, or absence-based evidence and the supplied record does not establish the affected layer, material assumptions, observer qualification, claim ceiling, and the smallest remaining safe causally distinct probe, the arbiter SHALL return `continue` with that exact diagnostic evidence gap, next action, next evidence, and stop condition. It SHALL NOT convert incomplete diagnosis, a blocked agent-chosen proof path, or generic uncertainty into `allow_stop` or `owner_required`.

The existing structured `unresolved` and `strategyAssessment` fields SHALL carry this continuation without granting lifecycle authority. A structured owner boundary SHALL remain valid only when evidence proves the exact protected action or unavailable external capability and no unused safe goal-preserving route remains.

#### Scenario: Root trusts an observer that failed its canary
- **WHEN** an enabled root reports a product or owner blocker from zero observer output, the same observer failed its positive control, and direct runtime evidence says the operation occurred
- **THEN** the arbiter returns `continue` for a bounded observer identity, configuration, or observation-path check
- **AND** the guard issues one stale-safe synthetic continuation without treating the user as required.

#### Scenario: Self-diagnostic evidence is complete and owner action is exact
- **WHEN** the current evidence includes the bounded self-diagnostic disposition and proves that every sufficient safe route requires one exact protected owner action
- **THEN** the arbiter may return `owner_required` with the existing structured owner boundary
- **AND** it does not require a redundant `troubleshooter` consultation.

#### Scenario: Blocked path has a safe alternate route
- **WHEN** one proof path remains blocked but supplied evidence identifies an unused safe route that can observe the accepted effect within the current envelope
- **THEN** the arbiter returns `continue` for that route and preserves the blocked-path claim ceiling
- **AND** evidence from the alternate route cannot be represented as clearing the blocked path.

### Requirement: Stagnant diagnosis uses one independent consultation

When the same technical or uncertain failure chain remains after the bounded main self-diagnostic pass, no unused safe route is known, and owner-only status is unproven, the guard SHALL require one diagnosis-only `troubleshooter` consultation with the complete recorded case file. The case file SHALL include the layer classification, observed facts, assumptions, contradictions, observer-qualification state when applicable, prior probes, protected boundaries, and exact validation gate. The guard SHALL NOT require or accept another equivalent consultation without new decision-changing evidence or a causally distinct mechanism.

#### Scenario: Main pass remains inconclusive
- **WHEN** the root records a complete bounded self-diagnostic pass but cannot distinguish the remaining technical hypotheses and no unused safe route is known
- **THEN** the guard requires one correlated `troubleshooter` consultation before owner escalation
- **AND** main verifies and executes any returned authorized route rather than forwarding the consultant report as authority.

#### Scenario: Equivalent consultation already completed
- **WHEN** one correlated `troubleshooter` consultation completed for the same unchanged failure chain and no new decision-changing evidence or distinct mechanism exists
- **THEN** the guard does not request another equivalent consultation
- **AND** the unresolved disposition retains the exact missing evidence or proven owner boundary without entering a consultant loop.
