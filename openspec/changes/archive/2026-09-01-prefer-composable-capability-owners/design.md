## Context

See `proposal.md` for motivation and `CCO-001` for the finite installed-behavior claim. The current kit already has the necessary owners and most of the required policy:

- `global/principles-of-work.md` owns single responsibility, cohesion, AHA/Rule of Three, and evidence-backed seams.
- `global/AGENTS.md` names the current owner, defaults same-responsibility work to `extend`, routes new mechanisms to `reuse-discovery`, and requires extraction or `split-or-justify` when a change adds responsibility to mixed code.
- `library-reuse-discovery` verifies current-repository, platform/dependency, configured cross-project, and bounded ecosystem candidates without a registry.
- `architecture-and-change-locality` already owns supported responsibility and change-axis observations, while `simplicity-and-reuse` owns duplicate or same-versus-new decisions.
- `add-leaf-first-task-decomposition` owns task execution and evidence order, not source module shape.
- `tools/proofs/reuse-discovery.ts` and `tools/proofs/agent-tooling-ergonomics.ts --pack change-locality` provide the closest installed behavior and evidence mechanisms.

The remaining gap is a bridge between known-owner `extend` and physical implementation shape. The current wording prevents duplicate siblings but does not require main to recognize a current independently testable capability inside the semantic owner. That omission permits one owner to remain one expanding file even when a smaller directly provable component would improve current comprehension and diagnosis.

### Fidelity And Authorization

The current rung is reviewed planning against current canonical instructions, specs, archived change-locality/reuse decisions, and proof inventories. After exact ownership transfer, the next real boundary is provider-free evaluation of the reviewed `CCO-001` scenario population and its red controls, followed by matched installed authoring and reuse decisions in disposable repositories.

Later configured runs use the existing bounded synthetic-provider authority, isolated disposable roots, exact source/model/profile/permission identity, no consumer-project mutation, no public network or dependency installation for fixture decisions, and terminal process/session/root cleanup. The current-run evaluator inspects the exact invocation, exit status, stdout/stderr, relevant events and exceptions, changed-file manifests, direct and parent observations, and cleanup before temporary output is removed. After a failed configured run, inspect those diagnostics and require a causal mechanism change or the exact missing observation before an equivalent attempt; process attempt controls remain revisable and do not authorize provider, install, activation, publication, or remote effects.

## Goals / Non-Goals

**Goals:**

- Make semantic ownership and physical module shape explicitly different decisions.
- Give main one proportional composition ladder that prefers verified reuse and earns extraction through current direct proof value.
- Keep one semantic owner for state, lifecycle, integration, and public behavior while allowing private capability modules.
- Require direct capability proof where truthful without weakening parent integration proof.
- Reuse current principles, Practice Owners, skills, role contracts, validators, and proof runners.
- Preserve direct cohesive implementation and Rule of Three negative controls.

**Non-Goals:**

- A universal module taxonomy, package layout, architecture score, line threshold, or one-task/one-module rule.
- A capability registry, generated cross-project inventory, new skill, new agent, new Practice Owner, or autonomous architecture decision.
- Refactoring any consumer repository as part of this change.
- Installing, benchmarking, publishing, or standardizing public dependencies.
- Treating component tests as integration, compatibility, or portability proof.

## Decisions

### 1. Extend existing philosophy, reuse, and Material owners

The complete principle remains in `global/principles-of-work.md`; loaded main receives one compact operational application by consolidating the existing outcome-first simplicity and architecture wording rather than appending another policy block. `reuse-discovery` owns source search and total-cost selection. Change-Ready owns component-versus-parent evidence topology. Production roles receive only a boundary-preservation delta through their existing briefs.

No new skill or Practice Owner is added. Same-responsibility and duplicate questions stay with `simplicity-and-reuse`; supported responsibility or change-axis questions stay with `architecture-and-change-locality`; main keeps the concrete implementation-shape and integration decision.

Alternative rejected: add a `capability-composition` skill or reviewer. It would create another routing decision for behavior already covered by always-loaded authority and current owners. Alternative rejected: put the rule only in `reuse-discovery`; known-owner `extend` deliberately keeps that skill unloaded.

### 2. Define semantic owner and physical capability separately

A semantic owner owns accepted behavior, mutable state, lifecycle, policy, integration, and any public contract. A physical capability is a private cohesive implementation unit with a narrow current contract, directly exercisable oracle, and bounded diagnostics/effects. One semantic owner may compose several physical capabilities without creating competing behavior owners.

Extraction remains `extend` when the current owner delegates to the private capability or removes the old implementation and no second lifecycle, state, or public contract appears. A copied sibling beside an unchanged path remains duplicate ownership and is forbidden. A forwarding-only file with no independent behavior or oracle is fragmentation, not a capability.

Alternative rejected: preserve one file because there is one semantic owner. File cardinality does not establish ownership. Alternative rejected: make every function a module. Functions without a current independent contract and oracle gain no proof or locality value from physical separation.

### 3. Use one proportional composition ladder

Before extending human-written behavior, main applies this order:

1. Remove the capability or narrow users, data, interfaces, effects, and ownership when the accepted outcome permits it.
2. Reuse a source-verified current-repository or platform/dependency capability when it fits.
3. Use bounded configured cross-project and public-ecosystem discovery only when the existing reuse trigger applies.
4. Directly reshape the current owner when the case is cohesive and has no truthful lower oracle.
5. Extract or build one private owner-local capability only when current evidence supplies a bounded contract, direct oracle, and lower total implementation/proof/context cost.
6. Compose through the semantic owner and prove the parent separately.

Alternative rejected: always extract before adding a branch. That violates AHA and creates wrapper soup. Alternative rejected: always append same-responsibility behavior to the current file. That confuses semantic authority with physical locality and preserves the reported monolith failure mode.

### 4. Treat established adoption as evidence, not policy

For common capabilities, `reuse-discovery` continues through bounded ecosystem research when applicable and authorized. Maintenance, adoption, provenance, license/security evidence, upgrade ownership, adaptation/runtime cost, and proof cost inform the total-cost decision. An established verified fit is preferred over local reinvention; popularity cannot override a contract, safety, license, or lifecycle mismatch.

Configured proof uses reviewed local candidate metadata and source fixtures rather than installing packages or depending on live popularity services. It proves the decision rule only for the maintained scenarios.

Alternative rejected: require the most popular package. Popularity is a proxy and can select an incompatible or abandoned mechanism. Alternative rejected: forbid ecosystem dependencies to preserve local control. That would knowingly rebuild mature capabilities even when evidence shows lower lifecycle cost.

### 5. Keep task leaves and capability modules orthogonal

Leaf-first answers which independently failing prerequisite is executed and proved before its parent. Capability composition answers how accepted behavior is physically owned and directly tested. A leaf may invoke several existing capabilities; one capability may support several leaves; an inseparable integration leaf may require no extraction.

The changes compose through the shared rule that direct component success never proves parent integration. No task schema, file field, parent-module mapping, or deterministic semantic inference is introduced.

Alternative rejected: fold this change into `add-leaf-first-task-decomposition`. That would mix execution-DAG behavior with source ownership and invalidate the active change's distinct scenario population. Alternative rejected: derive files from task ids. Task structure is mutable process control, not architecture authority.

### 6. Reuse two existing proof families without adding a runner

Extend `tools/proofs/agent-tooling-ergonomics.ts` with a reviewed capability-composition scenario pack or the smallest equivalent extension of its current change-locality data owner. It already supports disposable authoring, source/test/runtime observations, changed-file manifests, configured current-run evaluation, and cleanup. The new pack covers private extraction, cohesive direct behavior, wrapper/duplicate controls, delegation, leaf/module independence, and component-versus-parent proof.

Extend `tools/proofs/reuse-discovery.ts` only for the decision rows that need reuse-skill loading and established-candidate selection. Keep its no-product-mutation permission envelope. Shared capture/evaluation mechanics remain in their current owners; reviewed semantic expected outcomes remain seed data outside helper logic.

Deterministic contracts may verify exact markers, scenario ids, schemas, ordering, and explicit facts. They may not infer responsibility, rank candidates, score modularity, or conclude that component proof establishes integration.

Alternative rejected: add a third proof runner. Existing authoring and reuse runners already own the two required permission/effect envelopes. Alternative rejected: force every row through one runner; authoring source shape and read-only reuse discovery require materially different permissions and observations.

### 7. Acquire owners only after leaf-first archives

`add-outcome-preserving-delivery-checkpoints` and `add-leaf-first-task-decomposition` own direct overlapping loaded-main, Change-Ready, production-planning, exact-marker, and installed-proof roots in the required sequence. This change remains planning-only and mutation-disabled until both changes archive in sequence, every mutation-capable writer is terminal, current canonical source/spec/proof identities are reread, and both explicit direct ownership transfers yield one conflict-free candidate.

Alternative rejected: implement non-overlapping fragments early. The installed claim needs one readable candidate whose semantic-owner, leaf, proof, and role wording agree. Alternative rejected: expand leaf-first now; its accepted outcome and evidence population do not include physical capability composition.

## Failure Boundaries And Diagnostics

- Owner classification: preserve the named semantic owner, candidate capability boundary, direct oracle, current consumers, and uncertainty; unsupported extraction remains direct or `unknown`, not forced.
- Reuse selection: preserve reached and blocked sources, selected source identity, contract/effect/constraint evidence, license/security evidence when applicable, and total-cost reason without a search transcript or private paths.
- Authoring behavior: preserve exact prompt, source/model/profile/permission identity, tool events, file manifest/diff, direct capability invocation, parent invocation, exits, stdout/stderr, exceptions, effects, and cleanup.
- Evidence separation: preserve distinct component and parent refs; a missing parent observation remains incomplete rather than inferred from green component validation.
- Ownership transfer: preserve predecessor archive identity, terminal writer evidence, current source hashes, exact write roots, and conflict-free readback before any production mutation.

## Risks / Trade-offs

- **[Main over-extracts cohesive work]** -> Keep current contract/oracle/value triggers and direct/wrapper negative controls.
- **[Main keeps a monolith because responsibility is unchanged]** -> Explicitly state that private extraction can remain `extend` and prove one same-owner extraction scenario.
- **[Extraction creates duplicate state or lifecycle]** -> Require one semantic owner, delegation/removal of the old path, and no second public/state/lifecycle authority.
- **[A popular package is selected by proxy]** -> Require contract, provenance, maintenance, license/security, adaptation, upgrade, and proof evidence; include a popular-mismatch control.
- **[Component proof becomes proof substitution]** -> Keep Change-Ready invalidation and distinct parent integration oracles.
- **[Always-loaded context grows]** -> Consolidate existing simplicity/architecture text and run context-quality plus exact-duplicate checks.
- **[Two proof families duplicate policy]** -> Keep semantic seed ownership explicit and split only by existing permission/effect boundaries.
- **[Active owner overlap creates a mixed candidate]** -> Keep mutation disabled until leaf-first archive, terminal writers, identity reread, and explicit transfer.

## Migration Plan

1. Wait for `add-leaf-first-task-decomposition` to archive with terminal writer closure, then reread current specs, loaded source, role surfaces, contract markers, proof inventories, and active runtime identity.
2. Materialize reviewed `CCO-001` scenario/evidence controls and acquire exact conflict-free ownership before production mutation.
3. Capture matched unchanged-source baselines for the approved authoring and reuse scenario rows.
4. Consolidate the canonical principle and loaded main wording, then apply only required reuse, Change-Ready, and production-role deltas.
5. Extend existing proof data/adapters and deterministic contracts, run provider-free preflight/red controls, and capture matched installed candidate behavior.
6. Replay/evaluate the finite population, complete the focused regression disposition and evidence-sufficiency challenge, and run complete repository/OpenSpec validation.
7. Hand off source changes without install, activation, restart, commit, push, release, or deployment.

Rollback removes only this candidate's instruction, role, contract, fixture, and proof-adapter deltas and restores the coherent prior loaded candidate. Disposable projects and sessions are deleted; immutable baseline and failed-attempt evidence remain. No consumer data or schema migration exists.

## Open Questions

None. Exact marker wording, fixture languages, and whether the existing authoring runner uses a new pack id or extends its current change-locality seed are implementation details constrained by current ownership inspection and the reviewed scenario population.
