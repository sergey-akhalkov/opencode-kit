## Context

The repository already has an Ordinary Small path, smallest-happy-path language, explicit scope control, and finite Change-Ready qualification. Those controls prevent some overwork, but they do not provide a first-class disposition for a useful limited pilot, and several instruction surfaces still optimize for complete pre-resolution or complete evidence packaging before recognizing a working result.

The practical failure is not poor review quality. Evidence-backed findings are often valid. The failure is that validity, current-slice reachability, readiness impact, correction authority, and future hardening are not separated consistently. A finding outside the behavior reachable by a technically enforced pilot can therefore expand specification or block all useful-result reporting. Evidence formatting can also become indistinguishable from evidence needed to know what was tested or authorized.

This is a loaded instruction-policy change and is Material under the current routing. It must use the existing Change-Ready qualification path for its own implementation. It does not install or activate global configuration, deploy a pilot, or perform a remote operation.

## Goals / Non-Goals

**Goals:**

- Optimize default development for the earliest useful working increment that satisfies the accepted outcome inside an enforced operating envelope.
- Make scope reduction the first response to complexity and risk, before adding mechanisms or abstractions.
- Add one local `Pilot-Ready` disposition without adding a third lifecycle profile or a second development loop.
- Preserve explicit user control over material residual risk while avoiding questions for minor, theoretical, or unreachable risk.
- Keep all valid reviewer findings visible while making current-slice blocking depend on reachability and accepted impact.
- Make OpenSpec implementation-ready for the next working increment rather than exhaustive for the imagined final system.
- Preserve full Change-Ready qualification for explicit requests, project policy, and concrete Material risk that remains reachable after enforced scope reduction.
- Keep runtime instruction context flat or smaller by replacing conflicting prose and using canonical authority rather than repeating the policy in every artifact.

**Non-Goals:**

- No deployment, release, installation, activation, commit, push, merge, or other remote operation.
- No claim that risk acceptance replaces authorization, privacy, data-integrity, or irreversible-action controls.
- No weakening of project-required validation or explicit Change-Ready requests.
- No third profile, alternate lifecycle, new role, agent, skill, plugin, MCP server, state store, risk database, scoring system, or evidence service.
- No numeric risk score, probability guess, exhaustive edge-case matrix, or automatic semantic severity classifier.
- No blanket rewrite of every specialized reviewer or implementation skill. Shared behavior remains canonical; local files change only when they independently contradict it.
- No rewrite or scope expansion of `integrate-continuous-sdlc-learning`.

## Decisions

### 1. Define simplicity as minimum sufficient mechanism

The canonical rule is not shortest code or fewest checks. It is the least lifecycle complexity that satisfies the current accepted outcome and non-deferrable invariants inside the accepted operating envelope.

Before adding a mechanism, the agent evaluates remedies in this order:

1. remove an unnecessary capability;
2. narrow users, data, interfaces, modes, load, concurrency, or side effects;
3. reuse an existing platform, project, framework, or repository mechanism;
4. add one local guard, assertion, validation, or focused test;
5. add a new mechanism, state, configuration dimension, recovery path, compatibility path, or owner boundary;
6. add a reusable abstraction or subsystem.

Steps 5 and 6 require evidence that the earlier options cannot satisfy the current slice. If several new coordination, recovery, compatibility, or policy mechanisms would be needed, the main session presents a narrower slice before accepting the complex design.

Alternative rejected: use code size or line count as the simplicity metric. Short code can hide more states, coupling, and operational risk than a slightly longer explicit implementation.

### 2. Keep Ordinary Small and Material; add Pilot-Ready only as a disposition

The existing `Ordinary Small | Material` classification remains the only lifecycle profile choice. `Pilot-Ready` is an output disposition owned by the main session, not a profile and not a replacement for Change-Ready.

The compact output is:

```text
Pilot-Ready: yes | no | not requested
Change-Ready: yes | no | not requested
```

`Pilot-Ready: yes` means the candidate is suitable for the accepted limited-use envelope. It never authorizes deployment, release, installation, activation, credentials, or remote state. Those actions remain separately user-owned.

`Change-Ready` retains its current full-qualification meaning. A candidate may be `Pilot-Ready: yes` with `Change-Ready: not requested` or `Change-Ready: no` only when the Change-Ready blocker is proven outside the pilot envelope and does not undermine pilot candidate identity, proof, safety, validation, or risk acceptance.

Alternative rejected: add a third `Pilot` profile. That would duplicate routing, gates, role rules, and transition semantics.

### 3. Classify risk against technically reachable behavior

The main session first proposes the smallest useful operating envelope, then classifies the behavior that remains reachable. Relevant envelope dimensions include only those needed for the slice: allowed users or tenants, data class, read/write mode, interfaces, load, concurrency, persistence, side effects, and disable/rollback boundary.

A prose-only limit is not containment. The candidate or existing project mechanism must enforce each limit relied upon to remove a risk from reachability. If containment is missing, ambiguous, or bypassable, the risk remains reachable and normal Material routing applies.

Explicit Change-Ready requests and project-required qualification remain Material regardless of envelope. Loaded instruction changes that alter lifecycle or safety policy, including this change, remain Material. Existing approved canary or pilot operations may reduce product blast radius, but actual remote/deployment action still requires separate authority and any reachable named Material risk retains qualification.

Alternative rejected: allow a user to accept any risk and bypass qualification. Risk acceptance is governance evidence, not a technical control.

### 4. Define a minimum pilot safety floor

The main session may report `Pilot-Ready: yes` only when all applicable floor items are evidenced:

- one bounded user/system outcome and explicit non-goals;
- an operating envelope whose relied-upon limits are technically enforced;
- observable happy-path proof at the relevant real boundary;
- focused project-native validation for the changed boundary;
- protection of the critical invariant most likely to cause user harm, security/privacy failure, data loss, or uncontrolled side effects;
- enough diagnostics to detect material pilot failure;
- proportional disable, rollback, or containment when effects persist or can spread;
- a compact material residual-risk bundle explicitly accepted by the user before the pilot disposition;
- no unaccepted or uncontrolled authorization, privacy, data-integrity, irreversible-action, or envelope-escape risk.

The residual-risk bundle contains only material risks and states: reachable scenario, impact, containment, detection/recovery, evidence confidence, why deferral is useful, and the user decision. It does not require speculative probability numbers. P2/note and unreachable future risks are reported but do not require a question.

Alternative rejected: require explicit user approval for every known risk. That would recreate the same review and question bottleneck.

### 5. Route findings by reachability and current promise

Reviewers continue to report every evidence-backed finding. A finding blocks Pilot-Ready only when evidence shows all applicable conditions:

- the scenario is reachable inside the accepted enforced operating envelope;
- it violates the current accepted outcome, a pilot safety-floor item, a non-deferrable invariant, an explicitly accepted risk limit, or trusted mandatory validation;
- the impact is not merely wording, provenance polish, optional evidence, theoretical coverage, or future-scope maintainability.

A finding may still block Change-Ready under the stricter qualification contract while remaining non-blocking for Pilot-Ready. Review recommendations use the existing `Recommendation` field and state the smallest sufficient remedy or why removal, narrowing, reuse, or deferral cannot make the current slice safe. No new action-list output field is added.

Missing evidence blocks Pilot-Ready only when it prevents the main session from establishing candidate scope, current proof, enforced envelope, safety-floor compliance, material-risk acceptance, or an applicable trusted validation outcome. Missing heading names, report ordering, duplicated provenance, or optional packaging detail remains residual unless it makes one of those facts unreadable or untrustworthy.

Alternative rejected: downgrade or suppress valid findings. The change alters disposition, not evidence collection.

### 6. Make OpenSpec sufficient for the next increment

The OpenSpec authoring rule is replaced, not supplemented. A change defaults to one useful working increment. Its actionable artifacts resolve only decisions that can materially change that increment, its operating envelope, non-deferrable invariants, proof, or material risk.

The minimum slice contract is:

- `Outcome`;
- `Operating Envelope`;
- `Non-Goals`;
- `Non-Deferrable Invariants`;
- `Observable Proof`;
- `Material Residual Risks`;
- `Stop Line`.

Implementation readiness is reached when a capable cold-context implementer can build and prove the next slice without guessing a user-owned decision or a decision that changes material risk. Future scaling, variants, integrations, compatibility, or edge behavior remains future scope unless reachable in the current envelope.

Tasks represent meaningful behavior, evidence, or gate outcomes. Mechanical edits are grouped when they share one owner and validation result. A requirement-to-test matrix covers accepted current-slice requirements, not an imagined final product. Specification review stops when remaining findings are future-scope, unreachable, or polish-only.

Alternative rejected: retain the current `as detailed and unambiguous as possible` and `pre-resolve every decision` wording. It has no bounded stop condition and encourages specification as the product.

### 7. Preserve one canonical policy and small role deltas

The primary policy lives in `global/AGENTS.md`. The qualification-specific pilot interaction lives in `global/skills/change-ready-sdlc/SKILL.md`. Shared reviewer reachability and minimum-remedy behavior lives in `instructions/leaf-reviewer-agent-contract.md` as maintenance provenance and in the always-loaded shared reviewer invariant for runtime.

Role and planning artifacts carry only behavior that changes their own decisions. Specialized domain reviewers inherit the shared rule; their domain checklists remain valid but conditional on reachability and the accepted envelope.

The initial instruction write set is limited to:

- `global/AGENTS.md`
- `global/skills/change-ready-sdlc/SKILL.md`
- `global/skills/deep-task-planning/SKILL.md`
- `global/skills/next-step/SKILL.md`
- `global/skills/service-architecture-design/SKILL.md`
- `global/skills/openspec-consistency-review/SKILL.md`
- `global/agents/implementation-worker.md`
- `global/agents/sdet-quality-engineer.md`
- `global/agents/implementation-readiness-reviewer.md`
- `global/agents/openspec-architecture-reviewer.md`
- `global/agents/final-candidate-reviewer.md`
- `global/agents/session-delivery-reviewer.md`
- `instructions/leaf-reviewer-agent-contract.md`
- `instructions/universal-development-loop.md`
- `instructions/reusable-project-agent-instructions.md`
- `templates/project/AGENTS.md`
- `REPO_AGENTS.md`

`code-quality-audit`, `code-quality-reviewer`, `documentation-hardening-loop`, and `instruction-artifact-tuning` are read during implementation but are not initial write targets because they already contain the required no-perfection, stop-line, minimal-remedy, or replacement behavior. A concrete contradiction found during implementation is reported as a separate scope decision; it does not silently expand this change.

No runtime instruction artifact is added. Conflicting maximal-planning and duplicated readiness prose is replaced so `global/AGENTS.md` and the combined changed runtime instruction corpus do not grow by the existing `instruction:inventory` token proxy.

### 8. Extend existing deterministic contracts and focused evals only

Production support changes extend existing owners under `tools/contracts/` and `tools/validators/`. They verify explicit output tokens, canonical placement, forbidden duplicated blocks, and required positive/negative policy markers. They do not decide whether a risk is material, reachable, or accepted.

Fresh SDET owns focused test artifacts and covers at least these behavior classes:

- a single-user or read-only enforced slice avoids an unreachable future concurrency or mutation blocker;
- a prose-only pilot limit fails Pilot-Ready;
- an authorization or data-loss risk reachable in the pilot blocks despite user desire for speed;
- a material but contained residual risk requires explicit user acceptance;
- a future-scale or wording finding remains residual;
- a reviewer recommendation prefers remove/narrow/reuse before a new subsystem;
- a broad OpenSpec request produces one next working increment rather than exhaustive future tasks;
- missing semantic evidence blocks, while evidence-format polish alone does not;
- Change-Ready rejection outside the pilot envelope does not erase independently proven Pilot-Ready evidence;
- neither disposition authorizes a remote operation.

The expected production support write set is existing files only:

- `tools/contracts/agents.ts`
- `tools/contracts/reviewer-binding.ts`
- `tools/contracts/skills.ts`
- `tools/validators/active-authority.ts`
- `tools/validators/devkit-contract.ts`
- `tools/validators/routing.ts`

SDET test ownership is restricted to existing Change-Ready contract and validator test modules selected from:

- `tools/test-contracts-change-ready.ts`
- `tools/test-contracts-change-ready-delivery.ts`
- `tools/test-contracts.ts`
- `tools/test-helpers/library.ts`
- `tools/test-library/validator-change-ready.ts`

No test file is required to change when SDET proves existing tests plus focused additions in fewer listed files are sufficient.

## Risks / Trade-offs

- **Risk: Pilot-Ready is mistaken for general release readiness.** -> Always report the enforced envelope beside Pilot-Ready and retain `Change-Ready` as a separate field. Neither authorizes remote action.
- **Risk: Scope language hides reachable defects.** -> Only technically enforced limits remove reachability; prose-only constraints retain the risk.
- **Risk: User acceptance normalizes unsafe behavior.** -> The safety floor makes uncontrolled authorization, privacy, data-integrity, irreversible-action, and envelope-escape risks non-deferrable.
- **Risk: Deferred risks are forgotten.** -> Report only material residual risks with a concrete revisit trigger; production evidence, not speculative completeness, prioritizes the next slice.
- **Risk: Reviewers under-report future problems.** -> Keep all evidence-backed findings; change only current disposition and correction authority.
- **Risk: Two readiness fields add confusion.** -> Keep profiles unchanged, use exact definitions, and include both fields in one compact handoff.
- **Risk: Runtime policy drifts across copies.** -> Centralize semantics, keep role deltas small, and extend existing deterministic duplicate/authority checks.
- **Trade-off: A limited pilot may remain formally Change-Ready no.** -> This is intentional when full-release evidence is incomplete but the narrower pilot facts remain trustworthy.

## Migration Plan

1. Capture current focused validation and instruction-inventory baselines without writing a persistent evidence subsystem.
2. Replace canonical policy and OpenSpec authoring language, then align the bounded role and project-facing mirrors in the same candidate.
3. Extend existing deterministic contracts and validators without adding support files.
4. Prove the policy through current instruction loading/static validation and the representative Pilot-Ready scenarios.
5. Run fresh SDET on the exact test-only scope, then complete project-native validation, independent final review, and Material delivery review under the current governing process.
6. Do not install or activate the candidate. A later explicit operation may update the active global configuration after acceptance and restart/new sessions as required.

Rollback restores only this change's exact scoped instruction and support files to baseline. No runtime state or external system requires rollback because activation and remote operations are out of scope.

## Open Questions

None. The owner selected a limited pilot, separate Pilot-Ready and Change-Ready dispositions, and explicit approval for material residual risks only.
