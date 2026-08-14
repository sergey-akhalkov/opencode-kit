## MODIFIED Requirements

### Requirement: Audit failures retry with bounded concurrency
An arbiter provider error, bounded timeout, malformed result, unknown schema version, correlation mismatch, evidence overflow, retained-child conflict, or unsupported runtime capability SHALL NOT become a completion verdict. The guard SHALL classify each failure as transient retryable, terminal input/state, stale/cancelled, or capability-blocked. Transient failures SHALL reuse only the current valid epoch child with configurable exponential backoff, finite attempt count, and at most one retry timer. Terminal, immutable, stale, or capability failures SHALL NOT enter an infinite retry loop. The arbiter call itself SHALL have a configurable timeout.

#### Scenario: Arbiter provider is unavailable
- **WHEN** the configured model call fails transiently and the root has not been interrupted or revised
- **THEN** the guard SHALL show deduplicated Retrying status and retry within the configured attempt/delay limits
- **AND** exhaustion SHALL persist a resumable bounded error without another automatic model call.

#### Scenario: Completion evidence is oversized
- **WHEN** bounded projection still produces a final serialized arbiter request above the configured byte limit
- **THEN** the guard SHALL persist a terminal evidence-overflow diagnostic with observed and allowed bytes
- **AND** it SHALL not create or retry an arbiter prompt.

#### Scenario: Root is interrupted during backoff
- **WHEN** the user interrupts before the next retry
- **THEN** the retry timer and child work SHALL be cancelled and the root SHALL remain paused.

## ADDED Requirements

### Requirement: Completion evidence is bounded on every surface
The session-delivery projection SHALL cap human messages, question/permission events, todos and todo history, assistant/tool/validation/diff evidence, descendants, audit refs, strategy refs, and synthetic messages using explicit stable limits. Every omission or truncated text SHALL produce a bounded truncation record. The guard SHALL measure the exact final serialized request passed to the provider.

#### Scenario: Long root exceeds a surface limit
- **WHEN** a root contains more human, todo, event, or execution evidence than the configured projection permits
- **THEN** the projection returns the retained bounded subset and explicit omitted counts
- **AND** the arbiter is not given an unbounded surface.

### Requirement: Guard restart reconciles enabled roots and async ownership
On startup the guard SHALL inspect persisted grind-enabled parentless roots in its configured directory, validate root/runtime identity, reconstruct bounded retry and question provenance, reconcile PTY and background-child liveness, and schedule one settle pass for safely recoverable idle roots. Unknown writer, lease, child, or reply state SHALL remain fail-closed with actionable status. Startup SHALL NOT infer completion or resume a root from transcript prose.

#### Scenario: Runtime restarts during retry
- **WHEN** a grind-enabled root persisted a transient retry below its attempt limit and no revision or async ownership changed
- **THEN** startup schedules at most one remaining bounded retry or settle pass
- **AND** it does not reset the attempt counter or create another child.

#### Scenario: Runtime restarts with running unleased child
- **WHEN** a child remains running but no trustworthy reconstructed lease identifies its handoff state
- **THEN** the root remains Waiting/Error with unknown ownership
- **AND** completion arbitration does not start.

### Requirement: Waiting async work receives bounded deterministic rechecks
Waiting roots SHALL receive a configurable bounded recheck after PTY/task transitions and while a consumed-result handoff is pending. A terminal background child whose synthetic result is not observed SHALL receive at most one deduplicated fallback marker equivalent to the PTY fallback, with exact child/root correlation. Rechecks and fallback SHALL stop on disable, interrupt, revision, deletion, terminal failure, or configured limit.

#### Scenario: Background result notification is lost
- **WHEN** a correlated background child is terminal but no matching result marker reaches the unchanged root within the configured settle/recheck envelope
- **THEN** the guard injects at most one bounded synthetic fallback using recorded terminal facts
- **AND** arbitration waits until the fallback is consumed or terminally fails.

### Requirement: Retained audit child policy is enforced
The configured retained-audit policy SHALL be implemented. A finite policy SHALL rotate or delete guard-owned children only after they are terminal and no current epoch references them. `-1` MAY remain supported for explicit manual configuration but SHALL NOT be the unattended-capable default. Multiple matching children SHALL produce terminal ownership conflict unless one is deterministically current and every other child is proven terminal and quarantined.

#### Scenario: Child retention limit is reached
- **WHEN** a new audit epoch would exceed the finite retained-child limit
- **THEN** the guard removes or rotates only eligible guard-owned terminal children before creating the new child
- **AND** it preserves the current epoch and non-guard children.

### Requirement: Main permission normalization preserves specialist restrictions
When the enabled guard normalizes permissive main-session permissions, it SHALL NOT replace explicit per-agent permission maps for the hidden arbiter, reviewers, production workers, SDET, or other specialist roles. Runtime inspection SHALL prove their declared denied capabilities remain denied.

#### Scenario: Hidden arbiter is loaded under permissive main
- **WHEN** top-level main permissions resolve to allow
- **THEN** the hidden arbiter still has edit, bash, task, question, skill, and external capabilities denied according to its agent definition
- **AND** the guard supplies an all-false tool map for the arbiter prompt.

### Requirement: Long-running guard liveness is observable
Persisted status and bounded logs SHALL include privacy-safe audit start/end time, elapsed duration, retry class and attempt/limit, request byte count, wait reason enum and recheck count, restart recovery action, retained child count, and terminal error class. Repeated identical states SHALL remain deduplicated.

#### Scenario: Root exhausts transient retries
- **WHEN** the final configured retry attempt fails
- **THEN** metadata and one owning-boundary log identify the error class, attempts, elapsed time, and manual/resume condition
- **AND** no per-minute duplicate error loop continues.
