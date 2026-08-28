## Purpose

Define an evidence-bounded project-level delivery loop that detects a materially poor
roadmap trajectory and changes the future mechanism without weakening accepted product
quality or turning archive into retrospective completion scope.

## ADDED Requirements

### Requirement: Delivery Horizons SHALL declare project-level intent explicitly

A participating project SHALL declare each tracked phase or roadmap horizon in one
versioned project-contained record with a safe horizon id, an RFC 3339 UTC window start
and useful-by instant, and non-empty repository-relative references to the accepted
outcome, exit predicates, non-deferrable invariants, and non-goals. The useful-by instant
SHALL be later than the window start. Referenced files SHALL be regular contained files;
missing, escaping, unreadable, duplicated, contradictory, or unsupported records SHALL
remain invalid or `unknown` rather than fall back to task text or repository heuristics.

A newly proposed OpenSpec change that participates in the horizon SHALL declare the
exact horizon id. An unrelated change SHALL declare `none` with a reason. Existing
active or archived changes without this field SHALL remain legacy-unlinked and MUST NOT
be assigned to a horizon from filenames, dates, source paths, capabilities, or semantic
similarity.

#### Scenario: Project declares a valid horizon

- **WHEN** the project record names one safe horizon id, ordered contained requirement references, and a useful-by instant later than its window start
- **THEN** trajectory context resolves the exact horizon and its project-declared delivery window
- **AND** no current status, forecast, trigger, or strategy is inferred from the declaration.

#### Scenario: New change links to the horizon

- **WHEN** a proposal declares the exact existing horizon id
- **THEN** its future successful archive is eligible for that horizon's trajectory signal
- **AND** the linkage grants no completion, implementation, archive, product-scope, or protected-action authority.

#### Scenario: Legacy archive has no linkage

- **WHEN** an archived change predates the linkage contract or declares no horizon
- **THEN** it remains `legacy-unlinked` and supplies no horizon progress or forecast fact
- **AND** the workflow does not classify it from its name, tasks, changed files, or nearby linked archives.

### Requirement: Trajectory context tooling SHALL report facts without semantic judgment

The kit SHALL expose one project-neutral effect-free trajectory-context entrypoint that
accepts an explicit project root, horizon id, current successful archive identity,
format, archive-count bound, aggregate-byte bound, and timeout. It SHALL validate the
horizon and exact proposal linkage, enumerate only the bounded stable-ordered linked
archive window, and report available relative paths, schema identities, content digests,
sizes, task/history/evidence presence, and explicit missing, unreadable, unsupported,
partial, or blocked states. It SHALL redact the project root by default and SHALL NOT
emit source payloads, secrets, untracked contents, or absolute private paths.

The entrypoint MUST NOT decide semantic progress, forecast status, useful-window fit,
cost dominance, trigger class, N/K equivalence, fan-out value, strategy, severity,
owner authority, or successor scope. It MUST NOT count tasks, archives, files, lines,
tokens, or elapsed time as a quality or productivity verdict. `--help` and `-h` SHALL
describe inputs, bounds, effects, evidence, and cleanup and exit zero without requiring
a repository.

#### Scenario: Bounded linked context is materialized

- **WHEN** the helper receives a valid horizon and successful linked archive under
  explicit bounds
- **THEN** it emits stable privacy-safe facts for that archive and the bounded preceding
  linked archive window
- **AND** repeated invocation over unchanged bytes is identical and performs no write,
  provider call, model inference, Git mutation, or OpenSpec operation.

#### Scenario: Horizon input is malformed or escapes the project

- **WHEN** a horizon, linkage, archive path, schema version, bound, or referenced file is
  malformed, missing, unreadable, symlinked outside the project, or over limit
- **THEN** the helper exits non-zero or reports the exact supported partial state with
  cause-preserving diagnostics
- **AND** it does not search parent directories, guess another horizon, drop the affected
  archive, or emit a clean context.

### Requirement: Successful archive SHALL receive a cheap non-blocking trajectory signal

After the canonical complete-archive path has returned success and final status
`archived` for a horizon-linked change, main SHALL evaluate one compact trajectory
signal from the explicit horizon, the current archive result, bounded normalized
context, and selected current evidence. The signal SHALL name the horizon and archive,
observed outcome delta or `unknown`, separate available engineering, proof/validation,
external/runtime, coordination/recovery, and context/comprehension facts, forecast
status `within-window | at-risk | outside-window | unknown`, trigger disposition
`none | review-required | unknown`, and exact evidence references and uncertainty.

The signal SHALL be evaluated only after archive success. It SHALL NOT change the
archive exit status, reopen the change, append or uncheck tasks, rewrite archived bytes,
invalidate accepted product evidence, create a final-history analysis, or make optional
workflow learning a complete-archive requirement. A signal failure or unknown result
SHALL remain visible for later horizon-dependent planning without relabeling the
successful archive red or incomplete.

#### Scenario: Cohesive trajectory has no material trigger

- **WHEN** a linked change archives successfully and current horizon evidence supports
  continued progress within the declared window without repeated-touch, shared-fan-out,
  forecast, or bottleneck concern
- **THEN** main reports `trigger: none` and ordinary continuation remains available
- **AND** no deep-review receipt, successor change, reviewer call, or improvement task is
  created solely for lifecycle compliance.

#### Scenario: Context collection fails after archive

- **WHEN** canonical archive succeeds but trajectory context is missing, unreadable,
  stale, contradictory, or over limit
- **THEN** archive remains successful and the signal reports `unknown` with the exact
  affected lane and next discriminating read
- **AND** no missing trajectory fact is converted into product-completion failure or a
  guessed no-trigger result.

### Requirement: Deep review SHALL require a current material trajectory trigger

Main SHALL enter deep trajectory review only when current evidence connects the same
Delivery Horizon to at least one material trigger: repeated item-specific engineering
touch for a behavior owned by one shared mechanism; a current blocker or correction
with complete reusable fan-out; a measured or assumption-bounded forecast at risk or
outside the useful window; several locally successful changes with no material movement
in a named exit predicate; or a demonstrated shift in the dominant engineering,
proof, external/runtime, coordination/recovery, or context/comprehension cost.

Each trigger SHALL name the current outcome or exit predicate, reachable consequence,
evidence, uncertainty, and why continuing unchanged can materially affect the useful
delivery window. One slow change, task count, line count, archive frequency, model-call
count, token estimate, or aesthetic architecture preference alone MUST NOT trigger deep
review. Deterministic tooling SHALL NOT classify a trigger.

#### Scenario: Repeated programs expose the wrong work unit

- **WHEN** current evidence shows supported programs require materially similar
  source-specific planning or implementation while one typed semantic or mapping owner
  can serve their exact shared class
- **THEN** the signal selects `review-required` with the repeated-touch and owner/fan-out
  evidence
- **AND** it does not infer that one program's runtime result can replace another
  program's required evidence.

#### Scenario: One isolated change is merely slow

- **WHEN** one change takes longer than expected but no current outcome predicate,
  repeated mechanism, forecast conflict, fan-out, or bottleneck shift is evidenced
- **THEN** the signal does not require deep roadmap review from that duration alone
- **AND** ordinary local diagnosis and delivery continue under their existing owners.

### Requirement: Deep review SHALL separate costs and forecast honestly

A triggered review SHALL bind the current horizon, candidate/context digest, trigger
evidence, accepted outcome and exit predicates, useful window, invariants, and non-goals.
It SHALL evaluate the unchanged-plan baseline and separate at least engineering/setup,
proof/validation, external/runtime execution, coordination/recovery, and
context/comprehension costs. When population and shared mechanism facts are applicable,
it SHALL distinguish item count `N`, exact unique owner/mechanism count `K`, automated
per-item processing, and irreducible per-item evidence instead of calling all work
sublinear.

A calendar forecast SHALL state its observed measurements or explicit bounded
assumptions, completed and remaining population, range, uncertainty, and invalidation
conditions. Missing delivery window, elapsed-time basis, population, or cost observation
SHALL produce calendar result `unknown`; structural repeated-touch or fan-out evidence
MAY still justify a non-calendar strategy review. Synthetic, offline, representative,
or class evidence MUST NOT be represented as unobserved external/runtime throughput or
population closure.

#### Scenario: Engineering setup improves but external execution remains linear

- **WHEN** shared-owner automation reduces engineering touch while every accepted item
  still requires its own serial external observation
- **THEN** the review reports reduced engineering cost and retained `O(N)` external cost
  as separate results
- **AND** it does not call owner reuse a sublinear calendar completion claim.

#### Scenario: Calendar evidence is unavailable

- **WHEN** the project declares a useful window but current duration, remaining
  population, or dominant-cost evidence cannot support an estimate
- **THEN** the review reports calendar forecast `unknown` and names the smallest missing
  observation
- **AND** it does not manufacture a date from task count, archive timestamps, prose, or
  model confidence.

### Requirement: Triggered review SHALL produce one bounded current disposition

The review SHALL produce exactly one disposition from `continue`,
`measure-next-boundary`, `replan-outcome-preserving`, `owner-required`, or `unknown`.
It SHALL compare continuing the current mechanism with only evidence-relevant remove,
narrow, batch, data-drive, reuse, shared-owner, architecture, or proof-boundary options.
An admitted replan SHALL name the smallest early falsifiable consumer, expected leverage,
proof, rollback, do-not-repeat condition, and evidence-based retry condition.

The review SHALL persist one immutable project-contained receipt keyed by the exact
`(horizon id, reviewed decision-context digest, trigger-evidence digest)` tuple. The
decision-context digest SHALL cover the reviewed horizon intent and ordered
decision-material evidence references/content digests. The trigger-evidence digest SHALL
cover the ordered causal evidence references/content digests. Current archive identity,
timestamps, model prose, and model-owned trigger labels SHALL remain non-key metadata.
The receipt MAY reference one ordinary OpenSpec successor but SHALL NOT be a mutable
roadmap status, current-task projection, completion authority, or substitute for the
successor's proposal, specs, tasks, proof, and validation. Unchanged tuple evidence SHALL
reuse the receipt and MUST NOT launch another equivalent review or successor. Changed
tuple evidence SHALL receive another deep review only when the current compact signal
establishes a materially distinct trigger or the evidence satisfies the prior receipt's
retry condition.

#### Scenario: Outcome-preserving strategy is available

- **WHEN** batching or one shared owner can reduce repeated engineering work without
  changing accepted outcome, population, invariants, proof strength, or protected
  semantics
- **THEN** main records `replan-outcome-preserving` and authors or updates one bounded
  ordinary OpenSpec successor with the earliest falsifiable leverage proof
- **AND** no owner confirmation is requested solely for plan, task, architecture,
  attempt-limit, or process-stop-line changes inside the accepted semantics.

#### Scenario: Equivalent review already exists

- **WHEN** the current horizon, reviewed decision-context digest, and trigger-evidence
  digest match one terminal receipt even if a later archive changed non-key operational
  metadata
- **THEN** the workflow consumes that receipt and does not repeat semantic review or
  create another successor
- **AND** only a materially distinct current trigger or evidence satisfying the receipt's
  retry condition may reopen strategy analysis under a changed tuple.

### Requirement: Quality and protected semantics SHALL remain hard constraints

A trajectory option that removes accepted population, weakens an equivalence,
observation, runtime, test, safety, data-integrity, authorization, cleanup, restoration,
or claim requirement, changes a public/persisted/security/product/legal policy decision,
or requires another protected effect SHALL be `owner-required` unless current accepted
requirements already resolve it. Main SHALL NOT select that option as an autonomous
delivery optimization. Reviewer, benchmark, forecast, or helper output SHALL never
authorize the changed semantics or protected action.

#### Scenario: Sampling would meet the date

- **WHEN** the only forecast-meeting option replaces the accepted exhaustive population
  with a sample or reuses one member's required runtime evidence for another
- **THEN** main records the exact changed outcome and returns `owner-required`
- **AND** it preserves the exhaustive baseline and performs no scope, proof, or product
  mutation from the trajectory review.

#### Scenario: Replan changes only future process controls

- **WHEN** the selected strategy preserves accepted behavior and protected boundaries
  while changing task grouping, owner reuse, automation, architecture locality, or the
  order and size of future evidence slices
- **THEN** main may update those controls and continue autonomously
- **AND** authority for any later external, destructive, costly, installed, deployed, or
  otherwise protected action remains separately gated.

### Requirement: Current triggered disposition SHALL precede dependent investment

Before a new proposal or apply operation makes substantial dependent investment in the
same horizon, main SHALL evaluate the latest successful linked archive against current
horizon evidence. If the compact signal is `review-required`, the operation SHALL
consume or create the matching terminal review receipt before dependent expansion. If
the signal is `unknown`, main SHALL obtain the smallest safe discriminating observation
or preserve the exact unknown ceiling; it MUST NOT silently treat unknown as no trigger.

Unrelated work, another horizon, archive completion, and safe evidence collection SHALL
remain available. This requirement SHALL NOT create a global project freeze, automatic
audit-and-fix campaign, or owner question when an outcome-preserving local route remains.

#### Scenario: Dependent successor starts after review

- **WHEN** the latest linked archive has a current `review-required` signal and the
  matching receipt records an outcome-preserving successor
- **THEN** propose/apply may continue through that successor under ordinary OpenSpec
  proof and validation rules
- **AND** the prior archive remains immutable and complete.

#### Scenario: Unrelated horizon has work

- **WHEN** one horizon has a pending or unknown trajectory review while another change
  is proven independent and linked to another horizon or none
- **THEN** the independent work may continue under its own accepted outcome
- **AND** its progress does not clear, satisfy, or inherit the first horizon's signal.
