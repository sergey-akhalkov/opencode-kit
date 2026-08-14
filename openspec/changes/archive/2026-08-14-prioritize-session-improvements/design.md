## Context

The current workflow has two useful guarantees: compaction preserves every admitted improvement, and complete archive waits until persisted improvement tasks are complete. It lacks a canonical distinction between persistence and execution timing. A task can therefore be appended at the end of `tasks.md` even when its value depends on running before an earlier remaining consumer, and a same-repository reusable improvement can look no more important than a one-off change.

The change affects loaded lifecycle instructions and the hidden compaction prompt, so it is Material. The current real boundary is the installed `opencode run --agent compaction` entry point with configured non-sensitive inference and no tools or mutation. The next boundary is an identical candidate run after a new process loads the edited active config.

## Goals / Non-Goals

**Goals:**

- Preserve every evidence-backed candidate without making every candidate current completion scope.
- Execute admitted current-change work before its first named consumer, subject to safety, dependency, and evidence-invalidation ordering.
- Identify same-repository multipliers from concrete consumers rather than generic reuse claims.
- Keep compaction, apply, archive, final-history, normative specs, documentation, and contract tests synchronized.

**Non-Goals:**

- Build a scheduler, ranking algorithm, backlog service, or savings estimator.
- Automatically edit another active change, repository, or deferred consumer.
- Admit speculative future work without observed evidence and a current causal path.
- Weaken live-attempt, protected-boundary, validation, or completion gates.

## Decisions

### 1. Separate preservation, admission, and execution

Every candidate with observed evidence is classified. A candidate with a concrete remaining current-change consumer may be admitted as an unchecked `Session-Derived Improvements` task. A candidate with evidence but no current consumer is written as a non-checkbox `Deferred Improvement Candidate` in `history.md`; it is not accepted scope and does not block RC, stable, or archive. A speculative idea with no observed evidence remains rejected and does not create work.

This preserves evidence without recreating the current all-candidates-become-mandatory problem. Alternatives rejected: placing every candidate in `tasks.md`, which expands completion scope, and dropping non-admitted candidates, which loses useful evidence.

### 2. Use explicit classification fields

Every admitted or deferred record carries:

- `Impact Horizon`: `Current Change`, `Working Repository`, or `opencode-kit`.
- `Concrete Consumers`: exact remaining task IDs, workflow entry points, or `none observed`.
- `Execution Class`: `gate-closer`, `do-now`, `before-task-<id>`, `before-freeze`, or `separate-change`.
- `Earliest Safe Point`: the first point allowed by dependencies, safety, authority, and current evidence.
- `Invalidated Evidence`: exact proof/validation lanes to rerun, or `none`.
- `Observable Payback`: an observed repeated step or downstream use that will disappear or become shared, without invented time estimates.

These are model-facing evidence fields, not inputs to a deterministic score. Static tests may enforce their presence but cannot infer whether the classification is semantically correct.

### 3. Define a strict repository-multiplier gate

`Impact Horizon: Working Repository` is admitted into the current change only when:

- the current change has an exact remaining consumer and will prove the shared behavior;
- at least one additional exact repository consumer is named from source or active artifacts;
- the implementation reuses or extends an existing shared owner rather than creating a parallel mechanism;
- implementation of the other consumers is not silently pulled into the current change.

This gives reusable work explicit attention while retaining the original outcome anchor. Generic future portability is not a multiplier.

### 4. Execute at the earliest safe consumer boundary

Apply uses this order:

1. Close a blocked or unknown `Live-Attempt Gate` and non-deferrable safety blockers.
2. Run `gate-closer` improvements.
3. Run `do-now` and `before-task-<id>` improvements before their first current consumer.
4. Run `before-freeze` improvements before qualification freeze.
5. Leave `separate-change` records non-blocking and unimplemented until an owning change admits them.

Dependency prerequisites and evidence invalidation can move execution later, but mere physical position at the end of `tasks.md` cannot. Archive verifies that admitted tasks are complete and that deferred records were dispositioned; it does not require deferred implementation.

### 5. Reuse the existing instruction workflow and proof boundary

No new executable helper is needed. The smallest coherent change updates the existing policy, hidden prompt, canonical apply/archive surfaces, docs, specs, and focused structural contracts. Runtime behavior is compared using identical synthetic baseline and candidate continuations through the installed compaction entry point.

## Risks / Trade-offs

- **Model classification may still be inconsistent** -> Require explicit evidence fields, run the same-model loaded baseline/candidate workflow, and keep deterministic tests limited to structural facts.
- **Repository multiplier wording could expand scope** -> Require the current change to consume and prove the shared owner; name other consumers but do not implement them automatically.
- **Deferred evidence may become hard to discover after archive** -> Store it in the durable strategy journal with an exact re-evaluation condition; do not introduce a separate backlog mechanism in this increment.
- **More fields increase summary size** -> Apply fields only to evidence-backed admitted/deferred records and keep unsupported matrix cells as `none`.
- **Prompt/config mutation may overlap current unrelated work** -> Patch only the compaction prompt tail and preserve all other active config/template bytes.

## Migration Plan

1. Record the current loaded baseline and source identities.
2. Update normative and loaded instruction surfaces plus focused contracts.
3. Start a fresh OpenCode process for the candidate compaction run; current sessions retain old loaded instructions.
4. Retain the change only if the candidate preserves baseline safety and all-candidate evidence while producing the required classification and execution order.
5. Roll back only this change's prompt/policy fragments if runtime quality regresses.

## Open Questions

None for this increment. A repository-wide deferred-improvement index is deliberately outside scope until real archived-history discoverability loss is observed.
