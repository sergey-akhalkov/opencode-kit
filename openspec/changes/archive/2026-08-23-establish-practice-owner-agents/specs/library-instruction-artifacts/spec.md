## MODIFIED Requirements

### Requirement: Reviewer roles remain optional and non-authorizing

Read-only final, delivery, code-quality, and domain reviewers SHALL remain non-authorizing and SHALL return evidence-backed risk matrices or the code-quality reduction matrix rather than overall acceptance verdicts, lifecycle blockers, or work-authoring actions. Reviewers that are not registered Practice Owners SHALL remain optional and risk-driven. A registered Practice Owner consultation SHALL be required only when its reviewed material trigger or material applicability-uncertainty trigger is reached; zero-trigger Ordinary Small work SHALL require no owner launch solely for compliance.

The fresh evidence-sufficiency Practice Owner SHALL be required as one current evidence source only when a claim explicitly declares a finite-population, partitioned-domain, real-system equivalence, compatibility/interchangeability, safety, or phase/milestone class. Its output SHALL NOT approve or block Development-Stage by itself; main owns reproduction and disposition, and a missing or unusable report keeps only the declared broad claim `blocked` or `unknown`. Ordinary Small exact-case work and optional final, delivery, code-quality, and domain review SHALL retain proportional routing.

No reviewer or Practice Owner launch count or output SHALL approve or block Development-Stage by itself. Main SHALL own reproduction and disposition. Missing or unusable owner evidence SHALL leave that practice explicit as `unknown`; only independently reachable accepted-outcome or non-deferrable safety consequences SHALL affect completion or lifecycle eligibility.

#### Scenario: Reviewer output cannot approve a stage

- **WHEN** an optional non-owner reviewer returns a risk matrix
- **THEN** main owns reproduction and disposition
- **AND** the reviewer output does not set or block Development-Stage by itself.

#### Scenario: Practice trigger requires its owner

- **WHEN** a registered material practice trigger is reached
- **THEN** main requests one bounded observation from the exact Practice Owner
- **AND** the owner report remains non-authorizing evidence rather than an acceptance gate.

#### Scenario: Broad claim challenge is evidence not approval

- **WHEN** a declared broad claim lacks its required fresh evidence-sufficiency report
- **THEN** that claim cannot be represented as supported
- **AND** no reviewer verdict is substituted for main-owned closure facts.

#### Scenario: No practice trigger is reached

- **WHEN** bounded Ordinary Small work reaches no registered material or uncertainty trigger
- **THEN** no Practice Owner or optional reviewer report is required solely for lifecycle completion
- **AND** main still satisfies the always-loaded outcome, safety, proof, and validation floor.

## ADDED Requirements

### Requirement: Practice Owner artifacts use one shared contract

The repository SHALL maintain one canonical Practice Owner authoring and validation contract. Every registered owner body SHALL expose one exact Practice ID, one coherent primary boundary, runtime and maintenance triggers, owned and excluded concerns, authority limits, required inputs, and the common practice-level report fields. Read-only reviewer owners SHALL retain the shared leaf-reviewer permission and evidence contract; bounded specialist owners SHALL retain their stricter existing role contract. Practice ownership SHALL NOT widen tool permissions.

Shared runtime ownership invariants SHALL be supplied by compact always-loaded authority and role-specific owner bodies. Complete ownership boilerplate SHALL NOT be copied into every owner. Agent discovery descriptions SHALL contain a deterministic Practice ID marker and a concise material trigger so main can route without loading every owner body.

#### Scenario: Owner artifact is discoverable

- **WHEN** OpenCode presents the selected agent catalog to main
- **THEN** each Practice Owner description exposes its exact Practice ID and concise trigger boundary
- **AND** the complete owner body remains on demand.

#### Scenario: Owner requests wider permissions

- **WHEN** practice ownership metadata is added to an existing read-only reviewer
- **THEN** its source/config/test mutation, question, nested-agent, and remote permissions remain denied
- **AND** ownership alone does not justify a permission expansion.

#### Scenario: Owner body duplicates the shared contract

- **WHEN** a registered owner inlines the complete shared ownership boilerplate rather than its role-specific delta
- **THEN** strict validation fails with the canonical contract and offending owner path
- **AND** the duplicate is replaced by the reference and local boundary.

### Requirement: Practice ownership uses reviewed seed data and exact validation

The Practice Ownership Registry SHALL be a reviewed versioned semantic seed outside validator/helper source. Deterministic tooling SHALL validate schema version, safe IDs and paths, stable order, uniqueness, existing owner files, exact description/body markers, canonical artifact existence, runtime-profile inclusion, README/catalog synchronization, and readback/regeneration drift. It SHALL NOT score practice quality, infer triggers, choose owners, merge practices, or derive semantic policy from source text.

Human-readable ownership maps and derived counts SHALL come from the reviewed registry or be checked against it. Unsupported, unreadable, missing, or ambiguous records SHALL fail with cause-preserving diagnostics rather than being assigned to main or a generic reviewer automatically.

#### Scenario: Duplicate owner is declared

- **WHEN** two registry records assign one agent two primary Practice IDs or assign two owners to one Practice ID
- **THEN** validation fails before profile or instruction materialization
- **AND** names the conflicting reviewed records without selecting a winner.

#### Scenario: README ownership map drifts

- **WHEN** the human-readable Practice Owner map differs from the reviewed registry
- **THEN** validation reports the exact missing, extra, or mismatched ID and agent
- **AND** does not accept the prose catalog as a second authority.

#### Scenario: Semantic trigger text changes

- **WHEN** a Practice Owner trigger changes while structural registry checks remain green
- **THEN** matched behavior evaluation and semantic owner-maintenance evidence remain required
- **AND** deterministic success alone does not establish correct routing.

### Requirement: Practice ownership reduces main context without hiding authority

The complete detailed practice bodies SHALL remain on demand. Always-loaded authority SHALL contain only the generic main-versus-owner responsibility split, non-delegable safety and result kernel, exact proportional routing rule, and failure behavior. New owner descriptions and routing text SHALL remain inside the selected runtime-profile discovery and committed startup budgets. New always-loaded wording SHALL replace or consolidate overlapping main-only reviewer routing rather than add a second complete policy block.

Behavior retention SHALL use matched disposable workflows with exact child-agent identities, bounded owner report bytes, main disposition, outcomes, forbidden effects, validation, and cleanup. A lower startup or main-context proxy SHALL not compensate for a missed trigger, unsafe action, lost outcome, undispositioned finding, unnecessary owner launch, or incomplete cleanup.

#### Scenario: Owner bodies remain large but on demand

- **WHEN** the selected catalog contains detailed owner instructions
- **THEN** loader-visible inventory reports those bodies separately from startup authority and discovery metadata
- **AND** no startup claim counts an uninvoked body as loaded main context.

#### Scenario: Generic routing increases startup text

- **WHEN** the candidate adds Practice Owner routing to global authority
- **THEN** the combined committed startup token proxy remains at or below the current enforced maximum and no greater than the frozen candidate baseline
- **AND** removed text is proven overlapping rather than an unrelated safety or authority rule.

#### Scenario: Smaller candidate misses a trigger

- **WHEN** a compact candidate fails to invoke the exact owner in a maintained triggered scenario
- **THEN** the behavior candidate is rejected regardless of its token or latency reduction
- **AND** the narrower supported context claim is preserved.
