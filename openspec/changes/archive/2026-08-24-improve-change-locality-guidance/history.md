# Strategy History

## 2026-08-23 - Pre-Apply Claim Record Continuation

- **Objective**: Enter apply without bypassing the broad-claim and active-writer gates.
- **Approach**: The first apply invocation relied on task 1.1 to create `ownership.json` and `evidence-index.json` after the apply gate; after the gate rejected the missing `CLC-001` record, return to planning continuation, materialize both reviewed records with mutation disabled, and rerun the same gate only against the now-satisfied prerequisite.
- **Evidence**: The initial apply gate exited `1` with blocking check `claim-evidence:records` and made no mutation. The continuation gate exited `0`, reports `CLC-001=unknown` with `0/7` observations, and preserves the unproved Practice Owner dependency and all missing baseline/candidate observations explicitly.
- **Outcome**: Selected and successful for structural gate readiness; implementation remains blocked on the separately recorded Practice Owner runtime dependency.
- **Reason**: A broad claim record is a pre-mutation planning control, so placing its creation inside the post-gate apply loop was a sequencing defect rather than an implementation failure.
- **Do Not Repeat Until**: The structured claim record is deleted, invalidated, or no longer matches the current proposal claim scope.
- **Evidence-Based Retry Condition**: Re-materialize only after a changed claim population, path, environment, oracle, maximum claim, task text, or schema invalidates the current record.

## 2026-08-23 - Dedicated Architecture Agent

- **Objective**: Identify one role that would track change-local architecture decisions across tasks.
- **Approach**: Consider adding or mandating a separate architect agent before implementation.
- **Evidence**: The loaded runtime already makes main the only role present for every accepted outcome, delegation decision, and final integration. Existing architecture and code-quality reviewers are read-only, optional, and non-authorizing; a new role would require another handoff and context reconstruction.
- **Outcome**: Rejected during planning.
- **Reason**: Separating the decision from main would increase process and context cost while leaving ordinary direct work uncovered.
- **Do Not Repeat Until**: Current behavior evidence shows that main ownership fails a maintained scenario and that the failure cannot be corrected by concise loaded guidance or an existing optional reviewer.
- **Evidence-Based Retry Condition**: A matched baseline/candidate evaluation reproduces a material architecture failure uniquely prevented by independent specialist ownership without adding a larger ordinary-work regression.

## 2026-08-23 - Practice Owner Without Architecture Decision Authority

- **Objective**: Apply the user's newer repository-wide responsibility decision to change locality without creating an autonomous architect or mandatory ordinary-work ceremony.
- **Approach**: Reuse `openspec-architecture-reviewer` as the registered `architecture-and-change-locality` Practice Owner only when a reviewed material trigger matches; keep main responsible for the concrete direct-code-or-seam decision, integration, proof, and disposition; keep zero-trigger work owner-free.
- **Evidence**: The user explicitly distinguished main responsibility for the result from specialized subagent responsibility for a practice. `establish-practice-owner-agents` defines a bounded read-only owner contract, exact triggers, no nested dispatch, no mutation/decision authority, and negative-control proof. This is not the previously rejected agent that owns or authorizes architecture decisions.
- **Outcome**: Selected as the revised responsibility allocation, dependent on the shared Practice Owner contract and runtime proof before this change mutates loaded behavior.
- **Reason**: It satisfies explicit practice ownership while preserving main's complete outcome context and the original no-extra-call fast path for trivial work.
- **Do Not Repeat Until**: N/A - this is the selected causally distinct strategy after changed accepted semantics.
- **Evidence-Based Retry Condition**: If matched routing/locality scenarios show that the bounded owner call adds an ordinary-work regression or fails to improve material-trigger control, narrow the trigger or revert only this responsibility delta while preserving proven pay-as-you-go design behavior.

## 2026-08-23 - Mandatory SOLID And Gang Of Four Compliance

- **Objective**: Make future evolution cheaper through a recognizable architecture discipline.
- **Approach**: Consider requiring SOLID principles or named Gang of Four patterns as implementation acceptance criteria.
- **Evidence**: One-off fixes and single implementations often become harder to navigate when wrapped in interfaces, factories, strategies, or plugin points. Pattern labels do not establish cohesion, responsibility, locality, current payoff, or runtime correctness.
- **Outcome**: Rejected during planning.
- **Reason**: It would optimize for visible pattern conformance rather than the cost of the next evidence-backed change.
- **Do Not Repeat Until**: A concrete supported language/domain contract requires one named pattern or equivalent public shape.
- **Evidence-Based Retry Condition**: Current requirements, compatibility obligations, or reproduced source pressure identify a specific pattern whose absence causes a material accepted-outcome or locality defect.

## 2026-08-23 - Reuse Existing Installed Authoring Proof Path

- **Objective**: Compare architecture guidance behavior without adding a parallel proof framework or architecture scorer.
- **Approach**: Extend the existing `agent-tooling-ergonomics` disposable authoring capture/evaluation path with reviewed change-locality scenarios and follow-up turns; keep deterministic checks factual and semantic disposition with main.
- **Evidence**: The runner already owns the required installed actor, source/model/permission identity, disposable edits, command/runtime observations, file evidence, provider-free evaluation, and cleanup. The broader three-sample consumer-outcome baseline is more expensive and couples this focused claim to unrelated scenarios; a new runner would duplicate lifecycle machinery.
- **Outcome**: Selected for the design, subject to a touched-responsibility map before extension.
- **Reason**: It is the smallest verified owner with a matching input/effect/evidence contract.
- **Do Not Repeat Until**: N/A - this is the selected strategy, not a failed attempt.
- **Evidence-Based Retry Condition**: Source inspection disproves the shared responsibility or reveals that extending the runner would materially worsen locality; then apply the design's narrow scenario-data extraction fallback without redesigning capture/evaluation.
