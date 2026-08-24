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
