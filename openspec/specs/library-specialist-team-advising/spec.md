# library-specialist-team-advising Specification

## Purpose
Defines proportional fresh-context team advice that reduces main-session cognitive load while preserving main as the sole task orchestrator, integrator, proof owner, and protected-decision authority.

## Requirements

### Requirement: Non-trivial root tasks receive proportional team advice

After initial foraging has established the original goal reference, observed repository/task state, material unknowns, current candidate or worktree identity, and operating constraints without creating a decision-material plan or behavior-affecting mutation, main SHALL obtain one fresh bounded team recommendation for a new non-trivial root mission episode. A root mission episode begins when a parentless user-facing root session accepts a new outcome that is not a continuation of its current accepted mission. Child specialists, guard/compaction sessions, campaign executor sessions, and propose/apply commands continuing the same outcome SHALL NOT begin another episode.

A task SHALL remain direct only when current evidence shows one action inside one existing cohesive owner, a known representative proof boundary, no accepted variation or new mechanism, no cross-owner or external/system boundary, and no material practice, authority, or evidence uncertainty. Main SHALL NOT have to decide whether a specialist would be useful in order to qualify this objective trivial bypass.

The advisory pass SHALL NOT create a fixed lifecycle phase or require a specialist merely because one is available. It SHALL be valid for the advisor to return `main-alone` when no skill or subagent adds unique task-relevant value.

#### Scenario: Trivial owner-local work stays direct

- **WHEN** current evidence shows one action inside one existing cohesive owner, a known representative proof, no accepted variation or new mechanism, no cross-owner or system boundary, and no material practice, authority, or evidence uncertainty
- **THEN** main proceeds without team advice
- **AND** the ordinary outcome, safety, worktree, proof, and validation floor remains unchanged.

#### Scenario: New non-trivial root task receives one advisory pass

- **WHEN** a new root task has multiple plausible expertise surfaces, a material unknown, a useful delegation boundary, or a non-local integration shape
- **THEN** main obtains one fresh bounded team recommendation after initial foraging and before substantial execution or behavior-affecting mutation
- **AND** no fixed reviewer sequence or all-agent checklist is created.

#### Scenario: Same mission moves from propose to apply

- **WHEN** a parentless root session continues the same accepted mission from OpenSpec proposal into apply without a material topology change
- **THEN** that command transition does not begin a second advisory episode
- **AND** current engagement state remains subject only to its existing reconsultation condition.

#### Scenario: Campaign executor is a child control plane

- **WHEN** a campaign controller creates a child executor for work already decomposed under another mission control plane
- **THEN** the child does not treat its startup as a new user root advisory episode
- **AND** any future campaign integration remains separately specified rather than inferred by this capability.

#### Scenario: Advisor recommends main-alone

- **WHEN** the advisor finds that available skills and subagents add no unique evidence or bounded execution value to the current task
- **THEN** it returns `main-alone` with the exact evidence and reconsultation condition
- **AND** main continues without a ceremonial specialist call.

### Requirement: Advice uses current task evidence and the active artifact catalog

The advisor brief SHALL include the original user goal, accepted outcome and non-goals when known, operating and authority constraints, observed state versus assumptions and unknowns, current candidate or artifact references, and active work packages. The advisor SHALL fetch a privacy-safe catalog of the agents and skills actually available to the parent root session through its sole `specialist_catalog` tool before selecting a team. The returned catalog and catalog reference become advisor input evidence; main SHALL NOT manually copy the catalog into the brief, and the advisor SHALL NOT depend on a duplicated static roster inside its body.

Missing, unreadable, stale, or contradictory catalog or task evidence SHALL remain explicit. The advisor SHALL recommend only artifacts present in the supplied active catalog and SHALL distinguish an unavailable but potentially relevant capability from an available recommendation.

#### Scenario: Active profile omits a relevant domain agent

- **WHEN** task evidence indicates a domain concern but the corresponding agent is absent from the supplied active profile catalog
- **THEN** the advisor reports the unavailable capability and the narrowest resulting evidence gap
- **AND** it does not invent, silently load, or recommend dispatch to an unavailable agent.

#### Scenario: Catalog fetch fails inside the advisor

- **WHEN** `specialist_catalog` cannot establish a current parent-root catalog and identity
- **THEN** the advisor returns `Team Advice: unknown` with the exact catalog failure
- **AND** main does not reconstruct or paste a roster as a silent fallback.

#### Scenario: Catalog changes between recommendations

- **WHEN** a later task-topology change is evaluated against a different active artifact catalog
- **THEN** the new recommendation identifies the current catalog and does not reuse stale availability facts
- **AND** prior advice remains attributable to its original catalog identity.

### Requirement: Advice returns the smallest sufficient engagement map

The advisor SHALL return one concise engagement map containing: the task topology and mission spine; work best retained by main; skills to load for procedural guidance; subagents to consult now; conditionally useful subagents with exact activation evidence; dependency or safe parallelism relationships; the unique question, expected evidence, and bounded read/write role for each recommendation; dispatch-ready brief boundaries; artifacts considered but intentionally omitted when omission is decision-relevant; and the exact condition that invalidates the map or warrants reconsultation.

The engagement map SHALL optimize for the smallest sufficient team. It SHALL NOT use agent count, review count, broad quality possibility, generic uncertainty, or lifecycle stage as sufficient reason for a recommendation.

#### Scenario: Skill is sufficient without a fresh agent

- **WHEN** the task needs a maintained procedure but no independent judgment, isolated execution, or fresh-context challenge
- **THEN** the engagement map recommends the exact available skill and no subagent for that concern
- **AND** states what task evidence would make a fresh agent useful later.

#### Scenario: Fresh specialist adds unique evidence

- **WHEN** a bounded domain question benefits from independent context and an available specialist can return unique source, runtime, risk, or compatibility evidence
- **THEN** the map recommends that specialist with the unique question, earliest useful input boundary, expected evidence, and bounded role
- **AND** does not assign the same primary concern to another specialist.

#### Scenario: Direct main work is the shortest trustworthy route

- **WHEN** a bounded work package is tightly coupled to current integration state and delegation would add more handoff, liveness, or reintegration cost than focused execution
- **THEN** the map retains that package as direct main work with its proof boundary
- **AND** does not delegate merely to maximize agent use.

#### Scenario: Specialist is useful only after an artifact exists

- **WHEN** a specialist cannot add reliable evidence until a concrete design, candidate, wire format, runtime proof, or other named input exists
- **THEN** the map records the specialist as conditional with that exact activation evidence
- **AND** main does not launch it early solely to satisfy the advisory result.

### Requirement: Main retains orchestration and result authority

The advisor SHALL remain read-only and non-authorizing. It SHALL NOT mutate source, tests, config, instructions, OpenSpec artifacts, or remote state; ask the user; dispatch or resume another agent; allocate write ownership; authorize a protected action; expand accepted scope; decide a product or architecture result; set lifecycle state; accept evidence; or declare completion.

Main SHALL inspect and disposition the engagement map, select and dispatch specialists through the active root adapter, preserve writer liveness and non-overlapping ownership, maintain the mission dependency and integration spine, inspect specialist evidence, reproduce contradictory or material findings when needed, run or inspect Runtime Proof, and own the final result. Main SHALL NOT accept a specialist report blindly, but it SHALL also NOT repeat the specialist's complete bounded analysis or implementation solely to manufacture confidence when direct source, artifact, and real-boundary evidence can verify the result. Advisor evidence SHALL NOT substitute for these duties.

#### Scenario: Advisor proposes broader scope

- **WHEN** a recommendation would add behavior or risk outside the accepted outcome or enforced envelope
- **THEN** main rejects or parks that recommendation as non-authorizing evidence
- **AND** the advisor report does not expand the task.

#### Scenario: Recommended specialist is dispatched

- **WHEN** main accepts a recommendation whose activation evidence is current
- **THEN** main creates the bounded specialist brief and dispatches it through the root session
- **AND** the advisor neither creates the child nor becomes responsible for its liveness, integration, or result.

#### Scenario: Main verifies without duplicating the specialist

- **WHEN** a bounded specialist returns attributable source or artifact changes, evidence, assumptions, and validation against its accepted brief
- **THEN** main checks ownership, critical facts, integration behavior, and the nearest sufficient real boundary
- **AND** reopens deep specialist analysis only for a contradiction, unexplained failure, stale identity, material evidence gap, or changed mission requirement.

### Requirement: Advice is refreshed only for material task-topology change

One advisory result SHALL remain current only for the task outcome, evidence, candidate, active catalog, and engagement assumptions it identifies. Main SHALL reconsult once when new decision-changing evidence materially changes the expertise surfaces, accepted scope, operating envelope, integration boundaries, available catalog, work-package ownership, or readiness of a previously conditional specialist. Ordinary progress, a completed work package, compaction alone, or an unchanged candidate SHALL NOT trigger repeated advice.

#### Scenario: New concurrency boundary appears during implementation

- **WHEN** inspected source reveals a previously unknown concurrency ownership or shutdown boundary that can change work decomposition or required expertise
- **THEN** main obtains one updated recommendation against the new evidence and current catalog before crossing that boundary
- **AND** preserves the prior map and the exact invalidating observation.

#### Scenario: Ordinary progress does not retrigger advice

- **WHEN** work advances inside the current engagement map without a material topology, evidence, catalog, or ownership change
- **THEN** main continues integration without another advisor call
- **AND** does not treat routine milestones as routing events.

### Requirement: Advisor unavailability is visible and proportional

If the advisor is absent, unreadable, times out, returns malformed output, or cannot establish a current active catalog, main SHALL record the exact capability gap and establish terminal child cessation or read isolation before dependent fallback work continues. Main MAY continue a bounded task when the accepted outcome, expertise needs, authority, and proof boundary are independently clear, but SHALL NOT claim that team advice operated successfully.

An unavailable advisor SHALL NOT weaken exact Practice Owner triggers, critical SDET requirements, safety or protected-action gates, writer-liveness rules, or current evidence gaps.

#### Scenario: Advisor is unavailable for a clear bounded task

- **WHEN** the advisor cannot run but main has direct current evidence for a bounded team, ownership, authority, and proof path
- **THEN** main records advisory routing as unavailable and proceeds with that narrow result
- **AND** does not convert advisor absence into a user process-approval question.

#### Scenario: Advisor times out but remains live

- **WHEN** an advisor timeout or malformed-report path cannot prove terminal child cessation or revoke its read authority
- **THEN** dependent fallback dispatch and completion remain blocked on that child identity
- **AND** cancellation acknowledgement alone is not treated as closure.

#### Scenario: Advisor is unavailable while team topology is materially unknown

- **WHEN** the advisor cannot run and unresolved expertise or ownership can affect an accepted outcome or non-deferrable invariant
- **THEN** the affected decomposition remains `unknown` until main obtains sufficient direct evidence or an available exact owner observation
- **AND** advisor absence does not authorize speculative dispatch or unsafe progress.
