## Context

See `proposal.md` for motivation and the bounded outcome. The kit already has the
intended process-control rule in `global/AGENTS.md`, Change-Ready, OpenSpec apply and
archive, and the completion arbiter: agent-authored attempt counts and stop lines
are mutable when accepted semantics remain unchanged. An archived same-model change
also claimed to prove that behavior.

The reproduced workflow still failed because stronger local phrases and artifact
shape dominated the rule. A target change defined success as `receipt-or-blocked`,
repeated `zero retries` and `terminal` across proposal/design/spec/tasks/evidence,
checked a final handoff at `Development-Stage: development`, and briefly reached
`23/23` without the required receipt. After the user restated the original goal,
the workflow correctly added six successor tasks, but then resolved
`<global-source>` to the repository parent instead of the active
`OPENCODE_CONFIG_DIR`. The exact helper existed under `global/bin` and passed when
invoked from that source.

This is a loaded lifecycle-policy change and therefore Material. The fidelity
ladder is `current transcript/source audit -> provider-free scenario and oracle ->
same-model installed baseline -> canonical instruction/workflow candidate ->
provider-free structural and helper-resolution checks -> same-model installed
candidate and completion-guard continuation -> fresh critical SDET -> complete
project validation`. Standing authorization covers the minimum bounded synthetic
provider calls in disposable roots. No PMAC repository, controller, packet capture,
credential, remote state, installation, activation, release, or deployment is in
scope.

## Goals / Non-Goals

**Goals:**

- Make the root accepted outcome, not an attempt counter or checkbox count, the
  controlling completion condition.
- Keep each live/high-cost invocation finite and non-reusable while allowing as many
  causally justified successors as remain useful, authorized, and safe.
- Remove mandatory end-of-change reflection and automatic process-work generation
  from product completion scope.
- Make portable OpenSpec helper resolution deterministic from the active global
  source.
- Prove the policy against the exact checked-but-unmet observer failure and preserve
  controls that prevent blind retries and protected-action bypass.

**Non-Goals:**

- An unbounded retry loop, retry scheduler, workflow database, semantic scoring
  helper, or automatic inference of causal quality.
- Relaxing immutable evidence, authorization, physical safety, writer liveness,
  restoration, cleanup, or external-operation controls.
- Changing upstream OpenSpec CLI checkbox/status behavior or rewriting archived
  evidence.
- Running or repairing the target PMAC qualification change from this repository.

## Decisions

### 1. Separate invocation identity from mission continuation

Use three terms consistently:

- **Invocation finalized:** one process/authorization/root has ended and cannot be
  replayed automatically or relabelled.
- **Outcome achieved:** the current human requirement has its required observable
  proof.
- **Change complete:** the accepted outcome is achieved, or the owner explicitly
  selected an incomplete/abandoned disposition.

An invocation may declare `automaticRetry=false` or an equivalent one-shot
contract. Mission continuation has no fixed numeric ceiling. A successor is
eligible only after a causal delta and all current replay, authority, safety,
state, restoration, and cleanup facts are green. Two materially similar cheap/local
attempts without progress still trigger a mechanism change. A live/high-cost
evidence failure still blocks unchanged re-execution immediately, but only until
the existing unlock contract is satisfied.

Alternative rejected: remove attempt limits globally. Finite process and transport
budgets prevent duplicate effects, runaway workers, and provider loops. Alternative
rejected: keep numeric mission caps but let main raise them repeatedly. That retains
the misleading control and encourages bookkeeping instead of causal diagnosis.

### 2. Make outcome reconciliation an apply/archive/arbiter responsibility

OpenSpec CLI task counts remain useful implementation inventory, but canonical
workflows must compare them with the proposal outcome and current proof before any
completion claim. `all_done` becomes a provisional structural state. If required
proof is absent, apply reopens or adds the smallest normal task and archive routes
back to apply. The completion arbiter maps the original requirement to evidence and
returns `continue` when a bounded safe route remains.

No general semantic parser will decide whether arbitrary prose proves an outcome.
The primary and arbiter retain reasoning ownership; deterministic checks enforce
only explicit contradictions available in structured evidence, such as all tasks
checked together with `Development-Stage: development` and a named required receipt
reported absent.

Alternative rejected: add a permanent synthetic `Outcome achieved` checkbox to
every change. It would create another ceremonial task and could still be checked
incorrectly. Alternative rejected: change upstream OpenSpec status semantics. The
kit can enforce honest routing without owning the CLI.

### 3. Remove mandatory retrospective work instead of adding another override

Delete the global/propose/apply/archive requirements that create and execute a
final-history-retrospective task. Remove matching marker validators and generated
template text. Keep `history.md` for materially distinct strategies where it has
continuation value. Keep lightweight `complain` or a separately owned change for
reusable workflow feedback. A correction directly required by the accepted outcome
remains ordinary dependency closure and receives a normal task when discovered.

This change itself contains the old final retrospective once because it is authored
under the currently loaded contract. Implementation removes that requirement for
subsequent changes; it must not create a successor retrospective.

Alternative rejected: retain the retrospective but make it optional. Its checkbox
and detailed matrix still occupy the product task graph and remain a salient false
completion gate. Alternative rejected: discard all strategy history. Costly/live
attempt continuity still benefits from concise causal records.

### 4. Replace conflicting stop phrases at their canonical owners

Edit the smallest canonical and role-specific surfaces rather than layering more
text. `global/AGENTS.md` owns the concise distinction. Change-Ready owns detailed
live-attempt and SDET continuation. OpenSpec apply/archive own artifact
reconciliation. The completion arbiter owns stop-versus-continue adjudication.

Remove deterministic contracts that require the literal phrases `immediately
blocks another live attempt` or `permanently stops SDET for the root`. Replace them
with paired markers for finite invocation safety and evidence-gated mission
continuation. Update active mirrors through their existing maintained owners; do not
rewrite archived change evidence.

Alternative rejected: add a personal preference or another skill. The failure
occurs before optional skill discovery and must be fixed in canonical loaded
authority. Alternative rejected: ban the text `zero retries` repository-wide. It
can correctly describe one technical invocation, so the contract must test its
local semantics rather than a bare token.

### 5. Reuse active runtime-source ownership for helper resolution

Treat `OPENCODE_CONFIG_DIR` as the first candidate global source exactly as current
global policy and config-portability specs describe. Canonical OpenSpec skills and
commands construct `<source>/bin/<helper>` only after verifying the source and
helper. When unset or missing, reuse the existing privacy-safe runtime-source
inventory and documented host-default fallback. Preserve exact attempted paths and
stop only after supported resolution or canonical precedence is genuinely blocked.

This is `reuse + narrow extension`: `global/bin` remains the portable helper owner,
and current runtime-source inspection remains the source/collision owner. No new
CLI, PATH installation, package dependency, or target-project script is added.

Alternative rejected: hard-code this checkout's absolute path. Alternative
rejected: require every target repository to add an npm script. Both violate
portability and duplicate source ownership.

### 6. Use one transcript-derived behavioral proof with strict controls

Extend the existing pre-escalation and completion-guard proof owners rather than
adding a third workflow runner. The fixed scenario carries:

1. original goal requires a receipt;
2. task status is `23/23` and stage is `development`;
3. receipt is absent;
4. direct startup and cleanup facts are trustworthy;
5. indirect packet observer and its canary both report zero;
6. current inventory disproves its component/leg binding;
7. a corrected no-effect route is available and underlying authority is already
   supplied;
8. artifacts say `zero retries` and `no successor`;
9. the active global source contains the operation helper while the guessed parent
   path does not.

Observable candidate success is behavior, not labels: no user question, preserved
raw facts, invalid observer scoped correctly, process controls revised, pending
outcome work restored, correct helper invoked, safe/no-effect next action selected,
and no protected action executed before its gate. Paired controls require stop on
explicit user pause, true owner-only action, unchanged unsafe repetition, and an
already achieved outcome.

Alternative rejected: source inspection and phrase markers alone. The archived
policy already passed those and still regressed in a longer contradictory context.

### 7. Keep evidence invalidation role-scoped

Instruction, skill, command, or arbiter prompt mutation changes the Product
Candidate and invalidates candidate behavior captures. Proof fixture/runner changes
invalidate only captures they drive. Evaluator-only corrections replay preserved
baseline/candidate bundles before another configured-provider call. Documentation
formatting changes invalidate no behavioral evidence unless they alter loaded
semantics.

## Failure Boundaries And Diagnostics

- **Artifact reconciliation:** preserve change id, task count, stage, requirement
  refs, required/actual proof, chosen continuation, and exact owner boundary or
  `none`.
- **Global-source resolution:** preserve configured source, supported fallback
  candidates, exact helper paths, existence/collision status, selected source, exit
  status, stdout, and stderr without exposing prompts or credentials.
- **Behavior capture:** preserve source/model/profile/input identities, assistant
  outcome claims, task/question/tool events, changed files, helper invocation,
  completion verdict, cleanup, and root/child deletion.
- **Attempt handling:** preserve the finalized invocation identity, causal delta,
  replay result, authority/safety/cleanup facts, successor identity, and prohibited
  unchanged strategy.
- **Provider/evaluator failure:** retain the complete raw bundle and replay the
  evaluator/finalization chain before another configured-provider attempt.

## Risks / Trade-offs

- **Mission continuation could become an infinite loop** -> retain stagnation,
  causal-delta, bounded invocation, writer-liveness, and completion-guard controls;
  prove unchanged-repetition rejection.
- **Outcome reconciliation remains model-dependent** -> use exact structured
  contradictions where available and installed same-model controls; never claim a
  deterministic semantic proof.
- **Removing retrospectives may lose useful ideas** -> preserve optional feedback in
  `complain` or a separate change without blocking product completion.
- **SDET can repeat after material change** -> require a distinct reachable critical
  hypothesis or behavior-affecting mutation plus renewed proof; forbid equivalent
  verdict-seeking reruns.
- **Source resolution could choose a colliding installation** -> reuse canonical
  runtime-source collision checks and fail closed on unknown precedence.
- **The change touches several loaded surfaces** -> maintain one semantic owner,
  proportional mirrors, exact inventory, and same-model installed proof before
  qualification.

## Migration Plan

1. Add provider-free fixtures/oracles and capture the current installed same-model
   baseline before loaded instruction mutation.
2. Update canonical normative specs and the smallest loaded/mirrored sources;
   remove obsolete retrospective and permanent-stop markers rather than adding
   override paragraphs.
3. Update deterministic validators and focused tests for the paired invocation and
   mission semantics plus exact global-source resolution.
4. Run provider-free checks, then capture candidate primary and completion-guard
   behavior against the preserved baseline and controls.
5. Complete fresh critical-only SDET, full project validation, strict OpenSpec
   validation, and local handoff. Do not install or activate the candidate globally
   from this change.

Rollback restores the previous version-controlled instruction, workflow, arbiter,
validator, and template sources. Preserved baseline/candidate evidence remains
immutable. Any proof-owned session, process, or disposable root must be terminally
closed before rollback or qualification.
