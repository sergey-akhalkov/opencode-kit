## Context

See `proposal.md` for motivation and the change-level `BPB-001` claim. Current Kaizen v1 is a bounded append-only evidence/lifecycle owner with privacy-safe project/session refs, 2,000 signal records, 8,000 lifecycle records, explicit triage decisions, and no autonomous work scheduling. `grind_frontier` separately owns one bounded session task graph with generation checks and product, process, technical, capability, external, safety, live-attempt, and writer-liveness gates. Work Campaign and Roadmap Mission already own durable campaign handoff and source-writer leases.

The unimplemented `add-autonomous-kaizen-grind` change originally proposed a SQLite v2 lifecycle containing `work_items`, queue transitions, routing, and claims. That proposal is planning evidence, not current runtime behavior, and implementing it unchanged beside Beads would create two admitted-work owners. Foundation incident `FI-BPB-KZG-20260901-01` therefore narrows the Grind state to `execution_records` with controller execution correlation only. Current source and official Beads documentation show a plausible lower-cost external owner for issue identity/dependencies/readiness/assignment, while the selected `v1.2.2` release is a recovery release that omits work leases, events, federation, and HTTP features described elsewhere in current docs.

This change is Material because it adds a pinned external executable, local persisted Dolt state, multi-process coordination, project initialization, optional loaded OpenCode artifacts, and lifecycle correlation. Planning performs none of those effects. The current worktree also contains unrelated untracked Kaizen Grind artifacts; apply must recheck and preserve their current owner before any overlap correction.

## Goals / Non-Goals

**Goals:**

- Prove the exact selected binary and embedded Dolt boundary before writing production integration.
- Provide one explicit reversible binary, full `core-beads` profile, and one-project activation lifecycle.
- Reuse Beads for admitted portfolio identity and coarse graph behavior while extending existing owners only at narrow correlation and observation boundaries.
- Make interrupted create and close operations recoverable without another lifecycle database.
- Keep the default startup surface and current project source behavior unchanged.

**Non-Goals:**

- A final workstation-wide or team-wide portfolio topology.
- Concurrent production source writers, shared Dolt server, federation, remote sync, or cross-machine backup.
- Another queue, event journal, agent registry, vote store, workflow engine, or generic external-tool framework.
- Vendor-owned OpenCode instructions, hooks, MCP, or automatic issue creation from raw signals.

## Decisions

### 1. Separate global capability availability from project data activation

The external binary is installed once under the existing protected workstation lifecycle, while loader visibility is selected through one exact full `core-beads` profile and data activation is selected through one exact machine-local project registration. `core-beads` is validated as the current complete `core` manifest plus one on-demand Beads skill/helper closure; it is not a partial profile composed at install time. The full `all` profile and unprofiled `global/` source also discover the skill once because they are full catalogs, but discovery has no automatic effect. Binary, loader, and project states are reported independently. This gives any project a reusable future path without silently sharing databases or initializing every repository.

One global `BEADS_DIR` was rejected because a command from the wrong project could address the same database and weaken project/privacy boundaries. A partial composable `beads` profile was rejected because the current profile owner materializes one full named manifest and the installer accepts only concrete identities; a Beads-only tree would omit core authority. Default project initialization was rejected because global tool availability does not authorize persisted project state. A central planning repository remains a later topology candidate, not an implication of this one-project proof.

### 2. Pin the tested recovery release and prove the executable before installation

The source manifest fixes the `v1.2.2` Windows amd64 archive URL and SHA-256 from the upstream release. The disposable spike downloads into an automatically cleaned proof-owned temporary root, verifies the archive before extraction, records the executable digest, observes `bd version` and exact required help, and then exercises embedded Dolt behavior. Only the observed command surface is supported by the adapter.

Using `latest` was rejected because `v1.2.0` and `v1.2.1` caused schema skew and `v1.2.2` deliberately removed their untested features. Pinning a release candidate was rejected because the current increment values recovery stability over prospective leases/federation. Vendoring the binary into Git was rejected because it adds a large opaque artifact and upgrade burden without improving checksum verification.

### 3. Use project-local embedded Dolt for the one-project pilot

The selected registration resolves one canonical Git root and unique prefix. Activation invokes non-interactive embedded initialization with `--skip-agents`, `--skip-hooks`, and reviewed local exclusion behavior. Before/after capture inventories tracked bytes, index/worktree state, hooks, remotes, relevant Git config, `.git/info/exclude`, `.beads`, processes, and paths. Auto-export, auto-stage, server, federation, and remotes remain disabled.

A shared server was rejected because it adds a service/process/credential/backup owner before embedded operational fit is known. JSONL was rejected as synchronization or backup because upstream defines it as optional interchange. `--stealth` was not selected blindly because it can change global Git behavior; apply must choose only the smallest directly observed project-local exclusion mechanism.

### 4. Keep installation, vendor invocation, and Kaizen orchestration with separate owners

The existing workstation owner alone previews, installs, checks, and rolls back the protected binary/profile material. A narrow Beads vendor adapter resolves that pinned executable and registered canonical root, invokes without a shell, sets non-interactive behavior, applies exact limits, parses JSON where supported, preserves exit/stdout/stderr cause, and inventories effects for project check/enable/disable, list/ready/show, atomic create-feature, exact update/assign, and close-feature. It does not interpret Kaizen eligibility, write Kaizen transitions, determine OpenSpec terminality, or install/roll back the executable/profile. The existing Kaizen owner gains one owner-local orchestrator for promote/link/close/resolve; it calls the vendor adapter and canonical OpenSpec readback but retains all Kaizen lifecycle mutations.

Direct skill-authored `bd` commands were rejected because every caller would have to reproduce version/root/effect/privacy checks. One universal facade was rejected because installer, vendor CLI, and Kaizen lifecycle failures would become a mixed owner. An MCP server was rejected because CLI JSON is sufficient and MCP adds startup context, another process, and a larger permission surface. A generic external-CLI wrapper was rejected because it would outlive the exact Beads contract without a second consumer.

### 5. Serialize project-local Beads writes with one fail-closed project lease

Ready/show/status remain read-only. Project enable/disable, promote, assign, link, close, and project-local rollback coordination acquire one bridge lock in protected workstation-owned project state outside `.beads`, correlated to project, adapter digest, process identity, operation, and start time. The workstation lifecycle owns the lock artifact's protected storage, identity, and deletion; bridge operations only acquire and use it. The lock is held through the complete query-mutate-readback transaction and is not released until every spawned `bd`/Dolt process that could write is terminal or its project write authority is isolated. Any workstation rollback that would remove or revoke binary, profile, adapter, config, registration, or lock material referenced by a project registration must acquire the same lease first. If that lease is held or writer liveness is unknown, rollback preserves the lock and every referenced managed item and reports a partial unknown result. Workstation install/rollback remains a separate owner operation after this coordination gate. Existing source-writer leases remain independent because tracker writes neither grant nor require source mutation.

An existing Campaign or Mission writer lease was rejected because it would couple harmless portfolio updates to source execution and still would not cover pre-campaign promotion. A lock inside `.beads` was rejected because it would mix kit ownership with vendor data paths. Trusting a two-command query/create sequence without a bridge lock was rejected because two agents could create duplicate features. Releasing the bridge lock on adapter timeout or cancellation acknowledgement was rejected because a child Dolt writer could mutate late. Automatic stale-lock takeover from elapsed time or absent PID was rejected; ambiguous process/write ownership remains a repair gate until terminality or write isolation is proven.

### 6. Make Beads the correlation source without changing Kaizen v1 schema

The Kaizen orchestrator resolves eligibility with exact semantic predicates. `project-change` requires `ownerClass=current-project` and the enabled registration's derived project ref in the signal's recorded project refs. `kit-candidate` requires `ownerClass=opencode-kit` and an enabled registration whose semantic owner is `opencode-kit`; the triage-session project ref is not treated as the source project or kit owner. Promotion then queries open and closed Beads states by exact bridge metadata. Zero matches invokes one observed `bd create` command that atomically supplies the stable external ref plus complete `bridgeSchemaVersion`, `kaizenSignalRef`, `decisionRef`, `projectRef`, and owner-class metadata; one match is reused; multiple matches fail. If the pinned command cannot atomically commit those fields, promotion remains unsupported. After exact create/readback, the existing Kaizen transition appends `promoted` with a bounded `beads:<full-id>` note.

Adding a new Kaizen v1 link event was rejected because older loaded parsers could reject an unknown persisted event and it would pre-commit the active SQLite v2 migration design. A separate bridge database was rejected because Beads metadata plus existing Kaizen transitions can recover both interruption windows. Storing only a free-form Kaizen note was rejected as the correlation owner; the note is navigation while exact Beads metadata is the recoverable lookup source. Matching only `decision.projectRef` was rejected because a triage session can run from a different project than the signal origin or the semantic `opencode-kit` owner.

### 7. Link exactly, then use an ordered fail-closed terminal projection

After canonical OpenSpec creation, link acquires the same bridge lease, confirms exact project and correlation, updates `spec_id` plus `changeRef`, and reads back the association. Repeating the same link after response loss returns the existing association; a different existing project/change link or multiple correlation fails before overwrite. Close then performs exact link/correlation readback, validates the linked project/change, checks canonical current tasks/proof/validation/archive and writer/cleanup closure, closes the Beads item, reads it back, and only then transitions Kaizen to resolved. If interruption occurs after Beads close, reconciliation appends the missing Kaizen transition. Any interruption before close leaves both records open enough to avoid a false terminal claim.

Automatic close from a Beads status or assignee was rejected because neither is implementation evidence. An overwrite-on-link retry was rejected because it can bind the wrong change after a crash. Closing Kaizen first was rejected because a crash could falsely resolve raw improvement evidence. Repeating archive or implementation during projection repair was rejected because synchronization must not replay product effects.

### 8. Keep Beads readiness and assignment advisory

Beads stores coarse blocker/parent/duplicate relations and bounded assignee/session refs. `bd ready` can identify a portfolio candidate, but main independently checks current acceptance, OpenSpec, frontier gates, project state, and writer ownership. Production atomic claim is not used in this increment because `v1.2.2` lacks the accepted work-lease recovery contract; only the disposable spike characterizes two-process claim behavior.

Mirroring OpenSpec tasks or `grind_frontier` items was rejected because it creates status synchronization and lets a coarse graph conceal protected gates. Treating assignment as a writer lease was rejected because assignee strings do not prove process liveness or write isolation.

### 9. Treat repeated agent support as evidence, not voting

The bridge may display Kaizen occurrence counts and distinct privacy-safe project/session refs alongside one canonical Beads feature. Those facts never update Beads priority or admission automatically. Main or an accepted workflow sets priority after evaluating current impact and reachability.

A custom vote table or metadata score was rejected because no accepted decision rule exists and counts are vulnerable to repeated correlated observations. Native duplicate/supersede relations may be used only after evidence confirms semantic identity; automatic fuzzy duplicate repair is outside the increment.

### 10. Expose the bridge through one full `core-beads` profile and on-demand skill

The concrete `core-beads` manifest equals current core plus concise Beads skill discovery metadata and its helper closure. The profile validator enforces that union and the installer accepts the new full identity. `core` omits Beads. `all` and unprofiled `global/` source expose the same on-demand skill once as expected full catalogs; their source presence is discovery-visible but still has no automatic binary/project effect. No thin command artifact is needed: the skill calls only the closed adapter/orchestrator with fixed semantic operations. Its description and body say to use it only for an explicit Beads/`bd` request or an enabled-project portfolio request, stay quiet for ordinary OpenSpec/Kaizen/grind/implementation/review/task work, and allow install/enable/status only when explicitly named. Binary install and project registration remain separate. Fresh proof-owned OpenCode processes prove exact core/core-beads/all/full-source identities; the running user process is not restarted by this change.

`bd setup opencode` and its managed `AGENTS.md` block were rejected because they claim Beads owns all tracking and add always-loaded command bulk. `bd prime` at session start was rejected because it can consume more context than bounded ready/show queries. A plugin was rejected because no automatic startup hook is needed. A loose “issue/ready work” trigger was rejected because it would overlap current OpenSpec, Kaizen, and frontier owners.

### 11. Reconcile portfolio identity while preserving Grind execution records

The disposable binary/Dolt spike is independent and runs first. Before implementing production promotion, current `add-autonomous-kaizen-grind` artifacts must be reread and corrected so its SQLite lifecycle retains signals, occurrences, decisions, cycles, cycle-member claims, gates, budgets, routing, and a Grind-local execution record for Campaign/Mission retry and correlation. For the one BPB-enabled project, that record contains only its execution ref, run/cycle and source-decision refs, project/registration/candidate digests, canonical Beads ID, exact execution-prerequisite refs, route, gate/retry, Campaign/Mission/session refs, and resulting execution handoff. It does not own or copy portfolio status, dependencies, priority, assignment, duplicate relations, or terminal authority. Grind may call the Kaizen-side bridge orchestrator after triage admission and observe Beads through bounded adapter results; the controller only records the bridge's ordered terminal result. A Grind registration outside the one-project BPB envelope has no inferred Beads identity or ownership.

Implementing both portfolio graphs unchanged was rejected as duplicate authority. Deleting every Grind `work_items`-like execution record was rejected because Campaign/Mission still needs durable controller-owned routing, retry, gate, and handoff correlation that Beads `v1.2.2` does not provide. Deleting the Grind controller was rejected because Beads does not own signal capture, semantic triage, cycle budgets, project authority, protected gates, Campaign handoff, or source writers. This planning reconciliation is required dependency closure, not permission to overwrite unrelated user changes; overlap or changed intent at apply remains a scoped ownership gate.

### 12. Prove operational fit before expanding the claim

Current fidelity is source and official-documentation planning; `bd` is absent from the workstation. The proof ladder is:

1. Verify the pinned archive/executable and required CLI surface in an isolated temporary root.
2. Exercise embedded Dolt init, graph, ready, assign/claim contention, interruption, reopen, integrity, storage, and cleanup in one disposable repository.
3. Reconcile the active Kaizen Grind portfolio identity while preserving its distinct execution/routing record, without production code.
4. Implement and directly exercise the narrow vendor adapter plus Kaizen orchestrator against disposable Kaizen/OpenSpec/project fixtures, including exact link recovery.
5. Preview/install/check the protected binary and materialize the exact full `core-beads` profile without project activation.
6. Use fresh isolated OpenCode processes to observe concrete core/core-beads/all/full-source identities and stay-quiet behavior.
7. Enable one disposable clone, prove idempotent promotion/link and ordered terminal projection, then disable and roll back installation/profile effects while preserving project evidence.
8. Run matched baseline/candidate consumer outcomes and report a context improvement only if every hard oracle stays green.

The next real boundary is rung 1. It requires an authorized bounded public download of the exact asset, no credentials, isolated paths/environment, process attribution, no working-project or installed-config mutation, exact diagnostics, and cleanup. Failure blocks unchanged repetition and production integration; it does not authorize another version or mechanism without updated current evidence.

## Risks / Trade-offs

- **[The pinned recovery release lacks expected multi-agent features]** -> Probe the actual binary, use assignment only as coordination, exclude production claim leases, and stop before server/federation adoption.
- **[Initialization mutates more Git state than documented]** -> Capture before/after tracked bytes, hooks, remotes, config, excludes, and paths; fail and roll back attributable effects before activation.
- **[Bridge process crashes between query and create]** -> Serialize writes, put exact correlation metadata in the created Bead, and recover by exact all-state lookup.
- **[Bridge process crashes during terminal projection]** -> Close Beads before Kaizen resolution and repair only the missing projection transition.
- **[A stale lock blocks useful work]** -> Preserve safe stale-open state, expose exact process/write evidence, and require terminality or write isolation before repair.
- **[Dolt history or store size grows unexpectedly]** -> Record initial and exercised size/history facts, expose bounded status, and defer retention/squash policy until real growth evidence exists.
- **[Optional profile adds more context than it saves]** -> Keep core unchanged, deep guidance on demand, and use matched consumer outcomes without making savings part of `BPB-001`.
- **[Kaizen Grind planning changes concurrently]** -> Re-read exact artifacts before task execution, preserve unrecognized changes, and block only production bridge overlap until one owner is coherent.
- **[Workstation rollback races a live or unknown bridge writer]** -> Make the workstation lifecycle the sole lock-artifact owner, acquire the same bridge lease before removing referenced managed material, and preserve the lock plus all referenced items when writer closure is not proven.
- **[Rollback deletes user data]** -> Treat `.beads` and Kaizen/OpenSpec records as preserved evidence; remove only exact installed/profile/registration effects and retain drift.

## Migration Plan

1. Run the disposable pinned release spike with no installed or project state.
2. Reconcile the active Kaizen Grind admitted-work ownership before production bridge code.
3. Add the narrow vendor adapter, Kaizen orchestrator, proof fixture, release manifest, installer lifecycle, and exact full `core-beads` profile in source-only disabled form.
4. Prove direct adapter operations against disposable fixtures, then preview and install the exact protected binary.
5. Materialize `core-beads` and validate core/core-beads/all/full-source discovery in fresh proof-owned OpenCode processes.
6. Register and enable one disposable clone of the pilot project, execute the full `BPB-001` path, and inspect all effects.
7. Disable new writes, prove writer/process closure, roll back binary/profile/registration effects, and preserve the project-local Beads store plus Kaizen/OpenSpec evidence for inspection.
8. Keep any later second-project, central portfolio, server/federation, remote, retention, or production claim-lease proposal outside this change.

Rollback never converts Beads data into a second Kaizen store, deletes the project-local Dolt history, reverts project source, or relabels OpenSpec/Kaizen completion. If an installed identity drifted, the bridge lease is held, or writer liveness remains unknown, rollback preserves the lock and every registration-referenced managed item, stays partial, and reports the exact retained state rather than forcing cleanup.

## Open Questions

None. Windows/Dolt behavior, initialization effects, context cost, and operational sufficiency are explicit implementation proof gates with fail-closed outcomes; cross-project topology is outside this change rather than an unresolved current decision.
