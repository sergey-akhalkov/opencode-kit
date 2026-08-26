## ADDED Requirements

### Requirement: Status convergence is finite and observable
Guard status persistence SHALL stop after at most eight convergence passes or two seconds, whichever occurs first. Successful convergence SHALL preserve current behavior. Exhaustion SHALL persist or log one privacy-safe terminal convergence diagnostic with root/audit refs, observed passes, elapsed time, and last state digest, then release the caller without another automatic persistence loop.

#### Scenario: Status stabilizes normally
- **WHEN** the desired state stops changing within the configured envelope
- **THEN** persistence writes the converged state and returns
- **AND** performs no extra pass after readback matches

#### Scenario: Status changes continuously
- **WHEN** concurrent updates prevent convergence through eight passes or two seconds
- **THEN** persistence terminates with one bounded diagnostic
- **AND** does not spin, retry indefinitely, or block unrelated roots

### Requirement: Arbiter prompts use one process-wide bounded scheduler
All completion-guard instances in one OpenCode process SHALL share a FIFO scheduler with configurable finite active and queued limits. Defaults SHALL permit at most two active arbiter prompts and 32 queued roots. A root SHALL have at most one active or queued audit epoch; cancellation, revision, disable, deletion, timeout, or terminal failure SHALL remove its queued work and release capacity.

#### Scenario: Two prompts are active
- **WHEN** a third eligible root requests arbitration under default limits
- **THEN** it waits in FIFO order without starting a provider request
- **AND** active prompt count remains two

#### Scenario: Queue capacity is exhausted
- **WHEN** another root would exceed 32 queued roots
- **THEN** it receives a bounded overload state with retry/unblock evidence
- **AND** no existing queued root is evicted or duplicated

#### Scenario: Queued root is revised
- **WHEN** a human revision invalidates a queued audit before capacity is available
- **THEN** the queued entry is removed
- **AND** no provider request starts for the stale epoch
