# Implementation Evidence

## Frozen Implementation Brief

- **Profile**: Material. The change alters loaded session-lifecycle, concurrency, permission, and safety policy.
- **Accepted outcome**: A parentless root may remain stopped only after explicit user interruption, deterministic asynchronous waiting, a current evidence-backed completion verdict, or an exact owner-only blocker. Otherwise one bounded synthetic continuation resumes the root.
- **Protected boundaries**: User interruption and human question replies always win. The guard does not authorize deployment, release, installation, activation, credentials, remote/destructive effects, lifecycle stages, or product/security/persisted-data policy changes.
- **Deterministic no-model gate**: Root identity, suspension, compaction/guard ownership, external PTY leases, built-in task/descendant leases, result consumption, settle delay, idle recheck, and unchanged lease/revision correlation must all prove `async-clear` before any arbiter child or model call.
- **Unknown-state behavior**: Unattributed or unreadable awaited PTY, task, child, root, or lease state fails closed as Waiting/Error with privacy-safe diagnostics and zero arbiter/model calls.
- **User-stop priority**: `MessageAbortedError`, supported session interruption, or an unambiguous non-synthetic Russian/English stop instruction cancels audit/retry/continuation intent and suppresses later idle adjudication until a new non-synthetic human revision.
- **Permission decision**: When enabled, the guard config hook sets merged top-level permission to `allow` without a permission model or classifier. Explicit specialist-agent denies remain authoritative.
- **Migration order**: Add context provenance, arbiter, PTY bridge, guard, deterministic behavior, and disposable runtime proof while `session-delivery-reviewer` remains active. Remove old active routing only after current guard proof, then re-prove the migrated candidate.
- **Unchanged non-goals**: No RC/stable/release authority; no remote deployment; no replacement for domain review, SDET, or production authorship; no model inference of process liveness; no generic process supervisor; no arbitrary command-effect classifier; no archived-history rewriting.
- **Candidate Reference method**: Record `git diff --stat`, changed-path inventory, and SHA-256 digests for product-candidate files. Record proof runner/evaluator paths and versions separately so scoped evidence invalidation remains possible.
- **Root RC counter**: `0`. No candidate RC has been frozen for this root change.
- **Disposable runtime-proof environment**: Fresh isolated OpenCode config/data/cache/state directories under `C:/Users/Sergey/AppData/Local/Temp/opencode/add-session-completion-guard/`, with the repository kit source copied or referenced explicitly. Never install or activate the candidate in the owner's continuing OpenCode process during qualification.
- **External operations**: Not performed. Repository commit/push, installation, activation, deployment, release, and publication remain outside this apply operation.

## Compatibility Matrix Baseline

| Surface | Declared | Installed / Active | Candidate Contract |
| --- | --- | --- | --- |
| OpenCode CLI | N/A | `1.18.15` | `1.18.15` disposable runtime |
| `@opencode-ai/plugin` | `1.18.11` in `global/package.json` | `1.18.8` in lockfile and `global/node_modules` | Exact supported v2 release aligned with CLI |
| `@opencode-ai/sdk` | Transitive | `1.18.8` through plugin | Same exact supported release as plugin |
| `opencode-pty` | Config package entry `opencode-pty` | Cache package `0.3.6` | Exact `0.3.6` in the kit global dependency graph |
| PTY source | npm-spec config entry | `C:/Users/Sergey/.cache/opencode/packages/opencode-pty` | Explicit kit-relative bridge, shared manager identity asserted |

The declared/installed plugin mismatch is pre-existing baseline behavior and is an explicit correction target.

## Pre-Mutation Baseline

Captured on 2026-08-09 before production behavior mutation. Exit code is the process result observed by the command runner. Empty stderr is written as `(empty)`.

### Runtime And Dependency Identity

Command: `opencode --version`

Exit code: `0`

Stdout:

```text
1.18.15
```

Stderr: `(empty)`

Command: `npm ls @opencode-ai/plugin @opencode-ai/sdk opencode-pty --all` from repository root

Exit code: `0`

Stdout:

```text
opencode-dev-kit@ D:\sa-gh\opencode-kit
`-- (empty)
```

Stderr: `(empty)`

Command: `npm ls @opencode-ai/plugin @opencode-ai/sdk opencode-pty --all` from `global/`

Exit code: `1`

Stdout:

```text
global@ D:\sa-gh\opencode-kit\global
`-- @opencode-ai/plugin@1.18.8 invalid: "1.18.11" from the root project
  `-- @opencode-ai/sdk@1.18.8
```

Stderr:

```text
npm error code ELSPROBLEMS
npm error invalid: @opencode-ai/plugin@1.18.8 D:\sa-gh\opencode-kit\global\node_modules\@opencode-ai\plugin
```

The npm debug-log path is intentionally omitted because it is machine-local diagnostic metadata and not needed to reproduce the dependency mismatch.

Command: `npm ls opencode-pty --all` from `C:/Users/Sergey/.cache/opencode/packages/opencode-pty`

Exit code: `0`

Stdout:

```text
opencode-pty@ C:\Users\Sergey\.cache\opencode\packages\opencode-pty
`-- opencode-pty@0.3.6
```

Stderr: `(empty)`

Command: `opencode debug info`

Exit code: `0`

Stdout:

```text
opencode version: 1.18.15
os: Windows_NT 10.0.26200 x64
terminal: unknown
plugins:
- file:///C:/Users/Sergey/.config/opencode/plugins/rtk.ts
- opencode-pty
- file:///D:/sa-gh/opencode-kit/global/plugins/notify.ts
- file:///D:/sa-gh/opencode-kit/global/plugin/session-env.ts
```

Stderr: `(empty)`

### Agent And Profile Inventory

Command: `npm run opencode:sources -- --json`

Exit code: `0`

Observed custom agent inventory: `code-quality-reviewer`, `deployment-config-reviewer`, `final-candidate-reviewer`, `implementation-readiness-reviewer`, `implementation-worker`, `instruction-artifact-reviewer`, `legacy-client-compatibility-reviewer`, `legacy-evidence-reviewer`, `openspec-architecture-reviewer`, `performance-reliability-reviewer`, `protocol-api-reviewer`, `qwen-local-worker`, `rust-concurrency-reviewer`, `sdet-quality-engineer`, `session-delivery-reviewer`, `test-coverage-reviewer`, `troubleshooter`, `wire-protocol-reviewer`.

Observed active plugin sources: host-default `C:/Users/Sergey/.config/opencode/plugins/rtk.ts`, cache-resolved `opencode-pty`, custom `global/plugins/notify.ts`, and custom `global/plugin/session-env.ts`. The source command also reported four colliding config locations and explicitly warned that source presence alone does not prove runtime precedence.

Stderr: `(empty)`

Commands and exact stdout:

```text
npm run opencode:profile -- quality-independent --check
OK: model profile=quality-independent source=committed agents=26

npm run opencode:profile -- sol-only --check
OK: model profile=sol-only source=committed agents=26

npm run opencode:profile -- grok-only --check
OK: model profile=grok-only source=committed agents=26
```

Each profile command exited `0` with empty stderr. All three profiles route active `session-delivery-reviewer`; the migration target is `session-completion-arbiter`.

### Validation Baseline

Command: `npm run validate:strict`

Exit code: `0`

Stdout:

```text
> validate:strict
> node tools/validate-library.ts --fail-on-warnings
INFO: OpenCode permission config uses top-level allow; this allows all tools by default: D:\sa-gh\opencode-kit\global\opencode.json
INFO: OpenCode permission config uses top-level allow; this allows all tools by default: D:\sa-gh\opencode-kit\global\opencode.json.template
OK: skills=24 agents=18 markdown=224 warnings=0 infos=2
```

Stderr: `(empty)`

Command: `npm run test:focused:session-plugin`

Exit code: `0`

Stdout:

```text
> test:focused:session-plugin
> node tools/run-focused-test.ts tools/test-session-env-plugin.ts
OK: session env plugin tests=17
```

Stderr: `(empty)`

Command: `npm test`

Exit code: `0`

Stdout:

```text
> test
> node --test --test-reporter=dot --test-concurrency=1 tools/test-library.ts tools/test-model-profile.ts tools/test-library-validation-scripts.ts tools/test-contracts.ts tools/test-code-quality-inventory.ts tools/test-session-env-plugin.ts tools/test-init-project.ts tools/test-install-opencode-global.ts tools/test-openspec-operation-gate.ts tools/test-pre-push-validate.ts || npm run test:diagnostic
..........
```

Stderr: `(empty)`

Command: `openspec validate add-session-completion-guard --strict`

Exit code: `0`

Stdout:

```text
Change 'add-session-completion-guard' is valid
```

Stderr: `(empty)`

## Baseline Worktree

`git status --short --branch` reported the pre-existing modified `.serena/project.yml` and the untracked change directory. `.serena/project.yml` is unrelated owner/tool work and is excluded from this change's write scope.

## Production Proof Ledger

### Context Provenance Projection

- **Candidate surface**: `global/plugin/session-delivery-context/**` and `global/plugin/session-env.ts`.
- **Invocation**: Direct `node --input-type=module -e` disposable SQLite/tool projection using one human prompt, synthetic guard/PTY/task turns, one guard-rejected question, and a secret-shaped assignment.
- **Exit code**: `0`.
- **Observed stdout**:

```json
{"schemaVersion":2,"humanMessages":1,"syntheticMessages":["guard","pty","task"],"requirementSignals":1,"questionReplies":0,"questionInterventions":1,"redacted":true}
```

- **Focused validation**: `npm run test:focused:session-plugin` initially exposed a missing root-parent description phrase and an incorrect warning for legacy databases without a `part` table. Both production defects were corrected without changing tests. The rerun exited `0`: `OK: session env plugin tests=17`.

### Hidden Completion Arbiter

- **Candidate surface**: `global/agents/session-completion-arbiter.md`, committed model profiles, active kit config, agent inventory, and dedicated validator branch.
- **Runtime diagnostic**: `opencode debug agent session-completion-arbiter` showed `mode: subagent`, `hidden: true`, route `xai/grok-4.5/high`, `session_delivery_context` allow, and wildcard-denied mutation/orchestration/question/PTY capabilities. The first diagnostic exposed inherited PTY tools; adding agent-level wildcard deny made `pty_spawn`, `pty_write`, `pty_read`, `pty_list`, and `pty_kill` false.
- **Profile validation**: `quality-independent`, `sol-only`, and `grok-only` checks each exited `0` with `agents=27`.
- **Focused validation**: `npm run validate:strict` exited `0`: `OK: skills=24 agents=19 markdown=233 warnings=0 infos=2`.

### Deterministic Guard Components

- **Dependency identity**: `npm ls @opencode-ai/plugin @opencode-ai/sdk opencode-pty --all` from `global/` exited `0` with plugin/SDK `1.18.15` and deduplicated `opencode-pty 0.3.6` dependencies.
- **Explicit loader proof**: A disposable `opencode debug info --print-logs --log-level INFO` process exited `0` and listed only the kit bridge and guard extension URLs for the candidate plugin pair.
- **Shared-manager component proof**: A Bun process initialized both extension factories, spawned one PTY through the bridge, observed the same running id through `completionGuardRuntimeInfo.manager`, killed it, and observed cleanup. Compact stdout: `{"sharedManager":true,"status":"running","cleaned":true}`. The rejected Node-runner attempt and its Bun-runtime retry condition are recorded in `history.md`.
- **Single-flight/CAS proof**: A disposable controller with a v2-shaped fake boundary received duplicate idle events for one revision. It created one child/prompt. A new human revision arrived before the old structured result; the old epoch became `stale` with zero root continuations. A second idle created one new audit and reached Passed. Stdout: `{"duplicateIdleAudits":1,"staleState":"stale","staleSideEffects":0,"changedRevisionAudits":2,"finalState":"passed","prompts":2}`.
- **PTY/task/control proof**: The deterministic lease registry observed immediate-exit tombstone ordering, terminal notification consumption, terminal non-reopening, unknown unattributed PTY fail-closed behavior, running/background-result waiting, and task-result consumption. Stop detection accepted `Stop now` and rejected negated/discussion forms. Stdout: `{"terminalWaiting":"waiting","terminalClear":"clear","unknown":"unknown","terminals":1,"childRunning":"waiting","childResultPending":"waiting","childClear":"clear","stop":true,"negatedStop":false,"quotedStop":false}`.
- **Retry/continuation proof**: An unknown structured schema retried after bounded backoff in the same retained child; the second valid result injected exactly one synthetic continuation with completion-guard provenance. Stdout: `{"creates":1,"prompts":2,"rootContinuations":1,"sameChild":true,"synthetic":true,"provenance":"completion-guard","guardTurnPending":true}`.
- **Question race proof**: A human reply during a deferred question audit produced zero rejects/continuations. A second autonomous question was guard-rejected and the next idle injected exactly one synthetic correction with `intervention: guard-rejected`. Stdout: `{"humanWon":true,"guardRejected":true,"correctionCount":1,"correctionSynthetic":true,"intervention":"guard-rejected","questionStates":["human-replied","guard-rejected"]}`.
- **Interrupt proof**: `MessageAbortedError` cancelled an in-flight audit; the following idle created no new audit or continuation. Stdout: `{"creates":1,"promptAsync":0,"paused":true,"state":"paused"}`.
- **Strategy proof**: Exact change-name evidence selected OpenSpec `history.md`; ambiguous ownership selected `docs/session-strategy-history`. A repeated strategy continuation preserved prohibited strategies and retry evidence and required the diagnosis-only troubleshooter route. Stdout: `{"requiresTroubleshooter":true,"prohibitsRepeat":true,"requiresEvidence":true,"fallbackJournal":true}`.
- **Permission proof**: The normalized config hook converted prior `ask`/`deny` values for `bash`, `edit`, `webfetch`, `doom_loop`, and `external_directory` to `allow`. The hidden arbiter diagnostic retained wildcard deny with only its read/context capabilities enabled.

### Current Real Root PTY Preflight

- **Environment**: Disposable headless OpenCode `1.18.15` server, isolated `OPENCODE_DATA_DIR`, kit `OPENCODE_CONFIG_DIR`, local repository worktree, one bounded synthetic `openai/gpt-5.6-sol/xhigh` root prompt, and no installation/activation in the continuing owner process.
- **Prompt workload**: Main was instructed to call `pty_spawn` exactly once with an awaited 60-second local Node timer and no other tool.
- **Observed result**: `{"rootRef":"session_4a9afabc8f22","ptyRef":"pty_bb04786c26b8","toolStatus":"completed","guardState":"waiting-async","arbiterChildren":0,"totalChildren":0,"assistantError":null,"cleanup":true}`.
- **Server evidence**: The current post-permission-fix process logged `shared PTY manager observed correlated spawn` with matching privacy-safe PTY/root refs. No `schema rejection` occurred. Deleting the disposable root triggered PTY cleanup; the server was then terminated and its PTY session removed.
- **Lifecycle**: This proves deterministic no-model Waiting on the current candidate. It is not yet the full completion happy path, so the candidate remains `development`.

### Blocked Completion-Arbiter Boundary

- **Current product behavior**: Controller-side session-delivery evidence capture is schema/root-correlated, redacted, bounded to 200,000 characters, reused for one epoch, and supplied with every registered model tool disabled. Node fixtures (`17/17`), direct Bun plugin load, fake-boundary allow/continue/malformed-retry/stale/continuation/evidence-reuse, strict validation, and strict OpenSpec validation are green.
- **Live result**: The required `quality-independent` route `xai/grok-4.5/high` did not call OpenCode's synthetic `StructuredOutput` function. One retained child returned assistant errors across backoff attempts 1 through 6; guard stayed `audit-retrying`, injected no root continuation, and cleanup deleted the disposable root. Complete strategy evidence and prohibited repeats are in `history.md`.
- **Environment correction**: OpenCode 1.18.15 does not consume `OPENCODE_DATA_DIR`; future disposable proofs must isolate `XDG_DATA_HOME`, `XDG_CACHE_HOME`, and `XDG_STATE_HOME` while continuing to use the explicit kit `OPENCODE_CONFIG_DIR`. Prior disposable roots were deleted from the host-default local database; no candidate was installed or activated in the continuing process.
- **Lifecycle**: `Development-Stage: development`. Task 4.1/4.2 cannot complete until the owner selects a different configured route or a different structured-verdict transport.

### Exact-JSON Arbiter And Full Runtime Proof

- **Owner-selected transport**: Retain `xai/grok-4.5/high`; controller captures and root-correlates the redacted session-delivery evidence, disables every registered model tool, and accepts only the entire trimmed assistant text as one JSON object through the existing schema/correlation parser. Fences, prose, trailing text, malformed JSON, unknown version, and correlation mismatch all failed offline with no side effect.
- **Provider preflight**: `provider.list` rejects disconnected/missing route shapes before child prompt. Host inventory reported both required root and arbiter providers/models connected/available without exposing credentials.
- **Completed-root capture**: `{"rootRef":"session_4b833d87094c","arbiterRef":"session_455a1546027d","state":"passed","assistantMessages":1,"exactJson":true,"userFormatPresent":false,"registeredToolCalls":0,"rootMessagesBefore":2,"rootMessagesAfter":2,"noSuccessTurn":true,"cleanup":true}`.
- **Full PTY proof after runtime corrections**: `{"rootRef":"session_5e206a072701","ptyRef":"pty_fee816e93a08","arbiterRef":"session_f94b8bfb0617","waitingAtMs":23528,"waitingChildren":0,"exitAtMs":27664,"notificationSource":"normal","passedAtMs":72467,"state":"passed","arbiterChildren":1,"arbiterAssistantMessages":1,"exactJson":true,"guardContinuations":0,"cleanup":true}`.
- **Continuation/pass proof**: One deliberately incomplete two-step root produced one synthetic continuation, verdict sequence `["continue","allow_stop"]`, one retained child across both epochs, final Passed, and cleanup: `{"rootRef":"session_90b1d3f882a8","arbiterRef":"session_882b3f20f7f6","finalState":"passed","guardContinuations":1,"continuationSynthetic":true,"verdicts":["continue","allow_stop"],"retainedChildren":1,"cleanup":true}`.
- **Interrupt proof**: Aborting a root only after its long-running bash tool was observable produced `paused`, zero audit children, zero continuations, and cleanup: `{"rootRef":"session_05852a9511c1","state":"paused","paused":true,"arbiterChildren":0,"guardContinuations":0,"cleanup":true}`.
- **Failure/restart proof**: Consecutive epochs and a reconstructed RootState reused one parent/root-correlated child; NotFound recreated once; wrong-parent and duplicate children failed closed. Root deletion cancelled audit/retry and root-scoped fallback timers. A no-TUI exception logged once without changing Passed. An unchanged persisted Passed revision launched no duplicate audit.
- **Performance smoke**: Local Bun 1.3.11 deterministic lease preflight, no model/provider calls. `N=1`, 1,000 sweeps: p50 `0.0003ms`, p95 `0.0014ms`, p99 `0.0044ms`, max `0.8894ms`. `N=200`, 100 full sweeps/20,000 root checks: p50 `0.5658ms`, p95 `0.6405ms`, p99 `0.8877ms`, max `0.9384ms`, about `344,771` preflights/s. Preselected criteria p95 <=20ms, max <=50ms, all Waiting, zero model routes: passed.

### Active Reviewer Migration

- **Production migration**: Deleted active `global/agents/session-delivery-reviewer.md`; removed config/profile/catalog/instruction/validator/contract routing; retained archived OpenSpec and feedback attribution. Added README lifecycle, status, diagnostics, restart, permission, troubleshooting, and coherent rollback guidance.
- **Executable topology gate**: Kit config validator now requires exactly one explicit notify, session-env, PTY bridge, and completion guard source and rejects package/cache `opencode-pty`.
- **Current validation**: `validate:strict` reports `skills=24 agents=18 markdown=240 warnings=0`; all committed model-profile checks report `agents=26`; strict OpenSpec validation passes.
- **Scoped invalidation**: The active routing/instruction migration is a product-candidate mutation, so post-migration runtime proof and test-only fixture migration remain required before SDET terminal qualification.

### Post-Migration Candidate Proof

- **No-model diagnostics**: Fresh OpenCode 1.18.15 process reported old reviewer absent; hidden `session-completion-arbiter` on `xai/grok-4.5/high`; six-step no-tool contract with wildcard and explicit specialist denies; normalized main permission allow; exactly one kit PTY bridge and one guard source; no package/cache PTY; XAI route connected/available.
- **PTY lane**: `{"rootRef":"session_0a0c5686b446","ptyRef":"pty_24552fa05993","arbiterRef":"session_b07b441ac449","waiting":"waiting-async","waitingChildren":0,"state":"passed","children":1,"exactJson":true,"continuations":0,"cleanup":true}`.
- **Continuation lane**: `{"rootRef":"session_08a0ad32007d","arbiterRef":"session_5be6147e9142","state":"passed","children":1,"continuations":1,"verdicts":["continue","allow_stop"],"cleanup":true}`.
- **Interrupt lane**: `{"rootRef":"session_3e9482234099","state":"paused","paused":true,"children":0,"continuations":0,"cleanup":true}`.
- **Question lane after correction/evidence fixes**: `{"rootRef":"session_ca69e972cf25","arbiterRef":"session_ff96a6b182bf","state":"passed","children":1,"corrections":1,"questionReplies":0,"questionInterventions":1,"verdicts":["allow_stop","allow_stop"],"cleanup":true}`. Both `continue` and `allow_stop` question verdicts share the offline-proven autonomous reject path; owner-required, user-paused, and human-reply winner paths remain distinct.
- **Stage**: Accepted production scope is complete and the migrated candidate has current representative real-boundary proof. `Development-Stage: MVP`. Current automated tests still reference the retired reviewer and are reserved for fresh SDET test-only migration/critical assessment before validation and RC.

### Critical SDET Finding And Correction

- **Fresh SDET attempt**: Child `ses_0187166f1ffeHr3ZUZuJqNNy8a`, Effective Model `xai/grok-4.5`, returned `Action: critical-risks-reported`. It migrated retired-reviewer fixtures and added 16 focused completion-guard critical oracles.
- **Confirmed critical defect**: `isExplicitHumanStop("стоп" | "пауза" | "остановись")` returned `false` while English stop returned `true`. The cause was JavaScript ASCII-only `\b` surrounding Cyrillic alternatives, allowing explicit Russian interruption to miss the pause path.
- **Correction**: `control.ts` now uses Unicode letter/number-aware boundaries for Russian stop, negation, discussion, and directive context. Direct production probe is green for Russian/English stop and remains false for negated/discussion examples. Focused guard suite: `OK: session completion guard tests=16`.
- **Corrected-candidate Runtime Proof**: Disposable OpenCode 1.18.15 root received no-reply human text `стоп` and produced `{"rootRef":"session_b57ebbcbdb1b","state":"paused","paused":true,"children":0,"continuations":0}` followed by `{"cleanup":true}`. The server exited with code 0. This restores the invalidated interrupt lane and current `Development-Stage: MVP`.

### Terminal SDET And Final Validation

- **Terminal SDET**: Fresh corrected-candidate child `ses_0185f23b3ffe64eYWK7IFSM0YZ`, Effective Model `xai/grok-4.5`, returned `Action: no-critical-risk` with no test changes. This is the first precondition-valid no-confirmed-critical attempt after the confirmed correction, so SDET is permanently closed for this root.
- **Focused checks**: guard `16`, session-env plugin `17`, contracts `56`, model profiles `16`, and validation scripts `3`, all exit `0`.
- **Complete checks**: `npm test` exit `0`; `npm run validate:strict` exit `0` with `skills=24 agents=18 markdown=240 warnings=0 infos=2`; `npm run openspec:validate` exit `0` with `10 passed, 0 failed`; `openspec validate add-session-completion-guard --strict` exit `0`; `git diff --check` exit `0`.
- **Current-source diagnostics**: Fresh OpenCode debug processes reported exactly one kit PTY bridge, completion guard, session-env/context, and notify source; zero cache/package PTY sources; all normalized main permissions `allow`; active old reviewer absent; hidden `xai/grok-4.5/high` arbiter with six steps and all 18 registered tools denied, including question, PTY, and orchestration. Fresh Bun import reported `{"sharedManager":true,"ptyVersion":"0.3.6","list":true,"get":true}`.

### RC1 Local Handoff

- **Candidate Reference**: `add-session-completion-guard/RC1`, the current readable worktree candidate represented by this change's production, test, documentation, and OpenSpec surfaces plus the post-migration proof roots recorded above.
- **Outcome**: Automatic root completion enforcement now blocks audits on active/unknown async work, delegates only clear-idle completion to one retained hidden exact-JSON arbiter, applies correlated verdicts through single-flight/CAS control, preserves user stop and question precedence, and exposes privacy-safe status/recovery evidence.
- **Changed surfaces**: Explicit PTY bridge/guard extensions and pinned dependency; hidden arbiter agent and quality-independent routing; session-delivery context evidence/projection portability; permission/plugin topology config; migration of active instructions, README, profiles, catalogs, validators, installer, contracts, and tests; removal of the active old delivery reviewer.
- **Proof**: Current composed evidence includes deterministic no-model async preflight, full PTY wait/exit/pass, continue/pass with one retained child, user interrupt with zero audit/continuation, autonomous question correction without a human reply, provider/tool failure/restart handling, and corrected Russian `стоп` real-boundary pause.
- **Strategy history**: `history.md` preserves rejected PTY ownership, loader, structured-output, evidence-tool, provider, child-retention, question-verdict, and Russian stop strategies with do-not-repeat and evidence-based retry conditions.
- **Known non-critical limitations**: Stop detection intentionally uses bounded position/context heuristics and an incomplete natural-language negation/discussion vocabulary, so recoverable false pauses remain possible. Pure-module automated tests do not replace the recorded integrated controller/runtime proof. Historical OpenSpec and feedback mentions of the retired reviewer remain attribution only.
- **Rollback**: Stop OpenCode; restore the previous config/template, dependency graph, profiles, validators, agent inventory, and test/contracts as one coherent version-controlled change; reinstall the selected profile; restart. Do not remove only the guard or PTY bridge while leaving mismatched routing or plugin sources.
- **Activation state**: Not installed, activated, committed, pushed, archived, or loaded into the owner's continuing OpenCode process by this qualification. Activation requires the separately authorized install/profile operation and a full OpenCode restart; the running process cannot hot-reload this lifecycle change.
- **Lifecycle**: Accepted scope complete, applicable validation green, terminal SDET recorded, and no known reachable critical/non-deferrable defect. `Development-Stage: stable`. `Stable Candidate: RC1`.

## Per-Root Read-Only Monitor Increment

### Accepted Expansion And Baseline

- **Owner-approved outcome**: One optional read-only minimized PowerShell shell monitor per guarded root/runtime; no fork, no interactive `opencode attach`, no second server, portable default off, machine-local opt-in on, non-activating launch, Passed auto-close after 15 seconds, other terminal states remain visible, and monitor failure cannot affect guard behavior. Windows Terminal was rejected after bounded evidence and the owner selected PowerShell shell.
- **RC history**: `RC1` remains the qualified pre-monitor candidate. This production-behavior expansion invalidates stable status for the current worktree; root RC counter remains `1` and the next eligible candidate is `RC2`. `Development-Stage: development`.
- **Environment baseline**: `opencode 1.18.15`; Node `v24.18.0`; Bun `1.3.11`; Windows Terminal alias `C:\Users\Sergey\AppData\Local\Microsoft\WindowsApps\wt.exe` present. Microsoft Windows Terminal CLI documentation confirms `wt -w new new-tab --title ...` creates a new window and supports application-title suppression.
- **Repository baseline**: focused completion guard `16/16`; full `npm test` exit `0`; strict validation `skills=24 agents=18 markdown=240 warnings=0 infos=2`; strict target OpenSpec validation exit `0`.
- **Product Candidate**: current RC1 production candidate plus the pending monitor launcher/console, options, status projection, config/docs/validator closure. **Proof Runner**: disposable same-server root and real Windows Terminal invocation. **Evaluator**: privacy-safe state/window/process checks and repository validators. **Environment Identity**: versions above plus current kit global source. **Raw Evidence Bundle**: to be appended by tasks 8.2-8.3.
- **Live-Attempt Gate**: clear. No prior monitor live attempt exists; the first real window is a bounded, local, reversible, owner-authorized effect with explicit root/server/window cleanup and no external service effect beyond the already accepted bounded arbiter proof.

### First Desktop Attempt Failure Chain

- **Attempt**: Production launcher invoked for one disposable Waiting root while a Win32 foreground sampler and title-matched window evaluator were active.
- **Preserved raw result**: PowerShell window evaluator failed at `@($rows) | ConvertTo-Json` with `Argument types do not match`; runner emitted only `{"cleanup":true}` before the primary error and a later Node/libuv assertion. Root cleanup succeeded; monitor launch/minimized/focus/close observations are unknown.
- **Offline Replay Coverage**: Corrected no-window replay covered EnumWindows zero/single result normalization, current foreground row correlation, 25ms foreground sampling, minimized/closed terminal verdict derivation, and JSON finalization.
- **Terminal Replay Result**: Green: `emptyShape=true`, `singleShape=true`, `foregroundRowCorrelated=true`, `foregroundSampleStable=true`, synthetic minimized=true, synthetic post-terminal count=0. Exact missing raw observation: actual production-launched monitor HWND minimized/focus transition.
- **Unlock Condition**: Satisfied for one bounded evidence-capture retry using the corrected evaluator; no other live retry is authorized by this result.
- **Live-Attempt Gate**: consumed by the bounded monitor HWND capture.

### Bounded HWND Capture Result

- **Observation**: `launchRequests=1`; foreground sampler saw one unchanged HWND; corrected during/after evaluators both exited `0`; no matching HWND was observed at either point; launcher reported no warning; disposable root cleanup succeeded.
- **Disposition**: Monitor desktop happy path remains red. Startup-style-only launch is prohibited from repetition.
- **Next Strategy**: Add an explicit title-bound HWND handshake in the hidden launcher, apply no-activate minimized Win32 state, restore prior foreground if necessary, and report handshake timeout through a non-zero launcher exit.
- **Offline unlock replay**: New mechanism's no-window timeout path exited exactly `3`; PowerShell syntax/Win32 binding completed without error; raw root remained outside argv; provider keys were absent; strict validation stayed green.
- **Title-bound observation**: One launch request and unchanged foreground, but no window remained at the Waiting observation and no same-server read was proven. Exact cause is unknown; environment loss across the Windows Terminal singleton is plausible but unconfirmed.
- **Next Strategy**: Replace inherited connection environment with one-use random Windows named-pipe IPC; argv carries only the opaque pipe name and the producer closes after one reader or timeout.
- **Offline replay**: One-use pipe payload matched; delivery count one; second reader rejected; unread handoff timed out and rejected; pipe name opaque and root-free. Duplicate launcher observation produced one spawn; root/password absent from argv/outer environment; provider key excluded; strict validation green.
- **Named-pipe desktop attempt**: Handoff timed out, foreground stayed unchanged, no matching HWND remained, and cleanup succeeded. Direct `node ... --handoff` against the same server/root path then delivered once, rendered Waiting/Passed, exited `0`, and leaked no raw root. Fault is localized to PowerShell `Start-Process` command serialization.
- **Direct-launch offline replay**: Hidden watcher emitted `READY` before one direct `wt.exe` spawn; no-window watcher exited exactly `3`; terminal argv contains only privacy-safe title, script path, and opaque pipe; duplicate observation remained one launch; strict validation green.
- **Direct-argv desktop attempt**: One launch request, unchanged foreground, zero HWND, zero handoff delivery, no launcher warning, and root cleanup. Multi-token Windows Terminal child command is prohibited from repetition.
- **Encoded-bootstrap replay**: Exact generated bootstrap delivered the pipe once, rendered Waiting/Passed, exited `0`, emitted no stderr, leaked no raw root, and kept root/plaintext pipe out of terminal argv. All downstream evaluator/cleanup paths are green offline.
- **Encoded alias attempt**: One launch request, zero handoff delivery, zero HWND, unchanged foreground, no launcher warning, cleanup true. The `wt.exe` app-execution alias is prohibited from repetition.
- **Package-executable replay**: Watcher resolved an existing absolute `WindowsTerminal.exe`, emitted a base64 readiness payload with no root data, and timeout syntax exited `3`; launcher replay invoked watcher first then the validated package executable exactly once; downstream paths remain green.
- **Direct-package result**: One launch request, zero handoff delivery, zero HWND, unchanged foreground, no launcher warning, evaluator exits `0`, root cleanup true, server exit `0`. Windows Terminal launch is prohibited from repetition; the cleaned PTY buffer is no longer available for a later read.
- **Working boundary**: Same-server read-only console, one-use pipe, encoded bootstrap, rendering, Passed auto-close, dedupe, privacy, and failure isolation are green when hosted directly. Only Windows Terminal packaged activation is red.
- **Owner decision**: Selected minimized PowerShell shell. Windows Terminal remains prohibited for this increment.
- **PowerShell offline replay**: Hidden watcher first, `READY` handshake, visible shell after readiness, no-window watcher exit `3`, raw root/plaintext pipe absent from argv, direct encoded console Waiting/Passed exit `0`, strict config validation green.
- **Parent-spawn shell result**: One launch request, zero handoff delivery, zero HWND, unchanged foreground, no warning, cleanup true. Parent detached spawn is prohibited from repetition.
- **Nested PowerShell allocator**: Offline outer process creation failed with `spawn EPERM`; no window was attempted. The same environment executes short PowerShell commands, so this command-line mechanism is prohibited.
- **Cmd allocator replay**: Watcher `READY`/timeout exit `3`, cmd echo parse exit `0`, watcher-before-cmd ordering, no raw root/plaintext pipe in argv/env, all downstream paths and strict validation green.
- **Cmd `/s` result**: Zero handoff/HWND, foreground changed, cleanup true; duplicate server start failed with `ServeError` because the prior disposable server owned the port. Removing only `start` made the exact cmd/bootstrap path green.
- **Cmd `/d /c` replay**: Echo parse and direct no-window monitor both exit `0`; handoff delivered; Waiting/Passed rendered; no stderr/raw root; cleanup true; strict validation green.
- **PTY-hosted shell capture**: One launch request, zero handoff/HWND, unchanged foreground, no warning, evaluator exits `0`, cleanup true. No remaining desktop allocator is authorized in this boundary.
- **Configured source**: `node tools/install-opencode-global.ts --check` reports `OPENCODE_CONFIG_DIR=D:\sa-gh\opencode-kit\global`; machine-local monitor opt-in is prepared but the continuing process has not reloaded it.
- **Live-Attempt Gate**: blocked. Next attempt requires owner restart into the actual interactive OpenCode TUI and one manual minimized-window/focus/content/close observation; another PTY-hosted attempt is prohibited.

### Owner-TUI Client Boundary Failure And Offline Correction

- **Owner-TUI attempt**: The current interactive root started one 20-second awaited PowerShell PTY. The PTY exited `0` and the synthetic terminal notification reached the root, but the guard emitted repeated `root identity resolution failed` errors with `session.get failed` and cause `Unable to connect. Is the computer able to access the url?`. The OpenCode process had no TCP listener; no guard metadata, audit child, monitor HWND, Waiting, or Passed state was produced.
- **Root cause**: The plugin discarded OpenCode's supplied client transport and independently constructed a v2 HTTP client from `input.serverUrl`. Disposable `opencode serve` proofs had a reachable listener and masked that a normal TUI does not guarantee one. The external monitor console repeated the same invalid listener assumption.
- **Product correction**: `plugin-client.ts` now adapts the exact supplied legacy plugin transport into the required v2 client; the controller and capability check share it. `audit-monitor-storage.ts` correlates the raw root to one discovered `opencode.db`, opens it read-only, and returns only persisted root/child metadata. The monitor handoff now carries bounded root/database/close state and no server URL, auth, directory, or provider credential.
- **Provided-transport replay**: A legacy client with an unreachable base URL and one custom in-process-style fetch was adapted to v2. One `session.get` used that exact transport at `/session/ses_transport_proof`, returned `waiting-async`, made one transport call, and reported no error.
- **Real-storage read**: The production resolver located the current root in the host `opencode.db`; read-only open returned the current root and no children without mutation.
- **Console/storage replay**: Against a disposable SQLite database with the pinned session columns, the production console rendered `waiting-async`, observed a persisted transition and retained child, rendered `passed`, auto-closed with exit `0`, emitted no stderr, and did not render the raw root.
- **IPC/bootstrap replay**: The one-use named pipe delivered exactly once without timeout. The production launch serialization contained neither raw root nor database path and inherited no `OPENCODE_SERVER_*` key. The direct production console again rendered Waiting then Passed and exited `0`.
- **Focused validation**: Completion guard `16/16`, session-env plugin `17/17`, installer `25/25`, strict target OpenSpec validation, full OpenSpec validation `10/10`, strict repository validation `skills=24 agents=18 markdown=240 warnings=0 infos=2`, and `git diff --check` are green.
- **Known red validation**: Full `npm test` reaches its diagnostic runner and fails four existing library validator fixtures whose synthetic `global/opencode.json.template` lacks the newly required `auditWindow`. No monitor/client/storage production assertion failed. Material test authorship remains reserved for the post-MVP fresh SDET; this red lane must be corrected and rerun before RC2.
- **Architecture**: `controller.ts` remains an attention-band orchestrator and gained no monitor/storage responsibility. The external SDK transport adapter, storage owner, launcher, handoff, and console remain separate cohesive modules. `split-or-justify`: no split required for this correction.
- **Live-Attempt Gate**: blocked for the loaded process. Product source changed after the failed visible attempt, and OpenCode does not hot-reload plugins. **Preserved Raw Bundles**: current TUI log rows, PTY terminal notification, no-listener process observation, title-window empty observation, and the offline transport/storage/IPC outputs above. **Offline Replay Coverage**: complete corrected client acquisition, root/database correlation, read-only snapshot, one-use handoff, launch privacy, Waiting-to-Passed render, close evaluator, focused validation, strict validation, and finalization checks. **Terminal Replay Result**: green except the explicitly deferred four-fixture full-test lane. **Unlock Condition**: owner quits and restarts OpenCode from the same configured kit source, opens a new root, and authorizes the same bounded manual desktop observation; no further PTY-hosted allocator attempt is permitted.

### Post-Restart Owner-TUI Allocator Capture

- **Corrected client/storage boundary**: Restarted TUI run `8b30e247` emitted no root-resolution error for this root, observed the correlated awaited PTY, persisted `waiting-async`, and requested one monitor launch with only the approved bounded environment keys.
- **Desktop observation**: The PTY exited `0`. PowerShell and Node monitor command processes existed, but no title-matched desktop HWND existed and no monitor owned foreground. Persisted root state remained Waiting with zero audit children while main gathered evidence.
- **Narrow root cause**: The separate Win32 watcher was intentionally hidden, but the `cmd /c start /min` allocator was also spawned with `windowsHide: true`. That created the command process without a desktop console window, leaving nothing for the watcher to minimize or observe.
- **Correction**: The watcher remains `windowsHide: true`; only the visible-shell allocator now uses `windowsHide: false`. IPC payload, database read mode, encoded command, per-root dedupe, and guard behavior are unchanged.
- **Offline correction replay**: Fake production launch emitted exactly two processes in order: hidden watcher, then `cmd.exe` visible-shell allocator with `windowsHide: false` and `/min`. The exact encoded bootstrap delivered its one-use handoff once, opened the disposable database read-only, rendered Passed, exited `0`, emitted no stderr, and exposed neither raw root nor database path in launch serialization. The failed-run monitor process terminated; final orphan count was zero.
- **Validation after correction**: Focused completion guard `16/16`, strict repository validation `skills=24 agents=18 markdown=240 warnings=0 infos=2`, target strict OpenSpec validation, all OpenSpec validation `10/10`, and `git diff --check` are green.
- **Live-Attempt Gate**: blocked for this loaded process because product source changed after the capture and plugin code is loaded once. **Preserved Raw Bundles**: run `8b30e247` launch request, PTY exit `0`, persisted Waiting snapshot, live process inventory, empty title/HWND inventory, foreground HWND, and green hidden encoded-bootstrap replay. **Offline Replay Coverage**: exact bootstrap/handoff/storage/Passed close, fake launch option assertion, privacy inventory, focused guard checks, strict OpenSpec/repository validation, and orphan-process absence are green. **Terminal Replay Result**: green; the exact unavailable observation is the `windowsHide: false` allocator's title-matched desktop HWND. **Unlock Condition**: owner restart, then one bounded actual-TUI HWND evidence capture; do not retry the current process.

### Default-Off Per-Root Grind Control

- **Accepted behavior**: The plugin remains loaded, but new roots default to ordinary unguarded chat. `/enable-grind` and `/disable-grind` are persisted, idempotent, current-root-only controls. Disabled suppresses completion/question audits, continuation, PTY fallback, guard lease tracking, monitor launch, and retry; it does not stop user work or affect sibling roots.
- **OpenCode source evidence**: OpenCode 1.18.15 loads config commands before calling `command.execute.before`, then submits the hook-mutated parts through the normal prompt path. The plugin SDK exposes command name/session/arguments and mutable parts. The config hook can therefore register both commands without an unsupported top-level field and correlate control to the exact root.
- **Production component replay**: Bun loaded the actual controller and PTY dependency graph. A disabled root and disabled sibling produced zero status/model calls on idle. Enable persisted `true`, replaced untrusted command parts with one bounded synthetic control part, and suppressed its own idle. The next ordinary human turn reached deterministic preflight. Disable aborted an active guard epoch, cleared retry state, persisted `false`, and subsequent root/sibling idles produced no status/model call. Output: `{"commands":["disable-grind","enable-grind"],"defaultDisabled":true,"enablePersisted":true,"controlSynthetic":true,"controlSelfAuditSuppressed":true,"nextHumanReachedPreflight":true,"disablePersisted":true,"disableAborted":true,"disableClearedEpoch":true,"disabledIdleSuppressed":true,"siblingDisabled":true,"modelCalls":0}`.
- **Real CLI command proof**: Fresh root `session_197a19a12b53` returned `DEFAULT_OFF_OK` with no guard metadata, child, or monitor. `/enable-grind` returned `Grind mode enabled.`, persisted `grindEnabled: true`, state `running`, and zero children. `/disable-grind` returned `Grind mode disabled.` and the next ordinary turn returned `DISABLED_AGAIN_OK`; final state was disabled with zero children and zero leftover process.
- **Persistent-server Runtime Proof**: Disposable OpenCode server run `ada155ea` loaded the current kit source with audit window disabled only in that server's startup config; the working config was immediately restored to machine-local `true`. Command inventory contained both controls. Root `session_ed4a4998b885` followed `default off (0 children) -> enable confirmation (0 children) -> ordinary enabled turn -> passed (1 retained child, child status passed) -> disable -> ordinary disabled idle (same 1 retained child, no new child)`. The root and child were deleted after capture; server exited after Ctrl+C with no monitor/server process left.
- **Diagnostics**: The direct Node controller runner failed before candidate execution with `ERR_UNSUPPORTED_NODE_MODULES_TYPE_STRIPPING` in `bun-pty`; rerunning through the production Bun runtime passed. LSP reports no warning/error in `controller.ts`, `grind-control.ts`, `types.ts`, or `status.ts`; `runtime-support.ts` retains the environment-level unresolved `node:crypto` type diagnostic unrelated to this change. Server logs show one hidden `session-completion-arbiter` child on `xai/grok-4.5/high`, terminal Passed metadata, disable command, and successful root/child cleanup.
- **Runtime stage**: The opt-in control slice reached MVP at the real persistent OpenCode boundary. The broader monitor increment remains `development` because production changed after the owner's popup observation and the complete minimized/focus/Waiting/Passed/close checklist is still pending after restart.

### Grind Control Critical SDET Correction

- **Fresh SDET**: Child `ses_017aa8e3affej7ES2c0rozg5O5`, Effective Model `xai/grok-4.5`, returned `Action: critical-risks-reported` and edited only `tools/test-session-completion-guard.ts`.
- **Confirmed defect**: An in-flight PTY fallback could retain its pre-disable lease snapshot across `await resolveRoot`, then inject `session.promptAsync` after `/disable-grind` cleared leases and persisted disabled. Main reproduced focused exit `1`, 20 pass/1 fail, `promptAsync calls=1`.
- **Production correction**: `pty-fallback.ts` now performs a post-await CAS-style check immediately before injection: root exists, grind remains enabled, root is unpaused, current lease is the same object, and notification remains unconsumed/unsent. Cleared or replaced leases are stale and side-effect free.
- **Offline replay**: `npm run test:focused:session-completion-guard` is green `21/21`, including the exact disable race and supporting default-off, exact-command, sibling-isolation, and disabled-monitor oracles.
- **Live retry gate**: one current-candidate persistent-server toggle proof is unlocked. Causal change is the fallback post-await revalidation; preserved bundle is run `ada155ea` / root `session_ed4a4998b885`; terminal offline replay is green through all 21 focused cases. Another model-backed attempt is prohibited until this exact proof either completes or yields a new terminal failure bundle.

### Corrected-Candidate Continuation Race

- **Fresh corrected-candidate SDET**: Child `ses_017a11e9affeeYjisWSSvQWbRO`, Effective Model `xai/grok-4.5`, returned `Action: critical-risks-reported` with no test edit. It identified a controller `continue` race not importable in the Node-focused runner.
- **Independent reproduction**: Main ran the actual controller under Bun and injected `/disable-grind` during the `status.set` await after final inspection. Before correction: `promptAsyncCalls=1`, `grindEnabled=false`, local state returned to `running`, active audit null.
- **Production correction**: One pure `isCurrentAudit` predicate now gates audit work before and after awaited inspection/metadata/status/SDK boundaries. Root continuation, owner/cycle handoff, and question reject calls carry the audit abort signal; late completions cannot rewrite disabled local state or schedule another guard effect.
- **Offline replay**: Same Bun interleaving now yields `promptAsyncCalls=0`, `grindEnabled=false`, `state=disabled`, `activeAudit=null`. Focused suite remains `21/21`; LSP diagnostics are empty for `controller.ts` and `pty-fallback.ts`.
- **Live retry gate**: current candidate may run one persistent-server toggle proof. Preserved prior bundles: `ada155ea/session_ed4a4998b885` and `56365166/session_159f910b512e`. Offline replay coverage: exact PTY fallback race, exact continuation race, all 21 focused cases, and changed-file diagnostics. Terminal replay result is green.
- **Current Runtime Proof restored**: Disposable server run `eb0f4300`, root `session_d61dbdb68c23`, loaded the epoch-safe candidate with monitor disabled only in that server's startup config; working config was restored immediately. Observed `default-off (0 children) -> enable confirmation (0) -> enabled Passed (1 child/status passed) -> disable -> disabled idle (same 1 child)`. Root/child cleanup completed and server exited; one unrelated `models.dev` timeout did not affect the proof.

### Corrected-Candidate Arbiter Call Race

- **Third fresh SDET**: Child `ses_017970af2ffebRBN5GeDimFdmH`, Effective Model `xai/grok-4.5`, returned `Action: critical-risks-reported` and added one Bun-backed controller oracle to `tools/test-session-completion-guard.ts`.
- **Independent reproduction**: Main reran the focused suite: exit `1`, 21 pass/1 fail; disabled root still reached arbiter `session.prompt` with `promptCalls=1` after disable during `runAudit` status persistence.
- **Production correction**: `runAudit` captures the original abort signal before awaits, requires the current enabled epoch after child resolution and status persistence, uses the captured signal for the arbiter call, and rejects late results. `retryAudit` revalidates after every log/status/metadata await before creating its timer.
- **Offline replay**: Focused suite is green `22/22`, including the Bun-backed `runAudit` race. Controller LSP diagnostics are empty.
- **Live retry gate**: one current-candidate persistent-server toggle proof is unlocked. Preserved bundles: `ada155ea`, `56365166`, and `eb0f4300`; terminal offline coverage includes PTY fallback, continuation, and arbiter-call disable races plus all 22 focused cases.
- **Current Runtime Proof restored**: Disposable server run `d7a249c0`, root `session_e83270e2682c`, observed `default-off (0 children) -> enable confirmation (0) -> enabled Passed (1 child/status passed) -> disable -> disabled idle (same 1 child)`. Both command inventory entries were present; root/child cleanup and server shutdown completed with no guard error.

### Corrected-Candidate Question Correction Race

- **Fourth fresh SDET**: Child `ses_0178d8717ffeKlF4oCNEZLvX3M`, Effective Model `xai/grok-4.5`, returned `Action: critical-risks-reported` and added one Bun-backed question-correction oracle to `tools/test-session-completion-guard.ts`.
- **Independent reproduction**: Focused suite exit `1`, 22 pass/1 fail. Disable during in-flight correction yielded `state=running`, `promptAsyncCalls=1`, and no SDK abort signal.
- **Production correction**: Root state now owns `questionCorrectionAbort`. Disable, a new human turn, pause, root deletion, and plugin disposal abort and clear it. Correction `promptAsync` receives the signal; only that abort is swallowed; a late response cannot set `guardTurnPending` or `running` after disable.
- **Offline replay**: Focused suite green `23/23`; controller/types LSP diagnostics empty.
- **Live retry gate**: one current-candidate persistent-server toggle proof is unlocked after complete terminal replay of all four confirmed disable-race classes.
- **Current Runtime Proof restored**: Disposable server run `8321232a`, root `session_ab849ca96be3`, observed `default-off (0 children) -> enable confirmation (0) -> enabled Passed (1 child/status passed) -> disable -> disabled idle (same 1 child)`. Root/child cleanup and server shutdown completed; one unrelated `models.dev` timeout did not affect the proof.

### Corrected-Candidate Status Persistence Race

- **Fifth fresh SDET**: Child `ses_01782d4deffeJDISQlWPE43dbE`, Effective Model `xai/grok-4.5`, returned `Action: critical-risks-reported` and added one focused status-persistence oracle.
- **Independent reproduction**: Focused exit `1`, 23 pass/1 fail. An older in-flight status write completed after local disable with persisted `grindEnabled=true`, `state=auditing`, which would explicitly re-enable grind on restart.
- **Production correction**: `GuardStatusReporter` serializes writes per root. Each write compares its completed snapshot with current root state and writes again until converged, so stale enabled metadata cannot be final and a queued disable remains last.
- **Offline replay**: Focused suite green `24/24`; status/controller LSP diagnostics empty.
- **Live retry gate**: one current-candidate persistent-server toggle proof is unlocked after terminal replay of five confirmed disable/default-off race classes.
- **Current Runtime Proof restored**: Disposable server run `e27b315f`, root `session_f3a627aa56a4`, observed `default-off (0 children) -> enable confirmation (0) -> enabled Passed (1 child/status passed) -> disable -> disabled idle (same 1 child)`. Root/child cleanup and shutdown completed; unrelated `models.dev` timeout did not affect the proof.

### Corrected-Candidate Monitor Launch Race

- **Sixth fresh SDET**: Child `ses_017782886ffeIa884xTLklYTAd`, Effective Model `xai/grok-4.5`, returned `Action: critical-risks-reported` and added one deterministic monitor-handoff oracle.
- **Independent reproduction**: Focused exit `1`, 24 pass/1 fail; disable during `openHandoff` still produced one hidden PowerShell spawn.
- **Production correction**: Monitor observe requires enabled mode at entry and after handoff. A cancelled launch closes handoff and releases launch ownership before any process. The READY callback rechecks mode, kills the hidden watcher, and suppresses visible shell spawn after later disable.
- **Offline replay**: Focused suite green `25/25`. Monitor file retains environment-level Node type diagnostics already present before this edit; no changed-line diagnostic was introduced.
- **Scoped evidence**: Command/audit Runtime Proof `e27b315f/session_f3a627aa56a4` is unaffected because that server loaded `auditWindow:false`. Re-running the same model-backed proof would not execute the changed monitor lane and is prohibited as non-advancing repetition. The complete desktop monitor lane remains pending owner restart and idle observation.

### Terminal Critical SDET

- **Seventh fresh SDET**: Child `ses_0176df7c6ffetcjvtR581ssWn6`, Effective Model `xai/grok-4.5`, returned terminal `Action: no-critical-risk`; no test or production edit.
- **Independent probes**: disable during `handleSettledIdle` yielded zero arbiter prompts/child creates and final disabled mode; disabling root A while A+B PTY fallbacks were scheduled yielded no A injection, one B injection, and retained sibling ownership.
- **Runner note**: Child observed 24/25 with Windows `EBUSY` deleting a monitor oracle temp directory after assertions. Main's immediately preceding same-candidate focused run completed green `25/25`; the child classified this as harness cleanup only, not a product failure.
- **Terminal reason**: first precondition-valid corrected-candidate attempt with no newly confirmed critical risk. Critical SDET is permanently stopped for this root change unless the owner starts a new outcome.

### Post-SDET Validation And Fresh Config

- **Fresh-process config diagnostic**: `opencode debug config` exited `0` and reported exactly the intended notify, session-env, kit PTY bridge, and completion-guard sources; both grind commands were registered; guard options resolved to the hidden arbiter and machine-local read-only per-root PowerShell monitor with `closePassedAfterMs: 15000` and local opt-in enabled. Only privacy-safe booleans/options were emitted by the evaluator.
- **Green validation**: focused guard `25/25`; `npm run validate:strict` (`warnings=0`, `infos=2`); `npm run openspec:validate` (`10/10`); target OpenSpec strict; `git diff --check`; contracts `56`; model profile `16`; library validation scripts `3`; code-quality inventory `4`; session-env `17`; init `3`; installer `25`; OpenSpec operation gate `11`; pre-push `8`.
- **Remaining red gate**: full `npm test` fails only four existing synthetic config fixtures in `tools/test-library/validator-2.ts` and `tools/test-library/portable-workflow-tools.ts`. Those fixtures now declare the completion-guard tuple but omit the validator-required `auditWindow` object. No product-focused assertion is red.
- **Authorship blocker**: the deterministic correction is fixture synchronization. After terminal `no-critical-risk`, another SDET is prohibited, while main is prohibited from modifying Material-path automated test artifacts. Weakening production validation would violate the accepted portable monitor contract. Recorded process feedback at `docs/feedbacks/main-agent.md` (`FB-2026-08-10-terminal-sdet-fixture-deadlock`). Task 9.4 and RC2 remain incomplete.
- **Owner-TUI desktop proof**: After restart, the owner enabled grind in a new root. Main started exactly one awaited 15-second PowerShell PTY (`pty_4a4ff0d0`), issued no same-root probe after launch/exit, and received exit `0` without timeout. In response to the explicit five-item checklist, the owner reported `все хорошо`, confirming minimized start, foreground focus retained by OpenCode, Waiting visible, Passed visible after PTY exit, and automatic close. The previously blocked monitor real-boundary lane is green.
- **Current lifecycle**: Monitor MVP and accepted monitor scope are complete; terminal critical SDET remains `no-critical-risk`. RC2/stable remain blocked only by the four-fixture full-test lane above. `Development-Stage: MVP`.

### Current-Candidate Live Continuation Proof

- **Question closed**: The earlier live continuation proof predated the final controller disable-race corrections. A new bounded disposable OpenCode 1.18.15 server run `0cf1dc95` therefore exercised the exact current candidate with the monitor disabled only in that server's startup snapshot; machine-local config was immediately restored to enabled.
- **Workload**: Root `session_51dff74be9c0` was enabled, instructed to complete stage one and leave stage two explicitly pending until an automated guard continuation, then allowed to idle.
- **Observed result**: final root state `passed`; assistant produced both `STAGE_ONE_RECORDED` and `STAGE_TWO_COMPLETED`; retained child count `1`; arbiter verdict sequence `continue -> allow_stop`; all synthetic guard parts had `provenance=completion-guard`. The evaluator counted two such parts because the required `/enable-grind` confirmation is also synthetic guard provenance; source metadata distinguishes that control part by `action=enable`, leaving exactly one audit continuation identified by `auditID`.
- **Cleanup**: root and retained child were deleted, server shut down, and no monitor was launched. One unrelated `models.dev` timeout did not affect provider/model execution or verdicts.
- **Disposition**: The current candidate has real-boundary proof that an incomplete root receives a synthetic continuation, resumes automatically, and is audited again to Passed.

### Bounded Same-Epoch Retry Correction

- **Incident bundle**: The reported retained child persisted nine identical 181,969-character audit inputs. Attempts 1-8 repeated `An owner_required verdict requires ownerBoundary`; attempt 9 exceeded the configured provider limit with 510,529 requested tokens against 500,000. Session totals included 455,893 input and 1,670,528 cache-read tokens.
- **Production correction**: The first audit attempt still embeds the one captured `completionEvidence` snapshot. Later same-epoch attempts send a bounded correlated `completion_audit_retry` containing the sanitized prior validation/provider error and no evidence copy. Same child, model, exponential backoff, cancellation, stale-result, and fail-closed parsing remain unchanged.
- **Controller Runtime Proof**: Actual production-controller replay drove one invalid `owner_required`/null response and one valid `allow_stop` response to final `passed`: `firstChars=181924`, `retryChars=548`, `retryHasEvidence=false`, `retryHasFeedback=true`, `sameChild=true`.
- **Real model boundary**: The inventoried project runner first proved `session-completion-arbiter`, hidden route, `xai/grok-4.5/high`, correct parent, and zero model calls. Its authorized live SDK run exited `0` with `firstChars=1248`, `retryChars=510`, `retryHasEvidence=false`, valid correlation, and `verdict=allow_stop`; cleanup left zero proof sessions.
- **Reusable proof tooling**: `tools/proofs/session-completion-guard-retry.ts` owns preflight/live orchestration; `tools/proofs/lib/opencode-proof-client.ts` owns reusable route resolution, disabled-tool mapping, routed session creation, SDK error preservation, and deterministic cleanup; `tools/proofs/README.md` inventories invocation, effects, evidence, cleanup, and limits.
- **Critical SDET**: Fresh test-only child `ses_014ed6bfdffedxvFBtxjxs76g7`, Effective Model `xai/grok-4.5`, added the controller-level regression oracle and returned `Action: no-critical-risk`. Focused guard suite is green `26/26`.
- **Architecture / split-or-justify**: Deterministic inventory reports `controller.ts` (885 lines) and the cohesive focused guard suite (1,549 lines) as split candidates. This correction adds no controller responsibility: request construction is owned by `arbiter-evidence.ts`, while the controller retains its existing audit state-machine orchestration. The SDET oracle remains in the one guard integration suite because it uniquely drives production controller, retained child, no-root-continuation, and terminal Passed behavior. Fresh read-only reduction review found no qualifying deletion/extraction; splitting either path now would add coupling or duplicate fixtures without reducing concepts.
- **Validation**: `validate:strict` is green (`warnings=0`, `infos=2`), OpenSpec validation is green `10/10`, and `git diff --check` is green. Full `npm test` remains red only for the same four pre-existing validator fixtures that omit the already-required `auditWindow` object; the grind-focused suite is green.
- **Lifecycle**: Accepted grind retry scope is complete with local terminal and configured-provider proof. Repository-wide RC remains gated by the unrelated four-fixture validation lane. `Development-Stage: MVP`.

### Structured Owner-Question Verdict Correction

- **Incident bundle**: In root `ses_014c91f01ffenx69e3cFXmp3Z9`, an owner-only interactive question remained open while retained child `ses_014a2ce17ffeU77uvXtoXttc84` produced three correlated `owner_required` responses. Each response carried `ownerBoundary={decision:string,reason:string,evidenceRefs:string[]}`. The prior parser required a string, logged the boundary as missing, and scheduled 2,000/4,000 ms retries; child totals reached 206,915 input and 228,480 cache-read tokens.
- **Product correction**: `OwnerBoundaryVerdict` now owns the exact configured-model object shape. Parser bounds each field, requires the object for `owner_required`, and forbids non-null boundaries on every autonomous/pause verdict. Hidden-agent instructions, design, and normative scenarios specify the same wire contract.
- **Runtime Proof**: Project-native `tools/proofs/session-completion-guard-question.ts` replays the observed shape through the production parser and controller question path. Exit `0`: `finalState=owner-required`, `questionState=owner-required`, `questionRejectCalls=0`, `rootPromptCalls=0`. No provider/server/credential/persistent effect occurs.
- **Real-boundary evidence**: The failed live root already supplies the configured hidden-agent generation lane: three real outputs independently converged on the candidate's exact accepted object keys/types. No repeated live model call was needed or permitted after the preserved replay became terminal green.
- **Critical SDET**: Fresh test-only child `ses_0149abe3cffeAX6Rx2ICcfSfoA`, Effective Model `xai/grok-4.5`, added one protocol oracle covering canonical object and text paths, legacy string rejection, empty-field rejection, and non-owner boundary rejection; returned `Action: no-critical-risk`.
- **Validation**: Focused guard tests `27/27`, strict validation `warnings=0`, OpenSpec `10/10`, proof runner and changed production LSP diagnostics empty, and `git diff --check` green.
- **Lifecycle**: Accepted owner-question retry defect is corrected and proven. Repository-wide RC remains gated only by the same unrelated four validator fixtures documented above. `Development-Stage: MVP`.
