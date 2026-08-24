## ADDED Requirements

### Requirement: Session evidence acquisition is root-correlated before projection
Session-delivery evidence SHALL obtain a root and its reachable descendants through indexed, parameterized, bounded queries before message/event projection. It SHALL NOT materialize every session in the database for one root audit. The current defaults SHALL retain at most 512 session rows and 16 descendant levels for one root graph. Query results SHALL report omitted counts or unknown state without silently claiming completeness.

#### Scenario: Database contains unrelated sessions
- **WHEN** a database contains 100,000 unrelated sessions and one bounded root tree
- **THEN** evidence queries read only rows needed to resolve that root tree plus explicit bounded metadata
- **AND** query-plan evidence contains no full session-table scan

#### Scenario: Descendant bound is exceeded
- **WHEN** a root has more descendants than the configured bound
- **THEN** projection records the retained rows and omitted count
- **AND** completion arbitration fails closed when omitted descendants can affect liveness or completion

### Requirement: Query performance evidence is maintained
The repository SHALL retain provider-free fixtures and query-plan/latency/resource observations for small, large-unrelated, deep, wide, missing, and malformed session graphs. Acceptance SHALL require bounded work growth with the selected root graph rather than total database size; timing SHALL be reported with environment identity and SHALL NOT be the sole correctness oracle.

#### Scenario: Unrelated database size grows
- **WHEN** unrelated session count increases while the selected root graph is unchanged
- **THEN** selected-row count and projection output remain unchanged
- **AND** latency and memory remain environment-attributed diagnostics while row count, query plan, bounds, and output identity determine correctness in this increment
