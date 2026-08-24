## Context

See `proposal.md` for motivation and the six delta specs for behavior. The current kit has several correct owners that should be narrowed rather than replaced: global startup routing in `global/AGENTS.md`, conditional Material detail in `change-ready-sdlc`, OpenSpec artifact rules and operation gates, completion-guard root metadata/audit epochs, the roadmap executor's structured result, instruction inventory/budget tooling, and doctor check records.

The worktree also contains unrelated active implementation in `add-autonomous-roadmap-mission-runtime`, including completion-guard and mission-executor files, plus a workstation change. Planning this change is isolated; implementation that overlaps those owners must wait until the active writer is closed or reconcile against its final candidate without reverting any current work.

This is a Material lifecycle and safety-policy change. It changes when qualification and SDET are mandatory, how permissions are resolved, and when a grind root may terminate without a model call.

### Fidelity And Proof Envelope

Current rung: audited repository source, runtime-source inventory, current validator behavior, and direct completion-guard source. The first real boundary is provider-free strict validation over synchronized specs, workflow surfaces, budget schema, doctor fixtures, and guard certificate parsing. The next boundary is a fresh disposable installed OpenCode source running matched Ordinary Small, Material, certified-completion, ambiguous-completion, and permission-precedence scenarios.

Authorization is limited to local repository edits, disposable config/project/session state, and the minimum non-sensitive configured-model calls needed for matched instruction and ambiguous-arbiter behavior. No consumer migration, host activation, remote operation, deployment, release, or unrelated active-change mutation is authorized. Every disposable process/session is terminated and every fixture removed after immutable privacy-safe capture; running OpenCode sessions are not candidate evidence because config-time artifacts do not hot-reload.

## Goals / Non-Goals

**Goals:**

- Make one active authority path agree across normative specs, runtime prompts, validators, templates, and diagnostics.
- Reduce startup and per-task context without weakening protected boundaries or observable proof.
- Make qualification and independent critical challenge proportional to reachable risk.
- Avoid an arbiter model call only when a trusted deterministic owner has already proved terminal completion.
- Preserve configured permission precedence and make installed/template drift visible.
- Keep evidence useful for causal replay without making the complete evidence tree routine model context.

**Non-Goals:**

- A second workflow engine, completion arbiter, scheduler, permission manager, semantic scorer, or evidence database.
- Automatic rewriting of archived changes or bulk deletion of evidence.
- Retrofitting every active consumer project.
- Replacing model evaluation with marker checks for semantic instruction quality.
- Parallel mutation of files currently owned by another active change.

## Decisions

### Decision 1: Remove retrospective completion scope instead of making it cheaper

Delete the normative final-history requirement and generated improvement-task persistence from active workflow surfaces. Keep `history.md` only for materially distinct attempted strategies and live-attempt retry evidence. Keep optional workflow learning in explicit audit/feedback or a separately accepted change.

Alternative rejected: retain the retrospective but reduce its fields. It still runs after product completion, still reads the complete journal, and still can create new completion scope; fewer fields do not remove that causal delay.

### Decision 2: Separate stable principles from compact operational routing

`global/principles-of-work.md` is the single complete owner of the durable working philosophy and priority order. `global/AGENTS.md` opens with a pointer to that constitution and retains protected boundaries, Ordinary Small verified-outcome routing, the Material/qualification trigger, dirty-worktree safety, real-boundary proof, diagnostics, blocker-only questions, and concise live-attempt rules. `change-ready-sdlc` remains the single detailed owner for qualification stages, evidence topology, expensive-attempt replay, and risk-triggered SDET. Role files and project templates carry only pointers, permissions, and role/project deltas.

The combined committed startup authority must remain within the existing 13,279 token-proxy target. Reduction is accepted only when matched baseline/candidate scenarios preserve every named safety oracle.

Alternative rejected: copy the complete philosophy into both always-loaded files. That increases startup cost and creates competing owners; one constitution plus one operational router keeps ownership explicit.

### Decision 3: One change proof envelope, task-specific deltas

Proposal owns the seven-field outcome capsule. Design owns shared fidelity, authorization, safeguards, cleanup, evidence, and failure boundaries. Tasks state only distinct behavior, dependencies, the next observable boundary, and focused validation. A task repeats a stronger local gate only when it differs from the shared envelope.

Alternative rejected: keep all fields but generate them mechanically. Generation saves authoring keystrokes while preserving model context cost and repeated review surface.

### Decision 4: Separate verified outcome from qualification

Ordinary Small uses `Outcome: working | blocked | unknown`, current representative proof, focused validation, and limitations. The Development/MVP/RC/stable state machine is loaded and reported only for explicit qualification, project-required qualification, or a reachable named critical-risk qualification path.

Material classification remains a routing and safety decision; it no longer automatically implies RC bookkeeping or SDET. SDET is mandatory only for a reachable critical consequence or explicit project/owner requirement. After happy-path proof, main may write the smallest focused regression oracle for a reproduced requirement-linked defect. A triggered SDET remains fresh, independent, test-only, and non-authorizing.

Alternative rejected: preserve mandatory SDET but give it shell access. That reduces handoff friction but still pays for an independent model run when no critical hypothesis is reachable and retains artificial test ownership.

### Decision 5: Reuse guard epochs and mission facts for certified completion

Extend existing completion-guard metadata and epoch correlation with one versioned terminal certificate. Do not add another service or generic certificate framework. The configured issuer is an existing deterministic workflow owner, initially the roadmap executor/controller integration. It issues a certificate only after its current phase verifies exact root/revision/lease identity, accepted requirement identifiers, terminal task/operation facts, no pending question or writer, and bounded evidence references.

The guard applies a certificate only after its existing idle/lease preflight returns clear for the same epoch. Acceptance records deterministic passed status and no arbiter child. A stale, malformed, unknown-issuer, incomplete, or mismatched certificate has no terminal effect; the root follows ordinary arbitration or fail-closed handling. Certificate arrival races cancel or invalidate any not-yet-applied audit through existing epoch checks.

Reuse disposition: `extend` existing guard metadata, audit correlation, structured mission result, and operation-gate facts. No new dependency or top-level executable. Cross-project discovery is not applicable because the behavior is intentionally internal to the kit's installed runtime contract.

Alternative rejected: infer deterministic completion directly from transcript text or unchecked command exit. Neither proves accepted requirements or distinguishes incomplete, owner-required, and stale states.

Alternative rejected: disable the arbiter for every mission root. Ambiguous model work still needs requirement mapping and bounded continuation.

### Decision 6: Remove plugin-owned permission mutation

Delete the completion guard's top-level permission replacement. The portable global template may remain explicitly autonomy-first, but project, explicit, inline, and managed precedence must remain effective. Guard startup and runtime report denied required capability as a cause-preserving capability state; they never approve or persist permission changes.

Alternative rejected: apply `allow` only after `/enable-grind`. Enabling a completion mode is not authority to override project or managed security policy.

### Decision 7: Budget the context categories that runtime exposes

Version the budget seed to store separate maxima for committed global startup authority, loader-visible discovery metadata, and maintained on-demand bodies. Keep source-derived measurement and privacy-safe identities. `--materialize-seed` may lower or retain maxima but cannot increase them. Intentional growth requires a direct reviewed seed edit in a change that explains the trade-off.

The startup authority has the hard 13,279 target. Discovery and on-demand maxima remain growth brakes, not claims that all bodies enter the prompt.

Alternative rejected: keep one catalog total and add a documentation warning. The current tooling already has that warning, yet a green near-ceiling catalog number remains easy to misread as healthy startup context.

### Decision 8: Classify doctor targets by repository contract, not path name

Doctor identifies the kit checkout from package identity plus `REPO_AGENTS.md`, `global/principles-of-work.md`, `global/AGENTS.md`, the qualification skill, and concrete package validation scripts. The exception is not triggered by directory basename. Consumer fixtures continue to require project runtime guidance and adapter/validation authority.

Cross-artifact consistency becomes one deterministic check consumed by strict validation and doctor. It compares explicit active require/forbid contracts; it does not infer semantic quality.

Alternative rejected: add a root `AGENTS.md` and adapter only to satisfy doctor. That would create another loader-visible authority and duplicate commands the repository already owns.

### Decision 9: Preserve evidence by causal identity, not capture count

Maintain a bounded manifest from each governed lane to its first causal failure, successor-unlock evidence, current terminal bundle, and retry condition. Raw bundles remain immutable and are not deleted by normal validation. Superseded duplicate-success captures may be pruned only by a separately reviewed retention action after no active history entry references them.

Alternative rejected: delete all intermediate evidence during this change. Existing active attempts and live-attempt gates may depend on those facts, and unrelated work must not be altered.

### Decision 10: Serialize overlap with active changes

Implementation begins on non-overlapping normative and validator owners or waits for explicit integration sequencing. Before editing completion guard, roadmap executor, shared specs already changing in the worktree, or machine-local config, recapture the current diff and prove no concurrent writer remains. Integrate against the final current bytes; never restore or overwrite another change.

## Failure Boundaries And Diagnostics

- **Authority consistency**: report both conflicting paths, requirement names, and require/forbid terms; do not select a winner silently.
- **Instruction reduction**: preserve baseline/candidate source, model/profile, prompts, outputs, tool/effect facts, startup token classes, and cleanup; a missed safety oracle rejects the reduction.
- **Terminal certificate**: report issuer class, root/revision/lease mismatch, missing requirements, and stale evidence without prompt or payload disclosure; invalid input never becomes completion.
- **Permissions**: report resolved policy class and denied capability without config values or approval mutation.
- **Budget**: report boundary, actual, maximum, and whether the attempted operation was validate, lower, or prohibited increase.
- **Doctor**: report the observed repository contract facts that selected kit or consumer mode; ambiguous identity remains consumer-safe and does not receive the exception.
- **Evidence manifest**: missing referenced bundles or ambiguous current terminal identity fail the affected replay lane without deleting files.

## Risks / Trade-offs

- **Compact instructions omit a safety distinction** -> matched baseline/candidate loaded workflows cover Ordinary Small, Material, protected owner boundary, technical blocker, live-attempt replay, and dirty worktree before retention.
- **Risk-triggered SDET is under-selected** -> deterministic named critical classes, project override, and main's non-deferrable reproduction duty remain mandatory; ambiguous critical reachability selects SDET.
- **Certificate is forged or stale** -> configured issuer allowlist plus root/revision/lease/requirement correlation and existing preflight; invalid certificates never stop a root.
- **Permission denial reduces unattended completion** -> fail with actionable capability diagnostics; operators choose permissive config explicitly rather than the plugin widening authority.
- **Active config keeps removed prompt text** -> privacy-safe digest/marker drift diagnostics, explicit sync only after source proof, and fresh-process verification.
- **Historical active tasks still contain retrospectives** -> migrate only active compatible controls after ownership review; archived evidence remains unchanged.
- **Reduced task text hides a special cleanup requirement** -> any task with a stronger boundary must record that delta; validators check shared-envelope reference plus local exceptions.

## Migration Plan

1. Synchronize normative deltas first: remove retrospective and universal stage requirements, introduce shared-envelope, risk-trigger, permission, certificate, budget, and doctor contracts. Add contradiction validation before reducing runtime text.
2. Compact global authority and mirrors against frozen matched baseline scenarios. Update validators from exact duplicated marker lists to canonical-owner plus role-delta checks.
3. Change OpenSpec proposal/apply/archive/context rules and migrate only compatible active retrospective tasks after confirming ownership. Do not edit archives.
4. Version instruction budget data and update inventory, strict validation, docs, and fixtures. Prove startup/discovery/on-demand readback before any model comparison.
5. Remove guard permission mutation and prove project/main plus specialist precedence through the loaded disposable plugin.
6. Extend guard and mission owners with the terminal certificate. Prove invalid/stale cases provider-free, then one certified installed path with zero arbiter calls and one ambiguous path with exactly the bounded arbiter behavior.
7. Update doctor self-hosted classification, source/prompt drift diagnostics, evidence manifest guidance, README, and proof inventory.
8. Run matched installed instruction workflows, complete project validation, strict selected/all OpenSpec validation, and risk-triggered fresh SDET only for the reachable permission/certificate critical risks.
9. After proof, explicitly synchronize the machine-local managed config if selected, start a fresh OpenCode process, and repeat the representative loaded scenarios. No consumer project migration is performed.

Rollback restores the prior version-controlled authority, specs, validators, guard behavior, budget schema, and doctor behavior as one correlated candidate. If machine-local config was synchronized, restore its captured preimage and restart OpenCode. Preserved raw evidence and unrelated active-change files are never rolled back or deleted by this change.
