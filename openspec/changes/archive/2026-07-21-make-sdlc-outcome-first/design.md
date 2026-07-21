## Context

The current runtime policy contains two individually reasonable controls that conflict when combined. The Change-Ready closed-world firewall freezes acceptance criteria, tasks, write paths, artifacts, gates, and one correction wave before the first candidate mutation; a second serious failure, final-review rejection, or delivery rejection terminates the attempt. Separate autonomy rules require the main session to continue safe work and prohibit a partial handoff from ending an unfinished root goal.

In practice, attempt termination can be interpreted as root-goal termination. The main session can then ask the user to approve an internal revision even when it has not diagnosed the failure and safe local reversible work remains. The user receives neither a working result nor enough evidence to make a product decision.

The current policy is distributed across `global/AGENTS.md`, `global/skills/change-ready-sdlc/SKILL.md`, project-facing mirrors, the Universal Development Loop, final-review wording, TypeScript contract constants, active-authority validation, and focused tests. The change must replace the conflicting model coherently without weakening leaf-role isolation, candidate evidence invalidation, unrelated-work protection, protected-action authority, the Pilot-Ready safety floor, or finite qualification attempts.

The owner selected **local reversible dependency closure** as the default autonomy boundary. An agent may autonomously expand the implementation footprint when evidence shows the work is necessary for the accepted outcome, remains local and reversible, and crosses no protected boundary. The owner did not authorize automatic public-contract, persisted-data, security/privacy/authorization-semantic, destructive, remote, deployment, credential, privilege, or product-policy changes.

## Goals / Non-Goals

**Goals:**

- Keep the accepted outcome, operating envelope, non-goals, non-deferrable invariants, and protected boundaries stable while allowing evidence-driven local reversible implementation discovery.
- Make qualification rejection terminal for one candidate attempt, not automatically terminal for the root user goal.
- Continue safe diagnosis and repair without asking the user to approve internal lifecycle bookkeeping.
- Preserve anti-loop controls by forbidding unchanged-candidate retry and requiring concrete progress before another qualification attempt.
- Deliver the smallest useful proven result before asking about deferrable debt or contained material risk, except where a user decision is required to choose behavior or cross a protected boundary.
- Make every true blocker handoff self-contained and decision-ready.
- Keep reviewer and SDET findings evidence-only and non-authorizing; main remains the sole classifier and orchestrator.
- Replace current instruction text and validator contracts without adding a runtime service, state store, validation framework, or instruction-context growth.

**Non-Goals:**

- Automatically cross protected boundaries or waive security, privacy, authorization, data-integrity, irreversible-action, or envelope-escape risk.
- Treat every newly discovered idea, cleanup, abstraction, compatibility mode, test, tool, or hardening opportunity as necessary dependency closure.
- Permit retry-until-green, unlimited review loops, repeated unchanged-candidate qualification, or erased failure history.
- Let reviewers, SDET, delivery roles, severity labels, or validation output directly authorize mutation.
- Redefine `Ordinary Small | Material`, remove Change-Ready or Pilot-Ready, weaken mandatory Material gates, or authorize external operations.
- Add a third readiness profile, durable workflow database, lifecycle coordinator, generalized semantic classifier, or reusable evidence product.
- Modify prior historical OpenSpec artifacts solely to rewrite their recorded decisions.

## Decisions

### 1. Split product authority, implementation discovery, candidate state, and qualification state

The runtime model will use four distinct layers:

```text
Outcome authority capsule
  accepted outcome + envelope + non-goals + invariants + protected boundaries
                         |
                         v
Mutable implementation footprint
  tasks + local paths + artifacts + focused checks necessary for the outcome
                         |
                         v
Candidate snapshot
  current readable implementation and evidence reference
                         |
                         v
Finite qualification attempt
  proof + SDET + validation + final review + delivery where applicable
```

Only the first layer is user-owned scope. The second is an evidence-driven plan owned by the main orchestrator inside accepted authority. Candidate mutation invalidates affected evidence. A qualification failure rejects the fourth layer and current candidate readiness but does not silently close the first layer's unfinished goal.

Alternative rejected: retain the closed-world file/task lock and improve only handoff wording. That would make the handoff clearer but preserve the false requirement that normal implementation discovery needs owner approval.

### 2. Define scope expansion by outcome and protected boundaries, not path inventory

The pre-mutation brief will freeze the accepted result and protected boundaries rather than claim that an initial file list is complete. A newly required local path or task is autonomous dependency closure only when all conditions are evidenced:

1. It is necessary for the accepted outcome or a non-deferrable invariant.
2. It is local and reversible.
3. It preserves accepted public, data, security, privacy, authorization, deployment, and product semantics.
4. It crosses no credential, elevation, destructive, remote, irreversible, cost, legal, or owner-controlled boundary.
5. It is the smallest sufficient change and preserves unrelated work.

The main session records traceability and invalidates candidate evidence before continuing. Optional improvements remain residual or separately approved.

Alternative rejected: treat any new subsystem, path, task, configuration, or tool as owner-controlled scope. Artifact category is a poor proxy for risk and recreates process blocking on ordinary dependencies.

Alternative rejected: automatically perform everything technically necessary, including public API, migration, security-semantic, deployment, or destructive changes. That would optimize autonomy by spending authority the user did not grant.

### 3. Keep qualification finite per candidate attempt

One attempt retains one initial fresh SDET, at most one in-attempt correction wave, at most one fresh corrected-candidate SDET when consumed, one final review, and one Material delivery review when required. A second serious failure or final/delivery rejection remains terminal for that attempt and produces `Change-Ready: no` for that candidate.

After attempt closure, the main session performs bounded read-only diagnosis. It may return the root goal to implementation and create a new candidate attempt without user approval only when diagnosis establishes an authorized local reversible repair. Another attempt requires concrete progress: a candidate mutation, a technically enforced narrower envelope that retains useful accepted value, or correction of a demonstrated environment/evidence defect. The same unchanged failure cannot be replayed.

Alternative rejected: remove correction budgets and let the same attempt loop until green. This would reintroduce unbounded reviewer polish, flaky retry, and stale-evidence risk.

Alternative rejected: require owner approval for every new attempt. Attempt identity is audit bookkeeping, not a product or risk decision.

### 4. Route evidence through main without granting leaf authority

Leaf roles continue to return `Blocking Evidence`, `Residual Risks`, and non-authorizing `Follow-up Candidates`. A final or delivery rejection does not mutate or reopen its inspected attempt. Main diagnoses the evidence after closure and chooses one of four routes:

| Route | Meaning | Main action |
| --- | --- | --- |
| Outcome blocker | Accepted observable result does not work | Continue authorized diagnosis and repair |
| Non-deferrable blocker | Safety, integrity, irreversible-action, or envelope invariant fails | Remove, contain, narrow, repair, or request a protected-boundary decision |
| Contained material limitation | Useful result works with bounded reachable risk | Preserve candidate; present one post-proof acceptance bundle before `Pilot-Ready: yes` |
| Deferrable technical debt | Does not invalidate current outcome or invariant | Record once at handoff; do not interrupt implementation |

This classification belongs to the active primary orchestrator because it combines user intent, candidate evidence, and authority boundaries. Deterministic tools enforce explicit contract markers only and do not infer semantic classification.

### 5. Make result-first debt handling explicit

The main session first proves the smallest useful working candidate inside a technically enforced envelope. It does not ask the user to perfect optional architecture, maintainability, future-scale, unreachable edge, or evidence-polish items during implementation. Those items are batched in one residual bundle at handoff.

Reachable contained material pilot risk is also presented as one bundle after working-result evidence exists, unless its decision is needed earlier to select behavior. Existing Pilot-Ready rules still require explicit acceptance before `Pilot-Ready: yes`. Uncontrolled authorization, privacy, data-integrity, irreversible-action, or envelope-escape risk remains non-waivable and cannot be relabeled as debt.

Alternative rejected: ask the user about every discovered risk immediately. That converts engineering triage into repeated product interruptions before the user can evaluate a concrete result.

### 6. Require a decision-ready blocker handoff

Before asking the user, main must exhaust safe bounded read-only diagnosis, available local reversible alternatives, and useful enforced-envelope narrowing. A true blocker question contains:

- accepted outcome and current working status;
- exact symptom, reproducer, failed check, and evidence;
- root-cause status and confidence;
- autonomous paths already attempted;
- why no authorized path remains;
- the exact permission, capability, semantic decision, or material-risk acceptance required;
- real alternatives and their consequences when they exist;
- residual risk and preserved candidate/workspace state.

Internal terms may appear as audit detail but cannot be the decision. The user is never asked merely to approve `Revision N`, another correction wave, retry, or continuation. If no user action can unlock progress, the session reports an evidence-backed technical impossibility or missing capability instead of inventing a choice.

### 7. Replace canonical and mirrored instruction text as one semantic migration

Canonical ownership remains:

- `global/AGENTS.md`: concise always-loaded outcome authority, protected-boundary, continuation, debt, and blocker-question invariants.
- `global/skills/change-ready-sdlc/SKILL.md`: full qualification-attempt state transitions, failure routing, candidate evidence invalidation, and result/debt disposition.
- `instructions/leaf-reviewer-agent-contract.md` and role prompts: evidence and recommendation rules only; no user questions or mutation authority.
- `REPO_AGENTS.md`, `instructions/reusable-project-agent-instructions.md`, `instructions/universal-development-loop.md`, and `templates/project/AGENTS.md`: compact compatible mirrors without the complete canonical block.

`global/agents/final-candidate-reviewer.md` requires only a narrow wording update: its verdict remains terminal for the inspected attempt, while main owns later root-goal routing. Other role agents change only if exact contradictory text is found during implementation.

The implementation replaces, rather than appends to, closed-world phrases such as `post-freeze scope may only shrink`, owner approval for `new revision or separate change`, and root-level terminal correction wording. Existing instruction inventory budgets remain non-increasing for `global/AGENTS.md` and the combined changed runtime corpus.

### 8. Migrate existing deterministic contracts instead of creating new infrastructure

Current ownership is concentrated in `tools/contracts/reviewer-binding.ts`, `tools/contracts/skills.ts`, `tools/validators/active-authority.ts`, `tools/validators/routing.ts`, `tools/validators/devkit-contract.ts`, and focused Change-Ready tests. Their closed-world marker arrays and diagnostics will be replaced with explicit outcome-authority markers:

- accepted outcome and protected boundaries remain stable;
- necessary local reversible dependency closure is autonomous;
- findings remain non-authorizing;
- current-attempt termination does not automatically terminate the root goal;
- internal revision or correction exhaustion alone cannot require user approval;
- unchanged-candidate retry remains forbidden;
- user questions require exact authority and decision-ready evidence.

Static validation can reliably detect required canonical markers and known superseded phrases. It cannot decide whether arbitrary work is truly necessary, local, reversible, safe, or semantically unchanged; those remain behavioral-review judgments.

### 9. Use representative fresh-session behavioral evaluations

Static token checks cannot prove correct runtime routing. Fresh-session evaluations will exercise six representative cases:

1. Correction budget exhausted, local read-only diagnosis and reversible repair available: continue without a question.
2. Final review rejects an accepted-outcome defect with a local reversible repair: close the attempt, route a new candidate automatically.
3. Working result with only deferrable debt: hand off the result and one residual bundle.
4. Working result with a contained material limitation: ask once after proof before `Pilot-Ready: yes`.
5. Only viable path crosses a protected boundary: issue a complete decision-ready question before action.
6. Repeated unchanged failure with no credible path: stop replay, retain evidence, and report the exact technical blocker without revision jargon.

Evaluation evidence records observed tool order, whether `question` was called, candidate mutation boundaries, failure preservation, and the final handoff. It does not introduce a lifecycle simulator, persistent eval service, or exhaustive scenario matrix.

### 10. Keep continuous-learning signals orthogonal

The active `integrate-continuous-sdlc-learning` change already treats correction-budget exhaustion and explicit workflow friction as possible prevention signals. This change does not depend on that adapter and does not make learning capture a delivery gate. If both changes are implemented, process-only blocking may emit a prevention signal while current-task diagnosis and repair continue independently.

## Risks / Trade-offs

- **Necessary dependency closure could be interpreted too broadly** -> Require traceability to the accepted outcome or non-deferrable invariant, local reversibility, protected-boundary exclusion, smallest-sufficient remedy, and preservation of unrelated work.
- **Automatic new attempts could recreate infinite loops** -> Keep one correction wave per attempt, prohibit unchanged-candidate retry, require new root-cause evidence plus a relevant change, and stop with a complete technical blocker when no credible path remains.
- **A working-result bias could hide serious risk as debt** -> Preserve explicit non-waivable authorization, privacy, data-integrity, irreversible-action, and envelope-escape blockers plus enforced-envelope evidence.
- **More autonomous paths can increase changed-file count** -> Judge authority by necessary outcome dependency rather than file count, retain exact traceability, and keep optional cleanup outside the change.
- **Canonical and mirrored surfaces may drift during migration** -> Update all configured authority surfaces and contract arrays in one candidate, then run deterministic cross-surface tests and fresh-session evaluations.
- **Static validators cannot prove semantic necessity** -> Limit validators to explicit structure and known contradictions; use behavioral evaluations and independent instruction review for judgment.
- **Concurrent implementation with continuous-learning work may overlap instruction and validator files** -> Reconcile active candidate ownership before mutation, serialize overlapping writers, and integrate one coherent instruction corpus before validation.
- **Changing loaded global instructions affects future sessions** -> Keep repository candidate and activation separate; do not install, reload, or change active `OPENCODE_CONFIG_DIR` without explicit authority.

## Migration Plan

The implementing session SHALL continue to obey the active pre-change instructions. This candidate cannot retroactively grant itself the new dependency-closure authority; the migration therefore freezes and follows the exact current-session scope/gate rules while testing the proposed semantics only through the candidate global configuration. The new policy becomes runtime authority only after a separately authorized installation or activation and a new or restarted session.

1. Inventory the exact current authority surfaces, marker constants, validators, fixtures, and active overlapping work before mutation.
2. Replace canonical runtime semantics in `global/AGENTS.md` and `global/skills/change-ready-sdlc/SKILL.md` while preserving protected actions, role separation, candidate invalidation, and readiness gates.
3. Update only contradictory project-facing mirrors and final-review role text; preserve conforming artifacts unchanged.
4. Replace closed-world contract constants, diagnostics, and fixtures in existing TypeScript owners with outcome-authority and process-only-blocker contracts.
5. Run production-side static validation and observable instruction discovery/proof without modifying test artifacts.
6. Dispatch fresh SDET to update focused automated contract and behavioral-evaluation evidence, including the six representative cases.
7. Run complete project-native validation, independent instruction-artifact review, fresh final candidate review, and Material delivery review against the same candidate.
8. Leave activation, installation, commit, push, merge, release, and archive as separate explicitly authorized operations.

Rollback restores the complete scoped repository candidate to its captured baseline through the project-native safe restoration mechanism; it never uses a broad destructive reset or overwrites unrelated work. If a candidate was separately activated, runtime activation rollback restores the prior active global configuration and restarts or reloads only with explicit authority. Repository rollback and activation rollback remain distinct.

## Open Questions

None. The owner selected local reversible dependency closure and retained explicit approval for protected boundaries.
