## ADDED Requirements

### Requirement: Team-advice artifacts are cohesive, discoverable, and least privilege

The retained team-advice implementation SHALL expose one dedicated `specialist-team-advisor` with this discovery contract: `Use before deciding to select or omit maintained routes in a new non-trivial parentless root mission; returns the smallest sufficient team. Stay quiet only for one already-selected existing-owner action with known proof.` It SHALL have one cohesive primary responsibility and a bounded output contract. Its permission map SHALL deny wildcard and every ordinary tool first, then allow only read, glob, grep, and `specialist_catalog`. It SHALL deny source/config/test/instruction mutation, user questions, nested agents, skills, remote effects, and protected actions.

`specialist-team-advisor` SHALL remain a non-Practice-Owner control-plane helper. `implementation-readiness-reviewer` SHALL retain the distinct `outcome-readiness` practice, and `qwen-local-worker` SHALL retain generic bounded first-pass work. The candidate SHALL NOT add a parallel routing skill, an existing-agent team-routing mode, another semantic router, or a complete agent/skill catalog copied into any prompt body.

#### Scenario: Readiness review remains distinct

- **WHEN** a non-trivial task needs both team composition and a materially triggered outcome-readiness challenge
- **THEN** `specialist-team-advisor` may recommend `implementation-readiness-reviewer` with its exact activation evidence
- **AND** neither agent assumes the other's semantic responsibility.

#### Scenario: Generic helper remains generic

- **WHEN** a task also contains bounded retrieval, extraction, or first-pass planning suitable for `qwen-local-worker`
- **THEN** the advisor may recommend that helper for the exact work package
- **AND** `qwen-local-worker` does not become the team router or a Practice Owner.

#### Scenario: Parallel routing skill is proposed

- **WHEN** a candidate adds a skill that repeats advisor trigger, catalog interpretation, engagement-map selection, or reconsultation semantics
- **THEN** strict review rejects the duplicate routing surface
- **AND** retains the compact main trigger plus the on-demand dedicated advisor body.

#### Scenario: Discovery description is vague

- **WHEN** the retained advisor description omits the positive non-trivial trigger, trivial exclusion, or smallest-team/non-dispatch boundary
- **THEN** structural validation fails with the exact missing discovery fact
- **AND** does not infer trigger quality from the body or agent name.

#### Scenario: Advisor uses a generic reviewer permission shape

- **WHEN** the advisor grants feedback-ledger edit, `complain`, an unmatched plugin tool, or omits wildcard-deny before its exact read/catalog allows
- **THEN** its dedicated non-reviewer validator branch fails with the exact permission mismatch
- **AND** the advisor is not accepted through the generic reviewer contract.

#### Scenario: Objective trivial fixture stays quiet

- **WHEN** a maintained negative fixture contains one action in one existing owner with known proof and no variation, new mechanism, cross-owner/system boundary, or material uncertainty
- **THEN** the root does not dispatch `specialist-team-advisor`
- **AND** description brevity does not weaken the ordinary outcome, safety, proof, or worktree floor.

### Requirement: Active catalog projection and semantic routing evidence remain separate

The advisor SHALL consume a stable privacy-safe projection of dispatchable artifacts available to the current root runtime. The projection SHALL contain only safe artifact id, artifact class, availability, a sanitized and length-capped frontmatter discovery description, redacted profile/source class and digest, and hashed root/session references. It SHALL omit prompt/body text, secrets, credentials, raw session ids, absolute paths, hidden agents, guard-only agents, non-dispatchable control-plane agents, and the advisor itself. Deterministic tooling SHALL validate schema, stable order, exact source/profile readback, safe values, and that every recommendation names an available dispatchable artifact. It SHALL NOT score task similarity, rank experts, infer triggers, select a team, or judge routing quality.

The `specialist_catalog` tool SHALL fail closed unless the caller is an attributable `specialist-team-advisor` child and its parentless root can be resolved. The advisor permission map SHALL use the existing wildcard-deny-then-exact-allow pattern. If current OpenCode custom-tool permissions or execution context cannot enforce both facts, provider-free preflight SHALL block behavior/profile mutation rather than exposing a broadly callable catalog.

Semantic retention SHALL use matched same-model baseline/candidate workflows over the `STA-001` maintained population. Evidence SHALL preserve original goal, scenario inputs, active catalog, source/model/profile/environment identities, advisor and child task events, engagement map, main disposition and dispatch, outputs, effects, changed-file manifests, forbidden-effect sentinels, latency/context facts, terminal liveness, cleanup, and provider-free replay. Candidate retention SHALL require every maintained positive and negative oracle rather than compensating a missed or extra route with lower latency or context.

#### Scenario: Recommendation names an unavailable artifact

- **WHEN** a captured engagement map recommends an agent or skill absent from its supplied active catalog
- **THEN** deterministic evaluation rejects the availability reference
- **AND** makes no semantic claim about which available artifact should replace it.

#### Scenario: Another agent calls the catalog tool

- **WHEN** main, a reviewer, worker, or any child other than the attributable `specialist-team-advisor` attempts `specialist_catalog`
- **THEN** the tool fails without returning catalog entries
- **AND** records only the privacy-safe caller/root mismatch needed for diagnosis.

#### Scenario: Project artifact description contains private text

- **WHEN** a project agent or skill discovery description contains a private sentinel, absolute path, control characters, or content beyond the reviewed bound
- **THEN** catalog projection redacts or rejects the unsafe value without returning body text
- **AND** preserves only the safe id/class/availability facts and a cause-preserving warning.

#### Scenario: Hidden control-plane agent is installed

- **WHEN** the root-effective runtime includes a hidden guard-only or non-dispatchable control-plane agent
- **THEN** the catalog omits it from advisor-selectable entries
- **AND** the engagement map cannot recommend it through availability projection.

#### Scenario: Helper attempts to rank specialists

- **WHEN** deterministic helper code assigns semantic relevance scores or chooses an agent from task text, paths, names, or keywords
- **THEN** strict validation rejects that inference mechanism
- **AND** leaves team selection to the bounded model advisor and main disposition.

#### Scenario: Smaller or faster candidate misses a route

- **WHEN** a candidate reduces latency or context but misses an expected maintained advisor, skill, owner, worker, or conditional-expertise behavior
- **THEN** the candidate is rejected for that scenario
- **AND** the evidence claim remains narrowed to actual observed behavior.

### Requirement: Compaction preserves current engagement state without replaying the catalog

`global/AGENTS.md` SHALL own the canonical conditional `Team Advice State` field contract. The configured compaction prompt and any maintained model-profile rendering SHALL carry only the synchronized runtime instruction needed to emit those fields and SHALL be validated against the canonical contract rather than becoming another semantic owner.

When a current team recommendation exists, compaction SHALL preserve only these exact `Team Advice State` fields: `Advisor Task Ref`, `Candidate Ref`, `Catalog Ref`, `Main Disposition`, `Active Work Packages`, `Terminal Work Packages`, `Pending Activation Evidence`, `Specialist Liveness`, `Integration State`, `Unavailable Material Capabilities`, and `Reconsultation Condition`. It SHALL NOT call tools, verify runtime availability, inject the full available-artifact catalog, repeat completed report prose, turn conditional roles into mandatory work, infer a new team, or trigger reconsultation solely because compaction occurred.

After compaction, main SHALL verify current candidate, catalog, child liveness, and task-topology identities before resuming dispatch or integration. A material mismatch SHALL invalidate only the dependent engagement rows and trigger one updated recommendation when the non-trivial task still requires it.

#### Scenario: Compaction occurs during an unchanged engagement map

- **WHEN** compaction occurs while task topology, candidate, catalog, ownership, and activation evidence remain unchanged
- **THEN** the summary preserves the current work-package and integration state
- **AND** the resumed session does not call the advisor or specialists again solely because of compaction.

#### Scenario: Compaction resumes with a changed active catalog

- **WHEN** the resumed root session verifies that the active catalog differs from the catalog used by pending advice
- **THEN** pending availability-dependent recommendations become stale and one updated team recommendation is required before dispatch
- **AND** terminal prior evidence remains attributed to its original catalog and candidate.

#### Scenario: Compaction runtime prompt drifts from canonical fields

- **WHEN** the configured compaction prompt or a maintained model-profile rendering omits or contradicts a canonical `Team Advice State` field
- **THEN** focused structural validation fails with the exact surface and field
- **AND** no runtime prompt becomes a second semantic source.
