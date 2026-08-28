## Context

See `proposal.md` for the multi-day continuity problem, accepted outcome, and the
single change-level `autonomous-work-campaign-v1` claim. The current kit already owns
four lower-level mechanisms:

- `session-completion-guard` keeps one explicitly enabled root from stopping while
  bounded autonomous work remains, but it does not schedule a roadmap;
- OpenSpec proposal/design/spec/tasks/history/evidence own one bounded change;
- `unattended-roadmap-orchestration` serially executes one immutable definition of up
  to 100 exact slices with durable transitions, writer closure, archive, checkpoint,
  and manual run/resume/status/stop;
- `codebase-audit-loop` and `codebase-audit-ledger` define exhaustive semantic review,
  block re-review, findings, gaps, and failure-mode outputs, but their Markdown form is
  not a runtime state or machine projection owner.

No current owner composes those mechanisms into a restart-safe dynamic work campaign.
The existing mission explicitly cannot discover or generate a successor campaign, and
the active `add-foundation-integrity-autorecovery` change explicitly excludes a daemon,
scheduler, or second recovery orchestrator. That change also owns pending edits on
shared instruction/OpenSpec/runtime/proof surfaces. This change may author independent
planning artifacts now, but implementation must begin with terminal archive/checkpoint
or explicit ownership transfer and fresh readback of every overlapping owner.

The current host boundary is the managed Windows workstation: one protected shared
loopback OpenCode runtime starts at interactive logon and already has identity-safe
Start/Restart/Stop and bounded service recovery. The campaign must reuse that runtime
and protected lifecycle without putting campaign semantics or source-mutation
authority into the tray/workstation controller.

## Goals / Non-Goals

**Goals:**

- Add one durable project-neutral controller for the fixed phase shape
  `discover -> synthesize -> execute -> verify`, with one included audit-remediation
  playbook and safe dynamic waves inside the immutable accepted campaign envelope.
- Make normalized campaign facts, not transcript or mutable report prose, sufficient
  for restart reconstruction, bounded fresh-context assignment, traceability, report
  regeneration, and terminal closure.
- Reuse the existing roadmap mission as the only frozen-wave mutation executor and
  preserve its one-writer, archive, checkpoint, retry, and completion-guard contracts.
- Permit bounded parallel read-only discovery without concurrent source writers or
  shared mutable result paths.
- Resume safe campaigns after owned process/OpenCode loss and owner interactive Windows
  logon while preserving explicit stop, owner, budget, drift, and unknown-liveness
  pauses.
- Prove the complete installed operator path in disposable generic projects and keep
  the broad claim bounded to its reviewed partitions and Windows environment.

**Non-Goals:**

- A second roadmap executor, archive implementation, completion arbiter, provider
  plugin, semantic scorer, arbitrary DAG/script engine, or recursive agent swarm.
- Foundation-identity detection/recovery, optional architecture polishing, P2/P3
  remediation, multi-repository transactions, concurrent project source writers, or
  campaign execution against the current dirty/overlapping kit worktree.
- Linux/macOS startup integration, public service deployment, remote mutation,
  credential provisioning, or automatic protected product/API/data/security/legal
  choices.
- Perfect defect discovery or a claim that an exhaustive declared audit eliminates
  every undiscovered defect.

## Decisions

### 1. Add one campaign owner above, not inside, the roadmap mission

Add a new portable campaign family under `global/bin/` with cohesive owners for
contracts, state, controller, semantic-root execution, mission handoff, and ledger/
report materialization. The campaign owns phase and wave orchestration. The existing
roadmap mission owns every frozen wave from first source mutation through archive and
checkpoint.

```text
campaign controller
  discover -> synthesize -> freeze wave
                                |
                                v
                      roadmap mission controller
                      propose/apply/archive/checkpoint
                                |
                                v
campaign controller <- terminal correlated handoff
  verify -> close or synthesize next wave
```

The campaign may create one mission definition and call its existing run/resume/status/
stop entrypoints. It does not edit `controller.ts` into a general scheduler, modify an
active mission after freeze, accept a campaign terminal certificate, or let the mission
create another campaign. Mission source changes are limited to parent/work-item
correlation and terminal handoff fields needed to prove exact composition.

Alternatives rejected:

- Extending the mission queue dynamically would invalidate its immutable-definition,
  preflight, replay, and no-successor invariants.
- Letting the completion arbiter choose the next wave would make a redacted session
  projection a scheduler and model verdict a lifecycle authority.
- One giant OpenSpec change would make audit coverage and all fixes one all-or-nothing
  context/lifecycle unit and would not survive newly discovered work cleanly.

### 2. Keep the campaign envelope static and its work portfolio dynamic

The definition freezes accepted semantics and authority: outcome, scope, exclusions,
playbook, paths, validation, checkpoint, allowed effects, authorization refs, finite
budgets, host-resume, and stop policy. Dynamic content is limited to evidence discovered
inside that envelope: inventory blocks, candidate/confirmed work items, investigations,
wave grouping, and the number of waves before closure.

Only process budgets may change after start without a new campaign identity. A budget
revision receives a new digest and transition, but cannot add scope, effects, provider
authority, product semantics, or protected decisions. Scope/authority changes require a
new owner-authored definition/campaign identity rather than silent continuation.

Alternative rejected: permitting the model to rewrite campaign outcome/scope while
discovering would turn dependency closure into self-authorized product work and make
restart replay unable to identify which intent was accepted.

### 3. Store reviewed seed facts once and derive every projection

Use versioned JSON seed records with exact schemas and stable ordering. The first
schema has these conceptual owners:

```text
campaign definition       immutable accepted envelope
inventory snapshot        candidate identity + all scope blocks/exclusions
partition result          one isolated discovery assignment
work item                 evidence + severity candidate + status
reconciliation result     fresh confirmation/falsification/unknown
investigation result      bounded discriminating observation
wave manifest             frozen work-item-to-slice mapping
campaign transition       append-only lifecycle fact
campaign projection       atomic current state derived from transitions
closure matrix            current block/item/wave/proof terminal facts
report                    deterministic human view of current seed records
```

Runtime state lives under a separate contained campaign tree such as
`.opencode-dev-kit/runtime/work-campaigns/<campaign-id>/`; immutable project evidence
and the report use definition-declared project-contained paths. State records use the
mission's proven append-durable-then-atomic-project pattern and hash-chain identities,
but campaign and mission schemas/state roots remain separate.

Generated indexes, totals, report sections, hashes, and ordering are never independent
manual variants. One materializer reads reviewed seed records, emits all derived
artifacts, reads them back, and fails on drift. Semantic text stays in reviewed seed
records; helpers do not summarize or reclassify it.

Alternative rejected: one mutable Markdown ledger/report reproduces the observed stale
status/residual/backlog contradiction and cannot safely drive restart or admission.

### 4. Separate campaign coordination ownership from project source ownership

The campaign controller holds one campaign-state lease while it coordinates phases.
It may write only the campaign runtime/evidence paths attributed to its current
operation. Before mission launch it records and flushes `wave-admitted`, starts the
child mission with exact correlation, and owns no project source/OpenSpec/archive/
checkpoint mutation capability while the mission writer is active.

The mission holds its existing writer lease and is the only source mutation owner.
The parent may append non-overlapping observation transitions such as liveness/status,
but it cannot alter mission state or project files. Verification starts only after a
terminal handoff proves writer, session, process, cleanup, archive, and checkpoint
closure. Unknown ownership pauses both layers.

Read-only discovery roots may run concurrently because they receive source read-only
permissions and isolated create-new result paths. The controller remains the sole
integrator of those results. Synthesis, mission execution, reconciliation, and report
replacement are serialized.

Alternative rejected: one shared lock for all campaign, report, and mission writes
would either block safe observation for long periods or tempt campaign code to bypass
the mission owner. Concurrent source writers remain forbidden.

### 5. Use bounded fresh semantic roots with role-specific permissions

Add one semantic-root executor that connects to the current verified loopback OpenCode
runtime and creates fresh parentless roots for exact campaign assignments. It does not
start a hidden server and does not reuse the mutation mission executor or its terminal
certificate issuer.

Assignment types and permissions are fixed:

| Assignment | Project source | Isolated campaign result | OpenSpec/source writes | Children/questions |
| --- | --- | --- | --- | --- |
| discovery partition | read-only | create once | denied | denied |
| reconciliation | read-only | create once | denied | denied |
| investigation | read-only plus exact safe observations | create once | denied | denied |
| synthesis | read-only | create frozen-wave candidate once | denied | denied |
| final challenge | read-only | create once | denied | denied |

The executor bounds prompt/input/output bytes, wall clock, model calls, retained
sessions, evidence refs, and diagnostics. Results are one exact schema-valid JSON file
correlated to campaign, definition, candidate, phase, assignment, source blocks, model,
session, and environment. Invalid/missing output or unknown cleanup is non-terminal and
cannot be inferred from assistant prose.

Alternative rejected: using general subagents from one long root makes context and
liveness transcript-dependent and cannot survive host restart. Reusing mission grind
roots would grant propose/apply/certificate behavior to read-only audit work.

### 6. Freeze discovery before remediation and challenge severity separately

The reference playbook follows this semantic sequence:

```text
deterministic inventory
  -> partitioned discovery candidates
  -> fresh reconciliation of every candidate and coverage block
  -> bounded investigation for credible unknown-material rows
  -> findings freeze
  -> wave synthesis/admission
```

Discovery producers cannot confirm their own work items. Reconciliation receives the
candidate, current source/evidence, campaign severity policy, and exact counterfactual
questions. It returns evidence, not authority. The accepted definition preauthorizes
the deterministic admission policy: only fresh confirmed P0/P1 rows with complete
fields are eligible. The controller validates that policy structurally and owns the
transition.

P1 requires a present named change axis and current material impact. A large file,
duplication, missing optional test, or cleaner abstraction is not P1 by itself. It may
be P1 when current evidence shows that mixed ownership, drift, or missing boundary
causes a reachable material correctness, reliability, change-locality, or testability
defect for the accepted outcome. This preserves the user's material-quality policy
without conflicting with foundation recovery's optional-polish exclusion.

A credible unknown P0/P1 row gets one bounded read-only investigation assignment.
`still-unknown` pauses only that closure lane and cannot become P2/P3 automatically.
Investigation is not a new mission operation because it has no source mutation.

Alternative rejected: treating severity as deterministic keywords/scores would encode
semantic policy in helper code. Treating every architecture observation as P1 would
create an endless polish campaign.

### 7. Materialize each wave as one exact ordinary mission

Synthesis groups confirmed unresolved P0/P1 rows by cohesive outcome, current owner,
dependency, owned path, effect class, proof, and validation boundary. One wave has at
most 100 slices because that is the existing mission contract. Each slice gains exact
`workItemRefs`; the mission gains a parent campaign/wave correlation. Synthesis may
propose a grouping, but deterministic admission verifies:

- all current eligible P0/P1 rows are assigned exactly once or explicitly deferred to
  a later ordered wave because of dependencies/bounds;
- every ref/digest/status/effect/path is current and no P2/P3/unknown row is included;
- dependencies are acyclic and ownership is non-overlapping or serially transferred;
- the exact mission definition matches the wave;
- active changes and worktree paths satisfy mission preflight;
- all required effects are already authorized.

Admission persists both digests before calling mission run. A rejected candidate wave
returns to synthesis with structural diagnostics, not a partially edited mission.
After mission checkpoint the campaign verifies and re-reviews before synthesizing a
successor. The mission itself never knows or selects that successor.

Alternative rejected: predeclaring every change before discovery recreates the manual
gap. Letting the model directly write executable mission JSON skips effect, ownership,
coverage, and traceability gates.

### 8. Define convergence from current closure facts, not wave count

Wave completion triggers aggregate validation, requirement-linked real-boundary proof,
candidate diff/readback, impact mapping, and `needs-rereview` for every changed or
materially affected block. Current read-only re-review can create new stable work items;
confirmed P0/P1 returns to synthesis, while P2/P3 remains report-only.

Terminal completion is a conjunction over current candidate facts: complete block
coverage, no `needs-rereview`, no unresolved/unknown/owner-required P0/P1, every P0/P1
fixed and verified, every wave archived/checkpointed, aggregate validation/proof green,
terminal ownership, current report projection, and one fresh broad-claim challenge.
Wave/attempt/time budgets are safety controls; exhaustion pauses and never substitutes
for convergence.

When a confirmed P0 has a reachable named critical consequence, the existing
Change-Ready SDET trigger applies after current proof and accepted-scope completion.
The campaign records that terminal critical evidence before closing the affected wave.
P1 alone does not create mandatory SDET ceremony.

Alternative rejected: `no new finding in one pass`, green tests, checked tasks, or
maximum-wave exhaustion are insufficient aggregate closure oracles.

### 9. Keep the report human-readable but non-authoritative

The report materializer produces one stable Markdown document from current normalized
records. It includes campaign identity and maximum claim, scope/exclusions, block
coverage, findings by severity/status, redundancy/test-gap/failure-mode matrices,
work-item-to-change/wave/proof traceability, validation, owner/unknown blockers, P2/P3,
limitations, and final state. Every summary count and status links to seed refs/digests.

Report replacement is atomic and followed by parse/readback against current records.
Prior reports may be retained as evidence by digest, but only the current projection is
linked from campaign state. Manual report edits fail drift readback and cannot change
lifecycle state.

Alternative rejected: asking a final model root to write the whole report from memory
would reintroduce context overflow, stale rows, omitted findings, and unverifiable
totals.

### 10. Use a separate portable supervisor with a thin Windows host adapter

Add a portable supervisor process that owns campaign-process monitoring and calls only
campaign preflight/status/resume/stop. It contains no phase, severity, wave, mission,
or completion semantics. Add a Windows adapter and explicit protected registry under
the current workstation lifecycle owner but in an independent protected sibling root,
not below the existing recursively removed workstation root. The adapter installs one
derived Scheduled Task for owner interactive logon and may expose bounded status/stop
through existing operator surfaces.

At logon, the adapter waits for the existing positively identified authenticated
OpenCode service, then invokes supervisor reconciliation for each enabled registration.
On controller exit it preserves logs and uses finite restart/backoff only for a
classified unexpected process failure. It does not auto-resume explicit stop,
owner/external/protected/budget pause, drift, or unknown ownership. A registered project
need not have a Desktop launcher mapping, but its canonical Git root and campaign paths
must be explicitly protected and validated; arbitrary invocation paths remain rejected.

The implementation should add cohesive campaign-supervisor modules and the smallest
shared workstation-layout contract rather than expand `tools/windows/opencode-workstation.ts`
with campaign state logic. That contract owns the protected workstation root, credential
path, ACL, and owner-logon task settings used by both installers. The campaign installer
copies the complete maintained portable-workflow runtime closure into its sibling root
while preserving the `global/` layout, binds source and installed digests in its own
manifest, and leaves the portable task-6.2 registry schema unchanged. The existing
workstation rollback cannot delete the sibling root or unregister its separately named
task; campaign rollback verifies and removes only its own attributable artifacts. The
tray may show aggregate health and open status/stop, but has no credentials or mutation
authority.

Alternatives rejected:

- Putting campaign semantics in the tray/workstation controller adds a second mixed
  responsibility to an already large safety-critical owner.
- Letting the OpenCode plugin supervise itself cannot recover after its process dies.
- Launching a hidden independent OpenCode server breaks current runtime identity and
  cockpit/session visibility.
- Linux/macOS adapters are outside the exercised first host envelope.

### 11. Extend doctor and installation without implicit activation

Project bootstrap may emit templates/guidance for campaign definition and validation,
but cannot register host recovery, enable provider use, or copy canonical workflows.
Doctor adds `campaignStatus` and `--require campaign`; it inspects campaign definition,
paths, budgets, runtime/workflow identity, provider authority, active changes, worktree,
writers, mission compatibility, and selected supervisor installation. Static mission
readiness remains separate.

Supervisor preview/install/check/repair/rollback is a dedicated explicit Windows
maintainer operation. Installed binaries/registry/tasks are derived from versioned kit
source, protected from unelevated mutation, and associated with a rollback manifest.
The install manifest, rather than an extra field rejected by the portable registry,
binds the expected kit root, complete source-file inventory, and installed identities.
Config-time/plugin/tool changes still require a fresh OpenCode process.

Alternative rejected: making project init or doctor register a task turns diagnostics
into host mutation and hides an installation/activation boundary.

### 12. Reuse proof infrastructure and define scoped invalidation

The current fidelity rung is reviewed source/spec/planning. The proof ladder is:

1. provider-free campaign schema/state/ledger/report and fixture evaluator;
2. one disposable real OpenSpec project that materializes a frozen wave and invokes
   the actual mission preflight/controller with a fake/no-model semantic boundary;
3. one configured semantic happy path through discovery, reconciliation, synthesis,
   mission execution, re-review, and closure;
4. Windows protected supervisor preview/install/check and actual Scheduled Task action
   invocation against disposable registrations without reboot;
5. interruption/restart, protected/unknown/P2/P3/budget partitions and offline replay;
6. full project validation and fresh `autonomous-work-campaign-v1` evidence challenge.

Product Candidate is campaign/mission-correlation/doctor/Windows supervisor behavior.
Proof Runner is the extended roadmap/campaign capture family. Evaluator is provider-
free and consumes immutable observations. Environment Identity includes kit,
OpenCode/OpenSpec/Node/Git/model/profile/Windows task/runtime/project/campaign/mission
digests. Raw bundles preserve exact invocation/input, stdout/stderr, transitions,
sessions/processes, files, reports, checkpoints, cleanup, and effects.

Campaign-core mutation invalidates dependent configured and host lanes. Mission
correlation mutation invalidates mission-handoff lanes, not unrelated semantic
captures. Windows-adapter mutation invalidates host recovery only. Evaluator/report
mutation replays preserved raw bundles and does not repeat configured/host effects
unless observations are missing. Each failed live lane follows its own blocked replay
gate.

Configured model calls are bounded synthetic kit validation under existing local
authorization, with non-sensitive prompts and disposable repositories. Windows task
installation/action proof is local and reversible but remains separately recorded;
no remote, deployment, release, consumer, credential-change, or destructive external
effect is in the envelope.

Alternative rejected: a wholly new capture/evaluator/process library duplicates the
roadmap and workstation proof owners most likely to fail under interruption.

### 13. Serialize implementation against current active ownership

Implementation task 1 must re-read `openspec list/status`, active ownership manifests,
candidate/worktree identity, and current foundation/workstation changes. No overlapping
instruction, OpenSpec capability, runtime profile, proof harness, workstation source,
or main spec write may begin until `add-foundation-integrity-autorecovery` and current
workstation edits are archived/checkpointed, isolated, or explicitly transferred with
acyclic dependencies.

This is a process/ownership gate, not a semantic dependency: foundation incidents stay
separate and do not become campaign work items or scheduler authority. If the active
change modifies a planned owner, this design and tasks receive the smallest coherent
readback update before implementation continues.

Alternative rejected: listing the active foundation change as a campaign `continue`
slice would adopt work outside this outcome and violate both mission preflight and
unrelated-work ownership.

## Risks / Trade-offs

- **Semantic roots can miss or misclassify work** -> Require complete deterministic
  inventory, fresh reconciliation, unknown-material investigation, changed-block
  re-review, broad final challenge, and an evidence-bounded maximum claim.
- **P1 becomes an architecture-polish loophole** -> Require a named current change
  axis, reachable consequence, material impact, and bounded correction; keep optional
  polish P2/P3/report-only.
- **Dynamic waves expand product scope** -> Freeze outcome/effects, require exact
  work-item refs, deterministic admission, and owner stop for protected semantics.
- **Two durable controllers create split brain** -> Separate state roots/leases,
  persist parent/child digests, keep mission as sole source writer, and fail closed on
  any unknown handoff.
- **Parallel audits create uncontrolled writers** -> Source read-only permissions,
  isolated create-new outputs, no children/questions, and controller-only integration.
- **Large campaigns consume unbounded time/model/disk** -> Required finite budgets,
  persisted consumption/backoff, bounded evidence/retention, and honest resumable
  budget pause.
- **Host restart resumes unsafe work** -> Protected explicit registry, full preflight,
  process/session/writer identity reconciliation, explicit-stop suppression, and no
  elapsed-time liveness inference.
- **Supervisor increases workstation complexity** -> New cohesive host-adapter modules,
  portable core, minimal integration seam, responsibility map/split-or-justify, and
  independent rollback.
- **Reports drift from ledger state** -> One seed source, deterministic materialization,
  atomic replacement, readback/digest validation, and no manual lifecycle authority.
- **Active foundation/workstation work overlaps implementation** -> Planning-only now;
  implementation begins only after terminal archive/checkpoint or explicit ownership
  transfer and current source readback.
- **Configured/host proof is costly** -> Shift left through provider-free replay and
  real mission simulation, capture the smallest full happy path first, and repeat only
  invalidated lanes.

## Migration Plan

1. Apply `replace-instruction-limits-with-context-quality`, or explicitly rebase this
   change on its replacement contract, then wait for terminal closure or explicit
   ownership transfer of the active foundation change and current workstation edits;
   record current source/ownership/instruction-diagnostics/runtime-budget/runtime
   identities and reject this checkout as a campaign target during implementation.
2. Build provider-free campaign contracts, state, ledger/report materializer, and
   deterministic fixtures; prove append/replay/drift behavior before a model or source
   writer can start.
3. Add the semantic-root executor and reference playbook partitions; capture a matched
   unchanged-runtime baseline before candidate routing/executor behavior changes.
4. Add frozen-wave/mission correlation and exercise one disposable real OpenSpec wave
   through the existing mission before adding successor-wave behavior.
5. Complete configured discovery/reconciliation/synthesis/re-review and only then
   expand to unknown/P2/P3/protected/budget partitions.
6. Add campaign doctor readiness, portable supervisor, and explicit protected Windows
   adapter; prove preview/check, then installed task action/re-entry and rollback in a
   disposable registration.
7. Run the complete interruption/replay/closure population, update the development
   claim record with observed evidence only, obtain the fresh evidence-sufficiency
   challenge, and run full strict validation.

Rollback first disables the exact campaign registration/task, stops only positively
identified campaign supervisor/controller processes, and preserves all project,
campaign, mission, checkpoint, evidence, and report artifacts. It then restores the
prior protected supervisor install manifest or selects the prior generated kit profile
and starts a fresh OpenCode process. Repository rollback reverses only this change's
campaign, correlation, readiness, Windows-adapter, proof, validation, and documentation
surfaces. Unknown installed/process identity blocks destructive rollback for that item.
