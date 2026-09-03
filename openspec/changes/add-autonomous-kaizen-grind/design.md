## Context

See `proposal.md` for motivation and the change-level `KZG-001` claim. The current Kaizen owner captures bounded immutable JSON records under the shared OpenCode data-root convention, exposes at most 25 pending signals to one manual triage invocation, and explicitly forbids scheduling or autonomous source mutation. Direct inspection on 2026-09-01 found 257 signal records folding to 243 signals, including 218 pending, plus 109 lifecycle events beneath the Windows system-drive default. `D:\OpenCode\data` already exists for local OpenCode data, but no Kaizen directory was present.

The repository already contains the required downstream ownership chain: Work Campaign owns durable semantic campaign orchestration and host resume; Roadmap Mission owns one serialized project OpenSpec/source writer and local checkpoint commit; the Windows workstation owns protected Scheduled Task installation; and the managed OpenCode server exposes ordinary root sessions by project directory. The new responsibility is the missing signal-to-project control plane and scalable lifecycle store, not another source writer. The current ownership manifest keeps this change mutation-disabled behind `make-team-advice-evidence-triggered -> add-prospective-consequence-rehearsal -> deliver-continuous-reusable-value`, so its project lifecycle consumes the resulting Team Advice, `opsx-propose`, loaded instruction, and validation contracts rather than proving a stale composition.

This change is Material because it migrates persisted state, coordinates multiple local processes and writers, installs recurring host automation, changes loaded commands/plugins/configuration, invokes configured providers, and permits autonomous project mutation/local commits. The current worktree contains unrelated active changes; planning reserves no implementation path, and apply must recheck exact ownership before each slice.

## Goals / Non-Goals

**Goals:**

- Establish one recoverable D:-root lifecycle with transactional claims, cursorable snapshots, exact migration, and no fixed-slot queue ceiling.
- Make enable/disable/status sufficient operator controls for an unattended finite scheduler.
- Route evidence-confirmed work to the registered semantic owner and carry it through the existing campaign/mission/OpenSpec lifecycle.
- Keep development sessions visible in the user's normal project session list and make takeover ownership-safe.
- Preserve cause, state, authority, rollback, and cleanup evidence across migration, crash, restart, stop, budget pause, and project blockers.

**Non-Goals:**

- A permanent Windows service, arbitrary repository discovery, remote integration, shared multi-repository writers, or automatic protected decisions.
- Replacing Work Campaign, Roadmap Mission, OpenSpec, the managed workstation runtime, or project validation with Kaizen-specific equivalents.
- Perfect semantic classification, guaranteed progress through a permanently dirty project, or an infinite-capacity/history claim.
- Generalizing SQLite, scheduler, task installer, or session takeover into a repository-wide framework before a third stable owner appears.

## Decisions

### 1. Add one finite Grind controller instead of extending triage or running a daemon

The new `kaizen-grind` controller owns only cycle snapshots, transactional member claims, one visible read-only triage-session dispatch, execution-record routing, downstream correlation, retry eligibility, and aggregate status. The triage session runs on the managed server under the kit owner, receives exact claimed refs through bounded Kaizen tools, and may write only decisions/execution-record seeds to the lifecycle store. It has no project source, OpenSpec, commit, or protected-host mutation authority. The controller is invoked by one repeating daily Scheduled Task, exits at a durable boundary, and persists `nextEligibleAt` when a high-water population remains. The existing `/kaizen-triage` remains a manual diagnostic/decision surface, rejects active cycle claims, and is no longer the population-drain owner.

```text
capture -> v2 lifecycle -> cycle watermark -> triage batches
                                      |
                                      +-> terminal decision/gate
                                      +-> owner-project execution record
                                                |
                                                v
                                      Work Campaign observer
                                                |
                                                v
                                      Roadmap Mission writer
```

A permanent watcher was rejected because a once-daily requirement does not justify an always-live process, another service account, shutdown protocol, or extra writer-liveness owner. Repeatedly invoking the current triage command was rejected because it has no durable population cursor, transactional claim, scheduler, project registry, downstream writer correlation, or crash recovery. An unnamed in-process classifier was rejected because it hides cost/session ownership; the visible effect-bounded triage session is the semantic classifier port. Letting capture launch work directly was rejected because a raw signal is evidence, not authority.

### 2. Use a dedicated transactional SQLite v2 store

The Kaizen capture/lifecycle owner, not the Grind controller, uses `D:\OpenCode\data\kaizen\kaizen.db` with the existing runtime-compatible Node/Bun SQLite loading pattern. Capture remains able to append while Grind is disabled; Grind is a store client with cycle/claim leases. The store does not reuse `opencode.db`. WAL mode, foreign-key enforcement, a 5,000 ms busy timeout, explicit transactions, schema migration versioning, integrity checks, and atomic backup are required.

The logical model keeps immutable evidence separate from mutable projections:

```text
signals          immutable normalized signal identity and payload
occurrences      immutable source emissions and dedup correlation
events           immutable signal/checkpoint/decision lifecycle
cycles           immutable cycle identity and frozen high-water facts
cycle_members    frozen signal population at one watermark
execution_records immutable controller execution identity/correlation with optional canonical Beads ID
transitions      immutable Grind controller state chain
leases           current controller/migration ownership with heartbeat
projections      transactionally replaceable, replay-verified current views
schema_history   applied migration ids and digests
```

Cursor, execution phase, and retry state live only in projections rebuilt from transitions; identity tables never carry a competing mutable current view. An execution record contains only its ref, run/cycle and source-decision refs, owner project ref, registration/candidate digests, optional canonical Beads ID, exact execution-prerequisite refs, route, gate/retry, Campaign/Mission/session refs, and resulting execution handoff. It contains no portfolio status, dependency graph, priority, assignment, duplicate relation, or independent terminal authority. The store holds privacy-safe project/session refs only. A separate protected Grind project registry remains the owner of absolute canonical roots; no root map is copied into the shared database or ordinary status. A segmented JSON v2 store was rejected because transactional claim, cursor, relationship, migration, and recovery semantics would recreate a database through file protocols. Reusing the current fixed slots or merely increasing limits was rejected because it delays rather than removes the continuous-lifecycle capacity boundary.

### 3. Cut over only after writer quiescence and complete identity readback

Migration has explicit states `not-started -> importing -> awaiting-quiescence -> verifying -> cutover-ready -> active | failed`. Import reads valid v1 records without trusting directory counts alone, inserts by stable source/event identity, folds both stores, and compares record refs, relationships, timestamps, payload digests, diagnostics, checkpoints, decisions, and projected states. Re-execution is idempotent.

Migration persists the exact canonical source directory and manifest before import; cleanup never re-resolves defaults. The protected host enumerates every local OpenCode process through current workstation/process evidence, proves each process that could use that source terminal or write-isolated, and treats any unmatched process as unknown before final import and cutover. On a managed workstation, enable may hand off to the workstation lifecycle for a positively identified OpenCode restart only after every unrelated user/campaign/mission/session/PTY/writer owner is terminal or isolated and migration state is durable. If runtime ownership is active, unmanaged, or ambiguous, enable returns `pending-restart`; it never kills a matching executable by name. Every managed serve or attach launch path that loads Kaizen capture supplies `OPENCODE_KAIZEN_DATA_DIR=D:\OpenCode\data\kaizen`; the v2 resolver treats that value as the complete lifecycle root and appends no additional `kaizen` segment. Activated v2 capture refuses a writable v1 fallback when that value is absent. After restart, the host repeats final import, proves target configuration in the loaded plugin, executes one target capture/read canary, publishes target authority, moves the verified exact legacy source into a target-owned rollback backup, and removes only that recorded directory when it lies outside the v2 root. A failed step leaves the recorded source authoritative and Grind disabled.

Raw copy, file timestamps, elapsed quiescence, and dual writable roots were rejected because they cannot prove no late v1 append or slot collision. A junction redirect was rejected because the current loaded plugin does not understand migration state and directory replacement can race an uncoordinated writer.

### 4. Keep cycle completion finite but population-complete

A cycle transaction freezes the maximum eligible signal sequence and member refs and claims each selected member against competing manual triage. Eligibility includes pending signals plus actionable triaged/promoted signals without a correlated terminal execution handoff whose first automatic admission or evidence-based retry condition is due. The controller selects stable pages of 25 and requires one durable per-member result from the visible triage session: terminal decision, execution-record ref, or exact gate. New captures have a higher sequence and wait for the next cycle. One invocation uses at most 32 model calls, four hours, one active project writer, and two causally distinct retries under a durable daily 96-call/eight-semantic-hour budget window aligned to 03:00 local. The single repeating task wakes every 15 minutes, checks the disabled generation, `nextEligibleAt`, and budget record, and exits provider-free unless the same controller is eligible; daily exhaustion advances eligibility to the next 03:00 window.

Cycle states are `created -> triaging -> dispatching -> waiting | complete | failed`, with `stop-requested` orthogonal until active ownership closes. Execution phases are `preflighting -> dispatching -> campaign-active -> mission-active -> verifying -> awaiting-terminal -> handoff-complete` or `waiting | owner-blocked | falsified | no-action`; these phases describe controller execution only and are not portfolio status or terminal authority. Campaign/Mission completion can advance only to `awaiting-terminal`. For the one BPB-enabled project, only the Kaizen bridge's ordered Beads-close-then-signal-resolve result permits `handoff-complete`; for another registration, only the existing Kaizen terminal transition permits it. Immutable transitions carry prior/resulting state digests, candidate/config/registry/runtime identities, lease/process/session/campaign/mission refs, budgets, evidence, gate, retry condition, and cleanup.

Unbounded drain-until-empty was rejected because incoming signals could prevent termination. A hard per-day population cap was rejected because it recreates the user's manual backlog problem. The high-water plus automatic continuation provides finite processes and eventual bounded-snapshot closure without claiming progress through unavailable providers or protected decisions.

### 5. Route only through the protected existing project registry

The controller uses a distinct protected Grind project registry rather than extending the exact-key campaign-supervisor v1 file. Each Grind registration names a safe id, canonical Git root, derived privacy-safe project ref, one standing onboarding-owned project-contained `kaizen-remediate` definition path/digest, and enablement. The standing definition owns project adapters, aggregate validation argv, provider/daily budget ceilings, allowed effects, Kaizen-specific local-commit authority, reviewed local-only hook manifest/digests, evidence/report paths, and Grind-only host-resume policy. The current maximum of 64 remains. The existing campaign supervisor never parses or resumes this registry.

`current-project` and `opencode-kit` are semantic owner classes, not paths. Current evidence determines the owner before registry lookup. A multi-owner outcome is decomposed into separately correlated execution records; exact execution-prerequisite refs may serialize those owner-local results but do not establish a portfolio dependency graph. No execution record or writer spans repositories. Missing or mismatched registration persists `unregistered`/`owner-unknown` and never triggers a drive scan or project bootstrap.

Codebase Memory project lists, recent worktrees, and filesystem scans were rejected as execution authority because they can be stale, ambiguous, or include unintended checkouts. Storing roots in the shared signal database was rejected because it weakens the established privacy boundary.

### 6. Extend Work Campaign with `kaizen-remediate`; do not create a new writer

The controller freezes one owner-project campaign input that references the exact execution record and separately carries current owner-supplied accepted outcome, evidence, affected paths, effect classes, and candidate facts required by the standing `kaizen-remediate` definition. Those campaign facts are not fields of `execution_records`. Before dispatch the controller queries the Kaizen portfolio owner for that project. If the separately enabled Beads bridge owns that one project's portfolio, the referenced record requires the returned canonical Beads ID and reads readiness, status, dependencies, priority, assignment, duplicate relations, and terminal result through the bounded bridge; none are copied into Grind. Other registrations retain their existing Kaizen decision admission and have no inferred Beads identity. The controller never creates or edits the project-contained definition. The playbook confirms current evidence and ownership, rejects stale or incoherent work, and emits one frozen Roadmap Mission wave. Kaizen definitions select Grind-only host resume and are absent from the logon campaign-supervisor registry, so the repeating Grind task is the only automatic resume host. Work Campaign retains semantic orchestration, verification, retry, and parent state; Roadmap Mission retains all project source, test, OpenSpec, archive, checkpoint, and local-commit mutation.

The existing `audit-remediate` playbook remains unchanged. Reusing it without a new playbook id was rejected because complete-project audit inventory and signal-seeded remediation have different inputs, population claims, and terminal conditions. Letting the Grind controller write project files or OpenSpec was rejected because it would create a second source writer and duplicate campaign recovery.

### 7. Use one visible root session for project proposal and apply

Roadmap Mission already creates an ordinary root session with `directory` set to the project and invokes `opsx-propose` followed by `opsx-apply`. The extension first acquires one canonical-root-scoped mutation lease shared across every audit/Kaizen campaign, mission id, and resume host, then makes visibility and correlation contractual: the executor must use the same authenticated managed server and session store as the user's UI, set a bounded Kaizen-aware title/metadata, and verify that the session is listed under the project before mutation. Proposal and apply remain two canonical command phases in the same root session; deterministic controller-owned proof/validation/archive/checkpoint/local-commit follows existing owners. Before local commit, preflight proves no active hook or an exact reviewed local-only hook manifest/digest; unknown hooks gate commit, and hooks are never bypassed.

A hidden isolated runtime was rejected for production because a successful API call does not satisfy user-visible session access. Creating a new session for apply was rejected because it fragments development context without another owner or proof benefit. Running the project change from the central kit session was rejected because it loads the wrong project authority and creates cross-repository mutation.

### 8. Treat takeover as a writer handoff, not chat input

Opening the visible session is observational. Explicit takeover, or unexpected submitted human input in an automation-owned active session, sets `takeover-requested`, prevents another executor command, immediately aborts or write-isolates an in-flight executor request, and propagates stop intent through controller, campaign, mission, and session. Ownership changes to `user` only after the automation process tree/session/request/writer/cleanup tuple is terminal or project write authority is isolated. Abort/cancel acknowledgement, non-busy status, timeout, or missing PID alone remains unknown and blocks both automatic replacement and claims that the user has exclusive control.

Returning work to automation requires explicit correlated resume and current project/session/candidate preflight. Completed transitions are consumed once. Ignoring user input was rejected because it can create concurrent authors. Aborting the session and creating a fresh manual session was rejected because the accepted UX is continued visibility and optional continuation in the same project conversation.

### 9. Install a separate daily Scheduled Task through the workstation owner

The workstation adds a separately named protected Kaizen Grind task rather than mixing signal ingestion into the campaign-resume supervisor. Its frozen policy is `InteractiveToken`, current owner, highest run level, one daily 03:00 local trigger with 15-minute repetition for 24 hours, `StartWhenAvailable`, `WakeToRun=false`, `IgnoreNew`, and `ExecutionTimeLimit=PT5H`. It neither stores a password nor uses S4U, and missed-run work begins only after owner logon/resume and positive health of the existing managed runtime. Enable uses run-now on this same task. Every wake checks installed manifest, disabled generation, `nextEligibleAt`, daily budget, and controller lease and exits provider-free when ineligible. Its action contains only the pinned protected host plus manifest path. The host reuses the workstation `server-password` file path from the protected install manifest and injects it only in memory after ACL/identity verification.

The task and derived closure live in a protected sibling root with preview/install/check/repair/enable/disable/status/rollback. The four-hour invocation budget begins graceful closure at least one hour before the task limit; forced timeout preserves unknown ownership for later reconciliation. Logs rotate at five 1 MiB generations and contain no credentials or signal payload by default. Disable advances the protected disabled generation and disables the task before stop propagation; rollback removes only matching derived task/controller material and preserves D: and project evidence.

Extending the existing campaign task was rejected because daily signal selection and logon campaign recovery are independent triggers and state owners. A user-startup script was rejected because it lacks protected identity, missed-run behavior, status, repair, and rollback.

### 10. Use one strict machine-local configuration and restart policy

The protected Grind configuration has schema version 1 and exactly these top-level keys: `schemaVersion`, `enabledGeneration`, `dataRoot`, `schedule`, `invocationBudget`, `dailyBudget`, `concurrency`, `sqlite`, `logs`, `runtime`, and `projectsRegistry`. `dataRoot` is the exact absolute lifecycle root `D:\OpenCode\data\kaizen`, equals the launcher-supplied `OPENCODE_KAIZEN_DATA_DIR`, and is the direct parent of `kaizen.db`; neither the resolver nor another owner appends a second `kaizen` segment. Nested shapes are exact:

```text
schedule        dailyAtLocal="03:00", repetitionMinutes=15, continuationMinutes=15
invocationBudget modelCalls=32, wallClockSeconds=14400, retriesPerOperation=2
dailyBudget     modelCalls=96, semanticWallClockSeconds=28800, windowStartLocal="03:00"
concurrency     projectWriters=1
sqlite          busyTimeoutMs=5000
logs            bytes=1048576, generations=5
runtime         endpoint, expectedVersion, healthPollMs=250, healthTimeoutMs=60000
projectsRegistry path, digest
```

The protected install manifest, not portable config, separately binds exact source/installed controller digests, task name/principal/triggers/settings/action/result/log paths, runtime credential path, protected root/ACL, config path/digest, and rollback ownership. The project registry has its own schema version and exact rows `id`, `enabled`, `root`, `projectRef`, `definitionPath`, and `definitionDigest`; standing project definitions own Kaizen provider/effect/commit/hook policy. Unknown fields, aliases, free-form argv/prompts, relative paths, unsafe roots, zero/unbounded budgets, invalid times/ranges, stale digests, absent credential identity, and contradictory generation/task/writer states fail before migration, provider call, session creation, or host mutation.

Schedule, finite process budgets, and log limits take effect on the next task invocation after protected validation. Data-root, runtime identity, registry owner, installed closure, credential path, task-principal/trigger/settings changes require check/repair and, for plugin root changes, managed restart. The managed launcher supplies the exact dedicated Kaizen environment value; `OPENCODE_DATA_DIR` remains unchanged. No portable profile stores absolute roots, credentials, or personal project registrations.

Environment-only configuration was rejected because the controller, installer, status, and rollback need one durable exact machine-local contract. Embedding project registrations in the signal store was rejected because it combines privacy-sensitive execution authority with shared evidence.

### 11. Disable closes ownership before declaring success

The slash commands are deterministic thin front ends to the protected host and never execute semantic or project work in the invoking agent session. Disable first writes an installation-owned disabled generation and disables the same repeating task; task host, triage dispatcher, and controller must check the generation before any launch. It then records controller stop intent and propagates scoped stops to active campaign/mission/session/request owners. `disabled` requires no launchable task instance and terminal or isolated mutation-capable ownership. `stopping-unknown` preserves uncertain ownership; enable/run-now/repair are ineligible, and task removal, abort/cancel acknowledgement, non-busy API state, timeout, PID absence, or elapsed time cannot clear it.

Capture remains enabled and writes to D:. Disable does not revert, delete, archive, commit, or modify project output. Rollback is separate and preserves data/evidence. Immediate process kill was rejected as the normal path because cancellation without writer closure can permit late mutation and corrupt downstream lifecycle claims.

### 12. Observe every owning failure boundary once

Status is provider-free and reports installation/config/data/migration/task/controller/cycle/member-claim/triage-session/execution-record/project/runtime/campaign/mission/development-session/request/writer/budget/gate/cleanup dimensions separately. Each process writes bounded structured stdout/stderr with run and owner refs; the owning boundary logs one cause with original stack/cause and safe context. Shared output redacts credentials, signal text by default, and absolute consumer roots.

Health never infers product completion from green task state or process presence. Database integrity, cycle population, campaign/mission transitions, OpenSpec readback, proof/validation, Git commit, and ownership closure remain distinct oracles. Status summaries and reports are projections, never lifecycle authority.

### 13. Proof advances from migration to one installed multi-project cycle

Current fidelity is source-verified planning plus direct observation of the legacy store and existing campaign/mission/session/task owners. The first real boundary is a provider-free disposable migration of the exact v1 schema into v2 with concurrent capture and complete fold/readback. Implementation then advances through:

1. Provider-free v2 store, migration, cursor, lease, replay, config, and status against disposable roots.
2. Copied-plugin capture against the D: target and managed-restart cutover simulation.
3. Provider-free controller over more than 25 signals, actionable migrated decisions, member claims, two Grind registrations, mixed terminal/gated work, crash, repeating-task eligibility, stop, and takeover fixtures.
4. One visible managed-server triage cycle with bounded configured-provider calls and zero project/source effects.
5. One direct standing-definition Work Campaign `kaizen-remediate` to project-leased Roadmap Mission handoff in a disposable project without host installation.
6. One managed OpenCode project-root session proving same-session proposal/apply visibility, in-flight takeover closure, proof, validation, archive, reviewed-hook local commit, no remote effect, and cleanup.
7. One proof-owned protected repeating Scheduled Task installation with immediate, eligible/no-op, daily/missed-interactive-logon behavior, disable during active ownership, repair/rollback, and exact task/process/file cleanup.
8. One installed two-project cycle exercising the `KZG-001` population and maximum claim.

Provider calls are bounded to accepted configured local authority; no test authorizes purchase, quota increase, remote repository mutation, release, or deployment. Disposable projects/data/task names/processes are uniquely proof-owned, and cleanup never targets an existing OpenCode process or unrelated task. Failed live/costly attempts follow the live-attempt and causally distinct retry contract before repetition.

## Risks / Trade-offs

- **[Node and Bun differ in SQLite transaction or WAL behavior]** -> Prove the exact installed runtime pair before cutover; keep C: authoritative and Grind disabled on mismatch.
- **[An old OpenCode process writes v1 after import]** -> Require positively identified writer quiescence, repeat final import, and publish D: authority only after managed restart/readback.
- **[Protected registry contains stale or unintended roots]** -> Verify canonical Git root, digest, policy, project ref, containment, and cleanliness before every execution record and writer.
- **[Visible API session is not visible in the user's UI]** -> Correlate the same managed endpoint/data store and require actual project session-list plus UI observation before production claim.
- **[User input races an automated command]** -> Stop command admission immediately, reconcile takeover through every writer owner, and remain unknown until closure or isolation.
- **[Daily automation consumes unexpected provider budget]** -> Enforce one durable 96-call/eight-semantic-hour window aligned to 03:00, retain 32-call/four-hour invocation sub-bounds, expose consumption/status, pause automatically, and never purchase or raise quota.
- **[A project stays dirty or blocked indefinitely]** -> Preserve exact gate and retry only after its evidence condition changes; continue independent registered work without weakening the claim.
- **[Local commit hook, signing, or post-commit remote effect blocks completion]** -> Require no active hook or an exact reviewed local-only hook manifest/digest, preserve project output and exact failure, gate unknown hooks and remote observations, and never bypass hooks or invent checkpoint identity.
- **[Disable removes the task but a writer survives]** -> Report `stopping-unknown`, suppress successors, and preserve state until terminal or isolated ownership is proven.
- **[The new controller duplicates campaign responsibility]** -> Keep semantic confirmation/waves/verification in Work Campaign and all project mutation in Roadmap Mission; controller owns only queue/schedule/routing/correlation.

## Migration Plan

1. Implement and prove the v2 store/config/migration boundary provider-free while all production resolution remains v1.
2. Add cursorable status and controller state in disabled mode; import the observed v1 schema repeatedly and prove idempotent fold equality.
3. Add distinct protected Grind registry routing, transactional claims, provider-free high-water execution, and the visible read-only triage classifier with no project writer.
4. Add standing `kaizen-remediate` definitions, Grind-only campaign resume, project-scoped mission lease, and visible Roadmap Mission session/takeover behavior in disposable projects; prove project lifecycle before scheduling.
5. Add preview/check for protected Windows installation, then install a proof-owned task and prove run-now/daily/missed-run/disable/rollback cleanup.
6. Run managed cutover: durable handoff, positively identified runtime restart or `pending-restart`, final import, target canary, loaded D: root readback, authority publication, D:-owned rollback backup, and exact C: Kaizen removal.
7. Enable the real task, run one immediate bounded catch-up cycle, inspect status/session/project effects, and retain rollback until the installed proof and repository validation are green.

Rollback disables new runs, closes active ownership, restores the last verified schema/config/controller installation and target backup, and can reactivate v1 only after proving no v2-only accepted write would be lost. It never deletes the D: lifecycle or reverts project commits automatically. A rollback that cannot preserve both accepted data populations remains blocked rather than selecting one silently.

## Open Questions

None. Exact current runtime/task/SQLite/session behavior is an implementation proof prerequisite with fail-closed outcomes, not a deferred product decision.
