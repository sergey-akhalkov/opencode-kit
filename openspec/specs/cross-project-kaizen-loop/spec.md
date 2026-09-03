# cross-project-kaizen-loop Specification

## Purpose
Provides one bounded cross-project feedback loop that preserves explicit, compaction, and archive-harvest signals without storing transcripts, then supports visible lifecycle decisions and controlled promotion into ordinary project work.

## Requirements

### Requirement: Kaizen capture is available and independently disableable
The installed core and all runtime surfaces SHALL load one Kaizen capability through the existing global plugin composition. Capture SHALL be enabled by default and SHALL become fully inert when startup environment sets `OPENCODE_KAIZEN=0`; changing the value after plugin startup SHALL require an OpenCode restart. Disabled capture SHALL register no Kaizen tools or hooks, write no Kaizen state, and leave unrelated plugin, compaction, archive, feedback, and project-memory behavior unchanged.

#### Scenario: Installed project uses default capture
- **WHEN** OpenCode starts from a maintained core or all installation without `OPENCODE_KAIZEN=0`
- **THEN** the bounded Kaizen report and status surface is available
- **AND** the runtime identifies capture as enabled without exposing a project path or signal payload.

#### Scenario: Operator disables capture
- **WHEN** OpenCode starts with `OPENCODE_KAIZEN=0`
- **THEN** no Kaizen tool or automatic capture hook is registered
- **AND** no Kaizen store path or event is created.

### Requirement: Signals use a closed redacted schema
Every accepted signal SHALL contain a schema version, source kind, concise summary, observed evidence, impact statement, likely cause or explicit `unknown`, do-not-repeat guidance, scope hint from `current-project | opencode-kit | external | unknown`, repository-relative evidence refs, and privacy-safe project/session refs. Source kind SHALL be one of `explicit`, `compaction`, `archive`, or `legacy-feedback`. Unknown fields, absolute paths, parent traversal, raw transcript content, provider credentials, secret-bearing payloads, and over-limit fields SHALL be rejected or redacted before persistence.

The capability SHALL persist at most three signals from one compaction or archive harvest, at most 16 KiB per signal record, and no more than 2,000 signal records in one store. It SHALL assign each accepted source emission a stable idempotency identity so replaying one explicit call, compaction message, archive checkpoint, or legacy feedback id cannot create a duplicate signal.

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
The capability SHALL use one versioned machine-local store beneath the platform OpenCode data root. The data-root precedence SHALL match the maintained OpenCode local-data convention. Signals, decisions, and archive checkpoints SHALL be immutable create-new records; lifecycle changes SHALL append events rather than overwrite or delete prior records. Writes SHALL use exclusive creation safe for concurrent local OpenCode processes and SHALL fail visibly when the fixed envelope of 2,000 signals or 8,000 total decision/checkpoint events is exhausted.

The store SHALL distinguish canonical worktrees through privacy-safe project refs and SHALL NOT retain an absolute-root reverse map. Separate projects using one data root SHALL share the inbox without receiving another project's unredacted payload or worktree identity.

#### Scenario: Two projects append concurrently
- **WHEN** two OpenCode processes rooted in distinct disposable Git worktrees submit valid signals against one data root
- **THEN** exclusive creation retains both complete records with distinct project refs
- **AND** neither worktree receives a Kaizen file or the other's canonical path.

#### Scenario: Store reaches capacity
- **WHEN** a new event would exceed the fixed signal or lifecycle envelope
- **THEN** the write fails visibly with a capacity diagnostic
- **AND** existing records remain readable and unchanged.

### Requirement: Compaction emits and persists a mandatory signal envelope
Every primary-root compaction summary SHALL contain exactly one schema-valid Kaizen envelope with zero to three structured signals. An empty signal array SHALL mean that the reflection found no evidence-backed Kaizen signal; absence, malformed content, duplicate envelopes, wrong root/session correlation, or an unreadable newest compaction summary SHALL be a visible capture gap rather than an inferred empty result.

After `session.compacted`, the capability SHALL resolve the verified primary root and newest correlated compaction summary through the supported OpenCode client surface, parse only the Kaizen envelope, redact and validate it, and append accepted signals idempotently. It SHALL NOT retain the remaining summary, query raw session messages beyond the minimum correlated summary lookup, call a provider, trigger another compaction, delay unrelated session continuation beyond a bounded local deadline, or create improvement tasks.

#### Scenario: Long session compacts with one signal
- **WHEN** a verified primary root produces a compaction summary containing one valid Kaizen signal
- **THEN** the capability persists exactly that redacted signal
- **AND** normal compaction continuation retains its existing goal, live-attempt, strategy, and next-session behavior.

#### Scenario: Compaction has no finding
- **WHEN** the newest correlated compaction summary contains one valid envelope with an empty signal array
- **THEN** no signal record is created
- **AND** capture status records a successful `no-signal` observation for that compaction identity.

#### Scenario: Compaction output cannot be trusted
- **WHEN** the envelope is missing, malformed, duplicated, over limit, or cannot be correlated to the verified root and compaction event
- **THEN** no signal content is persisted
- **AND** one bounded privacy-safe capture-gap event identifies the failed correlation or validation class.

### Requirement: Complete archive uses a non-blocking harvest checkpoint
The canonical agent-driven complete-archive path SHALL attempt one idempotent `harvest-pending` checkpoint for the change before invoking official archive movement. After the deterministic archive helper returns `status: archived`, the same root workflow SHALL submit zero to three archive-reflection signals and append a checkpoint closure of `captured` for valid non-empty signals or `no-signal` for a valid empty envelope. Missing, invalid, or interrupted post-archive harvest SHALL leave the checkpoint open; lifecycle projection SHALL report that open successful-archive checkpoint as `repair-gap` and SHALL NOT write a `repair-gap` event or closure.

If the deterministic archive helper fails after `harvest-pending` was written, the workflow SHALL append `archive-failed` to that checkpoint when the lifecycle store remains available. Helper failure without an opened checkpoint SHALL report harvest `unavailable` and SHALL persist no repair gap. A later repair SHALL close only an open successful-archive checkpoint as `captured` or `no-signal`; it SHALL NOT repair or relabel an `archive-failed` checkpoint.

Archive status and harvest status SHALL remain separate. Missing tools, checkpoint write failure, interrupted post-archive reflection, invalid signal output, or lifecycle-store failure SHALL NOT relabel, roll back, repeat, or conceal a completed archive. The handoff SHALL report the archived change/path and the exact harvest status; an opened checkpoint without a valid closure SHALL remain a visible repair gap that a later explicit triage can close without repeating archive.

#### Scenario: Archive completes with findings
- **WHEN** the canonical archive path opens a checkpoint, archives successfully, and emits valid archive-reflection signals
- **THEN** those signals are persisted and the checkpoint closes as `captured`
- **AND** archive output remains independently `archived`.

#### Scenario: Archive completes without findings
- **WHEN** archive succeeds and the valid archive reflection emits an empty signal array
- **THEN** the checkpoint closes as `no-signal`
- **AND** no process-improvement task or retrospective artifact is required.

#### Scenario: Session stops after archive
- **WHEN** archive succeeds after `harvest-pending` but the root ends before valid closure
- **THEN** archive remains complete
- **AND** status derives a repair gap from the unclosed checkpoint without writing a repair-gap closure and allows later idempotent `captured` or `no-signal` closure.

#### Scenario: Archive helper fails after checkpoint opens
- **WHEN** `harvest-pending` exists and the deterministic archive helper exits without `status: archived`
- **THEN** the workflow closes that checkpoint as `archive-failed` when the lifecycle store remains available
- **AND** status does not project the checkpoint as a repair gap or claim that archive completed.

#### Scenario: Checkpoint cannot be opened
- **WHEN** the Kaizen tool or store is unavailable before archive
- **THEN** complete archive remains governed only by its existing deterministic completion gates
- **AND** the archive handoff reports harvest `unavailable` without claiming a durable repair gap exists.

### Requirement: Complain and legacy feedback have one lifecycle owner
The canonical `complain` workflow SHALL submit to the Kaizen inbox when the capability is available. When it is disabled or unavailable, `complain` MAY append its existing compact Markdown record and SHALL identify that record as fallback feedback rather than a second authoritative lifecycle.

Explicit triage SHALL import fallback Markdown entries through their stable `FB-*` ids, preserve their original evidence and current written status, and mark each imported id so repeated triage cannot create another signal. Import SHALL NOT infer that an old open entry remains unresolved merely because its Markdown status was not updated.

#### Scenario: Complain uses the available inbox
- **WHEN** a session invokes `complain` while Kaizen capture is available
- **THEN** one explicit Kaizen signal is created
- **AND** no new Markdown feedback entry is required.

#### Scenario: Legacy open status is stale
- **WHEN** triage imports an `open` Markdown entry whose described behavior may already have changed
- **THEN** the signal is admitted with legacy status as evidence only
- **AND** triage requires current evidence before assigning `resolved`, `project-change`, or `kit-candidate`.

### Requirement: Status and triage are bounded and non-authoritative
The status surface SHALL return a stable bounded projection of pending signals, archive repair gaps, decisions, capacity, truncation, and capture diagnostics without exposing transcripts, absolute roots, credentials, or unrelated project payloads. One explicit triage invocation SHALL select at most 25 pending signals using stable age/ref order and SHALL never use deterministic semantic scoring, severity inference, or fuzzy grouping.

The agent-driven triage workflow SHALL append a reasoned decision of `duplicate`, `local-memory`, `project-change`, `kit-candidate`, `external-owner`, `needs-investigation`, `no-action`, `owner-blocked`, or `resolved` for each processed signal. A decision SHALL name current evidence, owner class, and next boundary or terminal reason. It SHALL not itself authorize project-memory promotion, protected action, remote submission, or source-project mutation.

#### Scenario: Bounded status is requested
- **WHEN** the inbox contains more records than one status response permits
- **THEN** the response returns stable ordered refs, exact total counts, and explicit truncation
- **AND** does not silently represent the returned page as the whole population.

#### Scenario: Cause or owner is unknown
- **WHEN** a signal lacks current evidence sufficient to distinguish project, kit, or external ownership
- **THEN** triage records `needs-investigation` with the missing evidence
- **AND** does not invent a cross-project generalization or proposal.

### Requirement: Kit proposal promotion is explicit and root-contained
An explicit triage workflow MAY promote signals to one ordinary OpenSpec change only while the active root is the configured `opencode-kit` proposal owner and current evidence establishes one cohesive outcome, owner, operating envelope, proof boundary, and non-goals. One invocation SHALL create at most one change and SHALL preserve source signal refs in its proposal evidence without absolute consumer-project paths.

Triage outside the configured proposal-owner root SHALL return a `kit-candidate` decision or proposal seed only. It SHALL NOT edit, launch a writer in, or otherwise mutate the `opencode-kit` checkout from another project. Raw count or recurrence alone SHALL NOT authorize a proposal or combine unrelated owners.

#### Scenario: Kit-rooted candidate is ready
- **WHEN** explicit triage runs from the configured proposal-owner root and current evidence bounds one cross-project improvement outcome and proof
- **THEN** it may create one normal OpenSpec change through the canonical proposal workflow
- **AND** the linked signals remain evidence rather than implementation authority.

#### Scenario: Consumer project reports reusable friction
- **WHEN** triage runs outside the configured proposal-owner root or lacks a bounded owner/proof contract
- **THEN** it records `kit-candidate` or `needs-investigation`
- **AND** changes no file in the configured proposal-owner repository.

### Requirement: Failures are visible without breaking unrelated work
The owning tool boundary SHALL preserve the original local storage, schema, root-correlation, or archive-checkpoint cause with bounded safe context. Automatic hook failures SHALL log at most once per privacy-safe root/reason identity and SHALL not throw into unrelated compaction or session continuation. The feature SHALL expose opt-out, current activation, store capacity, and repair-gap diagnostics without printing signal text by default.

#### Scenario: Automatic capture store is unreadable
- **WHEN** compaction capture cannot read or write the Kaizen store
- **THEN** one bounded owning-boundary diagnostic preserves the failure class and safe cause
- **AND** the root continues without a stored signal or duplicate log storm.

#### Scenario: Explicit report store is unreadable
- **WHEN** an explicit report cannot persist its signal
- **THEN** the tool call fails visibly with the original cause chain
- **AND** does not return a success ref or write fallback content implicitly.

### Requirement: Optional portfolio projection preserves Kaizen evidence authority
When the separately installed and explicitly enabled Beads portfolio bridge is current for the signal's registered project, explicit triage MAY project one evidence-confirmed `project-change` or `kit-candidate` decision to one correlated Beads feature. A `project-change` SHALL match the enabled registration's derived project ref against the signal's recorded project refs; a `kit-candidate` SHALL match an enabled `opencode-kit` semantic owner registration and SHALL not require the consumer or triage-session project ref to equal the kit ref. Kaizen SHALL remain the sole owner of raw signal payload, occurrence identity/count, privacy filtering, decision evidence, archive checkpoints, and signal lifecycle. The projection SHALL store only privacy-safe refs and bounded reviewed feature context in Beads and SHALL not migrate or duplicate the Kaizen signal store.

When the bridge is absent, disabled, unsupported, unregistered, busy, or inconsistent, current Kaizen capture, status, triage, decision, and direct kit-rooted proposal behavior SHALL remain available under their existing contracts. No Kaizen controller SHALL persist a second admitted portfolio identity, status graph, dependency graph, priority, assignment, or terminal authority while Beads is selected as that project's portfolio owner. For that one explicitly enabled project, a Grind-local execution/routing record SHALL reference the canonical Beads ID and MAY retain only its execution ref, run/cycle and source-decision refs, project/registration/candidate digests, exact execution-prerequisite refs, route, gate/retry, Campaign/Mission/session refs, and resulting execution handoff. It SHALL not become another portfolio item, copy Beads-owned state, or independently assert terminal closure. No Beads identity or ownership SHALL be inferred for another Grind registration.

#### Scenario: Eligible decision uses the enabled portfolio bridge
- **WHEN** explicit triage establishes one eligible known owner and the matching project registration selects a current Beads bridge
- **THEN** one privacy-safe correlation may be created to the canonical Beads feature
- **AND** Kaizen retains its original signal, occurrences, decision, and lifecycle events as evidence.

#### Scenario: Portfolio bridge is unavailable
- **WHEN** capture or triage runs while the Beads bridge is absent, disabled, unsupported, or gated
- **THEN** Kaizen records and reports its current evidence and exact bridge gate without data loss
- **AND** it neither acknowledges a Beads feature nor disables ordinary Kaizen behavior.

#### Scenario: Repeated signals look like votes
- **WHEN** one signal accumulates repeated occurrences or multiple agent/session refs
- **THEN** status may present those current counts and refs as bounded evidence
- **AND** neither Kaizen nor Beads automatically changes admission, priority, readiness, assignment, or implementation authority.

#### Scenario: Another queue claims admitted work ownership
- **WHEN** current planning or runtime state would persist the same admitted improvement as both a Beads feature and a separate Kaizen portfolio identity/status graph
- **THEN** promotion fails before creating either competing identity
- **AND** requires one explicit current admitted-work owner while preserving the raw Kaizen signal and decision.

#### Scenario: Grind dispatches an admitted Beads feature
- **WHEN** a Grind cycle routes one canonical Beads feature into Campaign/Mission execution
- **THEN** its execution record references the Beads ID and retains only controller-owned execution identity, routing, gate, retry, campaign, mission, session, prerequisite, and execution-handoff facts
- **AND** reads portfolio status/dependencies/priority/assignment/duplicates/terminal result from Beads and the Kaizen bridge rather than persisting competing copies or closure authority.
