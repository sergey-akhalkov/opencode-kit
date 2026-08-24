## Context

See `proposal.md` for motivation and claim scope, and the four delta specs for observable behavior. The kit already has most of the needed owners: `global/bin/portable-process.ts` for shell-free cross-platform process execution, project-neutral OpenSpec operation and archive helpers, task-correlated `evidence-index.json`, deterministic validation contracts, focused test runners, the proof inventory, instruction context budgets, and `library-consumer-outcome-regression` for matched outcome/safety/friction evaluation.

The existing no-retrospective rule was introduced deliberately after final-history and generated-improvement ceremony delayed product completion and created contradictory runtime authority. This change does not restore that mechanism. It introduces one proposal-time accepted automation dividend for Material or explicitly selected changes, with an Ordinary Small exemption and no final transcript analysis.

Current active changes and the dirty worktree overlap `global/AGENTS.md`, OpenSpec skills and commands, operation-gate/archive owners, evidence contracts, package scripts, validators, proofs, and the three modified main specs. Planning is isolated in this new change directory. Implementation must recapture the current ownership/diff state, close or integrate any mutation-capable overlapping attempt, and preserve the final current bytes rather than restoring another change's work.

This is a Material loaded lifecycle-policy change. It changes when complete archive may proceed and how main spends model/tool effort, but it does not authorize commit, push, remote calls, installation, activation, or mutation of another repository.

### Fidelity And Proof Envelope

The current rung is repository source, current normative specs, archived ceremony rationale, active global-source identity, and the existing consumer proof/evaluator contracts. The first real boundary is provider-free invocation of the new CLI help and snapshot against disposable Git repositories with exact clean, mixed, conflict, detached, upstream, truncation, and failure states. The next boundary is the portable propose/apply/archive gate over disposable OpenSpec changes. The final behavior boundary is matched baseline/candidate disposable installed OpenCode workflows using the existing consumer regression runner, the same configured model/profile and reviewed scenarios, and one OpenSpec-backed scenario that requires candidate inspection.

Repository edits, disposable Git/OpenSpec/config/session state, and the minimum non-sensitive configured-model calls already authorized for bounded kit comparison are permitted. Baseline/candidate captures remain separately bounded by the reviewed consumer manifest. No provider call is used for CLI, gate, evaluator, replay, help, strict validation, or focused tests. No machine-local install/activation, credential access, consumer repository mutation, commit, push, fetch, remote operation, or owner-process termination is included. Every disposable process, session, worktree, and fixture is attributable and removed; immutable evidence preserves source/candidate/environment identities, exact redacted invocations, exits/stdout/stderr, output manifests, friction vectors, and cleanup.

## Goals / Non-Goals

**Goals:**

- Replace the recurring Git status/diff/history orchestration with one bounded portable factual snapshot.
- Turn one already-observed repeated deterministic sequence into accepted current scope for eligible changes without reopening broad retrospective ceremony.
- Reuse current task, evidence-index, operation-gate, validation, and consumer-evaluation owners.
- Prove fewer tool calls only after equivalent outcome, safety, diagnostics, validation, and cleanup.
- Keep the loaded instruction delta compact, canonical, and synchronized across maintained entrypoints.

**Non-Goals:**

- Transcript mining, automatic workflow discovery, semantic automation ranking, or model-output scoring.
- A generic task runner, shell recorder, Git porcelain replacement, plugin tool registry, workflow database, or new evidence ledger.
- A new script for every change, automatic automation candidates for Ordinary Small work, or retroactive archive repair.
- Full code-review automation, unbounded patch output, untracked content capture, remote Git state, submodule orchestration, or non-Git repository support.

## Decisions

### Decision 1: Declare the dividend in the proposal, not at final handoff

Add one exact proposal field: `- **Automation Dividend**: required - <candidate>` or `exempt - <reason>`. Loaded propose guidance requires `required` for Material changes and allows a concrete Ordinary Small exemption. The semantic author owns profile, recurrence, candidate, and exemption decisions; deterministic code validates only the two accepted modes, non-empty reviewed text, and later task/evidence correlation.

The declaration is a mutable implementation control. Main may replace its candidate when current evidence identifies a better repeated sequence without changing accepted product semantics or crossing a protected boundary. A required change carries one automation task from planning into apply rather than discovering process work after product completion.

Alternative rejected: reinstate a final retrospective. It would again read historical session material, create scope after the accepted outcome, and delay completion regardless of observed recurrence. Alternative rejected: require a helper from every change. That would turn clear Ordinary Small work into automation ceremony and incentivize scripts with no repeat consumer.

### Decision 2: Reuse tasks and the evidence index instead of adding a dividend ledger

Represent the selected work as exactly one checklist item containing the stable token `[automation-dividend]`. Its task text names the recurrence source, disposition, first consumer, observable result, and focused proof. The existing evidence index records task digest, candidate/environment, helper identity, invocation, operation facts, effects, artifacts, and cleanup. The archive gate correlates those existing owners.

The operation gate never compares prose for semantic equivalence. It checks the declaration mode, required task cardinality, checkbox, task digest, candidate/helper/environment identities, evidence result, and required fields. Apply and archive report unsupported or stale evidence as incomplete. Product tasks and their evidence remain independent.

Alternative rejected: add `automation-dividend.json`. It would duplicate task and evidence-index ownership and recreate a mandatory mini-ledger. Alternative rejected: detect automation from git diff or tool-count measurements. Neither source can decide whether two sequences have the same intent or whether a helper is the right product choice.

### Decision 3: Add one portable Git snapshot CLI, not a plugin or project-inventory mode

Add a cohesive TypeScript CLI under `global/bin/` that accepts an explicit repository root and uses `runPortableCommand` with argv arrays and `shell: false`. Keep CLI parsing, factual Git collection, normalization, bounds, and rendering in one owner unless implementation evidence shows a cohesive split is needed. Export the factual runner for focused fixtures while preserving one actual CLI entrypoint with effect-free `--help` and `-h`.

Do not add a custom OpenCode plugin tool. A plugin would add loaded registration, permission, lifecycle, and compatibility ownership merely to wrap local Git processes. Do not extend `project:inventory`; it owns structural bootstrap context, not a point-in-time candidate review. The global-source CLI is independently invocable in target projects, and repository-local package scripts may be thin maintainer adapters only.

This is `build-minimal` after verified non-fit of the existing project inventory, OpenSpec inventory, operation gate, session-delivery context, and focused-test runner. It reuses the platform Git CLI and portable-process owner and adds no dependency. Cross-project discovery is `not-applicable`: the behavior must ship from the active kit global source, and the selected current repository/platform owners have been inspected.

### Decision 4: Emit one stable bounded factual schema

Version the snapshot output as schema 1. Normalize one result containing:

- repository-relative root identity plus HEAD, branch/detached state, upstream presence, and ahead/behind counts;
- ordinally sorted staged, unstaged, untracked, and conflict path records parsed from NUL-delimited porcelain output;
- staged and unstaged diff stats and internal Git patch output with external diff/text conversion disabled;
- a bounded recent first-parent-neutral commit list containing object id, parent ids, author timestamp, and subject;
- command status and truncation metadata sufficient to distinguish complete review content from inventory-only output.

Default combined patch output is capped at 131072 bytes. The caller can lower the cap or request summary-only output; it cannot raise the maintained hard ceiling in this increment. Truncation records the affected section and omitted bytes. Untracked contents, ignored paths, absolute home paths, reflogs, hooks, remotes, credentials, and environment values are not emitted. Git failures retain the failing operation, exit status, and bounded stderr without falling back to initialization, parent traversal, fetch, or another repository.

Alternative rejected: print complete patches without a ceiling. One aggregated tool call could consume more context than the manual sequence and expose unrelated content. Alternative rejected: omit all patches. That would save status calls but still require the routine diff call the accepted first automation is intended to remove.

### Decision 5: Integrate one explicit dividend check into existing operation paths

Extend the current proposal capsule contract and stable task/evidence parsers rather than adding another gate executable. Propose requires one valid declaration. Apply requires exactly one tagged task for a required declaration once tasks exist and no tagged task for an exempt declaration. Complete archive additionally requires the task checked and its evidence-index row current and green. Existing required-artifact, unchecked-task, ownership, proof, and validation checks continue unchanged.

The canonical global propose/apply/archive skills and commands receive the same compact routing delta and continue resolving the portable gate from the verified active global source. Generated or project-local mirrors remain synchronized through the current workflow-contract validator. Optional observations still route to `complain` or a separate change and never become additional dividend tasks.

Alternative rejected: make the check advisory. A required declaration would then be indistinguishable from optional guidance at the exact complete-archive boundary. Alternative rejected: block archive on a model-written quality score. Deterministic checks can prove identity and execution facts but cannot score usefulness or intent.

### Decision 6: Place automation before its first current consumer

Planning names the initial dividend and a dependency-valid first consumer. Apply records attributable recurrence, performs remove/reuse/extend/build-minimal discovery, implements the smallest selected owner, runs its real entrypoint, and then uses it in that consumer. If recurrence evidence invalidates the candidate, main updates proposal/design/tasks/history coherently and selects another current candidate without asking for process approval.

For this change, the first consumer is its own candidate inspection and operation-gate/final validation flow. The snapshot must therefore be working before loaded instruction and archive behavior are qualified. This demonstrates current reuse instead of shipping a helper that only future changes might invoke.

Alternative rejected: implement the dividend after every product task. That recreates final cleanup and cannot show that the current workflow benefited. Alternative rejected: interrupt at the first speculative idea. The trigger is reviewed repeated evidence, not one inconvenience.

### Decision 7: Reuse matched consumer outcome evidence for the improvement claim

Keep the existing two-scenario consumer manifest. Update the OpenSpec-backed scenario and fixture only as needed to require one routine candidate-state inspection at the same checkpoint in both arms. Capture three matched baseline/candidate samples under identical source-independent fields. Use an explicit candidate request with expectation `improvement`; the existing evaluator first requires exact outcome/safety/validation/proof/diagnostic/cleanup equivalence and then requires Pareto non-regression plus at least one strict median total-tool-call reduction.

Provider-free Git fixtures independently compare every schema fact with direct Git observations and prove side-effect absence. The repeated-use CLI help oracle and context budget remain supporting controls. Structural instruction markers, elapsed time, and token estimates do not establish the improvement claim.

Alternative rejected: count this implementation session's calls. Its repository state, exploration, and one-time authoring work are not comparable to a repeat consumer workflow. Alternative rejected: add a second evaluator. The current consumer-outcome capability already owns exact friction vectors and replay.

### Decision 8: Keep loaded policy compact and reconcile active owners before mutation

Put the detailed dividend behavior in the new spec and one on-demand OpenSpec workflow owner. Global startup authority receives only the routing minimum: use deterministic helpers for repeated factual sequences, select one dividend when the active proposal requires it, and preserve proportional exemptions. Do not copy the full schema or gate procedure into `global/AGENTS.md`, role agents, templates, and commands. Existing instruction inventory and startup/discovery/on-demand budgets must not regress.

Before implementation edits any overlapping active owner, inspect current status, ownership metadata, active change histories, and attributable diffs. Proceed serially only after every overlapping mutation-capable attempt is terminal or its write authority is isolated and its final bytes are integrated. Planning and non-overlapping fixtures may proceed earlier; no task may freeze, prove, or qualify a candidate while an overlapping writer remains open.

## Failure Boundaries And Diagnostics

- **Git identity or parsing**: report the explicit root, factual operation class, Git exit status, and bounded original stderr; never initialize, search parent repositories, or guess missing state.
- **Patch bound**: report complete versus truncated per section and omitted byte counts; truncation never passes a complete-review oracle.
- **Declaration**: report missing, duplicate, invalid mode, or empty reason/candidate at the proposal-relative path; never infer the intended mode.
- **Task/evidence correlation**: report tag cardinality, task id/digest, helper/candidate/environment mismatch, evidence result, and missing field without reading broad raw evidence by default.
- **Matched comparison**: preserve exact differing environment or hard-oracle field and stop before friction credit; evaluator-only failures replay preserved bundles without another configured-provider capture.
- **Overlap**: report the active owner, path, attempt identity/liveness, and safe next non-overlapping route; never overwrite or restore another change's bytes.

## Risks / Trade-offs

- **[Risk] The dividend becomes renamed retrospective ceremony** -> declare it at proposal time, cap it at one current repeated sequence, require a current consumer, exempt proportional Ordinary Small work, and forbid transcript-wide final analysis.
- **[Risk] Agents create low-value wrapper scripts** -> enforce remove/reuse/extend/build-minimal order, exact recurrence evidence, current consumer proof, and one-owner discovery; validators check structure but make no value claim.
- **[Risk] Snapshot output consumes more context than separate calls** -> compact schema, stable sorting, summary-only mode, hard patch ceiling, explicit truncation, and matched total-tool-call/no-regression evidence.
- **[Risk] Aggregated diff exposes sensitive changed content** -> retain local ephemeral behavior, omit untracked contents and absolute paths, cap patches, never persist output automatically, and keep the existing stop-on-secret handling at the agent boundary.
- **[Risk] Git configuration executes code** -> use shell-free argv, internal diff, disabled external diff/text conversion, no hooks, no fetch, and disposable malicious-config fixtures.
- **[Risk] Gate blocks valid legacy or Ordinary Small changes** -> require an explicit declaration only for newly proposed/currently migrated changes, preserve concrete exemption, do not rewrite archives, and prove disposable exempt archive behavior.
- **[Risk] Loaded text increases context or reduces model adherence** -> one canonical compact delta, instruction-budget gates, and matched baseline/candidate consumer proof before retention.
- **[Risk] Active changes overlap the same workflow owners** -> serialize implementation, integrate current bytes, and invalidate only evidence dependent on later overlapping mutation.

## Migration Plan

1. Reconcile active ownership and source identities for instruction, gate, archive, evidence, validator, proof, package, and main-spec paths. Preserve the current final bytes and establish a matched consumer baseline before candidate instruction mutation.
2. Add provider-free disposable Git fixtures and the smallest snapshot CLI using the portable-process owner. Run help and all declared Git states through the actual global-source entrypoint and inspect output/effects/cleanup.
3. Extend proposal/task/evidence contracts and focused operation-gate/archive fixtures. Prove required missing/stale failure, current required success, and explicit Ordinary Small exemption without invoking official archive against any real active change.
4. Update the canonical loaded workflow owner and synchronized propose/apply/archive surfaces, validators, templates, inventories, and operator docs with the compact routing delta. Keep context budgets green.
5. Use the snapshot in this change's own candidate inspection and record the `[automation-dividend]` task evidence through the existing evidence index.
6. Run the maintained consumer baseline/candidate capture with an explicit improvement request, then provider-free replay/evaluation. Correct any hard-oracle or friction regression before another governed capture.
7. Run focused tests, workflow-contract consistency, instruction inventory/budget, complete repository tests, strict library validation, selected strict OpenSpec validation, and all OpenSpec validation on one current candidate. Produce a local development handoff only; do not install or activate the changed global source.

Rollback restores the prior version-controlled CLI, contracts, instructions, mirrors, validators, fixtures, docs, and spec behavior as one correlated candidate. It does not delete immutable comparison evidence, alter archived changes, restore another active change's files, or mutate the machine-local installed source. Since this increment performs no activation, no process restart or host rollback is required.
