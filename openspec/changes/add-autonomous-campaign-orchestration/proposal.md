## Why

The kit can autonomously finish one root and execute one predeclared roadmap mission,
but it cannot safely own a multi-day outcome whose later work is discovered during
earlier phases. Large efforts therefore depend on transcript memory and manual
handoffs between investigation, planning, multiple OpenSpec changes, re-verification,
and restart recovery, which can lose coverage, duplicate work, or stop with confirmed
material findings still unresolved.

## What Changes

- Add one versioned `autonomous-work-campaign` contract above the existing roadmap
  mission. It owns a bounded `discover -> synthesize -> execute -> verify` lifecycle,
  durable campaign transitions, explicit work-item admission, frozen execution waves,
  aggregate closure, and exact terminal handoff without making model prose a lifecycle
  authority.
- Add a project-neutral machine ledger and derived human report contract. Campaign
  state, scope blocks, work items, severity/confirmation, wave traceability, evidence,
  and changed-block re-review remain structured and digest-correlated; Markdown reports
  are materialized views rather than cursors or completion authority.
- Add an `audit-remediate` reference playbook that inventories the declared repository
  scope, uses isolated read-only audit partitions, confirms and fixes only P0/P1
  findings, retains P2/P3 as report-only, investigates credible unknown P0/P1 rows
  without silently downgrading them, and repeats bounded remediation waves until the
  current candidate has no unresolved P0/P1 row or an exact owner/protected blocker.
- Keep `unattended-roadmap-orchestration` as the only frozen-wave mutation executor.
  The campaign controller may materialize one exact mission definition from an
  admitted wave and consume its machine state, but it may not edit the mission queue
  after freeze, impersonate its completion, widen its certificate authority, or run a
  concurrent source writer.
- Add a Windows host-supervisor adapter that starts from protected installed material,
  reconciles campaign/OpenCode/mission liveness after process loss or interactive
  logon, and resumes only a safe persisted transition. Explicit stop, owner-required,
  unknown writer state, drift, exhausted budget, or unavailable authority remain
  paused and cannot be converted into success by restart.
- Extend project bootstrap and doctor with campaign readiness: canonical runtime and
  workflow identity, complete validation argv, checkpoint policy, campaign definition
  and ledger paths, configured inference/cost authority, Windows supervisor readiness,
  and active-change/worktree ownership remain separate from ordinary and static-
  mission readiness.
- Add disposable provider-free and bounded configured-model proof covering a complete
  discovered-work campaign, more than one frozen remediation wave, P2/P3 exclusion,
  unknown-P1 investigation, process restart, Windows supervisor re-entry, protected
  stop, changed-block re-review, report regeneration, and terminal cleanup.
- Serialize implementation after `add-foundation-integrity-autorecovery` archives or
  explicitly transfers every overlapping instruction/OpenSpec/runtime/proof owner.
  Foundation incidents remain a separate current-identity correction mechanism and
  cannot admit optional polish or act as the campaign scheduler.

### Outcome Capsule

- **Outcome:** An operator can authorize one bounded multi-day work campaign for a
  local project and have the kit discover in-scope work, freeze traceable execution
  waves, execute their OpenSpec changes, re-verify the resulting candidate, recover
  after owned runtime or host restart, and stop only when the accepted closure is
  evidenced or an exact owner/protected boundary remains. The reference audit path
  autonomously fixes every confirmed P0/P1 finding and reports but does not fix P2/P3.
- **Operating Envelope:** One canonical local Git worktree per campaign on the managed
  Windows workstation; one active campaign mutation lane; project-contained versioned
  campaign definition, durable evidence path, explicit validation argv, canonical
  global OpenSpec workflow, supported local/external checkpoint policy, configured
  finite model/time/disk budgets, protected installed supervisor material, and one
  reference `audit-remediate` playbook. Provider inference and authorized local commits
  are permitted only when declared; remote, destructive, release, deployment,
  credential, product-semantic, and other protected effects remain separately gated.
- **Non-Goals:** Proving that undiscovered defects are impossible; fixing P2/P3;
  deriving product outcomes from arbitrary prose; parallel source writers; concurrent
  campaigns in one worktree; multi-repository transactions; running against this
  checkout while an overlapping active change or unattributed dirty path remains;
  Linux/macOS host-reboot integration; public deployment; remote mutation; replacing
  OpenSpec, the roadmap mission, completion guard, foundation recovery, or project
  validation; a general arbitrary-code workflow engine.
- **Non-Deferrable Invariants:** The accepted campaign envelope and effect authority
  are immutable inputs to execution; runtime reports and transcripts are never state
  authority; every executable slice traces to one frozen admitted work item; unknown
  credible P0/P1 risk is investigated or remains blocking rather than downgraded;
  optional architecture polish is not P1 without a named current change axis,
  reachable consequence, confirmed material impact, and evidence; P2/P3 never enter a
  remediation wave; the roadmap mission remains the sole source writer for a frozen
  wave; writer/process liveness must be terminal or isolated before retry, integration,
  checkpoint, or resume; protected effects and owner decisions remain fail-closed;
  immutable transitions/evidence survive restart; derived reports cannot drift from
  the current ledger; unrelated work and the active foundation change remain untouched.
- **Observable Proof:** The installed Windows operator path runs one disposable
  non-domain-specific campaign from explicit definition through deterministic
  inventory, bounded read-only discovery, finding/work-item freeze, two serial frozen
  missions, OpenSpec propose/apply/archive/checkpoint, aggregate validation, changed-
  block re-review, final challenge, and generated report. The same candidate exercises
  one recoverable local failure, controller/OpenCode process restart, the installed
  supervisor re-entry path used at logon, one P2/P3-only row, one investigated unknown
  P1 row, one protected-effect stop, durable replay, no duplicate archive or source
  writer, exact cleanup, and no remote/protected effect.
- **Material Residual Risks:** Semantic discovery and P0/P1 classification remain
  probabilistic and evidence-bounded; an incomplete rubric or missed source region can
  miss material work; very large repositories can exhaust configured budget before
  closure; non-interactive model credentials or Windows task authority may be
  unavailable after reboot; target-specific validation or OpenSpec overlays can pause
  a campaign; the first host proof does not establish Linux/macOS recovery or every
  project/toolchain; the active foundation change may alter shared owners before this
  implementation begins and requires fresh dependency readback.
- **Stop Line:** Finish one project-neutral campaign core, one normalized ledger/report
  materializer, one reference audit-remediation playbook, one frozen-wave handoff to
  the existing mission, one Windows supervisor adapter and readiness path, and one
  installed disposable end-to-end proof with restart/replay/closure. Do not add other
  playbooks, Linux/macOS supervisors, multi-repo coordination, parallel source writers,
  P2/P3 remediation, deployment/release, remote effects, or target-project migration.

### Claim And Evidence Scope

- **Claim ID:** `autonomous-work-campaign-v1`
- **Claim Class:** partitioned cross-project workflow and restart-recovery behavior
- **Population:** Reviewed disposable partitions for valid campaign definition,
  invalid/unsafe definition, complete inventory, independent read-only discovery,
  confirmed P0, confirmed material-quality P1, P2/P3 report-only rows, credible unknown
  P0/P1 investigation, optional-polish exclusion, two frozen remediation waves,
  incomplete/failed mission, active-change and dirty-path conflict, protected effect,
  controller/OpenCode interruption, Windows supervisor re-entry, changed-block
  re-review, report drift prevention, budget exhaustion, and terminal completion.
- **Coverage Basis:** Versioned generic fixtures, exact schema/digest/state checks,
  same-model baseline/candidate configured OpenCode captures, installed Windows
  supervisor/launcher invocation, actual OpenSpec mission lifecycle in disposable Git
  projects, direct filesystem/process/readiness readback, immutable raw bundles, and
  explicit terminal rows for every reviewed partition.
- **Production Path:** Protected Windows host supervisor -> portable autonomous campaign
  controller -> bounded semantic discovery/synthesis roots -> frozen project-contained
  mission definition -> existing roadmap mission executor and completion guard ->
  aggregate verification, ledger closure, derived report, and terminal campaign state.
- **Comparison Paths:** Current manual audit/ledger plus static mission workflow versus
  the candidate campaign; uninterrupted versus restart/re-entry; confirmed P0/P1 versus
  P2/P3, optional polish, unknown, and protected controls; initial candidate versus
  changed-block re-review and final closure.
- **Environment:** Current supported Windows workstation with pinned installed kit,
  OpenCode, OpenSpec, Node, Git, configured bounded model route, and disposable local
  repositories. No consumer product, Linux/macOS host, remote service mutation,
  deployment, release, credential change, or destructive external effect.
- **Real Oracle:** Actual installed supervisor and loopback OpenCode runtime, machine-
  readable campaign/mission/OpenSpec state, source/evidence/report filesystem effects,
  process/listener ownership, project validation output, task/session attribution, and
  terminal cleanup. Static validators support but do not replace this boundary.
- **Unresolved Observations:** Other models/providers, repositories beyond the reviewed
  fixtures, long-duration resource behavior beyond bounded proof, Windows reboot while
  interactive credentials are locked, Linux/macOS host integration, multi-repository
  campaigns, additional campaign playbooks, and material findings not represented by
  the reviewed rubric/partitions.
- **Maximum Claim:** The exercised installed Windows environment and reviewed generic
  partitions can resume and complete one bounded campaign, dynamically freeze and run
  traceable P0/P1 remediation waves through the existing mission, preserve P2/P3 and
  protected controls, and derive a current closure report. This does not establish
  universal defect discovery, semantic correctness for every project, cross-platform
  reboot recovery, or authority over protected decisions/effects.

- **Automation Dividend**: required - add one deterministic campaign contract/state/
  ledger/report materializer and extend the existing roadmap proof family with a
  reviewed campaign partition pack; helpers validate explicit facts and stable
  projections only and never infer severity, semantic scope, or completion.

## Capabilities

### New Capabilities

- `autonomous-work-campaign`: Define the durable multi-phase campaign envelope,
  explicit work-item and P0/P1 admission, frozen-wave lifecycle, source-writer handoff,
  restart recovery, aggregate closure, and derived report contract.

### Modified Capabilities

- `unattended-roadmap-orchestration`: Define campaign-produced frozen mission input,
  parent/child lease and terminal handoff semantics while preserving the mission as
  the sole immutable-wave executor and forbidding self-generated successors.
- `library-tools-architecture`: Require a portable campaign core, deterministic
  non-semantic ledger/report helpers, thin host/project adapters, and maintained
  disposable proof ownership without duplicating mission or completion machinery.
- `library-install-init-resilience`: Add separate campaign-readiness diagnostics for
  definition, validation, checkpoint, inference budget, runtime identity, and Windows
  supervisor prerequisites without weakening ordinary/static-mission readiness.
- `local-opencode-workstation`: Add protected installed campaign-supervisor lifecycle,
  bounded logon/process recovery, project registry and status/stop integration without
  giving the tray or launcher source-mutation authority.

## Impact

- **Expected production scope:** portable campaign contracts/state/controller and
  semantic-root executor under `global/bin/`; thin installed launcher/status/stop
  surfaces; project bootstrap/doctor/adapters; deterministic ledger/report tooling;
  Windows protected supervisor/task integration; proof runners/evaluators; validators,
  tests, docs, profiles, and proof inventory.
- **Existing owners reused:** `global/bin/roadmap-mission/**`, mission launcher and
  session executor, session completion guard, OpenSpec operation/archive gates,
  portable process and evidence helpers, Windows workstation protected lifecycle,
  project doctor/bootstrap, and current proof capture/replay conventions.
- **Ownership/dependency:** implementation must not begin on overlapping instruction,
  OpenSpec workflow, runtime-profile, proof, or workstation surfaces until
  `add-foundation-integrity-autorecovery` and current workstation edits are terminal,
  archived/checkpointed, or explicitly transferred and re-read. Proposal artifacts do
  not authorize modification of those active files.
- **Persisted local state:** one versioned project-contained campaign definition and
  evidence tree plus protected/contained runtime transition, lease, and projection
  state. Schema rejection/migration, retention bounds, privacy, and rollback are part
  of this change.
- **External surfaces:** no new public product API, protocol, dependency, remote
  mutation, deployment, release, or publication. Windows Scheduled Task/protected
  host material installation and activation are separately authorized maintainer
  operations; loaded plugin/config/tool changes require a fresh OpenCode process.
- **Profile:** `Material` because the change adds persisted campaign lifecycle state,
  autonomous dynamic planning/execution, process and writer recovery, Windows startup
  behavior, and loaded OpenCode workflow/configuration semantics.
