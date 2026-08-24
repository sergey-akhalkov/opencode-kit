## Context

See `proposal.md` for motivation and the two capability deltas for normative behavior. The kit already has the right foundation: `principles-of-work.md` defines KISS, YAGNI, Gall's Law, AHA, single responsibility, cohesion, and low coupling; `global/AGENTS.md` requires context-efficient architecture and `split-or-justify`; `implementation-worker.md` preserves touched-file ownership. The missing piece is an explicit accountable decision about an evidenced next change, including the choice to add no seam when the evidence does not justify one.

The current validators correctly treat architecture markers as drift tripwires, while behavior changes to instructions require matched disposable model workflows. The existing `agent-tooling-ergonomics` proof runner already exercises installed authoring behavior in disposable repositories, preserves source/model/tool/file evidence, validates runtime behavior, and separates provider-free preflight/evaluation from configured-provider capture. That is the closest existing proof mechanism.

### Fidelity Ladder

`reviewed requirement deltas -> provider-free static fixtures and contract tests -> preserved baseline authoring captures on the unchanged global source -> candidate instruction and role deltas -> provider-free candidate preflight -> matched candidate authoring captures -> semantic diff/oracle review -> focused and complete repository validation`. The first real boundary is the actual installed OpenCode authoring path in disposable synthetic repositories. Baseline and candidate capture use the already authorized bounded synthetic provider-call envelope, non-sensitive prompts, isolated local roots, no external services, and deterministic cleanup. Evidence retains exact redacted invocations, effective source/model/variant/permission identity, raw events, file diffs, command exits/stdout/stderr, and cleanup state.

## Goals / Non-Goals

**Goals:**

- Make main the unambiguous owner of the direct-code-or-seam decision and integrated locality result.
- Make `openspec-architecture-reviewer` the semantic owner of the `architecture-and-change-locality` practice without granting it decision, mutation, or lifecycle authority.
- Keep the decision proportional: no extra artifact or specialist for trivial work, but one bounded Practice Owner observation when an explicit named change axis makes architecture material.
- Preserve the useful intent of SOLID and Gang of Four patterns without turning either into a compliance checklist.
- Reuse the current canonical philosophy, engineering-quality validator, role contracts, and disposable authoring proof path.
- Retain only instruction wording that improves the maintained behavior scenarios without increasing speculative structure or owner calls in negative controls.

**Non-Goals:**

- Define a universal application architecture, language-specific layer scheme, pattern catalog, architecture score, or file-count target.
- Add an autonomous architect/decision agent, widen existing reviewer authority, or require a Practice Owner call for zero-trigger Ordinary Small work.
- Require main to predict unaccepted future products, integrations, scale, compatibility, or variants.
- Refactor application code, unrelated instruction surfaces, or the general proof-runner ecosystem.

## Decisions

### Decision 1: Main owns the decision; the specialized subagent owns the practice

Main owns the concrete decision because it alone holds the accepted outcome, full dependency closure, delegation map, and final integration responsibility in every session. `openspec-architecture-reviewer` owns the `architecture-and-change-locality` practice: when a reviewed material trigger matches, it returns one bounded read-only observation that main dispositions before finalizing the design. When no trigger matches, direct cohesive work uses no owner call. Main communicates the selected responsibility/change-axis boundary through the existing `Required behavior/invariants` and acceptance portions of a production brief; no new mandatory brief field or architecture document is introduced. `implementation-worker` preserves that boundary or reports a conflict. `code-quality-reviewer` remains in the separate `simplicity-and-reuse` practice.

Alternative rejected: add an autonomous `architecture-agent` that selects or authorizes the design. It would separate result authority from implementation evidence. Alternative rejected: keep the existing architecture reviewer purely optional after a material trigger. That would leave practice ownership nominal and contradict the newer accepted responsibility split. The selected owner remains silent for zero-trigger work, so the original negative-control cost concern is preserved.

### Decision 2: Use an evidence-triggered pay-as-you-go decision ladder

The operational rule is:

```text
supported change axis or important invariant?
             |
       +-----+-----+
       |           |
      no          yes
       |           |
direct cohesive   can one narrow seam improve
implementation    current locality/testability/safety?
                         |
                    +----+----+
                    |         |
                   no        yes
                    |         |
                 direct     add that seam
```

Accepted requirements, existing/planned variants, inspected boundaries, state transitions, invariants, and source evidence are valid triggers. Generic possibility is not. A seam pays for itself only if it has current value and contains a named source of change. This keeps a small `switch` or direct dependency legitimate when it remains one cohesive owner, while allowing Strategy, Adapter, State, Command, Facade, or another shape when the actual pressure fits.

Alternative rejected: require OCP/DIP or an interface at every dependency. That creates one-implementation indirection and navigation cost. Alternative rejected: forbid anticipatory seams entirely. That makes explicitly accepted second variants and inspected external boundaries needlessly expensive.

### Decision 3: Consolidate canonical and operational wording instead of adding another policy block

Extend the existing single-responsibility/high-cohesion principle in `global/principles-of-work.md` with the pay-as-you-go next-change criterion. Replace the overlapping context-efficient-architecture paragraph in `global/AGENTS.md` with one concise main-decision and material Practice Owner route that retains all current `split-or-justify`, navigation, testability, no-wrapper, and zero-trigger protections. Add only role-specific deltas to `implementation-worker.md` and the registered owner body after `establish-practice-owner-agents` supplies the shared contract. Other maintained surfaces keep their current pointer or role delta unless an exact contract test proves a missing active route.

The implementation records the explicit owner-authorized philosophy change and its consequence: likely follow-up work should become cheaper, while speculative flexibility remains prohibited. The combined startup budget remains governed by the existing `library-instruction-artifacts` requirement, so new words must replace overlap rather than increase the boundary.

Alternative rejected: copy the full rule into every skill and agent. It would create drift and startup/on-demand context cost. Alternative rejected: place the complete policy only in the owner body. Main needs the compact trigger and direct-code negative control before dispatch.

### Decision 4: Extend existing structural engineering-quality contracts without semantic inference

Add compact exact markers for main decision accountability, registered Practice Owner routing, and evidence-triggered locality to `tools/contracts/engineering-quality.ts`, its maintained main/owner/worker surfaces, and focused fixtures. The validator reports only missing text, wrong routing, or forbidden autonomous-architect language. It does not parse code architecture, rank patterns, count files as quality, or infer whether a change axis is plausible.

Alternative rejected: implement a SOLID/pattern linter or architecture score. Those mechanisms would encode language-specific heuristics, reward proxies, and reject valid direct designs. Alternative rejected: rely only on prose review. Exact canonical ownership and role-routing drift are deterministic facts worth enforcing.

### Decision 5: Extend the existing disposable authoring proof path with change-locality scenarios

Reuse and extend the installed-authoring capture/evidence/cleanup mechanism currently owned by `agent-tooling-ergonomics.ts`; do not add a second runner or dependency. Add reviewed fixtures and scenario definitions for the capability population. Positive scenarios have an initial current task and a declared follow-up turn so locality is observed rather than merely promised. Negative controls stop after the current task and inspect for unnecessary structure and specialist routing. Runtime commands prove behavior; changed-file manifests and diffs expose navigation/locality; the evaluator verifies exact identities, effects, commands, and cleanup while main performs the semantic architecture comparison against the reviewed scenario oracle.

Before extending the runner, map its responsibilities. The accepted `split-or-justify` disposition is to keep the shared capture/evaluation owner intact because the new scenarios use the same installed actor, permissions, evidence schema, side effects, validation, and cleanup contract. Scenario prompts, fixtures, and semantic oracle records remain data or focused helpers rather than new branches scattered through capture logic. If current source inspection disproves that shared shape, extract only the cohesive scenario-data owner without redesigning the proof framework.

This is `extend + reuse`: reuse the current authoring proof runner, portable process/model-profile support, engineering-quality validator, and existing role surfaces. Cross-project discovery is `not-applicable` because the behavior and proof owner are repository-specific instruction assets already present in the selected source.

Alternative rejected: add all scenarios to the three-sample consumer-outcome baseline. That path is broader, more expensive, and couples a focused architecture claim to an unrelated persistent baseline. Alternative rejected: determine success from file count or pattern-name matching. Those are diagnostics only and cannot establish responsibility or change locality.

### Decision 6: Preserve a narrow claim ceiling

The change-level `CLC-001` record owns the complete claim scope. Structural validation proves only text ownership and routing. Matched captures prove only the maintained scenario population for the exact source/model/environment. Semantic review may conclude that candidate behavior improves those scenarios, but neither green tests nor the use of familiar patterns supports universal architecture, language, model, or repository claims.

## Risks / Trade-offs

- **[Risk] Main over-predicts future variation** -> require a named evidence source and current payoff; keep negative-control scenarios and direct code as the default.
- **[Risk] Main under-designs an accepted follow-up** -> exercise declared follow-up turns and inspect whether changes remain inside the named owner or boundary.
- **[Risk] More instruction text increases context cost** -> replace overlapping architecture text and enforce the existing combined startup boundary.
- **[Risk] Scenario-specific expected shapes become a proxy** -> use commands and diffs as facts, preserve multiple valid designs, and keep semantic disposition with main rather than deterministic scoring.
- **[Risk] Extending a large proof runner worsens ownership** -> keep only common capture mechanics in the runner, isolate scenario data, and apply the recorded split-or-justify fallback if inspection disproves cohesion.
- **[Risk] Owner observation becomes architecture approval** -> keep the owner read-only/non-authorizing, require main disposition and concrete decision proof, and assert no owner call in negative controls.

## Migration Plan

1. Wait for `establish-practice-owner-agents` to supply and prove the shared owner contract and registered `architecture-and-change-locality` route, then capture the unchanged-source baseline for every maintained change-locality scenario and verify identity, cleanup, runtime behavior, and evidence completeness before this change's instruction mutation.
2. Consolidate the canonical principle and main operational decision rule, then add the bounded registered-owner and production-role deltas without widening owner authority or adding another agent.
3. Extend exact engineering-quality markers, focused contract fixtures, and the existing disposable authoring scenario data/capture path with owner identity/report/main-disposition oracles.
4. Run provider-free preflight and focused tests, then capture the matched candidate scenarios through the installed authoring entry point.
5. Replay/evaluate exact facts, perform the semantic baseline/candidate disposition for `CLC-001`, and reject or narrow wording that adds speculative structure, loses current behavior, weakens safety, skips a material owner trigger, grants owner authority, or calls the owner in negative controls.
6. Run instruction budget, focused contract/proof tests, complete repository validation, and strict OpenSpec validation.

Rollback removes only candidate-owned instruction, contract, fixture, and proof-runner changes and leaves the preserved baseline evidence immutable. No installation, active-runtime replacement, commit, push, release, or remote mutation belongs to this change.

## Open Questions

None for this increment.
