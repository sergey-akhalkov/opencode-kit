## Context

The current kit has strong lower-level owners but no end-to-end roadmap mission owner:

- `session-completion-guard` determines whether one root has unresolved work and may continue that root.
- `openspec-operation-gate` checks cheap lifecycle facts.
- `openspec-archive.ts` validates and archives one completed change.
- project adapters describe project-native validation.
- session-delivery context and OpenSpec `history.md` retain bounded evidence and strategy continuity.

The audited `pmac-emulator` runtime demonstrated the missing composition. Project-local same-name OpenSpec commands and skills shadowed newer kit copies, project qualification lacked a complete validation adapter, the active change and roadmap successor were not represented by one machine-readable queue, and the completion guard had no process-level restart or bounded persistent-error recovery. A root continuation can therefore make progress, but it cannot prove that the next change is dependency-valid, that the correct workflow loaded, or that archive and recovery are safe.

That repository is a reproducer, not a design target. The reusable implementation and disposable proof projects contain no PMAC-specific path, term, gate, validation command, hardware rule, or roadmap label. Any future consumer supplies its own domain semantics only through repository-owned instructions, OpenSpec context, adapter, and explicit mission definition.

This change is Material. It changes installed instructions, lifecycle orchestration, persisted local mission state, archive routing, and asynchronous recovery.

### Fidelity Ladder

`current source/spec/runtime audit -> provider-free mission preflight in a disposable real OpenSpec project -> deterministic mission transition replay with fake/no-model executor -> installed OpenCode configured-provider disposable multi-change workflow -> operator-selected target project mission`. The autonomous scope stops before the final target-project rung unless its mission definition separately authorizes every required local/provider effect. Protected, live-hardware, remote, release, and deployment actions remain owner-controlled.

## Goals / Non-Goals

**Goals:**

- Give unattended roadmap execution one deterministic state and transition owner.
- Reuse existing OpenSpec gates, archive helper, validation adapter, session evidence, and guard.
- Make workflow source precedence and project overlay drift an executable preflight fact.
- Recover from process restart without guessing the active writer, operation, or next slice.
- Bound persistent completion-guard faults and retain actionable diagnostics.
- Prove the installed lifecycle through disposable projects before target-project use.

**Non-Goals:**

- Parse arbitrary Markdown into an implementation backlog.
- Let the arbiter select product scope or protected actions.
- Run multiple production writers concurrently.
- Commit, push, merge, deploy, install, release, publish, contact hardware, or mutate remote state by default.
- Make an unavailable roadmap outcome appear complete.
- Replace OpenSpec or duplicate its archive/spec merge behavior.

## Decisions

### Decision 1: Explicit Mission Definition And Separate Runtime State

Each mission uses a project-contained source definition at `opencode-dev-kit/missions/<mission-id>.json`. It contains:

- `schemaVersion` and safe `missionId`;
- repository-relative roadmap and evidence paths;
- exact ordered slices with change id, operation (`continue` or `propose`), dependency ids, accepted outcome summary, and protected-boundary classification;
- explicit aggregate validation argv as an array, never a shell string;
- workflow ownership policy;
- checkpoint policy;
- stop policy and allowed effect classes.

Mutable runtime state lives under `.opencode-dev-kit/runtime/roadmap-missions/<mission-id>/state.json`. Writes use create-new transition records plus atomic replacement of the current projection. State records definition digest, candidate/kit/OpenCode/OpenSpec identities, cursor, active operation, root session id when applicable, checkpoint, evidence refs, failure class, retry count, and terminal disposition.

Alternative rejected: infer unchecked roadmap bullets. Markdown is navigation text, mixes blocked and historical outcomes, and cannot supply stable dependencies or authority.

### Decision 2: Deterministic Controller Owns Transitions; Models Own Bounded Authoring

`global/bin/roadmap-mission.ts` owns `preflight`, `status`, `run`, `resume`, and provider-free `replay` modes. It invokes existing tools through argument arrays with `shell: false`:

1. preflight and acquire one project-contained mission lease;
2. reconcile OpenSpec live status and persisted state;
3. run one fresh OpenCode primary session for a bounded propose or apply instruction;
4. inspect machine-readable status and task state;
5. invoke the existing deterministic archive helper only after completion;
6. run roadmap/status readback and validation;
7. persist a transition checkpoint before advancing;
8. stop on completion, owner/external boundary, unknown state, red validation, or exhausted bounded recovery.

The controller never edits specs or source itself and never interprets model prose as a lifecycle transition. OpenCode model output is evidence; filesystem/OpenSpec/helper results are authority.

Alternative rejected: encode the loop in the completion arbiter. The arbiter is tool-free, evidence-bounded, non-lifecycle, and intentionally lacks project mutation authority.

### Decision 3: Canonical Global OpenSpec Workflow Names

Unattended mode requires the resolved kit global source to own `openspec-propose`, `openspec-apply-change`, `openspec-archive-change`, `opsx-propose`, `opsx-apply`, and `opsx-archive`. Project-specific constraints remain in `openspec/config.yaml`, `AGENTS.md`, and the project adapter. A project may keep differently named domain helpers, but a same-name project skill or command fails unattended preflight.

The canonical commands invoke portable binaries from the resolved global source rather than repository-local npm scripts. Deterministic validation checks command/skill mirrors owned by the kit. Runtime diagnostics confirm actual loaded locations before a mission starts.

Alternative rejected: permit arbitrary project overlays with version markers. Domain edits to a copied workflow can omit a safety behavior while retaining the marker; exact mirror hashes prevent customization, making the copy redundant.

### Decision 4: Strict Preflight Before Any Model Or Mutation

Provider-free preflight validates:

- mission schema, containment, stable ordering, dependency DAG, unique ids, and stop policy;
- current repository identity, Git state, checkpoint policy, and no open writer lease;
- complete validation argv and required executables;
- OpenSpec version/status and at most the exact active change expected by the current slice;
- canonical workflow files in the resolved global source and no same-name project overrides;
- runtime source/command/skill identity from privacy-safe OpenCode diagnostics;
- no protected effect class required by the next slice unless explicitly authorized in the mission definition and still allowed by the active owner contract;
- live-attempt gate and immutable evidence prerequisites when a slice declares an external/live boundary.

Unsupported or unreadable evidence is `unknown` and blocks. Preflight emits stable JSON and performs no provider call or repository mutation.

### Decision 5: Checkpoints Are Explicit And Never Imply Remote Delivery

Supported policies:

- `evidence-only`: transition records and content hashes; allowed only for a single-change mission or a disposable isolated worktree because it does not create a durable source checkpoint.
- `local-commit`: one local commit after archive and post-validation, allowed only when the definition records explicit owner authorization, the mission owns every changed path, and hooks pass. It never pushes.
- `external`: stop after each archive for a separately managed checkpoint; no automatic successor starts until the external checkpoint identity is supplied.

The controller never runs broad staging. It records expected owned paths and blocks on unrelated or overlapping dirty state.

Alternative rejected: silently accumulate many archived changes in one dirty worktree. That loses attribution and makes restart/rollback ambiguous.

### Decision 6: Guard Hardening Is Error-Class Aware

The guard receives separate limits for continuation cycles, retry attempts, arbiter prompt timeout, wait recheck, evidence/request bytes, and retained audit child usage. Defaults are finite for installed unattended-capable configuration. Errors are classified:

- retryable transient: provider unavailable, bounded timeout, temporary SDK failure;
- terminal input/state: oversized evidence after bounded projection, duplicate retained children, unsupported capability, invalid configured path;
- stale/cancelled: root revision, disable, interrupt, lease generation change.

Only transient errors consume bounded retry attempts. Terminal faults set persisted Error/Owner Required diagnostics without another provider call. Restart scans persisted grind-enabled roots, reconstructs safe leases/retry state where possible, and schedules one settle pass; unknown liveness remains fail-closed. Unleased running children, lost task results, and waiting state receive bounded deterministic rechecks/fallback rather than silent starvation.

The top-level permission default remains permissive for main, but the config hook no longer replaces explicit specialist-agent restrictions.

### Decision 7: Evidence Is Bounded Before Serialization

Session-delivery projection caps all human, todo, event, tool, assistant, descendant, and synthetic surfaces with explicit truncation records. The guard measures the exact final serialized request, not only a compact subobject. Oversize is terminal and actionable, not infinitely retryable. Audit child retention is implemented, not merely parsed; a mission uses fresh bounded child context per epoch or rotates according to the configured finite policy.

### Decision 8: Proof Uses Disposable Real Entry Points

`tools/proofs/roadmap-mission.ts` owns disposable project construction and evidence capture. Provider-free modes prove schema/preflight/state/replay/controller decisions. Configured-provider mode uses the installed `opencode run`/server boundary on non-sensitive synthetic changes, records actual loaded commands/skills/plugins, and cleans sessions/project state deterministically.

The complete proof scenario performs two successful serialized changes, one recoverable local failure, a process restart between transitions, and one terminal blocked slice. No remote or protected effect is available in the disposable environment.

## Failure Boundaries And Diagnostics

- **Manifest/config:** schema path and stable field diagnostic; no fallback default for authority or validation.
- **Process invocation:** preserve executable, redacted argv, exit/signal, stdout/stderr paths, original cause/stack.
- **OpenCode session:** preserve session ref, model ref, loaded workflow identity, finish/error, and cleanup state.
- **Git/worktree:** preserve head, status digest, owned-path set, checkpoint identity, and exact overlap.
- **OpenSpec/archive:** preserve status JSON, operation-gate output, archive helper output, archive path, and post-validation result.
- **Guard:** persist error class, attempt/limit, request bytes, wait reason, audit elapsed time, and recovery action with privacy-safe refs.

Errors are logged once at their owning process boundary. Raw prompts, credentials, provider options, sensitive outputs, and absolute private paths do not enter shared reports.

## Risks / Trade-offs

- **Model exits zero without completing a slice** -> controller trusts only OpenSpec/tasks/proof/validation facts and stops or performs a bounded new session according to state.
- **Project needs same-name customized workflows** -> migration must move domain constraints to OpenSpec config or use namespaced helpers before unattended mode; manual workflows remain available.
- **Local commit checkpoint changes Git history** -> requires explicit per-mission authorization and never pushes; otherwise use isolated single-change or external checkpoint mode.
- **Provider outage consumes time/cost** -> finite retry and wall-clock limits stop with a resumable transient failure.
- **Restart occurs during a writer** -> persisted `activeOperation` plus session/process liveness must prove terminal closure; unknown writer state blocks resume.
- **Mission definition becomes stale after roadmap changes** -> roadmap digest/readback mismatch stops before successor activation and requires an updated definition, not inference.
- **Large sessions still lose old detail through caps** -> truncation is explicit; durable OpenSpec/history/evidence files carry long-term facts outside the prompt.
- **Cross-project reuse search was degraded** -> design relies only on verified current-repository/platform owners and does not claim broad portability until disposable-project proof passes.

## Migration Plan

1. Add provider-free preflight and schema with no automatic mutation.
2. Move canonical portable OpenSpec workflows to the global installed source and add collision failures; retain manual target-project operation until migrated.
3. Extend bootstrap/doctor and migrate one disposable project, then a selected target project by removing same-name overlays and adding its adapter/mission definition.
4. Add persisted transition controller and provider-free replay.
5. Harden guard/evidence and prove restart/retry behavior.
6. Run configured-provider disposable multi-change proof.
7. Only after a new OpenCode process loads the candidate may an operator explicitly start a target mission.

Rollback stops OpenCode/controller processes, preserves mission/evidence state, restores the prior version-controlled kit and project overlays/adapters, reinstalls the previous global profile, and starts a new process. A partial mission remains paused and is never reclassified as complete.

## Open Questions

None for the current change. Selection and authorization of a concrete target-project mission remain a later owner action; this change proves the generic local/disposable capability only.
