## Context

See `proposal.md` for the delivery problem and the single
`roadmap-delivery-trajectory-v1` claim. The current kit has several correct but narrower
owners:

- OpenSpec propose/apply/archive own one bounded change and complete-archive integrity;
- `history.md` owns materially distinct strategies inside that change;
- compaction reflection owns session continuity and cannot schedule product work;
- Automation Dividend owns one proposal-selected repeated deterministic sequence;
- `complexity-management` owns one current consumer's comprehension and change locality;
- `next-step` recommends among active OpenSpec work but is recommendation-only and does
  not inspect cross-archive trajectory by default;
- `autonomous-work-campaign` is a planned durable multi-wave controller whose first
  increment accepts only `audit-remediate` and explicitly excludes optional architecture
  polishing and additional playbooks.

The archived `add-final-history-retrospective` change previously required every new
change to analyze all history and generate additional completion tasks. The later
`reduce-workflow-ceremony` change removed that rule because it delayed product
completion, self-expanded scope, and conflicted with validators. This design therefore
places the cheap signal after successful archive and any material correction in a future
ordinary OpenSpec change.

Current `add-continuous-complexity-management` implementation has an active writer on
global skill, profile, validator, fixture, package, and consumer-outcome proof surfaces.
The team-advisor and campaign changes declare later overlap on several of the same
owners. This change may author isolated planning artifacts now. Production mutation
starts only after fresh ownership readback proves each touched path terminal,
transferred, serialized, or narrowed; no current bytes are reverted or adopted.

### Fidelity And Proof Envelope

The current rung is reviewed current/archived workflow source, direct PMAC planning
evidence, current OpenSpec/consumer proof owners, and these planning artifacts. The first
real boundary is provider-free horizon/context/receipt schema and CLI behavior in
disposable repositories. The next boundary is one actual configured complete-archive
no-trigger case, followed by the smallest repeated-touch case that produces one
outcome-preserving successor. Remaining partitions, default-profile loading, and the
read-only PMAC diagnostic follow only after that happy path is terminal.

Authorization covers local kit planning/source/test changes, disposable Git/OpenSpec
projects, and the minimum non-sensitive configured model calls already authorized for
matched kit validation. It excludes consumer source mutation, controller contact,
installation, activation, credentials, remote mutation, deployment, release, and
protected product decisions. Every proof-owned session/process/writer closes before
fixture removal; immutable privacy-safe bundles preserve exact invocation, candidate,
environment, status/stdout/stderr, files/effects, diagnostics, and cleanup.

## Goals / Non-Goals

**Goals:**

- Make a phase/roadmap outcome and useful delivery window explicit without creating a
  mutable generated roadmap or current-status authority.
- Observe every successful linked archive cheaply and reserve model-heavy review for
  current material triggers.
- Distinguish the wrong engineering unit from irreducible per-item product evidence.
- Produce honest forecast ranges and unknowns across separate cost axes.
- Replan future outcome-preserving work autonomously while preserving exact owner
  boundaries for changed acceptance or protected semantics.
- Keep duplicate suppression, source/profile identity, diagnostics, and loaded behavior
  testable across local projects.

**Non-Goals:**

- Retrospective completion scope, a project scheduler, a persistent current roadmap
  projection, an organization portfolio system, universal metrics, or automatic semantic
  classification.
- A second complexity workflow, next-step owner, Practice Owner, campaign playbook,
  configured-session runner, or evidence database.
- Consumer migration, project implementation, controller execution, installation,
  activation, remote action, deployment, release, or scope/quality reduction.

## Decisions

### 1. Store intent and triggered evidence, not mutable roadmap status

Use one additive project-contained layout:

```text
openspec/delivery-horizons/<horizon-id>/horizon.json
openspec/delivery-horizons/<horizon-id>/reviews/<trigger-digest>.json
```

`horizon.json` is reviewed static intent with schema version 1, horizon id,
`windowStart`, `usefulBy`, and ordered non-empty repository-relative reference arrays
for outcome, exit predicates, invariants, and non-goals. Instants are RFC 3339 UTC and
`usefulBy` must be later. References point to canonical project requirements and avoid
copying their semantic text.

A review receipt exists only after deep review. It records schema, current archive
identity as non-key metadata, horizon/review-context/trigger-evidence digests, trigger
class and evidence refs, separate cost-axis observations, forecast state and assumptions,
one disposition, successor ref when applicable, uncertainty, do-not-repeat condition, and
retry condition. The review-context digest covers the reviewed horizon intent and ordered
decision-material evidence refs/content digests; the trigger-evidence digest covers the
ordered causal evidence refs/content digests. Neither includes volatile archive identity,
timestamps, model prose, or the model-owned trigger label. The receipt is immutable
evidence, not a current projection. No no-trigger receipt, aggregate status file,
generated roadmap, archive counter, or derived backlog is written.

Alternatives rejected:

- Storing current progress/forecast in `horizon.json` would create another mutable status
  owner and drift from OpenSpec/evidence.
- Writing every no-trigger signal would recreate mandatory per-change ceremony and an
  ever-growing observation ledger.
- Keeping triggered review only in transcript would not survive restart or suppress an
  equivalent duplicate reliably.

### 2. Link new changes by one explicit proposal field

New proposal authoring adds exactly one reviewed line:

```text
- **Delivery Horizon:** <horizon-id>
```

or:

```text
- **Delivery Horizon:** none - <reason>
```

The deterministic operation gate validates syntax and exact horizon existence for new
changes only. Legacy changes remain unlinked. Semantic membership stays with main and
is not inferred from capabilities, files, source paths, dates, or task descriptions.
The field is a routing reference, not another task or claim record.

Alternative rejected: infer membership from the nearest roadmap or change name. That
can merge unrelated outcomes and makes duplicate/forecast identity unreproducible.

### 3. Build one bounded fact helper and keep semantics in main

Add `global/bin/delivery-trajectory-context.ts` with a cohesive core and CLI. Inputs are
`--root`, `--horizon`, `--archive`, `--format json|markdown`, `--max-archives`,
`--max-bytes`, and `--timeout-ms`. Initial defaults are eight linked archives, 2 MiB of
aggregate planning/evidence metadata, and 30 seconds, under tested hard caps. The helper
resolves only the explicit project layout and active global file; it never searches
parents or another source.

The stable output contains horizon identity/window/ref paths/digests, exact current
archive identity/linkage, stable bounded preceding linked archives, proposal/task/
history/evidence file refs/digests/sizes, and support/diagnostic state. It does not emit
source payloads or semantic summaries. Main reads only selected referenced artifacts
needed to decide the signal.

Current `openspec-change/inventory.ts` was verified as an active-change ownership and
evidence closure owner; it intentionally excludes archives. `repo-candidate-snapshot.ts`
owns Git candidate state and patch/history facts. Extending either would mix current
ownership or Git review with horizon/archive semantic context. A small new fact helper
has lower total responsibility and context cost. Compatible portable process, schema,
stable rendering, redaction, path, and test utilities are reused directly; no generic
inventory framework is added.

Alternative rejected: encode trigger or forecast in TypeScript. Process effectiveness,
semantic outcome movement, owner equivalence, and strategy are model-owned judgments
and deterministic inference would violate current policy.

### 4. Archive first, signal second

The complete-archive helper remains unchanged as the sole completion/spec-merge/move
owner. Only after zero exit, final `status: archived`, and post-validation does the
model-facing archive workflow inspect the archived proposal linkage and invoke the
context helper. It then emits the compact signal in the same root session.

Trajectory state is a separate output dimension:

```text
archive: archived | failed
trajectory: not-applicable | none | review-required | unknown
```

No trajectory state changes archive state. If archive fails, no success signal runs. If
context or semantic analysis fails after archive, output preserves `archive: archived`
and `trajectory: unknown` with cause. This separation is enforced in loaded behavior
fixtures and cross-artifact contradiction validation.

Alternative rejected: run the review before archive. It would again delay product
completion and allow process analysis to self-expand the completed change.

### 5. Use a compact semantic signal with evidence, not a metric

For a linked archive, main reads the normalized context and the minimum selected
artifacts needed to state:

```text
horizon + archive identity
named exit-predicate delta or unknown
available facts by five cost axes
forecast within-window | at-risk | outside-window | unknown
trigger none | review-required | unknown
trigger class, evidence refs, uncertainty, next discriminating read
```

Deep review requires a current causal link to the same horizon and one accepted trigger
class. Direct current-population/fan-out or measured window evidence can trigger from one
archive; otherwise repeated-touch requires at least two materially similar linked
archives or another maintained recurrence source. Counts remain facts, never thresholds
or verdicts. A single slow change without a named outcome consequence stays local.

Alternative rejected: a velocity score or fixed archive/task threshold. Unlike cost
axes cannot be aggregated honestly, and Goodhart pressure would reward smaller changes
or weaker evidence rather than faster outcomes.

### 6. Review the unchanged baseline and separate N, K, and irreducible evidence

The deep skill binds the exact context/trigger tuple and compares continuing unchanged
against only evidence-relevant strategies. It maps five cost axes, current population,
completed/remaining exit predicates, exact reusable owners/mechanisms, per-item automated
processing, and irreducible row/member evidence. It reports assumptions, range,
uncertainty, dominant boundary, and forecast-invalidating observations.

When time evidence is absent, calendar forecast is `unknown`. Structural evidence may
still show that item-specific engineering is `O(N * manual)` where exact shared owners
can make setup `O(K)` plus automated `O(N)`. Required runtime observations remain
per-item and are never promoted across members. Offline processing time never becomes
external-system throughput.

The allowed disposition set is closed:

```text
continue
measure-next-boundary
replan-outcome-preserving
owner-required
unknown
```

Alternative rejected: require every review to produce an optimization. `continue` and
`unknown` are valid when evidence does not support a better mechanism.

### 7. Persist one receipt and use ordinary OpenSpec for future work

Main writes the reviewed receipt through a schema/readback materializer. The immutable
key is the horizon id, reviewed decision-context digest, and trigger-evidence digest. Both
digests are stable hashes of ordered reviewed refs and their content digests; current
archive identity and model-owned trigger class remain non-key metadata. Semantic fields
remain reviewed seed content; tooling validates but never generates them.

For `replan-outcome-preserving` or `measure-next-boundary`, main invokes the canonical
OpenSpec propose workflow to create one bounded successor linked to the same horizon and
receipt. That successor owns requirements, tasks, evidence, proof, validation, and any
later product mutation. The archived change stays immutable. `owner-required` creates no
successor whose semantics assume the owner's decision.

At the next linked propose/apply boundary, main recomputes bounded latest context and the
reviewed key. A matching key suppresses duplicate review even when another archive has
changed operational context. A changed key invalidates the old receipt only for the
changed decision evidence; main first recomputes the compact signal and performs another
deep review only when evidence establishes a materially distinct current trigger or
satisfies the prior receipt's retry condition. Another horizon and unrelated work remain
independent.

Alternative rejected: let the receipt act as executable backlog or campaign state. It
would duplicate OpenSpec and the future campaign controller.

### 8. Add one main-executed skill, not a Practice Owner or archive monolith

`roadmap-delivery-trajectory` owns compact signal interpretation, deep cost/forecast/
strategy review, receipt content, and main's disposition format. It is main-executed
because the result changes planning controls and may author a successor. No reviewer or
Practice Owner receives that authority.

The archive skill contains only successful-operation routing. The trajectory skill may
load `complexity-management` only when a materially distinct current architecture-
comprehension question is present; the same fact does not launch both. `next-step`
remains recommendation-only. Campaign execution remains outside this increment.

Alternative rejected: extend `complexity-management`. Its current consumer rehearsal
and refactor admission differ from cross-archive forecast and successor planning, and
its active change explicitly excludes scheduling/campaign ownership.

### 9. Ship in core and prove behavior through the existing consumer runner

Add the skill and exact helper closure to `core` and `all`; keep complete details on
demand. Add one compact always-loaded trigger only after profiles prove availability.
Custom profiles missing either artifact report capability unavailable without fallback.

Reuse the current consumer-outcome regression fixture/capture/evaluator family with a
trajectory pack covering every claim partition. The first configured happy path is a
successful linked archive with `none`; the second is the smallest repeated-touch trigger
that creates one ordinary successor. Only then expand to unknown, external-linear,
owner-boundary, duplicate, missing-capability, and external PMAC diagnostic cases.
Static/schema checks support but do not replace the actual configured archive and
successor boundaries.

This is the required Automation Dividend: existing foundation, bounded-falsification,
and complexity packs demonstrate the repeated configured fixture/capture/evaluate
sequence, so this change extends that owner rather than introducing another runner.

### 10. Keep active owners serial and claims partitioned

Implementation task 1 re-runs current OpenSpec ownership and repository candidate
inventory. New helper/schema files may proceed only when their exact dependencies are
unowned. Global routing, profiles, validators, templates, package/proof files, and the
consumer runner remain blocked until the active complexity writer is terminal and every
later planned overlap is transferred, serialized, or narrowed. No candidate is frozen
or behavior-qualified while an overlapping writer is live or unknown.

The disposable generic partition pack supports the broad claim. The PMAC read-only case
is a separate diagnostic showing that the workflow can recover the already reviewed
program-as-implementation-unit failure; it cannot complete a generic population member
or establish universal forecast quality.

## Risks / Trade-offs

- **[Horizon records drift from product requirements]** -> Store references rather than
  copied semantics, re-read current digests, and treat drift or missing refs as unknown.
- **[Every archive becomes expensive]** -> Bound fact collection, keep no-trigger output
  compact and ephemeral, and load deep skill only for current material evidence.
- **[Semantic trigger is model-sensitive]** -> Require named outcome consequence and
  exact evidence, matched controls, reviewed partitions, duplicate tuple identity, and
  honest unknown.
- **[A review churns architecture repeatedly]** -> One receipt per tuple, unchanged-
  evidence suppression, smallest early falsifiable consumer, do-not-repeat and retry
  conditions.
- **[A faster plan weakens quality]** -> Treat population, proof, safety, data,
  authorization, cleanup, restoration, and protected semantics as hard constraints and
  route changes to owner-required.
- **[Archive signal failure looks like archive failure]** -> Separate state dimensions
  in source, fixtures, validators, and output; signal runs only after terminal success.
- **[Review receipts become a hidden backlog]** -> Receipts are immutable evidence only;
  ordinary OpenSpec owns every executable successor and current status.
- **[Helper becomes a semantic metrics engine]** -> Fact-only schema, negative fixtures,
  no thresholds or classifications, original-cause diagnostics, and instruction/tool
  review.
- **[Active changes overwrite each other]** -> Fresh ownership inventory and strict
  terminal/transfer/serialization gates before each overlapping path.

## Migration Plan

1. Re-read current active-change ownership, source/profile identities, and the final
   archived retrospective/no-ceremony/automation contracts; freeze non-overlapping
   paths or explicit dependency/transfer order.
2. Add Horizon, linkage, context, and receipt schemas plus provider-free fixtures and
   prove malformed, escaped, legacy, bounded, stable, and no-write behavior before
   changing loaded routing.
3. Add the fact-only helper and effect-free help, then one thin trajectory skill and
   reviewed output contract without profiles or archive integration.
4. Extend the existing consumer proof family with the trajectory pack and preserve a
   matched baseline before candidate loaded behavior changes.
5. Add skill/helper to core/all, validate materialization/readback, then add compact
   archive and propose/apply routing only after capability availability is proven.
6. Run the actual configured no-trigger archive and smallest repeated-touch successor
   happy paths, then complete unknown, external-linear, owner-boundary, duplicate,
   legacy, signal-failure, and missing-capability partitions.
7. Run the installed read-only PMAC diagnostic, materialize current claim evidence,
   obtain required bounded readiness/evidence challenges, and complete full project
   validation and handoff without install or activation.

Rollback removes only the candidate skill/helper/routing/schema/template/profile/proof
surfaces and preserves all immutable trajectory, configured-session, and PMAC diagnostic
evidence. Since implementation performs no consumer migration or machine-local
activation, no consumer horizon or running OpenCode process is automatically changed.
Any later selected installation requires its own source readback and fresh process.

## Open Questions

- A future increment may let an implemented autonomous campaign consume a terminal
  trajectory receipt, but only after real use demonstrates that manual/ordinary
  successor execution is the delivery bottleneck. No campaign schema or playbook change
  is part of this increment.
