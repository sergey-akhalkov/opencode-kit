## Why

`/enable-grind` can continue unfinished work in one root, but the kit does not yet provide a deterministic, restart-safe owner for a multi-change roadmap mission. Current target projects can shadow newer OpenSpec workflows with stale project-local commands and skills, omit trusted validation adapters, accumulate unbounded guard retries or evidence, and leave archive-to-successor selection to model inference.

## What Changes

- Add a portable unattended-roadmap mission contract and controller that serializes active-change continuation, proposal, apply, qualification, complete archive, roadmap readback, checkpointing, successor activation, and terminal owner/external-blocker handoff.
- Add a provider-free mission preflight that fails closed on ambiguous active changes, stale or shadowing OpenSpec workflow overlays, missing project validation/runtime authority, unsafe dirty-worktree overlap, invalid successor dependencies, unsupported checkpoint policy, or an unproven external/live gate.
- Establish one canonical globally installed OpenSpec propose/apply/archive workflow owner, with deterministic mirror/version checks where a project-local surface must remain and project-specific constraints kept in project OpenSpec context or adapters.
- Extend project bootstrap and diagnostics so validation argv, workflow ownership, checkpoint policy, and mission compatibility are explicit rather than inferred.
- Harden the completion guard for long-running missions with bounded error-class-aware retry, arbiter-call timeout, bounded final request evidence, enforced retained-child policy, restart reconciliation, async wait rechecks/task-result fallback, and actionable liveness diagnostics.
- Add a disposable provider-free and configured-provider proof campaign covering multiple serialized changes, a recoverable failure, archive/readback, restart recovery, and a terminal owner/external blocker without protected or remote effects.
- Keep grind as root completion enforcement. The new mission controller, not the arbiter, owns roadmap state, change ordering, checkpoints, and stop predicates.

### Outcome Capsule

- **Outcome:** An operator can start one explicitly accepted roadmap mission and have the kit advance bounded OpenSpec changes serially until the configured queue is complete or only an exact owner/external blocker remains, with every transition recoverable and evidence-backed.
- **Operating Envelope:** Local repositories with OpenSpec 1.6-compatible artifacts, explicit project validation argv, an installed canonical kit workflow, one writable project root, local create-new mission evidence, and separately authorized provider calls. External, physical, destructive, remote, deployment, release, installation, activation, publication, credential, and cost-bearing actions remain separately gated.
- **Non-Goals:** Inferring a roadmap queue from arbitrary prose; deciding product scope; clearing protected boundaries; auto-committing or pushing by default; parallel production writers; replacing OpenSpec; using the completion arbiter as a scheduler; guaranteeing completion of unreachable roadmap outcomes.
- **Non-Deferrable Invariants:** One serial mutation owner; no stale workflow shadowing; no archive with incomplete tasks or red validation; no successor whose dependencies or authority are unresolved; no loss of raw evidence or strategy history; no retry of immutable failure classes; no continuation after unknown writer/process/live-attempt state; no model-created owner authorization.
- **Observable Proof:** A disposable project runs through two bounded changes and one terminal blocked successor using the installed entrypoints, survives a process restart from persisted mission state, preserves exact command/output/checkpoint evidence, archives only the completed changes, and stops without invoking the blocked action.
- **Material Residual Risks:** Model quality can still produce a defective candidate inside a valid mission transition; provider and host availability can pause progress; arbitrary legacy project overlays cannot be made safe without migration; project-specific validation duration and repository size can make unattended operation expensive.
- **Stop Line:** Stop when the installed canonical workflow, mission preflight/state/controller, long-run guard recovery, project adapter integration, and representative disposable runtime proof are complete. Do not deploy, release, push, contact hardware, or attempt an owner/external-blocked roadmap action.

## Capabilities

### New Capabilities

- `unattended-roadmap-orchestration`: Versioned mission state, deterministic preflight and transition controller, serialized OpenSpec lifecycle, checkpoints, restart recovery, and terminal stop behavior.

### Modified Capabilities

- `library-spec-workflow-integrity`: Require one runtime-resolved canonical workflow owner and fail-closed unattended operation when project overlays drift or shadow it.
- `library-tools-architecture`: Define portable mission/preflight cores, thin project adapters, stable machine-readable output, and reusable proof ownership.
- `library-install-init-resilience`: Provision and diagnose project validation/workflow ownership without overwriting project constraints or creating stale independent copies.
- `library-config-portability`: Expose mission and guard runtime identity, supported long-run options, and collision diagnostics through installed configuration.
- `session-completion-guard`: Bound persistent failures and evidence, recover enabled roots and async ownership after restart, and expose long-running liveness state without becoming the roadmap scheduler.

## Impact

- Expected production scope: `global/bin/`, `global/extensions/session-completion-guard/`, `global/plugin/session-delivery-context/`, global OpenSpec commands/skills, project bootstrap/doctor/runtime-source tooling, templates, proof inventory, package scripts, validators, and focused tests.
- New persisted local state is limited to an explicit project-contained mission file and create-new evidence/checkpoint records. Its schema and migration/rejection behavior are part of this change.
- Existing ordinary chat remains grind-default-off. Existing manual OpenSpec use remains available; unattended mode adds stricter prerequisites and does not silently repair or delete project overlays.
- No dependency, remote repository, deployment, release, or external-system mutation is introduced.
- Profile: `Material` because loaded instruction/configuration behavior, lifecycle orchestration, persisted mission state, async recovery, and archive safety change.
- The audited target repository is evidence of a general workflow defect only. No target product name, path, domain gate, roadmap label, validation command, or hardware rule may enter the reusable implementation or its acceptance fixtures.

### Reuse Disposition

- **Decision:** `extend`.
- **Current repository candidates:** extend `tools/openspec-operation-gate.ts`, `global/bin/openspec-archive.ts`, project adapter/doctor/runtime-source inventory, `session-delivery-context`, and `session-completion-guard`; do not create a second archive, validation, completion, or evidence framework.
- **Platform/dependency support:** Node 24 filesystem/process primitives, OpenSpec JSON commands, and the installed OpenCode SDK are sufficient; no new dependency is needed.
- **Cross-project layer:** degraded. The configured Graphify checkout did not expose an `opencode-kit` graph and the global graph returned unrelated workflow/state candidates, so no verified peer mission controller was reusable.
- **Registry impact:** not-applicable for this repository-owned workflow until a completed portable capability is proven.
