# Stable Handoff

## Outcome

Every admitted evidence-backed session improvement now has an execution owner instead of advisory-only prose:

- A writable active change receives every admitted candidate immediately under `## Session-Derived Improvements`.
- Each unchecked task records `Trigger/Evidence`, `Why`, `Prerequisites`, `Scope/Non-Goals`, `Implementation`, `Observable Proof`, `Validation`, and applicable `Owner Blocker`.
- Automatic compaction emits all not-yet-persisted candidates under `Pending Improvement Tasks`; the next session persists all of them.
- Apply and both archive entry points reconcile pending candidates before completion.
- All admitted tasks are implemented and proven before normal complete archive, while Live-Attempt Gate ordering and protected-boundary owner authority remain intact.

## Scope and Non-Goals

Changed only model-facing global/OpenSpec lifecycle contracts, template/active compaction prompts, and the SDET-owned focused oracle. No semantic classifier, task database, automatic cross-repository mutation, archive-helper semantic expansion, release action, or generic backlog service was added.

## Candidate Reference

- Product Candidate: `global/AGENTS.md`, `global/skills/change-ready-sdlc/SKILL.md`, `global/opencode.json.template`, active machine-local `global/opencode.json`, `.opencode/skills/openspec-apply-change/SKILL.md`, `.opencode/commands/opsx-apply.md`, `.opencode/skills/openspec-archive-change/SKILL.md`, `.opencode/commands/opsx-archive.md`, and `openspec/config.yaml`.
- Test Candidate: SDET-owned additions in `tools/test-contracts-change-ready-delivery.ts`.
- Planning/Evaluator/Evidence: `openspec/changes/persist-session-improvements-in-tasks/`.
- Environment Identity: installed OpenCode `1.18.16`; build proof `openai/gpt-5.6-sol` `xhigh`; hidden compaction proof `xai/grok-4.5`.
- Stable Candidate: `RC1`.

## Runtime Proof

See `baseline-session.md`, `candidate-session.md`, `compaction-runtime-proof.md`, and `archive-command-runtime-proof.md`. Current happy-path behavior is proven at the installed fresh build-agent, hidden compaction-agent, and `/opsx-archive` command-loader boundaries with synthetic non-sensitive inputs and denied mutation tools.

## Critical SDET

- Attempt 1: `critical-risks-reported`, CR-PSI-01 dedicated compaction prompt gap; main confirmed, fixed, and re-proved.
- Attempt 2: `critical-risks-reported`, CR-PSI-02 `/opsx-archive` command gap; main confirmed, fixed, and re-proved.
- Attempt 3: terminal `no-critical-risk`, Effective Model `xai/grok-4.5`, no test changes.
- SDET is permanently stopped for this root under the critical-only convergence rule.

## Validation

Complete project tests, focused contracts, strict library validation, strict all-OpenSpec validation, operation gates, and diff checks are recorded in `final-validation.md`. Final post-checkoff archive-readiness results are appended there before handoff completion.

## Architecture and Diagnostics

- Responsibilities remain on existing owners: global admission/compaction policy, OpenSpec apply owner, OpenSpec archive owner, and dedicated compaction prompt.
- Skill/command mirrors are intentional real entry points and are guarded by the focused SDET oracle.
- No new top-level mechanism or reusable helper was introduced.
- Every failed validation preserved its exact source: portable-token rejection, missing compaction marker, and missing archive-command marker. Each corrected lane then passed static and real-entry proof.

## Known Non-Critical Limitations

- Instruction-level controls cannot guarantee every future model notices every candidate; no deterministic archive helper can infer chat-only admits.
- Main library specs retain pre-change wording until an explicit later archive synchronizes this change's deltas.
- Full compaction prompt bodies differ before the synchronized improvement tail; the current improvement semantics and real proof are aligned.
- Current running OpenCode sessions keep their already-loaded startup instructions. A fresh session/restart is required to receive the changed policy in its primary context.

## External Operations

- Performed: bounded configured-provider inference for baseline/candidate/runtime proof and fresh SDET, under standing authorization.
- Not performed: archive, commit, push, merge, release, installation, deployment, remote repository mutation, destructive action, credentials change, or new spending commitment.

Development-Stage: stable
Stable Candidate: RC1
