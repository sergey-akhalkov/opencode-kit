## Context

The kit currently has three partially disconnected control planes:

1. Always-loaded and on-demand instruction policy defines proof-first, proportional delivery.
2. Generated OpenSpec propose/apply/archive prompts define the main spec workflow but do not bind completion to that policy.
3. Deterministic validators and operation gates check many exact markers but do not sit on the operation path and do not detect several current semantic drifts.

The repository also treats `OPENCODE_CONFIG_DIR` as an exclusive replacement for the host global config. Current official OpenCode documentation describes custom configuration as additive, and `opencode debug info` on OpenCode 1.18.15 observed a default-global plugin and custom-directory plugins in the same runtime. This means authority and context-cost analysis must account for every loader-visible source.

The working tree already contains broad user changes. Every implementation wave must preserve them, touch only its declared paths, and avoid broad reformatting or regeneration.

## Goals / Non-Goals

**Goals:**

- Put compact spec-quality constraints at the artifact-generation boundary.
- Make task and archive state truthful consequences of evidence.
- Reuse deterministic gates on the actual operation path.
- Replace static status with live discovery and synchronize normative sources.
- Make runtime-loading diagnostics match observed additive behavior.
- Capture session-hot improvement evidence across quality, cycle speed, and token economy for the working repository and `opencode-kit`.
- Reduce cycle and token cost through proportional routing, targeted context, focused checks, and concise output.

**Non-Goals:**

- Replacing or forking the OpenSpec CLI.
- Performing external installation, activation, release, deployment, or default-global mutation.
- Making prompt adherence a static-validator claim.
- Running all six compaction improvement ideas automatically.
- Removing the always-loaded safety floor without a passing disposable workflow comparison.
- Deleting unique tests or forcing test concurrency without measured benefit and reliability.

## Decisions

### D1. One outcome, independently proved waves

Use one OpenSpec change because all findings serve one outcome: trustworthy and efficient spec-driven iteration. Implement it through serial waves with separate affected-path sets and proof boundaries:

1. Spec Capsule and evidence-bound OpenSpec operations.
2. Live status and normative synchronization.
3. Runtime loading and machine-local instruction separation.
4. Compaction matrix, proportional routing, and selective context reduction.
5. Focused, concise validation and measured test execution.

Each behavior mutation returns its affected lane to `development`; a later wave does not reuse stale proof from an earlier candidate.

### D2. Put spec rules next to OpenSpec artifact generation

Use `openspec/config.yaml` context and per-artifact rules as the primary Spec Capsule injection point. Keep only portable routing and safety authority in global instructions. This makes generated artifacts receive the relevant constraints without requiring the model to recover them from a long unrelated context.

The project bootstrap shall document or install the same compact rule shape only when the target project uses OpenSpec. It shall not overwrite an existing project-specific OpenSpec configuration without an explicit merge path.

### D3. Completion is evidence-derived

An implementation task is complete only after its specified observable result and applicable focused validation have run successfully or a reasoned manual/external gate is recorded. Editing files is not completion evidence.

The apply path may continue to the next task autonomously after evidence succeeds. On failure it preserves diagnostics and leaves the checkbox unchecked rather than converting the failure into a generic user question.

### D4. Separate complete archive from incomplete preservation

Normal archive is fail-closed on incomplete artifacts, unchecked tasks, unsynchronized delta specs, or missing applicable validation evidence. If intentionally incomplete work must be retained, use an explicit abandoned/incomplete disposition that cannot emit "all complete" wording or update main specs as though requirements were delivered.

### D5. Reuse operation gates at operation entry

The propose/apply/archive entrypoints shall invoke their matching cheap deterministic checks. The gate shall verify only explicit facts it can prove, such as artifact presence, checklist state, required capsule fields, and recorded sync/evidence state. It shall report unknown for unsupported evidence and shall not score semantic quality.

Generated OpenSpec command and skill mirrors remain synchronized as one behavior surface. Until a supported upstream extension point is verified, repository changes must update both mirrors and retain a deterministic drift check; regeneration compatibility remains explicit evidence.

### D6. Runtime loading is additive until isolated proof shows otherwise

Documentation, doctor, and installer diagnostics shall distinguish the host default global source, custom config directory, project `.opencode`, explicit config, inline config, and managed sources according to current official semantics. Diagnostics list safe source locations and collisions, never file content, credentials, or private prompts.

Personal language preferences and machine model inventory shall move from the committed portable authority into a gitignored instruction file loaded through the schema-supported `instructions` option. Exact AGENTS precedence under additive directories remains an isolated runtime-proof requirement before deleting any authority copy.

### D7. Compaction always analyzes six cells but executes at most one improvement

Every compaction summary includes a compact matrix:

| Direction | Active working repository | `opencode-kit` |
| --- | --- | --- |
| Quality | evidence, smallest cheap improvement, benefit, cost/risk, or none | same |
| Cycle speed | same | same |
| Token economy | same | same |

An improvement is admissible only with observed session evidence and a local, reversible, low-cost action. The next session verifies all candidates against `Original User Goal`, then may execute at most one highest-ROI working-repository improvement that directly accelerates that goal and does not expand scope. Kit candidates stay visible but are not the next action while an unrelated project goal is incomplete unless the kit defect directly blocks that goal or the owner explicitly included kit work.

This preserves hot-session learning without creating a mandatory six-task startup phase.

### D8. Behavioral instruction changes use disposable workflows

Deterministic TypeScript validators may enforce schema, required structure, exact safety invariants, inventory, and mirror drift. They shall not rank, score, or optimize model behavior. Prompt and process effectiveness changes require same-model baseline/candidate workflows with observable oracles and recorded time/rework.

### D9. Validation has an iteration path and a freeze path

Expose focused commands for changed domains and use them during run-observe-correct. Run the complete suite once for the freeze candidate. Green output shall summarize suites and counts; failure output shall preserve the exact failing case, command, exit status, stdout/stderr, and relevant diagnostics.

Do not assume parallel execution is faster. Compare isolated serial and bounded-concurrency runs on the same candidate; retain concurrency only when wall time improves without flakes, resource contention, or missing diagnostics.

### D10. Dynamic status never lives in normative project guidance

`openspec/project.md` retains durable process and configuration guidance only. Active changes, progress, archive readiness, and execution order come from `openspec list`, `openspec status`, tasks, and current validation evidence.

## Risks / Trade-offs

- [Generated OpenSpec files may be overwritten by CLI regeneration] -> Keep mirrors synchronized, record generator version, and prove a regenerate/compare path before relying on hand edits long term.
- [More checks on operation entry can add latency] -> Restrict entry gates to cheap deterministic facts and run broad semantic review only for concrete risk.
- [Fail-closed archive can prevent historical preservation] -> Provide a distinct abandoned/incomplete disposition rather than a completion override.
- [Six-cell compaction analysis adds prompt/output tokens] -> Require compact cells, permit `none`, and cap automatic execution at one improvement.
- [Always-loaded reduction can remove a critical safety cue] -> Make only selective reductions and retain changes solely after disposable workflow oracles pass.
- [Additive runtime inspection may expose private paths] -> Emit redacted source kinds and safe paths only; never read or print content unnecessarily.
- [Parallel tests can be slower or flaky] -> Treat concurrency as a measured candidate, not a requirement.

## Migration Plan

1. Land and validate OpenSpec artifacts without changing runtime behavior.
2. Implement wave 1 on the current repository path, run local component proof, then run an authorized disposable model workflow before claiming prompt-path MVP.
3. Synchronize normative docs/specs and remove static roadmap state.
4. Update loader semantics and run isolated loader/debug proof without changing external/default-global state.
5. Add the compaction matrix and proportional routing, then run same-model baseline/candidate workflows.
6. Improve validation reporting and measure serial versus bounded concurrency before selecting a default.

Rollback is per wave: restore only that wave's changed repository artifacts. Runtime activation is separate and is not performed by this change.

## Open Questions

- Does the installed OpenCode version load both default and custom `AGENTS.md`, or only merge plugins/config/skills? Resolve with an isolated loader fixture before authority deletion.
- Does the current OpenSpec generator expose a supported operation-hook or template override that can replace maintained command/skill mirrors? Until verified, keep the synchronized-pair strategy.
- Which test suites are safe to run concurrently on the target CI and Windows environments? Resolve through measured bounded runs after focused/full command separation exists.
