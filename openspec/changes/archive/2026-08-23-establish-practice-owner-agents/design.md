## Context

See `proposal.md` for motivation and `specs/library-practice-ownership/spec.md` for the responsibility contract. The repository currently exposes nineteen global subagents as one flat catalog. Fourteen read-only reviewers share a leaf contract, while production, SDET, diagnosis, helper, and completion-control agents use dedicated role contracts. README routing maps name useful review domains, but neither source nor validation assigns any agent exclusive semantic ownership of a maintained practice.

The active loader-visible inventory for this project reports 58 discovery records at token proxy 2,350, 58 on-demand bodies at 69,810, and three startup-visible candidates at 13,160. The committed global `AGENTS.md` and `principles-of-work.md` account for token proxy 11,974; detailed agent bodies are already on demand. The efficient seam is therefore explicit ownership in discovery metadata and compact generic routing, not another always-loaded policy body or a runtime scheduler.

The current agent portfolio already contains fourteen of the fifteen selected Practice Owners. The missing domain is execution safety across protected authority, secrets, unrelated worktree state, destructive/remote effects, reversible cleanup, and concurrent writer liveness. Existing execution and control agents consume these rules but none is a read-only semantic owner for maintaining and challenging them.

This change overlaps active instruction work. `enforce-claim-evidence-closure` currently owns broad global instruction, profile, agent, validator, and proof roots with mutation enabled. During this planning pass, `improve-change-locality-guidance` was reconciled to assign material practice observation and maintenance to `openspec-architecture-reviewer` while retaining the concrete decision and result in main; it remains implementation-empty and dependent on this change's owner contract. `harvest-repeated-agent-workflows` plans later edits to the same OpenSpec and instruction surfaces. Planning this change is safe now; production mutation must remain serialized and preserve all existing evidence.

### Fidelity Ladder

`reviewed practice/agent/profile inventory -> frozen source, model, profile, permission, and instruction-budget baseline -> provider-free registry/schema/profile/fixture preflight -> unchanged-source same-model routing baseline -> one claim-evidence ownership pilot -> complete core owner routing plus execution-safety owner -> optional domain-owner boundary routing -> maintenance and owner-self-change scenarios -> provider-free replay/evaluation -> isolated loader/profile readback -> project-native validation and handoff`.

The first safely reachable real boundary after implementation starts is provider-free resolution of the reviewed registry through isolated `core` and `all` profile manifests, followed by one unchanged-source same-model baseline through the actual installed OpenCode entry point. Bounded non-sensitive configured-provider calls are already authorized for kit instruction validation. Every run uses new disposable config, data, cache, session, evidence, and repository roots; denies remote, credential, installation, release, and target-repository effects; records exact source/model/variant/permission/tool identities; and proves terminal process/session/root cleanup.

## Goals / Non-Goals

**Goals:**

- Make practice responsibility explicit and independently discoverable without moving user-outcome accountability away from main.
- Give every maintained portable normative rule anchor one primary practice and every initial practice one specialized owner.
- Keep zero-trigger Ordinary Small work as the fast path and invoke owners only at exact material or material-uncertainty boundaries.
- Reuse current reviewer and specialist roles, skills, profiles, validators, inventory, and proof-client infrastructure.
- Make practice maintenance reviewable without owner self-editing or self-certification.
- Keep startup and discovery budgets green while reducing the amount of detailed policy main must actively reconstruct.

**Non-Goals:**

- An autonomous multi-agent organization, owner hierarchy, voting system, central router, agent scheduler, or owner-to-owner delegation.
- Giving a Practice Owner product, mutation, lifecycle, completion, archive, release, or protected-action authority.
- Installing all domain workflows into `core`, loading all owner bodies at startup, or launching every owner for every task.
- Renaming the current agent catalog, adding compatibility aliases, or rewriting every skill and reviewer body.
- Changing SDET independence, implementation-worker authorship, completion-arbiter semantics, roadmap mission orchestration, completion hot-path capacity, workstation services, or remote/provider configuration.
- Proving universal practice completeness or optimal granularity outside the reviewed initial roster and maintained scenarios.

## Decisions

### Decision 1: Separate Outcome Owner from Practice Owner

Main is the Outcome Owner: it owns user intent, scope, concrete design and implementation decisions, orchestration, integration, Runtime Proof, disposition, and handoff. A specialized subagent is the Practice Owner: it owns one practice's semantic contract, trigger applicability, runtime observation, and maintenance consistency.

This is not a RACI label only. A material trigger creates an observable owner consultation, and main must disposition the report. The owner cannot mutate, authorize, or decide the overall result. A practice-level `no-material-finding` observation is deliberately narrower than acceptance.

Alternative rejected: keep all practice responsibility in main and merely improve prose. That is the current architecture and does not meet the user decision. Alternative rejected: let owners decide product or architecture outcomes. It separates authority from complete user context and conflicts with protected-boundary and evidence-not-authority invariants.

### Decision 2: Define a practice as a stable normative family, not every artifact or bullet

A registered practice is one coherent family of normative invariants, material triggers, evidence expectations, and maintenance surfaces. Skills, commands, execution roles, validators, and proof runners may implement or consume a practice but are not automatically separate practices. One owner may own many rules only when they change for the same reason and use one review boundary; one agent may own only one primary practice.

The initial portable mapping is:

| Practice ID | Practice Owner | Primary boundary |
| --- | --- | --- |
| `outcome-readiness` | `implementation-readiness-reviewer` | outcome capsule, next increment, implementability, first real boundary |
| `verification-and-tests` | `test-coverage-reviewer` | Runtime Proof sufficiency, requirement/test oracles, validation, completion evidence |
| `claim-evidence` | `evidence-sufficiency-reviewer` | broad claim population/path/oracle closure and maximum supported claim |
| `simplicity-and-reuse` | `code-quality-reviewer` | remove/narrow/reuse/reduction, duplication, current concept cost |
| `architecture-and-change-locality` | `openspec-architecture-reviewer` | responsibility ownership, cohesion, change axis, state/boundary design, OpenSpec architecture |
| `execution-safety` | `execution-safety-reviewer` | authority, secrets, worktree, destructive/remote effects, restoration, cleanup, writer liveness |
| `instruction-governance` | `instruction-artifact-reviewer` | canonical ownership, trigger quality, permissions, context cost, catalogs, maintenance evidence |
| `blocker-recovery` | `troubleshooter` | causal diagnosis, alternate safe routes, owner-only proof, non-repeating recovery |
| `configuration-and-deployment` | `deployment-config-reviewer` | config schema/defaults/reload plus packaging/deployment/rollback operations |
| `performance-and-reliability` | `performance-reliability-reviewer` | latency, throughput, overload, isolation, recovery evidence |
| `rust-concurrency` | `rust-concurrency-reviewer` | Rust async ownership, cancellation, backpressure, shutdown, Send/Sync |
| `protocol-api-semantics` | `protocol-api-reviewer` | schema/session/correlation/cancellation/heartbeat/reconnect semantics |
| `wire-format-and-transport` | `wire-protocol-reviewer` | framing bytes, byte order, sizes, binary safety, transport golden vectors |
| `legacy-contract-evidence` | `legacy-evidence-reviewer` | requirements and design claims against legacy source evidence |
| `legacy-client-compatibility` | `legacy-client-compatibility-reviewer` | shipped client/tool lifecycle, workflow, timing, error, and migration compatibility |

The reviewed runtime trigger seed is:

| Practice ID | Material trigger | Named uncertainty trigger | Excluded concern / referral |
| --- | --- | --- | --- |
| `outcome-readiness` | Before implementation when outcome, envelope, non-goals, current increment, first real boundary, or a decision that changes accepted behavior is unresolved | `outcome-capsule-unknown`: main cannot state one bounded outcome and observable boundary from current evidence | Test/proof sufficiency -> `verification-and-tests`; broad claim ceiling -> `claim-evidence`; design seam -> `architecture-and-change-locality` |
| `verification-and-tests` | A behavior/result is about to be represented as proved or complete; test, validation, failure-visibility, or completion evidence is designed or materially changed | `observer-or-oracle-unknown`: available evidence may not observe the accepted effect or distinguish a realistic failure | Domain semantics -> exact domain owner; broad population/equivalence closure -> `claim-evidence` |
| `claim-evidence` | A claim explicitly declares finite-population, partitioned-domain, real-system equivalence, compatibility/interchangeability, safety, phase/milestone, or behavioral substitution scope | `claim-ceiling-unknown`: population, path, environment, real oracle, unresolved observations, or maximum claim is not explicit | Ordinary exact-case proof -> `verification-and-tests`; compatibility behavior itself -> domain owner |
| `simplicity-and-reuse` | Before adding a dependency, top-level mechanism/API, out-of-owner infrastructure, multi-implementation abstraction, or duplicate behavior; or when a current candidate contains removable concepts | `existing-owner-unknown`: evidence cannot establish whether a current repository/platform owner fits the required contract | Responsibility/change-axis seam -> `architecture-and-change-locality`; line count alone is no trigger |
| `architecture-and-change-locality` | Accepted second variant, mixed/new responsibility, inspected external/system boundary, non-trivial state transition, important invariant, or source-backed change axis makes locality material | `responsibility-boundary-unknown`: two current designs differ materially in responsibility ownership, locality, testability, or safety and evidence does not resolve the boundary | Deletion/dedup/reuse arithmetic -> `simplicity-and-reuse`; one-off cohesive local work is a negative control |
| `execution-safety` | Credentials/elevation, destructive/remote/install/deploy/release/public action, sensitive data, untrusted instructions, dirty/unrecognized worktree, concurrent writer, irreversible effect, or required restoration/cleanup is reachable | `authority-identity-liveness-unknown`: exact authority, target identity, writer liveness, reversibility, or cleanup ownership is unproven | Product/architecture decision remains main-owned; application-domain correctness refers to its domain owner |
| `instruction-governance` | A skill, agent, `AGENTS.md`, prompt/command, permission, config routing, runtime profile, catalog, validator contract, or loader-visible instruction surface changes | `instruction-source-or-precedence-unknown`: active source, installed drift, trigger, permission semantics, or loader precedence is unproven | Execution of a protected action -> `execution-safety`; practice-specific semantics -> that practice owner |
| `blocker-recovery` | Immediately before owner escalation after safe distinct local routes are exhausted, after two materially similar attempts without progress, or when a blocker depends on contradictory/zero/empty/timeout/absence evidence | `failure-layer-or-owner-boundary-unknown`: Product Candidate, Proof Runner, Evaluator, Environment, Authority, or exact owner-only status is unproven | It diagnoses one failure chain; it does not authorize correction, testing, or owner action |
| `configuration-and-deployment` | Config schema/default/alias/limit/reload, service/process packaging, install/upgrade/rollback, or operational readiness changes | `operational-contract-unknown`: effective config source, lifecycle owner, rollback, or operator failure behavior is unclear | Generic outcome readiness -> core owner; latency behavior -> `performance-and-reliability` |
| `performance-and-reliability` | Latency/throughput/queueing/starvation/backpressure/overload/isolation/recovery/SLO behavior or evidence changes | `load-or-recovery-oracle-unknown`: workload, tail oracle, isolation boundary, or recovery terminal state is unclear | Rust implementation mechanics -> `rust-concurrency`; protocol reconnect semantics -> `protocol-api-semantics` |
| `rust-concurrency` | Rust async/shared mutable state, channels/permits, blocking-in-async, cancellation, shutdown, Send/Sync, or response ownership changes | `rust-liveness-or-ownership-unknown`: task/resource ownership or terminal cancellation/shutdown is unclear | Language-neutral capacity/SLO -> `performance-and-reliability`; protocol semantics -> `protocol-api-semantics` |
| `protocol-api-semantics` | Request/response schema, evolution, correlation, cancellation, heartbeat, session, reconnect, or compatibility semantics change | `session-contract-unknown`: request/session lifecycle, correlation ownership, or reconnect state is unclear | Frame bytes/byte order/length/binary transport -> `wire-format-and-transport` |
| `wire-format-and-transport` | Framing bytes, request codes, byte order, exact size/payload limits, binary safety, codec vectors, partial IO, or transport recovery changes | `byte-contract-unknown`: exact vector, boundary size, IO completion, or byte ownership is unclear | API/session meaning -> `protocol-api-semantics`; generic test coverage -> `verification-and-tests` |
| `legacy-contract-evidence` | A modern requirement/design decision is derived from or claims parity with legacy source, logs, schemas, captures, docs, or tests | `legacy-source-support-unknown`: available evidence cannot establish the claimed legacy contract | Shipped client/operator workflow compatibility -> `legacy-client-compatibility`; broad equivalence ceiling -> `claim-evidence` |
| `legacy-client-compatibility` | A shipped client/tool/script/operator workflow can observe changed API shape, activation, polling, concurrency, errors, timing, or migration behavior | `client-reachability-unknown`: supported client population or reachable workflow consequence is unclear | Historical source support -> `legacy-contract-evidence`; wire bytes -> `wire-format-and-transport` |

Generic possibility does not match any uncertainty trigger. Main uses only these reviewed trigger IDs and preserves the task evidence that matched them.

The closed initial canonical-anchor map is:

| Practice ID | Owned portable anchors |
| --- | --- |
| `outcome-readiness` | `principles-of-work.md`: Outcome over Output, Gall's Law, Fast Feedback/Small Batches, Two-Way Door Decisions, Information Foraging; `global/AGENTS.md`: Ordinary Small and Material routing, accepted outcome/scope classification, implementation method, OpenSpec increment capsule and task order |
| `verification-and-tests` | `principles-of-work.md`: Working Software, Dogfooding, Trust but Verify, Fail Fast/Loud/Closed, Definition of Done, Completion; `global/AGENTS.md`: common proof floor, runtime diagnostics, Risk-Driven Test Workflow, validation and handoff evidence |
| `claim-evidence` | `principles-of-work.md`: Evidence Bounds Claims, Scientific Method, Goodhart's Law; `global/AGENTS.md`: broad claim scope, substitution qualification, evidence-sufficiency challenge, maximum claim ceiling |
| `simplicity-and-reuse` | `principles-of-work.md`: Occam, KISS, YAGNI, AHA/Rule of Three, Theory of Constraints, Chesterton's Fence; `global/AGENTS.md`: reuse-discovery trigger/order, removal/narrowing, dependency/mechanism/duplicate limits |
| `architecture-and-change-locality` | `principles-of-work.md`: Single Responsibility/High Cohesion/Low Coupling; `global/AGENTS.md`: context-efficient architecture, responsibility mapping, `split-or-justify`, local change/test/navigation boundary |
| `execution-safety` | `principles-of-work.md`: First Do No Harm, Principle of Least Authority, Zero Trust, Preserve the Worktree, Reversibility, Safe Parallelism, Brooks's Law, Evidence Is Not Authority; `global/AGENTS.md`: machine authorization ceiling, sensitive inputs, task brief authority, owner handoff, parallel writer closure, mode/tool precedence, repository/git safety, external/protected action boundaries |
| `instruction-governance` | `principles-of-work.md`: Governance/order precedence, Determinism over Guesswork, Kaizen/PDCA, Principle of Least Surprise; `global/AGENTS.md`: canonical-principles pointer, deterministic automation, reviewer contract, global artifact/Codebase Memory/OpenCode feature routing, communication, instruction/config maintenance and runtime-profile policy |
| `blocker-recovery` | `principles-of-work.md`: Causally Different Retries; `global/AGENTS.md`: compaction strategy history, self-diagnostic pass, absence-source qualification, alternate route, troubleshooter and owner-only escalation sequence |
| Optional domain practices | Their exact paired skill/agent contracts and README domain routes; no optional domain owner acquires a portable global anchor outside its named technical domain |

`Universal Task Briefing Contract` and delegation liveness are owned by `execution-safety`; owner briefs still carry `outcome-readiness` and other triggered practice constraints. `Shared Reviewer Runtime Invariants` are owned by `instruction-governance`; they do not make reviewers a separate practice. SDET/worker/arbiter role rules map to `verification-and-tests`, `execution-safety`, and `outcome-readiness` as consumers rather than new owners. This map is the semantic seed implemented as structured data in task 2.1; helpers may validate its exact anchor IDs but may not derive them.

`implementation-worker`, `sdet-quality-engineer`, `final-candidate-reviewer`, `qwen-local-worker`, and `session-completion-arbiter` remain consumers or executors. For example, SDET procedure belongs to `verification-and-tests`; the SDET agent executes an independent critical oracle but does not own the governing practice. Completion goal alignment and evidence map to `outcome-readiness` and `verification-and-tests`; the arbiter remains one opt-in control-plane implementation.

Alternative rejected: create one owner for every principle or skill. It would multiply handoffs and duplicate shared rules. Alternative rejected: one mega practice agent. It recreates the main-session context problem in a child and makes every consultation broad. Alternative rejected: classify every current agent as an owner. Execution/helper/control roles have different authority and output contracts.

### Decision 3: Use one reviewed ownership seed outside helper code

Create one versioned stable-ordered semantic seed under the existing repository config convention. Each record contains Practice ID, owner agent, class (`core` or `domain`), canonical rule anchors, maintenance surfaces, profile bindings, and explicit exclusions. Semantic values are reviewed data. Schema, hashes, counts, derived README rows, profile drift, and marker coverage are materialized or validated deterministically.

Agent descriptions carry only an exact Practice ID marker and concise trigger. Owner bodies carry the role-specific trigger and boundary. Always-loaded authority carries one generic routing rule and the non-delegable main kernel. This creates three non-duplicating views:

```text
reviewed registry        -> exact ownership and maintained surfaces
discovery description   -> cheap runtime selection
owner body               -> on-demand semantic detail
```

Alternative rejected: encode the semantic registry as TypeScript constants. That hides reviewed policy inside helper code and encourages derived mirrors. Alternative rejected: parse prose to infer practice families or triggers. This would turn a deterministic validator into a semantic classifier. Alternative rejected: add the complete registry to startup instructions. Discovery already exposes the required selection metadata at lower cost.

### Decision 4: Extend existing owner agents and add only execution safety

The fourteen matching agents gain a compact `Practice Ownership` role delta; overlapping checks are narrowed to the roster boundaries. The existing leaf reviewer contract continues to own read-only permissions and evidence discipline. `troubleshooter` keeps its diagnosis-only role and gains the exact `blocker-recovery` identity without becoming a generic reviewer. Add one new read-only `execution-safety-reviewer` because no current role coherently owns the procedural safety family.

No agent is renamed in this increment. Existing skills remain main-loaded application procedures; the paired Practice Owner independently controls runtime application and maintenance. This preserves current user-facing names and avoids aliases or duplicate installed files.

Alternative rejected: expand `implementation-readiness-reviewer` or `final-candidate-reviewer` to own execution safety. Both would mix planning or generic candidate risk with pre-dispatch authority, worktree, secret, and writer-liveness policy. Alternative rejected: give Practice Owners write access. It creates self-modifying instruction loops and concurrent writer closure without improving semantic evidence.

### Decision 5: Route by exact material triggers without a router agent

Main evaluates concise discovered triggers during ordinary information foraging. A zero-trigger task launches no owner. A matched trigger launches only its exact owner. Material uncertainty about one named practice also triggers that owner. Multiple independent triggers may use one main-owned fan-out when the adapter supports it; overlapping or dependent triggers stay serial. Owners never dispatch, resume, or answer for one another.

Owner output adds these common fields to existing role-specific evidence:

```text
Practice ID
Review Mode: runtime | maintenance
Applicability: applicable | not-applicable | unknown
Practice Observation: no-material-finding | findings-reported | unknown | not-applicable
Candidate or Artifact Reference
Effective Model
Evidence References
Risk Matrix or Reduction Matrix
Boundary Referrals
Evidence Gaps And Residual Risks
```

The output is byte/row bounded in the proof scenarios. Main retains only decision-relevant findings and references in later briefs. A boundary referral is not a nested dispatch request.

Alternative rejected: one preflight call to a routing agent for every task. It moves all taxonomy into another always-invoked model call. Alternative rejected: invoke all owners and let them self-declare not applicable. That maximizes cost and makes absence of findings a noisy proxy. Alternative rejected: let main skip owner consultation after a matched trigger. That leaves ownership nominal rather than operational.

### Decision 6: Keep a compact main kernel even when a practice has an owner

Practice ownership removes detailed semantic control from main's active burden; it does not remove instructions needed before dispatch. Global authority keeps compact invariants for user outcome, protected authority, secrets/untrusted input, worktree preservation, evidence-not-authority, real-boundary proof, writer liveness, and owner-only questions. The registry assigns semantic maintenance ownership for those rules to the relevant owner, but their runtime floor remains loaded.

When owner evidence is unavailable, main may perform the smallest direct fallback analysis. It cannot claim the ownership path succeeded. Unknown non-deferrable safety blocks only the affected action; optional quality uncertainty becomes an explicit limitation rather than a global lifecycle blocker.

Alternative rejected: move every safety and outcome rule into lazy owner bodies. Main could cause harm or lose the user objective before it recognized a trigger or completed a dispatch. Alternative rejected: keep all detailed policy in main as a fallback. That defeats the context goal and creates two complete owners.

### Decision 7: Make maintenance dual-mode and independently review owner self-changes

Each owner accepts one of two brief modes. Runtime mode reviews a task/candidate. Maintenance mode reviews changes to canonical rules, paired skills, trigger descriptions, profiles, validators, scenarios, and documentation maps for that practice. Owners remain read-only and report impact; main authors changes.

A candidate owner cannot be the sole evidence for its own modified body or mapping. Before such mutation, capture current-owner impact when available. After mutation, use the exact frozen prior owner source, deterministic drift checks, and matched baseline/candidate behavior; another independent review may supplement but cannot replace the prior-source comparison. This rule applies to `instruction-artifact-reviewer` itself and does not invent a second live instruction owner. Candidate self-review may check internal consistency but carries no independence claim.

Alternative rejected: separate runtime-owner and maintenance-owner agents for every practice. Both need the same semantic domain and would double catalog size and create ownership conflicts. Alternative rejected: allow owners to edit only their own files. Path restriction does not solve self-approval, model drift, or concurrent writer safety.

### Decision 8: Bind practices and owners atomically in runtime profiles

Profile resolution uses the registry to ensure that every selected practice artifact has its exact owner. The registry slice atomically creates `execution-safety-reviewer`, adds all required owner/catalog/model-profile records, adds `openspec-architecture-reviewer`, `instruction-artifact-reviewer`, and `execution-safety-reviewer` to `core`, and moves the optional non-owner `final-candidate-reviewer` to `all`. `all` includes all fifteen owners and retains final review. This catalog/profile-only step occurs after the immutable behavior baseline but before owner routing is activated; task 2.2 remains the first semantic routing pilot. Optional domain profiles, if later introduced, pair the relevant skill and owner. Domain owners do not enter `core` merely because they exist in the repository. `instruction-governance` remains core because every core runtime loads and can be asked to change global/project instruction, permission, profile, or OpenSpec surfaces; its material trigger remains silent for ordinary application work.

The exact limits are unchanged: selected core startup token proxy at most 12,000, core discovery metadata at most 1,200, and combined committed global authority at most 13,279. The candidate must also not grow the frozen comparable baseline. Concise owner descriptions plus the named final-review move are the selected budget payment. If they do not fit, the profile lane stops for roster revision; it does not raise a budget or omit an owner automatically. Complete owner bodies remain on demand.

Alternative rejected: install all domain owners into core. It contradicts the current profile purpose and adds irrelevant discovery choices to unrelated projects. Alternative rejected: leave ownership out of profile validation. A registry owner that is not loader-visible cannot relieve main or control a triggered practice.

### Decision 9: Prove structural ownership and runtime behavior separately

Extend existing validators with a focused practice-ownership module and fixtures. Static checks prove only seed schema, stable ordering, safe paths, one-to-one mappings, anchor coverage, owner files/markers, permissions, profile composition, README synchronization, and budgets.

Use one scenario-specific `practice-owner-routing` proof adapter over the existing OpenCode proof client, portable process/model-profile support, immutable capture/replay conventions, and instruction inventory. It owns only this capability's routing and maintenance scenarios; it does not become a generic agent scheduler. The maintained scenarios are:

1. trivial owner-local work: zero owner launch;
2. one core trigger: exact owner and bounded report;
3. disjoint multi-trigger work: exact bounded owner set, no all-fan-out;
4. protocol-versus-wire overlap: one primary owner plus bounded referral;
5. protected action: execution-safety evidence cannot authorize the action;
6. unavailable owner: explicit unknown with proportional main fallback;
7. practice maintenance: exact maintenance owner and no mutation authority;
8. owner self-change: frozen prior-source plus matched behavior evidence required.

Matched arms use the same source manifest except baseline/candidate instruction identity, exact model/variant, prompts, profiles, tools, permissions, fixtures, and initial state. Evaluation checks child task identity and report fields, main disposition, output/state, forbidden effects, command exits/stdout/stderr, validation, bounded evidence, and cleanup. It does not grade prose quality or infer whether another unrepresented practice should exist.

Reuse disposition is `extend`: reuse the current proof client, runtime profile resolver, instruction inventory, validator orchestration, and immutable evidence conventions; build one narrow scenario adapter because no existing runner owns Practice Owner dispatch semantics. Cross-project discovery is `not-applicable`: this is a repository-specific instruction-runtime contract, not a reusable application mechanism.

Alternative rejected: static markers only. They cannot prove that main invokes the right child or retains outcome authority. Alternative rejected: extend the broad consumer-outcome baseline with all eight scenarios. Its exact two-scenario contract and friction gate serve a different population. Alternative rejected: add fuzzy owner-routing scores. Explicit scenario oracles and exact child identities are sufficient.

### Decision 10: Reconcile active instruction owners before mutation

This change records planning now but does not acquire shared runtime write roots while `enforce-claim-evidence-closure` is mutation-enabled. Before implementation mutation, refresh active change status and ownership, obtain terminal closure or explicit transfer, and record this change's exact ownership map.

For `improve-change-locality-guidance`, the planning artifacts now preserve pay-as-you-go direct-code-versus-seam behavior, named evidence triggers, and the zero-trigger no-call control while assigning practice observation/maintenance to the specialized owner and the concrete architecture/integration decision to main. Implementation task 1.1 only verifies that this reconciliation and ownership dependency remain current; it does not authorize a second rewrite. This is causally distinct from the rejected autonomous architect strategy and follows the user's newer responsibility decision.

For `harvest-repeated-agent-workflows`, keep automation-dividend authoring main-owned unless that change is explicitly amended later; Practice Owners may report maintenance evidence but do not become automatic helper writers. Mission, completion scheduler/guard, plugins, Graphify/workstation, and Restart surfaces remain untouched.

Alternative rejected: edit all active changes and runtime sources in one batch. It would destroy writer attribution and invalidate current evidence. Alternative rejected: treat older planning text as immutable owner scope. Current accepted semantics require coherent reconciliation, while prior evidence and history remain preserved.

## Risks / Trade-offs

- **[Risk] Practice granularity is still too broad or narrow** -> Seed the exact fifteen-family roster, prove overlap scenarios, and change taxonomy only through reviewed registry plus maintenance evidence rather than runtime inference.
- **[Risk] Owner calls add latency and context** -> Keep zero-trigger work owner-free, descriptions compact, reports bounded, independent calls batchable, and bodies on demand; preserve exact call counts and context inventories.
- **[Risk] A nominal owner duplicates another reviewer** -> Assign exact primary boundaries, narrow current checks, return boundary referrals to main, and validate one-to-one ownership.
- **[Risk] Main blindly trusts owner evidence** -> Retain evidence-not-authority in the main kernel and require explicit main disposition with direct evidence when disagreeing.
- **[Risk] Main still carries all detailed policy as fallback** -> Consolidate overlapping global prose and prove startup non-growth while retaining only the pre-dispatch kernel.
- **[Risk] Missing owner blocks ordinary delivery** -> Separate optional quality unknowns from non-deferrable safety; keep only the affected practice or action unknown and report fallback honestly.
- **[Risk] Owner maintenance becomes self-approval** -> Keep owners read-only and require frozen prior-source plus matched behavior for every owner-body/mapping change.
- **[Risk] Core profile exceeds discovery budget** -> Use concise descriptions and move `final-candidate-reviewer` to `all`; if exact 12,000/1,200/13,279 boundaries still fail, revise the roster rather than raising a budget or omitting an owner.
- **[Risk] Active changes overwrite one another** -> Keep this change planning-only until current mutation ownership closes or transfers; recapture baseline after reconciliation.
- **[Risk] Model-sensitive synthetic scenarios overstate effectiveness** -> Preserve exact model/environment identity and limit `POA-001` to the maintained population; keep static validation and behavior claims separate.

## Migration Plan

1. Refresh active change status, histories, diffs, and ownership. Keep this change non-mutating until `enforce-claim-evidence-closure` closes or explicitly transfers shared instruction/profile/validator roots; reconcile the responsibility delta and proof scenarios with `improve-change-locality-guidance`, and serialize later `harvest-repeated-agent-workflows` edits.
2. Freeze the current source/profile/agent/permission/loader/instruction-budget identities and obtain provider-free preflight plus unchanged-source same-model baseline evidence for all maintained scenarios before loaded instruction mutation.
3. Add the reviewed registry seed, shared owner contract, schema/validator/fixtures, the read-only execution-safety owner, and atomically complete `core`, `all`, README, and model-profile catalog entries under the exact budgets. Pilot `claim-evidence`, whose trigger and existing specialist boundary are already explicit, through isolated loader and same-model routing proof.
4. Migrate the remaining core owner bodies and consolidate the generic main routing/kernel text without changing the already-valid profile roster. Re-prove trivial, single-trigger, safety, unavailable-owner, and main-disposition scenarios.
5. Narrow and bind the optional domain owners in `all`; prove protocol/wire and independent multi-practice boundaries without adding domain artifacts to core.
6. Add maintenance and self-change scenarios, README/ownership views, proof inventory, and replay/current-candidate gates. Use frozen prior-source review for every changed owner body and supplemental independent review when available.
7. Run focused contracts, profile/permission/inventory tests, provider-free replay, matched candidate evaluation, loader readback, full project validation, strict OpenSpec validation, and scoped source/diff/secret review. Invoke fresh critical SDET only if the implemented candidate changes a reachable authorization/privacy or another named critical safety behavior rather than preserving the kernel unchanged.

Rollback restores only this change's registry, contracts, owner-body deltas, new safety owner, routing/profile/catalog/validator/proof files, and generated views to the frozen baseline while preserving unrelated work and immutable evidence. No active global installation, remote state, provider configuration, credential, product repository, or other OpenSpec change evidence is mutated by rollback.
