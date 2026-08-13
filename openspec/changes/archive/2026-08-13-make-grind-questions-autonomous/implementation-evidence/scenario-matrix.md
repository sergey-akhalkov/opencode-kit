# Accepted-Scope Scenario Matrix

## Candidate And Environment

- Product candidate: current worktree after the race-safe official reply/provenance implementation and before fresh SDET test-only mutation.
- Installed entry point: OpenCode `1.18.18`; kit plugin/SDK declaration `1.18.15`; configured arbiter route `xai/grok-4.6/high`.
- Operating envelope: explicitly grind-enabled disposable parentless local roots; official bounded multiple-choice question/reply API; no protected, destructive, remote, file, task, bash, or external effect in the installed question proof.
- Proof runner: current `tools/proofs/session-completion-guard-question.ts`, `tools/proofs/session-completion-guard-autonomous.ts`, and `tools/proofs/session-completion-guard-retry.ts`.

## Matrix

| Scenario | Boundary | Expected | Observed |
|---|---|---|---|
| Autonomous single-select | Fresh installed OpenCode | Exact offered label resumes original tool; synthetic provenance; terminal pass | `Recommended`; one completed question call; downstream marker true; root and child `passed`; one `answered` intervention; zero human replies |
| Owner-required | Offline controller composition | Request remains open with no reply/reject/root continuation | Root and question `owner-required`; zero additional reply/reject/root prompt |
| Multi-question/multi-select | Offline production composition | One row per question and all exact selected labels apply once | One official reply call and one applied reply; question `guard-answered`; no pending refs |
| Custom-only / malformed | Production normalizer | Fail closed before model/reply | Optionless custom-only request rejected; no reply |
| Invalid offered-label matrix | Production verdict parser | Fail closed before side effect | Invented label rejected |
| Human before guard reply | Offline official-reply race | Human wins and guard does not call reply | `human-replied`; zero guard reply calls; zero pending refs |
| Reply event during guard call | Offline official-reply race | Do not claim actor; retain synthetic pending provenance | `resolution-unknown`; one pending ref; restored metadata retains it; no human authority |
| Disable during guard call | Offline controller command/reply race | Abort official reply effect; leave root disabled and provenance fail closed | Root `disabled`; zero applied replies; one pending ref |
| Interrupt during guard call | Offline controller pause/reply race | Abort official reply effect; leave root paused and provenance fail closed | Root `paused`; zero applied replies; one pending ref |
| Stale epoch before guard call | Offline controller epoch race | No official reply and retain pre-recorded fail-closed provenance | Root `stale`; zero reply calls; one pending ref |
| Question not found | Offline SDK error path | Treat as another resolver's terminal win, with no synthetic confirmation | `human-replied`; pending refs cleared |
| Provenance capacity | Offline controller composition | Fail closed before reply at 1,024 refs; never evict | Zero reply calls and exact capacity error |
| Duplicate idle | Offline controller scheduling | Only one settle timer/audit opportunity | Second schedule was suppressed and retained the first timer |
| Structured continuation | Production verdict/continuation builder | Non-question continuation requires `questionAnswers: null` and remains synthetic | Parsed with `null`; continuation part synthetic |
| Compaction/restart restoration | Production `initialRootState` | Confirmed and pending request/call refs survive metadata reconstruction | Confirmed and pending maps restored; pending race ref retained |
| PTY/task waiting | Existing project-native focused oracles | Awaited PTY/task leases suppress completion audit until terminal evidence | Five PTY/task lease/preflight oracles passed before the unrelated stale question fixtures failed |
| Sibling/default-off isolation | Existing project-native focused oracles plus production replay | New roots remain disabled; disabling one root preserves sibling leases | Default-off and sibling lease oracles passed; production replay reports disabled default root |
| Retry and temporary invalid-response recovery | Fresh installed question run plus bounded retry runner | Invalid response/provider-path failure schedules bounded retry and the retained child can recover without evidence amplification | Historical installed lane rejected two invalid answer shapes then passed; current exact-example lane passed first try; `proof:guard-retry -- --mode live` returned `retryHasEvidence=false`, valid correlation, and `allow_stop` |
| Terminal cleanup | Fresh installed OpenCode | Proof emits terminal result, deletes disposable root/children, then server stops | Runner emitted `cleanup=complete`, `rootDeleted=true`; proof server was stopped with Ctrl+C and logged no error |

## Exact Invocations And Results

- `npm run proof:guard-question` -> exit `0`; emitted the complete privacy-safe matrix and projection result.
- `npm run proof:guard-question-runtime -- --server-url http://127.0.0.1:41989` with process timeout `600000` ms -> exit `0`; emitted `assistantMarker=true`, `auditStatuses=["passed"]`, `autonomousRefs=1`, `guardState="passed"`, `humanQuestionReplies=0`, `pendingRefs=0`, `projectedAnswer="Recommended"`, `questionCalls=1`, `questionStatus="completed"`, `selectedAnswer="Recommended"`, `toolOnlyQuestion=["question"]`, then `cleanup="complete"`.
- `npm run proof:guard-retry -- --mode live --server-url http://127.0.0.1:41990` -> exit `0`; emitted hidden correlated `session-completion-arbiter`, `retryChars=510`, `retryHasEvidence=false`, `validCorrelation=true`, `verdict="allow_stop"`.
- `npm run proof:permissions` -> exit `0`; OpenCode `1.18.18`, 25 agents, resolved permission outcome `pass`.
- `npm run test:focused:session-plugin` -> exit `0`, 17 tests.
- `npm run validate:strict` -> exit `0`, 26 skills, 18 agents, 312 Markdown artifacts, zero warnings, two informational top-level-allow notices.
- `openspec validate make-grind-questions-autonomous --strict` -> valid.

## Pre-SDET Test-Only Drift

`npm run test:focused:session-completion-guard` is intentionally preserved as red input to fresh SDET rather than changed by the production author. Twenty existing PTY/task/default-off/disable oracles passed. Seven fixtures are stale against the accepted protocol: five non-question verdict objects omit mandatory `questionAnswers: null`; one oracle calls removed `deliverQuestionCorrection`; the retry-amplification fixture consequently repeats the first schema failure. This is test-only drift, not accepted as qualification evidence, and task 4.1 owns the smallest test synchronization plus independent critical challenge.

## Cleanup And Limits

- Disposable installed roots/children were deleted in each runner's `finally`; both fresh proof servers were stopped after successful runner cleanup.
- Source changes do not hot-reload into the current user chat. Future operator use requires a newly started OpenCode process after installation/activation, which remains outside this local source handoff.
- Reboot durability, daemonization, indefinite provider outage, protected operations, arbitrary custom text, deployment, installation, activation, commit, push, and release remain outside the accepted operating envelope.
