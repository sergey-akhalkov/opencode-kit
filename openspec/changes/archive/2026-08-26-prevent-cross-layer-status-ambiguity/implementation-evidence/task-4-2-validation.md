# Task 4.2 Final Validation

- Candidate source remained `4fef3cbdd638edfb55a6573618517e388bc661388d6d579e6def5a11c9971123`; final status-scope preflight reported zero calls, `ready`, prompt mirror `same`, scenario `64454936f0a923bc11baa5fe94823aaff6ac4833d813fbd05a82d496d0dfd99c`, and unchanged routes.
- `npm test` exited `0` across the project test suite.
- `npm run validate:strict` exited `0`: 31 skills, 20 agents, 718 Markdown files, zero warnings, and two informational permission notices.
- `npm run openspec:validate` passed all 21 specs/changes; `openspec validate prevent-cross-layer-status-ambiguity --strict` also passed.
- `npm run test:focused:consumer-outcome` passed 24 tests; `npm run test:focused:contracts` passed 71 tests.
- `npm run instruction:budget` passed with core startup `11999/12000`; no seed was raised.
- `npm run opencode:sources` reported the active and canonical compaction prompts byte-equal at `0a8503d6ae4fa72ee53cc8102807f1b10e09f9de99927e4eef35f6a8459433c2` and canonical unattended workflow collision status `clear`. Presence-only config/skill collisions remain reported without inferring precedence.
- `npm run proof:runtime-surface-loader -- --candidate-id <candidate-id> --evidence-root <temp>/status-scope-runtime-loader-r1` passed the installed generated-core loader with no missing/extra core skills, hidden parent hits, or permission failures. The retained proof artifact is local and outside the repository.
- A first post-reduction apply-gate readback failed because the new final-validation lane used unsupported kind `validation`; reclassifying that evidence-only lane as `evaluator` restored the declared schema without changing product behavior or claim semantics.
- Final evidence inventory reported eight checked tasks, 40 retained files / 377692 bytes, CSA-001 `supported` at 3/3, and no incomplete, stale, unknown, unindexed, over-limit, overlap, cycle, or finding rows. The final apply operation gate passed every check.
- `git diff --check` exited `0`; Git emitted existing line-ending conversion warnings only.
- Post-change code-quality review found one duplicate status-scope schema walk. The evaluator now reuses the existing exact parser with no new abstraction; focused tests and two current provider-free replay outputs remained green and byte-identical. No other safe current-scope reduction was identified; large schema/test files remain justified cohesive owners.
- No proof-owned model session, fixture, or process remains live. No critical-risk SDET trigger was present.
- External operation state: no commit, push, archive, install, activation, deployment, publication, protected mutation, purchase, or remote action occurred.
- Reload/rollback: new OpenCode sessions load the active kit prompt immediately (`restartBoundary: none` in source diagnostics); rollback uses normal version control to restore reviewed instruction bytes and rematerializes the active kit mirror. Immutable evidence remains retained.
- Known non-critical limitations: the claim excludes other models, variants, languages, vocabularies, long sessions, consumer overrides, heading-only inference, universal prose quality, live-attempt safety equivalence, and actual compaction execution-model attribution from summary-message metadata.
