## Context

See `proposal.md` for the recurrence and accepted outcome. The current runtime has
fifteen registered Practice Owners, including owners for outcome readiness, claim
evidence, architecture, and execution safety, but none owns the relation among a
current outcome, representative workload, profile/configuration, environment, and
observation oracle. Main already owns finding disposition, planning mutation,
dependency closure, and owner questions; a second recovery orchestrator would
conflict with that authority.

The implementation crosses agent, skill, always-loaded routing, Practice Ownership,
runtime profiles, validators, catalogs, and configured-session proof. It must remain
inside existing instruction budgets. Current provider-free measurement leaves only
five global discovery token-proxy units and forty-nine on-demand-body token-proxy
units, while core discovery has headroom and global/core startup have bounded
headroom. New discovery metadata and bodies therefore require reviewed duplicate
removal; increasing a budget is not an implementation option.

The current source owners are:

- `config/practice-owners.json` plus `tools/practice-owners.ts` for reviewed owner
  identity and generated view;
- `tools/runtime-surface-profile.ts` plus `profiles/core.json` and
  `profiles/all.json` for loader-visible catalogs;
- the inherited reviewer and Practice Owner contracts for leaf authority;
- `tools/proofs/consumer-outcome-regression.ts` and its existing pack/capture/
  evaluator modules for matched configured-session behavior evidence.

No current artifact owns foundation-relation semantics or the bounded main recovery
procedure. Those are the only `build-minimal` additions. Registry, profile,
validation, and proof work extends the current owners.

## Goals / Non-Goals

**Goals:**

- Add one coherent read-only observation boundary and one main-executed correction
  procedure without transferring outcome or mutation authority.
- Make material bind/rebind review event-triggered and preserve Ordinary Small,
  aligned, historical-only, and non-critical negative controls.
- Turn one reproduced contradiction into one finite correction/sweep/re-review
  episode whose state and evidence ceiling are inspectable.
- Reuse current profile, validation, proof-client, evaluator, cleanup, and claim-
  evidence mechanisms.
- Pay for added runtime text inside current discovery, startup, and on-demand-body
  ceilings without weakening existing safety or owner triggers.

**Non-Goals:**

- Add a daemon, scheduler, plugin, semantic database, project-memory authority,
  numeric score, fuzzy classifier, or universal task gate.
- Define a portable machine-readable ontology for product workload/profile/oracle
  semantics.
- Rewrite archives, migrate consumer repositories, or choose an unresolved protected
  product identity.
- Qualify mismatch classes, models, providers, or project planning systems outside
  the declared `foundation-integrity-autorecovery-v1` population.

## Decisions

### 1. Use a distinct Practice Owner for detection and main for recovery

Add `global/agents/foundation-integrity-reviewer.md` as the sole owner of Practice ID
`foundation-integrity`. The agent inherits the shared leaf-reviewer and Practice
Owner contracts, remains read-only, and returns a foundation-relation matrix plus
material risk rows. Add `global/skills/foundation-integrity-recovery/SKILL.md` as an
on-demand procedure loaded and executed only by the active primary main after main
reproduces a finding.

The reviewer observes applicability and contradictions; it does not prescribe or
authorize mutations. Main owns falsification, incident disposition, product
decisions, corrective OpenSpec or project-native artifacts, writes, proof, and final
handoff. The skill is procedural detail for that existing authority, not an agent,
tool, or orchestrator.

Alternatives rejected:

- Extending `outcome-readiness` would mix implementation readiness with ongoing
  cross-identity integrity and would make one owner responsible for two change axes.
- Extending `claim-evidence` would detect overclaim only when a broad claim is made,
  after dependent implementation may already have accumulated.
- A combined detecting/writing agent would make its own evidence authorize its own
  mutation and introduce writer-liveness and self-review risks.

### 2. Model foundation identity as a reviewed relation, not a new ontology

The reviewer receives four human-readable identity slots when available:

1. accepted outcome/current-oracle identity;
2. representative workload or population identity;
3. machine/language profile and material configuration identity;
4. environment and observation-oracle identity.

Inputs are current readable requirements, decisions, source/configuration,
project-native planning, claims, and supplied runtime evidence. A review event exists
only when current work binds or rebinds at least two slots and one named material
condition from the specs is present. A foreign identity explicitly retained as
historical, regression, or component evidence does not form a current contradiction.

The relation and materiality remain semantic judgments. Validators may check that a
reviewed record contains explicit identities and references, but they may not infer
meaning from names, file paths, similarity, counts, or scores. This avoids a brittle
cross-domain schema while still requiring concrete evidence.

Alternative rejected: a normalized workload/profile/oracle database would become a
second product-authority source, require consumer migration, and still could not
derive domain semantics safely.

### 3. Keep routing event-triggered and compact

The agent description exposes the exact bind/rebind trigger, current named-
contradiction uncertainty trigger, and stay-quiet boundary. The Practice Owner
contract roster gains one concise row. `global/AGENTS.md` gains only the smallest
main-routing and autonomous-recovery delta by replacing or consolidating overlapping
text; the complete relation and recovery procedures remain on demand.

There is no periodic review and no launch based only on task size, generic quality
risk, one local identity, or a possible future mismatch. Multiple unrelated practice
triggers continue to use existing serial/fan-out rules; foundation review does not
become a central router.

Alternative rejected: an every-task or scheduled review would add cost to the
Ordinary Small negative control and produce speculative polishing pressure.

### 4. Represent one recovery as a bounded project-native incident episode

After reproduction, main assigns one stable, human-reviewed Foundation Incident ID
to the exact candidate and relation. The state machine is:

```text
observed -> falsified
observed -> owner-boundary
observed -> confirmed -> correcting -> swept -> re-reviewed -> closed
```

The corrective active change or equivalent project-native planning surface records
the ID, candidate, contradicted identities, evidence references, state, complete
active-artifact disposition, evidence narrowing, and corrected-candidate review.
This is not a new global ledger or service. In OpenSpec repositories the record lives
with the corrective active artifacts and evidence; in other repositories main uses
the existing planning surface. If no durable project-native surface exists, main can
perform the bounded correction and report the incident in the session handoff rather
than inventing OpenSpec.

The same relation/candidate/evidence tuple stays in the current episode. A remaining
defect after correction is corrected inside that episode; it does not mint a
successor incident. A new episode requires a changed candidate identity or new
decision-changing evidence for a distinct current relation. Deterministic fixture
evaluation validates explicit IDs and state transitions only.

Alternative rejected: a persistent global risk register would create lifecycle,
retention, authority, and cross-project privacy responsibilities not required by the
accepted outcome.

### 5. Falsify first, then apply one serial dependency-scoped sweep

Main first tests the exact contradiction against the strongest current source or the
smallest safe discriminating runtime observation. Falsification terminates without a
corrective change. Confirmation proceeds only when the defect is current, reachable,
foundation-level, and capable of damaging the accepted outcome or a non-deferrable
invariant.

For OpenSpec projects, main uses `openspec list --json`, per-change status/show
readback, current canonical specs, and active claim records to build the complete
current inventory. Each artifact receives one of:

```text
not-dependent
dependent-rebind
dependent-narrow
owner-boundary
unknown
```

Only `dependent-rebind` and `dependent-narrow` are mutated. Shared surfaces use the
existing active-change dependency and ownership-transfer contract; all writes are
serial. Canonical requirements change through one owning corrective delta and normal
archive synchronization. Archives are hash-captured before the sweep and read back
unchanged after it. Prior results remain referenced at their strongest truthful
historical/component/regression ceiling.

For non-OpenSpec projects, the same classification applies to their current planning
and claim surfaces without assuming file names or adding a framework.

Alternative rejected: repository-wide text replacement cannot distinguish current
bindings from historical references and would violate archive and unrelated-work
invariants.

### 6. Extend existing deterministic owners; add no semantic helper

Implementation extends the reviewed practice seed, count, generated view, profile
catalog constants, committed profiles, validators, focused tests, README maps, and
proof inventory. Existing validators already enforce stable ordering, exact owner
files, profile inclusion, duplicates, conflicts, and readback drift. Add exact marker
and negative fixture checks only where the current validator lacks them.

No helper will classify foundation relations or decide dependent artifacts. The
configured-session evaluator may validate scenario-owned explicit relation IDs,
incident states, file hashes, task/agent attribution, and expected mutations because
those are reviewed fixture facts rather than production semantic inference.

Alternative rejected: a new incident CLI or semantic scanner would duplicate current
inventory/evidence mechanisms before a third repeated need exists.

### 7. Pay instruction-budget cost by removing inherited duplication

The implementation must remain green against the unchanged maxima in
`config/instruction-budget.json`. New descriptions will be trigger-complete but
short. Added owner/skill bodies will rely on inherited global reviewer, Practice
Owner, authority, worktree, and evidence contracts instead of copying them.

Because current global discovery and on-demand-body headroom cannot contain both new
artifacts, implementation will remove only verified duplicate boilerplate from
existing core owner/skill bodies where the same operative contract remains available
through inherited `global/AGENTS.md`. Owner-specific triggers, exclusions, inputs,
outputs, permissions, and failure behavior remain local. Description curation must
preserve the existing keyword/negative routing tests for every touched artifact.

Budget seed limits will not be raised, and another required core owner or skill will
not be removed. Inventory before/after, exact profile catalogs, strict validation,
and matched existing behavior packs bound the consolidation.

Alternative rejected: materializing larger maxima would turn a guard into a moving
output metric and violate the specified runtime-profile contract.

### 8. Reuse the consumer-outcome harness for matched behavior proof

Extend the existing consumer-outcome fixture/contract/capture/evaluator owner with a
`foundation-integrity` partition pack. Reuse its source staging, configured-model
route, immutable baseline/candidate bundles, permission containment, filesystem
readback, privacy scan, session deletion, and replay modes. Do not add a second proof
runner. The pack may allow the exact Practice Owner task call and local writes only
inside its disposable fixture roots; questions, arbitrary external directories,
credentials, installs, remote/destructive actions, and unrelated tools remain denied.

Capture a baseline after the provider-free fixture/evaluator preflight but before
loaded foundation artifacts change. Then capture the candidate with the same model,
variant, prompts, fixtures, permissions, environment, and evaluator. The reviewed
members are those in the proposal population, including mismatch/recovery,
falsification, dependent/unrelated sweep, overlap serialization, protected ambiguity,
archive preservation, aligned/historical/Ordinary Small/non-critical controls, and
unchanged-hypothesis termination.

The `practice-owner-routing` and `runtime-surface-loader` proofs remain supporting
owners: the former need not become a mutating recovery harness, while the latter
proves the new agent and skill are loader-visible with exact permissions in a
disposable generated core.

Alternative rejected: extending the read-only practice-owner routing runner to write
planning artifacts would weaken its current containment and duplicate the consumer-
outcome capture/evaluator stack.

### 9. Use a shift-left proof ladder with explicit effects and cleanup

The current fidelity rung is reviewed planning and provider-free source inventory.
The next real boundaries, in order, are:

1. provider-free fixture/contract/evaluator preflight and frozen baseline capture
   preparation;
2. installed OpenCode loader over a disposable generated core profile;
3. one same-model configured mismatch fixture proving exact owner attribution,
   main reproduction, bounded local mutation, truthful evidence narrowing, and
   terminal cleanup;
4. the complete reviewed partition pack plus provider-free replay;
5. strict project-native validation and a fresh evidence-sufficiency challenge for
   claim `foundation-integrity-autorecovery-v1`.

Configured model calls are bounded synthetic kit validation already authorized for
this repository. They use non-sensitive prompts and disposable local repositories.
Every capture preserves source/model/profile/environment identities, exact input,
status, redacted stdout/stderr, task/agent/tool facts, before/after hashes, incident
state, evaluation, session deletion, and fixture cleanup. Failure preserves the raw
bundle and blocks unchanged live repetition until provider-free replay identifies a
causally distinct correction.

No consumer product, remote service, deployment, controller, credential, or
protected action is in the proof envelope. The broad claim remains limited to the
captured configured model and reviewed partitions.

## Risks / Trade-offs

- **Model judgment may miss or over-report a relation** -> Require concrete current
  identity evidence, main reproduction, false-positive and aligned controls, and
  preserve `unknown` rather than infer.
- **The new owner overlaps readiness, evidence, or architecture owners** -> Keep its
  output strictly to current cross-identity foundation applicability and refer every
  other concern through existing boundaries.
- **Automatic recovery could become automatic redesign** -> Enforce the confirmation
  predicate, dependency classifications, one incident state machine, non-critical
  exclusions, and one corrected-candidate review.
- **A sweep may miss an active dependent artifact** -> Inventory all active and
  complete-unarchived changes plus canonical specs and active claims before mutation;
  unresolved classification remains `unknown` and blocks only that dependency.
- **Budget-neutral compression could weaken existing behavior** -> Remove only
  inherited duplicate clauses, preserve specialized contracts and descriptions,
  and replay affected structural and configured behavior tests before retention.
- **Configured proof is costly and probabilistic** -> Preflight provider-free,
  capture the smallest happy path first, preserve immutable bundles, replay offline,
  and bind the claim to one configured model and reviewed fixtures.
- **Project-native incident records are not universally machine-queryable** -> Keep
  the required fields explicit in the current planning/handoff surface and claim
  only the reviewed OpenSpec fixtures; do not invent a universal storage system.

## Migration Plan

1. Extend the existing consumer-outcome pack and capture an unchanged-instruction
   baseline before loaded routing mutation.
2. Add the new agent and skill, then atomically update the reviewed practice seed,
   generated view, exact count, core/all catalogs, profiles, routing contract,
   README, validators, and focused tests.
3. Consolidate verified inherited duplication until every unchanged instruction
   budget is green; retain before/after inventory and regression results.
4. Materialize a disposable core profile and run installed loader/permission proof.
5. Run the mismatch happy path, then the complete matched partition pack and offline
   replay; update the development claim record with only observed evidence.
6. Run strict library/OpenSpec validation and the required fresh broad-claim
   evidence challenge. Installation or activation of the verified source remains a
   separate local maintainer step; fresh sessions are required after config-time
   artifact changes.

Rollback restores the prior generated runtime-surface backup or selects the prior
verified source/profile, then starts a fresh OpenCode session. Repository rollback is
the scoped reversal of this change's new agent/skill and registry/profile/routing/
proof deltas; unrelated working-tree files and all archived evidence remain
untouched. If post-load proof fails, keep the candidate uninstalled/unselected,
preserve the raw bundle, and continue only after an offline-evidenced correction.
