## MODIFIED Requirements

### Requirement: Memory context is injected only into verified primary root sessions

For each human message in an enabled primary root session, the capability SHALL use the message text ephemerally to select current memory, then append one advisory system capsule containing a bounded project core and eligible recalled results. It SHALL not persist the raw prompt, normalized query, or query-derived tokens. If session parentage cannot be verified, the capability SHALL inject nothing.

Before system transformation or compaction uses a cached selection, the capability SHALL re-read lifecycle state and revalidate freshness, evidence fingerprints, and current curated files for only the selected refs. It SHALL remove any newly invalidated, stale, mismatched, missing, or unsafe item and re-render within the total capsule budget. Newly added cards SHALL wait until the next human message selection.

The root lookup SHALL use one local OpenCode `session.get` request with a one-second deadline and no retry. Missing session id, timeout, lookup failure, or hook-order state without a preceding selection SHALL produce one privacy-safe owning-boundary warning and no memory injection. The project-memory compaction hook SHALL append only its revalidated bounded capsule, privacy-safe card refs, and explicit truncation or warning state. Other loaded plugins MAY append disjoint bounded context through normal hook composition. Project memory SHALL not create memory records, read raw session transcripts, replace the default compaction prompt, or schedule improvement work.

#### Scenario: Primary root receives relevant memory

- **WHEN** an enabled primary root receives a human prompt that matches current active memory
- **THEN** the system context SHALL receive one advisory capsule within the configured bounds
- **AND** the capsule SHALL state that current instructions, source, specs, and runtime evidence take precedence.

#### Scenario: Subagent receives the same prompt

- **WHEN** a child or subagent session receives text that would match the same cards
- **THEN** automatic project-memory context SHALL not be injected.

#### Scenario: Root lookup fails

- **WHEN** the runtime cannot establish whether a session has a parent
- **THEN** automatic recall SHALL fail closed with no injection
- **AND** unrelated OpenCode plugin behavior SHALL remain available.

#### Scenario: Session compacts after recall

- **WHEN** compaction starts after a bounded capsule was selected
- **THEN** the project-memory contribution to compaction context SHALL contain only that bounded advisory capsule and privacy-safe state
- **AND** another plugin MAY append disjoint bounded context without changing the capsule or replacing the compaction prompt.

#### Scenario: Another process invalidates a selected card

- **WHEN** a second process appends a valid invalidation after selection but before system transformation or compaction
- **THEN** revalidation SHALL remove that card from the cached capsule
- **AND** no stale cached content for that card SHALL be injected.

#### Scenario: Root lookup does not terminate promptly

- **WHEN** the local session lookup exceeds one second or the system transform has no matching prior root selection
- **THEN** automatic recall SHALL emit one privacy-safe warning and inject nothing
- **AND** it SHALL not retry or delay unrelated plugin behavior further.
