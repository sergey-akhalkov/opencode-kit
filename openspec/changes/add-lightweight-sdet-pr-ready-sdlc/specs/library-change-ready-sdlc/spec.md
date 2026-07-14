## ADDED Requirements

### Requirement: SDLC-000 Portable core uses project-native adapters

The portable SDLC SHALL define lifecycle roles, ordering, evidence, failure routing, and readiness outcomes
without prescribing a programming language, framework, package manager, build system, test framework,
version-control system, CI/hosting provider, operating system, shell, repository layout, issue tracker,
review product, agent product, model provider, or fixed command.

Each project SHALL provide or discover an adapter for its authoritative requirement sources, production
author, SDET capability, validation procedures, candidate-capture mechanism, deterministic candidate
identity-generation capability (part of candidate capture or a paired adapter), independent final reviewer,
delivery/readiness gate, external-operation policy, and native readiness label. An adapter MAY map multiple
capabilities to one platform, but SHALL preserve the role-independence and ordering requirements of this
specification. Missing mandatory capability SHALL be `unknown` or `blocked`; missing reproducible candidate
identity-generation capability SHALL block qualification; the orchestrator SHALL NOT invent a stack-specific
fallback or portable hash algorithm.

Examples in design, tasks, templates, or documentation SHALL be explicitly non-normative and SHALL NOT
become portable defaults merely because the kit implementation uses them.

A kit or project MAY configure a fixed model or variant for one conforming adapter when its owner accepts
the quality, cost, and correlation trade-off. That local adapter configuration SHALL NOT become a portable
default, SHALL NOT weaken role separation, and SHALL NOT require another project to use the same model,
provider, or agent implementation.

#### Scenario: project does not use Node.js or npm

- **GIVEN** a target project uses another language and build/test ecosystem
- **WHEN** the orchestrator prepares validation
- **THEN** it SHALL discover project-native procedures from that project's accepted sources
- **AND** SHALL NOT introduce npm, Node.js, or JavaScript tooling solely because the reusable kit uses it.

#### Scenario: project has no Git repository

- **GIVEN** a target workspace has no Git metadata
- **WHEN** the orchestrator captures the current candidate
- **THEN** it SHALL use a project-available filesystem, manifest, artifact, or other reviewable comparison
- **AND** SHALL NOT block solely because Git-specific status or diff commands are unavailable.

#### Scenario: project uses a native readiness label

- **GIVEN** a project uses merge requests, changesets, patches, release bundles, or another delivery model
- **WHEN** the local candidate becomes Change-Ready
- **THEN** the adapter MAY render the project-native label
- **AND** the underlying Change-Ready evidence and no-external-action boundary SHALL remain unchanged.

#### Scenario: mandatory capability has no adapter

- **GIVEN** a required independent reviewer or validation boundary has no conforming project adapter
- **WHEN** readiness is evaluated
- **THEN** the capability SHALL be `blocked`
- **AND** the orchestrator SHALL NOT silently substitute a hard-coded tool from another project.

#### Scenario: kit production adapter pins a model for cost control

- **GIVEN** one kit-specific production adapter has an owner-selected fixed model and variant
- **WHEN** the portable SDLC is used in another project
- **THEN** the orchestrator SHALL treat that setting as local adapter configuration
- **AND** SHALL NOT require the project, SDET adapter, or final-review adapter to inherit it.

### Requirement: SDLC-001 Runtime SDLC uses proportional Small and Material profiles

The portable runtime instructions SHALL initially classify work as exactly `Small` or `Material`. Small SHALL
require clear requirements, local reversible scope, one affected boundary, known focused validation, and no
public-contract, persisted-data, migration, security, concurrency, deployment, or compatibility risk. Any
false or unknown Small condition SHALL select Material. A run MAY escalate only from Small to Material when
new risk appears and SHALL NOT discard already-required evidence by downgrading later.

SDET applicability SHALL depend on behavior, not profile. Every behavior change SHALL receive fresh
independent SDET assessment. Content-only work MAY use SDET `N/A` only when evidence shows it cannot affect
runtime, loading, routing, protocol, configuration, generated output, or user-visible behavior.

#### Scenario: inert typo remains Small

- **GIVEN** a local prose typo is not loaded, parsed, generated, or used for routing
- **WHEN** the orchestrator classifies the task
- **THEN** it SHALL select Small
- **AND** SHALL record SDET `N/A` with the non-behavior evidence
- **AND** SHALL NOT require Material-only planning or reviewer fan-out.

#### Scenario: local behavior change still uses SDET

- **GIVEN** a reversible local change satisfies every Small condition but changes observable behavior
- **WHEN** production proof succeeds
- **THEN** a fresh SDET context SHALL assess the change
- **AND** Material-only ceremony SHALL remain unnecessary unless risk escalates.

#### Scenario: ambiguous public behavior is Material

- **GIVEN** a change adds retries to a public client
- **AND** retry eligibility, idempotency, timeout, cancellation, or duplicate effects are unresolved
- **WHEN** the orchestrator classifies the task
- **THEN** it SHALL select Material
- **AND** mutation SHALL wait for incompatible outcomes to be resolved.

#### Scenario: loaded instructions are behavior-changing

- **GIVEN** a change affects a loaded prompt, routing metadata, generated-output source, or code-generation
  directive
- **WHEN** SDET applicability is classified
- **THEN** the change SHALL require SDET unless project evidence proves the artifact is inert
- **AND** SHALL NOT receive `N/A` based on file type alone.

### Requirement: SDLC-002 Relevant roles receive one Authoritative Brief

Before every subagent dispatch, the orchestrator SHALL create a self-contained execution-ready
Authoritative Brief and provide it to every production author, SDET, specialist/final reviewer,
readiness/delivery reviewer, and handoff-package author. It SHALL NOT delegate a raw user prompt, rely on
hidden conversation context, or require the receiver to reconstruct settled intent.

Every brief SHALL contain: role; objective as the required end state/value; business/system context;
current state and evidence separated into observations, assumptions, hypotheses, and recommendations;
original task and authoritative source references; later owner decisions and superseded statements;
required deliverables; in-scope and out-of-scope/non-goals; exact read/write scope and forbidden actions;
requirements and invariants; resolved decisions and rationale; inputs/source of truth; dependencies and
preconditions; independently checkable acceptance criteria; exact verification procedures and expected
success; return contract; and blocker/escalation policy. Applicable domain expectations and unknowns SHALL
be explicit. A field MAY use `N/A - <reason>` but SHALL NOT be silently omitted.

Small and Material SHALL use the same contract. Small SHALL keep field values proportional and compact;
Material SHALL provide the depth required by its risk. Before dispatch, the orchestrator SHALL verify that
a capable cold-context receiver can state the required result, value, boundaries, proof, and return shape
without guessing. Failed briefing readiness SHALL block dispatch.

Roles SHALL retain direct access to relevant original sources. Summaries and task trackers SHALL aid
navigation but SHALL NOT replace, narrow, or silently reinterpret those sources. Source, tests, schemas,
and runtime output MAY establish current behavior but SHALL NOT invent product intent. Missing performance,
security, reliability, compatibility, protocol, operations, or privacy expectations SHALL be reported as
`unknown` with the minimum required evidence or owner decision.

A material requirement or owner-decision change SHALL update the brief and invalidate affected production,
SDET, validation, and review evidence. The portable contract SHALL NOT require manual source-hash sets,
hidden message identifiers, environment identity hashes, or a second requirements packet when no
deterministic project mechanism owns them.

#### Scenario: durable specification remains authoritative

- **GIVEN** the project uses an accepted durable specification source
- **WHEN** production, SDET, or review is dispatched
- **THEN** the brief SHALL identify the complete applicable specification and execution context
- **AND** a convenience summary alone SHALL be insufficient.

#### Scenario: cold-context subagent receives an executable brief

- **GIVEN** a subagent has no prior conversation history
- **WHEN** the orchestrator prepares dispatch
- **THEN** the brief SHALL provide all required inputs, decisions, boundaries, acceptance checks,
  verification, and output fields
- **AND** the receiver SHALL NOT need to rediscover owner intent or ask the user directly
- **AND** an unresolved owner decision SHALL block only the dependent work.

#### Scenario: later owner decision remains transparent

- **GIVEN** a later explicit owner decision supersedes one original statement
- **WHEN** the orchestrator updates the brief
- **THEN** both the original source and superseding decision SHALL remain traceable
- **AND** affected evidence based on the old decision SHALL be stale.

#### Scenario: missing domain target is not guessed

- **GIVEN** a performance-affecting change has no accepted workload or objective
- **WHEN** a reviewer evaluates it
- **THEN** the reviewer SHALL report the missing expectation as `unknown`
- **AND** SHALL NOT invent a readiness threshold.

### Requirement: SDLC-003 Applicable proof precedes independent SDET

For behavior-changing work, the configured bounded production author SHALL implement the smallest complete
happy path and SHALL NOT create or modify automated tests, fixtures, snapshots, fakes, simulators,
harnesses, or golden artifacts. A project adapter MAY use any agent, process, language, framework, or
toolchain only when it satisfies the same production-only contract.

The production author SHALL receive the Authoritative Brief and exact write scope, preserve unrelated work,
return changed artifacts and an observable proof procedure, and SHALL NOT claim SDET, final review,
delivery, or change-ready completion. The orchestrator SHALL execute applicable existing checks and
observable happy-path proof before SDET starts.

When accepted scope changes only automated tests, fixtures, simulators, harnesses, snapshots, or test
oracles and requires no production behavior change, the orchestrator SHALL NOT invent a production edit or
dispatch. It SHALL capture baseline/current-boundary evidence and dispatch fresh SDET as the sole test
content author. Project-native validation and independent final review SHALL still apply.

An embedded or checkpoint review that occurs before SDET SHALL be implementation feedback only and SHALL
NOT satisfy final review.

#### Scenario: production proves a bounded happy path

- **GIVEN** resolved requirements and a bounded production write scope
- **WHEN** the production author completes its slice
- **THEN** no automated test artifact SHALL have changed by that author
- **AND** the orchestrator SHALL execute observable happy-path proof or retain exact blocker evidence
- **AND** SDET SHALL start only after current proof succeeds.

#### Scenario: production mechanism has an early review

- **GIVEN** an implementation adapter returns a review verdict before SDET
- **WHEN** lifecycle acceptance is evaluated
- **THEN** that verdict SHALL be non-authoritative implementation feedback
- **AND** a post-SDET, post-validation independent review SHALL still run.

#### Scenario: flaky test correction is test-only

- **GIVEN** evidence identifies a defect in a test, fixture, simulator, harness, snapshot, or oracle without
  requiring production behavior changes
- **WHEN** the orchestrator routes the task
- **THEN** production-author dispatch SHALL be `N/A` with the evidence-backed reason
- **AND** a fresh SDET context SHALL be the sole test-content author
- **AND** project-native validation and independent final review SHALL follow.

#### Scenario: tests are co-located with production code

- **GIVEN** test and production blocks share one file or artifact
- **WHEN** a test-only correction is required
- **THEN** the SDET write scope SHALL identify the exact test blocks/content rather than granting production
  ownership by whole-file path
- **AND** the orchestrator SHALL block when safe attribution and post-edit inspection cannot isolate the
  test-only change.

### Requirement: SDLC-004 Dedicated SDET is fresh, test-only, and risk-driven

Every behavior-changing candidate SHALL receive a fresh SDET context that did not author production. It
SHALL use a distinct role and context from every production author. An AI-agent adapter SHALL avoid fixed
provider/model requirements in the portable contract and use active project/session configuration. A
distinct effective model SHOULD be selected when available; same-model use SHALL record residual
correlation risk and SHALL NOT remove the fresh role/context requirement.

SDET SHALL receive the Authoritative Brief, original-source access, current scoped candidate, current tests,
applicable proof, project test guidance, authorized validation descriptions, and exact `Input Semantic
Candidate Identity`, `Input Package Identity`, and `Identity Recipe` for the pre-SDET candidate covered by the
initial Applicable Proof. Applicable proof SHALL be current production happy-path proof for production work or
the defined production-dispatch `N/A` rationale plus baseline/test-boundary proof for test-only work. SDET
SHALL NOT receive the production transcript, credentials, raw secret environment values, arbitrary execution
authority, expected final verdict, or external-operation authority.

SDET SHALL independently assess realistic risks and observable oracles. For each applicable selected
scenario, it SHALL identify the requirement or invariant, external result or state to assert, test artifact,
validation procedure, real boundary, and any justified simulation or mock exception. Coverage percentage,
test count, opaque snapshot growth, retry-until-green, and mock-interaction-only assertions SHALL NOT
establish acceptance.

SDET SHALL return exactly one action:

- `authored-tests` when it adds or strengthens automated test evidence for a demonstrated gap;
- `assessed-existing-tests` when current tests and validation already cover the accepted risk matrix;
- `blocked` when requirements, oracle, boundary, permission, environment, or test capability is insufficient.

SDET SHALL edit only the explicit test-artifact scope, SHALL NOT fix production, and SHALL NOT self-approve.
The orchestrator SHALL exclude test artifacts with unowned pre-existing edits, capture the pre-SDET
candidate, and inspect the post-SDET change set. An out-of-scope mutation SHALL block progression. The
instructions SHALL describe this as scope plus detection, not a technical sandbox.

SDET SHALL first return a `provisional` report containing its action, risk assessment, test changes or
existing-test evidence, required validation procedures, and identity fields. Both provisional and final SDET
reports SHALL record exact separate fields `Input Semantic Candidate Identity`, `Input Package Identity`,
`Semantic Candidate Identity`, `Package Identity`, and `Identity Recipe`. Qualification gates SHALL bind to
Semantic Candidate Identity; Package Identity SHALL record exact bytes handed off or reviewed.

Provisional identity rules SHALL be:

- `authored-tests`: input pair exact; current Semantic Candidate Identity and Package Identity exactly
  `pending orchestrator recapture after test edits`; Identity Recipe records the input recipe and notes that
  main MUST confirm/reuse or replace it through current recapture; SDET SHALL NOT fabricate post-edit hashes;
- `assessed-existing-tests`: no mutation; current pair equals input pair and recipe unchanged; prior current
  Applicable Proof remains valid when identity and recipe are unchanged and SHALL NOT be replayed solely for
  SDET assessment;
- `blocked`: report known input/current status exactly, or unknown.

After provisional `authored-tests`, the orchestrator SHALL inspect exact test-only scope, freeze the complete
post-test candidate, record/reproduce the current Identity Recipe, recapture both current identities, re-run
Applicable Proof at the relevant production/system boundary against the complete post-test current candidate
before complete validation (production need not be redispatched when production content is unchanged, but
observable proof MUST run and bind to the current semantic identity), then execute authorized validation. If
recapture changes the recipe unexpectedly, scope is unsafe, proof cannot run or pass, or current identities
cannot be reproduced, progression SHALL block before final SDET. The same SDET context SHALL receive the exact
current pair, recipe, post-test Applicable Proof outcome, and bounded validation outcomes and return a `final`
report. Final SDET SHALL record exact current pair and recipe; pending SHALL be forbidden in final. Final SDET
SHALL check received proof/validation coherence and SHALL NOT execute them. The orchestrator SHALL accept only
the final report. Same SDET context remains valid only for provisional→final on that inspected test-only
mutation. A candidate correction SHALL require a new fresh SDET assessment.

#### Scenario: existing tests are sufficient

- **GIVEN** current tests exercise the changed boundary and all accepted high-impact risks with independent
  observable oracles
- **WHEN** fresh SDET completes its assessment
- **THEN** it MAY return `assessed-existing-tests` without editing artifacts
- **AND** SHALL identify the tests, validation procedures, boundaries, and residual risks that justify it
- **AND** current Semantic Candidate Identity and Package Identity SHALL equal the input pair with unchanged
  Identity Recipe
- **AND** prior Applicable Proof SHALL remain valid without redundant replay solely for SDET assessment.

#### Scenario: authored-tests identity handshake maintains one current candidate chain

- **GIVEN** provisional SDET returns `authored-tests` with pending current identities
- **WHEN** the orchestrator inspects test-only scope, freezes, recaptures recipe and both identities, re-runs
  post-test Applicable Proof, and completes validation
- **THEN** the same SDET context SHALL receive exact current pair, recipe, post-test Applicable Proof outcome,
  and validation outcomes
- **AND** final SDET SHALL record exact current pair and recipe with pending forbidden
- **AND** final review and delivery SHALL require that post-test Applicable Proof, final SDET, validation, and
  review share the current semantic identity and recipe.

#### Scenario: no suitable automated test capability exists

- **GIVEN** an accepted risk has no adequate automated evidence
- **AND** the project has no safe practical automation boundary for that risk
- **WHEN** SDET assesses the candidate
- **THEN** it SHALL return `blocked`
- **AND** SHALL NOT invent a framework-specific test requirement.

#### Scenario: new test exposes a production defect

- **GIVEN** SDET authors a requirement-linked test with an observable oracle
- **WHEN** authorized validation exposes a production defect
- **THEN** the reproducer SHALL be preserved
- **AND** bounded defect evidence SHALL return to the production author
- **AND** SDET SHALL NOT edit the production fix.

#### Scenario: SDET edits production

- **GIVEN** SDET changes an artifact outside its explicit test-only scope
- **WHEN** the orchestrator inspects the change set
- **THEN** final review SHALL NOT start
- **AND** progression SHALL remain blocked until the candidate is safely restored without discarding other
  work.

### Requirement: SDLC-005 Orchestrator owns validation and current-candidate evidence

The orchestrator SHALL execute project- or owner-authorized lifecycle checks. Before execution it SHALL
record the exact command or procedure and purpose from project instructions, build/validation
configuration, existing automation, or explicit owner input. Production and SDET MAY request proof but
SHALL NOT silently expand execution authority.

The portable contract SHALL NOT assume a programming language, package manager, build system, test
framework, version-control system, CI provider, operating system, shell, hosting provider, issue tracker,
or repository layout. Project adapters SHALL discover and record applicable commands and procedures from
the target project's own sources. An AI-agent adapter SHALL describe command gating as instruction-level
control, not an OS sandbox.

If the candidate changes a validation definition or directly invoked tool/script, the orchestrator SHALL
re-derive authority from trusted project or owner evidence before executing it. This check SHALL NOT claim
complete transitive provenance analysis.

Before Applicable Proof and Fresh SDET dispatch, the orchestrator SHALL close production writers under
Universal writer attempt closure, integrate production outputs, freeze a privacy-safe complete scoped pre-SDET
candidate, record/reproduce the Identity Recipe, and capture both Semantic Candidate Identity and Package
Identity: baseline assumption, every added/modified/deleted artifact in scope, a reviewable representation for
binary or generated artifacts, and ownership of overlapping pre-existing work. The capture mechanism MAY use
version control, filesystem comparison, generated manifests, or another project-native facility. Candidate
evidence SHALL exclude credentials, secrets, and unrelated workspace content. If required scoped content cannot
be provided safely, SDET or review SHALL block. Missing, incomplete, or unreproducible recipe or identities
SHALL block Applicable Proof progression, SDET dispatch, and qualification.

The orchestrator SHALL then run Applicable Proof against that frozen candidate. After Applicable Proof and after
terminal-or-isolated closure of any mutation-capable proof execution, it SHALL recapture both identities with the
same recorded Identity Recipe and SHALL require both identities unchanged before Fresh SDET dispatch. Any scoped
mutation SHALL abandon the current proof/candidate and require owner routing, a new freeze, and replay of
affected gates.

The orchestrator SHALL serialize writers unless they have proven isolated or exact non-overlapping scopes.
It SHALL integrate production outputs before production happy-path proof, freeze and capture the pre-SDET
candidate before Applicable Proof and Fresh SDET, and integrate test outputs before post-test qualification.
After provisional authored-tests, it SHALL freeze and recapture the complete post-test candidate before
post-test Applicable Proof, complete validation, and final SDET. No production or test writer may mutate a frozen
candidate while qualification is running. Any mutation SHALL invalidate and abandon the current qualification
attempt and affected evidence, but SHALL NOT close a still-live mutation-capable execution.

After any validation procedure that may mutate artifacts, the orchestrator SHALL recapture the scoped
candidate. A scoped mutation SHALL invalidate prior candidate-bound proof and SHALL require qualification of
the new candidate.

If restart, compaction, cancellation, or context loss prevents the orchestrator from proving the current
brief, candidate, role identities, validation outcomes, or correction history, the unknown evidence SHALL
be stale and `Change-Ready: no`. Work MAY resume only after reconstruction from authoritative project and
session evidence; uncertainty SHALL NOT reset prior failures.

#### Scenario: agent-proposed command is not authority

- **GIVEN** SDET proposes an execution command absent from project guidance and explicit owner input
- **WHEN** the orchestrator evaluates it
- **THEN** the command SHALL NOT execute automatically
- **AND** the orchestrator SHALL derive a safe procedure from trusted evidence or report a blocker.

#### Scenario: candidate changes a validation definition

- **GIVEN** the candidate changes a script, configuration, workflow, or tool definition used by planned
  validation
- **WHEN** the orchestrator prepares validation
- **THEN** the old authorization SHALL NOT authorize changed behavior
- **AND** the orchestrator SHALL re-derive authorization from current trusted evidence.

#### Scenario: validation mutates the candidate

- **GIVEN** a formatter, generator, test, or other validation procedure changes a scoped artifact
- **WHEN** the orchestrator recaptures the candidate
- **THEN** prior proof and validation bound to the old candidate SHALL be stale
- **AND** the new candidate SHALL repeat applicable qualification.

#### Scenario: newly created artifact is reviewed safely

- **GIVEN** SDET adds a scoped test artifact with no secret content
- **WHEN** final review receives the candidate
- **THEN** the bundle SHALL include its identity and reviewable content
- **AND** SHALL NOT rely on a change view that omits newly created artifacts.

### Requirement: SDLC-010 The main orchestrator owns safe fan-out and specialist continuation

Only the active primary orchestrator SHALL create or resume specialist sessions. Leaf production, SDET,
review, diagnosis, and delivery specialists SHALL NOT dispatch or resume nested agents. Parallel specialist
work SHALL use one orchestrator-owned fan-out through the discovered runtime fan-out adapter and SHALL be
limited to independent isolated or exact non-overlapping scopes proved before dispatch. A single specialist
dispatch SHALL remain serial. Real concurrency SHALL require one adapter-supported fan-out of independent
dispatches and SHALL NOT invent a portable tool or API name. The orchestrator SHALL reconcile and integrate
every fan-out result before proof or qualification.

The orchestrator SHALL accept specialist dispatch or resume evidence only when the discovered runtime adapter
proves active primary parent identity, child session/task identity, and expected child role/context.
Top-level/default-primary fallback SHALL NOT count as specialist evidence. Unavailable or unverifiable child
dispatch or continuation SHALL block the affected gate. Portable runtime text SHALL NOT hard-code a concrete
runtime mechanism, provider, model, OS, or product.

Universal writer attempt closure applies to every mutation-capable execution, serial or fan-out, including
every writer dispatch/attempt and every mutation-capable validation, generator, or formatter command. Every
such execution SHALL remain open after timeout, cancel, missing report, partial mutation, or unknown liveness
until a terminal report is received, adapter-proven terminal cessation is established (cancellation counts only
after the writer or execution can no longer execute or mutate), or its workspace/write authority is isolated or
revoked so it cannot mutate the candidate. Recorded timeout, cancel, or missing report alone SHALL NOT
constitute closure. Cancellation request or acknowledgement alone SHALL NOT constitute closure. Unknown
liveness or unisolated ownership SHALL block integration, freeze, proof, and qualification. Late output or late
mutation after the attempt boundary SHALL invalidate the qualification attempt and SHALL NOT close a still-live
mutator. Prefer isolated workspaces for mutation-capable validation.

Before freeze, proof, or qualification, the orchestrator SHALL account for every fan-out child and every
serial writer attempt. If any child or serial writer attempt blocks, times out, is cancelled, returns a
missing report, or leaves a partial mutation, the orchestrator SHALL NOT freeze, prove, or qualify. The
orchestrator SHALL apply Universal writer attempt closure to every open attempt, record each slice/attempt
state and identity, recapture attributable mutations, quarantine unsafe ownership, integrate only after every
result is accounted for, and route retry, resume, or fresh dispatch by continuity rules without erasing prior
failure—only after the open attempt is closed or isolated. Mutation SHALL invalidate qualification evidence but
SHALL NOT close a still-live mutation-capable execution. The portable contract SHALL NOT require a coordinator
or durable orchestration state store.

For every dispatched specialist, the orchestrator SHALL retain the specialist role, ownership scope, and
available runtime session/task identity. When a production defect belongs to the same production author and
the role, objective, and bounded ownership scope remain continuous, the orchestrator SHOULD resume that same
production-author context using the discovered runtime continuation adapter. The continuation brief SHALL
include the new reproducer/outcome, exact current Semantic Candidate Identity, Package Identity, and Identity
Recipe, explicit objective text continuous with the original production objective, explicit brief delta,
unchanged forbidden actions, and return contract.

The orchestrator SHALL dispatch a new specialist with a complete cold-context brief instead when the prior
session is unavailable or unidentified, continuity cannot be reconstructed, role, objective, or ownership
changes, scope materially expands, or a lifecycle independence rule requires freshness. Corrected-candidate
SDET SHALL be fresh, and final review SHALL remain fresh and read-only. Production-author continuation SHALL
NOT preserve affected Applicable Proof, SDET, validation, or final-review evidence.

#### Scenario: independent production slices run in real parallel fan-out

- **GIVEN** two production slices have exact non-overlapping write scopes and no data dependency
- **WHEN** the active primary orchestrator dispatches both in one fan-out
- **THEN** the specialists MAY run concurrently
- **AND** neither specialist SHALL dispatch another agent
- **AND** the orchestrator SHALL integrate both reports before proof or qualification.

#### Scenario: overlapping, coupled, or partial fan-out failure stays serial or blocked

- **GIVEN** write scopes overlap, slices are coupled, or any fan-out child blocks, times out, is cancelled,
  returns a missing report, or leaves a partial mutation
- **WHEN** the orchestrator considers freeze, proof, or qualification
- **THEN** it SHALL keep overlapping or coupled work serial or blocked
- **AND** SHALL NOT freeze, prove, or qualify until every slice is closed by terminal report, adapter-proven
  terminal cessation (cancellation counts only after the writer can no longer execute or mutate), or
  isolated/revoked write authority
- **AND** recorded timeout, cancel, or missing report alone SHALL NOT close the slice
- **AND** cancellation request or acknowledgement alone SHALL NOT close the slice
- **AND** unknown liveness or unisolated ownership SHALL block
- **AND** late output or late mutation after the attempt boundary SHALL invalidate the qualification attempt
  and SHALL NOT close a still-live mutator
- **AND** SHALL recapture attributable mutations and quarantine unsafe ownership without inventing durable
   orchestration state.

#### Scenario: serial writer timeout, cancel, or missing report stays open until terminal-or-isolated closure

- **GIVEN** a single serial writer dispatch times out, is cancelled, returns a missing report, or leaves a
  partial mutation
- **WHEN** the orchestrator considers integration, freeze, proof, or qualification
- **THEN** the writer attempt SHALL remain open until a terminal report is received, adapter-proven terminal
  cessation is established (cancellation counts only after the writer can no longer execute or mutate), or
  workspace/write authority is isolated or revoked
- **AND** recorded timeout, cancel, or missing report alone SHALL NOT close the attempt
- **AND** cancellation request or acknowledgement alone SHALL NOT close the attempt
- **AND** unknown liveness or unisolated ownership SHALL block integration, freeze, proof, and qualification
- **AND** late output or late mutation after the attempt boundary SHALL invalidate the qualification attempt
  and SHALL NOT close a still-live mutator
- **AND** the orchestrator SHALL NOT invent a durable coordinator state store.

#### Scenario: original production author corrects its own bounded defect

- **GIVEN** a recorded production-author session owns the affected artifact and later evidence exposes a
  defect inside the same bounded slice with continuous role, objective, and ownership
- **WHEN** the orchestrator routes the correction
- **THEN** it SHOULD resume the recorded production-author context with a bounded continuation brief that
  includes explicit objective text continuous with the original production objective
- **AND** it SHALL preserve the reproducer while replaying all affected downstream gates.

#### Scenario: continuation is unsafe or freshness is required

- **GIVEN** session identity or continuity is unknown, role, objective, ownership, or scope changes, or
  corrected-candidate SDET or final review is required
- **WHEN** the orchestrator selects a specialist
- **THEN** it SHALL NOT reuse the stale or non-independent context
- **AND** SHALL dispatch a fresh conforming role with a complete brief or report a blocker.

### Requirement: SDLC-006 Actionable failures return to the owner and replay downstream gates

Product/build defects exposed by existing or new validation SHALL return to the production author with the
reproducer preserved. Defects in tests, fixtures, simulators, harnesses, snapshots, or oracles and
missing-risk-evidence failures SHALL return to a fresh SDET. A failure with unknown cause or ownership SHALL
remain with orchestrator-led diagnosis or block without assigning a correction author. Validation authority
or environment blockers SHALL return to the orchestrator or owner of the missing evidence. Final review
findings SHALL route by changed-artifact ownership.

Any production or test edit SHALL invalidate affected applicable proof, SDET assessment, validation,
specialist review, and final review. The corrected candidate SHALL repeat affected applicable proof, fresh
SDET assessment, complete applicable validation, and independent final review. A handoff-package-only text
change outside the scoped candidate MAY skip requalification when requirements and candidate artifacts are
unchanged.

The orchestrator SHALL maintain two deterministic identities and one recorded Identity Recipe for the same
scoped candidate. Semantic Candidate Identity SHALL cover all candidate content, including active OpenSpec
artifacts. Status-marker normalization SHALL be adapter-owned, explicit, and absent by default: the Identity
Recipe SHALL record any selected status artifact and the enumerated pre-existing status items/marker
transitions that are normalized. The portable contract SHALL NOT prescribe a universal status filename or
marker syntax. Only proven forward transitions on those adapter-enumerated pre-existing status items MAY be
qualification-neutral; reverse, unknown, wording, order, add/delete, or evidence changes remain semantic. This
kit's OpenSpec recipe MAY use `tasks.md` `[ ]` and `[x]` / `[X]` as a project-local instance only, not a
portable requirement. Package Identity SHALL cover exact bytes of the complete scoped candidate package. Before
freeze or qualification, the orchestrator SHALL record a privacy-safe `Identity Recipe` from the discovered
identity-generation capability containing: mechanism/algorithm identifier and version; baseline/reference used
to determine the candidate and pre-existing status items; stable scoped path manifest and ordering;
add/modify/delete representation including deletion framing; path/content boundary framing; exact byte and
line-ending treatment; semantic-normalization rule/version including any adapter-owned status-marker
normalization or explicit absence of normalization; and reproduction procedure with required local inputs. The
portable contract SHALL NOT prescribe a universal hash, version-control product, OS, language, command,
filename, or product. Qualification gates SHALL bind to Semantic Candidate Identity; Package Identity SHALL
record exact bytes handed off or reviewed. Both identities and the Identity Recipe SHALL bind to the same
scoped candidate. If the recorded recipe and required local inputs cannot reproduce both identities after
restart, compaction, or handoff, continuity SHALL be unknown and qualification SHALL block. SDET reports SHALL
use exact separate fields `Input Semantic Candidate Identity`, `Input Package Identity`,
`Semantic Candidate Identity`, `Package Identity`, and `Identity Recipe`. Compact orchestration output,
final-candidate reports, and delivery/readiness outputs SHALL use exact separate fields
`Semantic Candidate Identity`, `Package Identity`, and `Identity Recipe` rather than one ambiguous
candidate-identity field. Only an exact adapter-enumerated forward status-marker transition on a pre-existing
status item (this kit's local OpenSpec recipe: `[ ]` → `[x]` or `[X]` on a pre-existing `tasks.md` task item)
with current literal evidence that the item is complete MAY be qualification-neutral metadata; the orchestrator
SHALL use the same recorded Identity Recipe and baseline/pre-existing status-item set (baseline SHALL NOT
silently change), SHALL recapture Package Identity, and SHALL NOT replay candidate gates for that marker-only
edit, and Semantic Candidate Identity SHALL remain unchanged. Identity Recipe change SHALL always be treated as
semantic process-evidence change and SHALL stale qualification evidence and require recapture and replay of
affected gates; there SHALL be no recipe-change exception. There SHALL be no generic handoff-note exception.
Handoff-package-only text outside the scoped candidate MAY skip candidate qualification only when the recorded
Identity Recipe itself is unchanged, both identities remain independently reproduced with that same prior
recipe, and requirements and candidate artifacts are unchanged. Any change to wording, evidence, blocker,
verdict, risk, command, requirement, status text/order/add/delete, reverse or unknown marker direction, or any
other candidate artifact SHALL be semantic mutation and SHALL invalidate affected gates.

An authoritative failure SHALL NOT be erased by retrying the unchanged candidate until it passes. An
unexplained fail/pass inconsistency SHALL block with retained diagnostics. The run SHALL stop with
`Change-Ready: no` when the same failure repeats without new root-cause evidence, a required capability has
no conforming adapter, workspace ownership is unsafe, or an owner decision remains unresolved. The portable
contract SHALL NOT impose an arbitrary universal cycle count.

#### Scenario: product correction repeats downstream gates

- **GIVEN** a new SDET test exposes a production defect
- **WHEN** production corrects it
- **THEN** the orchestrator SHALL repeat affected happy-path proof, fresh SDET assessment, complete
  applicable validation, and final review
- **AND** old candidate evidence SHALL NOT qualify the correction.

#### Scenario: unchanged fail then pass remains blocked

- **GIVEN** authoritative validation fails and then passes on the same candidate without an identified
  infrastructure or environment correction
- **WHEN** the orchestrator evaluates readiness
- **THEN** the earlier failure SHALL remain blocking
- **AND** retry-until-green SHALL NOT qualify the candidate.

#### Scenario: handoff-package-only correction is proportional

- **GIVEN** requirements, candidate, SDET, validation, and review evidence are unchanged
- **WHEN** only a local handoff-package section is corrected
- **THEN** production and test gates need not rerun
- **AND** the corrected package SHALL still be checked before readiness.

#### Scenario: adapter-enumerated forward status-marker metadata is qualification-neutral

- **GIVEN** an exact diff shows only adapter-enumerated forward status-marker transitions on pre-existing
  status items (this kit's local OpenSpec recipe: pre-existing `tasks.md` checkbox markers from `[ ]` to
  `[x]` or `[X]`) after a gate
- **AND** current literal evidence supports each marked-complete item
- **AND** the same recorded Identity Recipe and baseline/pre-existing status-item set are used
- **AND** no wording, evidence, blocker, verdict, risk, command, requirement, status text/order/add/delete,
  reverse or unknown marker direction, or other candidate artifact changed
- **WHEN** the orchestrator recaptures Package Identity
- **THEN** the edit MAY be treated as qualification-neutral metadata
- **AND** Semantic Candidate Identity SHALL remain unchanged
- **AND** candidate gates SHALL NOT be replayed solely because of that marker-only edit
- **AND** any semantic edit SHALL remain candidate mutation and invalidate affected gates.

#### Scenario: Identity Recipe enables full-package reproducibility after restart

- **GIVEN** a frozen candidate has recorded Semantic Candidate Identity, Package Identity, and Identity Recipe
- **WHEN** the session restarts, compacts, or hands off
- **THEN** the orchestrator SHALL reconstruct continuity using the recorded Identity Recipe and required local
  inputs
- **AND** SHALL reproduce both identities for the same scoped candidate
- **AND** when the recipe or inputs cannot reproduce both identities, continuity SHALL be unknown and
  qualification SHALL block.

#### Scenario: missing identity-generation capability blocks qualification

- **GIVEN** Adapter Discovery finds no deterministic candidate identity-generation capability that can record
  a reproducible Identity Recipe
- **WHEN** the orchestrator prepares freeze or qualification
- **THEN** qualification SHALL block
- **AND** the orchestrator SHALL NOT invent a portable hash, tool, or product default.

#### Scenario: Material delivery closing-task self-gate closes finitely

- **GIVEN** every applicable prerequisite task is checked with current literal evidence
- **AND** only the delivery/readiness closing task marker remains unchecked because this review is that task
- **AND** no other blocker or required action remains
- **WHEN** the delivery/readiness reviewer evaluates incomplete-task blockers
- **THEN** it SHALL NOT raise a P0 solely for its own current closing task marker
- **AND** after accepted delivery the orchestrator MAY mark that closing task as a marker-only metadata
  transition, recapture Package Identity, and SHALL NOT replay semantic candidate gates
- **AND** any other unchecked applicable task SHALL block readiness.

### Requirement: SDLC-007 Final review is independent and post-SDET

Final review SHALL begin only after current final SDET evidence (or evidence-backed SDET `N/A` only for proven
non-behavioral work) and every applicable authorized validation procedure pass. Evidence-backed SDET `N/A`
SHALL include rationale, current identities and Identity Recipe, proof boundary, and validation.
Behavior-changing or test-content work SHALL NOT use SDET `N/A`. Before reviewer dispatch, the orchestrator
SHALL verify every candidate and evidence input is directly readable under the reviewer's effective
permissions. External path references alone SHALL NOT satisfy readability. The reviewer SHALL receive a
privacy-safe inline or attached evidence bundle containing the Authoritative Brief with original-source access,
complete scoped candidate including test artifacts as manifest and reviewable diff/content, applicable proof,
final SDET report or evidence-backed SDET `N/A`, current validation outcomes, runtime event excerpts when used
as proof, simulation/mock exceptions, correction history, and residual risks. Missing readability SHALL block
before dispatch; the orchestrator SHALL NOT relax reviewer permissions to reach external paths. Applicable
proof SHALL mean current production happy-path proof for production work. For evidence-backed test-only work,
it SHALL mean the production-dispatch `N/A` rationale, current baseline/test-boundary proof, and passing
validation of the changed test boundary. After `authored-tests`, applicable proof SHALL be the post-test proof
bound to the current semantic identity and recipe; missing post-test proof replay after authored-tests SHALL
block final review.

The project adapter SHALL provide a configured independent final reviewer that can inspect the complete
candidate. The reviewer SHALL use a fresh read-only context that authored neither production nor tests and
apply a project-mapped verdict contract equivalent to `approved | approved_with_notes | changes_requested |
blocked`. An AI-agent adapter SHALL avoid fixed provider/model requirements in the portable contract and use
active project/session configuration. Self-review or a pre-SDET checkpoint SHALL NOT satisfy the gate.
Absence of a conforming reviewer SHALL block final review.

The final reviewer SHALL receive and verify the recorded Identity Recipe alongside both identities and the
complete scoped manifest. Missing or unreproducible Identity Recipe SHALL block. The final reviewer SHALL
verify that post-test Applicable Proof (when authored-tests ran), final SDET, validation, and this review share
the current semantic identity and recipe; missing post-test proof continuity after authored-tests SHALL block.
The final reviewer SHALL return a structured report containing the exact verdict enum, exact separate fields
`Semantic Candidate Identity`, `Package Identity`, and `Identity Recipe` for the candidate assessed, ordered
evidence-backed findings with `Evidence Type`, `Likely Root Cause`, `Artifact Owner`, `Recommendation`,
`Confidence`, and `Needs external reviewer`, plus blockers, residual risks, and actionable continuation items.
Qualification gates SHALL bind to Semantic Candidate Identity; Package Identity SHALL record exact bytes handed
off or reviewed. The verdict field is constrained; the report SHALL NOT be reduced to a bare verdict.

#### Scenario: preferred review adapter is unavailable

- **GIVEN** the preferred project review adapter is unavailable or cannot inspect the complete candidate
- **WHEN** final review is required
- **THEN** the orchestrator SHALL dispatch another configured conforming reviewer when available
- **AND** SHALL record the adapter, native verdict mapping, and evidence supplied
- **AND** SHALL report blocked if no conforming reviewer exists.

#### Scenario: early review becomes stale

- **GIVEN** an implementation checkpoint review occurs before SDET
- **AND** SDET then assesses or changes the candidate
- **WHEN** final acceptance is evaluated
- **THEN** the checkpoint SHALL be non-authoritative
- **AND** final review SHALL inspect the current post-validation production-plus-test candidate.

#### Scenario: actionable note requires correction

- **GIVEN** final review returns an acceptance-compatible verdict with notes
- **WHEN** any note requests a candidate change
- **THEN** the verdict SHALL NOT pass the gate
- **AND** the correction SHALL replay applicable SDET, validation, and review.

### Requirement: SDLC-008 Change-ready is local, binary, and reviewable

The orchestrator SHALL report `Change-Ready: yes` only when accepted requirements, applicable canonical
SDLC evidence, current applicable proof, SDET evidence for behavior changes or evidence-backed `N/A` for proven
non-behavioral work, passing complete project/owner validation, accepted final review, for Material work an
explicitly accepted conforming delivery result, no binding reviewer blocker or required action,
privacy-safe scoped candidate evidence, and a complete local change-handoff package all refer to the same
current candidate. Every `Change-Ready: no`, delivery `Verdict: material deviations`,
`Verdict: not enough evidence`, `Blocking for Acceptance: yes`, `Verdict: blocked`, P0 blocker, or non-empty
required next action SHALL be binding and keep readiness blocked. Negative delivery verdict or
`Change-Ready: no` SHALL NOT coexist with `Blocking for Acceptance: no` and `Required Next Actions: none`.

Material work SHALL always have current task/evidence status supplied to the discovered conforming
delivery/readiness gate; missing conforming capability SHALL block readiness and SHALL NOT be treated as a
skip due to unavailable inputs. Small work SHALL use proportional evidence and invoke that gate only when
project policy, risk escalation, or the owner requires it. Diagnostic scale SHALL NOT override the Portable
Small/Material profile. Local Change-Ready and delivery/readiness outputs SHALL record current
`Semantic Candidate Identity`, `Package Identity`, and `Identity Recipe`. Delivery/readiness SHALL verify the
same Identity Recipe and baseline across proof, SDET, validation, final review, delivery, and the current
package, including post-test Applicable Proof continuity after authored-tests; missing Identity Recipe,
unexplained recipe change, or missing post-test proof continuity after authored-tests SHALL block readiness.
When Package Identity changes after final review, the orchestrator or delivery gate SHALL verify an exact
adapter-enumerated forward marker-only metadata transition with unchanged Semantic Candidate Identity and the
same recorded Identity Recipe and baseline; otherwise stale evidence, semantic mismatch, or unexplained package
or recipe change SHALL block readiness.

The local package SHALL include context, requirements, scope, non-goals, main changes, applicable proof
(production happy-path proof or the defined test-only alternative), SDET/testing evidence, validation, review results,
risks/rollback, review focus, changed-artifact scope,
baseline/candidate assumptions, residual blockers, and `External Operations: not performed`. Publication,
upload, remote review creation/update, integration, deployment, release, and archival actions SHALL NOT be
required or performed without separate explicit authority. A project adapter MAY additionally render the
same state as `PR-Ready`, `MR-Ready`, `Ready To Land`, or another native label.

When the local package documents rollback for a multi-surface instruction or kit-support candidate, full
change rollback SHALL mean reviewed restoration of the **entire authoritative scoped candidate manifest** to
the captured baseline identified by the recorded Identity Recipe and baseline reference: every modified path
restored, every added path removed, and every deleted path restored when a baseline copy exists. Scope
identity SHALL come only from that recorded manifest/recipe/baseline. Full change rollback SHALL NOT use a
broad workspace reset, silent overwrite of unrelated or pre-existing teammate work, unjournaled sequential
in-place rollback in a shared or dirty workspace, or restoration of only a runtime-instruction subset when
the candidate also includes tightly coupled support surfaces (for example profiles/catalog, contracts,
validators, tests, or maintenance/OpenSpec paths). The orchestrator SHALL build the complete baseline-restored
candidate in an isolated workspace or project-native snapshot/transaction, validate that restored package
there, and integrate or swap only through a discovered project-native failure-atomic or explicitly
journaled/recoverable mechanism that retains preimages. Owner authorization MAY be additionally required but
SHALL NOT substitute for failure atomicity or journaling. Preflight of every manifest path, ownership, and
acceptable preimage (qualified candidate or baseline) SHALL run before integration. After interruption or
restart, re-inventory SHALL run; only complete candidate or complete baseline states MAY continue; a third or
unattributed state SHALL block. Ownership overlap, missing safe isolation or failure-atomic/journaled
integration capability, partial or interrupted integration, or mixed state on any manifest path SHALL block,
report rollback incomplete, hand off the validated isolated restored package, SHALL NOT promise original
workspace preservation after unprotected partial target mutation, and SHALL NOT run baseline validation against
a mixed state or claim rollback complete. After complete restoration only, baseline-compatible repository validation SHALL run; OpenCode
restart/reload SHALL be required only when active global runtime artifacts or the active config pointer
changed. No application data or external-state rollback SHALL be required when the change creates none;
remote operations remain separately authorized. Rollback SHALL be planned and evidenced in the handoff
package, executed only when separately authorized, and SHALL NOT be required to claim Change-Ready.

Runtime activation rollback SHALL be documented as a separate operational action: restore the prior active
config pointer (including `OPENCODE_CONFIG_DIR` when that mechanism is in use) and restart/reload without
mutating the repository candidate. Activation rollback MAY disable the new runtime for subsequent sessions
and SHALL NOT count as rollback of the repository change or of non-runtime support artifacts. Session
delivery SHALL verify a complete rollback plan and evidence distinguishing full change rollback from runtime
activation rollback and SHALL NOT treat activation rollback as full change rollback.

#### Scenario: qualified local candidate is change-ready without external state

- **GIVEN** the current candidate satisfies every applicable quality and review requirement
- **AND** the complete local handoff package exists
- **WHEN** no external action was requested
- **THEN** the orchestrator MAY report `Change-Ready: yes`
- **AND** SHALL report `External Operations: not performed`.

#### Scenario: missing evidence blocks readiness

- **GIVEN** current SDET, validation, final-review, workspace-ownership, or delivery evidence is missing or
  stale
- **WHEN** the orchestrator prepares handoff
- **THEN** it SHALL report `Change-Ready: no`
- **AND** SHALL identify the smallest responsible-role continuation or owner blocker.

#### Scenario: full change rollback restores the complete scoped candidate manifest

- **GIVEN** a reviewed decision to roll back a multi-surface candidate that includes runtime instruction
  artifacts and tightly coupled non-runtime support surfaces
- **AND** a recorded scoped path manifest, Identity Recipe, and baseline reference identify the exact
  candidate paths and add/modify/delete framing
- **WHEN** full change rollback is performed
- **THEN** every modified manifest path SHALL be restored to baseline content
- **AND** every added manifest path SHALL be removed
- **AND** every deleted manifest path SHALL be restored when a baseline copy exists
- **AND** the complete baseline-restored candidate SHALL be built and validated in an isolated workspace or
  project-native snapshot/transaction before project-native failure-atomic or explicitly journaled/recoverable
  integrate/swap that retains preimages
- **AND** owner authorization MAY be additionally required but SHALL never substitute for failure atomicity
  or journaling
- **AND** unjournaled sequential in-place rollback in a shared or dirty workspace SHALL NOT be used
- **AND** unrelated or pre-existing non-manifest work SHALL NOT be overwritten
- **AND** ownership overlap, missing safe isolated failure-atomic or journaled integration capability,
  partial/interrupted integration, or a third/unattributed path state SHALL block rather than partially
  overwrite
- **AND** baseline-compatible repository validation SHALL run only after complete restoration
- **AND** OpenCode restart/reload SHALL occur only if active global runtime artifacts or the active config
  pointer changed
- **AND** restoring only the runtime-instruction subset SHALL NOT satisfy full change rollback when support
  surfaces remain in the candidate
- **AND** rollback execution SHALL remain separately authorized and SHALL NOT be required to claim
  Change-Ready.

#### Scenario: partial, interrupted, or third-state rollback is blocked

- **GIVEN** full change rollback has no safe isolated failure-atomic or journaled integration capability,
  ownership overlaps, integration is interrupted, or re-inventory finds a third/unattributed path state
- **WHEN** the orchestrator evaluates whether rollback can complete
- **THEN** it SHALL report rollback incomplete/blocked
- **AND** it SHALL stop before unprotected target mutation when possible
- **AND** SHALL hand off the validated isolated restored package
- **AND** SHALL NOT promise original workspace preservation after unprotected partial target mutation
- **AND** SHALL NOT run baseline validation against a mixed state
- **AND** SHALL NOT claim rollback complete.

#### Scenario: runtime activation rollback does not restore the repository candidate

- **GIVEN** the new runtime is active through a config pointer such as `OPENCODE_CONFIG_DIR` or the active
  global config directory
- **AND** the repository still contains the multi-surface candidate
- **WHEN** runtime activation rollback restores the prior active config pointer and restarts or reloads
  OpenCode without mutating repository paths
- **THEN** subsequent sessions MAY load the prior runtime instruction set
- **AND** the repository candidate and non-runtime support artifacts SHALL remain unchanged
- **AND** the action SHALL NOT be treated as full change rollback of the repository candidate.

### Requirement: SDLC-009 Global instruction topology prevents process drift

The reusable OpenCode runtime SHALL execute the portable SDLC using only Markdown instruction artifacts
under the active global config directory. It SHALL NOT require source code, scripts, validators,
automated-test code, plugins, MCP tools, workflow engines, installers, profiles, templates, or
project-specific configuration at runtime.

The kit repository MAY use non-runtime catalog/profile metadata, static contracts, validators, fixtures,
focused regression tests, and maintenance documentation/templates to validate and distribute those
instructions. Such support SHALL NOT execute, persist, coordinate, or decide any lifecycle transition and
SHALL NOT become a target-project dependency.

Static validation SHALL use deterministic, explicitly enumerated input files, required/forbidden markers,
matching rules, diagnostics, and fixtures. It SHALL NOT use hidden heuristics or claim that static token
presence proves fresh context, role ordering, candidate continuity, or other runtime behavior.

One complete global orchestration skill SHALL operationalize the SDLC without copying the conceptual UDL
stage list. The always-loaded global `AGENTS.md` SHALL contain
a short mandatory trigger that requires the main/general agent to load that skill before the first
behavior-changing mutation and remain the sole orchestrator. Role agents SHALL contain only their narrow
local contract and report-only handoff; they SHALL NOT duplicate the complete lifecycle or claim another
role's authority.

Manual selective install of lifecycle skills, write-capable lifecycle agents, or reference-based reusable
reviewers SHALL be complete only when the active runtime also loads the shared contracts from the active
global config directory's `AGENTS.md`. The active global config directory SHALL resolve to `OPENCODE_CONFIG_DIR`
when set and to `~/.config/opencode` only when unset; when the override is set, the default directory SHALL NOT
be treated as active. Kit install documentation SHALL direct global skill/agent copy destinations to that
active directory, SHALL NOT promise an equivalent project-level substitute for those shared contracts, and
SHALL prefer full-kit install. Project-local `.opencode` skill/agent paths MAY remain allowed and SHALL NOT
replace the active global shared contracts.

Project-facing maintenance surfaces (including UDL and project templates) SHALL retain Portable Material
always-run delivery/readiness semantics, conditional Small delivery invocation, and
missing-conforming-capability-blocks behavior; static validation MAY enforce those tokens but SHALL NOT
decide runtime readiness.

UDL and related maintenance guidance SHALL state that a production correction invalidates prior SDET
qualification and requires a new fresh corrected-candidate testing context, and that the same testing context
MAY be reused only for provisional→final reporting on an unchanged candidate. They SHALL NOT permit users or
repositories to weaken, reorder, or omit mandatory role separation, proof-before-SDET, corrected-candidate
freshness, validation, independent final review, or applicable Material delivery while claiming Change-Ready;
adapters and owner/project constraints MAY change commands, artifacts, add stricter gates, or stop work, and a
conflicting requested workflow SHALL be treated as a constraint or blocker rather than proof.

For this contract, `main/general agent` SHALL mean the active primary user-session agent. It SHALL NOT mean
a nested general-purpose subagent, and orchestration ownership SHALL NOT be delegated away from the primary
session.

#### Scenario: behavior change loads the process before mutation

- **GIVEN** a task changes runtime, configuration, loaded instructions, routing, generated output, or other
  observable behavior
- **WHEN** the main/general agent prepares work
- **THEN** it SHALL load the global orchestration skill before mutation
- **AND** SHALL create the profile and Authoritative Brief before dispatching the first production or SDET
  author applicable to the classified route.

#### Scenario: missing canonical skill blocks behavior change

- **GIVEN** the global orchestration skill is unavailable or cannot be loaded
- **WHEN** a behavior-changing task is requested
- **THEN** the main/general agent SHALL block before mutation
- **AND** SHALL NOT reconstruct a partial process from memory or another project's toolchain.

#### Scenario: role prompt remains cohesive

- **GIVEN** a production, SDET, final-review, readiness, troubleshooting, or delivery agent is inspected
- **WHEN** its responsibilities are compared with the canonical skill
- **THEN** the prompt SHALL define only that role's inputs, permissions, decisions, and report
- **AND** SHALL NOT restate the complete orchestration lifecycle.

### Requirement: SDLC-011 Acceptance scope lock and anti-polishing

The portable SDLC SHALL keep mandatory lifecycle gates and serious-defect protection while preventing
unbounded post-mutation expansion of acceptance criteria, reviewer actions, evidence, tests, and evals.

Before the first behavior-changing candidate mutation, the orchestrator SHALL record accepted acceptance
criteria, project-specific scope lock, planned gate waves, correction budget, and stop line in the existing
Authoritative Brief fields. The portable contract SHALL NOT require a second planning artifact for those
values. Existing projects MAY predeclare stricter gates before mutation and SHALL NOT silently expand them
after mutation.

After the first candidate mutation, a new blocking candidate correction or new acceptance criterion SHALL
require either explicit owner approval or a reproducible P0/P1 defect that affects behavior, CI, security,
data integrity, or compatibility. A severity label alone SHALL NOT be sufficient. Missing or failed mandatory
lifecycle gate, unsafe writer ownership/liveness, or unresolved owner decision SHALL still block Change-Ready
and SHALL NOT justify speculative product or evidence scope.

`Required Next Actions` and equivalent blocking action lists SHALL remain binding and SHALL contain only
mandatory-gate failures or qualifying P0/P1 serious defects as defined above. P2/note findings, coverage-only
gaps, optional evidence, provenance/wording polish, and speculative hardening SHALL route to Residual Risks
or a separately approved follow-up and SHALL NOT populate Required Next Actions, SHALL NOT alone produce
final-review `changes_requested`, and SHALL NOT trigger autonomous gate replay for polish.

The orchestrator SHALL plan one SDET qualification wave, one Final Candidate Review wave, and for Material
one delivery/readiness wave. It SHALL replay only gates invalidated by a qualifying P0/P1 correction or a
genuinely failed mandatory gate and SHALL NOT replay solely to strengthen evidence wording.

Behavioral evals and negative cases SHALL be selected representatively from the accepted high-impact risk
matrix. Exhaustive Cartesian expansion SHALL require a concrete high-impact risk, project/regulatory mandate,
or explicit owner approval. Evidence tooling SHALL NOT become a second product; it MAY be added only when a
mandatory gate cannot be reproduced without it or a small deterministic helper demonstrably replaces more
repeated work than it creates.

There SHALL be no universal retry count. A predeclared project correction budget SHALL be a planning ceiling.
When the budget is exhausted, nonblocking items SHALL become residual/follow-up; a remaining serious or
mandatory blocker SHALL yield `Change-Ready: no` and owner escalation rather than autonomous infinite looping
or false acceptance.

#### Scenario: pre-mutation scope lock is recorded in the brief

- **GIVEN** a behavior-changing task has not yet mutated the candidate
- **WHEN** the orchestrator prepares the Authoritative Brief
- **THEN** it SHALL record accepted acceptance criteria, project-specific scope lock, planned gate waves,
  correction budget, and stop line in existing brief fields
- **AND** SHALL NOT invent a second planning artifact solely for those values.

#### Scenario: P2 polish does not block readiness or force replay

- **GIVEN** mandatory gates pass and no qualifying P0/P1 serious defect remains
- **AND** a final or delivery reviewer records only P2/note, coverage-only, optional-evidence, or wording
  polish findings
- **WHEN** readiness is evaluated
- **THEN** those findings SHALL appear under Residual Risks or a separately approved follow-up
- **AND** SHALL NOT populate Required Next Actions
- **AND** SHALL NOT alone produce final-review `changes_requested`
- **AND** SHALL NOT trigger autonomous gate replay for polish.

#### Scenario: representative evals are sufficient by default

- **GIVEN** an accepted high-impact risk matrix exists for the change
- **WHEN** the orchestrator or SDET selects behavioral evals or negative cases
- **THEN** selection SHALL be representative of high-impact risks
- **AND** SHALL NOT require an exhaustive Cartesian product unless a concrete high-impact risk,
  project/regulatory mandate, or explicit owner approval requires more.

#### Scenario: correction budget exhaustion escalates rather than looping

- **GIVEN** the predeclared correction budget is exhausted
- **AND** a serious or mandatory blocker remains
- **WHEN** the orchestrator evaluates readiness
- **THEN** it SHALL report `Change-Ready: no`
- **AND** SHALL escalate to the owner
- **AND** SHALL NOT autonomously open further polish loops or falsely accept the candidate.

#### Scenario: qualifying serious defect still blocks and replays

- **GIVEN** a reproducible P0/P1 defect affecting behavior, CI, security, data integrity, or compatibility is
  found after mutation
- **WHEN** the orchestrator routes the finding
- **THEN** the defect SHALL block Change-Ready until corrected or owner-accepted
- **AND** affected mandatory gates SHALL replay on the corrected candidate
- **AND** a severity label without such impact SHALL NOT alone create a new acceptance criterion.
