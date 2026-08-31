## Context

See `proposal.md` for motivation and `LFTD-001` for the finite installed-behavior claim. Current owners already provide most of the required mechanics:

- `deep-task-planning` and Change-Ready require behavior dependency chains, fidelity rungs, the earliest real boundary, and a dependency-chain stop condition, but do not define when a task remains compound.
- OpenSpec propose/apply require the smallest dependency-valid slice and permit autonomous task correction, but do not require a coarse parent to be replaced by evidence-bearing prerequisites.
- The grind frontier already stores bounded work items with `dependsOn`, statuses, gates, requirement refs, and evidence refs, validates acyclicity, and derives runnable items from explicit dependencies. It deliberately does not infer semantic task structure.
- `add-outcome-preserving-delivery-checkpoints` owns reactive route reconsideration after evidence establishes delivery drag. This change owns proactive task shape and recursive hidden-prerequisite correction before another parent attempt.

The missing behavior is therefore semantic orchestration and planning composition, not a data-structure or scheduler gap. The change extends existing owners and their proof families rather than introducing a planning service, hierarchy schema, agent, or persistent task tree.

## Goals / Non-Goals

**Goals:**

- Define one compact project-neutral test for compound work and one evidence-bearing leaf contract.
- Require leaf proof before parent integration and distinct parent proof after the leaves pass.
- Recursively isolate a newly observed independent prerequisite while leaving same-leaf local correction direct.
- Preserve proportionality for cohesive Ordinary Small and grouped mechanical work.
- Reuse OpenSpec tasks and the existing grind frontier dependency DAG.
- Compose without overlap or duplicate reflection with delivery checkpoints, blocker diagnosis, and compaction.
- Prove behavior in unrelated ordinary, OpenSpec, and grind roots.

**Non-Goals:**

- A general-purpose hierarchical planner, optimizer, critical-path engine, task database, UI, or background scheduler.
- Deterministic inference of task meaning, dependency edges, semantic granularity, or completion from prose.
- Numeric task-size, duration, file-count, unknown-count, or decomposition-depth thresholds.
- Automatic decomposition of consumer-project backlogs or implementation of their product work.
- Replacing existing outcome, proof, safety, substitution, live-attempt, writer-liveness, or owner-decision contracts.

## Decisions

### 1. Extend existing planning and execution owners

Add the compact activation and proportional control to loaded main. Put planning detail in `deep-task-planning`, OpenSpec task authoring in propose, evidence-driven recursive correction in apply, Material deltas in Change-Ready, and grind projection in the existing frontier/arbiter contract. The new capability spec is the single detailed semantic owner.

Reuse disposition: `extend`. Current repository evidence shows complete owners for task authoring, task mutation, dependency execution, proof, compaction, and frontier readiness. A new skill or agent would add a routing decision and duplicate main's outcome/dependency authority without stronger enforcement. Cross-project discovery is `not-applicable` because the requested target is the configured kit's universal workflow and no external implementation dependency is selected.

Alternative rejected: place the complete procedure only in `deep-task-planning`. That skill is conditional and would not govern direct non-plan work, OpenSpec apply correction, or grind continuation. Alternative rejected: add a decomposition reviewer. Granularity is an execution decision owned by main; a mandatory model call would increase latency and split authority.

### 2. Classify compound work from independent failure and proof boundaries

Main treats a task as compound when current evidence shows multiple required sub-results that can fail, be falsified, or be corrected independently, or distinct owners, effect boundaries, oracles, or cleanup envelopes before one parent action. A leaf has one bounded result, one owning mechanism or effect boundary, one earliest sufficient oracle, one local failure/diagnostic envelope, and applicable cleanup.

The criterion is semantic and evidence-based. Deterministic helpers may validate explicit fields and dependency structure but may not score task size or derive decomposition from prose. This permits project-neutral use across compilation, UI, network, hardware, migration, model, and proof tasks without Goodhart pressure.

Alternative rejected: split on every conjunction, file, tool call, unknown, or elapsed-time threshold. Those proxies over-split cohesive work and still miss hidden domain boundaries. Alternative rejected: require one atomic command per leaf. A useful leaf can need setup and cleanup while still owning one result and oracle.

### 3. Represent execution as a flat dependency DAG

OpenSpec tasks retain their normal hierarchy for readability. The parent integration task declares dependencies on its leaves. Grind projects the same state as ordinary items and `dependsOn` edges. Stable refs, status, gates, requirement refs, and evidence refs remain sufficient; no `parentId`, tree depth, method node, or OR-edge is added to the frontier schema.

The flat DAG is intentional. Parent/child is an execution relation, not a second persisted ontology. Alternatives are selected by main through existing outcome-preserving planning updates; deterministic code validates only the chosen acyclic graph.

Alternative rejected: add a hierarchical task-network schema to the plugin. It would require semantic node types, alternative-method state, migrations, and new reconciliation authority while the existing dependency DAG already enforces the required ordering.

### 4. Use one recursive correction protocol

Before a dependent costly or integration action, main asks whether current evidence exposes multiple independently falsifiable required prerequisites. If yes, it writes or updates the smallest child set and makes the parent depend on them. It then selects one dependency-valid leaf at the earliest real boundary.

When a leaf fails, main classifies the observed condition:

1. `same-leaf-local`: the cause and correction stay inside the leaf's owner/boundary; use ordinary run-observe-correct with no task split.
2. `independent-prerequisite`: the condition has a distinct owner/boundary/oracle; create the smallest child and make the affected work depend on it.
3. `parent-integration`: all prerequisites remain current and the defect exists only at composition; retain one integration leaf under the parent boundary.
4. `existing-gate`: preserve the exact product, protected-action, capability, live-attempt, writer-liveness, or safety gate without disguising it as task structure.

The classification and current evidence are preserved in normal task/history/frontier owners only where continuity requires them. Ordinary roots create no repository artifact solely for decomposition.

Alternative rejected: split every failed attempt. A directly actionable local failure is faster and clearer inside one leaf. Alternative rejected: keep every hidden prerequisite as a note under the coarse task. That does not prevent another parent attempt or give the prerequisite its own oracle.

### 5. Keep leaf and parent evidence distinct

Each leaf records the invocation or action, candidate/environment identity where applicable, boundary, observation, result, diagnostics, effects, cleanup, and focused validation. A parent remains unchecked until all required children are current and its separate integration oracle passes. Mutations invalidate only dependent evidence under existing Change-Ready rules.

This prevents component success from silently proving integration and prevents a passing sibling from clearing a blocked lane. It also allows an integration-only defect to be corrected without reopening unrelated leaves unless the correction changes their dependencies or candidate identity.

Alternative rejected: mark the parent complete when all children pass. That would make decomposition a proof substitution and erase the composition boundary the user ultimately cares about.

### 6. Preserve proportionality and owner authority

Main does not split cohesive Ordinary Small work, same-owner mechanical mirrors with one oracle, or behavior observable only at one inseparable integration boundary. It does not introduce optional polish, refactoring, style, or hypothetical future variants into the accepted tree. No numeric minimum or maximum depth exists.

Task structure, order, retries, and artifact updates remain autonomous process controls. Product semantics, proof population or oracle changes, protected actions, and material risk acceptance retain existing owner authority. Decomposition never clears a scoped gate or supplies authorization.

Alternative rejected: require the user to approve every new child. Hidden prerequisites are ordinary dependency closure when accepted semantics remain unchanged. Alternative rejected: automatically accept a weaker component proof when integration is unavailable. That changes the claim and remains an owner/proof-scope boundary.

### 7. Compose with delivery checkpoints and compaction

Proactive decomposition runs before the first dependent parent action when compoundness is already evidenced. Delivery checkpoints remain reactive owners for repeated late-boundary or dominant-cost drag. If a checkpoint selects decomposition as its new route, main performs one task/frontier correction under the checkpoint suppression identity and creates no duplicate reflection or strategy record.

Compaction carries only unresolved execution facts: current leaf, blocked parent, dependency and gate refs, next oracle, and evidence refs. It does not preserve an entire conceptual tree or repeat decomposition analysis.

Alternative rejected: make every decomposition a delivery checkpoint. That would turn ordinary planning into repeated reflection ceremony and distort the checkpoint trigger. Alternative rejected: copy the complete tree into compaction, which would increase context and create another state owner.

### 8. Prove behavior with one reviewed scenario pack

Extend the current instruction/consumer-outcome and completion-frontier proof families with reviewed seed data outside helper code. Positive rows cover proactive compound decomposition, recursive independent prerequisite discovery, parent suppression, integration-only failure, OpenSpec task correction, and grind projection. Negative rows cover cohesive Ordinary Small, grouped mechanical edits, one same-leaf local failure, inseparable integration, and a proposed split that weakens proof.

The first real boundary is a configured disposable ordinary root receiving one compound local scenario where two prerequisites have separate observable markers. Candidate behavior must prove each marker before the parent marker and avoid a process question. The next boundary is a disposable OpenSpec root where a hidden prerequisite updates only the required task/dependency controls. The grind boundary then observes exact child/parent/sibling runnable refs through the existing frontier schema.

Provider-free evaluators verify explicit fields, event order, refs, task/file effects, parent suppression, population preservation, and cleanup. Installed same-model scenarios judge semantic classification. No consumer-project protected effect occurs.

### 9. Acquire overlapping owners after the active predecessor archives

`add-outcome-preserving-delivery-checkpoints` currently mutation-owns loaded main, OpenSpec apply, completion arbiter/frontier proofs, and the consumer-outcome proof family. This change remains planning-only for those roots until the predecessor archives, every writer is terminal, current canonical specs and source are reread, and an explicit ownership transfer enables one mutation owner.

Non-overlapping planning surfaces such as propose and `deep-task-planning` are not implemented early because the installed behavior claim requires one coherent candidate across all owners. The ownership manifest names the predecessor dependency and keeps `mutationEnabled=false` until transfer.

Alternative rejected: expand the nearly complete predecessor change. Proactive leaf formation has a distinct trigger, contract, negative population, and proof claim from reactive delivery checkpoints. Alternative rejected: implement non-overlapping fragments before transfer, which would create a mixed loaded candidate and invalidate baseline/candidate attribution.

## Failure Boundaries And Diagnostics

- Compound classification: preserve the required parent, candidate leaves, independent failure/proof boundaries, current evidence, and uncertainty; unsupported decomposition remains `unknown` rather than forced splitting.
- Leaf execution: preserve exact boundary, invocation or action, observation, status, diagnostics, effects, and cleanup; failure leaves the leaf and parent incomplete.
- Recursive correction: preserve prior task/frontier refs, classification, new child, dependency delta, invalidated evidence cone, and next oracle without private transcript content.
- OpenSpec continuity: preserve exact changed artifact paths and history refs; a local same-leaf correction creates no planning churn.
- Grind projection: preserve frontier generation, child/parent/gate refs, controller-derived runnable refs, and any rejected parent selection.
- Configured proof: preserve candidate/environment/model identities, exact fixtures, calls, events, file effects, cleanup, and privacy-safe raw bundle paths.

## Risks / Trade-offs

- **[Main over-decomposes cohesive work]** -> Require independent failure/proof boundaries and retain direct and mechanical-grouping controls.
- **[Main leaves a broad task compound]** -> Test proactive and mid-execution hidden-prerequisite scenarios and reject parent execution before required child closure.
- **[Child evidence leaks into parent completion]** -> Require distinct parent oracle/evidence and completion-arbiter negative controls.
- **[Recursive splitting becomes planning churn]** -> Split only independent prerequisites; keep same-leaf local correction direct and compaction state compact.
- **[A product decision is hidden as a child]** -> Preserve existing product/protected gate classification and test a tempting semantics-changing split.
- **[Delivery checkpoint ownership is duplicated]** -> Give proactive task shape and reactive route reconsideration separate triggers and share one suppression identity when they compose.
- **[Instruction-only ordinary behavior is inconsistent]** -> Use finite matched installed scenarios and keep the claim limited to the reviewed population.
- **[Active owner overlap creates mixed evidence]** -> Keep implementation mutation disabled until predecessor archive, terminal writer closure, ownership transfer, and one readable candidate.

## Migration Plan

1. Wait for `add-outcome-preserving-delivery-checkpoints` to archive and prove terminal writer closure, then reread current canonical specs, source, proof owners, and runtime identities.
2. Transfer exact overlapping owners and update this change's ownership manifest to one mutation-enabled candidate.
3. Materialize the reviewed provider-free `LFTD-001` positive and negative scenario population in existing proof families.
4. Update loaded main, planning, OpenSpec, Change-Ready, compaction, and arbiter wording through their current owners without changing the frontier schema.
5. Run provider-free contracts, then configured ordinary, OpenSpec, and grind scenarios in unrelated disposable roots.
6. Complete the finite claim population, focused regression decision, evidence-sufficiency challenge, and project validation.
7. Hand off source changes without installing, activating, committing, pushing, releasing, or deploying.

Rollback restores the coherent prior loaded-main/planning/OpenSpec/arbiter candidate and reruns affected installed scenarios. No persisted product data or frontier migration is introduced; existing task and frontier records remain readable because the schema is unchanged.

## Open Questions

None. Exact marker wording, fixture technologies, and task-id formatting are implementation details constrained by the reviewed scenario population and current owner schemas.
