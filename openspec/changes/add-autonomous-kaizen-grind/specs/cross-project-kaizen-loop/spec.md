## MODIFIED Requirements

### Requirement: Signals use a closed redacted schema
Every accepted signal SHALL contain a schema version, source kind, concise summary, observed evidence, impact statement, likely cause or explicit `unknown`, do-not-repeat guidance, scope hint from `current-project | opencode-kit | external | unknown`, repository-relative evidence refs, and privacy-safe project/session refs. Source kind SHALL be one of `explicit`, `compaction`, `archive`, or `legacy-feedback`. Unknown fields, absolute paths, parent traversal, raw transcript content, provider credentials, secret-bearing payloads, and over-limit fields SHALL be rejected or redacted before persistence.

The capability SHALL persist at most three signals from one compaction or archive harvest and at most 16 KiB per signal record. The transactional v2 store SHALL not impose the legacy 2,000-record cardinality ceiling; storage exhaustion or a configured operational size guard SHALL fail visibly without dropping or acknowledging an uncommitted record. It SHALL assign each accepted source emission a stable idempotency identity so replaying one explicit call, compaction message, archive checkpoint, or legacy feedback id cannot create a duplicate signal.

#### Scenario: Explicit structured signal is accepted
- **WHEN** a root session submits a valid in-budget signal with repository-relative evidence refs
- **THEN** one redacted immutable signal is created
- **AND** output returns only bounded refs, source kind, lifecycle state, and diagnostics.

#### Scenario: Unsafe signal is rejected
- **WHEN** a signal contains an absolute evidence path, parent traversal, an unsupported field, or content that remains over limit after redaction
- **THEN** persistence fails with a cause-preserving bounded error
- **AND** no partial or replacement signal is written.

#### Scenario: Source emission is replayed
- **WHEN** the same source identity is submitted more than once
- **THEN** the first signal remains authoritative
- **AND** later submissions return its existing privacy-safe ref without adding another record.

### Requirement: The inbox is append-only, bounded, and cross-project
The capability SHALL use one transactional versioned machine-local store at the dedicated Kaizen root `D:\OpenCode\data\kaizen`. Signals and lifecycle events SHALL remain immutable logical records; lifecycle changes SHALL append events and update only a reproducible current projection in the same transaction. Concurrent local OpenCode processes SHALL retain complete writes, stable source idempotency, and visible original failures without a fixed 2,000-signal or 8,000-event slot ceiling. Filesystem exhaustion, database corruption, unsupported schema, migration mismatch, lock timeout, or failed transaction SHALL fail visibly without acknowledging a partial signal or lifecycle transition.

The shared inbox SHALL distinguish canonical worktrees through privacy-safe project refs and SHALL NOT retain an absolute-root reverse map. A separately protected execution registry MAY map enabled refs to canonical roots for Kaizen Grind, but shared status, signal payloads, and ordinary project sessions SHALL not expose another project's absolute root or unredacted payload.

#### Scenario: Two projects append concurrently
- **WHEN** two OpenCode processes rooted in distinct disposable Git worktrees submit valid signals against one data root
- **THEN** transactions retain both complete records with distinct project refs and stable source identities
- **AND** neither worktree receives a Kaizen file or the other's canonical path.

#### Scenario: Store cannot commit a record
- **WHEN** the database is full, locked beyond its bounded timeout, corrupt, unsupported, or loses storage during a transaction
- **THEN** the write fails visibly with the original safe cause and no success ref
- **AND** previously committed records and projection integrity remain readable or explicitly unknown.

#### Scenario: Store reaches capacity
- **WHEN** the underlying D: storage cannot durably commit another signal or lifecycle transaction
- **THEN** the write fails visibly with a capacity diagnostic and no success ref
- **AND** existing committed records remain readable and unchanged or their integrity is reported unknown.

### Requirement: Status and triage are bounded and non-authoritative
The status surface SHALL return stable cursor-bounded pages and exact aggregate counts for signals, repair gaps, decisions, execution records, cycles, gates, capacity/storage, migration, capture, controller, task, runtime, session, writer, and cleanup diagnostics without exposing transcripts, credentials, absolute roots, or unrelated project payloads. One semantic triage batch SHALL select at most 25 signals in stable age/ref order and SHALL never use deterministic semantic scoring, severity inference, or fuzzy grouping.

The agent-driven triage workflow SHALL append a reasoned decision of `duplicate`, `local-memory`, `project-change`, `kit-candidate`, `external-owner`, `needs-investigation`, `no-action`, `owner-blocked`, or `resolved` for each processed signal. A decision SHALL name current evidence, owner class, and next boundary or terminal reason. It MAY propose a correlated Kaizen Grind execution-record seed only through the controller's separate registry, authority, optional portfolio-owner, and writer admission checks; triage itself SHALL not persist portfolio status, dependencies, priority, assignment, duplicate relations, or terminal authority and SHALL not authorize project-memory promotion, protected action, remote submission, source mutation, or lifecycle completion.

When Grind is enabled, one controller-created visible read-only triage root session on the managed server SHALL own semantic decisions for its cycle and use only the exact transactionally claimed member refs. Manual triage SHALL reject a claimed ref and MAY process only unclaimed refs. The cycle eligibility population SHALL include pending signals and previously triaged or promoted actionable signals that have no correlated terminal execution handoff and whose first automatic admission or recorded retry condition is eligible; resolved, duplicate, no-action, and otherwise terminal signals SHALL not re-enter.

#### Scenario: Bounded status is requested
- **WHEN** the inbox contains more records than one status response permits
- **THEN** the response returns stable ordered refs, an explicit continuation cursor, exact total counts, and truncation
- **AND** neither the page nor one semantic batch is represented as the whole population.

#### Scenario: Cause or owner is unknown
- **WHEN** a signal lacks current evidence sufficient to distinguish project, kit, or external ownership
- **THEN** triage records `needs-investigation` with the missing evidence and retry condition
- **AND** creates no project execution record, cross-project generalization, proposal, or writer.

#### Scenario: Manual triage reaches a claimed signal
- **WHEN** a manual triage invocation selects a ref transactionally claimed by an active Grind cycle
- **THEN** it reports the cycle/member claim and appends no competing decision or execution record
- **AND** may continue only with unclaimed selected refs.

#### Scenario: Existing actionable decision lacks implementation
- **WHEN** a migrated `project-change` or `kit-candidate` decision has no correlated terminal execution handoff and its admission is first-run eligible
- **THEN** the next cycle includes it exactly once even though its signal is no longer pending
- **AND** resolved or already completed work remains excluded.

## REMOVED Requirements

### Requirement: Kit proposal promotion is explicit and root-contained
**Reason**: Manual promotion only from one configured kit owner is replaced by registered owner-project routing that can create and implement a contained OpenSpec change in the actual project or kit owner.

**Migration**: Existing `kit-candidate` and `project-change` decisions remain valid evidence. Kaizen Grind re-evaluates them against the protected project registry and creates no writer until current ownership, authority, cleanliness, adapters, and proof boundaries pass.

## ADDED Requirements

### Requirement: Proposal promotion is owner-project contained
Kaizen Grind MAY route one or more cohesively admitted signals into a non-portfolio project execution record only when current evidence establishes one registered owner, accepted outcome, operating envelope, non-goals, non-deferrable invariants, observable proof, affected paths, and allowed effects. The Kaizen decision remains admission evidence. When the separately enabled Beads bridge owns the selected project's portfolio, the execution record SHALL reference its canonical Beads ID and SHALL not copy Beads-owned status, dependencies, priority, assignment, duplicate relations, or terminal authority. No Beads identity or ownership SHALL be inferred for another registration. Project-owned work SHALL create and implement its OpenSpec change from that project's registered canonical root; kit-owned work SHALL use the registered `opencode-kit` root. Signal refs SHALL remain evidence and SHALL not become implementation authority.

A source-project session SHALL NOT directly edit another repository. Cross-owner outcomes SHALL split into separately correlated owner execution records and serialized writers; exact execution-prerequisite refs MAY order those current results but SHALL NOT create or copy a portfolio dependency graph. Raw count, recurrence, an old decision, or model prose SHALL NOT combine unrelated signals or select a root.

#### Scenario: Consumer project owns the change
- **WHEN** current evidence and protected registration identify the consumer project as the single owner
- **THEN** promotion creates a contained execution record for a visible development session rooted in that project
- **AND** no file in `opencode-kit` or another consumer project is changed by that writer.

#### Scenario: Kit owns reusable behavior
- **WHEN** current evidence identifies the registered kit as owner of a reusable global behavior
- **THEN** promotion creates a contained kit execution record linked by privacy-safe signal refs
- **AND** the consumer project remains source evidence rather than a cross-repository writer.
