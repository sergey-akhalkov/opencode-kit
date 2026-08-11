## Context

The current policy already requires real-boundary happy-path proof, preserves evidence topology, and strongly handles work substitution and repeated costly live attempts. The missing decision is cadence: neither the roadmap contract nor every behavior slice must state and execute the earliest safe real-system check before more behavior is built on the same uncertain model.

A baseline same-model roadmap response already front-loaded a qualification harness and bounded real-controller capture when the prompt explicitly described an emulator. That is useful evidence, but it does not make the general rule durable across ordinary feature planning, OpenSpec task generation, and project templates. The candidate must preserve that behavior and make the fidelity ladder and deferred-boundary unblocker explicit without adding unsafe authority or premature systematic SDET.

The worktree contains unrelated modifications under `.serena/project.yml` and `openspec/changes/add-session-completion-guard/`; this change must not edit, stage, revert, or depend on them.

## Goals / Non-Goals

**Goals:**

- Minimize time-to-first-real-signal for every behavior dependency chain.
- Characterize real behavior before expanding an emulator or replacement model when safe access is reachable.
- Make every deferred real boundary name its blocker and earliest unblocking task.
- Preserve fast offline feedback and independent progress outside a blocked dependency chain.
- Keep authorization, safety, restoration, cleanup, and live-attempt replay fail-closed.
- Guard canonical and maintained mirror wording with deterministic exact markers and semantic workflow proof.

**Non-Goals:**

- Automatically execute remote, credentialed, physical, costly, destructive, or shared-environment tests.
- Require the highest-cost environment for every edit or duplicate unchanged real observations.
- Move fresh critical SDET before current MVP proof and accepted-scope completion.
- Add a new lifecycle stage, reviewer gate, scoring helper, or product-specific qualification procedure.
- Modify active unrelated OpenSpec work or host-default config.

## Decisions

### D1. Use a fidelity ladder, not a blanket live-test command

Every behavior slice identifies the highest-fidelity safe boundary currently reachable: deterministic offline or preserved replay; local integration or simulator; shadow/read-only real dependency; bounded live effects; end-to-end user/operator workflow. The slice executes that boundary now and names the next higher rung. This preserves cheap feedback while preventing a reachable real signal from being deferred to a phase-end campaign.

### D2. Optimize roadmaps for time-to-first-real-signal

When a harness, identity check, independent effect suppression, restoration procedure, capture schema, or authorization packet is the smallest prerequisite for real feedback, that prerequisite precedes additional behavior that relies on the unverified model. A deferred rung records the exact blocker, unblocking task, authorization, safeguards, restoration, and expected evidence.

### D3. Stop only the invalidatable dependency chain

If unknown or mismatched real behavior can invalidate downstream work, stop adding behavior in that dependency chain. Continue independent local work that does not rely on the uncertainty. When owner authorization or external capability is the remaining blocker, ask at the first safe, decision-ready gate rather than postponing the question until a late qualification phase.

### D4. Real characterization is production proof, not premature SDET

Main and the production author own early per-slice run-observe-correct, baseline characterization, and the Proof Runner, capture/evaluator, and restoration tooling needed to obtain that proof. Only automated test harnesses, fixtures, simulators, goldens, and other test-oracle artifacts remain SDET-owned. Material fresh critical-only SDET remains after current MVP proof and accepted-scope completion. This avoids turning shift-left into mandatory reviewer ceremony or test-artifact authorship by production roles.

### D5. Preserve external-operation and costly-attempt gates

Shift-left changes sequencing, not authority. Remote/shared, credentialed, physical, costly, destructive, deployment, installation, and activation actions remain owner-controlled. The existing live-attempt gate, preserved-bundle replay, fail-closed cleanup/restoration, and equivalence requirements remain controlling.

### D6. Keep one complete source and short role deltas

`global/AGENTS.md` owns the complete portable rule. `change-ready-sdlc` adds qualification detail. Canonical loop, project templates, maintainer instructions, planning skills, OpenSpec config, and evidence docs carry only concise routing or role-specific deltas. A deterministic validator checks exact markers on maintained mirrors but does not claim semantic adherence.

### D7. Retain only with same-model behavior evidence

Use the same synthetic roadmap prompt, model, variant, workspace, and active config for baseline and candidate. Required oracles are: early harness/precondition work; first authorized safe real characterization before dependent emulator expansion; explicit fidelity ladder; exact deferred-boundary blocker/unblocker; dependency-chain stop rule; no bypass of authorization, physical safety, restoration, cleanup, or live-attempt gates. Keep the instruction change only if the candidate preserves all baseline safety behavior and adds the missing explicit cadence evidence.

## Risks / Trade-offs

- [The rule may cause frequent owner questions] -> Ask only when external authorization is the exact blocker to the next invalidatable dependency; continue independent work.
- [Teams may treat read-only as physically safe by assumption] -> Require independently enforced effects suppression, identity, state, restoration, and project-specific safety evidence.
- [Repeated real runs can add cost or wear] -> Reuse immutable observations while environment, candidate dependency, and acceptance facts remain compatible; rerun only affected lanes.
- [More instruction text increases context] -> Consolidate related proof wording, keep one complete source, and inspect before/after inventory.
- [Exact markers can produce cargo-cult prose] -> Treat them as drift tripwires only and require same-model semantic evaluation.

## Migration Plan

1. Add and strictly validate this change contract.
2. Update the canonical authority and short maintained mirrors without performing external operations.
3. Add deterministic marker validation and focused fixtures through the permitted test-only role.
4. Run the candidate same-model roadmap workflow in a fresh OpenCode process and compare it with the preserved baseline.
5. Run focused contracts, strict repository validation, complete tests, strict OpenSpec validation, source/loader diagnostics, and instruction inventory.
6. Restart is left to the user after handoff; no install, activation, commit, push, or release occurs.

## Open Questions

None. Product-specific safe-live envelopes and authorizations remain decisions of each target project and are intentionally not generalized here.
