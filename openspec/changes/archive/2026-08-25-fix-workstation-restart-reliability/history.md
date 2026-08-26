# Strategy History

## 2026-08-19 - Treat the screenshot as tray-only UX

- **Objective:** Explain the generic failure dialog and the need for several Restart clicks.
- **Approach:** Change only the tray helper: balloon tip, debounce, and keep `taskkill /T`.
- **Evidence:** `controller-errors.log` last `restart` rows are `taskkill.exe exited 128` and `255` from `stopManagedServer()`; follow-on `start` fails with `Managed task is 'Ready', not Running` or supervisor identity drift. The screenshot dialog text is emitted by `invoke.vbs`, not `tray.ps1`.
- **Outcome:** Rejected as the sole fix. Tray signaling is necessary but not sufficient.
- **Reason:** The controller already aborts replacement when unmatched descendants return already-gone or access-denied under `/T`.
- **Do-not-repeat condition:** Do not ship a tray-only balloon/debounce change while `stopManagedServer()` still fails the operator Restart on `taskkill /T`.
- **Evidence-based retry condition:** New evidence shows Restart succeeds through the installed controller and only the lamp/dialog is wrong.

## 2026-08-19 - Ignore every non-zero taskkill /T exit

- **Objective:** Stop treating already-gone descendants as Restart failure.
- **Approach:** Keep `/T /F` on the supervisor and treat any non-zero `taskkill` as success.
- **Evidence:** The same log mixes exit 128 (process already gone) with exit 255 (access denied) across many unmatched PIDs. `run()` has no liveness check.
- **Outcome:** Rejected.
- **Reason:** Access denied on a still-live validated supervisor or listener would look like a successful stop.
- **Do-not-repeat condition:** Do not ignore `taskkill` exit codes without proving the validated PIDs and port `4096` are gone.
- **Evidence-based retry condition:** A terminator API reports identity-scoped success without walking unmatched descendants, and post-kill liveness is still checked.

## 2026-08-19 - Targeted validated-identity kill

- **Objective:** Make one tray or Desktop Restart replace the managed server or report a real ownership failure.
- **Approach:** Kill only validated supervisor, server-root, and listener PIDs; use `processAlive` as the success oracle; allow a matching `starting` stop; make tray failure stay red with a secret-free balloon.
- **Evidence:** Source `stopManagedServer()` at `tools/windows/opencode-workstation.ts` issues `taskkill /T` after `validateManagedRunningState()`. Live listener is a second `opencode.exe` distinct from server-root, so explicit listener kill remains required.
- **Outcome:** Selected for this change. Not implemented in this propose session.
- **Reason:** Matches the existing fail-closed identity set and the live 128/255 failure mode.
- **Do-not-repeat condition:** Do not reintroduce `/T` over unmatched descendants to “be safer” without a new orphan-listener proof.
- **Evidence-based retry condition:** Runtime proof shows a validated identity remaining alive or `4096` still owned after targeted kill.

## 2026-08-19 - Stop from the attached session

- **Objective:** Stop the managed server so `install` can repair ProgramData.
- **Approach:** Run repository `stop` inside the OpenCode session attached to that same server.
- **Evidence:** The apply turn was interrupted; the shared listener and this session went down. Server later returned with new PIDs (`11956`/`11844`/`25172`) and the old installed candidate `2035F307…`.
- **Outcome:** Failed. Do not use this path again.
- **Reason:** This session is a client of the managed `127.0.0.1:4096` server. Stop/Restart from inside it tears down the conversation before repair/proof can finish.
- **Do-not-repeat condition:** Do not invoke workstation `stop`, `restart`, or install-repair from an OpenCode session attached to the managed server.
- **Evidence-based retry condition:** A detached process that does not depend on the attached session completes stop/repair/start/Restart and writes evidence, then the session is resumed against the restored server.

## 2026-08-19 - Listener-first targeted kill

- **Objective:** Detached stop/repair/start/tray Restart without `/T`.
- **Approach:** Kill recorded listener, then server-root, then supervisor. Treat any leftover `4096` owner as fail-closed.
- **Evidence:** `task-2-2-raw.json`: `stop` exit 1, `remaining processes ''`, `listeners '1'`, `task 'Ready'`. Repair did not run. Catch `start` could not bind. Operator had to press tray Restart. Installed candidate stayed `2035F307…`.
- **Outcome:** Failed. Server stayed down until manual tray Restart.
- **Reason:** Killing the listener first let `opencode serve` open a new listener; killing server-root without `/T` orphaned that child on `4096`.
- **Do-not-repeat condition:** Do not kill the recorded listener before server-root, and do not leave a same-tree leftover listener uncollected.
- **Evidence-based retry condition:** New stop kills server-root first, then listener, then supervisor, and terminates only leftover listeners whose parent is that server-root/supervisor. A new detached bundle must show stop exit 0, empty listeners, then install/start/tray Restart.

## 2026-08-19 - Detached repair then tray Restart with restoreStart

- **Objective:** Repair ProgramData and prove one tray Restart.
- **Approach:** Detached stop/install/start/tray, then `tray-command.json` restart, and `start` again in `finally` if not healthy.
- **Evidence:** `task-2-2b-raw.json`: stop/install/start exit 0, candidate `CEBAABE32…`. Restart observe crashed (`Unexpected end of JSON input`). `finally` `start` hit `state is 'starting'`. `controller-errors.log`: `OpenCode server exited 1`. Operator saw `invoke.vbs` dialog; lamp blinked then stayed red; manual tray Restart recovered.
- **Outcome:** Repair landed. Tray Restart proof failed. Session/server dropped again.
- **Reason:** `invoke.vbs` pops and keeps the serve task `Running` on any serve exit, so `IgnoreNew` blocks replacement. Concurrent `start` during in-flight Restart races the new serve.
- **Do-not-repeat condition:** Do not run a second controller `start`/`restoreStart` while Restart is in flight. Do not treat a serve-task popup as a tray-only UX bug.
- **Evidence-based retry condition:** Serve invoker no longer pops; stop ends the serve `wscript`; a restart-only detached proof (no overlapping start) shows new PIDs, green lamp, and no new serve/restart error.

## 2026-08-24 - Detached restart-only after current source repair

- **Objective:** Repair the stale ProgramData controller/tray from repository source and prove one tray Restart without an overlapping `start`.
- **Approach:** Detached process only. Stop, install, recycle the tray host so it loads the new script, start once, wait healthy/green, then write `tray-command.json` restart. No `finally` start. Serve invoker already skips popup; stop already kills the serve `wscript`.
- **Evidence:** Pending `implementation-evidence/task-2-2c-raw.json` from the detached runner.
- **Outcome:** Attempt started. This attached session must not invoke stop/restart/install.
- **Reason:** Installed controller hash differs from repository source. Prior 2.2b failed because `restoreStart` raced Restart.
- **Do-not-repeat condition:** Do not invoke workstation stop/restart/install from a session attached to `127.0.0.1:4096`. Do not start a second controller while Restart is in flight.
- **Evidence-based retry condition:** If 2.2c is not `ok`, inspect its raw bundle before another detached attempt and change the causal mechanism.

## 2026-08-24 - 2.2c stop timed out

- **Objective:** Inspect the pending detached 2.2c bundle and stop repeating the same stop path.
- **Approach:** Read `task-2-2c-raw.json` only. Do not invoke stop/restart/install from this attached session.
- **Evidence:** `ok=false`, `stop.error=spawnSync node.exe ETIMEDOUT`, `stop.status=null`, repair/Restart never ran. Installed candidate stayed `db50301a…`; repository source is `A8B14B28…`.
- **Outcome:** Task 2.2 remains incomplete. Live-attempt gate for attached or same spawnSync stop is blocked.
- **Reason:** The detached runner used spawnSync against the live managed server and hit the same class of hang as an in-session stop.
- **Do-not-repeat condition:** Do not invoke workstation stop/restart/install from a session attached to `127.0.0.1:4096`. Do not rerun 2.2c spawnSync stop unchanged.
- **Evidence-based retry condition:** A detached runner that does not use unbounded spawnSync stop: record PIDs, terminate only validated identities with a finite per-PID wait, then install/start/tray Restart.

## 2026-08-24 - Detached per-PID stop then tray Restart

- **Objective:** Repair ProgramData and prove one tray Restart without `controller stop` spawnSync.
- **Approach:** Detached `task-2-2d-per-pid.ts`: finite `taskkill /PID /F` of recorded server-root, listener, supervisor; kill serve `wscript`; install; recycle tray; start once; write `tray-command.json` restart. No attached-session stop. No `finally` start.
- **Evidence:** Pending `implementation-evidence/task-2-2d-raw.json`.
- **Outcome:** Attempt started. This attached session will drop when 4096 is replaced.
- **Reason:** 2.2c hung inside repository `stop`. Per-PID kill is the distinct mechanism required by the prior retry condition.
- **Do-not-repeat condition:** Do not invoke workstation stop/restart/install from a session attached to `127.0.0.1:4096`. Do not rerun 2.2c spawnSync stop.
- **Evidence-based retry condition:** If 2.2d is not `ok`, inspect its raw bundle before another detached attempt and change the causal mechanism.

## 2026-08-24 - 2.2d install refused Graphify whole-file hash

- **Objective:** Inspect why the tray stayed dark after detached per-PID stop.
- **Approach:** Read `task-2-2d-raw.json` and current `status`. Do not invoke stop/restart/install from this attached session.
- **Evidence:** PIDs stopped, port 4096 gone. `install` exited 1: `Managed Graphify configuration drifted`. Manifest pinned `global/opencode.json` sha `f39dcd36…`; current file is `0934E121…`. Restart command was never written, so the tray could not blink. Operator recovered with a manual tray Restart. Installed controller hash remains `03358B50…` vs repo `A8B14B28…`. Server is healthy again.
- **Outcome:** Per-PID stop worked. Repair did not land. Task 2.2 incomplete. Whole-file Graphify hash is too coarse for kit `opencode.json` edits.
- **Reason:** Schema v2 repair compared the entire config file to the install-time hash. Unrelated kit config changes look like Graphify drift and block controller/tray repair. After refuse, nothing started the server.
- **Do-not-repeat condition:** Do not rerun 2.2d unchanged. Do not treat whole-file `opencode.json` inequality as Graphify stanza failure. Do not invoke stop/install from a session attached to 4096.
- **Evidence-based retry condition:** Repair only after `planGraphifyConfigEdit` confirms the Graphify MCP entry is still valid, then one detached install/start/tray Restart.

## 2026-08-24 - Detached 2.2e after Graphify repair refresh

- **Objective:** Repair ProgramData with the new Graphify refresh and prove one tray Restart.
- **Approach:** Same per-PID stop as 2.2d, then repository `install` that re-plans Graphify instead of whole-file hash, start once, `tray-command.json` restart. Evidence: `task-2-2e-raw.json`.
- **Evidence:** Pending detached bundle.
- **Outcome:** Attempt started. This attached session will drop.
- **Reason:** 2.2d stop worked; install is the remaining causal defect and is now changed in source.
- **Do-not-repeat condition:** Do not invoke stop/install from this attached session. Do not rerun 2.2d unchanged.
- **Evidence-based retry condition:** If 2.2e is not `ok`, inspect its raw bundle before another detached attempt.

## 2026-08-24 - 2.2e install still required a local Graphify stanza

- **Objective:** Inspect why detached 2.2e repair refused.
- **Approach:** Read `task-2-2e-raw.json` and live `mcp.graphify-global` keys only. Do not invoke stop/install/restart from this attached session.
- **Evidence:** `ok=false`, `install exited 1`, cause `Local graphify-global entry must contain exactly: command, cwd, enabled, environment, timeout, type.` Per-PID stop and port-gone succeeded. Live entry is already `remote` with exact keys `enabled, headers, oauth, timeout, type, url`; url and `{env:OPENCODE_GRAPHIFY_API_KEY}` header match. Installed controller hash remains `03358B50…`.
- **Outcome:** Task 2.2 incomplete. Same `planGraphifyConfigEdit` refresh path is blocked.
- **Reason:** `refreshManagedGraphifyConfigEdit` called the first-install planner, which requires a local stanza. Post-install config is already the managed remote entry; unrelated kit file-hash drift is not Graphify drift.
- **Do-not-repeat condition:** Do not call `planGraphifyConfigEdit` to refresh an already-managed remote Graphify entry. Do not rerun 2.2e unchanged. Do not invoke stop/install/restart from a session attached to `127.0.0.1:4096`.
- **Evidence-based retry condition:** Repair only after an exported validator accepts a still-valid remote or local Graphify entry, an offline fixture-plus-live-config proof is green, then one detached per-PID install/start/tray Restart.

## 2026-08-24 - Detached 2.2f after remote Graphify refresh

- **Objective:** Repair ProgramData and prove one tray Restart after accepting a still-valid remote Graphify entry.
- **Approach:** `assertReusableGraphifyConfig` accepts exact remote or local entries. Offline `task-2-2-graphify-refresh.ts` must pass. Then detached `task-2-2f-per-pid.ts` with the same per-PID stop as 2.2d/2.2e, install, tray recycle, start once, `tray-command.json` restart. No attached-session stop. No `finally` start.
- **Evidence:** Pending `implementation-evidence/task-2-2f-raw.json`.
- **Outcome:** Attempt prepared. This attached session will drop when 4096 is replaced.
- **Reason:** 2.2e stop worked; install refused because refresh required the pre-install local shape.
- **Do-not-repeat condition:** Do not invoke stop/install/restart from this attached session. Do not rerun 2.2e unchanged.
- **Evidence-based retry condition:** If 2.2f is not `ok`, inspect its raw bundle before another detached attempt and change the causal mechanism.

## 2026-08-24 - 2.2f left the operator to restart

- **Objective:** Inspect 2.2f and stop leaving a down server for the operator.
- **Approach:** Read `task-2-2f-raw.json` and current `status` only. Start the tray host if needed. Do not invoke stop/install/restart from this attached session.
- **Evidence:** `ok=false`, `port 4096 still listening after per-pid stop`. Install/start/tray Restart never ran. Installed controller stayed `03358B50…`. No `finally` restore. Operator had to click tray Restart. Current status is healthy after that manual Restart.
- **Outcome:** Task 2.2 incomplete. Same no-restore runner is blocked.
- **Reason:** After recorded PIDs died a leftover listener kept 4096; the runner aborted without `start` or tray restore. Killing this session's listener without bringing a healthy server back is operator-facing downtime.
- **Do-not-repeat condition:** Do not exit a detached repair after stop unless `start` plus tray host have restored a healthy green server, or an unmatched leftover still owns 4096 and was recorded. Do not rerun 2.2f unchanged.
- **Evidence-based retry condition:** A detached runner that stops the tray first, collects leftover 4096 owners, installs only when both managed ports are free, and in `finally` starts tray plus controller `start` whenever health is not already proven.

## 2026-08-24 - Detached 2.2g with mandatory restore

- **Objective:** Repair ProgramData, prove one tray Restart, and never leave the operator to restart the server.
- **Approach:** Detached `task-2-2g-restore.ts`: stop tray first; per-PID stop; collect leftover 4096 owners; install only if ports are free; start tray; start; one `tray-command.json` restart; `finally` start tray plus `start` if not healthy.
- **Evidence:** Pending `implementation-evidence/task-2-2g-raw.json`.
- **Outcome:** Attempt prepared. This attached session will drop; the runner must bring the server back.
- **Reason:** 2.2f's missing restore is the operator-facing defect, not another Graphify planner failure.
- **Do-not-repeat condition:** Do not invoke stop/install/restart from this attached session. Do not rerun 2.2f unchanged.
- **Evidence-based retry condition:** If 2.2g is not `ok`, inspect its raw bundle and restore result before another detached attempt.

## 2026-08-25 - 2.2g stopped identities but not the scheduled task

- **Objective:** Classify the retained 2.2g terminal result before another host mutation.
- **Approach:** Read `implementation-evidence/task-2-2g-raw.json`, recheck current health/elevation/source hashes, and rerun only effect-free source `preflight`/`status`.
- **Evidence:** 2.2g stopped the recorded OpenCode identities, but a dead-owner `4096` listener row remained for 20 seconds, the server task was `Ready`, install never ran, and restore `start` refused the degraded state. Current installed status is healthy only after operator recovery; installed controller hash `03358B50...` differs from repository source. Current elevation is high integrity. Repository preflight initially rejected the already-managed remote Graphify stanza.
- **Outcome:** 2.2g is terminal failed; task 2.2 remains incomplete. Its no-task-stop mechanism is blocked.
- **Reason:** Manual per-PID termination did not stop the scheduled task before its action/tree changed, and the raw listener-row oracle remained occupied after the recorded owner disappeared.
- **Do-not-repeat condition:** Do not rerun 2.2g, invoke attached-session stop/install/restart, or treat a dead-owner TCP row as authorization to kill another process.
- **Evidence-based retry condition:** First make preflight accept a semantically valid managed remote Graphify entry; then use one detached runner that validates all recorded OpenCode and Graphify identities, stops the tray and server scheduled tasks before targeted `/PID /F` termination, waits for both raw managed-port rows to clear, repairs, starts, and performs one tray Restart with mandatory restore.

## 2026-08-25 - Detached 2.2h task-first repair

- **Objective:** Repair the installed controller and prove one tray Restart without depending on the attached `4096` session.
- **Approach:** Correct repository preflight to reuse `refreshManagedGraphifyConfigEdit` with exact path validation. Prepare `implementation-evidence/task-2-2h-task-first.ts`: after a detached delay, validate supervisor/server/listener/Graphify CIM identities, stop both scheduled tasks first, terminate only validated PIDs without `/T`, wait for raw `4096`/`4097` rows to clear, install, start tray/server, issue one tray command, and restore in `finally` if health is absent.
- **Evidence:** Repository `node --check` passes; focused workstation-config tests pass 7; repository `preflight` now exits 0 with `already-managed` remote projection; current status is healthy and elevated; repository and installed hashes remain distinct before launch.
- **Outcome:** Attempt prepared. The attached session may disconnect while the detached runner replaces `4096`.
- **Reason:** This changes the causal mechanism at the scheduled-task boundary and includes both managed ports and all recorded identities.
- **Do-not-repeat condition:** Do not run 2.2h in the attached process, launch a second writer while it is live, or continue qualification until its detached PID is terminal and raw restore state is inspected.
- **Evidence-based retry condition:** If the terminal bundle is not `ok`, preserve it, verify detached liveness/cleanup, and change only the failing phase before another governed host attempt.

## 2026-08-25 - 2.2h repaired the controller but start failed

- **Objective:** Classify the terminal 2.2h result and preserve the failed live-attempt boundary before any further host mutation.
- **Approach:** Confirm the detached writer is terminal, compare repository and installed controller hashes, inspect the retained raw bundle and current task/port/health state, then replay the start and restore evidence offline.
- **Evidence:** Detached writer PID `2332` is gone. `task-2-2h-raw.json` records task-first termination and successful install. Repository and installed controller hashes both equal `CA05334E6D5D610ACA84BC1AC20CFA07BD9E573101A5E3A2FCDA4540B4109A99`. The server task is `Ready` with `LastTaskResult=1`; ports `4096` and `4097` have no live listener; installed `status` is not healthy; `server-state.json` remains `exited`; tray host PID `11812` remains from the prior interactive session.
- **Outcome:** Failed. The protected repair landed, but start and mandatory restore did not leave a healthy server. Task 2.2 remains incomplete and the live-attempt gate is blocked.
- **Reason:** The task-first mechanism cleared the managed identities and ports, but the repaired scheduled serve action exited `1`. The retained start/restore fields and post-repair diagnostics have not yet been replayed to a terminal cause.
- **Do-not-repeat condition:** Do not rerun 2.2h, invoke attached-session stop/install/start/restart, launch another ProgramData writer, or kill tray PID `11812` without fresh identity validation while the start failure is unnamed.
- **Evidence-based retry condition:** Replay all reachable non-side-effecting start/restore evidence from `task-2-2h-raw.json`, `controller-errors.log`, task state, and the current `serve()`/`startServerTask()` path. If the preserved sources cannot name the cause, the next live invocation is one bounded diagnostic capture, not a Restart proof.

## 2026-08-25 - 2.2h offline replay named the missing installed module

- **Objective:** Name the exact scheduled-task result `1` cause and define the smallest causally distinct recovery/proof path.
- **Approach:** Correlate the raw start/restore payloads, task timestamps, unchanged server/Graphify logs, stale `server-state.json`, installed invoker command, and the exact installed Bun/controller `--help` import boundary.
- **Evidence:** The 16:31:56 scheduled action produced no fresh `starting` state and did not truncate the old service logs, so repaired `serve()` never ran. Exact invocation `bun.exe C:\ProgramData\OpenCodeWorkstation\opencode-workstation.ts --help` exits `1` with `Cannot find module './opencode-workstation-config.ts'`; repository `--help` exits `0`. The installer copied `opencode-workstation.ts` and `opencode-shared-tools.ts` but omitted their static relative dependency `opencode-workstation-config.ts`. Source now includes that module in the protected copy/hash/manifest/rollback transaction and lifecycle integrity checks; `node --check` and focused workstation-config tests pass.
- **Outcome:** Terminal offline verdict reached. The failed lane is Product Candidate packaging, not task launch, Graphify readiness, or port ownership. The live-attempt gate is clear only for the causally distinct repair/start/tray lane below.
- **Reason:** Bun failed module loading before controller `main()`, explaining the generic task result, absent controller error row, unchanged logs, and stale state. `2.2h` also started the tray and an explicit controller Start concurrently even though tray startup already invokes Start.
- **Do-not-repeat condition:** Do not rerun 2.2h, omit a static protected-controller dependency, run a second explicit Start beside tray startup, or kill the stale tray host without fresh executable/command/creation validation.
- **Evidence-based retry condition:** One detached `2.2i` may run after re-verifying elevation, free managed ports, terminal prior writers, and the stale tray identity. It must repair the three-file protected package, prove installed `--help`, recycle only the validated tray host, let the fresh tray perform initial Start, request exactly one tray Restart, and retain mandatory restore evidence.

## 2026-08-25 - 2.2i repaired the complete package and one tray Restart worked

- **Objective:** Repair the omitted static module without repeating 2.2h's duplicate Start and prove one loaded tray Restart end to end.
- **Approach:** Launch one detached writer after proving elevation, prior-writer termination, task readiness, free managed ports, and the exact stale tray identity. Stop only the two managed tasks, terminate only exact tray PID `11812`, repair the three-file protected package, prove installed `--help`, let one fresh tray perform initial Start, then write one Restart request through that loaded tray.
- **Evidence:** `implementation-evidence/task-2-2i-raw.json` is terminal with `ok: true`. Manifest and installed hashes match for controller `2A7E...A469F`, shared tools `7299...F0C9`, and configuration module `E7ED...F557`; installed `--help` exits `0`. Fresh tray PID `7456` restored green authenticated health. Restarting was observed; supervisor `6412 -> 14892`, server root `13800 -> 3396`, listener `9972 -> 8992`, and Graphify identities were replaced. The lamp returned green, no new restart error appeared, and mandatory restore was skipped because health was already restored. A subsequent installed `status` reports integrity `complete`, both tasks running, and authenticated OpenCode/Graphify health.
- **Outcome:** Task 2.2 passed for candidate `9f5dfb841e453fa385bf5f59543b3e466f3bcdd5ce2f999d0fd8d4cfe3db9630`; the accepted outcome is proven on the tray happy path but tasks 3.1, 3.2, and qualification remain.
- **Reason:** Packaging the complete static module set allowed scheduled `serve()` to load; using tray startup as the sole initial Start removed the duplicate-controller race.
- **Do-not-repeat condition:** Do not rerun 2.2i or launch another writer against this healthy candidate. Do not treat the launcher shell timeout as writer failure; PID `14868` was later proved terminal and its raw bundle complete.
- **Evidence-based retry condition:** None for 2.2. Continue only through the distinct, task-scoped unmatched-listener and Desktop surfaces, preserving one healthy server after each.

## 2026-08-25 - 3.1 bounded unmatched-listener strategy

- **Objective:** Prove the loaded tray/controller refuses an unmatched `4096` owner without terminating it, reports a secret-free ownership failure, and remains recoverable.
- **Approach:** In one detached elevated runner, capture and validate the healthy managed process identities, terminate only the current exact managed OpenCode listener, and immediately bind the writer itself as a disposable Bun loopback listener on `4096`. Request one tray Restart and require restarting/red observations, a new ownership-related restart error, and the same disposable PID still owning `4096`. Then release that socket, stop the scheduled server task, terminate only captured identities that still match PID/parent/creation/executable evidence, and request one later tray Restart to restore green authenticated health.
- **Evidence:** Pending `implementation-evidence/task-3-1-raw.json`; launch is forbidden until syntax, elevated-token, prior-writer, current-health, exact-identity, and port preflights pass.
- **Outcome:** Planned; no live mutation in this history entry.
- **Reason:** A second listener cannot coexist on Windows, while a post-stop `exited` state would test only state rejection. Replacing the exact listener while the managed tree/state is still present reaches the installed ownership validation and directly proves the unmatched owner is not killed.
- **Do-not-repeat condition:** Do not bind any process other than the single writer; do not use `/T`; do not kill a drifted captured PID; do not start replacement service while any unmatched owner remains; do not continue to Desktop proof unless recovery is healthy and this writer is terminal.
- **Evidence-based retry condition:** If the writer cannot acquire `4096` before the managed root changes state, preserve that terminal observation, perform exact cleanup/restore, and diagnose offline; do not repeat the same race unchanged.

## 2026-08-25 - 3.1 execution-safety review reopened the happy-path candidate

- **Objective:** Disposition fresh execution-safety review `ses_fc6b9ef89ffe0CIA6zXCHsEBdH` before any unmatched-listener mutation.
- **Approach:** Reproduce every reviewer row against the pending runner and owning controller branch; correct confirmed runner defects locally and correct the one confirmed production/spec defect before host proof.
- **Evidence:** Reviewer inspected candidate `9f5dfb...` with Effective Model `xai/grok-4.6` and reported `ES-3-1-01..05`. Main confirmed cleanup released the disposable bind before stopping the old tree, Bun/final-owner preflight was missing, mutation gating preceded kill authorization, and persistence did not redact copied errors. Those runner paths now hold the bind until captured cleanup, preflight Bun and the final listener identity, mark mutation at kill issue, and redact protected credential values during serialization. Main also confirmed `validateManagedStopState()` called `requireMatchingListener()` on a dead recorded listener before evaluating the current owner, violating the exact ownership-diagnostic and already-exited requirements. The running-state branch now treats a dead validated listener as gone, rejects any current owner not parented by the validated server root with `Current port owner does not match...`, adopts only a replacement child of that root, and still rejects a live recorded listener that no longer owns the port.
- **Outcome:** Prior `2.2i` remains retained but no longer proves the corrected source candidate. Task 2.2 is reopened. No 3.1 live mutation occurred.
- **Reason:** Runtime proof is candidate-specific; the smallest spec-required source correction changes the protected controller hash and must regain package repair and tray happy-path proof before failure injection.
- **Do-not-repeat condition:** Do not launch the pre-review 3.1 runner, attribute `2.2i` to the corrected candidate, release the writer-owned port before captured-tree cleanup, or persist raw protected values.
- **Evidence-based retry condition:** Run syntax/focused checks, one detached maintained stopped-repair proof into a new evidence directory, and one distinct loaded tray Restart for the resulting candidate. Only a healthy terminal result unlocks corrected 3.1.

## 2026-08-25 - 2.2j maintained repair produced the corrected healthy package

- **Objective:** Repair and restore the post-review source candidate using the repository-maintained detached proof instead of another custom installer.
- **Approach:** Launch `tools/proofs/opencode-workstation-install.ts` once into create-new `implementation-evidence/task-2-2j-install`, wait for writer PID `11052` to terminate, then replay its evaluator offline when the original result contradicted raw health/hash facts.
- **Evidence:** Writer PID `11052` is terminal. Raw stop/install/start exit codes are `0`; installed controller hash is `866FE663DB55CF1A8CA4A033A5C9676918568DA23509EBA8F9583769F0D79575`; all three manifest module hashes are present; candidate `6d8b72647f67cb1eae5bd4b16667affe0b71a82be1ffdce8bb04c9e426a1dc0e` has one OpenCode and one Graphify listener with authenticated composite health and `secretSafe: true`. The original evaluator's sole false check compared lowercase observed config digest `0934e1...` to uppercase manifest digest `0934E1...`. The proof now compares digests case-insensitively; `--replay-raw` against the preserved raw returns `passed: true` for every check and is retained as `evaluation-replay.json`. No live repair was repeated.
- **Outcome:** Corrected package repair/start is proven. The installer reset tray task registration to `Ready` while the one prior exact tray PID `7456` remained loaded, so task 2.2 still requires a targeted tray recycle and one loaded Restart for candidate `6d8b726...`.
- **Reason:** Hash text case is not a configuration-integrity difference; offline evaluator correction resolves the contradictory proof without another governed attempt.
- **Do-not-repeat condition:** Do not rerun the live maintained repair, use the original false evaluation as a product-failure claim, kill tray processes by substring, or launch tray proof before PID `11052` is terminal.
- **Evidence-based retry condition:** One detached tray-only runner may recycle exact manifest-matching PID `7456`, start the registered tray task, and request one Restart. It must leave both tasks running, one green tray, authenticated health, changed managed identities, and no new restart error.

## 2026-08-25 - 2.2j tray passed; deterministic non-running ownership diagnostic added

- **Objective:** Regain tray happy-path proof after the review correction, then close the last deterministic branch needed by the pending unmatched-listener proof.
- **Approach:** Recycle only exact tray PID `7456`, start the registered tray task, request one loaded Restart, and inspect the resulting task/lamp/identity/error state. Before launching 3.1, trace the alternate timing where listener loss makes persisted state terminal before the tray controller observes the disposable owner.
- **Evidence:** Terminal writer PID `12548` produced `task-2-2j-tray-restart-raw.json` with `ok: true`. Fresh tray PID `15112` loaded; candidate `6d8b726...` Restart changed supervisor `15556 -> 16340`, server root `14616 -> 4448`, listener `11548 -> 11820`, and both Graphify identities; restarting and green were observed, both tasks are Running, and no restart error appeared. Static timing review then found that `validateManagedStopState()` still reported only `Managed server state is 'exited'` when a live unmatched owner existed after the managed state became terminal. The invalid-state branch now checks current OpenCode/Graphify listeners first and reports the specific ownership mismatch without destructive action.
- **Outcome:** `2.2j` proves its candidate but the final source changed once more to make 3.1 deterministic. Task 2.2 remains reopened until one final repair/restart pair proves that source.
- **Reason:** The unrelated-listener requirement applies regardless of whether supervisor state is still running or has already reached terminal state; any live owner in the latter case is necessarily unauthorized for termination/replacement.
- **Do-not-repeat condition:** Do not rerun the `2.2j` default evidence path, attribute its PIDs to the final source, or inject the failure while source/installed/manifest hashes differ.
- **Evidence-based retry condition:** Reuse the maintained detached install proof once into create-new `task-2-2k-install`, replay its corrected evaluator, then reuse the reviewed tray runner with a create-new `task-2-2k-tray-restart-raw.json`. A terminal healthy result unlocks 3.1.

## 2026-08-25 - 2.2k exposed a three-second false startup timeout

- **Objective:** Prove the final ownership-diagnostic candidate through maintained repair and one tray Restart.
- **Approach:** Run create-new maintained install writer PID `11132`, then create-new tray writer PID `8728`, with no source mutation between them.
- **Evidence:** `task-2-2k-install/evaluation.json` passes all checks and installed candidate `d3a150cf97017030715c06391421cd15628b6c6e7ea45e39079ab9e451deaf50`. Tray Restart replaced all managed identities, but `task-2-2k-tray-restart-raw.json` is terminal `ok: false`: controller error cause was state `starting` at the fixed 60-second `waitForValidatedRunningState()` deadline. Scheduled task start was `17:48:49`; restart error log write was `17:49:55`; the same replacement wrote healthy running state at `17:49:58`. The runner's bounded recovery recycled only exact tray PID `13248` and left candidate `d3a150cf...` healthy, green, with both tasks Running.
- **Outcome:** Product Candidate false-negative outcome defect confirmed. Host is restored. Live-attempt gate is clear only for the causally distinct deadline correction and a new candidate; 2.2k must not be repeated.
- **Reason:** Sequential Graphify plus OpenCode readiness took about 70 seconds after task launch, exceeding the controller's 60-second validated-running wait by about three seconds while remaining within the outer proof envelope.
- **Do-not-repeat condition:** Do not rerun 2.2k, increase only the proof timeout, treat the later health as success for the operator attempt, or proceed to 3.1/3.2 while tray Restart still reports this false failure.
- **Evidence-based retry condition:** Change only the owning validated-running default to 120 seconds, preserving all identity/listener/health checks; run syntax/focused checks; repair once under a new candidate; then one create-new tray Restart must complete without the error or recovery path.

## 2026-08-25 - 2.2l tray preflight observed a transient state-file read

- **Objective:** Prove repaired candidate `501a741dad248753b58b442343d64970cc3fb0233bcf19fc7ffd0260bf0f21f9` after its maintained install passed every check.
- **Approach:** Launch create-new tray writer PID `2208` after source/installed/manifest hashes and host health matched.
- **Evidence:** `task-2-2l-tray-restart-raw.json` is terminal with `ok: false`, `Unexpected EOF`, and `restore: preflight-failed-before-mutation`. The runner recorded package identity but no `before`, tray stop, command write, or other mutation field. Current candidate and healthy host were unchanged. The read occurred while tray/server state files can be atomically replaced by the healthy runtime.
- **Outcome:** Proof Runner preflight defect; not Product Candidate failure and not a live product attempt. Host remains healthy. Exact missing observation identified.
- **Reason:** `serverHealthy()` called an unguarded JSON read once during preflight, while later wait loops already tolerate transient atomic replacement reads.
- **Do-not-repeat condition:** Do not rerun 2.2l unchanged, reinstall the unchanged candidate, or interpret the parse error as runtime health failure.
- **Evidence-based retry condition:** Make `identities()` return an unknown snapshot on transient parse failure, use bounded health preflight, and retry task metadata reads. Then run one create-new `2.2m` tray proof against unchanged candidate `501a741d...`.

## 2026-08-25 - 2.2m final candidate tray Restart passed

- **Objective:** Prove candidate `501a741dad248753b58b442343d64970cc3fb0233bcf19fc7ffd0260bf0f21f9` after correcting only the transient proof preflight.
- **Approach:** Launch create-new detached tray writer PID `2076` against the unchanged installed/source/manifest controller hash `2DAFD9...333EC`, recycle only exact tray PID `13308`, and request one loaded tray Restart.
- **Evidence:** PID `2076` is terminal and `task-2-2m-tray-restart-raw.json` has `ok: true`. Bounded preflight reached health; fresh tray PID `6744` loaded; restarting was observed. Restart completed without error, changed supervisor `5184 -> 7172`, server root `14596 -> 11800`, listener `6212 -> 10300`, Graphify root `3480 -> 12532`, and Graphify listener `6604 -> 10356`; lamp is green and both tasks are Running. Final health/green checks were immediately satisfied without a recovery lifecycle action.
- **Outcome:** Task 2.2 passed for the final candidate. The 120-second owning validated-running deadline closed the reproduced false failure; 3.1 is unlocked.
- **Reason:** Current sequential Graphify/OpenCode startup is valid but can exceed 60 seconds; the controller now waits through the observed startup while retaining all identity and health predicates.
- **Do-not-repeat condition:** Do not rerun 2.2m, modify production before 3.1 without reopening task 2.2, or start another writer before PID `2076` is terminal.
- **Evidence-based retry condition:** None for 2.2. Continue through the distinct reviewed 3.1 lane only after rechecking final candidate identity, current health, exact managed identities, and create-new evidence.

## 2026-08-25 - 3.1 direct-listener replacement lost the bind race

- **Objective:** Prove final candidate fail-closed behavior with a writer-owned disposable `4096` listener.
- **Approach:** Launch detached writer PID `11568`, capture exact healthy managed identities, issue targeted non-tree termination of listener PID `10300`, and bind Bun immediately before requesting tray Restart.
- **Evidence:** `task-3-1-raw.json` is terminal `ok: false`. Exact failure is `Failed to start server. Is port 4096 in use?` immediately after `taskkill /PID 10300 /F` returned `0`; no disposable listener or tray Restart command was created. The exact PID still owning the port at that instant was not preserved, so the claim ceiling is only that listener release/rebind had not completed. Cleanup stopped the task, found every captured identity already gone, proved both ports free, and used one tray Restart to restore candidate `501a741d...` healthy and green with both tasks Running and no restore error.
- **Outcome:** Proof Runner race; task 3.1 remains open. Host restored. Live-attempt gate is clear only for the causally distinct whole-tree-stop mechanism below, not another direct-listener replacement.
- **Reason:** A successful targeted process termination does not guarantee immediate exclusive bind availability, and the managed root may still be exiting or rebinding during that gap.
- **Do-not-repeat condition:** Do not rerun direct listener kill followed by immediate bind, infer the missing owner PID, or launch another writer before PID `11568` is terminal.
- **Evidence-based retry condition:** Use the installed candidate's already-proven ownership-safe Stop to terminate the complete validated managed tree; require task non-running and both ports empty; only then bind the writer, request one tray Restart, require refusal while the writer remains sole owner, release it, and restore through one later tray Restart under create-new `task-3-1b-raw.json`.

## 2026-08-25 - 3.1b proved fail-closed safety but exposed diagnostic ordering

- **Objective:** Reach the unrelated-owner branch without the direct-listener bind race and prove no unauthorized termination/replacement.
- **Approach:** Writer PID `13388` used installed Stop to terminate the exact validated tree, proved both ports free, became the sole disposable `4096` owner, then requested one tray Restart.
- **Evidence:** `task-3-1b-raw.json` is terminal. Installed Stop exited `0` and named only the captured managed PIDs. Restarting and red failure were observed; writer PID `13388` remained alive and sole owner of `4096`; both credential-disclosure booleans are false. Cleanup released the writer, proved both ports free, and restored candidate `501a741d...` healthy/green with both tasks Running and no restore error. The failure message was `Managed task is 'Ready', not Running.` rather than the required listener-ownership diagnostic, so `proofPassed` and `ok` are false.
- **Outcome:** Safety invariant passed, diagnostic requirement failed. Product Candidate defect confirmed. Host restored. Task 3.1 remains open and task 2.2 must be re-proven after the correction.
- **Reason:** `validateManagedStopState()` called `readManagedTaskState()` before its current-listener checks; that helper rejects any non-Running task before persisted state or port ownership can be classified.
- **Do-not-repeat condition:** Do not rerun 3.1b unchanged, weaken the oracle to accept a task-state message, or claim task-state alone gives the operator the listener conflict needed to resolve the port.
- **Evidence-based retry condition:** In `validateManagedStopState()`, first verify task identity; when the matched task is not Running, classify any current OpenCode/Graphify listener as an ownership mismatch before reporting task state. Re-run happy-path repair/Restart for the new candidate, then the same whole-tree-stop failure setup may run once under create-new evidence.

## 2026-08-25 - 2.2n restored final-candidate happy-path proof

- **Objective:** Re-prove package and tray happy path after the task-state/listener diagnostic ordering correction.
- **Approach:** Run maintained repair writer PID `11960`, then tray writer PID `692`, with no intervening production mutation.
- **Evidence:** Both writers are terminal. `task-2-2n-install/evaluation.json` passes every check for candidate `8e403f654255d4dc9e85f6d17b23613ecdc98a55ac8126c2bb83124f1a6f4dd9` and controller hash `57E009...A7DB1A`. `task-2-2n-tray-restart-raw.json` has `ok: true`: fresh tray PID `6532`, restarting observed, supervisor `14616 -> 13504`, server root `5892 -> 9140`, listener `1636 -> 7016`, lamp green, both tasks Running, and no restart error.
- **Outcome:** Task 2.2 passed for the current final candidate; 3.1c is unlocked.
- **Reason:** The diagnostic-order correction does not regress normal ownership-safe replacement or the extended valid-startup envelope.
- **Do-not-repeat condition:** Do not rerun 2.2n, modify production before 3.1c without reopening 2.2, or reuse prior 3.1 evidence paths.
- **Evidence-based retry condition:** One create-new `task-3-1c-raw.json` may execute the already-reviewed whole-tree-stop/disposable-owner setup. It must emit the listener-ownership message, preserve writer ownership, stay red, avoid credentials, and restore green health.

## 2026-08-25 - 3.1c unrelated listener failed closed and restored

- **Objective:** Prove the corrected final candidate refuses an unrelated `4096` owner with exact diagnostics and no unauthorized kill/replacement.
- **Approach:** Writer PID `14972` used installed Stop on the captured healthy tree, required both ports empty, bound itself as sole loopback owner, requested one tray Restart, then released itself and requested one later restore Restart only after both ports were empty.
- **Evidence:** `task-3-1c-raw.json` is terminal with `proofPassed: true`, `ok: true`. Installed Stop exited `0`, named only captured managed PIDs, and left zero listeners. Restarting and red failure were observed. The error is exactly `Current port owner does not match the managed listener identity.`; writer PID `14972` remained alive and sole owner; both credential disclosure flags are false. Cleanup found all prior captured identities gone, released the writer, proved both ports empty, then restored candidate `8e403f65...` with new supervisor/server/listener/Graphify identities, green lamp, both tasks Running, and no restore error.
- **Outcome:** Task 3.1 passed. No known unauthorized process termination or replacement occurred. Desktop surface 3.2 is unlocked.
- **Reason:** Task identity is now checked first, but a matched non-running task with a current managed-port owner is classified as an ownership conflict before state loading or destructive action.
- **Do-not-repeat condition:** Do not rerun 3.1c, leave a substitute listener bound, or broaden its exact process-termination authority.
- **Evidence-based retry condition:** None for 3.1. Continue with one create-new detached Desktop shortcut proof against the restored healthy candidate.

## 2026-08-25 - 3.2 bounded Desktop shortcut strategy

- **Objective:** Prove the installed Desktop `OpenCode Server - Restart.lnk` has the same one-attempt ownership-safe replacement contract as tray Restart.
- **Approach:** In one detached elevated runner, verify final package identity and authenticated health, inspect the `.lnk` COM projection against expected `wscript.exe`, `invoke.vbs restart`, and protected working directory, then invoke the actual shortcut once and wait for its process exit.
- **Evidence:** Pending create-new `implementation-evidence/task-3-2-raw.json` after syntax, shortcut, writer-terminal, current-health, and artifact preflights.
- **Outcome:** Planned; no Desktop invocation in this history entry.
- **Reason:** A successful `wscript` exit plus changed supervisor/server-root/listener identities, green authenticated health, and no restart error proves the Desktop surface. A failure dialog would keep the exact invoker process alive; timeout cleanup is authorized only by exact PID/executable/creation/command identity.
- **Do-not-repeat condition:** Do not invoke the shortcut attached, infer dialog absence from health alone, kill a drifted invoker PID, or launch another lifecycle writer while the Desktop invoker/controller is live.
- **Evidence-based retry condition:** One launch only after exact preflights. On timeout/failure, preserve the raw observation, close exact writer liveness, restore health if safe, and diagnose offline before any successor.

## 2026-08-25 - 3.2 Desktop shortcut Restart passed

- **Objective:** Prove the actual Desktop entry point matches the loaded tray ownership/replacement contract without a hidden failure dialog.
- **Approach:** Detached writer PID `14268` validated package and `.lnk` identity, invoked `OpenCode Server - Restart.lnk` once, waited for returned `wscript` process completion, then checked replacement, tasks, ports, lamp, health, and restart errors.
- **Evidence:** `task-3-2-raw.json` is terminal with `ok: true`. Shortcut target is `C:\Windows\System32\wscript.exe`, arguments are `//nologo C:\ProgramData\OpenCodeWorkstation\invoke.vbs restart`, and working directory is the protected root. Invoker PID `5560` exited `0` and no invoker remained. Supervisor `5848 -> 3296`, server root `9848 -> 7740`, listener `11320 -> 12584`, and both Graphify identities changed. Lamp is green, both tasks are Running, both ports have one expected listener, and no restart error was added.
- **Outcome:** Task 3.2 passed; tasks 2.2-3.2 complete accepted runtime scope for candidate `8e403f65...`.
- **Reason:** Desktop and tray both use the same protected invoker/controller path and now complete within the valid startup envelope.
- **Do-not-repeat condition:** Do not rerun the Desktop shortcut, infer another UI action is required, or mutate production before SDET/validation without reopening runtime proof.
- **Evidence-based retry condition:** None for 3.2. Continue to one fresh test-only SDET challenge with this exact candidate and evidence set.

## 2026-08-25 - fresh SDET returned no-critical-risk

- **Objective:** Independently challenge final candidate `8e403f65...` for reachable critical unauthorized-kill, replacement-while-owned, already-gone, starting-state, tray-failure, Desktop, and credential incidents.
- **Approach:** Fresh test-only SDET session `ses_fc66ca6c6ffeJiu5K9pnvzsQvO` (Effective Model `xai/grok-4.6`) reviewed final source/evidence and authored one offline extracted-function oracle. Its child shell was unavailable, so main ran the exact requested command, corrected one test-only mock contradiction, and resumed the same session with raw output.
- **Evidence:** Initial focused output passed four cases and failed only because simulated taskkill `128` kept PID `4242` in the mock alive set while expecting already-gone success. Main added only `alive.delete(4242)` for that simulated PID; PID `99` remains alive for the fail-closed assertion. `node --check tools/test-workstation-restart-critical.ts && node tools/run-focused-test.ts tools/test-workstation-restart-critical.ts` then exited `0` with `OK: workstation restart critical tests=5`. Same SDET session returned terminal `no-critical-risk`, no risk rows.
- **Outcome:** Task 4.1 passed; validation is unlocked. No production mutation occurred after runtime proof.
- **Reason:** Offline critical oracles and live final-candidate bundles jointly cover the enforced envelope; the only initial failure was internally contradictory test setup.
- **Do-not-repeat condition:** Do not rerun SDET for the unchanged candidate/hypotheses or represent mocked extraction as replacing live evidence.
- **Evidence-based retry condition:** None. Run task 4.2. Record non-critical limits: starting-state is source/offline tested rather than live injected; live 3.1c proves red failure/ownership refusal, while balloon rendering text is source-locked rather than UI-captured.

## 2026-08-25 - qualification validation passed

- **Objective:** Complete every named task 4.2 check against the unchanged final candidate and preserve the installed read-only observation without another lifecycle action.
- **Approach:** Run repository syntax, focused, full test, strict library, and strict OpenSpec checks. After the first tool shell proved medium-integrity, restart the session elevated and use one bounded runner for installed `--help`, `preflight`, and `status`; preserve the first omitted-config result and retry only with the configuration path already recorded in the protected manifest.
- **Evidence:** `node --check tools/windows/opencode-workstation.ts`, focused workstation config `7/7`, focused Restart `5/5`, full `npm test`, `npm run validate:strict` with zero warnings, and `npx openspec validate fix-workstation-restart-reliability --strict` all exit `0`. `task-4-2-installed-validation.json` records help/status success and preflight exit `1` because the runner omitted `--config`. `task-4-2-installed-validation-r2.json` records elevated execution, exact candidate `8e403f65...`, controller hash `57E009...A7DB1A`, all three commands exit `0`, integrity `complete`, both tasks Running, and `ok: true` when preflight uses `manifest.configuration.path`.
- **Outcome:** Task 4.2 passed. No production or installed-runtime mutation occurred; complete-archive synchronization is unlocked.
- **Reason:** A protected installed controller requires an elevated reader, and its preflight default is repository-local; the protected manifest already records the exact live configuration path for an explicit read-only preflight.
- **Do-not-repeat condition:** Do not infer elevation from Administrators membership, run installed preflight without its manifest configuration path, rerun host lifecycle proof, or rerun SDET for this unchanged candidate.
- **Evidence-based retry condition:** None for validation. Refresh the partial MODIFIED delta against the current dual-service base, materialize current task/evidence metadata, then use the deterministic archive helper.

## 2026-08-25 - archive validation required a TypeScript proof runner

- **Objective:** Preserve the successful installed validation while satisfying the repository's TypeScript-only tooling contract.
- **Approach:** Inspect the first canonical archive result before any retry. Move the read-only installed validator from PowerShell to TypeScript, add direct candidate/hash/dual-task checks, and run it once as create-new `r3`; then refresh only derived evidence metadata.
- **Evidence:** The canonical archive helper stopped before merge/move because `npm test` reported exactly one contract failure: non-TypeScript source/tooling file `implementation-evidence/task-4-2-installed-validation.ps1`. The TypeScript runner passes `node --check`; `task-4-2-installed-validation-r3.json` records all three installed commands exit `0`, elevated preflight, exact candidate/hash, complete integrity, both tasks Running, and `ok: true`.
- **Outcome:** Proof Runner defect corrected without production or installed-runtime mutation. The failed archive invocation is finalized with no archive side effect; deterministic archive retry is unlocked after index regeneration.
- **Reason:** Repository validation intentionally rejects PowerShell source/tooling even inside implementation evidence.
- **Do-not-repeat condition:** Do not restore the `.ps1`, omit the final proof runner from project-native validation, or treat the pre-merge archive failure as a product/runtime failure.
- **Evidence-based retry condition:** Re-run the same canonical archive helper only after task digests and retained-file hashes include the TypeScript runner and `r3` bundle.
