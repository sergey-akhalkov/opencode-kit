## MODIFIED Requirements

### Requirement: Audit failures retry with bounded concurrency
An arbiter provider error, bounded timeout, malformed result, unknown schema version, correlation mismatch, evidence overflow, retained-child conflict, or unsupported runtime capability SHALL NOT become a completion verdict. The guard SHALL classify each failure as transient retryable, terminal input/state, stale/cancelled, or capability-blocked. Transient failures SHALL reuse only the current valid epoch child with configurable exponential backoff, finite attempt count, and at most one retry timer. Terminal, immutable, stale, or capability failures SHALL NOT enter an infinite retry loop. The arbiter call itself SHALL have a configurable timeout.

Before classifying a missing configured hidden arbiter agent/provider/model route as capability-blocked, the guard SHALL perform a short finite provider-free readiness settle. The settle SHALL create no child and invoke no model, SHALL stop on the current audit cancellation signal, and SHALL preserve the original failure as the cause when readiness remains unavailable. Exhaustion SHALL retain the existing fail-closed capability result rather than enter model-verdict retry.

#### Scenario: Arbiter provider is unavailable
- **WHEN** the configured model call fails transiently and the root has not been interrupted or revised
- **THEN** the guard SHALL show deduplicated Retrying status and retry within the configured attempt/delay limits
- **AND** exhaustion SHALL persist a resumable bounded error without another automatic model call.

#### Scenario: Fresh instance route becomes ready during settle
- **WHEN** the first provider-free route lookup cannot yet resolve the configured hidden arbiter but the same agent/provider/model route becomes available inside the readiness window
- **THEN** the guard SHALL continue the current audit using that route without consuming a model retry
- **AND** it SHALL create at most one current audit child after readiness succeeds.

#### Scenario: Route settle is interrupted or exhausted
- **WHEN** the root is interrupted during readiness settling or the route remains unavailable through the finite window
- **THEN** interruption SHALL cancel the wait without creating a child or model call
- **AND** exhaustion SHALL persist a capability failure with the last route error as its cause.

#### Scenario: Completion evidence is oversized
- **WHEN** bounded projection still produces a final serialized arbiter request above the configured byte limit
- **THEN** the guard SHALL persist a terminal evidence-overflow diagnostic with observed and allowed bytes
- **AND** it SHALL not create or retry an arbiter prompt.

#### Scenario: Root is interrupted during backoff
- **WHEN** the user interrupts before the next retry
- **THEN** the retry timer and child work SHALL be cancelled and the root SHALL remain paused.
