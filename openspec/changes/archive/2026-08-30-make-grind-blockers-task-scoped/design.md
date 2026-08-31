## Context

See `proposal.md` for motivation and the accepted outcome. The existing completion guard evaluates one idle root revision and applies a global verdict. Its hidden arbiter can map requirements and unresolved actions, but neither the verdict nor persisted root metadata represents task dependencies, scoped gates, or a controller-derived runnable frontier. Consequently `owner_required` pauses the root, a pending owner question remains open, and `maxCycles` exhaustion synthesizes an owner handoff even though each condition may be process-local rather than product-global.

Current loaded policy already says that process controls are autonomous, a blocked proof path is not the root outcome, and owner-required is valid only after independent work is complete. The failure is therefore an enforcement and representation gap, not a missing reminder. The change must remove conflicting global-stop behavior at its current owners instead of adding another override paragraph.

The Product Candidate is the frontier protocol, completion controller, question-deferral path, loaded main/arbiter/OpenSpec routing, and grind-backed mission/campaign composition. The Proof Runner reuses the installed completion-guard, pre-escalation, roadmap, and campaign families. The Evaluator owns exact frontier/verdict/event/effect oracles. Environment identity includes the loaded global source, OpenCode build, primary and arbiter routes, permissions, disposable root, and proof-owned process state. The complete claim boundary remains owned by `proposal.md` as `GRIND-TSB-001`.

## Goals / Non-Goals

**Goals:**

- Make scoped blocking and mandatory independent continuation machine-checkable.
- Preserve a compact ordinary-root frontier without importing the durable campaign scheduler.
- Separate product decisions, action/safety gates, technical/capability waits, user interruption, and completion into distinct states.
- Recover from a prematurely invoked question without inventing an answer or losing the product decision.
- Keep every execution/audit attempt finite while preventing a process budget from becoming owner scope.
- Preserve current protected-action, live-attempt, writer-liveness, restoration, cleanup, privacy, and human-race invariants.

**Non-Goals:**

- Deterministic semantic scoring or classification of tasks and decisions.
- Automatic approval of permissions, credentials, cost, remote operations, or protected effects.
- A general scheduler, issue tracker, workflow database, or campaign replacement.
- Work based on assumptions that differ across unresolved product options.
- Compatibility claims outside the current supported OpenCode and reviewed proof population.

## Decisions

### 1. Extend the completion guard with one compact versioned frontier

Register one plugin-owned `grind_frontier` tool as the only main-to-controller write ingress. The tool derives the root/session identity and latest non-synthetic human requirement ref from its execution context, accepts an expected server generation plus one complete candidate item/gate/decision set, validates it before mutation, atomically persists it through the existing root-metadata owner, and returns the new server generation and controller-derived runnable refs. Main supplies semantic relations; it cannot supply or override root identity, human requirement identity, audit identity, or the derived runnable set. Invalid input returns a cause-preserving tool error and never replaces the last valid frontier.

Persist the resulting bounded `workFrontier` in root completion metadata and include its normalized form in completion evidence. Version 1 contains:

```text
schemaVersion
frontierGeneration
basisHumanRef
taskStateDigest
acceptedOutcomeRef
items[]:
  id
  requirementRefs[]
  status: pending | running | complete | deferred | blocked
  dependsOn[]
  gateRefs[]
  evidenceRefs[]
gates[]:
  id
  kind: product-decision | process | technical | capability | external | safety | live-attempt | writer-liveness
  status: open | satisfied | stale
  affectedItemRefs[]
  resumeCondition
  evidenceRefs[]
parkedDecisions[]:
  id
  questionRef
  affectedItemRefs[]
  optionInvariantItemRefs[]
  decisionPoint
  evidenceRefs[]
progressFingerprint
```

The frontier is an execution control, not human scope. Main owns semantic reconciliation from current requirements, OpenSpec tasks, accepted decisions, and runtime evidence. The controller validates ids, refs, bounds, exact status values, acyclicity, gate/item consistency, optimistic generation, and correlation to the latest human requirement and current task-state digest. Assistant/tool message churn alone does not stale the frontier. It derives runnable items as pending items whose dependencies are complete and whose gates are satisfied or absent. Every parked decision's affected items must reference its matching product-decision gate, and option-invariant items must be outside that gate's dependency cone. The controller never decides whether prose is a product decision or whether a task dependency is semantically correct.

For Ordinary Small work, the frontier may contain one item and no gates. For OpenSpec apply, task ids and explicit dependencies are reused. Campaign and roadmap adapters project their existing item/slice identities into the same evidence shape without replacing their durable ledgers.

Alternative rejected: rely only on todos and arbiter prose. Existing todos do not carry stable dependency and gate relations, so the controller still cannot reject a false global stop. Alternative rejected: parse a structured block from assistant prose. That would make untrusted transcript text lifecycle state and would not provide atomic generation control. Alternative rejected: use the autonomous campaign ledger directly. It owns durable multi-wave audit/remediation and would add unrelated lifecycle, checkpoint, and report semantics to ordinary roots.

### 2. Make readiness deterministic and product classification semantic

The runtime enforces these cross-field rules:

```text
runnable != empty  => only continue is terminally legal
runnable == empty && open product decision exists => product_decision_required is eligible
runnable == empty && only non-product gates remain => waiting is eligible
all accepted items complete/deferred by human authority => allow_stop is eligible
explicit human pause/disable => user_paused or disabled
```

The hidden arbiter returns exact item/gate refs from the supplied current frontier. It cannot add tasks, dependencies, gates, or product decisions in its verdict. If current-basis evidence shows that the frontier is semantically incomplete, it returns `continue` for one bounded main-owned reconciliation action rather than guessing readiness or owner scope. A missing frontier or stale human/task basis bypasses ordinary arbitration and uses the controller-owned reconciliation-only path in Decision 7; malformed or unsupported persisted state produces no continuation.

The protocol becomes schema version 2:

```text
verdict: allow_stop | continue | product_decision_required | waiting | user_paused
runnableItemRefs[]
selectedItemRef: null | item ref
waitKind: null | process | technical | capability | external | safety | live-attempt | writer-liveness | budget
parkedDecisionRefs[]
deferredGateRefs[]
questionAction: null | answer | defer | present-product-decision
questionAnswers: null | exact offered-label matrix
ownerBoundary: null | product decision object
```

`product_decision_required` requires one exact product decision, an empty controller-derived runnable set, `questionAction=present-product-decision`, and affected-item closure. A completion-audit `waiting` verdict requires an empty runnable set, at least one open non-product gate, a resume condition, `questionAction=null`, and no ownerBoundary. It is non-terminal for mission completion but may leave the root quiescent until a relevant runtime or human revision triggers re-evaluation. A question audit with runnable work uses `verdict=continue`, `questionAction=defer`, `questionAnswers=null`, one selected runnable item, and either parked-decision refs or deferred non-product gate refs. A question audit with an empty runnable set and a non-product blocker question uses `verdict=waiting`, `questionAction=defer`, no selected item, and exact deferred gate refs so the request is rejected before quiescence. An autonomous in-authority question uses `verdict=continue` or `allow_stop`, `questionAction=answer`, and a validated answer matrix. These cross-field rules make reject, reply, leave-open, and non-question continuation mutually exclusive.

Alternative rejected: retain `owner_required` and strengthen its prompt definition. The current controller still applies that value globally, and loaded evidence already shows prompt-level rules can lose to local stop wording. Alternative rejected: call technical/access waits product decisions. That would misstate authority and recreate the process blocker the change removes.

### 3. Require frontier drain before a blocking product question

Main records a material product question as a parked decision as soon as it becomes decision-material, but does not invoke the interactive question tool while a controller-derived runnable item remains. Work is safe to continue only when it is option-invariant or otherwise independent of that decision.

If main invokes any blocker question that is not currently eligible to remain open, the question audit receives both the normalized question and current frontier. A human reply always wins. Otherwise `questionAction=defer` is the only legal rejecting action: it pairs with `continue` and one selected item while work is runnable, or with non-product `waiting` and no selected item when the frontier is empty. The guard:

1. records a pending synthetic deferral ref and either the parked product decision or exact non-product gate before an effect;
2. rechecks the question/frontier epoch;
3. calls the official question rejection API to resolve the suspended tool without inventing an answer;
4. confirms deferral provenance;
5. waits for the root to become idle; and
6. injects one bounded continuation containing the selected runnable item and parked-decision/gate ref, or commits the exact waiting state when no item is runnable.

This is intentionally different from the retired autonomous reject-then-correct path. Autonomous offered-label choices continue to use `question.reply` and return a real selected option to the original tool call. Rejection is used only to postpone an owner-owned product decision whose answer is not yet required.

When no runnable item remains, `product_decision_required + questionAction=present-product-decision` leaves only the current material product question open or injects one self-contained consolidated question if none is pending. A non-product question is rejected under `waiting + questionAction=defer` and the exact gate/resume condition remains visible without a pending request. Multiple parked decisions are consolidated only when they block the same empty frontier and can be presented without hiding separate consequences.

Alternative rejected: answer with the recommended first option. A product decision is owner-owned precisely because no accepted safe default exists. Alternative rejected: leave the premature question open and start another root. That creates concurrent ownership and does not resume the suspended primary turn safely.

### 4. Separate action authority from product-decision authority

Access, permission, credential, elevation, external capability, safety, destructive, remote, deployment, release, cost, and live-attempt facts remain independently enforced. Existing standing local authorization is consumed where it already applies; this change grants none.

A missing or denied prerequisite creates or updates the exact gate and blocks only its affected dependency cone. If an independent item exists, the guard continues it. If none exists, the root enters `waiting` with the exact wait kind and resume condition. It does not ask a fake product question, claim completion, or bypass the action boundary.

This means grind guarantees mission-global question discipline, not progress against unavailable physics. A powered-off host, unavailable provider, absent credential, or denied protected effect can leave an unfinished mission honestly waiting. Such a wait is resumable state rather than a product decision or completed outcome.

Alternative rejected: auto-approve arbitrary permission requests in the guard. Model-selected commands are not a safe deterministic effect class, and merged project/agent permissions remain authoritative.

### 5. Make process budgets bound attempts rather than missions

Retain finite arbiter retries, prompt timeouts, wait rechecks, request size, retained-child limits, and no-progress protection. Replace total-root `maxCycles -> owner_required` behavior with a bounded execution epoch:

- progress that completes an item, satisfies a gate, produces terminal evidence, or advances a downstream boundary resets the epoch cycle count;
- exhaustion with a runnable causally distinct action checkpoints the frontier and starts the next bounded epoch;
- exhaustion without a safe distinct mechanism produces `waiting: budget` or the existing one-time troubleshooter/reconciliation path;
- no budget path creates an ownerBoundary, completion claim, or automatic protected action.

The configured limit remains operational containment. It never becomes accepted product scope or a reason to ask whether process controls may be revised.

Alternative rejected: set every retry and cycle limit to `-1`. That permits provider, cost, and no-progress loops and conflates mission persistence with unbounded individual execution.

### 6. Keep roadmap and campaign ledgers authoritative at their layers

Roadmap mission and autonomous campaign controllers keep their durable slice/wave/checkpoint ownership. Their adapters expose current dependency-valid eligible siblings to completion evidence and must schedule all authorized independent siblings before returning terminal product-decision state.

A blocked slice is skipped only for the current dependency frontier; it remains incomplete with its gate and resume condition. The controller may reorder only when declared dependencies permit it. It cannot bypass an immutable campaign sequence, overlap writers, or claim that sibling success clears the blocked item.

Alternative rejected: make the root completion guard reorder durable campaign state. The guard lacks checkpoint and writer authority; it should enforce verdict legality against projected readiness, not mutate campaign ordering itself.

### 7. Migrate persisted state by reconciliation, not inference

New audit epochs use verdict schema version 2. A retained version-1 audit result cannot produce a new side effect after restart and is marked stale. A missing frontier, changed latest-human basis, or changed task-state digest enters `frontier-reconciling`; the guard injects at most one bounded reconciliation-only continuation with mutation, question, task-dispatch, and protected-effect tools disabled and the `grind_frontier` tool enabled. Normal completion, waiting, product-decision, and work continuation remain suppressed until the tool persists a current valid frontier. Assistant/tool message revision alone does not trigger reconciliation.

Malformed tool input never persists. Unreadable or unsupported persisted metadata enters a visible terminal capability/error state with no work or question effect; restart does not infer or silently overwrite it. A structurally valid older frontier with only a stale human/task basis uses the bounded reconciliation path above. This separates corruption/cycle/overflow from ordinary semantic revision lag.

Existing roots already persisted as paused/owner-required remain paused until a new ordinary human revision, explicit re-enable, or supported resume path creates a version-2 epoch. The migration does not reinterpret an unanswered historical question as deferred or answered.

Alternative rejected: infer a frontier from old assistant prose inside deterministic plugin code. That would turn untrusted summaries into lifecycle state.

### 8. Reuse current proof owners with one frontier fixture family

Extend the completion-guard component/runtime proofs for parser, controller, question races, restart, and installed root behavior. Extend pre-escalation proof for the circular stop-line scenario. Extend roadmap/campaign proofs only for projection and sibling scheduling. One reviewed frontier seed family materializes deterministic valid, partial-blocked, complete, stale, cyclic, malformed, and bounded cases; helper code validates explicit fields and never infers task semantics.

The first real boundary is a provider-free controller test that proves a non-empty runnable set makes `product_decision_required` invalid. The next boundary is an installed root that prematurely asks a product question, observes guard deferral, completes the independent item, and only then surfaces the product decision, paired with an installed credential/safety question that is rejected while independent work continues and becomes question-free waiting only after frontier drain. Paired protected-effect and human-race controls are required before broader scenario capture.

## Failure Boundaries And Diagnostics

- **Frontier materialization:** record source requirement/task refs, revision, item/gate counts, selected status, and cause-preserving validation error; never include raw private prompts in status logs.
- **Graph validation:** identify duplicate ids, missing refs, cycles, stale revision, impossible status/gate combinations, and enforced bounds; invalid input produces no verdict side effect.
- **Question deferral:** preserve privacy-safe root/request/decision refs, epoch, human-race observation, reject result, continuation result, and original SDK cause/stack.
- **Verdict application:** preserve derived runnable refs, supplied refs, rejected cross-field rule, wait kind, and current correlation without logging raw question text or answers.
- **Execution epoch:** preserve progress fingerprint, cycle count/limit, terminal evidence delta, selected successor mechanism, and wait/reconciliation condition.
- **Roadmap/campaign projection:** preserve ledger identity, dependency-valid siblings, active writer, blocked item refs, checkpoint identity, and no-overlap result.

## Risks / Trade-offs

- **Main writes an incorrect dependency graph** -> fresh arbiter checks supplied evidence, installed semantic scenarios challenge over-broad dependency cones, and missing/stale reconciliation cannot stop as product-required.
- **Question rejection races a human answer** -> pre-effect provenance, final epoch comparison, official API winner handling, and paired race tests preserve human precedence.
- **Frontier metadata grows during long roots** -> explicit item/gate/decision byte and count bounds fail visibly; completed historical detail stays in OpenSpec/campaign evidence rather than root metadata.
- **Automatic continuation loops** -> finite execution epochs, progress fingerprints, causally distinct strategy rules, and technical waiting replace owner escalation without blind repetition.
- **Waiting is perceived as completion** -> distinct persisted states, status/toast language, executor exit classes, and completion-certificate rejection keep waiting non-terminal.
- **Legacy roots cannot resume seamlessly** -> conservative reconciliation avoids unsafe inference; old paused roots require a new revision and remain an explicit migration limitation.
- **Cross-layer behavior drifts** -> one frontier vocabulary, focused contract checks, composed installed proofs, and no duplicate scheduler ownership.

## Migration Plan

1. Add frontier fixtures, schema/parser tests, and the red cross-field controller oracle before runtime mutation.
2. Implement version-2 verdict/frontier types and deterministic readiness with version-1 stale recovery.
3. Update controller completion, waiting, process-budget, and question-deferral paths; regain component and race proof.
4. Replace conflicting loaded instruction/spec/OpenSpec wording and align roadmap/campaign projections.
5. Run provider-free replay, then installed matched partial-product and safety controls, followed by the complete reviewed population.
6. Run fresh critical-only SDET for unauthorized-effect, question-race, false-completion, and writer-overlap incidents, disposition every row, and replay affected proof after any correction.
7. Run complete project validation and install/source diagnostics. Installation or activation requires a separate explicitly authorized operation and a fresh OpenCode process.

Rollback disables grind for affected roots, stops the proof-owned runtime, restores the coherent prior plugin/agent/instruction/config candidate, and starts a fresh OpenCode process. Persisted version-2 frontier metadata remains inert to older code; no question answer or protected effect is undone by rollback, so runtime proof uses disposable roots.
