# library-change-ready-sdlc Specification

## Purpose
Define proportional Change-Ready routing that prioritizes a minimal observable happy path for Ordinary Small work while preserving explicit scope control and full qualification for concrete Material risks.

## Requirements

### Requirement: Process controls adapt autonomously inside accepted outcome authority

The main session SHALL own and update implementation plans, task and path inventories, OpenSpec artifact text, candidate and revision labels, attempt counts, and process stop lines when evidence shows that the update is the smallest necessary route to the accepted outcome and it does not change the accepted outcome, operating envelope, non-deferrable invariants, material risk acceptance, or protected-boundary authority. Such an update SHALL NOT be classified as scope expansion merely because an earlier agent-authored artifact prohibited another attempt or declared a process stop.

After a causal correction and satisfied retry condition, the main session SHALL update affected artifacts, invalidate only dependent proof, and continue through the next authorized bounded attempt. It SHALL NOT ask the owner whether to expand the change, create a successor revision, raise an attempt count, or continue the process.

Updating a process control SHALL NOT authorize the underlying external, physical, costly, destructive, irreversible, remote, credentialed, deployed, released, or otherwise protected action. That action SHALL retain its separate owner authority, `Live-Attempt Gate`, safety, identity, restoration, and cleanup prerequisites.

#### Scenario: Corrected pre-boundary failure earns an autonomous successor

- **WHEN** a bounded live attempt stops before the protected dependency because of a diagnosed local defect
- **AND** the defect is corrected, the retry condition is satisfied through current diagnostics or a causally different safe probe, and existing authority already covers the underlying bounded action
- **THEN** main updates the OpenSpec attempt limit and stop line, records the causal successor, and executes the next bounded attempt without an owner process-approval question
- **AND** all underlying safety, restoration, cleanup, identity, and evidence gates remain enforced.

#### Scenario: Plan update does not grant protected action authority

- **WHEN** a successor plan is necessary but the underlying physical, remote, destructive, credentialed, costly, or manual action lacks current authority or prerequisites
- **THEN** main MAY update and prepare the plan and artifacts autonomously
- **AND** SHALL stop only at the exact protected action with a self-contained owner handoff.

#### Scenario: Changed semantics remain owner-owned

- **WHEN** the proposed artifact update would change user-visible outcome, operating envelope, a non-deferrable invariant, material risk acceptance, or protected API/data/security/policy semantics
- **THEN** it remains scope expansion requiring an exact owner decision
- **AND** process-autonomy wording SHALL NOT be used to cross that boundary.

### Requirement: SDLC-012 Outcome-first slices minimize sufficient lifecycle complexity
The portable runtime instructions SHALL optimize for the earliest useful working increment that satisfies the accepted outcome and non-deferrable invariants inside an explicitly enforced operating envelope. Simplicity SHALL mean the fewest capabilities, reachable modes, states, configuration dimensions, recovery paths, compatibility paths, owner boundaries, and abstractions sufficient for that increment, not merely the fewest lines of code.

Before adding a package dependency, top-level mechanism or reusable API, out-of-owner infrastructure capability, multi-implementation abstraction, or another implementation of repeated behavior, the main session and implementation roles SHALL load the active reuse-discovery workflow and consider, in order: removing an unnecessary capability; narrowing users, data, interfaces, modes, load, concurrency, persistence, or side effects; reusing an existing current-repository or platform/dependency mechanism; using an explicitly configured cross-project source with current-source verification; and adding the smallest concrete local guard, validation, or focused test only when no verified candidate fits at lower total lifecycle cost. Owner-local fixes, data/config/generated/mechanical edits, and selected-API glue SHALL remain exempt unless they independently introduce a trigger. Multiple new coordination, recovery, compatibility, policy, or evidence mechanisms SHALL require presenting a narrower slice or explicit evidence that the simpler options cannot satisfy the accepted increment.

Risk classification SHALL evaluate behavior reachable inside the proposed operating envelope. A relied-upon envelope limit SHALL remove a risk from current reachability only when the candidate or an accepted existing project mechanism enforces that limit. A prose-only, ambiguous, or bypassable limit SHALL NOT reduce risk classification.

#### Scenario: Scope reduction removes unnecessary concurrency
- **WHEN** the first useful increment can be restricted by an enforced single-worker or single-user boundary
- **THEN** the agent SHALL prefer that bounded slice over adding locks, distributed coordination, retries, and recovery state for unreachable concurrent use
- **AND** future concurrency SHALL remain explicit non-goal or follow-up scope.

#### Scenario: Prose-only containment does not reduce risk
- **WHEN** a proposed pilot says "single tenant only" but no accepted mechanism prevents another tenant from reaching the behavior
- **THEN** multi-tenant effects SHALL remain reachable for risk classification
- **AND** the candidate SHALL NOT receive a simplified disposition based on prose alone.

#### Scenario: Existing mechanism is preferred
- **WHEN** an existing feature flag, allowlist, read-only mode, queue, transaction, or project-native boundary can enforce the accepted slice
- **THEN** the implementation SHALL reuse it unless evidence shows it cannot meet the current outcome
- **AND** SHALL NOT add a parallel mechanism for hypothetical future flexibility.

#### Scenario: New mechanism searches configured peers proportionally
- **WHEN** current-repository and platform/dependency evidence do not satisfy a triggered mechanism contract and an authorized cross-project source is explicitly configured
- **THEN** the author performs one bounded capability search and verifies promising current source before `build-minimal`
- **AND** does not enumerate unrelated projects or require a private registry.

#### Scenario: Local fix stays outside the workflow
- **WHEN** a bounded owner-local fix introduces no dependency, mechanism, reusable API, infrastructure owner, abstraction, or duplicate behavior
- **THEN** the author proceeds with targeted local evidence
- **AND** does not load reuse discovery or query cross-project sources.

### Requirement: Post-MVP work stops at critical boundaries
After representative happy-path proof, mandatory work SHALL be limited to incomplete accepted scope, a correction directly required by the accepted outcome, and reproduced accepted-outcome, critical, or non-deferrable defects. Current-change architecture and diagnostic non-degradation remain part of accepted implementation. Known non-critical bugs outside accepted outcome, optional coverage, pre-existing maintainability debt, style, wording, evidence formatting, process reflection, optimization, and future-scale work SHALL be documented or routed separately and SHALL NOT block qualified or ordinary completion.

#### Scenario: Optional workflow improvement appears after proof
- **WHEN** a useful process improvement is observed but is not required by accepted scope or an invariant
- **THEN** it does not become mandatory current-change work
- **AND** may be recorded through explicit feedback or a separate proposal.

#### Scenario: Accepted behavior remains incomplete
- **WHEN** a required accepted scenario is still unimplemented after the first happy-path proof
- **THEN** it remains mandatory work
- **AND** optional ceremony does not preempt its next real boundary.

#### Scenario: Non-critical post-MVP finding is parked
- **WHEN** main confirms a reachable non-critical limitation after MVP and it has no exact remaining current-change consumer
- **THEN** the limitation SHALL be documented or deferred with its re-evaluation condition
- **AND** it SHALL NOT authorize mandatory candidate mutation or block RC/stable.

#### Scenario: Admitted improvement becomes accepted scope
- **WHEN** an evidence-backed local reversible low-cost improvement is consumed by an exact remaining task, does not expand outcome, and is appended to the active `tasks.md`
- **THEN** it SHALL be implemented and proven at its earliest safe point before that consumer and before RC/stable or normal complete archive
- **AND** it SHALL NOT be reclassified as optional polish merely because MVP already exists.

#### Scenario: Deferred improvement remains non-blocking
- **WHEN** an evidence-backed improvement has no exact remaining current-change consumer
- **THEN** it SHALL be preserved as a non-checkbox deferred record with `Execution Class: separate-change`
- **AND** it SHALL NOT become mandatory post-MVP work until an owning change later admits it.

### Requirement: Non-SDET review is optional evidence

Read-only final, delivery, code-quality, and domain reviewers that are not registered Practice Owners MAY run after MVP only for concrete risk, project policy, or owner request. Their absence, timeout, malformed output, or disagreement SHALL NOT by itself block a stage. A registered Practice Owner consultation SHALL occur only when its reviewed material trigger or material applicability-uncertainty trigger is reached, before the owning decision or action passes that boundary. Zero-trigger Ordinary Small work SHALL require no owner launch solely for compliance.

The fresh evidence-sufficiency Practice Owner defined by `library-claim-evidence-closure` SHALL be required only before a declared finite-population, partitioned-domain, real-system equivalence, compatibility/interchangeability, safety, or phase/milestone claim can become `supported`. Its absence or unusable output SHALL keep only that broad claim `blocked` or `unknown`; it SHALL NOT erase narrower trustworthy evidence, block an unrelated lifecycle stage by itself, or become required for an Ordinary Small exact-case claim.

Reviewer and Practice Owner evidence SHALL NOT authorize mutation or lifecycle decisions. Main SHALL independently disposition every owner finding or unknown and every plausible non-deferrable authorization, privacy, data-integrity, irreversible-action, or envelope-escape claim before RC/stable. Missing owner evidence SHALL keep only that practice observation `unknown`; it SHALL affect completion or stage eligibility only when the unresolved practice fact reaches an accepted outcome or non-deferrable invariant.

#### Scenario: Missing optional reviewer does not block stage

- **WHEN** no registered Practice Owner trigger, concrete optional-review risk, project policy, or owner request requires a non-SDET reviewer
- **THEN** no reviewer launch or report is required for RC or stable
- **AND** all applicable outcome, proof, safety, validation, and critical-risk gates remain enforced.

#### Scenario: Practice Owner trigger occurs before MVP

- **WHEN** a material practice trigger is reached during planning or implementation before representative proof
- **THEN** main consults the exact registered owner at that boundary rather than delaying every owner until post-MVP review
- **AND** the owner remains read-only or inside its existing bounded specialist role and non-authorizing.

#### Scenario: Missing evidence challenge blocks only the broad claim

- **WHEN** a declared broad claim requires fresh evidence-sufficiency challenge and no usable current report exists
- **THEN** that claim remains `blocked` or `unknown`
- **AND** the reviewer absence does not itself change Development-Stage or invalidate a supported exact-case claim.

#### Scenario: Missing owner evidence reaches a safety invariant

- **WHEN** a triggered owner is unavailable and the unresolved fact can affect authorization, privacy, data integrity, irreversible action, worktree preservation, writer liveness, or the enforced operating envelope
- **THEN** main keeps the affected action or stage fact blocked or unknown
- **AND** the missing owner itself does not authorize a weaker fallback.

### Requirement: Current work preserves local comprehension

Human-written production changes SHALL keep the changed behavior understandable through targeted reads of a cohesive owner and narrow neighbors. Line count SHALL be a navigation signal rather than a hard quota. A change SHALL NOT add a new responsibility to an already mixed file or materially worsen change locality, testability, or navigation without extracting one cohesive responsibility or recording a `split-or-justify` decision. Existing unrelated debt MAY remain parked, and the requirement SHALL NOT justify speculative abstractions, wrapper-only micro-files, or broad unrelated refactoring.

#### Scenario: Large cohesive file remains intact
- **WHEN** a touched file is large but has one clear owner and the current behavior remains locally understandable and testable
- **THEN** line count alone SHALL NOT require a split.

#### Scenario: New responsibility reaches mixed code
- **WHEN** a current change would add a responsibility to a human-written file that already mixes unrelated owners
- **THEN** the implementation SHALL extract one cohesive owner within the accepted dependency closure or record why a split would increase current risk
- **AND** SHALL NOT defer its own structural degradation as pre-existing debt.

### Requirement: Runtime behavior and proof retain diagnostic evidence

Behavior-changing work SHALL identify meaningful failure boundaries before implementation and use the project's existing logging/error mechanism. At the owning process, service, job, external-dependency, or persistence boundary, the implementation SHALL preserve the original exception cause and stack and provide structured privacy-safe operation/correlation context when useful. It SHALL log once at the owning boundary, avoid duplicate catch-and-rethrow logging and routine per-item noise, and SHALL NOT add an unrelated telemetry stack solely for compliance.

Runtime Proof SHALL preserve the exact invocation and representative input, Candidate/Environment identity, exit status, stdout/stderr, relevant logs and exceptions, observed side effects, and artifact paths. The production author SHALL inspect those diagnostics before mutation or another run. When they cannot distinguish realistic in-scope causes, the author SHALL add the smallest safe instrumentation at the owning boundary and recapture the affected proof lane rather than guess from a summary.

#### Scenario: Failed real-boundary proof has actionable evidence
- **WHEN** a representative invocation fails
- **THEN** the author SHALL receive preserved raw diagnostics and the original exception chain before correction
- **AND** another run SHALL occur only after the evidence is inspected or the exact missing diagnostic fact is identified.

#### Scenario: Routine success avoids log noise
- **WHEN** normal processing succeeds repeatedly or iterates over many items
- **THEN** the implementation SHALL NOT emit per-item success logs solely to satisfy observability
- **AND** meaningful failures SHALL remain attributable at their owning boundary.

### Requirement: Every behavior dependency chain gets the earliest safe real signal

For every behavior-changing slice, the active runtime authority SHALL identify and execute the first safely reachable real boundary sufficient to observe the still-current accepted effect rather than defer all real-system feedback to phase completion or climb merely because a higher rung is authorized. Authority SHALL remain a ceiling, not a fidelity target. A higher rung SHALL become required only when a current accepted requirement, non-deferrable invariant, or unresolved equivalence risk cannot be observed at the lower real boundary.

The proof ladder SHALL distinguish deterministic offline or preserved replay, local integration or simulator, shadow/read-only real dependency, bounded live effects, and end-to-end user or operator workflow. Offline, unit, mock, replay, and simulator evidence SHALL remain useful fast feedback but SHALL NOT be represented as proof of a reachable real boundary or behavior that depends on a higher rung.

The roadmap SHALL optimize time-to-first-real-signal. When a harness, identity check, independent effect suppression, capture schema, restoration procedure, or owner authorization packet is the smallest prerequisite for sufficient real feedback, that prerequisite SHALL precede more behavior that depends on the unverified real-system model.

#### Scenario: Read-only real characterization is safely reachable

- **WHEN** a feature can be exercised against a real dependency in an independently enforced read-only or no-effect envelope after separate owner authorization and that boundary observes the accepted effect
- **THEN** the roadmap places the minimal harness and authorization gate before further dependent model expansion
- **AND** the authorized characterization records exact input, environment and initial state, output and state transitions, ordering, timing, failures, recovery, cleanup, and restoration.

#### Scenario: An authorized higher rung is unnecessary for the accepted effect

- **WHEN** a lower real boundary observes the still-current accepted effect and a higher end-to-end rung introduces protected prerequisites that belong only to behavior excluded by the accepted non-goals
- **THEN** main proves the accepted effect at the lower boundary and does not treat authority for the higher rung as a requirement to climb
- **AND** it records the narrower claim ceiling and neither bypasses the protected prerequisites nor claims the excluded end-to-end behavior.

#### Scenario: A higher rung is necessary for an accepted requirement

- **WHEN** the accepted observable proof, non-deferrable invariant, or equivalence contract depends on behavior that the lower boundary cannot observe
- **THEN** the higher rung remains the next required real boundary with its exact authorization, safeguards, restoration, cleanup, and evidence gate
- **AND** lower-rung success does not complete or waive that requirement.

#### Scenario: Only offline evidence is currently reachable

- **WHEN** the first sufficient real boundary is unavailable, unauthorized, unsafe, or blocked by a path-scoped live-attempt gate
- **THEN** the current slice executes the highest-fidelity safe offline or local boundary as support evidence without claiming the real effect
- **AND** records the exact blocked path, earliest unblocking or goal-preserving replan task, required authorization and safeguards, restoration procedure, and expected real evidence.

### Requirement: Unknown real behavior stops only dependent expansion

When missing, unobservable, or mismatched real behavior can invalidate planned downstream behavior required by the still-current accepted outcome, the main session SHALL stop adding behavior in that dependency chain until characterization or equivalence evidence resolves the uncertainty. Independent accepted work that does not rely on that uncertainty SHALL continue while it remains dependency-valid, authorized, and safe.

When the unknown behavior or protected prerequisite belongs only to an agent-chosen path and the accepted outcome admits another safe real route, main SHALL keep the affected path and its Live-Attempt Gate blocked, autonomously reconcile planning controls, and continue through the goal-preserving route without representing it as proof of the blocked path. When no runnable item remains, one exact material product decision with no accepted reversible default MAY be presented as `product_decision_required`; an unavailable external capability or exact protected action SHALL instead remain a non-product gate with an honest waiting state and resume condition.

The product-decision/waiting distinction in this requirement applies to explicitly grind-enabled roots. Outside grind, the existing decision-ready owner handoff remains unchanged.

#### Scenario: Emulator behavior relies on an uncharacterized state transition

- **WHEN** the next emulator layer depends on a real-system state transition whose output, ordering, side effects, or recovery semantics are unknown
- **THEN** dependent emulator expansion stops before that layer
- **AND** independent parser, diagnostics, or harness work SHALL continue when it does not assume the unknown transition.

#### Scenario: Blocked live path is not the root outcome

- **WHEN** a live-attempt gate blocks repetition of one proof path but another safe real route can observe the accepted effect without weakening an invariant or protected boundary
- **THEN** main scopes the blocked gate to that exact path, reconciles the plan, and continues the original outcome through the alternate route
- **AND** evidence from the alternate route does not clear, waive, or claim the blocked path.

#### Scenario: Every sufficient route requires the protected action

- **WHEN** the original accepted outcome requires an effect that no safe real route can observe without an exact protected owner action and no independent accepted item remains runnable
- **THEN** main preserves that action as a non-product gate and reports the exact waiting state and resume condition
- **AND** it neither asks a product question, substitutes lower-fidelity evidence, rewrites artifacts to waive the action, nor executes it without authority.

### Requirement: Shift-left sequencing does not grant live authority
The shift-left contract SHALL NOT authorize credentials, remote or shared-environment access, physical effects, destructive or irreversible action, deployment, installation, activation, release, publication, or owner-controlled cost. Existing protected-boundary decisions, fail-closed safety and identity guards, restoration and cleanup, equivalence requirements, and blocked unchanged live attempts SHALL remain controlling.

Early per-slice characterization, Runtime Proof, proof runners, capture/evaluator, restoration tooling, and post-proof focused regression tests SHALL remain main or production-author responsibilities. Fresh critical-only SDET SHALL remain independent and test-only when the risk-trigger requirement applies.

#### Scenario: A real boundary requires physical access
- **WHEN** the first useful real observation requires a physical, credentialed, shared, costly, or otherwise owner-controlled operation
- **THEN** local harness and safety preparation may proceed
- **AND** no live request occurs before exact owner authorization and all applicable fail-closed gates are green.

### Requirement: Technical blockers receive bounded self-diagnosis before escalation

Before main declares a technical or evidence blocker, treats a negative observation as product failure, repeats a governed attempt, or escalates an unresolved prerequisite, it SHALL perform one bounded self-diagnostic pass when the cause or ownership is not already proven. The pass SHALL preserve the accepted goal and envelope; classify the affected layer as Product Candidate, Proof Runner, Evaluator, Environment, Authority, or `unknown`; separate current observed facts from assumptions; inspect material contradictions; verify environment-dependent identities used by the blocker claim; state the narrowest supported claim ceiling; and select the smallest safe causally distinct probe that can falsify a live hypothesis.

An obvious evidenced local defect MAY proceed directly to its authorized correction. When the bounded pass cannot resolve a technical or uncertain failure chain, no unused safe route is known, and owner-only status remains unproven, main SHALL invoke at most one correctly briefed diagnosis-only `troubleshooter` for that failure chain and verify its route. Another equivalent pass or consultation SHALL require new decision-changing evidence or a causally distinct mechanism. In an explicitly grind-enabled root, a proven non-product protected action or unavailable capability SHALL remain a scoped gate: main SHALL continue every independent runnable item and then enter exact non-product waiting if the runnable frontier empties. It SHALL NOT convert that gate into `product_decision_required` or a user question. Outside grind, the existing decision-ready owner handoff remains unchanged.

#### Scenario: Contradictory evidence points to the proof path
- **WHEN** direct runtime facts show that an accepted operation occurred while an indirect mandatory observer reports no event and its canary also reports no event
- **THEN** main classifies the observer, runner, and environment as live hypotheses before claiming Product Candidate failure
- **AND** it performs the smallest safe identity, topology, or observation-path probe without asking the owner to waive the evidence requirement.

#### Scenario: Straightforward local defect is already proven
- **WHEN** current source or runtime evidence proves one authorized local defect and the correction does not cross a protected boundary
- **THEN** main applies the smallest correction through its normal production-author route
- **AND** it does not add a generic diagnostic ceremony or invoke `troubleshooter` merely to reconfirm the known cause.

#### Scenario: Owner-only action is already proven
- **WHEN** the accepted outcome requires an exact protected action and evidence proves that no unused safe goal-preserving route can advance the dependency chain
- **THEN** a grind-enabled root preserves that action as a scoped non-product gate, completes every independent runnable item, and enters exact waiting only after the runnable frontier is empty
- **AND** it neither asks a product question nor runs diagnostic probes or invokes `troubleshooter` merely to reconfirm the action boundary; outside grind, the existing self-contained owner handoff remains available.

### Requirement: Absence-based evidence is qualified before it supports a blocker

A mandatory evidence source used to claim that an event, state, packet, process, response, or side effect is absent SHALL establish its current identity, freshness, observation point and intersection with the expected execution path, expected observable phenomenon, and one safe positive control that demonstrates the source can observe that phenomenon. If a positive control is unavailable, unauthorized, unsafe, or fails, the source SHALL be `unqualified`; its zero, empty, timeout, or absence result SHALL NOT establish Product Candidate failure, completion failure, or owner-only status.

Missing observer qualification SHALL keep only the dependent evidence lane unknown. It SHALL NOT clear or waive safety, identity, liveness, authorization, data-integrity, restoration, cleanup, irreversible-action, envelope, or live-attempt gates, and it SHALL NOT authorize another live or costly attempt through the same blocked path.

#### Scenario: Positive control fails
- **WHEN** a mandatory observer reports no accepted event and a safe positive control also produces no observation
- **THEN** the observer is classified as unqualified and its negative result cannot support a product-failure claim
- **AND** the next action diagnoses observer identity, configuration, or observation-point relevance at a safe lower rung.

#### Scenario: Qualified observer reports absence
- **WHEN** current identity and path checks are green, a representative positive control is observed, and the expected correlated event remains absent
- **THEN** the negative observation may contribute to the scoped blocker evidence
- **AND** main still preserves its claim ceiling and any contradictory direct runtime facts rather than converting one source into broader lifecycle authority.

#### Scenario: Positive control requires a protected effect
- **WHEN** qualifying the observer would require an unauthorized physical, credentialed, remote, destructive, costly, deployed, or otherwise protected action
- **THEN** the observer remains unqualified and the exact qualification path remains owner-blocked
- **AND** main continues any independent safe diagnosis or sufficient alternate proof route without performing or simulating the protected effect.

### Requirement: Diagnostic disposition remains scoped to the affected lane

The self-diagnostic result SHALL distinguish a blocked proof path from a blocked accepted outcome. A Proof Runner, Evaluator, Environment, or unqualified-observer defect SHALL invalidate only dependent evidence and SHALL NOT erase trustworthy direct observations from the same unchanged Product Candidate. When another sufficient safe route can observe the accepted effect, main SHALL keep the defective path blocked and continue through that route without claiming that it clears the defective path.

#### Scenario: Network observer is invalid but direct startup evidence is trustworthy
- **WHEN** immutable direct controller and relay observations remain correlated and a separate packet observer fails qualification
- **THEN** main preserves the direct product observations and marks only the network-observation lane unknown
- **AND** it does not report that startup failed or that the owner must relax the proof contract solely because the packet observer is invalid.

#### Scenario: Accepted outcome requires the unavailable observation
- **WHEN** the accepted observable proof explicitly requires one observation, every safe qualification or sufficient alternate route is exhausted, and the remaining prerequisite crosses an exact protected boundary or unavailable external capability
- **THEN** main stops at that exact decision-ready boundary with the supported claim ceiling
- **AND** it does not substitute unqualified absence, lower-fidelity evidence, or an agent-authored process-control change for the missing observation.

### Requirement: Ordinary Small reports verified outcome without qualification bookkeeping
Ordinary Small work SHALL report `Outcome: working | blocked | unknown`, representative runtime proof, applicable focused validation, and known limitations. It SHALL NOT assign RC numbers, promote stable, preserve RC history, or require a `Development-Stage` field unless the user explicitly requests qualification or project policy requires it.

#### Scenario: Bounded local fix is complete
- **WHEN** a bounded local change has a green representative happy path, complete accepted scope, green focused validation, and no known non-deferrable defect
- **THEN** its handoff reports `Outcome: working` with proof and validation
- **AND** contains no RC or stable ceremony.

### Requirement: Qualification stages are scoped to explicit qualification
The `Development-Stage: development | MVP | RC<n> | stable` lifecycle SHALL apply only when the user explicitly requests stable/full qualification, project policy requires qualification, or main enters qualification for a reachable named critical-risk class. Inside that track, representative proof, accepted scope, applicable validation, critical-risk disposition when triggered, monotonic RC numbering, candidate invalidation, and external-operation separation SHALL remain enforced.

#### Scenario: Material change has no qualification request or critical-risk trigger
- **WHEN** a Material change alters loaded lifecycle instructions but has no reachable named critical incident and no explicit or project-required qualification
- **THEN** it completes with verified outcome reporting rather than RC/stable promotion
- **AND** retains all applicable safety, proof, and validation gates.

#### Scenario: Project requires qualification
- **WHEN** project policy requires qualification
- **THEN** the full Development-Stage lifecycle applies
- **AND** stage labels never authorize deployment, release, credentials, or another protected action.

### Requirement: Critical SDET is risk-triggered and independent
Fresh test-only SDET SHALL be mandatory only when the enforced current envelope contains a reachable incident involving authorization or privacy compromise, important data corruption or loss, irreversible external action, materially wrong financial, legal, or business outcome, system-wide or mission-critical outage, another explicitly accepted critical consequence, or an explicit project or owner qualification requirement. When invoked, SDET SHALL remain fresh, independent, test-only, critical-focused, non-authorizing, and attributed to the exact candidate.

#### Scenario: Material change has no reachable critical incident
- **WHEN** a Material change has current proof and validation but no named reachable critical-risk class and no explicit SDET requirement
- **THEN** SDET is not a completion gate
- **AND** the handoff records the risk-trigger decision and evidence.

#### Scenario: Security boundary is reachable
- **WHEN** the current envelope can expose an authorization or privacy compromise
- **THEN** one fresh critical-focused SDET challenge is required after current proof and accepted-scope completion
- **AND** main independently dispositions every reported row.

### Requirement: Main may own focused regression tests after proof
After current representative happy-path proof, main MAY create or update the smallest focused regression test, fixture, or oracle needed for a reproduced accepted-outcome defect or realistic requirement-linked regression in either profile. Main SHALL NOT use this authority to impersonate an independent SDET challenge or create broad speculative coverage. A later SDET, when triggered, SHALL not have authored production and SHALL remain independent from main-authored tests.

#### Scenario: Ordinary regression is reproduced after proof
- **WHEN** main reproduces a non-critical but accepted-outcome regression after the happy path is current
- **THEN** main may add the smallest focused regression oracle and correct the defect
- **AND** runs the affected proof and validation without launching SDET solely for test authorship.

### Requirement: Representative proof and broad completion evidence remain separate
The active runtime authority SHALL use representative real-boundary proof as the earliest working signal, not as automatic evidence for every member, partition, compatibility surface, substitution, safety property, or phase or milestone claim. Before returning or archiving a broader claim, main SHALL identify its claim-evidence trigger, load the behavioral-substitution qualification workflow when omission or replacement behavior is involved, complete the required closure record and independent challenge, and report the supported claim ceiling.

Ordinary Small exact-case work SHALL retain its proportional route. A finite-population, partitioned-domain, real-system equivalence, compatibility, interchangeability, safety, or phase/milestone claim SHALL remain incomplete while matching population, path, environment, real-oracle, or unresolved-dependency closure is absent, even when accepted tasks, representative Runtime Proof, focused validation, or critical SDET are otherwise green.

#### Scenario: Representative proof supports only the exercised case
- **WHEN** one representative end-to-end case passes but accepted broad-scope rows remain unresolved
- **THEN** the exact exercised case may remain `supported`
- **AND** the broad claim remains `blocked` or `unknown` rather than complete.

#### Scenario: Substitution trigger loads focused qualification
- **WHEN** a change skips, suppresses, caches, replays, emulates, replaces, or optimizes away behavior whose omission depends on a model of another path or real system
- **THEN** main loads the focused substitution qualification contract before production mutation
- **AND** freezes baseline, candidate, population, observations, real boundary, and claim ceiling without turning the skill into authority for protected effects.

#### Scenario: Broad closure becomes current
- **WHEN** accepted scope is complete and the current closure record, required independent challenge, real-boundary proof, validation, and non-deferrable invariants all match the same candidate and claim
- **THEN** main may report that exact broader claim as supported
- **AND** lifecycle stage still does not widen it to another population or environment.

### Requirement: Outcome accountability and practice responsibility stay separate

Main SHALL retain the accepted mission outcome, scope, final implementation and integration decisions, Runtime Proof, finding disposition, lifecycle state, and owner handoff in Ordinary Small and Material work. Main's primary function SHALL be mission success through goal control, decomposition, resource selection, dependency management, evidence-based course correction, integration, and proof rather than maximizing direct task execution. For non-trivial root tasks, main SHALL use bounded team advice to identify work that benefits from procedural skill context, fresh specialist evidence, or isolated production delegation, while retaining the mission spine and every integration decision. Main MAY execute work directly when current evidence shows that direct execution is the shortest trustworthy route or requires inseparable global context. A registered Practice Owner SHALL own only its practice semantics, trigger applicability, runtime observation, and maintenance consistency. Team advisors, production workers, SDET, optional reviewers, and control-plane agents SHALL consume applicable practice constraints without becoming outcome owners or additional orchestrators.

When a practice controls a concrete implementation decision, including direct code versus a design seam, main SHALL make and integrate the decision against the accepted outcome after considering the owner evidence. The owner SHALL evaluate the practice and maintain its rule set but SHALL NOT select or authorize the product decision. A team recommendation MAY identify the decision and exact owner boundary but SHALL NOT make either decision.

#### Scenario: Change locality is materially triggered

- **WHEN** accepted variation, a mixed responsibility, state transition, system boundary, or important invariant makes change locality material
- **THEN** the `architecture-and-change-locality` owner reviews the named practice boundary
- **AND** main selects and proves the concrete direct implementation or smallest useful seam.

#### Scenario: Practice Owner recommends broader scope

- **WHEN** an owner report proposes work outside the accepted outcome or enforced envelope
- **THEN** main treats the proposal as non-authorizing evidence and keeps current scope unchanged
- **AND** only an independently required dependency closure or explicit owner scope decision can expand it.

#### Scenario: Worker receives an owned-practice constraint

- **WHEN** main delegates a production slice after a Practice Owner identified an applicable invariant
- **THEN** the brief carries the exact invariant and bounded evidence reference
- **AND** the worker preserves it or reports a conflict without invoking or impersonating the owner.

#### Scenario: Main retains the mission spine

- **WHEN** team advice identifies several bounded research, implementation, or review packages
- **THEN** main retains outcome interpretation, mission dependencies, cross-package ownership, integration, representative Runtime Proof inspection, course correction, and final disposition
- **AND** delegates only packages whose focused context or isolation has evidenced value greater than their handoff and integration cost.

#### Scenario: Direct work is a tactic rather than main's objective

- **WHEN** main can either execute a bounded package directly or delegate it without weakening ownership, safety, proof, or integration
- **THEN** main selects the route with the lower total mission cost and stronger expected evidence
- **AND** does not prefer direct execution merely because self-authorship feels more controllable.

#### Scenario: Specialist evidence is verified without wholesale rework

- **WHEN** a specialist returns a terminal attributable result with its assumptions, changed artifacts, evidence, and validation
- **THEN** main verifies critical facts, integration, candidate identity, and observable behavior at the sufficient boundary
- **AND** repeats deep work only when contradiction, stale evidence, unexplained failure, or material risk makes the original result insufficient.

#### Scenario: Advisor prepares a production delegation boundary

- **WHEN** a non-trivial task contains one isolated production package with exact write ownership, acceptance, proof input, and forbidden actions
- **THEN** the engagement map may return a dispatch-ready implementation brief boundary
- **AND** main verifies that boundary and remains responsible for dispatch liveness, integration, and current proof.

### Requirement: Practice routing preserves proportional delivery

Team advice and practice ownership SHALL not create an all-artifact checklist, a mandatory architecture phase, or a fixed reviewer sequence. Main SHALL obtain no advice for trivial owner-local work, use one fresh bounded recommendation for a new non-trivial root task, invoke no owner for a zero-trigger concern, and stop consultation once exact task-relevant evidence is sufficient for the next decision. Multiple independent specialist reports SHALL be batched only when supported by the discovered runtime and their scopes are isolated or exact non-overlapping; otherwise they SHALL be serialized without repeating the same concern.

Advisor and specialist reports SHALL be bounded to decision-relevant evidence and SHALL not restate the complete global philosophy, task transcript, active catalog, or another role's rules. Main SHALL integrate the result rather than paste it into later briefs or handoffs unless an exact finding, work boundary, or evidence reference remains material.

#### Scenario: One advisor recommendation is sufficient

- **WHEN** one engagement map resolves the current team topology and no material topology change occurs
- **THEN** main proceeds without repeated team-advisor calls
- **AND** retains only current work packages, activation conditions, evidence references, and invalidation facts in later context.

#### Scenario: One owner is sufficient

- **WHEN** one owner report resolves the only material practice uncertainty for the next implementation decision
- **THEN** main proceeds without optional owner or reviewer fan-out
- **AND** retains only the decision-relevant evidence in later context.

#### Scenario: Owner reports overlap

- **WHEN** two owner reports address the same concern despite registered boundary separation
- **THEN** main uses the registry to identify the primary practice, preserves both evidence sources, and records the overlap as maintenance evidence
- **AND** does not ask the team advisor to adjudicate practice semantics.

#### Scenario: Fixed lifecycle team is rejected

- **WHEN** a proposed engagement map recommends roles only because planning, implementation, testing, review, or completion stages exist
- **THEN** main rejects those recommendations unless each role has a unique current question, activation evidence, and expected output
- **AND** preserves the direct or smaller team path.

### Requirement: Main owns evidence-triggered next-change locality

The main session SHALL remain accountable for both the smallest complete current implementation and the concrete design and integration result that keeps the next plausible change local. The registered `architecture-and-change-locality` Practice Owner SHALL be responsible for the practice's trigger applicability, bounded observation, and maintenance semantics. A plausible change axis MUST be supported by an accepted requirement, an existing or explicitly planned variant, an inspected external or system boundary, a non-trivial state transition, an important invariant, or current source evidence. Hypothetical extensibility without one of those triggers SHALL NOT justify an abstraction or an owner call.

When a supported change axis exists, main SHALL name the responsibility or volatility being contained and select the smallest design seam that both isolates it and improves current comprehension, testability, safety, or change locality. When no supported axis exists, direct cohesive code SHALL remain the default. SOLID and Gang of Four patterns MAY describe a selected solution, but pattern use, pattern count, and formal pattern conformance SHALL NOT be acceptance criteria.

When a supported change axis exists, main SHALL obtain one bounded read-only observation from the registered `architecture-and-change-locality` Practice Owner before finalizing the owning design decision. Main SHALL retain that decision, implementation and integration responsibility when production work is delegated and SHALL communicate the applicable responsibility boundary, named change axis, and forbidden speculative structure through the existing production brief. The Practice Owner SHALL remain non-authorizing and SHALL NOT select the design, edit the candidate, dispatch another agent, or become a completion gate. `code-quality-reviewer` SHALL remain within the separate `simplicity-and-reuse` practice. When no supported change axis exists, no architecture Practice Owner launch SHALL be required solely for compliance.

#### Scenario: One-off owner-local defect remains direct

- **WHEN** inspected evidence shows one cohesive owner-local defect and no requirement-backed variant, system boundary, state transition, or invariant needs isolation
- **THEN** main selects the smallest direct correction and nearest representative proof
- **AND** it does not add an interface, factory, strategy, wrapper layer, plugin point, or mandatory architecture review.

#### Scenario: A second behavior variant is already accepted

- **WHEN** the current increment implements one behavior and an accepted requirement identifies a second behavior that changes along the same axis
- **THEN** main names that axis and chooses the smallest seam that keeps both behaviors under one cohesive owner or narrow interchangeable boundary
- **AND** the seam provides current comprehension or testability value rather than only hypothetical extensibility.

#### Scenario: Material change axis receives one practice observation

- **WHEN** accepted variation, a mixed responsibility, an inspected external/system boundary, a non-trivial state transition, or an important invariant makes change locality material
- **THEN** main invokes only the registered `architecture-and-change-locality` Practice Owner for a bounded practice observation
- **AND** main independently selects, integrates, and proves the concrete direct implementation or smallest useful seam.

#### Scenario: External dependency is an inspected volatility boundary

- **WHEN** accepted behavior depends on an external service, process, storage mechanism, protocol, or platform API whose failure and replacement semantics differ from domain policy
- **THEN** main keeps the external effect at a narrow cause-preserving boundary and keeps the policy locally testable
- **AND** it does not introduce a general plugin framework or unrelated infrastructure owner.

#### Scenario: Hypothetical plugin ecosystem is rejected

- **WHEN** the current requirement has one implementation and no evidence identifies another implementation, consumer, or compatibility obligation
- **THEN** main keeps the implementation direct and records no speculative extension mechanism
- **AND** future plugin support remains a separate change if evidence later makes it reachable.

#### Scenario: Delegated production slice preserves the decision

- **WHEN** main delegates a bounded production slice that contains a supported change axis or responsibility boundary
- **THEN** the production brief carries that exact boundary and the worker implements within it or returns a scoped conflict
- **AND** main verifies the integrated result's current behavior and change locality rather than treating the worker report as architecture approval.

#### Scenario: Pattern label does not prove quality

- **WHEN** a candidate uses a named SOLID principle or Gang of Four pattern
- **THEN** main evaluates the concrete responsibilities, dependencies, navigation cost, current payoff, and representative proof
- **AND** the label alone neither requires nor accepts the structure.

### Requirement: Same-responsibility new cases reshape the current owner

When an accepted increment adds behavior that is a new case of a current same-responsibility owner, the main session and production roles SHALL name that owner and implement the case by reshaping the owner. They SHALL NOT add a sibling file, function, or module for that case merely to keep the happy path additive or to avoid an "unrelated refactor".

Reshaping the current owner to absorb an accepted new case inside the existing write scope SHALL count as the smallest complete happy path for that increment. "Unrelated refactor" SHALL remain reserved for work outside the accepted case, named owner, or write scope. Hypothetical shared frameworks, third-copy extractions without a stable common shape, and new-responsibility seams SHALL stay forbidden or routed to `architecture-and-change-locality`.

Owner-local fixes, data/config/generated/mechanical edits, and selected-API glue SHALL remain exempt. A genuinely new responsibility with `no-current-owner` MAY use `build-minimal`. Mixed-file second responsibility or a named change axis SHALL still use the existing architecture practice, not this rule.

#### Scenario: Accepted new case is implemented on the current owner

- **WHEN** inspected source shows one current owner already responsible for the accepted capability and the increment adds another case of that capability
- **THEN** main or the production author changes that owner so both cases share it
- **AND** does not add a sibling implementation beside it.

#### Scenario: Additive sibling is rejected as the default happy path

- **WHEN** an implementation plan would add a new file or function that copies a live owner to deliver an accepted new case
- **THEN** the plan is not the smallest complete happy path
- **AND** the author records `extend` against the live owner or an exact reason that the responsibility is new.

#### Scenario: Architecture boundary stays separate

- **WHEN** the accepted behavior is a second responsibility in a mixed file or a named new change axis
- **THEN** main uses `architecture-and-change-locality` rather than forcing `extend` on the mixed owner
- **AND** `simplicity-and-reuse` is not launched solely for that seam decision.

### Requirement: Live-Attempt Gate reporting remains path-scoped

Every reported `Live-Attempt Gate: clear | blocked | unknown` SHALL name the exact governed invocation or proof path. A non-clear classification SHALL state its missing or failing gate evidence and SHALL state the operational consequence separately. The gate classification SHALL NOT imply resource availability, action authority, environment readiness, or accepted-outcome state; those facts SHALL be reported independently when material and SHALL remain `unknown` only when their own evidence is missing. A clear gate SHALL remain evidence about repeat eligibility for the named path and SHALL NOT grant authority for the underlying protected action.

#### Scenario: Gate evidence is unknown while the resource is available
- **WHEN** a controller, service, or other resource is known available and authorized but the retry condition for one named live proof path is unresolved
- **THEN** the report states `Live-Attempt Gate: unknown` for that path and separately preserves the known resource and authority facts
- **AND** it states that another high-cost live attempt through only that path remains blocked until the named unlock condition is satisfied.

#### Scenario: Resource availability and gate state are both unknown
- **WHEN** current facts establish neither resource availability nor the retry state of the named live proof path
- **THEN** the report records both unknowns as separate facts with their respective missing evidence
- **AND** it does not collapse them into one unsupported resource, path, authority, or outcome assertion.

#### Scenario: Path-only gate does not block the accepted outcome
- **WHEN** one live proof path is blocked or unknown and a safe dependency-valid offline or alternate sufficient route can still advance the accepted outcome
- **THEN** the report keeps the named path blocked and states the available next route
- **AND** it does not report the accepted outcome as blocked or ask the owner to restore an already known available resource.

#### Scenario: Clear gate does not authorize the underlying action
- **WHEN** a causal correction or newly available required observation clears the Live-Attempt Gate for a named path but the underlying live action still requires separate authorization or safeguards
- **THEN** the report states the clear path gate and the separate unresolved authority or safeguard state
- **AND** no live action is performed or described as authorized solely because the gate is clear.

### Requirement: Confirmed foundation defects recover autonomously and proportionally
When the registered foundation-integrity owner reports an applicable material
finding, main SHALL independently reproduce or falsify it before mutation. A
confirmed defect whose correction is uniquely determined by the accepted outcome
and safe current evidence SHALL become autonomous dependency-closure work: main
SHALL load the foundation recovery procedure, correct and re-prove the affected
path, and continue without requesting approval for planning artifacts, task state,
attempt controls, reviewer launches, or continuation.

Reviewer output alone SHALL NOT authorize mutation. Non-critical, speculative,
future-scope, style, architecture-polish, optional-test, and unrelated-maintainability
findings SHALL remain parked or omitted and MUST NOT extend the accepted scope or
qualification path. A genuinely unresolved protected product decision SHALL stop
only its dependent identity choice after safe discriminating work is exhausted;
unrelated work SHALL continue.

#### Scenario: Confirmed defect has one outcome-preserving correction
- **WHEN** main reproduces a current workload/profile/oracle mismatch and the accepted outcome identifies one matching current path
- **THEN** main corrects the dependent planning and proof route autonomously and returns it through affected Runtime Proof and validation
- **AND** no owner question is asked solely to approve the recovery process.

#### Scenario: Finding is non-critical architecture polish
- **WHEN** a reviewer observation changes neither the accepted outcome, current foundation relation, non-deferrable invariant, nor required proof
- **THEN** it creates no recovery task or lifecycle blocker
- **AND** current accepted work continues.

#### Scenario: Correction requires a protected product choice
- **WHEN** no safe evidence-backed route selects between materially different product identities and choosing one changes protected semantics
- **THEN** main preserves the exact ambiguity and asks only that owner decision under the existing owner-boundary contract
- **AND** the foundation reviewer does not decide or authorize it.

### Requirement: Decision-material work receives one early falsification episode

Change-Ready routing SHALL place the bounded falsification episode at the earliest
decision boundary before dependent implementation investment. Decision-material plans,
specifications, and architecture decisions SHALL use the pre-implementation readiness
owner. A Material request without such an artifact SHALL first create the smallest
project-native or session-local decision frame and use the same pre-implementation owner
before production mutation. `final-candidate-reviewer` SHALL remain optional and
concrete-risk-driven. A candidate whose implementation remains inside a current
challenged decision surface SHALL NOT receive a duplicate generic post-proof review
solely for compliance.

#### Scenario: Material change has a decision-material plan

- **WHEN** the plan receives a current terminal pre-implementation falsification episode and implementation preserves its challenged decision surface
- **THEN** main proceeds through proof and validation without a duplicate generic final review
- **AND** independently triggered exact Practice Owners and critical SDET retain their existing boundaries.

#### Scenario: Material change has no prior decision artifact

- **WHEN** a Material request has no OpenSpec change or other durable decision artifact before production mutation
- **THEN** main creates the smallest decision frame and supplies it with the original accepted request to one fresh `implementation-readiness-reviewer`
- **AND** production mutation waits for that early bounded disposition rather than a mandatory late generic review.

#### Scenario: Material implementation changes the challenged decision surface

- **WHEN** implementation evidence requires changing a previously challenged outcome, envelope, invariant, proof boundary, user-owned decision, or material-risk decision
- **THEN** main uses the episode's one permitted corrected-candidate re-review if still available
- **AND** an exhausted generic budget routes any exact remaining defect to focused proof or its registered Practice Owner rather than another generic verdict.

### Requirement: Review cannot convert non-critical observations into mandatory scope

Before and after representative proof, optional, future-scope, stylistic, speculative,
and non-critical quality observations SHALL remain outside mandatory accepted work unless
the owner separately changes the accepted outcome. A bounded falsification report SHALL
not override the existing post-MVP rule that only incomplete accepted scope and confirmed
accepted-outcome, critical, or non-deferrable defects require correction.

#### Scenario: Review reports optional architecture improvement

- **WHEN** the candidate already satisfies the accepted outcome and the row has no reachable current consequence
- **THEN** main parks or omits the observation without creating implementation or re-review work
- **AND** the episode terminates under its current material disposition.

### Requirement: Development detects and resolves current complexity pressure proportionally

Every behavior-changing increment SHALL perform a low-cost final check that the changed
behavior remains understandable through one cohesive owner and narrow neighbors, that
the consumer-facing entrypoint remains clear, and that material effects and failures are
not hidden. No separate artifact or review SHALL be required when those facts are clear.
When an explicit complexity request is in scope, or current work remains unable to reach
one understandable owner after targeted foraging and exact Practice Owner routing because
of competing extension paths, required unrelated context, scattered ownership, hidden
effects/failures, or blocking search noise, main SHALL run the focused complexity
workflow before adding dependent behavior. A named new seam or mixed responsibility by
itself SHALL keep the existing `architecture-and-change-locality` route and SHALL NOT
automatically load both mechanisms for the same trigger.

The resulting refactor SHALL remain current dependency closure only when it is necessary
to avoid structural degradation or complete the accepted outcome. Unrelated baseline
complexity SHALL remain parked unless the owner separately accepts that refactoring
outcome. After an admitted refactor, main SHALL replay the same representative consumer
scenario and applicable validation before dependent expansion.

#### Scenario: Ordinary change has no complexity pressure

- **WHEN** the changed behavior remains local to one cohesive owner with a clear entrypoint and proof boundary
- **THEN** main completes the normal architecture handoff without a separate complexity artifact or reviewer
- **AND** no baseline cleanup is admitted solely because the repository contains large files or old debt.

#### Scenario: Current implementation needs a mixed boundary

- **WHEN** the accepted change would otherwise add responsibility to mixed code and no separate focused complexity assessment is requested
- **THEN** main obtains the existing bounded architecture Practice Owner observation and implements the smallest main-owned owner reshape or cohesive extraction
- **AND** the focused skill is not loaded solely for that same seam fact and dependent behavior waits until the consumer scenario works at the representative real boundary.

#### Scenario: Project-level pressure is not current scope

- **WHEN** the focused workflow finds valid complexity outside the current outcome and non-deferrable invariants
- **THEN** main records the bounded finding or separately proposed refactoring outcome
- **AND** the finding does not become an implicit task, completion gate, or campaign severity upgrade.

### Requirement: Independent accepted work SHALL continue under scoped blockers
When a prerequisite, uncertainty, protected action, product decision, technical failure, unavailable capability, or Live-Attempt Gate blocks one dependency cone, main SHALL preserve that cone and its evidence ceiling while executing every dependency-valid accepted-scope item outside it. A blocker SHALL become global only when the still-current accepted outcome has no runnable independent item and the remaining decision is an exact material product choice; non-product prerequisites SHALL remain scoped gates or honest waiting states.

#### Scenario: Live-attempt lane is blocked but implementation work remains
- **WHEN** one proof lane has a blocked or unknown Live-Attempt Gate and an implementation, diagnostic, documentation, harness, or alternate-proof item does not depend on that lane
- **THEN** main keeps the live lane blocked and completes the independent item
- **AND** does not claim that independent evidence clears the Live-Attempt Gate.

#### Scenario: Product semantics are unresolved for one component
- **WHEN** a material product choice blocks one component and another accepted component is invariant across all current options
- **THEN** main parks the decision for the affected component and continues the invariant component
- **AND** asks the product question only when no dependency-valid accepted item remains.

#### Scenario: No executable route exists
- **WHEN** all incomplete accepted work depends on an unavailable technical, capability, safety, access, or external prerequisite and no product decision is required
- **THEN** main reports the exact non-terminal waiting state and resume condition
- **AND** does not relabel the prerequisite as a product blocker, waive it, repeat blindly, or claim completion.
