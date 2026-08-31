## Context

See `proposal.md` for motivation and the change-level `KZN-001` claim. The repository already has four useful but separate pieces: `complain` writes compact Markdown feedback, project memory proves a bounded append-only OpenCode-data store and custom-tool composition, the compaction prompt emits evidence-backed session reflection, and the canonical archive skill wraps a deterministic helper. None owns end-to-end signal lifecycle or cross-project promotion.

Current evidence shows capture without projection is insufficient: the tracked feedback files contain stale `open` entries after corresponding instruction behavior changed. Git history also shows that a mandatory final retrospective and a later large continuous-learning design created too much completion ceremony and ownership coupling. The current increment therefore adds a signal transport and explicit curator boundary, not another permanent OpenSpec backlog or autonomous campaign.

The loaded surfaces are Material because they change compaction, feedback, archive handoff, installed profile inventory, and machine-local persisted behavior. Active changes already touch adjacent compaction, plugin, profile, and orchestration owners; implementation must recheck ownership and serialize writes before each overlapping slice.

## Goals / Non-Goals

**Goals:**

- Make explicit, compaction, and complete-archive signal capture converge on one bounded machine-local lifecycle.
- Preserve long-session observations at every actual compaction without another provider call or transcript store.
- Leave a repairable checkpoint when archive succeeds but its semantic harvest does not finish.
- Make stale fallback feedback visible to one explicit triage path without treating old status as current truth.
- Prove one installed path from a consumer-project signal to a bounded proposal created only from the configured kit owner root.

**Non-Goals:**

- A daemon, scheduler, campaign playbook, autonomous fixer, remote issue client, hosted service, semantic database, generic event framework, or multi-repository writer.
- Full-session transcript analysis or retention, arbitrary tool-output mining, project-memory mutation, or deterministic semantic scoring.
- Eventual resolution of every pending signal before the deferred curator/scheduler increment exists.

## Decisions

### 1. Extend the loaded composition owner with a cohesive module

`global/plugin/session-env.ts` remains the loaded composition entry point and imports one self-contained `global/plugin/kaizen/` public entry. The entry exposes feature/store functions and plugin hooks/tools; storage, records, capture correlation, and projection remain cohesive files beneath that directory. `session-env.ts` only composes hooks and merges tools, matching the existing project-memory pattern.

Alternatives rejected:

- A separate MCP server adds process, protocol, startup, and installation ownership without a remote boundary.
- Putting lifecycle logic directly in `session-env.ts` worsens its mixed composition responsibility.
- Extending project-memory records conflates advisory recall with improvement disposition and violates its explicit no-inference contract.

### 2. Use one distinct append-only event store

The store lives at `<opencode-data>/kaizen/v1/` and contains fixed-slot `signals/` and `events/` directories. Signal content and lifecycle events use strict versioned JSON with stable key order; each file is written once with exclusive creation. Lifecycle projection folds events by ref and never rewrites a record. Store resolution, canonical-root hashing, exclusive-slot behavior, and shared redaction reuse the verified project-memory/session-context implementation where ownership remains coherent; no generic storage abstraction is introduced solely to remove small duplication.

Signal source identities are derived from already-safe source facts: explicit idempotency key, compaction message/event identity, archive change plus checkpoint identity, or legacy `FB-*` id. The store persists project/session hashes but no reverse map to canonical roots.

Alternatives rejected:

- Git-tracked inbox files dirty every consumer project and create cross-project writer conflicts.
- Writing directly to the `opencode-kit` checkout from consumers violates worktree ownership and makes raw feedback a repository mutation.
- One mutable JSON/SQLite database needs locking, migrations, repair, and update-in-place semantics not required by the fixed current envelope.

### 3. Capture is default-on but payload-minimal

Installed core/all sessions enable the capability unless `OPENCODE_KAIZEN=0` is present at startup. This default is required for cross-project availability; the opt-out is effect-complete and restart-bound. Automatic lanes persist only closed-schema redacted signals or a privacy-safe gap event. They never persist a transcript, full compaction summary, tool output, or absolute target-root map.

Default-off was rejected because it recreates the discovery/activation failure the accepted outcome is intended to remove. Hidden remote publication or provider use is rejected; all state remains local.

### 4. Compaction is a first-class periodic harvest

The Kaizen plugin appends one mandatory output contract through `experimental.session.compacting.context` without assigning `output.prompt`. This preserves the managed goal, live-attempt, strategy, reflection, and next-action prompt while requiring one unfenced, versioned Kaizen JSON envelope after those fields. `signals: []` is the only valid no-finding representation. The envelope is capped at three entries and uses the signal schema subset.

`session-env` composes project-memory context first and the Kaizen output contract second on the same hook output. Each owner appends only its own bounded contribution; neither replaces the prompt or the other context. Shared managed-prompt wording remains outside this implementation slice.

The first implementation boundary is a disposable loaded-runtime spike that proves how the pinned OpenCode version identifies the generated compaction summary after `session.compacted`. The preferred path is root verification plus one bounded `client.session.messages` lookup and selection of the newest correlated synthetic compaction message. If the pinned API exposes a more direct typed post-completion hook, implementation may use it only after equivalent identity proof. Missing correlation blocks the compaction lane and dependent prompt mutation; it does not authorize transcript scanning, another provider call, or a prose parser fallback.

Once proven, the hook reads only the correlated summary, extracts exactly one tagged and unfenced envelope, discards all other text, validates/redacts, appends idempotently, and completes within a short local deadline. Invalid/missing output creates a bounded gap event and leaves compaction continuation unchanged.

### 5. Archive uses write-ahead lifecycle without becoming a gate

The canonical archive skill, not the deterministic archive helper, owns semantic harvest. Before helper invocation it attempts to append `harvest-pending` using change id and candidate identity. After helper output:

```text
archive failed                  -> close archive-failed when possible
archived + valid signals        -> append signals, close captured
archived + valid empty envelope -> close no-signal
archived + missing/invalid end  -> leave open; projection reports repair-gap
checkpoint unavailable          -> archive may continue; report unavailable
```

`repair-gap` is a derived projection only; no `repair-gap` event or closure exists. A later valid repair appends signals when present and closes the same open checkpoint as `captured` or `no-signal`. An opened checkpoint whose archive helper fails closes as `archive-failed`; helper failure without an opened checkpoint reports `unavailable` and persists no gap.

The helper remains unchanged unless implementation proves a narrow output field is required to correlate an already-created checkpoint. No post-archive failure may manufacture a non-archived state or repeat official movement. Repair triage may close only an existing checkpoint.

A mandatory Git-tracked `retro.md`, post-archive task, or reflection gate was rejected because it previously coupled optional learning to product completion.

### 6. Complain becomes a front end, Markdown becomes fallback

The `complain` skill calls the explicit Kaizen report tool when present. When absent or disabled, it retains the existing bounded Markdown append and reports fallback identity. Triage contains an idempotent importer for the exact maintained feedback format. Import copies the record as an immutable legacy signal and treats written `Status` as historical input, not current disposition.

The tracked Markdown files remain readable history and degraded-mode transport; they are no longer a second lifecycle authority once imported. Automatic rewriting of old statuses was rejected because current resolution cannot be inferred safely.

### 7. Triage is explicit and proposal promotion is target-root contained

Plugin code supplies deterministic list/status and append-decision operations only. A global `/kaizen-triage` command asks the active main agent to inspect at most 25 stable-ordered pending signals, gather current evidence, append one reasoned decision per processed ref, and stop at unknown ownership rather than score or generalize mechanically.

Proposal creation is allowed only when the current canonical root matches an explicitly configured machine-local proposal-owner root and the normal OpenSpec proposal workflow can run there. Outside that root, triage records `kit-candidate` or `needs-investigation` and performs no cross-repository mutation. The portable source names the owner role, not a maintainer path; the concrete root remains machine-local.

Direct cross-project writes, background session launch, remote issue creation, and automatic batching were rejected for the first increment. Signal count can bound or wake a later curator but cannot establish semantic cohesion.

### 8. Project memory remains an optional downstream action

A `local-memory` triage decision only recommends the existing explicit `project_memory_manage` action. Kaizen code never imports project-memory modules to write a card and never treats a decision as promotion evidence. This preserves project memory's opt-in, review, and staleness contract.

### 9. Failure ownership and diagnostics remain local

Explicit tools fail with the original schema/root/store cause and bounded safe context. Automatic compaction capture catches its own error, logs once per safe root/reason identity, and leaves unrelated hooks operational. Archive handoff reports archive and harvest dimensions separately. Status exposes counts, capacity, capture gaps, and repair refs without signal text by default.

The store uses fixed limits so disk-full, capacity, malformed-record, and concurrent-create behavior is observable. It supplies no destructive cleanup tool in this increment; opt-out makes records inert, and manual cleanup follows the same stop/review/exact-root discipline as project memory.

### 10. Proof advances from local store to installed behavior

Current rung before implementation is source-verified design with unproven post-compaction summary identity. The next real boundary is one effect-bounded loaded compaction in a disposable project and isolated data root. Implementation order is:

1. Prove current callback/message identity without product mutation.
2. Implement and run the provider-free store/tool/checkpoint happy path.
3. Load the copied plugin and prove explicit tools plus hook isolation.
4. Use a bounded synthetic configured-provider session to prove one long-session compaction envelope.
5. Exercise canonical complete archive in a disposable OpenSpec project and inspect archive plus harvest state.
6. Run kit-rooted triage against reviewed synthetic signals and create one disposable proposal, then remove only disposable evidence through the proof runner's owned cleanup.

Authorization is local-only with the repository's standing bounded synthetic model-call grant. Safeguards are isolated data/project roots, no remote or release operation, fixed provider-call count, privacy-safe fixtures, exclusive writes, and create-new evidence paths. Cleanup removes only disposable roots created by the runner; retained raw evidence stays under the declared change evidence directory. A failed live-dependent lane follows the repository live-attempt/replay gate before repetition.

## Risks / Trade-offs

- **[Post-compaction identity differs from documented SDK behavior]** -> Run the identity spike before prompt/store integration; block that lane rather than parse transcripts or add an extra summarization call.
- **[Default-on capture surprises an operator]** -> Persist only redacted closed-schema signals, expose activation/status, document `OPENCODE_KAIZEN=0`, and prove disabled mode has no writes.
- **[Model emits noisy or empty signals]** -> Treat capture as evidence, never authority; require current evidence during triage and make valid empty envelopes explicit.
- **[Archive succeeds while capture fails]** -> Preserve independent states and an append-only repair gap; never repeat archive to repair feedback.
- **[Legacy import duplicates or revives stale work]** -> Key by stable `FB-*` id and require current evidence for disposition.
- **[Concurrent active changes overlap loaded surfaces]** -> Recheck ownership immediately before each slice and serialize; planning does not reserve files.
- **[Pending queue does not drain automatically]** -> Report exact pending age/count without an eventual-resolution claim; scheduler/campaign remains a separate evidence-triggered increment.
- **[Unknown secrets evade redaction]** -> Reject raw transcripts/payloads, cap fields, reuse known redaction, document the claim ceiling, and keep all state local.

## Migration Plan

1. Add the self-contained module and focused provider-free tests while leaving current loaded prompt/skills unchanged.
2. Prove copied-plugin explicit tools and disabled behavior.
3. Prove post-compaction identity, then update managed prompt/template and activate the hook in one candidate.
4. Update `complain`, archive skill, commands, and core/all manifests after the store/tool boundary is working.
5. Import maintained Markdown feedback idempotently in an isolated store and triage current entries without rewriting source history.
6. Run the installed compaction/archive/proposal proof and applicable repository validation before handoff.

Rollback sets `OPENCODE_KAIZEN=0` and restarts OpenCode, restoring prior plugin/compaction/archive behavior while leaving inert machine-local records intact. Source rollback removes the new module, command/profile entries, and prompt/skill changes together; it does not delete local records automatically. Manual record cleanup is separately documented and never part of rollback automation.

## Open Questions

None. The exact supported post-compaction message identity is an implementation proof prerequisite with a fail-closed stop line, not a deferred product decision.
