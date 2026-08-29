---
name: roadmap-delivery-trajectory
description: Use ONLY for roadmap or phase delivery trajectory under an explicit Delivery Horizon after successful post-archive evidence shows a forecast, bottleneck, repeated unit-of-work, shared-fan-out, or dominant-cost trigger; stay quiet for an ordinary retrospective, cohesive local work, changed-code review, focused complexity, next-step recommendation, exhaustive audit, or campaign execution.
license: MIT
---

# Roadmap Delivery Trajectory

Use this skill only for one current, explicit Delivery Horizon when main already has a successful linked archive and evidence of a material trajectory trigger. Main executes the skill and retains every semantic disposition, planning mutation, successor, and owner-boundary decision. This is not a reviewer or Practice Owner workflow.

## Trigger

Load once for the current evidence tuple only when a cheap current signal connects the same Horizon outcome or exit predicate to at least one of:

- repeated item-specific engineering touch for behavior owned by one exact shared mechanism;
- a current blocker or correction with complete reusable fan-out;
- a measured or assumption-bounded forecast that is at risk or outside the useful window;
- several locally successful linked changes with no material movement in a named exit predicate;
- a demonstrated shift in the dominant engineering, proof, external/runtime, coordination/recovery, or context/comprehension boundary.

Name the reachable outcome consequence, evidence references, uncertainty, and why continuing unchanged can materially affect the declared useful window. Counts are facts, never trigger thresholds or verdicts.

## Stay Quiet

Do not load this skill for:

- an ordinary retrospective, postmortem, final-history exercise, or process improvement without an explicit current Horizon trigger;
- legacy-unlinked or `Delivery Horizon: none` work;
- cohesive local work, one slow change, ordinary diagnosis, or a changed-code review;
- focused complexity assessment, architecture comprehension, next-step recommendation, exhaustive audit, or campaign execution;
- task count, archive count, line count, token use, model-call count, elapsed time, or aesthetic preference alone;
- general portfolio scheduling, roadmap generation, velocity scoring, consumer implementation, or protected external action.

Never infer Delivery Horizon membership from filenames, dates, tasks, source paths, capabilities, neighboring changes, or semantic similarity. If the selected runtime surface lacks this skill or `global/bin/delivery-trajectory-context.ts`, report the exact capability unavailable with no adjacent-skill fallback.

## Required Inputs

Before review, bind all of:

- the current candidate, runtime surface, project root, and canonical source identity;
- the exact Horizon id and validated Horizon record;
- final `archive: archived` evidence for the current successful linked archive;
- current normalized fact-helper output from `delivery-trajectory-context.ts` with its bounds, support states, digests, privacy state, and cleanup;
- current accepted outcome, exit predicates, non-deferrable invariants, and non-goals from their referenced bytes;
- selected decision-material evidence refs and content digests;
- one current trigger class with causal evidence refs, uncertainty, and named outcome consequence;
- any terminal receipt for the same Horizon and current reviewed evidence tuple.

Missing, stale, contradictory, unreadable, unsupported, over-bound, or source-mismatched input remains `unknown` or blocked at that lane. Do not search a parent, guess another source, or replace missing evidence with task prose or model confidence.

## Compact Signal

Restate one compact signal before deep comparison:

- Horizon id and current archive id;
- named exit-predicate delta or `unknown`;
- available facts by each of the five cost axes below, without aggregation;
- forecast `within-window | at-risk | outside-window | unknown`;
- trigger `none | review-required | unknown`, trigger class when supported, evidence refs, and uncertainty;
- the next discriminating read when any material input is unknown.

This loaded workflow normally starts from `review-required`. If refreshed evidence falsifies the trigger, stop without a receipt or successor and report the narrower fact. Preserve the independent operation dimensions:

```text
archive: archived
trajectory: review-required | unknown
```

Never relabel successful archive as failed, reopen it, alter its tasks/specs, or convert a missing trajectory fact into product incompleteness.

## Deep Review

Bind the unchanged-plan baseline and compare only evidence-relevant remove, narrow, batch, data-drive, reuse, shared-owner, architecture-locality, or proof-boundary options. Keep these five cost axes separate:

- engineering/setup;
- proof/validation;
- external/runtime execution;
- coordination/recovery;
- context/comprehension.

Do not aggregate unlike axes into a score or call a local reduction an end-to-end improvement. For population and mechanism claims, state separately:

- item count `N` and its exact accepted population source;
- exact unique owner/mechanism count `K` and verified applicability;
- automated per-item processing that still occurs;
- irreducible per-item evidence, runtime observation, cleanup, and authorization.

Engineering setup may change from `O(N * manual)` to `O(K)` plus automated `O(N)` while external execution remains `O(N)`. Never promote one member's evidence, synthetic/offline behavior, or shared-owner fit across unobserved members.

For a calendar forecast, state observed measurements or explicit bounded assumptions, completed and remaining population, range, uncertainty, dominant boundary, and forecast-invalidating observations. When the delivery window, duration basis, population, or dominant-cost evidence is absent, the calendar forecast is `unknown`; name the smallest next observation instead of manufacturing a date.

## Duplicate Suppression

The review identity is exactly the Horizon id plus:

- the decision-context digest over ordered reviewed Horizon intent and decision-material refs/content digests; and
- the trigger-evidence digest over ordered causal refs/content digests.

The archive identity is non-key metadata. `reviewedAt`, model prose, and the model-owned trigger label are also non-key metadata. A matching terminal receipt means: do not repeat semantic review and do not create another successor. Consume its disposition unless a materially distinct current trigger exists or current evidence satisfies its retry condition.

Changed archive identity alone does not change the review key. Changed decision or trigger evidence creates a new key, but run another deep review only when the refreshed compact signal proves a materially distinct trigger or the prior retry condition is met.

## Disposition And Authority

Choose exactly one:

```text
continue | measure-next-boundary | replan-outcome-preserving | owner-required | unknown
```

- `continue`: current evidence supports the unchanged mechanism; record why and the do-not-repeat condition.
- `measure-next-boundary`: one bounded observation can discriminate the dominant uncertainty; name its exact oracle and stop condition.
- `replan-outcome-preserving`: one smaller future mechanism preserves accepted behavior, population, invariants, proof strength, and protected semantics; name the earliest falsifiable consumer, expected leverage, proof, rollback, do-not-repeat condition, and retry condition.
- `owner-required`: the useful option changes accepted product semantics, population, public/persisted/security/privacy/legal policy, proof strength, or requires another protected action. Perform no semantic or protected mutation.
- `unknown`: evidence cannot support another disposition; name the smallest safe discriminating observation.

After every valid triggered review, main persists exactly one immutable receipt through `materializeTrajectoryReviewReceipt` at `openspec/delivery-horizons/<horizon-id>/reviews/<receipt-key>.json`, including for `continue`, `owner-required`, and `unknown`. For `measure-next-boundary` or `replan-outcome-preserving`, main then uses the canonical OpenSpec propose workflow for one bounded same-Horizon successor. The successor, not the receipt, owns executable tasks, proof, validation, and later product mutation. For `continue`, `owner-required`, or `unknown`, persist the receipt but do not invent a successor. The archived change remains immutable.

Main retains scope, authority, receipt materialization, proposal authoring, runtime proof, and final disposition. No reviewer, helper, forecast, benchmark, or this skill authorizes mutation. Do not dispatch a reviewer, create a new Practice Owner, hand work to a campaign, or ask the user merely to approve an outcome-preserving process-control change. Use the normal owner boundary only for the changed accepted or protected semantics themselves.

## Output

Return one compact block with these exact fields:

- `Archive`: `archived` plus current archive id.
- `Trajectory`: `review-required | unknown`.
- `Horizon`: id, window, and bound outcome/exit-predicate refs.
- `Signal`: exit-predicate delta, forecast, trigger class, evidence refs, uncertainty, and next discriminating read.
- `Cost Axes`: separate engineering/setup, proof/validation, external/runtime, coordination/recovery, and context/comprehension observations with support state.
- `Population And Mechanism`: `N`, `K`, automated per-item processing, and irreducible per-item evidence, each `available | unknown | not-applicable`.
- `Unchanged Baseline`: current mechanism and supported consequence within the useful window.
- `Disposition`: exactly one closed value and evidence-backed reason.
- `Receipt Seed`: schema version, Horizon id, archive identity, ordered decision-context and trigger-evidence refs/digests, both aggregate digests, trigger class, five cost observations, forecast, disposition, successor ref when required, uncertainty, do-not-repeat condition, and retry condition; `none` only when review stopped before a valid trigger. There is no no-trigger receipt.
- `Successor`: `none`, or one canonical same-Horizon OpenSpec proposal ref for `measure-next-boundary` or `replan-outcome-preserving`.
- `Authority And Effects`: main-owned actions performed, protected actions not performed, archive immutability, diagnostics, and cleanup.

Do not add a final-history task, mutable roadmap status, velocity/quality score, every-change report, six-cell retrospective, or durable no-trigger signal.
