## MODIFIED Requirements

### Requirement: Guard restart reconciles enabled roots and async ownership
On startup the guard SHALL inspect persisted grind-enabled parentless roots in its configured directory, validate root/runtime identity, reconstruct bounded retry and question provenance, reconcile PTY and background-child liveness, and schedule one settle pass for safely recoverable idle roots. A guard-owned completion-audit child left `auditing` by an interrupted runtime SHALL become terminal `stale` only when it is not referenced by the current epoch, its root ownership remains exact after re-fetch, its last update is older than the configured arbiter prompt timeout plus settle grace, and it is canonically idle. Canonical idle SHALL mean an explicit `idle` status or absence from OpenCode's successfully read active-status map; an explicit `busy`/`retry` status or an unreadable status request SHALL remain unknown. Unknown writer, lease, child, or reply state SHALL remain fail-closed with actionable status. Startup SHALL NOT infer completion or resume a root from transcript prose.

#### Scenario: Runtime restarts during retry
- **WHEN** a grind-enabled root persisted a transient retry below its attempt limit and no revision or async ownership changed
- **THEN** startup schedules at most one remaining bounded retry or settle pass
- **AND** it does not reset the attempt counter or create another child.

#### Scenario: Runtime restarts with running unleased child
- **WHEN** a child remains running but no trustworthy reconstructed lease identifies its handoff state
- **THEN** the root remains Waiting/Error with unknown ownership
- **AND** completion arbitration does not start.

#### Scenario: Runtime restarts with an old idle interrupted audit
- **WHEN** a guard-owned child is still marked `auditing`, is older than prompt timeout plus settle grace, is not current, and is explicitly idle or absent from a successfully read active-status map
- **THEN** the guard records that child as terminal `stale` without inferring a verdict
- **AND** restart recovery may apply normal retained-child rotation.

#### Scenario: Interrupted audit liveness is not safely known
- **WHEN** an `auditing` child is explicitly busy/retrying, the status request fails, the child cannot be re-fetched, or it is too recent, current, or ownership-invalid
- **THEN** the guard leaves the child unchanged
- **AND** retention remains fail-closed if no independently eligible terminal child exists.

### Requirement: Retained audit child policy is enforced
The configured retained-audit policy SHALL be implemented. A finite policy SHALL rotate or delete guard-owned children only after they are terminal and no current epoch references them. Before reporting a full finite limit, the guard SHALL quarantine an old interrupted audit as terminal `stale` only after re-fetching and proving exact root ownership, non-current identity, `auditing` metadata, prompt-timeout-plus-settle age, and canonical idle runtime status from a successfully read active-status map. `-1` MAY remain supported for explicit manual configuration but SHALL NOT be the unattended-capable default. Multiple matching children SHALL produce terminal ownership conflict unless one is deterministically current and every other child is proven terminal and quarantined.

#### Scenario: Child retention limit is reached
- **WHEN** a new audit epoch would exceed the finite retained-child limit
- **THEN** the guard quarantines only eligible old idle interrupted audits and removes or rotates only eligible guard-owned terminal children before creating the new child
- **AND** it preserves the current epoch and non-guard children.

#### Scenario: Full retention contains active or unknown children
- **WHEN** the finite limit is full and every non-current child is explicitly active, status-unreadable, too recent, or otherwise ineligible
- **THEN** the guard preserves every child and returns the existing terminal retention conflict
- **AND** it does not create an additional arbiter child.
