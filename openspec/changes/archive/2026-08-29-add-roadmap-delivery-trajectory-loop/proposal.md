## Why

The kit optimizes one accepted change for the earliest real signal and records local
strategy failures, but it has no project-level feedback loop that asks whether a
sequence of individually correct OpenSpec changes is still on a useful trajectory to
its phase or roadmap outcome. A project can therefore preserve quality and complete
many changes while using the wrong engineering unit, repeating per-item setup, or
discovering too late that proof, external execution, coordination, or context remains
the dominant delivery bottleneck.

The `pmac-emulator` Phase 1 case makes the gap concrete: program-by-program planning
advanced exact evidence but left 75 sources, 93 role cells, 216 mapping gaps, 243
observation gaps, and zero closed manifests. The resulting
`scale-phase1-corpus-qualification` strategy correctly reframed engineering work from
`O(N * manual program setup)` to shared `O(K)` semantic/mapping owners plus automated
`O(N)` processing, while retaining required serial per-program controller evidence.
The kit needs to surface that class of outcome-preserving strategy change earlier and
consistently in any project without reviving mandatory final-retrospective ceremony.

## What Changes

- Add one project-neutral roadmap delivery-trajectory workflow with two proportional
  levels: a compact signal after successful complete archive for changes explicitly
  linked to a Delivery Horizon, and a bounded deep review only when current evidence
  identifies a material forecast, bottleneck, repeated-touch, fan-out, or unit-of-work
  trigger.
- Define one explicit versioned project-contained Delivery Horizon contract that names
  the horizon id, accepted outcome and exit-predicate references, non-deferrable
  invariant and non-goal references, and a project-declared useful delivery window.
  New applicable changes link to that horizon explicitly; legacy or unrelated changes
  remain unlinked rather than being guessed from task text.
- Add one fact-only portable trajectory-context helper that validates an explicit
  horizon, change/archive linkage, bounded archive window, and available machine facts
  with stable privacy-safe output. It does not score velocity, infer semantic progress,
  choose a trigger, forecast completion, rank strategies, or authorize replanning.
- Add one main-executed `roadmap-delivery-trajectory` skill that separates engineering
  setup, proof/validation, external/runtime execution, coordination/recovery, and
  context/comprehension costs; compares the current mechanism with the accepted outcome
  and useful window; and reports unsupported calendar estimates as `unknown`.
- Require a triggered review before the next substantial dependent investment in the
  same horizon, not before archive of the completed change. Main may autonomously
  update future plans, task controls, architecture decisions, or author one bounded
  successor change when the accepted outcome and protected boundaries remain
  unchanged. Scope, population, quality, safety, public/persisted/security semantics,
  or another protected decision remains an exact owner boundary.
- Keep successful archive terminal and non-blocking. A missing, failed, or unknown
  trajectory signal is visible and affects only later horizon-dependent planning; it
  cannot reopen the archived change, append tasks to it, weaken its evidence, or make
  optional workflow analysis part of product completion.
- Prevent repeated equivalent reviews: one `(horizon id, reviewed decision-context
  digest, trigger-evidence digest)` tuple receives one current disposition and an
  evidence-based retry condition. The key excludes volatile archive identity and
  model-owned trigger labels. Unchanged decision evidence cannot create another review
  or successor proposal; changed evidence receives another deep review only for a
  materially distinct current trigger or when it satisfies the prior retry condition.
- Reuse the existing complexity workflow only when a triggered strategy question also
  exposes current architecture-comprehension pressure. Reuse ordinary OpenSpec propose,
  apply, archive, history, evidence, and consumer-outcome proof owners; do not add a
  Practice Owner, velocity reviewer, campaign playbook, scheduler, or mutable roadmap
  status database.

### Outcome Capsule

- **Outcome:** For every explicitly linked Delivery Horizon, successful OpenSpec
  archives produce a cheap evidence-bounded trajectory signal. When current evidence
  shows the roadmap forecast is outside its useful window, repeated per-item work is
  misaligned with a shared owner, a material blocker has reusable fan-out, or the
  dominant cost moved to another boundary, main performs one bounded review before the
  next dependent investment and autonomously selects the smallest outcome-preserving
  continuation, discriminating measurement, or successor plan. Quality, acceptance,
  proof, and protected boundaries remain hard constraints rather than optimization
  variables.
- **Operating Envelope:** Local readable OpenSpec projects using the current kit global
  source; one explicit versioned project-contained Delivery Horizon and project-declared
  useful delivery window; explicit change-to-horizon linkage; successful canonical
  complete-archive results; bounded current and archived change/evidence reads; stable
  fact-only context materialization; model-owned semantic trigger, forecast, bottleneck,
  and strategy judgment; local planning-artifact mutation only for outcome-preserving
  replans. Unsupported, missing, stale, contradictory, or unreadable facts remain
  `unknown`. No consumer product mutation is performed by this change's proof.
- **Non-Goals:** A mandatory final retrospective; analysis of every completed change;
  reopening an archive; a universal velocity, complexity, productivity, task-count,
  token, line, or archive-frequency score; automatic semantic inference in helper code;
  a generated roadmap or current-status database; project-wide audit; speculative
  architecture polish; automatic scope/population/quality reduction; a new Practice
  Owner, reviewer gate, campaign playbook, scheduler, workflow engine, deadline
  commitment, remote operation, deployment, release, installation, activation, or
  consumer-project migration.
- **Non-Deferrable Invariants:** Archive completion remains governed only by accepted
  product scope, proof, validation, claim closure, safety, and current required
  automation evidence. Delivery Horizon intent is explicit and never inferred from
  task or source counts. Deterministic tooling reports reviewed facts and unknowns only.
  A calendar forecast requires the project-declared window plus current measured or
  explicitly bounded assumptions; otherwise it is `unknown`. Engineering, proof,
  external execution, coordination/recovery, and context costs remain separate. A
  faster strategy may not remove accepted population, weaken runtime or test oracles,
  hide blocked/unknown work, reuse another member's evidence, or cross a protected
  boundary. Main owns semantic disposition and successor authoring; review evidence
  never authorizes mutation.
- **Observable Proof:** In disposable installed OpenCode projects, an explicit horizon
  with cohesive within-window progress archives normally and emits no deep-review
  artifact; repeated item-specific changes against a shared-owner population trigger
  one review and one outcome-preserving successor; an unchanged trigger emits no second
  review; absent delivery-window or duration evidence produces an honest `unknown`
  calendar result; an irreducible external `O(N)` cost remains separate from reduced
  engineering setup; and a proposed sampling/weaker-proof shortcut reaches
  `owner-required` without mutation. Archive status and validation remain green in
  every signal case. A separate read-only `pmac-emulator` diagnostic must identify the
  program-as-implementation-unit failure and the selected N/K corpus correction without
  granting generic population credit.
- **Material Residual Risks:** Semantic trigger and strategy quality remain model- and
  evidence-dependent. A declared useful window may be unrealistic or stale. Sparse
  archives may not expose the dominant cost, while one transient slow change may look
  structural. A trajectory review can still overfit one horizon consumer or create
  planning churn. Post-archive work adds some latency even when it does not block the
  archive. The first fixture population and one external diagnostic cannot prove that
  every project declares useful horizons, that every bottleneck will be found, or that
  the selected replan will improve calendar delivery before its own early falsifiable
  proof.
- **Stop Line:** Finish one explicit Delivery Horizon and linkage contract, one bounded
  non-semantic trajectory-context helper, one on-demand core skill, compact successful-
  archive and pre-next-investment routing, one outcome-preserving successor path,
  profile/catalog/template/docs integration, provider-free fixtures, matched loaded
  behavior proof, and one separate read-only PMAC diagnostic. Do not add a roadmap
  database, general metrics platform, persistent scheduler, campaign playbook, new
  Practice Owner, every-change report, automatic product-scope change, consumer
  migration, installation, activation, deployment, release, or remote mutation.

### Claim And Evidence Scope

- **Claim ID**: `roadmap-delivery-trajectory-v1`
- **Claim Class**: partitioned-domain cross-project loaded workflow behavior.
- **Population**: Reviewed disposable partitions `explicit-horizon-within-window`,
  `legacy-or-unlinked-archive`, `repeated-item-touch-trigger`,
  `shared-owner-fan-out-trigger`, `forecast-outside-window`,
  `missing-window-or-measurement`, `external-linear-bottleneck`,
  `outcome-preserving-successor`, `quality-weakening-owner-boundary`,
  `unchanged-trigger-no-duplicate`, `signal-failure-after-successful-archive`,
  `default-core-availability`, and `missing-capability`.
- **Coverage Basis**: Versioned generic horizon/change/archive fixtures; exact schema,
  linkage, ordering, bounds, privacy, fallback, and no-write checks; matched
  baseline/candidate configured OpenCode sessions with identical model/profile,
  permissions, environment, accepted outcomes, archive result, and fixture state;
  direct generated-artifact inspection; provider-free replay; and one separately
  bounded read-only external diagnostic.
- **Production Path**: Canonical complete archive succeeds -> fact-only horizon/archive
  context -> main's compact trajectory signal -> no trigger and ordinary continuation,
  or one triggered `roadmap-delivery-trajectory` review -> continue, discriminating
  evidence slice, autonomous outcome-preserving OpenSpec successor, or exact owner
  boundary. The next dependent propose/apply path consumes the current disposition;
  archive itself never waits for deep review.
- **Comparison Paths**: Current archive/handoff with no project-level trajectory check
  versus candidate archive plus cheap signal; cohesive and unlinked controls versus
  repeated-touch/fan-out/forecast triggers; measured versus unknown forecast; reduced
  engineering setup versus irreducible external runtime; outcome-preserving replan
  versus quality/scope-changing option; first trigger versus unchanged duplicate.
- **Environment**: Current supported local Windows OpenCode/OpenSpec/Node/Git
  installation with the kit source, disposable Git/OpenSpec projects, selected
  configured model/profile, finite non-sensitive calls, and one read-only local external
  case. No consumer implementation, controller contact, remote mutation, installation,
  activation, deployment, release, credential change, or protected product effect.
- **Real Oracle**: Actual configured OpenCode archive and successor-planning behavior,
  machine-readable OpenSpec status/archive output, explicit horizon and linkage
  readback, generated signal/review/proposal facts, unchanged archived bytes and task
  completion, exact tool/effect records, current source/worktree state, terminal
  session/process cleanup, and direct inspection that weakened acceptance reaches an
  owner boundary. Static markers and provider-free fixtures support but do not replace
  loaded behavior.
- **Unresolved Observations**: Other models/providers and host platforms; projects
  without an explicit horizon; long-running forecasts beyond the fixture windows;
  simultaneous independent horizons; semantic triggers not represented by the reviewed
  population; organization-level portfolio planning; actual long-term delivery-time or
  defect-rate improvement; and whether a future campaign playbook should consume these
  decisions.
- **Maximum Claim**: In the exercised installed environment and reviewed partitions,
  the workflow preserves successful archive, distinguishes no-trigger/unknown/triggered
  cases, performs one evidence-bounded project-level review, prevents duplicate review,
  and autonomously authors an outcome-preserving successor while retaining owner
  boundaries for weaker or changed semantics. It does not prove universal bottleneck
  discovery, forecast accuracy, optimal architecture, improvement for every project,
  or autonomous authority over product scope and protected decisions.

- **Automation Dividend**: required - reuse and minimally extend the maintained
  consumer-outcome regression fixture/capture/evaluator family for the trajectory
  partition pack and matched archive/signal/successor paths instead of creating another
  configured-session runner; current foundation-integrity, bounded-falsification, and
  complexity packs are the maintained recurrence source and the new trajectory pack is
  the first consumer.
- **Bounded Falsification Review**: required - explicit horizon ownership, post-archive versus product-completion boundary, semantic trigger sufficiency, forecast honesty, outcome-preserving autonomous replan, and no-retrospective/no-status-database scope.

## Capabilities

### New Capabilities

- `library-roadmap-delivery-trajectory`: Define explicit Delivery Horizons, compact
  post-archive signals, material trigger classes, separated cost/forecast review,
  duplicate suppression, outcome-preserving autonomous replanning, and protected owner
  boundaries.

### Modified Capabilities

- `library-spec-workflow-integrity`: Add explicit horizon linkage, preserve successful
  archive as terminal and non-blocking, and require a current triggered disposition only
  before the next substantial dependent horizon investment.
- `library-instruction-artifacts`: Define the new skill and compact archive/propose/apply
  routing, profile-aware unavailable behavior, trigger precision, no-retrospective
  consistency, and matched loaded behavior evidence.
- `library-tools-architecture`: Add the bounded fact-only trajectory-context helper and
  keep schema/link/archive facts separate from semantic progress, forecast, trigger, and
  strategy judgment.
- `library-runtime-surface-profiles`: Include the trajectory skill and its exact helper
  closure in default `core` and `all` surfaces with source, context-quality, and loaded
  behavior diagnostics.

## Impact

- **Expected production scope:** One thin `roadmap-delivery-trajectory` skill, one
  fact-only global helper, compact global and canonical OpenSpec archive/propose/apply
  routing, project/template Horizon and linkage guidance, core/all profiles, catalogs,
  validators, focused fixtures/tests, consumer-outcome trajectory pack, proof inventory,
  and operator documentation. Existing archive completion, complexity, next-step,
  campaign, and Practice Owner outputs retain their current owners.
- **Reuse disposition:** `build-minimal` one trajectory skill because archive owns
  operation integrity, complexity owns one current comprehension scenario, next-step is
  recommendation-only, Automation Dividend owns one preselected deterministic sequence,
  and the current campaign accepts only `audit-remediate`; none owns cross-archive
  horizon forecast and outcome-preserving strategy disposition. `build-minimal` one
  fact-only helper after current OpenSpec inventory was verified as active-change
  ownership/evidence-only and repository snapshot as Git-candidate-only. `reuse` the
  consumer-outcome proof family, OpenSpec operations, evidence/history, profile,
  validation, and source-resolution owners. Cross-project source search is `degraded`;
  the PMAC case was verified directly as read-only evidence, not copied implementation.
- **Active-change boundary:** Current `add-continuous-complexity-management` work owns
  overlapping global routing, skill/profile, validator, and consumer-outcome paths;
  `add-specialist-team-advisor` and `add-autonomous-campaign-orchestration` declare later
  overlapping loaded/proof owners. Planning artifacts are isolated now. Implementation
  must begin with fresh ownership inventory and may mutate an overlapping path only
  after the current writer is terminal and the path is explicitly transferred,
  serialized, or narrowed; no active change is adopted or reverted.
- **Compatibility/dependencies:** No public product API, protocol, persisted consumer
  data, remote dependency, deployment surface, or campaign state is added. The new
  project-contained Horizon/linkage schema is additive for new explicit participants;
  legacy/unlinked changes remain visible controls and are not retroactively rewritten.
  Loaded skill/profile/instruction changes require a fresh OpenCode process before use.
- **Profile:** `Material` because implementation changes loaded cross-project lifecycle,
  archive continuation, autonomous planning behavior, and default runtime surfaces.
  Planning artifacts remain `Development-Stage: development` and authorize no install,
  activation, consumer mutation, archive, commit, push, release, deployment, or remote
  action.
