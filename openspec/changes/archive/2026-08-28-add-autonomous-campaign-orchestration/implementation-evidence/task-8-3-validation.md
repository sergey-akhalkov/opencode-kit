# Task 8.3 Final Validation

- Candidate: `task-7-1-installed-operator-r1`
- Environment: `node-24.18.1-windows-task-7-1-r1`
- Date: `2026-08-28`
- Result: `complete`

## Command Matrix

| Boundary | Invocation | Result |
| --- | --- | --- |
| Apply gate | `node global/bin/openspec-operation-gate.ts --root . --operation apply --change add-autonomous-campaign-orchestration` | exit 0, `passed`, claim `supported` 20/20 |
| Selected OpenSpec | `openspec validate add-autonomous-campaign-orchestration --strict` | exit 0, valid |
| All OpenSpec | `openspec validate --all --strict` | exit 0, 28 passed, 0 failed |
| Campaign | `npm run test:focused:work-campaign` | exit 0; contract/controller green, semantic executor 6/6, playbook 13/13, supervisor 3/3 |
| Windows | `npm run test:focused:work-campaign-windows` | exit 0, 8/8 |
| Library/doctor/evidence | `npm run test:focused:library` | exit 0, 180 tests |
| OpenSpec gate | `npm run test:focused:openspec-gate` | exit 0, 23 tests |
| Evidence inventory | `npm run test:focused:openspec-change-inventory` | exit 0, 13 tests |
| Workstation | `npm run test:focused:workstation-config`; `npm run test:focused:workstation-restart` | exit 0, 7 and 6 tests |
| Mission certificate/guard | `npm run test:focused:session-completion-guard` | exit 0, 45 tests |
| Full test | `npm test` | exit 0 |
| Strict library | `npm run validate:strict` | exit 0; 33 skills, 21 agents, 935 Markdown files, 0 warnings |
| Runtime sources | `npm run opencode:sources` with the configured kit source | exit 0; canonical workflow collision clear, managed prompt current |
| Readiness | `npm run doctor -- --project .` | exit 0; qualification pass |
| Instruction inventory | `npm run instruction:inventory -- --format markdown` | exit 0; context quality passed, 0 safe fixes/errors/review-only rows |
| Code quality | `npm run code-quality:inventory -- --root . --format markdown --attention-lines 400 --split-lines 800` | exit 0; split-candidate navigation signal inspected |
| Worktree | `git diff --check` | exit 0; line-ending notices only |

Two final provider-free `work-campaign.ts --mode replay` invocations read `task-8-2-population-r2` into separate proof-owned temporary roots. Both returned `status=complete` and CLI `liveCalls=0`; their evaluation SHA-256 values were identical: `33080fcbe5c4fe03b3464a862878d5e3905d7ca3d8a793e1f4abb79f449c62ce`. The temporary roots were removed and read back absent. The evaluation's retained `liveCalls=162` field mirrors captured process-start accounting; replay itself started no process and made no provider, host, source, or remote call.

## Disposition

Self-host doctor warnings are expected: this checkout deliberately has no consumer campaign definition/adapter, so unattended and campaign selection remain blocked while qualification passes; focused disposable campaign-readiness tests are green. Runtime-source inventory reports additive config locations but canonical workflow collision status is clear.

Code-quality inventory line counts are navigation signals, not defects. The changed P0 mapping remains cohesive in the existing population-row owner; extracting it or merging installed/operator/mission owners would add coupling. Read-only reduction review `ses_fb707a799ffeyU0p71vW7JIi8f` (`xai/grok-4.6`) found only a two-line unused local helper left by the P0 remap. Main leaves that non-behavioral cleanup parked because deleting it would invalidate the sealed runner identity and force another evidence population for no accepted-outcome gain. Code Health Delta: neutral. Split-or-justify: justified.

No commit, push, archive, release, deployment, consumer campaign, permanent supervisor activation, credential change, reboot, or remote mutation occurred. The installed supervisor remains rolled back, historical evidence remains immutable, and unrelated active-change worktree files remain untouched.

One ad hoc ownership-summary filter exited `1` because it assumed a nonexistent aggregate `changeIds` property. The corrected read-only query used the actual `leftChangeId`/`rightChangeId` fields and reported mutation enabled, ownership present with no issues, 34 declared overlaps with zero unresolved, and zero cycles; no product or required validation command failed.
