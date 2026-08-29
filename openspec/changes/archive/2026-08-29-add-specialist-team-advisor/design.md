## Context

See `proposal.md` for motivation and the `STA-001` claim boundary. The current runtime makes main the default production author and sole specialist selector while also requiring it to preserve outcome, safety, worktree, proof, validation, compaction, and specialist-liveness obligations. Practice ownership reduces detailed rule context, but `library-practice-ownership` currently forbids a second central routing agent and relies on main to recognize every trigger directly.

Maintained evidence already bounds the problem: the seven `CLC-001` scenarios called the architecture Practice Owner in three material cases and missed it in two, while one practice-owner scenario launched overlapping protocol and wire owners. Structural registry/profile checks prove availability and ownership, not timely semantic selection.

The current role inventory contains no cohesive team-topology owner:

- `implementation-readiness-reviewer` owns the registered `outcome-readiness` practice and is being extended by `add-bounded-falsification-review` for decision-material challenge.
- `qwen-local-worker` is a generic bounded first-pass helper, is not in default `core`, and has no authority or contract for root-wide team topology.
- Skills inject procedural memory into main but do not supply a fresh independent context or remove routing analysis from main.
- Practice Owners judge only their exact practice and cannot dispatch or route other owners.

The design therefore adds one non-owning advisor while preserving the main-only orchestration kernel.

## Goals / Non-Goals

**Goals:**

- Make mission success, not direct task volume, main's primary optimization target.
- Move non-trivial team-topology analysis into one fresh bounded context.
- Keep main responsible for goal, authority, decomposition, final selection, dispatch, liveness, integration, course correction, Runtime Proof, and final result.
- Select the smallest sufficient mix of direct main work, skills, Practice Owners, workers, and independent specialists from the actual active runtime catalog.
- Let main verify specialist work through attributable artifacts, critical facts, integration, and real-boundary evidence without repeating the complete work by default.
- Preserve direct handling for trivial owner-local work and repeated advice only for material topology change.

**Non-Goals:**

- Nested orchestration, autonomous team dispatch, or a second root controller.
- A fixed planning/implementation/testing/review sequence.
- An all-agent checklist, launch-count target, semantic ranking helper, or universal routing guarantee.
- Replacing Practice Owner applicability, bounded falsification review, SDET, completion guard, or campaign orchestration.
- A parallel team-routing skill, persistent team database, or automatic per-turn plugin call.
- Reworking every existing agent description or role in this increment.

## Responsibility Model

```text
User / accepted OpenSpec mission
                 |
                 v
       +--------------------+
       |        main        |
       | goal and authority |
       | dependency control |
       | dispatch/liveness  |
       | integration/proof  |
       +----------+---------+
                  |
        one bounded request
                  v
       +--------------------+
       | specialist-team-   |
       | advisor            |
       | team topology only |
       +----------+---------+
                  |
           engagement map
                  v
       +----------+----------+----------------+
       |                     |                |
   procedural skill     Practice Owner   worker/reviewer
   main executes it     exact practice   bounded evidence
       |                     |                |
       +---------------------+----------------+
                             |
                             v
                    main integrates and
                    proves mission outcome
```

Main owns the mission spine, not an implementation monopoly. The mission spine consists of accepted outcome and constraints, dependency state, work-package ownership and liveness, integration decisions, candidate/evidence identities, real-boundary observations, finding disposition, and the next course correction. Main may write code or perform analysis directly when that route has lower total mission cost or inseparable global context, but self-authorship is not evidence of control.

## Decisions

### 1. Add one dedicated non-owning advisor

Create `global/agents/specialist-team-advisor.md` as a fresh read-only control-plane helper. It is not a Practice Owner, reviewer verdict source, worker, SDET, or orchestrator. Its one job is to return a smallest-sufficient-team engagement map for the supplied root mission and current evidence.

The agent inherits the invoking primary model by adding `specialist-team-advisor` to the existing `INHERIT_FROM_PRIMARY_AGENTS` contract and its focused model-profile tests; no explicit model-route entries are added. It receives a low bounded step count and uses the existing wildcard-deny-then-exact-allow pattern: deny wildcard and ordinary tools first, then allow only read, glob, grep, and `specialist_catalog`. It denies bash, edit, question, task, skill, network, remote, destructive, and external-directory access. Add one dedicated non-reviewer validator branch before generic reviewer checks so no feedback-ledger edit or `complain` permission is required.

Use this exact concise discovery contract: `Use before deciding to select or omit maintained routes in a new non-trivial parentless root mission; returns the smallest sufficient team. Stay quiet only for one already-selected existing-owner action with known proof.` The body owns the complete objective bypass and output semantics; the description remains concise, canonically owned, context-qualified, and covered by loaded discovery proof. Inventory size remains diagnostic.

**Alternatives considered:**

- Extend `implementation-readiness-reviewer`. Rejected because default team composition, mid-task topology changes, and skill/worker routing are distinct from its registered outcome-readiness practice and would overlap the active bounded-falsification change.
- Reuse `qwen-local-worker`. Rejected because its generic helper contract and default-profile absence do not establish a stable root-team responsibility.
- Add only a skill. Rejected because it leaves the same main context performing the high-load routing decision.
- Add an autonomous nested orchestrator. Rejected because it duplicates main authority and complicates writer/session liveness and integration.

**Reuse disposition:** `build-minimal`. Current repository agents were inspected; none fits the team-topology contract without broadening a live owner. Platform support for subagent files and custom read-only tools is reused. Cross-project discovery is `not-applicable` because this is a repository-specific OpenCode control surface and no configured peer source is needed to select the local owner.

### 2. Invoke after initial foraging, not at a fixed lifecycle stage

The compact main rule becomes:

```text
If current evidence proves one trivial owner-local action with known proof,
work directly. Otherwise, after enough foraging to state the mission and
unknowns but before substantial execution or behavior mutation, obtain one
specialist-team-advisor map. Reconsult only after a material topology change.
```

Initial foraging remains main-owned because the advisor needs grounded facts rather than a raw user prompt reconstructed without repository evidence. Foraging is complete when main can name the original goal reference, observed repository/task state, material unknowns, current candidate/worktree identity, and operating constraints. Reads, searches, status inspection, and an empty OpenSpec scaffold are allowed; a decision-material plan, source/config/test/instruction mutation, or broad execution is not.

The advisory episode belongs only to a parentless user-facing root session accepting a new outcome. Child specialists, completion/compaction agents, campaign executors, and propose/apply transitions continuing one accepted outcome do not create new episodes. A materially new accepted user outcome in the same parentless session starts a new episode; a material topology change inside the existing outcome follows the one-reconsultation rule instead.

The trigger is semantic and event-driven. It is not tied to OpenSpec proposal, implementation, MVP, review, or completion phases. A non-trivial read-only audit or investigation may also use advice; an exact local documentation or mechanical fix may bypass it.

**Alternative considered:** Call the advisor on every root task. Rejected by the owner's selected policy because trivial owner-local work would pay constant latency without a plausible team benefit.

### 3. Give the advisor the actual runtime catalog through one read-only tool

Create one cohesive standalone `global/extensions/specialist-catalog.ts` plugin as `no-current-owner -> build-minimal`. `global/extensions/` is not an auto-discovered plugin directory, so adding reviewed source does not activate the tool in the current live global runtime. The file owns only the `specialist_catalog` read-only tool and root-effective artifact projection; it does not extend the already mixed `global/plugin/session-env.ts` composer. Add the exact file to `core`; `all` already includes the extensions directory. The core renderer emits a plugin array containing only the materialized catalog-plugin URL; it never copies the all-profile template plugin list. The all profile keeps its current directory/template path and adds the catalog plugin explicitly exactly once. No new profile-entry kind is added.

Plugin initialization performs no catalog lookup and never throws because a listing API is absent; all discovery and fail-closed diagnostics occur inside tool execution so ordinary core startup remains available. The tool itself verifies that the caller is an attributable `specialist-team-advisor` child and resolves its parentless root before returning data. Main and every other agent receive a closed failure with no catalog entries. Provider-free preflight verifies current custom-tool permission overlay, caller identity, root resolution, and missing-API startup behavior before profile or behavior mutation. If OpenCode cannot enforce those conditions, the catalog lane remains blocked rather than making the tool broadly callable.

The tool returns a versioned, stable, privacy-safe projection of the agents and skills actually available to the parent root session:

```text
schemaVersion
rootSessionRef
catalogRef
redacted runtime/profile/source class and digest
agents[]: safe id, class, capped sanitized description, availability
skills[]: safe id, capped sanitized description, availability
warnings[]
```

`rootSessionRef` and every session/caller reference are hashes. Absolute paths, raw session ids, prompts/bodies, hidden agents, guard-only or non-dispatchable control-plane agents, the advisor itself, secrets, and credentials are omitted. Unsafe project descriptions are redacted or rejected with a bounded warning.

For installed OpenCode 1.18.25, the tool uses the official SDK `client.app.agents({ directory })` and `client.app.skills({ directory })` runtime listings plus `client.session.get({ directory, sessionID })` identity. Provider-free route comparison showed that these legacy-named app routes expose the complete file-backed root-effective catalog while `client.v2.agent.list` and `client.v2.skill.list` return empty arrays under the same location. The generated runtime-surface manifest is used only as a repository-managed profile/source cross-check, not as a substitute for project-level or merged runtime availability. If the official runtime cannot expose a complete root-effective catalog, implementation stops this lane and revises the smallest catalog adapter with explicit `unknown`; it does not fall back to copied prompt rosters or semantic path inference.

The advisor calls `specialist_catalog` itself. Main supplies original goal and current task evidence but does not copy twenty descriptions into the brief. The catalog tool performs no semantic matching and cannot choose or rank a team.

**Alternatives considered:**

- Embed a static roster in the advisor. Rejected because profiles, project agents, skills, and descriptions drift.
- Ask main to manually paste the tool catalog. Rejected because it preserves the cognitive and context burden being removed.
- Infer specialists from paths or keywords in TypeScript. Rejected because it creates brittle hidden semantic policy.
- Persist a routing database. Rejected because current availability is runtime state and no durable scheduling store is required.

### 4. Use one bounded engagement-map contract

The advisor output is concise and machine-capturable but semantically authored:

```text
Team Advice: main-alone | team-recommended | unknown
Effective Model
Mission / Candidate / Catalog References
Task Topology
Mission Spine Retained By Main
Work Packages
  - objective and non-goals
  - main | skill | agent
  - exact available artifact
  - unique value and expected evidence
  - invoke now | activation evidence
  - dependencies / safe parallelism
  - read/write/authority boundary
  - dispatch-ready brief delta
Considered Omissions
Evidence Gaps
Reconsultation Condition
```

`main-alone` is a first-class successful result. A recommended agent must add a unique bounded question, fresh evidence, or isolated execution value. A skill is selected when procedural guidance in main is sufficient. Conditional specialists remain dormant until their named input exists. The map never schedules roles solely because a lifecycle stage or role name exists.

Main dispositions the map before dispatch. It may narrow or reject a recommendation using direct evidence. It records only accepted work packages, exact omissions that remain material, and the reconsultation condition; it does not preserve the full catalog or report prose.

### 5. Make delegation a mission-economics decision

Main compares focused-context value against briefing, execution, liveness, and integration cost without numeric scoring:

```text
delegate when:
  fresh or specialized context adds unique evidence
  OR a write package is isolated and independently checkable
  OR independent challenge materially reduces anchoring risk

work directly when:
  global integration context is inseparable
  OR the bounded action is cheaper and clearer than its handoff
  OR no specialist adds unique value
```

The advisor explains the evidence for this choice; deterministic tooling does not calculate it. Main can manually pilot any work package but cannot treat self-execution as proof that the mission is controlled.

Main verifies delegated results through exact task/child identity, ownership and liveness closure, changed artifacts, assumptions, evidence, critical source facts, integration, and the nearest sufficient real boundary. It does not rerun the complete bounded specialist analysis merely for reassurance. Contradiction, stale identity, unexplained failure, material evidence gap, changed requirements, or a reachable non-deferrable risk reopens the relevant analysis.

### 6. Preserve exact Practice Owner and specialist boundaries

The advisor may recommend a Practice Owner only by naming task evidence that matches the reviewed material or uncertainty trigger. The owner still decides practice applicability and returns only its practice observation. Advisor advice neither satisfies nor suppresses a matched owner trigger.

Replace the current ambiguous always-loaded kernel sentence with the narrower distinction: `A matched registered practice trigger launches only that Practice Owner; zero-trigger work launches no Practice Owner. The non-owner team advisor follows its separate parentless-root mission trigger and never satisfies or suppresses a matched practice trigger.` Apply the same distinction to `instructions/practice-owner-agent-contract.md` without copying the complete team-advice procedure there.

The advisor may recommend:

- `implementation-readiness-reviewer` when the distinct outcome-readiness or bounded-falsification trigger applies;
- a skill when main needs procedural memory without fresh judgment;
- `implementation-worker` for one isolated production-only package;
- SDET only when the existing named critical-risk or explicit trigger applies after current proof;
- optional reviewers only for a concrete evidence-backed risk;
- `qwen-local-worker` only for its existing bounded first-pass contract.

Only main dispatches, resumes, cancels, integrates, or dispositions these roles. Existing fan-out and universal writer-attempt closure remain unchanged.

### 7. Carry engagement state, not roster text, through compaction

Make `global/AGENTS.md` the canonical owner of a conditional `Team Advice State` field contract. Synchronize the configured compaction prompt and maintained model-profile rendering through focused markers rather than letting either become another semantic owner. Emit the section only when advice or delegated packages exist:

```text
Advisor Task Ref
Candidate Ref
Catalog Ref
Main Disposition
Active Work Packages
Terminal Work Packages
Pending Activation Evidence
Specialist Liveness
Integration State
Unavailable Material Capabilities
Reconsultation Condition
```

Compaction calls no tools and does not infer a new team, verify availability, repeat the catalog, promote conditional agents to todos, or reconsult solely because context compacted. Main performs root, candidate, catalog, and child identity verification after resume. A mismatch invalidates only dependent recommendations.

**Alternative considered:** Generic post-compaction reminder to consider agents. Rejected as low-signal text that neither preserves a detected obligation nor reduces main decision load.

### 8. Keep the advisor in `core` and `all` under context-quality and safety gates

The selected policy makes advice default for non-trivial root work, so `specialist-team-advisor` and `specialist_catalog` must exist in `core` and `all`. Domain agents remain profile-scoped; the catalog reports only what is actually active. The advisor's complete body remains on demand.

The implementation first consolidates the current main-owned specialist-selection wording only where one canonical owner and unchanged behavior are evidenced, and removes the absolute no-router sentence replaced by this narrower authority boundary. Inventory size and token-proxy changes are reported diagnostically. If the retained candidate fails canonical ownership, exact-duplicate, context-quality, committed-authority, safety, or loaded behavior checks, the change remains incomplete rather than omitting the advisor, weakening safety, or introducing a replacement size ceiling.

### 9. Extend existing proof owners instead of adding a generic scheduler harness

Extend the existing generalized `consumer-outcome-regression` adapter with one reviewed `team-advising` pack and reuse `runtime-surface-loader` for profile/plugin/catalog readback. Do not add a third pack to `agent-tooling-ergonomics` or broaden its tooling/change-locality owner. The consumer-outcome runner records facts; reviewed scenario records own expected semantic routes. Its team-advising pack may allow only the advisor/specialist task and local disposable effects required by the exact scenario while retaining existing external, question, credential, install, remote, destructive, and target-worktree denials. Deterministic evaluation checks schema, availability references, exact task/agent/tool events, counts, candidate/effect/cleanup identity, and replay. Main semantic disposition judges whether each engagement map satisfies the reviewed scenario without scoring prose.

Capture the unchanged-source same-model baseline before loaded behavior mutation. Candidate scenarios use identical original request, initial repository, model, variant, profile, permissions, and environment. They include:

1. trivial owner-local direct work;
2. non-trivial single-domain work where `main alone` remains valid after advice;
3. multi-domain work with two distinct bounded roles;
4. procedural skill without a fresh specialist;
5. specialist conditional on a concrete later artifact;
6. isolated production delegation whose worker writes one disposable package and whose main root closes liveness, integrates it, and runs the representative proof;
7. mid-task discovery of a concurrency or ownership boundary;
8. relevant artifact unavailable in the active profile;
9. an overstaffing control where broad review fan-out is wrong.

The `team-advising` pack extends the current pack union and configured permissions explicitly. Its task facts add comparable child agent id, parent/root refs, task state, and result digest; skill facts add exact selected skill id. Every scenario runs in its own generated config/data/session/workspace root and keeps the kit/active global source read-only. Task permission exists only in this pack; unexpected child identity is a candidate failure, and every unexpected role is constrained to read-only permissions. Scenario 6 alone grants `implementation-worker` one exact disposable write root, disables external-directory effects, records every changed path, and blocks main integration/proof until adapter-proven terminal cessation or write isolation. Scenario 7 uses one root session with an initial prompt followed by one represented topology-changing user turn; the other scenarios remain one-turn. Structured advisor output and main disposition are preserved for semantic review, while deterministic code checks only identities, counts, availability references, effects, and closure.

The candidate must call no advisor in scenario 1, exactly one initial advisor in scenarios 2-9, and only one additional advisor after the represented topology change in scenario 7. Proof records actual subsequent main dispatch only where the scenario's activation evidence is ready. No product, remote, credential, deployment, release, or destructive effect is permitted.

### 10. Serialize shared instruction ownership with active changes

The five predecessors named by the planning candidate are archived and supply the current baseline contracts. Current active work is serialized advisor first, then `add-roadmap-delivery-trajectory-loop`, then `add-cross-project-kaizen-loop`. The trajectory manifest already depends on this change for every shared root; Kaizen remains mutation-disabled and acquires shared roots only after both predecessors archive. `ownership.json` therefore enables this change's mutation window without claiming concurrent ownership for either later change.

Semantic reconciliation preserves bounded falsification as an advisor-recommendable challenge, campaign orchestration as a separate multi-session control plane, complexity management as a recommendable skill, and foundation recovery as structural integrity rather than team selection.

## Failure Boundaries And Diagnostics

- **Catalog unavailable or stale:** `specialist_catalog` returns `unknown` with root/profile/source facts; advisor returns `Team Advice: unknown`; no static fallback is invented.
- **Advisor timeout or malformed report:** main records the child/task identity and capability gap, aborts and proves terminal cessation or revokes read authority through isolation before dependent fallback, and does not repeat unchanged advice for confidence.
- **Recommended artifact unavailable:** deterministic validation rejects the reference; main does not dispatch it.
- **Advisor overreach:** permissions prevent mutation, task, question, network, and protected effects; main rejects scope/authority recommendations.
- **Child or writer liveness unknown:** existing universal writer closure blocks integration and proof; advisor output cannot clear it.
- **Main/advisor disagreement:** main records direct evidence and its disposition; the advisor is not an adjudicator.
- **Compaction identity mismatch:** only dependent engagement rows become stale; terminal attributable evidence remains.
- **Proof/evaluator failure:** preserve raw bundles and replay offline under the existing live-attempt gate; do not repeat configured sessions for evaluator-only corrections.

Errors preserve their original cause and identify the root session, catalog ref, advisor task, candidate, profile, and failing boundary without exposing prompts, secrets, absolute private roots, or sensitive payloads.

## Fidelity, Authorization, And Evidence

- **Current Rung:** Complete current nine-member configured candidate and provider-free replay, pending task 5 privacy correction, independent critical-risk evidence, and broad-claim challenge.
- **Next Real Boundary:** Provider-free preflight and unchanged-source baseline through the actual installed OpenCode root entry point and active catalog source.
- **Authorization:** Local OpenSpec planning, later local source edits, disposable repositories, and bounded non-sensitive configured-provider calls under standing kit-validation authority. No installation, activation, commit, push, release, deployment, remote mutation, credential use, or product effect.
- **Safeguards:** Exact source/model/profile/session identity; create-new evidence roots; tool/effect denials; target-worktree sentinels; one root orchestrator; closed child/writer state; privacy scan; matched baseline/candidate inputs; deterministic helpers prohibited from semantic selection.
- **Restoration/Cleanup:** Candidate proof uses isolated generated config/data/session/project roots; every child/session/process/root reaches terminal deletion or an explicit retained evidence state. Loaded global installation is not changed by implementation proof.
- **Expected Evidence:** Reviewed scenario manifest; preflight; immutable baseline and candidate bundles; active catalog snapshots; exact root/advisor/specialist graph; engagement maps and dispositions; output/effect/cleanup readback; provider-free replay; context/latency facts; profile/permission/instruction inventory; strict validation.

The proposal's `STA-001` record remains the sole complete claim owner. Design and task evidence cannot broaden its maintained population or maximum claim.

## Risks / Trade-offs

- **[Risk] Default advice becomes ceremony** -> Keep the trivial exemption, `main alone` success, one-call default, material-change-only reconsultation, and overstaffing negative control.
- **[Risk] Advisor becomes a second orchestrator** -> Deny task/edit/question/authority, require main disposition, and test zero nested dispatch.
- **[Risk] Main blindly trusts specialists** -> Preserve candidate/evidence identity, critical-fact inspection, integration, and real-boundary proof as main-owned gates.
- **[Risk] Main repeats all specialist work anyway** -> Make evidence-oriented verification explicit and recapture behavior scenarios where delegation otherwise provides no context benefit.
- **[Risk] Catalog omits project or merged runtime artifacts** -> Use the official root-effective runtime listing, verify it against live tool visibility, and fail `unknown` rather than rely on the profile manifest alone.
- **[Risk] Added model call costs more than it saves** -> Capture advisor latency/context and downstream rework facts; reject a candidate that does not improve maintained routing while preserving quality.
- **[Risk] Dedicated advisor duplicates readiness or Practice Owners** -> Keep team topology as its sole responsibility and test exact referral boundaries.
- **[Risk] Broad trigger overmatches medium local work** -> Require reviewed positive and negative scenarios and retain direct work when one owner/proof path is evident.
- **[Risk] Model-sensitive results do not generalize** -> Limit the claim to `STA-001` observations and preserve model/profile/environment identity.
- **[Risk] Active changes race shared files** -> Keep mutation disabled until terminal state or explicit ownership transfer for every overlapping path.

## Migration Plan

1. Freeze ownership and the unchanged-source baseline before runtime behavior edits.
2. Add provider-free catalog/agent/profile contracts and isolated loader readback.
3. Add the dedicated advisor and compact main/compaction deltas in an isolated candidate global source.
4. Capture matched candidate scenarios and replay preserved bundles.
5. Retain the candidate only if all positive, negative, safety, context, liveness, and cleanup oracles pass; otherwise remove the advisory surface and preserve baseline evidence.
6. Validate source/profile/catalog/model-route consistency and leave active installation unchanged.

Rollback before activation is deletion of this change's source candidate and restoration of only its isolated generated roots. Any later installation or activation requires a separate explicitly authorized operation and restart; it is outside this change's implementation envelope.
