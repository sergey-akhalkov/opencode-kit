# Stable Local Handoff

## Outcome

New OpenSpec change authoring now creates exactly one initially-last final-history-retrospective task. After all other currently known work, apply reuses the existing compaction six-cell matrix, admission gate, target ownership, authority rules, and `Session-Derived Improvements` fields over complete `history.md`, immediately executes every admitted improvement or records `none`, and never schedules or runs another retrospective. Archive cannot bypass incomplete retrospective/generated tasks.

## Scope And Non-Goals

- Changed loaded global authority and maintained propose/apply/archive skill-command mirrors.
- Changed this repository's OpenSpec task-authoring guidance and current normative specs.
- Added one SDET-authored critical structural oracle and one history-derived proof-inventory preflight rule.
- Did not change hidden compaction behavior, OpenSpec CLI, deterministic archive helper, dependencies, public product API, persisted data, another project, active/archived pre-policy task inventories, or external state.

## Evidence

- Baseline reproduced missing propose/apply behavior.
- Runtime Proof reached the actual fresh loaded `/opsx-propose` OpenCode/OpenSpec boundary and same-model admitted/none apply behavior.
- Final history retrospective admitted and completed H.1; no second retrospective was created.
- Fresh Material SDET: `no-critical-risk`, Effective Model `xai/grok-4.6`; main focused replay green.
- Full validation is recorded in `final-validation.md`.

## Candidate And Stage

- Root RC history before this change: none.
- Runtime Product Candidate reference: `05ca9caef750a04478ef6be501bc2660fe62eef4`.
- Stable Candidate: `RC1`; final apply/archive gates report `0/7` unchecked and final aggregate validation is green.
- Development-Stage: stable.

## Known Non-Critical Limitations

- Instruction behavior remains model-sensitive; structural contracts and representative fresh-loaded proof reduce but cannot eliminate missed semantic execution in a future session.
- Existing OpenSpec changes are intentionally not retrofitted. The rule applies only to changes authored after the retained instructions are loaded.
- Project-specific lower-level command text may add constraints; always-loaded global authority preserves the portable requirement but does not rewrite those project files.

## Restart And Rollback

- Running OpenCode sessions do not hot-reload changed config-time instruction artifacts. Quit and restart OpenCode before expecting future sessions to use the retained candidate.
- Rollback is source-only: remove the final-history clauses from the exact loaded/normative owners and the SDET oracle together. Existing changes created while the rule was active retain their ordinary task records and should not be silently rewritten.

## External Operations

Not performed: archive, commit, push, merge, install, activation, deployment, release, remote mutation, credential modification, or protected product effect.
